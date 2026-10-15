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
    function Init(srcText) {
        if (MyPersonaAPI.GetElevatedState() != "elevated")
            return;
        const logPrefix = '[p.missions] ' + srcText + ': ' + $.GetContextPanel().id + ': ';
        let missionData = undefined;
        if (IsThePauseMenuPanel()) {
            missionData = MissionsAPI.GetRecurringMission(false);
        }
        if (!missionData) {
            missionData = MissionsAPI.GetRecurringMission(!IsTheInGamePanel());
        }
        $.GetContextPanel().Data().m_oMissionData = missionData;
        if (!$.GetContextPanel().Data().m_oMissionData) {
            $.GetContextPanel().AddClass('hidden');
            return;
        }
        if (IsTheInGamePanel()) {
            if (!$.GetContextPanel().Data().m_livePointsCache) {
                $.GetContextPanel().Data().m_livePointsCache = -1;
            }
            if (FriendsListAPI.IsGameInWarmup()) {
                $.GetContextPanel().AddClass('hidden');
                return;
            }
            if (GameStateAPI.GetMapBSPName() === 'lobby_mapveto') {
                $.GetContextPanel().AddClass('hidden');
                return;
            }
            if (!GameStateAPI.GetActiveQuestID()) {
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
            }
        }
        else if (!IsTheInGamePanel()) {
            if (!MyPersonaAPI.IsConnectedToGC()) {
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
            const actionId = missionData.string_tokens?.action_id;
            const actionDirective = actionId ? $.Localize(`#mission_directive_${actionId}:f`, elPanel) : '';
            elPanel.SetDialogVariable('action_directive', actionDirective);
            const frame = progress > 0 ? '#mission_directive_progress:f' : '#mission_directive:f';
            elDirective.SetLocString(frame);
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
        const elProg = $.GetContextPanel().FindChildTraverse('progressBaContainer');
        if (!elProg)
            return;
        SegmentedProgressBar.SetValue(elProg, missionData.progress_saved, 'Base');
        if (missionData.progress_this_match) {
            const liveValue = missionData.progress_saved + missionData.progress_this_match;
            SegmentedProgressBar.SetValue(elProg, liveValue, 'Live');
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlzc2lvbl90aWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvbWlzc2lvbl90aWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFDbEMsNkNBQTZDO0FBQzdDLGtEQUFrRDtBQUVsRCxDQUFDLENBQUMsVUFBVSxDQUFFLFlBQVksRUFBRSxRQUFRLENBQUUsQ0FBQztBQUV2QyxJQUFVLFdBQVcsQ0FnaEJwQjtBQWhoQkQsV0FBVSxXQUFXO0lBRXBCLFNBQVMsZ0JBQWdCO1FBRXhCLE9BQU8sQ0FBRSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsRUFBRSxLQUFLLGlCQUFpQixDQUFFLENBQUM7SUFDekQsQ0FBQztJQUVELFNBQVMsbUJBQW1CO1FBRTNCLE9BQU8sQ0FBRSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsRUFBRSxLQUFLLDRCQUE0QixDQUFFLENBQUM7SUFDcEUsQ0FBQztJQUVELFNBQVMsa0JBQWtCO1FBRTFCLE9BQU8sQ0FBRSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsRUFBRSxLQUFLLDJCQUEyQixDQUFFLENBQUM7SUFDbkUsQ0FBQztJQUdELFNBQWdCLElBQUksQ0FBRyxPQUFlO1FBRXJDLElBQUssWUFBWSxDQUFDLGdCQUFnQixFQUFFLElBQUksVUFBVTtZQUNqRCxPQUFPO1FBSVIsTUFBTSxTQUFTLEdBQUcsZUFBZSxHQUFHLE9BQU8sR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUM7UUFJbkYsSUFBSSxXQUFXLEdBQUcsU0FBUyxDQUFDO1FBSTVCLElBQUssbUJBQW1CLEVBQUUsRUFDMUI7WUFDQyxXQUFXLEdBQUcsV0FBVyxDQUFDLG1CQUFtQixDQUFFLEtBQUssQ0FBRSxDQUFDO1NBQ3ZEO1FBRUQsSUFBSyxDQUFDLFdBQVcsRUFDakI7WUFDQyxXQUFXLEdB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