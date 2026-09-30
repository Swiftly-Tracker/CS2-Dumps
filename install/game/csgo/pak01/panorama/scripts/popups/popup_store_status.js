"use strict";
/// <reference path="..\csgo.d.ts" />
var PopupStoreStatus;
(function (PopupStoreStatus) {
    let _strStoreStatusOkCmd = null;
    let _strStoreProceedAfterCheckoutConfirmation = "StoreProceedAfterCheckoutConfirmation";
    function SetupPopup() {
        let ctx = $.GetContextPanel();
        let strMsg = ctx.GetAttributeString('text', '');
        let strClose = ctx.GetAttributeString('close', '0');
        let strCancel = ctx.GetAttributeString('cancel', '0');
        _strStoreStatusOkCmd = ctx.GetAttributeString('okcmd', '');
        ctx.SetDialogVariable("message", $.Localize(strMsg));
        let bClose = !!parseInt(strClose);
        let bCancel = !!parseInt(strCancel);
        // scaleform used these arguments in a weird way, just emulate that.
        if (!bClose && !bCancel) {
            // no cancel button
            $('#CancelButton').visible = false;
        }
        if (bCancel) {
            // no ok button
            $('#OkButton').visible = false;
        }
        // Special logic for purchase confirmation button to appear with the total purchase price
        let bPurchaseConfirmation = _strStoreStatusOkCmd.startsWith(_strStoreProceedAfterCheckoutConfirmation);
        let elPurchaseConfirmation = $('#PurchaseConfirmation');
        elPurchaseConfirmation.visible = bPurchaseConfirmation;
        let sPurchaseConfirmation = bPurchaseConfirmation ? _strStoreStatusOkCmd.slice(1 + _strStoreProceedAfterCheckoutConfirmation.length) : '';
        elPurchaseConfirmation.text = sPurchaseConfirmation ? sPurchaseConfirmation : $.Localize('#SFUI_MBox_OKButton');
        if (bCancel && !bClose && !bPurchaseConfirmation) {
            // spinner visible
            $("#Spinner").AddClass("SpinnerVisible");
        }
    }
    PopupStoreStatus.SetupPopup = SetupPopup;
    function OnOKPressed() {
        if (_strStoreStatusOkCmd) {
            if (_strStoreStatusOkCmd.startsWith(_strStoreProceedAfterCheckoutConfirmation))
                StoreAPI.StoreProceedAfterCheckoutConfirmation();
            else
                GameInterfaceAPI.ConsoleCommand(_strStoreStatusOkCmd);
        }
        _strStoreStatusOkCmd = null;
        // Close popup
        $.DispatchEvent('UIPopupButtonClicked', '');
    }
    PopupStoreStatus.OnOKPressed = OnOKPressed;
})(PopupStoreStatus || (PopupStoreStatus = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfc3RvcmVfc3RhdHVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvcG9wdXBzL3BvcHVwX3N0b3JlX3N0YXR1cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBRXJDLElBQVUsZ0JBQWdCLENBNkR6QjtBQTdERCxXQUFVLGdCQUFnQjtJQUV6QixJQUFJLG9CQUFvQixHQUFrQixJQUFJLENBQUM7SUFDL0MsSUFBSSx5Q0FBeUMsR0FBRyx1Q0FBdUMsQ0FBQztJQUV4RixTQUFnQixVQUFVO1FBRXpCLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUU5QixJQUFJLE1BQU0sR0FBRyxHQUFHLENBQUMsa0JBQWtCLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ2hELElBQUksUUFBUSxHQUFHLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDcEQsSUFBSSxTQUFTLEdBQUcsR0FBRyxDQUFDLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUN0RCxvQkFBb0IsR0FBRyxHQUFHLENBQUMsa0JBQWtCLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRTNELEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBRXJELElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDbEMsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUVwQyxvRUFBb0U7UUFFcEUsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLE9BQU8sRUFDdkI7WUFDQyxtQkFBbUI7WUFDbkIsQ0FBQyxDQUFDLGVBQWUsQ0FBRSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7U0FDcEM7UUFFRCxJQUFLLE9BQU8sRUFDWjtZQUNDLGVBQWU7WUFDZixDQUFDLENBQUMsV0FBVyxDQUFFLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztTQUNoQztRQUVELHlGQUF5RjtRQUN6RixJQUFJLHFCQUFxQixHQUFHLG9CQUFvQixDQUFDLFVBQVUsQ0FBRSx5Q0FBeUMsQ0FBRSxDQUFDO1FBQ3pHLElBQUksc0JBQXNCLEdBQUcsQ0FBQyxDQUFDLHVCQUF1QixDQUFpQixDQUFDO1FBQ3hFLHNCQUFzQixDQUFDLE9BQU8sR0FBRyxxQkFBcUIsQ0FBQztRQUN2RCxJQUFJLHFCQUFxQixHQUFHLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUUsQ0FBQyxHQUFHLHlDQUF5QyxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDNUksc0JBQXNCLENBQUMsSUFBSSxHQUFHLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxxQkFBcUIsQ0FBRSxDQUFDO1FBRWxILElBQUssT0FBTyxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMscUJBQXFCLEVBQ2pEO1lBQ0Msa0JBQWtCO1lBQ2xCLENBQUMsQ0FBQyxVQUFVLENBQUUsQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztTQUMxQztJQUNGLENBQUM7SUF4Q2UsMkJBQVUsYUF3Q3pCLENBQUE7SUFFRCxTQUFnQixXQUFXO1FBRTFCLElBQUssb0JBQW9CLEVBQ3pCO1lBQ0MsSUFBSyxvQkFBb0IsQ0FBQyxVQUFVLENBQUUseUNBQXlDLENBQUU7Z0JBQ2hGLFFBQVEsQ0FBQyxxQ0FBcUMsRUFBRSxDQUFDOztnQkFFakQsZ0JBQWdCLENBQUMsY0FBYyxDQUFDLG9CQUFvQixDQUFDLENBQUM7U0FDdkQ7UUFDRCxvQkFBb0IsR0FBRyxJQUFJLENBQUM7UUFFNUIsY0FBYztRQUNkLENBQUMsQ0FBQyxhQUFhLENBQUUsc0JBQXNCLEVBQUUsRUFBRSxDQUFFLENBQUM7SUFDL0MsQ0FBQztJQWJlLDRCQUFXLGNBYTFCLENBQUE7QUFDRixDQUFDLEVBN0RTLGdCQUFnQixLQUFoQixnQkFBZ0IsUUE2RHpCIn0=