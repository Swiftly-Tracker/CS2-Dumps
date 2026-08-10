"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="iteminfo.ts" />
var CharacterAnims;
(function (CharacterAnims) {
    function NormalizeTeamName(team, bShort = false) {
        team = String(team).toLowerCase();
        switch (team) {
            case '2':
            case 't':
            case 'terrorist':
            case 'team_t':
                return bShort ? 't' : 'terrorist';
            case '3':
            case 'ct':
            case 'counter-terrorist':
            case 'team_ct':
                return 'ct';
            default:
                return '';
        }
    }
    CharacterAnims.NormalizeTeamName = NormalizeTeamName;
    function PlayAnimsOnPanel(importedSettings, bDontStompModel = false, makeDeepCopy = true) {
        if (importedSettings === null) {
            return;
        }
        const settings = makeDeepCopy ? ItemInfo.DeepCopyVanityCharacterSettings(importedSettings) : importedSettings;
        if (!settings.team || settings.team == "")
            settings.team = 'ct';
        settings.team = NormalizeTeamName(settings.team);
        if (settings.modelOverride) {
            settings.model = settings.modelOverride;
        }
        else {
            settings.model = ItemInfo.GetModelPlayer(settings.charItemId);
            if (!settings.model) {
                if (settings.team == 'ct')
                    settings.model = "agents/models/ctm_sas/ctm_sas.vmdl";
                else
                    settings.model = "agents/models/tm_phoenix/tm_phoenix.vmdl";
            }
        }
        const wid = settings.weaponItemId;
        const playerPanel = settings.panel;
        CancelScheduledAnim(playerPanel);
        ResetLastRandomAnimHandle(playerPanel);
        if (settings.manifest)
            playerPanel.SetScene(settings.manifest, settings.model, false);
        if (!bDontStompModel) {
            playerPanel.SetPlayerCharacterItemID(settings.charItemId);
            playerPanel.SetPlayerModel(settings.model);
        }
        playerPanel.EquipPlayerWithItem(wid);
        playerPanel.EquipPlayerWithItem(settings.glovesItemId);
        if (settings.cheer != null) {
            playerPanel.ApplyCheer(settings.cheer);
        }
        let cam = 1;
        if (settings.cameraPreset != null) {
            cam = settings.cameraPreset;
        }
    }
    CharacterAnims.PlayAnimsOnPanel = PlayAnimsOnPanel;
    function CancelScheduledAnim(playerPanel) {
        if (playerPanel.Data().handle) {
            $.CancelScheduled(playerPanel.Data().handle);
            playerPanel.Data().handle = null;
        }
    }
    CharacterAnims.CancelScheduledAnim = CancelScheduledAnim;
    function ResetLastRandomAnimHandle(playerPanel) {
        if (playerPanel.Data().lastRandomAnim !== -1) {
            playerPanel.Data().lastRandomAnim = -1;
        }
    }
    function GetValidCharacterModels(bUniquePerTeamModelsOnly) {
        InventoryAPI.SetInventorySortAndFilters('inv_sort_rarity', false, 'customplayer', '', '');
        const count = InventoryAPI.GetInventoryCount();
        let aAllItems = [];
        for (let i = 0; i < count; i++) {
            const itemId = InventoryAPI.GetInventoryItemIDByIndex(i);
            aAllItems.push(itemId);
        }
        let loadoutItemId = LoadoutAPI.GetItemID('ct', 'customplayer');
        aAllItems.unshift(loadoutItemId);
        loadoutItemId = LoadoutAPI.GetItemID('t', 'customplayer');
        aAllItems.unshift(loadoutItemId);
        const itemsList = [];
        const uniqueTracker = {};
        const allItemsCount = aAllItems.length;
        for (let i = 0; i < allItemsCount; i++) {
            const itemId = aAllItems[i];
            const modelplayer = ItemInfo.GetModelPlayer(itemId);
            if (!modelplayer)
                continue;
            const team = (InventoryAPI.GetItemTeam(itemId).search('Team_T') === -1) ? 'ct' : 't';
            if (bUniquePerTeamModelsOnly) {
                if (uniqueTracker.hasOwnProperty(team + modelplayer))
                    continue;
                uniqueTracker[team + modelplayer] = 1;
            }
            const label = InventoryAPI.GetItemName(itemId);
            const entry = {
                label: label,
                team: team,
                itemId: itemId
            };
            itemsList.push(entry);
        }
        return itemsList;
    }
    CharacterAnims.GetValidCharacterModels = GetValidCharacterModels;
})(CharacterAnims || (CharacterAnims = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhcmFjdGVyYW5pbXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9jb21tb24vY2hhcmFjdGVyYW5pbXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyxvQ0FBb0M7QUFvQnBDLElBQVUsY0FBYyxDQThLdkI7QUE5S0QsV0FBVSxjQUFjO0lBSXZCLFNBQWdCLGlCQUFpQixDQUFHLElBQXFCLEVBQUUsU0FBa0IsS0FBSztRQUVqRixJQUFJLEdBQUcsTUFBTSxDQUFFLElBQUksQ0FBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBRXBDLFFBQVMsSUFBSSxFQUNiO1lBQ0MsS0FBSyxHQUFHLENBQUM7WUFDVCxLQUFLLEdBQUcsQ0FBQztZQUNULEtBQUssV0FBVyxDQUFDO1lBQ2pCLEtBQUssUUFBUTtnQkFFWixPQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUM7WUFFbkMsS0FBSyxHQUFHLENBQUM7WUFDVCxLQUFLLElBQUksQ0FBQztZQUNWLEtBQUssbUJBQW1CLENBQUM7WUFDekIsS0FBSyxTQUFTO2dCQUNiLE9BQU8sSUFBSSxDQUFDO1lBRWI7Z0JBQ0MsT0FBTyxFQUFFLENBQUM7U0FDWDtJQUNGLENBQUM7SUF0QmUsZ0NBQWlCLG9CQXNCaEMsQ0FBQTtJQUVELFNBQWdCLGdCQUFnQixDQUF3RyxnQkFBK0MsRUFBRSxrQkFBMkIsS0FBSyxFQUFFLGVBQXdCLElBQUk7UUFXdFAsSUFBSyxnQkFBZ0IsS0FBSyxJQUFJLEVBQzlCO1lBQ0MsT0FBTztTQUNQO1FBRUQsTUFBTSxRQUFRLEdBQWtELFlBQVksQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLCtCQUErQixDQUFFLGdCQUFnQixDQUFFLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDO1FBRS9KLElBQUssQ0FBQyxRQUFRLENBQUMsSUFB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