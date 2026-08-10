"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/async.ts" />
/// <reference path="rating_emblem.ts" />
/// <reference path="mock_adapter.ts" />
/// <reference path="honor_icon.ts" />
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxheWVyX3N0YXRzX2NhcmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wbGF5ZXJfc3RhdHNfY2FyZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBQ2xDLHdDQUF3QztBQUN4Qyx5Q0FBeUM7QUFDekMsd0NBQXdDO0FBQ3hDLHNDQUFzQztBQUV0QyxJQUFVLGVBQWUsQ0FpUnhCO0FBalJELFdBQVUsZUFBZTtJQUV4QixNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUM7SUFFdkIsU0FBZ0IsSUFBSSxDQUFHLFFBQWlCLEVBQUUsSUFBWSxFQUFFLEtBQWE7UUFFcEUsQ0FBQyxDQUFDLHlCQUF5QixDQUFFLDhCQUE4QixFQUFFLGlCQUFpQixDQUFFLENBQUM7UUFFakYsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBRSxDQUFDO1FBQ3pELE1BQU0sQ0FBQyxXQUFXLENBQUUsaURBQWlELEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBRSxDQUFDO1FBQ3RGLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBRSxZQUFZLEVBQUUsTUFBTSxDQUFFLFdBQVcsQ0FBQyxhQUFhLENBQUUsSUFBSSxDQUFFLENBQUUsQ0FBRSxDQUFDO1FBQ3pGLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBRSxNQUFNLEVBQUUsTUFBTSxDQUFFLElBQUksQ0FBRSxDQUFFLENBQUM7UUFFdEQsTUFBTSxDQUFDLFdBQVcsQ0FBRSxhQUFhLEVBQUUsSUFBSSxLQUFLLFdBQVcsQ0FBQyxrQkFBa0IsRUFBRSxDQUFFLENBQUM7UUFFL0UsSUFBSSxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBRWpCLFFBQVMsV0FBVyxDQUFDLHVCQUF1QixDQUFFLEtBQUssQ0FBRSxFQUNyRDtZQUVDLEtBQUssVUFBVSxDQUFDO1lBQ2hCLEtBQUssWUFBWTtnQkFDaEIs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