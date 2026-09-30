"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/async.ts" />
/// <reference path="particle_controls.ts" />
var XpShopTrack;
(function (XpShopTrack) {
    let pieAnimDuration = 1;
    const nXPperStar = StoreAPI.GetXpShopStarXp();
    // a way to call setOptions from C++
    // function SetOptionsEventHandler ( elPanel: Panel_t, do_fx: boolean, xptrack_value: number, xptrack_final_value: number )
    // {
    // 	const settings =
    // 		{
    // 			xpshop_track_frame_panel: elPanel,
    // 			xpshop_track_value: xptrack_value,
    // 		} as XpShopTrackSettings_t;
    // 	$.Msg( elPanel.GetParent().id );
    // 	XpShopInit( settings );
    // }
    //$.RegisterEventHandler( "XpShopTrack_SetSettings", $.GetContextPanel(), SetOptionsEventHandler );
    function XpShopInit(settings) {
        const elRootPanel = settings.xpshop_track_frame_panel;
        if (!elRootPanel || !elRootPanel.IsValid())
            return;
        const elTrack = elRootPanel.FindChildTraverse('jsRadialTrack');
        if (!elTrack)
            return;
        const elTrackFx = elRootPanel.FindChildTraverse('jsRadialTrackInsideFx');
        const elTrackBGFx = elRootPanel.FindChildTraverse('jsRadialTrackBgFx');
        if (elTrackFx && elTrackBGFx) {
            elTrackBGFx.StopParticlesWithEndcaps();
            elTrackFx.StopParticlesWithEndcaps();
        }
        const nStarsEarned = settings.xpshop_track_value > 0 ? Math.floor(settings.xpshop_track_value / nXPperStar) : 0;
        const nXpProgressTowardsNextStar = settings.xpshop_track_value % nXPperStar;
        const nPercentProgressTowardsNextStar = nXpProgressTowardsNextStar / nXPperStar * 100;
        elRootPanel.SetDialogVariableInt('progress-to-next-star', nPercentProgressTowardsNextStar);
        elRootPanel.SetDialogVariableInt('stars-earned', nStarsEarned);
        elRootPanel.SetDialogVariableInt('max-stars', StoreAPI.GetXpShopMaxTrackLevel());
        elTrack.style.clip = 'radial(50% 50%, 0deg, ' + Math.floor(nPercentProgressTowardsNextStar / 100 * 360) + 'deg)';
        elTrack.style.transitionDuration = '0s';
        // cache value
        elRootPanel.Data().prev_xpshop_track_value = settings.xpshop_track_value;
        SetComplete(elRootPanel, nStarsEarned >= StoreAPI.GetXpShopMaxTrackLevel());
    }
    XpShopTrack.XpShopInit = XpShopInit;
    function PlayActivateParticles(settings) {
        const elRootPanel = settings.xpshop_track_frame_panel;
        if (!elRootPanel || !elRootPanel.IsValid())
            return;
        const elTrackFx = elRootPanel.FindChildTraverse('jsRadialTrackInsideFx');
        const elTrackBGFx = elRootPanel.FindChildTraverse('jsRadialTrackBgFx');
        elTrackBGFx.StartParticles();
        elTrackFx.StartParticles();
        elTrackBGFx.SetControlPoint(6, 1, 1, 1);
        elTrackFx.SetControlPoint(6, 30, 1, 1);
        elTrackFx.SetControlPoint(5, 0, 1, 1);
        elTrackFx.SetControlPoint(5, 1, 1, 1);
    }
    XpShopTrack.PlayActivateParticles = PlayActivateParticles;
    function SetComplete(elRoot, bSet = true) {
        elRoot.SetHasClass('complete', bSet);
        elRoot.SetDialogVariable('xpshop-track-tooltip', bSet ?
            $.Localize('#xpshop_track_complete_tooltip') :
            $.Localize('#xpshop_track_tooltip'));
    }
    async function XpShopUpdate(settings) {
        const elRootPanel = settings.xpshop_track_frame_panel;
        if (!elRootPanel || !elRootPanel.IsValid())
            return;
        const elTrack = elRootPanel.FindChildTraverse('jsRadialTrack');
        const elTrackFx = elRootPanel.FindChildTraverse('jsRadialTrackInsideFx');
        const elTrackBGFx = elRootPanel.FindChildTraverse('jsRadialTrackBgFx');
        let haveFx = false;
        if (elTrackFx && elTrackBGFx)
            haveFx = true;
        if (!elTrack)
            return;
        const prevTrackXp = elRootPanel.Data().prev_xpshop_track_value;
        if (prevTrackXp === undefined) {
            $.Msg('XpShopUpdate was called but there is no prev_xpshop_track_value. Did you forget to call XpShopInit?');
            return;
        }
        $.Msg("\n XpShopUpdate");
        $.Msg("panel: " + settings.xpshop_track_frame_panel.id);
        $.Msg("prevXp: " + prevTrackXp);
        $.Msg("NewXp: " + settings.xpshop_track_value);
        $.Msg("\n");
        const oldStars = Math.floor(prevTrackXp / nXPperStar);
        const newStars = Math.floor(settings.xpshop_track_value / nXPperStar);
        const starsEarned = newStars - oldStars;
        elRootPanel.SetDialogVariableInt('stars-earned', oldStars);
        if (oldStars >= StoreAPI.GetXpShopMaxTrackLevel()) {
            SetComplete(elRootPanel);
            return;
        }
        elTrack.style.transitionDuration = pieAnimDuration + 's';
        if (haveFx) {
            elTrackBGFx.StartParticles();
            elTrackFx.StartParticles();
            elTrackFx.SetControlPoint(6, 0, 1, 1);
            elTrackFx.SetControlPoint(5, 0, 1, 1);
            elTrackFx.SetControlPoint(5, 1, 1, 1);
        }
        // A. cycle through stars earned
        for (let i = 0; i < starsEarned; i++) {
            if (haveFx) {
                elTrackFx.SetControlPoint(6, 0, 1, 1);
                elTrackBGFx.SetControlPoint(6, 0, 1, 1);
            }
            // progress bar should glow up
            elRootPanel.AddClass("in-motion");
            // 1. animate to full circle
            elTrack.style.transitionDuration = pieAnimDuration + 's';
            elTrack.style.clip = 'radial(50% 50%, 0deg, 360deg)';
            elRootPanel.SetDialogVariableInt('progress-to-next-star', 100);
            UiToolkitAPI.PlaySoundEvent("UI.XP.Star.Filling");
            $.Msg("A1-------");
            $.Msg("stars-earned: " + (oldStars + i));
            $.Msg("circle: 360");
            $.Msg("%: 100");
            // hold full circle before fanfair
            await Async.Delay(pieAnimDuration);
            // 2. do some fanfair and update counter
            $.Msg("A2-------");
            $.Msg("stars-earned: " + (oldStars + i + 1));
            elRootPanel.SetDialogVariableInt('stars-earned', oldStars + i + 1);
            elRootPanel.AddClass("earned-star");
            elTrack.style.transitionDuration = '0s';
            elRootPanel.style.transitionProperty = 'brightness';
            elRootPanel.style.transitionDuration = '.1s';
            UiToolkitAPI.PlaySoundEvent("UI.XP.Star.Full");
            if (haveFx) {
                elTrackBGFx.SetControlPoint(6, 1, 1, 1);
                elTrackFx.SetControlPoint(6, 30, 1, 1);
                elTrackFx.SetControlPoint(5, 0, 1, 1);
                elTrackFx.SetControlPoint(5, 1, 1, 1);
            }
            elRootPanel.style.brightness = '2';
            await Async.Delay(0.2);
            elRootPanel.style.brightness = '1';
            await Async.Delay(0.2);
            // 3. reset track
            elTrack.style.clip = 'radial(50% 50%, 0deg, 0deg)';
            elRootPanel.SetDialogVariableInt('progress-to-next-star', 0);
            $.Msg("A3-------");
            $.Msg("circle: 0");
            $.Msg("%: 0");
            elTrack.style.transitionDuration = pieAnimDuration + 's';
        }
        const deltaXp = settings.xpshop_track_value % nXPperStar;
        if (newStars >= StoreAPI.GetXpShopMaxTrackLevel()) {
            SetComplete(elRootPanel);
            return;
        }
        $.Msg("delta remainder: " + deltaXp);
        // B. remaining partial star
        if (deltaXp > 0) {
            // progress bar should glow up
            elRootPanel.AddClass("in-motion");
            const nPercentProgressTowardsNextStar = deltaXp / nXPperStar * 100;
            const nDegrees = Math.floor(nPercentProgressTowardsNextStar / 100 * 360);
            elRootPanel.SetDialogVariableInt('progress-to-next-star', nPercentProgressTowardsNextStar);
            elRootPanel.SetDialogVariableInt('stars-earned', newStars);
            elTrack.style.clip = 'radial(50% 50%, 0deg, ' + nDegrees + 'deg)';
            UiToolkitAPI.PlaySoundEvent("UI.XP.Star.Filling");
            $.Msg("B1-------");
            $.Msg("prevXp: " + prevTrackXp);
            $.Msg("stars-earned: " + (newStars));
            $.Msg("circle: " + nDegrees);
            $.Msg("%: " + nPercentProgressTowardsNextStar);
            // cache value
            elRootPanel.Data().prev_xpshop_track_value = settings.xpshop_track_value;
        }
        if (haveFx) {
            elTrackFx.SetControlPoint(6, 0, 1, 1);
            //elTrackBGFx.SetControlPoint ( 6, 0, 1, 1 );
        }
        await Async.Delay(0.5);
        elRootPanel.RemoveClass("in-motion");
    }
    XpShopTrack.XpShopUpdate = XpShopUpdate;
})(XpShopTrack || (XpShopTrack = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieHBzaG9wX3RyYWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMveHBzaG9wX3RyYWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFDbEMsd0NBQXdDO0FBQ3hDLDZDQUE2QztBQVM3QyxJQUFVLFdBQVcsQ0F5UHBCO0FBelBELFdBQVUsV0FBVztJQUVwQixJQUFJLGVBQWUsR0FBRyxDQUFDLENBQUM7SUFFeEIsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBRTlDLG9DQUFvQztJQUNwQywySEFBMkg7SUFDM0gsSUFBSTtJQUNKLG9CQUFvQjtJQUNwQixNQUFNO0lBQ04sd0NBQXdDO0lBQ3hDLHdDQUF3QztJQUN4QyxnQ0FBZ0M7SUFFaEMsb0NBQW9DO0lBRXBDLDJCQUEyQjtJQUMzQixJQUFJO0lBQ0osbUdBQW1HO0lBRW5HLFNBQWdCLFVBQVUsQ0FBRyxRQUErQjtRQUUzRCxNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsd0JBQXdCLENBQUM7UUFDdEQsSUFBSyxDQUFDLFdBQVcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUU7WUFDMUMsT0FBTztRQUVSLE1BQU0sT0FBTyxHQUFHLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBRSxlQUFlLENBQUUsQ0FBQztRQUNqRSxJQUFLLENBQUMsT0FBTztZQUNaLE9BQU87UUFFUixNQUFNLFNBQVMsR0FBRyxXQUFXLENBQUMsaUJBQWlCLENBQUUsdUJBQXVCLENBQTBCLENBQUM7UUFDbkcsTUFBTSxXQUFXLEdBQUcsV0FBVyxDQUFDLGlCQUFpQixDQUFFLG1CQUFtQixDQUEwQixDQUFDO1FBRWpHLElBQUssU0FBUyxJQUFJLFdBQVcsRUFDN0I7WUFDQyxXQUFXLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztZQUN2QyxTQUFTLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztTQUNyQztRQUVE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