"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/iteminfo.ts" />
/// <reference path="notification/notification_equip.ts" />
/// <reference path="popups/popup_acknowledge_item.ts" />
/// <reference path="mainmenu_inventory_search.ts" />
var InventoryPanel;
(function (InventoryPanel) {
    let _m_activeCategory;
    // This panel contains the main inventory browseing elements
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
        // When the inventory is created for the first time we don't have a way to trigger ReadyForDisplay,
        // but on all subsequent clicks to show inventory panel we don't run Init and run ReadyForDisplay
        // Put all the shared code here
        _OnShowAcknowledgePanel();
        if (!MyPersonaAPI.IsInventoryValid() || !MyPersonaAPI.IsConnectedToGC()) {
            //No connection to GC so show a message
            UiToolkitAPI.ShowGenericPopupOk($.Localize('#SFUI_SteamConnectionErrorTitle'), $.Localize('#SFUI_Steam_Error_LinkUnexpected'), '', () => $.DispatchEvent('HideContentPanel'));
        }
    }
    //--------------------------------------------------------------------------------------------------
    // Populate Categories and Subcategories
    //--------------------------------------------------------------------------------------------------
    function _CreateCategoriesNavBar() {
        let aCategories = StripEmptyStringsFromArray(InventoryAPI.GetCategories().split(','));
        // Create category btns
        let elCategoryBtns = _CreateCatagoryBtns(aCategories);
        // Creates a new panel for each category that contains its sub category nav and items list
        _CreateSubmenusAndListerPanelsForEachCategory(aCategories, _CreateInventoryContentPanel());
        //set default tab adn active panel
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
                // Create containing panel for subcategories nav and list
                let elCategory = $.CreatePanel('Panel', elParent, tag, {
                    class: 'inv-category'
                });
                _AddTransitionEventToPanel(elCategory);
                // Create nav for subcategory if you have more that a two categories to display.
                // This catches the case for the 'any' category submenu
                let elNavBar = _CreateNavBar(tag, elCategory);
                if (subCategories.length > 1) {
                    _MakeNavBarButtons(elNavBar, subCategories, (subCategory) => {
                        _UpdateFilterRentalBtnInCategoryVisibility(tag, subCategory);
                        _UpdateActiveInventoryList();
                    });
                }
                // Add Sort
                _AddSortDropdownToNavBar(elNavBar.GetParent(), false);
                // Add rental items filter to correct tabs
                if (tag === 'any' || tag === 'inv_group_equipment') {
                    _AddFilterToNavBar(elNavBar.GetParent());
                }
                // Create list
                $.CreatePanel('InventoryItemList', elCategory, tag + '-List');
            }
        }
    }
    function _AddTransitionEventToPanel(newPanel) {
        $.RegisterEventHandler('PropertyTransitionEnd', newPanel, (panelName, propertyName) => {
            if (propertyName === 'opacity') {
                // Panel is visible and fully transparent
                if (newPanel.visible === true && newPanel.BIsTransparent()) {
                    // Set visibility to false and unload resources
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
                // touraments tab so use the icons fro the tournaments
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
    //--------------------------------------------------------------------------------------------------
    // Show HideTabs
    //--------------------------------------------------------------------------------------------------
    function NavigateToTab(category) {
        $.Msg('Inventory Active Tab Id--> ' + category);
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
                    $.Msg('HidePanel: ' + _m_activeCategory);
                }
            }
            _m_activeCategory = category;
            //Show selected tab
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
                // Force a reload of any resources since we're about to display the panel
                activePanel.visible = true;
                activePanel.SetReadyForDisplay(true);
                $.Msg('ShowPanel: ' + category);
                _m_activeCategory = category;
                _UpdateFilterRentalBtnInCategoryVisibility(category);
                _UpdateActiveItemList(_GetActiveCategoryLister(activePanel), category, _GetSelectedSubCategory(activePanel), _GetSelectedSort(activePanel), _GetFilterRentedItemsSetting(activePanel));
            }
        }
    }
    InventoryPanel.NavigateToTab = NavigateToTab;
    //--------------------------------------------------------------------------------------------------
    // Add Sort Dropdown to a panel
    //--------------------------------------------------------------------------------------------------
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
            // Set initial selection
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
        // x-ray badge is the shared btn_alert frame; it always reads "1"
        $.GetContextPanel().FindChildrenWithClassTraverse('inv-nav-solid-btn-notification').forEach(el => el.SetDialogVariable('alert_value', '1'));
        let elXrayBtn = $.GetContextPanel().FindChildInLayoutFile("InvXrayBtnContainer");
        elXrayBtn.SetPanelEvent('onactivate', () => {
            let oData = ItemInfo.GetItemsInXray();
            let keyId = ItemInfo.GetKeyForCaseInXray(oData.case);
            $.DispatchEvent("ShowXrayCasePopup", keyId, oData.case, false);
        });
    }
    //--------------------------------------------------------------------------------------------------
    // Show Hide Panels
    //--------------------------------------------------------------------------------------------------
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
        // show panel if it's not visible
        if (bShow) {
            if (elCrafting.BHasClass(_m_HiddenContentClassname)) {
                elCrafting.RemoveClass(_m_HiddenContentClassname);
                elCrafting.SetFocus();
                $.GetContextPanel().FindChildTraverse('Crafting-Items').SetReadyForDisplay(true);
                $.GetContextPanel().FindChildTraverse('Crafting-Ingredients').SetReadyForDisplay(true);
                // init recipe
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
            // make sure we clear current ingredients
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
        // show panel if it's not visible
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
    //--------------------------------------------------------------------------------------------------
    // Helpers
    //--------------------------------------------------------------------------------------------------
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
    //--------------------------------------------------------------------------------------------------
    function _UpdateActiveItemList(elListerToUpdate, category, subCategory, sortString, capabilityFilter) {
        if (!elListerToUpdate || !subCategory || !category) {
            return;
        }
        if (_IsSearchActivePanel(category)) {
            InventorySearch.UpdateItemList();
            return;
        }
        $.Msg('Updating Inventory List - ' + elListerToUpdate.id + ', Category: ' + category + ', SubCategory:' + subCategory + ', capabilityFilter:' + capabilityFilter);
        $.DispatchEvent('SetInventoryFilter', elListerToUpdate, category, subCategory, 'any', sortString, capabilityFilter, '' // text filter
        );
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
    //--------------------------------------------------------------------------------------------------
    function _OnReadyForDisplay() {
        _RunEveryTimeInventoryIsShown();
        _UpdateActiveInventoryList();
        _ShowHideRentalTab();
        // if we are crafting, make sure the items list is up-to-date
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
        // if we are crafting, make sure the items list is up-to-date
        _UpdateCraftingPanelContentsIfCrafting();
        // Add any on inventory updated events here
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
        // We keep this state so that we don't keep updating the inventory when a capablilty popup is activated.
        // Things like scratching a sticker fire the InventoryUpdated event for each scratch and we don't want
        // update the list of items every time.
        _m_isCapabliltyPopupOpen = isOpen;
        if (isOpen === false) {
            _InventoryUpdated();
        }
    }
    //--------------------------------------------------------------------------------------------------
    // Events from item context menu that create popups. Context menu closes so we can't call popups from
    // there. popups won't open when the caller panel is no longer there.
    //--------------------------------------------------------------------------------------------------
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
    // Use Item Once confirmation
    function _ShowUseItemOnceConfirmationPopup(id) {
        let pPopup = UiToolkitAPI.ShowGenericPopupYesNo('#inv_context_useitem', '#inv_confirm_useitem_desc', "", () => InventoryAPI.UseTool(id, ''), () => { });
        if (pPopup != null) {
            pPopup.SetDialogVariable('type', InventoryAPI.GetItemName(id));
        }
    }
    //--------------------------------------------------------------------------------------------------
    // Notification for when you equip an item.
    //--------------------------------------------------------------------------------------------------
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
                // If we're on the rentals tab and run out of rentals, switch to the "Everything" tab.
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
    // on creation
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbm1lbnVfaW52ZW50b3J5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvbWFpbm1lbnVfaW52ZW50b3J5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFDbEMsMkNBQTJDO0FBQzNDLDJEQUEyRDtBQUMzRCx5REFBeUQ7QUFDekQscURBQXFEO0FBRXJELElBQVUsY0FBYyxDQTI3QnZCO0FBMzdCRCxXQUFVLGNBQWM7SUFFdkIsSUFBSSxpQkFBcUMsQ0FBQztJQUMxQyw0REFBNEQ7SUFDNUQsSUFBSSxrQkFBa0IsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUUsZUFBZSxDQUFzRSxDQUFDO0lBQzFKLElBQUksb0JBQW9CLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLGdCQUFnQixDQUFFLENBQUM7SUFDekYsSUFBSSx3QkFBd0IsR0FBRyxLQUFLLENBQUM7SUFDckMsSUFBSSwwQkFBMEIsR0FBa0IsSUFBSSxDQUFDO0lBQ3JELElBQUksaUJBQWlCLEdBQUcsS0FBSyxDQUFDO0lBQzlCLElBQUkseUJBQXlCLEdBQUcsMEJBQTBCLENBQUM7SUFFM0QsU0FBUyxLQUFLO1FBRWIsSUFBSyxDQUFDLDBCQUEwQixFQUNoQztZQUNDLDBCQUEwQixHQUFHLENBQUMsQ0FBQyx5QkFBeUIsQ0FBRSw4Q0FBOEMsRUFBRSxpQkFBaUIsQ0FBRSxDQUFDO1NBQzlIO1FBRUQsNkJBQTZCLEVBQUUsQ0FBQztRQUNoQyx1QkFBdUIsRUFBRSxDQUFDO1FBQzFCLGVBQWUsRUFBRSxDQUFDO1FBQ2xCLFlBQVksRUFBRSxDQUFDO1FBQ2Ysc0JBQXNCLEVBQUUsQ0FBQztRQUN6QixrQkFBa0IsRUFBRSxDQUFDO0lBQ3RCLENBQUM7SUFFRCxTQUFTLDZCQUE2QjtRQUVyQyxtR0FBbUc7UUFDbkcsaUdBQWlHO1FBQ2pH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