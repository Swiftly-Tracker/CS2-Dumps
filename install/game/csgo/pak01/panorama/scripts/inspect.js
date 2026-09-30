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
        else if (InventoryAPI.DoesItemMatchDefinitionByName(itemId, 'chicken_feed')) {
            DeleteExistingItemPanel(itemId, 'ItemPreviewPanel');
            m_elPanel = _InitChickenFeedScene(itemId);
        }
        else if (ItemInfo.IsPet(itemId)) {
            m_elPanel = _InitPetScene(itemId);
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
    function StartPetLookAt() {
        let elInspectPanel = GetExistingItemPanel('ItemPreviewPanel');
        if (elInspectPanel) {
            elInspectPanel.StartPetLookAt();
        }
    }
    InspectModelImage.StartPetLookAt = StartPetLookAt;
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
    function _InitChickenFeedScene(itemId, bDoNotAllowRotate = false) {
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
    function _InitPetScene(itemId) {
        let oSettings = {
            panel_type: "MapItemPreviewPanel",
            active_item_idx: 9,
            camera: 'cam_gloves',
            initial_entity: 'item',
            mouse_rotate: "true",
            rotation_limit_x: "180",
            rotation_limit_y: "0",
            auto_rotate_x: "0",
            auto_rotate_y: "0",
            auto_rotate_period_x: "0",
            auto_rotate_period_y: "0",
            auto_recenter: false,
            player: "false",
        };
        const panel = _LoadInspectMap(itemId, oSettings, true);
        _SetParticlesBg(itemId, panel);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zcGVjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL2luc3BlY3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGlEQUFpRDtBQUNqRCwyQ0FBMkM7QUFDM0Msa0RBQWtEO0FBQ2xELHVEQUF1RDtBQUV2RCxJQUFVLGlCQUFpQixDQWl5QzFCO0FBanlDRCxXQUFVLGlCQUFpQjtJQUUxQixJQUFJLFNBQVMsR0FBa0UsSUFBSyxDQUFDO0lBQ3JGLElBQUksYUFBYSxHQUFZLElBQUssQ0FBQztJQUNuQyxJQUFJLGlCQUFpQixHQUFZLEtBQUssQ0FBQztJQTJCNUIsMkNBQXlCLEdBQTRCO1FBRS9ELEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLFdBQVcsRUFBRyx1Q0FBdUMsRUFBRTtRQUMxRixFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxXQUFXLEVBQUcsaUJBQWlCLEVBQUU7UUFDcEUsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsV0FBVyxFQUFHLHlDQUF5QyxFQUFFO1FBQzlGLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLFdBQVcsRUFBRywyQ0FBMkMsRUFBRTtRQUNoRyxFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxXQUFXLEVBQUcseUNBQXlDLEVBQUU7UUFDN0YsRUFBRSxJQUFJLEVBQUUsc0JBQXNCLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxXQUFXLEVBQUcsMkRBQTJELEVBQUU7UUFDeEgsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUU7UUFDckMsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsV0FBVyxF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