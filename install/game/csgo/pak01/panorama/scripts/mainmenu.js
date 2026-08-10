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
    function _msg(text, ...args) {
    }
    function UpdateSettingsMenuAlert() {
        let elNewSettingsAlert = $("#MainMenuSettingsAlert");
        if (elNewSettingsAlert) {
            let nNewSettings = PromotedSettingsUtil.GetUnacknowledgedPromotedSettings().length;
            elNewSettingsAlert.SetHasClass("has-new-settings", nNewSettings > 0);
            elNewSettingsAlert.SetDialogVariable("num_settings", nNewSettings.toString());
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
        _msg("---- fetching tournament data");
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
        _msg('backgroundMap: ' + backgroundMap);
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
        _msg("JS: Game Must Exit Now Dialog Displayed: " + _m_panelGameMustExitDialog);
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
        _msg("Hide main menu");
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
            _msg('Created Panel with id: ' + newPanel.id);
            newPanel.BLoadLayout('file://{resources}/layout/' + XmlName + '.xml', false, false);
            newPanel.SetReadyForDisplay(false);
            newPanel.RegisterForReadyEvents(true);
            $.RegisterEventHandler('PropertyTransitionEnd', newPanel, (panel, propertyName) => {
                if (newPanel.id === panel.id && propertyName === 'opacity') {
                    if (newPanel.visible === true && newPanel.BIsTransparent()) {
                        newPanel.SetReadyForDisplay(false);
                        newPanel.visible = false;
                        _msg('HidePanel: ' + newPanel.id);
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
        _msg('tabToShow: ' + tab + ' XmlName = ' + XmlName);
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
            _msg('ShowPanel: ' + _m_activeTab);
        }
        _ShowContentPanel();
    }
    MainMenu.NavigateToTab = NavigateToTab;
    function _ShowContentPanel() {
        if (_m_elContentPanel.BHasClass('mainmenu-content--offscreen')) {
            _m_elContentPanel.AddClass('mainmenu-content--animate');
            _m_elContentPanel.RemoveClass('mainmenu-content--offscreen');
            _m_elContentPanel.SetFocus();
        }
        $.GetContextPanel().AddClass("mainmenu-content--open");
        $.DispatchEvent('ShowContentPanel');
        _DimMainMenuBackground(false);
        _HideFloatingPanels();
    }
    function _OnHideContentPanel() {
        _m_elContentPanel.AddClass('mainmenu-content--animate');
        _m_elContentPanel.AddClass('mainmenu-content--offscreen');
        $.GetContextPanel().RemoveClass("mainmenu-content--open");
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
        _msg("_OnShowFullScreenOpaquePopup");
        $('#MainMenuInput').SetHasClass('HiddenByPopup', true);
    }
    function _OnCloseAllFullScreenOpaquePopups() {
        _msg("_OnCloseAllFullScreenOpaquePopups");
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
        _msg('_ForceRestartVanity');
    }
    let m_aDisplayLobbyVanityData = [];
    function _InitVanity() {
        if (MatchStatsAPI.GetUiExperienceType()) {
            return;
        }
        _msg("_InitVanity: called");
        if (!MyPersonaAPI.IsInventoryValid()) {
            _msg("_InitVanity: inventory not valid yet");
            if (MyPersonaAPI.GetClientLogonFatalError()) {
                _ShowVanity();
            }
            return;
        }
        if (_m_bVanityAnimationAlreadyStarted) {
            _msg("_InitVanity: vanity animation already started, not restarting");
            return;
        }
        _ShowVanity();
    }
    function _ShowVanity() {
        const vanityPanel = $('#JsMainmenu_Vanity');
        if (!vanityPanel) {
            _msg("_InitVanity: failed to find panel 'JsMainmenu_Vanity'");
            return;
        }
        _msg("_InitVanity: kicking off character animation");
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
        PartyListAPI.SetLocalPlayerVanityPresence(oSettings.team, oSettings.charItemId, oSettings.glovesItemId, oSettings.loadoutSlot, oSettings.weaponItemId);
    }
    function _UpdatePlayerVanityModel(oSettings) {
        const vanityPanel = _UpdateBackgroundMap();
        vanityPanel.SetActiveCharacter(oSettings.playeridx);
        oSettings.panel = vanityPanel;
        _msg("_InitVanity: successfully parsed vanity info: " + oSettings);
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
            _msg('NEW LOBBY_DATA' + JSON.stringify(aCurrentLobbyVanityData));
            _msg('OLD DISPLAY_DATA' + JSON.stringify(m_aDisplayLobbyVanityData));
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
        _msg('NEW DISPLAY_DATA' + JSON.stringify(m_aDisplayLobbyVanityData));
    }
    function _ClearLobbyPlayers() {
        for (let i = 0; i < m_aDisplayLobbyVanityData.length; ++i) {
            _ClearLobbyVanityModel(i);
        }
        _msg('DELETED DISPLAY_DATA' + JSON.stringify(m_aDisplayLobbyVanityData));
        m_aDisplayLobbyVanityData = [];
    }
    function _ClearLobbyVanityModel(index) {
        VanityPlayerInfo.DeleteVanityInfoPanel($.GetContextPanel().FindChildInLayoutFile('MainMenuVanityInfo'), index);
        _msg('CLEAR VANITY MODEL INDEX: ' + index);
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
                    const oPanelPos = elVanityPanel.GetBonePositionInPanelSpace('pelvis');
                    oPanelPos.y -= 0.0;
                    VanityPlayerInfo.SetVanityInfoPanelPos(elVanityPlayerInfoParent, i, oPanelPos, "id-player-vanity-info-" + i);
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
        _ForceRestartVanity();
        if (GameStateAPI.IsLocalPlayerPlayingMatch()) {
            return;
        }
        _UpdateInventoryBtnAlert();
        _UpdateStoreAlert();
        _msg('__InventoryUpdated');
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
            UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_rankup_redemption_store.xml', 'callback=' + RankUpRedemptionStoreClosedCallbackHandle);
        }
    }
    function _OnRankUpRedemptionStoreClosed() {
        _m_bHasPopupNotification = false;
        _msg('_OnRankUpRedemptionStoreClosed');
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
        _msg('params: ' + params);
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
        _msg('_UpdateNotifications');
        if (_m_notificationSchedule == false) {
            _LoopUpdateNotifications();
        }
    }
    function _LoopUpdateNotifications() {
        _UpdatePopupnotification();
        _UpdateNotificationBar();
        const REDEMPTION_ENABLED = true;
        if (REDEMPTION_ENABLED) {
            _CheckRankUpRedemptionStore();
        }
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
    }
})(MainMenu || (MainMenu = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbm1lbnUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9tYWlubWVudS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBQ2xDLGlEQUFpRDtBQUNqRCw4Q0FBOEM7QUFDOUMsb0RBQW9EO0FBQ3BELHlEQUF5RDtBQUN6RCxnREFBZ0Q7QUFDaEQsbUNBQW1DO0FBQ25DLGtDQUFrQztBQUNsQyw4Q0FBOEM7QUFDOUMsMkNBQTJDO0FBQzNDLDZDQUE2QztBQUM3Qyx5REFBeUQ7QUFFekQsQ0FBQyxDQUFDLFVBQVUsQ0FBRSxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFLdEMsSUFBVSxRQUFRLENBMjdGakI7QUEzN0ZELFdBQVUsUUFBUTtJQUVqQixNQUFNLGdCQUFnQixHQUFHLENBQUUsWUFBWSxDQUFDLGVBQWUsRUFBRSxLQUFLLGNBQWMsQ0FBRSxDQUFDO0lBQy9FLElBQUksWUFBWSxHQUFrQixJQUFJLENBQUM7SUFDdkMsSUFBSSxrQ0FBa0MsR0FBRyxLQUFLLENBQUM7SUFDL0MsTUFBTSxpQkFBaUIsR0FBRyxDQUFDLENBQUUsb0JBQW9CLENBQUcsQ0FBQztJQUNyRCxJQUFJLHFCQUFxQixHQUFHLEtBQUssQ0FBQztJQUNsQyxNQUFNLDJCQUEyQixHQUFHLENBQUMsQ0FBQztJQU10QyxNQUFNLDJCQUEyQixHQUFHLENBQUMsQ0FBRSw2QkFBNkIsQ0FBRyxDQUFDO0lBQ3hFLElBQUksdUJBQXVCLEdBQW1CLEtBQUssQ0FBQztJQUNwRCxJQUFJLGlDQUFpQyxHQUFHLEtBQUssQ0FBQztJQUM5QyxJQUFJLHdCQUF3QixHQUFHLEtBQUssQ0FBQztJQUNyQyxJQUFJLDhCQUE4QixHQUFHLENBQUMsQ0FBQztJQUN2QyxNQUFNLDhCQUE4QixHQUFHO1FBQ3RDLGlCQUFpQixFQUFFLG9CQUFvQixFQUFFLG1CQUFtQixFQUFFLHVCQUF1QjtLQUNyRixD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