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
        elAsyncActionBarPanel.FindChildInLayoutFile('InspectWeaponBtn').checked = true;
        _ShowHideInspectViewButtons(elAsyncActionBarPanel);
        _ChangeSceneryBtn(elAsyncActionBarPanel);
        _ShowZoomBtn(elAsyncActionBarPanel);
        elAsyncActionBarPanel.FindChildInLayoutFile('AsyncItemWorkCancelBtn').SetPanelEvent('onactivate', () => {
            if (_DefaultZoomView(worktype, elAsyncActionBarPanel) === false)
                _ClosePopup();
        });
        if (worktype === 'prestigecheck') {
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
            $.DispatchEvent('CSGOPlaySoundEffect', 'UI.StickerScratch', 'MOUSE');
            InventoryAPI.WearItemSticker(itemId, selectedSlot, 0);
        }
        else if (worktype === 'remove_keychain') {
            $.DispatchEvent('CSGOPlaySoundEffect', 'UI.StickerScratch', 'MOUSE');
            InventoryAPI.RemoveKeychain(itemId, 0);
        }
        else if (worktype === 'remove_sticker') {
            if (oSettings.remove_sticker_all_at_once) {
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
            CapabilityCanSticker.OnScratchSticker(itemId, selectedSlot, bForceRemoveSticker, oSettings.popup_panel);
        }
        else if (worktype === 'can_wrap_sticker' && !oSettings.tool_id) {
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
            $.DispatchEvent('CSGOPlaySoundEffect', 'sticker_applyConfirm', 'MOUSE');
            const popupPanel = UiToolkitAPI.ShowCustomLayoutPopupParameters('id-popup-shopping-cart-checkout', 'file://{resources}/layout/popups/popup_shopping_cart_checkout.xml', 'cartid=' + itemId +
                '&checkoutsuffix=_souvenir');
            popupPanel.Data().eventId = g_ActiveTournamentInfo.eventid;
        }
        else if (worktype === 'decodeable') {
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
            btnHoldAction.enabled = true;
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
            const unTeamIDs = [InventoryAPI.GetItemAttributeValue(goldenItemId, '{uint32}tournament event team0 id'),
                InventoryAPI.GetItemAttributeValue(goldenItemId, '{uint32}tournament event team1 id')];
            const unPlayerID = InventoryAPI.GetItemAttributeValue(goldenItemId, '{uint32}tournament mvp account id');
            let arrSelections = [];
            const defidxStickerItem = InventoryAPI.GetItemDefinitionIndexFromDefinitionName('sticker');
            g_ActiveTournamentTeams.filter((tt) => unTeamIDs.includes(tt.teamid)).forEach((tt) => {
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
                    _ClosePopup();
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
        if (worktype === 'decodeable') {
            const sRestriction = InventoryAPI.GetDecodeableRestriction(itemId);
            const elDescLabel = elPanel.FindChildInLayoutFile('AsyncItemWorkDesc');
            const elDescImage = elPanel.FindChildInLayoutFile('AsyncItemWorkDescImage');
            const inspectOnly = InspectShared.GetPopupSetting('inspect_only');
            if (inspectOnly || sRestriction === 'restricted' && !$.GetContextPanel().Data().existingRewardFromXrayId) {
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
                elOK.visible = true;
                elOK.text = '#popup_xray_button_goto';
                elOK.AddClass(btnStyle);
                elOK.SetPanelEvent('onactivate', () => {
                    $.DispatchEvent("ShowXrayCasePopup", !toolId ? '' : toolId, itemId, true);
                    _ClosePopup();
                });
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
        if (worktype === 'craft_souvenir')
            return;
        let elNegative = elAsyncActionBarPanel.FindChildInLayoutFile('AsyncItemWorkAcceptNegative');
        if (elNegative)
            elNegative.AddClass('hidden');
        elNegative = elAsyncActionBarPanel.FindChildInLayoutFile('AsyncItemWorkAcceptNegativeHold');
        if (elNegative)
            elNegative.AddClass('hidden');
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
        if (_IgnoreClose()) {
            ResetTimeouthandle();
            return;
        }
        if (worktype === 'craft_souvenir' && type === 'reward_redeemed') {
            _ClosePopup();
            return;
        }
        if (type === 'xp_shop_use_ticket' || type === 'xp_shop_ack_tracks') {
        }
        else if (type === 'keychain_tool_charges' && worktype === 'useitem') {
            const defidxContract = InventoryAPI.GetItemDefinitionIndexFromDefinitionName("Remove Keychain Tool");
            const fauxItemID = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(defidxContract, 0);
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
        const discountCredits = Math.trunc(nTotalCostInCredits * discountAmount / 100);
        let discountPrice = nTotalCostInCredits;
        if (discountCredits < nTotalCostInCredits)
            discountPrice -= discountCredits;
        return { discountPrice: discountPrice, originalPrice: nTotalCostInCredits, discountAmount: discountAmount };
    }
    let m_SouvenirCheckoutCart = ShoppingCart.cart;
    function _OnVolatileShopSubscribe(nContainerDef, bNewPricesParsed, cp) {
        if (nContainerDef != g_ActiveTournamentInfo.itemid_dynamic_stickers)
            return;
        const nTotalCostInCredits = _ComputeTotalSouvenirCost(cp).discountPrice;
        if (m_SouvenirCheckoutCart !== ShoppingCart.cart) {
            m_SouvenirCheckoutCart.syncPrices((itemId) => {
                return nTotalCostInCredits;
            });
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfaW5zcGVjdF9hc3luYy1iYXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfaW5zcGVjdF9hc3luYy1iYXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyxpREFBaUQ7QUFDakQsOENBQThDO0FBQzlDLHNDQUFzQztBQUN0QyxnREFBZ0Q7QUFDaEQscURBQXFEO0FBQ3JELDRFQUE0RTtBQUM1RSxtREFBbUQ7QUFFbkQsSUFBVSxxQkFBcUIsQ0FzdUM5QjtBQXR1Q0QsV0FBVSxxQkFBcUI7SUFFOUIsSUFBSSxnQkFBZ0IsR0FBa0IsSUFBSSxDQUFDO0lBRTNDLFNBQWdCLElBQUk7UUFFbkIsTUFBTSxRQUFRLEdBQUcsYUFBYSxDQUFDLGVBQWUsQ0FBRSxXQUFXLENBQUUsQ0FBQztRQUM5RCxNQUFNLE1BQU0sR0FBRyxhQUFhLENBQUMsZUFBZSxDQUFFLFNBQVMsQ0FBRSxDQUFDO1FBQzFELE1BQU0saUJBQWlCLEdBQUcsYUFBYSxDQUFDLGVBQWUsQ0FBRSxpQkFBaUIsQ0FBRSxDQUFDO1FBQzdFLE1BQU0sV0FBVyxHQUFHLGFBQWEsQ0FBQyxlQUFlLENBQUUsWUFBWSxDQUFFLENBQUM7UUFDbEUsTUFBTSxxQkFBcUIsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUUsc0JBQXNCLENBQUUsQ0FBQztRQUVsRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsUUFBUSxDQUFFLHVCQUF1QixHQUFHLFFBQVEsQ0FBRSxDQUFDO1FBQ25FLE1BQU0sY0FBYyxHQUFHLGFBQWEsQ0FBQyxlQUFlLENBQUUsa0JBQWtCLENBQUUsQ0FBQztRQUczRSxJQUFLLGFBQWEsQ0FBQyxlQUFlLENBQUUsc0JBQXNCLENBQUU7WUFDM0QsQ0FBQyxRQUFRO1lBQ1QsQ0FBRSxXQUFXLElBQUksQ0FBQyxpQkFB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