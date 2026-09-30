"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="settingsmenu_shared.ts" />
var SettingsMenuGameSettings;
(function (SettingsMenuGameSettings) {
    function _InitGameSettings() {
        if (GameInterfaceAPI.IsConsoleEnabledByCommandLine()) {
            $("#enableconsoledropdown-container").visible = false;
        }
        else {
            $("#enableconsoledropdowncmdline-container").visible = false;
        }
        if (!GameInterfaceAPI.ShowThreadPoolOptions()) {
            $("#ThreadPoolOptions").visible = false;
            $("#ThreadPoolOptionsQuit").visible = false;
            GameInterfaceAPI.SetSettingString('thread_pool_option', '3');
        }
        else {
            let option = parseInt(GameInterfaceAPI.GetSettingString('thread_pool_option'));
            if (option !== 0 && option !== 2 && option !== 3) {
                GameInterfaceAPI.SetSettingString('thread_pool_option', '3');
            }
        }
        _RefreshDatacentersList();
    }
    function _RefreshDatacentersList() {
        let elContainer = $('#DatacenterListContainer');
        elContainer.RemoveAndDeleteChildren();
        const dcs = LobbyAPI.GetReachableDatacenters();
        const samples = dcs.samples;
        let numSamplesAdded = 0;
        for (let k = 0; k < 10; ++k) {
            if (!samples || !samples.hasOwnProperty('sample' + k))
                break;
            const ss = samples['sample' + k];
            let elPanel = $.CreatePanel("Panel", elContainer, String(ss.ping));
            elPanel.BLoadLayoutSnippet("snippet_datacenter_entry");
            elPanel.SetDialogVariable('name', ss.name);
            elPanel.SetDialogVariableInt('ping', ss.ping);
            ++numSamplesAdded;
        }
        if (numSamplesAdded == 0) {
            let elPanel = $.CreatePanel("Panel", elContainer, '0');
            elPanel.BLoadLayoutSnippet("snippet_datacenter_entry");
            elPanel.SetDialogVariable('name', $.Localize("#SFUI_UserAlert_Unreachable"));
            elPanel.SetDialogVariableInt('ping', 0);
        }
        elContainer.SetHasClass('no-data-centers', numSamplesAdded == 0);
    }
    {
        _InitGameSettings();
        SettingsMenuShared.ChangeBackground(0);
        $.RegisterForUnhandledEvent('PanoramaComponent_Lobby_ReachableDatacentersUpdated', _RefreshDatacentersList);
    }
})(SettingsMenuGameSettings || (SettingsMenuGameSettings = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3NtZW51X2dhbWVzZXR0aW5ncy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3NldHRpbmdzbWVudV9nYW1lc2V0dGluZ3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUNsQywrQ0FBK0M7QUFFL0MsSUFBVSx3QkFBd0IsQ0F3RWpDO0FBeEVELFdBQVUsd0JBQXdCO0lBRTlCLFNBQVMsaUJBQWlCO1FBRXRCLElBQUssZ0JBQWdCLENBQUMsNkJBQTZCLEVBQUUsRUFDckQ7WUFDSSxDQUFDLENBQUMsa0NBQWtDLENBQUUsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1NBQzFEO2FBRUQ7WUFDSSxDQUFDLENBQUMseUNBQXlDLENBQUUsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1NBQ2pFO1FBRVIsSUFBSyxDQUFDLGdCQUFnQixDQUFDLHFCQUFxQixFQUFFLEVBQzlDO1lBQ08sQ0FBQyxDQUFDLG9CQUFvQixDQUFFLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztZQUN6QyxDQUFDLENBQUMsd0JBQXdCLENBQUUsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1lBQzdDLGdCQUFnQixDQUFDLGdCQUFnQixDQUFFLG9CQUFvQixFQUFFLEdBQUcsQ0FBRSxDQUFDO1NBQ3JFO2FBRUQ7WUFDTyxJQUFJLE1BQU0sR0FBRyxRQUFRLENBQUUsZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUUsb0JBQW9CLENBQUUsQ0FBRSxDQUFDO1lBQ25GLElBQUssTUFBTSxLQUFLLENBQUMsSUFBSSxNQUFNLEtBQUssQ0FBQyxJQUFJLE1BQU0sS0FBSyxDQUFDLEVBQ2pEO2dCQUNBLGdCQUFnQixDQUFDLGdCQUFnQixDQUFFLG9CQUFvQixFQUFFLEdBQUcsQ0FBRSxDQUFDO2FBQzlEO1NBQ1A7UUFFTSx1QkFBdUIsRUFBRSxDQUFDO0lBQzlCLENBQUM7SUFFRCxTQUFTLHVCQUF1QjtRQUU1QixJQUFJLFdBQVcsR0FBRyxDQUFDLENBQUMsMEJBQTBCLENBQUUsQ0FBQztRQUNqRCxXQUFXLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUV0QyxNQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUMvQyxNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDO1FBRTVCLElBQUksZUFBZSxHQUFHLENBQUMsQ0FBQztRQUN4QixLQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUcsQ0FBQyxFQUM3QjtZQUNJLElBQUssQ0FBQyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFFLFFBQVEsR0FBQyxDQUFDLENBQUU7Z0JBQ2xELE1BQU07WUFFVixNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsUUFBUSxHQUFDLENBQUMsQ0FBRSxDQUFDO1lBRWhDLElBQUksT0FBTyxHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLENBQUUsRUFBRSxDQUFDLElBQUksQ0FBRSxDQUFFLENBQUM7WUFDdkUsT0FBTyxDQUFDLGtCQUFrQixDQUFFLDBCQUEwQixDQUFFLENBQUM7WUFDekQsT0FBTyxDQUFDLGlCQUFpQixDQUFFLE1BQU0sRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFFLENBQUM7WUFDN0MsT0FBTyxDQUFDLG9CQUFvQixDQUFFLE1BQU0sRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFFLENBQUM7WUFDaEQsRUFBRyxlQUFlLENBQUM7U0FDdEI7UUFFRCxJQUFLLGVBQWUsSUFBSSxDQUFDLEVBQ3pCO1lBQ0ksSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLEdBQUcsQ0FBRSxDQUFDO1lBQ3pELE9BQU8sQ0FBQyxrQkFBa0IsQ0FBRSwwQkFBMEIsQ0FBRSxDQUFDO1lBQ3pELE9BQU8sQ0FBQyxpQkFBaUIsQ0FBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBRSw2QkFBNkIsQ0FBRSxDQUFFLENBQUM7WUFDakYsT0FBTyxDQUFDLG9CQUFvQixDQUFFLE1BQU0sRUFBRSxDQUFDLENBQUUsQ0FBQztTQUM3QztRQUVELFdBQVcsQ0FBQyxXQUFXLENBQUUsaUJBQWlCLEVBQUUsZUFBZSxJQUFJLENBQUMsQ0FBRSxDQUFDO0lBQ3ZFLENBQUM7SUFHRDtRQUNJLGlCQUFpQixFQUFFLENBQUM7UUFDcEIsa0JBQWtCLENBQUMsZ0JBQWdCLENBQUUsQ0FBQyxDQUFFLENBQUM7UUFFekMsQ0FBQyxDQUFDLHlCQUF5QixDQUFFLHFEQUFxRCxFQUFFLHVCQUF1QixDQUFFLENBQUM7S0FDakg7QUFDTCxDQUFDLEVBeEVTLHdCQUF3QixLQUF4Qix3QkFBd0IsUUF3RWpDIn0=