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
        // Set required attributes
        // if ( ItemInfo.IsFauxOrRentalOrPreviewTool( itemId ) ) // << store items use this screen with various purchase options
        if (InventoryAPI.IsRental(itemId)) {
            InspectShared.SetPopupSetting('hide_all_action_items', true);
            InspectShared.SetPopupSetting('inspect_only', true);
        }
        // These below objects will check the attributes of the context panel
        // and show and hide themselves.
        // Each panel will check for it's relevent attributes to set it self up.
        // This panel is used for single item actions, like inspect, delete, purchase of a non lootlist item.
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
        // when updating the panel from lootlist inspect or other places update the item id
        InspectShared.SetPopupSetting('item_id', itemId);
        const elItemModelImagePanel = $.GetContextPanel().FindChildInLayoutFile('PopUpInspectModelOrImage');
        InspectModelImage.Init(elItemModelImagePanel, itemId);
        InspectActionBar.Init();
        InspectAsyncActionBar.Init();
        InspectHeader.Init();
        CapabilityHeader.Init();
        InspectPurchaseBar.Init();
        _SetDescription(itemId);
        // Always do the "Pet look at" when inspecting a pet from the inventory
        if (ItemInfo.IsPet(itemId)) {
            InspectModelImage.StartPetLookAt();
        }
        //DEVONLY{
        // Allow overriding the keychain seed interactively
        if (ItemInfo.IsKeychain(itemId)
            && GameInterfaceAPI.GetSettingString('keychain_seed_override')
            && (parseInt(GameInterfaceAPI.GetSettingString('keychain_seed_override')) >= 0)) {
            const elSlider = $.GetContextPanel().FindChildInLayoutFile('InspectItemSlider');
            if (elSlider) {
                elSlider.min = 0;
                elSlider.max = 100000;
                elSlider.default = 50000;
                elSlider.SetValueNoEvents(parseInt(GameInterfaceAPI.GetSettingString('keychain_seed_override')));
                elSlider.RemoveClass('hidden');
                elSlider.SetPanelEvent('onvaluechanged', () => GameInterfaceAPI.SetSettingString('keychain_seed_override', '' + Math.floor(elSlider.value)));
            }
        }
        if (ItemInfo.IsSticker(itemId)
            && GameInterfaceAPI.GetSettingString('sticker_wear_amount_override')
            && (parseInt(GameInterfaceAPI.GetSettingString('sticker_wear_amount_override')) >= 0)) {
            const elSlider = $.GetContextPanel().FindChildInLayoutFile('InspectItemSlider');
            if (elSlider) {
                elSlider.min = 0;
                elSlider.max = 100000;
                elSlider.default = 50000;
                elSlider.SetValueNoEvents(parseInt(GameInterfaceAPI.GetSettingString('sticker_wear_amount_override')));
                elSlider.RemoveClass('hidden');
                elSlider.SetPanelEvent('onvaluechanged', () => GameInterfaceAPI.SetSettingString('sticker_wear_amount_override', '' + Math.floor(elSlider.value)));
            }
        }
        //}DEVONLY
    }
    function _PlayShowPanelSound(itemId) {
        const category = InventoryAPI.GetLoadoutCategory(itemId);
        const slot = InventoryAPI.GetDefaultSlot(itemId);
        //Calculate and play the correct sound effect for inspecting this item.
        let inspectSound = "";
        if (category == "heavy" || category == "rifle" || category == "smg" || category == "secondary") {
            //gun inspect sound
            inspectSound = "inventory_inspect_weapon";
        }
        else if (category == "melee") {
            //knife inspect sound
            inspectSound = "inventory_inspect_knife";
        }
        else if (ItemInfo.IsSticker(itemId)) {
            //sticker sound
            inspectSound = "inventory_inspect_sticker";
        }
        else if (category == "spray") {
            //graffiti sound
            inspectSound = "inventory_inspect_graffiti";
        }
        else if (category == "musickit") {
            //music kit sound
            inspectSound = "inventory_inspect_musicKit";
        }
        else if (category == "flair0") {
            //coin sound
            inspectSound = "inventory_inspect_coin";
        }
        else if (category == "clothing" && slot == "clothing_hands") {
            //gloves sound
            inspectSound = "inventory_inspect_gloves";
        }
        else {
            //generic sound
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
        // removes the collection list for the item
        const shortString = descText.substring(0, descText.indexOf("</font></b><br><font color='#9da1a9'>"));
        $.GetContextPanel().SetDialogVariable('item_description', shortString === '' ? descText : shortString);
    }
    //--------------------------------------------------------------------------------------------------
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
        const elCp = $.GetContextPanel();
        const elActionBarPanel = elCp.FindChildInLayoutFile('PopUpInspectActionBar');
        InspectActionBar.OnUpdateCharModel(elActionBarPanel.FindChildInLayoutFile('InspectDropdownCharModels'), itemId, elCp);
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
        $.Msg('popup_inventory_inspect.ts -- PanoramaComponent_Store_PurchaseCompleted ' + ItemId);
        const storeItemId = InspectShared.GetPopupSetting('store_item_id');
        if (storeItemId) {
            const storeItemSeasonAccess = InventoryAPI.GetItemAttributeValue(storeItemId, 'season access');
            const acquiredItemSeasonAccess = InventoryAPI.GetItemAttributeValue(ItemId, 'season access');
            if (acquiredItemSeasonAccess && (storeItemSeasonAccess === acquiredItemSeasonAccess)) {
                const nSeasonAccess = GameTypesAPI.GetActiveSeasionIndexValue();
                const nCoinRank = MyPersonaAPI.GetMyMedalRankByType((nSeasonAccess + 1) + "Operation$OperationCoin");
                // Player has an inactive pass and pass is the same as active season
                if (nCoinRank === 1 && nSeasonAccess === acquiredItemSeasonAccess) {
                    ShowActiveItemPopup(ItemId);
                    return;
                }
            }
            const storeItemToolType = InventoryAPI.GetToolType(storeItemId);
            const acquiredItemToolType = InventoryAPI.GetToolType(ItemId);
            if (storeItemToolType === 'xp_shop_ticket' && acquiredItemToolType === 'xp_shop_ticket') {
                // let oXpShopTrackProgress =  InventoryAPI.GetCacheTypeElementJSOByIndex( 'XpShop', 0 );
                // if( !oXpShopTrackProgress )
                // {
                // 	ShowActiveItemPopup( ItemId );
                // 	return;
                // }
                // else if( oXpShopTrackProgress.xp_tracks.length < StoreAPI.GetXpShopMaxTracks() ) // max tracks 5
                // {
                // //show activation
                // 	ShowActiveItemPopup( ItemId );
                // 	return;
                // }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfaW52ZW50b3J5X2luc3BlY3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfaW52ZW50b3J5X2luc3BlY3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyxzQ0FBc0M7QUFDdEMsOERBQThEO0FBQzlELG9EQUFvRDtBQUNwRCxtREFBbUQ7QUFDbkQsZ0RBQWdEO0FBQ2hELG1EQUFtRDtBQUNuRCxzREFBc0Q7QUFDdEQsZ0RBQWdEO0FBRWhELElBQVUsZ0JBQWdCLENBK2N6QjtBQS9jRCxXQUFVLGdCQUFnQjtJQUV6QixJQUFJLDJCQUErQyxDQUFDO0lBRXBELFNBQWdCLElBQUk7UUFFbkIsTUFBTSxNQUFNLEdBQUcsYUFBYSxDQUFDLGVBQWUsQ0FBRSxTQUFTLENBQVksQ0FBQztRQUNwRSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsa0JBQWtCLENBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxFQUFFLENBQUUsQ0FBQztRQUM3RSwwQkFBMEI7UUFDMUIsd0hBQXdIO1FBQ3hILElBQUssWUFBWSxDQUFDLFFBQVEsQ0FBRSxNQUFNLENBQUUsRUFDcEM7WUFDQyxhQUFhLENBQUMsZUFBZSxDQUFFLHVCQUF1QixFQUFFLElBQUksQ0FBRSxDQUFDO1lBQy9ELGFBQWEsQ0FBQyxlQUFlLENBQUUsY0FBYyxFQUFFLElBQUksQ0FBRSxDQUFDO1NBQ3REO1FBRUQscUVBQXFFO1FBQ3JFLGdDQUFnQztRQUNoQyx3RUFBd0U7UUFDeEUscUdBQXFHO1FBQ3JHLElBQUssQ0FBQywyQkFBMkIsRUFDakM7WUFDQywyQkFBMkIsR0FBRyxDQUFDLENBQUMseUJBQXlCLENBQUUsNENBQTRDLEVBQUUsaUJBQWlCLENBQUUsQ0FBQztZQUM3SCxDQUFDLENBQUMseUJBQXlCLENBQUUsMkNBQTJDLEVBQUUs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