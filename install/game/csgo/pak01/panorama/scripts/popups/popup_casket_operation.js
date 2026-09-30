"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../common/iteminfo.ts" />
var PopupCasketOperations;
(function (PopupCasketOperations) {
    let m_strOperation = '';
    let m_CasketOperationTimeoutScheduledHandle = null;
    let m_strShowSelectItemForCapabilityPopupCapability = '';
    let m_numSubjectItems = 1;
    let m_itemidCasket = '';
    let m_itemidSubject = '';
    let m_arrSubjectItemsRemaining = [];
    function _BIsBatchMode() {
        if (m_strShowSelectItemForCapabilityPopupCapability && (m_strShowSelectItemForCapabilityPopupCapability === 'batch'))
            return true;
        else
            return false;
    }
    ;
    function SetupPopup() {
        m_strOperation = $.GetContextPanel().GetAttributeString("op", "");
        $.GetContextPanel().SetDialogVariable("title", $.Localize("#popup_casket_title_" + m_strOperation));
        m_itemidCasket = $.GetContextPanel().GetAttributeString("casket_item_id", "");
        m_strShowSelectItemForCapabilityPopupCapability = $.GetContextPanel().GetAttributeString("nextcapability", "");
        // Set the ItemID
        let itemidsList = $.GetContextPanel().GetAttributeString("subject_item_id", "");
        ConfigurePopupFromItemsList(itemidsList);
        // $.RegisterForUnhandledEvent( 'PanoramaComponent_MyPersona_InventoryUpdated', OnInventoryUpdated );
        $.RegisterForUnhandledEvent('PanoramaComponent_Inventory_ItemCustomizationNotification', OnItemCustomizationNotification);
    }
    PopupCasketOperations.SetupPopup = SetupPopup;
    ;
    function ConfigurePopupFromItemsList(itemidsList) {
        m_arrSubjectItemsRemaining = itemidsList.split(",");
        m_numSubjectItems = m_arrSubjectItemsRemaining.length;
        $.GetContextPanel().SetDialogVariableInt("count", m_numSubjectItems);
        $('#ItemsRemaining').visible = (m_numSubjectItems > 1);
        $('#PopupButtonRow').visible = _BIsBatchMode() && (m_numSubjectItems > 1);
        let itemid = m_arrSubjectItemsRemaining.splice(0, 1)[0];
        m_itemidSubject = itemid;
        if (!InventoryAPI.GetItemRarityColor(m_itemidSubject)) {
            $.Msg('Bad ItemID encountered ' + m_itemidSubject);
            PanelTimedOut();
            return;
        }
        let elItem = $("#CasketItemPanel");
        elItem.SetAttributeString('itemid', itemid);
        elItem.BLoadLayoutSnippet("LootListItem");
        // Set the item data on the panel
        elItem.FindChildInLayoutFile('ItemImage').itemid = itemid;
        elItem.FindChildInLayoutFile('JsRarity').style.backgroundColor = InventoryAPI.GetItemRarityColor(itemid);
        ItemInfo.GetFormattedName(itemid).SetOnLabel(elItem.FindChildInLayoutFile('JsItemName'));
        // Set spinner visibility
        let spinnerVisible = $.GetContextPanel().GetAttributeInt("spinner", 0) !== 0 ? true : false;
        $("#Spinner").SetHasClass("SpinnerVisible", spinnerVisible);
        m_CasketOperationTimeoutScheduledHandle = $.Schedule(10, PanelTimedOut);
        let schOperation = 0.75;
        if (m_strOperation === 'loadcontents') {
            schOperation = 0.5;
        }
        else if ((m_strOperation === 'add') && m_strShowSelectItemForCapabilityPopupCapability) {
            schOperation = 0.25;
        }
        else if (_BIsBatchMode()) {
            schOperation = 0.2;
        }
        //DEVONLY{
        let cvvalue = parseFloat(GameInterfaceAPI.GetSettingString('dev_caskettxn_latency'));
        if (cvvalue) // allow shortening the spinners for development iteration
         {
            cvvalue = cvvalue;
            if (cvvalue > 0)
                schOperation = cvvalue;
        }
        //}DEVONLY
        $.Schedule(schOperation, LaunchOperation);
    }
    ;
    var PanelTimedOut = function () {
        // We did not hearback from the inventory updated
        m_CasketOperationTimeoutScheduledHandle = null;
        $.DispatchEvent('UIPopupButtonClicked', '');
        UiToolkitAPI.ShowGenericPopupOk($.Localize('#SFUI_SteamConnectionErrorTitle'), $.Localize('#SFUI_Steam_Error_LinkUnexpected'), '', function () {
        });
    };
    var _CancelCasketOperationTimeoutScheduledHandle = function () {
        if (m_CasketOperationTimeoutScheduledHandle) {
            $.CancelScheduled(m_CasketOperationTimeoutScheduledHandle);
            m_CasketOperationTimeoutScheduledHandle = null;
        }
    };
    var _ClosePopUp = function () {
        $.DispatchEvent('UIPopupButtonClicked', '');
    };
    var _TeardownPreviousInventoryCapabilitiesPopup = function () {
        $.DispatchEvent('ContextMenuEvent', '');
        $.DispatchEvent('HideSelectItemForCapabilityPopup');
        $.DispatchEvent('UIPopupButtonClicked', '');
        $.DispatchEvent('CapabilityPopupIsOpen', false);
    };
    function OnRequestCancelBatch() {
        $.Msg('OnRequestCancelBatch while had ' + (m_arrSubjectItemsRemaining ? m_arrSubjectItemsRemaining.length : 0) + ' items remaining');
        m_arrSubjectItemsRemaining = [];
    }
    PopupCasketOperations.OnRequestCancelBatch = OnRequestCancelBatch;
    function OnItemCustomizationNotification(numericType, type, itemid) {
        _CancelCasketOperationTimeoutScheduledHandle();
        //
        // Batch mode processing
        //
        switch (type) {
            case 'casket_added':
            case 'casket_removed':
                if (_BIsBatchMode()) {
                    if (m_arrSubjectItemsRemaining.length > 0) { // still working on this batch
                        var strItemIDs = m_arrSubjectItemsRemaining.join(",");
                        ConfigurePopupFromItemsList(strItemIDs);
                    }
                    else { // finished with the entire batch
                        _ClosePopUp();
                    }
                    return;
                }
        }
        //
        // Single item processing
        //
        _ClosePopUp();
        switch (type) {
            case 'casket_too_full':
            case 'casket_inv_full':
                UiToolkitAPI.ShowGenericPopupOk($.Localize('#popup_casket_title_error_' + type), $.Localize('#popup_casket_message_error_' + type), '', function () {
                });
                break;
            case 'casket_added':
                // Expected notification
                if (m_strShowSelectItemForCapabilityPopupCapability) { // open the next stage if requested
                    _TeardownPreviousInventoryCapabilitiesPopup();
                    $.DispatchEvent('ShowSelectItemForCapabilityPopup', itemid, '', m_strShowSelectItemForCapabilityPopupCapability);
                }
                else { // need to prompt the user if they want to move more items?
                    $.DispatchEvent("PromptShowSelectItemForCapabilityPopup", '#popup_casket_title_prompt_bulkstore', '#popup_casket_message_prompt_bulkstore', 'casketstore', itemid, '');
                }
                break;
            case 'casket_removed':
                // Expected notification, argument is the casket container that was used for extraction
                _TeardownPreviousInventoryCapabilitiesPopup();
                if (InventoryAPI.GetItemAttributeValue(itemid, 'items count')) {
                    $.DispatchEvent('ShowSelectItemForCapabilityPopup', itemid, '', m_strShowSelectItemForCapabilityPopupCapability);
                }
                break;
            case 'casket_contents':
                // Contents loaded, display it
                $.DispatchEvent('ShowSelectItemForCapabilityPopup', itemid, '', m_strShowSelectItemForCapabilityPopupCapability);
                break;
            default:
                // Unexpected
                $.Msg("Unexpected OnItemCustomizationNotification when waiting for casket operation: " + type);
                break;
        }
    }
    ;
    function LaunchOperation() {
        $.Msg("Casket operation (" + m_strOperation + "): casket = " + m_itemidCasket + " subject = " + m_itemidSubject);
        var nOpRequestNumber = 0;
        switch (m_strOperation) {
            case "add":
                nOpRequestNumber = 1;
                break;
            case "remove":
                nOpRequestNumber = -1;
                break;
        }
        InventoryAPI.PerformItemCasketTransaction(nOpRequestNumber, m_itemidCasket, m_itemidSubject);
    }
})(PopupCasketOperations || (PopupCasketOperations = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfY2Fza2V0X29wZXJhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3BvcHVwcy9wb3B1cF9jYXNrZXRfb3BlcmF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFDckMsOENBQThDO0FBRTlDLElBQVUscUJBQXFCLENBbU45QjtBQW5ORCxXQUFVLHFCQUFxQjtJQUUzQixJQUFJLGNBQWMsR0FBRyxFQUFFLENBQUM7SUFDeEIsSUFBSSx1Q0FBdUMsR0FBa0IsSUFBSSxDQUFDO0lBQ2xFLElBQUksK0NBQStDLEdBQUcsRUFBRSxDQUFDO0lBQ3pELElBQUksaUJBQWlCLEdBQUcsQ0FBQyxDQUFDO0lBQzFCLElBQUksY0FBYyxHQUFHLEVBQUUsQ0FBQztJQUN4QixJQUFJLGVBQWUsR0FBRyxFQUFFLENBQUM7SUFDekIsSUFBSSwwQkFBMEIsR0FBYSxFQUFFLENBQUM7SUFFOUMsU0FBUyxhQUFhO1FBRWxCLElBQUssK0NBQStDLElBQUksQ0FBRSwrQ0FBK0MsS0FBSyxPQUFPLENBQUU7WUFDbkgsT0FBTyxJQUFJLENBQUM7O1lBRVosT0FBTyxLQUFLLENBQUM7SUFDckIsQ0FBQztJQUFBLENBQUM7SUFFRixTQUFnQixVQUFVO1FBRXRCLGNBQWMsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsa0JBQWtCLENBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBRSxDQUFDO1FBQ3BFLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxzQkFBc0IsR0FBRyxjQUFjLENBQUUsQ0FBRSxDQUFDO1FBRXhHLGNBQWMsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsa0JBQWtCLENBQUUsZ0JBQWdCLEVBQUUsRUFBRSxDQUFFLENBQUM7UUFFaEYsK0NBQStDLEdBQUcs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