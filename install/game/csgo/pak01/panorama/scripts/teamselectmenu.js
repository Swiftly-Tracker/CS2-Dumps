"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="avatar.ts" />
/// <reference path="mock_adapter.ts" />
var TeamSelectMenu;
(function (TeamSelectMenu) {
    let m_nHighlightedTeamNum = 0;
    let m_errorTimerHandle = false;
    let m_playerCounts = [0, 0];
    let m_botCounts = [0, 0];
    // 'UISceneFrameBoundary' register event handler
    let _m_UiSceneFrameBoundaryEventHandler = null;
    let m_scheduledHideWash = null;
    function _Init() {
        let elBtnTeamT = $("#BtnSelectTeam-TERRORIST");
        elBtnTeamT.SetPanelEvent("onmouseover", _HighlightTTeam);
        elBtnTeamT.SetPanelEvent("onmouseout", _UnhighlightTTeam);
        elBtnTeamT.SetPanelEvent("onactivate", () => _SelectTeam(2));
        let elBtnTeamCT = $("#BtnSelectTeam-CT");
        elBtnTeamCT.SetPanelEvent("onmouseover", _HighlightCTTeam);
        elBtnTeamCT.SetPanelEvent("onmouseout", _UnhighlightCTTeam);
        elBtnTeamCT.SetPanelEvent("onactivate", () => _SelectTeam(3));
        let elBtnSpectate = $("#TeamSelectSpectate");
        elBtnSpectate.SetPanelEvent("onactivate", () => _SelectTeam(1));
        let elBtnAuto = $("#TeamSelectAuto");
        elBtnAuto.SetPanelEvent("onactivate", () => _SelectTeam(0));
        _UnhighlightTTeam();
        _UnhighlightCTTeam();
    }
    function _ShowPanelTest(mockdata) {
        MockAdapter.SetMockData(mockdata);
        _ShowPanel();
    }
    function _ShowPanel() {
        if (GameStateAPI.IsDemoOrHltv())
            return;
        if (m_scheduledHideWash != null) {
            $.CancelScheduled(m_scheduledHideWash);
            m_scheduledHideWash = null;
        }
        const elFade = $("#TeamSelectFade");
        elFade.style.transitionDuration = "0.0s";
        elFade.RemoveClass("hidden");
        m_scheduledHideWash = $.Schedule(0.5, () => {
            if (elFade.IsValid()) {
                elFade.style.transitionDuration = "0.5s";
                elFade.AddClass("hidden");
            }
            m_scheduledHideWash = null;
        });
        let elBackgroundImage = $.GetContextPanel().FindChildInLayoutFile('BackgroundMapImage');
        let mapName = MockAdapter.GetMapBSPName();
        elBackgroundImage.SetImage('file://{images}/map_icons/screenshots/1080p/' + mapName + '.png');
        _OnServerForcingTeamJoin(0);
        m_nHighlightedTeamNum = 0;
        $("#TeamJoinError").AddClass("hidden");
        if (m_errorTimerHandle !== false) {
            $.CancelScheduled(m_errorTimerHandle);
            m_errorTimerHandle = false;
        }
    }
    function _OnReadyForDisplay() {
        if (!_m_UiSceneFrameBoundaryEventHandler) {
            _m_UiSceneFrameBoundaryEventHandler = $.RegisterForUnhandledEvent("UISceneFrameBoundary", _OnUISceneFrameBoundary);
        }
    }
    function _OnUnreadyForDisplay() {
        if (_m_UiSceneFrameBoundaryEventHandler) {
            $.UnregisterForUnhandledEvent("UISceneFrameBoundary", _m_UiSceneFrameBoundaryEventHandler);
            _m_UiSceneFrameBoundaryEventHandler = null;
        }
    }
    function _OnUISceneFrameBoundary() {
        let bInFallbackMode = $.GetContextPanel().IsInFallbackMode();
        for (let el of $("#TeamSelectMenu").FindChildrenWithClassTraverse("team-select-fallback")) {
            if (bInFallbackMode)
                el.RemoveClass("team-select-fallback-hidden");
            else
                el.AddClass("team-select-fallback-hidden");
        }
    }
    function _UpdateBotPlayerCount(countBots, countPlayers, team) {
        let elLabel = $("#BtnSelectTeam-" + team).FindChildInLayoutFile("PlayerBotCount");
        if (countBots === 1)
            elLabel.SetDialogVariable("botlabel", $.Localize("#team_select_bot"));
        else
            elLabel.SetDialogVariable("botlabel", $.Localize("#team_select_bots"));
        if (countPlayers === 1)
            elLabel.SetDialogVariable("playerlabel", $.Localize("#team_select_player"));
        else
            elLabel.SetDialogVariable("playerlabel", $.Localize("#team_select_players"));
        elLabel.SetDialogVariableInt("bots", countBots);
        elLabel.SetDialogVariableInt("players", countPlayers);
        elLabel.text = $.Localize("#team_select_bot_player_count", elLabel);
    }
    function _OnServerForcingTeamJoin(nTimeout) {
        let bUnassigned = $.GetContextPanel().GetTeamNumber() == 0;
        $("#TeamSelectCancel").visible = !bUnassigned;
        if (bUnassigned && isFinite(nTimeout) && nTimeout > 0) {
            // Delete the old timer bar.
            let elTimer = $("#AutojoinTimer");
            let elTimerBar = elTimer.FindChildInLayoutFile("AutojoinTimerBar");
            if (elTimerBar) {
                elTimerBar.DeleteAsync(0);
            }
            // Create a new timer bar.
            elTimerBar = $.CreatePanel("Panel", elTimer, "AutojoinTimerBar");
            elTimerBar.style.animationDuration = nTimeout + "s";
            elTimerBar.AddClass("team-select__timer__bar");
            // Show the timer.
            elTimer.endTime = Date.now() * 0.001 + nTimeout;
            elTimer.visible = true;
        }
        else {
            // Hide the timer.
            $("#AutojoinTimer").visible = false;
        }
    }
    function _SelectTeam(nTeamNum) {
        if (nTeamNum != 0 && nTeamNum == MockAdapter.GetPlayerTeamNumber(MyPersonaAPI.GetXuid())) {
            // Player is already on this team so just close the menu
            HidePanel();
            return;
        }
        _SetTeam(nTeamNum);
    }
    function _HighlightTTeam() {
        _UnhighlightTeam(m_nHighlightedTeamNum);
        m_nHighlightedTeamNum = 2;
        $.GetContextPanel().HighlightTeam(2, true);
    }
    function _HighlightCTTeam() {
        _UnhighlightTeam(m_nHighlightedTeamNum);
        m_nHighlightedTeamNum = 3;
        $.GetContextPanel().HighlightTeam(3, true);
    }
    function _UnhighlightTTeam() {
        _UnhighlightTeam(2);
    }
    function _UnhighlightCTTeam() {
        _UnhighlightTeam(3);
    }
    function _UnhighlightTeam(nTeamNum) {
        if (m_nHighlightedTeamNum == nTeamNum) {
            m_nHighlightedTeamNum = 0;
            $.GetContextPanel().HighlightTeam(nTeamNum, false);
        }
    }
    function _SetTeam(team) {
        /*
        team 1 is spectator
        team 2 is T
        team 3 is CT
        */
        GameInterfaceAPI.ConsoleCommand("jointeam " + team + " 1");
    }
    function _SetTeamT() {
        _SetTeam(2);
    }
    function _SetTeamCT() {
        _SetTeam(3);
    }
    function _ShowError(locString) {
        let elLabel = $("#TeamJoinErrorLabel");
        let elWarningPanel = $("#TeamJoinError");
        elLabel.text = $.Localize(locString);
        elWarningPanel.RemoveClass("hidden");
        m_errorTimerHandle = $.Schedule(5.0, function () {
            if (elWarningPanel.IsValid())
                elWarningPanel.AddClass("hidden");
            m_errorTimerHandle = false;
        });
    }
    function _Escape() {
        // Open pause menu if we're not on a team yet. Exit team select otherwise.
        if ($.GetContextPanel().GetTeamNumber() == 0)
            GameInterfaceAPI.ConsoleCommand("gameui_activate");
        else
            HidePanel();
    }
    function HidePanel() {
        $.DispatchEvent("CSGOShowTeamSelectMenu", false, true);
    }
    TeamSelectMenu.HidePanel = HidePanel;
    function _ClearPlayerLists() {
        $("#List-0").RemoveAndDeleteChildren();
        $("#List-1").RemoveAndDeleteChildren();
        m_playerCounts[0] = 0;
        m_playerCounts[1] = 0;
        m_botCounts[0] = 0;
        m_botCounts[1] = 0;
        _UpdateBotPlayerCount(0, 0, "TERRORIST");
        _UpdateBotPlayerCount(0, 0, "CT");
    }
    function _AddToPlayerList(nTeamIdx, xuid) {
        let elList = $("#List-" + nTeamIdx);
        let elTeammate = $.CreatePanel("Panel", elList, "Teammate");
        elTeammate.BLoadLayoutSnippet("Teammate");
        let elAvatar = $.CreatePanel("Panel", elTeammate, "Avatar");
        elAvatar.BLoadLayout("file://{resources}/layout/avatar.xml", false, false);
        elAvatar.BLoadLayoutSnippet("AvatarParty");
        Avatar.Init(elAvatar, xuid.toString(), "playercard");
        if (MockAdapter.IsFakePlayer(xuid)) {
            let elAvatarImage = elAvatar.FindChildInLayoutFile("JsAvatarImage");
            elAvatarImage.PopulateFromPlayerSlot(MockAdapter.GetPlayerSlot(xuid));
            m_botCounts[nTeamIdx]++;
        }
        else {
            m_playerCounts[nTeamIdx]++;
        }
        elTeammate.SetHasClass('bot', MockAdapter.IsFakePlayer(xuid));
        let elName = elTeammate.FindChildInLayoutFile("TeamSelectTeammateName");
        elName.SetDialogVariableInt('player_slot', GameStateAPI.GetPlayerSlot(xuid));
        elTeammate.MoveChildAfter(elName, elAvatar);
        _UpdateBotPlayerCount(m_botCounts[nTeamIdx], m_playerCounts[nTeamIdx], nTeamIdx == 0 ? "TERRORIST" : "CT");
    }
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        _Init();
        $.RegisterForUnhandledEvent("CSGOShowTeamSelectMenu", _ShowPanel);
        $.RegisterForUnhandledEvent("CSGOShowTeamSelectMenu_Test", _ShowPanelTest);
        $.RegisterForUnhandledEvent("ServerForcingTeamJoin", _OnServerForcingTeamJoin);
        $.RegisterForUnhandledEvent("TeamJoinFailed", _ShowError);
        $.RegisterForUnhandledEvent("ClearTeamSelectPlayerLists", _ClearPlayerLists);
        $.RegisterForUnhandledEvent("AddToTeamSelectPlayerList", _AddToPlayerList);
        $.GetContextPanel().RegisterForReadyEvents(true);
        $.RegisterEventHandler("ReadyForDisplay", $.GetContextPanel(), _OnReadyForDisplay);
        $.RegisterEventHandler("UnreadyForDisplay", $.GetContextPanel(), _OnUnreadyForDisplay);
        let _m_cP = $("#TeamSelectMenu");
        // for the case when we're a debug panel. see \scripts\mainmenu_tests.js
        if (!_m_cP)
            _m_cP = $("#PanelToTest");
        $.RegisterKeyBind(_m_cP, "key_escape", _Escape);
        $.RegisterKeyBind(_m_cP, "key_1", _SetTeamT);
        $.RegisterKeyBind(_m_cP, "key_2", _SetTeamCT);
    }
})(TeamSelectMenu || (TeamSelectMenu = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVhbXNlbGVjdG1lbnUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy90ZWFtc2VsZWN0bWVudS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBQ2xDLGtDQUFrQztBQUNsQyx3Q0FBd0M7QUFFeEMsSUFBVSxjQUFjLENBK1V2QjtBQS9VRCxXQUFVLGNBQWM7SUFFdkIsSUFBSSxxQkFBcUIsR0FBRyxDQUFDLENBQUM7SUFDOUIsSUFBSSxrQkFBa0IsR0FBbUIsS0FBSyxDQUFDO0lBQy9DLElBQUksY0FBYyxHQUFHLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0lBQzlCLElBQUksV0FBVyxHQUFHLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0lBQzNCLGdEQUFnRDtJQUNoRCxJQUFJLG1DQUFtQyxHQUFrQixJQUFJLENBQUM7SUFDOUQsSUFBSSxtQkFBbUIsR0FBa0IsSUFBSSxDQUFDO0lBRTlDLFNBQVMsS0FBSztRQUViLElBQUksVUFBVSxHQUFHLENBQUMsQ0FBRSwwQkFBMEIsQ0FBRyxDQUFDO1FBQ2xELFVBQVUsQ0FBQyxhQUFhLENBQUUsYUFBYSxFQUFFLGVBQWUsQ0FBRSxDQUFDO1FBQzNELFVBQVUsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLGlCQUFpQixDQUFFLENBQUM7UUFDNUQsVUFBVSxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLENBQUMsV0FBVyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7UUFFakUsSUFBSSxXQUFXLEdBQUcsQ0FBQyxDQUFFLG1CQUFtQixDQUFHLENBQUM7UUFDNUMsV0FBVyxDQUFDLGFBQWEsQ0FBRSxhQUFhLEVBQUUsZ0JBQWdCLENBQUUsQ0FBQztRQUM3RCxXQUFXLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxrQkFBa0IsQ0FBRSxDQUFDO1FBQzlELFdBQVcsQ0FBQyxh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