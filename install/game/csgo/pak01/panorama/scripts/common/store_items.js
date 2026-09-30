"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="iteminfo.ts" />
/// <reference path="../generated/items_event_current_generated_store.d.ts" />
/// <reference path="../generated/items_event_current_generated_store.ts" />
var StoreItems;
(function (StoreItems) {
    let m_oItemsByCategory = {
        coupon: [],
        tournament: [],
        prime: [],
        market: [],
        key: [],
        store: []
    };
    function MakeStoreItemList() {
        let count = StoreAPI.GetBannerEntryCount();
        if (!count || count < 1) {
            return;
        }
        m_oItemsByCategory = {
            coupon: [],
            tournament: [],
            prime: [],
            market: [],
            key: [],
            store: []
        };
        let isPerfectWorld = (MyPersonaAPI.GetLauncherType() === "perfectworld");
        let strBannerEntryCustomFormatString;
        for (let i = 0; i < count; i++) {
            let ItemId = StoreAPI.GetBannerEntryDefIdx(i);
            let FauxItemId = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(ItemId, 0);
            // Add key
            if (!isPerfectWorld &&
                InventoryAPI.IsTool(FauxItemId) &&
                InventoryAPI.GetItemCapabilityByIndex(FauxItemId, 0) === 'decodable') {
                m_oItemsByCategory.key.push({ id: FauxItemId });
            }
            // Add Market Entries
            else if (StoreAPI.IsBannerEntryMarketLink(i)) {
                m_oItemsByCategory.market.push({ id: FauxItemId, isMarketItem: true });
            }
            // Add coupons
            else if ((strBannerEntryCustomFormatString = StoreAPI.GetBannerEntryCustomFormatString(i)).startsWith("coupon")) {
                if (!AllowDisplayingItemInStore(FauxItemId))
                    continue;
                let obj = { id: FauxItemId };
                let sLinkedCoupon = StoreAPI.GetBannerEntryLinkedCoupon(i);
                if (sLinkedCoupon) {
                    let LinkedItemId = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(parseInt(sLinkedCoupon), 0);
                    $.Msg('Coupon ' + ItemId + ' (itemid ' + FauxItemId + ') is linked to ' + sLinkedCoupon + ' (itemid ' + LinkedItemId + ')');
                    obj.linkedid = LinkedItemId;
                }
                if (strBannerEntryCustomFormatString === "coupon_new") {
                    obj.isNewRelease = true;
                    if (!sLinkedCoupon) {
                        obj.activationType = 'newstore';
                    }
                }
                m_oItemsByCategory.coupon.push(obj);
            }
            else {
                if (!AllowDisplayingItemInStore(FauxItemId))
                    continue;
                m_oItemsByCategory.store.push({ id: FauxItemId });
            }
        }
        GetTournamentItems();
    }
    StoreItems.MakeStoreItemList = MakeStoreItemList;
    function AllowDisplayingItemInStore(FauxItemId) {
        // New releases or store items for coupons should not appear in countries where they cannot be consumed
        let idToCheckForRestrictions = FauxItemId;
        // Use the item contained inside the coupon to check for restrictions
        let bIsCouponCrate = InventoryAPI.IsCouponCrate(idToCheckForRestrictions);
        if (bIsCouponCrate && InventoryAPI.GetLootListItemsCount(idToCheckForRestrictions) > 0) {
            idToCheckForRestrictions = InventoryAPI.GetLootListItemIdByIndex(idToCheckForRestrictions, 0);
        }
        // Check named exceptions
        let sDefinitionName = InventoryAPI.GetItemDefinitionName(idToCheckForRestrictions);
        if (sDefinitionName === "crate_stattrak_swap_tool")
            return true;
        // Get the restrictions
        let bIsDecodable = ItemInfo.ItemHasCapability(idToCheckForRestrictions, 'decodable');
        let sRestriction = bIsDecodable ? InventoryAPI.GetDecodeableRestriction(idToCheckForRestrictions) : null;
        if (sRestriction === "restricted" || sRestriction === "xray") {
            $.Msg("Not displaying store item " + FauxItemId + " >> " + idToCheckForRestrictions + " due to restriction: " + (sRestriction ? sRestriction : "<none>"));
            return false;
        }
        // Otherwise allowed to purchase
        return true;
    }
    function GetStoreItems() {
        return m_oItemsByCategory;
    }
    StoreItems.GetStoreItems = GetStoreItems;
    function GetStoreItemData(type, idx) {
        return m_oItemsByCategory[type][idx];
    }
    StoreItems.GetStoreItemData = GetStoreItemData;
    function GetTournamentItems() {
        // Determine restrictions in user region
        let sRestriction = InventoryAPI.GetDecodeableRestriction("capsule");
        let bCanSellCapsules = (sRestriction !== "restricted" && sRestriction !== "xray");
        for (let i = 0; i < g_ActiveTournamentStoreLayout.length; i++) {
            if (!bCanSellCapsules && i >= g_ActiveTournamentInfo.num_global_offerings) { // Don't create store offers in France and other countries, only globally available offerings there
                return;
            }
            let bContainsJustChampions = (typeof g_ActiveTournamentStoreLayout[i][1] === 'string');
            let FauxItemId = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(g_ActiveTournamentStoreLayout[i][0], 0);
            let GroupName = g_ActiveTournamentStoreLayout[i][2] ? g_ActiveTournamentStoreLayout[i][2] : '';
            let warning = warningTextTournamentItems(isPurchaseable(FauxItemId), FauxItemId);
            // Item will have no price if we have stopped selling it from the GC but not updated the item sheet
            let itemPrice = ItemInfo.GetStoreSalePrice(FauxItemId, 1);
            if (itemPrice || bContainsJustChampions) {
                let storeItem = {
                    id: FauxItemId,
                    useTinyNames: true
                };
                storeItem.isDisabled = !isPurchaseable(FauxItemId);
                storeItem.isNotReleased = !isPurchaseable(FauxItemId);
                if (!bContainsJustChampions) {
                    storeItem.linkedid = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(g_ActiveTournamentStoreLayout[i][1], 0);
                }
                if (GroupName) {
                    storeItem.groupName = GroupName.toString();
                }
                if (warning) {
                    storeItem.linkedWarning = warning;
                }
                if (g_ActiveTournamentStoreLayout[i][0] === g_ActiveTournamentInfo.itemid_pass) {
                    storeItem.isTournamentPass = true;
                }
                m_oItemsByCategory.tournament?.push(storeItem);
            }
            if (!itemPrice && i >= g_ActiveTournamentInfo.num_global_offerings) { // Once we find capsules that are not for sale, then break out
                break;
            }
        }
    }
    function warningTextTournamentItems(isPurchaseable, itemid) {
        return !isPurchaseable
            ? '#tournament_items_not_released_1'
            : InventoryAPI.GetItemTypeFromEnum(itemid) === 'type_tool' ? '#tournament_items_notice' : '';
    }
    //when we need unlock the champions
    function isPurchaseable(itemid) {
        let itemSchemaDef = ItemInfo.BuildItemSchemaDef(itemid);
        return itemSchemaDef["cannot_inspect"] === 1 ? false : true;
    }
})(StoreItems || (StoreItems = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmVfaXRlbXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9jb21tb24vc3RvcmVfaXRlbXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyxvQ0FBb0M7QUFDcEMsOEVBQThFO0FBQzlFLDRFQUE0RTtBQXNCNUUsSUFBVSxVQUFVLENBcU1uQjtBQXJNRCxXQUFVLFVBQVU7SUFJbkIsSUFBSSxrQkFBa0IsR0FBc0I7UUFDM0MsTUFBTSxFQUFFLEVBQUU7UUFDVixVQUFVLEVBQUUsRUFBRTtRQUNkLEtBQUssRUFBRSxFQUFFO1FBQ1QsTUFBTSxFQUFFLEVBQUU7UUFDVixHQUFHLEVBQUUsRUFBRTtRQUNQLEtBQUssRUFBRSxFQUFFO0tBQ1QsQ0FBQztJQUVGLFNBQWdCLGlCQUFpQjtRQUVoQyxJQUFJLEtBQUssR0FBRyxRQUFRLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztRQUMzQyxJQUFLLENBQUMsS0FBSyxJQUFJLEtBQUssR0FBRyxDQUFDLEVBQ3hCO1lBQ0MsT0FBTztTQUNQO1FBRUQsa0JBQWtCLEdBQUc7WUFDcEIsTUFBTSxFQUFFLEVBQUU7WUFDVixVQUFVLEVBQUUsRUFBRTtZQUNkLEtBQUssRUFBRSxFQUFFO1lBQ1QsTUFBTSxFQUFFLEVBQUU7WUFDVixHQUFHLEVBQUUsRUFBRTtZQUNQLEtBQUssRUFBRSxFQUFFO1NBQ1QsQ0FBQztRQUVGLElBQUksY0FBYyxHQUFHLENBQUUsWUFBWSxDQUFDLGVBQWUsRUFBRSxLQUFLLGNBQWMsQ0FBRSxDQUFDO1FBQzNFLElBQUksZ0NBQXdDLENBQUM7UUFFN0MsS0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFDL0I7WUFDQyxJQUFJLE1BQU0sR0FBRyxRQUFRLENBQUMsb0JBQW9CLENBQUUsQ0FBQyxDQUFFLENBQUM7WUFD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