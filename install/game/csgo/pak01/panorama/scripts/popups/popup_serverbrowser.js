"use strict";
/// <reference path="..\csgo.d.ts" />
var PopupServerBrowser;
(function (PopupServerBrowser) {
    function OnOpen() {
        UpdateNeverShowAgainSetting();
        if (MyPersonaAPI.GetLauncherType() === "perfectworld") {
            SteamOverlayAPI.OpenURL('https://csgo.wanmei.com/communityserver');
        }
        else {
            SteamOverlayAPI.OpenUrlInOverlayOrExternalBrowser('steam://open/servers');
        }
        $.DispatchEvent('UIPopupButtonClicked', '');
    }
    PopupServerBrowser.OnOpen = OnOpen;
    function Close() {
        UpdateNeverShowAgainSetting();
        $.DispatchEvent('UIPopupButtonClicked', '');
    }
    PopupServerBrowser.Close = Close;
    function UpdateNeverShowAgainSetting() {
        var elToggle = $.GetContextPanel().FindChildInLayoutFile('NeverShowToggle');
        if (elToggle.checked)
            GameInterfaceAPI.SetSettingString('player_nevershow_communityservermessage', '1');
    }
})(PopupServerBrowser || (PopupServerBrowser = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfc2VydmVyYnJvd3Nlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3BvcHVwcy9wb3B1cF9zZXJ2ZXJicm93c2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFFckMsSUFBVSxrQkFBa0IsQ0E2QjNCO0FBN0JELFdBQVUsa0JBQWtCO0lBRTNCLFNBQWdCLE1BQU07UUFFckIsMkJBQTJCLEVBQUUsQ0FBQztRQUM5QixJQUFLLFlBQVksQ0FBQyxlQUFlLEVBQUUsS0FBSyxjQUFjLEVBQ3REO1lBQ0MsZUFBZSxDQUFDLE9BQU8sQ0FBRSx5Q0FBeUMsQ0FBRSxDQUFDO1NBQ3JFO2FBRUQ7WUFDQyxlQUFlLENBQUMsaUNBQWlDLENBQUUsc0JBQXNCLENBQUUsQ0FBQztTQUM1RTtRQUNELENBQUMsQ0FBQyxhQUFhLENBQUUsc0JBQXNCLEVBQUUsRUFBRSxDQUFFLENBQUM7SUFDL0MsQ0FBQztJQVplLHlCQUFNLFNBWXJCLENBQUE7SUFFRCxTQUFnQixLQUFLO1FBRXBCLDJCQUEyQixFQUFFLENBQUM7UUFDOUIsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxzQkFBc0IsRUFBRSxFQUFFLENBQUUsQ0FBQztJQUMvQyxDQUFDO0lBSmUsd0JBQUssUUFJcEIsQ0FBQTtJQUVELFNBQVMsMkJBQTJCO1FBRW5DLElBQUksUUFBUSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxpQkFBaUIsQ0FBRSxDQUFDO1FBRTlFLElBQUksUUFBUSxDQUFDLE9BQU87WUFDbkIsZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUUseUNBQXlDLEVBQUUsR0FBRyxDQUFFLENBQUM7SUFDdEYsQ0FBQztBQUNGLENBQUMsRUE3QlMsa0JBQWtCLEtBQWxCLGtCQUFrQixRQTZCM0IifQ==