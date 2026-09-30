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
    const m_szRemoveKeychainToolChargesForPurchase = 'Remove Keychain Tool Pack'; // this is what user must buy to refill charges
    function Init() {
        InspectShared.SetPopupSetting('is_apply_remove_item', true);
        const itemId = InspectShared.GetPopupSetting('item_id');
        const toolId = InspectShared.GetPopupSetting('tool_id');
        const worktype = InspectShared.GetPopupSetting('work_type');
        const isRemove = _IsRemove(worktype);
        if (isRemove) {
            if (!itemId) {
                //Add error dialog here
                ClosePopUp();
                return;
            }
        }
        else {
            // if we are applying a keychain, then duplicate off the item into a temp item
            // and then force-apply the keychain in code for the simulation to be easy
            if (worktype === 'can_keychain' || worktype === 'can_sticker') {
                const tempCreatedItem = InventoryAPI.CreateTempCombinedItemWithTool(itemId, toolId);
                $.Msg(`CreateTempCombinedItemWithTool( ${itemId}, ${toolId} ) --> ${tempCreatedItem}`);
                if (!tempCreatedItem) {
                    ClosePopUp();
                    return;
                }
                InspectShared.SetPopupSetting('temp_display_item_id', tempCreatedItem);
            }
            if ((worktype === 'can_wrap_sticker') && toolId) {
                const tempCreatedItem = InventoryAPI.CreateTempCombinedItemWithTool(itemId, toolId);
                $.Msg(`CreateTempCombinedItemWithTool( ${itemId}, ${toolId} ) --> ${tempCreatedItem}`);
                if (!tempCreatedItem) {
                    ClosePopUp();
                    return;
                }
                InspectShared.SetPopupSetting('temp_display_item_id', tempCreatedItem);
            }
            if (worktype === 'craft_souvenir') {
                const craftSouvenirFauxTool = 'craft_souvenir:' + InspectShared.GetPopupSetting('umid_souvenir');
                const tempCreatedItem = InventoryAPI.CreateTempCombinedItemWithTool(itemId, craftSouvenirFauxTool);
                $.Msg(`CreateTempCombinedItemWithTool( ${itemId}, ${craftSouvenirFauxTool} ) --> ${tempCreatedItem}`);
                if (!tempCreatedItem) {
                    ClosePopUp();
                    return;
                }
                // Find how many credits our player currently owns?
                let nRedeemableBalance = 0;
                {
                    const idxLookup = InventoryAPI.GetCacheTypeElementIndexByKey('SeasonalOperations', g_ActiveTournamentInfo.credits_id);
                    if (g_ActiveTournamentInfo.credits_id == InventoryAPI.GetCacheTypeElementFieldByIndex('SeasonalOperations', idxLookup, 'season_value')) {
                        // This could come back "undefined" or "null" and should be treated as zero
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
        // Stickers scraping doesn't close the popup but updates the model.  So we register this event so we know when to update the model.
        if (worktype === "remove_sticker") {
            $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', CapabilityCanSticker.OnFinishedScratch);
        }
        $.DispatchEvent('CapabilityPopupIsOpen', true);
        // If the user is trying to remove charms, have zero charges, but own charm charges, then instead go to
        // the interface for them to use their charm charges first
        if (worktype === 'remove_keychain') {
            const numKeychainRemoveToolChargesRemaining = InventoryAPI.GetCacheTypeElementFieldByIndex('KeychainRemoveToolCharges', 0, 'charges');
            if (numKeychainRemoveToolChargesRemaining > 0) {
                $.Msg(`Remove Keychain Popup: ${numKeychainRemoveToolChargesRemaining} charges owned`);
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
                    $.Msg(`User has no keychain remove charges, but has an item to activate: ${ownedKeychainRemoveChargesID} -- offering useitem for it`);
                    ClosePopUp();
                    // Offer the user to immediately use their newly purchased charges
                    // we must do it via event so that it was properly queued up after the
                    // event forcing all popups to close
                    const elPanel = $.DispatchEvent("ShowCustomLayoutPopupParametersAsEvent", '', 'file://{resources}/layout/popups/popup_inventory_inspect.xml', 'item_id=' + ownedKeychainRemoveChargesID +
                        ',' + 'work_type=useitem');
                }
                else {
                    $.Msg(`User has no keychain remove charges, will see purchase bar to buy: ${m_szRemoveKeychainToolChargesForPurchase}`);
                }
            }
        }
    }
    CapabilityCanApplyAction.Init = Init;
    //--------------------------------------------------------------------------------------------------
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
    //--------------------------------------------------------------------------------------------------
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
        //$.GetContextPanel().SetAttributeString( 'toolid', toolId );
        const worktype = InspectShared.GetPopupSetting('work_type');
        const itemId = InspectShared.GetPopupSetting('item_id');
        const elAsyncActionBarPanel = $.GetContextPanel().FindChildInLayoutFile('PopUpInspectAsyncBar');
        InspectAsyncActionBar.Init();
        //
        // If an action requires a purchased tool, then upsell it:
        //
        const elPurchase = $.GetContextPanel().FindChildInLayoutFile('PopUpInspectPurchaseBar');
        let bConfigurePurchaseBar = false;
        let mustPurchaseItemID = '';
        if (worktype === 'can_wrap_sticker' && InventoryAPI.IsFauxItemID(itemId)) {
            // We are showing a preview of "encapsulation", but the user actually must purchase
            // a new Sticker Slab to encapsulate the sticker, so the action bar will be the "purchase bar"
            bConfigurePurchaseBar = true;
            mustPurchaseItemID = itemId;
        }
        if (worktype === 'remove_keychain' || worktype === 'can_keychain') {
            bConfigurePurchaseBar = true;
            if (worktype === 'remove_keychain') { // only offer purchasing keychain remove charges if the user doesn't have any charges currently
                const numKeychainRemoveToolChargesRemaining = InventoryAPI.GetCacheTypeElementFieldByIndex('KeychainRemoveToolCharges', 0, 'charges');
                // numKeychainRemoveToolChargesRemaining = 0; // to test purchase of charm detachments
                const defidxForPurchase = (numKeychainRemoveToolChargesRemaining > 0) ? 0 : InventoryAPI.GetItemDefinitionIndexFromDefinitionName(m_szRemoveKeychainToolChargesForPurchase);
                if (defidxForPurchase) {
                    mustPurchaseItemID = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(defidxForPurchase, 0);
                }
            }
        }
        if (elPurchase && bConfigurePurchaseBar) {
            if (mustPurchaseItemID) {
                InspectShared.SetPopupSetting('purchase_item_id', mustPurchaseItemID);
                $.GetContextPanel().SetAttributeString('toolid', ''); // force showing "This action requires ..." upsell purchase string
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
            $.Msg('_OnStorePurchaseCompleted (remove keychain charges): ' + ItemId);
            $.DispatchEvent('HideStoreStatusPanel');
            const bAutoAcknowledge = true;
            AcknowledgeItems.GetItemsByType([m_szRemoveKeychainToolChargesForPurchase], bAutoAcknowledge);
            ClosePopUp();
            // Offer the user to immediately use their newly purchased charges
            // we must do it via event so that it was properly queued up after the
            // event forcing all popups to close
            $.DispatchEvent("ShowCustomLayoutPopupParametersAsEvent", '', 'file://{resources}/layout/popups/popup_inventory_inspect.xml', 'item_id=' + ItemId +
                ',' + 'work_type=useitem');
        }
        const worktype = InspectShared.GetPopupSetting('work_type');
        const itemId = InspectShared.GetPopupSetting('item_id');
        const toolId = InspectShared.GetPopupSetting('tool_id');
        if (worktype === 'can_wrap_sticker' &&
            InventoryAPI.IsFauxItemID(itemId) &&
            InventoryAPI.DoesItemMatchDefinitionByName(ItemId, "sticker_display_case")) {
            $.Msg('_OnStorePurchaseCompleted (sticker slab): ' + ItemId);
            $.DispatchEvent('HideStoreStatusPanel');
            const bAutoAcknowledge = true;
            AcknowledgeItems.GetItemsByType(["sticker_display_case"], bAutoAcknowledge);
            ClosePopUp();
            // Offer the user to immediately use their newly purchased sticker slab
            // we must do it via event so that it was properly queued up after the
            // event forcing all popups to close
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
    //--------------------------------------------------------------------------------------------------
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
    // Entry point called when panel is created
    {
        // Got a new item from a case
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
//--------------------------------------------------------------------------------------------------
// Sticker specific funtions
//--------------------------------------------------------------------------------------------------
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
            // no need to reset the position of the gun its the first time and already in default position.
            // intro anim logic will play from inspect.ts
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
            InventoryAPI.WearItemSticker(itemId, slotIndex, 111); // remove the sticker
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
                        $.Msg(`InventoryAPI.WearItemSticker( ${itemId}, ${slotIndex}, ${valTargetWear} ) ignored because wear is already at ${elStickerScrapeLevelSlider.default}`);
                        InspectAsyncActionBar.ResetTimeouthandle();
                        const elAsyncActionBarPanel = popup_panel.FindChildInLayoutFile('PopUpInspectAsyncBar');
                        InspectAsyncActionBar.OnCloseRemove(elAsyncActionBarPanel);
                        return; // this button is "disabled" and performs no scraping
                    }
                }
            }
            $.Msg(`InventoryAPI.WearItemSticker( ${itemId}, ${slotIndex}, ${valTargetWear} )`);
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
        // Last scratch so the panel is going to close from the 'PanoramaComponent_Inventory_ItemCustomizationNotification' event
        // in the Asyncbar.
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfY2FwYWJpbGl0eV9jYW5fc3RpY2tlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3BvcHVwcy9wb3B1cF9jYXBhYmlsaXR5X2Nhbl9zdGlja2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFDckMsc0NBQXNDO0FBQ3RDLDhDQUE4QztBQUM5QyxzREFBc0Q7QUFDdEQseURBQXlEO0FBQ3pELHNEQUFzRDtBQUN0RCxxREFBcUQ7QUFDckQsa0RBQWtEO0FBQ2xELGtEQUFrRDtBQUNsRCxnREFBZ0Q7QUFFaEQsSUFBVSx3QkFBd0IsQ0F1ZGpDO0FBdmRELFdBQVUsd0JBQXdCO0lBRWpDLE1BQU0sd0NBQXdDLEdBQUcsMkJBQTJCLENBQUMsQ0FBQywrQ0FBK0M7SUFFN0gsU0FBZ0IsSUFBSTtRQUVuQixhQUFhLENBQUMsZUFBZSxDQUFFLHNCQUFzQixFQUFFLElBQUksQ0FBRSxDQUFDO1FBQzlELE1BQU0sTUFBTSxHQUFHLGFBQWEsQ0FBQyxlQUFlLENBQUUsU0FBUyxDQUFZLENBQUM7UUFDcEUsTUFBTSxNQUFNLEdBQUcsYUFBYSxDQUFDLGVBQWUsQ0FBRSxTQUFTLENBQVksQ0FBQztRQUVwRSxNQUFNLFFBQVEsR0FBRyxhQUFhLENBQUMsZUFBZSxDQUFFLFdBQVcsQ0FBWSxDQUFDO1FBQ3hFLE1BQU0sUUFBUSxHQUFHLFNBQVMsQ0FBRSxRQUFRLENBQUUsQ0FBQztRQUV2QyxJQUFLLFFBQVEsRUFDYjtZQUNDLElBQUssQ0FBQyxNQUFNLEVBQ1o7Z0JBQ0MsdUJBQXVCO2dCQUN2QixVQUFVLEVBQUUsQ0FBQztnQkFDYixPQUFPO2FBQ1A7U0FDRDthQUVEO1lBQ0MsOEVBQThFO1lBQzlFLDBFQUEwRTtZQUMxRSxJQUFLLFFBQVEsS0FBSyxjQUFjLElBQUksUUFBUSxLQUFLLGFBQWEsRUFDOUQ7Z0JBQ0MsTUFBTSxlQUFlLEdBQUcs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