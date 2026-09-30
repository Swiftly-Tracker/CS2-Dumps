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
//--------------------------------------------------------------------------------------------------
// Header Tab navagation and xml loading
//--------------------------------------------------------------------------------------------------
var MainMenu;
(function (MainMenu) {
    const _m_bPerfectWorld = (MyPersonaAPI.GetLauncherType() === "perfectworld");
    let _m_activeTab = null;
    let _m_sideBarElementContextMenuActive = false;
    const _m_elContentPanel = $('#JsMainMenuContent');
    let _m_playedInitalFadeUp = false;
    const _m_maxMainMenuDisplayAgents = 5;
    let _m_nPetUpgradeLevel = null;
    // notification
    const _m_elNotificationsContainer = $('#id-notifications-container');
    let _m_notificationSchedule = false;
    let _m_bVanityAnimationAlreadyStarted = false;
    let _m_bHasPopupNotification = false;
    let _m_popupNotificationCallbackHandle = -1;
    let _m_bRemindUsersToSpendMajorTokens = false; // set this to true closer to the end of next Major Shop to start reminding users to spend their funds
    let _m_tLastSeenDisconnectedFromGC = 0;
    const _m_NotificationBarColorClasses = [
        "NotificationRed", "NotificationYellow", "NotificationGreen", "NotificationLoggingOn"
    ];
    // on show register events handlers
    let _m_LobbyPlayerUpdatedEventHandler = null;
    let _m_LobbyMatchmakingSessionUpdateEventHandler = null;
    let _m_LobbyForceRestartVanityEventHandler = null;
    let _m_LobbyMainMenuSwitchVanityEventHandler = null;
    // 'UISceneFrameBoundary' register event handler
    let _m_UiSceneFrameBoundaryEventHandler = null;
    let _m_equipSlotChangedHandler = null;
    let _m_storePopupElement = null;
    let m_TournamentPickBanPopup = null;
    let _m_jobFetchTournamentData = null;
    const TOURNAMENT_FETCH_DELAY = 10;
    // Update notification when xml is loaded
    const nNumNewSettings = UpdateSettingsMenuAlert();
    const m_MainMenuTopBarParticleFX = $('#MainMenuNavigateParticles');
    //Create a Table of control point positions
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
            // SetHideTranstionOnLeftColumn();
        }
    }
    function SetHideTranstionOnLeftColumn() {
        const elLeftColumn = $.FindChildInContext('#JsLeftColumn');
        // Handler that catches OnPropertyTransitionEndEvent event for this panel.
        function fnOnPropertyTransitionEndEvent(panel, propertyName) {
            if (elLeftColumn === panel && propertyName === 'opacity') {
                // Panel is visible and fully transparent
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
        $.Msg("[p.mainmenu] ---- fetching tournament data");
        // somehow we got called but a job is already pending. Abort.
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
        // initialize from user preferences (filter func in C++ ensures valid movie name / China / etc.)
        let savedMapName = GameInterfaceAPI.GetSettingString('ui_mainmenu_bkgnd_movie');
        // default to dust 2 is there is nothing set
        let backgroundMap = !savedMapName ? 'de_dust2_vanity' : savedMapName + '_vanity';
        $.Msg('[p.mainmenu] backgroundMap: ' + backgroundMap);
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
            // New map means a new cam_pet, so the framing does not carry over.
            _ResetPetZoom();
        }
        if (m_bRestartBackgroundMapSound) {
            //Play the background map sound with a small delay, to ensure it avoids any stop all sounds event when leaving a match.
            $.Schedule(0.1, function () {
                _PlayBackgroundMapSound(savedMapName);
            });
            m_bRestartBackgroundMapSound = false;
        }
        // Extra lighting for de_nuke_vanity
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
    // Override the cascade 0 split plane distance so that it covers the character, ensuring highest resolution
    // character shadows, even at lowest shadow quality settings.
    // There's a similar setup in inspect.ts, where the values are
    // different to here since the camera and character are placed differently
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
        // override scale depending on map
        if (backgroundMap === 'warehouse_vanity') {
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
    // Slot 0 is the lobby leader (the party list puts the leader first), so its pet is the one shown.
    function _ShowLeaderPet(elMapPanel) {
        const leaderPetItemId = elMapPanel.GetLeaderPetItemId();
        // Single place the zoom is dropped: joining or leaving a party, a kick, a leader change and
        // unequipping all reach here having invalidated it.
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
        // Create pet info panel
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
        // Popups closed with the menu never ran their own teardown, so start from a clean slate.
        GameInterfaceAPI.ResetChickenAudio();
        m_bRestartBackgroundMapSound = true;
        _RegisterOnShowEvents();
        _m_bVanityAnimationAlreadyStarted = false; // make sure we start main character animation
        _LobbyPlayerUpdated();
        _OnInitFadeUp();
        // make sure play button is visible in the mainmenu
        $('#MainMenuNavBarPlay').SetHasClass('pausemenu-navbar__btn-small--hidden', false);
        // only show overwatch nav button if you have a case
        _UpdateOverwatch();
        _UpdateNotifications();
        _UpdateInventoryBtnAlert();
        _UpdateStoreAlert();
        // Trigger one time processing
        _GcLogonNotificationReceived();
        _CheckPopupNotificationsAtLogon();
        //Show hide the unlocked competitive alert on play button
        _UpdateUnlockCompAlert();
        _FetchTournamentData();
        _ShowFloatingPanels();
        $('#MainMenuNavBarHome').checked = true;
        if (GameTypesAPI.ShouldShowNewUserPopup()) {
            _NewUser_ShowTrainingCompletePopup();
        }
        // Pre-load some tabs to make the first transitions to them smoother.
        if (!_m_bPreLoadedTabs) {
            _LoadTab('JsSettings', 'settings/settings');
            // Actually open and quickly switch away from the play menu to
            // make sure all its initial selection animations play offscreen.
            _OpenPlayMenu();
            OnHomeButtonPressed();
            _m_bPreLoadedTabs = true;
        }
        // clear it if we return to main menu
        _ResetAnnotationsDropDown();
        // Adding this to ensure we don't skip intialising the background map (by not making an explicit call to this somewhere else in script)
        // For example, when we're in game and disconnect, going back to main menu.
        // Will (amongst other things), reset
        // *csm split plane 0 distance override
        // *barn light shadow scale override
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
            const refTS = 1695849359; // It's CS2 Birthday!
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
            && (strFatalError !== "ShowGameLicenseNoOnlineLicensePW") // special exception that doesn't show the dialog, but we need to display anti-addiction popup
            && (strFatalError !== "ShowGameLicenseNoOnlineLicense") // special exception that doesn't show the dialog, but we need to display anti-addiction popup
        ) {
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
                // This handles a once on main menu notification from attempting to log in to GC,
                // suppress the dialog in this case because user will be reminded every time they try
                // to do anything for multiplayer
                //// _OnGcLogonNotificationReceived_ShowLicenseYesNoBox( "#SFUI_LoginLicenseAssist_NoOnlineLicense_PW", "https://community.csgo.com.cn/join/pwlink_csgo" );
            }
            else if (strFatalError === "ShowGameLicenseNoOnlineLicense") {
                // This handles a once on main menu notification from attempting to log in to GC,
                // suppress the dialog in this case because user will be reminded every time they try
                // to do anything for multiplayer
                //// _OnGcLogonNotificationReceived_ShowLicenseYesNoBox( "#SFUI_LoginLicenseAssist_NoOnlineLicense", "https://store.steampowered.com/app/730/" );
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
            if (nAntiAddictionTrackingState != 2 /*k_EPerfectWorldAccountState_Addict*/) {
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
        // don't generate another dialog when a previous one is still displayed
        if (_m_panelGameMustExitDialog && _m_panelGameMustExitDialog.IsValid())
            return;
        // don't generate more than a certain number of quit dialogs
        if (_m_numGameMustExitNowForAntiAddictionHandled >= 100)
            return;
        ++_m_numGameMustExitNowForAntiAddictionHandled;
        // generate a dialog and remember a handle to it so that we could avoid generating more
        _m_panelGameMustExitDialog =
            UiToolkitAPI.ShowGenericPopupOneOptionBgStyle("#GameUI_QuitConfirmationTitle", "#UI_AntiAddiction_ExitGameNowMessage", "", "#GameUI_Quit", () => GameInterfaceAPI.ConsoleCommand("quit"), "dim");
        $.Msg("[p.mainmenu] JS: Game Must Exit Now Dialog Displayed: " + _m_panelGameMustExitDialog);
    }
    function _OnGcLogonNotificationReceived_ShowLicenseYesNoBox(strTextMessage, pszOverlayUrlToOpen) {
        UiToolkitAPI.ShowGenericPopupTwoOptionsBgStyle("#CSGO_Purchasable_Game_License_Short", strTextMessage, "", "#UI_Yes", () => SteamOverlayAPI.OpenURL(pszOverlayUrlToOpen), "#UI_No", () => { }, "dim");
    }
    function _OnGcLogonNotificationReceived_ShowFaqCallback() {
        // Show the knowledgebase
        SteamOverlayAPI.OpenURL("https://support.steampowered.com/kb_article.php?ref=6026-IFKZ-7043&l=schinese");
        // Show the message box again in case user gets lost in Steam Overlay
        _m_bGcLogonNotificationReceivedOnce = false;
        _GcLogonNotificationReceived();
    }
    function _OnHideMainMenu() {
        $.Msg("[p.mainmenu] Hide main menu");
        const vanityPanel = $('#JsMainmenu_Vanity');
        if (vanityPanel) {
            CharacterAnims.CancelScheduledAnim(vanityPanel);
        }
        // We are hiding the main menu, so hide the content panel immediately.
        // Otherwise the slide out anim plays the next time the main menu is shown.
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
        // only allow to queue while in game if I'm in a listen server by myself
        // OFFLINE WARMUP: we removed the offline warmup feature, so don't show play button in pause menu for now
        $('#MainMenuNavBarPlay').SetHasClass('pausemenu-navbar__btn-small--hidden', true);
        $('#MainMenuNavBarSwitchTeams').SetHasClass('pausemenu-navbar__btn-small--hidden', (bQueuedMatchmaking || bGotvSpectating));
        // Call vote option is only enables in multiplayer matches
        // Training technically has to be a multiplayer match because scaleform only works in "gametime" and not "realtime"
        // This means we can't make the training single player because it would cause us to "pause" which freezes all scaleform and hence breaks the game
        $('#MainMenuNavBarVote').SetHasClass('pausemenu-navbar__btn-small--hidden', ( /*!bMultiplayer || */bGotvSpectating));
        // Report a community server is only enabled in community server and not GOTV Spectating
        $('#MainMenuNavBarReportServer').SetHasClass('pausemenu-navbar__btn-small--hidden', !bIsCommunityServer);
        // Reset to Home
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
        //Delete pause menu mission panel
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
                //No connection to GC so show a message
                UiToolkitAPI.ShowGenericPopupOk($.Localize('#SFUI_SteamConnectionErrorTitle'), $.Localize('#SFUI_Steam_Error_LinkUnexpected'), '', () => { });
                return false;
            }
        }
        // Otherwise tabs can open
        return true;
    }
    function _LoadTab(tab, XmlName, setActiveSection = '') {
        if (!$.GetContextPanel().FindChildInLayoutFile(tab)) {
            const newPanel = $.CreatePanel('Panel', _m_elContentPanel, tab);
            if (setActiveSection !== '') {
                newPanel.SetAttributeString('set-active-section', setActiveSection);
            }
            $.Msg('[p.mainmenu] Created Panel with id: ' + newPanel.id);
            newPanel.BLoadLayout('file://{resources}/layout/' + XmlName + '.xml', false, false);
            newPanel.SetReadyForDisplay(false); // Start unready to received the first ready for display event
            newPanel.RegisterForReadyEvents(true);
            // Handler that catches OnPropertyTransitionEndEvent event for this panel.
            // Check if the panel is transparent then collapse it.
            $.RegisterEventHandler('PropertyTransitionEnd', newPanel, (panel, propertyName) => {
                if (newPanel.id === panel.id && propertyName === 'opacity') {
                    // Panel is visible and fully transparent
                    if (newPanel.visible === true && newPanel.BIsTransparent()) {
                        // Set visibility to false and unload resources
                        newPanel.SetReadyForDisplay(false);
                        newPanel.visible = false;
                        $.Msg('[p.mainmenu] HidePanel: ' + newPanel.id);
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
        $.Msg('[p.mainmenu] tabToShow: ' + tab + ' XmlName = ' + XmlName);
        if (!_BCheckTabCanBeOpenedRightNow(tab)) {
            OnHomeButtonPressed();
            return; // validate that tabs can be opened (GC connection / China free-to-play / etc.)
        }
        if (tab === 'JsPlayerStats') {
            return;
        }
        $.DispatchEvent('PlayMainMenuMusic', true, false);
        // Turn off ambient sound on movies.
        GameInterfaceAPI.SetSettingString('panorama_play_movie_ambient_sound', '0');
        // Check to see if tab to show exists.
        // If not load the xml file.
        _LoadTab(tab, XmlName, setActiveSection);
        ParticleControls.UpdateMainMenuTopBar(m_MainMenuTopBarParticleFX, tab);
        // If a we have a active tab and it is different from the selected tab hide it.
        // Then show the selected tab
        if (_m_activeTab !== tab) {
            //Trigger sound event for the new panel
            if (XmlName && _m_bPreLoadedTabs) {
                let soundName = '';
                if (XmlName === 'mainmenu_store_fullscreen') {
                    if (setActiveSection !== '') {
                        $.GetContextPanel().FindChildInLayoutFile(tab).SetAttributeString('set-active-section', setActiveSection);
                    }
                    soundName = 'UIPanorama.tab_mainmenu_shop';
                    // Catches if you trade way items or earn more points and we already have made the shop pages,
                    // when we go to the tab we and the Xpshop is visible we update the track progress.
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
            // If the tab exists then hide it
            if (_m_activeTab) {
                $.GetContextPanel().CancelDrag();
                const panelToHide = $.GetContextPanel().FindChildInLayoutFile(_m_activeTab);
                panelToHide.AddClass('mainmenu-content--hidden');
            }
            //Show selected tab
            _m_activeTab = tab;
            const activePanel = $.GetContextPanel().FindChildInLayoutFile(tab);
            activePanel.RemoveClass('mainmenu-content--hidden');
            // Force a reload of any resources since we're about to display the panel
            activePanel.visible = true;
            activePanel.SetReadyForDisplay(true);
            $.Msg('[p.mainmenu] ShowPanel: ' + _m_activeTab);
        }
        _ShowContentPanel();
    }
    MainMenu.NavigateToTab = NavigateToTab;
    // Every content tab covers the vanity chickens, whose soundevents are baked into their animations
    // and so keep playing behind it - panorama has no notion of a panel being covered. No tab is
    // exempt: the loadout's shoulder pet looks like one, but its ACT_SHOULDER clips carry no sound
    // events, and an exemption is global, so claiming one there un-ducks the covered vanity chicken.
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
        // Uncheck the active button in the main menu navbar.
        const elActiveNavBarBtn = _GetActiveNavBarButton();
        if (elActiveNavBarBtn && elActiveNavBarBtn.id !== 'MainMenuNavBarHome') {
            elActiveNavBarBtn.checked = false;
        }
        _DimMainMenuBackground(true);
        // If the tab exists then hide it
        if (_m_activeTab) {
            $.GetContextPanel().CancelDrag();
            const panelToHide = $.GetContextPanel().FindChildInLayoutFile(_m_activeTab);
            panelToHide.AddClass('mainmenu-content--hidden');
        }
        _m_activeTab = '';
        _ShowFloatingPanels();
    }
    function _OnShowFullScreenOpaquePopup() {
        $.Msg("[p.mainmenu] _OnShowFullScreenOpaquePopup");
        // Setting the opacity directly instead of via a class would avoid the perf warning, but using a class makes it clearer in the panorama debugger what's going on.
        //		$('#MainMenuInput')!.style.opacity = '0';
        $('#MainMenuInput').SetHasClass('HiddenByPopup', true);
    }
    function _OnCloseAllFullScreenOpaquePopups() {
        $.Msg("[p.mainmenu] _OnCloseAllFullScreenOpaquePopups");
        //		$('#MainMenuInput')!.style.opacity = '1';
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
    // Sidebar expand and minimize
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
        // #JsMainMenuContent being null implies this call to _MinimizeSidebar is due to onmouseout event
        // being dispatched as part of panel being destroyed on game exit, so just return, otherwise js
        // result is js exceptions
        if (_m_elContentPanel == null) {
            return;
        }
        // If a context menu that is opened from an element is the Sidebar
        // then do not minimize the Sidebar.
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
        // Store state of context menu, open or closed.
        _m_sideBarElementContextMenuActive = bActive;
        // A context menu that is opened from an element is the Sidebar is now closed.
        // We check to see if the curser is outside the bounds of the Sidebar.
        // If it is then we minimze the sidebar.
        // Needs a delayy after the context menu closes to check if the curser is over Sidebar.
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
    //--------------------------------------------------------------------------------------------------
    // Icon buttons functions
    //--------------------------------------------------------------------------------------------------
    function OnHomeButtonPressed() {
        $.DispatchEvent('HideContentPanel');
        ParticleControls.UpdateMainMenuTopBar(m_MainMenuTopBarParticleFX, '');
        // resume main menu character anim/rendering
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
    //--------------------------------------------------------------------------------------------------
    // Set up child panels
    //--------------------------------------------------------------------------------------------------
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
    // Set parnet news panel style to account for playing the stream
    // Will shrink the news and hide the matchlister and featured
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
    //--------------------------------------------------------------------------------------------------
    // Party searching particles
    //--------------------------------------------------------------------------------------------------
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
        //Set the type of effect
        //Gold for premier
        //Green for regular
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
        // ui_mainmenu_active_search.vpcf - Cp 1 ( VERTICAL SPREAD, LifeSpan Scale (0-3), SpeedMult ), Cp 2 ( Radius Scale, Alpha Scale , Desaturation Scale ), Cp 16 ( R, G, B )
        let CpArray = [
            [1, verticlSpread, .5, 1],
            [2, 1, .25, 0],
            [16, 15, 230, 15], //set the color for search
        ];
        _UpdatePartySearchSetControlPointParticles(CpArray);
    }
    //--------------------------------------------------------------------------------------------------
    // Setup player panel
    //--------------------------------------------------------------------------------------------------
    function _ForceRestartVanity() {
        if (GameStateAPI.IsLocalPlayerPlayingMatch()) {
            return;
        }
        _m_bVanityAnimationAlreadyStarted = false;
        _InitVanity();
        $.Msg('[p.mainmenu] _ForceRestartVanity');
    }
    let m_aDisplayLobbyVanityData = [];
    function _InitVanity() {
        if (MatchStatsAPI.GetUiExperienceType()) {
            return;
        }
        $.Msg("[p.mainmenu] _InitVanity: called");
        if (!MyPersonaAPI.IsInventoryValid()) {
            $.Msg("[p.mainmenu] _InitVanity: inventory not valid yet");
            if (MyPersonaAPI.GetClientLogonFatalError()) {
                //Shows default settings vanity since you will not get valid inventory in this state
                _ShowVanity();
            }
            return;
        }
        if (_m_bVanityAnimationAlreadyStarted) {
            $.Msg("[p.mainmenu] _InitVanity: vanity animation already started, not restarting");
            return;
        }
        _ShowVanity();
    }
    function _ShowVanity() {
        const vanityPanel = $('#JsMainmenu_Vanity');
        if (!vanityPanel) {
            $.Msg("[p.mainmenu] _InitVanity: failed to find panel 'JsMainmenu_Vanity'");
            return;
        }
        // Kick off animating character
        $.Msg("[p.mainmenu] _InitVanity: kicking off character animation");
        _m_bVanityAnimationAlreadyStarted = true;
        if (vanityPanel.BHasClass('hidden')) {
            vanityPanel.RemoveClass('hidden');
        }
        _UpdateLocalPlayerVanity();
    }
    function _ShowDebugLobbyModels() {
        //DEVONLY{
        // Force vanity for five players
        for (let i = 0; i < _m_maxMainMenuDisplayAgents; i++) {
            let oSettings = ItemInfo.GetOrUpdateVanityCharacterSettings();
            oSettings.playeridx = i;
            $.Msg('[p.mainmenu] oSettings: ' + i);
            $.Msg('[p.mainmenu] oSettings: ' + oSettings.playeridx);
            oSettings.xuid = MyPersonaAPI.GetXuid();
            oSettings.isLocalPlayer = false;
            _UpdatePlayerVanityModel(oSettings);
            _CreateUpdateVanityInfo(oSettings);
        }
        //}DEVONLY
    }
    function _UpdateLocalPlayerVanity() {
        // Force vanity settings to be processed and validated
        const oSettings = ItemInfo.GetOrUpdateVanityCharacterSettings();
        const oLocalPlayer = m_aDisplayLobbyVanityData.filter(storedEntry => { return storedEntry.isLocalPlayer === true; });
        // local player index is not displayed
        if (oLocalPlayer.length > 0 && (oLocalPlayer[0].playeridx > (_m_maxMainMenuDisplayAgents - 1))) {
            return;
        }
        // See if local player is in a lobby with more that one person
        // then use the lobby position for them otherwise put them in the center 0 position
        oSettings.playeridx = oLocalPlayer.length > 0 ? oLocalPlayer[0].playeridx : 0;
        // stomp these settings
        oSettings.xuid = MyPersonaAPI.GetXuid();
        oSettings.isLocalPlayer = true;
        // Apply vanity settings in the lobby metadata for showing 'self'
        _ApplyVanitySettingsToLobbyMetadata(oSettings);
        _UpdatePlayerVanityModel(oSettings);
        _CreateUpdateVanityInfo(oSettings);
    }
    function _ApplyVanitySettingsToLobbyMetadata(oSettings) {
        // Push vanity settings into the lobby metadata
        PartyListAPI.SetLocalPlayerVanityPresence(oSettings.team, oSettings.charItemId, oSettings.glovesItemId, oSettings.loadoutSlot, oSettings.weaponItemId, oSettings.petItemId);
    }
    function _UpdatePlayerVanityModel(oSettings) {
        const vanityPanel = _UpdateBackgroundMap();
        vanityPanel.SetActiveCharacter(oSettings.playeridx);
        oSettings.panel = vanityPanel;
        $.Msg("[p.mainmenu] _InitVanity: successfully parsed vanity info: " + oSettings);
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
            $.Msg('[p.mainmenu] NEW LOBBY_DATA' + JSON.stringify(aCurrentLobbyVanityData));
            $.Msg('[p.mainmenu] OLD DISPLAY_DATA' + JSON.stringify(m_aDisplayLobbyVanityData));
            _CompareLobbyPlayers(aCurrentLobbyVanityData);
        }
        else {
            _ClearLobbyPlayers();
            _ForceRestartVanity();
        }
    }
    function _CompareLobbyPlayers(aCurrentLobbyVanityData) {
        for (let i = 0; i < _m_maxMainMenuDisplayAgents; i++) {
            // Makes sure we have data for the models before we update.
            if (aCurrentLobbyVanityData[i]) {
                // If there is no data then make an object to hold it.
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
                    // Delete info when xuid changes
                    VanityPlayerInfo.DeleteVanityInfoPanel($.GetContextPanel().FindChildInLayoutFile('MainMenuVanityInfo'), aCurrentLobbyVanityData[i].playeridx);
                    if (aCurrentLobbyVanityData[i].isLocalPlayer) {
                        // up date local player if thier position moves
                        _UpdateLocalPlayerVanity();
                    }
                }
                m_aDisplayLobbyVanityData[i].xuid = aCurrentLobbyVanityData[i].xuid;
                // for all not local players update the vanity model only when the vanity data is different
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
        $.Msg('[p.mainmenu] NEW DISPLAY_DATA' + JSON.stringify(m_aDisplayLobbyVanityData));
    }
    function _ClearLobbyPlayers() {
        // no lobby members so clear any displayed data that we have
        for (let i = 0; i < m_aDisplayLobbyVanityData.length; ++i) {
            _ClearLobbyVanityModel(i);
        }
        $.Msg('[p.mainmenu] DELETED DISPLAY_DATA' + JSON.stringify(m_aDisplayLobbyVanityData));
        m_aDisplayLobbyVanityData = [];
    }
    function _ClearLobbyVanityModel(index) {
        VanityPlayerInfo.DeleteVanityInfoPanel($.GetContextPanel().FindChildInLayoutFile('MainMenuVanityInfo'), index);
        $.Msg('[p.mainmenu] CLEAR VANITY MODEL INDEX: ' + index);
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
            playeridx: index // since player model one is 0 the lobby models start at 1'
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
                // Don't run these checks until we've rendered a solid number of frames.
                // If we try this right when the menu is created, we might come to bad conclusions,
                // e.g. we might think G-Sync isn't working when it is.
                VideoSettingRecommendations.MaybeShowPopup();
                _m_bTriedShowVideoSettingRecommendation = true;
            }
        }
        else {
            _m_nActiveFrameCount = 0;
        }
    }
    function _OpenPlayMenu() {
        // Play menu is not accessible when in the game server
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
        // If the loadout is not created, we will make it when we press the loadout button.
        // Then refire the event after it is made so we can switch to the right item.
        if (!bLoadoutPanelExisted && bLoadoutPanelExists) {
            $.DispatchEvent("ShowLoadoutForItem", itemId);
        }
    }
    function _OpenSettings() {
        // Sending them to KeybdMouseSettings for the keyboard binding update
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
    //--------------------------------------------------------------------------------------------------
    // Update inventory
    //--------------------------------------------------------------------------------------------------
    function _InventoryUpdated() {
        _UpdatePetNotification(); // also checks for IsLocalPlayerPlayingMatch
        // This function already does IsLocalPlayerPlayingMatch() check since it can be call from anywhere
        _ForceRestartVanity();
        if (GameStateAPI.IsLocalPlayerPlayingMatch()) {
            return;
        }
        _UpdateInventoryBtnAlert();
        _UpdateStoreAlert();
        $.Msg('[p.mainmenu] __InventoryUpdated');
    }
    // Popups from the notification loop close through a callback registered here. Each callback frees its
    // own handle when it fires; the one still on screen is tracked so _CloseAllVisiblePopups can free it.
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
    // CloseAllVisiblePopups deletes popups without running their close, so a notification popup's callback
    // never fires. Drop the lock here; anything that wasn't acknowledged is found again by a later loop pass.
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
            elPopupPanel.Data().elMainMenu = $.GetContextPanel(); // allow rankup redemption popup to callback into the main menu panels
        }
    }
    // Once per session, remind players with leftover Major store tokens to spend them
    function _CheckMajorStoreBalance() {
        if (!_m_bRemindUsersToSpendMajorTokens || _m_bHasPopupNotification)
            return;
        if (GameStateAPI.IsLocalPlayerPlayingMatch())
            return;
        if (!$('#MainMenuNavBarHome').checked)
            return;
        // Wait for the menu to clear rather than landing on a popup that doesn't use _m_bHasPopupNotification
        const elPopups = $('#PopupManager');
        if (elPopups && elPopups.BHasClass('HaveActivePopups'))
            return;
        if (!MyPersonaAPI.IsConnectedToGC() || !MyPersonaAPI.IsInventoryValid())
            return;
        _m_bRemindUsersToSpendMajorTokens = false;
        const idxLookup = InventoryAPI.GetCacheTypeElementIndexByKey('SeasonalOperations', g_ActiveTournamentInfo.credits_id);
        if (g_ActiveTournamentInfo.credits_id != InventoryAPI.GetCacheTypeElementFieldByIndex('SeasonalOperations', idxLookup, 'season_value'))
            return;
        // This could come back "undefined" or "null" and should be treated as zero
        const nBalance = InventoryAPI.GetCacheTypeElementFieldByIndex('SeasonalOperations', idxLookup, 'redeemable_balance') ?? 0;
        if (nBalance < 99)
            return;
        _m_bHasPopupNotification = true;
        const closedCallbackHandle = _RegisterPopupNotificationCallback(() => { _m_bHasPopupNotification = false; });
        UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_major_store_balance.xml', 'balance=' + nBalance + '&callback=' + closedCallbackHandle);
    }
    function _OnRankUpRedemptionStoreClosed() {
        _m_bHasPopupNotification = false;
        $.Msg('[p.mainmenu] _OnRankUpRedemptionStoreClosed');
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
        $.Msg(`[p.mainmenu] ShowCustomLayoutPopupParametersAsEvent:: "${dimstyle}", "${xmlname}", "${panelparams}"`);
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
        $.Msg('[p.mainmenu] params: ' + params);
        const ParamsList = params.split(',');
        const caseId = ParamsList[0];
        const lootlistNameOverride = ParamsList[3] && ParamsList[3] !== '' ? ParamsList[3] : 'false';
        JsInspectCallback = UiToolkitAPI.RegisterJSCallback(() => {
            //let idtoUse = storeId ? storeId : caseId;
            //let elPanel = $.GetContextPanel().FindChildInLayoutFile( 'PopupManager' ).FindChildInLayoutFile( 'popup-inspect-' + idtoUse );
            // Do stuff here if needed
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
            return null; // no new pet, no previous pet
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
            // Try sending an ack - now is a good time to show notification to the user
            // if the function returns "true" then this pet has "expired"
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
                $.Msg("[p.mainmenu] PET: detected as EXPIRED! " + _m_petEventCache.petItemId + " " + _m_petEventCache.strExpiryReason);
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
            $.Msg("[p.mainmenu] PET: detected as level-up! " + petItemId);
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
            // Rental expiration.
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
        // if there's no active popup notification, check if we should show one
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
                    // Escape and background clicks close generic popups without running the button callback,
                    // which would skip the acknowledgement and leave _m_bHasPopupNotification stuck
                    if (elPopup) {
                        elPopup.SetPanelEvent('oncancel', () => {
                            $.DispatchEvent('UIPopupButtonClicked', elPopup, '');
                            popupNotification.callback();
                        });
                    }
                    // We control labels for all of these, safe to use html
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
            //
            // Establishing connection to GC spinner - only show it up if the user has no license problems
            //
            const notification = { color_class: "", title: "", tooltip: "", link: "", icon: "" };
            const bIsConnectedToGC = MyPersonaAPI.IsConnectedToGC();
            $('#MainMenuInput').SetHasClass('GameClientConnectingToGC', !bIsConnectedToGC);
            if (bIsConnectedToGC) { // We are connected to GC, no need to track reconnection attempts
                _m_tLastSeenDisconnectedFromGC = 0;
            }
            else if (!_m_tLastSeenDisconnectedFromGC) { // We just got disconnected from GC, start tracking disconnection attempts
                _m_tLastSeenDisconnectedFromGC = +new Date(); // current UTC timestamp in milliseconds (seconds * 1000)
            }
            else if (Math.abs((+new Date()) - _m_tLastSeenDisconnectedFromGC) > 500) { // We have been disconnected for 7+ seconds
                //notification.color_class = "NotificationLoggingOn";
                notification.title = $.Localize("#Store_Connecting_ToGc");
                notification.tooltip = $.Localize("#Store_Connecting_ToGc_Tooltip");
                notification.color_class = "";
                notification.icon = "gc-connecting";
                notification.is_gc_connecting = true;
                // return notification;
                aAlerts.push(notification);
            }
        }
        //
        // Game client out-of-date warning
        //
        if (NewsAPI.IsNewClientAvailable()) {
            const notification = { color_class: "", title: "", tooltip: "", link: "", icon: "" };
            notification.color_class = "yellow-alert";
            notification.icon = "client_update";
            notification.title = $.Localize("#SFUI_MainMenu_Outofdate_Title");
            notification.tooltip = $.Localize("#SFUI_MainMenu_Outofdate_Body");
            aAlerts.push(notification);
        }
        //
        // VAC banned account warning
        //
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
            //
            // China play ban countdown warning
            //
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
                //
                // Competitive cooldown countdown warning
                //
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
                    // add time to title if cooldown expires within 50 days (all permanent cooldowns have 60+ days and don't expire)
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
        //
        // China comms mute countdown warning
        //
        const nCommsMuteRemaining = MyPersonaAPI.GetCommunicationsBanSecondsRemaining();
        if (nCommsMuteRemaining > 0) {
            const notification = { color_class: "", title: "", tooltip: "", link: "", icon: "" };
            notification.tooltip = $.Localize("#GameUI_AccountInfo_CommsBanNagYouIngame");
            notification.title = $.Localize("#tooltip_cannot_unmute") + ' ' + FormatText.SecondsToSignificantTimeString(nCommsMuteRemaining);
            notification.color_class = "yellow-alert";
            notification.icon = "message";
            aAlerts.push(notification);
        }
        //
        // Trade ban notification
        //
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
        // hide the icons so that we only show the active ones.
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
        $.Msg('[p.mainmenu] _UpdateNotifications');
        if (_m_notificationSchedule == false) {
            _LoopUpdateNotifications();
        }
    }
    function _UpdatePetNotification() {
        if (GameStateAPI.IsLocalPlayerPlayingMatch())
            return;
        // Held back until the menu is clear, rather than landing on top of whatever is open - the photo
        // booth and the picture book are popups like any other. The popup manager wears
        // HaveActivePopups while one is up, so this covers popups it knows nothing about.
        //
        // Checked before GetPetPopupNotification, which acks the event to the GC on the way past. The
        // event keeps for later either way: the level it has already shown only moves on in the
        // popup's close callback, so a deferred one is found again on a later pass of this loop.
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
    //--------------------------------------------------------------------------------------------------
    // Acknowledge popup
    //--------------------------------------------------------------------------------------------------
    let _m_acknowledgePopupHandler = null;
    function _ShowAcknowledgePopup(type = '', itemid = '') {
        if (type === 'xpgrant') { // Custom message when player used 'xpgrant' item
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
    // export function ShowNotificationBarTooltip (): void
    // {
    // 	const notification = _GetNotificationBarData();
    // 	if ( notification !== null )
    // 	{
    // 		UiToolkitAPI.ShowTextTooltip( 'NotificationsContainer', notification.tooltip );
    // 	}
    // }
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
        //Dirty Cp 3
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
    //--------------------------------------------------------------------------------------------------
    function _OnGoToCharacterLoadoutPressed() {
        if (!MyPersonaAPI.IsInventoryValid() || !MyPersonaAPI.IsConnectedToGC()) {
            //No connection to GC so show a message
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
            //No connection to GC so show a message
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
            // Show the home screen behind the popup.
            OnHomeButtonPressed();
            _NewUser_ShowForceTrainingPopup();
        }
        else if (GameTypesAPI.ShouldShowNewUserPopup()) {
            // Show the home screen behind the popup.
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
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
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
        //DEVONLY{
        $.RegisterForUnhandledEvent('DebugLobbyOfFive', _ShowDebugLobbyModels);
        //}DEVONLY
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbm1lbnUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9tYWlubWVudS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBQ2xDLGlEQUFpRDtBQUNqRCw4Q0FBOEM7QUFDOUMsb0RBQW9EO0FBQ3BELHlEQUF5RDtBQUN6RCxnREFBZ0Q7QUFDaEQsbUNBQW1DO0FBQ25DLGtDQUFrQztBQUNsQyw4Q0FBOEM7QUFDOUMsMkNBQTJDO0FBQzNDLDZDQUE2QztBQUM3Qyx5REFBeUQ7QUFDekQsMkVBQTJFO0FBRTNFLENBQUMsQ0FBQyxVQUFVLENBQUUsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQ3RDLG9HQUFvRztBQUNwRyx3Q0FBd0M7QUFDeEMsb0dBQW9HO0FBRXBHLElBQVUsUUFBUSxDQXVrR2pCO0FBdmtHRCxXQUFVLFFBQVE7SUFFakIsTUFBTSxnQkFBZ0IsR0FBRyxDQUFFLFlBQVksQ0FBQyxlQUFlLEVBQUUsS0FBSyxjQUFjLENBQUUsQ0FBQztJQUMvRSxJQUFJLFlBQVksR0FBa0IsSUFBSSxDQUFDO0lBQ3ZDLElBQUksa0NBQWtDLEdBQUcsS0FBSyxDQUFDO0lBQy9DLE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxDQUFFLG9CQUFvQixDQUFHLENBQUM7SUFDckQsSUFBSSxxQkFBcUIsR0FBRyxLQUFLLENBQUM7SUFDbEMsTUFBTSwyQkFBMkIsR0FBRyxDQUFDLENBQUM7SUFDdEMsSUFBSSxtQkFBbUIsR0FBaUIsSUFBSSxDQUFDO0lBRTdDLGVBQWU7SUFDZixNQUFNLDJCQUEyQixHQUFHLENBQUMsQ0FBRSw2QkFBNkIsQ0FBRyxDQUFDO0lBQ3hFLElBQUksdUJBQXVCLEdBQW1CLEtBQUssQ0FBQztJQUNwRCxJQUFJLGlDQUFpQyxHQUFHLEtBQUssQ0FBQztJQUM5QyxJQUFJLHdCQUF3QixHQUFHLEtBQUssQ0FBQztJQUNyQyxJQUFJLGtDQUFr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