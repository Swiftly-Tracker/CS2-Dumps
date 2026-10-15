"use strict";
/// <reference path="csgo.d.ts" />
var SettingsMenuAudioSettings;
(function (SettingsMenuAudioSettings) {
    const k_MusicModePanelIds = [
        'SettingsMusicModeCompetitive',
        'SettingsMusicModeCasual',
        'SettingsMusicModeArmsRace',
        'SettingsMusicModeDeathmatch',
        'SettingsMusicModeRush',
    ];
    function OnMusicModeChange() {
        let nMode = parseInt(GameInterfaceAPI.GetSettingString('snd_music_settings_mode'));
        if (!isFinite(nMode) || nMode < 0 || nMode >= k_MusicModePanelIds.length) {
            nMode = 0;
        }
        for (let i = 0; i < k_MusicModePanelIds.length; i++) {
            const elPanel = $('#' + k_MusicModePanelIds[i]);
            if (elPanel) {
                elPanel.visible = (i === nMode);
            }
        }
    }
    SettingsMenuAudioSettings.OnMusicModeChange = OnMusicModeChange;
    function ApplyCompetitiveVolumesToAllModes() {
        $.DispatchEvent('CSGOMusicApplyCompetitiveVolumesToAllModes');
    }
    SettingsMenuAudioSettings.ApplyCompetitiveVolumesToAllModes = ApplyCompetitiveVolumesToAllModes;
    {
        OnMusicModeChange();
    }
})(SettingsMenuAudioSettings || (SettingsMenuAudioSettings = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3NtZW51X2F1ZGlvc2V0dGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9zZXR0aW5nc21lbnVfYXVkaW9zZXR0aW5ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBRWxDLElBQVUseUJBQXlCLENBNkNsQztBQTdDRCxXQUFVLHlCQUF5QjtJQUlsQyxNQUFNLG1CQUFtQixHQUN6QjtRQUNDLDhCQUE4QjtRQUM5Qix5QkFBeUI7UUFDekIsMkJBQTJCO1FBQzNCLDZCQUE2QjtRQUM3Qix1QkFBdUI7S0FDdkIsQ0FBQztJQUlGLFNBQWdCLGlCQUFpQjtRQUdoQyxJQUFJLEtBQUssR0FBRyxRQUFRLENBQUUsZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUUseUJBQXlCLENBQUUsQ0FBRSxDQUFDO1FBQ3ZGLElBQUssQ0FBQyxRQUFRLENBQUUsS0FBSyxDQUFFLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxLQUFLLElBQUksbUJBQW1CLENBQUMsTUFBTSxFQUMzRTtZQUNDLEtBQUssR0FBRyxDQUFDLENBQUM7U0FDVjtRQUVELEtBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxtQkFBbUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQ3BEO1lBQ0MsTUFBTSxPQUFPLEdBQUcsQ0FBQyxDQUFFLEdBQUcsR0FBRyxtQkFBbUIsQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDO1lBQ3BELElBQUssT0FBTyxFQUNaO2dCQUNDLE9BQU8sQ0FBQyxPQUFPLEdBQUcsQ0FBRSxDQUFDLEtBQUssS0FBSyxDQUFFLENBQUM7YUFDbEM7U0FDRDtJQUNGLENBQUM7SUFqQmUsMkNBQWlCLG9CQWlCaEMsQ0FBQTtJQUlELFNBQWdCLGlDQUFpQztRQUVoRCxDQUFDLENBQUMsYUFBYSxDQUFFLDRDQUE0QyxDQUFFLENBQUM7SUFDakUsQ0FBQztJQUhlLDJEQUFpQyxvQ0FHaEQsQ0FBQTtJQUdEO1FBQ0MsaUJBQWlCLEVBQUUsQ0FBQztLQUNwQjtBQUNGLENBQUMsRUE3Q1MseUJBQXlCLEtBQXpCLHlCQUF5QixRQTZDbEMifQ==