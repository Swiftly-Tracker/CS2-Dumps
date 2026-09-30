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
        //rifles
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
        //mid
        { type: 'weapon_mp5sd', camera: '3' },
        { type: 'weapon_xm1014', camera: '4', zoom_camera: 'weapon_xm1014_zoom' },
        { type: 'weapon_m249', camera: '6', zoom_camera: 'weapon_m249_zoom' },
        { type: 'weapon_ump45', camera: '3' },
        { type: 'weapon_bizon', camera: '3' },
        { type: 'weapon_mag7', camera: '3' },
        { type: 'weapon_nova', camera: '5', zoom_camera: 'weapon_g3sg1_zoom,weapon_g3sg1_front_zoom' },
        { type: 'weapon_sawedoff', camera: '3' },
        { type: 'weapon_negev', camera: '5', zoom_camera: 'weapon_negev_zoom' },
        //pistols
        { type: 'weapon_usp_silencer', camera: '2', zoom_camera: '0' },
        { type: 'weapon_elite', camera: '2' },
        { type: 'weapon_tec9', camera: '2' },
        { type: 'weapon_revolver', camera: '2' },
        //misc
        { type: 'weapon_c4', camera: '3' },
        { type: 'weapon_taser', camera: '0' },
        //knife
        // { type: 'weapon_knife', camera: '4' },
    ];
    function Init(elContainer, itemId) {
        // Tournament journals are only inspected for the purposes of Graffiti
        // ... but check for special hint: viewfunc=primary forces it to show as coin
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
            m_elPanel = _InitKeyChainScene(itemId); // TODO: inspect scene for keychains
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
            m_elPanel = model ? _InitCaseScene(itemId) : _SetImage(itemId); // eSports2013 cases for example don't have a model :(
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
        // Generic 3d inspect
        else if (model) {
            if (InventoryAPI.GetLoadoutCategory(itemId) === 'clothing') { // these are my gloves
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
        // 2d inspect fallback
        else if (!model) {
            m_elPanel = _SetImage(itemId);
        }
        return m_elPanel;
    }
    function _InitCharScene(itemId, bHide = false, weaponItemId = '', contextPanel = $.GetContextPanel()) {
        $.Msg('_InitCharScene');
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
    // Start the weapon look animation mode in the item preview panel.
    function StartWeaponLookat() {
        let elItemPanel = GetExistingItemPanel('ItemPreviewPanel');
        if (elItemPanel) {
            elItemPanel.StartWeaponLookat();
        }
    }
    InspectModelImage.StartWeaponLookat = StartWeaponLookat;
    // End the weapon look animation mode in the item preview panel.
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
    // Start the pet look animation mode in the item preview panel.
    function StartPetLookAt() {
        let elInspectPanel = GetExistingItemPanel('ItemPreviewPanel');
        if (elInspectPanel) {
            elInspectPanel.StartPetLookAt();
        }
    }
    InspectModelImage.StartPetLookAt = StartPetLookAt;
    // Override the cascade 0 split plane distance so that it covers the character, ensuring highest resolution
    // character shadows, even at lowest shadow quality settings.
    // There's a similar setup in mainmenu.ts, where the values are
    // different to here since the camera and character are placed differently
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
    // BarnlightShadowScaleOverride:
    //
    // Note, flBarnlightShadowScale value === 0.0 => final barnlight shadow scale = r_csgo_barnlight_shadow_scale_preview (cvar)
    //       flBarnlightShadowScale value > 0.0 => final barnlight shadow scale = flBarnlightShadowScale 
    //
    // FYI, r_csgo_barnlight_shadow_scale_preview currently defaults to 4.0
    // Set BarnlightShadowScaleOverride for general main menu and character inspect
    function _SetBarnlightShadowScaleOverrideMainCharacter(elPanel, backgroundMap) {
        let flBarnlightShadowScale = 0.0;
        // we have a lot of shadow casting barnlights on these maps, usual scaling via r_csgo_barnlight_shadow_scale_preview is 4.0, this is a multiplier of that scale
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
            // scale barnlight shadows by flBarnlightShadowScale instead of r_csgo_barnlight_shadow_scale_preview cvar
            elPanel.SetBarnlightShadowScaleOverride(flBarnlightShadowScale);
        }
    }
    // Set BarnlightShadowScaleOverride for item inspect panels
    function _SetBarnlightShadowScaleOverrideItemInspect(elPanel, backgroundMap, itemId) {
        let flBarnlightShadowScale = 0.0;
        const bIsKeyChain = ItemInfo.IsKeychain(itemId);
        const bIsWeaponOrKnife = ItemInfo.IsWeapon(itemId) || ItemInfo.IsMelee(itemId);
        const itemCategory = InventoryAPI.GetLoadoutCategory(itemId);
        // override scale depending on map and item category
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
    // weapons have both an item scene and a preview on agent scene
    function _InitWeaponScene(itemId) {
        $.Msg('_InitWeaponScene');
        const IsItemApplyRemove = InspectShared.GetPopupSetting('is_apply_remove_item');
        // floating weapon panel
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
        $.Msg('_InitMeleeScene');
        // floating weapon panel
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
        $.Msg('_InitStickerScenes');
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
        $.Msg('_InitSprayScene');
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
        $.Msg('_InitDisplayScene');
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
        $.Msg('_InitChickenFeedScene');
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
        $.Msg('_InitMusicKitScene');
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
        $.Msg('_InitCaseScene');
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
        $.Msg('_InitLaptopScene');
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
        $.Msg('_InitGlovesScene');
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
        $.Msg('_InitNametagScene');
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
        $.Msg('_InitKeyChainScene');
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
        $.Msg('_InitPetScene');
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
        $.Msg('mapName:' + mapName);
        $.Msg('itemName:' + InventoryAPI.GetItemName(itemId));
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
            // Panel requires focus for the use of arrow keys for panning
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
        // HACK
        // If you are inspecting a graffiti, sticker, patch in a case lootlist
        // the map panel does not load the new item when you update the SetActiveItem.
        // So we delete the previous panel and make a new one.
        // We should fix this.
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
        if (elPanel.id === 'CharPreviewPanel') //'ItemPreviewPanel', 'CharPreviewPanel', 'id-inspect-image-bg-map'
         {
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
            // further configure the panel for workshop previewing
            let sTransparentBackground = InventoryAPI.GetPreviewSceneStateAttribute("transparent_background");
            let sBackgroundColor = InventoryAPI.GetPreviewSceneStateAttribute("background_color");
            let sPreviewIdleAnimation = InventoryAPI.GetPreviewSceneStateAttribute("idle_animation");
            if (sTransparentBackground === "1") {
                elItemPanel.SetHideStaticGeometry(true);
                elItemPanel.SetHideParticles(true);
                elItemPanel.SetTransparentBackground(true);
                // the default opaque nature prevents undesired prior painting artifacts
                // except this workshop transparent mode wants to overlay
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
        $.Msg('InventoryAPI.GetItemDefinitionName( itemId )' + InventoryAPI.GetItemDefinitionName(itemId));
        let strCamera = '3'; //0 close cam, 6 far away, 3 is default
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
            // workshop wants no transitions for rapid edit iterations
            elPanel.TransitionToCamera('cam_' + strCamera, 0);
            return;
        }
        if (bSkipIntro || InspectShared.GetPopupSetting('is_item_in_lootlist')) {
            elPanel.TransitionToCamera('cam_' + strCamera, nDuration);
            return;
        }
        // Snap to intro camera then transition to desired camera position
        elPanel.TransitionToCamera('cam_' + strCamera + '_intro', 0);
        if (m_scheduleHandle === -1) {
            m_scheduleHandle = $.Schedule(.25, () => {
                if (elPanel.IsValid() && elPanel) {
                    elPanel.TransitionToCamera('cam_' + strCamera, 1);
                    m_scheduleHandle = -1;
                }
            });
        }
        // $.Msg( 'm_scheduleHandle :'+ m_scheduleHandle );
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
        $.Msg('_SetImage');
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
                    // Ensure arrow keys work for panning;
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
        // Number of entities in the vanity map for different things like weapon, stickers, cases...
        // Set up lighting for the one we are using.
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
        $.Msg('oColor: ' + sColor);
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
            $.Msg('lightNameInMap: ' + lightNameInMap);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zcGVjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL2luc3BlY3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGlEQUFpRDtBQUNqRCwyQ0FBMkM7QUFDM0Msa0RBQWtEO0FBQ2xELHVEQUF1RDtBQUV2RCxJQUFVLGlCQUFpQixDQWl5QzFCO0FBanlDRCxXQUFVLGlCQUFpQjtJQUUxQixJQUFJLFNBQVMsR0FBa0UsSUFBSyxDQUFDO0lBQ3JGLElBQUksYUFBYSxHQUFZLElBQUssQ0FBQztJQUNuQyxJQUFJLGlCQUFpQixHQUFZLEtBQUssQ0FBQztJQTJCNUIsMkNBQXlCLEdBQTRCO1FBQy9ELFFBQVE7UUFDUixFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxXQUFXLEVBQUcsdUNBQXVDLEVBQUU7UUFDMUYsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsV0FBVyxFQUFHLGlCQUFpQixFQUFFO1FBQ3BFLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLFdBQVcsRUFBRyx5Q0FBeUMsRUFBRTtRQUM5RixFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxXQUFXLEVBQUcsMkNBQTJDLEVBQUU7UUFDaEcsRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsV0FBVyxFQUFHLHlDQUF5QyxFQUFFO1FBQzdGLEVBQUUsSUFBSSxFQUFFLHNCQUFzQixFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsV0FBVyxFQUFHLDJEQUEyRCxFQUFFO1FBQ3hILEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFO1FBQ3JDLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxNQUFNLEVBQUUsR0FBRyxF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