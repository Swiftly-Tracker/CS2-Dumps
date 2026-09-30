"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="popup_capability_header.ts" />
/// <reference path="popup_acknowledge_item.ts" />
/// <reference path="../common/iteminfo.ts" />
/// <reference path="../inspect.ts" />
/// <reference path="popup_inspect_async-bar.ts" />
/// <reference path="popup_inspect_header.ts" />
/// <reference path="popup_acknowledge_item.ts" />
/// <reference path="popup_offers_laptop_interface.ts" />
// - countdown
// - event for end ans to drive new item display
// - warnings
var OffersLaptop;
(function (OffersLaptop) {
    let m_aItemsInLootlist = [];
    let m_itemid = '';
    let m_isOpen = false;
    let m_InspectPanel = $.GetContextPanel();
    let m_unusualItemImagePath = '';
    let m_showInspectScheduleHandle = null;
    let m_specialItemId = 'id-special-item';
    let m_elCaseModelImagePanel = null;
    //
    // Looping sounds controller
    //
    let m_bReadyForDisplay = false;
    let m_LoopingSounds = {}; // sound handles
    function LaptopSoundPlayOnce(s) {
        if (!m_bReadyForDisplay)
            return;
        $.DispatchEvent("CSGOPlaySoundEffect", s, "MOUSE");
    }
    OffersLaptop.LaptopSoundPlayOnce = LaptopSoundPlayOnce;
    function LaptopSoundStartLooping(s) {
        if (!m_bReadyForDisplay)
            return;
        if (!s)
            return;
        if (m_LoopingSounds[s] !== undefined)
            return;
        m_LoopingSounds[s] = UiToolkitAPI.PlaySoundEvent(s);
    }
    OffersLaptop.LaptopSoundStartLooping = LaptopSoundStartLooping;
    function LaptopSoundStopLooping(s) {
        if (!s)
            return;
        if (m_LoopingSounds[s] === undefined)
            return;
        UiToolkitAPI.StopSoundEvent(m_LoopingSounds[s], 0);
        m_LoopingSounds[s] = undefined;
    }
    OffersLaptop.LaptopSoundStopLooping = LaptopSoundStopLooping;
    function _OnHandleReadyForDisplay(b) {
        $.Msg('Laptop:ReadyForDisplay = ' + b);
        m_bReadyForDisplay = b;
        if (!m_bReadyForDisplay) {
            for (const s in m_LoopingSounds)
                LaptopSoundStopLooping(s);
        }
    }
    function Init() {
        m_itemid = InspectShared.GetPopupSetting('item_id');
        m_InspectPanel.RegisterForReadyEvents(true);
        // Ready for display tracking -
        m_bReadyForDisplay = m_InspectPanel.BReadyForDisplay();
        $.Msg('Laptop:ReadyForDisplay = ' + m_bReadyForDisplay + ' (init)');
        $.RegisterEventHandler('ReadyForDisplay', m_InspectPanel, _OnHandleReadyForDisplay.bind(undefined, true));
        $.RegisterEventHandler('UnreadyForDisplay', m_InspectPanel, _OnHandleReadyForDisplay.bind(undefined, false));
        m_InspectPanel.SetReadyForDisplay(true);
        if (!m_itemid || !InventoryAPI.IsValidItemID(m_itemid)) {
            ClosePopUp();
        }
        LaptopSoundPlayOnce('UI.Laptop.Inspect');
        if (m_itemid && ItemInfo.ItemHasCapability(m_itemid, 'decodable') &&
            !!InventoryAPI.GetItemAttributeValue(m_itemid, '{uint32}volatile container') &&
            InventoryAPI.IsRental(m_itemid) &&
            (InventoryAPI.GetItemQuality(m_itemid) === 14)) // AE_VOLATILE (quality#14))
         {
            _SetUpOpenLaptop(m_itemid);
        }
        else {
            _SetUpClosedLaptop();
        }
    }
    OffersLaptop.Init = Init;
    function _SetUpClosedLaptop() {
        InspectShared.SetPopupSetting('is_keyless', true);
        InspectShared.SetPopupSetting('show_work_type_warning', true);
        InspectShared.SetPopupSetting('override_async_bar_desc', true);
        InspectAsyncActionBar.Init();
        CapabilityHeader.Init();
        _SetCaseModelImage(m_itemid, 'PopUpInspectModelOrImage');
        _SetLootListItems(m_itemid);
    }
    //--------------------------------------------------------------------------------------------------
    // Set key and case model and images and animations
    //--------------------------------------------------------------------------------------------------
    function _SetCaseModelImage(caseId, PanelId) {
        let elItemModelImagePanel = $.GetContextPanel().FindChildInLayoutFile(PanelId);
        elItemModelImagePanel.Data().isLapTopOpening = m_isOpen;
        InspectModelImage.Init(elItemModelImagePanel, caseId);
        m_elCaseModelImagePanel = InspectModelImage.GetModelPanel();
    }
    //--------------------------------------------------------------------------------------------------
    // Items In case
    //--------------------------------------------------------------------------------------------------
    function _SetLootListItems(itemId) {
        let count = InventoryAPI.GetLootListItemsCount(itemId);
        let elLootList = $.GetContextPanel().FindChildInLayoutFile('DecodableLootlist');
        if (count === 0) {
            _ShowHideLootList(false);
            return;
        }
        if (m_elCaseModelImagePanel && m_elCaseModelImagePanel.IsValid() && m_elCaseModelImagePanel.id === 'ImagePreviewPanel') {
            m_elCaseModelImagePanel.AddClass('y-offset');
        }
        _ShowHideLootList(true);
        _SetLootlistHintText(itemId, count);
        for (let i = 0; i < count; i++) {
            let itemid = InventoryAPI.GetLootListItemIdByIndex(itemId, i) === '0' ? m_specialItemId : InventoryAPI.GetLootListItemIdByIndex(itemId, i);
            let elItem = elLootList.FindChildInLayoutFile(itemid);
            if (!elItem) {
                let elItem = $.CreatePanel('Panel', elLootList, itemid);
                elItem.SetAttributeString('itemid', itemid);
                elItem.BLoadLayoutSnippet('LootListItem');
                _UpdateLootListItemInfo(elItem, itemid, itemId);
                elItem.SetPanelEvent('onactivate', _OnActivateLootlistTile.bind(undefined, itemid, itemId, ''));
                elItem.SetPanelEvent('oncontextmenu', _OnActivateLootlistTile.bind(undefined, itemid, itemId, ''));
                if (i === 0) {
                    $.GetContextPanel().FindChildInLayoutFile('CanDecodableBrowseBtn').SetPanelEvent('onactivate', callBackFunc.bind(undefined, itemid, itemId, ''));
                }
                if (itemid !== m_specialItemId) {
                    m_aItemsInLootlist.push({
                        id: itemid,
                        weight: _GetDisplayWeightForScroll(itemid),
                    });
                }
            }
        }
    }
    function _OnActivateLootlistTile(itemid, caseId, keyId) {
        if (!InventoryAPI.IsValidItemID(itemid))
            return;
        let items = [];
        items.push({ label: '#UI_Inspect', jsCallback: callBackFunc.bind(undefined, itemid, caseId, keyId) });
        if (MyPersonaAPI.GetLauncherType() !== "perfectworld" && !InventoryAPI.CannotTrade(itemid)) {
            items.push({ label: '#SFUI_Store_Market_Link', jsCallback: _ViewOnMarket.bind(undefined, itemid) });
        }
        UiToolkitAPI.ShowSimpleContextMenu('', 'ControlLibSimpleContextMenu', items);
    }
    function callBackFunc(itemid, caseId, keyId) {
        $.DispatchEvent('ContextMenuEvent', '');
        _HidePanelForLootlistItemPreview();
        $.DispatchEvent("LootlistItemPreview", itemid, caseId + ',' + caseId);
    }
    function _HidePanelForLootlistItemPreview() {
        if (!m_InspectPanel.IsValid())
            return;
    }
    function _ViewOnMarket(id) {
        SteamOverlayAPI.OpenURL(ItemInfo.GetMarketLinkForLootlistItem(id));
    }
    function _GetDisplayWeightForScroll(itemid) {
        let rarityVal = InventoryAPI.GetItemRarity(itemid);
        //position in array is the weight of corresponding rarity
        let displayItemWeight = [150000, 30000, 6000, 1250, 250, 50, 10];
        return displayItemWeight[rarityVal];
    }
    function _UpdateLootListItemInfo(elItem, itemid, caseId) {
        if (itemid == m_specialItemId) {
            // This is an unsual item in the loot list so treat it differently
            m_unusualItemImagePath = InventoryAPI.GetLootListUnusualItemImage(caseId) + ".png";
            _UpdateUnusualItemInfo(elItem, caseId, m_unusualItemImagePath, true);
        }
        else {
            elItem.FindChildInLayoutFile('ItemImage').itemid = itemid;
            elItem.FindChildInLayoutFile('JsRarity').style.backgroundColor = InventoryAPI.GetItemRarityColor(itemid);
            ItemInfo.GetFormattedName(itemid).SetOnLabel(elItem.FindChildInLayoutFile('JsItemName'));
        }
    }
    function _ShowHideLootList(bshow) {
        let elLootListContainer = $.GetContextPanel().FindChildInLayoutFile('DecodableLootlistContainer');
        elLootListContainer.SetHasClass('hidden', !bshow);
    }
    function _SetLootlistHintText(caseId, count) {
        let bAllItems = InventoryAPI.GetLootListAllEntriesAreAdditionalDrops(caseId);
        $.GetContextPanel().FindChildInLayoutFile('CanDecodableDesc').visible = !bAllItems;
    }
    function _UpdateUnusualItemInfo(elItem, caseId, unusualItemImagePath, bisDisplayedInLootlist = false) {
        if (!elItem || !elItem.IsValid()) {
            return;
        }
        elItem.FindChildInLayoutFile('ItemImage').SetImage("file://{images}/" + unusualItemImagePath);
        if (bisDisplayedInLootlist) {
            elItem.FindChildInLayoutFile('JsRarity').AddClass('popup-decodable-wash-color-unusual');
            let elBg = elItem.FindChildInLayoutFile('ItemTileBg');
            elBg.AddClass('popup-decodable-wash-color-unusual-bg');
            let elName = elItem.FindChildInLayoutFile('JsItemName');
            elName.text = InventoryAPI.GetLootListUnusualItemName(caseId);
        }
        else {
            // color @define color-rarity-unusual: #ffd700 in csgo styles
            elItem.FindChildInLayoutFile('JsRarity').style.washColor = '#ffd700';
            elItem.FindChildInLayoutFile('JItemTint').style.washColor = '#ffd700';
        }
    }
    function ClosePopUp(bDestroyLaptop = false, bCloseImmediate = false) {
        InventoryAPI.StopItemPreviewMusic();
        if (m_InspectPanel.IsValid()) {
            if (m_showInspectScheduleHandle) {
                $.CancelScheduled(m_showInspectScheduleHandle);
                m_showInspectScheduleHandle = null;
            }
            if (bDestroyLaptop) {
                LaptopSoundPlayOnce('UI.Laptop.Break');
                m_InspectPanel.FindChildInLayoutFile('id-laptop-screen').SetHasClass('broken-mask', true);
                $.Schedule(.25, () => {
                    m_InspectPanel.FindChildInLayoutFile('id-laptop-screen').SetHasClass('cracked', true);
                });
                $.Schedule(.5, () => {
                    m_InspectPanel.FindChildInLayoutFile('id-laptop-screen').SetHasClass('broken-screen', true);
                    m_InspectPanel.FindChildInLayoutFile('id-laptop-screen').SetHasClass('broken-mask', false);
                });
                $.Schedule(2, () => {
                    InspectAsyncActionBar.OnEventToClose();
                });
            }
            else if (bCloseImmediate) {
                LaptopSoundPlayOnce('inventory_inspect_close');
                InspectAsyncActionBar.OnEventToClose();
            }
            else {
                m_elCaseModelImagePanel?.SetAnimgraphBool('close', true);
                m_InspectPanel.FindChildInLayoutFile('id-laptop-screen').SetHasClass('show', false);
                LaptopSoundPlayOnce('UI.Laptop.Close');
                $.Schedule(.25, () => {
                    if (m_elCaseModelImagePanel && m_elCaseModelImagePanel.IsValid()) {
                        m_elCaseModelImagePanel.TransitionToCamera('cam_laptop_close', 1);
                    }
                });
                $.Schedule(1.25, () => {
                    InspectAsyncActionBar.OnEventToClose();
                });
            }
        }
        $.Msg('Laptop:ClosePopup');
        _OnHandleReadyForDisplay(false);
    }
    OffersLaptop.ClosePopUp = ClosePopUp;
    function _Refresh() {
        if (!m_itemid || !InventoryAPI.IsValidItemID(m_itemid)) {
            ClosePopUp();
            return;
        }
        Init();
    }
    function ItemUnlocked(numericType, type, itemId) {
        $.Msg("ItemUnlocked");
        if (itemId && InventoryAPI.IsValidItemID(itemId) && type === 'crate_unlock') {
            InspectShared.SetPopupSetting('item_id', itemId);
            InventoryAPI.SetItemSessionPropertyValue(itemId, 'recent', '1');
            InventoryAPI.AcknowledgeNewItembyItemID(itemId);
            _SetUpOpenLaptop(itemId);
        }
        else if (type === 'casket_contents' || numericType === 1012 || type === 'xpgrant') {
            CollectionOffers.OnItemCustomizationNotification(numericType, type, itemId);
        }
        else {
            $.Msg("Unexpected ItemCustomizationNotification from C++, closing the laptop!");
            ClosePopUp();
        }
    }
    function _SetUpOpenLaptop(itemId) {
        m_isOpen = true;
        $.GetContextPanel().FindChildInLayoutFile('PopUpInspectAsyncBar').SetHasClass('hidden', true);
        $.GetContextPanel().FindChildInLayoutFile('PopUpCapabilityHeader').SetHasClass('hidden', true);
        _ShowHideLootList(false);
        _SetCaseModelImage(itemId, 'PopUpInspectModelOrImage');
        $.Schedule(.5, () => {
            CollectionOffers.Init(itemId, $.GetContextPanel().FindChildInLayoutFile('id-laptop-screen'));
            LaptopSoundStartLooping('UI.Laptop.FanLoop');
        });
        $.Schedule(.75, () => {
            m_elCaseModelImagePanel?.SetAnimgraphBool('open', true);
            LaptopSoundPlayOnce('UI.Laptop.Open');
            $.GetContextPanel().FindChildInLayoutFile('id-laptop-screen').SetHasClass('show', true);
        });
    }
    function _ItemAcquired(ItemId) {
        LaptopSoundPlayOnce("rename_purchaseSuccess");
        if (CollectionOffers.m_currentOfferId === ItemId) {
            InventoryAPI.SetItemSessionPropertyValue(ItemId, 'recent', '1');
            InventoryAPI.AcknowledgeNewItembyItemID(ItemId);
            $.Schedule(1, () => {
                $.DispatchEvent("InventoryItemPreview", ItemId, '');
                let rarityVal = InventoryAPI.GetItemRarity(ItemId);
                let soundEvent = "ItemRevealRarityCommon";
                if (rarityVal == 4) {
                    soundEvent = "ItemRevealRarityUncommon";
                }
                else if (rarityVal == 5) {
                    soundEvent = "ItemRevealRarityRare";
                }
                else if (rarityVal == 6) {
                    soundEvent = "ItemRevealRarityMythical";
                }
                else if (rarityVal == 7) {
                    soundEvent = "ItemRevealRarityLegendary";
                }
                else if (rarityVal == 8) {
                    soundEvent = "ItemRevealRarityAncient";
                }
                LaptopSoundPlayOnce(soundEvent);
                ClosePopUp(false, true);
            });
        }
    }
    function _CheckConnection() {
        if (!MyPersonaAPI.IsConnectedToGC()) {
            if (m_InspectPanel.IsValid() && m_InspectPanel) {
                ClosePopUp(false, true);
            }
        }
    }
    $.RegisterForUnhandledEvent('PanoramaComponent_Inventory_ItemCustomizationNotification', ItemUnlocked);
    $.RegisterForUnhandledEvent('PanoramaComponent_Store_PurchaseCompleted', _ItemAcquired);
    $.RegisterForUnhandledEvent('CSGOShowMainMenu', _Refresh);
    $.RegisterForUnhandledEvent('PopulateLoadingScreen', ClosePopUp);
    $.RegisterForUnhandledEvent('OpenInventory', ClosePopUp);
    $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_UpdateConnectionToGC', _CheckConnection);
})(OffersLaptop || (OffersLaptop = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfb2ZmZXJzX2xhcHRvcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3BvcHVwcy9wb3B1cF9vZmZlcnNfbGFwdG9wLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFDckMsbURBQW1EO0FBQ25ELGtEQUFrRDtBQUNsRCw4Q0FBOEM7QUFDOUMsc0NBQXNDO0FBQ3RDLG1EQUFtRDtBQUNuRCxnREFBZ0Q7QUFDaEQsa0RBQWtEO0FBQ2xELHlEQUF5RDtBQUV6RCxjQUFjO0FBQ2QsZ0RBQWdEO0FBQ2hELGFBQWE7QUFFYixJQUFVLFlBQVksQ0FrYnJCO0FBbGJELFdBQVUsWUFBWTtJQUVyQixJQUFJLGtCQUFrQixHQUFxQyxFQUFFLENBQUM7SUFDOUQsSUFBSSxRQUFRLEdBQUcsRUFBRSxDQUFDO0lBQ2xCLElBQUksUUFBUSxHQUFHLEtBQUssQ0FBQztJQUNyQixJQUFJLGNBQWMsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUM7SUFDekMsSUFBSSxzQkFBc0IsR0FBRyxFQUFFLENBQUM7SUFDaEMsSUFBSSwyQkFBMkIsR0FBa0IsSUFBSSxDQUFDO0lBQ3RELElBQUksZUFBZSxHQUFHLGlCQUFpQixDQUFDO0lBQ3hDLElBQUksdUJBQXVCLEdBQXNELElBQUksQ0FBQztJQUV0RixFQUFFO0lBQ0YsNEJBQTRCO0lBQzVCLEVBQUU7SUFDRixJQUFJLGtCQUFrQixHQUFZLEtBQUssQ0FBQztJQUN4QyxJQUFJLGVBQWUsR0FBeUIsRUFBRSxDQUFDLENBQUMsZ0JBQWdCO0lBRWhFLFNBQWdCLG1CQUFtQixDQUFFLENBQVM7UUFFN0MsSUFBSyxDQUFDLGtCQUFrQjtZQUFHLE9BQU87UUFDbEMsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxxQkFBcUIsRUFBRSxDQUFDLEVBQUUsT0FBTyxDQUFFLENBQUM7SUFDdEQsQ0FBQztJQUplLGdDQUFtQixzQkFJ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