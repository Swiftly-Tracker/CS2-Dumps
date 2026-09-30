"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../common/licenseutil.ts" />
/// <reference path="../common/eventutil.ts" />
/// <reference path="../common/store_items.ts" />
/// <reference path="../common/shopping_cart.ts" />
/// <reference path="../common/add_major_tokens_anim.ts" />
/// <reference path="../common/formattext.ts" />
/// <reference path="../generated/items_event_current_generated_store.d.ts" />
/// <reference path="../generated/items_event_current_generated_store.ts" />
/// <reference path="../popups/popup_acknowledge_item.ts" />
/// <reference path="../itemtile_store.ts" />
/// <reference path="../common/unique_random_number.ts"/>
var PopupMajorStore;
(function (PopupMajorStore) {
    const defidxStickerItem = InventoryAPI.GetItemDefinitionIndexFromDefinitionName('sticker'); // move it to be global in the namespace - this defidx never changes
    const defidxKeyChainItem = InventoryAPI.GetItemDefinitionIndexFromDefinitionName('keychain'); // move it to be global in the namespace - this defidx never changes
    function State(cp) {
        return cp.Data();
    }
    // Shared "most desirable first" order: popularity, then price, then a stable id tie-break.
    function _CompareByPopularity(a, b) {
        if (a.popularity != b.popularity)
            return b.popularity - a.popularity; // bigger numbers means more popular, show first
        if (a.price != b.price)
            return b.price - a.price; // bigger number means more desirable, show first
        // Keychains have no rawId, so fall back through kc_highlight/itemId for a deterministic order.
        const aId = a.rawId ?? a.kc_highlight ?? a.itemId;
        const bId = b.rawId ?? b.kc_highlight ?? b.itemId;
        return aId < bId ? -1 : (aId > bId ? 1 : 0);
    }
    // Single access point for the persisted watch list (cl_major_store_watch_list).
    let Bookmarks;
    (function (Bookmarks) {
        const SETTING = 'cl_major_store_watch_list';
        let _cache = null;
        function ids() {
            if (_cache === null) {
                const raw = GameInterfaceAPI.GetSettingString(SETTING);
                _cache = raw ? raw.split(',') : [];
            }
            return _cache;
        }
        Bookmarks.ids = ids;
        function invalidate() {
            _cache = null;
        }
        Bookmarks.invalidate = invalidate;
        function has(defidx) {
            return ids().includes(defidx.toString());
        }
        Bookmarks.has = has;
        function toggle(defidx) {
            const id = defidx.toString();
            const list = [...ids()];
            const idx = list.indexOf(id);
            if (idx === -1)
                list.push(id);
            else
                list.splice(idx, 1);
            GameInterfaceAPI.SetSettingString(SETTING, list.length > 0 ? list.join(',') : '');
            _cache = list; // keep the cache in sync with what we just wrote
        }
        Bookmarks.toggle = toggle;
    })(Bookmarks || (Bookmarks = {}));
    // Passed to _SetActiveNavTab when the view belongs to no tab, e.g. search results.
    const NAV_TAB_NONE = '';
    // The main views: one panel each under the container, one on screen at a time. STORE_VIEWS,
    // after the nav registry, says what each needs on the way in and on refresh.
    const VIEW_HOME = 'id-major-store-banners';
    const VIEW_CONTENT = 'id-major-store-content';
    const VIEW_CHARMS = 'id-major-store-keychains';
    const VIEW_TEAM = 'id-major-store-team-view';
    const VIEW_SINGLE = 'id-major-store-single-view';
    const NO_SERIES_FILTER = '';
    // One entry per option in the XML sort dropdown, keyed by that option's id. Holds the item
    // field it sorts on and the direction, so adding a sort is a row here plus a row there.
    const SORT_OPTIONS = {
        'price-high-low': { field: 'price', direction: 'desc' },
        'price-low-high': { field: 'price', direction: 'asc' },
        'weekly-high-low': { field: 'weeklyPctReductionFromHigh', direction: 'desc' },
        'popularity-high-low': { field: 'popularity', direction: 'desc' },
        'popularity-low-high': { field: 'popularity', direction: 'asc' },
        'name': { field: 'name', direction: 'asc' },
    };
    const SORT_OPTION_IDS = Object.keys(SORT_OPTIONS);
    const VIEW_SORTS = {
        Event: { key: 'event', default: 'popularity-high-low', hidden: [] },
        Ranked: { key: 'ranked', default: 'price-high-low', hidden: ['weekly-high-low', 'popularity-high-low', 'popularity-low-high'] },
        Champions: { key: 'champions', default: 'popularity-high-low', hidden: ['weekly-high-low'] },
        Favorites: { key: 'favorites', default: 'weekly-high-low', hidden: ['popularity-high-low', 'popularity-low-high'] },
        AllItems: { key: 'all', default: 'name', hidden: [] },
        Search: { key: 'search', default: 'weekly-high-low', hidden: [] },
    };
    // The sort menu dismisses itself when focus moves, which is why clicking a tile closes it but
    // empty space does not. Handing focus to the content page closes it without touching the
    // control's own open/closed state. Guarded on the menu actually being open, so an ordinary
    // click never pulls focus off something else -- the search box in particular.
    function _CloseSortDropDown(cp) {
        const elDropDown = _SortDropDown(cp);
        const elMenu = elDropDown ? elDropDown.AccessDropDownMenu() : null;
        if (!elMenu || !elMenu.visible) {
            return;
        }
        const elPage = cp.FindChildInLayoutFile('id-major-store-content-page');
        if (elPage) {
            elPage.SetFocus();
        }
    }
    function _SortDropDown(cp) {
        return cp.FindChildInLayoutFile('id-major-store-sort-dropdown');
    }
    /** Drives the sort dropdown without the change counting as a user choice. */
    function _SelectSort(cp, szSortId) {
        m_bApplyingSort = true;
        _SortDropDown(cp).SetSelected(szSortId);
        m_bApplyingSort = false;
    }
    /** Shows the view's sort options and restores the sort last used in that view. */
    function _ApplyViewSort(cp, sort) {
        State(cp).activeSort = sort;
        const elDropDown = _SortDropDown(cp);
        SORT_OPTION_IDS.forEach(id => {
            const elOption = elDropDown.FindDropDownMenuChild(id);
            if (elOption) {
                elOption.visible = !sort.hidden.includes(id);
            }
        });
        const szRemembered = State(cp).mSortByView[sort.key];
        const szWanted = (szRemembered && !sort.hidden.includes(szRemembered)) ? szRemembered : sort.default;
        _SelectSort(cp, szWanted);
    }
    /** Records the sort the user just picked against the view they are in. */
    function _RememberViewSort(cp, szSortId) {
        State(cp).mSortByView[State(cp).activeSort.key] = szSortId;
    }
    const SERIES_FILTERS = [
        { toggleId: 'id-major-store-filter-major', loc: '#major_store_filter_type_major_only', chipId: 'id-filter-active-major-only' },
        { toggleId: 'id-major-store-filter-champions', loc: '#major_store_filter_type_champions_only', chipId: 'id-filter-active-champions-only' },
        { toggleId: 'id-major-store-filter-ranked', loc: '#major_store_filter_type_ranked_only', chipId: 'id-filter-active-ranked-only' },
    ];
    const REFINEMENT_FILTERS = [
        { toggleId: 'id-major-store-filter-team', loc: '#major_store_filter_type_team_only', chipId: 'id-filter-active-t-only' },
        { toggleId: 'id-major-store-filter-player', loc: '#major_store_filter_type_player_only', chipId: 'id-filter-active-p-only' },
    ];
    /** True when the view can hold any series and both stickers and charms: search results, the
        store-wide see all, and favourites. Only those expose the series and highlights controls;
        a category tab has already fixed both. */
    function _IsMixedContentView(cp) {
        if (State(cp).useBookMarkList) {
            return true;
        }
        const elParent = cp.FindChildInLayoutFile('id-major-store-nav-tabs-container');
        if (cp.FindChildInLayoutFile('id-major-store-nav-home').checked) {
            return false;
        }
        return !STORE_NAV_TABS.some(tab => {
            const elTab = elParent.FindChild(tab.key);
            return elTab && elTab.checked;
        });
    }
    /** Major / Champions / Ranked are OR'd; none checked matches everything. */
    function _MatchesSeriesFilter(item, settings) {
        if (!settings.rankedOnly && !settings.championsOnly && !settings.majorOnly) {
            return true;
        }
        return (settings.rankedOnly && item.isRanked)
            || (settings.championsOnly && item.champion)
            // Keychains have neither flag, so require a sticker here (bookmarks mix both types).
            || (settings.majorOnly && ('rawId' in item) && !item.isRanked && !item.champion);
    }
    /** Shows only the filter sections that can do something in the view on screen. */
    function _UpdateFilterSections(cp) {
        // Series and highlights only apply where the contents are mixed.
        const bMixed = _IsMixedContentView(cp);
        cp.FindChildInLayoutFile('id-filter-section-series').visible = bMixed;
        cp.FindChildInLayoutFile('id-filter-section-keychains').visible = bMixed;
        // A major has a single champions team, so there is nothing for that filter to narrow.
        cp.FindChildInLayoutFile('id-filter-section-teams').visible =
            !cp.FindChildInLayoutFile('id-major-store-filter-champions').checked;
    }
    /** Selects exactly one series, or none for NO_SERIES_FILTER. */
    function _SetActiveSeriesFilter(cp, toggleId) {
        if (toggleId !== NO_SERIES_FILTER && !SERIES_FILTERS.some(s => s.toggleId === toggleId)) {
            $.Msg('PopupMajorStore: "' + toggleId + '" is not a series filter; showing every series');
        }
        SERIES_FILTERS.forEach(series => {
            const elToggle = cp.FindChildInLayoutFile(series.toggleId);
            if (elToggle) {
                elToggle.checked = (series.toggleId === toggleId);
            }
        });
    }
    const SEARCH_DEBOUNCE_HANDLE = 'textDebounceTimeoutHandle';
    const MAX_SEARCH_RESULTS_SHOWN = 20;
    let m_activeMain = null;
    const m_overlayStack = [];
    // Guards the programmatic RadioButton.checked writes in _SetActiveNavTab from re-entering onactivate.
    let m_bSyncingNavTabs = false;
    // Set while the code drives the sort dropdown, so it is not mistaken for a user choice.
    let m_bApplyingSort = false;
    //
    // Navigation actions -- the shared vocabulary both registries below can point at. A tab and a
    // carousel may use the same action or diverge; neither registry owns these.
    //
    const StoreNavActions = {
        Home: (cp) => {
            _OnActivateClearAll(cp);
            _SetActiveSeriesFilter(cp, NO_SERIES_FILTER);
            _ShowMainPanel(cp, VIEW_HOME);
        },
        Major: (cp) => _ShowCategoryList(cp, 'id-major-store-filter-major', VIEW_SORTS.Event),
        Ranked: (cp) => _ShowCategoryList(cp, 'id-major-store-filter-ranked', VIEW_SORTS.Ranked),
        Champions: (cp) => _ShowCategoryList(cp, 'id-major-store-filter-champions', VIEW_SORTS.Champions),
        Bookmarks: (cp) => {
            _OnActivateClearAll(cp);
            _SetActiveSeriesFilter(cp, NO_SERIES_FILTER);
            _ApplyViewSort(cp, VIEW_SORTS.Favorites);
            State(cp).useBookMarkList = true;
            _ShowMainPanel(cp, VIEW_CONTENT);
        },
        Charms: (cp) => {
            _OnActivateClearAll(cp);
            _SetActiveSeriesFilter(cp, NO_SERIES_FILTER);
            _ApplyViewSort(cp, VIEW_SORTS.AllItems);
            _ShowMainPanel(cp, VIEW_CHARMS);
        },
    };
    const STORE_CAROUSELS = [
        // {
        //     key: 'bookmarked',
        //     bannerId: 'id-major-store-banners-bookmarks',
        //     seeAllBtnId: 'id-major-store-see-all-bookmarked-btn',
        //     hasItems: ( cp ) => _GetBookmarkedItemsList( cp ).length > 0,
        //     refresh: ( cp ) => _SetUpBookmarkItemsBanner( cp ),
        //     onSeeAll: StoreNavActions.Bookmarks,
        //     navTabKey: 'bookmarked',
        // },
        {
            key: 'ranked',
            bannerId: 'id-banner-ranked',
            seeAllBtnId: 'id-major-store-see-all-ranked-btn',
            hasItems: (cp) => State(cp).aFlatStickersData.some(s => s.isRanked),
            refresh: (cp) => _SetUpRankedBanner(cp),
            onSeeAll: StoreNavActions.Ranked,
            navTabKey: 'ranked',
        },
        // {
        //     key: 'champions',
        //     bannerId: 'id-banner-champions',
        //     seeAllBtnId: 'id-major-store-see-all-champions-btn',
        //     hasItems: ( cp ) => State( cp ).aFlatStickersData.some( s => s.champion ),
        //     refresh: ( cp ) => _SetUpChampionsBanner( cp ),
        //     onSeeAll: StoreNavActions.Champions,
        //     navTabKey: 'champions',
        // },
        // {
        //     key: 'charms',
        //     bannerId: 'id-banner-keychains',
        //     seeAllBtnId: 'id-major-store-see-all-keychains-btn',
        //     hasItems: ( cp ) => State( cp ).aFlatKeyChainData.length > 1,
        //     refresh: ( cp ) => _SetUpKeyChainsBanner( cp ),
        //     onSeeAll: StoreNavActions.Charms,
        //     navTabKey: 'charms',
        // },
        // {
        //     key: 'popular',
        //     bannerId: 'id-banner-popular',
        //     seeAllBtnId: 'id-major-store-see-all-popular-btn',
        //     hasItems: ( cp ) => State( cp ).aFlatStickersData.length > 0,
        //     refresh: ( cp ) => _SetUpPopularityBanner( cp ),
        //     onSeeAll: ( cp ) => _ShowCategoryList( cp, NO_SERIES_FILTER ),
        //     navTabKey: 'popular',
        // },
    ];
    const STORE_NAV_TABS = [
        {
            key: 'major',
            loc: '#major_store_nav_tab_major',
            isAvailable: (cp) => State(cp).aFlatStickersData.length > 0,
            activate: StoreNavActions.Major,
        },
        {
            key: 'champions',
            loc: '#major_store_nav_tab_champions',
            isAvailable: (cp) => State(cp).aFlatStickersData.some(s => s.champion),
            activate: StoreNavActions.Champions,
        },
        {
            key: 'ranked',
            loc: '#major_store_nav_tab_ranked',
            isAvailable: (cp) => State(cp).aFlatStickersData.some(s => s.isRanked),
            activate: StoreNavActions.Ranked,
        },
        {
            key: 'charms',
            loc: '#major_store_nav_tab_charms',
            isAvailable: (cp) => State(cp).aFlatKeyChainData.length > 1,
            activate: StoreNavActions.Charms,
        },
        {
            key: 'bookmarked',
            loc: '#major_store_nav_tab_bookmarked',
            isAvailable: () => true,
            activate: StoreNavActions.Bookmarks,
            label: (cp, elLabel) => {
                const nCount = _GetBookmarkedItemsList(cp).length;
                elLabel.SetDialogVariableInt('count', nCount);
                return $.Localize(nCount > 0 ? '#major_store_nav_tab_bookmarked_count' : '#major_store_nav_tab_bookmarked', elLabel);
            },
        },
    ];
    const STORE_VIEWS = [
        {
            id: VIEW_HOME,
            navTabKey: 'home',
            onShow: (cp) => _RefreshHome(cp),
            onRefresh: (cp) => _RefreshHome(cp),
        },
        {
            // One list serving every category tab, favourites, search results and see-all.
            id: VIEW_CONTENT,
            rebuildIfActive: true,
            onShow: (cp) => { if (!_UpdateFavoritesEmptyState(cp))
                _MakeDelayedLoadList(cp); },
            onRefresh: (cp, bDisableScroll) => _UpdateItemsList({ cp, bDisableScroll }),
        },
        {
            id: VIEW_CHARMS,
            navTabKey: 'charms',
            onShow: (cp) => _SetUpKeyChainsPage(cp),
            onRefresh: (cp) => _SetUpKeyChainsPage(cp),
        },
        {
            // Drill-downs. Their opener builds them for a given team or pack before showing, so no onShow.
            id: VIEW_TEAM,
            onRefresh: (cp) => _RefreshTeamView(cp),
        },
        {
            id: VIEW_SINGLE,
            onRefresh: (cp) => _RefreshSingleView(cp),
            backTarget: VIEW_TEAM,
        },
    ];
    PopupMajorStore.UpdateAnimationTimer = 5;
    function ClosePopup() {
        const cp = $.GetContextPanel();
        cp.SetReadyForDisplay(false);
        CancelRefreshSubscription(cp);
        CancelRefreshTimerUpdate(cp);
        const state = State(cp);
        // Cancel timers that could fire after the popup is gone.
        const loadHandle = state.loadDataTimeoutHandler;
        if (loadHandle) {
            $.CancelScheduled(loadHandle);
            state.loadDataTimeoutHandler = null;
        }
        if (jsTooltipDelayHandle) {
            $.CancelScheduled(jsTooltipDelayHandle);
            jsTooltipDelayHandle = null;
        }
        const searchHandle = cp.Data()[SEARCH_DEBOUNCE_HANDLE];
        if (searchHandle) {
            $.CancelScheduled(searchHandle);
            cp.Data()[SEARCH_DEBOUNCE_HANDLE] = null;
        }
        // Release JS callbacks handed to child popups (checkout / inspect / search context menu).
        // The child popups only invoke these handles, they never unregister them, so it is on us.
        const menuHandle = state.contextMenuCallbackHandle;
        if (menuHandle) {
            UiToolkitAPI.UnregisterJSCallback(menuHandle);
            state.contextMenuCallbackHandle = null;
        }
        if (state.jsCallbackHandles) {
            state.jsCallbackHandles.forEach((h) => UiToolkitAPI.UnregisterJSCallback(h));
            state.jsCallbackHandles = [];
        }
        UiToolkitAPI.HideTextTooltip();
        UiToolkitAPI.HideTitleTextTooltip();
        $.DispatchEvent('CSGOPlaySoundEffect', 'inventory_inspect_close', 'MOUSE');
        $.DispatchEvent('UIPopupButtonClicked', '');
        $.DispatchEvent('ContextMenuEvent', '');
    }
    PopupMajorStore.ClosePopup = ClosePopup;
    // Track a RegisterJSCallback handle so it can be released in ClosePopup. These callbacks are handed
    // to child popups (checkout / inspect) which only invoke them, so the store popup owns their cleanup.
    function _TrackJSCallback(cp, handle) {
        if (!State(cp).jsCallbackHandles)
            State(cp).jsCallbackHandles = [];
        State(cp).jsCallbackHandles.push(handle);
        return handle;
    }
    function ReadyForDisplay() {
        $.Msg('PopupMajorStore ReadyForDisplay: ' + $.GetContextPanel().id);
        if (!MyPersonaAPI.IsConnectedToGC()) {
            ClosePopup();
            return;
        }
        let eventId = g_ActiveTournamentInfo.eventid ? g_ActiveTournamentInfo.eventid : -1;
        if (eventId < 0) {
            ClosePopup();
            return;
        }
        const cp = $.GetContextPanel();
        State(cp).aFlatStickersData = [];
        State(cp).aFlatKeyChainData = [];
        State(cp).aKeyChainBannerItems = [];
        State(cp).searchCache = null;
        State(cp).activeSort = VIEW_SORTS.AllItems;
        State(cp).mSortByView = {};
        // No reveal window open until a price update arrives.
        State(cp).stopTileUpdate = true;
        // Subscribe to the GC feed with pricing updates -- this must also be a "scheduled function" every 150 seconds or so
        // because the cart can contain mixed content (stickers and charms) we have to subscribe to all pricesheets so that
        // cart could reflect price changes regardless of which store user is shopping in
        _SubscribeForAllTournamentItems();
    }
    function Init() {
        let cp = $.GetContextPanel();
        if (!MyPersonaAPI.IsConnectedToGC()) {
            ClosePopup();
            return;
        }
        let eventId = g_ActiveTournamentInfo.eventid ? g_ActiveTournamentInfo.eventid : -1;
        if (eventId < 0) {
            ClosePopup();
            return;
        }
        // Check if we already have a price for all types of items.  If we do we don't need the loader.
        State(cp).arrAwaitingPricesheets = [];
        if (!MissionsAPI.GetSeasonalOperationFauxCreditsCost(g_ActiveTournamentInfo.credits_id, InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(defidxStickerItem, g_ActiveTournamentInfo.stickerids[0])))
            State(cp).arrAwaitingPricesheets.push(g_ActiveTournamentInfo.itemid_dynamic_stickers);
        if (!MissionsAPI.GetSeasonalOperationFauxCreditsCost(g_ActiveTournamentInfo.credits_id, InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(defidxStickerItem, g_ActiveTournamentInfo.rankingids[0])))
            State(cp).arrAwaitingPricesheets.push(g_ActiveTournamentInfo.itemid_rankings_stickers);
        let nStickerIdChampion = 0;
        g_ActiveTournamentTeams.forEach((tt) => {
            tt.champions.forEach((tcp) => {
                if (tcp.stickerids.length > 0)
                    nStickerIdChampion = tcp.stickerids[0];
            });
        });
        if (nStickerIdChampion && !MissionsAPI.GetSeasonalOperationFauxCreditsCost(g_ActiveTournamentInfo.credits_id, InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(defidxStickerItem, nStickerIdChampion)))
            State(cp).arrAwaitingPricesheets.push(g_ActiveTournamentInfo.itemid_champion_stickers);
        g_ActiveTournamentHighlights.forEach((thg) => {
            if (!MissionsAPI.GetSeasonalOperationFauxCreditsCost(g_ActiveTournamentInfo.credits_id, InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(defidxKeyChainItem, thg.highlights[0].kc_highlight)))
                State(cp).arrAwaitingPricesheets.push(thg.itemid_dynamic_shop);
        });
        if (!State(cp).loadDataTimeoutHandler && (State(cp).arrAwaitingPricesheets.length > 0)) {
            $.Msg(" Major Store Init : show loading panel to wait for " + State(cp).arrAwaitingPricesheets.length + " pricesheets...");
            $.GetContextPanel().SetHasClass('data-loading', true);
            _PushOverlay(cp, 'id-major-store-loading');
            State(cp).loadDataTimeoutHandler = $.Schedule(5, () => {
                UiToolkitAPI.ShowGenericPopupOk($.Localize('#SFUI_SteamConnectionErrorTitle'), $.Localize('#SFUI_Steam_Error_LinkUnexpected'), '', () => $.DispatchEvent('HideContentPanel'));
                ClosePopup();
            });
            return;
        }
        cp.SetHasClass('major-' + eventId, true);
        if (!State(cp).contextMenuCallbackHandle)
            State(cp).contextMenuCallbackHandle = UiToolkitAPI.RegisterJSCallback(OnSearchContextMenuCallBack);
        cp.FindChildInLayoutFile('id-major-store-container-inner').AddClass('show');
        // Check if we are in the middle of a price update
        PriceRefreshTimerUpdate(cp);
        _UpdateStickerData(cp);
        _UpdateKeyChainsData(cp);
        _SetUpTitleBar(cp, eventId);
        _SetUpTeamsBanner(cp);
        _SetUpOrgBanners(cp);
        _VariousButtonActionsAndEvents(cp);
        _SetUpCarouselSeeAllButtons(cp);
        _SetUpStoreNavTabs(cp);
        _SetUpFilterPanel(cp);
        _ShowMainPanel(cp, VIEW_HOME);
        _UpdateBalance(cp);
        ShoppingCart.cart.subscribeToUpdates(cp, 'cart-counter', () => {
            const numItems = ShoppingCart.cart.getTotalItems();
            cp.SetDialogVariableInt('cart-count', numItems);
            cp.SetDialogVariableInt('cart-value', ShoppingCart.cart.getTotalPrice());
            cp.FindChildInLayoutFile('id-major-store-cart-info').SetHasClass('show', numItems > 0);
            cp.FindChildInLayoutFile('id-major-store-cart-info').TriggerClass('update-count');
        });
    }
    PopupMajorStore.Init = Init;
    function OnVolatileShopSubscribe(nContainerDef, bNewPricesParsed, cp) {
        $.Msg("OnVolatileShopSubscribe for " + nContainerDef + " " + (bNewPricesParsed ? '(new prices)' : '(no prices, just notification)'));
        $.Msg(" seconds until price update: " + StoreAPI.GetSecondsUntilPendingPriceUpdate(nContainerDef));
        const loadHandle = State(cp).loadDataTimeoutHandler;
        if (loadHandle) {
            const state = State(cp);
            // Only remove the loader spinner when all containers have prices
            state.arrAwaitingPricesheets = state.arrAwaitingPricesheets.filter((xx) => xx != nContainerDef);
            if (state.arrAwaitingPricesheets.length > 0) {
                $.Msg(" ... waiting for " + state.arrAwaitingPricesheets.length + " more pricesheets ...");
                return;
            }
            $.CancelScheduled(loadHandle);
            state.loadDataTimeoutHandler = null;
            _PopOverlay();
            Init();
            return;
        }
        RefreshSubscription(cp);
        PriceRefreshTimerUpdate(cp);
        // Update Sticker data and update visible panel
        if (bNewPricesParsed) {
            if (nContainerDef == g_ActiveTournamentInfo.itemid_dynamic_stickers ||
                nContainerDef == g_ActiveTournamentInfo.itemid_champion_stickers ||
                nContainerDef == g_ActiveTournamentInfo.itemid_rankings_stickers) {
                _UpdateStickerData(cp);
            }
            else if (g_ActiveTournamentDynamicContainers.includes(nContainerDef)) {
                _UpdateKeyChainsData(cp);
            }
            State(cp).stopTileUpdate = false;
            _UpdateVisiblePanel(cp, true);
            // This is so we don't keep playing the price animation when using the dynamic list.
            // Otherwise every time a panel is reused it will play the animation. This feels odd after your start scrolling.
            $.Schedule(1, () => { State(cp).stopTileUpdate = true; });
            //Sync Shopping car prices
            ShoppingCart.cart.syncPrices((itemId) => {
                const item = State(cp).aFlatStickersData.find(i => i.itemId === itemId);
                return item ? item.price : undefined;
            });
        }
    }
    // Redraws the view on screen after a price update or a bookmark change, via its STORE_VIEWS row.
    function _UpdateVisiblePanel(cp, bDisableScroll = false) {
        _ActiveView()?.onRefresh?.(cp, bDisableScroll);
    }
    function GetNewMarketPrice(itemId) {
        const item = State($.GetContextPanel()).aFlatStickersData.find(i => i.itemId === itemId);
        return item ? item.price : undefined;
    }
    PopupMajorStore.GetNewMarketPrice = GetNewMarketPrice;
    function _SubscribeForAllTournamentItems() {
        g_ActiveTournamentDynamicContainers.forEach((id) => StoreAPI.VolatileShopSubscribe(id, true));
    }
    function GetSecondsUntilPendingPriceUpdateForAllTournamentItems() {
        let nSeconds = 0;
        g_ActiveTournamentDynamicContainers.forEach((id) => {
            const nThisPricesheet = StoreAPI.GetSecondsUntilPendingPriceUpdate(id);
            if (nThisPricesheet > 0) {
                if ((nSeconds <= 0) || (nThisPricesheet < nSeconds))
                    nSeconds = nThisPricesheet;
            }
        });
        return nSeconds;
    }
    PopupMajorStore.GetSecondsUntilPendingPriceUpdateForAllTournamentItems = GetSecondsUntilPendingPriceUpdateForAllTournamentItems;
    function RefreshSubscription(cp) {
        if (!cp || !cp.IsValid())
            return;
        CancelRefreshSubscription(cp);
        _SubscribeForAllTournamentItems();
        State(cp).refreshSubscriptionHandle = $.Schedule(150, () => RefreshSubscription(cp));
    }
    PopupMajorStore.RefreshSubscription = RefreshSubscription;
    function CancelRefreshSubscription(cp) {
        const handle = State(cp).refreshSubscriptionHandle;
        if (handle) {
            $.CancelScheduled(handle);
            State(cp).refreshSubscriptionHandle = null;
        }
    }
    PopupMajorStore.CancelRefreshSubscription = CancelRefreshSubscription;
    function PriceRefreshTimerUpdate(cp) {
        if (!cp || !cp.IsValid())
            return;
        CancelRefreshTimerUpdate(cp);
        const nSeconds = GetSecondsUntilPendingPriceUpdateForAllTournamentItems();
        const elRefresh = cp.FindChildInLayoutFile('id-major-store-refresh');
        const timer = cp.FindChildInLayoutFile('id-major-store-refresh-time');
        timer.text = $.Localize("#major_store_prices_updated");
        if (nSeconds <= 0) {
            CancelRefreshTimerUpdate(cp);
            elRefresh.SetPanelEvent('onmouseover', () => {
                UiToolkitAPI.ShowTextTooltip('id-major-store-refresh', '#major_store_prices_updated_tooltip');
            });
            elRefresh.SetPanelEvent('onmouseout', () => {
                UiToolkitAPI.HideTextTooltip();
            });
            elRefresh.SetHasClass('alert', false);
            return;
        }
        elRefresh.SetPanelEvent('onmouseover', () => {
            UiToolkitAPI.ShowTextTooltip('id-major-store-refresh', '#major_store_refesh_tooltip');
        });
        elRefresh.SetPanelEvent('onmouseout', () => {
            UiToolkitAPI.HideTextTooltip();
        });
        elRefresh.SetHasClass('alert', true);
        timer.SetDialogVariable('timer', FormatText.SecondsToDDHHMMSSWithSymbolSeperator(nSeconds));
        timer.text = nSeconds > 1 ?
            $.Localize('#major_store_refresh_timer', timer) :
            $.Localize('#major_store_refresh_soon');
        State(cp).priceRefreshHandler = $.Schedule(1, () => PriceRefreshTimerUpdate(cp));
    }
    PopupMajorStore.PriceRefreshTimerUpdate = PriceRefreshTimerUpdate;
    function CancelRefreshTimerUpdate(cp) {
        const handle = State(cp).priceRefreshHandler;
        if (handle) {
            $.CancelScheduled(handle);
            State(cp).priceRefreshHandler = null;
        }
    }
    PopupMajorStore.CancelRefreshTimerUpdate = CancelRefreshTimerUpdate;
    function _UpdateStickerData(cp) {
        // Regular and ranked stickers share one flat list; ranked entries are just tagged isRanked.
        _BuildStickerData(State(cp).aFlatStickersData, false);
        _BuildStickerData(State(cp).aFlatStickersData, true);
        State(cp).searchCache = null;
        // Rank every sticker so the top-40 badge works on any surface, not just one banner.
        // Sorts a copy, then stamps the rank onto the shared objects.
        [...State(cp).aFlatStickersData]
            .sort(_CompareByPopularity)
            .forEach((sticker, i) => { sticker.popularityRank = i; });
    }
    // Adds the regular (stickerids) or ranked (rankingids) stickers from the team/player/champion/org
    // sources. We look up existing entries by rawid so a price update patches them instead of duplicating.
    function _BuildStickerData(target, isRanked) {
        const map = MapDataById(target);
        const add = (oData) => _UpdateWithCurrentData(target, map.get(oData.rawId), oData, _GetStickerData);
        g_ActiveTournamentTeams.forEach(team => {
            (isRanked ? team.rankingids : team.stickerids).forEach(id => add({ rawId: id, isPlayer: false, isOrg: false, teamId: team.teamid, team: team.team, isChampion: false, isRanked }));
            team.players.forEach(player => (isRanked ? player.rankingids : player.stickerids).forEach(id => add({ rawId: id, isPlayer: true, isOrg: false, teamId: team.teamid, team: team.team, playerCode: player.code, isChampion: false, isRanked })));
            team.champions.forEach(player => (isRanked ? player.rankingids : player.stickerids).forEach(id => add({ rawId: id, isPlayer: true, isOrg: false, teamId: team.teamid, team: team.team, playerCode: player.code, isChampion: true, isRanked })));
        });
        (isRanked ? g_ActiveTournamentInfo.rankingids : g_ActiveTournamentInfo.stickerids).forEach(id => add({ rawId: id, isPlayer: false, isOrg: true, playerCode: g_ActiveTournamentInfo.location + ' ' + g_ActiveTournamentInfo.organization, isRanked }));
    }
    function _UpdateKeyChainsData(cp) {
        const highlights = g_ActiveTournamentHighlights;
        const mapKeyChains = MapDataById(State(cp).aFlatKeyChainData);
        State(cp).searchCache = null;
        highlights.forEach(group => {
            group.highlights.forEach(kc => {
                const oData = {
                    group_id: group.group_id,
                    itemid_dynamic_shop: group.itemid_dynamic_shop,
                    stage: group.stage,
                    kc_highlight: kc.kc_highlight,
                    teamid1: kc.teamid1,
                    teamid2: kc.teamid2,
                    map_name: kc.map_name,
                    name: kc.title,
                    desc: kc.desc,
                };
                _UpdateWithCurrentData(State(cp).aFlatKeyChainData, mapKeyChains.get(kc.kc_highlight), oData, _GetKeyChainData);
            });
        });
    }
    function MapDataById(savedFlatData) {
        const oldStickersData = new Map();
        if (savedFlatData && savedFlatData.length > 0) {
            for (let i = 0; i < savedFlatData.length; i++) {
                oldStickersData.set(('rawId' in savedFlatData[i]) ? savedFlatData[i].rawId : savedFlatData[i].kc_highlight, savedFlatData[i]);
            }
        }
        return oldStickersData;
    }
    function _UpdateWithCurrentData(aFlatStoredData, savedItemData, oData, _funcGetData) {
        // We look up the existing data to then update it when we receive a price update
        // If no date then just save the data
        if (savedItemData) {
            const livePrice = _GetCurrentPriceForItem(savedItemData.itemId);
            if (livePrice !== undefined && savedItemData.price !== undefined) {
                //Save old price
                if (savedItemData.price !== livePrice) {
                    savedItemData.oldPrice = savedItemData.price;
                    savedItemData.priceChangeRevealed = false; // a new change, not shown yet
                }
                savedItemData.price = livePrice;
                savedItemData.popularity = _GetCurrentTrendData(savedItemData.itemId, 'trend');
                const weeklyLow = _GetCurrentTrendData(savedItemData.itemId, 'low');
                const weeklyHigh = _GetCurrentTrendData(savedItemData.itemId, 'high');
                savedItemData.weeklyLow = weeklyLow;
                savedItemData.weeklyHigh = weeklyHigh;
                savedItemData.weeklyPctReductionFromHigh = (weeklyHigh > livePrice)
                    ? ((weeklyHigh - livePrice) * 100.0 / weeklyHigh) : 0.0;
            }
        }
        else {
            aFlatStoredData.push(_funcGetData(oData));
        }
    }
    function _GetStickerData(oData) {
        const itemId = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(defidxStickerItem, oData.rawId);
        const numRarity = InventoryAPI.GetItemRarity(itemId);
        const livePrice = _GetCurrentPriceForItem(itemId);
        const weeklyLow = _GetCurrentTrendData(itemId, 'low');
        const weeklyHigh = _GetCurrentTrendData(itemId, 'high');
        const weeklyPctReductionFromHigh = (weeklyHigh > livePrice)
            ? ((weeklyHigh - livePrice) * 100.0 / weeklyHigh) : 0.0;
        return {
            isPlayer: oData.isPlayer,
            isOrg: ('isOrg' in oData) ? oData.isOrg : false,
            rawId: oData.rawId,
            teamName: $.Localize('#CSGO_TeamID_' + oData.teamId),
            teamId: oData.teamId,
            teamTag: oData.team,
            playerCode: ('playerCode' in oData) ? oData.playerCode : '',
            realName: oData.isPlayer ? $.Localize('#SFUI_ProPlayer_' + oData.playerCode) : '',
            itemId: itemId,
            price: livePrice,
            rarity: numRarity,
            rarityLookup: $.Localize('#major_store_filter_type_' + numRarity),
            name: InventoryAPI.GetItemName(itemId),
            displayName: ItemInfo.GetFormattedName(itemId),
            // POPULARITY:
            // a numeric value between -100,000,000 and +100,000,000
            // negative value means popularity dropping, positive value means very popular, zero is neutral
            // we could have client-side analysis of trends and pick a threshold for display so that not everything had a green/red arrow
            popularity: _GetCurrentTrendData(itemId, 'trend'),
            weeklyLow: weeklyLow,
            weeklyHigh: weeklyHigh,
            weeklyPctReductionFromHigh: weeklyPctReductionFromHigh,
            champion: oData.isChampion,
            isRanked: ('isRanked' in oData) ? oData.isRanked : false
        };
    }
    function _GetKeyChainData(oData) {
        const itemId = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(defidxKeyChainItem, oData.kc_highlight);
        const livePrice = _GetCurrentPriceForItem(itemId);
        const weeklyLow = _GetCurrentTrendData(itemId, 'low');
        const weeklyHigh = _GetCurrentTrendData(itemId, 'high');
        const weeklyPctReductionFromHigh = (weeklyHigh > livePrice)
            ? ((weeklyHigh - livePrice) * 100.0 / weeklyHigh) : 0.0;
        return {
            group_id: oData.group_id,
            itemid_dynamic_shop: oData.itemid_dynamic_shop,
            kc_highlight: oData.kc_highlight,
            displayName: ItemInfo.GetFormattedName(itemId),
            stage: oData.stage,
            teamid1: oData.teamid1,
            teamid2: oData.teamid2,
            map_name: oData.map_name,
            desc: $.Localize(oData.desc),
            itemId: itemId,
            price: livePrice,
            name: $.Localize(oData.name),
            popularity: _GetCurrentTrendData(itemId, 'trend'),
            weeklyLow: weeklyLow,
            weeklyHigh: weeklyHigh,
            weeklyPctReductionFromHigh: weeklyPctReductionFromHigh
        };
    }
    function _GetCurrentPriceForItem(itemId) {
        return MissionsAPI.GetSeasonalOperationFauxCreditsCost(g_ActiveTournamentInfo.credits_id, itemId);
    }
    function _GetCurrentTrendData(itemId, szField) {
        return MissionsAPI.GetSeasonalOperationFauxItemTrend(g_ActiveTournamentInfo.credits_id, itemId, szField);
    }
    function UnreadyForDisplay() {
        $.Msg('PopupMajorStore UnReadyForDisplay: ' + $.GetContextPanel().id);
    }
    function _VariousButtonActionsAndEvents(cp) {
        cp.FindChildInLayoutFile('id-major-store-container').AddBlurPanel(cp.FindChildInLayoutFile('id-major-store-filters-panel'));
        cp.FindChildInLayoutFile('id-major-store-container').AddBlurPanel(cp.FindChildInLayoutFile('id-major-store-loading'));
        cp.FindChildInLayoutFile('id-major-store-container').AddBlurPanel(cp.FindChildInLayoutFile('id-major-store-search-results'));
        // Delayed list size
        cp.FindChildInLayoutFile('id-list-large-icons').SetPanelEvent('onactivate', () => {
            _MakeDelayedLoadList(cp);
        });
        cp.FindChildInLayoutFile('id-list-small-icons').SetPanelEvent('onactivate', () => {
            _MakeDelayedLoadList(cp);
        });
        cp.FindChildInLayoutFile('id-list-small-icons').checked = true;
        // Set Dropdown action
        _SortDropDown(cp).SetPanelEvent('oninputsubmit', () => {
            if (!m_bApplyingSort) {
                const selected = _SortDropDown(cp).GetSelected();
                _RememberViewSort(cp, selected ? selected.id : '');
            }
            _UpdateItemsList({ cp });
        });
        cp.FindChildInLayoutFile('id-popup-major-store-back-btn').SetPanelEvent('onactivate', () => _GoBack(cp));
        cp.FindChildInLayoutFile('id-major-store-balance').SetPanelEvent('onmouseover', () => {
            cp.FindChildInLayoutFile('id-major-store-balance').SetDialogVariable('local-price', StoreAPI.GetStoreItemTokensBundlePrice('' + g_ActiveTournamentInfo.itemid_charge, 100, ''));
            const tooltip = $.Localize('#major_store_balance_tooltip', cp.FindChildInLayoutFile('id-major-store-balance'));
            UiToolkitAPI.ShowTitleTextTooltip('id-major-store-balance', '#CSGO_TournamentPass_' + g_ActiveTournamentInfo.location + '_credits', tooltip);
        });
        cp.FindChildInLayoutFile('id-major-store-balance').SetPanelEvent('onmouseout', () => {
            UiToolkitAPI.HideTitleTextTooltip();
        });
        cp.FindChildInLayoutFile('id-major-store-receipt').SetPanelEvent('onmouseover', () => {
            UiToolkitAPI.ShowTextTooltip('id-major-store-receipt', '#major_store_balance_receipt');
        });
        cp.FindChildInLayoutFile('id-major-store-receipt').SetPanelEvent('onmouseout', () => {
            UiToolkitAPI.HideTextTooltip();
        });
        cp.FindChildInLayoutFile('id-major-store-receipt').SetPanelEvent('onactivate', () => {
            SteamOverlayAPI.OpenUrlInOverlayOrExternalBrowser("https://" + SteamOverlayAPI.GetSteamCommunityURL() + "/my/gcpd/" + SteamOverlayAPI.GetAppID() + "/?tab=creditsaudit");
        });
        // From the checkout
        function _Callback() {
            _UpdateBalance(cp);
        }
        ;
        const callback = _TrackJSCallback(cp, UiToolkitAPI.RegisterJSCallback(_Callback));
        cp.FindChildInLayoutFile('id-major-store-cart-btn').SetPanelEvent('onactivate', () => {
            $.DispatchEvent("CSGOPlaySoundEffect", "UIPanorama.loadout_sector_select", "MOUSE");
            const popupPanel = UiToolkitAPI.ShowCustomLayoutPopupParameters('id-popup-shopping-cart-checkout', 'file://{resources}/layout/popups/popup_shopping_cart_checkout.xml', '&callback=' + callback);
            popupPanel.Data().eventId = g_ActiveTournamentInfo.eventid;
        });
        cp.FindChildInLayoutFile('id-major-store-cart-btn').SetPanelEvent('onmouseover', () => {
            UiToolkitAPI.ShowTextTooltip('id-major-store-cart-btn', '#major_store_checkout_empty_desc');
        });
        cp.FindChildInLayoutFile('id-major-store-cart-btn').SetPanelEvent('onmouseout', () => {
            UiToolkitAPI.HideTextTooltip();
        });
        // Search text field Input
        const elSearchBox = cp.FindChildInLayoutFile('id-major-store-search-box');
        elSearchBox.SetPanelEvent('ontextentrychange', () => {
            _Debounce(cp, SEARCH_DEBOUNCE_HANDLE, .3, () => { _ShowSearchResults(cp, _GetItemsForSearch(cp, elSearchBox.text)); });
        });
        elSearchBox.SetPanelEvent('ontextentrysubmit', () => {
            _ShowSearchResults(cp, _GetItemsForSearch(cp, elSearchBox.text));
        });
        // The store-wide "see all": every series, no refinements.
        cp.FindChildInLayoutFile('id-major-store-see-all-teams-btn').SetPanelEvent('onactivate', () => {
            _OnActivateClearAll(cp);
            _SetActiveSeriesFilter(cp, NO_SERIES_FILTER);
            _ApplyViewSort(cp, VIEW_SORTS.AllItems);
            _ShowMainPanel(cp, VIEW_CONTENT);
            _SetActiveNavTab(cp, NAV_TAB_NONE);
        });
        // The per-carousel See All buttons are wired from STORE_NAV_TABS in _SetUpStoreNavTabs.
        //
        // Events for Full screen overlay panel that holds filters and search results
        //
        cp.FindChildInLayoutFile('id-major-store-filters-panel').SetPanelEvent('onactivate', () => {
            // Eat the clicks
        });
        cp.FindChildInLayoutFile('id-major-store-search-results').SetPanelEvent('onactivate', () => {
            // Eat the clicks
        });
        const elFloatingFilterPanel = cp.FindChildInLayoutFile('id-major-fullscreen-filter');
        // A click anywhere in the popup dismisses the sort menu. The content page has to accept
        // focus for that to work, since handing it focus is what closes the menu.
        cp.FindChildInLayoutFile('id-major-store-content-page').SetAcceptsFocus(true);
        cp.FindChildInLayoutFile('id-major-store-container').SetPanelEvent('onactivate', () => _CloseSortDropDown(cp));
        // Show filter panel
        cp.FindChildInLayoutFile('id-major-store-sort-filter-btn').SetPanelEvent('onactivate', () => {
            _UpdateFilterSections(cp);
            elFloatingFilterPanel.visible = true;
            _PushOverlay(cp, 'id-major-fullscreen-filter');
        });
        // Close filter overlay
        cp.FindChildInLayoutFile('id-major-fullscreen-filter-btn').SetPanelEvent('onactivate', () => {
            _PopOverlay();
        });
        // Close text search overlay
        cp.FindChildInLayoutFile('id-major-fullscreen-text-search-btn').SetPanelEvent('onactivate', () => {
            _PopOverlay();
        });
        // Filter close Button
        cp.FindChildInLayoutFile('id-major-store-filters-close').SetPanelEvent('onactivate', () => {
            _PopOverlay();
        });
        // Update Slider text when filter is finished show anim
        function fnOnPropertyTransitionEndEvent(panel, propertyName) {
            if (elFloatingFilterPanel === panel && propertyName === 'opacity') {
                if (elFloatingFilterPanel.visible === true && !panel.BIsTransparent()) {
                    return true;
                }
                if (propertyName === 'opacity') {
                    // Panel is visible and fully transparent
                    if (elFloatingFilterPanel.visible === true && elFloatingFilterPanel.BIsTransparent()) {
                        // Set visibility to false and unload resources
                        elFloatingFilterPanel.visible = false;
                        return true;
                    }
                }
                return false;
            }
        }
        $.RegisterEventHandler('PropertyTransitionEnd', elFloatingFilterPanel, fnOnPropertyTransitionEndEvent);
        AddMajorTokensAnim.SetTransitionEndEvent(cp.FindChildInLayoutFile('id-major-store-add-tokens'));
        const elBookmark = cp.FindChildInLayoutFile('id-major-store-banners-bookmarks');
        $.RegisterEventHandler('PropertyTransitionEnd', elBookmark, (panel, propertyName) => {
            if (elBookmark.id === panel.id && propertyName === 'opacity') {
                // Shown and fully transparent: collapse to unload resources. Uses the same 'hidden'
                // class as _RefreshCarousels so nothing writes .visible behind the class's back.
                if (!elBookmark.BHasClass('hidden') && elBookmark.BIsTransparent()) {
                    elBookmark.SetHasClass('hidden', true);
                    return true;
                }
            }
            return false;
        });
    }
    function _MakeDelayedLoadList(cp) {
        let lister = cp.FindChildInLayoutFile('id-major-store-items-lister');
        const btn = cp.FindChildInLayoutFile('id-list-large-icons');
        const selectedBtn = btn.GetSelectedButton();
        const snippetType = selectedBtn.GetAttributeString('data-type', '');
        if (lister && lister.IsValid() && snippetType == lister.GetAttributeString('data-type', '')) {
            _UpdateItemsList({ cp });
            return;
        }
        if (lister)
            lister.DeleteAsync(0);
        lister = $.CreatePanel('JSDelayLoadList', cp.FindChildInLayoutFile('id-major-store-content-page'), 'id-major-store-items-lister');
        lister.BLoadLayoutSnippet(snippetType);
        $.Schedule(.15, () => _UpdateItemsList({ cp }));
    }
    function _SetUpTitleBar(cp, eventId) {
        cp.SetDialogVariable('tournament_name', $.Localize('#CSGO_Tournament_Event_NameShort_' + eventId));
        cp.FindChildInLayoutFile('id-major-store-major-logo').SetImage('file://{images}/tournaments/events/tournament_logo_' + eventId + '.svg');
    }
    function _SetUpTeamsBanner(cp) {
        const teams = g_ActiveTournamentTeams;
        const elParent = cp.FindChildInLayoutFile('id-major-store-banner-teams');
        teams.forEach(team => {
            const elPanel = $.CreatePanel('Button', elParent, '');
            elPanel.BLoadLayoutSnippet('banner-team-box');
            elPanel.FindChildInLayoutFile('id-team-icon').SetImage('file://{images}/tournaments/teams/' + team.team + '.svg');
            elPanel.FindChildInLayoutFile('id-team-icon-blur').SetImage('file://{images}/tournaments/teams/' + team.team + '.svg');
            elPanel.SetDialogVariable('name', $.Localize('#CSGO_TeamID_' + team.teamid));
            elPanel.style.backgroundPosition = Math.floor(Math.random() * 100) + '% 50%';
            elPanel.SetPanelEvent('onactivate', () => {
                _SetUpTeamView(cp, team);
                _ShowMainPanel(cp, VIEW_TEAM);
                $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.submenu_leveloptions_select', 'MOUSE');
            });
        });
    }
    function _GetOrCreatePanel(elParent, id, cls) {
        return elParent.FindChildInLayoutFile(id)
            ?? $.CreatePanel('Panel', elParent, id, { class: cls });
    }
    // Panels are reused across refreshes, so a tile is built once then updated in place.
    function _GetOrCreateTile(elParent, id, snippet, onCreate) {
        let elTile = elParent.FindChildInLayoutFile(id);
        if (!elTile) {
            elTile = $.CreatePanel('Panel', elParent, id);
            elTile.BLoadLayoutSnippet(snippet);
            onCreate?.(elTile);
        }
        return elTile;
    }
    // Builds/refreshes a paged carousel of a single flat list.
    function _PopulateCarousel(elParent, cfg) {
        for (let i = 0; i < cfg.numToShow; i++) {
            const nPage = Math.floor(i / cfg.numTilesPerPage);
            const elPage = _GetOrCreatePanel(elParent, 'id-major-store-carousel-page-' + nPage, cfg.pageClass);
            cfg.onUpdateTile(_GetOrCreateTile(elPage, cfg.tileIdPrefix + i, cfg.tileSnippet, cfg.onCreateTile), i);
        }
    }
    function _SetUpPopularityBanner(cp) {
        const aSorted = [...State(cp).aFlatStickersData].sort(_CompareByPopularity);
        _PopulateCarousel(cp.FindChildInLayoutFile('id-major-store-banner-popular'), {
            numToShow: 40,
            numTilesPerPage: 5,
            pageClass: 'popup-major-store__banner__popular_page elCarouselPage',
            tileIdPrefix: 'id-carousel-sticker',
            tileSnippet: 'banner-popular-entry',
            onUpdateTile: (elPanel, i) => {
                elPanel.SetDialogVariableInt('position', i + 1);
                _UpdateTile(cp, elPanel.FindChildInLayoutFile('id-popular-tile'), aSorted, i);
            },
        });
    }
    function _GetBookmarkedItemsList(cp) {
        const itemsMap = new Map();
        for (const sticker of State(cp).aFlatStickersData) {
            itemsMap.set(sticker.rawId.toString(), sticker);
        }
        for (const keyChain of State(cp).aFlatKeyChainData) {
            itemsMap.set(keyChain.kc_highlight.toString(), keyChain);
        }
        return Bookmarks.ids().map(defIndex => itemsMap.get(defIndex)).filter((item) => item !== undefined).reverse();
    }
    function _SetUpBookmarkItemsBanner(cp) {
        const aSorted = _GetBookmarkedItemsList(cp);
        if (aSorted.length < 1) {
            cp.FindChildInLayoutFile('id-major-store-banners-bookmarks').SetHasClass('show', false);
            return;
        }
        // 'show' drives the fade; container visibility is owned by _RefreshCarousels.
        cp.FindChildInLayoutFile('id-major-store-banners-bookmarks').SetHasClass('show', true);
        const elParent = cp.FindChildInLayoutFile('id-major-store-banner-bookmarked');
        const numTilesPerPage = 8;
        const totalPages = Math.ceil(aSorted.length / numTilesPerPage);
        for (let i = 0; i < totalPages; i++) {
            let elCarouselPage = elParent.FindChildInLayoutFile('id-major-store-carousel-page-' + i);
            if (!elCarouselPage) {
                elCarouselPage = $.CreatePanel('Panel', elParent, 'id-major-store-carousel-page-' + i, { class: 'popup-major-store__banner__popular_page' });
                elCarouselPage.SetHasClass('small', true);
                elCarouselPage.SetHasClass('banner-bookmark', true);
            }
            const startIndex = i * numTilesPerPage;
            for (let j = 0; j < numTilesPerPage; j++) {
                let stickerIndex = startIndex + j;
                let elPanel = elCarouselPage.FindChildInLayoutFile('id-carousel-sticker' + stickerIndex);
                if (!elPanel) {
                    elPanel = $.CreatePanel('Panel', elCarouselPage, 'id-carousel-sticker' + stickerIndex);
                    // Load once: BLoadLayoutSnippet appends, so re-loading stacks duplicate tiles.
                    elPanel.BLoadLayoutSnippet('store-tile');
                }
                if (aSorted[stickerIndex]) {
                    const bIsSticker = 'rawId' in aSorted[stickerIndex];
                    elPanel.SetHasClass('keychain', !bIsSticker);
                    if (bIsSticker)
                        _UpdateTile(cp, elPanel, aSorted, stickerIndex);
                    else
                        _UpdateKeyChainsTile(cp, elPanel, aSorted, stickerIndex);
                    elPanel.SetHasClass('hidden', false);
                    elPanel.enabled = true;
                    elPanel.hittest = true;
                }
                else {
                    elPanel.SetHasClass('keychain', false);
                    elPanel.SetHasClass('is-final', false);
                    elPanel.SetHasClass('hidden', true);
                    elPanel.enabled = false;
                    elPanel.hittest = false;
                }
            }
        }
        if (elParent.Children().length > totalPages) {
            const numPanelsToDelete = elParent.Children().length - totalPages;
            const numPagesMade = elParent.Children().length - 1;
            for (let i = numPagesMade; i > (numPagesMade - numPanelsToDelete); i--) {
                elParent.Children()[i].DeleteAsync(0);
            }
        }
    }
    function _UpdateBookmarkSetting(cp, reusePanel, defidx) {
        Bookmarks.toggle(defidx);
        // Favourites can become empty/non-empty, so the tab set can change.
        _UpdateStoreNavTabs(cp);
        // Home carousels and the favourites list gain or lose the item, so redraw them in place.
        // Every other view already shows the toggle on the tile itself.
        if (_IsHomeActive() || State(cp).useBookMarkList) {
            _UpdateVisiblePanel(cp, true);
        }
    }
    function _SetUpOrgBanners(cp) {
        cp.SetDialogVariable('org-name', g_ActiveTournamentInfo.organization);
        const elParent = cp.FindChildInLayoutFile('id-major-store-banner-org-stickers');
        // Ranked first; sort is stable so each group keeps schema order.
        const aFilteredStickers = State(cp).aFlatStickersData
            .filter(sticker => sticker.isOrg)
            .sort((a, b) => Number(b.isRanked) - Number(a.isRanked));
        // number of stickers does not change so make them then update them.  
        aFilteredStickers.forEach((sticker, idx) => {
            let elPanel = elParent.FindChildInLayoutFile('id-org-sticker-' + idx);
            if (!elPanel) {
                elPanel = $.CreatePanel('Panel', elParent, 'id-org-sticker-' + idx);
                elPanel.BLoadLayoutSnippet('store-tile');
            }
            _UpdateTile(cp, elPanel, aFilteredStickers, idx);
        });
    }
    function _SetUpKeyChainsBanner(cp) {
        // Container visibility is owned by _RefreshCarousels; bail out only to skip building tiles.
        const aKeyChains = State(cp).aFlatKeyChainData;
        if (aKeyChains.length <= 1)
            return;
        // The banner shows a random subset in random order. Pick it once and keep it: re-renders
        // (price updates, bookmarking) must not reshuffle the carousel under the user.
        let aKeyChainsForBanner = State(cp).aKeyChainBannerItems;
        if (!aKeyChainsForBanner || aKeyChainsForBanner.length < 1) {
            const itemsMap = new Map();
            for (const item of aKeyChains) {
                itemsMap.set(item.kc_highlight.toString(), item);
            }
            aKeyChainsForBanner = [];
            const numItemsFromEachStage = 9;
            g_ActiveTournamentHighlights.forEach(group => {
                if (group.highlights.length === 0)
                    return;
                // Range/count clamped to the stage size so short stages can't index out of bounds.
                const randomGen = new UniqueRandomUtils.UniqueRandomGenerator(0, group.highlights.length - 1);
                const count = Math.min(numItemsFromEachStage, group.highlights.length);
                for (let i = 0; i < count; i++) {
                    // Out of unique picks means the stage is used up; stop rather than duplicate.
                    const nRandom = randomGen.next();
                    if (nRandom === null)
                        break;
                    const mapped = itemsMap.get(group.highlights[nRandom].kc_highlight.toString());
                    if (mapped)
                        aKeyChainsForBanner.push(mapped);
                }
            });
            for (let i = aKeyChainsForBanner.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [aKeyChainsForBanner[i], aKeyChainsForBanner[j]] = [aKeyChainsForBanner[j], aKeyChainsForBanner[i]];
            }
            State(cp).aKeyChainBannerItems = aKeyChainsForBanner;
        }
        _PopulateCarousel(cp.FindChildInLayoutFile('id-major-store-banner-keychains'), {
            numToShow: aKeyChainsForBanner.length,
            numTilesPerPage: 5,
            pageClass: 'popup-major-store__banner__popular_page',
            tileIdPrefix: 'id-carousel-keychain',
            tileSnippet: 'store-tile',
            onCreateTile: (elPanel) => {
                elPanel.SetHasClass('keychain', true);
                elPanel.SetHasClass('keychain-banner', true);
            },
            onUpdateTile: (elPanel, i) => _UpdateKeyChainsTile(cp, elPanel, aKeyChainsForBanner, i),
        });
    }
    function _SetUpChampionsBanner(cp) {
        // Container visibility is owned by _RefreshCarousels; bail out only to skip building tiles.
        const aChamps = [...State(cp).aFlatStickersData].sort(_CompareByPopularity).filter(sticker => sticker.champion);
        if (aChamps.length < 1)
            return;
        _PopulateCarousel(cp.FindChildInLayoutFile('id-major-store-banner-champions'), {
            numToShow: aChamps.length,
            numTilesPerPage: 8,
            pageClass: 'popup-major-store__banner__popular_page banner-bookmark small',
            tileIdPrefix: 'id-carousel-champs',
            tileSnippet: 'store-tile',
            onUpdateTile: (elPanel, i) => _UpdateTile(cp, elPanel, aChamps, i),
        });
    }
    //
    // Ranked banner: every page shows one row per rarity tier, top to bottom. Each row is sorted by
    // price and paginates on its own, so page 2's top row continues where page 1's top row stopped.
    //
    const RANKED_ROW_RARITIES = [6, 5, 4];
    const RANKED_TILES_PER_ROW = 8;
    const RANKED_MAX_PAGES = 4;
    /** Ranked stickers as one price-sorted ( high to low ) row per entry in RANKED_ROW_RARITIES. */
    function _GetRankedRarityRows(cp) {
        const aRanked = State(cp).aFlatStickersData.filter(sticker => sticker.isRanked);
        return RANKED_ROW_RARITIES.map(nRarity => aRanked
            .filter(sticker => sticker.rarity === nRarity)
            .sort((a, b) => (b.price - a.price) || _CompareByPopularity(a, b)));
    }
    /** Rows turn the page together, so the longest row decides how many pages there are. */
    function _GetRankedPageCount(aRows) {
        const nLongestRow = Math.max(0, ...aRows.map(aRow => aRow.length));
        return Math.min(RANKED_MAX_PAGES, Math.ceil(nLongestRow / RANKED_TILES_PER_ROW));
    }
    /** Fills one rarity row with its slice of a page. Unused slots collapse so the grid keeps its shape. */
    function _FillRankedRarityRow(cp, elRow, aRow, nRarity, nPage) {
        const nStart = nPage * RANKED_TILES_PER_ROW;
        const aPageStickers = aRow.slice(nStart, nStart + RANKED_TILES_PER_ROW);
        for (let nSlot = 0; nSlot < RANKED_TILES_PER_ROW; nSlot++) {
            const elTile = _GetOrCreateTile(elRow, 'id-ranked-tile-' + nRarity + '-' + (nStart + nSlot), 'store-tile');
            const bHasSticker = nSlot < aPageStickers.length;
            elTile.visible = bHasSticker;
            if (bHasSticker)
                _UpdateTile(cp, elTile, aPageStickers, nSlot);
        }
    }
    function _SetUpRankedBanner(cp) {
        // Container visibility is owned by _RefreshCarousels; bail out only to skip building tiles.
        const aRows = _GetRankedRarityRows(cp);
        const nPages = _GetRankedPageCount(aRows);
        if (nPages < 1)
            return;
        const elCarousel = cp.FindChildInLayoutFile('id-major-store-banner-ranked');
        for (let nPage = 0; nPage < nPages; nPage++) {
            const elPage = _GetOrCreatePanel(elCarousel, 'id-major-store-carousel-page-' + nPage, 'popup-major-store__banner__popular_page banner-bookmark small rarity-rows');
            aRows.forEach((aRow, nRow) => {
                const nRarity = RANKED_ROW_RARITIES[nRow];
                const elRow = _GetOrCreatePanel(elPage, 'id-ranked-row-' + nRarity, 'popup-major-store__banner__rarity-row');
                elRow.visible = aRow.length > 0;
                _FillRankedRarityRow(cp, elRow, aRow, nRarity, nPage);
            });
        }
    }
    function _SetUpTeamView(cp, team) {
        // Set Panel Title
        const elPanel = cp.FindChildInLayoutFile(VIEW_TEAM);
        elPanel.Data().DisplayedTeam = team;
        const teamName = $.Localize('#CSGO_TeamID_' + team.teamid);
        elPanel.SetDialogVariable('team-name', teamName);
        const elTilesContainer = cp.FindChildInLayoutFile('id-major-store-team-tiles');
        // Make and update the tiles 1 team 5 players
        const numTiles = 6;
        const randomGen = new UniqueRandomUtils.UniqueRandomGenerator(0, 7);
        for (let i = 0; i < numTiles; i++) {
            const elPackTile = elTilesContainer.FindChildInLayoutFile('sticker-pack-' + i);
            const elPackLabel = elPackTile.FindChildInLayoutFile('team-pack-major');
            elPackLabel.SetDialogVariableLocString('event-name', '#CSGO_Tournament_Event_Location_' + g_ActiveTournamentInfo.eventid);
            elPackLabel.text = $.Localize('#major_store_team_stickers-made', elPackLabel);
            const elBg = elPackTile.FindChildInLayoutFile('team-pack-bg-logo');
            elBg.SetImage('file://{images}/tournaments/teams/' + team.team + '.svg');
            elPackTile.SetDialogVariable('title', i === 0 ? teamName : team.players[i - 1].nick);
            elPackTile.SetHasClass('player', i > 0);
            const elStickerContainer = elPackTile.FindChildInLayoutFile('team-pack-icons');
            // const stickerIds = i === 0 ? team.stickerids : team.players[ i - 1 ].stickerids;
            const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
            randomGen.reset();
            let xpos = 0;
            let prices = [];
            // Get the upto date sticker data for the team and players we want.
            const stickers = i === 0 ?
                State(cp).aFlatStickersData.filter(sticker => (!sticker.isPlayer && sticker.teamId === team.teamid)) :
                State(cp).aFlatStickersData.filter(sticker => (sticker.isPlayer && sticker.playerCode === team.players[i - 1].code));
            stickers.forEach((id, idx) => {
                prices.push(stickers[idx].price);
                let sticker = elStickerContainer.FindChild('pack-sticker' + idx);
                if (!sticker)
                    sticker = $.CreatePanel('ItemImage', elStickerContainer, 'pack-sticker' + idx, { scaling: 'stretch-to-fit-preserve-aspect' });
                sticker.itemid = stickers[idx].itemId;
                // The generator only yields 8 unique values and a pack can hold more stickers
                // (results + champions), so wrap once it runs dry rather than reading null.
                const zIndex = randomGen.next() ?? (idx % 8);
                const rotationSetting = zIndex == 3 ? getRandomInt(-15, 15) : getRandomInt(-95, 85);
                if (idx % 4 === 0) {
                    xpos = 0;
                }
                sticker.style.transform = 'rotateZ(' + rotationSetting + 'deg) translateY(-' + getRandomInt(8, 30) + 'px) translateX(' + getRandomInt(xpos, xpos + 35) + 'px)';
                xpos = xpos + 50;
                sticker.style.zIndex = ((idx === stickers.length - 1) && (stickers[idx].champion)) ? '9;' : zIndex + ';';
                sticker.style.brightness = zIndex === 0 ? '.5' : zIndex === 1 ? '.7' : zIndex === 2 ? '.8' : zIndex === 3 ? '1.1' : '1';
            });
            elStickerContainer.Children().forEach((sticker, index) => { if (index >= stickers.length) {
                sticker.DeleteAsync(0);
            } });
            elPackTile.SetDialogVariableInt('low-price', Math.min(...prices));
            elPackTile.SetDialogVariableInt('high-price', Math.max(...prices));
            elPackTile.SetPanelEvent('onactivate', () => {
                _ShowMainPanel(cp, VIEW_SINGLE);
                _SetUpSingleView(cp, stickers);
                $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.submenu_leveloptions_select', 'MOUSE');
            });
        }
    }
    function _SetUpSingleView(cp, aStickers) {
        const elPanel = cp.FindChildInLayoutFile(VIEW_SINGLE);
        elPanel.SetDialogVariable('team-name', aStickers[0].isPlayer ? aStickers[0].playerCode : $.Localize('#CSGO_TeamID_' + aStickers[0].teamId));
        const numTiles = aStickers.length;
        const elParent = elPanel.FindChildInLayoutFile('id-major-store-single-tiles');
        for (let i = 0; i < numTiles; i++) {
            let elPackTile = elParent.FindChildInLayoutFile('sticker-single-' + i);
            if (!elPackTile) {
                elPackTile = $.CreatePanel('Panel', elParent, 'sticker-single-' + i);
                elPackTile.BLoadLayoutSnippet('store-tile');
            }
            _UpdateTile(cp, elPackTile, aStickers, i);
        }
        elParent.Children().forEach((sticker, index) => { if (index >= aStickers.length) {
            sticker.DeleteAsync(0);
        } });
        elPanel.Data().SingleViewDisplayedStickers = aStickers;
    }
    // Re-run the builders with what the view last showed, for price updates while it is on screen.
    function _RefreshTeamView(cp) {
        const team = cp.FindChildInLayoutFile(VIEW_TEAM).Data().DisplayedTeam;
        if (team) {
            _SetUpTeamView(cp, team);
        }
    }
    function _RefreshSingleView(cp) {
        const aStickers = cp.FindChildInLayoutFile(VIEW_SINGLE).Data().SingleViewDisplayedStickers;
        if (aStickers) {
            _SetUpSingleView(cp, aStickers);
        }
    }
    function _UpdateBalance(cp) {
        const idxLookup = InventoryAPI.GetCacheTypeElementIndexByKey('SeasonalOperations', g_ActiveTournamentInfo.credits_id);
        let nRedeemableBalance = 0;
        if (g_ActiveTournamentInfo.credits_id == InventoryAPI.GetCacheTypeElementFieldByIndex('SeasonalOperations', idxLookup, 'season_value')) {
            // This could come back "undefined" or "null" and should be treated as zero
            nRedeemableBalance = InventoryAPI.GetCacheTypeElementFieldByIndex('SeasonalOperations', idxLookup, 'redeemable_balance');
            nRedeemableBalance = (nRedeemableBalance === null || nRedeemableBalance === undefined) ? 0 : nRedeemableBalance;
        }
        if (State(cp).activatedCredits > 0) {
            const elNotification = cp.FindChildInLayoutFile('id-major-store-add-tokens');
            _PushOverlay(cp, 'id-major-store-add-tokens');
            const tempBalance = nRedeemableBalance - State(cp).activatedCredits;
            cp.SetDialogVariableInt('balance', tempBalance);
            function CallAtEndAnimation() {
                // update the local balance to the new value at the end of the animation
                _PopOverlay();
                cp.FindChildInLayoutFile('id-major-store-balance').TriggerClass('popup-major-store__top-bar__balance-anim');
                cp.SetDialogVariableInt('balance', nRedeemableBalance);
            }
            AddMajorTokensAnim.StartAnim(elNotification, cp.FindChildInLayoutFile('id-major-store-balance'), State(cp).activatedCredits, CallAtEndAnimation);
            State(cp).activatedCredits = 0; // reset incase panel is called again
        }
        else {
            cp.SetDialogVariableInt('balance', nRedeemableBalance);
        }
    }
    function _UpdateItemsList(oSettings) {
        // Empty favourites shows the hint; nothing to build.
        if (_UpdateFavoritesEmptyState(oSettings.cp))
            return;
        const elParent = oSettings.cp.FindChildInLayoutFile('id-major-store-content-page');
        let elLister = elParent.FindChildInLayoutFile('id-major-store-items-lister');
        if (!elLister)
            return; // this element wasn't created yet
        const filteredList = _GetFilteredSortedIds(oSettings);
        elLister.SetLoadListItemFunction((elLister, nPanelIdx, reusePanel) => {
            const bIsSticker = 'rawId' in filteredList[nPanelIdx];
            if (!reusePanel || !reusePanel.IsValid()) {
                reusePanel = $.CreatePanel('Panel', elLister, '');
                reusePanel.BLoadLayoutSnippet('store-tile');
            }
            if (bIsSticker) {
                _UpdateTile(oSettings.cp, reusePanel, filteredList, nPanelIdx);
            }
            else {
                _UpdateKeyChainsTile(oSettings.cp, reusePanel, filteredList, nPanelIdx);
            }
            reusePanel.SetHasClass('keychain', !bIsSticker);
            return reusePanel;
        });
        elLister.UpdateListItems(filteredList.length);
        oSettings.cp.SetDialogVariableInt('item-count', filteredList.length);
        if (!oSettings.bDisableScroll)
            elLister.ScrollToTop();
    }
    // Reads the current filter/sort UI state into a settings object. No DOM mutation.
    function _ReadFilterSettings(cp) {
        const elDropDown = _SortDropDown(cp);
        const aTeams = _GetFilteredTeams(cp);
        const aRarities = _GetFilteredRarities(cp);
        const btnTeamOnly = cp.FindChildInLayoutFile('id-major-store-filter-team');
        const btnPlayerOnly = cp.FindChildInLayoutFile('id-major-store-filter-player');
        const btnRankedOnly = cp.FindChildInLayoutFile('id-major-store-filter-ranked');
        const btnChampionsOnly = cp.FindChildInLayoutFile('id-major-store-filter-champions');
        const btnMajorOnly = cp.FindChildInLayoutFile('id-major-store-filter-major');
        const btnKeyChainsOnly = cp.FindChildInLayoutFile('id-major-store-filter-keychains').FindChildInLayoutFile('id-slider-btn');
        const elSearchBox = cp.FindChildInLayoutFile('id-major-store-search-box');
        const selectedSort = elDropDown.GetSelected();
        const sortOption = SORT_OPTIONS[selectedSort ? selectedSort.id : ''] ?? SORT_OPTIONS['weekly-high-low'];
        const sortType = sortOption.field;
        const sortDirection = sortOption.direction;
        return btnKeyChainsOnly.checked
            ? {
                selectedTeamIds: [],
                sort: sortType,
                rarity: [],
                teamsOnly: false,
                playersOnly: false,
                keyChainsOnly: true,
                rankedOnly: false,
                championsOnly: false,
                majorOnly: false,
                sortDirection: sortDirection,
                searchText: elSearchBox.text
            }
            : {
                selectedTeamIds: aTeams.flatMap(team => team.Data().teamid),
                sort: sortType,
                rarity: aRarities.flatMap(panel => panel.Data().rarity),
                teamsOnly: btnTeamOnly.checked,
                playersOnly: btnPlayerOnly.checked,
                keyChainsOnly: false,
                rankedOnly: btnRankedOnly.checked,
                championsOnly: btnChampionsOnly.checked,
                majorOnly: btnMajorOnly.checked,
                sortDirection: sortDirection,
                searchText: elSearchBox.text
            };
    }
    // Rebuilds the nav-bar chips that mirror the currently-selected filters, and toggles the clear-all controls.
    function _RenderActiveFilterChips(cp) {
        let numFiltersSelected = 0;
        const elNavBarFiltersParent = cp.FindChildInLayoutFile('id-major-store-filters-active');
        elNavBarFiltersParent.Children().forEach(btn => btn.DeleteAsync(0));
        const fnAddChip = (elToggle, loc, chipId) => {
            if (!elToggle || !elToggle.checked || !elToggle.enabled) {
                return;
            }
            numFiltersSelected++;
            _MakeNavBarFilterButton(cp, elNavBarFiltersParent, elToggle, loc, chipId);
        };
        _GetFilteredTeams(cp).forEach(btn => fnAddChip(btn, '#CSGO_TeamID_' + btn.Data().teamid, 'id-filter-active-r-' + btn.Data().teamid));
        _GetFilteredRarities(cp).forEach(btn => fnAddChip(btn, '#major_store_filter_type_' + btn.Data().rarity, 'id-filter-active-r-' + btn.Data().rarity));
        REFINEMENT_FILTERS.forEach(f => fnAddChip(cp.FindChildInLayoutFile(f.toggleId), f.loc, f.chipId));
        // Series is tab-owned, so it only earns a chip in views where the user picks it.
        if (_IsMixedContentView(cp)) {
            SERIES_FILTERS.forEach(f => fnAddChip(cp.FindChildInLayoutFile(f.toggleId), f.loc, f.chipId));
        }
        fnAddChip(cp.FindChildInLayoutFile('id-major-store-filter-keychains').FindChildInLayoutFile('id-slider-btn'), '#major_store_filter_type_keychains_only', 'id-filter-active-k-only');
        const elSearchBox = cp.FindChildInLayoutFile('id-major-store-search-box');
        if (elSearchBox.text) {
            numFiltersSelected++;
            const elActiveFilterBtn = $.CreatePanel('Button', elNavBarFiltersParent, 'id-filter-active-search-txt');
            elActiveFilterBtn.BLoadLayoutSnippet('active-filter-button');
            elActiveFilterBtn.SetDialogVariable('search-text', elSearchBox.text);
            elActiveFilterBtn.SetDialogVariable('name', $.Localize('#major_store_filter_type_search_text', elActiveFilterBtn));
            elNavBarFiltersParent.MoveChildBefore(elActiveFilterBtn, elNavBarFiltersParent.Children()[0]);
            elActiveFilterBtn.SetPanelEvent('onactivate', () => {
                _ClearTextSearch(cp);
                _UpdateItemsList({ cp });
                elActiveFilterBtn.DeleteAsync(0);
            });
        }
        // Clear-all controls only make sense with more than one active filter.
        cp.FindChildInLayoutFile('id-filter-active-clear_all').visible = numFiltersSelected > 1;
        cp.FindChildInLayoutFile('id-major-store-filters-clear').visible = numFiltersSelected > 1;
    }
    function _MakeNavBarFilterButton(cp, elParent, selectedFilterBtn, locString, idForBtn) {
        const elActiveFilterBtn = $.CreatePanel('Button', elParent, idForBtn);
        elActiveFilterBtn.BLoadLayoutSnippet('active-filter-button');
        elActiveFilterBtn.SetDialogVariable('name', $.Localize(locString, selectedFilterBtn));
        elActiveFilterBtn.SetPanelEvent('onactivate', () => {
            selectedFilterBtn.checked = false;
            // Dropping charms-only gives the sticker refinements back, same as unticking it in the panel.
            if (elActiveFilterBtn.id === 'id-filter-active-k-only') {
                _EnableDisableFilterPanelBtns(cp, false);
            }
            _UpdateItemsList({ cp });
            elActiveFilterBtn.DeleteAsync(0);
        });
    }
    function _OnActivateClearAll(cp, doNotClearSearch = false) {
        const elFilterPanel = cp.FindChildInLayoutFile('id-major-store-filters-panel');
        elFilterPanel.FindChildInLayoutFile('id-major-store-filter-keychains').FindChildInLayoutFile('id-slider-btn').checked = false;
        elFilterPanel.FindChildrenWithAttributeTraverse('filter-button').forEach(btn => { btn.checked = false, btn.enabled = true; });
        State(cp).useBookMarkList = false;
        if (!doNotClearSearch) {
            _ClearTextSearch(cp);
        }
        // Sort is not a filter, so it is left alone. Each navigation sets its own via _ApplyViewSort.
    }
    function _ClearTextSearch(cp) {
        const elSearchBox = cp.FindChildInLayoutFile('id-major-store-search-box');
        elSearchBox.ClearSelection();
        elSearchBox.text = '';
    }
    function _SetUpKeyChainsPage(cp) {
        const elParent = cp.FindChildInLayoutFile(VIEW_CHARMS);
        const numStages = g_ActiveTournamentHighlights.length;
        for (let i = numStages - 1; i >= 0; --i) {
            const stage = g_ActiveTournamentHighlights[i];
            let elPanel = elParent.FindChildInLayoutFile('id-keychains-stage-' + stage.group_id);
            if (!elPanel) {
                elPanel = $.CreatePanel('Panel', elParent, 'id-keychains-stage-' + stage.group_id);
                elPanel.BLoadLayoutSnippet('keychain-section');
                elPanel.SetDialogVariable('stage-title', $.Localize('#CSGO_Tournament_Event_Stage_' + stage.stage));
            }
            const keyChains = State(cp).aFlatKeyChainData.filter((keychain) => keychain.stage === stage.stage);
            const elContainer = elPanel.FindChildInLayoutFile('id-keychains-container');
            keyChains.forEach((keychain, idx) => {
                let elTile = elParent.FindChildInLayoutFile('id-keychain-' + keychain.kc_highlight);
                if (!elTile) {
                    elTile = $.CreatePanel('Panel', elContainer, 'id-keychain-' + keychain.kc_highlight);
                    elTile.BLoadLayoutSnippet('store-tile');
                    elTile.SetHasClass('keychain', true);
                    elTile.SetHasClass('keychain-banner', true);
                }
                _UpdateKeyChainsTile(cp, elTile, keyChains, idx);
            });
        }
    }
    function _UpdateTile(cp, reusePanel, filteredList, nPanelIdx) {
        const stickerData = filteredList[nPanelIdx];
        reusePanel.SetDialogVariable('title', stickerData.isPlayer ?
            stickerData.playerCode :
            stickerData.isOrg ?
                g_ActiveTournamentInfo.organization :
                stickerData.teamName);
        _UpdatePriceAnimOnTile(stickerData, reusePanel, cp);
        _SetPriceDataOnTile(stickerData, reusePanel);
        _ShoppingCartControlsOnTile(stickerData, reusePanel);
        _UpdateBookmarkOnTile(stickerData.rawId, reusePanel, cp);
        reusePanel.FindChildInLayoutFile('id-store-item-rarity').SetImage('file://{images}/icons/ui/sticker_rarity_' + stickerData.rarity + '.svg');
        reusePanel.SwitchClass('rarity', 'rarity-' + stickerData.rarity);
        reusePanel.SwitchClass('sticker-type', stickerData.champion ? 'champion' : stickerData.isRanked ? 'ranked' : '');
        reusePanel.FindChildInLayoutFile('id-store-item-rarity-bar').style.washColor = InventoryAPI.GetItemRarityColor(stickerData.itemId);
        reusePanel.SetHasClass('is-final', false);
        // Top-40 badge; popularityRank is stamped on every sticker in _UpdateStickerData.
        reusePanel.FindChildInLayoutFile('id-store-item-hot-trend').SetHasClass('show', stickerData.popularityRank < 40);
        reusePanel.SetHasClass('is-player', stickerData.isPlayer);
        // Image
        reusePanel.FindChildInLayoutFile('id-store-item-image').itemid = stickerData.itemId;
        reusePanel.FindChildInLayoutFile('id-store-item-team-logo').SetImage(stickerData.isOrg ?
            'file://{images}/tournaments/events/tournament_logo_' + g_ActiveTournamentInfo.eventid + '.svg' :
            'file://{images}/tournaments/teams/' + stickerData.teamTag + '.svg');
        reusePanel.SetPanelEvent('onmouseover', () => {
            _MakeModelPanel(reusePanel, stickerData.itemId);
            reusePanel.FindChildInLayoutFile('id-store-item-real-price').SetHasClass('show', stickerData.price >= 100);
            reusePanel.SetDialogVariable('local-price', StoreAPI.GetStoreItemTokensBundlePrice('' + g_ActiveTournamentInfo.itemid_charge, stickerData.price, ''));
        });
        reusePanel.SetPanelEvent('onmouseout', () => {
            reusePanel.FindChildInLayoutFile('id-store-item-real-price').SetHasClass('show', false);
            _DeleteModelPanel(reusePanel);
        });
        // The model is only built on hover, so a list re-render under a stationary cursor would
        // leave the previous item's model up until the next mouse out/in.
        _RebindOpenModelPanel(reusePanel, stickerData.itemId);
        reusePanel.FindChildInLayoutFile('id-inspect-sticker').SetPanelEvent('onactivate', () => {
            _OpenFullscreenInspect(cp, stickerData);
        });
    }
    // Repoints an already-open hover model at a new item. Does not create one.
    function _RebindOpenModelPanel(reusePanel, itemId) {
        const MapPanel = reusePanel.FindChildInLayoutFile('id-store-item-model');
        if (MapPanel && MapPanel.IsValid())
            MapPanel.SetItemItemId(itemId, '');
    }
    function _MakeModelPanel(reusePanel, itemId) {
        // Model Panel
        let elParent = reusePanel.FindChildInLayoutFile('id-store-item-image_container');
        let MapPanel = elParent.FindChildInLayoutFile('id-store-item-model');
        if (!MapPanel) {
            MapPanel = $.CreatePanel('MapItemPreviewPanel', elParent, 'id-store-item-model', {
                class: 'major-store__item-tile__model',
                "require-composition-layer": "true",
                'transparent-background': true,
                'disable-depth-of-field': true,
                player: "false",
                map: "ui/xpshop_item",
                initial_entity: 'item',
                active_item_idx: 0,
                camera: 'camera_weapon_7',
                mouse_rotate: "false",
                auto_recenter: true,
                tabindex: "auto",
                selectionpos: "auto",
                hittest: "true",
                hide_while_waiting_for_composite_materials: "false"
            });
            MapPanel.SetRotationLimits(60, 45);
            MapPanel.SetAutoRotateAmount(20, -2);
            MapPanel.SetAutoRotatePeriod(6, 6);
            let nRenderInterval = 1;
            MapPanel.SetRenderInterval(nRenderInterval);
        }
        // Always rebind: tiles are recycled, and a pending DeleteAsync leaves the old panel findable,
        // so a surviving panel would otherwise keep showing the item it was created with.
        MapPanel.SetItemItemId(itemId, '');
    }
    function _DeleteModelPanel(reusePanel) {
        let MapPanel = reusePanel.FindChildInLayoutFile('id-store-item-model');
        if (MapPanel !== null && MapPanel.IsValid()) {
            MapPanel.DeleteAsync(0);
        }
    }
    function _UpdateKeyChainsTile(cp, reusePanel, filteredList, nPanelIdx) {
        const keychainData = filteredList[nPanelIdx];
        reusePanel.SetDialogVariable('title', keychainData.name);
        _UpdatePriceAnimOnTile(keychainData, reusePanel, cp);
        _SetPriceDataOnTile(keychainData, reusePanel);
        _ShoppingCartControlsOnTile(keychainData, reusePanel);
        _UpdateBookmarkOnTile(keychainData.kc_highlight, reusePanel, cp);
        reusePanel.FindChildInLayoutFile('id-store-item-hot-trend').SetHasClass('show', false);
        reusePanel.SetHasClass('is-player', false);
        reusePanel.SetHasClass('is-final', keychainData.stage === 97);
        reusePanel.SetDialogVariable('stage', $.Localize('#CSGO_Tournament_Event_Stage_' + keychainData.stage));
        // Image
        reusePanel.FindChildInLayoutFile('id-store-item-image').itemid = keychainData.itemId;
        // Teams
        reusePanel.FindChildInLayoutFile('id-store-item-team-1').SetImage('file://{images}/tournaments/teams/' + PredictionsAPI.GetTeamTag(keychainData.teamid1) + '.svg');
        reusePanel.FindChildInLayoutFile('id-store-item-team-2').SetImage('file://{images}/tournaments/teams/' + PredictionsAPI.GetTeamTag(keychainData.teamid2) + '.svg');
        reusePanel.FindChildInLayoutFile('id-store-item-team-bg-1').SetImage('file://{images}/tournaments/teams/' + PredictionsAPI.GetTeamTag(keychainData.teamid1) + '.svg');
        reusePanel.FindChildInLayoutFile('id-store-item-team-bg-2').SetImage('file://{images}/tournaments/teams/' + PredictionsAPI.GetTeamTag(keychainData.teamid2) + '.svg');
        reusePanel.SetPanelEvent('onmouseover', () => {
            if (jsTooltipDelayHandle) {
                $.CancelScheduled(jsTooltipDelayHandle);
                jsTooltipDelayHandle = null;
            }
            jsTooltipDelayHandle = $.Schedule(.4, () => {
                {
                    _ShowVideoClip(reusePanel, keychainData.itemId);
                }
            });
            reusePanel.FindChildInLayoutFile('id-store-item-real-price').SetHasClass('show', keychainData.price >= 100);
            reusePanel.SetDialogVariable('local-price', StoreAPI.GetStoreItemTokensBundlePrice('' + g_ActiveTournamentInfo.itemid_charge, keychainData.price, ''));
        });
        reusePanel.SetPanelEvent('onmouseout', () => {
            if (jsTooltipDelayHandle) {
                $.CancelScheduled(jsTooltipDelayHandle);
                jsTooltipDelayHandle = null;
            }
            reusePanel.FindChildInLayoutFile('id-store-item-real-price').SetHasClass('show', false);
            _HideVideoClip(reusePanel, keychainData.itemId);
        });
        // A sticker tile recycled into a charm tile can still hold a 3D model, and a clip already
        // playing under a stationary cursor would keep showing the previous charm.
        _DeleteModelPanel(reusePanel);
        if (reusePanel.FindChildTraverse('id-store-item-movie-container')?.BHasClass('play'))
            _ShowVideoClip(reusePanel, keychainData.itemId);
        reusePanel.FindChildInLayoutFile('id-inspect-sticker').SetPanelEvent('onactivate', () => {
            _OpenFullscreenInspect(cp, keychainData);
        });
    }
    let jsTooltipDelayHandle = null;
    function _ShowVideoClip(elPanel, itemId) {
        const reelId = InventoryAPI.GetItemAttributeValue(itemId, '{uint32}keychain slot 0 highlight');
        if (reelId) {
            const reelJson = InventoryAPI.BuildHighlightReelSchemaJSON(reelId);
            const reelSchemaDef = JSON.parse(reelJson);
            const videoPlayerContainer = elPanel.FindChildTraverse('id-store-item-movie-container');
            const videoPlayer = elPanel.FindChildTraverse('id-store-item-movie');
            if (videoPlayerContainer && videoPlayer) {
                videoPlayerContainer.AddClass('play');
                videoPlayer.AddClass('play');
                videoPlayer.SetMovie(reelSchemaDef["url_480p"]);
                videoPlayer.Play();
            }
        }
    }
    function _HideVideoClip(elPanel, itemId) {
        if (InventoryAPI.GetItemAttributeValue(itemId, '{uint32}keychain slot 0 highlight')) {
            const videoPlayerContainer = elPanel.FindChildTraverse('id-store-item-movie-container');
            const videoPlayer = elPanel.FindChildTraverse('id-store-item-movie');
            if (videoPlayerContainer && videoPlayer) {
                videoPlayerContainer.RemoveClass('play');
                videoPlayer.RemoveClass('play');
                videoPlayer.Stop();
            }
        }
    }
    function _UpdatePriceAnimOnTile(stickerData, reusePanel, cp) {
        const elChange = reusePanel.FindChildInLayoutFile('id-store-item-price-change');
        // Ranked stickers never animate a price change.
        const bIsRanked = ('isRanked' in stickerData) && stickerData.isRanked;
        const bPriceChanged = !bIsRanked
            && stickerData.oldPrice !== undefined
            && stickerData.oldPrice !== stickerData.price;
        if (!bPriceChanged) {
            reusePanel.SetHasClass('price-reveal', false);
            elChange.SetHasClass('show-change', false);
            return;
        }
        reusePanel.SetDialogVariableInt('price-change', Math.abs(stickerData.price - stickerData.oldPrice));
        elChange.SwitchClass('direction', stickerData.price > stickerData.oldPrice ? 'higher' : 'lower');
        // Animate once per change, and only inside the post-update window. 'price-reveal' hands the
        // timing to CSS, so nothing holds this recycled panel across a timer.
        const bFirstReveal = !State(cp).stopTileUpdate && !stickerData.priceChangeRevealed;
        if (bFirstReveal) {
            stickerData.priceChangeRevealed = true;
        }
        reusePanel.SetHasClass('price-reveal', bFirstReveal);
        elChange.SetHasClass('show-change', true);
    }
    function _SetPriceDataOnTile(stickerData, reusePanel) {
        reusePanel.SetDialogVariableInt('price', stickerData.price);
        reusePanel.FindChildInLayoutFile('id-store-item-price').text = ('isRanked' in stickerData && stickerData.isRanked) ? $.Localize('#major_store_price_locked', reusePanel) : $.Localize('#major_store_price', reusePanel);
        // You can set this string to debug:
        // 		"major_store_price"				"{d:price} {d:weeklyLow}-{d:weeklyHigh} (-{d:weeklyDiscount}%) <img src='file://{images}/icons/ui/major_coin.svg' class='inline-coin-icon'/>"
        reusePanel.SetDialogVariableInt('weeklyLow', stickerData.weeklyLow);
        reusePanel.SetDialogVariableInt('weeklyHigh', stickerData.weeklyHigh);
        let posDot = (stickerData.weeklyHigh > stickerData.weeklyLow)
            ? ((stickerData.price - stickerData.weeklyLow) / (stickerData.weeklyHigh - stickerData.weeklyLow)) * 100
            : 100;
        posDot = Math.floor(Math.max(0, Math.min(96, posDot)));
        reusePanel.FindChildInLayoutFile('id-store-item-price-pos').style.transform = 'translateX(' + posDot + '%)';
        // reusePanel.SetDialogVariableInt( 'weeklyDiscount', Math.min( Math.trunc( filteredList[nPanelIdx].weeklyPctReductionFromHigh ), 99 ) );
    }
    function _ShoppingCartControlsOnTile(stickerData, reusePanel) {
        const shopItem = { id: stickerData.itemId, name: stickerData.displayName, price: stickerData.price, oldPrice: stickerData.oldPrice };
        ShoppingCart.cart.subscribeToUpdates(reusePanel, 'tile-counter', () => {
            const quantityInCart = ShoppingCart.cart.getItemQuantity(stickerData.itemId);
            reusePanel.SetHasClass('show-quantity', quantityInCart > 0);
            reusePanel.SetDialogVariableInt('quantity', quantityInCart);
        });
        reusePanel.FindChildInLayoutFile('id-store-item-add-to-cart-btn').SetPanelEvent('onactivate', () => {
            ShoppingCart.cart.addItem(shopItem);
            if (ShoppingCart.cart.getItemQuantity(stickerData.itemId) >= 10 || ShoppingCart.cart.getTotalItems() >= 100) {
                $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.buymenu_failure', 'MOUSE');
                return;
            }
            $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.generic_button_press', 'MOUSE');
        });
        reusePanel.FindChildInLayoutFile('id-store-item-remove-from-cart-btn').SetPanelEvent('onactivate', () => {
            ShoppingCart.cart.decrementItem(shopItem.id);
            $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.generic_button_press', 'MOUSE');
        });
    }
    function _UpdateBookmarkOnTile(defidx, reusePanel, cp) {
        const elBookmark = reusePanel.FindChildInLayoutFile('id-store-item-bookmark');
        elBookmark.checked = Bookmarks.has(defidx);
        elBookmark.SetPanelEvent('onactivate', () => {
            _UpdateBookmarkSetting(cp, reusePanel, defidx);
        });
    }
    function _OpenFullscreenInspect(cp, itemData) {
        // From the inspect
        function _Callback() {
            // The inspect popup can write the watch list directly, so drop our cache before re-reading.
            Bookmarks.invalidate();
            // Redraw in place so the list keeps its scroll position.
            _UpdateVisiblePanel(cp, true);
        }
        ;
        const callback = _TrackJSCallback(cp, UiToolkitAPI.RegisterJSCallback(_Callback));
        const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_inventory_inspect.xml');
        let oSettings = {
            item_id: itemData.itemId,
            inspect_only: true,
            hide_all_action_items: true,
            price_in_tokens: itemData.price,
            sticker_def_index: 'rawId' in itemData ? itemData.rawId : itemData.kc_highlight,
            callback_handle: callback
        };
        elPanel.Data().oSettings = oSettings;
    }
    function _GetFilteredSortedIds(oSettings) {
        let aFilteredStickers;
        const cp = oSettings.cp;
        _RenderActiveFilterChips(cp);
        const FilterSortSettings = _ReadFilterSettings(cp);
        const btnKeyChainsToggle = cp.FindChildInLayoutFile('id-major-store-filter-keychains').FindChildInLayoutFile('id-slider-btn');
        const elSearchBox = cp.FindChildInLayoutFile('id-major-store-search-box');
        if (elSearchBox.text) {
            const searchResults = _GetItemsForSearch(cp, elSearchBox.text);
            aFilteredStickers = btnKeyChainsToggle.checked ? searchResults.keychainResults : searchResults.stickerResults;
        }
        else if (State(cp).useBookMarkList) {
            aFilteredStickers = _GetBookmarkedItemsList(cp);
        }
        else {
            aFilteredStickers = btnKeyChainsToggle.checked ? State(cp).aFlatKeyChainData : State(cp).aFlatStickersData;
        }
        aFilteredStickers = aFilteredStickers.filter(s => _MatchesSeriesFilter(s, FilterSortSettings));
        // Selected teams
        if (FilterSortSettings.selectedTeamIds.length > 0) {
            aFilteredStickers = aFilteredStickers.filter(sticker => FilterSortSettings.selectedTeamIds.includes(sticker.teamId));
        }
        // Only player or teams od keychains
        if (FilterSortSettings.playersOnly || FilterSortSettings.teamsOnly || FilterSortSettings.keyChainsOnly) {
            aFilteredStickers = aFilteredStickers.filter(sticker => (('kc_highlight' in sticker) && FilterSortSettings.keyChainsOnly) ||
                (!('kc_highlight' in sticker) && sticker.isPlayer && FilterSortSettings.playersOnly) ||
                (!('kc_highlight' in sticker) && !sticker.isPlayer && FilterSortSettings.teamsOnly));
        }
        // rarity
        if (FilterSortSettings.rarity.length > 0) {
            aFilteredStickers = aFilteredStickers.filter(sticker => FilterSortSettings.rarity.includes(sticker.rarity));
        }
        const nSortDirection = ((FilterSortSettings.sortDirection === 'asc') ? 1 : -1);
        const filterSetting = FilterSortSettings.sort;
        return [...aFilteredStickers].sort((a, b) => {
            let aField = a[filterSetting];
            let bField = b[filterSetting];
            if (filterSetting === 'name') {
                // When comparing names, always compare case-insensitive
                aField = aField.toLowerCase();
                bField = bField.toLowerCase();
            }
            if (aField != bField) {
                return ((aField < bField) ? -1 : 1) * nSortDirection;
            }
            // Tie-break when the preferred sort field is equal.
            return _CompareByPopularity(a, b);
        });
    }
    function _GetFilteredTeams(cp) {
        const elFilterPanel = cp.FindChildInLayoutFile('id-major-store-filters-panel');
        let elTeams = elFilterPanel.FindChildInLayoutFile('id-major-store-filter-section-teams');
        return [...elTeams.Children().filter(panel => panel.checked && panel.enabled)];
    }
    function _GetFilteredRarities(cp) {
        const elFilterPanel = cp.FindChildInLayoutFile('id-major-store-filters-panel');
        let elRarities = elFilterPanel.FindChildInLayoutFile('id-major-store-filter-rarities');
        return elRarities.Children().filter(panel => panel.checked && panel.enabled);
    }
    function _SetUpFilterPanel(cp) {
        const elFilterPanel = cp.FindChildInLayoutFile('id-major-store-filters-panel');
        g_ActiveTournamentTeams.forEach((team, i) => {
            const elParent = elFilterPanel.FindChildInLayoutFile('id-major-store-filter-section-teams');
            let elTeam = elParent.FindChildInLayoutFile(g_ActiveTournamentTeams[i].team);
            if (!elTeam) {
                elTeam = $.CreatePanel('ToggleButton', elParent, g_ActiveTournamentTeams[i].team);
                elTeam.BLoadLayoutSnippet('filter-team-btn');
                elTeam.Data().team = g_ActiveTournamentTeams[i].team;
                elTeam.Data().teamid = g_ActiveTournamentTeams[i].teamid;
                elTeam.SetAttributeString('filter-button', 'true');
                elTeam.FindChildInLayoutFile('id-filter-icon').SetImage('file://{images}/tournaments/teams/' + g_ActiveTournamentTeams[i].team + '.svg');
                elTeam.FindChildInLayoutFile('id-filter-icon-blur').SetImage('file://{images}/tournaments/teams/' + g_ActiveTournamentTeams[i].team + '.svg');
            }
        });
        const aRarities = [3, 4, 5, 6];
        aRarities.forEach((r, index) => {
            const rarityBtn = elFilterPanel.FindChildInLayoutFile('id-major-store-filter-rarity-' + r);
            if (rarityBtn) {
                rarityBtn.SetDialogVariable('rarity', $.Localize('#major_store_filter_type_' + r));
                rarityBtn.FindChildInLayoutFile('id-filter-icon').SetImage('file://{images}/icons/ui/sticker_rarity_' + r + '.svg');
                rarityBtn.FindChildInLayoutFile('id-filter-icon-blur').SetImage('file://{images}/icons/ui/sticker_rarity_' + r + '.svg');
                rarityBtn.Data().rarity = r;
            }
        });
        // Every toggle re-filters the list. The refinements ( teams, rarities, team / player only ) carry
        // the 'filter-button' attribute Clear All already walks, and the series toggles are the
        // SERIES_FILTERS rows, so neither set is named again here.
        const fnRefilter = () => _UpdateItemsList({ cp });
        elFilterPanel.FindChildrenWithAttributeTraverse('filter-button').forEach(btn => btn.SetPanelEvent('onactivate', fnRefilter));
        SERIES_FILTERS.forEach(series => elFilterPanel.FindChildInLayoutFile(series.toggleId).SetPanelEvent('onactivate', fnRefilter));
        // Charms-only also disables the sticker refinements.
        const btnKeyChainsOnly = elFilterPanel.FindChildInLayoutFile('id-major-store-filter-keychains').FindChildInLayoutFile('id-slider-btn');
        btnKeyChainsOnly.SetDialogVariable('slide_toggle_text', $.Localize('#major_store_filter_info_keychains'));
        btnKeyChainsOnly.SetPanelEvent('onactivate', () => {
            _EnableDisableFilterPanelBtns(cp, btnKeyChainsOnly.checked);
            _UpdateItemsList({ cp });
        });
        const elClearBtn = elFilterPanel.FindChildInLayoutFile('id-major-store-filters-clear');
        elClearBtn.SetDialogVariable('name', $.Localize('#major_store_filter_type_clear_all'));
        elClearBtn.SetPanelEvent('onactivate', () => _ClearAllFilters(cp));
        const elClearAllNavBtn = cp.FindChildInLayoutFile('id-filter-active-clear_all');
        elClearAllNavBtn.SetDialogVariable('name', $.Localize('#major_store_filter_type_clear_all'));
        elClearAllNavBtn.AddClass('clear-all');
        elClearAllNavBtn.visible = false;
        elClearAllNavBtn.SetPanelEvent('onactivate', () => {
            _ClearAllFilters(cp);
            elClearAllNavBtn.visible = false;
        });
    }
    /** Clear All means "drop my refinements", so the sort is untouched. The nav tabs own the series,
        so it survives too -- unless the contents are mixed, where it is the user's to set and clear. */
    function _ClearAllFilters(cp) {
        if (_IsMixedContentView(cp)) {
            _SetActiveSeriesFilter(cp, NO_SERIES_FILTER);
        }
        _OnActivateClearAll(cp);
        _UpdateItemsList({ cp });
    }
    function _EnableDisableFilterPanelBtns(cp, btnKeyChainsOnly) {
        cp.FindChildrenWithClassTraverse('major-filter-panel__toggle').forEach(btn => {
            btn.enabled = !btnKeyChainsOnly;
        });
        _ApplyViewSort(cp, State(cp).activeSort);
    }
    function _Debounce(cp, handleName, delay, fnAction) {
        // Dynamic handle names, so index the raw bag rather than the typed StoreState_t.
        const data = cp.Data();
        if (data[handleName]) {
            $.CancelScheduled(data[handleName]);
            data[handleName] = null;
        }
        data[handleName] = $.Schedule(delay, fnAction);
    }
    // Search
    function _ScoreStickerSearch(stickers, lowerTokens) {
        const szMajor = $.Localize('#major_store_nav_tab_major').toLowerCase();
        const szChampions = $.Localize('#major_store_nav_tab_champions').toLowerCase();
        const szResults = $.Localize('#major_store_nav_tab_ranked').toLowerCase();
        return stickers.map(sticker => {
            let totalScore = 0;
            const nick = sticker.playerCode.toLowerCase();
            const tag = (sticker.teamTag) ? sticker.teamTag.toLowerCase() : '';
            const rarity = sticker.rarityLookup.toLowerCase();
            const team = (sticker.teamName) ? sticker.teamName.toLowerCase() : '';
            const real = (sticker.realName) ? sticker.realName.toLowerCase() : '';
            const name = (sticker.name) ? sticker.name.toLowerCase() : '';
            // Category words mirror the Results filter row. A champion result sticker matches both.
            const category = (sticker.champion ? szChampions + ' ' : '')
                + (sticker.isRanked ? szResults : '')
                + (!sticker.champion && !sticker.isRanked ? szMajor : '');
            const hasMatch = lowerTokens.every(token => {
                let tokenScore = 0;
                if (nick === token || nick.startsWith(token))
                    tokenScore = 100;
                else if (nick.includes(token))
                    tokenScore = 80;
                else if (tag.includes(token))
                    tokenScore = 60;
                else if (rarity.includes(token))
                    tokenScore = 40;
                else if (category.includes(token))
                    tokenScore = 35;
                else if (name.includes(token))
                    tokenScore = 30;
                else if (team.includes(token) || real.includes(token))
                    tokenScore = 20;
                totalScore += tokenScore;
                return tokenScore > 0;
            });
            return { sticker, score: totalScore, isValid: hasMatch };
        })
            .filter(result => result.isValid)
            .sort((a, b) => b.score - a.score)
            .map(result => result.sticker);
    }
    function _ScoreKeyChainSearch(keychains, lowerTokens) {
        return keychains.map(item => {
            let totalScore = 0;
            const name = item.name ? item.name.toLowerCase() : '';
            const mapName = item.map_name ? item.map_name.toLowerCase() : '';
            const stage = item.stage ? $.Localize('#CSGO_Tournament_Event_Stage_' + item.stage).toLowerCase() : '';
            const team1 = item.teamid1 ? $.Localize('#CSGO_TeamID_' + item.teamid1).toLowerCase() : '';
            const team2 = item.teamid2 ? $.Localize('#CSGO_TeamID_' + item.teamid2).toLowerCase() : '';
            const hasMatch = lowerTokens.every(token => {
                let tokenScore = 0;
                if (name === token || name.startsWith(token))
                    tokenScore = 100;
                else if (name.includes(token))
                    tokenScore = 80;
                else if (mapName.includes(token))
                    tokenScore = 60;
                else if (stage.includes(token))
                    tokenScore = 40;
                else if (team1.includes(token) || team2.includes(token))
                    tokenScore = 20;
                totalScore += tokenScore;
                return tokenScore > 0;
            });
            return { item, score: totalScore, isValid: hasMatch };
        })
            .filter(result => result.isValid)
            .sort((a, b) => b.score - a.score)
            .map(result => result.item);
    }
    function _GetItemsForSearch(cp, searchTxt) {
        const tokens = searchTxt.toLowerCase().trim().split(/\s+/).filter(t => t.length > 0);
        if (tokens.length === 0)
            return { stickerResults: [], keychainResults: [] };
        // The flyout and the item list both ask for the same query, so memo the last one.
        const szKey = tokens.join(' ');
        const cached = State(cp).searchCache;
        if (cached && cached.key === szKey)
            return cached.results;
        const results = {
            stickerResults: _ScoreStickerSearch(State(cp).aFlatStickersData, tokens),
            keychainResults: _ScoreKeyChainSearch(State(cp).aFlatKeyChainData, tokens),
        };
        State(cp).searchCache = { key: szKey, results };
        return results;
    }
    function _ShowSearchResults(cp, oItems) {
        const elTextSearchFlyout = cp.FindChildInLayoutFile('id-major-fullscreen-text-search');
        const elResultsPanel = elTextSearchFlyout.FindChildInLayoutFile('id-search-list');
        elResultsPanel.Children().forEach(result => result.DeleteAsync(0));
        const sections = [
            { id: 'id-results-stickers', items: oItems.stickerResults },
            { id: 'id-results-keychains', items: oItems.keychainResults },
        ];
        if (sections.every(s => s.items.length < 1)) {
            _PopOverlay();
            return;
        }
        State(cp).useBookMarkList = false;
        _PushOverlay(cp, 'id-major-fullscreen-text-search');
        let bNeedSeparator = false;
        sections.forEach(section => {
            if (section.items.length < 1)
                return;
            if (bNeedSeparator)
                $.CreatePanel('Panel', elResultsPanel, '', { class: 'major-search-results__section__separator' });
            bNeedSeparator = true;
            const elSection = $.CreatePanel('Panel', elResultsPanel, section.id, { class: 'major-search-results__section' });
            // Button reports the full count; only a capped number of tiles are built.
            _MakeShowSearchResultsBtn(cp, elSection, section.items.length);
            const elListParent = $.CreatePanel('Panel', elSection, '', { class: 'major-search-results__list' });
            section.items.slice(0, MAX_SEARCH_RESULTS_SHOWN).forEach(item => _MakeSearchTile(cp, elListParent, item));
        });
    }
    function _MakeShowSearchResultsBtn(cp, elSection, count) {
        const elPanel = $.CreatePanel('Button', elSection, '');
        elPanel.SetDialogVariableInt('results-count', count);
        elPanel.BLoadLayoutSnippet('search-result-show-all');
        elPanel.SetDialogVariable('search-text', cp.FindChildInLayoutFile('id-major-store-search-box').text);
        const bIsKeychains = elSection.id === 'id-results-keychains';
        elPanel.FindChildInLayoutFile('id-results-btn-label').text = $.Localize(bIsKeychains ? '#major_store_search_see_all_keychains' : '#major_store_search_see_all_stickers', elPanel);
        elPanel.SetPanelEvent('onactivate', () => {
            _OnActivateClearAll(cp, true);
            _PopOverlay();
            cp.FindChildInLayoutFile('id-major-store-filter-keychains').FindChildInLayoutFile('id-slider-btn').checked = bIsKeychains;
            _EnableDisableFilterPanelBtns(cp, bIsKeychains);
            // Results span every series; the user narrows from the panel if they want to.
            _SetActiveSeriesFilter(cp, NO_SERIES_FILTER);
            _ApplyViewSort(cp, VIEW_SORTS.Search);
            _ShowMainPanel(cp, VIEW_CONTENT);
            // Search results are not a category, so leave the nav bar unhighlighted.
            _SetActiveNavTab(cp, NAV_TAB_NONE);
        });
    }
    function _MakeSearchTile(cp, elSection, item) {
        const bIsSticker = ('rawId' in item);
        const elTile = $.CreatePanel('Button', elSection, '');
        elTile.BLoadLayoutSnippet('search-result');
        elTile.FindChildInLayoutFile('id-result-icon').itemid = item.itemId;
        item.displayName.SetOnLabel(elTile.FindChildInLayoutFile('id-result-name'));
        elTile.SetDialogVariableInt('price', item.price);
        elTile.FindChildInLayoutFile('id-result-inspect').SetPanelEvent('onactivate', () => {
            _OpenFullscreenInspect(cp, item);
            _PopOverlay();
        });
        const elBookmark = elTile.FindChildInLayoutFile('id-store-item-bookmark');
        elBookmark.checked = Bookmarks.has(bIsSticker ? item.rawId : item.kc_highlight);
        elBookmark.SetPanelEvent('onactivate', () => {
            _UpdateBookmarkSetting(cp, elTile, bIsSticker ? item.rawId : item.kc_highlight);
        });
    }
    function OnSearchContextMenuCallBack(msg) {
        $.Msg('OnSearchContextMenuCallBack: You pressed ' + msg + '\n');
    }
    // Shared "See All" behaviour: clear filters, optionally tick one category toggle, show the list.
    function _ShowCategoryList(cp, filterToggleId, sort) {
        _OnActivateClearAll(cp);
        // The tab owns the series, so set it after the refinements are cleared.
        _SetActiveSeriesFilter(cp, filterToggleId);
        // Sort before showing, so an in-place refresh already has the right order.
        _ApplyViewSort(cp, sort);
        _ShowMainPanel(cp, VIEW_CONTENT);
    }
    function _IsFavoritesEmpty(cp) {
        return State(cp).useBookMarkList && _GetBookmarkedItemsList(cp).length < 1;
    }
    /** Favorites with nothing in it shows the hint instead of building a list. */
    function _UpdateFavoritesEmptyState(cp) {
        const bEmpty = _IsFavoritesEmpty(cp);
        cp.FindChildInLayoutFile('id-major-store-bookmark-hint').SetHasClass('hidden', !bEmpty);
        cp.FindChildInLayoutFile('id-major-store-content-controls').visible = !bEmpty;
        const elLister = cp.FindChildInLayoutFile('id-major-store-items-lister');
        if (elLister)
            elLister.visible = !bEmpty;
        return bEmpty;
    }
    // Rebuilds every registered carousel. Entries not listed simply never get built.
    function _RefreshCarousels(cp) {
        STORE_CAROUSELS.forEach(carousel => {
            // Containers carry 'hidden' in the layout, so an unregistered carousel is never shown.
            const elBanner = cp.FindChildInLayoutFile(carousel.bannerId);
            if (elBanner)
                elBanner.SetHasClass('hidden', !carousel.hasItems(cp));
            // Still refreshed when empty so a carousel can drive its own empty state
            // ( the favourites banner shows a hint panel ).
            carousel.refresh(cp);
        });
    }
    // Home is the carousels plus the tab strip, which gains or loses tabs as data and favourites change.
    function _RefreshHome(cp) {
        _RefreshCarousels(cp);
        _UpdateStoreNavTabs(cp);
    }
    // Wires each carousel's See All button. A carousel whose button is absent from the layout is
    // skipped, so a carousel can be pulled from the XML without touching this code.
    function _SetUpCarouselSeeAllButtons(cp) {
        STORE_CAROUSELS.forEach(carousel => {
            if (carousel.navTabKey && !STORE_NAV_TABS.some(tab => tab.key === carousel.navTabKey)) {
                $.Msg('PopupMajorStore: carousel "' + carousel.key + '" has navTabKey "' + carousel.navTabKey + '" with no matching tab');
            }
            const elSeeAll = cp.FindChildInLayoutFile(carousel.seeAllBtnId);
            if (!elSeeAll)
                return;
            elSeeAll.SetPanelEvent('onactivate', () => {
                carousel.onSeeAll(cp);
                if (carousel.navTabKey)
                    _SetActiveNavTab(cp, carousel.navTabKey);
            });
        });
    }
    // Builds one tab per nav registry entry. Deliberately knows nothing about carousels.
    function _SetUpStoreNavTabs(cp) {
        const elParent = cp.FindChildInLayoutFile('id-major-store-nav-tabs-container');
        STORE_NAV_TABS.forEach((tab, i) => {
            if (STORE_NAV_TABS.findIndex(t => t.key === tab.key) !== i) {
                $.Msg('PopupMajorStore: duplicate nav tab key "' + tab.key + '"; only the first is used');
            }
            let elTab = elParent.FindChild(tab.key);
            if (!elTab) {
                elTab = $.CreatePanel('RadioButton', elParent, tab.key, {
                    group: 'store_nav',
                    class: 'content-navbar__tabs__btn left-right-flow',
                });
                $.CreatePanel('Label', elTab, tab.key + '-label', { text: $.Localize(tab.loc) });
            }
            elTab.SetPanelEvent('onactivate', () => {
                if (m_bSyncingNavTabs)
                    return;
                tab.activate(cp);
                _SetActiveNavTab(cp, tab.key);
            });
        });
        cp.FindChildInLayoutFile('id-major-store-nav-home').SetPanelEvent('onactivate', () => {
            if (m_bSyncingNavTabs)
                return;
            StoreNavActions.Home(cp);
        });
        _UpdateStoreNavTabs(cp);
    }
    // Show a tab only when its category actually has items. Driven by the data, not by whether
    // the matching carousel is present or visible.
    function _UpdateStoreNavTabs(cp) {
        const elParent = cp.FindChildInLayoutFile('id-major-store-nav-tabs-container');
        STORE_NAV_TABS.forEach(tab => {
            const elTab = elParent.FindChild(tab.key);
            if (!elTab) {
                return;
            }
            elTab.visible = tab.isAvailable(cp);
            const elLabel = elTab.FindChild(tab.key + '-label');
            if (elLabel && tab.label) {
                elLabel.text = tab.label(cp, elLabel);
            }
        });
    }
    function _SetActiveNavTab(cp, key) {
        const elParent = cp.FindChildInLayoutFile('id-major-store-nav-tabs-container');
        const elHome = cp.FindChildInLayoutFile('id-major-store-nav-home');
        m_bSyncingNavTabs = true;
        // Drive every tab, so an unknown key leaves nothing lit rather than a stale highlight.
        let bMatched = (key === 'home');
        elHome.checked = bMatched;
        STORE_NAV_TABS.forEach(tab => {
            const elTab = elParent.FindChild(tab.key);
            if (!elTab)
                return;
            elTab.checked = (tab.key === key);
            bMatched = bMatched || elTab.checked;
        });
        m_bSyncingNavTabs = false;
        // NAV_TAB_NONE clears on purpose; anything else failing to match is a registry mistake.
        if (!bMatched && key !== NAV_TAB_NONE) {
            $.Msg('PopupMajorStore: no nav tab for key "' + key + '"; nav bar left unhighlighted');
        }
    }
    function _FindView(viewId) {
        return STORE_VIEWS.find(view => view.id === viewId);
    }
    function _ActiveView() {
        return (m_activeMain && m_activeMain.IsValid()) ? _FindView(m_activeMain.id) : undefined;
    }
    function _IsHomeActive() {
        return _ActiveView()?.id === VIEW_HOME;
    }
    // Swaps the main view. What the incoming view needs comes from its STORE_VIEWS row.
    function _ShowMainPanel(cp, viewId) {
        _CloseSortDropDown(cp);
        const view = _FindView(viewId);
        const elNext = cp.FindChildInLayoutFile(viewId);
        if (!view || !elNext) {
            $.Msg('PopupMajorStore: "' + viewId + '" is not in STORE_VIEWS or the layout');
            return;
        }
        if (elNext === m_activeMain) {
            // Already up. The list serves several tabs, so it rebuilds and replays the reveal so a
            // tab-to-tab move looks like arriving from Home. Every other view ignores the repeat.
            if (view.rebuildIfActive) {
                view.onShow?.(cp);
                elNext.TriggerClass('panel-reveal');
            }
            return;
        }
        if (view.navTabKey) {
            _SetActiveNavTab(cp, view.navTabKey);
        }
        view.onShow?.(cp);
        if (m_activeMain && m_activeMain.IsValid()) {
            m_activeMain.AddClass('hidden');
        }
        elNext.RemoveClass('hidden');
        elNext.TriggerClass('panel-reveal');
        m_activeMain = elNext;
        _UpdateFooterButtons(cp);
        $.DispatchEvent('CSGOPlaySoundEffect', 'inventory_inspect_close', 'MOUSE');
    }
    // Back and Escape step out of a drill-down ( single view to team view ) and otherwise go Home,
    // so the back button, Escape and the Home tab all leave the same state.
    function _GoBack(cp) {
        const szBackTarget = _ActiveView()?.backTarget;
        if (szBackTarget) {
            _ShowMainPanel(cp, szBackTarget);
        }
        else {
            StoreNavActions.Home(cp);
        }
    }
    // Close only from Home, Back everywhere else.
    function _UpdateFooterButtons(cp) {
        const bHome = _IsHomeActive();
        cp.FindChildInLayoutFile('id-popup-major-store-close-btn').visible = bHome;
        cp.FindChildInLayoutFile('id-popup-major-store-back-btn').visible = !bHome;
    }
    function _PushOverlay(cp, panelId) {
        const overlay = $.GetContextPanel().FindChildTraverse(panelId);
        if (!overlay || m_overlayStack.includes(overlay))
            return;
        m_overlayStack.push(overlay);
        overlay.RemoveClass('hidden');
    }
    function _PopOverlay() {
        const topOverlay = m_overlayStack.pop();
        if (topOverlay && topOverlay.IsValid()) {
            topOverlay.AddClass('hidden');
            return true; // Successfully closed an overlay
        }
        return false; // Stack was empty
    }
    // Handles the Escape key (Cancel event).
    function OnCancelPressed() {
        // If loading is active, block ESC completely.
        if (m_overlayStack.includes($.GetContextPanel().FindChildInLayoutFile('id-major-store-loading'))) {
            return true;
        }
        //If there are popups, close the most recent one.
        if (m_overlayStack.length > 0) {
            const topOverlay = m_overlayStack.pop();
            $.GetContextPanel().FindChildTraverse(topOverlay.id).AddClass('hidden');
            return true;
        }
        // No overlays and not on Home: step back one view, the same as the back button.
        if (_ActiveView() && !_IsHomeActive()) {
            _GoBack($.GetContextPanel());
            return true;
        }
        ClosePopup();
        return true;
    }
    PopupMajorStore.OnCancelPressed = OnCancelPressed;
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        const cp = $.GetContextPanel();
        $.RegisterEventHandler('ReadyForDisplay', cp, ReadyForDisplay);
        $.RegisterEventHandler('UnreadyForDisplay', cp, UnreadyForDisplay);
        // Register the global (unhandled) GC subscriptions exactly once for this popup instance.
        // These are cleaned up when the popup's JS context is destroyed on close 
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_GcLogonNotificationReceived', ReadyForDisplay);
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_UpdateConnectionToGC', ReadyForDisplay);
        $.RegisterForUnhandledEvent('PanoramaComponent_Store_VolatileShopSubscribe', (...args) => { OnVolatileShopSubscribe(...args, cp); });
        cp.RegisterForReadyEvents(true);
        if (cp.BReadyForDisplay()) {
            ReadyForDisplay();
        }
    }
})(PopupMajorStore || (PopupMajorStore = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfbWFqb3Jfc3RvcmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfbWFqb3Jfc3RvcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyxpREFBaUQ7QUFDakQsK0NBQStDO0FBQy9DLGlEQUFpRDtBQUNqRCxtREFBbUQ7QUFDbkQsMkRBQTJEO0FBQzNELGdEQUFnRDtBQUNoRCw4RUFBOEU7QUFDOUUsNEVBQTRFO0FBQzVFLDREQUE0RDtBQUM1RCw2Q0FBNkM7QUFDN0MseURBQXlEO0FBRXpELElBQVUsZUFBZSxDQSttR3hCO0FBL21HRCxXQUFVLGVBQWU7SUFFckIsTUFBTSxpQkFBaUIsR0FBRyxZQUFZLENBQUMsd0NBQXdDLENBQUUsU0FBUyxDQUFFLENBQUMsQ0FBQyxvRUFBb0U7SUFDbEssTUFBTSxrQkFBa0IsR0FBRyxZQUFZLENBQUMsd0NBQXdDLENBQUUsVUFBVSxDQUFFLENBQUMsQ0FBQyxvRUFBb0U7SUE2R3BLLFNBQVMsS0FBSyxDQUFFLEVBQVc7UUFFdkIsT0FBTyxFQUFFLENBQUMsSUFBSSxFQUFrQixDQUFDO0lBQ3JDLENBQUM7SUFFRCwyRkFBMkY7SUFDM0YsU0FBUyxvQkFBb0IsQ0FBRSxDQUF5QyxFQUFFLENBQXlDO1FBRS9HLElBQUssQ0FBQyxDQUFDLFVBQVUsSUFBSSxDQUFDLENBQUMsVUFBVTtZQUM3QixPQUFPLENBQUMsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLGdEQUFnRDtRQUN4RixJQUFLLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDLEtBQUs7WUFDbkIsT0FBTyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxpREFBaUQ7UUFDL0UsK0ZBQStGO1FBQy9GLE1BQU0sR0FBRyxHQUFLLENBQXdCLENBQUMs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Q0FBRSxLQUE2QixFQUFHLEVBQUUsQ0FDNUMsc0JBQXNCLENBQUUsTUFBTSxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUUsS0FBSyxDQUFDLEtBQUssQ0FBdUIsRUFBRSxLQUFLLEVBQUUsZUFBZSxDQUFFLENBQUM7UUFFMUcsdUJBQXVCLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxFQUFFO1lBQ3BDLENBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFFLENBQUMsT0FBTyxDQUFFLEVBQUUsQ0FBQyxFQUFFLENBQzNELEdBQUcsQ0FBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLENBQUUsQ0FBRSxDQUFDO1lBRTdILElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFFLE1BQU0sQ0FBQyxFQUFFLENBQzNCLENBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFFLENBQUMsT0FBTyxDQUFFLEVBQUUsQ0FBQyxFQUFFLENBQy9ELEdBQUcsQ0FBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxNQUFNLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLENBQUUsQ0FBRSxDQUFFLENBQUM7WUFFM0osSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsTUFBTSxDQUFDLEVBQUUsQ0FDN0Is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