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
        const elParent = $.GetContextPanel().FindChildInLayoutFile('AcknowledgeItemsCarousel');
        elParent.RemoveAndDeleteChildren();
        for (let i = 0; i < items.length; i++) {
            const elDelayLoadPanel = $.CreatePanel('CSGODelayLoadPanel', elParent, 'carousel_delay_load_' + i, { class: 'Offscreen' });
            elDelayLoadPanel.SetLoadFunction(MakeItemPanel.bind(null, items[i], i, numItems));
            elDelayLoadPanel.ListenForClassRemoved('Offscreen');
        }
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
            if (ItemInfo.IsKeychain(id) && item.pickuptype === 'xpshopredeem') {
                let m_szRemoveKeychainToolChargesForPurchase = 'Remove Keychain Tool Pack';
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
        const getUpdateItem = GetUpdatedItem();
        if (getUpdateItem && newItems.filter(item => item.id === getUpdateItem.id).length < 1) {
            newItems.push(getUpdateItem);
        }
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
                InventoryAPI.SetItemSessionPropertyValue(item.id, 'item_pickup_method', InventoryAPI.GetItemPickupMethod(item.id));
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