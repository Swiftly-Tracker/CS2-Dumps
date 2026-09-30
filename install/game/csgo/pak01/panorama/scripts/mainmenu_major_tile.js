"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/licenseutil.ts" />
/// <reference path="generated/items_event_current_generated_store.d.ts" />
/// <reference path="generated/items_event_current_generated_store.ts" />
var MainMenuMajorTile;
(function (MainMenuMajorTile) {
    const _m_cp = $.GetContextPanel();
    function _Init() {
        // HACK: Cologne 2026 pass/pack are no longer sold but the generated config still says active,
        // so force the main-menu major tile hidden until the next event ships.
        const bForceHidden = true;
        let bVisible = !bForceHidden;
        $.Msg('MainMenuMajorTile::_Init active=' + g_ActiveTournamentInfo.active);
        if (!MyPersonaAPI.IsConnectedToGC())
            bVisible = false; // not connected to GC
        else if (LicenseUtil.GetCurrentLicenseRestrictions())
            bVisible = false; // "no CS2 ownership"
        else if (!g_ActiveTournamentInfo.active)
            bVisible = false; // items are no longer available in the store
        _m_cp.SetHasClass('hidden', !bVisible);
        if (!bVisible)
            return;
        // Request that volatile shop prices get downloaded, but only if they have never been downloaded again
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
            //
            // Build a mapping of weekly discount tiers to stickers
            //
            g_ActiveTournamentTeams.forEach((tt) => {
                // ranked Series
                tt.players.forEach((tp) => tp.rankingids.forEach(fnStickerKit));
                // event Series
                // tt.stickerids.forEach( fnStickerKit );
            });
            g_ActiveTournamentInfo.rankingids.forEach(fnStickerKit);
            // shuffle ( O(N) ) and sort ( O( N logN ) )
            for (let i = arrSorted.length; i-- > 0;) {
                const j = Math.floor(Math.random() * (i + 1));
                [arrSorted[i], arrSorted[j]] = [arrSorted[j], arrSorted[i]];
            }
            arrSorted.sort((a, b) => b.price - a.price);
            // determine which discount we will show
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
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        _Init();
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_GcLogonNotificationReceived', _Init);
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_UpdateConnectionToGC', _Init);
        $.RegisterForUnhandledEvent('PanoramaComponent_Store_PriceSheetChanged', _Init);
        $.RegisterForUnhandledEvent('PanoramaComponent_Store_VolatileShopSubscribe', _Init);
    }
})(MainMenuMajorTile || (MainMenuMajorTile = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbm1lbnVfbWFqb3JfdGlsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL21haW5tZW51X21ham9yX3RpbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUNsQyw4Q0FBOEM7QUFDOUMsMkVBQTJFO0FBQzNFLHlFQUF5RTtBQUV6RSxJQUFVLGlCQUFpQixDQW9JMUI7QUFwSUQsV0FBVSxpQkFBaUI7SUFFMUIsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBRWxDLFNBQVMsS0FBSztRQUViLDhGQUE4RjtRQUM5Rix1RUFBdUU7UUFDdkUsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDO1FBRTFCLElBQUksUUFBUSxHQUFZLENBQUMsWUFBWSxDQUFDO1FBRXRDLENBQUMsQ0FBQyxHQUFHLENBQUUsa0NBQWtDLEdBQUcsc0JBQXNCLENBQUMsTUFBTSxDQUFFLENBQUM7UUFFNUUsSUFBSyxDQUFDLFlBQVksQ0FBQyxlQUFlLEVBQUU7WUFDbkMsUUFBUSxHQUFHLEtBQUssQ0FBQyxDQUFDLHNCQUFzQjthQUNwQyxJQUFLLFdBQVcsQ0FBQyw2QkFBNkIsRUFBRTtZQUNwRCxRQUFRLEdBQUcsS0FBSyxDQUFDLENBQUMscUJBQXFCO2FBQ25DLElBQUssQ0FBQyxzQkFBc0IsQ0FBQyxNQUFNO1lBQ3ZDLFFBQVEsR0FBRyxLQUFLLENBQUMsQ0FBQyw2Q0FBNkM7UUFFMUQsS0FBSyxDQUFDLFdBQVcsQ0FBRSxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUUsQ0FBQztRQUMvQyxJQUFLLENBQUMsUUFBUTtZQUNiLE9BQU87UUFFUixzR0FBc0c7UUFDdEcsUUFBUSxDQUFDLHFCQUFxQixDQUFFLHNCQUFzQixDQUFDLHdCQUF3QixFQUFFLEtBQUssQ0FBRSxDQUFDO1FBRXpGLEtBQUssQ0FBQyxxQkFBcUIsQ0FBRSx1QkFBdUIsQ0FBRSxD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