"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../common/formattext.ts" />
/// <reference path="../common/iteminfo.ts" />
/// <reference path="../generated/items_event_current_generated_store.ts" />
var TooltipSouvenirReceipt;
(function (TooltipSouvenirReceipt) {
    function Init() {
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
    TooltipSouvenirReceipt.Init = Init;
})(TooltipSouvenirReceipt || (TooltipSouvenirReceipt = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbHRpcF9zb3V2ZW5pcl9yZWNlaXB0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvdG9vbHRpcHMvdG9vbHRpcF9zb3V2ZW5pcl9yZWNlaXB0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFDckMsZ0RBQWdEO0FBQ2hELDhDQUE4QztBQUM5Qyw0RUFBNEU7QUFFNUUsSUFBVSxzQkFBc0IsQ0EwRS9CO0FBMUVELFdBQVUsc0JBQXNCO0lBRS9CLFNBQWdCLElBQUk7UUFHbkIsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGtCQUFrQixDQUFFLFFBQVEsRUFBRSxFQUFFLENBQUUsQ0FBQztRQUNwRSxJQUFJLENBQUMsTUFBTSxFQUNYO1lBQ0MsWUFBWSxDQUFDLHVCQUF1QixDQUFFLDBCQUEwQixDQUFFLENBQUM7WUFDbkUsT0FBTztTQUNQO1FBRUQsTUFBTSxRQUFRLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLGlCQUFpQixDQUFFLENBQUM7UUFFaEYsTUFBTSxpQkFBaUIsR0FBRyxZQUFZLENBQUMsd0NBQXdDLENBQUUsU0FBUyxDQUFFLENBQUM7UUFFN0YsSUFBSSxLQUFLLEdBS0gsRUFBRSxDQUFDO1FBQ1QsTUFBTSxTQUFTLEdBQUcsWUFBWSxDQUFDLHVCQUF1QixDQUFFLE1BQU0sQ0FBQyxDQUFDO1FBSWhFLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxPQUFPLENBQUUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLEVBQUUsR0FBSSxJQUFHLEdBQUcsR0FBRyxTQUFTLEVBQUU7WUFBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFBO1NBQUMsQ0FBQSxDQUFDLENBQUMsQ0FBQztRQUVqRyxLQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcs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