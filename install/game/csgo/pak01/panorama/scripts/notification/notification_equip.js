"use strict";
/// <reference path="../csgo.d.ts" />
var EquipNotification;
(function (EquipNotification) {
    function ShowEquipNotification(elPanel, slot, itemId) {
        if (!elPanel || !InventoryAPI.IsItemInfoValid(itemId))
            return;
        if (elPanel.BHasClass('show')) {
            elPanel.RemoveClass('show');
        }
        if (itemId === '0') {
            DisplayNotification(elPanel, itemId, '');
            return;
        }
        let team = '';
        let teamsList = ['ct', 't', 'noteam'];
        for (let i = 0; i < teamsList.length; i++) {
            itemId = (itemId === '0') ? LoadoutAPI.GetDefaultItem(teamsList[i], slot) : itemId;
            let teamsEquippedList = WhatTeamIsDefaultItemEquippedFor(itemId, teamsList);
            if (teamsEquippedList.length > 0) {
                team = (teamsEquippedList.length > 1) ? 'bothteams' : teamsEquippedList[0];
                break;
            }
        }
        DisplayNotification(elPanel, itemId, team);
    }
    EquipNotification.ShowEquipNotification = ShowEquipNotification;
    function DisplayNotification(elPanel, itemId, team) {
        let descText = '';
        if (itemId === '0') {
            descText = $.Localize('#inv_unequipp_item');
        }
        else {
            descText = MakeDescString(elPanel, itemId, team);
        }
        let elLabel = elPanel.FindChildInLayoutFile('InvNotificationLabel');
        elLabel.text = descText;
        elPanel.AddClass('show');
    }
    function WhatTeamIsDefaultItemEquippedFor(itemId, teamsList) {
        return teamsList.filter(team => InventoryAPI.IsEquipped(itemId, team));
    }
    function MakeDescString(elPanel, id, team) {
        let rarityColor = InventoryAPI.GetItemRarityColor(id);
        let sName = InventoryAPI.HasCustomName(id) ? $.HTMLEscape(InventoryAPI.GetItemNameCustomized(id)) : InventoryAPI.GetItemName(id);
        let itemName = '<font color="' + rarityColor + '">' + sName + '</font>';
        elPanel.SetDialogVariable('name', itemName);
        if (team === 'noteam') {
            return $.Localize('#inv_equipped_item_noteam', elPanel);
        }
        else {
            let hintString = '';
            if (team === 'bothteams') {
                hintString = '#inv_team_both';
            }
            else {
                hintString = '#SFUI_InvUse_Equipped_' + team;
            }
            elPanel.SetDialogVariable('team', $.Localize(hintString));
            return $.Localize('#inv_equipped_item', elPanel);
        }
    }
})(EquipNotification || (EquipNotification = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90aWZpY2F0aW9uX2VxdWlwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvbm90aWZpY2F0aW9uL25vdGlmaWNhdGlvbl9lcXVpcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBRXJDLElBQVUsaUJBQWlCLENBdUYxQjtBQXZGRCxXQUFVLGlCQUFpQjtJQUUxQixTQUFnQixxQkFBcUIsQ0FBRSxPQUF1QixFQUFFLElBQVksRUFBRSxNQUFjO1FBRTNGLElBQUssQ0FBQyxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFFLE1BQU0sQ0FBRTtZQUN2RCxPQUFPO1FBRVIsSUFBSyxPQUFPLENBQUMsU0FBUyxDQUFFLE1BQU0sQ0FBRSxFQUNoQztZQUNDLE9BQU8sQ0FBQyxXQUFXLENBQUUsTUFBTSxDQUFFLENBQUM7U0FDOUI7UUFFRCxJQUFLLE1BQU0sS0FBSyxHQUFHLEVBQ25CO1lBQ0MsbUJBQW1CLENBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUUsQ0FBQztZQUMzQyxPQUFPO1NBQ1A7UUFFRCxJQUFJLElBQUksR0FBRyxFQUFFLENBQUM7UUFDZCxJQUFJLFNBQVMsR0FBaUIsQ0FBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLFFBQVEsQ0FBRSxDQUFDO1FBRXRELEtBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUMxQztZQUNDLE1BQU0sR0FBRyxDQUFFLE1BQU0sS0FBSyxHQUFHLENBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztZQUN2RixJQUFJLGlCQUFpQixHQUFHLGdDQUFnQyxDQUFFLE1BQU0sRUFBRSxT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