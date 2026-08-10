"use strict";
/// <reference path="..\csgo.d.ts" />
var PopupReportPlayer;
(function (PopupReportPlayer) {
    function Init() {
        let xuid = $.GetContextPanel().GetAttributeString("xuid", "");
        $.GetContextPanel().SetDialogVariable("target_player", GameStateAPI.GetPlayerName(xuid));
        $.GetContextPanel().FindChildInLayoutFile("id-report").Children().forEach(el => {
            let category = el.GetAttributeString("data-category", "");
            el.enabled = GameStateAPI.IsReportCategoryEnabledForSelectedPlayer(xuid, category);
        });
    }
    PopupReportPlayer.Init = Init;
    function Submit() {
        let categories = "";
        $.GetContextPanel().FindChildInLayoutFile("id-report").Children().forEach(el => {
            if (el.checked)
                categories += el.GetAttributeString("data-category", "") + ",";
        });
        let xuid = $.GetContextPanel().GetAttributeString("xuid", "");
        GameStateAPI.SubmitPlayerReport(xuid, categories);
        $.DispatchEvent('UIPopupButtonClicked', '');
    }
    PopupReportPlayer.Submit = Submit;
})(PopupReportPlayer || (PopupReportPlayer = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfcmVwb3J0X3BsYXllci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3BvcHVwcy9wb3B1cF9yZXBvcnRfcGxheWVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFFckMsSUFBVSxpQkFBaUIsQ0FrQzFCO0FBbENELFdBQVUsaUJBQWlCO0lBRTFCLFNBQWdCLElBQUk7UUFFbkIsSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGtCQUFrQixDQUFFLE1BQU0sRUFBRSxFQUFFLENBQUUsQ0FBQztRQUVoRSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsaUJBQWlCLENBQUUsZUFBZSxFQUFFLFlBQVksQ0FBQyxhQUFhLENBQUUsSUFBSSxDQUFFLENBQUMsQ0FBQztRQUc1RixDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUUsV0FBVyxDQUFFLENBQUMsUUFBUSxFQUFFLENBQUMsT0FBTyxDQUFFLEVBQUUsQ0FBQyxFQUFFO1lBRWpGLElBQUksUUFBUSxHQUFHLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxlQUFlLEVBQUUsRUFBRSxDQUFFLENBQUM7WUFFNUQsRUFBRSxDQUFDLE9BQU8sR0FBRyxZQUFZLENBQUMsd0NBQXdDLENBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBRSxDQUFDO1FBQ3RGLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQWJlLHNCQUFJLE9BYW5CLENBQUE7SUFFRCxTQUFnQixNQUFNO1FBRXJCLElBQUksVUFBVSxHQUFHLEVBQUUsQ0FBQztRQUdwQixDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUUsV0FBVyxDQUFFLENBQUMsUUFBUSxFQUFFLENBQUMsT0FBTyxDQUFFLEVBQUUsQ0FBQyxFQUFFO1lBRWpGLElBQUssRUFBRSxDQUFDLE9BQU87Z0JBQ2QsVUFBVSxJQUFJLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxlQUFlLEVBQUUsRUFBRSxDQUFFLEdBQUcsR0FBRyxDQUFDO1FBQ25FLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGtCQUFrQixDQUFFLE1BQU0sRUFBRSxFQUFFLENBQUUsQ0FBQztRQUVoRSxZQUFZLENBQUMsa0JBQWtCLENBQUUsSUFBSSxFQUFFLFVBQVUsQ0FBRSxDQUFDO1FBRXBELENBQUMsQ0FBQyxhQUFhLENBQUUsc0JBQXNCLEVBQUUsRUFBRSxDQUFFLENBQUM7SUFDL0MsQ0FBQztJQWhCZSx3QkFBTSxTQWdCckIsQ0FBQTtBQUNGLENBQUMsRUFsQ1MsaUJBQWlCLEtBQWpCLGlCQUFpQixRQWtDMUIifQ==