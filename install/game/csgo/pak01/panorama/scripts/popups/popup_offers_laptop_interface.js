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
                this.reset(); // Reset once all numbers are used
            }
            const index = Math.floor(Math.random() * this.available.length);
            const value = this.available[index];
            this.available.splice(index, 1); // Remove selected number
            return value;
        }
    }
    function _GetRandomIntInRange(min, max) {
        // Swap if min is greater than max
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
    // system messages
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
        // _UpdateOfferRemainingBoxes( false );
        _UpdateOfferTimer();
        _CollectionInfo();
        _SetTooltips(elScreen);
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', OnInventoryUpdated);
        $.RegisterForUnhandledEvent('PanoramaComponent_Store_PurchaseFinalizing', _OnPurchaseFinalizing);
        $.RegisterForUnhandledEvent('ShowStoreStatusPanel', _ShowStoreStatusPanel);
        // For now just print the volatile limits to dev.console:
        $.Msg('Volatile Container Limits = ' + InventoryAPI.GetVolatileLimits());
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
        // if we never established the random stream for this line, let's see if we can establish one
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
        // We use Steam profile name for declining offers, so turn off HTML to prevent JS-injections
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
        $.Msg("Dealer joined, container itemid = " + m_idContainerItem);
        let numOffers = InventoryAPI.GetItemAttributeValue(m_idContainerItem, '{uint32}quest points remaining');
        $.Msg("OnSystemDealerJoinBootstrap: numOffers = " + numOffers);
        let oLimits = JSON.parse(InventoryAPI.GetVolatileLimits());
        // Initial limit setting disabled for now
        // if( !oLimits.selected && numOffers == undefined )
        // {
        //     // We have not set the offer limit and its the first time opening this terminal
        //     await _MakeMessage( dealerOfferLimitMessage );
        // }
        if (numOffers == undefined) {
            // We are opening this terminal for the very first time
            m_numOfferCounter = 0;
            await _MakeMessage(dealerIntroMessage);
        }
        else {
            // We are coming back to a pre-existing negotiation
            m_numOfferCounter = numOffers;
            // _UpdateOfferRemainingBoxes( true );
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
        // Show waiting message
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
            CollectionOffers.m_currentOfferId = ''; // reset the offer, we are going to await another offer here
            m_numVolatileNotifications = 0;
        }
        return elWaitMessage;
    }
    async function _AwaitOfferItemID(bJustNotificationIsOk) {
        // Wait at least one second, but time out after waiting for 5 seconds
        for (let i = 5; i-- > 0;) {
            await Async.Delay(1);
            if (bJustNotificationIsOk && (m_numVolatileNotifications > 0)) {
                $.Msg('GC notification arrived: ' + m_numVolatileNotifications + ', offerid: ' + CollectionOffers.m_currentOfferId);
                return CollectionOffers.m_currentOfferId ? CollectionOffers.m_currentOfferId : m_idContainerItem;
            }
            if (CollectionOffers.m_currentOfferId) {
                $.Msg('GC offer received: ' + CollectionOffers.m_currentOfferId);
                return CollectionOffers.m_currentOfferId;
            }
        }
        $.Msg('GC failed to respond in time');
        UiToolkitAPI.ShowGenericPopupOk($.Localize('#SFUI_SteamConnectionErrorTitle'), $.Localize('#PlayMenu_unavailable_newuser_2_nogcconnection'), '', () => { });
        Close(false);
        return '';
    }
    async function _ReplaceMessageDotDotDotWithOffer(elWaitMessage) {
        UpdateCollectionDots(); // now that all volatile offer data has been loaded, show collection dots with known items
        elWaitMessage.FindChildInLayoutFile('id-waiting').visible = false;
        const OfferItemData = _GetItemData(CollectionOffers.m_currentOfferId);
        $.Msg("Setting offer data: " + OfferItemData.defName + ", " + OfferItemData.itemType + ", " + OfferItemData.price);
        _HighlightCurrentMessage();
        await _DisplayOfferDownloadMessage(elWaitMessage, OfferItemData);
        _UpdateWeaponModel(OfferItemData);
        await _MessageOfferComment(OfferItemData);
        await Async.Delay(.1);
        m_elMessagesParent.ScrollToBottom();
        m_elScreen.FindChildInLayoutFile('id-chat-messages-bg').SetHasClass('show', true);
        let elUserButtonContainer = m_elScreen.FindChildInLayoutFile('id-user-messages-container');
        if (!elUserButtonContainer.BHasClass('show')) // hidden by default
         {
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
        if (!await _AwaitOfferItemID(true)) // we are just awaiting a notification
            return;
        elWaitMessage.RemoveAndDeleteChildren();
        await _MakeMessage(dealerEndOffer);
        await Async.Delay(2.5);
        await _MakeMessage(systemDealerLeaveContainerDestroy);
    }
    async function _DealerTransitionToPurchaseState() {
        const strPurchaseString = '' + InventoryAPI.GetItemDefinitionIndex(m_idContainerItem) + '(' + m_idContainerItem + ')';
        $.Msg('_DealerTransitionToPurchaseState: ' + strPurchaseString);
        StoreAPI.StoreItemPurchase(strPurchaseString);
    }
    function _OnPurchaseFinalizing(strTxnID) {
        $.Msg("_OnPurchaseFinalizing: " + strTxnID);
        m_bWrappingUpThisTransaction = true;
        // Once we start finalizing this purchase transaction, our laptop goes away
        // and we will have a persistent SQLQ job to commit the purchase to user's wallet
        const storeStatusMessage = {
            line: '#dealer_message_purchase_finalizing_0',
            sender: 'system'
        };
        _MakeMessage(storeStatusMessage);
    }
    function _ShowStoreStatusPanel(strText, bAllowClose, bCancel, strOkCmd) {
        // The only "unrecoverable error" is when the user explicitly cancels the TXN
        if (strText === '#StoreCheckout_TransactionCanceled') {
            _MakeMessage(dealerTxnXldBailout);
            return;
        }
        // if this is the "Loading..." screen, then just don't print the status into the chat
        if (bCancel)
            return;
        // if this is "Purchase Success" then the dealer can go ahead and Acknowledge the item and stuff
        if (strText === '#StoreCheckout_TransactionCompleted') {
            $.Msg('_DealerTransitionToPurchaseState: item successfully purchased!');
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
        // Just print the message in chat, and re-enable the buttons
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
        // If these conditions are true always say these
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
        // only say these once and only sometimes
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
        // Visible state of Buttons
        m_elYesBtn.visible = true;
        m_elNoBtn.visible = !_IsFinalOffer() && (numPaidAlready === 0);
        m_elEndBtn.visible = _IsFinalOffer() && (numPaidAlready === 0);
        m_elScreen.FindChildInLayoutFile('id-offer-limit-setting').visible = (numPaidAlready === 0);
        m_elScreen.FindChildInLayoutFile('id-price-tooltip').visible = (numPaidAlready === 0);
        // Set up Hold button actions
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
        // Default enable state for buttons
        _EnableActionButtons(numPaidAlready === 0);
    }
    function OnInventoryUpdated() {
        // Listen for the event when our volatile container has expired
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
            return; // k_EGCItemCustomizationNotification_CasketContents (#1012)
        if (itemid !== m_idContainerItem)
            return;
        ++m_numVolatileNotifications;
        let numOffers = InventoryAPI.GetItemAttributeValue(m_idContainerItem, '{uint32}quest points remaining');
        if (numOffers === undefined)
            m_numOfferCounter = 0;
        else {
            m_numOfferCounter = numOffers;
            // _UpdateOfferRemainingBoxes( true );
        }
        InventoryAPI.SetInventorySortAndFilters('inv_sort_age', false, "casketcontents:" + m_idContainerItem, '', '');
        const count = InventoryAPI.GetInventoryCount();
        const offerItemID = (count && (count > 0)) ? InventoryAPI.GetInventoryItemIDByIndex(0) : "";
        $.Msg("Dealer ItemCustomizationNotification, container itemid = " + m_idContainerItem + " (count=" + count + ", offerid=" + offerItemID + ")");
        if (!offerItemID)
            return;
        if (!InventoryAPI.IsValidItemID(offerItemID))
            return;
        // Got a validated offer ItemID, assign it and resume our async awaiting flow
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
        // (m_elScreen.FindChildInLayoutFile( 'id-offer-preview-icon-blurred' ) as ItemImage_t).itemid = OfferItemData.itemId;
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
            // const opacity = _GetRandomIntInRange( 0, 10 )/ 100;
            elImage.style.transform = 'translateY(128px) translateX(-64px) rotateZ(' + rotate + 'deg);';
            // elImage.style.opacity = opacity.toString();
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
        // ... cannot update dots here, because the data might be async-loading
        // UpdateCollectionDots();
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
                // color @define color-rarity-unusual: #ffd700 in csgo styles
                _SetRarityColor(elItem, (rarityNum === 0) ? '#ffd700' : InventoryAPI.GetItemRarityColor(itemId));
            }
            const iidCheckHistoricData = (rarityNum === 0) ? InventoryAPI.GetFauxItemIDFromDefAndPaintIndexUB1(m_defidxContainerItem, 1, 3 /* AE_UNUSUAL */) : itemId;
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
            const iidCheckHistoricData = (rarityNum === 0) ? InventoryAPI.GetFauxItemIDFromDefAndPaintIndexUB1(m_defidxContainerItem, 1, 3 /* AE_UNUSUAL */) : itemId;
            const bSeenInHistoricData = (oHistoricData && oHistoricData.faux_itemid.includes(iidCheckHistoricData)) ? true : false;
            elItem.SetHasClass('seen', bSeenInHistoricData);
            if (bSeenInHistoricData) {
                raritySection.SetDialogVariableInt('seen', ++itemsSeenInRarityTier);
            }
            raritySection.SetDialogVariableInt('total', ++itemsInRarityTier);
            // color @define color-rarity-unusual: #ffd700 in csgo styles
            _SetRarityColor(elItem.FindChildInLayoutFile('id-lootlist-xp-rarity'), (rarityNum === 0) ? '#ffd700' : InventoryAPI.GetItemRarityColor(itemId));
            elItem.SetDialogVariable('loot-name', (rarityNum === 0) ? $.Localize(InventoryAPI.GetLootListUnusualItemName(m_idContainerItem)) : InventoryAPI.GetItemName(itemId));
            // Set the state of the "Claim XP" button
            let btn = raritySection.FindChildInLayoutFile('id-lootlist-xp-claim');
            if (btn) {
                const iClaimRewardID = (rarityNum === 0) ? 99 : rarityNum; // AE_UNUSUAL claim request with "99" rarity
                const bClaimed = (oClaimedData && oClaimedData.reward.includes(iClaimRewardID)) ? true : false;
                const bAllowClaimingXP = !bClaimed && (itemsSeenInRarityTier == itemsInRarityTier);
                btn.enabled = bAllowClaimingXP && (itemsSeenInRarityTier == itemsInRarityTier);
                btn.text = $.Localize(bClaimed ? '#popup_lootlist_claim_ok' : '#popup_lootlist_claim_xp', btn);
                btn.SetPanelEvent('onactivate', () => {
                    $.Msg('id-lootlist-xp-claim: ' + m_defidxContainerItem + " :: " + iClaimRewardID + " :: " + (bAllowClaimingXP ? "allowed" : "n/a"));
                    if (!bAllowClaimingXP)
                        return;
                    if (!FriendsListAPI.GetFriendPrimeEligible(MyPersonaAPI.GetXuid())) {
                        UiToolkitAPI.ShowCustomLayoutPopup('prime_status', 'file://{resources}/layout/popups/popup_prime_status.xml');
                        return; // force user to get Prime Account Status before earning XP
                    }
                    if (FriendsListAPI.GetFriendLevel(MyPersonaAPI.GetXuid()) >= InventoryAPI.GetMaxLevel()) {
                        const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_inventory_inspect.xml'); // force the user to get Prestige first before claiming regular XP
                        let oSettings = {
                            item_id: '0',
                            show_work_type_warning: false,
                            work_type: 'prestigecheck'
                        };
                        elPanel.Data().oSettings = oSettings;
                        return;
                    }
                    if (m_tmsExpectingXpGrantNotification && (Date.now() - m_tmsExpectingXpGrantNotification < 1500))
                        return; // disallow smashing the button within GC ratelimit, even for different XP categories
                    m_tmsExpectingXpGrantNotification = Date.now();
                    InventoryAPI.ClaimVolatileReward(m_defidxContainerItem, iClaimRewardID);
                    btn.enabled = false;
                    btn.text = $.Localize('#popup_lootlist_claim_ww', btn);
                });
            }
        }
    }
    // Offer limit message and Popup 
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
        // Delete extra labels for the existing letter
        if (aTextString.length < numExistingLetters) {
            for (let i = aTextString.length; i < numExistingLetters; i++) {
                aExistingLetter[i].DeleteAsync(0);
            }
        }
        // Make blank letters for spacing
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfb2ZmZXJzX2xhcHRvcF9pbnRlcmZhY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfb2ZmZXJzX2xhcHRvcF9pbnRlcmZhY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQywyQ0FBMkM7QUFDM0Msd0VBQXdFO0FBQ3hFLDhDQUE4QztBQUM5QyxnREFBZ0Q7QUFDaEQsMENBQTBDO0FBQzFDLGlEQUFpRDtBQUNqRCw0REFBNEQ7QUFDNUQseURBQXlEO0FBQ3pELDZDQUE2QztBQUc3QyxJQUFVLGdCQUFnQixDQStvRHpCO0FBL29ERCxXQUFVLGdCQUFnQjtJQUV0QixNQUFNLFlBQVk7UUFHTTtRQUFxQjtRQUZqQyxTQUFTLEdBQWEsRUFBRSxDQUFDO1FBRWpDLFlBQW9CLEdBQVcsRUFBVSxHQUFXO1lBQWhDLFFBQUcsR0FBSCxHQUFHLENBQVE7WUFBVSxRQUFHLEdBQUgsR0FBRyxDQUFRO1lBQ2hELElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNqQixDQUFDO1FBRU8sS0FBSztZQUNULElBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO1lBQ3BCLEtBQUssSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDM0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDdEI7UUFDTCxDQUFDO1FBRU0sT0FBTztZQUNWLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO2dCQUNqQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxrQ0FBa0M7YUFDL0M7WUFFRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2hFLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDcEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMseUJBQXlCO1lBRTFELE9BQU8sS0FBSyxDQUFDO1FBQ2pCLENBQUM7S0FDSjtJQUVELFNBQVMsb0JBQW9CLENBQUMsR0FBVyxFQUFFLEdBQVc7UUFDbEQsa0NBQWtDO1FBQ2xDLElBQUksR0FBRyxHQUFHLEdBQUc7WUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUV2QyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztJQUM3RCxDQUFDO0lBRUQsSUFBSSxpQkFBaUIsR0FBRyxFQUFFLENBQUM7SUFDM0IsSUFBSSxxQkFBcUIsR0FBRyxDQUFDLENBQUM7SUFDOUIsSUFBSSxpQkFBaUIsR0FBRyxDQUFDLENBQUM7SUFDMUIsSUFBSSw0QkFBNEIsR0FBRyxLQUFLLENBQUM7SUFDekMsSUFBSSxpQ0FBaUMsR0FBRyxDQUFDLENBQUM7SUFDL0IsaUNBQWdCLEdBQUcsRUFBRSxDQUFDO0lBQ2pDLElBQUksMEJBQTBCLEdBQUcsQ0FBQyxDQUFDO0lBQ25DLElBQUksMkJBQTJCLEdBQUcsS0FBSyxDQUFDO0lBRXhDLFNBQVMsYUFBYTtRQUVsQixPQUFPLENBQUUsaUJBQWlCLElBQUksQ0FBQyxDQUFFLENBQUM7SUFDdEMsQ0FBQztJQUNELFNBQVMsbUJBQW1CO1FBRXhCLE9BQU8sQ0FBRSxpQkFBaUIsR0FBRyxDQUFDLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUM7SUFDOUUsQ0FBQztJQUVELElBQUksWUFBWSxHQUFXLG9CQUFvQixDQUFFLENBQUMsRUFBQyxDQUFDLENBQUUsQ0FBQztJQUN2RCxJQUFJLFVBQW1CLENBQUM7SUFDeEIsSUFBSSxrQkFBMkIsQ0FBQztJQUNoQyxJQUFJLFVBQXdCLENBQUM7SUFDN0IsSUFBSSxTQUF1QixDQUFDO0lBQzVCLElBQUksVUFBd0IsQ0FBQztJQUk1QixDQUFDO0lBQ0YsSUFBSSxrQkFBa0IsR0FBc0IsRUFBRSxDQUFDO0lBbUMvQyxNQUFNLGdCQUFnQjtRQUNWLElBQUksR0FBc0IsRUFBRSxDQUFDO1FBQzlCLFFBQVEsQ0FBRSxDQUFRLElBQVksT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDekQsY0FBYyxDQUFFLENBQVEsSUFBWSxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBRSxDQUFDLENBQUMsQ0FBQztRQUNuRyxLQUFLLENBQUMsZ0JBQWdCLENBQUUsQ0FBVztZQUV0QyxJQUFLLElBQUksQ0FBQyxjQUFjLENBQUUsQ0FBQyxDQUFDLElBQUksQ0FBRSxJQUFJLENBQUM7Z0JBQUcsT0FBTyxLQUFLLENBQUM7WUFDdkQsTUFBTSxZQUFZLENBQUUsQ0FBQyxDQUFFLENBQUM7WUFDeEIsT0FBTyxJQUFJLENBQUM7UUFDaEIsQ0FBQztLQUNKO0lBQUEsQ0FBQztJQUNGLElBQUksZ0JBQWdCLEdBQW9CLElBQUksZ0JBQWdCLENBQUM7SUFFN0QsTUFBTSxrQkFBa0IsR0FDeEI7UUFDSSxJQUFJLEVBQUMsd0JBQXdCO1FBQzdCLE1BQU0sRUFBRSxRQUFRO1FBQ2hCLE1BQU0sRUFBRSxHQUFFLEVBQUU7WUFDUixZQUFZLENBQUUsZ0JBQWdCLENBQUUsQ0FBQztRQUNyQyxDQUFDO0tBQ0osQ0FBQTtJQUVELE1BQU0sZ0NBQWdDLEdBQ3RDO1FBQ0ksSUFBSSxFQUFDLHlCQUF5QjtRQUM5QixNQUFNLEVBQUUsUUFBUTtRQUNoQixNQUFNLEVBQUUsR0FBRSxFQUFFO1lBQ1IsNkJBQTZCLEVBQUUsQ0FBQztRQUNwQyxDQUFDO0tBQ0osQ0FBQTtJQUVELE1BQU0sZ0JBQWdCLEdBQ3RCO1FBQ0ksSUFBSSxFQUFDLDhCQUE4QjtRQUNuQyxNQUFNLEVBQUUsUUFBUTtRQUNoQixNQUFNLEVBQUUsR0FBRSxFQUFFO1lBQ1IsZ0JBQWdCLEVBQUUsQ0FBQztRQUN2QixDQUFDO0tBQ0osQ0FBQTtJQUVELE1BQU0sZUFBZSxHQUNyQjtRQUNJLElBQUksRUFBQyw2QkFBNkI7UUFDbEMsTUFBTSxFQUFFLFFBQVE7UUFDaEIsTUFBTSxFQUFFLEdBQUUsRUFBRTtZQUNSLGdCQUFnQixFQUFFLENBQUM7UUFDdkIsQ0FBQztLQUNKLENBQUE7SUFFRCxNQUFNLGVBQWUsR0FDckI7UUFDSSxJQUFJLEVBQUMsNkJBQTZCO1FBQ2xDLE1BQU0sRUFBRSxRQUFRO0tBQ25CLENBQUE7SUFFRCxNQUFNLGNBQWMsR0FDcEI7UUFDSSxJQUFJLEVBQUMsc0JBQXNCO1FBQzNCLE1BQU0sRUFBRSxRQUFRO0tBQ25CLENBQUE7SUFFRCxNQUFNLHlCQUF5QixHQUMvQjtRQUNJLElBQUksRUFBQyxpQ0FBaUM7UUFDdEMsTUFBTSxFQUFFLFFBQVE7UUFDaEIsTUFBTSxFQUFFLEtBQUssSUFBRyxFQUFFO1lBQ2QsTUFBTSxLQUFLLENBQUMsS0FBSyxDQUFFLEdBQWEsQ0FBRSxDQUFDO1lBQ25DLGdDQUFnQyxFQUFFLENBQUM7UUFDdkMsQ0FBQztLQUNKLENBQUE7SUFFRCxNQUFNLG1CQUFtQixHQUN6QjtRQUNJLElBQUksRUFBQyxrQ0FBa0M7UUFDdkMsTUFBTSxFQUFFLFFBQVE7UUFDaEIsTUFBTSxFQUFFLEtBQUssSUFBRSxFQUFFO1lBQ2IsTUFBTSxLQUFLLENBQUMsS0FBSyxDQUFFLENBQVcsQ0FBRSxDQUFDO1lBQ2pDLFlBQVksQ0FBRSxpQkFBaUIsQ0FBRSxDQUFDO1FBQ3RDLENBQUM7S0FDSixDQUFBO0lBRUQsTUFBTSxjQUFjLEdBQ3BCO1FBQ0ksSUFBSSxFQUFDLDRCQUE0QjtRQUNqQyxNQUFNLEVBQUUsUUFBUTtLQUNuQixDQUFBO0lBRUQsTUFBTSxnQkFBZ0IsR0FDdEI7UUFDSSxJQUFJLEVBQUMsOEJBQThCO1FBQ25DLE1BQU0sRUFBRSxRQUFRO0tBQ25CLENBQUE7SUFFRCxNQUFNLGlCQUFpQixHQUN2QjtRQUNJLElBQUksRUFBQywrQkFBK0I7UUFDcEMsTUFBTSxFQUFFLFFBQVE7S0FDbkIsQ0FBQTtJQUVELE1BQU0sWUFBWSxHQUNsQjtRQUNJLElBQUksRUFBQyx5QkFBeUI7UUFDOUIsTUFBTSxFQUFFLFFBQVE7S0FDbkIsQ0FBQTtJQUVELE1BQU0sZ0JBQWdCLEdBQ3RCO1FBQ0ksSUFBSSxFQUFDLDZCQUE2QjtRQUNsQyxNQUFNLEVBQUUsUUFBUTtLQUNuQixDQUFBO0lBRUQsTUFBTSxnQkFBZ0IsR0FDdEI7UUFDSSxJQUFJLEVBQUMsNkJBQTZCO1FBQ2xDLE1BQU0sRUFBRSxRQUFRO0tBQ25CLENBQUE7SUFFRCxNQUFNLG1CQUFtQixHQUN6QjtRQUNJLElBQUksRUFBQyxpQ0FBaUM7UUFDdEMsTUFBTSxFQUFFLFFBQVE7S0FDbkIsQ0FBQTtJQUVELE1BQU0sVUFBVSxHQUNoQjtRQUNJLElBQUksRUFBQyx3QkFBd0I7UUFDN0IsTUFBTSxFQUFFLFFBQVE7S0FDbkIsQ0FBQTtJQUVELE1BQU0sY0FBYyxHQUNwQjtRQUNJLElBQUksRUFBQyw0QkFBNEI7UUFDakMsU0FBUyxFQUFFLEVBQUMsVUFBVSxFQUFDLGFBQWEsRUFBRSxVQUFVLEVBQUMsRUFBRSxFQUFFO1FBQ3JELE1BQU0sRUFBRSxRQUFRO0tBQ25CLENBQUE7SUFFRCxNQUFNLHNCQUFzQixHQUM1QjtRQUNJLElBQUksRUFBQyxvQ0FBb0M7UUFDekMsTUFBTSxFQUFFLFFBQVE7S0FDbkIsQ0FBQTtJQUVELE1BQU0sd0JBQXdCLEdBQzlCO1FBQ0ksSUFBSSxFQUFDLHVDQUF1QztRQUM1QyxNQUFNLEVBQUUsUUFBUTtLQUNuQixDQUFBO0lBRUQsTUFBTSx1QkFBdUIsR0FDN0I7UUFDSSxJQUFJLEVBQUMsa0NBQWtDO1FBQ3ZDLE1BQU0sRUFBRSxRQUFRO1FBQ2hCLE1BQU0sRUFBRSxLQUFLLElBQUcsRUFBRTtZQUNkLE1BQU0sS0FBSyxDQUFDLEtBQUssQ0FBRSxFQUFZLENBQUUsQ0FBQztZQUNsQyxzQkFBc0IsRUFBRSxDQUFDO1FBQzdCLENBQUM7S0FDSixDQUFBO0lBRUQsTUFBTSxzQkFBc0IsR0FDNUI7UUFDSSxJQUFJLEVBQUMsK0JBQStCO1FBQ3BDLE1BQU0sRUFBRSxRQUFRO1FBQ2hCLE1BQU0sRUFBRSxHQUFFLEVBQUU7WUFDUixZQUFZLENBQUUsaUNBQWlDLENBQUUsQ0FBQztRQUN0RCxDQUFDO0tBQ0osQ0FBQTtJQUVELGtCQUFrQjtJQUNsQixNQUFNLGdCQUFnQixHQUN0QjtRQUNJLElBQUksRUFBQyw0QkFBNEI7UUFDakMsTUFBTSxFQUFFLFFBQVE7UUFDaEIsTUFBTSxFQUFFLEdBQUUsRUFBRTtZQUNSLDRCQUE0QixFQUFFLENBQUM7UUFDbkMsQ0FBQztLQUNKLENBQUE7SUFFRCxNQUFNLHFCQUFxQixHQUMzQjtRQUNJLElBQUksRUFBQyw2QkFBNkI7UUFDbEMsTUFBTSxFQUFFLFFBQVE7UUFDaEIsUUFBUSxFQUFFLElBQUk7S0FDakIsQ0FBQTtJQUVELE1BQU0saUJBQWlCLEdBQ3ZCO1FBQ0ksSUFBSSxFQUFDLDRCQUE0QjtRQUNqQyxNQUFNLEVBQUUsUUFBUTtRQUNoQixNQUFNLEVBQUUsS0FBSyxJQUFHLEVBQUU7WUFDZCxVQUFVLENBQUMscUJBQXFCLENBQUUsMEJBQTBCLENBQUMsQ0FBQyxXQUFXLENBQUUsV0FBVyxFQUFFLEtBQUssQ0FBRSxDQUFDO1lBQ2hHLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBRSx1QkFBdUIsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxZQUFZLEdBQUUsWUFBWSxFQUFFLEtBQUssQ0FBRSxDQUFDO1lBRTVHLE1BQU0sS0FBSyxDQUFDLEtBQUssQ0FBRSxDQUFXLENBQUUsQ0FBQztZQUNqQyxLQUFLLENBQUUsS0FBSyxDQUFFLENBQUM7UUFDbkIsQ0FBQztLQUNKLENBQUE7SUFFRCxNQUFNLGlDQUFpQyxHQUN2QztRQUNJLElBQUksRUFBQyw0QkFBNEI7UUFDakMsTUFBTSxFQUFFLFFBQVE7UUFDaEIsTUFBTSxFQUFFLEtBQUssSUFBRyxFQUFFO1lBQ2QsVUFBVSxDQUFDLHFCQUFxQixDQUFFLDBCQUEwQixDQUFDLENBQUMsV0FBVyxDQUFFLFdBQVcsRUFBRSxJQUFJLENBQUUsQ0FBQztZQUMvRixVQUFVLENBQUMscUJBQXFCLENBQUUsdUJBQXVCLENBQUMsQ0FBQyxXQUFXLENBQUUsWUFBWSxHQUFFLFlBQVksRUFBRSxJQUFJLENBQUUsQ0FBQztZQUMzRyxNQUFNLEtBQUssQ0FBQyxLQUFLLENBQUUsQ0FBVyxDQUFFLENBQUM7WUFDakMsS0FBSyxDQUFFLElBQUksQ0FBRSxDQUFDO1FBQ2xCLENBQUM7S0FDSixDQUFBO0lBRUQsTUFBTSxzQ0FBc0MsR0FDNUM7UUFDSSxJQUFJLEVBQUMsb0NBQW9DO1FBQ3pDLE1BQU0sRUFBRSxRQUFRO1FBQ2hCLE1BQU0sRUFBRSxLQUFLLElBQUUsRUFBRTtZQUNiLE1BQU0sK0JBQStCLENBQUUsSUFBSSxDQUFFLENBQUM7WUFDOUMsTUFBTSxhQUFhLEdBQUcsK0JBQStCLEVBQUUsQ0FBQztZQUN4RCxNQUFNLEtBQUssQ0FBQyxLQUFLLENBQUUsQ0FBVyxDQUFFLENBQUM7WUFDakMsQ0FBQyxNQUFNLGFBQWEsQ0FBQyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7WUFDdEMsNEJBQTRCLEVBQUUsQ0FBQztRQUNuQyxDQUFDO0tBQ0osQ0FBQTtJQUVELE1BQU0sbUJBQW1CLEdBQ3pCO1FBQ0ksSUFBSSxFQUFDLG9DQUFvQztRQUN6QyxNQUFNLEVBQUUsUUFBUTtRQUNoQixNQUFNLEVBQUUsR0FBRSxFQUFFO1lBQ1IsK0JBQStCLEVBQUUsQ0FBQztRQUN0QyxDQUFDO0tBQ0osQ0FBQTtJQUVELEtBQUssVUFBVSwrQkFBK0IsQ0FBRSxZQUFxQixLQUFLO1FBRXRFLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLGlCQUFpQixFQUFFLENBQUMsQ0FBQztRQUUzRCxJQUFJLE9BQU8sQ0FBQyxLQUFLLEtBQUssQ0FBQyxFQUN2QjtZQUNJLE1BQU0sT0FBTyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsbUNBQW1DLENBQUM7WUFDNUYsTUFBTSxZQUFZLENBQUUsRUFBRSxJQUFJLEVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBQyxRQUFRLEVBQWUsQ0FBRSxDQUFDO1NBQ3hFO2FBRUQ7WUFDSSxNQUFNLE9BQU8sR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsa0NBQWtDLENBQUMsQ0FBQyxDQUFDLDZDQUE2QyxDQUFDO1lBQ2hILE1BQU0sWUFBWSxDQUFFLEVBQUUsSUFBSSxFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUMsUUFBUSxFQUFlLENBQUUsQ0FBQztTQUN4RTtJQUNMLENBQUM7SUFFRCxTQUFnQixJQUFJLENBQUUsTUFBYSxFQUFFLFFBQWdCO1FBRWpELGlCQUFpQixHQUFHLE1BQU0sQ0FBQztRQUMzQixxQkFBcUIsR0FBRyxZQUFZLENBQUMsc0JBQXNCLENBQUUsaUJBQWlCLENBQUUsQ0FBQztRQUVqRixrQkFBa0IsR0FBRSxRQUFRLENBQUMscUJBQXFCLENBQUUsa0JBQWtCLENBQWEsQ0FBQztRQUNwRixVQUFVLEdBQUcsUUFBUSxDQUFDLHFCQUFxQixDQUFFLHFCQUFxQixDQUFrQixDQUFDO1FBQ3JGLFNBQVMsR0FBRyxRQUFRLENBQUMscUJBQXFCLENBQUUsb0JBQW9CLENBQWtCLENBQUM7UUFDbkYsVUFBVSxHQUFHLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBRSxxQkFBcUIsQ0FBa0IsQ0FBQztRQUNyRixVQUFVLEdBQUcsUUFBUSxDQUFDO1FBRXRCLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBRSx3QkFBd0IsQ0FBRSxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsR0FBRSxFQUFFO1lBQ3hGLFlBQVksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUM5QixDQUFDLENBQUMsQ0FBQTtRQUVGLElBQUksT0FBTyxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUUsaUJBQWlCLENBQUUsQ0FBQztRQUNuRCxJQUFLLENBQUMsT0FBTztZQUNULE9BQU8sR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFFLFlBQVksQ0FBQyx3QkFBd0IsQ0FBRSxpQkFBaUIsRUFBRSxDQUFDLENBQUUsQ0FBRSxDQUFDO1FBQy9GLGtCQUFrQixDQUFDLGlCQUFpQixDQUFFLFlBQVksRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFFLFFBQVEsR0FBRyxPQUFPLENBQUUsQ0FBRSxDQUFDO1FBQ3ZGLHVDQUF1QztRQUN2QyxpQkFBaUIsRUFBRSxDQUFDO1FBQ3BCLGVBQWUsRUFBRSxDQUFDO1FBRWxCLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUV2QixDQUFDLENBQUMseUJBQXlCLENBQUUsOENBQThDLEVBQUUsa0JBQWtCLENBQUUsQ0FBQztRQUNsRyxDQUFDLENBQUMseUJBQXlCLENBQUUsNENBQTRDLEVBQUUscUJBQXFCLENBQUUsQ0FBQztRQUNuRyxDQUFDLENBQUMseUJBQXlCLENBQUUsc0JBQXNCLEVBQUUscUJBQXFCLENBQUUsQ0FBQztRQUU3RSx5REFBeUQ7UUFDekQsQ0FBQyxDQUFDLEdBQUcsQ0FBRSw4QkFBOEIsR0FBRyxZQUFZLENBQUMsaUJBQWlCLEVBQUUsQ0FBRSxDQUFDO1FBRTNFLFlBQVksQ0FBRSxnQkFBZ0IsQ0FBRSxDQUFDO1FBRWpDLFFBQVEsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLEdBQUUsRUFBRSxHQUFFLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFBLENBQUMsQ0FBQyxDQUFFLENBQUM7SUFDaEYsQ0FBQztJQW5DZSxxQkFBSSxPQW1DbkIsQ0FBQTtJQUVELFNBQVMsWUFBWSxDQUFFLFFBQWdCO1FBRW5DLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBRSxZQUFZLENBQUUsQ0FBQyxhQUFhLENBQUUsYUFBYSxFQUFFLEdBQUUsRUFBRSxHQUFFLFlBQVksQ0FBQyxxQkFBcUIsQ0FBRSxZQUFZLEVBQUUsZ0NBQWdDLEVBQUUsb0JBQW9CLENBQUUsQ0FBQyxDQUFBLENBQUMsQ0FBQyxDQUFDO1FBQ2pNLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBRSxZQUFZLENBQUUsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLEdBQUUsRUFBRSxHQUFFLFlBQVksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ3BILFFBQVEsQ0FBQyxxQkFBcUIsQ0FBRSxZQUFZLENBQUUsQ0FBQyxhQUFhLENBQUUsYUFBYSxFQUFFLEdBQUUsRUFBRSxHQUFFLFlBQVksQ0FBQyxxQkFBcUIsQ0FBRSxZQUFZLEVBQUUsZ0NBQWdDLEVBQUUsb0JBQW9CLENBQUUsQ0FBQyxDQUFBLENBQUMsQ0FBQyxDQUFDO1FBQ2pNLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBRSxZQUFZLENBQUUsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLEdBQUUsRUFBRSxHQUFFLFlBQVksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ3BILFFBQVEsQ0FBQyxxQkFBcUIsQ0FBRSxZQUFZLENBQUUsQ0FBQyxhQUFhLENBQUUsYUFBYSxFQUFFLEdBQUUsRUFBRSxHQUFFLFlBQVksQ0FBQyxxQkFBcUIsQ0FBRSxZQUFZLEVBQUUsZ0NBQWdDLEVBQUUsb0JBQW9CLENBQUUsQ0FBQyxDQUFBLENBQUMsQ0FBQyxDQUFDO1FBQ2pNLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBRSxZQUFZLENBQUUsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLEdBQUUsRUFBRSxHQUFFLFlBQVksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ3BILFFBQVEsQ0FBQyxxQkFBcUIsQ0FBRSxZQUFZLENBQUUsQ0FBQyxhQUFhLENBQUUsYUFBYSxFQUFFLEdBQUUsRUFBRSxHQUFFLFlBQVksQ0FBQyxxQkFBcUIsQ0FBRSxZQUFZLEVBQUUsZ0NBQWdDLEVBQUUsb0JBQW9CLENBQUUsQ0FBQyxDQUFBLENBQUMsQ0FBQyxDQUFDO1FBQ2pNLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBRSxZQUFZLENBQUUsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLEdBQUUsRUFBRSxHQUFFLFlBQVksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ3BILFFBQVEsQ0FBQyxxQkFBcUIsQ0FBRSxZQUFZLENBQUUsQ0FBQyxhQUFhLENBQUUsYUFBYSxFQUFFLEdBQUUsRUFBRSxHQUFFLFlBQVksQ0FBQyxxQkFBcUIsQ0FBRSxZQUFZLEVBQUUsZ0NBQWdDLEVBQUUsb0JBQW9CLENBQUUsQ0FBQyxDQUFBLENBQUMsQ0FBQyxDQUFDO1FBQ2pNLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBRSxZQUFZLENBQUUsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLEdBQUUsRUFBRSxHQUFFLFlBQVksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3JILFFBQVEsQ0FBQyxxQkFBcUIsQ0FBRSwrQkFBK0IsQ0FBRSxDQUFDLGFBQWEsQ0FBRSxhQUFhLEVBQUUsR0FBRSxFQUFFLEdBQUUsWUFBWSxDQUFDLHFCQUFxQixDQUFFLCtCQUErQixFQUFFLDBCQUEwQixFQUFFLG9CQUFvQixDQUFFLENBQUMsQ0FBQSxDQUFDLENBQUMsQ0FBQztRQUNqTyxRQUFRLENBQUMscUJBQXFCLENBQUUsK0JBQStCLENBQUUsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLEdBQUUsRUFBRSxHQUFFLFlBQVksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3hJLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBRSxpQ0FBaUMsQ0FBRSxDQUFDLGFBQWEsQ0FBRSxhQUFhLEVBQUUsR0FBRSxFQUFFLEdBQUUsWUFBWSxDQUFDLHFCQUFxQixDQUFFLGlDQUFpQyxFQUFFLDJCQUEyQixFQUFFLG9CQUFvQixDQUFFLENBQUMsQ0FBQSxDQUFDLENBQUMsQ0FBQztRQUN0TyxRQUFRLENBQUMscUJBQXFCLENBQUUsaUNBQWlDLENBQUUsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLEdBQUUsRUFBRSxHQUFFLFlBQVksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRTFJLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBRSwwQkFBMEIsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxhQUFhLEVBQUUsR0FBRSxFQUFFO1lBQzVGLElBQUksV0FBVyxHQUFHLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBRSwwQkFBMEIsQ0FBQyxDQUFDLFNBQVMsQ0FBRSxXQUFXLENBQUUsQ0FBQyxDQUFDLENBQUMsNkJBQTZCLENBQUMsQ0FBQyxDQUFDLGdDQUFnQyxDQUFDO1lBQzVLLFlBQVksQ0FBQyxxQkFBcUIsQ0FBRSwwQkFBMEIsRUFBRSxXQUFXLEVBQUMsdUJBQXVCLENBQUUsQ0FBQztRQUMxRyxDQUFDLENBQUMsQ0FBQztRQUNILFFBQVEsQ0FBQyxxQkFBcUIsQ0FBRSwwQkFBMEIsQ0FBRSxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsR0FBRSxFQUFFLEdBQUUsWUFBWSxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFbkksVUFBVSxDQUFDLHFCQUFxQixDQUFFLHVCQUF1QixDQUFFLENBQUMsYUFBYSxDQUFFLGFBQWEsRUFBRSxHQUFFLEVBQUUsR0FBRSxZQUFZLENBQUMscUJBQXFCLENBQUUsdUJBQXVCLEVBQUUsd0JBQXdCLEVBQUUsb0JBQW9CLENBQUUsQ0FBQyxDQUFBLENBQUMsQ0FBQyxDQUFDO1FBQ2pOLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBRSx1QkFBdUIsQ0FBRSxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsR0FBRSxFQUFFLEdBQUUsWUFBWSxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFbEksVUFBVSxDQUFDLHFCQUFxQixDQUFFLHdCQUF3QixDQUFFLENBQUMsYUFBYSxDQUFFLGFBQWEsRUFBRSxHQUFFLEVBQUUsR0FBRSxZQUFZLENBQUMscUJBQXFCLENBQUUsd0JBQXdCLEVBQUUsK0JBQStCLEVBQUUsb0JBQW9CLENBQUUsQ0FBQyxDQUFBLENBQUMsQ0FBQyxDQUFDO1FBQzFOLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBRSx3QkFBd0IsQ0FBRSxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsR0FBRSxFQUFFLEdBQUUsWUFBWSxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFbkksVUFBVSxDQUFDLHFCQUFxQixDQUFFLG9CQUFvQixDQUFFLENBQUMsYUFBYSxDQUFFLGFBQWEsRUFBRSxHQUFFLEVBQUUsR0FBRSxZQUFZLENBQUMscUJBQXFCLENBQUUsb0JBQW9CLEVBQUUsc0JBQXNCLEVBQUUsb0JBQW9CLENBQUUsQ0FBQyxDQUFBLENBQUMsQ0FBQyxDQUFDO1FBQ3pNLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBRSxvQkFBb0IsQ0FBRSxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsR0FBRSxFQUFFLEdBQUUsWUFBWSxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFL0gsVUFBVSxDQUFDLHFCQUFxQixDQUFFLG1CQUFtQixDQUFFLENBQUMsYUFBYSxDQUFFLGFBQWEsRUFBRSxHQUFFLEVBQUUsR0FBRSxZQUFZLENBQUMscUJBQXFCLENBQUUsbUJBQW1CLEVBQUUscUJBQXFCLEVBQUUsdUJBQXVCLENBQUUsQ0FBQyxDQUFBLENBQUMsQ0FBQyxDQUFDO1FBQ3pNLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBRSxtQkFBbUIsQ0FBRSxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsR0FBRSxFQUFFLEdBQUUsWUFBWSxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFOUgsVUFBVSxDQUFDLHFCQUFxQixDQUFFLGtCQUFrQixDQUFFLENBQUMsYUFBYSxDQUFFLGFBQWEsRUFBRSxHQUFFLEVBQUUsR0FBRSxZQUFZLENBQUMscUJBQXFCLENBQUUsa0JBQWtCLEVBQUUseUJBQXlCLEVBQUUsdUJBQXVCLENBQUUsQ0FBQyxDQUFBLENBQUMsQ0FBQyxDQUFDO1FBQzNNLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBRSxrQkFBa0IsQ0FBRSxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsR0FBRSxFQUFFLEdBQUUsWUFBWSxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDakksQ0FBQztJQUVELFNBQWdCLEtBQUssQ0FBRSxjQUFzQixLQUFLO1FBRTlDLGtCQUFrQixFQUFFLENBQUM7UUFDckIsVUFBVSxDQUFDLHFCQUFxQixDQUFDLGtCQUFrQixDQUFDLENBQUMsV0FBVyxDQUFFLE1BQU0sQ0FBRSxDQUFDO1FBRTNFLFlBQVksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDekMsQ0FBQztJQU5lLHNCQUFLLFFBTXBCLENBQUE7SUFFRCxTQUFTLG1CQUFtQixDQUFFLElBQVc7UUFFckMsNkZBQTZGO1FBQzdGLElBQUssSUFBSSxJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBRyxHQUFHLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUMsQ0FBQyxDQUFDLEtBQUcsR0FBRyxFQUMxRTtZQUNJLElBQUssQ0FBQyxrQkFBa0IsQ0FBQyxjQUFjLENBQUUsSUFBSSxDQUFFLEVBQy9DO2dCQUNJLE1BQU0sS0FBSyxHQUFVLFlBQVksQ0FBQyxtQ0FBbUMsQ0FBRSxJQUFJLENBQUUsQ0FBQztnQkFDOUUsSUFBSSxFQUFFLEdBQUcsSUFBSSxZQUFZLENBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBRSxDQUFDO2dCQUN0QyxrQkFBa0IsQ0FBRSxJQUFJLENBQUUsR0FBRyxFQUFFLENBQUM7YUFDbkM7WUFFRCxNQUFNLElBQUksR0FBRyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNoRCxPQUFPLElBQUksR0FBRyxJQUFJLENBQUM7U0FDdEI7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQsS0FBSyxVQUFVLFlBQVksQ0FBRSxRQUFrQjtRQUUzQyxrQkFBa0IsQ0FBQyxpQkFBaUIsQ0FBRSxXQUFXLEVBQUUsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFFM0UsSUFBSSxRQUFRLENBQUMsU0FBUyxLQUFLLFNBQVMsRUFDcEM7WUFDSSxrQkFBa0IsQ0FBQyxpQkFBaUIsQ0FBRSxRQUFRLENBQUMsU0FBUyxFQUFFLFVBQVUsRUFBRSxRQUFRLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBRSxDQUFDO1NBQ3pHO1FBRUQsSUFBSSxTQUFTLEdBQUcsbUJBQW1CLENBQUUsUUFBUSxDQUFDLElBQUksQ0FBRSxDQUFDO1FBQ3JELElBQUksVUFBVSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUUsU0FBUyxFQUFFLGtCQUFrQixDQUFFLENBQUM7UUFFN0QsSUFBSSxXQUFXLEdBQXVCLEVBQUUsQ0FBQztRQUN6QyxJQUFLLFFBQVEsQ0FBQyxRQUFRLEVBQ3RCO1lBQ0ksSUFBSSxPQUFPLEdBQXFCO2dCQUM1QixJQUFJLEVBQUUsVUFBVTtnQkFDaEIsU0FBUyxFQUFFLE1BQU0sQ0FBRSxDQUFDLENBQUU7Z0JBQ3RCLE1BQU0sRUFBRSxRQUFRLENBQUMsTUFBTTthQUMxQixDQUFDO1lBQ0YsV0FBVyxDQUFDLElBQUksQ0FBRSxPQUFPLENBQUUsQ0FBQztTQUMvQjthQUVEO1lBQ0ksSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDO1lBQ25CLElBQUksU0FBUyxHQUFHLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQztZQUM1QixPQUFRLFVBQVUsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUN0QztnQkFDSSxJQUFJLFFBQVEsR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFFLE1BQU0sRUFBRSxVQUFVLENBQUUsQ0FBQztnQkFDeEQsSUFBSyxRQUFRLEdBQUcsVUFBVSxFQUMxQjtvQkFDSSxJQUFJLE9BQU8sR0FBcUI7d0JBQzVCLElBQUksRUFBRSxVQUFVLENBQUMsU0FBUyxDQUFFLFVBQVUsRUFBRSxRQUFRLENBQUU7d0JBQ2xELFNBQVMsRUFBRSxTQUFTO3dCQUNwQixNQUFNLEVBQUUsUUFBUSxDQUFDLE1BQU07cUJBQzFCLENBQUM7b0JBQ0YsV0FBVyxDQUFDLElBQUksQ0FBRSxPQUFPLENBQUUsQ0FBQztpQkFDL0I7Z0JBQ0QsSUFBSyxRQUFRLElBQUksQ0FBQyxDQUFDLEVBQ25CO29CQUNJLElBQUksT0FBTyxHQUFxQjt3QkFDNUIsSUFBSSxFQUFFLFVBQVUsQ0FBQyxTQUFTLENBQUUsVUFBVSxDQUFFO3dCQUN4QyxTQUFTLEVBQUUsU0FBUzt3QkFDcEIsTUFBTSxFQUFFLFFBQVEsQ0FBQyxNQUFNO3FCQUMxQixDQUFDO29CQUNGLFdBQVcsQ0FBQyxJQUFJLENBQUUsT0FBTyxDQUFFLENBQUM7b0JBQzVCLE1BQU07aUJBQ1Q7Z0JBRUQsSUFBSSxtQkFBbUIsR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFFLEtBQUssRUFBRSxRQUFRLENBQUUsQ0FBQztnQkFDaEUsSUFBSyxtQkFBbUIsSUFBSSxDQUFDLENBQUM7b0JBQUcsTUFBTTtnQkFFdkMsU0FBUyxHQUFHLE1BQU0sQ0FBRSxVQUFVLENBQUMsU0FBUyxDQUFFLFFBQVEsR0FBQyxDQUFDLEVBQUUsbUJBQW1CLENBQUUsQ0FBRSxDQUFDO2dCQUM5RSxTQUFTLEdBQUcsQ0FBRSxTQUFTLEdBQUcsQ0FBQyxDQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUU5QyxVQUFVLEdBQUcsbUJBQW1CLEdBQUcsQ0FBQyxDQUFDO2FBQ3hDO1NBQ0o7UUFFRCxLQUFLLE1BQU0sT0FBTyxJQUFJLFdBQVcsRUFDakM7WUFDSSxJQUFLLE9BQU8sQ0FBQyxTQUFTLEdBQUcsQ0FBQztnQkFDdEIsTUFBTSxLQUFLLENBQUMsS0FBSyxDQUFFLE9BQU8sQ0FBQyxTQUFtQixDQUFFLENBQUM7WUFFckQsWUFBWSxDQUFDLHVCQUF1QixDQUFFLHVCQUF1QixDQUFFLENBQUM7WUFDaEUsTUFBTSxlQUFlLENBQUUsT0FBTyxDQUFFLENBQUM7WUFDakMsWUFBWSxDQUFDLHNCQUFzQixDQUFFLHVCQUF1QixDQUFFLENBQUM7U0FDbEU7UUFFRCxJQUFJLFFBQVEsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLElBQUssUUFBUSxDQUFDLE1BQU0sS0FBSyxTQUFTLEVBQ3ZFO1lBQ0ksTUFBTSxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7U0FDM0I7SUFDTCxDQUFDO0lBRUosS0FBSyxVQUFVLGVBQWUsQ0FBRyxPQUF5QjtRQUVuRCxNQUFNLFNBQVMsR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFFLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxFQUFFLENBQUUsQ0FBQztRQUNuRSxTQUFTLENBQUMsa0JBQWtCLENBQUUsT0FBTyxDQUFDLE1BQU0sR0FBRyxVQUFVLENBQUUsQ0FBQztRQUU1RCxJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBRSxHQUFHLENBQUUsQ0FBQztRQUN2QyxJQUFJLGNBQWMsR0FBRyxTQUFTLENBQUMscUJBQXFCLENBQUUsdUJBQXVCLENBQWEsQ0FBQztRQUMzRixTQUFTLENBQUMsUUFBUSxDQUFFLE1BQU0sQ0FBRSxDQUFDO1FBQzdCLHdCQUF3QixFQUFFLENBQUM7UUFFM0IsNEZBQTRGO1FBQzVGLGNBQWMsQ0FBQyxJQUFJLEdBQUcsQ0FBRSxPQUFPLENBQUMsTUFBTSxLQUFLLFFBQVEsQ0FBRSxDQUFDO1FBRXRELElBQUksT0FBTyxDQUFDLE1BQU0sS0FBSyxRQUFRLEVBQy9CO1lBQ00sU0FBUyxDQUFDLHFCQUFxQixDQUFFLG1DQUFtQyxDQUFlLENBQUM7WUFDcEYsU0FBUyxDQUFDLHFCQUFxQixDQUFFLG1DQUFtQyxDQUFlLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUM7WUFDeEcsU0FBUyxDQUFDLHFCQUFxQixDQUFFLGNBQWMsQ0FBdUIsQ0FBQyxlQUFlLENBQUUseUNBQXlDLENBQUMsQ0FBQztZQUNySSxNQUFNLEtBQUssQ0FBQyxLQUFLLENBQUUsRUFBWSxDQUFFLENBQUM7WUFFbEMsa0JBQWtCLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDcEMsSUFBSSxhQUFhLEdBQUcsRUFBRSxDQUFDO1lBQ3ZCLEtBQUssTUFBTSxJQUFJLElBQUksTUFBTSxFQUN6QjtnQkFDSSxNQUFNLEtBQUssQ0FBQyxLQUFLLENBQUUsR0FBYSxDQUFFLENBQUM7Z0JBQ25DLGFBQWEsR0FBRyxhQUFhLEdBQUcsSUFBSSxHQUFHLEdBQUcsQ0FBQztnQkFDM0MsY0FBYyxDQUFDLElBQUksR0FBRyxhQUFhLENBQUM7YUFDdkM7U0FDSjthQUVEO1lBQ0ksY0FBYyxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDO1lBQ25DLE1BQU0sS0FBSyxDQUFDLEtBQUssQ0FBRSxFQUFZLENBQUUsQ0FBQztZQUNsQyxrQkFBa0IsQ0FBQyxjQUFjLEVBQUUsQ0FBQztTQUN2QztJQUNSLENBQUM7SUFFRSxLQUFLLFVBQVUsNEJBQTRCO1FBRXZDLENBQUMsQ0FBQyxHQUFHLENBQUUsb0NBQW9DLEdBQUcsaUJBQWlCLENBQUUsQ0FBQztRQUVsRSxJQUFJLFNBQVMsR0FBRyxZQUFZLENBQUMscUJBQXFCLENBQUUsaUJBQWlCLEVBQUUsZ0NBQWdDLENBQUUsQ0FBQztRQUMxRyxDQUFDLENBQUMsR0FBRyxDQUFFLDJDQUEyQyxHQUFHLFNBQVMsQ0FBRSxDQUFDO1FBRWpFLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLGlCQUFpQixFQUFFLENBQUMsQ0FBQztRQUUzRCx5Q0FBeUM7UUFDekMsb0RBQW9EO1FBQ3BELElBQUk7UUFDSixzRkFBc0Y7UUFDdEYscURBQXFEO1FBQ3JELElBQUk7UUFFSixJQUFLLFNBQVMsSUFBSSxTQUFTLEVBQzNCO1lBQ0ksdURBQXVEO1lBQ3ZELGlCQUFpQixHQUFHLENBQUMsQ0FBQztZQUN0QixNQUFNLFlBQVksQ0FBRSxrQkFBa0IsQ0FBRSxDQUFDO1NBQzVDO2FBRUQ7WUFDSSxtREFBbUQ7WUFDbkQsaUJBQWlCLEdBQUcsU0FBbUIsQ0FBQztZQUN4QyxzQ0FBc0M7WUFDdEMsTUFBTSxZQUFZLENBQUUsZ0NBQWdDLENBQUUsQ0FBQztTQUMxRDtRQU9ELE1BQU0sT0FBTyxHQUFLLE9BQU8sQ0FBQyxPQUFxQixDQUFDLElBQUksQ0FBRSxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLEtBQUssT0FBTyxDQUFDLEtBQUssQ0FBRSxDQUFBO1FBQzVGLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBRSxPQUFPLEVBQUUsY0FBYyxDQUFFLE9BQU8sRUFBRSxLQUFlLEVBQUcsT0FBTyxFQUFFLEtBQWUsQ0FBRSxDQUFDLENBQUM7UUFDOUcsVUFBVSxDQUFDLHFCQUFxQixDQUFFLHdCQUF3QixDQUFFLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBQyxHQUFFLEVBQUU7WUFDekYsbUJBQW1CLEVBQUUsQ0FBQztRQUMxQixDQUFDLENBQUMsQ0FBQztRQUVILFVBQVUsQ0FBQyxxQkFBcUIsQ0FBRSwwQkFBMEIsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxXQUFXLEVBQUUsSUFBSSxDQUFFLENBQUM7UUFDL0YsVUFBVSxDQUFDLHFCQUFxQixDQUFFLHVCQUF1QixDQUFDLENBQUMsV0FBVyxDQUFFLFlBQVksR0FBRSxZQUFZLEVBQUUsSUFBSSxDQUFFLENBQUM7SUFDL0csQ0FBQztJQUVELEtBQUssVUFBVSwrQkFBK0IsQ0FBRSxnQkFBMEI7UUFFdEUsdUJBQXVCO1FBQ3ZCLE1BQU0sYUFBYSxHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUUsT0FBTyxFQUFFLGtCQUFrQixFQUFFLEVBQUUsQ0FBRSxDQUFDO1FBQ3ZFLGFBQWEsQ0FBQyxrQkFBa0IsQ0FBRSxjQUFjLENBQUUsQ0FBQztRQUNqRCxhQUFhLENBQUMscUJBQXFCLENBQUUsY0FBYyxDQUF1QixDQUFDLGVBQWUsQ0FBRSx5Q0FBeUMsQ0FBRSxDQUFDO1FBQzFJLGFBQWEsQ0FBQyxRQUFRLENBQUUsTUFBTSxDQUFFLENBQUM7UUFDakMsTUFBTSxLQUFLLENBQUMsS0FBSyxDQUFFLEVBQVksQ0FBRSxDQUFDO1FBQ2xDLGtCQUFrQixDQUFDLGNBQWMsRUFBRSxDQUFDO1FBRXBDLElBQUssZ0JBQWdCLEVBQ3JCO1lBQ0ksTUFBTSxLQUFLLENBQUMsS0FBSyxDQUFFLEVBQVksQ0FBRSxDQUFDO1NBQ3JDO2FBRUQ7WUFDSSxpQkFBQSxnQkFBZ0IsR0FBRyxFQUFFLENBQUMsQ0FBQyw0REFBNEQ7WUFDbkYsMEJBQTBCLEdBQUcsQ0FBQyxDQUFDO1NBQ2xDO1FBRUQsT0FBTyxhQUFhLENBQUM7SUFDekIsQ0FBQztJQUVELEtBQUssVUFBVSxpQkFBaUIsQ0FBRSxxQkFBK0I7UUFFN0QscUVBQXFFO1FBQ3JFLEtBQUssSUFBSSxDQUFDLEdBQVUsQ0FBQyxFQUFFLENBQUMsRUFBRyxHQUFHLENBQUMsR0FDL0I7WUFDSSxNQUFNLEtBQUssQ0FBQyxLQUFLLENBQUUsQ0FBVyxDQUFFLENBQUM7WUFFakMsSUFBSyxxQkFBcUIsSUFBSSxDQUFFLDBCQUEwQixHQUFHLENBQUMsQ0FBRSxFQUNoRTtnQkFDSSxDQUFDLENBQUMsR0FBRyxDQUFFLDJCQUEyQixHQUFHLDBCQUEwQixHQUFHLGFBQWEsR0FBRyxpQkFBQSxnQkFBZ0IsQ0FBRSxDQUFDO2dCQUNyRyxPQUFPLGlCQUFBLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxpQkFBQSxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUM7YUFDbEU7WUFFRCxJQUFLLGlCQUFBLGdCQUFnQixFQUNyQjtnQkFDSSxDQUFDLENBQUMsR0FBRyxDQUFFLHFCQUFxQixHQUFHLGlCQUFBLGdCQUFnQixDQUFFLENBQUM7Z0JBQ2xELE9BQU8saUJBQUEsZ0JBQWdCLENBQUM7YUFDM0I7U0FDSjtRQUVELENBQUMsQ0FBQyxHQUFHLENBQUUsOEJBQThCLENBQUUsQ0FBQztRQUV4QyxZQUFZLENBQUMsa0JBQWtCLENBQ3BDLENBQUMsQ0FBQyxRQUFRLENBQUUsaUNBQWlDLENBQUUsRUFDL0MsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxnREFBZ0QsQ0FBRSxFQUM5RCxFQUFFLEVBQ0YsR0FBRyxFQUFFLEdBQUUsQ0FBQyxDQUNSLENBQUM7UUFFSSxLQUFLLENBQUUsS0FBSyxDQUFFLENBQUM7UUFFZixPQUFPLEVBQUUsQ0FBQztJQUNkLENBQUM7SUFFRCxLQUFLLFVBQVUsaUNBQWlDLENBQUUsYUFBc0I7UUFFcEUsb0JBQW9CLEVBQUUsQ0FBQyxDQUFDLDBGQUEwRjtRQUVsSCxhQUFhLENBQUMscUJBQXFCLENBQUUsWUFBWSxDQUFFLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztRQUNwRSxNQUFNLGFBQWEsR0FBRyxZQUFZLENBQUUsaUJBQUEsZ0JBQWdCLENBQUUsQ0FBQztRQUV2RCxDQUFDLENBQUMsR0FBRyxDQUFFLHNCQUFzQixHQUFHLGFBQWEsQ0FBQyxPQUFPLEdBQUcsSUFBSSxHQUFHLGFBQWEsQ0FBQyxRQUFRLEdBQUcsSUFBSSxHQUFHLGFBQWEsQ0FBQyxLQUFLLENBQUUsQ0FBQztRQUVySCx3QkFBd0IsRUFBRSxDQUFDO1FBQzNCLE1BQU0sNEJBQTRCLENBQUUsYUFBYSxFQUFFLGFBQWEsQ0FBRSxDQUFDO1FBQ25FLGtCQUFrQixDQUFFLGFBQWEsQ0FBRSxDQUFDO1FBQ3BDLE1BQU0sb0JBQW9CLENBQUUsYUFBYSxDQUFFLENBQUM7UUFDNUMsTUFBTSxLQUFLLENBQUMsS0FBSyxDQUFFLEVBQVksQ0FBRSxDQUFDO1FBQ2xDLGtCQUFrQixDQUFDLGNBQWMsRUFBRSxDQUFDO1FBRXBDLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBRSxxQkFBcUIsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxNQUFNLEVBQUUsSUFBSSxDQUFFLENBQUM7UUFFckYsSUFBSSxxQkFBcUIsR0FBRyxVQUFVLENBQUMscUJBQXFCLENBQUMsNEJBQTRCLENBQUMsQ0FBQztRQUUzRixJQUFLLENBQUMscUJBQXFCLENBQUMsU0FBUyxDQUFFLE1BQU0sQ0FBQyxFQUFFLG9CQUFvQjtTQUNwRTtZQUNJLHFCQUFxQixDQUFDLFdBQVcsQ0FBRSxNQUFNLEVBQUUsSUFBSSxDQUFFLENBQUM7U0FDckQ7UUFFRCxJQUFJLGFBQWEsRUFBRSxFQUNuQjtZQUNJLHFCQUFxQixDQUFDLGlCQUFpQixDQUFFLHFCQUFxQixFQUFHLENBQUMsQ0FBQyxRQUFRLENBQUUsZ0NBQWdDLENBQUUsQ0FBQyxDQUFDO1NBQ3BIO2FBRUQ7WUFDSSxxQkFBcUIsQ0FBQyxpQkFBaUIsQ0FBRSxhQUFhLEVBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxnQkFBZ0IsR0FBRyxtQkFBbUIsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNoSCxxQkFBcUIsQ0FBQyxpQkFBaUIsQ0FBRSxxQkFBcUIsRUFBRyxDQUFDLENBQUMsUUFBUSxDQUFFLDBCQUEwQixFQUFFLHFCQUFxQixDQUFDLENBQUMsQ0FBQztTQUNwSTtRQUVELGlDQUFpQyxDQUFFLGFBQWEsQ0FBQyxxQkFBcUIsQ0FBRSxXQUFXLEdBQUcsYUFBYSxDQUFDLE1BQU0sQ0FBRSxFQUFFLGFBQWEsQ0FBRSxDQUFDO0lBQ2xJLENBQUM7SUFFRCxLQUFLLFVBQVUsNkJBQTZCO1FBRXhDLE1BQU0sYUFBYSxHQUFHLE1BQU0sK0JBQStCLEVBQUUsQ0FBQztRQUU5RCxZQUFZLENBQUMsNEJBQTRCLENBQUUsQ0FBQyxFQUFFLGlCQUFpQixFQUFFLGlCQUFpQixDQUFFLENBQUM7UUFFckYsSUFBSyxDQUFFLE1BQU0saUJBQWlCLEVBQUU7WUFDNUIsT0FBTztRQUVYLE1BQU0saUNBQWlDLENBQUUsYUFBYSxDQUFFLENBQUM7SUFDN0QsQ0FBQztJQUVELEtBQUssVUFBVSxnQkFBZ0I7UUFFM0IsSUFBSSxhQUFhLEdBQUcsTUFBTSwrQkFBK0IsRUFBRSxDQUFDO1FBRTVELFlBQVksQ0FBQyxpQkFBaUIsQ0FBRSxpQkFBaUIsRUFBRSxpQkFBaUIsRUFBRSxpQkFBaUIsQ0FBRSxDQUFDO1FBRTFGLElBQUssQ0FBRSxNQUFNLGlCQUFpQixFQUFFO1lBQzVCLE9BQU87UUFFWCxJQUFLLGFBQWEsRUFBRSxFQUNwQjtZQUNJLGFBQWEsQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1lBQ3hDLE1BQU0sWUFBWSxDQUFFLGVBQWUsQ0FBRSxDQUFDO1lBRXRDLGFBQWEsR0FBRyxNQUFNLCtCQUErQixDQUFFLElBQUksQ0FBRSxDQUFDO1NBQ2pFO1FBRUQsTUFBTSxpQ0FBaUMsQ0FBRSxhQUFhLENBQUUsQ0FBQztJQUM3RCxDQUFDO0lBRUQsS0FBSyxVQUFVLHFCQUFxQjtRQUVoQyxNQUFNLGFBQWEsR0FBRyxNQUFNLCtCQUErQixFQUFFLENBQUM7UUFFOUQsWUFBWSxDQUFDLGlCQUFpQixDQUFFLGlCQUFpQixFQUFFLGlCQUFpQixFQUFFLGlCQUFpQixDQUFFLENBQUM7UUFDMUYsNEJBQTRCLEdBQUcsSUFBSSxDQUFDO1FBRXBDLElBQUssQ0FBRSxNQUFNLGlCQUFpQixDQUFFLElBQUksQ0FBRSxFQUFHLHNDQUFzQztZQUMzRSxPQUFPO1FBRVgsYUFBYSxDQUFDLHVCQUF1QixFQUFFLENBQUM7UUFDeEMsTUFBTSxZQUFZLENBQUUsY0FBYyxDQUFFLENBQUM7UUFDckMsTUFBTSxLQUFLLENBQUMsS0FBSyxDQUFFLEdBQWEsQ0FBRSxDQUFDO1FBQ25DLE1BQU0sWUFBWSxDQUFFLGlDQUFpQyxDQUFFLENBQUM7SUFDNUQsQ0FBQztJQUVELEtBQUssVUFBVSxnQ0FBZ0M7UUFFM0MsTUFBTSxpQkFBaUIsR0FBRyxFQUFFLEdBQUMsWUFBWSxDQUFDLHNCQUFzQixDQUFDLGlCQUFpQixDQUFDLEdBQUMsR0FBRyxHQUFDLGlCQUFpQixHQUFDLEdBQUcsQ0FBQztRQUM5RyxDQUFDLENBQUMsR0FBRyxDQUFFLG9DQUFvQyxHQUFHLGlCQUFpQixDQUFFLENBQUM7UUFDbEUsUUFBUSxDQUFDLGlCQUFpQixDQUFFLGlCQUFpQixDQUFFLENBQUM7SUFDcEQsQ0FBQztJQUVELFNBQVMscUJBQXFCLENBQUcsUUFBZ0I7UUFFN0MsQ0FBQyxDQUFDLEdBQUcsQ0FBRSx5QkFBeUIsR0FBRyxRQUFRLENBQUUsQ0FBQztRQUM5Qyw0QkFBNEIsR0FBRyxJQUFJLENBQUM7UUFFcEMsMkVBQTJFO1FBQzNFLGlGQUFpRjtRQUVqRixNQUFNLGtCQUFrQixHQUN4QjtZQUNJLElBQUksRUFBRSx1Q0FBdUM7WUFDN0MsTUFBTSxFQUFFLFFBQVE7U0FDbkIsQ0FBQztRQUNGLFlBQVksQ0FBRSxrQkFBa0IsQ0FBRSxDQUFDO0lBQ3ZDLENBQUM7SUFFRCxTQUFTLHFCQUFxQixDQUFHLE9BQWUsRUFBRSxXQUFvQixFQUFFLE9BQWdCLEVBQUUsUUFBZ0I7UUFFdEcsNkVBQTZFO1FBQzdFLElBQUssT0FBTyxLQUFLLG9DQUFvQyxFQUNyRDtZQUNJLFlBQVksQ0FBRSxtQkFBbUIsQ0FBRSxDQUFDO1lBQ3BDLE9BQU87U0FDVjtRQUVELHFGQUFxRjtRQUNyRixJQUFLLE9BQU87WUFBRyxPQUFPO1FBRXRCLGdHQUFnRztRQUNoRyxJQUFLLE9BQU8sS0FBSyxxQ0FBcUMsRUFDdEQ7WUFDSSxDQUFDLENBQUMsR0FBRyxDQUFFLGdFQUFnRSxDQUFFLENBQUM7WUFDMUUsTUFBTSxrQkFBa0IsR0FDeEI7Z0JBQ0ksSUFBSSxFQUFFLE9BQU87Z0JBQ2IsTUFBTSxFQUFFLGdCQUFnQjtnQkFDeEIsTUFBTSxFQUFFLEdBQUUsRUFBRTtvQkFDUixvQkFBb0IsQ0FBRSxLQUFLLENBQUUsQ0FBQztnQkFDbEMsQ0FBQzthQUNKLENBQUM7WUFFRixZQUFZLENBQUUsa0JBQWtCLENBQUUsQ0FBQztZQUNuQyxPQUFPO1NBQ1Y7UUFFUCw0REFBNEQ7UUFDdEQsTUFBTSxrQkFBa0IsR0FDeEI7WUFDSSxJQUFJLEVBQUUsT0FBTztZQUNiLE1BQU0sRUFBRSxjQUFjO1lBQ3RCLE1BQU0sRUFBRSxHQUFFLEVBQUU7Z0JBQ1IsTUFBTSxpQkFBaUIsR0FBRyxDQUFDLDRCQUE0QjtvQkFDbkQsQ0FBRSxPQUFPLEtBQUssZ0RBQWdELENBQUU7b0JBQ2hFLENBQUUsT0FBTyxLQUFLLHVDQUF1QyxDQUFFLENBQUM7Z0JBQzVELG9CQUFvQixDQUFFLGlCQUFpQixDQUFFLENBQUM7WUFDOUMsQ0FBQztTQUNKLENBQUM7UUFDRixZQUFZLENBQUUsa0JBQWtCLENBQUUsQ0FBQztJQUMxQyxDQUFDO0lBRUUsS0FBSyxVQUFVLG9CQUFvQixDQUFFLGFBQXlCO1FBRTFELGdEQUFnRDtRQUNoRCxJQUFJLGFBQWEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLGFBQWEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUM1RDtZQUNJLElBQUksYUFBYSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQzlCO2dCQUNJLE1BQU0sWUFBWSxDQUFHLFlBQVksQ0FBRSxDQUFDO2FBQ3ZDO2lCQUNJLElBQUksYUFBYSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQ25DO2dCQUNJLE1BQU0sWUFBWSxDQUFHLGdCQUFnQixDQUFFLENBQUM7YUFDM0M7WUFFRCxJQUFJLGFBQWEsQ0FBQyxTQUFTLEVBQzNCO2dCQUNJLE1BQU0sWUFBWSxDQUFFLHNCQUFzQixDQUFFLENBQUM7YUFFaEQ7aUJBQ0ksSUFBSSxhQUFhLENBQUMsT0FBTyxLQUFLLENBQUMsRUFDcEM7Z0JBQ0ksTUFBTSxZQUFZLENBQUUsd0JBQXdCLENBQUUsQ0FBQzthQUNsRDtTQUNKO2FBQ0ksSUFBSSxhQUFhLENBQUMsT0FBTyxLQUFLLENBQUMsRUFDcEM7WUFDSSxNQUFNLFlBQVksQ0FBRSxnQkFBZ0IsQ0FBRSxDQUFDO1NBQzFDO2FBQ0ksSUFBSSxhQUFhLENBQUMsU0FBUyxFQUNoQztZQUNJLE1BQU0sWUFBWSxDQUFFLGNBQWMsQ0FBRSxDQUFDO1NBQ3hDO1FBQ0QseUNBQXlDO2FBQ3BDLElBQUssYUFBYSxDQUFDLE9BQU8sS0FBSyxDQUFDLElBQUksV0FBVyxDQUFFLEVBQUUsQ0FBRTtlQUNuRCxDQUFFLE1BQU0sZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUUsaUJBQWlCLENBQUUsQ0FBRSxFQUN2RTtZQUNJLENBQUM7U0FDSjthQUNJLElBQUssYUFBYSxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksV0FBVyxDQUFFLEVBQUUsQ0FBRTtlQUNsRCxDQUFFLE1BQU0sZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUUsZ0JBQWdCLENBQUUsQ0FBRSxFQUN0RTtZQUNJLENBQUM7U0FDSjthQUNJLElBQUssYUFBYSxDQUFDLE9BQU8sS0FBSyxDQUFDLElBQUksV0FBVyxDQUFFLEVBQUUsQ0FBRTtlQUNuRCxDQUFFLE1BQU0sZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUUsbUJBQW1CLENBQUUsQ0FBRSxFQUN6RTtZQUNJLENBQUM7U0FDSjthQUNJLElBQUssV0FBVyxDQUFFLEVBQUUsQ0FBRSxJQUFJLENBQUUsQ0FBQyxJQUFJLGdCQUFnQixDQUFDLFFBQVEsQ0FBRSxjQUFjLENBQUMsSUFBSSxDQUFFLENBQUUsRUFDeEY7WUFDSSxJQUFJLFlBQVksQ0FBQyxrQkFBa0IsQ0FBRSxhQUFhLENBQUMsTUFBTSxFQUFHLEVBQUUsQ0FBRSxFQUNoRTtnQkFDSSxJQUFJLGNBQWMsQ0FBQyxTQUFTLEtBQUssU0FBUyxFQUMxQztvQkFDSSxNQUFNLFVBQVUsR0FBRyxZQUFZLENBQUMsa0JBQWtCLENBQUUsYUFBYSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUUsQ0FBQztvQkFDL0UsTUFBTSxTQUFTLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUUsQ0FBQztvQkFDOUMsTUFBTSxTQUFTLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBRSxNQUFNLEVBQUUsU0FBUyxDQUFFLENBQUM7b0JBQzFELElBQUssU0FBUyxJQUFJLENBQUMsQ0FBQyxJQUFJLFNBQVMsSUFBSSxDQUFDLENBQUMsSUFBSSxTQUFTLEdBQUcsU0FBUyxFQUNoRTt3QkFDSSxjQUFjLENBQUMsU0FBUyxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUMsU0FBUyxDQUFFLFNBQVMsRUFBRSxTQUFTLEdBQUcsQ0FBQyxDQUFFLENBQUM7d0JBQ3ZGLElBQUssY0FBYyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFFLE1BQU0sQ0FBRSxJQUFJLENBQUMsQ0FBQyxFQUNoRTs0QkFDSSxnQkFBZ0IsQ0FBQyxjQUFjLENBQUUsY0FBYyxDQUFDLElBQUksQ0FBRSxDQUFDOzRCQUN2RCxNQUFNLFlBQVksQ0FBRSxjQUFjLENBQUUsQ0FBQzt5QkFDeEM7cUJBQ0o7aUJBQ0o7YUFDSjtTQUNKO0lBQ0wsQ0FBQztJQUVELFNBQVMsWUFBWSxDQUFFLE1BQWE7UUFFaEMsTUFBTSxhQUFhLEdBQWdCO1lBQy9CLE1BQU0sRUFBRSxNQUFNO1lBQ2QsT0FBTyxFQUFFLFlBQVksQ0FBQyxxQkFBcUIsQ0FBRSxNQUFNLENBQVk7WUFDL0QsTUFBTSxFQUFFLFlBQVksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDO1lBQzFDLFVBQVUsRUFBRSxZQUFZLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQztZQUM1QyxXQUFXLEVBQUUsWUFBWSxDQUFDLGtCQUFrQixDQUFFLE1BQU0sQ0FBRTtZQUN0RCxRQUFRLEVBQUUsWUFBWSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUM7WUFDMUMsU0FBUyxFQUFFLENBQUMsWUFBWSxDQUFDLHFCQUFxQixDQUFFLE1BQU0sRUFBRSxZQUFZLENBQUUsQ0FBQyxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLO1lBQ3BHLFFBQVEsRUFBRSxRQUFRLENBQUMsUUFBUSxDQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUUsTUFBTSxDQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsU0FBUztZQUN4RyxJQUFJLEVBQUUsWUFBWSxDQUFDLGtCQUFrQixDQUFFLE1BQU0sQ0FBRTtZQUMvQyxPQUFPLEVBQUUsWUFBWSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFDckMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxrQ0FBa0MsQ0FBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBWTtTQUNoRixDQUFDO1FBRUYsT0FBTyxhQUFhLENBQUM7SUFDekIsQ0FBQztJQUVELFNBQVMsd0JBQXdCO1FBRTdCLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxDQUFDLE9BQU8sQ0FBRSxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsRUFBRTtZQUN0RCxPQUFPLENBQUMsV0FBVyxDQUFFLGlCQUFpQixFQUFHLEtBQUssSUFBSSxDQUFFLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxDQUFDLE1BQU0sR0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ2pHLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVELFNBQVMsNEJBQTRCLENBQUUsYUFBcUIsRUFBRSxhQUF5QjtRQUVuRixNQUFNLE9BQU8sR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFFLE9BQU8sRUFDbEMsYUFBYSxDQUFDLHFCQUFxQixDQUFFLFlBQVksQ0FBRSxFQUNuRCxXQUFXLEdBQUcsYUFBYSxDQUFDLE1BQU0sQ0FBRSxDQUFDO1FBQ3pDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBRSxjQUFjLENBQUUsQ0FBQztRQUM1QyxPQUFPLENBQUMscUJBQXFCLENBQUUsd0JBQXdCLENBQWtCLENBQUMsTUFBTSxHQUFHLGFBQWEsQ0FBQyxNQUFNLENBQUM7UUFFekcsZUFBZSxDQUFFLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBRSx5QkFBeUIsQ0FBRSxFQUFFLGFBQWEsQ0FBQyxXQUFXLENBQUUsQ0FBQztRQUN6RyxlQUFlLENBQUUsVUFBVSxDQUFDLHFCQUFxQixDQUFFLHFCQUFxQixDQUFDLEVBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBRSxDQUFDO1FBQ3RHLE9BQU8sQ0FBQyxRQUFRLENBQUUsb0JBQW9CLEdBQUcsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRS9ELE9BQU8sQ0FBQyxpQkFBaUIsQ0FBRSxhQUFhLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxnQkFBZ0IsR0FBRyxtQkFBbUIsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMvRixPQUFPLENBQUMscUJBQXFCLENBQUUsZUFBZSxDQUFlLENBQUMsSUFBSTtZQUNoRSxhQUFhLEVBQUUsQ0FBQyxDQUFDO2dCQUNqQixDQUFDLENBQUMsUUFBUSxDQUFDLGdDQUFnQyxFQUFFLE9BQU8sQ0FBRSxDQUFDLENBQUM7Z0JBQ3hELENBQUMsQ0FBQyxRQUFRLENBQUUsOEJBQThCLEVBQUUsT0FBTyxDQUFFLENBQUM7UUFFMUQsT0FBTyxDQUFDLGlCQUFpQixDQUFFLFdBQVcsRUFBRSxhQUFhLENBQUMsUUFBUSxDQUFFLENBQUM7UUFDakUsT0FBTyxDQUFDLGlCQUFpQixDQUFFLGFBQWEsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFFLCtCQUErQixHQUFHLGFBQWEsQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFDO1FBQ2pILE9BQU8sQ0FBQyxpQkFBaUIsQ0FBRSxhQUFhLEVBQUUsYUFBYSxDQUFDLEtBQUssQ0FBRSxDQUFDO1FBQ2hFLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBRSxjQUFjLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBRSx1Q0FBdUMsRUFBRSxPQUFPLENBQVksQ0FBRSxDQUFDO1FBQ3RILE9BQU8sQ0FBQyxRQUFRLENBQUUsTUFBTSxDQUFFLENBQUM7SUFDL0IsQ0FBQztJQUVELFNBQVMsZUFBZSxDQUFFLE9BQWUsRUFBRSxXQUFtQjtRQUUxRCxJQUFLLFdBQVcsRUFDaEI7WUFDSSxPQUFPLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxXQUFXLENBQUM7U0FDekM7SUFDTCxDQUFDO0lBRUQsSUFBSSxjQUFjLEdBQWtCLElBQUksQ0FBQztJQUV6QyxTQUFTLGlCQUFpQjtRQUV0QixrQkFBa0IsRUFBRSxDQUFDO1FBQ3JCLE1BQU0sT0FBTyxHQUFHLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBRSxxQkFBcUIsQ0FBQyxDQUFDO1FBQ3pFLElBQUssQ0FBQyxpQkFBaUIsSUFBSSw0QkFBNEIsRUFDdkQ7WUFDSSxPQUFPLENBQUMsaUJBQWlCLENBQUUsaUJBQWlCLEVBQUUsR0FBRyxDQUFFLENBQUM7WUFDcEQsT0FBTztTQUNWO1FBRUQsTUFBTSxjQUFjLEdBQUcsWUFBWSxDQUFDLGlCQUFpQixDQUFFLGlCQUFpQixDQUFFLENBQUM7UUFFM0UsSUFBSSxRQUFRLEdBQUcsVUFBVSxDQUFDLDZDQUE2QyxDQUFFLGNBQWMsQ0FBNkIsQ0FBQztRQUNySCxnQkFBZ0IsQ0FBRSxRQUFRLEVBQUUsY0FBYyxDQUFFLENBQUM7UUFFN0MsSUFBSyxRQUFRLENBQUMsU0FBUyxJQUFJLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBRSxpQkFBaUIsQ0FBRSxFQUMzRTtZQUNJLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBRSxpQkFBaUIsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFFLGdDQUFnQyxDQUFFLENBQUUsQ0FBQztZQUMvRixPQUFPO1NBQ1Y7UUFFRCxPQUFPLENBQUMsaUJBQWlCLENBQUUsaUJBQWlCLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBRSxDQUFDO1FBQzlELE9BQU8sQ0FBQyxxQkFBcUIsQ0FBRSwyQkFBMkIsQ0FBRSxDQUFDLGFBQWEsQ0FBRSxhQUFhLEVBQUUsR0FBRSxFQUFFO1lBRTNGLFlBQVksQ0FBQyxxQkFBcUIsQ0FBRSwyQkFBMkIsRUFBRSw0QkFBNEIsRUFBRSx1QkFBdUIsQ0FBRSxDQUFDO1FBQzdILENBQUMsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxDQUFDLHFCQUFxQixDQUFFLDJCQUEyQixDQUFFLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxHQUFFLEVBQUU7WUFDMUYsWUFBWSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQ25DLENBQUMsQ0FBQyxDQUFDO1FBRUgsY0FBYyxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUUsQ0FBQyxFQUFFLGlCQUFpQixDQUFFLENBQUM7SUFDeEQsQ0FBQztJQUVELFNBQVMsZ0JBQWdCLENBQUUsUUFBZ0MsRUFBRSxjQUFxQjtRQUU5RSxNQUFNLFNBQVMsR0FBSSxVQUFVLENBQUMscUJBQXFCLENBQUUsbUJBQW1CLENBQUUsQ0FBQztRQUMzRSxNQUFNLGFBQWEsR0FBVSxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBRSxRQUFRLENBQUMsT0FBUSxHQUFDLElBQUksRUFBRSxHQUFHLENBQUUsQ0FBQyxDQUFDLENBQUM7UUFFMUgsU0FBUyxDQUFDLFdBQVcsQ0FBRSxPQUFPLEVBQUUsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFFLGFBQWEsR0FBRyxFQUFFLENBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUUsQ0FBQztRQUMzRyxTQUFTLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxhQUFhLENBQUMsUUFBUSxFQUFFLEdBQUcsSUFBSSxDQUFDO1FBQ3hELFNBQVMsQ0FBQyxvQkFBb0IsQ0FBRSxTQUFTLEVBQUUsYUFBYSxDQUFFLENBQUM7UUFFM0QsVUFBVSxDQUFDLHFCQUFxQixDQUFFLDZCQUE2QixDQUFFLENBQUMsYUFBYSxDQUFFLGFBQWEsRUFBRSxHQUFFLEVBQUU7WUFDaEcsSUFBSSxXQUFXLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBRSx5QkFBeUIsRUFBRSxTQUFTLENBQUUsQ0FBQztZQUNyRSxZQUFZLENBQUMscUJBQXFCLENBQUUsNkJBQTZCLEVBQUUsV0FBVyxFQUFFLHVCQUF1QixDQUFFLENBQUM7UUFDOUcsQ0FBQyxDQUFDLENBQUM7UUFDSCxVQUFVLENBQUMscUJBQXFCLENBQUUsNkJBQTZCLENBQUUsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLEdBQUUsRUFBRSxHQUFFLFlBQVksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzVJLENBQUM7SUFFRCxTQUFTLGtCQUFrQjtRQUV2QixJQUFJLGNBQWMsS0FBSyxJQUFJLEVBQzNCO1lBQ0ksQ0FBQyxDQUFDLGVBQWUsQ0FBRSxjQUFjLENBQUUsQ0FBQztZQUNwQyxjQUFjLEdBQUcsSUFBSSxDQUFDO1NBQ3pCO0lBQ0wsQ0FBQztJQUVELFNBQVMsb0JBQW9CLENBQUUsVUFBa0IsS0FBSztRQUVsRCxJQUFLLDRCQUE0QjtZQUM3QixPQUFPLEdBQUcsS0FBSyxDQUFDO1FBRXBCLFVBQVUsQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQzdCLFNBQVMsQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQzVCLFVBQVUsQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQzdCLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBRSx3QkFBd0IsQ0FBQyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDOUUsVUFBVSxDQUFDLHFCQUFxQixDQUFFLGtCQUFrQixDQUFDLENBQUMsV0FBVyxDQUFFLE9BQU8sRUFBRSxDQUFDLE9BQU8sQ0FBRSxDQUFDO0lBQzNGLENBQUM7SUFFRCxJQUFJLGFBQWEsR0FBaUIsSUFBSSxDQUFDO0lBQ3ZDLElBQUkscUJBQXFCLEdBQXFCLElBQUksQ0FBQztJQUVuRCxTQUFTLGlDQUFpQyxDQUFFLE9BQWUsRUFBRSxhQUEwQjtRQUVuRixhQUFhLEdBQUcsT0FBTyxDQUFDO1FBQ3hCLHFCQUFxQixHQUFHLGFBQWEsQ0FBQztRQUN0QyxNQUFNLGNBQWMsR0FBRyxDQUFDLENBQUM7UUFFekIsSUFBSSxRQUFRLEdBQUcsYUFBYSxDQUFDLEtBQUssQ0FBQztRQUNuQyxVQUFVLENBQUMsaUJBQWlCLENBQUUsT0FBTyxFQUFFLFFBQVEsQ0FBRSxDQUFDO1FBRWxELDJCQUEyQjtRQUMzQixVQUFVLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztRQUMxQixTQUFTLENBQUMsT0FBTyxHQUFHLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBRSxjQUFjLEtBQUssQ0FBQyxDQUFFLENBQUM7UUFDakUsVUFBVSxDQUFDLE9BQU8sR0FBRyxhQUFhLEVBQUUsSUFBSSxDQUFFLGNBQWMsS0FBSyxDQUFDLENBQUUsQ0FBQztRQUNqRSxVQUFVLENBQUMscUJBQXFCLENBQUUsd0JBQXdCLENBQUMsQ0FBQyxPQUFPLEdBQUcsQ0FBRSxjQUFjLEtBQUssQ0FBQyxDQUFFLENBQUM7UUFDL0YsVUFBVSxDQUFDLHFCQUFxQixDQUFFLGtCQUFrQixDQUFDLENBQUMsT0FBTyxHQUFHLENBQUUsY0FBYyxLQUFLLENBQUMsQ0FBRSxDQUFDO1FBRXpGLDZCQUE2QjtRQUM3QixJQUFJLFVBQVUsQ0FBQyxPQUFPLEVBQ3RCO1lBQ0ksTUFBTSxjQUFjLEdBQWlDO2dCQUNqRCxHQUFHLEVBQUUsVUFBVTtnQkFDZixPQUFPLEVBQUUsa0NBQWtDO2dCQUMzQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxtQkFBbUIsQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLFVBQVUsQ0FBRTtnQkFDN0UsWUFBWSxFQUFDLHVCQUF1QjtnQkFDcEMsWUFBWSxFQUFFLDBCQUEwQjtnQkFDeEMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO29CQUV0QixvQkFBb0IsQ0FBRSxLQUFLLENBQUUsQ0FBQztvQkFDOUIsWUFBWSxDQUFFLHlCQUF5QixDQUFFLENBQUM7b0JBQzFDLFlBQVksQ0FBQyxtQkFBbUIsQ0FBRSwwQkFBMEIsQ0FBRSxDQUFDO2dCQUNuRSxDQUFDO2FBQ0osQ0FBQztZQUNGLFVBQVUsQ0FBQyxXQUFXLENBQUUsY0FBYyxDQUFFLENBQUM7U0FDNUM7UUFFRCxJQUFJLFVBQVUsQ0FBQyxPQUFPLEVBQ3RCO1lBQ0ksTUFBTSxjQUFjLEdBQWlDO2dCQUNqRCxHQUFHLEVBQUUsVUFBVTtnQkFDZixPQUFPLEVBQUUsNkJBQTZCO2dCQUN0QyxTQUFTLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUU7Z0JBQ3ZDLFlBQVksRUFBQyx1QkFBdUI7Z0JBQ3BDLFlBQVksRUFBRSwwQkFBMEI7Z0JBQ3hDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtvQkFFdEIsb0JBQW9CLENBQUUsS0FBSyxDQUFFLENBQUM7b0JBQzlCLHFCQUFxQixFQUFFLENBQUM7Z0JBQzVCLENBQUM7YUFDSixDQUFDO1lBQ0YsVUFBVSxDQUFDLFdBQVcsQ0FBRSxjQUFjLENBQUUsQ0FBQztTQUM1QztRQUVELElBQUksU0FBUyxDQUFDLE9BQU8sRUFDckI7WUFDSSxNQUFNLGFBQWEsR0FBaUM7Z0JBQ2hELEdBQUcsRUFBRSxTQUFTO2dCQUNkLE9BQU8sRUFBRSxrQ0FBa0M7Z0JBQzNDLFNBQVMsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFFLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsbUJBQW1CLENBQUMsaUJBQWlCLENBQUMsRUFBRSxTQUFTLENBQUU7Z0JBQ2xILFlBQVksRUFBQyx1QkFBdUI7Z0JBQ3BDLFlBQVksRUFBRSwwQkFBMEI7Z0JBQ3hDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtvQkFFdEIsb0JBQW9CLENBQUUsS0FBSyxDQUFFLENBQUM7b0JBQzlCLE9BQU8sQ0FBQyxXQUFXLENBQUUsVUFBVSxFQUFFLElBQUksQ0FBRSxDQUFDO29CQUN4QyxPQUFPLENBQUMsaUJBQWlCLENBQUUsY0FBYyxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUUsZ0RBQWdELEVBQUUsT0FBTyxDQUFFLENBQUUsQ0FBQztvQkFDbkgsT0FBTyxDQUFDLHFCQUFxQixDQUFFLGVBQWUsQ0FBZSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFFLDBDQUEwQyxFQUFFLE9BQU8sQ0FBRSxDQUFDO29CQUN6SSxVQUFVLENBQUMscUJBQXFCLENBQUUsa0NBQWtDLENBQUUsQ0FBQyxXQUFXLENBQUUsTUFBTSxFQUFFLEtBQUssQ0FBRSxDQUFDO29CQUNwRyxVQUFVLENBQUMscUJBQXFCLENBQUUsK0JBQStCLENBQUUsQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLDhDQUE4QyxDQUFDO29CQUNySSxVQUFVLENBQUMscUJBQXFCLENBQUUscUJBQXFCLENBQUUsQ0FBQyxXQUFXLENBQUUsTUFBTSxFQUFFLEtBQUssQ0FBRSxDQUFDO29CQUN2RixZQUFZLENBQUMsbUJBQW1CLENBQUUsMEJBQTBCLENBQUUsQ0FBQztvQkFFL0QsTUFBTSxPQUFPLEdBQUcsVUFBVSxDQUFDLHFCQUFxQixDQUFFLHdCQUF3QixDQUEyQixDQUFDO29CQUN0RyxJQUFJLE9BQU8sRUFDWDt3QkFDSSxPQUFPLENBQUMsV0FBVyxDQUFFLEdBQUcsQ0FBRSxDQUFDO3FCQUM5QjtvQkFFRCxZQUFZLENBQUUscUJBQXFCLENBQUUsQ0FBQztvQkFDdEMsWUFBWSxDQUFFLGVBQWUsQ0FBRSxDQUFDO2dCQUNwQyxDQUFDO2FBQ0osQ0FBQztZQUNGLFVBQVUsQ0FBQyxXQUFXLENBQUUsYUFBYSxDQUFFLENBQUM7U0FDM0M7UUFFRCxtQ0FBbUM7UUFDbkMsb0JBQW9CLENBQUUsY0FBYyxLQUFLLENBQUMsQ0FBRSxDQUFDO0lBQ2pELENBQUM7SUFFRCxTQUFnQixrQkFBa0I7UUFFOUIsK0RBQStEO1FBQy9ELElBQUssNEJBQTRCO1lBQUcsT0FBTztRQUMzQyxJQUFLLFlBQVksQ0FBQyxhQUFhLENBQUUsaUJBQWlCLENBQUU7WUFBRyxPQUFPO1FBRTlELGlCQUFpQixFQUFFLENBQUM7UUFFcEIsNEJBQTRCLEdBQUcsSUFBSSxDQUFDO1FBQ3BDLGlCQUFpQixHQUFHLEVBQUUsQ0FBQztRQUV2QixvQkFBb0IsQ0FBRSxLQUFLLENBQUUsQ0FBQztRQUM5QixVQUFVLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztRQUMzQixZQUFZLENBQUUsc0JBQXNCLENBQUUsQ0FBQztJQUUzQyxDQUFDO0lBZmUsbUNBQWtCLHFCQWVqQyxDQUFBO0lBRUQsU0FBZ0IsK0JBQStCLENBQUUsV0FBbUIsRUFBRSxNQUFjLEVBQUUsTUFBYztRQUVoRyxJQUFLLE1BQU0sS0FBSyxTQUFTLElBQUksaUNBQWlDLEVBQzlEO1lBQ0ksaUNBQWlDLEdBQUcsQ0FBQyxDQUFDO1lBQ3RDLGtCQUFrQixFQUFFLENBQUM7WUFDckIsWUFBWSxDQUFDLCtCQUErQixDQUNwRCxFQUFFLEVBQ0YsZ0VBQWdFLEVBQ2hFLE1BQU0sQ0FDTixDQUFDO1lBQ08sT0FBTztTQUNWO1FBRUQsSUFBSyxXQUFXLEtBQUssSUFBSSxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBRSxpQkFBaUIsQ0FBRTtZQUFHLE9BQU8sQ0FBQyw0REFBNEQ7UUFDdEosSUFBSyxNQUFNLEtBQUssaUJBQWlCO1lBQUcsT0FBTztRQUUzQyxFQUFHLDBCQUEwQixDQUFDO1FBRTlCLElBQUksU0FBUyxHQUFHLFlBQVksQ0FBQyxxQkFBcUIsQ0FBRSxpQkFBaUIsRUFBRSxnQ0FBZ0MsQ0FBRSxDQUFDO1FBQzFHLElBQUssU0FBUyxLQUFLLFNBQVM7WUFDeEIsaUJBQWlCLEdBQUcsQ0FBQyxDQUFDO2FBRTFCO1lBQ0ksaUJBQWlCLEdBQUcsU0FBbUIsQ0FBQztZQUN4QyxzQ0FBc0M7U0FDekM7UUFFRCxZQUFZLENBQUMsMEJBQTBCLENBQUUsY0FBYyxFQUFFLEtBQUssRUFBRSxpQkFBaUIsR0FBQyxpQkFBaUIsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFFLENBQUM7UUFDOUcsTUFBTSxLQUFLLEdBQUcsWUFBWSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDL0MsTUFBTSxXQUFXLEdBQUcsQ0FBRSxLQUFLLElBQUksQ0FBRSxLQUFLLEdBQUcsQ0FBQyxDQUFFLENBQUUsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLHlCQUF5QixDQUFFLENBQUMsQ0FBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFFbEcsQ0FBQyxDQUFDLEdBQUcsQ0FBRSwyREFBMkQsR0FBRyxpQkFBaUIsR0FBRyxVQUFVLEdBQUcsS0FBSyxHQUFHLFlBQVksR0FBRyxXQUFXLEdBQUcsR0FBRyxDQUFFLENBQUM7UUFDakosSUFBSyxDQUFDLFdBQVc7WUFBRyxPQUFPO1FBQzNCLElBQUssQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFFLFdBQVcsQ0FBRTtZQUFHLE9BQU87UUFFekQsNkVBQTZFO1FBQzdFLGlCQUFBLGdCQUFnQixHQUFHLFdBQVcsQ0FBQztJQUNuQyxDQUFDO0lBdENlLGdEQUErQixrQ0FzQzlDLENBQUE7SUFFRCxTQUFTLGtCQUFrQixDQUFFLGFBQXlCO1FBRWxELElBQUksVUFBVSxHQUFHLDBCQUEwQixDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQyxJQUFJLEtBQUssYUFBYSxDQUFDLE9BQU8sQ0FBRSxDQUFDO1FBQy9HLElBQUksWUFBWSxHQUFHLFVBQVUsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztRQUN0RSxJQUFJLE1BQU0sR0FBRyxTQUFTLEdBQUcsYUFBYSxDQUFDLFFBQVEsR0FBRyxHQUFHLEdBQUcsWUFBWSxDQUFDO1FBQ3JFLElBQUksT0FBTyxHQUFHLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBRSx3QkFBd0IsQ0FBMkIsQ0FBQztRQUVwRyxJQUFJLElBQUksR0FBRyxZQUFZLENBQUMsY0FBYyxDQUFFLGFBQWEsQ0FBQyxNQUFNLENBQUUsQ0FBQztRQUMvRCxJQUFJLFdBQVcsR0FBRyxJQUFJLEtBQUssZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO1FBQ3RELElBQUksZUFBZSxHQUFHLElBQUksS0FBSyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDekQsSUFBSSxlQUFlLEdBQUcsSUFBSSxLQUFLLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUN6RCxJQUFJLGNBQWMsR0FBRyxJQUFJLEtBQUssZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1FBRXhELElBQUksQ0FBQyxPQUFPLEVBQ1o7WUFDSSxPQUFPLEdBQUcsd0JBQXdCLENBQUUsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDLElBQUksS0FBSyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7WUFDcEYsVUFBVSxDQUFDLFlBQVksR0FBRyx3QkFBd0IsQ0FBQztTQUN0RDtRQUVELFVBQVUsQ0FBQyxxQkFBcUIsQ0FBRSx1QkFBdUIsQ0FBRSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUUsSUFBSSxLQUFLLGdCQUFnQixDQUFFLENBQUM7UUFFckcsT0FBTyxDQUFDLGlCQUFpQixDQUFHLFdBQVcsRUFBRSxXQUFXLENBQUUsQ0FBQztRQUN2RCxPQUFPLENBQUMsbUJBQW1CLENBQUcsZUFBZSxFQUFFLGVBQWUsQ0FBRSxDQUFDO1FBQ2pFLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBRyxjQUFjLEVBQUUsY0FBYyxDQUFFLENBQUM7UUFDL0QsT0FBTyxDQUFDLGFBQWEsQ0FBRSxDQUFDLENBQUUsQ0FBQztRQUMzQixPQUFPLENBQUMsYUFBYSxDQUFFLGFBQWEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFFLENBQUM7UUFDbEQsT0FBTyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUUxQixJQUFLLE9BQU8sQ0FBQyxjQUFjLEVBQUUsRUFDN0I7WUFDSSxPQUFPLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzlCLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUN2QixPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7U0FDdEI7UUFFRCxVQUFVLENBQUMscUJBQXFCLENBQUUsa0NBQWtDLENBQUUsQ0FBQyxXQUFXLENBQUUsTUFBTSxFQUFFLElBQUksQ0FBRSxDQUFDO1FBQ3pHLE9BQU8sQ0FBQyxpQ0FBaUMsQ0FBRSxJQUFJLENBQUUsQ0FBQztRQUU1QyxnQkFBZ0IsQ0FBRSxhQUFhLENBQUUsQ0FBQztJQUN0QyxDQUFDO0lBRUQsU0FBUyxnQkFBZ0IsQ0FBRSxhQUF5QjtRQUVoRCxJQUFJLFFBQVEsR0FBSSxVQUFVLENBQUMscUJBQXFCLENBQUUsNkJBQTZCLENBQUUsQ0FBQztRQUNsRixJQUFJLE9BQU8sR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFFLGFBQWEsQ0FBQyxNQUFNLENBQUUsQ0FBQztRQUV0RCxVQUFVLENBQUMsSUFBSSxDQUFFLGFBQWEsQ0FBQyxRQUFRLEVBQ2pDLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBRSw4QkFBOEIsQ0FBYSxFQUM3RSxrQ0FBa0MsQ0FBRSxDQUFDO1FBQ3pDLFVBQVUsQ0FBQyxJQUFJLENBQUUsYUFBYSxDQUFDLFVBQVUsRUFDbkMsUUFBUSxDQUFDLHFCQUFxQixDQUFFLGdDQUFnQyxDQUFjLEVBQ2hGLGtDQUFrQyxDQUFDLENBQUM7UUFFeEMsUUFBUSxDQUFDLHFCQUFxQixDQUFFLGdDQUFnQyxDQUFDLENBQUMsS0FBSyxDQUFDLGVBQWUsR0FBRyxhQUFhLENBQUMsV0FBVyxDQUFDO1FBQ3BILGVBQWUsQ0FBRSxVQUFVLENBQUMscUJBQXFCLENBQUUsdUJBQXVCLENBQUUsRUFBRSxhQUFhLENBQUMsV0FBVyxDQUFFLENBQUM7UUFDMUcsZUFBZSxDQUFFLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBRSwyQkFBMkIsQ0FBRSxFQUFFLGFBQWEsQ0FBQyxXQUFXLENBQUUsQ0FBQztRQUU5RyxNQUFNLFFBQVEsR0FBRyxZQUFZLENBQUMsc0JBQXNCLENBQUUsYUFBYSxDQUFDLE1BQU0sQ0FBRSxDQUFDO1FBQzdFLE1BQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUUsSUFBSSxDQUFFLENBQUM7UUFFekMsc0hBQXNIO1FBQ3RILElBQUksaUJBQWlCLEdBQUcsVUFBVSxDQUFDLHFCQUFxQixDQUFFLGtDQUFrQyxDQUFpQixDQUFDO1FBRTlHLGlCQUFpQixDQUFDLE1BQU0sR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFBO1FBQy9DLFFBQVEsQ0FBQyx3QkFBd0IsQ0FBRSxpQkFBaUIsRUFBRSxPQUFPLENBQUUsQ0FBQztRQUNoRSxRQUFRLENBQUMsa0JBQWtCLENBQUUsaUJBQWlCLEVBQUUsT0FBTyxDQUFFLENBQUM7UUFFMUQsS0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUM5QztZQUNJLElBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQ2Y7Z0JBQ0ksSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUNUO29CQUVJLElBQUksZUFBZSxHQUFhLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBRSxvQkFBb0IsQ0FBRSxDQUFDO29CQUN6RixJQUFJLFVBQVUsR0FBVyxlQUFlLENBQUMscUJBQXFCLENBQUUsWUFBWSxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUVsRixJQUFJLENBQUMsVUFBVSxFQUNmO3dCQUNJLFVBQVUsR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFFLE9BQU8sRUFBRSxlQUFlLEVBQUUsWUFBWSxHQUFHLENBQUMsQ0FBRSxDQUFDO3dCQUN6RSxVQUFVLENBQUMsa0JBQWtCLENBQUUsVUFBVSxDQUFDLENBQUM7cUJBQzlDO29CQUVELFVBQVUsQ0FBQyxpQkFBaUIsQ0FBRSxZQUFZLEVBQUUsU0FBUyxDQUFFLENBQUMsQ0FBRSxHQUFHLEtBQUssQ0FBRSxDQUFDO29CQUNyRSxVQUFVLENBQUMsaUJBQWlCLENBQUUsV0FBVyxFQUFFLFNBQVMsQ0FBRSxDQUFDLEdBQUcsQ0FBQyxDQUFFLENBQUcsQ0FBQztpQkFDcEU7Z0JBRUQsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUNYO29CQUNJLFVBQVUsQ0FBQyxJQUFJLENBQUUsU0FBUyxDQUFFLENBQUMsR0FBRyxDQUFDLENBQUUsRUFDL0IsQ0FBRSxVQUFVLENBQUMscUJBQXFCLENBQUUsaUNBQWlDLENBQUUsQ0FBRSxFQUN6RSxFQUFFLENBQUUsQ0FBQztvQkFFVCxNQUFNLFNBQVMsR0FBRyxVQUFVLENBQUMscUJBQXFCLENBQUUsK0JBQStCLENBQUUsQ0FBQztvQkFDdEYsTUFBTSxhQUFhLEdBQUcsQ0FBQyxTQUFTLENBQUMsaUJBQWlCLEdBQUMsQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDLGVBQWUsQ0FBQztvQkFDbEYsU0FBUyxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsYUFBYSxHQUFFLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxVQUFVLENBQUUsU0FBUyxDQUFFLENBQUMsR0FBRyxDQUFDLENBQUUsQ0FBRSxDQUFDLENBQUMsR0FBRyxhQUFhLENBQUMsR0FBRyxnQ0FBZ0MsQ0FBQztpQkFDOUk7Z0JBRUQsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUNYO29CQUNJLFVBQVUsQ0FBQyxJQUFJLENBQUUsU0FBUyxDQUFFLENBQUMsR0FBRyxDQUFDLENBQUUsRUFDL0IsQ0FBRSxVQUFVLENBQUMscUJBQXFCLENBQUUsK0JBQStCLENBQUUsQ0FBRSxFQUN2RSxFQUFFLENBQUUsQ0FBQztpQkFDWjthQUNKO1NBQ0o7UUFFRCxVQUFVLENBQUMscUJBQXFCLENBQUUsOEJBQThCLENBQUMsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLEdBQUUsRUFBRTtZQUUvRixNQUFNLE9BQU8sR0FBRyxZQUFZLENBQUMscUJBQXFCLENBQzlDLEVBQUUsRUFDRiw4REFBOEQsQ0FDakUsQ0FBQztZQUVGLElBQUksU0FBUyxHQUEwQjtnQkFDbkMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxNQUFNO2dCQUM3QixZQUFZLEVBQUUsSUFBSTtnQkFDbEIscUJBQXFCLEVBQUUsSUFBSTthQUM5QixDQUFBO1lBRUQsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7UUFDekMsQ0FBQyxDQUFDLENBQUM7UUFFSCxRQUFTLGFBQWEsQ0FBQyxNQUFNLEVBQzdCO1lBQ0ksS0FBSyxDQUFDO2dCQUNGLFlBQVksQ0FBQyxtQkFBbUIsQ0FBRSxxQkFBcUIsQ0FBRSxDQUFDO2dCQUFDLE1BQU07WUFDckUsS0FBSyxDQUFDO2dCQUNGLFlBQVksQ0FBQyxtQkFBbUIsQ0FBRSx1QkFBdUIsQ0FBRSxDQUFDO2dCQUFDLE1BQU07WUFDdkUsS0FBSyxDQUFDO2dCQUNGLFlBQVksQ0FBQyxtQkFBbUIsQ0FBRSxxQkFBcUIsQ0FBRSxDQUFDO2dCQUFDLE1BQU07WUFDckUsS0FBSyxDQUFDO2dCQUNGLFlBQVksQ0FBQyxtQkFBbUIsQ0FBRSxvQkFBb0IsQ0FBRSxDQUFDO2dCQUFDLE1BQU07U0FDdkU7SUFDTCxDQUFDO0lBRUQsU0FBUyx3QkFBd0IsQ0FBRSxPQUFjLEVBQUUsUUFBZ0I7UUFFL0QsT0FBTyxDQUFDLENBQUMsV0FBVyxDQUFFLHFCQUFxQixFQUFFLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBRSxrQ0FBa0MsQ0FBRSxFQUFFLHdCQUF3QixFQUFFO1lBQzNJLEtBQUssRUFBRSw4QkFBOEI7WUFDckMsMkJBQTJCLEVBQUUsTUFBTTtZQUNuQyx3QkFBd0IsRUFBRSxJQUFJO1lBQzlCLHdCQUF3QixFQUFFLElBQUk7WUFDOUIsTUFBTSxFQUFFLFNBQVM7WUFDakIsTUFBTSxFQUFFLE9BQU87WUFDZixHQUFHLEVBQUUsT0FBTztZQUNaLGNBQWMsRUFBRSxNQUFNO1lBQ3RCLGVBQWUsRUFBRSxDQUFDO1lBQ2xCLFlBQVksRUFBRSxNQUFNO1lBQ3BCLGdCQUFnQixFQUFFLEdBQUc7WUFDckIsZ0JBQWdCLEVBQUUsR0FBRztZQUNyQixhQUFhLEVBQUUsR0FBRztZQUNsQixhQUFhLEVBQUUsR0FBRztZQUNsQixvQkFBb0IsRUFBRSxHQUFHO1lBQ3pCLG9CQUFvQixFQUFFLEdBQUc7WUFDekIsYUFBYSxFQUFFLElBQUk7WUFDbkIsZUFBZSxFQUFFLFFBQVE7WUFDekIsUUFBUSxFQUFFLE1BQU07WUFDaEIsWUFBWSxFQUFFLE1BQU07WUFDcEIsT0FBTyxFQUFFLE1BQU07WUFDZiwwQ0FBMEMsRUFBRSxPQUFPO1NBQ3RELENBQUUsQ0FBQztJQUNSLENBQUM7SUFFRCxJQUFJLGtCQUFrQixHQUFHLENBQUMsQ0FBQztJQUUzQixTQUFTLGlCQUFpQixDQUFHLE9BQWU7UUFFeEMsTUFBTSxhQUFhLEdBQUcsQ0FBQyxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQzlDLE1BQU0sYUFBYSxHQUFHLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLHVCQUF1QixFQUFFLENBQUM7UUFFdEcsYUFBYSxDQUFDLENBQUMsR0FBRyxhQUFhLENBQUMsQ0FBQyxHQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUM7UUFDN0QsYUFBYSxDQUFDLENBQUMsR0FBRyxhQUFhLENBQUMsQ0FBQyxHQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUM7UUFDN0QsYUFBYSxDQUFDLENBQUMsR0FBRyxhQUFhLENBQUMsQ0FBQyxHQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUM7UUFDN0QsYUFBYSxDQUFDLENBQUMsR0FBRyxhQUFhLENBQUMsQ0FBQyxHQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUM7UUFDbkUsTUFBTSxvQkFBb0IsR0FBRyxFQUFFLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQyxHQUFHLGFBQWEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDLEdBQUcsYUFBYSxDQUFDLENBQUMsRUFBQyxDQUFDO1FBRWpHLElBQUksa0JBQWtCLElBQUksRUFBRSxFQUM1QjtZQUNJLGtCQUFrQixHQUFHLENBQUMsQ0FBQztTQUMxQjtRQUVELElBQUksT0FBTyxHQUFHLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLFNBQVMsQ0FBRSxTQUFTLEdBQUcsa0JBQWtCLENBQUUsQ0FBQztRQUV0SCxJQUFJLENBQUMsT0FBTyxFQUNaO1lBQ0ksT0FBTyxHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUUsT0FBTyxFQUFFLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBQyx5QkFBeUIsQ0FBQyxFQUFFLFNBQVMsR0FBRyxrQkFBa0IsRUFBRSxFQUFFLE9BQU8sRUFBQyxPQUFPLEVBQUUsQ0FBYSxDQUFDO1lBQ2hLLE9BQU8sQ0FBQyxXQUFXLENBQUUsY0FBYyxFQUFFLElBQUksQ0FBRSxDQUFBO1lBQzNDLGtCQUFrQixFQUFFLENBQUM7WUFFckIsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsb0JBQW9CLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztZQUNoRCxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxvQkFBb0IsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO1lBRWhELE1BQU0sTUFBTSxHQUFHLG9CQUFvQixDQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzlDLE1BQU0sT0FBTyxHQUFHLG9CQUFvQixDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsR0FBRSxHQUFHLENBQUM7WUFFbEQsT0FBTyxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsOENBQThDLEdBQUcsTUFBTSxHQUFHLE9BQU8sQ0FBQztZQUM1RixPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7U0FDOUM7YUFFRDtZQUNJLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLG9CQUFvQixDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7WUFDaEQsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsb0JBQW9CLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztZQUVoRCxNQUFNLE1BQU0sR0FBRyxvQkFBb0IsQ0FBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUM5QyxzREFBc0Q7WUFFdEQsT0FBTyxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsOENBQThDLEdBQUcsTUFBTSxHQUFHLE9BQU8sQ0FBQztZQUM1Riw4Q0FBOEM7U0FDakQ7UUFFRCxrQkFBa0IsRUFBRSxDQUFBO0lBRTVCLENBQUM7SUFFRCxTQUFTLFdBQVcsQ0FBQyxhQUFxQjtRQUV0QyxJQUFJLGFBQWEsSUFBSSxDQUFDO1lBQUUsT0FBTyxLQUFLLENBQUM7UUFDckMsSUFBSSxhQUFhLElBQUksR0FBRztZQUFFLE9BQU8sSUFBSSxDQUFDO1FBRXRDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxHQUFHLENBQUM7UUFDakMsT0FBTyxJQUFJLEdBQUcsYUFBYSxDQUFDO0lBQ2hDLENBQUM7SUFFRCxTQUFTLGVBQWU7UUFFcEIsTUFBTSxpQkFBaUIsR0FBRyxVQUFVLENBQUMscUJBQXFCLENBQUUsMEJBQTBCLENBQWlCLENBQUM7UUFDeEcsTUFBTSxjQUFjLEdBQUcsWUFBWSxDQUFDLE1BQU0sQ0FBRSxZQUFZLENBQUMsd0JBQXdCLENBQUUsaUJBQWlCLEVBQUUsQ0FBQyxDQUFFLENBQUcsQ0FBQztRQUM3RyxVQUFVLENBQUMsaUJBQWlCLENBQUUsaUJBQWlCLEVBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxRQUFRLEdBQUcsY0FBYyxDQUFFLENBQUUsQ0FBQztRQUUxRixRQUFRLENBQUMsd0JBQXdCLENBQUUsaUJBQWlCLEVBQUUsY0FBYyxDQUFFLENBQUM7UUFDdkUsUUFBUSxDQUFDLGtCQUFrQixDQUFFLGlCQUFpQixFQUFFLGNBQWMsQ0FBRSxDQUFDO1FBR2pFLHVFQUF1RTtRQUN2RSwwQkFBMEI7SUFDOUIsQ0FBQztJQUVELFNBQVMsb0JBQW9CO1FBRXpCLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBRSw4QkFBOEIsQ0FBRSxDQUFDLFdBQVcsQ0FBRSxNQUFNLEVBQUUsSUFBSSxDQUFFLENBQUM7UUFFL0YsTUFBTSxhQUFhLEdBQUcsWUFBWSxDQUFDLDZCQUE2QixDQUFFLG1CQUFtQixFQUNqRixZQUFZLENBQUMsNkJBQTZCLENBQUUsbUJBQW1CLEVBQzNELHFCQUFxQixDQUN4QixDQUFFLENBQUM7UUFFUixJQUFJLEtBQUssR0FBRyxZQUFZLENBQUMscUJBQXFCLENBQUUsaUJBQWlCLENBQUUsQ0FBQztRQUNwRSxNQUFNLFFBQVEsR0FBRyxVQUFVLENBQUMscUJBQXFCLENBQUUsdUJBQXVCLENBQUUsQ0FBQztRQUM3RSxRQUFRLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxHQUFFLEVBQUU7WUFDbEMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDOUIsa0JBQWtCLEVBQUUsQ0FBQztRQUM3QixDQUFDLENBQUMsQ0FBQztRQUVILEtBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQy9CO1lBQ0ksTUFBTSxNQUFNLEdBQUcsWUFBWSxDQUFDLHdCQUF3QixDQUFFLGlCQUFpQixFQUFHLENBQUMsQ0FBRSxDQUFDO1lBQzlFLE1BQU0sU0FBUyxHQUFHLFlBQVksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFckQsSUFBSSxhQUFhLEdBQUcsUUFBUSxDQUFDLHFCQUFxQixDQUFFLGFBQWEsR0FBRyxTQUFTLENBQUUsQ0FBQztZQUVoRixJQUFJLENBQUMsYUFBYSxFQUNsQjtnQkFDSSxhQUFhLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLGFBQWEsR0FBRyxTQUFTLEVBQUUsRUFBRSxLQUFLLEVBQUMsNEJBQTRCLEVBQUMsQ0FBRSxDQUFDO2FBQ3hIO1lBRUQsSUFBSSxNQUFNLEdBQUcsYUFBYSxDQUFDLHFCQUFxQixDQUFFLE1BQU0sQ0FBRSxDQUFDO1lBQzNELElBQUksQ0FBQyxNQUFNLEVBQ1g7Z0JBQ0ksTUFBTSxHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUUsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLENBQUUsQ0FBQztnQkFDekQsTUFBTSxDQUFDLGtCQUFrQixDQUFFLHVCQUF1QixDQUFFLENBQUM7Z0JBRXJELDZEQUE2RDtnQkFDN0QsZUFBZSxDQUFFLE1BQU0sRUFBRSxDQUFFLFNBQVMsS0FBSyxDQUFDLENBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLENBQUUsQ0FBQzthQUN4RztZQUVELE1BQU0sb0JBQW9CLEdBQUcsQ0FBRSxTQUFTLEtBQUssQ0FBQyxDQUFFLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxvQ0FBb0MsQ0FBRSxxQkFBcUIsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLGdCQUFnQixDQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztZQUM5SixNQUFNLG1CQUFtQixHQUFXLENBQUUsYUFBYSxJQUFJLGFBQWEsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFFLG9CQUFvQixDQUFFLENBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7WUFFbkksSUFBSSwyQkFBMkIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksbUJBQW1CLEVBQ25GO2dCQUNJLE1BQU0sQ0FBQyxXQUFXLENBQUUsV0FBVyxFQUFFLG1CQUFtQixDQUFDLENBQUM7YUFDekQ7WUFFRCxNQUFNLENBQUMsV0FBVyxDQUFFLE1BQU0sRUFBRSxtQkFBbUIsQ0FBRSxDQUFDO1NBQ3JEO1FBRUQsSUFBSSxDQUFDLDJCQUEyQixFQUNoQztZQUNJLDJCQUEyQixHQUFHLElBQUksQ0FBQztTQUN0QztJQUNMLENBQUM7SUFFRCxTQUFTLGtCQUFrQjtRQUV2QixVQUFVLENBQUMscUJBQXFCLENBQUUsb0JBQW9CLENBQUUsQ0FBQyxXQUFXLENBQUUsZUFBZSxFQUFFLElBQUksQ0FBRSxDQUFDO1FBQzlGLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBRSwwQkFBMEIsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLENBQUMsa0JBQWtCLENBQUUsZUFBZSxDQUFFLENBQUMsQ0FBQztRQUV4SSxNQUFNLGFBQWEsR0FBRyxZQUFZLENBQUMsNkJBQTZCLENBQUUsbUJBQW1CLEVBQ2pGLFlBQVksQ0FBQyw2QkFBNkIsQ0FBRSxtQkFBbUIsRUFDM0QscUJBQXFCLENBQ3hCLENBQUUsQ0FBQztRQUVSLE1BQU0sWUFBWSxHQUFHLFlBQVksQ0FBQyw2QkFBNkIsQ0FBRSw0QkFBNEIsRUFDekYsWUFBWSxDQUFDLDZCQUE2QixDQUFFLDRCQUE0QixFQUNwRSxxQkFBcUIsQ0FDeEIsQ0FBRSxDQUFDO1FBRVIsTUFBTSxRQUFRLEdBQUcsVUFBVSxDQUFDLHFCQUFxQixDQUFFLHNCQUFzQixDQUFFLENBQUM7UUFDNUUsSUFBSSxLQUFLLEdBQUcsWUFBWSxDQUFDLHFCQUFxQixDQUFFLGlCQUFpQixDQUFFLENBQUM7UUFDcEUsSUFBSSxjQUFjLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDeEIsSUFBSSxpQkFBaUIsR0FBRyxDQUFDLENBQUM7UUFDMUIsSUFBSSxxQkFBcUIsR0FBRyxDQUFDLENBQUM7UUFDOUIsS0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFDL0I7WUFDSSxNQUFNLE1BQU0sR0FBRyxZQUFZLENBQUMsd0JBQXdCLENBQUUsaUJBQWlCLEVBQUcsQ0FBQyxDQUFFLENBQUM7WUFDOUUsTUFBTSxTQUFTLEdBQUcsWUFBWSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUVyRCxJQUFJLGFBQWEsR0FBRyxRQUFRLENBQUMscUJBQXFCLENBQUUsU0FBUyxHQUFHLFNBQVMsQ0FBRSxDQUFDO1lBQzVFLElBQUksQ0FBQyxhQUFhLEVBQ2xCO2dCQUNJLGFBQWEsR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsU0FBUyxHQUFHLFNBQVMsQ0FBRSxDQUFDO2dCQUMxRSxhQUFhLENBQUMsa0JBQWtCLENBQUUsa0JBQWtCLENBQUUsQ0FBQzthQUMxRDtZQUVELElBQUssY0FBYyxJQUFJLFNBQVMsRUFDaEM7Z0JBQ0ksY0FBYyxHQUFHLFNBQVMsQ0FBQztnQkFDM0IsaUJBQWlCLEdBQUcsQ0FBQyxDQUFDO2dCQUN0QixxQkFBcUIsR0FBRyxDQUFDLENBQUM7Z0JBQzFCLGFBQWEsQ0FBQyxvQkFBb0IsQ0FBRSxNQUFNLEVBQUUsQ0FBQyxDQUFFLENBQUM7YUFDbkQ7WUFFRCxJQUFJLGlCQUFpQixHQUFHLGFBQWEsQ0FBQyxTQUFTLENBQUUsbUJBQW1CLENBQWEsQ0FBQztZQUNsRixJQUFJLE1BQU0sR0FBRyxRQUFRLENBQUMscUJBQXFCLENBQUUsZUFBZSxHQUFHLE1BQU0sQ0FBRSxDQUFDO1lBQ3hFLElBQUksQ0FBQyxNQUFNLEVBQ1g7Z0JBQ0ksTUFBTSxHQUFJLENBQUMsQ0FBQyxXQUFXLENBQUUsT0FBTyxFQUFFLGlCQUFrQixFQUFFLGVBQWUsR0FBRyxNQUFNLENBQUUsQ0FBQztnQkFDakYsTUFBTSxDQUFDLGtCQUFrQixDQUFFLGtCQUFrQixDQUFFLENBQUM7Z0JBQ2hELE1BQU0sQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLEdBQUUsRUFBRTtvQkFDcEMsQ0FBQyxDQUFDLGFBQWEsQ0FDWCxxQkFBcUIsRUFDckIsTUFBTSxFQUFFLFlBQVksQ0FBQyxpQ0FBaUMsQ0FBRSxxQkFBcUIsRUFBRSxDQUFDLENBQUU7d0JBQ2xGLEdBQUcsR0FBRyxFQUFFLENBQ1gsQ0FBQztnQkFDTixDQUFDLENBQUMsQ0FBQztnQkFFSCxNQUFNLENBQUMsT0FBTyxHQUFHLFNBQVMsS0FBSyxDQUFDLENBQUM7YUFDcEM7WUFFRCxNQUFNLG9CQUFvQixHQUFHLENBQUUsU0FBUyxLQUFLLENBQUMsQ0FBRSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsb0NBQW9DLENBQUUscUJBQXFCLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7WUFDOUosTUFBTSxtQkFBbUIsR0FBVyxDQUFFLGFBQWEsSUFBSSxhQUFhLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBRSxvQkFBb0IsQ0FBRSxDQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1lBQ25JLE1BQU0sQ0FBQyxXQUFXLENBQUUsTUFBTSxFQUFFLG1CQUFtQixDQUFFLENBQUM7WUFFbEQsSUFBSSxtQkFBbUIsRUFDdkI7Z0JBQ0ksYUFBYSxDQUFDLG9CQUFvQixDQUFFLE1BQU0sRUFBRSxFQUFFLHFCQUFxQixDQUFFLENBQUM7YUFDekU7WUFFRCxhQUFhLENBQUMsb0JBQW9CLENBQUUsT0FBTyxFQUFFLEVBQUUsaUJBQWlCLENBQUUsQ0FBQztZQUVuRSw2REFBNkQ7WUFDN0QsZUFBZSxDQUFFLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBRSx1QkFBdUIsQ0FBRSxFQUFFLENBQUUsU0FBUyxLQUFLLENBQUMsQ0FBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsQ0FBRSxDQUFDO1lBQ3RKLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBRSxXQUFXLEVBQUUsQ0FBRSxTQUFTLEtBQUssQ0FBQyxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUUsWUFBWSxDQUFDLDBCQUEwQixDQUFFLGlCQUFpQixDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBRSxNQUFNLENBQUUsQ0FBRSxDQUFDO1lBRTlLLHlDQUF5QztZQUN6QyxJQUFJLEdBQUcsR0FBRyxhQUFhLENBQUMscUJBQXFCLENBQUUsc0JBQXNCLENBQWtCLENBQUM7WUFDeEYsSUFBSyxHQUFHLEVBQ1I7Z0JBQ0ksTUFBTSxjQUFjLEdBQUcsQ0FBRSxTQUFTLEtBQUssQ0FBQyxDQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsNENBQTRDO2dCQUN6RyxNQUFNLFFBQVEsR0FBVyxDQUFFLFlBQVksSUFBSSxZQUFZLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBRSxjQUFjLENBQUUsQ0FBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztnQkFDM0csTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLFFBQVEsSUFBSSxDQUFFLHFCQUFxQixJQUFJLGlCQUFpQixDQUFFLENBQUM7Z0JBQ3JGLEdBQUcsQ0FBQyxPQUFPLEdBQUcsZ0JBQWdCLElBQUksQ0FBRSxxQkFBcUIsSUFBSSxpQkFBaUIsQ0FBRSxDQUFDO2dCQUNqRixHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDLENBQUMsMEJBQTBCLEVBQUUsR0FBRyxDQUFFLENBQUM7Z0JBRWpHLEdBQUcsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLEdBQUUsRUFBRTtvQkFDakMsQ0FBQyxDQUFDLEdBQUcsQ0FBRSx3QkFBd0IsR0FBRyxxQkFBcUIsR0FBRyxNQUFNLEdBQUcsY0FBYyxHQUFHLE1BQU0sR0FBRyxDQUFFLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBRSxDQUFFLENBQUM7b0JBQ3hJLElBQUssQ0FBQyxnQkFBZ0I7d0JBQUcsT0FBTztvQkFFaEMsSUFBSyxDQUFDLGNBQWMsQ0FBQyxzQkFBc0IsQ0FBRSxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUUsRUFDckU7d0JBQ0ksWUFBWSxDQUFDLHFCQUFxQixDQUFFLGNBQWMsRUFBRSx5REFBeUQsQ0FBRSxDQUFDO3dCQUNoSCxPQUFPLENBQUMsMkRBQTJEO3FCQUN0RTtvQkFFRCxJQUFLLGNBQWMsQ0FBQyxjQUFjLENBQUUsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFFLElBQUksWUFBWSxDQUFDLFdBQVcsRUFBRSxFQUMxRjt3QkFDSSxNQUFNLE9BQU8sR0FBRyxZQUFZLENBQUMscUJBQXFCLENBQzlDLEVBQUUsRUFDRiw4REFBOEQsQ0FDakUsQ0FBQyxDQUFFLGtFQUFrRTt3QkFFdEUsSUFBSSxTQUFTLEdBQTBCOzRCQUNuQyxPQUFPLEVBQUUsR0FBRzs0QkFDWixzQkFBc0IsRUFBRSxLQUFLOzRCQUM3QixTQUFTLEVBQUMsZUFBZTt5QkFDNUIsQ0FBQTt3QkFFRCxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQzt3QkFFckMsT0FBTztxQkFDVjtvQkFFRCxJQUFLLGlDQUFpQyxJQUFJLENBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLGlDQUFpQyxHQUFHLElBQUksQ0FBRTt3QkFDL0YsT0FBTyxDQUFDLHFGQUFxRjtvQkFFakcsaUNBQWlDLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO29CQUMvQyxZQUFZLENBQUMsbUJBQW1CLENBQUUscUJBQXFCLEVBQUUsY0FBYyxDQUFFLENBQUM7b0JBQzFFLEdBQUcsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO29CQUNwQixHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUUsMEJBQTBCLEVBQUUsR0FBRyxDQUFFLENBQUM7Z0JBQzdELENBQUMsQ0FBQyxDQUFDO2FBQ047U0FDSjtJQUNMLENBQUM7SUFFRCxpQ0FBaUM7SUFDakMsS0FBSyxVQUFVLHNCQUFzQjtRQUVqQyxNQUFNLFNBQVMsR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFFLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxFQUFFLENBQUUsQ0FBQztRQUNuRSxTQUFTLENBQUMsa0JBQWtCLENBQUUsaUNBQWlDLENBQUUsQ0FBQztRQUNsRSxTQUFTLENBQUMsUUFBUSxDQUFFLE1BQU0sQ0FBRSxDQUFDO1FBRTdCLE1BQU0sU0FBUyxHQUFHO1lBQ2QsV0FBVyxFQUFFLFNBQVMsQ0FBQyxxQkFBcUIsQ0FBRSxxQkFBcUIsQ0FBYTtZQUNoRixXQUFXLEVBQUUsa0NBQWtDO1lBQy9DLEtBQUssRUFBRSxxQkFBcUI7WUFDNUIsVUFBVSxFQUFFLGtCQUFrQjtZQUM5QixhQUFhLEVBQUUsS0FBSztTQUN2QixDQUFBO1FBRUQseUJBQXlCLENBQUUsU0FBUyxDQUFFLENBQUM7UUFFdkMsTUFBTSxLQUFLLENBQUMsS0FBSyxDQUFFLEVBQVksQ0FBRSxDQUFDO1FBQ2xDLGtCQUFrQixDQUFDLGNBQWMsRUFBRSxDQUFDO1FBRXBDLE9BQU8sU0FBUyxDQUFDO0lBQ3JCLENBQUM7SUFFRCxTQUFTLG1CQUFtQjtRQUV4QixVQUFVLENBQUMscUJBQXFCLENBQUUsb0JBQW9CLENBQUUsQ0FBQyxXQUFXLENBQUUsZUFBZSxFQUFFLElBQUksQ0FBRSxDQUFDO1FBQzlGLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBRSwwQkFBMEIsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLENBQUMsa0JBQWtCLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztRQUV0SSxNQUFNLFNBQVMsR0FBRztZQUNkLFdBQVcsRUFBRSxVQUFVLENBQUMscUJBQXFCLENBQUUsbUJBQW1CLENBQUM7WUFDbkUsV0FBVyxFQUFFLG1DQUFtQztZQUNoRCxLQUFLLEVBQUUsYUFBYTtZQUNwQixVQUFVLEVBQUUsZ0JBQWdCO1lBQzVCLGFBQWEsRUFBRSxJQUFJO1NBQ3RCLENBQUE7UUFFRCx5QkFBeUIsQ0FBRSxTQUFTLENBQUUsQ0FBQztJQUMzQyxDQUFDO0lBRUQsU0FBUyx5QkFBeUIsQ0FBRSxRQUE2RztRQUU3SSxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLENBQUM7UUFDM0QsS0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUNoRDtZQUNJLElBQUksUUFBUSxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFFLFFBQVEsQ0FBQyxVQUFVLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQW1CLENBQUM7WUFDakgsSUFBSSxDQUFDLFFBQVEsRUFDYjtnQkFDSSxRQUFRLEdBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxhQUFhLEVBQUUsUUFBUSxDQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsVUFBVSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFO29CQUMxRyxLQUFLLEVBQUUsUUFBUSxDQUFDLFdBQVc7b0JBQzNCLEtBQUssRUFBRSxhQUFhO29CQUNwQixJQUFJLEVBQUUsTUFBTTtvQkFDWixJQUFJLEVBQUUsbUJBQW1CO2lCQUM1QixDQUFDLENBQUM7Z0JBRUgsUUFBUSxDQUFDLGlCQUFpQixDQUFFLGVBQWUsRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBRSxDQUFDO2dCQUN6RSxNQUFNLFNBQVMsR0FBRyxDQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxLQUFJLENBQUMsQ0FBRSxDQUFDLENBQUM7b0JBQ2pELENBQUMsQ0FBQyxRQUFRLENBQUUsbUJBQW1CLENBQUUsc0JBQXNCLENBQUUsRUFBRSxRQUFRLENBQUUsQ0FBQyxDQUFDO29CQUN2RSxDQUFDLENBQUMsUUFBUSxDQUFFLG1CQUFtQixDQUFFLGdDQUFnQyxDQUFFLEVBQUUsUUFBUSxDQUFFLENBQUM7Z0JBRXBGLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBRSxlQUFlLEVBQUUsU0FBUyxDQUFFLENBQUM7Z0JBRXpELFFBQVEsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLEdBQUUsRUFBRTtvQkFDdEMsWUFBWSxDQUFDLGlCQUFpQixDQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFFLENBQUM7b0JBQzNELFVBQVUsQ0FBQyxpQkFBaUIsQ0FBRSxPQUFPLEVBQUUsY0FBYyxDQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFFLENBQUMsQ0FBQztvQkFFL0csSUFBSSxRQUFRLENBQUMsYUFBYSxFQUMxQjt3QkFDSSxDQUFDLENBQUMsUUFBUSxDQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO3dCQUM1RCxRQUFRLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxDQUFDLE9BQU8sQ0FBRSxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFFLENBQUM7d0JBRTlFLCtCQUErQixFQUFFLENBQUM7d0JBQ2xDLE9BQU87cUJBQ1Y7eUJBRUQ7d0JBQ0ksUUFBUSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUUsTUFBTSxFQUFFLElBQUksQ0FBRSxDQUFDO3dCQUNqRCxZQUFZLENBQUUsc0NBQXNDLENBQUUsQ0FBQztxQkFDMUQ7Z0JBQ0wsQ0FBQyxDQUFDLENBQUM7YUFDTjtZQUVELElBQUksUUFBUSxDQUFDLGFBQWEsRUFDMUI7Z0JBQ0ksUUFBUSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUUsT0FBTyxDQUFDLEtBQUssS0FBSyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBRSxJQUFJLE9BQU8sQ0FBQyxRQUFRLEtBQUssSUFBSSxDQUFFLENBQUM7Z0JBQ2xHLFFBQVEsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDO2FBQ3hDO1NBQ0o7SUFDTCxDQUFDO0lBRUQsU0FBUyxrQkFBa0IsQ0FBRSxTQUFnQjtRQUV6QyxZQUFZLENBQUMsbUJBQW1CLENBQUUsaUJBQWlCLENBQUUsQ0FBQztRQUN0RCxVQUFVLENBQUMscUJBQXFCLENBQUUsb0JBQW9CLENBQUUsQ0FBQyxXQUFXLENBQUUsU0FBUyxFQUFFLEtBQUssQ0FBRSxDQUFDO0lBQzdGLENBQUM7SUFFRCxTQUFTLGNBQWMsQ0FBRSxNQUFhLEVBQUUsV0FBa0I7UUFFdEQsT0FBTyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFFLFdBQVcsQ0FBRSxDQUFDLENBQUMsQ0FBQyxXQUFxQixDQUFDO0lBQzVFLENBQUM7QUFDTCxDQUFDLEVBL29EUyxnQkFBZ0IsS0FBaEIsZ0JBQWdCLFFBK29EekI7QUFFRCxJQUFVLFVBQVUsQ0FzRG5CO0FBdERELFdBQVUsVUFBVTtJQUVoQixNQUFNLE9BQU8sR0FBRywwRkFBMEYsQ0FBQTtJQUUxRyxTQUFnQixJQUFJLENBQUUsVUFBaUIsRUFBRSxXQUFtQixFQUFFLFNBQWdCLEVBQUUsUUFBZ0IsS0FBSztRQUVqRyxJQUFJLFdBQVcsR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZDLElBQUksZUFBZSxHQUFHLFdBQVcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QyxJQUFJLGtCQUFrQixHQUFHLGVBQWUsQ0FBQyxNQUFNLENBQUM7UUFFaEQsOENBQThDO1FBQzlDLElBQUksV0FBVyxDQUFDLE1BQU0sR0FBRyxrQkFBa0IsRUFDM0M7WUFDSSxLQUFLLElBQUksQ0FBQyxHQUFHLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLGtCQUFrQixFQUFFLENBQUMsRUFBRyxFQUM3RDtnQkFDSSxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFFLENBQUMsQ0FBRSxDQUFDO2FBQ3ZDO1NBQ0o7UUFFRCxpQ0FBaUM7UUFDakMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUcsRUFBRTtZQUNwQyxJQUFJLFFBQVEsR0FBSSxXQUFXLENBQUMsU0FBUyxDQUFFLFNBQVMsR0FBRyxLQUFLLENBQWEsQ0FBQztZQUN0RSxJQUFJLENBQUMsUUFBUSxFQUNiO2dCQUNJLFFBQVEsR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFFLE9BQU8sRUFDN0IsV0FBVyxFQUFFLFNBQVMsR0FBRyxLQUFLLEVBQUU7b0JBQzVCLEtBQUssRUFBQyxTQUFTLEdBQUcsdUJBQXVCO29CQUN6QyxJQUFJLEVBQUUsS0FBSztpQkFDZCxDQUFDLENBQUM7YUFDVjtRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxJQUFJLEdBQVUsQ0FBQyxDQUFDO1FBQ3BCLElBQUksTUFBTSxHQUFVLEVBQUUsQ0FBQztRQUN2QixJQUFJLGdCQUFnQixHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUM7UUFFMUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUcsRUFBRTtZQUNwQyxDQUFDLENBQUMsUUFBUSxDQUFFLElBQUksRUFBRSxHQUFHLEVBQUU7Z0JBQ25CLEtBQUssSUFBSSxDQUFDLEdBQUcsS0FBSyxHQUFHLENBQUMsRUFBRyxDQUFDLEdBQUcsV0FBVyxDQUFDLFFBQVEsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUcsRUFDaEU7b0JBQ0ksSUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsZ0JBQWdCLENBQUUsR0FBRyxnQkFBZ0IsQ0FBRSxDQUFDO29CQUMxRixJQUFJLFlBQVksR0FBRyxPQUFPLENBQUUsV0FBVyxDQUFFLENBQUM7b0JBRXhDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQWMsQ0FBQyxJQUFJLEdBQUcsWUFBWSxDQUFDO29CQUM3RCxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFFLE1BQU0sQ0FBRSxDQUFDO2lCQUNuRDtnQkFFQSxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUMsS0FBSyxDQUFhLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQztnQkFDekQsV0FBVyxDQUFDLFFBQVEsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLFdBQVcsQ0FBRSxNQUFNLEVBQUUsSUFBSSxDQUFFLENBQUM7WUFDOUQsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLEdBQUcsSUFBSSxHQUFHLE1BQU0sQ0FBQztRQUN6QixDQUFDLENBQUMsQ0FBQTtJQUNOLENBQUM7SUFqRGUsZUFBSSxPQWlEbkIsQ0FBQTtBQUNMLENBQUMsRUF0RFMsVUFBVSxLQUFWLFVBQVUsUUFzRG5CIn0=