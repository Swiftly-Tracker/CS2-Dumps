"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="rating_emblem.ts" />
/// <reference path="mock_adapter.ts" />
$.LogChannel('p.matchstakes', "LV_OFF");
var MatchStakes;
(function (MatchStakes) {
    let m_elMatchStakes = undefined;
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
            $.Msg('[p.matchstakes] getting matchstakes panel');
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
            //	api: 'gamestate',
            //	xuid: mysteamid,
            root_panel: elMatchStakes,
            rating_type: 'Premier',
            do_fx: false,
            full_details: true,
            leaderboard_details: { score: score, matchesWon: wins },
            local_player: true
        };
        RatingEmblem.SetXuid(options);
        // promotion / relegation
        let introText = RatingEmblem.GetIntroText(elMatchStakes);
        elMatchStakes.SetHasClass('show-intro-text', introText !== '');
        elMatchStakes.SetDialogVariable('introtext', introText);
        elMatchStakes.TriggerClass('reveal-stakes');
        let promotionState = RatingEmblem.GetPromotionState(elMatchStakes);
        let ParticleEffect = '';
        // todo: get tier from ratingsemblem
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWF0Y2hfc3Rha2VzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvbWF0Y2hfc3Rha2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFDbEMseUNBQXlDO0FBQ3pDLHdDQUF3QztBQUV4QyxDQUFDLENBQUMsVUFBVSxDQUFFLGVBQWUsRUFBRSxRQUFRLENBQUUsQ0FBQztBQUUxQyxJQUFVLFdBQVcsQ0FvSnBCO0FBcEpELFdBQVUsV0FBVztJQUVwQixJQUFJLGVBQWUsR0FBd0IsU0FBUyxDQUFDO0lBRXJELFNBQVMsYUFBYTtRQUVyQixJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsU0FBUyxFQUFFLENBQUM7UUFFN0MsSUFBSSxTQUFTLEdBQUcsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ25DLE9BQVEsU0FBUyxFQUNqQjtZQUNDLE1BQU0sR0FBRyxTQUFTLENBQUM7WUFDbkIsU0FBUyxHQUFHLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQztTQUMvQjtRQUVELE9BQU8sTUFBTSxDQUFDO0lBQ2YsQ0FBQztJQUVELFNBQVMsb0JBQW9CO1FBRTVCLElBQUssQ0FBQyxlQUFlLEVBQ3JCO1lBQ0MsQ0FBQyxDQUFDLEdBQUcsQ0FBRSwyQ0FBMkMsQ0FBRSxDQUFDO1lBQ3JELElBQUksS0FBSyxHQUFHLGFBQWEsRUFBRSxDQUFDO1lBQzVCLGVBQWUsR0FBRyxLQUFLLENBQUMsaUJBQWlCLENBQUUsYUFBYSxDQUFFLENBQUM7U0FDM0Q7UUFFRCxPQUFPLGVBQWUsQ0FBQztJQUN4QixDQUFDO0lBRUQsU0FBZ0IsWUFBWTtRQUUzQixNQUFNLElBQUksR0FBRyxXQUFXLENBQUMsNEJBQTRCLENBQUUsWUFBWSxDQUFDLGtCQUFrQixFQUFFLENBQUUsQ0FBQztRQUMzRixJQUFLLElBQUksS0FBSyxTQUFTO1lBQ3RCLE9BQU87UUFF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