"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/licenseutil.ts" />
var MainMenulicense;
(function (MainMenulicense) {
    const _m_licensePanel = $.GetContextPanel();
    function Init() {
        CheckLicense();
    }
    function CheckLicense() {
        let restrictions = LicenseUtil.GetCurrentLicenseRestrictions();
        if (restrictions) {
            _m_licensePanel.SetDialogVariable('restriction', $.Localize(restrictions.license_msg));
            _m_licensePanel.SetDialogVariable('restriction_act', $.Localize(restrictions.license_act));
        }
        _m_licensePanel.SetHasClass('hidden', !restrictions);
        SetStyleOnRootPanel(restrictions);
    }
    function ActionBuyLicense() {
        let restrictions = LicenseUtil.GetCurrentLicenseRestrictions();
        LicenseUtil.BuyLicenseForRestrictions(restrictions);
    }
    MainMenulicense.ActionBuyLicense = ActionBuyLicense;
    function SetStyleOnRootPanel(restrictions) {
        // Set Style on root panel for not having license
        let elMainMenuInput = _m_licensePanel;
        while (elMainMenuInput) {
            elMainMenuInput = elMainMenuInput.GetParent();
            if (elMainMenuInput.id === 'MainMenuInput')
                break;
        }
        if (elMainMenuInput) {
            elMainMenuInput.SetHasClass('steam-license-restricted', restrictions !== false);
        }
    }
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        Init();
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_GcLogonNotificationReceived', Init);
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_UpdateConnectionToGC', Init);
    }
})(MainMenulicense || (MainMenulicense = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbm1lbnVfbGljZW5zZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL21haW5tZW51X2xpY2Vuc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUNsQyw4Q0FBOEM7QUFFOUMsSUFBVSxlQUFlLENBb0R4QjtBQXBERCxXQUFVLGVBQWU7SUFFeEIsTUFBTSxlQUFlLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBRTVDLFNBQVMsSUFBSTtRQUVaLFlBQVksRUFBRSxDQUFDO0lBQ2hCLENBQUM7SUFFRCxTQUFTLFlBQVk7UUFFcEIsSUFBSSxZQUFZLEdBQUcsV0FBVyxDQUFDLDZCQUE2QixFQUFFLENBQUM7UUFFL0QsSUFBSyxZQUFZLEVBQ2pCO1lBQ0MsZUFBZSxDQUFDLGlCQUFpQixDQUFFLGFBQWEsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFFLFlBQVksQ0FBQyxXQUFXLENBQUUsQ0FBQyxDQUFDO1lBQzFGLGVBQWUsQ0FBQyxpQkFBaUIsQ0FBRSxpQkFBaUIsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFFLFlBQVksQ0FBQyxXQUFXLENBQUUsQ0FBRSxDQUFDO1NBRS9GO1FBQ0QsZUFBZSxDQUFDLFdBQVcsQ0FBRSxRQUFRLEVBQUUsQ0FBQyxZQUFZLENBQUUsQ0FBQztRQUN2RCxtQkFBbUIsQ0FBRSxZQUFZLENBQUUsQ0FBQztJQUNyQyxDQUFDO0lBRUQsU0FBZ0IsZ0JBQWdCO1FBRS9CLElBQUksWUFBWSxHQUFHLFdBQVcsQ0FBQyw2QkFBNkIsRUFBRSxDQUFDO1FBQy9ELFdBQVcsQ0FBQyx5QkFBeUIsQ0FBRSxZQUFZLENBQUUsQ0FBQztJQUN2RCxDQUFDO0lBSmUsZ0NBQWdCLG1CQUkvQixDQUFBO0lBRUQsU0FBUyxtQkFBbUIsQ0FBRSxZQUEyQztRQUV4RSxpREFBaUQ7UUFDakQsSUFBSSxlQUFlLEdBQUcsZUFBZSxDQUFDO1FBQ3RDLE9BQVEsZUFBZSxFQUFHO1lBQ3pCLGVBQWUsR0FBRyxlQUFlLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDOUMsSUFBSyxlQUFlLENBQUMsRUFBRSxLQUFLLGVBQWU7Z0JBQzFDLE1BQU07U0FDUDtRQUNELElBQUssZUFBZSxFQUNwQjtZQUNDLGVBQWUsQ0FBQyxXQUFXLENBQUUsMEJBQTBCLEVBQUUsWUFBWSxLQUFLLEtBQUssQ0FBRSxDQUFDO1NBQ2xGO0lBQ0YsQ0FBQztJQUVELG9HQUFvRztJQUNwRywyQ0FBMkM7SUFDM0Msb0dBQW9HO0lBQ3BHO1FBQ0MsSUFBSSxFQUFFLENBQUM7UUFDUCxDQUFDLENBQUMseUJBQXlCLENBQUUseURBQXlELEVBQUUsSUFBSSxDQUFFLENBQUM7UUFDL0YsQ0FBQyxDQUFDLHlCQUF5QixDQUFFLGtEQUFrRCxFQUFFLElBQUksQ0FBRSxDQUFDO0tBQ3hGO0FBQ0YsQ0FBQyxFQXBEUyxlQUFlLEtBQWYsZUFBZSxRQW9EeEIifQ==