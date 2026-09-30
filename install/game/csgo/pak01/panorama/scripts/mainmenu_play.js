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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbm1lbnVfcGxheS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL21haW5tZW51X3BsYXkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUNsQyw0Q0FBNEM7QUFDNUMsa0NBQWtDO0FBQ2xDLDZDQUE2QztBQUM3Qyw4Q0FBOEM7QUFDOUMsNkNBQTZDO0FBQzdDLHVDQUF1QztBQUN2Qyw4Q0FBOEM7QUFDOUMsOENBQThDO0FBQzlDLHlDQUF5QztBQUV6QyxDQUFDLENBQUMsVUFBVSxDQUFFLFlBQVksRUFBRSxRQUFRLENBQUUsQ0FBQztBQUV2QyxJQUFVLFFBQVEsQ0FtNkdqQjtBQW42R0QsV0FBVSxRQUFRO0lBRWpCLE1BQU0saUJBQWlCLEdBQUcsa0NBQWtDLENBQUM7SUFDN0QsSUFBSSwwQkFBeUMsQ0FBQztJQUc5QyxNQUFNLDhCQUE4QixHQUFvQyxFQUFFLENBQUM7SUFFM0UsSUFBSSxpQkFBaUIsR0FBdUMsRUFBRSxDQUFDO0lBRS9ELElBQUksbUJBQW1CLEdBQWMsRUFBRSxDQUFDO0lBRXhDLElBQUksWUFBNEMsQ0FBQztJQUNqRCxJQUFJLFdBQW1ELENBQUM7SUFFeEQsTUFBTSxlQUFlLEdBQUcsQ0FBRSxZQUFZLENBQUMsZUFBZSxFQUFFLEtBQUssY0FBYyxDQUFFLENBQUM7SUFDOUUsSUFBSSxnQ0FBZ0MsR0FBa0IsSUFBSSxDQUFDO0lBRzNELElBQUksZUFBZSxHQUFHLEVBQUUsQ0FBQztJQUN6QixJQUFJLGlCQUFpQixHQUFHLEVBQUUsQ0FBQztJQUMzQixJQUFJLHdCQUF3QixHQUFrQixJQUFJLENBQUM7SUFDbkQsSUFBSSw0QkFBNEIsR0FBYSxFQUFFLENBQUM7SUFHaEQsTUFBTSxlQUFlLEdBQWdDLEVBQUUsQ0FBQztJQUd4RCxJQUFJLFlBQVksR0FBRyxLQUFLLENBQUM7SUFFekIsSUFBSSxxQkFBcUIsR0FBcUIsS0FBSyxD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