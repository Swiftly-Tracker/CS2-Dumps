"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="settingsmenu_shared.ts" />
var SettingsMenuVideo;
(function (SettingsMenuVideo) {
    function SelectSimpleVideoSettings() {
        SettingsMenuShared.VideoSettingsDiscardChanges();
        SettingsMenuShared.SetVis('video_settings', true);
        SettingsMenuShared.SetVis('advanced_video', false);
        $('#SimpleVideoSettingsRadio').checked = true;
        $('#AdvancedVideoSettingsRadio').checked = false;
    }
    SettingsMenuVideo.SelectSimpleVideoSettings = SelectSimpleVideoSettings;
    function SelectAdvancedVideoSettings() {
        SettingsMenuShared.VideoSettingsDiscardChanges();
        SettingsMenuShared.SetVis('video_settings', false);
        SettingsMenuShared.SetVis('advanced_video', true);
        $('#SimpleVideoSettingsRadio').checked = false;
        $('#AdvancedVideoSettingsRadio').checked = true;
    }
    SettingsMenuVideo.SelectAdvancedVideoSettings = SelectAdvancedVideoSettings;
    function ShowHudEdgePositions() {
        UiToolkitAPI.ShowCustomLayoutPopupWithCancelCallback('', 'file://{resources}/layout/popups/popup_hud_edge_positions.xml', () => { });
    }
    SettingsMenuVideo.ShowHudEdgePositions = ShowHudEdgePositions;
    {
        SelectSimpleVideoSettings();
    }
})(SettingsMenuVideo || (SettingsMenuVideo = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3NtZW51X3ZpZGVvLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvc2V0dGluZ3NtZW51X3ZpZGVvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFDbEMsK0NBQStDO0FBRS9DLElBQVUsaUJBQWlCLENBNkIxQjtBQTdCRCxXQUFVLGlCQUFpQjtJQUUxQixTQUFnQix5QkFBeUI7UUFFeEMsa0JBQWtCLENBQUMsMkJBQTJCLEVBQUUsQ0FBQztRQUNqRCxrQkFBa0IsQ0FBQyxNQUFNLENBQUUsZ0JBQWdCLEVBQUUsSUFBSSxDQUFFLENBQUM7UUFDcEQsa0JBQWtCLENBQUMsTUFBTSxDQUFFLGdCQUFnQixFQUFFLEtBQUssQ0FBRSxDQUFDO1FBQ3JELENBQUMsQ0FBRSwyQkFBMkIsQ0FBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDakQsQ0FBQyxDQUFFLDZCQUE2QixDQUFHLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztJQUNyRCxDQUFDO0lBUGUsMkNBQXlCLDRCQU94QyxDQUFBO0lBRUQsU0FBZ0IsMkJBQTJCO1FBRTFDLGtCQUFrQixDQUFDLDJCQUEyQixFQUFFLENBQUM7UUFDakQsa0JBQWtCLENBQUMsTUFBTSxDQUFFLGdCQUFnQixFQUFFLEtBQUssQ0FBRSxDQUFDO1FBQ3JELGtCQUFrQixDQUFDLE1BQU0sQ0FBRSxnQkFBZ0IsRUFBRSxJQUFJLENBQUUsQ0FBQztRQUNwRCxDQUFDLENBQUUsMkJBQTJCLENBQUcsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1FBQ2xELENBQUMsQ0FBRSw2QkFBNkIsQ0FBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7SUFDcEQsQ0FBQztJQVBlLDZDQUEyQiw4QkFPMUMsQ0FBQTtJQUVELFNBQWdCLG9CQUFvQjtRQUVuQyxZQUFZLENBQUMsdUNBQXVDLENBQUUsRUFBRSxFQUFFLCtEQUErRCxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBRSxDQUFDO0lBQ3hJLENBQUM7SUFIZSxzQ0FBb0IsdUJBR25DLENBQUE7SUFHRDtRQUNDLHlCQUF5QixFQUFFLENBQUM7S0FDNUI7QUFDRixDQUFDLEVBN0JTLGlCQUFpQixLQUFqQixpQkFBaUIsUUE2QjFCIn0=