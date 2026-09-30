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
    // This is the global cart, but can be set to a temp one-off cart (e.g. for Sounvenir checkout)
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
        $.Msg('PopUpShoppingCartCheckout(OnReadyForDisplay): ' + $.GetContextPanel().id);
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
        $.Msg('PopUpShoppingCartCheckout(UnReadyForDisplay): ' + $.GetContextPanel().id);
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
            if (cart) // use the one-off cart that we passed through the registry
             {
                cp.Data().cart = cart;
                ShoppingCart.releaseTempCart(strOneOffCartId);
            }
        }
        $.Msg('PopUpShoppingCartCheckout(Init): ' + $.GetContextPanel().id + ' ' + ((getCart(cp) !== ShoppingCart.cart) ? 'one-off' : 'global'));
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
        // Lock in total number of credits that the user has at the time cart is created, so "Accept" will try to spend exactly from this amount
        const idxLookup = InventoryAPI.GetCacheTypeElementIndexByKey('SeasonalOperations', g_ActiveTournamentInfo.credits_id);
        let nRedeemableBalance = 0;
        if (g_ActiveTournamentInfo.credits_id == InventoryAPI.GetCacheTypeElementFieldByIndex('SeasonalOperations', idxLookup, 'season_value')) {
            // This could come back "undefined" or "null" and should be treated as zero
            nRedeemableBalance = InventoryAPI.GetCacheTypeElementFieldByIndex('SeasonalOperations', idxLookup, 'redeemable_balance');
            nRedeemableBalance = (nRedeemableBalance === null || nRedeemableBalance === undefined) ? 0 : nRedeemableBalance;
        }
        cp.SetDialogVariableInt('balance', nRedeemableBalance);
        cp.Data().redeemableBalance = nRedeemableBalance;
    }
    function _SetupButtonsAndWarnings(cp) {
        const isInventoryFull = (m_numTotalEconItemsInInventory + getCart(cp).getTotalItems() > ItemInfo.NUM_BACKPACK_SLOTS);
        cp.FindChildInLayoutFile('id-cart-warning').visible = isInventoryFull;
        _AcknowledgeNewTokens(cp); // needs a wait to proceed
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
            cp.Data().activatedCredits = numInactiveTokens; // store this for when we activate the credits
            let nPurchaseTokens = getCart(cp).getTotalPrice() - (cp.Data().redeemableBalance + numInactiveTokens);
            // 100 is the smallest we sell.
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
                // Buy tokens
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
            $.Msg("  [Cart is completely empty]");
            getCart(cp).clearCart();
            UiToolkitAPI.ShowGenericPopupOk($.Localize('#major_store_checkout_cart_error'), $.Localize('#major_store_checkout_cart_error_desc'), '', () => $.DispatchEvent('HideContentPanel'));
            ClosePopup();
        }
        else {
            for (const item of items) {
                $.Msg(`Cart Entry: ${item.quantity}x ${InventoryAPI.GetItemName(item.id)} ($${item.price} each)`);
                for (let j = 0; j < item.quantity; ++j) {
                    let purchase_id = item.checkout_id || item.id;
                    szPurchaseItems = purchase_id + (szPurchaseItems ? ',' + szPurchaseItems : ''); // concat in reverse order, so purchased order in the inventory will match the cart list order
                }
            }
        }
        $.Msg(`Total Items: ${getCart(cp).getTotalItems()}`);
        $.Msg(`Total Price: $${getCart(cp).getTotalPrice()}`);
        cp.FindChildInLayoutFile('id-checkout-lister').Children().forEach(entry => {
            entry.FindChildInLayoutFile('id-cart-quantity-block').hittest = false;
            entry.FindChildInLayoutFile('id-cart-quantity-block').hittestchildren = false;
        });
        // Kick off async purchase job--
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
                    // An inspect popup is already open under us, so opening another would stack them.
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
                        // last seen prevents animation if the cart updates and we have already revealed the change
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
                // update the local balance to the new value at the end of the animation
                Init();
                cp.FindChildInLayoutFile('id-cart-add-tokens').SetHasClass('hidden', true);
                cp.FindChildInLayoutFile('id-cart-balance').TriggerClass('popup-major-store__top-bar__balance-anim');
                //_InvokeCallback( cp );
            }
            cp.FindChildInLayoutFile('id-cart-add-tokens').SetHasClass('hidden', false);
            AddMajorTokensAnim.StartAnim(cp.FindChildInLayoutFile('id-cart-add-tokens'), cp.FindChildInLayoutFile('id-cart-balance'), cp.Data().activatedCredits, CallAtEndAnimation);
            cp.Data().activatedCredits = 0; // reset incase panel is called again
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfc2hvcHBpbmdfY2FydF9jaGVja291dC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3BvcHVwcy9wb3B1cF9zaG9wcGluZ19jYXJ0X2NoZWNrb3V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFDckMsbURBQW1EO0FBQ25ELDhFQUE4RTtBQUM5RSw0RUFBNEU7QUFDNUUsZ0RBQWdEO0FBQ2hELGlEQUFpRDtBQUNqRCwyREFBMkQ7QUFDM0QsdURBQXVEO0FBQ3ZELDREQUE0RDtBQUU1RCxJQUFVLHlCQUF5QixDQXlwQmxDO0FBenBCRCxXQUFVLHlCQUF5QjtJQUUvQiwrRkFBK0Y7SUFDL0YsU0FBUyxPQUFPLENBQStCLEVBQU07UUFFakQsSUFBSyxDQUFDLEVBQUU7WUFDSixFQUFFLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBTyxDQUFDO1FBRWxDLElBQUksSUFBSSxHQUFHLFlBQVksQ0FBQyxJQUFJLENBQUM7UUFDN0IsT0FBUSxFQUFFLEVBQ1Y7WUFDSSxJQUFLLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxjQUFjLENBQUUsTUFBTSxDQUFFLElBQUksRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksRUFDekQ7Z0JBQ0ksSUFBSSxHQUFHLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUM7Z0JBQ3RCLE1BQU07YUFDVDtZQUNELEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUyxFQUFPLENBQUM7U0FDNUI7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBWUQsU0FBUyxpQkFBaUI7UUFFdEIsSUFBSyxDQUFDLFlBQVksQ0FBQyxlQUFlLEVBQUUsRUFDMUM7WUFDVSxVQUFVLEVBQUUsQ0FBQztZQUN0QixPQUFPO1NBQ1A7UUFFSyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDL0IsQ0FBQyxDQUFDLEdBQUcsQ0FBRSxnREFBZ0QsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsRUFBRSxDQUFFLENBQUM7UUFFbkYsQ0FBQyxDQUFDLHlCQUF5QixDQUFFLDJEQUEyRCxFQUFFLENBQUUsR0FBRyxJQUFJLEVBQUcsRUFBRSxHQUFHLDhCQUE4QixDQUFDLEdBQUcsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFBLENBQUUsQ0FBQyxDQUFDLENBQUM7UUFDM0osQ0FBQyxDQUFDLHlCQUF5QixDQUFFLDJDQUEyQyxFQUFFLENBQUMsR0FBRyxJQUFJLEVBQUUsRUFBRSxHQUFHLHFCQUFxQixDQUFDLEdBQUcsSUFBSSxFQUFFLEVBQUUsQ0FBRSxDQUFBLENBQUEsQ0FBQyxDQUFDLENBQUM7UUFDL0gsQ0FBQyxDQUFDLHlCQUF5QixDQUFFLGtEQUFrRCxFQUFFLElBQUksQ0FBRSxDQUFDO1FBRXhGLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxlQUFlLENBQUMsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLFVBQVUsQ0FBRSxDQUFDO1FBRXBGLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxpQkFBaUIsQ0FBRSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsRUFBRSxRQUFRLENBQUMsNkJBQTZCLENBQUUsRUFBRSxHQUFDLHNCQUFzQixDQUFDLGFBQWEsRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFFLENBQUMsQ0FBQztRQUMzSyxFQUFFLENBQUMscUJBQXFCLENBQUUsaUJBQWlCLENBQUUsQ0FBQyxhQUFhLENBQUUsYUFBYSxFQUFFLEdBQUUsRUFBRTtZQUM1RSxZQUFZLENBQUMsb0JBQW9CLENBQUUsaUJBQWlCLEVBQUUsdUJBQXVCLEdBQUUsc0JBQXNCLENBQUMsUUFBUSxHQUFDLFVBQVUsRUFBRSw4QkFBOEIsQ0FBRSxDQUFDO1FBQ2hLLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLHFCQUFxQixDQUFFLGlCQUFpQixDQUFFLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxHQUFFLEVBQUU7WUFDM0UsWUFBWSxDQUFDLG9CQUFvQixFQUFFLENBQUM7UUFDeEMsQ0FBQyxDQUFDLENBQUM7UUFFSCxrQkFBa0IsQ0FBQyxxQkFBcUIsQ0FBRSxFQUFFLENBQUMscUJBQXFCLENBQUUsb0JBQW9CLENBQUUsQ0FBQyxDQUFDO0lBQ2hHLENBQUM7SUFFRCxTQUFTLG1CQUFtQjtRQUV4QixDQUFDLENBQUMsR0FBRyxDQUFFLGdEQUFnRCxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxFQUFFLENBQUUsQ0FBQztJQUN2RixDQUFDO0lBRUQsSUFBSSw4QkFBOEIsR0FBRyxDQUFDLENBQUM7SUFFdkMsU0FBZ0IsSUFBSTtRQUVoQixJQUFLLENBQUMsWUFBWSxDQUFDLGVBQWUsRUFBRSxFQUMxQztZQUNVLFVBQVUsRUFBRSxDQUFDO1lBQ3RCLE9BQU87U0FDUDtRQUVLLFlBQVksQ0FBQywwQkFBMEIsQ0FBRSxjQUFjLEVBQUUsS0FBSyxFQUFFLGlCQUFpQixFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUUsQ0FBQztRQUM1Riw4QkFBOEIsR0FBRyxZQUFZLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUVsRSxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUM7UUFFL0IsTUFBTSxlQUFlLEdBQUcsRUFBRSxDQUFDLGtCQUFrQixDQUFFLFFBQVEsRUFBRSxFQUFFLENBQUUsQ0FBQztRQUM5RCxJQUFLLGVBQWUsRUFDcEI7WUFDSSxJQUFJLElBQUksR0FBRyxZQUFZLENBQUMsb0JBQW9CLENBQUUsZUFBZSxFQUFFLEtBQUssQ0FBRSxDQUFDO1lBQ3ZFLElBQUssSUFBSSxFQUFHLDJEQUEyRDthQUN2RTtnQkFDSSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztnQkFDdEIsWUFBWSxDQUFDLGVBQWUsQ0FBRSxlQUFlLENBQUUsQ0FBQzthQUNuRDtTQUNKO1FBRUQsQ0FBQyxDQUFDLEdBQUcsQ0FBRSxtQ0FBbUMsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsRUFBRSxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFFLEVBQUUsQ0FBRSxLQUFLLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQSxDQUFDLENBQUEsU0FBUyxDQUFBLENBQUMsQ0FBQSxRQUFRLENBQUMsQ0FBRSxDQUFDO1FBQ3pJLEVBQUUsQ0FBQyxXQUFXLENBQUUsc0JBQXNCLEVBQUUsT0FBTyxDQUFFLEVBQUUsQ0FBRSxLQUFLLFlBQVksQ0FBQyxJQUFJLENBQUUsQ0FBQztRQUU5RSxxQkFBcUIsQ0FBRSxFQUFFLENBQUUsQ0FBQztRQUU1QixPQUFPLENBQUUsRUFBRSxDQUFFLENBQUMsa0JBQWtCLENBQUUsRUFBRSxFQUFFLGNBQWMsRUFBRSxHQUFFLEVBQUU7WUFDdEQsd0JBQXdCLENBQUUsRUFBRSxDQUFFLENBQUM7UUFDbkMsQ0FBQyxDQUFDLENBQUM7UUFFSCxnQkFBZ0IsQ0FBRSxFQUFFLENBQUUsQ0FBQztRQUN2QixjQUFjLENBQUUsRUFBRSxDQUFFLENBQUM7UUFFckIsT0FBTyxDQUFFLEVBQUUsQ0FBRSxDQUFDLGtCQUFrQixDQUFFLEVBQUUsRUFBRSxhQUFhLEVBQUUsR0FBRSxFQUFFO1lBQ3JELEVBQUUsQ0FBQyxvQkFBb0IsQ0FBRSxhQUFhLEVBQUUsT0FBTyxDQUFFLEVBQUUsQ0FBRSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUM7UUFDM0UsQ0FBQyxDQUFDLENBQUM7UUFFSCxPQUFPLENBQUUsRUFBRSxDQUFFLENBQUMsa0JBQWtCLENBQUUsRUFBRSxFQUFFLGFBQWEsRUFBRSxHQUFFLEVBQUU7WUFDckQsRUFBRSxDQUFDLG9CQUFvQixDQUFFLGFBQWEsRUFBRSxPQUFPLENBQUUsRUFBRSxDQUFFLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQztRQUMzRSxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSx1QkFBdUIsQ0FBRSxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsR0FBRSxFQUFFO1lBQ2pGLE9BQU8sQ0FBRSxFQUFFLENBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUMxQixnQkFBZ0IsQ0FBRSxFQUFFLENBQUUsQ0FBQztZQUN2QixjQUFjLENBQUUsRUFBRSxDQUFFLENBQUM7UUFDekIsQ0FBQyxDQUFFLENBQUM7UUFFSixJQUFJLGVBQWUsQ0FBQyxzREFBc0QsRUFBRSxHQUFHLENBQUMsRUFDaEY7WUFDSSxlQUFlLENBQUMsdUJBQXVCLENBQUUsRUFBRSxDQUFFLENBQUM7U0FDakQ7SUFDTCxDQUFDO0lBdERlLDhCQUFJLE9Bc0RuQixDQUFBO0lBRUQsU0FBUyxxQkFBcUIsQ0FBRSxFQUFVO1FBRXRDLHdJQUF3STtRQUN4SSxNQUFNLFNBQVMsR0FBRyxZQUFZLENBQUMsNkJBQTZCLENBQUUsb0JBQW9CLEVBQUUsc0JBQXNCLENBQUMsVUFBVSxDQUFFLENBQUM7UUFDeEgsSUFBSSxrQkFBa0IsR0FBRyxDQUFDLENBQUM7UUFDM0IsSUFBSyxzQkFBc0IsQ0FBQyxVQUFVLElBQUksWUFBWSxDQUFDLCtCQUErQixDQUFFLG9CQUFvQixFQUFFLFNBQVMsRUFBRSxjQUFjLENBQUUsRUFDekk7WUFDSSwyRUFBMkU7WUFDM0Usa0JBQWtCLEdBQUcsWUFBWSxDQUFDLCtCQUErQixDQUFFLG9CQUFvQixFQUFFLFNBQVMsRUFBRSxvQkFBb0IsQ0FBRSxDQUFDO1lBQzNILGtCQUFrQixHQUFHLENBQUUsa0JBQWtCLEtBQUssSUFBSSxJQUFJLGtCQUFrQixLQUFLLFNBQVMsQ0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDO1NBQ3JIO1FBRUQsRUFBRSxDQUFDLG9CQUFvQixDQUFFLFNBQVMsRUFBRSxrQkFBa0IsQ0FBRSxDQUFDO1FBQ3pELEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxpQkFBaUIsR0FBRyxrQkFBa0IsQ0FBQztJQUNyRCxDQUFDO0lBRUQsU0FBUyx3QkFBd0IsQ0FBRSxFQUFVO1FBRXpDLE1BQU0sZUFBZSxHQUFHLENBQUUsOEJBQThCLEdBQUcsT0FBTyxDQUFFLEVBQUUsQ0FBRSxDQUFDLGFBQWEsRUFBRSxHQUFHLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBRSxDQUFDO1FBQ3pILEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxpQkFBaUIsQ0FBRSxDQUFDLE9BQU8sR0FBRyxlQUFlLENBQUM7UUFFeEUscUJBQXFCLENBQUUsRUFBRSxDQUFFLENBQUMsQ0FBQSwwQkFBMEI7UUFFdEQsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxFQUFFLEVBQUUsR0FBRSxFQUFFO1lBQ2hCLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztZQUNoQixJQUFJLGlCQUFpQixHQUFHLENBQUMsQ0FBQztZQUUxQixJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxFQUN4QjtnQkFDSSxPQUFPO2FBQ1Y7WUFFRCxZQUFZLENBQUMsMEJBQTBCLENBQUUsY0FBYyxFQUFFLEtBQUssRUFBRSx1REFBdUQsR0FBRSxzQkFBc0IsQ0FBQyxVQUFVLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBRSxDQUFDO1lBRXJLLElBQUksWUFBWSxDQUFDLGlCQUFpQixFQUFFLEdBQUcsQ0FBQyxFQUN4QztnQkFDSSxNQUFNLEdBQUcsWUFBWSxDQUFDLHlCQUF5QixDQUFFLENBQUMsQ0FBRSxDQUFDO2dCQUNyRCxpQkFBaUIsR0FBRyxNQUFNLENBQUUsWUFBWSxDQUFDLHFCQUFxQixDQUFFLE1BQU0sRUFBRSx1QkFBdUIsQ0FBRSxDQUFDLENBQUM7YUFDdEc7WUFFRCxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsZ0JBQWdCLEdBQUcsaUJBQWlCLENBQUMsQ0FBQSw4Q0FBOEM7WUFDN0YsSUFBSSxlQUFlLEdBQUcsT0FBTyxDQUFFLEVBQUUsQ0FBRSxDQUFDLGFBQWEsRUFBRSxHQUFHLENBQUUsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDLGlCQUFpQixHQUFHLGlCQUFpQixDQUFFLENBQUM7WUFFMUcsK0JBQStCO1lBQy9CLE1BQU0sbUNBQW1DLEdBQUcsZUFBZSxDQUFDO1lBQzVELGVBQWUsR0FBRyxlQUFlLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFFLGVBQWUsRUFBRSxHQUFHLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRTdFLE1BQU0sYUFBYSxHQUFHLE9BQU8sQ0FBRSxFQUFFLENBQUUsQ0FBQyxhQUFhLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsaUJBQWlCLENBQUM7WUFFbEYsRUFBRSxDQUFDLG9CQUFvQixDQUFFLGVBQWUsRUFBRSxhQUFhLENBQUUsQ0FBQztZQUMxRCxFQUFFLENBQUMsb0JBQW9CLENBQUUsaUJBQWlCLEVBQUUsaUJBQWlCLENBQUUsQ0FBQztZQUNoRSxFQUFFLENBQUMsb0JBQW9CLENBQUUsaUJBQWlCLEVBQUUsZUFBZSxDQUFFLENBQUM7WUFDOUQsRUFBRSxDQUFDLHFCQUFxQixDQUFFLDJCQUEyQixDQUFFLENBQUMsV0FBVyxDQUFFLE1BQU0sRUFBRSxhQUFhLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxJQUFJLE9BQU8sQ0FBRSxFQUFFLENBQUUsQ0FBQyxhQUFhLEVBQUUsR0FBRyxDQUFDLENBQUUsQ0FBQztZQUUzSixJQUFJLFNBQVMsR0FBOEI7Z0JBQ3ZDLEVBQUUsRUFBRSxFQUFFO2dCQUNOLGVBQWUsRUFBRSxpQkFBaUI7Z0JBQ2xDLGVBQWUsRUFBRyxlQUFlO2dCQUNqQyxtQ0FBbUMsRUFBRSxtQ0FBbUM7Z0JBQ3hFLGFBQWEsRUFBRSxhQUFhO2dCQUM1QixlQUFlLEVBQUUsZUFBZTtnQkFDaEMsTUFBTSxFQUFFLE1BQU07YUFDakIsQ0FBQTtZQUVELGlDQUFpQyxDQUFFLFNBQVMsQ0FBRSxDQUFDO1lBQy9DLG1DQUFtQyxDQUFFLFNBQVMsQ0FBRSxDQUFDO1lBQ2pELCtCQUErQixDQUFFLFNBQVMsQ0FBRSxDQUFDO1FBRWpELENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVELFNBQVMsaUNBQWlDLENBQUUsU0FBb0M7UUFFNUUsSUFBSSxpQkFBaUIsR0FBRyxTQUFTLENBQUMsRUFBRSxDQUFDLHFCQUFxQixDQUFDLGdDQUFnQyxDQUFDLENBQUM7UUFFN0YsTUFBTSxRQUFRLEdBQUcsU0FBUyxDQUFDLGVBQWUsR0FBRyxDQUFDO1lBQzFDLENBQUUsU0FBUyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxpQkFBaUIsR0FBRyxPQUFPLENBQUUsU0FBUyxDQUFDLEVBQUUsQ0FBRSxDQUFDLGFBQWEsRUFBRSxDQUFFLENBQUE7UUFDbkYsQ0FBQyxTQUFTLENBQUMsZUFBZTtZQUMxQixPQUFPLENBQUUsU0FBUyxDQUFDLEVBQUUsQ0FBRSxDQUFDLGFBQWEsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUVoRCxNQUFNLEtBQUssR0FBRyxDQUFFLE9BQU8sQ0FBRSxTQUFTLENBQUMsRUFBRSxDQUFFLENBQUMsYUFBYSxFQUFFLEdBQUcsQ0FBQyxDQUFFLElBQUksQ0FBRSxTQUFTLENBQUMsZUFBZSxHQUFHLENBQUMsSUFBSSxTQUFTLENBQUMsZUFBZSxHQUFHLENBQUMsQ0FBRSxDQUFDO1FBQ3BJLGlCQUFpQixDQUFDLFdBQVcsQ0FBRSxNQUFNLEVBQUUsS0FBSyxDQUFFLENBQUM7UUFFL0MsSUFBSSxLQUFLO1lBQ0wsT0FBTztRQUVYLE1BQU0saUJBQWlCLEdBQUcsU0FBUyxDQUFDLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO1FBRS9GLElBQUksU0FBUyxDQUFDLGVBQWUsR0FBRyxDQUFDLElBQUksU0FBUyxDQUFDLGVBQWUsR0FBRyxDQUFDLEVBQ2xFO1lBQ0ksU0FBUyxDQUFDLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSx3QkFBd0IsQ0FBRSxDQUFDLGVBQWUsQ0FBRSxpQkFBaUIsRUFBRSxpQkFBaUIsQ0FBRSxDQUFDO1lBQ3ZILGlCQUFpQixDQUFDLHFCQUFxQixDQUFFLGtCQUFrQixDQUFFLENBQUMsV0FBVyxDQUFFLGVBQWUsRUFBRSxJQUFJLENBQUUsQ0FBQztZQUNuRyxpQkFBaUIsQ0FBQyxxQkFBcUIsQ0FBRSxrQkFBa0IsQ0FBRSxDQUFDLFdBQVcsQ0FBRSxlQUFlLEVBQUUsS0FBSyxDQUFFLENBQUM7U0FDdkc7YUFFRDtZQUNJLGlCQUFpQixDQUFDLHFCQUFxQixDQUFFLGtCQUFrQixDQUFFLENBQUMsV0FBVyxDQUFFLGVBQWUsRUFBRSxLQUFLLENBQUUsQ0FBQztZQUNwRyxpQkFBaUIsQ0FBQyxxQkFBcUIsQ0FBRSxrQkFBa0IsQ0FBRSxDQUFDLFdBQVcsQ0FBRSxlQUFlLEVBQUUsSUFBSSxDQUFFLENBQUM7WUFDbkcsU0FBUyxDQUFDLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSx3QkFBd0IsQ0FBRSxDQUFDLGNBQWMsQ0FBRSxpQkFBaUIsRUFBRyxpQkFBaUIsQ0FBRSxDQUFDO1NBRTFIO1FBRUQsTUFBTSxLQUFLLEdBQUcsaUJBQWlCLENBQUMscUJBQXFCLENBQUUsNkJBQTZCLENBQWtCLENBQUM7UUFDdkcsTUFBTSxXQUFXLEdBQWlDO1lBQzlDLEdBQUcsRUFBRSxLQUFLO1lBQ1YsT0FBTyxFQUFFLCtDQUErQztZQUN4RCxTQUFTLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxvQ0FBb0MsQ0FBQztZQUM1RCxZQUFZLEVBQUUsMEJBQTBCO1lBQ3hDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtnQkFFdEIsWUFBWSxDQUFDLE9BQU8sQ0FBRSxTQUFTLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBRSxDQUFDO2dCQUM3QyxLQUFLLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztnQkFFdEIsbUJBQW1CLENBQUUsU0FBUyxDQUFDLEVBQUUsRUFBRSxpQkFBaUIsQ0FBRSxDQUFDO1lBQzNELENBQUM7U0FDSixDQUFDO1FBRUYsVUFBVSxDQUFDLFdBQVcsQ0FBRSxXQUFXLENBQUUsQ0FBQztRQUN0QyxLQUFLLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQztRQUN6QixpQkFBaUIsQ0FBQyxXQUFXLENBQUUsUUFBUSxFQUFFLFFBQVEsQ0FBRSxDQUFDO0lBQ3hELENBQUM7SUFFRCxTQUFTLG1DQUFtQyxDQUFFLFNBQW9DO1FBRTlFLE1BQU0saUJBQWlCLEdBQUcsU0FBUyxDQUFDLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO1FBQy9GLE1BQU0sUUFBUSxHQUFHLFNBQVMsQ0FBQyxlQUFlLElBQUksQ0FBQyxJQUFJLFNBQVMsQ0FBQyxlQUFlLEdBQUcsQ0FBQztZQUM1RSxDQUFDLFNBQVMsQ0FBQyxlQUFlO1lBQzFCLE9BQU8sQ0FBRSxTQUFTLENBQUMsRUFBRSxDQUFFLENBQUMsYUFBYSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBRWhELE1BQU0sS0FBSyxHQUFHLENBQUUsU0FBUyxDQUFDLGVBQWUsSUFBSSxDQUFDLElBQUksT0FBTyxDQUFFLFNBQVMsQ0FBQyxFQUFFLENBQUUsQ0FBQyxhQUFhLEVBQUUsR0FBRyxDQUFDLENBQUUsQ0FBQztRQUNoRyxpQkFBaUIsQ0FBQyxXQUFXLENBQUUsTUFBTSxFQUFFLEtBQUssQ0FBRSxDQUFDO1FBRS9DLElBQUksS0FBSztZQUNMLE9BQU87UUFFWCxNQUFNLEtBQUssR0FBRyxpQkFBaUIsQ0FBQyxxQkFBcUIsQ0FBRSx3QkFBd0IsQ0FBa0IsQ0FBQztRQUNsRyxLQUFLLENBQUMsaUJBQWlCLENBQUUsWUFBWSxFQUFFLFFBQVEsQ0FBQyw2QkFBNkIsQ0FBRSxFQUFFLEdBQUMsc0JBQXNCLENBQUMsYUFBYSxFQUFFLFNBQVMsQ0FBQyxlQUFlLEVBQUUsRUFBRSxDQUFFLENBQUMsQ0FBQztRQUN6SixNQUFNLFdBQVcsR0FBaUM7WUFDOUMsR0FBRyxFQUFFLEtBQUs7WUFDVixPQUFPLEVBQUUsK0NBQStDLEdBQUcsQ0FBRSxDQUFFLFNBQVMsQ0FBQyxtQ0FBbUMsR0FBRyxHQUFHLENBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUU7WUFDbkksU0FBUyxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUUsb0NBQW9DLEVBQUUsS0FBSyxDQUFFO1lBQ3BFLFlBQVksRUFBRSwwQkFBMEI7WUFDeEMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO2dCQUV0QixhQUFhO2dCQUNiLEtBQUssQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO2dCQUN0QixRQUFRLENBQUMsaUJBQWlCLENBQUUsRUFBRSxHQUFDLHNCQUFzQixDQUFDLGFBQWEsR0FBSSxHQUFHLEdBQUUsU0FBUyxDQUFDLGVBQWUsR0FBRSxHQUFHLENBQUMsQ0FBQztnQkFDNUcsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxxQkFBcUIsRUFBRSw2QkFBNkIsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNuRixDQUFDO1NBQ0osQ0FBQztRQUVGLEtBQUssQ0FBQyxPQUFPLEdBQUcsUUFBUSxDQUFDO1FBRXpCLFVBQVUsQ0FBQyxXQUFXLENBQUUsV0FBVyxDQUFFLENBQUM7UUFDdEMsS0FBSyxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUM7UUFDekIsaUJBQWlCLENBQUMsV0FBVyxDQUFFLFFBQVEsRUFBRSxRQUFRLENBQUUsQ0FBQztJQUN4RCxDQUFDO0lBRUQsU0FBUywrQkFBK0IsQ0FBRSxTQUFvQztRQUUxRSxNQUFNLGlCQUFpQixHQUFHLFNBQVMsQ0FBQyxFQUFFLENBQUMscUJBQXFCLENBQUMsa0NBQWtDLENBQUMsQ0FBQztRQUVqRyxNQUFNLEtBQUssR0FBRyxDQUFFLE9BQU8sQ0FBRSxTQUFTLENBQUMsRUFBRSxDQUFFLENBQUMsYUFBYSxFQUFFLEdBQUcsQ0FBQyxDQUFFLENBQUM7UUFDOUQsaUJBQWlCLENBQUMsV0FBVyxDQUFFLE1BQU0sRUFBRSxLQUFLLENBQUUsQ0FBQztRQUUvQyxJQUFJLEtBQUs7WUFDTCxPQUFPO1FBRVgsTUFBTSxRQUFRLEdBQUUsQ0FBQyxTQUFTLENBQUMsZUFBZTtZQUN0QyxPQUFPLENBQUUsU0FBUyxDQUFDLEVBQUUsQ0FBRSxDQUFDLGFBQWEsRUFBRSxHQUFHLENBQUM7WUFDM0MsU0FBUyxDQUFDLGVBQWUsSUFBSSxDQUFDO1lBQzlCLENBQUUsU0FBUyxDQUFDLGVBQWUsSUFBSSxDQUFDLElBQUksU0FBUyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxpQkFBaUIsSUFBSSxPQUFPLENBQUUsU0FBUyxDQUFDLEVBQUUsQ0FBRSxDQUFDLGFBQWEsRUFBRSxDQUFFLENBQUM7UUFFM0gsTUFBTSxLQUFLLEdBQUcsaUJBQWlCLENBQUMscUJBQXFCLENBQUUsd0JBQXdCLENBQWtCLENBQUM7UUFDbEcsTUFBTSxpQkFBaUIsR0FBRyxTQUFTLENBQUMsRUFBRSxDQUFDLGtCQUFrQixDQUFFLGdCQUFnQixFQUFFLEVBQUUsQ0FBRSxJQUFJLEVBQUUsQ0FBQztRQUV4RixNQUFNLGFBQWEsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFFLHNDQUFzQyxHQUFHLGlCQUFpQixDQUFFLENBQUM7UUFDL0YsS0FBSyxDQUFDLElBQUksR0FBRyxhQUFhLENBQUM7UUFDM0IsTUFBTSxXQUFXLEdBQWlDO1lBQzlDLEdBQUcsRUFBRSxLQUFLO1lBQ1YsT0FBTyxFQUFFLDBDQUEwQyxHQUFHLGlCQUFpQjtZQUN2RSxTQUFTLEVBQUUsYUFBYTtZQUN4QixZQUFZLEVBQUUsMEJBQTBCO1lBQ3hDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtnQkFFdEIsWUFBWSxDQUFDLDBCQUEwQixDQUFFLGNBQWMsRUFBRSxLQUFLLEVBQUUsaUJBQWlCLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBRSxDQUFDO2dCQUM1RixJQUFLLFlBQVksQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLE9BQU8sQ0FBRSxTQUFTLENBQUMsRUFBRSxDQUFFLENBQUMsYUFBYSxFQUFFLEdBQUcsUUFBUSxDQUFDLGtCQUFrQixFQUFHO29CQUM1RyxZQUFZLENBQUMsa0JBQWtCLENBQzNCLENBQUMsQ0FBQyxRQUFRLENBQUUsMkNBQTJDLENBQUUsRUFDekQsQ0FBQyxDQUFDLFFBQVEsQ0FBRSwyQkFBMkIsQ0FBRSxFQUN6QyxFQUFFLEVBQ0YsR0FBRyxFQUFFLEdBQUUsQ0FBQyxDQUNYLENBQUM7b0JBQ0YsT0FBTztpQkFDVjtnQkFFRCxTQUFTLENBQUUsU0FBUyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxpQkFBaUIsRUFBRSxPQUFPLENBQUUsU0FBUyxDQUFDLEVBQUUsQ0FBRSxDQUFDLGFBQWEsRUFBRSxFQUFFLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQTtnQkFDeEcsS0FBSyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7Z0JBQ3RCLFNBQVMsQ0FBQyxFQUFFLENBQUMscUJBQXFCLENBQUMsZUFBZSxDQUFDLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztnQkFDcEUsbUJBQW1CLENBQUUsU0FBUyxDQUFDLEVBQUUsRUFBRSxpQkFBaUIsQ0FBRSxDQUFDO1lBQzNELENBQUM7U0FDSixDQUFDO1FBRUYsVUFBVSxDQUFDLFdBQVcsQ0FBRSxXQUFXLENBQUUsQ0FBQztRQUN0QyxLQUFLLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQztRQUN6QixpQkFBaUIsQ0FBQyxXQUFXLENBQUUsUUFBUSxFQUFFLFFBQVEsQ0FBRSxDQUFDO0lBQ3hELENBQUM7SUFFRCxTQUFTLGdCQUFnQixDQUFFLEVBQVc7UUFFbEMsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFFLEVBQUUsQ0FBRSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ3ZDLEVBQUUsQ0FBQyxXQUFXLENBQUUsWUFBWSxFQUFFLEtBQUssQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFFLENBQUM7SUFDdEQsQ0FBQztJQUVELFNBQWdCLFVBQVU7UUFFdEIsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxzQkFBc0IsRUFBRSxFQUFFLENBQUUsQ0FBQztRQUM5QyxDQUFDLENBQUMsYUFBYSxDQUFFLGtCQUFrQixFQUFFLEVBQUUsQ0FBRSxDQUFDO1FBQzFDLFlBQVksQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUMvQixZQUFZLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztRQUNwQyxlQUFlLENBQUMsd0JBQXdCLENBQUUsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFFLENBQUM7SUFDcEUsQ0FBQztJQVBlLG9DQUFVLGFBT3pCLENBQUE7SUFFRCxTQUFTLFNBQVMsQ0FBRSxZQUFvQixFQUFFLFVBQWtCLEVBQUUsRUFBVTtRQUVwRSxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUUsRUFBRSxDQUFFLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDdkMsSUFBSSxlQUFlLEdBQVcsRUFBRSxDQUFDO1FBRWpDLElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQ3RCO1lBQ0ksQ0FBQyxDQUFDLEdBQUcsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO1lBQ3RDLE9BQU8sQ0FBRSxFQUFFLENBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUUxQixZQUFZLENBQUMsa0JBQWtCLENBQzNCLENBQUMsQ0FBQyxRQUFRLENBQUUsa0NBQWtDLENBQUUsRUFDaEQsQ0FBQyxDQUFDLFFBQVEsQ0FBRSx1Q0FBdUMsQ0FBRSxFQUNyRCxFQUFFLEVBQ0YsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxrQkFBa0IsQ0FBRSxDQUM5QyxDQUFDO1lBRUYsVUFBVSxFQUFFLENBQUM7U0FDaEI7YUFFRDtZQUNJLEtBQUssTUFBTSxJQUFJLElBQUksS0FBSyxFQUFFO2dCQUN0QixDQUFDLENBQUMsR0FBRyxDQUFDLGVBQWUsSUFBSSxDQUFDLFFBQVEsS0FBSyxZQUFZLENBQUMsV0FBVyxDQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsTUFBTSxJQUFJLENBQUMsS0FBSyxRQUFRLENBQUMsQ0FBQztnQkFDbkcsS0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsRUFBRyxDQUFDLEVBQ3hDO29CQUNJLElBQUksV0FBVyxHQUFHLElBQUksQ0FBQyxXQUFXLElBQUksSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDOUMsZUFBZSxHQUFHLFdBQVcsR0FBRyxDQUFFLGVBQWUsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLGVBQWUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFFLENBQUMsQ0FBQyw4RkFBOEY7aUJBQ25MO2FBQ0o7U0FDSjtRQUVELENBQUMsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLE9BQU8sQ0FBRSxFQUFFLENBQUcsQ0FBQyxhQUFhLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDeEQsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsT0FBTyxDQUFFLEVBQUUsQ0FBRSxDQUFDLGFBQWEsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUV4RCxFQUFFLENBQUMscUJBQXFCLENBQUUsb0JBQW9CLENBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLEVBQUU7WUFDekUsS0FBSyxDQUFDLHFCQUFxQixDQUFDLHdCQUF3QixDQUFDLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztZQUN0RSxLQUFLLENBQUMscUJBQXFCLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxlQUFlLEdBQUcsS0FBSyxDQUFDO1FBQ2xGLENBQUMsQ0FBQyxDQUFBO1FBRUYsZ0NBQWdDO1FBQ2hDLFdBQVcsQ0FBQywyQkFBMkIsQ0FBRSxzQkFBc0IsQ0FBQyxVQUFVLEVBQUUsWUFBWSxFQUFFLFVBQVUsRUFBRSxlQUFlLENBQUUsQ0FBQztJQUM1SCxDQUFDO0lBRUQsU0FBUyxjQUFjLENBQUUsRUFBVTtRQUUvQixNQUFNLFFBQVEsR0FBRyxFQUFFLENBQUMscUJBQXFCLENBQUUsb0JBQW9CLENBQUUsQ0FBQztRQUVsRSxNQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUUsRUFBRSxDQUFFLENBQUMsUUFBUSxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdkUsTUFBTSxlQUFlLEdBQUcsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDLE1BQU0sQ0FBRSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBRSxJQUFJLENBQUMsRUFBRSxDQUFFLENBQUMsQ0FBQztRQUVyRixlQUFlLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxFQUFFO1lBRTVCLElBQUksQ0FBQyxRQUFRLENBQUUsaUJBQWlCLENBQUUsQ0FBQztRQUN2QyxDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sQ0FBRSxFQUFFLENBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLEVBQUU7WUFDckMsSUFBSSxNQUFNLEdBQUcsUUFBUSxDQUFDLHFCQUFxQixDQUFFLElBQUksQ0FBQyxFQUFFLENBQUUsQ0FBQztZQUN2RCxJQUFLLENBQUMsTUFBTSxFQUNaO2dCQUNJLE1BQU0sR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBRSxDQUFBO2dCQUNwRCxNQUFNLENBQUMsa0JBQWtCLENBQUUsV0FBVyxDQUFFLENBQUM7Z0JBRXpDLE1BQU0sU0FBUyxHQUFLLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBRSxvQkFBb0IsQ0FBbUIsQ0FBQztnQkFDMUYsU0FBUyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUUzQixTQUFTLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxHQUFFLEVBQUU7b0JBRXZDLElBQUksT0FBTyxDQUFFLEVBQUUsQ0FBRSxLQUFLLFlBQVksQ0FBQyxJQUFJO3dCQUNuQyxPQUFPO29CQUVYLGtGQUFrRjtvQkFDbEYsSUFBSSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsYUFBYSxFQUMzQjt3QkFDSSxPQUFPO3FCQUNWO29CQUVELE1BQU0sT0FBTyxHQUFHLFlBQVksQ0FBQyxxQkFBcUIsQ0FDOUMsRUFBRSxFQUNGLDhEQUE4RCxDQUNqRSxDQUFDO29CQUVGLElBQUksU0FBUyxHQUEwQjt3QkFDbkMsT0FBTyxFQUFFLElBQUksQ0FBQyxFQUFFO3dCQUNoQixZQUFZLEVBQUUsSUFBSTt3QkFDbEIscUJBQXFCLEVBQUUsSUFBSTt3QkFDM0IsZUFBZSxFQUFFLElBQUksQ0FBQyxLQUFLO3dCQUMzQixnQkFBZ0IsRUFBRSxJQUFJO3FCQUN6QixDQUFBO29CQUVELE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO2dCQUN6QyxDQUFDLENBQUMsQ0FBQztnQkFFSCxJQUFJLE9BQU8sR0FBRyxRQUFRLENBQUMsZ0JBQWdCLENBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBRSxDQUFDO2dCQUNuRCxPQUFPLENBQUMsVUFBVSxDQUFFLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBRSxtQkFBbUIsQ0FBYSxDQUFFLENBQUM7Z0JBRXJGLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsR0FBRSxFQUFFO29CQUMxRixPQUFPLENBQUUsRUFBRSxDQUFFLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBRSxDQUFDO29CQUU5QixNQUFNLFlBQVksR0FBRyxPQUFPLENBQUUsRUFBRSxDQUFFLENBQUMsZUFBZSxDQUFFLElBQUksQ0FBQyxFQUFFLENBQUUsQ0FBQztvQkFDOUQsTUFBTSxDQUFDLG9CQUFvQixDQUFFLE9BQU8sRUFBRSxZQUFZLENBQUUsQ0FBQztvQkFDckQsTUFBTSxhQUFhLEdBQUcsT0FBTyxDQUFFLEVBQUUsQ0FBRSxDQUFDLGdCQUFnQixDQUFFLElBQUksQ0FBQyxFQUFFLENBQUUsQ0FBQztvQkFDaEUsTUFBTSxDQUFDLG9CQUFvQixDQUFFLE9BQU8sRUFBRSxhQUFhLENBQUUsQ0FBQztvQkFFdEQsSUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBRSxJQUFJLENBQUMsRUFBRSxDQUFFLElBQUksRUFBRSxJQUFLLFlBQVksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLElBQUksR0FBRyxFQUNuRzt3QkFDSSxDQUFDLENBQUMsYUFBYSxDQUFFLHFCQUFxQixFQUFFLDRCQUE0QixFQUFFLE9BQU8sQ0FBRSxDQUFDO3dCQUNoRixPQUFPO3FCQUNWO29CQUNELENBQUMsQ0FBQyxhQUFhLENBQUUscUJBQXFCLEVBQUUsaUNBQWlDLEVBQUUsT0FBTyxDQUFFLENBQUM7Z0JBQ3pGLENBQUMsQ0FBQyxDQUFDO2dCQUVILE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsR0FBRSxFQUFFO29CQUMvRixPQUFPLENBQUUsRUFBRSxDQUFFLENBQUMsYUFBYSxDQUFFLElBQUksQ0FBQyxFQUFFLENBQUUsQ0FBQztvQkFFdkMsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFFLEVBQUUsQ0FBRSxDQUFDLGVBQWUsQ0FBRSxJQUFJLENBQUMsRUFBRSxDQUFFLENBQUM7b0JBQzlELE1BQU0sYUFBYSxHQUFHLE9BQU8sQ0FBRSxFQUFFLENBQUUsQ0FBQyxnQkFBZ0IsQ0FBRSxJQUFJLENBQUMsRUFBRSxDQUFFLENBQUM7b0JBQ2hFLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBRSxPQUFPLEVBQUUsYUFBYSxDQUFFLENBQUM7b0JBQ3RELE1BQU0sQ0FBQyxvQkFBb0IsQ0FBRSxPQUFPLEVBQUUsWUFBWSxDQUFFLENBQUM7b0JBRXJELENBQUMsQ0FBQyxhQUFhLENBQUUscUJBQXFCLEVBQUUsaUNBQWlDLEVBQUUsT0FBTyxDQUFFLENBQUM7Z0JBQ3pGLENBQUMsQ0FBQyxDQUFDO2dCQUVILE1BQU0sQ0FBQyxxQkFBcUIsQ0FBRSx3QkFBd0IsQ0FBRSxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsR0FBRSxFQUFFO29CQUN0RixPQUFPLENBQUUsRUFBRSxDQUFFLENBQUMsVUFBVSxDQUFFLElBQUksQ0FBQyxFQUFFLENBQUUsQ0FBQztvQkFDcEMsZ0JBQWdCLENBQUUsRUFBRSxDQUFFLENBQUM7b0JBQ3ZCLGNBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDbkIsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxxQkFBcUIsRUFBRSxjQUFjLEVBQUUsT0FBTyxDQUFFLENBQUM7Z0JBQ3RFLENBQUMsQ0FBQyxDQUFDO2dCQUVILElBQUksY0FBYyxHQUFHLElBQUksQ0FBQztnQkFDMUIsSUFBSSxhQUE0QixDQUFDO2dCQUNqQyxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMscUJBQXFCLENBQUUsMkJBQTJCLENBQWEsQ0FBQztnQkFFeEYsT0FBTyxDQUFFLEVBQUUsQ0FBRSxDQUFDLGtCQUFrQixDQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsR0FBRSxFQUFFO29CQUV2RCxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssU0FBUyxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssSUFBSSxDQUFDLEtBQUssRUFDL0Q7d0JBQ0ksTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO3dCQUMvQyxNQUFNLENBQUMsb0JBQW9CLENBQUUsY0FBYyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUUsV0FBVyxHQUFHLE9BQU8sQ0FBRSxFQUFFLENBQUUsQ0FBQyxlQUFlLENBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBRSxDQUFDLENBQUMsQ0FBQzt3QkFDaEgsUUFBUSxDQUFDLFdBQVcsQ0FBRSxhQUFhLEVBQUUsS0FBSyxDQUFFLENBQUM7d0JBQzdDLFFBQVEsQ0FBQyxXQUFXLENBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUUsQ0FBQzt3QkFFckYsMkZBQTJGO3dCQUMzRixJQUFJLGNBQWMsSUFBSSxhQUFhLElBQUksSUFBSSxDQUFDLEtBQUssRUFDakQ7NEJBQ0ksUUFBUSxDQUFDLFdBQVcsQ0FBRSxhQUFhLEVBQUUsSUFBSSxDQUFFLENBQUM7eUJBQy9DOzZCQUVEOzRCQUNJLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBRSw0QkFBNEIsQ0FBRSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7NEJBRTVFLENBQUMsQ0FBQyxRQUFRLENBQUUsQ0FBQyxFQUFFLEdBQUUsRUFBRTtnQ0FDWCxNQUFNLENBQUMscUJBQXFCLENBQUUsNEJBQTRCLENBQUUsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO2dDQUM3RSxRQUFRLENBQUMsV0FBVyxDQUFFLGFBQWEsRUFBRSxJQUFJLENBQUUsQ0FBQzs0QkFDaEQsQ0FBQyxDQUFDLENBQUM7eUJBQ1Y7cUJBQ0o7O3dCQUVHLFFBQVEsQ0FBQyxXQUFXLENBQUUsYUFBYSxFQUFFLEtBQUssQ0FBRSxDQUFDO29CQUVqRCxNQUFNLGFBQWEsR0FBRyxPQUFPLENBQUUsRUFBRSxDQUFFLENBQUMsZ0JBQWdCLENBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBRSxDQUFDO29CQUNoRSxNQUFNLFlBQVksR0FBRyxPQUFPLENBQUUsRUFBRSxDQUFFLENBQUMsZUFBZSxDQUFFLElBQUksQ0FBQyxFQUFFLENBQUUsQ0FBQztvQkFDOUQsTUFBTSxDQUFDLG9CQUFvQixDQUFFLE9BQU8sRUFBRSxhQUFhLENBQUMsQ0FBQztvQkFFckQsYUFBYSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7b0JBQzNCLGNBQWMsR0FBRyxLQUFLLENBQUM7Z0JBQzNCLENBQUMsQ0FBQyxDQUFDO2dCQUVILENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyx1QkFBdUIsRUFBRSxNQUFNLEVBQUUsVUFBVSxTQUFTLEVBQUUsWUFBWTtvQkFDckYsSUFBSyxZQUFZLEtBQUssU0FBUyxFQUFHO3dCQUU5QixJQUFLLE1BQU0sQ0FBQyxPQUFPLEtBQUssSUFBSSxJQUFJLE1BQU0sQ0FBQyxjQUFjLEVBQUUsRUFBRzs0QkFDdEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQzt5QkFDekI7cUJBQ0o7Z0JBQ0wsQ0FBQyxDQUFDLENBQUM7YUFDTjtZQUVELE1BQU0sYUFBYSxHQUFHLE9BQU8sQ0FBRSxFQUFFLENBQUUsQ0FBQyxnQkFBZ0IsQ0FBRSxJQUFJLENBQUMsRUFBRSxDQUFFLENBQUM7WUFDaEUsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFFLEVBQUUsQ0FBRSxDQUFDLGVBQWUsQ0FBRSxJQUFJLENBQUMsRUFBRSxDQUFFLENBQUM7WUFDOUQsTUFBTSxDQUFDLG9CQUFvQixDQUFFLE9BQU8sRUFBRSxPQUFPLENBQUUsRUFBRSxDQUFFLENBQUMsZUFBZSxDQUFFLElBQUksQ0FBQyxFQUFFLENBQUUsQ0FBRSxDQUFDO1lBQ2pGLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBRSxPQUFPLEVBQUUsT0FBTyxDQUFFLEVBQUUsQ0FBRSxDQUFDLGdCQUFnQixDQUFFLElBQUksQ0FBQyxFQUFFLENBQUUsQ0FBRSxDQUFDO1FBQ3RGLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVELFNBQVMsbUJBQW1CLENBQUUsRUFBVSxFQUFFLGlCQUEwQjtRQUVoRSxzQkFBc0IsQ0FBRSxFQUFFLENBQUUsQ0FBQztRQUM3QixpQkFBaUIsQ0FBQyxXQUFXLENBQUUsY0FBYyxFQUFHLElBQUksQ0FBRSxDQUFDO1FBRXZELEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxtQkFBbUIsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFFLENBQUMsRUFBRSxHQUFFLEVBQUU7WUFDL0MsWUFBWSxDQUFDLGtCQUFrQixDQUMzQixDQUFDLENBQUMsUUFBUSxDQUFFLGlDQUFpQyxDQUFFLEVBQy9DLENBQUMsQ0FBQyxRQUFRLENBQUUsa0NBQWtDLENBQUUsRUFDaEQsRUFBRSxFQUNGLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUUsa0JBQWtCLENBQUUsQ0FDOUMsQ0FBQztZQUVGLFVBQVUsRUFBRSxDQUFDO1FBQ2pCLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVELFNBQVMsc0JBQXNCLENBQUUsRUFBVTtRQUV2QyxJQUFJLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxtQkFBbUIsRUFDakM7WUFDSSxDQUFDLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBRSxDQUFDO1lBQ2xELEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUM7WUFFckMsRUFBRSxDQUFDLHFCQUFxQixDQUFFLHdCQUF3QixDQUFFLENBQUMsNkJBQTZCLENBQUUsY0FBYyxDQUFFLENBQUMsT0FBTyxDQUFFLE9BQU8sQ0FBQyxFQUFFO2dCQUNwSCxPQUFPLENBQUMsV0FBVyxDQUFFLGNBQWMsRUFBRSxLQUFLLENBQUUsQ0FBQztZQUNqRCxDQUFDLENBQUMsQ0FBQTtTQUNMO0lBQ0wsQ0FBQztJQUVELFNBQVMsOEJBQThCLENBQUUsV0FBbUIsRUFBRSxJQUFZLEVBQUUsTUFBYyxFQUFFLEVBQVU7UUFFbEcsSUFBSyxJQUFJLEtBQUssYUFBYSxFQUMzQjtZQUNJLHNCQUFzQixDQUFFLEVBQUUsQ0FBRSxDQUFDO1lBRTdCLFNBQVMsa0JBQWtCO2dCQUV2Qix3RUFBd0U7Z0JBQ3hFLElBQUksRUFBRSxDQUFDO2dCQUNQLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxvQkFBb0IsQ0FBRSxDQUFDLFdBQVcsQ0FBRSxRQUFRLEVBQUUsSUFBSSxDQUFFLENBQUM7Z0JBQy9FLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxpQkFBaUIsQ0FBRSxDQUFDLFlBQVksQ0FBRSwwQ0FBMEMsQ0FBRSxDQUFDO2dCQUV6Ryx3QkFBd0I7WUFDNUIsQ0FBQztZQUVELEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxvQkFBb0IsQ0FBRSxDQUFDLFdBQVcsQ0FBRSxRQUFRLEVBQUUsS0FBSyxDQUFFLENBQUM7WUFFaEYsa0JBQWtCLENBQUMsU0FBUyxDQUN4QixFQUFFLENBQUMscUJBQXFCLENBQUUsb0JBQW9CLENBQUUsRUFDaEQsRUFBRSxDQUFDLHFCQUFxQixDQUFFLGlCQUFpQixDQUFFLEVBQzdDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxnQkFBZ0IsRUFDMUIsa0JBQWtCLENBQ3JCLENBQUM7WUFFRixFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDLENBQUEscUNBQXFDO1NBQ3ZFO1FBRUQsSUFBSyxJQUFJLEtBQUssaUJBQWlCLEVBQy9CO1lBQ0ksc0JBQXNCLENBQUUsRUFBRSxDQUFFLENBQUM7WUFFN0IsTUFBTSxTQUFTLEdBQUcsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLENBQUMsTUFBTSxDQUFFLElBQUksQ0FBQyxFQUFFLENBQ3pELENBQUUsSUFBSSxDQUFDLFVBQVU7bUJBQ1YsQ0FBRSxXQUFXLENBQUUsQ0FBQyxRQUFRLENBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBRSxDQUNqRCxDQUNKLENBQUM7WUFFRixJQUFJLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUN4QjtnQkFDSSxPQUFPLENBQUUsRUFBRSxDQUFFLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQzFCLGVBQWUsQ0FBRSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUUsQ0FBQztnQkFDdkMsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxzQkFBc0IsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFFLENBQUM7Z0JBQ2xELFVBQVUsRUFBRSxDQUFDO2FBQ2hCO2lCQUVEO2dCQUNJLFVBQVUsRUFBRSxDQUFDO2FBQ2hCO1NBQ0o7SUFDTCxDQUFDO0lBRUQsU0FBUyxxQkFBcUIsQ0FBRSxNQUFhLEVBQUUsRUFBVTtRQUVyRCxzQkFBc0IsQ0FBRSxFQUFFLENBQUUsQ0FBQztRQUM3QixxQkFBcUIsQ0FBRSxFQUFFLENBQUUsQ0FBQztJQUNoQyxDQUFDO0lBRUQsU0FBUyxxQkFBcUIsQ0FBRSxFQUFVO1FBRXRDLE1BQU0sU0FBUyxHQUFHLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxDQUFDLE1BQU0sQ0FBRSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUUsSUFBSSxDQUFDLFVBQVU7ZUFDeEUsQ0FBRSxXQUFXLENBQUUsQ0FBQyxRQUFRLENBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBRSxDQUNqRCxDQUFFLENBQUM7UUFFSixJQUFJLGNBQWMsR0FBRyxLQUFLLENBQUM7UUFFM0IsU0FBUyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsRUFBRTtZQUN0QixJQUFJLENBQUUsUUFBUSxDQUFDLDZCQUE2QixDQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsa0JBQWtCLENBQUUsSUFBSSxRQUFRLENBQUMsNkJBQTZCLENBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxVQUFVLENBQUUsQ0FBQyxFQUM3STtnQkFDSSxZQUFZLENBQUMsMEJBQTBCLENBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBRSxDQUFDO2dCQUNuRCxjQUFjLEdBQUcsSUFBSSxDQUFDO2FBQ3pCO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLGNBQWMsRUFDbEI7WUFDSSxDQUFDLENBQUMsYUFBYSxDQUFFLHNCQUFzQixDQUFFLENBQUM7WUFDMUMsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxFQUFFLEVBQUUsSUFBSSxDQUFFLENBQUM7WUFDdkIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxhQUFhO2dCQUN4QixlQUFlLENBQUUsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFFLENBQUM7U0FDOUM7SUFDTCxDQUFDO0lBRUQsU0FBUyxlQUFlLENBQUUsRUFBVztRQUVqQyxJQUFJLGNBQWMsR0FBRyxFQUFFLENBQUMsZUFBZSxDQUFFLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBRSxDQUFDO1FBQzFELElBQUssY0FBYyxJQUFJLENBQUMsQ0FBQyxFQUN6QjtZQUNJLFlBQVksQ0FBQyxnQkFBZ0IsQ0FBRSxjQUFjLEVBQUUsRUFBRSxDQUFFLENBQUM7U0FDdkQ7SUFDTCxDQUFDO0lBRUQ7UUFDSSxDQUFDLENBQUMsb0JBQW9CLENBQUUsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDLGVBQWUsRUFBRSxFQUFFLGlCQUFpQixDQUFFLENBQUM7UUFDMUYsQ0FBQyxDQUFDLG9CQUFvQixDQUFFLG1CQUFtQixFQUFFLENBQUMsQ0FBQyxlQUFlLEVBQUUsRUFBRSxtQkFBbUIsQ0FBRSxDQUFDO1FBRWxGLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxzQkFBc0IsQ0FBRSxJQUFJLENBQUUsQ0FBQztRQUVuRCxJQUFJLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxnQkFBZ0IsRUFBRSxFQUMxQztZQUNJLGlCQUFpQixFQUFFLENBQUM7U0FDdkI7S0FDUDtBQUVGLENBQUMsRUF6cEJTLHlCQUF5QixLQUF6Qix5QkFBeUIsUUF5cEJsQyJ9