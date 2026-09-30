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
        //let numKills = GameStateAPI.GetPlayerRoundKills( xuid );
        let strTeam = team === 3 ? 'ct' : 't'; // 2 is team--TERRORIST,
        let mvpCharItemId = GameStateAPI.GetPlayerCharacterItemID(xuid);
        let oSettings;
        let isNonPremier;
        if (!mvpCharItemId)
            mvpCharItemId = LoadoutAPI.GetItemID(strTeam, 'customplayer');
        // Override is set in the controllibrary.xml for testing.
        let teamOverride = $.GetContextPanel().Data().teamOverride;
        if (teamOverride) {
            $.GetContextPanel().SetHasClass('WinPanelRoot--Win--T', $.GetContextPanel().Data().teamOverride === 2);
            $.GetContextPanel().SetHasClass('WinPanelRoot--Win--CT', $.GetContextPanel().Data().teamOverride === 3);
        }
        // Override is set in the controllibrary.xml for testing.
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
        // Background characters represent the opposite team
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
            // debug so we don't have to go into premier every time to see the anims
            // _MvpMapPanelLogicThreeKills( oSettings );
        }
        else {
            switch (reason) {
                case 1: // CSMVP_ELIMINATION
                    _MvpMapPanelLogicCelebrate(oSettings);
                    break;
                case 2: // CSMVP_BOMBPLANT
                    _MvpMapPanelLogicCelebrate(oSettings);
                    break;
                case 3: // CSMVP_BOMBDEFUSE
                    _MvpMapPanelLogicCelebrate(oSettings);
                    break;
                case 4: // CSMVP_HOSTAGERESCUE
                    // GENERIC PANEL
                    _MvpMapPanelLogicCelebrate(oSettings);
                    break;
                case 5: // CSMVP_GUNGAMEWINNER
                    // GENERIC PANEL
                    _MvpMapPanelLogicCelebrate(oSettings);
                    break;
                case 7: // CSMVP_SURVIVALSURVIVOR
                    // GENERIC PANEL
                    _MvpMapPanelLogicCelebrate(oSettings);
                    break;
                case 9: // CSMVP_ACEROUND
                    _MvpMapPanelLogicAceRound(oSettings);
                    break;
                case 10: // CSMVP_BURNDAMAGE
                    _MvpMapPanelLogicBurnDamage(oSettings);
                    break;
                case 11: //CSMVP_NADEDAMAGE
                    // GENERIC PANEL
                    _MvpMapPanelLogicBlastDamage(oSettings);
                    break;
                case 12: // CSMVP_MOSTFLASHED
                    break;
                case 13: // CSMVP_BOMBPLANT_CLUTCH
                    _MvpMapPanelLogicBombPlant(oSettings);
                    break;
                case 14: // CSMVP_BOMBDEFUSE_CLUTCH
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
            //return elParent.FindChildInLayoutFile('id-match-mvp-map' ) as MapPlayerPreviewPanel_t ;
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
        //Move card off screen
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
        // oSettings.mapPanel.FireEntityInput( 'env_effects_basic', 'Start' );
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
        //Celebrating Character
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
        // $.Schedule( 1.75, ()=>{
        //     elMap.FireEntityInput( 'mvp_blast_effect', 'Stop' );
        //     elMap.FireEntityInput( 'mvp_blast_effect', 'start' );
        // })
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
        // oSettings.mapPanel.FireEntityInput( 'env_effects_basic', 'Start' );
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHVkd2lucGFuZWxfYmFja2dyb3VuZF9tYXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9odWQvaHVkd2lucGFuZWxfYmFja2dyb3VuZF9tYXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyxxQ0FBcUM7QUFDckMseUNBQXlDO0FBQ3pDLGdEQUFnRDtBQUNoRCw4Q0FBOEM7QUFDOUMsK0NBQStDO0FBQy9DLCtDQUErQztBQWEvQyxJQUFVLGdCQUFnQixDQStmekI7QUEvZkQsV0FBVSxnQkFBZ0I7SUFFdEIsU0FBZ0IsZ0JBQWdCLENBQUUsSUFBWSxFQUFFLE1BQWMsRUFBRSxJQUFZLEVBQUUsUUFBZ0I7UUFFMUYsMERBQTBEO1FBQzFELElBQUksT0FBTyxHQUFHLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQSxDQUFDLENBQUMsR0FBaUIsQ0FBQyxDQUFFLHdCQUF3QjtRQUM3RSxJQUFJLGFBQWEsR0FBRyxZQUFZLENBQUMsd0JBQXdCLENBQUUsSUFBSSxDQUFFLENBQUM7UUFDbEUsSUFBSSxTQUE2QixDQUFDO1FBQ2xDLElBQUksWUFBc0IsQ0FBQztRQUUzQixJQUFLLENBQUMsYUFBYTtZQUNmLGFBQWEsR0FBRyxVQUFVLENBQUMsU0FBUyxDQUFFLE9BQU8sRUFBRSxjQUFjLENBQUUsQ0FBQztRQUVwRSx5REFBeUQ7UUFDL0QsSUFBSSxZQUFZLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDLFlBQVksQ0FBQztRQUMzRCxJQUFJLFlBQVksRUFDaEI7WUFDVSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsV0FBVyxDQUFFLHNCQUFzQixFQUFFLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxZQUFZLEtBQUssQ0FBQyxDQUFFLENBQUM7WUFDekcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLFdBQVcsQ0FBRSx1QkFBdUIsRUFBRSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsWUFBWSxLQUFLLENBQUMsQ0FBRSxDQUFDO1NBQ25IO1FBRUsseURBQXlEO1FBRXpELElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQztRQUN2RCxJQUFJLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxtQkFBbUIsRUFBRSxFQUMvQztZQUNJLElBQUksR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsZ0JBQWdCLENBQUM7U0FDdEQ7YUFFRDtZQUNJLElBQUssSUFBSSxLQUFLLGFBQWEsSUFBSSxZQUFZLENBQUMsNEJBQTRCLENBQUUsSUFBSSxDQUFFLEtBQUssU0FBUyxFQUM5RjtnQkFDSSxJQUFJLEdBQUcsU0FBUyxDQUFDO2FBQ3BCO2lCQUVEO2dCQUNJLElBQUksR0FBRyxZQUFZLENBQUMsdUJBQXVCLENBQUUsS0FBSyxDQUFFLENBQUM7YUFDeEQ7U0FDSjtRQUVELFlBQVksR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLEtBQUssU0FBUyxDQUFDO1FBQ2hELENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxXQUFXLENBQUUsYUFBYSxFQUFFLFlBQVksQ0FBRSxDQUFDO1FBRS9ELG9EQUFvRDtRQUNwRCxJQUFJLG1CQUFtQixHQUFHLEVBQUUsQ0FBQztRQUM3QixJQUFLLE9BQU8sS0FBSyxHQUFHO1lBQ2hCLG1CQUFtQixHQUFHLG9DQUFvQyxDQUFDOztZQUUzRCxtQkFBbUIsR0FBRywwQ0FBMEMsQ0FBQztRQUVyRSxTQUFTLEdBQUc7WUFDUixRQUFRLEVBQUUsUUFBUSxDQUFDLFNBQVMsQ0FBRSxrQkFBa0IsQ0FBNkI7WUFDN0UsT0FBTyxFQUFFLElBQUk7WUFDYixPQUFPLEVBQUUsT0FBTztZQUNoQixZQUFZLEVBQUUsUUFBUSxDQUFDLGNBQWMsQ0FBRSxhQUFhLENBQUU7WUFDdEQsbUJBQW1CO1lBQ25CLGtCQUFrQixFQUFFLENBQUMsOEJBQThCLEVBQUUsNEJBQTRCLEVBQUUsK0JBQStCLENBQUM7U0FDdEgsQ0FBQTtRQUVELGFBQWEsQ0FBRSxTQUFTLEVBQUUsSUFBSSxDQUFFLENBQUM7UUFFakMsSUFBSyxZQUFZLEVBQ2pCO1lBQ0ksMkJBQTJCLENBQUcsU0FBUyxDQUFFLENBQUM7WUFDMUMsd0VBQXdFO1lBQ3hFLDRDQUE0QztTQUMvQzthQUVEO1lBQ0ksUUFBUyxNQUFNLEVBQ2Y7Z0JBQ0ksS0FBSyxDQUFDLEVBQUUsb0JBQW9CO29CQUN4QiwwQkFBMEIsQ0FBRSxTQUFTLENBQUUsQ0FBQztvQkFDeEMsTUFBTTtnQkFDVixLQUFLLENBQUMsRUFBRSxrQkFBa0I7b0JBQ3RCLDBCQUEwQixDQUFFLFNBQVMsQ0FBRSxDQUFDO29CQUN4QyxNQUFNO2dCQUNWLEtBQUssQ0FBQyxFQUFFLG1CQUFtQjtvQkFDdkIsMEJBQTBCLENBQUUsU0FBUyxDQUFFLENBQUM7b0JBQ3hDLE1BQU07Z0JBQ1YsS0FBSyxDQUFDLEVBQUUsc0JBQXNCO29CQUMxQixnQkFBZ0I7b0JBQ2hCLDBCQUEwQixDQUFFLFNBQVMsQ0FBRSxDQUFDO29CQUN4QyxNQUFNO2dCQUNWLEtBQUssQ0FBQyxFQUFFLHNCQUFzQjtvQkFDMUIsZ0JBQWdCO29CQUNoQiwwQkFBMEIsQ0FBRSxTQUFTLENBQUUsQ0FBQztvQkFDeEMsTUFBTTtnQkFDVixLQUFLLENBQUMsRUFBRSx5QkFBeUI7b0JBQzdCLGdCQUFnQjtvQkFDaEIsMEJBQTBCLENBQUUsU0FBUyxDQUFFLENBQUM7b0JBQ3hDLE1BQU07Z0JBQ1YsS0FBSyxDQUFDLEVBQUUsaUJBQWlCO29CQUNyQix5QkFBeUIsQ0FBRSxTQUFTLENBQUUsQ0FBQztvQkFDdkMsTUFBTTtnQkFDVixLQUFLLEVBQUUsRUFBRSxtQkFBbUI7b0JBQ3hCLDJCQUEyQixDQUFFLFNBQVMsQ0FBRSxDQUFDO29CQUN6QyxNQUFNO2dCQUNWLEtBQUssRUFBRSxFQUFFLGtCQUFrQjtvQkFDdkIsZ0JBQWdCO29CQUNoQiw0QkFBNEIsQ0FBRSxTQUFTLENBQUUsQ0FBQztvQkFDMUMsTUFBTTtnQkFDVixLQUFLLEVBQUUsRUFBRSxvQkFBb0I7b0JBQ3pCLE1BQU07Z0JBQ1YsS0FBSyxFQUFFLEVBQUUseUJBQXlCO29CQUM5QiwwQkFBMEIsQ0FBRSxTQUFTLENBQUUsQ0FBQztvQkFDeEMsTUFBTTtnQkFDVixLQUFLLEVBQUUsRUFBRSwwQkFBMEI7b0JBQy9CLDJCQUEyQixDQUFFLFNBQVMsQ0FBRSxDQUFDO29CQUN6QyxNQUFNO2dCQUNWLEtBQUssRUFBRTtvQkFDSCwyQkFBMkIsQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDdkMsTUFBTTtnQkFDVixLQUFLLEVBQUU7b0JBQ0gsMEJBQTBCLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBQ3RDLE1BQU07YUFDYjtTQUNKO0lBQ0wsQ0FBQztJQXBIZSxpQ0FBZ0IsbUJBb0gvQixDQUFBO0lBRUQsU0FBUyxlQUFlLENBQUUsUUFBZ0I7UUFFdEMsSUFBTSxRQUFRLENBQUMscUJBQXFCLENBQUMsa0JBQWtCLENBQThCLEVBQ3JGO1lBQ0ksUUFBUSxDQUFDLHVCQUF1QixFQUFFLENBQUM7WUFDbkMseUZBQXlGO1NBQzVGO1FBRUQsT0FBTyxDQUFDLENBQUMsV0FBVyxDQUFFLHVCQUF1QixFQUFFLFFBQVEsRUFBRSxrQkFBa0IsRUFBRTtZQUN6RSwyQkFBMkIsRUFBRSxNQUFNO1lBQ25DLFNBQVMsRUFBRSxVQUFVO1lBQ3JCLHdCQUF3QixFQUFDLE9BQU87WUFDaEMsS0FBSyxFQUFFLFNBQVM7WUFDaEIsTUFBTSxFQUFFLFFBQVE7WUFDaEIsR0FBRyxFQUFFLGNBQWM7WUFDbkIsWUFBWSxFQUFFLEtBQUs7WUFDbkIsVUFBVSxFQUFFLFVBQVU7WUFDdEIsc0JBQXNCLEVBQUUsWUFBWTtTQUN2QyxDQUE2QixDQUFDO0lBQ25DLENBQUM7SUFFRCxTQUFTLHlCQUF5QixDQUFFLFNBQTZCO1FBRTdELElBQUksS0FBSyxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUM7UUFDL0IsSUFBSSxNQUFNLEdBQUcsWUFBWSxDQUFDLGlDQUFpQyxDQUFHLFlBQVksQ0FBQyx3Q0FBd0MsQ0FBRSxZQUFZLENBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUV4SSxLQUFLLENBQUMsa0JBQWtCLENBQUUsY0FBYyxFQUFFLENBQUMsQ0FBRSxDQUFDO1FBQzlDLHNCQUFzQjtRQUN0QixjQUFjLENBQUUsU0FBUyxDQUFFLENBQUM7UUFFNUIsS0FBSyxDQUFDLGtCQUFrQixDQUFFLENBQUMsQ0FBRSxDQUFDO1FBQzlCLEtBQUssQ0FBQyxjQUFjLENBQUUsU0FBUyxDQUFDLFlBQVksQ0FBRSxDQUFDO1FBQy9DLEtBQUssQ0FBQyxtQkFBbUIsQ0FBRSxNQUFNLENBQUUsQ0FBQztRQUNwQyxLQUFLLENBQUMsbUJBQW1CLENBQUUsb0JBQW9CLENBQUUsQ0FBQztRQUVsRCxJQUFJLEtBQUssR0FBRyxTQUFTLENBQUMsbUJBQW1CLENBQUM7UUFDMUMsS0FBSyxDQUFDLGtCQUFrQixDQUFFLENBQUMsQ0FBRSxDQUFDO1FBQzlCLEtBQUssQ0FBQyxjQUFjLENBQUUsS0FBSyxDQUFFLENBQUM7UUFDOUIsS0FBSyxDQUFDLG1CQUFtQixDQUFFLGtCQUFrQixDQUFFLENBQUM7UUFFaEQsS0FBSyxDQUFDLGtCQUFrQixDQUFFLENBQUMsQ0FBRSxDQUFDO1FBQzlCLEtBQUssQ0FBQyxjQUFjLENBQUUsS0FBSyxDQUFFLENBQUM7UUFDOUIsS0FBSyxDQUFDLG1CQUFtQixDQUFFLGtCQUFrQixDQUFFLENBQUM7UUFFaEQsS0FBSyxDQUFDLGtCQUFrQixDQUFFLENBQUMsQ0FBRSxDQUFDO1FBQzlCLEtBQUssQ0FBQyxjQUFjLENBQUUsS0FBSyxDQUFFLENBQUM7UUFDOUIsS0FBSyxDQUFDLG1CQUFtQixDQUFFLGtCQUFrQixDQUFFLENBQUM7UUFFaEQsS0FBSyxDQUFDLGtCQUFrQixDQUFFLENBQUMsQ0FBRSxDQUFDO1FBQzlCLEtBQUssQ0FBQyxjQUFjLENBQUUsS0FBSyxDQUFFLENBQUM7UUFDOUIsS0FBSyxDQUFDLG1CQUFtQixDQUFFLGtCQUFrQixDQUFFLENBQUM7UUFFaEQsS0FBSyxDQUFDLGtCQUFrQixDQUFFLENBQUMsQ0FBRSxDQUFDO1FBQzlCLEtBQUssQ0FBQyxjQUFjLENBQUUsS0FBSyxDQUFFLENBQUM7UUFDOUIsS0FBSyxDQUFDLG1CQUFtQixDQUFFLGtCQUFrQixDQUFFLENBQUM7UUFFaEQsU0FBUyxDQUFDLGFBQWEsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDN0MsY0FBYyxDQUFFLFNBQVMsQ0FBRSxDQUFDO1FBRTVCLFNBQVMsQ0FBQyxlQUFlLEdBQUcsQ0FBQyxDQUFDO1FBQzlCLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUUxQixLQUFLLENBQUMsZUFBZSxDQUFFLGlCQUFpQixFQUFFLE9BQU8sQ0FBRSxDQUFDO1FBRXBELENBQUMsQ0FBQyxRQUFRLENBQUUsR0FBRyxFQUFFLEdBQUUsRUFBRTtZQUNqQixLQUFLLENBQUMsa0JBQWtCLENBQUUsUUFBUSxFQUFFLEdBQUcsQ0FBRSxDQUFDO1FBQzlDLENBQUMsQ0FBQyxDQUFBO1FBRUYsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxHQUFHLEVBQUUsR0FBRSxFQUFFO1lBQ2pCLEtBQUssQ0FBQyxlQUFlLENBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBRSxDQUFDO1lBQzFDLEtBQUssQ0FBQyxlQUFlLENBQUUsTUFBTSxFQUFFLHdCQUF3QixFQUFFLGVBQWUsQ0FBRSxDQUFDO1FBQy9FLENBQUMsQ0FBRSxDQUFBO1FBRUgsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxHQUFHLEVBQUUsR0FBRSxFQUFFO1lBQ2pCLEtBQUssQ0FBQyxlQUFlLENBQUUsZUFBZSxFQUFFLE1BQU0sQ0FBRSxDQUFDO1lBQ2pELEtBQUssQ0FBQyxlQUFlLENBQUUsZUFBZSxFQUFFLE9BQU8sQ0FBRSxDQUFDO1FBRXRELENBQUMsQ0FBQyxDQUFDO1FBRUgsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxHQUFHLEVBQUUsR0FBRSxFQUFFO1lBQ2pCLEtBQUssQ0FBQyxrQkFBa0IsQ0FBRSxhQUFhLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDakQsQ0FBQyxDQUFDLENBQUM7UUFFSCxDQUFDLENBQUMsUUFBUSxDQUFFLElBQUksRUFBRSxHQUFFLEVBQUU7WUFDbEIsS0FBSyxDQUFDLGVBQWUsQ0FBRSxNQUFNLEVBQUUsU0FBUyxDQUFFLENBQUM7WUFDM0MsS0FBSyxDQUFDLGVBQWUsQ0FBRSxNQUFNLEVBQUUsd0JBQXdCLEVBQUUsZ0JBQWdCLENBQUUsQ0FBQztRQUNoRixDQUFDLENBQUUsQ0FBQTtJQUNQLENBQUM7SUFFRCxTQUFTLDJCQUEyQixDQUFFLFNBQTZCO1FBRS9ELElBQUksS0FBSyxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUM7UUFDL0IsSUFBSSxNQUFNLEdBQUcsWUFBWSxDQUFDLGlDQUFpQyxDQUFHLFlBQVksQ0FBQyx3Q0FBd0MsQ0FBRSxhQUFhLENBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUV6SSxLQUFLLENBQUMsa0JBQWtCLENBQUUsY0FBYyxFQUFFLENBQUMsQ0FBRSxDQUFDO1FBQzlDLGNBQWMsQ0FBRSxTQUFTLENBQUUsQ0FBQztRQUU1QixLQUFLLENBQUMsa0JBQWtCLENBQUUsQ0FBQyxDQUFFLENBQUM7UUFDOUIsS0FBSyxDQUFDLGNBQWMsQ0FBRSxTQUFTLENBQUMsWUFBWSxDQUFFLENBQUM7UUFDL0MsS0FBSyxDQUFDLG1CQUFtQixDQUFFLE1BQU0sQ0FBRSxDQUFDO1FBQ3BDLEtBQUssQ0FBQyxtQkFBbUIsQ0FBRSxvQkFBb0IsQ0FBRSxDQUFDO1FBRWxELElBQUksS0FBSyxHQUFHLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQztRQUUxQyxLQUFLLENBQUMsa0JBQWtCLENBQUUsQ0FBQyxDQUFFLENBQUM7UUFDOUIsS0FBSyxDQUFDLGNBQWMsQ0FBRSxLQUFLLENBQUUsQ0FBQztRQUM5QixLQUFLLENBQUMsbUJBQW1CLENBQUUsZ0JBQWdCLENBQUUsQ0FBQztRQUU5QyxLQUFLLENBQUMsa0JBQWtCLENBQUUsQ0FBQyxDQUFFLENBQUM7UUFDOUIsS0FBSyxDQUFDLGNBQWMsQ0FBRSxLQUFLLENBQUUsQ0FBQztRQUM5QixLQUFLLENBQUMsbUJBQW1CLENBQUUsZ0JBQWdCLENBQUUsQ0FBQztRQUU5QyxLQUFLLENBQUMsa0JBQWtCLENBQUUsQ0FBQyxDQUFFLENBQUM7UUFDOUIsS0FBSyxDQUFDLGNBQWMsQ0FBRSxLQUFLLENBQUUsQ0FBQztRQUM5QixLQUFLLENBQUMsbUJBQW1CLENBQUUsZ0JBQWdCLENBQUUsQ0FBQztRQUU5QyxTQUFTLENBQUMsYUFBYSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdkMsY0FBYyxDQUFFLFNBQVMsQ0FBRSxDQUFDO1FBRTVCLFNBQVMsQ0FBQyxlQUFlLEdBQUcsQ0FBQyxDQUFDO1FBQzlCLGNBQWMsQ0FBRSxTQUFTLENBQUUsQ0FBQztRQUU1QixLQUFLLENBQUMsZUFBZSxDQUFFLHVCQUF1QixFQUFFLE9BQU8sQ0FBRSxDQUFDO1FBRTFELENBQUMsQ0FBQyxRQUFRLENBQUUsR0FBRyxFQUFFLEdBQUUsRUFBRTtZQUNqQixLQUFLLENBQUMsa0JBQWtCLENBQUUsUUFBUSxFQUFFLENBQUMsQ0FBRSxDQUFDO1FBQzVDLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVELFNBQVMsMEJBQTBCLENBQUUsU0FBNkI7UUFFOUQsSUFBSSxLQUFLLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQztRQUMvQixJQUFJLE1BQU0sR0FBRyxZQUFZLENBQUMsaUNBQWlDLENBQUcsWUFBWSxDQUFDLHdDQUF3QyxDQUFFLGFBQWEsQ0FBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRXpJLEtBQUssQ0FBQyxrQkFBa0IsQ0FBRSxjQUFjLEVBQUUsQ0FBQyxDQUFFLENBQUM7UUFDOUMsY0FBYyxDQUFFLFNBQVMsQ0FBRSxDQUFDO1FBRTVCLEtBQUssQ0FBQyxrQkFBa0IsQ0FBRSxDQUFDLENBQUUsQ0FBQztRQUM5QixLQUFLLENBQUMsY0FBYyxDQUFFLFNBQVMsQ0FBQyxZQUFZLENBQUUsQ0FBQztRQUMvQyxLQUFLLENBQUMsbUJBQW1CLENBQUUsTUFBTSxDQUFFLENBQUM7UUFDcEMsS0FBSyxDQUFDLG1CQUFtQixDQUFFLG9CQUFvQixDQUFFLENBQUM7UUFFbEQsSUFBSSxLQUFLLEdBQUcsU0FBUyxDQUFDLG1CQUFtQixDQUFDO1FBQzFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBRSxDQUFDLENBQUUsQ0FBQztRQUM5QixLQUFLLENBQUMsY0FBYyxDQUFFLEtBQUssQ0FBRSxDQUFDO1FBQzlCLEtBQUssQ0FBQyxtQkFBbUIsQ0FBRSxnQkFBZ0IsQ0FBRSxDQUFDO1FBRTlDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBRSxDQUFDLENBQUUsQ0FBQztRQUM5QixLQUFLLENBQUMsY0FBYyxDQUFFLEtBQUssQ0FBRSxDQUFDO1FBQzlCLEtBQUssQ0FBQyxtQkFBbUIsQ0FBRSxnQkFBZ0IsQ0FBRSxDQUFDO1FBRTlDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBRSxDQUFDLENBQUUsQ0FBQztRQUM5QixLQUFLLENBQUMsY0FBYyxDQUFFLEtBQUssQ0FBRSxDQUFDO1FBQzlCLEtBQUssQ0FBQyxtQkFBbUIsQ0FBRSxnQkFBZ0IsQ0FBRSxDQUFDO1FBRTlDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBRSxDQUFDLENBQUUsQ0FBQztRQUM5QixLQUFLLENBQUMsY0FBYyxDQUFFLEtBQUssQ0FBRSxDQUFDO1FBQzlCLEtBQUssQ0FBQyxtQkFBbUIsQ0FBRSxnQkFBZ0IsQ0FBRSxDQUFDO1FBRTlDLFNBQVMsQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDMUMsY0FBYyxDQUFFLFNBQVMsQ0FBRSxDQUFDO1FBRTVCLFNBQVMsQ0FBQyxlQUFlLEdBQUcsQ0FBQyxDQUFDO1FBQzlCLGNBQWMsQ0FBRSxTQUFTLENBQUUsQ0FBQztRQUM1QixLQUFLLENBQUMsZUFBZSxDQUFFLHVCQUF1QixFQUFFLE9BQU8sQ0FBRSxDQUFDO1FBRTFELENBQUMsQ0FBQyxRQUFRLENBQUUsR0FBRyxFQUFFLEdBQUUsRUFBRTtZQUNqQixLQUFLLENBQUMsa0JBQWtCLENBQUUsZUFBZSxFQUFFLENBQUMsQ0FBRSxDQUFDO1FBQ25ELENBQUMsQ0FBQyxDQUFBO0lBQ04sQ0FBQztJQUVELFNBQVMsMEJBQTBCLENBQUUsU0FBOEI7UUFFL0QsSUFBSSxLQUFLLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQztRQUUvQixLQUFLLENBQUMsa0JBQWtCLENBQUUsa0JBQWtCLEVBQUUsQ0FBQyxDQUFFLENBQUM7UUFDbEQsY0FBYyxDQUFFLFNBQVMsQ0FBRSxDQUFDO1FBRTVCLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFLEdBQUUsRUFBRTtZQUNmLEtBQUssQ0FBQyxrQkFBa0IsQ0FBRSxjQUFjLEVBQUUsQ0FBQyxDQUFFLENBQUM7UUFDbEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxLQUFLLENBQUMsa0JBQWtCLENBQUUsQ0FBQyxDQUFFLENBQUM7UUFDOUIsS0FBSyxDQUFDLGNBQWMsQ0FBRSxTQUFTLENBQUMsWUFBWSxDQUFFLENBQUM7UUFDL0MsS0FBSyxDQUFDLG1CQUFtQixDQUFFLGdDQUFnQyxHQUFHLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFFLEdBQUcsQ0FBQyxDQUFFLENBQUUsQ0FBQztRQUV2RyxTQUFTLENBQUMsYUFBYSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDOUIsY0FBYyxDQUFFLFNBQVMsQ0FBRSxDQUFDO1FBRTVCLFNBQVMsQ0FBQyxlQUFlLEdBQUcsQ0FBQyxDQUFDO1FBQzlCLGNBQWMsQ0FBRSxTQUFTLENBQUUsQ0FBQztRQUM1QixzRUFBc0U7SUFDMUUsQ0FBQztJQUVELFNBQVUsMEJBQTBCLENBQUUsU0FBNEI7UUFFOUQsSUFBSSxLQUFLLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQztRQUMvQixJQUFJLE1BQU0sR0FBRyxZQUFZLENBQUMsaUNBQWlDLENBQUcsWUFBWSxDQUFDLHdDQUF3QyxDQUFFLFdBQVcsQ0FBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3ZJLEtBQUssQ0FBQyxrQkFBa0IsQ0FBRSxjQUFjLEVBQUUsQ0FBQyxDQUFFLENBQUM7UUFFOUMsY0FBYyxDQUFFLFNBQVMsQ0FBRSxDQUFDO1FBRTVCLEtBQUssQ0FBQyxrQkFBa0IsQ0FBRSxFQUFFLENBQUUsQ0FBQztRQUMvQixLQUFLLENBQUMsY0FBYyxDQUFFLFNBQVMsQ0FBQyxZQUFZLENBQUUsQ0FBQztRQUMvQyxLQUFLLENBQUMsbUJBQW1CLENBQUUsTUFBTSxDQUFFLENBQUM7UUFDcEMsS0FBSyxDQUFDLG1CQUFtQixDQUFFLG1CQUFtQixDQUFFLENBQUM7UUFDakQsS0FBSyxDQUFDLGVBQWUsQ0FBRSxZQUFZLEVBQUUsT0FBTyxDQUFFLENBQUM7UUFFL0MsS0FBSyxDQUFDLGtCQUFrQixDQUFFLEVBQUUsQ0FBRSxDQUFDO1FBQy9CLEtBQUssQ0FBQyxjQUFjLENBQUUsU0FBUyxDQUFDLFlBQVksQ0FBRSxDQUFDO1FBQy9DLEtBQUssQ0FBQyxtQkFBbUIsQ0FBRSxNQUFNLENBQUUsQ0FBQztRQUNwQyxLQUFLLENBQUMsbUJBQW1CLENBQUUsbUJBQW1CLENBQUUsQ0FBQztRQUVqRCxLQUFLLENBQUMsZUFBZSxDQUFFLDBCQUEwQixFQUFFLGlCQUFpQixFQUFFLFVBQVUsR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFFLENBQUM7UUFFdkcsU0FBUyxDQUFDLGFBQWEsR0FBRyxDQUFFLEVBQUUsQ0FBRSxDQUFDO1FBQ2pDLGNBQWMsQ0FBRSxTQUFTLENBQUUsQ0FBQztRQUU1QixTQUFTLENBQUMsZUFBZSxHQUFHLENBQUMsQ0FBQztRQUM5QixjQUFjLENBQUUsU0FBUyxDQUFFLENBQUM7UUFFNUIsS0FBSyxDQUFDLGVBQWUsQ0FBRSxhQUFhLEVBQUUsT0FBTyxDQUFFLENBQUM7UUFFaEQsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxHQUFHLEVBQUUsR0FBRSxFQUFFO1lBQ2pCLEtBQUssQ0FBQyxlQUFlLENBQUUsWUFBWSxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUUsQ0FBQztRQUMxRCxDQUFDLENBQUMsQ0FBQTtRQUVGLENBQUMsQ0FBQyxRQUFRLENBQUUsR0FBRyxFQUFFLEdBQUUsRUFBRTtZQUNqQixLQUFLLENBQUMsZUFBZSxDQUFFLGdCQUFnQixFQUFFLE9BQU8sQ0FBRSxDQUFDO1FBQ3ZELENBQUMsQ0FBQyxDQUFBO0lBQ04sQ0FBQztJQUVELFNBQVMsMkJBQTJCLENBQUUsU0FBNEI7UUFFOUQsSUFBSSxLQUFLLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQztRQUMvQixJQUFJLE1BQU0sR0FBRyxZQUFZLENBQUMsaUNBQWlDLENBQUcsWUFBWSxDQUFDLHdDQUF3QyxDQUFFLFdBQVcsQ0FBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3ZJLEtBQUssQ0FBQyxrQkFBa0IsQ0FBRSxlQUFlLEVBQUUsQ0FBQyxDQUFFLENBQUM7UUFFL0MsY0FBYyxDQUFFLFNBQVMsQ0FBRSxDQUFDO1FBRTVCLEtBQUssQ0FBQyxrQkFBa0IsQ0FBRSxDQUFDLENBQUUsQ0FBQztRQUM5QixLQUFLLENBQUMsY0FBYyxDQUFFLFNBQVMsQ0FBQyxZQUFZLENBQUUsQ0FBQztRQUMvQyxLQUFLLENBQUMsbUJBQW1CLENBQUUsTUFBTSxDQUFFLENBQUM7UUFDcEMsS0FBSyxDQUFDLG1CQUFtQixDQUFFLHlCQUF5QixHQUFHLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUUsQ0FBQyxDQUFDO1FBRTFGLEtBQUssQ0FBQyxlQUFlLENBQUUsMEJBQTBCLEVBQUUsaUJBQWlCLEVBQUUsVUFBVSxHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUUsQ0FBQztRQUV2RyxTQUFTLENBQUMsYUFBYSxHQUFHLENBQUUsQ0FBQyxDQUFFLENBQUM7UUFDaEMsY0FBYyxDQUFFLFNBQVMsQ0FBRSxDQUFDO1FBRTVCLFNBQVMsQ0FBQyxlQUFlLEdBQUcsQ0FBQyxDQUFDO1FBQzlCLGNBQWMsQ0FBRSxTQUFTLENBQUUsQ0FBQztJQUNoQyxDQUFDO0lBRUQsU0FBUywyQkFBMkIsQ0FBRSxTQUE0QjtRQUU5RCxJQUFJLEtBQUssR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDO1FBQy9CLElBQUksS0FBSyxHQUFHLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQztRQUMxQyxLQUFLLENBQUMsa0JBQWtCLENBQUUsY0FBYyxFQUFFLENBQUMsQ0FBRSxDQUFDO1FBRTlDLGNBQWMsQ0FBRSxTQUFTLENBQUUsQ0FBQztRQUU1QixLQUFLLENBQUMsa0JBQWtCLENBQUUsQ0FBQyxDQUFFLENBQUM7UUFDOUIsS0FBSyxDQUFDLGNBQWMsQ0FBRSxLQUFLLENBQUUsQ0FBQztRQUM5QixLQUFLLENBQUMsbUJBQW1CLENBQUUsYUFBYSxDQUFFLENBQUM7UUFFM0MsdUJBQXVCO1FBQ3ZCLEtBQUssQ0FBQyxrQkFBa0IsQ0FBRSxDQUFDLENBQUUsQ0FBQztRQUM5QixLQUFLLENBQUMsY0FBYyxDQUFFLFNBQVMsQ0FBQyxZQUFZLENBQUUsQ0FBQztRQUMvQyxLQUFLLENBQUMsbUJBQW1CLENBQUUsZ0NBQWdDLEdBQUcsQ0FBRSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUUsR0FBRyxDQUFDLENBQUUsQ0FBRSxDQUFDO1FBRXZHLFNBQVMsQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDakMsY0FBYyxDQUFFLFNBQVMsQ0FBRSxDQUFDO1FBRTVCLFNBQVMsQ0FBQyxlQUFlLEdBQUcsQ0FBQyxDQUFDO1FBQzlCLGNBQWMsQ0FBRSxTQUFTLENBQUUsQ0FBQztRQUU1QixLQUFLLENBQUMsZUFBZSxDQUFFLHdCQUF3QixFQUFFLE9BQU8sQ0FBRSxDQUFDO0lBQy9ELENBQUM7SUFFRCxTQUFTLDRCQUE0QixDQUFFLFNBQTRCO1FBRS9ELElBQUksS0FBSyxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUM7UUFFL0IsS0FBSyxDQUFDLGtCQUFrQixDQUFFLHNCQUFzQixFQUFFLENBQUMsQ0FBRSxDQUFDO1FBQ3RELGNBQWMsQ0FBRSxTQUFTLENBQUUsQ0FBQztRQUU1QixLQUFLLENBQUMsa0JBQWtCLENBQUUsRUFBRSxDQUFFLENBQUM7UUFDL0IsS0FBSyxDQUFDLGNBQWMsQ0FBRSxTQUFTLENBQUMsWUFBWSxDQUFFLENBQUM7UUFDL0MsS0FBSyxDQUFDLG1CQUFtQixDQUFFLHdCQUF3QixDQUFDLENBQUM7UUFFckQsS0FBSyxDQUFDLGtCQUFrQixDQUFFLENBQUMsQ0FBRSxDQUFDO1FBQzlCLEtBQUssQ0FBQyxjQUFjLENBQUUsU0FBUyxDQUFDLG1CQUFtQixDQUFFLENBQUM7UUFDdEQsS0FBSyxDQUFDLG1CQUFtQixDQUFFLHFCQUFxQixDQUFFLENBQUM7UUFFbkQsS0FBSyxDQUFDLGtCQUFrQixDQUFFLENBQUMsQ0FBRSxDQUFDO1FBQzlCLEtBQUssQ0FBQyxjQUFjLENBQUUsU0FBUyxDQUFDLG1CQUFtQixDQUFFLENBQUM7UUFDdEQsS0FBSyxDQUFDLG1CQUFtQixDQUFFLHFCQUFxQixDQUFFLENBQUM7UUFFbkQsS0FBSyxDQUFDLGtCQUFrQixDQUFFLEVBQUUsQ0FBRSxDQUFDO1FBQy9CLEtBQUssQ0FBQyxjQUFjLENBQUUsU0FBUyxDQUFDLG1CQUFtQixDQUFFLENBQUM7UUFDdEQsS0FBSyxDQUFDLG1CQUFtQixDQUFFLHFCQUFxQixDQUFFLENBQUM7UUFFbkQsU0FBUyxDQUFDLGFBQWEsR0FBRyxDQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFFLENBQUM7UUFDdkMsY0FBYyxDQUFFLFNBQVMsQ0FBRSxDQUFDO1FBRTVCLFNBQVMsQ0FBQyxlQUFlLEdBQUcsQ0FBQyxDQUFDO1FBQzlCLGNBQWMsQ0FBRSxTQUFTLENBQUUsQ0FBQztRQUU1QiwwQkFBMEI7UUFDMUIsMkRBQTJEO1FBQzNELDREQUE0RDtRQUM1RCxLQUFLO1FBRUwsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsR0FBRSxFQUFFO1lBQ2QsS0FBSyxDQUFDLGtCQUFrQixDQUFFLGdCQUFnQixFQUFFLENBQUMsQ0FBRSxDQUFDO1lBQ2hELEtBQUssQ0FBQyxlQUFlLENBQUUsWUFBWSxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUUsQ0FBQztRQUMxRCxDQUFDLENBQUMsQ0FBQTtRQUVGLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLEdBQUUsRUFBRTtZQUNkLEtBQUssQ0FBQyxlQUFlLENBQUUsWUFBWSxFQUFFLE9BQU8sRUFBRSxHQUFHLENBQUUsQ0FBQztRQUN4RCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRCxTQUFTLDJCQUEyQixDQUFFLFNBQThCO1FBRWhFLElBQUksS0FBSyxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUM7UUFDL0IsS0FBSyxDQUFDLGtCQUFrQixDQUFFLGNBQWMsRUFBRSxDQUFDLENBQUUsQ0FBQztRQUM5QyxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxHQUFFLEVBQUU7WUFDZixLQUFLLENBQUMsa0JBQWtCLENBQUUsb0JBQW9CLEVBQUUsQ0FBQyxDQUFFLENBQUM7UUFDeEQsQ0FBQyxDQUFDLENBQUM7UUFHSCxTQUFTLENBQUMsYUFBYSxHQUFHLEVBQUUsQ0FBQztRQUM3QixjQUFjLENBQUUsU0FBUyxDQUFFLENBQUM7UUFFNUIsU0FBUyxDQUFDLGVBQWUsR0FBRyxDQUFDLENBQUM7UUFDOUIsY0FBYyxDQUFFLFNBQVMsQ0FBRSxDQUFDO1FBRTVCLHNFQUFzRTtJQUMxRSxDQUFDO0lBRUQsU0FBUyxjQUFjLENBQUUsU0FBNkI7UUFFbEQsSUFBSSxZQUFZLEdBQVUsWUFBWSxDQUFDO1FBQ3ZDLElBQUksV0FBVyxHQUFVLFlBQVksQ0FBQztRQUV0QyxTQUFTLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBRSx3QkFBd0IsRUFBRSxNQUFNLENBQUUsQ0FBQztRQUN2RSxTQUFTLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBRSx1QkFBdUIsRUFBRSxNQUFNLENBQUUsQ0FBQztRQUN0RSxTQUFTLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBRSxpQkFBaUIsRUFBRSxNQUFNLENBQUUsQ0FBQztRQUNoRSxTQUFTLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBRSxnQkFBZ0IsRUFBRSxNQUFNLENBQUUsQ0FBQztRQUMvRCxTQUFTLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBRSxhQUFhLEVBQUUsTUFBTSxDQUFFLENBQUM7UUFDNUQsU0FBUyxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUUsbUJBQW1CLEVBQUUsTUFBTSxDQUFFLENBQUM7UUFFbEUsU0FBUyxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUUsZ0JBQWdCLEVBQUUsVUFBVSxFQUFFLFNBQVMsQ0FBQyxPQUFPLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxDQUFDO1FBQzVILFNBQVMsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFFLGlCQUFpQixFQUFFLFVBQVUsRUFBRSxTQUFTLENBQUMsT0FBTyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUUsQ0FBQztRQUM3SCxzQkFBc0IsQ0FBRSxTQUFTLENBQUUsQ0FBQztJQUN4QyxDQUFDO0lBRUQsU0FBUyxzQkFBc0IsQ0FBRSxTQUE2QjtRQUUxRCxTQUFTLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBQyxFQUFFLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBRSxDQUFDLENBQUEsQ0FBQyxDQUFFLENBQUM7UUFDekcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUUsU0FBUyxDQUFDLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxlQUFnQixDQUFDLEVBQUUsT0FBTyxDQUFFLENBQUM7UUFDeEcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUUsU0FBUyxDQUFDLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxlQUFnQixDQUFDLEVBQUUsaUJBQWlCLEVBQUUsVUFBVSxHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUUsQ0FBQztJQUN0SixDQUFDO0lBRUQsU0FBUyxjQUFjLENBQUUsU0FBNkI7UUFFbEQsSUFBSSxRQUFRLEdBQUcsRUFBRSxDQUFDO1FBQ2xCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQ2xDO1lBQ0ksU0FBUyxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUUsVUFBVSxHQUFDLENBQUMsRUFBRSxPQUFPLEVBQUUsR0FBRyxDQUFFLENBQUM7WUFDakUsU0FBUyxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBRSxDQUFDLENBQUUsQ0FBQztZQUMzQyxTQUFTLENBQUMsUUFBUSxDQUFDLG1CQUFtQixDQUFFLGdCQUFnQixDQUFFLENBQUM7U0FDOUQ7SUFDTCxDQUFDO0lBRUQsU0FBUyxjQUFjLENBQUUsU0FBNkI7UUFFbEQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxhQUFjLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUN4RDtZQUNJLFNBQVMsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFFLFVBQVUsR0FBQyxTQUFTLENBQUMsYUFBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUUsQ0FBQztTQUNoRztJQUNMLENBQUM7SUFFRCxTQUFTLGFBQWEsQ0FBRSxTQUE0QixFQUFFLElBQVc7UUFHN0QsSUFBSSxXQUFXLEdBQUcsWUFBWSxDQUFDLGNBQWMsQ0FBRSxJQUFJLENBQUUsQ0FBQztRQUN0RCxTQUFTLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLFdBQVcsQ0FBRSxDQUFDO0lBQ3pFLENBQUM7QUFDTCxDQUFDLEVBL2ZTLGdCQUFnQixLQUFoQixnQkFBZ0IsUUErZnpCIn0=