"use strict";
/// <reference path="common/characteranims.ts" />
/// <reference path="common/iteminfo.ts" />
/// <reference path="common/tint_spray_icon.ts" />
/// <reference path="popups/popup_inspect_shared.ts" />
var InspectModelImage;
(function (InspectModelImage) {
    let m_elPanel = null;
    let m_elContainer = null;
    let m_isLaptopOpening = false;
    InspectModelImage.m_CameraSettingsPerWeapon = [
        { type: 'weapon_awp', camera: '7', zoom_camera: 'weapon_awp_zoom,weapon_awp_front_zoom' },
        { type: 'weapon_aug', camera: '3', zoom_camera: 'weapon_aug_zoom' },
        { type: 'weapon_sg556', camera: '4', zoom_camera: 'weapon_ak47_zoom,weapon_ak47_front_zoom' },
        { type: 'weapon_ssg08', camera: '6', zoom_camera: 'weapon_ssg08_zoom,weapon_ssg08_front_zoom' },
        { type: 'weapon_ak47', camera: '4', zoom_camera: 'weapon_ak47_zoom,weapon_ak47_front_zoom' },
        { type: 'weapon_m4a1_silencer', camera: '6', zoom_camera: 'weapon_m4a1_silencer_zoom,weapon_m4a1_silencer_front_zoom' },
        { type: 'weapon_famas', camera: '4' },
        { type: 'weapon_g3sg1', camera: '5', zoom_camera: 'weapon_g3sg1_zoom,weapon_g3sg1_front_zoom' },
        { type: 'weapon_galilar', camera: '3', zoom_camera: 'weapon_galilar_zoom' },
        { type: 'weapon_m4a1', camera: '4', zoom_camera: 'weapon_ak47_zoom,weapon_ak47_front_zoom' },
        { type: 'weapon_scar20', camera: '5', zoom_camera: 'weapon_g3sg1_zoom,weapon_g3sg1_front_zoom' },
        { type: 'weapon_mp5sd', camera: '3' },
        { type: 'weapon_xm1014', camera: '4', zoom_camera: 'weapon_xm1014_zoom' },
        { type: 'weapon_m249', camera: '6', zoom_camera: 'weapon_m249_zoom' },
        { type: 'weapon_ump45', camera: '3' },
        { type: 'weapon_bizon', camera: '3' },
        { type: 'weapon_mag7', camera: '3' },
        { type: 'weapon_nova', camera: '5', zoom_camera: 'weapon_g3sg1_zoom,weapon_g3sg1_front_zoom' },
        { type: 'weapon_sawedoff', camera: '3' },
        { type: 'weapon_negev', camera: '5', zoom_camera: 'weapon_negev_zoom' },
        { type: 'weapon_usp_silencer', camera: '2', zoom_camera: '0' },
        { type: 'weapon_elite', camera: '2' },
        { type: 'weapon_tec9', camera: '2' },
        { type: 'weapon_revolver', camera: '2' },
        { type: 'weapon_c4', camera: '3' },
        { type: 'weapon_taser', camera: '0' },
    ];
    function Init(elContainer, itemId) {
        const strViewFunc = InspectShared.GetPopupSetting('force_inspect_view_type');
        m_isLaptopOpening = (elContainer.Data().isLapTopOpening === true) ? true : false;
        if (!InventoryAPI.IsValidItemID(itemId)) {
            return '';
        }
        m_elContainer = elContainer;
        if (ItemInfo.ItemDefinitionNameSubstrMatch(itemId, 'tournament_journal_') && strViewFunc === 'graffiti')
            itemId = ItemInfo.GetFauxReplacementItemID(itemId, 'graffiti');
        const model = ItemInfo.GetModelPathFromJSONOrAPI(itemId);
        _InitSceneBasedOnItemType(model, itemId);
        return model;
    }
    InspectModelImage.Init = Init;
    function _UseAcknowledge() {
        return m_elContainer.Data().useAcknowledge ? m_elContainer.Data().useAcknowledge : false;
    }
    function _InitSceneBasedOnItemType(model, itemId) {
        if (ItemInfo.IsCharacter(itemId)) {
            m_elPanel = _InitCharScene(itemId);
        }
        else if (ItemInfo.IsMelee(itemId)) {
            m_elPanel = _InitMeleeScene(itemId);
        }
        else if (ItemInfo.IsWeapon(itemId)) {
            DeleteExistingItemPanel(itemId, 'ItemPreviewPanel');
            m_elPanel = _InitWeaponScene(itemId);
        }
        else if (ItemInfo.IsDisplayItem(itemId)) {
            DeleteExistingItemPanel(itemId, 'ItemPreviewPanel');
            m_elPanel = _InitDisplayScene(itemId);
        }
        else if (ItemInfo.IsKeychain(itemId)) {
            m_elPanel = _InitKeyChainScene(itemId);
        }
        else if (InventoryAPI.DoesItemMatchDefinitionByName(itemId, "sticker_display_case")) {
            const defKeychain = InventoryAPI.GetItemDefinitionIndexFromDefinitionName('keychain');
            const kcModel = InventoryAPI.GetItemAttributeValue(itemId, '{uint32}display case keychain id');
            const fauxItemId = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(defKeychain, kcModel);
            m_elPanel = _InitKeyChainScene(fauxItemId);
        }
        else if (InventoryAPI.GetLoadoutCategory(itemId) == "musickit") {
            m_elPanel = _InitMusicKitScene(itemId);
        }
        else if (ItemInfo.IsSprayPaint(itemId) || ItemInfo.IsSpraySealed(itemId)) {
            DeleteExistingItemPanel(itemId, 'ItemPreviewPanel');
            m_elPanel = _InitSprayScene(itemId);
        }
        else if (ItemInfo.IsCase(itemId)) {
            m_elPanel = model ? _InitCaseScene(itemId) : _SetImage(itemId);
        }
        else if (ItemInfo.IsNameTag(itemId)) {
            m_elPanel = _InitNametagScene(itemId);
        }
        else if (ItemInfo.IsSticker(itemId) || ItemInfo.IsPatch(itemId)) {
            DeleteExistingItemPanel(itemId, 'ItemPreviewPanel');
            m_elPanel = _InitStickerScene(itemId);
        }
        else if (ItemInfo.ItemDefinitionNameSubstrMatch(itemId, 'tournament_pass_') && ItemInfo.ItemDefinitionNameSubstrMatch(itemId, '_credits')) {
            DeleteExistingItemPanel(itemId, 'ItemPreviewPanel');
            m_elPanel = _InitDisplayScene(itemId, true);
        }
        else if (model) {
            if (InventoryAPI.GetLoadoutCategory(itemId) === 'clothing') {
                m_elPanel = _InitGlovesScene(itemId);
            }
            else if (ItemInfo.ItemHasCapability(itemId, 'decodable')) {
                if (InventoryAPI.GetItemAttributeValue(itemId, '{uint32}volatile container')) {
                    m_elPanel = _InitLaptopScene(itemId);
                }
                else {
                    m_elPanel = _InitCaseScene(itemId);
                }
            }
        }
        else if (!model) {
            m_elPanel = _SetImage(itemId);
        }
        return m_elPanel;
    }
    function _InitCharScene(itemId, bHide = false, weaponItemId = '', contextPanel = $.GetContextPanel()) {
        let elPanel = GetExistingItemPanel('CharPreviewPanel');
        let active_item_idx = 5;
        let mapName = _GetBackGroundMap();
        if (!elPanel) {
            elPanel = $.CreatePanel('MapPlayerPreviewPanel', m_elContainer, 'CharPreviewPanel', {
                "require-composition-layer": "true",
                "pin-fov": "vertical",
                class: 'full-width full-height hidden',
                camera: 'cam_char_inspect_wide_intro',
                player: "true",
                map: mapName,
                initial_entity: 'item',
                mouse_rotate: false,
                playername: "vanity_character",
                animgraphcharactermode: "inventory-inspect",
                animgraphturns: "false",
                workshop_preview: InspectShared.GetPopupSetting('is_workshop_preview')
            });
            elPanel.Data().loadedMap = mapName;
        }
        elPanel.Data().itemId = itemId;
        const settings = ItemInfo.GetOrUpdateVanityCharacterSettings(itemId);
        elPanel.SetActiveCharacter(active_item_idx);
        settings.panel = elPanel;
        settings.weaponItemId = weaponItemId ? weaponItemId : settings.weaponItemId ? settings.weaponItemId : '';
        CharacterAnims.PlayAnimsOnPanel(settings);
        const worktype = InspectShared.GetPopupSetting('work_type', contextPanel);
        if (worktype !== 'can_patch' && worktype !== 'remove_patch') {
            _TransitionCamera(elPanel, 'char_inspect_wide');
        }
        if (!bHide) {
            elPanel.RemoveClass('hidden');
        }
        _AdditionalMapLoadSettings(elPanel, active_item_idx, mapName);
        let elInspectPanel = GetExistingItemPanel('ItemPreviewPanel');
        if (elInspectPanel) {
            settings.panel = elInspectPanel;
            CharacterAnims.PlayAnimsOnPanel(settings);
        }
        return elPanel;
    }
    function StartWeaponLookat() {
        let elItemPanel = GetExistingItemPanel('ItemPreviewPanel');
        if (elItemPanel) {
            elItemPanel.StartWeaponLookat();
        }
    }
    InspectModelImage.StartWeaponLookat = StartWeaponLookat;
    function EndWeaponLookat() {
        let elItemPanel = GetExistingItemPanel('ItemPreviewPanel');
        if (elItemPanel) {
            elItemPanel.EndWeaponLookat();
        }
    }
    InspectModelImage.EndWeaponLookat = EndWeaponLookat;
    function PanZoomEnabled() {
        let elItemPanel = GetExistingItemPanel('ItemPreviewPanel');
        if (elItemPanel) {
            return elItemPanel.PanZoomEnabled();
        }
        return false;
    }
    InspectModelImage.PanZoomEnabled = PanZoomEnabled;
    function _SetCSMSplitPlane0DistanceOverrideMainCharacter(elPanel, backgroundMap) {
        let flSplitPlane0Distance = 0.0;
        if (backgroundMap === 'de_ancient_vanity') {
            flSplitPlane0Distance = 180.0;
        }
        else if (backgroundMap === 'de_anubis_vanity') {
            flSplitPlane0Distance = 180.0;
        }
        else if (backgroundMap === 'ar_baggage_vanity') {
            flSplitPlane0Distance = 200.0;
        }
        else if (backgroundMap === 'de_dust2_vanity') {
            flSplitPlane0Distance = 160.0;
        }
        else if (backgroundMap === 'de_inferno_vanity') {
            flSplitPlane0Distance = 160.0;
        }
        else if (backgroundMap === 'cs_italy_vanity') {
            flSplitPlane0Distance = 200.0;
        }
        else if (backgroundMap === 'de_mirage_vanity') {
            flSplitPlane0Distance = 180.0;
        }
        else if (backgroundMap === 'de_overpass_vanity') {
            flSplitPlane0Distance = 150.0;
        }
        else if (backgroundMap === 'de_vertigo_vanity') {
            flSplitPlane0Distance = 190.0;
        }
        else if (backgroundMap === 'ui/acknowledge_item') {
            flSplitPlane0Distance = 200.0;
        }
        if (flSplitPlane0Distance > 0.0) {
            elPanel.SetCSMSplitPlane0DistanceOverride(flSplitPlane0Distance);
        }
    }
    function _SetCSMSplitPlane0DistanceOverrideItemInspect(elPanel, backgroundMap, itemId) {
        let flSplitPlane0Distance = 0.0;
        let bIsKeyChain = ItemInfo.IsKeychain(itemId);
        let itemCategory = InventoryAPI.GetLoadoutCategory(itemId);
        if (itemCategory === 'secondary')
            flSplitPlane0Distance = 30.0;
        else if (itemCategory === 'smg')
            flSplitPlane0Distance = 40.0;
        else if (itemCategory === 'rifle')
            flSplitPlane0Distance = 55.0;
        else if (itemCategory === 'clothing')
            flSplitPlane0Distance = 15.0;
        else if (itemCategory === 'melee')
            flSplitPlane0Distance = 30.0;
        else if (bIsKeyChain)
            flSplitPlane0Distance = 10.0;
        if (flSplitPlane0Distance > 0.0) {
            elPanel.SetCSMSplitPlane0DistanceOverride(flSplitPlane0Distance);
        }
    }
    function _SetBarnlightShadowScaleOverrideMainCharacter(elPanel, backgroundMap) {
        let flBarnlightShadowScale = 0.0;
        if (backgroundMap === 'ui/acknowledge_item') {
            flBarnlightShadowScale = 1.0;
        }
        else if (backgroundMap === 'warehouse_vanity') {
            flBarnlightShadowScale = 1.0;
        }
        else if (backgroundMap === 'de_train_vanity') {
            flBarnlightShadowScale = 1.0;
        }
        if (flBarnlightShadowScale > 0.0) {
            elPanel.SetBarnlightShadowScaleOverride(flBarnlightShadowScale);
        }
    }
    function _SetBarnlightShadowScaleOverrideItemInspect(elPanel, backgroundMap, itemId) {
        let flBarnlightShadowScale = 0.0;
        const bIsKeyChain = ItemInfo.IsKeychain(itemId);
        const bIsWeaponOrKnife = ItemInfo.IsWeapon(itemId) || ItemInfo.IsMelee(itemId);
        const itemCategory = InventoryAPI.GetLoadoutCategory(itemId);
        if (backgroundMap === 'ui/acknowledge_item') {
            flBarnlightShadowScale = 1.0;
        }
        else if (itemCategory === 'clothing') {
            if (backgroundMap === 'de_train_vanity')
                flBarnlightShadowScale = 1.0;
            else
                flBarnlightShadowScale = 4.0;
        }
        else if (bIsWeaponOrKnife || bIsKeyChain) {
            if (backgroundMap === 'warehouse_vanity')
                flBarnlightShadowScale = 1.0;
            else if (backgroundMap === 'de_train_vanity')
                flBarnlightShadowScale = 1.0;
            else
                flBarnlightShadowScale = 4.0;
        }
        if (flBarnlightShadowScale > 0.0) {
            elPanel.SetBarnlightShadowScaleOverride(flBarnlightShadowScale);
        }
    }
    function _InitWeaponScene(itemId) {
        const IsItemApplyRemove = InspectShared.GetPopupSetting('is_apply_remove_item');
        let oSettings = {
            panel_type: "MapItemPreviewPanel",
            active_item_idx: 0,
            camera: 'cam_default',
            initial_entity: 'item',
            mouse_rotate: "true",
            rotation_limit_x: "360",
            rotation_limit_y: "90",
            auto_rotate_x: IsItemApplyRemove ? "2" : "35",
            auto_rotate_y: IsItemApplyRemove ? "3" : "10",
            auto_rotate_period_x: IsItemApplyRemove ? "10" : "15",
            auto_rotate_period_y: IsItemApplyRemove ? "10" : "25",
            auto_recenter: false,
            player: "false",
        };
        const panel = _LoadInspectMap(itemId, oSettings);
        _SetParticlesBg(itemId, panel);
        SetItemCameraByWeaponType(itemId, panel, false);
        const settings = ItemInfo.GetOrUpdateVanityCharacterSettings();
        settings.panel = panel;
        settings.weaponItemId = '';
        return panel;
    }
    function _InitMeleeScene(itemId) {
        let oSettings = {
            panel_type: "MapItemPreviewPanel",
            active_item_idx: 8,
            camera: 'cam_melee_intro',
            initial_entity: 'item',
            mouse_rotate: "true",
            rotation_limit_x: "360",
            rotation_limit_y: "90",
            auto_rotate_x: "35",
            auto_rotate_y: "10",
            auto_rotate_period_x: "15",
            auto_rotate_period_y: "25",
            auto_recenter: false,
            player: "false",
        };
        const panel = _LoadInspectMap(itemId, oSettings);
        _SetParticlesBg(itemId, panel);
        _TransitionCamera(panel, 'melee');
        return panel;
    }
    function _InitStickerScene(itemId) {
        let oSettings = {
            panel_type: "MapItemPreviewPanel",
            active_item_idx: 1,
            camera: 'cam_sticker_close_intro',
            initial_entity: 'item',
            mouse_rotate: "true",
            rotation_limit_x: "70",
            rotation_limit_y: "60",
            auto_rotate_x: "20",
            auto_rotate_y: "0",
            auto_rotate_period_x: "10",
            auto_rotate_period_y: "10",
            auto_recenter: false,
            player: "false",
        };
        const panel = _LoadInspectMap(itemId, oSettings);
        _SetParticlesBg(itemId, panel);
        _TransitionCamera(panel, 'sticker_close');
        return panel;
    }
    function _InitSprayScene(itemId) {
        let oSettings = {
            panel_type: "MapItemPreviewPanel",
            active_item_idx: 2,
            camera: 'camera_path_spray',
            initial_entity: 'item',
            mouse_rotate: "false",
            rotation_limit_x: "",
            rotation_limit_y: "",
            auto_rotate_x: "",
            auto_rotate_y: "",
            auto_rotate_period_x: "",
            auto_rotate_period_y: "",
            auto_recenter: false,
            player: "false",
        };
        const panel = _LoadInspectMap(itemId, oSettings);
        _TransitionCamera(panel, 'path_spray', true, 0);
        return panel;
    }
    function _InitDisplayScene(itemId, bDoNotAllowRotate = false) {
        let bOverrideItem = InventoryAPI.GetItemDefinitionIndex(itemId) === 996;
        let rotationOverrideX = bOverrideItem ? "360" : "70";
        let autoRotateOverrideX = bDoNotAllowRotate ? "0" : bOverrideItem ? "180" : "45";
        let autoRotateTimeOverrideX = bDoNotAllowRotate ? "1" : bOverrideItem ? "100" : "20";
        let oSettings = {
            panel_type: "MapItemPreviewPanel",
            active_item_idx: 3,
            camera: 'cam_display_close_intro',
            initial_entity: 'item',
            mouse_rotate: bDoNotAllowRotate ? "false" : "true",
            rotation_limit_x: rotationOverrideX,
            rotation_limit_y: "60",
            auto_rotate_x: autoRotateOverrideX,
            auto_rotate_y: bDoNotAllowRotate ? "0" : "12",
            auto_rotate_period_x: autoRotateTimeOverrideX,
            auto_rotate_period_y: bDoNotAllowRotate ? "1" : "20",
            auto_recenter: false,
            player: "false",
        };
        const panel = _LoadInspectMap(itemId, oSettings);
        _SetParticlesBg(itemId, panel);
        _TransitionCamera(panel, 'display_close');
        return panel;
    }
    function _InitMusicKitScene(itemId) {
        let oSettings = {
            panel_type: "MapItemPreviewPanel",
            active_item_idx: 4,
            camera: 'cam_musickit_intro',
            initial_entity: 'item',
            mouse_rotate: "true",
            rotation_limit_x: "55",
            rotation_limit_y: "55",
            auto_rotate_x: "10",
            auto_rotate_y: "0",
            auto_rotate_period_x: "20",
            auto_rotate_period_y: "20",
            auto_recenter: false,
            player: "false",
        };
        const panel = _LoadInspectMap(itemId, oSettings);
        _SetParticlesBg(itemId, panel);
        _TransitionCamera(panel, 'musickit_close');
        return panel;
    }
    function _InitCaseScene(itemId) {
        let oSettings = {
            panel_type: "MapItemPreviewPanel",
            active_item_idx: 6,
            camera: 'cam_case_intro',
            initial_entity: 'item',
            mouse_rotate: "false",
            rotation_limit_x: "",
            rotation_limit_y: "",
            auto_rotate_x: "",
            auto_rotate_y: "",
            auto_rotate_period_x: "",
            auto_rotate_period_y: "",
            auto_recenter: false,
            player: "false",
        };
        const panel = _LoadInspectMap(itemId, oSettings);
        _SetParticlesBg(itemId, panel);
        const useAcknowledge = _UseAcknowledge();
        _TransitionCamera(panel, useAcknowledge ? 'case_new_item' : 'case', useAcknowledge ? true : false);
        return panel;
    }
    function _InitLaptopScene(itemId) {
        let oSettings = {
            panel_type: "MapItemPreviewPanel",
            active_item_idx: 10,
            camera: 'cam_laptop_intro',
            initial_entity: 'item',
            mouse_rotate: "false",
            rotation_limit_x: "",
            rotation_limit_y: "",
            auto_rotate_x: "",
            auto_rotate_y: "",
            auto_rotate_period_x: "",
            auto_rotate_period_y: "",
            auto_recenter: false,
            map_override: 'ui/inspect_laptop',
            player: "false",
        };
        const panel = _LoadInspectMap(itemId, oSettings);
        _SetParticlesBg(itemId, panel);
        if (m_isLaptopOpening) {
            panel.TransitionToCamera('cam_laptop', 0);
            $.Schedule(.25, () => {
                if (panel.IsValid() && panel) {
                    $.DispatchEvent('CSGOPlaySoundEffect', 'UI.Laptop.ZoomIn', 'MOUSE');
                    panel.TransitionToCamera('cam_laptop_open', 1);
                }
            });
        }
        else {
            const useAcknowledge = _UseAcknowledge();
            _TransitionCamera(panel, useAcknowledge ? 'laptop_new_item' : 'laptop', useAcknowledge ? true : false);
        }
        return panel;
    }
    function _InitGlovesScene(itemId) {
        let oSettings = {
            panel_type: "MapItemPreviewPanel",
            active_item_idx: 7,
            camera: 'cam_gloves',
            initial_entity: 'item',
            mouse_rotate: "false",
            rotation_limit_x: "",
            rotation_limit_y: "",
            auto_rotate_x: "",
            auto_rotate_y: "",
            auto_rotate_period_x: "",
            auto_rotate_period_y: "",
            auto_recenter: false,
            player: "false",
        };
        const panel = _LoadInspectMap(itemId, oSettings);
        _SetParticlesBg(itemId, panel);
        _TransitionCamera(panel, 'gloves', true);
        return panel;
    }
    function _InitNametagScene(itemId) {
        let oSettings = {
            panel_type: "MapItemPreviewPanel",
            active_item_idx: 1,
            camera: 'cam_nametag_close_intro',
            initial_entity: 'item',
            mouse_rotate: "true",
            rotation_limit_x: "70",
            rotation_limit_y: "60",
            auto_rotate_x: "20",
            auto_rotate_y: "0",
            auto_rotate_period_x: "10",
            auto_rotate_period_y: "10",
            auto_recenter: false,
            player: "false",
        };
        const panel = _LoadInspectMap(itemId, oSettings);
        _SetParticlesBg(itemId, panel);
        _TransitionCamera(panel, 'nametag_close');
        return panel;
    }
    function _InitKeyChainScene(itemId) {
        let oSettings = {
            panel_type: "MapItemPreviewPanel",
            active_item_idx: 1,
            camera: 'cam_nametag_close_intro',
            initial_entity: 'item',
            mouse_rotate: "true",
            rotation_limit_x: "360",
            rotation_limit_y: "360",
            auto_rotate_x: "20",
            auto_rotate_y: "0",
            auto_rotate_period_x: "10",
            auto_rotate_period_y: "10",
            auto_recenter: false,
            player: "false",
        };
        const panel = _LoadInspectMap(itemId, oSettings);
        _SetParticlesBg(itemId, panel);
        _TransitionCamera(panel, 'nametag_close');
        return panel;
    }
    function _GetBackGroundMap(bUseMainMenuMap = false) {
        if (_UseAcknowledge()) {
            return 'ui/acknowledge_item';
        }
        let backgroundMap = GameInterfaceAPI.GetSettingString('ui_inspect_bkgnd_map');
        if (backgroundMap == 'mainmenu' || bUseMainMenuMap === true) {
            backgroundMap = GameInterfaceAPI.GetSettingString('ui_mainmenu_bkgnd_movie');
        }
        backgroundMap = !backgroundMap ? backgroundMap : backgroundMap + '_vanity';
        return backgroundMap;
    }
    function _LoadInspectMap(itemId, oSettings, bUseMainMenuMap = false) {
        let mapName = oSettings.map_override ? oSettings.map_override : _GetBackGroundMap(bUseMainMenuMap);
        let elPanel = GetExistingItemPanel('ItemPreviewPanel');
        if (!elPanel) {
            let strAsyncWorkType = InspectShared.GetPopupSetting('work_type');
            elPanel = $.CreatePanel(oSettings.panel_type, m_elContainer, 'ItemPreviewPanel', {
                "require-composition-layer": "true",
                'transparent-background': 'false',
                'disable-depth-of-field': _UseAcknowledge() ? 'true' : 'false',
                "pin-fov": "vertical",
                class: 'inspect-model-image-panel inspect-model-image-panel--hidden',
                camera: oSettings.camera,
                player: "true",
                map: mapName,
                initial_entity: 'item',
                mouse_rotate: oSettings.mouse_rotate,
                rotation_limit_x: oSettings.rotation_limit_x,
                rotation_limit_y: oSettings.rotation_limit_y,
                auto_rotate_x: oSettings.auto_rotate_x,
                auto_rotate_y: oSettings.auto_rotate_y,
                auto_rotate_period_x: oSettings.auto_rotate_period_x,
                auto_rotate_period_y: oSettings.auto_rotate_period_y,
                auto_recenter: oSettings.auto_recenter,
                workshop_preview: InspectShared.GetPopupSetting('is_workshop_preview'),
                panzoom_enabled: oSettings.mouse_rotate,
                tabindex: "auto",
                selectionpos: "auto",
                sticker_application_mode: (strAsyncWorkType === "can_sticker"),
                keychain_application_mode: (strAsyncWorkType === "can_keychain"),
                sticker_scrape_mode: strAsyncWorkType === "remove_sticker",
            });
        }
        elPanel.Data().itemId = itemId;
        elPanel.Data().active_item_idx = oSettings.active_item_idx;
        elPanel.Data().loadedMap = mapName;
        elPanel.SetActiveItem(oSettings.active_item_idx);
        elPanel.SetItemItemId(itemId, '');
        elPanel.RemoveClass('inspect-model-image-panel--hidden');
        _AdditionalMapLoadSettings(elPanel, oSettings.active_item_idx, mapName);
        _SetParticlesBg(itemId, elPanel);
        if (elPanel.PanZoomEnabled()) {
            elPanel.SetAcceptsFocus(true);
            elPanel.SetFocus();
        }
        return elPanel;
    }
    function GetExistingItemPanel(panelId) {
        if (!m_elContainer || !m_elContainer.IsValid())
            return null;
        for (let elChild of m_elContainer.Children()) {
            if (elChild && elChild.IsValid() && elChild.id === panelId && !elChild.Data().bPreviousLootlistItemPanel) {
                return elChild;
            }
        }
        return null;
    }
    function DeleteExistingItemPanel(itemId, panelType) {
        let elExistingItemPanel = GetExistingItemPanel(panelType);
        if (!elExistingItemPanel)
            return;
        if (elExistingItemPanel.Data().itemId !== itemId) {
            elExistingItemPanel.Data().bPreviousLootlistItemPanel = true;
            elExistingItemPanel.AddClass('inspect-model-image-panel--hidden');
            elExistingItemPanel.DeleteAsync(.5);
        }
    }
    function _AdditionalMapLoadSettings(elPanel, active_item_idx, mapName) {
        if (elPanel.id === 'CharPreviewPanel') {
            DisableItemLighting(elPanel);
            _SetCSMSplitPlane0DistanceOverrideMainCharacter(elPanel, mapName);
            _SetBarnlightShadowScaleOverrideMainCharacter(elPanel, mapName);
        }
        else if (elPanel.id === 'id-inspect-image-bg-map') {
            DisableItemLighting(elPanel);
        }
        else {
            _SetLightingForItem(active_item_idx, elPanel);
            if (mapName === 'de_nuke_vanity') {
                SetSpotlightBrightness(elPanel);
            }
            else {
                SetSunBrightness(elPanel);
            }
            const itemId = elPanel.Data().itemId;
            _SetCSMSplitPlane0DistanceOverrideItemInspect(elPanel, mapName, itemId);
            _SetBarnlightShadowScaleOverrideItemInspect(elPanel, mapName, itemId);
        }
        _SetWorkshopPreviewPanelProperties(elPanel);
    }
    function _SetWorkshopPreviewPanelProperties(elItemPanel) {
        if (InspectShared.GetPopupSetting('is_workshop_preview')) {
            let sTransparentBackground = InventoryAPI.GetPreviewSceneStateAttribute("transparent_background");
            let sBackgroundColor = InventoryAPI.GetPreviewSceneStateAttribute("background_color");
            let sPreviewIdleAnimation = InventoryAPI.GetPreviewSceneStateAttribute("idle_animation");
            if (sTransparentBackground === "1") {
                elItemPanel.SetHideStaticGeometry(true);
                elItemPanel.SetHideParticles(true);
                elItemPanel.SetTransparentBackground(true);
                m_elContainer.SetHasClass('popup-inspect-background', false);
            }
            else if (sBackgroundColor) {
                const oColor = _HexColorToRgb(sBackgroundColor);
                elItemPanel.SetHideStaticGeometry(true);
                elItemPanel.SetHideParticles(true);
                elItemPanel.SetBackgroundColor(oColor.r, oColor.g, oColor.b, 0);
                elItemPanel.SetTransparentBackground(false);
            }
            else {
                elItemPanel.SetHideStaticGeometry(false);
                elItemPanel.SetHideParticles(false);
                elItemPanel.SetBackgroundColor(0, 0, 0, 255);
                elItemPanel.SetTransparentBackground(false);
            }
            if (sPreviewIdleAnimation === "1") {
                elItemPanel.SetWorkshopPreviewIdleAnimation(true);
            }
            else {
                elItemPanel.SetWorkshopPreviewIdleAnimation(false);
            }
        }
    }
    function SetItemCameraByWeaponType(itemId, elItemPanel, bSkipIntro) {
        const category = InventoryAPI.GetLoadoutCategory(itemId);
        const defName = InventoryAPI.GetItemDefinitionName(itemId);
        let strCamera = '3';
        let result = InspectModelImage.m_CameraSettingsPerWeapon.find(({ type }) => type === defName);
        if (result) {
            strCamera = result.camera;
        }
        else {
            switch (category) {
                case 'secondary':
                    strCamera = '0';
                    break;
                case 'smg':
                    strCamera = '2';
                    break;
            }
        }
        _TransitionCamera(elItemPanel, strCamera, bSkipIntro);
    }
    InspectModelImage.SetItemCameraByWeaponType = SetItemCameraByWeaponType;
    let m_scheduleHandle = -1;
    function _TransitionCamera(elPanel, strCamera, bSkipIntro = false, nDuration = 0) {
        elPanel.Data().camera = strCamera;
        if (InspectShared.GetPopupSetting('is_workshop_preview')) {
            elPanel.TransitionToCamera('cam_' + strCamera, 0);
            return;
        }
        if (bSkipIntro || InspectShared.GetPopupSetting('is_item_in_lootlist')) {
            elPanel.TransitionToCamera('cam_' + strCamera, nDuration);
            return;
        }
        elPanel.TransitionToCamera('cam_' + strCamera + '_intro', 0);
        if (m_scheduleHandle === -1) {
            m_scheduleHandle = $.Schedule(.25, () => {
                if (elPanel.IsValid() && elPanel) {
                    elPanel.TransitionToCamera('cam_' + strCamera, 1);
                    m_scheduleHandle = -1;
                }
            });
        }
    }
    function ZoomCamera(bZoom) {
        let elPanel = m_elPanel;
        const defName = InventoryAPI.GetItemDefinitionName(m_elPanel.Data().itemId);
        let result = InspectModelImage.m_CameraSettingsPerWeapon.find(({ type }) => type === defName);
        let strCamera = bZoom ? result?.zoom_camera : result?.camera;
        if (!strCamera || strCamera === '')
            return;
        let aCameras = strCamera.split(',');
        elPanel.SetRotation(0, 0, 1);
        _TransitionCamera(elPanel, aCameras[0], true, .75);
    }
    InspectModelImage.ZoomCamera = ZoomCamera;
    function _SetImage(itemId) {
        let elPanel = GetExistingItemPanel('InspectItemImage');
        if (!elPanel) {
            _SetImageBackgroundMap();
            elPanel = $.CreatePanel('Panel', m_elContainer, 'InspectItemImage');
            elPanel.BLoadLayoutSnippet("snippet-image");
        }
        const elImagePanel = elPanel.FindChildTraverse('ImagePreviewPanel');
        elImagePanel.itemid = itemId;
        elImagePanel.RemoveClass('hidden');
        _TintSprayImage(itemId, elImagePanel);
        return elImagePanel;
    }
    function _SetImageBackgroundMap() {
        let mapName = _GetBackGroundMap();
        let elPanel = $.CreatePanel('MapPlayerPreviewPanel', m_elContainer, 'id-inspect-image-bg-map', {
            "require-composition-layer": "true",
            'transparent-background': 'false',
            'disable-depth-of-field': 'false',
            "pin-fov": "vertical",
            class: 'full-width full-height',
            camera: "cam_default",
            player: "false",
            map: mapName
        });
        _TransitionCamera(elPanel, "default", true, 0);
        _AdditionalMapLoadSettings(elPanel, 0, mapName);
    }
    function _TintSprayImage(id, elImage) {
        TintSprayIcon.CheckIsSprayAndTint(id, elImage);
    }
    function SetCharScene(characterItemId, weaponItemId, contextPanel = $.GetContextPanel()) {
        ItemInfo.GetOrUpdateVanityCharacterSettings(characterItemId);
        _InitCharScene(characterItemId, true, weaponItemId, contextPanel);
    }
    InspectModelImage.SetCharScene = SetCharScene;
    function ShowHideItemPanel(bshow) {
        if (!m_elContainer.IsValid())
            return;
        let elItemPanel = GetExistingItemPanel('ItemPreviewPanel');
        if (elItemPanel) {
            elItemPanel.SetHasClass('hidden', !bshow);
            elItemPanel.SetReadyForDisplay(bshow);
            if (bshow) {
                if (elItemPanel.PanZoomEnabled()) {
                    elItemPanel.SetFocus();
                }
                $.DispatchEvent("CSGOPlaySoundEffect", "weapon_showSolo", "MOUSE");
            }
        }
    }
    InspectModelImage.ShowHideItemPanel = ShowHideItemPanel;
    function ShowHideCharPanel(bshow) {
        if (!m_elContainer.IsValid())
            return;
        const elCharPanel = GetExistingItemPanel('CharPreviewPanel');
        if (elCharPanel) {
            elCharPanel.SetHasClass('hidden', !bshow);
            elCharPanel.SetReadyForDisplay(bshow);
        }
        if (bshow)
            $.DispatchEvent("CSGOPlaySoundEffect", "weapon_showOnChar", "MOUSE");
    }
    InspectModelImage.ShowHideCharPanel = ShowHideCharPanel;
    function GetModelPanel() {
        return m_elPanel;
    }
    InspectModelImage.GetModelPanel = GetModelPanel;
    function UpdateModelOnly(itemId) {
        let elpanel = m_elPanel;
        if (elpanel && elpanel.IsValid()) {
            elpanel.SetItemItemId(itemId, '');
        }
    }
    InspectModelImage.UpdateModelOnly = UpdateModelOnly;
    function SwitchMap(elParent) {
        for (let element of ['ItemPreviewPanel', 'CharPreviewPanel', 'id-inspect-image-bg-map']) {
            let elPanel = elParent.FindChildTraverse(element);
            if (elPanel && elPanel.IsValid()) {
                let mapName = _GetBackGroundMap();
                if (mapName !== elPanel.Data().loadedMap) {
                    elPanel.SwitchMap(mapName);
                    elPanel.Data().loadedMap = mapName;
                    _AdditionalMapLoadSettings(elPanel, elPanel.Data().active_item_idx, elPanel.Data().loadedMap);
                    const itemId = elPanel.Data().itemId;
                    const category = InventoryAPI.GetLoadoutCategory(itemId);
                    if (ItemInfo.IsWeapon(itemId)) {
                        SetItemCameraByWeaponType(itemId, elPanel, true);
                    }
                    else {
                        _TransitionCamera(elPanel, elPanel.Data().camera, true);
                    }
                }
            }
        }
    }
    InspectModelImage.SwitchMap = SwitchMap;
    function DisableItemLighting(elPanel) {
        _SetLightingForItem(-1, elPanel);
    }
    InspectModelImage.DisableItemLighting = DisableItemLighting;
    function _SetLightingForItem(indexShow, elPanel) {
        let numItemEntitiesInMap = 10;
        for (let i = 0; i <= numItemEntitiesInMap; i++) {
            let itemIndexMod = i === 0 ? '' : i.toString();
            if (indexShow !== i) {
                elPanel.FireEntityInput('light_item' + itemIndexMod, 'Disable');
                elPanel.FireEntityInput('light_item_new' + itemIndexMod, 'Disable');
            }
            else {
                _SetRimLight(itemIndexMod, elPanel);
            }
        }
    }
    function _SetParticlesBg(itemId, elPanel) {
        if (!_UseAcknowledge()) {
            return;
        }
        const oColor = _HexColorToRgb(InventoryAPI.GetItemRarityColor(itemId));
        const sColor = `${oColor.r} ${oColor.g} ${oColor.b}`;
        elPanel.FireEntityInput('acknowledge_particle', 'SetControlPoint', '16: ' + sColor);
    }
    function _SetRimLight(indexShow, elPanel) {
        if (_UseAcknowledge()) {
            elPanel.FireEntityInput('light_item' + indexShow, 'Disable');
            let itemId = InspectShared.GetPopupSetting('item_id');
            if (!itemId) {
                itemId = elPanel.Data().itemId;
            }
            const oColor = _HexColorToRgb(InventoryAPI.GetItemRarityColor(itemId));
            const sColor = `${oColor.r} ${oColor.g} ${oColor.b}`;
            let lightNameInMap = "light_item_new" + indexShow;
            elPanel.FireEntityInput(lightNameInMap, 'SetColor', sColor);
        }
        else {
            elPanel.FireEntityInput('light_item_new' + indexShow, 'Disable');
        }
    }
    function SetSunBrightness(elPanel) {
        elPanel.FireEntityInput('sun', 'SetLightBrightness', '1.1');
    }
    InspectModelImage.SetSunBrightness = SetSunBrightness;
    function SetSpotlightBrightness(elPanel) {
        elPanel.FireEntityInput('main_light', 'SetBrightness', '1.1');
    }
    InspectModelImage.SetSpotlightBrightness = SetSpotlightBrightness;
    function _HexColorToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b };
    }
})(InspectModelImage || (InspectModelImage = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zcGVjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL2luc3BlY3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGlEQUFpRDtBQUNqRCwyQ0FBMkM7QUFDM0Msa0RBQWtEO0FBQ2xELHVEQUF1RDtBQUV2RCxJQUFVLGlCQUFpQixDQWl3QzFCO0FBandDRCxXQUFVLGlCQUFpQjtJQUUxQixJQUFJLFNBQVMsR0FBa0UsSUFBSyxDQUFDO0lBQ3JGLElBQUksYUFBYSxHQUFZLElBQUssQ0FBQztJQUNuQyxJQUFJLGlCQUFpQixHQUFZLEtBQUssQ0FBQztJQTJCNUIsMkNBQXlCLEdBQTRCO1FBRS9ELEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLFdBQVcsRUFBRyx1Q0FBdUMsRUFBRTtRQUMxRixFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxXQUFXLEVBQUcsaUJBQWlCLEVBQUU7UUFDcEUsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsV0FBVyxFQUFHLHlDQUF5QyxFQUFFO1FBQzlGLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLFdBQVcsRUFBRywyQ0FBMkMsRUFBRTtRQUNoRyxFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxXQUFXLEVBQUcseUNBQXlDLEVBQUU7UUFDN0YsRUFBRSxJQUFJLEVBQUUsc0JBQXNCLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxXQUFXLEVBQUcsMkRBQTJELEVBQUU7UUFDeEgsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUU7UUFDckMsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsV0FBVyxF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