"use strict";
/// <reference path="..\csgo.d.ts" />
var PopupReportServer;
(function (PopupReportServer) {
    function Init() {
        $.GetContextPanel().SetDialogVariable("server_name", GameStateAPI.GetServerName());
        UpdateSubmitButton();
    }
    PopupReportServer.Init = Init;
    function Submit() {
        let categories = "";
        $.GetContextPanel().FindChildInLayoutFile("id-report").Children().forEach(el => {
            if (el.checked)
                categories += el.GetAttributeString("data-category", "") + ",";
        });
        GameStateAPI.SubmitServerReport(categories);
        $.DispatchEvent('UIPopupButtonClicked', '');
    }
    PopupReportServer.Submit = Submit;
    function UpdateSubmitButton() {
        let bCanSubmit = $.GetContextPanel().FindChildInLayoutFile("id-report").Children().some(function (el) {
            return el.checked;
        });
        $.GetContextPanel().FindChildInLayoutFile("SubmitButton").enabled = bCanSubmit;
    }
    PopupReportServer.UpdateSubmitButton = UpdateSubmitButton;
})(PopupReportServer || (PopupReportServer = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfcmVwb3J0X3NlcnZlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3BvcHVwcy9wb3B1cF9yZXBvcnRfc2VydmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFFckMsSUFBVSxpQkFBaUIsQ0FpQzFCO0FBakNELFdBQVUsaUJBQWlCO0lBRTFCLFNBQWdCLElBQUk7UUFFbkIsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGlCQUFpQixDQUFFLGFBQWEsRUFBRSxZQUFZLENBQUMsYUFBYSxFQUFFLENBQUUsQ0FBQztRQUNyRixrQkFBa0IsRUFBRSxDQUFDO0lBQ3RCLENBQUM7SUFKZSxzQkFBSSxPQUluQixDQUFBO0lBRUQsU0FBZ0IsTUFBTTtRQUVyQixJQUFJLFVBQVUsR0FBRyxFQUFFLENBQUM7UUFHcEIsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLFdBQVcsQ0FBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLE9BQU8sQ0FBRSxFQUFFLENBQUMsRUFBRTtZQUVqRixJQUFLLEVBQUUsQ0FBQyxPQUFPO2dCQUNkLFVBQVUsSUFBSSxFQUFFLENBQUMsa0JBQWtCLENBQUUsZUFBZSxFQUFFLEVBQUUsQ0FBRSxHQUFHLEdBQUcsQ0FBQztRQUNuRSxDQUFDLENBQUMsQ0FBQztRQUVILFlBQVksQ0FBQyxrQkFBa0IsQ0FBRSxVQUFVLENBQUUsQ0FBQztRQUU5QyxDQUFDLENBQUMsYUFBYSxDQUFFLHNCQUFzQixFQUFFLEVBQUUsQ0FBRSxDQUFDO0lBQy9DLENBQUM7SUFkZSx3QkFBTSxTQWNyQixDQUFBO0lBRUQsU0FBZ0Isa0JBQWtCO1FBRWpDLElBQUksVUFBVSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxXQUFXLENBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxJQUFJLENBQUUsVUFBVyxFQUFFO1lBRXZHLE9BQU8sRUFBRSxDQUFDLE9BQU8sQ0FBQztRQUNuQixDQUFDLENBQUUsQ0FBQztRQUVKLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxjQUFjLENBQUUsQ0FBQyxPQUFPLEdBQUcsVUFBVSxDQUFDO0lBQ2xGLENBQUM7SUFSZSxvQ0FBa0IscUJBUWpDLENBQUE7QUFDRixDQUFDLEVBakNTLGlCQUFpQixLQUFqQixpQkFBaUIsUUFpQzFCIn0=