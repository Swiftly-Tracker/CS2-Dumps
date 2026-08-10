"use strict";
/// <reference path="csgo.d.ts" />
var SettingsMenuShared;
(function (SettingsMenuShared) {
    function _ResetControlsRecursive(panel) {
        if (panel == null) {
            return;
        }
        if (panel.GetChildCount == undefined) {
            return;
        }
        if (panel.paneltype == 'CSGOSettingsSlider' || panel.paneltype == 'CSGOSettingsEnumDropDown') {
            panel.RestoreCVarDefault();
        }
        else if (panel.paneltype == 'CSGOSettingsKeyBinder') {
            panel.OnShow();
        }
        else {
            let nCount = panel.GetChildCount();
            for (let i = 0; i < nCount; i++) {
                let child = panel.GetChild(i);
                _ResetControlsRecursive(child);
            }
        }
    }
    function ResetControls() {
        GameInterfaceAPI.ResetThreadPoolOptions();
        _ResetControlsRecursive($.GetContextPanel());
        InventoryAPI.StopItemPreviewMusic();
    }
    SettingsMenuShared.ResetControls = ResetControls;
    function ResetKeybdMouseDefaults() {
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
            return;
        }
        else {
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
        let videoSettingsStr = 'VideoSettings';
        if (newTab == videoSettingsStr) {
            let videoSettingsPanel = $.GetContextPanel().FindChildInLayoutFile(videoSettingsStr);
            gBtnApplyVideoSettingsButton = videoSettingsPanel.FindChildInLayoutFile("BtnApplyVideoSettings");
            gBtnDiscardVideoSettingChanges = videoSettingsPanel.FindChildInLayoutFile("BtnDiscardVideoSettingChanges");
            gBtnDiscardVideoSettingChanges2 = videoSettingsPanel.FindChildInLayoutFile("BtnDiscardVideoSettingChanges2");
            gBtnApplyVideoSettingsButton.enabled = false;
            gBtnDiscardVideoSettingChanges.enabled = false;
            gBtnDiscardVideoSettingChanges2.enabled = false;
            $.DispatchEvent("CSGOVideoSettingsInit");
        }
        let newTabPanel = $.GetContextPanel().FindChildInLayoutFile(newTab);
        _RefreshControlsRecursive(newTabPanel);
        GameInterfaceAPI.ConsoleCommand("host_writeconfig");
        InventoryAPI.StopItemPreviewMusic();
    }
    SettingsMenuShared.NewTabOpened = NewTabOpened;
    function ChangeBackground(delta) {
        let elBkg = $("#XhairBkg");
        if (elBkg) {
            let nBkgIdx = elBkg.GetAttributeInt("bkg-id", 0);
            let arrBkgs = ["bkg-dust2", "bkg-nuke", "bkg-mirage", "bkg-office"];
            nBkgIdx = (arrBkgs.length + nBkgIdx + delta) % arrBkgs.length;
            elBkg.SwitchClass("bkg-style", arrBkgs[nBkgIdx]);
            elBkg.SetAttributeInt("bkg-id", nBkgIdx);
        }
    }
    SettingsMenuShared.ChangeBackground = ChangeBackground;
    {
        $.RegisterForUnhandledEvent('CSGOCrosshairSettingsChanged', _RefreshControls);
    }
})(SettingsMenuShared || (SettingsMenuShared = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3NtZW51X3NoYXJlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3NldHRpbmdzbWVudV9zaGFyZWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUVsQyxJQUFVLGtCQUFrQixDQW9RM0I7QUFwUUQsV0FBVSxrQkFBa0I7SUFFM0IsU0FBUyx1QkFBdUIsQ0FBRSxLQUFjO1FBRS9DLElBQUssS0FBSyxJQUFJLElBQUksRUFDbEI7WUFDQyxPQUFPO1NBQ1A7UUFFRCxJQUFJLEtBQUssQ0FBQyxhQUFhLElBQUksU0FBUyxFQUNwQztZQUVDLE9BQU87U0FDUDtRQUVELElBQUksS0FBSyxDQUFDLFNBQVMsSUFBSSxvQkFBb0IsSUFBSSxLQUFLLENBQUMsU0FBUyxJQUFJLDBCQUEwQixFQUM1RjtZQUNFLEtBQTJELENBQUMsa0JBQWtCLEVBQUUsQ0FBQztTQUNsRjthQUNJLElBQUssS0FBSyxDQUFDLFNBQVMsSUFBSSx1QkFBdUIsRUFDcEQ7WUFFRSxLQUFpQyxDQUFDLE1BQU0sRUFBRSxDQUFDO1NBQzVDO2FBRUQ7WUFDQyxJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDbkMsS0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFDaEM7Z0JBQ0MsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDOUIsdUJBQXVCLENBQUUsS0FBSyxDQUFFLENBQUM7YUFDakM7U0FDRDtJQUNGLENBQUM7SUFFRCxTQUFnQixhQUFhO1FBRzVCLGdCQUFnQixDQUFDLHNCQUFzQixFQUFFLENBQUM7UUFDMUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUM7UUFDN0MsWUFBWSxDQUFDLG9CQUFvQixF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