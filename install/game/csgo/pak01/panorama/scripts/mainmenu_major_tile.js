"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/licenseutil.ts" />
/// <reference path="generated/items_event_current_generated_store.d.ts" />
/// <reference path="generated/items_event_current_generated_store.ts" />
/// <reference path="common/major_store_prices.ts" />
var MainMenuMajorTile;
(function (MainMenuMajorTile) {
    const _m_cp = $.GetContextPanel();
    const _m_aTiles = [];
    function _UpdateVisibility() {
        const bVisible = MyPersonaAPI.IsConnectedToGC()
            && !LicenseUtil.GetCurrentLicenseRestrictions()
            && g_ActiveTournamentInfo.active;
        _m_cp.SetHasClass('hidden', !bVisible);
        if (bVisible) {
            StoreAPI.VolatileShopSubscribe(g_ActiveTournamentInfo.itemid_dynamic_stickers, false);
        }
    }
    function _FillCarousel() {
        const elCarousel = _m_cp.FindChildInLayoutFile('id-major-mini-store-carousel');
        MajorStorePrices.GetTopTeams()
            .map(team => MajorStorePrices.PickTeamSticker(team, false))
            .filter(itemId => itemId !== '')
            .forEach((itemId, i) => {
            const elTile = $.CreatePanel('Button', elCarousel, 'id-mini-store-tile-' + i);
            elTile.BLoadLayoutSnippet('major-shop-item');
            elTile.hittest = false;
            elTile.FindChildInLayoutFile('id-item-image').itemid = itemId;
            _m_aTiles.push({ elTile, itemId });
        });
    }
    function _UpdatePrices() {
        _m_aTiles.forEach(({ elTile, itemId }) => {
            const price = MajorStorePrices.GetItemPrice(itemId);
            MajorStorePrices.SetPriceOnPanel(elTile, price);
            elTile.SetHasClass('has-price', MajorStorePrices.GetEffectivePrice(price) > 0);
        });
    }
    function _ShowRealPrices(bShow) {
        _m_aTiles.forEach(({ elTile, itemId }) => {
            if (bShow) {
                MajorStorePrices.ShowRealPrice(elTile, MajorStorePrices.GetItemPrice(itemId));
            }
            else {
                MajorStorePrices.HideRealPrice(elTile);
            }
        });
    }
    function _OpenMajorHub() {
        UiToolkitAPI.ShowCustomLayoutPopupParameters('id-popup-major-hub', 'file://{resources}/layout/popups/popup_major_hub.xml', 'eventid=' + g_ActiveTournamentInfo.eventid);
    }
    {
        const elBtn = _m_cp.FindChildInLayoutFile('id-img-open-major-hub');
        elBtn.SetPanelEvent('onactivate', _OpenMajorHub);
        elBtn.SetPanelEvent('onmouseover', () => _ShowRealPrices(true));
        elBtn.SetPanelEvent('onmouseout', () => _ShowRealPrices(false));
        _m_cp.FindChildInLayoutFile('id-major-promo-image').SetImage('file://{images}/tournaments/backgrounds/pickem_mainmenu_promo_' + g_ActiveTournamentInfo.eventid + '.psd');
        _m_cp.style.backgroundImage = 'url( "file://{images}/tournaments/backgrounds/pickem_mainmenu_bg_' + g_ActiveTournamentInfo.eventid + '.psd" )';
        _m_cp.style.backgroundSize = '100% auto';
        _m_cp.style.backgroundPosition = '100% 100%';
        _m_cp.style.backgroundRepeat = 'no-repeat';
        _FillCarousel();
        _UpdateVisibility();
        _UpdatePrices();
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_GcLogonNotificationReceived', _UpdateVisibility);
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_UpdateConnectionToGC', _UpdateVisibility);
        $.RegisterForUnhandledEvent('PanoramaComponent_Store_PriceSheetChanged', _UpdatePrices);
        $.RegisterForUnhandledEvent('PanoramaComponent_Store_VolatileShopSubscribe', _UpdatePrices);
    }
})(MainMenuMajorTile || (MainMenuMajorTile = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbm1lbnVfbWFqb3JfdGlsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL21haW5tZW51X21ham9yX3RpbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUNsQyw4Q0FBOEM7QUFDOUMsMkVBQTJFO0FBQzNFLHlFQUF5RTtBQUN6RSxxREFBcUQ7QUFFckQsSUFBVSxpQkFBaUIsQ0FnRzFCO0FBaEdELFdBQVUsaUJBQWlCO0lBRTFCLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztJQUNsQyxNQUFNLFNBQVMsR0FBMEMsRUFBRSxDQUFDO0lBRTVELFNBQVMsaUJBQWlCO1FBR3pCLE1BQU0sUUFBUSxHQUFHLFlBQVksQ0FBQyxlQUFlLEVBQUU7ZUFDM0MsQ0FBQyxXQUFXLENBQUMsNkJBQTZCLEVBQUU7ZUFDNUMsc0JBQXNCLENBQUMsTUFBTSxDQUFDO1FBRWxDLEtBQUssQ0FBQyxXQUFXLENBQUUsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFFLENBQUM7UUFDekMsSUFBSyxRQUFRLEVBQ2I7WUFFQyxRQUFRLENBQUMscUJBQXFCLENBQUUsc0JBQXNCLENBQUMsdUJBQXVCLEVBQUUsS0FBSyxDQUFFLENBQUM7U0FDeEY7SUFDRixDQUFDO0lBR0QsU0FBUyxhQUFhO1FBRXJCLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxxQkFBcUIsQ0FBRSw4QkFBOEIsQ0FBRSxDQUFDO1FBQ2pGLGdCQUFnQixDQUFDLFdBQVcsRUFBRTthQUM1QixHQUFHLENBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxlQUFlLENBQUUsSUFBSSxFQUFFLEtBQUssQ0FBRSxDQUFFO2FBQzlELE1BQU0sQ0FBRSxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sS0FBSyxFQUFFLENBQUU7YUFDakMsT0FBTyxDQUFFLENBQUUsTUFBTSxFQUFF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