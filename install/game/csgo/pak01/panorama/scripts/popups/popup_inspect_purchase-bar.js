"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../common/iteminfo.ts" />
/// <reference path="../popups/popup_inspect_shared.ts" />
var InspectPurchaseBar;
(function (InspectPurchaseBar) {
    let _m_schfnMusicMvpPreviewEnd = null;
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
        _SetUpPlayMvpBtn(elPurchaseBar, $.GetContextPanel());
    }
    InspectPurchaseBar.Init = Init;
    function _SetUpPlayMvpBtn(elPurchaseBar, contextPanel) {
        const itemId = InspectShared.GetPopupSetting('item_id', contextPanel);
        const elMusicBtn = elPurchaseBar.FindChildInLayoutFile('InspectPlayMvpBtn');
        elMusicBtn.SetPanelEvent('onactivate', () => _InspectPlayMusic('mvp', contextPanel));
        const bIsMusicKit = (InventoryAPI.GetLoadoutCategory(itemId) === 'musickit');
        elMusicBtn.SetHasClass('hidden', !bIsMusicKit || (InventoryAPI.GetItemRarity(itemId) <= 0));
    }
    function _InspectPlayMusic(type, contextPanel) {
        if (!contextPanel.IsValid())
            return;
        const itemId = InspectShared.GetPopupSetting('item_id', contextPanel);
        if (type === 'mvp') {
            if (_m_schfnMusicMvpPreviewEnd)
                return;
            InventoryAPI.StopItemPreviewMusic();
            InventoryAPI.PlayItemPreviewMusic(itemId, 'MVPPreview');
            _m_schfnMusicMvpPreviewEnd = $.Schedule(6.8, () => _InspectPlayMusic('schfn', contextPanel));
        }
        else if (type === 'schfn') {
            _m_schfnMusicMvpPreviewEnd = null;
            InventoryAPI.StopItemPreviewMusic();
            InventoryAPI.PlayItemPreviewMusic(itemId, '');
        }
    }
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
        if (_m_schfnMusicMvpPreviewEnd) {
            $.CancelScheduled(_m_schfnMusicMvpPreviewEnd);
            _m_schfnMusicMvpPreviewEnd = null;
        }
        $.DispatchEvent('HideSelectItemForCapabilityPopup');
        $.DispatchEvent('UIPopupButtonClicked', '');
        $.DispatchEvent('CapabilityPopupIsOpen', false);
    }
    InspectPurchaseBar.ClosePopup = ClosePopup;
})(InspectPurchaseBar || (InspectPurchaseBar = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfaW5zcGVjdF9wdXJjaGFzZS1iYXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfaW5zcGVjdF9wdXJjaGFzZS1iYXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyw4Q0FBOEM7QUFDOUMsMERBQTBEO0FBRTFELElBQVUsa0JBQWtCLENBNlEzQjtBQTdRRCxXQUFVLGtCQUFrQjtJQUUzQixJQUFJLDBCQUEwQixHQUFrQixJQUFJLENBQUM7SUFFckQsU0FBZ0IsSUFBSTtRQUVuQixNQUFNLGFBQWEsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUUseUJBQXlCLENBQUUsQ0FBQztRQUM3RixhQUFhLENBQUMscUJBQXFCLENBQUUsbUJBQW1CLENBQUUsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLFVBQVUsQ0FBRSxDQUFDO1FBRXJHLElBQUksYUFBYSxDQUFDLGVBQWUsQ0FBRSxnQkFBZ0IsQ0FBRSxFQUNyRDtZQUNDLGFBQWEsQ0FBQyxxQkFBcUIsQ0FBRSxxQkFBcUIsQ0FBRSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7WUFDN0UsYUFBYSxDQUFDLFdBQVcsQ0FBRSxRQUFRLENBQUUsQ0FBQztZQUN0QyxPQUFPO1NBQ1A7UUFFRCxNQUFNLFdBQVcsR0FBRyxhQUFhLENBQUMsZUFBZSxDQUFFLGVBQWUsQ0FBRSxDQUFDO1FBS3JFLE1BQU0sY0FBYyxHQUFHLENBQUUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxlQUFlLENBQUUsa0JBQWtCLENBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFZLENBQUM7UUFFdEgsSUFBSyxDQUFDLFlBQVksQ0FBQyxhQUFhLENBQUUsY0FBYyxDQUFFLEVBQ2xEO1lBQ0MsYUFBYSxDQUFDLFFBQVEsQ0FBRSxRQUFRLENBQUUsQ0FBQztZQUNuQyxPQUFPO1NBQ1A7UUFFRCxhQUFhLENBQUMsZUFBZSxDQUFFLGtCQUFrQixFQUFFLGNBQWMsQ0FBRSxDQUFDO1FBR3BFLE1BQU0sc0JBQXNCLEdBQUcsWUFBWSxDQUFDLFlBQVksQ0FBRSxjQUFjLENBQUUsQ0FBQztRQUMzRSxNQUFNLGFBQWEsR0FBRyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLHFCQUFxQixDQUFFLGNBQWMsRUFBRSxDQUFDLENBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQ3hHLE1BQU0sWUFBWSxHQUFHLGFBQWEsQ0FBQyxlQUFlLENBQUUsZUFBZSxDQUFZLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3JGLFlBQVksQ0FBQyx3QkFBd0IsQ0FBRSxhQUFhLENBQUMsZUFBZSxDQUFFLFNBQVMsQ0FBWSxDQUFFLENBQUM7UUFPL0YsTUFBTSxpQkFBaUIsR0FBRyxhQUFhLENBQUMsZUFBZSxDQUFFLGlCQUFpQixDQUFhLENBQUM7UUFDeEYsSUFBSyxDQUFFLGFBQWEsQ0FBQyxlQUFlLENBQUUsV0FBVyxDQUFFLEtBQUssUUFBUSxDQUFFO1lBQ2pFLENBQUUsYUFBYSxDQUFDLGVBQWUsQ0FBRSxjQUFjLENBQUUsS0FBSyxJQUFJLENBQUU7WUFDNUQsQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFFLGNBQWMsQ0FBQztZQUM1QyxDQUFDLGFBQWE7WUFDZCxZQUFZLEtBQUssTUFBTSxJQUFJLENBQUMsaUJBQWlCO1lBQzdDLFlBQVksS0FBSyxZQUFZLElBQUksQ0FBQyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsd0JBQXdCLEVBRXRGO1lBQ0MsYUFBYSxDQUFDLFFBQVEsQ0FBRSxRQUFRLENBQUUsQ0FBQztZQUNuQyxPQUFPO1NBQ1A7UUFFRCxhQUFhLENBQUMsV0FBVyxDQUFFLFFBQVEsQ0FBRSxDQUFDO1FBRXRDLGlCQUFpQixDQUFFLGFBQWEsRUFBRSxhQUFhLENBQUMsZUFBZSxDQUFFLFNBQVMsQ0FBWSxDQUFFLENBQUM7UUFDekYsYUFBYSxDQUFDLGlCQUFpQixDQUFFLFVBQVUsRUFBRSxZQUFZLENBQUMsV0FBVyxDQUFFLGNBQWMsQ0FBQyxDQUFFLENBQUM7UUFFekYsTUFBTSxVQUFVLEdBQUksYUFBYSxDQUFDLGVBQWUsQ0FBRSxZQUFZLENBQUUsQ0FBQyxDQUFDLENBQUMsaUNBQWlDLENBQUMsQ0FBQyxDQUFDLDBCQUEwQixDQUFDO1FBQ25JLGdCQUFnQixDQUFFLGFBQWEsRUFBRSxXQUFxQixFQUFHLFVBQVUsQ0FBRSxDQUFDO1FBQ3RFLGlCQUFpQixDQUFFLGFBQWEsQ0FBRSxDQUFDO1FBQ25DLG9CQUFvQixDQUFFLGFBQWEsRUFBRSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUUsQ0FBQztRQUMzRCxvQkFBb0IsQ0FBRSxhQUFhLEVBQUUsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUM7UUFDMUQsZ0JBQWdCLENBQUUsYUFBYSxFQUFFLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBRSxDQUFDO0lBQ3hELENBQUM7SUE5RGUsdUJBQUksT0E4RG5CLENBQUE7SUFFRCxTQUFTLGdCQUFnQixDQUFFLGFBQXNCLEVBQUUsWUFBcUI7UUFFdkUsTUFBTSxNQUFNLEdBQUcsYUFBYSxDQUFDLGVBQWUsQ0FBRSxTQUFTLEVBQUUsWUFBWSxDQUFZLENBQUM7UUFDbEYsTUFBTSxVQUFVLEdBQUcsYUFBYSxDQUFDLHFCQUFxQixDQUFFLG1CQUFtQixDQUFFLENBQUM7UUFDOUUsVUFBVSxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLENBQUMsaUJBQWlCLENBQUUsS0FBSyxFQUFFLFlBQVksQ0FBRSxDQUFFLENBQUM7UUFHekYsTUFBTSxXQUFXLEdBQUcsQ0FBRSxZQUFZLENBQUMsa0JBQWtCLENBQUUsTUFBTSxDQUFFLEtBQUssVUFBVSxDQUFFLENBQUM7UUFDakYsVUFBVSxDQUFDLFdBQVcsQ0FBRSxRQUFRLEVBQUUsQ0FBQyxXQUFXLElBQUksQ0FBRSxZQUFZLENBQUMsYUFBYSxDQUFFLE1BQU0sQ0FBRSxJQUFJLENBQUMsQ0FBRSxDQUFFLENBQUM7SUFDbkcsQ0FBQztJQUVELFNBQVMsaUJBQWlCLENBQUUsSUFBcUIsRUFBRSxZQUFxQjtRQUd2RSxJQUFLLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRTtZQUMzQixPQUFPO1FBRVIsTUFBTSxNQUFNLEdBQUcsYUFBYSxDQUFDLGVBQWUsQ0FBRSxTQUFTLEVBQUUsWUFBWSxDQUFZLENBQUM7UUFFbEYsSUFBSyxJQUFJLEtBQUssS0FBSyxFQUNuQjtZQUNDLElBQUssMEJBQTBCO2dCQUM5QixPQUFPO1lBRVIsWUFBWSxDQUFDLG9CQUFvQixFQUFFLENBQUM7WUFDcEMsWUFBWSxDQUFDLG9CQUFvQixDQUFFLE1BQU0sRUFBRSxZQUFZLENBQUUsQ0FBQztZQUcxRCwwQkFBMEIsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBRSxPQUFPLEVBQUUsWUFBWSxDQUFFLENBQUUsQ0FBQztTQUNqRzthQUNJLElBQUssSUFBSSxLQUFLLE9BQU8sRUFDMUI7WUFDQywwQkFBMEIsR0FBRyxJQUFJLENBQUM7WUFDbEMsWUFBWSxDQUFDLG9CQUFvQixFQUFFLENBQUM7WUFDcEMsWUFBWSxDQUFDLG9CQUFvQixDQUFFLE1BQU0sRUFBRSxFQUFFLENBQUUsQ0FBQztTQUNoRDtJQUNGLENBQUM7SUFFRCxTQUFTLGlCQUFpQixDQUFFLE9BQWdCLEVBQUUsTUFBYztRQUUzRCxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMscUJBQXFCLENBQUUsbUJBQW1CLENBQWlCLENBQUM7UUFDcEYsTUFBTSxpQkFBaUIsR0FBRyxhQUFhLENBQUMsZUFBZSxDQUFFLGlCQUFpQixDQUFhLENBQUM7UUFDeEYsT0FBTyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDeEIsT0FBTyxDQUFDLFdBQVcsQ0FBRSx3QkFBd0IsRUFBRSxpQkFBaUIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxlQUFlLENBQUUscUJBQXFCLENBQUUsQ0FBRSxDQUFDO0lBQy9ILENBQUM7SUFFRCxTQUFTLGdCQUFnQixDQUFFLE9BQWdCLEVBQUUsV0FBbUIsRUFBRSxVQUFrQjtRQUVuRixNQUFNLE1BQU0sR0FBRyxPQUFRLENBQUMscUJBQXFCLENBQUUsa0JBQWtCLENBQWEsQ0FBQztRQUMvRSxNQUFNLGlCQUFpQixHQUFHLGFBQWEsQ0FBQyxlQUFlLENBQUUsaUJBQWlCLENBQWEsQ0FBQztRQUN4RixJQUFLLGlCQUFpQixFQUN0QjtZQUNDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBRSxXQUFXLEVBQUUsUUFBUSxDQUFDLGlCQUFpQixDQUFFLGFBQWEsQ0FBQyxlQUFlLENBQUUsa0JBQWtCLENBQVksRUFBRSxDQUFDLENBQUUsQ0FBRSxDQUFDO1lBQ3pJLE1BQU0sQ0FBQyxJQUFJLEdBQUcsK0JBQStCLENBQUM7U0FDOUM7YUFDSSxJQUFLLENBQUMsV0FBVyxJQUFJLENBQUMsYUFBYSxDQUFDLGVBQWUsQ0FBRSxTQUFTLENBQUUsRUFDckU7WUFDQyxNQUFNLENBQUMsSUFBSSxHQUFHLFVBQVUsQ0FBQztTQUN6QjthQUVEO1lBQ0MsTUFBTSxDQUFDLElBQUksR0FBRyx1QkFBdUIsQ0FBQztTQUN0QztRQUVELE1BQU0saUJBQWlCLEdBQUcsYUFBYSxDQUFDLGVBQWUsQ0FBRSxxQkFBcUIsQ0FBYSxDQUFBO1FBQzNGLE1BQU0sQ0FBQyxXQUFXLENBQUUsd0JBQXdCLEVBQUUsaUJBQWlCLElBQUksQ0FBQyxpQkFBaUIsQ0FBRSxDQUFDO0lBQ3pGLENBQUM7SUFFRCxTQUFTLG9CQUFvQixDQUFFLGFBQXNCLEVBQUUsWUFBcUI7UUFFM0UsSUFBSyxDQUFDLGFBQWEsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUU7WUFDOUMsT0FBTztRQUVSLE1BQU0sS0FBSyxHQUFHLGFBQWEsQ0FBQyxxQkFBcUIsQ0FBRSxhQUFhLENBQWtCLENBQUM7UUFDbkYsTUFBTSxVQUFVLEdBQUcsYUFBYSxDQUFDLHFCQUFxQixDQUFFLHVCQUF1QixDQUFnQixDQUFDO1FBQ2hHLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQztRQUNaLE1BQU0saUJBQWlCLEdBQUcsYUFBYSxDQUFDLGVBQWUsQ0FBRSxpQkFBaUIsRUFBRSxZQUFZLENBQWEsQ0FBQztRQUN0RyxNQUFNLHdCQUF3QixHQUFHLENBQUMsaUJBQWlCLElBQUksNEJBQTRCLENBQUUsWUFBWSxDQUFFLENBQUM7UUFDcEcsVUFBVSxDQUFDLE9BQU8sR0FBRyx3QkFBd0IsQ0FBQztRQUM5QyxJQUFJLHdCQUF3QixFQUM1QjtZQUNDLEdBQUcsR0FBRyxNQUFNLENBQUUsVUFBVSxDQUFDLFdBQVcsRUFBRSxDQUFDLEVBQUUsQ0FBRSxDQUFDO1NBQzVDO1FBRUQsTUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLGlCQUFpQixDQUFFLGFBQWEsQ0FBQyxlQUFlLENBQUUsa0JBQWtCLEVBQUMsWUFBWSxDQUFZLEVBQUUsR0FBRyxDQUFFLENBQUM7UUFDaEksS0FBSyxDQUFDLElBQUksR0FBRyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsZ0NBQWdDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztRQUU5RSxnQkFBZ0IsQ0FBRSxhQUFhLEVBQUUsR0FBRyxFQUFFLFlBQVksQ0FBRSxDQUFDO0lBQ3RELENBQUM7SUFFRCxTQUFTLDRCQUE0QixDQUFFLFlBQXFCO1FBRTNELE1BQU0sd0JBQXdCLEdBQUcsYUFBYSxDQUFDLGVBQWUsQ0FBRSx5QkFBeUIsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUN6RyxNQUFNLGNBQWMsR0FBRyxhQUFhLENBQUMsZUFBZSxDQUFFLGtCQUFrQixFQUFFLFlBQVksQ0FBWSxDQUFDO1FBRW5HLElBQUssd0JBQXdCO1lBQzVCLE9BQU8sQ0FBRSx3QkFBd0IsQ0FBRSxDQUFDO1FBQ3JDLE1BQU0sUUFBUSxHQUFHLFlBQVksQ0FBQyxxQkFBcUIsQ0FBRSxjQUFjLEVBQUUsZUFBZSxDQUFFLENBQUM7UUFDdkYsSUFBSyxRQUFRO1lBQ1osT0FBTyxLQUFLLENBQUM7UUFFZCxNQUFNLFdBQVcsR0FBRyxZQUFZLENBQUMsV0FBVyxDQUFFLGNBQWMsQ0FBRSxDQUFDO1FBQy9ELElBQUssV0FBVyxLQUFLLFVBQVU7WUFDOUIsT0FBTyxLQUFLLENBQUM7UUFFZCxNQUFNLE9BQU8sR0FBRyxZQUFZLENBQUMscUJBQXFCLENBQUUsY0FBYyxDQUFFLENBQUM7UUFDckUsSUFBSyxPQUFPLEtBQUssUUFBUTtZQUN4QixPQUFPLEtBQUssQ0FBQztRQUNkLElBQUssT0FBTyxJQUFJLE9BQU8sQ0FBQyxVQUFVLENBQUUsY0FBYyxDQUFFO1lBQ25ELE9BQU8sS0FBSyxDQUFDO1FBRWQsT0FBTyxJQUFJLENBQUM7SUFDYixDQUFDO0lBRUQsU0FBUyxpQkFBaUIsQ0FBRSxhQUFzQjtRQUVqRCxNQUFNLGlCQUFpQixHQUFHLGFBQWEsQ0FBQyxlQUFlLENBQUUscUJBQXFCLENBQWEsQ0FBQztRQUM1RixNQUFNLGlCQUFpQixHQUFHLGFBQWEsQ0FBQyxlQUFlLENBQUUsaUJBQWlCLENBQWMsQ0FBQztRQUN6RixNQUFNLGNBQWMsR0FBRyxhQUFhLENBQUMsZUFBZSxDQUFFLGtCQUFrQixDQUFZLENBQUM7UUFDckYsTUFBTSxVQUFVLEdBQUcsYUFBYyxDQUFDLHFCQUFxQixDQUFFLHVCQUF1QixDQUFnQixDQUFDO1FBRWpHLGFBQWEsQ0FBQyxxQkFBcUIsQ0FBRSxhQUFhLENBQUUsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxpQkFBaUIsSUFBSSxDQUFFLGlCQUFpQixJQUFJLGlCQUFpQixDQUFFLENBQUM7UUFDaEksYUFBYSxDQUFDLHFCQUFxQixDQUFFLGFBQWEsQ0FBRSxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsR0FBRSxFQUFFO1lBQ3JGLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBRSxVQUFVLENBQUMsV0FBVyxFQUFFLENBQUMsRUFBRSxDQUFFLENBQUM7WUFDbEQsTUFBTSxzQkFBc0IsR0FBRyxZQUFZLENBQUMscUJBQXFCLENBQUUsY0FBYyxDQUFFLENBQUM7WUFDcEYsTUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFDO1lBR3hCLEtBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQzdCO2dCQUNDLFlBQVksQ0FBQyxJQUFJLENBQUUsY0FBYyxDQUFFLENBQUM7YUFDcEM7WUFFRCxNQUFNLGNBQWMsR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFFLEdBQUcsQ0FBRSxDQUFDO1lBQ2hELElBQUssc0JBQXNCLElBQUksc0JBQXNCLENBQUMsVUFBVSxDQUFFLHVCQUF1QixDQUFFO2dCQUMxRixDQUFFLFFBQVEsQ0FBQywrQkFBK0IsRUFBRSxFQUM3QztnQkFDQyxZQUFZLENBQUMscUJBQXFCLENBQ2pDLENBQUMsQ0FBQyxRQUFRLENBQUUsMkJBQTJCLENBQUUsRUFDekMsQ0FBQyxDQUFDLFFBQVEsQ0FBRSw2QkFBNkIsQ0FBRSxFQUMzQyxFQUFFLEVBQ0YsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFFLGNBQWMsQ0FBRSxFQUNsRCxHQUFHLEVBQUUsR0FBRSxDQUFDLENBQ1IsQ0FBQzthQUNGO2lCQUVEO2dCQUNDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBRSxjQUFjLENBQUUsQ0FBQzthQUM3QztZQUNELENBQUMsQ0FBQyxhQUFhLENBQUMscUJBQXFCLEVBQUUsNkJBQTZCLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDaEYsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDO0lBRUQsU0FBUyxnQkFBZ0IsQ0FBRSxhQUFzQixFQUFFLEdBQVUsRUFBRSxZQUFxQjtRQUVuRixNQUFNLGNBQWMsR0FBRyxhQUFhLENBQUMsZUFBZSxDQUFFLGtCQUFrQixFQUFFLFlBQVksQ0FBWSxDQUFDO1FBQ25HLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBRSxjQUFjLEVBQUUsR0FBRyxDQUFFLENBQUE7UUFFbkUsTUFBTSxXQUFXLEdBQUcsYUFBYyxDQUFDLHFCQUFxQixDQUFFLG1CQUFtQixDQUFhLENBQUM7UUFDM0YsTUFBTSxhQUFhLEdBQUcsYUFBYyxDQUFDLHFCQUFxQixDQUFFLHFCQUFxQixDQUFhLENBQUM7UUFDL0YsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLDRCQUE0QixDQUFFLGNBQWMsQ0FBRSxDQUFDO1FBRTVFLElBQUksV0FBVyxFQUNmO1lBQ0MsV0FBVyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDM0IsV0FBVyxDQUFDLElBQUksR0FBRyxLQUFLLENBQUM7WUFFekIsYUFBYSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDN0IsYUFBYSxDQUFDLElBQUksR0FBRyxXQUFXLENBQUM7WUFDakMsT0FBTztTQUNQO1FBRUQsV0FBVyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7UUFDNUIsYUFBYSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7SUFDL0IsQ0FBQztJQUVELFNBQVMsb0JBQW9CLENBQUUsYUFBc0IsRUFBRSxZQUFxQjtRQUUzRSxhQUFhLENBQUMscUJBQXFCLENBQUUsdUJBQXVCLENBQUUsQ0FBQyxhQUFhLENBQUUsZUFBZSxFQUFFLEdBQUcsRUFBRSxDQUFDLGlCQUFpQixDQUFFLGFBQWEsRUFBRSxZQUFZLENBQUUsQ0FBRSxDQUFDO0lBQ3pKLENBQUM7SUFFRCxTQUFTLGlCQUFpQixDQUFFLGFBQXNCLEVBQUUsWUFBcUI7UUFFeEUsb0JBQW9CLENBQUUsYUFBYSxFQUFFLFlBQVksQ0FBRSxDQUFDO0lBQ3JELENBQUM7SUFHRCxTQUFnQixVQUFVO1FBRXpCLFlBQVksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1FBRXBDLElBQUssMEJBQTBCLEVBQy9CO1lBQ0MsQ0FBQyxDQUFDLGVBQWUsQ0FBRSwwQkFBMEIsQ0FBRSxDQUFDO1lBQ2hELDBCQUEwQixHQUFHLElBQUksQ0FBQztTQUNsQztRQUVELENBQUMsQ0FBQyxhQUFhLENBQUUsa0NBQWtDLENBQUUsQ0FBQztRQUN0RCxDQUFDLENBQUMsYUFBYSxDQUFFLHNCQUFzQixFQUFFLEVBQUUsQ0FBRSxDQUFDO1FBQzlDLENBQUMsQ0FBQyxhQUFhLENBQUUsdUJBQXVCLEVBQUUsS0FBSyxDQUFFLENBQUM7SUFDbkQsQ0FBQztJQWJlLDZCQUFVLGFBYXpCLENBQUE7QUFDRixDQUFDLEVBN1FTLGtCQUFrQixLQUFsQixrQkFBa0IsUUE2UTNCIn0=