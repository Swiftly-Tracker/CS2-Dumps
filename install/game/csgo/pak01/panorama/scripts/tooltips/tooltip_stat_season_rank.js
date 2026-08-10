"use strict";
/// <reference path="../rating_emblem.ts" />
function setupTooltip() {
    var rank = $.GetContextPanel().GetAttributeString("rank", "not-found");
    var week_name = $.GetContextPanel().GetAttributeString("week_name", "not-found");
    var week_idx = $.GetContextPanel().GetAttributeString("week_idx", "not-found");
    if (week_name) {
        $.GetContextPanel().SetDialogVariable('week-name', week_name);
        $.GetContextPanel().SetDialogVariable('week-id', week_idx);
    }
    if (!rank || rank === "not-found") {
        $.GetContextPanel().FindChildInLayoutFile('id-tooltip-premier-rating').SetHasClass('show', false);
        return;
    }
    const options = {
        root_panel: $.GetContextPanel().FindChildInLayoutFile('id-tooltip-premier-rating'),
        do_fx: false,
        full_details: false,
        rating_type: 'Premier',
        leaderboard_details: { score: parseInt(rank) },
        local_player: false
    };
    $.GetContextPanel().FindChildInLayoutFile('id-tooltip-premier-rating').SetHasClass('show', true);
    RatingEmblem.SetXuid(options);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbHRpcF9zdGF0X3NlYXNvbl9yYW5rLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvdG9vbHRpcHMvdG9vbHRpcF9zdGF0X3NlYXNvbl9yYW5rLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSw0Q0FBNEM7QUFFNUMsU0FBUyxZQUFZO0lBRXBCLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxNQUFNLEVBQUUsV0FBVyxDQUFFLENBQUM7SUFDdEUsSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGtCQUFrQixDQUFFLFdBQVcsRUFBRSxXQUFXLENBQUUsQ0FBQztJQUNuRixJQUFJLFFBQVEsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsa0JBQWtCLENBQUUsVUFBVSxFQUFFLFdBQVcsQ0FBRSxDQUFDO0lBRWpGLElBQUksU0FBUyxFQUNiO1FBQ0ksQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGlCQUFpQixDQUFFLFdBQVcsRUFBRSxTQUFTLENBQUUsQ0FBQztRQUNoRSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsaUJBQWlCLENBQUUsU0FBUyxFQUFFLFFBQVEsQ0FBRSxDQUFDO0tBQ2hFO0lBRUQsSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLEtBQUssV0FBVyxFQUNqQztRQUNJLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSwyQkFBMkIsQ0FBRSxDQUFDLFdBQVcsQ0FBRSxNQUFNLEVBQUUsS0FBSyxDQUFFLENBQUM7UUFDdEcsT0FBTztLQUNWO0lBRUQsTUFBTSxPQUFPLEdBQ2I7UUFDSSxVQUFVLEVBQUUsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLDJCQUEyQixDQUFFO1FBQ3BGLEtBQUssRUFBRSxLQUFLO1FBQ1osWUFBWSxFQUFFLEtBQUs7UUFDbkIsV0FBVyxFQUFFLFNBQVM7UUFDdEIsbUJBQW1CLEVBQUUsRUFBRSxLQUFLLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQzlDLFlBQVksRUFBRSxLQUFLO0tBQ3RCLENBQUM7SUFFRixDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUUsMkJBQTJCLENBQUUsQ0FBQyxXQUFXLENBQUUsTUFBTSxFQUFFLElBQUksQ0FBRSxDQUFDO0lBRXJHLFlBQVksQ0FBQyxPQUFPLENBQUUsT0FBTyxDQUFFLENBQUM7QUFDcEMsQ0FBQyJ9