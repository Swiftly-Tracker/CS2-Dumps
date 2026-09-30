"use strict";
/// <reference path="../csgo.d.ts" />
var LicenseUtil;
(function (LicenseUtil) {
    function GetCurrentLicenseRestrictions() {
        let szButtonText = "#Store_Get_License";
        let szMessageText = "#SFUI_LoginLicenseAssist_NoOnlineLicense";
        switch (MyPersonaAPI.GetLicenseType()) {
            case "free_pw_needlink":
                szButtonText = "#Store_Link_Accounts";
                szMessageText = "#SFUI_LoginLicenseAssist_PW_NeedToLinkAccounts";
                break;
            case "free_pw_needupgrade":
                szMessageText = "#SFUI_LoginLicenseAssist_HasLicense_PW";
                break;
            case "free_pw":
                szMessageText = "#SFUI_LoginLicenseAssist_NoOnlineLicense_PW";
                break;
            case "free_sc": // Running under Steam China, but need to complete China SSA registration
                szMessageText = "#SFUI_LoginLicenseAssist_NoOnlineLicense_SC";
                szButtonText = "#Store_Register_License";
                break;
            case "purchased":
                return false;
        }
        return {
            license_msg: szMessageText,
            license_act: szButtonText
        };
    }
    LicenseUtil.GetCurrentLicenseRestrictions = GetCurrentLicenseRestrictions;
    function BuyLicenseForRestrictions(restrictions) {
        if (restrictions && restrictions.license_act === "#Store_Register_License") {
            UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_license_register.xml', 'message=Store_Register_License' +
                '&' + 'spinner=1');
        }
        else {
            MyPersonaAPI.ActionBuyLicense();
        }
    }
    LicenseUtil.BuyLicenseForRestrictions = BuyLicenseForRestrictions;
    function ShowLicenseRestrictions(restrictions) {
        if (restrictions !== false) {
            // Need to sell user a license
            UiToolkitAPI.ShowGenericPopupYesNo($.Localize(restrictions.license_act), $.Localize(restrictions.license_msg), '', () => BuyLicenseForRestrictions(restrictions), () => { });
        }
    }
    LicenseUtil.ShowLicenseRestrictions = ShowLicenseRestrictions;
})(LicenseUtil || (LicenseUtil = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGljZW5zZXV0aWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9jb21tb24vbGljZW5zZXV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQVVyQyxJQUFVLFdBQVcsQ0E0RHBCO0FBNURELFdBQVUsV0FBVztJQUVwQixTQUFnQiw2QkFBNkI7UUFFNUMsSUFBSSxZQUFZLEdBQUcsb0JBQW9CLENBQUM7UUFDeEMsSUFBSSxhQUFhLEdBQUcsMENBQTBDLENBQUM7UUFDL0QsUUFBUyxZQUFZLENBQUMsY0FBYyxFQUFFLEVBQ3RDO1lBQ0EsS0FBSyxrQkFBa0I7Z0JBQ3RCLFlBQVksR0FBRyxzQkFBc0IsQ0FBQztnQkFDdEMsYUFBYSxHQUFHLGdEQUFnRCxDQUFDO2dCQUNqRSxNQUFNO1lBQ1AsS0FBSyxxQkFBcUI7Z0JBQ3pCLGFBQWEsR0FBRyx3Q0FBd0MsQ0FBQztnQkFDekQsTUFBTTtZQUNQLEtBQUssU0FBUztnQkFDYixhQUFhLEdBQUcsNkNBQTZDLENBQUM7Z0JBQzlELE1BQU07WUFDUCxLQUFLLFNBQVMsRUFBRSx5RUFBeUU7Z0JBQ3hGLGFBQWEsR0FBRyw2Q0FBNkMsQ0FBQztnQkFDOUQsWUFBWSxHQUFHLHlCQUF5QixDQUFDO2dCQUN6QyxNQUFNO1lBQ1AsS0FBSyxXQUFXO2dCQUNmLE9BQU8sS0FBSyxDQUFDO1NBQ2I7UUFFRCxPQUFPO1lBQ04sV0FBVyxFQUFHLGFBQWE7WUFDM0IsV0FBVyxFQUFHLFlBQVk7U0FDMUIsQ0FBQztJQUNILENBQUM7SUE1QmUseUNBQTZCLGdDQTRCNUMsQ0FBQTtJQUVELFNBQWdCLHlCQUF5QixDQUFFLFlBQTJDO1FBRXJGLElBQUssWUFBWSxJQUFJLFlBQVksQ0FBQyxXQUFXLEtBQUsseUJBQXlCLEVBQUc7WUFDN0UsWUFBWSxDQUFDLCtCQUErQixDQUMzQyxFQUFFLEVBQ0YsNkRBQTZELEVBQzdELGdDQUFnQztnQkFDaEMsR0FBRyxHQUFHLFdBQVcsQ0FDakIsQ0FBQztTQUNGO2FBQU07WUFDTixZQUFZLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztTQUNoQztJQUNGLENBQUM7SUFaZSxxQ0FBeUIsNEJBWXhDLENBQUE7SUFFRCxTQUFnQix1QkFBdUIsQ0FBRSxZQUEyQztRQUVuRixJQUFLLFlBQVksS0FBSyxLQUFLLEVBQzNCO1lBQ0MsOEJBQThCO1lBQzlCLFlBQVksQ0FBQyxxQkFBcUIsQ0FDakMsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxZQUFZLENBQUMsV0FBVyxDQUFFLEVBQ3RDLENBQUMsQ0FBQyxRQUFRLENBQUUsWUFBWSxDQUFDLFdBQVcsQ0FBRSxFQUN0QyxFQUFFLEVBQ0YsR0FBRyxFQUFFLENBQUMseUJBQXlCLENBQUUsWUFBWSxDQUFFLEVBQy9DLEdBQUcsRUFBRSxHQUFFLENBQUMsQ0FDUixDQUFDO1NBQ0Y7SUFDRixDQUFDO0lBYmUsbUNBQXVCLDBCQWF0QyxDQUFBO0FBQ0YsQ0FBQyxFQTVEUyxXQUFXLEtBQVgsV0FBVyxRQTREcEIifQ==