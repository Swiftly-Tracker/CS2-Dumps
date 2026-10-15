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
                if (bonusesArray[i] == '2') {
                    const petId = InventoryAPI.GetPetItemID();
                    const nStage = petId ? Number(InventoryAPI.GetItemAttributeValue(petId, '{uint32}upgrade level')) : 0;
                    if (nStage > 0 && !!petId) {
                        const rtFoodExp = Number(InventoryAPI.GetItemAttributeValue(petId, '{uint32}pet food expiration date'));
                        const rtPetUpgr = Number(InventoryAPI.GetItemAttributeValue(petId, '{uint32}pet next upgrade date'));
                        if (rtFoodExp && rtPetUpgr && (rtFoodExp < rtPetUpgr)) {
                            let newTile = $.CreatePanel("Label", $("#JsTooltipXpBonuses"), 'JsTooltipBonus' + i, { html: true });
                            newTile.AddClass('tooltip-player-xp__subtitle');
                            newTile.text = $.Localize("#tooltip_xp_bonus_pet_feed", newTile);
                        }
                    }
                }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbHRpcF9wbGF5ZXJfeHAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy90b29sdGlwcy90b29sdGlwX3BsYXllcl94cC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBQ3JDLGdEQUFnRDtBQUVoRCxJQUFVLGVBQWUsQ0FtR3hCO0FBbkdELFdBQVUsZUFBZTtJQUV4QixTQUFnQixJQUFJO1FBRW5CLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxNQUFNLEVBQUUsV0FBVyxDQUFFLENBQUM7UUFDekUsSUFBSSxVQUFVLEdBQUcsWUFBWSxDQUFDLGtCQUFrQixFQUFFLENBQUM7UUFDbkQsSUFBSSxZQUFZLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN6QyxJQUFJLFFBQVEsR0FBRyxZQUFZLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDMUMsSUFBSSxhQUFhLEdBQUcsY0FBYyxDQUFDLFdBQVcsQ0FBRSxJQUFJLENBQUUsQ0FBQztRQUN2RCxJQUFJLGNBQWMsR0FBRyxZQUFZLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDbEQsSUFBSSxVQUFVLEdBQUcsY0FBYyxDQUFDLGNBQWMsQ0FBRSxJQUFJLENBQUUsQ0FBQztRQUN2RCxJQUFJLGlCQUFpQixHQUFHLFVBQVUsSUFBSSxRQUFRLENBQUM7UUFFL0MsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGlCQUFpQixDQUFFLFdBQVcsRUFBRSxNQUFNLENBQUUsYUFBYSxDQUFFLENBQUUsQ0FBQztRQUM5RSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsaUJBQWlCLENBQUUsVUFBVSxFQUFFLE1BQU0sQ0FBRSxjQUFjLEdBQUcsYUFBYSxDQUFFLENBQUUsQ0FBQztRQUU1RixDQUFDLENBQUUsdUJBQXVCLENBQWUsQ0FBQyxJQUFJ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