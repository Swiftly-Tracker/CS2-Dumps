"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../common/iteminfo.ts" />
/// <reference path="popup_acknowledge_item.ts" />
/// <reference path="popup_capability_decodable.ts" />
/// <reference path="popup_inspect_shared.ts" />
var InspectRentalBar;
(function (InspectRentalBar) {
    function Init() {
        const elRentalBar = $.GetContextPanel().FindChildInLayoutFile('PopUpInspectRentalBar');
        const itemId = InspectShared.GetPopupSetting('item_id');
        const toolId = InspectShared.GetPopupSetting('tool_id');
        const worktype = InspectShared.GetPopupSetting('work_type');
        const contextPanel = $.GetContextPanel();
        contextPanel.Data().rentalBarPanelRegisteredForEvents = false;
        contextPanel.Data().onlyRentalItemIds = [];
        const allowRental = InspectShared.GetPopupSetting('allow_rent');
        const sRestriction = InspectShared.GetPopupSetting('store_item_id') ? '' : InventoryAPI.GetDecodeableRestriction(itemId);
        const showXrayMachineUi = InspectShared.GetPopupSetting('is_xray_machine');
        let isXrayRestriction = sRestriction === 'xray';
        if (InspectShared.GetPopupSetting('inspect_only') ||
            worktype !== 'decodeable' ||
            !allowRental ||
            (InspectShared.GetPopupSetting('purchase_item_id') && !sRestriction) ||
            showXrayMachineUi ||
            !InventoryAPI.IsValidItemID(itemId)) {
            elRentalBar.AddClass('hidden');
            return;
        }
        elRentalBar.RemoveClass('hidden');
        elRentalBar.SetHasClass('show-xray-buttons', sRestriction !== '');
        _SetNumLootlistItems(elRentalBar, itemId);
        _SetuUpButtonsBasedOnRestrictions(sRestriction, elRentalBar);
        if (!isXrayRestriction && toolId) {
            elRentalBar.FindChildInLayoutFile('UseItemImage').itemid = toolId;
            _SetDescString(elRentalBar);
        }
        if (!contextPanel.Data().rentalBarPanelRegisteredForEvents) {
            contextPanel.Data().rentalBarPanelRegisteredForEvents = true;
            $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', () => _OnMyPersonaInventoryUpdated(contextPanel));
        }
    }
    InspectRentalBar.Init = Init;
    function _SetDescString(elRentalBar) {
        const elLabel = elRentalBar.FindChildInLayoutFile('UseItemName');
        const toolId = InspectShared.GetPopupSetting('tool_id');
        const worktype = InspectShared.GetPopupSetting('work_type');
        elLabel.SetDialogVariable('itemname', InventoryAPI.GetItemName(toolId));
        elLabel.text = $.Localize('#popup_' + worktype + '_async_desc', elLabel);
        elLabel.visible = true;
    }
    function _SetuUpButtonsBasedOnRestrictions(sRestriction, elRentalBar) {
        const contextPanel = $.GetContextPanel();
        const itemId = InspectShared.GetPopupSetting('item_id');
        const keyToSellId = InspectShared.GetPopupSetting('purchase_item_id');
        if (sRestriction) {
            const elPurchaseBtn = elRentalBar.FindChildInLayoutFile('PurchaseKeyBtn');
            const elXrayRentBtn = elRentalBar.FindChildInLayoutFile('RentBtnXray');
            if (keyToSellId) {
                elPurchaseBtn.SetHasClass('hide', false);
                elXrayRentBtn.SetHasClass('hide', true);
                elPurchaseBtn.FindChildInLayoutFile('SellItemImage').itemid = keyToSellId;
                elRentalBar.SetDialogVariable('itemname', InventoryAPI.GetItemName(keyToSellId));
                elRentalBar.SetDialogVariable("price", ItemInfo.GetStoreSalePrice(keyToSellId, 1));
                elPurchaseBtn.SetPanelEvent('onactivate', () => {
                    StoreAPI.StoreItemPurchase(keyToSellId);
                    contextPanel.Data().confirmPopUpOpen = true;
                });
                if (sRestriction === 'xray')
                    _HoverEvents(elPurchaseBtn, null, contextPanel);
            }
            else {
                elPurchaseBtn.SetHasClass('hide', true);
                elXrayRentBtn.SetHasClass('hide', false);
                elXrayRentBtn.SetPanelEvent('onactivate', () => {
                    _SetUpRentActionBtn('rent', contextPanel);
                });
                if (sRestriction === 'xray')
                    _HoverEvents(elXrayRentBtn, null, contextPanel);
            }
            let xrayBtn = elRentalBar.FindChildInLayoutFile('OpenXray');
            xrayBtn.SetHasClass('hide', sRestriction === 'restricted');
            if (sRestriction !== 'restricted') {
                xrayBtn.SetPanelEvent('onactivate', () => {
                    $.DispatchEvent("ShowXrayCasePopup", '', itemId, false);
                    ClosePopup(contextPanel);
                });
                _HoverEvents(null, xrayBtn, contextPanel);
            }
            if (sRestriction === 'restricted') {
                elRentalBar?.GetParent().GetParent().SetHasClass('rental-mode', true);
            }
        }
        else {
            let RentBtn = elRentalBar.FindChildInLayoutFile('RentBtn');
            let ActionBtn = elRentalBar.FindChildInLayoutFile('OpenBtn');
            _HoverEvents(RentBtn, ActionBtn, contextPanel);
            RentBtn.SetPanelEvent('onactivate', () => {
                _SetUpRentActionBtn('rent', contextPanel);
            });
            ActionBtn.SetPanelEvent('onactivate', () => {
                OpenConfirmPopup('open', itemId, contextPanel);
            });
        }
    }
    function _SetNumLootlistItems(elRentalBar, itemId) {
        let count = InventoryAPI.GetLootListItemsCount(itemId);
        count = InventoryAPI.GetLootListItemIdByIndex(itemId, (count - 1)) == '0' ? count - 1 : count;
        elRentalBar?.SetDialogVariableInt('numlootlist', count);
    }
    function _SetUpRentActionBtn(type, contextPanel) {
        let sTimeRemainingString = GetAlreadyRentedItemsExpirationTime(contextPanel);
        const itemId = InspectShared.GetPopupSetting('item_id', contextPanel);
        contextPanel.Data().confirmPopUpOpen = true;
        if (sTimeRemainingString) {
            contextPanel.SetDialogVariable('time-remaining', sTimeRemainingString);
            contextPanel.SetDialogVariable('name', InventoryAPI.GetItemName(itemId));
            contextPanel.SetDialogVariable('expiration-time', $.Localize(sTimeRemainingString));
            UiToolkitAPI.ShowGenericPopupOk('#popup_container_confirm_title_rent', $.Localize('#popup_container_confirm_already_rented', contextPanel), '', 
            //	function () { OpenConfirmPopup( type ); },
            () => $.DispatchEvent('UIPopupButtonClicked', ''));
        }
        else {
            OpenConfirmPopup(type, itemId, contextPanel);
        }
    }
    function OpenConfirmPopup(type, itemId, contextPanel) {
        contextPanel.Data().rentalBarPopupActionCallbackHandle = UiToolkitAPI.RegisterJSCallback(() => _OnPopupActionPressed(type, contextPanel));
        UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_container_open_confirm.xml', 'action-type=' + type
            + '&' + 'case=' + itemId
            + '&' + 'callback=' + contextPanel.Data().rentalBarPopupActionCallbackHandle);
    }
    // function called from callback when the popup confirm button is pressed
    function _OnPopupActionPressed(actionType, contextPanel) {
        _OpenActions(contextPanel);
        contextPanel.Data().actionType = actionType;
        const toolId = InspectShared.GetPopupSetting('tool_id', contextPanel);
        const itemId = InspectShared.GetPopupSetting('item_id', contextPanel);
        if (actionType === 'open') {
            InventoryAPI.UseTool(toolId, itemId);
            $.DispatchEvent('StartDecodeableAnim');
            $.Msg("I HAVE OPENED A CASE");
            return;
        }
        InventoryAPI.UseToolWithIntArg(toolId, itemId, 5318008); // magic cookie for "rental"
        $.DispatchEvent('StartRentalAnim');
        $.Schedule(2.75, () => ShowRentalInspect(contextPanel));
        $.Msg("I HAVE RENTED ITEMS");
    }
    function _OpenActions(contextPanel) {
        if (contextPanel.Data().rentalBarPopupActionCallbackHandle) {
            UiToolkitAPI.UnregisterJSCallback(contextPanel.Data().rentalBarPopupActionCallbackHandle);
        }
        const elRentalBar = contextPanel.FindChildInLayoutFile('PopUpInspectRentalBar');
        elRentalBar.FindChildInLayoutFile('OpenBtn').SetHasClass('is-active-action', true);
        elRentalBar.FindChildInLayoutFile('OpenBtn').enabled = false;
        elRentalBar.FindChildInLayoutFile('RentBtn').enabled = false;
        _ResetTimeoutHandle(contextPanel);
        contextPanel.Data().rentalBarScheduleActionTimoutHandle = $.Schedule(6, () => _ShowActionTimeOutPopup(contextPanel));
        $.Msg('scheduleActionTimoutHandle: ' + contextPanel.Data().rentalBarScheduleActionTimoutHandle);
    }
    function _HoverEvents(RentBtn, ActionBtn, contextPanel) {
        const elRentalBar = contextPanel.FindChildInLayoutFile('PopUpInspectRentalBar');
        if (RentBtn) {
            RentBtn.SetPanelEvent('onmouseover', () => {
                contextPanel.Data().confirmPopUpOpen = false;
                elRentalBar?.GetParent().GetParent().SetHasClass('rental-mode', true);
            });
            RentBtn.SetPanelEvent('onmouseout', () => {
                if (!contextPanel.Data().confirmPopUpOpen) {
                    elRentalBar?.GetParent().GetParent().SetHasClass('rental-mode', false);
                }
            });
        }
        if (ActionBtn) {
            ActionBtn.SetPanelEvent('onmouseover', () => {
                elRentalBar?.GetParent().GetParent().SetHasClass('rental-mode', false);
            });
        }
    }
    function GetAlreadyRentedItemsExpirationTime(contextPanel) {
        const itemId = InspectShared.GetPopupSetting('item_id', contextPanel);
        let defIndex = InventoryAPI.GetItemDefinitionIndex(itemId);
        const nRentalHistoryCount = InventoryAPI.GetCacheTypeElementsCount('RentalHistory');
        if (nRentalHistoryCount < 1) {
            return '';
        }
        let nExpirationDate = 0;
        for (let i = 0; i < nRentalHistoryCount; ++i) {
            const oRentalHistory = InventoryAPI.GetCacheTypeElementJSOByIndex('RentalHistory', i);
            if (oRentalHistory.crate_def_index === defIndex) {
                nExpirationDate = nExpirationDate < oRentalHistory.expiration_date ? oRentalHistory.expiration_date : nExpirationDate;
            }
        }
        let oLocData = FormatText.FormatRentalTime(nExpirationDate);
        return oLocData.time;
    }
    function _ShowActionTimeOutPopup(contextPanel) {
        contextPanel.Data().rentalBarScheduleActionTimoutHandle = null;
        const elRentalBar = contextPanel.FindChildInLayoutFile('PopUpInspectRentalBar');
        if (!elRentalBar || !elRentalBar?.IsValid()) {
            return;
        }
        ClosePopup(contextPanel);
        UiToolkitAPI.ShowGenericPopupOk($.Localize('#SFUI_SteamConnectionErrorTitle'), $.Localize('#SFUI_InvError_Item_Not_Given'), '', () => { });
    }
    InspectRentalBar._ShowActionTimeOutPopup = _ShowActionTimeOutPopup;
    function _ResetTimeoutHandle(contextPanel) {
        if (contextPanel.Data().rentalBarScheduleActionTimoutHandle && typeof contextPanel.Data().rentalBarScheduleActionTimoutHandle === "number") {
            $.Msg('m_scheduleActionTimoutHandle: ' + contextPanel.Data().rentalBarScheduleActionTimoutHandle);
            $.CancelScheduled(contextPanel.Data().rentalBarScheduleActionTimoutHandle);
            contextPanel.Data().rentalBarScheduleActionTimoutHandle = null;
        }
    }
    function ClosePopup(contextPanel) {
        _ResetTimeoutHandle(contextPanel);
        $.DispatchEvent('HideSelectItemForCapabilityPopup');
        $.DispatchEvent('UIPopupButtonClicked', '');
        $.DispatchEvent('CapabilityPopupIsOpen', false);
    }
    InspectRentalBar.ClosePopup = ClosePopup;
    function _OnMyPersonaInventoryUpdated(contextPanel) {
        const worktype = InspectShared.GetPopupSetting('work_type');
        const actionType = $.GetContextPanel().Data().actionType;
        if (worktype === 'decodeable') {
            const newItems = AcknowledgeItems.GetItems();
            if (newItems.length > 0 && newItems.filter(entry => entry.pickuptype === 'found_in_crate').length > 0) {
                _ResetTimeoutHandle(contextPanel);
            }
            if (actionType === 'rent') {
                newItems.filter(entry => InventoryAPI.IsRental(entry.id)).forEach(entry => {
                    contextPanel.Data().onlyRentalItemIds.push(entry.id);
                    InventoryAPI.SetItemSessionPropertyValue(entry.id, 'recent', '1');
                    InventoryAPI.AcknowledgeNewItembyItemID(entry.id);
                });
            }
        }
    }
    function ShowRentalInspect(contextPanel) {
        if (contextPanel.Data().onlyRentalItemIds.length > 0) {
            const itemId = InspectShared.GetPopupSetting('item_id', contextPanel);
            const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_inventory_inspect.xml');
            let oSettings = {
                item_id: contextPanel.Data().onlyRentalItemIds[0],
                inspect_only: true,
                hide_all_action_items: true,
                rental_item_ids: contextPanel.Data().onlyRentalItemIds.join(','),
                case_id_for_lootlist: itemId,
            };
            elPanel.Data().oSettings = oSettings;
            ClosePopup(contextPanel);
            return;
        }
        else {
            // didn't get new items
            _ShowActionTimeOutPopup(contextPanel);
        }
    }
})(InspectRentalBar || (InspectRentalBar = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfaW5zcGVjdF9yZW50YWwtYmFyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvcG9wdXBzL3BvcHVwX2luc3BlY3RfcmVudGFsLWJhci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBQ3JDLDhDQUE4QztBQUM5QyxrREFBa0Q7QUFDbEQsc0RBQXNEO0FBQ3RELGdEQUFnRDtBQUVoRCxJQUFVLGdCQUFnQixDQW1YekI7QUFuWEQsV0FBVSxnQkFBZ0I7SUFFekIsU0FBZ0IsSUFBSTtRQUVuQixNQUFNLFdBQVcsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUUsdUJBQXVCLENBQUUsQ0FBQztRQUN6RixNQUFNLE1BQU0sR0FBRyxhQUFhLENBQUMsZUFBZSxDQUFFLFNBQVMsQ0FBWSxDQUFDO1FBQ3BFLE1BQU0sTUFBTSxHQUFHLGFBQWEsQ0FBQyxlQUFlLENBQUUsU0FBUyxDQUFZLENBQUM7UUFDcEUsTUFBTSxRQUFRLEdBQUcsYUFBYSxDQUFDLGVBQWUsQ0FBRSxXQUFXLENBQVksQ0FBQztRQUN4RSxNQUFNLFlBQVksR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDekMsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDLGlDQUFpQyxHQUFHLEtBQUssQ0FBQztRQUM5RCxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUMsaUJBQWlCLEdBQUcsRUFBRSxDQUFDO1FBRTNDLE1BQU0sV0FBVyxHQUFHLGFBQWEsQ0FBQyxlQUFlLENBQUUsWUFBWSxDQUFFLENBQUM7UUFDbEUsTUFBTSxZQUFZLEdBQUcsYUFBYSxDQUFDLGVBQWUsQ0FBRSxlQUFlLENBQVksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsd0JBQXdCLENBQUUsTUFBTSxDQUFFLENBQUM7UUFDdkksTUFBTSxpQkFBaUIs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