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
    const _m_nT = 2;
    function _SetVictoryStatement() {
        if (!_m_cP || !_m_cP.IsValid())
            return;
        if (!_m_oMatchEndData)
            return;
        if (!_m_oScoreData)
            return;
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
        EndOfMatch.ShowNextPanel();
    }
    function Shutdown() {
    }
    {
        EndOfMatch.RegisterPanelObject({
            name: 'eom-win',
            Start: Start,
            Shutdown: Shutdown
        });
    }
})(EOM_Win || (EOM_Win = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5kb2ZtYXRjaC13aW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9lbmRvZm1hdGNoLXdpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBQ2xDLDZDQUE2QztBQUM3Qyx3Q0FBd0M7QUFDeEMsc0NBQXNDO0FBRXRDLElBQVUsT0FBTyxDQWtLaEI7QUFsS0QsV0FBVSxPQUFPO0lBR2hCLE1BQU0saUJBQWlCLEdBQUcsR0FBRyxDQUFDO0lBQzlCLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztJQUVsQyxJQUFJLGdCQUFnQixHQUFnQyxTQUFTLENBQUM7SUFDOUQsSUFBSSxhQUFhLEdBQTBCLFNBQVMsQ0FBQztJQUdyRCxNQUFNLEtBQUssR0FBRyxDQUFDLENBQUM7SUFFaEIsU0FBUyxvQkFBb0I7UUFFNUIsSUFBSyxDQUFDLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUU7WUFDOUIsT0FBTztRQUVSLElBQUssQ0FBQyxnQkFBZ0I7WUFDckIsT0FBTztRQUVSLElBQUssQ0FBQyxhQUFhO1lBQ2xCLE9BQU87UUFHUixNQUFNLGlCQUFpQixHQUFHLGdCQUFnQixDQUFDLG1CQUFtQixDQUFDO1FBRS9ELElBQUksTUFBTSxHQUFHLGtCQUFrQixDQUFDO1FBQ2hDLE1BQU0sS0FBSyxHQUFHLGFBQWEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFNBQVMsS0FBSyxXQUFXLENBQUUsQ0FBQztRQUNoRixNQUFNLE1BQU0sR0FBRyxhQUFhLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEtBQUssSUFBSSxDQUFFLENBQUM7UUFDMUUsSUFBSSxvQkFBb0IsR0FBRyxLQUFNLENBQUMsS0FBSyxDQUFDO1FB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