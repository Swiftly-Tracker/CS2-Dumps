"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/licenseutil.ts" />
/// <reference path="generated/items_event_current_generated_store.d.ts" />
/// <reference path="generated/items_event_current_generated_store.ts" />
var MainMenuMajorTile;
(function (MainMenuMajorTile) {
    const _m_cp = $.GetContextPanel();
    function _Init() {
        let bVisible = true;
        if (!MyPersonaAPI.IsConnectedToGC())
            bVisible = false;
        else if (LicenseUtil.GetCurrentLicenseRestrictions())
            bVisible = false;
        else if (!g_ActiveTournamentInfo.active)
            bVisible = false;
        _m_cp.SetHasClass('hidden', !bVisible);
        if (!bVisible)
            return;
        StoreAPI.VolatileShopSubscribe(g_ActiveTournamentInfo.itemid_rankings_stickers, false);
        _m_cp.FindChildInLayoutFile('id-img-open-major-hub').SetPanelEvent('onactivate', OpenMajorHub);
        _m_cp.SetHasClass('major-' + g_ActiveTournamentInfo.eventid.toString(), true);
        _m_cp.FindChildInLayoutFile('id-major-promo-image').SetImage('file://{images}/tournaments/backgrounds/pickem_mainmenu_promo_' + g_ActiveTournamentInfo.eventid + '.psd');
        let bHasActualCapsulesForPurchase = false;
        _m_cp.SetHasClass('has-reduction', false);
        let tournamentEventId = NewsAPI.GetActiveTournamentEventID();
        if ((tournamentEventId !== 0)) {
            let arrSorted = [];
            const defidxStickerItem = InventoryAPI.GetItemDefinitionIndexFromDefinitionName('sticker');
            const fnStickerKit = (nStickerKit) => {
                const fauxId = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(defidxStickerItem, nStickerKit);
                const cHigh = MissionsAPI.GetSeasonalOperationFauxItemTrend(g_ActiveTournamentInfo.credits_id, fauxId, 'high');
                const cPrice = MissionsAPI.GetSeasonalOperationFauxCreditsCost(g_ActiveTournamentInfo.credits_id, fauxId);
                const weeklyPctReductionFromHigh = (cHigh > cPrice) ? ((cHigh - cPrice) * 100.0 / cHigh) : 0.0;
                arrSorted.push({ discount: weeklyPctReductionFromHigh, price: cPrice, fauxid: fauxId });
            };
            g_ActiveTournamentTeams.forEach((tt) => {
                tt.players.forEach((tp) => tp.rankingids.forEach(fnStickerKit));
            });
            g_ActiveTournamentInfo.rankingids.forEach(fnStickerKit);
            for (let i = arrSorted.length; i-- > 0;) {
                const j = Math.floor(Math.random() * (i + 1));
                [arrSorted[i], arrSorted[j]] = [arrSorted[j], arrSorted[i]];
            }
            arrSorted.sort((a, b) => b.price - a.price);
            const nBaseIndex = Math.floor(Math.random() * (arrSorted.length / 10));
            let elParent = $.GetContextPanel().FindChildInLayoutFile('id-major-mini-store-carousel');
            const _m_numMiniStoreItemsToShow = 10;
            for (let i = 0; i < _m_numMiniStoreItemsToShow; i++) {
                const nIndex = nBaseIndex + i;
                let elTile = elParent.FindChildInLayoutFile('id-mini-store-tile-' + i);
                if (!elTile) {
                    elTile = $.CreatePanel('Button', elParent, 'id-mini-store-tile-' + i);
                    elTile.BLoadLayoutSnippet('major-shop-item');
                    elTile.hittest = false;
                }
                elTile.FindChildInLayoutFile('id-item-image').itemid = arrSorted[nIndex].fauxid;
                elTile.SetDialogVariableInt('price', arrSorted[nIndex].price);
                elTile.FindChildInLayoutFile('id-item-inspect-btn').SetPanelEvent('onactivate', () => {
                    const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_inventory_inspect.xml');
                    let oSettings = {
                        item_id: arrSorted[nIndex].fauxid,
                        inspect_only: true,
                        hide_all_action_items: true,
                        price_in_tokens: arrSorted[nIndex].price,
                    };
                    elPanel.Data().oSettings = oSettings;
                });
            }
            bHasActualCapsulesForPurchase = true;
        }
        _m_cp.SetDialogVariable('hub-title-bar-caption', $.Localize(bHasActualCapsulesForPurchase ? '#mainmenu_major_hub' : '#mainmenu_major_hub_no_items'));
        _m_cp.SetHasClass('can-sell-items', bHasActualCapsulesForPurchase);
    }
    function OpenMajorHub() {
        UiToolkitAPI.ShowCustomLayoutPopupParameters('id-popup-major-hub', 'file://{resources}/layout/popups/popup_major_hub.xml', 'eventid=' + (g_ActiveTournamentInfo.eventid));
    }
    {
        _Init();
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_GcLogonNotificationReceived', _Init);
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_UpdateConnectionToGC', _Init);
        $.RegisterForUnhandledEvent('PanoramaComponent_Store_PriceSheetChanged', _Init);
        $.RegisterForUnhandledEvent('PanoramaComponent_Store_VolatileShopSubscribe', _Init);
    }
})(MainMenuMajorTile || (MainMenuMajorTile = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbm1lbnVfbWFqb3JfdGlsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL21haW5tZW51X21ham9yX3RpbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUNsQyw4Q0FBOEM7QUFDOUMsMkVBQTJFO0FBQzNFLHlFQUF5RTtBQUV6RSxJQUFVLGlCQUFpQixDQWdJMUI7QUFoSUQsV0FBVSxpQkFBaUI7SUFFMUIsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBRWxDLFNBQVMsS0FBSztRQUViLElBQUksUUFBUSxHQUFZLElBQUksQ0FBQztRQUk3QixJQUFLLENBQUMsWUFBWSxDQUFDLGVBQWUsRUFBRTtZQUNuQyxRQUFRLEdBQUcsS0FBSyxDQUFDO2FBQ2IsSUFBSyxXQUFXLENBQUMsNkJBQTZCLEVBQUU7WUFDcEQsUUFBUSxHQUFHLEtBQUssQ0FBQzthQUNiLElBQUssQ0FBQyxzQkFBc0IsQ0FBQyxNQUFNO1lBQ3ZDLFFBQVEsR0FBRyxLQUFLLENBQUM7UUFFWixLQUFLLENBQUMsV0FBVyxDQUFFLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBRSxDQUFDO1FBQy9DLElBQUssQ0FBQyxRQUFRO1lBQ2IsT0FBTztRQUdSLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBRSxzQkFBc0IsQ0FBQyx3QkFBd0IsRUFBRSxLQUFLLENBQUUsQ0FBQztRQUV6RixLQUFLLENBQUMscUJBQXFCLENBQUUsdUJBQXVCLENBQUUsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLFlBQVksQ0FBRSxDQUFDO1FBQ25HLEtBQUssQ0FBQyxXQUFXLENBQUUsUUFBUSxHQUFHLHNCQUFzQixDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUU5RSxLQUFLLENBQUMscUJBQXFCLENBQUUsc0JBQXNCLENBQWMsQ0FBQyxRQUFRLENB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