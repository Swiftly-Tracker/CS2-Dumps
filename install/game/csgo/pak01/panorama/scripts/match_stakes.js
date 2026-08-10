"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="rating_emblem.ts" />
/// <reference path="mock_adapter.ts" />
var MatchStakes;
(function (MatchStakes) {
    let m_elMatchStakes = undefined;
    function _msg(msg) {
    }
    function _GetRootPanel() {
        let parent = $.GetContextPanel().GetParent();
        let newParent = parent.GetParent();
        while (newParent) {
            parent = newParent;
            newParent = parent.GetParent();
        }
        return parent;
    }
    function _GetMatchStakesPanel() {
        if (!m_elMatchStakes) {
            _msg('getting matchstakes panel');
            let elHud = _GetRootPanel();
            m_elMatchStakes = elHud.FindChildTraverse('MatchStakes');
        }
        return m_elMatchStakes;
    }
    function EndTeamIntro() {
        const type = MockAdapter.GetPlayerCompetitiveRankType(GameStateAPI.GetLocalPlayerXuid());
        if (type !== 'Premier')
            return;
        let elMatchStakes = _GetMatchStakesPanel();
        elMatchStakes.style.visibility = 'collapse';
        elMatchStakes.Data().teamIntroInProgress = false;
    }
    MatchStakes.EndTeamIntro = EndTeamIntro;
    function StartTeamIntro() {
        const mysteamid = GameStateAPI.GetLocalPlayerXuid();
        let rankStats = MockAdapter.GetPlayerPremierRankStatsObject(mysteamid);
        if (!rankStats || rankStats.rankType !== 'Premier')
            return;
        let elMatchStakes = _GetMatchStakesPanel();
        elMatchStakes.style.visibility = 'visible';
        elMatchStakes.Data().teamIntroInProgress = true;
        elMatchStakes.SetHasClass('no-rating', rankStats.score === 0);
        let elWin = elMatchStakes.FindChildTraverse('jsMatchStakesWin');
        let elLoss = elMatchStakes.FindChildTraverse('jsMatchStakesLoss');
        let elPfx = elMatchStakes.FindChildTraverse('jsMatchStakes_pfx');
        const score = MockAdapter.GetPlayerCompetitiveRanking(mysteamid);
        const wins = MockAdapter.GetPlayerCompetitiveWins(mysteamid);
        let options = {
            root_panel: elMatchStakes,
            rating_type: 'Premier',
            do_fx: false,
            full_details: true,
            leaderboard_details: { score: score, matchesWon: wins },
            local_player: true
        };
        RatingEmblem.SetXuid(options);
        let introText = RatingEmblem.GetIntroText(elMatchStakes);
        elMatchStakes.SetHasClass('show-intro-text', introText !== '');
        elMatchStakes.SetDialogVariable('introtext', introText);
        elMatchStakes.TriggerClass('reveal-stakes');
        let promotionState = RatingEmblem.GetPromotionState(elMatchStakes);
        let ParticleEffect = '';
        let majorRating = '';
        let arrRating = RatingEmblem.SplitRating(rankStats.score);
        majorRating = arrRating[0];
        let tier = Math.floor(+majorRating / 5.0);
        let tierColor = RatingParticleControls.ColorConvert(tier);
        if (promotionState === 'relegation') {
            ParticleEffect = "particles/ui/premier_ratings_matchstakes_relegation.vpcf";
        }
        else if (promotionState === 'promotion') {
            ParticleEffect = "particles/ui/premier_ratings_matchstakes_promo.vpcf";
        }
        function _SetDelta(panel, prediction, score, promotionState, bLoss) {
            let delta = prediction - score;
            let deltaStr;
            let arrPrediction = RatingEmblem.SplitRating(prediction);
            if (arrPrediction[2] === '2') {
                deltaStr = $.Localize('#cs_rating_relegation_match');
            }
            else if (arrPrediction[2] === '1') {
                deltaStr = $.Localize('#cs_rating_promotion_match');
            }
            else if (delta === 0) {
                deltaStr = bLoss ? '-0' : '+0';
            }
            else if (delta < 0) {
                deltaStr = String(delta);
            }
            else {
                deltaStr = String('+' + delta);
            }
            panel.SetDialogVariable('delta', deltaStr);
            panel.SetHasClass('animate', true);
            panel.AddClass('reveal-stakes');
        }
        _SetDelta(elWin, rankStats.predictedRankingIfWin, rankStats.score, promotionState, false);
        _SetDelta(elLoss, rankStats.predictedRankingIfLoss, rankStats.score, promotionState, true);
        if (promotionState) {
            elPfx.SetParticleNameAndRefresh(ParticleEffect);
            elPfx.SetControlPoint(16, tierColor.R, tierColor.G, tierColor.B);
        }
    }
    MatchStakes.StartTeamIntro = StartTeamIntro;
})(MatchStakes || (MatchStakes = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWF0Y2hfc3Rha2VzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvbWF0Y2hfc3Rha2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFDbEMseUNBQXlDO0FBQ3pDLHdDQUF3QztBQUV4QyxJQUFVLFdBQVcsQ0F5SnBCO0FBekpELFdBQVUsV0FBVztJQUVwQixJQUFJLGVBQWUsR0FBd0IsU0FBUyxDQUFDO0lBRXJELFNBQVMsSUFBSSxDQUFHLEdBQVc7SUFHM0IsQ0FBQztJQUVELFNBQVMsYUFBYTtRQUVyQixJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsU0FBUyxFQUFFLENBQUM7UUFFN0MsSUFBSSxTQUFTLEdBQUcsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ25DLE9BQVEsU0FBUyxFQUNqQjtZQUNDLE1BQU0sR0FBRyxTQUFTLENBQUM7WUFDbkIsU0FBUyxHQUFHLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQztTQUMvQjtRQUVELE9BQU8sTUFBTSxDQUFDO0lBQ2YsQ0FBQztJQUVELFNBQVMsb0JBQW9CO1FBRTVCLElBQUssQ0FBQyxlQUFlLEVBQ3JCO1lBQ0MsSUFBSSxDQUFFLDJCQUEyQixDQUFFLENBQUM7WUFDcEMsSUFBSSxLQUFLLEdBQUcsYUFBYSxFQUFFLENBQUM7WUFDNUIsZUFBZSxHQUFHLEtBQUssQ0FBQyxpQkFBaUIsQ0FBRSxhQUFhLENBQUUsQ0FBQztTQUMzRDtRQUVELE9BQU8sZUFBZSxDQUFDO0lBQ3hCLENBQUM7SUFFRCxTQUFnQixZQUFZO1FBRTNCLE1BQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQyw0QkFBNEIsQ0FBRSxZQUFZLENBQUMsa0JBQWtCLEVBQUUsQ0FBRSxDQUFDO1FBQzNGLElBQUssSUFBSSxLQUFLLFNBQVM7WUFDdEIsT0FBTztRQUVSLElBQUksYUFBYSxHQUFHLG9CQUFvQixF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