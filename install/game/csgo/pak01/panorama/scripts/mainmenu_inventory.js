"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/iteminfo.ts" />
/// <reference path="notification/notification_equip.ts" />
/// <reference path="popups/popup_acknowledge_item.ts" />
/// <reference path="mainmenu_inventory_search.ts" />
var InventoryPanel;
(function (InventoryPanel) {
    let _m_activeCategory;
    let _m_elInventoryMain = $.GetContextPanel().FindChildInLayoutFile('InventoryMain');
    let _m_elInventorySearch = $.GetContextPanel().FindChildInLayoutFile('InvSearchPanel');
    let _m_isCapabliltyPopupOpen = false;
    let _m_InventoryUpdatedHandler = null;
    let _m_bFilterRentals = false;
    let _m_HiddenContentClassname = 'mainmenu-content--hidden';
    function _Init() {
        if (!_m_InventoryUpdatedHandler) {
            _m_InventoryUpdatedHandler = $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', _InventoryUpdated);
        }
        _RunEveryTimeInventoryIsShown();
        _CreateCategoriesNavBar();
        _InitMarketLink();
        _InitXrayBtn();
        _LoadEquipNotification();
        _ShowHideRentalTab();
    }
    function _RunEveryTimeInventoryIsShown() {
        _OnShowAcknowledgePanel();
        if (!MyPersonaAPI.IsInventoryValid() || !MyPersonaAPI.IsConnectedToGC()) {
            UiToolkitAPI.ShowGenericPopupOk($.Localize('#SFUI_SteamConnectionErrorTitle'), $.Localize('#SFUI_Steam_Error_LinkUnexpected'), '', () => $.DispatchEvent('HideContentPanel'));
        }
    }
    function _CreateCategoriesNavBar() {
        let aCategories = StripEmptyStringsFromArray(InventoryAPI.GetCategories().split(','));
        let elCategoryBtns = _CreateCatagoryBtns(aCategories);
        _CreateSubmenusAndListerPanelsForEachCategory(aCategories, _CreateInventoryContentPanel());
        $.DispatchEvent("Activated", elCategoryBtns.FindChildInLayoutFile(aCategories[0]), "mouse");
        elCategoryBtns.Children()[0].checked = true;
    }
    function _CreateCatagoryBtns(aCategories) {
        let elPanel = $.GetContextPanel().FindChildInLayoutFile('id-navbar-tabs-catagory-btns-container');
        for (let category of aCategories) {
            let elBtn = elPanel.FindChildInLayoutFile(category);
            if (!elBtn) {
                elBtn = $.CreatePanel('RadioButton', elPanel, category, {
                    class: 'content-navbar__tabs__btn', group: 'inv-top-nav'
                });
                let tag = category;
                let metaData = _GetMetadata(tag, '', '');
                let nameToken = _GetValueForKeyFromMetadata('nametoken', metaData);
                $.CreatePanel('Label', elBtn, '', {
                    text: '#' + nameToken
                });
                elBtn.SetAttributeString('tag', tag);
                elBtn.Data().tag = tag;
                elBtn.SetPanelEvent('onactivate', () => NavigateToTab(tag));
            }
        }
        return elPanel;
    }
    function _CreateInventoryContentPanel() {
        return $.CreatePanel('Panel', _m_elInventoryMain, 'InventoryMenuContent', {
            class: 'inv-category__list-container'
        });
    }
    function _CreateSubmenusAndListerPanelsForEachCategory(aCategories, elParent) {
        for (let tag of aCategories) {
            if (tag) {
                let subCategories = StripEmptyStringsFromArray(InventoryAPI.GetSubCategories(tag).split(','));
                let elCategory = $.CreatePanel('Panel', elParent, tag, {
                    class: 'inv-category'
                });
                _AddTransitionEventToPanel(elCategory);
                let elNavBar = _CreateNavBar(tag, elCategory);
                if (subCategories.length > 1) {
                    _MakeNavBarButtons(elNavBar, subCategories, (subCategory) => {
                        _UpdateFilterRentalBtnInCategoryVisibility(tag, subCategory);
                        _UpdateActiveInventoryList();
                    });
                }
                _AddSortDropdownToNavBar(elNavBar.GetParent(), false);
                if (tag === 'any' || tag === 'inv_group_equipment') {
                    _AddFilterToNavBar(elNavBar.GetParent());
                }
                $.CreatePanel('InventoryItemList', elCategory, tag + '-List');
            }
        }
    }
    function _AddTransitionEventToPanel(newPanel) {
        $.RegisterEventHandler('PropertyTransitionEnd', newPanel, (panelName, propertyName) => {
            if (propertyName === 'opacity') {
                if (newPanel.visible === true && newPanel.BIsTransparent()) {
                    newPanel.visible = false;
                    return true;
                }
            }
            return false;
        });
    }
    function _CreateNavBar(idForNavBar, elParent) {
        let elNavBar = $.CreatePanel('Panel', elParent, idForNavBar + '-NavBarParent', {
            class: 'content-navbar__tabs content-navbar__tabs--dark content-navbar__tabs--noflow'
        });
        let elNavBarButtonsContainer = $.CreatePanel('Panel', elNavBar, idForNavBar + '-NavBar', {
            class: 'content-navbar__tabs__center-container'
        });
        elNavBarButtonsContainer.SetAttributeString('data-type', idForNavBar);
        return elNavBarButtonsContainer;
    }
    function _MakeNavBarButtons(elNavBar, listOfTags, onActivate) {
        let groupName = elNavBar.id;
        for (let tag of listOfTags) {
            let elButton = $.CreatePanel('RadioButton', elNavBar, tag + 'Btn', {
                group: groupName,
                class: 'content-navbar__tabs__btn'
            });
            let metaData = {};
            let catagory = elNavBar.GetAttributeString('data-type', '');
            if (catagory === "InvCategories")
                metaData = _GetMetadata(tag, '', '');
            else
                metaData = _GetMetadata(catagory, tag, '');
            let nameToken = _GetValueForKeyFromMetadata('nametoken', metaData);
            if (!nameToken) {
                nameToken = _GetValueForKeyFromMetadata('nameprefix', metaData);
                if (nameToken !== '')
                    nameToken = nameToken + tag;
            }
            if (nameToken) {
                $.CreatePanel('Label', elButton, '', {
                    text: '#' + nameToken
                });
            }
            else {
                let icon = _GetValueForKeyFromMetadata('usetournamenticons', metaData);
                if (icon) {
                    let imageIndex = tag.replace(/^\D+/g, '');
                    $.CreatePanel('Image', elButton, '', {
                        src: 'file://{images}/tournaments/events/tournament_logo_' + imageIndex + '.svg',
                        textureheight: '48',
                        scaling: 'stretch-to-fit-preserve-aspect'
                    });
                    nameToken = 'CSGO_Tournament_Event_NameShort_' + imageIndex;
                    elButton.SetPanelEvent('onmouseover', () => UiToolkitAPI.ShowTextTooltip(elButton.id, nameToken));
                    elButton.SetPanelEvent('onmouseout', () => UiToolkitAPI.HideTextTooltip());
                }
            }
            if (onActivate)
                elButton.SetPanelEvent('onactivate', () => onActivate(tag));
            elButton.SetAttributeString('data-type', tag);
            elButton.SetAttributeString('nice-name', nameToken);
        }
        elNavBar.GetChild(0).checked = true;
    }
    function _UpdateActiveInventoryList() {
        if (_m_activeCategory === "tradeup") {
            return;
        }
        let activePanel = _m_elInventoryMain.FindChildInLayoutFile(_m_activeCategory);
        _UpdateActiveItemList(_GetActiveCategoryLister(activePanel), _m_activeCategory, _GetSelectedSubCategory(activePanel), _GetSelectedSort(activePanel), _GetFilterRentedItemsSetting(activePanel));
    }
    function NavigateToTab(category) {
        if (_m_activeCategory !== category) {
            if (_m_activeCategory) {
                if (_m_activeCategory === 'tradeup') {
                    _UpdateCraftingPanelVisibility(false);
                }
                else if (_m_activeCategory === 'search') {
                    _UpdateSearchPanelVisibility(false);
                }
                else {
                    let panelToHide = _m_elInventoryMain.FindChildInLayoutFile(_m_activeCategory);
                    panelToHide.RemoveClass('Active');
                }
            }
            _m_activeCategory = category;
            if (category === "tradeup") {
                _UpdateCraftingPanelVisibility(true);
                $.GetContextPanel().FindChildInLayoutFile('InvCraftingBtn').checked = true;
            }
            else if (_m_activeCategory === 'search') {
                _UpdateSearchPanelVisibility(true);
                $.GetContextPanel().FindChildInLayoutFile('InvSearchPanel').checked = true;
            }
            else {
                let activePanel = _m_elInventoryMain.FindChildInLayoutFile(category);
                activePanel.AddClass('Active');
                activePanel.visible = true;
                activePanel.SetReadyForDisplay(true);
                _m_activeCategory = category;
                _UpdateFilterRentalBtnInCategoryVisibility(category);
                _UpdateActiveItemList(_GetActiveCategoryLister(activePanel), category, _GetSelectedSubCategory(activePanel), _GetSelectedSort(activePanel), _GetFilterRentedItemsSetting(activePanel));
            }
        }
    }
    InventoryPanel.NavigateToTab = NavigateToTab;
    function _AddSortDropdownToNavBar(elNavBar, bIsCapabliltyPopup) {
        let elDropdown = elNavBar.FindChildInLayoutFile('InvSortDropdown');
        if (!elDropdown) {
            let elDropdownParent = $.CreatePanel('Panel', elNavBar, 'InvExtraNavOptions', { class: 'overflow-noclip' });
            elDropdownParent.BLoadLayoutSnippet('InvSortDropdownSnippet');
            elDropdown = elDropdownParent.FindChildInLayoutFile('InvSortDropdown');
            let count = InventoryAPI.GetSortMethodsCount();
            for (let i = 0; i < count; i++) {
                let sort = InventoryAPI.GetSortMethodByIndex(i);
                let newEntry = $.CreatePanel('Label', elDropdownParent, sort, {
                    class: 'DropDownMenu'
                });
                newEntry.text = $.Localize('#' + sort);
                elDropdown.AddOption(newEntry);
            }
            if (!bIsCapabliltyPopup) {
                elDropdown.SetPanelEvent('oninputsubmit', () => _UpdateSort(elDropdown));
            }
            elDropdown.SetSelected(GameInterfaceAPI.GetSettingString("cl_inventory_saved_sort2"));
        }
    }
    function _AddFilterToNavBar(elNavBar) {
        let elFilter = elNavBar.FindChildInLayoutFile('InvFilterRentedItems');
        if (!elFilter) {
            let elFilter = $.CreatePanel('ToggleButton', elNavBar, 'InvFilterRentedItems', { class: 'overflow-noclip' });
            elFilter.BLoadLayoutSnippet('InvFilterRentedItemsSnippet');
            elFilter.SetPanelEvent('onactivate', () => {
                let activePanel = _m_elInventoryMain.FindChildInLayoutFile(_m_activeCategory);
                let elDropdown = elNavBar.FindChildInLayoutFile('InvSortDropdown');
                let dropdownSetting = elDropdown ? elDropdown.GetSelected().id : '';
                elFilter.checked = !_m_bFilterRentals;
                _m_bFilterRentals = elFilter.checked;
                let filterSetting = elFilter.checked ? 'is_rental:false' : '';
                _UpdateActiveItemList(_GetActiveCategoryLister(activePanel), _m_activeCategory, _GetSelectedSubCategory(activePanel), dropdownSetting, filterSetting);
            });
        }
    }
    function _GetFilterRentedItemsSetting(activePanel) {
        if (activePanel) {
            let elFilterBtn = activePanel.FindChildInLayoutFile('InvFilterRentedItems');
            return (elFilterBtn && elFilterBtn.checked) ? 'is_rental:false' : '';
        }
        return '';
    }
    function _UpdateFilterRentalBtnInCategoryVisibility(category, subCategory = '') {
        let elNavBtn = $.GetContextPanel().FindChildInLayoutFile(category + '-NavBarParent');
        if (!elNavBtn || !elNavBtn.IsValid()) {
            return;
        }
        let elFilterBtn = elNavBtn.FindChildInLayoutFile('InvFilterRentedItems');
        if (!elFilterBtn || !elFilterBtn.IsValid()) {
            return;
        }
        elFilterBtn.SetHasClass('hide', (category !== 'any' && category !== 'inv_group_equipment') ||
            !InventoryAPI.CategoryContainsItems('rentals') ||
            (subCategory === 'customplayer' ||
                subCategory === 'misc' ||
                subCategory === 'clothing_hands' ||
                subCategory === 'musickit'));
        if (!elFilterBtn.BHasClass('hide')) {
            elFilterBtn.checked = _m_bFilterRentals;
        }
    }
    function _UpdateSort(elDropdown) {
        let activePanel = _m_elInventoryMain.FindChildInLayoutFile(_m_activeCategory);
        if (activePanel) {
            _UpdateActiveItemList(_GetActiveCategoryLister(activePanel), _m_activeCategory, _GetSelectedSubCategory(activePanel), elDropdown.GetSelected().id, _GetFilterRentedItemsSetting(activePanel));
            if (typeof elDropdown.GetSelected().id === "string" && elDropdown.GetSelected().id !== GameInterfaceAPI.GetSettingString("cl_inventory_saved_sort2")) {
                GameInterfaceAPI.SetSettingString("cl_inventory_saved_sort2", elDropdown.GetSelected().id);
                GameInterfaceAPI.ConsoleCommand("host_writeconfig");
            }
        }
    }
    function _ShowHideXrayBtn() {
        let elXrayBtnContainer = $.GetContextPanel().FindChildInLayoutFile("InvXrayBtnContainer");
        let xrayRewardId = ItemInfo.GetItemsInXray().reward;
        let sRestriction = InventoryAPI.GetDecodeableRestriction('capsule');
        elXrayBtnContainer.visible = xrayRewardId !== '' &&
            xrayRewardId !== undefined &&
            xrayRewardId !== null &&
            (sRestriction === 'xray' || !InventoryAPI.IsFauxItemID(xrayRewardId));
    }
    function _InitMarketLink() {
        let elMarketLink = $.GetContextPanel().FindChildInLayoutFile("InvMarketBtn");
        if (MyPersonaAPI.GetLauncherType() === "perfectworld") {
            elMarketLink.SetHasClass('hide', true);
            return;
        }
        elMarketLink.SetHasClass('hide', false);
        elMarketLink.SetPanelEvent('onactivate', onActivate);
        let appId = SteamOverlayAPI.GetAppID();
        let communityUrl = SteamOverlayAPI.GetSteamCommunityURL();
        function onActivate() {
            SteamOverlayAPI.OpenURL(communityUrl + "/market/search?q=&appid=" + appId + "&lock_appid=" + appId);
        }
    }
    function _InitXrayBtn() {
        _ShowHideXrayBtn();
        $.GetContextPanel().FindChildrenWithClassTraverse('inv-nav-solid-btn-notification').forEach(el => el.SetDialogVariable('alert_value', '1'));
        let elXrayBtn = $.GetContextPanel().FindChildInLayoutFile("InvXrayBtnContainer");
        elXrayBtn.SetPanelEvent('onactivate', () => {
            let oData = ItemInfo.GetItemsInXray();
            let keyId = ItemInfo.GetKeyForCaseInXray(oData.case);
            $.DispatchEvent("ShowXrayCasePopup", keyId, oData.case, false);
        });
    }
    function _GotoTradeUpPanel() {
        NavigateToTab('tradeup');
    }
    function _HideInventoryMainListers() {
        if (_m_activeCategory === "search") {
            $('#InvSearchPanel').AddClass(_m_HiddenContentClassname);
        }
        else if (_m_activeCategory === "tradeup") {
            $('#InvCraftingPanel').AddClass(_m_HiddenContentClassname);
        }
        else {
            _m_elInventoryMain.AddClass(_m_HiddenContentClassname);
        }
    }
    function _ShowInventoryMainListers() {
        if (_m_activeCategory === "search") {
            $('#InvSearchPanel').RemoveClass(_m_HiddenContentClassname);
        }
        else if (_m_activeCategory === "tradeup") {
            $('#InvCraftingPanel').RemoveClass(_m_HiddenContentClassname);
        }
        else {
            _m_elInventoryMain.RemoveClass(_m_HiddenContentClassname);
        }
    }
    function _UpdateCraftingPanelVisibility(bShow) {
        let elCrafting = $('#InvCraftingPanel');
        if (bShow) {
            if (elCrafting.BHasClass(_m_HiddenContentClassname)) {
                elCrafting.RemoveClass(_m_HiddenContentClassname);
                elCrafting.SetFocus();
                $.GetContextPanel().FindChildTraverse('Crafting-Items').SetReadyForDisplay(true);
                $.GetContextPanel().FindChildTraverse('Crafting-Ingredients').SetReadyForDisplay(true);
                let RecipeId = InventoryAPI.GetTradeUpContractItemID();
                let strCraftingFilter = InventoryAPI.GetItemAttributeValue(RecipeId, "recipe filter");
                InventoryAPI.SetInventorySortAndFilters('inv_sort_age', false, 'ingredient', '', '');
                if (InventoryAPI.GetInventoryCount() !== 1) {
                    InventoryAPI.ClearCraftIngredients();
                }
                InventoryAPI.SetCraftTarget(Number(strCraftingFilter));
                $.DispatchEvent('UpdateTradeUpPanel');
            }
        }
        else {
            elCrafting.AddClass(_m_HiddenContentClassname);
            _m_elInventoryMain.SetFocus();
            $.GetContextPanel().FindChildTraverse('Crafting-Items').SetReadyForDisplay(false);
            $.GetContextPanel().FindChildTraverse('Crafting-Ingredients').SetReadyForDisplay(false);
            InventoryAPI.ClearCraftIngredients();
            return true;
        }
    }
    function _UpdateCraftingPanelContentsIfCrafting() {
        let elCrafting = $('#InvCraftingPanel');
        if (!elCrafting.BHasClass(_m_HiddenContentClassname)) {
            $.DispatchEvent('UpdateTradeUpPanel');
        }
    }
    function _UpdateSearchPanelVisibility(bShow) {
        let elSearch = $('#InvSearchPanel');
        if (bShow) {
            if (elSearch.BHasClass(_m_HiddenContentClassname)) {
                elSearch.RemoveClass(_m_HiddenContentClassname);
                elSearch.SetFocus();
            }
        }
        else {
            elSearch.AddClass(_m_HiddenContentClassname);
            _m_elInventoryMain.SetFocus();
            return true;
        }
    }
    function _ClosePopups() {
        if (_m_elInventoryMain.updatePlayerEquipSlotChangedHandler) {
            $.UnregisterForUnhandledEvent('PanoramaComponent_Loadout_EquipSlotChanged', _m_elInventoryMain.updatePlayerEquipSlotChangedHandler);
            _m_elInventoryMain.updatePlayerEquipSlotChangedHandler = null;
        }
        if (_m_InventoryUpdatedHandler) {
            $.UnregisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', _m_InventoryUpdatedHandler);
            _m_InventoryUpdatedHandler = null;
        }
        return false;
    }
    function _GetActiveCategoryLister(activePanel) {
        if (activePanel) {
            let elList = activePanel.FindChildInLayoutFile(_m_activeCategory + '-List');
            return (elList) ? elList : null;
        }
        return null;
    }
    function _GetSelectedSort(activePanel) {
        let elDropdown = null;
        if (activePanel) {
            elDropdown = activePanel.FindChildInLayoutFile('InvSortDropdown');
        }
        return (elDropdown) ? elDropdown.GetSelected().id : '';
    }
    function _GetSelectedSubCategoryPanel(activePanel) {
        if (!activePanel || !activePanel.IsValid()) {
            return null;
        }
        let elSubCategoryNavBar = activePanel.FindChildInLayoutFile(_m_activeCategory + '-NavBar');
        if (!elSubCategoryNavBar) {
            return null;
        }
        let tabs = elSubCategoryNavBar.Children();
        tabs = tabs.filter(e => e.checked);
        return tabs;
    }
    function _GetSelectedSubCategory(activePanel) {
        let tabs = _GetSelectedSubCategoryPanel(activePanel);
        return (tabs && tabs.length > 0) ? tabs[0].GetAttributeString('data-type', 'any') : 'any';
    }
    function StripEmptyStringsFromArray(dataRaw) {
        return dataRaw.filter(v => v !== '');
    }
    function _GetValueForKeyFromMetadata(key, metaData) {
        if (metaData.hasOwnProperty(key))
            return metaData[key];
        return '';
    }
    function _GetMetadata(category, subCategory, group) {
        return JSON.parse(InventoryAPI.GetInventoryStructureJSON(category, subCategory, group));
    }
    function _IsSearchActivePanel(category) {
        return category === 'InvSearchPanel';
    }
    function _UpdateActiveItemList(elListerToUpdate, category, subCategory, sortString, capabilityFilter) {
        if (!elListerToUpdate || !subCategory || !category) {
            return;
        }
        if (_IsSearchActivePanel(category)) {
            InventorySearch.UpdateItemList();
            return;
        }
        $.DispatchEvent('SetInventoryFilter', elListerToUpdate, category, subCategory, 'any', sortString, capabilityFilter, '');
        _ShowHideNoItemsMessage(elListerToUpdate);
    }
    function _ShowHideNoItemsMessage(elLister) {
        let count = elLister.count;
        let elParent = elLister.GetParent();
        let elEmpty = elParent.FindChildInLayoutFile('JsInvEmptyLister');
        if (count > 0) {
            if (elEmpty) {
                elEmpty.DeleteAsync(0.0);
            }
            return;
        }
        let elNewEmpty = elParent.FindChildInLayoutFile('JsInvEmptyLister');
        if (!elNewEmpty) {
            elNewEmpty = $.CreatePanel('Panel', elParent, 'JsInvEmptyLister');
            elNewEmpty.BLoadLayoutSnippet('InvEmptyLister');
            elParent.MoveChildBefore(elNewEmpty, elLister);
        }
        let activePanel = _m_elInventoryMain.FindChildInLayoutFile(_m_activeCategory);
        let elSubCat = _GetSelectedSubCategoryPanel(activePanel);
        let elLabel = elNewEmpty.FindChildInLayoutFile('JsInvEmptyListerLabel');
        const str = $.Localize("#" + elSubCat[0].GetAttributeString('nice-name', ''));
        elLabel.SetDialogVariable('type', str);
        elLabel.text = $.Localize('#inv_empty_lister', elLabel);
    }
    function _OnReadyForDisplay() {
        _RunEveryTimeInventoryIsShown();
        _UpdateActiveInventoryList();
        _ShowHideRentalTab();
        _UpdateCraftingPanelContentsIfCrafting();
        if (!_m_elInventoryMain.updatePlayerEquipSlotChangedHandler) {
            _m_elInventoryMain.updatePlayerEquipSlotChangedHandler = $.RegisterForUnhandledEvent('PanoramaComponent_Loadout_EquipSlotChanged', _ShowNotification);
        }
        if (!_m_InventoryUpdatedHandler) {
            _m_InventoryUpdatedHandler = $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', _InventoryUpdated);
        }
    }
    function _InventoryUpdated() {
        _ShowHideXrayBtn();
        _ShowHideRentalTab();
        _UpdateFilterRentalBtnInCategoryVisibility(_m_activeCategory);
        _UpdateCraftingPanelContentsIfCrafting();
        if ($.GetContextPanel().BHasClass(_m_HiddenContentClassname) || _m_isCapabliltyPopupOpen)
            return;
        _OnShowAcknowledgePanel();
        if (!_m_elInventorySearch.BHasClass(_m_HiddenContentClassname)) {
            InventorySearch.UpdateItemList();
        }
        else if (_m_activeCategory) {
            _UpdateActiveInventoryList();
        }
    }
    function _OnShowAcknowledgePanel() {
        let itemsToAcknowledge = AcknowledgeItems.GetItems();
        if (itemsToAcknowledge.length > 0) {
            $.DispatchEvent('ShowAcknowledgePopup', '', '');
        }
    }
    function _SetIsCapabilityPopUpOpen(isOpen) {
        _m_isCapabliltyPopupOpen = isOpen;
        if (isOpen === false) {
            _InventoryUpdated();
        }
    }
    function _ShowDeleteItemConfirmation(id) {
        UiToolkitAPI.ShowGenericPopupYesNo('#inv_context_delete', '#inv_confirm_delete_desc', "", () => _DeleteItemAnim(id), () => { });
    }
    function _DeleteItemAnim(id) {
        let activePanel = _m_elInventoryMain.FindChildInLayoutFile(_m_activeCategory);
        let elList = _GetActiveCategoryLister(activePanel);
        let childrenList = elList.Children();
        for (let element of childrenList) {
            if (id === element.GetAttributeString('itemid', '0')) {
                element.AddClass('delete');
            }
        }
        $.Schedule(.3, () => InventoryAPI.DeleteItem(id));
    }
    function _ShowUseItemOnceConfirmationPopup(id) {
        let pPopup = UiToolkitAPI.ShowGenericPopupYesNo('#inv_context_useitem', '#inv_confirm_useitem_desc', "", () => InventoryAPI.UseTool(id, ''), () => { });
        if (pPopup != null) {
            pPopup.SetDialogVariable('type', InventoryAPI.GetItemName(id));
        }
    }
    function _LoadEquipNotification() {
        let elParent = $.GetContextPanel().FindChildInLayoutFile('InventoryMainContainer');
        let elNotification = $.CreatePanel('Panel', elParent, 'InvNotificationEquip');
        elNotification.BLoadLayout('file://{resources}/layout/notification/notification_equip.xml', false, false);
    }
    function _ShowNotification(team, slot, oldItemId, newItemId, bNew) {
        if (!bNew || _m_isCapabliltyPopupOpen || $.GetContextPanel().BHasClass(_m_HiddenContentClassname)) {
            return;
        }
        let elNotification = $.GetContextPanel().FindChildInLayoutFile('InvNotificationEquip');
        EquipNotification.ShowEquipNotification(elNotification, slot, newItemId);
    }
    function _ShowHideRentalTab() {
        let elNavBarBtnsContainer = $.GetContextPanel().FindChildInLayoutFile('id-navbar-tabs-catagory-btns-container');
        if (elNavBarBtnsContainer) {
            let elNavBarRentalsBtn = elNavBarBtnsContainer.FindChild('rentals');
            if (elNavBarRentalsBtn) {
                let bInventoryContainsRentals = InventoryAPI.CategoryContainsItems('rentals');
                if (!bInventoryContainsRentals && _m_activeCategory === 'rentals') {
                    let elNavBarEverythingBtn = elNavBarBtnsContainer.FindChild('any');
                    if (elNavBarEverythingBtn) {
                        elNavBarEverythingBtn.checked = true;
                        NavigateToTab('any');
                    }
                }
                elNavBarRentalsBtn.SetHasClass('hide', !bInventoryContainsRentals);
            }
        }
    }
    {
        _Init();
        let elJsInventory = $('#JsInventory');
        $.RegisterEventHandler('ReadyForDisplay', elJsInventory, _OnReadyForDisplay);
        $.RegisterEventHandler('UnreadyForDisplay', elJsInventory, _ClosePopups);
        $.RegisterEventHandler('Cancelled', elJsInventory, _ClosePopups);
        $.RegisterForUnhandledEvent('CapabilityPopupIsOpen', _SetIsCapabilityPopUpOpen);
        $.RegisterForUnhandledEvent('RefreshActiveInventoryList', _InventoryUpdated);
        $.RegisterForUnhandledEvent('ShowDeleteItemConfirmationPopup', _ShowDeleteItemConfirmation);
        $.RegisterForUnhandledEvent('ShowUseItemOnceConfirmationPopup', _ShowUseItemOnceConfirmationPopup);
        $.RegisterForUnhandledEvent('PanoramaComponent_Inventory_CraftIngredientAdded', () => NavigateToTab('tradeup'));
        $.RegisterForUnhandledEvent('ShowTradeUpPanel', _GotoTradeUpPanel);
    }
})(InventoryPanel || (InventoryPanel = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbm1lbnVfaW52ZW50b3J5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvbWFpbm1lbnVfaW52ZW50b3J5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFDbEMsMkNBQTJDO0FBQzNDLDJEQUEyRDtBQUMzRCx5REFBeUQ7QUFDekQscURBQXFEO0FBRXJELElBQVUsY0FBYyxDQTI3QnZCO0FBMzdCRCxXQUFVLGNBQWM7SUFFdkIsSUFBSSxpQkFBcUMsQ0FBQztJQUUxQyxJQUFJLGtCQUFrQixHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxlQUFlLENBQXNFLENBQUM7SUFDMUosSUFBSSxvQkFBb0IsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUUsZ0JBQWdCLENBQUUsQ0FBQztJQUN6RixJQUFJLHdCQUF3QixHQUFHLEtBQUssQ0FBQztJQUNyQyxJQUFJLDBCQUEwQixHQUFrQixJQUFJLENBQUM7SUFDckQsSUFBSSxpQkFBaUIsR0FBRyxLQUFLLENBQUM7SUFDOUIsSUFBSSx5QkFBeUIsR0FBRywwQkFBMEIsQ0FBQztJQUUzRCxTQUFTLEtBQUs7UUFFYixJQUFLLENBQUMsMEJBQTBCLEVBQ2hDO1lBQ0MsMEJBQTBCLEdBQUcsQ0FBQyxDQUFDLHlCQUF5QixDQUFFLDhDQUE4QyxFQUFFLGlCQUFpQixDQUFFLENBQUM7U0FDOUg7UUFFRCw2QkFBNkIsRUFBRSxDQUFDO1FBQ2hDLHVCQUF1QixFQUFFLENBQUM7UUFDMUIsZUFBZSxFQUFFLENBQUM7UUFDbEIsWUFBWSxFQUFFLENBQUM7UUFDZixzQkFBc0IsRUFBRSxDQUFDO1FBQ3pCLGtCQUFrQixFQUFFLENBQUM7SUFDdEIsQ0FBQztJQUVELFNBQVMsNkJBQTZCO1FBS3JDLHVCQUF1QixFQUFFLENBQUM7UUFFMUIsSUFBSyxDQUFDLFlBQVks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