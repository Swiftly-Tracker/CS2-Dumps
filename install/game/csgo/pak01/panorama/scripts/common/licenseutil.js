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
            case "free_sc":
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
            UiToolkitAPI.ShowGenericPopupYesNo($.Localize(restrictions.license_act), $.Localize(restrictions.license_msg), '', () => BuyLicenseForRestrictions(restrictions), () => { });
        }
    }
    LicenseUtil.ShowLicenseRestrictions = ShowLicenseRestrictions;
})(LicenseUtil || (LicenseUtil = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGljZW5zZXV0aWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9jb21tb24vbGljZW5zZXV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQVVyQyxJQUFVLFdBQVcsQ0E0RHBCO0FBNURELFdBQVUsV0FBVztJQUVwQixTQUFnQiw2QkFBNkI7UUFFNUMsSUFBSSxZQUFZLEdBQUcsb0JBQW9CLENBQUM7UUFDeEMsSUFBSSxhQUFhLEdBQUcsMENBQTBDLENBQUM7UUFDL0QsUUFBUyxZQUFZLENBQUMsY0FBYyxFQUFFLEVBQ3RDO1lBQ0EsS0FBSyxrQkFBa0I7Z0JBQ3RCLFlBQVksR0FBRyxzQkFBc0IsQ0FBQztnQkFDdEMsYUFBYSxHQUFHLGdEQUFnRCxDQUFDO2dCQUNqRSxNQUFNO1lBQ1AsS0FBSyxxQkFBcUI7Z0JBQ3pCLGFBQWEsR0FBRyx3Q0FBd0MsQ0FBQztnQkFDekQsTUFBTTtZQUNQLEtBQUssU0FBUztnQkFDYixhQUFhLEdBQUcsNkNBQTZDLENBQUM7Z0JBQzlELE1BQU07WUFDUCxLQUFLLFNBQVM7Z0JBQ2IsYUFBYSxHQUFHLDZDQUE2QyxDQUFDO2dCQUM5RCxZQUFZLEdBQUcseUJBQXlCLENBQUM7Z0JBQ3pDLE1BQU07WUFDUCxLQUFLLFdBQVc7Z0JBQ2YsT0FBTyxLQUFLLENBQUM7U0FDYjtRQUVELE9BQU87WUFDTixXQUFXLEVBQUcsYUFBYTtZQUMzQixXQUFXLEVBQUcsWUFBWTtTQUMxQixDQUFDO0lBQ0gsQ0FBQztJQTVCZSx5Q0FBNkIsZ0NBNEI1QyxDQUFBO0lBRUQsU0FBZ0IseUJBQXlCLENBQUUsWUFBMkM7UUFFckYsSUFBSyxZQUFZLElBQUksWUFBWSxDQUFDLFdBQVcsS0FBSyx5QkFBeUIsRUFBRztZQUM3RSxZQUFZLENBQUMsK0JBQStCLENBQzNDLEVBQUUsRUFDRiw2REFBNkQsRUFDN0QsZ0NBQWdDO2dCQUNoQyxHQUFHLEdBQUcsV0FBVyxDQUNqQixDQUFDO1NBQ0Y7YUFBTTtZQUNOLFlBQVksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1NBQ2hDO0lBQ0YsQ0FBQztJQVplLHFDQUF5Qiw0QkFZeEMsQ0FBQTtJQUVELFNBQWdCLHVCQUF1QixDQUFFLFlBQTJDO1FBRW5GLElBQUssWUFBWSxLQUFLLEtBQUssRUFDM0I7WUFFQyxZQUFZLENBQUMscUJBQXFCLENBQ2pDLENBQUMsQ0FBQyxRQUFRLENBQUUsWUFBWSxDQUFDLFdBQVcsQ0FBRSxFQUN0QyxDQUFDLENBQUMsUUFBUSxDQUFFLFlBQVksQ0FBQyxXQUFXLENBQUUsRUFDdEMsRUFBRSxFQUNGLEdBQUcsRUFBRSxDQUFDLHlCQUF5QixDQUFFLFlBQVksQ0FBRSxFQUMvQyxHQUFHLEVBQUUsR0FBRSxDQUFDLENBQ1IsQ0FBQztTQUNGO0lBQ0YsQ0FBQztJQWJlLG1DQUF1QiwwQkFhdEMsQ0FBQTtBQUNGLENBQUMsRUE1RFMsV0FBVyxLQUFYLFdBQVcsUUE0RHBCIn0=