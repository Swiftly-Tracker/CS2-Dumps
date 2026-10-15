"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../common/async.ts" />
/// <reference path="../common/xpshop_tile_weapon_camera_settings.ts" />
/// <reference path="../common/iteminfo.ts" />
/// <reference path="../common/formattext.ts" />
/// <reference path="../common/icon.ts" />
/// <reference path="../common/store_items.ts" />
/// <reference path="../popups/popup_acknowledge_item.ts" />
/// <reference path="../popups/popup_offers_laptop.ts" />
/// <reference path="../itemtile_store.ts" />
var CollectionOffers;
(function (CollectionOffers) {
    class UniqueRandom {
        min;
        max;
        available = [];
        constructor(min, max) {
            this.min = min;
            this.max = max;
            this.reset();
        }
        reset() {
            this.available = [];
            for (let i = this.min; i <= this.max; i++) {
                this.available.push(i);
            }
        }
        getNext() {
            if (this.available.length === 0) {
                this.reset();
            }
            const index = Math.floor(Math.random() * this.available.length);
            const value = this.available[index];
            this.available.splice(index, 1);
            return value;
        }
    }
    function _GetRandomIntInRange(min, max) {
        if (min > max)
            [min, max] = [max, min];
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    let m_idContainerItem = "";
    let m_defidxContainerItem = 0;
    let m_numOfferCounter = 0;
    let m_bWrappingUpThisTransaction = false;
    let m_tmsExpectingXpGrantNotification = 0;
    CollectionOffers.m_currentOfferId = '';
    let m_numVolatileNotifications = 0;
    let m_initialDotsUpdateFinished = false;
    function _IsFinalOffer() {
        return (m_numOfferCounter <= 0);
    }
    function _CurrentOfferNumber() {
        return (m_numOfferCounter < 0) ? -m_numOfferCounter : m_numOfferCounter;
    }
    let m_signalBars = _GetRandomIntInRange(0, 1);
    let m_elScreen;
    let m_elMessagesParent;
    let m_elYesBtn;
    let m_elNoBtn;
    let m_elEndBtn;
    ;
    let m_mapUniqueRandoms = {};
    class MapLineTracker_t {
        data = {};
        getCount(s) { return this.data[s] || 0; }
        incrementCount(s) { return this.data[s] ? ++this.data[s] : (this.data[s] = 1); }
        async awaitMessageOnce(m) {
            if (this.incrementCount(m.line) != 1)
                return false;
            await _MakeMessage(m);
            return true;
        }
    }
    ;
    let m_mapLineTracker = new MapLineTracker_t;
    const dealerIntroMessage = {
        line: '#dealer_message_start_',
        sender: 'dealer',
        action: () => {
            _MakeMessage(dealerFirstOffer);
        }
    };
    const dealerReturningToContractMessage = {
        line: '#dealer_message_resume_',
        sender: 'dealer',
        action: () => {
            _DealerEstablishExistingOffer();
        }
    };
    const dealerFirstOffer = {
        line: '#dealer_message_first_offer_',
        sender: 'dealer',
        action: () => {
            _DealerSendOffer();
        }
    };
    const dealerNextOffer = {
        line: '#dealer_message_next_offer_',
        sender: 'dealer',
        action: () => {
            _DealerSendOffer();
        }
    };
    const dealerLastOffer = {
        line: '#dealer_message_last_offer_',
        sender: 'dealer',
    };
    const dealerEndOffer = {
        line: '#dealer_message_end_',
        sender: 'dealer',
    };
    const dealerOpenCheckOutMessage = {
        line: '#dealer_message_open_check_out_',
        sender: 'dealer',
        action: async () => {
            await Async.Delay(.25);
            _DealerTransitionToPurchaseState();
        }
    };
    const dealerTxnXldBailout = {
        line: '#dealer_message_txn_xld_bailout_',
        sender: 'dealer',
        action: async () => {
            await Async.Delay(2);
            _MakeMessage(systemDealerLeave);
        }
    };
    const dealerStatTrak = {
        line: '#dealer_message_stattrack_',
        sender: 'dealer'
    };
    const dealerFactoryNew = {
        line: '#dealer_message_factory_new_',
        sender: 'dealer'
    };
    const dealerMinimalWear = {
        line: '#dealer_message_minimal_wear_',
        sender: 'dealer'
    };
    const dealerCovert = {
        line: '#dealer_message_covert_',
        sender: 'dealer'
    };
    const dealerClassified = {
        line: '#dealer_message_classified_',
        sender: 'dealer'
    };
    const dealerRestricted = {
        line: '#dealer_message_restricted_',
        sender: 'dealer'
    };
    const dealerBattleScarred = {
        line: '#dealer_message_battle_scarred_',
        sender: 'dealer'
    };
    const dealerUsps = {
        line: '#dealer_message_usp-s_',
        sender: 'dealer'
    };
    const dealerItemDesc = {
        line: '#dealer_message_item_desc_',
        dialogVar: { dialogName: 'flavor-text', dialogText: '' },
        sender: 'dealer'
    };
    const dealerAdditionStatTrak = {
        line: '#dealer_message_addition_stattrak_',
        sender: 'dealer'
    };
    const dealerAdditionFactoryNew = {
        line: '#dealer_message_addition_factory_new_',
        sender: 'dealer'
    };
    const dealerOfferLimitMessage = {
        line: '#dealer_message_set_offer_limit_',
        sender: 'dealer',
        action: async () => {
            await Async.Delay(.5);
            _ShowMessageOfferLimit();
        }
    };
    const dealerContainerExpired = {
        line: '#dealer_message_timerexpired_',
        sender: 'dealer',
        action: () => {
            _MakeMessage(systemDealerLeaveContainerDestroy);
        }
    };
    const systemDealerJoin = {
        line: '#system_dealer_join_chat_0',
        sender: 'system',
        action: () => {
            _OnSystemDealerJoinBootstrap();
        }
    };
    const systemUserRejectOffer = {
        line: '#system_user_reject_offer_0',
        sender: 'system',
        nomarkup: true
    };
    const systemDealerLeave = {
        line: '#system_dealer_left_chat_0',
        sender: 'system',
        action: async () => {
            m_elScreen.FindChildInLayoutFile('id-laptop-connected-icon').SetHasClass('connected', false);
            m_elScreen.FindChildInLayoutFile('id-laptop-signal-icon').SetHasClass('connected-' + m_signalBars, false);
            await Async.Delay(1);
            Close(false);
        }
    };
    const systemDealerLeaveContainerDestroy = {
        line: '#system_dealer_left_chat_0',
        sender: 'system',
        action: async () => {
            m_elScreen.FindChildInLayoutFile('id-laptop-connected-icon').SetHasClass('connected', true);
            m_elScreen.FindChildInLayoutFile('id-laptop-signal-icon').SetHasClass('connected-' + m_signalBars, true);
            await Async.Delay(1);
            Close(true);
        }
    };
    const systemOfferLimitSetWithBootstrapAction = {
        line: '#system_user_updated_offer_limit_0',
        sender: 'system',
        action: async () => {
            await ShowDealerOfferLimitAcknowledge(true);
            const elWaitMessage = _ShowDealerWaitMessageDotDotDot();
            await Async.Delay(2);
            (await elWaitMessage).visible = false;
            _OnSystemDealerJoinBootstrap();
        }
    };
    const systemOfferLimitSet = {
        line: '#system_user_updated_offer_limit_0',
        sender: 'system',
        action: () => {
            ShowDealerOfferLimitAcknowledge();
        }
    };
    async function ShowDealerOfferLimitAcknowledge(firstTime = false) {
        let oLimits = JSON.parse(InventoryAPI.GetVolatileLimits());
        if (oLimits.limit !== 0) {
            const strLine = !firstTime ? '#dealer_message_limit_' : '#dealer_message_limit_first_time_';
            await _MakeMessage({ line: strLine, sender: 'dealer' });
        }
        else {
            const strLine = !firstTime ? '#dealer_message_limit_unlimited_' : '#dealer_message_limit_first_time_unlimited_';
            await _MakeMessage({ line: strLine, sender: 'dealer' });
        }
    }
    function Init(itemId, elScreen) {
        m_idContainerItem = itemId;
        m_defidxContainerItem = InventoryAPI.GetItemDefinitionIndex(m_idContainerItem);
        m_elMessagesParent = elScreen.FindChildInLayoutFile('id-chat-messages');
        m_elYesBtn = elScreen.FindChildInLayoutFile('id-user-message-yes');
        m_elNoBtn = elScreen.FindChildInLayoutFile('id-user-message-no');
        m_elEndBtn = elScreen.FindChildInLayoutFile('id-user-message-end');
        m_elScreen = elScreen;
        elScreen.FindChildInLayoutFile('id-laptop-screen-close').SetPanelEvent('onactivate', () => {
            OffersLaptop.ClosePopUp();
        });
        let setName = ItemInfo.GetSet(m_idContainerItem);
        if (!setName)
            setName = ItemInfo.GetSet(InventoryAPI.GetLootListItemIdByIndex(m_idContainerItem, 0));
        m_elMessagesParent.SetDialogVariable('collection', $.Localize('#CSGO_' + setName));
        _UpdateOfferTimer();
        _CollectionInfo();
        _SetTooltips(elScreen);
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', OnInventoryUpdated);
        $.RegisterForUnhandledEvent('PanoramaComponent_Store_PurchaseFinalizing', _OnPurchaseFinalizing);
        $.RegisterForUnhandledEvent('ShowStoreStatusPanel', _ShowStoreStatusPanel);
        _MakeMessage(systemDealerJoin);
        elScreen.SetPanelEvent('onactivate', () => { _MakeFingerPrints(elScreen); });
    }
    CollectionOffers.Init = Init;
    function _SetTooltips(elScreen) {
        elScreen.FindChildInLayoutFile('id-wear-fn').SetPanelEvent('onmouseover', () => { UiToolkitAPI.ShowTextTooltipStyled('id-wear-fn', '#SFUI_InvTooltip_Wear_Amount_0', 'tooltip-offer-wear'); });
        elScreen.FindChildInLayoutFile('id-wear-fn').SetPanelEvent('onmouseout', () => { UiToolkitAPI.HideTextTooltip(); });
        elScreen.FindChildInLayoutFile('id-wear-mw').SetPanelEvent('onmouseover', () => { UiToolkitAPI.ShowTextTooltipStyled('id-wear-mw', '#SFUI_InvTooltip_Wear_Amount_1', 'tooltip-offer-wear'); });
        elScreen.FindChildInLayoutFile('id-wear-mw').SetPanelEvent('onmouseout', () => { UiToolkitAPI.HideTextTooltip(); });
        elScreen.FindChildInLayoutFile('id-wear-ft').SetPanelEvent('onmouseover', () => { UiToolkitAPI.ShowTextTooltipStyled('id-wear-ft', '#SFUI_InvTooltip_Wear_Amount_2', 'tooltip-offer-wear'); });
        elScreen.FindChildInLayoutFile('id-wear-ft').SetPanelEvent('onmouseout', () => { UiToolkitAPI.HideTextTooltip(); });
        elScreen.FindChildInLayoutFile('id-wear-ww').SetPanelEvent('onmouseover', () => { UiToolkitAPI.ShowTextTooltipStyled('id-wear-ww', '#SFUI_InvTooltip_Wear_Amount_3', 'tooltip-offer-wear'); });
        elScreen.FindChildInLayoutFile('id-wear-ww').SetPanelEvent('onmouseout', () => { UiToolkitAPI.HideTextTooltip(); });
        elScreen.FindChildInLayoutFile('id-wear-bs').SetPanelEvent('onmouseover', () => { UiToolkitAPI.ShowTextTooltipStyled('id-wear-bs', '#SFUI_InvTooltip_Wear_Amount_4', 'tooltip-offer-wear'); });
        elScreen.FindChildInLayoutFile('id-wear-bs').SetPanelEvent('onmouseout', () => { UiToolkitAPI.HideTextTooltip(); });
        elScreen.FindChildInLayoutFile('id-weapon-wear-name-container').SetPanelEvent('onmouseover', () => { UiToolkitAPI.ShowTextTooltipStyled('id-weapon-wear-name-container', '#SFUI_InvTooltip_WearTag', 'tooltip-offer-wear'); });
        elScreen.FindChildInLayoutFile('id-weapon-wear-name-container').SetPanelEvent('onmouseout', () => { UiToolkitAPI.HideTextTooltip(); });
        elScreen.FindChildInLayoutFile('id-weapon-wear-rating-container').SetPanelEvent('onmouseover', () => { UiToolkitAPI.ShowTextTooltipStyled('id-weapon-wear-rating-container', '#SFUI_ItemInfo_WearAmount', 'tooltip-offer-wear'); });
        elScreen.FindChildInLayoutFile('id-weapon-wear-rating-container').SetPanelEvent('onmouseout', () => { UiToolkitAPI.HideTextTooltip(); });
        m_elScreen.FindChildInLayoutFile('id-laptop-connected-icon').SetPanelEvent('onmouseover', () => {
            let tooltipText = m_elScreen.FindChildInLayoutFile('id-laptop-connected-icon').BHasClass('connected') ? '#popup_vpn_status_connected' : '#popup_vpn_status_disconnected';
            UiToolkitAPI.ShowTextTooltipStyled('id-laptop-connected-icon', tooltipText, 'tooltip-laptop-topbar');
        });
        elScreen.FindChildInLayoutFile('id-laptop-connected-icon').SetPanelEvent('onmouseout', () => { UiToolkitAPI.HideTextTooltip(); });
        m_elScreen.FindChildInLayoutFile('id-offer-lootlist-btn').SetPanelEvent('onmouseover', () => { UiToolkitAPI.ShowTextTooltipStyled('id-offer-lootlist-btn', '#collection_xp_tooltip', 'tooltip-offer-wear'); });
        m_elScreen.FindChildInLayoutFile('id-offer-lootlist-btn').SetPanelEvent('onmouseout', () => { UiToolkitAPI.HideTextTooltip(); });
        m_elScreen.FindChildInLayoutFile('id-orignal-owner-image').SetPanelEvent('onmouseover', () => { UiToolkitAPI.ShowTextTooltipStyled('id-orignal-owner-image', '#laptop_original_seal_tooltip', 'tooltip-offer-wear'); });
        m_elScreen.FindChildInLayoutFile('id-orignal-owner-image').SetPanelEvent('onmouseout', () => { UiToolkitAPI.HideTextTooltip(); });
        m_elScreen.FindChildInLayoutFile('id-offer-zoom_hint').SetPanelEvent('onmouseover', () => { UiToolkitAPI.ShowTextTooltipStyled('id-offer-zoom_hint', '#laptop_zoom_tooltip', 'tooltip-offer-wear'); });
        m_elScreen.FindChildInLayoutFile('id-offer-zoom_hint').SetPanelEvent('onmouseout', () => { UiToolkitAPI.HideTextTooltip(); });
        m_elScreen.FindChildInLayoutFile('id-offer-pan_hint').SetPanelEvent('onmouseover', () => { UiToolkitAPI.ShowTextTooltipStyled('id-offer-pan_hint', '#laptop_pan_tooltip', 'tooltip-offer-actions'); });
        m_elScreen.FindChildInLayoutFile('id-offer-pan_hint').SetPanelEvent('onmouseout', () => { UiToolkitAPI.HideTextTooltip(); });
        m_elScreen.FindChildInLayoutFile('id-price-tooltip').SetPanelEvent('onmouseover', () => { UiToolkitAPI.ShowTextTooltipStyled('id-price-tooltip', '#laptop_pricing_tooltip', 'tooltip-offer-actions'); });
        m_elScreen.FindChildInLayoutFile('id-price-tooltip').SetPanelEvent('onmouseout', () => { UiToolkitAPI.HideTextTooltip(); });
    }
    function Close(destoryAnim = false) {
        _TimerUpdateCancel();
        m_elScreen.FindChildInLayoutFile('laptop-container').RemoveClass('open');
        OffersLaptop.ClosePopUp(destoryAnim);
    }
    CollectionOffers.Close = Close;
    function _RandomizeLocString(line) {
        if (line && line.length > 0 && line[0] === '#' && line[line.length - 1] === '_') {
            if (!m_mapUniqueRandoms.hasOwnProperty(line)) {
                const urMax = UiToolkitAPI.EnumerateLocalizationStringVariants(line);
                let ur = new UniqueRandom(0, urMax);
                m_mapUniqueRandoms[line] = ur;
            }
            const nrnd = m_mapUniqueRandoms[line].getNext();
            return line + nrnd;
        }
        return line;
    }
    async function _MakeMessage(oMessage) {
        m_elMessagesParent.SetDialogVariable('user-name', MyPersonaAPI.GetName());
        if (oMessage.dialogVar !== undefined) {
            m_elMessagesParent.SetDialogVariable(oMessage.dialogVar?.dialogName, oMessage.dialogVar.dialogText);
        }
        let locString = _RandomizeLocString(oMessage.line);
        let raw_string = $.Localize(locString, m_elMessagesParent);
        let allMessages = [];
        if (oMessage.nomarkup) {
            let message = {
                text: raw_string,
                sleepTime: Number(0),
                sender: oMessage.sender
            };
            allMessages.push(message);
        }
        else {
            let curTextIdx = 0;
            let sleepTime = Number(0);
            while (curTextIdx < raw_string.length) {
                let splitPos = raw_string.indexOf('<!--', curTextIdx);
                if (splitPos > curTextIdx) {
                    let message = {
                        text: raw_string.substring(curTextIdx, splitPos),
                        sleepTime: sleepTime,
                        sender: oMessage.sender
                    };
                    allMessages.push(message);
                }
                if (splitPos == -1) {
                    let message = {
                        text: raw_string.substring(curTextIdx),
                        sleepTime: sleepTime,
                        sender: oMessage.sender
                    };
                    allMessages.push(message);
                    break;
                }
                let indexEndOfSleepTime = raw_string.indexOf('-->', splitPos);
                if (indexEndOfSleepTime == -1)
                    break;
                sleepTime = Number(raw_string.substring(splitPos + 4, indexEndOfSleepTime));
                sleepTime = (sleepTime > 0) ? sleepTime : 0;
                curTextIdx = indexEndOfSleepTime + 3;
            }
        }
        for (const message of allMessages) {
            if (message.sleepTime > 0)
                await Async.Delay(message.sleepTime);
            OffersLaptop.LaptopSoundStartLooping('UI.Laptop.MessageLoop');
            await _DisplayMessage(message);
            OffersLaptop.LaptopSoundStopLooping('UI.Laptop.MessageLoop');
        }
        if (oMessage.hasOwnProperty('action') && oMessage.action !== undefined) {
            await oMessage.action();
        }
    }
    async function _DisplayMessage(message) {
        const elMessage = $.CreatePanel('Panel', m_elMessagesParent, '');
        elMessage.BLoadLayoutSnippet(message.sender + '-message');
        let aWords = message.text.split(' ');
        let elMessageLabel = elMessage.FindChildInLayoutFile('id-chat-message-label');
        elMessage.AddClass('show');
        _HighlightCurrentMessage();
        elMessageLabel.html = (message.sender !== 'system');
        if (message.sender === 'dealer') {
            elMessage.FindChildInLayoutFile('id-chat-message-label-placeholder');
            elMessage.FindChildInLayoutFile('id-chat-message-label-placeholder').text = message.text;
            elMessage.FindChildInLayoutFile('avatar-image').SetDefaultImage("file://{images}/avatars/arms_dealer.psd");
            await Async.Delay(.1);
            m_elMessagesParent.ScrollToBottom();
            let displayString = '';
            for (const word of aWords) {
                await Async.Delay(.05);
                displayString = displayString + word + ' ';
                elMessageLabel.text = displayString;
            }
        }
        else {
            elMessageLabel.text = message.text;
            await Async.Delay(.1);
            m_elMessagesParent.ScrollToBottom();
        }
    }
    async function _OnSystemDealerJoinBootstrap() {
        let numOffers = InventoryAPI.GetItemAttributeValue(m_idContainerItem, '{uint32}quest points remaining');
        let oLimits = JSON.parse(InventoryAPI.GetVolatileLimits());
        if (numOffers == undefined) {
            m_numOfferCounter = 0;
            await _MakeMessage(dealerIntroMessage);
        }
        else {
            m_numOfferCounter = numOffers;
            await _MakeMessage(dealerReturningToContractMessage);
        }
        const setting = oLimits.choices.find(item => item.limit === oLimits.limit);
        m_elScreen.SetDialogVariable('limit', GetLimitString(setting?.limit, setting?.label));
        m_elScreen.FindChildInLayoutFile('id-offer-limit-setting').SetPanelEvent('onactivate', () => {
            ShowOfferLimitPopup();
        });
        m_elScreen.FindChildInLayoutFile('id-laptop-connected-icon').SetHasClass('connected', true);
        m_elScreen.FindChildInLayoutFile('id-laptop-signal-icon').SetHasClass('connected-' + m_signalBars, true);
    }
    async function _ShowDealerWaitMessageDotDotDot(bPreserveOfferID) {
        const elWaitMessage = $.CreatePanel('Panel', m_elMessagesParent, '');
        elWaitMessage.BLoadLayoutSnippet('wait-message');
        elWaitMessage.FindChildInLayoutFile('avatar-image').SetDefaultImage("file://{images}/avatars/arms_dealer.psd");
        elWaitMessage.AddClass('show');
        await Async.Delay(.1);
        m_elMessagesParent.ScrollToBottom();
        if (bPreserveOfferID) {
            await Async.Delay(.1);
        }
        else {
            CollectionOffers.m_currentOfferId = '';
            m_numVolatileNotifications = 0;
        }
        return elWaitMessage;
    }
    async function _AwaitOfferItemID(bJustNotificationIsOk) {
        for (let i = 5; i-- > 0;) {
            await Async.Delay(1);
            if (bJustNotificationIsOk && (m_numVolatileNotifications > 0)) {
                return CollectionOffers.m_currentOfferId ? CollectionOffers.m_currentOfferId : m_idContainerItem;
            }
            if (CollectionOffers.m_currentOfferId) {
                return CollectionOffers.m_currentOfferId;
            }
        }
        UiToolkitAPI.ShowGenericPopupOk($.Localize('#SFUI_SteamConnectionErrorTitle'), $.Localize('#PlayMenu_unavailable_newuser_2_nogcconnection'), '', () => { });
        Close(false);
        return '';
    }
    async function _ReplaceMessageDotDotDotWithOffer(elWaitMessage) {
        UpdateCollectionDots();
        elWaitMessage.FindChildInLayoutFile('id-waiting').visible = false;
        const OfferItemData = _GetItemData(CollectionOffers.m_currentOfferId);
        _HighlightCurrentMessage();
        await _DisplayOfferDownloadMessage(elWaitMessage, OfferItemData);
        _UpdateWeaponModel(OfferItemData);
        await _MessageOfferComment(OfferItemData);
        await Async.Delay(.1);
        m_elMessagesParent.ScrollToBottom();
        m_elScreen.FindChildInLayoutFile('id-chat-messages-bg').SetHasClass('show', true);
        let elUserButtonContainer = m_elScreen.FindChildInLayoutFile('id-user-messages-container');
        if (!elUserButtonContainer.BHasClass('show')) {
            elUserButtonContainer.SetHasClass('show', true);
        }
        if (_IsFinalOffer()) {
            elUserButtonContainer.SetDialogVariable('user-response-title', $.Localize('#user_btn_purchase_final_title'));
        }
        else {
            elUserButtonContainer.SetDialogVariable('offer-count', $.Localize('#dealer_offer_' + _CurrentOfferNumber()));
            elUserButtonContainer.SetDialogVariable('user-response-title', $.Localize('#user_btn_purchase_title', elUserButtonContainer));
        }
        _SetUpUserOfferConfirmDeclineBtns(elWaitMessage.FindChildInLayoutFile('id-offer-' + OfferItemData.itemId), OfferItemData);
    }
    async function _DealerEstablishExistingOffer() {
        const elWaitMessage = await _ShowDealerWaitMessageDotDotDot();
        InventoryAPI.PerformItemCasketTransaction(0, m_idContainerItem, m_idContainerItem);
        if (!await _AwaitOfferItemID())
            return;
        await _ReplaceMessageDotDotDotWithOffer(elWaitMessage);
    }
    async function _DealerSendOffer() {
        let elWaitMessage = await _ShowDealerWaitMessageDotDotDot();
        InventoryAPI.UseToolWithIntArg(m_idContainerItem, m_idContainerItem, m_numOfferCounter);
        if (!await _AwaitOfferItemID())
            return;
        if (_IsFinalOffer()) {
            elWaitMessage.RemoveAndDeleteChildren();
            await _MakeMessage(dealerLastOffer);
            elWaitMessage = await _ShowDealerWaitMessageDotDotDot(true);
        }
        await _ReplaceMessageDotDotDotWithOffer(elWaitMessage);
    }
    async function _DealerEndTransaction() {
        const elWaitMessage = await _ShowDealerWaitMessageDotDotDot();
        InventoryAPI.UseToolWithIntArg(m_idContainerItem, m_idContainerItem, m_numOfferCounter);
        m_bWrappingUpThisTransaction = true;
        if (!await _AwaitOfferItemID(true))
            return;
        elWaitMessage.RemoveAndDeleteChildren();
        await _MakeMessage(dealerEndOffer);
        await Async.Delay(2.5);
        await _MakeMessage(systemDealerLeaveContainerDestroy);
    }
    async function _DealerTransitionToPurchaseState() {
        const strPurchaseString = '' + InventoryAPI.GetItemDefinitionIndex(m_idContainerItem) + '(' + m_idContainerItem + ')';
        StoreAPI.StoreItemPurchase(strPurchaseString);
    }
    function _OnPurchaseFinalizing(strTxnID) {
        m_bWrappingUpThisTransaction = true;
        const storeStatusMessage = {
            line: '#dealer_message_purchase_finalizing_0',
            sender: 'system'
        };
        _MakeMessage(storeStatusMessage);
    }
    function _ShowStoreStatusPanel(strText, bAllowClose, bCancel, strOkCmd) {
        if (strText === '#StoreCheckout_TransactionCanceled') {
            _MakeMessage(dealerTxnXldBailout);
            return;
        }
        if (bCancel)
            return;
        if (strText === '#StoreCheckout_TransactionCompleted') {
            const storeStatusMessage = {
                line: strText,
                sender: 'system-success',
                action: () => {
                    _EnableActionButtons(false);
                }
            };
            _MakeMessage(storeStatusMessage);
            return;
        }
        const storeStatusMessage = {
            line: strText,
            sender: 'system-steam',
            action: () => {
                const bCanRetryPurchase = !m_bWrappingUpThisTransaction &&
                    (strText !== '#StoreCheckout_PurchaseExpiredItemsUnavailable') &&
                    (strText !== '#StoreCheckout_CompleteButUnfinalized');
                _EnableActionButtons(bCanRetryPurchase);
            }
        };
        _MakeMessage(storeStatusMessage);
    }
    async function _MessageOfferComment(OfferItemData) {
        if (OfferItemData.rarity === 6 || OfferItemData.rarity === 5) {
            if (OfferItemData.rarity === 6) {
                await _MakeMessage(dealerCovert);
            }
            else if (OfferItemData.rarity === 5) {
                await _MakeMessage(dealerClassified);
            }
            if (OfferItemData.statTrack) {
                await _MakeMessage(dealerAdditionStatTrak);
            }
            else if (OfferItemData.numWear === 0) {
                await _MakeMessage(dealerAdditionFactoryNew);
            }
        }
        else if (OfferItemData.numWear === 0) {
            await _MakeMessage(dealerFactoryNew);
        }
        else if (OfferItemData.statTrack) {
            await _MakeMessage(dealerStatTrak);
        }
        else if (OfferItemData.numWear === 1 && _RollChance(50)
            && (await m_mapLineTracker.awaitMessageOnce(dealerMinimalWear))) {
            ;
        }
        else if (OfferItemData.rarity === 4 && _RollChance(50)
            && (await m_mapLineTracker.awaitMessageOnce(dealerRestricted))) {
            ;
        }
        else if (OfferItemData.numWear === 4 && _RollChance(50)
            && (await m_mapLineTracker.awaitMessageOnce(dealerBattleScarred))) {
            ;
        }
        else if (_RollChance(10) && (0 == m_mapLineTracker.getCount(dealerItemDesc.line))) {
            if (InventoryAPI.GetItemDescription(OfferItemData.itemId, '')) {
                if (dealerItemDesc.dialogVar !== undefined) {
                    const descString = InventoryAPI.GetItemDescription(OfferItemData.itemId, '');
                    const offFlavor = descString.indexOf("<i>");
                    const endFlavor = descString.indexOf("</i>", offFlavor);
                    if (offFlavor != -1 && endFlavor != -1 && endFlavor > offFlavor) {
                        dealerItemDesc.dialogVar.dialogText = descString.substring(offFlavor, endFlavor + 4);
                        if (dealerItemDesc.dialogVar.dialogText.indexOf('<!--') == -1) {
                            m_mapLineTracker.incrementCount(dealerItemDesc.line);
                            await _MakeMessage(dealerItemDesc);
                        }
                    }
                }
            }
        }
    }
    function _GetItemData(itemId) {
        const OfferItemData = {
            itemId: itemId,
            defName: InventoryAPI.GetItemDefinitionName(itemId),
            rarity: InventoryAPI.GetItemRarity(itemId),
            rarityName: InventoryAPI.GetItemType(itemId),
            rarityColor: InventoryAPI.GetItemRarityColor(itemId),
            itemName: InventoryAPI.GetItemName(itemId),
            statTrack: (InventoryAPI.GetItemAttributeValue(itemId, "kill eater")) !== undefined ? true : false,
            itemType: ItemInfo.IsWeapon(itemId) ? 'weapon' : ItemInfo.IsKeychain(itemId) ? 'keychain' : 'sticker',
            slot: InventoryAPI.GetLoadoutCategory(itemId),
            numWear: InventoryAPI.GetWear(itemId),
            price: StoreAPI.GetStoreItemEmbeddedAttributePrice(itemId, 1, '')
        };
        return OfferItemData;
    }
    function _HighlightCurrentMessage() {
        m_elMessagesParent.Children().forEach((element, index) => {
            element.SetHasClass('current-message', index == (m_elMessagesParent.Children().length - 1));
        });
    }
    function _DisplayOfferDownloadMessage(elWaitMessage, OfferItemData) {
        const elOffer = $.CreatePanel('Panel', elWaitMessage.FindChildInLayoutFile('id-message'), 'id-offer-' + OfferItemData.itemId);
        elOffer.BLoadLayoutSnippet('dealer-offer');
        elOffer.FindChildInLayoutFile('id-offer-message-image').itemid = OfferItemData.itemId;
        _SetRarityColor(elOffer.FindChildInLayoutFile('id-offer-message-rarity'), OfferItemData.rarityColor);
        _SetRarityColor(m_elScreen.FindChildInLayoutFile('id-chat-messages-bg'), OfferItemData.rarityColor);
        elOffer.AddClass('glow-color-rarity-' + OfferItemData.rarity);
        elOffer.SetDialogVariable('offer-count', $.Localize('#EOM_Position_' + _CurrentOfferNumber()));
        elOffer.FindChildInLayoutFile('id-offer-desc').text =
            _IsFinalOffer() ?
                $.Localize('#dealer_offer_attachment_final', elOffer) :
                $.Localize('#dealer_offer_received_count', elOffer);
        elOffer.SetDialogVariable('item-name', OfferItemData.itemName);
        elOffer.SetDialogVariable('item-rarity', $.Localize('#SFUI_InvTooltip_Wear_Amount_' + OfferItemData.numWear));
        elOffer.SetDialogVariable('offer-price', OfferItemData.price);
        elOffer.SetDialogVariable('offer-status', $.Localize('#dealer_offer_attachment_status-price', elOffer));
        elOffer.AddClass('show');
    }
    function _SetRarityColor(elPanel, rarityColor) {
        if (rarityColor) {
            elPanel.style.washColor = rarityColor;
        }
    }
    let m_timerHandler = null;
    function _UpdateOfferTimer() {
        _TimerUpdateCancel();
        const elTimer = m_elScreen.FindChildInLayoutFile('id-offer-expiration');
        if (!m_idContainerItem || m_bWrappingUpThisTransaction) {
            elTimer.SetDialogVariable('expiration-time', ' ');
            return;
        }
        const expirationDate = InventoryAPI.GetExpirationDate(m_idContainerItem);
        let oLocData = FormatText.FormatExpirationToDDHHMMSSWithSymbolSeperator(expirationDate);
        _SetBatteryState(oLocData, expirationDate);
        if (oLocData.isExpired || !InventoryAPI.IsValidItemID(m_idContainerItem)) {
            elTimer.SetDialogVariable('expiration-time', $.Localize('#op_pass_status_operation_over'));
            return;
        }
        elTimer.SetDialogVariable('expiration-time', oLocData.time);
        elTimer.FindChildInLayoutFile('id-offer-expiration-timer').SetPanelEvent('onmouseover', () => {
            UiToolkitAPI.ShowTextTooltipStyled('id-offer-expiration-timer', '#laptop_expiration_tooltip', 'tooltip-offer-actions');
        });
        elTimer.FindChildInLayoutFile('id-offer-expiration-timer').SetPanelEvent('onmouseout', () => {
            UiToolkitAPI.HideTextTooltip();
        });
        m_timerHandler = $.Schedule(1, _UpdateOfferTimer);
    }
    function _SetBatteryState(oLocData, expirationDate) {
        const elBattery = m_elScreen.FindChildInLayoutFile('id-laptop-battery');
        const barPercentage = oLocData.isExpired ? 18 : Math.floor(Math.max(18, Math.min(oLocData.seconds / 2592, 100)));
        elBattery.SwitchClass('state', oLocData.isExpired ? 'red' : (barPercentage < 40) ? 'yellow' : 'green');
        elBattery.style.width = barPercentage.toString() + '%;';
        elBattery.SetDialogVariableInt('percent', barPercentage);
        m_elScreen.FindChildInLayoutFile('id-laptop-battery-container').SetPanelEvent('onmouseover', () => {
            let tooltipText = $.Localize('#laptop_battery_tooltip', elBattery);
            UiToolkitAPI.ShowTextTooltipStyled('id-laptop-battery-container', tooltipText, 'tooltip-laptop-topbar');
        });
        m_elScreen.FindChildInLayoutFile('id-laptop-battery-container').SetPanelEvent('onmouseout', () => { UiToolkitAPI.HideTextTooltip(); });
    }
    function _TimerUpdateCancel() {
        if (m_timerHandler !== null) {
            $.CancelScheduled(m_timerHandler);
            m_timerHandler = null;
        }
    }
    function _EnableActionButtons(bEnable = false) {
        if (m_bWrappingUpThisTransaction)
            bEnable = false;
        m_elYesBtn.enabled = bEnable;
        m_elNoBtn.enabled = bEnable;
        m_elEndBtn.enabled = bEnable;
        m_elScreen.FindChildInLayoutFile('id-offer-limit-setting').enabled = bEnable;
        m_elScreen.FindChildInLayoutFile('id-price-tooltip').SetHasClass('faded', !bEnable);
    }
    let _m_savedOffer = null;
    let _m_savedOfferItemData = null;
    function _SetUpUserOfferConfirmDeclineBtns(elOffer, OfferItemData) {
        _m_savedOffer = elOffer;
        _m_savedOfferItemData = OfferItemData;
        const numPaidAlready = 0;
        let payPrice = OfferItemData.price;
        m_elYesBtn.SetDialogVariable('price', payPrice);
        m_elYesBtn.visible = true;
        m_elNoBtn.visible = !_IsFinalOffer() && (numPaidAlready === 0);
        m_elEndBtn.visible = _IsFinalOffer() && (numPaidAlready === 0);
        m_elScreen.FindChildInLayoutFile('id-offer-limit-setting').visible = (numPaidAlready === 0);
        m_elScreen.FindChildInLayoutFile('id-price-tooltip').visible = (numPaidAlready === 0);
        if (m_elYesBtn.visible) {
            const btnYesSettings = {
                btn: m_elYesBtn,
                tooltip: '#user_btn_purchase_desc_purchase',
                locString: $.Localize(_RandomizeLocString('#user_btn_accept_'), m_elYesBtn),
                tooltipStyle: 'tooltip-offer-actions',
                loopingSound: 'UI.Laptop.ButtonFillLoop',
                timerCompleteAction: () => {
                    _EnableActionButtons(false);
                    _MakeMessage(dealerOpenCheckOutMessage);
                    OffersLaptop.LaptopSoundPlayOnce('UI.Laptop.Drop.Purchased');
                }
            };
            HoldButton.SetupButton(btnYesSettings);
        }
        if (m_elEndBtn.visible) {
            const btnEndSettings = {
                btn: m_elEndBtn,
                tooltip: '#user_btn_purchase_desc_end',
                locString: $.Localize('#user_btn_end'),
                tooltipStyle: 'tooltip-offer-actions',
                loopingSound: 'UI.Laptop.ButtonFillLoop',
                timerCompleteAction: () => {
                    _EnableActionButtons(false);
                    _DealerEndTransaction();
                }
            };
            HoldButton.SetupButton(btnEndSettings);
        }
        if (m_elNoBtn.visible) {
            const btnNoSettings = {
                btn: m_elNoBtn,
                tooltip: '#user_btn_purchase_desc_continue',
                locString: $.Localize(_IsFinalOffer() ? '#user_btn_decline' : _RandomizeLocString('#user_btn_next_'), m_elNoBtn),
                tooltipStyle: 'tooltip-offer-actions',
                loopingSound: 'UI.Laptop.ButtonFillLoop',
                timerCompleteAction: () => {
                    _EnableActionButtons(false);
                    elOffer.SetHasClass('rejected', true);
                    elOffer.SetDialogVariable('offer-status', $.Localize('#dealer_offer_attachment_status-declined-price', elOffer));
                    elOffer.FindChildInLayoutFile('id-offer-desc').text = $.Localize('#dealer_offer_attachment_status-declined', elOffer);
                    m_elScreen.FindChildInLayoutFile('id-offer-preview-panel-container').SetHasClass('show', false);
                    m_elScreen.FindChildInLayoutFile('id-weapon-wear-rating-pointer').style.transform = 'translateX(100%) translateY(3px) scaleY(-1);';
                    m_elScreen.FindChildInLayoutFile('id-chat-messages-bg').SetHasClass('show', false);
                    OffersLaptop.LaptopSoundPlayOnce('UI.Laptop.Drop.Discarded');
                    const elModel = m_elScreen.FindChildInLayoutFile('id-offer-preview-panel');
                    if (elModel) {
                        elModel.DeleteAsync(.25);
                    }
                    _MakeMessage(systemUserRejectOffer);
                    _MakeMessage(dealerNextOffer);
                }
            };
            HoldButton.SetupButton(btnNoSettings);
        }
        _EnableActionButtons(numPaidAlready === 0);
    }
    function OnInventoryUpdated() {
        if (m_bWrappingUpThisTransaction)
            return;
        if (InventoryAPI.IsValidItemID(m_idContainerItem))
            return;
        _UpdateOfferTimer();
        m_bWrappingUpThisTransaction = true;
        m_idContainerItem = '';
        _EnableActionButtons(false);
        m_elEndBtn.enabled = false;
        _MakeMessage(dealerContainerExpired);
    }
    CollectionOffers.OnInventoryUpdated = OnInventoryUpdated;
    function OnItemCustomizationNotification(numericType, szType, itemid) {
        if (szType === 'xpgrant' && m_tmsExpectingXpGrantNotification) {
            m_tmsExpectingXpGrantNotification = 0;
            _XpCollectionPopup();
            UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_acknowledge_xpgrant.xml', 'none');
            return;
        }
        if (numericType !== 1012 || !szType || !szType.startsWith("casket_contents"))
            return;
        if (itemid !== m_idContainerItem)
            return;
        ++m_numVolatileNotifications;
        let numOffers = InventoryAPI.GetItemAttributeValue(m_idContainerItem, '{uint32}quest points remaining');
        if (numOffers === undefined)
            m_numOfferCounter = 0;
        else {
            m_numOfferCounter = numOffers;
        }
        InventoryAPI.SetInventorySortAndFilters('inv_sort_age', false, "casketcontents:" + m_idContainerItem, '', '');
        const count = InventoryAPI.GetInventoryCount();
        const offerItemID = (count && (count > 0)) ? InventoryAPI.GetInventoryItemIDByIndex(0) : "";
        if (!offerItemID)
            return;
        if (!InventoryAPI.IsValidItemID(offerItemID))
            return;
        CollectionOffers.m_currentOfferId = offerItemID;
    }
    CollectionOffers.OnItemCustomizationNotification = OnItemCustomizationNotification;
    function _UpdateWeaponModel(OfferItemData) {
        let cameraData = XpShopWeaponCameraSettings.CameraSettings.find(({ type }) => type === OfferItemData.defName);
        let cameraSuffix = cameraData !== undefined ? cameraData.camera : '0';
        let camera = 'camera_' + OfferItemData.itemType + '_' + cameraSuffix;
        let elModel = m_elScreen.FindChildInLayoutFile('id-offer-preview-panel');
        let slot = InventoryAPI.GetDefaultSlot(OfferItemData.itemId);
        let rotationDeg = slot === 'clothing_hands' ? 0 : 360;
        let rotationXAmount = slot === 'clothing_hands' ? 0 : 30;
        let rotationYAmount = slot === 'clothing_hands' ? 0 : 20;
        let rotationPeriod = slot === 'clothing_hands' ? 0 : 16;
        if (!elModel) {
            elModel = _MakeMapItemPreviewPanel("ui/xpshop_item", !(slot === 'clothing_hands'));
            m_elScreen.defaultfocus = 'id-offer-preview-panel';
        }
        m_elScreen.FindChildInLayoutFile('id-offer-camera-hints').visible = !(slot === 'clothing_hands');
        elModel.SetRotationLimits(rotationDeg, rotationDeg);
        elModel.SetAutoRotateAmount(rotationXAmount, rotationYAmount);
        elModel.SetAutoRotatePeriod(rotationPeriod, rotationPeriod);
        elModel.SetActiveItem(0);
        elModel.SetItemItemId(OfferItemData.itemId, '');
        elModel.SetCamera(camera);
        if (elModel.PanZoomEnabled()) {
            elModel.SetAcceptsFocus(true);
            elModel.ResetPanZoom();
            elModel.SetFocus();
        }
        m_elScreen.FindChildInLayoutFile('id-offer-preview-panel-container').SetHasClass('show', true);
        elModel.SetCSMSplitPlane0DistanceOverride(85.0);
        _UpdateModelData(OfferItemData);
    }
    function _UpdateModelData(OfferItemData) {
        let elParent = m_elScreen.FindChildInLayoutFile('id-offer-preview-panel-info');
        let setName = ItemInfo.GetSet(OfferItemData.itemId);
        DecodeText.Init(OfferItemData.itemName, elParent.FindChildInLayoutFile('id-offer-item-name-container'), 'window__weapon-info__name-letter');
        DecodeText.Init(OfferItemData.rarityName, elParent.FindChildInLayoutFile('id-offer-item-rarity-container'), 'window__weapon-info__name-letter');
        elParent.FindChildInLayoutFile('id-offer-item-rarity-container').style.backgroundColor = OfferItemData.rarityColor;
        _SetRarityColor(m_elScreen.FindChildInLayoutFile('id-offer-preview-glow'), OfferItemData.rarityColor);
        _SetRarityColor(m_elScreen.FindChildInLayoutFile('id-offer-preview-gradient'), OfferItemData.rarityColor);
        const certData = InventoryAPI.GetItemCertificateInfo(OfferItemData.itemId);
        const aCertData = certData.split("\n");
        let elCollectionImage = m_elScreen.FindChildInLayoutFile('id-offer-preview-collection-icon');
        elCollectionImage.itemid = OfferItemData.itemId;
        IconUtil.SetupFallbackItemSetIcon(elCollectionImage, setName);
        IconUtil.SetItemSetSVGImage(elCollectionImage, setName);
        for (let i = 0; i < aCertData.length - 1; i++) {
            if (i % 2 == 0) {
                if (i < 5) {
                    let elCertContainer = m_elScreen.FindChildInLayoutFile('id-offer-cert-info');
                    let elCertLine = elCertContainer.FindChildInLayoutFile('item-cert-' + i);
                    if (!elCertLine) {
                        elCertLine = $.CreatePanel('Panel', elCertContainer, 'item-cert-' + i);
                        elCertLine.BLoadLayoutSnippet('cert-row');
                    }
                    elCertLine.SetDialogVariable('cert_title', aCertData[i] + ' : ');
                    elCertLine.SetDialogVariable('cert_desc', aCertData[i + 1]);
                }
                if (i === 6) {
                    DecodeText.Init(aCertData[i + 1], (m_elScreen.FindChildInLayoutFile('id-weapon-wear-rating-container')), '');
                    const elPointer = m_elScreen.FindChildInLayoutFile('id-weapon-wear-rating-pointer');
                    const pointerOffset = (elPointer.actuallayoutwidth / 2) / elPointer.actualuiscale_x;
                    elPointer.style.transform = 'translateX(' + ((400 * (parseFloat(aCertData[i + 1]))) - pointerOffset) + 'px) translateY(2px) scaleY(-1)';
                }
                if (i === 8) {
                    DecodeText.Init(aCertData[i + 1], (m_elScreen.FindChildInLayoutFile('id-weapon-wear-name-container')), '');
                }
            }
        }
        m_elScreen.FindChildInLayoutFile('id-offer-preview-inspect-btn').SetPanelEvent('onactivate', () => {
            const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_inventory_inspect.xml');
            let oSettings = {
                item_id: OfferItemData.itemId,
                inspect_only: true,
                hide_all_action_items: true
            };
            elPanel.Data().oSettings = oSettings;
        });
        switch (OfferItemData.rarity) {
            case 3:
                OffersLaptop.LaptopSoundPlayOnce('UI.Laptop.Drop.Blue');
                break;
            case 4:
                OffersLaptop.LaptopSoundPlayOnce('UI.Laptop.Drop.Purple');
                break;
            case 5:
                OffersLaptop.LaptopSoundPlayOnce('UI.Laptop.Drop.Pink');
                break;
            case 6:
                OffersLaptop.LaptopSoundPlayOnce('UI.Laptop.Drop.Red');
                break;
        }
    }
    function _MakeMapItemPreviewPanel(mapName, isGloves) {
        return $.CreatePanel('MapItemPreviewPanel', m_elScreen.FindChildInLayoutFile('id-offer-preview-panel-container'), 'id-offer-preview-panel', {
            class: 'window__offer__preview-panel',
            "require-composition-layer": "true",
            'transparent-background': true,
            'disable-depth-of-field': true,
            camera: 'default',
            player: "false",
            map: mapName,
            initial_entity: 'item',
            active_item_idx: 0,
            mouse_rotate: "true",
            rotation_limit_x: "0",
            rotation_limit_y: "0",
            auto_rotate_x: "0",
            auto_rotate_y: "0",
            auto_rotate_period_x: "0",
            auto_rotate_period_y: "0",
            auto_recenter: true,
            panzoom_enabled: isGloves,
            tabindex: "auto",
            selectionpos: "auto",
            hittest: "true",
            hide_while_waiting_for_composite_materials: "false"
        });
    }
    let m_fingerPrintCount = 0;
    function _MakeFingerPrints(elPanel) {
        const mousePosition = $.MousePosition();
        const panelPosition = m_elScreen.FindChildInLayoutFile('id-laptop-finger-prints').GetPositionWithinWindow();
        panelPosition.x = panelPosition.x / m_elScreen.actualuiscale_x;
        panelPosition.y = panelPosition.y / m_elScreen.actualuiscale_y;
        mousePosition.x = mousePosition.x / m_elScreen.actualuiscale_x;
        mousePosition.y = mousePosition.y / m_elScreen.actualuiscale_y;
        const mouseInPanelPosition = { x: mousePosition.x - panelPosition.x, y: mousePosition.y - panelPosition.y };
        if (m_fingerPrintCount >= 40) {
            m_fingerPrintCount = 0;
        }
        let elImage = m_elScreen.FindChildInLayoutFile('id-laptop-finger-prints').FindChild('finger-' + m_fingerPrintCount);
        if (!elImage) {
            elImage = $.CreatePanel('Image', m_elScreen.FindChildInLayoutFile('id-laptop-finger-prints'), 'finger-' + m_fingerPrintCount, { hittest: 'false' });
            elImage.SetHasClass('finger-print', true);
            m_fingerPrintCount++;
            elImage.style.x = mouseInPanelPosition.x + 'px';
            elImage.style.y = mouseInPanelPosition.y + 'px';
            const rotate = _GetRandomIntInRange(-30, 25);
            const opacity = _GetRandomIntInRange(2, 5) / 100;
            elImage.style.transform = 'translateY(128px) translateX(-64px) rotateZ(' + rotate + 'deg);';
            elImage.style.opacity = opacity.toString();
        }
        else {
            elImage.style.x = mouseInPanelPosition.x + 'px';
            elImage.style.y = mouseInPanelPosition.y + 'px';
            const rotate = _GetRandomIntInRange(-30, 25);
            elImage.style.transform = 'translateY(128px) translateX(-64px) rotateZ(' + rotate + 'deg);';
        }
        m_fingerPrintCount++;
    }
    function _RollChance(chancePercent) {
        if (chancePercent <= 0)
            return false;
        if (chancePercent >= 100)
            return true;
        const roll = Math.random() * 100;
        return roll < chancePercent;
    }
    function _CollectionInfo() {
        const elCollectionImage = m_elScreen.FindChildInLayoutFile('id-offer-collection-icon');
        const collectionName = InventoryAPI.GetSet(InventoryAPI.GetLootListItemIdByIndex(m_idContainerItem, 0));
        m_elScreen.SetDialogVariable('collection-name', $.Localize('#CSGO_' + collectionName));
        IconUtil.SetupFallbackItemSetIcon(elCollectionImage, collectionName);
        IconUtil.SetItemSetSVGImage(elCollectionImage, collectionName);
    }
    function UpdateCollectionDots() {
        m_elScreen.FindChildInLayoutFile('id-offer-collection-progress').SetHasClass('show', true);
        const oHistoricData = InventoryAPI.GetCacheTypeElementJSOByIndex('VolatileItemOffer', InventoryAPI.GetCacheTypeElementIndexByKey('VolatileItemOffer', m_defidxContainerItem));
        let count = InventoryAPI.GetLootListItemsCount(m_idContainerItem);
        const elParent = m_elScreen.FindChildInLayoutFile('id-offer-lootlist-btn');
        elParent.SetPanelEvent('onactivate', () => {
            _MakeFingerPrints(m_elScreen);
            _XpCollectionPopup();
        });
        for (let i = 0; i < count; i++) {
            const itemId = InventoryAPI.GetLootListItemIdByIndex(m_idContainerItem, i);
            const rarityNum = InventoryAPI.GetItemRarity(itemId);
            let raritySection = elParent.FindChildInLayoutFile('rarity-btn-' + rarityNum);
            if (!raritySection) {
                raritySection = $.CreatePanel('Panel', elParent, 'rarity-btn-' + rarityNum, { class: 'offer-collection__lootlist' });
            }
            let elItem = raritySection.FindChildInLayoutFile(itemId);
            if (!elItem) {
                elItem = $.CreatePanel("Panel", raritySection, itemId);
                elItem.BLoadLayoutSnippet('offer-collection-item');
                _SetRarityColor(elItem, (rarityNum === 0) ? '#ffd700' : InventoryAPI.GetItemRarityColor(itemId));
            }
            const iidCheckHistoricData = (rarityNum === 0) ? InventoryAPI.GetFauxItemIDFromDefAndPaintIndexUB1(m_defidxContainerItem, 1, 3) : itemId;
            const bSeenInHistoricData = (oHistoricData && oHistoricData.faux_itemid.includes(iidCheckHistoricData)) ? true : false;
            if (m_initialDotsUpdateFinished && !elItem.BHasClass('seen') && bSeenInHistoricData) {
                elItem.SetHasClass('seen-anim', bSeenInHistoricData);
            }
            elItem.SetHasClass('seen', bSeenInHistoricData);
        }
        if (!m_initialDotsUpdateFinished) {
            m_initialDotsUpdateFinished = true;
        }
    }
    function _XpCollectionPopup() {
        m_elScreen.FindChildInLayoutFile('id-popup-in-screen').SetHasClass('show-lootlist', true);
        m_elScreen.FindChildInLayoutFile('id-close-popup-in-screen').SetPanelEvent('onactivate', () => CloseInScreenPopup('show-lootlist'));
        const oHistoricData = InventoryAPI.GetCacheTypeElementJSOByIndex('VolatileItemOffer', InventoryAPI.GetCacheTypeElementIndexByKey('VolatileItemOffer', m_defidxContainerItem));
        const oClaimedData = InventoryAPI.GetCacheTypeElementJSOByIndex('VolatileItemClaimedRewards', InventoryAPI.GetCacheTypeElementIndexByKey('VolatileItemClaimedRewards', m_defidxContainerItem));
        const elParent = m_elScreen.FindChildInLayoutFile('id-offer-xp-lootlist');
        let count = InventoryAPI.GetLootListItemsCount(m_idContainerItem);
        let iCurrentRarity = -1;
        let itemsInRarityTier = 0;
        let itemsSeenInRarityTier = 0;
        for (let i = 0; i < count; i++) {
            const itemId = InventoryAPI.GetLootListItemIdByIndex(m_idContainerItem, i);
            const rarityNum = InventoryAPI.GetItemRarity(itemId);
            let raritySection = elParent.FindChildInLayoutFile('rarity-' + rarityNum);
            if (!raritySection) {
                raritySection = $.CreatePanel('Panel', elParent, 'rarity-' + rarityNum);
                raritySection.BLoadLayoutSnippet('lootlist-section');
            }
            if (iCurrentRarity != rarityNum) {
                iCurrentRarity = rarityNum;
                itemsInRarityTier = 0;
                itemsSeenInRarityTier = 0;
                raritySection.SetDialogVariableInt('seen', 0);
            }
            let raritySectionList = raritySection.FindChild('id-lootlist-items');
            let elItem = elParent.FindChildInLayoutFile('item-xp-list-' + itemId);
            if (!elItem) {
                elItem = $.CreatePanel('Panel', raritySectionList, 'item-xp-list-' + itemId);
                elItem.BLoadLayoutSnippet('lootlist-xp-item');
                elItem.SetPanelEvent('onactivate', () => {
                    $.DispatchEvent("LootlistItemPreview", itemId, InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(m_defidxContainerItem, 0) +
                        ',' + '');
                });
                elItem.enabled = rarityNum !== 0;
            }
            const iidCheckHistoricData = (rarityNum === 0) ? InventoryAPI.GetFauxItemIDFromDefAndPaintIndexUB1(m_defidxContainerItem, 1, 3) : itemId;
            const bSeenInHistoricData = (oHistoricData && oHistoricData.faux_itemid.includes(iidCheckHistoricData)) ? true : false;
            elItem.SetHasClass('seen', bSeenInHistoricData);
            if (bSeenInHistoricData) {
                raritySection.SetDialogVariableInt('seen', ++itemsSeenInRarityTier);
            }
            raritySection.SetDialogVariableInt('total', ++itemsInRarityTier);
            _SetRarityColor(elItem.FindChildInLayoutFile('id-lootlist-xp-rarity'), (rarityNum === 0) ? '#ffd700' : InventoryAPI.GetItemRarityColor(itemId));
            elItem.SetDialogVariable('loot-name', (rarityNum === 0) ? $.Localize(InventoryAPI.GetLootListUnusualItemName(m_idContainerItem)) : InventoryAPI.GetItemName(itemId));
            let btn = raritySection.FindChildInLayoutFile('id-lootlist-xp-claim');
            if (btn) {
                const iClaimRewardID = (rarityNum === 0) ? 99 : rarityNum;
                const bClaimed = (oClaimedData && oClaimedData.reward.includes(iClaimRewardID)) ? true : false;
                const bAllowClaimingXP = !bClaimed && (itemsSeenInRarityTier == itemsInRarityTier);
                btn.enabled = bAllowClaimingXP && (itemsSeenInRarityTier == itemsInRarityTier);
                btn.text = $.Localize(bClaimed ? '#popup_lootlist_claim_ok' : '#popup_lootlist_claim_xp', btn);
                btn.SetPanelEvent('onactivate', () => {
                    if (!bAllowClaimingXP)
                        return;
                    if (!FriendsListAPI.GetFriendPrimeEligible(MyPersonaAPI.GetXuid())) {
                        UiToolkitAPI.ShowCustomLayoutPopup('prime_status', 'file://{resources}/layout/popups/popup_prime_status.xml');
                        return;
                    }
                    if (FriendsListAPI.GetFriendLevel(MyPersonaAPI.GetXuid()) >= InventoryAPI.GetMaxLevel()) {
                        const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_inventory_inspect.xml');
                        let oSettings = {
                            item_id: '0',
                            show_work_type_warning: false,
                            work_type: 'prestigecheck'
                        };
                        elPanel.Data().oSettings = oSettings;
                        return;
                    }
                    if (m_tmsExpectingXpGrantNotification && (Date.now() - m_tmsExpectingXpGrantNotification < 1500))
                        return;
                    m_tmsExpectingXpGrantNotification = Date.now();
                    InventoryAPI.ClaimVolatileReward(m_defidxContainerItem, iClaimRewardID);
                    btn.enabled = false;
                    btn.text = $.Localize('#popup_lootlist_claim_ww', btn);
                });
            }
        }
    }
    async function _ShowMessageOfferLimit() {
        const elMessage = $.CreatePanel('Panel', m_elMessagesParent, '');
        elMessage.BLoadLayoutSnippet('interaction-offer-limit-message');
        elMessage.AddClass('show');
        const oSettings = {
            parentPanel: elMessage.FindChildInLayoutFile('id-interaction-list'),
            buttonClass: 'message-interaction__text-button',
            group: 'offer-limit-message',
            namePrefix: 'id-limit-message',
            isContextMenu: false
        };
        MakeOfferLimitRadioButton(oSettings);
        await Async.Delay(.1);
        m_elMessagesParent.ScrollToBottom();
        return elMessage;
    }
    function ShowOfferLimitPopup() {
        m_elScreen.FindChildInLayoutFile('id-popup-in-screen').SetHasClass('show-settings', true);
        m_elScreen.FindChildInLayoutFile('id-close-popup-in-screen').SetPanelEvent('onactivate', () => CloseInScreenPopup('show-settings'));
        const oSettings = {
            parentPanel: m_elScreen.FindChildInLayoutFile('id-offer-settings'),
            buttonClass: 'popup-offers-setting__text-button',
            group: 'offer-limit',
            namePrefix: 'id-limit-popup',
            isContextMenu: true
        };
        MakeOfferLimitRadioButton(oSettings);
    }
    function MakeOfferLimitRadioButton(oSetting) {
        let oLimits = JSON.parse(InventoryAPI.GetVolatileLimits());
        for (let i = 0; i < oLimits.choices.length; i++) {
            let elButton = oSetting.parentPanel.FindChild(oSetting.namePrefix + oLimits.choices[i].limit);
            if (!elButton) {
                elButton = $.CreatePanel('RadioButton', oSetting.parentPanel, oSetting.namePrefix + oLimits.choices[i].limit, {
                    class: oSetting.buttonClass,
                    group: 'offer-limit',
                    html: 'true',
                    text: '{s:setting-label}'
                });
                elButton.SetDialogVariable('limit-setting', oLimits.choices[i]?.label);
                const locString = (oLimits.choices[i].limit !== 0) ?
                    $.Localize(_RandomizeLocString('#user_message_limit_'), elButton) :
                    $.Localize(_RandomizeLocString('#user_message_limit_unlimited_'), elButton);
                elButton.SetDialogVariable('setting-label', locString);
                elButton.SetPanelEvent('onactivate', () => {
                    InventoryAPI.SetVolatileLimits(oLimits.choices[i].limit);
                    m_elScreen.SetDialogVariable('limit', GetLimitString(oLimits.choices[i]?.limit, oLimits.choices[i]?.label));
                    if (oSetting.isContextMenu) {
                        $.Schedule(.25, () => CloseInScreenPopup('show-settings'));
                        oSetting.parentPanel.Children().forEach(element => element.enabled = false);
                        ShowDealerOfferLimitAcknowledge();
                        return;
                    }
                    else {
                        oSetting.parentPanel.SetHasClass('hide', true);
                        _MakeMessage(systemOfferLimitSetWithBootstrapAction);
                    }
                });
            }
            if (oSetting.isContextMenu) {
                elButton.checked = ((oLimits.limit === oLimits.choices[i].limit) && oLimits.selected === true);
                elButton.enabled = !elButton.checked;
            }
        }
    }
    function CloseInScreenPopup(className) {
        OffersLaptop.LaptopSoundPlayOnce('UI.Laptop.Click');
        m_elScreen.FindChildInLayoutFile('id-popup-in-screen').SetHasClass(className, false);
    }
    function GetLimitString(nLimit, sLimitLabel) {
        return nLimit === 0 ? $.Localize(sLimitLabel) : sLimitLabel;
    }
})(CollectionOffers || (CollectionOffers = {}));
var DecodeText;
(function (DecodeText) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{};:,.<>/?';
    function Init(textString, elContainer, className, bHtml = false) {
        let aTextString = textString.split('');
        let aExistingLetter = elContainer.Children();
        let numExistingLetters = aExistingLetter.length;
        if (aTextString.length < numExistingLetters) {
            for (let i = aTextString.length; i < numExistingLetters; i++) {
                aExistingLetter[i].DeleteAsync(0);
            }
        }
        aTextString.forEach((letter, index) => {
            let elLetter = elContainer.FindChild('letter-' + index);
            if (!elLetter) {
                elLetter = $.CreatePanel('Label', elContainer, 'letter-' + index, {
                    class: className + ' stratum-regular-mono',
                    html: bHtml
                });
            }
        });
        let time = 0;
        let nDelay = .1;
        let textStringLength = aTextString.length;
        aTextString.forEach((letter, index) => {
            $.Schedule(time, () => {
                for (let i = index + 1; i < elContainer.Children().length; i++) {
                    let letterIndex = Math.floor(Math.random() * (0 - textStringLength) + textStringLength);
                    let randomLetter = charset[letterIndex];
                    elContainer.Children()[i].text = randomLetter;
                    elContainer.Children()[i].ToggleClass('show');
                }
                elContainer.Children()[index].text = letter;
                elContainer.Children()[index].SetHasClass('show', true);
            });
            time = time + nDelay;
        });
    }
    DecodeText.Init = Init;
})(DecodeText || (DecodeText = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfb2ZmZXJzX2xhcHRvcF9pbnRlcmZhY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfb2ZmZXJzX2xhcHRvcF9pbnRlcmZhY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQywyQ0FBMkM7QUFDM0Msd0VBQXdFO0FBQ3hFLDhDQUE4QztBQUM5QyxnREFBZ0Q7QUFDaEQsMENBQTBDO0FBQzFDLGlEQUFpRDtBQUNqRCw0REFBNEQ7QUFDNUQseURBQXlEO0FBQ3pELDZDQUE2QztBQUc3QyxJQUFVLGdCQUFnQixDQStvRHpCO0FBL29ERCxXQUFVLGdCQUFnQjtJQUV0QixNQUFNLFlBQVk7UUFHTTtRQUFxQjtRQUZqQyxTQUFTLEdBQWEsRUFBRSxDQUFDO1FBRWpDLFlBQW9CLEdBQVcsRUFBVSxHQUFXO1lBQWhDLFFBQUcsR0FBSCxHQUFHLENBQVE7WUFBVSxRQUFHLEdBQUgsR0FBRyxDQUFRO1lBQ2hELElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNqQixDQUFDO1FBRU8sS0FBSztZQUNULElBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO1lBQ3BCLEtBQUssSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDM0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDdEI7UUFDTCxDQUFDO1FBRU0sT0FBTztZQUNWLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO2dCQUNqQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7YUFDWjtZQUVELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFB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LENBQUUsQ0FBQyxDQUFBLENBQUMsQ0FBQyxDQUFDO1FBQ2pNLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBRSxZQUFZLENBQUUsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLEdBQUUsRUFBRSxHQUFFLFlBQVksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ3BILFFBQVEsQ0FBQyxxQkFBcUIsQ0FBRSxZQUFZLENBQUUsQ0FBQyxhQUFhLENBQUUsYUFBYSxFQUFFLEdBQUUsRUFBRSxHQUFFLFlBQVksQ0FBQyxxQkFBcUIsQ0FBRSxZQUFZLEVBQUUsZ0NBQWdDLEVBQUUsb0JBQW9CLENBQUUsQ0FBQyxDQUFBLENBQUMsQ0FBQyxDQUFDO1FBQ2pNLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBRSxZQUFZLENBQUUsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLEdBQUUsRUFBRSxHQUFFLFlBQVksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ3BILFFBQVEsQ0FBQyxxQkFBcUIsQ0FBRSxZQUFZLENBQUUsQ0FBQyxhQUFhLENBQUUsYUFBYSxFQUFFLEdBQUUsRUFBRSxHQUFFLFlBQVksQ0FBQyxxQkFBcUIsQ0FBRSxZQUFZLEVBQUUsZ0NBQWdDLEVBQUUsb0JBQW9CLENBQUUsQ0FBQyxDQUFBLENBQUMsQ0FBQyxDQUFDO1FBQ2pNLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBRSxZQUFZLENBQUUsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLEdBQUUsRUFBRSxHQUFFLFlBQVksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ3BILFFBQVEsQ0FBQyxxQkFBcUIsQ0FBRSxZQUFZLENBQUUsQ0FBQyxhQUFhLENBQUUsYUFBYSxFQUFFLEdBQUUsRUFBRSxHQUFFLFlBQVksQ0FBQyxxQkFBcUIsQ0FBRSxZQUFZLEVBQUUsZ0NBQWdDLEVBQUUsb0JBQW9CLENBQUUsQ0FBQyxDQUFBLENBQUMsQ0FBQyxDQUFDO1FBQ2pNLFFBQVEsQ0FBQyxxQkFBcUIs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