"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/formattext.ts" />
/// <reference path="common/iteminfo.ts" />
/// <reference path="common/store_items.ts" />
/// <reference path="common/prime_button_action.ts" />
/// <reference path="itemtile_store.ts" />
/// <reference path="xpshop.ts" />
/// <reference path="generated/items_event_current_generated_store.d.ts" />
/// <reference path="popups/popup_acknowledge_item.ts" />
var MainMenuStore;
(function (MainMenuStore) {
    const _m_cp = $.GetContextPanel();
    let _m_activePanelId = '';
    let _m_pagePrefix = 'id-store-page-';
    let _m_inventoryUpdatedHandler;
    function ReadyForDisplay() {
        $.Msg('MainMenuStore ReadyForDisplay: ' + $.GetContextPanel().id);
        if (!ConnectedToGcCheck()) {
            return;
        }
        _m_inventoryUpdatedHandler = $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', InventoryUpdated);
        if (_m_activePanelId === '' ||
            !_m_activePanelId ||
            (StoreItems.GetStoreItems().coupon && StoreItems.GetStoreItems().coupon.length < 1)) {
            StoreItems.MakeStoreItemList();
        }
        // Make the tabs that are read from store data
        ShowPrimePanelOnHomePage();
        MakeTabsBtnsFromStoreData();
        // Never been opened or being forced to open to a specific section from somewhere else in the UI
        let openToSection = _m_cp.GetAttributeString('set-active-section', '');
        if (_m_activePanelId === '' || !_m_activePanelId || openToSection !== '') {
            SetDefaultTab(openToSection);
        }
        else {
            NavigateToTab(_m_activePanelId);
        }
        AccountWalletUpdated();
    }
    let jsAcknowledgeDelayHandle = null;
    function InventoryUpdated() {
        const aNewItems = AcknowledgeItems.GetItems().filter(item => (item.pickuptype
            && ['xpshopredeem', 'quest_reward'].includes(item.pickuptype)));
        if (aNewItems.length > 0) {
            // Delay allows the particle to play.
            jsAcknowledgeDelayHandle = null;
            jsAcknowledgeDelayHandle = $.Schedule(1.5, () => {
                $.DispatchEvent('ShowAcknowledgePopup', '', '');
                $.DispatchEvent('UpdateXpShop');
            });
        }
        else {
            $.DispatchEvent('UpdateXpShop');
        }
        ShowPrimePanelOnHomePage();
    }
    function UnreadyForDisplay() {
        if (jsAcknowledgeDelayHandle) {
            $.CancelScheduled(jsAcknowledgeDelayHandle);
            jsAcknowledgeDelayHandle = null;
        }
        $.DispatchEvent('UpdateXpShop');
        $.Msg('MainMenuStore UnReadyForDisplay: ' + $.GetContextPanel().id);
        if (_m_inventoryUpdatedHandler) {
            $.UnregisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', _m_inventoryUpdatedHandler);
            _m_inventoryUpdatedHandler = null;
        }
    }
    function ConnectedToGcCheck() {
        if (!MyPersonaAPI.IsInventoryValid() || !MyPersonaAPI.IsConnectedToGC()) {
            //No connection to GC so show a message
            UiToolkitAPI.ShowGenericPopupOk($.Localize('#SFUI_SteamConnectionErrorTitle'), $.Localize('#SFUI_Steam_Error_LinkUnexpected'), '', () => $.DispatchEvent('HideContentPanel'));
            return false;
        }
        return true;
    }
    function ShowPrimePanelOnHomePage() {
        let bHasPrime = FriendsListAPI.GetFriendPrimeEligible(MyPersonaAPI.GetXuid());
        let elUpsellPanel = $.GetContextPanel().FindChildInLayoutFile('id-prime-background');
        elUpsellPanel.SetHasClass('hidden', bHasPrime);
        if (!bHasPrime) {
            PrimeButtonAction.SetUpPurchaseBtn(_m_cp.FindChildInLayoutFile('id-store-buy-prime'));
        }
        $.GetContextPanel().FindChildInLayoutFile('id-rewards-background').SetHasClass('hidden', !bHasPrime);
    }
    function SetDefaultTab(openToSection) {
        let navBtn = null;
        if (openToSection !== '') {
            navBtn = _m_cp.FindChildInLayoutFile(openToSection);
            _m_cp.SetAttributeString('set-active-section', '');
        }
        else if (_m_activePanelId === '' || !_m_activePanelId) {
            navBtn = _m_cp.FindChildInLayoutFile('id-store-nav-home');
        }
        if (navBtn) {
            $.DispatchEvent("Activated", navBtn, "mouse");
        }
    }
    function NavigateToTab(panelId, keyType = '') {
        $.Msg('Store Active Tab Id--> ' + panelId);
        if (keyType) {
            panelId = _m_pagePrefix + keyType;
        }
        if (_m_activePanelId !== panelId) {
            if (panelId === _m_pagePrefix + 'home') {
                UpdateItemsInHomeSection('coupon', 'id-store-popular-items', 6);
                UpdateItemsInHomeSection('tournament', 'id-store-tournament-items', 1);
            }
            else {
                MakePageFromStoreData(keyType);
                if (panelId === _m_pagePrefix + 'xpshop') {
                    $.DispatchEvent('UpdateXpShop');
                }
            }
            if (_m_activePanelId) {
                _m_cp.FindChildInLayoutFile(_m_activePanelId).SetHasClass('Active', false);
            }
            _m_activePanelId = panelId;
            let activePanel = _m_cp.FindChildInLayoutFile(panelId);
            activePanel.SetHasClass('Active', true);
        }
    }
    MainMenuStore.NavigateToTab = NavigateToTab;
    function UpdateItemsInHomeSection(sSectionName, parentId, numItemsToShow) {
        let oItemsByCategory = StoreItems.GetStoreItems();
        let aItemsList = oItemsByCategory[sSectionName];
        let extraSuffix = '';
        if ((sSectionName === 'coupon') && (aItemsList.length > 0) &&
            (aItemsList[0].isNewRelease)) {
            $.Msg("Featured NEW item ID = " + aItemsList[0].id + ", name = " + InventoryAPI.GetItemName(aItemsList[0].id));
            if ('17293822569102711679' === aItemsList[0].id) // shockone_01 for now, ideally comes from Music Item .econitem using the tool
                extraSuffix = '_nightmode2';
        }
        let elPanel = _m_cp.FindChildInLayoutFile(parentId);
        let elParent = _m_cp.FindChildInLayoutFile('id-store-home-section-' + sSectionName);
        elParent.style.backgroundImage = 'url("file://{images}/backgrounds/store_home_' + sSectionName + extraSuffix + '.psd")';
        elParent.style.backgroundPosition = '50% 50%';
        elParent.style.backgroundSize = 'cover';
        let elTitleLabel = elParent.FindChildInLayoutFile('id-store-home-section-' + sSectionName + '-title');
        if (elTitleLabel && extraSuffix) {
            elTitleLabel.text = $.Localize('#store_nav_section_' + sSectionName + extraSuffix, elTitleLabel);
        }
        if (sSectionName === 'tournament') {
            elParent.SetDialogVariable('tournament-name', $.Localize("#store_nav_tournament_" + g_ActiveTournamentInfo.eventid));
            elParent.SetDialogVariable('tournament_name', $.Localize('#CSGO_Tournament_Event_NameShort_' + g_ActiveTournamentInfo.eventid));
            const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
            let elStickerLink = elParent.FindChildInLayoutFile('id-store-home-section-major-store-btn');
            if (!elStickerLink) {
                elStickerLink = $.CreatePanel('Panel', elParent, 'id-store-home-section-major-store-btn');
                elStickerLink.BLoadLayoutSnippet('TournamentStickers');
                elStickerLink.SetPanelEvent('onactivate', () => {
                    OpenMajorHub();
                });
            }
            const defidxStickerItem = InventoryAPI.GetItemDefinitionIndexFromDefinitionName('sticker');
            const numSticker = 5;
            for (let i = 0; i < numSticker; i++) {
                const itemId = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(defidxStickerItem, g_ActiveTournamentTeams[getRandomInt(0, g_ActiveTournamentTeams.length - 1)].players[getRandomInt(0, 4)].stickerids[getRandomInt(0, 3)]);
                elStickerLink.FindChildInLayoutFile('id-sticker-' + i).itemid = itemId;
            }
        }
        const bHasItems = aItemsList.length > 0;
        // use full for showing tournament tile after pass stops selling but items are still selling.
        const bForceTournamentVisible = ((sSectionName === 'tournament') && g_ActiveTournamentInfo.active);
        if (!bHasItems && !bForceTournamentVisible) {
            elParent.visible = false;
            return;
        }
        elParent.visible = true;
        elParent.SetHasClass('store-home-section--no-items', !bHasItems);
        if (!bHasItems)
            return;
        for (let i = 0; i < numItemsToShow; i++) {
            let elTile = elPanel.FindChildInLayoutFile('home-' + sSectionName + '-' + i);
            if (!elTile) {
                elTile = $.CreatePanel("Button", elPanel, 'home-' + sSectionName + '-' + i);
                elTile.BLoadLayout('file://{resources}/layout/itemtile_store.xml', false, false);
            }
            UpdateItem(elTile, sSectionName, i);
        }
    }
    function OpenMajorHub() {
        UiToolkitAPI.ShowCustomLayoutPopupParameters('id-popup-major-hub', 'file://{resources}/layout/popups/popup_major_hub.xml', 'eventid=' + (g_ActiveTournamentInfo.eventid));
        $.DispatchEvent("CSGOPlaySoundEffect", "UIPanorama.tab_mainmenu_shop", "MOUSE");
    }
    function OpenMajorStore() {
        UiToolkitAPI.ShowCustomLayoutPopup('id-popup-major-store', 'file://{resources}/layout/popups/popup_major_store.xml');
        $.DispatchEvent("CSGOPlaySoundEffect", "UIPanorama.tab_mainmenu_shop", "MOUSE");
    }
    function MakeTabsBtnsFromStoreData() {
        let elParent = _m_cp.FindChildInLayoutFile('id-store-lister-tabs');
        let oItemsByCategory = StoreItems.GetStoreItems();
        $.Msg('MakeTabsBtnsFromStoreData');
        for (let [key, value] of Object.entries(oItemsByCategory)) {
            let panelIdString = 'id-store-nav-' + key;
            let elButton = elParent.FindChildInLayoutFile(panelIdString);
            if (value.length > 0 && !elButton) {
                elButton = $.CreatePanel('RadioButton', elParent, panelIdString, {
                    group: 'store-top-nav',
                    class: 'content-navbar__tabs__btn'
                });
                let btnString = key === 'tournament' ?
                    `#store_nav_${key}_${g_ActiveTournamentInfo.eventid}` :
                    `#store_nav_${key}`;
                $.CreatePanel('Label', elButton, '', {
                    text: btnString
                });
                elButton.SetPanelEvent('onactivate', () => {
                    NavigateToTab(_m_pagePrefix + key, key);
                });
            }
        }
        // button for xpshop
        let elButton = elParent.FindChildInLayoutFile('id-store-nav-xpshop');
        if (!elButton) {
            let nTrack = MissionsAPI.GetSeasonalOperationXpShopIndex();
            let nNewItemCount = 0;
            if (nTrack > 0) {
                let nCount = MissionsAPI.GetSeasonalOperationRedeemableGoodsCount(nTrack);
                for (let i = 0; i < nCount; i++) {
                    // we only need to know if there is more then one new item.
                    if (nNewItemCount > 1) {
                        break;
                    }
                    let ShopEntry = {
                        item_name: "",
                        ui_show_new_tag: ""
                    };
                    ShopEntry.ui_show_new_tag = MissionsAPI.GetSeasonalOperationRedeemableGoodsSchema(nTrack, i, 'ui_show_new_tag');
                    if (XpShop.ShouldShowNewTagForShopEntry(ShopEntry)) {
                        nNewItemCount++;
                    }
                }
            }
            elButton = $.CreatePanel('RadioButton', elParent, 'id-store-nav-xpshop', {
                group: 'store-top-nav',
                class: 'content-navbar__tabs__btn'
            });
            $.CreatePanel('Label', elButton, '', {
                text: '#store_tab_xpshop'
            });
            if (nNewItemCount > 0) {
                elButton.SetDialogVariableInt('new-count', nNewItemCount);
                $.CreatePanel('Label', elButton, '', {
                    class: 'content-navbar__tabs__btn-new', text: '#xpshop_new_items:f'
                });
            }
            elButton.SetPanelEvent('onactivate', () => {
                NavigateToTab(_m_pagePrefix + 'xpshop', 'xpshop');
            });
        }
    }
    function MakePageFromStoreData(typeKey) {
        let panelIdString = _m_pagePrefix + typeKey;
        let elParent = _m_cp.FindChildInLayoutFile('id-store-pages');
        let elPanel = elParent.FindChildInLayoutFile(panelIdString);
        if (!elPanel) {
            if (typeKey === 'xpshop') {
                elPanel = $.CreatePanel('Panel', elParent, panelIdString, {});
                elPanel.BLoadLayout("file://{resources}/layout/xpshop.xml", false, false);
            }
            else {
                elPanel = $.CreatePanel('JSDelayLoadList', elParent, panelIdString, {
                    class: 'store-dynamic-lister',
                    itemwidth: "178px",
                    itemheight: "280px",
                    spacersize: "4px",
                    spacerperiod: "4px"
                });
                UpdateDynamicLister(elPanel, typeKey);
            }
        }
    }
    function UpdateDynamicLister(elList, typeKey) {
        let oItemsByCategory = StoreItems.GetStoreItems();
        let aItemsList = oItemsByCategory[typeKey];
        elList.SetLoadListItemFunction((parent, nPanelIdx, reusePanel) => {
            if (!reusePanel || !reusePanel.IsValid()) {
                reusePanel = $.CreatePanel("Button", elList, aItemsList[nPanelIdx].id);
                reusePanel.BLoadLayout('file://{resources}/layout/itemtile_store.xml', false, false);
            }
            UpdateItem(reusePanel, typeKey, nPanelIdx);
            return reusePanel;
        });
        elList.UpdateListItems(aItemsList.length);
    }
    function UpdateItem(elPanel, typeKey, idx) {
        let oItemData = StoreItems.GetStoreItemData(typeKey, idx);
        ItemTileStore.Init(elPanel, oItemData);
    }
    function GotoStorePage(location) {
        let navBtn = _m_cp.FindChildInLayoutFile(location);
        $.DispatchEvent("Activated", navBtn, "mouse");
        navBtn.checked = true;
    }
    MainMenuStore.GotoStorePage = GotoStorePage;
    function AccountWalletUpdated() {
        var elBalance = _m_cp.FindChildInLayoutFile('id-store-nav-wallet');
        if ((MyPersonaAPI.GetLauncherType() === 'perfectworld') && (MyPersonaAPI.GetSteamType() !== 'china')) {
            elBalance.RemoveClass('hidden');
            elBalance.text = '#Store_SteamChina_Wallet';
            return;
        }
        var balance = (MyPersonaAPI.GetLauncherType() === 'perfectworld') ? StoreAPI.GetAccountWalletBalance() : '';
        if (balance === '' || balance === undefined || balance === null) {
            elBalance.AddClass('hidden');
        }
        else {
            elBalance.SetDialogVariable('balance', balance);
            elBalance.RemoveClass('hidden');
        }
    }
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        ReadyForDisplay();
        let elJsStore = $('#JsMainMenuStore');
        $.RegisterEventHandler('ReadyForDisplay', elJsStore, ReadyForDisplay);
        $.RegisterEventHandler('UnreadyForDisplay', elJsStore, UnreadyForDisplay);
        $.RegisterForUnhandledEvent('PanoramaComponent_Store_AccountWalletUpdated', AccountWalletUpdated);
        $.RegisterForUnhandledEvent('PanoramaComponent_Store_PriceSheetChanged', ReadyForDisplay);
        // $.RegisterForUnhandledEvent( 'FilterStoreCouponsDisplay', CouponsSearchFilterCallback );
        // $.RegisterForUnhandledEvent( 'PanoramaComponent_Store_AccountWalletUpdated', AccountWalletUpdated );//TODO
        // $.RegisterForUnhandledEvent( 'PanoramaComponent_MyPersona_InventoryUpdated', OnInventoryUpdate ); // Hook this up for buying Premier
    }
})(MainMenuStore || (MainMenuStore = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbm1lbnVfc3RvcmVfZnVsbHNjcmVlbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL21haW5tZW51X3N0b3JlX2Z1bGxzY3JlZW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUNsQyw2Q0FBNkM7QUFDN0MsMkNBQTJDO0FBQzNDLDhDQUE4QztBQUM5QyxzREFBc0Q7QUFDdEQsMENBQTBDO0FBQzFDLGtDQUFrQztBQUNsQywyRUFBMkU7QUFDM0UseURBQXlEO0FBRXpELElBQVUsYUFBYSxDQW9kdEI7QUFwZEQsV0FBVSxhQUFhO0lBRXRCLE1BQU0sS0FBSyxHQUFZLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztJQUMzQyxJQUFJLGdCQUFnQixHQUFXLEVBQUUsQ0FBQztJQUNsQyxJQUFJLGFBQWEsR0FBRyxnQkFBZ0IsQ0FBQztJQUNyQyxJQUFJLDBCQUF5QyxDQUFDO0lBRTlDLFNBQVMsZUFBZTtRQUV2QixDQUFDLENBQUMsR0FBRyxDQUFFLGlDQUFpQyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxFQUFFLENBQUUsQ0FBQztRQUNwRSxJQUFLLENBQUMsa0JBQWtCLEVBQUUsRUFDMUI7WUFDQyxPQUFPO1NBQ1A7UUFFRCwwQkFBMEIsR0FBRyxDQUFDLENBQUMseUJBQXlCLENBQUUsOENBQThDLEVBQUUsZ0JBQWdCLENBQUUsQ0FBQztRQUU3SCxJQUFLLGdCQUFnQixLQUFLLEVBQUU7WUFDM0IsQ0FBQyxnQkFBZ0I7WUFDakIsQ0FBRSxVQUFVLENBQUMsYUFBYSxFQUFFLENBQUMsTUFBTSxJQUFJLFVBQVUsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxNQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBRSxFQUN2RjtZQUNDLFVBQVUsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1NBQy9CO1FBRUQsOENBQThDO1FBQzlDLHdCQUF3QixFQUFFLENB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