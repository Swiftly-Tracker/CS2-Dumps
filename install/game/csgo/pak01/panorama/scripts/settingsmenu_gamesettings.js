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
    function _InitSteamClanTagsPanel() {
        let clanTagDropdown = $('#ClanTagsEnum');
        if (!clanTagDropdown || !clanTagDropdown.IsValid()) {
            return;
        }
        clanTagDropdown.RemoveAllOptions();
        let id = 'clantagoption_none';
        let optionLabel = $.CreatePanel('Label', clanTagDropdown, id);
        optionLabel.text = $.Localize("#SFUI_Settings_ClanTag_None");
        optionLabel.SetAttributeString('value', '0');
        clanTagDropdown.AddOption(optionLabel);
        let nNumClans = MyPersonaAPI.GetMyClanCount();
        for (let i = 0; i < nNumClans; i++) {
            let clanID = MyPersonaAPI.GetMyClanIdByIndex(i);
            let clanTag = MyPersonaAPI.GetMyClanTagByIdCensored(clanID);
            let clanIDForCvar = MyPersonaAPI.GetMyClanId32BitByIndex(i);
            id = 'clantagoption' + i.toString();
            optionLabel = $.CreatePanel('Label', clanTagDropdown, id, { text: '{s:clanTag}' });
            optionLabel.SetDialogVariable('clanTag', clanTag);
            optionLabel.SetAttributeString('value', clanIDForCvar.toString());
            clanTagDropdown.AddOption(optionLabel);
        }
        clanTagDropdown.RefreshDisplay();
    }
    function OnCrosshairStyleChange() {
        let nStyle = parseInt(GameInterfaceAPI.GetSettingString('cl_crosshairstyle'));
        let bEnableControls = nStyle !== 0 && nStyle !== 1;
        $("#XhairLength").visible = bEnableControls;
        $("#XhairThickness").visible = bEnableControls;
        $("#XhairGap").visible = bEnableControls;
        $("#XhairOutline").visible = bEnableControls;
        $("#XhairColorRed").visible = bEnableControls;
        $("#XhairColorGreen").visible = bEnableControls;
        $("#XhairColorBlue").visible = bEnableControls;
        $("#XhairAlpha").visible = bEnableControls;
        $("#XhairCenterDot").visible = bEnableControls;
        $("#XhairRecoil").visible = bEnableControls;
        $("#XhairTStyle").visible = bEnableControls;
        let bEnableSplitControls = nStyle === 2;
        $("#XhairSlitDist").visible = bEnableSplitControls;
        $("#XhairSplitInnerAlpha").visible = bEnableSplitControls;
        $("#XhairSplitOuterAlpha").visible = bEnableSplitControls;
        $("#XhairSplitRatio").visible = bEnableSplitControls;
        $("#XhairFixedGap").visible = (nStyle === 1);
        $("#CrosshairEditorPreview").SetHasClass("dynamic-crosshair", nStyle === 0 || nStyle === 2 || nStyle === 3);
        let obsCrosshairs = parseInt(GameInterfaceAPI.GetSettingString('cl_show_observer_crosshair'));
        $("#XhairObservedBotCrosshair").visible = (obsCrosshairs === 2);
    }
    SettingsMenuGameSettings.OnCrosshairStyleChange = OnCrosshairStyleChange;
    {
        _InitSteamClanTagsPanel();
        _InitGameSettings();
        OnCrosshairStyleChange();
        SettingsMenuShared.ChangeBackground(0);
        $.RegisterForUnhandledEvent('PanoramaComponent_Lobby_ReachableDatacentersUpdated', _RefreshDatacentersList);
    }
})(SettingsMenuGameSettings || (SettingsMenuGameSettings = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3NtZW51X2dhbWVzZXR0aW5ncy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3NldHRpbmdzbWVudV9nYW1lc2V0dGluZ3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUNsQywrQ0FBK0M7QUFFL0MsSUFBVSx3QkFBd0IsQ0E4SWpDO0FBOUlELFdBQVUsd0JBQXdCO0lBRTlCLFNBQVMsaUJBQWlCO1FBRXRCLElBQUssZ0JBQWdCLENBQUMsNkJBQTZCLEVBQUUsRUFDckQ7WUFDSSxDQUFDLENBQUMsa0NBQWtDLENBQUUsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1NBQzFEO2FBRUQ7WUFDSSxDQUFDLENBQUMseUNBQXlDLENBQUUsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1NBQ2pFO1FBRVIsSUFBSyxDQUFDLGdCQUFnQixDQUFDLHFCQUFxQixFQUFFLEVBQzlDO1lBQ0ksQ0FBQyxDQUFDLG9CQUFvQixDQUFFLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztZQUN6QyxDQUFDLENBQUMsd0JBQXdCLENBQUUsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1lBQzdDLGdCQUFnQixDQUFDLGdCQUFnQixDQUFFLG9CQUFvQixFQUFFLEdBQUcsQ0FBRSxDQUFDO1NBQ2xFO2FBRUQ7WUFDSSxJQUFJLE1BQU0sR0FBRyxRQUFRLENBQUUsZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUUsb0JBQW9CLENBQUUsQ0FBRSxDQUFDO1lBQ25GLElBQUssTUFBTSxLQUFLLENBQUMsSUFBSSxNQUFNLEtBQUssQ0FBQyxJQUFJLE1BQU0sS0FBSyxDQUFDLEVBQ2pEO2dCQUNILGdCQUFnQixDQUFDLGdCQUFnQixDQUFFLG9CQUFvQixFQUFFLEdBQUcsQ0FBRSxDQUFDO2FBQzNEO1NBQ0o7UUFFTSx1QkFBdUIsRUFBRSxDQUFDO0lBQzlCLENBQUM7SUFFRCxTQUFT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