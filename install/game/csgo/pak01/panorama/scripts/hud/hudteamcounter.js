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
            });
        }
    }
    function HideDamageReport() {
        $.GetContextPanel().FindChildrenWithClassTraverse("show-prdr").forEach(el => el.RemoveClass('show-prdr'));
    }
    {
        $.RegisterForUnhandledEvent('RevealPostRoundDamageReportPanel', ShowDamageReport);
        $.RegisterForUnhandledEvent('ClearAllPostRoundDamageReportPanels', HideDamageReport);
    }
})(HudTeamCounter || (HudTeamCounter = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHVkdGVhbWNvdW50ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9odWQvaHVkdGVhbWNvdW50ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUVyQyxJQUFVLGNBQWMsQ0F1RHZCO0FBdkRELFdBQVUsY0FBYztJQUV2QixTQUFTLGdCQUFnQixDQUFHLGFBQXNCLEVBQUUsYUFBc0I7UUFFekUsTUFBTSxXQUFXLEdBQUcsQ0FBQyxDQUFDO1FBQ3RCLE1BQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQztRQUN2QixNQUFNLGFBQWEsR0FBRyxDQUFDLElBQUksYUFBYSxDQUFDLGVBQWUsQ0FBRSxjQUFjLEVBQUUsQ0FBQyxDQUFFLENBQUM7UUFDOUUsTUFBTSxhQUFhLEdBQUcsYUFBYSxDQUFDLGVBQWUsQ0FBRSxnQkFBZ0IsRUFBRSxDQUFDLENBQUUsQ0FBQztRQUMzRSxNQUFNLE9BQU8sR0FBRyxhQUFhLENBQUMsZUFBZSxDQUFFLFVBQVUsRUFBRSxDQUFDLENBQUUsQ0FBQztRQUMvRCxNQUFNLG1CQUFtQixHQUFHLGFBQWEsQ0FBQyxlQUFlLENBQUUsdUJBQXVCLEVBQUUsQ0FBQyxDQUFFLENBQUM7UUFDeEYsTUFBTSxhQUFhLEdBQUcsYUFBYSxDQUFDLGVBQWUsQ0FBRSxpQkFBaUIsRUFBRSxDQUFDLENBQUUsQ0FBQztRQUM1RSxNQUFNLFVBQVUsR0FBRyxhQUFhLENBQUMsZUFBZSxDQUFFLGFBQWEsRUFBRSxDQUFDLENBQUUsQ0FBQztRQUlyRSxNQUFNLGNBQWMsR0FBRyxhQUFhLENBQUMsaUJBQWlCLENBQUUsdUJBQXVCLENBQUUsQ0FBQztRQUVsRixjQUFjLENBQUMsV0FBVyxDQUFFLE9BQU8sRUFBRSxhQUFhLEdBQUcsQ0FBQyxDQUFFLENBQUM7UUFDekQsY0FBYyxDQUFDLFdBQVcsQ0FBRSxPQUFPLEVBQUUsbUJBQW1CLEdBQUcsQ0FBQyxDQUFFLENBQUM7UUFDL0QsY0FBYyxDQUFDLFdBQVcsQ0FBRSxjQUFjLEVBQUUsYUFBYSxDQUFFLENBQUM7UUFFNUQsY0FBYyxDQUFDLG9CQUFvQixDQUFFLGdCQUFnQixFQUFFLGFBQWEsQ0FBRSxDQUFDO1FBQ3ZFLGNBQWMsQ0FBQyxvQkFBb0IsQ0FBRSxVQUFVLEVBQUUsT0FBTyxDQUFFLENBQUM7UUFDM0QsY0FBYyxDQUFDLG9CQUFvQixDQUFFLHVCQUF1QixFQUFFLG1CQUFtQixDQUFFLENBQUM7UUFDcEYsY0FBYyxDQUFDLG9CQUFvQixDQUFFLGlCQUFpQixFQUFFLGFBQWEsQ0FBRSxDQUFDO1FBRXhFLGNBQWMsQ0FBQyxXQUFXLENBQUUsV0FBVyxFQUFFLGFBQWEsR0FBRyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUUsQ0FBQztRQUVoRyxJQUFLLGFBQWEsR0FBRyxDQUFDLElBQUksbUJBQW1CLEdBQUcsQ0FBQyxFQUNqRDtZQUNDLENBQUMsQ0FBQyxRQUFRLENBQUUsV0FBVyxHQUFHLFVBQVUsR0FBRyxVQUFVLEVBQUUsR0FBRyxFQUFFO2dCQUV2RCxJQUFLLENBQUMsYUFBYSxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRTtvQkFDOUMsT0FBTztnQkFFUixhQUFhLENBQUMsUUFBUSxDQUFFLFdBQVcsQ0FBRSxDQUFDO1lBRXZDLENBQUMsQ0FBRSxDQUFDO1NBQ0o7SUFDRixDQUFDO0lBRUQsU0FBUyxnQkFBZ0I7UUFFeEIsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLDZCQUE2QixDQUFFLFdBQVcsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUUsV0FBVyxDQUFFLENBQUUsQ0FBQztJQUNqSCxDQUFDO0lBS0Q7UUFHQyxDQUFDLENBQUMseUJBQXlCLENBQUUsa0NBQWtDLEVBQUUsZ0JBQWdCLENBQUUsQ0FBQztRQUNwRixDQUFDLENBQUMseUJBQXlCLENBQUUscUNBQXFDLEVBQUUsZ0JBQWdCLENBQUUsQ0FBQztLQUN2RjtBQUNGLENBQUMsRUF2RFMsY0FBYyxLQUFkLGNBQWMsUUF1RHZCIn0=