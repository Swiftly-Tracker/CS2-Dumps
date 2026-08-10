"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/formattext.ts" />
/// <reference path="segmented_progress_bar.ts" />
$.LogChannel("p.missions", "LV_OFF");
var MissionTile;
(function (MissionTile) {
    function IsTheInGamePanel() {
        return ($.GetContextPanel().id === 'HudMissionPanel');
    }
    function IsThePauseMenuPanel() {
        return ($.GetContextPanel().id === 'id-pausemenu-mission-panel');
    }
    function IsTheMainMenuPanel() {
        return ($.GetContextPanel().id === 'id-mainmenu-mission-panel');
    }
    function _msg(text) {
    }
    function Init(srcText) {
        if (MyPersonaAPI.GetElevatedState() != "elevated")
            return;
        function _msg(text) {
        }
        _msg("Init");
        let missionData = undefined;
        if (IsThePauseMenuPanel()) {
            missionData = MissionsAPI.GetRecurringMission(false);
        }
        if (!missionData) {
            missionData = MissionsAPI.GetRecurringMission(!IsTheInGamePanel());
        }
        $.GetContextPanel().Data().m_oMissionData = missionData;
        if (!$.GetContextPanel().Data().m_oMissionData) {
            _msg("no GetRecurringMissions()");
            $.GetContextPanel().AddClass('hidden');
            return;
        }
        if (IsTheInGamePanel()) {
            if (!$.GetContextPanel().Data().m_livePointsCache) {
                $.GetContextPanel().Data().m_livePointsCache = -1;
            }
            if (FriendsListAPI.IsGameInWarmup()) {
                _msg("warmup");
                $.GetContextPanel().AddClass('hidden');
                return;
            }
            if (GameStateAPI.GetMapBSPName() === 'lobby_mapveto') {
                _msg("lobby_mapveto");
                $.GetContextPanel().AddClass('hidden');
                return;
            }
            if (!GameStateAPI.GetActiveQuestID()) {
                _msg("NO QUEST ID");
                $.GetContextPanel().AddClass('hidden');
                return;
            }
            $.GetContextPanel().SetHasClass('stop-anims', missionData.progress_saved +
                $.GetContextPanel().Data().m_livePointsCache >= missionData.goal_points.slice(-1)[0]);
            if (missionData.progress_this_match &&
                missionData.progress_this_match > $.GetContextPanel().Data().m_livePointsCache) {
                $.GetContextPanel().TriggerClass('progress-pulse');
                $.GetContextPanel().Data().m_livePointsCache = missionData.progress_this_match;
                $.DispatchEvent('CSGOPlaySoundEffect', 'UI.Mission.QuotaUp', 'MOUSE');
                _msg('PULSE');
            }
        }
        else if (!IsTheInGamePanel()) {
            if (!MyPersonaAPI.IsConnectedToGC()) {
                _msg("no gc");
                $.GetContextPanel().AddClass('hidden');
                return;
            }
            let imagePath = 'undefined';
            if (missionData.hasOwnProperty('mapgroup') && missionData.mapgroup != '') {
                const cfg = GameTypesAPI.GetConfig();
                const mg = cfg.mapgroups[$.GetContextPanel().Data().m_oMissionData['mapgroup']];
                const keysList = Object.keys(mg.maps);
                imagePath = keysList[0];
            }
            else if (missionData.hasOwnProperty('map') && missionData.map && missionData.map != '') {
                imagePath = missionData.map;
            }
            const elBgArt = $.GetContextPanel().FindChildTraverse('missionArtBG');
            if (elBgArt) {
                elBgArt.style.backgroundImage = 'url("file://{images}/map_icons/screenshots/720p/' + (imagePath) + '.png")';
                elBgArt.style.backgroundPosition = '50% 0%';
                elBgArt.style.backgroundSize = 'cover';
            }
            SetButtonPlayMission();
            SessionUpdate();
        }
        $.GetContextPanel().SetHasClass('COMPLETE', missionData.progress_saved +
            (missionData.progress_this_match ? missionData.progress_this_match : 0) >= missionData.goal_points.slice(-1)[0]);
        _msg("progress_this_match " + missionData.progress_this_match);
        $.GetContextPanel().RemoveClass('hidden');
        ConstructMissionStrings($.GetContextPanel());
        if (!$.GetContextPanel().Data().hasOwnProperty('id') ||
            $.GetContextPanel().Data().m_oMissionData.id != $.GetContextPanel().Data().id) {
            const elProg = $.GetContextPanel().FindChildTraverse('progressBaContainer');
            if (elProg) {
                SegmentedProgressBar.Init(elProg, missionData);
            }
            $.GetContextPanel().Data().id = missionData.id;
        }
        UpdateProgressBar(missionData);
    }
    MissionTile.Init = Init;
    function SetButtonPlayMission() {
        if (!GetButtonPanel())
            return;
        GetButtonPanel().SetPanelEvent("onactivate", () => PlayMission());
    }
    function SetButtonCancelSearch() {
        if (!GetButtonPanel())
            return;
        GetButtonPanel().SetPanelEvent("onactivate", () => LobbyAPI.StopMatchmaking());
    }
    function SetButtonEnabled(enabled) {
        if (!GetButtonPanel())
            return;
        GetButtonPanel().enabled = enabled;
        GetButtonPanel().SetHasClass('DISABLED', !enabled);
    }
    function GetButtonPanel() {
        return $.GetContextPanel().FindChildTraverse('missionButton');
    }
    function GetToolTip(elPanel) {
        return elPanel.Data().missionText;
    }
    MissionTile.GetToolTip = GetToolTip;
    function ConstructMissionStrings(elPanel) {
        const missionData = elPanel.Data().m_oMissionData;
        let progress = missionData.progress_saved;
        if (missionData.progress_this_match) {
            progress = missionData.progress_saved + missionData.progress_this_match;
            progress = Math.min(progress, missionData.goal_points.slice(-1)[0]);
        }
        let offsetProgress = progress;
        let nextXp = missionData.xp_reward.slice(0)[0];
        let goal = missionData.goal_points.slice(0)[0];
        for (let i = 0; i < missionData.goal_points.length; i++) {
            if ((progress < missionData.goal_points[i])) {
                if (i > 0) {
                    goal = missionData.goal_points[i] - missionData.goal_points[i - 1];
                    offsetProgress -= missionData.goal_points[i - 1];
                }
                nextXp = missionData.xp_reward[i];
                break;
            }
        }
        const totalXp = missionData.xp_reward.reduceRight((acc, cur) => acc + cur, 0);
        let missionPoints = missionData.goal_points.slice(-1)[0];
        elPanel.SetDialogVariableInt("mission-points", missionPoints);
        elPanel.SetDialogVariableInt("mission-progress", progress);
        elPanel.SetDialogVariableInt("mission-points-checkpoint", goal);
        elPanel.SetDialogVariable("mission-xp", totalXp);
        const elDirective = elPanel.FindChildTraverse('mission-main-label');
        if (elDirective) {
            const token = progress > 0 ? '#mission_directive_progress:f' : '#mission_directive:f';
            elDirective.SetLocString(token);
        }
        const timeRemaining = FormatText.SecondsToSignificantTimeString(missionData.seconds_remaining);
        elPanel.SetDialogVariable('mission-time-remaining', timeRemaining);
        elPanel.SetHasClass('hide-time', missionData.seconds_remaining <= 0);
        ExtractStringTokens(elPanel, missionData.string_tokens);
        const desc = $.Localize(missionData.loc_description, elPanel);
        elPanel.SetDialogVariable('mission_desc', desc);
        const partialToken = missionData.loc_description.replace("desc", "partial");
        const partial = $.Localize(partialToken, elPanel);
        elPanel.SetDialogVariable('mission_partial', partial);
        const ingameToken = missionData.loc_description.replace("desc", "ingame");
        const ingame = $.Localize(ingameToken, elPanel);
        elPanel.SetDialogVariable('mission_ingame', ingame);
        const elMapIcon = elPanel.FindChildTraverse('missionMapicon');
        if (elMapIcon) {
            if (missionData.map) {
                const iconPath = "file://{images}/map_icons/map_icon_" + missionData.map + ".svg";
                elMapIcon.SetImage(iconPath);
                elMapIcon.style.visibility = 'visible';
            }
            else {
                elMapIcon.style.visibility = 'collapse';
            }
        }
        const elModeIcon = elPanel.FindChildTraverse('missionModeicon');
        if (elModeIcon) {
            if (missionData.gamemode) {
                const iconPath = "file://{images}/icons/ui/" + missionData.gamemode + ".svg";
                elModeIcon.SetImage(iconPath);
                elModeIcon.style.visibility = 'visible';
            }
            else {
                elModeIcon.style.visibility = 'collapse';
            }
        }
    }
    function ExtractStringTokens(elPanel, strings) {
        for (const k in strings) {
            if (typeof strings[k] === 'object' && !Array.isArray(strings[k]) && strings[k] !== null) {
                ExtractStringTokens(elPanel, strings[k]);
            }
            else {
                let val = strings[k];
                val = $.Localize(val);
                switch (k) {
                    case 'gamemode':
                    case 'location':
                    case 'actions':
                    case 'action':
                        val = val.toUpperCase();
                }
                elPanel.SetDialogVariable(k, val);
            }
        }
    }
    MissionTile.ExtractStringTokens = ExtractStringTokens;
    function UpdateProgressBar(missionData) {
        function _msg(text) {
        }
        const elProg = $.GetContextPanel().FindChildTraverse('progressBaContainer');
        if (!elProg)
            return;
        SegmentedProgressBar.SetValue(elProg, missionData.progress_saved, 'Base');
        if (missionData.progress_this_match) {
            const liveValue = missionData.progress_saved + missionData.progress_this_match;
            SegmentedProgressBar.SetValue(elProg, liveValue, 'Live');
        }
        _msg(missionData.progress_saved + ' ' + missionData.progress_this_match);
    }
    function GetSearchStatus() {
        return LobbyAPI.GetMatchmakingStatusString();
    }
    ;
    function IsSearching() {
        let StatusString = GetSearchStatus();
        return (StatusString !== '' && StatusString !== null) ? true : false;
    }
    function SessionUpdate() {
        if (IsTheInGamePanel() || IsThePauseMenuPanel())
            return;
        $.GetContextPanel().Data().m_oMissionData = MissionsAPI.GetRecurringMission(true);
        if (!$.GetContextPanel().Data().m_oMissionData) {
            $.GetContextPanel().AddClass('hidden');
            return;
        }
        const xuid = MyPersonaAPI.GetXuid();
        const inParty = PartyListAPI.GetCount() > 1;
        const isLobbyLeader = LobbyAPI.GetHostSteamID() === xuid;
        let isSearchingForMission = false;
        const lobbySettings = LobbyAPI.GetSessionSettings();
        if (IsSearching() && lobbySettings && lobbySettings.game) {
            const lobbySettings = LobbyAPI.GetSessionSettings();
            isSearchingForMission = lobbySettings.game.mode == $.GetContextPanel().Data().m_oMissionData.gamemode &&
                (lobbySettings.game.mapgroupname == $.GetContextPanel().Data().m_oMissionData.mapgroup ||
                    lobbySettings.game.map == $.GetContextPanel().Data().m_oMissionData.map);
        }
        GetButtonPanel().SetHasClass('LOBBY_SUB', inParty && !isLobbyLeader);
        $.GetContextPanel().SetHasClass('SEARCHING', IsSearching());
        $.GetContextPanel().SetHasClass('SEARCHING_FOR_MISSION', isSearchingForMission);
        SetButtonEnabled((!inParty || (inParty && isLobbyLeader)) && !(IsSearching() && !isSearchingForMission));
        if (isSearchingForMission) {
            SetButtonCancelSearch();
        }
        else {
            SetButtonPlayMission();
        }
    }
    function PlayMission() {
        $.DispatchEvent('PlayMenu_SwitchGameModeTab', $.GetContextPanel().Data().m_oMissionData.gamemode);
        $.DispatchEvent('CSGOPlaySoundEffect', 'mainmenu_mission_start', 'MOUSE');
        LobbyAPI.CreateSession();
        const gameMode = $.GetContextPanel().Data().m_oMissionData.gamemode;
        let gameType = "classic";
        let gmFlags = 0;
        if (gameMode === "deathmatch") {
            gameType = "gungame";
            gmFlags = 32;
        }
        let mg = $.GetContextPanel().Data().m_oMissionData.mapgroup;
        if (gameMode == "competitive") {
            mg = "mg_" + $.GetContextPanel().Data().m_oMissionData.map;
            gmFlags = 16;
        }
        var settings = {
            update: {
                Options: {
                    action: "custommatch",
                    server: "official"
                },
                Game: {
                    mode: gameMode,
                    type: gameType,
                    mapgroupname: mg,
                    map: $.GetContextPanel().Data().m_oMissionData.map ? $.GetContextPanel().Data().m_oMissionData.map : "",
                    gamemodeflags: gmFlags,
                },
            },
            delete: {
                Options: {
                    challengekey: 1
                }
            }
        };
        LobbyAPI.UpdateSessionSettings(settings);
        LobbyAPI.StartMatchmaking('', '', '', '');
    }
    function OnRoundStart() {
        $.GetContextPanel().AddClass('FREEZETIME');
    }
    function OnFreezeTimeEnd() {
        $.GetContextPanel().RemoveClass('FREEZETIME');
    }
    function UpdateHud() {
        if (IsTheInGamePanel()) {
            Init("UpdateHud");
        }
    }
    function UpdatePauseMenu() {
        if (IsThePauseMenuPanel()) {
            Init("UpdatePauseMenu");
        }
    }
    function UpdateMainMenu() {
        if (IsTheMainMenuPanel()) {
            Init("UpdateMainMenu");
        }
    }
    {
        Init('default');
        $.RegisterForUnhandledEvent('OnRecurringMissionsReceived', Init.bind(null, "OnRecurringMissionsReceived"));
        $.RegisterForUnhandledEvent('OnRecurringMissionsChanged', Init.bind(null, "OnRecurringMissionsChanged"));
        $.RegisterForUnhandledEvent("GameState_OnMatchStart", UpdateHud);
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_UpdateConnectionToGC', Init.bind(null, "PanoramaComponent_MyPersona_UpdateConnectionToGC"));
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_GcLogonNotificationReceived', Init.bind(null, "PanoramaComponent_MyPersona_GcLogonNotificationReceived"));
        $.RegisterForUnhandledEvent("CSGOShowPauseMenu", UpdatePauseMenu);
        $.RegisterForUnhandledEvent('OnQuestProgressMade', UpdateHud);
        $.RegisterForUnhandledEvent('PanoramaComponent_Lobby_MatchmakingSessionUpdate', () => { UpdateMainMenu(); UpdatePauseMenu(); });
        $.RegisterForUnhandledEvent('OnRoundFreezeTimeEnd', OnFreezeTimeEnd);
        $.RegisterForUnhandledEvent('OnRoundStart', OnRoundStart);
        $.RegisterForUnhandledEvent('CSGOShowMainMenu', UpdateMainMenu);
    }
})(MissionTile || (MissionTile = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlzc2lvbl90aWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvbWlzc2lvbl90aWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFDbEMsNkNBQTZDO0FBQzdDLGtEQUFrRDtBQUVsRCxDQUFDLENBQUMsVUFBVSxDQUFFLFlBQVksRUFBRSxRQUFRLENBQUUsQ0FBQztBQUV2QyxJQUFVLFdBQVcsQ0F1aEJwQjtBQXZoQkQsV0FBVSxXQUFXO0lBRXBCLFNBQVMsZ0JBQWdCO1FBRXhCLE9BQU8sQ0FBRSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsRUFBRSxLQUFLLGlCQUFpQixDQUFFLENBQUM7SUFDekQsQ0FBQztJQUVELFNBQVMsbUJBQW1CO1FBRTNCLE9BQU8sQ0FBRSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsRUFBRSxLQUFLLDRCQUE0QixDQUFFLENBQUM7SUFDcEUsQ0FBQztJQUVELFNBQVMsa0JBQWtCO1FBRTFCLE9BQU8sQ0FBRSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsRUFBRSxLQUFLLDJCQUEyQixDQUFFLENBQUM7SUFDbkUsQ0FBQztJQUdELFNBQVMsSUFBSSxDQUFHLElBQVk7SUFHNUIsQ0FBQztJQUVELFNBQWdCLElBQUksQ0FBRyxPQUFlO1FBRXJDLElBQUssWUFBWSxDQUFDLGdCQUFnQixFQUFFLElBQUksVUFBVTtZQUNqRCxPQUFPO1FBRVIsU0FBUyxJQUFJLENBQUcsSUFBWTtRQUc1QixDQUFDO1FBRUQsSUFBSSxDQUFFLE1BQU0sQ0FBRSxDQUFDO1FBRWYsSUFBSSxXQUFXLEdBQUcsU0FBUyxDQUFDO1FBSTVCLElBQUssbUJBQW1CLEVBQUUsRUFDMUI7WUFDQyxXQUFXLEdBQUcsV0FBVyxDQUFDLG1CQUFtQixDQUFFLEtBQUssQ0FBRSxDQUFDO1NBQ3ZEO1FBRUQsSUFBSyxDQUFDLFdBQVcsRUFDakI7WUFDQyxX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