"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="popup_capability_header.ts" />
/// <reference path="../common/iteminfo.ts" />
/// <reference path="../inspect.ts" />
/// <reference path="popup_inspect_async-bar.ts" />
/// <reference path="popup_inspect_purchase-bar.ts" />
/// <reference path="popup_inspect_rental-bar.ts" />
/// <reference path="popup_inspect_header.ts" />
/// <reference path="popup_acknowledge_item.ts" />
/// <reference path="popup_inspect_shared.ts" />
var CapabilityDecodable;
(function (CapabilityDecodable) {
    function Init() {
        $.GetContextPanel().Data().itemFromContainer = '';
        $.GetContextPanel().Data().existingRewardFromXrayId = '';
        $.GetContextPanel().Data().unusualItemImagePath = '';
        $.GetContextPanel().Data().showInspectScheduleHandle = null;
        let aItemsInLootlist = [];
        $.GetContextPanel().Data().aItemsInLootlist = aItemsInLootlist;
        let elCaseModelImagePanel = null;
        $.GetContextPanel().Data().elCaseModelImagePanel = elCaseModelImagePanel;
        $.GetContextPanel().Data().scrollListsPanelIds = ['ScrollList', 'ScrollListMagnified'];
        const showXrayMachineUi = InspectShared.GetPopupSetting('is_xray_machine');
        if (showXrayMachineUi) {
            $.GetContextPanel().SetHasClass('popup-in-xray', showXrayMachineUi);
            let oData = ItemInfo.GetItemsInXray();
            $.GetContextPanel().Data().existingRewardFromXrayId = oData.reward;
            if (oData.reward) {
                if (oData.reward) {
                    if (InventoryAPI.IsFauxItemID(oData.reward)) {
                        const elPopup = UiToolkitAPI.ShowGenericPopupOk('#popup_xray_first_use_title', '#popup_xray_first_use_desc', '', () => { });
                        const elMessageLabel = elPopup.FindChildInLayoutFile('MessageLabel');
                        elMessageLabel.html = true;
                        elPopup.SetDialogVariable('itemname', InventoryAPI.GetItemName(oData.reward));
                        elMessageLabel.text = $.Localize('#popup_xray_first_use_desc', elPopup);
                    }
                    else if (InspectShared.GetPopupSetting('show_xray_warning')) {
                        UiToolkitAPI.ShowGenericPopupOk('#popup_xray_in_use_title', '#popup_xray_in_use_desc', '', () => { });
                    }
                }
                InspectShared.SetPopupSetting('item_id', oData.case);
            }
            if (!InspectShared.GetPopupSetting('tool_id')) {
                let keyId = ItemInfo.GetKeyForCaseInXray(InspectShared.GetPopupSetting('item_id'));
                if (keyId) {
                    InspectShared.SetPopupSetting('tool_id', keyId);
                }
            }
        }
        const caseId = InspectShared.GetPopupSetting('item_id');
        const keyId = InspectShared.GetPopupSetting('tool_id');
        if ((keyId && InventoryAPI.IsRental(keyId)) ||
            InventoryAPI.IsRental(InspectShared.GetPopupSetting('item_id'))) {
            InspectShared.SetPopupSetting('show_work_type_warning', false);
            InspectShared.SetPopupSetting('inspect_only', true);
            InspectShared.SetPopupSetting('only_close_btn', true);
            InspectShared.SetPopupSetting('force_hide_async_bar', true);
        }
        if (!keyId) {
            const associatedItemCount = InventoryAPI.GetAssociatedItemsCount(caseId);
            if (!InventoryAPI.IsItemInfoValid(caseId)) {
                return;
            }
            const storeItemId = InspectShared.GetPopupSetting('store_item_id');
            InspectShared.SetPopupSetting('is_keyless', ((associatedItemCount === 0 || !associatedItemCount) && !storeItemId));
            if (!storeItemId && associatedItemCount > 0) {
                const keyToSellId = InventoryAPI.GetAssociatedItemIdByIndex(caseId, 0);
                InspectShared.SetPopupSetting('purchase_item_id', keyToSellId);
            }
        }
        else {
            if (!InventoryAPI.IsItemInfoValid(keyId)) {
                return;
            }
        }
        _SetUpPanelElements();
        $.DispatchEvent('CapabilityPopupIsOpen', true);
    }
    CapabilityDecodable.Init = Init;
    function _SetUpPanelElements() {
        const caseId = InspectShared.GetPopupSetting('item_id');
        const keyId = InspectShared.GetPopupSetting('tool_id');
        const existingRewardFromXrayId = $.GetContextPanel().Data().existingRewardFromXrayId;
        if (!keyId) {
            InspectShared.SetPopupSetting('show_work_type_warning', false);
            InspectShared.SetPopupSetting('override_async_bar_desc', false);
            if (existingRewardFromXrayId) {
                InspectShared.SetPopupSetting('allow_xray_purchase', true);
            }
        }
        else {
            InspectShared.SetPopupSetting('show_work_type_warning', true);
            InspectShared.SetPopupSetting('override_async_bar_desc', true);
            if (existingRewardFromXrayId) {
                InspectShared.SetPopupSetting('allow_xray_claim', true);
            }
        }
        if (InspectShared.GetPopupSetting('is_keyless')) {
            if (existingRewardFromXrayId) {
                InspectShared.SetPopupSetting('allow_xray_claim', true);
            }
            InspectShared.SetPopupSetting('show_work_type_warning', true);
            InspectShared.SetPopupSetting('override_async_bar_desc', true);
        }
        const category = InventoryAPI.GetLoadoutCategory(caseId);
        if (category == "musickit") {
            InventoryAPI.PlayItemPreviewMusic(caseId, '');
        }
        InspectShared.SetPopupSetting('allow_rent', InventoryAPI.CanOpenForRental(caseId));
        InspectPurchaseBar.Init();
        InspectAsyncActionBar.Init();
        InspectRentalBar.Init();
        CapabilityHeader.Init();
        _SetupDescription(caseId);
        if (InspectShared.GetPopupSetting('is_xray_machine')) {
            _SetUpXrayPanel();
        }
        else {
            _SetCaseModelImage(caseId, 'PopUpInspectModelOrImage');
            if (!ItemInfo.IsSpraySealed(caseId) && !ItemInfo.ItemDefinitionNameSubstrMatch(caseId, 'tournament_pass_')) {
                _PlayContainerSound(caseId, 'fall');
            }
            _SetLootListItems(caseId, keyId);
        }
    }
    function _SetupDescription(caseId) {
        const elPanel = $.GetContextPanel().FindChildInLayoutFile('InspectItemDesc');
        const count = InventoryAPI.GetLootListItemsCount(caseId);
        if (count === 0 && InspectShared.GetPopupSetting('store_item_id')) {
            elPanel.visible = true;
            elPanel.text = InventoryAPI.GetItemDescription(caseId, '');
        }
        else {
            elPanel.visible = false;
        }
    }
    function _SetCaseModelImage(caseId, PanelId) {
        const elItemModelImagePanel = $.GetContextPanel().FindChildInLayoutFile(PanelId);
        const item_attributes = 'item_attributes' in $.GetContextPanel().Data().oSettings ? $.GetContextPanel().Data().oSettings.item_attributes : '';
        InspectModelImage.Init(elItemModelImagePanel, caseId);
        $.GetContextPanel().Data().elCaseModelImagePanel = InspectModelImage.GetModelPanel();
    }
    function _SetLootListItems(caseId, keyId) {
        const count = InventoryAPI.GetLootListItemsCount(caseId);
        const elLootList = $.GetContextPanel().FindChildInLayoutFile('DecodableLootlist');
        const specialItemId = 'id-special-item';
        if (count === 0) {
            _ShowHideLootList(false);
            return;
        }
        const elCaseModelImagePanel = $.GetContextPanel().Data().elCaseModelImagePanel;
        if (elCaseModelImagePanel && elCaseModelImagePanel.IsValid() && elCaseModelImagePanel.id === 'ImagePreviewPanel') {
            elCaseModelImagePanel.AddClass('y-offset');
        }
        _ShowHideLootList(true);
        _SetLootlistHintText(caseId, count);
        for (let i = 0; i < count; i++) {
            const itemid = InventoryAPI.GetLootListItemIdByIndex(caseId, i) === '0' ? specialItemId : InventoryAPI.GetLootListItemIdByIndex(caseId, i);
            let elItem = elLootList.FindChildInLayoutFile(itemid);
            if (!elItem) {
                let elItem = $.CreatePanel('Panel', elLootList, itemid);
                elItem.SetAttributeString('itemid', itemid);
                elItem.BLoadLayoutSnippet('LootListItem');
                const isAllowedToInteractWithLootlistItems = true;
                _UpdateLootListItemInfo(elItem, itemid, caseId);
                const funcActivation = isAllowedToInteractWithLootlistItems ? _OnActivateLootlistTile : () => { };
                elItem.SetPanelEvent('onactivate', funcActivation.bind(undefined, itemid, caseId, keyId));
                elItem.SetPanelEvent('oncontextmenu', funcActivation.bind(undefined, itemid, caseId, keyId));
                if (i === 0 && isAllowedToInteractWithLootlistItems) {
                    $.GetContextPanel().FindChildInLayoutFile('CanDecodableBrowseBtn').SetPanelEvent('onactivate', callBackFunc.bind(undefined, itemid, caseId, keyId));
                }
                if (itemid !== specialItemId) {
                    $.GetContextPanel().Data().aItemsInLootlist.push({
                        id: itemid,
                        weight: _GetDisplayWeightForScroll(itemid),
                    });
                }
            }
        }
    }
    function _OnActivateLootlistTile(itemid, caseId, keyId) {
        if (!InventoryAPI.IsValidItemID(itemid))
            return;
        let items = [];
        items.push({ label: '#UI_Inspect', jsCallback: callBackFunc.bind(undefined, itemid, caseId, keyId) });
        if (MyPersonaAPI.GetLauncherType() !== "perfectworld" && !InventoryAPI.CannotTrade(itemid)) {
            items.push({ label: '#SFUI_Store_Market_Link', jsCallback: _ViewOnMarket.bind(undefined, itemid) });
        }
        UiToolkitAPI.ShowSimpleContextMenu('', 'ControlLibSimpleContextMenu', items);
    }
    function callBackFunc(itemid, caseId, keyId) {
        $.DispatchEvent('ContextMenuEvent', '');
        const storeid = InspectShared.GetPopupSetting('store_item_id') ? InspectShared.GetPopupSetting('store_item_id') : '';
        $.DispatchEvent("LootlistItemPreview", itemid, caseId +
            ',' + storeid);
    }
    function _ViewOnMarket(id) {
        SteamOverlayAPI.OpenURL(ItemInfo.GetMarketLinkForLootlistItem(id));
    }
    function _GetDisplayWeightForScroll(itemid) {
        const rarityVal = InventoryAPI.GetItemRarity(itemid);
        const displayItemWeight = [150000, 30000, 6000, 1250, 250, 50, 10];
        return displayItemWeight[rarityVal];
    }
    function _UpdateLootListItemInfo(elItem, itemid, caseId) {
        const specialItemId = 'id-special-item';
        if (itemid == specialItemId) {
            $.GetContextPanel().Data().unusualItemImagePath = InventoryAPI.GetLootListUnusualItemImage(caseId) + ".png";
            _UpdateUnusualItemInfo(elItem, caseId, $.GetContextPanel().Data().unusualItemImagePath, true);
        }
        else {
            elItem.FindChildInLayoutFile('ItemImage').itemid = itemid;
            elItem.FindChildInLayoutFile('JsRarity').style.backgroundColor = InventoryAPI.GetItemRarityColor(itemid);
            ItemInfo.GetFormattedName(itemid).SetOnLabel(elItem.FindChildInLayoutFile('JsItemName'));
        }
    }
    function _ShowHideLootList(bshow) {
        const elLootListContainer = $.GetContextPanel().FindChildInLayoutFile('DecodableLootlistContainer');
        elLootListContainer.SetHasClass('hidden', !bshow);
    }
    function _SetLootlistHintText(caseId, count) {
        const bAllItems = InventoryAPI.GetLootListAllEntriesAreAdditionalDrops(caseId);
        $.GetContextPanel().FindChildInLayoutFile('CanDecodableDesc').visible = !bAllItems;
        if (count > 1 || bAllItems) {
            $.GetContextPanel().FindChildInLayoutFile('CanDecodableDescMulti').SetDialogVariableInt('num_items', count);
            $.GetContextPanel().FindChildInLayoutFile('CanDecodableDescMulti').visible = (count > 1 && bAllItems);
        }
    }
    function _UpdateUnusualItemInfo(elItem, caseId, unusualItemImagePath, bisDisplayedInLootlist = false) {
        if (!elItem || !elItem.IsValid()) {
            return;
        }
        elItem.FindChildInLayoutFile('ItemImage').SetImage("file://{images}/" + unusualItemImagePath);
        if (bisDisplayedInLootlist) {
            elItem.FindChildInLayoutFile('JsRarity').AddClass('popup-decodable-wash-color-unusual');
            const elBg = elItem.FindChildInLayoutFile('ItemTileBg');
            elBg.AddClass('popup-decodable-wash-color-unusual-bg');
            const elName = elItem.FindChildInLayoutFile('JsItemName');
            elName.text = InventoryAPI.GetLootListUnusualItemName(caseId);
        }
        else {
            elItem.FindChildInLayoutFile('JsRarity').style.washColor = '#ffd700';
            elItem.FindChildInLayoutFile('JItemTint').style.washColor = '#ffd700';
        }
    }
    function _SetUpCaseOpeningScroll() {
        _ShowHideLootList(false);
        let delay = 0;
        const elCaseModelImagePanel = $.GetContextPanel().Data().elCaseModelImagePanel;
        if (elCaseModelImagePanel &&
            elCaseModelImagePanel.IsValid() &&
            elCaseModelImagePanel.id == 'ImagePreviewPanel' &&
            !elCaseModelImagePanel.BHasClass('hidden')) {
            elCaseModelImagePanel.RemoveClass('y-offset');
            delay = 0.1;
        }
        else {
            elCaseModelImagePanel.TransitionToCamera('cam_case_open', 1.5);
            $.Schedule(0.75, () => { elCaseModelImagePanel?.SetAnimgraphBool('open', true); });
            delay = 2.0;
        }
        $.Schedule(delay, () => _ShowScroll(elCaseModelImagePanel));
    }
    function _ShowScroll(elCase) {
        const elScroll = $.GetContextPanel().FindChildInLayoutFile('DecodableItemsScroll');
        if (!elScroll || !elScroll.IsValid() || !elCase || !elCase.IsValid()) {
            return;
        }
        elScroll.RemoveClass('hidden');
        elCase.AddClass('popup-inspect-modelpanel_darken_blur');
        const scrollListsPanelIds = $.GetContextPanel().Data().scrollListsPanelIds;
        _FillScrollsWithItems(scrollListsPanelIds);
        $.Schedule(0.1, _PlayScrollAnim.bind(undefined, scrollListsPanelIds));
    }
    function _PlayScrollAnim(scrolllists) {
        const targetId = 'ItemFromContainer';
        const xOffsetSlackPercent = (Math.floor(Math.random() * ((90) - 10 + 1) + 10) / 100);
        for (let element of scrolllists) {
            let xPos = _GetStopPosition($.GetContextPanel().FindChildInLayoutFile(element), targetId, xOffsetSlackPercent);
            const elScroll = $.GetContextPanel().FindChildInLayoutFile(element);
            elScroll.ScrollToFitRegion(xPos, xPos, 0, 0, 3, true, false);
        }
        const revealDelay = 6;
        const contextPanel = $.GetContextPanel();
        contextPanel.Data().showInspectScheduleHandle = $.Schedule(revealDelay, () => _ShowInspect(contextPanel));
        const itemDefName = InventoryAPI.GetItemDefinitionName(InspectShared.GetPopupSetting('item_id'));
        let soundEventName = "container_weapon_ticker";
        if (itemDefName && itemDefName.indexOf("sticker") != -1) {
            soundEventName = "container_sticker_ticker";
        }
        for (let i = 0; i < _TickSoundIntervals.length; ++i) {
            $.Schedule(_TickSoundIntervals[i], _ScrollTick.bind(undefined, soundEventName));
        }
    }
    const _TickSoundIntervals = [0.000, 0.063, 0.125, 0.188, 0.250, 0.313, 0.375, 0.438, 0.500, 0.563, 0.625, 0.688, 0.750, 0.813, 0.875, 0.938, 1.000, 1.063, 1.125, 1.188, 1.250, 1.313, 1.375, 1.483, 1.351, 1.620, 1.701, 1.786, 1.872, 2.003, 2.154, 2.313, 2.466, 2.615, 2.773, 2.941, 3.104, 3.339, 3.630, 3.953, 4.385, 5.004,];
    function _ScrollTick(soundEventName) {
        $.DispatchEvent("CSGOPlaySoundEffect", soundEventName, "MOUSE");
    }
    function _GetStopPosition(elParent, targetId, xOffsetSlackPercent) {
        const elTile = elParent.FindChildInLayoutFile(targetId);
        if (!elTile || !elTile.IsValid())
            return 0;
        const tileWidth = elTile.contentwidth;
        return (elTile.actualxoffset + (tileWidth * xOffsetSlackPercent));
    }
    function _ShowInspect(contextPanel) {
        contextPanel.Data().showInspectScheduleHandle = null;
        if (contextPanel.Data().itemFromContainer) {
            InventoryAPI.SetItemSessionPropertyValue(contextPanel.Data().itemFromContainer, 'recent', '1');
            InventoryAPI.AcknowledgeNewItembyItemID(contextPanel.Data().itemFromContainer);
            if (ItemInfo.ItemDefinitionNameSubstrMatch(contextPanel.Data().itemFromContainer, 'tournament_journal_')) {
                $.Schedule(0.2, () => {
                    UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_major_hub.xml', 'journalid=' + contextPanel.Data().itemFromContainer);
                });
            }
            else {
                $.DispatchEvent("InventoryItemPreview", contextPanel.Data().itemFromContainer, '');
            }
            CapabilityDecodable.ClosePopUp();
            const rarityVal = InventoryAPI.GetItemRarity(contextPanel.Data().itemFromContainer);
            let soundEvent = "ItemRevealRarityCommon";
            if (rarityVal == 4) {
                soundEvent = "ItemRevealRarityUncommon";
            }
            else if (rarityVal == 5) {
                soundEvent = "ItemRevealRarityRare";
            }
            else if (rarityVal == 6) {
                soundEvent = "ItemRevealRarityMythical";
            }
            else if (rarityVal == 7) {
                soundEvent = "ItemRevealRarityLegendary";
            }
            else if (rarityVal == 8) {
                soundEvent = "ItemRevealRarityAncient";
            }
            $.DispatchEvent("CSGOPlaySoundEffect", soundEvent, "MOUSE");
        }
        else {
            _TimeoutPopup();
        }
    }
    function _TimeoutPopup() {
        CapabilityDecodable.ClosePopUp();
        UiToolkitAPI.ShowGenericPopupOk($.Localize('#SFUI_SteamConnectionErrorTitle'), $.Localize('#SFUI_InvError_Item_Not_Given'), '', () => { });
    }
    function _FillScrollsWithItems(lists) {
        const numTilesInScroll = 38;
        const indexItemsFromContainer = 3;
        const indexStart = (numTilesInScroll - 3);
        let totalWeight = 0;
        for (let element of $.GetContextPanel().Data().aItemsInLootlist) {
            totalWeight += element.weight;
        }
        let displayItemsList = [];
        for (let i = 0; i < numTilesInScroll; i++) {
            const itemToAdd = GetItemBasedOnDisplayWeight(totalWeight, $.GetContextPanel().Data().aItemsInLootlist);
            if (itemToAdd)
                displayItemsList.push(itemToAdd);
        }
        for (let element of lists) {
            const elParent = $.GetContextPanel().FindChildInLayoutFile(element);
            for (let i = 0; i < displayItemsList.length; i++) {
                const itemId = displayItemsList[i];
                const tileId = (i === indexItemsFromContainer) ? 'ItemFromContainer' : (i === indexStart) ? 'ItemStart' : itemId;
                const elTile = $.CreatePanel('Panel', elParent, tileId);
                elTile.BLoadLayoutSnippet('ScrollItem');
                _UpdateScrollTile(element, elTile, itemId);
            }
        }
    }
    function _UpdateScrollTile(listId, elTile, itemId) {
        if (listId === 'ScrollListMagnified') {
            elTile.AddClass('magnified');
        }
        itemId = (elTile.id === 'ItemFromContainer' && $.GetContextPanel().Data().itemFromContainer) ? $.GetContextPanel().Data().itemFromContainer : itemId;
        if ((InventoryAPI.GetItemQuality(itemId) === 3) && $.GetContextPanel().Data().unusualItemImagePath) {
            _UpdateUnusualItemInfo(elTile, InspectShared.GetPopupSetting('item_id'), $.GetContextPanel().Data().unusualItemImagePath);
        }
        else {
            elTile.FindChildInLayoutFile('ItemImage').itemid = itemId;
            elTile.FindChildInLayoutFile('JsRarity').style.washColor = InventoryAPI.GetItemRarityColor(itemId);
            elTile.FindChildInLayoutFile('JItemTint').style.washColor = InventoryAPI.GetItemRarityColor(itemId);
        }
    }
    function GetItemBasedOnDisplayWeight(totalWeight, aItemsInLootlist) {
        let weightOfItem = 0;
        const Random = Math.floor(Math.random() * totalWeight);
        for (let i = 0; i < aItemsInLootlist.length; i++) {
            weightOfItem += aItemsInLootlist[i].weight;
            if (Random <= weightOfItem)
                return aItemsInLootlist[i].id;
        }
    }
    function _SetUpCaseOpeningCountdown() {
        _UpdateOpeningCounter.SetIsGraffiti(_GetContainerType(InspectShared.GetPopupSetting('item_id')) === 'graffiti');
        _UpdateOpeningCounter.ShowCounter();
        _UpdateOpeningCounter.UpdateCounter();
        _ShowHideLootList(false);
    }
    let _UpdateOpeningCounter;
    (function (_UpdateOpeningCounter) {
        let counterVal = 6;
        const elCountdown = $.GetContextPanel().FindChildInLayoutFile('DecodableCountdown');
        const elCountdownLabel = elCountdown.FindChildInLayoutFile('DecodableCountdownLabel');
        const elCountdownRadial = elCountdown.FindChildInLayoutFile('DecodableCountdownRadial');
        let timerHandle = null;
        let isGraffitiUnseal = false;
        function UpdateCounter() {
            timerHandle = null;
            counterVal = counterVal - 1;
            if (counterVal === 0) {
                elCountdown.AddClass('hidden');
                _ShowInspect($.GetContextPanel());
            }
            else {
                $.DispatchEvent("CSGOPlaySoundEffect", "container_countdown", "MOUSE");
                elCountdownLabel.text = String(counterVal);
                if (!isGraffitiUnseal) {
                    elCountdownLabel.visible = true;
                    elCountdownLabel.RemoveClass('popup-countdown-anim');
                    elCountdownLabel.AddClass('popup-countdown-anim');
                }
                else {
                    elCountdownLabel.visible = false;
                }
                elCountdownRadial.RemoveClass('popup-countdown-timer-circle-anim');
                elCountdownRadial.AddClass('popup-countdown-timer-circle-anim');
                timerHandle = $.Schedule(1, UpdateCounter);
            }
        }
        _UpdateOpeningCounter.UpdateCounter = UpdateCounter;
        function ShowCounter() {
            elCountdown.RemoveClass('hidden');
        }
        _UpdateOpeningCounter.ShowCounter = ShowCounter;
        function CancelTimer() {
            if (timerHandle) {
                $.CancelScheduled(timerHandle);
                timerHandle = null;
            }
        }
        _UpdateOpeningCounter.CancelTimer = CancelTimer;
        function SetIsGraffiti(isGraffiti) {
            isGraffitiUnseal = isGraffiti;
        }
        _UpdateOpeningCounter.SetIsGraffiti = SetIsGraffiti;
    })(_UpdateOpeningCounter || (_UpdateOpeningCounter = {}));
    function _SetUpXrayPanel() {
        const caseId = InspectShared.GetPopupSetting('item_id');
        if (!caseId) {
            return;
        }
        const elActionsPanel = $.GetContextPanel().FindChildInLayoutFile('XrayItemsActionPanel');
        const existingRewardFromXrayId = $.GetContextPanel().Data().existingRewardFromXrayId;
        elActionsPanel.AddClass('hidden');
        if (!existingRewardFromXrayId) {
            elActionsPanel.RemoveClass('hidden');
            _SetCaseModelImage(caseId, 'PopUpXrayModelOrImage');
            const elBtn = $.GetContextPanel().FindChildInLayoutFile('ConfirmXray');
            elBtn.SetPanelEvent('onactivate', _OnActivateXray.bind(undefined, elBtn));
            $.GetContextPanel().FindChildInLayoutFile('PopUpXrayStatusLabel').text = $.Localize("#popup_xray_ready_for_use");
        }
        else if (existingRewardFromXrayId) {
            InspectHeader.Init();
            $.GetContextPanel().FindChildInLayoutFile('XrayItemsActionPanelItemName').RemoveClass('hidden');
            const elImagePanel = $.GetContextPanel().FindChildInLayoutFile('PopUpXrayModelOrImageReveal');
            if (!elImagePanel.BHasClass('popup-xray-reverse-effect')) {
                elImagePanel.AddClass('no-anim');
                elImagePanel.AddClass('popup-xray-reverse-effect');
                $.GetContextPanel().FindChildInLayoutFile('PopUpXrayModelOrImage').AddClass('hide');
                _SetCaseModelImage(existingRewardFromXrayId, 'PopUpXrayModelOrImageReveal');
            }
            $.GetContextPanel().FindChildInLayoutFile('PopUpXrayStatusLabel').text = $.Localize("#popup_xray_already_in_use");
            $.GetContextPanel().FindChildInLayoutFile('PopUpXrayStatusDot').AddClass('in-use');
        }
        const elXrayPanel = $.GetContextPanel().FindChildInLayoutFile('XrayItemsPanel');
        elXrayPanel.RemoveClass('hidden');
        const aPanels = $.GetContextPanel().FindChildInLayoutFile('PopUpXrayBgSquares').Children();
        _AnimSquares(aPanels);
    }
    function _OnActivateXray(elBtn) {
        const caseId = InspectShared.GetPopupSetting('item_id');
        InventoryAPI.UseTool(caseId, caseId);
        elBtn.enabled = false;
        _XrayReveal();
        $.DispatchEvent('CSGOPlaySoundEffect', 'XrayStart', 'MOUSE');
    }
    function _XrayReveal() {
        const revealDelay = 3.5;
        $.GetContextPanel().Data().showInspectScheduleHandle = $.Schedule(revealDelay, _ShowXrayReward);
        let oData = {
            clipValue: 0,
            lineValue: 100,
            clipPanel: $.GetContextPanel().FindChildInLayoutFile('PopUpXrayModelOrImage'),
            linePanel: $.GetContextPanel().FindChildInLayoutFile('PopUpXrayModelOrImageRevealLine')
        };
        oData.clipPanel.AddClass('popup-xray-inverse-effect');
        $.GetContextPanel().FindChildInLayoutFile('PopUpXrayModelOrImageReveal').AddClass('popup-xray-reverse-effect');
        $.Schedule(1, () => {
            oData.linePanel.visible = true;
            _AnimClip(oData);
        });
    }
    function _AnimClip(oData) {
        if (oData.clipValue <= 100) {
            oData.clipPanel.style.clip = 'rect( 0%, 100%, 100%, ' + oData.clipValue + '% );';
            oData.clipValue = oData.clipValue + 1;
            oData.linePanel.style.transform = 'translatex( -' + oData.lineValue + '%);';
            oData.lineValue = oData.lineValue - 1;
            $.Schedule(0.02, _AnimClip.bind(undefined, oData));
        }
        else {
            oData.linePanel.AddClass('hide');
            oData.clipPanel.AddClass('hide');
            _SetUpPanelElements();
        }
    }
    function _AnimSquares(aPanels) {
        if ($.GetContextPanel().FindChildInLayoutFile('XrayItemsPanel').visible) {
            for (let panel of aPanels) {
                panel.style.backgroundColor = 'rgba(255, 255, 255, 0.0' + Math.ceil(Math.random() * 10) + ');';
            }
            $.Schedule(1, _AnimSquares.bind(undefined, aPanels));
        }
    }
    function _ShowXrayReward() {
        $.GetContextPanel().Data().showInspectScheduleHandle = null;
        if ($.GetContextPanel().Data().existingRewardFromXrayId) {
            _SetUpPanelElements();
        }
        else {
            _TimeoutPopup();
        }
    }
    function _UpdateXrayRewardTile(itemId) {
        const oData = ItemInfo.GetItemsInXray();
        $.GetContextPanel().Data().existingRewardFromXrayId = itemId === oData.reward ? oData.reward : '';
        _SetCaseModelImage(itemId, 'PopUpXrayModelOrImageReveal');
    }
    function _UpdateScrollResultTile(numericType, type, itemId) {
        if (type === "crate_unlock" ||
            type === 'graffity_unseal' ||
            type === 'xray_item_reveal' ||
            type === "xray_item_claim") {
            if (InspectShared.GetPopupSetting('is_xray_machine')) {
                let oData = ItemInfo.GetItemsInXray();
                if (oData.reward && type === 'xray_item_reveal') {
                    _UpdateXrayRewardTile(itemId);
                    return;
                }
                else if (type === 'xray_item_claim') {
                    $.GetContextPanel().Data().itemFromContainer = itemId;
                    _ShowInspect($.GetContextPanel());
                    return;
                }
            }
            else {
                $.GetContextPanel().Data().itemFromContainer = itemId;
            }
            if ($.GetContextPanel().FindChildInLayoutFile('DecodableItemsScroll').BHasClass('hidden')) {
                if (type === 'graffity_unseal') {
                    _ShowInspect($.GetContextPanel());
                }
                return;
            }
            else {
                for (let element of $.GetContextPanel().Data().scrollListsPanelIds) {
                    const elScroll = $.GetContextPanel().FindChildInLayoutFile(element);
                    const elTile = elScroll.FindChildInLayoutFile('ItemFromContainer');
                    _UpdateScrollTile(element, elTile, itemId);
                }
            }
        }
        else if (type === "ticket_activated") {
            $.GetContextPanel().Data().itemFromContainer = itemId;
            _ShowInspect($.GetContextPanel());
        }
    }
    function _ItemAcquired(ItemId) {
        $.DispatchEvent("CSGOPlaySoundEffect", "rename_purchaseSuccess", "MOUSE");
        const keyId = InspectShared.GetPopupSetting('tool_id');
        const keyToSellId = InventoryAPI.GetAssociatedItemIdByIndex(InspectShared.GetPopupSetting('item_id'), 0);
        if (!keyId && keyToSellId) {
            let matchingKeyDefName = InventoryAPI.GetItemDefinitionName(keyToSellId);
            if (InventoryAPI.DoesItemMatchDefinitionByName(ItemId, matchingKeyDefName)) {
                InspectShared.SetPopupSetting('tool_id', ItemId);
                $.DispatchEvent('HideStoreStatusPanel');
                _AcknowledgeMatchingKeys(matchingKeyDefName);
                InspectShared.SetPopupSetting('purchase_item_id', '');
                _SetUpPanelElements();
            }
        }
        else if (InspectShared.GetPopupSetting('store_item_id')) {
            ClosePopUp();
            $.DispatchEvent('ShowAcknowledgePopup', '', ItemId);
            $.DispatchEvent('HideStoreStatusPanel');
        }
    }
    function _AcknowledgeMatchingKeys(matchingKeyDefName) {
        const bShouldAcknowledge = true;
        AcknowledgeItems.GetItemsByType([matchingKeyDefName], bShouldAcknowledge);
    }
    function _ShowUnlockAnimation() {
        const caseId = InspectShared.GetPopupSetting('item_id');
        const lootListCount = InventoryAPI.GetLootListItemsCount(caseId);
        if (lootListCount === undefined) {
            if (InventoryAPI.IsValidItemID($.GetContextPanel().Data().itemFromContainer)) {
                _ShowInspect($.GetContextPanel());
            }
            else {
                _SetUpCaseOpeningCountdown();
            }
            return;
        }
        if (lootListCount <= 1) {
            _SetUpCaseOpeningCountdown();
        }
        else {
            _SetUpCaseOpeningScroll();
        }
        _PlayContainerSound(caseId, 'open');
        _PlayContainerSound(caseId, 'ticker');
    }
    function _PlayContainerSound(caseId, soundName) {
        $.DispatchEvent("CSGOPlaySoundEffect", "container_" + _GetContainerType(caseId) + "_" + soundName, "MOUSE");
    }
    function _GetContainerType(caseId) {
        const itemDefName = InventoryAPI.GetItemDefinitionName(InspectShared.GetPopupSetting('item_id'));
        if (itemDefName && (itemDefName.indexOf("spray") != -1 || itemDefName.indexOf("tournament_pass_") != -1))
            return 'graffiti';
        else if (itemDefName && itemDefName.indexOf("sticker") != -1)
            return 'sticker';
        else if (itemDefName && itemDefName.indexOf("pins") != -1)
            return 'pins';
        else if (itemDefName && itemDefName.indexOf("patch") != -1)
            return 'patch';
        else if (itemDefName && (itemDefName.indexOf("coupon") == 0 || itemDefName.indexOf("musickit") != -1))
            return 'music';
        else
            return 'weapon';
    }
    function ClosePopUp() {
        InventoryAPI.StopItemPreviewMusic();
        if ($.GetContextPanel().IsValid()) {
            if ($.GetContextPanel().Data().showInspectScheduleHandle) {
                $.CancelScheduled($.GetContextPanel().Data().showInspectScheduleHandle);
                $.GetContextPanel().Data().showInspectScheduleHandle = null;
            }
            const elRentalBar = $.GetContextPanel().FindChildInLayoutFile('PopUpInspectRentalBar');
            const elAsyncActionBarPanel = $.GetContextPanel().FindChildInLayoutFile('PopUpInspectAsyncBar');
            const elPurchase = $.GetContextPanel().FindChildInLayoutFile('PopUpInspectPurchaseBar');
            if (!elRentalBar.BHasClass('hidden')) {
                InspectRentalBar.ClosePopup($.GetContextPanel());
            }
            if (!elAsyncActionBarPanel.BHasClass('hidden')) {
                InspectAsyncActionBar.OnEventToClose();
            }
            else if (!elPurchase.BHasClass('hidden')) {
                InspectPurchaseBar.ClosePopup();
            }
        }
        _UpdateOpeningCounter.CancelTimer();
    }
    CapabilityDecodable.ClosePopUp = ClosePopUp;
    function _Refresh() {
        const caseId = InspectShared.GetPopupSetting('item_id');
        if (!caseId || !InventoryAPI.IsValidItemID(caseId)) {
            ClosePopUp();
            return;
        }
        _SetUpPanelElements();
    }
    function UpdateInspectMap() {
        InspectModelImage.SwitchMap($.GetContextPanel());
    }
    CapabilityDecodable.UpdateInspectMap = UpdateInspectMap;
    function _PlayOpenCaseAnimForRental() {
        _ShowHideLootList(false);
        _PlayContainerSound(InspectShared.GetPopupSetting('item_id'), 'open');
        $.GetContextPanel().Data().elCaseModelImagePanel.TransitionToCamera('cam_case_open', 1.5);
        $.Schedule(0.75, () => { $.GetContextPanel().Data().elCaseModelImagePanel?.SetAnimgraphBool('open', true); });
    }
    CapabilityDecodable._PlayOpenCaseAnimForRental = _PlayOpenCaseAnimForRental;
    $.RegisterForUnhandledEvent('PanoramaComponent_Inventory_ItemCustomizationNotification', _UpdateScrollResultTile);
    $.RegisterForUnhandledEvent('PanoramaComponent_Store_PurchaseCompleted', _ItemAcquired);
    $.RegisterForUnhandledEvent('StartDecodeableAnim', _ShowUnlockAnimation);
    $.RegisterForUnhandledEvent('StartRentalAnim', _PlayOpenCaseAnimForRental);
    $.RegisterForUnhandledEvent("CSGOInspectBackgroundMapChanged", UpdateInspectMap);
    $.RegisterForUnhandledEvent('CSGOShowMainMenu', _Refresh);
    $.RegisterForUnhandledEvent('PopulateLoadingScreen', ClosePopUp);
    $.RegisterForUnhandledEvent('OpenInventory', ClosePopUp);
})(CapabilityDecodable || (CapabilityDecodable = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfY2FwYWJpbGl0eV9kZWNvZGFibGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfY2FwYWJpbGl0eV9kZWNvZGFibGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyxtREFBbUQ7QUFDbkQsOENBQThDO0FBQzlDLHNDQUFzQztBQUN0QyxtREFBbUQ7QUFDbkQsc0RBQXNEO0FBQ3RELG9EQUFvRDtBQUNwRCxnREFBZ0Q7QUFDaEQsa0RBQWtEO0FBQ2xELGdEQUFnRDtBQU1oRCxJQUFVLG1CQUFtQixDQW9pQzVCO0FBcGlDRCxXQUFVLG1CQUFtQjtJQUU1QixTQUFnQixJQUFJO1FBR25CLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxpQkFBaUIsR0FBRyxFQUFFLENBQUM7UUFDbEQsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDLHdCQUF3QixHQUFHLEVBQUUsQ0FBQztRQUN6RCxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsb0JBQW9CLEdBQUcsRUFBRSxDQUFDO1FBQ3JELENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyx5QkFBeUIsR0FBRyxJQUFJLENBQUM7UUFDNUQsSUFBSSxnQkFBZ0IsR0FBcUMsRUFBRSxDQUFDO1FBQzVELENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQztRQUMvRCxJQUFJLHFCQUFxQixHQUFzRCxJQUFJLENBQUM7UUFDcEYsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDLHFCQUFxQixHQUFHLHFCQUFxQixDQUFDO1FBQ3pFLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxJQUFJLEVBQUUs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