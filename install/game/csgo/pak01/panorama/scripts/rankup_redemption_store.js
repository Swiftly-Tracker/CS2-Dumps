"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/formattext.ts" />
/// <reference path="common/iteminfo.ts" />
/// <reference path="itemtile_store.ts" />
var RankUpRedemptionStore;
(function (RankUpRedemptionStore) {
    let m_redeemableBalance = 0;
    let m_timeStamp = -1;
    let m_timeoutScheduleHandle;
    let m_profileCustomizationHandler;
    let m_profileUpdateHandler;
    let m_registered = false;
    let m_schTimer;
    function _msg(text) {
    }
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
            _msg("READY FOR DISPLAY");
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
            _msg("UN-READY FOR DISPLAY");
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
    function _CreateItemPanel(itemId, index, bFirstTime, claimedItemId = '') {
        const bNoDropsEarned = itemId === '-';
        if (itemId !== '-' && (!InventoryAPI.IsItemInfoValid(itemId) || !InventoryAPI.IsValidItemID(itemId))) {
            _msg('item ' + itemId + ' is invalid');
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
        elGhostItem.Data().cost = 1;
        elGhostItem.Data().index = index;
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
        _msg('PopulateItems');
        _msg('claimedItemId:' + claimedItemId);
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
        _msg('OnItemCustomization ' + numericType + ' ' + type + ' ' + itemid);
        if (type !== 'free_reward_redeemed')
            return;
        if (m_timeoutScheduleHandle) {
            $.CancelScheduled(m_timeoutScheduleHandle);
            m_timeoutScheduleHandle = null;
        }
        CheckForPopulateItems(false, itemid);
    }
    function OnInventoryUpdated() {
        _UpdateStoreState();
        _msg('OnInventoryUpdated ');
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
        _msg('_EnableStore ');
        $.GetContextPanel().RemoveClass('waiting');
        $.GetContextPanel().RemoveClass('store-closed');
        $.GetContextPanel().SetDialogVariableInt('redeemable_balance', m_redeemableBalance);
        $.GetContextPanel().SetDialogVariable('frame-badge-text', $.Localize('#rankup_redemption_store_directive', $.GetContextPanel()));
        _EnableDisableStorePanels(true);
    }
    function _EnableDisableStorePanels(enableStore) {
        _msg('_enableStore ' + enableStore);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmFua3VwX3JlZGVtcHRpb25fc3RvcmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9yYW5rdXBfcmVkZW1wdGlvbl9zdG9yZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBQ2xDLDZDQUE2QztBQUM3QywyQ0FBMkM7QUFDM0MsMENBQTBDO0FBRTFDLElBQVUscUJBQXFCLENBb2tCOUI7QUFwa0JELFdBQVUscUJBQXFCO0lBRTlCLElBQUksbUJBQW1CLEdBQVcsQ0FBQyxDQUFDO0lBQ3BDLElBQUksV0FBVyxHQUFXLENBQUMsQ0FBQyxDQUFDO0lBQzdCLElBQUksdUJBQXNDLENBQUM7SUFDM0MsSUFBSSw2QkFBNEMsQ0FBQztJQUNqRCxJQUFJLHNCQUFxQyxDQUFDO0lBQzFDLElBQUksWUFBWSxHQUFHLEtBQUssQ0FBQztJQUN6QixJQUFJLFVBQXlCLENBQUM7SUFFOUIsU0FBUyxJQUFJLENBQUcsSUFBWTtJQUc1QixDQUFDO0lBRUQsU0FBUywwQkFBMEI7UUFFbEMsSUFBSyxZQUFZO1lBQ2hCLE9BQU87UUFFUixZQUFZLEdBQUcsSUFBSSxDQUFDO1FBQ3BCLGlCQUFpQixFQUFFLENBQUM7UUFDcEIscUJBQXFCLEVBQUUsQ0FBQztRQUV4QixzQkFBc0IsR0FBRyxDQUFDLENBQUMseUJBQXlCLENBQUUsOENBQThDLEVBQUUsa0JBQWtCLENBQUUsQ0FBQztRQUMzSCw2QkFBNkIsR0FBRyxDQUFDLENBQUMseUJBQXlCLENBQUUsMkRBQTJELEVBQUUsbUJBQW1CLENBQUUsQ0FBQztRQUNoSixDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsc0JBQXNCLENBQUUsSUFBSSxDQUFFLENBQUM7UUFFbkQsQ0FBQyxDQUFDLG9CQUFvQixDQUFFLGlCQUFpQixFQUFFLENBQUMsQ0FBQyxlQUFlLEVBQUUsRUFBRSxHQUFHLEVBQUU7WUFFcEUsSUFBSSxDQUFFLG1C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