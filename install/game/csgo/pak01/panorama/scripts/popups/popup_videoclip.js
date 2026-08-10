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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfdmlkZW9jbGlwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvcG9wdXBzL3BvcHVwX3ZpZGVvY2xpcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBRXJDLElBQVUsY0FBYyxDQXFDdkI7QUFyQ0QsV0FBVSxjQUFjO0lBRXZCLFNBQWdCLElBQUk7UUFFbkIsTUFBTSxNQUFNLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGtCQUFrQixDQUFFLFFBQVEsRUFBRSxFQUFFLENBQUUsQ0FBQztRQUN0RSxNQUFNLFFBQVEsR0FBRyxZQUFZLENBQUMsNEJBQTRCLENBQUUsUUFBUSxDQUFFLE1BQU0sQ0FBRSxDQUFFLENBQUM7UUFDakYsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBRSxRQUFRLENBQUUsQ0FBQztRQUU3QyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsaUJBQWlCLENBQUUsWUFBWSxFQUNsRCxDQUFDLENBQUMsUUFBUSxDQUFFLDZCQUE2QixHQUFHLGFBQWEsQ0FBRSxxQkFBcUIsQ0FBRSxDQUFFO2NBQ2xGLEtBQUs7WUFDUCxDQUFDLENBQUMsUUFBUSxDQUFFLGlCQUFpQixHQUFHLGFBQWEsQ0FBRSxJQUFJLENBQUUsQ0FBRSxDQUN2RCxDQUFDO1FBRUYsTUFBTSxXQUFXLEdBQUssQ0FBQyxDQUFFLGlCQUFpQixDQUFlLENBQUM7UUFDMUQsSUFBSyxXQUFXLEVBQ2hCO1lBQ0MsWUFBWSxDQUFDLGNBQWMsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO1lBSzVELFdBQVcsQ0FBQyxRQUFRLENBQUUsYUFBYSxDQUFFLFdBQVcsQ0FBRSxDQUFFLENBQUM7WUFDckQsV0FBVyxDQUFDLHNCQUFzQixDQUFFLElBQUksQ0FBRSxDQUFDO1lBQzNDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztTQUNuQjtJQUNGLENBQUM7SUF4QmUsbUJBQUksT0F3Qm5CLENBQUE7SUFFRCxTQUFnQixLQUFLO1FBRXBCLFlBQVksQ0FBQyxjQUFjLENBQUMsNkJBQTZCLENBQUMsQ0FBQztRQUMzRCxDQUFDLENBQUMsYUFBYSxDQUFFLHNCQUFzQixFQUFFLEVBQUUsQ0FBRSxDQUFDO0lBRS9DLENBQUM7SUFMZSxvQkFBSyxRQUtwQixDQUFBO0lBRUQsQ0FBQyxDQUFDLHlCQUF5QixDQUFFLGdCQUFnQixFQUFFLEtBQUssQ0FBRSxDQUFDO0FBRXhELENBQUMsRUFyQ1MsY0FBYyxLQUFkLGNBQWMsUUFxQ3ZCIn0=