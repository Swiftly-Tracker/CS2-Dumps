"use strict";
/// <reference path="..\csgo.d.ts" />
var PopupLicenseRegister;
(function (PopupLicenseRegister) {
    let m_LicenseRegisterTimer = null;
    function SetupPopup() {
        // Set spinner visibility
        let spinnerVisible = $.GetContextPanel().GetAttributeInt("spinner", 0);
        $("#Spinner").SetHasClass("SpinnerVisible", !!spinnerVisible);
        m_LicenseRegisterTimer = $.Schedule(11, PanelTimedOut);
        $.Schedule(1, () => { MyPersonaAPI.ActionStartAgreementSessionInGame(); });
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_StartAgreementSessionInGame', StartAgreementSessionInGame);
    }
    PopupLicenseRegister.SetupPopup = SetupPopup;
    function PanelTimedOut() {
        // We did not hearback from the GC
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
        SteamOverlayAPI.OpenURL('!' + url); // Modal URL in overlay
    }
})(PopupLicenseRegister || (PopupLicenseRegister = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfbGljZW5zZV9yZWdpc3Rlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3BvcHVwcy9wb3B1cF9saWNlbnNlX3JlZ2lzdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFFckMsSUFBVSxvQkFBb0IsQ0E2QzdCO0FBN0NELFdBQVUsb0JBQW9CO0lBRTdCLElBQUksc0JBQXNCLEdBQWtCLElBQUksQ0FBQztJQUVqRCxTQUFnQixVQUFVO1FBRXpCLHlCQUF5QjtRQUN6QixJQUFJLGNBQWMsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsZUFBZSxDQUFFLFNBQVMsRUFBRSxDQUFDLENBQUUsQ0FBQztRQUN6RSxDQUFDLENBQUUsVUFBVSxDQUFHLENBQUMsV0FBVyxDQUFFLGdCQUFnQixFQUFFLENBQUMsQ0FBQyxjQUFjLENBQUUsQ0FBQztRQUVuRSxzQkFBc0IsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFFLEVBQUUsRUFBRSxhQUFhLENBQUUsQ0FBQztRQUN6RCxDQUFDLENBQUMsUUFBUSxDQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxZQUFZLENBQUMsaUNBQWlDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDO1FBRTdFLENBQUMsQ0FBQyx5QkFBeUIsQ0FBRSx5REFBeUQsRUFBRSwyQkFBMkIsQ0FBRSxDQUFDO0lBQ3ZILENBQUM7SUFWZSwrQkFBVSxhQVV6QixDQUFBO0lBRUQsU0FBUyxhQUFhO1FBRXJCLGtDQUFrQztRQUNsQyxzQkFBc0IsR0FBRyxJQUFJLENBQUM7UUFDOUIsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxzQkFBc0IsRUFBRSxFQUFFLENBQUUsQ0FBQztRQUU5QyxZQUFZLENBQUMsa0JBQWtCLENBQzlCLENBQUMsQ0FBQyxRQUFRLENBQUUsaUNBQWlDLENBQUUsRUFDL0MsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxrQ0FBa0MsQ0FBRSxFQUNoRCxFQUFFLEVBQ0YsR0FBRyxFQUFFLEdBQUUsQ0FBQyxDQUNSLENBQUM7SUFDSCxDQUFDO0lBRUQsU0FBUywyQkFBMkI7UUFFbkMsSUFBSyxzQkFBc0IsRUFDM0I7WUFDQyxDQUFDLENBQUMsZUFBZSxDQUFFLHNCQUFzQixDQUFFLENBQUM7WUFDNUMsc0JBQXNCLEdBQUcsSUFBSSxDQUFDO1NBQzlCO0lBQ0YsQ0FBQztJQUVELFNBQVMsMkJBQTJCLENBQUUsR0FBVztRQUVoRCwyQkFBMkIsRUFBRSxDQUFDO1FBQzlCLENBQUMsQ0FBQyxhQUFhLENBQUUsc0JBQXNCLEVBQUUsRUFBRSxDQUFFLENBQUM7UUFDOUMsZUFBZSxDQUFDLE9BQU8sQ0FBRSxHQUFHLEdBQUcsR0FBRyxDQUFFLENBQUMsQ0FBQyx1QkFBdUI7SUFDOUQsQ0FBQztBQUNGLENBQUMsRUE3Q1Msb0JBQW9CLEtBQXBCLG9CQUFvQixRQTZDN0IifQ==