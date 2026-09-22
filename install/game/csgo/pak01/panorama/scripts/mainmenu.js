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
        elPanel.FireEntityInput('nest', 'Disable');
        _m_nPetUpgradeLevel = null;
        UpdatePetInfoPanel(elPanel, '0');
    }
    function _ShowPetEntities(elPanel, petItemId) {
        elPanel.FireEntityInput('nest', 'Disable');
        _m_nPetUpgradeLevel = Number(InventoryAPI.GetItemAttributeValue(petItemId, '{uint32}upgrade level'));
        UpdatePetInfoPanel(elPanel, petItemId);
        const bPetCanWalkAround = (_m_nPetUpgradeLevel && (_m_nPetUpgradeLevel > 0));
        if (!bPetCanWalkAround)
            elPanel.FireEntityInput('nest', 'Enable');
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
        UiToolkitAPI.CloseAllVisiblePopups();
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
            const RankUpRedemptionStoreClosedCallbackHandle = UiToolkitAPI.RegisterJSCallback(_OnRankUpRedemptionStoreClosed);
            let elPopupPanel = UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_rankup_redemption_store.xml', 'callback=' + RankUpRedemptionStoreClosedCallbackHandle);
            elPopupPanel.Data().elMainMenu = $.GetContextPanel();
        }
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
        UiToolkitAPI.CloseAllVisiblePopups();
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
        UiToolkitAPI.CloseAllVisiblePopups();
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
                    const OnCloseRentalExpireNotification = UiToolkitAPI.RegisterJSCallback(popupNotification.callback);
                    UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_container_open_confirm.xml', 'action-type=expire'
                        + '&' + 'case=' + popupNotification.rental_id
                        + '&' + 'msg_override=' + popupNotification.msg
                        + '&' + 'callback=' + OnCloseRentalExpireNotification);
                }
                else {
                    const elPopup = UiToolkitAPI.ShowGenericPopupOneOption(popupNotification.title, popupNotification.msg, popupNotification.color_class, '#SFUI_MainMenu_ConfirmBan', popupNotification.callback);
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
            const OnClosePetEventNotification = UiToolkitAPI.RegisterJSCallback(popupNotification.callback);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbm1lbnUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9tYWlubWVudS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBQ2xDLGlEQUFpRDtBQUNqRCw4Q0FBOEM7QUFDOUMsb0RBQW9EO0FBQ3BELHlEQUF5RDtBQUN6RCxnREFBZ0Q7QUFDaEQsbUNBQW1DO0FBQ25DLGtDQUFrQztBQUNsQyw4Q0FBOEM7QUFDOUMsMkNBQTJDO0FBQzNDLDZDQUE2QztBQUM3Qyx5REFBeUQ7QUFFekQsQ0FBQyxDQUFDLFVBQVUsQ0FBRSxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFLdEMsSUFBVSxRQUFRLENBdS9GakI7QUF2L0ZELFdBQVUsUUFBUTtJQUVqQixNQUFNLGdCQUFnQixHQUFHLENBQUUsWUFBWSxDQUFDLGVBQWUsRUFBRSxLQUFLLGNBQWMsQ0FBRSxDQUFDO0lBQy9FLElBQUksWUFBWSxHQUFrQixJQUFJLENBQUM7SUFDdkMsSUFBSSxrQ0FBa0MsR0FBRyxLQUFLLENBQUM7SUFDL0MsTUFBTSxpQkFBaUIsR0FBRyxDQUFDLENBQUUsb0JBQW9CLENBQUcsQ0FBQztJQUNyRCxJQUFJLHFCQUFxQixHQUFHLEtBQUssQ0FBQztJQUNsQyxNQUFNLDJCQUEyQixHQUFHLENBQUMsQ0FBQztJQUN0QyxJQUFJLG1CQUFtQixHQUFpQixJQUFJLENBQUM7SUFHN0MsTUFBTSwyQkFBMkIsR0FBRyxDQUFDLENBQUUsNkJBQTZCLENBQUcsQ0FBQztJQUN4RSxJQUFJLHVCQUF1QixHQUFtQixLQUFLLENBQUM7SUFDcEQsSUFBSSxpQ0FBaUMsR0FBRyxLQUFLLENBQUM7SUFDOUMsSUFBSSx3QkFBd0IsR0FBRyxLQUFLLENBQUM7SUFDckMsSUFBSSw4QkFBOEIsR0FBRyxDQUFDLENBQUM7SUFDdkMsTUFBTSw4QkFBOEIsR0FBRztRQUN0QyxpQkFBaUIsRUFBRSxvQkFB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