"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../popups/pet_photo_tag.ts" />
//
// The photo library, shared by the photo booth and the picture book. BLoadLayout
// pet_photo_library.xml into an empty panel, then call Init with what that host wants switched on.
//
// The two are never open at the same time - the booth closes itself to open the book and back - so the
// state below can be module level.
//
var PetPhotoLibrary;
(function (PetPhotoLibrary) {
    // The list only builds panels for the rows on screen, so this array is the model and the panels are
    // a view onto it.
    let _m_aFiles = [];
    let _m_elList = null;
    let _m_elEmpty = null;
    let _m_opts = {};
    function Init(elRoot, opts) {
        _m_opts = opts;
        // FindChildInLayoutFile is scoped to the layout that declared the panel, so the host cannot
        // reach this and the reference has to be kept here.
        _m_elList = elRoot.FindChildTraverse('id-photo-library-list');
        _m_elEmpty = elRoot.FindChildTraverse('id-photo-library-empty');
        _m_elList.SetLoadListItemFunction((parent, nPanelIdx, reusePanel) => {
            let elItem = reusePanel;
            if (!elItem || !elItem.IsValid()) {
                elItem = _BuildRow();
            }
            _PointRowAt(elItem, _m_aFiles[nPanelIdx]);
            return elItem;
        });
    }
    PetPhotoLibrary.Init = Init;
    function _BuildRow() {
        // A Button when it has to take a click for the drag to start from; the booth's rows were Panels
        // and stay that way, so its hover and hit testing are unchanged.
        const elItem = $.CreatePanel(_m_opts.bDraggable ? 'Button' : 'Panel', _m_elList, '', { class: 'photo-library__item' });
        $.CreatePanel('Image', elItem, '', { scaling: 'stretch-to-fit-y-preserve-aspect', class: 'photo-library__image' });
        if (_m_opts.bDeletable) {
            const elDelete = $.CreatePanel('Button', elItem, '', { class: 'photo-library__delete-btn' });
            $.CreatePanel('Image', elDelete, '', { src: 'file://{images}/icons/ui/trash.svg', textureheight: '16', scaling: 'stretch-to-fit-preserve-aspect' });
        }
        if (_m_opts.bDraggable) {
            // Registered once per panel, NOT per load - RegisterEventHandler adds rather than replaces,
            // and rows are recycled as the list scrolls. The name is read off data-file at drag time.
            $.RegisterEventHandler('DragStart', elItem, _OnDragStart);
            $.RegisterEventHandler('DragEnd', elItem, _OnDragEnd);
        }
        return elItem;
    }
    // Rows are recycled, so everything a row knows about its photo is re-pointed on every load.
    function _PointRowAt(elItem, strFileName) {
        elItem.SetAttributeString('data-file', strFileName);
        const aImages = elItem.FindChildrenWithClassTraverse('photo-library__image');
        if (aImages.length > 0) {
            aImages[0].SetImageFromFile(PetPhotoTag.PhotoUrl(_m_strPetKey, strFileName));
        }
        // SetPanelEvent replaces rather than accumulates, so these are safe per load.
        elItem.SetPanelEvent('onactivate', () => { ShowViewer(strFileName); });
        elItem.SetPanelEvent('onmouseover', () => { _ShowSettings(elItem, strFileName); });
        elItem.SetPanelEvent('onmouseout', () => { UiToolkitAPI.HideTextTooltip(); });
        if (_m_opts.bDeletable) {
            const aDelete = elItem.FindChildrenWithClassTraverse('photo-library__delete-btn');
            if (aDelete.length > 0) {
                aDelete[0].SetPanelEvent('onactivate', () => { _ConfirmDelete(strFileName); });
            }
        }
        // Rows are recycled, so this is re-set per load rather than once in _BuildRow. The flag and the
        // class go together - the class is what makes a row nudge on hover, and that nudge is all that
        // says a row can be picked up.
        elItem.SetDraggable(!!_m_opts.bDraggable);
        elItem.SetHasClass('photo-library__item--draggable', !!_m_opts.bDraggable);
    }
    //----------------------------------------------------------------------------------
    // The model
    //----------------------------------------------------------------------------------
    // Which pet's roll is on screen. Its own folder, so this reads one bird and never another.
    let _m_strPetKey = '';
    function LoadFromDisk(strPetKey) {
        _m_strPetKey = strPetKey;
        // No pet means no folder to read - a pet is only on disk once it has been photographed.
        const aFiles = (strPetKey === '') ? [] :
            GameInterfaceAPI.FindFiles(PetPhotoTag.LibraryFolder(strPetKey) + '/*' + PetPhotoTag.EXT, 'USRLOCAL');
        aFiles.sort();
        aFiles.reverse();
        _m_aFiles = aFiles;
        Refresh();
    }
    PetPhotoLibrary.LoadFromDisk = LoadFromDisk;
    // Puts a just-taken photo at the top. Ignores one that is already listed.
    function Insert(strFileName) {
        if (strFileName === '' || _m_aFiles.indexOf(strFileName) >= 0) {
            return;
        }
        _m_aFiles.unshift(strFileName);
        Refresh();
    }
    PetPhotoLibrary.Insert = Insert;
    function Refresh() {
        if (!_m_elList) {
            return;
        }
        const bAny = _m_aFiles.length !== 0;
        _m_elList.visible = bAny;
        _m_elList.UpdateListItems(_m_aFiles.length);
        // An empty list is not the same thing as no photos, so the host's line goes in its place.
        if (_m_elEmpty) {
            const strEmpty = (!bAny && _m_opts.fnEmpty) ? _m_opts.fnEmpty() : '';
            _m_elEmpty.visible = strEmpty !== '';
            _m_elEmpty.text = strEmpty === '' ? '' : $.Localize(strEmpty);
        }
    }
    PetPhotoLibrary.Refresh = Refresh;
    //----------------------------------------------------------------------------------
    // Settings tooltip
    //----------------------------------------------------------------------------------
    // The settings are read off the name, so there is nothing to keep in step - hovering is what asks.
    // A name that describes to nothing gets no tooltip rather than an empty one.
    function _ShowSettings(elItem, strFileName) {
        const strSettings = PetPhotoTag.Describe(strFileName);
        if (strSettings !== '') {
            UiToolkitAPI.ShowTextTooltipOnPanelStyled(elItem, strSettings, 'tooltip-pet-photo-settings');
        }
    }
    //----------------------------------------------------------------------------------
    // The viewer
    //----------------------------------------------------------------------------------
    // The url draws the image, but the copy and folder buttons reach the photo through the filesystem
    // rather than through panorama, so they need it named the way g_pFullFileSystem takes it: a path
    // relative to a pathID. Both go over, so the viewer never has to turn one form into the other.
    function ShowViewer(strFileName) {
        const elMenu = UiToolkitAPI.ShowCustomLayoutContextMenuParameters('id-photo-library-list', '', 'file://{resources}/layout/context_menus/context_menu_photo_viewer.xml', 'src=' + PetPhotoTag.PhotoUrl(_m_strPetKey, strFileName) +
            '&' + 'path=' + PetPhotoTag.LibraryFolder(_m_strPetKey) + '/' + strFileName +
            '&' + 'pathid=USRLOCAL');
        elMenu.AddClass('ContextMenu_NoArrow');
    }
    PetPhotoLibrary.ShowViewer = ShowViewer;
    //----------------------------------------------------------------------------------
    // Deleting
    //----------------------------------------------------------------------------------
    // The one permanent delete in the whole feature. Only a photo in the camera roll has a row here to
    // press, so one on a page has to be taken off it first.
    function _ConfirmDelete(strFileName) {
        UiToolkitAPI.ShowGenericPopupYesNo('#pet_photo_library_delete_title', '#pet_photo_library_delete_desc', '', () => { _Delete(strFileName); }, () => { });
    }
    function _Delete(strFileName) {
        // the key and the name are all this side gets to say: DeletePetPhoto composes the path itself
        // and refuses anything that is not one of the booth's own screenshots
        if (!GameInterfaceAPI.DeletePetPhoto(_m_strPetKey, strFileName)) {
            return;
        }
        const nIndex = _m_aFiles.indexOf(strFileName);
        if (nIndex >= 0) {
            _m_aFiles.splice(nIndex, 1);
        }
        if (_m_opts.fnOnDeleted) {
            _m_opts.fnOnDeleted(strFileName);
        }
        Refresh();
    }
    //----------------------------------------------------------------------------------
    // Dragging out
    //----------------------------------------------------------------------------------
    function _OnDragStart(elRow, drag) {
        const strFileName = elRow.GetAttributeString('data-file', '');
        if (strFileName === '' || !_m_opts.fnOnDragStart) {
            return;
        }
        _m_opts.fnOnDragStart(strFileName, drag);
        // A drag does not reliably end the hover, and the drag image is what there is to look at.
        UiToolkitAPI.HideTextTooltip();
        // Scrolling the list and dragging out of it want the same movement, so the list stops taking
        // input for the duration - as loadout_grid does.
        SetTakesInput(false);
    }
    function _OnDragEnd() {
        if (_m_opts.fnOnDragEnd) {
            _m_opts.fnOnDragEnd();
        }
        SetTakesInput(true);
    }
    function SetTakesInput(bEnabled) {
        if (_m_elList) {
            _m_elList.hittest = bEnabled;
            _m_elList.hittestchildren = bEnabled;
        }
    }
    PetPhotoLibrary.SetTakesInput = SetTakesInput;
})(PetPhotoLibrary || (PetPhotoLibrary = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGV0X3Bob3RvX2xpYnJhcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcGV0X3Bob3RvX2xpYnJhcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyxtREFBbUQ7QUFFbkQsRUFBRTtBQUNGLGlGQUFpRjtBQUNqRixtR0FBbUc7QUFDbkcsRUFBRTtBQUNGLHVHQUF1RztBQUN2RyxtQ0FBbUM7QUFDbkMsRUFBRTtBQUNGLElBQVUsZUFBZSxDQTBSeEI7QUExUkQsV0FBVSxlQUFlO0lBc0J4QixvR0FBb0c7SUFDcEcsa0JBQWtCO0lBQ2xCLElBQUksU0FBUyxHQUFhLEVBQUUsQ0FBQztJQUM3QixJQUFJLFNBQVMsR0FBNkIsSUFBSSxDQUFDO0lBQy9DLElBQUksVUFBVSxHQUFtQixJQUFJLENBQUM7SUFDdEMsSUFBSSxPQUFPLEdBQWMsRUFBRSxDQUFDO0lBRTVCLFNBQWdCLElBQUksQ0FBRSxNQUFlLEVBQUUsSUFBZTtRQUVyRCxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBRWYsNEZBQTRGO1FBQzVGLG9EQUFvRDtRQUNwRCxTQUFTLEdBQUcsTUFBTSxDQUFDLGlCQUFpQixDQUFFLHVCQUF1QixDQUF1QixDQUFDO1FBQ3JGLFVBQVUsR0FBRyxNQUFNLENBQUMsaUJBQWlCLENBQUUsd0JBQXdCLENBQWEsQ0FBQztRQUU3RSxTQUFTLENBQUMsdUJBQXVCLENBQUUsQ0FBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRyxFQUFFO1lBRXRFLElBQUksTUFBTSxHQUFHLFVBQVUsQ0FBQztZQUN4QixJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxFQUNoQztnQkFDQyxNQUFNLEdBQUcsU0FBUyxFQUFFLENBQUM7YUFDckI7WUFFRCxXQUFXLENBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBRSxTQUFT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