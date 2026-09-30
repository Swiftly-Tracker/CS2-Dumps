"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="inspect.ts" />
/// <reference path="mainmenu_store_fullscreen.ts" />
/// <reference path="common/prime_button_action.ts" />
/// <reference path="common/xpshop_tile_weapon_camera_settings.ts" />
/// <reference path="popups/popup_acknowledge_item.ts" />
/// <reference path="common/icon.ts" />
/// <reference path="xpshop_track.ts" />
/// <reference path="particle_controls.ts" />
$.LogChannel('p.armory', "LV_OFF");
var XpShop;
(function (XpShop) {
    const m_tileWidth = 260;
    const m_tileHeight = 120;
    const m_stickerTileWidth = 160;
    const m_keychainTileHeight = m_stickerTileWidth - 10;
    const m_elContentPanel = $.GetContextPanel().FindChildInLayoutFile('id-xpshop-content');
    let m_nTrack;
    let m_nPass;
    let m_activeTracks = 0;
    let m_showTimeoutScheduleHandle;
    const m_passDefName = 'XpShopTicket1';
    const m_passId = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(InventoryAPI.GetItemDefinitionIndexFromDefinitionName(m_passDefName), 0);
    function Init() {
        m_nTrack = MissionsAPI.GetSeasonalOperationXpShopIndex();
        if (!m_nTrack || m_nTrack === 0) {
            // no shop
            return;
        }
        _MakeShowMainTilesNavBtn();
        _SetUpTracks();
        _UpdateShopGoods(m_nTrack);
        let elBtn = $.GetContextPanel().FindChildInLayoutFile('id-nav-show-main-tiles-btn');
        $.DispatchEvent("Activated", elBtn, "mouse");
    }
    XpShop.Init = Init;
    function InventoryUpdate() {
        if (!m_elContentPanel || !$.GetContextPanel().IsValid()) {
            return;
        }
        _CancelTimeoutForRewardItem();
        _SetUpTracks();
        let elBtn = $.GetContextPanel().FindChildInLayoutFile('id-xpshop-top-nav').Children().filter(entry => entry.checked === true)[0];
        if (elBtn && elBtn.IsValid()) {
            $.DispatchEvent("Activated", elBtn, "mouse");
        }
        else {
            _MakeShowMainTilesNavBtn();
            $.DispatchEvent("Activated", $.GetContextPanel().FindChildInLayoutFile('id-nav-show-main-tiles-btn'), "mouse");
        }
    }
    XpShop.InventoryUpdate = InventoryUpdate;
    function _SetUpTracks() {
        let bHasPrime = FriendsListAPI.GetFriendPrimeEligible(MyPersonaAPI.GetXuid());
        let oXpShopTrackProgress = InventoryAPI.GetCacheTypeElementJSOByIndex('XpShop', 0);
        let elTracks = $.GetContextPanel().FindChildInLayoutFile('id-xpshop-tracks');
        let elUpsell = $.GetContextPanel().FindChildInLayoutFile('id-xpshop-upsell');
        let btnUpsell = $.GetContextPanel().FindChildInLayoutFile('id-xpshop-upsell-btn');
        let elUpsellInfo = $.GetContextPanel().FindChildInLayoutFile('id-xpshop-info');
        let elBalance = $.GetContextPanel().FindChildInLayoutFile('id-xpshop-balance');
        let elMorePassesBtn = $.GetContextPanel().FindChildInLayoutFile('id-xpshop-more-passes-btn');
        elTracks.SetDialogVariable('pass', InventoryAPI.GetItemName(m_passId));
        elTracks.SetDialogVariableInt('max-stars', StoreAPI.GetXpShopMaxTrackLevel());
        // Accrued stars balance
        const bHasStarPointsBalance = (bHasPrime && oXpShopTrackProgress && oXpShopTrackProgress.redeemable_balance >= 0);
        const numStarPointsBalance = bHasStarPointsBalance ? oXpShopTrackProgress.redeemable_balance : 0;
        elBalance.SetDialogVariableInt('redeemable-points', numStarPointsBalance);
        elBalance.Data().balance = numStarPointsBalance;
        if (!bHasPrime) {
            elTracks.SetDialogVariable('upsell-text', $.Localize('#elevated_status_ad_xpshop', elTracks));
            elTracks.SetDialogVariable('upsell-btn-text', $.Localize('#elevated_status_btn_no_price', elTracks));
            elUpsellInfo.visible = false;
            btnUpsell.SetPanelEvent('onactivate', () => {
                $.DispatchEvent("CSGOPlaySoundEffect", "UIPanorama.loadout_sector_select", "MOUSE");
                let elNavBtn = $.GetContextPanel().GetParent().GetParent().FindChildInLayoutFile('id-store-nav-home');
                $.DispatchEvent("Activated", elNavBtn, "mouse");
                elNavBtn.checked = true;
            });
            elUpsell.SetHasClass('hide', false);
            elMorePassesBtn.SetHasClass('hide', true);
            elBalance.SetHasClass('hide', true);
        }
        else {
            AcknowledgeItems.GetItemsByType([m_passDefName], true);
            InventoryAPI.SetInventorySortAndFilters('inv_sort_age', false, 'item_definition:' + m_passDefName, '', '');
            m_nPass = InventoryAPI.GetInventoryCount();
            let elActiveTracks = $.GetContextPanel().FindChildInLayoutFile('id-xpshop-active-tracks');
            const bHasXpShopTracksOrBalance = oXpShopTrackProgress && (oXpShopTrackProgress.xp_tracks.length > 0 || oXpShopTrackProgress.redeemable_balance > 0);
            if (m_nPass > 0 || bHasXpShopTracksOrBalance) {
                let passIndex = 0;
                m_activeTracks = 0;
                let numPassesStillPossibleToBuy = 0;
                const numXpShopMaxTracks = StoreAPI.GetXpShopMaxTracks();
                // Pre-calculate the number of completed passes for the dialog string
                let numPassesFullyCompleted = 0;
                for (let i = 0; i < numXpShopMaxTracks; i++) {
                    if (oXpShopTrackProgress && oXpShopTrackProgress.xp_tracks[i]) {
                        const bIsMax = oXpShopTrackProgress.xp_tracks[i] / StoreAPI.GetXpShopStarXp() >= StoreAPI.GetXpShopMaxTrackLevel();
                        if (bIsMax)
                            ++numPassesFullyCompleted;
                    }
                }
                elActiveTracks.SetHasClass('hide', false);
                for (let i = 0; i < numXpShopMaxTracks; i++) {
                    //elBtn.SetHasClass( 'hidden', true );
                    let elTrack = CreateTrack(elActiveTracks, i);
                    elTrack.visible = false;
                    let elActivateBtn = elTrack.FindChildInLayoutFile('id-xpshop-pass-activate-btn');
                    elActivateBtn.SetHasClass('hidden', true);
                    let oSettings;
                    // Show tracks
                    if (oXpShopTrackProgress && oXpShopTrackProgress.xp_tracks[i]) {
                        let bIsMax = oXpShopTrackProgress.xp_tracks[i] / StoreAPI.GetXpShopStarXp() >= StoreAPI.GetXpShopMaxTrackLevel();
                        let trackValue = parseInt(oXpShopTrackProgress.xp_tracks[i]);
                        let nStarsEarned = trackValue > 0 ? Math.floor(trackValue / StoreAPI.GetXpShopStarXp()) : 0;
                        let elTrackProgress = elTrack.FindChildInLayoutFile('id-xpshop-active-tracks-progress-icons');
                        elTrackProgress.Children().forEach((element, idx) => {
                            element.SetHasClass('complete', idx < nStarsEarned);
                        });
                        oSettings = {
                            xpshop_track_frame_panel: elTrack,
                            xpshop_track_value: trackValue,
                        };
                        elTrack.visible = true;
                        XpShopTrack.XpShopInit(oSettings);
                        m_activeTracks++;
                        elTrack.SetPanelEvent('onmouseover', () => {
                            if (!bIsMax) {
                                UiToolkitAPI.ShowTextTooltip(elTrack.id, '#xpshop_track_tooltip');
                            }
                        });
                        elTrack.SetPanelEvent('onmouseout', () => {
                            UiToolkitAPI.HideTextTooltip();
                        });
                        if (bIsMax) {
                            elActivateBtn.SetHasClass('hidden', false);
                            elActivateBtn.SwitchClass('type', 'clear-pass-btn');
                            elActivateBtn.SetDialogVariable('action-text', $.Localize('#xpshop_popup_clear_track_title', elActivateBtn));
                            elActivateBtn.SetDialogVariableInt('completed_tracks_count', numPassesFullyCompleted);
                            const strMessageTitle = $.Localize('#xpshop_popup_clear_n_tracks:f', elActivateBtn);
                            const strMessageText = $.Localize('#xpshop_popup_clear_n_tracks_text:f', elActivateBtn);
                            elActivateBtn.SetPanelEvent('onactivate', () => {
                                UiToolkitAPI.ShowGenericPopupOkCancel(strMessageTitle, strMessageText, '', () => {
                                    StoreAPI.AckXpShopCompletedTracks();
                                }, () => { });
                            });
                        }
                    }
                    // Show passes to activate
                    else if (m_nPass > 0 && passIndex < m_nPass) {
                        let passToActivate = InventoryAPI.GetInventoryItemIDByIndex(passIndex);
                        passIndex++;
                        oSettings = {
                            xpshop_track_frame_panel: elTrack,
                            xpshop_track_value: 0,
                        };
                        XpShopTrack.XpShopInit(oSettings);
                        let elTrackProgress = elTrack.FindChildInLayoutFile('id-xpshop-active-tracks-progress-icons');
                        elTrackProgress.Children().forEach((element) => {
                            element.SetHasClass('complete', false);
                        });
                        elTrack.visible = true;
                        elActivateBtn.SetHasClass('hidden', false);
                        elActivateBtn.SwitchClass('type', 'activate-pass-btn');
                        elActivateBtn.SetDialogVariable('action-text', $.Localize('#xpshop_pass_activate', elActivateBtn));
                        elActivateBtn.SetPanelEvent('onactivate', () => {
                            XpShopTrack.PlayActivateParticles(oSettings);
                            elActivateBtn.SetHasClass('hidden', true);
                            elTrack.TriggerClass('xpshop-activate-pass-anim');
                            $.DispatchEvent("CSGOPlaySoundEffect", "UI.XP.Star.Full", "MOUSE");
                            $.Schedule(.75, () => {
                                InventoryAPI.UseTool(passToActivate, '');
                                elTrack.FindChildInLayoutFile('id-xpshop-pass-how-to').TriggerClass('xpshop-active-pass__how-to-anim');
                            });
                        });
                    }
                    else {
                        // This is a "vacant track" - user can buy a pass for it
                        ++numPassesStillPossibleToBuy;
                    }
                }
                //eTitle.visible = elActiveTracks.Children().filter( track => track.visible === true ).length > 0;
                elUpsell.SetHasClass('hide', true);
                elBalance.SetHasClass('hide', false);
                // If all the tracks have been purchased, then we just hide the "Buy Another Pass" button
                elMorePassesBtn.SetHasClass('hide', numPassesStillPossibleToBuy <= 0);
                elMorePassesBtn.text = $.Localize('#xpshop_pass_extra_pass', elActiveTracks);
                elMorePassesBtn.SetPanelEvent('onactivate', () => {
                    _OpenPurchasePassPopup();
                    $.DispatchEvent("CSGOPlaySoundEffect", "UIPanorama.loadout_sector_select", "MOUSE");
                });
                $.GetContextPanel().FindChildInLayoutFile('id-xpshop-active-tracks-container').SetHasClass('five-tracks', numPassesStillPossibleToBuy === 0);
            }
            else // SELL PASS (new user, or you can get in this state if you close all your tracks and spend all stars)
             {
                elTracks.SetDialogVariable('upsell-text', $.Localize('#xpshop_upsell_desc', elTracks));
                elTracks.SetDialogVariable('upsell-btn-text', $.Localize('#xpshop_upsell_btn', elTracks));
                elUpsellInfo.FindChild('id-xpshop-info-btn')?.SetPanelEvent('onactivate', () => SteamOverlayAPI.OpenUrlInOverlayOrExternalBrowser('https://store.steampowered.com/sale/armory'));
                elUpsell.FindChildInLayoutFile('id-xpshop-upsell-image').itemid = m_passId;
                btnUpsell.SetPanelEvent('onactivate', () => {
                    $.DispatchEvent("CSGOPlaySoundEffect", "UIPanorama.loadout_sector_select", "MOUSE");
                    _OpenPurchasePassPopup();
                });
                elActiveTracks.SetHasClass('hide', true);
                elUpsell.SetHasClass('hide', false);
                elMorePassesBtn.SetHasClass('hide', true);
                elBalance.SetHasClass('hide', true);
            }
        }
    }
    function _OpenPurchasePassPopup() {
        const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_inventory_inspect.xml');
        let oSettings = {
            item_id: m_passId,
            inspect_only: false,
            show_work_type_warning: false,
            store_item_id: m_passId
        };
        elPanel.Data().oSettings = oSettings;
    }
    function CreateTrack(elTracks, index) {
        const sNamePrefix = 'active-track-';
        let elTrack = elTracks.FindChildInLayoutFile(sNamePrefix + index);
        if (!elTrack) {
            elTrack = $.CreatePanel('Panel', elTracks, sNamePrefix + index);
            elTrack.BLoadLayoutSnippet('shop-ticket');
            elTrack.style.tooltipPosition = "bottom";
            elTrack.style.tooltipBodyPosition = "50% 0%";
            let elProgress = elTrack.FindChildInLayoutFile('id-xpshop-active-tracks-progress');
            elProgress.BLoadLayout('file://{resources}/layout/xpshop_track.xml', true, false);
            elProgress.hittest = false;
            elProgress.hittestchildren = false;
            let elParent = elTrack.FindChildInLayoutFile('id-xpshop-active-tracks-progress-icons');
            for (let i = 0; i < StoreAPI.GetXpShopMaxTrackLevel(); i++) {
                let elIcon = $.CreatePanel('Panel', elParent, '');
                elIcon.BLoadLayoutSnippet('shop-pass-star');
            }
        }
        return elTrack;
    }
    function _UpdateShopGoods(m_nTrack) {
        let nCount = MissionsAPI.GetSeasonalOperationRedeemableGoodsCount(m_nTrack);
        let aShopItemsData = [];
        let itemsInRows = {};
        for (let i = 0; i < nCount; i++) {
            let ShopEntry = {
                ui_order: 0,
                items_in_row: 0,
                nav_order: 0,
                flags: 0,
                ui_image: "",
                ui_set_image: "",
                ui_image_thumbnail: "",
                item_name: "",
                callout: "",
                item_name_groups: "",
                points: '',
                limited_until: '',
                ui_show_new_tag: '',
                bidding_cycle: '',
                bidding_close: '',
                bidding_pause: '',
                bidding_batch: ''
            };
            for (let key in ShopEntry) {
                let field_value = MissionsAPI.GetSeasonalOperationRedeemableGoodsSchema(m_nTrack, i, key);
                //@ts-expect-error this is hacky
                ShopEntry[key] = field_value;
            }
            ShopEntry.shop_index = i;
            itemsInRows[ShopEntry.ui_order] = !itemsInRows[ShopEntry.ui_order] ? 1 : ++itemsInRows[ShopEntry.ui_order];
            $.Msg('[p.armory] ShopEntry.item_name: ' + ShopEntry.item_name);
            if (ShopEntry.item_name.startsWith('lootlist:')) {
                ShopEntry.entry_type = 'lootlist';
                ShopEntry.lootlist = _GetLootListForReward(ShopEntry.item_name);
                ShopEntry.lootlist_item_type = ItemInfo.IsWeapon(ShopEntry.lootlist[0]) ? 'weapon' : ItemInfo.IsKeychain(ShopEntry.lootlist[0]) ? 'keychain' : 'sticker';
                ShopEntry.tile_width = ShopEntry.lootlist_item_type === 'keychain' || ShopEntry.lootlist_item_type === 'sticker' ? m_stickerTileWidth : m_tileWidth;
                ShopEntry.tile_height = ShopEntry.lootlist_item_type === 'weapon' ? m_tileHeight : ShopEntry.lootlist_item_type === 'keychain' ? m_keychainTileHeight : ShopEntry.tile_width;
                ShopEntry.on_item_activate = _OpenFullScreenInspectItem;
                let strSetName = InventoryAPI.GetTag(ShopEntry.lootlist[0], 'ItemSet');
                ShopEntry.ui_set_image = strSetName ? strSetName : ShopEntry.ui_set_image;
                if (ShopEntry.limited_until)
                    ShopEntry.suffix_loc_string = '_limitedtime';
            }
            else {
                let eType = (ShopEntry.item_name.startsWith('crate_')) ? 'crate' : ShopEntry.item_name;
                ShopEntry.entry_type = eType;
                ShopEntry.suffix_loc_string = '_' + (ShopEntry.bidding_cycle ? 'bid' : eType);
                let nDefinitionIndex = InventoryAPI.GetItemDefinitionIndexFromDefinitionName(ShopEntry.item_name);
                let idCrate = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(nDefinitionIndex, 0);
                ShopEntry.lootlist = [idCrate];
                ShopEntry.lootlist_item_type = eType;
                ShopEntry.on_item_activate = _OpenFullScreenInspectItem;
                if (eType === 'crate') {
                    let strSetName = InventoryAPI.GetTag(InventoryAPI.GetLootListItemIdByIndex(idCrate, 0), 'ItemSet');
                    ShopEntry.ui_set_image = strSetName ? strSetName : '';
                    ShopEntry.on_item_activate = OpenFullscreenInspect;
                }
            }
            if (ShopEntry.flags && ((ShopEntry.flags & 4) === 4)) {
                const petItemId = InventoryAPI.GetPetItemID();
                $.Msg('[p.armory] ShopEntry.pet (' + ShopEntry.item_name + ') pet_item_id=' + petItemId + ';');
                if (petItemId)
                    continue; // user already has their pet, don't make the Armory tile
            }
            if (ShopEntry.bidding_cycle) {
                ShopEntry.points = ''; // clear out the points value, since the user will have to make a bid
                const numSecondsRemaining = StoreAPI.GetSecondsUntilTimestamp(parseInt(ShopEntry.bidding_close));
                if (numSecondsRemaining <= 0)
                    continue; // don't bother making an Armory tile - everything's been auctioned off already
            }
            aShopItemsData.push(ShopEntry);
        }
        aShopItemsData.forEach((element) => {
            element.items_in_row = itemsInRows[element.ui_order];
            _MakeShopTile(element);
            _MakeNavButton(element);
        });
        // A little hack for moving the nav btn order to match the tile layout
        let elParent = $.GetContextPanel().FindChildInLayoutFile('id-xpshop-top-nav');
        let aNavButtons = elParent.Children();
        aNavButtons.forEach((element, idx) => {
            if (element.Data().ui_order) {
                if (element.Data().ui_order === '1') {
                    elParent.MoveChildBefore(element, aNavButtons[1]);
                }
            }
        });
    }
    function _GetLootListForReward(rewardId) {
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
    function _MakeShopTile(ShopEntry) {
        let elTile = m_elContentPanel.FindChildInLayoutFile(ShopEntry.item_name);
        if (!elTile) {
            let elRow = m_elContentPanel.FindChildInLayoutFile('id-xpshop-row-' + ShopEntry.ui_order);
            elTile = $.CreatePanel('Button', elRow, ShopEntry.item_name);
            elTile.BLoadLayoutSnippet('shop-tile');
            elTile.SetPanelEvent('onactivate', () => {
                let elBtn = $.GetContextPanel().FindChildInLayoutFile('id-xpshop-top-nav').Children().filter(entry => ShopEntry.item_name + '-nav' === entry.id)[0];
                if (elBtn && elBtn.IsValid()) {
                    $.DispatchEvent("Activated", elBtn, "mouse");
                }
            });
            $.Msg('[p.armory] Making shop tile for ' + ShopEntry.item_name + ' ui_set_image=' + ShopEntry.ui_set_image);
            if (ShopEntry.ui_set_image) {
                const elImage = elTile.FindChildInLayoutFile('id-xpshop-tile-icon');
                IconUtil.SetupFallbackItemSetIcon(elImage, ShopEntry.ui_set_image);
                IconUtil.SetItemSetSVGImage(elImage, ShopEntry.ui_set_image);
            }
            if (ShopEntry.limited_until) {
                let elPanelLimitedTimer = elTile.FindChildInLayoutFile('id-xpshop-tile-limitedtimer');
                elPanelLimitedTimer.RemoveClass('hidden');
                let numDaysRemaining = StoreAPI.GetSecondsUntilTimestamp(parseInt(ShopEntry.limited_until));
                numDaysRemaining = Math.floor(numDaysRemaining / (24 * 3600));
                elPanelLimitedTimer.SetDialogVariableInt('daysremaining', numDaysRemaining);
                let strTimer = '#SFUI_Store_Offer_Days_Remaining' +
                    ((numDaysRemaining > 0) ? '' : '_last') +
                    (ShopEntry.bidding_cycle ? '_bid:f' : '_claim:f');
                strTimer = $.Localize(strTimer, elPanelLimitedTimer);
                elPanelLimitedTimer.SetDialogVariable('limitedtimeleft', strTimer);
            }
            elTile.style.backgroundImage = 'url("file://{images}/' + ShopEntry.ui_image_thumbnail + '.png")';
            elTile.style.backgroundPosition = '50% 50%';
            elTile.style.backgroundSize = 'cover';
            if (ShopEntry.lootlist?.length === 1) {
                if (ShopEntry.limited_until && ShopEntry.item_name && ShopEntry.item_name.startsWith('lootlist:')) {
                    let elLimitedCarousel = $.CreatePanel('Carousel', elTile, '');
                    elLimitedCarousel.BLoadLayoutSnippet('limited-item-carousel');
                    elLimitedCarousel.hittest = false;
                    elLimitedCarousel.hittestchildren = false;
                }
                else {
                    elTile.FindChildInLayoutFile('id-xpshop-tile-single-image').itemid = ShopEntry.lootlist[0];
                }
            }
            else if (ShopEntry.lootlist && ShopEntry.lootlist.length > 1) {
                let elCarousel = elTile.FindChildInLayoutFile('id-xpshop-tile-carousel');
                let elPanel;
                // we use the number of items in a row to also determine how many items to show in a tile.  When the row has more than 4 store entry items the multi- image tiles can be very crowded.
                const numItemsPerTile = ((ShopEntry.lootlist_item_type === "keychain" || ShopEntry.lootlist_item_type === "sticker") && ShopEntry.items_in_row < 5) ? 4 : 1;
                let numScrollingTilesToAdd = ((ShopEntry.lootlist_item_type === "keychain" || ShopEntry.lootlist_item_type === "sticker") && numItemsPerTile > 1) ? Math.floor((ShopEntry.lootlist.length + numItemsPerTile - 1) / numItemsPerTile) : 6;
                let shuffledArray = [...ShopEntry.lootlist];
                shuffledArray.sort((a, b) => 0.5 - Math.random());
                $.Msg('[p.armory] ShopEntry.items_in_row: ' + ShopEntry.items_in_row);
                for (let iScrollingTile = 0; iScrollingTile < numScrollingTilesToAdd; ++iScrollingTile) {
                    for (let iTileItem = 0; iTileItem < numItemsPerTile; ++iTileItem) {
                        //  For carousels whose tiles have multiple images on them.
                        if ((ShopEntry.lootlist_item_type === "keychain" || ShopEntry.lootlist_item_type === "sticker") && ShopEntry.items_in_row < 5) {
                            let entry = shuffledArray[((iScrollingTile * numScrollingTilesToAdd) + iTileItem) % shuffledArray.length];
                            if (iTileItem === 0) {
                                elPanel = $.CreatePanel('Panel', elCarousel, '', { class: 'xpshop__item-tile__carousel-multi-image' });
                            }
                            let elImage = $.CreatePanel('ItemImage', elPanel, '', { itemid: entry, class: 'carousel-image-' + iTileItem });
                            elImage.SetHasClass('sticker', ShopEntry.lootlist_item_type === "sticker" ? true : false);
                        }
                        else {
                            let entry = shuffledArray[iScrollingTile];
                            $.CreatePanel('ItemImage', elCarousel, '', { itemid: entry });
                        }
                    }
                }
            }
        }
        elTile.FindChildInLayoutFile('id-new-item-tag').SetHasClass('hidden', !XpShop.ShouldShowNewTagForShopEntry(ShopEntry));
        elTile.SetDialogVariable('name', ShopEntry.callout ? $.Localize(ShopEntry.callout) : ShopEntry.item_name);
        elTile.SetDialogVariable('points', ShopEntry.points);
        return elTile;
    }
    let jsTooltipDelayHandle = null;
    function _UpdateInspectGrid(ShopEntry) {
        // Hide the main panels and show the appropriate inspect grid for items
        $.Msg('[p.armory] _UpdateInspectGrid: ' + ShopEntry.item_name);
        m_elContentPanel.SetHasClass('xpshop-grids-visible', true);
        let elInspectContainer = m_elContentPanel.FindChildInLayoutFile('id-xpshop-inspect-container');
        let elGrid = elInspectContainer.FindChildInLayoutFile(ShopEntry.item_name + '-grid');
        if (!elGrid) {
            // Make Grid
            elGrid = $.CreatePanel('Panel', elInspectContainer, ShopEntry.item_name + '-grid');
            elGrid.BLoadLayoutSnippet('shop-grid');
            elGrid.SetDialogVariable('name', ShopEntry.callout ? $.Localize(ShopEntry.callout) : ShopEntry.item_name);
            elGrid.SetDialogVariable('cost_stars', ShopEntry.points);
            elGrid.SetDialogVariable('desc-text', $.Localize('#xpshop_redeem_item_desc' + (ShopEntry.suffix_loc_string ? ShopEntry.suffix_loc_string : ''), elGrid));
            elGrid.SetDialogVariable('use-text', $.Localize(ShopEntry.bidding_cycle ? '#xpshop_redeem_bid_stars' : '#xpshop_redeem_use_stars', elGrid));
            elGrid.SetDialogVariable('confirm-text', $.Localize('#xpshop_redeem_use_confirm_item' + (ShopEntry.suffix_loc_string ? ShopEntry.suffix_loc_string : ''), elGrid));
            let elRedeemBar = elGrid.FindChildInLayoutFile('id-xpshop-item-redeem-bar');
            let elConfirmBar = elGrid.FindChildInLayoutFile('id-xpshop-item-confirm-bar');
            _SetUpRedeemBar(elRedeemBar, elConfirmBar, ShopEntry);
            _SetUpConfirmBar(elRedeemBar, elConfirmBar, ShopEntry);
            _SetWarningText(elGrid, ShopEntry);
            let elTilesContainer = elGrid.FindChildInLayoutFile('id-xpshop-grid-tiles');
            // Make Tiles
            ShopEntry.lootlist?.forEach((itemId, idx) => {
                let elShopTile = CreateShopTile(elTilesContainer, itemId, ShopEntry);
                let elModel = elShopTile.FindChild('id-grid-item-model');
                if (ShopEntry.entry_type === 'crate') {
                    elShopTile.AddClass('crate-item');
                    let elLootlistItems = elShopTile.FindChildInLayoutFile('id-xpshop-crate-lootlist');
                    elModel = elShopTile.FindChildInLayoutFile('ItemPreviewPanel');
                    ;
                    $.Schedule(.25, () => elModel.TransitionToCamera('cam_case_open', 1));
                    if (!elLootlistItems) {
                        elLootlistItems = $.CreatePanel('Panel', elShopTile, 'id-xpshop-crate-lootlist-' + itemId, { class: 'xpshop__crate-lootlist' });
                        elLootlistItems.style.backgroundImage = 'url("file://{images}/' + ShopEntry.ui_image_thumbnail + '.png")';
                        elLootlistItems.style.backgroundPosition = '50% 50%';
                        elLootlistItems.style.backgroundSize = 'clip_then_cover';
                        elLootlistItems.style.backgroundImgOpacity = '.6';
                        $.CreatePanel('Panel', elLootlistItems, '', { class: 'xpshop__crate-lootlist__bg' });
                        let textString = $.Localize('#xpshop_lootlist_info', elGrid);
                        $.CreatePanel('Label', elLootlistItems, '', { class: 'xpshop__crate-lootlist__label', html: 'true', text: textString });
                        let elLootlistItemTiles = $.CreatePanel('Panel', elLootlistItems, '', { class: 'xpshop__crate-lootlist__tiles' });
                        let aCrateLootlist = _GetLootListForReward(itemId);
                        aCrateLootlist.forEach((id, idx) => {
                            let elItem = $.CreatePanel('Button', elLootlistItemTiles, id, { class: 'xpshop__crate-lootlist__item-tile' });
                            elItem.BLoadLayoutSnippet('crate-lootlist-item');
                            let elImage = elItem.FindChildInLayoutFile('id-crate-lootlits-item-image');
                            let elRarity = elItem.FindChildInLayoutFile('id-crate-lootlits-item-rarity');
                            if (id !== '0') {
                                elImage.itemid = id;
                                let color = InventoryAPI.GetItemRarityColor(id);
                                if (color) {
                                    elRarity.style.backgroundColor = color;
                                }
                                elItem.SetPanelEvent('onactivate', () => {
                                    $.DispatchEvent("LootlistItemPreview", id, itemId);
                                });
                            }
                            else {
                                let unusualItemImagePath = InventoryAPI.GetLootListUnusualItemImage(itemId) + ".png";
                                elImage.SetImage("file://{images}/" + unusualItemImagePath);
                                elRarity.visible = false;
                                elItem.enabled = false;
                            }
                        });
                    }
                    return;
                }
                if (ShopEntry.lootlist?.length === 1) {
                    elModel = elShopTile.FindChildInLayoutFile('ItemPreviewPanel');
                    if (elModel.PanZoomEnabled()) {
                        elGrid.defaultfocus = 'ItemPreviewPanel';
                        elGrid.SetAcceptsFocus(true);
                    }
                    return;
                }
                elModel.SetActiveItem(0);
                elModel.SetItemItemId(itemId, '');
                elModel.hittest = false;
                let nRenderInterval = 10;
                elModel.SetRenderInterval(nRenderInterval);
                let bUseNarrowZoom = false;
                if (ShopEntry.item_name === 'lootlist:keychain_pack_kc_missinglink_lootlist' ||
                    (InventoryAPI.GetLoadoutCategory(itemId) == 'secondary' && elShopTile.Data().defName !== 'weapon_usp_silencer') ||
                    elShopTile.Data().defName === 'weapon_taser' ||
                    elShopTile.Data().defName === 'weapon_mp7' ||
                    elShopTile.Data().defName === 'weapon_mp9' ||
                    elShopTile.Data().defName === 'weapon_mac10' ||
                    (ShopEntry.item_name === 'lootlist:keychain_pack_kc_weapon_01_lootlist' &&
                        (idx === 5 || idx === 13 || idx === 14 || idx === 15))) {
                    bUseNarrowZoom = true;
                }
                elShopTile.SetPanelEvent('onmouseover', () => {
                    jsTooltipDelayHandle = $.Schedule(.2, () => {
                        jsTooltipDelayHandle = null;
                        _EnableRotateOnModel(elModel, ShopEntry.lootlist_item_type);
                        elModel.SetRenderInterval(0);
                        $.Schedule(.2, () => { elModel.hittest = true; });
                        _DarkenTiles(elTilesContainer, elShopTile);
                        _SetZoomInSizeAndPosition(ShopEntry, elShopTile, bUseNarrowZoom);
                    });
                });
                elShopTile.SetPanelEvent('onmouseout', () => {
                    _DisableRotateOnModel(elModel);
                    _DarkenTiles(elTilesContainer);
                    elModel.hittest = false;
                    elModel.SetRenderInterval(nRenderInterval);
                    ResetSizeAndPosition(ShopEntry, elShopTile);
                    if (jsTooltipDelayHandle) {
                        $.CancelScheduled(jsTooltipDelayHandle);
                        jsTooltipDelayHandle = null;
                    }
                });
            });
            $.Schedule(.15, () => PlaceTiles(elTilesContainer, ShopEntry));
        }
        else {
            $.Schedule(.1, () => PlaceTiles(elGrid.FindChildInLayoutFile('id-xpshop-grid-tiles'), ShopEntry));
            // Update the bar for new data.  Balance can change and 
            _SetUpRedeemBar(elGrid.FindChildInLayoutFile('id-xpshop-item-redeem-bar'), elGrid.FindChildInLayoutFile('id-xpshop-item-confirm-bar'), ShopEntry);
            if (ShopEntry.lootlist && ShopEntry.lootlist_item_type === 'weapon' && ShopEntry.lootlist.length == 1) {
                let elLimitedItem = elGrid.FindChildInLayoutFile(ShopEntry.lootlist[0]);
                if (elLimitedItem && elLimitedItem.IsValid()) {
                    InspectModelImage.Init(elLimitedItem, ShopEntry.lootlist[0]);
                }
            }
            if (ShopEntry.lootlist?.length === 1) {
                let elModel = elGrid.FindChildInLayoutFile('ItemPreviewPanel');
                if (elModel.PanZoomEnabled()) {
                    elGrid.defaultfocus = 'ItemPreviewPanel';
                    elGrid.SetAcceptsFocus(true);
                    elModel.ResetPanZoom();
                }
            }
        }
        _UpdateVisibleInspectGrid(elInspectContainer, ShopEntry.item_name + '-grid');
    }
    function _DeleteInspectGrid() {
        if (!m_nTrack || m_nTrack === 0) {
            // no shop
            return;
        }
        let nCount = MissionsAPI.GetSeasonalOperationRedeemableGoodsCount(m_nTrack);
        for (let i = 0; i < nCount; i++) {
            let item_name = MissionsAPI.GetSeasonalOperationRedeemableGoodsSchema(m_nTrack, i, 'item_name');
            let elInspectContainer = m_elContentPanel.FindChildInLayoutFile('id-xpshop-inspect-container');
            let elGrid = elInspectContainer.FindChildInLayoutFile(item_name + '-grid');
            if (elGrid) {
                elGrid.DeleteAsync(1.0);
            }
        }
    }
    function _SetUpRedeemBar(elRedeemBar, elConfirmBar, ShopEntry) {
        let RedeemBtn = elRedeemBar.FindChildInLayoutFile('id-xpshop-item-redeem-btn-' + ShopEntry.shop_index);
        if (!RedeemBtn) {
            RedeemBtn = $.CreatePanel('Button', elRedeemBar, 'id-xpshop-item-redeem-btn-' + ShopEntry.shop_index);
            RedeemBtn.BLoadLayoutSnippet('redeem-button');
        }
        let elBalance = $.GetContextPanel().FindChildInLayoutFile('id-xpshop-balance');
        RedeemBtn.SetDialogVariable('pass', InventoryAPI.GetItemName(m_passId));
        RedeemBtn.SetDialogVariableInt('max-stars', StoreAPI.GetXpShopMaxTrackLevel());
        RedeemBtn.enabled = (ShopEntry.points !== undefined &&
            ShopEntry.points !== '' &&
            elBalance.Data().balance &&
            (elBalance.Data().balance >= parseInt(ShopEntry.points))) ? true : false;
        RedeemBtn.SetPanelEvent('onactivate', () => {
            elRedeemBar.SetHasClass('hidden', true);
            elConfirmBar.SetHasClass('hidden', false);
            elConfirmBar.FindChildInLayoutFile('id-xpshop-item-redeem-confirm').enabled = true;
            elConfirmBar.FindChildInLayoutFile('id-xpshop-item-redeem-cancel').enabled = true;
            elConfirmBar.GetParent().FindChildInLayoutFile("id-xpshop-item-bidamt-bar").SetHasClass('hidden', true);
        });
        RedeemBtn.SetPanelEvent('onmouseover', () => {
            let nStarsNeeded = m_activeTracks > 0 ? ((ShopEntry.bidding_cycle ? 1 : parseInt(ShopEntry.points)) - elBalance.Data().balance) : 0;
            RedeemBtn.SetDialogVariableInt('stars_needed', nStarsNeeded);
            let strToolTip = (m_activeTracks < 1) ? '#xpshop_redeem_need_pass_tooltip' :
                nStarsNeeded > 0 ? $.Localize('#xpshop_redeem_not_enough_stars:f', RedeemBtn) : '';
            if (strToolTip === '') {
                return;
            }
            UiToolkitAPI.ShowTextTooltip(RedeemBtn.id, strToolTip);
        });
        RedeemBtn.SetPanelEvent('onmouseout', () => {
            UiToolkitAPI.HideTextTooltip();
        });
        if (ShopEntry.ui_set_image) {
            const elImage = elRedeemBar.FindChildInLayoutFile('id-xpshop-item-redeem-icon');
            IconUtil.SetupFallbackItemSetIcon(elImage, ShopEntry.ui_set_image);
            IconUtil.SetItemSetSVGImage(elImage, ShopEntry.ui_set_image);
        }
        _ResetToRewardsBar(elRedeemBar, elConfirmBar);
        if (ShopEntry.bidding_cycle && elBalance.Data().balance && elBalance.Data().balance > 0) {
            RedeemBtn.enabled = true;
            RedeemBtn.SetPanelEvent('onactivate', () => {
                const rtBiddingClose = parseInt(ShopEntry.bidding_close);
                const rtBiddingCycle = parseInt(ShopEntry.bidding_cycle);
                const rtBiddingPause = parseInt(ShopEntry.bidding_pause);
                const numSecondsRemaining = StoreAPI.GetSecondsUntilTimestamp(rtBiddingClose);
                if (numSecondsRemaining <= 0) {
                    UiToolkitAPI.ShowGenericPopupOneOptionBgStyle(ShopEntry.callout, "#xpshop_redeem_bid_allover", "", "#UI_OK", () => { }, "dim");
                    return;
                }
                const numPeriodsRemaining = Math.floor(numSecondsRemaining / rtBiddingCycle);
                const rtPreviousClose = rtBiddingClose - (numPeriodsRemaining + 1) * rtBiddingCycle;
                const numSecondsSincePrevious = (rtBiddingClose - numSecondsRemaining) - rtPreviousClose;
                if ((numSecondsSincePrevious >= rtBiddingCycle)
                    || (numSecondsSincePrevious <= rtBiddingPause)) {
                    const numSecondsUntilNextBidOpens = rtBiddingPause - ((numSecondsSincePrevious >= rtBiddingCycle)
                        ? 0 : numSecondsSincePrevious);
                    const numHours = Math.floor(numSecondsUntilNextBidOpens / 3600) + 1;
                    RedeemBtn.SetDialogVariableInt('hours_until_bid_batch', numHours);
                    UiToolkitAPI.ShowGenericPopupOneOptionBgStyle(ShopEntry.callout, $.Localize("#xpshop_redeem_bid_batchover:f", RedeemBtn), "", "#UI_OK", () => { }, "dim");
                    return;
                }
                if (ShopEntry.flags && ((ShopEntry.flags & 4) === 4)) {
                    const petItemId = InventoryAPI.GetPetItemID();
                    if (petItemId) {
                        UiToolkitAPI.ShowGenericPopupOneOptionBgStyle(ShopEntry.callout, "#chicken_egg_cannot_bid_own", "", "#UI_OK", () => { }, "dim");
                        return;
                    }
                }
                // Bidding is ready to go, show the final confirmation:
                elRedeemBar.SetHasClass('hidden', true);
                elConfirmBar.SetHasClass('hidden', false);
                elConfirmBar.FindChildInLayoutFile('id-xpshop-item-redeem-confirm').enabled = true;
                elConfirmBar.FindChildInLayoutFile('id-xpshop-item-redeem-cancel').enabled = true;
                ShopEntry.bidding_points_amount = 1; // TODO: have user-interface element to plus/minus the number of stars to bid
                // Are we bidding? or retracting our bid?
                let bMakingNewBid = true;
                const numBids = InventoryAPI.GetCacheTypeElementsCount('XpShopBids');
                for (let iBid = 0; iBid < numBids; ++iBid) {
                    const jsoBid = InventoryAPI.GetCacheTypeElementJSOByIndex('XpShopBids', iBid);
                    if (jsoBid.campaign_id == m_nTrack) // && jsoBid.redeem_id == ... ) // TODO: support multiple bids - need redeem_id wired up here!
                     {
                        ShopEntry.bidding_points_amount = jsoBid.expected_cost;
                        bMakingNewBid = false;
                        break;
                    }
                }
                // Localization for confirm bar:
                let fnLocalizeConfirmBar = () => {
                    elConfirmBar.SetDialogVariable('cost_stars', '' + ShopEntry.bidding_points_amount);
                    elConfirmBar.SetDialogVariable('confirm-text', $.Localize((bMakingNewBid ? '#xpshop_redeem_use_confirm_item' : '#xpshop_redeem_use_cancel_item')
                        + (ShopEntry.suffix_loc_string ? ShopEntry.suffix_loc_string : ''), elConfirmBar));
                    elConfirmBar.FindChildInLayoutFile('id-xpshop-item-redeem-confirm').Children()[0].text
                        = $.Localize((bMakingNewBid ? '#xpshop_redeem_use_confirm_item_bid_btn' : '#xpshop_redeem_use_cancel_item_bid_btn'), elConfirmBar);
                };
                // Show the bid selector
                let elBidAmount = elConfirmBar.GetParent().FindChildInLayoutFile("id-xpshop-item-bidamt-bar");
                if (bMakingNewBid && elBalance.Data().balance > 1) {
                    elBidAmount.SetDialogVariable('cost_stars', "");
                    elBidAmount.SetDialogVariableInt('bid-amount', 1);
                    elBidAmount.SetHasClass('hidden', false);
                    let elBidSlider = elBidAmount.FindChildInLayoutFile("id-xpshop-bid-amount");
                    elBidSlider.min = 1;
                    elBidSlider.max = elBalance.Data().balance;
                    elBidSlider.increment = 1;
                    elBidSlider.default = 1;
                    elBidSlider.value = 1;
                    elBidSlider.SetPanelEvent('onvaluechanged', () => {
                        const n = Math.round(elBidSlider.value);
                        ShopEntry.bidding_points_amount = n;
                        elBidAmount.SetDialogVariableInt('bid-amount', n);
                        fnLocalizeConfirmBar();
                    });
                    elBidAmount.FindChildInLayoutFile("id-xpshop-bid-amount-less").SetPanelEvent('onactivate', () => {
                        const n = Math.round(elBidSlider.value);
                        if (n > 1)
                            elBidSlider.value = (n - 1);
                    });
                    elBidAmount.FindChildInLayoutFile("id-xpshop-bid-amount-more").SetPanelEvent('onactivate', () => {
                        const n = Math.round(elBidSlider.value);
                        if (n < elBalance.Data().balance)
                            elBidSlider.value = (n + 1);
                    });
                }
                else {
                    elBidAmount.SetHasClass('hidden', true);
                }
                fnLocalizeConfirmBar();
                // If we are retracting the bid, then we are paying "negative stars" to increase our stars wallet ballance
                if (!bMakingNewBid)
                    ShopEntry.bidding_points_amount = -ShopEntry.bidding_points_amount;
            });
        }
    }
    function _SetUpConfirmBar(elRedeemBar, elConfirmBar, ShopEntry) {
        elConfirmBar.FindChildInLayoutFile('id-xpshop-item-redeem-cancel').SetPanelEvent('onactivate', () => {
            _ResetToRewardsBar(elRedeemBar, elConfirmBar);
        });
        if (ShopEntry.ui_set_image) {
            const elImage = elConfirmBar.FindChildInLayoutFile('id-xpshop-item-confirm-icon');
            IconUtil.SetupFallbackItemSetIcon(elImage, ShopEntry.ui_set_image);
            IconUtil.SetItemSetSVGImage(elImage, ShopEntry.ui_set_image);
        }
        elConfirmBar.FindChildInLayoutFile('id-xpshop-item-redeem-confirm').SetPanelEvent('onactivate', () => {
            InventoryAPI.SetInventorySortAndFilters('inv_sort_age', false, 'only_econ_items', '', '');
            if (InventoryAPI.GetInventoryCount() >= ItemInfo.NUM_BACKPACK_SLOTS) {
                UiToolkitAPI.ShowGenericPopupOk($.Localize('#popup_casket_title_error_casket_inv_full'), $.Localize('#SFUI_InventoryFull_Error'), '', () => { });
                return;
            }
            MissionsAPI.ActionRedeemOperationGoods(m_nTrack, ShopEntry.shop_index, ShopEntry.bidding_cycle ? ShopEntry.bidding_points_amount : parseInt(ShopEntry.points));
            elConfirmBar.FindChildInLayoutFile('id-xpshop-item-redeem-confirm').enabled = false;
            elConfirmBar.FindChildInLayoutFile('id-xpshop-item-redeem-cancel').enabled = false;
            $.GetContextPanel().SetHasClass('waiting-for-redeem', true);
            _StartRedeemParticles();
            $.DispatchEvent("CSGOPlaySoundEffect", "UI.XP.Star.Spend", "MOUSE");
            m_showTimeoutScheduleHandle = $.Schedule(5, () => {
                $.DispatchEvent("Activated", elConfirmBar.FindChildInLayoutFile('id-xpshop-item-redeem-cancel'), "mouse");
                $.GetContextPanel().SetHasClass('waiting-for-redeem', false);
                _StopRedeemParticles();
                // We did not get the item you unlocked so show the xpshop home page
                let elBtn = $.GetContextPanel().FindChildInLayoutFile('id-nav-show-main-tiles-btn');
                $.DispatchEvent("Activated", elBtn, "mouse");
                // We did not get the item you unlocked so show an error dialog
                UiToolkitAPI.ShowGenericPopupOk($.Localize('#SFUI_SteamConnectionErrorTitle'), $.Localize('#SFUI_InvError_Item_Not_Given'), '', () => { });
            });
        });
    }
    function _ResetToRewardsBar(elRedeemBar, elConfirmBar) {
        elRedeemBar.SetHasClass('hidden', false);
        elConfirmBar.SetHasClass('hidden', true);
        elConfirmBar.GetParent().FindChildInLayoutFile("id-xpshop-item-bidamt-bar").SetHasClass('hidden', true);
    }
    function _SetWarningText(elGrid, ShopEntry) {
        let warningText = '';
        let elWarning = elGrid.FindChildInLayoutFile('id-xpshop-item-warning');
        elWarning.SetHasClass('hidden', true);
        if (ShopEntry.entry_type !== 'crate') {
            return;
        }
        if (ShopEntry.lootlist) {
            let keyId = InventoryAPI.GetAssociatedItemIdByIndex(ShopEntry.lootlist[0], 0);
            elGrid.SetDialogVariable('keyname', InventoryAPI.GetItemName(keyId));
            elGrid.SetDialogVariable('casename', InventoryAPI.GetItemName(ShopEntry.lootlist[0]));
        }
        warningText = $.Localize('#xpshop_key_warning', elGrid);
        elWarning.SetHasClass('hidden', false);
        elGrid.SetDialogVariable('warning', warningText);
    }
    function _StartRedeemParticles() {
        const elRedeemFx = $.GetContextPanel().FindChildInLayoutFile('id-redeem-wait-particle');
        const HColor = [0, 255, 212];
        elRedeemFx.StartParticles();
        elRedeemFx.SetControlPoint(16, HColor[0], HColor[1], HColor[2]);
    }
    function _StopRedeemParticles() {
        const elRedeemFx = $.GetContextPanel().FindChildInLayoutFile('id-redeem-wait-particle');
        if (elRedeemFx !== null) {
            elRedeemFx.StopParticlesWithEndcaps();
        }
    }
    function _EnableRotateOnModel(elModel, lootlist_item_type = '') {
        if (lootlist_item_type === "sticker") {
            elModel.SetRotationLimits(50, 50);
        }
        else {
            elModel.SetRotationLimits(360, 360);
        }
        elModel.SetAutoRotateAmount(30, 20);
        elModel.SetAutoRotatePeriod(8, 8);
    }
    function _DisableRotateOnModel(elModel) {
        elModel.SetRotationLimits(0, 0);
        elModel.SetAutoRotateAmount(0, 0);
        elModel.SetAutoRotatePeriod(0, 0);
        elModel.SetRotation(0, 0, 0);
    }
    function _SetZoomInSizeAndPosition(ShopEntry, elShopTile, bUseNarrowZoom) {
        let baseWidth = ShopEntry.tile_width;
        let baseHeight = ShopEntry.tile_height;
        let zoomWidth = bUseNarrowZoom ? baseWidth : baseWidth * 2.0;
        let zoomHeight = baseHeight * 2.0;
        elShopTile.style.height = zoomHeight + 'px';
        elShopTile.style.width = zoomWidth + 'px';
        let tilePosX = Math.floor(elShopTile.actualxoffset / elShopTile.actualuiscale_x);
        let initialXTranslate = zoomWidth === baseWidth ? 0 : (baseWidth / 2);
        let sideOffset = 20;
        let contentPanelWidth = Math.floor(m_elContentPanel.actuallayoutwidth / m_elContentPanel.actualuiscale_x);
        let finalXTranslate = 0;
        if (tilePosX - initialXTranslate < m_elContentPanel.actualxoffset / m_elContentPanel.actualuiscale_x) // over the left edge
         {
            finalXTranslate = ((tilePosX) - sideOffset) * -1;
        }
        else if (((tilePosX - initialXTranslate) + zoomWidth) > contentPanelWidth) //over the right edge
         {
            finalXTranslate = (tilePosX - (contentPanelWidth - (zoomWidth + sideOffset))) * -1;
        }
        else {
            finalXTranslate = initialXTranslate * -1;
        }
        let tilePosY = Math.floor(elShopTile.actualyoffset / elShopTile.actualuiscale_y);
        let initialYTranslate = (baseHeight / 2);
        let finalYTranslate = 0;
        let contentPanelHeight = Math.floor(m_elContentPanel.actuallayoutheight / m_elContentPanel.actualuiscale_y);
        let bottomOffset = 32 + 48; //margin + bottom bar icon height;
        let topOffset = 92; //height of nav bar
        if ((tilePosY + zoomHeight) > (contentPanelHeight - bottomOffset)) // over the bottom edge
         {
            finalYTranslate = (tilePosY - (contentPanelHeight - zoomHeight)) + bottomOffset;
        }
        else if ((tilePosY - baseHeight / 2) < topOffset) {
            finalYTranslate = 0;
        }
        else {
            finalYTranslate = initialYTranslate;
        }
        elShopTile.style.transform = 'translateX(' + finalXTranslate + 'px) translateY(' + (finalYTranslate * -1) + 'px)';
    }
    function ResetSizeAndPosition(ShopEntry, elShopTile) {
        elShopTile.style.width = (ShopEntry.tile_width) + 'px';
        elShopTile.style.height = (ShopEntry.tile_height) + 'px';
        elShopTile.style.transform = 'translateX(0px) translateY(0px)';
    }
    function PlaceTiles(elTilesContainer, ShopEntry) {
        if (ShopEntry.lootlist?.length === 1) {
            return;
        }
        let nRows = 0;
        let nTileY = 0;
        const aChildren = elTilesContainer.Children();
        const nPanelsCount = aChildren.length;
        const nMaxColumns = ShopEntry.lootlist_item_type === 'weapon' ? 4 : ShopEntry.lootlist_item_type === 'sticker' ? 8 : 7;
        const oRowsAndColumns = StickerItemsPerRow(nPanelsCount, nMaxColumns);
        const nTotalRows = oRowsAndColumns.rows;
        const nColumns = oRowsAndColumns.cols;
        const contentPanelWidth = Math.floor(elTilesContainer.actuallayoutwidth / elTilesContainer.actualuiscale_x);
        const contentPanelHeight = Math.floor(elTilesContainer.actuallayoutheight / elTilesContainer.actualuiscale_y);
        const tileWidth = ShopEntry.tile_width;
        const tileHeight = ShopEntry.tile_height;
        const xOffset = (contentPanelWidth - (tileWidth * nColumns)) / 2;
        const yOffset = (contentPanelHeight - (tileHeight * nTotalRows)) / 2;
        aChildren.forEach((element, idx) => {
            if (idx % nColumns === 0) {
                nTileY = tileHeight * nRows;
                nRows++;
            }
            element.style.x = (idx % nColumns * tileWidth) + xOffset + 'px';
            element.style.y = (nTileY + yOffset) + 'px';
        });
    }
    function StickerItemsPerRow(nPanelsCount, maxColumn) {
        const maxRows = 4;
        if (nPanelsCount >= 32) {
            $.Msg('[p.armory] Too many Items for grid, Limit is 32');
            return { rows: maxRows, cols: maxColumn };
        }
        // Try to get as close to a square as possible, within limits
        let cols = Math.min(maxColumn, Math.ceil(Math.sqrt(nPanelsCount)));
        let rows = Math.ceil(nPanelsCount / cols);
        // If rows exceed maxRows, force rows down and increase cols
        if (rows > maxRows) {
            rows = maxRows;
            cols = Math.ceil(nPanelsCount / rows);
        }
        return { rows: rows, cols: cols };
    }
    function CreateShopTile(elTilesContainer, itemId, ShopEntry) {
        let sStyle = 'xpshop__inspect-grid__tile';
        let mapName = ShopEntry.lootlist?.length === 1 ? GameInterfaceAPI.GetSettingString('ui_inspect_bkgnd_map') + '_vanity' : "ui/xpshop_item";
        let elPanel = $.CreatePanel('CSGOBlurTarget', elTilesContainer, itemId, { class: sStyle });
        if (ShopEntry.lootlist?.length === 1) {
            elPanel.SetHasClass('single-item', true);
        }
        else {
            elPanel.style.width = (ShopEntry.tile_width) + 'px';
            elPanel.style.height = (ShopEntry.tile_height) + 'px';
        }
        if (ShopEntry.lootlist?.length === 1) {
            InspectModelImage.Init(elPanel, itemId);
        }
        else {
            const defName = InventoryAPI.GetItemDefinitionName(itemId);
            elPanel.Data().defName = defName;
            let cameraData = XpShopWeaponCameraSettings.CameraSettings.find(({ type }) => type === defName);
            let cameraSuffix = cameraData !== undefined ? cameraData.camera : '0';
            let camera = 'camera_' + ShopEntry.lootlist_item_type + '_' + cameraSuffix;
            MakeMapItemPreviewPanel(elPanel, camera, mapName, ShopEntry);
        }
        MakeShopTileInfoElements(elPanel, itemId, ShopEntry);
        return elPanel;
    }
    function MakeMapItemPreviewPanel(elPanel, camera, mapName, ShopEntry) {
        return $.CreatePanel('MapItemPreviewPanel', elPanel, 'id-grid-item-model', {
            class: 'xpshop__inspect-grid__tile__model',
            "require-composition-layer": "true",
            'transparent-background': true,
            'disable-depth-of-field': true,
            camera: camera,
            player: "false",
            map: mapName,
            initial_entity: 'item',
            active_item_idx: 0,
            mouse_rotate: "true",
            rotation_limit_x: "0",
            rotation_limit_y: "0",
            auto_rotate_x: "0",
            auto_rotate_y: "0",
            auto_rotate_period_x: "0",
            auto_rotate_period_y: "0",
            auto_recenter: true,
            hittest: "true",
            hide_while_waiting_for_composite_materials: "false"
        });
    }
    function MakeShopTileInfoElements(elPanel, itemId, ShopEntry) {
        let sTitleStyle = 'xpshop__inspect-grid__tile__label';
        $.CreatePanel('Label', elPanel, '', { text: InventoryAPI.GetItemName(itemId), class: sTitleStyle });
        let elRarity = $.CreatePanel('Panel', elPanel, '', { class: 'xpshop__inspect-grid__tile__rarity' });
        let color = InventoryAPI.GetItemRarityColor(itemId);
        if (!color)
            elRarity.visible = false;
        else
            elRarity.style.backgroundColor = color;
        let Btn = $.CreatePanel('Button', elPanel, '', { class: 'xpshop__inspect-grid__tile__inspect-btn' });
        $.CreatePanel('Image', Btn, '').SetImage('file://{images}/icons/ui/zoom_in.svg');
        Btn.SetPanelEvent('onactivate', () => {
            if (ShopEntry.on_item_activate) {
                ShopEntry.on_item_activate(ShopEntry, itemId);
            }
        });
        if (ShopEntry.lootlist?.length === 1 && ShopEntry.limited_until && !ShopEntry.bidding_cycle) {
            let elHint = $.CreatePanel('Panel', elPanel, 'id-xpshop-limited-item-tooltip-loc');
            elHint.BLoadLayoutSnippet('limited-item-variety');
            elHint.SetPanelEvent('onmouseover', () => {
                UiToolkitAPI.ShowCustomLayoutTooltip('id-xpshop-limited-item-tooltip-loc', 'id-xpshop-limited-item-tooltip', 'file://{resources}/layout/tooltips/tooltip_limited_item_variation.xml');
            });
            elHint.SetPanelEvent('onmouseout', () => {
                UiToolkitAPI.HideCustomLayoutTooltip('id-xpshop-limited-item-tooltip');
            });
            elHint.AddClass('xpshop-preview-variety');
        }
    }
    function OpenFullscreenInspect(ShopEntry) {
        let nDefinitionIndex = InventoryAPI.GetItemDefinitionIndexFromDefinitionName(ShopEntry.item_name);
        let id = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(nDefinitionIndex, 0);
        const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('popup-inspect-' + id, 'file://{resources}/layout/popups/popup_capability_decodable.xml');
        let oSettings = {
            item_id: id,
            show_work_type_warning: false,
            force_hide_async_bar: true,
            inspect_only: true,
            work_type: 'decodeable',
            only_close_btn: true
        };
        elPanel.Data().oSettings = oSettings;
    }
    function _OpenFullScreenInspectItem(ShopEntry, itemId) {
        let nameOverride = ShopEntry.callout ? ShopEntry.callout : ShopEntry.item_name;
        $.DispatchEvent("LootlistItemPreview", itemId, ShopEntry.item_name + ',,,' + nameOverride);
    }
    function _DarkenTiles(elItemsContainer, SelectedPanel = null) {
        elItemsContainer.Children().forEach(element => {
            if (element && element.IsValid()) {
                element.SetHasClass('darken', element.id !== SelectedPanel?.id && SelectedPanel !== null);
            }
        });
    }
    function _UpdateVisibleInspectGrid(elParent, id) {
        elParent.Children().forEach(element => {
            element.SetHasClass('show', (element.id === id));
        });
    }
    function _MakeShowMainTilesNavBtn() {
        // Separating making this btn out of the nav since we need to make it first.
        let elParent = $.GetContextPanel().FindChildInLayoutFile('id-xpshop-top-nav');
        let elBtn = elParent.FindChildInLayoutFile('id-nav-show-main-tiles-btn');
        if (!elBtn) {
            elBtn = $.CreatePanel('RadioButton', elParent, 'id-nav-show-main-tiles-btn', { group: 'xpshop-nav' });
            elBtn.BLoadLayoutSnippet('shop-nav');
            elBtn.FindChild('id-xpshop-nav-btn-img').SetImage('file://{images}/icons/ui/xpshop_tiles.svg');
            elBtn.SetPanelEvent('onactivate', () => {
                let elParent = $.GetContextPanel().FindChildInLayoutFile('id-xpshop-content');
                elParent.SetHasClass('xpshop-grids-visible', false);
            });
        }
    }
    function ShouldShowNewTagForShopEntry(ShopEntry) {
        if (ShopEntry.ui_show_new_tag) {
            let numSecondsRemaining = StoreAPI.GetSecondsUntilTimestamp(parseInt(ShopEntry.ui_show_new_tag));
            return (numSecondsRemaining > 0);
        }
        return false;
    }
    XpShop.ShouldShowNewTagForShopEntry = ShouldShowNewTagForShopEntry;
    function _MakeNavButton(ShopEntry) {
        let elParent = $.GetContextPanel().FindChildInLayoutFile('id-xpshop-top-nav');
        let elBtn = elParent.FindChildInLayoutFile(ShopEntry.item_name + '-nav');
        if (!elBtn) {
            elBtn = $.CreatePanel('RadioButton', elParent, ShopEntry.item_name + '-nav', { group: 'xpshop-nav' });
            elBtn.BLoadLayoutSnippet('shop-nav');
            elBtn.SetPanelEvent('onactivate', () => _UpdateInspectGrid(ShopEntry));
            elBtn.Data().ui_order = ShopEntry.ui_order;
            if (ShopEntry.ui_set_image) {
                const elImage = elBtn.FindChild('id-xpshop-nav-btn-img');
                IconUtil.SetupFallbackItemSetIcon(elImage, ShopEntry.ui_set_image);
                IconUtil.SetItemSetSVGImage(elImage, ShopEntry.ui_set_image);
            }
        }
    }
    function _CancelTimeoutForRewardItem() {
        _StopRedeemParticles();
        $.GetContextPanel().SetHasClass('waiting-for-redeem', false);
        if (m_showTimeoutScheduleHandle) {
            $.CancelScheduled(m_showTimeoutScheduleHandle);
            m_showTimeoutScheduleHandle = null;
        }
    }
    function _OnHideMainMenu() {
        _CancelTimeoutForRewardItem();
        _DeleteInspectGrid();
    }
    function _OnHidePauseMenu() {
        _CancelTimeoutForRewardItem();
        _DeleteInspectGrid();
    }
    $.RegisterForUnhandledEvent('UpdateXpShop', InventoryUpdate);
    $.RegisterForUnhandledEvent('CSGOHideMainMenu', _OnHideMainMenu);
    $.RegisterForUnhandledEvent('CSGOHidePauseMenu', _OnHidePauseMenu);
})(XpShop || (XpShop = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieHBzaG9wLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMveHBzaG9wLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFDbEMsbUNBQW1DO0FBQ25DLHFEQUFxRDtBQUNyRCxzREFBc0Q7QUFDdEQscUVBQXFFO0FBQ3JFLHlEQUF5RDtBQUN6RCx1Q0FBdUM7QUFDdkMsd0NBQXdDO0FBQ3hDLDZDQUE2QztBQUM3QyxDQUFDLENBQUMsVUFBVSxDQUFFLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztBQW1DcEMsSUFBVSxNQUFNLENBeTVDZjtBQXo1Q0QsV0FBVSxNQUFNO0lBRVosTUFBTSxXQUFXLEdBQUcsR0FBRyxDQUFDO0lBQ3hCLE1BQU0sWUFBWSxHQUFHLEdBQUcsQ0FBQztJQUN6QixNQUFNLGtCQUFrQixHQUFHLEdBQUcsQ0FBQztJQUMvQixNQUFNLG9CQUFvQixHQUFHLGtCQUFrQixHQUFHLEVBQUUsQ0FBQztJQUNyRCxNQUFNLGdCQUFnQixHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxtQkFBbUIsQ0FBRSxDQUFDO0lBQzFGLElBQUksUUFBZSxDQUFDO0lBQ3BCLElBQUksT0FBYyxDQUFDO0lBQ25CLElBQUksY0FBYyxHQUFVLENBQUMsQ0FBQztJQUM5QixJQUFJLDJCQUEwQyxDQUFDO0lBQy9DLE1BQU0sYUFBYSxHQUFHLGVBQWUsQ0FBQztJQUN0QyxNQUFNLFFBQVEsR0FBRyxZQUFZLENBQUMsaUNBQWlDLENBQUUsWUFBWSxDQUFDLHdDQUF3QyxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0lBRTNJLFNBQWdCLElBQUk7UUFFaEIsUUFBUSxHQUFJLFdBQVcsQ0FBQywrQkFBK0IsRUFBRSxDQUFDO1FBRTFELElBQUksQ0FBQyxRQUFRLElBQUksUUFBUSxLQUFLLENBQUMsRUFDL0I7WUFDSSxVQUFVO1lBQ1YsT0FBTztTQUNWO1FBRUQsd0JBQXdCLEVBQUUsQ0FBQztRQUMzQixZQUFZLEVBQUUsQ0FBQztRQUNmLGdCQUFnQixDQUFFLFFBQVEsQ0FBRSxDQUFDO1FBRTdCLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO1FBQ3BGLENBQUMsQ0FBQyxhQUFhLENBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxPQUFPLENBQUUsQ0FBQztJQUN0RCxDQUFDO0lBaEJrQixXQUFJLE9BZ0J0QixDQUFBO0lBRUUsU0FBZ0IsZUFBZTtRQUUzQixJQUFJLENBQUMsZ0JBQWdCLElBQUksQ0FBQyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsT0FBTyxFQUFFLEVBQ3ZEO1lBQ0ksT0FBTztTQUNWO1FBRUQsMkJBQTJCLEVBQUUsQ0FBQztRQUM5QixZQUFZLEVBQUUsQ0FBQztRQUVmLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLE1BQU0sQ0FBRSxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLEtBQUssSUFBSSxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkksSUFBSSxLQUFLLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRSxFQUM1QjtZQUNJLENBQUMsQ0FBQyxhQUFhLENBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxPQUFPLENBQUUsQ0FBQztTQUNsRDthQUVEO1lBQ0ksd0JBQXdCLEVBQUUsQ0FBQztZQUMzQixDQUFDLENBQUMsYUFBYSxDQUFFLFdBQVcsRUFBRSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUMsNEJBQTRCLENBQUMsRUFBRSxPQUFPLENBQUUsQ0FBQztTQUNwSDtJQUNMLENBQUM7SUFwQmUsc0JBQWUsa0JBb0I5QixDQUFBO0lBRUQsU0FBUyxZQUFZO1FBRWpCLElBQUksU0FBUyxHQUFZLGNBQWMsQ0FBQyxzQkFBc0IsQ0FBRSxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUUsQ0FBQztRQUN6RixJQUFJLG9CQUFvQixHQUFHLFlBQVksQ0FBQyw2QkFBNkIsQ0FBRSxRQUFRLEVBQUUsQ0FBQyxDQUFFLENBQUM7UUFDckYsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLGtCQUFrQixDQUFFLENBQUM7UUFDL0UsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLGtCQUFrQixDQUFFLENBQUM7UUFDL0UsSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLHNCQUFzQixDQUFtQixDQUFDO1FBQ3JHLElBQUksWUFBWSxHQUFJLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxnQkFBZ0IsQ0FBZSxDQUFBO1FBQzlGLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxtQkFBbUIsQ0FBRSxDQUFDO1FBQ2pGLElBQUksZUFBZSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQywyQkFBMkIsQ0FBaUIsQ0FBQztRQUU3RyxRQUFRLENBQUMsaUJBQWlCLENBQUUsTUFBTSxFQUFFLFlBQVksQ0FBQyxXQUFXLENBQUUsUUFBUSxDQUFFLENBQUMsQ0FBQztRQUMxRSxRQUFRLENBQUMsb0JBQW9CLENBQUUsV0FBVyxFQUFFLFFBQVEsQ0FBQyxzQkFBc0IsRUFBRSxDQUFFLENBQUM7UUFFaEYsd0JBQXdCO1FBQ3hCLE1BQU0scUJBQXFCLEdBQUcsQ0FBRSxTQUFTLElBQUksb0JBQW9CLElBQUksb0JBQW9CLENBQUMsa0JBQWtCLElBQUksQ0FBQyxDQUFFLENBQUM7UUFDcEgsTUFBTSxvQkFBb0IsR0FBRyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLENBQUMsa0JBQTRCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMzRyxTQUFTLENBQUMsb0JBQW9CLENBQUUsbUJBQW1CLEVBQUUsb0JBQW9CLENBQUUsQ0FBQztRQUM1RSxTQUFTLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxHQUFHLG9CQUFvQixDQUFDO1FBRWhELElBQUksQ0FBQyxTQUFTLEVBQ2Q7WUFDSSxRQUFRLENBQUMsaUJBQWlCLENBQUUsYUFBYSxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUUsNEJBQTRCLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUNoRyxRQUFRLENBQUMsaUJBQWlCLENBQUUsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBRSwrQkFBK0IsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ3ZHLFlBQVksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1lBRTdCLFNBQVMsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLEdBQUcsRUFBRTtnQkFDeEMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxxQkFBcUIsRUFBRSxrQ0FBa0MsRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDcEYsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDLHFCQUFxQixDQUFDLG1CQUFtQixDQUFDLENBQUM7Z0JBQ3RHLENBQUMsQ0FBQyxhQUFhLENBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUUsQ0FBQztnQkFDbEQsUUFBUyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDN0IsQ0FBQyxDQUFDLENBQUM7WUFFSCxRQUFRLENBQUMsV0FBVyxDQUFFLE1BQU0sRUFBRSxLQUFLLENBQUUsQ0FBQztZQUN0QyxlQUFlLENBQUMsV0FBVyxDQUFFLE1BQU0sRUFBRSxJQUFJLENBQUUsQ0FBQztZQUM1QyxTQUFTLENBQUMsV0FBVyxDQUFFLE1BQU0sRUFBRSxJQUFJLENBQUUsQ0FBQztTQUN6QzthQUVEO1lBQ0ksZ0JBQWdCLENBQUMsY0FBYyxDQUFFLENBQUUsYUFBYSxDQUFFLEVBQUUsSUFBSSxDQUFFLENBQUM7WUFFM0QsWUFBWSxDQUFDLDBCQUEwQixDQUFFLGNBQWMsRUFBRSxLQUFLLEVBQUUsa0JBQWtCLEdBQUcsYUFBYSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUUsQ0FBQztZQUM3RyxPQUFPLEdBQUcsWUFBWSxDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDM0MsSUFBSSxjQUFjLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLHlCQUF5QixDQUFFLENBQUM7WUFFNUYsTUFBTSx5QkFBeUIsR0FBRyxvQkFBb0IsSUFBSSxDQUN0RCxvQkFBb0IsQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxvQkFBb0IsQ0FBQyxrQkFBa0IsR0FBRyxDQUFDLENBQzNGLENBQUM7WUFFRixJQUFLLE9BQU8sR0FBRyxDQUFDLElBQUkseUJBQXlCLEVBQzdDO2dCQUNJLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQztnQkFDbEIsY0FBYyxHQUFHLENBQUMsQ0FBQztnQkFFbkIsSUFBSSwyQkFBMkIsR0FBRyxDQUFDLENBQUM7Z0JBQ3BDLE1BQU0sa0JBQWtCLEdBQUcsUUFBUSxDQUFDLGtCQUFrQixFQUFFLENBQUM7Z0JBRXpELHFFQUFxRTtnQkFDckUsSUFBSSx1QkFBdUIsR0FBRyxDQUFDLENBQUM7Z0JBQ2hDLEtBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxrQkFBa0IsRUFBRSxDQUFDLEVBQUUsRUFDNUM7b0JBQ0ksSUFBSyxvQkFBb0IsSUFBSSxvQkFBb0IsQ0FBQyxTQUFTLENBQUUsQ0FBQyxDQUFFLEVBQ2hFO3dCQUNJLE1BQU0sTUFBTSxHQUFHLG9CQUFvQixDQUFDLFNBQVMsQ0FBRSxDQUFDLENBQUUsR0FBRyxRQUFRLENBQUMsZUFBZSxFQUFFLElBQUksUUFBUSxDQUFDLHNCQUFzQixFQUFFLENBQUM7d0JBQ3JILElBQUssTUFBTTs0QkFDUCxFQUFFLHVCQUF1QixDQUFDO3FCQUNqQztpQkFDSjtnQkFFRCxjQUFjLENBQUMsV0FBVyxDQUFFLE1BQU0sRUFBRSxLQUFLLENBQUUsQ0FBQztnQkFDNUMsS0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGtCQUFrQixFQUFFLENBQUMsRUFBRSxFQUM1QztvQkFDSSxzQ0FBc0M7b0JBQ3RDLElBQUksT0FBTyxHQUFHLFdBQVcsQ0FBRSxjQUFjLEVBQUUsQ0FBQyxDQUFFLENBQUM7b0JBQy9DLE9BQU8sQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO29CQUV4QixJQUFJLGFBQWEsR0FBRyxPQUFPLENBQUMscUJBQXFCLENBQUUsNkJBQTZCLENBQUUsQ0FBQztvQkFDbkYsYUFBYSxDQUFDLFdBQVcsQ0FBRSxRQUFRLEVBQUUsSUFBSSxDQUFFLENBQUM7b0JBRTVDLElBQUksU0FBZ0MsQ0FBQztvQkFFckMsY0FBYztvQkFDZCxJQUFLLG9CQUFvQixJQUFJLG9CQUFvQixDQUFDLFNBQVMsQ0FBRSxDQUFDLENBQUUsRUFDaEU7d0JBQ0ksSUFBSSxNQUFNLEdBQUcsb0JBQW9CLENBQUMsU0FBUyxDQUFFLENBQUMsQ0FBRSxHQUFHLFFBQVEsQ0FBQyxlQUFlLEVBQUUsSUFBSSxRQUFRLENBQUMsc0JBQXNCLEVBQUUsQ0FBQzt3QkFDbkgsSUFBSSxVQUFVLEdBQUcsUUFBUSxDQUFFLG9CQUFvQixDQUFDLFNBQVMsQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDO3dCQUNqRSxJQUFJLFlBQVksR0FBRyxVQUFVLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFFLFVBQVUsR0FBRyxRQUFRLENBQUMsZUFBZSxFQUFFLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUM5RixJQUFJLGVBQWUsR0FBRyxPQUFPLENBQUMscUJBQXFCLENBQUMsd0NBQXdDLENBQUMsQ0FBQTt3QkFFN0YsZUFBZSxDQUFDLFFBQVEsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsRUFBRTs0QkFDakQsT0FBTyxDQUFDLFdBQVcsQ0FBRSxVQUFVLEVBQUcsR0FBRyxHQUFHLFlBQVksQ0FBRSxDQUFDO3dCQUMzRCxDQUFDLENBQUMsQ0FBQzt3QkFFSCxTQUFTLEdBQUc7NEJBQ1Isd0JBQXdCLEVBQUUsT0FBTzs0QkFDakMsa0JBQWtCLEVBQUUsVUFBVTt5QkFDakMsQ0FBQTt3QkFFRCxPQUFPLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQzt3QkFDdkIsV0FBVyxDQUFDLFVBQVUsQ0FBRSxTQUFTLENBQUUsQ0FBQzt3QkFDcEMsY0FBYyxFQUFFLENBQUM7d0JBRWpCLE9BQU8sQ0FBQyxhQUFhLENBQUMsYUFBYSxFQUFFLEdBQUUsRUFBRTs0QkFDckMsSUFBSyxDQUFDLE1BQU0sRUFDWjtnQ0FDSSxZQUFZLENBQUMsZUFBZSxDQUFFLE9BQU8sQ0FBQyxFQUFFLEVBQUUsdUJBQXVCLENBQUUsQ0FBQzs2QkFDdkU7d0JBQ0wsQ0FBQyxDQUFDLENBQUM7d0JBRUgsT0FBTyxDQUFDLGFBQWEsQ0FBQyxZQUFZLEVBQUUsR0FBRSxFQUFFOzRCQUNwQyxZQUFZLENBQUMsZUFBZSxFQUFFLENBQUM7d0JBQ25DLENBQUMsQ0FBQyxDQUFDO3dCQUVILElBQUssTUFBTSxFQUNYOzRCQUNJLGFBQWEsQ0FBQyxXQUFXLENBQUUsUUFBUSxFQUFFLEtBQUssQ0FBRSxDQUFDOzRCQUM3QyxhQUFhLENBQUMsV0FBVyxDQUFFLE1BQU0sRUFBRSxnQkFBZ0IsQ0FBRSxDQUFDOzRCQUN0RCxhQUFhLENBQUMsaUJBQWlCLENBQUUsYUFBYSxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUUsaUNBQWlDLEVBQUUsYUFBYSxDQUFFLENBQUUsQ0FBQzs0QkFDakgsYUFBYSxDQUFDLG9CQUFvQixDQUFFLHdCQUF3QixFQUFFLHVCQUF1QixDQUFFLENBQUM7NEJBQ3hGLE1BQU0sZUFBZSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUUsZ0NBQWdDLEVBQUUsYUFBYSxDQUFFLENBQUM7NEJBQ3RGLE1BQU0sY0FBYyxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUUscUNBQXFDLEVBQUUsYUFBYSxDQUFFLENBQUM7NEJBQzFGLGFBQWEsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLEdBQUcsRUFBRTtnQ0FFNUMsWUFBWSxDQUFDLHdCQUF3QixDQUNqQyxlQUFlLEVBQ2YsY0FBYyxFQUNkLEVBQUUsRUFDRixHQUFHLEVBQUU7b0NBRUQsUUFBUSxDQUFDLHdCQUF3QixFQUFFLENBQUM7Z0NBQ3hDLENBQUMsRUFDRCxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQ1osQ0FBQzs0QkFDTixDQUFDLENBQUUsQ0FBQzt5QkFDUDtxQkFDSjtvQkFDRCwwQkFBMEI7eUJBQ3JCLElBQUssT0FBTyxHQUFHLENBQUMsSUFBSSxTQUFTLEdBQUcsT0FBTyxFQUM1Qzt3QkFDSSxJQUFJLGNBQWMsR0FBRyxZQUFZLENBQUMseUJBQXlCLENBQUUsU0FBUyxDQUFFLENBQUM7d0JBQ3pFLFNBQVMsRUFBRSxDQUFDO3dCQUVaLFNBQVMsR0FBRzs0QkFDUix3QkFBd0IsRUFBRSxPQUFPOzRCQUNqQyxrQkFBa0IsRUFBRSxDQUFDO3lCQUN4QixDQUFBO3dCQUVELFdBQVcsQ0FBQyxVQUFVLENBQUUsU0FBUyxDQUFFLENBQUM7d0JBRXBDLElBQUksZUFBZSxHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyx3Q0FBd0MsQ0FBQyxDQUFBO3dCQUU3RixlQUFlLENBQUMsUUFBUSxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUUsT0FBTyxFQUFHLEVBQUU7NEJBQzdDLE9BQU8sQ0FBQyxXQUFXLENBQUUsVUFBVSxFQUFHLEtBQUssQ0FBRSxDQUFDO3dCQUM5QyxDQUFDLENBQUMsQ0FBQzt3QkFFSCxPQUFPLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQzt3QkFFdkIsYUFBYSxDQUFDLFdBQVcsQ0FBRSxRQUFRLEVBQUUsS0FBSyxDQUFFLENBQUM7d0JBQzdDLGFBQWEsQ0FBQyxXQUFXLENBQUUsTUFBTSxFQUFFLG1CQUFtQixDQUFFLENBQUM7d0JBQ3pELGFBQWEsQ0FBQyxpQkFBaUIsQ0FBRSxhQUFhLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBRSx1QkFBdUIsRUFBRSxhQUFhLENBQUUsQ0FBRSxDQUFDO3dCQUN2RyxhQUFhLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxHQUFHLEVBQUU7NEJBRTVDLFdBQVcsQ0FBQyxxQkFBcUIsQ0FBRSxTQUFTLENBQUUsQ0FBQzs0QkFDL0MsYUFBYSxDQUFDLFdBQVcsQ0FBRSxRQUFRLEVBQUUsSUFBSSxDQUFFLENBQUM7NEJBQzVDLE9BQU8sQ0FBQyxZQUFZLENBQUUsMkJBQTJCLENBQUUsQ0FBQzs0QkFDcEQsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxxQkFBcUIsRUFBRSxpQkFBaUIsRUFBRSxPQUFPLENBQUMsQ0FBQzs0QkFDbkUsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxHQUFHLEVBQUUsR0FBRyxFQUFFO2dDQUNsQixZQUFZLENBQUMsT0FBTyxDQUFFLGNBQWMsRUFBRSxFQUFFLENBQUUsQ0FBQztnQ0FDM0MsT0FBTyxDQUFDLHFCQUFxQixDQUFDLHVCQUF1QixDQUFDLENBQUMsWUFBWSxDQUFFLGlDQUFpQyxDQUFFLENBQUM7NEJBQzdHLENBQUMsQ0FBQyxDQUFDO3dCQUNQLENBQUMsQ0FBRSxDQUFDO3FCQUNQO3lCQUVEO3dCQUNJLHdEQUF3RDt3QkFDeEQsRUFBRywyQkFBMkIsQ0FBQztxQkFDbEM7aUJBQ0o7Z0JBRUQsa0dBQWtHO2dCQUNsRyxRQUFRLENBQUMsV0FBVyxDQUFFLE1BQU0sRUFBRSxJQUFJLENBQUUsQ0FBQztnQkFDckMsU0FBUyxDQUFDLFdBQVcsQ0FBRSxNQUFNLEVBQUUsS0FBSyxDQUFFLENBQUM7Z0JBRXZDLHlGQUF5RjtnQkFDekYsZUFBZSxDQUFDLFdBQVcsQ0FBRSxNQUFNLEVBQUUsMkJBQTJCLElBQUksQ0FBQyxDQUFFLENBQUM7Z0JBQ3hFLGVBQWUsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBRSx5QkFBeUIsRUFBRSxjQUFjLENBQUUsQ0FBQztnQkFDL0UsZUFBZSxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsR0FBRyxFQUFFO29CQUM5QyxzQkFBc0IsRUFBRSxDQUFDO29CQUN6QixDQUFDLENBQUMsYUFBYSxDQUFDLHFCQUFxQixFQUFFLGtDQUFrQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUV4RixDQUFDLENBQUMsQ0FBQztnQkFFSCxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUMsbUNBQW1DLENBQUMsQ0FBQyxXQUFXLENBQUUsYUFBYSxFQUFFLDJCQUEyQixLQUFLLENBQUMsQ0FBRSxDQUFDO2FBQ2xKO2lCQUNJLHNHQUFzRzthQUMzRztnQkFDSSxRQUFRLENBQUMsaUJBQWlCLENBQUUsYUFBYSxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUUscUJBQXFCLEVBQUUsUUFBUSxDQUFFLENBQUMsQ0FBQztnQkFDMUYsUUFBUSxDQUFDLGlCQUFpQixDQUFFLGlCQUFpQixFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUUsb0JBQW9CLEVBQUUsUUFBUSxDQUFFLENBQUMsQ0FBQztnQkFFN0YsWUFBWSxDQUFDLFNBQVMsQ0FBRSxvQkFBb0IsQ0FBQyxFQUFFLGFBQWEsQ0FBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLENBQ2pGLGVBQWUsQ0FBQyxpQ0FBaUMsQ0FBRSw0Q0FBNEMsQ0FBRSxDQUFFLENBQUM7Z0JBRWxHLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyx3QkFBd0IsQ0FBa0IsQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFDO2dCQUU5RixTQUFTLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxHQUFHLEVBQUU7b0JBQ3hDLENBQUMsQ0FBQyxhQUFhLENBQUMscUJBQXFCLEVBQUUsa0NBQWtDLEVBQUUsT0FBTyxDQUFDLENBQUM7b0JBQ3BGLHNCQUFzQixFQUFFLENBQUM7Z0JBQzdCLENBQUMsQ0FBQyxDQUFDO2dCQUVILGNBQWMsQ0FBQyxXQUFXLENBQUUsTUFBTSxFQUFFLElBQUksQ0FBRSxDQUFDO2dCQUMzQyxRQUFRLENBQUMsV0FBVyxDQUFFLE1BQU0sRUFBRSxLQUFLLENBQUUsQ0FBQztnQkFDdEMsZUFBZSxDQUFDLFdBQVcsQ0FBRSxNQUFNLEVBQUUsSUFBSSxDQUFFLENBQUM7Z0JBQzVDLFNBQVMsQ0FBQyxXQUFXLENBQUUsTUFBTSxFQUFFLElBQUksQ0FBRSxDQUFDO2FBQ3pDO1NBQ0o7SUFDUixDQUFDO0lBRUUsU0FBUyxzQkFBc0I7UUFFM0IsTUFBTSxPQUFPLEdBQUcsWUFBWSxDQUFDLHFCQUFxQixDQUM5QyxFQUFFLEVBQ0YsOERBQThELENBQ2pFLENBQUE7UUFFRCxJQUFJLFNBQVMsR0FBMEI7WUFDNUMsT0FBTyxFQUFFLFFBQVE7WUFDakIsWUFBWSxFQUFFLEtBQUs7WUFDbkIsc0JBQXNCLEVBQUUsS0FBSztZQUNwQixhQUFhLEVBQUUsUUFBUTtTQUNoQyxDQUFBO1FBRUQsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7SUFDbkMsQ0FBQztJQUVELFNBQVMsV0FBVyxDQUFFLFFBQWlCLEVBQUUsS0FBYTtRQUVsRCxNQUFNLFdBQVcsR0FBRyxlQUFlLENBQUE7UUFDbkMsSUFBSSxPQUFPLEdBQUcsUUFBUSxDQUFDLHFCQUFxQixDQUFFLFdBQVcsR0FBRyxLQUFLLENBQUUsQ0FBQztRQUNwRSxJQUFJLENBQUMsT0FBTyxFQUNaO1lBQ0ksT0FBTyxHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRyxXQUFXLEdBQUcsS0FBSyxDQUFhLENBQUM7WUFDOUUsT0FBTyxDQUFDLGtCQUFrQixDQUFFLGFBQWEsQ0FBRSxDQUFDO1lBQzVDLE9BQU8sQ0FBQyxLQUFLLENBQUMsZUFBZSxHQUFHLFFBQVEsQ0FBQztZQUN6QyxPQUFPLENBQUMsS0FBSyxDQUFDLG1CQUFtQixHQUFHLFFBQVEsQ0FBQztZQUU3QyxJQUFJLFVBQVUsR0FBRyxPQUFPLENBQUMscUJBQXFCLENBQUMsa0NBQWtDLENBQUMsQ0FBQztZQUNuRixVQUFVLENBQUMsV0FBVyxDQUFFLDRDQUE0QyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUUsQ0FBQztZQUNwRixVQUFVLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztZQUMzQixVQUFVLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQztZQUVuQyxJQUFJLFFBQVEsR0FBRyxPQUFPLENBQUMscUJBQXFCLENBQUMsd0NBQXdDLENBQUMsQ0FBQTtZQUV0RixLQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLHNCQUFzQixFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQzNEO2dCQUNJLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRyxFQUFFLENBQWEsQ0FBQztnQkFDaEUsTUFBTSxDQUFDLGtCQUFrQixDQUFFLGdCQUFnQixDQUFFLENBQUM7YUFDakQ7U0FDSjtRQUVELE9BQU8sT0FBTyxDQUFDO0lBQ25CLENBQUM7SUFFRCxTQUFTLGdCQUFnQixDQUFHLFFBQWU7UUFFdkMsSUFBSSxNQUFNLEdBQUcsV0FBVyxDQUFDLHdDQUF3QyxDQUFFLFFBQVEsQ0FBRSxDQUFDO1FBQzlFLElBQUksY0FBYyxHQUFpQixFQUFFLENBQUM7UUFDdEMsSUFBSSxXQUFXLEdBQXNCLEVBQUUsQ0FBQztRQUV4QyxLQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUNoQztZQUNJLElBQUksU0FBUyxHQUFlO2dCQUN4QixRQUFRLEVBQUUsQ0FBQztnQkFDWCxZQUFZLEVBQUUsQ0FBQztnQkFDZixTQUFTLEVBQUUsQ0FBQztnQkFDWixLQUFLLEVBQUUsQ0FBQztnQkFDUixRQUFRLEVBQUUsRUFBRTtnQkFDWixZQUFZLEVBQUUsRUFBRTtnQkFDaEIsa0JBQWtCLEVBQUUsRUFBRTtnQkFDdEIsU0FBUyxFQUFFLEVBQUU7Z0JBQ2IsT0FBTyxFQUFFLEVBQUU7Z0JBQ1gsZ0JBQWdCLEVBQUUsRUFBRTtnQkFDcEIsTUFBTSxFQUFFLEVBQUU7Z0JBQ1YsYUFBYSxFQUFFLEVBQUU7Z0JBQ2pCLGVBQWUsRUFBRSxFQUFFO2dCQUNuQixhQUFhLEVBQUUsRUFBRTtnQkFDakIsYUFBYSxFQUFFLEVBQUU7Z0JBQ2pCLGFBQWEsRUFBRSxFQUFFO2dCQUNqQixhQUFhLEVBQUUsRUFBRTthQUNwQixDQUFDO1lBRUYsS0FBSyxJQUFJLEdBQUcsSUFBSSxTQUFTLEVBQUU7Z0JBQ3ZCLElBQUksV0FBVyxHQUFHLFdBQVcsQ0FBQyx5Q0FBeUMsQ0FBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBRSxDQUFDO2dCQUM1RixnQ0FBZ0M7Z0JBQ2hDLFNBQVMsQ0FBQyxHQUFHLENBQUMsR0FBRyxXQUFXLENBQUM7YUFDaEM7WUFFRCxTQUFTLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQztZQUN6QixXQUFXLENBQUUsU0FBUyxDQUFDLFFBQVMsQ0FBRSxHQUFHLENBQUMsV0FBVyxDQUFFLFNBQVMsQ0FBQyxRQUFTLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFJLFdBQVcsQ0FBQyxTQUFTLENBQUMsUUFBa0IsQ0FBYSxDQUFDO1lBRXpJLENBQUMsQ0FBQyxHQUFHLENBQUUsa0NBQWtDLEdBQUksU0FBUyxDQUFDLFNBQVMsQ0FBRSxDQUFDO1lBRW5FLElBQUssU0FBUyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUUsV0FBVyxDQUFFLEVBQ2xEO2dCQUNJLFNBQVMsQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO2dCQUNsQyxTQUFTLENBQUMsUUFBUSxHQUFHLHFCQUFxQixDQUFFLFNBQVMsQ0FBQyxTQUFTLENBQUUsQ0FBQztnQkFDbEUsU0FBUyxDQUFDLGtCQUFrQixHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUUsU0FBUyxDQUFDLFFBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUUsU0FBUyxDQUFDLFFBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztnQkFFL0osU0FBUyxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUMsa0JBQWtCLEtBQUssVUFBVSxJQUFJLFNBQVMsQ0FBQyxrQkFBa0IsS0FBSyxTQUFTLENBQUEsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUM7Z0JBQ25KLFNBQVMsQ0FBQyxXQUFXLEdBQUcsU0FBUyxDQUFDLGtCQUFrQixLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsa0JBQWtCLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQztnQkFFN0ssU0FBUyxDQUFDLGdCQUFnQixHQUFHLDBCQUEwQixDQUFDO2dCQUN4RCxJQUFJLFVBQVUsR0FBRyxZQUFZLENBQUMsTUFBTSxDQUFFLFNBQVMsQ0FBQyxRQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFFLENBQUM7Z0JBQzFFLFNBQVMsQ0FBQyxZQUFZLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUM7Z0JBRTNFLElBQUssU0FBUyxDQUFDLGFBQWE7b0JBQ3hCLFNBQVMsQ0FBQyxpQkFBaUIsR0FBRyxjQUFjLENBQUM7YUFDcEQ7aUJBRUQ7Z0JBQ0ksSUFBSSxLQUFLLEdBQUcsQ0FBRSxTQUFTLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBRSxRQUFRLENBQUUsQ0FBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUM7Z0JBQzNGLFNBQVMsQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDO2dCQUM3QixTQUFTLENBQUMsaUJBQWlCLEdBQUcsR0FBRyxHQUFHLENBQUUsU0FBUyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUUsQ0FBQztnQkFDaEYsSUFBSSxnQkFBZ0IsR0FBRyxZQUFZLENBQUMsd0NBQXdDLENBQUUsU0FBUyxDQUFDLFNBQVMsQ0FBRSxDQUFDO2dCQUNwRyxJQUFJLE9BQU8sR0FBRyxZQUFZLENBQUMsaUNBQWlDLENBQUUsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFFLENBQUM7Z0JBQ3BGLFNBQVMsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDL0IsU0FBUyxDQUFDLGtCQUFrQixHQUFHLEtBQUssQ0FBQztnQkFDckMsU0FBUyxDQUFDLGdCQUFnQixHQUFHLDBCQUEwQixDQUFDO2dCQUN4RCxJQUFLLEtBQUssS0FBSyxPQUFPLEVBQ3RCO29CQUNJLElBQUksVUFBVSxHQUFHLFlBQVksQ0FBQyxNQUFNLENBQUUsWUFBWSxDQUFDLHdCQUF3QixDQUFFLE9BQU8sRUFBRSxDQUFDLENBQUUsRUFBRSxTQUFTLENBQUUsQ0FBQztvQkFDdkcsU0FBUyxDQUFDLFlBQVksR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUN0RCxTQUFTLENBQUMsZ0JBQWdCLEdBQUcscUJBQXFCLENBQUM7aUJBQ3REO2FBQ0o7WUFFRCxJQUFLLFNBQVMsQ0FBQyxLQUFLLElBQUksQ0FBRSxDQUFFLFNBQVMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFFLEtBQUssQ0FBQyxDQUFFLEVBQ3pEO2dCQUNJLE1BQU0sU0FBUyxHQUFHLFlBQVksQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDOUMsQ0FBQyxDQUFDLEdBQUcsQ0FBRSw0QkFBNEIsR0FBSSxTQUFTLENBQUMsU0FBUyxHQUFHLGdCQUFnQixHQUFHLFNBQVMsR0FBRyxHQUFHLENBQUUsQ0FBQztnQkFDbEcsSUFBSyxTQUFTO29CQUFHLFNBQVMsQ0FBQyx5REFBeUQ7YUFDdkY7WUFFRCxJQUFLLFNBQVMsQ0FBQyxhQUFhLEVBQzVCO2dCQUNJLFNBQVMsQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUMscUVBQXFFO2dCQUU1RixNQUFNLG1CQUFtQixHQUFHLFFBQVEsQ0FBQyx3QkFBd0IsQ0FBRSxRQUFRLENBQUUsU0FBUyxDQUFDLGFBQWMsQ0FBRSxDQUFFLENBQUM7Z0JBQ3RHLElBQUssbUJBQW1CLElBQUksQ0FBQztvQkFBRyxTQUFTLENBQUMsK0VBQStFO2FBQzVIO1lBRUQsY0FBYyxDQUFDLElBQUksQ0FBRSxTQUFTLENBQUUsQ0FBQztTQUNwQztRQUVELGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBRSxPQUFPLEVBQUcsRUFBRTtZQUNqQyxPQUFPLENBQUMsWUFBWSxHQUFHLFdBQVcsQ0FBRSxPQUFPLENBQUMsUUFBa0IsQ0FBRSxDQUFDO1lBQ2pFLGFBQWEsQ0FBRSxPQUFPLENBQUUsQ0FBQztZQUN6QixjQUFjLENBQUUsT0FBTyxDQUFFLENBQUM7UUFDOUIsQ0FBQyxDQUFDLENBQUM7UUFFSCxzRUFBc0U7UUFDdEUsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLG1CQUFtQixDQUFFLENBQUM7UUFDaEYsSUFBSSxXQUFXLEdBQUcsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ3RDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBRSxPQUFPLEVBQUUsR0FBRyxFQUFHLEVBQUU7WUFDbkMsSUFBSSxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsUUFBUSxFQUMzQjtnQkFDSSxJQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxRQUFRLEtBQUssR0FBRyxFQUNuQztvQkFDSSxRQUFRLENBQUMsZUFBZSxDQUFFLE9BQU8sRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtpQkFDckQ7YUFDSjtRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVELFNBQVMscUJBQXFCLENBQUUsUUFBZTtRQUVqRCxJQUFJLEtBQUssR0FBRyxZQUFZLENBQUMscUJBQXFCLENBQUUsUUFBUSxDQUFFLENBQUM7UUFDM0QsSUFBSSxTQUFTLEdBQUcsRUFBRSxDQUFDO1FBQ25CLElBQUssQ0FBQyxLQUFLLEVBQ1g7WUFDQyxTQUFTLENBQUMsSUFBSSxDQUFFLFFBQVEsQ0FBRSxDQUFDO1NBQzNCO2FBRUQ7WUFDQyxLQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUMvQjtnQkFDQyxJQUFJLE1BQU0sR0FBRyxZQUFZLENBQUMsd0JBQXdCLENBQUUsUUFBUSxFQUFFLENBQUMsQ0FBRSxDQUFDO2dCQUVsRSxTQUFTLENBQUMsSUFBSSxDQUFFLE1BQU0sQ0FBRSxDQUFDO2FBQ3pCO1NBQ0Q7UUFFRCxPQUFPLFNBQVMsQ0FBQztJQUNsQixDQUFDO0lBQUEsQ0FBQztJQUVDLFNBQVMsYUFBYSxDQUFFLFNBQXFCO1FBRXpDLElBQUksTUFBTSxHQUFHLGdCQUFnQixDQUFDLHFCQUFxQixDQUFFLFNBQVMsQ0FBQyxTQUFTLENBQUUsQ0FBQztRQUMzRSxJQUFJLENBQUMsTUFBTSxFQUNYO1lBQ0ksSUFBSSxLQUFLLEdBQUcsZ0JBQWdCLENBQUMscUJBQXFCLENBQUUsZ0JBQWdCLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBYSxDQUFDO1lBRXZHLE1BQU0sR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsU0FBUyxDQUFDLFNBQVMsQ0FBRSxDQUFDO1lBQy9ELE1BQU0sQ0FBQyxrQkFBa0IsQ0FBRSxXQUFXLENBQUUsQ0FBQztZQUN6QyxNQUFNLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxHQUFHLEVBQUU7Z0JBQ3JDLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLE1BQU0sQ0FBRSxLQUFLLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEdBQUcsTUFBTSxLQUFLLEtBQUssQ0FBQyxFQUFFLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdEosSUFBSSxLQUFLLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRSxFQUM1QjtvQkFDSSxDQUFDLENBQUMsYUFBYSxDQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFFLENBQUM7aUJBQ2xEO1lBQ0wsQ0FBQyxDQUFDLENBQUM7WUFFSCxDQUFDLENBQUMsR0FBRyxDQUFFLGtDQUFrQyxHQUFHLFNBQVMsQ0FBQyxTQUFTLEdBQUcsZ0JBQWdCLEdBQUcsU0FBUyxDQUFDLFlBQVksQ0FBRSxDQUFDO1lBQzlHLElBQUksU0FBUyxDQUFDLFlBQVksRUFDMUI7Z0JBQ0ksTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLHFCQUFxQixDQUFFLHFCQUFxQixDQUFhLENBQUM7Z0JBQ2pGLFFBQVEsQ0FBQyx3QkFBd0IsQ0FBRSxPQUFPLEVBQUUsU0FBUyxDQUFDLFlBQVksQ0FBRSxDQUFDO2dCQUNyRSxRQUFRLENBQUMsa0JBQWtCLENBQUUsT0FBTyxFQUFFLFNBQVMsQ0FBQyxZQUFZLENBQUUsQ0FBQzthQUNsRTtZQUVELElBQUssU0FBUyxDQUFDLGFBQWEsRUFDNUI7Z0JBQ0ksSUFBSSxtQkFBbUIsR0FBRyxNQUFNLENBQUMscUJBQXFCLENBQUUsNkJBQTZCLENBQUUsQ0FBQztnQkFDeEYsbUJBQW1CLENBQUMsV0FBVyxDQUFFLFFBQVEsQ0FBRSxDQUFDO2dCQUU1QyxJQUFJLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyx3QkFBd0IsQ0FBRSxRQUFRLENBQUUsU0FBUyxDQUFDLGFBQWEsQ0FBRSxDQUFFLENBQUM7Z0JBQ2hHLGdCQUFnQixHQUFHLElBQUksQ0FBQyxLQUFLLENBQUUsZ0JBQWdCLEdBQUcsQ0FBRSxFQUFFLEdBQUMsSUFBSSxDQUFFLENBQUUsQ0FBQztnQkFDaEUsbUJBQW1CLENBQUMsb0JBQW9CLENBQUUsZUFBZSxFQUFFLGdCQUFnQixDQUFFLENBQUM7Z0JBRTlFLElBQUksUUFBUSxHQUFHLGtDQUFrQztvQkFDN0MsQ0FBRSxDQUFFLGdCQUFnQixHQUFHLENBQUMsQ0FBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBRTtvQkFDM0MsQ0FBRSxTQUFTLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBRSxDQUFDO2dCQUV4RCxRQUFRLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxRQUFRLEVBQUUsbUJBQW1CLENBQUUsQ0FBQztnQkFDdkQsbUJBQW1CLENBQUMsaUJBQWlCLENBQUUsaUJBQWlCLEVBQUUsUUFBUSxDQUFFLENBQUM7YUFDeEU7WUFFRCxNQUFNLENBQUMsS0FBSyxDQUFDLGVBQWUsR0FBRyx1QkFBdUIsR0FBRyxTQUFTLENBQUMsa0JBQWtCLEdBQUcsUUFBUSxDQUFDO1lBQ2pHLE1BQU0sQ0FBQyxLQUFLLENBQUMsa0JBQWtCLEdBQUcsU0FBUyxDQUFDO1lBQzVDLE1BQU0sQ0FBQyxLQUFLLENBQUMsY0FBYyxHQUFHLE9BQU8sQ0FBQztZQUV0QyxJQUFJLFNBQVMsQ0FBQyxRQUFRLEVBQUUsTUFBTSxLQUFLLENBQUMsRUFDcEM7Z0JBQ0ksSUFBSSxTQUFTLENBQUMsYUFBYSxJQUFJLFNBQVMsQ0FBQyxTQUFTLElBQUksU0FBUyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUUsV0FBVyxDQUFFLEVBQ25HO29CQUNJLElBQUksaUJBQWlCLEdBQUksQ0FBQyxDQUFDLFdBQVcsQ0FBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO29CQUNoRSxpQkFBaUIsQ0FBQyxrQkFBa0IsQ0FBRSx1QkFBdUIsQ0FBRSxDQUFDO29CQUNoRSxpQkFBaUIsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO29CQUNsQyxpQkFBaUIsQ0FBQyxlQUFlLEdBQUcsS0FBSyxDQUFDO2lCQUM3QztxQkFFRDtvQkFDTSxNQUFNLENBQUMscUJBQXFCLENBQUUsNkJBQTZCLENBQW1CLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQ25IO2FBQ0o7aUJBQ0ksSUFBSyxTQUFTLENBQUMsUUFBUSxJQUFJLFNBQVMsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsRUFDN0Q7Z0JBQ0ksSUFBSSxVQUFVLEdBQUcsTUFBTSxDQUFDLHFCQUFxQixDQUFFLHlCQUF5QixDQUFFLENBQUM7Z0JBQzNFLElBQUksT0FBaUIsQ0FBQztnQkFFdEIsc0xBQXNMO2dCQUN0TCxNQUFNLGVBQWUsR0FBRyxDQUFDLENBQUUsU0FBUyxDQUFDLGtCQUFrQixLQUFLLFVBQVUsSUFBSSxTQUFTLENBQUMsa0JBQWtCLEtBQUssU0FBUyxDQUFFLElBQUksU0FBUyxDQUFDLFlBQWEsR0FBRyxDQUFDLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hLLElBQUksc0JBQXNCLEdBQUcsQ0FBQyxDQUFFLFNBQVMsQ0FBQyxrQkFBa0IsS0FBSyxVQUFVLElBQUksU0FBUyxDQUFDLGtCQUFrQixLQUFLLFNBQVMsQ0FBRSxJQUFJLGVBQWUsR0FBRyxDQUFDLENBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBRSxDQUFFLFNBQVMsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLGVBQWUsR0FBRyxDQUFDLENBQUUsR0FBRyxlQUFlLENBQUUsQ0FBQSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUU5TyxJQUFJLGFBQWEsR0FBSSxDQUFFLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBRSxDQUFDO2dCQUMvQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO2dCQUNsRCxDQUFDLENBQUMsR0FBRyxDQUFFLHFDQUFxQyxHQUFJLFNBQVMsQ0FBQyxZQUFZLENBQUUsQ0FBQztnQkFFekUsS0FBTSxJQUFJLGNBQWMsR0FBRyxDQUFDLEVBQUUsY0FBYyxHQUFHLHNCQUFzQixFQUFFLEVBQUcsY0FBYyxFQUN4RjtvQkFFSSxLQUFNLElBQUksU0FBUyxHQUFHLENBQUMsRUFBRSxTQUFTLEdBQUcsZUFBZSxFQUFFLEVBQUcsU0FBUyxFQUNsRTt3QkFDSSwyREFBMkQ7d0JBQzNELElBQUksQ0FBRSxTQUFTLENBQUMsa0JBQWtCLEtBQUssVUFBVSxJQUFJLFNBQVMsQ0FBQyxrQkFBa0IsS0FBSyxTQUFTLENBQUUsSUFBSSxTQUFTLENBQUMsWUFBYSxHQUFHLENBQUMsRUFDaEk7NEJBQ0ksSUFBSSxLQUFLLEdBQUcsYUFBYSxDQUFFLENBQUUsQ0FBRSxjQUFjLEdBQUMsc0JBQXNCLENBQUUsR0FBRyxTQUFTLENBQUUsR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFFLENBQUM7NEJBRTlHLElBQUksU0FBUyxLQUFLLENBQUMsRUFDbkI7Z0NBQ0ksT0FBTyxHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUUsT0FBTyxFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUMseUNBQXlDLEVBQUUsQ0FBWSxDQUFDOzZCQUNySDs0QkFFRCxJQUFJLE9BQU8sR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUMsaUJBQWlCLEdBQUUsU0FBUyxFQUFFLENBQWdCLENBQUM7NEJBQzdILE9BQU8sQ0FBQyxXQUFXLENBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxrQkFBa0IsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFFLENBQUE7eUJBQzlGOzZCQUVEOzRCQUNJLElBQUksS0FBSyxHQUFHLGFBQWEsQ0FBRSxjQUFjLENBQUUsQ0FBQzs0QkFDNUMsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsQ0FBaUIsQ0FBQzt5QkFDbEY7cUJBQ0o7aUJBQ0o7YUFDSjtTQUNKO1FBRUMsTUFBTSxDQUFDLHFCQUFxQixDQUFFLGlCQUFpQixDQUFlLENBQUMsV0FBVyxDQUFFLFFBQVEsRUFBRSxDQUFDLE1BQU0sQ0FBQyw0QkFBNEIsQ0FBRSxTQUFTLENBQUUsQ0FBRSxDQUFDO1FBRTVJLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxTQUFTLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUUsQ0FBQztRQUM5RyxNQUFNLENBQUMsaUJBQWlCLENBQUUsUUFBUSxFQUFFLFNBQVMsQ0FBQyxNQUFnQixDQUFFLENBQUM7UUFFakUsT0FBTyxNQUFNLENBQUM7SUFDbEIsQ0FBQztJQUVELElBQUksb0JBQW9CLEdBQWtCLElBQUksQ0FBQztJQUUvQyxTQUFTLGtCQUFrQixDQUFFLFNBQXFCO1FBRTlDLHVFQUF1RTtRQUN2RSxDQUFDLENBQUMsR0FBRyxDQUFFLGlDQUFpQyxHQUFHLFNBQVMsQ0FBQyxTQUFTLENBQUUsQ0FBQztRQUNqRSxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsc0JBQXNCLEVBQUUsSUFBSSxDQUFFLENBQUM7UUFFNUQsSUFBSSxrQkFBa0IsR0FBRyxnQkFBZ0IsQ0FBQyxxQkFBcUIsQ0FBRSw2QkFBNkIsQ0FBRSxDQUFDO1FBQ2pHLElBQUksTUFBTSxHQUFHLGtCQUFrQixDQUFDLHFCQUFxQixDQUFFLFNBQVMsQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFFLENBQUM7UUFFdkYsSUFBSSxDQUFDLE1BQU0sRUFDWDtZQUNJLFlBQVk7WUFDWixNQUFNLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsU0FBUyxDQUFDLFNBQVMsR0FBRyxPQUFPLENBQUUsQ0FBQztZQUNyRixNQUFNLENBQUMsa0JBQWtCLENBQUUsV0FBVyxDQUFFLENBQUM7WUFDekMsTUFBTSxDQUFDLGlCQUFpQixDQUFFLE1BQU0sRUFBRSxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFFLFNBQVMsQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBRSxDQUFDO1lBQzlHLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBRSxZQUFZLEVBQUUsU0FBUyxDQUFDLE1BQWdCLENBQUUsQ0FBQztZQUNyRSxNQUFNLENBQUMsaUJBQWlCLENBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsMEJBQTBCLEdBQUcsQ0FBRSxTQUFTLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFFLEVBQUUsTUFBTSxDQUFDLENBQUUsQ0FBQztZQUM3SixNQUFNLENBQUMsaUJBQWlCLENBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUUsU0FBUyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsMEJBQTBCLENBQUMsQ0FBQyxDQUFDLDBCQUEwQixFQUFFLE1BQU0sQ0FBRSxDQUFFLENBQUM7WUFDaEosTUFBTSxDQUFDLGlCQUFpQixDQUFFLGNBQWMsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLGlDQUFpQyxHQUFHLENBQUUsU0FBUyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBRSxFQUFFLE1BQU0sQ0FBQyxDQUFFLENBQUM7WUFFdkssSUFBSSxXQUFXLEdBQUksTUFBTSxDQUFDLHFCQUFxQixDQUFFLDJCQUEyQixDQUFFLENBQUM7WUFDL0UsSUFBSSxZQUFZLEdBQUksTUFBTSxDQUFDLHFCQUFxQixDQUFFLDRCQUE0QixDQUFFLENBQUM7WUFDakYsZUFBZSxDQUFFLFdBQVcsRUFBRSxZQUFZLEVBQUUsU0FBUyxDQUFFLENBQUM7WUFDeEQsZ0JBQWdCLENBQUUsV0FBVyxFQUFFLFlBQVksRUFBRSxTQUFTLENBQUUsQ0FBQztZQUN6RCxlQUFlLENBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBRSxDQUFDO1lBRXJDLElBQUksZ0JBQWdCLEdBQUcsTUFBTSxDQUFDLHFCQUFxQixDQUFDLHNCQUFzQixDQUFDLENBQUM7WUFFNUUsYUFBYTtZQUNiLFNBQVMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRyxFQUFFO2dCQUMxQyxJQUFJLFVBQVUsR0FBRyxjQUFjLENBQUUsZ0JBQWdCLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBdUIsQ0FBQztnQkFDNUYsSUFBSSxPQUFPLEdBQUcsVUFBVSxDQUFDLFNBQVMsQ0FBRSxvQkFBb0IsQ0FBMkIsQ0FBQztnQkFFcEYsSUFBSSxTQUFTLENBQUMsVUFBVSxLQUFLLE9BQU8sRUFDcEM7b0JBQ0ksVUFBVSxDQUFDLFFBQVEsQ0FBRSxZQUFZLENBQUUsQ0FBQztvQkFDcEMsSUFBSSxlQUFlLEdBQUcsVUFBVSxDQUFDLHFCQUFxQixDQUFFLDBCQUEwQixDQUFFLENBQUM7b0JBRXJGLE9BQU8sR0FBRyxVQUFVLENBQUMscUJBQXFCLENBQUUsa0JBQWtCLENBQTJCLENBQUM7b0JBQUEsQ0FBQztvQkFDM0YsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxHQUFHLEVBQUUsR0FBRSxFQUFFLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFFLGVBQWUsRUFBRSxDQUFDLENBQUUsQ0FBQyxDQUFDO29CQUV4RSxJQUFJLENBQUMsZUFBZSxFQUNwQjt3QkFDSSxlQUFlLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxPQUFPLEVBQUUsVUFBVSxFQUFHLDJCQUEyQixHQUFDLE1BQU0sRUFBRSxFQUFFLEtBQUssRUFBQyx3QkFBd0IsRUFBRSxDQUFDLENBQUM7d0JBQy9ILGVBQWUsQ0FBQyxLQUFLLENBQUMsZUFBZSxHQUFHLHVCQUF1QixHQUFHLFNBQVMsQ0FBQyxrQkFBa0IsR0FBRyxRQUFRLENBQUM7d0JBQzFHLGVBQWUsQ0FBQyxLQUFLLENBQUMsa0JBQWtCLEdBQUcsU0FBUyxDQUFDO3dCQUNyRCxlQUFlLENBQUMsS0FBSyxDQUFDLGNBQWMsR0FBRyxpQkFBaUIsQ0FBQzt3QkFDekQsZUFBZSxDQUFDLEtBQUssQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUM7d0JBRWxELENBQUMsQ0FBQyxXQUFXLENBQUUsT0FBTyxFQUFFLGVBQWUsRUFBRyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUMsNEJBQTRCLEVBQUUsQ0FBQyxDQUFDO3dCQUV0RixJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLHVCQUF1QixFQUFFLE1BQU0sQ0FBRSxDQUFDO3dCQUM5RCxDQUFDLENBQUMsV0FBVyxDQUFFLE9BQU8sRUFBRSxlQUFlLEVBQUcsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFDLCtCQUErQixFQUFFLElBQUksRUFBQyxNQUFNLEVBQUUsSUFBSSxFQUFDLFVBQVUsRUFBQyxDQUFDLENBQUM7d0JBRXRILElBQUksbUJBQW1CLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxPQUFPLEVBQUUsZUFBZSxFQUFHLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBQywrQkFBK0IsRUFBRSxDQUFDLENBQUM7d0JBQ25ILElBQUksY0FBYyxHQUFHLHFCQUFxQixDQUFFLE1BQU0sQ0FBYyxDQUFDO3dCQUVqRSxjQUFjLENBQUMsT0FBTyxDQUFFLENBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRyxFQUFFOzRCQUVsQyxJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFFLFFBQVEsRUFBRSxtQkFBbUIsRUFBRSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUMsbUNBQW1DLEVBQUMsQ0FBRSxDQUFDOzRCQUM5RyxNQUFNLENBQUMsa0JBQWtCLENBQUUscUJBQXFCLENBQUUsQ0FBQzs0QkFFbkQsSUFBSSxPQUFPLEdBQUcsTUFBTSxDQUFDLHFCQUFxQixDQUFFLDhCQUE4QixDQUFpQixDQUFBOzRCQUMzRixJQUFJLFFBQVEsR0FBRyxNQUFNLENBQUMscUJBQXFCLENBQUUsK0JBQStCLENBQWEsQ0FBQzs0QkFFMUYsSUFBSSxFQUFFLEtBQUssR0FBRyxFQUNkO2dDQUNJLE9BQU8sQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO2dDQUVwQixJQUFJLEtBQUssR0FBRyxZQUFZLENBQUMsa0JBQWtCLENBQUUsRUFBRSxDQUFFLENBQUM7Z0NBRWxELElBQUssS0FBSyxFQUNWO29DQUNJLFFBQVEsQ0FBQyxLQUFLLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQztpQ0FDMUM7Z0NBRUQsTUFBTSxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsR0FBRSxFQUFFO29DQUNwQyxDQUFDLENBQUMsYUFBYSxDQUFFLHFCQUFxQixFQUFFLEVBQUUsRUFBRSxNQUFNLENBQUUsQ0FBQztnQ0FDekQsQ0FBQyxDQUFDLENBQUE7NkJBQ0w7aUNBRUQ7Z0NBQ0ksSUFBSSxvQkFBb0IsR0FBRyxZQUFZLENBQUMsMkJBQTJCLENBQUUsTUFBTSxDQUFFLEdBQUcsTUFBTSxDQUFDO2dDQUN2RixPQUFPLENBQUMsUUFBUSxDQUFFLGtCQUFrQixHQUFHLG9CQUFvQixDQUFFLENBQUM7Z0NBQzlELFFBQVEsQ0FBQyxPQUFPLEdBQUUsS0FBSyxDQUFDO2dDQUN4QixNQUFNLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQzs2QkFDMUI7d0JBQ0wsQ0FBQyxDQUFDLENBQUM7cUJBQ047b0JBRUQsT0FBTztpQkFDVjtnQkFFRCxJQUFJLFNBQVMsQ0FBQyxRQUFRLEVBQUUsTUFBTSxLQUFLLENBQUMsRUFDcEM7b0JBQ0ksT0FBTyxHQUFHLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBQyxrQkFBa0IsQ0FBMEIsQ0FBQztvQkFDeEYsSUFBSSxPQUFPLENBQUMsY0FBYyxFQUFFLEVBQzVCO3dCQUNJLE1BQU0sQ0FBQyxZQUFZLEdBQUcsa0JBQWtCLENBQUM7d0JBQ3pDLE1BQU0sQ0FBQyxlQUFlLENBQUUsSUFBSSxDQUFFLENBQUM7cUJBQ2xDO29CQUNELE9BQU87aUJBQ1Y7Z0JBRUQsT0FBTyxDQUFDLGFBQWEsQ0FBRSxDQUFDLENBQUUsQ0FBQztnQkFDM0IsT0FBTyxDQUFDLGFBQWEsQ0FBRSxNQUFNLEVBQUUsRUFBRSxDQUFFLENBQUM7Z0JBQ3BDLE9BQU8sQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO2dCQUN4QixJQUFJLGVBQWUsR0FBRyxFQUFFLENBQUM7Z0JBQ3pCLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBRSxlQUFlLENBQUUsQ0FBQztnQkFFN0MsSUFBSSxjQUFjLEdBQVcsS0FBSyxDQUFDO2dCQUVuQyxJQUFJLFNBQVMsQ0FBQyxTQUFTLEtBQUssZ0RBQWdEO29CQUN4RSxDQUFFLFlBQVksQ0FBQyxrQkFBa0IsQ0FBRSxNQUFNLENBQUUsSUFBSSxXQUFXLElBQUksVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sS0FBSyxxQkFBcUIsQ0FBRTtvQkFDbkgsVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sS0FBSyxjQUFjO29CQUM1QyxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxLQUFLLFlBQVk7b0JBQzFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLEtBQUssWUFBWTtvQkFDMUMsVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sS0FBSyxjQUFjO29CQUM1QyxDQUFFLFNBQVMsQ0FBQyxTQUFTLEtBQUssOENBQThDO3dCQUNwRSxDQUFFLEdBQUcsS0FBSyxDQUFDLElBQUksR0FBRyxLQUFLLEVBQUUsSUFBSSxHQUFHLEtBQUssRUFBRSxJQUFJLEdBQUcsS0FBSyxFQUFFLENBQUUsQ0FBQyxFQUVoRTtvQkFDSSxjQUFjLEdBQUcsSUFBSSxDQUFDO2lCQUN6QjtnQkFFRCxVQUFVLENBQUMsYUFBYSxDQUFFLGFBQWEsRUFBRSxHQUFHLEVBQUU7b0JBRTFDLG9CQUFvQixHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRTt3QkFDeEMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDO3dCQUM1QixvQkFBb0IsQ0FBRSxPQUFPLEVBQUUsU0FBUyxDQUFDLGtCQUFrQixDQUFFLENBQUM7d0JBQzlELE9BQU8sQ0FBQyxpQkFBaUIsQ0FBRSxDQUFDLENBQUUsQ0FBQzt3QkFDL0IsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxFQUFFLEVBQUMsR0FBRSxFQUFFLEdBQUksT0FBTyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUEsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDakQsWUFBWSxDQUFFLGdCQUFnQixFQUFFLFVBQVUsQ0FBRSxDQUFDO3dCQUM3Qyx5QkFBeUIsQ0FBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLGNBQWMsQ0FBRSxDQUFDO29CQUN2RSxDQUFDLENBQUUsQ0FBQztnQkFDUixDQUFDLENBQUMsQ0FBQztnQkFFSCxVQUFVLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxHQUFFLEVBQUU7b0JBQ3hDLHFCQUFxQixDQUFFLE9BQU8sQ0FBRSxDQUFDO29CQUNqQyxZQUFZLENBQUUsZ0JBQWdCLENBQUUsQ0FBQztvQkFDakMsT0FBTyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7b0JBQ3hCLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBRSxlQUFlLENBQUUsQ0FBQztvQkFDN0Msb0JBQW9CLENBQUUsU0FBUyxFQUFFLFVBQVUsQ0FBRSxDQUFDO29CQUU5QyxJQUFLLG9CQUFvQixFQUN6Qjt3QkFDSSxDQUFDLENBQUMsZUFBZSxDQUFFLG9CQUFvQixDQUFFLENBQUM7d0JBQzFDLG9CQUFvQixHQUFHLElBQUksQ0FBQztxQkFDL0I7Z0JBQ0wsQ0FBQyxDQUFDLENBQUM7WUFDUCxDQUFDLENBQUMsQ0FBQTtZQUVGLENBQUMsQ0FBQyxRQUFRLENBQUUsR0FBRyxFQUFFLEdBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBRSxnQkFBZ0IsRUFBRSxTQUFTLENBQUUsQ0FBRSxDQUFDO1NBQ3JFO2FBRUQ7WUFDSSxDQUFDLENBQUMsUUFBUSxDQUFFLEVBQUUsRUFBRSxHQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUUsTUFBTSxDQUFDLHFCQUFxQixDQUFDLHNCQUFzQixDQUFDLEVBQUUsU0FBUyxDQUFFLENBQUUsQ0FBQztZQUVyRyx3REFBd0Q7WUFDeEQsZUFBZSxDQUNYLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBRSwyQkFBMkIsQ0FBRSxFQUMzRCxNQUFNLENBQUMscUJBQXFCLENBQUUsNEJBQTRCLENBQUUsRUFDNUQsU0FBUyxDQUNaLENBQUM7WUFFRixJQUFJLFNBQVMsQ0FBQyxRQUFRLElBQUksU0FBUyxDQUFDLGtCQUFrQixLQUFLLFFBQVEsSUFBSSxTQUFTLENBQUMsUUFBUSxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQ3JHO2dCQUNJLElBQUksYUFBYSxHQUFHLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBYSxDQUFDLENBQUM7Z0JBQ3RGLElBQUksYUFBYSxJQUFJLGFBQWEsQ0FBRSxPQUFPLEVBQUUsRUFDN0M7b0JBQ0ksaUJBQWlCLENBQUMsSUFBSSxDQUFFLGFBQWEsRUFBRSxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFHLENBQUM7aUJBQ25FO2FBQ0o7WUFFRCxJQUFLLFNBQVMsQ0FBQyxRQUFRLEVBQUUsTUFBTSxLQUFLLENBQUMsRUFDckM7Z0JBQ0ksSUFBSSxPQUFPLEdBQUcsTUFBTSxDQUFDLHFCQUFxQixDQUFDLGtCQUFrQixDQUEwQixDQUFDO2dCQUN4RixJQUFJLE9BQU8sQ0FBQyxjQUFjLEVBQUUsRUFDNUI7b0JBQ0ksTUFBTSxDQUFDLFlBQVksR0FBRyxrQkFBa0IsQ0FBQztvQkFDekMsTUFBTSxDQUFDLGVBQWUsQ0FBRSxJQUFJLENBQUUsQ0FBQztvQkFDL0IsT0FBTyxDQUFDLFlBQVksRUFBRSxDQUFDO2lCQUMxQjthQUNKO1NBRUo7UUFFRCx5QkFBeUIsQ0FBRSxrQkFBa0IsRUFBRSxTQUFTLENBQUMsU0FBUyxHQUFHLE9BQU8sQ0FBRSxDQUFDO0lBQ25GLENBQUM7SUFFRCxTQUFTLGtCQUFrQjtRQUV2QixJQUFJLENBQUMsUUFBUSxJQUFJLFFBQVEsS0FBSyxDQUFDLEVBQy9CO1lBQ0ksVUFBVTtZQUNWLE9BQU87U0FDVjtRQUVELElBQUksTUFBTSxHQUFHLFdBQVcsQ0FBQyx3Q0FBd0MsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUU1RSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUMvQjtZQUNJLElBQUksU0FBUyxHQUFHLFdBQVcsQ0FBQyx5Q0FBeUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ2hHLElBQUksa0JBQWtCLEdBQUcsZ0JBQWdCLENBQUMscUJBQXFCLENBQUMsNkJBQTZCLENBQUMsQ0FBQztZQUMvRixJQUFJLE1BQU0sR0FBRyxrQkFBa0IsQ0FBQyxxQkFBcUIsQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFDLENBQUM7WUFDM0UsSUFBSSxNQUFNLEVBQ1Y7Z0JBQ0ksTUFBTSxDQUFDLFdBQVcsQ0FBRSxHQUFHLENBQUUsQ0FBQzthQUM3QjtTQUNKO0lBQ0wsQ0FBQztJQUVELFNBQVMsZUFBZSxDQUFHLFdBQW9CLEVBQUUsWUFBcUIsRUFBRSxTQUFzQjtRQUUxRixJQUFJLFNBQVMsR0FBRyxXQUFXLENBQUMscUJBQXFCLENBQUUsNEJBQTRCLEdBQUUsU0FBUyxDQUFDLFVBQVUsQ0FBRSxDQUFDO1FBQ3hHLElBQUssQ0FBQyxTQUFTLEVBQ2Y7WUFDSSxTQUFTLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLDRCQUE0QixHQUFFLFNBQVMsQ0FBQyxVQUFVLENBQUUsQ0FBQztZQUN2RyxTQUFTLENBQUMsa0JBQWtCLENBQUUsZUFBZSxDQUFFLENBQUM7U0FDbkQ7UUFFRCxJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUUsbUJBQW1CLENBQUUsQ0FBQztRQUNqRixTQUFTLENBQUMsaUJBQWlCLENBQUUsTUFBTSxFQUFFLFlBQVksQ0FBQyxXQUFXLENBQUUsUUFBUSxDQUFFLENBQUMsQ0FBQztRQUMzRSxTQUFTLENBQUMsb0JBQW9CLENBQUUsV0FBVyxFQUFFLFFBQVEsQ0FBQyxzQkFBc0IsRUFBRSxDQUFDLENBQUM7UUFFaEYsU0FBUyxDQUFDLE9BQU8sR0FBRyxDQUFDLFNBQVMsQ0FBQyxNQUFnQixLQUFLLFNBQVM7WUFDekQsU0FBUyxDQUFDLE1BQWdCLEtBQUssRUFBRTtZQUNqQyxTQUFTLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTztZQUN4QixDQUFFLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLElBQUksUUFBUSxDQUFFLFNBQVMsQ0FBQyxNQUFnQixDQUFFLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztRQUUzRixTQUFTLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxHQUFHLEVBQUU7WUFDeEMsV0FBVyxDQUFDLFdBQVcsQ0FBRSxRQUFRLEVBQUUsSUFBSSxDQUFFLENBQUM7WUFDMUMsWUFBWSxDQUFDLFdBQVcsQ0FBRSxRQUFRLEVBQUUsS0FBSyxDQUFFLENBQUM7WUFDNUMsWUFBWSxDQUFDLHFCQUFxQixDQUFFLCtCQUErQixDQUFFLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztZQUNyRixZQUFZLENBQUMscUJBQXFCLENBQUUsOEJBQThCLENBQUUsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBRXBGLFlBQVksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSwyQkFBMkIsQ0FBRSxDQUFDLFdBQVcsQ0FBRSxRQUFRLEVBQUUsSUFBSSxDQUFFLENBQUM7UUFDaEgsQ0FBQyxDQUFDLENBQUM7UUFFSCxTQUFTLENBQUMsYUFBYSxDQUFFLGFBQWEsRUFBRSxHQUFHLEVBQUU7WUFDekMsSUFBSSxZQUFZLEdBQUcsY0FBYyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFFLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFFLFNBQVMsQ0FBQyxNQUFPLENBQUUsQ0FBRSxHQUFHLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNJLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBRSxjQUFjLEVBQUUsWUFBWSxDQUFFLENBQUM7WUFFL0QsSUFBSSxVQUFVLEdBQUcsQ0FBRSxjQUFjLEdBQUcsQ0FBQyxDQUFFLENBQUMsQ0FBQyxDQUFDLGtDQUFrQyxDQUFDLENBQUM7Z0JBQzFFLFlBQVksR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUUsbUNBQW1DLEVBQUUsU0FBUyxDQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUV6RixJQUFJLFVBQVUsS0FBSyxFQUFFLEVBQ3JCO2dCQUNJLE9BQU87YUFDVjtZQUVELFlBQVksQ0FBQyxlQUFlLENBQUUsU0FBUyxDQUFDLEVBQUUsRUFBRSxVQUFVLENBQUUsQ0FBQztRQUM3RCxDQUFDLENBQUMsQ0FBQztRQUVILFNBQVMsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLEdBQUcsRUFBRTtZQUN4QyxZQUFZLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDbkMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLFNBQVMsQ0FBQyxZQUFZLEVBQzFCO1lBQ0ksTUFBTSxPQUFPLEdBQUcsV0FBVyxDQUFDLHFCQUFxQixDQUFFLDRCQUE0QixDQUFZLENBQUM7WUFDNUYsUUFBUSxDQUFDLHdCQUF3QixDQUFFLE9BQU8sRUFBRSxTQUFTLENBQUMsWUFBWSxDQUFFLENBQUM7WUFDckUsUUFBUSxDQUFDLGtCQUFrQixDQUFFLE9BQU8sRUFBRSxTQUFTLENBQUMsWUFBWSxDQUFFLENBQUM7U0FDbEU7UUFFRCxrQkFBa0IsQ0FBRSxXQUFXLEVBQUUsWUFBWSxDQUFFLENBQUM7UUFFaEQsSUFBSyxTQUFTLENBQUMsYUFBYSxJQUFJLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLElBQUksU0FBUyxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sR0FBRyxDQUFDLEVBQ3hGO1lBQ0ksU0FBUyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDekIsU0FBUyxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsR0FBRyxFQUFFO2dCQUN4QyxNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUUsU0FBUyxDQUFDLGFBQWMsQ0FBRSxDQUFDO2dCQUM1RCxNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUUsU0FBUyxDQUFDLGFBQWMsQ0FBRSxDQUFDO2dCQUM1RCxNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUUsU0FBUyxDQUFDLGFBQWMsQ0FBRSxDQUFDO2dCQUU1RCxNQUFNLG1CQUFtQixHQUFHLFFBQVEsQ0FBQyx3QkFBd0IsQ0FBRSxjQUFjLENBQUUsQ0FBQztnQkFDaEYsSUFBSyxtQkFBbUIsSUFBSSxDQUFDLEVBQzdCO29CQUNJLFlBQVksQ0FBQyxnQ0FBZ0MsQ0FBRSxTQUFTLENBQUMsT0FBUSxFQUM3RCw0QkFBNEIsRUFBRSxFQUFFLEVBQ2hDLFFBQVEsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQ25CLEtBQUssQ0FBRSxDQUFDO29CQUNaLE9BQU87aUJBQ1Y7Z0JBRUQsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFFLG1CQUFtQixHQUFHLGNBQWMsQ0FBRSxDQUFDO2dCQUMvRSxNQUFNLGVBQWUsR0FBRyxjQUFjLEdBQUcsQ0FBRSxtQkFBbUIsR0FBRyxDQUFDLENBQUUsR0FBQyxjQUFjLENBQUM7Z0JBQ3BGLE1BQU0sdUJBQXVCLEdBQUcsQ0FBRSxjQUFjLEdBQUcsbUJBQW1CLENBQUUsR0FBRyxlQUFlLENBQUM7Z0JBQzNGLElBQUssQ0FBRSx1QkFBdUIsSUFBSSxjQUFjLENBQUU7dUJBQzNDLENBQUUsdUJBQXVCLElBQUksY0FBYyxDQUFFLEVBQ3BEO29CQUNJLE1BQU0sMkJBQTJCLEdBQUcsY0FBYyxHQUFHLENBQ2pELENBQUUsdUJBQXVCLElBQUksY0FBYyxDQUFFO3dCQUM3QyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyx1QkFBdUIsQ0FBRSxDQUFDO29CQUNwQyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFFLDJCQUEyQixHQUFHLElBQUksQ0FBRSxHQUFHLENBQUMsQ0FBQztvQkFDdEUsU0FBUyxDQUFDLG9CQUFvQixDQUFFLHVCQUF1QixFQUFFLFFBQVEsQ0FBRSxDQUFDO29CQUNwRSxZQUFZLENBQUMsZ0NBQWdDLENBQUUsU0FBUyxDQUFDLE9BQVEsRUFDN0QsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxnQ0FBZ0MsRUFBRSxTQUFTLENBQUUsRUFBRSxFQUFFLEVBQzdELFFBQVEsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQ25CLEtBQUssQ0FBRSxDQUFDO29CQUNaLE9BQU87aUJBQ1Y7Z0JBRUQsSUFBSyxTQUFTLENBQUMsS0FBSyxJQUFJLENBQUUsQ0FBRSxTQUFTLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBRSxLQUFLLENBQUMsQ0FBRSxFQUN6RDtvQkFDSSxNQUFNLFNBQVMsR0FBRyxZQUFZLENBQUMsWUFBWSxFQUFFLENBQUM7b0JBQzlDLElBQUssU0FBUyxFQUNkO3dCQUNJLFlBQVksQ0FBQyxnQ0FBZ0MsQ0FBRSxTQUFTLENBQUMsT0FBUSxFQUM3RCw2QkFBNkIsRUFBRSxFQUFFLEVBQ2pDLFFBQVEsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQ25CLEtBQUssQ0FBRSxDQUFDO3dCQUNaLE9BQU87cUJBQ1Y7aUJBQ0o7Z0JBRUQsdURBQXVEO2dCQUN2RCxXQUFXLENBQUMsV0FBVyxDQUFFLFFBQVEsRUFBRSxJQUFJLENBQUUsQ0FBQztnQkFDMUMsWUFBWSxDQUFDLFdBQVcsQ0FBRSxRQUFRLEVBQUUsS0FBSyxDQUFFLENBQUM7Z0JBQzVDLFlBQVksQ0FBQyxxQkFBcUIsQ0FBRSwrQkFBK0IsQ0FBRSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7Z0JBQ3JGLFlBQVksQ0FBQyxxQkFBcUIsQ0FBRSw4QkFBOEIsQ0FBRSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7Z0JBRXBGLFNBQVMsQ0FBQyxxQkFBcUIsR0FBRyxDQUFDLENBQUMsQ0FBQSw2RUFBNkU7Z0JBRWpILHlDQUF5QztnQkFDekMsSUFBSSxhQUFhLEdBQVksSUFBSSxDQUFDO2dCQUNsQyxNQUFNLE9BQU8sR0FBRyxZQUFZLENBQUMseUJBQXlCLENBQUUsWUFBWSxDQUFFLENBQUM7Z0JBQ3ZFLEtBQU0sSUFBSSxJQUFJLEdBQUcsQ0FBQyxFQUFFLElBQUksR0FBRyxPQUFPLEVBQUUsRUFBRyxJQUFJLEVBQzNDO29CQUNJLE1BQU0sTUFBTSxHQUFHLFlBQVksQ0FBQyw2QkFBNkIsQ0FBRSxZQUFZLEVBQUUsSUFBSSxDQUFFLENBQUM7b0JBQ2hGLElBQUssTUFBTSxDQUFDLFdBQVcsSUFBSSxRQUFRLEVBQUcsOEZBQThGO3FCQUNwSTt3QkFDSSxTQUFTLENBQUMscUJBQXFCLEdBQUcsTUFBTSxDQUFDLGFBQWEsQ0FBQzt3QkFDdkQsYUFBYSxHQUFHLEtBQUssQ0FBQzt3QkFDdEIsTUFBTTtxQkFDVDtpQkFDSjtnQkFFRCxnQ0FBZ0M7Z0JBQ2hDLElBQUksb0JBQW9CLEdBQUcsR0FBRyxFQUFFO29CQUM1QixZQUFZLENBQUMsaUJBQWlCLENBQUUsWUFBWSxFQUFFLEVBQUUsR0FBQyxTQUFTLENBQUMscUJBQXFCLENBQUUsQ0FBQztvQkFDbkYsWUFBWSxDQUFDLGlCQUFpQixDQUFFLGNBQWMsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUN0RCxDQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUMsaUNBQWlDLENBQUMsQ0FBQyxDQUFDLGdDQUFnQyxDQUFFOzBCQUN0RixDQUFFLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUUsRUFBRSxZQUFZLENBQUUsQ0FBRSxDQUFDO29CQUV6RixZQUFZLENBQUMscUJBQXFCLENBQUUsK0JBQStCLENBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQWMsQ0FBQyxJQUFJOzBCQUNqRyxDQUFDLENBQUMsUUFBUSxDQUFFLENBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQyx5Q0FBeUMsQ0FBQyxDQUFDLENBQUMsd0NBQXdDLENBQUUsRUFDbEgsWUFBWSxDQUFFLENBQUM7Z0JBQzNCLENBQUMsQ0FBQztnQkFFRix3QkFBd0I7Z0JBQ3hCLElBQUksV0FBVyxHQUFHLFlBQVksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSwyQkFBMkIsQ0FBRSxDQUFDO2dCQUNoRyxJQUFLLGFBQWEsSUFBSSxTQUFTLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxHQUFHLENBQUMsRUFDbEQ7b0JBQ0ksV0FBVyxDQUFDLGlCQUFpQixDQUFFLFlBQVksRUFBRSxFQUFFLENBQUUsQ0FBQztvQkFDbEQsV0FBVyxDQUFDLG9CQUFvQixDQUFFLFlBQVksRUFBRSxDQUFDLENBQUUsQ0FBQztvQkFDcEQsV0FBVyxDQUFDLFdBQVcsQ0FBRSxRQUFRLEVBQUUsS0FBSyxDQUFFLENBQUM7b0JBRTNDLElBQUksV0FBVyxHQUFHLFdBQVcsQ0FBQyxxQkFBcUIsQ0FBRSxzQkFBc0IsQ0FBYyxDQUFDO29CQUMxRixXQUFXLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztvQkFDcEIsV0FBVyxDQUFDLEdBQUcsR0FBRyxTQUFTLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFDO29CQUMzQyxXQUFXLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQztvQkFDMUIsV0FBVyxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUM7b0JBQ3hCLFdBQVcsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO29CQUV0QixXQUFXLENBQUMsYUFBYSxDQUFFLGdCQUFnQixFQUFFLEdBQUcsRUFBRTt3QkFDOUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBRSxXQUFXLENBQUMsS0FBSyxDQUFFLENBQUM7d0JBQzFDLFNBQVMsQ0FBQyxxQkFBcUIsR0FBRyxDQUFDLENBQUM7d0JBQ3BDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBRSxZQUFZLEVBQUUsQ0FBQyxDQUFFLENBQUM7d0JBQ3BELG9CQUFvQixFQUFFLENBQUM7b0JBQzNCLENBQUMsQ0FBRSxDQUFDO29CQUVGLFdBQVcsQ0FBQyxxQkFBcUIsQ0FBRSwyQkFBMkIsQ0FBb0IsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLEdBQUcsRUFBRTt3QkFDbkgsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBRSxXQUFXLENBQUMsS0FBSyxDQUFFLENBQUM7d0JBQzFDLElBQUssQ0FBQyxHQUFHLENBQUM7NEJBQ04sV0FBVyxDQUFDLEtBQUssR0FBRyxDQUFFLENBQUMsR0FBRyxDQUFDLENBQUUsQ0FBQztvQkFDdEMsQ0FBQyxDQUFFLENBQUM7b0JBRUYsV0FBVyxDQUFDLHFCQUFxQixDQUFFLDJCQUEyQixDQUFvQixDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsR0FBRyxFQUFFO3dCQUNuSCxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFFLFdBQVcsQ0FBQyxLQUFLLENBQUUsQ0FBQzt3QkFDMUMsSUFBSyxDQUFDLEdBQUcsU0FBUyxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU87NEJBQzdCLFdBQVcsQ0FBQyxLQUFLLEdBQUcsQ0FBRSxDQUFDLEdBQUcsQ0FBQyxDQUFFLENBQUM7b0JBQ3RDLENBQUMsQ0FBRSxDQUFDO2lCQUNQO3FCQUVEO29CQUNJLFdBQVcsQ0FBQyxXQUFXLENBQUUsUUFBUSxFQUFFLElBQUksQ0FBRSxDQUFDO2lCQUM3QztnQkFFRCxvQkFBb0IsRUFBRSxDQUFDO2dCQUV2QiwwR0FBMEc7Z0JBQzFHLElBQUssQ0FBQyxhQUFhO29CQUNmLFNBQVMsQ0FBQyxxQkFBcUIsR0FBRyxDQUFDLFNBQVMsQ0FBQyxxQkFBc0IsQ0FBQztZQUM1RSxDQUFDLENBQUMsQ0FBQztTQUNOO0lBQ0wsQ0FBQztJQUVELFNBQVMsZ0JBQWdCLENBQUcsV0FBb0IsRUFBRSxZQUFxQixFQUFFLFNBQXNCO1FBRTNGLFlBQVksQ0FBQyxxQkFBcUIsQ0FBRSw4QkFBOEIsQ0FBRSxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsR0FBRyxFQUFFO1lBQ25HLGtCQUFrQixDQUFFLFdBQVcsRUFBRSxZQUFZLENBQUUsQ0FBQztRQUNwRCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksU0FBUyxDQUFDLFlBQVksRUFDMUI7WUFDSSxNQUFNLE9BQU8sR0FBRyxZQUFZLENBQUMscUJBQXFCLENBQUUsNkJBQTZCLENBQVksQ0FBQztZQUM5RixRQUFRLENBQUMsd0JBQXdCLENBQUUsT0FBTyxFQUFFLFNBQVMsQ0FBQyxZQUFZLENBQUUsQ0FBQztZQUNyRSxRQUFRLENBQUMsa0JBQWtCLENBQUUsT0FBTyxFQUFFLFNBQVMsQ0FBQyxZQUFZLENBQUUsQ0FBQztTQUNsRTtRQUVELFlBQVksQ0FBQyxxQkFBcUIsQ0FBRSwrQkFBK0IsQ0FBRSxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsR0FBRyxFQUFFO1lBQ3BHLFlBQVksQ0FBQywwQkFBMEIsQ0FBRSxjQUFjLEVBQUUsS0FBSyxFQUFFLGlCQUFpQixFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUUsQ0FBQztZQUM1RixJQUFLLFlBQVksQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRztnQkFDbkUsWUFBWSxDQUFDLGtCQUFrQixDQUMzQixDQUFDLENBQUMsUUFBUSxDQUFFLDJDQUEyQyxDQUFFLEVBQ3pELENBQUMsQ0FBQyxRQUFRLENBQUUsMkJBQTJCLENBQUUsRUFDekMsRUFBRSxFQUNGLEdBQUcsRUFBRSxHQUFFLENBQUMsQ0FDWCxDQUFDO2dCQUNGLE9BQU87YUFDVjtZQUVELFdBQVcsQ0FBQywwQkFBMEIsQ0FBRSxRQUFRLEVBQUUsU0FBUyxDQUFDLFVBQW9CLEVBQzVFLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxxQkFBc0IsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFFLFNBQVMsQ0FBQyxNQUFPLENBQUUsQ0FBRSxDQUFDO1lBQ2pHLFlBQVksQ0FBQyxxQkFBcUIsQ0FBRSwrQkFBK0IsQ0FBRSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7WUFDdEYsWUFBWSxDQUFDLHFCQUFxQixDQUFFLDhCQUE4QixDQUFFLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztZQUVyRixDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsV0FBVyxDQUFFLG9CQUFvQixFQUFFLElBQUksQ0FBRSxDQUFDO1lBQzlELHFCQUFxQixFQUFFLENBQUM7WUFDeEIsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxxQkFBcUIsRUFBRSxrQkFBa0IsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUVwRSwyQkFBMkIsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFFLENBQUMsRUFBRSxHQUFHLEVBQUU7Z0JBQzlDLENBQUMsQ0FBQyxhQUFhLENBQUUsV0FBVyxFQUFFLFlBQVksQ0FBQyxxQkFBcUIsQ0FBRSw4QkFBOEIsQ0FBRSxFQUFFLE9BQU8sQ0FBRSxDQUFDO2dCQUM5RyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsV0FBVyxDQUFFLG9CQUFvQixFQUFFLEtBQUssQ0FBRSxDQUFDO2dCQUMvRCxvQkFBb0IsRUFBRSxDQUFDO2dCQUV2QixvRUFBb0U7Z0JBQ3BFLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO2dCQUNwRixDQUFDLENBQUMsYUFBYSxDQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFFLENBQUM7Z0JBRS9DLCtEQUErRDtnQkFDL0QsWUFBWSxDQUFDLGtCQUFrQixDQUMzQixDQUFDLENBQUMsUUFBUSxDQUFFLGlDQUFpQyxDQUFFLEVBQy9DLENBQUMsQ0FBQyxRQUFRLENBQUUsK0JBQStCLENBQUUsRUFDN0MsRUFBRSxFQUNGLEdBQUcsRUFBRSxHQUFFLENBQUMsQ0FDWCxDQUFDO1lBQ04sQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRCxTQUFTLGtCQUFrQixDQUFFLFdBQW9CLEVBQUUsWUFBcUI7UUFFcEUsV0FBVyxDQUFDLFdBQVcsQ0FBRSxRQUFRLEVBQUUsS0FBSyxDQUFFLENBQUM7UUFDM0MsWUFBWSxDQUFDLFdBQVcsQ0FBRSxRQUFRLEVBQUUsSUFBSSxDQUFFLENBQUM7UUFDM0MsWUFBWSxDQUFDLFNBQVMsRUFBRSxDQUFDLHFCQUFxQixDQUFFLDJCQUEyQixDQUFFLENBQUMsV0FBVyxDQUFFLFFBQVEsRUFBRSxJQUFJLENBQUUsQ0FBQztJQUNoSCxDQUFDO0lBRUQsU0FBUyxlQUFlLENBQUUsTUFBYyxFQUFFLFNBQXFCO1FBRTNELElBQUksV0FBVyxHQUFHLEVBQUUsQ0FBQztRQUNyQixJQUFJLFNBQVMsR0FBRyxNQUFNLENBQUMscUJBQXFCLENBQUMsd0JBQXdCLENBQUMsQ0FBQztRQUN2RSxTQUFTLENBQUMsV0FBVyxDQUFFLFFBQVEsRUFBRSxJQUFJLENBQUUsQ0FBQztRQUV4QyxJQUFJLFNBQVMsQ0FBQyxVQUFVLEtBQUssT0FBTyxFQUNwQztZQUNJLE9BQU87U0FDVjtRQUVELElBQUksU0FBUyxDQUFDLFFBQVEsRUFDdEI7WUFDSSxJQUFJLEtBQUssR0FBRyxZQUFZLENBQUMsMEJBQTBCLENBQUUsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMvRSxNQUFNLENBQUMsaUJBQWlCLENBQUUsU0FBUyxFQUFFLFlBQVksQ0FBQyxXQUFXLENBQUUsS0FBSyxDQUFFLENBQUMsQ0FBQztZQUN4RSxNQUFNLENBQUMsaUJBQWlCLENBQUUsVUFBVSxFQUFFLFlBQVksQ0FBQyxXQUFXLENBQUUsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDLENBQUM7U0FDNUY7UUFFRCxXQUFXLEdBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBRSxxQkFBcUIsRUFBRSxNQUFNLENBQUcsQ0FBQztRQUU1RCxTQUFTLENBQUMsV0FBVyxDQUFFLFFBQVEsRUFBRSxLQUFLLENBQUUsQ0FBQztRQUN6QyxNQUFNLENBQUMsaUJBQWlCLENBQUUsU0FBUyxFQUFFLFdBQVcsQ0FBRSxDQUFDO0lBRXZELENBQUM7SUFFRCxTQUFTLHFCQUFxQjtRQUUxQixNQUFNLFVBQVUsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUMseUJBQXlCLENBQXlCLENBQUM7UUFDaEgsTUFBTSxNQUFNLEdBQUcsQ0FBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBRSxDQUFDO1FBQy9CLFVBQVUsQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUM1QixVQUFVLENBQUMsZUFBZSxDQUFFLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RFLENBQUM7SUFFRCxTQUFTLG9CQUFvQjtRQUV6QixNQUFNLFVBQVUsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUMseUJBQXlCLENBQXlCLENBQUM7UUFFaEgsSUFBSSxVQUFVLEtBQUssSUFBSSxFQUN2QjtZQUNJLFVBQVUsQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO1NBQ3pDO0lBQ0wsQ0FBQztJQUVELFNBQVMsb0JBQW9CLENBQUUsT0FBNkIsRUFBRSxxQkFBNEIsRUFBRTtRQUV4RixJQUFJLGtCQUFrQixLQUFLLFNBQVMsRUFDcEM7WUFDSSxPQUFPLENBQUMsaUJBQWlCLENBQUcsRUFBRSxFQUFFLEVBQUUsQ0FBRSxDQUFDO1NBQ3hDO2FBQ0c7WUFDQSxPQUFPLENBQUMsaUJBQWlCLENBQUcsR0FBRyxFQUFFLEdBQUcsQ0FBRSxDQUFDO1NBQzFDO1FBQ0QsT0FBTyxDQUFDLG1CQUFtQixDQUFHLEVBQUUsRUFBRSxFQUFFLENBQUUsQ0FBQztRQUN2QyxPQUFPLENBQUMsbUJBQW1CLENBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0lBQ3pDLENBQUM7SUFFRCxTQUFTLHFCQUFxQixDQUFFLE9BQTZCO1FBRXpELE9BQU8sQ0FBQyxpQkFBaUIsQ0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7UUFDbkMsT0FBTyxDQUFDLG1CQUFtQixDQUFHLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztRQUNyQyxPQUFPLENBQUMsbUJBQW1CLENBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO1FBQ3JDLE9BQU8sQ0FBQyxXQUFXLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztJQUNuQyxDQUFDO0lBRUQsU0FBUyx5QkFBeUIsQ0FBRSxTQUFxQixFQUFFLFVBQWtCLEVBQUUsY0FBc0I7UUFFakcsSUFBSSxTQUFTLEdBQUcsU0FBUyxDQUFDLFVBQW9CLENBQUM7UUFDL0MsSUFBSSxVQUFVLEdBQUcsU0FBUyxDQUFDLFdBQXFCLENBQUE7UUFDaEQsSUFBSSxTQUFTLEdBQUcsY0FBYyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsR0FBRyxHQUFHLENBQUM7UUFDN0QsSUFBSSxVQUFVLEdBQUcsVUFBVSxHQUFHLEdBQUcsQ0FBQztRQUVsQyxVQUFVLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxVQUFVLEdBQUcsSUFBSSxDQUFDO1FBQzVDLFVBQVUsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLFNBQVMsR0FBRyxJQUFJLENBQUM7UUFFMUMsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBRSxVQUFVLENBQUMsYUFBYSxHQUFHLFVBQVUsQ0FBQyxlQUFlLENBQUUsQ0FBQztRQUNuRixJQUFJLGlCQUFpQixHQUFHLFNBQVMsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRSxTQUFTLEdBQUcsQ0FBQyxDQUFFLENBQUM7UUFDeEUsSUFBSSxVQUFVLEdBQUcsRUFBRSxDQUFFO1FBQ3JCLElBQUksaUJBQWlCLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBRSxnQkFBZ0IsQ0FBQyxpQkFBaUIsR0FBQyxnQkFBZ0IsQ0FBQyxlQUFlLENBQUUsQ0FBQztRQUMxRyxJQUFJLGVBQWUsR0FBRyxDQUFDLENBQUM7UUFFeEIsSUFBSSxRQUFRLEdBQUcsaUJBQWlCLEdBQUcsZ0JBQWdCLENBQUMsYUFBYSxHQUFDLGdCQUFnQixDQUFDLGVBQWUsRUFBRyxxQkFBcUI7U0FDMUg7WUFDSSxlQUFlLEdBQUcsQ0FBQyxDQUFFLFFBQVEsQ0FBRSxHQUFHLFVBQVUsQ0FBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1NBQ3ZEO2FBQ0ksSUFBSSxDQUFDLENBQUUsUUFBUSxHQUFHLGlCQUFpQixDQUFFLEdBQUksU0FBUyxDQUFFLEdBQUcsaUJBQWlCLEVBQUcscUJBQXFCO1NBQ3JHO1lBQ0ksZUFBZSxHQUFHLENBQUUsUUFBUSxHQUFHLENBQUUsaUJBQWlCLEdBQUcsQ0FBRSxTQUFTLEdBQUcsVUFBVSxDQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1NBQzNGO2FBRUQ7WUFDSSxlQUFlLEdBQUcsaUJBQWlCLEdBQUcsQ0FBQyxDQUFDLENBQUM7U0FDNUM7UUFFRCxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFFLFVBQVUsQ0FBQyxhQUFhLEdBQUcsVUFBVSxDQUFDLGVBQWUsQ0FBRSxDQUFDO1FBQ25GLElBQUksaUJBQWlCLEdBQUcsQ0FBRSxVQUFVLEdBQUMsQ0FBQyxDQUFFLENBQUM7UUFDekMsSUFBSSxlQUFlLEdBQUcsQ0FBQyxDQUFDO1FBQ3hCLElBQUksa0JBQWtCLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBRSxnQkFBZ0IsQ0FBQyxrQkFBa0IsR0FBQyxnQkFBZ0IsQ0FBQyxlQUFlLENBQUUsQ0FBQztRQUM1RyxJQUFJLFlBQVksR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFBLENBQUMsa0NBQWtDO1FBQzdELElBQUksU0FBUyxHQUFHLEVBQUUsQ0FBQSxDQUFDLG1CQUFtQjtRQUV0QyxJQUFHLENBQUUsUUFBUSxHQUFHLFVBQVUsQ0FBRSxHQUFHLENBQUUsa0JBQWtCLEdBQUcsWUFBWSxDQUFFLEVBQUUsdUJBQXVCO1NBQzdGO1lBQ0ksZUFBZSxHQUFHLENBQUUsUUFBUSxHQUFHLENBQUUsa0JBQWtCLEdBQUcsVUFBVSxDQUFFLENBQUMsR0FBRyxZQUFZLENBQUM7U0FDdEY7YUFDSSxJQUFJLENBQUUsUUFBUSxHQUFHLFVBQVUsR0FBQyxDQUFDLENBQUUsR0FBRyxTQUFTLEVBQ2hEO1lBQ0ksZUFBZSxHQUFJLENBQUMsQ0FBQztTQUN4QjthQUVEO1lBQ0ksZUFBZSxHQUFHLGlCQUFpQixDQUFDO1NBQ3ZDO1FBRUQsVUFBVSxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsYUFBYSxHQUFDLGVBQWUsR0FBQyxpQkFBaUIsR0FBRyxDQUFFLGVBQWUsR0FBRyxDQUFDLENBQUMsQ0FBRSxHQUFHLEtBQUssQ0FBQztJQUNwSCxDQUFDO0lBRUQsU0FBUyxvQkFBb0IsQ0FBRSxTQUFxQixFQUFFLFVBQWtCO1FBRXBFLFVBQVUsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLENBQUUsU0FBUyxDQUFDLFVBQVUsQ0FBRSxHQUFHLElBQWMsQ0FBQztRQUNuRSxVQUFVLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFFLFNBQVMsQ0FBQyxXQUFXLENBQUUsR0FBRyxJQUFjLENBQUM7UUFFckUsVUFBVSxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsaUNBQWlDLENBQUM7SUFDbkUsQ0FBQztJQUVELFNBQVMsVUFBVSxDQUFFLGdCQUF3QixFQUFFLFNBQXFCO1FBRWhFLElBQUksU0FBUyxDQUFDLFFBQVEsRUFBRSxNQUFNLEtBQUssQ0FBQyxFQUNwQztZQUNJLE9BQU87U0FDVjtRQUVELElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztRQUNkLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQztRQUNmLE1BQU0sU0FBUyxHQUFHLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzlDLE1BQU0sWUFBWSxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUM7UUFDdEMsTUFBTSxXQUFXLEdBQUcsU0FBUyxDQUFDLGtCQUFrQixLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsa0JBQWtCLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2SCxNQUFNLGVBQWUsR0FBRyxrQkFBa0IsQ0FBRSxZQUFZLEVBQUUsV0FBVyxDQUFFLENBQUM7UUFDeEUsTUFBTSxVQUFVLEdBQUcsZUFBZSxDQUFDLElBQUksQ0FBQztRQUN4QyxNQUFNLFFBQVEsR0FBSSxlQUFlLENBQUMsSUFBSSxDQUFDO1FBQ3ZDLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBRSxnQkFBZ0IsQ0FBQyxpQkFBaUIsR0FBRyxnQkFBZ0IsQ0FBQyxlQUFlLENBQUUsQ0FBQztRQUM5RyxNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxLQUFLLENBQUUsZ0JBQWdCLENBQUMsa0JBQWtCLEdBQUcsZ0JBQWdCLENBQUMsZUFBZSxDQUFFLENBQUM7UUFDaEgsTUFBTSxTQUFTLEdBQUcsU0FBUyxDQUFDLFVBQW9CLENBQUM7UUFDakQsTUFBTSxVQUFVLEdBQUcsU0FBUyxDQUFDLFdBQXFCLENBQUM7UUFDbkQsTUFBTSxPQUFPLEdBQUcsQ0FBRSxpQkFBaUIsR0FBRyxDQUFFLFNBQVMsR0FBSSxRQUFRLENBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNyRSxNQUFNLE9BQU8sR0FBRyxDQUFFLGtCQUFrQixHQUFHLENBQUUsVUFBVSxHQUFHLFVBQVUsQ0FBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRXhFLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBRSxPQUFPLEVBQUUsR0FBRyxFQUFHLEVBQUU7WUFDakMsSUFBSSxHQUFHLEdBQUcsUUFBUSxLQUFLLENBQUMsRUFDeEI7Z0JBQ0ksTUFBTSxHQUFHLFVBQVUsR0FBRyxLQUFLLENBQUM7Z0JBQzVCLEtBQUssRUFBRSxDQUFDO2FBQ1g7WUFFRCxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFFLEdBQUcsR0FBRyxRQUFRLEdBQUcsU0FBUyxDQUFFLEdBQUcsT0FBTyxHQUFDLElBQUksQ0FBQztZQUNoRSxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFFLE1BQU0sR0FBRyxPQUFPLENBQUUsR0FBRyxJQUFJLENBQUM7UUFDbEQsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQsU0FBUyxrQkFBa0IsQ0FBRSxZQUFtQixFQUFFLFNBQWdCO1FBRTlELE1BQU0sT0FBTyxHQUFVLENBQUMsQ0FBQztRQUV6QixJQUFJLFlBQVksSUFBSSxFQUFFLEVBQ3RCO1lBQ0ksQ0FBQyxDQUFDLEdBQUcsQ0FBRSxpREFBaUQsQ0FBRSxDQUFDO1lBQzNELE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsQ0FBQztTQUM3QztRQUVBLDZEQUE2RDtRQUM5RCxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ25FLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxDQUFDO1FBRTFDLDREQUE0RDtRQUM1RCxJQUFJLElBQUksR0FBRyxPQUFPLEVBQUU7WUFDaEIsSUFBSSxHQUFHLE9BQU8sQ0FBQztZQUNmLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsQ0FBQztTQUN6QztRQUVELE9BQU8sRUFBRSxJQUFJLEVBQUMsSUFBSSxFQUFHLElBQUksRUFBQyxJQUFJLEVBQUUsQ0FBQztJQUNyQyxDQUFDO0lBRUQsU0FBUyxjQUFjLENBQUUsZ0JBQXdCLEVBQUUsTUFBYyxFQUFFLFNBQXFCO1FBRXBGLElBQUksTUFBTSxHQUFHLDRCQUE0QixDQUFDO1FBQzFDLElBQUksT0FBTyxHQUFHLFNBQVMsQ0FBQyxRQUFRLEVBQUUsTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUUsc0JBQXNCLENBQUUsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDO1FBQzVJLElBQUksT0FBTyxHQUFJLENBQUMsQ0FBQyxXQUFXLENBQUUsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxFQUFFLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFFN0YsSUFBSSxTQUFTLENBQUMsUUFBUSxFQUFFLE1BQU0sS0FBSyxDQUFDLEVBQ3BDO1lBQ0ksT0FBTyxDQUFDLFdBQVcsQ0FBRSxhQUFhLEVBQUcsSUFBSSxDQUFFLENBQUM7U0FDL0M7YUFFRDtZQUNJLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLENBQUUsU0FBUyxDQUFDLFVBQVUsQ0FBRSxHQUFHLElBQWMsQ0FBQztZQUNoRSxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFFLFNBQVMsQ0FBQyxXQUFXLENBQUUsR0FBRyxJQUFjLENBQUM7U0FDckU7UUFFRCxJQUFJLFNBQVMsQ0FBQyxRQUFRLEVBQUUsTUFBTSxLQUFLLENBQUMsRUFDcEM7WUFDSSxpQkFBaUIsQ0FBQyxJQUFJLENBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBRSxDQUFDO1NBQzdDO2FBRUQ7WUFDSSxNQUFNLE9BQU8sR0FBRyxZQUFZLENBQUMscUJBQXFCLENBQUUsTUFBTSxDQUFFLENBQUM7WUFFN0QsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7WUFFakMsSUFBSSxVQUFVLEdBQUcsMEJBQTBCLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDLElBQUksS0FBSyxPQUFPLENBQUUsQ0FBQztZQUNqRyxJQUFJLFlBQVksR0FBRyxVQUFVLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7WUFDdEUsSUFBSSxNQUFNLEdBQUcsU0FBUyxHQUFHLFNBQVMsQ0FBQyxrQkFBa0IsR0FBRyxHQUFHLEdBQUcsWUFBWSxDQUFDO1lBRTNFLHVCQUF1QixDQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLFNBQVMsQ0FBRSxDQUFDO1NBQ2xFO1FBRUQsd0JBQXdCLENBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxTQUFTLENBQUUsQ0FBQztRQUV2RCxPQUFPLE9BQU8sQ0FBQztJQUNuQixDQUFDO0lBRUQsU0FBUyx1QkFBdUIsQ0FBRSxPQUFnQixFQUFFLE1BQWEsRUFBRSxPQUFjLEVBQUUsU0FBcUI7UUFFcEcsT0FBTyxDQUFDLENBQUMsV0FBVyxDQUFFLHFCQUFxQixFQUFFLE9BQU8sRUFBRSxvQkFBb0IsRUFBRTtZQUN4RSxLQUFLLEVBQUUsbUNBQW1DO1lBQzFDLDJCQUEyQixFQUFFLE1BQU07WUFDbkMsd0JBQXdCLEVBQUUsSUFBSTtZQUM5Qix3QkFBd0IsRUFBRSxJQUFJO1lBQzlCLE1BQU0sRUFBRSxNQUFNO1lBQ2QsTUFBTSxFQUFFLE9BQU87WUFDZixHQUFHLEVBQUUsT0FBTztZQUNaLGNBQWMsRUFBRSxNQUFNO1lBQ3RCLGVBQWUsRUFBRSxDQUFDO1lBQ2xCLFlBQVksRUFBRSxNQUFNO1lBQ3BCLGdCQUFnQixFQUFFLEdBQUc7WUFDckIsZ0JBQWdCLEVBQUUsR0FBRztZQUNyQixhQUFhLEVBQUUsR0FBRztZQUNsQixhQUFhLEVBQUUsR0FBRztZQUNsQixvQkFBb0IsRUFBRSxHQUFHO1lBQ3pCLG9CQUFvQixFQUFFLEdBQUc7WUFDekIsYUFBYSxFQUFFLElBQUk7WUFDbkIsT0FBTyxFQUFFLE1BQU07WUFDZiwwQ0FBMEMsRUFBRSxPQUFPO1NBQ3RELENBQUUsQ0FBQztJQUNSLENBQUM7SUFFRCxTQUFTLHdCQUF3QixDQUFFLE9BQWdCLEVBQUUsTUFBYSxFQUFFLFNBQXFCO1FBRXJGLElBQUksV0FBVyxHQUFHLG1DQUFtQyxDQUFDO1FBQ3RELENBQUMsQ0FBQyxXQUFXLENBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsWUFBWSxDQUFDLFdBQVcsQ0FBRSxNQUFNLENBQUUsRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQztRQUV2RyxJQUFJLFFBQVEsR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLG9DQUFvQyxFQUFFLENBQUMsQ0FBQztRQUNyRyxJQUFJLEtBQUssR0FBRyxZQUFZLENBQUMsa0JBQWtCLENBQUUsTUFBTSxDQUFFLENBQUM7UUFFNUQsSUFBSyxDQUFDLEtBQUs7WUFDRCxRQUFRLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQzs7WUFFekIsUUFBUSxDQUFDLEtBQUssQ0FBQyxlQUFlLEdBQUcsS0FBSyxDQUFDO1FBRTNDLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBQyxLQUFLLEVBQUMseUNBQXlDLEVBQUMsQ0FBQyxDQUFDO1FBQ25HLENBQUMsQ0FBQyxXQUFXLENBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUcsQ0FBQyxRQUFRLENBQUUsc0NBQXNDLENBQUUsQ0FBQztRQUV0RixHQUFHLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxHQUFFLEVBQUU7WUFDakMsSUFBSSxTQUFTLENBQUMsZ0JBQWdCLEVBQzlCO2dCQUNJLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBRSxTQUFTLEVBQUUsTUFBTSxDQUFFLENBQUM7YUFDbkQ7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUcsU0FBUyxDQUFDLFFBQVEsRUFBRSxNQUFNLEtBQUssQ0FBQyxJQUFJLFNBQVMsQ0FBQyxhQUFhLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUMxRjtZQUNJLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxvQ0FBb0MsQ0FBQyxDQUFDO1lBQ3BGLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBRSxzQkFBc0IsQ0FBRSxDQUFDO1lBRXBELE1BQU0sQ0FBQyxhQUFhLENBQUUsYUFBYSxFQUFFLEdBQUUsRUFBRTtnQkFDckMsWUFBWSxDQUFDLHVCQUF1QixDQUNoQyxvQ0FBb0MsRUFDcEMsZ0NBQWdDLEVBQ2hDLHVFQUF1RSxDQUMxRSxDQUFDO1lBQ04sQ0FBQyxDQUFFLENBQUM7WUFFSixNQUFNLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxHQUFFLEVBQUU7Z0JBQ3BDLFlBQVksQ0FBQyx1QkFBdUIsQ0FBRSxnQ0FBZ0MsQ0FBRSxDQUFDO1lBQzdFLENBQUMsQ0FBRSxDQUFDO1lBRUosTUFBTSxDQUFDLFFBQVEsQ0FBRSx3QkFBd0IsQ0FBRSxDQUFDO1NBQy9DO0lBQ0wsQ0FBQztJQUVELFNBQVMscUJBQXFCLENBQUUsU0FBc0I7UUFFbEQsSUFBSSxnQkFBZ0IsR0FBRyxZQUFZLENBQUMsd0NBQXdDLENBQUUsU0FBUyxDQUFDLFNBQVMsQ0FBRSxDQUFDO1FBQ3BHLElBQUksRUFBRSxHQUFHLFlBQVksQ0FBQyxpQ0FBaUMsQ0FBRSxnQkFBZ0IsRUFBRSxDQUFDLENBQUUsQ0FBQztRQUUvRSxNQUFNLE9BQU8sR0FBRyxZQUFZLENBQUMscUJBQXFCLENBQzlDLGdCQUFnQixHQUFHLEVBQUUsRUFDckIsaUVBQWlFLENBQ3BFLENBQUM7UUFFRixJQUFJLFNBQVMsR0FBMkI7WUFDN0MsT0FBTyxFQUFFLEVBQUU7WUFDRixzQkFBc0IsRUFBQyxLQUFLO1lBQzVCLG9CQUFvQixFQUFFLElBQUk7WUFDMUIsWUFBWSxFQUFFLElBQUk7WUFDbEIsU0FBUyxFQUFFLFlBQVk7WUFDdkIsY0FBYyxFQUFFLElBQUk7U0FDN0IsQ0FBQTtRQUVELE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO0lBQ25DLENBQUM7SUFFRCxTQUFTLDBCQUEwQixDQUFFLFNBQXFCLEVBQUUsTUFBYztRQUV0RSxJQUFJLFlBQVksR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDO1FBRS9FLENBQUMsQ0FBQyxhQUFhLENBQ1gscUJBQXFCLEVBQ3JCLE1BQU0sRUFDTixTQUFTLENBQUMsU0FBUyxHQUFJLEtBQUssR0FBRyxZQUFZLENBQzlDLENBQUM7SUFDTixDQUFDO0lBRUQsU0FBUyxZQUFZLENBQUUsZ0JBQXdCLEVBQUUsZ0JBQStCLElBQUk7UUFFaEYsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLENBQUMsT0FBTyxDQUFFLE9BQU8sQ0FBQyxFQUFFO1lBQzNDLElBQUksT0FBTyxJQUFJLE9BQU8sQ0FBQyxPQUFPLEVBQUUsRUFDaEM7Z0JBQ0ksT0FBTyxDQUFDLFdBQVcsQ0FBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLEVBQUUsS0FBSyxhQUFhLEVBQUUsRUFBRSxJQUFJLGFBQWEsS0FBSyxJQUFJLENBQUMsQ0FBRTthQUMvRjtRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVELFNBQVMseUJBQXlCLENBQUUsUUFBZ0IsRUFBRSxFQUFTO1FBRTNELFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxPQUFPLENBQUUsT0FBTyxDQUFDLEVBQUU7WUFDbkMsT0FBTyxDQUFDLFdBQVcsQ0FBRSxNQUFNLEVBQUUsQ0FBRSxPQUFPLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBRSxDQUFFLENBQUM7UUFDekQsQ0FBQyxDQUFFLENBQUM7SUFDUixDQUFDO0lBRUQsU0FBUyx3QkFBd0I7UUFFN0IsNEVBQTRFO1FBQzVFLElBQUksUUFBUSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxtQkFBbUIsQ0FBRSxDQUFDO1FBQ2hGLElBQUksS0FBSyxHQUFHLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBRSw0QkFBNEIsQ0FBRSxDQUFDO1FBRTNFLElBQUksQ0FBQyxLQUFLLEVBQ1Y7WUFDSSxLQUFLLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxhQUFhLEVBQUUsUUFBUSxFQUFFLDRCQUE0QixFQUFFLEVBQUUsS0FBSyxFQUFDLFlBQVksRUFBQyxDQUFFLENBQUM7WUFDdEcsS0FBSyxDQUFDLGtCQUFrQixDQUFFLFVBQVUsQ0FBRSxDQUFDO1lBQ3RDLEtBQUssQ0FBQyxTQUFTLENBQUUsdUJBQXVCLENBQWMsQ0FBQyxRQUFRLENBQUMsMkNBQTJDLENBQUMsQ0FBQztZQUU5RyxLQUFLLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxHQUFFLEVBQUU7Z0JBQ25DLElBQUksUUFBUSxHQUFJLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxtQkFBbUIsQ0FBRSxDQUFDO2dCQUNqRixRQUFRLENBQUMsV0FBVyxDQUFDLHNCQUFzQixFQUFFLEtBQUssQ0FBRSxDQUFDO1lBQ3pELENBQUMsQ0FBQyxDQUFDO1NBQ047SUFDTCxDQUFDO0lBRUQsU0FBZ0IsNEJBQTRCLENBQUUsU0FBc0I7UUFFaEUsSUFBSyxTQUFTLENBQUMsZUFBZSxFQUM5QjtZQUNJLElBQUksbUJBQW1CLEdBQUcsUUFBUSxDQUFDLHdCQUF3QixDQUFFLFFBQVEsQ0FBRSxTQUFTLENBQUMsZUFBZSxDQUFFLENBQUUsQ0FBQztZQUNyRyxPQUFPLENBQUUsbUJBQW1CLEdBQUcsQ0FBQyxDQUFFLENBQUM7U0FDdEM7UUFDRCxPQUFPLEtBQUssQ0FBQztJQUNqQixDQUFDO0lBUmUsbUNBQTRCLCtCQVEzQyxDQUFBO0lBRUQsU0FBUyxjQUFjLENBQUUsU0FBcUI7UUFFMUMsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLG1CQUFtQixDQUFFLENBQUM7UUFDaEYsSUFBSSxLQUFLLEdBQUcsUUFBUSxDQUFDLHFCQUFxQixDQUFFLFNBQVMsQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFFLENBQUM7UUFFM0UsSUFBSSxDQUFDLEtBQUssRUFDVjtZQUNJLEtBQUssR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFFLGFBQWEsRUFBRSxRQUFRLEVBQUUsU0FBUyxDQUFDLFNBQVMsR0FBRyxNQUFNLEVBQUUsRUFBRSxLQUFLLEVBQUMsWUFBWSxFQUFDLENBQUUsQ0FBQztZQUN0RyxLQUFLLENBQUMsa0JBQWtCLENBQUUsVUFBVSxDQUFFLENBQUM7WUFDdkMsS0FBSyxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLENBQUMsa0JBQWtCLENBQUUsU0FBUyxDQUFFLENBQUUsQ0FBQztZQUMzRSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsUUFBUSxHQUFHLFNBQVMsQ0FBQyxRQUFrQixDQUFDO1lBRXJELElBQUksU0FBUyxDQUFDLFlBQVksRUFDMUI7Z0JBQ0ksTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBRSx1QkFBdUIsQ0FBYSxDQUFDO2dCQUN0RSxRQUFRLENBQUMsd0JBQXdCLENBQUUsT0FBTyxFQUFFLFNBQVMsQ0FBQyxZQUFZLENBQUUsQ0FBQztnQkFDckUsUUFBUSxDQUFDLGtCQUFrQixDQUFFLE9BQU8sRUFBRSxTQUFTLENBQUMsWUFBWSxDQUFFLENBQUM7YUFDbEU7U0FDSjtJQUNMLENBQUM7SUFFRCxTQUFTLDJCQUEyQjtRQUVoQyxvQkFBb0IsRUFBRSxDQUFDO1FBQ3ZCLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxXQUFXLENBQUUsb0JBQW9CLEVBQUUsS0FBSyxDQUFFLENBQUM7UUFFL0QsSUFBSywyQkFBMkIsRUFDaEM7WUFDSSxDQUFDLENBQUMsZUFBZSxDQUFFLDJCQUEyQixDQUFFLENBQUM7WUFDakQsMkJBQTJCLEdBQUcsSUFBSSxDQUFDO1NBQ3RDO0lBQ0wsQ0FBQztJQUVELFNBQVMsZUFBZTtRQUVwQiwyQkFBMkIsRUFBRSxDQUFDO1FBQzlCLGtCQUFrQixFQUFFLENBQUM7SUFDekIsQ0FBQztJQUVELFNBQVMsZ0JBQWdCO1FBRXJCLDJCQUEyQixFQUFFLENBQUM7UUFDOUIsa0JBQWtCLEVBQUUsQ0FBQztJQUN6QixDQUFDO0lBRUQsQ0FBQyxDQUFDLHlCQUF5QixDQUFFLGNBQWMsRUFBRSxlQUFlLENBQUUsQ0FBQztJQUMvRCxDQUFDLENBQUMseUJBQXlCLENBQUMsa0JBQWtCLEVBQUUsZUFBZSxDQUFDLENBQUM7SUFDakUsQ0FBQyxDQUFDLHlCQUF5QixDQUFDLG1CQUFtQixFQUFFLGdCQUFnQixDQUFDLENBQUM7QUFDdkUsQ0FBQyxFQXo1Q1MsTUFBTSxLQUFOLE1BQU0sUUF5NUNmIn0=