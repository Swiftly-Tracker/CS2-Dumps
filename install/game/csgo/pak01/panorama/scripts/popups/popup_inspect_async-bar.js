"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../common/hold_button.ts" />
/// <reference path="../common/iteminfo.ts" />
/// <reference path="../inspect.ts" />
/// <reference path="popup_inspect_shared.ts" />
/// <reference path="popup_can_apply_pick_slot.ts" />
/// <reference path="../generated/items_event_current_generated_store.ts" />
/// <reference path="../common/shopping_cart.ts" />
var InspectAsyncActionBar;
(function (InspectAsyncActionBar) {
    let m_scheduleHandle = null;
    function Init() {
        const worktype = InspectShared.GetPopupSetting('work_type');
        const toolId = InspectShared.GetPopupSetting('tool_id');
        const showXrayMachineUi = InspectShared.GetPopupSetting('is_xray_machine');
        const allowRental = InspectShared.GetPopupSetting('allow_rent');
        const elAsyncActionBarPanel = $.GetContextPanel().FindChildInLayoutFile('PopUpInspectAsyncBar');
        $.GetContextPanel().AddClass('PopupPanelCapability_' + worktype);
        const purchaseItemId = InspectShared.GetPopupSetting('purchase_item_id');
        $.Msg('asyncworktype:  ' + worktype + ', itemid ' + InspectShared.GetPopupSetting('item_id') + ', toolid ' + InspectShared.GetPopupSetting('tool_id'));
        if (InspectShared.GetPopupSetting('force_hide_async_bar') ||
            !worktype ||
            (allowRental && !showXrayMachineUi) ||
            (worktype === 'nameable' && !toolId) ||
            purchaseItemId && showXrayMachineUi ||
            _DoesNotMeetDecodalbeRequirements()) {
            elAsyncActionBarPanel.AddClass('hidden');
            return;
        }
        elAsyncActionBarPanel.RemoveClass('hidden');
        _SetUpDescription(elAsyncActionBarPanel);
        _SetUpButtonStates(elAsyncActionBarPanel);
        // Default weapon view icon btn to be selected since thats the view we start on.
        elAsyncActionBarPanel.FindChildInLayoutFile('InspectWeaponBtn').checked = true;
        _ShowHideInspectViewButtons(elAsyncActionBarPanel);
        _ChangeSceneryBtn(elAsyncActionBarPanel);
        _ShowZoomBtn(elAsyncActionBarPanel);
        elAsyncActionBarPanel.FindChildInLayoutFile('AsyncItemWorkCancelBtn').SetPanelEvent('onactivate', () => {
            if (_DefaultZoomView(worktype, elAsyncActionBarPanel) === false)
                _ClosePopup();
        });
        if (worktype === 'prestigecheck') { // go ahead and check for service medal immediately...
            _OnAccept($.GetContextPanel().Data().oSettings, elAsyncActionBarPanel);
        }
        const cp = $.GetContextPanel();
        if (!elAsyncActionBarPanel.Data().PanelRegisteredForEvents) {
            elAsyncActionBarPanel.Data().PanelRegisteredForEvents = $.RegisterForUnhandledEvent('PanoramaComponent_Inventory_ItemCustomizationNotification', (...args) => {
                return _OnItemCustomization(...args, cp);
            });
            if (worktype !== 'decodeable' && worktype !== 'nameable' && worktype !== 'remove_sticker') {
                $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', _OnMyPersonaInventoryUpdated);
                $.RegisterForUnhandledEvent('PanoramaComponent_Inventory_PrestigeCoinResponse', _OnInventoryPrestigeCoinResponse);
            }
            if (worktype === 'craft_souvenir') {
                $.RegisterForUnhandledEvent('PanoramaComponent_Store_VolatileShopSubscribe', (...args) => { _OnVolatileShopSubscribe(...args, cp); });
                _EnsureVolatileShopSubscribed(cp);
            }
        }
    }
    InspectAsyncActionBar.Init = Init;
    function _EnsureVolatileShopSubscribed(cp) {
        if (!cp || !cp.IsValid())
            return;
        if (cp.Data().refreshSubscriptionHandle) {
            $.CancelScheduled(cp.Data().refreshSubscriptionHandle);
            cp.Data().refreshSubscriptionHandle = null;
        }
        StoreAPI.VolatileShopSubscribe(g_ActiveTournamentInfo.itemid_dynamic_stickers, true);
        cp.Data().refreshSubscriptionHandle = $.Schedule(150, () => _EnsureVolatileShopSubscribed(cp));
    }
    function _DoesNotMeetDecodalbeRequirements() {
        // decodeable is also used for xray so we have to check id we are actually in the decode screen or xray
        if (InspectShared.GetPopupSetting('work_type') === 'decodeable') {
            const sRestriction = InventoryAPI.GetDecodeableRestriction(InspectShared.GetPopupSetting('item_id'));
            const showXrayMachineUi = InspectShared.GetPopupSetting('is_xray_machine');
            if (sRestriction === 'restricted' || (sRestriction === 'xray' && !showXrayMachineUi) || InspectShared.GetPopupSetting('inspect_only'))
                return false;
            return (!InspectShared.GetPopupSetting('tool_id') && !InspectShared.GetPopupSetting('is_keyless'));
        }
        return false;
    }
    function _PerformAsyncAction(oSettings, bForceRemoveSticker = false) {
        const worktype = oSettings.work_type;
        const itemId = oSettings.item_id;
        const toolId = oSettings.tool_id;
        const bAllowXray = oSettings.allow_xray_claim;
        const selectedSlot = parseInt($.GetContextPanel().GetAttributeString('selectedItemToApplySlot', ''));
        // Different action implementations go here
        if (worktype === 'useitem' || worktype === 'usegift') {
            InventoryAPI.UseTool(itemId, '');
        }
        else if (worktype === 'delete') {
            InventoryAPI.DeleteItem(itemId);
        }
        else if (worktype === 'prestigecheck') {
            InventoryAPI.RequestPrestigeCoinCheck();
        }
        else if (worktype === 'prestigeget' || worktype === 'prestigeupgrade') {
            InventoryAPI.RequestPrestigeCoin(InventoryAPI.GetItemDefinitionIndex(itemId));
        }
        else if (worktype === 'nameable') {
            $.DispatchEvent("CSGOPlaySoundEffect", "rename_applyConfirm", "MOUSE");
            InventoryAPI.UseTool(toolId, itemId);
            if ($.GetContextPanel().FindChildInLayoutFile('NameableRemoveConfirm')) {
                $.GetContextPanel().FindChildInLayoutFile('NameableRemoveConfirm').enabled = false;
                $.GetContextPanel().FindChildInLayoutFile('NameableValidBtn').enabled = false;
            }
        }
        else if (worktype === 'remove_patch') {
            $.Msg("RemoveKeRemovePatch from " + itemId + " (slot: " + selectedSlot + ", ignored)");
            $.DispatchEvent('CSGOPlaySoundEffect', 'UI.StickerScratch', 'MOUSE');
            InventoryAPI.WearItemSticker(itemId, selectedSlot, 0); // Patch will auto-remove, no scraping
        }
        else if (worktype === 'remove_keychain') {
            $.Msg("RemoveKeychain from " + itemId + " (slot: " + selectedSlot + ", ignored)");
            $.DispatchEvent('CSGOPlaySoundEffect', 'UI.StickerScratch', 'MOUSE');
            InventoryAPI.RemoveKeychain(itemId, 0);
        }
        else if (worktype === 'remove_sticker') {
            if (oSettings.remove_sticker_all_at_once) {
                // We are removing all stickers to convert this weapon into a souvenir, so just pass-through into the souvenir UI
                $.Msg("RemoveAllStickers from " + itemId + " -- ready to convert into a souvenir");
                $.DispatchEvent('CSGOPlaySoundEffect', 'UI.StickerScratch', 'MOUSE');
                _ClosePopup();
                const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('popup-inspect-' + itemId, 'file://{resources}/layout/popups/popup_capability_can_keychain.xml');
                let oSouvenirSettings = {
                    item_id: itemId,
                    tool_id: '',
                    umid_souvenir: oSettings.umid_souvenir,
                    work_type: 'craft_souvenir'
                };
                elPanel.Data().oSettings = oSouvenirSettings;
                return;
            }
            $.Msg("RemoveSticker from " + itemId + " (slot: " + selectedSlot + ", ignored)");
            CapabilityCanSticker.OnScratchSticker(itemId, selectedSlot, bForceRemoveSticker, oSettings.popup_panel);
        }
        else if (worktype === 'can_wrap_sticker' && !oSettings.tool_id) {
            $.Msg("Extract sticker from " + itemId + " display sleeve");
            $.DispatchEvent('CSGOPlaySoundEffect', 'sticker_applyConfirm', 'MOUSE');
            InventoryAPI.RemoveKeychain(itemId, 0);
        }
        else if (worktype === 'can_sticker' || worktype === 'can_patch' || worktype === 'can_keychain' || worktype === 'can_wrap_sticker') {
            $.DispatchEvent('CSGOPlaySoundEffect', 'sticker_applyConfirm', 'MOUSE');
            InventoryAPI.SetStickerToolSlot(itemId, selectedSlot);
            InventoryAPI.UseTool(toolId, itemId);
        }
        else if (worktype === 'craft_souvenir') {
            const fauxCartItemID = oSettings.temp_display_item_id;
            const nPurchaseCost = _ComputeTotalSouvenirCost(oSettings.popup_panel, fauxCartItemID).discountPrice;
            const strPurchaseCommand = 'craft_souvenir:' + itemId + ':' + oSettings.umid_souvenir;
            m_SouvenirCheckoutCart = ShoppingCart.findOrCreateTempCart(itemId, true);
            const shopItem = {
                id: fauxCartItemID,
                name: ItemInfo.GetFormattedName(fauxCartItemID),
                price: nPurchaseCost,
                checkout_id: strPurchaseCommand
            };
            m_SouvenirCheckoutCart.clearCart();
            m_SouvenirCheckoutCart.addItem(shopItem);
            $.Msg("Crafting souvenir for " + itemId + " UMID " + oSettings.umid_souvenir + " (" + nPurchaseCost + ", " + oSettings.credits_owned_souvenir + ")");
            $.DispatchEvent('CSGOPlaySoundEffect', 'sticker_applyConfirm', 'MOUSE');
            // $.GetContextPanel().FindChildInLayoutFile( 'MakeSouvenirPlayerSelect' ).enabled = false;
            // _ClosePopup();
            const popupPanel = UiToolkitAPI.ShowCustomLayoutPopupParameters('id-popup-shopping-cart-checkout', 'file://{resources}/layout/popups/popup_shopping_cart_checkout.xml', 'cartid=' + itemId +
                '&checkoutsuffix=_souvenir');
            $.Msg("Established cart popup to use one-off cart '" + itemId + "': " + m_SouvenirCheckoutCart.getTotalItems() + " (cost: " + m_SouvenirCheckoutCart.getTotalPrice() + ")");
            popupPanel.Data().eventId = g_ActiveTournamentInfo.eventid;
        }
        else if (worktype === 'decodeable') {
            // Sprays are not cases but do act as that for display in this ui
            if (ItemInfo.IsSpraySealed(itemId) || ItemInfo.ItemDefinitionNameSubstrMatch(itemId, 'tournament_pass_')) {
                InventoryAPI.UseTool(itemId, '');
            }
            else if (InventoryAPI.GetDecodeableRestriction(itemId) === "xray" && !bAllowXray) {
                InventoryAPI.UseTool(itemId, itemId);
            }
            else if (InventoryAPI.GetItemAttributeValue(itemId, '{uint32}volatile container')) {
                $.DispatchEvent('CSGOPlaySoundEffect', 'UI.Laptop.Unlock', 'MOUSE');
                InventoryAPI.UseTool(toolId, itemId);
            }
            else {
                InventoryAPI.UseTool(toolId, itemId);
            }
            if (InventoryAPI.GetDecodeableRestriction(itemId) !== "xray") {
                $.DispatchEvent('StartDecodeableAnim');
            }
        }
    }
    function _SetUpButtonStates(elPanel) {
        const elOK = elPanel.FindChildInLayoutFile('AsyncItemWorkAcceptConfirm');
        const elNegative = elPanel.FindChildInLayoutFile('AsyncItemWorkAcceptNegative');
        const worktype = InspectShared.GetPopupSetting('work_type');
        const itemId = InspectShared.GetPopupSetting('item_id');
        let sOkButtonText = '#popup_' + worktype + '_button';
        if (InspectShared.GetPopupSetting('is_workshop_preview')) {
            elOK.AddClass('hidden');
            if (elNegative)
                elNegative.AddClass('hidden');
        }
        const oSettings = $.GetContextPanel().Data().oSettings;
        function _SetPanelEventOnAccept() {
            elOK.SetPanelEvent('onactivate', () => _OnAccept(oSettings, elPanel));
        }
        if (worktype === '') {
            return;
        }
        if (worktype === 'can_wrap_sticker') {
            elOK.visible = false;
            elNegative.visible = false;
            const toolId = InspectShared.GetPopupSetting('tool_id');
            ;
            const btnId = toolId ? 'AsyncItemWorkAcceptConfirmHold' : 'AsyncItemWorkAcceptNegativeHold';
            const btnHoldAction = elPanel.FindChildInLayoutFile(btnId);
            const locString = !toolId ? '#popup_' + worktype + '_button_negative' : '#popup_' + worktype + '_button';
            btnHoldAction.RemoveClass('AsyncItemWorkAcceptNegativeHidden');
            const btnSettings = {
                btn: btnHoldAction,
                tooltip: !toolId ? '#popup_' + worktype + '_button_negative_tooltip' : '#popup_' + worktype + '_button_tooltip',
                locString: locString,
                loopingSound: 'UI.Laptop.ButtonFillLoop',
                timerCompleteAction: () => {
                    _OnAccept(oSettings, elPanel);
                    btnHoldAction.enabled = false;
                }
            };
            HoldButton.SetupButton(btnSettings);
            return;
        }
        if (worktype === 'craft_souvenir') {
            elOK.visible = false;
            elNegative.visible = false;
            const btnId = 'AsyncItemWorkAcceptConfirmHold';
            const btnHoldAction = elPanel.FindChildInLayoutFile(btnId);
            let locString = '#popup_' + worktype + '_button';
            btnHoldAction.RemoveClass('AsyncItemWorkAcceptNegativeHidden');
            const btnSettings = {
                btn: btnHoldAction,
                locString: locString,
                loopingSound: 'UI.Laptop.ButtonFillLoop',
                timerCompleteAction: () => {
                    _OnAccept(oSettings, elPanel);
                    // this popup stays around until the user completes the cart-checkout process
                    // btnHoldAction.enabled = false;
                }
            };
            const tempCreatedItem = InspectShared.GetPopupSetting('temp_display_item_id');
            btnHoldAction.SetPanelEvent('onmouseover', () => {
                UiToolkitAPI.ShowCustomLayoutParametersTooltip(btnHoldAction.id, 'tooltip-souvenir-receipt', 'file://{resources}/layout/tooltips/tooltip_souvenir_receipt.xml', 'itemid=' + tempCreatedItem);
            });
            btnHoldAction.SetPanelEvent('onmouseout', () => {
                UiToolkitAPI.HideCustomLayoutTooltip('tooltip-souvenir-receipt');
            });
            HoldButton.SetupButton(btnSettings);
            // const balanceCredits = InspectShared.GetPopupSetting( 'credits_owned_souvenir' ) as number;
            // const bEnabled = ( costSouvenir && !( costSouvenir > balanceCredits ) ) ? true : false;
            // btnHoldAction.enabled = bEnabled;
            btnHoldAction.enabled = true; // let the user always go to checkout and activate/buy more tokens in the cart
            _DiscountPanel(oSettings.popup_panel, elPanel);
            const umidSouvenir = InspectShared.GetPopupSetting('umid_souvenir');
            const elButtonChangeSouvenirItem = elPanel.FindChildInLayoutFile('ChangeSouvenirItem');
            elButtonChangeSouvenirItem.RemoveClass('hidden');
            elButtonChangeSouvenirItem.SetPanelEvent('onactivate', () => {
                $.DispatchEvent('CSGOPlaySoundEffect', 'sticker_applySticker', 'MOUSE');
                _ClosePopup();
                $.DispatchEvent('ShowSelectItemForCapabilityPopup', umidSouvenir, '', 'craft_souvenir');
            });
            const elMakeSouvenirPlayerSelect = elPanel.FindChildInLayoutFile('MakeSouvenirPlayerSelect');
            elMakeSouvenirPlayerSelect.RemoveClass('hidden');
            const goldenItemId = InspectShared.GetPopupSetting('temp_display_item_id');
            // const unEventID = InventoryAPI.GetItemAttributeValue( goldenItemId, '{uint32}tournament event id' );
            const unTeamIDs = [InventoryAPI.GetItemAttributeValue(goldenItemId, '{uint32}tournament event team0 id'),
                InventoryAPI.GetItemAttributeValue(goldenItemId, '{uint32}tournament event team1 id')];
            const unPlayerID = InventoryAPI.GetItemAttributeValue(goldenItemId, '{uint32}tournament mvp account id');
            let arrSelections = [];
            const defidxStickerItem = InventoryAPI.GetItemDefinitionIndexFromDefinitionName('sticker');
            g_ActiveTournamentTeams.filter((tt) => unTeamIDs.includes(tt.teamid)).forEach((tt) => {
                // let sTeamTag = PredictionsAPI.GetTeamTag( tt.team );
                tt.players.forEach((tp) => {
                    let sPlayerName = $.Localize('#SFUI_ProPlayer_' + tp.code, elPanel).split(" ");
                    sPlayerName.splice(1, 0, ...["'" + tp.nick + "'"]);
                    const idFauxSticker = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(defidxStickerItem, tp.stickerids[tp.stickerids.length - 1]);
                    let unCostInCredits = MissionsAPI.GetSeasonalOperationFauxCreditsCost(g_ActiveTournamentInfo.credits_id, idFauxSticker);
                    arrSelections.push({
                        unPlayerID: tp.playerid,
                        sPlayerName: sPlayerName.join(" "),
                        sTeamTag: tt.team,
                        unCostInCredits: unCostInCredits,
                        unStickerID: tp.stickerids[tp.stickerids.length - 1]
                    });
                });
            });
            arrSelections.sort((a, b) => (a.unCostInCredits - b.unCostInCredits) * 100000 + (a.unStickerID - b.unStickerID));
            arrSelections.forEach((sel) => {
                let elOption = $.CreatePanel('Panel', elMakeSouvenirPlayerSelect, 'id-MakeSouvenirPlayerSelect-p' + sel.unPlayerID);
                elOption.BLoadLayoutSnippet('craft-souvenir-dropdown-select-player-entry');
                let elNamePanel = elOption.FindChildInLayoutFile('id-craft-souvenir-dropdown-select-player-entry-name');
                elNamePanel.text = sel.sPlayerName;
                elOption.FindChildInLayoutFile('id-craft-souvenir-dropdown-select-player-entry-cost')
                    .SetDialogVariableInt('cost', sel.unCostInCredits);
                elOption.FindChildInLayoutFile('id-team-player-logo')
                    .SetImage("file://{images}/tournaments/teams/" + sel.sTeamTag + ".svg");
                elOption.SetAttributeUInt32('playerid', sel.unPlayerID);
                if (sel.unPlayerID != unPlayerID) {
                    elNamePanel.SetPanelEvent('onactivate', () => {
                        $.Msg("Update player autograph to: " + sel.unPlayerID + ": " + sel.sPlayerName);
                        $.DispatchEvent("Activated", elNamePanel.GetParent(), "mouse");
                    });
                }
                else {
                    elOption.AddClass('craft_souvenir_dropdown_selected');
                }
                elMakeSouvenirPlayerSelect.AddOption(elOption);
            });
            elMakeSouvenirPlayerSelect.SetPanelEvent('oninputsubmit', () => {
                const elSelected = elMakeSouvenirPlayerSelect.GetSelected();
                const nNewPlayerID = elSelected.GetAttributeUInt32('playerid', 0);
                if (nNewPlayerID && unPlayerID != nNewPlayerID) {
                    let oNewSettings = {
                        item_id: itemId,
                        tool_id: '',
                        umid_souvenir: 'pid_' + nNewPlayerID + ':' + (umidSouvenir.split(':').pop()),
                        work_type: 'craft_souvenir'
                    };
                    $.Msg("Closing to update player autograph to: " + nNewPlayerID + " UMID( " + umidSouvenir + " ) -> " + oNewSettings.umid_souvenir);
                    _ClosePopup();
                    //
                    // Re-issue the popup with a different layout (new sticker, new prices, new description)
                    //
                    const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('popup-inspect-' + itemId, 'file://{resources}/layout/popups/popup_capability_can_keychain.xml');
                    elPanel.AddClass('PopupPanelCapability_' + oNewSettings.work_type);
                    elPanel.Data().oSettings = oNewSettings;
                }
            });
            elMakeSouvenirPlayerSelect.SetSelected('id-MakeSouvenirPlayerSelect-p' + unPlayerID);
            return;
        }
        if (worktype === 'remove_keychain') {
            elOK.visible = false;
            elNegative.visible = false;
            const btnHoldAction = elPanel.FindChildInLayoutFile('AsyncItemWorkAcceptNegativeHold');
            btnHoldAction.RemoveClass('AsyncItemWorkAcceptNegativeHidden');
            const btnSettings = {
                btn: btnHoldAction,
                tooltip: '#SFUI_Keychain_Remove_Tooltip',
                locString: '#popup_' + worktype + '_button',
                loopingSound: 'UI.Laptop.ButtonFillLoop',
                timerCompleteAction: () => {
                    _OnAccept(oSettings, elPanel);
                    btnHoldAction.enabled = false;
                }
            };
            HoldButton.SetupButton(btnSettings);
            return;
        }
        if (worktype === 'remove_patch') {
            elOK.visible = false;
            elNegative.visible = false;
            const btnHoldAction = elPanel.FindChildInLayoutFile('AsyncItemWorkAcceptNegativeHold');
            btnHoldAction.RemoveClass('AsyncItemWorkAcceptNegativeHidden');
            const btnSettings = {
                btn: btnHoldAction,
                tooltip: '#SFUI_Patch_Remove_Desc_Tooltip',
                locString: '#popup_' + worktype + '_button',
                loopingSound: 'UI.Laptop.ButtonFillLoop',
                timerCompleteAction: () => {
                    _OnAccept(oSettings, elPanel);
                    btnHoldAction.enabled = false;
                }
            };
            HoldButton.SetupButton(btnSettings);
            return;
        }
        if (worktype === 'remove_sticker') {
            const bRemovingAllStickersForSouvenir = !!InspectShared.GetPopupSetting('remove_sticker_all_at_once');
            if (bRemovingAllStickersForSouvenir)
                elOK.visible = false;
            // adds remove sticker button
            elNegative.visible = false;
            const btnHoldAction = elPanel.FindChildInLayoutFile('AsyncItemWorkAcceptNegativeHold');
            btnHoldAction.RemoveClass('AsyncItemWorkAcceptNegativeHidden');
            const btnSettings = {
                btn: btnHoldAction,
                tooltip: bRemovingAllStickersForSouvenir ? '#SFUI_Sticker_WipeStickersImmediate_Tooltip' : '#SFUI_Sticker_RemoveImmediate_Tooltip',
                locString: '#popup_' + worktype + '_button_negative' + (bRemovingAllStickersForSouvenir ? '_wipestickers' : ''),
                loopingSound: 'UI.Laptop.ButtonFillLoop',
                timerCompleteAction: () => {
                    _OnAccept(oSettings, elPanel, true);
                    btnHoldAction.enabled = false;
                }
            };
            HoldButton.SetupButton(btnSettings);
        }
        if (worktype === 'delete') {
            // adds remove sticker button
            elNegative.visible = false;
            elOK.visible = false;
            const btnHoldAction = elPanel.FindChildInLayoutFile('AsyncItemWorkAcceptNegativeHold');
            btnHoldAction.RemoveClass('AsyncItemWorkAcceptNegativeHidden');
            const btnSettings = {
                btn: btnHoldAction,
                tooltip: '#popup_delete_tooltip',
                locString: '#popup_' + worktype + '_button',
                loopingSound: 'UI.Laptop.ButtonFillLoop',
                timerCompleteAction: () => {
                    _OnAccept(oSettings, elPanel, true);
                    btnHoldAction.enabled = false;
                }
            };
            HoldButton.SetupButton(btnSettings);
            return;
        }
        const toolId = InspectShared.GetPopupSetting('tool_id');
        const itemDefName = InventoryAPI.GetItemDefinitionName(itemId);
        const btnStyle = InspectShared.GetPopupSetting('override_async_btn_style') === false ?
            'Positive' :
            InspectShared.GetPopupSetting('override_async_btn_style');
        if (worktype === 'decodeable') // These are overrides for the button states and other desc
         {
            const sRestriction = InventoryAPI.GetDecodeableRestriction(itemId);
            const elDescLabel = elPanel.FindChildInLayoutFile('AsyncItemWorkDesc');
            const elDescImage = elPanel.FindChildInLayoutFile('AsyncItemWorkDescImage');
            const inspectOnly = InspectShared.GetPopupSetting('inspect_only');
            // sRestriction = 'restricted';
            if (inspectOnly || sRestriction === 'restricted' && !$.GetContextPanel().Data().existingRewardFromXrayId) {
                // Decodeable container cannot be opened
                elOK.visible = false;
                elDescLabel.visible = false;
                elDescImage.visible = false;
                return;
            }
            if (InspectShared.GetPopupSetting('is_xray_machine')) {
                const enabled = InspectShared.GetPopupSetting('allow_xray_claim') ? true : false;
                EnableDisableOkBtn(elPanel, enabled);
                elOK.AddClass(btnStyle);
                elOK.text = '#popup_xray_claim_item';
                _SetPanelEventOnAccept();
                return;
            }
            if (sRestriction === 'xray' && !inspectOnly) {
                // Use is in territory that requires xray
                elOK.visible = true;
                elOK.text = '#popup_xray_button_goto';
                elOK.AddClass(btnStyle);
                elOK.SetPanelEvent('onactivate', () => {
                    // since we are passing toolId as string here use '' so that it is false in logic checks.  
                    $.DispatchEvent("ShowXrayCasePopup", !toolId ? '' : toolId, itemId, true);
                    _ClosePopup();
                });
                // this is an override to override_async_bar_desc
                elDescLabel.visible = true;
                elDescLabel.text = '#popup_decodeable_async_xray_desc';
                elDescImage.visible = false;
                return;
            }
            const terminalValue = InventoryAPI.GetItemAttributeValue(itemId, '{uint32}volatile container');
            const isTerminal = (terminalValue == '' || terminalValue == undefined || terminalValue == 0) ? false : true;
            if (itemDefName && itemDefName.indexOf("spray") != -1)
                sOkButtonText = sOkButtonText + "_graffiti";
            else if (itemDefName && itemDefName.indexOf("tournament_pass_") != -1)
                sOkButtonText = sOkButtonText + "_fantoken";
            else if (terminalValue)
                sOkButtonText = sOkButtonText + "_terminal";
            const elDropdown = elPanel.FindChildInLayoutFile('AsyncOfferLimitDropdown');
            elDropdown.SetHasClass('hidden', !isTerminal);
            if (isTerminal)
                _SetUpOfferLimitDropdown(elDropdown);
        }
        if (worktype === 'can_sticker') {
            const listStickers = ItemInfo.GetitemStickerList(itemId);
            elOK.SetDialogVariableInt('sticker_count', listStickers.length + 1);
            elOK.SetDialogVariableInt('max_stickers', 5);
        }
        if (worktype === 'nameable' && itemDefName === 'casket') {
            sOkButtonText = '#popup_newcasket_button';
        }
        if (worktype === 'useitem') {
            if (itemDefName && itemDefName.startsWith('Remove Keychain Tool')) {
                elOK.SetDialogVariableInt('item_count', Number(InventoryAPI.GetItemAttributeValue(itemId, '{uint32}items count')));
                sOkButtonText = '#popup_useitem_button_getkeychaincharges:f';
            }
            if (itemDefName && itemDefName.startsWith('XpShopTicket')) {
                const bHasPrime = FriendsListAPI.GetFriendPrimeEligible(MyPersonaAPI.GetXuid());
                sOkButtonText = bHasPrime ? '#xpshop_pass_activate_open_armory' : '#SFUI_Elevated_Status_upgrade_status';
            }
            if (itemDefName?.includes('tournament_pass_') && itemDefName?.includes('_credits')) {
                $.GetContextPanel().Data().majorCreditsToClaim = Number(InventoryAPI.GetItemAttributeValue(itemId, '{uint32}upgrade level'));
            }
        }
        elOK.text = sOkButtonText;
        elOK.AddClass(btnStyle);
        _SetPanelEventOnAccept();
    }
    function _DiscountPanel(popup_panel, elAsyncBar) {
        const oPriceData = _ComputeTotalSouvenirCost(popup_panel);
        const elDiscount = elAsyncBar.FindChildInLayoutFile('id-souvenir-discount');
        if (oPriceData.discountAmount > 0) {
            elDiscount.SetHasClass('hidden', false);
            elDiscount.SetDialogVariableInt('discount', oPriceData.discountAmount);
            elDiscount.SetDialogVariableInt('price', oPriceData.discountPrice);
            elDiscount.SetDialogVariableInt('original-price', oPriceData.originalPrice);
        }
        else
            elDiscount.SetHasClass('hidden', true);
    }
    function _SetUpOfferLimitDropdown(elDropdown) {
        const oLimits = JSON.parse(InventoryAPI.GetVolatileLimits());
        for (let i = 0; i < oLimits.choices.length; i++) {
            if (!elDropdown.HasOption('id-dropdown-limit-' + oLimits.choices[i].limit)) {
                let elOption = $.CreatePanel('Label', elDropdown, 'id-dropdown-limit-' + oLimits.choices[i].limit, {
                    class: 'DropDownMenu'
                });
                elOption.SetDialogVariable('limit', $.Localize(oLimits.choices[i].label));
                elOption.text = $.Localize('#offer_limit_setting', elOption);
                elOption.SetAttributeUInt32('limit', oLimits.choices[i].limit);
                elDropdown.AddOption(elOption);
            }
        }
        elDropdown.SetPanelEvent('oninputsubmit', () => _OnOfferLimitDropdownSubmit(elDropdown));
        elDropdown.SetSelected('id-dropdown-limit-' + oLimits.limit);
    }
    function _OnOfferLimitDropdownSubmit(elDropdown) {
        const elSelected = elDropdown.GetSelected();
        const nLimit = elSelected.GetAttributeUInt32('limit', 0);
        InventoryAPI.SetVolatileLimits(nLimit);
    }
    function _SetUpDescription(elPanel) {
        const elDescLabel = elPanel.FindChildInLayoutFile('AsyncItemWorkDesc');
        const elDescImage = elPanel.FindChildInLayoutFile('AsyncItemWorkDescImage');
        const worktype = InspectShared.GetPopupSetting('work_type');
        const toolId = InspectShared.GetPopupSetting('tool_id');
        const showAsyncActionDesc = InspectShared.GetPopupSetting('override_async_bar_desc');
        const showXrayMachineUi = InspectShared.GetPopupSetting('is_xray_machine');
        elDescLabel.SetHasClass('popup-capability-faded', showXrayMachineUi && !InspectShared.GetPopupSetting('allow_xray_claim'));
        elDescImage.SetHasClass('popup-capability-faded', showXrayMachineUi && !InspectShared.GetPopupSetting('allow_xray_claim'));
        if (showAsyncActionDesc) {
            elDescImage.itemid = toolId;
            const itemName = InventoryAPI.GetItemName(toolId);
            if (itemName) {
                elDescLabel.SetDialogVariable('itemname', itemName);
                elDescLabel.text = $.Localize('#popup_' + worktype + '_async_desc', elDescLabel);
            }
        }
        elDescLabel.visible = showAsyncActionDesc;
    }
    function EnableDisableOkBtn(elPanel, bEnable) {
        const elOK = elPanel.FindChildInLayoutFile('AsyncItemWorkAcceptConfirm');
        if (elOK.visible) {
            if (elOK.enabled !== bEnable)
                elOK.TriggerClass('popup-capability-update-anim');
            elOK.enabled = bEnable;
        }
        let elNegative = elPanel.FindChildInLayoutFile('AsyncItemWorkAcceptNegative');
        if (elNegative && elNegative.visible) {
            if (elNegative.enabled !== bEnable)
                elNegative.TriggerClass('popup-capability-update-anim');
            elNegative.enabled = bEnable;
        }
        elNegative = elPanel.FindChildInLayoutFile('AsyncItemWorkAcceptNegativeHold');
        if (elNegative && elNegative.visible) {
            if (elNegative.enabled !== bEnable)
                elNegative.TriggerClass('popup-capability-update-anim');
            elNegative.enabled = bEnable;
        }
    }
    InspectAsyncActionBar.EnableDisableOkBtn = EnableDisableOkBtn;
    function ShowHideOkBtn(elPanel, bShow) {
        const elOK = elPanel.FindChildInLayoutFile('AsyncItemWorkAcceptConfirm');
        elOK.SetHasClass('move-down', !bShow);
        let elNegative = elPanel.FindChildInLayoutFile('AsyncItemWorkAcceptNegative');
        if (elNegative)
            elNegative.SetHasClass('move-down', !bShow);
        elNegative = elPanel.FindChildInLayoutFile('AsyncItemWorkAcceptNegativeHold');
        if (elNegative)
            elNegative.SetHasClass('move-down', !bShow);
    }
    InspectAsyncActionBar.ShowHideOkBtn = ShowHideOkBtn;
    function _OnAccept(oSettings, elAsyncActionBarPanel, bForceRemoveSticker = false) {
        ResetTimeouthandle();
        const worktype = oSettings.work_type;
        const itemId = oSettings.item_id;
        if (worktype === 'useitem') {
            if (ItemInfo.ItemDefinitionNameSubstrMatch(itemId, 'XpShopTicket')) {
                const bHasPrime = FriendsListAPI.GetFriendPrimeEligible(MyPersonaAPI.GetXuid());
                if (!bHasPrime) {
                    UiToolkitAPI.ShowCustomLayoutPopup('prime_status', 'file://{resources}/layout/popups/popup_prime_status.xml');
                    return;
                }
                const oXpShopTrackProgress = InventoryAPI.GetCacheTypeElementJSOByIndex('XpShop', 0);
                const bTooManyTracks = (oXpShopTrackProgress && (oXpShopTrackProgress.xp_tracks.length >= StoreAPI.GetXpShopMaxTracks()));
                if (bTooManyTracks) {
                    UiToolkitAPI.ShowGenericPopupOk('#CSGO_Purchasable_XpShop_Ticket', '#CSGO_Purchasable_XpShop_Ticket_TooManyTracks', '', () => { });
                    return;
                }
                ResetTimeouthandle();
                _ClosePopup();
                $.DispatchEvent('MainMenuGoToStore', 'id-store-nav-xpshop');
                return;
            }
        }
        if (worktype === 'useitem' || worktype === 'decodeable') {
            const strToolType = InventoryAPI.GetToolType(itemId);
            if (strToolType === 'fantoken') {
                const nTournamentEventID = InventoryAPI.GetItemAttributeValue(itemId, '{uint32}tournament event id');
                if (nTournamentEventID && (nTournamentEventID > 0)) {
                    const coinItemId = InventoryAPI.GetActiveTournamentCoinItemId(nTournamentEventID);
                    if (coinItemId && (coinItemId !== '0')) {
                        $.DispatchEvent('CSGOPlaySoundEffect', 'sticker_applyConfirm', 'MOUSE');
                        UiToolkitAPI.ShowGenericPopupOk(InventoryAPI.GetItemName(coinItemId), '#Store_DuplicateItemInBackpack', '', () => {
                            ResetTimeouthandle();
                            _ClosePopup();
                            $.DispatchEvent("ShowCustomLayoutPopupParametersAsEvent", '', 'file://{resources}/layout/popups/popup_inventory_inspect.xml', 'item_id=' + coinItemId +
                                ',inspect_only=true,force_inspect_view_type=primary');
                        });
                        return;
                    }
                }
            }
        }
        _PerformAsyncAction(oSettings, bForceRemoveSticker);
        // Converting to souvenir happens through cart-checkout
        // once the user completes the purchase, this popup will self-close
        // if the user backs out of the cart-checkout then they get back into this popup
        if (worktype === 'craft_souvenir')
            return;
        // Hide negative buttons 
        let elNegative = elAsyncActionBarPanel.FindChildInLayoutFile('AsyncItemWorkAcceptNegative');
        if (elNegative)
            elNegative.AddClass('hidden');
        elNegative = elAsyncActionBarPanel.FindChildInLayoutFile('AsyncItemWorkAcceptNegativeHold');
        if (elNegative)
            elNegative.AddClass('hidden');
        // Show timeout spinner
        elAsyncActionBarPanel.FindChildInLayoutFile('NameableSpinner').RemoveClass('hidden');
        elAsyncActionBarPanel.FindChildInLayoutFile('AsyncItemWorkAcceptConfirm').AddClass('hidden');
    }
    function _ShowHideInspectViewButtons(elAsyncActionBarPanel) {
        const worktype = InspectShared.GetPopupSetting('work_type');
        if (worktype === 'can_sticker' || worktype === 'can_keychain') {
            const elApplyPickSlot = $.GetContextPanel().FindChildInLayoutFile('PopUpCanApplyPickSlot');
            elAsyncActionBarPanel.FindChildInLayoutFile('InspectWeaponBtn').SetPanelEvent('onactivate', () => {
                InspectModelImage.EndWeaponLookat();
                CanApplyPickSlot.ShowHideInfoPanel(false, elApplyPickSlot);
                CanApplyPickSlot.IsContinueEnabled(elApplyPickSlot);
                ShowHideOkBtn(elAsyncActionBarPanel, true);
                EnableDisableOkBtn(elAsyncActionBarPanel, !CanApplyPickSlot.IsContinueEnabled(elApplyPickSlot));
                elAsyncActionBarPanel.FindChildInLayoutFile('AsyncItemWorkCancelBtn').text = "#GameUI_Close";
                if (elAsyncActionBarPanel.FindChildInLayoutFile('InspectItemModelZoom').visible) {
                    elAsyncActionBarPanel.FindChildInLayoutFile('InspectItemModelZoom').enabled = true;
                }
            });
            elAsyncActionBarPanel.FindChildInLayoutFile('LookatWeaponBtn').SetPanelEvent('onactivate', () => {
                InspectModelImage.StartWeaponLookat();
                CanApplyPickSlot.ShowHideInfoPanel(true, elApplyPickSlot);
                ShowHideOkBtn(elAsyncActionBarPanel, false);
                EnableDisableOkBtn(elAsyncActionBarPanel, false);
                elAsyncActionBarPanel.FindChildInLayoutFile('AsyncItemWorkCancelBtn').text = "#SFUI_Back";
                elAsyncActionBarPanel.FindChildInLayoutFile('InspectItemModelZoom').enabled = false;
            });
            elAsyncActionBarPanel.FindChildInLayoutFile('InspectWeaponBtn').GetParent().SetHasClass('hidden', false);
        }
        else {
            elAsyncActionBarPanel.FindChildInLayoutFile('InspectWeaponBtn').GetParent().SetHasClass('hidden', true);
        }
        elAsyncActionBarPanel.FindChildInLayoutFile('ChangeScenery').SetHasClass('hidden', worktype === 'decodeable' || worktype === 'remove_patch'
            || worktype === 'can_wrap_sticker' || worktype === 'craft_souvenir'
            || worktype === 'remove_sticker' || worktype === 'remove_keychain');
    }
    function _ChangeSceneryBtn(elAsyncActionBarPanel) {
        elAsyncActionBarPanel.FindChildInLayoutFile('ChangeScenery').SetPanelEvent('onactivate', UpdateScenery);
    }
    function UpdateScenery() {
        UiToolkitAPI.ShowCustomLayoutContextMenuParametersDismissEvent('id-inspect-contextmenu-maps', '', 'file://{resources}/layout/context_menus/context_menu_mainmenu_vanity.xml', 'type=maps' +
            '&' + 'inspect-map=true', () => { $.DispatchEvent('ContextMenuEvent', ''); });
    }
    InspectAsyncActionBar.UpdateScenery = UpdateScenery;
    function EnableDisableChangeSceneryBtn(bEnable, elAsyncActionBarPanel) {
        elAsyncActionBarPanel.FindChildInLayoutFile('ChangeScenery').enabled = bEnable;
    }
    InspectAsyncActionBar.EnableDisableChangeSceneryBtn = EnableDisableChangeSceneryBtn;
    function _ShowZoomBtn(elAsyncActionBarPanel) {
        // Early out if using new pan/zoom functionality
        if (InspectModelImage.PanZoomEnabled() || InspectShared.GetPopupSetting('work_type') === 'nameable')
            return;
        const defName = InventoryAPI.GetItemDefinitionName(InspectShared.GetPopupSetting('item_id'));
        const result = InspectModelImage.m_CameraSettingsPerWeapon.find(({ type }) => type === defName);
        if (!result || !result.hasOwnProperty('zoom_camera'))
            return;
        const elZoomBtn = elAsyncActionBarPanel.FindChildInLayoutFile('InspectItemModelZoom');
        elZoomBtn.SetPanelEvent('onactivate', () => ZoomCamera(false, elAsyncActionBarPanel));
        elZoomBtn.SetHasClass('hidden', false);
    }
    function ZoomCamera(bForceZoomOut = false, elAsyncActionBarPanel) {
        const elZoomButton = elAsyncActionBarPanel.FindChildInLayoutFile('InspectItemModelZoom');
        if (bForceZoomOut) {
            InspectModelImage.ZoomCamera(false);
            elZoomButton.checked = false;
            return;
        }
        if (elZoomButton.checked) {
            InspectModelImage.ZoomCamera(true);
        }
        else {
            InspectModelImage.ZoomCamera(false);
        }
    }
    InspectAsyncActionBar.ZoomCamera = ZoomCamera;
    function OnCloseRemove(elAsyncActionBarPanel) {
        if (elAsyncActionBarPanel.IsValid()) {
            elAsyncActionBarPanel.FindChildInLayoutFile('NameableSpinner').AddClass('hidden');
            elAsyncActionBarPanel.FindChildInLayoutFile('AsyncItemWorkAcceptConfirm').RemoveClass('hidden');
            let elNegative = elAsyncActionBarPanel.FindChildInLayoutFile('AsyncItemWorkAcceptNegative');
            if (elNegative)
                elNegative.RemoveClass('hidden');
            elNegative = elAsyncActionBarPanel.FindChildInLayoutFile('AsyncItemWorkAcceptNegativeHold');
            if (elNegative)
                elNegative.RemoveClass('hidden');
        }
    }
    InspectAsyncActionBar.OnCloseRemove = OnCloseRemove;
    function _ClosePopup() {
        ResetTimeouthandle();
        HoldButton.StopLoopingSound('UI.Laptop.ButtonFillLoop');
        $.DispatchEvent('HideSelectItemForCapabilityPopup');
        $.DispatchEvent('UIPopupButtonClicked', '');
        $.DispatchEvent('CapabilityPopupIsOpen', false);
    }
    function SetCallbackTimeout() {
        const elPanel = $.GetContextPanel();
        m_scheduleHandle = $.Schedule(5, () => _CancelWaitforCallBack(elPanel));
    }
    InspectAsyncActionBar.SetCallbackTimeout = SetCallbackTimeout;
    function _CancelWaitforCallBack(elPanel) {
        m_scheduleHandle = null;
        const elSpinner = elPanel.FindChildInLayoutFile('NameableSpinner');
        elSpinner.AddClass('hidden');
        _ClosePopup();
        UiToolkitAPI.ShowGenericPopupOk($.Localize('#SFUI_SteamConnectionErrorTitle'), $.Localize('#SFUI_InvError_Item_Not_Given'), '', () => { });
    }
    function OnEventToClose() {
        const worktype = InspectShared.GetPopupSetting('work_type');
        const elAsyncActionBarPanel = $.GetContextPanel().FindChildInLayoutFile('PopUpInspectAsyncBar');
        if (_DefaultZoomView(worktype, elAsyncActionBarPanel) === false)
            _ClosePopup();
    }
    InspectAsyncActionBar.OnEventToClose = OnEventToClose;
    function _DefaultZoomView(worktype, elAsyncActionBarPanel) {
        if (elAsyncActionBarPanel && (worktype === 'can_sticker' || worktype === 'can_keychain')) {
            const elLookatBtn = elAsyncActionBarPanel.FindChildInLayoutFile('LookatWeaponBtn');
            if (elLookatBtn && elLookatBtn.IsValid()
                && elLookatBtn.checked
                && m_scheduleHandle === null) {
                $.DispatchEvent("Activated", elAsyncActionBarPanel.FindChildInLayoutFile('InspectWeaponBtn'), "mouse");
                return true;
            }
        }
        return false;
    }
    function ResetTimeouthandle() {
        if (m_scheduleHandle) {
            $.CancelScheduled(m_scheduleHandle);
            m_scheduleHandle = null;
        }
    }
    InspectAsyncActionBar.ResetTimeouthandle = ResetTimeouthandle;
    function _OnItemCustomization(numericType, type, itemid, cp = $.GetContextPanel()) {
        const worktype = InspectShared.GetPopupSetting('work_type');
        $.Msg(`popup_inspect_async-bar.ts _OnItemCustomization ${numericType} type="${type}" itemid="${itemid}" worktype=${worktype}`);
        if (_IgnoreClose()) {
            ResetTimeouthandle();
            return;
        }
        if (worktype === 'craft_souvenir' && type === 'reward_redeemed') {
            // Once user completed "convert to souvenir" action from the checkout cart, this popup can close
            _ClosePopup();
            return;
        }
        if (type === 'xp_shop_use_ticket' || type === 'xp_shop_ack_tracks') {
            // Take the user to XP Shop UI
        }
        else if (type === 'keychain_tool_charges' && worktype === 'useitem') {
            const defidxContract = InventoryAPI.GetItemDefinitionIndexFromDefinitionName("Remove Keychain Tool");
            const fauxItemID = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(defidxContract, 0);
            // User has activated additional keychain tool charges - show them the final count of charges
            $.DispatchEvent("ShowCustomLayoutPopupParametersAsEvent", '', 'file://{resources}/layout/popups/popup_inventory_inspect.xml', 'item_id=' + fauxItemID +
                ',' + 'inspect_only=true');
        }
        else if (type === 'seasontiers') {
            if (worktype === 'useitem') {
                const popupPanel = UiToolkitAPI.ShowCustomLayoutPopup('id-popup-major-store', 'file://{resources}/layout/popups/popup_major_store.xml');
                popupPanel.Data().activatedCredits = cp.Data().majorCreditsToClaim;
            }
            else {
                return;
            }
        }
        else {
            $.DispatchEvent('ShowAcknowledgePopup', type, itemid);
        }
        OnEventToClose();
    }
    function _IgnoreClose() {
        return InspectShared.GetPopupSetting('work_type') === 'decodeable';
    }
    function _ComputeTotalSouvenirCost(cp, itemIdSouvenir) {
        const tempCreatedItem = itemIdSouvenir ?? InspectShared.GetPopupSetting('temp_display_item_id');
        $.Msg('_ComputeTotalSouvenirCost( ' + (cp ? cp.id : 'null') + ' itemid = ' + tempCreatedItem + '(' + itemIdSouvenir + ')');
        // Find the total cost of all gold stickers on this weapon
        let nTotalCostInCredits = 0;
        {
            const defidxStickerItem = InventoryAPI.GetItemDefinitionIndexFromDefinitionName('sticker');
            for (let i = 0; i < 6; ++i) {
                const idStickerKit = InventoryAPI.GetItemAttributeValue(tempCreatedItem, '{uint32}sticker slot ' + i + ' id');
                if (!idStickerKit)
                    continue;
                const idFauxSticker = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(defidxStickerItem, idStickerKit);
                const unCostInCredits = MissionsAPI.GetSeasonalOperationFauxCreditsCost(g_ActiveTournamentInfo.credits_id, idFauxSticker);
                if (unCostInCredits)
                    nTotalCostInCredits += unCostInCredits;
                else
                    nTotalCostInCredits += g_ActiveTournamentInfo.souvenir_cost;
            }
        }
        const discountAmount = InventoryAPI.GetItemSouvenirDiscountPercent(tempCreatedItem);
        const discountCredits = Math.trunc(nTotalCostInCredits * discountAmount / 100); // this is the "70% off" portion
        let discountPrice = nTotalCostInCredits;
        if (discountCredits < nTotalCostInCredits)
            discountPrice -= discountCredits;
        return { discountPrice: discountPrice, originalPrice: nTotalCostInCredits, discountAmount: discountAmount };
    }
    let m_SouvenirCheckoutCart = ShoppingCart.cart;
    function _OnVolatileShopSubscribe(nContainerDef, bNewPricesParsed, cp) {
        // This panel is for crafting souvenirs, and only has access to standalone cart, so it cares only about the stickers
        if (nContainerDef != g_ActiveTournamentInfo.itemid_dynamic_stickers)
            return;
        const nTotalCostInCredits = _ComputeTotalSouvenirCost(cp).discountPrice;
        if (m_SouvenirCheckoutCart !== ShoppingCart.cart) {
            // Sync Shopping car prices
            m_SouvenirCheckoutCart.syncPrices((itemId) => {
                return nTotalCostInCredits;
            });
        }
        // re-init pricing for the displayed stickers
        let oApplySettings = {
            headerPanel: $.GetContextPanel().FindChildInLayoutFile('PopUpCanApplyHeader'),
            infoPanel: $.GetContextPanel().FindChildInLayoutFile('PopUpCanApplyPickSlot'),
            asyncBarPanel: $.GetContextPanel().FindChildInLayoutFile('PopUpInspectAsyncBar'),
            contextPanel: $.GetContextPanel(),
            itemId: InspectShared.GetPopupSetting('temp_display_item_id') ? InspectShared.GetPopupSetting('temp_display_item_id') : InspectShared.GetPopupSetting('item_id'),
            toolId: InspectShared.GetPopupSetting('tool_id'),
            isRemove: false,
            type: '',
            funcOnConfirm: () => { },
            funcOnNext: () => { },
            funcOnCancel: () => { },
            funcOnSelectForRemove: () => { }
        };
        CanApplyPickSlot.Init(oApplySettings);
        _DiscountPanel(oApplySettings.contextPanel, oApplySettings.asyncBarPanel);
    }
    function _OnMyPersonaInventoryUpdated() {
        if (InspectShared.GetPopupSetting('is_season_pass') && InventoryAPI.IsValidItemID(InspectShared.GetPopupSetting('item_id'))) {
            return;
        }
        const worktype = InspectShared.GetPopupSetting('work_type');
        // don't interrupt user in the middle of these tasks
        if (worktype === "remove_sticker" ||
            worktype === "remove_patch" ||
            worktype === "remove_keychain" ||
            worktype === "can_sticker" ||
            worktype === "can_wrap_sticker" ||
            worktype === "craft_souvenir" ||
            worktype === "can_patch" ||
            worktype === "can_keychain" ||
            worktype === "useitem" ||
            worktype === "nameable") {
            return;
        }
        $.Msg("WARNING: ASYNC BAR CLOSING POPUP -- OnMyPersonaInventoryUpdated -- worktype=" + worktype + " ( if this is not expected, add an exclude above here )");
        OnEventToClose();
    }
    function _OnInventoryPrestigeCoinResponse(defidx, upgradeid, hours, prestigetime) {
        OnEventToClose();
        if (InspectShared.GetPopupSetting('work_type') === 'prestigecheck') {
            const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_inventory_inspect.xml');
            let oSettings = {
                item_id: InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(defidx, 0),
                show_work_type_warning: false,
                work_type: (upgradeid === '0') ? 'prestigeget' : 'prestigeupgrade'
            };
            elPanel.Data().oSettings = oSettings;
        }
        else if (upgradeid !== '0') {
            InventoryAPI.AcknowledgeNewItembyItemID(upgradeid);
            InventoryAPI.SetItemSessionPropertyValue(upgradeid, 'recent', '1');
            $.DispatchEvent('InventoryItemPreview', upgradeid, '');
        }
    }
})(InspectAsyncActionBar || (InspectAsyncActionBar = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfaW5zcGVjdF9hc3luYy1iYXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfaW5zcGVjdF9hc3luYy1iYXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyxpREFBaUQ7QUFDakQsOENBQThDO0FBQzlDLHNDQUFzQztBQUN0QyxnREFBZ0Q7QUFDaEQscURBQXFEO0FBQ3JELDRFQUE0RTtBQUM1RSxtREFBbUQ7QUFFbkQsSUFBVSxxQkFBcUIsQ0FzdUM5QjtBQXR1Q0QsV0FBVSxxQkFBcUI7SUFFOUIsSUFBSSxnQkFBZ0IsR0FBa0IsSUFBSSxDQUFDO0lBRTNDLFNBQWdCLElBQUk7UUFFbkIsTUFBTSxRQUFRLEdBQUcsYUFBYSxDQUFDLGVBQWUsQ0FBRSxXQUFXLENBQUUsQ0FBQztRQUM5RCxNQUFNLE1BQU0sR0FBRyxhQUFhLENBQUMsZUFBZSxDQUFFLFNBQVMsQ0FBRSxDQUFDO1FBQzFELE1BQU0saUJBQWlCLEdBQUcsYUFBYSxDQUFDLGVBQWUsQ0FBRSxpQkFBaUIsQ0FBRSxDQUFDO1FBQzdFLE1BQU0sV0FBVyxHQUFHLGFBQWEsQ0FBQyxlQUFlLENBQUUsWUFBWSxDQUFFLENBQUM7UUFDbEUsTUFBTSxxQkFBcUIsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUUsc0JBQXNCLENBQUUsQ0FBQztRQUVsRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsUUFBUSxDQUFFLHVCQUF1QixHQUFHLFFBQVEsQ0FBRSxDQUFDO1FBQ25FLE1BQU0sY0FBYyxHQUFHLGFBQWEsQ0FBQyxlQUFlLENBQUUsa0JBQWtCLENBQUUsQ0FBQztRQUMzRSxDQUFDLENBQUMsR0FBRyxDQUFFLGtCQUFrQixHQUFHLFFBQVEsR0FBRyxXQUFXLEdBQUcsYUFBYSxDQUFDLGVBQWUsQ0FBRSxTQUFTLENBQUUs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