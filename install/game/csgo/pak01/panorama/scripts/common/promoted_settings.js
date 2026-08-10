"use strict";
/// <reference path="../csgo.d.ts" />
var g_PromotedSettingsVersion = 1;
var g_PromotedSettings = [
    {
        id: "BuyMenuDonationKey",
        loc_name: "#SFUI_Settings_BuyWheelDonateKey",
        loc_desc: "#SFUI_Settings_BuyWheelDonateKey_Info",
        section: "GameSettings",
        start_date: new Date('December 17, 2020'),
        end_date: new Date('April 31, 2021'),
    },
    {
        id: "SettingsChatWheel",
        loc_name: "#settings_ui_chatwheel_section",
        loc_desc: "#Chatwheel_description",
        section: "KeybdMouseSettings",
        start_date: new Date('November 25, 2020'),
        end_date: new Date('April 30, 2021'),
    },
    {
        id: "SettingsCommunicationSettings",
        loc_name: "#SFUI_Settings_FilterText_Title",
        loc_desc: "#SFUI_Settings_FilterText_Title_Tooltip",
        section: "GameSettings",
        start_date: new Date('June 11, 2020'),
        end_date: new Date('June 30, 2020')
    },
    {
        id: "MainMenuMovieSceneSelector",
        loc_name: "#GameUI_MainMenuMovieScene",
        loc_desc: "#GameUI_MainMenuMovieScene_Tooltip",
        section: "VideoSettings",
        subsection: "SimpleVideoSettingsRadio",
        start_date: new Date('May 26, 2020'),
        end_date: new Date('June 15, 2020')
    },
    {
        id: "XhairShowObserverCrosshair",
        loc_name: "#GameUI_ShowObserverCrosshair",
        loc_desc: "#GameUI_ShowObserverCrosshair_Tooltip",
        section: "GameSettings",
        start_date: new Date('April 15, 2020'),
        end_date: new Date('May 1, 2020')
    },
    {
        id: "SettingsCrosshair",
        loc_name: "#settings_crosshair",
        loc_desc: "#settings_crosshair_info",
        section: "GameSettings",
        start_date: new Date('February 24, 2019'),
        end_date: new Date('March 28, 2020')
    },
    {
        id: "ClutchKey",
        loc_name: "#GameUI_Clutch_Key",
        loc_desc: "#GameUI_Clutch_Key_Tooltip",
        section: "KeybdMouseSettings",
        start_date: new Date('September 21, 2019'),
        end_date: new Date('January 30, 2020')
    },
    {
        id: "id-friendlyfirecrosshair",
        loc_name: "#GameUI_FriendlyWarning",
        loc_desc: "#GameUI_FriendlyWarning_desc",
        section: "GameSettings",
        start_date: new Date('October 7, 2019'),
        end_date: new Date('February 30, 2020')
    },
    {
        id: "SettingsCommunicationSettings",
        loc_name: "#settings_comm_binds_section",
        loc_desc: "#settings_comm_binds_info",
        section: "GameSettings",
        start_date: new Date('September 13, 2019'),
        end_date: new Date('January 30, 2020')
    },
    {
        id: "RadialWepMenuBinder",
        loc_name: "#SFUI_RadialWeaponMenu",
        loc_desc: "#SFUI_RadialWeaponMenu_Desc",
        section: "KeybdMouseSettings",
        start_date: new Date('September 18, 2019'),
        end_date: new Date('January 30, 2020')
    },
    {
        id: "XhairRecoil",
        loc_name: "#GameUI_CrosshairRecoil",
        loc_desc: "#GameUI_CrosshairRecoil_Desc",
        section: "GameSettings",
        start_date: new Date('August 21, 2023'),
        end_date: new Date('January 30, 2024')
    },
    {
        id: "ZoomButtonHold",
        loc_name: "#ZoomButtonHold",
        loc_desc: "#ZoomButtonHold_Desc",
        section: "KeybdMouseSettings",
        start_date: new Date('August 21, 2023'),
        end_date: new Date('January 30, 2024')
    },
    {
        id: "FiddleWithSilencers",
        loc_name: "#Cstrike_Fiddle_With_Silencers",
        loc_desc: "#Cstrike_Fiddle_With_Silencers_Desc",
        section: "GameSettings",
        start_date: new Date('August 21, 2023'),
        end_date: new Date('January 30, 2024')
    },
    {
        id: "AllowAnimatedAvatars",
        loc_name: "#Settings_AllowAnimatedAvatars_Title",
        loc_desc: "#Settings_AllowAnimatedAvatars_Title_Tooltip",
        section: "GameSettings",
        start_date: new Date('September 12, 2023'),
        end_date: new Date('January 30, 2024')
    },
    {
        id: "ReplaceAvatarsWithPlayerCount",
        loc_name: "#SFUI_Settings_MiniScoreboardPlayerCount",
        loc_desc: "#SFUI_Settings_MiniScoreboardPlayerCount_Tooltip",
        section: "GameSettings",
        start_date: new Date('October 11, 2023'),
        end_date: new Date('January 30, 2024')
    },
    {
        id: "FirstPersonTracers",
        loc_name: "#Cstrike_FirstPersonTracers",
        loc_desc: "#Cstrike_FirstPersonTracers_Desc",
        section: "GameSettings",
        start_date: new Date('January 19, 2024'),
        end_date: new Date('February 28, 2024')
    },
    {
        id: "ExtraBufffering",
        loc_name: "#SFUI_Settings_Network_ExtraBuffering",
        loc_desc: "#SFUI_Settings_Network_ExtraBuffering_Info",
        section: "GameSettings",
        start_date: new Date('February 6, 2024'),
        end_date: new Date('April 22, 2024')
    },
    {
        id: "SettingsTelemetry",
        loc_name: "#settings_telemetry_section",
        loc_desc: "#settings_telemetry_section_info",
        section: "GameSettings",
        start_date: new Date('February 6, 2024'),
        end_date: new Date('April 22, 2024')
    },
    {
        id: "PreferredHandedness",
        loc_name: "#Cstrike_PreferredHandedness",
        loc_desc: "#Cstrike_PreferredHandedness_Desc",
        section: "GameSettings",
        start_date: new Date('April 22, 2024'),
        end_date: new Date('June 1, 2024')
    },
    {
        id: "RadarScaleToggle",
        loc_name: "#SFUI_Settings_Radar_Scale_Alternate",
        loc_desc: "#SFUI_Settings_Radar_Scale_Alternate_Info",
        section: "GameSettings",
        start_date: new Date('April 22, 2024'),
        end_date: new Date('June 1, 2024')
    },
    {
        id: "SettingsGrenadeCrosshair",
        loc_name: "#settings_grenadecrosshair",
        loc_desc: "#settings_grenadecrosshair_info",
        section: "GameSettings",
        start_date: new Date('April 22, 2024'),
        end_date: new Date('June 1, 2024')
    },
    {
        id: "DynamicShadowsContainer",
        loc_name: "#SFUI_Settings_DynamicShadows",
        loc_desc: "#SFUI_Settings_DynamicShadows_Info",
        section: "VideoSettings",
        subsection: "AdvancedVideoSettingsRadio",
        start_date: new Date('June 1, 2024'),
        end_date: new Date('July 1, 2024')
    },
    {
        id: "RadarBackgroundOpacity",
        loc_name: "#SFUI_Settings_HUD_Radar_Background_Alpha",
        loc_desc: "#SFUI_Settings_HUD_Radar_Background_Alpha_Info",
        section: "GameSettings",
        start_date: new Date('November 1, 2024'),
        end_date: new Date('January 1, 2025')
    },
    {
        id: "RadarMapBlend",
        loc_name: "#SFUI_Settings_HUD_Radar_Map_Additive",
        loc_desc: "#SFUI_Settings_HUD_Radar_Map_Additive_Info",
        section: "GameSettings",
        start_date: new Date('November 1, 2024'),
        end_date: new Date('January 1, 2025')
    },
    {
        id: "SettingsDamagePrediction",
        loc_name: "#settings_damage_prediction",
        loc_desc: "#settings_damage_prediction_info",
        section: "GameSettings",
        start_date: new Date('November 1, 2024'),
        end_date: new Date('January 1, 2025')
    },
    {
        id: "RadarScaleDynamic",
        loc_name: "#SFUI_Settings_Radar_Scale_Dynamic",
        loc_desc: "#SFUI_Settings_Radar_Scale_Dynamic_Info",
        section: "GameSettings",
        start_date: new Date('January 27, 2025'),
        end_date: new Date('March 1, 2025')
    },
    {
        id: "RadarShapeSquare",
        loc_name: "#SFUI_Settings_Radar_Shape_Square",
        loc_desc: "#SFUI_Settings_Radar_Shape_Square_Info",
        section: "GameSettings",
        start_date: new Date('January 27, 2025'),
        end_date: new Date('March 1, 2025')
    },
    {
        id: "RadarBlurBackground",
        loc_name: "#SFUI_Settings_Radar_Blur_Background",
        loc_desc: "#SFUI_Settings_Radar_Blur_Background_Info",
        section: "GameSettings",
        start_date: new Date('January 27, 2025'),
        end_date: new Date('March 1, 2025')
    },
    {
        id: "WeaponRarityColor",
        loc_name: "#SFUI_HUDWeaponRarityColor",
        loc_desc: "#SFUI_HUDWeaponRarityColor_desc",
        section: "GameSettings",
        start_date: new Date('January 27, 2025'),
        end_date: new Date('June 1, 2025')
    },
]
    .reverse();
var PromotedSettingsUtil;
(function (PromotedSettingsUtil) {
    function GetUnacknowledgedPromotedSettings() {
        {
            const now = new Date();
            return g_PromotedSettings.filter(setting => setting.start_date <= now && setting.end_date > now);
        }
    }
    PromotedSettingsUtil.GetUnacknowledgedPromotedSettings = GetUnacknowledgedPromotedSettings;
    const hPromotedSettingsViewedEvt = $.RegisterForUnhandledEvent("MainMenu_PromotedSettingsViewed", () => {
        GameInterfaceAPI.SetSettingString("cl_promoted_settings_acknowledged", "" + g_PromotedSettingsVersion + ":" + Date.now());
        $.UnregisterForUnhandledEvent("MainMenu_PromotedSettingsViewed", hPromotedSettingsViewedEvt);
    });
})(PromotedSettingsUtil || (PromotedSettingsUtil = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvbW90ZWRfc2V0dGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9jb21tb24vcHJvbW90ZWRfc2V0dGluZ3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUdyQyxJQUFJLHlCQUF5QixHQUFHLENBQUMsQ0FBQztBQWNsQyxJQUFJLGtCQUFrQixHQUF3QjtJQWlCN0M7UUFDQyxFQUFFLEVBQUUsb0JBQW9CO1FBQ3hCLFFBQVEsRUFBRSxrQ0FBa0M7UUFDNUMsUUFBUSxFQUFFLHVDQUF1QztRQUNqRCxPQUFPLEVBQUUsY0FBYztRQUN2QixVQUFVLEVBQUUsSUFBSSxJQUFJLENBQUUsbUJBQW1CLENBQUU7UUFDM0MsUUFBUSxFQUFFLElBQUksSUFBSSxDQUFFLGdCQUFnQixDQUFFO0tBQ3RDO0lBQ0Q7UUFDQyxFQUFFLEVBQUUsbUJBQW1CO1FBQ3ZCLFFBQVEsRUFBRSxnQ0FBZ0M7UUFDMUMsUUFBUSxFQUFFLHdCQUF3QjtRQUNsQyxPQUFPLEVBQUUsb0JBQW9CO1FBQzdCLFVBQVUsRUFBRSxJQUFJLElBQUksQ0FBRSxtQkFBbUIsQ0FBRTtRQUMzQyxRQUFRLEVBQUUsSUFBSSxJQUFJLENBQUUsZ0JBQWdCLENBQUU7S0FDdEM7SUFDRDtRQUNDLEVBQUUsRUFBRSwrQkFBK0I7UUFHbkMsUUFBUSxFQUFFLGlDQUFpQztRQUMzQyxRQUFRLEVBQUUseUNBQXlDO1FBQ25ELE9BQU8sRUFBRSxjQUFjO1FBQ3ZCLFVBQVUsRUFBRSxJQUFJLElBQUksQ0FBRSxlQUFlLENBQUU7UUFDdkMsUUFBUSxFQUFFLElBQUksSUFBSSxDQUFFLGVBQWUsQ0FBRTtLQUNyQztJQUNEO1FBQ0MsRUFBRSxFQUFFLDRCQUE0QjtRQUNoQyxRQUFRLEVBQUUsNEJBQTRCO1FBQ3RDLFFBQVEsRUFBRSxvQ0FBb0M7UUFDOUMsT0FBTyxFQUFFLGVBQWU7UUFDeEIsVUFB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