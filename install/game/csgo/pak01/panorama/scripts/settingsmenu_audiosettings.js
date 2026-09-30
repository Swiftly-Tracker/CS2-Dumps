"use strict";
/// <reference path="csgo.d.ts" />
var SettingsMenuAudioSettings;
(function (SettingsMenuAudioSettings) {
    // Index into this array IS snd_music_settings_mode, and matches MusicMode_t in
    // clientmode_csnormal.cpp and the mode switch in soundstacks_csgo_music.vsndstck.
    const k_MusicModePanelIds = [
        'SettingsMusicModeCompetitive',
        'SettingsMusicModeCasual',
        'SettingsMusicModeArmsRace',
        'SettingsMusicModeDeathmatch',
        'SettingsMusicModeRush',
    ];
    // Shows only the picked mode's slider set. One set per mode because a settings
    // slider resolves its convar at parse time and cannot be rebound later.
    function OnMusicModeChange() {
        // Fall back to competitive rather than hiding every set.
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
    // Copies the competitive set onto the other four. The copy itself runs in
    // CCSGO_AudioSettingsScreen, which also refreshes the hidden slider sets.
    function ApplyCompetitiveVolumesToAllModes() {
        $.DispatchEvent('CSGOMusicApplyCompetitiveVolumesToAllModes');
    }
    SettingsMenuAudioSettings.ApplyCompetitiveVolumesToAllModes = ApplyCompetitiveVolumesToAllModes;
    // On creation
    {
        OnMusicModeChange();
    }
})(SettingsMenuAudioSettings || (SettingsMenuAudioSettings = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3NtZW51X2F1ZGlvc2V0dGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9zZXR0aW5nc21lbnVfYXVkaW9zZXR0aW5ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBRWxDLElBQVUseUJBQXlCLENBNkNsQztBQTdDRCxXQUFVLHlCQUF5QjtJQUVsQywrRUFBK0U7SUFDL0Usa0ZBQWtGO0lBQ2xGLE1BQU0sbUJBQW1CLEdBQ3pCO1FBQ0MsOEJBQThCO1FBQzlCLHlCQUF5QjtRQUN6QiwyQkFBMkI7UUFDM0IsNkJBQTZCO1FBQzdCLHVCQUF1QjtLQUN2QixDQUFDO0lBRUYsK0VBQStFO0lBQy9FLHdFQUF3RTtJQUN4RSxTQUFnQixpQkFBaUI7UUFFaEMseURBQXlEO1FBQ3pELElBQUksS0FBSyxHQUFHLFFBQVEsQ0FBRSxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBRSx5QkFBeUIsQ0FBRSxDQUFFLENBQUM7UUFDdkYsSUFBSyxDQUFDLFFBQVEsQ0FBRSxLQUFLLENBQUUsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLEtBQUssSUFBSSxtQkFBbUIsQ0FBQyxNQUFNLEVBQzNFO1lBQ0MsS0FBSyxHQUFHLENBQUMsQ0FBQztTQUNWO1FBRUQsS0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLG1CQUFtQixDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFDcEQ7WUFDQyxNQUFNLE9BQU8sR0FBRyxDQUFDLENBQUUsR0FBRyxHQUFHLG1CQUFtQixDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7WUFDcEQsSUFBSyxPQUFPLEVBQ1o7Z0JBQ0MsT0FBTyxDQUFDLE9BQU8sR0FBRyxDQUFFLENBQUMsS0FBSyxLQUFLLENBQUUsQ0FBQzthQUNsQztTQUNEO0lBQ0YsQ0FBQztJQWpCZSwyQ0FBaUIsb0JBaUJoQyxDQUFBO0lBRUQsMEVBQTBFO0lBQzFFLDBFQUEwRTtJQUMxRSxTQUFnQixpQ0FBaUM7UUFFaEQsQ0FBQyxDQUFDLGFBQWEsQ0FBRSw0Q0FBNEMsQ0FBRSxDQUFDO0lBQ2pFLENBQUM7SUFIZSwyREFBaUMsb0NBR2hELENBQUE7SUFFRCxjQUFjO0lBQ2Q7UUFDQyxpQkFBaUIsRUFBRSxDQUFDO0tBQ3BCO0FBQ0YsQ0FBQyxFQTdDUyx5QkFBeUIsS0FBekIseUJBQXlCLFFBNkNsQyJ9