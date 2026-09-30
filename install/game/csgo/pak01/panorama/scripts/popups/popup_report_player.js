"use strict";
/// <reference path="..\csgo.d.ts" />
var PopupReportPlayer;
(function (PopupReportPlayer) {
    function Init() {
        let xuid = $.GetContextPanel().GetAttributeString("xuid", "");
        $.GetContextPanel().SetDialogVariable("target_player", GameStateAPI.GetPlayerName(xuid));
        // for each toggle button, check if we can report target player
        $.GetContextPanel().FindChildInLayoutFile("id-report").Children().forEach(el => {
            let category = el.GetAttributeString("data-category", "");
            el.enabled = GameStateAPI.IsReportCategoryEnabledForSelectedPlayer(xuid, category);
        });
    }
    PopupReportPlayer.Init = Init;
    function Submit() {
        let categories = "";
        // for each checked toggle button, add to categories
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfcmVwb3J0X3BsYXllci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3BvcHVwcy9wb3B1cF9yZXBvcnRfcGxheWVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFFckMsSUFBVSxpQkFBaUIsQ0FrQzFCO0FBbENELFdBQVUsaUJBQWlCO0lBRTFCLFNBQWdCLElBQUk7UUFFbkIsSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGtCQUFrQixDQUFFLE1BQU0sRUFBRSxFQUFFLENBQUUsQ0FBQztRQUVoRSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsaUJBQWlCLENBQUUsZUFBZSxFQUFFLFlBQVksQ0FBQyxhQUFhLENBQUUsSUFBSSxDQUFFLENBQUMsQ0FBQztRQUU1RiwrREFBK0Q7UUFDL0QsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLFdBQVcsQ0FBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLE9BQU8sQ0FBRSxFQUFFLENBQUMsRUFBRTtZQUVqRixJQUFJLFFBQVEsR0FBRyxFQUFFLENBQUMsa0JBQWtCLENBQUUsZUFBZSxFQUFFLEVBQUUsQ0FBRSxDQUFDO1lBRTVELEVBQUUsQ0FBQyxPQUFPLEdBQUcsWUFBWSxDQUFDLHdDQUF3QyxDQUFFLElBQUksRUFBRSxRQUFRLENBQUUsQ0FBQztRQUN0RixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUM7SUFiZSxzQkFBSSxPQWFuQixDQUFBO0lBRUQsU0FBZ0IsTUFBTTtRQUVyQixJQUFJLFVBQVUsR0FBRyxFQUFFLENBQUM7UUFFcEIsb0RBQW9EO1FBQ3BELENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxXQUFXLENBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxPQUFPLENBQUUsRUFBRSxDQUFDLEVBQUU7WUFFakYsSUFBSyxFQUFFLENBQUMsT0FBTztnQkFDZCxVQUFVLElBQUksRUFBRSxDQUFDLGtCQUFrQixDQUFFLGVBQWUsRUFBRSxFQUFFLENBQUUsR0FBRyxHQUFHLENBQUM7UUFDbkUsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLElBQUksR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsa0JBQWtCLENBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBRSxDQUFDO1FBRWhFLFlBQVksQ0FBQyxrQkFBa0IsQ0FBRSxJQUFJLEVBQUUsVUFBVSxDQUFFLENBQUM7UUFFcEQsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxzQkFBc0IsRUFBRSxFQUFFLENBQUUsQ0FBQztJQUMvQyxDQUFDO0lBaEJlLHdCQUFNLFNBZ0JyQixDQUFBO0FBQ0YsQ0FBQyxFQWxDUyxpQkFBaUIsS0FBakIsaUJBQWlCLFFBa0MxQiJ9