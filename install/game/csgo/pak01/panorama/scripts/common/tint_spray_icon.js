"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="iteminfo.ts" />
var TintSprayIcon;
(function (TintSprayIcon) {
    function CheckIsSprayAndTint(itemId, elImage) {
        if (ItemInfo.IsSprayPaint(itemId) || ItemInfo.IsSpraySealed(itemId)) {
            const colorTint = InventoryAPI.GetSprayTintColorCode(itemId);
            if (colorTint) {
                elImage.style.washColor = colorTint.toString();
            }
            else {
                elImage.style.washColor = 'none';
            }
        }
        else {
            elImage.style.washColor = 'none';
        }
    }
    TintSprayIcon.CheckIsSprayAndTint = CheckIsSprayAndTint;
})(TintSprayIcon || (TintSprayIcon = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGludF9zcHJheV9pY29uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvY29tbW9uL3RpbnRfc3ByYXlfaWNvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBQ3JDLG9DQUFvQztBQUlwQyxJQUFVLGFBQWEsQ0FzQnRCO0FBdEJELFdBQVUsYUFBYTtJQUV0QixTQUFnQixtQkFBbUIsQ0FBRSxNQUFjLEVBQUUsT0FBZ0I7UUFFcEUsSUFBSyxRQUFRLENBQUMsWUFBWSxDQUFFLE1BQU0sQ0FBRSxJQUFJLFFBQVEsQ0FBQyxhQUFhLENBQUUsTUFBTSxDQUFFLEVBQ3hFO1lBQ0MsTUFBTSxTQUFTLEdBQUcsWUFBWSxDQUFDLHFCQUFxQixDQUFFLE1BQU0sQ0FBRSxDQUFDO1lBRS9ELElBQUssU0FBUyxFQUNkO2dCQUNDLE9BQU8sQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQzthQUMvQztpQkFFRDtnQkFDQyxPQUFPLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUM7YUFDakM7U0FDRDthQUVEO1lBQ0MsT0FBTyxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDO1NBQ2pDO0lBQ0YsQ0FBQztJQW5CZSxpQ0FBbUIsc0JBbUJsQyxDQUFBO0FBQ0YsQ0FBQyxFQXRCUyxhQUFhLEtBQWIsYUFBYSxRQXNCdEIifQ==