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
        let itemidsList = $.GetContextPanel().GetAttributeString("subject_item_id", "");
        ConfigurePopupFromItemsList(itemidsList);
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
            PanelTimedOut();
            return;
        }
        let elItem = $("#CasketItemPanel");
        elItem.SetAttributeString('itemid', itemid);
        elItem.BLoadLayoutSnippet("LootListItem");
        elItem.FindChildInLayoutFile('ItemImage').itemid = itemid;
        elItem.FindChildInLayoutFile('JsRarity').style.backgroundColor = InventoryAPI.GetItemRarityColor(itemid);
        ItemInfo.GetFormattedName(itemid).SetOnLabel(elItem.FindChildInLayoutFile('JsItemName'));
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
        $.Schedule(schOperation, LaunchOperation);
    }
    ;
    var PanelTimedOut = function () {
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
        m_arrSubjectItemsRemaining = [];
    }
    PopupCasketOperations.OnRequestCancelBatch = OnRequestCancelBatch;
    function OnItemCustomizationNotification(numericType, type, itemid) {
        _CancelCasketOperationTimeoutScheduledHandle();
        switch (type) {
            case 'casket_added':
            case 'casket_removed':
                if (_BIsBatchMode()) {
                    if (m_arrSubjectItemsRemaining.length > 0) {
                        var strItemIDs = m_arrSubjectItemsRemaining.join(",");
                        ConfigurePopupFromItemsList(strItemIDs);
                    }
                    else {
                        _ClosePopUp();
                    }
                    return;
                }
        }
        _ClosePopUp();
        switch (type) {
            case 'casket_too_full':
            case 'casket_inv_full':
                UiToolkitAPI.ShowGenericPopupOk($.Localize('#popup_casket_title_error_' + type), $.Localize('#popup_casket_message_error_' + type), '', function () {
                });
                break;
            case 'casket_added':
                if (m_strShowSelectItemForCapabilityPopupCapability) {
                    _TeardownPreviousInventoryCapabilitiesPopup();
                    $.DispatchEvent('ShowSelectItemForCapabilityPopup', itemid, '', m_strShowSelectItemForCapabilityPopupCapability);
                }
                else {
                    $.DispatchEvent("PromptShowSelectItemForCapabilityPopup", '#popup_casket_title_prompt_bulkstore', '#popup_casket_message_prompt_bulkstore', 'casketstore', itemid, '');
                }
                break;
            case 'casket_removed':
                _TeardownPreviousInventoryCapabilitiesPopup();
                if (InventoryAPI.GetItemAttributeValue(itemid, 'items count')) {
                    $.DispatchEvent('ShowSelectItemForCapabilityPopup', itemid, '', m_strShowSelectItemForCapabilityPopupCapability);
                }
                break;
            case 'casket_contents':
                $.DispatchEvent('ShowSelectItemForCapabilityPopup', itemid, '', m_strShowSelectItemForCapabilityPopupCapability);
                break;
            default:
                break;
        }
    }
    ;
    function LaunchOperation() {
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