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
            _ShowMainPanel(cp, 'id-major-store-banners');
        },
        Major: (cp) => _ShowCategoryList(cp, 'id-major-store-filter-major', VIEW_SORTS.Event),
        Ranked: (cp) => _ShowCategoryList(cp, 'id-major-store-filter-ranked', VIEW_SORTS.Ranked),
        Champions: (cp) => _ShowCategoryList(cp, 'id-major-store-filter-champions', VIEW_SORTS.Champions),
        Bookmarks: (cp) => {
            _OnActivateClearAll(cp);
            _SetActiveSeriesFilter(cp, NO_SERIES_FILTER);
            _ApplyViewSort(cp, VIEW_SORTS.Favorites);
            State(cp).useBookMarkList = true;
            _ShowContentList(cp);
        },
        Charms: (cp) => {
            _OnActivateClearAll(cp);
            _SetActiveSeriesFilter(cp, NO_SERIES_FILTER);
            _ApplyViewSort(cp, VIEW_SORTS.AllItems);
            _ShowMainPanel(cp, 'id-major-store-keychains');
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
        _RefreshCarousels(cp);
        _VariousButtonActionsAndEvents(cp);
        _SetUpCarouselSeeAllButtons(cp);
        _SetUpStoreNavTabs(cp);
        _SetUpFilterPanel(cp);
        _ShowMainPanel(cp, 'id-major-store-banners');
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
        if (m_activeMain?.id === 'id-major-store-single-view') {
            const elPanel = cp.FindChildInLayoutFile('id-major-store-single-view');
            if (elPanel.Data().SingleViewDisplayedStickers) {
                _SetUpSingleView(cp, elPanel.Data().SingleViewDisplayedStickers);
            }
        }
        else if (m_activeMain?.id === 'id-major-store-team-view') {
            const elPanel = cp.FindChildInLayoutFile('id-major-store-team-view');
            if (elPanel.Data().DisplayedTeam) {
                _SetUpTeamView(cp, elPanel.Data().DisplayedTeam);
            }
        }
        else if (m_activeMain?.id === 'id-major-store-keychains') {
            _SetUpKeyChainsPage(cp);
        }
        else if (m_activeMain?.id === 'id-major-store-banners') {
            _RefreshCarousels(cp);
            _UpdateStoreNavTabs(cp);
        }
        else if (m_activeMain?.id === 'id-major-store-content') {
            _UpdateItemsList({ cp, bDisableScroll });
        }
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
        cp.FindChildInLayoutFile('id-popup-major-store-back-btn').SetPanelEvent('onactivate', () => {
            _OnActivateClearAll(cp);
            _ShowMainPanel(cp, 'id-major-store-banners');
        });
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
            _ShowContentList(cp);
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
                _ShowMainPanel(cp, 'id-major-store-team-view');
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
        if (m_activeMain?.id === 'id-major-store-banners') {
            _RefreshCarousels(cp);
        }
        _UpdateStoreNavTabs(cp);
        if (State(cp).useBookMarkList) {
            _UpdateItemsList({ cp, bDisableScroll: true });
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
        const elPanel = cp.FindChildInLayoutFile('id-major-store-team-view');
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
                _ShowMainPanel(cp, 'id-major-store-single-view');
                _SetUpSingleView(cp, stickers);
                $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.submenu_leveloptions_select', 'MOUSE');
            });
        }
    }
    function _SetUpSingleView(cp, aStickers) {
        const elPanel = cp.FindChildInLayoutFile('id-major-store-single-view');
        elPanel.SetDialogVariable('team-name', aStickers[0].isPlayer ? aStickers[0].playerCode : $.Localize('#CSGO_TeamID_' + aStickers[0].teamId));
        const numTiles = aStickers.length;
        const elParent = elPanel.FindChildInLayoutFile('id-major-store-single-tiles');
        for (let i = 0; i < numTiles; i++) {
            let elPackTile = elParent.FindChildInLayoutFile('sticker-single-' + i);
            if (!elPackTile) {
                elPackTile = $.CreatePanel('ItemImage', elParent, 'sticker-single-' + i);
                elPackTile.BLoadLayoutSnippet('store-tile');
            }
            _UpdateTile(cp, elPackTile, aStickers, i);
        }
        elParent.Children().forEach((sticker, index) => { if (index >= aStickers.length) {
            sticker.DeleteAsync(0);
        } });
        elPanel.Data().SingleViewDisplayedStickers = aStickers;
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
                const elFilterPanel = cp.FindChildInLayoutFile('id-major-store-filters-panel');
                elFilterPanel.FindChildrenWithClassTraverse('major-filter-panel__toggle').forEach(btn => {
                    btn.enabled = true;
                });
                const elDropDown = _SortDropDown(cp);
                _ApplyViewSort(cp, State(cp).activeSort);
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
        const elParent = cp.FindChildInLayoutFile('id-major-store-keychains');
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
            _UpdateVisiblePanel(cp);
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
                elTeam.SetPanelEvent('onactivate', () => {
                    _UpdateItemsList({ cp });
                });
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
                rarityBtn.SetPanelEvent('onactivate', () => {
                    _UpdateItemsList({ cp });
                });
            }
        });
        elFilterPanel.FindChildInLayoutFile('id-major-store-filter-team').SetPanelEvent('onactivate', () => {
            _UpdateItemsList({ cp });
        });
        elFilterPanel.FindChildInLayoutFile('id-major-store-filter-player').SetPanelEvent('onactivate', () => {
            _UpdateItemsList({ cp });
        });
        elFilterPanel.FindChildInLayoutFile('id-major-store-filter-ranked').SetPanelEvent('onactivate', () => {
            _UpdateItemsList({ cp });
        });
        elFilterPanel.FindChildInLayoutFile('id-major-store-filter-champions').SetPanelEvent('onactivate', () => {
            _UpdateItemsList({ cp });
        });
        elFilterPanel.FindChildInLayoutFile('id-major-store-filter-major').SetPanelEvent('onactivate', () => {
            _UpdateItemsList({ cp });
        });
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
        const elDropDown = _SortDropDown(cp);
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
            _ShowContentList(cp);
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
        _ShowContentList(cp);
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
    function _ShowContentList(cp) {
        _CloseSortDropDown(cp);
        _UpdateFavoritesEmptyState(cp);
        if (m_activeMain?.id === 'id-major-store-content') {
            _UpdateItemsList({ cp });
            cp.FindChildInLayoutFile('id-major-store-content').TriggerClass('panel-reveal');
        }
        else {
            _ShowMainPanel(cp, 'id-major-store-content');
        }
    }
    function _RefreshCarousels(cp) {
        STORE_CAROUSELS.forEach(carousel => {
            const elBanner = cp.FindChildInLayoutFile(carousel.bannerId);
            if (elBanner)
                elBanner.SetHasClass('hidden', !carousel.hasItems(cp));
            carousel.refresh(cp);
        });
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
    function _ShowMainPanel(cp, panelId) {
        _CloseSortDropDown(cp);
        let nextPanel = cp.FindChildInLayoutFile(panelId);
        if (!nextPanel || nextPanel === m_activeMain)
            return;
        if (panelId === 'id-major-store-banners')
            _SetActiveNavTab(cp, 'home');
        if (m_activeMain && m_activeMain.IsValid()) {
            if (m_activeMain.id === 'id-major-store-single-view' && panelId !== 'id-major-store-content') {
                nextPanel = cp.FindChildInLayoutFile('id-major-store-team-view');
                nextPanel.RemoveClass('hidden');
                m_activeMain = nextPanel;
            }
            if (panelId == 'id-major-store-banners') {
                _RefreshCarousels(cp);
                _UpdateStoreNavTabs(cp);
            }
            if (panelId == 'id-major-store-content' && !_IsFavoritesEmpty(cp)) {
                _MakeDelayedLoadList(cp);
            }
            if (panelId == 'id-major-store-keychains') {
                _SetUpKeyChainsPage(cp);
            }
            m_activeMain.AddClass('hidden');
        }
        nextPanel.RemoveClass('hidden');
        nextPanel.TriggerClass('panel-reveal');
        m_activeMain = nextPanel;
        cp.FindChildInLayoutFile('id-popup-major-store-close-btn').visible = m_activeMain.id == 'id-major-store-banners';
        _UpdateBackButton(cp);
        $.DispatchEvent('CSGOPlaySoundEffect', 'inventory_inspect_close', 'MOUSE');
    }
    function _UpdateBackButton(cp) {
        const btn = cp.FindChildInLayoutFile('id-popup-major-store-back-btn');
        btn.visible = !('id-major-store-banners' === m_activeMain?.id);
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
        if (m_activeMain?.IsValid() && m_activeMain && m_activeMain.id !== 'id-major-store-banners') {
            StoreNavActions.Home($.GetContextPanel());
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfbWFqb3Jfc3RvcmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfbWFqb3Jfc3RvcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyxpREFBaUQ7QUFDakQsK0NBQStDO0FBQy9DLGlEQUFpRDtBQUNqRCxtREFBbUQ7QUFDbkQsMkRBQTJEO0FBQzNELGdEQUFnRDtBQUNoRCw4RUFBOEU7QUFDOUUsNEVBQTRFO0FBQzVFLDREQUE0RDtBQUM1RCw2Q0FBNkM7QUFDN0MseURBQXlEO0FBRXpELElBQVUsZUFBZSxDQXNsR3hCO0FBdGxHRCxXQUFVLGVBQWU7SUFFckIsTUFBTSxpQkFBaUIsR0FBRyxZQUFZLENBQUMsd0NBQXdDLENBQUUsU0FBUyxDQUFFLENBQUM7SUFDN0YsTUFBTSxrQkFBa0IsR0FBRyxZQUFZLENBQUMsd0NBQXdDLENBQUUsVUFBVSxDQUFFLENBQUM7SUE2Ry9GLFNBQVMsS0FBSyxDQUFFLEVBQVc7UUFFdkIsT0FBTyxFQUFFLENBQUMsSUFBSSxFQUFrQixDQUFDO0lBQ3JDLENBQUM7SUFHRCxTQUFTLG9CQUFvQixDQUFFLENBQXlDLEVBQUUsQ0FBeUM7UUFFL0csSUFBSyxDQUFDLENBQUMsVUFBVSxJQUFJLENBQUMsQ0FBQyxVQUFVO1lBQzdCLE9BQU8sQ0FBQyxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsVUFBVSxDQUFDO1FBQ3ZDLElBQUssQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsS0FBSztZQUNuQixPQUFPLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQztRQUU3QixNQUFNLEdBQUcsR0FBSyxDQUF3QixDQUFDLEtBQUssSUFBTSxDQUF5QixDQUFDLFlBQVksSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDO1FBQ3JHLE1BQU0sR0FBRyxHQUFLLENB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QUFVLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUUsQ0FBQyxPQUFPLENBQUUsRUFBRSxDQUFDLEVBQUUsQ0FDM0QsR0FBRyxDQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsQ0FBRSxDQUFFLENBQUM7WUFFN0gsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUUsTUFBTSxDQUFDLEVBQUUsQ0FDM0IsQ0FBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUUsQ0FBQyxPQUFPLENBQUUsRUFBRSxDQUFDLEVBQUUsQ0FDL0QsR0FBRyxDQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsQ0FBRSxDQUFFLENBQUUsQ0FBQztZQUUzSixJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBRSxNQUFNLENBQUMsRUFBRSxDQUM3QixDQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxFQUFFLENBQUMsRUFBRSxDQUMvRCxHQUFHLENBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFD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