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
        $.Msg('popup_capability_header: _Init ' + worktype + " " + storeItemid);
        if (!worktype && !storeItemid)
            return;
        let itemType = ''; // suffix to augment item type strings
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
        //for decodealbe panel that is restricted
        else if (worktype === 'decodeable' && InventoryAPI.GetDecodeableRestriction(itemId) === 'xray') {
            elTitle.text = '#popup_' + worktype + '_xray_title';
        }
        // opening case with no key so we show a differnt title
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
        if (InspectShared.GetPopupSetting('show_work_type_warning') === false ? false : true) { // Explicitly need to show the warning
            sWarnLocString = '#popup_' + worktype + '_warning' + itemType;
        }
        if (worktype === 'decodeable') {
            // If we are selling this item, then this will display no warning
            let sRestriction = storeItemId ? '' : InventoryAPI.GetDecodeableRestriction(itemId);
            if ((sRestriction === 'restricted' && !allowRental) || (sRestriction === 'xray' && showXrayMachineUi)) { // Decodeable container cannot be opened, must show restriction
                sWarnLocString = '#popup_' + worktype + '_err_' + sRestriction;
                elWarn.AddClass('popup-capability__error');
            }
        }
        const warningText = InspectShared.GetPopupSetting('async_work_type_warning_text');
        // Allow custom warning text to appear too
        if (warningText) {
            $.Msg('Overriding sWarnLocString ' + sWarnLocString + ' > ' + warningText);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfY2FwYWJpbGl0eV9oZWFkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfY2FwYWJpbGl0eV9oZWFkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyxnREFBZ0Q7QUFFaEQsSUFBVSxnQkFBZ0IsQ0FtTXpCO0FBbk1ELFdBQVUsZ0JBQWdCO0lBRXpCLFNBQWdCLElBQUk7UUFFbkIsSUFBSSx1QkFBdUIsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUUsdUJBQXVCLENBQUUsQ0FBQztRQUVuRyxNQUFNLE1BQU0sR0FBRyxhQUFhLENBQUMsZUFBZSxDQUFFLFNBQVMsQ0FBVyxDQUFDO1FBQ25FLE1BQU0sUUFBUSxHQUFHLGFBQWEsQ0FBQyxlQUFlLENBQUUsV0FBVyxDQUFXLENBQUM7UUFDdkUsTUFBTSxXQUFXLEdBQUcsYUFBYSxDQUFDLGVBQWUsQ0FBRSxlQUFlLENBQVcsQ0FBQztRQUU5RSxDQUFDLENBQUMsR0FBRyxDQUFFLGlDQUFpQyxHQUFHLFFBQVEsR0FBRyxHQUFHLEdBQUcsV0FBVyxDQUFFLENBQUM7UUFDMUUsSUFBSyxDQUFDLFFBQVEsSUFBSSxDQUFDLFdBQVc7WUFDN0IsT0FBTztRQUVSLElBQUksUUFBUSxHQUFHLEVBQUUsQ0FBQyxDQUFBLHNDQUFzQztRQUN2RCxJQUFLLE1BQU0sSUFBSSxTQUFTLElBQUksTUFBTSxJQUFJLElBQUksSUFBSSxNQUFNLEtBQUssRUFBRSxFQUM1RDtZQUNDLElBQUksV0FBVyxHQUFHLFlBQVksQ0FBQyxxQkFBcUIsQ0FBRSxNQUFNLENBQUUsQ0FBQztZQUUvRCxJQUFLLFFBQVEsS0FBSyxZQUFZLEVBQzlCO2dCQUNDLElBQUssV0FBVyxJQUFJLFdBQVcsQ0FBQyxPQUFPLENBQUUsT0FBTyxDQUFFLElBQUksQ0FBQyxDQUFD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