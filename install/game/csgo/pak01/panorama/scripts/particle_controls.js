"use strict";
/// <reference path="csgo.d.ts" />
//--------------------------------------------------------------------------------------------------
// Particle Controls
//--------------------------------------------------------------------------------------------------
// UTILITY FUNCTIONS
var ParticleControls;
(function (ParticleControls) {
    function GetAllChildren(panel) {
        const children = panel.Children();
        return [...children, ...children.flatMap(GetAllChildren)];
    }
    function IsParticleScenePanel(panel) {
        return panel.type === "ParticleScenePanel";
    }
    ParticleControls.IsParticleScenePanel = IsParticleScenePanel;
    function GetWorldExtendsFromCamFov(fov, xpos, ypos, zpos, pheight, pwidth) {
        let height = Math.tan(fov * .5) * Math.sqrt((xpos * xpos) + (ypos * ypos) + (zpos * zpos));
        let width = (pwidth / pheight) * height;
        return { height, width };
    }
    function StartAllChildrenParticles(elContainerPanel) {
        const AllPanels = GetAllChildren(elContainerPanel);
        for (const panel of AllPanels) {
            if (IsParticleScenePanel(panel)) {
                panel.StopParticlesImmediately(true);
                panel.StartParticles();
            }
        }
    }
    ParticleControls.StartAllChildrenParticles = StartAllChildrenParticles;
    function StopAllChildrenParticlesImmediately(elContainerPanel) {
        const AllPanels = GetAllChildren(elContainerPanel);
        for (const panel of AllPanels) {
            if (IsParticleScenePanel(panel))
                panel.StopParticlesImmediately(true);
        }
    }
    ParticleControls.StopAllChildrenParticlesImmediately = StopAllChildrenParticlesImmediately;
    function StopParticlesWithEndCap(panelId) {
        if (panelId && IsParticleScenePanel(panelId))
            panelId.StopParticlesWithEndcaps();
    }
    ParticleControls.StopParticlesWithEndCap = StopParticlesWithEndCap;
    function SetPanelParticleControlPoint(panelId, cp, x, y, z) {
        const AllPanels = GetAllChildren($(panelId));
        for (const panel of AllPanels) {
            if (panel && IsParticleScenePanel(panel)) {
                panel.StopParticlesImmediately(true);
                panel.StartParticles();
                panel.SetControlPoint(cp, x, y, z);
            }
        }
    }
    ParticleControls.SetPanelParticleControlPoint = SetPanelParticleControlPoint;
    function SetPanelParticleControlPointDirect(panelId, cp, x, y, z) {
        if (panelId && IsParticleScenePanel(panelId)) {
            panelId.SetControlPoint(cp, x + 1, y, z);
            panelId.SetControlPoint(cp, x, y, z);
        }
    }
    ParticleControls.SetPanelParticleControlPointDirect = SetPanelParticleControlPointDirect;
    function ForcePanelToParticleName(panelId, particleName) {
        if (panelId && IsParticleScenePanel(panelId)) {
            panelId.SetParticleNameAndRefresh(particleName);
        }
    }
    ParticleControls.ForcePanelToParticleName = ForcePanelToParticleName;
    function RestartStatusRank(panelId, x, y, z) {
        const panel = $(panelId);
        if (panel && IsParticleScenePanel(panel)) {
            panel.StopParticlesImmediately(true);
            panel.StartParticles();
            panel.SetControlPoint(3, x, y, z);
        }
    }
    ParticleControls.RestartStatusRank = RestartStatusRank;
    function UpdateMainMenuTopBar(elPanel, curTabID) {
        // Trigger particle effect for these three tabs
        // Cp 1 - Highlight Position (x, y, z), 
        // Cp 2 ( Width, Alpha , desaturation (0-1) ), 
        // Cp 16 Color ( 0-255, 0-255, 0-255 )-->
        // Cp 17 Highlight Color ( 0-255, 0-255, 0-255 )-->
        let g_RadioButtonIdLookup = {
            JsInventory: "#MainMenuNavBarInventory",
            JsLoadout: "#MainMenuNavBarLoadout",
            JsPlay: "#MainMenuNavBarPlay",
            JsMainMenuStore: "#MainMenuNavBarStore",
            JsPlayerStats: "#MainMenuNavBarStats",
            JsMainMenuNews: "#MainMenuNavBarNews",
        };
        const Color = [85, 212, 238];
        const HColor = [0, 255, 212];
        if (g_RadioButtonIdLookup[curTabID] == null) {
            elPanel.SetControlPoint(1, 1, 1, 1);
            elPanel.SetControlPoint(1, 0, 0, 0);
            elPanel.SetControlPoint(2, 96, 0, .75);
            elPanel.SetControlPoint(16, Color[0], Color[1], Color[2]);
            elPanel.SetControlPoint(17, HColor[0], HColor[1], HColor[2]);
            return;
        }
        const elContainer = $("#MainMenuNavBarCenterContainer");
        let curTabButton = $(g_RadioButtonIdLookup[curTabID]);
        //Keep in Sync with particle systems X Dim Spacing/Count - Particle bounds must = Panel edges (fov to compensate) 
        const particleWidthInGameUnits = 32 * 35;
        if (curTabButton && elContainer) {
            const particlePanelScalar = particleWidthInGameUnits / elPanel.actuallayoutwidth;
            //elContainer.actuallayoutwidth/elPanel.actuallayoutwidth
            curTabButton.checked = true;
            const curLabel = curTabButton.FindChildrenWithClassTraverse("mainmenu-top-navbar__radio-btn__label")[0];
            let center = ((elContainer.actuallayoutwidth * .5) - (curTabButton.actualxoffset + (curTabButton.actuallayoutwidth * .5)));
            center *= (particlePanelScalar);
            const buffer = 20;
            const width = (curLabel.actuallayoutwidth * .5 + buffer) * particlePanelScalar;
            elPanel.SetControlPoint(1, center + 1, 0, 0);
            elPanel.SetControlPoint(1, center, 0, 0);
            elPanel.SetControlPoint(2, width, .1, .25);
        }
        else {
            elPanel.SetControlPoint(1, 0, 0, 0);
            elPanel.SetControlPoint(2, 96, 0, .25);
            elPanel.SetControlPoint(16, Color[0], Color[1], Color[2]);
            elPanel.SetControlPoint(17, HColor[0], HColor[1], HColor[2]);
        }
    }
    ParticleControls.UpdateMainMenuTopBar = UpdateMainMenuTopBar;
    function InitMainMenuTopBar(elPanel) {
        // Trigger particles and init cp
        // Cp 16 Color ( 0-255, 0-255, 0-255 )-->
        // Cp 17 Highlight Color ( 0-255, 0-255, 0-255 )-->
        const Color = [85, 212, 238];
        const HColor = [0, 255, 212];
        elPanel.SetControlPoint(16, Color[0], Color[1], Color[2]);
    }
    ParticleControls.InitMainMenuTopBar = InitMainMenuTopBar;
    function UpdateActionBar(elPanel, curTabID) {
        // Trigger particle effect for these three tabs
        // Cp 1 - Highlight Position (x, y, z), 
        // Cp 2 ( Width Of Button, Hieght Of Button , Alpha ),
        // Cp 5 ( Emission Scale, radius scale , Create Tension)
        // Cp 16 Color ( 0-255, 0-255, 0-255 )-->
        const myParent = elPanel.GetParent();
        const marginx = 20;
        const ButtonBg = myParent.FindChildrenWithClassTraverse('play-menu__playbtn__bg')[0];
        const buttonWidth = ButtonBg.actuallayoutwidth + 2;
        const lookat = [550, 0, 70];
        let g_RadioButtonIdLookup = {
            RmoveBtnEffects: "#PartyCancelBtn",
            StartMatchBtn: "#StartMatchBtn",
        };
        if (g_RadioButtonIdLookup[curTabID] == null)
            return;
        if (g_RadioButtonIdLookup[curTabID] == "#StartMatchBtn") {
            const buttonHeight = ButtonBg.actuallayoutheight;
            const camOffsetFromLookat = [0, 330, 0];
            let PanelWorldSize = GetWorldExtendsFromCamFov(120, camOffsetFromLookat[0], camOffsetFromLookat[1], camOffsetFromLookat[2], elPanel.actuallayoutheight, elPanel.actuallayoutwidth);
            let gametoWorldScalar = (PanelWorldSize.width * 2) / elPanel.actuallayoutwidth;
            const Color = [15, 231, 15];
            elPanel.StartParticleSystem("particles/ui/ui_mainmenu_playaction_active.vpcf");
            elPanel.StartParticles();
            const col = 17; //Math.floor( ( buttonWidth * gametoWorldScalar ) / 32 ); //X Dimension Spacing on Particle System
            const row = Math.floor((buttonHeight * gametoWorldScalar) / 32);
            elPanel.SetControlPoint(1, (buttonWidth * .5 - marginx) * gametoWorldScalar + Math.random(), 0, lookat[2]);
            elPanel.SetControlPoint(2, col, row, .25);
            elPanel.SetControlPoint(5, 1, 20, 0);
            elPanel.SetControlPoint(16, Color[0], Color[1], Color[2]);
        }
        else if (g_RadioButtonIdLookup[curTabID] == "#PartyCancelBtn") {
            const Color = [0, 0, 0];
            elPanel.SetControlPoint(16, Color[0], Color[1], Color[2]);
            elPanel.StopParticlesImmediately(true);
        }
        else {
            const Color = [60, 60, 60];
            elPanel.SetControlPoint(5, 0, 0, 0);
            elPanel.SetControlPoint(2, 17, 3, .25);
            elPanel.SetControlPoint(16, Color[0], Color[1], Color[2]);
            elPanel.StopParticlesImmediately(true);
        }
    }
    ParticleControls.UpdateActionBar = UpdateActionBar;
})(ParticleControls || (ParticleControls = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFydGljbGVfY29udHJvbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wYXJ0aWNsZV9jb250cm9scy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBRWxDLG9HQUFvRztBQUNwRyxvQkFBb0I7QUFDcEIsb0dBQW9HO0FBQ3BHLG9CQUFvQjtBQUNwQixJQUFVLGdCQUFnQixDQXFOekI7QUFyTkQsV0FBVSxnQkFBZ0I7SUFFekIsU0FBUyxjQUFjLENBQUcsS0FBYztRQUV2QyxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDbEMsT0FBTyxDQUFFLEdBQUcsUUFBUSxFQUFFLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBRSxjQUFjLENBQUUsQ0FBRSxDQUFDO0lBQy9ELENBQUM7SUFFRCxTQUFnQixvQkFBb0IsQ0FBRyxLQUFjO1FBRXBELE9BQU8sS0FBSyxDQUFDLElBQUksS0FBSyxvQkFBb0IsQ0FBQztJQUM1QyxDQUFDO0lBSGUscUNBQW9CLHVCQUduQyxDQUFBO0lBRUQsU0FBUyx5QkFBeUIsQ0FBRyxHQUFXLEVBQUUsSUFBWSxFQUFFLElBQVksRUFBRSxJQUFZLEVBQUUsT0FBZSxFQUFFLE1BQWM7UUFFMUgsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBRSxHQUFHLEdBQUcsRUFBRSxDQUFFLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBRSxDQUFFLElBQUksR0FBRyxJQUFJLENBQUUsR0FBRyxDQUFFLElBQUksR0FBRyxJQUFJLENBQUUsR0FBRyxDQUFFLElBQUksR0FBRyxJQUFJLENBQUUsQ0FBRSxDQUFDO1FBQ3JHLElBQUksS0FBSyxHQUFHLENBQUUsTUFBTSxHQUFHLE9BQU8sQ0FBRSxHQUFHLE1BQU0sQ0FBQztRQUMxQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxDQUFDO0lBQzFCLENB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