"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/formattext.ts" />
/// <reference path="mock_adapter.ts" />
/// <reference path="endofmatch.ts" />
var EOM_Win;
(function (EOM_Win) {
    const _m_pauseBeforeEnd = 5.0;
    const _m_cP = $.GetContextPanel();
    let _m_oMatchEndData = undefined;
    let _m_oScoreData = undefined;
    //#define TEAM_TERRORIST 2
    const _m_nT = 2;
    function _SetVictoryStatement() {
        if (!_m_cP || !_m_cP.IsValid())
            return;
        if (!_m_oMatchEndData)
            return;
        if (!_m_oScoreData)
            return;
        // WINNER
        const winningTeamNumber = _m_oMatchEndData.winning_team_number;
        let result = "#eom-result-tie3";
        const teamT = _m_oScoreData.teamdata.find(td => td.team_name === "TERRORIST");
        const teamCT = _m_oScoreData.teamdata.find(td => td.team_name === "CT");
        let localPlayerTeamScore = teamT.score;
        let otherTeamNumber = teamCT.score;
        _m_cP.RemoveClass('eom-win_won');
        _m_cP.RemoveClass('eom-win_lost');
        _m_cP.SetDialogVariable("teamname", "");
        if (winningTeamNumber) {
            const localPlayerTeamNumber = MockAdapter.GetPlayerTeamNumber(MockAdapter.GetLocalPlayerXuid());
            const mode = EOM_Characters.GetModeForEndOfMatchPurposes();
            const bForceShowWinningTeam = EOM_Characters.ShowWinningTeam(mode);
            if (GameStateAPI.IsDemoOrHltv() || (localPlayerTeamNumber != 2 && localPlayerTeamNumber != 3) || bForceShowWinningTeam) {
                localPlayerTeamScore = winningTeamNumber == _m_nT ? teamT.score : teamCT.score;
                otherTeamNumber = winningTeamNumber == _m_nT ? teamCT.score : teamT.score;
                result = "#eom-result-win3";
                _m_cP.SetHasClass('eom-win_won', true);
            }
            else {
                localPlayerTeamScore = localPlayerTeamNumber == _m_nT ? teamT.score : teamCT.score;
                otherTeamNumber = localPlayerTeamNumber == _m_nT ? teamCT.score : teamT.score;
                result = winningTeamNumber == localPlayerTeamNumber ? "#eom-result-win3" : "#eom-result-loss3";
                _m_cP.SetHasClass('eom-win_won', winningTeamNumber == localPlayerTeamNumber);
                _m_cP.SetHasClass('eom-win_lost', winningTeamNumber != localPlayerTeamNumber);
            }
        }
        if (_m_oMatchEndData.hasOwnProperty('match_cancelled') && _m_oMatchEndData.match_cancelled) {
            _m_cP.SetHasClass('eom-win_won', false);
            _m_cP.SetHasClass('eom-win_lost', false);
            result = '#SFUI_match_cancelled';
        }
        if (_m_oMatchEndData.hasOwnProperty('cancel_reason_code') && _m_oMatchEndData.cancel_reason_code) {
            _ShowMatchCancelledEarlyWithReasonExplanation(_m_oMatchEndData.cancel_reason_code);
        }
        _m_cP.SetDialogVariable("win-result", $.Localize(result));
        _m_cP.SetDialogVariableInt("score_local_player", localPlayerTeamScore);
        _m_cP.SetDialogVariableInt("score_other", otherTeamNumber);
        _AnimStart();
    }
    function _AnimStart() {
        const elPanel = $.GetContextPanel().FindChildTraverse('WinTeam');
        elPanel.TriggerClass('show');
    }
    function _ShowMatchCancelledEarlyWithReasonExplanation(cancel_reason_code) {
        const elPanel = $.GetContextPanel().FindChildTraverse('EomCancelReason' + cancel_reason_code);
        if (elPanel) {
            elPanel.AddClass('show');
        }
    }
    function _DisplayMe() {
        _m_oMatchEndData = MockAdapter.GetMatchEndWinDataJSO();
        _m_oScoreData = MockAdapter.GetScoreDataJSO();
        if (!_m_oMatchEndData)
            return false;
        if (!_m_oScoreData ||
            !_m_oScoreData.teamdata.some(td => td.team_name === "CT") ||
            !_m_oScoreData.teamdata.some(td => td.team_name === "TERRORIST"))
            return false;
        if (_m_oMatchEndData.hasOwnProperty('winning_player'))
            return false;
        if (GameStateAPI.GetGameModeInternalName(false) == 'deathmatch')
            return false;
        _SetVictoryStatement();
        return true;
    }
    function Start() {
        $.Msg("STARTING WIN PANEL");
        if (MockAdapter.GetMockData() && !MockAdapter.GetMockData().includes('EOM_WIN')) {
            _End();
            return;
        }
        if (_DisplayMe()) {
            EndOfMatch.SwitchToPanel('eom-win');
            EndOfMatch.StartDisplayTimer(_m_pauseBeforeEnd);
            $.Schedule(_m_pauseBeforeEnd, _End);
        }
        else {
            _End();
            return;
        }
    }
    function _End() {
        $.Msg("ENDING WIN PANEL");
        EndOfMatch.ShowNextPanel();
    }
    function Shutdown() {
    }
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        EndOfMatch.RegisterPanelObject({
            name: 'eom-win',
            Start: Start,
            Shutdown: Shutdown
        });
    }
})(EOM_Win || (EOM_Win = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5kb2ZtYXRjaC13aW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9lbmRvZm1hdGNoLXdpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBQ2xDLDZDQUE2QztBQUM3Qyx3Q0FBd0M7QUFDeEMsc0NBQXNDO0FBRXRDLElBQVUsT0FBTyxDQWtLaEI7QUFsS0QsV0FBVSxPQUFPO0lBR2hCLE1BQU0saUJBQWlCLEdBQUcsR0FBRyxDQUFDO0lBQzlCLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztJQUVsQyxJQUFJLGdCQUFnQixHQUFnQyxTQUFTLENBQUM7SUFDOUQsSUFBSSxhQUFhLEdBQTBCLFNBQVMsQ0FBQztJQUVyRCwwQkFBMEI7SUFDMUIsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDO0lBRWhCLFNBQVMsb0JBQW9CO1FBRTVCLElBQUssQ0FBQyxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFO1lBQzlCLE9BQU87UUFFUixJQUFLLENBQUMsZ0JBQWdCO1lBQ3JCLE9BQU87UUFFUixJQUFLLENBQUMsYUFBYTtZQUNsQixPQUFPO1FBRVIsU0FBUztRQUNULE1BQU0saUJBQWlCLEdBQUcsZ0JBQWdCLENBQUMsbUJBQW1CLENBQUM7UUFFL0QsSUFBSSxNQUFNLEdBQUcsa0JBQWtCLENBQUM7UUFDaEMsTUFBTSxLQUFLLEdBQUcsYUFBYSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsU0FBUyxLQUFLLFdBQVcsQ0FBRSxDQUFDO1FBQ2hGLE1BQU0sTUFBTSxHQUFHLGFBQWEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFNBQVMsS0FBSyxJQUFJLENBQUUsQ0FBQztRQUMxRSxJQUFJLG9CQUFvQixHQUFHLEtBQU0sQ0FBQyxLQUFLLENBQUM7UUFDeEMsSUFBSSxlQUFlLEdBQUcsTUFBTyxDQUFDLEtBQUssQ0FBQztRQUNwQyxLQUFLLENBQUMsV0FBVyxDQUFFLGFBQWEsQ0FBRSxDQUFDO1FBQ25DLEtBQUssQ0FBQyxXQUFXLENBQUUsY0FBYyxDQUFFLENBQUM7UUFDcEMsS0FBSyxDQUFDLGlCQUFpQixDQUFFLFVBQVUsRUFBRSxFQUFFLENBQUUsQ0FBQztRQUUxQyxJQUFLLGlCQUFpQixFQUN0QjtZQUNDLE1BQU0scUJBQXFCLEdBQUcsV0FBVyxDQUFDLG1CQUFtQixDQUFFLFdBQVcsQ0FBQyxrQkFBa0IsRUFBRSxDQUFFLENBQUM7WUFFbEcsTUFBTSxJQUFJLEdBQUcsY0FBYyxDQUFDLDRCQUE0QixFQUFFLENBQUM7WUFDM0QsTUFBTSxxQkFBcUIsR0FBRyxjQUFjLENBQUMsZUFBZSxDQUFFLElBQUksQ0FBRSxDQUFDO1lBRXJFLElBQUssWUFBWSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUUscUJBQXFCLElBQUksQ0FBQyxJQUFJLHFCQUFxQixJQUFJLENBQUMsQ0FBRSxJQUFJLHFCQUFxQixFQUN6SDtnQkFDQyxvQkFBb0IsR0FBRyxpQkFBaUIsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU8sQ0FBQyxLQUFLLENBQUM7Z0JBQ2pGLGVBQWUsR0FBRyxpQkFBaUIsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQU0sQ0FBQyxLQUFLLENBQUM7Z0JBQzVFLE1BQU0sR0FBRyxrQkFBa0IsQ0FBQztnQkFDNUIsS0FBSyxDQUFDLFdBQVcsQ0FBRSxhQUFhLEVBQUUsSUFBSSxDQUFFLENBQUM7YUFDekM7aUJBRUQ7Z0JBQ0Msb0JBQW9CLEdBQUcscUJBQXFCLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxNQUFPLENBQUMsS0FBSyxDQUFDO2dCQUNyRixlQUFlLEdBQUcscUJBQXFCLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxNQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFNLENBQUMsS0FBSyxDQUFDO2dCQUNoRixNQUFNLEdBQUcsaUJBQWlCLElBQUkscUJBQXFCLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQztnQkFDL0YsS0FBSyxDQUFDLFdBQVcsQ0FBRSxhQUFhLEVBQUUsaUJBQWlCLElBQUkscUJBQXFCLENBQUUsQ0FBQztnQkFDL0UsS0FBSyxDQUFDLFdBQVcsQ0FBRSxjQUFjLEVBQUUsaUJBQWlCLElBQUkscUJBQXFCLENBQUUsQ0FBQzthQUNoRjtTQUNEO1FBRUQsSUFBSyxnQkFBZ0IsQ0FBQyxjQUFjLENBQUUsaUJBQWlCLENBQUUsSUFBSSxnQkFBZ0IsQ0FBQyxlQUFlLEVBQzdGO1lBQ0MsS0FBSyxDQUFDLFdBQVcsQ0FBRSxhQUFhLEVBQUUsS0FBSyxDQUFFLENBQUM7WUFDMUMsS0FBSyxDQUFDLFdBQVcsQ0FBRSxjQUFjLEVBQUUsS0FBSyxDQUFFLENBQUM7WUFDM0MsTUFBTSxHQUFHLHVCQUF1QixDQUFDO1NBQ2pDO1FBRUQsSUFBSyxnQkFBZ0IsQ0FBQyxjQUFjLENBQUUsb0JBQW9CLENBQUUsSUFBSSxnQkFBZ0IsQ0FBQyxrQkFBa0IsRUFDbkc7WUFDQyw2Q0FBNkMsQ0FBRSxnQkFBZ0IsQ0FBQyxrQkFBa0IsQ0FBRSxDQUFDO1NBQ3JGO1FBRUQsS0FBSyxDQUFDLGlCQUFpQixDQUFFLFlBQVksRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFFLE1BQU0sQ0FBRSxDQUFFLENBQUM7UUFDOUQsS0FBSyxDQUFDLG9CQUFvQixDQUFFLG9CQUFvQixFQUFFLG9CQUFvQixDQUFFLENBQUM7UUFDekUsS0FBSyxDQUFDLG9CQUFvQixDQUFFLGFBQWEsRUFBRSxlQUFlLENBQUUsQ0FBQztRQUM3RCxVQUFVLEVBQUUsQ0FBQztJQUNkLENBQUM7SUFFRCxTQUFTLFVBQVU7UUFFbEIsTUFBTSxPQUFPLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGlCQUFpQixDQUFFLFNBQVMsQ0FBRSxDQUFDO1FBQ25FLE9BQU8sQ0FBQyxZQUFZLENBQUUsTUFBTSxDQUFFLENBQUM7SUFDaEMsQ0FBQztJQUVELFNBQVMsNkNBQTZDLENBQUUsa0JBQXlCO1FBRWhGLE1BQU0sT0FBTyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBRSxpQkFBaUIsR0FBRyxrQkFBa0IsQ0FBRSxDQUFDO1FBQ2hHLElBQUssT0FBTyxFQUNaO1lBQ0MsT0FBTyxDQUFDLFFBQVEsQ0FBRSxNQUFNLENBQUUsQ0FBQztTQUMzQjtJQUNGLENBQUM7SUFFRCxTQUFTLFVBQVU7UUFFbEIsZ0JBQWdCLEdBQUcsV0FBVyxDQUFDLHFCQUFxQixFQUFFLENBQUM7UUFDdkQsYUFBYSxHQUFHLFdBQVcsQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUU5QyxJQUFLLENBQUMsZ0JBQWdCO1lBQ3JCLE9BQU8sS0FBSyxDQUFDO1FBRWQsSUFBSyxDQUFDLGFBQWE7WUFDbEIsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEtBQUssSUFBSSxDQUFFO1lBQzNELENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsU0FBUyxLQUFLLFdBQVcsQ0FBRTtZQUNsRSxPQUFPLEtBQUssQ0FBQztRQUVkLElBQUssZ0JBQWdCLENBQUMsY0FBYyxDQUFFLGdCQUFnQixDQUFFO1lBQ3ZELE9BQU8sS0FBSyxDQUFDO1FBR2QsSUFBSyxZQUFZLENBQUMsdUJBQXVCLENBQUUsS0FBSyxDQUFFLElBQUksWUFBWTtZQUNqRSxPQUFPLEtBQUssQ0FBQztRQUVkLG9CQUFvQixFQUFFLENBQUM7UUFFdkIsT0FBTyxJQUFJLENBQUM7SUFDYixDQUFDO0lBRUQsU0FBUyxLQUFLO1FBRWIsQ0FBQyxDQUFDLEdBQUcsQ0FBRSxvQkFBb0IsQ0FBRSxDQUFDO1FBRTlCLElBQUssV0FBVyxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsRUFBRyxDQUFDLFFBQVEsQ0FBRSxTQUFTLENBQUUsRUFDbkY7WUFDQyxJQUFJLEVBQUUsQ0FBQztZQUNQLE9BQU87U0FDUDtRQUVELElBQUssVUFBVSxFQUFHLEVBQ2xCO1lBQ0MsVUFBVSxDQUFDLGFBQWEsQ0FBRSxTQUFTLENBQUUsQ0FBQztZQUN0QyxVQUFVLENBQUMsaUJBQWlCLENBQUUsaUJBQWlCLENBQUUsQ0FBQztZQUVsRCxDQUFDLENBQUMsUUFBUSxDQUFFLGlCQUFpQixFQUFFLElBQUksQ0FBRSxDQUFDO1NBQ3RDO2FBRUQ7WUFDQyxJQUFJLEVBQUUsQ0FBQztZQUNQLE9BQU87U0FDUDtJQUNGLENBQUM7SUFFRCxTQUFTLElBQUk7UUFFWixDQUFDLENBQUMsR0FBRyxDQUFFLGtCQUFrQixDQUFFLENBQUM7UUFFNUIsVUFBVSxDQUFDLGFBQWEsRUFBRSxDQUFDO0lBQzVCLENBQUM7SUFFRCxTQUFTLFFBQVE7SUFFakIsQ0FBQztJQUVELG9HQUFvRztJQUNwRywyQ0FBMkM7SUFDM0Msb0dBQW9HO0lBQ3BHO1FBQ0MsVUFBVSxDQUFDLG1CQUFtQixDQUFFO1lBQy9CLElBQUksRUFBRSxTQUFTO1lBQ2YsS0FBSyxFQUFFLEtBQUs7WUFDWixRQUFRLEVBQUUsUUFBUTtTQUNsQixDQUFFLENBQUM7S0FDSjtBQUNGLENBQUMsRUFsS1MsT0FBTyxLQUFQLE9BQU8sUUFrS2hCIn0=