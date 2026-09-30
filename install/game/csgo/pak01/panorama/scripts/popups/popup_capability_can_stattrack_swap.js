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
        contextPanel.Data().statNumbersOriginal = [0, 0];
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
        }
    }
    function _OnAccept(contextPanel) {
        if (contextPanel.Data().scheduleHandle) {
            $.CancelScheduled(contextPanel.Data().scheduleHandle);
            contextPanel.Data().flLerpProgress = 1.0;
            _LerpTimer(contextPanel);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfY2FwYWJpbGl0eV9jYW5fc3RhdHRyYWNrX3N3YXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfY2FwYWJpbGl0eV9jYW5fc3RhdHRyYWNrX3N3YXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyxzQ0FBc0M7QUFDdEMsZ0RBQWdEO0FBRWhELElBQVUsMEJBQTBCLENBb0luQztBQXBJRCxXQUFVLDBCQUEwQjtJQUVuQyxTQUFnQixJQUFJO1FBRW5CLE1BQU0sT0FBTyxHQUFHO1lBQ2YsYUFBYSxDQUFDLGVBQWUsQ0FBRSxTQUFTLENBQVk7WUFDcEQsYUFBYSxDQUFDLGVBQWUsQ0FBRSw4QkFBOEIsQ0FBWTtTQUN6RSxDQUFDO1FBRUYsTUFBTSxZQUFZLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBRXpDLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxtQkFBbUIsR0FBRyxDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztRQUNuRCxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUMsY0FBYyxHQUFHLE9BQU8sQ0FBQztRQUM3QyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUMsY0FBYyxHQUFHLEdBQUcsQ0FBQztRQUN6QyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztRQUUxQyxPQUFPLENBQUMsT0FBTyxDQUFFLENBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRyxFQUFFO1lBRWhDLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsR0FBRyxRQUFRLENBQUUsTUFBTSxDQUFFLFlBQVksQ0FBQyxxQkFBcUIsQ0FBRSxJQUFJLEVBQUUsWUFBWSxDQUFFLENBQUUsQ0FBRSxDQUFDO1lBQzlILGFBQWEsQ0FBRSxPQUFPLENBQUMsR0FB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