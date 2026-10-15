"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/licenseutil.ts" />
/// <reference path="common/store_items.ts" />
/// <reference path="itemtile_store.ts" />
var MainMenuMiniStore;
(function (MainMenuMiniStore) {
    const _m_StorePanel = $.GetContextPanel();
    function _Init() {
        if (!MyPersonaAPI.IsConnectedToGC()) {
            _m_StorePanel.SetHasClass('hidden', true);
            return;
        }
        let restrictions = LicenseUtil.GetCurrentLicenseRestrictions();
        if (restrictions) {
            _m_StorePanel.SetHasClass('hidden', true);
            return;
        }
        $.GetContextPanel().FindChildInLayoutFile('id-open-fullscreen-store-btn').SetPanelEvent('onactivate', () => {
            $.DispatchEvent('MainMenuGoToStore', '');
        });
        _GetStoreItems();
    }
    function _GetStoreItems() {
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
    let _m_numMiniStoreItemsToShow = 5;
    function _MakeStoreItemTiles(aItemsList) {
        let elParent = $.GetContextPanel().FindChildInLayoutFile('id-mini-store-carousel');
        let numNewPinnedOffers = 0;
        for (let i = 0; i < aItemsList.length; i++) {
            let oItemData = aItemsList[i];
            if (oItemData.isNewRelease)
                ++numNewPinnedOffers;
            else
                break;
        }
        _m_numMiniStoreItemsToShow = Math.max(_m_numMiniStoreItemsToShow, numNewPinnedOffers);
        for (let i = 0; i < _m_numMiniStoreItemsToShow; i++) {
            let oItemData = aItemsList[i];
            oItemData.isDisplayedInMainMenu = true;
            let elTile = elParent.FindChildInLayoutFile('id-mini-store-tile' + aItemsList[i].id);
            if (!elTile) {
                elTile = $.CreatePanel('Button', elParent, 'id-mini-store-tile' + aItemsList[i].id);
                elTile.BLoadLayout('file://{resources}/layout/itemtile_store.xml', false, false);
            }
            ItemTileStore.Init(elTile, aItemsList[i]);
        }
    }
    {
        _Init();
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_GcLogonNotificationReceived', _Init);
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_UpdateConnectionToGC', _Init);
        $.RegisterForUnhandledEvent('PanoramaComponent_Store_PriceSheetChanged', _Init);
    }
})(MainMenuMiniStore || (MainMenuMiniStore = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbm1lbnVfbWluaV9zdG9yZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL21haW5tZW51X21pbmlfc3RvcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUNsQyw4Q0FBOEM7QUFDOUMsOENBQThDO0FBQzlDLDBDQUEwQztBQUUxQyxJQUFVLGlCQUFpQixDQWlHMUI7QUFqR0QsV0FBVSxpQkFBaUI7SUFFMUIsTUFBTSxhQUFhLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBRTFDLFNBQVMsS0FBSztRQUliLElBQUssQ0FBQyxZQUFZLENBQUMsZUFBZSxFQUFFLEVBQ3BDO1lBQ0MsYUFBYSxDQUFDLFdBQVcsQ0FBRSxRQUFRLEVBQUUsSUFBSSxDQUFFLENBQUM7WUFDNUMsT0FBTztTQUNQO1FBRUQsSUFBSSxZQUFZLEdBQUcsV0FBVyxDQUFDLDZCQUE2QixFQUFFLENBQUM7UUFDL0QsSUFBSSxZQUFZLEVBQ2hCO1lBRUMsYUFBYSxDQUFDLFdBQVcsQ0FBRSxRQUFRLEVBQUUsSUFBSSxDQUFFLENBQUM7WUFDNUMsT0FBTztTQUNQO1FBRUQsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLDhCQUE4QixDQUFFLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxHQUFFLEVBQUU7WUFDNUcsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxtQkFBbUIsRUFBRSxFQUFFLENBQUUsQ0FBQztRQUM1QyxDQUFDLENBQUMsQ0FBQztRQUVILGNBQWMsRUFBRSxDQUFDO0lBQ2xCLENBQUM7SUFFRCxTQUFTLGNBQWM7UUFLdEIsSUFBSyxVQUFVLENBQUMsYUFBYSxFQUFFLENBQUMsTUFBTSxJQUFJLFVBQVUsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxNQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsRUFDdkY7WUFDQyxVQUFVLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztTQUMvQjtRQUVELElBQUksVUFBVSxHQUFHLFVBQVUsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxNQUF1QixDQUFDO1FBRXBFLElBQUssVUFBVyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQzNCO1lBQ0MsYUFBYSxDQUFDLFdBQVcsQ0FBRSxRQUFRLEVBQUUsSUFBSSxDQUFFLENBQUM7WUFDNUMsT0FBTztTQUNQO1FBRUQsbUJBQW1CLENBQUUsVUFBVSxDQUFFLENBQUM7UUFDbEMsYUFBYSxDQUFDLFdBQVcsQ0FBRSxRQUFRLEVBQUUsS0FBSyxDQUFFLENBQUM7SUFDOUMsQ0FBQztJQUVELElBQUksMEJBQTBCLEdBQVcsQ0FBQyxDQUFDO0lBQzNDLFNBQVMsbUJBQW1CLENBQUUsVUFBd0I7UUFHckQsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLHdCQUF3QixDQUFFLENBQUM7UUFHckYsSUFBSSxrQkFBa0IsR0FBVyxDQUFDLENBQUM7UUFDbkMsS0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQzNDO1lBQ0MsSUFBSSxTQUFTLEdBQWdCLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMzQyxJQUFLLFNBQVMsQ0FBQyxZQUFZO2dCQUMxQixFQUFHLGtCQUFrQixDQUFDOztnQkFFdEIsTUFBTTtTQUNQO1FBR0QsMEJBQTBCLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBRSwwQkFBMEIsRUFBRSxrQkFBa0IsQ0FBRSxDQUFDO1FBQ3hGLEtBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRywwQkFBMEIsRUFBRSxDQUFDLEVBQUUsRUFDcEQ7WUFDQyxJQUFJLFNBQVMsR0FBZ0IsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNDLFNBQVMsQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLENBQUM7WUFHdkMsSUFBSSxNQUFNLEdBQUcsUUFBUSxDQUFDLHFCQUFxQixDQUFFLG9CQUFvQixHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUN0RixJQUFLLENBQUMsTUFBTSxFQUNaO2dCQUNDLE1BQU0sR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsb0JBQW9CLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBYyxDQUFDO2dCQUNsRyxNQUFNLENBQUMsV0FBVyxDQUFFLDhDQUE4QyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUUsQ0FBQzthQUNuRjtZQUVELGFBQWEsQ0FBQyxJQUFJLENBQUUsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDO1NBQzVDO0lBQ0YsQ0FBQztJQUtEO1FBQ0MsS0FBSyxFQUFFLENBQUM7UUFDUixDQUFDLENBQUMseUJBQXlCLENBQUUseURBQXlELEVBQUUsS0FBSyxDQUFFLENBQUM7UUFDaEcsQ0FBQyxDQUFDLHlCQUF5QixDQUFFLGtEQUFrRCxFQUFFLEtBQUssQ0FBRSxDQUFDO1FBRXpGLENBQUMsQ0FBQyx5QkFBeUIsQ0FBRSwyQ0FBMkMsRUFBRSxLQUFLLENBQUUsQ0FBQztLQUNsRjtBQUNGLENBQUMsRUFqR1MsaUJBQWlCLEtBQWpCLGlCQUFpQixRQWlHMUIifQ==