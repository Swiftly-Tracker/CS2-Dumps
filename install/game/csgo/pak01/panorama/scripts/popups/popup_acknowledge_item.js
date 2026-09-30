"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../common/iteminfo.ts" />
/// <reference path="../common/icon.ts" />
/// <reference path="popup_capability_can_sticker.ts" />
var AcknowledgeItems;
(function (AcknowledgeItems_1) {
    let m_elEquipBtn = $('#EquipItemBtn');
    let m_focusedItemId = '';
    function OnLoad() {
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', Init);
        $.RegisterEventHandler("SetCarouselSelectedChild", $.GetContextPanel(), CarouselUpdated);
        $.RegisterForUnhandledEvent('CSGOShowMainMenu', Init);
        $.RegisterForUnhandledEvent('PopulateLoadingScreen', AcknowledgeItems.AcknowledgeAllItems.OnCloseEvents);
        Init();
    }
    AcknowledgeItems_1.OnLoad = OnLoad;
    function Init() {
        const items = GetItems();
        if (items.length < 1) {
            AcknowledgeAllItems.InvokeJSCallback();
            $.DispatchEvent('UIPopupButtonClicked', '');
            return;
        }
        const numItems = items.length;
        AcknowledgeAllItems.SetItemsToSaveAsNew(items);
        // if there is an update while you are in this popup delete the items and remake them with the new list.
        const elParent = $.GetContextPanel().FindChildInLayoutFile('AcknowledgeItemsCarousel');
        elParent.RemoveAndDeleteChildren();
        for (let i = 0; i < items.length; i++) {
            const elDelayLoadPanel = $.CreatePanel('CSGODelayLoadPanel', elParent, 'carousel_delay_load_' + i, { class: 'Offscreen' });
            elDelayLoadPanel.SetLoadFunction(MakeItemPanel.bind(null, items[i], i, numItems));
            elDelayLoadPanel.ListenForClassRemoved('Offscreen');
        }
        // Set the button visibility for view in loadout
        $.Schedule(.25, () => {
            let aPanels = $.GetContextPanel().FindChildInLayoutFile('AcknowledgeItemsCarousel').Children();
            if (aPanels.length > 0) {
                for (let i = 0; i < aPanels.length; i++) {
                    if (aPanels[i].BHasClass('Focused')) {
                        ShowHideOpenItemInLayoutBtn(aPanels[i].Data().itemId);
                        if (m_elEquipBtn)
                            m_elEquipBtn.SetPanelEvent('onactivate', () => {
                                AcknowledgeAllItems.OnActivate();
                                $.DispatchEvent("ShowLoadoutForItem", m_focusedItemId);
                            });
                        break;
                    }
                }
            }
        });
        $.Schedule(1, SetFocusForNavButton);
    }
    function SetFocusForNavButton() {
        let elParent = $.GetContextPanel().FindChildInLayoutFile('AcknowledgeItemsCarouselNav');
        elParent.FindChildInLayoutFile('NextItemButton').SetPanelEvent('onmouseover', () => {
            elParent.FindChildInLayoutFile('NextItemButton').SetFocus();
        });
        elParent.FindChildInLayoutFile('PreviousItemButton').SetPanelEvent('onmouseover', () => {
            elParent.FindChildInLayoutFile('PreviousItemButton').SetFocus();
        });
    }
    function MakeItemPanel(item, index, numItems, elParent) {
        const elItemTile = $.CreatePanel('Panel', elParent, item.id);
        elItemTile.BLoadLayoutSnippet('Item');
        const modelPath = ShowModelOrItem(elItemTile, item.id, item.type);
        ResizeForVerticalItem(elItemTile, item.id);
        const rarityColor = InventoryAPI.GetItemRarityColor(item.id);
        SetTitle(elItemTile, item, rarityColor);
        SetParticlesBg(elItemTile, rarityColor, modelPath, item.id);
        ColorRarityBar(elItemTile, rarityColor);
        SetItemName(elItemTile, item.id);
        ShowGiftPanel(elItemTile, item.id);
        ShowSetPanel(elItemTile, item);
        ItemCount(elItemTile, index, numItems);
        $.Msg('MakeItemPanel : ' + elParent.id);
        elParent.Data().itemId = item.id;
    }
    function ShowModelOrItem(elItemTile, id, type = "") {
        let elItemModelImagePanel = elItemTile.FindChildInLayoutFile('PopUpInspectModelOrImage');
        elItemModelImagePanel.Data().useAcknowledge = !(ItemInfo.IsSprayPaint(id) || ItemInfo.IsSpraySealed(id));
        return InspectModelImage.Init(elItemModelImagePanel, id);
    }
    function ResizeForVerticalItem(elItemTile, id) {
        if (ItemInfo.IsCharacter(id)) {
            let elPanel = elItemTile.FindChildInLayoutFile('AcknowledgeItemContainer');
            elPanel.AddClass('popup-acknowledge__item__model--vertical');
        }
    }
    function SetItemName(elItemTile, id) {
        const elLabel = elItemTile.FindChildInLayoutFile('AcknowledgeItemLabel');
        elLabel.text = InventoryAPI.GetItemName(id);
    }
    function SetTitle(elItemTile, item, rarityColor) {
        // Set custom label text for storage units 'nametag_add'
        const defName = InventoryAPI.GetItemDefinitionName(item.id);
        const elTitle = elItemTile.FindChildInLayoutFile('AcknowledgeItemTitle');
        const titleSuffex = (item.pickuptype
            && ['xpshopredeem', 'quest_reward'].includes(item.pickuptype)) ? item.pickuptype : item.type;
        if (defName === 'casket' && item.type === 'nametag_add') {
            elTitle.text = $.Localize('#CSGO_Tool_Casket_Tag');
        }
        else {
            const idxOfExtraParams = titleSuffex.indexOf("[");
            const typeWithoutParams = (idxOfExtraParams > 0) ? titleSuffex.substring(0, idxOfExtraParams) : titleSuffex;
            elTitle.text = $.Localize('#popup_title_' + typeWithoutParams);
        }
        elTitle.style.washColor = rarityColor;
    }
    function SetParticlesBg(elItemTile, rarityColor, modelPath, itemId) {
        const oColor = HexColorToRgb(rarityColor);
        $.Msg('oColor: ' + oColor.r.toString() + ' ' + oColor.g.toString() + ' ' + oColor.b.toString());
        let elParticlePanel = elItemTile.FindChildInLayoutFile('popup-acknowledge__item__particle');
        elParticlePanel.visible = !modelPath;
        if (!modelPath) {
            elParticlePanel.SetParticleNameAndRefresh('particles/ui/ui_item_present_bokeh.vpcf');
            elParticlePanel.SetControlPoint(16, oColor.r, oColor.g, oColor.b);
            elParticlePanel.StartParticles();
            return;
        }
        elParticlePanel.StopParticlesImmediately(false);
    }
    function HexColorToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b };
    }
    function ColorRarityBar(elItemTile, rarityColor) {
        const elBar = elItemTile.FindChildInLayoutFile('AcknowledgeBar');
        elBar.style.washColor = rarityColor;
        $.Msg('rarityColor: ' + rarityColor);
    }
    function ShowGiftPanel(elItemTile, id) {
        const elPanel = elItemTile.FindChildInLayoutFile('AcknowledgeItemGift');
        const gifterId = ItemInfo.GetGifter(id);
        elPanel.SetHasClass('hidden', gifterId === '');
        const elLabel = elItemTile.FindChildInLayoutFile('AcknowledgeItemGiftLabel');
        elLabel.SetDialogVariable('name', FriendsListAPI.GetFriendName(gifterId));
        elLabel.text = $.Localize('#acknowledge_gifter', elLabel);
    }
    function ShowSetPanel(elItemTile, item) {
        const id = item.id;
        const elPanel = elItemTile.FindChildInLayoutFile('AcknowledgeItemSet');
        const elLabel = elItemTile.FindChildInLayoutFile('AcknowledgeItemSetLabel');
        const elImage = elItemTile.FindChildInLayoutFile('AcknowledgeItemSetImage');
        const strSetName = InventoryAPI.GetTag(id, 'ItemSet');
        if (!strSetName || strSetName === '0') {
            // Special case - claiming a "REWARD" charm from the XP SHOP gives +N removal charges (read the actual number from the pack schema)
            if (ItemInfo.IsKeychain(id) && item.pickuptype === 'xpshopredeem') {
                let m_szRemoveKeychainToolChargesForPurchase = 'Remove Keychain Tool Pack'; // this is what user must buy to refill charges
                let defidxForPurchase = InventoryAPI.GetItemDefinitionIndexFromDefinitionName(m_szRemoveKeychainToolChargesForPurchase);
                let fauxPurchaseItemID = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(defidxForPurchase, 0);
                elLabel.SetDialogVariableInt('item_count', Number(InventoryAPI.GetItemAttributeValue(fauxPurchaseItemID, '{uint32}items count')));
                elLabel.text = $.Localize('#CSGO_RemoveKeychainToolCharges_Reward:f', elLabel);
                elImage.SetImage('file://{images}/icons/ui/keychain_removal.svg');
                elImage.SetHasClass('popup-acknowledge__subtitle_seticon_tiny', true);
                elPanel.SetHasClass('hide', false);
                return;
            }
            elPanel.SetHasClass('hide', true);
            return;
        }
        const setName = InventoryAPI.GetTagString(strSetName);
        if (!setName) {
            elPanel.SetHasClass('hide', true);
            return;
        }
        elLabel.text = setName;
        //DEVONLY{
        if (strSetName === '')
            throw "Show this to Ido.";
        //}DEVONLY
        IconUtil.SetupFallbackItemSetIcon(elImage, strSetName);
        IconUtil.SetItemSetSVGImage(elImage, strSetName);
        elImage.SetHasClass('popup-acknowledge__subtitle_seticon_tiny', false);
        elPanel.SetHasClass('hide', false);
    }
    function ItemCount(elItemTile, index, numItems) {
        const elCountLabel = elItemTile.FindChildInLayoutFile('AcknowledgeItemCount');
        if (numItems < 2) {
            elCountLabel.visible = false;
            return;
        }
        elCountLabel.visible = true;
        elCountLabel.text = (index + 1) + ' / ' + numItems;
    }
    function GetItems() {
        const newItems = [];
        const itemCount = InventoryAPI.GetUnacknowledgeItemsCount();
        for (let i = 0; i < itemCount; i++) {
            const itemId = InventoryAPI.GetUnacknowledgeItemByIndex(i);
            const pickUpType = InventoryAPI.GetItemPickupMethod(itemId);
            let strCustomization = InventoryAPI.GetItemSessionPropertyValue(itemId, 'item_customization');
            if (!strCustomization || !(strCustomization.startsWith('crate_')
                || strCustomization.startsWith('nametag_')
                || strCustomization.startsWith('sticker_')
                || strCustomization.startsWith('keychain_')
                || strCustomization.startsWith('patch_')
                || strCustomization.startsWith('stattrack_')
                || strCustomization.startsWith('quest_')
                || strCustomization.startsWith('xpshop'))) {
                strCustomization = 'acknowledge';
            }
            if (ItemstoAcknowlegeRightAway(itemId))
                InventoryAPI.AcknowledgeNewItembyItemID(itemId);
            else
                newItems.unshift({ type: strCustomization, id: itemId, pickuptype: pickUpType });
        }
        // This item was passed when the popup xml was loaded to explicity show the acknowledge panel 
        const getUpdateItem = GetUpdatedItem();
        if (getUpdateItem && newItems.filter(item => item.id === getUpdateItem.id).length < 1) {
            newItems.push(getUpdateItem);
        }
        // Put reward items first
        const priorityItemAckTypes = ["xpshopredeem", "quest_reward"];
        const rewardItems = newItems.filter(item => item.pickuptype && priorityItemAckTypes.includes(item.pickuptype));
        const otherItems = newItems.filter(item => !(item.pickuptype && priorityItemAckTypes.includes(item.pickuptype)));
        return rewardItems.concat(otherItems);
    }
    AcknowledgeItems_1.GetItems = GetItems;
    function GetItemsByType(afilters, bShouldAcknowledgeItems) {
        const aItems = GetItems();
        const alist = aItems.filter(oItem => afilters.includes(InventoryAPI.GetItemDefinitionName(oItem.id)));
        if (bShouldAcknowledgeItems) {
            AcknowledgeAllItems.AcknowledgeItems(alist);
        }
        return alist.map(item => item.id);
    }
    AcknowledgeItems_1.GetItemsByType = GetItemsByType;
    function GetUpdatedItem() {
        // See possible types in uicomponent_inventory.cpp
        // ClientJob_EMsgGCItemCustomizationNotification
        // Don't forget to add matching loc strings like "popup_title_stattrack_swap"
        const itemidExplicitAcknowledge = $.GetContextPanel().GetAttributeString("ackitemid", '');
        if (itemidExplicitAcknowledge === '')
            return null;
        return {
            id: itemidExplicitAcknowledge,
            type: $.GetContextPanel().GetAttributeString("acktype", '')
        };
    }
    function ItemstoAcknowlegeRightAway(id) {
        const itemType = InventoryAPI.GetItemTypeFromEnum(id);
        return itemType === 'quest' ||
            itemType === 'coupon_crate' ||
            itemType === 'campaign';
    }
    function CarouselUpdated(elPanel) {
        $.Schedule(.15, () => {
            if (elPanel && elPanel.IsValid())
                ShowHideOpenItemInLayoutBtn(elPanel.Data().itemId);
        });
    }
    function ShowHideOpenItemInLayoutBtn(itemId) {
        m_focusedItemId = itemId;
        let category = InventoryAPI.GetLoadoutCategory(itemId);
        let isHidden = !category || ItemInfo.ItemHasCapability(itemId, 'decodable');
        if (m_elEquipBtn) {
            m_elEquipBtn.SetHasClass('hide', isHidden);
        }
    }
    //---------------------------------AcknowledgeAllItems Section-------------------------------
    let AcknowledgeAllItems;
    (function (AcknowledgeAllItems) {
        let itemsToSave = [];
        function SetItemsToSaveAsNew(items) {
            itemsToSave = items;
        }
        AcknowledgeAllItems.SetItemsToSaveAsNew = SetItemsToSaveAsNew;
        function AcknowledgeItems(alist) {
            const acklist = alist ? alist : itemsToSave;
            for (let item of acklist) {
                InventoryAPI.SetItemSessionPropertyValue(item.id, 'item_pickup_method', InventoryAPI.GetItemPickupMethod(item.id)); // e.g. 'quest_reward', 'xpshopredeem'
                if (item.type === 'acknowledge') {
                    InventoryAPI.SetItemSessionPropertyValue(item.id, 'recent', '1');
                    InventoryAPI.AcknowledgeNewItembyItemID(item.id);
                }
                else {
                    const bWasNew = InventoryAPI.AcknowledgeNewItembyItemID(item.id);
                    InventoryAPI.SetItemSessionPropertyValue(item.id, bWasNew ? 'recent' : 'updated', '1');
                    $.DispatchEvent('RefreshActiveInventoryList');
                }
            }
        }
        AcknowledgeAllItems.AcknowledgeItems = AcknowledgeItems;
        function OnActivate() {
            AcknowledgeItems();
            InventoryAPI.AcknowledgeNewBaseItems();
            InvokeJSCallback();
            OnCloseEvents();
        }
        AcknowledgeAllItems.OnActivate = OnActivate;
        function InvokeJSCallback() {
            const callbackResetAcknowlegePopupHandle = $.GetContextPanel().GetAttributeInt("callback", -1);
            if (callbackResetAcknowlegePopupHandle != -1) {
                // Resets the handle the inventory has to the pop up. This allows us to create a new pop up.
                // We hold one open so that it can update with new items rather than making new pop ups.
                UiToolkitAPI.InvokeJSCallback(callbackResetAcknowlegePopupHandle);
            }
        }
        AcknowledgeAllItems.InvokeJSCallback = InvokeJSCallback;
        function OnCloseEvents() {
            $.DispatchEvent('UIPopupButtonClicked', '');
            $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.inventory_new_item_accept', 'MOUSE');
        }
        AcknowledgeAllItems.OnCloseEvents = OnCloseEvents;
    })(AcknowledgeAllItems = AcknowledgeItems_1.AcknowledgeAllItems || (AcknowledgeItems_1.AcknowledgeAllItems = {}));
})(AcknowledgeItems || (AcknowledgeItems = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfYWNrbm93bGVkZ2VfaXRlbS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3BvcHVwcy9wb3B1cF9hY2tub3dsZWRnZV9pdGVtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFDckMsOENBQThDO0FBQzlDLDBDQUEwQztBQUMxQyx3REFBd0Q7QUFFeEQsSUFBVSxnQkFBZ0IsQ0FnYnpCO0FBaGJELFdBQVUsa0JBQWdCO0lBU3pCLElBQUksWUFBWSxHQUFHLENBQUMsQ0FBRSxlQUFlLENBQWtCLENBQUM7SUFDeEQsSUFBSSxlQUFlLEdBQUcsRUFBRSxDQUFDO0lBRXpCLFNBQWdCLE1BQU07UUFFckIsQ0FBQyxDQUFDLHlCQUF5QixDQUFFLDhDQUE4QyxFQUFFLElBQUksQ0FBRSxDQUFDO1FBQ3BGLENBQUMsQ0FBQyxvQkFBb0IsQ0FBRSwwQkFBMEIsRUFBRSxDQUFDLENBQUMsZUFBZSxFQUFFLEVBQUUsZUFBZSxDQUFFLENBQUM7UUFDM0YsQ0FBQyxDQUFDLHlCQUF5QixDQUFFLGtCQUFrQixFQUFFLElBQUksQ0FBRSxDQUFDO1FBQ3hELENBQUMsQ0FBQyx5QkFBeUIsQ0FBRSx1QkFBdUIsRUFBRSxnQkFBZ0IsQ0FBQyxtQkFBbUIsQ0FBQyxhQUFhLENBQUUsQ0FBQztRQUMzRyxJQUFJLEVBQUUsQ0FBQztJQUNSLENBQUM7SUFQZSx5QkFBTSxTQU9yQixDQUFBO0lBRUQsU0FBUyxJQUFJO1FBRVosTUFBTSxLQUFLLEdBQUcsUUFBUSxFQUFFLENBQUM7UUFFekIsSUFBSyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsRUFDckI7WUFDQyxtQkFBbUIsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1lBQ3ZDLENBQUMsQ0FBQyxhQUFhLENBQUUsc0JBQXNCLEVBQUUsRUFBRSxDQUFFLENBQUM7WUFDOUMsT0FBTztTQUNQO1FBRUQsTUFBTSxRQUFR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