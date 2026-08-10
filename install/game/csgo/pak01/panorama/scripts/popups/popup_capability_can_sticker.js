"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../inspect.ts" />
/// <reference path="../common/iteminfo.ts" />
/// <reference path="popup_inspect_purchase-bar.ts" />
/// <reference path="popup_capability_can_keychain.ts" />
/// <reference path="popup_capability_can_patch.ts" />
/// <reference path="popup_can_apply_pick_slot.ts" />
/// <reference path="popup_can_apply_header.ts" />
/// <reference path="popup_acknowledge_item.ts" />
/// <reference path="popup_inspect_shared.ts" />
var CapabilityCanApplyAction;
(function (CapabilityCanApplyAction) {
    const m_szRemoveKeychainToolChargesForPurchase = 'Remove Keychain Tool Pack';
    function Init() {
        InspectShared.SetPopupSetting('is_apply_remove_item', true);
        const itemId = InspectShared.GetPopupSetting('item_id');
        const toolId = InspectShared.GetPopupSetting('tool_id');
        const worktype = InspectShared.GetPopupSetting('work_type');
        const isRemove = _IsRemove(worktype);
        if (isRemove) {
            if (!itemId) {
                ClosePopUp();
                return;
            }
        }
        else {
            if (worktype === 'can_keychain' || worktype === 'can_sticker') {
                const tempCreatedItem = InventoryAPI.CreateTempCombinedItemWithTool(itemId, toolId);
                if (!tempCreatedItem) {
                    ClosePopUp();
                    return;
                }
                InspectShared.SetPopupSetting('temp_display_item_id', tempCreatedItem);
            }
            if ((worktype === 'can_wrap_sticker') && toolId) {
                const tempCreatedItem = InventoryAPI.CreateTempCombinedItemWithTool(itemId, toolId);
                if (!tempCreatedItem) {
                    ClosePopUp();
                    return;
                }
                InspectShared.SetPopupSetting('temp_display_item_id', tempCreatedItem);
            }
            if (worktype === 'craft_souvenir') {
                const craftSouvenirFauxTool = 'craft_souvenir:' + InspectShared.GetPopupSetting('umid_souvenir');
                const tempCreatedItem = InventoryAPI.CreateTempCombinedItemWithTool(itemId, craftSouvenirFauxTool);
                if (!tempCreatedItem) {
                    ClosePopUp();
                    return;
                }
                let nRedeemableBalance = 0;
                {
                    const idxLookup = InventoryAPI.GetCacheTypeElementIndexByKey('SeasonalOperations', g_ActiveTournamentInfo.credits_id);
                    if (g_ActiveTournamentInfo.credits_id == InventoryAPI.GetCacheTypeElementFieldByIndex('SeasonalOperations', idxLookup, 'season_value')) {
                        nRedeemableBalance = InventoryAPI.GetCacheTypeElementFieldByIndex('SeasonalOperations', idxLookup, 'redeemable_balance');
                        nRedeemableBalance = (nRedeemableBalance === null || nRedeemableBalance === undefined) ? 0 : nRedeemableBalance;
                    }
                }
                InspectShared.SetPopupSetting('temp_display_item_id', tempCreatedItem);
                InspectShared.SetPopupSetting('credits_owned_souvenir', nRedeemableBalance);
            }
        }
        let oSettings = {
            headerPanel: $.GetContextPanel().FindChildInLayoutFile('PopUpCanApplyHeader'),
            infoPanel: $.GetContextPanel().FindChildInLayoutFile('PopUpCanApplyPickSlot'),
            asyncBarPanel: $.GetContextPanel().FindChildInLayoutFile('PopUpInspectAsyncBar'),
            contextPanel: $.GetContextPanel(),
            itemId: InspectShared.GetPopupSetting('temp_display_item_id') ? InspectShared.GetPopupSetting('temp_display_item_id') : itemId,
            toolId: toolId,
            isRemove: (worktype === 'can_wrap_sticker') ? true
                : isRemove,
            type: (worktype === 'can_wrap_sticker') ? 'keychain'
                : (worktype.indexOf('sticker') !== -1) ? 'sticker'
                    : (worktype.indexOf('patch') !== -1) ? 'patch'
                        : (worktype.indexOf('keychain') !== -1) ? 'keychain'
                            : '',
            funcOnConfirm: _OnConfirmPressed,
            funcOnNext: _OnNextPressed,
            funcOnCancel: _OnCancelPressed,
            funcOnSelectForRemove: _OnSelectForRemove
        };
        CanApplyHeader.Init(oSettings);
        CanApplySlotInfo.ResetSlotIndex();
        CapabilityCanPatch.ResetPos();
        CapabilityCanKeychain.ResetPos();
        CanApplySlotInfo.UpdateEmptySlotList(itemId);
        CanApplyPickSlot.Init(oSettings);
        $.GetContextPanel().Data().oApplySettings = oSettings;
        _SetItemModel(toolId, itemId, isRemove);
        _SetUpAsyncActionBar(toolId);
        _UpdateEnableDisableOkBtn(false, oSettings);
        if (oSettings.isRemove && ((oSettings.type === 'keychain')
            || (oSettings.type === 'sticker' && !!InspectShared.GetPopupSetting('remove_sticker_all_at_once')))) {
            _OnConfirmPressed(oSettings);
        }
        if (worktype === "remove_sticker") {
            $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', CapabilityCanSticker.OnFinishedScratch);
        }
        $.DispatchEvent('CapabilityPopupIsOpen', true);
        if (worktype === 'remove_keychain') {
            const numKeychainRemoveToolChargesRemaining = InventoryAPI.GetCacheTypeElementFieldByIndex('KeychainRemoveToolCharges', 0, 'charges');
            if (numKeychainRemoveToolChargesRemaining > 0) {
            }
            else {
                let ownedKeychainRemoveChargesID = '';
                const bAutoAcknowledge = true;
                const unackItems = AcknowledgeItems.GetItemsByType([m_szRemoveKeychainToolChargesForPurchase], bAutoAcknowledge);
                if (unackItems && unackItems.length > 0) {
                    ownedKeychainRemoveChargesID = unackItems[0];
                }
                if (!ownedKeychainRemoveChargesID) {
                    InventoryAPI.SetInventorySortAndFilters('inv_sort_age', false, 'item_definition:' + m_szRemoveKeychainToolChargesForPurchase, '', '');
                    const countOfChargeItemsOwned = InventoryAPI.GetInventoryCount();
                    if (countOfChargeItemsOwned > 0) {
                        ownedKeychainRemoveChargesID = InventoryAPI.GetInventoryItemIDByIndex(0);
                    }
                }
                if (ownedKeychainRemoveChargesID) {
                    ClosePopUp();
                    const elPanel = $.DispatchEvent("ShowCustomLayoutPopupParametersAsEvent", '', 'file://{resources}/layout/popups/popup_inventory_inspect.xml', 'item_id=' + ownedKeychainRemoveChargesID +
                        ',' + 'work_type=useitem');
                }
                else {
                }
            }
        }
    }
    CapabilityCanApplyAction.Init = Init;
    function _IsRemove(worktype) {
        return (worktype === "remove_sticker" || worktype === "remove_patch" || worktype === "remove_keychain");
    }
    function _OnConfirmPressed(oSettings) {
        $.DispatchEvent('CSGOPlaySoundEffect', 'generic_button_press', 'MOUSE');
        _SetSelectedSlot(CanApplySlotInfo.GetSelectedEmptySlot(), oSettings);
        _UpdateEnableDisableOkBtn(true, oSettings);
        InspectAsyncActionBar.EnableDisableChangeSceneryBtn(false, oSettings.contextPanel.FindChildInLayoutFile('PopUpInspectAsyncBar'));
    }
    function _OnNextPressed(itemToApplyId, activeSlot, oSettings) {
        const worktype = InspectShared.GetPopupSetting('work_type', oSettings.contextPanel);
        _UpdateEnableDisableOkBtn(false, oSettings);
        if (worktype === 'can_sticker' || worktype === 'can_keychain') {
            CapabilityCanSticker.NextStickerButtonPressed(oSettings.contextPanel);
        }
        else if (worktype === 'can_patch') {
            CapabilityCanPatch.PreviewPatchOnChar(itemToApplyId, activeSlot, oSettings.contextPanel);
        }
    }
    function _OnCancelPressed(oSettings) {
        _UpdateEnableDisableOkBtn(false, oSettings);
        InspectAsyncActionBar.EnableDisableChangeSceneryBtn(true, oSettings.contextPanel.FindChildInLayoutFile('PopUpInspectAsyncBar'));
    }
    function _StickerPlacementUpdated() {
        const elParent = $.GetContextPanel().FindChildInLayoutFile('PopUpCanApplyPickSlot');
        const elCancelBtn = elParent.FindChildInLayoutFile('CanApplyCancel');
        if (elCancelBtn.visible)
            $.DispatchEvent("Activated", elParent.FindChildInLayoutFile('CanApplyCancel'), "mouse");
    }
    function _OnSelectForRemove(slotIndex, oSettings) {
        const worktype = InspectShared.GetPopupSetting('work_type', oSettings.contextPanel);
        if (worktype === 'remove_sticker') {
            _SetSelectedSlot(slotIndex, oSettings);
            CanApplyPickSlot.UpdateSelectedRemoveForSticker(slotIndex, oSettings);
            _UpdateEnableDisableOkBtn(true, oSettings);
        }
        else if (worktype === 'remove_patch') {
            _SetSelectedSlot(slotIndex, oSettings);
            _UpdateEnableDisableOkBtn(true, oSettings);
            CapabilityCanPatch.CameraAnim(slotIndex, oSettings.contextPanel);
        }
    }
    function _UpdateEnableDisableOkBtn(bEnable, oSettings) {
        const elAsyncActionBarPanel = oSettings.contextPanel.FindChildInLayoutFile('PopUpInspectAsyncBar');
        InspectAsyncActionBar.EnableDisableOkBtn(elAsyncActionBarPanel, bEnable);
        return;
    }
    function _SetSelectedSlot(slotIndex, oSettings) {
        oSettings.asyncBarPanel.SetAttributeString('selectedItemToApplySlot', slotIndex.toString());
    }
    function _UpdateInspectMap() {
        InspectModelImage.SwitchMap($.GetContextPanel());
        const worktype = InspectShared.GetPopupSetting('work_type');
        if (worktype === 'can_patch') {
            CapabilityCanPatch.ResetPos();
        }
        InspectAsyncActionBar.ZoomCamera(true, $.GetContextPanel().FindChildInLayoutFile('PopUpInspectAsyncBar'));
        _UpdateItemToApplyPreview(InspectShared.GetPopupSetting('tool_id'), $.GetContextPanel());
    }
    function _SetItemModel(toolId, itemId, m_isRemove) {
        if (!InventoryAPI.IsItemInfoValid(itemId))
            return;
        const elPreviewPanel = $.GetContextPanel().FindChildInLayoutFile('CanApplyItemModel');
        const worktype = InspectShared.GetPopupSetting('work_type');
        const displayItemId = InspectShared.GetPopupSetting('temp_display_item_id');
        InspectModelImage.Init(elPreviewPanel, displayItemId ? displayItemId : itemId);
        elPreviewPanel.Data().id = itemId;
        if (m_isRemove) {
            if (worktype === 'remove_patch') {
                $.Schedule(.3, () => CanApplyPickSlot.SelectFirstRemoveItem());
            }
        }
        else {
            _UpdateItemToApplyPreview(toolId, $.GetContextPanel());
        }
    }
    function _UpdateItemToApplyPreview(toolId, contextPanel) {
        const worktype = InspectShared.GetPopupSetting('work_type');
        if (worktype === 'can_sticker') {
            CapabilityCanSticker.PreviewStickerInSlot(toolId, CanApplySlotInfo.GetSelectedEmptySlot());
        }
        if (worktype === 'can_patch') {
            $.Schedule(.3, () => CapabilityCanPatch.PreviewPatchOnChar(toolId, CanApplySlotInfo.GetSelectedEmptySlot(), contextPanel));
        }
    }
    function _SetUpAsyncActionBar(toolId) {
        const worktype = InspectShared.GetPopupSetting('work_type');
        const itemId = InspectShared.GetPopupSetting('item_id');
        const elAsyncActionBarPanel = $.GetContextPanel().FindChildInLayoutFile('PopUpInspectAsyncBar');
        InspectAsyncActionBar.Init();
        const elPurchase = $.GetContextPanel().FindChildInLayoutFile('PopUpInspectPurchaseBar');
        let bConfigurePurchaseBar = false;
        let mustPurchaseItemID = '';
        if (worktype === 'can_wrap_sticker' && InventoryAPI.IsFauxItemID(itemId)) {
            bConfigurePurchaseBar = true;
            mustPurchaseItemID = itemId;
        }
        if (worktype === 'remove_keychain' || worktype === 'can_keychain') {
            bConfigurePurchaseBar = true;
            if (worktype === 'remove_keychain') {
                const numKeychainRemoveToolChargesRemaining = InventoryAPI.GetCacheTypeElementFieldByIndex('KeychainRemoveToolCharges', 0, 'charges');
                const defidxForPurchase = (numKeychainRemoveToolChargesRemaining > 0) ? 0 : InventoryAPI.GetItemDefinitionIndexFromDefinitionName(m_szRemoveKeychainToolChargesForPurchase);
                if (defidxForPurchase) {
                    mustPurchaseItemID = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(defidxForPurchase, 0);
                }
            }
        }
        if (elPurchase && bConfigurePurchaseBar) {
            if (mustPurchaseItemID) {
                InspectShared.SetPopupSetting('purchase_item_id', mustPurchaseItemID);
                $.GetContextPanel().SetAttributeString('toolid', '');
            }
            InspectPurchaseBar.Init();
            if (mustPurchaseItemID) {
                $.GetContextPanel().SetAttributeString('toolid', toolId);
                elAsyncActionBarPanel.AddClass('hidden');
            }
        }
    }
    function _OnStorePurchaseCompleted(ItemId) {
        if (InventoryAPI.DoesItemMatchDefinitionByName(ItemId, m_szRemoveKeychainToolChargesForPurchase)) {
            $.DispatchEvent('HideStoreStatusPanel');
            const bAutoAcknowledge = true;
            AcknowledgeItems.GetItemsByType([m_szRemoveKeychainToolChargesForPurchase], bAutoAcknowledge);
            ClosePopUp();
            $.DispatchEvent("ShowCustomLayoutPopupParametersAsEvent", '', 'file://{resources}/layout/popups/popup_inventory_inspect.xml', 'item_id=' + ItemId +
                ',' + 'work_type=useitem');
        }
        const worktype = InspectShared.GetPopupSetting('work_type');
        const itemId = InspectShared.GetPopupSetting('item_id');
        const toolId = InspectShared.GetPopupSetting('tool_id');
        if (worktype === 'can_wrap_sticker' &&
            InventoryAPI.IsFauxItemID(itemId) &&
            InventoryAPI.DoesItemMatchDefinitionByName(ItemId, "sticker_display_case")) {
            $.DispatchEvent('HideStoreStatusPanel');
            const bAutoAcknowledge = true;
            AcknowledgeItems.GetItemsByType(["sticker_display_case"], bAutoAcknowledge);
            ClosePopUp();
            const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('popup-inspect-' + ItemId, 'file://{resources}/layout/popups/popup_capability_can_keychain.xml');
            let oSettings = {
                popup_panel: elPanel,
                tool_id: toolId,
                item_id: ItemId,
                work_type: 'can_wrap_sticker'
            };
            elPanel.Data().oSettings = oSettings;
        }
    }
    ;
    function ClosePopUp() {
        const elAsyncActionBarPanel = $.GetContextPanel().FindChildInLayoutFile('PopUpInspectAsyncBar');
        const elPurchase = $.GetContextPanel().FindChildInLayoutFile('PopUpInspectPurchaseBar');
        if (!elAsyncActionBarPanel.BHasClass('hidden')) {
            InspectAsyncActionBar.OnEventToClose();
        }
        else if (elPurchase && elPurchase.IsValid() && !elPurchase.BHasClass('hidden')) {
            InspectPurchaseBar.ClosePopup();
        }
    }
    CapabilityCanApplyAction.ClosePopUp = ClosePopUp;
    function StickerScrapeClickedStickerIndex(stickerIndex) {
        _OnSelectForRemove(stickerIndex, $.GetContextPanel().Data().oApplySettings);
    }
    {
        let _m_PanelRegisteredForEventsStickerApply;
        if (!_m_PanelRegisteredForEventsStickerApply) {
            _m_PanelRegisteredForEventsStickerApply = $.RegisterForUnhandledEvent('CSGOShowMainMenu', Init);
            $.RegisterForUnhandledEvent('PanoramaComponent_Store_PurchaseCompleted', _OnStorePurchaseCompleted);
            $.RegisterForUnhandledEvent("CSGOInspectBackgroundMapChanged", _UpdateInspectMap);
            $.RegisterForUnhandledEvent("CS2StickerPreviewMoved", _StickerPlacementUpdated);
            $.RegisterForUnhandledEvent("CS2StickerScrapeClickedStickerIndex", StickerScrapeClickedStickerIndex);
            $.RegisterForUnhandledEvent('PopulateLoadingScreen', ClosePopUp);
        }
    }
})(CapabilityCanApplyAction || (CapabilityCanApplyAction = {}));
var CapabilityCanSticker;
(function (CapabilityCanSticker) {
    let m_isFinalScratch = false;
    let m_firstCameraAnim = false;
    function NextStickerButtonPressed(contextPanel) {
        const m_elPreviewPanel = contextPanel.FindChildInLayoutFile('CanApplyItemModel');
        const elPanel = m_elPreviewPanel.FindChildTraverse('ItemPreviewPanel') || null;
        if (elPanel != null) {
            $.DispatchEvent('CSGOPlaySoundEffect', 'sticker_nextPosition', 'MOUSE');
            InventoryAPI.OnNextStickerButtonPressed(elPanel);
        }
    }
    CapabilityCanSticker.NextStickerButtonPressed = NextStickerButtonPressed;
    function SetStickerScrapeLevel(valScrapeLevel, contextPanel) {
        const m_elPreviewPanel = contextPanel.FindChildInLayoutFile('CanApplyItemModel');
        const elPanel = m_elPreviewPanel.FindChildTraverse('ItemPreviewPanel') || null;
        if (elPanel != null) {
            InventoryAPI.SetStickerScrapeLevel(elPanel, valScrapeLevel);
        }
    }
    CapabilityCanSticker.SetStickerScrapeLevel = SetStickerScrapeLevel;
    function PreviewStickerInSlot(stickerId, slot) {
        $.DispatchEvent('CSGOPlaySoundEffect', 'sticker_nextPosition', 'MOUSE');
        const m_elPreviewPanel = $.GetContextPanel().FindChildInLayoutFile('CanApplyItemModel');
        const elPanel = m_elPreviewPanel.FindChildTraverse('ItemPreviewPanel') || null;
        InventoryAPI.PreviewStickerInModelPanel(stickerId, slot, elPanel);
    }
    CapabilityCanSticker.PreviewStickerInSlot = PreviewStickerInSlot;
    function CameraAnim(slot) {
        const m_elPreviewPanel = $.GetContextPanel().FindChildInLayoutFile('CanApplyItemModel');
        const elPanel = m_elPreviewPanel.FindChildTraverse('ItemPreviewPanel') || null;
        if (!m_firstCameraAnim) {
            m_firstCameraAnim = true;
            return;
        }
        InspectModelImage.SetItemCameraByWeaponType(m_elPreviewPanel.Data().id, elPanel, true);
        elPanel.SetRotation(0, 0, 1);
    }
    CapabilityCanSticker.CameraAnim = CameraAnim;
    function OnScratchSticker(itemId, slotIndex, bRemoveCompletely, popup_panel) {
        if (bRemoveCompletely || InventoryAPI.IsItemStickerAtExtremeWear(itemId, slotIndex)) {
            $.DispatchEvent('CSGOPlaySoundEffect', 'UI.StickerScratch', 'MOUSE');
            m_isFinalScratch = true;
            InspectAsyncActionBar.ResetTimeouthandle();
            InventoryAPI.WearItemSticker(itemId, slotIndex, 111);
            InspectAsyncActionBar.SetCallbackTimeout();
        }
        else {
            let valTargetWear = 0;
            const elStickerScrapeLevelContainer = popup_panel.FindChildInLayoutFile('PopUpCanApplyPickSlot').FindChildInLayoutFile('StickerScrapeLevelContainer');
            if (elStickerScrapeLevelContainer) {
                const elStickerScrapeLevelSlider = elStickerScrapeLevelContainer.FindChildInLayoutFile('StickerScrapeLevelSlider');
                if (elStickerScrapeLevelSlider) {
                    valTargetWear = elStickerScrapeLevelSlider.value;
                    if (valTargetWear <= elStickerScrapeLevelSlider.default) {
                        InspectAsyncActionBar.ResetTimeouthandle();
                        const elAsyncActionBarPanel = popup_panel.FindChildInLayoutFile('PopUpInspectAsyncBar');
                        InspectAsyncActionBar.OnCloseRemove(elAsyncActionBarPanel);
                        return;
                    }
                }
            }
            $.DispatchEvent('CSGOPlaySoundEffect', 'UI.StickerScratch', 'MOUSE');
            HighlightStickerBySlot(slotIndex);
            InventoryAPI.WearItemSticker(itemId, slotIndex, valTargetWear);
        }
    }
    CapabilityCanSticker.OnScratchSticker = OnScratchSticker;
    function HighlightStickerBySlot(slotIndex) {
        InventoryAPI.HighlightStickerBySlot(slotIndex);
    }
    CapabilityCanSticker.HighlightStickerBySlot = HighlightStickerBySlot;
    function OnFinishedScratch() {
        if (m_isFinalScratch || !$.GetContextPanel()) {
            return;
        }
        const m_elPreviewPanel = $.GetContextPanel().FindChildInLayoutFile('CanApplyItemModel');
        const elAsyncActionBarPanel = $.GetContextPanel().FindChildInLayoutFile('PopUpInspectAsyncBar');
        InspectAsyncActionBar.ResetTimeouthandle();
        InspectAsyncActionBar.OnCloseRemove(elAsyncActionBarPanel);
        InspectModelImage.UpdateModelOnly(m_elPreviewPanel.Data().id);
        const elStickersToRemove = $.GetContextPanel().FindChildInLayoutFile('PopUpCanApplyPickSlot').FindChildInLayoutFile('CanStickerItemIcons');
        if (elStickersToRemove && InspectShared.GetPopupSetting('work_type') === "remove_patch") {
            const panelsList = elStickersToRemove.Children();
            panelsList.forEach(element => element.enabled = true);
        }
        if (elStickersToRemove && InspectShared.GetPopupSetting('work_type') === "remove_sticker") {
            const panelsList = elStickersToRemove.Children();
            panelsList.forEach(element => { if (element.checked) {
                $.DispatchEvent("Activated", element, "mouse");
            } });
        }
    }
    CapabilityCanSticker.OnFinishedScratch = OnFinishedScratch;
})(CapabilityCanSticker || (CapabilityCanSticker = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfY2FwYWJpbGl0eV9jYW5fc3RpY2tlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3BvcHVwcy9wb3B1cF9jYXBhYmlsaXR5X2Nhbl9zdGlja2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFDckMsc0NBQXNDO0FBQ3RDLDhDQUE4QztBQUM5QyxzREFBc0Q7QUFDdEQseURBQXlEO0FBQ3pELHNEQUFzRDtBQUN0RCxxREFBcUQ7QUFDckQsa0RBQWtEO0FBQ2xELGtEQUFrRDtBQUNsRCxnREFBZ0Q7QUFFaEQsSUFBVSx3QkFBd0IsQ0F1ZGpDO0FBdmRELFdBQVUsd0JBQXdCO0lBRWpDLE1BQU0sd0NBQXdDLEdBQUcsMkJBQTJCLENBQUM7SUFFN0UsU0FBZ0IsSUFBSTtRQUVuQixhQUFhLENBQUMsZUFBZSxDQUFFLHNCQUFzQixFQUFFLElBQUksQ0FBRSxDQUFDO1FBQzlELE1BQU0sTUFBTSxHQUFHLGFBQWEsQ0FBQyxlQUFlLENBQUUsU0FBUyxDQUFZLENBQUM7UUFDcEUsTUFBTSxNQUFNLEdBQUcsYUFBYSxDQUFDLGVBQWUsQ0FBRSxTQUFTLENBQVksQ0FBQztRQUVwRSxNQUFNLFFBQVEsR0FBRyxhQUFhLENBQUMsZUFBZSxDQUFFLFdBQVcsQ0FBWSxDQUFDO1FBQ3hFLE1BQU0sUUFBUSxHQUFHLFNBQVMsQ0FBRSxRQUFRLENBQUUsQ0FBQztRQUV2QyxJQUFLLFFBQVEsRUFDYjtZQUNDLElBQUssQ0FBQyxNQUFNLEVBQ1o7Z0JBRUMsVUFBVSxFQUFFLENBQUM7Z0JBQ2IsT0FBTzthQUNQO1NBQ0Q7YUFFRDtZQUdDLElBQUssUUFBUSxLQUFLLGNBQWMsSUFBSSxRQUFRLEtBQUssYUFBYSxFQUM5RDtnQkFDQyxNQUFNLGVBQWUsR0FBRyxZQUFZLENBQUMsOEJBQThCLENBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBRSxDQUFDO2dCQUl0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