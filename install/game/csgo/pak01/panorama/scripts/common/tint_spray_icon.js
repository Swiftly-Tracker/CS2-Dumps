"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="iteminfo.ts" />
//This file contains functions that helps setting up map icon
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGludF9zcHJheV9pY29uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvY29tbW9uL3RpbnRfc3ByYXlfaWNvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBQ3JDLG9DQUFvQztBQUVwQyw2REFBNkQ7QUFFN0QsSUFBVSxhQUFhLENBc0J0QjtBQXRCRCxXQUFVLGFBQWE7SUFFdEIsU0FBZ0IsbUJBQW1CLENBQUUsTUFBYyxFQUFFLE9BQWdCO1FBRXBFLElBQUssUUFBUSxDQUFDLFlBQVksQ0FBRSxNQUFNLENBQUUsSUFBSSxRQUFRLENBQUMsYUFBYSxDQUFFLE1BQU0sQ0FBRSxFQUN4RTtZQUNDLE1BQU0sU0FBUyxHQUFHLFlBQVksQ0FBQyxxQkFBcUIsQ0FBRSxNQUFNLENBQUUsQ0FBQztZQUUvRCxJQUFLLFNBQVMsRUFDZDtnQkFDQyxPQUFPLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUMsUUFBUSxFQUFFLENBQUM7YUFDL0M7aUJBRUQ7Z0JBQ0MsT0FBTyxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDO2FBQ2pDO1NBQ0Q7YUFFRDtZQUNDLE9BQU8sQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQztTQUNqQztJQUNGLENBQUM7SUFuQmUsaUNBQW1CLHNCQW1CbEMsQ0FBQTtBQUNGLENBQUMsRUF0QlMsYUFBYSxLQUFiLGFBQWEsUUFzQnRCIn0=