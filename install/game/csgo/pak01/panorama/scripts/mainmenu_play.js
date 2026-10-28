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
    const m_mapSelectionButtonContainers = {};
    let m_gameModeConfigs = {};
    let m_arrGameModeRadios = [];
    let GetMGDetails;
    let GetGameType;
    const m_bPerfectWorld = (MyPersonaAPI.GetLauncherType() === 'perfectworld');
    let m_activeMapGroupSelectionPanelID = null;
    let m_serverSetting = '';
    let m_gameModeSetting = '';
    let m_singleSkirmishMapGroup = null;
    let m_arrSingleSkirmishMapGroups = [];
    const m_gameModeFlags = {};
    let m_isWorkshop = false;
    let m_jsTimerUpdateHandle = false;
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
        flyingscoutsman: 'flyingscoutsman',
        retakes: 'retakes'
    };
    const m_PlayMenuActionBarParticleFX = $('#PlayMenuActionBar_Searching_particles');
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
                if (!_CheckContainerHasAnyChildChecked(_GetMapListForServerTypeAndGameMode(m_activeMapGroupSelectionPanelID)) && !m_isWorkshop) {
                    _NoMapSelectedPopup();
                    btnStartSearch.RemoveClass('pressed');
                    return;
                }
            }
            if (GameModeFlags.DoesModeUseFlags(_RealGameMode()) && !m_gameModeFlags[m_serverSetting + _RealGameMode()]) {
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
        const cfg = GameTypesAPI.GetConfig();
        for (const type in cfg.gameTypes) {
            for (const mode in cfg.gameTypes[type].gameModes) {
                let obj = cfg.gameTypes[type].gameModes[mode];
                m_gameModeConfigs[mode] = obj;
            }
        }
        GetGameType = (mode) => {
            for (const gameType in cfg.gameTypes) {
                if (cfg.gameTypes[gameType].gameModes.hasOwnProperty(mode))
                    return gameType;
            }
        };
        GetMGDetails = (mg) => {
            return cfg.mapgroups[mg];
        };
        const elGameModeSelectionRadios = $('#GameModeSelectionRadios');
        if (elGameModeSelectionRadios !== null) {
            m_arrGameModeRadios = elGameModeSelectionRadios.Children();
        }
        m_arrGameModeRadios = m_arrGameModeRadios.filter(elPanel => !elPanel.BHasClass('mainmenu-top-navbar__play_seperator'));
        for (let entry of m_arrGameModeRadios) {
            entry.SetPanelEvent('onactivate', () => {
                m_isWorkshop = false;
                _LoadGameModeFlagsFromSettings();
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
        const elPracticeSettingsContainer = $('#id-play-menu-practicesettings-container');
        for (let elChild of elPracticeSettingsContainer.Children()) {
            if (!elChild.id.startsWith('id-play-menu-practicesettings-'))
                continue;
            let strFeatureName = elChild.id;
            strFeatureName = strFeatureName.replace('id-play-menu-practicesettings-', '');
            strFeatureName = strFeatureName.replace('-tooltip', '');
            const elFeatureFrame = elChild.FindChildTraverse('id-play-menu-practicesettings-' + strFeatureName);
            const elFeatureSliderBtn = elFeatureFrame.FindChildTraverse('id-slider-btn');
            elFeatureSliderBtn.text = $.Localize('#practicesettings_' + strFeatureName + '_button');
            elFeatureSliderBtn.SetPanelEvent('onactivate', () => {
                UiToolkitAPI.HideTextTooltip();
                const sessionSettings = LobbyAPI.GetSessionSettings();
                const curvalue = (sessionSettings && sessionSettings.options && sessionSettings.options.hasOwnProperty('practicesettings_' + strFeatureName))
                    ? sessionSettings.options['practicesettings_' + strFeatureName] : 0;
                const newvalue = curvalue ? 0 : 1;
                GameInterfaceAPI.SetSettingString('ui_playsettings_listen_' + strFeatureName, newvalue ? '1' : '0');
                const setting = 'practicesettings_' + strFeatureName;
                const newSettings = { update: { options: {} } };
                newSettings.update.options[setting] = newvalue;
                LobbyAPI.UpdateSessionSettings(newSettings);
            });
        }
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
        _SyncDialogsFromSessionSettings(LobbyAPI.GetSessionSettings());
        _ApplySessionSettings();
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
            type = oReturn.value[2];
            id = oReturn.value[3];
            id32 = parseInt(oReturn.value[4]);
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
            $.Schedule(0.01, () => {
                const elHeader = $.GetContextPanel().FindChildTraverse("JsDirectChallengeKey");
                if (elHeader && elHeader.IsValid())
                    elHeader.TriggerClass('directchallenge-status__header__queuecode');
            });
        }
        $.GetContextPanel().SetHasClass('directchallenge', key != '');
        m_challengeKey = key;
    }
    function _ClansInfoUpdated() {
        if (m_challengeKey && $.GetContextPanel().GetAttributeString('code-type', '') === 'g') {
            _SetDirectChallengeKey(m_challengeKey);
        }
    }
    function _AddOpenPlayerCardAction(elAvatar, xuid) {
        elAvatar.SetPanelEvent("onactivate", () => {
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
            return oReturn.value[2];
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
        if (_IsValveOfficialServer(serverType) &&
            LobbyAPI.BIsHost()) {
            if (gameMode === 'premier') {
                isAvailable = ((MyPersonaAPI.GetElevatedState() === 'elevated') &&
                    (MyPersonaAPI.HasPrestige() || MyPersonaAPI.GetCurrentLevel() >= 10)) &&
                    !TournamentsAPI.IsPremierSeasonOffseason();
            }
            else if (MyPersonaAPI.HasPrestige()) {
                isAvailable = true;
            }
            else if (MyPersonaAPI.GetCurrentLevel() < 2) {
                isAvailable = (gameMode == 'deathmatch' || gameMode == 'casual' || gameMode == 'gungameprogressive' || gameMode == 'retakes');
            }
        }
        else if (!_IsValveOfficialServer(serverType)) {
            (isAvailable = (gameMode != 'premier'));
        }
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
                if (strSelectedData === strData) {
                    elDropdown.SetSelected(entryID);
                }
            }
            const strCurrentOpponent = _GetTournamentOpponent();
            const strCurrentStage = _GetTournamentStage();
            elTeamDropdown.RemoveAllOptions();
            AddDropdownOption(elTeamDropdown, 'PickOpponent', $.Localize('#SFUI_Tournament_Pick_Opponent'), '', strCurrentOpponent);
            const teamCount = CompetitiveMatchAPI.GetTournamentTeamCount(strTournament);
            for (let i = 0; i < teamCount; i++) {
                const strTeam = CompetitiveMatchAPI.GetTournamentTeamNameByIndex(strTournament, i);
                if (strTeamName === strTeam)
                    continue;
                AddDropdownOption(elTeamDropdown, 'team_' + i, strTeam, strTeam, strCurrentOpponent);
            }
            elTeamDropdown.SetPanelEvent('oninputsubmit', () => _UpdateStartSearchBtn(isSearchingForTournament));
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
        $.GetContextPanel().SwitchClass("gamemode", m_isWorkshop ? "workshop" : _RealGameMode());
        $.GetContextPanel().SwitchClass("serversetting", m_serverSetting);
        $.GetContextPanel().SetHasClass("directchallenge", inDirectChallenge());
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
            for (let i = 0; i < m_arrGameModeRadios.length; ++i) {
                const strGameModeForButton = m_arrGameModeRadios[i].id;
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
                const isAvailable = _IsGameModeAvailable(m_serverSetting, strGameModeForButton);
                m_arrGameModeRadios[i].enabled = isAvailable && isEnabled;
                m_arrGameModeRadios[i].SetHasClass('locked', !isAvailable || !isEnabled);
            }
            _UpdateMapGroupButtons(isEnabled, isSearching, isHost);
            _CancelRotatingMapGroupSchedule();
            if (settings.game.mode === "survival") {
                _GetRotatingMapGroupStatus(_RealGameMode(), m_singleSkirmishMapGroup, settings.game.mapgroupname);
            }
            else if (_HasRotatingMapGroupMutators()) {
                _UpdateRotatingMapGroupMutators();
            }
            _SelectMapButtonsFromSettings(settings);
        }
        else {
            m_arrGameModeRadios[0].checked = true;
        }
        _ShowHideStartSearchBtn(isSearching, isHost);
        _ShowCancelSearchButton(isSearching, isHost);
        _UpdateTournamentButton(isHost);
        _UpdatePrimeBtn(isSearching, isHost);
        _UpdatePermissionBtnText(settings, isEnabled);
        _UpdatePracticeSettingsBtns(isSearching, isHost);
        _UpdateLeaderboardBtn(m_gameModeSetting);
        _UpdateSurvivalAutoFillSquadBtn(m_gameModeSetting);
        _UpdateRushFriendLeaderboards(m_gameModeSetting);
        _SelectActivePlayPlayTypeBtn();
        _UpdateReplayNewUserTrainingBtn(m_gameModeSetting);
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
        elTile.BLoadLayout('file://{resources}/layout/simple_player_tile.xml', false, false);
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
        let strName = null;
        const strCodeXuid = $.GetContextPanel().GetAttributeString('code-xuid', '');
        if (strCodeXuid === xuid) {
            if (!strName)
                strName = FriendsListAPI.GetFriendName(xuid);
            $.GetContextPanel().SetDialogVariable('code-source', strName);
        }
        const elMembersContainer = $('#DirectChallengeQueueMembers');
        if (!elMembersContainer)
            return;
        const elUserTile = elMembersContainer.FindChildTraverse(xuid);
        if (!elUserTile)
            return;
        if (!strName)
            strName = FriendsListAPI.GetFriendName(xuid);
        elUserTile.SetDialogVariable('player_name', strName);
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
        const elMembersContainer = $.GetContextPanel().FindChildTraverse('DirectChallengeQueueMembers');
        if (!elMembersContainer)
            return;
        const elExplanation = $("#id-directchallenge-explanation");
        if (elExplanation)
            elExplanation.SetHasClass('hidden', _IsSearching());
        const elQueueMembers = $("#id-directchallenge-status__queue-members");
        if (elQueueMembers)
            elQueueMembers.SetHasClass('hidden', !_IsSearching());
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
        for (let child of elMembersContainer.Children()) {
            child.SetAttributeInt("marked_for_delete", 1);
        }
        let delay = 0;
        for (let i = NumberOfParties; i-- > 0;) {
            const DELAY_INCREMENT = 0.25;
            const arrMembers = [];
            const partyXuid = PartyBrowserAPI.GetPrivateQueuePartyXuidByIndex(i);
            const partyId = _GetPartyID(partyXuid, arrMembers);
            let elParty = elMembersContainer.FindChild(partyId);
            if (!elParty) {
                elParty = $.CreatePanel('Panel', elMembersContainer, partyId, { class: 'directchallenge__party hidden' });
                elParty.SetHasClass('multi', arrMembers.length > 1);
                elMembersContainer.MoveChildBefore(elParty, elMembersContainer.Children()[0]);
                elParty.SetAttributeString("xuid", partyXuid);
                Scheduler.Schedule(delay, () => {
                    if (elParty && elParty.IsValid())
                        elParty.RemoveClass('hidden');
                }, "directchallenge");
                for (let xuid of arrMembers) {
                    if (elParty) {
                        const elTile = $.CreatePanel('Panel', elParty, xuid, { class: "directchallenge__party__member" });
                        _CreatePlayerTile(elTile, xuid, delay);
                    }
                    delay += DELAY_INCREMENT;
                }
            }
            else {
            }
            elParty.SetAttributeInt("marked_for_delete", 0);
        }
        for (let child of elMembersContainer.Children()) {
            if (child.GetAttributeInt("marked_for_delete", 0) !== 0) {
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
        const gameModeCfg = m_gameModeConfigs[gameMode];
        if (gameModeCfg === undefined)
            return [];
        const mapgroup = isPlayingOnValveOfficial ? gameModeCfg.mapgroupsMP : gameModeCfg.mapgroupsSP;
        if (mapgroup !== undefined && mapgroup !== null) {
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
        if ($.GetContextPanel().BHasClass('play-menu__lobbymapveto_activated') && mapGroupNameClicked !== 'mg_lobby_mapveto') {
            return;
        }
        if (mapgroupButton.checked) {
            $.DispatchEvent('CSGOPlaySoundEffect', 'submenu_leveloptions_select', 'MOUSE');
        }
        else {
            $.DispatchEvent('CSGOPlaySoundEffect', 'submenu_leveloptions_deselect', 'MOUSE');
        }
        let mapGroupName = mapGroupNameClicked;
        if (mapGroupName) {
            const siblingSuffix = '_scrimmagemap';
            if (mapGroupName.toLowerCase().endsWith(siblingSuffix))
                mapGroupName = mapGroupName.substring(0, mapGroupName.length - siblingSuffix.length);
            else
                mapGroupName = mapGroupName + siblingSuffix;
            let elParent = mapgroupButton.GetParent();
            if (elParent)
                elParent = elParent.GetParent();
            if (elParent && elParent.GetAttributeString('hassections', '')) {
                for (let section of elParent.Children()) {
                    for (let tile of section.Children()) {
                        const mapGroupNameSibling = tile.GetAttributeString("mapname", '');
                        if (mapGroupNameSibling.toLowerCase() === mapGroupName.toLowerCase()) {
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
            if (!m_bDidShowActiveMapSelectionTab) {
                elButtonContainer.AddClass("skip-transition");
            }
            if (key !== panelID) {
                elButtonContainer.AddClass("hidden");
            }
            else {
                elButtonContainer.RemoveClass("hidden");
                elButtonContainer.visible = true;
                elButtonContainer.enabled = isEnabled;
            }
            elButtonContainer.RemoveClass("skip-transition");
        }
        const isWorkshop = panelID === k_workshopPanelId;
        $('#WorkshopSearchBar').visible = isWorkshop;
        for (let element of $('#GameModeSelectionRadios').Children()) {
            element.enabled = element.enabled && !isWorkshop && !_IsSearching() && LobbyAPI.BIsHost();
        }
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
    function OnMapQuickSelect(mgName) {
        const arrMapsToSelect = _GetMapsFromQuickSelectMapGroup(mgName);
        let bScrolled = false;
        const prevSelection = _GetSelectedMapsForServerTypeAndGameMode(m_serverSetting, _RealGameMode(), true);
        const elMapGroupContainer = _GetMapTileContainer();
        for (let elMapBtn of elMapGroupContainer.Children()) {
            let bFound = false;
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
            if (bFound && !bScrolled) {
                elMapBtn.ScrollParentToMakePanelFit(2, false);
                bScrolled = true;
            }
        }
        const newSelection = _GetSelectedMapsForServerTypeAndGameMode(m_serverSetting, _RealGameMode(), true);
        if (prevSelection != newSelection) {
            $.DispatchEvent('CSGOPlaySoundEffect', 'submenu_leveloptions_select', 'MOUSE');
            _MatchMapSelectionWithQuickSelect();
            if (_CheckContainerHasAnyChildChecked(_GetMapListForServerTypeAndGameMode(m_activeMapGroupSelectionPanelID))) {
                _ApplySessionSettings();
            }
        }
    }
    PlayMenu.OnMapQuickSelect = OnMapQuickSelect;
    function _ValidateMaps(arrMapList) {
        let arrMapTileNames = [];
        const arrMapButtons = _GetMapListForServerTypeAndGameMode(m_activeMapGroupSelectionPanelID);
        arrMapButtons.forEach(elMapTile => arrMapTileNames.push(elMapTile.GetAttributeString("mapname", "")));
        const filteredMapList = arrMapList.filter(strMap => arrMapTileNames.includes(strMap));
        return filteredMapList;
    }
    function _GetMapGroupsWithAttribute(strAttribute, strValue) {
        const arrNewMapgroups = [];
        const elMapGroupContainer = _GetMapTileContainer();
        for (let elMapBtn of elMapGroupContainer.Children()) {
            const mgName = elMapBtn.GetAttributeString("mapname", "");
            if (GameTypesAPI.GetMapGroupAttribute(mgName, strAttribute) === strValue) {
                arrNewMapgroups.push(mgName);
            }
        }
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
    function _MatchMapSelectionWithQuickSelect() {
        const elQuickSelectContainer = $.GetContextPanel().FindChildInLayoutFile("JsQuickSelectParent");
        if (!elQuickSelectContainer || m_isWorkshop)
            return;
        for (let elQuickBtn of elQuickSelectContainer.FindChildrenWithClassTraverse('preset-button')) {
            const arrQuickSelectMaps = _GetMapsFromQuickSelectMapGroup(elQuickBtn.id);
            let bMatch = true;
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
            const elFriendLeaderboards = elExistingContainer ? elExistingContainer.FindChildTraverse("FriendLeaderboards") : null;
            if (elFriendLeaderboards) {
                const strEmbeddedLeaderboardName = elFriendLeaderboards.GetAttributeString("type", '');
                if (strEmbeddedLeaderboardName) {
                    LeaderboardsAPI.Refresh(strEmbeddedLeaderboardName);
                }
            }
            if (bAllowReuseExistingContainer)
                return panelID;
            else
                elExistingContainer.DeleteAsync(0.0);
        }
        const container = $.CreatePanel("Panel", $('#MapSelectionList'), panelID, {
            class: 'map-selection-list map-selection-list--inner hidden'
        });
        container.AddClass('map-selection-list--' + serverType + '-' + gameMode);
        m_mapSelectionButtonContainers[panelID] = container;
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
        if (container.BHasLayoutSnippet(strSnippetNameOverride)) {
            container.BLoadLayoutSnippet(strSnippetNameOverride);
            const elMapTile = container.FindChildTraverse("MapTile");
            if (elMapTile)
                elMapTile.BLoadLayoutSnippet("MapGroupSelection");
        }
        else {
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
        $.RegisterEventHandler('PropertyTransitionEnd', container, (panel, propertyName) => {
            if (container === panel && propertyName === 'opacity' &&
                !container.id.startsWith("FriendLeaderboards")) {
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
        if (inDirectChallenge())
            return;
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
        const iconSize = 200;
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
                const mapGroupPanelID = _GetMapGroupPanelID() + strCurrentMapGroup;
                const mapGroupContainer = m_mapSelectionButtonContainers[m_activeMapGroupSelectionPanelID].FindChildTraverse('MapTile');
                const mapGroupPanel = mapGroupContainer.FindChildInLayoutFile(mapGroupPanelID);
                if (!mapGroupPanel) {
                    mapGroupContainer.RemoveAndDeleteChildren();
                    const btnMapGroup = _UpdateOrCreateMapGroupTile(strCurrentMapGroup, mapGroupContainer, null, mapGroupPanelID, 1);
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
        else if (_HasRotatingMapGroupMutators()
            && m_mapSelectionButtonContainers && m_mapSelectionButtonContainers[activeMapGroup]) {
            _UpdateRotatingMapGroupMutators();
        }
    }
    function _HasRotatingMapGroupMutators() {
        return !m_isWorkshop && _IsPlayingOnValveOfficial() && _RealGameMode() === 'casual';
    }
    function _UpdateRotatingMapGroupMutators() {
        m_timerMapGroupHandler = null;
        for (const elMapPanel of _GetMapListForServerTypeAndGameMode(m_activeMapGroupSelectionPanelID)) {
            _UpdateMapGroupMutators(elMapPanel.GetAttributeString('mapname', ''), elMapPanel);
        }
        m_timerMapGroupHandler = $.Schedule(1, _UpdateRotatingMapGroupMutators);
    }
    function _UpdateMapGroupMutators(mapName, elMapPanel) {
        const nMutators = _HasRotatingMapGroupMutators() ? CompetitiveMatchAPI.GetRotatingOfficialMapGroupMutators(_RealGameMode(), mapName) : 0;
        const elMutators = elMapPanel.FindChildInLayoutFile('MapGroupMutators');
        if (elMutators.GetAttributeInt('mutators', 0) === nMutators)
            return;
        elMutators.RemoveAndDeleteChildren();
        for (let i = 0; i < 32; ++i) {
            if (!(nMutators & (1 << i)))
                continue;
            const info = GameTypesAPI.GetMutatorDisplayInfo(i);
            const elRow = $.CreatePanel('Panel', elMutators, '', { class: 'map-selection-btn__mutators-row' });
            $.CreatePanel('Image', elRow, '', {
                class: 'map-selection-btn__mutators-icon',
                texturewidth: 20,
                textureheight: 20,
                src: info.icon
            });
            $.CreatePanel('Label', elRow, '', { class: 'map-selection-btn__mutators-name stratum-medium', text: info.name });
        }
        elMutators.SetAttributeInt('mutators', nMutators);
        elMutators.SetHasClass('hidden', nMutators === 0);
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
        _UpdateMapGroupMutators(mapName, elMapPanel);
    }
    function _ReloadLeaderboardLayoutGivenSettings(container, lbName, strTitleOverride, strPointsTitle) {
        const elFriendLeaderboards = container.FindChildTraverse("FriendLeaderboards");
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
        switch (_IsPlayingOnValveOfficial() ? _RealGameMode() : '') {
            case 'competitive':
            case 'scrimcomp2v2':
            case 'rush':
                _UpdateWaitTime(_GetMapListForServerTypeAndGameMode(panelID));
                break;
        }
        if (!inDirectChallenge())
            _SetEnabledStateForMapBtns(m_mapSelectionButtonContainers[panelID], isSearching, isHost);
        m_activeMapGroupSelectionPanelID = panelID;
        _ShowActiveMapSelectionTab(isEnabled);
        _PopulateQuickSelectBar(isSearching, isHost);
    }
    function _SelectMapButtonsFromSettings(settings) {
        m_selectedPracticeMap = '';
        const mapsGroups = settings.game.mapgroupname.split(',');
        const aListMaps = _GetMapListForServerTypeAndGameMode(m_activeMapGroupSelectionPanelID);
        for (let e of aListMaps) {
            const mapName = e.GetAttributeString("mapname", "invalid");
            e.checked = mapsGroups.includes(mapName);
            if (m_serverSetting === 'listen' && e.checked) {
                m_selectedPracticeMap = mapName.replace(/^mg_/, '');
            }
        }
    }
    function _ShowHideStartSearchBtn(isSearching, isHost) {
        let bShow = !isSearching && isHost ? true : false;
        const btnStartSearch = $.GetContextPanel().FindChildInLayoutFile('StartMatchBtn');
        if (bShow) {
            if (btnStartSearch.BHasClass('pressed')) {
                btnStartSearch.RemoveClass('pressed');
            }
            btnStartSearch.RemoveClass('hidden');
        }
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
        let elPracticeSettingsContainer = $('#id-play-menu-practicesettings-container');
        let sessionSettings = LobbyAPI.GetSessionSettings();
        let bForceHidden = (m_serverSetting !== 'listen') || m_isWorkshop || !LobbyAPI.IsSessionActive() || !sessionSettings;
        let bAnnotationAvailable = true;
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
            let elFeatureFrame = elChild.FindChildTraverse('id-play-menu-practicesettings-' + strFeatureName);
            let elFeatureSliderBtn = elFeatureFrame.FindChildTraverse('id-slider-btn');
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
                curvalue = sessionSettings.options['practicesettings_' + strFeatureName];
            }
            else {
                curvalue = GameInterfaceAPI.GetSettingString('ui_playsettings_listen_' + strFeatureName) === '1' ? 1 : 0;
                if (curvalue === 1) {
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
        if (!_IsPlayingOnValveOfficial() || !MyPersonaAPI.IsInventoryValid() || inDirectChallenge() || m_isWorkshop) {
            elPrimePanel.visible = false;
            return;
        }
        const LocalPlayerHasPrime = PartyListAPI.GetFriendPrimeEligible(MyPersonaAPI.GetXuid());
        elPrimePanel.visible = true;
        elPrimePanel.SetHasClass('play-menu-prime-logo-bg', LocalPlayerHasPrime);
        elGetPrimeBtn.visible = !LocalPlayerHasPrime;
        elPrimeStatus.visible = LocalPlayerHasPrime;
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
        elBtn.enabled = isEnabled;
    }
    function _UpdateLeaderboardBtn(gameMode, isOfficalMatchmaking = false) {
        const elLeaderboardButton = $('#PlayMenulLeaderboards');
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
                _ReloadLeaderboardLayoutGivenSettings(container, lbName, "#CSGO_official_leaderboard_survival_" + lbType, "#Cstrike_TitlesTXT_WINS");
            }
        }
    }
    function _UpdateRushFriendLeaderboards(gameMode) {
        const elRoot = $('#gameModeButtonContainer_rush_official');
        if (!elRoot)
            return;
        if (gameMode === 'rush') {
            const lbType = 'solo';
            const lbName = "official_leaderboard_rush_" + lbType;
            const elFriendLeaderboards = elRoot.FindChildTraverse("FriendLeaderboards");
            const sPreviousType = elFriendLeaderboards.GetAttributeString("type", '');
            if (!sPreviousType || !sPreviousType.startsWith(lbName)) {
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
    function _GetSelectedMapsForServerTypeAndGameMode(serverType, gameMode, bDontToggleMaps = false) {
        const isPlayingOnValveOfficial = _IsValveOfficialServer(serverType);
        const aListMapPanels = _GetMapListForServerTypeAndGameMode();
        if (!_CheckContainerHasAnyChildChecked(aListMapPanels)) {
            let preferencesMapsForThisMode = GameInterfaceAPI.GetSettingString('ui_playsettings_maps_' + serverType + '_' + gameMode);
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
        if ((serverType === 'official' && gameMode === 'survival')
            || (gameMode === 'rush')) {
            return GameInterfaceAPI.GetSettingString('ui_playsettings_maps_' + serverType + '_' + gameMode);
        }
        const selectedMaps = aListMapPanels.filter((e) => {
            return e.checked;
        })
            .reduce((accumulator, e) => {
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
            return [];
        }
        if (!_CheckContainerHasAnyChildChecked(children)) {
            let preferencesMapsForThisMode = GameInterfaceAPI.GetSettingString('ui_playsettings_maps_workshop');
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
            return e.checked;
        });
        return Array.from(selectedMaps);
    }
    function _GetSelectedWorkshopMap() {
        const mapButtons = _GetSelectedWorkshopMapButtons();
        const selectedMaps = mapButtons.reduce((accumulator, e) => {
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
    function _CheckContainerHasAnyChildChecked(aMapList) {
        if (aMapList.length < 1)
            return false;
        return aMapList.filter(map => map.checked).length > 0;
    }
    function _ValidateSessionSettings() {
        if (m_isWorkshop) {
            m_serverSetting = "listen";
        }
        if (!_IsGameModeAvailable(m_serverSetting, m_gameModeSetting)) {
            m_gameModeSetting = GameInterfaceAPI.GetSettingString("ui_playsettings_mode_" + m_serverSetting);
            m_singleSkirmishMapGroup = null;
            if (_IsSingleSkirmishString(_RealGameMode())) {
                m_singleSkirmishMapGroup = _GetSingleSkirmishMapGroupFromSingleSkirmishString(_RealGameMode());
                m_gameModeSetting = 'skirmish';
            }
            if (!_IsGameModeAvailable(m_serverSetting, m_gameModeSetting)) {
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
        if (!m_gameModeFlags[m_serverSetting + _RealGameMode()])
            _LoadGameModeFlagsFromSettings();
        if (GameModeFlags.DoesModeUseFlags(_RealGameMode())) {
            if (!GameModeFlags.AreFlagsValid(_RealGameMode(), m_gameModeFlags[m_serverSetting + _RealGameMode()])) {
                _setAndSaveGameModeFlags(0);
            }
        }
    }
    function _LoadGameModeFlagsFromSettings() {
        m_gameModeFlags[m_serverSetting + _RealGameMode()] = parseInt(GameInterfaceAPI.GetSettingString('ui_playsettings_flags_' + m_serverSetting + '_' + _RealGameMode()));
    }
    function _ApplySessionSettings() {
        if (m_serverSetting === 'official' && !m_isWorkshop && !inDirectChallenge()) {
            if (m_gameModeSetting === 'scrimcomp2v2') {
                MyPersonaAPI.HintLoadPipRanks('wingman');
            }
            else if (m_gameModeSetting === 'competitive') {
                MyPersonaAPI.HintLoadPipRanks('competitive');
            }
        }
        if (!LobbyAPI.BIsHost()) {
            return;
        }
        _ValidateSessionSettings();
        const serverType = m_serverSetting;
        let gameMode = _RealGameMode();
        let gameModeFlags = m_gameModeFlags[m_serverSetting + gameMode] ? m_gameModeFlags[m_serverSetting + gameMode] : 0;
        let primePreference = PartyListAPI.GetFriendPrimeEligible(MyPersonaAPI.GetXuid()) ? 1 : 0;
        let selectedMaps;
        if (m_isWorkshop)
            selectedMaps = _GetSelectedWorkshopMap();
        else if (inDirectChallenge()) {
            selectedMaps = 'mg_lobby_mapveto';
            gameModeFlags = 16;
            primePreference = 0;
        }
        else if (m_gameModeSetting === 'premier') {
            selectedMaps = 'mg_lobby_mapveto';
            primePreference = 1;
            m_challengeKey = '';
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
            settings.delete = {
                Options: {
                    challengekey: 1
                }
            };
        }
        if (selectedMaps.startsWith("random_")) {
            const arrMapGroups = _GetAvailableMapGroups(gameMode, false);
            const idx = 1 + Math.floor((Math.random() * (arrMapGroups.length - 1)));
            settings.update.Game.map = arrMapGroups[idx].substring(3);
        }
        if (m_isWorkshop) {
            GameInterfaceAPI.SetSettingString('ui_playsettings_maps_workshop', selectedMaps);
        }
        else {
            let singleSkirmishSuffix = '';
            if (m_singleSkirmishMapGroup) {
                singleSkirmishSuffix = '_' + _GetSingleSkirmishIdFromMapGroup(m_singleSkirmishMapGroup);
            }
            GameInterfaceAPI.SetSettingString('ui_playsettings_mode_' + serverType, m_gameModeSetting + singleSkirmishSuffix);
            if (!inDirectChallenge() && m_gameModeSetting !== 'premier') {
                GameInterfaceAPI.SetSettingString('ui_playsettings_maps_' + serverType + '_' + m_gameModeSetting + singleSkirmishSuffix, selectedMaps);
            }
        }
        LobbyAPI.UpdateSessionSettings(settings);
    }
    function _SessionSettingsUpdate(sessionState) {
        if (sessionState === "ready") {
            if (m_jsTimerUpdateHandle && typeof m_jsTimerUpdateHandle === "number") {
                $.CancelScheduled(m_jsTimerUpdateHandle);
                m_jsTimerUpdateHandle = false;
            }
            _Init();
        }
        else if (sessionState === "updated") {
            const settings = LobbyAPI.GetSessionSettings();
            _SyncDialogsFromSessionSettings(settings);
        }
        else if (sessionState === "closed") {
            m_jsTimerUpdateHandle = $.Schedule(0.5, _HalfSecondDelay_HideContentPanel);
        }
    }
    function _PipRankUpdate() {
        if (m_serverSetting == 'official' &&
            m_gameModeSetting === 'competitive') {
            const activeMapGroup = m_activeMapGroupSelectionPanelID;
            const btnSelectedMapGroup = m_mapSelectionButtonContainers[activeMapGroup].Children();
            for (let elPanel of btnSelectedMapGroup) {
                const mapGroupName = elPanel.GetAttributeString('mapname', '').replace(/^mg_/, '');
                _UpdateRatingEmblem(elPanel, mapGroupName);
            }
        }
    }
    function _HalfSecondDelay_HideContentPanel() {
        m_jsTimerUpdateHandle = false;
        $.DispatchEvent('HideContentPanel');
    }
    function _ReadyForDisplay() {
        _StartRotatingMapGroupTimer();
        _m_inventoryUpdatedHandler = $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', _InventoryUpdated);
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
        const rawModes = [];
        const modes = [];
        const tags = [];
        for (let i = 0; i < mapTags.length; ++i) {
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
        panel.SetAttributeString('data-tooltip', tooltip);
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
        const container = $.CreatePanel("Panel", $('#MapSelectionList'), panelId, {
            class: 'map-selection-list map-selection-list--inner hidden'
        });
        container.AddClass('map-selection-list--workshop');
        m_mapSelectionButtonContainers[panelId] = container;
        const arrMaps = WorkshopAPI.GetAvailableWorkshopMaps().filter((mapInfo) => typeof mapInfo === 'object');
        const _SortRank = (mapInfo) => (mapInfo.ready === false ? 2 : 0) + (mapInfo.subscribed ? 0 : 1);
        arrMaps.sort((a, b) => _SortRank(a) - _SortRank(b));
        for (let idxMap = 0; idxMap < arrMaps.length; ++idxMap) {
            const mapInfo = arrMaps[idxMap];
            const bReady = mapInfo.ready !== false;
            const bInstalledOnly = !!mapInfo.installed && !mapInfo.subscribed;
            const p = $.CreatePanel(bReady ? 'RadioButton' : 'Panel', container, panelId + '_' + idxMap);
            p.BLoadLayoutSnippet('MapGroupSelection');
            if (!mapInfo.hasOwnProperty('imageUrl') || !mapInfo.imageUrl)
                mapInfo.imageUrl = 'file://{images}/map_icons/screenshots/360p/random.png';
            if (bReady) {
                p.SetAttributeString('group', 'radiogroup_' + panelId);
                p.SetAttributeString('mapname', '@workshop/' + mapInfo.workshop_id + '/' + mapInfo.map);
                p.SetPanelEvent('onactivate', () => _OnActivateMapOrMapGroupButton(p));
            }
            else {
                p.AddClass('map-selection-btn--workshop-unplayable');
            }
            p.SetAttributeString('addon', mapInfo.workshop_id);
            p.FindChildInLayoutFile('ActiveGroupIcon').visible = false;
            p.FindChildInLayoutFile('MapGroupName').text = mapInfo.name;
            if (bInstalledOnly || mapInfo.legacy) {
                p.AddClass('map-selection-btn--workshop-installed');
                const elBadge = p.FindChildInLayoutFile('MapGroupNewTag');
                elBadge.text = $.Localize(mapInfo.legacy ? '#CSGO_Workshop_Legacy_Badge' : '#CSGO_Workshop_Installed_Badge');
                elBadge.RemoveClass('hidden');
            }
            _AddWorkshopTileActions(p, mapInfo, bInstalledOnly);
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
        _UpdateWorkshopMapFilter();
        return panelId;
    }
    function _AddWorkshopTileActions(elTile, mapInfo, bInstalledOnly) {
        const elTileBtn = elTile.FindChildrenWithClassTraverse('map-selection-btn')[0] ?? elTile;
        const elActions = $.CreatePanel('Panel', elTileBtn, undefined);
        elActions.BLoadLayoutSnippet('WorkshopMapTileActions');
        const strFileId = mapInfo.workshop_id;
        const strTitle = mapInfo.name;
        const elViewBtn = elActions.FindChildInLayoutFile('WorkshopViewPageBtn');
        elViewBtn.enabled = SteamOverlayAPI.IsEnabled();
        elViewBtn.SetPanelEvent('onactivate', () => $.DispatchEvent('CSGOOpenSteamWorkshop', strFileId));
        elActions.FindChildInLayoutFile('WorkshopUnsubscribe').visible = !bInstalledOnly;
        elActions.FindChildInLayoutFile('WorkshopRemoveInstalled').visible = bInstalledOnly;
        const elRemoveBtn = elActions.FindChildInLayoutFile(bInstalledOnly ? 'WorkshopRemoveInstalledBtn' : 'WorkshopUnsubscribeBtn');
        elRemoveBtn.SetPanelEvent('onactivate', () => _ConfirmWorkshopItemRemoval(strFileId, strTitle, bInstalledOnly));
    }
    function _ConfirmWorkshopItemRemoval(strFileId, strTitle, bInstalledOnly) {
        const strPrefix = bInstalledOnly ? '#CSGO_Workshop_Remove_Confirm' : '#CSGO_Workshop_Unsubscribe_Confirm';
        $.GetContextPanel().SetDialogVariable('workshop_item_name', strTitle);
        UiToolkitAPI.ShowGenericPopupOkCancel($.Localize(strPrefix + '_Title'), $.Localize(strPrefix + '_Text', $.GetContextPanel()), '', () => {
            if (bInstalledOnly)
                WorkshopAPI.RemoveInstalledItem(strFileId);
            else
                WorkshopAPI.UnsubscribeItem(strFileId);
        }, () => { });
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
        GameInterfaceAPI.SetSettingString('player_botdifflast_s', botDiff);
    }
    PlayMenu.BotDifficultyChanged = BotDifficultyChanged;
    function _DisplayWorkshopModePopup() {
        const elSelectedMaps = _GetSelectedWorkshopMapButtons();
        let modes = [];
        if (elSelectedMaps.length === 0) {
            UiToolkitAPI.ShowGenericPopupTwoOptions($.Localize('#SFUI_Maps_Workshop_Title'), $.Localize('#SFUI_No_Subscribed_Maps_Desc'), '', '#CSGO_Workshop_Visit', () => $.DispatchEvent('CSGOOpenSteamWorkshop', 'Map'), "OK", () => { });
            $('#StartMatchBtn').RemoveClass('pressed');
            return;
        }
        for (let iMap = 0; iMap < elSelectedMaps.length; ++iMap) {
            const mapModes = elSelectedMaps[iMap].GetAttributeString('data-workshop-modes', '').split(',');
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
            return;
        }
        const children = container.Children();
        for (let i = 0; i < children.length; ++i) {
            const panel = children[i];
            const mapname = panel.GetAttributeString('mapname', '');
            if (mapname === '')
                continue;
            if (filter === '') {
                panel.visible = true;
                continue;
            }
            if (mapname.toLowerCase().includes(filter)) {
                panel.visible = true;
                continue;
            }
            const modes = panel.GetAttributeString('data-workshop-modes', '');
            if (modes.toLowerCase().includes(filter)) {
                panel.visible = true;
                continue;
            }
            const tooltip = panel.GetAttributeString('data-tooltip', '');
            if (tooltip.toLowerCase().includes(filter)) {
                panel.visible = true;
                continue;
            }
            const elMapNameLabel = panel.FindChildTraverse('MapGroupName');
            if (elMapNameLabel && elMapNameLabel.text && elMapNameLabel.text.toLowerCase().includes(filter)) {
                panel.visible = true;
                continue;
            }
            panel.visible = false;
        }
    }
    function _SetPlayDropdownToWorkshop() {
        m_serverSetting = 'listen';
        m_isWorkshop = true;
        _UpdatePrimeBtn(false, LobbyAPI.BIsHost());
        _UpdatePracticeSettingsBtns(false, LobbyAPI.BIsHost());
        if (_GetSelectedWorkshopMap()) {
            _ApplySessionSettings();
        }
        else {
            _SwitchToWorkshopTab(true);
        }
        $.GetContextPanel().SwitchClass("gamemode", 'workshop');
        $.GetContextPanel().SwitchClass("serversetting", m_serverSetting);
    }
    function _WorkshopSubscriptionsChanged() {
        const panel = m_mapSelectionButtonContainers[k_workshopPanelId];
        if (panel) {
            panel.DeleteAsync(0.0);
            delete m_mapSelectionButtonContainers[k_workshopPanelId];
        }
        if (m_activeMapGroupSelectionPanelID != k_workshopPanelId) {
            return;
        }
        if (!LobbyAPI.IsSessionActive()) {
            m_activeMapGroupSelectionPanelID = null;
            return;
        }
        _SyncDialogsFromSessionSettings(LobbyAPI.GetSessionSettings());
        if (LobbyAPI.BIsHost()) {
            _ApplySessionSettings();
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
        $.RegisterForUnhandledEvent('DirectChallenge_GenRandomKey', _OnDirectChallengeRandom);
        $.RegisterForUnhandledEvent('DirectChallenge_EditKey', _OnDirectChallengeEdit);
        $.RegisterForUnhandledEvent('DirectChallenge_CopyKey', _OnDirectChallengeCopy);
        $.RegisterForUnhandledEvent('DirectChallenge_ChooseClanKey', _OnChooseClanKeyBtn);
        $.RegisterForUnhandledEvent('DirectChallenge_ClanChallengeKeySelected', _OnClanChallengeKeySelected);
        $.RegisterForUnhandledEvent('PanoramaComponent_PartyBrowser_PrivateQueuesUpdate', _OnPrivateQueuesUpdate);
        WorkshopAPI.QueryUGCItemSubscriptions();
    }
})(PlayMenu || (PlayMenu = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbm1lbnVfcGxheS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL21haW5tZW51X3BsYXkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUNsQyw0Q0FBNEM7QUFDNUMsa0NBQWtDO0FBQ2xDLDZDQUE2QztBQUM3Qyw4Q0FBOEM7QUFDOUMsNkNBQTZDO0FBQzdDLHVDQUF1QztBQUN2Qyw4Q0FBOEM7QUFDOUMsOENBQThDO0FBQzlDLHlDQUF5QztBQUV6QyxDQUFDLENBQUMsVUFBVSxDQUFFLFlBQVksRUFBRSxRQUFRLENBQUUsQ0FBQztBQUV2QyxJQUFVLFFBQVEsQ0FxaEhqQjtBQXJoSEQsV0FBVSxRQUFRO0lBRWpCLE1BQU0saUJBQWlCLEdBQUcsa0NBQWtDLENBQUM7SUFDN0QsSUFBSSwwQkFBeUMsQ0FBQztJQUc5QyxNQUFNLDhCQUE4QixHQUFvQyxFQUFFLENBQUM7SUFFM0UsSUFBSSxpQkFBaUIsR0FBdUMsRUFBRSxDQUFDO0lBRS9ELElBQUksbUJBQW1CLEdBQWMsRUFBRSxDQUFDO0lBRXhDLElBQUksWUFBNEMsQ0FBQztJQUNqRCxJQUFJLFdBQW1ELENBQUM7SUFFeEQsTUFBTSxlQUFlLEdBQUcsQ0FBRSxZQUFZLENBQUMsZUFBZSxFQUFFLEtBQUssY0FBYyxDQUFFLENBQUM7SUFDOUUsSUFBSSxnQ0FBZ0MsR0FBa0IsSUFBSSxDQUFDO0lBRzNELElBQUksZUFBZSxHQUFHLEVBQUUsQ0FBQztJQUN6QixJQUFJLGlCQUFpQixHQUFHLEVBQUUsQ0FBQztJQUMzQixJQUFJLHdCQUF3QixHQUFrQixJQUFJLENBQUM7SUFDbkQsSUFBSSw0QkFBNEIsR0FBYSxFQUFFLENBQUM7SUFHaEQsTUFBTSxlQUFlLEdBQWdDLEVBQUUsQ0FBQztJQUd4RCxJQUFJLFlBQVksR0FBRyxLQUFLLENBQUM7SUFFekIsSUFBSSxxQkFBcUIsR0FBcUIsS0FBSyxD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