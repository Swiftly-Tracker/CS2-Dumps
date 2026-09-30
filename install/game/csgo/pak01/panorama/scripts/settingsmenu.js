"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/promoted_settings.ts" />
/// <reference path="settingsmenu_shared.ts" />
//--------------------------------------------------------------------------------------------------
// Nav bar
//--------------------------------------------------------------------------------------------------
var SettingsMenu;
(function (SettingsMenu) {
    const TabInfo = {
        Promoted: {
            xml: "settings_promoted",
            radioid: "PromotedSettingsRadio"
        },
        KeybdMouseSettings: {
            xml: 'settings_kbmouse',
            radioid: "KBMouseRadio"
        },
        GameSettings: {
            xml: "settings_game",
            radioid: "GameRadio"
        },
        AudioSettings: {
            xml: "settings_audio",
            radioid: "AudioRadio"
        },
        VideoSettings: {
            xml: "settings_video",
            radioid: "VideoRadio"
        },
        Search: {
            xml: "settings_search",
            radioid: "SearchRadio"
        },
        CrosshairSettings: {
            xml: 'settings_crosshair',
            radioid: 'CrosshairRadio'
        }
    };
    let activeTab;
    function IsTabId(tabname) {
        return TabInfo[tabname] != null;
    }
    SettingsMenu.IsTabId = IsTabId;
    function NavigateToTab(tabID) {
        let bDisplaySteamInputSettings = false;
        let parentPanel = $('#SettingsMenuContent');
        // Check to see if tab to show exists.
        // If not load the xml file.
        if (!parentPanel.FindChildInLayoutFile(tabID)) {
            let newPanel = $.CreatePanel('Panel', parentPanel, tabID);
            $.Msg('Created Panel with id: ' + newPanel.id);
            let XmlName = TabInfo[tabID].xml;
            if (bDisplaySteamInputSettings) {
                XmlName = "settings_steaminput";
            }
            newPanel.BLoadLayout('file://{resources}/layout/settings/' + XmlName + '.xml', false, false);
            // Handler that catches OnPropertyTransitionEndEvent event for this panel.
            // Check if the panel is transparent then collapse it.
            newPanel.OnPropertyTransitionEndEvent = (panel, propertyName) => {
                if (newPanel === panel && propertyName === 'opacity') {
                    // Panel is visible and fully transparent
                    if (newPanel.visible === true && newPanel.BIsTransparent()) {
                        // Set visibility to false and unload resources
                        newPanel.visible = false;
                        newPanel.SetReadyForDisplay(false);
                        return true;
                    }
                }
                return false;
            };
            $.RegisterEventHandler('PropertyTransitionEnd', newPanel, newPanel.OnPropertyTransitionEndEvent);
            // Start the new panel off as invisible, and decide a bit further on if we want to display it or not
            newPanel.visible = false;
            // un-highlight jump buttons on any scroll other than the scroll they trigger themselves
            let contentPanel = newPanel.FindChildInLayoutFile('SettingsMenuTabContent');
            let jumpButtons = newPanel.FindChildInLayoutFile('SettingsMenuJumpButtons');
            if (contentPanel && jumpButtons) {
                contentPanel.SetSendScrollPositionChangedEvents(true);
                $.RegisterEventHandler('ScrollPositionChanged', contentPanel, () => {
                    if (newPanel.Data().bScrollingToId)
                        newPanel.Data().bScrollingToId = false;
                    else
                        jumpButtons.Children().forEach(jumpButton => jumpButton.checked = false);
                });
                // act like we pressed the first jump button
                jumpButtons.Children()[0].checked = true;
            }
            const newSettings = PromotedSettingsUtil.GetUnacknowledgedPromotedSettings();
            for (let setting of newSettings) {
                const el = newPanel.FindChildTraverse(setting.id);
                if (el) {
                    el.AddClass("setting-is-new");
                }
            }
        }
        if (tabID == "Search") {
            let settings = parentPanel.FindChildInLayoutFile(tabID);
            let searchTextEntry = settings.FindChildInLayoutFile('SettingsSearchTextEntry');
            searchTextEntry.SetFocus();
        }
        //If a we have a active tab and it is different from the selected tab hide it.
        //Then show the selected tab
        if (activeTab !== tabID) {
            // If the tab exists then hide it
            if (activeTab) {
                let panelToHide = $.GetContextPanel().FindChildInLayoutFile(activeTab);
                panelToHide.RemoveClass('Active');
            }
            // Check the selected tab's radio button
            $("#" + TabInfo[tabID].radioid).checked = true;
            // Show selected tab
            activeTab = tabID;
            let activePanel = $.GetContextPanel().FindChildInLayoutFile(tabID);
            activePanel.AddClass('Active');
            // Force a reload of any resources since we're about to display the panel
            {
                activePanel.visible = true;
                activePanel.SetReadyForDisplay(true);
            }
            SettingsMenuShared.NewTabOpened(activeTab);
        }
    }
    SettingsMenu.NavigateToTab = NavigateToTab;
    function _AccountPrivacySettingsChanged() {
        // Either the game settings panel exists, in which case we update the twitch.tv
        // privacy settings control, or the game settings panel doesn't yet exist, in which
        // case when it does get created, it will read the up-to-date value of this setting
        let gameSettingPanel = $.GetContextPanel().FindChildInLayoutFile("GameSettings");
        if (gameSettingPanel != null) {
            let twitchTvSetting = gameSettingPanel.FindChildInLayoutFile("accountprivacydropdown");
            if (twitchTvSetting != null) {
                twitchTvSetting.OnShow();
            }
        }
    }
    function _OnSettingsMenuShown() {
        // Call this to refresh the active tab, so the refreshed version will display
        // when we return to the settings menu after going away. This mimics the behaviour
        // when we switch tabs within the settings menu
        SettingsMenuShared.NewTabOpened(activeTab);
    }
    function _OnSettingsMenuHidden() {
        // Save any changes made to convars
        GameInterfaceAPI.ConsoleCommand("host_writeconfig");
        InventoryAPI.StopItemPreviewMusic();
    }
    function _NavigateToSetting(tab, submenuRadioId, id) {
        if (!IsTabId(tab))
            return;
        $.DispatchEvent("Activated", $("#" + TabInfo[tab].radioid), "mouse");
        if (submenuRadioId != '') {
            let elSubMenuRadio = $.GetContextPanel().GetParent().FindChildTraverse(submenuRadioId);
            if (elSubMenuRadio) {
                $.DispatchEvent("Activated", elSubMenuRadio, "mouse");
            }
        }
        SettingsMenuShared.ScrollToId(id); // Scroll to element
    }
    function _NavigateToSettingPanel(tab, submenuRadioId, p) {
        if (!IsTabId(tab))
            return;
        $.DispatchEvent("Activated", $("#" + TabInfo[tab].radioid), "mouse");
        if (submenuRadioId != '') {
            let elSubMenuRadio = $.GetContextPanel().GetParent().FindChildTraverse(submenuRadioId);
            if (elSubMenuRadio) {
                $.DispatchEvent("Activated", elSubMenuRadio, "mouse");
            }
        }
        p.ScrollParentToMakePanelFit(3, false);
        p.AddClass('Highlight');
    }
    // Show the "new" badge on nav tabs that contain a currently promoted setting
    function _UpdateTabNewBadges() {
        const arrNewSettings = PromotedSettingsUtil.GetUnacknowledgedPromotedSettings();
        for (const tab in TabInfo) {
            const elAlert = $('#' + TabInfo[tab].radioid)?.FindChild('TabNewAlert');
            if (!elAlert)
                continue;
            elAlert.SetDialogVariable('alert_value', $.Localize('#Store_Price_New'));
            elAlert.SetHasClass('hidden', !arrNewSettings.some(setting => setting.section === tab));
        }
    }
    function _Init() {
        // To support settings search, create every tab on first view
        for (let tab in TabInfo) {
            if (tab !== "Promoted" && tab !== "Search")
                NavigateToTab(tab);
        }
    }
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        _Init();
        _UpdateTabNewBadges();
        if ($.GetContextPanel().GetAttributeString('set-active-section', '') !== '') {
            let tab = $.GetContextPanel().GetAttributeString('set-active-section', '');
            if (SettingsMenu.IsTabId(tab)) {
                NavigateToTab(tab);
                $.GetContextPanel().SetAttributeString('set-active-section', '');
            }
        }
        else if (PromotedSettingsUtil.GetUnacknowledgedPromotedSettings().length > 0) {
            NavigateToTab('Promoted');
        }
        else {
            const now = new Date();
            if (g_PromotedSettings.filter(setting => setting.start_date <= now && setting.end_date > now).length == 0)
                $('#PromotedSettingsRadio').visible = false;
            NavigateToTab('VideoSettings');
        }
        MyPersonaAPI.RequestAccountPrivacySettings();
        $.RegisterForUnhandledEvent("PanoramaComponent_MyPersona_AccountPrivacySettingsChanged", _AccountPrivacySettingsChanged);
        $.RegisterEventHandler('ReadyForDisplay', $('#JsSettings'), _OnSettingsMenuShown);
        $.RegisterEventHandler('UnreadyForDisplay', $('#JsSettings'), _OnSettingsMenuHidden);
        $.RegisterForUnhandledEvent('SettingsMenu_NavigateToSetting', _NavigateToSetting);
        $.RegisterForUnhandledEvent('SettingsMenu_NavigateToSettingPanel', _NavigateToSettingPanel);
    }
})(SettingsMenu || (SettingsMenu = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3NtZW51LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvc2V0dGluZ3NtZW51LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFDbEMsb0RBQW9EO0FBQ3BELCtDQUErQztBQUUvQyxvR0FBb0c7QUFDcEcsVUFBVTtBQUNWLG9HQUFvRztBQUNwRyxJQUFVLFlBQVksQ0F3UnJCO0FBeFJELFdBQVUsWUFBWTtJQUVyQixNQUFNLE9BQU8sR0FBRztRQUNmLFFBQVEsRUFBRTtZQUNULEdBQUcsRUFBRSxtQkFBbUI7WUFDeEIsT0FBTyxFQUFFLHVCQUF1QjtTQUNoQztRQUNELGtCQUFrQixFQUFFO1lBQ25CLEdBQUcsRUFBRSxrQkFBa0I7WUFDdkIsT0FBTyxFQUFFLGNBQWM7U0FDdkI7UUFDRCxZQUFZLEVBQUU7WUFDYixHQUFHLEVBQUUsZUFBZTtZQUNwQixPQUFPLEVBQUUsV0FBVztTQUNwQjtRQUNELGFBQWEsRUFBRTtZQUNkLEdBQUcsRUFBRSxnQkFBZ0I7WUFDckIsT0FBTyxFQUFFLFlBQVk7U0FDckI7UUFDRCxhQUFhLEVBQUU7WUFDZCxHQUFHLEVBQUUsZ0JBQWdCO1lBQ3JCLE9BQU8sRUFBRSxZQUFZO1NBQ3JCO1FBQ0QsTUFBTSxFQUFFO1lBQ1AsR0FBRyxFQUFFLGlCQUFpQjtZQUN0QixPQUFPLEVBQUUsYUFBYTtTQUN0QjtRQUNELGlCQUFpQixFQUFFO1lBQ2xCLEdBQUcsRUFBRSxvQkFBb0I7WUFDekIsT0FBTyxFQUFFLGdCQUFnQjtTQUN6QjtLQUNELENBQUM7SUFJRixJQUFJLFNBQThCLENBQUM7SUFFbkMsU0FBZ0IsT0FBTyxDQUFHLE9BQWU7UUFFeEMsT0FBTyxPQUFPLENBQUUsT0FBa0IsQ0FBRSxJQUFJLElBQUksQ0FBQztJQUM5QyxDQUFDO0lBSGUsb0JBQU8sVUFHdEIsQ0FBQTtJQUVELFNBQWdCLGFBQWEsQ0FBRyxLQUFjO1FBRTdDLElBQUksMEJBQTBCLEdBQUcsS0FBSyxDQUFDO1FBRXZDLElBQUksV0FBVyxHQUFHLENBQUMsQ0FBRSxzQkFBc0IsQ0FBRyxDQUFDO1FBRS9DLHNDQUFzQztRQUN0Qyw0QkFBNEI7UUFDNUIsSUFBSyxDQUFDLFdBQVcsQ0FBQyxxQkFBcUIsQ0FBRSxLQUFLLENBQUUsRUFDaEQ7WUFFQyxJQUFJLFFBQVEsR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsS0FBSyxDQUFxQixDQUFDO1lBQy9FLENBQUMsQ0FBQyxHQUFHLENBQUUseUJBQXlCLEdBQUcsUUFBUSxDQUFDLEVBQUUsQ0FBRSxDQUFDO1lBRWpELElBQUksT0FBTyxHQUFHLE9BQU8sQ0FBRSxLQUFLLENBQUUsQ0FBQyxHQUFHLENBQUM7WUFDbkMsSUFBSywwQkFBMEIsRUFDL0I7Z0JBQ0MsT0FBTyxHQUFHLHFCQUFxQixDQUFDO2FBQ2hDO1lBQ0QsUUFBUSxDQUFDLFdBQVcsQ0FBRSxxQ0FBcUMsR0FBRyxPQUFPLEdBQUcsTUFBTSxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUUsQ0FBQztZQUUvRiwwRUFBMEU7WUFDMUUsc0RBQXNEO1lBQ3RELFFBQVEsQ0FBQyw0QkFBNEIsR0FBRyxDQUFFLEtBQWMsRUFBRSxZQUFvQixFQUFHLEVBQUU7Z0JBRWxGLElBQUssUUFBUSxLQUFLLEtBQUssSUFBSSxZQUFZLEtBQUssU0FBUyxFQUNyRDtvQkFDQyx5Q0FBeUM7b0JBQ3pDLElBQUssUUFBUSxDQUFDLE9BQU8sS0FBSyxJQUFJLElBQUksUUFBUSxDQUFDLGNBQWMsRUFBRSxFQUMzRDt3QkFDQywrQ0FBK0M7d0JBQy9DLFFBQVEsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO3dCQUN6QixRQUFRLENBQUMsa0JBQWtCLENBQUUsS0FBSyxDQUFFLENBQUM7d0JBQ3JDLE9BQU8sSUFBSSxDQUFDO3FCQUNaO2lCQUNEO2dCQUVELE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQyxDQUFDO1lBRUYsQ0FBQyxDQUFDLG9CQUFvQixDQUFFLHVCQUF1QixFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUMsNEJBQTRCLENBQUUsQ0FBQztZQUVuRyxvR0FBb0c7WUFDcEcsUUFBUSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7WUFFekIsd0ZBQXdGO1lBQ3hGLElBQUksWUFBWSxHQUFHLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBRSx3QkFBd0IsQ0FBRSxDQUFDO1lBQzlFLElBQUksV0FBVyxHQUFHLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBRSx5QkFBeUIsQ0FBRSxDQUFDO1lBQzlFLElBQUssWUFBWSxJQUFJLFdBQVcsRUFDaEM7Z0JBQ0MsWUFBWSxDQUFDLGtDQUFrQyxDQUFFLElBQUksQ0FBRSxDQUFDO2dCQUN4RCxDQUFDLENBQUMsb0JBQW9CLENBQUUsdUJBQXVCLEVBQUUsWUFBWSxFQUFFLEdBQUcsRUFBRTtvQkFFbkUsSUFBSyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsY0FBYzt3QkFDbEMsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDLGNBQWMsR0FBRyxLQUFLLENBQUM7O3dCQUV2QyxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUMsT0FBTyxDQUFFLFVBQVUsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUUsQ0FBQztnQkFDN0UsQ0FBQyxDQUFFLENBQUM7Z0JBRUosNENBQTRDO2dCQUM1QyxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUUsQ0FBQyxDQUFFLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQzthQUMzQztZQUVELE1BQU0sV0FBVyxHQUFHLG9CQUFvQixDQUFDLGlDQUFpQyxFQUFFLENBQUM7WUFDN0UsS0FBTSxJQUFJLE9BQU8sSUFBSSxXQUFXLEVBQ2hDO2dCQUNDLE1BQU0sRUFBRSxHQUFHLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBRSxPQUFPLENBQUMsRUFBRSxDQUFFLENBQUM7Z0JBQ3BELElBQUssRUFBRSxFQUNQO29CQUNDLEVBQUUsQ0FBQyxRQUFRLENBQUUsZ0JBQWdCLENBQUUsQ0FBQztpQkFDaEM7YUFDRDtTQUNEO1FBRUQsSUFBSyxLQUFLLElBQUksUUFBUSxFQUN0QjtZQUNDLElBQUksUUFBUSxHQUFHLFdBQVcsQ0FBQyxxQkFBcUIsQ0FBRSxLQUFLLENBQUUsQ0FBQztZQUMxRCxJQUFJLGVBQWUsR0FBRyxRQUFRLENBQUMscUJBQXFCLENBQUUseUJBQXlCLENBQUUsQ0FBQztZQUNsRixlQUFlLENBQUMsUUFBUSxFQUFFLENBQUM7U0FDM0I7UUFFRCw4RUFBOEU7UUFDOUUsNEJBQTRCO1FBQzVCLElBQUssU0FBUyxLQUFLLEtBQUssRUFDeEI7WUFDQyxpQ0FBaUM7WUFDakMsSUFBSyxTQUFTLEVBQ2Q7Z0JBQ0MsSUFBSSxXQUFXLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLFNBQVMsQ0FBRSxDQUFDO2dCQUN6RSxXQUFXLENBQUMsV0FBVyxDQUFFLFFBQVEsQ0FBRSxDQUFDO2FBQ3BDO1lBRUQsd0NBQXdDO1lBQ3hDLENBQUMsQ0FBRSxHQUFHLEdBQUcsT0FBTyxDQUFFLEtBQUssQ0FBRSxDQUFDLE9BQU8sQ0FBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFFcEQsb0JBQW9CO1lBQ3BCLFNBQVMsR0FBRyxLQUFLLENBQUM7WUFDbEIsSUFBSSxXQUFXLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLEtBQUssQ0FBRSxDQUFDO1lBQ3JFLFdBQVcsQ0FBQyxRQUFRLENBQUUsUUFBUSxDQUFFLENBQUM7WUFFakMseUVBQXlFO1lBQ3pFO2dCQUNDLFdBQVcsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO2dCQUMzQixXQUFXLENBQUMsa0JBQWtCLENBQUUsSUFBSSxDQUFFLENBQUM7YUFDdkM7WUFFRCxrQkFBa0IsQ0FBQyxZQUFZLENBQUUsU0FBUyxDQUFFLENBQUM7U0FDN0M7SUFDRixDQUFDO0lBNUdlLDBCQUFhLGdCQTRHNUIsQ0FBQTtJQUVELFNBQVMsOEJBQThCO1FBRXRDLCtFQUErRTtRQUMvRSxtRkFBbUY7UUFDbkYsbUZBQW1GO1FBQ25GLElBQUksZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLGNBQWMsQ0FBRSxDQUFDO1FBQ25GLElBQUssZ0JBQWdCLElBQUksSUFBSSxFQUM3QjtZQUNDLElBQUksZUFBZSxHQUFHLGdCQUFnQixDQUFDLHFCQUFxQixDQUFFLHdCQUF3QixDQUEyQyxDQUFDO1lBQ2xJLElBQUssZUFBZSxJQUFJLElBQUksRUFDNUI7Z0JBQ0MsZUFBZSxDQUFDLE1BQU0sRUFBRSxDQUFDO2FBQ3pCO1NBQ0Q7SUFDRixDQUFDO0lBRUQsU0FBUyxvQkFBb0I7UUFFNUIsNkVBQTZFO1FBQzdFLGtGQUFrRjtRQUNsRiwrQ0FBK0M7UUFDL0Msa0JBQWtCLENBQUMsWUFBWSxDQUFFLFNBQVUsQ0FBRSxDQUFDO0lBQy9DLENBQUM7SUFFRCxTQUFTLHFCQUFxQjtRQUU3QixtQ0FBbUM7UUFDbkMsZ0JBQWdCLENBQUMsY0FBYyxDQUFFLGtCQUFrQixDQUFFLENBQUM7UUFDdEQsWUFBWSxDQUFDLG9CQUFvQixFQUFFLENBQUM7SUFDckMsQ0FBQztJQUVELFNBQVMsa0JBQWtCLENBQUcsR0FBVyxFQUFFLGNBQXNCLEVBQUUsRUFBVTtRQUU1RSxJQUFLLENBQUMsT0FBTyxDQUFFLEdBQUcsQ0FBRTtZQUNuQixPQUFPO1FBRVIsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxXQUFXLEVBQUUsQ0FBQyxDQUFFLEdBQUcsR0FBRyxPQUFPLENBQUUsR0FBRyxDQUFFLENBQUMsT0FBTyxDQUFHLEVBQUUsT0FBTyxDQUFFLENBQUM7UUFDNUUsSUFBSyxjQUFjLElBQUksRUFBRSxFQUN6QjtZQUNDLElBQUksY0FBYyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBRSxjQUFjLENBQUUsQ0FBQztZQUN6RixJQUFLLGNBQWMsRUFDbkI7Z0JBQ0MsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxXQUFXLEVBQUUsY0FBYyxFQUFFLE9BQU8sQ0FBRSxDQUFDO2FBQ3hEO1NBQ0Q7UUFDRCxrQkFBa0IsQ0FBQyxVQUFVLENBQUUsRUFBRSxDQUFFLENBQUMsQ0FBQyxvQkFBb0I7SUFDMUQsQ0FBQztJQUVELFNBQVMsdUJBQXVCLENBQUcsR0FBVyxFQUFFLGNBQXNCLEVBQUUsQ0FBVTtRQUVqRixJQUFLLENBQUMsT0FBTyxDQUFFLEdBQUcsQ0FBRTtZQUNuQixPQUFPO1FBRVIsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxXQUFXLEVBQUUsQ0FBQyxDQUFFLEdBQUcsR0FBRyxPQUFPLENBQUUsR0FBRyxDQUFFLENBQUMsT0FBTyxDQUFHLEVBQUUsT0FBTyxDQUFFLENBQUM7UUFDNUUsSUFBSyxjQUFjLElBQUksRUFBRSxFQUN6QjtZQUNDLElBQUksY0FBYyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBRSxjQUFjLENBQUUsQ0FBQztZQUN6RixJQUFLLGNBQWMsRUFDbkI7Z0JBQ0MsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxXQUFXLEVBQUUsY0FBYyxFQUFFLE9BQU8sQ0FBRSxDQUFDO2FBQ3hEO1NBQ0Q7UUFDRCxDQUFDLENBQUMsMEJBQTBCLENBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBRSxDQUFDO1FBQ3pDLENBQUMsQ0FBQyxRQUFRLENBQUUsV0FBVyxDQUFFLENBQUM7SUFDM0IsQ0FBQztJQUVELDZFQUE2RTtJQUM3RSxTQUFTLG1CQUFtQjtRQUUzQixNQUFNLGNBQWMsR0FBRyxvQkFBb0IsQ0FBQyxpQ0FBaUMsRUFBRSxDQUFDO1FBQ2hGLEtBQU0sTUFBTSxHQUFHLElBQUksT0FBTyxFQUMxQjtZQUNDLE1BQU0sT0FBTyxHQUFHLENBQUMsQ0FBRSxHQUFHLEdBQUcsT0FBTyxDQUFFLEdBQWMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxFQUFFLFNBQVMsQ0FBRSxhQUFhLENBQUUsQ0FBQztZQUN6RixJQUFLLENBQUMsT0FBTztnQkFDWixTQUFTO1lBRVYsT0FBTyxDQUFDLGlCQUFpQixDQUFFLGFBQWEsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFFLGtCQUFrQixDQUFFLENBQUUsQ0FBQztZQUM3RSxPQUFPLENBQUMsV0FBVyxDQUFFLFFBQVEsRUFBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxLQUFLLEdBQUcsQ0FBRSxDQUFFLENBQUM7U0FDNUY7SUFDRixDQUFDO0lBRUQsU0FBUyxLQUFLO1FBRWIsNkRBQTZEO1FBQzdELEtBQU0sSUFBSSxHQUFHLElBQUksT0FBTyxFQUN4QjtZQUNDLElBQUssR0FBRyxLQUFLLFVBQVUsSUFBSSxHQUFHLEtBQUssUUFBUTtnQkFDMUMsYUFBYSxDQUFFLEdBQWMsQ0FBRSxDQUFDO1NBQ2pDO0lBQ0YsQ0FBQztJQUVELG9HQUFvRztJQUNwRywyQ0FBMkM7SUFDM0Msb0dBQW9HO0lBQ3BHO1FBQ0MsS0FBSyxFQUFFLENBQUM7UUFDUixtQkFBbUIsRUFBRSxDQUFDO1FBRXRCLElBQUssQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGtCQUFrQixDQUFFLG9CQUFvQixFQUFFLEVBQUUsQ0FBRSxLQUFLLEVBQUUsRUFDOUU7WUFDQyxJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsa0JBQWtCLENBQUUsb0JBQW9CLEVBQUUsRUFBRSxDQUFFLENBQUM7WUFDN0UsSUFBSyxZQUFZLENBQUMsT0FBTyxDQUFFLEdBQUcsQ0FBRSxFQUNoQztnQkFDQyxhQUFhLENBQUUsR0FBRyxDQUFFLENBQUM7Z0JBQ3JCLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxvQkFBb0IsRUFBRSxFQUFFLENBQUUsQ0FBQzthQUNuRTtTQUNEO2FBQ0ksSUFBSyxvQkFBb0IsQ0FBQyxpQ0FBaUMsRUFBRSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQzdFO1lBQ0MsYUFBYSxDQUFFLFVBQVUsQ0FBRSxDQUFDO1NBQzVCO2FBRUQ7WUFDQyxNQUFNLEdBQUcsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO1lBQ3ZCLElBQUssa0JBQWtCLENBQUMsTUFBTSxDQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLFVBQVUsSUFBSSxHQUFHLElBQUksT0FBTyxDQUFDLFFBQVEsR0FBRyxHQUFHLENBQUUsQ0FBQyxNQUFNLElBQUksQ0FBQztnQkFDM0csQ0FBQyxDQUFFLHdCQUF3QixDQUFHLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztZQUVoRCxhQUFhLENBQUUsZUFBZSxDQUFFLENBQUM7U0FDakM7UUFFRCxZQUFZLENBQUMsNkJBQTZCLEVBQUUsQ0FBQztRQUM3QyxDQUFDLENBQUMseUJBQXlCLENBQUUsMkRBQTJELEVBQUUsOEJBQThCLENBQUUsQ0FBQztRQUUzSCxDQUFDLENBQUMsb0JBQW9CLENBQUUsaUJBQWlCLEVBQUUsQ0FBQyxDQUFFLGFBQWEsQ0FBRyxFQUFFLG9CQUFvQixDQUFFLENBQUM7UUFDdkYsQ0FBQyxDQUFDLG9CQUFvQixDQUFFLG1CQUFtQixFQUFFLENBQUMsQ0FBRSxhQUFhLENBQUcsRUFBRSxxQkFBcUIsQ0FBRSxDQUFDO1FBQzFGLENBQUMsQ0FBQyx5QkFBeUIsQ0FBRSxnQ0FBZ0MsRUFBRSxrQkFBa0IsQ0FBRSxDQUFDO1FBQ3BGLENBQUMsQ0FBQyx5QkFBeUIsQ0FBRSxxQ0FBcUMsRUFBRSx1QkFBdUIsQ0FBRSxDQUFDO0tBQzlGO0FBQ0YsQ0FBQyxFQXhSUyxZQUFZLEtBQVosWUFBWSxRQXdSckIifQ==