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
        // Several mission tiles are live at once (main menu, pause menu, HUD), so the
        // caller tag and panel id are what tell their p.missions spew apart.
        const logPrefix = '[p.missions] ' + srcText + ': ' + $.GetContextPanel().id + ': ';
        $.Msg(logPrefix + "Init");
        let missionData = undefined;
        // in the pause menu we use the server's version if we have it so we can show live data.
        // otherwise we show global data
        if (IsThePauseMenuPanel()) {
            missionData = MissionsAPI.GetRecurringMission(false);
        }
        if (!missionData) {
            missionData = MissionsAPI.GetRecurringMission(!IsTheInGamePanel());
        }
        $.GetContextPanel().Data().m_oMissionData = missionData;
        // test
        // if ( missionData )
        // {
        // 	 missionData.progress_saved =10;
        // 	    missionData.progress_this_match = 50;
        // 	  missionData.goal_points = [ 100, 200, 400 ]; 
        // 	  missionData.xp_reward = [ 100, 100, 200 ];
        // }
        //	$.Msg( logPrefix + JSON.stringify( m_oMissionData ) );
        if (!$.GetContextPanel().Data().m_oMissionData) {
            $.Msg(logPrefix + "no GetRecurringMissions()");
            $.GetContextPanel().AddClass('hidden');
            return;
        }
        if (IsTheInGamePanel()) {
            if (!$.GetContextPanel().Data().m_livePointsCache) {
                $.GetContextPanel().Data().m_livePointsCache = -1;
            }
            if (FriendsListAPI.IsGameInWarmup()) {
                $.Msg(logPrefix + "warmup");
                $.GetContextPanel().AddClass('hidden');
                return;
            }
            if (GameStateAPI.GetMapBSPName() === 'lobby_mapveto') {
                $.Msg(logPrefix + "lobby_mapveto");
                $.GetContextPanel().AddClass('hidden');
                return;
            }
            if (!GameStateAPI.GetActiveQuestID()) {
                $.Msg(logPrefix + "NO QUEST ID");
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
                $.Msg(logPrefix + 'PULSE');
            }
        }
        else if (!IsTheInGamePanel()) {
            if (!MyPersonaAPI.IsConnectedToGC()) {
                $.Msg(logPrefix + "no gc");
                $.GetContextPanel().AddClass('hidden');
                return;
            }
            // map image
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
            // set button
            SetButtonPlayMission();
            // force update of all styles 
            SessionUpdate();
        }
        $.GetContextPanel().SetHasClass('COMPLETE', missionData.progress_saved +
            (missionData.progress_this_match ? missionData.progress_this_match : 0) >= missionData.goal_points.slice(-1)[0]);
        $.Msg(logPrefix + "progress_this_match " + missionData.progress_this_match);
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
                //	$.Msg( 'mission string: ' + k + ' = ' + val );
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
        $.Msg('[p.missions] ' + $.GetContextPanel().id + ': ' + missionData.progress_saved + ' ' + missionData.progress_this_match);
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
        // Init();
        //  return;
        $.DispatchEvent('PlayMenu_SwitchGameModeTab', $.GetContextPanel().Data().m_oMissionData.gamemode);
        $.DispatchEvent('CSGOPlaySoundEffect', 'mainmenu_mission_start', 'MOUSE');
        LobbyAPI.CreateSession();
        const gameMode = $.GetContextPanel().Data().m_oMissionData.gamemode;
        let gameType = "classic";
        let gmFlags = 0;
        if (gameMode === "deathmatch") {
            gameType = "gungame";
            gmFlags = 32; // ffa
        }
        let mg = $.GetContextPanel().Data().m_oMissionData.mapgroup;
        if (gameMode == "competitive") {
            mg = "mg_" + $.GetContextPanel().Data().m_oMissionData.map; // singlemap only? 
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
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlzc2lvbl90aWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvbWlzc2lvbl90aWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFDbEMsNkNBQTZDO0FBQzdDLGtEQUFrRDtBQUVsRCxDQUFDLENBQUMsVUFBVSxDQUFFLFlBQVksRUFBRSxRQUFRLENBQUUsQ0FBQztBQUV2QyxJQUFVLFdBQVcsQ0FnaEJwQjtBQWhoQkQsV0FBVSxXQUFXO0lBRXBCLFNBQVMsZ0JBQWdCO1FBRXhCLE9BQU8sQ0FBRSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsRUFBRSxLQUFLLGlCQUFpQixDQUFFLENBQUM7SUFDekQsQ0FBQztJQUVELFNBQVMsbUJBQW1CO1FBRTNCLE9BQU8sQ0FBRSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsRUFBRSxLQUFLLDRCQUE0QixDQUFFLENBQUM7SUFDcEUsQ0FBQztJQUVELFNBQVMsa0JBQWtCO1FBRTFCLE9BQU8sQ0FBRSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsRUFBRSxLQUFLLDJCQUEyQixDQUFFLENBQUM7SUFDbkUsQ0FBQztJQUdELFNBQWdCLElBQUksQ0FBRyxPQUFlO1FBRXJDLElBQUssWUFBWSxDQUFDLGdCQUFnQixFQUFFLElBQUksVUFBVTtZQUNqRCxPQUFPO1FBRVIsOEVBQThFO1FBQzlFLHFFQUFxRTtRQUNyRSxNQUFNLFNBQVMsR0FBRyxlQUFlLEdBQUcsT0FBTyxHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQztRQUVuRixDQUFDLENBQUMsR0FBRyxDQUFFLFNBQVMsR0FBRyxNQUFNLENBQUUsQ0FBQztRQUU1QixJQUFJLFdBQVcsR0FBRyxTQUFTLENBQUM7UUFFNUIsd0ZBQXdGO1FBQ3hGLGdDQUFnQztRQUNoQyxJQUFLLG1CQUFtQixFQUFF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