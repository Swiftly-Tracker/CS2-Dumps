"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../popups/pet_photo_library.ts" />
/// <reference path="../popups/pet_photo_tag.ts" />
var PetBookPages;
(function (PetBookPages) {
    const _m_cp = $.GetContextPanel();
    const STAGE_EGG = 0;
    const STAGE_CHICK = 1;
    const STAGE_ADOLESCENT = 2;
    const STAGE_ADULT = 3;
    const NAME_PLACEHOLDER = $.Localize('#pet_book_name_placeholder');
    let _m_pet = { strId: '', strName: NAME_PLACEHOLDER, nStage: STAGE_EGG, rtHatch: 0, bookdata: {} };
    let _m_strBookKey = '';
    let _m_bHasLivePet = false;
    function _NewestBookOnDisk() {
        const aBooks = GameInterfaceAPI.GetPetBookCloudFileKeys();
        if (aBooks.length <= 0) {
            return '';
        }
        const petKey = GameInterfaceAPI.UnpackPetBookCloudFile(aBooks[aBooks.length - 1]);
        if (!petKey) {
            return '';
        }
        _m_pet = _ReadPet(petKey);
        return petKey;
    }
    function _ItemAttr(strId, strAttrName) {
        const value = Number(InventoryAPI.GetItemAttributeValue(strId, '{uint32}' + strAttrName));
        return isNaN(value) ? 0 : value;
    }
    function _ReadPet(strId) {
        if (!strId)
            strId = InventoryAPI.GetPetItemID();
        if (!strId) {
            return { strId: '', strName: NAME_PLACEHOLDER, nStage: STAGE_EGG, rtHatch: 0, bookdata: {} };
        }
        const nStage = _ItemAttr(strId, 'upgrade level');
        return {
            strId: strId,
            strName: _PetName(strId, nStage),
            nStage: nStage,
            rtHatch: _ItemAttr(strId, 'deployment date'),
            bookdata: {},
        };
    }
    function _PetName(strId, nStage) {
        if (nStage <= STAGE_EGG)
            return NAME_PLACEHOLDER;
        let nPreviousStage = nStage;
        while (nPreviousStage > 0) {
            const utf8name = InventoryAPI.GetItemAttributeValue(strId, '{bytestring}custom name attr'
                + ((nPreviousStage >= 2) ? ' ' + nPreviousStage : ''));
            if (utf8name)
                return utf8name;
            --nPreviousStage;
        }
        let nNextStage = nStage + 1;
        while (nNextStage <= 3) {
            const utf8name = InventoryAPI.GetItemAttributeValue(strId, '{bytestring}custom name attr'
                + ((nNextStage >= 2) ? ' ' + nNextStage : ''));
            if (utf8name)
                return utf8name;
            ++nNextStage;
        }
        return InventoryAPI.GetItemNameUncustomized(strId);
    }
    function _HatchDateText() {
        const rtHatch = _m_pet.rtHatch;
        if (!rtHatch) {
            return '';
        }
        const strDate = InventoryAPI.LocalizeRentalDate(rtHatch);
        if (_m_pet.nStage !== STAGE_EGG) {
            return strDate;
        }
        _m_cp.SetDialogVariable('hatch_day', strDate);
        return $.Localize('#pet_book_hatch_due', _m_cp);
    }
    function PetItemID() {
        return _m_pet.strId;
    }
    PetBookPages.PetItemID = PetItemID;
    function PetStage() {
        return _m_pet.nStage;
    }
    PetBookPages.PetStage = PetStage;
    function HasLivePet() {
        return _m_bHasLivePet;
    }
    PetBookPages.HasLivePet = HasLivePet;
    const FREE_LAYOUTS = [
        { name: 'single', slots: [0] },
        { name: 'pair', slots: [1, 2] },
        { name: 'trio', slots: [3, 4, 5] },
        { name: 'quad', slots: [6, 7, 8, 9] },
    ];
    const FREE_HOLES = {};
    FREE_LAYOUTS.forEach(shape => shape.slots.forEach(nSlot => {
        FREE_HOLES[nSlot] = { hint: '#pet_book_hint_free' };
    }));
    const LAYOUTS = {
        'intro': { id: 1, snippet: 'page-intro', holes: {
                0: { alsoRequires: 'zoom:closeup', hint: '#pet_book_hint_chick_intro' },
            } },
        'feet': { id: 2, snippet: 'page-feet', holes: {
                0: { alsoRequires: 'zoom:wide', hint: '#pet_book_hint_chick_feet' },
            } },
        'early-days': { id: 3, snippet: 'page-early-days', holes: {
                0: { alsoRequires: 'pose:8|9|10', hint: '#pet_book_hint_chick_and_you' },
            } },
        'chick-park': { id: 4, snippet: 'page-chick-park', holes: {
                0: { alsoRequires: 'stage:picnic', hint: '#pet_book_hint_chick_park' },
            } },
        'teen-warehouse': { id: 5, snippet: 'page-teen-warehouse', holes: {
                0: { alsoRequires: 'stage:warehouse', hint: '#pet_book_hint_adolescent_intro' },
            } },
        'teen-trip-1': { id: 6, snippet: 'page-teen-trip-set-1', holes: {
                0: { alsoRequires: 'stage:dust2|airport|inferno|train', hint: '#pet_book_hint_adolescent_road_trip' },
            } },
        'teen-trip-2': { id: 7, snippet: 'page-teen-trip-set-2', holes: {
                0: { alsoRequires: 'stage:mirage|nuke|cache|ancient', hint: '#pet_book_hint_adolescent_road_trip' },
            } },
        'birthday': { id: 8, snippet: 'page-birthday', holes: {
                0: { alsoRequires: 'activity:jump,headwear:party', hint: '#pet_book_hint_birthday' },
            } },
        'adult-perch': { id: 10, snippet: 'page-adult-perch', holes: {
                0: { alsoRequires: 'pose:1|3|6|7,filter:sepia', hint: '#pet_book_hint_adult_perch' },
            } },
        'adult-tricks': { id: 11, snippet: 'page-adult-tricks', holes: {
                0: { alsoRequires: 'activity:kick|fly', hint: '#pet_book_hint_adult_tricks' },
            } },
        'adult-close': { id: 13, snippet: 'page-adult-close', holes: {
                0: { alsoRequires: 'pose:4|5', hint: '#pet_book_hint_adult_close' },
            } },
        'brave-fire': { id: 15, snippet: 'page-brave-fire', achievement: 'killed-by-burn', holes: {} },
        'brave-taser': { id: 16, snippet: 'page-brave-taser', achievement: 'killed-by-taser', holes: {} },
        'brave-c4': { id: 17, snippet: 'page-brave-c4', achievement: 'killed-by-planted-c4', holes: {} },
        'free': { id: 14, snippet: 'page-free', holes: FREE_HOLES },
    };
    const SECTIONS = [
        {
            name: 'chick', icon: 'pet_chick.svg', stage: STAGE_CHICK,
            pages: ['intro', 'feet', 'early-days', 'chick-park', 'free', 'free'],
        },
        {
            name: 'pullet', icon: 'pet_pullet.svg', stage: STAGE_ADOLESCENT,
            pages: ['teen-warehouse', 'teen-trip-1', 'teen-trip-2', 'birthday', 'free', 'free'],
        },
        {
            name: 'brave', icon: 'pet_field_report.svg', stage: STAGE_ADULT,
            pages: ['brave-fire', 'brave-taser', 'brave-c4'],
        },
        {
            name: 'hen', icon: 'pet_hen.svg', stage: STAGE_ADULT,
            pages: ['adult-perch', 'adult-tricks', 'adult-close', 'free', 'free'],
        },
    ];
    const PAGES = [];
    SECTIONS.forEach(section => section.pages.forEach(strName => {
        const layout = LAYOUTS[strName];
        PAGES.push({ num: PAGES.length + 1, section: section, layout: layout });
    }));
    function _PageAt(nPageNum) {
        return PAGES[nPageNum - 1];
    }
    function _RequireOf(page, hole) {
        const strGrowth = PetPhotoTag.GrowthTerm(page.section.stage);
        return hole.alsoRequires === undefined ? strGrowth : strGrowth + ',' + hole.alsoRequires;
    }
    function _RequireAt(nPageNum, nSlot) {
        const page = _PageAt(nPageNum);
        if (page === undefined) {
            return undefined;
        }
        const hole = page.layout.holes[nSlot];
        return hole === undefined ? undefined : _RequireOf(page, hole);
    }
    let _m_aShown = [];
    function _IsBehindTheBird(page) {
        return _m_pet.nStage > page.section.stage;
    }
    function _IsUnlocked(page) {
        const strAchievement = page.layout.achievement;
        if (strAchievement === undefined || _HasPhotos(page)) {
            return true;
        }
        return _m_pet.strId !== '' && InventoryAPI.PetHasAchievement(_m_pet.strId, strAchievement);
    }
    function _CanFill(page, aPhotos) {
        return Object.values(page.layout.holes).some(hole => {
            const strRequire = _RequireOf(page, hole);
            return aPhotos.some(strFileName => PetPhotoTag.Matches(strFileName, strRequire));
        });
    }
    function _AllPhotos() {
        if (_m_strBookKey === '') {
            return [];
        }
        return GameInterfaceAPI.FindFiles(PetPhotoTag.LibraryFolder(_m_strBookKey) + '/*' + PetPhotoTag.EXT, 'USRLOCAL')
            .concat(GameInterfaceAPI.FindFiles(PetPhotoTag.BookFolder(_m_strBookKey) + '/*' + PetPhotoTag.EXT, 'USRLOCAL'));
    }
    function _BuildShown() {
        const aPhotos = _AllPhotos();
        _m_aShown = PAGES
            .filter(page => _IsUnlocked(page) && (!_IsBehindTheBird(page) || _HasPhotos(page) || _CanFill(page, aPhotos)))
            .map(page => page.num);
    }
    function ShownPages() {
        return _m_aShown;
    }
    PetBookPages.ShownPages = ShownPages;
    function Chapters() {
        const aChapters = [];
        SECTIONS.forEach(section => {
            const nFirst = _m_aShown.find(nPage => PAGES[nPage - 1].section === section);
            if (nFirst !== undefined) {
                aChapters.push({ name: section.name, icon: section.icon, page: nFirst });
            }
        });
        return aChapters;
    }
    PetBookPages.Chapters = Chapters;
    function _LayoutIdForPage(nPageNum) {
        const page = _PageAt(nPageNum);
        return page === undefined ? 0 : page.layout.id;
    }
    const _m_photos = {};
    function _PhotosOn(nPageNum) {
        if (!_m_photos[nPageNum]) {
            _m_photos[nPageNum] = {};
        }
        return _m_photos[nPageNum];
    }
    function _PhotoAt(nPage, nSlot) {
        const photos = _m_photos[nPage];
        return photos ? photos[nSlot] || '' : '';
    }
    function _HasPhotos(page) {
        const photos = _m_photos[page.num];
        return photos !== undefined && Object.keys(photos).length > 0;
    }
    function _SlotPlace(elSlot) {
        return {
            page: elSlot.GetAttributeInt('data-page', -1),
            slot: elSlot.GetAttributeInt('data-slot', -1),
        };
    }
    function _Load() {
        if (_m_strBookKey === '') {
            return;
        }
        GameInterfaceAPI.FindFiles(PetPhotoTag.BookFolder(_m_strBookKey) + '/*' + PetPhotoTag.EXT, 'USRLOCAL').forEach(strFileName => {
            const place = PetPhotoTag.PlaceOf(strFileName);
            if (!place || place.slot === PetPhotoTag.SLOT_UNPLACED) {
                return;
            }
            if (place.layout !== _LayoutIdForPage(place.page)) {
                return;
            }
            const slots = _PhotosOn(place.page);
            const strSitting = slots[place.slot];
            if (!strSitting) {
                slots[place.slot] = strFileName;
                return;
            }
            const bNewer = PetPhotoTag.CaptureMS(strFileName) > PetPhotoTag.CaptureMS(strSitting);
            slots[place.slot] = bNewer ? strFileName : strSitting;
        });
    }
    function _Reload(bRoll) {
        Object.keys(_m_photos).forEach(strPageNum => { delete _m_photos[Number(strPageNum)]; });
        _Load();
        if (bRoll) {
            PetPhotoLibrary.LoadFromDisk(_m_strBookKey);
        }
        $.Schedule(0, _m_fnRefreshSpread);
    }
    function _EmptyLibraryText() {
        return PAGES.some(_HasPhotos) ? '#pet_photo_library_empty_in_book' : '#pet_photo_library_empty';
    }
    function _BookName(strFileName, nPage, nSlot) {
        return PetPhotoTag.BookName(strFileName, { page: nPage, layout: _LayoutIdForPage(nPage), slot: nSlot });
    }
    function _MoveIntoBook(strFileName, nPage, nSlot) {
        const strNew = _BookName(strFileName, nPage, nSlot);
        return GameInterfaceAPI.MovePetPhotoToBook(_m_strBookKey, strFileName, strNew) ? strNew : '';
    }
    function _MoveWithinBook(strFileName, nPage, nSlot) {
        const strNew = _BookName(strFileName, nPage, nSlot);
        return GameInterfaceAPI.RenameBookPhoto(_m_strBookKey, strFileName, strNew) ? strNew : '';
    }
    function _MoveToLibrary(strFileName) {
        const strNew = PetPhotoTag.RollName(strFileName);
        return GameInterfaceAPI.MoveBookPhotoToPet(_m_strBookKey, strFileName, strNew) ? strNew : '';
    }
    function _Reconcile() {
        if (_m_strBookKey === '') {
            return;
        }
        const aBook = GameInterfaceAPI.FindFiles(PetPhotoTag.BookFolder(_m_strBookKey) + '/*' + PetPhotoTag.EXT, 'USRLOCAL');
        const inBook = {};
        aBook.forEach(strFileName => { inBook[PetPhotoTag.CaptureMS(strFileName)] = true; });
        GameInterfaceAPI.FindFiles(PetPhotoTag.LibraryFolder(_m_strBookKey) + '/*' + PetPhotoTag.EXT, 'USRLOCAL').forEach(strFileName => {
            if (inBook[PetPhotoTag.CaptureMS(strFileName)]) {
                GameInterfaceAPI.DeletePetPhoto(_m_strBookKey, strFileName);
            }
        });
        const byHole = {};
        const byPhoto = {};
        const aHome = [];
        aBook.sort().reverse().forEach(strFileName => {
            const place = PetPhotoTag.PlaceOf(strFileName);
            const strMS = PetPhotoTag.CaptureMS(strFileName);
            if (!place || place.slot === PetPhotoTag.SLOT_UNPLACED) {
                aHome.push(strFileName);
                return;
            }
            if (place.layout !== _LayoutIdForPage(place.page)) {
                aHome.push(strFileName);
                return;
            }
            const strKey = place.page + '_' + place.slot;
            if (byHole[strKey] || byPhoto[strMS]) {
                aHome.push(strFileName);
                return;
            }
            byHole[strKey] = true;
            byPhoto[strMS] = true;
        });
        aHome.forEach(strFileName => {
            _MoveToLibrary(strFileName);
        });
    }
    let _m_strDragFile = '';
    let _m_dragFrom = null;
    let _m_bDropHandled = false;
    let _m_elDragImage = null;
    let _m_justDropped = null;
    let _m_fnRefreshSpread = () => { };
    function Init(fnRefreshSpread) {
        _m_fnRefreshSpread = fnRefreshSpread;
        const strAskedFor = _m_cp.GetAttributeString('bookkey', '');
        const strAskedPet = strAskedFor === '' ? '' : GameInterfaceAPI.UnpackPetBookCloudFile(strAskedFor);
        _m_pet = _ReadPet();
        _m_bHasLivePet = _m_pet.strId !== '' && (strAskedPet === '' || strAskedPet === _m_pet.strId);
        if (_m_bHasLivePet) {
            GameInterfaceAPI.UnpackPetBookCloudFile(_m_pet.strId);
            GameInterfaceAPI.PreparePetPhoto(_m_pet.strId, '');
            _m_strBookKey = _m_pet.strId;
        }
        else if (strAskedPet !== '') {
            _m_pet = _ReadPet(strAskedPet);
            _m_strBookKey = strAskedPet;
        }
        else {
            _m_strBookKey = _NewestBookOnDisk();
        }
        if (_m_strBookKey)
            _m_pet.bookdata = GameInterfaceAPI.GetPetPhotoBookData(_m_strBookKey);
        _m_cp.SetDialogVariable('pet_name', _m_pet.strName);
        for (let iLifeStage = 1; iLifeStage <= 3; ++iLifeStage) {
            _m_cp.SetDialogVariable('pet_name_' + iLifeStage, _PetName(_m_pet.strId, iLifeStage));
        }
        _m_cp.SetDialogVariable('hatch_date', _HatchDateText());
        const elBody = _m_cp.FindChildInLayoutFile('id-photo-library-body');
        elBody.BLoadLayout('file://{resources}/layout/popups/pet_photo_library.xml', false, false);
        _Reconcile();
        PetPhotoLibrary.Init(elBody, {
            bDraggable: true,
            bDeletable: true,
            fnEmpty: _EmptyLibraryText,
            fnOnDragStart: _OnLibraryDragStart,
            fnOnDragEnd: _EndDrag,
        });
        PetPhotoLibrary.LoadFromDisk(_m_strBookKey);
        _m_cp.FindChildInLayoutFile('id-pb-booth-btn').visible = HasLivePet();
        _Load();
        _BuildShown();
    }
    PetBookPages.Init = Init;
    function _Image(elParent, strClass) {
        const aImages = elParent.FindChildrenWithClassTraverse(strClass);
        return aImages.length > 0 ? aImages[0] : null;
    }
    function _SetSlotHint(elSlot, strAgainst) {
        const place = _SlotPlace(elSlot);
        const page = _PageAt(place.page);
        const aLabels = elSlot.FindChildrenWithClassTraverse('pb-slot__hint');
        if (page === undefined || aLabels.length === 0) {
            return;
        }
        const hole = page.layout.holes[place.slot];
        if (hole === undefined) {
            return;
        }
        const strRequire = _RequireOf(page, hole);
        const aUnmet = strAgainst === '' ? [] : PetPhotoTag.Unmet(strAgainst, strRequire);
        const elLabel = aLabels[0];
        PetPhotoTag.TermWords(strRequire).forEach(term => {
            const strOwn = hole.hint + '_' + term.name;
            const strWord = $.CanLocalize(strOwn) ? $.Localize(strOwn) : term.word;
            const strClass = 'pb-hint-' + term.name +
                (aUnmet.indexOf(term.name) >= 0 ? ' pb-hint-unmet' : '');
            elLabel.SetDialogVariable(term.name, '<span class="' + strClass + '">' + strWord + '</span>');
        });
        elLabel.text = hole.hint;
    }
    const _m_freeChoice = {};
    function _FreeLayoutNamed(strName) {
        return FREE_LAYOUTS.find(layout => layout.name === strName);
    }
    function _FreeLayoutOf(nPageNum) {
        const slots = _PhotosOn(nPageNum);
        const worn = FREE_LAYOUTS.find(layout => layout.slots.some(nSlot => slots[nSlot] !== undefined));
        return worn || _FreeLayoutNamed(_m_freeChoice[nPageNum]) || FREE_LAYOUTS[0];
    }
    function _ChooseLayout(elPage, nPageNum, strName) {
        if (!_FreeLayoutNamed(strName)) {
            return;
        }
        _m_freeChoice[nPageNum] = strName;
        const slots = _PhotosOn(nPageNum);
        const aOn = Object.keys(slots).map(Number);
        if (aOn.length === 0) {
            _ShowFreeLayout(elPage, nPageNum);
            return;
        }
        aOn.forEach(nSlot => { _MoveToLibrary(slots[nSlot]); });
        _Reload(true);
    }
    function _FreeBtnId(nPageNum, strName) {
        return 'id-pb-free-' + nPageNum + '-' + strName;
    }
    function _ShowFreeLayout(elPage, nPageNum) {
        const worn = _FreeLayoutOf(nPageNum);
        elPage.FindChildrenWithClassTraverse('pb-free-group').forEach(elGroup => {
            elGroup.visible = elGroup.GetAttributeString('data-free', '') === worn.name;
        });
        const elBtn = _m_cp.FindChildTraverse(_FreeBtnId(nPageNum, worn.name));
        if (elBtn) {
            elBtn.checked = true;
        }
    }
    function _DressFreePage(elPage, nPageNum) {
        const elStrip = elPage.FindChildrenWithClassTraverse('pb-free-strip')[0];
        if (!elStrip) {
            return;
        }
        FREE_LAYOUTS.forEach(layout => {
            const elBtn = $.CreatePanel('RadioButton', elStrip, _FreeBtnId(nPageNum, layout.name), {
                class: 'pb-free-btn',
                group: 'pb-free-' + nPageNum
            });
            $.CreatePanel('Image', elBtn, '', {
                src: 'file://{images}/icons/ui/page_layout_' + layout.name + '.svg',
                textureheight: '20',
                texturewidth: '-1',
                scaling: 'stretch-to-fit-preserve-aspect'
            });
            elBtn.SetPanelEvent('onactivate', () => { _ChooseLayout(elPage, nPageNum, layout.name); });
        });
        _ShowFreeLayout(elPage, nPageNum);
    }
    function FillPage(elPage, nPageNum) {
        const page = _PageAt(nPageNum);
        if (page === undefined) {
            return;
        }
        const photos = _PhotosOn(nPageNum);
        elPage.BLoadLayoutSnippet(page.layout.snippet);
        elPage.SetDialogVariableInt('num', nPageNum);
        if (page.layout === LAYOUTS.free) {
            _DressFreePage(elPage, nPageNum);
        }
        const aClaimed = [];
        elPage.FindChildrenWithClassTraverse('pb-slot').forEach(elSlot => {
            const nSlot = elSlot.GetAttributeInt('data-slot', -1);
            if (nSlot < 0) {
                return;
            }
            _BuildHole(elSlot);
            aClaimed.push(nSlot);
            if (page.layout.holes[nSlot] === undefined) {
            }
            elSlot.SetAttributeInt('data-page', nPageNum);
            const strPhoto = photos[nSlot];
            elSlot.SetHasClass('pb-slot--filled', !!strPhoto);
            _SetSlotHint(elSlot, '');
            if (strPhoto) {
                _SetSlotPhoto(elSlot, strPhoto);
            }
            elSlot.SetDraggable(!!strPhoto);
            if (strPhoto) {
                $.RegisterEventHandler('DragStart', elSlot, (el, drag) => {
                    _m_dragFrom = _SlotPlace(elSlot);
                    _BeginDrag(strPhoto, drag);
                });
                $.RegisterEventHandler('DragEnd', elSlot, _EndDrag);
            }
            $.RegisterEventHandler('DragEnter', elSlot, () => {
                const bTakes = _CanDrop(elSlot);
                elSlot.SetHasClass('pb-slot--drag-over', bTakes);
                elSlot.SetHasClass('pb-slot--drag-reject', !bTakes);
                _SetSlotHint(elSlot, bTakes ? '' : _m_strDragFile);
                _ShowDragWillRemove(false);
            });
            $.RegisterEventHandler('DragLeave', elSlot, () => {
                _ClearDragOver(elSlot);
                _ShowDragWillRemove(true);
            });
            $.RegisterEventHandler('DragDrop', elSlot, () => {
                _ClearDragOver(elSlot);
                _DropPhoto(elSlot);
            });
            if (_m_justDropped && _m_justDropped.page === nPageNum && _m_justDropped.slot === nSlot) {
                _m_justDropped = null;
                elSlot.TriggerClass('pb-slot--dropped');
            }
        });
        Object.keys(photos).forEach(strSlot => {
            const nSlot = Number(strSlot);
            if (aClaimed.indexOf(nSlot) >= 0) {
                return;
            }
            delete photos[nSlot];
        });
        elPage.SetHasClass('pb-dressed', Object.keys(photos).length > 0 || Object.keys(page.layout.holes).length === 0);
        _FillParagraph(elPage, nPageNum);
        _ApplyDragState();
    }
    PetBookPages.FillPage = FillPage;
    function _BuildHole(elSlot) {
        const elClip = $.CreatePanel('Panel', elSlot, '', { class: 'pb-slot__clip' });
        $.CreatePanel('Image', elClip, '', { class: 'pb-slot__image', scaling: 'cover' });
        $.CreatePanel('Label', elSlot, '', { class: 'pb-slot__hint', html: 'true' });
    }
    function _FillParagraph(elPage, nPageNum) {
        const strFileName = _PhotosOn(nPageNum)[0];
        const nCaptureMS = strFileName ? Number(PetPhotoTag.CaptureMS(strFileName)) : 0;
        elPage.FindChildrenWithClassTraverse('pb-page__paragraph').forEach(elLabel => {
            const strToken = elLabel.GetAttributeString('data-paragraph', '');
            const nCount = elLabel.GetAttributeInt('data-variants', 0);
            if (strToken === '' || nCount <= 0) {
                return;
            }
            elLabel.text = $.Localize(strToken + '_' + (nCaptureMS % nCount), elLabel);
        });
    }
    function _SetSlotPhoto(elSlot, strFileName) {
        const elImage = _Image(elSlot, 'pb-slot__image');
        if (!elImage) {
            return;
        }
        elImage.SetImageFromFile(PetPhotoTag.PhotoUrl(_m_strBookKey, strFileName));
        _ApplyFrame(elSlot, elImage, strFileName, PetPhotoTag.FrameOf(strFileName));
        _MakeFrameButton(elSlot);
    }
    function _MakeFrameButton(elSlot) {
        if (elSlot.FindChildrenWithClassTraverse('pb-slot__frame-btn').length > 0) {
            return;
        }
        const elBtn = $.CreatePanel('Button', elSlot, '', { class: 'pb-slot__frame-btn' });
        $.CreatePanel('Image', elBtn, '', {
            src: 'file://{images}/icons/ui/tune.svg',
            textureheight: '24',
            texturewidth: '-1',
            scaling: 'stretch-to-fit-preserve-aspect'
        });
        elBtn.SetPanelEvent('onactivate', () => { OpenFrame(elSlot); });
    }
    const _m_holeAspect = {};
    function _HoleAspect(elSlot) {
        const place = _SlotPlace(elSlot);
        const strKey = _LayoutIdForPage(place.page) + ':' + place.slot;
        if (_m_holeAspect[strKey] > 0) {
            return _m_holeAspect[strKey];
        }
        const flW = elSlot.actuallayoutwidth / (elSlot.actualuiscale_x || 1);
        const flH = elSlot.actuallayoutheight / (elSlot.actualuiscale_y || 1);
        if (flW <= 0 || flH <= 0) {
            return 0;
        }
        _m_holeAspect[strKey] = flW / flH;
        return _m_holeAspect[strKey];
    }
    function _FrameSize(flHole, strFileName, frame) {
        const flPhoto = PetPhotoTag.Aspect(strFileName);
        const flZoom = frame.zoom / 100;
        return {
            w: (flPhoto >= flHole ? 100 * flPhoto / flHole : 100) * flZoom,
            h: (flPhoto >= flHole ? 100 : 100 * flHole / flPhoto) * flZoom,
        };
    }
    function _ApplyFrame(elSlot, elImage, strFileName, frame) {
        if (PetPhotoTag.IsDefaultFrame(frame)) {
            elImage.style.width = '100%;';
            elImage.style.height = '100%;';
            elImage.style.transform = 'none;';
            elImage.style.opacity = '1;';
            return;
        }
        const flHole = _HoleAspect(elSlot);
        if (flHole <= 0) {
            elImage.style.opacity = '0;';
            _DeferFrame(elSlot);
            return;
        }
        const { w: flW, h: flH } = _FrameSize(flHole, strFileName, frame);
        elImage.style.width = flW.toFixed(2) + '%;';
        elImage.style.height = flH.toFixed(2) + '%;';
        const flX = (flW - 100) * (0.5 - frame.x / 100);
        const flY = (flH - 100) * (0.5 - frame.y / 100);
        elImage.style.transform = 'translateX( ' + flX.toFixed(2) + '% ) translateY( ' + flY.toFixed(2) + '% );';
        elImage.style.opacity = '1;';
    }
    const FRAME_MEASURE_TRIES = 8;
    function _DeferFrame(elSlot) {
        const nTried = elSlot.GetAttributeInt('data-frame-tries', 0);
        if (nTried >= FRAME_MEASURE_TRIES) {
            return;
        }
        elSlot.SetAttributeInt('data-frame-tries', nTried + 1);
        $.Schedule(0, () => {
            if (!elSlot.IsValid()) {
                return;
            }
            const place = _SlotPlace(elSlot);
            const strPhoto = _PhotoAt(place.page, place.slot);
            if (strPhoto) {
                _SetSlotPhoto(elSlot, strPhoto);
            }
        });
    }
    let _m_framing = null;
    let _m_frameJob = undefined;
    const FRAME_COMMIT_SEC = 0.4;
    function _FrameBar() { return _m_cp.FindChildInLayoutFile('id-pb-frame-bar'); }
    function _FrameSlider(strWhich) { return _m_cp.FindChildInLayoutFile('id-pb-frame-' + strWhich); }
    function OpenFrame(elSlot) {
        const place = _SlotPlace(elSlot);
        const strPhoto = _PhotoAt(place.page, place.slot);
        if (!strPhoto) {
            return;
        }
        CloseFrame();
        _m_framing = { page: place.page, slot: place.slot, frame: PetPhotoTag.FrameOf(strPhoto) };
        elSlot.SetHasClass('pb-slot--framing', true);
        elSlot.SetDraggable(false);
        _SetSliders(_m_framing.frame);
        _FrameBar().SetHasClass('pb-frame-bar--open', true);
        _PlaceFrameBar(elSlot);
        _EnablePanSliders();
    }
    PetBookPages.OpenFrame = OpenFrame;
    const FRAME_BAR_W = 260;
    const FRAME_BAR_H = 156;
    const FRAME_BAR_GAP = 10;
    function _PlaceFrameBar(elSlot) {
        const elBar = _FrameBar();
        const flScaleX = _m_cp.actualuiscale_x || 1;
        const flScaleY = _m_cp.actualuiscale_y || 1;
        const pos = elSlot.GetPositionWithinAncestor(_m_cp);
        const flSlotX = pos.x / flScaleX;
        const flSlotY = pos.y / flScaleY;
        const flSlotW = elSlot.actuallayoutwidth / flScaleX;
        const flSlotH = elSlot.actuallayoutheight / flScaleY;
        const flRoomW = _m_cp.actuallayoutwidth / flScaleX;
        const flRoomH = _m_cp.actuallayoutheight / flScaleY;
        const flRight = flSlotX + flSlotW + FRAME_BAR_GAP;
        const flX = (flRight + FRAME_BAR_W <= flRoomW) ? flRight : flSlotX - FRAME_BAR_W - FRAME_BAR_GAP;
        const flWanted = flSlotY + flSlotH / 2 - FRAME_BAR_H / 2;
        const flY = Math.max(FRAME_BAR_GAP, Math.min(flRoomH - FRAME_BAR_H - FRAME_BAR_GAP, flWanted));
        elBar.style.position = Math.max(FRAME_BAR_GAP, flX).toFixed(0) + 'px ' + flY.toFixed(0) + 'px 0px;';
    }
    function _SetSliders(frame) {
        const aRows = [
            { which: 'zoom', min: 100, max: PetPhotoTag.FRAME_ZOOM_MAX, value: frame.zoom },
            { which: 'x', min: 0, max: 100, value: frame.x },
            { which: 'y', min: 0, max: 100, value: frame.y },
        ];
        aRows.forEach(row => {
            const elSlider = _FrameSlider(row.which);
            if (!elSlider) {
                return;
            }
            elSlider.ClearPanelEvent('onvaluechanged');
            elSlider.min = row.min;
            elSlider.max = row.max;
            elSlider.value = row.value;
            elSlider.SetPanelEvent('onvaluechanged', _OnFrameChanged);
        });
    }
    function _EnablePanSliders() {
        if (!_m_framing) {
            return;
        }
        const strPhoto = _PhotoAt(_m_framing.page, _m_framing.slot);
        const elSlot = _SlotPanel(_m_framing.page, _m_framing.slot);
        if (!strPhoto || !elSlot) {
            return;
        }
        const flHole = _HoleAspect(elSlot);
        if (flHole <= 0) {
            return;
        }
        const size = _FrameSize(flHole, strPhoto, _m_framing.frame);
        _EnablePanRow('x', size.w > 100.5);
        _EnablePanRow('y', size.h > 100.5);
    }
    function _EnablePanRow(strWhich, bEnable) {
        const elSlider = _FrameSlider(strWhich);
        elSlider.enabled = bEnable;
        elSlider.GetParent().SetHasClass('pb-frame-bar__row--off', !bEnable);
    }
    function _ReadSliders() {
        return {
            x: _FrameSlider('x').value,
            y: _FrameSlider('y').value,
            zoom: _FrameSlider('zoom').value,
        };
    }
    function _OnFrameChanged() {
        if (!_m_framing) {
            return;
        }
        _m_framing.frame = _ReadSliders();
        _PreviewFrame();
        _EnablePanSliders();
        if (_m_frameJob !== undefined) {
            $.CancelScheduled(_m_frameJob);
        }
        _m_frameJob = $.Schedule(FRAME_COMMIT_SEC, _CommitFrame);
    }
    function _PreviewFrame() {
        if (!_m_framing) {
            return;
        }
        const strPhoto = _PhotoAt(_m_framing.page, _m_framing.slot);
        const elSlot = _SlotPanel(_m_framing.page, _m_framing.slot);
        if (!elSlot || !strPhoto) {
            return;
        }
        const elImage = _Image(elSlot, 'pb-slot__image');
        if (elImage) {
            _ApplyFrame(elSlot, elImage, strPhoto, _m_framing.frame);
        }
    }
    function _CommitFrame() {
        _m_frameJob = undefined;
        if (!_m_framing) {
            return;
        }
        const strPhoto = _PhotoAt(_m_framing.page, _m_framing.slot);
        if (!strPhoto) {
            return;
        }
        const strNew = PetPhotoTag.WithFrame(strPhoto, _m_framing.frame);
        if (strNew === strPhoto) {
            return;
        }
        if (!GameInterfaceAPI.RenameBookPhoto(_m_strBookKey, strPhoto, strNew)) {
            return;
        }
        _PhotosOn(_m_framing.page)[_m_framing.slot] = strNew;
        const elSlot = _SlotPanel(_m_framing.page, _m_framing.slot);
        const elImage = elSlot ? _Image(elSlot, 'pb-slot__image') : null;
        if (elImage) {
            elImage.SetImageFromFile(PetPhotoTag.PhotoUrl(_m_strBookKey, strNew));
        }
    }
    function ResetFrame() {
        if (!_m_framing) {
            return;
        }
        _SetSliders(PetPhotoTag.FRAME_DEFAULT);
        _OnFrameChanged();
    }
    PetBookPages.ResetFrame = ResetFrame;
    function CloseFrame() {
        if (_m_frameJob !== undefined) {
            $.CancelScheduled(_m_frameJob);
            _m_frameJob = undefined;
            _CommitFrame();
        }
        if (_m_framing) {
            const elSlot = _SlotPanel(_m_framing.page, _m_framing.slot);
            if (elSlot) {
                elSlot.SetHasClass('pb-slot--framing', false);
                elSlot.SetDraggable(true);
            }
        }
        _m_framing = null;
        _FrameBar().SetHasClass('pb-frame-bar--open', false);
    }
    PetBookPages.CloseFrame = CloseFrame;
    function _TakesAt(nPage, nSlot, strFileName) {
        const strRequire = _RequireAt(nPage, nSlot);
        return strRequire !== undefined && PetPhotoTag.Matches(strFileName, strRequire);
    }
    function _SlotPanel(nPage, nSlot) {
        const aFound = _m_cp.FindChildrenWithClassTraverse('pb-slot').filter(elSlot => {
            const place = _SlotPlace(elSlot);
            return place.page === nPage && place.slot === nSlot;
        });
        if (aFound.length > 1) {
        }
        return aFound.length > 0 ? aFound[0] : null;
    }
    function _CanDrop(elSlot) {
        const place = _SlotPlace(elSlot);
        if (!_TakesAt(place.page, place.slot, _m_strDragFile)) {
            return false;
        }
        const from = _m_dragFrom;
        if (!from) {
            return true;
        }
        const strDisplaced = _PhotoAt(place.page, place.slot);
        if (!strDisplaced || (from.page === place.page && from.slot === place.slot)) {
            return true;
        }
        return _TakesAt(from.page, from.slot, strDisplaced);
    }
    function _ClearDragOver(elSlot) {
        elSlot.SetHasClass('pb-slot--drag-over', false);
        elSlot.SetHasClass('pb-slot--drag-reject', false);
        _SetSlotHint(elSlot, '');
    }
    function _ApplyDragState() {
        const bDragging = _m_strDragFile !== '';
        _m_cp.FindChildrenWithClassTraverse('pb-slot').forEach(elSlot => {
            elSlot.SetHasClass('pb-slot--eligible', bDragging && _CanDrop(elSlot));
            _ClearDragOver(elSlot);
        });
    }
    function _OnLibraryDragStart(strFileName, drag) {
        _m_dragFrom = null;
        _BeginDrag(strFileName, drag);
    }
    function _BeginDrag(strFileName, drag) {
        const elDragImage = $.CreatePanel('Image', $.GetContextPanel(), '', { class: 'pb-drag-image', scaling: 'stretch-to-fit-y-preserve-aspect' });
        elDragImage.SetImageFromFile(PetPhotoTag.PhotoUrl(_m_strBookKey, strFileName));
        _m_strDragFile = strFileName;
        _m_elDragImage = elDragImage;
        _m_bDropHandled = false;
        drag.displayPanel = elDragImage;
        drag.offsetX = 40;
        drag.offsetY = 30;
        drag.removePositionBeforeDrop = false;
        _ApplyDragState();
        _ShowDragWillRemove(true);
        $.DispatchEvent('CSGOPlaySoundEffect', 'Chicken.Photo.Pickup', 'MOUSE');
    }
    function _ShowDragWillRemove(bWillRemove) {
        if (_m_elDragImage && _m_elDragImage.IsValid()) {
            _m_elDragImage.SetHasClass('pb-drag-image--remove', bWillRemove && !!_m_dragFrom);
        }
    }
    function CancelDrag() {
        if (_m_elDragImage && _m_elDragImage.IsValid()) {
            _m_elDragImage.DeleteAsync(0.1);
        }
        _m_strDragFile = '';
        _m_dragFrom = null;
        _m_elDragImage = null;
    }
    PetBookPages.CancelDrag = CancelDrag;
    function _EndDrag() {
        const from = _m_dragFrom;
        const bHandled = _m_bDropHandled;
        CancelDrag();
        _ApplyDragState();
        PetPhotoLibrary.SetTakesInput(true);
        if (!bHandled) {
            _PlayRejected();
            if (from) {
                _RemovePhoto(from.page, from.slot);
            }
        }
    }
    function _RemovePhoto(nPage, nSlot) {
        const strFileName = _PhotoAt(nPage, nSlot);
        if (!strFileName) {
            return;
        }
        if (_MoveToLibrary(strFileName) === '') {
            const elSlot = _SlotPanel(nPage, nSlot);
            if (elSlot) {
                elSlot.TriggerClass('pb-slot--reject');
            }
            return;
        }
        _Reload(true);
    }
    function _PlayRejected() {
        $.DispatchEvent('CSGOPlaySoundEffect', 'Chicken.Photo.Rejected', 'MOUSE');
    }
    function _DropPhoto(elSlot) {
        CloseFrame();
        _m_bDropHandled = true;
        const { page: nPage, slot: nSlot } = _SlotPlace(elSlot);
        if (nPage < 0 || nSlot < 0 || _m_strDragFile === '') {
            return;
        }
        if (!_CanDrop(elSlot)) {
            elSlot.TriggerClass('pb-slot--reject');
            _PlayRejected();
            return;
        }
        const from = _m_dragFrom;
        if (from && from.page === nPage && from.slot === nSlot) {
            return;
        }
        const strDisplaced = _PhotoAt(nPage, nSlot);
        let strParked = '';
        if (strDisplaced) {
            strParked = _MoveWithinBook(strDisplaced, nPage, PetPhotoTag.SLOT_UNPLACED);
            if (strParked === '') {
                _PlayRejected();
                return;
            }
        }
        const strPlaced = from ? _MoveWithinBook(_m_strDragFile, nPage, nSlot) :
            _MoveIntoBook(_m_strDragFile, nPage, nSlot);
        if (strPlaced === '') {
            _PlayRejected();
            if (strParked !== '') {
                _MoveWithinBook(strParked, nPage, nSlot);
            }
        }
        else {
            if (strParked !== '') {
                if (from) {
                    _MoveWithinBook(strParked, from.page, from.slot);
                }
                else {
                    _MoveToLibrary(strParked);
                }
            }
            _m_justDropped = { page: nPage, slot: nSlot };
            $.DispatchEvent('CSGOPlaySoundEffect', 'Chicken.Photo.Accepted', 'MOUSE');
        }
        _Reload(!from);
    }
})(PetBookPages || (PetBookPages = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGV0X2Jvb2tfcGFnZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcGV0X2Jvb2tfcGFnZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyx1REFBdUQ7QUFDdkQsbURBQW1EO0FBT25ELElBQVUsWUFBWSxDQXd5RHJCO0FBeHlERCxXQUFVLFlBQVk7SUFFckIsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBT2xDLE1BQU0sU0FBUyxHQUFVLENBQUMsQ0FBQztJQUMzQixNQUFNLFdBQVcsR0FBUSxDQUFDLENBQUM7SUFDM0IsTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLENBQUM7SUFDM0IsTUFBTSxXQUFXLEdBQVEsQ0FBQyxDQUFDO0lBSTNCLE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBRSw0QkFBNEIsQ0FBRSxDQUFDO0lBYXBFLElBQUksTUFBTSxHQUFVLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsQ0FBQztJQUkxRyxJQUFJLGFBQWEsR0FBRyxFQUFFLENBQUM7SUFHdkIsSUFBSSxjQUFjLEdBQUcsS0FBSyxDQUFDO0lBSTNCLFNBQVMsaUJBQWlCO1FBSXpCLE1BQU0sTUFBTSxHQUFHLGdCQUFnQixDQUFDLHVCQUF1QixFQUFFLENBQUM7UUFDMUQsSUFBSyxNQUFNLENBQUMsTUFBTSxJQUFJLENBQUMsRUFDdkI7WUFDQyxPQUFPLEVBQUUsQ0FBQztTQUNWO1FBRUQsTUFBTSxNQUFNLEdBQUcsZ0JBQWdCLENBQUMsc0JBQXNCLENBQUUsTUFBTSxDQUFFLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFFLENBQUUsQ0FBQztR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