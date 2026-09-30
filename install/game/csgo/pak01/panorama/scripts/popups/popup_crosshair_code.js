"use strict";
/// <reference path="../csgo.d.ts" />
var PopupCrosshairCode;
(function (PopupCrosshairCode) {
    let elTextEntry = $('#Code');
    let elNotFoundLabel = $('#InvalidCode');
    let elApplyCode = $('#ApplyCode');
    function Init() {
        let elYourCodeBtn = $('#Copy');
        let code = MyPersonaAPI.GetCrosshairCode();
        elYourCodeBtn.SetPanelEvent('onmouseover', () => UiToolkitAPI.ShowTextTooltip('Copy', code));
        elYourCodeBtn.SetPanelEvent('onmouseout', () => UiToolkitAPI.HideTextTooltip());
        elYourCodeBtn.SetPanelEvent('onactivate', () => {
            SteamOverlayAPI.CopyTextToClipboard(code);
            UiToolkitAPI.ShowTextTooltip('Copy', 'Copied your code to clipboard');
            elTextEntry.text = code;
        });
        // Set submit button disabled by default.
        elApplyCode.enabled = false;
        // Set found friends messages hiddenby default.
        elNotFoundLabel.visible = false;
    }
    PopupCrosshairCode.Init = Init;
    function ValidateCode() {
        let bCodeValid = MyPersonaAPI.BValidateCrosshairCode(elTextEntry.text);
        elNotFoundLabel.visible = !bCodeValid;
        elApplyCode.enabled = bCodeValid;
        return bCodeValid;
    }
    function OnTextEntryChange() {
        ValidateCode();
    }
    PopupCrosshairCode.OnTextEntryChange = OnTextEntryChange;
    function OnEntrySubmit() {
        let bSuccess = MyPersonaAPI.BApplyCrosshairCode(elTextEntry.text);
        if (bSuccess) {
            $.DispatchEvent('RefreshSettingsPanels');
            $.DispatchEvent('UIPopupButtonClicked', '');
        }
        else {
            ValidateCode();
        }
    }
    PopupCrosshairCode.OnEntrySubmit = OnEntrySubmit;
})(PopupCrosshairCode || (PopupCrosshairCode = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfY3Jvc3NoYWlyX2NvZGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfY3Jvc3NoYWlyX2NvZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUVyQyxJQUFVLGtCQUFrQixDQXFEM0I7QUFyREQsV0FBVSxrQkFBa0I7SUFFM0IsSUFBSSxXQUFXLEdBQUcsQ0FBQyxDQUFFLE9BQU8sQ0FBaUIsQ0FBQztJQUM5QyxJQUFJLGVBQWUsR0FBRyxDQUFDLENBQUUsY0FBYyxDQUFHLENBQUM7SUFDM0MsSUFBSSxXQUFXLEdBQUcsQ0FBQyxDQUFFLFlBQVksQ0FBRyxDQUFDO0lBRXJDLFNBQWdCLElBQUk7UUFFbkIsSUFBSSxhQUFhLEdBQUcsQ0FBQyxDQUFFLE9BQU8sQ0FBa0IsQ0FBQztRQUNqRCxJQUFJLElBQUksR0FBRyxZQUFZLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUUzQyxhQUFhLENBQUMsYUFBYSxDQUFFLGFBQWEsRUFBRSxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFFLE1BQU0sRUFBRSxJQUFJLENBQUUsQ0FBRSxDQUFDO1FBQ2pHLGFBQWEsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxlQUFlLEVBQUUsQ0FBRSxDQUFDO1FBQ2xGLGFBQWEsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLEdBQUcsRUFBRTtZQUUvQyxlQUFlLENBQUMsbUJBQW1CLENBQUUsSUFBSSxDQUFFLENBQUM7WUFDNUMsWUFBWSxDQUFDLGVBQWUsQ0FBRSxNQUFNLEVBQUUsK0JBQStCLENBQUUsQ0FBQztZQUN4RSxXQUFXLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUN6QixDQUFDLENBQUUsQ0FBQztRQUVKLHlDQUF5QztRQUN6QyxXQUFXLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztRQUU1QiwrQ0FBK0M7UUFDL0MsZUFBZSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7SUFDakMsQ0FBQztJQW5CZSx1QkFBSSxPQW1CbkIsQ0FBQTtJQUVELFNBQVMsWUFBWTtRQUVwQixJQUFJLFVBQVUsR0FBRyxZQUFZLENBQUMsc0JBQXNCLENBQUUsV0FBVyxDQUFDLElBQUksQ0FBRSxDQUFDO1FBQ3pFLGVBQWUsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxVQUFVLENBQUM7UUFDdEMsV0FBVyxDQUFDLE9BQU8sR0FBRyxVQUFVLENBQUM7UUFDakMsT0FBTyxVQUFVLENBQUM7SUFDbkIsQ0FBQztJQUVELFNBQWdCLGlCQUFpQjtRQUVoQyxZQUFZLEVBQUUsQ0FBQztJQUNoQixDQUFDO0lBSGUsb0NBQWlCLG9CQUdoQyxDQUFBO0lBRUQsU0FBZ0IsYUFBYTtRQUU1QixJQUFJLFFBQVEsR0FBRyxZQUFZLENBQUMsbUJBQW1CLENBQUUsV0FBVyxDQUFDLElBQUksQ0FBRSxDQUFDO1FBQ3BFLElBQUksUUFBUSxFQUNaO1lBQ0MsQ0FBQyxDQUFDLGFBQWEsQ0FBRSx1QkFBdUIsQ0FBRSxDQUFDO1lBQzNDLENBQUMsQ0FBQyxhQUFhLENBQUUsc0JBQXNCLEVBQUUsRUFBRSxDQUFFLENBQUM7U0FDOUM7YUFFRDtZQUNDLFlBQVksRUFBRSxDQUFDO1NBQ2Y7SUFDRixDQUFDO0lBWmUsZ0NBQWEsZ0JBWTVCLENBQUE7QUFDRixDQUFDLEVBckRTLGtCQUFrQixLQUFsQixrQkFBa0IsUUFxRDNCIn0=