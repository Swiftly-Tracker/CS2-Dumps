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
        if (!bClose && !bCancel) {
            $('#CancelButton').visible = false;
        }
        if (bCancel) {
            $('#OkButton').visible = false;
        }
        let bPurchaseConfirmation = _strStoreStatusOkCmd.startsWith(_strStoreProceedAfterCheckoutConfirmation);
        let elPurchaseConfirmation = $('#PurchaseConfirmation');
        elPurchaseConfirmation.visible = bPurchaseConfirmation;
        let sPurchaseConfirmation = bPurchaseConfirmation ? _strStoreStatusOkCmd.slice(1 + _strStoreProceedAfterCheckoutConfirmation.length) : '';
        elPurchaseConfirmation.text = sPurchaseConfirmation ? sPurchaseConfirmation : $.Localize('#SFUI_MBox_OKButton');
        if (bCancel && !bClose && !bPurchaseConfirmation) {
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
        $.DispatchEvent('UIPopupButtonClicked', '');
    }
    PopupStoreStatus.OnOKPressed = OnOKPressed;
})(PopupStoreStatus || (PopupStoreStatus = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfc3RvcmVfc3RhdHVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvcG9wdXBzL3BvcHVwX3N0b3JlX3N0YXR1cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBRXJDLElBQVUsZ0JBQWdCLENBNkR6QjtBQTdERCxXQUFVLGdCQUFnQjtJQUV6QixJQUFJLG9CQUFvQixHQUFrQixJQUFJLENBQUM7SUFDL0MsSUFBSSx5Q0FBeUMsR0FBRyx1Q0FBdUMsQ0FBQztJQUV4RixTQUFnQixVQUFVO1FBRXpCLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUU5QixJQUFJLE1BQU0sR0FBRyxHQUFHLENBQUMsa0JBQWtCLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ2hELElBQUksUUFBUSxHQUFHLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDcEQsSUFBSSxTQUFTLEdBQUcsR0FBRyxDQUFDLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUN0RCxvQkFBb0IsR0FBRyxHQUFHLENBQUMsa0JBQWtCLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRTNELEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBRXJELElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDbEMsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUlwQyxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsT0FBTyxFQUN2QjtZQUVDLENBQUMsQ0FBQyxlQUFlLENBQUUsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1NBQ3BDO1FBRUQsSUFBSyxPQUFPLEVBQ1o7WUFFQyxDQUFDLENBQUMsV0FBVyxDQUFFLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztTQUNoQztRQUdELElBQUkscUJBQXFCLEdBQUcsb0JBQW9CLENBQUMsVUFBVSxDQUFFLHlDQUF5QyxDQUFFLENBQUM7UUFDekcsSUFBSSxzQkFBc0IsR0FBRyxDQUFDLENBQUMsdUJBQXVCLENBQWlCLENBQUM7UUFDeEUsc0JBQXNCLENBQUMsT0FBTyxHQUFHLHFCQUFxQixDQUFDO1FBQ3ZELElBQUkscUJBQXFCLEdBQUcscUJBQXFCLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBRSxDQUFDLEdBQUcseUNBQXlDLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUM1SSxzQkFBc0IsQ0FBQyxJQUFJLEdBQUcscUJBQXFCLENBQUMsQ0FBQyxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFFLHFCQUFxQixDQUFFLENBQUM7UUFFbEgsSUFBSyxPQUFPLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxxQkFBcUIsRUFDakQ7WUFFQyxDQUFDLENBQUMsVUFBVSxDQUFFLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLENBQUM7U0FDMUM7SUFDRixDQUFDO0lBeENlLDJCQUFVLGFBd0N6QixDQUFBO0lBRUQsU0FBZ0IsV0FBVztRQUUxQixJQUFLLG9CQUFvQixFQUN6QjtZQUNDLElBQUssb0JBQW9CLENBQUMsVUFBVSxDQUFFLHlDQUF5QyxDQUFFO2dCQUNoRixRQUFRLENBQUMscUNBQXFDLEVBQUUsQ0FBQzs7Z0JBRWpELGdCQUFnQixDQUFDLGNBQWMsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1NBQ3ZEO1FBQ0Qsb0JBQW9CLEdBQUcsSUFBSSxDQUFDO1FBRzVCLENBQUMsQ0FBQyxhQUFhLENBQUUsc0JBQXNCLEVBQUUsRUFBRSxDQUFFLENBQUM7SUFDL0MsQ0FBQztJQWJlLDRCQUFXLGNBYTFCLENBQUE7QUFDRixDQUFDLEVBN0RTLGdCQUFnQixLQUFoQixnQkFBZ0IsUUE2RHpCIn0=