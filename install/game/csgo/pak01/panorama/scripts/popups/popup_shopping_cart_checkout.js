"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../common/shopping_cart.ts" />
/// <reference path="../generated/items_event_current_generated_store.d.ts" />
/// <reference path="../generated/items_event_current_generated_store.ts" />
/// <reference path="../common/formattext.ts" />
/// <reference path="../common/hold_button.ts" />
/// <reference path="../common/add_major_tokens_anim.ts" />
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
        cp.FindChildInLayoutFile('id-cart-close').SetPanelEvent('onactivate', ClosePopup);
        cp.FindChildInLayoutFile('id-cart-balance').SetDialogVariable('local-price', StoreAPI.GetStoreItemTokensBundlePrice('' + g_ActiveTournamentInfo.itemid_charge, 100, ''));
        cp.FindChildInLayoutFile('id-cart-balance').SetPanelEvent('onmouseover', () => {
            UiToolkitAPI.ShowTitleTextTooltip('id-cart-balance', '#CSGO_TournamentPass_' + g_ActiveTournamentInfo.location + '_credits', '#major_store_balance_tooltip' + (g_ActiveTournamentInfo.pp_fixed_prices ? '_fx' : ''));
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
        const elBg = cp.FindChildInLayoutFile('id-cart-checkout-bg');
        elBg.style.backgroundImage = 'url( "file://{images}/tournaments/backgrounds/pickem_bg_' + g_ActiveTournamentInfo.eventid + '.psd" )';
        elBg.style.backgroundRepeat = 'no-repeat';
        elBg.style.backgroundSize = 'auto 120%';
        elBg.style.backgroundPosition = '50% 50%';
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
            tooltip: '#major_store_checkout_use_tokens_tooltip' + strCheckoutSuffix + (g_ActiveTournamentInfo.pp_fixed_prices ? '_fx' : ''),
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
                getCart(cp).subscribeToUpdates(elTile, 'cart-item', () => {
                    elTile.SetDialogVariableInt('price', getCart(cp).getItemLinePrice(item.id));
                    elTile.SetDialogVariableInt('count', getCart(cp).getItemQuantity(item.id));
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
        const cp = $.GetContextPanel();
        $.RegisterEventHandler('ReadyForDisplay', $.GetContextPanel(), OnReadyForDisplay);
        $.RegisterEventHandler('UnreadyForDisplay', $.GetContextPanel(), OnUnreadyForDisplay);
        $.RegisterForUnhandledEvent('PanoramaComponent_Inventory_ItemCustomizationNotification', (...args) => { _ItemCustomizationNotification(...args, cp); });
        $.RegisterForUnhandledEvent('PanoramaComponent_Store_PurchaseCompleted', (...args) => { _OnPurchaseCompletion(...args, cp); });
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_UpdateConnectionToGC', Init);
        $.GetContextPanel().RegisterForReadyEvents(true);
        if ($.GetContextPanel().BReadyForDisplay()) {
            OnReadyForDisplay();
        }
    }
})(PopUpShoppingCartCheckout || (PopUpShoppingCartCheckout = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfc2hvcHBpbmdfY2FydF9jaGVja291dC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3BvcHVwcy9wb3B1cF9zaG9wcGluZ19jYXJ0X2NoZWNrb3V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFDckMsbURBQW1EO0FBQ25ELDhFQUE4RTtBQUM5RSw0RUFBNEU7QUFDNUUsZ0RBQWdEO0FBQ2hELGlEQUFpRDtBQUNqRCwyREFBMkQ7QUFDM0QsNERBQTREO0FBRTVELElBQVUseUJBQXlCLENBMm5CbEM7QUEzbkJELFdBQVUseUJBQXlCO0lBRy9CLFNBQVMsT0FBTyxDQUErQixFQUFNO1FBRWpELElBQUssQ0FBQyxFQUFFO1lBQ0osRUFBRSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQU8sQ0FBQztRQUVsQyxJQUFJLElBQUksR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDO1FBQzdCLE9BQVEsRUFBRSxFQUNWO1lBQ0ksSUFBSyxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsY0FBYyxDQUFFLE1BQU0sQ0FBRSxJQUFJLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLEVBQ3pEO2dCQUNJLElBQUksR0FBRyxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDO2dCQUN0QixNQUFNO2FBQ1Q7WUFDRCxFQUFFLEdBQUcsRUFBRSxDQUFDLFNBQVMsRUFBTyxDQUFDO1NBQzVCO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQVlELFNBQVMsaUJBQWlCO1FBRXRCLElBQUssQ0FBQyxZQUFZLENBQUMsZUFBZSxFQUFFLEVBQzFDO1lBQ1UsVUFBVSxFQUFFLENBQUM7WUFDdEIsT0FBTztTQUNQO1FBRUssTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBRy9CLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxl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