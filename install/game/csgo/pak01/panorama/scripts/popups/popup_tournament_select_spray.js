"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../common/iteminfo.ts" />
/// <reference path="../generated/items_event_current_generated_store.d.ts" />
/// <reference path="../generated/items_event_current_generated_store.ts" />
var PopupTournamentTeamsList;
(function (PopupTournamentTeamsList) {
    function Init() {
        let journalId = $.GetContextPanel().GetAttributeString("journalid", '');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfdG91cm5hbWVudF9zZWxlY3Rfc3ByYXkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfdG91cm5hbWVudF9zZWxlY3Rfc3ByYXkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyw4Q0FBOEM7QUFDOUMsOEVBQThFO0FBQzlFLDRFQUE0RTtBQUU1RSxJQUFVLHdCQUF3QixDQXVDakM7QUF2Q0QsV0FBVSx3QkFBd0I7SUFFOUIsU0FBZ0IsSUFBSTtRQUVoQixJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsa0JBQWtCLENBQUUsV0FBVyxFQUFFLEVBQUUsQ0FBRSxDQUFDO1FBRzFFLElBQUksU0FBUyxHQUFjLEVBQUUsQ0FBQztRQUU5Qix1QkFBdUIsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLEVBQUUsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFFLENBQUM7UUFDMUYsU0FBUyxDQUFDLElBQUksQ0FBRSxzQkFBc0IsQ0FBQyxrQkFBa0IsQ0FBRSxDQUFDO1FBRTVELElBQUksWUFBWSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxTQUFTLENBQUUsOEJBQThCLENBQWEsQ0FBQztRQUM5RixZQUFZLENBQUMsS0FBSyxDQUFDLGVBQWUsR0FBRywwREFBMEQsR0FBRSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsa0JBQWtCLENBQUUsU0FBUyxFQUFHLEVBQUUsQ0FBQyxHQUFFLFNBQVMsQ0FBQztRQUNwSyxZQUFZLENBQUMsS0FBSyxDQUFDLGNBQWMsR0FBRyxPQUFPLENBQUM7UUFDNUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsR0FBRyxXQUFXLENBQUM7UUFDcEQsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLFdBQVcsQ0FBRSxRQUFRLEdBQUUsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGtCQUFrQixDQUFFLFNBQVMsRUFBRyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUUsQ0FBQztRQUUzRyxTQUFTLENBQUMsT0FBTyxDQUFFLFNBQVMsQ0FBQyxFQUFFO1lBRTNCLElBQUksTUFBTSxHQUFHLFFBQVEsQ0FBQyx3QkFBd0IsQ0FBRSxTQUFTLENBQUUsQ0FBQztZQUM1RCxJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFFLFdBQVcsRUFDbkMsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLDJCQUEyQixDQUFFLEVBQ3hFLFdBQVcsR0FBRyxTQUFTLEVBQ3ZCO2dCQUNJLE1BQU0sRUFBRSxNQUFNO2dCQUNkLEtBQUssRUFBRSxvQ0FBb0M7YUFDOUMsQ0FFSixDQUFDO1lBRUYsTUFBTSxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsR0FBRSxFQUFFO2dCQUNwQyxZQUFZLENBQUMsMEJBQTBCLENBQUUsU0FBUyxFQUFFLG1CQUFtQixFQUFFLFNBQVMsQ0FBRSxDQUFDO2dCQUNyRixVQUFVLENBQUMsZUFBZSxDQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsUUFBUSxDQUFFLENBQUM7Z0JBQzVELENBQUMsQ0FBQyxhQUFhLENBQUUsc0JBQXNCLEVBQUUsRUFBRSxDQUFFLENBQUM7WUFDbEQsQ0FBQyxDQUFFLENBQUM7UUFDUixDQUFDLENBQUUsQ0FBQztJQUVSLENBQUM7SUFwQ2UsNkJBQUksT0FvQ25CLENBQUE7SUFBQSxDQUFDO0FBQ04sQ0FBQyxFQXZDUyx3QkFBd0IsS0FBeEIsd0JBQXdCLFFBdUNqQyJ9