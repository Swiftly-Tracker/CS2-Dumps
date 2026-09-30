"use strict";
/// <reference path="csgo.d.ts" />
var IntroMovie;
(function (IntroMovie) {
    var g_movieSoundEventInstanceHandle = null;
    function ShowIntroMovie() {
        var movieName = "file://{resources}/videos/intro.webm";
        const launcherType = MyPersonaAPI.GetLauncherType();
        if (launcherType == "perfectworld") {
            movieName = "file://{resources}/videos/intro-perfectworld.webm";
        }
        $("#IntroMoviePlayer").SetMovie(movieName);
        // This function is called from CGameUI::OnGameUIActivated()
        // For now, we schedule the movie to play on the next frame because the first frame is so long that it causes the videoplayer to
        // stutter. The same bug can be seen if you hit a breakpoint, then resume during a video playback with audio.
        $.Schedule(0.0, PlayIntroMovie);
        $("#IntroMoviePlayer").SetFocus();
        $.RegisterKeyBind($("#IntroMoviePlayer"), "key_enter,key_space,key_escape", SkipIntroMovie);
    }
    function StopIntroMovieSoundEvent() {
        if (g_movieSoundEventInstanceHandle != null) {
            UiToolkitAPI.StopSoundEvent(g_movieSoundEventInstanceHandle, 0.1);
            g_movieSoundEventInstanceHandle = null;
        }
    }
    function PlayIntroMovie() {
        StopIntroMovieSoundEvent();
        g_movieSoundEventInstanceHandle = UiToolkitAPI.PlaySoundEvent("UIPanorama.IntroLogo");
        $("#IntroMoviePlayer").Play();
    }
    function SkipIntroMovie() {
        StopIntroMovieSoundEvent();
        $("#IntroMoviePlayer").Stop();
    }
    function DestroyMoviePlayer() {
        StopIntroMovieSoundEvent();
        $("#IntroMoviePlayer").SetMovie("");
    }
    function HideIntroMovie() {
        // Can't destroy the movie player straight away as this event has been dispatched by the video player itself
        // and therefore delay the destruction to the next iteration of the scheduler.
        $.Schedule(0.0, DestroyMoviePlayer);
        $.DispatchEventAsync(0.0, "CSGOHideIntroMovie");
    }
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        $.RegisterForUnhandledEvent("CSGOShowIntroMovie", ShowIntroMovie);
        $.RegisterForUnhandledEvent("CSGOEndIntroMovie", HideIntroMovie);
        $.RegisterEventHandler("MoviePlayerPlaybackEnded", $("#IntroMoviePlayer"), HideIntroMovie);
    }
})(IntroMovie || (IntroMovie = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50cm9tb3ZpZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL2ludHJvbW92aWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUVsQyxJQUFVLFVBQVUsQ0FvRW5CO0FBcEVELFdBQVUsVUFBVTtJQUVuQixJQUFJLCtCQUErQixHQUFrQixJQUFJLENBQUM7SUFFMUQsU0FBUyxjQUFjO1FBRXRCLElBQUksU0FBUyxHQUFHLHNDQUFzQyxDQUFDO1FBQ3ZELE1BQU0sWUFBWSxHQUFHLFlBQVksQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUNwRCxJQUFLLFlBQVksSUFBSSxjQUFjLEVBQ25DO1lBQ0MsU0FBUyxHQUFHLG1EQUFtRCxDQUFDO1NBQ2hFO1FBRUQsQ0FBQyxDQUFXLG1CQUFtQixDQUFFLENBQUMsUUFBUSxDQUFFLFNBQVMsQ0FBRSxDQUFDO1FBRXhELDREQUE0RDtRQUM1RCxnSUFBZ0k7UUFDaEksNkdBQTZHO1FBQzdHLENBQUMsQ0FBQyxRQUFRLENBQUUsR0FBRyxFQUFFLGNBQWMsQ0FBRSxDQUFDO1FBQ2xDLENBQUMsQ0FBVyxtQkFBbUIsQ0FBRSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzdDLENBQUMsQ0FBQyxlQUFlLENBQUUsQ0FBQyxDQUFFLG1CQUFtQixDQUFHLEVBQUUsZ0NBQWdDLEVBQUUsY0FBYyxDQUFFLENBQUM7SUFDbEcsQ0FBQztJQUVELFNBQVMsd0JBQXdCO1FBRWhDLElBQUssK0JBQStCLElBQUksSUFBSSxFQUM1QztZQUNDLFlBQVksQ0FBQyxjQUFjLENBQUUsK0JBQStCLEVBQUUsR0FBRyxDQUFFLENBQUM7WUFDcEUsK0JBQStCLEdBQUcsSUFBSSxDQUFDO1NBQ3ZDO0lBQ0YsQ0FBQztJQUVELFNBQVMsY0FBYztRQUV0Qix3QkFBd0IsRUFBRSxDQUFDO1FBQzNCLCtCQUErQixHQUFHLFlBQVksQ0FBQyxjQUFjLENBQUUsc0JBQXNCLENBQUUsQ0FBQztRQUN4RixDQUFDLENBQVcsbUJBQW1CLENBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUMxQyxDQUFDO0lBRUQsU0FBUyxjQUFjO1FBRXRCLHdCQUF3QixFQUFFLENBQUM7UUFDM0IsQ0FBQyxDQUFXLG1CQUFtQixDQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDMUMsQ0FBQztJQUVELFNBQVMsa0JBQWtCO1FBRTFCLHdCQUF3QixFQUFFLENBQUM7UUFDM0IsQ0FBQyxDQUFXLG1CQUFtQixDQUFFLENBQUMsUUFBUSxDQUFFLEVBQUUsQ0FBRSxDQUFDO0lBQ2xELENBQUM7SUFFRCxTQUFTLGNBQWM7UUFFdEIsNEdBQTRHO1FBQzVHLDhFQUE4RTtRQUM5RSxDQUFDLENBQUMsUUFBUSxDQUFFLEdBQUcsRUFBRSxrQkFBa0IsQ0FBRSxDQUFDO1FBRXRDLENBQUMsQ0FBQyxrQkFBa0IsQ0FBRSxHQUFHLEVBQUUsb0JBQW9CLENBQUUsQ0FBQztJQUNuRCxDQUFDO0lBRUQsb0dBQW9HO0lBQ3BHLDJDQUEyQztJQUMzQyxvR0FBb0c7SUFDcEc7UUFDQyxDQUFDLENBQUMseUJBQXlCLENBQUUsb0JBQW9CLEVBQUUsY0FBYyxDQUFFLENBQUM7UUFDcEUsQ0FBQyxDQUFDLHlCQUF5QixDQUFFLG1CQUFtQixFQUFFLGNBQWMsQ0FBRSxDQUFDO1FBQ25FLENBQUMsQ0FBQyxvQkFBb0IsQ0FBRSwwQkFBMEIsRUFBRSxDQUFDLENBQUUsbUJBQW1CLENBQUcsRUFBRSxjQUFjLENBQUUsQ0FBQztLQUNoRztBQUNGLENBQUMsRUFwRVMsVUFBVSxLQUFWLFVBQVUsUUFvRW5CIn0=