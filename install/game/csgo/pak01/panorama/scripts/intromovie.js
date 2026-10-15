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
        $.Schedule(0.0, DestroyMoviePlayer);
        $.DispatchEventAsync(0.0, "CSGOHideIntroMovie");
    }
    {
        $.RegisterForUnhandledEvent("CSGOShowIntroMovie", ShowIntroMovie);
        $.RegisterForUnhandledEvent("CSGOEndIntroMovie", HideIntroMovie);
        $.RegisterEventHandler("MoviePlayerPlaybackEnded", $("#IntroMoviePlayer"), HideIntroMovie);
    }
})(IntroMovie || (IntroMovie = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50cm9tb3ZpZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL2ludHJvbW92aWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUVsQyxJQUFVLFVBQVUsQ0FvRW5CO0FBcEVELFdBQVUsVUFBVTtJQUVuQixJQUFJLCtCQUErQixHQUFrQixJQUFJLENBQUM7SUFFMUQsU0FBUyxjQUFjO1FBRXRCLElBQUksU0FBUyxHQUFHLHNDQUFzQyxDQUFDO1FBQ3ZELE1BQU0sWUFBWSxHQUFHLFlBQVksQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUNwRCxJQUFLLFlBQVksSUFBSSxjQUFjLEVBQ25DO1lBQ0MsU0FBUyxHQUFHLG1EQUFtRCxDQUFDO1NBQ2hFO1FBRUQsQ0FBQyxDQUFXLG1CQUFtQixDQUFFLENBQUMsUUFBUSxDQUFFLFNBQVMsQ0FBRSxDQUFDO1FBS3hELENBQUMsQ0FBQyxRQUFRLENBQUUsR0FBRyxFQUFFLGNBQWMsQ0FBRSxDQUFDO1FBQ2xDLENBQUMsQ0FBVyxtQkFBbUIsQ0FBRSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzdDLENBQUMsQ0FBQyxlQUFlLENBQUUsQ0FBQyxDQUFFLG1CQUFtQixDQUFHLEVBQUUsZ0NBQWdDLEVBQUUsY0FBYyxDQUFFLENBQUM7SUFDbEcsQ0FBQztJQUVELFNBQVMsd0JBQXdCO1FBRWhDLElBQUssK0JBQStCLElBQUksSUFBSSxFQUM1QztZQUNDLFlBQVksQ0FBQyxjQUFjLENBQUUsK0JBQStCLEVBQUUsR0FBRyxDQUFFLENBQUM7WUFDcEUsK0JBQStCLEdBQUcsSUFBSSxDQUFDO1NBQ3ZDO0lBQ0YsQ0FBQztJQUVELFNBQVMsY0FBYztRQUV0Qix3QkFBd0IsRUFBRSxDQUFDO1FBQzNCLCtCQUErQixHQUFHLFlBQVksQ0FBQyxjQUFjLENBQUUsc0JBQXNCLENBQUUsQ0FBQztRQUN4RixDQUFDLENBQVcsbUJBQW1CLENBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUMxQyxDQUFDO0lBRUQsU0FBUyxjQUFjO1FBRXRCLHdCQUF3QixFQUFFLENBQUM7UUFDM0IsQ0FBQyxDQUFXLG1CQUFtQixDQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDMUMsQ0FBQztJQUVELFNBQVMsa0JBQWtCO1FBRTFCLHdCQUF3QixFQUFFLENBQUM7UUFDM0IsQ0FBQyxDQUFXLG1CQUFtQixDQUFFLENBQUMsUUFBUSxDQUFFLEVBQUUsQ0FBRSxDQUFDO0lBQ2xELENBQUM7SUFFRCxTQUFTLGNBQWM7UUFJdEIsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxHQUFHLEVBQUUsa0JBQWtCLENBQUUsQ0FBQztRQUV0QyxDQUFDLENBQUMsa0JBQWtCLENBQUUsR0FBRyxFQUFFLG9CQUFvQixDQUFFLENBQUM7SUFDbkQsQ0FBQztJQUtEO1FBQ0MsQ0FBQyxDQUFDLHlCQUF5QixDQUFFLG9CQUFvQixFQUFFLGNBQWMsQ0FBRSxDQUFDO1FBQ3BFLENBQUMsQ0FBQyx5QkFBeUIsQ0FBRSxtQkFBbUIsRUFBRSxjQUFjLENBQUUsQ0FBQztRQUNuRSxDQUFDLENBQUMsb0JBQW9CLENBQUUsMEJBQTBCLEVBQUUsQ0FBQyxDQUFFLG1CQUFtQixDQUFHLEVBQUUsY0FBYyxDQUFFLENBQUM7S0FDaEc7QUFDRixDQUFDLEVBcEVTLFVBQVUsS0FBVixVQUFVLFFBb0VuQiJ9