"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../inspect.ts" />
/// <reference path="../notification/notification_equip.ts" />
/// <reference path="popup_inspect_action-bar.ts" />
/// <reference path="popup_inspect_async-bar.ts" />
/// <reference path="popup_inspect_header.ts" />
/// <reference path="popup_capability_header.ts" />
/// <reference path="popup_inspect_purchase-bar.ts" />
/// <reference path="popup_inspect_shared.ts" />
var InventoryInspect;
(function (InventoryInspect) {
    let _m_PanelRegisteredForEvents;
    function Init() {
        const itemId = InspectShared.GetPopupSetting('item_id');
        $.GetContextPanel().SetAttributeString('popup-id', $.GetContextPanel().id);
        if (InventoryAPI.IsRental(itemId)) {
            InspectShared.SetPopupSetting('hide_all_action_items', true);
            InspectShared.SetPopupSetting('inspect_only', true);
        }
        if (!_m_PanelRegisteredForEvents) {
            _m_PanelRegisteredForEvents = $.RegisterForUnhandledEvent('PanoramaComponent_Loadout_EquipSlotChanged', _ShowNotification);
            $.RegisterForUnhandledEvent('PanoramaComponent_Store_PurchaseCompleted', _ItemAcquired);
            $.RegisterForUnhandledEvent("CSGOInspectBackgroundMapChanged", _UpdateInspectMap);
        }
        _SetupLootlistNavPanels(itemId);
        _UpdatePanelData(itemId);
        _PlayShowPanelSound(itemId);
        _LoadEquipNotification();
    }
    InventoryInspect.Init = Init;
    function _UpdatePanelData(itemId) {
        InspectShared.SetPopupSetting('item_id', itemId);
        const elItemModelImagePanel = $.GetContextPanel().FindChildInLayoutFile('PopUpInspectModelOrImage');
        InspectModelImage.Init(elItemModelImagePanel, itemId);
        InspectActionBar.Init();
        InspectAsyncActionBar.Init();
        InspectHeader.Init();
        CapabilityHeader.Init();
        InspectPurchaseBar.Init();
        _SetDescription(itemId);
    }
    function _PlayShowPanelSound(itemId) {
        const category = InventoryAPI.GetLoadoutCategory(itemId);
        const slot = InventoryAPI.GetDefaultSlot(itemId);
        let inspectSound = "";
        if (category == "heavy" || category == "rifle" || category == "smg" || category == "secondary") {
            inspectSound = "inventory_inspect_weapon";
        }
        else if (category == "melee") {
            inspectSound = "inventory_inspect_knife";
        }
        else if (ItemInfo.IsSticker(itemId)) {
            inspectSound = "inventory_inspect_sticker";
        }
        else if (category == "spray") {
            inspectSound = "inventory_inspect_graffiti";
        }
        else if (category == "musickit") {
            inspectSound = "inventory_inspect_musicKit";
        }
        else if (category == "flair0") {
            inspectSound = "inventory_inspect_coin";
        }
        else if (category == "clothing" && slot == "clothing_hands") {
            inspectSound = "inventory_inspect_gloves";
        }
        else {
            inspectSound = "inventory_inspect_sticker";
        }
        $.DispatchEvent("CSGOPlaySoundEffect", inspectSound, "MOUSE");
    }
    function _SetDescription(id) {
        $.GetContextPanel().SetDialogVariable('item_description', '');
        if (!InventoryAPI.IsValidItemID(id)) {
            return;
        }
        const descText = InventoryAPI.GetItemDescription(id, '');
        const shortString = descText.substring(0, descText.indexOf("</font></b><br><font color='#9da1a9'>"));
        $.GetContextPanel().SetDialogVariable('item_description', shortString === '' ? descText : shortString);
    }
    function _LoadEquipNotification() {
        const elParent = $.GetContextPanel();
        const elNotification = $.CreatePanel('Panel', elParent, 'InspectNotificationEquip');
        elNotification.BLoadLayout('file://{resources}/layout/notification/notification_equip.xml', false, false);
    }
    function _ShowNotification(team, slot, oldItemId, newItemId, bNew) {
        if (!bNew)
            return;
        const elNotification = $.GetContextPanel().FindChildInLayoutFile('InspectNotificationEquip');
        if (elNotification && elNotification.IsValid()) {
            EquipNotification.ShowEquipNotification(elNotification, slot, newItemId);
        }
    }
    function _UpdateInspectMap() {
        InspectModelImage.SwitchMap($.GetContextPanel());
    }
    let m_lootlistItemIndex = 0;
    function _SetupLootlistNavPanels(itemId) {
        m_lootlistItemIndex = 0;
        let aLootlistIds = _GetLootlistItems();
        if (aLootlistIds.length < 1) {
            const rentalItemIds = InspectShared.GetPopupSetting('rental_item_ids');
            if (!rentalItemIds) {
                $.GetContextPanel().FindChildInLayoutFile('id-lootlist-btns-container').visible = false;
                $.GetContextPanel().FindChildInLayoutFile('id-lootlist-title-container').visible = false;
                return;
            }
            aLootlistIds = rentalItemIds.split(',');
        }
        InspectShared.SetPopupSetting('is_item_in_lootlist', true);
        $.GetContextPanel().FindChildInLayoutFile('id-lootlist-btns-container').visible = true;
        $.GetContextPanel().FindChildInLayoutFile('id-lootlist-title-container').visible = true;
        m_lootlistItemIndex = aLootlistIds.indexOf(itemId);
        const btnNext = $.GetContextPanel().FindChildInLayoutFile('id-lootlist-next');
        const btnPrev = $.GetContextPanel().FindChildInLayoutFile('id-lootlist-prev');
        const count = aLootlistIds.length;
        _EnableNextPrevBtns(aLootlistIds);
        _UpdateLootlistTitleBar(count);
        btnNext.SetPanelEvent('onactivate', () => {
            m_lootlistItemIndex = (m_lootlistItemIndex < (count - 1)) ? m_lootlistItemIndex + 1 : m_lootlistItemIndex;
            _EnableNextPrevBtns(aLootlistIds);
            _UpdatePanelData(aLootlistIds[m_lootlistItemIndex]);
            _UpdateCharacterModelPanel(aLootlistIds[m_lootlistItemIndex]);
        });
        btnPrev.SetPanelEvent('onactivate', () => {
            m_lootlistItemIndex = m_lootlistItemIndex > 0 ? m_lootlistItemIndex - 1 : m_lootlistItemIndex;
            _EnableNextPrevBtns(aLootlistIds);
            _UpdatePanelData(aLootlistIds[m_lootlistItemIndex]);
            _UpdateCharacterModelPanel(aLootlistIds[m_lootlistItemIndex]);
        });
    }
    function _UpdateCharacterModelPanel(itemId) {
        if (!(ItemInfo.IsWeapon(itemId) || ItemInfo.IsMelee(itemId))) {
            return;
        }
        const elActionBarPanel = $.GetContextPanel().FindChildInLayoutFile('PopUpInspectActionBar');
        InspectActionBar.OnUpdateCharModel(elActionBarPanel.FindChildInLayoutFile('InspectDropdownCharModels'), itemId);
    }
    function _EnableNextPrevBtns(aLootlistIds) {
        const btnNext = $.GetContextPanel().FindChildInLayoutFile('id-lootlist-next');
        const btnPrev = $.GetContextPanel().FindChildInLayoutFile('id-lootlist-prev');
        btnNext.enabled = (m_lootlistItemIndex < aLootlistIds.length - 1) && (aLootlistIds[m_lootlistItemIndex + 1] !== '0');
        btnPrev.enabled = m_lootlistItemIndex > 0;
        _SetBtnLabel(btnNext, btnPrev, aLootlistIds);
        _UpdateLootlistTitleBar(aLootlistIds.length);
    }
    function _SetBtnLabel(btnNext, btnPrev, aLootlistIds) {
        if (btnNext.enabled) {
            const elNextLabel = btnNext.FindChildInLayoutFile('id-lootlist-label');
            elNextLabel.text = InventoryAPI.GetItemName(aLootlistIds[m_lootlistItemIndex + 1]);
            const rarityColor = InventoryAPI.GetItemRarityColor(aLootlistIds[m_lootlistItemIndex + 1]);
            if (rarityColor) {
                btnNext.FindChildInLayoutFile('id-lootlist-rarity').style.washColor = rarityColor;
            }
        }
        if (btnPrev.enabled) {
            const elPrevLabel = btnPrev.FindChildInLayoutFile('id-lootlist-label');
            elPrevLabel.text = InventoryAPI.GetItemName(aLootlistIds[m_lootlistItemIndex - 1]);
            const rarityColor = InventoryAPI.GetItemRarityColor(aLootlistIds[m_lootlistItemIndex - 1]);
            if (rarityColor) {
                btnPrev.FindChildInLayoutFile('id-lootlist-rarity').style.washColor = rarityColor;
            }
        }
    }
    function _GetLootlistItems() {
        m_lootlistItemIndex = 0;
        const aLootlistIds = [];
        const caseId = InspectShared.GetPopupSetting('case_id_for_lootlist');
        if (!caseId) {
            return aLootlistIds;
        }
        const count = InventoryAPI.GetLootListItemsCount(caseId);
        for (let i = 0; i < count; i++) {
            aLootlistIds.push(InventoryAPI.GetLootListItemIdByIndex(caseId, i));
        }
        return aLootlistIds;
    }
    function _UpdateLootlistTitleBar(count) {
        const elPanel = $.GetContextPanel().FindChildInLayoutFile('id-lootlist-title-container');
        const lootlistOverride = InspectShared.GetPopupSetting('lootlist_name_override');
        let caseName;
        if (lootlistOverride !== 'false' && lootlistOverride !== '') {
            caseName = $.Localize(lootlistOverride, $.GetContextPanel());
        }
        else {
            const caseId = InspectShared.GetPopupSetting('case_id_for_lootlist');
            caseName = InventoryAPI.GetItemName(caseId);
        }
        elPanel.SetDialogVariable('container', caseName);
        elPanel.SetDialogVariableInt('index', m_lootlistItemIndex + 1);
        elPanel.SetDialogVariableInt('total', count);
        const rentalItemIds = InspectShared.GetPopupSetting('rental_item_ids');
        const text = !rentalItemIds ? $.Localize('#popup_inv_lootlist_header', elPanel) : $.Localize('#popup_inv_lootlist_rental_header', elPanel);
        elPanel.SetDialogVariable('lootlist-header', text);
    }
    function _ItemAcquired(ItemId) {
        const storeItemId = InspectShared.GetPopupSetting('store_item_id');
        if (storeItemId) {
            const storeItemSeasonAccess = InventoryAPI.GetItemAttributeValue(storeItemId, 'season access');
            const acquiredItemSeasonAccess = InventoryAPI.GetItemAttributeValue(ItemId, 'season access');
            if (acquiredItemSeasonAccess && (storeItemSeasonAccess === acquiredItemSeasonAccess)) {
                const nSeasonAccess = GameTypesAPI.GetActiveSeasionIndexValue();
                const nCoinRank = MyPersonaAPI.GetMyMedalRankByType((nSeasonAccess + 1) + "Operation$OperationCoin");
                if (nCoinRank === 1 && nSeasonAccess === acquiredItemSeasonAccess) {
                    ShowActiveItemPopup(ItemId);
                    return;
                }
            }
            const storeItemToolType = InventoryAPI.GetToolType(storeItemId);
            const acquiredItemToolType = InventoryAPI.GetToolType(ItemId);
            if (storeItemToolType === 'xp_shop_ticket' && acquiredItemToolType === 'xp_shop_ticket') {
                InventoryAPI.AcknowledgeNewItembyItemID(ItemId);
                ClosePopup();
                $.DispatchEvent('HideStoreStatusPanel');
            }
            const defName = InventoryAPI.GetItemDefinitionName(InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(g_ActiveTournamentInfo.itemid_charge, 0));
            if (InventoryAPI.DoesItemMatchDefinitionByName(storeItemId, defName) && InventoryAPI.DoesItemMatchDefinitionByName(ItemId, defName)) {
                ClosePopup();
                $.DispatchEvent('ShowAcknowledgePopup', '', '');
                $.DispatchEvent('HideStoreStatusPanel');
                return;
            }
            ClosePopup();
            $.DispatchEvent('ShowAcknowledgePopup', '', ItemId);
            $.DispatchEvent('HideStoreStatusPanel');
        }
    }
    function ShowActiveItemPopup(itemId) {
        InventoryAPI.AcknowledgeNewItembyItemID(itemId);
        ClosePopup();
        $.DispatchEvent('HideStoreStatusPanel');
        const elPanel = UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_inventory_inspect.xml', 'itemid=' + itemId +
            '&' + 'asyncworktype=useitem' +
            '&' + 'seasonpass=true');
        const oSettings = {
            item_id: itemId,
            work_type: 'useitem',
            is_season_pass: true
        };
        elPanel.Data().oSettings = oSettings;
    }
    function ClosePopup() {
        const elAsyncActionBarPanel = $.GetContextPanel().FindChildInLayoutFile('PopUpInspectAsyncBar');
        const elPurchase = $.GetContextPanel().FindChildInLayoutFile('PopUpInspectPurchaseBar');
        if (!elAsyncActionBarPanel.BHasClass('hidden')) {
            InspectAsyncActionBar.OnEventToClose();
        }
        else if (!elPurchase.BHasClass('hidden')) {
            InspectPurchaseBar.ClosePopup();
        }
        else {
            if ($.GetContextPanel().IsValid()) {
                let callbackFromPopup = InspectShared.GetPopupSetting('callback_handle');
                callbackFromPopup = !callbackFromPopup ? -1 : callbackFromPopup;
                InspectActionBar.CloseBtnAction(callbackFromPopup, elAsyncActionBarPanel);
            }
        }
    }
    InventoryInspect.ClosePopup = ClosePopup;
    function _Refresh() {
        const itemId = InspectShared.GetPopupSetting('item_id');
        if (!itemId || !InventoryAPI.IsValidItemID(itemId)) {
            ClosePopup();
            return;
        }
        _UpdatePanelData(itemId);
        InspectActionBar.NavigateModelPanel('InspectModel');
    }
    function _BlurPanel(panelId, shouldBlur) {
        if (shouldBlur) {
            if (panelId == $.GetContextPanel().id) {
                $.GetContextPanel().SetHasClass('popup-inspect-modelpanel_darken_blur', shouldBlur);
            }
        }
        else {
            if ($.GetContextPanel().BHasClass('popup-inspect-modelpanel_darken_blur')) {
                $.GetContextPanel().SetHasClass('popup-inspect-modelpanel_darken_blur', false);
            }
        }
    }
    $.RegisterForUnhandledEvent('CSGOShowMainMenu', _Refresh);
    $.RegisterForUnhandledEvent('PopulateLoadingScreen', ClosePopup);
    $.RegisterForUnhandledEvent('BlurPopupPanel', _BlurPanel);
})(InventoryInspect || (InventoryInspect = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfaW52ZW50b3J5X2luc3BlY3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfaW52ZW50b3J5X2luc3BlY3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyxzQ0FBc0M7QUFDdEMsOERBQThEO0FBQzlELG9EQUFvRDtBQUNwRCxtREFBbUQ7QUFDbkQsZ0RBQWdEO0FBQ2hELG1EQUFtRDtBQUNuRCxzREFBc0Q7QUFDdEQsZ0RBQWdEO0FBRWhELElBQVUsZ0JBQWdCLENBK2N6QjtBQS9jRCxXQUFVLGdCQUFnQjtJQUV6QixJQUFJLDJCQUErQyxDQUFDO0lBRXBELFNBQWdCLElBQUk7UUFFbkIsTUFBTSxNQUFNLEdBQUcsYUFBYSxDQUFDLGVBQWUsQ0FBRSxTQUFTLENBQVksQ0FBQztRQUNwRSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsa0JBQWtCLENBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxFQUFFLENBQUUsQ0FBQztRQUc3RSxJQUFLLFlBQVksQ0FBQyxRQUFRLENBQUUsTUFBTSxDQUFFLEVBQ3BDO1lBQ0MsYUFBYSxDQUFDLGVBQWUsQ0FBRSx1QkFBdUIsRUFBRSxJQUFJLENBQUUsQ0FBQztZQUMvRCxhQUFhLENBQUMsZUFBZSxDQUFFLGNBQWMsRUFBRSxJQUFJLENBQUUsQ0FBQztTQUN0RDtRQU1ELElBQUssQ0FBQywyQkFBMkIsRUFDakM7WUFDQywyQkFBMkIsR0FBRyxDQUFDLENBQUMseUJBQXlCLENBQUUsNENBQTRDLEVBQUUsaUJBQWlCLENBQUUsQ0FBQztZQUM3SCxDQUFDLENBQUMseUJBQXlCLENBQUUsMkNBQTJDLEVBQUUsYUFBYSxDQUFFLENBQUM7WUFDMUYsQ0FBQyxDQUFDLHlCQUF5QixDQUFFLGlDQUFpQyxFQUFFLGlCQUFpQixDQUFFLENBQUM7U0FDcEY7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