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
            let elTimer = $("#AutojoinTimer");
            let elTimerBar = elTimer.FindChildInLayoutFile("AutojoinTimerBar");
            if (elTimerBar) {
                elTimerBar.DeleteAsync(0);
            }
            elTimerBar = $.CreatePanel("Panel", elTimer, "AutojoinTimerBar");
            elTimerBar.style.animationDuration = nTimeout + "s";
            elTimerBar.AddClass("team-select__timer__bar");
            elTimer.endTime = Date.now() * 0.001 + nTimeout;
            elTimer.visible = true;
        }
        else {
            $("#AutojoinTimer").visible = false;
        }
    }
    function _SelectTeam(nTeamNum) {
        if (nTeamNum != 0 && nTeamNum == MockAdapter.GetPlayerTeamNumber(MyPersonaAPI.GetXuid())) {
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
        if (!_m_cP)
            _m_cP = $("#PanelToTest");
        $.RegisterKeyBind(_m_cP, "key_escape", _Escape);
        $.RegisterKeyBind(_m_cP, "key_1", _SetTeamT);
        $.RegisterKeyBind(_m_cP, "key_2", _SetTeamCT);
    }
})(TeamSelectMenu || (TeamSelectMenu = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVhbXNlbGVjdG1lbnUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy90ZWFtc2VsZWN0bWVudS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBQ2xDLGtDQUFrQztBQUNsQyx3Q0FBd0M7QUFFeEMsSUFBVSxjQUFjLENBK1V2QjtBQS9VRCxXQUFVLGNBQWM7SUFFdkIsSUFBSSxxQkFBcUIsR0FBRyxDQUFDLENBQUM7SUFDOUIsSUFBSSxrQkFBa0IsR0FBbUIsS0FBSyxDQUFDO0lBQy9DLElBQUksY0FBYyxHQUFHLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0lBQzlCLElBQUksV0FBVyxHQUFHLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0lBRTNCLElBQUksbUNBQW1DLEdBQWtCLElBQUksQ0FBQztJQUM5RCxJQUFJLG1CQUFtQixHQUFrQixJQUFJLENBQUM7SUFFOUMsU0FBUyxLQUFLO1FBRWIsSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFFLDBCQUEwQixDQUFHLENBQUM7UUFDbEQsVUFBVSxDQUFDLGFBQWEsQ0FBRSxhQUFhLEVBQUUsZUFBZSxDQUFFLENBQUM7UUFDM0QsVUFBVSxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsaUJBQWlCLENBQUUsQ0FBQztRQUM1RCxVQUFVLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxHQUFHLEVBQUUsQ0FBQyxXQUFXLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQztRQUVqRSxJQUFJLFdBQVcsR0FBRyxDQUFDLENBQUUsbUJBQW1CLENBQUcsQ0FBQztRQUM1QyxXQUFXLENBQUMsYUFBYSxDQUFFLGFBQWEsRUFBRSxnQkFBZ0IsQ0FBRSxDQUFDO1FBQzdELFdBQVcsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLGtCQUFrQixDQUFFLENBQUM7UUFDOUQsV0FBVyxDQUFDLGFBQWEsQ0FBRSxZQUFZ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