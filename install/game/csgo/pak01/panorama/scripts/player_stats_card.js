"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/async.ts" />
/// <reference path="rating_emblem.ts" />
/// <reference path="mock_adapter.ts" />
var PlayerStatsCard;
(function (PlayerStatsCard) {
    const CARD_ID = 'card';
    function Init(elParent, xuid, index) {
        $.RegisterForUnhandledEvent("EndOfMatch_SkillGroupUpdated", _UpdateSkillGroup);
        let elCard = $.CreatePanel('Panel', elParent, CARD_ID);
        elCard.BLoadLayout("file://{resources}/layout/player_stats_card.xml", false, false);
        elCard.SetDialogVariableInt('playerslot', Number(MockAdapter.GetPlayerSlot(xuid)));
        elCard.SetDialogVariableInt('xuid', Number(xuid));
        elCard.SetHasClass('localplayer', xuid === MockAdapter.GetLocalPlayerXuid());
        let snippet = '';
        switch (MockAdapter.GetGameModeInternalName(false)) {
            case 'training':
            case 'deathmatch':
                snippet = 'snippet-banner-dm';
                break;
            case 'gungameprogressive':
                snippet = "snippet-banner-ar";
                break;
            default:
                snippet = 'snippet-banner-classic';
                break;
        }
        elCard.FindChildTraverse('JsBanner').BLoadLayoutSnippet(snippet);
        let elBannerBG = elCard.FindChildTraverse('JsBannerBG');
        elBannerBG.SetImage('file://{images}/stats_cards/stats_card_banner_' + index + '.png');
        let elCardBG = elCard.FindChildTraverse('JsCardBG');
        let maxCoord = 100;
        let minCoord = -100;
        let randX = Math.floor(Math.random() * (maxCoord - minCoord) + minCoord);
        let randY = Math.floor(Math.random() * (maxCoord - minCoord) + minCoord);
        elCardBG.style.backgroundPosition = randX + '% ' + randY + '%';
        _SetHonorIcon(elCard, xuid);
        return elCard;
    }
    PlayerStatsCard.Init = Init;
    function GetCard(elParent) {
        return elParent.FindChildTraverse(CARD_ID);
    }
    PlayerStatsCard.GetCard = GetCard;
    function SetAccolade(elCard, accValue, accName, accPosition) {
        if (!isNaN(Number(accValue))) {
            accValue = String(Math.floor(Number(accValue)));
        }
        elCard.SetDialogVariable('accolade-value-string', accValue);
        elCard.SetDialogVariableTime('accolade-value-time', Number(accValue));
        elCard.SetDialogVariableInt('accolade-value-int', Number(accValue));
        let secondPlaceSuffix = (accPosition != '1') ? '_2' : '';
        elCard.SetDialogVariable('accolade-the-title', $.Localize('#accolade_' + accName + secondPlaceSuffix));
        elCard.SetDialogVariable('accolade-desc', $.Localize('#accolade_' + accName + '_desc' + secondPlaceSuffix, elCard));
        let valueToken = '#accolade_' + accName + '_value';
        let valueLocalized = $.Localize('#accolade_' + accName + '_value', elCard);
        if (valueToken == valueLocalized)
            valueLocalized = '';
        elCard.SetDialogVariable('accolade-value', valueLocalized);
        elCard.SetHasClass('show-accolade', true);
    }
    PlayerStatsCard.SetAccolade = SetAccolade;
    function SetAvatar(elCard, xuid) {
        let elAvatarImage = elCard.FindChildTraverse('jsAvatar');
        elAvatarImage.PopulateFromPlayerSlot(MockAdapter.GetPlayerSlot(xuid));
        let team = MockAdapter.GetPlayerTeamName(xuid);
        elAvatarImage.SwitchClass('teamstyle', 'team--' + team);
    }
    PlayerStatsCard.SetAvatar = SetAvatar;
    function SetFlair(elCard, xuid) {
        let flairItemId = InventoryAPI.GetFlairItemId(xuid);
        if (flairItemId === "0" || !flairItemId) {
            const flairDefIdx = FriendsListAPI.GetFriendDisplayItemDefFeatured(xuid);
            flairItemId = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(flairDefIdx, 0);
            if (flairItemId === "0" || !flairItemId || flairDefIdx == 65535)
                return false;
        }
        const imagePath = InventoryAPI.GetItemInventoryImage(flairItemId);
        let elFlairImage = elCard.FindChildTraverse('jsFlairImage');
        elFlairImage.SetImage('file://{images}' + imagePath + '_small.png');
        elCard.SetHasClass('show-flair', true);
    }
    PlayerStatsCard.SetFlair = SetFlair;
    function _UpdateSkillGroup(strSkillgroupData) {
        const oSkillgroupData = JSON.parse(strSkillgroupData);
        Object.keys(oSkillgroupData).forEach((xuid, i) => {
            const cardId = 'cardcontainer-' + xuid;
            const elCard = $.GetContextPanel().FindChildTraverse(cardId);
            if (elCard) {
                const newPlayerData = oSkillgroupData[xuid];
                if (newPlayerData && newPlayerData.hasOwnProperty('new_rank') &&
                    newPlayerData.hasOwnProperty('rank_type')) {
                    const wins = newPlayerData.hasOwnProperty('num_wins') ? newPlayerData.num_wins : 0;
                    const options = {
                        root_panel: elCard.FindChildTraverse('jsRatingEmblem'),
                        do_fx: true,
                        full_details: false,
                        leaderboard_details: { score: newPlayerData.new_rank, matchesWon: wins },
                        rating_type: newPlayerData.rank_type,
                        local_player: xuid === MyPersonaAPI.GetXuid()
                    };
                    $.Schedule(1.0 + 0.5 * i, () => {
                        if (elCard && elCard.IsValid()) {
                            RatingEmblem.SetXuid(options);
                            elCard.TriggerClass('skillgroup-update');
                        }
                    });
                }
            }
        });
    }
    function SetSkillGroup(elCard, xuid) {
        if (!elCard.FindChildTraverse('jsRatingEmblem'))
            return;
        const rating_type = MockAdapter.GetPlayerCompetitiveRankType(xuid);
        const score = MockAdapter.GetPlayerCompetitiveRanking(xuid);
        const wins = MockAdapter.GetPlayerCompetitiveWins(xuid);
        const options = {
            root_panel: elCard.FindChildTraverse('jsRatingEmblem'),
            do_fx: true,
            full_details: true,
            rating_type: rating_type,
            leaderboard_details: { score: score, matchesWon: wins },
            local_player: xuid === MyPersonaAPI.GetXuid()
        };
        const bShowSkillGroup = RatingEmblem.SetXuid(options);
        if (bShowSkillGroup) {
            elCard.RemoveClass('show-skillgroup');
            $.Schedule(0, () => elCard && elCard.IsValid() ? elCard.AddClass('show-skillgroup') : '');
        }
        else {
            elCard.RemoveClass('show-skillgroup');
        }
    }
    PlayerStatsCard.SetSkillGroup = SetSkillGroup;
    function _SetHonorIcon(elPanel, xuid) {
        const elHonorIcon = elPanel.FindChildTraverse('jsHonorIcon');
        elHonorIcon.Set(GameStateAPI.GetPlayerXpTrailLevel(xuid), false);
    }
    function SetStats(elCard, xuid, arrBestStats = null) {
        let oStats = MockAdapter.GetPlayerStatsJSO(xuid);
        let score = MockAdapter.GetPlayerScore(xuid);
        if (arrBestStats) {
            for (let oBest of arrBestStats) {
                let stat = oBest.stat;
                if (oStats[stat] > 0 && (!oBest.value || oStats[stat] > oBest.value)) {
                    oBest.value = oStats[stat];
                    oBest.elCard = elCard;
                }
            }
        }
        elCard.SetDialogVariableInt('playercardstats-kills', Number(oStats.kills));
        elCard.SetDialogVariableInt('playercardstats-deaths', Number(oStats.deaths));
        elCard.SetDialogVariableInt('playercardstats-assists', Number(oStats.assists));
        elCard.SetDialogVariableInt('playercardstats-adr', Number(oStats.adr));
        elCard.SetDialogVariableInt('playercardstats-hsp', Number(oStats.hsp));
        elCard.SetDialogVariableInt('playercardstats-ef', Number(oStats.enemiesflashed));
        elCard.SetDialogVariableInt('playercardstats-ud', Number(oStats.utilitydamage));
        elCard.SetDialogVariableInt('playercardstats-score', Number(score));
        elCard.SetDialogVariableInt('playercardstats-gglevel', Number(Math.floor(score / 2)));
        elCard.SetDialogVariableInt('playercardstats-knifekills', Number(oStats.knifekills));
        elCard.SetHasClass('show-stats', true);
    }
    PlayerStatsCard.SetStats = SetStats;
    function SetTeammateColor(elCard, xuid) {
        for (let elPlayerColor of elCard.FindChildrenWithClassTraverse('colorize-teammate-color')) {
            let teammateColor = MockAdapter.GetPlayerColor(xuid);
            let teamName = MockAdapter.GetPlayerTeamName(xuid);
            let teamColor = teammateColor ? teammateColor : teamName == 'CT' ? '#5ab8f4' : '#f0c941';
            elPlayerColor.style.washColor = (teamColor !== '') ? teamColor : 'black';
        }
    }
    PlayerStatsCard.SetTeammateColor = SetTeammateColor;
    async function RevealStats(elCard) {
        const DELAY_DELTA = 0.1;
        for (const elPanel of elCard.FindChildrenWithClassTraverse('sliding-panel')) {
            await Async.Delay(DELAY_DELTA);
            elPanel.AddClass('slide');
        }
    }
    PlayerStatsCard.RevealStats = RevealStats;
    function HighlightStat(elCard, stat) {
        elCard.AddClass('highlight-' + stat);
    }
    PlayerStatsCard.HighlightStat = HighlightStat;
})(PlayerStatsCard || (PlayerStatsCard = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxheWVyX3N0YXRzX2NhcmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wbGF5ZXJfc3RhdHNfY2FyZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBQ2xDLHdDQUF3QztBQUN4Qyx5Q0FBeUM7QUFDekMsd0NBQXdDO0FBRXhDLElBQVUsZUFBZSxDQWlSeEI7QUFqUkQsV0FBVSxlQUFlO0lBRXhCLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQztJQUV2QixTQUFnQixJQUFJLENBQUcsUUFBaUIsRUFBRSxJQUFZLEVBQUUsS0FBYTtRQUVwRSxDQUFDLENBQUMseUJBQXlCLENBQUUsOEJBQThCLEVBQUUsaUJBQWlCLENBQUUsQ0FBQztRQUVqRixJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFFLENBQUM7UUFDekQsTUFBTSxDQUFDLFdBQVcsQ0FBRSxpREFBaUQsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFFLENBQUM7UUFDdEYsTUFBTSxDQUFDLG9CQUFvQixDQUFFLFlBQVksRUFBRSxNQUFNLENBQUUsV0FBVyxDQUFDLGFBQWEsQ0FBRSxJQUFJLENBQUUsQ0FBRSxDQUFFLENBQUM7UUFDekYsTUFBTSxDQUFDLG9CQUFvQixDQUFFLE1BQU0sRUFBRSxNQUFNLENBQUUsSUFBSSxDQUFFLENBQUUsQ0FBQztRQUV0RCxNQUFNLENBQUMsV0FBVyxDQUFFLGFBQWEsRUFBRSxJQUFJLEtBQUssV0FBVyxDQUFDLGtCQUFrQixFQUFFLENBQUUsQ0FBQztRQUUvRSxJQUFJLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFFakIsUUFBUyxXQUFXLENBQUMsdUJBQXVCLENBQUUsS0FBSyxDQUFFLEVBQ3JEO1lBRUMsS0FBSyxVQUFVLENBQUM7WUFDaEIsS0FBSyxZQUFZO2dCQUNoQixPQUFPLEdBQUcsbUJB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