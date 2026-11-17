"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../inspect.ts" />
/// <reference path="../common/iteminfo.ts" />
/// <reference path="../popups/popup_capability_can_sticker.ts" />
/// <reference path="../popups/popup_can_apply_header.ts" />
var CanApplyPickSlot;
(function (CanApplyPickSlot) {
    function Init(oSettings) {
        ShowHideInfoPanel(oSettings.isRemove && oSettings.type === 'keychain', oSettings.infoPanel);
        const worktype = InspectShared.GetPopupSetting('work_type');
        if (oSettings.isRemove || (worktype === 'craft_souvenir')) {
            ShowItemIconsToRemove(oSettings, worktype);
        }
        else {
            _AddItemImage(oSettings, oSettings.toolId);
        }
        _ShowHideApplyHints(oSettings);
        _BtnActions(oSettings);
    }
    CanApplyPickSlot.Init = Init;
    function UpdateSelectedRemoveForSticker(slotIndex, oSettings) {
        const elContainer = oSettings.infoPanel.FindChildInLayoutFile('CanStickerItemIcons');
        let itemId = '';
        elContainer.Children().forEach(element => {
            element.SetHasClass('is_sticker_remove_unselected', element.Data().slot !== slotIndex);
            element.SetHasClass('is_sticker_remove_selected', element.Data().slot === slotIndex);
            element.checked = element.Data().slot === slotIndex;
            if (element.Data().slot === slotIndex) {
                itemId = element.Data().itemId;
                element.TriggerClass('popup-can-apply-item-image--anim');
            }
        });
        const elStickerScrapeLevelContainer = oSettings.infoPanel.FindChildInLayoutFile('StickerScrapeLevelContainer');
        if (elStickerScrapeLevelContainer) {
            const bShowScrapeLevelSlider = itemId && !InspectShared.GetPopupSetting('remove_sticker_all_at_once', oSettings.contextPanel);
            elStickerScrapeLevelContainer.SetHasClass('StickerScrapeLevelContainerHidden', bShowScrapeLevelSlider ? false : true);
            const elStickerScrapeLevelSlider = elStickerScrapeLevelContainer.FindChildInLayoutFile('StickerScrapeLevelSlider');
            if (elStickerScrapeLevelSlider && bShowScrapeLevelSlider) {
                let valWear = InventoryAPI.GetItemAttributeValue(itemId, "sticker slot " + slotIndex + " wear");
                if (!valWear)
                    valWear = 0.0;
                valWear = Math.ceil(valWear * 100.0);
                elStickerScrapeLevelSlider.default = valWear;
                elStickerScrapeLevelSlider.SetValueNoEvents(valWear);
                if (oSettings.asyncBarPanel) {
                    const elGreenButton = oSettings.asyncBarPanel.FindChildInLayoutFile('AsyncItemWorkAcceptConfirm');
                    if (elGreenButton)
                        elGreenButton.SetHasClass('AsyncItemWorkAcceptConfirmDisabled', true);
                    InventoryAPI.HighlightStickerBySlot(slotIndex);
                    CapabilityCanSticker.SetStickerScrapeLevel(0, oSettings.contextPanel);
                }
            }
            else if (itemId && oSettings.asyncBarPanel) {
                InventoryAPI.HighlightStickerBySlot(slotIndex);
            }
        }
    }
    CanApplyPickSlot.UpdateSelectedRemoveForSticker = UpdateSelectedRemoveForSticker;
    function _ShowHideApplyHints(oSettings) {
        oSettings.infoPanel.FindChildInLayoutFile('popup-capability-keychain-hints').SetHasClass('show-keychain-apply-hints', !oSettings.isRemove && oSettings.type === "keychain");
        oSettings.infoPanel.FindChildInLayoutFile('popup-capability-sticker-hints').SetHasClass('show-sticker-apply-hints', !oSettings.isRemove && oSettings.type === "sticker");
        oSettings.infoPanel.FindChildInLayoutFile('popup-capability-sticker-remove-hint').SetHasClass('show-sticker-remove-hints', oSettings.isRemove && oSettings.type === "sticker"
            && !InspectShared.GetPopupSetting('remove_sticker_all_at_once', oSettings.contextPanel));
        oSettings.infoPanel.FindChildInLayoutFile('popup-capability-sticker-wipestickers-hint').SetHasClass('show-sticker-remove-hints', oSettings.isRemove && oSettings.type === "sticker"
            && !!InspectShared.GetPopupSetting('remove_sticker_all_at_once', oSettings.contextPanel));
        if ('craft_souvenir' === InspectShared.GetPopupSetting('work_type')) {
            const elHintBar = oSettings.infoPanel.FindChildInLayoutFile('popup-capability-sticker-craft-souvenir-hint');
            elHintBar.SetHasClass('show-craft-souvenir-hints', true);
            const elHintLabel = elHintBar.FindChildInLayoutFile('popup-capability-sticker-craft-souvenir-inscription');
            elHintLabel.SetDialogVariableLocString('event_name', '#CSGO_Tournament_Event_Name_' + InventoryAPI.GetItemAttributeValue(oSettings.itemId, '{uint32}tournament event id'));
            elHintLabel.SetDialogVariableLocString('event_stage', '#CSGO_Tournament_Event_Stage_' + InventoryAPI.GetItemAttributeValue(oSettings.itemId, '{uint32}tournament event stage id'));
            elHintLabel.SetDialogVariableLocString('event_team1', '#CSGO_TeamID_' + InventoryAPI.GetItemAttributeValue(oSettings.itemId, '{uint32}tournament event team0 id'));
            elHintLabel.SetDialogVariableLocString('event_team2', '#CSGO_TeamID_' + InventoryAPI.GetItemAttributeValue(oSettings.itemId, '{uint32}tournament event team1 id'));
            let locStringPlayer = '#SFUI_Character_Guest';
            let unAutographPlayerID = InventoryAPI.GetItemAttributeValue(oSettings.itemId, '{uint32}tournament mvp account id');
            g_ActiveTournamentTeams.forEach((tt) => tt.players.forEach((tp) => {
                if (tp.playerid === unAutographPlayerID) {
                    locStringPlayer = '#SFUI_ProPlayer_' + tp.code;
                }
            }));
            elHintLabel.SetDialogVariableLocString('autograph_player', locStringPlayer);
        }
    }
    function ShowHideInfoPanel(bHide, elInfoPanel) {
        elInfoPanel.SetHasClass('hidden', bHide);
    }
    CanApplyPickSlot.ShowHideInfoPanel = ShowHideInfoPanel;
    function IsContinueEnabled(elInfoPanel) {
        if (elInfoPanel.FindChildInLayoutFile('CanApplyContinue')) {
            return elInfoPanel.FindChildInLayoutFile('CanApplyContinue').enabled;
        }
        return false;
    }
    CanApplyPickSlot.IsContinueEnabled = IsContinueEnabled;
    const defidxStickerItem = InventoryAPI.GetItemDefinitionIndexFromDefinitionName('sticker');
    function ShowItemIconsToRemove(oSettings, worktype) {
        const slotCount = InventoryAPI.GetItemStickerSlotCount(oSettings.itemId);
        const elContainer = oSettings.infoPanel.FindChildInLayoutFile('CanStickerItemIcons');
        elContainer.RemoveAndDeleteChildren();
        let slots = [];
        for (let i = 0; i < slotCount; i++) {
            const imagePath = InventoryAPI.GetItemStickerImageBySlot(oSettings.itemId, i);
            if (imagePath) {
                let unCostInCredits = 0;
                if (worktype === 'craft_souvenir') {
                    const idStickerKit = InventoryAPI.GetItemAttributeValue(oSettings.itemId, '{uint32}sticker slot ' + i + ' id');
                    const idFauxSticker = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(defidxStickerItem, idStickerKit);
                    unCostInCredits = MissionsAPI.GetSeasonalOperationFauxCreditsCost(g_ActiveTournamentInfo.credits_id, idFauxSticker);
                    if (!unCostInCredits)
                        unCostInCredits = g_ActiveTournamentInfo.souvenir_cost;
                }
                slots.push({ index: i, imagePath: imagePath, cost: unCostInCredits });
            }
        }
        if (worktype === 'craft_souvenir') {
            slots.sort((a, b) => (b.cost - a.cost) * 100 + (a.index - b.index));
        }
        for (let j = 0; j < slots.length; j++) {
            const elPatch = $.CreatePanel('RadioButton', elContainer, slots[j].imagePath, { group: "remove-btns" });
            elPatch.Data().slot = slots[j].index;
            elPatch.Data().itemId = oSettings.itemId;
            elPatch.BLoadLayoutSnippet('RemoveBtn');
            const elImage = elPatch.FindChildInLayoutFile('RemoveImage');
            elImage.SetImage('file://{images}' + slots[j].imagePath + '.png');
            if (worktype === 'craft_souvenir') {
                elPatch.enabled = false;
                const elCostLabel = elPatch.FindChildInLayoutFile('CostLabel');
                if (!g_ActiveTournamentInfo.pp_fixed_prices)
                    elCostLabel.RemoveClass('hidden');
                elCostLabel.SetDialogVariableInt('cost', slots[j].cost);
            }
            else {
                elPatch.SetPanelEvent('onactivate', () => oSettings.funcOnSelectForRemove(slots[j].index, oSettings));
            }
        }
    }
    CanApplyPickSlot.ShowItemIconsToRemove = ShowItemIconsToRemove;
    function _AddItemImage(oSettings, itemid) {
        const elContainer = oSettings.infoPanel.FindChildInLayoutFile('CanStickerItemIcons');
        let aItems;
        aItems = itemid.split(',');
        for (let itemId of aItems) {
            const elImage = elContainer.FindChildInLayoutFile(itemId);
            if (!elImage) {
                const elImage = $.CreatePanel('ItemImage', elContainer, itemId);
                elImage.itemid = itemId;
                elImage.AddClass('popup-can-apply-item-image');
            }
        }
    }
    function _BtnActions(oSettings) {
        const slotsCount = oSettings.isRemove ? InventoryAPI.GetItemStickerSlotCount(oSettings.itemId) : CanApplySlotInfo.GetEmptySlotList().length;
        const elContinueBtn = oSettings.infoPanel.FindChildInLayoutFile('CanApplyContinue');
        const elNextSlotBtn = oSettings.infoPanel.FindChildInLayoutFile('CanApplyNextPos');
        const elCancelBtn = oSettings.infoPanel.FindChildInLayoutFile('CanApplyCancel');
        const worktype = InspectShared.GetPopupSetting('work_type', oSettings.contextPanel);
        if (elContinueBtn)
            elContinueBtn.SetHasClass('hidden', oSettings.isRemove || InspectShared.GetPopupSetting('is_workshop_preview', oSettings.contextPanel)
                || (worktype === 'craft_souvenir'));
        if (elNextSlotBtn) {
            elNextSlotBtn.enabled = !(oSettings.isRemove);
            elNextSlotBtn.SetHasClass('hidden', oSettings.isRemove || (worktype === 'craft_souvenir'));
        }
        if (elCancelBtn) {
            elCancelBtn.SetHasClass('hidden', true);
            elCancelBtn.SetPanelEvent('onactivate', () => _OnCancel(elContinueBtn, elCancelBtn, elNextSlotBtn, oSettings));
        }
        const elStickerScrapeLevelContainer = oSettings.infoPanel.FindChildInLayoutFile('StickerScrapeLevelContainer');
        if (elStickerScrapeLevelContainer) {
            elStickerScrapeLevelContainer.visible = worktype === 'can_sticker' || worktype === 'remove_sticker';
            if (worktype === 'remove_sticker')
                elStickerScrapeLevelContainer.AddClass('StickerScrapeLevelContainerHidden');
            const elStickerScrapeLevelSlider = elStickerScrapeLevelContainer.FindChildInLayoutFile('StickerScrapeLevelSlider');
            if (elStickerScrapeLevelSlider) {
                elStickerScrapeLevelSlider.min = 0;
                elStickerScrapeLevelSlider.increment = 1;
                elStickerScrapeLevelSlider.max = 100;
                elStickerScrapeLevelSlider.default = 0;
                elStickerScrapeLevelSlider.SetValueNoEvents(0);
                const contextPanel = $.GetContextPanel();
                CapabilityCanSticker.SetStickerScrapeLevel(0, contextPanel);
                elStickerScrapeLevelSlider.SetPanelEvent('onvaluechanged', () => {
                    {
                        const elStickerScrapeLevelSlider = oSettings.infoPanel.FindChildInLayoutFile('StickerScrapeLevelSlider');
                        if (elStickerScrapeLevelSlider) {
                            const newvalue = elStickerScrapeLevelSlider.value;
                            if (worktype === 'can_sticker') {
                                $.DispatchEvent('CSGOPlaySoundEffect', 'UI.StickerScratch', 'MOUSE');
                                CapabilityCanSticker.SetStickerScrapeLevel(newvalue, contextPanel);
                            }
                            else if (worktype === 'remove_sticker') {
                                let bCanScrapeStickerToTargetWear = false;
                                if (oSettings.asyncBarPanel) {
                                    const elGreenButton = oSettings.asyncBarPanel.FindChildInLayoutFile('AsyncItemWorkAcceptConfirm');
                                    if (elGreenButton) {
                                        bCanScrapeStickerToTargetWear = (newvalue > elStickerScrapeLevelSlider.default);
                                        elGreenButton.SetHasClass('AsyncItemWorkAcceptConfirmDisabled', !bCanScrapeStickerToTargetWear);
                                        if (bCanScrapeStickerToTargetWear) {
                                            $.DispatchEvent('CSGOPlaySoundEffect', 'UI.StickerScratch', 'MOUSE');
                                            CapabilityCanSticker.SetStickerScrapeLevel(newvalue, contextPanel);
                                        }
                                    }
                                }
                                if (!bCanScrapeStickerToTargetWear) {
                                    elStickerScrapeLevelSlider.SetValueNoEvents(elStickerScrapeLevelSlider.default);
                                    CapabilityCanSticker.SetStickerScrapeLevel(0, contextPanel);
                                }
                            }
                        }
                    }
                    ;
                });
            }
        }
        if (oSettings.isRemove) {
            return;
        }
        if (slotsCount >= 1 || worktype === 'can_keychain') {
            if (elContinueBtn)
                elContinueBtn.SetPanelEvent('onactivate', () => _OnContinue(elContinueBtn, elCancelBtn, elNextSlotBtn, oSettings));
            if (elNextSlotBtn)
                elNextSlotBtn.SetPanelEvent('onactivate', () => _NextSlot(elContinueBtn, oSettings));
        }
        if (oSettings.type === 'sticker' || oSettings.type === 'keychain') {
            elContinueBtn.enabled = false;
            $.Schedule(3.0, () => elContinueBtn.enabled = true);
        }
    }
    function DisableBtns(elPanel) {
        elPanel.FindChildInLayoutFile('CanApplyContinue').enabled = false;
        ;
        elPanel.FindChildInLayoutFile('CanApplyNextPos').enabled = false;
        elPanel.FindChildInLayoutFile('CanApplyCancel').enabled = false;
    }
    CanApplyPickSlot.DisableBtns = DisableBtns;
    function _OnContinue(elContinueBtn, elCancelBtn, elNextSlotBtn, oSettings) {
        oSettings.funcOnConfirm(oSettings);
        const elItemToApply = oSettings.infoPanel.FindChildInLayoutFile('CanStickerItemIcons').Children()[0];
        elItemToApply.ToggleClass('popup-can-apply-item-image--anim');
        elCancelBtn.SetHasClass('hidden', false);
        elNextSlotBtn.SetHasClass('hidden', true);
        elContinueBtn.enabled = false;
        InspectAsyncActionBar.ZoomCamera(true, oSettings.contextPanel.FindChildInLayoutFile('PopUpInspectAsyncBar'));
        const elStickerScrapeLevelContainer = oSettings.infoPanel.FindChildInLayoutFile('StickerScrapeLevelContainer');
        if (elStickerScrapeLevelContainer) {
            elStickerScrapeLevelContainer.enabled = false;
        }
    }
    function _OnCancel(elContinueBtn, elCancelBtn, elNextSlotBtn, oSettings) {
        oSettings.funcOnCancel(oSettings);
        elContinueBtn.enabled = true;
        elNextSlotBtn.enabled = true;
        elNextSlotBtn.SetHasClass('hidden', false);
        elCancelBtn.SetHasClass('hidden', true);
        const elStickerScrapeLevelContainer = oSettings.infoPanel.FindChildInLayoutFile('StickerScrapeLevelContainer');
        if (elStickerScrapeLevelContainer) {
            elStickerScrapeLevelContainer.enabled = true;
        }
    }
    function _NextSlot(elContinueBtn, oSettings) {
        const delayTime = (oSettings.type === 'sticker' || oSettings.type === 'keychain') ? 0 : 1;
        CanApplySlotInfo.IncrementIndex();
        oSettings.funcOnNext(oSettings.toolId, CanApplySlotInfo.GetSelectedEmptySlot(), oSettings);
        const elNextSlotBtn = oSettings.infoPanel.FindChildInLayoutFile('CanApplyNextPos');
        elNextSlotBtn.enabled = false;
        $.Schedule(delayTime, () => {
            if (elNextSlotBtn && elNextSlotBtn.IsValid()) {
                elNextSlotBtn.enabled = true;
            }
        });
        elContinueBtn.enabled = true;
    }
    function SelectFirstRemoveItem() {
        const elContainer = $.GetContextPanel().FindChildInLayoutFile('PopUpCanApplyPickSlot').FindChildInLayoutFile('CanStickerItemIcons');
        if (elContainer.Children()[0] !== undefined && elContainer.Children()[0].IsValid()) {
            $.DispatchEvent("Activated", elContainer.Children()[0], "mouse");
        }
    }
    CanApplyPickSlot.SelectFirstRemoveItem = SelectFirstRemoveItem;
})(CanApplyPickSlot || (CanApplyPickSlot = {}));
var CanApplySlotInfo;
(function (CanApplySlotInfo) {
    let m_emptySlotList = [];
    let m_slotIndex = 0;
    function ResetSlotIndex() {
        m_slotIndex = 0;
        m_emptySlotList = [];
    }
    CanApplySlotInfo.ResetSlotIndex = ResetSlotIndex;
    function UpdateEmptySlotList(itemId) {
        m_emptySlotList = _GetEmptySlots(_GetSlotInfo(itemId));
    }
    CanApplySlotInfo.UpdateEmptySlotList = UpdateEmptySlotList;
    function _GetSlotInfo(itemId) {
        let aSlotInfoList = [];
        let slotsCount = InventoryAPI.GetItemStickerSlotCount(itemId);
        for (let i = 0; i < slotsCount; i++) {
            let ImagePath = InventoryAPI.GetItemStickerImageBySlot(itemId, i);
            if (!ImagePath)
                ImagePath = 'empty';
            aSlotInfoList.push({ index: i, path: ImagePath });
        }
        return aSlotInfoList;
    }
    function _GetEmptySlots(slotInfoList) {
        return slotInfoList.filter(slot => slot.path === 'empty');
    }
    function GetSelectedEmptySlot() {
        const emptySlotCount = m_emptySlotList.length;
        if (emptySlotCount === 0) {
            return 0;
        }
        const activeIndex = (m_slotIndex % emptySlotCount);
        return m_emptySlotList[activeIndex].index;
    }
    CanApplySlotInfo.GetSelectedEmptySlot = GetSelectedEmptySlot;
    function GetSelectedRemoveSlot() {
        const elContainer = $.GetContextPanel().FindChildInLayoutFile('PopUpCanApplyPickSlot').FindChildInLayoutFile('CanStickerItemIcons');
        if (elContainer.IsValid() && elContainer.Children().length > 0) {
            const aSelected = elContainer.Children().filter(entry => (entry.checked === true));
            return aSelected.length > 0 ? aSelected[0].Data().slot : 0;
        }
    }
    CanApplySlotInfo.GetSelectedRemoveSlot = GetSelectedRemoveSlot;
    function IncrementIndex() {
        m_slotIndex++;
    }
    CanApplySlotInfo.IncrementIndex = IncrementIndex;
    function GetEmptySlotList() {
        return m_emptySlotList;
    }
    CanApplySlotInfo.GetEmptySlotList = GetEmptySlotList;
})(CanApplySlotInfo || (CanApplySlotInfo = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfY2FuX2FwcGx5X3BpY2tfc2xvdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3BvcHVwcy9wb3B1cF9jYW5fYXBwbHlfcGlja19zbG90LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFDckMsc0NBQXNDO0FBQ3RDLDhDQUE4QztBQUM5QyxrRUFBa0U7QUFDbEUsNERBQTREO0FBRTVELElBQVUsZ0JBQWdCLENBc1h6QjtBQXRYRCxXQUFVLGdCQUFnQjtJQUV6QixTQUFnQixJQUFJLENBQUcsU0FBNkI7UUFFbkQsaUJBQWlCLENBQUUsU0FBUyxDQUFDLFFBQVEsSUFBSSxTQUFTLENBQUMsSUFBSSxLQUFLLFVBQVUsRUFBRSxTQUFTLENBQUMsU0FBUyxDQUFFLENBQUM7UUFFOUYsTUFBTSxRQUFRLEdBQUcsYUFBYSxDQUFDLGVBQWUsQ0FBRSxXQUFXLENBQVksQ0FBQztRQUN4RSxJQUFLLFNBQVMsQ0FBQyxRQUFRLElBQUksQ0FBRSxRQUFRLEtBQUssZ0JBQWdCLENBQUUsRUFDNUQ7WUFDQyxxQkFBcUIsQ0FBRSxTQUFTLEVBQUUsUUFBUSxDQUFFLENBQUM7U0FDN0M7YUFFRDtZQUNDLGFBQWEsQ0FBRSxTQUFTLEVBQUUsU0FBUyxDQUFDLE1BQU0sQ0FBRSxDQUFDO1NBQzdDO1FBRUQsbUJBQW1CLENBQUUsU0FBUyxDQUFFLENBQUM7UUFDakMsV0FBVyxDQUFFLFNBQVMsQ0FBRSxDQUFDO0lBQzFCLENBQUM7SUFoQmUscUJBQUksT0FnQm5CLENBQUE7SUFFRCxTQUFnQiw4QkFBOEIsQ0FBRSxTQUFnQixFQUFFLFNBQTZCO1FBRTlGLE1BQU0sV0FBVyxHQUFHLFNBQVMsQ0FBQyxTQUFTLENBQUMscUJBQXFCLENBQUUscUJBQXFCLENBQUUsQ0FBQztRQUN2RixJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7UUFFaEIsV0FBVyxDQUFDLFFB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