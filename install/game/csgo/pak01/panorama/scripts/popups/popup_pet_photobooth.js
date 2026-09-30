"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../inspect.ts" />
/// <reference path="../common/characteranims.ts" />
/// <reference path="../context_menus/context_menu_color_picker.ts" />
/// <reference path="../popups/pet_photo_tag.ts" />
/// <reference path="../popups/pet_photo_library.ts" />
var PopupPetPhotoBooth;
(function (PopupPetPhotoBooth) {
    const _m_cp = $.GetContextPanel();
    const _m_elPhotoFrame = $.GetContextPanel().FindChildInLayoutFile('id-photo-booth-frame');
    const _m_elItemModelImagePanel = _m_cp.FindChildInLayoutFile('id-pet-model');
    // The panel a photo is composed from - the layer is named on it and the JPEG written off it.
    const _m_elCaptured = _m_cp.FindChildInLayoutFile('id-pet-model-container');
    let _m_petId = '';
    let _m_elCloseBtn = null;
    let _m_currentPose = PetPhotoTag.POSES[0];
    let _m_photoBoothUpgradeLevel = 0;
    let _m_petSpawnedForPhotoBooth = false;
    let _m_elSelectedControls;
    let _m_photoFilter;
    let _m_lastSavedPhoto = '';
    let m_aspectRatio = '';
    let _m_currentAttachment = '';
    // Tracked so a photo name can carry the scene; the studio alone has a backdrop behind the pet.
    const STUDIO_STAGE = 'ui/pet_photo_studio';
    let _m_currentStage = STUDIO_STAGE;
    const DEFAULT_WALLPAPER = '1';
    let _m_currentWallpaper = DEFAULT_WALLPAPER;
    // The setup the book handed back, read once. Empty when the booth was opened any other way.
    let _m_setupValues = {};
    function Init() {
        const popupPetParams = _m_cp.GetAttributeString('pet_id', '').split(',');
        _m_petId = (popupPetParams && (popupPetParams.length > 0)) ? popupPetParams[0] : '';
        _m_setupValues = _ReadSetup(_m_cp.GetAttributeString('booth_setup', ''));
        // The booth covers the vanity chickens; its own pet pecks on the UI mixgroup instead.
        GameInterfaceAPI.SetChickenAudioSuppressed('pet_photobooth', true);
        _m_cp.GetParent().GetParent().SetHasClass('pet-event-blur', true);
        _SetupCloseBtn('id-pet-photo-close-btn');
        // Only shown when opened from the book.
        _m_cp.FindChildTraverse('id-pet-photo-book-btn').visible = _m_cp.GetAttributeInt('from_book', 0) === 1;
        _SetUpPhotoBooth(_m_petId);
    }
    PopupPetPhotoBooth.Init = Init;
    function _SetupCloseBtn(btnId) {
        const callbackHandle = _m_cp.GetAttributeInt('callback', -1);
        const closeButton = _m_cp.FindChildTraverse(btnId);
        _m_elCloseBtn = closeButton;
        closeButton.SetPanelEvent('onactivate', () => {
            _CancelPhotoJobs();
            GameInterfaceAPI.SetChickenAudioSuppressed('pet_photobooth', false);
            if (callbackHandle >= 0) {
                UiToolkitAPI.InvokeJSCallback(callbackHandle);
            }
            $.DispatchEvent('UIPopupButtonClicked', '');
            $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.mainmenu_press_quit', 'MOUSE');
        });
    }
    // Book first, then close: the book's dim covers the booth right away. UIPopupButtonClicked bubbles
    // to the popup that owns the dispatching panel, so the close still lands on the booth.
    function OpenBook() {
        UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_pet_book.xml', 'spread=' + _m_cp.GetAttributeString('book_spread', '0')
            + '&' + 'booth_setup=' + _SetupString()
            + '&' + 'from_booth=1');
        Close();
    }
    PopupPetPhotoBooth.OpenBook = OpenBook;
    // Escape. Routed through the close button so cancelling runs the same teardown as clicking Close.
    function Close() {
        if (_m_elCloseBtn && _m_elCloseBtn.IsValid()) {
            $.DispatchEvent('Activated', _m_elCloseBtn, 'keyboard');
        }
    }
    PopupPetPhotoBooth.Close = Close;
    function _ResetMapEntities(mapName, elItemModelPreviewPanel) {
        if (mapName === 'de_nuke_vanity') {
            InspectModelImage.SetSpotlightBrightness(elItemModelPreviewPanel);
        }
        else {
            InspectModelImage.SetSunBrightness(elItemModelPreviewPanel);
        }
        InspectModelImage.DisableItemLighting(elItemModelPreviewPanel);
    }
    // In the order they are shown. filter-strength trails the list because it is the one row that is
    // not in the Adjust panel - it sits with the filters, whose strength it tunes.
    const aAdjust = [
        { type: 'exposure', kind: 'post-pair', min: -1, max: 1, default: 0, down: 'pet_post_exposure_down', up: 'pet_post_exposure_up' },
        { type: 'saturation', kind: 'post-pair', min: -1, max: 1, default: 0, down: 'pet_post_saturation_down', up: 'pet_post_saturation_up' },
        { type: 'vibrance', kind: 'post-pair', min: -1, max: 1, default: 0, down: 'pet_post_vibrance_down', up: 'pet_post_vibrance_up' },
        { type: 'brightness', kind: 'brightness', min: .8, max: 2, default: 1 },
        { type: 'bloom', kind: 'post-single', min: 0, max: 1, default: 0, entity: 'pet_post_bloom' },
        { type: 'contrast', kind: 'post-pair', min: -1, max: 1, default: 0, down: 'pet_post_contrast_down', up: 'pet_post_contrast_up' },
        { type: 'vignette', kind: 'overlay', min: 0, max: .8, default: .14, panel_id: 'id-pet-photo-overlay' },
        { type: 'grain', kind: 'overlay', min: 0, max: .7, default: 0, panel_id: 'id-pet-photo-grain' },
        { type: 'grime', kind: 'overlay', min: 0, max: .5, default: 0, panel_id: 'id-pet-photo-grime' },
        { type: 'filter-strength', kind: 'filter', min: 0, max: 1, default: 1 },
    ];
    const aWallpapers = [
        { skin: '0', swatch: '' },
        { skin: '1', swatch: 'blue' },
        { skin: '2', swatch: 'green' },
        { skin: '3', swatch: 'purple' },
        { skin: '4', swatch: 'yellow' },
        { skin: '5', swatch: 'brown' },
        { skin: '6', swatch: 'red' },
        { skin: '7', swatch: 'black' },
        { skin: '8', swatch: 'sky' },
        { skin: '10', swatch: 'abstract' },
    ];
    // Doubles as the layout's bare-head button and the name a setup uses.
    const NO_HEADWEAR = 'none';
    const SETUP_PAIR_SEPARATOR = ';';
    const SETUP_KEY_VALUE_SEPARATOR = ':';
    // Every slider is a field too, so the adjust table is the only place their list is written down.
    const aSetupFields = [
        { key: 'stage', Read: () => _StageNameForMap(_m_currentStage) },
        { key: 'paper', Read: () => _m_currentWallpaper, Apply: _SelectWallpaper },
        { key: 'pose', Read: () => _m_currentPose.name, Apply: _SelectPose },
        { key: 'aspect', Read: () => m_aspectRatio, Apply: _SelectAspect },
        { key: 'filter', Read: () => _m_photoFilter || 'normal', Apply: _SelectFilter },
        { key: 'headwear', Read: () => _HeadwearNameForModel(_m_currentAttachment), Apply: _SelectHeadwear },
        ...aAdjust.map(adjust => ({
            key: adjust.type,
            Read: () => String(_SliderValue(adjust)),
            Apply: (strValue) => _SetSliderValue(adjust, strValue),
        })),
    ];
    function _SetupString() {
        return aSetupFields
            .map(field => field.key + SETUP_KEY_VALUE_SEPARATOR + field.Read())
            .join(SETUP_PAIR_SEPARATOR);
    }
    function _ReadSetup(strSetup) {
        const values = {};
        strSetup.split(SETUP_PAIR_SEPARATOR).forEach(strPair => {
            const nSplit = strPair.indexOf(SETUP_KEY_VALUE_SEPARATOR);
            if (nSplit > 0) {
                values[strPair.substring(0, nSplit)] = strPair.substring(nSplit + 1);
            }
        });
        return values;
    }
    function _ApplySetup() {
        // Walked in field order rather than string order: a key that is not one of ours is left alone,
        // and a field the string does not carry keeps the default already set.
        aSetupFields.forEach(field => {
            const strValue = _m_setupValues[field.key];
            if (field.Apply && strValue !== undefined) {
                field.Apply(strValue);
            }
        });
    }
    // The map to open on. A stage the setup does not name, or that this pet has not earned, is the
    // studio - the same place a booth opened from the pet card starts.
    function _SetupStageMap() {
        const row = PetPhotoTag.STAGES.find(entry => entry.name === _m_setupValues['stage']);
        return row && _BStageUnlocked(row) ? row.map : STUDIO_STAGE;
    }
    // A wallpaper is a skin on the studio backdrop, so its number is its name. The layout is the list
    // of them - a skin with no button is one we do not offer.
    function _WallpaperBtnId(strSkin) {
        return 'id-photo-backdrop-' + strSkin;
    }
    function _SelectWallpaper(strSkin) {
        if (!aWallpapers.some(paper => paper.skin === strSkin)) {
            return;
        }
        _m_cp.FindChildTraverse(_WallpaperBtnId(strSkin)).checked = true;
        UpdateWallpaper(strSkin);
    }
    function _StageNameForMap(strMap) {
        const row = PetPhotoTag.STAGES.find(entry => entry.map === strMap);
        return row ? row.name : PetPhotoTag.STAGES[0].name;
    }
    function _SelectPose(strName) {
        const pose = PetPhotoTag.POSES.find(row => row.name === strName);
        if (!pose) {
            return;
        }
        _m_cp.FindChildTraverse(_PoseBtnId(pose.name)).checked = true;
        UpdatePhotoPoseSettings(pose);
    }
    function _SelectAspect(strName) {
        if (!PetPhotoTag.ASPECTS.some(row => row.name === strName)) {
            return;
        }
        _m_cp.FindChildTraverse(_AspectBtnId(strName)).checked = true;
        UpdateAspectRatioSettings(strName);
    }
    function _SelectFilter(strName) {
        if (!PetPhotoTag.FILTERS.some(row => row.name === strName)) {
            return;
        }
        _m_cp.FindChildTraverse(_FilterBtnId(strName)).checked = true;
        OnFilterEffect(strName);
    }
    function _SelectHeadwear(strName) {
        const strModel = _HeadwearModelForName(strName);
        if (strModel === undefined) {
            return;
        }
        _m_cp.FindChildTraverse(_HeadwearBtnId(strName)).checked = true;
        AttachModel(strModel);
    }
    // Inverses, and undefined is the answer for a name no hat goes by.
    function _HeadwearModelForName(strName) {
        if (strName === NO_HEADWEAR) {
            return '';
        }
        return PetPhotoTag.HEADWEAR.find(entry => entry.name === strName)?.model;
    }
    function _HeadwearNameForModel(strModel) {
        const row = PetPhotoTag.HEADWEAR.find(entry => entry.model === strModel);
        return row ? row.name : NO_HEADWEAR;
    }
    function _SliderValue(adjust) {
        const elSlider = _GetSlider(adjust.type);
        return elSlider ? elSlider.value : adjust.default;
    }
    function _SetSliderValue(adjust, strValue) {
        const elSlider = _GetSlider(adjust.type);
        const value = Number(strValue);
        if (!elSlider || !isFinite(value)) {
            return;
        }
        elSlider.value = Math.max(adjust.min, Math.min(value, adjust.max));
        _ApplyAdjust(adjust, elSlider.value);
    }
    function _SetUpPhotoBooth(petItemId) {
        _m_photoBoothUpgradeLevel = Number(_m_cp.GetAttributeString('upgrade_level', ''));
        // the booth is only reachable for a grown pet; nothing here works without a level
        if (_m_photoBoothUpgradeLevel > 0) {
            _MakeSettingsButtons();
            _MakeActivityButtons();
            _MakeHeadwearButtons();
            _m_cp.FindChildInLayoutFile('id-pet-sticker-search')
                .SetPanelEvent('ontextentrychange', UpdateStickerList);
            // Tiles are recycled as the list refills, so each one is told afresh whether it can still be picked.
            $.RegisterEventHandler('CSGOInventoryItemLoaded', _m_cp.FindChildInLayoutFile('id-pet-sticker-item-list'), _RefreshStickerTile);
            _m_cp.FindChildTraverse('id-photo-team-ct').checked = true;
            // Before the first thing that makes the render panel: a map cannot be handed to it later.
            _m_currentStage = _SetupStageMap();
            // always open on solo, whatever the growth stage
            _MakePoseButtons();
            const defaultPose = PetPhotoTag.POSES[0];
            _m_cp.FindChildTraverse(_PoseBtnId(defaultPose.name)).checked = true;
            _ApplyAgeGates();
            UpdatePhotoPoseSettings(defaultPose);
            _MakeAspectButtons();
            _m_cp.FindChildTraverse(_AspectBtnId('1x1')).checked = true;
            UpdateAspectRatioSettings('1x1');
            _MakeAdjustSliders();
            SliderDefaults();
            PhotoGridSliderDefaults();
            _MakeFilterButtons();
            $.Schedule(.25, () => {
                // The studio is the map this panel is authored around and comes up ready. Any other stage we
                // opened on wants the same settling a stage change gives it.
                if (_m_currentStage !== STUDIO_STAGE) {
                    _SettleStage(_m_currentStage);
                }
                TurnOffAllFilters();
                _m_cp.FindChildTraverse(_FilterBtnId('normal')).checked = true;
                OnFilterEffect('normal');
                _RefreshAdjustments();
                // Last, and in here: every field needs the render panel, which is what the wait is for.
                _ApplySetup();
            });
            _MakeMapButtons();
            _MakeWallpaperButtons();
            _m_cp.FindChildTraverse(_WallpaperBtnId(DEFAULT_WALLPAPER)).checked = true;
            _m_cp.FindChildTraverse(_StageBtnId(_StageNameForMap(_m_currentStage))).checked = true;
            SetWallpaperOnStageChange(_m_currentStage === STUDIO_STAGE);
            _m_cp.FindChildTraverse('id-photo-headwear-none').checked = true;
            AttachModel('');
            _SetUpPhotoLibrary();
            LoadPreviousPhotos();
            _StartZoomReadout();
            // Opens on instant. Read off the toggle, so a checked="true" in the layout would be obeyed.
            _RefreshCountdown();
        }
    }
    function _MakeSettingsButtons() {
        // Asked once - nothing reachable from the booth can hand you a sticker.
        const bHasStickers = _StickerCount() > 0;
        let aSettings = [
            {
                setting_id: 'grid',
                class: 'IconButton',
                icon: 'photo_grid',
                make_separator: true,
            },
            {
                setting_id: 'adjust',
                class: 'IconButton',
                icon: 'tune',
            },
            {
                setting_id: 'filters',
                class: 'IconButton',
                icon: 'filters',
            },
            {
                setting_id: 'format',
                class: 'IconButton',
                icon: 'aspect_ratio',
                make_separator: true,
            },
            {
                setting_id: 'poses',
                class: 'IconButton',
                icon: 'cheer',
            },
            {
                setting_id: 'team',
                class: 'IconButton',
                icon: 'ct_logo_1c',
            },
            {
                setting_id: 'stage',
                class: 'IconButton',
                icon: 'picture',
            },
            {
                setting_id: 'headwear',
                class: 'IconButton',
                icon: 'helmet',
                make_separator: true,
            },
            {
                setting_id: 'stickers',
                class: 'IconButton',
                icon: 'sticker',
                locked_tip: bHasStickers ? '' : '#pet_photo_booth_no_stickers',
            },
            {
                setting_id: 'light',
                class: 'IconButton',
                icon: 'colorwheel',
                on_activate: () => { ShowLightColorPicker(); },
                studio_only: true,
            },
        ];
        const namePrefix = 'id-pet-setting-btn-';
        const elParent = _m_cp.FindChildInLayoutFile('id-pet-photo-controls');
        aSettings.forEach(btn => {
            // The radio group tracks which settings row is open. A button with its own handler opens
            // something and comes straight back, so it stays out of the group rather than lighting up.
            let elBtn = btn.on_activate
                ? $.CreatePanel('Button', elParent, namePrefix + btn.setting_id, {
                    class: btn.class
                })
                : $.CreatePanel('RadioButton', elParent, namePrefix + btn.setting_id, {
                    class: btn.class,
                    group: 'control'
                });
            elBtn.BLoadLayoutSnippet('setting-btn');
            elBtn.FindChildInLayoutFile('id-pet-setting-btn-icon').SetImage("file://{images}/icons/ui/" + btn.icon + ".svg");
            // The name is the hover tooltip; a locked button says why instead and stops taking clicks.
            const bLocked = !!btn.locked_tip;
            const settingName = $.Localize(bLocked ? btn.locked_tip
                : '#pet_photo_booth_setting_' + btn.setting_id);
            elBtn.enabled = !bLocked;
            elBtn.SetPanelEvent('onmouseover', () => { UiToolkitAPI.ShowTextTooltip(elBtn.id, settingName); });
            elBtn.SetPanelEvent('onmouseout', () => { UiToolkitAPI.HideTextTooltip(); });
            const fnActivate = btn.on_activate ? btn.on_activate : () => { ShowSettingsRow(btn.setting_id); };
            elBtn.SetPanelEvent('onactivate', fnActivate);
            if (btn.studio_only) {
                elBtn.SetAttributeString('data-studio-only', 'true');
            }
            if (btn.make_separator) {
                $.CreatePanel('Panel', elParent, namePrefix + btn.setting_id, { class: 'photo-booth-controls__separator' });
            }
        });
    }
    // A stage's button, found by which stage it is rather than by where it sits in the table.
    function _StageBtnId(strStage) {
        return 'id-photo-stage-' + strStage;
    }
    function _MakeWallpaperButtons() {
        const elParent = _m_cp.FindChildInLayoutFile('id-photo-wallpaper-swatches');
        aWallpapers.forEach(paper => {
            if (elParent.FindChildInLayoutFile(_WallpaperBtnId(paper.skin))) {
                return;
            }
            const elBtn = $.CreatePanel('RadioButton', elParent, _WallpaperBtnId(paper.skin), {
                class: 'photo-booth-settings__btn',
                group: 'wallpaper'
            });
            const elIcon = $.CreatePanel('Panel', elBtn, '', { class: 'photo-booth-background-icon' });
            if (paper.swatch !== '') {
                elIcon.AddClass(paper.swatch);
            }
            elBtn.SetPanelEvent('onactivate', () => { UpdateWallpaper(paper.skin); });
        });
    }
    function _MakeMapButtons() {
        const elParent = _m_cp.FindChildInLayoutFile('id-photo-settings-stage');
        PetPhotoTag.STAGES.forEach(stage => {
            let elBtn = elParent.FindChildInLayoutFile(_StageBtnId(stage.name));
            if (!elBtn) {
                elBtn = $.CreatePanel('RadioButton', elParent, _StageBtnId(stage.name), {
                    class: 'photo-booth-settings__btn',
                    group: 'stage'
                });
                $.CreatePanel('Label', elBtn, '', {
                    text: PetPhotoTag.WordFor('s', String(stage.id)),
                    class: "stratum-regular"
                });
                elBtn.SetPanelEvent('onactivate', () => { ChangeStage(stage.map); });
            }
            const hasRequirement = Boolean(stage.achievement) || Boolean(stage.age_requirement);
            const bComplete = _BStageUnlocked(stage);
            if (hasRequirement) {
                elBtn.enabled = bComplete;
                if (!bComplete) {
                    // Branched the way _BStageUnlocked is: an age gate only wants the pet older, and an
                    // achievement wants a match played there - which a chick is too young to be given.
                    const strTip = stage.age_requirement ? '#pet_photo_booth_map_locked_age'
                        : _m_photoBoothUpgradeLevel === GROWTH_CHICK ? '#pet_photo_booth_map_locked_chick'
                            : '#pet_photo_booth_map_locked_teen';
                    elBtn.SetPanelEvent('onmouseover', () => { UiToolkitAPI.ShowTextTooltip(elBtn.id, strTip); });
                    elBtn.SetPanelEvent('onmouseout', () => { UiToolkitAPI.HideTextTooltip(); });
                }
            }
        });
        //DEVONLY{
        let elBtn = elParent.FindChildInLayoutFile('id-photo-stage-debug');
        if (!elBtn) {
            const elBtn = $.CreatePanel('TextButton', elParent, 'id-photo-stage-debug', { text: 'Debug Unlock All', class: "pet-reset-btn" });
            elBtn.SetPanelEvent('onactivate', () => {
                PetPhotoTag.STAGES.forEach(stage => {
                    elParent.FindChildInLayoutFile(_StageBtnId(stage.name)).enabled = true;
                });
            });
        }
        //}DEVONLY
    }
    // Age is checked before the achievement because a stage carrying both is gated on the age.
    function _BStageUnlocked(stage) {
        if (stage.age_requirement) {
            return _m_photoBoothUpgradeLevel >= stage.age_requirement;
        }
        if (stage.achievement) {
            return InventoryAPI.PetHasAchievement(_m_petId, stage.achievement);
        }
        return true;
    }
    // What a newly loaded map needs before it can be photographed: its own lighting, and the post
    // volumes it brought with it put back the way the sliders have them.
    function _SettleStage(strMap) {
        const elPanel = _GetPicturePanel();
        if (!elPanel) {
            return;
        }
        elPanel.FireEntityInput('post_vanity', 'Disable');
        _ResetMapEntities(strMap, elPanel);
        _RefreshAdjustments();
        _RefreshLightColors();
    }
    function _GetPhotoBoothMapPanel() {
        let elPanel = _m_elItemModelImagePanel.FindChildInLayoutFile('id-pet-picture-panel');
        if (!elPanel) {
            elPanel = $.CreatePanel('MapPlayerPreviewPanel', _m_elItemModelImagePanel, 'id-pet-picture-panel', {
                "require-composition-layer": "true",
                "transparent-background": "false",
                "pin-fov": "vertical",
                class: 'inspect-model-image-panel',
                camera: 'cam_pet_photo',
                player: "true",
                map: _m_currentStage,
                initial_entity: 'item',
                mouse_rotate: false,
                playername: "vanity_character",
                workshop_preview: false,
                panzoom_enabled: true,
                drag_rotate: true,
            });
            if (elPanel.PanZoomEnabled()) {
                elPanel.hittest = true; // make the render panel a mouse hit target
                elPanel.SetAcceptsInput(true); // receive wheel (zoom) + shift-drag (pan)
                elPanel.SetAcceptsFocus(true); // enables arrow-key panning once the panel is focused
            }
            elPanel.SetDragRotateYawLimit(30);
            _m_cp.FindChildInLayoutFile('id-pet-photo-overlay').SetParent(_m_elItemModelImagePanel);
            return elPanel;
        }
        return elPanel;
    }
    const GROWTH_CHICK = 1;
    const GROWTH_ADOLESCENT = 2;
    const GROWTH_ADULT = 3;
    const aGrowth = [
        { level: GROWTH_CHICK, entityName: 'chick', soloCamera: 'cam_pet_pose_solo_1', soloOrbit: 36, headwearScale: 1.0, soundStage: 'Chick' },
        { level: GROWTH_ADOLESCENT, entityName: 'teen', soloCamera: 'cam_pet_pose_solo_2', soloOrbit: 45, headwearScale: 0.43, soundStage: 'Pullet' },
        { level: GROWTH_ADULT, entityName: 'adult', soloCamera: 'cam_pet_pose_solo_3', soloOrbit: 55, headwearScale: 0.55, soundStage: 'Hen' },
    ];
    function _Growth() {
        const aFound = aGrowth.filter(growth => growth.level === _m_photoBoothUpgradeLevel);
        return aFound.length > 0 ? aFound[0] : aGrowth[aGrowth.length - 1];
    }
    let _m_aActivityBtns = [];
    // An activity's button, found by which activity it is rather than by where it sits.
    function _ActivityBtnId(strActivity) { return 'id-photo-activity-' + strActivity; }
    function _MakeActivityButtons() {
        const elParent = _m_cp.FindChildInLayoutFile('id-pet-photo-activity-bar');
        _m_aActivityBtns = [];
        PetPhotoTag.ACTIVITIES.forEach(activity => {
            const elBtn = $.CreatePanel('Button', elParent, _ActivityBtnId(activity.name), {
                class: 'IconButton'
            });
            const btn = { row: activity, el: elBtn };
            _m_aActivityBtns.push(btn);
            $.CreatePanel('Image', elBtn, '', {
                src: 'file://{images}/icons/ui/' + activity.icon + '.svg',
                textureheight: '32',
                texturewidth: '-1'
            });
            $.CreatePanel('Panel', elBtn, '', { class: 'Spinner photo-booth-activity__spinner' });
            elBtn.SetPanelEvent('onactivate', () => { PlayPetActivity(btn); });
        });
    }
    // How long to wait for the anim graph to pick an activity up, the longest one is believed to run,
    // and how often it is checked.
    const ACTIVITY_START = .5;
    const ACTIVITY_MAX = 5.0;
    const ACTIVITY_POLL = .1;
    let _m_running = undefined;
    let _m_activityJob = undefined;
    // The two go together: state left behind with nothing polling it locks the bar for good.
    function _ClearActivity() {
        _m_activityJob = _CancelJob(_m_activityJob);
        _m_running = undefined;
    }
    // Watches the bird rather than counting down, so a short gesture gives the buttons back early. Until
    // it has been seen once, reading anything else only means the graph has not switched yet; after, it
    // means the gesture is over.
    function _TickActivity() {
        _m_activityJob = undefined;
        const running = _m_running;
        if (!running) {
            return;
        }
        running.flElapsed += ACTIVITY_POLL;
        const bIsRow = _CurrentActivity() === running.row;
        const bFirstSeen = bIsRow && !running.bSeen;
        running.bSeen = running.bSeen || bIsRow;
        // On the tick the bird is first caught doing it, so the sound lands with the animation rather
        // than up to ACTIVITY_START early at the click. Within a poll of the start, not frame exact.
        if (bFirstSeen) {
            const strSound = running.row.sound?.[_Growth().soundStage];
            if (strSound) {
                UiToolkitAPI.PlaySoundEvent(strSound);
            }
        }
        const bOver = running.bSeen ? !bIsRow : running.flElapsed >= ACTIVITY_START;
        if (bOver || running.flElapsed >= ACTIVITY_MAX) {
            _ClearActivity();
            _RefreshActivityButtons();
            return;
        }
        _m_activityJob = $.Schedule(ACTIVITY_POLL, _TickActivity);
    }
    // Age, pose and whatever is already playing each gate a trick and change independently, so one owner
    // writes the button - state, class and tooltip. Age first: it is the only one fixed for the session.
    function _RefreshActivityButtons() {
        const bSolo = _IsSoloPose(_m_currentPose);
        _m_aActivityBtns.forEach(btn => {
            const strAgeTip = _m_ageTips[btn.el.id] || '';
            const bRunning = _m_running !== undefined && _m_running.row === btn.row;
            // The one playing stays enabled: :disabled washes a panel's children, which would grey its
            // spinner along with its icon.
            btn.el.enabled = strAgeTip === '' && bSolo && (_m_running === undefined || bRunning);
            btn.el.SetHasClass('photo-booth-activity--busy', bRunning);
            btn.el.SetHasClass('no-hover', bRunning);
            const strTip = strAgeTip !== '' ? strAgeTip
                : (bSolo ? PetPhotoTag.WordFor('v', String(btn.row.id))
                    : '#pet_photo_booth_setting_restriction_tooltip');
            btn.el.SetPanelEvent('onmouseover', () => { UiToolkitAPI.ShowTextTooltip(btn.el.id, strTip); });
            btn.el.SetPanelEvent('onmouseout', () => { UiToolkitAPI.HideTextTooltip(); });
        });
    }
    function PlayPetActivity(btn) {
        // All three again rather than trusting enabled: two clicks in one frame both arrive before it is off.
        if (_m_ageTips[btn.el.id] || !_IsSoloPose(_m_currentPose) || _m_running !== undefined) {
            return;
        }
        const elPanel = _GetPhotoBoothMapPanel();
        const activity = btn.row;
        if (activity.variation === undefined) {
            elPanel.SetPetActivityOnItem(_Growth().entityName, activity.activity);
        }
        else {
            elPanel.SetPetActivityAndVariationOnItem(_Growth().entityName, activity.activity, activity.variation);
        }
        _m_running = { row: activity, bSeen: false, flElapsed: 0 };
        _m_activityJob = $.Schedule(ACTIVITY_POLL, _TickActivity);
        _RefreshActivityButtons();
    }
    //// Pose setup ////
    // The buttons come from PetPhotoTag's POSES, so that table owns their order and their ids.
    function _PoseBtnId(strPose) {
        return 'id-photo-pose-' + strPose;
    }
    function _MakePoseButtons() {
        const elParent = _m_cp.FindChildInLayoutFile('id-photo-settings-poses');
        PetPhotoTag.POSES.forEach(pose => {
            if (elParent.FindChildInLayoutFile(_PoseBtnId(pose.name))) {
                return;
            }
            const elBtn = $.CreatePanel('RadioButton', elParent, _PoseBtnId(pose.name), {
                class: 'photo-booth-settings__btn',
                group: 'poses'
            });
            $.CreatePanel('Label', elBtn, '', {
                text: PetPhotoTag.WordFor('p', pose.name),
                class: 'stratum-regular'
            });
            elBtn.SetPanelEvent('onactivate', () => { UpdatePhotoPoseSettings(pose); });
        });
    }
    const SOLO_SHOT = {
        introCamera: 'cam_pet_pose_solo_intro',
        effectPrefix: 'solo_',
    };
    const POSED_SHOT = {
        introCamera: 'cam_pet_pose_intro',
        effectPrefix: '',
    };
    function _IsSoloPose(pose) { return pose.name === '0'; }
    const aAgeGates = [
        { ids: ['id-photo-pose-8', 'id-photo-pose-9', 'id-photo-pose-10'],
            max: GROWTH_CHICK, tip: '#pet_photo_booth_age_outgrown' },
        { ids: ['id-photo-pose-2', 'id-photo-pose-4', 'id-photo-pose-5', 'id-photo-pose-6'],
            min: GROWTH_ADOLESCENT, tip: '#pet_photo_booth_age_dangerous' },
        { ids: ['id-photo-pose-1', 'id-photo-pose-3', 'id-photo-pose-7'],
            min: GROWTH_ADULT, tip: '#pet_photo_booth_age_maturity' },
        { ids: ['id-photo-effect-sparks', 'id-photo-effect-laser', 'id-photo-effect-beam'],
            min: GROWTH_ADOLESCENT, tip: '#pet_photo_booth_age_scary' },
        { ids: ['id-photo-effect-fire', 'id-photo-effect-lightning', 'id-photo-effect-explosion'],
            min: GROWTH_ADULT, tip: '#pet_photo_booth_age_scary' },
        { ids: [_ActivityBtnId('jump'), _ActivityBtnId('wag'), _ActivityBtnId('moonwalk')],
            min: GROWTH_ADOLESCENT, tip: '#pet_photo_booth_age_tricks' },
        { ids: [_ActivityBtnId('kick'), _ActivityBtnId('fly')],
            min: GROWTH_ADULT, tip: '#pet_photo_booth_age_tricks' },
    ];
    // A pet that has done the thing for real gets the effect early. Keyed by id so the rows above stay
    // grouped by reason, and it only ever unlocks - a pet already old enough needs no achievement.
    const ACHIEVEMENT_UNLOCKS = {
        'id-photo-effect-fire': 'killed-by-burn',
        'id-photo-effect-lightning': 'killed-by-taser',
        'id-photo-effect-explosion': 'killed-by-planted-c4',
    };
    // One tip for all of them: a locked button says there is another way in, not what earns it.
    const ACHIEVEMENT_LOCKED_TIP = '#pet_photo_booth_age_scary_brave';
    // What the gates decided: panel id to reason, locked buttons only. Fixed for the session.
    let _m_ageTips = {};
    // Once, after the buttons exist and before anything refreshes them - the bird cannot grow up in here.
    function _ApplyAgeGates() {
        aAgeGates.forEach(gate => {
            const bAllowed = (gate.min === undefined || _m_photoBoothUpgradeLevel >= gate.min) &&
                (gate.max === undefined || _m_photoBoothUpgradeLevel <= gate.max);
            gate.ids.forEach(strId => {
                const elBtn = _m_cp.FindChildTraverse(strId);
                // A table keyed by id gates nothing at all on a typo, which is worse than gating wrong.
                if (!elBtn || !elBtn.IsValid()) {
                    $.Msg('pet booth: age gate names ' + strId + ', which is not a panel.\n');
                    return;
                }
                const strAchievement = ACHIEVEMENT_UNLOCKS[strId];
                if (bAllowed || (strAchievement !== undefined &&
                    InventoryAPI.PetHasAchievement(_m_petId, strAchievement))) {
                    return;
                }
                const strTip = strAchievement !== undefined ? ACHIEVEMENT_LOCKED_TIP : gate.tip;
                _m_ageTips[strId] = strTip;
                elBtn.enabled = false;
                // Only a locked button has its tooltip taken over; an allowed one keeps the layout's.
                elBtn.SetPanelEvent('onmouseover', () => { UiToolkitAPI.ShowTextTooltip(strId, strTip); });
                elBtn.SetPanelEvent('onmouseout', () => { UiToolkitAPI.HideTextTooltip(); });
            });
        });
    }
    function _PoseShot(pose) { return _IsSoloPose(pose) ? SOLO_SHOT : POSED_SHOT; }
    function _PoseOrbitRadius(pose) {
        return pose.orbit === undefined ? _Growth().soloOrbit : pose.orbit;
    }
    // Per pose rather than per shot type: solo picks by growth stage, posed shots have one each.
    function _PoseCamera(pose) {
        return _IsSoloPose(pose) ? _Growth().soloCamera : 'cam_pet_pose_' + pose.name;
    }
    function UpdatePhotoPoseSettings(pose) {
        let elPanel = _GetPhotoBoothMapPanel();
        const shot = _PoseShot(pose);
        elPanel.ResetPanZoom();
        elPanel.ResetDragRotate();
        elPanel.SetDragRotateRadius(_PoseOrbitRadius(pose));
        elPanel.SetZoomLimit(25);
        elPanel.TransitionToCamera(shot.introCamera, 0);
        elPanel.TransitionToCamera(_PoseCamera(pose), 2);
        _SetCharacterAndPetPose(elPanel, pose);
    }
    function _SetCharacterAndPetPose(elPanel, pose) {
        if (_IsSoloPose(pose)) {
            if (!_m_petSpawnedForPhotoBooth) {
                elPanel.SpawnItem(_Growth().entityName, _m_petId, '', 'pet1');
                _m_petSpawnedForPhotoBooth = true;
            }
            elPanel.FireEntityInput(_Growth().entityName, 'Alpha', '255');
            elPanel.FireEntityInput('dynamic_player6', 'Alpha', '0');
        }
        else {
            let selectedBtn = _m_cp.FindChildInLayoutFile('id-photo-settings-team').Children()[0].GetSelectedButton();
            let charId = LoadoutAPI.GetItemID(selectedBtn.GetAttributeString('data-type', 'ct'), 'customplayer');
            const settings = ItemInfo.GetOrUpdateVanityCharacterSettings(charId);
            settings.panel = elPanel;
            settings.petItemId = _m_petId;
            elPanel.SetActiveCharacter(6);
            let model = ItemInfo.GetModelPlayer(charId);
            elPanel.SetPlayerCharacterItemID(charId);
            elPanel.SetPlayerModel(model);
            elPanel.SetPetPlacement(!!_m_petId && Number(_m_petId) != 0 ? 'origin' : 'none');
            elPanel.EquipPlayerWithPet(_m_petId);
            elPanel.PlayChickSnapshotAnimation(Number(pose.name));
            elPanel.FireEntityInput(_Growth().entityName, 'Alpha', '0');
            elPanel.FireEntityInput('dynamic_player6', 'Alpha', '255');
        }
        _m_currentPose = pose;
        _EnableDisablePhotoSettings();
        // changing pose respawns and re-equips the pet, which clears any attached model
        _ApplyAttachment();
    }
    // Two stages, never both live: the warm-up or countdown that arms a shot, then its verify chain.
    let _m_captureJob = undefined;
    let _m_verifyJob = undefined;
    let _m_bCapturing = false;
    // Hands back what to store, so a cancel is one line at each of the four job handles.
    function _CancelJob(nJob) {
        if (nJob !== undefined) {
            $.CancelScheduled(nJob);
        }
        return undefined;
    }
    // Naming the layer is a UI thread change; the render thread creates panorama_rt_<name>.vtex a
    // pass later and WriteCompositionLayerJPEG writes nothing until it exists.
    const COMPOSITION_LAYER_WARMUP = .1;
    // The JPEG write is synchronous, so a shot that worked is already on disk. The tries are for the bail-out.
    const CAPTURE_VERIFY_SEC = .2;
    const CAPTURE_TRIES = 4;
    // A book goes to Steam Cloud as one file with a 100 MiB ceiling, so photos are kept small two ways.
    //
    // Just over the widest 1080p frame (1163), so only screens above 1080p are downsampled.
    const PHOTO_MAX_LONG_EDGE = 1200;
    // libjpeg's 0-100. At 95 a 1200px photo is about a quarter of a megabyte.
    const PHOTO_JPEG_QUALITY = 95;
    const COUNTDOWN_SEC = 3;
    // The timer toggle, not a shutter of its own: it decides whether the shutter fires now or later.
    function _BTimerMode() { return _m_cp.FindChildInLayoutFile('id-pet-take-picture').checked; }
    // Only the shutter. The toggle stays live so flipping it off can call a countdown back.
    function _SetShutterEnabled(bEnabled) {
        _m_cp.FindChildInLayoutFile('id-pet-take-picture-instant').enabled = bEnabled;
    }
    // In step with the toggle: up the whole time the timer is armed, and always back to the full count.
    function _RefreshCountdown() {
        const elCountdown = _m_cp.FindChildInLayoutFile('id-pet-countdown');
        elCountdown.SetDialogVariableInt('countdown', COUNTDOWN_SEC);
        elCountdown.SetHasClass('show', _BTimerMode());
        // Every ending runs through here - fired, cancelled or the mode flipped - so this is the one place
        // 'running' comes off, and TakePhoto is the one place it goes on.
        elCountdown.SetHasClass('running', false);
    }
    // The ToggleButton flips itself; this only makes the rest of the booth agree with it.
    function ToggleTimerMode() {
        // A shot armed under the old mode does not get to land under the new one.
        _CancelCapture();
        _RefreshCountdown();
    }
    PopupPetPhotoBooth.ToggleTimerMode = ToggleTimerMode;
    function _BeginCapture() {
        _m_bCapturing = true;
        _SetShutterEnabled(false);
        // Named here on purpose: the render target is keyed by this name and keeps the resolution it was
        // created at, so it must not be made while the frame is still animating to an aspect size.
        _m_elCaptured.SetCompositionLayerTextureName(m_aspectRatio);
        _SetCapturing(true);
    }
    // A hovered sticker's border and sliders sit inside the captured panel, so they would be in the shot.
    function _SetCapturing(bCapturing) {
        _m_elCaptured.SetHasClass('pet-capturing', bCapturing);
    }
    // Safe to call when idle. The verify chain goes too: a shot nobody is waiting for must not report
    // itself as failed.
    function _CancelCapture() {
        _m_captureJob = _CancelJob(_m_captureJob);
        _m_verifyJob = _CancelJob(_m_verifyJob);
        if (_m_bCapturing) {
            _EndCapture();
        }
    }
    // What a shot leaves behind, fired or called off. One list rather than two that have to agree.
    function _EndCapture() {
        _m_bCapturing = false;
        _SetShutterEnabled(true);
        _SetCapturing(false);
        _RefreshCountdown();
    }
    // Every callback below touches panels that go away with the popup, so none may outlive it.
    function _CancelPhotoJobs() {
        _CancelCapture();
        _m_zoomReadoutJob = _CancelJob(_m_zoomReadoutJob);
        _ClearActivity();
    }
    // Writes what the layer holds now and flashes on the same frame, so the flash marks the saved one.
    function _WritePhoto() {
        _m_captureJob = undefined;
        const strFileName = 'pet_' + Date.now() + _PhotoMetaTag() + PetPhotoTag.EXT;
        _m_lastSavedPhoto = strFileName;
        _WriteLayerJPEG(strFileName);
        // id-pet-white is a sibling of the captured panel, so the flash stays out of the shot
        _m_cp.FindChildInLayoutFile('id-pet-white').TriggerClass('photo-flash');
        // Here and not TakePhoto, so the timer counts down before the shutter.
        UiToolkitAPI.PlaySoundEvent('Chicken.Camera.Shoot');
        _EndCapture();
        // The name rides along rather than being read back off _m_lastSavedPhoto, so a second shot cannot
        // make this chain verify or rewrite the wrong file.
        _m_verifyJob = $.Schedule(CAPTURE_VERIFY_SEC, () => { _VerifyPhoto(strFileName, 1); });
    }
    // PreparePetPhoto makes the pet's folders and hands back where the photo goes, so the path is
    // composed there and not here.
    function _WriteLayerJPEG(strFileName) {
        const strPath = GameInterfaceAPI.PreparePetPhoto(_m_petId, strFileName);
        if (!strPath) {
            $.Msg('pet booth: no folder for ' + strFileName + ', nothing written.\n');
            return;
        }
        _m_elCaptured.WriteCompositionLayerJPEG(strPath, 'USRLOCAL', PHOTO_MAX_LONG_EDGE, PHOTO_JPEG_QUALITY); // 'USRLOCAL' pathID to write into per-user config area
    }
    function _VerifyPhoto(strFileName, nTry) {
        _m_verifyJob = undefined;
        if (_PhotoOnDisk(strFileName)) {
            PetPhotoLibrary.Insert(strFileName);
            return;
        }
        if (nTry < CAPTURE_TRIES) {
            _WriteLayerJPEG(strFileName);
            _m_verifyJob = $.Schedule(CAPTURE_VERIFY_SEC, () => { _VerifyPhoto(strFileName, nTry + 1); });
            return;
        }
        // What differs between a shot that works and one that does not, for the one time it is caught.
        const nStickers = _m_elCaptured
            .FindChildrenWithClassTraverse('placed-sticker-container').length;
        $.Msg('pet booth: ' + strFileName + ' never reached disk after ' + CAPTURE_TRIES +
            ' tries. layer "' + m_aspectRatio + '", ' + nStickers + ' sticker(s) placed.\n');
        // Nothing landed, so the roll must not be left with a row that has no file behind it.
        if (_m_lastSavedPhoto === strFileName) {
            _m_lastSavedPhoto = '';
        }
        _WarnPhotoFailed();
    }
    // The one name, not the folder's listing - the roll only grows.
    function _PhotoOnDisk(strFileName) {
        return GameInterfaceAPI.FindFiles(PetPhotoTag.LibraryFolder(_m_petId) + '/' + strFileName, 'USRLOCAL').length > 0;
    }
    // One per booth: whatever stopped the layer reaching disk lasts as long as the layer does, so every
    // shot after this one would stack another. Leaving is all that is offered because only a fresh booth
    // gets a working layer.
    let _m_bSaveFailureShown = false;
    function _WarnPhotoFailed() {
        if (_m_bSaveFailureShown) {
            return;
        }
        _m_bSaveFailureShown = true;
        UiToolkitAPI.ShowGenericPopupOneOption('#pet_photo_save_failed_title', '#pet_photo_save_failed_desc', '', '#pet_photo_save_failed_leave', () => { Close(); });
    }
    function _Countdown(nRemaining) {
        const elCountdown = _m_cp.FindChildInLayoutFile('id-pet-countdown');
        if (nRemaining === 0) {
            // Back to the top rather than away: _WritePhoto ends the capture, which refreshes from the toggle.
            _WritePhoto();
            return;
        }
        elCountdown.SetDialogVariableInt('countdown', nRemaining);
        // One beep per number shown; the shutter covers zero.
        UiToolkitAPI.PlaySoundEvent('UI.Premier.CounterTimer');
        _m_captureJob = $.Schedule(1, () => { _Countdown(nRemaining - 1); });
    }
    // One shutter, two modes. The countdown is already up if the timer is armed.
    function TakePhoto() {
        if (_m_bCapturing) {
            return;
        }
        // The shutter goes live again as soon as a shot is written, so a previous verify chain can still
        // be pending here. This shot supersedes it.
        _CancelCapture();
        _BeginCapture();
        if (_BTimerMode()) {
            // armed up front so the counting doubles as the layer warm-up
            _m_cp.FindChildInLayoutFile('id-pet-countdown').SetHasClass('running', true);
            _Countdown(COUNTDOWN_SEC);
            return;
        }
        _m_captureJob = $.Schedule(COMPOSITION_LAYER_WARMUP, _WritePhoto);
    }
    PopupPetPhotoBooth.TakePhoto = TakePhoto;
    // pet_photo_tag.ts owns the format; this hands over what the booth knows.
    function _PhotoMetaTag() {
        const activity = _CurrentActivity();
        return PetPhotoTag.Compose({
            pose: _m_currentPose.name,
            filter: _m_photoFilter || 'normal',
            stageMap: _m_currentStage,
            growth: _m_photoBoothUpgradeLevel,
            aspect: m_aspectRatio || '1x1',
            zoom: _CurrentZoom(),
            activity: activity ? activity.name : '',
            headwear: _m_currentAttachment,
        });
    }
    // Both are fixed for the pet's life and stop resolving once it expires, so they go in the name now.
    function _PetAttr(strAttrName) {
        const value = Number(InventoryAPI.GetItemAttributeValue(_m_petId, '{uint32}' + strAttrName));
        return isNaN(value) ? 0 : value;
    }
    // The row the bird is running, or undefined if it is idling or doing something the ui did not ask
    // for - a variation below zero means the game chose the clip. Undefined outside the solo shot.
    function _CurrentActivity() {
        if (!_IsSoloPose(_m_currentPose)) {
            return undefined;
        }
        const elPanel = _GetPhotoBoothMapPanel();
        // Probed for the same reason as GetZoom: on an older client the call would throw mid-write.
        if (!elPanel || typeof elPanel.GetPetActivityVariationOnItem !== 'function') {
            return undefined;
        }
        const strEntity = _Growth().entityName;
        const strActivity = elPanel.GetPetActivityOnItem(strEntity);
        const nVariation = elPanel.GetPetActivityVariationOnItem(strEntity);
        return PetPhotoTag.ACTIVITIES.find(activity => activity.activity === strActivity &&
            (activity.variation === undefined ? nVariation < 0 : activity.variation === nVariation));
    }
    //// Zoom readout ////
    // Polled: OnMouseWheel does the zoom itself and returns true before the base class, so an
    // onmousewheel handler never sees the wheel. One int read, written only when the number moves.
    const ZOOM_READOUT_SEC = .1;
    let _m_zoomReadoutJob = undefined;
    let _m_nZoomShown = -1;
    function _StartZoomReadout() {
        _m_nZoomShown = -1;
        _TickZoomReadout();
    }
    function _TickZoomReadout() {
        const nZoom = _CurrentZoom();
        if (nZoom !== _m_nZoomShown) {
            // -1 is _StartZoomReadout's sentinel, so opening the booth is not a zoom.
            if (_m_nZoomShown >= 0) {
                UiToolkitAPI.PlaySoundEvent(nZoom > _m_nZoomShown ? 'Chicken.Photo.ZoomIn'
                    : 'Chicken.Photo.Zoomout');
            }
            _m_nZoomShown = nZoom;
            // Two variables rather than a built string: which word goes where is the loc file's to say.
            // Same table the library tooltip uses, so the booth promises what a hole's zoom:closeup takes.
            _m_cp.SetDialogVariableInt('zoom_value', nZoom);
            _m_cp.SetDialogVariable('zoom_band', PetPhotoTag.WordFor('z', String(nZoom)));
        }
        _m_zoomReadoutJob = $.Schedule(ZOOM_READOUT_SEC, _TickZoomReadout);
    }
    // Raw, not a band verdict, so the bands can be retuned without making a liar of every photo saved.
    function _CurrentZoom() {
        const elPanel = _GetPhotoBoothMapPanel();
        // Probed rather than called: on an older client this would throw and take the whole save with it.
        if (!elPanel || typeof elPanel.GetZoom !== 'function') {
            return 0;
        }
        const nZoom = elPanel.GetZoom();
        // A file name has to stay alphanumeric, so anything but a whole number above zero becomes zero.
        return (typeof nZoom === 'number' && isFinite(nZoom) && nZoom > 0) ? Math.floor(nZoom) : 0;
    }
    //// Settings  ////
    function PhotoGridSliderDefaults() {
        const elSlider = _m_cp.FindChildInLayoutFile('id-photo-grid-slider');
        elSlider.min = 0;
        elSlider.max = .5;
        elSlider.value = .1;
    }
    function SliderDefaults() {
        aAdjust.forEach(adjust => { _ApplySliderDefault(adjust); });
    }
    PopupPetPhotoBooth.SliderDefaults = SliderDefaults;
    // Reset lives in the Adjust panel; filter strength sits with the filters and is left as set.
    function ResetAdjustSliders() {
        aAdjust.forEach(adjust => {
            if (adjust.kind !== 'filter') {
                _ApplySliderDefault(adjust);
            }
        });
    }
    PopupPetPhotoBooth.ResetAdjustSliders = ResetAdjustSliders;
    function _SliderRowId(type) { return 'id-pet-slider-row-' + type; }
    // One row per table entry, so the table is the only place the list is written down. The filter row
    // is skipped because it lives in the filters panel and the layout still declares it there.
    function _MakeAdjustSliders() {
        const elParent = _m_cp.FindChildInLayoutFile('id-photo-settings-adjust');
        aAdjust.forEach(adjust => {
            if (adjust.kind === 'filter' || elParent.FindChildInLayoutFile(_SliderRowId(adjust.type))) {
                return;
            }
            const elRow = $.CreatePanel('Panel', elParent, _SliderRowId(adjust.type), { class: 'full-width' });
            elRow.BLoadLayoutSnippet('adjust-slider');
            elRow.FindChildInLayoutFile('id-pet-slider-label').text =
                $.Localize('#pet_photo_booth_adjust_' + adjust.type);
            elRow.FindChildInLayoutFile('id-pet-slider')
                .SetPanelEvent('onvaluechanged', () => { OnSliderChanged(adjust.type); });
        });
        // the reset button trails the rows, so it is moved back to the end
        elParent.FindChildInLayoutFile('id-pet-slider-reset').SetParent(elParent);
    }
    // Found through its row, because every row carries the same slider id out of the one snippet.
    function _GetSlider(type) {
        const elRow = _m_cp.FindChildTraverse(_SliderRowId(type));
        return (elRow ? elRow.FindChildInLayoutFile('id-pet-slider') : null);
    }
    function _ApplySliderDefault(adjust) {
        const elSlider = _GetSlider(adjust.type);
        if (!elSlider) {
            return;
        }
        elSlider.min = adjust.min;
        elSlider.max = adjust.max;
        elSlider.value = adjust.default;
        // push the value through in case setting it above did not raise onvaluechanged
        _ApplyAdjust(adjust, elSlider.value);
    }
    function OnGridSliderChanged() {
        const elSlider = _m_cp.FindChildInLayoutFile('id-photo-grid-slider');
        const elGrid = _m_cp.FindChildInLayoutFile('id-pet-photo-grid');
        elGrid.style.opacity = elSlider.value + ';';
    }
    PopupPetPhotoBooth.OnGridSliderChanged = OnGridSliderChanged;
    function OnSliderChanged(typeOfSlider) {
        const adjust = aAdjust.find(a => a.type === typeOfSlider);
        const elSlider = _GetSlider(typeOfSlider);
        if (adjust && elSlider) {
            _ApplyAdjust(adjust, elSlider.value);
        }
    }
    PopupPetPhotoBooth.OnSliderChanged = OnSliderChanged;
    // The one place a slider's kind turns into an effect.
    function _ApplyAdjust(adjust, value) {
        // Null until the render panel exists, which the post kinds need and the css kinds do not.
        const elPanel = _GetPicturePanel();
        switch (adjust.kind) {
            case 'post-pair':
                // Sign picks the direction, so only one of the pair is ever weighted.
                elPanel?.SetPostProcessingWeight(adjust.up, value > 0 ? value : 0);
                elPanel?.SetPostProcessingWeight(adjust.down, value < 0 ? -value : 0);
                break;
            case 'post-single':
                elPanel?.SetPostProcessingWeight(adjust.entity, value);
                break;
            case 'filter':
                // nothing to weight until a filter volume is enabled
                if (_m_photoFilter) {
                    elPanel?.SetPostProcessingWeight('pet_post_' + _m_photoFilter, value);
                }
                break;
            case 'brightness':
                _m_cp.FindChildTraverse('id-pet-model').style.brightness = value.toFixed(2);
                break;
            case 'overlay':
                {
                    // Out of the render at zero, not just transparent: any opacity but 1 costs a composition
                    // layer the size of the captured panel. See the note on .photo-booth-model-container.
                    const elOverlay = _m_cp.FindChildTraverse(adjust.panel_id);
                    elOverlay.style.opacity = value.toFixed(2);
                    elOverlay.visible = value > 0;
                    break;
                }
        }
    }
    function _GetPicturePanel() {
        return _m_elItemModelImagePanel.FindChildInLayoutFile('id-pet-picture-panel');
    }
    // SwitchMap respawns the post volumes, so they need re-enabling before there is anything to weight.
    function _RefreshAdjustments() {
        const elPanel = _GetPicturePanel();
        if (!elPanel) {
            return;
        }
        aAdjust.forEach(adjust => {
            if (adjust.kind === 'post-pair') {
                elPanel.FireEntityInput(adjust.up, 'Enable');
                elPanel.FireEntityInput(adjust.down, 'Enable');
            }
            else if (adjust.kind === 'post-single') {
                elPanel.FireEntityInput(adjust.entity, 'Enable');
            }
            OnSliderChanged(adjust.type);
        });
    }
    function _EnableDisablePhotoSettings() {
        let aDisableButtons = _m_cp.FindChildrenWithAttributeTraverse('data-disable-solo');
        aDisableButtons.forEach(btn => {
            let bDisableSolo = (btn.GetAttributeString('data-disable-solo', '') === "true") && _IsSoloPose(_m_currentPose) ? true : false;
            btn.enabled = !bDisableSolo;
            btn.SetPanelEvent('onmouseover', () => {
                if (bDisableSolo) {
                    UiToolkitAPI.ShowTextTooltip(btn.id, "#pet_photo_booth_setting_restriction_tooltip");
                }
            });
            btn.SetPanelEvent('onmouseout', () => { UiToolkitAPI.HideTextTooltip(); });
        });
        // chick_light and agent_light only exist on the studio map, so the colour button goes dead with
        // them. Runs on stage changes too - ChangeStage reaches here through UpdatePhotoPoseSettings.
        const bStudio = _m_currentStage === STUDIO_STAGE;
        const settingBtnPrefix = 'id-pet-setting-btn-';
        _m_cp.FindChildrenWithAttributeTraverse('data-studio-only').forEach(btn => {
            const settingName = '#pet_photo_booth_setting_' + btn.id.substring(settingBtnPrefix.length);
            btn.enabled = bStudio;
            btn.SetPanelEvent('onmouseover', () => {
                UiToolkitAPI.ShowTextTooltip(btn.id, bStudio ? settingName : '#pet_photo_booth_setting_restriction_tooltip');
            });
            btn.SetPanelEvent('onmouseout', () => { UiToolkitAPI.HideTextTooltip(); });
        });
        // Only the solo shot has a bird of its own to animate, and a pose change respawns it. The activity
        // buttons are not swept here: _RefreshActivityButtons owns them outright, tooltip included.
        _ClearActivity();
        _RefreshActivityButtons();
    }
    function ShowSettingsRow(setting) {
        let elPanel = _m_cp.FindChildInLayoutFile('id-photo-settings-' + setting);
        if (_m_elSelectedControls !== elPanel) {
            if (_m_elSelectedControls) {
                _m_elSelectedControls.SetHasClass('show', false);
            }
            elPanel.SetHasClass('show', true);
            _m_elSelectedControls = elPanel;
            if (setting === 'stage') {
                SetWallpaperOnStageChange(_m_currentStage === STUDIO_STAGE);
            }
            if (setting === "stickers") {
                UpdateStickerList();
            }
        }
    }
    PopupPetPhotoBooth.ShowSettingsRow = ShowSettingsRow;
    //// Format ////
    // The shape buttons come from PetPhotoTag's ASPECTS, and orientation is read off a shape's ratio.
    function _AspectBtnId(strAspect) {
        return 'id-photo-ratio-' + strAspect;
    }
    function _OrientationBtnId(strType) {
        return 'id-photo-orientation-' + strType;
    }
    function _MakeAspectButtons() {
        const elParent = _m_cp.FindChildInLayoutFile('id-photo-settings-format');
        PetPhotoTag.ASPECTS.forEach(aspect => {
            if (elParent.FindChildInLayoutFile(_AspectBtnId(aspect.name))) {
                return;
            }
            const elBtn = $.CreatePanel('RadioButton', elParent, _AspectBtnId(aspect.name), {
                class: 'photo-booth-settings__btn',
                group: 'ratio'
            });
            $.CreatePanel('Label', elBtn, '', {
                text: PetPhotoTag.WordFor('a', String(aspect.id)),
                class: 'stratum-regular'
            });
            // Opens on the horizontal list. Square is in neither, so it stays up for both.
            elBtn.visible = PetPhotoTag.Orientation(aspect.name) !== 'vertical';
            elBtn.SetPanelEvent('onactivate', () => { UpdateAspectRatioSettings(aspect.name); });
        });
    }
    function UpdateAspectRatioSettings(aspectRatio) {
        // resizing the frame invalidates the layer, so a shot part way through is dropped
        _CancelCapture();
        // cleared so the next shot cannot reuse a layer created at the old resolution
        _m_elCaptured.SetCompositionLayerTextureName('');
        // Square has no orientation, so the pair goes off and dead for it.
        const strOrientation = PetPhotoTag.Orientation(aspectRatio);
        ['horizontal', 'vertical'].forEach(strType => {
            const elBtn = _m_cp.FindChildInLayoutFile(_OrientationBtnId(strType));
            elBtn.enabled = strOrientation !== '';
            elBtn.checked = strOrientation === strType;
        });
        _m_elPhotoFrame.SwitchClass('aspect-ratio', 'photo-booth-ratio-' + aspectRatio);
        m_aspectRatio = aspectRatio;
    }
    PopupPetPhotoBooth.UpdateAspectRatioSettings = UpdateAspectRatioSettings;
    function UpdateAgent(team) {
        _SetCharacterAndPetPose(_m_elItemModelImagePanel.FindChildInLayoutFile('id-pet-picture-panel'), _m_currentPose);
    }
    PopupPetPhotoBooth.UpdateAgent = UpdateAgent;
    function UpdateWallpaper(wallpaper) {
        _m_currentWallpaper = wallpaper;
        _m_elItemModelImagePanel.FindChildInLayoutFile('id-pet-picture-panel').FireEntityInput('backdrop', 'Skin', wallpaper);
    }
    PopupPetPhotoBooth.UpdateWallpaper = UpdateWallpaper;
    function ChangeStage(mapName) {
        _m_currentStage = mapName; // remembered for the photo book's shot grouping
        _m_elItemModelImagePanel.FindChildInLayoutFile('id-pet-picture-panel').SwitchMap(mapName);
        // SwitchMap respawns the map's entities, so it settles once the new one is up.
        $.Schedule(.2, () => { _SettleStage(mapName); });
        UpdatePhotoPoseSettings(_m_currentPose);
        SetWallpaperOnStageChange(mapName === STUDIO_STAGE);
        // SwitchMap respawned the post volumes, so the filter has to go back on the new ones.
        $.Schedule(1, () => { OnFilterEffect(_m_photoFilter || 'normal'); });
    }
    PopupPetPhotoBooth.ChangeStage = ChangeStage;
    function SetWallpaperOnStageChange(bisStage) {
        if (bisStage) {
            // The new backdrop starts on its material's own skin, so the chosen one goes back on.
            UpdateWallpaper(_m_currentWallpaper);
        }
        _m_cp.FindChildInLayoutFile('id-photo-wallpapers-section').SetHasClass('show', bisStage);
    }
    // Per-effect sound layered under the shared camera FX event. Keyed by the PlayEffect string the button passes.
    const EFFECT_SOUNDS = {
        explosion: 'Photobooth.FX.Explosion',
        lightning: 'Photobooth.FX.Lightning',
        fire: 'Photobooth.FX.FireCircle',
        beam: 'Photobooth.FX.Beam',
        lasers: 'Photobooth.FX.Laser',
        sparks: 'Photobooth.FX.FireWorks',
        confetti: 'Photobooth.FX.Confetti',
        bubbles: 'Photobooth.FX.Bubbles',
        feathers: 'Photobooth.FX.Feathers',
    };
    const EFFECT_REACTION_DELAY = 0.5;
    function PlayEffect(effect) {
        UiToolkitAPI.PlaySoundEvent('Chicken.Camera.FX');
        const strEffectSound = EFFECT_SOUNDS[effect];
        if (strEffectSound) {
            UiToolkitAPI.PlaySoundEvent(strEffectSound);
        }
        // Bird reacts to the effect. Delay lives here: the idle events are shared with other contexts.
        const strReaction = 'Chicken.Idle.' + _Growth().soundStage + '.PhotoBooth';
        $.Schedule(EFFECT_REACTION_DELAY, () => { UiToolkitAPI.PlaySoundEvent(strReaction); });
        effect = _PoseShot(_m_currentPose).effectPrefix + effect;
        _m_elItemModelImagePanel.FindChildInLayoutFile('id-pet-picture-panel').FireEntityInput(effect, 'Start');
        $.Schedule(1, () => { _m_elItemModelImagePanel.FindChildInLayoutFile('id-pet-picture-panel').FireEntityInput(effect, 'Stop'); });
    }
    PopupPetPhotoBooth.PlayEffect = PlayEffect;
    //// Studio light colour ////
    // One colour for the whole studio rather than per pose: the lights are the set.
    const STUDIO_LIGHTS = ['chick_light', 'agent_light'];
    // FireEntityInput is write only, so the current value is kept here. Seeded with the colour both
    // lights are authored with in ui/pet_photo_studio.vmap - change it there and change it here.
    let _m_lightColor = { r: 255, g: 242, b: 230 };
    function _ApplyLightColor(oRGB) {
        _m_lightColor = oRGB;
        const elPanel = _m_elItemModelImagePanel.FindChildInLayoutFile('id-pet-picture-panel');
        const sColor = oRGB.r + ' ' + oRGB.g + ' ' + oRGB.b;
        STUDIO_LIGHTS.forEach(lightName => { elPanel.FireEntityInput(lightName, 'SetColor', sColor); });
    }
    // SwitchMap respawns the lights at their authored colour, so whatever is picked goes back on.
    function _RefreshLightColors() {
        _ApplyLightColor(_m_lightColor);
    }
    // Called while dragging and again with the original on cancel, so this is preview and undo both.
    function ShowLightColorPicker() {
        const elMenu = UiToolkitAPI.ShowCustomLayoutContextMenuParameters('id-pet-setting-btn-light', '', 'file://{resources}/layout/context_menus/context_menu_color_picker.xml', '');
        elMenu.AddClass('ContextMenu_NoArrow');
        CloseSettings();
        // nInitAlpha is left off on purpose - a light has no alpha and the picker hides that row.
        elMenu.Data().initRGB = _m_lightColor;
        elMenu.Data().funcCallback = (oResult) => {
            if (oResult.rgb) {
                _ApplyLightColor(oResult.rgb);
            }
        };
    }
    PopupPetPhotoBooth.ShowLightColorPicker = ShowLightColorPicker;
    //// Headwear ( attach models to the pet ) ////
    function AttachModel(modelPath) {
        _m_currentAttachment = modelPath;
        _ApplyAttachment();
    }
    PopupPetPhotoBooth.AttachModel = AttachModel;
    function _ApplyAttachment() {
        let elPanel = _m_elItemModelImagePanel.FindChildInLayoutFile('id-pet-picture-panel');
        if (!elPanel)
            return;
        elPanel.DetachModelsFromItem(_m_petId);
        if (_m_currentAttachment !== '') {
            const headwearAttachPoint = _m_currentAttachment.includes('glasses') ? 'eyewear_attach' : 'head_attach';
            elPanel.AttachModelToItemWithScale(_m_currentAttachment, _m_petId, headwearAttachPoint, _Growth().headwearScale);
        }
    }
    function CloseSettings() {
        if (_m_elSelectedControls && _m_elSelectedControls.IsValid()) {
            _m_elSelectedControls.SetHasClass('show', false);
            _m_cp.FindChildInLayoutFile('id-pet-photo-controls').Children().forEach(btn => { btn.checked = false; });
            _m_elSelectedControls = null;
        }
    }
    PopupPetPhotoBooth.CloseSettings = CloseSettings;
    // Turns the list on its side. Whatever was picked comes with it, as the same shape flipped.
    function SetAspectRatio(type) {
        let strFlip = '';
        PetPhotoTag.ASPECTS.forEach(aspect => {
            const strOrientation = PetPhotoTag.Orientation(aspect.name);
            // Square is in neither list and stays up for both.
            if (strOrientation === '') {
                return;
            }
            const elBtn = _m_cp.FindChildInLayoutFile(_AspectBtnId(aspect.name));
            if (elBtn.checked && strOrientation !== type) {
                strFlip = PetPhotoTag.FlipAspect(aspect.name);
            }
            elBtn.visible = strOrientation === type;
        });
        if (strFlip !== '') {
            _m_cp.FindChildInLayoutFile(_AspectBtnId(strFlip)).checked = true;
            UpdateAspectRatioSettings(strFlip);
        }
    }
    PopupPetPhotoBooth.SetAspectRatio = SetAspectRatio;
    //// Filters ////
    // The buttons come from PetPhotoTag's FILTERS, so that table owns their order. The css shouts them.
    function _FilterBtnId(strFilter) {
        return 'id-photo-filter-' + strFilter;
    }
    function _HeadwearBtnId(strName) { return 'id-photo-headwear-' + strName; }
    // The rows are PetPhotoTag's, so a button, its label and the photo it takes all read the same row.
    function _MakeHeadwearButtons() {
        const elParent = _m_cp.FindChildInLayoutFile('id-photo-settings-headwear');
        PetPhotoTag.HEADWEAR.forEach(row => {
            if (elParent.FindChildInLayoutFile(_HeadwearBtnId(row.name))) {
                return;
            }
            const elBtn = $.CreatePanel('RadioButton', elParent, _HeadwearBtnId(row.name), {
                class: 'photo-booth-settings__btn',
                group: 'headwear'
            });
            $.CreatePanel('Label', elBtn, '', {
                text: PetPhotoTag.WordFor('e', String(row.id)),
                class: 'stratum-regular'
            });
            elBtn.SetPanelEvent('onactivate', () => { AttachModel(row.model); });
        });
    }
    function _MakeFilterButtons() {
        const elParent = _m_cp.FindChildInLayoutFile('id-photo-settings-filters');
        PetPhotoTag.FILTERS.forEach(filter => {
            if (elParent.FindChildInLayoutFile(_FilterBtnId(filter.name))) {
                return;
            }
            const elBtn = $.CreatePanel('RadioButton', elParent, _FilterBtnId(filter.name), {
                class: 'photo-booth-settings__btn',
                group: 'filter'
            });
            $.CreatePanel('Label', elBtn, '', {
                text: PetPhotoTag.WordFor('f', String(filter.id)),
                class: 'stratum-regular'
            });
            elBtn.SetPanelEvent('onactivate', () => { OnFilterEffect(filter.name); });
        });
        // The strength row shares the panel and trails the list, so it is moved back to the end.
        elParent.FindChildInLayoutFile('id-photo-filter-strength-row').SetParent(elParent);
    }
    function OnFilterEffect(filterName) {
        const elPanel = _GetPicturePanel();
        if (!elPanel) {
            return;
        }
        if (_m_photoFilter) {
            elPanel.FireEntityInput('pet_post_' + _m_photoFilter, 'Disable');
        }
        elPanel.FireEntityInput('pet_post_' + filterName, 'Enable');
        _m_photoFilter = filterName;
        // normal is the no-filter option, so there is no strength to tune
        _m_cp.FindChildInLayoutFile('id-photo-filter-strength-row').SetHasClass('hide', filterName === 'normal');
        // every filter starts at full strength, and this pushes it onto the volume just enabled
        const strength = aAdjust.find(adjust => adjust.kind === 'filter');
        if (strength) {
            _ApplySliderDefault(strength);
        }
    }
    PopupPetPhotoBooth.OnFilterEffect = OnFilterEffect;
    function TurnOffAllFilters() {
        const elPanel = _GetPicturePanel();
        if (!elPanel) {
            return;
        }
        PetPhotoTag.FILTERS.forEach(filter => {
            elPanel.FireEntityInput('pet_post_' + filter.name, 'Disable');
        });
        elPanel.FireEntityInput('post_vanity', 'Disable');
    }
    //// Stickers ////
    const STICKER_LIST_FILTER = 'item_definition:sticker';
    const MAX_PLACED_STICKERS = 10;
    // Layout px on each axis. Small enough that a default-size sticker still fits inside the narrowest frame.
    const STICKER_DROP_JITTER = 120;
    // Kept here rather than read off the layer: a removed sticker's panel stays in the tree until its DeleteAsync lands.
    const _m_placedStickerIds = new Set();
    function UpdateStickerList() {
        const elList = _m_cp.FindChildInLayoutFile('id-pet-sticker-item-list');
        const elSearch = _m_cp.FindChildInLayoutFile('id-pet-sticker-search');
        $.DispatchEvent('SetInventoryFilter', elList, 'inv_graphic_art', 'sticker', 'any', 'inv_sort_age', STICKER_LIST_FILTER, elSearch.text // text filter
        );
    }
    // Asked with no text filter, so a search matching nothing is not an empty locker.
    // SetInventoryFilter fills the list on the spot, which lets count be read straight after.
    function _StickerCount() {
        const elList = _m_cp.FindChildInLayoutFile('id-pet-sticker-item-list');
        $.DispatchEvent('SetInventoryFilter', elList, 'inv_graphic_art', 'sticker', 'any', 'inv_sort_age', STICKER_LIST_FILTER, '' // no text filter
        );
        return elList.count;
    }
    // A tile is greyed out once its sticker is on the photo, or once the photo is full.
    function _RefreshStickerTile(elTile) {
        const itemId = elTile.GetAttributeString('itemid', '0');
        elTile.enabled = !_m_placedStickerIds.has(itemId) && _m_placedStickerIds.size < MAX_PLACED_STICKERS;
    }
    function _RefreshStickerTiles() {
        _m_cp.FindChildInLayoutFile('id-pet-sticker-item-list')
            .FindChildrenWithClassTraverse('item-tile').forEach(_RefreshStickerTile);
    }
    let zIndex = 0;
    function OnItemTileActivated(elPanel, itemId) {
        if (_m_placedStickerIds.has(itemId) || _m_placedStickerIds.size >= MAX_PLACED_STICKERS) {
            return;
        }
        _m_placedStickerIds.add(itemId);
        _RefreshStickerTiles();
        CloseSettings();
        const elParent = _m_cp.FindChildInLayoutFile('id-pet-sticker-layer');
        const elDragPanel = $.CreatePanel('DragPanel', elParent, 'id-drag-panel-' + itemId);
        elDragPanel.style.zIndex = ++zIndex + ';';
        // A little scatter, so a run of picks does not pile up in the corner.
        elDragPanel.SetDragPosition(Math.random() * STICKER_DROP_JITTER, Math.random() * STICKER_DROP_JITTER);
        const elSticker = $.CreatePanel('Panel', elParent, 'id-sticker-panel-' + itemId, { class: 'placed-sticker-container' });
        elSticker.BLoadLayoutSnippet('sticker');
        const elImage = elSticker.FindChildInLayoutFile('sticker');
        elImage.itemid = itemId;
        const elRotateSlider = elSticker.FindChildInLayoutFile('id-sticker-rotate');
        elRotateSlider.min = -180;
        elRotateSlider.max = 180;
        elRotateSlider.default = 0;
        const elScaleSlider = elSticker.FindChildInLayoutFile('id-sticker-scale');
        elScaleSlider.min = 240;
        elScaleSlider.max = 360;
        elScaleSlider.value = 360;
        elRotateSlider.SetPanelEvent('onvaluechanged', () => {
            if (elScaleSlider.value < .5) {
                elScaleSlider.value = 1;
            }
            elImage.style.transform = "rotatez( " + elRotateSlider.value + "deg );";
        });
        elScaleSlider.SetPanelEvent('onvaluechanged', () => {
            elImage.style.width = elScaleSlider.value + 'px;';
        });
        elSticker.FindChildInLayoutFile('id-sticker-remove').SetPanelEvent('onactivate', () => {
            _m_placedStickerIds.delete(itemId);
            elDragPanel.DeleteAsync(0);
            _RefreshStickerTiles();
        });
        elSticker.SetParent(elDragPanel);
    }
    ///Photo Library
    function _SetUpPhotoLibrary() {
        const elLibrary = _m_cp.FindChildInLayoutFile('id-photo-library');
        const elBody = _m_cp.FindChildInLayoutFile('id-photo-library-body');
        elBody.BLoadLayout('file://{resources}/layout/popups/pet_photo_library.xml', false, false);
        PetPhotoLibrary.Init(elBody, {
            bDeletable: true,
            // Always the plain line: the booth does not read the book folder, and the book button beside
            // this list is the answer to where the photos went.
            fnEmpty: () => '#pet_photo_library_empty',
            // A shot whose verify chain has not resolved yet would otherwise put the row straight back.
            fnOnDeleted: (strFileName) => {
                if (_m_lastSavedPhoto === strFileName) {
                    _m_lastSavedPhoto = '';
                }
            },
        });
        // the panel holds the book button too, so it stays up even with no photos in it
        elLibrary.visible = true;
    }
    // The pet's own folder, so the roll shows this bird's photos and nothing another one took.
    function LoadPreviousPhotos() {
        PetPhotoLibrary.LoadFromDisk(_m_petId);
    }
    // Entry point, called when the panel is created.
    {
        $.RegisterForUnhandledEvent("OnItemTileActivated", OnItemTileActivated);
    }
})(PopupPetPhotoBooth || (PopupPetPhotoBooth = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfcGV0X3Bob3RvYm9vdGguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfcGV0X3Bob3RvYm9vdGgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyxzQ0FBc0M7QUFDdEMsb0RBQW9EO0FBQ3BELHNFQUFzRTtBQUN0RSxtREFBbUQ7QUFDbkQsdURBQXVEO0FBR3ZELElBQVUsa0JBQWtCLENBa3NFM0I7QUFsc0VELFdBQVUsa0JBQWtCO0lBRTNCLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztJQUNsQyxNQUFNLGVBQWUsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUMsc0JBQXNCLENBQUMsQ0FBQztJQUMxRixNQUFNLHdCQUF3QixHQUFHLEtBQUssQ0FBQyxxQkFBcUIsQ0FBRSxjQUFjLENBQUUsQ0FBQztJQUUvRSw2RkFBNkY7SUFDN0YsTUFBTSxhQUFhLEdBQUcsS0FBSyxDQUFDLHFCQUFxQixDQUFFLHdCQUF3QixDQUFFLENBQUM7SUFFOUUsSUFBSSxRQUFRLEdBQUcsRUFBRSxDQUFDO0lBQ2xCLElBQUksYUFBYSxHQUFtQixJQUFJLENBQUM7SUFDekMsSUFBSSxjQUFjLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBRSxDQUFDLENBQUUsQ0FBQztJQUM1QyxJQUFJLHlCQUF5QixHQUFHLENBQUMsQ0FBQztJQUNsQyxJQUFJLDBCQUEwQixHQUFHLEtBQUssQ0FBQztJQUN2QyxJQUFJLHFCQUFxQyxDQUFDO0lBQzFDLElBQUksY0FBc0IsQ0FBQztJQUMzQixJQUFJLGlCQUFpQixHQUFHLEVBQUUsQ0FBQztJQUMzQixJQUFJLGFBQWEsR0FBRyxFQUFFLENBQUM7SUFDdkIsSUFBSSxvQkFBb0IsR0FBRyxFQUFFLENBQUM7SUFDOUIsK0ZBQStGO0lBQy9GLE1B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