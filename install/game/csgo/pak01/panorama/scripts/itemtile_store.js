"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/tint_spray_icon.ts" />
/// <reference path="common/store_items.ts" />
/// <reference path="common/formattext.ts" />
/// <reference path="common/iteminfo.ts" />
/// <reference path="rankup_redemption_store.ts" />
var ItemTileStore;
(function (ItemTileStore) {
    function Init(elPanel, oItemData) {
        if (!oItemData || (oItemData.hasOwnProperty('noDropsEarned') && oItemData.noDropsEarned)) {
            elPanel.SetHasClass('no-drops-earned', true);
            return;
        }
        elPanel.SetHasClass('no-drops-earned', false);
        SetDropItemStyle(elPanel, oItemData);
        SetMainMenuItemStyle(elPanel, oItemData);
        SetItemImages(elPanel, oItemData);
        SetName(elPanel, oItemData);
        SetStatTrack(elPanel, oItemData.id);
        SetNewRelease(elPanel, (isNewRelease(oItemData) || oItemData.isDropItem));
        NotReleased(elPanel, oItemData.isNotReleased);
        SetPrice(elPanel, oItemData);
        SetOnActivate(elPanel, oItemData);
        SetClaimed(elPanel, oItemData);
        AddMouseOverEvents(elPanel, oItemData);
    }
    ItemTileStore.Init = Init;
    function SetItemImages(elPanel, oItemData) {
        let displayId = GetDisplayItemId(oItemData, oItemData.id);
        let elImage = elPanel.FindChildInLayoutFile('id-itemtile-store-image-main');
        elImage.itemid = displayId;
        TintSprayImage(elImage, displayId);
        elImage = GetBackgroundImage(elPanel, oItemData);
        elImage.itemid = displayId;
        if (oItemData.hasOwnProperty('linkedid')) {
            displayId = GetDisplayItemId(oItemData, oItemData.linkedid);
            elImage = elPanel.FindChildInLayoutFile('id-itemtile-store-image-linked');
            elImage.itemid = displayId;
        }
        elPanel.FindChildInLayoutFile('id-itemtile-store-image-linked').visible = oItemData.hasOwnProperty('linkedid');
        elPanel.SetHasClass('is-linked', oItemData.hasOwnProperty('linkedid'));
    }
    function GetBackgroundImage(elPanel, oItemData) {
        if (oItemData.hasOwnProperty('isDisplayedInMainMenu')) {
            return oItemData.isDisplayedInMainMenu ?
                elPanel.FindChildInLayoutFile('id-itemtile-mainmenu-store-image-bg') :
                elPanel.FindChildInLayoutFile('id-itemtile-store-image-bg');
        }
        return elPanel.FindChildInLayoutFile('id-itemtile-store-image-bg');
    }
    function TintSprayImage(elImage, ItemId) {
        TintSprayIcon.CheckIsSprayAndTint(ItemId, elImage);
    }
    function GetDisplayItemId(oItemData, itemId) {
        if (InventoryAPI.GetItemTypeFromEnum(itemId) === 'coupon')
            return InventoryAPI.GetLootListItemIdByIndex(itemId, 0);
        return itemId;
    }
    function SetName(elPanel, oItemData) {
        var strItemName = '';
        if (oItemData.useTinyNames) {
            strItemName = $.Localize(InventoryAPI.GetRawDefinitionKey(oItemData.id, 'item_name') + '_tinyname');
        }
        else {
            strItemName = InventoryAPI.GetItemName(oItemData.linkedid ? oItemData.linkedid : oItemData.id);
        }
        elPanel.SetDialogVariable('item-name', strItemName);
    }
    function SetStatTrack(elPanel, itemId) {
        let elStattrak = elPanel.FindChildInLayoutFile('id-itemtile-store-stattrak');
        elStattrak.SetHasClass('hidden', !ItemInfo.IsStatTrak(itemId));
    }
    function SetNewRelease(elPanel, isNew) {
        let elNew = elPanel.FindChildInLayoutFile('id-itemtile-store-new');
        elNew.SetHasClass('hidden', !isNew);
    }
    function NotReleased(elPanel, isnotReleased = false) {
        let elNew = elPanel.FindChildInLayoutFile('id-itemtile-store-not-released');
        elNew.SetHasClass('hidden', !isnotReleased);
    }
    function SetPrice(elPanel, oItemData) {
        if (oItemData.isDropItem) {
            elPanel.SetDialogVariable('sale-price', $.Localize('#op_reward_free'));
            return;
        }
        let reduction = StoreAPI.GetStoreItemPercentReduction(oItemData.id);
        let isMarketItem = IsMarketItem(oItemData);
        elPanel.FindChildInLayoutFile('id-itemtile-store-price').SetHasClass('is-marketlink', isMarketItem);
        elPanel.FindChildInLayoutFile('id-itemtile-store-price').SetHasClass('has-reduction', reduction !== '' && reduction !== undefined && !isMarketItem);
        elPanel.SetDialogVariable('reduction', reduction);
        let origPrice = (oItemData.hasOwnProperty('linkedid')) &&
            ItemInfo.GetStoreOriginalPrice(oItemData.linkedid, 1) !== ItemInfo.GetStoreOriginalPrice(oItemData.id, 1) ?
            ItemInfo.GetStoreOriginalPrice(oItemData.linkedid, 1) + ' - ' + ItemInfo.GetStoreOriginalPrice(oItemData.id, 1) :
            ItemInfo.GetStoreOriginalPrice(oItemData.id, 1);
        let salePrice = (isMarketItem) ?
            $.Localize('#SFUI_Store_Market_Link') :
            (oItemData.hasOwnProperty('linkedid')) &&
                ItemInfo.GetStoreOriginalPrice(oItemData.linkedid, 1) !== ItemInfo.GetStoreOriginalPrice(oItemData.id, 1) ?
                ItemInfo.GetStoreSalePrice(oItemData.linkedid, 1) + ' - ' + ItemInfo.GetStoreSalePrice(oItemData.id, 1) :
                ItemInfo.GetStoreSalePrice(oItemData.id, 1);
        elPanel.SetDialogVariable('original-price', origPrice);
        elPanel.SetDialogVariable('sale-price', salePrice);
    }
    function SetDropItemStyle(elPanel, oItemData) {
        if (oItemData.hasOwnProperty('isDropItem')) {
            elPanel.SetHasClass('is-drop-item', oItemData.isDropItem);
            if (oItemData.isDropItem) {
                elPanel.SetHasClass('is-case-drop', ItemInfo.IsCase(oItemData.id));
            }
        }
        else {
            elPanel.SetHasClass('is-drop-item', false);
        }
    }
    function SetMainMenuItemStyle(elPanel, oItemData) {
        if (oItemData.hasOwnProperty('isDisplayedInMainMenu')) {
            elPanel.SetHasClass('is-mainmenu-item', oItemData.isDisplayedInMainMenu);
        }
        else {
            elPanel.SetHasClass('is-mainmenu-item', false);
        }
    }
    function SetClaimed(elPanel, oItemData) {
        if (oItemData.isDropItem) {
            const bIsFauxItem = InventoryAPI.IsFauxItemID(oItemData.id);
            const bIsExpiredClaimSlot = bIsFauxItem && InventoryAPI.DoesItemMatchDefinitionByName(oItemData.id, 'expired_itemdef');
            elPanel.SetHasClass('item-claimed', bIsFauxItem);
            elPanel.SetHasClass('item-claimslot-expired', bIsExpiredClaimSlot);
        }
    }
    function isNewRelease(oItemData) {
        if (oItemData.hasOwnProperty('isNewRelease')) {
            return oItemData.isNewRelease ? true : false;
        }
        return false;
    }
    function IsMarketItem(oItemData) {
        if (oItemData.hasOwnProperty('isMarketItem')) {
            return oItemData.isMarketItem ? true : false;
        }
        return false;
    }
    function SetOnActivate(elPanel, oItemData) {
        elPanel.enabled = !oItemData.isDisabled;
        if (oItemData.isDropItem || oItemData.isDisabled) {
            // oItemData.isDropItem actions handeled in rankup_redemption_store.ts
            return;
        }
        else if (IsMarketItem(oItemData)) {
            elPanel.SetPanelEvent('onactivate', OpenOverlayToMarket.bind(undefined, oItemData.id));
        }
        else if (oItemData.hasOwnProperty('linkedid')) {
            let OpenContextMenu = function (itemId, linkedid, isNotReleased, warning) {
                var contextMenuPanel = UiToolkitAPI.ShowCustomLayoutContextMenuParameters('', '', 'file://{resources}/layout/context_menus/context_menu_store_linked_items.xml', 'itemids=' + itemId + ',' + linkedid +
                    '&' + 'is-not-released=' + isNotReleased +
                    '&' + 'linkedWarning=' + warning);
                contextMenuPanel.AddClass("ContextMenu_NoArrow");
            };
            let isNotReleased = oItemData.isNotReleased ? 'true' : 'false';
            let warning = oItemData.linkedWarning ? oItemData.linkedWarning : '';
            elPanel.SetPanelEvent('onactivate', OpenContextMenu.bind(undefined, oItemData.id, oItemData.linkedid, isNotReleased, warning));
            elPanel.SetPanelEvent('oncontextmenu', OpenContextMenu.bind(undefined, oItemData.id, oItemData.linkedid, isNotReleased, warning));
        }
        else if (ItemInfo.ItemHasCapability(oItemData.id, 'decodable')) {
            let displayItemId = '';
            let isNew = isNewRelease(oItemData);
            const isVolatile = !!InventoryAPI.GetItemAttributeValue(oItemData.id, '{uint32}volatile container');
            if (InventoryAPI.GetItemTypeFromEnum(oItemData.id) === 'coupon') {
                displayItemId = InventoryAPI.GetLootListItemIdByIndex(oItemData.id, 0);
                elPanel.SetPanelEvent('onactivate', ShowDecodePopup.bind(undefined, oItemData.id, displayItemId, isNew));
            }
            else if (isVolatile) {
                elPanel.SetPanelEvent('onactivate', ShowVolatilePopup.bind(undefined, oItemData.id));
            }
            else if (InventoryAPI.GetLootListItemsCount(oItemData.id) > 0) {
                elPanel.SetPanelEvent('onactivate', ShowDecodePopup.bind(undefined, oItemData.id, oItemData.id, isNew));
            }
            else {
                elPanel.SetPanelEvent('onactivate', ShowInspectPopup.bind(undefined, oItemData.id));
            }
        }
        else
            elPanel.SetPanelEvent('onactivate', ShowInspectPopup.bind(undefined, oItemData.id));
    }
    function OpenOverlayToMarket(itemId) {
        let m_AppID = SteamOverlayAPI.GetAppID();
        let m_CommunityUrl = SteamOverlayAPI.GetSteamCommunityURL();
        let strSetName = InventoryAPI.GetItemSet(itemId);
        SteamOverlayAPI.OpenURL(m_CommunityUrl + "/market/search?q=&appid=" + m_AppID + "&lock_appid=" + m_AppID + "&category_" + m_AppID + "_ItemSet%5B%5D=tag_" + strSetName);
    }
    function ShowVolatilePopup(id) {
        const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('popup-inspect-' + id, 'file://{resources}/layout/popups/popup_offers_laptop.xml');
        let oSettings = {
            item_id: id,
            inspect_only: true,
            work_type: 'decodeable',
            only_close_btn: true
        };
        elPanel.Data().oSettings = oSettings;
    }
    function ShowDecodePopup(id, displayItemId, isNew) {
        var strExtraSettings = '';
        if (isNew) { // For new releases items allow multi-purchase dropdown, they are not truly coupons
            strExtraSettings = '&overridepurchasemultiple=1';
        }
        const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('popup-inspect-' + id, 'file://{resources}/layout/popups/popup_capability_decodable.xml');
        let oSettings = {
            item_id: displayItemId,
            store_item_id: id,
            force_hide_async_bar: true,
            show_work_type_warning: false,
            override_purchase_limit: isNew
        };
        elPanel.Data().oSettings = oSettings;
    }
    function ShowInspectPopup(id) {
        $.Msg("Store: _ShowInspectPopup " + id + " (" + id + ")");
        const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_inventory_inspect.xml');
        let oSettings = {
            item_id: id,
            inspect_only: false,
            show_work_type_warning: false,
            store_item_id: id
        };
        elPanel.Data().oSettings = oSettings;
    }
    let jsTooltipDelayHandle = null;
    function AddMouseOverEvents(elPanel, oItemData) {
        const tooltipHotspot = elPanel.FindChildTraverse('tooltip-hotspot');
        // panel.id isn't a valid tooltip target for normal store items. use the main image instead.
        const tooltipTargetPanelId = oItemData.isDropItem ? elPanel.id :
            oItemData.hasOwnProperty('linkedid') ? 'tooltip-hotspot' :
                oItemData.isNotReleased ? 'tooltip-hotspot' :
                    'id-itemtile-store-image-main';
        tooltipHotspot.SetPanelEvent('onmouseover', ShowTooltip.bind(undefined, elPanel, oItemData, tooltipTargetPanelId));
        tooltipHotspot.SetPanelEvent('onmouseout', HideTooltip);
    }
    function ShowTooltip(elPanel, oItemData, tooltipTargetPanelId) {
        jsTooltipDelayHandle = $.Schedule(.1, ShowToolTipOnDelay.bind(undefined, elPanel, oItemData, tooltipTargetPanelId));
    }
    function ShowToolTipOnDelay(elPanel, oItemData, tooltipTargetPanelId) {
        jsTooltipDelayHandle = null;
        let itemId = GetDisplayItemId(oItemData, oItemData.id);
        if (!InventoryAPI.IsItemInfoValid(itemId)) {
            return;
        }
        if (oItemData.hasOwnProperty('linkedid')) {
            UiToolkitAPI.ShowTextTooltip(tooltipTargetPanelId, '#store_linked_item_tooltip');
            return;
        }
        if (oItemData.hasOwnProperty('isNotReleased') && oItemData.isNotReleased) {
            if (oItemData.hasOwnProperty('linkedWarning') && oItemData.linkedWarning) {
                UiToolkitAPI.ShowTextTooltip(tooltipTargetPanelId, oItemData.linkedWarning);
            }
            return;
        }
        UiToolkitAPI.ShowCustomLayoutParametersTooltip(tooltipTargetPanelId, 'JsItemStoreTooltip', 'file://{resources}/layout/tooltips/tooltip_inventory_item.xml', 'itemid=' + itemId);
    }
    function HideTooltip() {
        UiToolkitAPI.HideCustomLayoutTooltip('JsItemStoreTooltip');
        UiToolkitAPI.HideTextTooltip();
        if (jsTooltipDelayHandle) {
            $.CancelScheduled(jsTooltipDelayHandle);
            jsTooltipDelayHandle = null;
        }
    }
})(ItemTileStore || (ItemTileStore = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXRlbXRpbGVfc3RvcmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9pdGVtdGlsZV9zdG9yZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBQ2xDLGtEQUFrRDtBQUNsRCw4Q0FBOEM7QUFDOUMsNkNBQTZDO0FBQzdDLDJDQUEyQztBQUMzQyxtREFBbUQ7QUFFbkQsSUFBVSxhQUFhLENBcVp0QjtBQXJaRCxXQUFVLGFBQWE7SUFFdEIsU0FBZ0IsSUFBSSxDQUFHLE9BQWdCLEVBQUUsU0FBcUI7UUFFN0QsSUFBSyxDQUFDLFNBQVMsSUFBSSxDQUFFLFNBQVMsQ0FBQyxjQUFjLENBQUUsZUFBZSxDQUFFLElBQUksU0FBUyxDQUFDLGFBQWEsQ0FBRSxFQUM3RjtZQUNDLE9BQU8sQ0FBQyxXQUFXLENBQUUsaUJBQWlCLEVBQUUsSUFBSSxDQUFFLENBQUM7WUFDL0MsT0FBTztTQUNQO1FBRUQsT0FBTyxDQUFDLFdBQVcsQ0FBRSxpQkFBaUIsRUFBRSxLQUFLLENBQUUsQ0FBQztRQUVoRCxnQkFBZ0IsQ0FBRSxPQUFPLEVBQUUsU0FBUyxDQUFFLENBQUM7UUFDdkMsb0JBQW9CLENBQUUsT0FBTyxFQUFFLFNBQVMsQ0FBRSxDQUFDO1FBQzNDLGFBQWEsQ0FBRSxPQUFPLEVBQUUsU0FBUyxDQUFFLENBQUM7UUFDcEMsT0FBTyxDQUFFLE9BQU8sRUFBRSxTQUFTLENBQUUsQ0FBQztRQUM5QixZQUFZLENBQUUsT0FBTyxFQUFFLFNBQVMsQ0FBQyxFQUFFLENBQUUsQ0FBQztRQUN0QyxhQUFhLENBQUUsT0FBTyxFQUFFLENBQUUsWUFBWSxDQUFFLFNBQVMsQ0FBRSxJQUFJLFNBQVMsQ0FBQyxVQUFXLENBQUUsQ0FBQyxDQUFDO1FBQ2hGLFdBQVcsQ0FBRSxPQUFPLEVBQUUsU0FBUyxDQUFDLGFBQWMsQ0FBQyxDQUFBO1FBQy9DLFFBQVEsQ0FBRSxPQUFPLEVB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