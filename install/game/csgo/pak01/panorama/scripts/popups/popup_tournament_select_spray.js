"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../common/iteminfo.ts" />
/// <reference path="../generated/items_event_current_generated_store.d.ts" />
/// <reference path="../generated/items_event_current_generated_store.ts" />
var PopupTournamentTeamsList;
(function (PopupTournamentTeamsList) {
    function Init() {
        let journalId = $.GetContextPanel().GetAttributeString("journalid", '');
        // graffitiList.push( g_ActiveTournamentInfo );
        let graffitis = [];
        g_ActiveTournamentTeams.forEach(team => { graffitis.push(team.stickerid_graffiti); });
        graffitis.push(g_ActiveTournamentInfo.stickerid_graffiti);
        let elBackground = $.GetContextPanel().FindChild('id-popup-tournament-teams-bg');
        elBackground.style.backgroundImage = 'url( "file://{images}/tournaments/backgrounds/pickem_bg_' + $.GetContextPanel().GetAttributeString('eventid', '') + '.png");';
        elBackground.style.backgroundSize = 'cover';
        elBackground.style.backgroundPosition = ' 50% 50%;';
        $.GetContextPanel().SetHasClass('major-' + $.GetContextPanel().GetAttributeString('eventid', ''), true);
        graffitis.forEach(stickerid => {
            let itemid = ItemInfo.GetFauxItemIdForGraffiti(stickerid);
            let elTeam = $.CreatePanel("ItemImage", $.GetContextPanel().FindChildInLayoutFile('id-popup-tournament-teams'), 'graffiti_' + stickerid, {
                itemid: itemid,
                class: 'popup-tournament-select-spray-team'
            });
            elTeam.SetPanelEvent('onactivate', () => {
                InventoryAPI.SetItemAttributeValueAsync(journalId, "sticker slot 0 id", stickerid);
                LoadoutAPI.EquipItemInSlot('noteam', journalId, 'spray0');
                $.DispatchEvent('UIPopupButtonClicked', '');
            });
        });
    }
    PopupTournamentTeamsList.Init = Init;
    ;
})(PopupTournamentTeamsList || (PopupTournamentTeamsList = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfdG91cm5hbWVudF9zZWxlY3Rfc3ByYXkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfdG91cm5hbWVudF9zZWxlY3Rfc3ByYXkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyw4Q0FBOEM7QUFDOUMsOEVBQThFO0FBQzlFLDRFQUE0RTtBQUU1RSxJQUFVLHdCQUF3QixDQXVDakM7QUF2Q0QsV0FBVSx3QkFBd0I7SUFFOUIsU0FBZ0IsSUFBSTtRQUVoQixJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsa0JBQWtCLENBQUUsV0FBVyxFQUFFLEVBQUUsQ0FBRSxDQUFDO1FBQzFFLCtDQUErQztRQUUvQyxJQUFJLFNBQVMsR0FBYyxFQUFFLENBQUM7UUFFOUIsdUJBQXVCLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxFQUFFLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBRSxJQUFJLENBQUMsa0JBQWtCLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDO1FBQzFGLFNBQVMsQ0FBQyxJQUFJLENBQUUsc0JBQXNCLENBQUMsa0JBQWtCLENBQUUsQ0FBQztRQUU1RCxJQUFJLFlBQVksR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsU0FBUyxDQUFFLDhCQUE4QixDQUFhLENBQUM7UUFDOUYsWUFBWSxDQUFDLEtBQUssQ0FBQyxlQUFlLEdBQUcsMERBQTBELEdBQUUsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGtCQUFrQixDQUFFLFNBQVMsRUFBRyxFQUFFLENBQUMsR0FBRSxTQUFTLENBQUM7UUFDcEssWUFBWSxDQUFDLEtBQUssQ0FBQyxjQUFjLEdBQUcsT0FBTyxDQUFDO1FBQzVDLFlBQVksQ0FBQyxLQUFLLENBQUMsa0JBQWtCLEdBQUcsV0FBVyxDQUFDO1FBQ3BELENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxXQUFXLENBQUUsUUFBUSxHQUFFLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxTQUFTLEVBQUcsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFFLENBQUM7UUFFM0csU0FBUyxDQUFDLE9BQU8sQ0FBRSxTQUFTLENBQUMsRUFBRTtZQUUzQixJQUFJLE1BQU0sR0FBRyxRQUFRLENBQUMsd0JBQXdCLENBQUUsU0FBUyxDQUFFLENBQUM7WUFDNUQsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxXQUFXLEVBQ25DLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSwyQkFBMkIsQ0FBRSxFQUN4RSxXQUFXLEdBQUcsU0FBUyxFQUN2QjtnQkFDSSxNQUFNLEVBQUUsTUFBTTtnQkFDZCxLQUFLLEVBQUUsb0NBQW9DO2FBQzlDLENBRUosQ0FBQztZQUVGLE1BQU0sQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLEdBQUUsRUFBRTtnQkFDcEMsWUFBWSxDQUFDLDBCQUEwQixDQUFFLFNBQVMsRUFBRSxtQkFBbUIsRUFBRSxTQUFTLENBQUUsQ0FBQztnQkFDckYsVUFBVSxDQUFDLGVBQWUsQ0FBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLFFBQVEsQ0FBRSxDQUFDO2dCQUM1RCxDQUFDLENBQUMsYUFBYSxDQUFFLHNCQUFzQixFQUFFLEVBQUUsQ0FBRSxDQUFDO1lBQ2xELENBQUMsQ0FBRSxDQUFDO1FBQ1IsQ0FBQyxDQUFFLENBQUM7SUFFUixDQUFDO0lBcENlLDZCQUFJLE9Bb0NuQixDQUFBO0lBQUEsQ0FBQztBQUNOLENBQUMsRUF2Q1Msd0JBQXdCLEtBQXhCLHdCQUF3QixRQXVDakMifQ==