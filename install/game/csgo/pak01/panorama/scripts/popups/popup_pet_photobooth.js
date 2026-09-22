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
        const strFileName = 'pet_' + Date.now() + _PhotoMetaTag() + '.png';
        _m_lastSavedPhoto = strFileName;
        _WriteLayerPNG(strFileName);
        _m_cp.FindChildInLayoutFile('id-pet-white').TriggerClass('photo-flash');
        UiToolkitAPI.PlaySoundEvent('Chicken.Camera.Shoot');
        _EndCapture();
        _m_verifyJob = $.Schedule(CAPTURE_VERIFY_SEC, () => { _VerifyPhoto(strFileName, 1); });
    }
    function _WriteLayerPNG(strFileName) {
        const strPath = GameInterfaceAPI.PreparePetPhoto(_m_petId, strFileName);
        if (!strPath) {
            return;
        }
        _m_elCaptured.WriteCompositionLayerPNGScaled(strPath, 'USRLOCAL', PHOTO_MAX_LONG_EDGE);
    }
    function _VerifyPhoto(strFileName, nTry) {
        _m_verifyJob = undefined;
        if (_PhotoOnDisk(strFileName)) {
            PetPhotoLibrary.Insert(strFileName);
            return;
        }
        if (nTry < CAPTURE_TRIES) {
            _WriteLayerPNG(strFileName);
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
    function UpdateStickerList() {
        const elList = _m_cp.FindChildInLayoutFile('id-pet-sticker-item-list');
        const elSearch = _m_cp.FindChildInLayoutFile('id-pet-sticker-search');
        $.DispatchEvent('SetInventoryFilter', elList, 'inv_graphic_art', 'sticker', 'any', 'inv_sort_age', '', elSearch.text);
    }
    function _StickerCount() {
        const elList = _m_cp.FindChildInLayoutFile('id-pet-sticker-item-list');
        $.DispatchEvent('SetInventoryFilter', elList, 'inv_graphic_art', 'sticker', 'any', 'inv_sort_age', '', '');
        return elList.count;
    }
    let zIndex = 0;
    function OnItemTileActivated(elPanel, itemId) {
        CloseSettings();
        const elParent = _m_cp.FindChildInLayoutFile('id-pet-sticker-layer');
        const elDragPanel = $.CreatePanel('DragPanel', elParent, 'id-drag-panel-' + itemId);
        elDragPanel.style.zIndex = ++zIndex + ';';
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
            elDragPanel.DeleteAsync(0);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfcGV0X3Bob3RvYm9vdGguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfcGV0X3Bob3RvYm9vdGgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyxzQ0FBc0M7QUFDdEMsb0RBQW9EO0FBQ3BELHNFQUFzRTtBQUN0RSxtREFBbUQ7QUFDbkQsdURBQXVEO0FBR3ZELElBQVUsa0JBQWtCLENBOG5FM0I7QUE5bkVELFdBQVUsa0JBQWtCO0lBRTNCLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztJQUNsQyxNQUFNLGVBQWUsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUMsc0JBQXNCLENBQUMsQ0FBQztJQUMxRixNQUFNLHdCQUF3QixHQUFHLEtBQUssQ0FBQyxxQkFBcUIsQ0FBRSxjQUFjLENBQUUsQ0FBQztJQUcvRSxNQUFNLGFBQWEsR0FBRyxLQUFLLENBQUMscUJBQXFCLENBQUUsd0JBQXdCLENBQUUsQ0FBQztJQUU5RSxJQUFJLFFBQVEsR0FBRyxFQUFFLENBQUM7SUFDbEIsSUFBSSxhQUFhLEdBQW1CLElBQUksQ0FBQztJQUN6QyxJQUFJLGNBQWMsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFFLENBQUMsQ0FBRSxDQUFDO0lBQzVDLElBQUkseUJBQXlCLEdBQUcsQ0FBQyxDQUFDO0lBQ2xDLElBQUksMEJBQTBCLEdBQUcsS0FBSyxDQUFDO0lBQ3ZDLElBQUkscUJBQXFDLENBQUM7SUFDMUMsSUFBSSxjQUFzQixDQUFDO0lBQzNCLElBQUksaUJBQWlCLEdBQUcsRUFBRSxDQUFDO0lBQzNCLElBQUksYUFBYSxHQUFHLEVBQUUsQ0FBQztJQUN2QixJQUFJLG9CQUFvQixHQUFHLEVBQUUsQ0FBQztJQUU5QixNQUFNLFlBQVksR0FBRyxxQkFBcUIsQ0FBQztJ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