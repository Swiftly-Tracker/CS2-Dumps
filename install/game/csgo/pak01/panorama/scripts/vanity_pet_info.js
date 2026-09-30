"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="avatar.ts" />
/// <reference path="common/sessionutil.ts" />
/// <reference path="mock_adapter.ts" />
/// <reference path="rating_emblem.ts" />
var VanityPetInfo;
(function (VanityPetInfo) {
    let _m_zoomedPetId = null;
    VanityPetInfo._m_idPrefix = "id-mainmenu-pet-info";
    let _m_infoPanel;
    let _m_textEntry;
    let _m_petId;
    let _m_scheduleEggTimerHandle;
    let _m_focusEventHandler;
    let _m_oldName = '';
    _m_scheduleEggTimerHandle = null;
    function CreateOrUpdatePetInfoPanel(elParent, petItemId) {
        let newPanel = elParent.FindChildInLayoutFile(VanityPetInfo._m_idPrefix);
        if (!petItemId || Number(petItemId) === 0) {
            RemovePanel(elParent);
            return null;
        }
        if (!newPanel) {
            newPanel = $.CreatePanel('Panel', elParent, VanityPetInfo._m_idPrefix);
            newPanel.BLoadLayout('file://{resources}/layout/vanity_pet_info.xml', false, false);
        }
        _m_petId = petItemId;
        let nPetUpgradeLevel = Number(InventoryAPI.GetItemAttributeValue(petItemId, '{uint32}upgrade level'));
        newPanel.SetHasClass('is-grown', nPetUpgradeLevel > 1);
        newPanel.SetHasClass('show', true);
        _m_infoPanel = newPanel;
        _m_textEntry = newPanel.FindChildInLayoutFile('id-name-input-text');
        _m_textEntry.SetMaxChars(20);
        if (!_m_focusEventHandler) {
            _m_focusEventHandler = true;
            $.RegisterEventHandler('InputFocusLost', _m_textEntry, () => {
                if (newPanel.BHasClass('text-entry-active')) {
                    _CloseTextEntry();
                    newPanel.SetHasClass('hover-show', false);
                }
            });
        }
        const bCanRenameThisLifeStage = (nPetUpgradeLevel >= 1) && !InventoryAPI.GetItemAttributeValue(petItemId, '{bytestring}custom name attr'
            + ((nPetUpgradeLevel >= 2) ? ' ' + nPetUpgradeLevel : ''));
        _SetButtonEvents(newPanel, petItemId, nPetUpgradeLevel, bCanRenameThisLifeStage);
        _HoverEvents(newPanel, nPetUpgradeLevel);
        _ShowFoodHint(newPanel, petItemId);
        let petName = InventoryAPI.GetItemName(petItemId);
        let elPetName = newPanel.FindChildInLayoutFile('id-pet-name');
        if (petItemId !== '' && petItemId !== undefined) {
            newPanel.SetDialogVariable('pet_name', InventoryAPI.HasCustomName(petItemId) ? petName : "");
            elPetName.SetHasClass('has-name', InventoryAPI.HasCustomName(petItemId));
            if (_m_oldName !== petName) {
                _m_oldName = petName;
                elPetName.TriggerClass('name-update');
                _CloseTextEntry();
            }
        }
        return newPanel;
    }
    VanityPetInfo.CreateOrUpdatePetInfoPanel = CreateOrUpdatePetInfoPanel;
    function RemovePanel(elParent) {
        let elPanel = elParent.FindChildInLayoutFile(VanityPetInfo._m_idPrefix);
        if (elPanel && elPanel.IsValid()) {
            CancelEggTimer();
            elPanel.RemoveClass('show');
        }
    }
    VanityPetInfo.RemovePanel = RemovePanel;
    function _RoundToPixel(context, value, axis) {
        const scale = axis === "x" ? context.actualuiscale_x : context.actualuiscale_y;
        return Math.round(value * scale) / scale;
    }
    function SetVanityPetInfoPos(elParent, oPos) {
        let elPanel = elParent.FindChildInLayoutFile("id-mainmenu-pet-info");
        if (!elPanel || !elPanel.IsValid()) {
            return;
        }
        elPanel.style.transform = 'translate3d( ' + _RoundToPixel(elParent, oPos.x, "x") + 'px, ' + _RoundToPixel(elParent, oPos.y, "y") + 'px, 0px );';
    }
    VanityPetInfo.SetVanityPetInfoPos = SetVanityPetInfoPos;
    function _HoverEvents(elPanel, nPetUpgradeLevel) {
        let elHoverTarget = elPanel.FindChild('id-vanity-pet-hitbox');
        elHoverTarget.SetPanelEvent('onmouseover', () => {
            if (!SessionUtil.BCanUseMyPetInCurrentLobby()) {
                return;
            }
            if (!InventoryAPI.GetPetItemID()) {
                return;
            }
            _UpdateProgressBars(nPetUpgradeLevel);
            _ShowFoodHint(elPanel, InventoryAPI.GetPetItemID());
            elPanel.SetHasClass('hover-show', true);
        });
        elPanel.SetPanelEvent('onmouseout', () => {
            elPanel.SetHasClass('hover-show', elPanel.BHasClass('text-entry-active'));
        });
    }
    function _SetButtonEvents(elPanel, petId, nPetUpgradeLevel, bCanRenameThisLifeStage) {
        elPanel.FindChildInLayoutFile('id-inspect-pet').SetPanelEvent('onactivate', () => {
            $.DispatchEvent("InventoryItemPreview", petId, '');
        });
        let elNameTag = elPanel.FindChildInLayoutFile('id-name-pet');
        if (bCanRenameThisLifeStage) {
            elNameTag.SetPanelEvent('onactivate', () => {
                _m_textEntry.text = _nameWithQuotes(petId);
                _m_textEntry.SetFocus();
                elPanel.SetHasClass('text-entry-active', true);
                $.DispatchEvent('CSGOPlaySoundEffect', 'sidemenu_slidein', 'MOUSE');
            });
        }
        elNameTag.SetHasClass('hide', !bCanRenameThisLifeStage);
        elNameTag.SetPanelEvent('onmouseover', () => {
            UiToolkitAPI.ShowTextTooltip('id-name-pet', InventoryAPI.HasCustomName(petId) ? '#pet_tooltip_rename' : '#pet_tooltip_name');
        });
        let elPhotoBooth = elPanel.FindChildInLayoutFile('id-photo-booth');
        elPhotoBooth.SetPanelEvent('onactivate', () => { _OpenPhotoBooth(nPetUpgradeLevel); });
        elPhotoBooth.SetHasClass('hide', nPetUpgradeLevel < 1);
        let elPetBook = elPanel.FindChildInLayoutFile('id-pet-book');
        elPetBook.SetPanelEvent('onactivate', _OpenPetBook);
        elPetBook.SetHasClass('hide', nPetUpgradeLevel < 1);
        elPanel.FindChildInLayoutFile('id-name-input-text-cancel').SetPanelEvent('onactivate', CancelTextEntry);
        elPanel.FindChildInLayoutFile('id-name-input-text-submit').SetPanelEvent('onactivate', () => { _SubmitText(petId); });
        elPanel.FindChildInLayoutFile('id-name-input-text-back').SetPanelEvent('onactivate', _CloseTextEntry);
        _EnableDisableSubmitButton(false);
    }
    function CancelTextEntry() {
        if (_m_infoPanel !== null && _m_infoPanel.IsValid())
            _m_textEntry.text = '';
    }
    VanityPetInfo.CancelTextEntry = CancelTextEntry;
    function _SubmitText(petId) {
        const fauxNameTag = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(1200, 0);
        InventoryAPI.UseTool(fauxNameTag, petId);
    }
    function _EnableDisableSubmitButton(bEnable) {
        if (_m_infoPanel !== null && _m_infoPanel.IsValid()) {
            _m_infoPanel.FindChildInLayoutFile('id-name-input-text-submit').enabled = (bEnable && _m_textEntry.text != _nameWithQuotes(_m_petId));
        }
    }
    function _CloseTextEntry() {
        $.DispatchEvent('CSGOPlaySoundEffect', 'sidemenu_slideout', 'MOUSE');
        _m_infoPanel.SetHasClass('text-entry-active', false);
    }
    function OnEntryChanged() {
        let isValid = InventoryAPI.SetNameToolString(_m_textEntry.text, '');
        _EnableDisableSubmitButton(isValid);
        $.DispatchEvent("CSGOPlaySoundEffect", "rename_teletype", "MOUSE");
    }
    VanityPetInfo.OnEntryChanged = OnEntryChanged;
    ;
    function _nameWithQuotes(petId) {
        let nameWithQuotes = InventoryAPI.GetItemName(petId);
        if (nameWithQuotes && nameWithQuotes.length > 4
            && nameWithQuotes[0] == "'" && nameWithQuotes[1] == "'"
            && nameWithQuotes[nameWithQuotes.length - 1] == "'" && nameWithQuotes[nameWithQuotes.length - 2] == "'") {
            return nameWithQuotes.substring(2, nameWithQuotes.length - 2);
        }
        else {
            return nameWithQuotes;
        }
    }
    function _BPetNeedsFood(petItemId) {
        const nPetUpgradeLevel = Number(InventoryAPI.GetItemAttributeValue(petItemId, '{uint32}upgrade level'));
        if (nPetUpgradeLevel < 1)
            return false;
        const rtFoodExp = Number(InventoryAPI.GetItemAttributeValue(petItemId, '{uint32}pet food expiration date'));
        const rtPetUpgr = Number(InventoryAPI.GetItemAttributeValue(petItemId, '{uint32}pet next upgrade date'));
        return !!(rtFoodExp && rtPetUpgr && (rtFoodExp < rtPetUpgr));
    }
    function _ShowFoodHint(elPanel, petItemId) {
        const bLowFood = InventoryAPI.IsPetLowOnFood(petItemId);
        const bNeedsFood = _BPetNeedsFood(petItemId);
        elPanel.SetHasClass('low-food', bLowFood);
        elPanel.SetHasClass('needs-food', bNeedsFood);
        if (!bLowFood && !bNeedsFood)
            return;
        const elWarning = elPanel.FindChildInLayoutFile('id-pet-food-warning');
        const elIcon = elPanel.FindChildInLayoutFile('id-pet-food-warning-icon');
        const elLabel = elPanel.FindChildInLayoutFile('id-pet-food-warning-label');
        elIcon.SetImage(bLowFood ? 'file://{images}/icons/ui/warning.svg' : 'file://{images}/icons/ui/pet_feed.svg');
        const szHint = bLowFood ? '#pet_low_food_hint' : '#pet_needs_food_hint';
        if (InventoryAPI.HasCustomName(petItemId)) {
            elWarning.SetDialogVariable('name', _nameWithQuotes(petItemId));
            elLabel.text = $.Localize(szHint + '_name', elWarning);
            return;
        }
        elLabel.text = $.Localize(szHint);
    }
    function BShouldKeepZoom(petItemIdOnScreen) {
        return SessionUtil.BCanUseMyPetInCurrentLobby() && _m_zoomedPetId === petItemIdOnScreen;
    }
    VanityPetInfo.BShouldKeepZoom = BShouldKeepZoom;
    function SetZoomBtns(elMapPanel, elPanel, petItemId) {
        let elZoomInBtn = elPanel.FindChildInLayoutFile('id-zoom-in-pet');
        elZoomInBtn.SetPanelEvent('onactivate', () => {
            elMapPanel.TransitionToCamera('cam_pet', 1);
            $.DispatchEvent('CSGOPlaySoundEffect', 'Chicken.Vanity.ZoomIn', 'MOUSE');
            elMapPanel.SetParallaxOffset(elMapPanel.Data().parallax_zoomed);
            _m_zoomedPetId = petItemId;
            elPanel.TriggerClass('hide-during-zoom');
            elPanel.SetHasClass('is-zoomed', true);
        });
        let elZoomOutBtn = elPanel.FindChildInLayoutFile('id-zoom-out-pet');
        elZoomOutBtn.SetPanelEvent('onactivate', () => {
            elMapPanel.TransitionToCamera('cam_default', 1);
            $.DispatchEvent('CSGOPlaySoundEffect', 'Chicken.Vanity.ZoomOut', 'MOUSE');
            elMapPanel.SetParallaxOffset(elMapPanel.Data().parallax_unzoomed);
            _m_zoomedPetId = null;
            elPanel.SetHasClass('is-zoomed', false);
            elPanel.TriggerClass('hide-during-zoom');
        });
        elPanel.SetHasClass('is-zoomed', _m_zoomedPetId === petItemId);
    }
    VanityPetInfo.SetZoomBtns = SetZoomBtns;
    function ResetPetZoom(elMapPanel) {
        if (_m_zoomedPetId === null) {
            return;
        }
        elMapPanel.TransitionToCamera('cam_default', 0);
        elMapPanel.SetParallaxOffset(elMapPanel.Data().parallax_unzoomed);
        _m_zoomedPetId = null;
        if (_m_infoPanel && _m_infoPanel.IsValid()) {
            _m_infoPanel.SetHasClass('is-zoomed', false);
        }
    }
    VanityPetInfo.ResetPetZoom = ResetPetZoom;
    function CancelEggTimer() {
        if (_m_scheduleEggTimerHandle) {
            $.CancelScheduled(_m_scheduleEggTimerHandle);
            _m_scheduleEggTimerHandle = null;
        }
    }
    VanityPetInfo.CancelEggTimer = CancelEggTimer;
    function _UpdateProgressBars(nPetUpgradeLevel) {
        function _UpdateProgressMeter(idMeter, nLevelValue, flFillRatio) {
            const elProgress = _m_infoPanel.FindChildInLayoutFile(idMeter);
            const nGrowth = (nPetUpgradeLevel < nLevelValue) ? 0
                : (nPetUpgradeLevel < nLevelValue + 1) ? flFillRatio
                    : 1;
            UpdateRadialProgressBar(elProgress, nGrowth, nPetUpgradeLevel === nLevelValue, nPetUpgradeLevel > nLevelValue);
        }
        _UpdateProgressMeter('id-pet-milestone-egg', 0, InventoryAPI.GetPetGrowthPercent(_m_petId));
        const flLifeStageMeter = 1 - InventoryAPI.GetPetLifetimeRemaining(_m_petId);
        _UpdateProgressMeter('id-pet-milestone-chick', 1, flLifeStageMeter);
        _UpdateProgressMeter('id-pet-milestone-pullet', 2, flLifeStageMeter);
        _UpdateProgressMeter('id-pet-milestone-hen', 3, flLifeStageMeter);
    }
    function UpdateRadialProgressBar(elProgress, nGrowth, IsActive, isComplete) {
        const elRadial = elProgress.FindChild('id-pet-progress-timer');
        if (!nGrowth && nGrowth !== 0) {
            elRadial.style.clip = 'radial(50% 50%, 0deg, 0deg, deg)';
            return;
        }
        const nDegrees = isComplete ? 360 : Math.floor(nGrowth * 360);
        elRadial.style.clip = 'radial(50% 50%, 0deg, ' + nDegrees + 'deg)';
        elProgress.SetHasClass('active', IsActive);
        elProgress.SetHasClass('complete', isComplete);
    }
    function UpdateProgressBar(elProgress, nFeedEarned, IsActive, isComplete) {
        if ((!nFeedEarned && nFeedEarned !== 0))
            return;
        const aPips = elProgress.FindChild('id-pet-progress-bar')?.Children();
        aPips?.forEach((pip, idx) => {
            pip.SetHasClass('filled', ((nFeedEarned >= idx + 1 && IsActive) || isComplete));
        });
        elProgress.SetHasClass('active', IsActive);
        elProgress.SetHasClass('complete', isComplete);
    }
    function _OpenPetBook() {
        UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_pet_book.xml');
    }
    function _OpenPhotoBooth(nPetUpgradeLevel) {
        const OnClosePetEventNotification = UiToolkitAPI.RegisterJSCallback(() => { });
        UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_pet_photobooth.xml', 'action-type=expire'
            + '&' + 'title=' + ''
            + '&' + 'msg=' + ''
            + '&' + 'pet_id=' + _m_petId
            + '&' + 'photo_booth=' + 'true'
            + '&' + 'upgrade_level=' + nPetUpgradeLevel
            + '&' + 'callback=' + OnClosePetEventNotification);
    }
    {
        if ($.DbgIsReloadingScript()) {
        }
    }
})(VanityPetInfo || (VanityPetInfo = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFuaXR5X3BldF9pbmZvLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvdmFuaXR5X3BldF9pbmZvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFDbEMsa0NBQWtDO0FBQ2xDLDhDQUE4QztBQUM5Qyx3Q0FBd0M7QUFDeEMseUNBQXlDO0FBWXpDLElBQVUsYUFBYSxDQThxQnRCO0FBOXFCRCxXQUFVLGFBQWE7SUFHdEIsSUFBSSxjQUFjLEdBQWlCLElBQUksQ0FBQztJQUMzQix5QkFBVyxHQUFHLHNCQUFzQixDQUFDO0lBQ2xELElBQUksWUFBb0IsQ0FBQztJQUN6QixJQUFJLFlBQXdCLENBQUM7SUFFN0IsSUFBSSxRQUFlLENBQUM7SUFDcEIsSUFBSSx5QkFBdUMsQ0FBQztJQUM1QyxJQUFJLG9CQUE2QixDQUFDO0lBQ2xDLElBQUksVUFBVSxHQUFVLEVBQUUsQ0FBQztJQUUzQix5QkFBeUIsR0FBRyxJQUFJLENBQUM7SUFFakMsU0FBZ0IsMEJBQTBCLENBQUcsUUFBaUIsRUFBRSxTQUFpQjtRQUVoRixJQUFJLFFBQVEsR0FBRyxRQUFRLENBQUMscUJBQXFCLENBQUUsY0FBQSxXQUFXLENBQUUsQ0FBQztRQUU3RCxJQUFLLENBQUMsU0FBUyxJQUFJLE1BQU0sQ0FBRSxTQUFTLENBQUUsS0FBSyxDQUFDLEVBQzVDO1lBRUMsV0FBVyxDQUFFLFFBQVEsQ0FBRSxDQUFDO1lBQ3hCLE9BQU8sSUFBSSxDQUFDO1NBQ1o7UUFFRCxJQUFJLENBQUMsUUFBUSxFQUNiO1lBQ0MsUUFBUSxHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxjQUFBLFdBQVcsQ0FBRSxDQUFDO1lBQzNELFFBQVEsQ0FBQyxXQUFXLENBQUUsK0NBQStDLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBRSxDQUFDO1NBQ3RGO1FBRUQsUUFBUSxHQUFHLFNB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