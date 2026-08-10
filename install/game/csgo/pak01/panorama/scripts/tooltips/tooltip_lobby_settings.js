"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../common/formattext.ts" />
/// <reference path="../common/sessionutil.ts" />
/// <reference path="../util_gamemodeflags.ts" />
var TooltipLobby;
(function (TooltipLobby) {
    let m_GameSettings = {};
    let m_GameOptions = {};
    let m_RefreshStatsScheduleHandle = false;
    function Init() {
        if (LobbyAPI.IsSessionActive()) {
            _CancelStatsRefresh();
            _GetLobbySettings();
            _Permissions();
            _SetPrimeStatus();
            _SetMode();
            _SetMaps();
            _GetLobbyStatistics();
            _SetGameModeFlags();
            _SetDirectChallengeSettings();
        }
        else {
            UiToolkitAPI.HideCustomLayoutTooltip('LobbySettingsTooltip');
        }
    }
    TooltipLobby.Init = Init;
    function _CancelStatsRefresh() {
        if (m_RefreshStatsScheduleHandle !== false) {
            $.CancelScheduled(m_RefreshStatsScheduleHandle);
            m_RefreshStatsScheduleHandle = false;
        }
    }
    function _GetLobbyStatistics() {
        m_RefreshStatsScheduleHandle = $.Schedule(2, _GetLobbyStatistics);
        let searchingStatus = LobbyAPI.GetMatchmakingStatusString();
        let elMatchStats = $.GetContextPanel().FindChildInLayoutFile('LobbyTooltipStats');
        let isSearching = searchingStatus !== '' && searchingStatus !== undefined ? true : false;
        elMatchStats.SetHasClass('hidden', !isSearching);
        if (!isSearching)
            return;
        let elMatchStatsLabel = elMatchStats.FindChildInLayoutFile('LobbyTooltipStatsTitle');
        elMatchStatsLabel.text = $.Localize(searchingStatus);
        let matchmakeingStats = LobbyAPI.GetMatchmakingStatistics();
        let elStats = elMatchStats.FindChildInLayoutFile('LobbyTooltipStatsList');
        elStats.RemoveAndDeleteChildren();
        function MakeStatsRow(statType, iconName) {
            let p = $.CreatePanel('Panel', elStats, '');
            p.BLoadLayoutSnippet("SettingsEntry");
            if (statType === 'avgSearchTimeSeconds') {
                let time = FormatText.SecondsToDDHHMMSSWithSymbolSeperator(matchmakeingStats[statType]);
                p.SetDialogVariable('stat', time);
            }
            else {
                p.SetDialogVariableInt('stat', matchmakeingStats[statType]);
            }
            if (statType === 'playersLockedIn') {
                let totalPlayers = SessionUtil.GetMaxLobbySlotsForGameMode(m_GameSettings.mode);
                totalPlayers *= 2;
                p.SetDialogVariableInt('total_stat', totalPlayers);
            }
            p.FindChildInLayoutFile('SettingText').text = $.Localize('#matchmaking_stat_' + statType + ':f', p);
            p.FindChildInLayoutFile('SettingImage').SetImage('file://{images}/icons/ui/' + iconName + '.svg');
            p.FindChildInLayoutFile('SettingImage').AddClass('tint');
        }
        MakeStatsRow('avgSearchTimeSeconds', 'clock');
        MakeStatsRow('playersOnline', 'lobby');
        if (matchmakeingStats.hasOwnProperty('playersLockedIn') && matchmakeingStats.playersLockedIn
            && !["cooperative", "coopmission"].includes(m_GameSettings.mode)) {
            MakeStatsRow('playersLockedIn', 'find');
        }
        else {
            MakeStatsRow('playersSearching', 'find');
        }
        MakeStatsRow('serversOnline', 'servers');
    }
    function _GetLobbySettings() {
        let gss = LobbyAPI.GetSessionSettings();
        m_GameSettings = gss.game;
        m_GameOptions = gss.options;
    }
    function _SetPrimeStatus() {
        let isLocalPlayerPrime = MyPersonaAPI.GetElevatedState() === "elevated";
        let displayText = !isLocalPlayerPrime
            ? '#prime_not_enrolled_label'
            : (m_GameSettings.prime === 1 && SessionUtil.AreLobbyPlayersPrime())
                ? '#prime_only_label'
                : '#prime_priority_label';
        let elPrimeText = $.GetContextPanel().FindChildInLayoutFile('LobbyTooltipPrime');
        elPrimeText.text = $.Localize(displayText);
        _SetRankedStatus(isLocalPlayerPrime);
    }
    function _SetDirectChallengeSettings() {
        let elDirectChallengeText = $.GetContextPanel().FindChildInLayoutFile('LobbyDirectChallenge');
        let gss = LobbyAPI.GetSessionSettings();
        let bPrivate = gss.options.hasOwnProperty('challengekey') && gss.options.challengekey != '';
        elDirectChallengeText.text = bPrivate ? $.Localize('#DirectChallenge_lobbysettings_on2') : $.Localize('#DirectChallenge_lobbysettings_off');
        let elContainer = $.GetContextPanel().FindChildInLayoutFile('LobbyTooltipDirectChallengeContainer');
        elContainer.visible = bPrivate;
    }
    function _SetGameModeFlags() {
        let elContainer = $.GetContextPanel().FindChildInLayoutFile('LobbyTooltipGameModeFlagsContainer');
        let flags = parseInt(m_GameSettings.gamemodeflags);
        if (!flags || !GameModeFlags.DoesModeUseFlags(m_GameSettings.mode) ||
            !GameModeFlags.DoesModeShowUserVisibleFlags(m_GameSettings.mode)) {
            elContainer.visible = false;
            return;
        }
        elContainer.visible = true;
        let displayTextToken = '#play_setting_gamemodeflags_' + m_GameSettings.mode + '_' + m_GameSettings.gamemodeflags;
        elContainer.SetDialogVariable('gamemodeflags', $.Localize(displayTextToken));
        let elIcon = $.GetContextPanel().FindChildTraverse('LobbyTooltipGamdeModeFlagsImage');
        let icon = GameModeFlags.GetIcon(m_GameSettings.mode, flags);
        elIcon.SetImage(icon);
    }
    function _SetRankedStatus(isLocalPlayerPrime) {
        let elRankedText = $.GetContextPanel().FindChildInLayoutFile('LobbyTooltipRanked');
        if (!isLocalPlayerPrime || !SessionUtil.DoesGameModeHavePrimeQueue(m_GameSettings.mode)) {
            elRankedText.GetParent().visible = false;
            return;
        }
        elRankedText.GetParent().visible = true;
        let isRanked = m_GameSettings.prime === 1 && SessionUtil.AreLobbyPlayersPrime();
        elRankedText.text = isRanked ? $.Localize("#prime_ranked") : $.Localize("#prime_unranked");
    }
    function _Permissions() {
        let systemSettings = LobbyAPI.GetSessionSettings().system;
        if (!systemSettings)
            return;
        let systemAccess = systemSettings.access;
        let displayText = '';
        if (systemAccess === 'public') {
            displayText = '#permissions_' + systemAccess;
        }
        else {
            displayText = '#permissions_' + systemAccess;
        }
        $.GetContextPanel().FindChildInLayoutFile('LobbyTooltipPermissions').text = $.Localize(displayText);
    }
    function _SetMode() {
        let elGameModeTitle = $.GetContextPanel().FindChildInLayoutFile('LobbyTooltipGameMode');
        elGameModeTitle.FindChild('SettingText').text = $.Localize('#SFUI_GameMode' + m_GameSettings.mode_ui);
        elGameModeTitle.FindChild('SettingImage').SetImage('file://{images}/icons/ui/' + m_GameSettings.mode + '.svg');
        elGameModeTitle.FindChild('SettingImage').SetHasClass('tint', m_GameSettings.mode !== "competitive");
    }
    function _SetMaps() {
        if (!m_GameSettings.mapgroupname)
            return;
        let mapsList;
        mapsList = m_GameSettings.mapgroupname.split(',');
        let elMapsSection = $.GetContextPanel().FindChildInLayoutFile('LobbyTooltipMapsList');
        elMapsSection.RemoveAndDeleteChildren();
        $.CreatePanel('Label', elMapsSection, 'LobbyMapsListTitle', {
            class: 'tooltip-player-xp__title--small',
            text: '#party_tooltip_maps'
        });
        for (let element of mapsList) {
            let p = $.CreatePanel('Panel', elMapsSection, element);
            p.BLoadLayoutSnippet("SettingsEntry");
            let strMapText = '';
            if (element === 'mg_lobby_mapveto' && m_GameOptions && m_GameOptions.challengekey) {
                strMapText = $.Localize("#SFUI_Lobby_LeaderMatchmaking_Type_PremierPrivateQueue");
            }
            else if (m_GameSettings.mode === "skirmish") {
                strMapText = $.Localize(GameTypesAPI.GetMapGroupAttribute('mg_' + m_GameSettings.map, 'nameID'));
            }
            else {
                strMapText = $.Localize(GameTypesAPI.GetMapGroupAttribute(element, 'nameID'));
            }
            p.FindChildInLayoutFile('SettingText').text = strMapText;
            let iconName;
            if (m_GameSettings.mode === "skirmish") {
                iconName = m_GameSettings.map;
            }
            else {
                iconName = GameTypesAPI.GetMapGroupAttributeSubKeys(element, 'maps').split(',')[0];
            }
            p.FindChildInLayoutFile('SettingImage').SetImage('file://{images}/map_icons/map_icon_' + iconName + '.svg');
        }
    }
    $.RegisterForUnhandledEvent("PanoramaComponent_Lobby_MatchmakingSessionUpdate", Init);
    $.RegisterForUnhandledEvent("CSGOHideMainMenu", _CancelStatsRefresh);
    $.RegisterForUnhandledEvent("CSGOHidePauseMenu", _CancelStatsRefresh);
})(TooltipLobby || (TooltipLobby = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbHRpcF9sb2JieV9zZXR0aW5ncy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3Rvb2x0aXBzL3Rvb2x0aXBfbG9iYnlfc2V0dGluZ3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyxnREFBZ0Q7QUFDaEQsaURBQWlEO0FBQ2pELGlEQUFpRDtBQUVqRCxJQUFVLFlBQVksQ0FvUnJCO0FBcFJELFdBQVUsWUFBWTtJQUVyQixJQUFJLGNBQWMsR0FBNEIsRUFBRSxDQUFDO0lBQ2pELElBQUksYUFBYSxHQUE0QixFQUFFLENBQUM7SUFDaEQsSUFBSSw0QkFBNEIsR0FBbUIsS0FBSyxDQUFDO0lBRXpELFNBQWdCLElBQUk7UUFFbkIsSUFBSyxRQUFRLENBQUMsZUFBZSxFQUFFLEVBQy9CO1lBQ0MsbUJBQW1CLEVBQUUsQ0FBQztZQUN0QixpQkFBaUIsRUFBRSxDQUFDO1lBQ3BCLFlBQVksRUFBRSxDQUFDO1lBQ2YsZUFBZSxFQUFFLENBQUM7WUFDbEIsUUFBUSxFQUFFLENBQUM7WUFDWCxRQUFRLEVBQUUsQ0FBQztZQUNYLG1CQUFtQixFQUFFLENBQUM7WUFDdEIsaUJBQWlCLEVBQUUsQ0FBQztZQUNwQiwyQkFBMkIsRUFBRSxDQUFDO1NBQzlCO2FBRUQ7WUFDQyxZQUFZLENBQUMsdUJBQXVCLENBQUMsc0JBQXNCLENBQUMsQ0FBQztTQUM3RDtJQUNGLENBQUM7SUFsQmUsaUJBQUksT0FrQm5CLENBQUE7SUFFRCxTQUFTLG1CQUFtQjtRQUUzQixJQUFJLDRCQUE0QixLQUFLLEtBQUssRUFDMUM7WUFDQyxDQUFDLENBQUMsZUFBZSxDQUFFLDRCQUE0QixDQUFFLENBQUM7WUFDbEQsNEJBQTRCLEdBQUcsS0FBSyxDQUFDO1NBQ3JDO0lBQ0YsQ0FBQztJQUVELFNBQVMsbUJBQW1CO1FBRTNCLDRCQUE0QixHQUFHLENBQUMsQ0FBQyxRQUFR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