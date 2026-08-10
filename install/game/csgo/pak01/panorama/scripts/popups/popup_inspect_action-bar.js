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
        if (nPrice) {
            $.RegisterForUnhandledEvent('PanoramaComponent_Store_VolatileShopSubscribe', (...args) => { _OnVolatileShopSubscribe(...args, elActionBar); });
            _EnsureVolatileShopSubscribed($.GetContextPanel());
        }
        const contentPanel = $.GetContextPanel();
        elActionBar.FindChildInLayoutFile('InspectPlayMvpBtn').SetPanelEvent('onactivate', () => InspectPlayMusic('mvp', contentPanel));
        const category = InventoryAPI.GetLoadoutCategory(itemId);
        if (category == "musickit") {
            InventoryAPI.PlayItemPreviewMusic(itemId, '');
            elActionBar.Data().previewingMusic = true;
            const elMusicBtn = elActionBar.FindChildInLayoutFile('InspectPlayMvpBtn');
            elMusicBtn.SetHasClass('hidden', (InventoryAPI.GetItemRarity(itemId) <= 0));
        }
        const bisItemInLootlist = InspectShared.GetPopupSetting('is_item_in_lootlist');
        elActionBar.FindChildInLayoutFile('InspectWeaponBtn').checked =
            (!elActionBar.FindChildInLayoutFile('InspectCharBtn').checked &&
                !elActionBar.FindChildInLayoutFile('LookatWeaponBtn').checked) ||
                bisItemInLootlist;
        if (bisItemInLootlist) {
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
        if (ItemInfo.IsKeychain(id)) {
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
        for (let i = 0; i < validEntries.length; i++) {
            const entry = validEntries[i];
            let displayName = '';
            if (entry.name instanceof Function) {
                displayName = entry.name(id);
            }
            else {
                displayName = entry.name;
            }
            elSingleActionBtn.text = '#inv_context_' + displayName;
            elSingleActionBtn.SetPanelEvent('onactivate', () => _OnSingleAction(entry, id, closeInspect, contextPanel));
            elSingleActionBtn.RemoveClass('hidden');
        }
    }
    function _TrySetUpSingleActionPreviewBtn(elPanel, id) {
        const validEntries = ItemContextEntries.FilterEntries(id, 'preview');
        const elSingleActionBtn = elPanel.FindChildInLayoutFile('SingleAction');
        for (let i = 0; i < validEntries.length; i++) {
            const entry = validEntries[i];
            let displayName = '';
            if (entry.name instanceof Function) {
                displayName = entry.name(id);
            }
            else {
                displayName = entry.name;
            }
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
            if (InspectShared.GetPopupSetting('back_to_checkout', cp)) {
                CloseBtnAction(_GetSettingCallback(cp), elPanel);
                return;
            }
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
            const list = CharacterAnims.GetValidCharacterModels(true).filter((entry) => {
                return (ItemInfo.IsItemCt(id) && (entry.team === 'ct' || entry.team === 'any')) ||
                    (ItemInfo.IsItemT(id) && (entry.team === 't' || entry.team === 'any')) ||
                    ItemInfo.IsItemAnyTeam(id);
            });
            if (list && (list.length > 0) && !elPanel.FindChildInLayoutFile('InspectDropdownCharModels').Data().selectedId)
                _SetDropdown(elPanel, list, id);
        }
        elPanel.FindChildInLayoutFile('ChangeScenery').SetHasClass('hidden', ItemInfo.IsCharacter(id));
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
        if (!elActionBar.Data().previewingMusic)
            return;
        const itemId = InspectShared.GetPopupSetting('item_id', contentPanel);
        if (type === 'mvp') {
            if (elActionBar.Data().schfnMusicMvpPreviewEnd)
                return;
            InventoryAPI.StopItemPreviewMusic();
            InventoryAPI.PlayItemPreviewMusic(itemId, 'MVPPreview');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfaW5zcGVjdF9hY3Rpb24tYmFyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvcG9wdXBzL3BvcHVwX2luc3BlY3RfYWN0aW9uLWJhci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBQ3JDLDBEQUEwRDtBQUMxRCxzQ0FBc0M7QUFDdEMsK0NBQStDO0FBQy9DLG1EQUFtRDtBQUVuRCxJQUFVLGdCQUFnQixDQXd1QnpCO0FBeHVCRCxXQUFVLGdCQUFnQjtJQUV6QixTQUFnQixJQUFJO1FBRW5CLE1BQU0sV0FBVyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSx1QkFBdUIsQ0FBRSxDQUFDO1FBRXpGLElBQUssQ0FBQyxhQUFhLENBQUMsZUFBZSxDQUFFLGNBQWMsQ0FBRSxFQUNyRDtZQUNDLFdBQVcsQ0FBQyxRQUFRLENBQUUsUUFBUSxDQUFFLENBQUM7WUFDakMsT0FBTztTQUNQO1FBRUQsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLHVCQUF1QixHQUFHLElBQXFCLENBQUM7UUFDbkUsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLGVBQWUsR0FBRyxLQUFLLENBQUM7UUFDM0MsV0FBVyxDQUFDLFdBQVcsQ0FBRSxRQUFRLENBQUUsQ0FBQztRQUNwQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsd0JBQXdCLEdBQUcsS0FBSyxDQUFDO1FBRXBELE1BQU0sTUFBTSxHQUFHLGFBQWEsQ0FBQyxlQUFlLENBQUUsU0FBUyxDQUFZLENBQUM7UUFFcEUscUJBQXFCLENBQUUsV0FBVyxFQUFFLE1BQU0sQ0FBRSxDQUFDO1FBQzdDLG1CQUFtQixDQUFFLFdBQVcsRUFBRSxNQUFNLENBQUUsQ0FBQztRQUMzQyw0QkFBNEIsQ0FBRSxXQUFXLEVBQUUsTUFBTSxDQUFFLENBQUM7UUFDcEQsK0JBQStCLENBQUUsV0FBVyxF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