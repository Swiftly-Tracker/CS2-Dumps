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
        if (ItemInfo.IsWeapon(itemId) || ItemInfo.IsMelee(itemId)) {
            InspectShared.SetPopupSetting('temp_display_item_id', InventoryAPI.CreateTempCombinedItemWithTool(itemId, _GetNameTagFauxItemID()));
        }
        else {
            InspectShared.SetPopupSetting('temp_display_item_id', itemId);
        }
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
        CapabilityHeader.Init();
        _SetItemModel(InspectShared.GetPopupSetting('temp_display_item_id'));
        const noTool = (toolId === '');
        const hasName = InventoryAPI.HasCustomName(itemId);
        _SetUpButtonStates(itemId, hasName, noTool, contextPanel);
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
        const temp = UiToolkitAPI.ShowGenericPopupOkCancel($.Localize('#popup_nameable_remove_confirm_title'), $.Localize('#tooltip_nameable_remove'), '', () => {
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
                InspectShared.SetPopupSetting('purchase_item_id', '');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfY2FwYWJpbGl0eV9uYW1lYWJsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3BvcHVwcy9wb3B1cF9jYXBhYmlsaXR5X25hbWVhYmxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFDckMsc0NBQXNDO0FBQ3RDLG1EQUFtRDtBQUNuRCxzREFBc0Q7QUFDdEQsbURBQW1EO0FBQ25ELGtEQUFrRDtBQUNsRCxnREFBZ0Q7QUFFaEQsSUFBVSxrQkFBa0IsQ0FxVDNCO0FBclRELFdBQVUsa0JBQWtCO0lBRTNCLFNBQWdCLElBQUk7UUFFbkIsTUFBTSxNQUFNLEdBQUcsYUFBYSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQVcsQ0FBQztRQUVsRSxJQUFLLFFBQVEsQ0FBQyxRQUFRLENBQUUsTUFBTSxDQUFFLElBQUksUUFBUSxDQUFDLE9BQU8sQ0FBRSxNQUFNLENBQUUsRUFDOUQ7WUFDQyxhQUFhLENBQUMsZUFBZSxDQUFFLHNCQUFzQixFQUFFLFlBQVksQ0FBQyw4QkFBOEIsQ0FBRSxNQUFNLEVBQUUscUJBQXFCLEVBQUUsQ0FBRSxDQUFDLENBQUM7U0FDdkk7YUFFRDtZQUNDLGFBQWEsQ0FBQyxlQUFlLENBQUUsc0JBQXNCLEVBQUUsTUFBTSxDQUFFLENBQUM7U0FDaEU7UUFHRCxNQUFNLE9BQU8sR0FBRyxZQUFZLENBQUMscUJBQXFCLENBQUUsTUFBTSxDQUFFLENBQUM7UUFDN0QsTUFBTSxZQUFZLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQ3pDLFlBQVksQ0FBQyxXQUFXLENBQUUsZUFBZSxFQUFFLENBQUUsT0FBTyxLQUFLLFFBQVEsQ0FBRSxDQUFFLENBQUM7UUFFdEUsbUJBQW1CLENBQUUsWUFBWSxDQUFFLENBQUM7UUFFcEMsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxDQUFDLEVBQUUsR0FBRSxFQUFFLEdBQUUsWUFB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