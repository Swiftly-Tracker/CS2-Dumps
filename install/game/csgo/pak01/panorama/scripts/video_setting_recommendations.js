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
            case 0x1002: // ATI (AMD)
                {
                    ShowGraphicsDriverPopup("AMD", 'https://amd.com/support');
                    return true;
                }
            case 0x10DE: // Nvidia
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
            case 0x10DE: // Nvidia
                {
                    // G-Sync doesn't work in tools mode so don't bother suggesting it.
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
        // Recommend V-Sync + Reflex when G-Sync is enabled
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