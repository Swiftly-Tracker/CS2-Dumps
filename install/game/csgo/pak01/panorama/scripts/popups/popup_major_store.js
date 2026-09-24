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
    const defidxStickerItem = InventoryAPI.GetItemDefinitionIndexFromDefinitionName('sticker');
    const defidxKeyChainItem = InventoryAPI.GetItemDefinitionIndexFromDefinitionName('keychain');
    function State(cp) {
        return cp.Data();
    }
    function _CompareByPopularity(a, b) {
        if (a.popularity != b.popularity)
            return b.popularity - a.popularity;
        if (a.price != b.price)
            return b.price - a.price;
        const aId = a.rawId ?? a.kc_highlight ?? a.itemId;
        const bId = b.rawId ?? b.kc_highlight ?? b.itemId;
        return aId < bId ? -1 : (aId > bId ? 1 : 0);
    }
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
            _cache = list;
        }
        Bookmarks.toggle = toggle;
    })(Bookmarks || (Bookmarks = {}));
    const NAV_TAB_NONE = '';
    const VIEW_HOME = 'id-major-store-banners';
    const VIEW_CONTENT = 'id-major-store-content';
    const VIEW_CHARMS = 'id-major-store-keychains';
    const VIEW_TEAM = 'id-major-store-team-view';
    const VIEW_SINGLE = 'id-major-store-single-view';
    const NO_SERIES_FILTER = '';
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
    function _SelectSort(cp, szSortId) {
        m_bApplyingSort = true;
        _SortDropDown(cp).SetSelected(szSortId);
        m_bApplyingSort = false;
    }
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
    function _MatchesSeriesFilter(item, settings) {
        if (!settings.rankedOnly && !settings.championsOnly && !settings.majorOnly) {
            return true;
        }
        return (settings.rankedOnly && item.isRanked)
            || (settings.championsOnly && item.champion)
            || (settings.majorOnly && ('rawId' in item) && !item.isRanked && !item.champion);
    }
    function _UpdateFilterSections(cp) {
        const bMixed = _IsMixedContentView(cp);
        cp.FindChildInLayoutFile('id-filter-section-series').visible = bMixed;
        cp.FindChildInLayoutFile('id-filter-section-keychains').visible = bMixed;
        cp.FindChildInLayoutFile('id-filter-section-teams').visible =
            !cp.FindChildInLayoutFile('id-major-store-filter-champions').checked;
    }
    function _SetActiveSeriesFilter(cp, toggleId) {
        if (toggleId !== NO_SERIES_FILTER && !SERIES_FILTERS.some(s => s.toggleId === toggleId)) {
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
    let m_bSyncingNavTabs = false;
    let m_bApplyingSort = false;
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
        {
            key: 'ranked',
            bannerId: 'id-banner-ranked',
            seeAllBtnId: 'id-major-store-see-all-ranked-btn',
            hasItems: (cp) => State(cp).aFlatStickersData.some(s => s.isRanked),
            refresh: (cp) => _SetUpRankedBanner(cp),
            onSeeAll: StoreNavActions.Ranked,
            navTabKey: 'ranked',
        },
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
    function _TrackJSCallback(cp, handle) {
        if (!State(cp).jsCallbackHandles)
            State(cp).jsCallbackHandles = [];
        State(cp).jsCallbackHandles.push(handle);
        return handle;
    }
    function ReadyForDisplay() {
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
        State(cp).stopTileUpdate = true;
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
        const loadHandle = State(cp).loadDataTimeoutHandler;
        if (loadHandle) {
            const state = State(cp);
            state.arrAwaitingPricesheets = state.arrAwaitingPricesheets.filter((xx) => xx != nContainerDef);
            if (state.arrAwaitingPricesheets.length > 0) {
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
            $.Schedule(1, () => { State(cp).stopTileUpdate = true; });
            ShoppingCart.cart.syncPrices((itemId) => {
                const item = State(cp).aFlatStickersData.find(i => i.itemId === itemId);
                return item ? item.price : undefined;
            });
        }
    }
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
        _BuildStickerData(State(cp).aFlatStickersData, false);
        _BuildStickerData(State(cp).aFlatStickersData, true);
        State(cp).searchCache = null;
        [...State(cp).aFlatStickersData]
            .sort(_CompareByPopularity)
            .forEach((sticker, i) => { sticker.popularityRank = i; });
    }
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
        if (savedItemData) {
            const livePrice = _GetCurrentPriceForItem(savedItemData.itemId);
            if (livePrice !== undefined && savedItemData.price !== undefined) {
                if (savedItemData.price !== livePrice) {
                    savedItemData.oldPrice = savedItemData.price;
                    savedItemData.priceChangeRevealed = false;
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
    }
    function _VariousButtonActionsAndEvents(cp) {
        cp.FindChildInLayoutFile('id-major-store-container').AddBlurPanel(cp.FindChildInLayoutFile('id-major-store-filters-panel'));
        cp.FindChildInLayoutFile('id-major-store-container').AddBlurPanel(cp.FindChildInLayoutFile('id-major-store-loading'));
        cp.FindChildInLayoutFile('id-major-store-container').AddBlurPanel(cp.FindChildInLayoutFile('id-major-store-search-results'));
        cp.FindChildInLayoutFile('id-list-large-icons').SetPanelEvent('onactivate', () => {
            _MakeDelayedLoadList(cp);
        });
        cp.FindChildInLayoutFile('id-list-small-icons').SetPanelEvent('onactivate', () => {
            _MakeDelayedLoadList(cp);
        });
        cp.FindChildInLayoutFile('id-list-small-icons').checked = true;
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
        const elSearchBox = cp.FindChildInLayoutFile('id-major-store-search-box');
        elSearchBox.SetPanelEvent('ontextentrychange', () => {
            _Debounce(cp, SEARCH_DEBOUNCE_HANDLE, .3, () => { _ShowSearchResults(cp, _GetItemsForSearch(cp, elSearchBox.text)); });
        });
        elSearchBox.SetPanelEvent('ontextentrysubmit', () => {
            _ShowSearchResults(cp, _GetItemsForSearch(cp, elSearchBox.text));
        });
        cp.FindChildInLayoutFile('id-major-store-see-all-teams-btn').SetPanelEvent('onactivate', () => {
            _OnActivateClearAll(cp);
            _SetActiveSeriesFilter(cp, NO_SERIES_FILTER);
            _ApplyViewSort(cp, VIEW_SORTS.AllItems);
            _ShowMainPanel(cp, VIEW_CONTENT);
            _SetActiveNavTab(cp, NAV_TAB_NONE);
        });
        cp.FindChildInLayoutFile('id-major-store-filters-panel').SetPanelEvent('onactivate', () => {
        });
        cp.FindChildInLayoutFile('id-major-store-search-results').SetPanelEvent('onactivate', () => {
        });
        const elFloatingFilterPanel = cp.FindChildInLayoutFile('id-major-fullscreen-filter');
        cp.FindChildInLayoutFile('id-major-store-content-page').SetAcceptsFocus(true);
        cp.FindChildInLayoutFile('id-major-store-container').SetPanelEvent('onactivate', () => _CloseSortDropDown(cp));
        cp.FindChildInLayoutFile('id-major-store-sort-filter-btn').SetPanelEvent('onactivate', () => {
            _UpdateFilterSections(cp);
            elFloatingFilterPanel.visible = true;
            _PushOverlay(cp, 'id-major-fullscreen-filter');
        });
        cp.FindChildInLayoutFile('id-major-fullscreen-filter-btn').SetPanelEvent('onactivate', () => {
            _PopOverlay();
        });
        cp.FindChildInLayoutFile('id-major-fullscreen-text-search-btn').SetPanelEvent('onactivate', () => {
            _PopOverlay();
        });
        cp.FindChildInLayoutFile('id-major-store-filters-close').SetPanelEvent('onactivate', () => {
            _PopOverlay();
        });
        function fnOnPropertyTransitionEndEvent(panel, propertyName) {
            if (elFloatingFilterPanel === panel && propertyName === 'opacity') {
                if (elFloatingFilterPanel.visible === true && !panel.BIsTransparent()) {
                    return true;
                }
                if (propertyName === 'opacity') {
                    if (elFloatingFilterPanel.visible === true && elFloatingFilterPanel.BIsTransparent()) {
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
    function _GetOrCreateTile(elParent, id, snippet, onCreate) {
        let elTile = elParent.FindChildInLayoutFile(id);
        if (!elTile) {
            elTile = $.CreatePanel('Panel', elParent, id);
            elTile.BLoadLayoutSnippet(snippet);
            onCreate?.(elTile);
        }
        return elTile;
    }
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
        _UpdateStoreNavTabs(cp);
        if (_IsHomeActive() || State(cp).useBookMarkList) {
            _UpdateVisiblePanel(cp, true);
        }
    }
    function _SetUpOrgBanners(cp) {
        cp.SetDialogVariable('org-name', g_ActiveTournamentInfo.organization);
        const elParent = cp.FindChildInLayoutFile('id-major-store-banner-org-stickers');
        const aFilteredStickers = State(cp).aFlatStickersData
            .filter(sticker => sticker.isOrg)
            .sort((a, b) => Number(b.isRanked) - Number(a.isRanked));
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
        const aKeyChains = State(cp).aFlatKeyChainData;
        if (aKeyChains.length <= 1)
            return;
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
                const randomGen = new UniqueRandomUtils.UniqueRandomGenerator(0, group.highlights.length - 1);
                const count = Math.min(numItemsFromEachStage, group.highlights.length);
                for (let i = 0; i < count; i++) {
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
    const RANKED_ROW_RARITIES = [6, 5, 4];
    const RANKED_TILES_PER_ROW = 8;
    const RANKED_MAX_PAGES = 4;
    function _GetRankedRarityRows(cp) {
        const aRanked = State(cp).aFlatStickersData.filter(sticker => sticker.isRanked);
        return RANKED_ROW_RARITIES.map(nRarity => aRanked
            .filter(sticker => sticker.rarity === nRarity)
            .sort((a, b) => (b.price - a.price) || _CompareByPopularity(a, b)));
    }
    function _GetRankedPageCount(aRows) {
        const nLongestRow = Math.max(0, ...aRows.map(aRow => aRow.length));
        return Math.min(RANKED_MAX_PAGES, Math.ceil(nLongestRow / RANKED_TILES_PER_ROW));
    }
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
        const elPanel = cp.FindChildInLayoutFile(VIEW_TEAM);
        elPanel.Data().DisplayedTeam = team;
        const teamName = $.Localize('#CSGO_TeamID_' + team.teamid);
        elPanel.SetDialogVariable('team-name', teamName);
        const elTilesContainer = cp.FindChildInLayoutFile('id-major-store-team-tiles');
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
            const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
            randomGen.reset();
            let xpos = 0;
            let prices = [];
            const stickers = i === 0 ?
                State(cp).aFlatStickersData.filter(sticker => (!sticker.isPlayer && sticker.teamId === team.teamid)) :
                State(cp).aFlatStickersData.filter(sticker => (sticker.isPlayer && sticker.playerCode === team.players[i - 1].code));
            stickers.forEach((id, idx) => {
                prices.push(stickers[idx].price);
                let sticker = elStickerContainer.FindChild('pack-sticker' + idx);
                if (!sticker)
                    sticker = $.CreatePanel('ItemImage', elStickerContainer, 'pack-sticker' + idx, { scaling: 'stretch-to-fit-preserve-aspect' });
                sticker.itemid = stickers[idx].itemId;
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
            nRedeemableBalance = InventoryAPI.GetCacheTypeElementFieldByIndex('SeasonalOperations', idxLookup, 'redeemable_balance');
            nRedeemableBalance = (nRedeemableBalance === null || nRedeemableBalance === undefined) ? 0 : nRedeemableBalance;
        }
        if (State(cp).activatedCredits > 0) {
            const elNotification = cp.FindChildInLayoutFile('id-major-store-add-tokens');
            _PushOverlay(cp, 'id-major-store-add-tokens');
            const tempBalance = nRedeemableBalance - State(cp).activatedCredits;
            cp.SetDialogVariableInt('balance', tempBalance);
            function CallAtEndAnimation() {
                _PopOverlay();
                cp.FindChildInLayoutFile('id-major-store-balance').TriggerClass('popup-major-store__top-bar__balance-anim');
                cp.SetDialogVariableInt('balance', nRedeemableBalance);
            }
            AddMajorTokensAnim.StartAnim(elNotification, cp.FindChildInLayoutFile('id-major-store-balance'), State(cp).activatedCredits, CallAtEndAnimation);
            State(cp).activatedCredits = 0;
        }
        else {
            cp.SetDialogVariableInt('balance', nRedeemableBalance);
        }
    }
    function _UpdateItemsList(oSettings) {
        if (_UpdateFavoritesEmptyState(oSettings.cp))
            return;
        const elParent = oSettings.cp.FindChildInLayoutFile('id-major-store-content-page');
        let elLister = elParent.FindChildInLayoutFile('id-major-store-items-lister');
        if (!elLister)
            return;
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
        cp.FindChildInLayoutFile('id-filter-active-clear_all').visible = numFiltersSelected > 1;
        cp.FindChildInLayoutFile('id-major-store-filters-clear').visible = numFiltersSelected > 1;
    }
    function _MakeNavBarFilterButton(cp, elParent, selectedFilterBtn, locString, idForBtn) {
        const elActiveFilterBtn = $.CreatePanel('Button', elParent, idForBtn);
        elActiveFilterBtn.BLoadLayoutSnippet('active-filter-button');
        elActiveFilterBtn.SetDialogVariable('name', $.Localize(locString, selectedFilterBtn));
        elActiveFilterBtn.SetPanelEvent('onactivate', () => {
            selectedFilterBtn.checked = false;
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
        reusePanel.FindChildInLayoutFile('id-store-item-hot-trend').SetHasClass('show', stickerData.popularityRank < 40);
        reusePanel.SetHasClass('is-player', stickerData.isPlayer);
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
        _RebindOpenModelPanel(reusePanel, stickerData.itemId);
        reusePanel.FindChildInLayoutFile('id-inspect-sticker').SetPanelEvent('onactivate', () => {
            _OpenFullscreenInspect(cp, stickerData);
        });
    }
    function _RebindOpenModelPanel(reusePanel, itemId) {
        const MapPanel = reusePanel.FindChildInLayoutFile('id-store-item-model');
        if (MapPanel && MapPanel.IsValid())
            MapPanel.SetItemItemId(itemId, '');
    }
    function _MakeModelPanel(reusePanel, itemId) {
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
        reusePanel.FindChildInLayoutFile('id-store-item-image').itemid = keychainData.itemId;
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
        reusePanel.SetDialogVariableInt('weeklyLow', stickerData.weeklyLow);
        reusePanel.SetDialogVariableInt('weeklyHigh', stickerData.weeklyHigh);
        let posDot = (stickerData.weeklyHigh > stickerData.weeklyLow)
            ? ((stickerData.price - stickerData.weeklyLow) / (stickerData.weeklyHigh - stickerData.weeklyLow)) * 100
            : 100;
        posDot = Math.floor(Math.max(0, Math.min(96, posDot)));
        reusePanel.FindChildInLayoutFile('id-store-item-price-pos').style.transform = 'translateX(' + posDot + '%)';
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
        function _Callback() {
            Bookmarks.invalidate();
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
        if (FilterSortSettings.selectedTeamIds.length > 0) {
            aFilteredStickers = aFilteredStickers.filter(sticker => FilterSortSettings.selectedTeamIds.includes(sticker.teamId));
        }
        if (FilterSortSettings.playersOnly || FilterSortSettings.teamsOnly || FilterSortSettings.keyChainsOnly) {
            aFilteredStickers = aFilteredStickers.filter(sticker => (('kc_highlight' in sticker) && FilterSortSettings.keyChainsOnly) ||
                (!('kc_highlight' in sticker) && sticker.isPlayer && FilterSortSettings.playersOnly) ||
                (!('kc_highlight' in sticker) && !sticker.isPlayer && FilterSortSettings.teamsOnly));
        }
        if (FilterSortSettings.rarity.length > 0) {
            aFilteredStickers = aFilteredStickers.filter(sticker => FilterSortSettings.rarity.includes(sticker.rarity));
        }
        const nSortDirection = ((FilterSortSettings.sortDirection === 'asc') ? 1 : -1);
        const filterSetting = FilterSortSettings.sort;
        return [...aFilteredStickers].sort((a, b) => {
            let aField = a[filterSetting];
            let bField = b[filterSetting];
            if (filterSetting === 'name') {
                aField = aField.toLowerCase();
                bField = bField.toLowerCase();
            }
            if (aField != bField) {
                return ((aField < bField) ? -1 : 1) * nSortDirection;
            }
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
        const fnRefilter = () => _UpdateItemsList({ cp });
        elFilterPanel.FindChildrenWithAttributeTraverse('filter-button').forEach(btn => btn.SetPanelEvent('onactivate', fnRefilter));
        SERIES_FILTERS.forEach(series => elFilterPanel.FindChildInLayoutFile(series.toggleId).SetPanelEvent('onactivate', fnRefilter));
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
        const data = cp.Data();
        if (data[handleName]) {
            $.CancelScheduled(data[handleName]);
            data[handleName] = null;
        }
        data[handleName] = $.Schedule(delay, fnAction);
    }
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
            _SetActiveSeriesFilter(cp, NO_SERIES_FILTER);
            _ApplyViewSort(cp, VIEW_SORTS.Search);
            _ShowMainPanel(cp, VIEW_CONTENT);
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
    }
    function _ShowCategoryList(cp, filterToggleId, sort) {
        _OnActivateClearAll(cp);
        _SetActiveSeriesFilter(cp, filterToggleId);
        _ApplyViewSort(cp, sort);
        _ShowMainPanel(cp, VIEW_CONTENT);
    }
    function _IsFavoritesEmpty(cp) {
        return State(cp).useBookMarkList && _GetBookmarkedItemsList(cp).length < 1;
    }
    function _UpdateFavoritesEmptyState(cp) {
        const bEmpty = _IsFavoritesEmpty(cp);
        cp.FindChildInLayoutFile('id-major-store-bookmark-hint').SetHasClass('hidden', !bEmpty);
        cp.FindChildInLayoutFile('id-major-store-content-controls').visible = !bEmpty;
        const elLister = cp.FindChildInLayoutFile('id-major-store-items-lister');
        if (elLister)
            elLister.visible = !bEmpty;
        return bEmpty;
    }
    function _RefreshCarousels(cp) {
        STORE_CAROUSELS.forEach(carousel => {
            const elBanner = cp.FindChildInLayoutFile(carousel.bannerId);
            if (elBanner)
                elBanner.SetHasClass('hidden', !carousel.hasItems(cp));
            carousel.refresh(cp);
        });
    }
    function _RefreshHome(cp) {
        _RefreshCarousels(cp);
        _UpdateStoreNavTabs(cp);
    }
    function _SetUpCarouselSeeAllButtons(cp) {
        STORE_CAROUSELS.forEach(carousel => {
            if (carousel.navTabKey && !STORE_NAV_TABS.some(tab => tab.key === carousel.navTabKey)) {
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
    function _SetUpStoreNavTabs(cp) {
        const elParent = cp.FindChildInLayoutFile('id-major-store-nav-tabs-container');
        STORE_NAV_TABS.forEach((tab, i) => {
            if (STORE_NAV_TABS.findIndex(t => t.key === tab.key) !== i) {
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
        if (!bMatched && key !== NAV_TAB_NONE) {
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
    function _ShowMainPanel(cp, viewId) {
        _CloseSortDropDown(cp);
        const view = _FindView(viewId);
        const elNext = cp.FindChildInLayoutFile(viewId);
        if (!view || !elNext) {
            return;
        }
        if (elNext === m_activeMain) {
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
    function _GoBack(cp) {
        const szBackTarget = _ActiveView()?.backTarget;
        if (szBackTarget) {
            _ShowMainPanel(cp, szBackTarget);
        }
        else {
            StoreNavActions.Home(cp);
        }
    }
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
            return true;
        }
        return false;
    }
    function OnCancelPressed() {
        if (m_overlayStack.includes($.GetContextPanel().FindChildInLayoutFile('id-major-store-loading'))) {
            return true;
        }
        if (m_overlayStack.length > 0) {
            const topOverlay = m_overlayStack.pop();
            $.GetContextPanel().FindChildTraverse(topOverlay.id).AddClass('hidden');
            return true;
        }
        if (_ActiveView() && !_IsHomeActive()) {
            _GoBack($.GetContextPanel());
            return true;
        }
        ClosePopup();
        return true;
    }
    PopupMajorStore.OnCancelPressed = OnCancelPressed;
    {
        const cp = $.GetContextPanel();
        $.RegisterEventHandler('ReadyForDisplay', cp, ReadyForDisplay);
        $.RegisterEventHandler('UnreadyForDisplay', cp, UnreadyForDisplay);
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_GcLogonNotificationReceived', ReadyForDisplay);
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_UpdateConnectionToGC', ReadyForDisplay);
        $.RegisterForUnhandledEvent('PanoramaComponent_Store_VolatileShopSubscribe', (...args) => { OnVolatileShopSubscribe(...args, cp); });
        cp.RegisterForReadyEvents(true);
        if (cp.BReadyForDisplay()) {
            ReadyForDisplay();
        }
    }
})(PopupMajorStore || (PopupMajorStore = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfbWFqb3Jfc3RvcmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfbWFqb3Jfc3RvcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyxpREFBaUQ7QUFDakQsK0NBQStDO0FBQy9DLGlEQUFpRDtBQUNqRCxtREFBbUQ7QUFDbkQsMkRBQTJEO0FBQzNELGdEQUFnRDtBQUNoRCw4RUFBOEU7QUFDOUUsNEVBQTRFO0FBQzVFLDREQUE0RDtBQUM1RCw2Q0FBNkM7QUFDN0MseURBQXlEO0FBRXpELElBQVUsZUFBZSxDQSttR3hCO0FBL21HRCxXQUFVLGVBQWU7SUFFckIsTUFBTSxpQkFBaUIsR0FBRyxZQUFZLENBQUMsd0NBQXdDLENBQUUsU0FBUyxDQUFFLENBQUM7SUFDN0YsTUFBTSxrQkFBa0IsR0FBRyxZQUFZLENBQUMsd0NBQXdDLENBQUUsVUFBVSxDQUFFLENBQUM7SUE2Ry9GLFNBQVMsS0FBSyxDQUFFLEVBQVc7UUFFdkIsT0FBTyxFQUFFLENBQUMsSUFBSSxFQUFrQixDQUFDO0lBQ3JDLENBQUM7SUFHRCxTQUFTLG9CQUFvQixDQUFFLENBQXlDLEVBQUUsQ0FBeUM7UUFFL0csSUFBSyxDQUFDLENBQUMsVUFBVSxJQUFJLENBQUMsQ0FBQyxVQUFVO1lBQzdCLE9BQU8sQ0FBQyxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsVUFBVSxDQUFDO1FBQ3ZDLElBQUssQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsS0FBSztZQUNuQixPQUFPLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQztRQUU3QixNQUFNLEdBQUcsR0FBSyxDQUF3QixDQUFDLEtBQUssSUFBTSxDQUF5QixDQUFDLFlBQVksSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDO1FBQ3JHLE1BQU0sR0FBRyxHQUFLLENB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RSxNQUEyQixFQUFFLFFBQWlCO1FBRXRFLE1BQU0sR0FBRyxHQUFHLFdBQVcsQ0FBRSxNQUFNLENBQUUsQ0FBQztRQUNsQyxNQUFNLEdBQUcsR0FBRyxDQUFFLEtBQTZCLEVBQUcsRUFBRSxDQUM1QyxzQkFBc0IsQ0FBRSxNQUFNLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBRSxLQUFLLENBQUMsS0FBSyxDQUF1QixFQUFFLEtBQUssRUFBRSxlQUFlLENBQUUsQ0FBQztRQUUxRyx1QkFBdUIsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLEVBQUU7WUFDcEMsQ0FBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUUsQ0FBQyxPQUFPLENBQUUsRUFBRSxDQUFDLEVBQUUsQ0FDM0QsR0FBRyxDQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsQ0FBRSxDQUFFLENBQUM7WUFFN0gsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUUsTUFBTSxDQUFDLEVBQUUsQ0FDM0IsQ0FBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUUsQ0FBQyxPQUFPLENBQUUsRUFBRSxDQUFDLEVBQUUsQ0FDL0QsR0FBRyxDQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxR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