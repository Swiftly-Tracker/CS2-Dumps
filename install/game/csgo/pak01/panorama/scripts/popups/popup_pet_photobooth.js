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
            const team = selectedBtn.GetAttributeString('data-type', 'ct');
            let charId = LoadoutAPI.GetItemID(team, 'customplayer');
            const settings = ItemInfo.GetOrUpdateVanityCharacterSettings(charId);
            settings.panel = elPanel;
            settings.petItemId = _m_petId;
            elPanel.SetActiveCharacter(6);
            let model = ItemInfo.GetModelPlayer(charId);
            elPanel.SetPlayerCharacterItemID(charId);
            elPanel.SetPlayerModel(model);
            elPanel.EquipPlayerWithItem(LoadoutAPI.GetItemID(team, 'clothing_hands'));
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
        const strReaction = 'Chicken.Idle.' + _Growth().soundStage + '.PhotoBooth';
        $.Schedule(EFFECT_REACTION_DELAY, () => { UiToolkitAPI.PlaySoundEvent(strReaction); });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfcGV0X3Bob3RvYm9vdGguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfcGV0X3Bob3RvYm9vdGgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyxzQ0FBc0M7QUFDdEMsb0RBQW9EO0FBQ3BELHNFQUFzRTtBQUN0RSxtREFBbUQ7QUFDbkQsdURBQXVEO0FBR3ZELElBQVUsa0JBQWtCLENBb3NFM0I7QUFwc0VELFdBQVUsa0JBQWtCO0lBRTNCLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztJQUNsQyxNQUFNLGVBQWUsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUMsc0JBQXNCLENBQUMsQ0FBQztJQUMxRixNQUFNLHdCQUF3QixHQUFHLEtBQUssQ0FBQyxxQkFBcUIsQ0FBRSxjQUFjLENBQUUsQ0FBQztJQUcvRSxNQUFNLGFBQWEsR0FBRyxLQUFLLENBQUMscUJBQXFCLENBQUUsd0JBQXdCLENBQUUsQ0FBQztJQUU5RSxJQUFJLFFBQVEsR0FBRyxFQUFFLENBQUM7SUFDbEIsSUFBSSxhQUFhLEdBQW1CLElBQUksQ0FBQztJQUN6QyxJQUFJLGNBQWMsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFFLENBQUMsQ0FBRSxDQUFDO0lBQzVDLElBQUkseUJBQXlCLEdBQUcsQ0FBQyxDQUFDO0lBQ2xDLElBQUksMEJBQTBCLEdBQUcsS0FBSyxDQUFDO0lBQ3ZDLElBQUkscUJBQXFDLENBQUM7SUFDMUMsSUFBSSxjQUFzQixDQUFDO0lBQzNCLElBQUksaUJBQWlCLEdBQUcsRUFBRSxDQUFDO0lBQzNCLElBQUksYUFBYSxHQUFHLEVBQUUsQ0FBQztJQUN2QixJQUFJLG9CQUFvQixHQUFHLEVBQUUsQ0FBQztJQUU5QixNQUFNLFlBQVksR0FBRyxxQkFBcUIsQ0FBQztJ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