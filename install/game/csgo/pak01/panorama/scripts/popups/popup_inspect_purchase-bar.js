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
        const purchaseItemId = (!storeItemId ? InspectShared.GetPopupSetting('purchase_item_id') : storeItemId);
        if (!InventoryAPI.IsValidItemID(purchaseItemId)) {
            elPurchaseBar.AddClass('hidden');
            return;
        }
        InspectShared.SetPopupSetting('purchase_item_id', purchaseItemId);
        const bFauxItemIdForPurchase = InventoryAPI.IsFauxItemID(purchaseItemId);
        const priceOriginal = bFauxItemIdForPurchase ? ItemInfo.GetStoreOriginalPrice(purchaseItemId, 1) : '';
        const sRestriction = InspectShared.GetPopupSetting('store_item_id') ? '' :
            InventoryAPI.GetDecodeableRestriction(InspectShared.GetPopupSetting('item_id'));
        const showXrayMachineUi = InspectShared.GetPopupSetting("is_xray_machine");
        if ((InspectShared.GetPopupSetting("work_type") === 'delete') ||
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
            return false;
        const strToolType = InventoryAPI.GetToolType(purchaseItemId);
        if (strToolType === 'fantoken')
            return false;
        const defName = InventoryAPI.GetItemDefinitionName(purchaseItemId);
        if (defName === 'casket')
            return false;
        if (defName && defName.startsWith('XpShopTicket'))
            return false;
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
            for (let i = 0; i < qty; i++) {
                purchaseList.push(purchaseItemId);
            }
            const purchaseString = purchaseList.join(',');
            if (itemDefitionNameString && itemDefitionNameString.startsWith('coupon - crate_patch_') &&
                !ItemInfo.FindAnyUserOwnedCharacterItemID()) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfaW5zcGVjdF9wdXJjaGFzZS1iYXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfaW5zcGVjdF9wdXJjaGFzZS1iYXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyw4Q0FBOEM7QUFDOUMsMERBQTBEO0FBRTFELElBQVUsa0JBQWtCLENBOE4zQjtBQTlORCxXQUFVLGtCQUFrQjtJQUUzQixTQUFnQixJQUFJO1FBRW5CLE1BQU0sYUFBYSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSx5QkFBeUIsQ0FBRSxDQUFDO1FBQzdGLGFBQWEsQ0FBQyxxQkFBcUIsQ0FBRSxtQkFBbUIsQ0FBRSxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsVUFBVSxDQUFFLENBQUM7UUFFckcsSUFBSSxhQUFhLENBQUMsZUFBZSxDQUFFLGdCQUFnQixDQUFFLEVBQ3JEO1lBQ0MsYUFBYSxDQUFDLHFCQUFxQixDQUFFLHFCQUFxQixDQUFFLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztZQUM3RSxhQUFhLENBQUMsV0FBVyxDQUFFLFFBQVEsQ0FBRSxDQUFDO1lBQ3RDLE9BQU87U0FDUDtRQUVELE1BQU0sV0FBVyxHQUFHLGFBQWEsQ0FBQyxlQUFlLENBQUUsZUFBZSxDQUFFLENBQUM7UUFLckUsTUFBTSxjQUFjLEdBQUcsQ0FBRSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLGVBQWUsQ0FBRSxrQkFBa0IsQ0FBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQVksQ0FBQztRQUV0SCxJQUFLLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBRSxjQUFjLENBQUUsRUFDbEQ7WUFDQyxhQUFhLENBQUMsUUFBUSxDQUFFLFFBQVEsQ0FBRSxDQUFDO1lBQ25DLE9BQU87U0FDUDtRQUVELGFBQWEsQ0FB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