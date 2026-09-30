"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/characteranims.ts" />
/// <reference path="common/licenseutil.ts" />
/// <reference path="common/promoted_settings.ts" />
/// <reference path="popups/popup_acknowledge_item.ts" />
/// <reference path="new_news_entry_check.ts" />
/// <reference path="inspect.ts" />
/// <reference path="avatar.ts" />
/// <reference path="vanity_player_info.ts" />
/// <reference path="vanity_pet_info.ts" />
/// <reference path="particle_controls.ts" />
/// <reference path="video_setting_recommendations.ts" />
/// <reference path="generated/items_event_current_generated_store.d.ts" />
$.LogChannel('p.mainmenu', "LV_OFF");
var MainMenu;
(function (MainMenu) {
    const _m_bPerfectWorld = (MyPersonaAPI.GetLauncherType() === "perfectworld");
    let _m_activeTab = null;
    let _m_sideBarElementContextMenuActive = false;
    const _m_elContentPanel = $('#JsMainMenuContent');
    let _m_playedInitalFadeUp = false;
    const _m_maxMainMenuDisplayAgents = 5;
    let _m_nPetUpgradeLevel = null;
    const _m_elNotificationsContainer = $('#id-notifications-container');
    let _m_notificationSchedule = false;
    let _m_bVanityAnimationAlreadyStarted = false;
    let _m_bHasPopupNotification = false;
    let _m_popupNotificationCallbackHandle = -1;
    let _m_bMajorStoreBalanceChecked = false;
    let _m_tLastSeenDisconnectedFromGC = 0;
    const _m_NotificationBarColorClasses = [
        "NotificationRed", "NotificationYellow", "NotificationGreen", "NotificationLoggingOn"
    ];
    let _m_LobbyPlayerUpdatedEventHandler = null;
    let _m_LobbyMatchmakingSessionUpdateEventHandler = null;
    let _m_LobbyForceRestartVanityEventHandler = null;
    let _m_LobbyMainMenuSwitchVanityEventHandler = null;
    let _m_UiSceneFrameBoundaryEventHandler = null;
    let _m_equipSlotChangedHandler = null;
    let _m_storePopupElement = null;
    let m_TournamentPickBanPopup = null;
    let _m_jobFetchTournamentData = null;
    const TOURNAMENT_FETCH_DELAY = 10;
    const nNumNewSettings = UpdateSettingsMenuAlert();
    const m_MainMenuTopBarParticleFX = $('#MainMenuNavigateParticles');
    ParticleControls.UpdateMainMenuTopBar(m_MainMenuTopBarParticleFX, '');
    let _m_nActiveFrameCount = 0;
    let _m_bTriedShowVideoSettingRecommendation = false;
    const _m_acknowledgedRentalExpirationCrateIds = new Set();
    let _m_bPreLoadedTabs = false;
    function UpdateSettingsMenuAlert() {
        let elNewSettingsAlert = $("#MainMenuSettingsAlert");
        if (elNewSettingsAlert) {
            let nNewSettings = PromotedSettingsUtil.GetUnacknowledgedPromotedSettings().length;
            elNewSettingsAlert.SetDialogVariable("alert_value", $.Localize("#Store_Price_New"));
            elNewSettingsAlert.SetHasClass('hidden', nNewSettings < 1);
            return nNewSettings;
        }
        return 0;
    }
    if (nNumNewSettings > 0) {
        const hPromotedSettingsViewedEvt = $.RegisterForUnhandledEvent("MainMenu_PromotedSettingsViewed", () => {
            UpdateSettingsMenuAlert();
            $.UnregisterForUnhandledEvent("MainMenu_PromotedSettingsViewed", hPromotedSettingsViewedEvt);
        });
    }
    function _OnInitFadeUp() {
        if (!_m_playedInitalFadeUp) {
            $('#MainMenuContainerPanel').TriggerClass('show');
            _m_playedInitalFadeUp = true;
            _RegisterOnShowEvents();
            _UpdateBackgroundMap();
        }
    }
    function SetHideTranstionOnLeftColumn() {
        const elLeftColumn = $.FindChildInContext('#JsLeftColumn');
        function fnOnPropertyTransitionEndEvent(panel, propertyName) {
            if (elLeftColumn === panel && propertyName === 'opacity') {
                if (elLeftColumn.visible === true && elLeftColumn.BIsTransparent()) {
                    elLeftColumn.SetReadyForDisplay(false);
                    elLeftColumn.visible = false;
                    return true;
                }
            }
            return false;
        }
        $.RegisterEventHandler('PropertyTransitionEnd', elLeftColumn, fnOnPropertyTransitionEndEvent);
    }
    function _FetchTournamentData() {
        if (_m_jobFetchTournamentData)
            return;
        TournamentsAPI.RequestTournaments();
        _m_jobFetchTournamentData = $.Schedule(TOURNAMENT_FETCH_DELAY, () => {
            _m_jobFetchTournamentData = null;
            _FetchTournamentData();
        });
    }
    function _StopFetchingTournamentData() {
        if (_m_jobFetchTournamentData) {
            $.CancelScheduled(_m_jobFetchTournamentData);
            _m_jobFetchTournamentData = null;
        }
    }
    function _UpdateBackgroundMap() {
        let savedMapName = GameInterfaceAPI.GetSettingString('ui_mainmenu_bkgnd_movie');
        let backgroundMap = !savedMapName ? 'de_dust2_vanity' : savedMapName + '_vanity';
        let elMapPanel = $('#JsMainmenu_Vanity');
        if (!(elMapPanel && elMapPanel.IsValid())) {
            elMapPanel = $.CreatePanel('MapVanityPreviewPanel', $('#JsMainmenu_Vanity-Container'), 'JsMainmenu_Vanity', {
                "require-composition-layer": "true",
                "pin-fov": "vertical",
                class: 'align-preview',
                camera: 'cam_default',
                player: "true",
                playermodel: "",
                map: backgroundMap,
                playername: "vanity_character",
                animgraphcharactermode: 'main-menu',
                initial_entity: 'vanity_character',
                mouse_rotate: 'false',
                parallax_degrees: ".5",
                parallax_offset: "200.0",
                hittest: 'false'
            });
            elMapPanel.Data().loadedMap = backgroundMap;
            elMapPanel.Data().parallax_zoomed = 50;
            elMapPanel.Data().parallax_unzoomed = 200;
            m_bRestartBackgroundMapSound = true;
        }
        else if (elMapPanel.Data().loadedMap !== backgroundMap) {
            elMapPanel.SwitchMap(backgroundMap);
            elMapPanel.Data().loadedMap = backgroundMap;
            m_bRestartBackgroundMapSound = true;
            _ResetPetZoom();
        }
        if (m_bRestartBackgroundMapSound) {
            $.Schedule(0.1, function () {
                _PlayBackgroundMapSound(savedMapName);
            });
            m_bRestartBackgroundMapSound = false;
        }
        if (backgroundMap === 'de_nuke_vanity') {
            elMapPanel.FireEntityInput('main_light', 'SetBrightness', '2');
            elMapPanel.FireEntityInput('main_light', 'Enable');
        }
        InspectModelImage.DisableItemLighting(elMapPanel);
        _SetCSMSplitPlane0DistanceOverride(elMapPanel, backgroundMap);
        _SetBarnlightShadowScaleOverride(elMapPanel, backgroundMap);
        _ShowLeaderPet(elMapPanel);
        _SetPetInteractionEnabled(elMapPanel, true);
        return elMapPanel;
    }
    function _SetCSMSplitPlane0DistanceOverride(elPanel, backgroundMap) {
        let flSplitPlane0Distance = 0.0;
        if (backgroundMap === 'de_ancient_vanity') {
            flSplitPlane0Distance = 80.0;
        }
        else if (backgroundMap === 'de_anubis_vanity') {
            flSplitPlane0Distance = 100.0;
        }
        else if (backgroundMap === 'ar_baggage_vanity') {
            flSplitPlane0Distance = 200.0;
        }
        else if (backgroundMap === 'de_dust2_vanity') {
            flSplitPlane0Distance = 130.0;
        }
        else if (backgroundMap === 'de_inferno_vanity') {
            flSplitPlane0Distance = 150.0;
        }
        else if (backgroundMap === 'cs_italy_vanity') {
            flSplitPlane0Distance = 200.0;
        }
        else if (backgroundMap === 'de_mirage_vanity') {
            flSplitPlane0Distance = 120.0;
        }
        else if (backgroundMap === 'de_overpass_vanity') {
            flSplitPlane0Distance = 150.0;
        }
        else if (backgroundMap === 'de_vertigo_vanity') {
            flSplitPlane0Distance = 90.0;
        }
        if (flSplitPlane0Distance > 0.0) {
            elPanel.SetCSMSplitPlane0DistanceOverride(flSplitPlane0Distance);
        }
    }
    function _SetBarnlightShadowScaleOverride(elPanel, backgroundMap) {
        let flBarnlightShadowScale = 4.0;
        if (backgroundMap === 'warehouse_vanity') {
            flBarnlightShadowScale = 1.0;
        }
        else if (backgroundMap === 'de_train_vanity') {
            flBarnlightShadowScale = 1.0;
        }
        if (flBarnlightShadowScale > 0.0) {
            elPanel.SetBarnlightShadowScaleOverride(flBarnlightShadowScale);
        }
    }
    let m_backgroundMapSoundHandle = null;
    let m_bRestartBackgroundMapSound = false;
    function _PlayBackgroundMapSound(backgroundMap) {
        let soundName = 'UIPanorama.BG_' + backgroundMap;
        if (m_backgroundMapSoundHandle) {
            UiToolkitAPI.StopSoundEvent(m_backgroundMapSoundHandle, 0.1);
            m_backgroundMapSoundHandle = null;
        }
        m_backgroundMapSoundHandle = UiToolkitAPI.PlaySoundEvent(soundName);
    }
    function _ShowLeaderPet(elMapPanel) {
        const leaderPetItemId = elMapPanel.GetLeaderPetItemId();
        if (!VanityPetInfo.BShouldKeepZoom(leaderPetItemId)) {
            _ResetPetZoom();
        }
        if (leaderPetItemId === '0') {
            _HidePetEntities(elMapPanel);
        }
        else {
            _ShowPetEntities(elMapPanel, leaderPetItemId);
        }
    }
    function _HidePetEntities(elPanel) {
        _m_nPetUpgradeLevel = null;
        UpdatePetInfoPanel(elPanel, '0');
    }
    function _ShowPetEntities(elPanel, petItemId) {
        _m_nPetUpgradeLevel = Number(InventoryAPI.GetItemAttributeValue(petItemId, '{uint32}upgrade level'));
        UpdatePetInfoPanel(elPanel, petItemId);
    }
    function UpdatePetInfoPanel(elMapPanel, petItemId) {
        let elParent = $.GetContextPanel().FindChildInLayoutFile('MainMenuVanityInfo');
        let elInfoPanel = VanityPetInfo.CreateOrUpdatePetInfoPanel(elParent, petItemId);
        if (elInfoPanel) {
            VanityPetInfo.SetZoomBtns(elMapPanel, elInfoPanel, petItemId);
            $.GetContextPanel().FindChildInLayoutFile('MainMenuVanityParent').AddBlurPanel(elInfoPanel.FindChildInLayoutFile('vanity-pet-actions'));
            $.GetContextPanel().FindChildInLayoutFile('MainMenuVanityParent').AddBlurPanel(elInfoPanel.FindChildInLayoutFile('id-pet-milestone-egg'));
            $.GetContextPanel().FindChildInLayoutFile('MainMenuVanityParent').AddBlurPanel(elInfoPanel.FindChildInLayoutFile('id-pet-milestone-chick'));
            $.GetContextPanel().FindChildInLayoutFile('MainMenuVanityParent').AddBlurPanel(elInfoPanel.FindChildInLayoutFile('id-pet-milestone-pullet'));
            $.GetContextPanel().FindChildInLayoutFile('MainMenuVanityParent').AddBlurPanel(elInfoPanel.FindChildInLayoutFile('id-pet-milestone-hen'));
        }
    }
    function _ResetPetZoom() {
        const vanityPanel = $('#JsMainmenu_Vanity');
        if (vanityPanel && vanityPanel.IsValid()) {
            VanityPetInfo.ResetPetZoom(vanityPanel);
        }
    }
    function _RegisterOnShowEvents() {
        NewNewsEntryCheck.RegisterForRssReceivedEvent();
        if (!_m_LobbyMatchmakingSessionUpdateEventHandler && !GameStateAPI.IsLocalPlayerPlayingMatch()) {
            _m_LobbyMatchmakingSessionUpdateEventHandler = $.RegisterForUnhandledEvent("PanoramaComponent_Lobby_MatchmakingSessionUpdate", _LobbyPlayerUpdated);
            _m_LobbyPlayerUpdatedEventHandler = $.RegisterForUnhandledEvent("PanoramaComponent_PartyList_RebuildPartyList", _LobbyPlayerUpdated);
            _m_LobbyForceRestartVanityEventHandler = $.RegisterForUnhandledEvent("ForceRestartVanity", _ForceRestartVanity);
            _m_LobbyMainMenuSwitchVanityEventHandler = $.RegisterForUnhandledEvent("MainMenuSwitchVanity", _SwitchVanity);
        }
        if (!_m_UiSceneFrameBoundaryEventHandler) {
            _m_UiSceneFrameBoundaryEventHandler = $.RegisterForUnhandledEvent("UISceneFrameBoundary", _OnUISceneFrameBoundary);
        }
        if (!_m_equipSlotChangedHandler) {
            _m_equipSlotChangedHandler = $.RegisterForUnhandledEvent('PanoramaComponent_Loadout_EquipSlotChanged', _UpdateLocalPlayerVanity);
        }
    }
    function _OnShowMainMenu() {
        $.DispatchEvent('PlayMainMenuMusic', true, true);
        GameInterfaceAPI.ResetChickenAudio();
        m_bRestartBackgroundMapSound = true;
        _RegisterOnShowEvents();
        _m_bVanityAnimationAlreadyStarted = false;
        _LobbyPlayerUpdated();
        _OnInitFadeUp();
        $('#MainMenuNavBarPlay').SetHasClass('pausemenu-navbar__btn-small--hidden', false);
        _UpdateOverwatch();
        _UpdateNotifications();
        _UpdateInventoryBtnAlert();
        _UpdateStoreAlert();
        _GcLogonNotificationReceived();
        _CheckPopupNotificationsAtLogon();
        _UpdateUnlockCompAlert();
        _FetchTournamentData();
        _ShowFloatingPanels();
        $('#MainMenuNavBarHome').checked = true;
        if (GameTypesAPI.ShouldShowNewUserPopup()) {
            _NewUser_ShowTrainingCompletePopup();
        }
        if (!_m_bPreLoadedTabs) {
            _LoadTab('JsSettings', 'settings/settings');
            _OpenPlayMenu();
            OnHomeButtonPressed();
            _m_bPreLoadedTabs = true;
        }
        _ResetAnnotationsDropDown();
        _UpdateBackgroundMap();
    }
    function _TournamentDraftUpdate() {
        if (!m_TournamentPickBanPopup || !m_TournamentPickBanPopup.IsValid()) {
            m_TournamentPickBanPopup = UiToolkitAPI.ShowCustomLayoutPopup('tournament_pickban_popup', 'file://{resources}/layout/popups/popup_tournament_pickban.xml');
        }
    }
    let _m_bPopupNotificationAtLogonShown = false;
    function _CheckPopupNotificationsAtLogon() {
        if (_m_bPopupNotificationAtLogonShown)
            return;
        const strNotification = MyPersonaAPI.GetTradeBanNotification();
        if (strNotification) {
            const refTS = 1695849359;
            const numSTill = -NewsAPI.GetNumSecondsTillGcTimestamp(refTS);
            const valSnooze = GameInterfaceAPI.GetSettingString('ui_notification_tb_snooze');
            const numSnooze = valSnooze ? parseInt(valSnooze) : 0;
            if (numSTill && (!numSnooze || Math.abs(numSTill - numSnooze) > (30 * 24 * 3600))) {
                _m_bPopupNotificationAtLogonShown = true;
                UiToolkitAPI.ShowGenericPopupOneOptionBgStyle("#SFUI_LoginPerfectWorld_Title_Info", strNotification, "", "#UI_OK", () => { GameInterfaceAPI.SetSettingString('ui_notification_tb_snooze', '' + numSTill); }, "dim");
            }
        }
    }
    let _m_bGcLogonNotificationReceivedOnce = false;
    function _GcLogonNotificationReceived() {
        if (_m_bGcLogonNotificationReceivedOnce)
            return;
        const strFatalError = MyPersonaAPI.GetClientLogonFatalError();
        if (strFatalError
            && (strFatalError !== "ShowGameLicenseNoOnlineLicensePW")
            && (strFatalError !== "ShowGameLicenseNoOnlineLicense")) {
            _m_bGcLogonNotificationReceivedOnce = true;
            if (strFatalError === "ShowGameLicenseNeedToLinkAccountsWithMoreInfo") {
                UiToolkitAPI.ShowGenericPopupThreeOptionsBgStyle("#CSGO_Purchasable_Game_License_Short", "#SFUI_LoginLicenseAssist_PW_NeedToLinkAccounts_WW_hint", "", "#UI_Yes", () => SteamOverlayAPI.OpenURL("https://community.csgo.com.cn/join/pwlink_csgo"), "#UI_No", () => { }, "#ShowFAQ", () => _OnGcLogonNotificationReceived_ShowFaqCallback(), "dim");
            }
            else if (strFatalError === "ShowGameLicenseNeedToLinkAccounts") {
                _OnGcLogonNotificationReceived_ShowLicenseYesNoBox("#SFUI_LoginLicenseAssist_PW_NeedToLinkAccounts", "https://community.csgo.com.cn/join/pwlink_csgo");
            }
            else if (strFatalError === "ShowGameLicenseHasLicensePW") {
                _OnGcLogonNotificationReceived_ShowLicenseYesNoBox("#SFUI_LoginLicenseAssist_HasLicense_PW", "https://community.csgo.com.cn/join/pwlink_csgo?needlicense=1");
            }
            else if (strFatalError === "ShowGameLicenseNoOnlineLicensePW") {
            }
            else if (strFatalError === "ShowGameLicenseNoOnlineLicense") {
            }
            else {
                UiToolkitAPI.ShowGenericPopupOneOptionBgStyle("#SFUI_LoginPerfectWorld_Title_Error", strFatalError, "", "#GameUI_Quit", () => GameInterfaceAPI.ConsoleCommand("quit"), "dim");
            }
            return;
        }
        const nAntiAddictionTrackingState = MyPersonaAPI.GetTimePlayedTrackingState();
        if (nAntiAddictionTrackingState > 0) {
            _m_bGcLogonNotificationReceivedOnce = true;
            const pszDialogTitle = "#SFUI_LoginPerfectWorld_Title_Info";
            let pszDialogMessageText = "#SFUI_LoginPerfectWorld_AntiAddiction1";
            let pszOverlayUrlToOpen = null;
            if (nAntiAddictionTrackingState != 2) {
                pszDialogMessageText = "#SFUI_LoginPerfectWorld_AntiAddiction2";
                pszOverlayUrlToOpen = "https://community.csgo.com.cn/join/pwcompleteaccountinfo";
            }
            if (pszOverlayUrlToOpen) {
                UiToolkitAPI.ShowGenericPopupYesNo(pszDialogTitle, pszDialogMessageText, "", () => SteamOverlayAPI.OpenURL(pszOverlayUrlToOpen), () => { });
            }
            else {
                UiToolkitAPI.ShowGenericPopup(pszDialogTitle, pszDialogMessageText, "");
            }
            return;
        }
    }
    let _m_numGameMustExitNowForAntiAddictionHandled = 0;
    let _m_panelGameMustExitDialog = null;
    function _GameMustExitNowForAntiAddiction() {
        if (_m_panelGameMustExitDialog && _m_panelGameMustExitDialog.IsValid())
            return;
        if (_m_numGameMustExitNowForAntiAddictionHandled >= 100)
            return;
        ++_m_numGameMustExitNowForAntiAddictionHandled;
        _m_panelGameMustExitDialog =
            UiToolkitAPI.ShowGenericPopupOneOptionBgStyle("#GameUI_QuitConfirmationTitle", "#UI_AntiAddiction_ExitGameNowMessage", "", "#GameUI_Quit", () => GameInterfaceAPI.ConsoleCommand("quit"), "dim");
    }
    function _OnGcLogonNotificationReceived_ShowLicenseYesNoBox(strTextMessage, pszOverlayUrlToOpen) {
        UiToolkitAPI.ShowGenericPopupTwoOptionsBgStyle("#CSGO_Purchasable_Game_License_Short", strTextMessage, "", "#UI_Yes", () => SteamOverlayAPI.OpenURL(pszOverlayUrlToOpen), "#UI_No", () => { }, "dim");
    }
    function _OnGcLogonNotificationReceived_ShowFaqCallback() {
        SteamOverlayAPI.OpenURL("https://support.steampowered.com/kb_article.php?ref=6026-IFKZ-7043&l=schinese");
        _m_bGcLogonNotificationReceivedOnce = false;
        _GcLogonNotificationReceived();
    }
    function _OnHideMainMenu() {
        const vanityPanel = $('#JsMainmenu_Vanity');
        if (vanityPanel) {
            CharacterAnims.CancelScheduledAnim(vanityPanel);
        }
        _m_elContentPanel.RemoveClass('mainmenu-content--animate');
        _m_elContentPanel.AddClass('mainmenu-content--offscreen');
        _CancelNotificationSchedule();
        _UnregisterShowEvents();
        _CloseAllVisiblePopups();
        _StopFetchingTournamentData();
        if (vanityPanel) {
            _SetPetInteractionEnabled(vanityPanel, false);
        }
    }
    function _UnregisterShowEvents() {
        NewNewsEntryCheck.UnRegisterForRssReceivedEvent();
        if (_m_LobbyMatchmakingSessionUpdateEventHandler) {
            $.UnregisterForUnhandledEvent("PanoramaComponent_Lobby_MatchmakingSessionUpdate", _m_LobbyMatchmakingSessionUpdateEventHandler);
            _m_LobbyMatchmakingSessionUpdateEventHandler = null;
        }
        if (_m_LobbyPlayerUpdatedEventHandler) {
            $.UnregisterForUnhandledEvent("PanoramaComponent_PartyList_RebuildPartyList", _m_LobbyPlayerUpdatedEventHandler);
            _m_LobbyPlayerUpdatedEventHandler = null;
        }
        if (_m_LobbyForceRestartVanityEventHandler) {
            $.UnregisterForUnhandledEvent("ForceRestartVanity", _m_LobbyForceRestartVanityEventHandler);
            _m_LobbyForceRestartVanityEventHandler = null;
        }
        if (_m_LobbyMainMenuSwitchVanityEventHandler) {
            $.UnregisterForUnhandledEvent("MainMenuSwitchVanity", _m_LobbyMainMenuSwitchVanityEventHandler);
            _m_LobbyMainMenuSwitchVanityEventHandler = null;
        }
        if (_m_UiSceneFrameBoundaryEventHandler) {
            $.UnregisterForUnhandledEvent("UISceneFrameBoundary", _m_UiSceneFrameBoundaryEventHandler);
            _m_UiSceneFrameBoundaryEventHandler = null;
        }
        if (_m_equipSlotChangedHandler) {
            $.UnregisterForUnhandledEvent("PanoramaComponent_Loadout_EquipSlotChanged", _m_equipSlotChangedHandler);
            _m_equipSlotChangedHandler = null;
        }
    }
    function _OnShowPauseMenu() {
        const elContextPanel = $.GetContextPanel();
        elContextPanel.AddClass('MainMenuRootPanel--PauseMenuMode');
        elContextPanel.SetHasClass('MainMenuRootPanel--PauseMenuDuringDemoPlayback', GameStateAPI.IsDemoOrHltv());
        $('#id-pausemenu-mission-panel').SetHasClass('hide-non-prime', MyPersonaAPI.GetElevatedState() != 'elevated');
        const bQueuedMatchmaking = GameStateAPI.IsQueuedMatchmaking();
        const bGotvSpectating = elContextPanel.IsGotvSpectating();
        const bIsCommunityServer = !_m_bPerfectWorld && MatchStatsAPI.IsConnectedToCommunityServer();
        $('#MainMenuNavBarPlay').SetHasClass('pausemenu-navbar__btn-small--hidden', true);
        $('#MainMenuNavBarSwitchTeams').SetHasClass('pausemenu-navbar__btn-small--hidden', (bQueuedMatchmaking || bGotvSpectating));
        $('#MainMenuNavBarVote').SetHasClass('pausemenu-navbar__btn-small--hidden', (bGotvSpectating));
        $('#MainMenuNavBarReportServer').SetHasClass('pausemenu-navbar__btn-small--hidden', !bIsCommunityServer);
        OnHomeButtonPressed();
        _SetupAnnotationOptions(false);
    }
    function _ResetAnnotationsDropDown() {
        let elAnnotationDropDown = $('#id-play-menu-pausemenu-annotations-dropdown');
        elAnnotationDropDown.SetSelectedIndex(0);
        elAnnotationDropDown.Data().m_mapBspName = "";
    }
    function _EnableGuidesDropdown() {
        let elAnnotationsInternal = $("#id-play-menu-pausemenu-annotations__internal");
        let elAnnotationDropDown = $('#id-play-menu-pausemenu-annotations-dropdown');
        let elAnnotationsRoundRestrictionLabel = $('#id-play-menu-pausemenu-annotations-roundrestricted');
        elAnnotationsInternal.enabled = true;
        elAnnotationsInternal.visible = true;
        elAnnotationDropDown.visible = true;
        elAnnotationsRoundRestrictionLabel.visible = false;
    }
    function _DisableGuidesDropdown() {
        let elAnnotationsInternal = $("#id-play-menu-pausemenu-annotations__internal");
        let elAnnotationDropDown = $('#id-play-menu-pausemenu-annotations-dropdown');
        let elAnnotationsRoundRestrictionLabel = $('#id-play-menu-pausemenu-annotations-roundrestricted');
        elAnnotationsInternal.enabled = false;
        elAnnotationsInternal.visible = false;
        elAnnotationDropDown.visible = false;
        elAnnotationsRoundRestrictionLabel.visible = false;
    }
    function _RoundRestrictedGuidesDropdown() {
        let elAnnotationsInternal = $("#id-play-menu-pausemenu-annotations__internal");
        let elAnnotationDropDown = $('#id-play-menu-pausemenu-annotations-dropdown');
        let elAnnotationsRoundRestrictionLabel = $('#id-play-menu-pausemenu-annotations-roundrestricted');
        elAnnotationsInternal.enabled = false;
        elAnnotationsInternal.visible = true;
        elAnnotationDropDown.visible = false;
        elAnnotationsRoundRestrictionLabel.visible = true;
        let nMaxRound = GameInterfaceAPI.GetSettingString('sv_annotation_limits_max_rounds_per_half');
        elAnnotationsRoundRestrictionLabel.SetDialogVariable('rounds', nMaxRound);
    }
    function _SetupAnnotationOptions(bForce) {
        switch (GameStateAPI.GetAnnotationsViewingLevel()) {
            case 3:
            case 2:
                _EnableGuidesDropdown();
                break;
            case 1:
                _RoundRestrictedGuidesDropdown();
                break;
            case 0:
                _DisableGuidesDropdown();
                break;
        }
        let elAnnotationDropDown = $('#id-play-menu-pausemenu-annotations-dropdown');
        if (elAnnotationDropDown.Data().m_mapBspName !== GameStateAPI.GetMapBSPName() ||
            bForce) {
            elAnnotationDropDown.RebuildOptions(GameStateAPI.GetMapBSPName(), true);
            elAnnotationDropDown.Data().m_mapBspName = GameStateAPI.GetMapBSPName();
        }
    }
    function _OnHidePauseMenu() {
        $.GetContextPanel().RemoveClass('MainMenuRootPanel--PauseMenuMode');
        $.GetContextPanel().SetHasClass('MainMenuRootPanel--PauseMenuDuringDemoPlayback', false);
        _DeletePauseMenuMissionPanel();
        OnHomeButtonPressed();
    }
    function _BCheckTabCanBeOpenedRightNow(tab) {
        if (tab === 'JsInventory' || tab === 'JsMainMenuStore' || tab === 'JsLoadout') {
            const restrictions = LicenseUtil.GetCurrentLicenseRestrictions();
            if (restrictions !== false) {
                LicenseUtil.ShowLicenseRestrictions(restrictions);
                return false;
            }
        }
        if (tab === 'JsInventory' || tab === 'JsPlayerStats' || tab === 'JsLoadout' || tab === 'JsMainMenuStore') {
            if (!MyPersonaAPI.IsInventoryValid() || !MyPersonaAPI.IsConnectedToGC()) {
                UiToolkitAPI.ShowGenericPopupOk($.Localize('#SFUI_SteamConnectionErrorTitle'), $.Localize('#SFUI_Steam_Error_LinkUnexpected'), '', () => { });
                return false;
            }
        }
        return true;
    }
    function _LoadTab(tab, XmlName, setActiveSection = '') {
        if (!$.GetContextPanel().FindChildInLayoutFile(tab)) {
            const newPanel = $.CreatePanel('Panel', _m_elContentPanel, tab);
            if (setActiveSection !== '') {
                newPanel.SetAttributeString('set-active-section', setActiveSection);
            }
            newPanel.BLoadLayout('file://{resources}/layout/' + XmlName + '.xml', false, false);
            newPanel.SetReadyForDisplay(false);
            newPanel.RegisterForReadyEvents(true);
            $.RegisterEventHandler('PropertyTransitionEnd', newPanel, (panel, propertyName) => {
                if (newPanel.id === panel.id && propertyName === 'opacity') {
                    if (newPanel.visible === true && newPanel.BIsTransparent()) {
                        newPanel.SetReadyForDisplay(false);
                        newPanel.visible = false;
                        return true;
                    }
                    else if (newPanel.visible === true) {
                        $.DispatchEvent('MainMenuTabShown', tab);
                    }
                }
                return false;
            });
            newPanel.AddClass('mainmenu-content--hidden');
            newPanel.visible = false;
        }
    }
    function NavigateToTab(tab, XmlName, setActiveSection = '') {
        if (!_BCheckTabCanBeOpenedRightNow(tab)) {
            OnHomeButtonPressed();
            return;
        }
        if (tab === 'JsPlayerStats') {
            return;
        }
        $.DispatchEvent('PlayMainMenuMusic', true, false);
        GameInterfaceAPI.SetSettingString('panorama_play_movie_ambient_sound', '0');
        _LoadTab(tab, XmlName, setActiveSection);
        ParticleControls.UpdateMainMenuTopBar(m_MainMenuTopBarParticleFX, tab);
        if (_m_activeTab !== tab) {
            if (XmlName && _m_bPreLoadedTabs) {
                let soundName = '';
                if (XmlName === 'mainmenu_store_fullscreen') {
                    if (setActiveSection !== '') {
                        $.GetContextPanel().FindChildInLayoutFile(tab).SetAttributeString('set-active-section', setActiveSection);
                    }
                    soundName = 'UIPanorama.tab_mainmenu_shop';
                    $.DispatchEvent('UpdateXpShop');
                }
                else if (XmlName === 'loadout_grid') {
                    soundName = 'UIPanorama.tab_mainmenu_loadout';
                }
                else {
                    soundName = 'tab_' + XmlName.replace('/', '_');
                }
                $.DispatchEvent('CSGOPlaySoundEffect', soundName, 'MOUSE');
            }
            if (_m_activeTab) {
                $.GetContextPanel().CancelDrag();
                const panelToHide = $.GetContextPanel().FindChildInLayoutFile(_m_activeTab);
                panelToHide.AddClass('mainmenu-content--hidden');
            }
            _m_activeTab = tab;
            const activePanel = $.GetContextPanel().FindChildInLayoutFile(tab);
            activePanel.RemoveClass('mainmenu-content--hidden');
            activePanel.visible = true;
            activePanel.SetReadyForDisplay(true);
        }
        _ShowContentPanel();
    }
    MainMenu.NavigateToTab = NavigateToTab;
    function _UpdateChickenAudioForContentPanel(bContentPanelOpen) {
        GameInterfaceAPI.SetChickenAudioSuppressed('mainmenu_content', bContentPanelOpen);
    }
    function _ShowContentPanel() {
        if (_m_elContentPanel.BHasClass('mainmenu-content--offscreen')) {
            _m_elContentPanel.AddClass('mainmenu-content--animate');
            _m_elContentPanel.RemoveClass('mainmenu-content--offscreen');
            _m_elContentPanel.SetFocus();
        }
        $.GetContextPanel().AddClass("mainmenu-content--open");
        _UpdateChickenAudioForContentPanel(true);
        $.DispatchEvent('ShowContentPanel');
        _DimMainMenuBackground(false);
        _HideFloatingPanels();
    }
    function _OnHideContentPanel() {
        _m_elContentPanel.AddClass('mainmenu-content--animate');
        _m_elContentPanel.AddClass('mainmenu-content--offscreen');
        $.GetContextPanel().RemoveClass("mainmenu-content--open");
        _UpdateChickenAudioForContentPanel(false);
        const elActiveNavBarBtn = _GetActiveNavBarButton();
        if (elActiveNavBarBtn && elActiveNavBarBtn.id !== 'MainMenuNavBarHome') {
            elActiveNavBarBtn.checked = false;
        }
        _DimMainMenuBackground(true);
        if (_m_activeTab) {
            $.GetContextPanel().CancelDrag();
            const panelToHide = $.GetContextPanel().FindChildInLayoutFile(_m_activeTab);
            panelToHide.AddClass('mainmenu-content--hidden');
        }
        _m_activeTab = '';
        _ShowFloatingPanels();
    }
    function _OnShowFullScreenOpaquePopup() {
        $('#MainMenuInput').SetHasClass('HiddenByPopup', true);
    }
    function _OnCloseAllFullScreenOpaquePopups() {
        $('#MainMenuInput').SetHasClass('HiddenByPopup', false);
    }
    function _GetActiveNavBarButton() {
        const elNavBar = $('#MainMenuNavBarTop');
        const children = elNavBar.Children();
        const count = children.length;
        for (let i = 0; i < count; i++) {
            if (children[i].IsSelected()) {
                return children[i];
            }
        }
    }
    function ExpandSidebar(AutoClose = false) {
        const elSidebar = $('#JsMainMenuSidebar');
        if (elSidebar.BHasClass('mainmenu-sidebar--minimized')) {
            $.DispatchEvent('CSGOPlaySoundEffect', 'sidemenu_slidein', 'MOUSE');
        }
        elSidebar.RemoveClass('mainmenu-sidebar--minimized');
        _SlideSearchPartyParticles(true);
        $.DispatchEvent('SidebarIsCollapsed', false);
        _DimMainMenuBackground(false);
        if (AutoClose) {
            $.Schedule(1, MinimizeSidebar);
        }
    }
    MainMenu.ExpandSidebar = ExpandSidebar;
    function MinimizeSidebar() {
        if (_m_elContentPanel == null) {
            return;
        }
        if (_m_sideBarElementContextMenuActive) {
            return;
        }
        const elSidebar = $('#JsMainMenuSidebar');
        if (!elSidebar.BHasClass('mainmenu-sidebar--minimized')) {
            $.DispatchEvent('CSGOPlaySoundEffect', 'sidemenu_slideout', 'MOUSE');
        }
        elSidebar.AddClass('mainmenu-sidebar--minimized');
        _SlideSearchPartyParticles(false);
        $.DispatchEvent('SidebarIsCollapsed', true);
        _DimMainMenuBackground(true);
    }
    MainMenu.MinimizeSidebar = MinimizeSidebar;
    function _OnSideBarElementContextMenuActive(bActive) {
        _m_sideBarElementContextMenuActive = bActive;
        $.Schedule(0.25, () => {
            if (!$('#JsMainMenuSidebar').BHasHoverStyle())
                MinimizeSidebar();
        });
        _DimMainMenuBackground(false);
    }
    function _DimMainMenuBackground(removeDim) {
        if (removeDim && _m_elContentPanel.BHasClass('mainmenu-content--offscreen') &&
            $('#mainmenu-content__blur-target').BHasHoverStyle() === false) {
            $('#MainMenuBackground').RemoveClass('Dim');
        }
        else
            $('#MainMenuBackground').AddClass('Dim');
    }
    function OnHomeButtonPressed() {
        $.DispatchEvent('HideContentPanel');
        ParticleControls.UpdateMainMenuTopBar(m_MainMenuTopBarParticleFX, '');
        const vanityPanel = $('#JsMainmenu_Vanity');
        if (vanityPanel && vanityPanel.IsValid()) {
            vanityPanel.Pause();
            _ResetPetZoom();
        }
        $('#MainMenuNavBarHome').checked = true;
        _CheckRankUpRedemptionStore();
    }
    MainMenu.OnHomeButtonPressed = OnHomeButtonPressed;
    function OnQuitButtonPressed() {
        UiToolkitAPI.ShowGenericPopupOneOptionCustomCancelBgStyle('#UI_ConfirmExitTitle', '#UI_ConfirmExitMessage', '', '#UI_Quit', () => QuitGame('Option1'), '#UI_Return', () => { }, 'dim');
    }
    MainMenu.OnQuitButtonPressed = OnQuitButtonPressed;
    function QuitGame(msg) {
        GameInterfaceAPI.ConsoleCommand('quit');
    }
    function _InitFriendsList() {
        const friendsList = $.CreatePanel('Panel', $.FindChildInContext('#mainmenu-sidebar__blur-target'), 'JsFriendsList');
        friendsList.BLoadLayout('file://{resources}/layout/friendslist.xml', false, false);
    }
    function _HideMainMenuNewsPanel() {
        const elNews = $.FindChildInContext('#JsNewsContainer');
        elNews.SetHasClass('news-panel--hide-news-panel', true);
        elNews.SetHasClass('news-panel-style-feature-panel-visible', false);
    }
    function _ShowFloatingPanels() {
        $.FindChildInContext('#JsLeftColumn').SetHasClass('hidden', false);
        $.FindChildInContext('#JsRightColumn').SetHasClass('hidden', false);
        $.FindChildInContext('#MainMenuVanityInfo').SetHasClass('hidden', false);
    }
    function _HideFloatingPanels() {
        $.FindChildInContext('#JsLeftColumn').SetHasClass('hidden', true);
        $.FindChildInContext('#JsRightColumn').SetHasClass('hidden', true);
        $.FindChildInContext('#MainMenuVanityInfo').SetHasClass('hidden', true);
    }
    function _OnSteamIsPlaying() {
        const elNewsContainer = $.FindChildInContext('#JsNewsContainer');
        if (elNewsContainer) {
            elNewsContainer.SetHasClass('mainmenu-news-container-stream-active', EmbeddedStreamAPI.IsVideoPlaying());
        }
    }
    function _ResetNewsEntryStyle() {
        const elNewsContainer = $.FindChildInContext('#JsNewsContainer');
        if (elNewsContainer) {
            elNewsContainer.RemoveClass('mainmenu-news-container-stream-active');
        }
    }
    function _UpdatePartySearchParticlesType(isPremier) {
        const particle_container = $('#party-search-particles');
        if (isPremier) {
            particle_container.SetParticleNameAndRefresh("particles/ui/ui_mainmenu_active_search_gold.vpcf");
        }
        else {
            particle_container.SetParticleNameAndRefresh("particles/ui/ui_mainmenu_active_search.vpcf");
        }
    }
    function _UpdatePartySearchSetControlPointParticles(cpArray) {
        const particle_container = $('#party-search-particles');
        particle_container.StopParticlesImmediately(true);
        particle_container.StartParticles();
        for (const [cp, xpos, ypos, zpos] of cpArray) {
            particle_container.SetControlPoint(cp, xpos, ypos, zpos);
        }
        m_isParticleActive = true;
    }
    let m_verticalSpread = 0;
    let m_isParticleActive = false;
    function _UpdatePartySearchParticles() {
        const particle_container = $('#party-search-particles');
        if (particle_container.type !== "ParticleScenePanel")
            return;
        let AddServerErrors = 0;
        let serverWarning = NewsAPI.GetCurrentActiveAlertForUser();
        let isWarning = serverWarning !== '' && serverWarning !== undefined ? true : false;
        let bAttemptPremierMode = LobbyAPI.GetSessionSettings()?.game?.mode_ui === 'premier';
        if (isWarning)
            AddServerErrors = 5;
        let strStatus = LobbyAPI.GetMatchmakingStatusString();
        const bShowParticles = strStatus != null && (strStatus.endsWith("searching") || strStatus.endsWith("registering") || strStatus.endsWith("reserved"));
        if (!bShowParticles) {
            if (m_isParticleActive) {
                particle_container.StopParticlesImmediately(true);
                m_isParticleActive = false;
            }
            return;
        }
        let verticlSpread = 14 + (PartyListAPI.GetCount() - 1) * 5 + AddServerErrors;
        if (m_verticalSpread === verticlSpread && m_isParticleActive)
            return;
        _UpdatePartySearchParticlesType(bAttemptPremierMode);
        m_verticalSpread = verticlSpread;
        let CpArray = [
            [1, verticlSpread, .5, 1],
            [2, 1, .25, 0],
            [16, 15, 230, 15],
        ];
        _UpdatePartySearchSetControlPointParticles(CpArray);
    }
    function _ForceRestartVanity() {
        if (GameStateAPI.IsLocalPlayerPlayingMatch()) {
            return;
        }
        _m_bVanityAnimationAlreadyStarted = false;
        _InitVanity();
    }
    let m_aDisplayLobbyVanityData = [];
    function _InitVanity() {
        if (MatchStatsAPI.GetUiExperienceType()) {
            return;
        }
        if (!MyPersonaAPI.IsInventoryValid()) {
            if (MyPersonaAPI.GetClientLogonFatalError()) {
                _ShowVanity();
            }
            return;
        }
        if (_m_bVanityAnimationAlreadyStarted) {
            return;
        }
        _ShowVanity();
    }
    function _ShowVanity() {
        const vanityPanel = $('#JsMainmenu_Vanity');
        if (!vanityPanel) {
            return;
        }
        _m_bVanityAnimationAlreadyStarted = true;
        if (vanityPanel.BHasClass('hidden')) {
            vanityPanel.RemoveClass('hidden');
        }
        _UpdateLocalPlayerVanity();
    }
    function _ShowDebugLobbyModels() {
    }
    function _UpdateLocalPlayerVanity() {
        const oSettings = ItemInfo.GetOrUpdateVanityCharacterSettings();
        const oLocalPlayer = m_aDisplayLobbyVanityData.filter(storedEntry => { return storedEntry.isLocalPlayer === true; });
        if (oLocalPlayer.length > 0 && (oLocalPlayer[0].playeridx > (_m_maxMainMenuDisplayAgents - 1))) {
            return;
        }
        oSettings.playeridx = oLocalPlayer.length > 0 ? oLocalPlayer[0].playeridx : 0;
        oSettings.xuid = MyPersonaAPI.GetXuid();
        oSettings.isLocalPlayer = true;
        _ApplyVanitySettingsToLobbyMetadata(oSettings);
        _UpdatePlayerVanityModel(oSettings);
        _CreateUpdateVanityInfo(oSettings);
    }
    function _ApplyVanitySettingsToLobbyMetadata(oSettings) {
        PartyListAPI.SetLocalPlayerVanityPresence(oSettings.team, oSettings.charItemId, oSettings.glovesItemId, oSettings.loadoutSlot, oSettings.weaponItemId, oSettings.petItemId);
    }
    function _UpdatePlayerVanityModel(oSettings) {
        const vanityPanel = _UpdateBackgroundMap();
        vanityPanel.SetActiveCharacter(oSettings.playeridx);
        oSettings.panel = vanityPanel;
        if (!!oSettings.petItemId && Number(oSettings.petItemId) != 0) {
            if (oSettings.playeridx === 0) {
                _ShowPetEntities(vanityPanel, oSettings.petItemId);
                vanityPanel.SetPetPlacement('main-menu-foreground');
            }
            else
                vanityPanel.SetPetPlacement('main-menu-background');
        }
        else {
            if (oSettings.playeridx === 0)
                _HidePetEntities(vanityPanel);
            vanityPanel.SetPetPlacement('none');
        }
        CharacterAnims.PlayAnimsOnPanel(oSettings);
    }
    function _CreateUpdateVanityInfo(oSettings) {
        $.Schedule(.1, () => {
            const elVanityPlayerInfo = VanityPlayerInfo.CreateOrUpdateVanityInfoPanel($.GetContextPanel().FindChildInLayoutFile('MainMenuVanityInfo'), oSettings);
            if (elVanityPlayerInfo) {
                $.GetContextPanel().FindChildInLayoutFile('MainMenuVanityParent').AddBlurPanel(elVanityPlayerInfo.FindChildInLayoutFile('vanity-info-container'));
                let defName = '';
                let weaponId = oSettings.weaponItemId
                    ? oSettings.weaponItemId
                    : (oSettings.hasOwnProperty('vanity_data') && oSettings.vanity_data)
                        ? oSettings.vanity_data.split(',')[4]
                        : '';
                let team = oSettings.hasOwnProperty('team') && oSettings.team
                    ? oSettings.team
                    : (oSettings.hasOwnProperty('vanity_data') && oSettings.vanity_data)
                        ? oSettings.vanity_data.split(',')[0]
                        : '';
                if (weaponId) {
                    defName = InventoryAPI.GetItemDefinitionName(weaponId);
                }
                elVanityPlayerInfo.SetHasClass('move-up', (defName === 'weapon_negev' || defName === 'weapon_m249') && team === 'ct');
            }
        });
    }
    function _LobbyPlayerUpdated() {
        _UpdatePartySearchParticles();
        let numPlayersActuallyInParty = PartyListAPI.GetCount();
        if (!LobbyAPI.IsSessionActive() || MatchStatsAPI.GetUiExperienceType() || numPlayersActuallyInParty < 1 || !numPlayersActuallyInParty) {
            _ClearLobbyPlayers();
            _m_bVanityAnimationAlreadyStarted = false;
            $.Schedule(.1, _InitVanity);
            return;
        }
        const aCurrentLobbyVanityData = [];
        if (numPlayersActuallyInParty > 0) {
            numPlayersActuallyInParty = (numPlayersActuallyInParty > _m_maxMainMenuDisplayAgents) ? _m_maxMainMenuDisplayAgents : numPlayersActuallyInParty;
            for (let k = 0; k < numPlayersActuallyInParty; k++) {
                const xuid = PartyListAPI.GetXuidByIndex(k);
                aCurrentLobbyVanityData.push({
                    xuid: xuid,
                    isLocalPlayer: xuid === MyPersonaAPI.GetXuid(),
                    playeridx: k,
                    vanity_data: PartyListAPI.GetPartyMemberVanity(xuid)
                });
            }
            _CompareLobbyPlayers(aCurrentLobbyVanityData);
        }
        else {
            _ClearLobbyPlayers();
            _ForceRestartVanity();
        }
    }
    function _CompareLobbyPlayers(aCurrentLobbyVanityData) {
        for (let i = 0; i < _m_maxMainMenuDisplayAgents; i++) {
            if (aCurrentLobbyVanityData[i]) {
                if (!m_aDisplayLobbyVanityData[i]) {
                    m_aDisplayLobbyVanityData[i] = {
                        xuid: "",
                        playeridx: 0,
                        vanity_data: "",
                        isLocalPlayer: false
                    };
                }
                m_aDisplayLobbyVanityData[i].playeridx = aCurrentLobbyVanityData[i].playeridx;
                m_aDisplayLobbyVanityData[i].isLocalPlayer = aCurrentLobbyVanityData[i].isLocalPlayer;
                if (m_aDisplayLobbyVanityData[i].xuid !== aCurrentLobbyVanityData[i].xuid) {
                    VanityPlayerInfo.DeleteVanityInfoPanel($.GetContextPanel().FindChildInLayoutFile('MainMenuVanityInfo'), aCurrentLobbyVanityData[i].playeridx);
                    if (aCurrentLobbyVanityData[i].isLocalPlayer) {
                        _UpdateLocalPlayerVanity();
                    }
                }
                m_aDisplayLobbyVanityData[i].xuid = aCurrentLobbyVanityData[i].xuid;
                if (m_aDisplayLobbyVanityData[i].vanity_data !== aCurrentLobbyVanityData[i].vanity_data) {
                    if (!aCurrentLobbyVanityData[i].isLocalPlayer && aCurrentLobbyVanityData[i].vanity_data) {
                        _UpdateVanityFromLobbyUpdate(aCurrentLobbyVanityData[i].vanity_data, aCurrentLobbyVanityData[i].playeridx, aCurrentLobbyVanityData[i].xuid);
                    }
                }
                _CreateUpdateVanityInfo(aCurrentLobbyVanityData[i]);
                m_aDisplayLobbyVanityData[i].vanity_data = aCurrentLobbyVanityData[i].vanity_data;
            }
            else if (m_aDisplayLobbyVanityData[i]) {
                _ClearLobbyVanityModel(m_aDisplayLobbyVanityData[i].playeridx);
                delete m_aDisplayLobbyVanityData[i];
            }
        }
    }
    function _ClearLobbyPlayers() {
        for (let i = 0; i < m_aDisplayLobbyVanityData.length; ++i) {
            _ClearLobbyVanityModel(i);
        }
        m_aDisplayLobbyVanityData = [];
    }
    function _ClearLobbyVanityModel(index) {
        VanityPlayerInfo.DeleteVanityInfoPanel($.GetContextPanel().FindChildInLayoutFile('MainMenuVanityInfo'), index);
        $('#JsMainmenu_Vanity').SetActiveCharacter(index);
        $('#JsMainmenu_Vanity').RemoveCharacterModel();
    }
    function _UpdateVanityFromLobbyUpdate(strVanityData, index, xuid) {
        const arrVanityInfo = strVanityData.split(',');
        const oSettings = {
            xuid: xuid,
            team: arrVanityInfo[0],
            charItemId: arrVanityInfo[1],
            glovesItemId: arrVanityInfo[2],
            loadoutSlot: arrVanityInfo[3],
            weaponItemId: arrVanityInfo[4],
            petItemId: arrVanityInfo[5],
            playeridx: index
        };
        _UpdatePlayerVanityModel(oSettings);
    }
    function _PlayerActivityVoice(xuid) {
        const vanityPanel = $('#MainMenuVanityInfo');
        const elAvatar = vanityPanel.FindChildTraverse('JsPlayerVanityAvatar-' + xuid);
        if (elAvatar && elAvatar.IsValid()) {
            VanityPlayerInfo.UpdateVoiceIcon(elAvatar, xuid);
        }
    }
    function _OnUISceneFrameBoundary() {
        const elVanityPanel = $('#JsMainmenu_Vanity');
        if (elVanityPanel && elVanityPanel.IsValid()) {
            const elVanityPlayerInfoParent = $.GetContextPanel().FindChildInLayoutFile('MainMenuVanityInfo');
            for (let i = 0; i < _m_maxMainMenuDisplayAgents; i++) {
                if (elVanityPanel.SetActiveCharacter(i) === true) {
                    const oPanelPos = elVanityPanel.GetBonePositionInPanelSpace((i === 0) ? 'pelvis' : 'head_0');
                    oPanelPos.y -= 0.0;
                    VanityPlayerInfo.SetVanityInfoPanelPos(elVanityPlayerInfoParent, i, oPanelPos, "id-player-vanity-info-" + i);
                    if (i === 0) {
                        let oPetPanelPos;
                        if (_m_nPetUpgradeLevel === 0) {
                            oPetPanelPos = elVanityPanel.GetPetBonePositionInPanelSpace('egg');
                            oPetPanelPos.y -= 0.0;
                            VanityPetInfo.SetVanityPetInfoPos(elVanityPlayerInfoParent, oPetPanelPos);
                        }
                        else if (_m_nPetUpgradeLevel && _m_nPetUpgradeLevel > 0) {
                            oPetPanelPos = elVanityPanel.GetPetBonePositionInPanelSpace('root_motion');
                            oPetPanelPos.y -= 0.0;
                            VanityPetInfo.SetVanityPetInfoPos(elVanityPlayerInfoParent, oPetPanelPos);
                        }
                    }
                }
            }
        }
        if (GameInterfaceAPI.IsAppActive()) {
            _m_nActiveFrameCount++;
            if (_m_nActiveFrameCount == 100 && !_m_bTriedShowVideoSettingRecommendation) {
                VideoSettingRecommendations.MaybeShowPopup();
                _m_bTriedShowVideoSettingRecommendation = true;
            }
        }
        else {
            _m_nActiveFrameCount = 0;
        }
    }
    function _OpenPlayMenu() {
        if (MatchStatsAPI.GetUiExperienceType())
            return;
        _InsureSessionCreated();
        NavigateToTab('JsPlay', 'mainmenu_play');
    }
    function _OpenWatchMenu() {
        NavigateToTab('JsWatch', 'mainmenu_watch');
    }
    function _OpenInventory() {
        NavigateToTab('JsInventory', 'mainmenu_inventory');
    }
    function _OpenFullscreenStore(openToSection = '') {
        NavigateToTab('JsMainMenuStore', 'mainmenu_store_fullscreen', openToSection !== '' ? openToSection : 'id-store-nav-coupon');
    }
    function _OpenStatsMenu() {
        NavigateToTab('JsPlayerStats', 'mainmenu_playerstats');
    }
    function _OpenSettingsMenu() {
        NavigateToTab('JsSettings', 'settings/settings');
    }
    var _UpdateOverwatch = function () {
        var strCaseDescription = OverwatchAPI.GetAssignedCaseDescription();
        $('#MainMenuNavBarOverwatch').SetHasClass('pausemenu-navbar__btn-small--hidden', strCaseDescription == "");
    };
    function _OpenSubscriptionUpsell() {
        UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_subscription_upsell.xml', '');
    }
    function _ShowLoadoutForItem(itemId) {
        let bLoadoutPanelExisted = !!$.GetContextPanel().FindChildInLayoutFile('JsLoadout');
        $.DispatchEvent("Activated", $.GetContextPanel().FindChildInLayoutFile('MainMenuNavBarLoadout'), "mouse");
        let bLoadoutPanelExists = !!$.GetContextPanel().FindChildInLayoutFile('JsLoadout');
        if (!bLoadoutPanelExisted && bLoadoutPanelExists) {
            $.DispatchEvent("ShowLoadoutForItem", itemId);
        }
    }
    function _OpenSettings() {
        NavigateToTab('JsSettings', 'settings/settings', 'KeybdMouseSettings');
    }
    function _InsureSessionCreated() {
        if (!LobbyAPI.IsSessionActive()) {
            LobbyAPI.CreateSession();
        }
    }
    function OnEscapeKeyPressed() {
        if (_m_activeTab) {
            if (_m_activeTab === 'JsMainMenuStore') {
                const xpStoreMenu = _m_elContentPanel.FindChildInLayoutFile('JsMainMenuStore').FindChildInLayoutFile('id-store-page-xpshop');
                if (xpStoreMenu && xpStoreMenu.IsValid()) {
                    const xpShopNavBar = xpStoreMenu.FindChildInLayoutFile('id-xpshop-top-nav');
                    if (xpShopNavBar && xpShopNavBar.IsValid()) {
                        const navBtns = xpShopNavBar.Children();
                        let selectedTab = navBtns.filter(btn => btn.checked === true);
                        if (selectedTab[0].id !== navBtns[0].id) {
                            $.DispatchEvent('Activated', navBtns[0], 'mouse');
                            return;
                        }
                    }
                }
            }
            OnHomeButtonPressed();
        }
        else
            GameInterfaceAPI.ConsoleCommand("gameui_hide");
    }
    MainMenu.OnEscapeKeyPressed = OnEscapeKeyPressed;
    function _InventoryUpdated() {
        _UpdatePetNotification();
        _ForceRestartVanity();
        if (GameStateAPI.IsLocalPlayerPlayingMatch()) {
            return;
        }
        _UpdateInventoryBtnAlert();
        _UpdateStoreAlert();
    }
    function _RegisterPopupNotificationCallback(fnOnClose) {
        const handle = UiToolkitAPI.RegisterJSCallback(() => {
            UiToolkitAPI.UnregisterJSCallback(handle);
            if (_m_popupNotificationCallbackHandle === handle)
                _m_popupNotificationCallbackHandle = -1;
            fnOnClose();
        });
        _m_popupNotificationCallbackHandle = handle;
        return handle;
    }
    function _CloseAllVisiblePopups() {
        UiToolkitAPI.CloseAllVisiblePopups();
        if (_m_popupNotificationCallbackHandle !== -1) {
            UiToolkitAPI.UnregisterJSCallback(_m_popupNotificationCallbackHandle);
            _m_popupNotificationCallbackHandle = -1;
        }
        _m_bHasPopupNotification = false;
    }
    function _CheckRankUpRedemptionStore() {
        if (_m_bHasPopupNotification)
            return;
        if (GameStateAPI.IsLocalPlayerPlayingMatch())
            return;
        if (!$('#MainMenuNavBarHome').checked)
            return;
        const objStore = InventoryAPI.GetCacheTypeElementJSOByIndex("PersonalStore", 0);
        if (!objStore)
            return;
        if (!MyPersonaAPI.IsConnectedToGC() || !MyPersonaAPI.IsInventoryValid())
            return;
        const genTime = objStore.generation_time;
        const balance = objStore.redeemable_balance;
        const prevClientGenTime = Number(GameInterfaceAPI.GetSettingString("cl_redemption_reset_timestamp"));
        if (prevClientGenTime != genTime && balance > 0) {
            _m_bHasPopupNotification = true;
            const RankUpRedemptionStoreClosedCallbackHandle = _RegisterPopupNotificationCallback(_OnRankUpRedemptionStoreClosed);
            let elPopupPanel = UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_rankup_redemption_store.xml', 'callback=' + RankUpRedemptionStoreClosedCallbackHandle);
            elPopupPanel.Data().elMainMenu = $.GetContextPanel();
        }
    }
    function _CheckMajorStoreBalance() {
        if (_m_bMajorStoreBalanceChecked || _m_bHasPopupNotification)
            return;
        if (GameStateAPI.IsLocalPlayerPlayingMatch())
            return;
        if (!$('#MainMenuNavBarHome').checked)
            return;
        const elPopups = $('#PopupManager');
        if (elPopups && elPopups.BHasClass('HaveActivePopups'))
            return;
        if (!MyPersonaAPI.IsConnectedToGC() || !MyPersonaAPI.IsInventoryValid())
            return;
        _m_bMajorStoreBalanceChecked = true;
        const idxLookup = InventoryAPI.GetCacheTypeElementIndexByKey('SeasonalOperations', g_ActiveTournamentInfo.credits_id);
        if (g_ActiveTournamentInfo.credits_id != InventoryAPI.GetCacheTypeElementFieldByIndex('SeasonalOperations', idxLookup, 'season_value'))
            return;
        const nBalance = InventoryAPI.GetCacheTypeElementFieldByIndex('SeasonalOperations', idxLookup, 'redeemable_balance') ?? 0;
        if (nBalance < 99)
            return;
        _m_bHasPopupNotification = true;
        const closedCallbackHandle = _RegisterPopupNotificationCallback(() => { _m_bHasPopupNotification = false; });
        UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_major_store_balance.xml', 'balance=' + nBalance + '&callback=' + closedCallbackHandle);
    }
    function _OnRankUpRedemptionStoreClosed() {
        _m_bHasPopupNotification = false;
    }
    function _UpdateInventoryBtnAlert() {
        const aNewItems = AcknowledgeItems.GetItems();
        const count = aNewItems.length;
        const elNavBar = $.GetContextPanel().FindChildInLayoutFile('MainMenuNavBarTop'), elAlert = elNavBar.FindChildInLayoutFile('MainMenuInvAlert');
        elAlert.SetDialogVariable("alert_value", count.toString());
        elAlert.SetHasClass('hidden', count < 1);
    }
    function _OnInventoryInspect(id, contextmenuparam) {
        let inspectviewfunc = contextmenuparam ? contextmenuparam : 'primary';
        const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_inventory_inspect.xml');
        let oSettings = {
            item_id: id,
            inspect_only: true,
            force_inspect_view_type: inspectviewfunc
        };
        elPanel.Data().oSettings = oSettings;
    }
    function _OnShowCustomLayoutPopupParametersAsEvent(dimstyle, xmlname, panelparams) {
        const elPanel = UiToolkitAPI.ShowCustomLayoutPopup(dimstyle, xmlname);
        const aParams = panelparams.split(',');
        let oSettings = { item_id: '' };
        aParams.forEach(entry => {
            const settingPair = entry.split('=');
            oSettings[settingPair[0]] = settingPair[1];
        });
        elPanel.Data().oSettings = oSettings;
    }
    function _OnShowXrayCasePopup(toolid, caseId, bShowPopupWarning = false) {
        const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('popup-inspect-' + caseId, 'file://{resources}/layout/popups/popup_capability_decodable.xml');
        let oSettings = {
            item_id: caseId,
            tool_id: toolid,
            work_type: 'decodeable',
            is_xray_machine: true,
            show_xray_warning: bShowPopupWarning
        };
        elPanel.Data().oSettings = oSettings;
    }
    let JsInspectCallback = -1;
    function _OnLootlistItemPreview(id, params) {
        if (JsInspectCallback != -1) {
            UiToolkitAPI.UnregisterJSCallback(JsInspectCallback);
            JsInspectCallback = -1;
        }
        const ParamsList = params.split(',');
        const caseId = ParamsList[0];
        const lootlistNameOverride = ParamsList[3] && ParamsList[3] !== '' ? ParamsList[3] : 'false';
        JsInspectCallback = UiToolkitAPI.RegisterJSCallback(() => {
        });
        const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('popup-lootlist-item-inspect-' + id, 'file://{resources}/layout/popups/popup_inventory_inspect.xml');
        let oSettings = {
            item_id: id,
            inspect_only: true,
            hide_all_action_items: true,
            hide_item_cert: true,
            show_market_link: _m_bPerfectWorld ? false : true,
            callback_handle: JsInspectCallback,
            case_id_for_lootlist: caseId,
            lootlist_name_override: lootlistNameOverride
        };
        elPanel.Data().oSettings = oSettings;
    }
    function _WeaponPreviewRequest(id, bWorkshopItemPreview = false) {
        const workshopPreview = bWorkshopItemPreview ? 'true' : 'false';
        _CloseAllVisiblePopups();
        const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('popup-weapon-preview-inspect-' + id, 'file://{resources}/layout/popups/popup_inventory_inspect.xml');
        let oSettings = {
            item_id: id,
            inspect_only: true,
            hide_all_action_items: true,
            is_workshop_preview: bWorkshopItemPreview
        };
        elPanel.Data().oSettings = oSettings;
    }
    function _SelectItemForWorkshopPreviewCapability(capability, itemid, itemid2) {
        _CloseAllVisiblePopups();
        _OpenInventory();
        $.DispatchEvent('ShowSelectItemForWorkshopPreviewCapability', capability, itemid, itemid2);
    }
    function _UpdateStoreAlert() {
        let hideAlert;
        const objStore = InventoryAPI.GetCacheTypeElementJSOByIndex("PersonalStore", 0);
        const gcConnection = MyPersonaAPI.IsConnectedToGC();
        const validInventory = MyPersonaAPI.IsInventoryValid();
        hideAlert = !gcConnection || !validInventory || !objStore || objStore.redeemable_balance === 0;
        const elNavBar = $.GetContextPanel().FindChildInLayoutFile('MainMenuNavBarTop');
        const elAlert = elNavBar.FindChildInLayoutFile('MainMenuStoreAlert');
        elAlert.SetDialogVariable("alert_value", $.Localize("#Store_Price_New"));
        elAlert.SetHasClass('hidden', hideAlert);
    }
    function _CancelNotificationSchedule() {
        if (_m_notificationSchedule !== false) {
            $.CancelScheduled(_m_notificationSchedule);
            _m_notificationSchedule = false;
        }
    }
    function _AcknowledgePenaltyNotificationsCallback() {
        CompetitiveMatchAPI.ActionAcknowledgePenalty();
        _m_bHasPopupNotification = false;
    }
    function _AcknowledgeMsgNotificationsCallback() {
        MyPersonaAPI.ActionAcknowledgeNotifications();
        _m_bHasPopupNotification = false;
    }
    let _m_petEventCache = null;
    function GetPetPopupNotification() {
        if (_m_bHasPopupNotification)
            return null;
        if (GameStateAPI.IsLocalPlayerPlayingMatch())
            return null;
        if (!$('#MainMenuNavBarHome').checked)
            return null;
        if (!MyPersonaAPI.IsConnectedToGC() || !MyPersonaAPI.IsInventoryValid())
            return null;
        const petItemId = InventoryAPI.GetPetItemID();
        if (!petItemId && !_m_petEventCache)
            return null;
        let nUpgradeLevelDetected = 0;
        if (petItemId) {
            const nUpgradeLevel = Number(InventoryAPI.GetItemAttributeValue(petItemId, '{uint32}upgrade level'));
            if (!_m_petEventCache || petItemId !== _m_petEventCache.petItemId) {
                _m_petEventCache = {
                    petItemId: petItemId,
                    nLastKnownUpgradeLevel: nUpgradeLevel,
                    strExpiryReason: '',
                };
            }
            const strExpectExpiry = InventoryAPI.TryAckPetEventAndCheckExpiration(petItemId);
            if (strExpectExpiry) {
                _m_petEventCache.strExpiryReason = strExpectExpiry;
            }
            else if (nUpgradeLevel > _m_petEventCache.nLastKnownUpgradeLevel) {
                nUpgradeLevelDetected = nUpgradeLevel;
            }
        }
        if (_m_petEventCache && _m_petEventCache.strExpiryReason) {
            if (!petItemId) {
                const ackExpPetItemId = _m_petEventCache.petItemId;
                const savedPetId = InventoryAPI.RestorePetItemData();
                return {
                    title: "#pet_expired_notification_title",
                    msg: "#pet_expired_notification_msg",
                    color_class: "NotificationYellow",
                    callback: () => {
                        _m_bHasPopupNotification = false;
                        if (_m_petEventCache && _m_petEventCache.petItemId === ackExpPetItemId)
                            _m_petEventCache = null;
                    },
                    html: false,
                    rental_id: "",
                    pet_id: savedPetId + ',' + _m_petEventCache.strExpiryReason,
                    ack_exp_pet_id: ackExpPetItemId
                };
            }
            else
                return null;
        }
        if (petItemId && (nUpgradeLevelDetected > 0)) {
            const savedPetId = InventoryAPI.RestorePetItemData();
            return {
                title: "#pet_upgrade_notification_title",
                msg: "#pet_upgrade_notification_msg",
                color_class: "NotificationGreen",
                callback: () => {
                    _m_bHasPopupNotification = false;
                    if (_m_petEventCache && _m_petEventCache.petItemId === petItemId
                        && nUpgradeLevelDetected > _m_petEventCache.nLastKnownUpgradeLevel)
                        _m_petEventCache.nLastKnownUpgradeLevel = nUpgradeLevelDetected;
                },
                html: false,
                rental_id: "",
                pet_id: petItemId + ',' + savedPetId,
            };
        }
        return null;
    }
    let _m_bCheckHasLowAvailableVirtualMemory = true;
    let _m_bCheckHasInsufficientPagefile = true;
    function _GetPopupNotification() {
        const popupNotification = {
            title: "",
            msg: "",
            color_class: "NotificationYellow",
            callback: () => { },
            html: false,
            rental_id: "",
        };
        if (_m_bCheckHasLowAvailableVirtualMemory && GameInterfaceAPI.HasLowAvailableVirtualMemory()) {
            popupNotification.title = "#GameUI_SystemInfo_Title";
            popupNotification.msg = $.Localize("#GameUI_SystemInfo_Attention_Low_System_Memory");
            popupNotification.callback = () => {
                _m_bCheckHasLowAvailableVirtualMemory = _m_bHasPopupNotification = false;
                GameInterfaceAPI.Acknowledged_HasLowAvailableVirtualMemory();
            };
            return popupNotification;
        }
        if (_m_bCheckHasInsufficientPagefile && GameInterfaceAPI.HasInsufficientPagefile()) {
            popupNotification.title = "#GameUI_SystemInfo_Title";
            popupNotification.msg = $.Localize("#GameUI_SystemInfo_Attention_LowDiskSpaceForSwapfile");
            popupNotification.callback = () => {
                _m_bCheckHasInsufficientPagefile = _m_bHasPopupNotification = false;
                GameInterfaceAPI.Acknowledged_HasInsufficientPagefile();
            };
            return popupNotification;
        }
        const nBanRemaining = CompetitiveMatchAPI.GetCooldownSecondsRemaining();
        if (nBanRemaining < 0) {
            popupNotification.title = "#SFUI_MainMenu_Competitive_Ban_Confirm_Title";
            popupNotification.msg = $.Localize("#SFUI_CooldownExplanationReason_Expired_Cooldown") + $.Localize(CompetitiveMatchAPI.GetCooldownReason());
            popupNotification.callback = _AcknowledgePenaltyNotificationsCallback;
            popupNotification.html = true;
            return popupNotification;
        }
        const strNotifications = MyPersonaAPI.GetMyNotifications();
        if (strNotifications !== "") {
            const arrayOfNotifications = strNotifications.split(',');
            for (let notificationType of arrayOfNotifications) {
                if (notificationType !== "6") {
                    popupNotification.color_class = 'NotificationBlue';
                }
                popupNotification.title = '#SFUI_PersonaNotification_Title_' + notificationType;
                popupNotification.msg = '#SFUI_PersonaNotification_Msg_' + notificationType;
                popupNotification.callback = _AcknowledgeMsgNotificationsCallback;
            }
            return popupNotification;
        }
        if (MyPersonaAPI.IsConnectedToGC()) {
            const nRentalHistoryCount = InventoryAPI.GetCacheTypeElementsCount('RentalHistory');
            const nCurrentDate = Math.trunc(Date.now() / 1000);
            for (let i = 0; i < nRentalHistoryCount; ++i) {
                const oRentalHistory = InventoryAPI.GetCacheTypeElementJSOByIndex('RentalHistory', i);
                const crateItemId = oRentalHistory.crate_item_id;
                if (oRentalHistory.expiration_date <= nCurrentDate &&
                    !_m_acknowledgedRentalExpirationCrateIds.has(crateItemId)) {
                    _m_acknowledgedRentalExpirationCrateIds.add(crateItemId);
                    const fauxItemId = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(oRentalHistory.crate_def_index, 0);
                    const crateName = InventoryAPI.GetItemName(fauxItemId);
                    const issueDate = InventoryAPI.LocalizeRentalDate(oRentalHistory.issue_date);
                    const expirationDate = InventoryAPI.LocalizeRentalDate(oRentalHistory.expiration_date);
                    const elContainer = $('#MainMenuContainerPanel');
                    elContainer.SetDialogVariable('rental_expired_crate_name', crateName);
                    elContainer.SetDialogVariable('rental_expired_issue_date', issueDate);
                    elContainer.SetDialogVariable('rental_expired_expiration_date', expirationDate);
                    popupNotification.rental_id = fauxItemId;
                    popupNotification.title = '#RentalExpiredPopupTitle';
                    popupNotification.msg = $.Localize('#RentalExpiredPopupMessage', elContainer);
                    popupNotification.callback = () => {
                        InventoryAPI.AcknowledgeRentalExpiration(crateItemId);
                        _m_bHasPopupNotification = false;
                    };
                    return popupNotification;
                }
            }
        }
        return null;
    }
    function _UpdatePopupnotification() {
        if (!_m_bHasPopupNotification) {
            const popupNotification = _GetPopupNotification();
            if (popupNotification != null) {
                if (popupNotification.rental_id) {
                    const OnCloseRentalExpireNotification = _RegisterPopupNotificationCallback(popupNotification.callback);
                    UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_container_open_confirm.xml', 'action-type=expire'
                        + '&' + 'case=' + popupNotification.rental_id
                        + '&' + 'msg_override=' + popupNotification.msg
                        + '&' + 'callback=' + OnCloseRentalExpireNotification);
                }
                else {
                    const elPopup = UiToolkitAPI.ShowGenericPopupOneOption(popupNotification.title, popupNotification.msg, popupNotification.color_class, '#SFUI_MainMenu_ConfirmBan', popupNotification.callback);
                    if (elPopup) {
                        elPopup.SetPanelEvent('oncancel', () => {
                            $.DispatchEvent('UIPopupButtonClicked', elPopup, '');
                            popupNotification.callback();
                        });
                    }
                    if (popupNotification.html)
                        elPopup.EnableHTML();
                }
                _m_bHasPopupNotification = true;
            }
        }
    }
    function PopUpPetNotification(popupNotification) {
        if (popupNotification != null && popupNotification.pet_id) {
            _m_bHasPopupNotification = true;
            const OnClosePetEventNotification = _RegisterPopupNotificationCallback(popupNotification.callback);
            let Panel = UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_pet_event.xml', 'action-type=expire'
                + '&' + 'title=' + popupNotification.title
                + '&' + 'msg=' + popupNotification.msg
                + '&' + 'pet_id=' + popupNotification.pet_id
                + '&' + 'callback=' + OnClosePetEventNotification
                + '&' + 'ack_exp_pet_id=' + popupNotification.ack_exp_pet_id);
        }
    }
    function _GetNotificationBarData() {
        let aAlerts = [];
        if (LicenseUtil.GetCurrentLicenseRestrictions() === false) {
            const notification = { color_class: "", title: "", tooltip: "", link: "", icon: "" };
            const bIsConnectedToGC = MyPersonaAPI.IsConnectedToGC();
            $('#MainMenuInput').SetHasClass('GameClientConnectingToGC', !bIsConnectedToGC);
            if (bIsConnectedToGC) {
                _m_tLastSeenDisconnectedFromGC = 0;
            }
            else if (!_m_tLastSeenDisconnectedFromGC) {
                _m_tLastSeenDisconnectedFromGC = +new Date();
            }
            else if (Math.abs((+new Date()) - _m_tLastSeenDisconnectedFromGC) > 500) {
                notification.title = $.Localize("#Store_Connecting_ToGc");
                notification.tooltip = $.Localize("#Store_Connecting_ToGc_Tooltip");
                notification.color_class = "";
                notification.icon = "gc-connecting";
                notification.is_gc_connecting = true;
                aAlerts.push(notification);
            }
        }
        if (NewsAPI.IsNewClientAvailable()) {
            const notification = { color_class: "", title: "", tooltip: "", link: "", icon: "" };
            notification.color_class = "yellow-alert";
            notification.icon = "client_update";
            notification.title = $.Localize("#SFUI_MainMenu_Outofdate_Title");
            notification.tooltip = $.Localize("#SFUI_MainMenu_Outofdate_Body");
            aAlerts.push(notification);
        }
        const nIsVacBanned = MyPersonaAPI.IsVacBanned();
        if (nIsVacBanned != 0) {
            const notification = { color_class: "", title: "", tooltip: "", link: "", icon: "" };
            notification.color_class = "red-alert";
            notification.icon = "ban_global";
            if ((nIsVacBanned & 1) == 1) {
                notification.title = $.Localize("#SFUI_MainMenu_Vac_Title");
                notification.tooltip = $.Localize("#SFUI_MainMenu_Vac_Info");
                notification.link = "https://help.steampowered.com/faqs/view/647C-5CC1-7EA9-3C29";
            }
            else if ((nIsVacBanned & 4) == 4) {
                notification.title = $.Localize("#SFUI_MainMenu_AccountLocked_Title");
                notification.tooltip = $.Localize("#SFUI_MainMenu_AccountLocked_Info");
                notification.link = "https://help.steampowered.com/en/faqs/view/4F62-35F9-F395-5C23";
            }
            else {
                notification.title = $.Localize("#SFUI_MainMenu_GameBan_Title");
                notification.tooltip = $.Localize("#SFUI_MainMenu_GameBan_Info");
                notification.link = "https://help.steampowered.com/faqs/view/4E54-0B96-D0A4-1557";
            }
            aAlerts.push(notification);
        }
        else {
            const nPlayBanGlobalRemaining = MyPersonaAPI.GetPlayBanSecondsRemaining();
            if (nPlayBanGlobalRemaining > 0) {
                const notification = { color_class: "", title: "", tooltip: "", link: "", icon: "" };
                notification.tooltip = $.Localize("#CSGO_Purchasable_Game_License_BannedInChina");
                notification.title = $.Localize("#SFUI_MainMenu_GameBan_Title") + ' ' + FormatText.SecondsToSignificantTimeString(nPlayBanGlobalRemaining);
                notification.color_class = "red-alert";
                notification.icon = "ban_global";
                aAlerts.push(notification);
            }
            else {
                const nBanRemaining = CompetitiveMatchAPI.GetCooldownSecondsRemaining();
                if (nBanRemaining > 0) {
                    const notification = { color_class: "", title: "", tooltip: "", link: "", icon: "" };
                    notification.tooltip = CompetitiveMatchAPI.GetCooldownReason();
                    const strType = CompetitiveMatchAPI.GetCooldownType();
                    if (strType == "global") {
                        notification.title = $.Localize("#SFUI_MainMenu_Global_Ban_Title");
                        notification.color_class = "yellow-alert";
                        notification.icon = "ban_competitive";
                    }
                    else if (strType == "green") {
                        notification.title = $.Localize("#SFUI_MainMenu_Temporary_Ban_Title");
                        notification.color_class = "yellow-alert";
                        notification.icon = "ban_competitive";
                    }
                    else if (strType == "competitive") {
                        notification.title = $.Localize("#SFUI_MainMenu_Competitive_Ban_Title");
                        notification.color_class = "yellow-alert";
                        notification.icon = "ban_competitive";
                    }
                    if (!CompetitiveMatchAPI.CooldownIsPermanent()) {
                        const title = notification.title;
                        if (CompetitiveMatchAPI.ShowFairPlayGuidelinesForCooldown()) {
                            notification.link = "https://blog.counter-strike.net/index.php/fair-play-guidelines/";
                        }
                        notification.title = title + ' ' + FormatText.SecondsToSignificantTimeString(nBanRemaining);
                    }
                    aAlerts.push(notification);
                }
            }
        }
        const nCommsMuteRemaining = MyPersonaAPI.GetCommunicationsBanSecondsRemaining();
        if (nCommsMuteRemaining > 0) {
            const notification = { color_class: "", title: "", tooltip: "", link: "", icon: "" };
            notification.tooltip = $.Localize("#GameUI_AccountInfo_CommsBanNagYouIngame");
            notification.title = $.Localize("#tooltip_cannot_unmute") + ' ' + FormatText.SecondsToSignificantTimeString(nCommsMuteRemaining);
            notification.color_class = "yellow-alert";
            notification.icon = "message";
            aAlerts.push(notification);
        }
        const strNotification = MyPersonaAPI.GetTradeBanNotification();
        if (strNotification) {
            const notification = { color_class: "", title: "", tooltip: "", link: "", icon: "" };
            notification.color_class = "yellow-alert";
            notification.icon = "ban_trade";
            const idxspace = strNotification.indexOf(' ', 60);
            notification.title = (idxspace > 0)
                ? strNotification.substring(0, idxspace) + '...'
                : $.Localize('#SFUI_LoginPerfectWorld_Title_Info');
            notification.tooltip = strNotification;
            aAlerts.push(notification);
        }
        return aAlerts;
    }
    function _UpdateNotificationBar() {
        const aNotifications = _GetNotificationBarData();
        _m_elNotificationsContainer.Children().forEach(icon => {
            if (icon && icon.IsValid()) {
                icon.SetHasClass('show', false);
            }
        });
        if (aNotifications?.length < 1) {
            _m_elNotificationsContainer.SetHasClass('show', false);
            return;
        }
        _m_elNotificationsContainer.SetHasClass('show', true);
        aNotifications.forEach(notification => {
            let oNotification = notification;
            let elIcon = _m_elNotificationsContainer.FindChildInLayoutFile('id-alert-navbar-' + oNotification.icon);
            if (oNotification.is_gc_connecting && elIcon) {
                elIcon.SetHasClass('show', true);
            }
            else {
                if (!elIcon) {
                    elIcon = $.CreatePanel(('Image'), _m_elNotificationsContainer, 'id-alert-navbar-' + oNotification.icon, { class: 'mainmenu-top-navbar__radio-btn__icon mainmenu-top-navbar__alerts-icon',
                        src: 'file://{images}/icons/ui/' + oNotification.icon + '.svg'
                    });
                }
                elIcon.SwitchClass('alert-color', oNotification.color_class);
                elIcon.SetHasClass('show', true);
            }
            elIcon.SetPanelEvent('onactivate', () => {
                let gc = oNotification.is_gc_connecting === true ? 'true' : 'false';
                let elContextMenu = UiToolkitAPI.ShowCustomLayoutContextMenuParameters('', '', 'file://{resources}/layout/context_menus/context_menu_navbar_notification.xml', 'icon=' + oNotification.icon + '&' +
                    'color=' + oNotification.color_class + '&' +
                    'title=' + oNotification.title + '&' +
                    'tooltip=' + oNotification.tooltip + '&' +
                    'link=' + oNotification.link + '&' +
                    'gcconnecting=' + gc);
                elContextMenu.AddClass("ContextMenu_NoArrow");
                elContextMenu.SetFocus();
            });
            elIcon.SetPanelEvent('onmouseover', () => {
                UiToolkitAPI.ShowTitleTextTooltip('id-alert-navbar-' + oNotification.icon, oNotification.title, oNotification.tooltip);
            });
            elIcon.SetPanelEvent('onmouseout', () => { UiToolkitAPI.HideTitleTextTooltip(); });
        });
    }
    function _UpdateNotifications() {
        if (_m_notificationSchedule == false) {
            _LoopUpdateNotifications();
        }
    }
    function _UpdatePetNotification() {
        if (GameStateAPI.IsLocalPlayerPlayingMatch())
            return;
        const elPopups = $('#PopupManager');
        if (elPopups && elPopups.BHasClass('HaveActivePopups'))
            return;
        const petNotification = GetPetPopupNotification();
        if (petNotification) {
            PopUpPetNotification(petNotification);
        }
    }
    function _LoopUpdateNotifications() {
        _UpdatePopupnotification();
        _UpdateNotificationBar();
        const REDEMPTION_ENABLED = true;
        if (REDEMPTION_ENABLED) {
            _CheckRankUpRedemptionStore();
        }
        _CheckMajorStoreBalance();
        _UpdatePetNotification();
        _m_notificationSchedule = $.Schedule(1, _LoopUpdateNotifications);
    }
    let _m_acknowledgePopupHandler = null;
    function _ShowAcknowledgePopup(type = '', itemid = '') {
        if (type === 'xpgrant') {
            UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_acknowledge_xpgrant.xml', 'none');
            $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.inventory_new_item', 'MOUSE');
            return;
        }
        let updatedItemTypeAndItemid = '';
        if (itemid && type)
            updatedItemTypeAndItemid = 'ackitemid=' + itemid + '&acktype=' + type;
        if (!_m_acknowledgePopupHandler) {
            let jsPopupCallbackHandle;
            jsPopupCallbackHandle = UiToolkitAPI.RegisterJSCallback(_ResetAcknowlegeHandler);
            _m_acknowledgePopupHandler = UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_acknowledge_item.xml', updatedItemTypeAndItemid + '&callback=' + jsPopupCallbackHandle);
            $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.inventory_new_item', 'MOUSE');
        }
    }
    function _ResetAcknowlegeHandler() {
        _m_acknowledgePopupHandler = null;
    }
    function ShowVote() {
        const contextMenuPanel = UiToolkitAPI.ShowCustomLayoutContextMenuParametersDismissEvent('MainMenuNavBarVote', '', 'file://{resources}/layout/context_menus/context_menu_vote.xml', '', () => { });
        contextMenuPanel.AddClass("ContextMenu_NoArrow");
    }
    MainMenu.ShowVote = ShowVote;
    function _HasStoreStatusPanelTrapPopups() {
        let elStorePanels = $.GetContextPanel().FindChildInLayoutFile('PopupManager').
            Children().filter(panel => panel.BHasClass('ShowStoreStatusPanelHandler'));
        return (elStorePanels && (elStorePanels.length > 0));
    }
    function _HideStoreStatusPanelInternal() {
        if (_m_storePopupElement && _m_storePopupElement.IsValid()) {
            _m_storePopupElement.DeleteAsync(0);
        }
        _m_storePopupElement = null;
    }
    function _HideStoreStatusPanel() {
        if (_HasStoreStatusPanelTrapPopups())
            return;
        _HideStoreStatusPanelInternal();
    }
    function _ShowStoreStatusPanel(strText, bAllowClose, bCancel, strOkCmd) {
        _HideStoreStatusPanelInternal();
        let paramclose = '0';
        if (bAllowClose) {
            paramclose = '1';
        }
        let paramcancel = '0';
        if (bCancel) {
            paramcancel = '1';
        }
        if (_HasStoreStatusPanelTrapPopups())
            return;
        _m_storePopupElement = UiToolkitAPI.ShowCustomLayoutPopupParameters('store_popup', 'file://{resources}/layout/popups/popup_store_status.xml', 'text=' + strText +
            '&' + 'allowclose=' + paramclose +
            '&' + 'cancel=' + paramcancel +
            '&' + 'okcmd=' + strOkCmd);
    }
    function _DeletePauseMenuMissionPanel() {
        if ($.GetContextPanel().FindChildInLayoutFile('JsActiveMission')) {
            $.GetContextPanel().FindChildInLayoutFile('JsActiveMission').DeleteAsync(0.0);
        }
    }
    function _SlideSearchPartyParticles(bSlidout) {
        const particle_container = $('#party-search-particles');
        particle_container.SetHasClass("mainmenu-party-search-particle--slide-out", bSlidout);
        particle_container.SetControlPoint(3, 0, 0, 0);
        particle_container.SetControlPoint(3, 1, 0, 0);
    }
    function _OnGcHelloReceived() {
        _CheckPopupNotificationsAtLogon();
        _UpdateUnlockCompAlert();
        VacNetAPI.UpdateReviewerInfo();
    }
    function _OnReviewInfoRecieved(bHasAccess) {
        $.GetContextPanel().SetHasClass('show-vacnet-link', bHasAccess);
    }
    function _UpdateUnlockCompAlert() {
        const btn = $.GetContextPanel().FindChildInLayoutFile('MainMenuNavBarPlay');
        const alert = btn.FindChildInLayoutFile('MainMenuPlayAlert');
        alert.SetDialogVariable("alert_value", $.Localize("#Store_Price_New"));
        if (!MyPersonaAPI.IsConnectedToGC()) {
            alert.AddClass('hidden');
            return;
        }
        const bHide = GameInterfaceAPI.GetSettingString('ui_show_unlock_competitive_alert') === '1' ||
            MyPersonaAPI.HasPrestige() ||
            MyPersonaAPI.GetCurrentLevel() !== 2;
        alert.SetHasClass('hidden', bHide);
    }
    function _SwitchVanity(team) {
        $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.generic_button_press', 'MOUSE');
        GameInterfaceAPI.SetSettingString('ui_vanitysetting_team', team);
        _ForceRestartVanity();
    }
    function _GoToCharacterLoadout(team) {
        _OpenInventory();
        let teamName = ((team == '2') ? 't' : 'ct');
        $.DispatchEvent("ShowLoadoutForItem", LoadoutAPI.GetItemID(teamName, 'customplayer'));
    }
    function _OnGoToCharacterLoadoutPressed() {
        if (!MyPersonaAPI.IsInventoryValid() || !MyPersonaAPI.IsConnectedToGC()) {
            UiToolkitAPI.ShowGenericPopupOk($.Localize('#SFUI_SteamConnectionErrorTitle'), $.Localize('#SFUI_Steam_Error_LinkUnexpected'), '', () => { });
            return;
        }
        const team = GameInterfaceAPI.GetSettingString('ui_vanitysetting_team') == 't' ? 2 : 3;
        const elVanityContextMenu = UiToolkitAPI.ShowCustomLayoutContextMenuParametersDismissEvent('id-vanity-contextmenu', '', 'file://{resources}/layout/context_menus/context_menu_mainmenu_vanity.xml', 'type=catagory' +
            '&' + 'team=' + team, () => { });
        elVanityContextMenu.AddClass("ContextMenu_NoArrow");
    }
    function _OnChangeClanTagPressed() {
        if (!MyPersonaAPI.IsInventoryValid() || !MyPersonaAPI.IsConnectedToGC()) {
            UiToolkitAPI.ShowGenericPopupOk($.Localize('#SFUI_SteamConnectionErrorTitle'), $.Localize('#SFUI_Steam_Error_LinkUnexpected'), '', () => { });
            return;
        }
        const elClanTagContextMenu = UiToolkitAPI.ShowCustomLayoutContextMenuParametersDismissEvent('id-vanity-contextmenu-clanchange', '', 'file://{resources}/layout/context_menus/context_menu_clan_tags.xml', '', () => { });
        elClanTagContextMenu.AddClass("ContextMenu_NoArrow");
    }
    function _CheckConnection() {
        if (!MyPersonaAPI.IsConnectedToGC()) {
            if (!_BCheckTabCanBeOpenedRightNow(_m_activeTab)) {
                OnHomeButtonPressed();
            }
        }
    }
    function OnPlayButtonPressed() {
        if (GameTypesAPI.ShouldForceNewUserTraining()) {
            OnHomeButtonPressed();
            _NewUser_ShowForceTrainingPopup();
        }
        else if (GameTypesAPI.ShouldShowNewUserPopup()) {
            OnHomeButtonPressed();
            _NewUser_ShowTrainingCompletePopup();
        }
        else {
            $.DispatchEvent('OpenPlayMenu');
        }
    }
    MainMenu.OnPlayButtonPressed = OnPlayButtonPressed;
    function _NewUser_ShowForceTrainingPopup() {
        UiToolkitAPI.ShowGenericPopupOkCancel('#ForceNewUserTraining_title', '#ForceNewUserTraining_text', '', () => {
            $.DispatchEvent('OpenPlayMenu');
            $.Schedule(0.1, _NewUser_TrainingMatch);
            GameTypesAPI.OnStartForcedNewUserTraining();
        }, () => { });
    }
    function _NewUser_ShowTrainingCompletePopup() {
        UiToolkitAPI.ShowGenericPopupThreeOptions('#PlayMenu_NewUser_title', '#PlayMenu_NewUser_text', '', '#PlayMenu_NewUser_casual', () => {
            GameTypesAPI.DisableNewUserExperience();
            $.DispatchEvent('OpenPlayMenu');
            $.Schedule(0.1, _NewUser_CasualMatchmaking);
        }, '#PlayMenu_NewUser_training', () => {
            $.DispatchEvent('OpenPlayMenu');
            $.Schedule(0.1, _NewUser_TrainingMatch);
        }, '#PlayMenu_NewUser_other', () => {
            GameTypesAPI.DisableNewUserExperience();
            $.DispatchEvent('OpenPlayMenu');
        });
    }
    function _NewUser_TrainingMatch() {
        const settings = {
            update: {
                Options: {
                    action: 'custommatch',
                    server: 'listen',
                },
                Game: {
                    mode: 'new_user_training',
                    type: 'classic',
                    mapgroupname: 'mg_de_dust2',
                    map: 'de_dust2'
                }
            },
            delete: {}
        };
        LobbyAPI.UpdateSessionSettings(settings);
        LobbyAPI.StartMatchmaking('', '', '', '');
    }
    function _NewUser_CasualMatchmaking() {
        const settings = {
            update: {
                Options: {
                    action: 'custommatch',
                    server: 'official',
                },
                Game: {
                    mode: 'casual',
                    mode_ui: 'casual',
                    type: 'classic',
                    gamemodeflags: 0,
                    mapgroupname: 'mg_casualalpha',
                    map: 'de_dust2'
                }
            },
            delete: {}
        };
        LobbyAPI.UpdateSessionSettings(settings);
        LobbyAPI.StartMatchmaking('', '', '', '');
    }
    function _MainInitBackgroundMovie() {
        _UpdateBackgroundMap();
    }
    function _SetPetInteractionEnabled(mapPanel, bEnabled) {
        mapPanel.hittest = bEnabled;
        mapPanel.SetAcceptsInput(bEnabled);
        mapPanel.SetMapEntitiesCanReceiveInput(bEnabled);
    }
    {
        $.LogChannel("p.mainmenu", "LV_DEFAULT", "#aaff80");
        $.RegisterForUnhandledEvent('HideContentPanel', _OnHideContentPanel);
        $.RegisterForUnhandledEvent('SidebarContextMenuActive', _OnSideBarElementContextMenuActive);
        $.RegisterForUnhandledEvent('OpenPlayMenu', _OpenPlayMenu);
        $.RegisterForUnhandledEvent('OpenInventory', _OpenInventory);
        $.RegisterForUnhandledEvent('OpenWatchMenu', _OpenWatchMenu);
        $.RegisterForUnhandledEvent('OpenStatsMenu', _OpenStatsMenu);
        $.RegisterForUnhandledEvent('OpenSettingsMenu', _OpenSettingsMenu);
        $.RegisterForUnhandledEvent('OpenSubscriptionUpsell', _OpenSubscriptionUpsell);
        $.RegisterForUnhandledEvent('CSGOShowMainMenu', _OnShowMainMenu);
        $.RegisterForUnhandledEvent('CSGOHideMainMenu', _OnHideMainMenu);
        $.RegisterForUnhandledEvent('CSGOShowPauseMenu', _OnShowPauseMenu);
        $.RegisterForUnhandledEvent('CSGOHidePauseMenu', _OnHidePauseMenu);
        $.RegisterForUnhandledEvent('OpenSidebarPanel', ExpandSidebar);
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_GameMustExitNowForAntiAddiction', _GameMustExitNowForAntiAddiction);
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_GcLogonNotificationReceived', _GcLogonNotificationReceived);
        $.RegisterForUnhandledEvent('PanoramaComponent_GC_Hello', _OnGcHelloReceived);
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', _InventoryUpdated);
        $.RegisterForUnhandledEvent('InventoryItemPreview', _OnInventoryInspect);
        $.RegisterForUnhandledEvent('ShowCustomLayoutPopupParametersAsEvent', _OnShowCustomLayoutPopupParametersAsEvent);
        $.RegisterForUnhandledEvent('LootlistItemPreview', _OnLootlistItemPreview);
        $.RegisterForUnhandledEvent('ShowXrayCasePopup', _OnShowXrayCasePopup);
        $.RegisterForUnhandledEvent('PanoramaComponent_Inventory_WeaponPreviewRequest', _WeaponPreviewRequest);
        $.RegisterForUnhandledEvent('PanoramaComponent_Overwatch_CaseUpdated', _UpdateOverwatch);
        $.RegisterForUnhandledEvent('PanoramaComponent_Inventory_SelectItemForWorkshopPreviewCapability', _SelectItemForWorkshopPreviewCapability);
        $.RegisterForUnhandledEvent("PanoramaComponent_TournamentMatch_DraftUpdate", _TournamentDraftUpdate);
        $.RegisterForUnhandledEvent('ShowLoadoutForItem', _ShowLoadoutForItem);
        $.RegisterForUnhandledEvent('ShowAcknowledgePopup', _ShowAcknowledgePopup);
        $.RegisterForUnhandledEvent('ShowStoreStatusPanel', _ShowStoreStatusPanel);
        $.RegisterForUnhandledEvent('HideStoreStatusPanel', _HideStoreStatusPanel);
        $.RegisterForUnhandledEvent('MainMenu_OnGoToCharacterLoadoutPressed', _OnGoToCharacterLoadoutPressed);
        $.RegisterForUnhandledEvent('MainMenu_OnChangeClanTagPressed', _OnChangeClanTagPressed);
        $.RegisterForUnhandledEvent("PanoramaComponent_EmbeddedStream_VideoPlaying", _OnSteamIsPlaying);
        $.RegisterForUnhandledEvent("StreamPanelClosed", _ResetNewsEntryStyle);
        $.RegisterForUnhandledEvent("HideMainMenuNewsPanel", _HideMainMenuNewsPanel);
        $.RegisterForUnhandledEvent("CSGOMainInitBackgroundMovie", _MainInitBackgroundMovie);
        $.RegisterForUnhandledEvent("MainMenuGoToSettings", _OpenSettings);
        $.RegisterForUnhandledEvent("MainMenuGoToStore", _OpenFullscreenStore);
        $.RegisterForUnhandledEvent("MainMenuGoToCharacterLoadout", _GoToCharacterLoadout);
        $.RegisterForUnhandledEvent("PanoramaComponent_PartyList_PlayerActivityVoice", _PlayerActivityVoice);
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_UpdateConnectionToGC', _CheckConnection);
        MinimizeSidebar();
        _InitVanity();
        MinimizeSidebar();
        _InitFriendsList();
        $.RegisterForUnhandledEvent('CSGOMainMenuEscapeKeyPressed', OnEscapeKeyPressed);
        $.RegisterForUnhandledEvent('PanoramaComponent_GC_Hello', _UpdateLocalPlayerVanity);
        $.RegisterForUnhandledEvent('PanoramaComponent_FriendsList_ProfileUpdated', _UpdateLocalPlayerVanity);
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_PipRankUpdate', _UpdateLocalPlayerVanity);
        $.RegisterForUnhandledEvent('PanoramaComponent_FriendsList_NameChanged', _UpdateLocalPlayerVanity);
        $.RegisterForUnhandledEvent('ShowFullScreenOpaquePopup', _OnShowFullScreenOpaquePopup);
        $.RegisterForUnhandledEvent('CloseAllFullScreenOpaquePopups', _OnCloseAllFullScreenOpaquePopups);
        $.RegisterForUnhandledEvent("CSGOWorkshopAnnotationSubscriptionsChanged", () => _SetupAnnotationOptions(true));
        $.RegisterForUnhandledEvent('VacNet_OnReviewerInfoReceived', _OnReviewInfoRecieved);
    }
})(MainMenu || (MainMenu = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbm1lbnUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9tYWlubWVudS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBQ2xDLGlEQUFpRDtBQUNqRCw4Q0FBOEM7QUFDOUMsb0RBQW9EO0FBQ3BELHlEQUF5RDtBQUN6RCxnREFBZ0Q7QUFDaEQsbUNBQW1DO0FBQ25DLGtDQUFrQztBQUNsQyw4Q0FBOEM7QUFDOUMsMkNBQTJDO0FBQzNDLDZDQUE2QztBQUM3Qyx5REFBeUQ7QUFDekQsMkVBQTJFO0FBRTNFLENBQUMsQ0FBQyxVQUFVLENBQUUsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBS3RDLElBQVUsUUFBUSxDQXVrR2pCO0FBdmtHRCxXQUFVLFFBQVE7SUFFakIsTUFBTSxnQkFBZ0IsR0FBRyxDQUFFLFlBQVksQ0FBQyxlQUFlLEVBQUUsS0FBSyxjQUFjLENBQUUsQ0FBQztJQUMvRSxJQUFJLFlBQVksR0FBa0IsSUFBSSxDQUFDO0lBQ3ZDLElBQUksa0NBQWtDLEdBQUcsS0FBSyxDQUFDO0lBQy9DLE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxDQUFFLG9CQUFvQixDQUFHLENBQUM7SUFDckQsSUFBSSxxQkFBcUIsR0FBRyxLQUFLLENBQUM7SUFDbEMsTUFBTSwyQkFBMkIsR0FBRyxDQUFDLENBQUM7SUFDdEMsSUFBSSxtQkFBbUIsR0FBaUIsSUFBSSxDQUFDO0lBRzdDLE1BQU0sMkJBQTJCLEdBQUcsQ0FBQyxDQUFFLDZCQUE2QixDQUFHLENBQUM7SUFDeEUsSUFBSSx1QkFBdUIsR0FBbUIsS0FBSyxDQUFDO0lBQ3BELElBQUksaUNBQWlDLEdBQUcsS0FBSyxDQUFDO0lBQzlDLElBQUksd0JBQXdCLEdBQUcsS0FBSyxDQUFDO0lBQ3JDLElBQUksa0NBQWtDLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDNUMsSUFBSSw0QkFBNEIsR0FBRyxLQUFL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