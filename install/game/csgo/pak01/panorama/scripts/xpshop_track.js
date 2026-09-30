"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/async.ts" />
/// <reference path="particle_controls.ts" />
var XpShopTrack;
(function (XpShopTrack) {
    let pieAnimDuration = 1;
    const nXPperStar = StoreAPI.GetXpShopStarXp();
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
            return;
        }
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
        for (let i = 0; i < starsEarned; i++) {
            if (haveFx) {
                elTrackFx.SetControlPoint(6, 0, 1, 1);
                elTrackBGFx.SetControlPoint(6, 0, 1, 1);
            }
            elRootPanel.AddClass("in-motion");
            elTrack.style.transitionDuration = pieAnimDuration + 's';
            elTrack.style.clip = 'radial(50% 50%, 0deg, 360deg)';
            elRootPanel.SetDialogVariableInt('progress-to-next-star', 100);
            UiToolkitAPI.PlaySoundEvent("UI.XP.Star.Filling");
            await Async.Delay(pieAnimDuration);
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
            elTrack.style.clip = 'radial(50% 50%, 0deg, 0deg)';
            elRootPanel.SetDialogVariableInt('progress-to-next-star', 0);
            elTrack.style.transitionDuration = pieAnimDuration + 's';
        }
        const deltaXp = settings.xpshop_track_value % nXPperStar;
        if (newStars >= StoreAPI.GetXpShopMaxTrackLevel()) {
            SetComplete(elRootPanel);
            return;
        }
        if (deltaXp > 0) {
            elRootPanel.AddClass("in-motion");
            const nPercentProgressTowardsNextStar = deltaXp / nXPperStar * 100;
            const nDegrees = Math.floor(nPercentProgressTowardsNextStar / 100 * 360);
            elRootPanel.SetDialogVariableInt('progress-to-next-star', nPercentProgressTowardsNextStar);
            elRootPanel.SetDialogVariableInt('stars-earned', newStars);
            elTrack.style.clip = 'radial(50% 50%, 0deg, ' + nDegrees + 'deg)';
            UiToolkitAPI.PlaySoundEvent("UI.XP.Star.Filling");
            elRootPanel.Data().prev_xpshop_track_value = settings.xpshop_track_value;
        }
        if (haveFx) {
            elTrackFx.SetControlPoint(6, 0, 1, 1);
        }
        await Async.Delay(0.5);
        elRootPanel.RemoveClass("in-motion");
    }
    XpShopTrack.XpShopUpdate = XpShopUpdate;
})(XpShopTrack || (XpShopTrack = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieHBzaG9wX3RyYWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMveHBzaG9wX3RyYWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFDbEMsd0NBQXdDO0FBQ3hDLDZDQUE2QztBQVM3QyxJQUFVLFdBQVcsQ0F5UHBCO0FBelBELFdBQVUsV0FBVztJQUVwQixJQUFJLGVBQWUsR0FBRyxDQUFDLENBQUM7SUFFeEIsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBaUI5QyxTQUFnQixVQUFVLENBQUcsUUFBK0I7UUFFM0QsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLHdCQUF3QixDQUFDO1FBQ3RELElBQUssQ0FBQyxXQUFXLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFO1lBQzFDLE9BQU87UUFFUixNQUFNLE9BQU8sR0FBRyxXQUFXLENBQUMsaUJBQWlCLENBQUUsZUFBZSxDQUFFLENBQUM7UUFDakUsSUFBSyxDQUFDLE9BQU87WUFDWixPQUFPO1FBRVIsTUFBTSxTQUFTLEdBQUcsV0FBVyxDQUFDLGlCQUFpQixDQUFFLHVCQUF1QixDQUEwQixDQUFDO1FBQ25HLE1BQU0sV0FBVyxHQUFHLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBRSxtQkFBbUIsQ0FBMEIsQ0FBQztRQUVqRyxJQUFLLFNBQVMsSUFBSSxXQUFXLEVBQzdCO1lBQ0MsV0FBVyxDQUFDLHdCQUF3QixFQUFFLENBQUM7WUFDdkMsU0FBUyxDQUFDLHdCQUF3QixFQUFFLENBQUM7U0FDckM7UUFFRCxNQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsa0JBQWtCLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFFLFFBQVEsQ0FBQyxrQkFBa0IsR0FBRyxVQUFVLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRWxILE1BQU0s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