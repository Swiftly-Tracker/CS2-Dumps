"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/licenseutil.ts" />
/// <reference path="common/store_items.ts" />
/// <reference path="itemtile_store.ts" />
var MainMenuMiniStore;
(function (MainMenuMiniStore) {
    const _m_StorePanel = $.GetContextPanel();
    function _Init() {
        $.Msg('Item-mini-store- ' + "Init");
        if (!MyPersonaAPI.IsConnectedToGC()) {
            _m_StorePanel.SetHasClass('hidden', true);
            return;
        }
        let restrictions = LicenseUtil.GetCurrentLicenseRestrictions();
        if (restrictions) {
            $.Msg('Item-mini-store- restrictions: ' + restrictions);
            _m_StorePanel.SetHasClass('hidden', true);
            return;
        }
        $.GetContextPanel().FindChildInLayoutFile('id-open-fullscreen-store-btn').SetPanelEvent('onactivate', () => {
            $.DispatchEvent('MainMenuGoToStore', '');
        });
        _GetStoreItems();
    }
    function _GetStoreItems() {
        $.Msg('Item-mini-store- ' + "_GetStoreItems");
        $.Msg('Item-mini-store- ' + StoreItems.GetStoreItems().coupon.length);
        if (StoreItems.GetStoreItems().coupon && StoreItems.GetStoreItems().coupon.length < 1) {
            StoreItems.MakeStoreItemList();
        }
        let aItemsList = StoreItems.GetStoreItems().coupon;
        if (aItemsList.length < 1) {
            _m_StorePanel.SetHasClass('hidden', true);
            return;
        }
        _MakeStoreItemTiles(aItemsList);
        _m_StorePanel.SetHasClass('hidden', false);
    }
    let _m_numMiniStoreItemsToShow = 5; // show at least 5, but might be more if we have more "new coupons"
    function _MakeStoreItemTiles(aItemsList) {
        $.Msg('Item-mini-store- ' + "_MakeStoreItemTiles();");
        let elParent = $.GetContextPanel().FindChildInLayoutFile('id-mini-store-carousel');
        // Calculate how many offers are "new"
        let numNewPinnedOffers = 0;
        for (let i = 0; i < aItemsList.length; i++) {
            let oItemData = aItemsList[i];
            if (oItemData.isNewRelease)
                ++numNewPinnedOffers;
            else
                break;
        }
        // Make all the new tiles, possibly bump the max count of tiles (but do not decrease it)
        _m_numMiniStoreItemsToShow = Math.max(_m_numMiniStoreItemsToShow, numNewPinnedOffers);
        for (let i = 0; i < _m_numMiniStoreItemsToShow; i++) {
            let oItemData = aItemsList[i];
            oItemData.isDisplayedInMainMenu = true;
            $.Msg('Item-mini-store- ' + $.Localize(InventoryAPI.GetRawDefinitionKey(oItemData.id, 'item_name') + '_tinyname'));
            let elTile = elParent.FindChildInLayoutFile('id-mini-store-tile' + aItemsList[i].id);
            if (!elTile) {
                elTile = $.CreatePanel('Button', elParent, 'id-mini-store-tile' + aItemsList[i].id);
                elTile.BLoadLayout('file://{resources}/layout/itemtile_store.xml', false, false);
            }
            ItemTileStore.Init(elTile, aItemsList[i]);
        }
    }
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        _Init();
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_GcLogonNotificationReceived', _Init);
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_UpdateConnectionToGC', _Init);
        $.RegisterForUnhandledEvent('PanoramaComponent_Store_PriceSheetChanged', _Init);
    }
})(MainMenuMiniStore || (MainMenuMiniStore = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbm1lbnVfbWluaV9zdG9yZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL21haW5tZW51X21pbmlfc3RvcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUNsQyw4Q0FBOEM7QUFDOUMsOENBQThDO0FBQzlDLDBDQUEwQztBQUUxQyxJQUFVLGlCQUFpQixDQWlHMUI7QUFqR0QsV0FBVSxpQkFBaUI7SUFFMUIsTUFBTSxhQUFhLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBRTFDLFNBQVMsS0FBSztRQUViLENBQUMsQ0FBQyxHQUFHLENBQUUsbUJBQW1CLEdBQUcsTUFBTSxDQUFFLENBQUM7UUFFdEMsSUFBSyxDQUFDLFlBQVksQ0FBQyxlQUFlLEVBQUUsRUFDcEM7WUFDQyxhQUFhLENBQUMsV0FBVyxDQUFFLFFBQVEsRUFBRSxJQUFJLENBQUUsQ0FBQztZQUM1QyxPQUFPO1NBQ1A7UUFFRCxJQUFJLFlBQVksR0FBRyxXQUFXLENBQUMsNkJBQTZCLEVBQUUsQ0FBQztRQUMvRCxJQUFJLFlBQVksRUFDaEI7WUFDQyxDQUFDLENBQUMsR0FBRyxDQUFFLGlDQUFpQyxHQUFHLFlBQVksQ0FBRSxDQUFDO1lBQzFELGFBQWEsQ0FBQyxXQUFXLENBQUUsUUFBUSxFQUFFLElBQUksQ0FBRSxDQUFDO1lBQzVDLE9BQU87U0FDUDtRQUVELENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSw4QkFBOEIsQ0FBRSxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsR0FBRSxFQUFFO1lBQzVHLENBQUMsQ0FBQyxhQUFhLENBQUUsbUJBQW1CLEVBQUUsRUFBRSxDQUFFLENBQUM7UUFDNUMsQ0FBQyxDQUFDLENBQUM7UUFFSCxjQUFjLEVBQUUsQ0FBQztJQUNsQixDQUFDO0lBRUQsU0FBUyxjQUFjO1FBRXRCLENBQUMsQ0FBQyxHQUFHLENB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