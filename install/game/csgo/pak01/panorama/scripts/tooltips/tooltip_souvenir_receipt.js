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
        // Delete unnecessary elements.  
        // Tooltips do not get recreated every time they are shown so we may have to clean up from the last time
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
        const discountCredits = Math.trunc(totalSum * discountAmount / 100); // this is the "70% off" portion
        let discountPrice = totalSum;
        if (discountCredits < totalSum)
            discountPrice -= discountCredits;
        $.GetContextPanel().FindChildInLayoutFile('id-sticker-total-row').SetDialogVariableInt('price', totalSum);
        $.GetContextPanel().FindChildInLayoutFile('id-sticker-discount-price-row').SetDialogVariableInt('price', discountPrice);
        $.GetContextPanel().FindChildInLayoutFile('id-sticker-discount-price-row').SetDialogVariable('currency', StoreAPI.GetStoreItemTokensBundlePrice('' + g_ActiveTournamentInfo.itemid_charge, discountPrice, ''));
        $.GetContextPanel().FindChildInLayoutFile('id-sticker-discount-row').SetDialogVariableInt('discount', InventoryAPI.GetItemSouvenirDiscountPercent(itemId));
        //StoreAPI.GetStoreItemTokensBundlePrice( ''+g_ActiveTournamentInfo.itemid_charge, oSettings.nPurchaseTokens, '' ));
    }
    TooltipSouvenirReceipt.Init = Init;
})(TooltipSouvenirReceipt || (TooltipSouvenirReceipt = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbHRpcF9zb3V2ZW5pcl9yZWNlaXB0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvdG9vbHRpcHMvdG9vbHRpcF9zb3V2ZW5pcl9yZWNlaXB0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFDckMsZ0RBQWdEO0FBQ2hELDhDQUE4QztBQUM5Qyw0RUFBNEU7QUFFNUUsSUFBVSxzQkFBc0IsQ0EwRS9CO0FBMUVELFdBQVUsc0JBQXNCO0lBRS9CLFNBQWdCLElBQUk7UUFHbkIsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGtCQUFrQixDQUFFLFFBQVEsRUFBRSxFQUFFLENBQUUsQ0FBQztRQUNwRSxJQUFJLENBQUMsTUFBTSxFQUNYO1lBQ0MsWUFBWSxDQUFDLHVCQUF1QixDQUFFLDBCQUEwQixDQUFFLENBQUM7WUFDbkUsT0FBTztTQUNQO1FBRUQsTUFBTSxRQUFRLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLGlCQUFpQixDQUFFLENBQUM7UUFFaEYsTUFBTSxpQkFBaUIsR0FBRyxZQUFZLENBQUMsd0NBQXdDLENBQUUsU0FBUyxDQUFFLENBQUM7UUFFN0YsSUFBSSxLQUFLLEdBS0gsRUFBRSxDQUFDO1FBQ1QsTUFBTSxTQUFTLEdBQUcsWUFBWSxDQUFDLHVCQUF1QixDQUFFLE1BQU0sQ0FBQyxDQUFDO1FBRWhFLGlDQUFpQztRQUNqQyx3R0FBd0c7UUFDeEcsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDLE9BQU8sQ0FBRSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsRUFBRSxHQUFJLElBQUcsR0FBRyxHQUFHLFNBQVMsRUFBRTtZQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUE7U0FBQyxDQUFBLENBQUMsQ0FBQyxDQUFDO1FBRWpHLEtBQU0sSUFBSSxDQUFD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