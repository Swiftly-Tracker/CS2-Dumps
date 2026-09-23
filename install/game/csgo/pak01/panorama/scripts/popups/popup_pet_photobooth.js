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
    const STUDIO_STAGE = 'ui/pet_photo_studio';
    let _m_currentStage = STUDIO_STAGE;
    const DEFAULT_WALLPAPER = '1';
    let _m_currentWallpaper = DEFAULT_WALLPAPER;
    let _m_setupValues = {};
    function Init() {
        const popupPetParams = _m_cp.GetAttributeString('pet_id', '').split(',');
        _m_petId = (popupPetParams && (popupPetParams.length > 0)) ? popupPetParams[0] : '';
        _m_setupValues = _ReadSetup(_m_cp.GetAttributeString('booth_setup', ''));
        GameInterfaceAPI.SetChickenAudioSuppressed('pet_photobooth', true);
        _m_cp.GetParent().GetParent().SetHasClass('pet-event-blur', true);
        _SetupCloseBtn('id-pet-photo-close-btn');
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
    function OpenBook() {
        UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_pet_book.xml', 'spread=' + _m_cp.GetAttributeString('book_spread', '0')
            + '&' + 'booth_setup=' + _SetupString()
            + '&' + 'from_booth=1');
        Close();
    }
    PopupPetPhotoBooth.OpenBook = OpenBook;
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
    const NO_HEADWEAR = 'none';
    const SETUP_PAIR_SEPARATOR = ';';
    const SETUP_KEY_VALUE_SEPARATOR = ':';
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
        aSetupFields.forEach(field => {
            const strValue = _m_setupValues[field.key];
            if (field.Apply && strValue !== undefined) {
                field.Apply(strValue);
            }
        });
    }
    function _SetupStageMap() {
        const row = PetPhotoTag.STAGES.find(entry => entry.name === _m_setupValues['stage']);
        return row && _BStageUnlocked(row) ? row.map : STUDIO_STAGE;
    }
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
        if (_m_photoBoothUpgradeLevel > 0) {
            _MakeSettingsButtons();
            _MakeActivityButtons();
            _MakeHeadwearButtons();
            _m_cp.FindChildInLayoutFile('id-pet-sticker-search')
                .SetPanelEvent('ontextentrychange', UpdateStickerList);
            $.RegisterEventHandler('CSGOInventoryItemLoaded', _m_cp.FindChildInLayoutFile('id-pet-sticker-item-list'), _RefreshStickerTile);
            _m_cp.FindChildTraverse('id-photo-team-ct').checked = true;
            _m_currentStage = _SetupStageMap();
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
                if (_m_currentStage !== STUDIO_STAGE) {
                    _SettleStage(_m_currentStage);
                }
                TurnOffAllFilters();
                _m_cp.FindChildTraverse(_FilterBtnId('normal')).checked = true;
                OnFilterEffect('normal');
                _RefreshAdjustments();
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
            _RefreshCountdown();
        }
    }
    function _MakeSettingsButtons() {
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
                    const strTip = stage.age_requirement ? '#pet_photo_booth_map_locked_age'
                        : _m_photoBoothUpgradeLevel === GROWTH_CHICK ? '#pet_photo_booth_map_locked_chick'
                            : '#pet_photo_booth_map_locked_teen';
                    elBtn.SetPanelEvent('onmouseover', () => { UiToolkitAPI.ShowTextTooltip(elBtn.id, strTip); });
                    elBtn.SetPanelEvent('onmouseout', () => { UiToolkitAPI.HideTextTooltip(); });
                }
            }
        });
    }
    function _BStageUnlocked(stage) {
        if (stage.age_requirement) {
            return _m_photoBoothUpgradeLevel >= stage.age_requirement;
        }
        if (stage.achievement) {
            return InventoryAPI.PetHasAchievement(_m_petId, stage.achievement);
        }
        return true;
    }
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
                elPanel.hittest = true;
                elPanel.SetAcceptsInput(true);
                elPanel.SetAcceptsFocus(true);
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
    const ACTIVITY_START = .5;
    const ACTIVITY_MAX = 5.0;
    const ACTIVITY_POLL = .1;
    let _m_running = undefined;
    let _m_activityJob = undefined;
    function _ClearActivity() {
        _m_activityJob = _CancelJob(_m_activityJob);
        _m_running = undefined;
    }
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
    function _RefreshActivityButtons() {
        const bSolo = _IsSoloPose(_m_currentPose);
        _m_aActivityBtns.forEach(btn => {
            const strAgeTip = _m_ageTips[btn.el.id] || '';
            const bRunning = _m_running !== undefined && _m_running.row === btn.row;
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
    const ACHIEVEMENT_UNLOCKS = {
        'id-photo-effect-fire': 'killed-by-burn',
        'id-photo-effect-lightning': 'killed-by-taser',
        'id-photo-effect-explosion': 'killed-by-planted-c4',
    };
    const ACHIEVEMENT_LOCKED_TIP = '#pet_photo_booth_age_scary_brave';
    let _m_ageTips = {};
    function _ApplyAgeGates() {
        aAgeGates.forEach(gate => {
            const bAllowed = (gate.min === undefined || _m_photoBoothUpgradeLevel >= gate.min) &&
                (gate.max === undefined || _m_photoBoothUpgradeLevel <= gate.max);
            gate.ids.forEach(strId => {
                const elBtn = _m_cp.FindChildTraverse(strId);
                if (!elBtn || !elBtn.IsValid()) {
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
                elBtn.SetPanelEvent('onmouseover', () => { UiToolkitAPI.ShowTextTooltip(strId, strTip); });
                elBtn.SetPanelEvent('onmouseout', () => { UiToolkitAPI.HideTextTooltip(); });
            });
        });
    }
    function _PoseShot(pose) { return _IsSoloPose(pose) ? SOLO_SHOT : POSED_SHOT; }
    function _PoseOrbitRadius(pose) {
        return pose.orbit === undefined ? _Growth().soloOrbit : pose.orbit;
    }
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
        _ApplyAttachment();
    }
    let _m_captureJob = undefined;
    let _m_verifyJob = undefined;
    let _m_bCapturing = false;
    function _CancelJob(nJob) {
        if (nJob !== undefined) {
            $.CancelScheduled(nJob);
        }
        return undefined;
    }
    const COMPOSITION_LAYER_WARMUP = .1;
    const CAPTURE_VERIFY_SEC = .2;
    const CAPTURE_TRIES = 4;
    const PHOTO_MAX_LONG_EDGE = 1200;
    const PHOTO_JPEG_QUALITY = 95;
    const COUNTDOWN_SEC = 3;
    function _BTimerMode() { return _m_cp.FindChildInLayoutFile('id-pet-take-picture').checked; }
    function _SetShutterEnabled(bEnabled) {
        _m_cp.FindChildInLayoutFile('id-pet-take-picture-instant').enabled = bEnabled;
    }
    function _RefreshCountdown() {
        const elCountdown = _m_cp.FindChildInLayoutFile('id-pet-countdown');
        elCountdown.SetDialogVariableInt('countdown', COUNTDOWN_SEC);
        elCountdown.SetHasClass('show', _BTimerMode());
        elCountdown.SetHasClass('running', false);
    }
    function ToggleTimerMode() {
        _CancelCapture();
        _RefreshCountdown();
    }
    PopupPetPhotoBooth.ToggleTimerMode = ToggleTimerMode;
    function _BeginCapture() {
        _m_bCapturing = true;
        _SetShutterEnabled(false);
        _m_elCaptured.SetCompositionLayerTextureName(m_aspectRatio);
        _SetCapturing(true);
    }
    function _SetCapturing(bCapturing) {
        _m_elCaptured.SetHasClass('pet-capturing', bCapturing);
    }
    function _CancelCapture() {
        _m_captureJob = _CancelJob(_m_captureJob);
        _m_verifyJob = _CancelJob(_m_verifyJob);
        if (_m_bCapturing) {
            _EndCapture();
        }
    }
    function _EndCapture() {
        _m_bCapturing = false;
        _SetShutterEnabled(true);
        _SetCapturing(false);
        _RefreshCountdown();
    }
    function _CancelPhotoJobs() {
        _CancelCapture();
        _m_zoomReadoutJob = _CancelJob(_m_zoomReadoutJob);
        _ClearActivity();
    }
    function _WritePhoto() {
        _m_captureJob = undefined;
        const strFileName = 'pet_' + Date.now() + _PhotoMetaTag() + PetPhotoTag.EXT;
        _m_lastSavedPhoto = strFileName;
        _WriteLayerJPEG(strFileName);
        _m_cp.FindChildInLayoutFile('id-pet-white').TriggerClass('photo-flash');
        UiToolkitAPI.PlaySoundEvent('Chicken.Camera.Shoot');
        _EndCapture();
        _m_verifyJob = $.Schedule(CAPTURE_VERIFY_SEC, () => { _VerifyPhoto(strFileName, 1); });
    }
    function _WriteLayerJPEG(strFileName) {
        const strPath = GameInterfaceAPI.PreparePetPhoto(_m_petId, strFileName);
        if (!strPath) {
            return;
        }
        _m_elCaptured.WriteCompositionLayerJPEG(strPath, 'USRLOCAL', PHOTO_MAX_LONG_EDGE, PHOTO_JPEG_QUALITY);
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
        const nStickers = _m_elCaptured
            .FindChildrenWithClassTraverse('placed-sticker-container').length;
        if (_m_lastSavedPhoto === strFileName) {
            _m_lastSavedPhoto = '';
        }
        _WarnPhotoFailed();
    }
    function _PhotoOnDisk(strFileName) {
        return GameInterfaceAPI.FindFiles(PetPhotoTag.LibraryFolder(_m_petId) + '/' + strFileName, 'USRLOCAL').length > 0;
    }
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
            _WritePhoto();
            return;
        }
        elCountdown.SetDialogVariableInt('countdown', nRemaining);
        UiToolkitAPI.PlaySoundEvent('UI.Premier.CounterTimer');
        _m_captureJob = $.Schedule(1, () => { _Countdown(nRemaining - 1); });
    }
    function TakePhoto() {
        if (_m_bCapturing) {
            return;
        }
        _CancelCapture();
        _BeginCapture();
        if (_BTimerMode()) {
            _m_cp.FindChildInLayoutFile('id-pet-countdown').SetHasClass('running', true);
            _Countdown(COUNTDOWN_SEC);
            return;
        }
        _m_captureJob = $.Schedule(COMPOSITION_LAYER_WARMUP, _WritePhoto);
    }
    PopupPetPhotoBooth.TakePhoto = TakePhoto;
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
    function _PetAttr(strAttrName) {
        const value = Number(InventoryAPI.GetItemAttributeValue(_m_petId, '{uint32}' + strAttrName));
        return isNaN(value) ? 0 : value;
    }
    function _CurrentActivity() {
        if (!_IsSoloPose(_m_currentPose)) {
            return undefined;
        }
        const elPanel = _GetPhotoBoothMapPanel();
        if (!elPanel || typeof elPanel.GetPetActivityVariationOnItem !== 'function') {
            return undefined;
        }
        const strEntity = _Growth().entityName;
        const strActivity = elPanel.GetPetActivityOnItem(strEntity);
        const nVariation = elPanel.GetPetActivityVariationOnItem(strEntity);
        return PetPhotoTag.ACTIVITIES.find(activity => activity.activity === strActivity &&
            (activity.variation === undefined ? nVariation < 0 : activity.variation === nVariation));
    }
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
            if (_m_nZoomShown >= 0) {
                UiToolkitAPI.PlaySoundEvent(nZoom > _m_nZoomShown ? 'Chicken.Photo.ZoomIn'
                    : 'Chicken.Photo.Zoomout');
            }
            _m_nZoomShown = nZoom;
            _m_cp.SetDialogVariableInt('zoom_value', nZoom);
            _m_cp.SetDialogVariable('zoom_band', PetPhotoTag.WordFor('z', String(nZoom)));
        }
        _m_zoomReadoutJob = $.Schedule(ZOOM_READOUT_SEC, _TickZoomReadout);
    }
    function _CurrentZoom() {
        const elPanel = _GetPhotoBoothMapPanel();
        if (!elPanel || typeof elPanel.GetZoom !== 'function') {
            return 0;
        }
        const nZoom = elPanel.GetZoom();
        return (typeof nZoom === 'number' && isFinite(nZoom) && nZoom > 0) ? Math.floor(nZoom) : 0;
    }
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
    function ResetAdjustSliders() {
        aAdjust.forEach(adjust => {
            if (adjust.kind !== 'filter') {
                _ApplySliderDefault(adjust);
            }
        });
    }
    PopupPetPhotoBooth.ResetAdjustSliders = ResetAdjustSliders;
    function _SliderRowId(type) { return 'id-pet-slider-row-' + type; }
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
        elParent.FindChildInLayoutFile('id-pet-slider-reset').SetParent(elParent);
    }
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
    function _ApplyAdjust(adjust, value) {
        const elPanel = _GetPicturePanel();
        switch (adjust.kind) {
            case 'post-pair':
                elPanel?.SetPostProcessingWeight(adjust.up, value > 0 ? value : 0);
                elPanel?.SetPostProcessingWeight(adjust.down, value < 0 ? -value : 0);
                break;
            case 'post-single':
                elPanel?.SetPostProcessingWeight(adjust.entity, value);
                break;
            case 'filter':
                if (_m_photoFilter) {
                    elPanel?.SetPostProcessingWeight('pet_post_' + _m_photoFilter, value);
                }
                break;
            case 'brightness':
                _m_cp.FindChildTraverse('id-pet-model').style.brightness = value.toFixed(2);
                break;
            case 'overlay':
                {
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
            elBtn.visible = PetPhotoTag.Orientation(aspect.name) !== 'vertical';
            elBtn.SetPanelEvent('onactivate', () => { UpdateAspectRatioSettings(aspect.name); });
        });
    }
    function UpdateAspectRatioSettings(aspectRatio) {
        _CancelCapture();
        _m_elCaptured.SetCompositionLayerTextureName('');
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
        _m_currentStage = mapName;
        _m_elItemModelImagePanel.FindChildInLayoutFile('id-pet-picture-panel').SwitchMap(mapName);
        $.Schedule(.2, () => { _SettleStage(mapName); });
        UpdatePhotoPoseSettings(_m_currentPose);
        SetWallpaperOnStageChange(mapName === STUDIO_STAGE);
        $.Schedule(1, () => { OnFilterEffect(_m_photoFilter || 'normal'); });
    }
    PopupPetPhotoBooth.ChangeStage = ChangeStage;
    function SetWallpaperOnStageChange(bisStage) {
        if (bisStage) {
            UpdateWallpaper(_m_currentWallpaper);
        }
        _m_cp.FindChildInLayoutFile('id-photo-wallpapers-section').SetHasClass('show', bisStage);
    }
    function PlayEffect(effect) {
        UiToolkitAPI.PlaySoundEvent('Chicken.Camera.FX');
        effect = _PoseShot(_m_currentPose).effectPrefix + effect;
        _m_elItemModelImagePanel.FindChildInLayoutFile('id-pet-picture-panel').FireEntityInput(effect, 'Start');
        $.Schedule(1, () => { _m_elItemModelImagePanel.FindChildInLayoutFile('id-pet-picture-panel').FireEntityInput(effect, 'Stop'); });
    }
    PopupPetPhotoBooth.PlayEffect = PlayEffect;
    const STUDIO_LIGHTS = ['chick_light', 'agent_light'];
    let _m_lightColor = { r: 255, g: 242, b: 230 };
    function _ApplyLightColor(oRGB) {
        _m_lightColor = oRGB;
        const elPanel = _m_elItemModelImagePanel.FindChildInLayoutFile('id-pet-picture-panel');
        const sColor = oRGB.r + ' ' + oRGB.g + ' ' + oRGB.b;
        STUDIO_LIGHTS.forEach(lightName => { elPanel.FireEntityInput(lightName, 'SetColor', sColor); });
    }
    function _RefreshLightColors() {
        _ApplyLightColor(_m_lightColor);
    }
    function ShowLightColorPicker() {
        const elMenu = UiToolkitAPI.ShowCustomLayoutContextMenuParameters('id-pet-setting-btn-light', '', 'file://{resources}/layout/context_menus/context_menu_color_picker.xml', '');
        elMenu.AddClass('ContextMenu_NoArrow');
        CloseSettings();
        elMenu.Data().initRGB = _m_lightColor;
        elMenu.Data().funcCallback = (oResult) => {
            if (oResult.rgb) {
                _ApplyLightColor(oResult.rgb);
            }
        };
    }
    PopupPetPhotoBooth.ShowLightColorPicker = ShowLightColorPicker;
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
    function SetAspectRatio(type) {
        let strFlip = '';
        PetPhotoTag.ASPECTS.forEach(aspect => {
            const strOrientation = PetPhotoTag.Orientation(aspect.name);
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
    function _FilterBtnId(strFilter) {
        return 'id-photo-filter-' + strFilter;
    }
    function _HeadwearBtnId(strName) { return 'id-photo-headwear-' + strName; }
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
        _m_cp.FindChildInLayoutFile('id-photo-filter-strength-row').SetHasClass('hide', filterName === 'normal');
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
    const STICKER_LIST_FILTER = 'item_definition:sticker';
    const MAX_PLACED_STICKERS = 10;
    const STICKER_DROP_JITTER = 120;
    const _m_placedStickerIds = new Set();
    function UpdateStickerList() {
        const elList = _m_cp.FindChildInLayoutFile('id-pet-sticker-item-list');
        const elSearch = _m_cp.FindChildInLayoutFile('id-pet-sticker-search');
        $.DispatchEvent('SetInventoryFilter', elList, 'inv_graphic_art', 'sticker', 'any', 'inv_sort_age', STICKER_LIST_FILTER, elSearch.text);
    }
    function _StickerCount() {
        const elList = _m_cp.FindChildInLayoutFile('id-pet-sticker-item-list');
        $.DispatchEvent('SetInventoryFilter', elList, 'inv_graphic_art', 'sticker', 'any', 'inv_sort_age', STICKER_LIST_FILTER, '');
        return elList.count;
    }
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
    function _SetUpPhotoLibrary() {
        const elLibrary = _m_cp.FindChildInLayoutFile('id-photo-library');
        const elBody = _m_cp.FindChildInLayoutFile('id-photo-library-body');
        elBody.BLoadLayout('file://{resources}/layout/popups/pet_photo_library.xml', false, false);
        PetPhotoLibrary.Init(elBody, {
            bDeletable: true,
            fnEmpty: () => '#pet_photo_library_empty',
            fnOnDeleted: (strFileName) => {
                if (_m_lastSavedPhoto === strFileName) {
                    _m_lastSavedPhoto = '';
                }
            },
        });
        elLibrary.visible = true;
    }
    function LoadPreviousPhotos() {
        PetPhotoLibrary.LoadFromDisk(_m_petId);
    }
    {
        $.RegisterForUnhandledEvent("OnItemTileActivated", OnItemTileActivated);
    }
})(PopupPetPhotoBooth || (PopupPetPhotoBooth = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfcGV0X3Bob3RvYm9vdGguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfcGV0X3Bob3RvYm9vdGgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyxzQ0FBc0M7QUFDdEMsb0RBQW9EO0FBQ3BELHNFQUFzRTtBQUN0RSxtREFBbUQ7QUFDbkQsdURBQXVEO0FBR3ZELElBQVUsa0JBQWtCLENBd3FFM0I7QUF4cUVELFdBQVUsa0JBQWtCO0lBRTNCLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztJQUNsQyxNQUFNLGVBQWUsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUMsc0JBQXNCLENBQUMsQ0FBQztJQUMxRixNQUFNLHdCQUF3QixHQUFHLEtBQUssQ0FBQyxxQkFBcUIsQ0FBRSxjQUFjLENBQUUsQ0FBQztJQUcvRSxNQUFNLGFBQWEsR0FBRyxLQUFLLENBQUMscUJBQXFCLENBQUUsd0JBQXdCLENBQUUsQ0FBQztJQUU5RSxJQUFJLFFBQVEsR0FBRyxFQUFFLENBQUM7SUFDbEIsSUFBSSxhQUFhLEdBQW1CLElBQUksQ0FBQztJQUN6QyxJQUFJLGNBQWMsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFFLENBQUMsQ0FBRSxDQUFDO0lBQzVDLElBQUkseUJBQXlCLEdBQUcsQ0FBQyxDQUFDO0lBQ2xDLElBQUksMEJBQTBCLEdBQUcsS0FBSyxDQUFDO0lBQ3ZDLElBQUkscUJBQXFDLENBQUM7SUFDMUMsSUFBSSxjQUFzQixDQUFDO0lBQzNCLElBQUksaUJBQWlCLEdBQUcsRUFBRSxDQUFDO0lBQzNCLElBQUksYUFBYSxHQUFHLEVBQUUsQ0FBQztJQUN2QixJQUFJLG9CQUFvQixHQUFHLEVBQUUsQ0FBQztJQUU5QixNQUFNLFlBQVksR0FBRyxxQkFBcUIsQ0FBQztJ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