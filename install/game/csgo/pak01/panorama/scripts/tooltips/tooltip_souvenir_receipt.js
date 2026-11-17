"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../common/formattext.ts" />
/// <reference path="../common/iteminfo.ts" />
/// <reference path="../generated/items_event_current_generated_store.ts" />
var TooltipSouvenirReceipt;
(function (TooltipSouvenirReceipt) {
    function Init() {
        if ($.GetContextPanel().GetAttributeString("pricing", "") === "persticker")
            InitWithPerStickerPricing();
        else
            InitWithPerRarityPricing();
    }
    TooltipSouvenirReceipt.Init = Init;
    function InitWithPerRarityPricing() {
        let itemId = $.GetContextPanel().GetAttributeString("itemid", "");
        if (!itemId) {
            UiToolkitAPI.HideCustomLayoutTooltip('tooltip-souvenir-receipt');
            return;
        }
        const nItemRarity = InventoryAPI.GetItemRarity(itemId);
        const nTotalCostInCredits = MissionsAPI.GetSeasonalOperationFauxCreditsCost(g_ActiveTournamentInfo.credits_id, 'R' + itemId);
        const elParent = $.GetContextPanel().FindChildInLayoutFile('id-sticker-list');
        const nMaxRarityShown = (nItemRarity < 7) ? 6 : nItemRarity;
        elParent.Children().forEach((sticker, idx) => { if (idx >= nMaxRarityShown)
            sticker.DeleteAsync(0); });
        for (let j = 1; j <= nMaxRarityShown; ++j) {
            let elPanel = elParent.FindChildInLayoutFile('id-sticker' + j);
            if (!elPanel) {
                elPanel = $.CreatePanel('Panel', elParent, 'id-sticker' + j);
                elPanel.BLoadLayoutSnippet('sticker-entry');
            }
            elPanel.style.washColor = InventoryAPI.GetItemRarityColor('R' + j);
            elPanel.SetDialogVariableInt('price', MissionsAPI.GetSeasonalOperationFauxCreditsCost(g_ActiveTournamentInfo.credits_id, 'R!' + j));
            elPanel.SetDialogVariable('sticker-name', $.Localize('#RI_R' + j + 'p'));
            elPanel.SetHasClass('activeitem', j === nItemRarity);
        }
        const totalSum = nTotalCostInCredits;
        let discountPrice = nTotalCostInCredits;
        $.GetContextPanel().FindChildInLayoutFile('id-sticker-total-row').SetDialogVariableInt('price', totalSum);
        $.GetContextPanel().FindChildInLayoutFile('id-sticker-discount-price-row').SetDialogVariableInt('price', discountPrice);
        $.GetContextPanel().FindChildInLayoutFile('id-sticker-discount-price-row').SetDialogVariable('currency', StoreAPI.GetStoreItemTokensBundlePrice('' + g_ActiveTournamentInfo.itemid_charge, discountPrice, ''));
        $.GetContextPanel().FindChildInLayoutFile('id-sticker-discount-row').SetDialogVariableInt('discount', InventoryAPI.GetItemSouvenirDiscountPercent(itemId));
    }
    function InitWithPerStickerPricing() {
        let itemId = $.GetContextPanel().GetAttributeString("itemid", "");
        if (!itemId) {
            UiToolkitAPI.HideCustomLayoutTooltip('tooltip-souvenir-receipt');
            return;
        }
        const elParent = $.GetContextPanel().FindChildInLayoutFile('id-sticker-list');
        const defidxStickerItem = InventoryAPI.GetItemDefinitionIndexFromDefinitionName('sticker');
        let slots = [];
        const slotCount = InventoryAPI.GetItemStickerSlotCount(itemId);
        elParent.Children().forEach((sticker, idx) => { if (idx > slotCount) {
            sticker.DeleteAsync(0);
        } });
        for (let i = 0; i < slotCount; i++) {
            const imagePath = InventoryAPI.GetItemStickerImageBySlot(itemId, i);
            if (imagePath) {
                let unCostInCredits = 0;
                const idStickerKit = InventoryAPI.GetItemAttributeValue(itemId, '{uint32}sticker slot ' + i + ' id');
                const idFauxSticker = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(defidxStickerItem, idStickerKit);
                unCostInCredits = MissionsAPI.GetSeasonalOperationFauxCreditsCost(g_ActiveTournamentInfo.credits_id, idFauxSticker);
                if (!unCostInCredits)
                    unCostInCredits = g_ActiveTournamentInfo.souvenir_cost;
                let fmtName = ItemInfo.GetFormattedName(idFauxSticker);
                const name = fmtName.vars.paintkit_name;
                slots.push({ index: i, imagePath: imagePath, name: name, cost: unCostInCredits });
            }
        }
        slots.sort((a, b) => (b.cost - a.cost) * 100 + (a.index - b.index));
        for (let j = 0; j < slots.length; j++) {
            let elPanel = elParent.FindChildInLayoutFile('id-sticker' + j);
            if (!elPanel) {
                elPanel = $.CreatePanel('Panel', elParent, 'id-sticker' + j);
                elPanel.BLoadLayoutSnippet('sticker-entry');
            }
            elPanel.SetDialogVariableInt('price', slots[j].cost);
            elPanel.SetDialogVariable('sticker-name', slots[j].name ?? slots[j].name);
        }
        const totalSum = slots.reduce((acc, curr) => { return acc + (curr.cost ?? 0); }, 0);
        const discountAmount = InventoryAPI.GetItemSouvenirDiscountPercent(itemId);
        const discountCredits = Math.trunc(totalSum * discountAmount / 100);
        let discountPrice = totalSum;
        if (discountCredits < totalSum)
            discountPrice -= discountCredits;
        $.GetContextPanel().FindChildInLayoutFile('id-sticker-total-row').SetDialogVariableInt('price', totalSum);
        $.GetContextPanel().FindChildInLayoutFile('id-sticker-discount-price-row').SetDialogVariableInt('price', discountPrice);
        $.GetContextPanel().FindChildInLayoutFile('id-sticker-discount-price-row').SetDialogVariable('currency', StoreAPI.GetStoreItemTokensBundlePrice('' + g_ActiveTournamentInfo.itemid_charge, discountPrice, ''));
        $.GetContextPanel().FindChildInLayoutFile('id-sticker-discount-row').SetDialogVariableInt('discount', InventoryAPI.GetItemSouvenirDiscountPercent(itemId));
    }
})(TooltipSouvenirReceipt || (TooltipSouvenirReceipt = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbHRpcF9zb3V2ZW5pcl9yZWNlaXB0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvdG9vbHRpcHMvdG9vbHRpcF9zb3V2ZW5pcl9yZWNlaXB0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFDckMsZ0RBQWdEO0FBQ2hELDhDQUE4QztBQUM5Qyw0RUFBNEU7QUFFNUUsSUFBVSxzQkFBc0IsQ0FpSS9CO0FBaklELFdBQVUsc0JBQXNCO0lBRS9CLFNBQWdCLElBQUk7UUFFbkIsSUFBSyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsa0JBQWtCLENBQUUsU0FBUyxFQUFFLEVBQUUsQ0FBRSxLQUFLLFlBQVk7WUFDNUUseUJBQXlCLEVBQUUsQ0FBQzs7WUFFNUIsd0JBQXdCLEVBQUUsQ0FBQztJQUM3QixDQUFDO0lBTmUsMkJBQUksT0FNbkIsQ0FBQTtJQUVELFNBQVMsd0JBQXdCO1FBR2hDLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxRQUFRLEVBQUUsRUFBRSxDQUFFLENBQUM7UUFDcEUsSUFBSSxDQUFDLE1BQU0sRUFDWDtZQUNDLFlBQVksQ0FBQyx1QkFBdUIsQ0FBRSwwQkFBMEIsQ0FBRSxDQUFDO1lBQ25FLE9BQU87U0FDUDtRQUVELE1BQU0sV0FBVyxHQUFHLFlBQVksQ0FBQyxhQUFhLENBQUUsTUFBTSxDQUFFLENBQUM7UUFDekQsTUFBTSxtQkFBbUIsR0FBRyxXQUFXLENBQUMsbUNBQW1DLENBQUUsc0JBQXNCLENBQUMsVUFBVSxFQUFFLEdBQUcsR0FBQyxNQUFNLENBQUUsQ0FBQztRQUU3SCxNQUFNLFFBQVEsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUUsaUJBQWlCLENBQUUsQ0FBQztRQUNoRixNQUFNLGVBQWUsR0FBRyxDQUFFLFdBQVcsR0FBRyxD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