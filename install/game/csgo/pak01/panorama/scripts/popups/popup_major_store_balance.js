"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../generated/items_event_current_generated_store.d.ts" />
/// <reference path="../generated/items_event_current_generated_store.ts" />
var PopupMajorStoreBalance;
(function (PopupMajorStoreBalance) {
    const _m_cp = $.GetContextPanel();
    let _m_callbackHandle = -1;
    function Init() {
        const eventId = g_ActiveTournamentInfo.eventid;
        _m_callbackHandle = _m_cp.GetAttributeInt('callback', -1);
        _m_cp.SetDialogVariableInt('balance', _m_cp.GetAttributeInt('balance', 0));
        _m_cp.SetDialogVariable('tournament_name', $.Localize('#CSGO_Tournament_Event_NameShort_' + eventId));
        _m_cp.FindChildInLayoutFile('id-major-store-balance-logo').SetImage('file://{images}/tournaments/backgrounds/pickem_mainmenu_promo_' + eventId + '.psd');
        _m_cp.FindChildInLayoutFile('id-major-store-balance-banner').style.backgroundImage = "url( 'file://{images}/tournaments/backgrounds/pickem_bg_" + eventId + ".psd')";
    }
    PopupMajorStoreBalance.Init = Init;
    function OpenMajorHub() {
        Close();
        UiToolkitAPI.ShowCustomLayoutPopupParameters('id-popup-major-hub', 'file://{resources}/layout/popups/popup_major_hub.xml', 'eventid=' + g_ActiveTournamentInfo.eventid);
    }
    PopupMajorStoreBalance.OpenMajorHub = OpenMajorHub;
    function Close() {
        if (_m_callbackHandle != -1) {
            UiToolkitAPI.InvokeJSCallback(_m_callbackHandle);
            _m_callbackHandle = -1;
        }
        $.DispatchEvent('UIPopupButtonClicked', '');
    }
    PopupMajorStoreBalance.Close = Close;
})(PopupMajorStoreBalance || (PopupMajorStoreBalance = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfbWFqb3Jfc3RvcmVfYmFsYW5jZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3BvcHVwcy9wb3B1cF9tYWpvcl9zdG9yZV9iYWxhbmNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFDckMsOEVBQThFO0FBQzlFLDRFQUE0RTtBQUU1RSxJQUFVLHNCQUFzQixDQXlDL0I7QUF6Q0QsV0FBVSxzQkFBc0I7SUFFL0IsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBQ2xDLElBQUksaUJBQWlCLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFFM0IsU0FBZ0IsSUFBSTtRQUVuQixNQUFNLE9BQU8sR0FBRyxzQkFBc0IsQ0FBQyxPQUFPLENBQUM7UUFDL0MsaUJBQWlCLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUUsQ0FBQztRQUU1RCxLQUFLLENBQUMsb0JBQW9CLENBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxlQUFlLENBQUUsU0FBUyxFQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7UUFDL0UsS0FBSyxDQUFDLGlCQUFpQixDQUFFLGlCQUFpQixFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUUsbUNBQW1DLEdBQUcsT0FBTyxDQUFFLENBQUUsQ0FBQztRQUV4RyxLQUFLLENBQUMscUJBQXFCLENBQUUsNkJBQTZCLENBQWUsQ0FBQyxRQUFRLENBQUUsZ0VBQWdFLEdBQUcsT0FBTyxHQUFHLE1BQU0sQ0FBRSxDQUFDO1FBRzVLLEtBQUssQ0FBQyxxQkFBcUIsQ0FBRSwrQkFBK0IsQ0FBRSxDQUFDLEtBQUssQ0FBQyxlQUFlLEdBQUcsMERBQTBELEdBQUcsT0FBTyxHQUFHLFFBQVEsQ0FBQztJQUN4SyxDQUFDO0lBWmUsMkJBQUksT0FZbkIsQ0FBQTtJQUVELFNBQWdCLFlBQVk7UUFFM0IsS0FBSyxFQUFFLENBQUM7UUFFUixZQUFZLENBQUMsK0JBQStCLENBQzNDLG9CQUFvQixFQUNwQixzREFBc0QsRUFDdEQsVUFBVSxHQUFHLHNCQUFzQixDQUFDLE9BQU8sQ0FDM0MsQ0FBQztJQUNILENBQUM7SUFUZSxtQ0FBWSxlQVMzQixDQUFBO0lBRUQsU0FBZ0IsS0FBSztRQUdwQixJQUFLLGlCQUFpQixJQUFJLENBQUMsQ0FBQyxFQUM1QjtZQUNDLFlBQVksQ0FBQyxnQkFBZ0IsQ0FBRSxpQkFBaUIsQ0FBRSxDQUFDO1lBQ25ELGlCQUFpQixHQUFHLENBQUMsQ0FBQyxDQUFDO1NBQ3ZCO1FBRUQsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxzQkFBc0IsRUFBRSxFQUFFLENBQUUsQ0FBQztJQUMvQyxDQUFDO0lBVmUsNEJBQUssUUFVcEIsQ0FBQTtBQUNGLENBQUMsRUF6Q1Msc0JBQXNCLEtBQXRCLHNCQUFzQixRQXlDL0IifQ==