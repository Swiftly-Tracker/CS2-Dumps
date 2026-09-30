"use strict";
/// <reference path="../csgo.d.ts" />
function SetupPopup() {
    var strPopupValue = $.GetContextPanel().GetAttributeString("popupvalue", "(not found)");
    $.GetContextPanel().SetDialogVariable("popupvalue", strPopupValue);
}
function OnOKPressed() {
    // Run some js code
    $.Msg('OnComplexPressed: Running from \'popup custom layout\'\n');
    // Invoke callback set up in the parent panel (if set)
    var callbackHandle = $.GetContextPanel().GetAttributeInt("callback", -1);
    if (callbackHandle != -1) {
        UiToolkitAPI.InvokeJSCallback(callbackHandle, 'OK');
    }
    // Do not forget to dispatch the UIPopupButtonClicked() panorama event
    // responsible for closing the popup
    $.DispatchEvent('UIPopupButtonClicked', '');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfY3VzdG9tX2xheW91dF90ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvcG9wdXBzL3BvcHVwX2N1c3RvbV9sYXlvdXRfdGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBRXJDLFNBQVMsVUFBVTtJQUVsQixJQUFJLGFBQWEsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsa0JBQWtCLENBQUUsWUFBWSxFQUFFLGFBQWEsQ0FBRSxDQUFDO0lBQzFGLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBRSxZQUFZLEVBQUUsYUFBYSxDQUFFLENBQUM7QUFDdEUsQ0FBQztBQUVELFNBQVMsV0FBVztJQUVuQixtQkFBbUI7SUFDbkIsQ0FBQyxDQUFDLEdBQUcsQ0FBQywwREFBMEQsQ0FBQyxDQUFDO0lBRWxFLHNEQUFzRDtJQUN0RCxJQUFJLGNBQWMsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsZUFBZSxDQUFFLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBRSxDQUFDO0lBQzNFLElBQUssY0FBYyxJQUFJLENBQUMsQ0FBQyxFQUN6QjtRQUNDLFlBQVksQ0FBQyxnQkFBZ0IsQ0FBRSxjQUFjLEVBQUUsSUFBSSxDQUFFLENBQUM7S0FDdEQ7SUFFRCxzRUFBc0U7SUFDdEUsb0NBQW9DO0lBQ3BDLENBQUMsQ0FBQyxhQUFhLENBQUUsc0JBQXNCLEVBQUUsRUFBRSxDQUFFLENBQUM7QUFDL0MsQ0FBQyJ9