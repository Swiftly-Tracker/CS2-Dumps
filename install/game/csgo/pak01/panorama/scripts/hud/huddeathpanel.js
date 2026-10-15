"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../common/anim_background.ts" />
var HudDeathPanel;
(function (HudDeathPanel) {
    $.RegisterEventHandler('CSGOHudDeathPanelSetFlair', $.GetContextPanel(), OnSetFlairEvent);
    function OnSetFlairEvent(xuid, skillgroup) {
        let elAvatarFlair = $('#AvatarFlair');
        let elMedalText = $('#MedalText');
        let elAvatarFlairSS = $('#AvatarFlairSS');
        let elMedalTextSS = $('#MedalTextSS');
        let elPlayerAvatarSkillGroup = $('#PlayerAvatarSkillGroup');
        SetAnimBackground(xuid);
        let flairItemImage = GetFlairItemImage(xuid);
        if (flairItemImage !== '') {
            elAvatarFlair.RemoveClass('DeathPanel__AvatarFlair--Hidden');
            elAvatarFlair.SetImage('file://{images}' + flairItemImage + '_small.png');
            elAvatarFlairSS.RemoveClass('DeathPanel__AvatarFlair--Hidden');
            elAvatarFlairSS.SetImage('file://{images}' + flairItemImage + '_small.png');
            let flairItemName = InventoryAPI.GetFlairItemName(xuid);
            if (flairItemName === '') {
                elMedalText.AddClass('DeathPanel__MedalText--Hidden');
                elMedalTextSS.AddClass('DeathPanel__MedalText--Hidden');
            }
            else {
                elMedalText.RemoveClass('DeathPanel__MedalText--Hidden');
                elMedalText.text = flairItemName;
                elMedalTextSS.RemoveClass('DeathPanel__MedalText--Hidden');
                elMedalTextSS.text = flairItemName;
            }
        }
        else {
            elAvatarFlair.AddClass('DeathPanel__AvatarFlair--Hidden');
            elMedalText.AddClass('DeathPanel__MedalText--Hidden');
            elAvatarFlairSS.AddClass('DeathPanel__AvatarFlair--Hidden');
            elMedalTextSS.AddClass('DeathPanel__MedalText--Hidden');
        }
        if (skillgroup) {
            elPlayerAvatarSkillGroup.SetImage('file://{images}/icons/skillgroups/dangerzone' + skillgroup + '.svg');
            elPlayerAvatarSkillGroup.RemoveClass('DeathPanel__AvatarSkillGroup--Hidden');
        }
        else {
            elPlayerAvatarSkillGroup.AddClass('DeathPanel__AvatarSkillGroup--Hidden');
        }
    }
    function SetAnimBackground(xuid) {
        HudSpecatorBg.PickBg(xuid);
    }
    function GetFlairItemImage(xuid) {
        if (xuid === '' || xuid === '0')
            return '';
        let flairItemId = InventoryAPI.GetFlairItemId(xuid);
        if (flairItemId === "0" || !flairItemId) {
            let flairDefIdx = FriendsListAPI.GetFriendDisplayItemDefFeatured(xuid);
            flairItemId = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(flairDefIdx, 0);
            if (flairItemId === "0" || !flairItemId)
                return '';
        }
        return InventoryAPI.GetItemInventoryImage(flairItemId);
    }
})(HudDeathPanel || (HudDeathPanel = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHVkZGVhdGhwYW5lbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL2h1ZC9odWRkZWF0aHBhbmVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFDckMscURBQXFEO0FBRXJELElBQVUsYUFBYSxDQTZFdEI7QUE3RUQsV0FBVSxhQUFhO0lBRXRCLENBQUMsQ0FBQyxvQkFBb0IsQ0FBRSwyQkFBMkIsRUFBRSxDQUFDLENBQUMsZUFBZSxFQUFFLEVBQUUsZUFBZSxDQUFFLENBQUM7SUFDNUYsU0FBUyxlQUFlLENBQUUsSUFBWSxFQUFFLFVBQWtCO1FBRXpELElBQUksYUFBYSxHQUFHLENBQUMsQ0FBRSxjQUFjLENBQWMsQ0FBQztRQUNwRCxJQUFJLFdBQVcsR0FBRyxDQUFDLENBQUUsWUFBWSxDQUFjLENBQUM7UUFDaEQsSUFBSSxlQUFlLEdBQUcsQ0FBQyxDQUFFLGdCQUFnQixDQUFjLENBQUM7UUFDeEQsSUFBSSxhQUFhLEdBQUcsQ0FBQyxDQUFFLGNBQWMsQ0FBYyxDQUFDO1FBQ3BELElBQUksd0JBQXdCLEdBQUcsQ0FBQyxDQUFFLHlCQUF5QixDQUFjLENBQUM7UUFDMUUsaUJBQWlCLENBQUUsSUFBSSxDQUFFLENBQUM7UUFFMUIsSUFBSSxjQUFjLEdBQUcsaUJBQWlCLENBQUUsSUFBSSxDQUFFLENBQUM7UUFDL0MsSUFBSyxjQUFjLEtBQUssRUFBRSxFQUMxQjtZQUNDLGFBQWEsQ0FBQyxXQUFXLENBQUUsaUNBQWlDLENBQUUsQ0FBQztZQUMvRCxhQUFhLENBQUMsUUFBUSxDQUFFLGlCQUFpQixHQUFHLGNBQWMsR0FBRyxZQUFZLENBQUUsQ0FBQztZQUM1RSxlQUFlLENBQUMsV0FBVyxDQUFFLGlDQUFpQyxDQUFFLENBQUM7WUFDakUsZUFBZSxDQUFDLFFBQVEsQ0FBRSxpQkFBaUIsR0FBRyxjQUFjLEdBQUcsWUFBWSxDQUFFLENBQUM7WUFFOUUsSUFBSSxhQUFhLEdBQUcsWUFBWSxDQUFDLGdCQUFnQixDQUFFLElBQUksQ0FBRSxDQUFDO1lBQzFELElBQUssYUFBYSxLQUFLLEVBQUUsRUFDekI7Z0JBQ0MsV0FBVyxDQUFDLFFBQVEsQ0FBRSwrQkFBK0IsQ0FBRSxDQUFDO2dCQUN4RCxhQUFhLENBQUMsUUFBUSxDQUFFLCtCQUErQixDQUFFLENBQUM7YUFDMUQ7aUJBRUQ7Z0JBQ0MsV0FBVyxDQUFDLFdBQVcsQ0FBRSwrQkFBK0IsQ0FBRSxDQUFDO2dCQUMzRCxXQUFXLENBQUMsSUFBSSxHQUFHLGFBQWEsQ0FBQztnQkFDakMsYUFBYSxDQUFDLFdBQVcsQ0FBRSwrQkFBK0IsQ0FBRSxDQUFDO2dCQUM3RCxhQUFhLENBQUMsSUFBSSxHQUFHLGFBQWEsQ0FBQzthQUNuQztTQUNEO2FBRUQ7WUFDQyxhQUFhLENBQUMsUUFBUSxDQUFFLGlDQUFpQyxDQUFFLENBQUM7WUFDNUQsV0FBVyxDQUFDLFFBQVEsQ0FBRSwrQkFBK0IsQ0FBRSxDQUFDO1lBQ3hELGVBQWUsQ0FBQyxRQUFRLENBQUUsaUNBQWlDLENBQUUsQ0FBQztZQUM5RCxhQUFhLENBQUMsUUFBUSxDQUFFLCtCQUErQixDQUFFLENBQUM7U0FDMUQ7UUFFRCxJQUFLLFVBQVUsRUFDZjtZQUNDLHdCQUF3QixDQUFDLFFBQVEsQ0FBRSw4Q0FBOEMsR0FBRyxVQUFVLEdBQUcsTUFBTSxDQUFFLENBQUM7WUFDMUcsd0JBQXdCLENBQUMsV0FBVyxDQUFFLHNDQUFzQyxDQUFFLENBQUM7U0FDL0U7YUFFRDtZQUNDLHdCQUF3QixDQUFDLFFBQVEsQ0FBRSxzQ0FBc0MsQ0FBRSxDQUFDO1NBQzVFO0lBQ0YsQ0FBQztJQUVELFNBQVMsaUJBQWlCLENBQUUsSUFBWTtRQUV2QyxhQUFhLENBQUMsTUFBTSxDQUFFLElBQUksQ0FBRSxDQUFDO0lBQzlCLENBQUM7SUFJRCxTQUFTLGlCQUFpQixDQUFFLElBQVk7UUFFdkMsSUFBSyxJQUFJLEtBQUssRUFBRSxJQUFJLElBQUksS0FBSyxHQUFHO1lBQy9CLE9BQU8sRUFBRSxDQUFDO1FBR1gsSUFBSSxXQUFXLEdBQUcsWUFBWSxDQUFDLGNBQWMsQ0FBRSxJQUFJLENBQUUsQ0FBQztRQUN0RCxJQUFLLFdBQVcsS0FBSyxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQ3hDO1lBQ0MsSUFBSSxXQUFXLEdBQUcsY0FBYyxDQUFDLCtCQUErQixDQUFFLElBQUksQ0FBRSxDQUFDO1lBQ3pFLFdBQVcsR0FBRyxZQUFZLENBQUMsaUNBQWlDLENBQUUsV0FBVyxFQUFFLENBQUMsQ0FBRSxDQUFDO1lBQy9FLElBQUssV0FBVyxLQUFLLEdBQUcsSUFBSSxDQUFDLFdBQVc7Z0JBQ3ZDLE9BQU8sRUFBRSxDQUFDO1NBQ1g7UUFFRCxPQUFPLFlBQVksQ0FBQyxxQkFBcUIsQ0FBRSxXQUFXLENBQUUsQ0FBQztJQUMxRCxDQUFDO0FBQ0YsQ0FBQyxFQTdFUyxhQUFhLEtBQWIsYUFBYSxRQTZFdEIifQ==