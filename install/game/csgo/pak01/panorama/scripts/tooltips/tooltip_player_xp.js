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
            // Remove the bonus for drops if you are due a service medal.
            // We don't give you your next drop till you redeem the medal.
            if (isDueServiceMedal) {
                for (let i = 0; i < bonusesArray.length; i++) {
                    if (bonusesArray[i] === '2')
                        bonusesArray.splice(i, 1);
                }
            }
        }
        let numBonusesAdded = 0;
        if (bonusesArray.length > 0) {
            // Remove the bonus for drops if you are due a service medal.
            // We don't give you your next drop till you redeem the medal.
            $('#JsTooltipXpSection').RemoveClass('hidden');
            $("#JsTooltipXpBonuses").RemoveAndDeleteChildren();
            for (let i = 0; i < bonusesArray.length; i++) {
                if (!bonusesArray[i])
                    continue;
                ++numBonusesAdded;
                $.Msg('bonusesArray: ' + i + ': ' + bonusesArray[i]);
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
            // xp trail
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