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
        return GameInterfaceAPI.FindFiles(PetPhotoTag.LibraryFolder(_m_strBookKey) + '/*.png', 'USRLOCAL')
            .concat(GameInterfaceAPI.FindFiles(PetPhotoTag.BookFolder(_m_strBookKey) + '/*.png', 'USRLOCAL'));
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
        GameInterfaceAPI.FindFiles(PetPhotoTag.BookFolder(_m_strBookKey) + '/*.png', 'USRLOCAL').forEach(strFileName => {
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
        const aBook = GameInterfaceAPI.FindFiles(PetPhotoTag.BookFolder(_m_strBookKey) + '/*.png', 'USRLOCAL');
        const inBook = {};
        aBook.forEach(strFileName => { inBook[PetPhotoTag.CaptureMS(strFileName)] = true; });
        GameInterfaceAPI.FindFiles(PetPhotoTag.LibraryFolder(_m_strBookKey) + '/*.png', 'USRLOCAL').forEach(strFileName => {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGV0X2Jvb2tfcGFnZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcGV0X2Jvb2tfcGFnZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyx1REFBdUQ7QUFDdkQsbURBQW1EO0FBT25ELElBQVUsWUFBWSxDQXd5RHJCO0FBeHlERCxXQUFVLFlBQVk7SUFFckIsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBT2xDLE1BQU0sU0FBUyxHQUFVLENBQUMsQ0FBQztJQUMzQixNQUFNLFdBQVcsR0FBUSxDQUFDLENBQUM7SUFDM0IsTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLENBQUM7SUFDM0IsTUFBTSxXQUFXLEdBQVEsQ0FBQyxDQUFDO0lBSTNCLE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBRSw0QkFBNEIsQ0FBRSxDQUFDO0lBYXBFLElBQUksTUFBTSxHQUFVLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsQ0FBQztJQUkxRyxJQUFJLGFBQWEsR0FBRyxFQUFFLENBQUM7SUFHdkIsSUFBSSxjQUFjLEdBQUcsS0FBSyxDQUFDO0lBSTNCLFNBQVMsaUJBQWlCO1FBSXpCLE1BQU0sTUFBTSxHQUFHLGdCQUFnQixDQUFDLHVCQUF1QixFQUFFLENBQUM7UUFDMUQsSUFBSyxNQUFNLENBQUMsTUFBTSxJQUFJLENBQUMsRUFDdkI7WUFDQyxPQUFPLEVBQUUsQ0FBQztTQUNWO1FBRUQsTUFBTSxNQUFNLEdBQUcsZ0JBQWdCLENBQUMsc0JBQXNCLENBQUUsTUFBTSxDQUFFLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFFLENBQUUsQ0FBQztRQUN0RixJQUFLLENBQUMsTUFBTSxFQUNaO1lBQ0MsT0FBTyxFQUFFLENBQUM7U0FDVjtRQUdELE1BQU0sR0FBRyxRQUFRLENBQUUsTUFBTSxDQUFFLENBQUM7UUFFNUIsT0FBTyxNQUFNLENBQUM7SUFDZixDQUFDO0lBRUQsU0FBUyxTQUFTLENBQUUsS0FBYSxFQUFFLFdBQW1CO1FBRXJELE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBRSxZQUFZLENBQUMscUJBQXFCLENBQUUsS0FBSyxFQUFFLFVBQVUsR0FBRyxXQUFXLENBQUUsQ0FBRSxDQUFDO1FBQzlGLE9BQU8sS0FBSyxDQUFFLEtBQUssQ0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztJQUNuQyxDQUFDO0lBRUQsU0FBUyxRQUFRLENBQUUsS0FBYztRQUVoQyxJQUFLLENBQUMsS0FBSztZQUNWLEtBQUssR0FBRyxZQUFZLENBQUMsWUFBWSxFQUFFLENBQUM7UUFFckMsSUFBSSxDQUFDLEtBQUssRUFDVjtZQUNDLE9BQU8sRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxDQUFDO1NBQzdGO1FBRUQsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFFLEtBQUssRUFBRSxlQUFlLENBQUUsQ0FBQztRQUVuRCxPQUFPO1lBQ04sS0FBSyxFQUFFLEtBQUs7WUFFWixPQUFPLEVBQUUsUUFBUSxDQUFFLEtBQUssRUFBRSxNQUFNLENBQUU7WUFFbEMsTUFBTSxFQUFFLE1BQU07WUFHZCxPQUFPLEVBQUUsU0FBUyxDQUFFLEtBQUssRUFBRSxpQkFBaUIsQ0FBRTtZQUU5QyxRQUFRLEVBQUUsRUFBRTtTQUNaLENBQUM7SUFDSCxDQUFDO0lBRUQsU0FBUyxRQUFRLENBQUUsS0FBYSxFQUFFLE1BQWM7UUFFL0MsSUFBSyxNQUFNLElBQUksU0FBUztZQUN2QixPQUFPLGdCQUFnQixDQUFDO1FBU3pCLElBQUksY0FBYyxHQUFHLE1BQU0sQ0FBQztRQUM1QixPQUFRLGNBQWMsR0FBRyxDQUFDLEVBQzFCO1lBQ0MsTUFBTSxRQUFRLEdBQUcsWUFBWSxDQUFDLHFCQUFxQixDQUFFLEtBQUssRUFBRSw4QkFBOEI7a0JBQ3ZGLENBQUUsQ0FBRSxjQUFjLElBQUksQ0FBQyxDQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBRSxDQUFFLENBQUM7WUFDN0QsSUFBSyxRQUFRO2dCQUFHLE9BQU8sUUFBa0IsQ0FBQztZQUMxQyxFQUFHLGNBQWMsQ0FBQztTQUNsQjtRQUlELElBQUksVUFBVSxHQUFHLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDNUIsT0FBUSxVQUFVLElBQUksQ0FBQyxFQUN2QjtZQUNDLE1BQU0sUUFBUSxHQUFHLFlBQVksQ0FBQyxxQkFBcUIsQ0FBRSxLQUFLLEVBQUUsOEJBQThCO2tCQUN2RixDQUFFLENBQUUsVUFBVSxJQUFJLENBQUMsQ0FBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUUsQ0FBRSxDQUFDO1lBQ3JELElBQUssUUFBUTtnQkFBRyxPQUFPLFFBQWtCLENBQUM7WUFDMUMsRUFBRyxVQUFVLENBQUM7U0FDZDtRQUdELE9BQU8sWUFBWSxDQUFDLHVCQUF1QixDQUFFLEtBQUssQ0FBRSxDQUFDO0lBQ3RELENBQUM7SUFHRCxTQUFTLGNBQWM7UUFFdEIsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQztRQUMvQixJQUFJLENBQUMsT0FBTyxFQUNaO1lBQ0MsT0FBTyxFQUFFLENBQUM7U0FDVjtRQUdELE1BQU0sT0FBTyxHQUFHLFlBQVksQ0FBQyxrQkFBa0IsQ0FBRSxPQUFPLENBQUUsQ0FBQztRQUUzRCxJQUFJLE1BQU0sQ0FBQyxNQUFNLEtBQUssU0FBUyxFQUMvQjtZQUNDLE9BQU8sT0FBTyxDQUFDO1NBQ2Y7UUFJRCxLQUFLLENBQUMsaUJBQWlCLENBQUUsV0FBVyxFQUFFLE9BQU8sQ0FBRSxDQUFDO1FBRWhELE9BQU8sQ0FBQyxDQUFDLFFBQVEsQ0FBRSxxQkFBcUIsRUFBRSxLQUFLLENBQUUsQ0FBQztJQUNuRCxDQUFDO0lBT0QsU0FBZ0IsU0FBUztRQUV4QixPQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUM7SUFDckIsQ0FBQztJQUhlLHNCQUFTLFlBR3hCLENBQUE7SUFFRCxTQUFnQixRQUFRO1FBRXZCLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUN0QixDQUFDO0lBSGUscUJBQVEsV0FHdkIsQ0FBQTtJQUlELFNBQWdCLFVBQVU7UUFFekIsT0FBTyxjQUFjLENBQUM7SUFDdkIsQ0FBQztJQUhlLHVCQUFVLGFBR3pCLENBQUE7SUE0QkQsTUFBTSxZQUFZLEdBQ2xCO1FBQ0MsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxDQUFFLENBQUMsQ0FBRSxFQUFFO1FBQ2hDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBSSxLQUFLLEVBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLEVBQUU7UUFDbkMsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFJLEtBQUssRUFBRSxDQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLEVBQUU7UUFDdEMsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFJLEtBQUssRUFBRSxDQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxFQUFFO0tBQ3pDLENBQUM7SUFHRixNQUFNLFVBQVUsR0FBaUMsRUFBRSxDQUFDO0lBQ3BELFlBQVksQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsRUFBRTtRQUUzRCxVQUFVLENBQUUsS0FBSyxDQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUscUJBQXFCLEVBQUUsQ0FBQztJQUN2RCxDQUFDLENBQUUsQ0FBRSxDQUFDO0lBaUJOLE1BQU0sT0FBTyxHQUNiO1FBQ0MsT0FBTyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLEtBQUssRUFDOUM7Z0JBQ0MsQ0FBQyxFQUFFLEVBQUUsWUFBWSxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsNEJBQTRCLEVBQUU7YUFDdkUsRUFBRTtRQUVILE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQzVDO2dCQUNDLENBQUMsRUFBRSxFQUFFLFlBQVksRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLDJCQUEyQixFQUFFO2FBQ25FLEVBQUU7UUFFSCxZQUFZLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxLQUFLLEVBQ3hEO2dCQUNDLENBQUMsRUFBRSxFQUFFLFlBQVksRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLDhCQUE4QixFQUFFO2FBQ3hFLEVBQUU7UUFFSCxZQUFZLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxLQUFLLEVBQ3hEO2dCQUNDLENBQUMsRUFBRSxFQUFFLFlBQVksRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLDJCQUEyQixFQUFFO2FBQ3RFLEVBQUU7UUFFSCxnQkFBZ0IsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLHFCQUFxQixFQUFFLEtBQUssRUFDaEU7Z0JBQ0MsQ0FBQyxFQUFFLEVBQUUsWUFBWSxFQUFFLGlCQUFpQixFQUFFLElBQUksRUFBRSxpQ0FBaUMsRUFBRTthQUMvRSxFQUFFO1FBRUgsYUFBYSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsc0JBQXNCLEVBQUUsS0FBSyxFQUM5RDtnQkFDQyxDQUFDLEVBQUUsRUFBRSxZQUFZLEVBQUUsbUNBQW1DLEVBQUUsSUFBSSxFQUFFLHFDQUFxQyxFQUFFO2FBQ3JHLEVBQUU7UUFFSCxhQUFhLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxLQUFLLEVBQzlEO2dCQUNDLENBQUMsRUFBRSxFQUFFLFlBQVksRUFBRSxpQ0FBaUMsRUFBRSxJQUFJLEVBQUUscUNBQXFDLEVBQUU7YUFDbkcsRUFBRTtRQUlILFVBQVUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLGVBQWUsRUFBRSxLQUFLLEVBQ3BEO2dCQUNDLENBQUMsRUFBRSxFQUFFLFlBQVksRUFBRSw4QkFBOEIsRUFBRSxJQUFJLEVBQUUseUJBQXlCLEVBQUU7YUFDcEYsRUFBRTtRQUlILGFBQWEsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLGtCQUFrQixFQUFFLEtBQUssRUFDM0Q7Z0JBQ0MsQ0FBQyxFQUFFLEVBQUUsWUFBWSxFQUFFLDJCQUEyQixFQUFFLElBQUksRUFBRSw0QkFBNEIsRUFBRTthQUNwRixFQUFFO1FBRUgsY0FBYyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsS0FBSyxFQUM3RDtnQkFDQyxDQUFDLEVBQUUsRUFBRSxZQUFZLEVBQUUsbUJBQW1CLEVBQUUsSUFBSSxFQUFFLDZCQUE2QixFQUFFO2FBQzdFLEVBQUU7UUFFSCxhQUFhLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxLQUFLLEVBQzNEO2dCQUNDLENBQUMsRUFBRSxFQUFFLFlBQVksRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLDRCQUE0QixFQUFFO2FBQ25FLEVBQUU7UUFHSCxZQUFZLEVBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxpQkFBaUIsRUFBRyxXQUFXLEVBQUUsZ0JBQWdCLEVBQVEsS0FBSyxFQUFFLEVBQUUsRUFBRTtRQUN0RyxhQUFhLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxXQUFXLEVBQUUsaUJBQWlCLEVBQU8sS0FBSyxFQUFFLEVBQUUsRUFBRTtRQUN0RyxVQUFVLEVBQUssRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxlQUFlLEVBQUssV0FBVyxFQUFFLHNCQUFzQixFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7UUFFdEcsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUU7S0FFeEIsQ0FBQztJQW9CckMsTUFBTSxRQUFRLEdBQ2Q7UUFDQztZQUNDLElBQUksRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLGVBQWUsRUFBRSxLQUFLLEVBQUUsV0FBVztZQUN4RCxLQUFLLEVBQUUsQ0FBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLFlBQVksRUFBRSxZQUFZLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBRTtTQUN0RTtRQUNEO1lBQ0MsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsS0FBSyxFQUFFLGdCQUFnQjtZQUMvRCxLQUFLLEVBQUUsQ0FBRSxnQkFBZ0IsRUFBRSxhQUFhLEVBQUUsYUFBYSxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFFO1NBQ3JGO1FBRUQ7WUFDQyxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxzQkFBc0IsRUFBRSxLQUFLLEVBQUUsV0FBVztZQUMvRCxLQUFLLEVBQUUsQ0FBRSxZQUFZLEVBQUUsYUFBYSxFQUFFLFVBQVUsQ0FBRTtTQUNsRDtRQUdEO1lBQ0MsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLEtBQUssRUFBRSxXQUFXO1lBQ3BELEtBQUssRUFBRSxDQUFFLGFBQWEsRUFBRSxjQUFjLEVBQUUsYUFBYSxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUU7U0FDdkU7S0FDRCxDQUFDO0lBZ0JGLE1BQU0sS0FBSyxHQUFpQixFQUFFLENBQUM7SUFDL0IsUUFBUSxDQUFDLE9BQU8sQ0FBRSxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFFLE9BQU8sQ0FBQyxFQUFFO1FBRzdELE1BQU0sTUFBTSxHQUFhLE9BQU8sQ0FBRSxPQUFPLENBQUUsQ0FBQztRQUU1QyxLQUFLLENBQUMsSUFBSSxDQUFFLEVBQUUsR0FBRyxFQUFFLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxDQUFFLENBQUM7SUFDM0UsQ0FBQyxDQUFFLENBQUUsQ0FBQztJQUVOLFNBQVMsT0FBTyxDQUFFLFFBQWdCO1FBRWpDLE9BQU8sS0FBSyxDQUFFLFFBQVEsR0FBRyxDQUFDLENBQUUsQ0FBQztJQUM5QixDQUFDO0lBR0QsU0FBUyxVQUFVLENBQUUsSUFBZ0IsRUFBRSxJQUFZO1FBRWxELE1BQU0sU0FBUyxHQUFHLFdBQVcsQ0FBQyxVQUFVLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUUsQ0FBQztRQUUvRCxPQUFPLElBQUksQ0FBQyxZQUFZLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQztJQUMxRixDQUFDO0lBSUQsU0FBUyxVQUFVLENBQUUsUUFBZ0IsRUFBRSxLQUFhO1FBRW5ELE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBRSxRQUFRLENBQUUsQ0FBQztRQUNqQyxJQUFJLElBQUksS0FBSyxTQUFTLEVBQ3RCO1lBQ0MsT0FBTyxTQUFTLENBQUM7U0FDakI7UUFFRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBRSxLQUFLLENBQUUsQ0FBQztRQUV4QyxPQUFPLElBQUksS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFFLElBQUksRUFBRSxJQUFJLENBQUUsQ0FBQztJQUNsRSxDQUFDO0lBUUQsSUFBSSxTQUFTLEdBQWEsRUFBRSxDQUFDO0lBRTdCLFNBQVMsZ0JBQWdCLENBQUUsSUFBZ0I7UUFFMUMsT0FBTyxNQUFNLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO0lBQzNDLENBQUM7SUFHRCxTQUFTLFdBQVcsQ0FBRSxJQUFnQjtRQUVyQyxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQztRQUMvQyxJQUFJLGNBQWMsS0FBSyxTQUFTLElBQUksVUFBVSxDQUFFLElBQUksQ0FBRSxFQUN0RDtZQUNDLE9BQU8sSUFBSSxDQUFDO1NBQ1o7UUFVRCxPQUFPLE1BQU0sQ0FBQyxLQUFLLEtBQUssRUFBRSxJQUFJLFlBQVksQ0FBQyxpQkFBaUIsQ0FBRSxNQUFNLENBQUMsS0FBSyxFQUFFLGNBQWMsQ0FBRSxDQUFDO0lBQzlGLENBQUM7SUFFRCxTQUFTLFFBQVEsQ0FBRSxJQUFnQixFQUFFLE9BQWlCO1FBRXJELE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBRSxDQUFDLElBQUksQ0FBRSxJQUFJLENBQUMsRUFBRTtZQUV0RCxNQUFNLFVBQVUsR0FBRyxVQUFVLENBQUUsSUFBSSxFQUFFLElBQUksQ0FBRSxDQUFDO1lBRTVDLE9BQU8sT0FBTyxDQUFDLElBQUksQ0FBRSxXQUFXLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUUsV0FBVyxFQUFFLFVBQVUsQ0FBRSxDQUFFLENBQUM7UUFDdEYsQ0FBQyxDQUFFLENBQUM7SUFDTCxDQUFDO0lBR0QsU0FBUyxVQUFVO1FBRWxCLElBQUksYUFBYSxLQUFLLEVBQUUsRUFDeEI7WUFDQyxPQUFPLEVBQUUsQ0FBQztTQUNWO1FBRUQsT0FBTyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUUsV0FBVyxDQUFDLGFBQWEsQ0FBRSxhQUFhLENBQUUsR0FBRyxRQUFRLEVBQUUsVUFBVSxDQUFFO2FBQ3BHLE1BQU0sQ0FBRSxnQkFBZ0IsQ0FBQyxTQUFTLENBQUUsV0FBVyxDQUFDLFVBQVUsQ0FBRSxhQUFhLENBQUUsR0FBRyxRQUFRLEVBQUUsVUFBVSxDQUFFLENBQUUsQ0FBQztJQUMxRyxDQUFDO0lBSUQsU0FBUyxXQUFXO1FBRW5CLE1BQU0sT0FBTyxHQUFHLFVBQVUsRUFBRSxDQUFDO1FBRTdCLFNBQVMsR0FBRyxLQUFLO2FBQ2YsTUFBTSxDQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFFLElBQUksQ0FBRSxJQUFJLENBQUUsQ0FBQyxnQkFBZ0IsQ0FBRSxJQUFJLENBQUUsSUFBSSxVQUFVLENBQUUsSUFBSSxDQUFFLElBQUksUUFBUSxDQUFFLElBQUksRUFBRSxPQUFPLENBQUUsQ0FBRSxDQUFFO2FBQ3pILEdBQUcsQ0FBRSxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUUsQ0FBQztJQUkzQixDQUFDO0lBR0QsU0FBZ0IsVUFBVTtRQUV6QixPQUFPLFNBQVMsQ0FBQztJQUNsQixDQUFDO0lBSGUsdUJBQVUsYUFHekIsQ0FBQTtJQVlELFNBQWdCLFFBQVE7UUFFdkIsTUFBTSxTQUFTLEdBQWdCLEVBQUUsQ0FBQztRQUVsQyxRQUFRLENBQUMsT0FBTyxDQUFFLE9BQU8sQ0FBQyxFQUFFO1lBRTNCLE1BQU0sTUFBTSxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUUsS0FBSyxHQUFHLENBQUMsQ0FBRSxDQUFDLE9BQU8sS0FBSyxPQUFPLENBQUUsQ0FBQztZQUVqRixJQUFJLE1BQU0sS0FBSyxTQUFTLEVBQ3hCO2dCQUNDLFNBQVMsQ0FBQyxJQUFJLENBQUUsRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLENBQUUsQ0FBQzthQUMzRTtRQUNGLENBQUMsQ0FBRSxDQUFDO1FBRUosT0FBTyxTQUFTLENBQUM7SUFDbEIsQ0FBQztJQWZlLHFCQUFRLFdBZXZCLENBQUE7SUFHRCxTQUFTLGdCQUFnQixDQUFFLFFBQWdCO1FBRTFDLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBRSxRQUFRLENBQUUsQ0FBQztRQUVqQyxPQUFPLElBQUksS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7SUFDaEQsQ0FBQztJQU9ELE1BQU0sU0FBUyxHQUEwRCxFQUFFLENBQUM7SUFFNUUsU0FBUyxTQUFTLENBQUUsUUFBZ0I7UUFFbkMsSUFBSSxDQUFDLFNBQVMsQ0FBRSxRQUFRLENBQUUsRUFDMUI7WUFDQyxTQUFTLENBQUUsUUFBUSxDQUFFLEdBQUcsRUFBRSxDQUFDO1NBQzNCO1FBRUQsT0FBTyxTQUFTLENBQUUsUUFBUSxDQUFFLENBQUM7SUFDOUIsQ0FBQztJQUdELFNBQVMsUUFBUSxDQUFFLEtBQWEsRUFBRSxLQUFhO1FBRTlDLE1BQU0sTUFBTSxHQUFHLFNBQVMsQ0FBRSxLQUFLLENBQUUsQ0FBQztRQUVsQyxPQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFFLEtBQUssQ0FBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0lBQzVDLENBQUM7SUFFRCxTQUFTLFVBQVUsQ0FBRSxJQUFnQjtRQUVwQyxNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBRSxDQUFDO1FBRXJDLE9BQU8sTUFBTSxLQUFLLFNBQVMsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFFLE1BQU0sQ0FBRSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7SUFDakUsQ0FBQztJQUdELFNBQVMsVUFBVSxDQUFFLE1BQWU7UUFFbkMsT0FBTztZQUNOLElBQUksRUFBRSxNQUFNLENBQUMsZUFBZSxDQUFFLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBRTtZQUMvQyxJQUFJLEVBQUUsTUFBTSxDQUFDLGVBQWUsQ0FBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUU7U0FDL0MsQ0FBQztJQUNILENBQUM7SUFRRCxTQUFTLEtBQUs7UUFFYixJQUFJLGFBQWEsS0FBSyxFQUFFLEVBQ3hCO1lBQ0MsT0FBTztTQUNQO1FBRUQsZ0JBQWdCLENBQUMsU0FBUyxDQUFFLFdBQVcsQ0FBQyxVQUFVLENBQUUsYUFBYSxDQUFFLEdBQUcsUUFBUSxFQUFFLFVBQVUsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxXQUFXLENBQUMsRUFBRTtZQUVuSCxNQUFNLEtBQUssR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFFLFdBQVcsQ0FBRSxDQUFDO1lBQ2pELElBQUksQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxXQUFXLENBQUMsYUFBYSxFQUN0RDtnQkFFQyxPQUFPO2FBQ1A7WUFHRCxJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssZ0JBQWdCLENBQUUsS0FBSyxDQUFDLElBQUksQ0FBRSxFQUNuRDtnQkFFQyxPQUFPO2FBQ1A7WUFFRCxNQUFNLEtBQUssR0FBRyxTQUFTLENBQUUsS0FBSyxDQUFDLElBQUksQ0FBRSxDQUFDO1lBQ3RDLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBRSxLQUFLLENBQUMsSUFBSSxDQUFFLENBQUM7WUFFdkMsSUFBSSxDQUFDLFVBQVUsRUFDZjtnQkFDQyxLQUFLLENBQUUsS0FBSyxDQUFDLElBQUksQ0FBRSxHQUFHLFdBQVcsQ0FBQztnQkFDbEMsT0FBTzthQUNQO1lBS0QsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDLFNBQVMsQ0FBRSxXQUFXLENBQUUsR0FBRyxXQUFXLENBQUMsU0FBUyxDQUFFLFVBQVUsQ0FBRSxDQUFDO1lBRzFGLEtBQUssQ0FBRSxLQUFLLENBQUMsSUFBSSxDQUFFLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQztRQUN6RCxDQUFDLENBQUUsQ0FBQztJQUNMLENBQUM7SUFJRCxTQUFTLE9BQU8sQ0FBRSxLQUFjO1FBRS9CLE1BQU0sQ0FBQyxJQUFJLENBQUUsU0FBUyxDQUFFLENBQUMsT0FBTyxDQUFFLFVBQVUsQ0FBQyxFQUFFLEdBQUcsT0FBTyxTQUFTLENBQUUsTUFBTSxDQUFFLFVBQVUsQ0FBRSxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQztRQUVoRyxLQUFLLEVBQUUsQ0FBQztRQUVSLElBQUksS0FBSyxFQUNUO1lBQ0MsZUFBZSxDQUFDLFlBQVksQ0FBRSxhQUFhLENBQUUsQ0FBQztTQUM5QztRQUdELENBQUMsQ0FBQyxRQUFRLENBQUUsQ0FBQyxFQUFFLGtCQUFrQixDQUFFLENBQUM7SUFDckMsQ0FBQztJQUlELFNBQVMsaUJBQWlCO1FBRXpCLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBRSxVQUFVLENBQUUsQ0FBQyxDQUFDLENBQUMsa0NBQWtDLENBQUMsQ0FBQyxDQUFDLDBCQUEwQixDQUFDO0lBQ25HLENBQUM7SUFFRCxTQUFTLFNBQVMsQ0FBRSxXQUFtQixFQUFFLEtBQWEsRUFBRSxLQUFhO1FBRXBFLE9BQU8sV0FBVyxDQUFDLFFBQVEsQ0FBRSxXQUFXLEVBQUUsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxnQkFBZ0IsQ0FBRSxLQUFLLENBQUUsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUUsQ0FBQztJQUM3RyxDQUFDO0lBS0QsU0FBUyxhQUFhLENBQUUsV0FBbUIsRUFBRSxLQUFhLEVBQUUsS0FBYTtRQUd4RSxNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUUsQ0FBQztRQUN0RCxPQUFPLGdCQUFnQixDQUFDLGtCQUFrQixDQUFFLGFBQWEsRUFBRSxXQUFXLEVBQUUsTUFBTSxDQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0lBQ2hHLENBQUM7SUFFRCxTQUFTLGVBQWUsQ0FBRSxXQUFtQixFQUFFLEtBQWEsRUFBRSxLQUFhO1FBRTFFLE1BQU0sTUFBTSxHQUFHLFNBQVMsQ0FBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBRSxDQUFDO1FBQ3RELE9BQU8sZ0JBQWdCLENBQUMsZUFBZSxDQUFFLGFBQWEsRUFBRSxXQUFXLEVBQUUsTUFBTSxDQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0lBQzdGLENBQUM7SUFFRCxTQUFTLGNBQWMsQ0FBRSxXQUFtQjtRQUUzQyxNQUFNLE1BQU0sR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFFLFdBQVcsQ0FBRSxDQUFDO1FBQ25ELE9BQU8sZ0JBQWdCLENBQUMsa0JBQWtCLENBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSxNQUFNLENBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFDaEcsQ0FBQztJQUtELFNBQVMsVUFBVTtRQUVsQixJQUFJLGFBQWEsS0FBSyxFQUFFLEVBQ3hCO1lBQ0MsT0FBTztTQUNQO1FBRUQsTUFBTSxLQUFLLEdBQUcsZ0JBQWdCLENBQUMsU0FBUyxDQUFFLFdBQVcsQ0FBQyxVQUFVLENBQUUsYUFBYSxDQUFFLEdBQUcsUUFBUSxFQUFFLFVBQVUsQ0FBRSxDQUFDO1FBSzNHLE1BQU0sTUFBTSxHQUFnQyxFQUFFLENBQUM7UUFDL0MsS0FBSyxDQUFDLE9BQU8sQ0FBRSxXQUFXLENBQUMsRUFBRSxHQUFHLE1BQU0sQ0FBRSxXQUFXLENBQUMsU0FBUyxDQUFFLFdBQVcsQ0FBRSxDQUFFLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFFLENBQUM7UUFFM0YsZ0JBQWdCLENBQUMsU0FBUyxDQUFFLFdBQVcsQ0FBQyxhQUFhLENBQUUsYUFBYSxDQUFFLEdBQUcsUUFBUSxFQUFFLFVBQVUsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxXQUFXLENBQUMsRUFBRTtZQUV0SCxJQUFJLE1BQU0sQ0FBRSxXQUFXLENBQUMsU0FBUyxDQUFFLFdBQVcsQ0FBRSxDQUFFLEVBQ2xEO2dCQUVDLGdCQUFnQixDQUFDLGNBQWMsQ0FBRSxhQUFhLEVBQUUsV0FBVyxDQUFFLENBQUM7YUFDOUQ7UUFDRixDQUFDLENBQUUsQ0FBQztRQUlKLE1BQU0sTUFBTSxHQUFpQyxFQUFFLENBQUM7UUFDaEQsTUFBTSxPQUFPLEdBQWdDLEVBQUUsQ0FBQztRQUNoRCxNQUFNLEtBQUssR0FBYSxFQUFFLENBQUM7UUFFM0IsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDLE9BQU8sQ0FBRSxXQUFXLENBQUMsRUFBRTtZQUU3QyxNQUFNLEtBQUssR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFFLFdBQVcsQ0FBRSxDQUFDO1lBQ2pELE1BQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxTQUFTLENBQUUsV0FBVyxDQUFFLENBQUM7WUFHbkQsSUFBSSxDQUFDLEtBQUssSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLFdBQVcsQ0FBQyxhQUFhLEVBQ3REO2dCQUNDLEtBQUssQ0FBQyxJQUFJLENBQUUsV0FBVyxDQUFFLENBQUM7Z0JBQzFCLE9BQU87YUFDUDtZQUlELElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxnQkFBZ0IsQ0FBRSxLQUFLLENBQUMsSUFBSSxDQUFFLEVBQ25EO2dCQUNDLEtBQUssQ0FBQyxJQUFJLENBQUUsV0FBVyxDQUFFLENBQUM7Z0JBQzFCLE9BQU87YUFDUDtZQUlELE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxJQUFJLEdBQUcsR0FBRyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUM7WUFFN0MsSUFBSSxNQUFNLENBQUUsTUFBTSxDQUFFLElBQUksT0FBTyxDQUFFLEtBQUssQ0FBRSxFQUN4QztnQkFDQyxLQUFLLENBQUMsSUFBSSxDQUFFLFdBQVcsQ0FBRSxDQUFDO2dCQUMxQixPQUFPO2FBQ1A7WUFFRCxNQUFNLENBQUUsTUFBTSxDQUFFLEdBQUcsSUFBSSxDQUFDO1lBQ3hCLE9BQU8sQ0FBRSxLQUFLLENBQUUsR0FBRyxJQUFJLENBQUM7UUFDekIsQ0FBQyxDQUFFLENBQUM7UUFHSixLQUFLLENBQUMsT0FBTyxDQUFFLFdBQVcsQ0FBQyxFQUFFO1lBRzVCLGNBQWMsQ0FBRSxXQUFXLENBQUUsQ0FBQztRQUMvQixDQUFDLENBQUUsQ0FBQztJQUNMLENBQUM7SUFFRCxJQUFJLGNBQWMsR0FBRyxFQUFFLENBQUM7SUFJeEIsSUFBSSxXQUFXLEdBQTBDLElBQUksQ0FBQztJQUk5RCxJQUFJLGVBQWUsR0FBRyxLQUFLLENBQUM7SUFHNUIsSUFBSSxjQUFjLEdBQW1CLElBQUksQ0FBQztJQUMxQyxJQUFJLGNBQWMsR0FBMEMsSUFBSSxDQUFDO0lBQ2pFLElBQUksa0JBQWtCLEdBQWUsR0FBRSxFQUFFLEdBQUMsQ0FBQyxDQUFDO0lBRTVDLFNBQWdCLElBQUksQ0FBRSxlQUEyQjtRQUVoRCxrQkFBa0IsR0FBRyxlQUFlLENBQUM7UUFLckMsTUFBTSxXQUFXLEdBQUcsS0FBSyxDQUFDLGtCQUFrQixDQUFFLFNBQVMsRUFBRSxFQUFFLENBQUUsQ0FBQztRQUM5RCxNQUFNLFdBQVcsR0FBRyxXQUFXLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLHNCQUFzQixDQUFFLFdBQVcsQ0FBRSxDQUFDO1FBRXJHLE1BQU0sR0FBRyxRQUFRLEVBQUUsQ0FBQztRQUlwQixjQUFjLEdBQUcsTUFBTSxDQUFDLEtBQUssS0FBSyxFQUFFLElBQUksQ0FBRSxXQUFXLEtBQUssRUFBRSxJQUFJLFdBQVcsS0FBSyxNQUFNLENBQUMsS0FBSyxDQUFFLENBQUM7UUFFL0YsSUFBSyxjQUFjLEVBQ25CO1lBQ0MsZ0JBQWdCLENBQUMsc0JBQXNCLENBQUUsTUFBTSxDQUFDLEtBQUssQ0FBRSxDQUFDO1lBR3hELGdCQUFnQixDQUFDLGVBQWUsQ0FBRSxNQUFNLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBRSxDQUFDO1lBRXJELGFBQWEsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO1NBQzdCO2FBQ0ksSUFBSyxXQUFXLEtBQUssRUFBRSxFQUM1QjtZQUVDLE1BQU0sR0FBRyxRQUFRLENBQUUsV0FBVyxDQUFFLENBQUM7WUFDakMsYUFBYSxHQUFHLFdBQVcsQ0FBQztTQUM1QjthQUVEO1lBQ0MsYUFBYSxHQUFHLGlCQUFpQixFQUFFLENBQUM7U0FDcEM7UUFHRCxJQUFLLGFBQWE7WUFDakIsTUFBTSxDQUFDLFFBQVEsR0FBRyxnQkFBZ0IsQ0FBQyxtQkFBbUIsQ0FBRSxhQUFhLENBQUUsQ0FBQztRQU96RSxLQUFLLENBQUMsaUJBQWlCLENBQUUsVUFBVSxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUUsQ0FBQztRQUl0RCxLQUFNLElBQUksVUFBVSxHQUFHLENBQUMsRUFBRSxVQUFVLElBQUksQ0FBQyxFQUFFLEVBQUcsVUFBVSxFQUN4RDtZQUNDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBRSxXQUFXLEdBQUcsVUFBVSxFQUFFLFFBQVEsQ0FBRSxNQUFNLENBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBRSxDQUFFLENBQUM7U0FDMUY7UUFFRCxLQUFLLENBQUMsaUJBQWlCLENBQUUsWUFBWSxFQUFFLGNBQWMsRUFBRSxDQUFFLENBQUM7UUFFMUQsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLHFCQUFxQixDQUFFLHVCQUF1QixDQUFFLENBQUM7UUFDdEUsTUFBTSxDQUFDLFdBQVcsQ0FBRSx3REFBd0QsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFFLENBQUM7UUFFN0YsVUFBVSxFQUFFLENBQUM7UUFFYixlQUFlLENBQUMsSUFBSSxDQUFFLE1BQU0sRUFBRTtZQUM3QixVQUFVLEVBQUUsSUFBSTtZQUNoQixVQUFVLEVBQUUsSUFBSTtZQUNoQixPQUFPLEVBQUUsaUJBQWlCO1lBQzFCLGFBQWEsRUFBRSxtQkFBbUI7WUFDbEMsV0FBVyxFQUFFLFFBQVE7U0FDckIsQ0FBRSxDQUFDO1FBSUosZUFBZSxDQUFDLFlBQVksQ0FBRSxhQUFhLENBQUUsQ0FBQztRQUU5QyxLQUFLLENBQUMscUJBQXFCLENBQUUsaUJBQWlCLENBQUUsQ0FBQyxPQUFPLEdBQUcsVUFBVSxFQUFFLENBQUM7UUFFeEUsS0FBSyxFQUFFLENBQUM7UUFHUixXQUFXLEVBQUUsQ0FBQztJQUNmLENBQUM7SUEvRWUsaUJBQUksT0ErRW5CLENBQUE7SUFFRCxTQUFTLE1BQU0sQ0FBRSxRQUFpQixFQUFFLFFBQWdCO1FBRW5ELE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyw2QkFBNkIsQ0FBRSxRQUFRLENBQUUsQ0FBQztRQUNuRSxPQUFPLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFhLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUM1RCxDQUFDO0lBS0QsU0FBUyxZQUFZLENBQUUsTUFBZSxFQUFFLFVBQWtCO1FBRXpELE1BQU0sS0FBSyxHQUFHLFVBQVUsQ0FBRSxNQUFNLENBQUUsQ0FBQztRQUNuQyxNQUFNLElBQUksR0FBRyxPQUFPLENBQUUsS0FBSyxDQUFDLElBQUksQ0FBRSxDQUFDO1FBQ25DLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyw2QkFBNkIsQ0FBRSxlQUFlLENBQUUsQ0FBQztRQUV4RSxJQUFJLElBQUksS0FBSyxTQUFTLElBQUksT0FBTyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQzlDO1lBQ0MsT0FBTztTQUNQO1FBRUQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUUsS0FBSyxDQUFDLElBQUksQ0FBRSxDQUFDO1FBQzdDLElBQUksSUFBSSxLQUFLLFNBQVMsRUFDdEI7WUFDQyxPQUFPO1NBQ1A7UUFFRCxNQUFNLFVBQVUsR0FBRyxVQUFVLENBQUUsSUFBSSxFQUFFLElBQUksQ0FBRSxDQUFDO1FBQzVDLE1BQU0sTUFBTSxHQUFHLFVBQVUsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBRSxVQUFVLEVBQUUsVUFBVSxDQUFFLENBQUM7UUFDcEYsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFFLENBQUMsQ0FBYSxDQUFDO1FBRXhDLFdBQVcsQ0FBQyxTQUFTLENBQUUsVUFBVSxDQUFFLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxFQUFFO1lBRW5ELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDM0MsTUFBTSxPQUFPLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxNQUFNLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxNQUFNLENBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztZQUMzRSxNQUFNLFFBQVEsR0FBRyxVQUFVLEdBQUcsSUFBSSxDQUFDLElBQUk7Z0JBQ3RDLENBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsSUFBSSxDQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFFLENBQUM7WUFFOUQsT0FBTyxDQUFDLGlCQUFpQixDQUFFLElBQUksQ0FBQyxJQUFJLEVBQ25DLGVBQWUsR0FBRyxRQUFRLEdBQUcsSUFBSSxHQUFHLE9BQU8sR0FBRyxTQUFTLENBQUUsQ0FBQztRQUM1RCxDQUFDLENBQUUsQ0FBQztRQUlKLE9BQU8sQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztJQUMxQixDQUFDO0lBVUQsTUFBTSxhQUFhLEdBQW9DLEVBQUUsQ0FBQztJQUUxRCxTQUFTLGdCQUFnQixDQUFFLE9BQWU7UUFFekMsT0FBTyxZQUFZLENBQUMsSUFBSSxDQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxPQUFPLENBQUUsQ0FBQztJQUMvRCxDQUFDO0lBSUQsU0FBUyxhQUFhLENBQUUsUUFBZ0I7UUFFdkMsTUFBTSxLQUFLLEdBQUcsU0FBUyxDQUFFLFFBQVEsQ0FBRSxDQUFDO1FBQ3BDLE1BQU0sSUFBSSxHQUFHLFlBQVksQ0FBQyxJQUFJLENBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBRSxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBRSxLQUFLLENBQUUsS0FBSyxTQUFTLENBQUUsQ0FBRSxDQUFDO1FBRXZHLE9BQU8sSUFBSSxJQUFJLGdCQUFnQixDQUFFLGFBQWEsQ0FBRSxRQUFRLENBQUUsQ0FBRSxJQUFJLFlBQVksQ0FBRSxDQUFDLENBQUUsQ0FBQztJQUNuRixDQUFDO0lBSUQsU0FBUyxhQUFhLENBQUUsTUFBZSxFQUFFLFFBQWdCLEVBQUUsT0FBZTtRQUd6RSxJQUFJLENBQUMsZ0JBQWdCLENBQUUsT0FBTyxDQUFFLEVBQ2hDO1lBQ0MsT0FBTztTQUNQO1FBRUQsYUFBYSxDQUFFLFFBQVEsQ0FBRSxHQUFHLE9BQU8sQ0FBQztRQUVwQyxNQUFNLEtBQUssR0FBRyxTQUFTLENBQUUsUUFBUSxDQUFFLENBQUM7UUFDcEMsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBRSxLQUFLLENBQUUsQ0FBQyxHQUFHLENBQUUsTUFBTSxDQUFFLENBQUM7UUFLL0MsSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLENBQUMsRUFDcEI7WUFDQyxlQUFlLENBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBRSxDQUFDO1lBQ3BDLE9BQU87U0FDUDtRQUlELEdBQUcsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLEVBQUUsR0FBRyxjQUFjLENBQUUsS0FBSyxDQUFFLEtBQUssQ0FBRSxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQztRQUM5RCxPQUFPLENBQUUsSUFBSSxDQUFFLENBQUM7SUFDakIsQ0FBQztJQUdELFNBQVMsVUFBVSxDQUFFLFFBQWdCLEVBQUUsT0FBZTtRQUVyRCxPQUFPLGFBQWEsR0FBRyxRQUFRLEdBQUcsR0FBRyxHQUFHLE9BQU8sQ0FBQztJQUNqRCxDQUFDO0lBSUQsU0FBUyxlQUFlLENBQUUsTUFBZSxFQUFFLFFBQWdCO1FBRTFELE1BQU0sSUFBSSxHQUFHLGFBQWEsQ0FBRSxRQUFRLENBQUUsQ0FBQztRQUd2QyxNQUFNLENBQUMsNkJBQTZCLENBQUUsZUFBZSxDQUFFLENBQUMsT0FBTyxDQUFFLE9BQU8sQ0FBQyxFQUFFO1lBRTFFLE9BQU8sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLGtCQUFrQixDQUFFLFdBQVcsRUFBRSxFQUFFLENBQUUsS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQy9FLENBQUMsQ0FBRSxDQUFDO1FBSUosTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLGlCQUFpQixDQUFFLFVBQVUsQ0FBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBRSxDQUFFLENBQUM7UUFDM0UsSUFBSSxLQUFLLEVBQ1Q7WUFDQyxLQUFLLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztTQUNyQjtJQUNGLENBQUM7SUFHRCxTQUFTLGNBQWMsQ0FBRSxNQUFlLEVBQUUsUUFBZ0I7UUFJekQsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLDZCQUE2QixDQUFFLGVBQWUsQ0FBRSxDQUFFLENBQUMsQ0FBRSxDQUFDO1FBQzdFLElBQUksQ0FBQyxPQUFPLEVBQ1o7WUFDQyxPQUFPO1NBQ1A7UUFFRCxZQUFZLENBQUMsT0FBTyxDQUFFLE1BQU0sQ0FBQyxFQUFFO1lBRTlCLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUUsYUFBYSxFQUFFLE9BQU8sRUFBRSxVQUFVLENBQUUsUUFBUSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUUsRUFDeEY7Z0JBQ0MsS0FBSyxFQUFFLGFBQWE7Z0JBRXBCLEtBQUssRUFBRSxVQUFVLEdBQUcsUUFBUTthQUM1QixDQUFhLENBQUM7WUFHZixDQUFDLENBQUMsV0FBVyxDQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUNoQztnQkFDQyxHQUFHLEVBQUUsdUNBQXVDLEdBQUUsTUFBTSxDQUFDLElBQUksR0FBRyxNQUFNO2dCQUNsRSxhQUFhLEVBQUUsSUFBSTtnQkFDbkIsWUFBWSxFQUFFLElBQUk7Z0JBQ2xCLE9BQU8sRUFBRSxnQ0FBZ0M7YUFDekMsQ0FBRSxDQUFDO1lBRUwsS0FBSyxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsR0FBRSxFQUFFLEdBQUUsYUFBYSxDQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFFLENBQUM7UUFDOUYsQ0FBQyxDQUFFLENBQUM7UUFFSixlQUFlLENBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBRSxDQUFDO0lBQ3JDLENBQUM7SUFJRCxTQUFnQixRQUFRLENBQUUsTUFBZSxFQUFFLFFBQWdCO1FBRTFELE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBRSxRQUFRLENBQUUsQ0FBQztRQUNqQyxJQUFJLElBQUksS0FBSyxTQUFTLEVBQ3RCO1lBRUMsT0FBTztTQUNQO1FBRUQsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFFLFFBQVEsQ0FBRSxDQUFDO1FBRXJDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxDQUFDO1FBR2pELE1BQU0sQ0FBQyxvQkFBb0IsQ0FBRSxLQUFLLEVBQUUsUUFBUSxDQUFFLENBQUM7UUFHL0MsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLE9BQU8sQ0FBQyxJQUFJLEVBQ2hDO1lBQ0MsY0FBYyxDQUFFLE1BQU0sRUFBRSxRQUFRLENBQUUsQ0FBQztTQUNuQztRQUdELE1BQU0sUUFBUSxHQUFhLEVBQUUsQ0FBQztRQUk5QixNQUFNLENBQUMsNkJBQTZCLENBQUUsU0FBUyxDQUFFLENBQUMsT0FBTyxDQUFFLE1BQU0sQ0FBQyxFQUFFO1lBRW5FLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxlQUFlLENBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFFLENBQUM7WUFDeEQsSUFBSSxLQUFLLEdBQUcsQ0FBQyxFQUNiO2dCQUNDLE9BQU87YUFDUDtZQUVELFVBQVUsQ0FBRSxNQUFNLENBQUUsQ0FBQztZQUNyQixRQUFRLENBQUMsSUFBSSxDQUFFLEtBQUssQ0FBRSxDQUFDO1lBR3ZCLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUUsS0FBSyxDQUFFLEtBQUssU0FBUyxFQUM1QzthQUVDO1lBR0QsTUFBTSxDQUFDLGVBQWUsQ0FBRSxXQUFXLEVBQUUsUUFBUSxDQUFFLENBQUM7WUFFaEQsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFFLEtBQUssQ0FBRSxDQUFDO1lBQ2pDLE1BQU0sQ0FBQyxXQUFXLENBQUUsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxDQUFDO1lBR3BELFlBQVksQ0FBRSxNQUFNLEVBQUUsRUFBRSxDQUFFLENBQUM7WUFFM0IsSUFBSSxRQUFRLEVBQ1o7Z0JBQ0MsYUFBYSxDQUFFLE1BQU0sRUFBRSxRQUFRLENBQUUsQ0FBQzthQUNsQztZQUdELE1BQU0sQ0FBQyxZQUFZLENBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxDQUFDO1lBR2xDLElBQUksUUFBUSxFQUNaO2dCQUNDLENBQUMsQ0FBQyxvQkFBb0IsQ0FBRSxXQUFXLEVBQUUsTUFBTSxFQUFFLENBQUUsRUFBVyxFQUFFLElBQW1CLEVBQUUsRUFBRTtvQkFFbEYsV0FBVyxHQUFHLFVBQVUsQ0FBRSxNQUFNLENBQUUsQ0FBQztvQkFFbkMsVUFBVSxDQUFFLFFBQVEsRUFBRSxJQUFJLENBQUUsQ0FBQztnQkFDOUIsQ0FBQyxDQUFFLENBQUM7Z0JBRUosQ0FBQyxDQUFDLG9CQUFvQixDQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsUUFBUSxDQUFFLENBQUM7YUFDdEQ7WUFFRCxDQUFDLENBQUMsb0JBQW9CLENBQUUsV0FBVyxFQUFFLE1BQU0sRUFBRSxHQUFFLEVBQUU7Z0JBR2hELE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBRSxNQUFNLENBQUUsQ0FBQztnQkFDbEMsTUFBTSxDQUFDLFdBQVcsQ0FBRSxvQkFBb0IsRUFBRSxNQUFNLENBQUUsQ0FBQztnQkFDbkQsTUFBTSxDQUFDLFdBQVcsQ0FBRSxzQkFBc0IsRUFBRSxDQUFDLE1BQU0sQ0FBRSxDQUFDO2dCQUl0RCxZQUFZLENBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUUsQ0FBQztnQkFFckQsbUJBQW1CLENBQUUsS0FBSyxDQUFFLENBQUM7WUFDOUIsQ0FBQyxDQUFFLENBQUM7WUFFSixDQUFDLENBQUMsb0JBQW9CLENBQUUsV0FBVyxFQUFFLE1BQU0sRUFBRSxHQUFFLEVBQUU7Z0JBRWhELGNBQWMsQ0FBRSxNQUFNLENBQUUsQ0FBQztnQkFDekIsbUJBQW1CLENBQUUsSUFBSSxDQUFFLENBQUM7WUFDN0IsQ0FBQyxDQUFFLENBQUM7WUFFSixDQUFDLENBQUMsb0JBQW9CLENBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxHQUFFLEVBQUU7Z0JBRS9DLGNBQWMsQ0FBRSxNQUFNLENBQUUsQ0FBQztnQkFDekIsVUFBVSxDQUFFLE1BQU0sQ0FBRSxDQUFDO1lBQ3RCLENBQUMsQ0FBRSxDQUFDO1lBSUosSUFBSSxjQUFjLElBQUksY0FBYyxDQUFDLElBQUksS0FBSyxRQUFRLElBQUksY0FBYyxDQUFDLElBQUksS0FBSyxLQUFLLEVBQ3ZGO2dCQUNDLGNBQWMsR0FBRyxJQUFJLENBQUM7Z0JBQ3RCLE1BQU0sQ0FBQyxZQUFZLENBQUUsa0JBQWtCLENBQUUsQ0FBQzthQUMxQztRQUNGLENBQUMsQ0FBRSxDQUFDO1FBSUosTUFBTSxDQUFDLElBQUksQ0FBRSxNQUFNLENBQUUsQ0FBQyxPQUFPLENBQUUsT0FBTyxDQUFDLEVBQUU7WUFFeEMsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFFLE9BQU8sQ0FBRSxDQUFDO1lBQ2hDLElBQUksUUFBUSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUUsSUFBSSxDQUFDLEVBQ2xDO2dCQUNDLE9BQU87YUFDUDtZQUtELE9BQU8sTUFBTSxDQUFFLEtBQUssQ0FBRSxDQUFDO1FBQ3hCLENBQUMsQ0FBRSxDQUFDO1FBR0osTUFBTSxDQUFDLFdBQVcsQ0FBRSxZQUFZLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBRSxNQUFNLENBQUUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUUsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFFLENBQUM7UUFFdEgsY0FBYyxDQUFFLE1BQU0sRUFBRSxRQUFRLENBQUUsQ0FBQztRQUluQyxlQUFlLEVBQUUsQ0FBQztJQUNuQixDQUFDO0lBckllLHFCQUFRLFdBcUl2QixDQUFBO0lBS0QsU0FBUyxVQUFVLENBQUUsTUFBZTtRQUVuQyxNQUFNLE1BQU0sR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLGVBQWUsRUFBRSxDQUFFLENBQUM7UUFDaEYsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxnQkFBZ0IsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLENBQUUsQ0FBQztRQUNwRixDQUFDLENBQUMsV0FBVyxDQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLGVBQWUsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLENBQUUsQ0FBQztJQUNoRixDQUFDO0lBS0QsU0FBUyxjQUFjLENBQUUsTUFBZSxFQUFFLFFBQWdCO1FBSXpELE1BQU0sV0FBVyxHQUFHLFNBQVMsQ0FBRSxRQUFRLENBQUUsQ0FBRSxDQUFDLENBQUUsQ0FBQztRQUMvQyxNQUFNLFVBQVUsR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBRSxXQUFXLENBQUMsU0FBUyxDQUFFLFdBQVcsQ0FBRSxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVwRixNQUFNLENBQUMsNkJBQTZCLENBQUUsb0JBQW9CLENBQUUsQ0FBQyxPQUFPLENBQUUsT0FBTyxDQUFDLEVBQUU7WUFFL0UsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLGtCQUFrQixDQUFFLGdCQUFnQixFQUFFLEVBQUUsQ0FBRSxDQUFDO1lBQ3BFLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUUsZUFBZSxFQUFFLENBQUMsQ0FBRSxDQUFDO1lBQzdELElBQUksUUFBUSxLQUFLLEVBQUUsSUFBSSxNQUFNLElBQUksQ0FBQyxFQUNsQztnQkFDQyxPQUFPO2FBQ1A7WUFHQyxPQUFvQixDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFFLFFBQVEsR0FBRyxHQUFHLEdBQUcsQ0FBRSxVQUFVLEdBQUcsTUFBTSxDQUFFLEVBQUUsT0FBTyxDQUFFLENBQUM7UUFDL0YsQ0FBQyxDQUFFLENBQUM7SUFDTCxDQUFDO0lBRUQsU0FBUyxhQUFhLENBQUUsTUFBZSxFQUFFLFdBQW1CO1FBRTNELE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBRSxNQUFNLEVBQUUsZ0JBQWdCLENBQUUsQ0FBQztRQUNuRCxJQUFJLENBQUMsT0FBTyxFQUNaO1lBQ0MsT0FBTztTQUNQO1FBRUQsT0FBTyxDQUFDLGdCQUFnQixDQUFFLFdBQVcsQ0FBQyxRQUFRLENBQUUsYUFBYSxFQUFFLFdBQVcsQ0FBRSxDQUFFLENBQUM7UUFDL0UsV0FBVyxDQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLFdBQVcsQ0FBQyxPQUFPLENBQUUsV0FBVyxDQUFFLENBQUUsQ0FBQztRQUNoRixnQkFBZ0IsQ0FBRSxNQUFNLENBQUUsQ0FBQztJQUM1QixDQUFDO0lBR0QsU0FBUyxnQkFBZ0IsQ0FBRSxNQUFlO1FBRXpDLElBQUksTUFBTSxDQUFDLDZCQUE2QixDQUFFLG9CQUFvQixDQUFFLENBQUMsTUFBTSxHQUFHLENBQUMsRUFDM0U7WUFDQyxPQUFPO1NBQ1A7UUFFRCxNQUFNLEtBQUssR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLG9CQUFvQixFQUFFLENBQUUsQ0FBQztRQUVyRixDQUFDLENBQUMsV0FBVyxDQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUNoQztZQUNDLEdBQUcsRUFBRSxtQ0FBbUM7WUFDeEMsYUFBYSxFQUFFLElBQUk7WUFDbkIsWUFBWSxFQUFFLElBQUk7WUFDbEIsT0FBTyxFQUFFLGdDQUFnQztTQUN6QyxDQUNELENBQUM7UUFFRixLQUFLLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxHQUFFLEVBQUUsR0FBRyxTQUFTLENBQUUsTUFBTSxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQztJQUNwRSxDQUFDO0lBSUQsTUFBTSxhQUFhLEdBQWdDLEVBQUUsQ0FBQztJQUV0RCxTQUFTLFdBQVcsQ0FBRSxNQUFlO1FBRXBDLE1BQU0sS0FBSyxHQUFHLFVBQVUsQ0FBRSxNQUFNLENBQUUsQ0FBQztRQUNuQyxNQUFNLE1BQU0sR0FBRyxnQkFBZ0IsQ0FBRSxLQUFLLENBQUMsSUFBSSxDQUFFLEdBQUcsR0FBRyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUM7UUFFakUsSUFBSSxhQUFhLENBQUUsTUFBTSxDQUFFLEdBQUcsQ0FBQyxFQUMvQjtZQUNDLE9BQU8sYUFBYSxDQUFFLE1BQU0sQ0FBRSxDQUFDO1NBQy9CO1FBR0QsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLGlCQUFpQixHQUFHLENBQUUsTUFBTSxDQUFDLGVBQWUsSUFBSSxDQUFDLENBQUUsQ0FBQztRQUN2RSxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsa0JBQWtCLEdBQUcsQ0FBRSxNQUFNLENBQUMsZUFBZSxJQUFJLENBQUMsQ0FBRSxDQUFDO1FBRXhFLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUN4QjtZQUNDLE9BQU8sQ0FBQyxDQUFDO1NBQ1Q7UUFFRCxhQUFhLENBQUUsTUFBTSxDQUFFLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUNwQyxPQUFPLGFBQWEsQ0FBRSxNQUFNLENBQUUsQ0FBQztJQUNoQyxDQUFDO0lBSUQsU0FBUyxVQUFVLENBQUUsTUFBYyxFQUFFLFdBQW1CLEVBQUUsS0FBMEI7UUFFbkYsTUFBTSxPQUFPLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBRSxXQUFXLENBQUUsQ0FBQztRQUNsRCxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQztRQUVoQyxPQUFPO1lBQ04sQ0FBQyxFQUFFLENBQUUsT0FBTyxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLE9BQU8sR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBRSxHQUFHLE1BQU07WUFDaEUsQ0FBQyxFQUFFLENBQUUsT0FBTyxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsTUFBTSxHQUFHLE9BQU8sQ0FBRSxHQUFHLE1BQU07U0FDaEUsQ0FBQztJQUNILENBQUM7SUFJRCxTQUFTLFdBQVcsQ0FBRSxNQUFlLEVBQUUsT0FBZ0IsRUFBRSxXQUFtQixFQUFFLEtBQTBCO1FBR3ZHLElBQUksV0FBVyxDQUFDLGNBQWMsQ0FBRSxLQUFLLENBQUUsRUFDdkM7WUFDQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUM7WUFDOUIsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDO1lBQy9CLE9BQU8sQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLE9BQU8sQ0FBQztZQUNsQyxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDN0IsT0FBTztTQUNQO1FBRUQsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFFLE1BQU0sQ0FBRSxDQUFDO1FBRXJDLElBQUksTUFBTSxJQUFJLENBQUMsRUFDZjtZQUVDLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztZQUM3QixXQUFXLENBQUUsTUFBTSxDQUFFLENBQUM7WUFDdEIsT0FBTztTQUNQO1FBRUQsTUFBTSxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLFVBQVUsQ0FBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLEtBQUssQ0FBRSxDQUFDO1FBRXBFLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLEdBQUcsSUFBSSxDQUFDO1FBQzlDLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLEdBQUcsSUFBSSxDQUFDO1FBSy9DLE1BQU0sR0FBRyxHQUFHLENBQUUsR0FBRyxHQUFHLEdBQUcsQ0FBRSxHQUFHLENBQUUsR0FBRyxHQUFHLEtBQUssQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFFLENBQUM7UUFDcEQsTUFBTSxHQUFHLEdBQUcsQ0FBRSxHQUFHLEdBQUcsR0FBRyxDQUFFLEdBQUcsQ0FBRSxHQUFHLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUUsQ0FBQztRQUVwRCxPQUFPLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxjQUFjLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsR0FBRyxrQkFBa0IsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxHQUFHLE1BQU0sQ0FBQztRQUM3RyxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7SUFDOUIsQ0FBQztJQUVELE1BQU0sbUJBQW1CLEdBQUcsQ0FBQyxDQUFDO0lBSTlCLFNBQVMsV0FBVyxDQUFFLE1BQWU7UUFFcEMsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLGVBQWUsQ0FBRSxrQkFBa0IsRUFBRSxDQUFDLENBQUUsQ0FBQztRQUMvRCxJQUFJLE1BQU0sSUFBSSxtQkFBbUIsRUFDakM7WUFDQyxPQUFPO1NBQ1A7UUFFRCxNQUFNLENBQUMsZUFBZSxDQUFFLGtCQUFrQixFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUUsQ0FBQztRQUV6RCxDQUFDLENBQUMsUUFBUSxDQUFFLENBQUMsRUFBRSxHQUFFLEVBQUU7WUFFbEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsRUFDckI7Z0JBQ0MsT0FBTzthQUNQO1lBRUQsTUFBTSxLQUFLLEdBQUcsVUFBVSxDQUFFLE1BQU0sQ0FBRSxDQUFDO1lBQ25DLE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBRSxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUUsQ0FBQztZQUVwRCxJQUFJLFFBQVEsRUFDWjtnQkFDQyxhQUFhLENBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBRSxDQUFDO2FBQ2xDO1FBQ0YsQ0FBQyxDQUFFLENBQUM7SUFDTCxDQUFDO0lBUUQsSUFBSSxVQUFVLEdBQXNFLElBQUksQ0FBQztJQUN6RixJQUFJLFdBQVcsR0FBdUIsU0FBUyxDQUFDO0lBR2hELE1BQU0sZ0JBQWdCLEdBQUcsR0FBRyxDQUFDO0lBRTdCLFNBQVMsU0FBUyxLQUFjLE9BQU8sS0FBSyxDQUFDLHFCQUFxQixDQUFFLGlCQUFpQixDQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzFGLFNBQVMsWUFBWSxDQUFFLFFBQWdCLElBQWUsT0FBTyxLQUFLLENBQUMscUJBQXFCLENBQUUsY0FBYyxHQUFHLFFBQVEsQ0FBYyxDQUFDLENBQUMsQ0FBQztJQUVwSSxTQUFnQixTQUFTLENBQUUsTUFBZTtRQUV6QyxNQUFNLEtBQUssR0FBRyxVQUFVLENBQUUsTUFBTSxDQUFFLENBQUM7UUFDbkMsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBRSxDQUFDO1FBRXBELElBQUksQ0FBQyxRQUFRLEVBQ2I7WUFDQyxPQUFPO1NBQ1A7UUFFRCxVQUFVLEVBQUUsQ0FBQztRQUViLFVBQVUsR0FBRyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxXQUFXLENBQUMsT0FBTyxDQUFFLFFBQVEsQ0FBRSxFQUFFLENBQUM7UUFDNUYsTUFBTSxDQUFDLFdBQVcsQ0FBRSxrQkFBa0IsRUFBRSxJQUFJLENBQUUsQ0FBQztRQUcvQyxNQUFNLENBQUMsWUFBWSxDQUFFLEtBQUssQ0FBRSxDQUFDO1FBRTdCLFdBQVcsQ0FBRSxVQUFVLENBQUMsS0FBSyxDQUFFLENBQUM7UUFFaEMsU0FBUyxFQUFFLENBQUMsV0FBVyxDQUFFLG9CQUFvQixFQUFFLElBQUksQ0FBRSxDQUFDO1FBQ3RELGNBQWMsQ0FBRSxNQUFNLENBQUUsQ0FBQztRQUN6QixpQkFBaUIsRUFBRSxDQUFDO0lBQ3JCLENBQUM7SUF2QmUsc0JBQVMsWUF1QnhCLENBQUE7SUFHRCxNQUFNLFdBQVcsR0FBRyxHQUFHLENBQUM7SUFDeEIsTUFBTSxXQUFXLEdBQUcsR0FBRyxDQUFDO0lBQ3hCLE1BQU0sYUFBYSxHQUFHLEVBQUUsQ0FBQztJQUl6QixTQUFTLGNBQWMsQ0FBRSxNQUFlO1FBRXZDLE1BQU0sS0FBSyxHQUFHLFNBQVMsRUFBRSxDQUFDO1FBQzFCLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxlQUFlLElBQUksQ0FBQyxDQUFDO1FBQzVDLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxlQUFlLElBQUksQ0FBQyxDQUFDO1FBRzVDLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyx5QkFBeUIsQ0FBRSxLQUFLLENBQUUsQ0FBQztRQUN0RCxNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQztRQUNqQyxNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQztRQUNqQyxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsaUJBQWlCLEdBQUcsUUFBUSxDQUFDO1FBQ3BELE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxrQkFBa0IsR0FBRyxRQUFRLENBQUM7UUFDckQsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLGlCQUFpQixHQUFHLFFBQVEsQ0FBQztRQUNuRCxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsa0JBQWtCLEdBQUcsUUFBUSxDQUFDO1FBRXBELE1BQU0sT0FBTyxHQUFHLE9BQU8sR0FBRyxPQUFPLEdBQUcsYUFBYSxDQUFDO1FBQ2xELE1BQU0sR0FBRyxHQUFHLENBQUUsT0FBTyxHQUFHLFdBQVcsSUFBSSxPQUFPLENBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsV0FBVyxHQUFHLGFBQWEsQ0FBQztRQUVuRyxNQUFNLFFBQVEsR0FBRyxPQUFPLEdBQUcsT0FBTyxHQUFHLENBQUMsR0FBRyxXQUFXLEdBQUcsQ0FBQyxDQUFDO1FBQ3pELE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUUsYUFBYSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUUsT0FBTyxHQUFHLFdBQVcsR0FBRyxhQUFhLEVBQUUsUUFBUSxDQUFFLENBQUUsQ0FBQztRQUVuRyxLQUFLLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFFLGFBQWEsRUFBRSxHQUFHLENBQUUsQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLEdBQUcsS0FBSyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLEdBQUcsU0FBUyxDQUFDO0lBQzNHLENBQUM7SUFFRCxTQUFTLFdBQVcsQ0FBRSxLQUEwQjtRQUUvQyxNQUFNLEtBQUssR0FDWDtZQUNDLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxXQUFXLENBQUMsY0FBYyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFO1lBQy9FLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBSyxHQUFHLEVBQUUsQ0FBQyxFQUFJLEdBQUcsRUFBRSxHQUFHLEVBQXlCLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxFQUFFO1lBQzVFLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBSyxHQUFHLEVBQUUsQ0FBQyxFQUFJLEdBQUcsRUFBRSxHQUFHLEVBQXlCLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxFQUFFO1NBQzVFLENBQUM7UUFFRixLQUFLLENBQUMsT0FBTyxDQUFFLEdBQUcsQ0FBQyxFQUFFO1lBRXBCLE1BQU0sUUFBUSxHQUFHLFlBQVksQ0FBRSxHQUFHLENBQUMsS0FBSyxDQUFFLENBQUM7WUFDM0MsSUFBSSxDQUFDLFFBQVEsRUFDYjtnQkFDQyxPQUFPO2FBQ1A7WUFJRCxRQUFRLENBQUMsZUFBZSxDQUFFLGdCQUFnQixDQUFFLENBQUM7WUFFN0MsUUFBUSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDO1lBQ3ZCLFFBQVEsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQztZQUN2QixRQUFRLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUM7WUFFM0IsUUFBUSxDQUFDLGFBQWEsQ0FBRSxnQkFBZ0IsRUFBRSxlQUFlLENBQUUsQ0FBQztRQUM3RCxDQUFDLENBQUUsQ0FBQztJQUNMLENBQUM7SUFJRCxTQUFTLGlCQUFpQjtRQUV6QixJQUFJLENBQUMsVUFBVSxFQUNmO1lBQ0MsT0FBTztTQUNQO1FBRUQsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFFLFVBQVUsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBRSxDQUFDO1FBQzlELE1BQU0sTUFBTSxHQUFHLFVBQVUsQ0FBRSxVQUFVLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUUsQ0FBQztRQUU5RCxJQUFJLENBQUMsUUFBUSxJQUFJLENBQUMsTUFBTSxFQUN4QjtZQUNDLE9BQU87U0FDUDtRQUVELE1BQU0sTUFBTSxHQUFHLFdBQVcsQ0FBRSxNQUFNLENBQUUsQ0FBQztRQUNyQyxJQUFJLE1BQU0sSUFBSSxDQUFDLEVBQ2Y7WUFDQyxPQUFPO1NBQ1A7UUFHRCxNQUFNLElBQUksR0FBRyxVQUFVLENBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxVQUFVLENBQUMsS0FBSyxDQUFFLENBQUM7UUFFOUQsYUFBYSxDQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBRSxDQUFDO1FBQ3JDLGFBQWEsQ0FBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUUsQ0FBQztJQUN0QyxDQUFDO0lBR0QsU0FBUyxhQUFhLENBQUUsUUFBZ0IsRUFBRSxPQUFnQjtRQUV6RCxNQUFNLFFBQVEsR0FBRyxZQUFZLENBQUUsUUFBUSxDQUFFLENBQUM7UUFFMUMsUUFBUSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDM0IsUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDLFdBQVcsQ0FBRSx3QkFBd0IsRUFBRSxDQUFDLE9BQU8sQ0FBRSxDQUFDO0lBQ3hFLENBQUM7SUFFRCxTQUFTLFlBQVk7UUFFcEIsT0FBTztZQUNOLENBQUMsRUFBSyxZQUFZLENBQUUsR0FBRyxDQUFFLENBQUMsS0FBSztZQUMvQixDQUFDLEVBQUssWUFBWSxDQUFFLEdBQUcsQ0FBRSxDQUFDLEtBQUs7WUFDL0IsSUFBSSxFQUFFLFlBQVksQ0FBRSxNQUFNLENBQUUsQ0FBQyxLQUFLO1NBQ2xDLENBQUM7SUFDSCxDQUFDO0lBR0QsU0FBUyxlQUFlO1FBRXZCLElBQUksQ0FBQyxVQUFVLEVBQ2Y7WUFDQyxPQUFPO1NBQ1A7UUFFRCxVQUFVLENBQUMsS0FBSyxHQUFHLFlBQVksRUFBRSxDQUFDO1FBQ2xDLGFBQWEsRUFBRSxDQUFDO1FBQ2hCLGlCQUFpQixFQUFFLENBQUM7UUFFcEIsSUFBSSxXQUFXLEtBQUssU0FBUyxFQUM3QjtZQUNDLENBQUMsQ0FBQyxlQUFlLENBQUUsV0FBVyxDQUFFLENBQUM7U0FDakM7UUFFRCxXQUFXLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxnQkFBZ0IsRUFBRSxZQUFZLENBQUUsQ0FBQztJQUM1RCxDQUFDO0lBRUQsU0FBUyxhQUFhO1FBRXJCLElBQUksQ0FBQyxVQUFVLEVBQ2Y7WUFDQyxPQUFPO1NBQ1A7UUFFRCxNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUUsVUFBVSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFFLENBQUM7UUFDOUQsTUFBTSxNQUFNLEdBQUcsVUFBVSxDQUFFLFVBQVUsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBRSxDQUFDO1FBRTlELElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxRQUFRLEVBQ3hCO1lBQ0MsT0FBTztTQUNQO1FBRUQsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFFLE1BQU0sRUFBRSxnQkFBZ0IsQ0FBRSxDQUFDO1FBQ25ELElBQUksT0FBTyxFQUNYO1lBQ0MsV0FBVyxDQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLFVBQVUsQ0FBQyxLQUFLLENBQUUsQ0FBQztTQUMzRDtJQUNGLENBQUM7SUFHRCxTQUFTLFlBQVk7UUFFcEIsV0FBVyxHQUFHLFNBQVMsQ0FBQztRQUV4QixJQUFJLENBQUMsVUFBVSxFQUNmO1lBQ0MsT0FBTztTQUNQO1FBRUQsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFFLFVBQVUsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBRSxDQUFDO1FBRTlELElBQUksQ0FBQyxRQUFRLEVBQ2I7WUFDQyxPQUFPO1NBQ1A7UUFFRCxNQUFNLE1BQU0sR0FBRyxXQUFXLENBQUMsU0FBUyxDQUFFLFFBQVEsRUFBRSxVQUFVLENBQUMsS0FBSyxDQUFFLENBQUM7UUFDbkUsSUFBSSxNQUFNLEtBQUssUUFBUSxFQUN2QjtZQUNDLE9BQU87U0FDUDtRQUVELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxlQUFlLENBQUUsYUFBYSxFQUFFLFFBQVEsRUFBRSxNQUFNLENBQUUsRUFDeEU7WUFFQyxPQUFPO1NBQ1A7UUFFRCxTQUFTLENBQUUsVUFBVSxDQUFDLElBQUksQ0FBRSxDQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUUsR0FBRyxNQUFNLENBQUM7UUFFekQsTUFBTSxNQUFNLEdBQUcsVUFBVSxDQUFFLFVBQVUsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBRSxDQUFDO1FBQzlELE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFFLE1BQU0sRUFBRSxnQkFBZ0IsQ0FBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDbkUsSUFBSSxPQUFPLEVBQ1g7WUFDQyxPQUFPLENBQUMsZ0JBQWdCLENBQUUsV0FBVyxDQUFDLFFBQVEsQ0FBRSxhQUFhLEVBQUUsTUFBTSxDQUFFLENBQUUsQ0FBQztTQUMxRTtJQUNGLENBQUM7SUFFRCxTQUFnQixVQUFVO1FBRXpCLElBQUksQ0FBQyxVQUFVLEVBQ2Y7WUFDQyxPQUFPO1NBQ1A7UUFFRCxXQUFXLENBQUUsV0FBVyxDQUFDLGFBQWEsQ0FBRSxDQUFDO1FBQ3pDLGVBQWUsRUFBRSxDQUFDO0lBQ25CLENBQUM7SUFUZSx1QkFBVSxhQVN6QixDQUFBO0lBR0QsU0FBZ0IsVUFBVTtRQUV6QixJQUFJLFdBQVcsS0FBSyxTQUFTLEVBQzdCO1lBQ0MsQ0FBQyxDQUFDLGVBQWUsQ0FBRSxXQUFXLENBQUUsQ0FBQztZQUNqQyxXQUFXLEdBQUcsU0FBUyxDQUFDO1lBQ3hCLFlBQVksRUFBRSxDQUFDO1NBQ2Y7UUFFRCxJQUFJLFVBQVUsRUFDZDtZQUNDLE1BQU0sTUFBTSxHQUFHLFVBQVUsQ0FBRSxVQUFVLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUUsQ0FBQztZQUM5RCxJQUFJLE1BQU0sRUFDVjtnQkFDQyxNQUFNLENBQUMsV0FBVyxDQUFFLGtCQUFrQixFQUFFLEtBQUssQ0FBRSxDQUFDO2dCQUNoRCxNQUFNLENBQUMsWUFBWSxDQUFFLElBQUksQ0FBRSxDQUFDO2FBQzVCO1NBQ0Q7UUFFRCxVQUFVLEdBQUcsSUFBSSxDQUFDO1FBQ2xCLFNBQVMsRUFBRSxDQUFDLFdBQVcsQ0FBRSxvQkFBb0IsRUFBRSxLQUFLLENBQUUsQ0FBQztJQUN4RCxDQUFDO0lBckJlLHVCQUFVLGFBcUJ6QixDQUFBO0lBRUQsU0FBUyxRQUFRLENBQUUsS0FBYSxFQUFFLEtBQWEsRUFBRSxXQUFtQjtRQUVuRSxNQUFNLFVBQVUsR0FBRyxVQUFVLENBQUUsS0FBSyxFQUFFLEtBQUssQ0FBRSxDQUFDO1FBRTlDLE9BQU8sVUFBVSxLQUFLLFNBQVMsSUFBSSxXQUFXLENBQUMsT0FBTyxDQUFFLFdBQVcsRUFBRSxVQUFVLENBQUUsQ0FBQztJQUNuRixDQUFDO0lBRUQsU0FBUyxVQUFVLENBQUUsS0FBYSxFQUFFLEtBQWE7UUFFaEQsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLDZCQUE2QixDQUFFLFNBQVMsQ0FBRSxDQUFDLE1BQU0sQ0FBRSxNQUFNLENBQUMsRUFBRTtZQUVoRixNQUFNLEtBQUssR0FBRyxVQUFVLENBQUUsTUFBTSxDQUFFLENBQUM7WUFDbkMsT0FBTyxLQUFLLENBQUMsSUFBSSxLQUFLLEtBQUssSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLEtBQUssQ0FBQztRQUNyRCxDQUFDLENBQUUsQ0FBQztRQUdKLElBQUksTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQ3JCO1NBRUM7UUFFRCxPQUFPLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUMvQyxDQUFDO0lBSUQsU0FBUyxRQUFRLENBQUUsTUFBZTtRQUVqQyxNQUFNLEtBQUssR0FBRyxVQUFVLENBQUUsTUFBTSxDQUFFLENBQUM7UUFFbkMsSUFBSSxDQUFDLFFBQVEsQ0FBRSxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsY0FBYyxDQUFFLEVBQ3ZEO1lBQ0MsT0FBTyxLQUFLLENBQUM7U0FDYjtRQUVELE1BQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQztRQUN6QixJQUFJLENBQUMsSUFBSSxFQUNUO1lBQ0MsT0FBTyxJQUFJLENBQUM7U0FDWjtRQUVELE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBRSxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUUsQ0FBQztRQUV4RCxJQUFJLENBQUMsWUFBWSxJQUFJLENBQUUsSUFBSSxDQUFDLElBQUksS0FBSyxLQUFLLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssS0FBSyxDQUFDLElBQUksQ0FBRSxFQUM3RTtZQUNDLE9BQU8sSUFBSSxDQUFDO1NBQ1o7UUFFRCxPQUFPLFFBQVEsQ0FBRSxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsWUFBWSxDQUFFLENBQUM7SUFDdkQsQ0FBQztJQUVELFNBQVMsY0FBYyxDQUFFLE1BQWU7UUFFdkMsTUFBTSxDQUFDLFdBQVcsQ0FBRSxvQkFBb0IsRUFBRSxLQUFLLENBQUUsQ0FBQztRQUNsRCxNQUFNLENBQUMsV0FBVyxDQUFFLHNCQUFzQixFQUFFLEtBQUssQ0FBRSxDQUFDO1FBQ3BELFlBQVksQ0FBRSxNQUFNLEVBQUUsRUFBRSxDQUFFLENBQUM7SUFDNUIsQ0FBQztJQU9ELFNBQVMsZUFBZTtRQUV2QixNQUFNLFNBQVMsR0FBRyxjQUFjLEtBQUssRUFBRSxDQUFDO1FBRXhDLEtBQUssQ0FBQyw2QkFBNkIsQ0FBRSxTQUFTLENBQUUsQ0FBQyxPQUFPLENBQUUsTUFBTSxDQUFDLEVBQUU7WUFFbEUsTUFBTSxDQUFDLFdBQVcsQ0FBRSxtQkFBbUIsRUFBRSxTQUFTLElBQUksUUFBUSxDQUFFLE1BQU0sQ0FBRSxDQUFFLENBQUM7WUFDM0UsY0FBYyxDQUFFLE1BQU0sQ0FBRSxDQUFDO1FBQzFCLENBQUMsQ0FBRSxDQUFDO0lBQ0wsQ0FBQztJQUdELFNBQVMsbUJBQW1CLENBQUUsV0FBbUIsRUFBRSxJQUFtQjtRQUVyRSxXQUFXLEdBQUcsSUFBSSxDQUFDO1FBQ25CLFVBQVUsQ0FBRSxXQUFXLEVBQUUsSUFBSSxDQUFFLENBQUM7SUFDakMsQ0FBQztJQUVELFNBQVMsVUFBVSxDQUFFLFdBQW1CLEVBQUUsSUFBbUI7UUFJNUQsTUFBTSxXQUFXLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLGVBQWUsRUFBRSxFQUFFLEVBQUUsRUFDbEUsRUFBRSxLQUFLLEVBQUUsZUFBZSxFQUFFLE9BQU8sRUFBRSxrQ0FBa0MsRUFBRSxDQUFhLENBQUM7UUFFdEYsV0FBVyxDQUFDLGdCQUFnQixDQUFFLFdBQVcsQ0FBQyxRQUFRLENBQUUsYUFBYSxFQUFFLFdBQVcsQ0FBRSxDQUFFLENBQUM7UUFHbkYsY0FBYyxHQUFHLFdBQVcsQ0FBQztRQUM3QixjQUFjLEdBQUcsV0FBVyxDQUFDO1FBQzdCLGVBQWUsR0FBRyxLQUFLLENBQUM7UUFFeEIsSUFBSSxDQUFDLFlBQVksR0FBRyxXQUFXLENBQUM7UUFDaEMsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDbEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDbEIsSUFBSSxDQUFDLHdCQUF3QixHQUFHLEtBQUssQ0FBQztRQUV0QyxlQUFlLEVBQUUsQ0FBQztRQUdsQixtQkFBbUIsQ0FBRSxJQUFJLENBQUUsQ0FBQztRQUc1QixDQUFDLENBQUMsYUFBYSxDQUFFLHFCQUFxQixFQUFFLHNCQUFzQixFQUFFLE9BQU8sQ0FBRSxDQUFDO0lBQzNFLENBQUM7SUFHRCxTQUFTLG1CQUFtQixDQUFFLFdBQW9CO1FBRWpELElBQUksY0FBYyxJQUFJLGNBQWMsQ0FBQyxPQUFPLEVBQUUsRUFDOUM7WUFDQyxjQUFjLENBQUMsV0FBVyxDQUFFLHVCQUF1QixFQUFFLFdBQVcsSUFBSSxDQUFDLENBQUMsV0FBVyxDQUFFLENBQUM7U0FDcEY7SUFDRixDQUFDO0lBSUQsU0FBZ0IsVUFBVTtRQUV6QixJQUFJLGNBQWMsSUFBSSxjQUFjLENBQUMsT0FBTyxFQUFFLEVBQzlDO1lBQ0MsY0FBYyxDQUFDLFdBQVcsQ0FBRSxHQUFHLENBQUUsQ0FBQztTQUNsQztRQUVELGNBQWMsR0FBRyxFQUFFLENBQUM7UUFDcEIsV0FBVyxHQUFHLElBQUksQ0FBQztRQUNuQixjQUFjLEdBQUcsSUFBSSxDQUFDO0lBQ3ZCLENBQUM7SUFWZSx1QkFBVSxhQVV6QixDQUFBO0lBR0QsU0FBUyxRQUFRO1FBRWhCLE1BQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQztRQUN6QixNQUFNLFFBQVEsR0FBRyxlQUFlLENBQUM7UUFFakMsVUFBVSxFQUFFLENBQUM7UUFDYixlQUFlLEVBQUUsQ0FBQztRQUdsQixlQUFlLENBQUMsYUFBYSxDQUFFLElBQUksQ0FBRSxDQUFDO1FBSXRDLElBQUksQ0FBQyxRQUFRLEVBQ2I7WUFDQyxhQUFhLEVBQUUsQ0FBQztZQUdoQixJQUFJLElBQUksRUFDUjtnQkFDQyxZQUFZLENBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFFLENBQUM7YUFDckM7U0FDRDtJQUNGLENBQUM7SUFFRCxTQUFTLFlBQVksQ0FBRSxLQUFhLEVBQUUsS0FBYTtRQUVsRCxNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUUsS0FBSyxFQUFFLEtBQUssQ0FBRSxDQUFDO1FBQzdDLElBQUksQ0FBQyxXQUFXLEVBQ2hCO1lBQ0MsT0FBTztTQUNQO1FBRUQsSUFBSSxjQUFjLENBQUUsV0FBVyxDQUFFLEtBQUssRUFBRSxFQUN4QztZQUlDLE1BQU0sTUFBTSxHQUFHLFVBQVUsQ0FBRSxLQUFLLEVBQUUsS0FBSyxDQUFFLENBQUM7WUFDMUMsSUFBSSxNQUFNLEVBQ1Y7Z0JBQ0MsTUFBTSxDQUFDLFlBQVksQ0FBRSxpQkFBaUIsQ0FBRSxDQUFDO2FBQ3pDO1lBRUQsT0FBTztTQUNQO1FBRUQsT0FBTyxDQUFFLElBQUksQ0FBRSxDQUFDO0lBQ2pCLENBQUM7SUFHRCxTQUFTLGFBQWE7UUFFckIsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxxQkFBcUIsRUFBRSx3QkFBd0IsRUFBRSxPQUFPLENBQUUsQ0FBQztJQUM3RSxDQUFDO0lBRUQsU0FBUyxVQUFVLENBQUUsTUFBZTtRQUduQyxVQUFVLEVBQUUsQ0FBQztRQUdiLGVBQWUsR0FBRyxJQUFJLENBQUM7UUFFdkIsTUFBTSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLFVBQVUsQ0FBRSxNQUFNLENBQUUsQ0FBQztRQUUxRCxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxjQUFjLEtBQUssRUFBRSxFQUNuRDtZQUNDLE9BQU87U0FDUDtRQUVELElBQUksQ0FBQyxRQUFRLENBQUUsTUFBTSxDQUFFLEVBQ3ZCO1lBQ0MsTUFBTSxDQUFDLFlBQVksQ0FBRSxpQkFBaUIsQ0FBRSxDQUFDO1lBQ3pDLGFBQWEsRUFBRSxDQUFDO1lBQ2hCLE9BQU87U0FDUDtRQUVELE1BQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQztRQUN6QixJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLEtBQUssSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLEtBQUssRUFDdEQ7WUFDQyxPQUFPO1NBQ1A7UUFFRCxNQUFNLFlBQVksR0FBRyxRQUFRLENBQUUsS0FBSyxFQUFFLEtBQUssQ0FBRSxDQUFDO1FBQzlDLElBQUksU0FBUyxHQUFHLEVBQUUsQ0FBQztRQUluQixJQUFJLFlBQVksRUFDaEI7WUFDQyxTQUFTLEdBQUcsZUFBZSxDQUFFLFlBQVksRUFBRSxLQUFLLEVBQUUsV0FBVyxDQUFDLGFBQWEsQ0FBRSxDQUFDO1lBRTlFLElBQUksU0FBUyxLQUFLLEVBQUUsRUFDcEI7Z0JBR0MsYUFBYSxFQUFFLENBQUM7Z0JBQ2hCLE9BQU87YUFDUDtTQUNEO1FBRUQsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUUsY0FBYyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUUsQ0FBQyxDQUFDO1lBQ3pFLGFBQWEsQ0FBRSxjQUFjLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBRSxDQUFDO1FBRS9DLElBQUksU0FBUyxLQUFLLEVBQUUsRUFDcEI7WUFHQyxhQUFhLEVBQUUsQ0FBQztZQUdoQixJQUFJLFNBQVMsS0FBSyxFQUFFLEVBQ3BCO2dCQUNDLGVBQWUsQ0FBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBRSxDQUFDO2FBQzNDO1NBQ0Q7YUFFRDtZQUlDLElBQUksU0FBUyxLQUFLLEVBQUUsRUFDcEI7Z0JBQ0MsSUFBSSxJQUFJLEVBQ1I7b0JBQ0MsZUFBZSxDQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUUsQ0FBQztpQkFDbkQ7cUJBRUQ7b0JBQ0MsY0FBYyxDQUFFLFNBQVMsQ0FBRSxDQUFDO2lCQUM1QjthQUNEO1lBR0QsY0FBYyxHQUFHLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUM7WUFDOUMsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxxQkFBcUIsRUFBRSx3QkFBd0IsRUFBRSxPQUFPLENBQUUsQ0FBQztTQUM1RTtRQUVELE9BQU8sQ0FBRSxDQUFDLElBQUksQ0FBRSxDQUFDO0lBQ2xCLENBQUM7QUFDRixDQUFDLEVBeHlEUyxZQUFZLEtBQVosWUFBWSxRQXd5RHJCIn0=