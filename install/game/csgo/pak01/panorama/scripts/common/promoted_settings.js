"use strict";
/// <reference path="../csgo.d.ts" />
// Bump version when you want the entire array below to appear new or if the viewed setting bookkeeping changes enough to warrant it.
var g_PromotedSettingsVersion = 1;
var g_PromotedSettings = [
    /*
        // Data about settings to show in the promoted settings menu.
        // Will make panels with a link to take user to the new setting.
        // These entries are in the order they will appear in the menu.
        // New entries can be put anywhere in the array.
        //
        // Required keys to populate snippets:
        id: ID of element in a settings menu to promote to the front tab for easier visibility.
        loc_name: Loc string to show in the new settings tab.
        loc_desc: Description of the settings being promoted.
        section: ID of Settings section panel where the 'id' above is a child panel.
        start_date: Date when this setting is added to the promoted setting menu (approx). Will show main menu indicator to users
                    whose local timestamp is before this date.
        end_date: Will no longer populate in the new setting menu after this date. Entries with a end_date in the past
                    are safe to remove from the array.
    */
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
        //loc_name: "#settings_comm_binds_section",
        //loc_desc: "#settings_comm_binds_info",
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
    {
        id: "XhairStyle",
        loc_name: "#settings_crosshair",
        loc_desc: "#settings_crosshair_info",
        section: "CrosshairSettings",
        start_date: new Date('September 21, 2026'),
        end_date: new Date('December 1, 2026')
    },
]
    .reverse();
var PromotedSettingsUtil;
(function (PromotedSettingsUtil) {
    function GetUnacknowledgedPromotedSettings() {
        // const settingsInfo = GameInterfaceAPI.GetSettingString( "cl_promoted_settings_acknowledged" ).split( ':' );
        // const version = parseInt( settingsInfo.shift()! );
        // // Dont do any acknowledging for initial CS2 launch
        // if ( version === g_PromotedSettingsVersion )
        // {
        // 	const arrNewSettings: PromotedSetting_t[] = [];
        // 	// Second value is date last viewed a new setting
        // 	const timeLastViewed = new Date( parseInt( settingsInfo.shift()! ) );
        // 	for ( const setting of g_PromotedSettings )
        // 	{
        // 		const now = new Date();
        // 		if ( setting.start_date > timeLastViewed && setting.start_date <= now )
        // 			arrNewSettings.push( setting );
        // 	}
        // 	return arrNewSettings;
        // }
        // else
        {
            // Convar not up to date with code. Fix up old version if possible, otherwise
            // just show every setting in a valid date range.
            const now = new Date();
            return g_PromotedSettings.filter(setting => setting.start_date <= now && setting.end_date > now);
        }
    }
    PromotedSettingsUtil.GetUnacknowledgedPromotedSettings = GetUnacknowledgedPromotedSettings;
    // Update notification on main menu settings button when settings are viewed, then unregister.
    const hPromotedSettingsViewedEvt = $.RegisterForUnhandledEvent("MainMenu_PromotedSettingsViewed", () => {
        // Save dismissal
        GameInterfaceAPI.SetSettingString("cl_promoted_settings_acknowledged", "" + g_PromotedSettingsVersion + ":" + Date.now());
        $.UnregisterForUnhandledEvent("MainMenu_PromotedSettingsViewed", hPromotedSettingsViewedEvt);
    });
})(PromotedSettingsUtil || (PromotedSettingsUtil = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvbW90ZWRfc2V0dGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9jb21tb24vcHJvbW90ZWRfc2V0dGluZ3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUVyQyxxSUFBcUk7QUFDckksSUFBSSx5QkFBeUIsR0FBRyxDQUFDLENBQUM7QUFjbEMsSUFBSSxrQkFBa0IsR0FBd0I7SUFDN0M7Ozs7Ozs7Ozs7Ozs7OztNQWVFO0lBQ0Y7UUFDQyxFQUFFLEVBQUUsb0JBQW9CO1FBQ3hCLFFBQVEsRUFBRSxrQ0FBa0M7UUFDNUMsUUFBUSxFQUFFLHVDQUF1QztRQUNqRCxPQUFPLEVBQUUsY0FBYztRQUN2QixVQUFVLEVBQUUsSUFBSSxJQUFJLENBQUUsbUJBQW1CLENBQUU7UUFDM0MsUUFBUSxFQUFFLElBQUksSUFBSSxDQUFFLGdCQUFnQixDQUFFO0tBQ3RDO0lBQ0Q7UUFDQyxFQUFFLEVBQUUsbUJBQW1CO1FBQ3ZCLFFBQVEsRUFBRSxnQ0FBZ0M7UUFDMUMsUUFBUSxFQUFFLHdCQUF3QjtRQUNsQyxPQUFPLEVBQUUsb0JBQW9CO1FBQzdCLFVBQVUsRUFBRSxJQUFJLElBQUksQ0FBRSxtQkFBbUIsQ0FBRTtRQUMzQyxRQUFRLEVBQUUsSUFBSSxJQUFJLENBQUUsZ0JBQWdCLENBQUU7S0FDdEM7SUFDRDtRQUNDLEVBQUUsRUFBRSwrQkFBK0I7UUFDbkMsMkNBQTJDO1FBQzNDLHdDQUF3QztRQUN4QyxRQUFRLEVBQUUsaUNBQWlDO1FBQzNDLFFBQVEsRUFBRSx5Q0FBeUM7UUFDbkQsT0FBTyxFQUFFLGNBQWM7UUFDdkIsVUFBVSxFQUFFLElBQUksSUFBSSxDQUFFLGVBQWUsQ0FBRTtRQUN2QyxRQUFRLEVBQUUsSUFBSSxJQUFJLENBQUUsZUFBZSxDQUFFO0tBQ3JDO0lBQ0Q7UUFDQyxFQUFFLEVBQUUsNEJBQTRCO1FBQ2hDLFFBQVEsRUFBRSw0QkFBNEI7UUFDdEMsUUFBUSxFQUFFLG9DQUFvQztRQUM5QyxPQUFPLEVBQUUsZUFBZTtRQUN4QixVQUFVLEVBQUUsMEJBQTBCO1FBQ3RDLFVBQVUsRUFBRSxJQUFJLElBQUksQ0FBRSxjQUFjLENBQUU7UUFDdEMsUUFBUSxFQUFFLElBQUksSUFBSSxDQUFFLGVBQWUsQ0FBRTtLQUNyQztJQUNEO1FBQ0MsRUFBRSxFQUFFLDRCQUE0QjtRQUNoQyxRQUFRLEVBQUUsK0JBQStCO1FBQ3pDLFFBQVEsRUFBRSx1Q0FBdUM7UUFDakQsT0FBTyxFQUFFLGNBQWM7UUFDdkIsVUFBVSxFQUFFLElBQUksSUFBSSxDQUFFLGdCQUFnQixDQUFFO1FBQ3hDLFFBQVEsRUFBRSxJQUFJLElBQUksQ0FBRSxhQUFhLENBQUU7S0FDbkM7SUFDRDtRQUNDLEVBQUUsRUFBRSxtQkFBbUI7UUFDdkIsUUFBUSxFQUFFLHFCQUFxQjtRQUMvQixRQUFRLEVBQUUsMEJBQTBCO1FBQ3BDLE9BQU8sRUFBRSxjQUFjO1FBQ3ZCLFVBQVUsRUFBRSxJQUFJLElBQUksQ0FBRSxtQkFBbUIsQ0FBRTtRQUMzQyxRQUFRLEVBQUUsSUFBSSxJQUFJLENBQUUsZ0JBQWdCLENBQUU7S0FDdEM7SUFDRDtRQUNDLEVBQUUsRUFBRSxXQUFXO1FBQ2YsUUFBUSxFQUFFLG9CQUFvQjtRQUM5QixRQUFRLEVBQUUsNEJBQTRCO1FBQ3RDLE9BQU8sRUFBRSxvQkFBb0I7UUFDN0IsVUFBVSxFQUFFLElBQUksSUFBSSxDQUFFLG9CQUFvQixDQUFFO1FBQzVDLFFBQVEsRUFBRSxJQUFJLElBQUksQ0FBRSxrQkFBa0IsQ0FBRTtLQUN4QztJQUNEO1FBQ0MsRUFBRSxFQUFFLDBCQUEwQjtRQUM5QixRQUFRLEVBQUUseUJBQXlCO1FBQ25DLFFBQVEsRUFBRSw4QkFBOEI7UUFDeEMsT0FBTyxFQUFFLGNBQWM7UUFDdkIsVUFBVSxFQUFFLElBQUksSUFBSSxDQUFFLGlCQUFpQixDQUFFO1FBQ3pDLFFBQVEsRUFBRSxJQUFJLElBQUksQ0FBRSxtQkFBbUIsQ0FBRTtLQUN6QztJQUNEO1FBQ0MsRUFBRSxFQUFFLCtCQUErQjtRQUNuQyxRQUFRLEVBQUUsOEJBQThCO1FBQ3hDLFFBQVEsRUFBRSwyQkFBMkI7UUFDckMsT0FBTyxFQUFFLGNBQWM7UUFDdkIsVUFBVSxFQUFFLElBQUksSUFBSSxDQUFFLG9CQUFvQixDQUFFO1FBQzVDLFFBQVEsRUFBRSxJQUFJLElBQUksQ0FBRSxrQkFBa0IsQ0FBRTtLQUN4QztJQUNEO1FBQ0MsRUFBRSxFQUFFLHFCQUFxQjtRQUN6QixRQUFRLEVBQUUsd0JBQXdCO1FBQ2xDLFFBQVEsRUFBRSw2QkFBNkI7UUFDdkMsT0FBTyxFQUFFLG9CQUFvQjtRQUM3QixVQUFVLEVBQUUsSUFBSSxJQUFJLENBQUUsb0JBQW9CLENBQUU7UUFDNUMsUUFBUSxFQUFFLElBQUksSUFBSSxDQUFFLGtCQUFrQixDQUFFO0tBQ3hDO0lBQ0Q7UUFDQyxFQUFFLEVBQUUsYUFBYTtRQUNqQixRQUFRLEVBQUUseUJBQXlCO1FBQ25DLFFBQVEsRUFBRSw4QkFBOEI7UUFDeEMsT0FBTyxFQUFFLGNBQWM7UUFDdkIsVUFBVSxFQUFFLElBQUksSUFBSSxDQUFFLGlCQUFpQixDQUFFO1FBQ3pDLFFBQVEsRUFBRSxJQUFJLElBQUksQ0FBRSxrQkFBa0IsQ0FBRTtLQUN4QztJQUNEO1FBQ0MsRUFBRSxFQUFFLGdCQUFnQjtRQUNwQixRQUFRLEVBQUUsaUJBQWlCO1FBQzNCLFFBQVEsRUFBRSxzQkFBc0I7UUFDaEMsT0FBTyxFQUFFLG9CQUFvQjtRQUM3QixVQUFVLEVBQUUsSUFBSSxJQUFJLENBQUUsaUJBQWlCLENBQUU7UUFDekMsUUFBUSxFQUFFLElBQUksSUFBSSxDQUFFLGtCQUFrQixDQUFFO0tBQ3hDO0lBQ0Q7UUFDQyxFQUFFLEVBQUUscUJBQXFCO1FBQ3pCLFFBQVEsRUFBRSxnQ0FBZ0M7UUFDMUMsUUFBUSxFQUFFLHFDQUFxQztRQUMvQyxPQUFPLEVBQUUsY0FBYztRQUN2QixVQUFVLEVBQUUsSUFBSSxJQUFJLENBQUUsaUJBQWlCLENBQUU7UUFDekMsUUFBUSxFQUFFLElBQUksSUFBSSxDQUFFLGtCQUFrQixDQUFFO0tBQ3hDO0lBQ0Q7UUFDQyxFQUFFLEVBQUUsc0JBQXNCO1FBQzFCLFFBQVEsRUFBRSxzQ0FBc0M7UUFDaEQsUUFBUSxFQUFFLDhDQUE4QztRQUN4RCxPQUFPLEVBQUUsY0FBYztRQUN2QixVQUFVLEVBQUUsSUFBSSxJQUFJLENBQUUsb0JBQW9CLENBQUU7UUFDNUMsUUFBUSxFQUFFLElBQUksSUFBSSxDQUFFLGtCQUFrQixDQUFFO0tBQ3hDO0lBQ0Q7UUFDQyxFQUFFLEVBQUUsK0JBQStCO1FBQ25DLFFBQVEsRUFBRSwwQ0FBMEM7UUFDcEQsUUFBUSxFQUFFLGtEQUFrRDtRQUM1RCxPQUFPLEVBQUUsY0FBYztRQUN2QixVQUFVLEVBQUUsSUFBSSxJQUFJLENBQUUsa0JBQWtCLENBQUU7UUFDMUMsUUFBUSxFQUFFLElBQUksSUFBSSxDQUFFLGtCQUFrQixDQUFFO0tBQ3hDO0lBQ0Q7UUFDQyxFQUFFLEVBQUUsb0JBQW9CO1FBQ3hCLFFBQVEsRUFBRSw2QkFBNkI7UUFDdkMsUUFBUSxFQUFFLGtDQUFrQztRQUM1QyxPQUFPLEVBQUUsY0FBYztRQUN2QixVQUFVLEVBQUUsSUFBSSxJQUFJLENBQUUsa0JBQWtCLENBQUU7UUFDMUMsUUFBUSxFQUFFLElBQUksSUFBSSxDQUFFLG1CQUFtQixDQUFFO0tBQ3pDO0lBQ0Q7UUFDQyxFQUFFLEVBQUUsaUJBQWlCO1FBQ3JCLFFBQVEsRUFBRSx1Q0FBdUM7UUFDakQsUUFBUSxFQUFFLDRDQUE0QztRQUN0RCxPQUFPLEVBQUUsY0FBYztRQUN2QixVQUFVLEVBQUUsSUFBSSxJQUFJLENBQUUsa0JBQWtCLENBQUU7UUFDMUMsUUFBUSxFQUFFLElBQUksSUFBSSxDQUFFLGdCQUFnQixDQUFFO0tBQ3RDO0lBQ0Q7UUFDQyxFQUFFLEVBQUUsbUJBQW1CO1FBQ3ZCLFFBQVEsRUFBRSw2QkFBNkI7UUFDdkMsUUFBUSxFQUFFLGtDQUFrQztRQUM1QyxPQUFPLEVBQUUsY0FBYztRQUN2QixVQUFVLEVBQUUsSUFBSSxJQUFJLENBQUUsa0JBQWtCLENBQUU7UUFDMUMsUUFBUSxFQUFFLElBQUksSUFBSSxDQUFFLGdCQUFnQixDQUFFO0tBQ3RDO0lBQ0Q7UUFDQyxFQUFFLEVBQUUscUJBQXFCO1FBQ3pCLFFBQVEsRUFBRSw4QkFBOEI7UUFDeEMsUUFBUSxFQUFFLG1DQUFtQztRQUM3QyxPQUFPLEVBQUUsY0FBYztRQUN2QixVQUFVLEVBQUUsSUFBSSxJQUFJLENBQUUsZ0JBQWdCLENBQUU7UUFDeEMsUUFBUSxFQUFFLElBQUksSUFBSSxDQUFFLGNBQWMsQ0FBRTtLQUNwQztJQUNEO1FBQ0MsRUFBRSxFQUFFLGtCQUFrQjtRQUN0QixRQUFRLEVBQUUsc0NBQXNDO1FBQ2hELFFBQVEsRUFBRSwyQ0FBMkM7UUFDckQsT0FBTyxFQUFFLGNBQWM7UUFDdkIsVUFBVSxFQUFFLElBQUksSUFBSSxDQUFFLGdCQUFnQixDQUFFO1FBQ3hDLFFBQVEsRUFBRSxJQUFJLElBQUksQ0FBRSxjQUFjLENBQUU7S0FDcEM7SUFDRDtRQUNDLEVBQUUsRUFBRSwwQkFBMEI7UUFDOUIsUUFBUSxFQUFFLDRCQUE0QjtRQUN0QyxRQUFRLEVBQUUsaUNBQWlDO1FBQzNDLE9BQU8sRUFBRSxjQUFjO1FBQ3ZCLFVBQVUsRUFBRSxJQUFJLElBQUksQ0FBRSxnQkFBZ0IsQ0FBRTtRQUN4QyxRQUFRLEVBQUUsSUFBSSxJQUFJLENBQUUsY0FBYyxDQUFFO0tBQ3BDO0lBQ0Q7UUFDQyxFQUFFLEVBQUUseUJBQXlCO1FBQzdCLFFBQVEsRUFBRSwrQkFBK0I7UUFDekMsUUFBUSxFQUFFLG9DQUFvQztRQUM5QyxPQUFPLEVBQUUsZUFBZTtRQUN4QixVQUFVLEVBQUUsNEJBQTRCO1FBQ3hDLFVBQVUsRUFBRSxJQUFJLElBQUksQ0FBRSxjQUFjLENBQUU7UUFDdEMsUUFBUSxFQUFFLElBQUksSUFBSSxDQUFFLGNBQWMsQ0FBRTtLQUNwQztJQUNEO1FBQ0MsRUFBRSxFQUFFLHdCQUF3QjtRQUM1QixRQUFRLEVBQUUsMkNBQTJDO1FBQ3JELFFBQVEsRUFBRSxnREFBZ0Q7UUFDMUQsT0FBTyxFQUFFLGNBQWM7UUFDdkIsVUFBVSxFQUFFLElBQUksSUFBSSxDQUFFLGtCQUFrQixDQUFFO1FBQzFDLFFBQVEsRUFBRSxJQUFJLElBQUksQ0FBRSxpQkFBaUIsQ0FBRTtLQUN2QztJQUNEO1FBQ0MsRUFBRSxFQUFFLGVBQWU7UUFDbkIsUUFBUSxFQUFFLHVDQUF1QztRQUNqRCxRQUFRLEVBQUUsNENBQTRDO1FBQ3RELE9BQU8sRUFBRSxjQUFjO1FBQ3ZCLFVBQVUsRUFBRSxJQUFJLElBQUksQ0FBRSxrQkFBa0IsQ0FBRTtRQUMxQyxRQUFRLEVBQUUsSUFBSSxJQUFJLENBQUUsaUJBQWlCLENBQUU7S0FDdkM7SUFDRDtRQUNDLEVBQUUsRUFBRSwwQkFBMEI7UUFDOUIsUUFBUSxFQUFFLDZCQUE2QjtRQUN2QyxRQUFRLEVBQUUsa0NBQWtDO1FBQzVDLE9BQU8sRUFBRSxjQUFjO1FBQ3ZCLFVBQVUsRUFBRSxJQUFJLElBQUksQ0FBRSxrQkFBa0IsQ0FBRTtRQUMxQyxRQUFRLEVBQUUsSUFBSSxJQUFJLENBQUUsaUJBQWlCLENBQUU7S0FDdkM7SUFDRDtRQUNDLEVBQUUsRUFBRSxtQkFBbUI7UUFDdkIsUUFBUSxFQUFFLG9DQUFvQztRQUM5QyxRQUFRLEVBQUUseUNBQXlDO1FBQ25ELE9BQU8sRUFBRSxjQUFjO1FBQ3ZCLFVBQVUsRUFBRSxJQUFJLElBQUksQ0FBRSxrQkFBa0IsQ0FBRTtRQUMxQyxRQUFRLEVBQUUsSUFBSSxJQUFJLENBQUUsZUFBZSxDQUFFO0tBQ3JDO0lBRUQ7UUFDQyxFQUFFLEVBQUUsa0JBQWtCO1FBQ3RCLFFBQVEsRUFBRSxtQ0FBbUM7UUFDN0MsUUFBUSxFQUFFLHdDQUF3QztRQUNsRCxPQUFPLEVBQUUsY0FBYztRQUN2QixVQUFVLEVBQUUsSUFBSSxJQUFJLENBQUUsa0JBQWtCLENBQUU7UUFDMUMsUUFBUSxFQUFFLElBQUksSUFBSSxDQUFFLGVBQWUsQ0FBRTtLQUNyQztJQUVEO1FBQ0MsRUFBRSxFQUFFLHFCQUFxQjtRQUN6QixRQUFRLEVBQUUsc0NBQXNDO1FBQ2hELFFBQVEsRUFBRSwyQ0FBMkM7UUFDckQsT0FBTyxFQUFFLGNBQWM7UUFDdkIsVUFBVSxFQUFFLElBQUksSUFBSSxDQUFFLGtCQUFrQixDQUFFO1FBQzFDLFFBQVEsRUFBRSxJQUFJLElBQUksQ0FBRSxlQUFlLENBQUU7S0FDckM7SUFFRDtRQUNDLEVBQUUsRUFBRSxtQkFBbUI7UUFDdkIsUUFBUSxFQUFFLDRCQUE0QjtRQUN0QyxRQUFRLEVBQUUsaUNBQWlDO1FBQzNDLE9BQU8sRUFBRSxjQUFjO1FBQ3ZCLFVBQVUsRUFBRSxJQUFJLElBQUksQ0FBRSxrQkFBa0IsQ0FBRTtRQUMxQyxRQUFRLEVBQUUsSUFBSSxJQUFJLENBQUUsY0FBYyxDQUFFO0tBQ3BDO0lBRUQ7UUFDQyxFQUFFLEVBQUUsWUFBWTtRQUNoQixRQUFRLEVBQUUscUJBQXFCO1FBQy9CLFFBQVEsRUFBRSwwQkFBMEI7UUFDcEMsT0FBTyxFQUFFLG1CQUFtQjtRQUM1QixVQUFVLEVBQUUsSUFBSSxJQUFJLENBQUUsb0JBQW9CLENBQUU7UUFDNUMsUUFBUSxFQUFFLElBQUksSUFBSSxDQUFFLGtCQUFrQixDQUFFO0tBQ3hDO0NBQ0Q7S0FDQSxPQUFPLEVBQUUsQ0FBQztBQUVYLElBQVUsb0JBQW9CLENBb0M3QjtBQXBDRCxXQUFVLG9CQUFvQjtJQUU3QixTQUFnQixpQ0FBaUM7UUFFaEQsOEdBQThHO1FBQzlHLHFEQUFxRDtRQUNyRCxzREFBc0Q7UUFDdEQsK0NBQStDO1FBQy9DLElBQUk7UUFDSixtREFBbUQ7UUFDbkQscURBQXFEO1FBQ3JELHlFQUF5RTtRQUN6RSwrQ0FBK0M7UUFDL0MsS0FBSztRQUNMLDRCQUE0QjtRQUM1Qiw0RUFBNEU7UUFDNUUscUNBQXFDO1FBQ3JDLEtBQUs7UUFDTCwwQkFBMEI7UUFDMUIsSUFBSTtRQUNKLE9BQU87UUFDUDtZQUNDLDZFQUE2RTtZQUM3RSxpREFBaUQ7WUFDakQsTUFBTSxHQUFHLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUN2QixPQUFPLGtCQUFrQixDQUFDLE1BQU0sQ0FBRSxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxVQUFVLElBQUksR0FBRyxJQUFJLE9BQU8sQ0FBQyxRQUFRLEdBQUcsR0FBRyxDQUFFLENBQUM7U0FDbkc7SUFDRixDQUFDO0lBekJlLHNEQUFpQyxvQ0F5QmhELENBQUE7SUFFRCw4RkFBOEY7SUFDOUYsTUFBTSwwQkFBMEIsR0FBRyxDQUFDLENBQUMseUJBQXlCLENBQUUsaUNBQWlDLEVBQUUsR0FBRyxFQUFFO1FBRXZHLGlCQUFpQjtRQUNqQixnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBRSxtQ0FBbUMsRUFBRSxFQUFFLEdBQUcseUJBQXlCLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBRSxDQUFDO1FBQzVILENBQUMsQ0FBQywyQkFBMkIsQ0FBRSxpQ0FBaUMsRUFBRSwwQkFBMEIsQ0FBRSxDQUFDO0lBQ2hHLENBQUMsQ0FBRSxDQUFDO0FBQ0wsQ0FBQyxFQXBDUyxvQkFBb0IsS0FBcEIsb0JBQW9CLFFBb0M3QiJ9