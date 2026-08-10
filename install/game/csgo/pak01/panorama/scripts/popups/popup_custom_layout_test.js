"use strict";
/// <reference path="../csgo.d.ts" />
function SetupPopup() {
    var strPopupValue = $.GetContextPanel().GetAttributeString("popupvalue", "(not found)");
    $.GetContextPanel().SetDialogVariable("popupvalue", strPopupValue);
}
function OnOKPressed() {
    var callbackHandle = $.GetContextPanel().GetAttributeInt("callback", -1);
    if (callbackHandle != -1) {
        UiToolkitAPI.InvokeJSCallback(callbackHandle, 'OK');
    }
    $.DispatchEvent('UIPopupButtonClicked', '');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfY3VzdG9tX2xheW91dF90ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvcG9wdXBzL3BvcHVwX2N1c3RvbV9sYXlvdXRfdGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBRXJDLFNBQVMsVUFBVTtJQUVsQixJQUFJLGFBQWEsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsa0JBQWtCLENBQUUsWUFBWSxFQUFFLGFBQWEsQ0FBRSxDQUFDO0lBQzFGLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBRSxZQUFZLEVBQUUsYUFBYSxDQUFFLENBQUM7QUFDdEUsQ0FBQztBQUVELFNBQVMsV0FBVztJQU1uQixJQUFJLGNBQWMsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsZUFBZSxDQUFFLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBRSxDQUFDO0lBQzNFLElBQUssY0FBYyxJQUFJLENBQUMsQ0FBQyxFQUN6QjtRQUNDLFlBQVksQ0FBQyxnQkFBZ0IsQ0FBRSxjQUFjLEVBQUUsSUFBSSxDQUFFLENBQUM7S0FDdEQ7SUFJRCxDQUFDLENBQUMsYUFBYSxDQUFFLHNCQUFzQixFQUFFLEVBQUUsQ0FBRSxDQUFDO0FBQy9DLENBQUMifQ==