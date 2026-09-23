"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../popups/pet_photo_tag.ts" />
var PetPhotoLibrary;
(function (PetPhotoLibrary) {
    let _m_aFiles = [];
    let _m_elList = null;
    let _m_elEmpty = null;
    let _m_opts = {};
    function Init(elRoot, opts) {
        _m_opts = opts;
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
        const elItem = $.CreatePanel(_m_opts.bDraggable ? 'Button' : 'Panel', _m_elList, '', { class: 'photo-library__item' });
        $.CreatePanel('Image', elItem, '', { scaling: 'stretch-to-fit-y-preserve-aspect', class: 'photo-library__image' });
        if (_m_opts.bDeletable) {
            const elDelete = $.CreatePanel('Button', elItem, '', { class: 'photo-library__delete-btn' });
            $.CreatePanel('Image', elDelete, '', { src: 'file://{images}/icons/ui/trash.svg', textureheight: '16', scaling: 'stretch-to-fit-preserve-aspect' });
        }
        if (_m_opts.bDraggable) {
            $.RegisterEventHandler('DragStart', elItem, _OnDragStart);
            $.RegisterEventHandler('DragEnd', elItem, _OnDragEnd);
        }
        return elItem;
    }
    function _PointRowAt(elItem, strFileName) {
        elItem.SetAttributeString('data-file', strFileName);
        const aImages = elItem.FindChildrenWithClassTraverse('photo-library__image');
        if (aImages.length > 0) {
            aImages[0].SetImageFromFile(PetPhotoTag.PhotoUrl(_m_strPetKey, strFileName));
        }
        elItem.SetPanelEvent('onactivate', () => { ShowViewer(strFileName); });
        elItem.SetPanelEvent('onmouseover', () => { _ShowSettings(elItem, strFileName); });
        elItem.SetPanelEvent('onmouseout', () => { UiToolkitAPI.HideTextTooltip(); });
        if (_m_opts.bDeletable) {
            const aDelete = elItem.FindChildrenWithClassTraverse('photo-library__delete-btn');
            if (aDelete.length > 0) {
                aDelete[0].SetPanelEvent('onactivate', () => { _ConfirmDelete(strFileName); });
            }
        }
        elItem.SetDraggable(!!_m_opts.bDraggable);
        elItem.SetHasClass('photo-library__item--draggable', !!_m_opts.bDraggable);
    }
    let _m_strPetKey = '';
    function LoadFromDisk(strPetKey) {
        _m_strPetKey = strPetKey;
        const aFiles = (strPetKey === '') ? [] :
            GameInterfaceAPI.FindFiles(PetPhotoTag.LibraryFolder(strPetKey) + '/*' + PetPhotoTag.EXT, 'USRLOCAL');
        aFiles.sort();
        aFiles.reverse();
        _m_aFiles = aFiles;
        Refresh();
    }
    PetPhotoLibrary.LoadFromDisk = LoadFromDisk;
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
        if (_m_elEmpty) {
            const strEmpty = (!bAny && _m_opts.fnEmpty) ? _m_opts.fnEmpty() : '';
            _m_elEmpty.visible = strEmpty !== '';
            _m_elEmpty.text = strEmpty === '' ? '' : $.Localize(strEmpty);
        }
    }
    PetPhotoLibrary.Refresh = Refresh;
    function _ShowSettings(elItem, strFileName) {
        const strSettings = PetPhotoTag.Describe(strFileName);
        if (strSettings !== '') {
            UiToolkitAPI.ShowTextTooltipOnPanelStyled(elItem, strSettings, 'tooltip-pet-photo-settings');
        }
    }
    function ShowViewer(strFileName) {
        const elMenu = UiToolkitAPI.ShowCustomLayoutContextMenuParameters('id-photo-library-list', '', 'file://{resources}/layout/context_menus/context_menu_photo_viewer.xml', 'src=' + PetPhotoTag.PhotoUrl(_m_strPetKey, strFileName) +
            '&' + 'path=' + PetPhotoTag.LibraryFolder(_m_strPetKey) + '/' + strFileName +
            '&' + 'pathid=USRLOCAL');
        elMenu.AddClass('ContextMenu_NoArrow');
    }
    PetPhotoLibrary.ShowViewer = ShowViewer;
    function _ConfirmDelete(strFileName) {
        UiToolkitAPI.ShowGenericPopupYesNo('#pet_photo_library_delete_title', '#pet_photo_library_delete_desc', '', () => { _Delete(strFileName); }, () => { });
    }
    function _Delete(strFileName) {
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
    function _OnDragStart(elRow, drag) {
        const strFileName = elRow.GetAttributeString('data-file', '');
        if (strFileName === '' || !_m_opts.fnOnDragStart) {
            return;
        }
        _m_opts.fnOnDragStart(strFileName, drag);
        UiToolkitAPI.HideTextTooltip();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGV0X3Bob3RvX2xpYnJhcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcGV0X3Bob3RvX2xpYnJhcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyxtREFBbUQ7QUFTbkQsSUFBVSxlQUFlLENBMFJ4QjtBQTFSRCxXQUFVLGVBQWU7SUF3QnhCLElBQUksU0FBUyxHQUFhLEVBQUUsQ0FBQztJQUM3QixJQUFJLFNBQVMsR0FBNkIsSUFBSSxDQUFDO0lBQy9DLElBQUksVUFBVSxHQUFtQixJQUFJLENBQUM7SUFDdEMsSUFBSSxPQUFPLEdBQWMsRUFBRSxDQUFDO0lBRTVCLFNBQWdCLElBQUksQ0FBRSxNQUFlLEVBQUUsSUFBZTtRQUVyRCxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBSWYsU0FBUyxHQUFHLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBRSx1QkFBdUIsQ0FBdUIsQ0FBQztRQUNyRixVQUFVLEdBQUcsTUFBTSxDQUFDLGlCQUFpQixDQUFFLHdCQUF3QixDQUFhLENBQUM7UUFFN0UsU0FBUyxDQUFDLHVCQUF1QixDQUFFLENBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUcsRUFBRTtZQUV0RSxJQUFJLE1BQU0sR0FBRyxVQUFVLENBQUM7WUFDeEIsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsRUFDaEM7Z0JBQ0MsTUFBTSxHQUFHLFNBQVMsRUFBRSxDQUFDO2FBQ3JCO1lBRUQsV0FBVyxDQUFFLE1BQU0sRUFBRSxTQUFTLENBQUUsU0FBUyxDQUFFLENBQUUsQ0FBQztZQUM5QyxPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUMsQ0FBRSxDQUFDO0lBQ0wsQ0FBQztJQXBCZSxvQkFBSSxPQW9CbkIsQ0FBQTtJQUVELFNBQVMsU0FBUztRQUlqQixNQUFNLE1BQU0sR0FBRyxDQUFDLENB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