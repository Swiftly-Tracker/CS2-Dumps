"use strict";
/// <reference path="..\csgo.d.ts" />
var PopupLicenseRegister;
(function (PopupLicenseRegister) {
    let m_LicenseRegisterTimer = null;
    function SetupPopup() {
        let spinnerVisible = $.GetContextPanel().GetAttributeInt("spinner", 0);
        $("#Spinner").SetHasClass("SpinnerVisible", !!spinnerVisible);
        m_LicenseRegisterTimer = $.Schedule(11, PanelTimedOut);
        $.Schedule(1, () => { MyPersonaAPI.ActionStartAgreementSessionInGame(); });
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_StartAgreementSessionInGame', StartAgreementSessionInGame);
    }
    PopupLicenseRegister.SetupPopup = SetupPopup;
    function PanelTimedOut() {
        m_LicenseRegisterTimer = null;
        $.DispatchEvent('UIPopupButtonClicked', '');
        UiToolkitAPI.ShowGenericPopupOk($.Localize('#SFUI_SteamConnectionErrorTitle'), $.Localize('#SFUI_Steam_Error_LinkUnexpected'), '', () => { });
    }
    function _CancelLicenseRegisterTimer() {
        if (m_LicenseRegisterTimer) {
            $.CancelScheduled(m_LicenseRegisterTimer);
            m_LicenseRegisterTimer = null;
        }
    }
    function StartAgreementSessionInGame(url) {
        _CancelLicenseRegisterTimer();
        $.DispatchEvent('UIPopupButtonClicked', '');
        SteamOverlayAPI.OpenURL('!' + url);
    }
})(PopupLicenseRegister || (PopupLicenseRegister = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfbGljZW5zZV9yZWdpc3Rlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3BvcHVwcy9wb3B1cF9saWNlbnNlX3JlZ2lzdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFFckMsSUFBVSxvQkFBb0IsQ0E2QzdCO0FBN0NELFdBQVUsb0JBQW9CO0lBRTdCLElBQUksc0JBQXNCLEdBQWtCLElBQUksQ0FBQztJQUVqRCxTQUFnQixVQUFVO1FBR3pCLElBQUksY0FBYyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxlQUFlLENBQUUsU0FBUyxFQUFFLENBQUMsQ0FBRSxDQUFDO1FBQ3pFLENBQUMsQ0FBRSxVQUFVLENBQUcsQ0FBQyxXQUFXLENBQUUsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDLGNBQWMsQ0FBRSxDQUFDO1FBRW5FLHNCQUFzQixHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUUsRUFBRSxFQUFFLGFBQWEsQ0FBRSxDQUFDO1FBQ3pELENBQUMsQ0FBQyxRQUFRLENBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLFlBQVksQ0FBQyxpQ0FBaUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFFLENBQUM7UUFFN0UsQ0FBQyxDQUFDLHlCQUF5QixDQUFFLHlEQUF5RCxFQUFFLDJCQUEyQixDQUFFLENBQUM7SUFDdkgsQ0FBQztJQVZlLCtCQUFVLGFBVXpCLENBQUE7SUFFRCxTQUFTLGFBQWE7UUFHckIsc0JBQXNCLEdBQUcsSUFBSSxDQUFDO1FBQzlCLENBQUMsQ0FBQyxhQUFhLENBQUUsc0JBQXNCLEVBQUUsRUFBRSxDQUFFLENBQUM7UUFFOUMsWUFBWSxDQUFDLGtCQUFrQixDQUM5QixDQUFDLENBQUMsUUFBUSxDQUFFLGlDQUFpQyxDQUFFLEVBQy9DLENBQUMsQ0FBQyxRQUFRLENBQUUsa0NBQWtDLENBQUUsRUFDaEQsRUFBRSxFQUNGLEdBQUcsRUFBRSxHQUFFLENBQUMsQ0FDUixDQUFDO0lBQ0gsQ0FBQztJQUVELFNBQVMsMkJBQTJCO1FBRW5DLElBQUssc0JBQXNCLEVBQzNCO1lBQ0MsQ0FBQyxDQUFDLGVBQWUsQ0FBRSxzQkFBc0IsQ0FBRSxDQUFDO1lBQzVDLHNCQUFzQixHQUFHLElBQUksQ0FBQztTQUM5QjtJQUNGLENBQUM7SUFFRCxTQUFTLDJCQUEyQixDQUFFLEdBQVc7UUFFaEQsMkJBQTJCLEVBQUUsQ0FBQztRQUM5QixDQUFDLENBQUMsYUFBYSxDQUFFLHNCQUFzQixFQUFFLEVBQUUsQ0FBRSxDQUFDO1FBQzlDLGVBQWUsQ0FBQyxPQUFPLENBQUUsR0FBRyxHQUFHLEdBQUcsQ0FBRSxDQUFDO0lBQ3RDLENBQUM7QUFDRixDQUFDLEVBN0NTLG9CQUFvQixLQUFwQixvQkFBb0IsUUE2QzdCIn0=