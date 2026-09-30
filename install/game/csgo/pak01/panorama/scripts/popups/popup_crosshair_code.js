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
        elApplyCode.enabled = false;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfY3Jvc3NoYWlyX2NvZGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfY3Jvc3NoYWlyX2NvZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUVyQyxJQUFVLGtCQUFrQixDQXFEM0I7QUFyREQsV0FBVSxrQkFBa0I7SUFFM0IsSUFBSSxXQUFXLEdBQUcsQ0FBQyxDQUFFLE9BQU8sQ0FBaUIsQ0FBQztJQUM5QyxJQUFJLGVBQWUsR0FBRyxDQUFDLENBQUUsY0FBYyxDQUFHLENBQUM7SUFDM0MsSUFBSSxXQUFXLEdBQUcsQ0FBQyxDQUFFLFlBQVksQ0FBRyxDQUFDO0lBRXJDLFNBQWdCLElBQUk7UUFFbkIsSUFBSSxhQUFhLEdBQUcsQ0FBQyxDQUFFLE9BQU8sQ0FBa0IsQ0FBQztRQUNqRCxJQUFJLElBQUksR0FBRyxZQUFZLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUUzQyxhQUFhLENBQUMsYUFBYSxDQUFFLGFBQWEsRUFBRSxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFFLE1BQU0sRUFBRSxJQUFJLENBQUUsQ0FBRSxDQUFDO1FBQ2pHLGFBQWEsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxlQUFlLEVBQUUsQ0FBRSxDQUFDO1FBQ2xGLGFBQWEsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLEdBQUcsRUFBRTtZQUUvQyxlQUFlLENBQUMsbUJBQW1CLENBQUUsSUFBSSxDQUFFLENBQUM7WUFDNUMsWUFBWSxDQUFDLGVBQWUsQ0FBRSxNQUFNLEVBQUUsK0JBQStCLENBQUUsQ0FBQztZQUN4RSxXQUFXLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUN6QixDQUFDLENBQUUsQ0FBQztRQUdKLFdBQVcsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1FBRzVCLGVBQWUsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO0lBQ2pDLENBQUM7SUFuQmUsdUJBQUksT0FtQm5CLENBQUE7SUFFRCxTQUFTLFlBQVk7UUFFcEIsSUFBSSxVQUFVLEdBQUcsWUFBWSxDQUFDLHNCQUFzQixDQUFFLFdBQVcsQ0FBQyxJQUFJLENBQUUsQ0FBQztRQUN6RSxlQUFlLENBQUMsT0FBTyxHQUFHLENBQUMsVUFBVSxDQUFDO1FBQ3RDLFdBQVcsQ0FBQyxPQUFPLEdBQUcsVUFBVSxDQUFDO1FBQ2pDLE9BQU8sVUFBVSxDQUFDO0lBQ25CLENBQUM7SUFFRCxTQUFnQixpQkFBaUI7UUFFaEMsWUFBWSxFQUFFLENBQUM7SUFDaEIsQ0FBQztJQUhlLG9DQUFpQixvQkFHaEMsQ0FBQTtJQUVELFNBQWdCLGFBQWE7UUFFNUIsSUFBSSxRQUFRLEdBQUcsWUFBWSxDQUFDLG1CQUFtQixDQUFFLFdBQVcsQ0FBQyxJQUFJLENBQUUsQ0FBQztRQUNwRSxJQUFJLFFBQVEsRUFDWjtZQUNDLENBQUMsQ0FBQyxhQUFhLENBQUUsdUJBQXVCLENBQUUsQ0FBQztZQUMzQyxDQUFDLENBQUMsYUFBYSxDQUFFLHNCQUFzQixFQUFFLEVBQUUsQ0FBRSxDQUFDO1NBQzlDO2FBRUQ7WUFDQyxZQUFZLEVBQUUsQ0FBQztTQUNmO0lBQ0YsQ0FBQztJQVplLGdDQUFhLGdCQVk1QixDQUFBO0FBQ0YsQ0FBQyxFQXJEUyxrQkFBa0IsS0FBbEIsa0JBQWtCLFFBcUQzQiJ9