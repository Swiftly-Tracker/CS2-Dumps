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
    let m_bReadyForDisplay = false;
    let m_LoopingSounds = {};
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
        m_bReadyForDisplay = b;
        if (!m_bReadyForDisplay) {
            for (const s in m_LoopingSounds)
                LaptopSoundStopLooping(s);
        }
    }
    function Init() {
        m_itemid = InspectShared.GetPopupSetting('item_id');
        m_InspectPanel.RegisterForReadyEvents(true);
        m_bReadyForDisplay = m_InspectPanel.BReadyForDisplay();
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
            (InventoryAPI.GetItemQuality(m_itemid) === 14)) {
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
    function _SetCaseModelImage(caseId, PanelId) {
        let elItemModelImagePanel = $.GetContextPanel().FindChildInLayoutFile(PanelId);
        elItemModelImagePanel.Data().isLapTopOpening = m_isOpen;
        InspectModelImage.Init(elItemModelImagePanel, caseId);
        m_elCaseModelImagePanel = InspectModelImage.GetModelPanel();
    }
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
        let displayItemWeight = [150000, 30000, 6000, 1250, 250, 50, 10];
        return displayItemWeight[rarityVal];
    }
    function _UpdateLootListItemInfo(elItem, itemid, caseId) {
        if (itemid == m_specialItemId) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfb2ZmZXJzX2xhcHRvcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3BvcHVwcy9wb3B1cF9vZmZlcnNfbGFwdG9wLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFDckMsbURBQW1EO0FBQ25ELGtEQUFrRDtBQUNsRCw4Q0FBOEM7QUFDOUMsc0NBQXNDO0FBQ3RDLG1EQUFtRDtBQUNuRCxnREFBZ0Q7QUFDaEQsa0RBQWtEO0FBQ2xELHlEQUF5RDtBQU16RCxJQUFVLFlBQVksQ0FrYnJCO0FBbGJELFdBQVUsWUFBWTtJQUVyQixJQUFJLGtCQUFrQixHQUFxQyxFQUFFLENBQUM7SUFDOUQsSUFBSSxRQUFRLEdBQUcsRUFBRSxDQUFDO0lBQ2xCLElBQUksUUFBUSxHQUFHLEtBQUssQ0FBQztJQUNyQixJQUFJLGNBQWMsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUM7SUFDekMsSUFBSSxzQkFBc0IsR0FBRyxFQUFFLENBQUM7SUFDaEMsSUFBSSwyQkFBMkIsR0FBa0IsSUFBSSxDQUFDO0lBQ3RELElBQUksZUFBZSxHQUFHLGlCQUFpQixDQUFDO0lBQ3hDLElBQUksdUJBQXVCLEdBQXNELElBQUksQ0FBQztJQUt0RixJQUFJLGtCQUFrQixHQUFZLEtBQUssQ0FBQztJQUN4QyxJQUFJLGVBQWUsR0FBeUIsRUFBRSxDQUFDO0lBRS9DLFNBQWdCLG1CQUFtQixDQUFFLENBQVM7UUFFN0MsSUFBSyxDQUFDLGtCQUFrQjtZQUFHLE9BQU87UUFDbEMsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxxQkFBcUIsRUFBRSxDQUFDLEVBQUUsT0FBTyxDQUFFLENBQUM7SUFDdEQsQ0FBQztJQUplLGdDQUFtQixzQkFJbEMsQ0FBQTtJQUVELFNBQWdCLHVCQUF1QixDQUFFLENBQVM7UUFFakQsSUFBSyxDQUFDLGtCQUFrQjtZQUFHLE9BQU87UUFDbEMsSUFB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