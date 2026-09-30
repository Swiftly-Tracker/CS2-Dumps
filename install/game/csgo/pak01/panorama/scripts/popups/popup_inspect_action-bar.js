"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../common/item_context_entries.ts" />
/// <reference path="../inspect.ts" />
/// <reference path="../characterbuttons.ts" />
/// <reference path="../common/shopping_cart.ts" />
var InspectActionBar;
(function (InspectActionBar) {
    function Init() {
        const elActionBar = $.GetContextPanel().FindChildInLayoutFile('PopUpInspectActionBar');
        if (!InspectShared.GetPopupSetting('inspect_only')) {
            elActionBar.AddClass('hidden');
            return;
        }
        elActionBar.Data().schfnMusicMvpPreviewEnd = null;
        elActionBar.Data().previewingMusic = false;
        elActionBar.RemoveClass('hidden');
        elActionBar.Data().panelRegisteredForEvents = false;
        const itemId = InspectShared.GetPopupSetting('item_id');
        _SetUpItemCertificate(elActionBar, itemId);
        _SetupEquipItemBtns(elActionBar, itemId);
        _ShowButtonsForWeaponInspect(elActionBar, itemId);
        _ShowButtonsForCharacterInspect(elActionBar, itemId);
        _SetCloseBtnAction(elActionBar, $.GetContextPanel());
        _SetUpMarketLink(elActionBar, itemId);
        _SetUpOpenSeasonStatsAction(elActionBar, $.GetContextPanel(), itemId);
        _SetUpViewHighlightReelAction(elActionBar, itemId);
        const nPrice = InspectShared.GetPopupSetting('price_in_tokens');
        _SetupAddRemoveToCartButtons(elActionBar, itemId, nPrice);
        _SetupCartActionsBtn(elActionBar, nPrice, itemId);
        _ShowHideCartBtn(elActionBar, nPrice);
        _ShowHideFavoriteBtn($.GetContextPanel(), elActionBar, nPrice);
        if (!elActionBar.Data().panelRegisteredForEvents) {
            elActionBar.Data().panelRegisteredForEvents = true;
            $.RegisterForUnhandledEvent('PanoramaComponent_Loadout_EquipSlotChanged', () => _SetupEquipItemBtns(elActionBar, itemId));
        }
        if (nPrice) // only if this is tournament sale items
         {
            $.RegisterForUnhandledEvent('PanoramaComponent_Store_VolatileShopSubscribe', (...args) => { _OnVolatileShopSubscribe(...args, elActionBar); });
            _EnsureVolatileShopSubscribed($.GetContextPanel());
        }
        const contentPanel = $.GetContextPanel();
        elActionBar.FindChildInLayoutFile('InspectPlayMvpBtn').SetPanelEvent('onactivate', () => InspectPlayMusic('mvp', contentPanel));
        const category = InventoryAPI.GetLoadoutCategory(itemId);
        if (category == "musickit") {
            InventoryAPI.PlayItemPreviewMusic(itemId, '');
            elActionBar.Data().previewingMusic = true;
            // allow playing MVP music (unless it's the default music kit)
            const elMusicBtn = elActionBar.FindChildInLayoutFile('InspectPlayMvpBtn');
            elMusicBtn.SetHasClass('hidden', (InventoryAPI.GetItemRarity(itemId) <= 0)); // default music kit has no MVP track
        }
        // Default weapon view icon btn to be selected since thats the view we start on.
        // If you are already is character mode then char will be already selected
        const bisItemInLootlist = InspectShared.GetPopupSetting('is_item_in_lootlist');
        elActionBar.FindChildInLayoutFile('InspectWeaponBtn').checked =
            (!elActionBar.FindChildInLayoutFile('InspectCharBtn').checked &&
                !elActionBar.FindChildInLayoutFile('LookatWeaponBtn').checked) ||
                bisItemInLootlist;
        // If the item is in the lootlist then we always default it to the floating gun view
        if (bisItemInLootlist) {
            // NavigateModelPanel( 'InspectModel');
            $.DispatchEvent("Activated", elActionBar.FindChildInLayoutFile('InspectWeaponBtn'), "mouse");
        }
    }
    InspectActionBar.Init = Init;
    function _EnsureVolatileShopSubscribed(cp) {
        if (!cp || !cp.IsValid())
            return;
        if (cp.Data().refreshSubscriptionHandle) {
            $.CancelScheduled(cp.Data().refreshSubscriptionHandle);
            cp.Data().refreshSubscriptionHandle = null;
        }
        g_ActiveTournamentDynamicContainers.forEach((id) => StoreAPI.VolatileShopSubscribe(id, true));
        cp.Data().refreshSubscriptionHandle = $.Schedule(150, () => _EnsureVolatileShopSubscribed(cp));
    }
    function _OnVolatileShopSubscribe(nContainerDef, bNewPricesParsed, elActionBar) {
        const nPrice = InspectShared.GetPopupSetting('price_in_tokens');
        const itemId = InspectShared.GetPopupSetting('item_id');
        _SetupAddRemoveToCartButtons(elActionBar, itemId, nPrice);
        _SetupCartActionsBtn(elActionBar, nPrice, itemId);
        _ShowHideCartBtn(elActionBar, nPrice);
        _ShowHideFavoriteBtn($.GetContextPanel(), elActionBar, nPrice);
    }
    function _SetUpItemCertificate(elPanel, id) {
        const elCert = elPanel.FindChildInLayoutFile('InspectItemCert');
        if (!elCert || !elCert.IsValid()) {
            return;
        }
        const certData = InventoryAPI.GetItemCertificateInfo(id);
        if (!certData || InspectShared.GetPopupSetting('hide_item_cert')) {
            elCert.visible = false;
            return;
        }
        const aCertData = certData.split("\n");
        let strLine = "";
        for (let i = 0; i < aCertData.length - 1; i++) {
            if (i % 2 == 0) {
                strLine = strLine + "<b>" + aCertData[i] + "</b>" + ": " + aCertData[i + 1] + "<br><br>";
            }
        }
        elCert.visible = true;
        elCert.SetPanelEvent('onmouseover', () => UiToolkitAPI.ShowTextTooltip('InspectItemCert', strLine));
        elCert.SetPanelEvent('onmouseout', () => UiToolkitAPI.HideTextTooltip());
    }
    function _SetUpMarketLink(elPanel, id) {
        const elMarketLinkBtn = elPanel.FindChildInLayoutFile('InspectMarketLink');
        const bMarketLink = InspectShared.GetPopupSetting('show_market_link');
        elMarketLinkBtn.SetHasClass('hidden', !bMarketLink);
        if (!bMarketLink) {
            return;
        }
        elMarketLinkBtn.SetPanelEvent('onmouseover', () => UiToolkitAPI.ShowTextTooltip('InspectMarketLink', '#SFUI_Store_Market_Link'));
        elMarketLinkBtn.SetPanelEvent('onmouseout', () => UiToolkitAPI.HideTextTooltip());
        elMarketLinkBtn.SetPanelEvent('onactivate', () => {
            SteamOverlayAPI.OpenURL(ItemInfo.GetMarketLinkForLootlistItem(id));
        });
    }
    function _SetUpOpenSeasonStatsAction(elPanel, contextPanel, id) {
        if (InspectShared.GetPopupSetting('hide_all_action_items'))
            return;
        const elOpenSeasonPanel = elPanel.FindChildInLayoutFile('OpenSeasonStats');
        if (ItemInfo.ItemDefinitionNameStartsWith(id, 'premier season coin')) {
            const season = InventoryAPI.GetItemAttributeValue(id, 'premier season');
            elOpenSeasonPanel.SetPanelEvent('onactivate', () => {
                UiToolkitAPI.ShowCustomLayoutPopupParameters('id-popup-season-stats', 'file://{resources}/layout/popups/popup_season_stats.xml', 'seasonid=' + season + '&' +
                    'itemid=' + id);
                CloseBtnAction(_GetSettingCallback(contextPanel), elPanel);
            });
            $.DispatchEvent('ContextMenuEvent', '');
            elOpenSeasonPanel.SetHasClass('hidden', false);
        }
    }
    function _SetUpViewHighlightReelAction(elPanel, id) {
        const reelId = InventoryAPI.GetItemAttributeValue(id, '{uint32}keychain slot 0 highlight');
        if (!reelId)
            return;
        const elViewHighlightReelAction = elPanel.FindChildInLayoutFile('ViewHighlightReelAction');
        const fnPopupVideoClip = () => {
            UiToolkitAPI.ShowCustomLayoutPopupParameters('popup-videoclip-' + reelId, 'file://{resources}/layout/popups/popup_videoclip.xml', 'reelid=' + reelId + '&' +
                'itemid=' + id);
        };
        elViewHighlightReelAction.SetPanelEvent('onactivate', fnPopupVideoClip);
        elViewHighlightReelAction.SetHasClass('hidden', false);
        if (ItemInfo.IsKeychain(id)) { // auto-play highlight reel if you "inspect" a keychain USB-stick item
            $.Schedule(0.0001, fnPopupVideoClip);
        }
    }
    function _SetupEquipItemBtns(elPanel, id) {
        const elMoreActionsBtn = elPanel.FindChildInLayoutFile('InspectActionsButton');
        const contextPanel = $.GetContextPanel();
        elMoreActionsBtn.SetPanelEvent('onactivate', () => ShowContextMenu(contextPanel));
        const elSingleActionBtn = elPanel.FindChildInLayoutFile('SingleAction');
        if (InspectShared.GetPopupSetting('is_inside_casket')) {
            elMoreActionsBtn.AddClass('hidden');
            elSingleActionBtn.RemoveClass('hidden');
            elSingleActionBtn.text = !InspectShared.GetPopupSetting('is_selected') ? '#UI_Select' : '#UI_Unselect';
            elSingleActionBtn.SetPanelEvent('onactivate', () => _OnActivateUpdateSelectionForMultiSelect(id, contextPanel));
            return;
        }
        if (InspectShared.GetPopupSetting('hide_all_action_items')) {
            $.Msg(`_SetupEquipItemBtns requested to have no action buttons`);
            elMoreActionsBtn.AddClass('hidden');
            elSingleActionBtn.AddClass('hidden');
            _TrySetUpSingleActionPreviewBtn(elPanel, id);
            return;
        }
        const isFanToken = ItemInfo.ItemDefinitionNameSubstrMatch(id, 'tournament_pass_');
        const isStickerDisplaySleeve = InventoryAPI.DoesItemMatchDefinitionByName(id, 'sticker_display_case');
        const isSticker = ItemInfo.IsSticker(id);
        const isPatch = ItemInfo.IsPatch(id);
        const isKeychain = ItemInfo.IsKeychain(id);
        const isSpraySealed = ItemInfo.IsSpraySealed(id);
        const bCloseInspectOnSingleAction = (isSticker || isSpraySealed || isFanToken || isPatch || isKeychain || isStickerDisplaySleeve);
        let isEquipped = InventoryAPI.IsEquipped(id, 't') || InventoryAPI.IsEquipped(id, 'ct') || InventoryAPI.IsEquipped(id, "noteam");
        // Act like pets are always equipped so we hide the action button
        isEquipped ||= ItemInfo.IsPet(id);
        // Only show the more actions button for weapons.
        if (ItemInfo.IsEquippalbleButNotAWeapon(id) ||
            bCloseInspectOnSingleAction ||
            isEquipped) {
            elMoreActionsBtn.AddClass('hidden');
            if (!isEquipped) {
                elSingleActionBtn.RemoveClass('hidden');
                _SetUpSingleActionBtn(elPanel, id, bCloseInspectOnSingleAction, contextPanel);
            }
            return;
        }
        else {
            elMoreActionsBtn.RemoveClass('hidden');
            elSingleActionBtn.AddClass('hidden');
        }
    }
    function _SetUpSingleActionBtn(elPanel, id, closeInspect, contextPanel) {
        const validEntries = ItemContextEntries.FilterEntries(id, 'inspect');
        const elSingleActionBtn = elPanel.FindChildInLayoutFile('SingleAction');
        $.Msg(`_SetUpSingleActionBtn has ${validEntries.length} valid inspect actions`);
        for (let i = 0; i < validEntries.length; i++) {
            const entry = validEntries[i];
            let displayName = '';
            if (entry.name instanceof Function) {
                displayName = entry.name(id);
            }
            else {
                displayName = entry.name;
            }
            $.Msg(` entry[ ${i} ].name = ${displayName}, available for ${id}`);
            elSingleActionBtn.text = '#inv_context_' + displayName;
            elSingleActionBtn.SetPanelEvent('onactivate', () => _OnSingleAction(entry, id, closeInspect, contextPanel));
            elSingleActionBtn.RemoveClass('hidden');
        }
    }
    function _TrySetUpSingleActionPreviewBtn(elPanel, id) {
        const validEntries = ItemContextEntries.FilterEntries(id, 'preview'); //only returns for sticker and key chains
        const elSingleActionBtn = elPanel.FindChildInLayoutFile('SingleAction');
        $.Msg(`_TrySetUpSingleActionPreviewBtn has ${validEntries.length} valid preview actions`);
        for (let i = 0; i < validEntries.length; i++) {
            const entry = validEntries[i];
            let displayName = '';
            if (entry.name instanceof Function) {
                displayName = entry.name(id);
            }
            else {
                displayName = entry.name;
            }
            $.Msg(` entry[ ${i} ].name = ${displayName}, available for ${id}`);
            const previewActionPrefix = displayName.startsWith('preview_') ? '' : 'preview_';
            const contextPanel = $.GetContextPanel();
            elSingleActionBtn.text = '#inv_context_' + previewActionPrefix + displayName;
            elSingleActionBtn.SetPanelEvent('onactivate', () => {
                const bCloseInspect = (contextPanel.IsValid()) ? false : true;
                _OnSingleAction(entry, id, bCloseInspect, contextPanel);
                if (!bCloseInspect) {
                    $.DispatchEvent('BlurPopupPanel', contextPanel.id, true);
                }
            });
            elSingleActionBtn.RemoveClass('hidden');
        }
    }
    function _OnSingleAction(entry, id, closeInspect, contextPanel) {
        if (closeInspect) {
            CloseBtnAction(_GetSettingCallback(contextPanel), contextPanel);
        }
        entry.OnSelected(id);
    }
    function _SetupAddRemoveToCartButtons(elPanel, id, price) {
        const elAddToCartContainer = elPanel.FindChildInLayoutFile('AddToCartContainer');
        const elPrice = elPanel.FindChildInLayoutFile('MajorItemPrice');
        if (!price) {
            elAddToCartContainer.SetHasClass('hidden', true);
            return;
        }
        elPrice.visible = price > 0;
        elAddToCartContainer.SetHasClass('hidden', false);
        elPanel.SetDialogVariableInt('cart-count', ShoppingCart.cart.getItemQuantity(id));
        elPanel.SetDialogVariableInt('total-items', ShoppingCart.cart.getTotalItems());
        const shopItem = { id: id, name: ItemInfo.GetFormattedName(id), price: price };
        elAddToCartContainer.FindChildInLayoutFile('AddToCart').SetPanelEvent('onactivate', () => {
            ShoppingCart.cart.addItem(shopItem, 1);
            const quantity = ShoppingCart.cart.getItemQuantity(id);
            elPanel.SetDialogVariableInt('cart-count', quantity);
            _ShowHideCartBtn(elPanel, price);
            elPrice.visible = quantity > 0;
        });
        elAddToCartContainer.FindChildInLayoutFile('RemoveFromCart').SetPanelEvent('onactivate', () => {
            ShoppingCart.cart.decrementItem(id);
            const quantity = ShoppingCart.cart.getItemQuantity(id);
            elPanel.SetDialogVariableInt('cart-count', quantity);
            _ShowHideCartBtn(elPanel, price);
            elPrice.visible = price > 0;
        });
    }
    function _SetupCartActionsBtn(elPanel, price, id) {
        if (!price) {
            return;
        }
        const elOpenCartBtn = elPanel.FindChildInLayoutFile('InspectOpenCheckout');
        const cp = $.GetContextPanel();
        function _Callback() {
            CloseBtnAction(_GetSettingCallback(cp), elPanel);
        }
        ;
        const callback = UiToolkitAPI.RegisterJSCallback(_Callback);
        elOpenCartBtn.SetPanelEvent('onactivate', () => {
            //You came from check out so close this and go back to it
            if (InspectShared.GetPopupSetting('back_to_checkout', cp)) {
                CloseBtnAction(_GetSettingCallback(cp), elPanel);
                return;
            }
            // open check out and call the callback when the transaction finishes
            const popupPanel = UiToolkitAPI.ShowCustomLayoutPopupParameters('id-popup-shopping-cart-checkout', 'file://{resources}/layout/popups/popup_shopping_cart_checkout.xml', '&callback=' + callback);
            popupPanel.Data().eventId = g_ActiveTournamentInfo.eventid;
            popupPanel.Data().isFromInspect = true;
        });
        ShoppingCart.cart.subscribeToUpdates(elOpenCartBtn, 'inspect-sticker', () => {
            const quantityInCart = ShoppingCart.cart.getItemQuantity(id);
            elPanel.SetDialogVariableInt('cart-count', ShoppingCart.cart.getItemQuantity(id));
            elPanel.SetDialogVariableInt('total-items', ShoppingCart.cart.getTotalItems());
            elPanel.SetDialogVariableInt('price', quantityInCart == 0 ? price : ShoppingCart.cart.getItemLinePrice(id));
        });
    }
    function _ShowHideCartBtn(elPanel, price) {
        const elOpenCartBtn = elPanel.FindChildInLayoutFile('InspectOpenCheckout');
        if (!price) {
            elOpenCartBtn.SetHasClass('hidden', true);
            return;
        }
        // Open cart btn
        if (ShoppingCart.cart.getTotalItems() < 1) {
            elOpenCartBtn.SetHasClass('hidden', true);
            return;
        }
        elOpenCartBtn.SetHasClass('hidden', false);
    }
    function _ShowHideFavoriteBtn(cp, elPanel, nPrice) {
        const elBtn = elPanel.FindChildInLayoutFile('id-sticker-bookmark');
        const defIndex = InspectShared.GetPopupSetting('sticker_def_index', cp);
        if (!nPrice || !defIndex) {
            elBtn.SetHasClass('hidden', true);
            return;
        }
        elBtn.checked = GameInterfaceAPI.GetSettingString('cl_major_store_watch_list').split(',').includes(defIndex.toString());
        elBtn.SetPanelEvent('onactivate', () => {
            const aDefIndexes = GameInterfaceAPI.GetSettingString('cl_major_store_watch_list').split(',');
            const idIndex = aDefIndexes.findIndex(id => id === defIndex.toString());
            if (idIndex === -1) {
                aDefIndexes.push(defIndex.toString());
            }
            else {
                aDefIndexes.splice(idIndex, 1);
            }
            GameInterfaceAPI.SetSettingString('cl_major_store_watch_list', aDefIndexes.length > 0 ? aDefIndexes.join(',') : "");
        });
        elBtn.SetPanelEvent('onmouseover', () => {
            UiToolkitAPI.ShowTextTooltip('id-sticker-bookmark', '#major_store_bookmark_tooltip');
        });
        elBtn.SetPanelEvent('onmouseout', () => {
            UiToolkitAPI.HideTextTooltip();
        });
        elBtn.SetHasClass('hidden', false);
    }
    function _OnActivateUpdateSelectionForMultiSelect(idSubjectItem, contextPanel) {
        CloseBtnAction(_GetSettingCallback(contextPanel), contextPanel);
        $.DispatchEvent('UpdateSelectItemForCapabilityPopup', InspectShared.GetPopupSetting('capability', contextPanel), idSubjectItem, !InspectShared.GetPopupSetting('is_selected', contextPanel));
    }
    //--------------------------------------------------------------------------------------------------
    // Set up character dropdown
    //--------------------------------------------------------------------------------------------------
    function _ShowButtonsForWeaponInspect(elPanel, id) {
        const hasAnims = ItemInfo.IsCharacter(id) || ItemInfo.IsWeapon(id) || ItemInfo.IsMelee(id);
        if (InspectShared.GetPopupSetting('hide_char_select')) {
            return;
        }
        if (hasAnims &&
            !ItemInfo.IsEquippalbleButNotAWeapon(id) &&
            !ItemInfo.IsSticker(id) &&
            !ItemInfo.IsSpraySealed(id) &&
            !ItemInfo.ItemDefinitionNameSubstrMatch(id, "tournament_journal_") &&
            !ItemInfo.ItemDefinitionNameSubstrMatch(id, "tournament_pass_")) {
            elPanel.FindChildInLayoutFile('InspectCharBtn').SetHasClass('hidden', !hasAnims);
            elPanel.FindChildInLayoutFile('InspectWeaponBtn').SetHasClass('hidden', !hasAnims);
            elPanel.FindChildInLayoutFile('LookatWeaponBtn').SetHasClass('hidden', !(ItemInfo.IsWeapon(id) || ItemInfo.IsMelee(id)));
            // get unique per team models (user might own multiple of same characters)
            const list = CharacterAnims.GetValidCharacterModels(true).filter((entry) => {
                return (ItemInfo.IsItemCt(id) && (entry.team === 'ct' || entry.team === 'any')) ||
                    (ItemInfo.IsItemT(id) && (entry.team === 't' || entry.team === 'any')) ||
                    ItemInfo.IsItemAnyTeam(id);
            });
            if (list && (list.length > 0) && !elPanel.FindChildInLayoutFile('InspectDropdownCharModels').Data().selectedId)
                _SetDropdown(elPanel, list, id);
        }
        elPanel.FindChildInLayoutFile('ChangeScenery').SetHasClass('hidden', ItemInfo.IsCharacter(id) || ItemInfo.IsPet(id));
    }
    function _ShowButtonsForCharacterInspect(elPanel, id) {
        const elPreviewPanel = InspectModelImage.GetModelPanel();
        if (!ItemInfo.IsCharacter(id))
            return;
        elPanel.FindChildInLayoutFile('id-character-button-container').SetHasClass('hidden', false);
        const inspectCameraPresets = {
            "AspectRatio4x3": [16, 17],
            "AspectRatio16x9": [26, 27],
            "AspectRatio21x9": [28, 29]
        };
        let arrCameraSetToUse = inspectCameraPresets.AspectRatio4x3;
        if ($.GetContextPanel().BAscendantHasClass("AspectRatio16x9") ||
            $.GetContextPanel().BAscendantHasClass("AspectRatio16x10")) {
            arrCameraSetToUse = inspectCameraPresets.AspectRatio16x9;
        }
        else if ($.GetContextPanel().BAscendantHasClass("AspectRatio21x9")) {
            arrCameraSetToUse = inspectCameraPresets.AspectRatio21x9;
        }
        const characterToolbarButtonSettings = {
            charItemId: id,
            cameraPresetUnzoomed: arrCameraSetToUse[0],
            cameraPresetZoomed: arrCameraSetToUse[1]
        };
        const elCharacterButtons = elPanel.FindChildInLayoutFile('id-character-buttons');
        CharacterButtons.InitCharacterButtons(elCharacterButtons, elPreviewPanel, characterToolbarButtonSettings);
    }
    function _SetDropdown(elPanel, validEntiresList, id) {
        // Which character will be the default?
        const currentMainMenuVanitySettings = ItemInfo.GetOrUpdateVanityCharacterSettings(ItemInfo.IsItemAnyTeam(id) ? null
            : LoadoutAPI.GetItemID(ItemInfo.IsItemCt(id) ? 'ct' : 't', 'customplayer'));
        const elDropdown = elPanel.FindChildInLayoutFile('InspectDropdownCharModels');
        for (let entry of validEntiresList) {
            const rarityColor = InventoryAPI.GetItemRarityColor(entry.itemId);
            const newEntry = $.CreatePanel('Label', elDropdown, entry.itemId, {
                'class': 'DropDownMenu',
                'html': 'true',
                'text': "<font color='" + rarityColor + "'>•</font> " + entry.label,
                'data-team': (entry.team === 'any') ? ((ItemInfo.IsItemT(id) || ItemInfo.IsItemAnyTeam(id)) ? 't' : 'ct') : entry.team
            });
            elDropdown.AddOption(newEntry);
        }
        const itemId = InspectShared.GetPopupSetting('item_id');
        const contextPanel = $.GetContextPanel();
        elDropdown.SetPanelEvent('oninputsubmit', () => InspectActionBar.OnUpdateCharModel(elDropdown, itemId, contextPanel));
        elDropdown.SetSelected(currentMainMenuVanitySettings.charItemId);
    }
    function OnUpdateCharModel(elDropdown, weaponItemId, contextPanel) {
        const characterItemId = elDropdown.GetSelected().id;
        elDropdown.Data().selectedId = elDropdown.GetSelected().id;
        InspectModelImage.SetCharScene(characterItemId, weaponItemId, contextPanel);
    }
    InspectActionBar.OnUpdateCharModel = OnUpdateCharModel;
    //--------------------------------------------------------------------------------------------------
    // Actions from button presses
    //--------------------------------------------------------------------------------------------------
    function NavigateModelPanel(type, bEndWeaponLookat = true) {
        InspectModelImage.ShowHideItemPanel((type !== 'InspectModelChar'));
        InspectModelImage.ShowHideCharPanel((type === 'InspectModelChar'));
        $.GetContextPanel().FindChildTraverse('InspectCharModelsControls').SetHasClass('hidden', type !== 'InspectModelChar');
        if (bEndWeaponLookat) {
            InspectModelImage.EndWeaponLookat();
        }
        const elDesc = $.GetContextPanel().GetParent().FindChildInLayoutFile('InspectItemDesc');
        if (elDesc && elDesc.IsValid()) {
            elDesc.SetHasClass('hidden', false);
        }
    }
    InspectActionBar.NavigateModelPanel = NavigateModelPanel;
    function InspectPlayMusic(type, contentPanel) {
        const elActionBar = contentPanel.FindChildInLayoutFile('PopUpInspectActionBar');
        // This is only to toggle between MVP and main menu music
        if (!elActionBar.Data().previewingMusic)
            return;
        const itemId = InspectShared.GetPopupSetting('item_id', contentPanel);
        if (type === 'mvp') {
            if (elActionBar.Data().schfnMusicMvpPreviewEnd)
                return; // ignore mashing the button while the MVP anthem is already playing
            InventoryAPI.StopItemPreviewMusic();
            InventoryAPI.PlayItemPreviewMusic(itemId, 'MVPPreview');
            // Make sure that the MVP preview stops after 7 seconds (competitive round restart delay)
            elActionBar.Data().schfnMusicMvpPreviewEnd = $.Schedule(6.8, () => InspectActionBar.InspectPlayMusic('schfn', contentPanel));
        }
        else if (type === 'schfn') {
            elActionBar.Data().schfnMusicMvpPreviewEnd = null;
            InventoryAPI.StopItemPreviewMusic();
            InventoryAPI.PlayItemPreviewMusic(itemId, '');
        }
    }
    InspectActionBar.InspectPlayMusic = InspectPlayMusic;
    function ShowContextMenu(contextPanel) {
        const elBtn = contextPanel.FindChildTraverse('InspectActionsButton');
        const id = InspectShared.GetPopupSetting('item_id', contextPanel);
        $.Msg('Item context Menu OPEN: ' + id);
        const contextMenuPanel = UiToolkitAPI.ShowCustomLayoutContextMenuParametersDismissEvent(elBtn.id, '', 'file://{resources}/layout/context_menus/context_menu_inventory_item.xml', 'itemid=' + id + '&populatefiltertext=inspect', () => $.DispatchEvent("CSGOPlaySoundEffect", "weapon_selectReplace", "MOUSE"));
        contextMenuPanel.AddClass("ContextMenu_NoArrow");
    }
    InspectActionBar.ShowContextMenu = ShowContextMenu;
    function _SetCloseBtnAction(elPanel, contextPanel) {
        const elBtn = elPanel.FindChildInLayoutFile('InspectCloseBtn');
        elBtn.SetPanelEvent('onactivate', () => CloseBtnAction(_GetSettingCallback(contextPanel), elPanel));
    }
    function _GetSettingCallback(contextPanel) {
        let callbackFromPopup = InspectShared.GetPopupSetting('callback_handle', contextPanel);
        return !callbackFromPopup ? -1 : callbackFromPopup;
    }
    function UpdateScenery() {
        UiToolkitAPI.ShowCustomLayoutContextMenuParametersDismissEvent('id-inspect-contextmenu-maps', '', 'file://{resources}/layout/context_menus/context_menu_mainmenu_vanity.xml', 'type=maps' +
            '&' + 'inspect-map=true', () => $.DispatchEvent('ContextMenuEvent', ''));
    }
    InspectActionBar.UpdateScenery = UpdateScenery;
    function LookatWeapon() {
        const bEndWeaponLookat = false;
        NavigateModelPanel('InspectModel', bEndWeaponLookat);
        const elDesc = $.GetContextPanel().GetParent().FindChildInLayoutFile('InspectItemDesc');
        if (elDesc && elDesc.IsValid()) {
            elDesc.SetHasClass('hidden', true);
        }
        InspectModelImage.StartWeaponLookat();
    }
    InspectActionBar.LookatWeapon = LookatWeapon;
    function CloseBtnAction(callbackHandle = -1, elActionBar) {
        $.DispatchEvent("CSGOPlaySoundEffect", "inventory_inspect_close", "MOUSE");
        // Invoke callback set up in the parent panel (if set)
        $.DispatchEvent('UIPopupButtonClicked', '');
        UiToolkitAPI.HideTextTooltip();
        if (callbackHandle != -1) {
            UiToolkitAPI.InvokeJSCallback(callbackHandle);
        }
        if (elActionBar.Data().previewingMusic) {
            InventoryAPI.StopItemPreviewMusic();
            elActionBar.Data().previewingMusic = false;
            if (elActionBar.Data().schfnMusicMvpPreviewEnd) {
                $.CancelScheduled(elActionBar.Data().schfnMusicMvpPreviewEnd);
                elActionBar.Data().schfnMusicMvpPreviewEnd = null;
            }
        }
    }
    InspectActionBar.CloseBtnAction = CloseBtnAction;
})(InspectActionBar || (InspectActionBar = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfaW5zcGVjdF9hY3Rpb24tYmFyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvcG9wdXBzL3BvcHVwX2luc3BlY3RfYWN0aW9uLWJhci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBQ3JDLDBEQUEwRDtBQUMxRCxzQ0FBc0M7QUFDdEMsK0NBQStDO0FBQy9DLG1EQUFtRDtBQUVuRCxJQUFVLGdCQUFnQixDQXN1QnpCO0FBdHVCRCxXQUFVLGdCQUFnQjtJQUV6QixTQUFnQixJQUFJO1FBRW5CLE1BQU0sV0FBVyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSx1QkFBdUIsQ0FBRSxDQUFDO1FBRXpGLElBQUssQ0FBQyxhQUFhLENBQUMsZUFBZSxDQUFFLGNBQWMsQ0FBRSxFQUNyRDtZQUNDLFdBQVcsQ0FBQyxRQUFRLENBQUUsUUFBUSxDQUFFLENBQUM7WUFDakMsT0FBTztTQUNQO1FBRUQsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLHVCQUF1QixHQUFHLElBQXFCLENBQUM7UUFDbkUsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLGVBQWUsR0FBRyxLQUFLLENBQUM7UUFDM0MsV0FBVyxDQUFDLFdBQVcsQ0FBRSxRQUFRLENBQUUsQ0FBQztRQUNwQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsd0JBQXdCLEdBQUcsS0FBSyxDQUFDO1FBRXBELE1BQU0sTUFBTSxHQUFHLGFBQWEsQ0FBQyxlQUFlLENBQUUsU0FBUyxDQUFZLENBQUM7UUFFcEUscUJBQXFCLENBQUUsV0FBVyxFQUFFLE1BQU0sQ0FBRSxDQUFDO1FBQzdDLG1CQUFtQixDQUFFLFdBQVcsRUFBRSxNQUFNLENBQUUsQ0FBQztRQUMzQyw0QkFBNEIsQ0FBRSxXQUFXLEVBQUUsTUFBTSxDQUFFLENBQUM7UUFDcEQsK0JBQStCLENBQUUsV0FBVyxF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