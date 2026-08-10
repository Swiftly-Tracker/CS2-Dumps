"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../common/formattext.ts" />
var TooltipPlayerXp;
(function (TooltipPlayerXp) {
    function Init() {
        let xuid = $.GetContextPanel().GetAttributeString("xuid", "not-found");
        let rawBonuses = MyPersonaAPI.GetActiveXpBonuses();
        let bonusesArray = rawBonuses.split(",");
        let maxLevel = InventoryAPI.GetMaxLevel();
        let currentPoints = FriendsListAPI.GetFriendXp(xuid);
        let pointsPerLevel = MyPersonaAPI.GetXpPerLevel();
        let currentLvl = FriendsListAPI.GetFriendLevel(xuid);
        let isDueServiceMedal = currentLvl >= maxLevel;
        $.GetContextPanel().SetDialogVariable("xpcurrent", String(currentPoints));
        $.GetContextPanel().SetDialogVariable("xptonext", String(pointsPerLevel - currentPoints));
        $("#JsTooltip_Xp_Current").text = isDueServiceMedal ? "#tooltip_xp_have_max_current" : "#tooltip_xp_current";
        $("#JsTooltip_Xp_Needed").text = isDueServiceMedal ? "#tooltip_xp_have_max_rank" : "#tooltip_xp_for_next_rank";
        if (bonusesArray.length > 0) {
            if (isDueServiceMedal) {
                for (let i = 0; i < bonusesArray.length; i++) {
                    if (bonusesArray[i] === '2')
                        bonusesArray.splice(i, 1);
                }
            }
        }
        let numBonusesAdded = 0;
        if (bonusesArray.length > 0) {
            $('#JsTooltipXpSection').RemoveClass('hidden');
            $("#JsTooltipXpBonuses").RemoveAndDeleteChildren();
            for (let i = 0; i < bonusesArray.length; i++) {
                if (!bonusesArray[i])
                    continue;
                ++numBonusesAdded;
                let newTile = $.CreatePanel("Label", $("#JsTooltipXpBonuses"), 'JsTooltipBonus' + i, { html: true });
                let secRemaining = StoreAPI.GetSecondsUntilXpRollover();
                newTile.SetDialogVariable('time-to-week-rollover', (secRemaining > 0) ? FormatText.SecondsToSignificantTimeString(secRemaining) : '');
                newTile.AddClass('tooltip-player-xp__subtitle');
                newTile.text = $.Localize("#tooltip_xp_bonus_" + bonusesArray[i], newTile);
            }
            let xpTrailTimeRemaining = MyPersonaAPI.GetXpTrailTimeRemaining();
            if (xpTrailTimeRemaining > 0) {
                ++numBonusesAdded;
                let newTile = $.CreatePanel("Label", $("#JsTooltipXpBonuses"), 'JsTooltipBonus_xptrail', { html: true });
                newTile.SetDialogVariable('xptrail-time-remaining', FormatText.SecondsToSignificantTimeString(xpTrailTimeRemaining));
                newTile.AddClass('tooltip-player-xp__subtitle');
                newTile.text = $.Localize("#tooltip_xp_bonus_xptrail", newTile);
            }
        }
        if (!numBonusesAdded) {
            $('#JsTooltipXpSection').AddClass('hidden');
        }
    }
    TooltipPlayerXp.Init = Init;
})(TooltipPlayerXp || (TooltipPlayerXp = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbHRpcF9wbGF5ZXJfeHAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy90b29sdGlwcy90b29sdGlwX3BsYXllcl94cC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBQ3JDLGdEQUFnRDtBQUVoRCxJQUFVLGVBQWUsQ0FpRnhCO0FBakZELFdBQVUsZUFBZTtJQUV4QixTQUFnQixJQUFJO1FBRW5CLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxNQUFNLEVBQUUsV0FBVyxDQUFFLENBQUM7UUFDekUsSUFBSSxVQUFVLEdBQUcsWUFBWSxDQUFDLGtCQUFrQixFQUFFLENBQUM7UUFDbkQsSUFBSSxZQUFZLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN6QyxJQUFJLFFBQVEsR0FBRyxZQUFZLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDMUMsSUFBSSxhQUFhLEdBQUcsY0FBYyxDQUFDLFdBQVcsQ0FBRSxJQUFJLENBQUUsQ0FBQztRQUN2RCxJQUFJLGNBQWMsR0FBRyxZQUFZLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDbEQsSUFBSSxVQUFVLEdBQUcsY0FBYyxDQUFDLGNBQWMsQ0FBRSxJQUFJLENBQUUsQ0FBQztRQUN2RCxJQUFJLGlCQUFpQixHQUFHLFVBQVUsSUFBSSxRQUFRLENBQUM7UUFFL0MsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGlCQUFpQixDQUFFLFdBQVcsRUFBRSxNQUFNLENBQUUsYUFBYSxDQUFFLENBQUUsQ0FBQztRQUM5RSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsaUJBQWlCLENBQUUsVUFBVSxFQUFFLE1BQU0sQ0FBRSxjQUFjLEdBQUcsYUFBYSxDQUFFLENBQUUsQ0FBQztRQUU1RixDQUFDLENBQUUsdUJBQXVCLENBQWUsQ0FBQyxJQUFJ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