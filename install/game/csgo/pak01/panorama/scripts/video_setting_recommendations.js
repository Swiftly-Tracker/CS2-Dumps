"use strict";
/// <reference path="csgo.d.ts" />
var VideoSettingRecommendations;
(function (VideoSettingRecommendations) {
    function MaybeShowPopup() {
        let driverInfo = GameInterfaceAPI.GetGraphicsDriverInfo();
        if (MaybeShowGraphicsDriverPopup(driverInfo))
            return true;
        let vrrStatus = GameInterfaceAPI.GetVariableRefreshRateStatus();
        if (MaybeShowVariableRefreshRatePopup(driverInfo, vrrStatus))
            return true;
        let currDisplayMode = GameInterfaceAPI.GetCurrentDisplayMode();
        let allDisplayModes = GameInterfaceAPI.GetAllDisplayModes();
        if (MaybeShowRefreshRatePopup(currDisplayMode, allDisplayModes))
            return true;
        let lowLatencyType = GameInterfaceAPI.GetRenderLowLatencyType();
        let config = GameInterfaceAPI.GetVideoConfig();
        if (MaybeShowLowLatencyVSyncPopup(vrrStatus, lowLatencyType, config))
            return true;
        return false;
    }
    VideoSettingRecommendations.MaybeShowPopup = MaybeShowPopup;
    function MaybeShowGraphicsDriverPopup(driverInfo) {
        if (!driverInfo.driver_out_of_date)
            return false;
        if (GameInterfaceAPI.GetSettingString('cl_graphics_driver_warning_dont_show_again') !== '0')
            return false;
        switch (driverInfo.vendor_id) {
            case 0x1002:
                {
                    ShowGraphicsDriverPopup("AMD", 'https://amd.com/support');
                    return true;
                }
            case 0x10DE:
                {
                    ShowGraphicsDriverPopup("Nvidia", 'https://nvidia.com/drivers');
                    return true;
                }
            default:
                {
                    return false;
                }
        }
    }
    function ShowGraphicsDriverPopup(vendor, link) {
        UiToolkitAPI.ShowGenericPopupThreeOptions('#PlayMenu_GraphicsDriverWarning_Title', '#PlayMenu_GraphicsDriverWarning_' + vendor, '', '#PlayMenu_GraphicsDriverLink_' + vendor, () => {
            SteamOverlayAPI.OpenExternalBrowserURL(link);
        }, '#PlayMenu_GraphicsDriverWarning_DontShowAgain', () => {
            GameInterfaceAPI.SetSettingString('cl_graphics_driver_warning_dont_show_again', '1');
        }, '#OK', () => { });
    }
    function MaybeShowVariableRefreshRatePopup(driverInfo, vrrStatus) {
        if (vrrStatus !== 'inactive')
            return false;
        if (GameInterfaceAPI.GetSettingString('cl_vrr_recommendation_dont_show_again') !== '0')
            return false;
        switch (driverInfo.vendor_id) {
            case 0x10DE:
                {
                    if (GameInterfaceAPI.HasCommandLineParm("-tools"))
                        return false;
                    ShowVariableRefreshRatePopup("Nvidia", $.Localize('#GSyncHelpLinkURL'));
                    return true;
                }
            default:
                {
                    return false;
                }
        }
    }
    function ShowVariableRefreshRatePopup(vendor, link) {
        UiToolkitAPI.ShowGenericPopupThreeOptions('#SettingsRecommendation', '#VariableRefreshRateRecommendation_' + vendor, '', '#PlayMenu_GraphicsDriverLink_' + vendor, () => {
            SteamOverlayAPI.OpenExternalBrowserURL(link);
        }, '#PlayMenu_GraphicsDriverWarning_DontShowAgain', () => {
            GameInterfaceAPI.SetSettingString('cl_vrr_recommendation_dont_show_again', '1');
        }, '#OK', () => { });
    }
    function MaybeShowRefreshRatePopup(currDisplayMode, allDisplayModes) {
        if (!currDisplayMode)
            return false;
        if (GameInterfaceAPI.GetSettingString('cl_refresh_rate_recommendation_dont_show_again') !== '0')
            return false;
        let maxRefreshRate = 0;
        for (let mode of allDisplayModes) {
            if (mode.width == currDisplayMode.width &&
                mode.height == currDisplayMode.height &&
                mode.refresh_rate > maxRefreshRate) {
                maxRefreshRate = mode.refresh_rate;
            }
        }
        if (currDisplayMode.refresh_rate > maxRefreshRate * 0.9)
            return false;
        let elPanel = $.GetContextPanel();
        elPanel.SetDialogVariableInt('curr_refresh_rate', Math.round(currDisplayMode.refresh_rate));
        elPanel.SetDialogVariableInt('max_refresh_rate', Math.round(maxRefreshRate));
        UiToolkitAPI.ShowGenericPopupTwoOptions('#SettingsRecommendation', $.Localize('#RefreshRateRecommendation', elPanel), '', '#PlayMenu_GraphicsDriverWarning_DontShowAgain', () => {
            GameInterfaceAPI.SetSettingString('cl_refresh_rate_recommendation_dont_show_again', '1');
        }, '#OK', () => { });
        return true;
    }
    function MaybeShowLowLatencyVSyncPopup(vrrStatus, lowLatencyType, config) {
        if ((vrrStatus !== 'active') ||
            (lowLatencyType !== 'nvidia_reflex') ||
            (config.vsync === true && config.low_latency !== 0)) {
            return false;
        }
        if (GameInterfaceAPI.GetSettingString('cl_low_latency_vsync_recommendation_dont_show_again') !== '0')
            return false;
        UiToolkitAPI.ShowGenericPopupThreeOptions('#SettingsRecommendation', '#LowLatencyVSyncRecommendation_Nvidia', '', '#settings_apply_video', () => {
            $.DispatchEvent('OpenSettingsMenu');
            $.DispatchEvent('SettingsMenu_NavigateToSetting', 'VideoSettings', 'AdvancedVideoSettingsRadio', 'VSyncPanel');
            $.DispatchEvent('CSGOApplyLowLatencyVSyncRecommendation');
        }, '#PlayMenu_GraphicsDriverWarning_DontShowAgain', () => {
            GameInterfaceAPI.SetSettingString('cl_low_latency_vsync_recommendation_dont_show_again', '1');
        }, '#OK', () => { });
        return true;
    }
})(VideoSettingRecommendations || (VideoSettingRecommendations = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlkZW9fc2V0dGluZ19yZWNvbW1lbmRhdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy92aWRlb19zZXR0aW5nX3JlY29tbWVuZGF0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBRWxDLElBQVUsMkJBQTJCLENBd0xwQztBQXhMRCxXQUFVLDJCQUEyQjtJQUVwQyxTQUFnQixjQUFjO1FBRTdCLElBQUksVUFBVSxHQUFHLGdCQUFnQixDQUFDLHFCQUFxQixFQUFFLENBQUM7UUFDMUQsSUFBSyw0QkFBNEIsQ0FBRSxVQUFVLENBQUU7WUFDOUMsT0FBTyxJQUFJLENBQUM7UUFFYixJQUFJLFNBQVMsR0FBRyxnQkFBZ0IsQ0FBQyw0QkFBNEIsRUFBRSxDQUFDO1FBQ2hFLElBQUssaUNBQWlDLENBQUUsVUFBVSxFQUFFLFNBQVMsQ0FBRTtZQUM5RCxPQUFPLElBQUksQ0FBQztRQUViLElBQUksZUFBZSxHQUFHLGdCQUFnQixDQUFDLHFCQUFxQixFQUFFLENBQUM7UUFDL0QsSUFBSSxlQUFlLEdBQUcsZ0JBQWdCLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztRQUM1RCxJQUFLLHlCQUF5QixDQUFFLGVBQWUsRUFBRSxlQUFlLENBQUU7WUFDakUsT0FBTyxJQUFJLENBQUM7UUFFYixJQUFJLGNBQWMsR0FBRyxnQkFBZ0IsQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1FBQ2hFLElBQUksTUFBTSxHQUFHLGdCQUFnQixDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQy9DLElBQUssNkJBQTZCLENBQUUsU0FBUyxFQUFFLGNBQWMsRUFBRSxNQUFNLENBQUU7WUFDdEUsT0FBTyxJQUFJLENBQUM7UUFFYixPQUFPLEtBQUssQ0FBQztJQUNkLENBQUM7SUFyQmUsMENBQWMsaUJBcUI3QixDQUFBO0lBRUQsU0FBUyw0QkFBNEIsQ0FBRSxVQUFnQztRQUV0RSxJQUFL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