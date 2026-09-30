"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../inspect.ts" />
/// <reference path="popup_inspect_async-bar.ts" />
/// <reference path="popup_inspect_purchase-bar.ts" />
/// <reference path="popup_capability_header.ts" />
/// <reference path="popup_acknowledge_item.ts" />
/// <reference path="popup_inspect_shared.ts" />
var CapabilityNameable;
(function (CapabilityNameable) {
    function Init() {
        const itemId = InspectShared.GetPopupSetting('item_id');
        if (ItemInfo.IsWeapon(itemId) || ItemInfo.IsMelee(itemId)) { // Only perform hot-application for the weapons
            InspectShared.SetPopupSetting('temp_display_item_id', InventoryAPI.CreateTempCombinedItemWithTool(itemId, _GetNameTagFauxItemID()));
        }
        else {
            InspectShared.SetPopupSetting('temp_display_item_id', itemId);
        }
        // Set custom class for storage units
        const defName = InventoryAPI.GetItemDefinitionName(itemId);
        const contextPanel = $.GetContextPanel();
        contextPanel.SetHasClass('isstorageunit', (defName === 'casket'));
        _SetUpPanelElements(contextPanel);
        $.Schedule(1, () => { contextPanel.FindChildTraverse('NameableTextEntry').SetPanelEvent('ontextentrychange', _OnEntryChanged.bind(undefined, contextPanel)); });
        $.DispatchEvent('CapabilityPopupIsOpen', true);
    }
    CapabilityNameable.Init = Init;
    ;
    function _GetNameTagFauxItemID() {
        const nameTagStoreId = InventoryAPI.GetItemDefinitionIndexFromDefinitionName("Name Tag");
        const fakeItem = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(nameTagStoreId, 0);
        return fakeItem;
    }
    function _SetItemModel(id) {
        const elItemModelImagePanel = $.GetContextPanel().FindChildInLayoutFile('PopUpInspectModelOrImage');
        InspectModelImage.Init(elItemModelImagePanel, id);
        elItemModelImagePanel.AddClass('popup-inspect-modelpanel_darken');
        const elNameTagModel = $.GetContextPanel().FindChildInLayoutFile('id-inspect-nametag-model');
        if (elNameTagModel && elNameTagModel.IsValid()) {
            elNameTagModel.TransitionToCamera('cam_nametag', 1.0);
            elNameTagModel.SetItemModel('weapons/models/shared/nametag/nametag_module.vmdl');
            elNameTagModel.SetItemLabel('');
        }
    }
    ;
    function _RefreshItemPresentationWithUpdatedName(bNameTagModelVisible, strTextForTempItem) {
        if (InspectShared.GetPopupSetting('temp_display_item_id') === InspectShared.GetPopupSetting('item_id'))
            return;
        const elItemModelImagePanel = $.GetContextPanel().FindChildInLayoutFile('PopUpInspectModelOrImage');
        if (elItemModelImagePanel && elItemModelImagePanel.IsValid()) {
            const elItemPanel = elItemModelImagePanel.FindChildInLayoutFile('ItemPreviewPanel');
            if (elItemPanel && elItemPanel.IsValid()) {
                elItemPanel.RefreshWeaponItemNameTag(InspectShared.GetPopupSetting('temp_display_item_id'), strTextForTempItem);
            }
            if (elItemPanel && elItemPanel.PanZoomEnabled()) {
                if (bNameTagModelVisible) {
                    elItemPanel.ResetPanZoom();
                }
                else {
                    // Ensure arrow keys work for panning
                    elItemPanel.SetFocus();
                }
            }
        }
        const elNameTagModel = $.GetContextPanel().FindChildInLayoutFile('id-inspect-nametag-model');
        if (elNameTagModel && elNameTagModel.IsValid()) {
            elNameTagModel.visible = bNameTagModelVisible;
        }
    }
    function _SetUpPanelElements(contextPanel) {
        const toolId = InspectShared.GetPopupSetting('tool_id');
        if (!toolId) {
            InspectShared.SetPopupSetting('show_work_type_warning', false);
        }
        const itemId = InspectShared.GetPopupSetting('item_id');
        InspectAsyncActionBar.Init();
        _ShowPurchase(toolId);
        CapabilityHeader.Init(); // Header will be configured with real owned item -- because we force-apply a name tag to the temp one
        _SetItemModel(InspectShared.GetPopupSetting('temp_display_item_id'));
        const noTool = (toolId === '');
        const hasName = InventoryAPI.HasCustomName(itemId); // Temp item always has a dummy name tag, check the real item for whether "remove" is allowed
        _SetUpButtonStates(itemId, hasName, noTool, contextPanel); // Bind "remove" operation to the real item
        _UpdateAcceptState(false, contextPanel);
    }
    ;
    function _ShowPurchase(toolId) {
        if (!toolId) {
            const fakeItem = _GetNameTagFauxItemID();
            InspectShared.SetPopupSetting('purchase_item_id', fakeItem);
        }
        InspectPurchaseBar.Init();
    }
    ;
    function _SetUpButtonStates(itemId, hasName, noTool, contextPanel) {
        const elAsyncActionBarPanel = contextPanel.FindChildInLayoutFile('PopUpInspectAsyncBar');
        const elTextEntry = contextPanel.FindChildInLayoutFile('NameableTextEntry');
        const elValidBtn = contextPanel.FindChildInLayoutFile('NameableValidBtn');
        const elRemoveBtn = contextPanel.FindChildInLayoutFile('NameableRemoveBtn');
        InspectAsyncActionBar.EnableDisableOkBtn(elAsyncActionBarPanel, false);
        elValidBtn.SetHasClass('hidden', noTool);
        elValidBtn.SetPanelEvent('onactivate', () => {
            $.DispatchEvent("CSGOPlaySoundEffect", "rename_select", "MOUSE");
            InspectAsyncActionBar.EnableDisableOkBtn(elAsyncActionBarPanel, true);
            elTextEntry.enabled = false;
            elRemoveBtn.SetHasClass('hidden', false);
            elValidBtn.SetHasClass('hidden', true);
            _UpdateAcceptState(true, contextPanel);
        });
        elRemoveBtn.SetPanelEvent('onactivate', _RemoveButtonAction.bind(undefined, contextPanel));
        const RemoveConfirm = contextPanel.FindChildInLayoutFile('NameableRemoveConfirm');
        RemoveConfirm.SetPanelEvent('onactivate', _OnRemoveConfirm.bind(undefined, itemId));
        const defName = InventoryAPI.GetItemDefinitionName(itemId);
        RemoveConfirm.SetHasClass('hidden', !hasName || defName === 'casket' || defName === 'pet');
        elTextEntry.SetFocus();
        elTextEntry.SetMaxChars(20);
        elTextEntry.text = _SetDefaultTextForTextEntry(hasName, itemId, contextPanel);
    }
    ;
    function _RemoveButtonAction(contextPanel) {
        const elAsyncActionBarPanel = $.GetContextPanel().FindChildInLayoutFile('PopUpInspectAsyncBar');
        const elTextEntry = contextPanel.FindChildTraverse('NameableTextEntry');
        const elValidBtn = contextPanel.FindChildInLayoutFile('NameableValidBtn');
        const elRemoveBtn = contextPanel.FindChildInLayoutFile('NameableRemoveBtn');
        InspectAsyncActionBar.EnableDisableOkBtn(elAsyncActionBarPanel, false);
        elTextEntry.enabled = true;
        elTextEntry.SetFocus();
        elRemoveBtn.SetHasClass('hidden', true);
        elValidBtn.SetHasClass('hidden', false);
        elTextEntry.text = '';
        const itemId = InspectShared.GetPopupSetting('item_id', contextPanel);
        const strOriginalItemName = InventoryAPI.HasCustomName(itemId) ? InventoryAPI.GetItemNameCustomized(itemId) : '';
        if (InspectShared.GetPopupSetting('temp_display_item_id') !== InspectShared.GetPopupSetting('item_id')) {
            InventoryAPI.SetNameToolString(strOriginalItemName, '');
            _RefreshItemPresentationWithUpdatedName(true, strOriginalItemName);
        }
    }
    function _SetDefaultTextForTextEntry(hasName, itemId, contextPanel) {
        const elTextEntry = contextPanel.FindChildTraverse('NameableTextEntry');
        if (elTextEntry.text !== '') {
            return elTextEntry.text;
        }
        if (!hasName) {
            return '';
        }
        const nameWithQuotes = InventoryAPI.GetItemName(itemId);
        if (nameWithQuotes && nameWithQuotes.length > 4
            && nameWithQuotes[0] == "'" && nameWithQuotes[1] == "'"
            && nameWithQuotes[nameWithQuotes.length - 1] == "'" && nameWithQuotes[nameWithQuotes.length - 2] == "'") {
            return nameWithQuotes.substr(2, nameWithQuotes.length - 4);
        }
        else {
            return nameWithQuotes;
        }
    }
    ;
    function _OnRemoveConfirm(itemId) {
        $.Msg('_OnRemoveConfirm: ' + itemId);
        const temp = UiToolkitAPI.ShowGenericPopupOkCancel($.Localize('#popup_nameable_remove_confirm_title'), $.Localize('#tooltip_nameable_remove'), '', () => {
            $.Msg('_ActionRemoveName: ' + itemId);
            InventoryAPI.ClearCustomName(itemId);
            ClosePopup();
            $.DispatchEvent('HideSelectItemForCapabilityPopup');
        }, () => { });
    }
    ;
    function _OnEntryChanged(contextPanel) {
        const elNameTagModel = contextPanel.FindChildInLayoutFile('id-inspect-nametag-model');
        if (elNameTagModel && elNameTagModel.IsValid()) {
            const elTextEntry = contextPanel.FindChildTraverse('NameableTextEntry');
            elNameTagModel.SetItemLabel(elTextEntry.text);
            $.DispatchEvent("CSGOPlaySoundEffect", "rename_teletype", "MOUSE");
            _UpdateAcceptState(false, contextPanel);
        }
    }
    ;
    function _UpdateAcceptState(bApplyToItem, contextPanel) {
        if (InspectShared.GetPopupSetting('temp_display_item_id') === InspectShared.GetPopupSetting('item_id'))
            bApplyToItem = false;
        const elTextEntry = contextPanel.FindChildTraverse('NameableTextEntry');
        const elValidBtn = contextPanel.FindChildInLayoutFile('NameableValidBtn');
        const isValid = InventoryAPI.SetNameToolString(elTextEntry.text, '');
        $.Msg('isValid: ' + isValid);
        elValidBtn.enabled = isValid;
        elValidBtn.SetPanelEvent('onmouseover', () => {
            if (!isValid)
                UiToolkitAPI.ShowTextTooltip('NameableValidBtn', '#tooltip_nameable_invalid');
        });
        elValidBtn.SetPanelEvent('onmouseout', () => {
            UiToolkitAPI.HideTextTooltip();
        });
        if (bApplyToItem) {
            _RefreshItemPresentationWithUpdatedName(false, elTextEntry.text);
        }
    }
    ;
    function _NameTagAcquired(nameTagId) {
        const tool_id = InspectShared.GetPopupSetting('tool_id');
        if (!tool_id) {
            if (ItemInfo.IsNameTag(nameTagId)) {
                InspectShared.SetPopupSetting('tool_id', nameTagId);
                $.DispatchEvent('HideStoreStatusPanel');
                InspectShared.SetPopupSetting('purchase_item_id', ''); // Already purchased one. Don't need to sell you another for this item
                _SetUpPanelElements($.GetContextPanel());
                _AcknowlegeNameTags();
            }
        }
    }
    ;
    function _AcknowlegeNameTags() {
        const bShouldAcknowledge = true;
        AcknowledgeItems.GetItemsByType(['name tag'], bShouldAcknowledge);
    }
    ;
    function _UpdateInspectMap() {
        InspectModelImage.SwitchMap($.GetContextPanel());
    }
    function ClosePopup() {
        const elAsyncActionBarPanel = $.GetContextPanel().FindChildInLayoutFile('PopUpInspectAsyncBar');
        const elPurchase = $.GetContextPanel().FindChildInLayoutFile('PopUpInspectPurchaseBar');
        if (!elAsyncActionBarPanel.BHasClass('hidden')) {
            InspectAsyncActionBar.OnEventToClose();
        }
        else if (!elPurchase.BHasClass('hidden')) {
            InspectPurchaseBar.ClosePopup();
        }
    }
    CapabilityNameable.ClosePopup = ClosePopup;
    ;
    $.RegisterForUnhandledEvent('PanoramaComponent_Store_PurchaseCompleted', _NameTagAcquired);
    $.RegisterForUnhandledEvent('CSGOShowMainMenu', Init);
    $.RegisterForUnhandledEvent('PopulateLoadingScreen', ClosePopup);
    $.RegisterForUnhandledEvent("CSGOInspectBackgroundMapChanged", _UpdateInspectMap);
})(CapabilityNameable || (CapabilityNameable = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfY2FwYWJpbGl0eV9uYW1lYWJsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3BvcHVwcy9wb3B1cF9jYXBhYmlsaXR5X25hbWVhYmxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFDckMsc0NBQXNDO0FBQ3RDLG1EQUFtRDtBQUNuRCxzREFBc0Q7QUFDdEQsbURBQW1EO0FBQ25ELGtEQUFrRDtBQUNsRCxnREFBZ0Q7QUFFaEQsSUFBVSxrQkFBa0IsQ0FxVDNCO0FBclRELFdBQVUsa0JBQWtCO0lBRTNCLFNBQWdCLElBQUk7UUFFbkIsTUFBTSxNQUFNLEdBQUcsYUFBYSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQVcsQ0FBQztRQUVsRSxJQUFLLFFBQVEsQ0FBQyxRQUFRLENBQUUsTUFBTSxDQUFFLElBQUksUUFBUSxDQUFDLE9BQU8sQ0FBRSxNQUFNLENBQUUsRUFDOUQsRUFBRSwrQ0FBK0M7WUFDaEQsYUFBYSxDQUFDLGVBQWUsQ0FBRSxzQkFBc0IsRUFBRSxZQUFZLENBQUMsOEJBQThCLENBQUUsTUFBTSxFQUFFLHFCQUFxQixFQUFFLENBQUUsQ0FBQyxDQUFDO1NBQ3ZJO2FBRUQ7WUFDQyxhQUFhLENBQUMsZUFBZSxDQUFFLHNCQUFzQixFQUFFLE1BQU0sQ0FBRSxDQUFDO1NBQ2hFO1FBRUQscUNBQXFDO1FBQ3JDLE1BQU0sT0FBTyxHQUFHLFlBQVksQ0FBQyxxQkFBcUIsQ0FBRSxNQUFNLENBQUUsQ0FBQztRQUM3RCxNQUFNLFlBQVksR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDekMsWUFBWSxDQUFDLFdBQVcsQ0FBRSxlQUFlLEVBQUUsQ0FBRSxPQUFPLEtBQUssUUFBUSxDQUFFLENBQUUsQ0FBQztRQUV0RSxtQkFBbUIsQ0FBRSxZQUFZLENBQUUsQ0FBQztRQUVwQyxDQUFDLENBQUMsUUFBUSxDQUFFLENB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