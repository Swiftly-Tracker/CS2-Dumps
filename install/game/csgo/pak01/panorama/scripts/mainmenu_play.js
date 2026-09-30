"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/scheduler.ts" />
/// <reference path="avatar.ts" />
/// <reference path="particle_controls.ts" />
/// <reference path="util_gamemodeflags.ts" />
/// <reference path="common/formattext.ts" />
/// <reference path="common/icon.ts" />
/// <reference path="common/licenseutil.ts" />
/// <reference path="common/sessionutil.ts" />
/// <reference path="rating_emblem.ts" />
$.LogChannel("p.mainmenu", "LV_OFF");
var PlayMenu;
(function (PlayMenu) {
    const k_workshopPanelId = 'gameModeButtonContainer_workshop';
    let _m_inventoryUpdatedHandler;
    // Holds handles to panels containing game mode selection buttons.
    const m_mapSelectionButtonContainers = {};
    // Game mode configs from GameModes.txt.
    let m_gameModeConfigs = {};
    // Array of game mode selection radio button panels.
    let m_arrGameModeRadios = [];
    // Helper functions that get implemented in Init
    let GetMGDetails;
    let GetGameType;
    const m_bPerfectWorld = (MyPersonaAPI.GetLauncherType() === 'perfectworld');
    let m_activeMapGroupSelectionPanelID = null;
    // for regular game modes (m_workshop = false)
    let m_serverSetting = '';
    let m_gameModeSetting = '';
    let m_singleSkirmishMapGroup = null;
    let m_arrSingleSkirmishMapGroups = [];
    // HACK: per-mode selected map state stored directly on the button panels that are children of m_mapSelectionButtonContainers[mode_panel_id]
    const m_gameModeFlags = {};
    // for workshop maps
    let m_isWorkshop = false;
    let m_jsTimerUpdateHandle = false;
    // private queue key.
    let m_challengeKey = '';
    let m_bDidShowActiveMapSelectionTab = false;
    let m_selectedPracticeMap = '';
    const k_workshopModes = {
        classic: 'casual,competitive',
        casual: 'casual',
        competitive: 'competitive',
        wingman: 'scrimcomp2v2',
        deathmatch: 'deathmatch',
        training: 'training',
        coopstrike: 'coopmission',
        armsrace: 'gungameprogressive',
        rush: 'rush',
        custom: 'custom',
        // skirmish modes
        flyingscoutsman: 'flyingscoutsman',
        retakes: 'retakes'
    };
    const m_PlayMenuActionBarParticleFX = $('#PlayMenuActionBar_Searching_particles');
    // Create a Table of control point positions
    ParticleControls.InitMainMenuTopBar(m_PlayMenuActionBarParticleFX);
    function inDirectChallenge() {
        return _GetDirectChallengeKey() != '';
    }
    function StartSearch() {
        const btnStartSearch = $('#StartMatchBtn');
        if (btnStartSearch === null)
            return;
        btnStartSearch.AddClass('pressed');
        $.DispatchEvent('CSGOPlaySoundEffect', 'mainmenu_press_GO', 'MOUSE');
        ParticleControls.UpdateActionBar(m_PlayMenuActionBarParticleFX, "StartMatchBtn");
        if (inDirectChallenge()) {
            _DirectChallengeStartSearch();
            return;
        }
        if (m_isWorkshop) {
            _DisplayWorkshopModePopup();
        }
        else {
            if (m_gameModeSetting !== 'premier') {
                // even though settings are guaranteed to have valid maps/mapgroups, we still don't want a user to start matchmaking without an explicit map selection.
                if (!_CheckContainerHasAnyChildChecked(_GetMapListForServerTypeAndGameMode(m_activeMapGroupSelectionPanelID)) && !m_isWorkshop) {
                    _NoMapSelectedPopup();
                    btnStartSearch.RemoveClass('pressed');
                    return;
                }
            }
            // force the user to make some decisions here
            if (GameModeFlags.DoesModeUseFlags(_RealGameMode()) && !m_gameModeFlags[m_serverSetting + _RealGameMode()]) // flags entry exists but we dont have one set
             {
                btnStartSearch.RemoveClass('pressed');
                const resumeSearchFnHandle = UiToolkitAPI.RegisterJSCallback(StartSearch);
                _OnGameModeFlagsBtnClicked(resumeSearchFnHandle);
                return;
            }
            let stage = _GetTournamentStage();
            LobbyAPI.StartMatchmaking(MyPersonaAPI.GetMyOfficialTournamentName(), MyPersonaAPI.GetMyOfficialTeamName(), _GetTournamentOpponent(), stage);
        }
    }
    function _Init() {
        // Get map groups for modes out of gamemodes.txt
        const cfg = GameTypesAPI.GetConfig();
        // Game type is not helpful. Nobody cares about a mode being 'classic'. Dig out useful subkeys and
        // store them in a local object for easier access.
        for (const type in cfg.gameTypes) {
            for (const mode in cfg.gameTypes[type].gameModes) {
                let obj = cfg.gameTypes[type].gameModes[mode];
                m_gameModeConfigs[mode] = obj;
            }
        }
        // Helper to dig up the game type string for a given mode based on gamemodes.txt.
        // 'Game type' isn't very useful... trying to use it only when required and talk about modes by 'game mode' as often as possible.
        GetGameType = (mode) => {
            for (const gameType in cfg.gameTypes) {
                if (cfg.gameTypes[gameType].gameModes.hasOwnProperty(mode))
                    return gameType;
            }
        };
        GetMGDetails = (mg) => {
            return cfg.mapgroups[mg];
        };
        // Apply the settings from the preferences we read to the session so when we get the update we are
        // in sync with the sessions and not using the session defaults.
        const elGameModeSelectionRadios = $('#GameModeSelectionRadios');
        if (elGameModeSelectionRadios !== null) {
            m_arrGameModeRadios = elGameModeSelectionRadios.Children();
        }
        m_arrGameModeRadios = m_arrGameModeRadios.filter(elPanel => !elPanel.BHasClass('mainmenu-top-navbar__play_seperator'));
        for (let entry of m_arrGameModeRadios) {
            entry.SetPanelEvent('onactivate', () => {
                m_isWorkshop = false;
                _LoadGameModeFlagsFromSettings();
                // clear skirmish
                if (!_IsSingleSkirmishString(entry.id)) {
                    m_singleSkirmishMapGroup = null;
                }
                if (entry.id === "JsDirectChallengeBtn") {
                    m_gameModeSetting = 'competitive';
                    _OnDirectChallengeBtn();
                    return;
                }
                else if (_IsSingleSkirmishString(entry.id)) {
                    m_gameModeSetting = 'skirmish';
                    m_singleSkirmishMapGroup = _GetSingleSkirmishMapGroupFromSingleSkirmishString(entry.id);
                }
                else {
                    m_gameModeSetting = entry.id;
                }
                const alert = entry.FindChild('GameModeAlert');
                if ((entry.id === "competitive" || entry.id === 'scrimcomp2v2') && alert && !alert.BHasClass('hidden')) {
                    if (GameInterfaceAPI.GetSettingString('ui_show_unlock_competitive_alert') !== '1') {
                        GameInterfaceAPI.SetSettingString('ui_show_unlock_competitive_alert', '1');
                    }
                }
                // reset the key without triggering a bunch of session update callbacks,
                // it will be pushed into the session settings in _ApplySessionSettings
                m_challengeKey = '';
                _ApplySessionSettings();
            });
        }
        for (let entry of m_arrGameModeRadios) {
            if (_IsSingleSkirmishString(entry.id)) {
                m_arrSingleSkirmishMapGroups.push(_GetSingleSkirmishMapGroupFromSingleSkirmishString(entry.id));
            }
        }
        _SetUpGameModeFlagsRadioButtons();
        // Set up Permissions btn
        const elBtnContainer = $('#PermissionsSettings');
        const elPermissionsButton = elBtnContainer.FindChild("id-slider-btn");
        elPermissionsButton.SetPanelEvent('onactivate', () => {
            const bCurrentlyPrivate = (LobbyAPI.GetSessionSettings().system.access === "private");
            const sNewAccessSetting = bCurrentlyPrivate ? "public" : "private";
            const settings = {
                update: {
                    system: {
                        access: sNewAccessSetting
                    }
                }
            };
            GameInterfaceAPI.SetSettingString('lobby_default_privacy_bits', (sNewAccessSetting === "public") ? "1" : "0");
            LobbyAPI.UpdateSessionSettings(settings);
            $.DispatchEvent('UIPopupButtonClicked', '');
        });
        // Set up practice settings
        const elPracticeSettingsContainer = $('#id-play-menu-practicesettings-container');
        for (let elChild of elPracticeSettingsContainer.Children()) {
            if (!elChild.id.startsWith('id-play-menu-practicesettings-'))
                continue;
            let strFeatureName = elChild.id;
            strFeatureName = strFeatureName.replace('id-play-menu-practicesettings-', '');
            strFeatureName = strFeatureName.replace('-tooltip', '');
            // "id-play-menu-practicesettings-grenades-tooltip" => '#practicesettings_*grenades*_button'
            const elFeatureFrame = elChild.FindChildTraverse('id-play-menu-practicesettings-' + strFeatureName);
            const elFeatureSliderBtn = elFeatureFrame.FindChildTraverse('id-slider-btn');
            elFeatureSliderBtn.text = $.Localize('#practicesettings_' + strFeatureName + '_button');
            elFeatureSliderBtn.SetPanelEvent('onactivate', () => {
                UiToolkitAPI.HideTextTooltip();
                const sessionSettings = LobbyAPI.GetSessionSettings();
                const curvalue = (sessionSettings && sessionSettings.options && sessionSettings.options.hasOwnProperty('practicesettings_' + strFeatureName))
                    ? sessionSettings.options['practicesettings_' + strFeatureName] : 0;
                // flip the value
                const newvalue = curvalue ? 0 : 1;
                // update the UI CVAR first 
                GameInterfaceAPI.SetSettingString('ui_playsettings_listen_' + strFeatureName, newvalue ? '1' : '0');
                // then the settings second
                const setting = 'practicesettings_' + strFeatureName;
                const newSettings = { update: { options: {} } };
                newSettings.update.options[setting] = newvalue;
                LobbyAPI.UpdateSessionSettings(newSettings);
            });
        }
        //Set up StartSearch Button
        const btnStartSearch = $('#StartMatchBtn');
        btnStartSearch.SetPanelEvent('onactivate', StartSearch);
        const btnCancel = $.GetContextPanel().FindChildInLayoutFile('PartyCancelBtn');
        btnCancel.SetPanelEvent('onactivate', () => {
            LobbyAPI.StopMatchmaking();
            $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.generic_button_press', 'MOUSE');
            ParticleControls.UpdateActionBar(m_PlayMenuActionBarParticleFX, "RmoveBtnEffects");
        });
        const elWorkshopSearch = $("#WorkshopSearchTextEntry");
        elWorkshopSearch.SetPanelEvent('ontextentrychange', _UpdateWorkshopMapFilter);
        // Set initial state to our session settings
        _SyncDialogsFromSessionSettings(LobbyAPI.GetSessionSettings());
        _ApplySessionSettings();
        // if favorites preset button is empty, save whatever we have right now.
        const strFavoriteMaps = GameInterfaceAPI.GetSettingString('ui_playsettings_custom_preset');
        if (strFavoriteMaps === '') {
            SaveMapSelectionToCustomPreset(true);
        }
        _UpdateGameModeFlagsBtn();
        _UpdateDirectChallengePage();
    }
    function _SetUpGameModeFlagsRadioButtons() {
        const oFlags = GameModeFlags.GetFlags();
        for (let key of Object.keys(oFlags)) {
            const elParent = $.GetContextPanel().FindChildInLayoutFile('id-gamemode-flag-' + key);
            const mode = oFlags[key];
            for (let flag of mode.flags) {
                if (!elParent.FindChildInLayoutFile(elParent.id + '-' + flag)) {
                    const btn = $.CreatePanel('RadioButton', elParent, elParent.id + '-' + flag, {
                        class: 'gamemode-setting-radiobutton',
                        group: 'game_mode_flag_' + key,
                        text: '#play_settings_' + key + '_dialog_' + flag
                    });
                    btn.SetPanelEvent('onactivate', () => _OnGameModeFlagOptionActivate(flag));
                    let btnId = btn.id;
                    btn.SetPanelEvent('onmouseover', () => {
                        if (key === 'competitive') {
                            UiToolkitAPI.ShowTextTooltip(btnId, '#play_settings_competitive_dialog_' + flag + '_desc');
                        }
                    });
                    btn.SetPanelEvent('onmouseout', UiToolkitAPI.HideTextTooltip);
                }
            }
        }
    }
    function _RevertForceDirectChallengeSettings() {
        _LoadGameModeFlagsFromSettings();
    }
    function _TurnOffDirectChallenge() {
        _SetDirectChallengeKey('');
        _RevertForceDirectChallengeSettings();
        _ApplySessionSettings();
        Scheduler.Cancel("directchallenge");
    }
    function _OnDirectChallengeBtn() {
        if (!inDirectChallenge()) {
            // when opening the direct challenge panel, use the saved code, if we have one
            const savedKey = GameInterfaceAPI.GetSettingString('ui_playsettings_directchallengekey');
            if (!savedKey)
                _SetDirectChallengeKey(CompetitiveMatchAPI.GetDirectChallengeCode());
            else
                _SetDirectChallengeKey(savedKey);
            _ApplySessionSettings();
        }
    }
    function _SetDirectChallengeKey(key) {
        let keySource;
        let keySourceLabel;
        let type, id, id32;
        if (key != '') {
            const oReturn = { value: [] };
            const bValid = _IsChallengeKeyValid(key, oReturn, 'set');
            type = oReturn.value[2]; // u for user, g for group
            id = oReturn.value[3]; // xuid if user, clanid if group
            id32 = parseInt(oReturn.value[4]); // 32-bit id of the clan
            if (bValid) {
                switch (type) {
                    case 'u':
                        keySource = FriendsListAPI.GetFriendName(id);
                        keySourceLabel = $.Localize('#DirectChallenge_CodeSourceLabelUser2');
                        break;
                    case 'g':
                        keySource = FriendsListAPI.GetClanInfoById32Bit(id32, 'name');
                        keySourceLabel = $.Localize('#DirectChallenge_CodeSourceLabelClan2');
                        if (!keySource) {
                            keySource = $.Localize("#DirectChallenge_UnknownSource");
                        }
                        break;
                }
            }
            GameInterfaceAPI.SetSettingString('ui_playsettings_directchallengekey', key);
        }
        // toggle the checkbox
        const DirectChallengeCheckBox = $.GetContextPanel().FindChildTraverse('JsDirectChallengeBtn');
        DirectChallengeCheckBox.checked = key != '';
        if (type !== undefined && id != undefined)
            _SetDirectChallengeIcons(type, id);
        $.GetContextPanel().SetDialogVariable('queue-code', key);
        if (keySource)
            $.GetContextPanel().SetDialogVariable('code-source', keySource);
        if (keySourceLabel)
            $.GetContextPanel().SetDialogVariable('code-source-label', keySourceLabel);
        if (id)
            $.GetContextPanel().SetAttributeString('code-xuid', id);
        if (type)
            $.GetContextPanel().SetAttributeString('code-type', type);
        if (key && (m_challengeKey != key)) {
            // do this one frame later
            $.Schedule(0.01, () => {
                const elHeader = $.GetContextPanel().FindChildTraverse("JsDirectChallengeKey");
                if (elHeader && elHeader.IsValid())
                    elHeader.TriggerClass('directchallenge-status__header__queuecode');
            });
        }
        // set style on root
        $.GetContextPanel().SetHasClass('directchallenge', key != '');
        $.Msg("-- challenge key updated: " + key);
        m_challengeKey = key;
    }
    function _ClansInfoUpdated() {
        if (m_challengeKey && $.GetContextPanel().GetAttributeString('code-type', '') === 'g') {
            _SetDirectChallengeKey(m_challengeKey);
        }
    }
    function _AddOpenPlayerCardAction(elAvatar, xuid) {
        elAvatar.SetPanelEvent("onactivate", () => {
            // Tell the sidebar to stay open and ignore its on mouse event while the context menu is open
            $.DispatchEvent('SidebarContextMenuActive', true);
            if (xuid !== '') {
                const contextMenuPanel = UiToolkitAPI.ShowCustomLayoutContextMenuParametersDismissEvent('', '', 'file://{resources}/layout/context_menus/context_menu_playercard.xml', 'xuid=' + xuid, () => $.DispatchEvent('SidebarContextMenuActive', false));
                contextMenuPanel.AddClass("ContextMenu_NoArrow");
            }
        });
    }
    function _SetDirectChallengeIcons(type, id) {
        const btn = $("#JsDirectChallengeBtn");
        if (!btn.checked)
            return;
        const elAvatar = $.GetContextPanel().FindChildInLayoutFile('JsDirectChallengeAvatar');
        if (!elAvatar) {
            $.Schedule(0.1, () => _SetDirectChallengeIcons(type, id));
            return;
        }
        elAvatar.PopulateFromSteamID(id);
        if (!type || !id) {
            elAvatar.SetPanelEvent('onactivate', () => { });
        }
        switch (type) {
            case 'u':
                _AddOpenPlayerCardAction(elAvatar, id);
                break;
            case 'g':
                _AddGoToClanPageAction(elAvatar, id);
                break;
        }
    }
    function _AddGoToClanPageAction(elAvatar, id) {
        elAvatar.SetPanelEvent('onactivate', () => {
            SteamOverlayAPI.OpenUrlInOverlayOrExternalBrowser("https://" + SteamOverlayAPI.GetSteamCommunityURL() + "/gid/" + id);
        });
    }
    function _GetDirectChallengeKey() {
        return m_challengeKey;
    }
    function _OnDirectChallengeRandom() {
        UiToolkitAPI.ShowGenericPopupOkCancel($.Localize('#DirectChallenge_CreateNewKey2'), $.Localize('#DirectChallenge_CreateNewKeyMsg'), '', () => {
            _SetDirectChallengeKey(CompetitiveMatchAPI.GenerateDirectChallengeCode());
            _ApplySessionSettings();
        }, () => { });
    }
    function _GetChallengeKeyType(key) {
        const oReturn = { value: [] };
        if (_IsChallengeKeyValid(key.toUpperCase(), oReturn, '')) {
            return oReturn.value[2]; // u for user, g for group
        }
        else {
            return '';
        }
    }
    function _OnDirectChallengeEdit() {
        const submitCallback = UiToolkitAPI.RegisterJSCallback((value) => {
            _SetDirectChallengeKey(value.toUpperCase());
            _ApplySessionSettings();
            StartSearch();
        });
        UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_directchallenge_join.xml', '&' + 'submitCallback=' + submitCallback);
    }
    function _OnDirectChallengeCopy() {
        SteamOverlayAPI.CopyTextToClipboard(_GetDirectChallengeKey());
        UiToolkitAPI.ShowTextTooltip('CopyChallengeKey', '#DirectChallenge_Copied2');
    }
    function _IsChallengeKeyValid(key, oReturn = { string: [] }, how = '') {
        const code = CompetitiveMatchAPI.ValidateDirectChallengeCode(key, how);
        const bValid = (typeof code === 'string') && code.includes(',');
        if (bValid) {
            oReturn.value = code.split(',');
        }
        return bValid;
    }
    function _DirectChallengeStartSearch() {
        const oReturn = { value: [] };
        const bValid = _IsChallengeKeyValid(m_challengeKey.toUpperCase(), oReturn, 'set');
        if (!bValid) {
            $.DispatchEvent('CSGOPlaySoundEffect', 'mainmenu_press_GO', 'MOUSE');
            return;
        }
        _OnPrivateQueuesUpdate();
        LobbyAPI.StartMatchmaking('', oReturn.value[0], oReturn.value[1], '1');
    }
    function _NoMapSelectedPopup() {
        //No connection to GC so show a message
        UiToolkitAPI.ShowGenericPopupOk($.Localize('#no_maps_selected_title'), $.Localize('#no_maps_selected_text'), '', () => { });
    }
    function _SetGameModeRadioButtonAvailableTooltip(gameMode, isAvailable, txtTooltip) {
        const elGameModeSelectionRadios = $('#GameModeSelectionRadios');
        const elTab = elGameModeSelectionRadios ? elGameModeSelectionRadios.FindChildInLayoutFile(gameMode) : null;
        if (elTab) {
            if (!isAvailable && txtTooltip) {
                let targetLevel = 2;
                let showbar = true;
                if (gameMode === 'premier') {
                    targetLevel = 10;
                    if (!MyPersonaAPI.IsConnectedToGC()) {
                        txtTooltip += '_nogcconnection';
                        showbar = false;
                    }
                    else if (MyPersonaAPI.GetElevatedState() !== 'elevated') {
                        txtTooltip += '_nonprime';
                        showbar = false;
                    }
                    else if (TournamentsAPI.IsPremierSeasonOffseason()) {
                        txtTooltip += '_offseason';
                        showbar = false;
                    }
                }
                elTab.SetPanelEvent('onmouseover', () => {
                    UiToolkitAPI.ShowCustomLayoutParametersTooltip(elTab.id, 'GamemodesLockedneedPrime', 'file://{resources}/layout/tooltips/tooltip_title_progressbar.xml', 'titletext=' + '#PlayMenu_unavailable_locked_mode_title' +
                        '&' + 'bodytext=' + txtTooltip +
                        '&' + 'usexp=' + 'true' +
                        '&' + 'targetlevel=' + targetLevel +
                        '&' + 'showbar=' + (showbar ? 'true' : 'false'));
                });
                elTab.SetPanelEvent('onmouseout', () => {
                    UiToolkitAPI.HideCustomLayoutTooltip('GamemodesLockedneedPrime');
                });
            }
            else {
                elTab.SetPanelEvent('onmouseover', () => { });
                elTab.SetPanelEvent('onmouseout', () => { });
            }
        }
    }
    function _SetGameModeRadioButtonVisible(gameMode, isVisible) {
        const elGameModeSelectionRadios = $('#GameModeSelectionRadios');
        const elTab = elGameModeSelectionRadios ? elGameModeSelectionRadios.FindChildInLayoutFile(gameMode) : null;
        if (elTab) {
            elTab.visible = isVisible;
        }
    }
    function _IsGameModeAvailable(serverType, gameMode) {
        let isAvailable = true;
        if (gameMode === "cooperative" || gameMode === "coopmission") {
            _SetGameModeRadioButtonVisible(gameMode, false);
            return false;
        }
        else if (m_gameModeConfigs[gameMode] &&
            _GetAvailableMapGroups(gameMode, _IsValveOfficialServer(serverType)).length == 0) {
            _SetGameModeRadioButtonAvailableTooltip(gameMode, false, '');
            return false;
        }
        // Rest of this flow deals with disabled/enabled buttons for Private Rank 2
        if (_IsValveOfficialServer(serverType) && // possibly disable the game modes for all matchmaking, for now disable them in official only
            LobbyAPI.BIsHost()) {
            // new user experimental funneling
            // end result : unrestricted mode is best, default to casual
            //
            // Make sure this code matches :: uicomponent_settings.cpp
            // UI_SETTINGS_CVAR_ALIAS_WITH_GET_FILTER_FUNC( ui_playsettings_mode_official
            //
            if (gameMode === 'premier') {
                isAvailable = ((MyPersonaAPI.GetElevatedState() === 'elevated') &&
                    (MyPersonaAPI.HasPrestige() || MyPersonaAPI.GetCurrentLevel() >= 10)) &&
                    !TournamentsAPI.IsPremierSeasonOffseason();
            }
            else if (MyPersonaAPI.HasPrestige()) {
                isAvailable = true;
            }
            else if (MyPersonaAPI.GetCurrentLevel() < 2) // check user is at least Private Rank 2
             {
                isAvailable = (gameMode == 'deathmatch' || gameMode == 'casual' || gameMode == 'gungameprogressive' || gameMode == 'retakes');
            }
        }
        else if (!_IsValveOfficialServer(serverType)) {
            (isAvailable = (gameMode != 'premier'));
        }
        // Must always call this function to manage enabled state in order to turn off the tooltip
        _SetGameModeRadioButtonAvailableTooltip(gameMode, isAvailable, _IsPlayingOnValveOfficial() ? '#PlayMenu_unavailable_newuser_2' : '');
        return isAvailable;
    }
    function _GetTournamentOpponent() {
        const elTeamDropdown = $.GetContextPanel().FindChildInLayoutFile('TournamentTeamDropdown');
        if (elTeamDropdown.GetSelected() === null)
            return '';
        return elTeamDropdown.GetSelected().GetAttributeString('data', '');
    }
    function _GetTournamentStage() {
        const elStageDropdown = $.GetContextPanel().FindChildInLayoutFile('TournamentStageDropdown');
        if (elStageDropdown.GetSelected() === null)
            return '';
        return elStageDropdown.GetSelected().GetAttributeString('data', '');
    }
    function _UpdateStartSearchBtn(isSearchingForTournament) {
        const btnStartSearch = $.GetContextPanel().FindChildInLayoutFile('StartMatchBtn');
        btnStartSearch.enabled = isSearchingForTournament ? (_GetTournamentOpponent() != '' && _GetTournamentStage() != '') : true;
    }
    function _UpdateTournamentButton(isHost) {
        const bIsOfficialCompetitive = _RealGameMode() === "competitive" && _IsPlayingOnValveOfficial();
        const strTeamName = MyPersonaAPI.GetMyOfficialTeamName();
        const strTournament = MyPersonaAPI.GetMyOfficialTournamentName();
        const isInTournament = isHost && strTeamName != "" && strTournament != "";
        $.GetContextPanel().SetHasClass("play-menu__tournament", isInTournament);
        const isSearchingForTournament = bIsOfficialCompetitive && isInTournament;
        const elTeamDropdown = $.GetContextPanel().FindChildInLayoutFile('TournamentTeamDropdown');
        const elStageDropdown = $.GetContextPanel().FindChildInLayoutFile('TournamentStageDropdown');
        if (isInTournament) {
            function AddDropdownOption(elDropdown, entryID, strText, strData, strSelectedData) {
                const newEntry = $.CreatePanel('Label', elDropdown, entryID, { data: strData });
                newEntry.text = strText;
                elDropdown.AddOption(newEntry);
                // set selected
                if (strSelectedData === strData) {
                    elDropdown.SetSelected(entryID);
                }
            }
            const strCurrentOpponent = _GetTournamentOpponent();
            const strCurrentStage = _GetTournamentStage();
            // generate team dropdown
            elTeamDropdown.RemoveAllOptions();
            AddDropdownOption(elTeamDropdown, 'PickOpponent', $.Localize('#SFUI_Tournament_Pick_Opponent'), '', strCurrentOpponent);
            const teamCount = CompetitiveMatchAPI.GetTournamentTeamCount(strTournament);
            for (let i = 0; i < teamCount; i++) {
                const strTeam = CompetitiveMatchAPI.GetTournamentTeamNameByIndex(strTournament, i);
                // don't need to add your own team
                if (strTeamName === strTeam)
                    continue;
                AddDropdownOption(elTeamDropdown, 'team_' + i, strTeam, strTeam, strCurrentOpponent);
            }
            elTeamDropdown.SetPanelEvent('oninputsubmit', () => _UpdateStartSearchBtn(isSearchingForTournament));
            // generate stage dropdown
            elStageDropdown.RemoveAllOptions();
            AddDropdownOption(elStageDropdown, 'PickStage', $.Localize('#SFUI_Tournament_Stage'), '', strCurrentStage);
            const stageCount = CompetitiveMatchAPI.GetTournamentStageCount(strTournament);
            for (let i = 0; i < stageCount; i++) {
                const strStage = CompetitiveMatchAPI.GetTournamentStageNameByIndex(strTournament, i);
                AddDropdownOption(elStageDropdown, 'stage_' + i, strStage, strStage, strCurrentStage);
            }
            elStageDropdown.SetPanelEvent('oninputsubmit', () => _UpdateStartSearchBtn(isSearchingForTournament));
        }
        elTeamDropdown.enabled = isSearchingForTournament;
        elStageDropdown.enabled = isSearchingForTournament;
        _UpdateStartSearchBtn(isSearchingForTournament);
        _ShowActiveMapSelectionTab(!isSearchingForTournament);
    }
    function _SyncDialogsFromSessionSettings(settings) {
        if (!settings || !settings.game || !settings.system) {
            return;
        }
        m_serverSetting = settings.options.server;
        m_gameModeSetting = settings.game.mode_ui;
        $.GetContextPanel().SetHasClass('premier', m_gameModeSetting === 'premier');
        _SetDirectChallengeKey(settings.options.hasOwnProperty('challengekey') ? settings.options.challengekey : '');
        _setAndSaveGameModeFlags(parseInt(settings.game.gamemodeflags));
        // add the mode and server to the root as a class so we can branch css
        $.GetContextPanel().SwitchClass("gamemode", m_isWorkshop ? "workshop" : _RealGameMode());
        $.GetContextPanel().SwitchClass("serversetting", m_serverSetting);
        $.GetContextPanel().SetHasClass("directchallenge", inDirectChallenge());
        // Figure out if this refers to a single skirmish tab
        m_singleSkirmishMapGroup = null;
        if (m_gameModeSetting === 'skirmish' && settings.game.mapgroupname && m_arrSingleSkirmishMapGroups.includes(settings.game.mapgroupname)) {
            m_singleSkirmishMapGroup = settings.game.mapgroupname;
        }
        const isHost = LobbyAPI.BIsHost();
        const isSearching = _IsSearching();
        const isEnabled = !isSearching && isHost ? true : false;
        const elPlayCommunity = $('#PlayCommunity');
        elPlayCommunity.enabled = !isSearching;
        if (m_isWorkshop) {
            _SwitchToWorkshopTab(isEnabled);
            _SelectMapButtonsFromSettings(settings);
        }
        else if (m_gameModeSetting) {
            // Set game mode radio to current game mode
            for (let i = 0; i < m_arrGameModeRadios.length; ++i) {
                const strGameModeForButton = m_arrGameModeRadios[i].id;
                // set tab index to the currently selected mode
                if (inDirectChallenge()) {
                    m_arrGameModeRadios[i].checked = m_arrGameModeRadios[i].id === 'JsDirectChallengeBtn';
                }
                else if (m_singleSkirmishMapGroup) {
                    if (_IsSingleSkirmishString(strGameModeForButton)) {
                        if (m_singleSkirmishMapGroup === _GetSingleSkirmishMapGroupFromSingleSkirmishString(strGameModeForButton)) {
                            m_arrGameModeRadios[i].checked = true;
                        }
                    }
                }
                else if (!_IsSingleSkirmishString(strGameModeForButton)) {
                    if (strGameModeForButton === m_gameModeSetting) {
                        m_arrGameModeRadios[i].checked = true;
                    }
                }
                if (strGameModeForButton === 'competitive' || strGameModeForButton === 'scrimcomp2v2') {
                    const bHide = GameInterfaceAPI.GetSettingString('ui_show_unlock_competitive_alert') === '1' ||
                        MyPersonaAPI.HasPrestige() ||
                        MyPersonaAPI.GetCurrentLevel() !== 2 ||
                        !_IsPlayingOnValveOfficial();
                    if (m_arrGameModeRadios[i].FindChildInLayoutFile('GameModeAlert')) {
                        m_arrGameModeRadios[i].FindChildInLayoutFile('GameModeAlert').SetHasClass('hidden', bHide);
                    }
                }
                // if you are a client or searching, or if the mode isn't allowed, disable the button
                const isAvailable = _IsGameModeAvailable(m_serverSetting, strGameModeForButton);
                m_arrGameModeRadios[i].enabled = isAvailable && isEnabled;
                m_arrGameModeRadios[i].SetHasClass('locked', !isAvailable || !isEnabled);
            }
            // We may have changed active radio above, refresh mapgroup buttons
            _UpdateMapGroupButtons(isEnabled, isSearching, isHost);
            // For Survival we the GC selects the game mode so.
            _CancelRotatingMapGroupSchedule();
            if (settings.game.mode === "survival") {
                _GetRotatingMapGroupStatus(_RealGameMode(), m_singleSkirmishMapGroup, settings.game.mapgroupname);
            }
            _SelectMapButtonsFromSettings(settings);
        }
        else {
            // Default first radio to checked when we don't yet have
            // a game mode sent by session settings. This should be corrected in
            // later session updates but we need some default check to avoid JS errors.
            m_arrGameModeRadios[0].checked = true;
        }
        _ShowHideStartSearchBtn(isSearching, isHost);
        _ShowCancelSearchButton(isSearching, isHost);
        // Update tournament button
        _UpdateTournamentButton(isHost);
        // Set prime button
        _UpdatePrimeBtn(isSearching, isHost);
        _UpdatePermissionBtnText(settings, isEnabled);
        _UpdatePracticeSettingsBtns(isSearching, isHost);
        // Update LeaderBoards button
        _UpdateLeaderboardBtn(m_gameModeSetting);
        // Update Survival Auto-Fill Squad button
        _UpdateSurvivalAutoFillSquadBtn(m_gameModeSetting);
        _UpdateRushFriendLeaderboards(m_gameModeSetting);
        //update play type radio
        _SelectActivePlayPlayTypeBtn();
        // _UpdateTopNavRadioBtns();
        // Update Replay New User Training button
        _UpdateReplayNewUserTrainingBtn(m_gameModeSetting);
        //_UpdateBotDifficultyButton();
        _UpdateDirectChallengePage(isSearching, isHost);
        _UpdateGameModeFlagsBtn();
        const elPlayTypeNav = $('#PlayTypeTopNav');
        const aPlayTypeBtns = elPlayTypeNav.Children();
        const bIsTopNavBtsEnabled = IsTopNavBtsEnabled();
        aPlayTypeBtns.forEach(btn => btn.enabled = bIsTopNavBtsEnabled);
        _SetClientViewLobbySettingsTitle(isHost);
        function IsTopNavBtsEnabled() {
            if (_IsPlayingOnValveOfficial() &&
                (m_gameModeSetting === "cooperative" || m_gameModeSetting === "coopmission"))
                return false;
            else
                return isEnabled;
        }
        _OnPrivateQueuesUpdate();
        _PipRankUpdate();
    }
    function _UpdateDirectChallengePage(isSearching = false, isHost = true) {
        const elBtn = $('#JsDirectChallengeBtn');
        elBtn.enabled = (m_serverSetting === "official") && !m_isWorkshop ? true : false;
        if (m_serverSetting !== "official" || m_isWorkshop) {
            return;
        }
        const fnEnableKey = (id, bEnable) => { const p = $(id); if (p)
            p.enabled = bEnable; };
        const bEnable = !isSearching && isHost;
        fnEnableKey("#RandomChallengeKey", bEnable);
        fnEnableKey("#EditChallengeKey", bEnable);
        fnEnableKey("#ClanChallengeKey", bEnable);
        fnEnableKey("#JsDirectChallengeBtn", bEnable && (MyPersonaAPI.HasPrestige() || (MyPersonaAPI.GetCurrentLevel() >= 2)));
    }
    function _OnClanChallengeKeySelected(key) {
        _SetDirectChallengeKey(key);
        _ApplySessionSettings();
        StartSearch();
    }
    function _OnChooseClanKeyBtn() {
        if (MyPersonaAPI.GetMyClanCount() == 0) {
            UiToolkitAPI.ShowGenericPopupThreeOptions('#DirectChallenge_no_steamgroups', '#DirectChallenge_no_steamgroups_desc', '', '#DirectChallenge_create_steamgroup', () => {
                SteamOverlayAPI.OpenUrlInOverlayOrExternalBrowser("https://" + SteamOverlayAPI.GetSteamCommunityURL() + "/actions/GroupCreate");
            }, '#DirectChallenge_openurl2', () => {
                SteamOverlayAPI.OpenUrlInOverlayOrExternalBrowser("https://" + SteamOverlayAPI.GetSteamCommunityURL() + "/search/groups");
            }, '#UI_OK', () => { });
            return;
        }
        const clanKey = _GetChallengeKeyType(m_challengeKey) == 'g' ? m_challengeKey : '';
        const elClanSelector = UiToolkitAPI.ShowCustomLayoutPopupParameters('id-popup_directchallenge_steamgroups', 'file://{resources}/layout/popups/popup_directchallenge_steamgroups.xml', 'currentkey=' + clanKey);
        elClanSelector.AddClass("ContextMenu_NoArrow");
    }
    function _CreatePlayerTile(elTile, xuid, delay = 0) {
        $.Msg("DC _CreatePlayerTile ( " + elTile.id + ", " + xuid + " )");
        elTile.BLoadLayout('file://{resources}/layout/simple_player_tile.xml', false, false);
        // This gives the panel enough time to load so we call the init
        $.Schedule(.1, () => {
            if (!elTile || !elTile.IsValid())
                return;
            const elAvatar = elTile.FindChildTraverse('JsAvatarImage');
            elAvatar.PopulateFromSteamID(xuid);
            const strName = FriendsListAPI.GetFriendName(xuid);
            elTile.SetDialogVariable('player_name', strName);
            _AddOpenPlayerCardAction(elTile, xuid);
            Scheduler.Schedule(delay, () => {
                if (elTile && elTile.IsValid())
                    elTile.RemoveClass('hidden');
            }, "directchallenge");
        });
    }
    function _OnPlayerNameChangedUpdate(xuid) {
        $.Msg("MainMenuPlay :: _OnPlayerNameChangedUpdate " + xuid);
        let strName = null;
        const strCodeXuid = $.GetContextPanel().GetAttributeString('code-xuid', '');
        if (strCodeXuid === xuid) {
            if (!strName) // cached resolve
                strName = FriendsListAPI.GetFriendName(xuid);
            $.GetContextPanel().SetDialogVariable('code-source', strName);
        }
        const elMembersContainer = $('#DirectChallengeQueueMembers');
        if (!elMembersContainer)
            return;
        const elUserTile = elMembersContainer.FindChildTraverse(xuid);
        if (!elUserTile)
            return;
        if (!strName) // cached resolve
            strName = FriendsListAPI.GetFriendName(xuid);
        elUserTile.SetDialogVariable('player_name', strName);
        $.Msg("MainMenuPlay :: _OnPlayerNameChangedUpdate :: UPDATED " + strName);
    }
    function _GetPartyID(partyXuid, arrMembers = []) {
        let partyId = '';
        const partySize = PartyBrowserAPI.GetPartyMembersCount(partyXuid);
        for (let j = 0; j < partySize; j++) {
            const memberXuid = PartyBrowserAPI.GetPartyMemberXuid(partyXuid, j);
            partyId += '_' + memberXuid;
            arrMembers.push(memberXuid);
        }
        return partyId;
    }
    function _OnPrivateQueuesUpdate() {
        $.Msg("DC _OnPrivateQueuesUpdate");
        const elMembersContainer = $.GetContextPanel().FindChildTraverse('DirectChallengeQueueMembers');
        if (!elMembersContainer)
            return;
        const elExplanation = $("#id-directchallenge-explanation");
        if (elExplanation)
            elExplanation.SetHasClass('hidden', _IsSearching());
        const elQueueMembers = $("#id-directchallenge-status__queue-members");
        if (elQueueMembers)
            elQueueMembers.SetHasClass('hidden', !_IsSearching());
        // not searching, clear the display and exit
        if (!_IsSearching()) {
            Scheduler.Cancel("directchallenge");
            const elStatus = $('#id-directchallenge-status');
            if (elStatus)
                elStatus.text = '';
            if (elMembersContainer)
                elMembersContainer.RemoveAndDeleteChildren();
            return;
        }
        const NumberOfParties = PartyBrowserAPI.GetPrivateQueuesCount();
        const NumberOfPlayers = PartyBrowserAPI.GetPrivateQueuesPlayerCount();
        const NumberOfMorePartiesNotShown = PartyBrowserAPI.GetPrivateQueuesMoreParties();
        // set the status line
        const elStatus = $('#id-directchallenge-status');
        if (elStatus) {
            $.GetContextPanel().SetDialogVariableInt('directchallenge_players', NumberOfPlayers);
            $.GetContextPanel().SetDialogVariableInt('directchallenge_moreparties', NumberOfMorePartiesNotShown);
            let strStatus = $.Localize(LobbyAPI.GetMatchmakingStatusString());
            if (NumberOfParties > 0) {
                strStatus += "\t";
                strStatus += $.Localize((NumberOfMorePartiesNotShown > 0) ? "#DirectChallenge_SearchingMembersAndMoreParties2" : "#DirectChallenge_SearchingMembersLabel2", $.GetContextPanel());
            }
            elStatus.text = strStatus;
        }
        // Mark children for sweep
        for (let child of elMembersContainer.Children()) {
            $.Msg("DC Marking party " + child.id + " for delete");
            child.SetAttributeInt("marked_for_delete", 1);
        }
        let delay = 0;
        for (let i = NumberOfParties; i-- > 0;) {
            const DELAY_INCREMENT = 0.25;
            const arrMembers = [];
            const partyXuid = PartyBrowserAPI.GetPrivateQueuePartyXuidByIndex(i);
            const partyId = _GetPartyID(partyXuid, arrMembers) /*+ h*/;
            let elParty = elMembersContainer.FindChild(partyId);
            if (!elParty) {
                elParty = $.CreatePanel('Panel', elMembersContainer, partyId, { class: 'directchallenge__party hidden' });
                elParty.SetHasClass('multi', arrMembers.length > 1);
                elMembersContainer.MoveChildBefore(elParty, elMembersContainer.Children()[0]);
                elParty.SetAttributeString("xuid", partyXuid);
                $.Msg("DC Creating party " + partyXuid + " " + partyId);
                Scheduler.Schedule(delay, () => {
                    if (elParty && elParty.IsValid())
                        elParty.RemoveClass('hidden');
                }, "directchallenge");
                //make tiles for the party members
                for (let xuid of arrMembers) {
                    if (elParty) {
                        const elTile = $.CreatePanel('Panel', elParty, xuid /*+ u*/, { class: "directchallenge__party__member" });
                        _CreatePlayerTile(elTile, xuid, delay);
                    }
                    delay += DELAY_INCREMENT;
                }
            }
            else {
                $.Msg("DC found party " + elParty.id + " " + _GetPartyID(partyXuid) + " and flagging it to keep");
            }
            elParty.SetAttributeInt("marked_for_delete", 0);
        }
        // now remove parties that are no longer in the queue
        for (let child of elMembersContainer.Children()) {
            if (child.GetAttributeInt("marked_for_delete", 0) !== 0) {
                $.Msg("DC deleting party " + child.id + " because it's marked for delete");
                child.DeleteAsync(0.0);
            }
        }
    }
    function _SetClientViewLobbySettingsTitle(isHost) {
        const elPanel = $.GetContextPanel().FindChildInLayoutFile('play-lobby-leader-panel');
        if (!elPanel || !elPanel.IsValid()) {
            return;
        }
        if (isHost) {
            elPanel.visible = false;
            return;
        }
        elPanel.visible = true;
        const elTitle = elPanel.FindChildInLayoutFile('play-lobby-leader-text');
        const xuid = PartyListAPI.GetPartySystemSetting("xuidHost");
        const leaderName = FriendsListAPI.GetFriendName(xuid);
        elTitle.text = leaderName;
        const elAvatar = elPanel.FindChildInLayoutFile('lobby-leader-avatar');
        elAvatar.PopulateFromSteamID(xuid);
    }
    function _GetAvailableMapGroups(gameMode, isPlayingOnValveOfficial) {
        // bad gameMode, return empty array
        const gameModeCfg = m_gameModeConfigs[gameMode];
        if (gameModeCfg === undefined)
            return [];
        const mapgroup = isPlayingOnValveOfficial ? gameModeCfg.mapgroupsMP : gameModeCfg.mapgroupsSP;
        if (mapgroup !== undefined && mapgroup !== null) {
            // remove premier
            delete mapgroup['mg_lobby_mapveto'];
            return Object.keys(mapgroup);
        }
        return [];
    }
    function _GetMapGroupPanelID() {
        if (inDirectChallenge()) {
            return "gameModeButtonContainer_directchallenge";
        }
        else if (m_gameModeSetting === 'premier') {
            return "gameModeButtonContainer_premier";
        }
        const gameModeId = _RealGameMode() + (m_singleSkirmishMapGroup ? '@' + m_singleSkirmishMapGroup : '');
        const panelID = 'gameModeButtonContainer_' + gameModeId + '_' + m_serverSetting;
        return panelID;
    }
    function _OnActivateMapOrMapGroupButton(mapgroupButton) {
        const mapGroupNameClicked = mapgroupButton.GetAttributeString("mapname", '');
        if ($.GetContextPanel().BHasClass('play-menu__lobbymapveto_activated') && mapGroupNameClicked !== 'mg_lobby_mapveto') { // don't allow clicking mapgroups if lobby map veto is activated
            return;
        }
        if (mapgroupButton.checked) {
            $.DispatchEvent('CSGOPlaySoundEffect', 'submenu_leveloptions_select', 'MOUSE');
        }
        else {
            $.DispatchEvent('CSGOPlaySoundEffect', 'submenu_leveloptions_deselect', 'MOUSE');
        }
        // Special check for the sibling button between unranked scrimmage and ranked to uncheck the sibling
        let mapGroupName = mapGroupNameClicked;
        if (mapGroupName) {
            const siblingSuffix = '_scrimmagemap';
            if (mapGroupName.toLowerCase().endsWith(siblingSuffix))
                mapGroupName = mapGroupName.substring(0, mapGroupName.length - siblingSuffix.length);
            else
                mapGroupName = mapGroupName + siblingSuffix;
            // Traverse the two-tiered children
            let elParent = mapgroupButton.GetParent();
            if (elParent)
                elParent = elParent.GetParent();
            if (elParent && elParent.GetAttributeString('hassections', '')) {
                for (let section of elParent.Children()) {
                    for (let tile of section.Children()) {
                        const mapGroupNameSibling = tile.GetAttributeString("mapname", '');
                        if (mapGroupNameSibling.toLowerCase() === mapGroupName.toLowerCase()) { // uncheck the sibling tile
                            tile.checked = false;
                        }
                    }
                }
            }
        }
        _MatchMapSelectionWithQuickSelect();
        if (_CheckContainerHasAnyChildChecked(_GetMapListForServerTypeAndGameMode(m_activeMapGroupSelectionPanelID))) {
            _ApplySessionSettings();
        }
    }
    function _ShowActiveMapSelectionTab(isEnabled) {
        const panelID = m_activeMapGroupSelectionPanelID;
        for (const key in m_mapSelectionButtonContainers) {
            const elButtonContainer = m_mapSelectionButtonContainers[key];
            // Skip the first transition
            if (!m_bDidShowActiveMapSelectionTab) {
                elButtonContainer.AddClass("skip-transition");
            }
            if (key !== panelID) {
                elButtonContainer.AddClass("hidden");
            }
            else {
                // GetSelectedMapButton( key );
                elButtonContainer.RemoveClass("hidden");
                elButtonContainer.visible = true;
                // Disable if you are client or searching
                elButtonContainer.enabled = isEnabled;
            }
            elButtonContainer.RemoveClass("skip-transition");
        }
        const isWorkshop = panelID === k_workshopPanelId;
        $('#WorkshopSearchBar').visible = isWorkshop;
        for (let element of $('#GameModeSelectionRadios').Children()) {
            element.enabled = element.enabled && !isWorkshop && !_IsSearching() && LobbyAPI.BIsHost();
        }
        // also show/hide 'visit workshop' button
        $('#WorkshopVisitButton').visible = isWorkshop;
        $('#WorkshopVisitButton').enabled = SteamOverlayAPI.IsEnabled();
        m_bDidShowActiveMapSelectionTab = true;
    }
    function _GetMapTileContainer() {
        return $.GetContextPanel().FindChildInLayoutFile(_GetMapGroupPanelID());
    }
    function CSGOOpenSteamWorkshop_helper(tag) {
        $.DispatchEvent('CSGOOpenSteamWorkshop', tag);
    }
    PlayMenu.CSGOOpenSteamWorkshop_helper = CSGOOpenSteamWorkshop_helper;
    // toggle all of the maps referenced by this quick selection map group
    function OnMapQuickSelect(mgName) {
        // these are the maps we want to toggle on
        const arrMapsToSelect = _GetMapsFromQuickSelectMapGroup(mgName);
        let bScrolled = false;
        const prevSelection = _GetSelectedMapsForServerTypeAndGameMode(m_serverSetting, _RealGameMode(), true);
        const elMapGroupContainer = _GetMapTileContainer();
        for (let elMapBtn of elMapGroupContainer.Children()) {
            let bFound = false;
            // short circuit the search if we clicked on "all"
            if (mgName === "all") {
                bFound = true;
            }
            else if (mgName === "none") {
                bFound = false;
            }
            else {
                for (let mapname of arrMapsToSelect) {
                    if (elMapBtn.GetAttributeString("mapname", "") == mapname) {
                        bFound = true;
                    }
                }
            }
            elMapBtn.checked = bFound;
            // scroll to the first hit.
            if (bFound && !bScrolled) {
                elMapBtn.ScrollParentToMakePanelFit(2, false);
                bScrolled = true;
            }
        }
        // if we changed any maps...
        const newSelection = _GetSelectedMapsForServerTypeAndGameMode(m_serverSetting, _RealGameMode(), true);
        if (prevSelection != newSelection) {
            $.DispatchEvent('CSGOPlaySoundEffect', 'submenu_leveloptions_select', 'MOUSE');
            // update the highlight state
            _MatchMapSelectionWithQuickSelect();
            if (_CheckContainerHasAnyChildChecked(_GetMapListForServerTypeAndGameMode(m_activeMapGroupSelectionPanelID))) {
                _ApplySessionSettings();
            }
        }
    }
    PlayMenu.OnMapQuickSelect = OnMapQuickSelect;
    // remove maps that aren't available from the list and return it
    function _ValidateMaps(arrMapList) {
        let arrMapTileNames = [];
        // make an array of current maptile names
        const arrMapButtons = _GetMapListForServerTypeAndGameMode(m_activeMapGroupSelectionPanelID);
        arrMapButtons.forEach(elMapTile => arrMapTileNames.push(elMapTile.GetAttributeString("mapname", "")));
        // filter the input maplist against the current maptile name list
        const filteredMapList = arrMapList.filter(strMap => arrMapTileNames.includes(strMap));
        return filteredMapList;
    }
    function _GetMapGroupsWithAttribute(strAttribute, strValue) {
        const arrNewMapgroups = [];
        const elMapGroupContainer = _GetMapTileContainer();
        $.Msg("NewMapsArray building from " + elMapGroupContainer.Children().length + " children for " + strAttribute + " = " + strValue);
        for (let elMapBtn of elMapGroupContainer.Children()) {
            const mgName = elMapBtn.GetAttributeString("mapname", "");
            if (GameTypesAPI.GetMapGroupAttribute(mgName, strAttribute) === strValue) {
                $.Msg("NewMapsArray adding " + mgName);
                arrNewMapgroups.push(mgName);
            }
        }
        $.Msg("NewMapsArray built " + arrNewMapgroups.length + " map groups");
        return arrNewMapgroups;
    }
    function _GetMapsFromQuickSelectMapGroup(mgName) {
        if (mgName === ("favorites")) {
            const mapsAsString = GameInterfaceAPI.GetSettingString('ui_playsettings_custom_preset');
            if (mapsAsString === '')
                return [];
            else {
                const arrMapList = mapsAsString.split(',');
                const filteredMapList = _ValidateMaps(arrMapList);
                // save filtered array
                if (arrMapList.length != filteredMapList.length)
                    GameInterfaceAPI.SetSettingString('ui_playsettings_custom_preset', filteredMapList.length > 0 ? filteredMapList.join(',') : "");
                return filteredMapList;
            }
        }
        else if (mgName === "new") {
            return _GetMapGroupsWithAttribute('showtagui', 'new');
        }
        else if (mgName === "hostage") {
            return _GetMapGroupsWithAttribute('icontag', 'hostage');
        }
        else if (mgName === "activeduty") {
            return _GetMapGroupsWithAttribute('grouptype', 'active').filter(x => x !== 'mg_lobby_mapveto');
        }
        else {
            return [];
        }
    }
    // see if any of the quick select buttons matches the current state of selections
    function _MatchMapSelectionWithQuickSelect() {
        // iterate through quick select buttons
        const elQuickSelectContainer = $.GetContextPanel().FindChildInLayoutFile("JsQuickSelectParent");
        if (!elQuickSelectContainer || m_isWorkshop)
            return;
        for (let elQuickBtn of elQuickSelectContainer.FindChildrenWithClassTraverse('preset-button')) {
            // get the maps from the button.
            const arrQuickSelectMaps = _GetMapsFromQuickSelectMapGroup(elQuickBtn.id);
            let bMatch = true;
            // go through all of the maps and compare select state with quickselect
            const elMapGroupContainer = _GetMapTileContainer();
            for (let i = 0; i < elMapGroupContainer.Children().length; i++) {
                const elMapBtn = elMapGroupContainer.Children()[i];
                const mapName = elMapBtn.GetAttributeString("mapname", "");
                if (elQuickBtn.id == "none") {
                    if (elMapBtn.checked) {
                        bMatch = false;
                        break;
                    }
                }
                else if (elQuickBtn.id == "all") {
                    if (!elMapBtn.checked) {
                        bMatch = false;
                        break;
                    }
                }
                else {
                    if (elMapBtn.checked != (arrQuickSelectMaps.includes(mapName))) {
                        bMatch = false;
                        break;
                    }
                }
            }
            elQuickBtn.checked = bMatch;
        }
    }
    function _LazyCreateMapListPanel() {
        const serverType = m_serverSetting;
        const gameMode = _RealGameMode();
        const panelID = _GetMapGroupPanelID();
        if (panelID in m_mapSelectionButtonContainers) {
            let bAllowReuseExistingContainer = true;
            const elExistingContainer = m_mapSelectionButtonContainers[panelID];
            // Also check if we should refresh an embedded leaderboard
            const elFriendLeaderboards = elExistingContainer ? elExistingContainer.FindChildTraverse("FriendLeaderboards") : null;
            if (elFriendLeaderboards) {
                const strEmbeddedLeaderboardName = elFriendLeaderboards.GetAttributeString("type", '');
                if (strEmbeddedLeaderboardName) {
                    LeaderboardsAPI.Refresh(strEmbeddedLeaderboardName);
                }
            }
            if (bAllowReuseExistingContainer)
                return panelID; // we can safely reuse the existing container (most of the time)
            else
                elExistingContainer.DeleteAsync(0.0); // delete old container, and fall through to recreate it
        }
        const container = $.CreatePanel("Panel", $('#MapSelectionList'), panelID, {
            class: 'map-selection-list map-selection-list--inner hidden'
        });
        container.AddClass('map-selection-list--' + serverType + '-' + gameMode);
        $.Msg("LazyCreateMapList added a container: " + gameMode + "/" + serverType + " (panel id = " + panelID + ")");
        m_mapSelectionButtonContainers[panelID] = container;
        // If there is a snippet with the required name, then load it in
        let strSnippetNameOverride;
        if (inDirectChallenge()) {
            strSnippetNameOverride = "MapSelectionContainer_directchallenge";
        }
        else if (m_gameModeSetting === 'premier') {
            strSnippetNameOverride = "MapSelectionContainer_premier";
        }
        else {
            strSnippetNameOverride = "MapSelectionContainer_" + serverType + "_" + gameMode;
        }
        if (container.BHasLayoutSnippet(strSnippetNameOverride)) { // Load the snippet since it exists to override
            $.Msg("LazyCreateMapList loading explicit container snippet: " + gameMode + "/" + serverType + " (panel id = " + panelID + ") = " + strSnippetNameOverride);
            container.BLoadLayoutSnippet(strSnippetNameOverride);
            const elMapTile = container.FindChildTraverse("MapTile");
            if (elMapTile)
                elMapTile.BLoadLayoutSnippet("MapGroupSelection");
        }
        else { // Flag that we didn't load the snippet, so we can use default layout assumptions
            strSnippetNameOverride = '';
        }
        const isPlayingOnValveOfficial = _IsValveOfficialServer(serverType);
        const arrMapGroups = _GetAvailableMapGroups(gameMode, isPlayingOnValveOfficial);
        const numTiles = arrMapGroups.length;
        if (gameMode === 'skirmish' && m_singleSkirmishMapGroup) {
            _UpdateOrCreateMapGroupTile(m_singleSkirmishMapGroup, container, null, panelID + m_singleSkirmishMapGroup, numTiles);
        }
        else {
            arrMapGroups.forEach((item, index, aMapGroups) => {
                if (gameMode === 'skirmish' && m_arrSingleSkirmishMapGroups.includes(aMapGroups[index])) {
                    return;
                }
                let elSectionContainer = null;
                elSectionContainer = container;
                if (strSnippetNameOverride)
                    elSectionContainer = container.FindChildTraverse("MapTile");
                if (elSectionContainer)
                    _UpdateOrCreateMapGroupTile(aMapGroups[index], elSectionContainer, null, panelID + aMapGroups[index], numTiles);
            });
        }
        // Handler that catches OnPropertyTransitionEndEvent event for this panel.
        $.RegisterEventHandler('PropertyTransitionEnd', container, (panel, propertyName) => {
            if (container === panel && propertyName === 'opacity' &&
                !container.id.startsWith("FriendLeaderboards")) {
                // Panel is visible and fully transparent
                if (container.visible === true && container.BIsTransparent()) {
                    container.visible = false;
                    return true;
                }
            }
            return false;
        });
        return panelID;
    }
    function _PopulateQuickSelectBar(isSearching, isHost) {
        $.Msg("---------------------- populating quick select");
        const elQuickSelectContainer = $.GetContextPanel().FindChildInLayoutFile("jsQuickSelectionSetsContainer");
        if (!elQuickSelectContainer)
            return;
        if (m_isWorkshop)
            return;
        _MatchMapSelectionWithQuickSelect();
        _EnableDisableQuickSelectBtns(isSearching, isHost);
    }
    function _EnableDisableQuickSelectBtns(isSearching, isHost) {
        const bEnable = !isSearching && isHost;
        const elQuickSelectContainer = $.GetContextPanel().FindChildInLayoutFile("JsQuickSelectParent");
        elQuickSelectContainer.FindChildrenWithClassTraverse('preset-button').forEach(element => element.enabled = bEnable);
    }
    function SaveMapSelectionToCustomPreset(bSilent = false) {
        // skip if direct challenge mode
        if (inDirectChallenge())
            return;
        //skip if in premier
        if (m_gameModeSetting === 'premier')
            return;
        if (!LobbyAPI.BIsHost())
            return;
        const selectedMaps = _GetSelectedMapsForServerTypeAndGameMode(m_serverSetting, _RealGameMode(), true);
        if (selectedMaps === "") {
            if (!bSilent)
                $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.buymenu_failure', 'MOUSE');
            _NoMapSelectedPopup();
            return;
        }
        GameInterfaceAPI.SetSettingString('ui_playsettings_custom_preset', selectedMaps);
        if (!bSilent) {
            $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.generic_button_press', 'MOUSE');
            $.GetContextPanel().FindChildInLayoutFile("jsQuickSelectionSave").TriggerClass('save');
        }
        _MatchMapSelectionWithQuickSelect();
    }
    PlayMenu.SaveMapSelectionToCustomPreset = SaveMapSelectionToCustomPreset;
    function _GetPanelTypeForMapGroupTile(gameMode, singleSkirmishMapGroup) {
        const bIsCompetitive = gameMode === 'competitive';
        const bIsWingman = gameMode === 'scrimcomp2v2';
        return (((bIsCompetitive || bIsWingman) && _IsValveOfficialServer(m_serverSetting)) ? "ToggleButton" : "RadioButton");
    }
    function _UpdateOrCreateMapGroupTile(mapGroupName, container, elTilePanel, newTileID, numTiles) {
        const mg = GetMGDetails(mapGroupName);
        if (!mg)
            return;
        let p = elTilePanel;
        if (!p) {
            const panelType = _GetPanelTypeForMapGroupTile(_RealGameMode(), m_singleSkirmishMapGroup);
            const panelID = newTileID ? newTileID : (container.id + mapGroupName);
            p = $.CreatePanel(panelType, container, panelID);
            p.BLoadLayoutSnippet("MapGroupSelection");
            if (panelType === "RadioButton") {
                // What is my radio group ID?
                let radioGroupID;
                if (panelID.endsWith(mapGroupName))
                    radioGroupID = panelID.substring(0, panelID.length - mapGroupName.length);
                else
                    radioGroupID = container.id;
                const group = "radiogroup_" + radioGroupID;
                p.SetAttributeString("group", group);
            }
        }
        p.SetAttributeString("mapname", mapGroupName);
        p.SetPanelEvent('onactivate', () => _OnActivateMapOrMapGroupButton(p));
        p.SetHasClass('map-selection-btn-activedutymap', mg.grouptype === 'active');
        p.FindChildInLayoutFile('ActiveGroupIcon').visible = mg.grouptype === 'active';
        p.FindChildInLayoutFile('MapGroupName').text = $.Localize(mg.nameID);
        UpdateIconsAndScreenshots(p, numTiles, mapGroupName, mg);
        return p;
    }
    function _UpdateRatingEmblem(p, mapGroupName) {
        let elRatingEmblem = p.FindChildTraverse('jsRatingEmblem');
        if (!elRatingEmblem || !elRatingEmblem.IsValid())
            return;
        elRatingEmblem.visible = m_serverSetting == 'official' &&
            m_gameModeSetting === 'competitive' &&
            !m_isWorkshop &&
            LobbyAPI.GetSessionSettings() &&
            LobbyAPI.GetSessionSettings().hasOwnProperty('game') &&
            LobbyAPI.GetSessionSettings().game.hasOwnProperty('prime') &&
            LobbyAPI.GetSessionSettings().game.prime;
        let pmso = MyPersonaAPI.GetCompetitivePerMapStatsObject();
        let score = pmso[mapGroupName] ? pmso[mapGroupName]["skillgroup"] : -1;
        let wins = pmso[mapGroupName] ? pmso[mapGroupName]["wins"] : -1;
        let options = {
            root_panel: p,
            //	xuid: MyPersonaAPI.GetXuid(),
            //	api: 'mypersona',
            rating_type: 'Competitive',
            rating_map: mapGroupName,
            full_details: true,
            leaderboard_details: { score: score, matchesWon: wins },
            local_player: true
        };
        RatingEmblem.SetXuid(options);
        let winCountString = RatingEmblem.GetWinCountString(p);
        p.SetDialogVariable('map-win-count', winCountString);
        p.SetHasClass('show-win-count', winCountString != '');
    }
    function UpdateIconsAndScreenshots(p, numTiles, mapGroupName, mg) {
        const keysList = Object.keys(mg.maps);
        const iconSize = 200; // HACK make them big enough so they can be resized
        const iconPath = mapGroupName === 'random_classic' ? 'file://{images}/icons/ui/random_map.svg' : 'file://{images}/' + mg.icon_image_path + '.svg';
        let mapGroupIcon = p.FindChildInLayoutFile('MapSelectionButton').FindChildInLayoutFile('MapGroupCollectionIcon');
        if (keysList.length < 2) {
            if (mapGroupIcon) {
                mapGroupIcon.SetImage(iconPath);
            }
            else {
                mapGroupIcon = $.CreatePanel('Image', p.FindChildInLayoutFile('MapSelectionButton'), 'MapGroupCollectionIcon', {
                    defaultsrc: 'file://{images}/icons/ui/random_map.svg',
                    texturewidth: iconSize,
                    textureheight: iconSize,
                    src: iconPath,
                    class: 'map-selection-btn__map-icon'
                });
                p.FindChildInLayoutFile('MapSelectionButton').MoveChildBefore(mapGroupIcon, p.FindChildInLayoutFile('MapGroupCollectionMultiIcons'));
            }
        }
        let mapImage = null;
        let mapIcon = null;
        if (mapGroupName === 'random_classic') {
            mapImage = p.FindChildInLayoutFile('MapGroupImagesCarousel').FindChildInLayoutFile('MapSelectionScreenshot');
            if (!mapImage) {
                mapImage = $.CreatePanel('Panel', p.FindChildInLayoutFile('MapGroupImagesCarousel'), 'MapSelectionScreenshot');
                mapImage.AddClass('map-selection-btn__screenshot');
            }
            mapImage.style.backgroundImage = 'url("file://{images}/map_icons/screenshots/360p/random.png")';
            mapImage.style.backgroundPosition = '50% 0%';
            mapImage.style.backgroundSize = 'auto 100%';
        }
        _SetMapGroupModifierLabelElements(mapGroupName, p);
        // Add map images to carousel.
        for (let i = 0; i < keysList.length; i++) {
            mapImage = p.FindChildInLayoutFile('MapGroupImagesCarousel').FindChildInLayoutFile('MapSelectionScreenshot' + i);
            if (!mapImage) {
                mapImage = $.CreatePanel('Panel', p.FindChildInLayoutFile('MapGroupImagesCarousel'), 'MapSelectionScreenshot' + i);
                mapImage.AddClass('map-selection-btn__screenshot');
            }
            if (m_gameModeSetting === 'survival' || m_gameModeSetting === 'rush') {
                mapImage.style.backgroundImage = 'url("file://{resources}/videos/' + keysList[i] + '_preview.webm")';
            }
            else {
                mapImage.style.backgroundImage = 'url("file://{images}/map_icons/screenshots/720p/' + keysList[i] + '.png")';
            }
            mapImage.style.backgroundPosition = '50% 0%';
            mapImage.style.backgroundSize = 'auto 100%';
            // This is for map groups icons
            if (keysList.length > 1) {
                const mapIconsContainer = p.FindChildInLayoutFile('MapGroupCollectionMultiIcons');
                mapIconsContainer.SetHasClass('left-right-flow-wrap', numTiles === 1);
                mapIconsContainer.SetHasClass('top-bottom-flow-wrap', numTiles > 1);
                const subMapIconImagePanelID = 'MapIcon' + i;
                mapIcon = mapIconsContainer.FindChildInLayoutFile(subMapIconImagePanelID);
                if (!mapIcon) {
                    mapIcon = $.CreatePanel('Image', mapIconsContainer, subMapIconImagePanelID, {
                        defaultsrc: 'file://{images}/map_icons/map_icon_NONE.png',
                        texturewidth: iconSize,
                        textureheight: iconSize,
                        src: 'file://{images}/map_icons/map_icon_' + keysList[i] + '.svg'
                    });
                }
                mapIcon.AddClass('map-selection-btn__map-icon');
                IconUtil.SetupFallbackMapIcon(mapIcon, 'file://{images}/map_icons/map_icon_' + keysList[i]);
            }
        }
        // Tooltip
        if (mg.tooltipID) {
            let pid = p.id;
            let tooltipID = mg.tooltipID;
            p.SetPanelEvent('onmouseover', () => OnMouseOverMapTile(pid, tooltipID, keysList));
            p.SetPanelEvent('onmouseout', OnMouseOutMapTile);
        }
    }
    function OnMouseOverMapTile(id, tooltipText, mapsList) {
        tooltipText = $.Localize(tooltipText);
        const mapNamesList = [];
        if (mapsList.length > 1) {
            for (let element of mapsList) {
                mapNamesList.push($.Localize('#SFUI_Map_' + element));
            }
            const mapGroupsText = mapNamesList.join(', ');
            tooltipText = tooltipText + '<br><br>' + mapGroupsText;
        }
        UiToolkitAPI.ShowTextTooltip(id, tooltipText);
    }
    function OnMouseOutMapTile() {
        UiToolkitAPI.HideTextTooltip();
    }
    let m_timerMapGroupHandler = null;
    function _GetRotatingMapGroupStatus(gameMode, singleSkirmishMapGroup, mapgroupname) {
        m_timerMapGroupHandler = null;
        const strSchedule = CompetitiveMatchAPI.GetRotatingOfficialMapGroupCurrentState(gameMode);
        const elTimer = m_mapSelectionButtonContainers[m_activeMapGroupSelectionPanelID].FindChildInLayoutFile('PlayMenuMapRotationTimer');
        if (elTimer) {
            if (strSchedule) {
                const strCurrentMapGroup = strSchedule.split("+")[0];
                const numSecondsRemaining = strSchedule.split("+")[1].split("=")[0];
                const strNextMapGroup = strSchedule.split("=")[1];
                const numWait = FormatText.SecondsToDDHHMMSSWithSymbolSeperator(numSecondsRemaining);
                if (!numWait) {
                    elTimer.AddClass('hidden');
                    return;
                }
                elTimer.RemoveClass('hidden');
                elTimer.SetDialogVariable('map-rotate-timer', numWait);
                const mg = GetMGDetails(strNextMapGroup);
                elTimer.SetDialogVariable('next-mapname', $.Localize(mg.nameID));
                // Find the existing map panel.
                // When the we switch maps recreate the map tile with the appropriate strCurrentMapGroup content.
                const mapGroupPanelID = _GetMapGroupPanelID() + strCurrentMapGroup;
                const mapGroupContainer = m_mapSelectionButtonContainers[m_activeMapGroupSelectionPanelID].FindChildTraverse('MapTile');
                const mapGroupPanel = mapGroupContainer.FindChildInLayoutFile(mapGroupPanelID);
                if (!mapGroupPanel) {
                    mapGroupContainer.RemoveAndDeleteChildren();
                    const btnMapGroup = _UpdateOrCreateMapGroupTile(strCurrentMapGroup, mapGroupContainer, null, mapGroupPanelID, 1);
                    // Since this is the only map group in the survival category then select it.
                    btnMapGroup.checked = true;
                    _UpdateSurvivalAutoFillSquadBtn(m_gameModeSetting);
                }
                m_timerMapGroupHandler = $.Schedule(1, () => _GetRotatingMapGroupStatus(gameMode, singleSkirmishMapGroup, mapgroupname));
            }
            else {
                elTimer.AddClass('hidden');
            }
        }
    }
    function _StartRotatingMapGroupTimer() {
        _CancelRotatingMapGroupSchedule();
        const activeMapGroup = m_activeMapGroupSelectionPanelID;
        if (_RealGameMode() === "survival"
            && m_mapSelectionButtonContainers && m_mapSelectionButtonContainers[activeMapGroup]
            && m_mapSelectionButtonContainers[activeMapGroup].Children()) {
            const btnSelectedMapGroup = m_mapSelectionButtonContainers[activeMapGroup].Children().filter(entry => entry.GetAttributeString('mapname', '') !== '');
            if (btnSelectedMapGroup[0]) {
                const mapSelectedGroupName = btnSelectedMapGroup[0].GetAttributeString('mapname', '');
                if (mapSelectedGroupName) {
                    _GetRotatingMapGroupStatus(_RealGameMode(), m_singleSkirmishMapGroup, mapSelectedGroupName);
                }
            }
        }
    }
    function _CancelRotatingMapGroupSchedule() {
        if (m_timerMapGroupHandler) {
            $.CancelScheduled(m_timerMapGroupHandler);
            m_timerMapGroupHandler = null;
        }
    }
    function _SetMapGroupModifierLabelElements(mapName, elMapPanel) {
        const isNew = (GameTypesAPI.GetMapGroupAttribute(mapName, 'showtagui') === 'new');
        elMapPanel.FindChildInLayoutFile('MapGroupNewTag').SetHasClass('hidden', !isNew || mapName === "mg_lobby_mapveto");
        elMapPanel.FindChildInLayoutFile('MapSelectionTopRowIcons').SetHasClass('tall', mapName === "mg_lobby_mapveto");
    }
    function _ReloadLeaderboardLayoutGivenSettings(container, lbName, strTitleOverride, strPointsTitle) {
        const elFriendLeaderboards = container.FindChildTraverse("FriendLeaderboards");
        $.Msg("Reloading embedded friends leaderboard " + lbName + " title=" + (strTitleOverride ? strTitleOverride : "<none>") + " (points = " + (strPointsTitle ? strPointsTitle : "<default>") + ")");
        elFriendLeaderboards.SetAttributeString("type", lbName + ".friends");
        if (strPointsTitle)
            elFriendLeaderboards.SetAttributeString("points-title", strPointsTitle);
        if (strTitleOverride)
            elFriendLeaderboards.SetAttributeString("titleoverride", strTitleOverride);
        elFriendLeaderboards.BLoadLayout('file://{resources}/layout/popups/popup_leaderboards.xml', true, false);
        elFriendLeaderboards.AddClass('leaderboard_embedded');
        elFriendLeaderboards.RemoveClass('Hidden');
    }
    function _UpdateMapGroupButtons(isEnabled, isSearching, isHost) {
        const panelID = _LazyCreateMapListPanel();
        // Update wait time for queued modes
        switch (_IsPlayingOnValveOfficial() ? _RealGameMode() : '') {
            case 'competitive':
            case 'scrimcomp2v2':
            case 'rush':
                _UpdateWaitTime(_GetMapListForServerTypeAndGameMode(panelID));
                break;
        }
        if (!inDirectChallenge())
            _SetEnabledStateForMapBtns(m_mapSelectionButtonContainers[panelID], isSearching, isHost);
        // Select this panel
        m_activeMapGroupSelectionPanelID = panelID;
        _ShowActiveMapSelectionTab(isEnabled);
        _PopulateQuickSelectBar(isSearching, isHost);
    }
    function _SelectMapButtonsFromSettings(settings) {
        m_selectedPracticeMap = '';
        // Set mapgroup from selected panels on active map selection list
        const mapsGroups = settings.game.mapgroupname.split(',');
        const aListMaps = _GetMapListForServerTypeAndGameMode(m_activeMapGroupSelectionPanelID);
        for (let e of aListMaps) {
            // For all buttons who represent a mapgroup that is currently selected
            const mapName = e.GetAttributeString("mapname", "invalid");
            e.checked = mapsGroups.includes(mapName);
            if (m_serverSetting === 'listen' && e.checked) {
                // save the selected practice map for annotations
                m_selectedPracticeMap = mapName.replace(/^mg_/, '');
            }
        }
    }
    function _ShowHideStartSearchBtn(isSearching, isHost) {
        let bShow = !isSearching && isHost ? true : false;
        const btnStartSearch = $.GetContextPanel().FindChildInLayoutFile('StartMatchBtn');
        // 'pressed' and 'hidden' both control the visiblilty of the Button.
        // 'pressed' plays an animation that fades the button out so if we are in that state we
        // and want to show we want to remove that class.
        if (bShow) {
            if (btnStartSearch.BHasClass('pressed')) {
                btnStartSearch.RemoveClass('pressed');
            }
            btnStartSearch.RemoveClass('hidden');
        }
        // If we are already hiding the button by the user having 'pressed' it then don't hide it immediately
        // because the pressed anim will not finish.
        else if (!btnStartSearch.BHasClass('pressed')) {
            btnStartSearch.AddClass('hidden');
        }
    }
    function _ShowCancelSearchButton(isSearching, isHost) {
        const btnCancel = $.GetContextPanel().FindChildInLayoutFile('PartyCancelBtn');
        btnCancel.enabled = (isSearching && isHost);
        if (!btnCancel.enabled)
            ParticleControls.UpdateActionBar(m_PlayMenuActionBarParticleFX, "RmoveBtnEffects");
    }
    function _UpdatePracticeSettingsBtns(isSearching, isHost) {
        // Set up practice settings
        let elPracticeSettingsContainer = $('#id-play-menu-practicesettings-container');
        let sessionSettings = LobbyAPI.GetSessionSettings();
        let bForceHidden = (m_serverSetting !== 'listen') || m_isWorkshop || !LobbyAPI.IsSessionActive() || !sessionSettings;
        let bAnnotationAvailable = true; // GameInterfaceAPI.IsMapAnnotationAvailable( m_selectedPracticeMap );
        let bAnnotationSelected = GameInterfaceAPI.GetSettingString('ui_playsettings_listen_annotations') === '1';
        let elAnnotationDropDown = $('#id-play-menu-practicesettings-annotations-dropdown');
        elAnnotationDropDown.RebuildOptions(m_selectedPracticeMap, false);
        let elAnnotationsDropDown = elPracticeSettingsContainer.FindChildTraverse('id-play-menu-practicesettings-annotations-dropdown');
        for (let elChild of elPracticeSettingsContainer.Children()) {
            if (!elChild.id.startsWith('id-play-menu-practicesettings-'))
                continue;
            let strFeatureName = elChild.id;
            strFeatureName = strFeatureName.replace('id-play-menu-practicesettings-', '');
            strFeatureName = strFeatureName.replace('-tooltip', '');
            // "id-play-menu-practicesettings-grenades-tooltip" => '#practicesettings_*grenades*_button'
            let elFeatureFrame = elChild.FindChildTraverse('id-play-menu-practicesettings-' + strFeatureName);
            let elFeatureSliderBtn = elFeatureFrame.FindChildTraverse('id-slider-btn');
            // We hide and exit if you are not playing offline pracitce
            if (strFeatureName === "annotations") {
                elAnnotationsDropDown.enabled = bAnnotationAvailable && bAnnotationSelected;
            }
            if (bForceHidden || (sessionSettings.game.type !== 'classic')) {
                elChild.visible = false;
                continue;
            }
            if (strFeatureName === "annotations" && !bAnnotationAvailable) {
                elChild.visible = true;
                elFeatureSliderBtn.enabled = false;
                elFeatureSliderBtn.checked = false;
                continue;
            }
            elChild.visible = true;
            elFeatureSliderBtn.enabled = isHost && !isSearching;
            let curvalue = 0;
            if (sessionSettings && sessionSettings.options && sessionSettings.options.hasOwnProperty('practicesettings_' + strFeatureName)) {
                // already set which means both sessions setting and CVAR are in sync
                curvalue = sessionSettings.options['practicesettings_' + strFeatureName];
            }
            else {
                // get it from ui convar
                curvalue = GameInterfaceAPI.GetSettingString('ui_playsettings_listen_' + strFeatureName) === '1' ? 1 : 0;
                if (curvalue === 1) {
                    // only need to update the session setting if CVAR is not the default value 0
                    const setting = 'practicesettings_' + strFeatureName;
                    const newSettings = { update: { options: {} } };
                    newSettings.update.options[setting] = curvalue;
                    LobbyAPI.UpdateSessionSettings(newSettings);
                }
            }
            elFeatureSliderBtn.checked = curvalue ? true : false;
            if (strFeatureName === "grenades" || strFeatureName === "infammo" || strFeatureName === "infwarmup") {
                if (bAnnotationAvailable && bAnnotationSelected) {
                    elFeatureSliderBtn.enabled = false;
                    elFeatureSliderBtn.checked = true;
                }
            }
        }
    }
    function _UpdatePrimeBtn(isSearching, isHost) {
        const elPrimePanel = $('#PrimeStatusPanel');
        const elGetPrimeBtn = $('#id-play-menu-get-prime');
        const elPrimeStatus = $('#PrimeStatusLabelContainer');
        // We hide and exit if you are not playing official or you are not connected to GC
        if (!_IsPlayingOnValveOfficial() || !MyPersonaAPI.IsInventoryValid() || inDirectChallenge() || m_isWorkshop) {
            elPrimePanel.visible = false;
            return;
        }
        const LocalPlayerHasPrime = PartyListAPI.GetFriendPrimeEligible(MyPersonaAPI.GetXuid());
        // Show panel
        elPrimePanel.visible = true;
        elPrimePanel.SetHasClass('play-menu-prime-logo-bg', LocalPlayerHasPrime);
        // Show or hide the prime relevent panels based on if you have prime
        elGetPrimeBtn.visible = !LocalPlayerHasPrime;
        elPrimeStatus.visible = LocalPlayerHasPrime;
        // Don't have prime show set the upsell button
        if (!LocalPlayerHasPrime) {
            const sPrice = StoreAPI.GetStoreItemSalePrice(InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(1353, 0), 1, '');
            elGetPrimeBtn.SetDialogVariable("price", sPrice ? sPrice : '$0');
            elGetPrimeBtn.SetPanelEvent('onactivate', () => {
                UiToolkitAPI.HideTextTooltip();
                UiToolkitAPI.ShowCustomLayoutPopup('prime_status', 'file://{resources}/layout/popups/popup_prime_status.xml');
            });
        }
    }
    function _UpdatePermissionBtnText(settings, isEnabled) {
        let elBtnContainer = $('#PermissionsSettings');
        let elBtn = elBtnContainer.FindChild("id-slider-btn");
        elBtn.SetDialogVariable('slide_toggle_text', $.Localize("#permissions_open_party"));
        elBtn.SetSelected(settings.system.access === 'public');
        // Disable if you are a client or searching
        elBtn.enabled = isEnabled;
    }
    function _UpdateLeaderboardBtn(gameMode, isOfficalMatchmaking = false) {
        const elLeaderboardButton = $('#PlayMenulLeaderboards');
        //DEVONLY{
        if (gameMode === 'survival' && _IsPlayingOnValveOfficial()) {
            elLeaderboardButton.visible = true;
            function _OnActivate() {
                UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_leaderboards.xml', 'type=official_leaderboard_survival_squads,official_leaderboard_survival_solo' +
                    '&' + 'titleoverride=#CSGO_official_leaderboard_survival_title' +
                    '&' + 'showglobaloverride=false' +
                    '&' + 'points-title=#Cstrike_TitlesTXT_WINS');
            }
            ;
            elLeaderboardButton.SetPanelEvent('onactivate', _OnActivate);
        }
        else 
        //}DEVONLY
        {
            elLeaderboardButton.visible = false;
        }
    }
    function _UpdateReplayNewUserTrainingBtn(gameMode) {
        const elButton = $('#PlayMenuReplayNewUserTrainingButton');
        if (gameMode === 'competitive' && m_serverSetting === 'listen' && !m_isWorkshop) {
            elButton.visible = true;
            elButton.SetPanelEvent('onactivate', () => {
                UiToolkitAPI.ShowGenericPopupOkCancel('#ForceNewUserTraining_title', '#ForceNewUserTraining_text', '', () => $.Schedule(0.1, () => {
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
                }), () => { });
            });
        }
        else {
            elButton.visible = false;
        }
    }
    function _UpdateSurvivalAutoFillSquadBtn(gameMode) {
        const elBtn = $('#SurvivalAutoSquadToggle');
        if (!elBtn) {
            return;
        }
        if (gameMode === 'survival' && _IsPlayingOnValveOfficial() && (PartyListAPI.GetCount() <= 1)) {
            elBtn.visible = true;
            const bAutoFill = !(GameInterfaceAPI.GetSettingString('ui_playsettings_survival_solo') === '1');
            elBtn.checked = bAutoFill;
            elBtn.enabled = !_IsSearching();
            function _OnActivate() {
                const bAutoFill = !(GameInterfaceAPI.GetSettingString('ui_playsettings_survival_solo') === '1');
                GameInterfaceAPI.SetSettingString('ui_playsettings_survival_solo', bAutoFill ? '1' : '0');
                _UpdateSurvivalAutoFillSquadBtn('survival');
            }
            elBtn.SetPanelEvent('onactivate', _OnActivate);
        }
        else {
            elBtn.visible = false;
        }
        if (gameMode === 'survival') {
            const lbType = ((elBtn.visible && !elBtn.checked) ? 'solo' : 'squads');
            const lbName = "official_leaderboard_survival_" + lbType;
            const container = elBtn.GetParent().GetParent();
            const elFriendLeaderboards = container.FindChildTraverse("FriendLeaderboards");
            const sPreviousType = elFriendLeaderboards.GetAttributeString("type", '');
            if (!sPreviousType || !sPreviousType.startsWith(lbName)) {
                $.Msg("Reloading survival leaderboard (old type = " + sPreviousType + ", new type = " + lbName + ")");
                _ReloadLeaderboardLayoutGivenSettings(container, lbName, "#CSGO_official_leaderboard_survival_" + lbType, "#Cstrike_TitlesTXT_WINS");
            }
        }
    }
    function _UpdateRushFriendLeaderboards(gameMode) {
        const elRoot = $('#gameModeButtonContainer_rush_official');
        if (!elRoot)
            return;
        if (gameMode === 'rush') {
            const lbType = 'solo'; // ( ( elBtn.visible && !elBtn.checked ) ? 'solo' : 'squads' );
            const lbName = "official_leaderboard_rush_" + lbType;
            const elFriendLeaderboards = elRoot.FindChildTraverse("FriendLeaderboards");
            const sPreviousType = elFriendLeaderboards.GetAttributeString("type", '');
            if (!sPreviousType || !sPreviousType.startsWith(lbName)) {
                $.Msg("Reloading rush leaderboard (old type = " + sPreviousType + ", new type = " + lbName + ")");
                _ReloadLeaderboardLayoutGivenSettings(elRoot, lbName, "#CSGO_official_leaderboard_rush_" + lbType, "#Cstrike_TitlesTXT_WINS");
            }
        }
    }
    function _SetEnabledStateForMapBtns(elMapList, isSearching, isHost) {
        elMapList.SetHasClass('is-client', (isSearching || !isHost));
        const childrenList = _GetMapListForServerTypeAndGameMode();
        const bEnable = !isSearching && isHost;
        for (let element of childrenList) {
            if (!element.BHasClass('no-lock')) {
                element.enabled = bEnable;
            }
        }
    }
    function _UpdateWaitTime(elMapList) {
        const childrenList = elMapList;
        for (let i = 0; i < childrenList.length; i++) {
            const elWaitTime = childrenList[i].FindChildTraverse('MapGroupWaitTime');
            const mapName = childrenList[i].GetAttributeString("mapname", "invalid");
            if (mapName === 'invalid') {
                continue;
            }
            const seconds = LobbyAPI.GetMapWaitTimeInSeconds(_RealGameMode(), mapName);
            const numWait = FormatText.SecondsToDDHHMMSSWithSymbolSeperator(seconds);
            if (numWait) {
                elWaitTime.SetDialogVariable("time", numWait);
                elWaitTime.FindChild('MapGroupWaitTimeLabel').text = $.Localize('#matchmaking_expected_wait_time', elWaitTime);
                elWaitTime.RemoveClass('hidden');
            }
            else {
                elWaitTime.AddClass('hidden');
            }
        }
    }
    function _SelectActivePlayPlayTypeBtn() {
        const aPlayTypeBtns = $('#PlayTypeTopNav').Children();
        for (let btn of aPlayTypeBtns) {
            if (m_activeMapGroupSelectionPanelID === k_workshopPanelId) {
                btn.checked = btn.id === 'PlayWorkshop';
            }
            else {
                btn.checked = btn.id === 'Play-' + m_serverSetting;
            }
        }
    }
    function _IsValveOfficialServer(serverType) {
        return serverType === "official" ? true : false;
    }
    function _IsPlayingOnValveOfficial() {
        return _IsValveOfficialServer(m_serverSetting);
    }
    function _IsSearching() {
        const searchingStatus = LobbyAPI.GetMatchmakingStatusString();
        return searchingStatus !== '' && searchingStatus !== undefined ? true : false;
    }
    // Reads the state of the buttons and returns the maplist
    function _GetSelectedMapsForServerTypeAndGameMode(serverType, gameMode, bDontToggleMaps = false) {
        const isPlayingOnValveOfficial = _IsValveOfficialServer(serverType);
        const aListMapPanels = _GetMapListForServerTypeAndGameMode();
        // After fresh game launch if we go to a different game mode tab then initialize buttons from our preferences
        if (!_CheckContainerHasAnyChildChecked(aListMapPanels)) {
            let preferencesMapsForThisMode = GameInterfaceAPI.GetSettingString('ui_playsettings_maps_' + serverType + '_' + gameMode);
            // if no settings for this mode that's ok?
            if (!preferencesMapsForThisMode)
                preferencesMapsForThisMode = '';
            const savedMapIds = preferencesMapsForThisMode.split(',');
            for (let strMapNameIndividual of savedMapIds) {
                const mapsWithThisName = aListMapPanels.filter((map) => {
                    const mapName = map.GetAttributeString("mapname", "invalid");
                    return mapName === strMapNameIndividual;
                });
                if (mapsWithThisName.length > 0) {
                    if (!bDontToggleMaps)
                        mapsWithThisName[0].checked = true;
                }
            }
            if (aListMapPanels.length > 0 && !_CheckContainerHasAnyChildChecked(aListMapPanels)) {
                if (!bDontToggleMaps)
                    aListMapPanels[0].checked = true;
            }
        }
        // Rush displays a single tile, but queue is for all map groups
        if ((serverType === 'official' && gameMode === 'survival')
            || (gameMode === 'rush')) { // THIS DOES NOT CARE ABOUT SELECTED TILES IN THE UI
            return GameInterfaceAPI.GetSettingString('ui_playsettings_maps_' + serverType + '_' + gameMode);
        }
        const selectedMaps = aListMapPanels.filter((e) => {
            // For all selected maps (only >1 in competitive queues)
            return e.checked;
        })
            .reduce((accumulator, e) => {
            // make a comma delimited string of selections
            const mapName = e.GetAttributeString("mapname", "invalid");
            return (accumulator) ? (accumulator + "," + mapName) : mapName;
        }, '');
        return selectedMaps;
    }
    function _GetMapListForServerTypeAndGameMode(mapGroupOverride = null) {
        const mapGroupPanelID = !mapGroupOverride ? _LazyCreateMapListPanel() : mapGroupOverride;
        const elParent = m_mapSelectionButtonContainers[mapGroupPanelID];
        if (_RealGameMode() === 'competitive' && elParent.GetAttributeString('hassections', '')) {
            let aListMapPanels = [];
            for (let section of elParent.Children()) {
                for (let tile of section.Children()) {
                    if (tile.id != 'play-maps-section-header-container') {
                        aListMapPanels.push(tile);
                    }
                }
            }
            return aListMapPanels;
        }
        else if ((_IsPlayingOnValveOfficial() && (_RealGameMode() === 'survival'
            || _RealGameMode() === 'cooperative'
            || _RealGameMode() === 'coopmission'))
            || (_RealGameMode() === 'rush')) {
            let elMapTile = elParent.FindChildTraverse("MapTile");
            if (elMapTile)
                return elMapTile.Children();
            else
                return elParent.Children();
        }
        else {
            return elParent.Children();
        }
    }
    function _GetSelectedWorkshopMapButtons() {
        const mapGroupPanelID = _LazyCreateWorkshopTab();
        const mapContainer = m_mapSelectionButtonContainers[mapGroupPanelID];
        const children = mapContainer.Children();
        if (children.length == 0 || !children[0].GetAttributeString('group', "")) {
            // No workshop maps
            return [];
        }
        // After fresh game launch if we go to a different game mode tab then initialize buttons from our preferences
        if (!_CheckContainerHasAnyChildChecked(children)) {
            let preferencesMapsForThisMode = GameInterfaceAPI.GetSettingString('ui_playsettings_maps_workshop');
            // if no settings for this mode that's ok?
            if (!preferencesMapsForThisMode)
                preferencesMapsForThisMode = '';
            const savedMapIds = preferencesMapsForThisMode.split(',');
            for (let strMapNameIndividual of savedMapIds) {
                const mapsWithThisName = children.filter((map) => {
                    const mapName = map.GetAttributeString("mapname", "invalid");
                    return mapName === strMapNameIndividual;
                });
                if (mapsWithThisName.length > 0) {
                    mapsWithThisName[0].checked = true;
                }
            }
            if (!_CheckContainerHasAnyChildChecked(children) && children.length > 0) {
                children[0].checked = true;
            }
        }
        const selectedMaps = children.filter((e) => {
            // For all selected maps (only >1 in competitive queues)
            return e.checked;
        });
        return Array.from(selectedMaps);
    }
    function _GetSelectedWorkshopMap() {
        const mapButtons = _GetSelectedWorkshopMapButtons();
        const selectedMaps = mapButtons.reduce((accumulator, e) => {
            // make a comma delimited string of selections
            const mapName = e.GetAttributeString("mapname", "invalid");
            return (accumulator) ? (accumulator + "," + mapName) : mapName;
        }, '');
        return selectedMaps;
    }
    function _GetSingleSkirmishIdFromMapGroup(mapGroup) {
        return mapGroup.replace('mg_skirmish_', '');
    }
    function _GetSingleSkirmishMapGroupFromId(skirmishId) {
        return 'mg_skirmish_' + skirmishId;
    }
    function _GetSingleSkirmishIdFromSingleSkirmishString(entry) {
        return entry.replace('skirmish_', '');
    }
    function _GetSingleSkirmishMapGroupFromSingleSkirmishString(entry) {
        return _GetSingleSkirmishMapGroupFromId(_GetSingleSkirmishIdFromSingleSkirmishString(entry));
    }
    function _IsSingleSkirmishString(entry) {
        return entry.startsWith('skirmish_');
    }
    //--------------------------------------------------------------------------------------------------
    // Check if container has any child buttons selected
    //--------------------------------------------------------------------------------------------------
    function _CheckContainerHasAnyChildChecked(aMapList) {
        if (aMapList.length < 1)
            return false;
        return aMapList.filter(map => map.checked).length > 0;
    }
    //--------------------------------------------------------------------------------------------------
    // Validates session settings and fixes any problems
    //--------------------------------------------------------------------------------------------------
    function _ValidateSessionSettings() {
        if (m_isWorkshop) {
            // workshop is only available offline
            m_serverSetting = "listen";
        }
        if (!_IsGameModeAvailable(m_serverSetting, m_gameModeSetting)) {
            // Try to get an available game mode from the user setting first
            m_gameModeSetting = GameInterfaceAPI.GetSettingString("ui_playsettings_mode_" + m_serverSetting);
            m_singleSkirmishMapGroup = null;
            if (_IsSingleSkirmishString(_RealGameMode())) {
                m_singleSkirmishMapGroup = _GetSingleSkirmishMapGroupFromSingleSkirmishString(_RealGameMode());
                m_gameModeSetting = 'skirmish';
            }
            if (!_IsGameModeAvailable(m_serverSetting, m_gameModeSetting)) {
                $.Msg('_ValidateSessionSettings doing brute force search because [[ ' + m_serverSetting + ' ' + m_gameModeSetting + ' ]] is unavailable');
                //
                // Make sure this code matches :: uicomponent_settings.cpp
                // UI_SETTINGS_CVAR_ALIAS_WITH_GET_FILTER_FUNC( ui_playsettings_mode_official
                //
                // illegal server/mode combination.
                //
                // find an available mode (using double-quotes to copy/paste with C++)
                const modes = [
                    "premier",
                    "competitive",
                    "scrimcomp2v2",
                    "casual",
                    "deathmatch",
                ];
                for (let i = 0; i < modes.length; i++) {
                    if (_IsGameModeAvailable(m_serverSetting, modes[i])) {
                        m_gameModeSetting = modes[i];
                        m_singleSkirmishMapGroup = null;
                        break;
                    }
                }
            }
        }
        // we don't have a valid setting so read one from disk
        if (!m_gameModeFlags[m_serverSetting + _RealGameMode()])
            _LoadGameModeFlagsFromSettings();
        // filter gamemodeflag values if this mode uses flags
        if (GameModeFlags.DoesModeUseFlags(_RealGameMode())) {
            if (!GameModeFlags.AreFlagsValid(_RealGameMode(), m_gameModeFlags[m_serverSetting + _RealGameMode()])) {
                _setAndSaveGameModeFlags(0);
                $.Msg("Bad gamemodeflag for " + _RealGameMode() + ": " + m_gameModeFlags[m_serverSetting + _RealGameMode()]);
            }
        }
    }
    function _LoadGameModeFlagsFromSettings() {
        m_gameModeFlags[m_serverSetting + _RealGameMode()] = parseInt(GameInterfaceAPI.GetSettingString('ui_playsettings_flags_' + m_serverSetting + '_' + _RealGameMode()));
    }
    //--------------------------------------------------------------------------------------------------
    // Applies all the session settings
    //--------------------------------------------------------------------------------------------------
    function _ApplySessionSettings() {
        if (m_serverSetting === 'official' && !m_isWorkshop && !inDirectChallenge()) {
            if (m_gameModeSetting === 'scrimcomp2v2') { // Ensure that my rank for Wingman is fetched before I advertise as a player for hire
                MyPersonaAPI.HintLoadPipRanks('wingman');
            }
            else if (m_gameModeSetting === 'competitive') {
                MyPersonaAPI.HintLoadPipRanks('competitive');
            }
        }
        if (!LobbyAPI.BIsHost()) {
            return;
        }
        // Fix any problem settings (invalid game modes, etc)
        _ValidateSessionSettings();
        const serverType = m_serverSetting;
        let gameMode = _RealGameMode();
        let gameModeFlags = m_gameModeFlags[m_serverSetting + gameMode] ? m_gameModeFlags[m_serverSetting + gameMode] : 0;
        let primePreference = PartyListAPI.GetFriendPrimeEligible(MyPersonaAPI.GetXuid()) ? 1 : 0;
        let selectedMaps;
        if (m_isWorkshop)
            selectedMaps = _GetSelectedWorkshopMap();
        else if (inDirectChallenge()) {
            selectedMaps = 'mg_lobby_mapveto'; // force mg_lobby_mapveto
            gameModeFlags = 16; // force long match
            primePreference = 0; // force unranked via settings update below
        }
        else if (m_gameModeSetting === 'premier') {
            selectedMaps = 'mg_lobby_mapveto'; // force mg_lobby_mapveto
            primePreference = 1; // force ranked
            m_challengeKey = ''; // clear direct challenge key
        }
        else if (m_singleSkirmishMapGroup) {
            selectedMaps = m_singleSkirmishMapGroup;
        }
        else {
            selectedMaps = _GetSelectedMapsForServerTypeAndGameMode(serverType, gameMode);
        }
        const settings = {
            update: {
                Options: {
                    action: "custommatch",
                    server: serverType,
                    challengekey: _GetDirectChallengeKey(),
                },
                Game: {
                    mode: gameMode,
                    mode_ui: m_gameModeSetting,
                    type: GetGameType(gameMode),
                    mapgroupname: selectedMaps,
                    gamemodeflags: gameModeFlags,
                    prime: primePreference,
                    map: ''
                }
            },
            delete: {}
        };
        if (!inDirectChallenge()) {
            // we're not in direct challenge so delete the key from the session
            settings.delete = {
                Options: {
                    challengekey: 1
                }
            };
        }
        // TERRIBLE HACK: Ok so the random map feature has been broken for a long time, probably since panorama shipped and maybe even before.
        // It is very rarely used and might have appeared to work because it just loads whatever map is in the 'map' session key when it fails
        // This is the simplest way to just pick a random map from the offline map group entry in GameModes.txt without adding more work
        // to fix this very low value feature. This is fragile, relies on naming conventions in that file and is generally all around terrible
        // but I can't justify doing much more to keep this around. Alternative is to cut it. `
        if (selectedMaps.startsWith("random_")) {
            const arrMapGroups = _GetAvailableMapGroups(gameMode, false);
            const idx = 1 + Math.floor((Math.random() * (arrMapGroups.length - 1)));
            settings.update.Game.map = arrMapGroups[idx].substring(3);
        }
        // Save current choices
        // REI TODO: refactor, doesn't really belong here?
        if (m_isWorkshop) {
            GameInterfaceAPI.SetSettingString('ui_playsettings_maps_workshop', selectedMaps);
        }
        else {
            let singleSkirmishSuffix = '';
            if (m_singleSkirmishMapGroup) {
                singleSkirmishSuffix = '_' + _GetSingleSkirmishIdFromMapGroup(m_singleSkirmishMapGroup);
            }
            GameInterfaceAPI.SetSettingString('ui_playsettings_mode_' + serverType, m_gameModeSetting + singleSkirmishSuffix);
            if (!inDirectChallenge() && m_gameModeSetting !== 'premier') { // do not save the maps for "private queues", otherwise we will overwrite user preferences with "mg_lobby_mapveto"
                GameInterfaceAPI.SetSettingString('ui_playsettings_maps_' + serverType + '_' + m_gameModeSetting + singleSkirmishSuffix, selectedMaps);
            }
        }
        // Broadcast current settings to all clients (including ourselves)
        // This will call back into us via _SessionSettingsUpdate() so we can set up our new state
        LobbyAPI.UpdateSessionSettings(settings);
    }
    //--------------------------------------------------------------------------------------------------
    // Functions called from outside
    //--------------------------------------------------------------------------------------------------
    function _SessionSettingsUpdate(sessionState) {
        // force all controls to match their associated session settings
        if (sessionState === "ready") {
            if (m_jsTimerUpdateHandle && typeof m_jsTimerUpdateHandle === "number") {
                $.CancelScheduled(m_jsTimerUpdateHandle);
                m_jsTimerUpdateHandle = false;
            }
            _Init(); // late init, needed to create session before populating controls
        }
        // Host changed settings, update our controls to match
        else if (sessionState === "updated") {
            const settings = LobbyAPI.GetSessionSettings();
            _SyncDialogsFromSessionSettings(settings);
        }
        else if (sessionState === "closed") {
            // Queue hide content panel for a half second as we are going to go into the loading screen, and
            // we don't need dueling transitions.
            m_jsTimerUpdateHandle = $.Schedule(0.5, _HalfSecondDelay_HideContentPanel);
            $.Msg("[p.mainmenu]", "Queue HideContentPanel");
        }
    }
    function _PipRankUpdate() {
        if (m_serverSetting == 'official' &&
            m_gameModeSetting === 'competitive') {
            const activeMapGroup = m_activeMapGroupSelectionPanelID;
            const btnSelectedMapGroup = m_mapSelectionButtonContainers[activeMapGroup].Children();
            for (let elPanel of btnSelectedMapGroup) {
                const mapGroupName = elPanel.GetAttributeString('mapname', '').replace(/^mg_/, '');
                $.Msg('MAPS: ' + mapGroupName);
                _UpdateRatingEmblem(elPanel, mapGroupName);
            }
        }
    }
    function _HalfSecondDelay_HideContentPanel() {
        m_jsTimerUpdateHandle = false;
        $.Msg("[p.mainmenu]", "Dispatch HideContentPanel");
        $.DispatchEvent('HideContentPanel');
    }
    function _ReadyForDisplay() {
        _StartRotatingMapGroupTimer();
        _m_inventoryUpdatedHandler = $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', _InventoryUpdated);
        // We don't run this when the play menu's offscreen, so run it now.
        _InventoryUpdated();
    }
    function _UnreadyForDisplay() {
        _CancelRotatingMapGroupSchedule();
        if (_m_inventoryUpdatedHandler) {
            $.UnregisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', _m_inventoryUpdatedHandler);
            _m_inventoryUpdatedHandler = null;
        }
    }
    function _OnHideMainMenu() {
        for (let entry of $('#MapSelectionList').FindChildrenWithClassTraverse("map-selection-btn__carousel")) {
            entry.SetAutoScrollEnabled(false);
        }
    }
    function _OnShowMainMenu() {
        for (let entry of $('#MapSelectionList').FindChildrenWithClassTraverse("map-selection-btn__carousel")) {
            entry.SetAutoScrollEnabled(true);
        }
    }
    function _InitializeWorkshopTags(panel, mapInfo) {
        const mapTags = mapInfo.tags ? mapInfo.tags.split(",") : [];
        // Find game modes in tags
        const rawModes = [];
        const modes = [];
        const tags = [];
        for (let i = 0; i < mapTags.length; ++i) {
            // Check if matches a game mode
            // (Use lowercase with spaces and hyphens removed)
            const modeTag = mapTags[i].toLowerCase().split(' ').join('').split('-').join('');
            if (modeTag in k_workshopModes) {
                const gameTypes = k_workshopModes[modeTag].split(',');
                for (let iType = 0; iType < gameTypes.length; ++iType) {
                    if (!rawModes.includes(gameTypes[iType]))
                        rawModes.push(gameTypes[iType]);
                }
                modes.push($.Localize('#CSGO_Workshop_Mode_' + modeTag));
            }
            else {
                tags.push($.HTMLEscape(mapTags[i]));
            }
        }
        // Generate tooltip
        let tooltip = mapInfo.desc ? $.HTMLEscape(mapInfo.desc) : '';
        if (modes.length > 0) {
            if (tooltip)
                tooltip += '<br><br>';
            tooltip += $.Localize("#CSGO_Workshop_Modes");
            tooltip += ' ';
            tooltip += modes.join(', ');
        }
        if (tags.length > 0) {
            if (tooltip)
                tooltip += '<br><br>';
            tooltip += $.Localize("#CSGO_Workshop_Tags");
            tooltip += ' ';
            tooltip += tags.join(', ');
        }
        panel.SetAttributeString('data-tooltip', tooltip); // also used for search filter
        panel.SetAttributeString('data-workshop-modes', rawModes.join(','));
    }
    function _ShowWorkshopMapInfoTooltip(panel) {
        const text = panel.GetAttributeString('data-tooltip', '');
        if (text)
            UiToolkitAPI.ShowTextTooltip(panel.id, text);
    }
    function _HideWorkshopMapInfoTooltip() {
        UiToolkitAPI.HideTextTooltip();
    }
    function _LazyCreateWorkshopTab() {
        const panelId = k_workshopPanelId;
        if (panelId in m_mapSelectionButtonContainers)
            return panelId;
        // create workshop tab
        const container = $.CreatePanel("Panel", $('#MapSelectionList'), panelId, {
            class: 'map-selection-list map-selection-list--inner hidden'
        });
        container.AddClass('map-selection-list--workshop');
        $.Msg("LazyCreateWorkshopTab added a container: (panel id = " + panelId + ")");
        m_mapSelectionButtonContainers[panelId] = container;
        const arrMaps = WorkshopAPI.GetAvailableWorkshopMaps();
        for (let idxMap = 0; idxMap < arrMaps.length; ++idxMap) {
            const mapInfo = arrMaps[idxMap];
            if (typeof mapInfo !== 'object') {
                continue;
            }
            const p = $.CreatePanel('RadioButton', container, panelId + '_' + idxMap);
            p.BLoadLayoutSnippet('MapGroupSelection');
            p.SetAttributeString('group', 'radiogroup_' + panelId);
            if (!mapInfo.hasOwnProperty('imageUrl') || !mapInfo.imageUrl)
                mapInfo.imageUrl = 'file://{images}/map_icons/screenshots/360p/random.png';
            p.SetAttributeString('mapname', '@workshop/' + mapInfo.workshop_id + '/' + mapInfo.map);
            p.SetAttributeString('addon', mapInfo.workshop_id);
            p.SetPanelEvent('onactivate', () => _OnActivateMapOrMapGroupButton(p));
            p.FindChildInLayoutFile('ActiveGroupIcon').visible = false;
            p.FindChildInLayoutFile('MapGroupName').text = mapInfo.name;
            const mapImage = $.CreatePanel('Panel', p.FindChildInLayoutFile('MapGroupImagesCarousel'), 'MapSelectionScreenshot0');
            mapImage.AddClass('map-selection-btn__screenshot');
            mapImage.style.backgroundImage = 'url("' + mapInfo.imageUrl + '")';
            mapImage.style.backgroundPosition = '50% 0%';
            mapImage.style.backgroundSize = 'auto 100%';
            _InitializeWorkshopTags(p, mapInfo);
            p.SetPanelEvent('onmouseover', () => _ShowWorkshopMapInfoTooltip(p));
            p.SetPanelEvent('onmouseout', () => _HideWorkshopMapInfoTooltip());
        }
        if (arrMaps.length == 0) {
            const p = $.CreatePanel('Panel', container, undefined);
            p.BLoadLayoutSnippet('NoWorkshopMaps');
        }
        // filter panels with the current filter
        _UpdateWorkshopMapFilter();
        return panelId;
    }
    function _SwitchToWorkshopTab(isEnabled) {
        const panelId = _LazyCreateWorkshopTab();
        m_activeMapGroupSelectionPanelID = panelId;
        _ShowActiveMapSelectionTab(isEnabled);
    }
    function _UpdateGameModeFlagsBtn() {
        const elPanel = $.GetContextPanel().FindChildTraverse('id-gamemode-flag-' + _RealGameMode());
        if (!elPanel || !GameModeFlags.DoesModeUseFlags(_RealGameMode()) || m_isWorkshop) {
            return;
        }
        else {
            let elFlag = (m_gameModeFlags[m_serverSetting + _RealGameMode()]) ? elPanel.FindChildInLayoutFile('id-gamemode-flag-' + _RealGameMode() + '-' + m_gameModeFlags[m_serverSetting + _RealGameMode()]) : null;
            if (elFlag && elFlag.IsValid()) {
                elFlag.checked = true;
            }
            else {
                for (let element of elPanel.Children()) {
                    element.checked = false;
                }
            }
        }
        for (let element of elPanel.Children()) {
            element.enabled = !inDirectChallenge() && !_IsSearching() && LobbyAPI.BIsHost();
        }
    }
    function _setAndSaveGameModeFlags(value) {
        $.Msg('_setAndSaveGameModeFlags ' + value);
        m_gameModeFlags[m_serverSetting + _RealGameMode()] = value;
        _UpdateGameModeFlagsBtn();
        if (!inDirectChallenge())
            GameInterfaceAPI.SetSettingString('ui_playsettings_flags_' + m_serverSetting + '_' + _RealGameMode(), m_gameModeFlags[m_serverSetting + _RealGameMode()].toString());
    }
    function _OnGameModeFlagOptionActivate(value) {
        _setAndSaveGameModeFlags(value);
        _ApplySessionSettings();
    }
    function _OnGameModeFlagsBtnClicked(resumeMatchmakingHandle) {
        function _Callback(value, resumeMatchmakingHandle = '') {
            _setAndSaveGameModeFlags(parseInt(value));
            _ApplySessionSettings();
            if (resumeMatchmakingHandle) {
                UiToolkitAPI.InvokeJSCallback(parseInt(resumeMatchmakingHandle));
                UiToolkitAPI.UnregisterJSCallback(parseInt(resumeMatchmakingHandle));
            }
        }
        const callback = UiToolkitAPI.RegisterJSCallback(_Callback);
        UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_play_gamemodeflags.xml', '&callback=' + callback +
            '&searchfn=' + resumeMatchmakingHandle +
            '&textToken=' + '#play_settings_' + _RealGameMode() + '_dialog' +
            GameModeFlags.GetOptionsString(_RealGameMode()) +
            '&currentvalue=' + m_gameModeFlags[m_serverSetting + _RealGameMode()]);
    }
    function OnPressOfficialServers() {
        m_isWorkshop = false;
        m_serverSetting = 'official';
        _TurnOffDirectChallenge();
        _ApplySessionSettings();
    }
    PlayMenu.OnPressOfficialServers = OnPressOfficialServers;
    function OnPressListenServers() {
        m_isWorkshop = false;
        m_serverSetting = 'listen';
        _TurnOffDirectChallenge();
        _ApplySessionSettings();
    }
    PlayMenu.OnPressListenServers = OnPressListenServers;
    function OnPressWorkshop() {
        m_isWorkshop = true;
        _SetPlayDropdownToWorkshop();
        _TurnOffDirectChallenge();
        _UpdateDirectChallengePage(_IsSearching(), LobbyAPI.BIsHost());
        _UpdateGameModeFlagsBtn();
        _SelectActivePlayPlayTypeBtn();
    }
    PlayMenu.OnPressWorkshop = OnPressWorkshop;
    function OnPressServerBrowser() {
        if ('0' === GameInterfaceAPI.GetSettingString('player_nevershow_communityservermessage')) {
            UiToolkitAPI.ShowCustomLayoutPopup('server_browser_popup', 'file://{resources}/layout/popups/popup_serverbrowser.xml');
        }
        else {
            if (m_bPerfectWorld) {
                SteamOverlayAPI.OpenURL('https://csgo.wanmei.com/communityserver');
            }
            else {
                SteamOverlayAPI.OpenUrlInOverlayOrExternalBrowser('steam://open/servers');
            }
        }
    }
    PlayMenu.OnPressServerBrowser = OnPressServerBrowser;
    function BotDifficultyChanged() {
        const elDropDownEntry = $('#BotDifficultyDropdown').GetSelected();
        const botDiff = elDropDownEntry.id;
        GameTypesAPI.SetCustomBotDifficulty(parseInt(botDiff));
        // save the change to archive cvar
        GameInterfaceAPI.SetSettingString('player_botdifflast_s', botDiff);
    }
    PlayMenu.BotDifficultyChanged = BotDifficultyChanged;
    function _DisplayWorkshopModePopup() {
        // Figure out valid modes
        const elSelectedMaps = _GetSelectedWorkshopMapButtons();
        let modes = [];
        if (elSelectedMaps.length === 0) {
            UiToolkitAPI.ShowGenericPopupTwoOptions($.Localize('#SFUI_Maps_Workshop_Title'), $.Localize('#SFUI_No_Subscribed_Maps_Desc'), '', '#CSGO_Workshop_Visit', () => $.DispatchEvent('CSGOOpenSteamWorkshop', 'Map'), "OK", () => { });
            $('#StartMatchBtn').RemoveClass('pressed');
            return;
        }
        for (let iMap = 0; iMap < elSelectedMaps.length; ++iMap) {
            const mapModes = elSelectedMaps[iMap].GetAttributeString('data-workshop-modes', '').split(',');
            // only include modes that are valid for all selected maps
            if (iMap == 0)
                modes = mapModes;
            else
                modes = modes.filter(mode => mapModes.includes(mode));
        }
        const strModes = modes.join(',');
        UiToolkitAPI.ShowCustomLayoutPopupParameters('workshop_map_mode', 'file://{resources}/layout/popups/popup_workshop_mode_select.xml', 'workshop-modes=' + $.HTMLEscape(strModes));
        $('#StartMatchBtn').RemoveClass('pressed');
    }
    function _UpdateWorkshopMapFilter() {
        const elTextLabel = $('#WorkshopSearchTextEntry');
        const filter = $.HTMLEscape(elTextLabel.text).toLowerCase();
        const container = m_mapSelectionButtonContainers[k_workshopPanelId];
        const elCanelBtn = $('#WorkshopSearchTextEntryCanel');
        if (elCanelBtn) {
            elCanelBtn.SetHasClass('hide', filter == '');
            elCanelBtn.SetPanelEvent('onactivate', () => { elTextLabel.text = ''; _UpdateWorkshopMapFilter(); });
        }
        if (!container) {
            return; // not initialized yet
        }
        const children = container.Children();
        for (let i = 0; i < children.length; ++i) {
            const panel = children[i];
            // skip things that aren't map buttons (e.g. "no maps subscribed" label)
            const mapname = panel.GetAttributeString('mapname', '');
            if (mapname === '')
                continue;
            // if no filter, always visible
            if (filter === '') {
                panel.visible = true;
                continue;
            }
            // compare the raw ASCII map filename (e.g. "over" matches "de_overpass")
            if (mapname.toLowerCase().includes(filter)) {
                panel.visible = true;
                continue;
            }
            // compare the raw ASCII playable modes (e.g. "flyingscoutsman")
            const modes = panel.GetAttributeString('data-workshop-modes', '');
            if (modes.toLowerCase().includes(filter)) {
                panel.visible = true;
                continue;
            }
            // compare all the text in the tooltip, which includes localized mode names and unlocalized
            // description and tags directly from the map
            const tooltip = panel.GetAttributeString('data-tooltip', '');
            if (tooltip.toLowerCase().includes(filter)) {
                panel.visible = true;
                continue;
            }
            // compare the map name, which (TODO) should be localized if it's an official map,
            // and otherwise the unlocalized name specified by the mapper
            const elMapNameLabel = panel.FindChildTraverse('MapGroupName');
            if (elMapNameLabel && elMapNameLabel.text && elMapNameLabel.text.toLowerCase().includes(filter)) {
                panel.visible = true;
                continue;
            }
            panel.visible = false;
        }
    }
    function _SetPlayDropdownToWorkshop() {
        // only offline available for workshop maps
        m_serverSetting = 'listen';
        m_isWorkshop = true;
        _UpdatePrimeBtn(false, LobbyAPI.BIsHost());
        _UpdatePracticeSettingsBtns(false, LobbyAPI.BIsHost());
        if (_GetSelectedWorkshopMap()) {
            _ApplySessionSettings();
        }
        else {
            // User has no workshop maps, can't apply session settings but still show UI for workshop tab
            _SwitchToWorkshopTab(true);
        }
        $.GetContextPanel().SwitchClass("gamemode", 'workshop');
        $.GetContextPanel().SwitchClass("serversetting", m_serverSetting);
    }
    function _WorkshopSubscriptionsChanged() {
        const panel = m_mapSelectionButtonContainers[k_workshopPanelId];
        if (panel) {
            panel.DeleteAsync(0.0);
            // remove from map
            delete m_mapSelectionButtonContainers[k_workshopPanelId];
        }
        if (m_activeMapGroupSelectionPanelID != k_workshopPanelId) {
            // We'll lazy-recreate the panel the next time the user switches to it.
            return;
        }
        if (!LobbyAPI.IsSessionActive()) {
            // We can't sync session settings if we don't have a session when this event triggers, and this seems to happen when
            // entering a workshop map, during loading.
            // we are now in an inconsistent state? since m_activeMapGroupSelectionPanelID now points to a deleted panel
            // everything seems to work but we should keep an eye on this.
            m_activeMapGroupSelectionPanelID = null;
            return;
        }
        // for now just re-update from session settings.
        _SyncDialogsFromSessionSettings(LobbyAPI.GetSessionSettings());
        // If we are the host, re-apply our curernt settings. This will select a new map if the user unsubscribed from the current selection.
        if (LobbyAPI.BIsHost()) {
            _ApplySessionSettings();
            // you were on the workshop tab, force yourself back there if something caused it to switch (e.g. you had no selected map)
            _SetPlayDropdownToWorkshop();
        }
    }
    function _WorkshopAnnotationSubscriptionsChanged() {
        _UpdatePracticeSettingsBtns(_IsSearching(), LobbyAPI.BIsHost());
    }
    function _InventoryUpdated() {
        _UpdatePrimeBtn(_IsSearching(), LobbyAPI.BIsHost());
        _UpdatePracticeSettingsBtns(_IsSearching(), LobbyAPI.BIsHost());
    }
    function _RealGameMode() {
        if (m_gameModeSetting === 'premier')
            return 'competitive';
        else if (m_gameModeSetting == 'gungameprogressive' && _IsPlayingOnValveOfficial())
            return 'skirmish';
        return m_gameModeSetting;
    }
    function OnClearFilterText() {
        const elTextLabel = $('#WorkshopSearchTextEntry');
        const elCanelBtn = $('#WorkshopSearchTextEntryCanel');
        elCanelBtn.SetPanelEvent('onactivate', () => { elTextLabel.text = ''; _UpdateWorkshopMapFilter(); });
    }
    PlayMenu.OnClearFilterText = OnClearFilterText;
    function _SwitchGameModeTab(gameMode) {
        $('#GameModeSelectionRadios');
        for (let element of $('#GameModeSelectionRadios').Children()) {
            if (element.id === gameMode) {
                $.DispatchEvent("Activated", element, "mouse");
            }
        }
    }
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        _Init();
        $.RegisterEventHandler("ReadyForDisplay", $.GetContextPanel(), _ReadyForDisplay);
        $.RegisterEventHandler("UnreadyForDisplay", $.GetContextPanel(), _UnreadyForDisplay);
        $.RegisterForUnhandledEvent("PanoramaComponent_Lobby_MatchmakingSessionUpdate", _SessionSettingsUpdate);
        $.RegisterForUnhandledEvent("CSGOHideMainMenu", _OnHideMainMenu);
        $.RegisterForUnhandledEvent("CSGOHidePauseMenu", _OnHideMainMenu);
        $.RegisterForUnhandledEvent("CSGOShowMainMenu", _OnShowMainMenu);
        $.RegisterForUnhandledEvent("CSGOShowPauseMenu", _OnShowMainMenu);
        $.RegisterForUnhandledEvent("CSGOWorkshopSubscriptionsChanged", _WorkshopSubscriptionsChanged);
        $.RegisterForUnhandledEvent("CSGOWorkshopAnnotationSubscriptionsChanged", _WorkshopAnnotationSubscriptionsChanged);
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_ClansInfoUpdated', _ClansInfoUpdated);
        $.RegisterForUnhandledEvent('PanoramaComponent_FriendsList_NameChanged', _OnPlayerNameChangedUpdate);
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_PipRankUpdate', _PipRankUpdate);
        $.RegisterForUnhandledEvent('PlayMenu_SwitchGameModeTab', _SwitchGameModeTab);
        // direct challenge
        $.RegisterForUnhandledEvent('DirectChallenge_GenRandomKey', _OnDirectChallengeRandom);
        $.RegisterForUnhandledEvent('DirectChallenge_EditKey', _OnDirectChallengeEdit);
        $.RegisterForUnhandledEvent('DirectChallenge_CopyKey', _OnDirectChallengeCopy);
        $.RegisterForUnhandledEvent('DirectChallenge_ChooseClanKey', _OnChooseClanKeyBtn);
        $.RegisterForUnhandledEvent('DirectChallenge_ClanChallengeKeySelected', _OnClanChallengeKeySelected);
        $.RegisterForUnhandledEvent('PanoramaComponent_PartyBrowser_PrivateQueuesUpdate', _OnPrivateQueuesUpdate);
        WorkshopAPI.QueryUGCItemSubscriptions();
    }
})(PlayMenu || (PlayMenu = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbm1lbnVfcGxheS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL21haW5tZW51X3BsYXkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUNsQyw0Q0FBNEM7QUFDNUMsa0NBQWtDO0FBQ2xDLDZDQUE2QztBQUM3Qyw4Q0FBOEM7QUFDOUMsNkNBQTZDO0FBQzdDLHVDQUF1QztBQUN2Qyw4Q0FBOEM7QUFDOUMsOENBQThDO0FBQzlDLHlDQUF5QztBQUV6QyxDQUFDLENBQUMsVUFBVSxDQUFFLFlBQVksRUFBRSxRQUFRLENBQUUsQ0FBQztBQUV2QyxJQUFVLFFBQVEsQ0FtNkdqQjtBQW42R0QsV0FBVSxRQUFRO0lBRWpCLE1BQU0saUJBQWlCLEdBQUcsa0NBQWtDLENBQUM7SUFDN0QsSUFBSSwwQkFBeUMsQ0FBQztJQUU5QyxrRUFBa0U7SUFDbEUsTUFBTSw4QkFBOEIsR0FBb0MsRUFBRSxDQUFDO0lBQzNFLHdDQUF3QztJQUN4QyxJQUFJLGlCQUFpQixHQUF1QyxFQUFFLENBQUM7SUFDL0Qsb0RBQW9EO0lBQ3BELElBQUksbUJBQW1CLEdBQWMsRUFBRSxDQUFDO0lBQ3hDLGdEQUFnRDtJQUNoRCxJQUFJLFlBQTRDLENBQUM7SUFDakQsSUFBSSxXQUFtRCxDQUFDO0lBRXhELE1BQU0sZUFBZSxHQUFHLENBQUUsWUFBWSxDQUFDLGVBQWUsRUFBRSxLQUFLLGNBQWMsQ0FBRSxDQUFDO0lBQzlFLElBQUksZ0NBQWdDLEdBQWtCLElBQUksQ0FBQztJQUUzRCw4Q0FBOEM7SUFDOUMsSUFBSSxlQUFlLEdBQUcsRUFBRSxDQUFDO0lBQ3pCLElBQUksaUJBQWlCLEdBQUcsRUFBRSxDQUFDO0lBQzNCLElBQUksd0JBQXdCLEdBQWtCLElBQUksQ0FBQztJQUNuRCxJQUFJLDRCQUE0QixHQUFhLEVBQUUsQ0FBQztJQUNoRCw0SUFBNEk7SUFFNUksTUFBTSxlQUFl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