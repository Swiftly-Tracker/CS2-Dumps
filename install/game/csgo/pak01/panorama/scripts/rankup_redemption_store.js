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
        if (genTime != m_timeStamp || claimedItemId) {
            if (genTime != m_timeStamp) {
                m_timeStamp = genTime;
                GameInterfaceAPI.SetSettingString('cl_redemption_reset_timestamp', genTime);
            }
            PopulateItems(bFirstTime, claimedItemId);
        }
    }
    const TEST_DOUBLE_CLAIM_COST_SLOT = -1;
    function _GetClaimCost(itemId, index) {
        if (itemId !== '-' && InventoryAPI.DoesItemMatchDefinitionByName(itemId, 'chicken_egg'))
            return 2;
        if (itemId !== '-' && InventoryAPI.DoesItemMatchDefinitionByName(itemId, 'chicken_feed'))
            return 2;
        return (index === TEST_DOUBLE_CLAIM_COST_SLOT) ? 2 : 1;
    }
    function _CreateItemPanel(itemId, index, bFirstTime, claimedItemId = '') {
        const bNoDropsEarned = itemId === '-';
        if (itemId !== '-' && (!InventoryAPI.IsItemInfoValid(itemId) || !InventoryAPI.IsValidItemID(itemId))) {
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
            elGhostItem.SetPanelEvent('onactivate', () => _OnItemSelected(elGhostItem));
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
        const objStore = GetPersonalStore();
        $.GetContextPanel().RemoveClass('waiting');
        if (bFirstTime) {
            $.GetContextPanel().TriggerClass('reveal-store');
        }
        const elItemContainer = $.GetContextPanel().FindChildTraverse('jsRrsItemContainer');
        let aSelectedItems = [];
        elItemContainer.Children().forEach(element => {
            if (element.BHasClass('selected')) {
                aSelectedItems.push(element.Data().index);
            }
        });
        elItemContainer.RemoveAndDeleteChildren();
        const arrItemIds = objStore ? Object.values(objStore.items) : ['-', '-', '-', '-'];
        for (let i = 0; i < arrItemIds.length; i++) {
            _CreateItemPanel(arrItemIds[i], i, bFirstTime, claimedItemId);
        }
        _UpdateAllItemStyles();
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
        if (type !== 'free_reward_redeemed')
            return;
        if (m_timeoutScheduleHandle) {
            $.CancelScheduled(m_timeoutScheduleHandle);
            m_timeoutScheduleHandle = null;
        }
        const objStore = GetPersonalStore();
        m_redeemableBalance = objStore ? objStore.redeemable_balance : 0;
        CheckForPopulateItems(false, itemid);
        if (ItemInfo.IsPet(itemid)) {
            let myContextPanel = $.GetContextPanel();
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
                    return [];
                }
                let btnHome = elMainMenu.FindChildInLayoutFile('MainMenuNavBarHome');
                if (!btnHome) {
                    return [];
                }
                let elPetInfoPanel = elMainMenu.FindChildInLayoutFile('id-mainmenu-pet-info');
                let elZoomInBtn = elPetInfoPanel ? elPetInfoPanel.FindChildInLayoutFile('id-zoom-in-pet') : undefined;
                let elCloseBtn = (elPopupRoot && (elPopupRoot != myContextPanel))
                    ? elPopupRoot.FindChildInLayoutFile('PopupRankUpRedemptionStoreClose')
                    : undefined;
                return [btnHome, elZoomInBtn, elPopupRoot, elCloseBtn];
            }
            function ClickToMainMenuAndZoomIn(arrParamPanels) {
                if (!SessionUtil.BCanUseMyPetInCurrentLobby())
                    return;
                let arrPanels = arrParamPanels ?? DiscoverPanels();
                if (arrPanels.length == 4 && arrPanels[0] && arrPanels[1]) {
                    $.DispatchEvent("Activated", arrPanels[0], "mouse");
                    $.DispatchEvent("Activated", arrPanels[1], "mouse");
                    if (myContextPanel.Data().schPendingZoom) {
                        $.CancelScheduled(myContextPanel.Data().schPendingZoom);
                        delete myContextPanel.Data().schPendingZoom;
                    }
                }
            }
            {
                let arrPanels = DiscoverPanels();
                if (arrPanels.length == 4 && arrPanels[2] && arrPanels[3]) {
                    arrPanels[2].Data().fnPopupRankUpRedemptionStoreOnClose = ClickToMainMenuAndZoomIn.bind(null);
                }
                if (!SessionUtil.BCanUseMyPetInCurrentLobby()) {
                    LobbyAPI.CloseSession();
                }
            }
            myContextPanel.Data().schPendingZoom = $.Schedule(2.0, () => {
                let arrPanels = DiscoverPanels();
                if (arrPanels.length == 4 && arrPanels[2] && arrPanels[3]) {
                    $.DispatchEvent("Activated", arrPanels[3], "mouse");
                }
                else {
                    ClickToMainMenuAndZoomIn(arrPanels);
                }
            });
        }
    }
    function OnInventoryUpdated() {
        _UpdateStoreState();
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
        if ((_CalcPendingBalance() + elPanel.Data().cost) <= m_redeemableBalance) {
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
        for (let element of elItemContainer.Children()) {
            const bCantAfford = !element.BHasClass('selected') && !element.BHasClass('item-claimed') && _CalcPendingBalance() + element.Data().cost > m_redeemableBalance;
            element.SetHasClass('cant-afford', bCantAfford);
            element.SetHasClass('disabled', bCantAfford || element.BHasClass('item-claimed'));
        }
    }
    function _CloseStore(bHasStore) {
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
        $.GetContextPanel().RemoveClass('waiting');
        $.GetContextPanel().RemoveClass('store-closed');
        $.GetContextPanel().SetDialogVariableInt('redeemable_balance', m_redeemableBalance);
        $.GetContextPanel().SetDialogVariable('frame-badge-text', $.Localize('#rankup_redemption_store_directive', $.GetContextPanel()));
        _EnableDisableStorePanels(true);
    }
    function _EnableDisableStorePanels(enableStore) {
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
    {
        $.GetContextPanel().RegisterForReadyEvents(true);
        RegisterForInventoryUpdate();
    }
})(RankUpRedemptionStore || (RankUpRedemptionStore = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmFua3VwX3JlZGVtcHRpb25fc3RvcmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9yYW5rdXBfcmVkZW1wdGlvbl9zdG9yZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBQ2xDLDZDQUE2QztBQUM3QywyQ0FBMkM7QUFDM0MsOENBQThDO0FBQzlDLDBDQUEwQztBQUUxQyxDQUFDLENBQUMsVUFBVSxDQUFFLFVBQVUsRUFBRSxRQUFRLENBQUUsQ0FBQztBQUVyQyxJQUFVLHFCQUFxQixDQThzQjlCO0FBOXNCRCxXQUFVLHFCQUFxQjtJQUU5QixJQUFJLG1CQUFtQixHQUFXLENBQUMsQ0FBQztJQUNwQyxJQUFJLFdBQVcsR0FBVyxDQUFDLENBQUMsQ0FBQztJQUM3QixJQUFJLHVCQUFzQyxDQUFDO0lBQzNDLElBQUksNkJBQTRDLENBQUM7SUFDakQsSUFBSSxzQkFBcUMsQ0FBQztJQUMxQyxJQUFJLFlBQVksR0FBRyxLQUFLLENBQUM7SUFDekIsSUFBSSxVQUF5QixDQUFDO0lBRTlCLFNBQVMsMEJBQTBCO1FBRWxDLElBQUssWUFBWTtZQUNoQixPQUFPO1FBRVIsWUFBWSxHQUFHLElBQUksQ0FBQztRQUNwQixpQkFBaUIsRUFBRSxDQUFDO1FBQ3BCLHFCQUFxQixFQUFFLENBQUM7UUFFeEIsc0JBQXNCLEdBQUcsQ0FBQyxDQUFDLHlCQUF5QixDQUFFLDhDQUE4QyxFQUFFLGtCQUFrQixDQUFFLENBQUM7UUFDM0gsNkJBQTZCLEdBQUcsQ0FBQyxDQUFDLHlCQUF5QixDQUFFLDJEQUEyRCxFQUFFLG1CQUFtQixDQUFFLENBQUM7UUFDaEosQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHNCQUFzQixDQUFFLElBQUksQ0FBRSxDQUFDO1FBRW5ELENBQUMsQ0FBQyxvQkFBb0IsQ0FBRSxpQkFBaUIsRUFBRSxDQUFDLENBQUMsZUFBZSxFQUFFLEVBQUUs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