"use strict";
/// <reference path="csgo.d.ts" />
var MainMenuMissions;
(function (MainMenuMissions) {
    const _m_missionPanel = $.GetContextPanel();
    function Init() {
        UpdateMissionEntries();
    }
    function UpdateMissionEntries() {
        let missionInfo = MissionsAPI.GetRecurringMission();
        const missionContainer = $("#mission-container-root");
        if (!missionContainer)
            return;
        missionContainer.RemoveAndDeleteChildren();
        if (missionInfo != undefined) {
            if (missionContainer) {
                $.GetContextPanel().RemoveClass('hidden');
                const elMissionPanel = $.CreatePanel('Button', missionContainer, missionInfo.name);
                elMissionPanel.BLoadLayoutSnippet("mission");
                const elNameLabel = elMissionPanel.FindChildTraverse("name");
                elNameLabel.text = missionInfo.loc_description;
                //elMissionPanel.SetDialogVariableLocString( "desc", missionInfo.loc_description );
                elMissionPanel.SetDialogVariableInt("progress", missionInfo.progress_saved);
                elMissionPanel.SetDialogVariableInt("points", missionInfo.goal_points[0]);
                elMissionPanel.SetDialogVariableInt("xp", Number(missionInfo.xp_reward[0]));
                elMissionPanel.SetPanelEvent("onactivate", PlayMission.bind(undefined, missionInfo));
                function ExtractStringTokens(string_tokens) {
                    for (const k in string_tokens) {
                        if (typeof string_tokens[k] === 'object' && !Array.isArray(string_tokens[k]) && string_tokens[k] !== null) {
                            ExtractStringTokens(string_tokens[k]);
                        }
                        const val = string_tokens[k];
                        elMissionPanel.SetDialogVariableLocString(k, val);
                    }
                }
                if (missionInfo.string_tokens) {
                    ExtractStringTokens(missionInfo.string_tokens);
                    // map image
                    let imagePath = 'undefined';
                    // is there a map image we should use?
                    if (missionInfo.hasOwnProperty('mapgroup') && missionInfo.mapgroup != '') {
                        const cfg = GameTypesAPI.GetConfig();
                        const mg = cfg.mapgroups[missionInfo['mapgroup']];
                        const keysList = Object.keys(mg.maps);
                        imagePath = keysList[0];
                    }
                    else if (missionInfo.hasOwnProperty('map') && missionInfo.map != '' && missionInfo.map) {
                        imagePath = missionInfo.map;
                    }
                    const elBg = $.GetContextPanel().FindChildTraverse('id-mission-art');
                    elBg.style.backgroundImage = 'url("file://{images}/map_icons/screenshots/720p/' + (imagePath) + '.png")';
                }
            }
        }
        else {
            $.GetContextPanel().AddClass('hidden');
        }
    }
    function PlayMission(m) {
        // UpdateMissionEntries();
        // return;
        LobbyAPI.CreateSession();
        const gameMode = m.gamemode;
        let gameType = "classic";
        let gmFlags = 0;
        if (gameMode === "deathmatch") {
            gameType = "gungame";
            gmFlags = 32; // ffa
        }
        let mg = m.mapgroup;
        if (gameMode == "competitive") {
            mg = "mg_" + m.map; // singlemap only? 
            gmFlags = 16; // longmatch
        }
        var settings = {
            update: {
                Options: {
                    action: "custommatch",
                    server: "official"
                },
                Game: {
                    mode: gameMode,
                    type: gameType,
                    mapgroupname: mg,
                    map: m.map,
                    gamemodeflags: gmFlags,
                },
            },
            delete: {
                Options: {
                    challengekey: 1
                }
            }
        };
        LobbyAPI.UpdateSessionSettings(settings);
        LobbyAPI.StartMatchmaking('', '', '', '');
    }
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        Init();
        $.RegisterForUnhandledEvent('OnRecurringMissionsReceived', Init);
        $.RegisterForUnhandledEvent('OnRecurringMissionsChanged', Init);
    }
})(MainMenuMissions || (MainMenuMissions = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbm1lbnVfbWlzc2lvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9tYWlubWVudV9taXNzaW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBRWxDLElBQVUsZ0JBQWdCLENBZ0p6QjtBQWhKRCxXQUFVLGdCQUFnQjtJQUV6QixNQUFNLGVBQWUsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUM7SUFFNUMsU0FBUyxJQUFJO1FBRVosb0JBQW9CLEVBQUUsQ0FBQztJQUN4QixDQUFDO0lBRUQsU0FBUyxvQkFBb0I7UUFFNUIsSUFBSSxXQUFXLEdBQTJCLFdBQVcsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1FBQzVFLE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDdEQsSUFBSyxDQUFDLGdCQUFnQjtZQUNyQixPQUFPO1FBRVIsZ0JBQWdCLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUMzQyxJQUFLLFdBQVcsSUFBSSxTQUFTLEVBQzdCO1lBQ0MsSUFBSyxnQkFBZ0IsRUFDckI7Z0JBRUMsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLFdBQVcsQ0FBRSxRQUFRLENBQUUsQ0FBQztnQkFFNUMsTUFBTSxjQUFjLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxRQUFRLEVBQzdDLGdCQUFnQixFQUNoQixXQUFXLENBQUMsSUFBSSxDQUNoQixDQUFDO2dCQUVGLGNBQWMsQ0FBQyxrQkFBa0IsQ0FBRSxTQUFTLENBQUUsQ0FBQztnQkFDL0MsTUFBTSxXQUFXLEdBQUcsY0FBYyxDQUFDLGlCQUFpQixDQUFFLE1BQU0sQ0FBYSxDQUFDO2dCQUMxRSxXQUFXLENBQUMsSUFBSSxHQUFHLFdBQVcsQ0FBQyxlQUFlLENBQUM7Z0JBQy9DLG1GQUFtRjtnQkFFbkYsY0FBYyxDQUFDLG9CQUFvQixDQUFFLFVBQVUsRUFBRSxX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