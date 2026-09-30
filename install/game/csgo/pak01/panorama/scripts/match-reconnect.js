"use strict";
/// <reference path="csgo.d.ts" />
var MatchmakingReconnect;
(function (MatchmakingReconnect) {
    const m_elOngoingMatch = $.GetContextPanel();
    let m_bAcceptIsShowing = false;
    let m_bOngoingMatchHasEnded = false;
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
        m_bOngoingMatchHasEnded = nGamePhase === 5;
        UpdateState();
    }
    function OnSidebarIsCollapsed(bIsCollapsed) {
        m_elOngoingMatch.SetHasClass('sidebar-collapsed', bIsCollapsed);
    }
    {
        Init();
        $.RegisterForUnhandledEvent("PanoramaComponent_Lobby_MatchmakingSessionUpdate", UpdateState);
        $.RegisterForUnhandledEvent('PanoramaComponent_GC_Hello', UpdateState);
        $.RegisterForUnhandledEvent('PanoramaComponent_Lobby_ReadyUpForMatch', ReadyUpForMatch);
        $.RegisterForUnhandledEvent('GameState_OnGamePhaseChange', OnGamePhaseChange);
        $.RegisterForUnhandledEvent('SidebarIsCollapsed', OnSidebarIsCollapsed);
    }
})(MatchmakingReconnect || (MatchmakingReconnect = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWF0Y2gtcmVjb25uZWN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvbWF0Y2gtcmVjb25uZWN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFFbEMsSUFBVSxvQkFBb0IsQ0FtRjdCO0FBbkZELFdBQVUsb0JBQW9CO0lBRTdCLE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBQzdDLElBQUksa0JBQWtCLEdBQUcsS0FBSyxDQUFDO0lBQy9CLElBQUksdUJBQXVCLEdBQUcsS0FBSyxDQUFDO0lBRXBDLFNBQVMsSUFBSTtRQUVaLE1BQU0sWUFBWSxHQUFHLGdCQUFnQixDQUFDLHFCQUFxQixDQUFFLHNCQUFzQixDQUFFLENBQUM7UUFDdEYsWUFBWSxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsR0FBRyxFQUFFO1lBRTlDLG1CQUFtQixDQUFDLDZCQUE2QixFQUFFLENBQUM7WUFDcEQsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxxQkFBcUIsRUFBRSxpQ0FBaUMsRUFBRSxPQUFPLENBQUUsQ0FBQztZQUNyRixXQUFXLEVBQUUsQ0FBQztRQUNmLENBQUMsQ0FBRSxDQUFDO1FBRUosTUFBTSxVQUFVLEdBQUcsZ0JBQWdCLENBQUMscUJBQXFCLENBQUUsb0JBQW9CLENBQUUsQ0FBQztRQUNsRixVQUFVLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxHQUFHLEVBQUU7WUFFNUMsbUJBQW1CLENBQUMseUJBQXlCLEVBQUUsQ0FBQztZQUNoRCxDQUFDLENBQUMsYUFBYSxDQUFFLHFCQUFxQixFQUFFLGlDQUFpQyxFQUFFLE9BQU8sQ0FBRSxDQUFDO1lBQ3JGLFdBQVcsRUFBRSxDQUFDO1FBQ2YsQ0FBQyxDQUFFLENBQUM7UUFFSixNQUFNLFNBQVMsR0FBRyxnQkFBZ0IsQ0FBQyxxQkFBcUIsQ0FBRSxtQkFBbUIsQ0FBRSxDQUFDO1FBQ2hGLFNBQVMsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLEdBQUcsRUFBRTtZQUUzQyxRQUFRLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDM0IsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxxQkFBcUIsRUFBRSxpQ0FBaUMsRUFBRSxPQUFPLENBQUUsQ0FBQztZQUNyRixXQUFXLEVBQUUsQ0FBQztRQUNmLENBQUMsQ0FBRSxDQUFDO1FBRUosV0FBVyxFQUFFLENBQUM7SUFDZixDQUFDO0lBRUQsU0FBUyxXQUFXO1FBRW5CLE1BQU0sZ0JBQWdCLEdBQUcsbUJBQW1CLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDL0QsSUFBSyxDQUFDLGdCQUFnQixFQUN0QjtZQUNDLHVCQUF1QixHQUFHLEtBQUssQ0FBQztTQUNoQztRQUNELE1BQU0sYUFBYSxHQUFHLGdCQUFnQixJQUFJLENBQUMsdUJBQXVCLENBQUM7UUFFbkUsTUFBTSxlQUFlLEdBQUcsUUFBUSxDQUFDLGtCQUFrQixFQUFTLENBQUM7UUFDN0QsTUFBTSxlQUFlLEdBQUcsZUFBZSxFQUFFLElBQUksRUFBRSxZQUFZLEtBQUssV0FBVyxDQUFDO1FBRTVFLGdCQUFnQixDQUFDLFdBQVcsQ0FBRSxjQUFjLEVBQUUsYUFBYSxJQUFJLENBQUMsZUFBZSxJQUFJLENBQUMsa0JBQWtCLENBQUUsQ0FBQztRQUN6RyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUUsYUFBYSxFQUFFLGFBQWEsSUFBSSxlQUFlLElBQUksQ0FBQyxrQkFBa0IsQ0FBRSxDQUFDO0lBQ3hHLENBQUM7SUFFRCxTQUFTLGVBQWUsQ0FBRyxVQUFtQjtRQUU3QyxrQkFBa0IsR0FBRyxVQUFVLENBQUM7UUFDaEMsV0FBVyxFQUFFLENBQUM7SUFDZixDQUFDO0lBRUQsU0FBUyxpQkFBaUIsQ0FBRyxVQUFrQjtRQUU5Qyx1QkFBdUIsR0FBRyxVQUFVLEtBQUssQ0FBQyxDQUFDO1FBQzNDLFdBQVcsRUFBRSxDQUFDO0lBQ2YsQ0FBQztJQUVELFNBQVMsb0JBQW9CLENBQUcsWUFBcUI7UUFFcEQsZ0JBQWdCLENBQUMsV0FBVyxDQUFFLG1CQUFtQixFQUFFLFlBQVksQ0FBRSxDQUFDO0lBQ25FLENBQUM7SUFLRDtRQUNDLElBQUksRUFBRSxDQUFDO1FBRVAsQ0FBQyxDQUFDLHlCQUF5QixDQUFFLGtEQUFrRCxFQUFFLFdBQVcsQ0FBRSxDQUFDO1FBRy9GLENBQUMsQ0FBQyx5QkFBeUIsQ0FBRSw0QkFBNEIsRUFBRSxXQUFXLENBQUUsQ0FBQztRQUV6RSxDQUFDLENBQUMseUJBQXlCLENBQUUseUNBQXlDLEVBQUUsZUFBZSxDQUFFLENBQUM7UUFDMUYsQ0FBQyxDQUFDLHlCQUF5QixDQUFFLDZCQUE2QixFQUFFLGlCQUFpQixDQUFFLENBQUM7UUFDaEYsQ0FBQyxDQUFDLHlCQUF5QixDQUFFLG9CQUFvQixFQUFFLG9CQUFvQixDQUFFLENBQUM7S0FDMUU7QUFDRixDQUFDLEVBbkZTLG9CQUFvQixLQUFwQixvQkFBb0IsUUFtRjdCIn0=