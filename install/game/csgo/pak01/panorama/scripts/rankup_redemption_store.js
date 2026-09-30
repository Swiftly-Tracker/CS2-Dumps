"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/formattext.ts" />
/// <reference path="common/iteminfo.ts" />
/// <reference path="common/sessionutil.ts" />
/// <reference path="itemtile_store.ts" />
$.LogChannel('p.rankup', "LV_OFF");
var RankUpRedemptionStore;
(function (RankUpRedemptionStore) {
    let m_redeemableBalance = 0;
    let m_timeStamp = -1;
    let m_timeoutScheduleHandle;
    let m_profileCustomizationHandler;
    let m_profileUpdateHandler;
    let m_registered = false;
    let m_schTimer;
    function RegisterForInventoryUpdate() {
        if (m_registered)
            return;
        m_registered = true;
        _UpdateStoreState();
        CheckForPopulateItems();
        m_profileUpdateHandler = $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', OnInventoryUpdated);
        m_profileCustomizationHandler = $.RegisterForUnhandledEvent('PanoramaComponent_Inventory_ItemCustomizationNotification', OnItemCustomization);
        $.GetContextPanel().RegisterForReadyEvents(true);
        $.RegisterEventHandler('ReadyForDisplay', $.GetContextPanel(), () => {
            $.Msg("[p.rankup] READY FOR DISPLAY");
            _UpdateStoreState();
            CheckForPopulateItems(true);
            if (!m_profileUpdateHandler) {
                m_profileUpdateHandler = $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', OnInventoryUpdated);
            }
            if (!m_profileCustomizationHandler) {
                m_profileCustomizationHandler = $.RegisterForUnhandledEvent('PanoramaComponent_Inventory_ItemCustomizationNotification', OnItemCustomization);
            }
        });
        $.RegisterEventHandler('UnreadyForDisplay', $.GetContextPanel(), () => {
            $.Msg("[p.rankup] UN-READY FOR DISPLAY");
            if (m_schTimer) {
                $.CancelScheduled(m_schTimer);
                m_schTimer = null;
            }
            if (m_profileUpdateHandler) {
                $.UnregisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', m_profileUpdateHandler);
                m_profileUpdateHandler = null;
            }
            if (m_profileCustomizationHandler) {
                $.UnregisterForUnhandledEvent('PanoramaComponent_Inventory_ItemCustomizationNotification', m_profileCustomizationHandler);
                m_profileCustomizationHandler = null;
            }
        });
    }
    ;
    function CheckForPopulateItems(bFirstTime = false, claimedItemId = '') {
        const objStore = GetPersonalStore();
        const genTime = objStore ? objStore.generation_time : 0;
        // PopulateItems item if we have a new store
        if (genTime != m_timeStamp || claimedItemId) {
            if (genTime != m_timeStamp) {
                m_timeStamp = genTime;
                GameInterfaceAPI.SetSettingString('cl_redemption_reset_timestamp', genTime);
            }
            PopulateItems(bFirstTime, claimedItemId);
        }
    }
    // The GC carries no per-item claim cost yet and its weekly rolls never include an egg, so this
    // names a store slot to charge two claims for whatever landed in it; -1 for none.
    const TEST_DOUBLE_CLAIM_COST_SLOT = -1;
    function _GetClaimCost(itemId, index) {
        // A placeholder tile has no item behind it to ask about.
        if (itemId !== '-' && InventoryAPI.DoesItemMatchDefinitionByName(itemId, 'chicken_egg'))
            return 2;
        if (itemId !== '-' && InventoryAPI.DoesItemMatchDefinitionByName(itemId, 'chicken_feed'))
            return 2;
        return (index === TEST_DOUBLE_CLAIM_COST_SLOT) ? 2 : 1;
    }
    function _CreateItemPanel(itemId, index, bFirstTime, claimedItemId = '') {
        //- Means you don't have a store yet. so we need to make tiles with a ?
        // Users new to the system will get this state
        const bNoDropsEarned = itemId === '-';
        if (itemId !== '-' && (!InventoryAPI.IsItemInfoValid(itemId) || !InventoryAPI.IsValidItemID(itemId))) {
            $.Msg('[p.rankup] item ' + itemId + ' is invalid');
            return;
        }
        const elItemContainer = $.GetContextPanel().FindChildTraverse('jsRrsItemContainer');
        let elGhostItem = elItemContainer.FindChildInLayoutFile('itemdrop-' + itemId);
        elGhostItem = $.CreatePanel('Panel', elItemContainer, 'itemdrop-' + index + '-' + itemId);
        elGhostItem.BLoadLayout('file://{resources}/layout/itemtile_store.xml', false, false);
        _AddTileToBlurPanel(elGhostItem);
        const oItemData = {
            id: itemId,
            isDropItem: true,
            noDropsEarned: bNoDropsEarned,
        };
        ItemTileStore.Init(elGhostItem, oItemData);
        elGhostItem.Data().itemid = itemId;
        elGhostItem.Data().cost = _GetClaimCost(itemId, index);
        elGhostItem.Data().index = index;
        // itemtile_store.css hangs the second claim circle and the cost warning off the class, and
        // the warning reads its count from the dialog variable.
        elGhostItem.SetHasClass('claim-cost-2', elGhostItem.Data().cost === 2);
        elGhostItem.SetDialogVariableInt('claim-cost', elGhostItem.Data().cost);
        if (bNoDropsEarned)
            return;
        _OnGhostItemActivate(elGhostItem, itemId);
    }
    function _AddTileToBlurPanel(elGhostItem) {
        let parent = elGhostItem.GetParent();
        let count = 0;
        while (parent) {
            if (parent.id === 'id-rewards-background') {
                let blurTarget = parent.FindChildInLayoutFile('id-rewards-background-blur');
                blurTarget.AddBlurPanel(elGhostItem);
                break;
            }
            if (count > 5)
                break;
            parent = parent.GetParent();
            count++;
        }
    }
    function _OnGhostItemActivate(elGhostItem, itemId) {
        if (!InventoryAPI.IsFauxItemID(itemId)) {
            // set the click action
            elGhostItem.SetPanelEvent('onactivate', () => _OnItemSelected(elGhostItem));
            // set the inspect button action
            const elInspect = elGhostItem.FindChildTraverse('id-itemtile-store-inspect-btn');
            const isVolatile = !!InventoryAPI.GetItemAttributeValue(itemId, '{uint32}volatile container');
            elInspect.SetPanelEvent('onactivate', () => {
                if (isVolatile) {
                    const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('popup-inspect-' + itemId, 'file://{resources}/layout/popups/popup_offers_laptop.xml');
                    let oSettings = {
                        item_id: itemId,
                        inspect_only: true,
                        work_type: 'decodeable',
                        only_close_btn: true
                    };
                    elPanel.Data().oSettings = oSettings;
                }
                else if (ItemInfo.ItemHasCapability(itemId, 'decodable') && !InventoryAPI.IsTool(itemId)) {
                    const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('popup-inspect-' + itemId, 'file://{resources}/layout/popups/popup_capability_decodable.xml');
                    let oSettings = {
                        item_id: itemId,
                        show_work_type_warning: false,
                        inspect_only: true,
                        work_type: 'decodeable',
                        only_close_btn: true
                    };
                    elPanel.Data().oSettings = oSettings;
                }
                else {
                    const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_inventory_inspect.xml');
                    let oSettings = {
                        item_id: itemId,
                        inspect_only: true,
                        hide_all_action_items: true
                    };
                    elPanel.Data().oSettings = oSettings;
                }
            });
        }
    }
    function GetPersonalStore() {
        let oStore = InventoryAPI.GetCacheTypeElementJSOByIndex("PersonalStore", 0);
        return oStore;
    }
    function PopulateItems(bFirstTime = false, claimedItemId = '') {
        $.Msg('[p.rankup] PopulateItems');
        $.Msg('[p.rankup] claimedItemId:' + claimedItemId);
        const objStore = GetPersonalStore();
        $.GetContextPanel().RemoveClass('waiting');
        if (bFirstTime) {
            $.GetContextPanel().TriggerClass('reveal-store');
        }
        const elItemContainer = $.GetContextPanel().FindChildTraverse('jsRrsItemContainer');
        // Save any selected items index so we can update them after we PopulateItems the items
        let aSelectedItems = [];
        elItemContainer.Children().forEach(element => {
            if (element.BHasClass('selected')) {
                aSelectedItems.push(element.Data().index);
            }
        });
        // Clear container
        elItemContainer.RemoveAndDeleteChildren();
        // Get ghost items and create panels
        const arrItemIds = objStore ? Object.values(objStore.items) : ['-', '-', '-', '-'];
        for (let i = 0; i < arrItemIds.length; i++) {
            _CreateItemPanel(arrItemIds[i], i, bFirstTime, claimedItemId);
        }
        _UpdateAllItemStyles();
        // If we claimed items the play an animation of the selected tiles
        elItemContainer.Children().forEach((element, idx) => {
            if (claimedItemId) {
                aSelectedItems.forEach(selectedIndex => {
                    if (idx === selectedIndex) {
                        element.TriggerClass('reveal-anim');
                        $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.gift_claim', '');
                    }
                });
            }
        });
    }
    function _UpdateTime() {
        let secRemaining = StoreAPI.GetSecondsUntilXpRollover();
        $.GetContextPanel().SetDialogVariable('time-to-week-rollover', (secRemaining > 0) ? FormatText.SecondsToSignificantTimeString(secRemaining) : '');
        const xpBonuses = MyPersonaAPI.GetActiveXpBonuses();
        const bEligibleForCarePackage = xpBonuses.split(',').includes('2');
        if (bEligibleForCarePackage) {
            $.GetContextPanel().SetDialogVariable('frame-desc-text', $.Localize('#rankup_redemption_store_refresh', $.GetContextPanel()));
        }
        else {
            $.GetContextPanel().SetDialogVariable('frame-desc-text', $.Localize('#rankup_redemption_store_rollover_wait', $.GetContextPanel()));
        }
        m_schTimer = $.Schedule(30, _UpdateTime);
    }
    function _UpdateStoreState() {
        const objStore = GetPersonalStore();
        m_redeemableBalance = objStore ? objStore.redeemable_balance : 0;
        $.Msg('[p.rankup] _UpdateStoreState: m_redeemableBalance = ' + m_redeemableBalance);
        const elClaimButton = $.GetContextPanel().FindChildTraverse('jsRrsClaimButton');
        elClaimButton.enabled = m_redeemableBalance !== 0;
        elClaimButton.SetHasClass('hide', m_redeemableBalance === 0);
        if (m_redeemableBalance <= 0) {
            _CloseStore(objStore ? true : false);
        }
        else {
            _EnableStore();
        }
        _SetXpProgress();
        _UpdateTime();
    }
    function OnItemCustomization(numericType, type, itemid) {
        $.Msg('[p.rankup] OnItemCustomization ' + numericType + ' ' + type + ' ' + itemid + ' m_redeemableBalance=' + m_redeemableBalance);
        if (type !== 'free_reward_redeemed')
            return;
        if (m_timeoutScheduleHandle) {
            $.CancelScheduled(m_timeoutScheduleHandle);
            m_timeoutScheduleHandle = null;
        }
        // Because the reward was redeemed, we need to update the redeemable balance (it went down, OnInventoryUpdated is a delayed notification)
        const objStore = GetPersonalStore();
        m_redeemableBalance = objStore ? objStore.redeemable_balance : 0;
        $.Msg('[p.rankup] OnItemCustomization: m_redeemableBalance = ' + m_redeemableBalance);
        CheckForPopulateItems(false, itemid);
        // If we claimed an egg, then go to the home screen and zoom into the egg to complete the entire experience
        if (ItemInfo.IsPet(itemid)) {
            let myContextPanel = $.GetContextPanel(); // make sure it's "captured" because we'll bind this script callback to outside panels
            function DiscoverPanels() {
                if (!myContextPanel || !myContextPanel.IsValid())
                    return [];
                let elMainMenu = myContextPanel.Data().elMainMenu;
                let elPopupRoot = myContextPanel;
                if (!elMainMenu) {
                    elMainMenu = myContextPanel;
                    for (;;) {
                        let elParent = elMainMenu.GetParent();
                        if (elParent && elParent.IsValid()) {
                            if (elParent.Data().elMainMenu) {
                                elMainMenu = elParent.Data().elMainMenu;
                                elPopupRoot = elParent;
                                break;
                            }
                            elMainMenu = elParent;
                            if (elMainMenu.id === 'MainMenu')
                                break;
                        }
                        else
                            break;
                    }
                }
                if (!elMainMenu) {
                    $.Msg('[p.rankup] /PET CLAIMED/ Failed to find main menu panel');
                    return [];
                }
                // To fake a click on the Main Menu Home button --
                let btnHome = elMainMenu.FindChildInLayoutFile('MainMenuNavBarHome');
                if (!btnHome) {
                    $.Msg('[p.rankup] /PET CLAIMED/ Failed to find main menu MainMenuNavBarHome');
                    return [];
                }
                let elPetInfoPanel = elMainMenu.FindChildInLayoutFile('id-mainmenu-pet-info');
                let elZoomInBtn = elPetInfoPanel ? elPetInfoPanel.FindChildInLayoutFile('id-zoom-in-pet') : undefined;
                // allow elZoomBtn to be undefined for now (maybe main menu will re-discover the pet/egg shortly)
                let elCloseBtn = (elPopupRoot && (elPopupRoot != myContextPanel))
                    ? elPopupRoot.FindChildInLayoutFile('PopupRankUpRedemptionStoreClose')
                    : undefined;
                return [btnHome, elZoomInBtn, elPopupRoot, elCloseBtn];
            }
            function ClickToMainMenuAndZoomIn(arrParamPanels) {
                if (!SessionUtil.BCanUseMyPetInCurrentLobby())
                    return; // safety-check, if the user is still a client or rejoined quickly then just skip the animations
                let arrPanels = arrParamPanels ?? DiscoverPanels();
                if (arrPanels.length == 4 && arrPanels[0] && arrPanels[1]) {
                    // Click all the buttons
                    $.Msg('[p.rankup] /PET CLAIMED/ Activating main menu MainMenuNavBarHome');
                    $.DispatchEvent("Activated", arrPanels[0], "mouse");
                    // Action to fake clicking the "zoom in" button on the pet action panel
                    $.Msg('[p.rankup] /PET CLAIMED/ Activating vanity id-zoom-in-pet');
                    $.DispatchEvent("Activated", arrPanels[1], "mouse");
                    if (myContextPanel.Data().schPendingZoom) {
                        $.CancelScheduled(myContextPanel.Data().schPendingZoom);
                        delete myContextPanel.Data().schPendingZoom;
                    }
                }
            }
            //
            // If the user very quickly goes and clicks the "CLOSE" button in the popup,
            // then we want to run all the egg-zooming code too
            //
            {
                let arrPanels = DiscoverPanels();
                if (arrPanels.length == 4 && arrPanels[2] && arrPanels[3]) {
                    arrPanels[2].Data().fnPopupRankUpRedemptionStoreOnClose = ClickToMainMenuAndZoomIn.bind(null);
                }
                // If the user is a client and cannot access pet actions/zoom in the current lobby then
                // just exit the lobby so that we could complete UI/UX animations correctly
                if (!SessionUtil.BCanUseMyPetInCurrentLobby()) {
                    LobbyAPI.CloseSession();
                }
            }
            //
            // Automatically schedule to go to main menu and zoom in on your newly acquired egg
            //
            myContextPanel.Data().schPendingZoom = $.Schedule(2.0, () => {
                let arrPanels = DiscoverPanels();
                if (arrPanels.length == 4 && arrPanels[2] && arrPanels[3]) {
                    $.DispatchEvent("Activated", arrPanels[3], "mouse"); // clicking the "CLOSE" in the popup will execute our callback
                }
                else {
                    ClickToMainMenuAndZoomIn(arrPanels); // otherwise this is not a popup, so we are responsible for all the clicking
                }
            });
        }
    }
    function OnInventoryUpdated() {
        // We always update the other information when ever your inventory state changes
        _UpdateStoreState();
        $.Msg('[p.rankup] OnInventoryUpdated ');
        // We only need to PopulateItems the store when we have new store items to show or you claimed items
        CheckForPopulateItems();
    }
    function _GetSelectedItems() {
        let arrItems = [];
        const elItemContainer = $.GetContextPanel().FindChildTraverse('jsRrsItemContainer');
        for (let panel of elItemContainer.Children()) {
            if (panel.BHasClass('selected')) {
                arrItems.push({ item_id: panel.Data().itemid, cost: panel.Data().cost });
            }
        }
        return arrItems;
    }
    function _CalcPendingBalance() {
        return _GetSelectedItems().reduce((sum, item) => sum + item.cost, 0);
    }
    function _OnItemSelected(elPanel) {
        const elItemContainer = $.GetContextPanel().FindChildTraverse('jsRrsItemContainer');
        let aItemIds = _GetSelectedItems();
        $.Msg("[p.rankup] nPendingBalance: " + _CalcPendingBalance());
        $.Msg("[p.rankup] elPanel.Data().cost: " + elPanel.Data().cost);
        $.Msg("[p.rankup] elPanel.Data().itemid: " + elPanel.Data().itemid);
        // can afford
        if ((_CalcPendingBalance() + elPanel.Data().cost) <= m_redeemableBalance) {
            // toggle the selection
            elPanel.SetHasClass('selected', !elPanel.BHasClass('selected'));
            if (!elPanel.BHasClass('selected')) {
                $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.gift_select', 'MOUSE');
            }
            else {
                $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.gift_deselect', 'MOUSE');
            }
        }
        else {
            if (aItemIds.find(element => element.item_id === elPanel.Data().itemid)) {
                elPanel.SetHasClass('selected', !elPanel.BHasClass('selected'));
                if (!elPanel.BHasClass('selected')) {
                    $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.gift_select', 'MOUSE');
                }
                else {
                    $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.gift_deselect', 'MOUSE');
                }
            }
        }
        // pulse the selected
        for (let element of elItemContainer.Children()) {
            const bCantAffordClicked = !elPanel.BHasClass('selected') && _CalcPendingBalance() + elPanel.Data().cost > m_redeemableBalance;
            if (bCantAffordClicked) {
                if (element.BHasClass('selected')) {
                    element.TriggerClass('pulse-me');
                    $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.buymenu_failure', 'MOUSE');
                }
            }
        }
        _UpdateAllItemStyles();
    }
    function _UpdateAllItemStyles() {
        const elItemContainer = $.GetContextPanel().FindChildTraverse('jsRrsItemContainer');
        // mark cant-afford
        for (let element of elItemContainer.Children()) {
            const bCantAfford = !element.BHasClass('selected') && !element.BHasClass('item-claimed') && _CalcPendingBalance() + element.Data().cost > m_redeemableBalance;
            element.SetHasClass('cant-afford', bCantAfford);
            element.SetHasClass('disabled', bCantAfford || element.BHasClass('item-claimed'));
        }
    }
    function _CloseStore(bHasStore) {
        // show 'Come Back Next Level to claim future rewards'
        _EnableDisableStorePanels(false);
        $.GetContextPanel().AddClass('store-closed');
        if (bHasStore) {
            $.GetContextPanel().SetDialogVariable('frame-badge-text', $.Localize('#rankup_redemption_store_closed', $.GetContextPanel()));
        }
        else {
            $.GetContextPanel().SetDialogVariable('frame-badge-text', $.Localize('#rankup_redemption_store_earn_xp', $.GetContextPanel()));
        }
    }
    function _EnableStore() {
        $.Msg('[p.rankup] _EnableStore ');
        $.GetContextPanel().RemoveClass('waiting');
        $.GetContextPanel().RemoveClass('store-closed');
        $.GetContextPanel().SetDialogVariableInt('redeemable_balance', m_redeemableBalance);
        $.GetContextPanel().SetDialogVariable('frame-badge-text', $.Localize('#rankup_redemption_store_directive', $.GetContextPanel()));
        _EnableDisableStorePanels(true);
    }
    // we disable the store if it's closed, and also if we're between redemption action and response from server
    function _EnableDisableStorePanels(enableStore) {
        $.Msg('[p.rankup] _enableStore ' + enableStore);
        //disable input on all items
        $.GetContextPanel().Children().forEach(elPanel => {
            elPanel.enabled = enableStore;
        });
        const elItemContainer = $.GetContextPanel().FindChildTraverse('jsRrsItemContainer');
        for (let panel of elItemContainer.Children()) {
            panel.hittest = enableStore;
            panel.hittestchildren = enableStore;
        }
    }
    function _PulseItems() {
        const elItemContainer = $.GetContextPanel().FindChildTraverse('jsRrsItemContainer');
        for (let panel of elItemContainer.Children()) {
            if (!panel.BHasClass('item-claimed')) {
                panel.TriggerClass('pulse-me');
                $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.buymenu_failure', 'MOUSE');
            }
        }
    }
    function OnRedeem() {
        const numSelected = _GetSelectedItems().length;
        if (numSelected === 0) {
            _PulseItems();
            return;
        }
        InventoryAPI.SetInventorySortAndFilters('inv_sort_age', false, 'only_econ_items', '', '');
        if (InventoryAPI.GetInventoryCount() + numSelected > ItemInfo.NUM_BACKPACK_SLOTS) {
            UiToolkitAPI.ShowGenericPopupOk($.Localize('#popup_casket_title_error_casket_inv_full'), $.Localize('#SFUI_InventoryFull_Error'), '', () => { });
            return;
        }
        let szItemList = _GetSelectedItems().map(item => item.item_id).join(',');
        StoreAPI.StoreRedeemFreeRewards(szItemList);
        $.GetContextPanel().AddClass('waiting');
        _EnableDisableStorePanels(true);
        m_timeoutScheduleHandle = $.Schedule(10, _RedemptionTimedOut);
    }
    RankUpRedemptionStore.OnRedeem = OnRedeem;
    function _RedemptionTimedOut() {
        m_timeoutScheduleHandle = null;
        UiToolkitAPI.ShowGenericPopup($.Localize('#rankup_redemption_store_timeout_title'), $.Localize('#rankup_redemption_store_timeout_desc'), '');
        _EnableStore();
    }
    function _SetXpProgress() {
        const currentPoints = FriendsListAPI.GetFriendXp(MyPersonaAPI.GetXuid());
        const pointsPerLevel = MyPersonaAPI.GetXpPerLevel();
        let elXpBarInner = $.GetContextPanel().FindChildInLayoutFile('JsPlayerXpBarInner');
        let percentComplete = (currentPoints / pointsPerLevel) * 100;
        elXpBarInner.style.width = percentComplete + '%';
        elXpBarInner.GetParent().visible = true;
        const xpBonuses = MyPersonaAPI.GetActiveXpBonuses();
        const bEligibleForCarePackage = xpBonuses.split(',').includes('2');
        $.GetContextPanel().SetHasClass('care-package-eligible', bEligibleForCarePackage);
        const currentLvl = FriendsListAPI.GetFriendLevel(MyPersonaAPI.GetXuid());
        let elRankIcon = $.GetContextPanel().FindChildInLayoutFile('JsPlayerXpIcon');
        elRankIcon.SetImage('file://{images}/icons/xp/level' + currentLvl + '.png');
        if (bEligibleForCarePackage) {
            $.GetContextPanel().SetDialogVariable('frame-desc-text', $.Localize('#rankup_redemption_store_refresh', $.GetContextPanel()));
        }
        else {
            $.GetContextPanel().SetDialogVariable('frame-desc-text', $.Localize('#rankup_redemption_store_rollover_wait', $.GetContextPanel()));
        }
    }
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        $.GetContextPanel().RegisterForReadyEvents(true);
        RegisterForInventoryUpdate();
    }
})(RankUpRedemptionStore || (RankUpRedemptionStore = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmFua3VwX3JlZGVtcHRpb25fc3RvcmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9yYW5rdXBfcmVkZW1wdGlvbl9zdG9yZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBQ2xDLDZDQUE2QztBQUM3QywyQ0FBMkM7QUFDM0MsOENBQThDO0FBQzlDLDBDQUEwQztBQUUxQyxDQUFDLENBQUMsVUFBVSxDQUFFLFVBQVUsRUFBRSxRQUFRLENBQUUsQ0FBQztBQUVyQyxJQUFVLHFCQUFxQixDQThzQjlCO0FBOXNCRCxXQUFVLHFCQUFxQjtJQUU5QixJQUFJLG1CQUFtQixHQUFXLENBQUMsQ0FBQztJQUNwQyxJQUFJLFdBQVcsR0FBVyxDQUFDLENBQUMsQ0FBQztJQUM3QixJQUFJLHVCQUFzQyxDQUFDO0lBQzNDLElBQUksNkJBQTRDLENBQUM7SUFDakQsSUFBSSxzQkFBcUMsQ0FBQztJQUMxQyxJQUFJLFlBQVksR0FBRyxLQUFLLENBQUM7SUFDekIsSUFBSSxVQUF5QixDQUFDO0lBRTlCLFNBQVMsMEJBQTBCO1FBRWxDLElBQUssWUFBWTtZQUNoQixPQUFPO1FBRVIsWUFBWSxHQUFHLElBQUksQ0FBQztRQUNwQixpQkFBaUIsRUFBRSxDQUFDO1FBQ3BCLHFCQUFxQixFQUFFLENBQUM7UUFFeEIsc0JBQXNCLEdBQUcsQ0FBQyxDQUFDLHlCQUF5QixDQUFFLDhDQUE4QyxFQUFFLGtCQUFrQixDQUFFLENBQUM7UUFDM0gsNkJBQTZCLEdBQUcsQ0FBQyxDQUFDLHlCQUF5QixDQUFFLDJEQUEyRCxFQUFFLG1CQUFtQixDQUFFLENBQUM7UUFDaEosQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHNCQUFzQixDQUFFLElBQUksQ0FBRSxDQUFDO1FBRW5ELENBQUMsQ0FBQyxvQkFBb0IsQ0FBRSxpQkFBaUIsRUFBRSxDQUFDLENBQUMsZUFBZSxFQUFFLEVBQUUs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