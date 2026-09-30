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
        // Not searching so hide the panel
        if (!isSearching)
            return;
        // Set Status Text
        let elMatchStatsLabel = elMatchStats.FindChildInLayoutFile('LobbyTooltipStatsTitle');
        elMatchStatsLabel.text = $.Localize(searchingStatus);
        // Get stats and make the rows
        let matchmakeingStats = LobbyAPI.GetMatchmakingStatistics();
        let elStats = elMatchStats.FindChildInLayoutFile('LobbyTooltipStatsList');
        elStats.RemoveAndDeleteChildren();
        /*
            matchmakeingStats object
            "avgSearchTimeSeconds"
            "ongoingMatches"
            "playersOnline"
            "playersSearching"
            "serversAvailable"
            "serversOnline"
            "serversReachable"
        */
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
            // let icon_name = 'five_stack';
            // if ( matchmakeingStats.playersLockedIn <= 2 ) icon_name = 'two_stack';
            // else if ( matchmakeingStats.playersLockedIn <= 3 ) icon_name = 'three_stack';
            // else if ( matchmakeingStats.playersLockedIn <= 4 ) icon_name = 'four_stack';
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
            //icon
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