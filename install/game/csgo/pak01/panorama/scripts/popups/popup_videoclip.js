"use strict";
/// <reference path="..\csgo.d.ts" />
var PopupVideoClip;
(function (PopupVideoClip) {
    function Init() {
        const reelId = $.GetContextPanel().GetAttributeString("reelid", '');
        const reelJson = InventoryAPI.BuildHighlightReelSchemaJSON(parseInt(reelId));
        const reelSchemaDef = JSON.parse(reelJson);
        $.GetContextPanel().SetDialogVariable('clip_title', $.Localize("#CSGO_Watch_Cat_Tournament_" + reelSchemaDef["tournament event id"])
            + " | " +
            $.Localize("#HighlightReel_" + reelSchemaDef["id"]));
        const videoPlayer = $('#VideoClipMovie');
        if (videoPlayer) {
            UiToolkitAPI.PlaySoundEvent('UIPanorama.OnStartPopupVideo');
            // Example URLs:
            // https://cdn.akamai.steamstatic.com/apps/csgo/videos/csgo_react/cs2/video_smokes.webm
            // https://cdn.akamai.steamstatic.com/apps/csgo/videos/highlightreels_beta/024/024_074v095_005_de_anubis_aus2025_ra1nsmokedefuse_ww_1080p.webm
            // reels support url_1080p, url_720p, url_480p -- this big player uses biggest resolution @ 1080p:
            videoPlayer.SetMovie(reelSchemaDef["url_1080p"]);
            videoPlayer.UseAttachedAudioStream(true);
            videoPlayer.Play();
        }
    }
    PopupVideoClip.Init = Init;
    function Close() {
        UiToolkitAPI.PlaySoundEvent('UIPanorama.OnStopPopupVideo');
        $.DispatchEvent('UIPopupButtonClicked', '');
    }
    PopupVideoClip.Close = Close;
    $.RegisterForUnhandledEvent("ServerReserved", Close);
})(PopupVideoClip || (PopupVideoClip = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfdmlkZW9jbGlwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvcG9wdXBzL3BvcHVwX3ZpZGVvY2xpcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBRXJDLElBQVUsY0FBYyxDQXFDdkI7QUFyQ0QsV0FBVSxjQUFjO0lBRXZCLFNBQWdCLElBQUk7UUFFbkIsTUFBTSxNQUFNLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGtCQUFrQixDQUFFLFFBQVEsRUFBRSxFQUFFLENBQUUsQ0FBQztRQUN0RSxNQUFNLFFBQVEsR0FBRyxZQUFZLENBQUMsNEJBQTRCLENBQUUsUUFBUSxDQUFFLE1BQU0sQ0FBRSxDQUFFLENBQUM7UUFDakYsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBRSxRQUFRLENBQUUsQ0FBQztRQUU3QyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsaUJBQWlCLENBQUUsWUFBWSxFQUNsRCxDQUFDLENBQUMsUUFBUSxDQUFFLDZCQUE2QixHQUFHLGFBQWEsQ0FBRSxxQkFBcUIsQ0FBRSxDQUFFO2NBQ2xGLEtBQUs7WUFDUCxDQUFDLENBQUMsUUFBUSxDQUFFLGlCQUFpQixHQUFHLGFBQWEsQ0FBRSxJQUFJLENBQUUsQ0FBRSxDQUN2RCxDQUFDO1FBRUYsTUFBTSxXQUFXLEdBQUssQ0FBQyxDQUFFLGlCQUFpQixDQUFlLENBQUM7UUFDMUQsSUFBSyxXQUFXLEVBQ2hCO1lBQ0MsWUFBWSxDQUFDLGNBQWMsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO1lBQzVELGdCQUFnQjtZQUNoQix1RkFBdUY7WUFDdkYsOElBQThJO1lBQzlJLGtHQUFrRztZQUNsRyxXQUFXLENBQUMsUUFBUSxDQUFFLGFBQWEsQ0FBRSxXQUFXLENBQUUsQ0FBRSxDQUFDO1lBQ3JELFdBQVcsQ0FBQyxzQkFBc0IsQ0FBRSxJQUFJLENBQUUsQ0FBQztZQUMzQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7U0FDbkI7SUFDRixDQUFDO0lBeEJlLG1CQUFJLE9Bd0JuQixDQUFBO0lBRUQsU0FBZ0IsS0FBSztRQUVwQixZQUFZLENBQUMsY0FBYyxDQUFDLDZCQUE2QixDQUFDLENBQUM7UUFDM0QsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxzQkFBc0IsRUFBRSxFQUFFLENBQUUsQ0FBQztJQUUvQyxDQUFDO0lBTGUsb0JBQUssUUFLcEIsQ0FBQTtJQUVELENBQUMsQ0FBQyx5QkFBeUIsQ0FBRSxnQkFBZ0IsRUFBRSxLQUFLLENBQUUsQ0FBQztBQUV4RCxDQUFDLEVBckNTLGNBQWMsS0FBZCxjQUFjLFFBcUN2QiJ9