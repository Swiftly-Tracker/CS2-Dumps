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
                    let elTrack = CreateTrack(elActiveTracks, i);
                    elTrack.visible = false;
                    let elActivateBtn = elTrack.FindChildInLayoutFile('id-xpshop-pass-activate-btn');
                    elActivateBtn.SetHasClass('hidden', true);
                    let oSettings;
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
                        ++numPassesStillPossibleToBuy;
                    }
                }
                elUpsell.SetHasClass('hide', true);
                elBalance.SetHasClass('hide', false);
                elMorePassesBtn.SetHasClass('hide', numPassesStillPossibleToBuy <= 0);
                elMorePassesBtn.text = $.Localize('#xpshop_pass_extra_pass', elActiveTracks);
                elMorePassesBtn.SetPanelEvent('onactivate', () => {
                    _OpenPurchasePassPopup();
                    $.DispatchEvent("CSGOPlaySoundEffect", "UIPanorama.loadout_sector_select", "MOUSE");
                });
                $.GetContextPanel().FindChildInLayoutFile('id-xpshop-active-tracks-container').SetHasClass('five-tracks', numPassesStillPossibleToBuy === 0);
            }
            else {
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
                if (petItemId)
                    continue;
            }
            if (ShopEntry.bidding_cycle) {
                ShopEntry.points = '';
                const numSecondsRemaining = StoreAPI.GetSecondsUntilTimestamp(parseInt(ShopEntry.bidding_close));
                if (numSecondsRemaining <= 0)
                    continue;
            }
            aShopItemsData.push(ShopEntry);
        }
        aShopItemsData.forEach((element) => {
            element.items_in_row = itemsInRows[element.ui_order];
            _MakeShopTile(element);
            _MakeNavButton(element);
        });
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
                const numItemsPerTile = ((ShopEntry.lootlist_item_type === "keychain" || ShopEntry.lootlist_item_type === "sticker") && ShopEntry.items_in_row < 5) ? 4 : 1;
                let numScrollingTilesToAdd = ((ShopEntry.lootlist_item_type === "keychain" || ShopEntry.lootlist_item_type === "sticker") && numItemsPerTile > 1) ? Math.floor((ShopEntry.lootlist.length + numItemsPerTile - 1) / numItemsPerTile) : 6;
                let shuffledArray = [...ShopEntry.lootlist];
                shuffledArray.sort((a, b) => 0.5 - Math.random());
                for (let iScrollingTile = 0; iScrollingTile < numScrollingTilesToAdd; ++iScrollingTile) {
                    for (let iTileItem = 0; iTileItem < numItemsPerTile; ++iTileItem) {
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
        m_elContentPanel.SetHasClass('xpshop-grids-visible', true);
        let elInspectContainer = m_elContentPanel.FindChildInLayoutFile('id-xpshop-inspect-container');
        let elGrid = elInspectContainer.FindChildInLayoutFile(ShopEntry.item_name + '-grid');
        if (!elGrid) {
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
                elRedeemBar.SetHasClass('hidden', true);
                elConfirmBar.SetHasClass('hidden', false);
                elConfirmBar.FindChildInLayoutFile('id-xpshop-item-redeem-confirm').enabled = true;
                elConfirmBar.FindChildInLayoutFile('id-xpshop-item-redeem-cancel').enabled = true;
                ShopEntry.bidding_points_amount = 1;
                let bMakingNewBid = true;
                const numBids = InventoryAPI.GetCacheTypeElementsCount('XpShopBids');
                for (let iBid = 0; iBid < numBids; ++iBid) {
                    const jsoBid = InventoryAPI.GetCacheTypeElementJSOByIndex('XpShopBids', iBid);
                    if (jsoBid.campaign_id == m_nTrack) {
                        ShopEntry.bidding_points_amount = jsoBid.expected_cost;
                        bMakingNewBid = false;
                        break;
                    }
                }
                let fnLocalizeConfirmBar = () => {
                    elConfirmBar.SetDialogVariable('cost_stars', '' + ShopEntry.bidding_points_amount);
                    elConfirmBar.SetDialogVariable('confirm-text', $.Localize((bMakingNewBid ? '#xpshop_redeem_use_confirm_item' : '#xpshop_redeem_use_cancel_item')
                        + (ShopEntry.suffix_loc_string ? ShopEntry.suffix_loc_string : ''), elConfirmBar));
                    elConfirmBar.FindChildInLayoutFile('id-xpshop-item-redeem-confirm').Children()[0].text
                        = $.Localize((bMakingNewBid ? '#xpshop_redeem_use_confirm_item_bid_btn' : '#xpshop_redeem_use_cancel_item_bid_btn'), elConfirmBar);
                };
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
                let elBtn = $.GetContextPanel().FindChildInLayoutFile('id-nav-show-main-tiles-btn');
                $.DispatchEvent("Activated", elBtn, "mouse");
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
        if (tilePosX - initialXTranslate < m_elContentPanel.actualxoffset / m_elContentPanel.actualuiscale_x) {
            finalXTranslate = ((tilePosX) - sideOffset) * -1;
        }
        else if (((tilePosX - initialXTranslate) + zoomWidth) > contentPanelWidth) {
            finalXTranslate = (tilePosX - (contentPanelWidth - (zoomWidth + sideOffset))) * -1;
        }
        else {
            finalXTranslate = initialXTranslate * -1;
        }
        let tilePosY = Math.floor(elShopTile.actualyoffset / elShopTile.actualuiscale_y);
        let initialYTranslate = (baseHeight / 2);
        let finalYTranslate = 0;
        let contentPanelHeight = Math.floor(m_elContentPanel.actuallayoutheight / m_elContentPanel.actualuiscale_y);
        let bottomOffset = 32 + 48;
        let topOffset = 92;
        if ((tilePosY + zoomHeight) > (contentPanelHeight - bottomOffset)) {
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
            return { rows: maxRows, cols: maxColumn };
        }
        let cols = Math.min(maxColumn, Math.ceil(Math.sqrt(nPanelsCount)));
        let rows = Math.ceil(nPanelsCount / cols);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieHBzaG9wLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMveHBzaG9wLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFDbEMsbUNBQW1DO0FBQ25DLHFEQUFxRDtBQUNyRCxzREFBc0Q7QUFDdEQscUVBQXFFO0FBQ3JFLHlEQUF5RDtBQUN6RCx1Q0FBdUM7QUFDdkMsd0NBQXdDO0FBQ3hDLDZDQUE2QztBQUM3QyxDQUFDLENBQUMsVUFBVSxDQUFFLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztBQW1DcEMsSUFBVSxNQUFNLENBeTVDZjtBQXo1Q0QsV0FBVSxNQUFNO0lBRVosTUFBTSxXQUFXLEdBQUcsR0FBRyxDQUFDO0lBQ3hCLE1BQU0sWUFBWSxHQUFHLEdBQUcsQ0FBQztJQUN6QixNQUFNLGtCQUFrQixHQUFHLEdBQUcsQ0FBQztJQUMvQixNQUFNLG9CQUFvQixHQUFHLGtCQUFrQixHQUFHLEVBQUUsQ0FBQztJQUNyRCxNQUFNLGdCQUFnQixHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxtQkFBbUIsQ0FBRSxDQUFDO0lBQzFGLElBQUksUUFBZSxDQUFDO0lBQ3BCLElBQUksT0FBYyxDQUFDO0lBQ25CLElBQUksY0FBYyxHQUFVLENBQUMsQ0FBQztJQUM5QixJQUFJLDJCQUEwQyxDQUFDO0lBQy9DLE1BQU0sYUFBYSxHQUFHLGVBQWUsQ0FBQztJQUN0QyxNQUFNLFFBQVEsR0FBRyxZQUFZLENBQUMsaUNBQWlDLENBQUUsWUFBWSxDQUFDLHdDQUF3QyxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO0lBRTNJLFNBQWdCLElBQUk7UUFFaEIsUUFBUSxHQUFJLFdBQVcsQ0FBQywrQkFBK0IsRUFBRSxDQUFDO1FBRTFELElBQUksQ0FBQyxRQUFRLElBQUksUUFBUSxLQUFLLENBQUMsRUFDL0I7WUFFSSxPQUFP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