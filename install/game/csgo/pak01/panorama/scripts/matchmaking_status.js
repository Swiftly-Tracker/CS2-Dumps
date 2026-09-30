"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/formattext.ts" />
/////////////////////////////////////////////////////
// This is used in Friendlist for the matchmaking status part
/////////////////////////////////////////////////////
var MatchmakingStatus;
(function (MatchmakingStatus) {
    let _m_searchTimeUpdateHandle = false;
    let _m_elStatusPanel = $.GetContextPanel();
    let _m_showMatchingMissions = true;
    function _BCanShow() {
        if (_m_elStatusPanel.GetAttributeString('data-type', '') === 'hud') {
            let mode = GameStateAPI.GetGameModeInternalName(false);
            if (mode === 'survival') {
                let teamCount = Number(GameInterfaceAPI.GetSettingString('sv_dz_team_count'));
                if (teamCount > 1)
                    return false; // Cannot show this panel in squads (you are "Starting match..." with your party)
                else
                    return true; // Can show this panel for solo players searching for their "Play again" game
            }
            else { // Can never show this panel outside of survival HUD
                return false;
            }
        }
        // Otherwise we can always show the panel
        return true;
    }
    function _SessionUpdate() {
        if (!_m_elStatusPanel || !_m_elStatusPanel.IsValid())
            return;
        _UpdateMatchmakingStatus();
    }
    function _UpdateMatchmakingStatus() {
        let lobbySettings = LobbyAPI.GetSessionSettings().game;
        if (!LobbyAPI.IsSessionActive() || !_BCanShow()) {
            _m_elStatusPanel.SetHasClass('hidden', true);
            return;
        }
        _m_elStatusPanel.SetHasClass('hidden', false);
        _UpdateStatusPanel(lobbySettings);
    }
    ;
    function _UpdateStatusPanel(lobbySettings) {
        _CancelSearchTimeUpdate();
        _UpdateSearchWaitPanel(lobbySettings);
        _SearchPanelSearching(lobbySettings);
        _ShowMatchmakingWarnings(lobbySettings);
        _CheckForMatchingMissions(lobbySettings);
    }
    function _UpdateSearchWaitPanel(lobbySettings) {
        let elStatusWait = _m_elStatusPanel.FindChildInLayoutFile('MatchStatusWait');
        if (!lobbySettings || _IsHost() || _IsSeaching()) {
            elStatusWait.AddClass('hidden');
            return;
        }
        elStatusWait.RemoveClass('hidden');
        elStatusWait.FindChildInLayoutFile('MatchStatusWaitLabel').text = $.Localize("#party_waiting_lobby_leader");
    }
    ;
    function _SearchPanelSearching(lobbySettings) {
        let elStatusSearching = _m_elStatusPanel.FindChildInLayoutFile('MatchStatusSearching');
        if (!lobbySettings || !_IsSeaching()) {
            elStatusSearching.AddClass('hidden');
            _m_showMatchingMissions = true;
            _CancelSearchTimeUpdate();
            return;
        }
        elStatusSearching.RemoveClass('hidden');
        let unavailableMatch = _GetSearchStatus().indexOf('unavailable') !== -1 ? true : false;
        let elWarningIcon = elStatusSearching.FindChildInLayoutFile('MatchStatusFailIcon');
        elWarningIcon.SetHasClass('hidden', !unavailableMatch);
        let elSearchTime = elStatusSearching.FindChildInLayoutFile('MatchStatusTime');
        elSearchTime.SetHasClass('hidden', unavailableMatch);
        let elLabel = elStatusSearching.FindChildInLayoutFile('MatchStatusSearchingLabel');
        elLabel.text = $.Localize(_GetSearchStatus());
        if (unavailableMatch)
            return;
        _UpdateSearchTime();
    }
    ;
    function _ShowMatchmakingWarnings(lobbySettings) {
        let elStatusWarnings = _m_elStatusPanel.FindChildInLayoutFile('MatchStatusWarning');
        if (!lobbySettings || !_IsSeaching()) {
            elStatusWarnings.AddClass('hidden');
            return;
        }
        // Global warning?
        elStatusWarnings.RemoveClass('hidden');
        let serverWarning = NewsAPI.GetCurrentActiveAlertForUser();
        let isWarning = serverWarning !== '' && serverWarning !== undefined ? true : false;
        elStatusWarnings.SetHasClass('hidden', !isWarning);
        if (isWarning)
            elStatusWarnings.FindChild('MatchStatusWarningLabel').text = $.Localize(serverWarning);
    }
    ;
    function _CheckForMatchingMissions(lobbySettings) {
        let nSeasonAccess = GameTypesAPI.GetActiveSeasionIndexValue();
        if (nSeasonAccess < 0 || nSeasonAccess === null) {
            return;
        }
        if (_IsSeaching() && lobbySettings && lobbySettings.mapgroupname && _m_showMatchingMissions) {
            // @ts-expect-error OperationUtil is still JS
            OperationUtil.MissionsThatMatchYourMatchMakingSettings(lobbySettings.mode, lobbySettings.mapgroupname.split(','), nSeasonAccess);
            _m_showMatchingMissions = false;
        }
    }
    //--------------------------------------------------------------------------------------------------
    // Helpers for lobby state
    //--------------------------------------------------------------------------------------------------
    function _IsHost() {
        return LobbyAPI.BIsHost();
    }
    function _GetSearchStatus() {
        return LobbyAPI.GetMatchmakingStatusString();
    }
    ;
    function _IsSeaching() {
        let StatusString = _GetSearchStatus();
        return (StatusString !== '' && StatusString !== null) ? true : false;
    }
    //------------------------------------------------------------------------------------------------
    function _UpdateSearchTime() {
        let seconds = LobbyAPI.GetTimeSpentMatchmaking();
        let elSearchTime = _m_elStatusPanel.FindChildInLayoutFile('MatchStatusTime');
        elSearchTime.text = FormatText.SecondsToDDHHMMSSWithSymbolSeperator(seconds);
        _m_searchTimeUpdateHandle = $.Schedule(1.0, _UpdateSearchTime);
    }
    function _CancelSearchTimeUpdate() {
        if (_m_searchTimeUpdateHandle !== false) {
            $.CancelScheduled(_m_searchTimeUpdateHandle);
            _m_searchTimeUpdateHandle = false;
        }
    }
    function _OnHideMainMenu() {
        _CancelSearchTimeUpdate();
    }
    function _OnHidePauseMenu() {
        _CancelSearchTimeUpdate();
    }
    ;
    function _OnShowMenu() {
        _UpdateMatchmakingStatus();
    }
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        _UpdateMatchmakingStatus();
        $.RegisterForUnhandledEvent("PanoramaComponent_Lobby_MatchmakingSessionUpdate", _SessionUpdate);
        // PanoramaComponent_GC_Hello sets has_ongoingmatch. we should update the button state to show reconnect/abandon if necessary
        $.RegisterForUnhandledEvent('PanoramaComponent_GC_Hello', _SessionUpdate);
        // ServerReserved passes mapname, bool for if the local player needs to ready up, bool if this is a reconnect to existing match
        $.RegisterForUnhandledEvent("CSGOHideMainMenu", _OnHideMainMenu);
        $.RegisterForUnhandledEvent("CSGOHidePauseMenu", _OnHidePauseMenu);
        $.RegisterForUnhandledEvent("CSGOShowPauseMenu", _OnShowMenu);
        $.RegisterForUnhandledEvent("CSGOShowMainMenu", _OnShowMenu);
    }
})(MatchmakingStatus || (MatchmakingStatus = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWF0Y2htYWtpbmdfc3RhdHVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvbWF0Y2htYWtpbmdfc3RhdHVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFDbEMsNkNBQTZDO0FBRTdDLHFEQUFxRDtBQUNyRCw2REFBNkQ7QUFDN0QscURBQXFEO0FBRXJELElBQVUsaUJBQWlCLENBcU4xQjtBQXJORCxXQUFVLGlCQUFpQjtJQUUxQixJQUFJLHlCQUF5QixHQUFtQixLQUFLLENBQUM7SUFDdEQsSUFBSSxnQkFBZ0IsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUM7SUFFM0MsSUFBSSx1QkFBdUIsR0FBRyxJQUFJLENBQUM7SUFFbkMsU0FBUyxTQUFTO1FBRWpCLElBQUssZ0JBQWdCLENBQUMsa0JBQWtCLENBQUUsV0FBVyxFQUFFLEVBQUUsQ0FBRSxLQUFLLEtBQUssRUFDckU7WUFDQyxJQUFJLElBQUksR0FBRyxZQUFZLENBQUMsdUJBQXVCLENBQUUsS0FBSyxDQUFFLENBQUM7WUFDekQsSUFBSyxJQUFJLEtBQUssVUFBVSxFQUN4QjtnQkFDQyxJQUFJLFNBQVMsR0FBRyxNQUFNLENBQUUsZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUUsa0JBQWtCLENBQUUsQ0FBRSxDQUFDO2dCQUNsRixJQUFLLFNBQVMsR0FBRyxDQUFDO29CQUNqQixPQUFPLEtBQUssQ0FBQyxDQUFDLGlGQUFpRjs7b0JBRS9GLE9BQU8sSUFBSSxDQUFDLENBQUMsNkVBQTZFO2FBQzNGO2lCQUVELEVBQUUsb0RBQW9EO2dCQUNyRCxPQUFPLEtBQUssQ0FBQzthQUNiO1NBQ0Q7UUFFRCx5Q0FBeUM7UUFDekMsT0FBTyxJQUFJLENBQUM7SUFDYixDQUFDO0lBRUQsU0FBUyxjQUFjO1FBRXRCLElBQUssQ0FBQyxnQkFBZ0IsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFB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