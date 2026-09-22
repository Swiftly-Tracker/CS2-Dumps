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
        playerPanel.EquipPlayerWithPet(settings.petItemId);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhcmFjdGVyYW5pbXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9jb21tb24vY2hhcmFjdGVyYW5pbXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyxvQ0FBb0M7QUFvQnBDLElBQVUsY0FBYyxDQTJLdkI7QUEzS0QsV0FBVSxjQUFjO0lBSXZCLFNBQWdCLGlCQUFpQixDQUFHLElBQXFCLEVBQUUsU0FBa0IsS0FBSztRQUVqRixJQUFJLEdBQUcsTUFBTSxDQUFFLElBQUksQ0FBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBRXBDLFFBQVMsSUFBSSxFQUNiO1lBQ0MsS0FBSyxHQUFHLENBQUM7WUFDVCxLQUFLLEdBQUcsQ0FBQztZQUNULEtBQUssV0FBVyxDQUFDO1lBQ2pCLEtBQUssUUFBUTtnQkFFWixPQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUM7WUFFbkMsS0FBSyxHQUFHLENBQUM7WUFDVCxLQUFLLElBQUksQ0FBQztZQUNWLEtBQUssbUJBQW1CLENBQUM7WUFDekIsS0FBSyxTQUFTO2dCQUNiLE9BQU8sSUFBSSxDQUFDO1lBRWI7Z0JBQ0MsT0FBTyxFQUFFLENBQUM7U0FDWDtJQUNGLENBQUM7SUF0QmUsZ0NBQWlCLG9CQXNCaEMsQ0FBQTtJQUVELFNBQWdCLGdCQUFnQixDQUF3RyxnQkFBK0MsRUFBRSxrQkFBMkIsS0FBSyxFQUFFLGVBQXdCLElBQUk7UUFXdFAsSUFBSyxnQkFBZ0IsS0FBSyxJQUFJLEVBQzlCO1lBQ0MsT0FBTztTQUNQO1FBRUQsTUFBTSxRQUFRLEdBQWtELFlBQVksQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLCtCQUErQixDQUFFLGdCQUFnQixDQUFFLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDO1FBRS9KLElBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxJQUFJLFFBQVEsQ0FBQyxJQUFJLElBQUksRUFBRTtZQUN6QyxRQUFRLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUV0QixRQUFRLENBQUMsSUFBSSxHQUFHLGlCQUFpQixDQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUUsQ0FBQztRQUVuRCxJQUFLLFFBQVEsQ0FBQyxhQUFhLEVBQzNCO1lBQ0MsUUFBUSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDO1NBQ3hDO2FBRUQ7WUFFQyxRQUFRLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUUsUUFBUSxDQUFDLFVBQVUsQ0FBRSxDQUFDO1lBRWhFLElBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUNwQjtnQkFDQyxJQUFLLFFBQVEsQ0FBQyxJQUFJLElBQUksSUFBSTtvQkFDekIsUUFBUSxDQUFDLEtBQUssR0FBRyxvQ0FBb0MsQ0FBQzs7b0JBRXRELFFBQVEsQ0FBQyxLQUFLLEdBQUcsMENBQTBDLENBQUM7YUFDN0Q7U0FDRDtRQUVELE1BQU0sR0FBRyxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUM7UUFFbEMsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQztRQUNuQyxtQkFBbUIsQ0FBRSxXQUFXLENBQUUsQ0FBQztRQUNuQyx5QkFBeUIsQ0FBRSxXQUFXLENBQUUsQ0FBQztRQUV6QyxJQUFLLFFBQVEsQ0FBQyxRQUFRO1lBQ25CLFdBQW1DLENBQUMsUUFBUSxDQUFFLFFBQVEsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUUsQ0FBQztRQUU1RixJQUFLLENBQUMsZUFBZSxFQUNyQjtZQUNDLFdBQVcsQ0FBQyx3QkFBd0IsQ0FBRSxRQUFRLENBQUMsVUFBVSxDQUFFLENBQUM7WUFDNUQsV0FBVyxDQUFDLGNBQWMsQ0FBRSxRQUFRLENBQUMsS0FBSyxDQUFFLENBQUM7U0FDN0M7UUFFRCxXQUFXLENBQUMsbUJBQW1CLENBQUUsR0FBRyxDQUFFLENBQUM7UUFDdkMsV0FBVyxDQUFDLG1CQUFtQixDQUFFLFFBQVEsQ0FBQyxZQUFZLENBQUUsQ0FBQztRQUN6RCxXQUFXLENBQUMsa0JBQWtCLENBQUUsUUFBUSxDQUFDLFNBQVMsQ0FBRSxDQUFDO1FBRXJELElBQUssUUFBUSxDQUFDLEtBQUssSUFBSSxJQUFJLEVBQzNCO1lBQ0MsV0FBVyxDQUFDLFVBQVUsQ0FBRSxRQUFRLENBQUMsS0FBSyxDQUFFLENBQUM7U0FDekM7UUFFRCxJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUM7UUFFWixJQUFLLFFBQVEsQ0FBQyxZQUFZLElBQUksSUFBSSxFQUNsQztZQUNDLEdBQUcsR0FBRyxRQUFRLENBQUMsWUFBYSxDQUFDO1NBRTdCO0lBQ0YsQ0FBQztJQXhFZSwrQkFBZ0IsbUJBd0UvQixDQUFBO0lBRUQsU0FBZ0IsbUJBQW1CLENBQUcsV0FBb0I7UUFHekQsSUFBSyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxFQUM5QjtZQUNDLENBQUMsQ0FBQyxlQUFlLENBQUUsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBRSxDQUFDO1lBQy9DLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO1NBQ2pDO0lBQ0YsQ0FBQztJQVJlLGtDQUFtQixzQkFRbEMsQ0FBQTtJQUVELFNBQVMseUJBQXlCLENBQUcsV0FBb0I7UUFFeEQsSUFBSyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsY0FBYyxLQUFLLENBQUMsQ0FBQyxFQUM3QztZQUNDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxjQUFjLEdBQUcsQ0FBQyxDQUFDLENBQUM7U0FDdkM7SUFDRixDQUFDO0lBRUQsU0FBZ0IsdUJBQXVCLENBQUcsd0JBQWlDO1FBRzFFLFlBQVksQ0FBQywwQkFBMEIsQ0FBRSxpQkFBaUIsRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUUsQ0FBQztRQUM1RixNQUFNLEtBQUssR0FBRyxZQUFZLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUUvQyxJQUFJLFNBQVMsR0FBYSxFQUFFLENBQUM7UUFDN0IsS0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFDL0I7WUFDQyxNQUFNLE1BQU0sR0FBRyxZQUFZLENBQUMseUJBQXlCLENBQUUsQ0FBQyxDQUFFLENBQUM7WUFDM0QsU0FBUyxDQUFDLElBQUksQ0FBRSxNQUFNLENBQUUsQ0FBQTtTQUN4QjtRQUdELElBQUksYUFBYSxHQUFHLFVBQVUsQ0FBQyxTQUFTLENBQUUsSUFBa0IsRUFBRSxjQUFjLENBQUUsQ0FBQztRQUMvRSxTQUFTLENBQUMsT0FBTyxDQUFFLGFBQWEsQ0FBRSxDQUFDO1FBQ25DLGFBQWEsR0FBRyxVQUFVLENBQUMsU0FBUyxDQUFFLEdBQWlCLEVBQUUsY0FBYyxDQUFFLENBQUM7UUFDMUUsU0FBUyxDQUFDLE9BQU8sQ0FBRSxhQUFhLENBQUUsQ0FBQztRQUVuQyxNQUFNLFNBQVMsR0FBa0IsRUFBRSxDQUFDO1FBQ3BDLE1BQU0sYUFBYSxHQUEyQixFQUFFLENBQUM7UUFDakQsTUFBTSxhQUFhLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQztRQUV2QyxLQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsYUFBYSxFQUFFLENBQUMsRUFBRSxFQUN2QztZQUNDLE1BQU0sTUFBTSxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUU1QixNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFFLE1BQU0sQ0FBRSxDQUFDO1lBQ3RELElBQUssQ0FBQyxXQUFXO2dCQUNoQixTQUFTO1lBRVYsTUFBTSxJQUFJLEdBQUcsQ0FBRSxZQUFZLENBQUMsV0FBVyxDQUFFLE1BQU0sQ0FBRSxDQUFDLE1BQU0sQ0FBRSxRQUFRLENBQUUsS0FBSyxDQUFDLENBQUMsQ0FBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztZQUMzRixJQUFLLHdCQUF3QixFQUM3QjtnQkFDQyxJQUFLLGFBQWEsQ0FBQyxjQUFjLENBQUUsSUFBSSxHQUFHLFdBQVcsQ0FBRTtvQkFDdEQsU0FBUztnQkFDVixhQUFhLENBQUUsSUFBSSxHQUFHLFdBQVcsQ0FBRSxHQUFHLENBQUMsQ0FBQzthQUN4QztZQUVELE1BQU0sS0FBSyxHQUFHLFlBQVksQ0FBQyxXQUFXLENBQUUsTUFBTSxDQUFFLENBQUM7WUFDakQsTUFBTSxLQUFLLEdBQWdCO2dCQUMxQixLQUFLLEVBQUUsS0FBSztnQkFDWixJQUFJLEVBQUUsSUFBSTtnQkFDVixNQUFNLEVBQUUsTUFBTTthQUNkLENBQUM7WUFFRixTQUFTLENBQUMsSUFBSSxDQUFFLEtBQUssQ0FBRSxDQUFDO1NBQ3hCO1FBRUQsT0FBTyxTQUFTLENBQUM7SUFDbEIsQ0FBQztJQWxEZSxzQ0FBdUIsMEJBa0R0QyxDQUFBO0FBQ0YsQ0FBQyxFQTNLUyxjQUFjLEtBQWQsY0FBYyxRQTJLdkIifQ==