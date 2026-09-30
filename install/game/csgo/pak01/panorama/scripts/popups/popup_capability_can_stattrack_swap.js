"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../inspect.ts" />
/// <reference path="popup_inspect_shared.ts" />
var CapabilityCanStatTrackSwap;
(function (CapabilityCanStatTrackSwap) {
    function Init() {
        const itemids = [
            InspectShared.GetPopupSetting('item_id'),
            InspectShared.GetPopupSetting('stattrak_swap_second_item_id')
        ];
        const contextPanel = $.GetContextPanel();
        contextPanel.Data().statNumbersOriginal = [0, 0]; // array of original StatTrak values on the counters
        contextPanel.Data().distanceLerped = 9999999;
        contextPanel.Data().flLerpProgress = 0.0;
        contextPanel.Data().scheduleHandle = null;
        itemids.forEach((item, idx) => {
            contextPanel.Data().statNumbersOriginal[idx] = parseInt(String(InventoryAPI.GetItemAttributeValue(item, "kill eater")));
            _SetItemModel(itemids[idx], idx);
        });
        _SetUpButtonStates();
        $.DispatchEvent('CapabilityPopupIsOpen', true);
        contextPanel.Data().scheduleHandle = $.Schedule(0.01, () => _LerpTimer(contextPanel));
    }
    CapabilityCanStatTrackSwap.Init = Init;
    function _SetItemModel(itemId, idx) {
        let elPanel = $.GetContextPanel().FindChildInLayoutFile('StatTrackSwapItemModel' + idx);
        InspectModelImage.Init(elPanel, itemId);
        elPanel.AddClass('darken');
        // HACK: We don't want this for stat trak swap, but this is the only splitscreen situation we have... just remove default classes here for now
        elPanel.RemoveClass('full-width');
        elPanel.RemoveClass('full-height');
    }
    function _SetUpButtonStates() {
        const contextPanel = $.GetContextPanel();
        contextPanel.FindChildInLayoutFile('StatTrackSwapAcceptConfirm').SetPanelEvent('onactivate', () => _OnAccept(contextPanel));
        contextPanel.FindChildInLayoutFile('StatTrackSwapCancelBtn').SetPanelEvent('onactivate', ClosePopup);
    }
    function _LerpTimer(contextPanel) {
        contextPanel.Data().scheduleHandle = null;
        let originalLen = contextPanel.Data().statNumbersOriginal[1] - contextPanel.Data().statNumbersOriginal[0];
        let newDistanceLerped = (contextPanel.Data().flLerpProgress < 1.0) ? Math.round(contextPanel.Data().flLerpProgress * originalLen) : originalLen;
        if (newDistanceLerped != contextPanel.Data().distanceLerped) {
            contextPanel.Data().distanceLerped = newDistanceLerped;
            $.DispatchEvent('CSGOPlaySoundEffectMuteBypass', 'popup_accept_match_waitquiet', 'MOUSE', 1.0);
            let elSwapNumber0 = contextPanel.FindChildInLayoutFile('StatTrackSwapNumber0');
            let elSwapNumber1 = contextPanel.FindChildInLayoutFile('StatTrackSwapNumber1');
            elSwapNumber0.text = (contextPanel.Data().statNumbersOriginal[0] + contextPanel.Data().distanceLerped).toString().padStart(6, "0");
            elSwapNumber1.text = (contextPanel.Data().statNumbersOriginal[1] - contextPanel.Data().distanceLerped).toString().padStart(6, "0");
        }
        if (contextPanel.Data().flLerpProgress < 1.0) {
            contextPanel.Data().flLerpProgress += 0.01;
            contextPanel.Data().scheduleHandle = $.Schedule(0.04, () => _LerpTimer(contextPanel));
        }
        else {
            // TODO: maybe play animation on the accept button here?
        }
    }
    function _OnAccept(contextPanel) {
        if (contextPanel.Data().scheduleHandle) {
            $.CancelScheduled(contextPanel.Data().scheduleHandle);
            contextPanel.Data().flLerpProgress = 1.0;
            _LerpTimer(contextPanel); // do the last lerp
        }
        contextPanel.FindChildInLayoutFile('NameableSpinner').RemoveClass('hidden');
        contextPanel.Data().scheduleHandle = $.Schedule(5, () => _CancelWaitforCallBack(contextPanel));
        InventoryAPI.SetStatTrakSwapToolItems(InspectShared.GetPopupSetting('item_id', contextPanel), InspectShared.GetPopupSetting('stattrak_swap_second_item_id', contextPanel));
        const toolId = InspectShared.GetPopupSetting('tool_id', contextPanel);
        InventoryAPI.UseTool(toolId, '');
    }
    function ClosePopup() {
        $.DispatchEvent('HideSelectItemForCapabilityPopup');
        $.DispatchEvent('UIPopupButtonClicked', '');
        $.DispatchEvent('CapabilityPopupIsOpen', false);
    }
    CapabilityCanStatTrackSwap.ClosePopup = ClosePopup;
    function _CancelWaitforCallBack(contextPanel) {
        let elSpinner = contextPanel.FindChildInLayoutFile('NameableSpinner');
        elSpinner.AddClass('hidden');
        ClosePopup();
        UiToolkitAPI.ShowGenericPopupOk($.Localize('#SFUI_SteamConnectionErrorTitle'), $.Localize('#SFUI_InvError_Item_Not_Given'), '', () => { });
    }
    function _OnItemCustomization(numericType, type, itemid) {
        const contextPanel = $.GetContextPanel();
        if (contextPanel.Data().scheduleHandle) {
            $.CancelScheduled(contextPanel.Data().scheduleHandle);
            contextPanel.Data().scheduleHandle = null;
        }
        ClosePopup();
        $.DispatchEvent('ShowAcknowledgePopup', type, itemid);
    }
    $.RegisterForUnhandledEvent('PanoramaComponent_Inventory_ItemCustomizationNotification', _OnItemCustomization);
})(CapabilityCanStatTrackSwap || (CapabilityCanStatTrackSwap = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfY2FwYWJpbGl0eV9jYW5fc3RhdHRyYWNrX3N3YXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfY2FwYWJpbGl0eV9jYW5fc3RhdHRyYWNrX3N3YXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyxzQ0FBc0M7QUFDdEMsZ0RBQWdEO0FBRWhELElBQVUsMEJBQTBCLENBb0luQztBQXBJRCxXQUFVLDBCQUEwQjtJQUVuQyxTQUFnQixJQUFJO1FBRW5CLE1BQU0sT0FBTyxHQUFHO1lBQ2YsYUFBYSxDQUFDLGVBQWUsQ0FBRSxTQUFTLENBQVk7WUFDcEQsYUFBYSxDQUFDLGVBQWUsQ0FBRSw4QkFBOEIsQ0FBWTtTQUN6RSxDQUFDO1FBRUYsTUFBTSxZQUFZLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBRXpDLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxtQkFBbUIsR0FBRyxDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQyxDQUFDLG9EQUFvRDtRQUN4RyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUMsY0FBYyxHQUFHLE9BQU8sQ0FBQztRQUM3QyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUMsY0FBYyxHQUFHLEdBQUcsQ0FBQztRQUN6QyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztRQUUxQyxPQUFPLENBQUMsT0FBTyxDQUFFLENBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRyxFQUFFO1lBRWhDLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsR0FBRyxRQUFRLENBQUUsTUFBTSxDQUFFLFlBQVksQ0FBQyxxQkFBcUIsQ0FBRSxJQUFJLEVBQUUsWUFBWSxDQUFFLENBQUUsQ0FBRSxDQUFDO1lBQzlILGFBQWEsQ0FBRSxP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