"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/licenseutil.ts" />
/// <reference path="common/icon.ts" />
/// <reference path="common/iteminfo.ts" />
/// <reference path="common/store_items.ts" />
/// <reference path="popups/popup_acknowledge_item.ts" />
/// <reference path="xpshop_track.ts" />
/// <reference path="itemtile_store.ts" />
/// <reference path="xpshop.ts" />
var MainMenuXpShop;
(function (MainMenuXpShop) {
    const _m_XpShopPanel = $.GetContextPanel();
    const m_passDefName = 'XpShopTicket1';
    const m_passId = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(InventoryAPI.GetItemDefinitionIndexFromDefinitionName(m_passDefName), 0);
    let m_displayStarted = false;
    let m_nTrack;
    let m_scheduleHandleRepeatCollage = null;
    function _Init() {
        $.Msg('Item-xpshop tile- ' + "_Init");
        if (!_ShouldShow()) {
            return;
        }
        $.GetContextPanel().FindChildInLayoutFile('id-btn-open-xpshop').SetPanelEvent('onactivate', () => {
            $.DispatchEvent('MainMenuGoToStore', 'id-store-nav-xpshop');
        });
        _GetXpShopItems();
    }
    function _GetXpShopItems() {
        m_nTrack = MissionsAPI.GetSeasonalOperationXpShopIndex();
        if (!m_nTrack || m_nTrack === 0) {
            _m_XpShopPanel.SetHasClass('hidden', true);
            return;
        }
        _SetUpTracks();
        if (!m_displayStarted) {
            // only start this once
            _MakeStoreItemTiles(_GetItemsForDisplay());
            m_displayStarted = true;
        }
        _m_XpShopPanel.SetHasClass('hidden', false);
    }
    function _ShouldShow() {
        if (!MyPersonaAPI.IsConnectedToGC()) {
            _m_XpShopPanel.SetHasClass('hidden', true);
            return false;
        }
        let restrictions = LicenseUtil.GetCurrentLicenseRestrictions();
        if (restrictions) {
            _m_XpShopPanel.SetHasClass('hidden', true);
            return false;
        }
        return true;
    }
    function _SetUpTracks() {
        let bHasPrime = FriendsListAPI.GetFriendPrimeEligible(MyPersonaAPI.GetXuid());
        AcknowledgeItems.GetItemsByType([m_passDefName], true);
        InventoryAPI.SetInventorySortAndFilters('inv_sort_age', false, 'item_definition:' + m_passDefName, '', '');
        let nPass = bHasPrime ? InventoryAPI.GetInventoryCount() : 0;
        let passIndex = 0;
        let oXpShopTrackProgress = InventoryAPI.GetCacheTypeElementJSOByIndex('XpShop', 0);
        const elTracksContainer = $.GetContextPanel().FindChildInLayoutFile('id-tracks-container');
        const elBalance = $.GetContextPanel().FindChildInLayoutFile('id-balance');
        const elUpsell = $.GetContextPanel().FindChildInLayoutFile('id-upsell');
        const elTitle = $.GetContextPanel().FindChildInLayoutFile('id-xpshop-title');
        elTracksContainer.SetDialogVariableInt('max-stars', StoreAPI.GetXpShopMaxTrackLevel());
        const bHasXpShopTracksOrBalance = oXpShopTrackProgress && (oXpShopTrackProgress.xp_tracks.length > 0 || oXpShopTrackProgress.redeemable_balance > 0);
        if (nPass > 0 || bHasXpShopTracksOrBalance) {
            elTracksContainer.visible = true;
            elTitle.visible = true;
            elBalance.visible = false;
            elUpsell.visible = false;
            let numVisiblePassesOrTracks = 0;
            let elParent = $.GetContextPanel().FindChildInLayoutFile('id-tracks');
            for (let i = 0; i < StoreAPI.GetXpShopMaxTracks(); i++) {
                let elTrack = elParent.FindChildInLayoutFile('id-xpshop_track_' + i);
                if (!elTrack) {
                    elTrack = $.CreatePanel('Panel', elParent, 'id-xpshop_track_' + i);
                    elTrack.BLoadLayoutSnippet('mainmenu-shop-ticket');
                    elTrack.FindChildInLayoutFile('id-mainmenu-xpshop-track-progress').BLoadLayout('file://{resources}/layout/xpshop_track.xml', false, false);
                }
                let elTrackProgress = elTrack.FindChildInLayoutFile('id-mainmenu-xpshop-track-progress');
                let elPass = elTrack.FindChildInLayoutFile('id-mainmenu-xpshop-pass');
                let oSettings;
                if (oXpShopTrackProgress && oXpShopTrackProgress.xp_tracks[i]) {
                    oSettings = {
                        xpshop_track_frame_panel: elTrack,
                        xpshop_track_value: parseInt(oXpShopTrackProgress.xp_tracks[i]),
                    };
                    XpShopTrack.XpShopInit(oSettings);
                    elTrack.visible = true;
                    elTrackProgress.visible = true;
                    elPass.visible = false;
                    ++numVisiblePassesOrTracks;
                }
                else if (nPass > 0 && passIndex < nPass) {
                    passIndex++;
                    oSettings = {
                        xpshop_track_frame_panel: elTrack,
                        xpshop_track_value: 0,
                    };
                    XpShopTrack.XpShopInit(oSettings);
                    elTrackProgress.visible = false;
                    elPass.visible = true;
                    elPass.SetHasClass('small-passes', nPass > 2 ? true : false);
                    elTrack.visible = true;
                    ++numVisiblePassesOrTracks;
                }
                else {
                    elTrack.visible = false;
                }
            }
            if (oXpShopTrackProgress && oXpShopTrackProgress.redeemable_balance !== undefined) {
                elBalance.SetDialogVariableInt('redeemable-points', oXpShopTrackProgress.redeemable_balance);
                elBalance.Data().balance = oXpShopTrackProgress.redeemable_balance;
                elBalance.visible = true;
            }
            if (!numVisiblePassesOrTracks) {
                elUpsell.visible = true;
                elTracksContainer.visible = false;
            }
        }
        else {
            elTracksContainer.visible = false;
            elBalance.visible = false;
            elUpsell.visible = true;
            elTitle.visible = false;
            elUpsell.FindChildInLayoutFile('id-upsell-pass-image').itemid = m_passId;
        }
    }
    let m_tilePreviouslyUpdated = null;
    function _GetItemsForDisplay() {
        let nCount = MissionsAPI.GetSeasonalOperationRedeemableGoodsCount(m_nTrack);
        let aXpShopItems = [];
        let nNewItemCount = 0;
        if (nCount < 1) {
            return [];
        }
        for (let i = 0; i < nCount; i++) {
            const ShopEntry = {
                item_name: MissionsAPI.GetSeasonalOperationRedeemableGoodsSchema(m_nTrack, i, 'item_name'),
                lootlist: [],
                ui_show_new_tag: MissionsAPI.GetSeasonalOperationRedeemableGoodsSchema(m_nTrack, i, 'ui_show_new_tag')
            };
            const isNew = XpShop.ShouldShowNewTagForShopEntry(ShopEntry);
            nNewItemCount = isNew ? nNewItemCount++ : nNewItemCount;
            _GetLootListForReward(ShopEntry.item_name).forEach(itemId => {
                aXpShopItems.push({
                    item_name: InventoryAPI.GetItemName(itemId),
                    itemId: itemId,
                    ui_show_new_tag: isNew
                });
            });
        }
        const newItems = aXpShopItems.filter(item => item.ui_show_new_tag);
        const oldItems = aXpShopItems.filter(item => !item.ui_show_new_tag);
        const numItemsInCarousel = 12;
        let aShuffleItems = [];
        if (newItems.length > 0) {
            const nMaxNewItems = Math.round(.6 * numItemsInCarousel);
            const sampleSize = Math.min(newItems.length, nMaxNewItems);
            aShuffleItems = _GetRandomSample([..._GetRandomSample(newItems, sampleSize), ..._GetRandomSample(oldItems, numItemsInCarousel - sampleSize)], numItemsInCarousel);
            aShuffleItems.sort((a, b) => {
                if (a.ui_show_new_tag && !b.ui_show_new_tag)
                    return -1; //push a
                if (!a.ui_show_new_tag && b.ui_show_new_tag)
                    return 1; // push b 
                return 0; // Both or neither have it. Keep the same.
            });
        }
        else {
            aShuffleItems = _GetRandomSample(oldItems, numItemsInCarousel);
        }
        return aShuffleItems;
    }
    function _GetRandomSample(items, sampleSize = 10) {
        const size = Math.min(sampleSize, items.length);
        // Shallow copy 
        const copy = [...items];
        for (let i = 0; i < size; i++) {
            const randomIndex = i + Math.floor(Math.random() * (copy.length - i));
            // Swap elements
            [copy[i], copy[randomIndex]] = [copy[randomIndex], copy[i]];
        }
        return copy.slice(0, size);
    }
    function _GetLootListForReward(rewardId) {
        if (rewardId.startsWith('crate_')) {
            let nDefinitionIndex = InventoryAPI.GetItemDefinitionIndexFromDefinitionName(rewardId);
            let idCrate = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(nDefinitionIndex, 0);
            return [idCrate];
        }
        var count = InventoryAPI.GetLootListItemsCount(rewardId);
        var itemsList = [];
        if (!count) {
            itemsList.push(rewardId);
        }
        else {
            for (var i = 0; i < count; i++) {
                var itemId = InventoryAPI.GetLootListItemIdByIndex(rewardId, i);
                itemsList.push(itemId);
            }
        }
        return itemsList;
    }
    ;
    function _MakeStoreItemTiles(aItemsList) {
        let elParent = $.GetContextPanel().FindChildInLayoutFile('id-mainmenu-xpshop-carousel');
        // Make all the new tiles, possibly bump the max count of tiles (but do not decrease it)
        for (let i = 0; i < aItemsList.length; i++) {
            let elTile = elParent.FindChildInLayoutFile('id-mainmenu-xpshop-store-tile' + aItemsList[i].itemId);
            if (!elTile) {
                elTile = $.CreatePanel('Panel', elParent, 'id-mainmenu-xpshop-store-tile' + aItemsList[i].itemId);
                elTile.BLoadLayoutSnippet('mainmenu-xpshop-itemtile');
                elTile.FindChildInLayoutFile('id-item-image').itemid = aItemsList[i].itemId;
                // (elTile.FindChildInLayoutFile( 'id-item-image-blur' ) as ItemImage_t).itemid = aItemsList[i].itemId;
                const setName = ItemInfo.GetSet(aItemsList[i].itemId);
                const SetImage = elTile.FindChildInLayoutFile('id-item-set-image');
                IconUtil.SetupFallbackItemSetIcon(SetImage, setName);
                IconUtil.SetItemSetSVGImage(SetImage, setName);
            }
            elTile.SetHasClass('new', aItemsList[i].ui_show_new_tag);
        }
    }
    function _UpdateTile() {
        if (GameStateAPI.IsLocalPlayerPlayingMatch() || !_ShouldShow()) {
            return;
        }
        _GetXpShopItems();
    }
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        _Init();
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_GcLogonNotificationReceived', _Init);
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_UpdateConnectionToGC', _Init);
        $.RegisterForUnhandledEvent('PanoramaComponent_Store_PriceSheetChanged', _Init);
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', _UpdateTile);
        $.RegisterForUnhandledEvent('CSGOShowMainMenu', _UpdateTile);
    }
})(MainMenuXpShop || (MainMenuXpShop = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbm1lbnVfeHBzaG9wX3RpbGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9tYWlubWVudV94cHNob3BfdGlsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBQ2xDLDhDQUE4QztBQUM5Qyx1Q0FBdUM7QUFDdkMsMkNBQTJDO0FBQzNDLDhDQUE4QztBQUM5Qyx5REFBeUQ7QUFDekQsd0NBQXdDO0FBQ3hDLDBDQUEwQztBQUMxQyxrQ0FBa0M7QUFFbEMsSUFBVSxjQUFjLENBc1Z2QjtBQXRWRCxXQUFVLGNBQWM7SUFFdkIsTUFBTSxjQUFjLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBQzNDLE1BQU0sYUFBYSxHQUFHLGVBQWUsQ0FBQztJQUN0QyxNQUFNLFFBQVEsR0FBRyxZQUFZLENBQUMsaUNBQWlDLENBQUUsWUFBWSxDQUFDLHdDQUF3QyxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0lBQzNJLElBQUksZ0JBQWdCLEdBQVcsS0FBSyxDQUFDO0lBQ3JDLElBQUksUUFBZSxDQUFDO0lBQ3BCLElBQUksNkJBQTZCLEdBQWtCLElBQUksQ0FBQztJQWdCeEQsU0FBUyxLQUFLO1FBRWIsQ0FBQyxDQUFDLEdBQUcsQ0FBRSxvQkFBb0IsR0FBRyxPQUFPLENBQUUsQ0FBQztRQUV4QyxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQ2xCO1lBQ0MsT0FBTztTQUNQO1FBRUQsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLG9CQUFvQixDQUFFLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxHQUFFLEVBQUU7WUFDbEcsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxtQkFBbUIsRUFBRSxxQkFBcUIsQ0FBRSxDQUFDO1FBQy9ELENBQUMsQ0FBQyxDQUFDO1FBRUgsZUFBZSxFQUFFLENBQUM7SUFDbkIsQ0FBQztJQUVELFNB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