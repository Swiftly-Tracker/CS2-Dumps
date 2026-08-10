"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="popup_inspect_shared.ts" />
var CapabilityHeader;
(function (CapabilityHeader) {
    function Init() {
        let elCapabilityHeaderPanel = $.GetContextPanel().FindChildInLayoutFile('PopUpCapabilityHeader');
        const itemId = InspectShared.GetPopupSetting('item_id');
        const worktype = InspectShared.GetPopupSetting('work_type');
        const storeItemid = InspectShared.GetPopupSetting('store_item_id');
        if (!worktype && !storeItemid)
            return;
        let itemType = '';
        if (itemId != undefined && itemId != null && itemId !== '') {
            let itemDefName = InventoryAPI.GetItemDefinitionName(itemId);
            if (worktype === 'decodeable') {
                if (itemDefName && itemDefName.indexOf("spray") != -1)
                    itemType = "_graffiti";
                else if (itemDefName && itemDefName.indexOf("tournament_pass_") != -1)
                    itemType = "_fantoken";
                else if (InventoryAPI.GetItemAttributeValue(itemId, '{uint32}volatile container'))
                    itemType = "_terminal";
            }
            else if (worktype === 'useitem') {
                if (itemDefName && itemDefName.startsWith('Remove Keychain Tool'))
                    itemType = "_getkeychaincharges";
            }
        }
        elCapabilityHeaderPanel.RemoveClass('hidden');
        _SetDialogVariables(elCapabilityHeaderPanel, itemId);
        _SetUpHeaders(elCapabilityHeaderPanel, itemType);
    }
    CapabilityHeader.Init = Init;
    function _SetDialogVariables(elPanel, itemId) {
        const showXrayMachineUi = InspectShared.GetPopupSetting('is_xray_machine');
        let displayItemId = '';
        if (showXrayMachineUi && InventoryAPI.IsFauxItemID($.GetContextPanel().Data().existingRewardFromXrayId)) {
            displayItemId = $.GetContextPanel().Data().existingRewardFromXrayId;
        }
        else {
            displayItemId = itemId;
        }
        elPanel.SetDialogVariable("itemname", InventoryAPI.GetItemNameUncustomized(displayItemId));
    }
    function _SetUpHeaders(elPanel, itemType) {
        _SetUpTitle(elPanel, itemType);
        _SetUpWarning(elPanel, itemType);
        _SetUpDesc(elPanel, itemType);
    }
    function _SetUpTitle(elPanel, itemType) {
        let elTitle = elPanel.FindChildInLayoutFile('CapabilityTitle');
        const itemId = InspectShared.GetPopupSetting('item_id');
        const inspectOnly = InspectShared.GetPopupSetting('inspect_only');
        const toolId = InspectShared.GetPopupSetting('tool_id');
        const showXrayMachineUi = InspectShared.GetPopupSetting('is_xray_machine');
        const allowXrayPurchase = InspectShared.GetPopupSetting('allow_xray_purchase');
        const allowXrayClaim = InspectShared.GetPopupSetting('allow_xray_claim');
        const worktype = _GetWorkType();
        if (inspectOnly && worktype === 'decodeable') {
            elTitle.text = '#popup_cartpreview_title';
        }
        else if (showXrayMachineUi) {
            if (allowXrayPurchase || allowXrayClaim) {
                elTitle.text = "#popup_xray_claim_title";
            }
            else {
                elTitle.text = "#popup_xray_title";
            }
        }
        else if (worktype === 'decodeable' && InventoryAPI.GetDecodeableRestriction(itemId) === 'xray') {
            elTitle.text = '#popup_' + worktype + '_xray_title';
        }
        else if (!toolId && worktype === 'decodeable') {
            elTitle.text = '#popup_totool_' + worktype + '_header' + itemType;
        }
        else {
            let defName = InventoryAPI.GetItemDefinitionName(itemId);
            if (defName === 'casket' && worktype === 'nameable')
                elTitle.text = '#popup_newcasket_title';
            else
                elTitle.text = '#popup_' + worktype + '_title' + itemType;
        }
    }
    function _SetUpWarning(elPanel, itemType) {
        let elWarn = elPanel.FindChildInLayoutFile('CapabilityWarning');
        const storeItemId = InspectShared.GetPopupSetting('store_item_id');
        const itemId = InspectShared.GetPopupSetting('item_id');
        const showXrayMachineUi = InspectShared.GetPopupSetting('is_xray_machine');
        const allowRental = InspectShared.GetPopupSetting('allow_rent');
        const worktype = _GetWorkType();
        let sWarnLocString = '';
        if (InspectShared.GetPopupSetting('show_work_type_warning') === false ? false : true) {
            sWarnLocString = '#popup_' + worktype + '_warning' + itemType;
        }
        if (worktype === 'decodeable') {
            let sRestriction = storeItemId ? '' : InventoryAPI.GetDecodeableRestriction(itemId);
            if ((sRestriction === 'restricted' && !allowRental) || (sRestriction === 'xray' && showXrayMachineUi)) {
                sWarnLocString = '#popup_' + worktype + '_err_' + sRestriction;
                elWarn.AddClass('popup-capability__error');
            }
        }
        const warningText = InspectShared.GetPopupSetting('async_work_type_warning_text');
        if (warningText) {
            sWarnLocString = warningText;
        }
        elWarn.SetHasClass('hidden', sWarnLocString ? false : true);
        if (sWarnLocString) {
            let elWarnLabel = elWarn.FindChildInLayoutFile('CapabilityWarningLabel');
            elWarnLabel.text = sWarnLocString;
        }
    }
    function _SetUpDesc(elPanel, itemType) {
        let sDescString = '';
        const itemId = InspectShared.GetPopupSetting('item_id');
        const showXrayMachineUi = InspectShared.GetPopupSetting('is_xray_machine');
        const allowXrayPurchase = InspectShared.GetPopupSetting('allow_xray_purchase');
        const allowXrayClaim = InspectShared.GetPopupSetting('allow_xray_claim');
        const inspectOnly = InspectShared.GetPopupSetting('inspect_only');
        const worktype = _GetWorkType();
        if (worktype === 'decodeable' && inspectOnly) {
            sDescString = "#popup_preview_desc";
        }
        else if (showXrayMachineUi) {
            if (allowXrayClaim || allowXrayPurchase) {
                sDescString = "#popup_xray_claim_desc";
            }
            else {
                sDescString = '#popup_xray_desc';
            }
        }
        else if ((worktype === 'decodeable') && (InventoryAPI.GetDecodeableRestriction(itemId) === 'xray')) {
            sDescString = '#popup_' + worktype + '_xray_desc';
        }
        else {
            sDescString = '#popup_' + worktype + '_desc' + itemType;
        }
        elPanel.FindChildInLayoutFile('CapabilityDesc').text = sDescString;
    }
    function _GetWorkType() {
        let worktype = InspectShared.GetPopupSetting('work_type');
        const storeItemId = InspectShared.GetPopupSetting('store_item_id');
        return storeItemId ? 'purchase' : worktype;
    }
})(CapabilityHeader || (CapabilityHeader = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfY2FwYWJpbGl0eV9oZWFkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfY2FwYWJpbGl0eV9oZWFkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyxnREFBZ0Q7QUFFaEQsSUFBVSxnQkFBZ0IsQ0FtTXpCO0FBbk1ELFdBQVUsZ0JBQWdCO0lBRXpCLFNBQWdCLElBQUk7UUFFbkIsSUFBSSx1QkFBdUIsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUUsdUJBQXVCLENBQUUsQ0FBQztRQUVuRyxNQUFNLE1BQU0sR0FBRyxhQUFhLENBQUMsZUFBZSxDQUFFLFNBQVMsQ0FBVyxDQUFDO1FBQ25FLE1BQU0sUUFBUSxHQUFHLGFBQWEsQ0FBQyxlQUFlLENBQUUsV0FBVyxDQUFXLENBQUM7UUFDdkUsTUFBTSxXQUFXLEdBQUcsYUFBYSxDQUFDLGVBQWUsQ0FBRSxlQUFlLENBQVcsQ0FBQztRQUc5RSxJQUFLLENBQUMsUUFBUSxJQUFJLENBQUMsV0FBVztZQUM3QixPQUFPO1FBRVIsSUFBSSxRQUFRLEdBQUcsRUFBRSxDQUFDO1FBQ2pCLElBQUssTUFBTSxJQUFJLFNBQVMsSUFBSSxNQUFNLElBQUksSUFBSSxJQUFJLE1BQU0sS0FBSyxFQUFFLEVBQzVEO1lBQ0MsSUFBSSxXQUFXLEdBQUcsWUFBWSxDQUFDLHFCQUFxQixDQUFFLE1BQU0sQ0FBRSxDQUFDO1lBRS9ELElBQUssUUFBUSxLQUFLLFlBQVksRUFDOUI7Z0JBQ0MsSUFBSyxXQUFXLElBQUksV0FBVyxDQUFDLE9BQU8sQ0FBRSxPQUFPLENBQUUsSUFBSSxDQUFDLENBQUM7b0JBQ3ZELFFBQVEsR0FBRyxXQUFXLENBQUM7cUJBQ25CLElBQUssV0FBVyxJQUFJLFdBQVcsQ0FBQyxPQUFPLENBQUUsa0JBQWtCLENBQUUsSUFB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