"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../common/iteminfo.ts" />
/// <reference path="../popups/popup_inspect_shared.ts" />
var InspectPurchaseBar;
(function (InspectPurchaseBar) {
    function Init() {
        const elPurchaseBar = $.GetContextPanel().FindChildInLayoutFile('PopUpInspectPurchaseBar');
        elPurchaseBar.FindChildInLayoutFile('id-popup-purchase').SetPanelEvent('onactivate', ClosePopup);
        if (InspectShared.GetPopupSetting('only_close_btn')) {
            elPurchaseBar.FindChildInLayoutFile('id-purchase-section').visible = false;
            elPurchaseBar.RemoveClass('hidden');
            return;
        }
        const storeItemId = InspectShared.GetPopupSetting("store_item_id");
        // If you have a store id that overrides the purchase id.
        // We specifically want to buy the store id.
        // we store it on the bar since its only used here
        const purchaseItemId = (!storeItemId ? InspectShared.GetPopupSetting('purchase_item_id') : storeItemId);
        if (!InventoryAPI.IsValidItemID(purchaseItemId)) {
            elPurchaseBar.AddClass('hidden');
            return;
        }
        InspectShared.SetPopupSetting('purchase_item_id', purchaseItemId);
        // Can this item be purchased?
        const bFauxItemIdForPurchase = InventoryAPI.IsFauxItemID(purchaseItemId);
        const priceOriginal = bFauxItemIdForPurchase ? ItemInfo.GetStoreOriginalPrice(purchaseItemId, 1) : '';
        const sRestriction = InspectShared.GetPopupSetting('store_item_id') ? '' :
            InventoryAPI.GetDecodeableRestriction(InspectShared.GetPopupSetting('item_id'));
        $.Msg("Purchase Bar: Store item id = " + storeItemId);
        $.Msg("Purchase Bar: Show item id = " + purchaseItemId + (bFauxItemIdForPurchase ? " (faux itemid for purchase)" : ""));
        $.Msg("Purchase Bar: Original price = " + priceOriginal);
        $.Msg("Purchase Bar: Purchase item id = " + InventoryAPI.IsValidItemID(purchaseItemId));
        const showXrayMachineUi = InspectShared.GetPopupSetting("is_xray_machine");
        if ((InspectShared.GetPopupSetting("work_type") === 'delete') || // never show purchase bar for DELETE action
            (InspectShared.GetPopupSetting('inspect_only') === true) ||
            !InventoryAPI.IsValidItemID(purchaseItemId) ||
            !priceOriginal ||
            sRestriction === 'xray' && !showXrayMachineUi ||
            sRestriction === 'restricted' && !$.GetContextPanel().Data().existingRewardFromXrayId) {
            elPurchaseBar.AddClass('hidden');
            return;
        }
        elPurchaseBar.RemoveClass('hidden');
        _SetPurchaseImage(elPurchaseBar, InspectShared.GetPopupSetting('item_id'));
        elPurchaseBar.SetDialogVariable("itemname", InventoryAPI.GetItemName(purchaseItemId));
        const descString = InspectShared.GetPopupSetting('allow_rent') ? '#popup_capability_upsell_rental' : '#popup_capability_upsell';
        _UpdateDecString(elPurchaseBar, storeItemId, descString);
        _SetUpPurchaseBtn(elPurchaseBar);
        _SetUpDropdownAction(elPurchaseBar, $.GetContextPanel());
        _UpdatePurchasePrice(elPurchaseBar, $.GetContextPanel());
    }
    InspectPurchaseBar.Init = Init;
    function _SetPurchaseImage(elPanel, itemId) {
        const elImage = elPanel.FindChildInLayoutFile('PurchaseItemImage');
        const showXrayMachineUi = InspectShared.GetPopupSetting("is_xray_machine");
        elImage.itemid = itemId;
        elImage.SetHasClass('popup-capability-faded', showXrayMachineUi && !InspectShared.GetPopupSetting('allow_xray_purchase'));
    }
    function _UpdateDecString(elPanel, storeItemId, descString) {
        const elDesc = elPanel.FindChildInLayoutFile('PurchaseItemName');
        const showXrayMachineUi = InspectShared.GetPopupSetting("is_xray_machine");
        if (showXrayMachineUi) {
            elPanel.SetDialogVariable("itemprice", ItemInfo.GetStoreSalePrice(InspectShared.GetPopupSetting('purchase_item_id'), 1));
            elDesc.text = "#popup_capability_upsell_xray";
        }
        else if (!storeItemId && !InspectShared.GetPopupSetting('tool_id')) {
            elDesc.text = descString;
        }
        else {
            elDesc.text = "#popup_capability_use";
        }
        const allowXrayPurchase = InspectShared.GetPopupSetting('allow_xray_purchase');
        elDesc.SetHasClass('popup-capability-faded', showXrayMachineUi && !allowXrayPurchase);
    }
    function _UpdatePurchasePrice(elPurchaseBar, contextPanel) {
        if (!elPurchaseBar || !elPurchaseBar.IsValid())
            return;
        const elBtn = elPurchaseBar.FindChildInLayoutFile('PurchaseBtn');
        const elDropdown = elPurchaseBar.FindChildInLayoutFile('PurchaseCountDropdown');
        let qty = 1;
        const showXrayMachineUi = InspectShared.GetPopupSetting("is_xray_machine", contextPanel);
        const bCanShowQuantityDropdown = !showXrayMachineUi && _isAllowedToPurchaseMultiple(contextPanel);
        elDropdown.visible = bCanShowQuantityDropdown;
        if (bCanShowQuantityDropdown) {
            qty = Number(elDropdown.GetSelected().id);
        }
        const salePrice = ItemInfo.GetStoreSalePrice(InspectShared.GetPopupSetting('purchase_item_id', contextPanel), qty);
        elBtn.text = showXrayMachineUi ? '#popup_totool_purchase_header2' : salePrice;
        _UpdateSalePrice(elPurchaseBar, qty, contextPanel);
    }
    function _isAllowedToPurchaseMultiple(contextPanel) {
        const OverridePurchaseMultiple = InspectShared.GetPopupSetting("override_purchase_limit", contextPanel);
        const purchaseItemId = InspectShared.GetPopupSetting('purchase_item_id', contextPanel);
        if (OverridePurchaseMultiple)
            return (OverridePurchaseMultiple);
        const attValue = InventoryAPI.GetItemAttributeValue(purchaseItemId, 'season access');
        if (attValue)
            return false; // this is a season pass or operation ticket, user only needs one
        const strToolType = InventoryAPI.GetToolType(purchaseItemId);
        if (strToolType === 'fantoken')
            return false; // this is a tournament viewer pass/coin
        const defName = InventoryAPI.GetItemDefinitionName(purchaseItemId);
        if (defName === 'casket')
            return false; // surplus vaults are large containers of items, users need just one at a time
        if (defName && defName.startsWith('XpShopTicket'))
            return false; // Xp Shop tickets are purchased and activated one-by-one
        return true;
    }
    function _SetUpPurchaseBtn(elPurchaseBar) {
        const allowXrayPurchase = InspectShared.GetPopupSetting('allow_xray_purchase');
        const showXrayMachineUi = InspectShared.GetPopupSetting("is_xray_machine");
        const purchaseItemId = InspectShared.GetPopupSetting('purchase_item_id');
        const elDropdown = elPurchaseBar.FindChildInLayoutFile('PurchaseCountDropdown');
        elPurchaseBar.FindChildInLayoutFile('PurchaseBtn').enabled = !showXrayMachineUi || (showXrayMachineUi && allowXrayPurchase);
        elPurchaseBar.FindChildInLayoutFile('PurchaseBtn').SetPanelEvent('onactivate', () => {
            const qty = Number(elDropdown.GetSelected().id);
            const itemDefitionNameString = InventoryAPI.GetItemDefinitionName(purchaseItemId);
            const purchaseList = [];
            $.Msg('Purchase activate for ItemID=' + purchaseItemId + " , name=" + itemDefitionNameString);
            for (let i = 0; i < qty; i++) {
                purchaseList.push(purchaseItemId);
            }
            const purchaseString = purchaseList.join(',');
            if (itemDefitionNameString && itemDefitionNameString.startsWith('coupon - crate_patch_') &&
                !ItemInfo.FindAnyUserOwnedCharacterItemID()) { // Warn about purchasing coupons for crates containing patches if user doesn't own an agent
                UiToolkitAPI.ShowGenericPopupYesNo($.Localize('#CSGO_Patch_NoAgent_Title'), $.Localize('#CSGO_Patch_NoAgent_Message'), '', () => StoreAPI.StoreItemPurchase(purchaseString), () => { });
            }
            else {
                StoreAPI.StoreItemPurchase(purchaseString);
            }
            $.DispatchEvent("CSGOPlaySoundEffect", "UIPanorama.buymenu_purchase", "MOUSE");
        });
    }
    function _UpdateSalePrice(elPurchaseBar, qty, contextPanel) {
        const purchaseItemId = InspectShared.GetPopupSetting('purchase_item_id', contextPanel);
        const price = ItemInfo.GetStoreOriginalPrice(purchaseItemId, qty);
        const elSalePrice = elPurchaseBar.FindChildInLayoutFile('PurchaseSalePrice');
        const elSalePercent = elPurchaseBar.FindChildInLayoutFile('PurchaseItemPercent');
        const salePercent = StoreAPI.GetStoreItemPercentReduction(purchaseItemId);
        if (salePercent) {
            elSalePrice.visible = true;
            elSalePrice.text = price;
            elSalePercent.visible = true;
            elSalePercent.text = salePercent;
            return;
        }
        elSalePrice.visible = false;
        elSalePercent.visible = false;
    }
    function _SetUpDropdownAction(elPurchaseBar, contextPanel) {
        elPurchaseBar.FindChildInLayoutFile('PurchaseCountDropdown').SetPanelEvent('oninputsubmit', () => _OnDropdownUpdate(elPurchaseBar, contextPanel));
    }
    function _OnDropdownUpdate(elPurchaseBar, contextPanel) {
        _UpdatePurchasePrice(elPurchaseBar, contextPanel);
    }
    function ClosePopup() {
        InventoryAPI.StopItemPreviewMusic();
        $.DispatchEvent('HideSelectItemForCapabilityPopup');
        $.DispatchEvent('UIPopupButtonClicked', '');
        $.DispatchEvent('CapabilityPopupIsOpen', false);
    }
    InspectPurchaseBar.ClosePopup = ClosePopup;
})(InspectPurchaseBar || (InspectPurchaseBar = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfaW5zcGVjdF9wdXJjaGFzZS1iYXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfaW5zcGVjdF9wdXJjaGFzZS1iYXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyw4Q0FBOEM7QUFDOUMsMERBQTBEO0FBRTFELElBQVUsa0JBQWtCLENBOE4zQjtBQTlORCxXQUFVLGtCQUFrQjtJQUUzQixTQUFnQixJQUFJO1FBRW5CLE1BQU0sYUFBYSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSx5QkFBeUIsQ0FBRSxDQUFDO1FBQzdGLGFBQWEsQ0FBQyxxQkFBcUIsQ0FBRSxtQkFBbUIsQ0FBRSxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsVUFBVSxDQUFFLENBQUM7UUFFckcsSUFBSSxhQUFhLENBQUMsZUFBZSxDQUFFLGdCQUFnQixDQUFFLEVBQ3JEO1lBQ0MsYUFBYSxDQUFDLHFCQUFxQixDQUFFLHFCQUFxQixDQUFFLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztZQUM3RSxhQUFhLENBQUMsV0FBVyxDQUFFLFFBQVEsQ0FBRSxDQUFDO1lBQ3RDLE9BQU87U0FDUDtRQUVELE1BQU0sV0FBVyxHQUFHLGFBQWEsQ0FBQyxlQUFlLENBQUUsZUFBZSxDQUFFLENBQUM7UUFFckUseURBQXlEO1FBQ3pELDRDQUE0QztRQUM1QyxrREFBa0Q7UUFDbEQsTUFBTSxjQUFjLEdBQUcsQ0FBRSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLGVBQWUsQ0FBRSxrQkFBa0IsQ0FBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQVksQ0FBQztRQUV0SCxJQUFLLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBRSxjQUFjLENBQUUsRUFDbEQ7WUFDQyxhQUFhLENBQUMsUUFBUSxDQUFFLFFBQVEs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