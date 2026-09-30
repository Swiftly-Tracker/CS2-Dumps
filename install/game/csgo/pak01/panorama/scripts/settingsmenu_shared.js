"use strict";
/// <reference path="csgo.d.ts" />
var SettingsMenuShared;
(function (SettingsMenuShared) {
    function _ResetControlsRecursive(panel) {
        if (panel == null) {
            return;
        }
        if (panel.GetChildCount == undefined) {
            // This happens sometimes. Not sure why
            return;
        }
        if (panel.paneltype == 'CSGOSettingsSlider' || panel.paneltype == 'CSGOSettingsEnumDropDown') {
            panel.RestoreCVarDefault();
        }
        else if (panel.paneltype == 'CSGOSettingsKeyBinder') {
            // Only need to refresh, as the binds are reset to default using the OptionsMenu component
            panel.OnShow();
        }
        else // We don't have nested settings controls
         {
            let nCount = panel.GetChildCount();
            for (let i = 0; i < nCount; i++) {
                let child = panel.GetChild(i);
                _ResetControlsRecursive(child);
            }
        }
    }
    function ResetControls() {
        $.Msg("Reset defaults");
        GameInterfaceAPI.ResetThreadPoolOptions();
        _ResetControlsRecursive($.GetContextPanel());
        InventoryAPI.StopItemPreviewMusic();
    }
    SettingsMenuShared.ResetControls = ResetControls;
    function ResetKeybdMouseDefaults() {
        $.Msg("ResetKeybdMouseDefaults");
        OptionsMenuAPI.RestoreKeybdMouseBindingDefaults();
        ResetControls();
    }
    SettingsMenuShared.ResetKeybdMouseDefaults = ResetKeybdMouseDefaults;
    function ResetAudioSettings() {
        $.DispatchEvent("CSGOAudioSettingsResetDefault");
        ResetControls();
    }
    SettingsMenuShared.ResetAudioSettings = ResetAudioSettings;
    function ResetVideoSettings() {
        $.DispatchEvent("CSGOVideoSettingsResetDefault");
        ResetControls();
        VideoSettingsOnUserInputSubmit();
    }
    SettingsMenuShared.ResetVideoSettings = ResetVideoSettings;
    function ResetVideoSettingsAdvanced() {
        $.DispatchEvent("CSGOVideoSettingsResetDefaultAdvanced");
        VideoSettingsEnableDiscard();
    }
    SettingsMenuShared.ResetVideoSettingsAdvanced = ResetVideoSettingsAdvanced;
    function _RefreshControls() {
        _RefreshControlsRecursive($.GetContextPanel());
    }
    function _RefreshControlsRecursive(panel) {
        if (panel == null) {
            return;
        }
        if ('OnShow' in panel) {
            panel.OnShow();
        }
        if (panel.GetChildCount == undefined) {
            // This happens sometimes. Not sure why
            return;
        }
        else // We don't have nested settings controls
         {
            let nCount = panel.GetChildCount();
            for (let i = 0; i < nCount; i++) {
                let child = panel.GetChild(i);
                _RefreshControlsRecursive(child);
            }
        }
    }
    function ShowConfirmReset(resetCall, locText) {
        UiToolkitAPI.ShowGenericPopupOneOptionCustomCancelBgStyle('#settings_reset_confirm_title', locText, '', '#settings_reset', resetCall, '#settings_return', () => { }, 'dim');
    }
    SettingsMenuShared.ShowConfirmReset = ShowConfirmReset;
    function ShowConfirmDiscard(discardCall) {
        UiToolkitAPI.ShowGenericPopupOneOptionCustomCancelBgStyle('#settings_discard_confirm_title', '#settings_discard_confirm_video_desc', '', '#settings_discard', discardCall, '#settings_return', () => { }, 'dim');
    }
    SettingsMenuShared.ShowConfirmDiscard = ShowConfirmDiscard;
    function ScrollToId(locationId) {
        let elLocationPanel = $.GetContextPanel().FindChildTraverse(locationId);
        if (elLocationPanel != null) {
            $.GetContextPanel().Data().bScrollingToId = true;
            elLocationPanel.ScrollParentToMakePanelFit(3, false);
            elLocationPanel.TriggerClass('Highlight');
        }
    }
    SettingsMenuShared.ScrollToId = ScrollToId;
    function SetVis(locationId, vis) {
        let panel = $.GetContextPanel().FindChildTraverse(locationId);
        if (panel != null) {
            panel.visible = vis;
        }
    }
    SettingsMenuShared.SetVis = SetVis;
    // State logic to tracking if there are changes to apply or discard:
    // Changes in panel controls -> enable both
    // Reset button pressed -> enable both
    // Apply button pressed -> disable both
    // Discard button pressed -> disable both
    let gBtnApplyVideoSettingsButton = null;
    let gBtnDiscardVideoSettingChanges = null;
    let gBtnDiscardVideoSettingChanges2 = null;
    function VideoSettingsOnUserInputSubmit() {
        if (gBtnApplyVideoSettingsButton != null) {
            gBtnApplyVideoSettingsButton.enabled = true;
        }
        if (gBtnDiscardVideoSettingChanges != null) {
            gBtnDiscardVideoSettingChanges.enabled = true;
        }
    }
    SettingsMenuShared.VideoSettingsOnUserInputSubmit = VideoSettingsOnUserInputSubmit;
    function VideoSettingsEnableDiscard() {
        if (gBtnDiscardVideoSettingChanges2 != null) {
            gBtnDiscardVideoSettingChanges2.enabled = true;
        }
    }
    SettingsMenuShared.VideoSettingsEnableDiscard = VideoSettingsEnableDiscard;
    function _VideoSettingsResetUserInput() {
        if (gBtnApplyVideoSettingsButton != null) {
            gBtnApplyVideoSettingsButton.enabled = false;
        }
        if (gBtnDiscardVideoSettingChanges != null) {
            gBtnDiscardVideoSettingChanges.enabled = false;
        }
        if (gBtnDiscardVideoSettingChanges2 != null) {
            gBtnDiscardVideoSettingChanges2.enabled = false;
        }
    }
    function VideoSettingsDiscardChanges() {
        $.DispatchEvent("CSGOVideoSettingsInit");
        _VideoSettingsResetUserInput();
    }
    SettingsMenuShared.VideoSettingsDiscardChanges = VideoSettingsDiscardChanges;
    function VideoSettingsDiscardAdvanced() {
        $.DispatchEvent("CSGOVideoSettingsDiscardAdvanced");
        _VideoSettingsResetUserInput();
    }
    SettingsMenuShared.VideoSettingsDiscardAdvanced = VideoSettingsDiscardAdvanced;
    function VideoSettingsApplyChanges() {
        $.DispatchEvent("CSGOApplyVideoSettings");
        _VideoSettingsResetUserInput();
    }
    SettingsMenuShared.VideoSettingsApplyChanges = VideoSettingsApplyChanges;
    function NewTabOpened(newTab) {
        $.Msg('Settings menu new tab: ' + newTab);
        let videoSettingsStr = 'VideoSettings';
        if (newTab == videoSettingsStr) {
            let videoSettingsPanel = $.GetContextPanel().FindChildInLayoutFile(videoSettingsStr);
            // Get the apply and discard buttons on the video settings screen
            gBtnApplyVideoSettingsButton = videoSettingsPanel.FindChildInLayoutFile("BtnApplyVideoSettings");
            gBtnDiscardVideoSettingChanges = videoSettingsPanel.FindChildInLayoutFile("BtnDiscardVideoSettingChanges");
            gBtnDiscardVideoSettingChanges2 = videoSettingsPanel.FindChildInLayoutFile("BtnDiscardVideoSettingChanges2");
            // disabled as no user changes yet
            gBtnApplyVideoSettingsButton.enabled = false;
            gBtnDiscardVideoSettingChanges.enabled = false;
            gBtnDiscardVideoSettingChanges2.enabled = false;
            // Tell C++ to init controls from convars
            $.DispatchEvent("CSGOVideoSettingsInit");
        }
        let newTabPanel = $.GetContextPanel().FindChildInLayoutFile(newTab);
        _RefreshControlsRecursive(newTabPanel);
        // Save any changes made to convars, for tabs that do not have an explicit save
        GameInterfaceAPI.ConsoleCommand("host_writeconfig");
        InventoryAPI.StopItemPreviewMusic();
    }
    SettingsMenuShared.NewTabOpened = NewTabOpened;
    function ChangeBackground(delta) {
        let elBkg = $("#XhairBkg");
        if (elBkg) {
            let nBkgIdx = elBkg.GetAttributeInt("bkg-id", 0);
            let arrBkgs = ["bkg-dust2", "bkg-nuke", "bkg-mirage", "bkg-ancient", "bkg-anubis", "bkg-cache", "bkg-inferno"];
            nBkgIdx = (arrBkgs.length + nBkgIdx + delta) % arrBkgs.length;
            elBkg.SwitchClass("bkg-style", arrBkgs[nBkgIdx]);
            elBkg.SetAttributeInt("bkg-id", nBkgIdx);
        }
    }
    SettingsMenuShared.ChangeBackground = ChangeBackground;
    // On creation
    {
    }
})(SettingsMenuShared || (SettingsMenuShared = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3NtZW51X3NoYXJlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3NldHRpbmdzbWVudV9zaGFyZWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUVsQyxJQUFVLGtCQUFrQixDQW1RM0I7QUFuUUQsV0FBVSxrQkFBa0I7SUFFM0IsU0FBUyx1QkFBdUIsQ0FBRSxLQUFjO1FBRS9DLElBQUssS0FBSyxJQUFJLElBQUksRUFDbEI7WUFDQyxPQUFPO1NBQ1A7UUFFRCxJQUFJLEtBQUssQ0FBQyxhQUFhLElBQUksU0FBUyxFQUNwQztZQUNDLHVDQUF1QztZQUN2QyxPQUFPO1NBQ1A7UUFFRCxJQUFJLEtBQUssQ0FBQyxTQUFTLElBQUksb0JBQW9CLElBQUksS0FBSyxDQUFDLFNBQVMsSUFBSSwwQkFBMEIsRUFDNUY7WUFDRSxLQUEyRCxDQUFDLGtCQUFrQixFQUFFLENBQUM7U0FDbEY7YUFDSSxJQUFLLEtBQUssQ0FBQyxTQUFTLElBQUksdUJBQXVCLEVBQ3BEO1lBQ0MsMEZBQTBGO1lBQ3pGLEtBQWlDLENBQUMsTUFBTSxFQUFFLENBQUM7U0FDNUM7YUFDSSx5Q0FBeUM7U0FDOUM7WUFDQyxJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDbkMsS0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFDaEM7Z0JBQ0MsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDOUIsdUJBQXVCLENBQUUsS0FBSyxDQUFFLENBQUM7YUFDakM7U0FDRDtJQUNGLENBQUM7SUFFRCxTQUFnQixhQUFhO1FBRTVCLENBQUMsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUN4QixnQkFBZ0IsQ0FBQyxzQkFBc0Is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