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
        //
        // Structure for this object when passed in is returned
        // from ItemInfo.GetOrUpdateVanityCharacterSettings
        //
        // If we're just trying to update the animations and don't want to clear out the models,
        // e.g. when we're previewing a patch and doing this would throw the patch away,
        // we use bDontStompModel
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
            // Determine the model based off the character item id
            settings.model = ItemInfo.GetModelPlayer(settings.charItemId);
            // we don't use the local agent model. Revert to phoenix or sas
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
        playerPanel.EquipPlayerWithPet(settings.petItemId);
        if (settings.cheer != null) {
            playerPanel.ApplyCheer(settings.cheer);
        }
        let cam = 1;
        if (settings.cameraPreset != null) {
            cam = settings.cameraPreset;
            $.Msg("characteranims camera preset " + cam);
        }
    }
    CharacterAnims.PlayAnimsOnPanel = PlayAnimsOnPanel;
    function CancelScheduledAnim(playerPanel) {
        // if we have ever scheduled an animation on this panel then cancel the pending scheduled one
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
        // Get items from loadout, we want to put them first to make sure they are in the list
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
            if (bUniquePerTeamModelsOnly) { // reduce down to one unique model per team
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhcmFjdGVyYW5pbXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9jb21tb24vY2hhcmFjdGVyYW5pbXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyxvQ0FBb0M7QUFvQnBDLElBQVUsY0FBYyxDQTJLdkI7QUEzS0QsV0FBVSxjQUFjO0lBSXZCLFNBQWdCLGlCQUFpQixDQUFHLElBQXFCLEVBQUUsU0FBa0IsS0FBSztRQUVqRixJQUFJLEdBQUcsTUFBTSxDQUFFLElBQUksQ0FBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBRXBDLFFBQVMsSUFBSSxFQUNiO1lBQ0MsS0FBSyxHQUFHLENBQUM7WUFDVCxLQUFLLEdBQUcsQ0FBQztZQUNULEtBQUssV0FBVyxDQUFDO1lBQ2pCLEtBQUssUUFBUTtnQkFFWixPQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUM7WUFFbkMsS0FBSyxHQUFHLENBQUM7WUFDVCxLQUFLLElBQUksQ0FBQztZQUNWLEtBQUssbUJBQW1CLENBQUM7WUFDekIsS0FBSyxTQUFTO2dCQUNiLE9BQU8sSUFBSSxDQUFDO1lBRWI7Z0JBQ0MsT0FBTyxFQUFFLENBQUM7U0FDWDtJQUNGLENBQUM7SUF0QmUsZ0NBQWlCLG9CQXNCaEMsQ0FBQTtJQUVELFNBQWdCLGdCQUFnQixDQUF3RyxnQkFBK0MsRUFBRSxrQkFBMkIsS0FBSyxFQUFFLGVBQXdCLElBQUk7UUFFdFAsRUFBRTtRQUNGLHVEQUF1RDtRQUN2RCxtREFBbUQ7UUFDbkQsRUFBRTtRQUVGLHdGQUF3RjtRQUN4RixnRkFBZ0Y7UUFDaEYseUJBQXlCO1FBRXpCLElBQUssZ0JBQWdCLEtBQUssSUFBSSxFQUM5QjtZQUNDLE9BQU87U0FDUDtRQUVELE1BQU0sUUFBUSxHQUFrRCxZQUFZLENBQUMsQ0FBQyxDQUFDLFFBQVEs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