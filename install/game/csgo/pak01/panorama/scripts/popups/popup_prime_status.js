"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../common/prime_button_action.ts" />
var PopupPrimeStatus;
(function (PopupPrimeStatus) {
    let m_btnPurchase = $('#PurchaseButton');
    function Init() {
        _SetStatusPanel(MyPersonaAPI.GetElevatedState());
    }
    PopupPrimeStatus.Init = Init;
    function _SetStatusPanel(strState) {
        if (strState !== "elevated") {
            m_btnPurchase.visible = true;
            PrimeButtonAction.SetUpPurchaseBtn(m_btnPurchase);
            return;
        }
        m_btnPurchase.visible = false;
    }
    function _UpdateEleveatedStatusPanel() {
        _SetStatusPanel(MyPersonaAPI.GetElevatedState());
    }
    $.RegisterForUnhandledEvent("PanoramaComponent_MyPersona_ElevatedStateUpdate", _UpdateEleveatedStatusPanel);
})(PopupPrimeStatus || (PopupPrimeStatus = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfcHJpbWVfc3RhdHVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvcG9wdXBzL3BvcHVwX3ByaW1lX3N0YXR1cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBQ3JDLHlEQUF5RDtBQUV6RCxJQUFVLGdCQUFnQixDQTRCekI7QUE1QkQsV0FBVSxnQkFBZ0I7SUFFekIsSUFBSSxhQUFhLEdBQUcsQ0FBQyxDQUFFLGlCQUFpQixDQUFrQixDQUFDO0lBRTNELFNBQWdCLElBQUk7UUFFbkIsZUFBZSxDQUFFLFlBQVksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFFLENBQUM7SUFDcEQsQ0FBQztJQUhlLHFCQUFJLE9BR25CLENBQUE7SUFFRCxTQUFTLGVBQWUsQ0FBRSxRQUFnQjtRQUV6QyxJQUFLLFFBQVEsS0FBSyxVQUFVLEVBQzVCO1lBQ0MsYUFBYSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDN0IsaUJBQWlCLENBQUMsZ0JBQWdCLENBQUUsYUFBYSxDQUFFLENBQUM7WUFFcEQsT0FBTztTQUNQO1FBRUQsYUFBYSxDQUFDLE9BQU8sR0FBRSxLQUFLLENBQUM7SUFDOUIsQ0FBQztJQUVELFNBQVMsMkJBQTJCO1FBRW5DLGVBQWUsQ0FBRSxZQUFZLENBQUMsZ0JBQWdCLEVBQUUsQ0FBRSxDQUFDO0lBQ3BELENBQUM7SUFFRCxDQUFDLENBQUMseUJBQXlCLENBQUUsaURBQWlELEVBQUUsMkJBQTJCLENBQUUsQ0FBQztBQUMvRyxDQUFDLEVBNUJTLGdCQUFnQixLQUFoQixnQkFBZ0IsUUE0QnpCIn0=