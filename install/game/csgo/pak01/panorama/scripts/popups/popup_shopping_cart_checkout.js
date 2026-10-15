"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../common/shopping_cart.ts" />
/// <reference path="../generated/items_event_current_generated_store.d.ts" />
/// <reference path="../generated/items_event_current_generated_store.ts" />
/// <reference path="../common/formattext.ts" />
/// <reference path="../common/hold_button.ts" />
/// <reference path="../common/add_major_tokens_anim.ts" />
/// <reference path="../popups/popup_major_store.ts" />
/// <reference path="../popups/popup_acknowledge_item.ts" />
var PopUpShoppingCartCheckout;
(function (PopUpShoppingCartCheckout) {
    function getCart(cp) {
        if (!cp)
            cp = $.GetContextPanel();
        let cart = ShoppingCart.cart;
        while (cp) {
            if (cp.Data().hasOwnProperty('cart') && cp.Data().cart) {
                cart = cp.Data().cart;
                break;
            }
            cp = cp.GetParent();
        }
        return cart;
    }
    function OnReadyForDisplay() {
        if (!MyPersonaAPI.IsConnectedToGC()) {
            ClosePopup();
            return;
        }
        const cp = $.GetContextPanel();
        $.RegisterForUnhandledEvent('PanoramaComponent_Inventory_ItemCustomizationNotification', (...args) => { _ItemCustomizationNotification(...args, cp); });
        $.RegisterForUnhandledEvent('PanoramaComponent_Store_PurchaseCompleted', (...args) => { _OnPurchaseCompletion(...args, cp); });
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_UpdateConnectionToGC', Init);
        cp.FindChildInLayoutFile('id-cart-close').SetPanelEvent('onactivate', ClosePopup);
        cp.FindChildInLayoutFile('id-cart-balance').SetDialogVariable('local-price', StoreAPI.GetStoreItemTokensBundlePrice('' + g_ActiveTournamentInfo.itemid_charge, 100, ''));
        cp.FindChildInLayoutFile('id-cart-balance').SetPanelEvent('onmouseover', () => {
            UiToolkitAPI.ShowTitleTextTooltip('id-cart-balance', '#CSGO_TournamentPass_' + g_ActiveTournamentInfo.location + '_credits', '#major_store_balance_tooltip');
        });
        cp.FindChildInLayoutFile('id-cart-balance').SetPanelEvent('onmouseout', () => {
            UiToolkitAPI.HideTitleTextTooltip();
        });
        AddMajorTokensAnim.SetTransitionEndEvent(cp.FindChildInLayoutFile('id-cart-add-tokens'));
    }
    function OnUnreadyForDisplay() {
    }
    let m_numTotalEconItemsInInventory = 0;
    function Init() {
        if (!MyPersonaAPI.IsConnectedToGC()) {
            ClosePopup();
            return;
        }
        InventoryAPI.SetInventorySortAndFilters('inv_sort_age', false, 'only_econ_items', '', '');
        m_numTotalEconItemsInInventory = InventoryAPI.GetInventoryCount();
        const cp = $.GetContextPanel();
        const strOneOffCartId = cp.GetAttributeString('cartid', '');
        if (strOneOffCartId) {
            let cart = ShoppingCart.findOrCreateTempCart(strOneOffCartId, false);
            if (cart) {
                cp.Data().cart = cart;
                ShoppingCart.releaseTempCart(strOneOffCartId);
            }
        }
        cp.SetHasClass('shopping-oneoff-cart', getCart(cp) !== ShoppingCart.cart);
        _SetRedeemableBalance(cp);
        getCart(cp).subscribeToUpdates(cp, 'purchase-btn', () => {
            _SetupButtonsAndWarnings(cp);
        });
        _SetUpEmptyState(cp);
        _MakeCartTiles(cp);
        getCart(cp).subscribeToUpdates(cp, 'total-price', () => {
            cp.SetDialogVariableInt('total-price', getCart(cp).getTotalPrice());
        });
        getCart(cp).subscribeToUpdates(cp, 'total-count', () => {
            cp.SetDialogVariableInt('total-count', getCart(cp).getTotalItems());
        });
        cp.FindChildInLayoutFile('id-checkout-clear-all').SetPanelEvent('onactivate', () => {
            getCart(cp).clearCart();
            _SetUpEmptyState(cp);
            _MakeCartTiles(cp);
        });
        if (PopupMajorStore.GetSecondsUntilPendingPriceUpdateForAllTournamentItems() > 0) {
            PopupMajorStore.PriceRefreshTimerUpdate(cp);
        }
    }
    PopUpShoppingCartCheckout.Init = Init;
    function _SetRedeemableBalance(cp) {
        const idxLookup = InventoryAPI.GetCacheTypeElementIndexByKey('SeasonalOperations', g_ActiveTournamentInfo.credits_id);
        let nRedeemableBalance = 0;
        if (g_ActiveTournamentInfo.credits_id == InventoryAPI.GetCacheTypeElementFieldByIndex('SeasonalOperations', idxLookup, 'season_value')) {
            nRedeemableBalance = InventoryAPI.GetCacheTypeElementFieldByIndex('SeasonalOperations', idxLookup, 'redeemable_balance');
            nRedeemableBalance = (nRedeemableBalance === null || nRedeemableBalance === undefined) ? 0 : nRedeemableBalance;
        }
        cp.SetDialogVariableInt('balance', nRedeemableBalance);
        cp.Data().redeemableBalance = nRedeemableBalance;
    }
    function _SetupButtonsAndWarnings(cp) {
        const isInventoryFull = (m_numTotalEconItemsInInventory + getCart(cp).getTotalItems() > ItemInfo.NUM_BACKPACK_SLOTS);
        cp.FindChildInLayoutFile('id-cart-warning').visible = isInventoryFull;
        _AcknowledgeNewTokens(cp);
        $.Schedule(.4, () => {
            let itemId = '';
            let numInactiveTokens = 0;
            if (!cp || !cp.IsValid()) {
                return;
            }
            InventoryAPI.SetInventorySortAndFilters('inv_sort_age', false, 'tool_type:seasontiers,has_attribute:season access:==:' + g_ActiveTournamentInfo.credits_id, '', '');
            if (InventoryAPI.GetInventoryCount() > 0) {
                itemId = InventoryAPI.GetInventoryItemIDByIndex(0);
                numInactiveTokens = Number(InventoryAPI.GetItemAttributeValue(itemId, '{uint32}upgrade level'));
            }
            cp.Data().activatedCredits = numInactiveTokens;
            let nPurchaseTokens = getCart(cp).getTotalPrice() - (cp.Data().redeemableBalance + numInactiveTokens);
            const nActualNumberOfPurchaseTokensNeeded = nPurchaseTokens;
            nPurchaseTokens = nPurchaseTokens > 0 ? Math.max(nPurchaseTokens, 100) : 0;
            const nTokensNeeded = getCart(cp).getTotalPrice() - cp.Data().redeemableBalance;
            cp.SetDialogVariableInt('tokens-needed', nTokensNeeded);
            cp.SetDialogVariableInt('inactive-tokens', numInactiveTokens);
            cp.SetDialogVariableInt('purchase-tokens', nPurchaseTokens);
            cp.FindChildInLayoutFile('id-cart-not-enough-tokens').SetHasClass('show', nTokensNeeded >= 0 && !isInventoryFull && getCart(cp).getTotalPrice() > 0);
            let oSettings = {
                cp: cp,
                nInactiveTokens: numInactiveTokens,
                nPurchaseTokens: nPurchaseTokens,
                nActualNumberOfPurchaseTokensNeeded: nActualNumberOfPurchaseTokensNeeded,
                nTokensNeeded: nTokensNeeded,
                isInventoryFull: isInventoryFull,
                itemId: itemId
            };
            _UpdateActiveTokenProgressSection(oSettings);
            _UpdatePurchaseTokenProgressSection(oSettings);
            _UpdateUseTokensProgressSection(oSettings);
        });
    }
    function _UpdateActiveTokenProgressSection(oSettings) {
        let elActivateSection = oSettings.cp.FindChildInLayoutFile('id-cart-checkout-step-activate');
        const bEnabled = oSettings.nInactiveTokens > 0 &&
            (oSettings.cp.Data().redeemableBalance < getCart(oSettings.cp).getTotalPrice());
        !oSettings.isInventoryFull &&
            getCart(oSettings.cp).getTotalPrice() > 0;
        const bHide = (getCart(oSettings.cp).getTotalItems() < 1) || (oSettings.nInactiveTokens < 1 && oSettings.nPurchaseTokens < 1);
        elActivateSection.SetHasClass('hide', bHide);
        if (bHide)
            return;
        const elPurchaseSection = oSettings.cp.FindChildInLayoutFile('id-cart-checkout-step-purchase');
        if (oSettings.nInactiveTokens > 0 || oSettings.nPurchaseTokens < 1) {
            oSettings.cp.FindChildInLayoutFile('id-cart-purchase-steps').MoveChildBefore(elActivateSection, elPurchaseSection);
            elActivateSection.FindChildInLayoutFile('id-cart-top-line').SetHasClass('hide-top-line', true);
            elPurchaseSection.FindChildInLayoutFile('id-cart-top-line').SetHasClass('hide-top-line', false);
        }
        else {
            elActivateSection.FindChildInLayoutFile('id-cart-top-line').SetHasClass('hide-top-line', false);
            elPurchaseSection.FindChildInLayoutFile('id-cart-top-line').SetHasClass('hide-top-line', true);
            oSettings.cp.FindChildInLayoutFile('id-cart-purchase-steps').MoveChildAfter(elActivateSection, elPurchaseSection);
        }
        const elBtn = elActivateSection.FindChildInLayoutFile('id-cart-activate-tokens-btn');
        const btnSettings = {
            btn: elBtn,
            tooltip: '#major_store_checkout_activate_tokens_tooltip',
            locString: $.Localize('#major_store_checkout_activate_btn'),
            loopingSound: 'UI.Laptop.ButtonFillLoop',
            timerCompleteAction: () => {
                InventoryAPI.UseTool(oSettings.itemId, '');
                elBtn.enabled = false;
                _SetCallbackTimeout(oSettings.cp, elActivateSection);
            }
        };
        HoldButton.SetupButton(btnSettings);
        elBtn.enabled = bEnabled;
        elActivateSection.SetHasClass('active', bEnabled);
    }
    function _UpdatePurchaseTokenProgressSection(oSettings) {
        const elProgressSection = oSettings.cp.FindChildInLayoutFile('id-cart-checkout-step-purchase');
        const bEnabled = oSettings.nInactiveTokens <= 0 && oSettings.nPurchaseTokens > 0 &&
            !oSettings.isInventoryFull &&
            getCart(oSettings.cp).getTotalPrice() > 0;
        const bHide = (oSettings.nPurchaseTokens <= 0 || getCart(oSettings.cp).getTotalItems() < 1);
        elProgressSection.SetHasClass('hide', bHide);
        if (bHide)
            return;
        const elBtn = elProgressSection.FindChildInLayoutFile('id-cart-buy-tokens-btn');
        elBtn.SetDialogVariable('real-price', StoreAPI.GetStoreItemTokensBundlePrice('' + g_ActiveTournamentInfo.itemid_charge, oSettings.nPurchaseTokens, ''));
        const btnSettings = {
            btn: elBtn,
            tooltip: '#major_store_checkout_purchase_tokens_tooltip' + ((oSettings.nActualNumberOfPurchaseTokensNeeded < 100) ? '100' : ''),
            locString: $.Localize('#major_store_checkout_purchase_btn', elBtn),
            loopingSound: 'UI.Laptop.ButtonFillLoop',
            timerCompleteAction: () => {
                elBtn.enabled = false;
                StoreAPI.StoreItemPurchase('' + g_ActiveTournamentInfo.itemid_charge + '(' + oSettings.nPurchaseTokens + ')');
                $.DispatchEvent("CSGOPlaySoundEffect", "UIPanorama.buymenu_purchase", "MOUSE");
            }
        };
        elBtn.enabled = bEnabled;
        HoldButton.SetupButton(btnSettings);
        elBtn.enabled = bEnabled;
        elProgressSection.SetHasClass('active', bEnabled);
    }
    function _UpdateUseTokensProgressSection(oSettings) {
        const elProgressSection = oSettings.cp.FindChildInLayoutFile('id-cart-checkout-step-use-tokens');
        const bHide = (getCart(oSettings.cp).getTotalItems() < 1);
        elProgressSection.SetHasClass('hide', bHide);
        if (bHide)
            return;
        const bEnabled = !oSettings.isInventoryFull &&
            getCart(oSettings.cp).getTotalPrice() > 0 &&
            oSettings.nPurchaseTokens <= 0 &&
            (oSettings.nInactiveTokens <= 0 || oSettings.cp.Data().redeemableBalance >= getCart(oSettings.cp).getTotalPrice());
        const elBtn = elProgressSection.FindChildInLayoutFile('id-cart-use-tokens-btn');
        const strCheckoutSuffix = oSettings.cp.GetAttributeString('checkoutsuffix', '') || '';
        const strButtonText = $.Localize('#major_store_checkout_use_tokens_btn' + strCheckoutSuffix);
        elBtn.text = strButtonText;
        const btnSettings = {
            btn: elBtn,
            tooltip: '#major_store_checkout_use_tokens_tooltip' + strCheckoutSuffix,
            locString: strButtonText,
            loopingSound: 'UI.Laptop.ButtonFillLoop',
            timerCompleteAction: () => {
                InventoryAPI.SetInventorySortAndFilters('inv_sort_age', false, 'only_econ_items', '', '');
                if (InventoryAPI.GetInventoryCount() + getCart(oSettings.cp).getTotalItems() > ItemInfo.NUM_BACKPACK_SLOTS) {
                    UiToolkitAPI.ShowGenericPopupOk($.Localize('#popup_casket_title_error_casket_inv_full'), $.Localize('#SFUI_InventoryFull_Error'), '', () => { });
                    return;
                }
                _OnAccept(oSettings.cp.Data().redeemableBalance, getCart(oSettings.cp).getTotalPrice(), oSettings.cp);
                elBtn.enabled = false;
                oSettings.cp.FindChildInLayoutFile('id-cart-close').enabled = false;
                _SetCallbackTimeout(oSettings.cp, elProgressSection);
            }
        };
        HoldButton.SetupButton(btnSettings);
        elBtn.enabled = bEnabled;
        elProgressSection.SetHasClass('active', bEnabled);
    }
    function _SetUpEmptyState(cp) {
        const items = getCart(cp).getItems();
        cp.SetHasClass('empty-cart', items.length <= 0);
    }
    function ClosePopup() {
        $.DispatchEvent('UIPopupButtonClicked', '');
        $.DispatchEvent('ContextMenuEvent', '');
        UiToolkitAPI.HideTextTooltip();
        UiToolkitAPI.HideTitleTextTooltip();
        PopupMajorStore.CancelRefreshTimerUpdate($.GetContextPanel());
    }
    PopUpShoppingCartCheckout.ClosePopup = ClosePopup;
    function _OnAccept(creditsOwned, totalPrice, cp) {
        const items = getCart(cp).getItems();
        let szPurchaseItems = '';
        if (items.length === 0) {
            getCart(cp).clearCart();
            UiToolkitAPI.ShowGenericPopupOk($.Localize('#major_store_checkout_cart_error'), $.Localize('#major_store_checkout_cart_error_desc'), '', () => $.DispatchEvent('HideContentPanel'));
            ClosePopup();
        }
        else {
            for (const item of items) {
                for (let j = 0; j < item.quantity; ++j) {
                    let purchase_id = item.checkout_id || item.id;
                    szPurchaseItems = purchase_id + (szPurchaseItems ? ',' + szPurchaseItems : '');
                }
            }
        }
        cp.FindChildInLayoutFile('id-checkout-lister').Children().forEach(entry => {
            entry.FindChildInLayoutFile('id-cart-quantity-block').hittest = false;
            entry.FindChildInLayoutFile('id-cart-quantity-block').hittestchildren = false;
        });
        MissionsAPI.ActionOperationFauxPurchase(g_ActiveTournamentInfo.credits_id, creditsOwned, totalPrice, szPurchaseItems);
    }
    function _MakeCartTiles(cp) {
        const elParent = cp.FindChildInLayoutFile('id-checkout-lister');
        const cartIds = new Set(getCart(cp).getItems().map(item => item.id));
        const aItemsNotInCart = elParent.Children().filter(tile => !cartIds.has(tile.id));
        aItemsNotInCart.forEach(tile => {
            tile.AddClass('hide-for-delete');
        });
        getCart(cp).getItems().forEach(item => {
            let elTile = elParent.FindChildInLayoutFile(item.id);
            if (!elTile) {
                elTile = $.CreatePanel('Panel', elParent, item.id);
                elTile.BLoadLayoutSnippet('cart-item');
                const itemImage = elTile.FindChildInLayoutFile('id-cart-item-image');
                itemImage.itemid = item.id;
                itemImage.SetPanelEvent('onactivate', () => {
                    if (getCart(cp) !== ShoppingCart.cart)
                        return;
                    if (cp.Data().isFromInspect) {
                        return;
                    }
                    const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_inventory_inspect.xml');
                    let oSettings = {
                        item_id: item.id,
                        inspect_only: true,
                        hide_all_action_items: true,
                        price_in_tokens: item.price,
                        back_to_checkout: true
                    };
                    elPanel.Data().oSettings = oSettings;
                });
                let fmtName = ItemInfo.GetFormattedName(item.id);
                fmtName.SetOnLabel(elTile.FindChildInLayoutFile('id-cart-item-name'));
                elTile.FindChildInLayoutFile('id-cart-item-add-to-cart-btn').SetPanelEvent('onactivate', () => {
                    getCart(cp).addItem(item);
                    const itemQuantity = getCart(cp).getItemQuantity(item.id);
                    elTile.SetDialogVariableInt('count', itemQuantity);
                    const lineItemPrice = getCart(cp).getItemLinePrice(item.id);
                    elTile.SetDialogVariableInt('price', lineItemPrice);
                    if (ShoppingCart.cart.getItemQuantity(item.id) >= 10 || ShoppingCart.cart.getTotalItems() >= 100) {
                        $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.buymenu_failure', 'MOUSE');
                        return;
                    }
                    $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.generic_button_press', 'MOUSE');
                });
                elTile.FindChildInLayoutFile('id-cart-item-remove-from-cart-btn').SetPanelEvent('onactivate', () => {
                    getCart(cp).decrementItem(item.id);
                    const itemQuantity = getCart(cp).getItemQuantity(item.id);
                    const lineItemPrice = getCart(cp).getItemLinePrice(item.id);
                    elTile.SetDialogVariableInt('price', lineItemPrice);
                    elTile.SetDialogVariableInt('count', itemQuantity);
                    $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.generic_button_press', 'MOUSE');
                });
                elTile.FindChildInLayoutFile('id-cart-item-trash-btn').SetPanelEvent('onactivate', () => {
                    getCart(cp).removeItem(item.id);
                    _SetUpEmptyState(cp);
                    _MakeCartTiles(cp);
                    $.DispatchEvent('CSGOPlaySoundEffect', 'UI.BookClose', 'MOUSE');
                });
                let isInitialSetup = true;
                let lastSeenPrice;
                const elChange = elTile.FindChildInLayoutFile('id-cart-item-price-change');
                getCart(cp).subscribeToUpdates(elTile, 'cart-item', () => {
                    if (item.oldPrice !== undefined && item.oldPrice !== item.price) {
                        const nDifference = item.price - item.oldPrice;
                        elTile.SetDialogVariableInt('price-change', Math.abs(nDifference * getCart(cp).getItemQuantity(item.id)));
                        elChange.SetHasClass('show-change', false);
                        elChange.SwitchClass('direction', item.price > item.oldPrice ? 'higher' : 'lower');
                        if (isInitialSetup || lastSeenPrice == item.price) {
                            elChange.SetHasClass('show-change', true);
                        }
                        else {
                            elTile.FindChildInLayoutFile('id-cart-item-price-loading').visible = true;
                            $.Schedule(1, () => {
                                elTile.FindChildInLayoutFile('id-cart-item-price-loading').visible = false;
                                elChange.SetHasClass('show-change', true);
                            });
                        }
                    }
                    else
                        elChange.SetHasClass('show-change', false);
                    const lineItemPrice = getCart(cp).getItemLinePrice(item.id);
                    const itemQuantity = getCart(cp).getItemQuantity(item.id);
                    elTile.SetDialogVariableInt('price', lineItemPrice);
                    lastSeenPrice = item.price;
                    isInitialSetup = false;
                });
                $.RegisterEventHandler('PropertyTransitionEnd', elTile, function (panelName, propertyName) {
                    if (propertyName === "opacity") {
                        if (elTile.visible === true && elTile.BIsTransparent()) {
                            elTile.DeleteAsync(0);
                        }
                    }
                });
            }
            const lineItemPrice = getCart(cp).getItemLinePrice(item.id);
            const itemQuantity = getCart(cp).getItemQuantity(item.id);
            elTile.SetDialogVariableInt('count', getCart(cp).getItemQuantity(item.id));
            elTile.SetDialogVariableInt('price', getCart(cp).getItemLinePrice(item.id));
        });
    }
    function _SetCallbackTimeout(cp, elProgressSection) {
        _CancelCallbackTimeout(cp);
        elProgressSection.SetHasClass('show-spinner', true);
        cp.Data().redeemTimeoutHandle = $.Schedule(5, () => {
            UiToolkitAPI.ShowGenericPopupOk($.Localize('#SFUI_SteamConnectionErrorTitle'), $.Localize('#SFUI_Steam_Error_LinkUnexpected'), '', () => $.DispatchEvent('HideContentPanel'));
            ClosePopup();
        });
    }
    function _CancelCallbackTimeout(cp) {
        if (cp.Data().redeemTimeoutHandle) {
            $.CancelScheduled(cp.Data().redeemTimeoutHandle);
            cp.Data().redeemTimeoutHandle = null;
            cp.FindChildInLayoutFile('id-cart-purchase-steps').FindChildrenWithClassTraverse('show-spinner').forEach(element => {
                element.SetHasClass('show-spinner', false);
            });
        }
    }
    function _ItemCustomizationNotification(numericType, type, itemid, cp) {
        if (type === 'seasontiers') {
            _CancelCallbackTimeout(cp);
            function CallAtEndAnimation() {
                Init();
                cp.FindChildInLayoutFile('id-cart-add-tokens').SetHasClass('hidden', true);
                cp.FindChildInLayoutFile('id-cart-balance').TriggerClass('popup-major-store__top-bar__balance-anim');
            }
            cp.FindChildInLayoutFile('id-cart-add-tokens').SetHasClass('hidden', false);
            AddMajorTokensAnim.StartAnim(cp.FindChildInLayoutFile('id-cart-add-tokens'), cp.FindChildInLayoutFile('id-cart-balance'), cp.Data().activatedCredits, CallAtEndAnimation);
            cp.Data().activatedCredits = 0;
        }
        if (type === 'reward_redeemed') {
            _CancelCallbackTimeout(cp);
            const aNewItems = AcknowledgeItems.GetItems().filter(item => (item.pickuptype
                && ['purchased'].includes(item.pickuptype)));
            if (aNewItems.length > 0) {
                getCart(cp).clearCart();
                _InvokeCallback($.GetContextPanel());
                $.DispatchEvent('ShowAcknowledgePopup', '', '');
                ClosePopup();
            }
            else {
                ClosePopup();
            }
        }
    }
    function _OnPurchaseCompletion(itemId, cp) {
        _CancelCallbackTimeout(cp);
        _AcknowledgeNewTokens(cp);
    }
    function _AcknowledgeNewTokens(cp) {
        const aNewItems = AcknowledgeItems.GetItems().filter(item => (item.pickuptype
            && ['purchased'].includes(item.pickuptype)));
        let bHasNewCredits = false;
        aNewItems.forEach(item => {
            if ((ItemInfo.ItemDefinitionNameSubstrMatch(item.id, 'tournament_pass_') && ItemInfo.ItemDefinitionNameSubstrMatch(item.id, '_credits'))) {
                InventoryAPI.AcknowledgeNewItembyItemID(item.id);
                bHasNewCredits = true;
            }
        });
        if (bHasNewCredits) {
            $.DispatchEvent('HideStoreStatusPanel');
            $.Schedule(.1, Init);
            if (!cp.Data().isFromInspect)
                _InvokeCallback($.GetContextPanel());
        }
    }
    function _InvokeCallback(cp) {
        var callbackHandle = cp.GetAttributeInt("callback", -1);
        if (callbackHandle != -1) {
            UiToolkitAPI.InvokeJSCallback(callbackHandle, '');
        }
    }
    {
        $.RegisterEventHandler('ReadyForDisplay', $.GetContextPanel(), OnReadyForDisplay);
        $.RegisterEventHandler('UnreadyForDisplay', $.GetContextPanel(), OnUnreadyForDisplay);
        $.GetContextPanel().RegisterForReadyEvents(true);
        if ($.GetContextPanel().BReadyForDisplay()) {
            OnReadyForDisplay();
        }
    }
})(PopUpShoppingCartCheckout || (PopUpShoppingCartCheckout = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfc2hvcHBpbmdfY2FydF9jaGVja291dC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3BvcHVwcy9wb3B1cF9zaG9wcGluZ19jYXJ0X2NoZWNrb3V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFDckMsbURBQW1EO0FBQ25ELDhFQUE4RTtBQUM5RSw0RUFBNEU7QUFDNUUsZ0RBQWdEO0FBQ2hELGlEQUFpRDtBQUNqRCwyREFBMkQ7QUFDM0QsdURBQXVEO0FBQ3ZELDREQUE0RDtBQUU1RCxJQUFVLHlCQUF5QixDQXlwQmxDO0FBenBCRCxXQUFVLHlCQUF5QjtJQUcvQixTQUFTLE9BQU8sQ0FBK0IsRUFBTTtRQUVqRCxJQUFLLENBQUMsRUFBRTtZQUNKLEVBQUUsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFPLENBQUM7UUFFbEMsSUFBSSxJQUFJLEdBQUcsWUFBWSxDQUFDLElBQUksQ0FBQztRQUM3QixPQUFRLEVBQUUsRUFDVjtZQUNJLElBQUssRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDLGNBQWMsQ0FBRSxNQUFNLENBQUUsSUFBSSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxFQUN6RDtnQkFDSSxJQUFJLEdBQUcsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQztnQkFDdEIsTUFBTTthQUNUO1lBQ0QsRUFBRSxHQUFHLEVBQUUsQ0FBQyxTQUFTLEVBQU8sQ0FBQztTQUM1QjtRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFZRCxTQUFTLGlCQUFpQjtRQUV0QixJQUFLLENBQUMsWUFBWSxDQUFDLGVBQWUsRUFBRSxFQUMxQztZQUNVLFVBQVUsRUFBRSxDQUFDO1lBQ3RCLE9BQU87U0FDUDtRQUVLLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUcvQixDQUFDLENBQUMs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