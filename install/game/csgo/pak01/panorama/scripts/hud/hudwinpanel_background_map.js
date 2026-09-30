"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../avatar.ts" />
/// <reference path="../digitpanel.ts" />
/// <reference path="../particle_controls.ts" />
/// <reference path="../common/iteminfo.ts" />
/// <reference path="../common/scheduler.ts" />
/// <reference path="../common/teamcolor.ts" />
var MvpBackgroundMap;
(function (MvpBackgroundMap) {
    function SetUpMapWinPanel(xuid, reason, team, elParent) {
        let strTeam = team === 3 ? 'ct' : 't';
        let mvpCharItemId = GameStateAPI.GetPlayerCharacterItemID(xuid);
        let oSettings;
        let isNonPremier;
        if (!mvpCharItemId)
            mvpCharItemId = LoadoutAPI.GetItemID(strTeam, 'customplayer');
        let teamOverride = $.GetContextPanel().Data().teamOverride;
        if (teamOverride) {
            $.GetContextPanel().SetHasClass('WinPanelRoot--Win--T', $.GetContextPanel().Data().teamOverride === 2);
            $.GetContextPanel().SetHasClass('WinPanelRoot--Win--CT', $.GetContextPanel().Data().teamOverride === 3);
        }
        let mode = $.GetContextPanel().Data().gameModeOverride;
        if (mode && !GameStateAPI.IsQueuedMatchmaking()) {
            mode = $.GetContextPanel().Data().gameModeOverride;
        }
        else {
            if (mode === 'competitive' && GameStateAPI.GetPlayerCompetitiveRankType(xuid) === 'Premier') {
                mode = 'premier';
            }
            else {
                mode = GameStateAPI.GetGameModeInternalName(false);
            }
        }
        isNonPremier = mode.toLowerCase() !== 'premier';
        $.GetContextPanel().SetHasClass('non-premier', isNonPremier);
        let backgroundCharModel = "";
        if (strTeam === 't')
            backgroundCharModel = "agents/models/ctm_sas/ctm_sas.vmdl";
        else
            backgroundCharModel = "agents/models/tm_phoenix/tm_phoenix.vmdl";
        oSettings = {
            mapPanel: elParent.FindChild('id-match-mvp-map'),
            numTeam: team,
            mvpTeam: strTeam,
            mvpCharModel: ItemInfo.GetModelPlayer(mvpCharItemId),
            backgroundCharModel,
            backgroundEntities: ['background_particles_squares', 'background_particles_basic', 'background_particles_vertical']
        };
        SetFlairModel(oSettings, xuid);
        if (isNonPremier) {
            _MvpMapPanelLogicNonPremier(oSettings);
        }
        else {
            switch (reason) {
                case 1:
                    _MvpMapPanelLogicCelebrate(oSettings);
                    break;
                case 2:
                    _MvpMapPanelLogicCelebrate(oSettings);
                    break;
                case 3:
                    _MvpMapPanelLogicCelebrate(oSettings);
                    break;
                case 4:
                    _MvpMapPanelLogicCelebrate(oSettings);
                    break;
                case 5:
                    _MvpMapPanelLogicCelebrate(oSettings);
                    break;
                case 7:
                    _MvpMapPanelLogicCelebrate(oSettings);
                    break;
                case 9:
                    _MvpMapPanelLogicAceRound(oSettings);
                    break;
                case 10:
                    _MvpMapPanelLogicBurnDamage(oSettings);
                    break;
                case 11:
                    _MvpMapPanelLogicBlastDamage(oSettings);
                    break;
                case 12:
                    break;
                case 13:
                    _MvpMapPanelLogicBombPlant(oSettings);
                    break;
                case 14:
                    _MvpMapPanelLogicBombDefuse(oSettings);
                    break;
                case 15:
                    _MvpMapPanelLogicThreeKills(oSettings);
                    break;
                case 16:
                    _MvpMapPanelLogicFourKills(oSettings);
                    break;
            }
        }
    }
    MvpBackgroundMap.SetUpMapWinPanel = SetUpMapWinPanel;
    function MakeMvpMapPanel(elParent) {
        if (elParent.FindChildInLayoutFile('id-match-mvp-map')) {
            elParent.RemoveAndDeleteChildren();
        }
        return $.CreatePanel('MapPlayerPreviewPanel', elParent, 'id-match-mvp-map', {
            "require-composition-layer": "true",
            "pin-fov": "vertical",
            "transparent-background": "false",
            class: 'mvp_map',
            camera: 'camera',
            map: 'ui/match_mvp',
            mouse_rotate: false,
            playername: "mvp_char",
            animgraphcharactermode: "mvp-banner"
        });
    }
    function _MvpMapPanelLogicAceRound(oSettings) {
        let elMap = oSettings.mapPanel;
        let itemId = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(InventoryAPI.GetItemDefinitionIndexFromDefinitionName('weapon_awp'), 0);
        elMap.TransitionToCamera('camera_start', 0);
        HideCharacters(oSettings);
        elMap.SetActiveCharacter(0);
        elMap.SetPlayerModel(oSettings.mvpCharModel);
        elMap.EquipPlayerWithItem(itemId);
        elMap.PlayBannerAnimation('banner_awp_ace_gun');
        let model = oSettings.backgroundCharModel;
        elMap.SetActiveCharacter(1);
        elMap.SetPlayerModel(model);
        elMap.PlayBannerAnimation('banner_awp_ace_a');
        elMap.SetActiveCharacter(2);
        elMap.SetPlayerModel(model);
        elMap.PlayBannerAnimation('banner_awp_ace_b');
        elMap.SetActiveCharacter(3);
        elMap.SetPlayerModel(model);
        elMap.PlayBannerAnimation('banner_awp_ace_c');
        elMap.SetActiveCharacter(4);
        elMap.SetPlayerModel(model);
        elMap.PlayBannerAnimation('banner_awp_ace_d');
        elMap.SetActiveCharacter(5);
        elMap.SetPlayerModel(model);
        elMap.PlayBannerAnimation('banner_awp_ace_e');
        oSettings.playerIndexes = [0, 1, 2, 3, 4, 5];
        ShowCharacters(oSettings);
        oSettings.backgroundIndex = 2;
        SharedMapLogic(oSettings);
        elMap.FireEntityInput("env_effects_ace", "start");
        $.Schedule(1.1, () => {
            elMap.TransitionToCamera('camera', 1.2);
        });
        $.Schedule(1.8, () => {
            elMap.FireEntityInput("card", "Enable");
            elMap.FireEntityInput("card", "SetAnimationNotLooping", "ace_card_anim");
        });
        $.Schedule(2.8, () => {
            elMap.FireEntityInput('mvp_awp_blast', 'Stop');
            elMap.FireEntityInput('mvp_awp_blast', 'Start');
        });
        $.Schedule(2.8, () => {
            elMap.TransitionToCamera('camera_card', .1);
        });
        $.Schedule(10.0, () => {
            elMap.FireEntityInput("card", "Disable");
            elMap.FireEntityInput("card", "SetAnimationNotLooping", "idle_offscreen");
        });
    }
    function _MvpMapPanelLogicThreeKills(oSettings) {
        let elMap = oSettings.mapPanel;
        let itemId = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(InventoryAPI.GetItemDefinitionIndexFromDefinitionName('weapon_p250'), 0);
        elMap.TransitionToCamera('camera_start', 0);
        HideCharacters(oSettings);
        elMap.SetActiveCharacter(0);
        elMap.SetPlayerModel(oSettings.mvpCharModel);
        elMap.EquipPlayerWithItem(itemId);
        elMap.PlayBannerAnimation('banner_pistol3shot');
        let model = oSettings.backgroundCharModel;
        elMap.SetActiveCharacter(1);
        elMap.SetPlayerModel(model);
        elMap.PlayBannerAnimation('banner_3shot_a');
        elMap.SetActiveCharacter(2);
        elMap.SetPlayerModel(model);
        elMap.PlayBannerAnimation('banner_3shot_b');
        elMap.SetActiveCharacter(3);
        elMap.SetPlayerModel(model);
        elMap.PlayBannerAnimation('banner_3shot_c');
        oSettings.playerIndexes = [0, 1, 2, 3];
        ShowCharacters(oSettings);
        oSettings.backgroundIndex = 2;
        SharedMapLogic(oSettings);
        elMap.FireEntityInput("env_effects_multikill", "Start");
        $.Schedule(1.2, () => {
            elMap.TransitionToCamera('camera', 1);
        });
    }
    function _MvpMapPanelLogicFourKills(oSettings) {
        let elMap = oSettings.mapPanel;
        let itemId = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(InventoryAPI.GetItemDefinitionIndexFromDefinitionName('weapon_p250'), 0);
        elMap.TransitionToCamera('camera_start', 0);
        HideCharacters(oSettings);
        elMap.SetActiveCharacter(0);
        elMap.SetPlayerModel(oSettings.mvpCharModel);
        elMap.EquipPlayerWithItem(itemId);
        elMap.PlayBannerAnimation('banner_pistol4shot');
        let model = oSettings.backgroundCharModel;
        elMap.SetActiveCharacter(1);
        elMap.SetPlayerModel(model);
        elMap.PlayBannerAnimation('banner_4shot_a');
        elMap.SetActiveCharacter(2);
        elMap.SetPlayerModel(model);
        elMap.PlayBannerAnimation('banner_4shot_b');
        elMap.SetActiveCharacter(3);
        elMap.SetPlayerModel(model);
        elMap.PlayBannerAnimation('banner_4shot_c');
        elMap.SetActiveCharacter(4);
        elMap.SetPlayerModel(model);
        elMap.PlayBannerAnimation('banner_4shot_d');
        oSettings.playerIndexes = [0, 1, 2, 3, 4];
        ShowCharacters(oSettings);
        oSettings.backgroundIndex = 2;
        SharedMapLogic(oSettings);
        elMap.FireEntityInput("env_effects_multikill", "Start");
        $.Schedule(1.2, () => {
            elMap.TransitionToCamera('camera_4_kill', 1);
        });
    }
    function _MvpMapPanelLogicCelebrate(oSettings) {
        let elMap = oSettings.mapPanel;
        elMap.TransitionToCamera('camera_celebrate', 0);
        HideCharacters(oSettings);
        $.Schedule(.1, () => {
            elMap.TransitionToCamera('camera_start', 3);
        });
        elMap.SetActiveCharacter(6);
        elMap.SetPlayerModel(oSettings.mvpCharModel);
        elMap.PlayBannerAnimation('celebrate_stretch_noweap_idle0' + (Math.round(Math.random() * 3) + 1));
        oSettings.playerIndexes = [6];
        ShowCharacters(oSettings);
        oSettings.backgroundIndex = 1;
        SharedMapLogic(oSettings);
    }
    function _MvpMapPanelLogicBombPlant(oSettings) {
        let elMap = oSettings.mapPanel;
        let itemId = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(InventoryAPI.GetItemDefinitionIndexFromDefinitionName('weapon_c4'), 0);
        elMap.TransitionToCamera('camera_plant', 0);
        HideCharacters(oSettings);
        elMap.SetActiveCharacter(12);
        elMap.SetPlayerModel(oSettings.mvpCharModel);
        elMap.EquipPlayerWithItem(itemId);
        elMap.PlayBannerAnimation('banner_bomb_plant');
        elMap.FireEntityInput('mvp_char12', 'Alpha');
        elMap.SetActiveCharacter(13);
        elMap.SetPlayerModel(oSettings.mvpCharModel);
        elMap.EquipPlayerWithItem(itemId);
        elMap.PlayBannerAnimation('banner_bomb_plant');
        elMap.FireEntityInput('mvp_background_particles', 'SetControlPoint', '20: 0 0 ' + oSettings.numTeam);
        oSettings.playerIndexes = [13];
        ShowCharacters(oSettings);
        oSettings.backgroundIndex = 2;
        SharedMapLogic(oSettings);
        elMap.FireEntityInput('mvp_chicken', 'Start');
        $.Schedule(3.8, () => {
            elMap.FireEntityInput('mvp_char12', 'Alpha', '255');
        });
        $.Schedule(4.0, () => {
            elMap.FireEntityInput('mvp_bomb_light', 'start');
        });
    }
    function _MvpMapPanelLogicBombDefuse(oSettings) {
        let elMap = oSettings.mapPanel;
        let itemId = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(InventoryAPI.GetItemDefinitionIndexFromDefinitionName('weapon_c4'), 0);
        elMap.TransitionToCamera('camera_defuse', 0);
        HideCharacters(oSettings);
        elMap.SetActiveCharacter(1);
        elMap.SetPlayerModel(oSettings.mvpCharModel);
        elMap.EquipPlayerWithItem(itemId);
        elMap.PlayBannerAnimation('banner_bomb_defusal_ver' + (Math.round(Math.random()) + 1));
        elMap.FireEntityInput('mvp_background_particles', 'SetControlPoint', '20: 0 0 ' + oSettings.numTeam);
        oSettings.playerIndexes = [1];
        ShowCharacters(oSettings);
        oSettings.backgroundIndex = 2;
        SharedMapLogic(oSettings);
    }
    function _MvpMapPanelLogicBurnDamage(oSettings) {
        let elMap = oSettings.mapPanel;
        let model = oSettings.backgroundCharModel;
        elMap.TransitionToCamera('camera_start', 0);
        HideCharacters(oSettings);
        elMap.SetActiveCharacter(7);
        elMap.SetPlayerModel(model);
        elMap.PlayBannerAnimation('banner_fire');
        elMap.SetActiveCharacter(6);
        elMap.SetPlayerModel(oSettings.mvpCharModel);
        elMap.PlayBannerAnimation('celebrate_stretch_noweap_idle0' + (Math.round(Math.random() * 3) + 1));
        oSettings.playerIndexes = [6, 7];
        ShowCharacters(oSettings);
        oSettings.backgroundIndex = 2;
        SharedMapLogic(oSettings);
        elMap.FireEntityInput('mvp_burndamage_effects', 'start');
    }
    function _MvpMapPanelLogicBlastDamage(oSettings) {
        let elMap = oSettings.mapPanel;
        elMap.TransitionToCamera('camera_grenade_start', 0);
        HideCharacters(oSettings);
        elMap.SetActiveCharacter(11);
        elMap.SetPlayerModel(oSettings.mvpCharModel);
        elMap.PlayBannerAnimation('banner_bomb_blast_toss');
        elMap.SetActiveCharacter(8);
        elMap.SetPlayerModel(oSettings.backgroundCharModel);
        elMap.PlayBannerAnimation('banner_bomb_blast01');
        elMap.SetActiveCharacter(9);
        elMap.SetPlayerModel(oSettings.backgroundCharModel);
        elMap.PlayBannerAnimation('banner_bomb_blast02');
        elMap.SetActiveCharacter(10);
        elMap.SetPlayerModel(oSettings.backgroundCharModel);
        elMap.PlayBannerAnimation('banner_bomb_blast03');
        oSettings.playerIndexes = [8, 9, 10];
        ShowCharacters(oSettings);
        oSettings.backgroundIndex = 2;
        SharedMapLogic(oSettings);
        $.Schedule(2, () => {
            elMap.TransitionToCamera('camera_grenade', 1);
            elMap.FireEntityInput('mvp_char11', 'Alpha', '255');
        });
        $.Schedule(5, () => {
            elMap.FireEntityInput('mvp_char10', 'Alpha', '0');
        });
    }
    function _MvpMapPanelLogicNonPremier(oSettings) {
        let elMap = oSettings.mapPanel;
        elMap.TransitionToCamera('camera_start', 0);
        $.Schedule(.1, () => {
            elMap.TransitionToCamera('camera_non_premier', 3);
        });
        oSettings.playerIndexes = [];
        HideCharacters(oSettings);
        oSettings.backgroundIndex = 0;
        SharedMapLogic(oSettings);
    }
    function SharedMapLogic(oSettings) {
        let ctLightColor = '67 162 230';
        let tLightColor = '129 107 28';
        oSettings.mapPanel.FireEntityInput('mvp_burndamage_effects', 'Stop');
        oSettings.mapPanel.FireEntityInput("env_effects_multikill", "Stop");
        oSettings.mapPanel.FireEntityInput("env_effects_ace", "Stop");
        oSettings.mapPanel.FireEntityInput('mvp_bomb_light', 'Stop');
        oSettings.mapPanel.FireEntityInput('mvp_chicken', 'Stop');
        oSettings.mapPanel.FireEntityInput('env_effects_basic', 'Stop');
        oSettings.mapPanel.FireEntityInput('mvp_light_spot', 'SetColor', oSettings.mvpTeam === 'ct' ? ctLightColor : tLightColor);
        oSettings.mapPanel.FireEntityInput('mvp_light_spot2', 'SetColor', oSettings.mvpTeam === 'ct' ? ctLightColor : tLightColor);
        SetBackgroundParticles(oSettings);
    }
    function SetBackgroundParticles(oSettings) {
        oSettings.backgroundEntities.forEach(entry => { oSettings.mapPanel.FireEntityInput(entry, 'Stop'); });
        oSettings.mapPanel.FireEntityInput(oSettings.backgroundEntities[oSettings.backgroundIndex], 'Start');
        oSettings.mapPanel.FireEntityInput(oSettings.backgroundEntities[oSettings.backgroundIndex], 'SetControlPoint', '20: 0 0 ' + oSettings.numTeam);
    }
    function HideCharacters(oSettings) {
        let numChars = 13;
        for (let i = 0; i <= numChars; i++) {
            oSettings.mapPanel.FireEntityInput('mvp_char' + i, 'Alpha', '0');
            oSettings.mapPanel.SetActiveCharacter(i);
            oSettings.mapPanel.PlayBannerAnimation('idle_offscreen');
        }
    }
    function ShowCharacters(oSettings) {
        for (let i = 0; i < oSettings.playerIndexes.length; i++) {
            oSettings.mapPanel.FireEntityInput('mvp_char' + oSettings.playerIndexes[i], 'Alpha', '255');
        }
    }
    function SetFlairModel(oSettings, xuid) {
        let flairItemId = InventoryAPI.GetFlairItemId(xuid);
        oSettings.mapPanel.FireEntityInput("item", "SetItem", flairItemId);
    }
})(MvpBackgroundMap || (MvpBackgroundMap = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHVkd2lucGFuZWxfYmFja2dyb3VuZF9tYXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9odWQvaHVkd2lucGFuZWxfYmFja2dyb3VuZF9tYXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyxxQ0FBcUM7QUFDckMseUNBQXlDO0FBQ3pDLGdEQUFnRDtBQUNoRCw4Q0FBOEM7QUFDOUMsK0NBQStDO0FBQy9DLCtDQUErQztBQWEvQyxJQUFVLGdCQUFnQixDQStmekI7QUEvZkQsV0FBVSxnQkFBZ0I7SUFFdEIsU0FBZ0IsZ0JBQWdCLENBQUUsSUFBWSxFQUFFLE1BQWMsRUFBRSxJQUFZLEVBQUUsUUFBZ0I7UUFHMUYsSUFBSSxPQUFPLEdBQUcsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFBLENBQUMsQ0FBQyxHQUFpQixDQUFDO1FBQ25ELElBQUksYUFBYSxHQUFHLFlBQVksQ0FBQyx3QkFBd0IsQ0FBRSxJQUFJLENBQUUsQ0FBQztRQUNsRSxJQUFJLFNBQTZCLENBQUM7UUFDbEMsSUFBSSxZQUFzQixDQUFDO1FBRTNCLElBQUssQ0FBQyxhQUFhO1lBQ2YsYUFBYSxHQUFHLFVBQVUsQ0FBQyxTQUFTLENBQUUsT0FBTyxFQUFFLGNBQWMsQ0FBRSxDQUFDO1FBRzFFLElBQUksWUFBWSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxZQUFZLENBQUM7UUFDM0QsSUFBSSxZQUFZLEVBQ2hCO1lBQ1UsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLFdBQVcsQ0FBRSxzQkFBc0IsRUFBRSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsWUFBWSxLQUFLLENBQUMsQ0FBRSxDQUFDO1lBQ3pHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxXQUFXLENBQUUsdUJBQXVC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Q0FBRSxDQUFDO1FBQ3BDLEtBQUssQ0FBQyxtQkFBbUIsQ0FBRSxvQkFBb0IsQ0FBRSxDQUFDO1FBRWxELElBQUksS0FBSyxHQUFHLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQztRQUMxQyxLQUFLLENBQUMsa0JBQWtCLENBQUUsQ0FBQyxDQUFFLENBQUM7UUFDOUIsS0FBSyxDQUFDLGNBQWMsQ0FBRSxLQUFLLENBQUUsQ0FBQztRQUM5QixLQUFLLENBQUMsbUJBQW1CLENBQUUsa0JBQWtCLENBQUUsQ0FBQztRQUVoRCxLQUFLLENBQUMsa0JBQWtCLENBQUUsQ0FBQyxDQUFFLENBQUM7UUFDOUIsS0FBSyxDQUFDLGNBQWMsQ0FBRSxLQUFLLENBQUUsQ0FBQztRQUM5QixLQUFLLENBQUMsbUJBQW1CLENBQUUsa0JBQWtCLENBQUUsQ0FBQztRQUVoRCxLQUFLLENBQUMsa0JBQWtCLENBQUUsQ0FBQyxDQUFFLENBQUM7UUFDOUIsS0FBSyxDQUFDLGNBQWMsQ0FBRSxLQUFLLENBQUUsQ0FBQztRQUM5QixLQUFLLENBQUMsbUJBQW1CLENBQUUsa0JBQWtCLENBQUUsQ0FBQztRQUVoRCxLQUFLLENBQUMsa0JBQWtCLENBQUUsQ0FBQyxDQUFFLENBQUM7UUFDOUIsS0FBSyxDQUFDLGNBQWMsQ0FBRSxLQUFLLENBQUUsQ0FBQztRQUM5QixLQUFLLENBQUMsbUJBQW1CLENBQUUsa0JBQWtCLENBQUUsQ0FBQztRQUVoRCxLQUFLLENBQUMsa0JBQWtCLENBQUUsQ0FBQyxDQUFFLENBQUM7UUFDOUIsS0FBSyxDQUFDLGNBQWMsQ0FBRSxLQUFLLENBQUUsQ0FBQztRQUM5QixLQUFLLENBQUMsbUJBQW1CLENBQUUsa0JBQWtCLENBQUUsQ0FBQztRQUVoRCxTQUFTLENBQUMsYUFBYSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM3QyxjQUFjLENBQUUsU0FBUyxDQUFFLENBQUM7UUFFNUIsU0FBUyxDQUFDLGVBQWUsR0FBRyxDQUFD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