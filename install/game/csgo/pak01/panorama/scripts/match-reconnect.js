"use strict";
/// <reference path="csgo.d.ts" />
var MatchmakingReconnect;
(function (MatchmakingReconnect) {
    const m_elOngoingMatch = $.GetContextPanel();
    let m_bAcceptIsShowing = false; // This should sync up with when popup_accept_match is visible.
    let m_bOngoingMatchHasEnded = false; // Set by OnGamePhaseChanged. Cleared by HasOngoingMatch() == false.
    function Init() {
        const btnReconnect = m_elOngoingMatch.FindChildInLayoutFile('MatchmakingReconnect');
        btnReconnect.SetPanelEvent('onactivate', () => {
            CompetitiveMatchAPI.ActionReconnectToOngoingMatch();
            $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.generic_button_press', 'MOUSE');
            UpdateState();
        });
        const btnAbandon = m_elOngoingMatch.FindChildInLayoutFile('MatchmakingAbandon');
        btnAbandon.SetPanelEvent('onactivate', () => {
            CompetitiveMatchAPI.ActionAbandonOngoingMatch();
            $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.generic_button_press', 'MOUSE');
            UpdateState();
        });
        const btnCancel = m_elOngoingMatch.FindChildInLayoutFile('MatchmakingCancel');
        btnCancel.SetPanelEvent('onactivate', () => {
            LobbyAPI.StopMatchmaking();
            $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.generic_button_press', 'MOUSE');
            UpdateState();
        });
        UpdateState();
    }
    function UpdateState() {
        const bHasOngoingMatch = CompetitiveMatchAPI.HasOngoingMatch();
        if (!bHasOngoingMatch) {
            m_bOngoingMatchHasEnded = false;
        }
        const bCanReconnect = bHasOngoingMatch && !m_bOngoingMatchHasEnded;
        const sessionSettings = LobbyAPI.GetSessionSettings();
        const bIsReconnecting = sessionSettings?.game?.mapgroupname === "reconnect";
        m_elOngoingMatch.SetHasClass('show-actions', bCanReconnect && !bIsReconnecting && !m_bAcceptIsShowing);
        m_elOngoingMatch.SetHasClass('show-cancel', bCanReconnect && bIsReconnecting && !m_bAcceptIsShowing);
    }
    function ReadyUpForMatch(shouldShow) {
        m_bAcceptIsShowing = shouldShow;
        UpdateState();
    }
    function OnGamePhaseChange(nGamePhase) {
        m_bOngoingMatchHasEnded = nGamePhase === 5; // GAMEPHASE_MATCH_ENDED
        UpdateState();
    }
    function OnSidebarIsCollapsed(bIsCollapsed) {
        m_elOngoingMatch.SetHasClass('sidebar-collapsed', bIsCollapsed);
    }
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        Init();
        $.RegisterForUnhandledEvent("PanoramaComponent_Lobby_MatchmakingSessionUpdate", UpdateState);
        // PanoramaComponent_GC_Hello sets has_ongoingmatch. we should update the button state to show reconnect/abandon if necessary
        $.RegisterForUnhandledEvent('PanoramaComponent_GC_Hello', UpdateState);
        $.RegisterForUnhandledEvent('PanoramaComponent_Lobby_ReadyUpForMatch', ReadyUpForMatch);
        $.RegisterForUnhandledEvent('GameState_OnGamePhaseChange', OnGamePhaseChange);
        $.RegisterForUnhandledEvent('SidebarIsCollapsed', OnSidebarIsCollapsed);
    }
})(MatchmakingReconnect || (MatchmakingReconnect = {}));
//DEVONLY{
function nextState(curState) {
    if (curState === "hidden") {
        curState = "actions";
    }
    else if (curState === "actions") {
        curState = "cancel";
    }
    else if (curState === "cancel") {
        curState = "hidden";
    }
    $.Msg("nextState " + curState);
    const cp = $.GetContextPanel();
    cp.SetHasClass('show-actions', curState === "actions");
    cp.SetHasClass('show-cancel', curState === "cancel");
    $.Schedule(2.0, () => nextState(curState));
}
// $.Schedule( 2.0, () => nextState( "hidden" ) );
//}DEVONLY
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWF0Y2gtcmVjb25uZWN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvbWF0Y2gtcmVjb25uZWN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFFbEMsSUFBVSxvQkFBb0IsQ0FtRjdCO0FBbkZELFdBQVUsb0JBQW9CO0lBRTdCLE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBQzdDLElBQUksa0JBQWtCLEdBQUcsS0FBSyxDQUFDLENBQUMsK0RBQStEO0lBQy9GLElBQUksdUJBQXVCLEdBQUcsS0FBSyxDQUFDLENBQUMsb0VBQW9FO0lBRXpHLFNBQVMsSUFBSTtRQUVaLE1BQU0sWUFBWSxHQUFHLGdCQUFnQixDQUFDLHFCQUFxQixDQUFFLHNCQUFzQixDQUFFLENBQUM7UUFDdEYsWUFBWSxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsR0FBRyxFQUFFO1lBRTlDLG1CQUFtQixDQUFDLDZCQUE2QixFQUFFLENBQUM7WUFDcEQsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxxQkFBcUIsRUFBRSxpQ0FBaUMsRUFBRSxPQUFPLENBQUUsQ0FBQztZQUNyRixXQUFXLEVBQUUsQ0FBQztRQUNmLENBQUMsQ0FBRSxDQUFDO1FBRUosTUFBTSxVQUFVLEdBQUcsZ0JBQWdCLENBQUMscUJBQXFCLENBQUUsb0JBQW9CLENBQUUsQ0FBQztRQUNsRixVQUFVLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxHQUFHLEVBQUU7WUFFNUMsbUJBQW1CLENBQUMseUJBQXlCLEVBQUUsQ0FBQztZQUNoRCxDQUFDLENBQUMsYUFBYSxDQUFFLHFCQUFxQixFQUFFLGlDQUFpQyxFQUFFLE9BQU8sQ0FBRSxDQUFDO1lBQ3JGLFdBQVcsRUFBRSxDQUFDO1FBQ2YsQ0FBQyxDQUFFLENBQUM7UUFFSixNQUFNLFNBQVMsR0FBRyxnQkFBZ0IsQ0FBQyxxQkFBcUIsQ0FBRSxtQkFBbUIsQ0FBRSxDQUFDO1FBQ2hGLFNBQVMsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLEdBQUcsRUFBRTtZQUUzQyxRQUFRLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDM0IsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxxQkFBcUIsRUFBRSxpQ0FBaUMsRUFBRSxPQUFPLENBQUUsQ0FBQztZQUNyRixXQUFXLEVBQUUsQ0FBQztRQUNmLENBQUMsQ0FBRSxDQUFDO1FBRUosV0FBVyxFQUFFLENBQUM7SUFDZixDQUFDO0lBRUQsU0FBUyxXQUFXO1FBRW5CLE1BQU0sZ0JBQWdCLEdBQUcsbUJBQW1CLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDL0QsSUFBSyxDQUFDLGdCQUFnQixFQUN0QjtZQUNDLHVCQUF1QixHQUFHLEtBQUssQ0FBQztTQUNoQztRQUNELE1BQU0sYUFBYSxHQUFHLGdCQUFnQixJQUFJLENBQUMsdUJBQXVCLENBQUM7UUFFbkUsTUFBTSxlQUFlLEdBQUcsUUFBUSxDQUFDLGtCQUFrQixFQUFTLENBQUM7UUFDN0QsTUFBTSxlQUFlLEdBQUcsZUFBZSxFQUFFLElBQUksRUFBRSxZQUFZLEtBQUssV0FBVyxDQUFDO1FBRTVFLGdCQUFnQixDQUFDLFdBQVcsQ0FBRSxjQUFjLEVBQUUsYUFBYSxJQUFJLENBQUMsZUFBZSxJQUFJLENBQUMsa0JBQWtCLENBQUUsQ0FBQztRQUN6RyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUUsYUFBYSxFQUFFLGFBQWEsSUFBSSxlQUFlLElBQUksQ0FBQyxrQkFBa0IsQ0FBRSxDQUFDO0lBQ3hHLENBQUM7SUFFRCxTQUFTLGVBQWUsQ0FBRyxVQUFtQjtRQUU3QyxrQkFBa0IsR0FBRyxVQUFVLENBQUM7UUFDaEMsV0FBVyxFQUFFLENBQUM7SUFDZixDQUFDO0lBRUQsU0FBUyxpQkFBaUIsQ0FBRyxVQUFrQjtRQUU5Qyx1QkFBdUIsR0FBRyxVQUFVLEtBQUssQ0FBQyxDQUFDLENBQUMsd0JBQXdCO1FBQ3BFLFdBQVcsRUFBRSxDQUFDO0lBQ2YsQ0FBQztJQUVELFNBQVMsb0JBQW9CLENBQUcsWUFBcUI7UUFFcEQsZ0JBQWdCLENBQUMsV0FBVyxDQUFFLG1CQUFtQixFQUFFLFlBQVksQ0FBRSxDQUFDO0lBQ25FLENBQUM7SUFFRCxvR0FBb0c7SUFDcEcsMkNBQTJDO0lBQzNDLG9HQUFvRztJQUNwRztRQUNDLElBQUksRUFBRSxDQUFDO1FBRVAsQ0FBQyxDQUFDLHlCQUF5QixDQUFFLGtEQUFrRCxFQUFFLFdBQVcsQ0FBRSxDQUFDO1FBRS9GLDZIQUE2SDtRQUM3SCxDQUFDLENBQUMseUJBQXlCLENBQUUsNEJBQTRCLEVBQUUsV0FBVyxDQUFFLENBQUM7UUFFekUsQ0FBQyxDQUFDLHlCQUF5QixDQUFFLHlDQUF5QyxFQUFFLGVBQWUsQ0FBRSxDQUFDO1FBQzFGLENBQUMsQ0FBQyx5QkFBeUIsQ0FBRSw2QkFBNkIsRUFBRSxpQkFBaUIsQ0FBRSxDQUFDO1FBQ2hGLENBQUMsQ0FBQyx5QkFBeUIsQ0FBRSxvQkFBb0IsRUFBRSxvQkFBb0IsQ0FBRSxDQUFDO0tBQzFFO0FBQ0YsQ0FBQyxFQW5GUyxvQkFBb0IsS0FBcEIsb0JBQW9CLFFBbUY3QjtBQUVELFVBQVU7QUFDVixTQUFTLFNBQVMsQ0FBRyxRQUFnQjtJQUVwQyxJQUFLLFFBQVEsS0FBSyxRQUFRLEVBQzFCO1FBQ0MsUUFBUSxHQUFHLFNBQVMsQ0FBQztLQUNyQjtTQUNJLElBQUssUUFBUSxLQUFLLFNBQVMsRUFDaEM7UUFDQyxRQUFRLEdBQUcsUUFBUSxDQUFDO0tBQ3BCO1NBQ0ksSUFBSyxRQUFRLEtBQUssUUFBUSxFQUMvQjtRQUNDLFFBQVEsR0FBRyxRQUFRLENBQUM7S0FDcEI7SUFDRCxDQUFDLENBQUMsR0FBRyxDQUFFLFlBQVksR0FBRyxRQUFRLENBQUUsQ0FBQztJQUVqQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUM7SUFDL0IsRUFBRSxDQUFDLFdBQVcsQ0FBRSxjQUFjLEVBQUUsUUFBUSxLQUFLLFNBQVMsQ0FBRSxDQUFDO0lBQ3pELEVBQUUsQ0FBQyxXQUFXLENBQUUsYUFBYSxFQUFFLFFBQVEsS0FBSyxRQUFRLENBQUUsQ0FBQztJQUV2RCxDQUFDLENBQUMsUUFBUSxDQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUUsUUFBUSxDQUFFLENBQUUsQ0FBQztBQUNoRCxDQUFDO0FBQ0Qsa0RBQWtEO0FBQ2xELFVBQVUifQ==