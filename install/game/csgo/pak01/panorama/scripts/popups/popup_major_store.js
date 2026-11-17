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
/// <reference path="../common/major_store_prices.ts" />
var PopupMajorStore;
(function (PopupMajorStore) {
    const defidxStickerItem = InventoryAPI.GetItemDefinitionIndexFromDefinitionName('sticker');
    const defidxKeyChainItem = InventoryAPI.GetItemDefinitionIndexFromDefinitionName('keychain');
    function State(cp) {
        return cp.Data();
    }
    function _EffectivePrice(item) {
        return MajorStorePrices.GetEffectivePrice(item);
    }
    function _CompareById(a, b) {
        const aId = a.rawId ?? a.kc_highlight ?? a.itemId;
        const bId = b.rawId ?? b.kc_highlight ?? b.itemId;
        return aId < bId ? -1 : (aId > bId ? 1 : 0);
    }
    const NAV_TAB_NONE = '';
    const VIEW_TEAMS = 'id-major-store-teams';
    const VIEW_LIST = 'id-major-store-list';
    const VIEW_TEAM = 'id-major-store-team';
    const VIEW_CHARMS = 'id-major-store-keychains';
    const SNIPPET_STICKER_TILE = 'sticker-tile';
    const SNIPPET_KEYCHAIN_TILE = 'keychain-tile';
    const TEAM_GRID_RARITIES = [6, 5, 4, 3];
    const FEATURED_TEAM_COUNT = 10;
    const FEATURED_PAGE_COUNT = 15;
    const SORT_OPTIONS = {
        'price-high-low': (a, b) => _EffectivePrice(b) - _EffectivePrice(a),
        'price-low-high': (a, b) => _EffectivePrice(a) - _EffectivePrice(b),
        'name': (a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
    };
    const SORT_DEFAULT = 'price-high-low';
    const SEARCH_DEBOUNCE_HANDLE = 'textDebounceTimeoutHandle';
    let m_activeMain = null;
    let m_activeTabKey = '';
    const m_overlayStack = [];
    let m_aTeamGridCells = [];
    let m_aTeamGridLines = [];
    let m_bSyncingNavTabs = false;
    const STORE_NAV_TABS = [
        {
            key: 'team',
            btnId: 'id-major-store-nav-team',
            isAvailable: () => true,
            show: (cp) => _ShowMainPanel(cp, VIEW_TEAMS),
        },
        {
            key: 'event',
            btnId: 'id-major-store-nav-event',
            isAvailable: (cp) => State(cp).aFlatStickersData.some(s => s.isOrg),
            show: (cp) => _ShowList(cp, _EventListSource(cp)),
        },
        {
            key: 'charms',
            btnId: 'id-major-store-nav-charms',
            isAvailable: (cp) => State(cp).aFlatKeyChainData.length > 1,
            show: (cp) => _ShowMainPanel(cp, VIEW_CHARMS),
        },
    ];
    const STORE_VIEWS = [
        {
            id: VIEW_TEAMS,
            onShow: (cp) => _SetUpTeamsHome(cp),
            onRefresh: (cp) => _SetUpTeamsHome(cp),
        },
        {
            id: VIEW_LIST,
            rebuildIfActive: true,
            onShow: (cp) => _UpdateItemsList(cp, false),
            onRefresh: (cp, bDisableScroll) => _UpdateItemsList(cp, bDisableScroll),
        },
        {
            id: VIEW_TEAM,
            onShow: (cp) => _BuildTeamGrid(cp),
            onRefresh: (cp) => _RefreshTeamGrid(cp),
        },
        {
            id: VIEW_CHARMS,
            onShow: (cp) => _SetUpKeyChainsPage(cp),
            onRefresh: (cp) => _SetUpKeyChainsPage(cp),
        },
    ];
    function ClosePopup() {
        const cp = $.GetContextPanel();
        cp.SetReadyForDisplay(false);
        CancelRefreshSubscription(cp);
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
        State(cp).searchCache = null;
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
        cp.FindChildInLayoutFile('id-major-store-container').style.backgroundImage =
            'url( "file://{images}/tournaments/backgrounds/pickem_bg_' + eventId + '.psd" )';
        State(cp).arrAwaitingPricesheets = [];
        if (!MissionsAPI.GetSeasonalOperationFauxCreditsCost(g_ActiveTournamentInfo.credits_id, InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(defidxStickerItem, g_ActiveTournamentInfo.stickerids[0])))
            State(cp).arrAwaitingPricesheets.push(g_ActiveTournamentInfo.itemid_dynamic_stickers);
        if (!MissionsAPI.GetSeasonalOperationFauxCreditsCost(g_ActiveTournamentInfo.credits_id, g_ActiveTournamentDynamicSouvenirFaux))
            State(cp).arrAwaitingPricesheets.push(g_ActiveTournamentInfo.itemid_dynamic_souvenirs);
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
        cp.FindChildInLayoutFile('id-major-store-container').AddBlurPanel(cp.FindChildInLayoutFile('id-major-store-loading'));
        cp.FindChildInLayoutFile('id-major-store-container-inner').AddClass('show');
        _UpdateStickerData(cp);
        _UpdateKeyChainsData(cp);
        _SetUpTitleBar(cp, eventId);
        _SetUpTeamsBanner(cp);
        _VariousButtonActionsAndEvents(cp);
        _SetUpStoreNavTabs(cp);
        if (!State(cp).aFeaturedPicks || State(cp).aFeaturedPicks.length < 1)
            State(cp).aFeaturedPicks = _PickFeatured();
        _ShowTab(cp, 'team');
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
        if (bNewPricesParsed) {
            if (nContainerDef == g_ActiveTournamentInfo.itemid_dynamic_stickers ||
                nContainerDef == g_ActiveTournamentInfo.itemid_dynamic_souvenirs ||
                nContainerDef == g_ActiveTournamentInfo.itemid_champion_stickers) {
                _UpdateStickerData(cp);
            }
            else if (g_ActiveTournamentDynamicContainers.includes(nContainerDef)) {
                _UpdateKeyChainsData(cp);
            }
            _UpdateVisiblePanel(cp, true);
            ShoppingCart.cart.syncPrices((itemId) => {
                const item = _FindItemById(cp, itemId);
                return item ? _EffectivePrice(item) : undefined;
            });
        }
    }
    function _FindItemById(cp, itemId) {
        const state = State(cp);
        return state.aFlatStickersData.find(i => i.itemId === itemId)
            ?? state.aFlatKeyChainData.find(i => i.itemId === itemId);
    }
    function _UpdateVisiblePanel(cp, bDisableScroll = false) {
        _ActiveView()?.onRefresh?.(cp, bDisableScroll);
    }
    function _SubscribeForAllTournamentItems() {
        g_ActiveTournamentDynamicContainers.forEach((id) => StoreAPI.VolatileShopSubscribe(id, true));
    }
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
    function _UpdateStickerData(cp) {
        _BuildStickerData(State(cp).aFlatStickersData);
        State(cp).searchCache = null;
    }
    function _BuildStickerData(target) {
        const map = MapDataById(target);
        const add = (oData) => _UpdateWithCurrentData(target, map.get(oData.rawId), oData, _GetStickerData);
        g_ActiveTournamentTeams.forEach(team => {
            team.stickerids.forEach(id => add({ rawId: id, isPlayer: false, isOrg: false, teamId: team.teamid, team: team.team, isChampion: false }));
            team.players.forEach(player => player.stickerids.forEach(id => add({ rawId: id, isPlayer: true, isOrg: false, teamId: team.teamid, team: team.team, playerCode: player.code, playerNick: player.nick, isChampion: false })));
            team.champions.forEach(player => player.stickerids.forEach(id => add({ rawId: id, isPlayer: true, isOrg: false, teamId: team.teamid, team: team.team, playerCode: player.code, playerNick: player.nick, isChampion: true })));
        });
        g_ActiveTournamentInfo.stickerids.forEach(id => add({ rawId: id, isPlayer: false, isOrg: true, playerCode: g_ActiveTournamentInfo.location + ' ' + g_ActiveTournamentInfo.organization }));
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
        if (!savedItemData) {
            savedItemData = _funcGetData(oData);
            aFlatStoredData.push(savedItemData);
        }
        _ApplyPriceData(savedItemData);
    }
    function _ApplyPriceData(item) {
        Object.assign(item, MajorStorePrices.GetItemPrice(item.itemId));
    }
    function _GetStickerData(oData) {
        const itemId = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(defidxStickerItem, oData.rawId);
        const numRarity = InventoryAPI.GetItemRarity(itemId);
        return {
            isPlayer: oData.isPlayer,
            isOrg: ('isOrg' in oData) ? oData.isOrg : false,
            rawId: oData.rawId,
            teamName: $.Localize('#CSGO_TeamID_' + oData.teamId),
            teamId: oData.teamId,
            teamTag: oData.team,
            playerCode: ('playerCode' in oData) ? oData.playerCode : '',
            playerNick: ('playerNick' in oData) ? oData.playerNick : '',
            realName: oData.isPlayer ? $.Localize('#SFUI_ProPlayer_' + oData.playerCode) : '',
            itemId: itemId,
            rarity: numRarity,
            rarityLookup: $.Localize('#major_store_filter_type_' + numRarity),
            name: InventoryAPI.GetItemName(itemId),
            displayName: ItemInfo.GetFormattedName(itemId),
            champion: oData.isChampion,
        };
    }
    function _GetKeyChainData(oData) {
        const itemId = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(defidxKeyChainItem, oData.kc_highlight);
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
            name: $.Localize(oData.name),
        };
    }
    function UnreadyForDisplay() {
    }
    function _VariousButtonActionsAndEvents(cp) {
        const elSortDropDown = _SortDropDown(cp);
        elSortDropDown.SetSelected(SORT_DEFAULT);
        elSortDropDown.SetPanelEvent('oninputsubmit', () => _UpdateItemsList(cp, false));
        cp.FindChildInLayoutFile('id-search-filter-all').checked = true;
        cp.FindChildInLayoutFile('id-major-store-filter-pills').Children().forEach(btn => btn.SetPanelEvent('onactivate', () => _UpdateItemsList(cp, false)));
        cp.FindChildInLayoutFile('id-popup-major-store-back-btn').SetPanelEvent('onactivate', () => _GoBack(cp));
        cp.FindChildInLayoutFile('id-major-store-balance').SetPanelEvent('onmouseover', () => {
            cp.FindChildInLayoutFile('id-major-store-balance').SetDialogVariable('local-price', StoreAPI.GetStoreItemTokensBundlePrice('' + g_ActiveTournamentInfo.itemid_charge, 100, ''));
            const tooltip = $.Localize('#major_store_balance_tooltip' + (g_ActiveTournamentInfo.pp_fixed_prices ? '_fx' : ''), cp.FindChildInLayoutFile('id-major-store-balance'));
            UiToolkitAPI.ShowTitleTextTooltip('id-major-store-balance', '#CSGO_TournamentPass_' + g_ActiveTournamentInfo.location + '_credits', tooltip);
        });
        cp.FindChildInLayoutFile('id-major-store-balance').SetPanelEvent('onmouseout', () => {
            UiToolkitAPI.HideTitleTextTooltip();
        });
        cp.FindChildInLayoutFile('id-major-store-receipt').SetPanelEvent('onmouseover', () => {
            UiToolkitAPI.ShowTextTooltip('id-major-store-receipt', '#major_store_balance_receipt' + (g_ActiveTournamentInfo.pp_fixed_prices ? '_fx' : ''));
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
            _Debounce(cp, SEARCH_DEBOUNCE_HANDLE, .3, () => _OnSearchTextChanged(cp));
        });
        elSearchBox.SetPanelEvent('ontextentrysubmit', () => _OnSearchTextChanged(cp));
        cp.FindChildInLayoutFile('id-major-store-list-page').SetAcceptsFocus(true);
        cp.FindChildInLayoutFile('id-major-store-container').SetPanelEvent('onactivate', () => _CloseSortDropDown(cp));
        AddMajorTokensAnim.SetTransitionEndEvent(cp.FindChildInLayoutFile('id-major-store-add-tokens'));
    }
    function _CloseSortDropDown(cp) {
        const elMenu = _SortDropDown(cp).AccessDropDownMenu();
        if (!elMenu || !elMenu.visible) {
            return;
        }
        cp.FindChildInLayoutFile('id-major-store-list-page').SetFocus();
    }
    function _SortDropDown(cp) {
        return cp.FindChildInLayoutFile('id-major-store-sort-dropdown');
    }
    function _SetUpTitleBar(cp, eventId) {
        cp.SetDialogVariable('tournament_name', $.Localize('#CSGO_Tournament_Event_NameShort_' + eventId));
        cp.FindChildInLayoutFile('id-major-store-major-logo').SetImage('file://{images}/tournaments/backgrounds/pickem_mainmenu_promo_' + eventId + '.psd');
    }
    function _SetUpTeamsHome(cp) {
        _UpdateSaleBanner(cp);
        _SetUpFeaturedCarousel(cp);
    }
    function _UpdateSaleBanner(cp) {
        const maxDiscount = Math.max(0, ...State(cp).aFlatStickersData.map(s => s.discountPct ?? 0));
        const elBanner = cp.FindChildInLayoutFile('id-major-store-sale-banner');
        elBanner.SetDialogVariableInt('discount', maxDiscount);
        elBanner.visible = maxDiscount > 0;
    }
    function _SetUpTeamsBanner(cp) {
        const teams = g_ActiveTournamentTeams;
        const elParent = cp.FindChildInLayoutFile('id-major-store-banner-teams');
        const R2_X = 0.7548777;
        const R2_Y = 0.5698403;
        const startX = Math.random();
        const startY = Math.random();
        teams.forEach((team, i) => {
            const elPanel = $.CreatePanel('Button', elParent, '');
            elPanel.BLoadLayoutSnippet('banner-team-box');
            const szLogo = 'file://{images}/tournaments/teams/' + team.team + '.svg';
            elPanel.FindChildInLayoutFile('id-team-icon').SetImage(szLogo);
            elPanel.FindChildInLayoutFile('id-team-icon-blur').style.backgroundImage = 'url( "' + szLogo + '" )';
            elPanel.SetDialogVariable('name', $.Localize('#CSGO_TeamID_' + team.teamid));
            const x = Math.floor(((startX + i * R2_X) % 1) * 100);
            const y = Math.floor(((startY + i * R2_Y) % 1) * 100);
            elPanel.style.backgroundImage = _TileBgImage();
            elPanel.style.backgroundPosition = x + '% ' + y + '%';
            elPanel.SetPanelEvent('onactivate', () => {
                _ShowTeam(cp, team);
                $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.submenu_leveloptions_select', 'MOUSE');
            });
        });
    }
    function _PickFeatured() {
        const aPool = g_ActiveTournamentTeams.slice(0, FEATURED_TEAM_COUNT).flatMap(team => [
            { teamId: team.teamid, playerCode: '' },
            ...team.players.map(player => ({ teamId: team.teamid, playerCode: player.code })),
        ]);
        const randomGen = new UniqueRandomUtils.UniqueRandomGenerator(0, aPool.length - 1);
        const aPicks = [];
        for (let i = 0; i < FEATURED_PAGE_COUNT; i++) {
            const nRandom = randomGen.next();
            if (nRandom === null)
                break;
            aPicks.push(aPool[nRandom]);
        }
        return aPicks;
    }
    function _GetFeaturedStickers(cp, pick) {
        return State(cp).aFlatStickersData
            .filter(s => s.teamId === pick.teamId && !s.champion &&
            (pick.playerCode ? s.playerCode === pick.playerCode : !s.isPlayer))
            .sort((a, b) => b.rarity - a.rarity);
    }
    function _SetUpFeaturedCarousel(cp) {
        const elCarousel = cp.FindChildInLayoutFile('id-major-store-featured-carousel');
        State(cp).aFeaturedPicks.forEach((pick, nPage) => {
            const elPage = _GetOrCreatePanel(elCarousel, 'id-featured-page-' + nPage, 'popup-major-store__featured__page');
            elPage.hittest = false;
            const aStickers = _GetFeaturedStickers(cp, pick);
            for (let i = 0; i < aStickers.length; i++) {
                const elTile = _GetOrCreateTile(elPage, 'id-featured-tile-' + nPage + '-' + i, SNIPPET_STICKER_TILE, tile => tile.AddClass('featured'));
                _UpdateTile(cp, elTile, aStickers, i);
            }
        });
        _UpdateFeaturedHitTest(cp);
    }
    function _UpdateFeaturedHitTest(cp) {
        const elCarousel = cp.FindChildInLayoutFile('id-major-store-featured-carousel');
        const elFocus = elCarousel.GetFocusChild() ?? elCarousel.GetChild(0);
        for (const elPage of elCarousel.Children()) {
            elPage.hittestchildren = elPage === elFocus;
        }
    }
    function _GetOrCreatePanel(elParent, id, cls) {
        return elParent.FindChildInLayoutFile(id)
            ?? $.CreatePanel('Panel', elParent, id, { class: cls });
    }
    function _GetOrCreateTile(elParent, id, snippet, onCreate) {
        let elTile = elParent.FindChildInLayoutFile(id);
        if (!elTile) {
            elTile = $.CreatePanel('Panel', elParent, id);
            _LoadItemTileSnippet(elTile, snippet);
            onCreate?.(elTile);
        }
        return elTile;
    }
    function _TileBgImage() {
        return 'url( "file://{images}/tournaments/backgrounds/store_team_tile_bg_' + g_ActiveTournamentInfo.eventid + '.psd" )';
    }
    function _LoadItemTileSnippet(elTile, szSnippet) {
        elTile.BLoadLayoutSnippet(szSnippet);
        const elImage = elTile.FindChildInLayoutFile('id-store-item-image_container');
        elImage.style.backgroundImage = _TileBgImage();
        elImage.style.backgroundSize = 'auto';
    }
    function _StickersTitle(cp, szName) {
        cp.SetDialogVariable('team-name', szName);
        return $.Localize('#major_store_team_stickers', cp);
    }
    function _ShowTeam(cp, team) {
        State(cp).activeTeam = team;
        cp.FindChildInLayoutFile(VIEW_TEAM).SetDialogVariable('team-title', _StickersTitle(cp, $.Localize('#CSGO_TeamID_' + team.teamid)));
        _SetActiveNavTab(cp, NAV_TAB_NONE);
        _ShowMainPanel(cp, VIEW_TEAM);
    }
    function _InTeamGridColumn(sticker, szPlayerCode) {
        return szPlayerCode ? sticker.playerCode === szPlayerCode : !sticker.isPlayer;
    }
    function _TeamGridLayout(team, aStickers) {
        const aColumns = [
            { code: '', label: $.Localize('#CSGO_TeamID_' + team.teamid) },
            ...team.players.map(player => ({ code: player.code, label: player.nick })),
        ];
        const aRows = TEAM_GRID_RARITIES.map(nRarity => ({
            icon: 'file://{images}/icons/ui/sticker_rarity_' + nRarity + '.svg',
            label: $.Localize('#major_store_filter_type_' + nRarity),
            aStickers: aColumns.map(col => aStickers.find(s => !s.champion && s.rarity === nRarity && _InTeamGridColumn(s, col.code))),
        }));
        if (aStickers.some(s => s.champion)) {
            aRows.unshift({
                icon: 'file://{images}/icons/ui/trophy.svg',
                label: $.Localize('#major_store_nav_tab_champions'),
                aStickers: aColumns.map(col => aStickers
                    .filter(s => s.champion && _InTeamGridColumn(s, col.code))
                    .sort((a, b) => b.rarity - a.rarity)[0]),
            });
        }
        return { aColumns, aRows };
    }
    function _BuildTeamGrid(cp) {
        const elGrid = cp.FindChildInLayoutFile('id-major-store-team-grid');
        elGrid.RemoveAndDeleteChildren();
        m_aTeamGridCells = [];
        m_aTeamGridLines = [];
        const team = State(cp).activeTeam;
        if (!team) {
            return;
        }
        const { aColumns, aRows } = _TeamGridLayout(team, State(cp).aFlatStickersData.filter(s => !s.isOrg && s.teamId === team.teamid));
        const elTitleRow = _AddGridRow(elGrid);
        _AddGridSpacer(elTitleRow, 'icon');
        aColumns.forEach(col => _AddGridTitle(elTitleRow, col.label));
        _AddGridSpacer(elTitleRow, 'tab');
        const aColumnCells = aColumns.map(() => []);
        for (const row of aRows) {
            const elRow = _AddGridRow(elGrid);
            _AddGridRowIcon(elRow, row.icon, row.label);
            const aRowCells = [];
            row.aStickers.forEach((sticker, nCol) => {
                if (!sticker) {
                    $.CreatePanel('Panel', elRow, '', { class: 'popup-major-store__team-grid__empty' });
                    return;
                }
                const cell = { elTile: _AddGridTile(cp, elRow, sticker), sticker };
                m_aTeamGridCells.push(cell);
                aRowCells.push(cell);
                aColumnCells[nCol].push(cell);
            });
            _AddGridTab(elRow, 'row', aRowCells);
        }
        const elFooter = _AddGridRow(elGrid);
        _AddGridSpacer(elFooter, 'icon');
        aColumnCells.forEach(aCells => _AddGridTab(elFooter, 'column', aCells));
        _AddGridSpacer(elFooter, 'tab');
    }
    function _AddGridRow(elGrid) {
        return $.CreatePanel('Panel', elGrid, '', { class: 'popup-major-store__team-grid__row' });
    }
    function _AddGridSpacer(elRow, szType) {
        $.CreatePanel('Panel', elRow, '', { class: 'popup-major-store__grid-spacer ' + szType });
    }
    function _AddGridTitle(elRow, szText) {
        const elLabel = $.CreatePanel('Label', elRow, '', { class: 'stratum-medium popup-major-store__grid-title' });
        elLabel.text = szText;
    }
    function _AddGridRowIcon(elRow, szIcon, szLabel) {
        const elCell = $.CreatePanel('Panel', elRow, '', { class: 'popup-major-store__grid-row-icon' });
        const elIcon = $.CreatePanel('Image', elCell, '', { src: szIcon, textureheight: '32', texturewidth: '-1' });
        elIcon.SetPanelEvent('onmouseover', () => UiToolkitAPI.ShowTextTooltipOnPanel(elIcon, szLabel));
        elIcon.SetPanelEvent('onmouseout', () => UiToolkitAPI.HideTextTooltip());
    }
    function _AddGridTile(cp, elRow, sticker) {
        const elTile = $.CreatePanel('Panel', elRow, '');
        _LoadItemTileSnippet(elTile, SNIPPET_STICKER_TILE);
        elTile.AddClass('grid');
        _UpdateTile(cp, elTile, [sticker], 0);
        return elTile;
    }
    function _AddGridTab(elRow, szType, aCells) {
        const elCell = $.CreatePanel('Panel', elRow, '', { class: 'popup-major-store__grid-tab-cell ' + szType });
        const elBtn = $.CreatePanel('Button', elCell, 'id-major-store-grid-tab-' + m_aTeamGridLines.length, { class: 'popup-major-store__grid-tab' });
        $.CreatePanel('Image', elBtn, '', { src: 'file://{images}/icons/ui/add_to_cart.svg', textureheight: '28', texturewidth: '-1', hittest: 'false' });
        const line = { elBtn, aCells };
        m_aTeamGridLines.push(line);
        elBtn.SetPanelEvent('onactivate', () => _AddGridLineToCart(line));
        elBtn.SetPanelEvent('onmouseover', () => {
            aCells.forEach(cell => cell.elTile.AddClass('line-hover'));
            _ShowGridTabTooltip(line);
        });
        elBtn.SetPanelEvent('onmouseout', () => {
            aCells.forEach(cell => cell.elTile.RemoveClass('line-hover'));
            UiToolkitAPI.HideTitleTextTooltip();
        });
        _UpdateGridLine(line);
    }
    function _GridLineTotal(line) {
        return line.aCells.reduce((nSum, cell) => nSum + _EffectivePrice(cell.sticker), 0);
    }
    function _ShowGridTabTooltip(line) {
        const nTotal = _GridLineTotal(line);
        const szRealPrice = nTotal > 0 ? StoreAPI.GetStoreItemTokensBundlePrice('' + g_ActiveTournamentInfo.itemid_charge, nTotal, '') : '';
        let szText = $.Localize('#major_store_grid_tab_tooltip', line.elBtn);
        const nInCart = line.aCells.filter(cell => ShoppingCart.cart.getItemQuantity(cell.sticker.itemId) > 0).length;
        if (nInCart > 0) {
            line.elBtn.SetDialogVariableInt('in-cart', nInCart);
            szText += '<br>' + $.Localize('#major_store_grid_tab_in_cart', line.elBtn);
        }
        UiToolkitAPI.ShowTitleTextTooltipStyled(line.elBtn.id, szRealPrice, szText, 'major-store-grid-tab-tooltip');
    }
    function _UpdateGridLine(line) {
        line.elBtn.SetDialogVariableInt('count', line.aCells.length);
        line.elBtn.SetDialogVariableInt('price', _GridLineTotal(line));
        line.elBtn.SetHasClass('empty', line.aCells.length === 0);
        line.elBtn.enabled = line.aCells.length > 0;
    }
    function _AddGridLineToCart(line) {
        if (line.aCells.length === 0) {
            return;
        }
        const nAdded = ShoppingCart.cart.addItems(line.aCells.map(cell => _CartProduct(cell.sticker)));
        $.DispatchEvent('CSGOPlaySoundEffect', nAdded === line.aCells.length ? 'UIPanorama.generic_button_press' : 'UIPanorama.buymenu_failure', 'MOUSE');
        if (nAdded > 0) {
            _ShowGridTabTooltip(line);
            line.aCells.forEach(cell => cell.elTile.AddClass('line-added'));
            $.Schedule(0.6, () => line.aCells.forEach(cell => {
                if (cell.elTile.IsValid()) {
                    cell.elTile.RemoveClass('line-added');
                }
            }));
        }
    }
    function _RefreshTeamGrid(cp) {
        m_aTeamGridCells.forEach(cell => _UpdateTile(cp, cell.elTile, [cell.sticker], 0));
        m_aTeamGridLines.forEach(_UpdateGridLine);
    }
    function _OrgName() {
        return $.Localize('#CSGO_' + g_ActiveTournamentInfo.organization);
    }
    function _EventListSource(cp) {
        return {
            title: _StickersTitle(cp, _OrgName()),
            navTabKey: 'event',
            isSearch: false,
            getItems: (cp) => State(cp).aFlatStickersData.filter(s => s.isOrg),
        };
    }
    function _SearchListSource(szReturnTab) {
        return {
            title: $.Localize('#major_store_search_results'),
            navTabKey: NAV_TAB_NONE,
            isSearch: true,
            getItems: (cp) => _GetSearchListItems(cp),
            back: (cp) => _ShowTab(cp, szReturnTab),
        };
    }
    function _ShowList(cp, source) {
        State(cp).listSource = source;
        cp.FindChildInLayoutFile(VIEW_LIST).SetDialogVariable('list-title', source.title);
        cp.FindChildInLayoutFile('id-major-store-filter-row').visible = source.isSearch;
        _SetActiveNavTab(cp, source.navTabKey);
        _ShowMainPanel(cp, VIEW_LIST);
    }
    function _UpdateItemsList(cp, bDisableScroll) {
        const source = State(cp).listSource;
        if (!source)
            return;
        const elLister = cp.FindChildInLayoutFile('id-major-store-items-lister');
        const aItems = source.getItems(cp);
        if (source.isSearch) {
            const elList = cp.FindChildInLayoutFile(VIEW_LIST);
            elList.SetDialogVariableInt('result-count', aItems.length);
            elList.SetDialogVariable('list-title', $.Localize('#major_store_search_results_count', elList));
        }
        elLister.SetLoadListItemFunction((elLister, nPanelIdx, reusePanel) => {
            const bIsSticker = 'rawId' in aItems[nPanelIdx];
            if (!reusePanel || !reusePanel.IsValid()) {
                reusePanel = $.CreatePanel('Panel', elLister, '');
            }
            _LoadTileSnippet(reusePanel, bIsSticker ? SNIPPET_STICKER_TILE : SNIPPET_KEYCHAIN_TILE);
            if (bIsSticker) {
                _UpdateTile(cp, reusePanel, aItems, nPanelIdx);
            }
            else {
                _UpdateKeyChainsTile(cp, reusePanel, aItems, nPanelIdx);
            }
            return reusePanel;
        });
        elLister.UpdateListItems(aItems.length);
        if (!bDisableScroll)
            elLister.ScrollToTop();
    }
    function _LoadTileSnippet(elTile, szSnippet) {
        if (elTile.GetAttributeString('data-snippet', '') === szSnippet) {
            return;
        }
        elTile.RemoveAndDeleteChildren();
        elTile.RemoveClass('major-store__sticker-tile');
        elTile.RemoveClass('major-store__keychain-tile');
        _LoadItemTileSnippet(elTile, szSnippet);
        elTile.SetAttributeString('data-snippet', szSnippet);
    }
    function _SortItems(aItems, szSortId) {
        const compare = SORT_OPTIONS[szSortId] ?? SORT_OPTIONS[SORT_DEFAULT];
        return [...aItems].sort((a, b) => compare(a, b) || (_EffectivePrice(b) - _EffectivePrice(a)) || _CompareById(a, b));
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
                    _LoadItemTileSnippet(elTile, SNIPPET_KEYCHAIN_TILE);
                }
                _UpdateKeyChainsTile(cp, elTile, keyChains, idx);
            });
        }
    }
    function _UpdateTile(cp, reusePanel, filteredList, nPanelIdx) {
        const stickerData = filteredList[nPanelIdx];
        reusePanel.SetDialogVariable('title', stickerData.isPlayer ?
            stickerData.playerNick :
            stickerData.isOrg ?
                _OrgName() :
                stickerData.teamName);
        MajorStorePrices.SetPriceOnPanel(reusePanel, stickerData);
        _ShoppingCartControlsOnTile(stickerData, reusePanel);
        reusePanel.SwitchClass('rarity', 'rarity-' + stickerData.rarity);
        reusePanel.SwitchClass('sticker-type', stickerData.champion ? 'champion' : '');
        reusePanel.FindChildInLayoutFile('id-store-item-rarity-bar').style.washColor = InventoryAPI.GetItemRarityColor(stickerData.itemId);
        reusePanel.SetHasClass('is-player', stickerData.isPlayer);
        reusePanel.FindChildInLayoutFile('id-store-item-image').itemid = stickerData.itemId;
        reusePanel.FindChildInLayoutFile('id-store-item-team-logo').SetImage(stickerData.isOrg ?
            'file://{images}/tournaments/events/tournament_logo_' + g_ActiveTournamentInfo.eventid + '.svg' :
            'file://{images}/tournaments/teams/' + stickerData.teamTag + '.svg');
        reusePanel.SetPanelEvent('onmouseover', () => {
            _MakeModelPanel(reusePanel, stickerData.itemId);
            MajorStorePrices.ShowRealPrice(reusePanel, stickerData);
        });
        reusePanel.SetPanelEvent('onmouseout', () => {
            MajorStorePrices.HideRealPrice(reusePanel);
            _DeleteModelPanel(reusePanel);
        });
        _RebindOpenModelPanel(reusePanel, stickerData.itemId);
        reusePanel.FindChildInLayoutFile('id-inspect-sticker').SetPanelEvent('onactivate', () => {
            _OpenFullscreenInspect(stickerData);
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
        MajorStorePrices.SetPriceOnPanel(reusePanel, keychainData);
        _ShoppingCartControlsOnTile(keychainData, reusePanel);
        reusePanel.SetHasClass('is-final', keychainData.stage === 97);
        reusePanel.SetDialogVariable('stage', $.Localize('#CSGO_Tournament_Event_Stage_' + keychainData.stage));
        reusePanel.FindChildInLayoutFile('id-store-item-image').itemid = keychainData.itemId;
        reusePanel.FindChildInLayoutFile('id-store-item-team-1').SetImage('file://{images}/tournaments/teams/' + PredictionsAPI.GetTeamTag(keychainData.teamid1) + '.svg');
        reusePanel.FindChildInLayoutFile('id-store-item-team-2').SetImage('file://{images}/tournaments/teams/' + PredictionsAPI.GetTeamTag(keychainData.teamid2) + '.svg');
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
            MajorStorePrices.ShowRealPrice(reusePanel, keychainData);
        });
        reusePanel.SetPanelEvent('onmouseout', () => {
            if (jsTooltipDelayHandle) {
                $.CancelScheduled(jsTooltipDelayHandle);
                jsTooltipDelayHandle = null;
            }
            MajorStorePrices.HideRealPrice(reusePanel);
            _HideVideoClip(reusePanel, keychainData.itemId);
        });
        if (reusePanel.FindChildTraverse('id-store-item-movie-container')?.BHasClass('play'))
            _ShowVideoClip(reusePanel, keychainData.itemId);
        reusePanel.FindChildInLayoutFile('id-inspect-sticker').SetPanelEvent('onactivate', () => {
            _OpenFullscreenInspect(keychainData);
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
    function _CartProduct(item) {
        return { id: item.itemId, name: item.displayName, price: _EffectivePrice(item) };
    }
    function _ShoppingCartControlsOnTile(stickerData, reusePanel) {
        const shopItem = _CartProduct(stickerData);
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
    function _OpenFullscreenInspect(itemData) {
        const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_inventory_inspect.xml');
        let oSettings = {
            item_id: itemData.itemId,
            inspect_only: true,
            hide_all_action_items: true,
            price_in_tokens: _EffectivePrice(itemData),
        };
        elPanel.Data().oSettings = oSettings;
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
        return stickers.map(sticker => {
            let totalScore = 0;
            const nick = sticker.playerCode.toLowerCase();
            const tag = (sticker.teamTag) ? sticker.teamTag.toLowerCase() : '';
            const rarity = sticker.rarityLookup.toLowerCase();
            const team = (sticker.teamName) ? sticker.teamName.toLowerCase() : '';
            const real = (sticker.realName) ? sticker.realName.toLowerCase() : '';
            const name = (sticker.name) ? sticker.name.toLowerCase() : '';
            const category = sticker.champion ? szChampions : szMajor;
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
    function _SearchText(cp) {
        return cp.FindChildInLayoutFile('id-major-store-search-box').text;
    }
    function _IsSearchActive(cp) {
        return _ActiveView()?.id === VIEW_LIST && !!State(cp).listSource?.isSearch;
    }
    function _OnSearchTextChanged(cp) {
        const bHasText = _SearchText(cp).trim().length > 0;
        if (_IsSearchActive(cp)) {
            if (bHasText)
                _UpdateItemsList(cp, false);
            else
                _GoBack(cp);
            return;
        }
        if (!bHasText)
            return;
        cp.FindChildInLayoutFile('id-search-filter-all').checked = true;
        _ShowList(cp, _SearchListSource(m_activeTabKey));
    }
    function _FilterSearchResults(results, szFilter) {
        if (szFilter === 'all') {
            return [...results.stickerResults, ...results.keychainResults];
        }
        else if (szFilter === 'charms') {
            return results.keychainResults;
        }
        else {
            return results.stickerResults.filter(s => s.rarity === Number(szFilter));
        }
    }
    function _GetSearchListItems(cp) {
        const results = _GetItemsForSearch(cp, _SearchText(cp));
        const elAll = cp.FindChildInLayoutFile('id-search-filter-all');
        for (const elPill of cp.FindChildInLayoutFile('id-major-store-filter-pills').Children()) {
            const szPillFilter = elPill.GetAttributeString('data-filter', 'all');
            elPill.visible = szPillFilter === 'all' || _FilterSearchResults(results, szPillFilter).length > 0;
        }
        let elSelected = elAll.GetSelectedButton();
        if (!elSelected || !elSelected.visible) {
            elAll.checked = true;
            elSelected = elAll;
        }
        const aItems = _FilterSearchResults(results, elSelected.GetAttributeString('data-filter', 'all'));
        const selected = _SortDropDown(cp).GetSelected();
        return _SortItems(aItems, selected ? selected.id : SORT_DEFAULT);
    }
    function _SetUpStoreNavTabs(cp) {
        STORE_NAV_TABS.forEach(tab => {
            const elTab = cp.FindChildInLayoutFile(tab.btnId);
            elTab.visible = tab.isAvailable(cp);
            elTab.SetPanelEvent('onactivate', () => {
                if (m_bSyncingNavTabs)
                    return;
                _ShowTab(cp, tab.key);
            });
        });
    }
    function _ShowTab(cp, key) {
        const tab = STORE_NAV_TABS.find(t => t.key === key) ?? STORE_NAV_TABS[0];
        _ClearTextSearch(cp);
        _SetActiveNavTab(cp, tab.key);
        tab.show(cp);
    }
    function _SetActiveNavTab(cp, key) {
        m_bSyncingNavTabs = true;
        STORE_NAV_TABS.forEach(tab => {
            cp.FindChildInLayoutFile(tab.btnId).checked = (tab.key === key);
        });
        m_bSyncingNavTabs = false;
        if (key !== NAV_TAB_NONE) {
            m_activeTabKey = key;
        }
    }
    function _FindView(viewId) {
        return STORE_VIEWS.find(view => view.id === viewId);
    }
    function _ActiveView() {
        return (m_activeMain && m_activeMain.IsValid()) ? _FindView(m_activeMain.id) : undefined;
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
                view.onShow(cp);
                elNext.TriggerClass('panel-reveal');
            }
            _UpdateFooterButtons(cp);
            return;
        }
        view.onShow(cp);
        if (m_activeMain && m_activeMain.IsValid()) {
            m_activeMain.AddClass('hidden');
        }
        elNext.RemoveClass('hidden');
        elNext.TriggerClass('panel-reveal');
        m_activeMain = elNext;
        _UpdateFooterButtons(cp);
        $.DispatchEvent('CSGOPlaySoundEffect', 'inventory_inspect_close', 'MOUSE');
    }
    function _BackAction(cp) {
        const viewId = _ActiveView()?.id;
        if (viewId === VIEW_TEAM) {
            return (cp) => _ShowTab(cp, 'team');
        }
        if (viewId === VIEW_LIST) {
            return State(cp).listSource?.back;
        }
        return undefined;
    }
    function _GoBack(cp) {
        _BackAction(cp)?.(cp);
    }
    function _UpdateFooterButtons(cp) {
        const bCanGoBack = !!_BackAction(cp);
        cp.FindChildInLayoutFile('id-popup-major-store-close-btn').visible = !bCanGoBack;
        cp.FindChildInLayoutFile('id-popup-major-store-back-btn').visible = bCanGoBack;
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
        const cp = $.GetContextPanel();
        if (_BackAction(cp)) {
            _GoBack(cp);
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
        $.RegisterEventHandler('SetCarouselSelectedChild', cp, () => _UpdateFeaturedHitTest(cp));
        cp.RegisterForReadyEvents(true);
        if (cp.BReadyForDisplay()) {
            ReadyForDisplay();
        }
    }
})(PopupMajorStore || (PopupMajorStore = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfbWFqb3Jfc3RvcmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfbWFqb3Jfc3RvcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyxpREFBaUQ7QUFDakQsK0NBQStDO0FBQy9DLGlEQUFpRDtBQUNqRCxtREFBbUQ7QUFDbkQsMkRBQTJEO0FBQzNELGdEQUFnRDtBQUNoRCw4RUFBOEU7QUFDOUUsNEVBQTRFO0FBQzVFLDREQUE0RDtBQUM1RCw2Q0FBNkM7QUFDN0MseURBQXlEO0FBQ3pELHdEQUF3RDtBQUV4RCxJQUFVLGVBQWUsQ0FnNUR4QjtBQWg1REQsV0FBVSxlQUFlO0lBRXJCLE1BQU0saUJBQWlCLEdBQUcsWUFBWSxDQUFDLHdDQUF3QyxDQUFFLFNBQVMsQ0FBRSxDQUFDO0lBQzdGLE1BQU0sa0JBQWtCLEdBQUcsWUFBWSxDQUFDLHdDQUF3QyxDQUFFLFVBQVUsQ0FBRSxDQUFDO0lBa0cvRixTQUFTLEtBQUssQ0FBRSxFQUFXO1FBRXZCLE9BQU8sRUFBRSxDQUFDLElBQUksRUFBa0IsQ0FBQztJQUNyQyxDQUFDO0lBRUQsU0FBUyxlQUFlLENBQUUsSUFBcUI7UUFFM0MsT0FBTyxnQkFBZ0IsQ0FBQyxpQkFBaUIsQ0FBRSxJQUFJLENBQUUsQ0FBQztJQUN0RCxDQUFDO0lBR0QsU0FBUyxZQUFZLENBQUUsQ0FBYyxFQUFFLENBQWM7UUFHakQsTUFBTSxHQUFHLEdBQUssQ0FBd0IsQ0FBQyxLQUFLLElBQU0sQ0FBeUIsQ0FBQyxZQUFZLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUNyRyxNQUFNLEdBQUcsR0FBSyxDQUF3QixDQUFDLEtBQUssSUFBTSxDQUF5QixDQUFDLFlBQVksSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDO1FBQ3JHLE9BQU8sR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENB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QUUsQ0FDNUMsc0JBQXNCLENBQUUsTUFBTSxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUUsS0FBSyxDQUFDLEtBQUssQ0FBdUIsRUFBRSxLQUFLLEVBQUUsZUFBZSxDQUFFLENBQUM7UUFFMUcsdUJBQXVCLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxFQUFFO1lBQ3BDLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFFLEVBQUUsQ0FBQyxFQUFFLENBQzFCLEdBQUcsQ0FBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsQ0FBRSxDQUFFLENBQUM7WUFFbkgsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUUsTUFBTSxDQUFDLEVBQUUsQ0FDM0IsTUFBTSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUUsRUFBRSxDQUFDLEVBQUUsQ0FDNUIsR0FBRyxDQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxDQUFFLENBQUUsQ0FBRSxDQUFDO1lBRTFLLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFFLE1BQU0sQ0FBQyxFQUFFLENBQzdCLE1BQU0sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFFLEVBQUUsQ0FBQyxFQUFFLENBQzVCLEdBQUcsQ0FBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLE1B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