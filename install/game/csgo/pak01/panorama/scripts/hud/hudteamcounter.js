"use strict";
/// <reference path="../csgo.d.ts" />
var HudTeamCounter;
(function (HudTeamCounter) {
    function ShowDamageReport(elTeamCounter, elAvatarPanel) {
        const bannerDelay = 0;
        const delayDelta = 0.1;
        const bFriendlyFire = 1 == elAvatarPanel.GetAttributeInt("friendlyfire", 0);
        const healthRemoved = elAvatarPanel.GetAttributeInt("health_removed", 0);
        const numHits = elAvatarPanel.GetAttributeInt("num_hits", 0);
        const returnHealthRemoved = elAvatarPanel.GetAttributeInt("return_health_removed", 0);
        const returnNumHits = elAvatarPanel.GetAttributeInt("return_num_hits", 0);
        const orderIndex = elAvatarPanel.GetAttributeInt("order_index", 0);
        $.Msg('---------------------SHOW ', orderIndex);
        const elDamageReport = elAvatarPanel.FindChildTraverse('PostRoundDamageReport');
        elDamageReport.SetHasClass('given', healthRemoved > 0);
        elDamageReport.SetHasClass('taken', returnHealthRemoved > 0);
        elDamageReport.SetHasClass('friendlyfire', bFriendlyFire);
        elDamageReport.SetDialogVariableInt("health_removed", healthRemoved);
        elDamageReport.SetDialogVariableInt("num_hits", numHits);
        elDamageReport.SetDialogVariableInt("return_health_removed", returnHealthRemoved);
        elDamageReport.SetDialogVariableInt("return_num_hits", returnNumHits);
        elDamageReport.SwitchClass('advantage', healthRemoved > returnHealthRemoved ? 'won' : 'lost');
        if (healthRemoved > 0 || returnHealthRemoved > 0) {
            $.Schedule(bannerDelay + orderIndex * delayDelta, () => {
                if (!elAvatarPanel || !elAvatarPanel.IsValid())
                    return;
                elAvatarPanel.AddClass('show-prdr');
                $.Msg("PRDR: show-prdr ", elAvatarPanel.id);
            });
        }
    }
    function HideDamageReport() {
        $.GetContextPanel().FindChildrenWithClassTraverse("show-prdr").forEach(el => el.RemoveClass('show-prdr'));
    }
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        $.Msg('---------------------Registered ShowDamageReport ');
        $.RegisterForUnhandledEvent('RevealPostRoundDamageReportPanel', ShowDamageReport);
        $.RegisterForUnhandledEvent('ClearAllPostRoundDamageReportPanels', HideDamageReport);
    }
})(HudTeamCounter || (HudTeamCounter = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHVkdGVhbWNvdW50ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9odWQvaHVkdGVhbWNvdW50ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUVyQyxJQUFVLGNBQWMsQ0F1RHZCO0FBdkRELFdBQVUsY0FBYztJQUV2QixTQUFTLGdCQUFnQixDQUFHLGFBQXNCLEVBQUUsYUFBc0I7UUFFekUsTUFBTSxXQUFXLEdBQUcsQ0FBQyxDQUFDO1FBQ3RCLE1BQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQztRQUN2QixNQUFNLGFBQWEsR0FBRyxDQUFDLElBQUksYUFBYSxDQUFDLGVBQWUsQ0FBRSxjQUFjLEVBQUUsQ0FBQyxDQUFFLENBQUM7UUFDOUUsTUFBTSxhQUFhLEdBQUcsYUFBYSxDQUFDLGVBQWUsQ0FBRSxnQkFBZ0IsRUFBRSxDQUFDLENBQUUsQ0FBQztRQUMzRSxNQUFNLE9BQU8sR0FBRyxhQUFhLENBQUMsZUFBZSxDQUFFLFVBQVUsRUFBRSxDQUFDLENBQUUsQ0FBQztRQUMvRCxNQUFNLG1CQUFtQixHQUFHLGFBQWEsQ0FBQyxlQUFlLENBQUUsdUJBQXVCLEVBQUUsQ0FBQyxDQUFFLENBQUM7UUFDeEYsTUFBTSxhQUFhLEdBQUcsYUFBYSxDQUFDLGVBQWUsQ0FBRSxpQkFBaUIsRUFBRSxDQUFDLENBQUUsQ0FBQztRQUM1RSxNQUFNLFVBQVUsR0FBRyxhQUFhLENBQUMsZUFBZSxDQUFFLGFBQWEsRUFBRSxDQUFDLENBQUUsQ0FBQztRQUVyRSxDQUFDLENBQUMsR0FBRyxDQUFFLDRCQUE0QixFQUFFLFVBQVUsQ0FBRSxDQUFDO1FBRWxELE1BQU0sY0FBYyxHQUFHLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBRSx1QkFBdUIsQ0FBRSxDQUFDO1FBRWxGLGNBQWMsQ0FBQyxXQUFXLENBQUUsT0FBTyxFQUFFLGFBQWEsR0FBRyxDQUFDLENBQUUsQ0FBQztRQUN6RCxjQUFjLENBQUMsV0FBVyxDQUFFLE9BQU8sRUFBRSxtQkFBbUIsR0FBRyxDQUFDLENBQUUsQ0FBQztRQUMvRCxjQUFjLENBQUMsV0FBVyxDQUFFLGNBQWMsRUFBRSxhQUFhLENBQUUsQ0FBQztRQUU1RCxjQUFjLENBQUMsb0JBQW9CLENBQUUsZ0JBQWdCLEVBQUUsYUFBYSxDQUFFLENBQUM7UUFDdkUsY0FBYyxDQUFDLG9CQUFvQixDQUFFLFVBQVUsRUFBRSxPQUFPLENBQUUsQ0FBQztRQUMzRCxjQUFjLENBQUMsb0JBQW9CLENBQUUsdUJBQXVCLEVBQUUsbUJBQW1CLENBQUUsQ0FBQztRQUNwRixjQUFjLENBQUMsb0JBQW9CLENBQUUsaUJBQWlCLEVBQUUsYUFBYSxDQUFFLENBQUM7UUFFeEUsY0FBYyxDQUFDLFdBQVcsQ0FBRSxXQUFXLEVBQUUsYUFBYSxHQUFHLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBRSxDQUFDO1FBRWhHLElBQUssYUFBYSxHQUFHLENBQUMsSUFBSSxtQkFBbUIsR0FBRyxDQUFDLEVBQ2pEO1lBQ0MsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxXQUFXLEdBQUcsVUFBVSxHQUFHLFVBQVUsRUFBRSxHQUFHLEVBQUU7Z0JBRXZELElBQUssQ0FBQyxhQUFhLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFO29CQUM5QyxPQUFPO2dCQUVSLGFBQWEsQ0FBQyxRQUFRLENBQUUsV0FBVyxDQUFFLENBQUM7Z0JBQ3RDLENBQUMsQ0FBQyxHQUFHLENBQUUsa0JBQWtCLEVBQUUsYUFBYSxDQUFDLEVBQUUsQ0FBRSxDQUFDO1lBQy9DLENBQUMsQ0FBRSxDQUFDO1NBQ0o7SUFDRixDQUFDO0lBRUQsU0FBUyxnQkFBZ0I7UUFFeEIsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLDZCQUE2QixDQUFFLFdBQVcsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUUsV0FBVyxDQUFFLENBQUUsQ0FBQztJQUNqSCxDQUFDO0lBRUQsb0dBQW9HO0lBQ3BHLDJDQUEyQztJQUMzQyxvR0FBb0c7SUFDcEc7UUFDQyxDQUFDLENBQUMsR0FBRyxDQUFFLG1EQUFtRCxDQUFFLENBQUM7UUFFN0QsQ0FBQyxDQUFDLHlCQUF5QixDQUFFLGtDQUFrQyxFQUFFLGdCQUFnQixDQUFFLENBQUM7UUFDcEYsQ0FBQyxDQUFDLHlCQUF5QixDQUFFLHFDQUFxQyxFQUFFLGdCQUFnQixDQUFFLENBQUM7S0FDdkY7QUFDRixDQUFDLEVBdkRTLGNBQWMsS0FBZCxjQUFjLFFBdUR2QiJ9