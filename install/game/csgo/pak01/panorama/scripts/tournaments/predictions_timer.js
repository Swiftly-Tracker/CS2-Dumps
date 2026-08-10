"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../common/formattext.ts" />
/// <reference path="../popups/popup_major_hub.ts" />
var PredictionsTimer;
(function (PredictionsTimer) {
    function UpdateTimer() {
        let oPageData = PopupMajorHub.GetActivePageData();
        if (!oPageData || !oPageData.tournamentId)
            return;
        if (oPageData.panel.Data().handlerLockPicksTimerSch) {
            oPageData.panel.Data().handlerLockPicksTimerSch = null;
        }
        let elIcon = oPageData.panel.FindChildTraverse('id-predictions-timer-icon');
        let elParent = oPageData.panel.FindChildTraverse('id-predictions-timer');
        elParent.SwitchClass('state', '');
        let canPick = PredictionsAPI.GetGroupCanPick(oPageData.tournamentId, oPageData.groupId);
        let secRemaining = PredictionsAPI.GetGroupRemainingPredictionSeconds(oPageData.tournamentId, oPageData.groupId);
        let isActive = PredictionsAPI.GetSectionIsActive(oPageData.tournamentId, oPageData.sectionId);
        if (!canPick) {
            elIcon.SetImage('file://{images}/icons/ui/locked.svg');
            oPageData.panel.SetDialogVariable('lock_state', $.Localize('#pickem_timer_locked'));
        }
        else if (!isActive && canPick) {
            elParent.SwitchClass('state', 'not-active');
            elIcon.SetImage('file://{images}/icons/ui/locked.svg');
            oPageData.panel.SetDialogVariable('lock_state', $.Localize('#pickem_timer_inactive'));
        }
        else if (canPick && secRemaining > 0) {
            elIcon.SetImage('file://{images}/icons/ui/clock.svg');
            oPageData.panel.SetDialogVariable('time', FormatText.SecondsToSignificantTimeString(secRemaining));
            oPageData.panel.SetDialogVariable('lock_state', $.Localize('#pickem_timer', oPageData.panel));
            if (!oPageData.panel.Data().handlerLockPicksTimerSch) {
                oPageData.panel.Data().handlerLockPicksTimerSch = $.Schedule(1, () => { UpdateTimer(); });
            }
        }
        else {
            elIcon.SetImage('file://{images}/icons/ui/clock.svg');
            oPageData.panel.SetDialogVariable('time', FormatText.SecondsToSignificantTimeString(60));
            oPageData.panel.SetDialogVariable('lock_state', $.Localize('#pickem_timer', oPageData.panel));
        }
    }
    PredictionsTimer.UpdateTimer = UpdateTimer;
})(PredictionsTimer || (PredictionsTimer = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZGljdGlvbnNfdGltZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy90b3VybmFtZW50cy9wcmVkaWN0aW9uc190aW1lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQ0EscUNBQXFDO0FBQ3JDLGdEQUFnRDtBQUNoRCxxREFBcUQ7QUFFckQsSUFBVSxnQkFBZ0IsQ0F1RHpCO0FBdkRELFdBQVUsZ0JBQWdCO0lBRXRCLFNBQWdCLFdBQVc7UUFFdkIsSUFBSSxTQUFTLEdBQUcsYUFBYSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFFbEQsSUFBSSxDQUFDLFNBQVMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZO1lBQ3JDLE9BQU87UUFFWCxJQUFLLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsd0JBQXdCLEVBQzFEO1lBQ0MsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyx3QkFBd0IsR0FBSSxJQUFJLENBQUM7U0FDeEQ7UUFFSyxJQUFJLE1BQU0sR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLGlCQUFpQixDQUFFLDJCQUEyQixDQUFhLENBQUM7UUFDekYsSUFBSSxRQUFRLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBRSxzQkFBc0IsQ0FBYSxDQUFDO1FBQ3RGLFFBQVEsQ0FBQyxXQUFXLENBQUUsT0FBTyxFQUFFLEVBQUUsQ0FBRSxDQUFDO1FBRXBDLElBQUksT0FBTyxHQUFHLGNBQWMsQ0FBQyxlQUFlLENBQUUsU0FBUyxDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsT0FBTyxDQUFFLENBQUM7UUFDMUYsSUFBSSxZQUFZLEdBQUcsY0FBYyxDQUFDLGtDQUFrQyxDQUFFLFNBQVMsQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLE9BQU8sQ0FBRSxDQUFDO1FBQ2xILElBQUksUUFBUSxHQUFHLGNBQWMsQ0FBQyxrQkFBa0IsQ0FBRSxTQUFTLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxTQUFTLENBQUUsQ0FBQztRQUVoRyxJQUFLLENBQUMsT0FBTyxFQUNuQjtZQUVDLE1BQU0sQ0FBQyxRQUFRLENBQUUscUNBQXFDLENBQUUsQ0FBQztZQUNoRCxTQUFTLENBQUMsS0FBSyxDQUFDLGlCQUFpQixDQUFFLFlBQVksRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFFLHNCQUFzQixDQUFFLENBQUMsQ0FBQztTQUNoRzthQUVVLElBQUssQ0FBQyxRQUFRLElBQUksT0FBTyxFQUM5QjtZQUNJLFFBQVEsQ0FBQyxXQUFXLENBQUUsT0FBTyxFQUFFLFlBQVksQ0FBRSxDQUFDO1lBQzlDLE1BQU0sQ0FBQyxRQUFRLENBQUUscUNBQXFDLENBQUUsQ0FBQztZQUN6RCxTQUFTLENBQUMsS0FBSyxDQUFDLGlCQUFpQixDQUFFLFlBQVksRUFBRyxDQUFDLENBQUMsUUFBUSxDQUFFLHdCQUF3QixDQUFFLENBQUUsQ0FBQztTQUM5RjthQUNJLElBQUssT0FBTyxJQUFJLFlBQVksR0FBRyxDQUFDLEVBQ3JDO1lBRUksTUFBTSxDQUFDLFFBQVEsQ0FBRSxvQ0FBb0MsQ0FBRSxDQUFDO1lBQ2pFLFNBQVMsQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUUsTUFBTSxFQUFFLFVBQVUsQ0FBQyw4QkFBOEIsQ0FBRSxZQUFZLENBQUUsQ0FBRSxDQUFDO1lBQzlGLFNBQVMsQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUUsWUFBWSxFQUFHLENBQUMsQ0FBQyxRQUFRLENBQUUsZUFBZSxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUUsQ0FBRSxDQUFDO1lBRTVHLElBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLHdCQUF3QixFQUNyRDtnQkFDQyxTQUFTLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLHdCQUF3QixHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUUsQ0FBQyxFQUFFLEdBQUUsRUFBRSxHQUFFLFdBQVcsRUFBRSxDQUFBLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDeEY7U0FDSzthQUVQO1lBRUMsTUFBTSxDQUFDLFFBQVEsQ0FBRSxvQ0FBb0MsQ0FBRSxDQUFDO1lBQ3hELFNBQVMsQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUUsTUFBTSxFQUFFLFVBQVUsQ0FBQyw4QkFBOEIsQ0FBRSxFQUFFLENBQUUsQ0FBRSxDQUFDO1lBQ3BGLFNBQVMsQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUUsWUFBWSxFQUFHLENBQUMsQ0FBQyxRQUFRLENBQUUsZUFBZSxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUUsQ0FBRSxDQUFDO1NBQzVHO0lBQ0MsQ0FBQztJQXBEZSw0QkFBVyxjQW9EMUIsQ0FBQTtBQUNMLENBQUMsRUF2RFMsZ0JBQWdCLEtBQWhCLGdCQUFnQixRQXVEekIifQ==