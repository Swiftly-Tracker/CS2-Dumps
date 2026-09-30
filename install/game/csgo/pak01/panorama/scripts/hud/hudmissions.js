"use strict";
/// <reference path="../csgo.d.ts" />
var HudMissions;
(function (HudMissions) {
    var _m_HudMissions = $.GetContextPanel();
    function UpdateQuestUI() {
        const missionDetails = MissionsAPI.GetActiveRecurringMission();
        if (missionDetails === undefined || GameStateAPI.GetMapBSPName() === 'lobby_mapveto') {
            _m_HudMissions.AddClass("hidden");
            return;
        }
        _m_HudMissions.RemoveClass("hidden");
        _m_HudMissions.FindChildInLayoutFile('MissionLabel').text = missionDetails.loc_description;
        _m_HudMissions.SetDialogVariableInt("progress", missionDetails.progress_saved);
        _m_HudMissions.SetDialogVariableInt("goal", missionDetails.goal_points.slice(-1)[0]);
        if (missionDetails.string_tokens) {
            for (const k in missionDetails.string_tokens) {
                const val = missionDetails.string_tokens[k];
                _m_HudMissions.SetDialogVariableLocString(k, val);
            }
        }
    }
    {
        $.RegisterForUnhandledEvent("GameState_OnMatchStart", UpdateQuestUI);
        $.RegisterForUnhandledEvent("OnQuestProgressMade", UpdateQuestUI);
    }
})(HudMissions || (HudMissions = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHVkbWlzc2lvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9odWQvaHVkbWlzc2lvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUVyQyxJQUFVLFdBQVcsQ0FrQ3BCO0FBbENELFdBQVUsV0FBVztJQUVwQixJQUFJLGNBQWMsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUM7SUFFekMsU0FBUyxhQUFhO1FBRXJCLE1BQU0sY0FBYyxHQUEyQixXQUFXLENBQUMseUJBQXlCLEVBQUUsQ0FBQztRQUN2RixJQUFJLGNBQWMsS0FBSyxTQUFTLElBQUksWUFBWSxDQUFDLGFBQWEsRUFBRSxLQUFLLGVBQWUsRUFDcEY7WUFDQyxjQUFjLENBQUMsUUFBUSxDQUFFLFFBQVEsQ0FBRSxDQUFBO1lBQ25DLE9BQU87U0FDUDtRQUNELGNBQWMsQ0FBQyxXQUFXLENBQUUsUUFBUSxDQUFFLENBQUM7UUFFdEMsY0FBYyxDQUFDLHFCQUFxQixDQUFFLGNBQWMsQ0FBYyxDQUFDLElBQUksR0FBRyxjQUFjLENBQUMsZUFBZSxDQUFDO1FBQzFHLGNBQWMsQ0FBQyxvQkFBb0IsQ0FBRSxVQUFVLEVBQUUsY0FBYyxDQUFDLGNBQWMsQ0FBRSxDQUFDO1FBQ2pGLGNBQWMsQ0FBQyxvQkFBb0IsQ0FBRSxNQUFNLEVBQUUsY0FBYyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDO1FBQ3ZGLElBQUssY0FBYyxDQUFDLGFBQWEsRUFDakM7WUFDQyxLQUFNLE1BQU0sQ0FBQyxJQUFJLGNBQWMsQ0FBQyxhQUFhLEVBQzdDO2dCQUNDLE1BQU0sR0FBRyxHQUFHLGNBQWMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzVDLGNBQWMsQ0FBQywwQkFBMEIsQ0FBRSxDQUFDLEVBQUUsR0FBRyxDQUFFLENBQUM7YUFDcEQ7U0FDRDtJQUNGLENBQUM7SUFLRDtRQUNDLENBQUMsQ0FBQyx5QkFBeUIsQ0FBRSx3QkFBd0IsRUFBRSxhQUFhLENBQUUsQ0FBQztRQUN2RSxDQUFDLENBQUMseUJBQXlCLENBQUUscUJBQXFCLEVBQUUsYUFBYSxDQUFFLENBQUM7S0FDcEU7QUFDRixDQUFDLEVBbENTLFdBQVcsS0FBWCxXQUFXLFFBa0NwQiJ9