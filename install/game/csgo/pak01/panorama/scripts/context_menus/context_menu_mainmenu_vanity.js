"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../common/iteminfo.ts" />
/// <reference path="../common/characteranims.ts" />
var MainMenuVanityContextMenu;
(function (MainMenuVanityContextMenu) {
    function ChooseMapNameToken(map) {
        let token = "#VanityMapName_" + map;
        if ($.Localize(token) == token) {
            token = "#SFUI_Map_" + map;
        }
        return token;
    }
    function Init() {
        let strType = $.GetContextPanel().GetAttributeString("type", "");
        let team = $.GetContextPanel().GetAttributeString("team", "");
        let elContextMenuBodyNoScroll = $.GetContextPanel().FindChildTraverse('ContextMenuBodyNoScroll');
        elContextMenuBodyNoScroll.SetDialogVariableLocString("mainmenu_bkgnd", ChooseMapNameToken(GameInterfaceAPI.GetSettingString("ui_mainmenu_bkgnd_movie")));
        $.RegisterForUnhandledEvent("CSGOMainInitBackgroundMovie", () => {
            elContextMenuBodyNoScroll.SetDialogVariableLocString("mainmenu_bkgnd", ChooseMapNameToken(GameInterfaceAPI.GetSettingString("ui_mainmenu_bkgnd_movie")));
        });
        if (strType === 'catagory')
            MakeCatBtns(team);
        else if (strType === 'weapons')
            MakeWeaponBtns(team);
        else
            MakeMapBtns();
    }
    MainMenuVanityContextMenu.Init = Init;
    function fnAddVanityPopupMenuItem(idString, strItemNameString, fnOnActivate) {
        let elContextMenuBodyNoScroll = $.GetContextPanel().FindChildTraverse('ContextMenuBodyNoScroll');
        let elItem = $.CreatePanel('Button', elContextMenuBodyNoScroll, idString);
        elItem.BLoadLayoutSnippet('snippet-vanity-item');
        let elLabel = elItem.FindChildTraverse('id-vanity-item__label');
        elLabel.SetLocString(strItemNameString);
        elItem.SetPanelEvent('onactivate', fnOnActivate);
        return elItem;
    }
    ;
    function MakeCatBtns(team) {
        let elContextMenuBodyNoScroll = $.GetContextPanel().FindChildTraverse('ContextMenuBodyNoScroll');
        elContextMenuBodyNoScroll.RemoveAndDeleteChildren();
        fnAddVanityPopupMenuItem('ChangeVanityMap', '#mainmenu_change_vanity_map', () => {
            const elVanityContextMenu = UiToolkitAPI.ShowCustomLayoutContextMenuParametersDismissEvent('id-vanity-contextmenu-maps', '', 'file://{resources}/layout/context_menus/context_menu_mainmenu_vanity.xml', 'type=maps', () => $.DispatchEvent('ContextMenuEvent', ''));
            elVanityContextMenu.AddClass('ContextMenu_NoArrow');
        })
            .SetFocus();
        fnAddVanityPopupMenuItem('ChangeWeapon', '#mainmenu_change_vanity_weapon', () => {
            const elVanityContextMenu = UiToolkitAPI.ShowCustomLayoutContextMenuParametersDismissEvent('id-vanity-contextmenu-weapons', '', 'file://{resources}/layout/context_menus/context_menu_mainmenu_vanity.xml', 'type=weapons' +
                '&' + 'team=' + team, () => $.DispatchEvent('ContextMenuEvent', ''));
            elVanityContextMenu.AddClass('ContextMenu_NoArrow');
        });
        let strOtherTeamToPrecache = ((team == '2') ? 'ct' : 't');
        fnAddVanityPopupMenuItem('switchTo_' + strOtherTeamToPrecache, '#mainmenu_switch_vanity_to_' + strOtherTeamToPrecache, () => {
            $.DispatchEvent("MainMenuSwitchVanity", strOtherTeamToPrecache);
            $.DispatchEvent('ContextMenuEvent', '');
        })
            .AddClass('BottomSeparator');
        fnAddVanityPopupMenuItem('GoToLoadout', '#mainmenu_go_to_character_loadout', () => {
            $.DispatchEvent("MainMenuGoToCharacterLoadout", team);
            $.DispatchEvent('ContextMenuEvent', '');
        });
        let otherTeamCharacterItemID = LoadoutAPI.GetItemID(strOtherTeamToPrecache, 'customplayer');
        let settingsForOtherTeam = ItemInfo.GetOrUpdateVanityCharacterSettings(otherTeamCharacterItemID);
        ItemInfo.PrecacheVanityCharacterSettings(settingsForOtherTeam);
    }
    ;
    function MakeWeaponBtns(team) {
        let elContextMenuBodyWeapons = $.GetContextPanel().FindChildTraverse('ContextMenuBodyWeapons');
        elContextMenuBodyWeapons.RemoveAndDeleteChildren();
        for (let [loadoutSubSlot, weaponItemId] of ItemInfo.GetLoadoutWeapons(team)) {
            let elItem = $.CreatePanel('Button', elContextMenuBodyWeapons, weaponItemId);
            elItem.BLoadLayoutSnippet('snippet-vanity-item');
            elItem.AddClass('vanity-item--weapon');
            let elLabel = elItem.FindChildTraverse('id-vanity-item__label');
            elLabel.text = InventoryAPI.GetItemName(weaponItemId);
            let elRarity = elItem.FindChildTraverse('id-vanity-item__rarity');
            let rarityColor = InventoryAPI.GetItemRarityColor(weaponItemId);
            elRarity.style.backgroundColor = "gradient( linear, 0% 0%, 100% 0%, from(" + rarityColor + " ), color-stop( 0.0125, #00000000 ), to( #00000000 ) );";
            elItem.SetPanelEvent('onactivate', () => {
                let shortTeam = CharacterAnims.NormalizeTeamName(team, true);
                GameInterfaceAPI.SetSettingString('ui_vanitysetting_loadoutslot_' + shortTeam, loadoutSubSlot);
                $.DispatchEvent('ForceRestartVanity');
                $.DispatchEvent('ContextMenuEvent', '');
            });
        }
    }
    function MakeMapBtns() {
        let cvarInfo = $.GetContextPanel().GetAttributeString("inspect-map", "") === "true"
            ? GameInterfaceAPI.GetSettingInfo("ui_inspect_bkgnd_map")
            : GameInterfaceAPI.GetSettingInfo("ui_mainmenu_bkgnd_movie");
        let aMaps = cvarInfo.allowed_values;
        let elContextMenuBodyNoScroll = $.GetContextPanel().FindChildTraverse('ContextMenuBodyNoScroll');
        elContextMenuBodyNoScroll.RemoveAndDeleteChildren();
        for (let map of aMaps) {
            fnAddVanityPopupMenuItem('context-menu-vanity-' + map, ChooseMapNameToken(map), () => {
                if ($.GetContextPanel().GetAttributeString("inspect-map", "") === "true") {
                    GameInterfaceAPI.SetSettingString('ui_inspect_bkgnd_map', map);
                }
                else {
                    GameInterfaceAPI.SetSettingString('ui_mainmenu_bkgnd_movie', map);
                }
                $.DispatchEvent('ContextMenuEvent', '');
            });
        }
    }
})(MainMenuVanityContextMenu || (MainMenuVanityContextMenu = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dF9tZW51X21haW5tZW51X3Zhbml0eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL2NvbnRleHRfbWVudXMvY29udGV4dF9tZW51X21haW5tZW51X3Zhbml0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBQ3JDLDhDQUE4QztBQUM5QyxvREFBb0Q7QUFFcEQsSUFBVSx5QkFBeUIsQ0F1S2xDO0FBdktELFdBQVUseUJBQXlCO0lBRWxDLFNBQVMsa0JBQWtCLENBQUUsR0FBVTtRQUV0QyxJQUFJLEtBQUssR0FBRyxpQkFBaUIsR0FBRyxHQUFHLENBQUM7UUFDcEMsSUFBSyxDQUFDLENBQUMsUUFBUSxDQUFFLEtBQUssQ0FBRSxJQUFJLEtBQUssRUFDakM7WUFDQyxLQUFLLEdBQUcsWUFBWSxHQUFHLEdBQUcsQ0FBQztTQUMzQjtRQUNELE9BQU8sS0FBSyxDQUFDO0lBQ2QsQ0FBQztJQUVELFNBQWdCLElBQUk7UUFFbkIsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGtCQUFrQixDQUFFLE1BQU0sRUFBRSxFQUFFLENBQUUsQ0FBQztRQUNuRSxJQUFJLElBQUksR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsa0JBQWtCLENBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBRSxDQUFDO1FBRWhFLElBQUkseUJBQXlCLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGlCQUFpQixDQUFFLHlCQUF5QixDQUFFLENBQUM7UUFDbkcseUJBQXlCLENBQUMsMEJBQTBCLENBQUUsZ0JBQWdCLEVBQ3JFLGtCQUFrQixDQUFFLGdCQUFnQixDQUFDLGdCQUFnQixDQUFFLHlCQUF5QixDQUFFLENBQUUsQ0FBRSxDQUFDO1FBRXhGLENBQUMsQ0FBQyx5QkFBeUIsQ0FBRSw2QkFBNkIsRUFBRSxHQUFHLEVBQUU7WUFFaEUseUJBQXlCLENBQUMsMEJBQTBCLENBQUUsZ0JBQWdCLEVBQ3JFLGtCQUFrQixDQUFFLGdCQUFnQixDQUFDLGdCQUFnQixDQUFFLHlCQUF5QixDQUFFLENBQUUsQ0FBRSxDQUFDO1FBQ3pGLENBQUMsQ0FBRSxDQUFDO1FBRUosSUFBSyxPQUFPLEtBQUssVUFBVTtZQUMxQixXQUFXLENBQUUsSUFBSSxDQUFFLENBQUM7YUFDaEIsSUFBSyxPQUFPLEtBQUssU0FBUztZQUM5QixjQUFjLENBQUUsSUFBSSxDQUFFLENBQUM7O1lBRXZCLFdBQVcsRUFBRSxDQUFDO0lBQ2hCLENBQUM7SUFyQmUsOEJBQUksT0FxQm5CLENBQUE7SUFHRCxTQUFTLHdCQUF3QixDQUFHLFFBQWUsRUFBRSxpQkFBd0IsRUFBRSxZQUF1QjtRQUVyRyxJQUFJLHlCQUF5QixHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBRSx5QkFBeUIsQ0FBRSxDQUFDO1FBQ25HLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUUsUUFBUSxFQUFFLHlCQUF5QixFQUFFLFFBQVEsQ0FBRSxDQUFDO1FBQzVFLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBRSxxQkFBcUIsQ0FBRSxDQUFDO1FBQ25ELElBQUksT0FBTyxHQUFHLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBRSx1QkFBdUIsQ0FBYSxDQUFDO1FBQzdFLE9BQU8sQ0FBQyxZQUFZLENBQUUsaUJBQWlCLENBQUUsQ0FBQztRQUMxQyxNQUFNLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxZQUFZLENBQUUsQ0FBQztRQUNuRCxPQUFPLE1BQU0sQ0FBQztJQUNmLENBQUM7SUFBQSxDQUFDO0lBRUYsU0FBUyxXQUFXLENBQUUsSUFBVztRQUloQyxJQUFJLHlCQUF5QixHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBRSx5QkFBeUIsQ0FBRSxDQUFDO1FBQ25HLHlCQUF5QixDQUFDLHVCQUF1QixFQUFFLENBQUM7UUFTcEQsd0JBQXdCLENBQUUsaUJBQWlCLEVBQUUsNkJBQTZCLEVBQUUsR0FBRyxFQUFFO1lBRWhGLE1BQU0sbUJBQW1CLEdBQUcsWUFBWSxDQUFDLGlEQUFpRCxDQUN6Riw0QkFBNEIsRUFDNUIsRUFBRSxFQUNGLDBFQUEwRSxFQUMxRSxXQUFXLEVBQ1gsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxrQkFBa0IsRUFBRSxFQUFFLENBQUUsQ0FBRSxDQUFDO1lBRW5ELG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1FBQ3JELENBQUMsQ0FBRTthQUNGLFFBQVEsRUFBRSxDQUFDO1FBRVosd0JBQXdCLENBQUUsY0FBYyxFQUFFLGdDQUFnQyxFQUFFLEdBQUcsRUFBRTtZQUVoRixNQUFNLG1CQUFtQixHQUFHLFlBQVksQ0FBQyxpREFBaUQsQ0FDekYsK0JBQStCLEVBQy9CLEVBQUUsRUFDRiwwRUFBMEUsRUFDMUUsY0FBYztnQkFDZCxHQUFHLEdBQUcsT0FBTyxHQUFHLElBQUksRUFDcEIsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxrQkFBa0IsRUFBRSxFQUFFLENBQUUsQ0FBRSxDQUFDO1lBRW5ELG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1FBQ3JELENBQUMsQ0FBRSxDQUFDO1FBRUosSUFBSSxzQkFBc0IsR0FBRyxDQUFFLENBQUUsSUFBSSxJQUFJLEdBQUcsQ0FBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBZ0IsQ0FBQztRQUM1RSx3QkFBd0IsQ0FBRSxXQUFXLEdBQUcsc0JBQXNCLEVBQUUsNkJBQTZCLEdBQUcsc0JBQXNCLEVBQUUsR0FBRyxFQUFFO1lBRTVILENBQUMsQ0FBQyxhQUFhLENBQUUsc0JBQXNCLEVBQUUsc0JBQXNCLENBQUUsQ0FBQztZQUNsRSxDQUFDLENBQUMsYUFBYSxDQUFFLGtCQUFrQixFQUFFLEVBQUUsQ0FBRSxDQUFDO1FBQzNDLENBQUMsQ0FBRTthQUNGLFFBQVEsQ0FBRSxpQkFBaUIsQ0FBRSxDQUFDO1FBRy9CLHdCQUF3QixDQUFFLGFBQWEsRUFBRSxtQ0FBbUMsRUFBRSxHQUFHLEVBQUU7WUFFbEYsQ0FBQyxDQUFDLGFBQWEsQ0FBRSw4QkFBOEIsRUFBRSxJQUFJLENBQUUsQ0FBQztZQUN4RCxDQUFDLENBQUMsYUFBYSxDQUFFLGtCQUFrQixFQUFFLEVBQUUsQ0FBRSxDQUFDO1FBQzNDLENBQUMsQ0FBRSxDQUFDO1FBS0osSUFBSSx3QkFBd0IsR0FBRyxVQUFVLENBQUMsU0FBUyxDQUFFLHNCQUFzQixFQUFFLGNBQWMsQ0FBRSxDQUFDO1FBQzlGLElBQUksb0JBQW9CLEdBQUcsUUFBUSxDQUFDLGtDQUFrQyxDQUFFLHdCQUF3QixDQUFFLENBQUM7UUFDbkcsUUFBUSxDQUFDLCtCQUErQixDQUFFLG9CQUFvQixDQUFFLENBQUM7SUFDbEUsQ0FBQztJQUFBLENBQUM7SUFFRixTQUFTLGNBQWMsQ0FBRyxJQUFXO1FBRXBDLElBQUksd0JBQXdCLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGlCQUFpQixDQUFFLHdCQUF3QixDQUFFLENBQUM7UUFDakcsd0JBQXdCLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUVuRCxLQUFNLElBQUksQ0FBQyxjQUFjLEVBQUUsWUFBWSxDQUFDLElBQUksUUFBUSxDQUFDLGlCQUFpQixDQUFFLElBQUksQ0FBRSxFQUM5RTtZQUNDLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUUsUUFBUSxFQUFFLHdCQUF3QixFQUFFLFlBQVksQ0FBRSxDQUFDO1lBQy9FLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBRSxxQkFBcUIsQ0FBRSxDQUFDO1lBQ25ELE1BQU0sQ0FBQyxRQUFRLENBQUUscUJBQXFCLENBQUUsQ0FBQztZQUV6QyxJQUFJLE9BQU8sR0FBRyxNQUFNLENBQUMsaUJBQWlCLENBQUUsdUJBQXVCLENBQWEsQ0FBQztZQUM3RSxPQUFPLENBQUMsSUFBSSxHQUFHLFlBQVksQ0FBQyxXQUFXLENBQUUsWUFBWSxDQUFFLENBQUM7WUFFeEQsSUFBSSxRQUFRLEdBQUcsTUFBTSxDQUFDLGlCQUFpQixDQUFFLHdCQUF3QixDQUFFLENBQUM7WUFDcEUsSUFBSSxXQUFXLEdBQUcsWUFBWSxDQUFDLGtCQUFrQixDQUFFLFlBQVksQ0FBRSxDQUFDO1lBQ2xFLFFBQVEsQ0FBQyxLQUFLLENBQUMsZUFBZSxHQUFHLHlDQUF5QyxHQUFHLFdBQVcsR0FBRyx5REFBeUQsQ0FBQztZQUVySixNQUFNLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxHQUFHLEVBQUU7Z0JBRXhDLElBQUksU0FBUyxHQUFHLGNBQWMsQ0FBQyxpQkFBaUIsQ0FBRSxJQUFJLEVBQUUsSUFBSSxDQUFFLENBQUM7Z0JBQy9ELGdCQUFnQixDQUFDLGdCQUFnQixDQUFFLCtCQUErQixHQUFHLFNBQVMsRUFBRSxjQUFjLENBQUUsQ0FBQztnQkFFakcsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxvQkFBb0IsQ0FBRSxDQUFDO2dCQUN4QyxDQUFDLENBQUMsYUFBYSxDQUFFLGtCQUFrQixFQUFFLEVBQUUsQ0FBRSxDQUFDO1lBQzNDLENBQUMsQ0FBRSxDQUFBO1NBQ0g7SUFDRixDQUFDO0lBRUQsU0FBUyxXQUFXO1FBRW5CLElBQUksUUFBUSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxhQUFhLEVBQUUsRUFBRSxDQUFFLEtBQUssTUFBTTtZQUNwRixDQUFDLENBQUMsZ0JBQWdCLENBQUMsY0FBYyxDQUFFLHNCQUFzQixDQUFFO1lBQzNELENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxjQUFjLENBQUUseUJBQXlCLENBQUUsQ0FBQztRQUVoRSxJQUFJLEtBQUssR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDO1FBRXBDLElBQUkseUJBQXlCLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGlCQUFpQixDQUFFLHlCQUF5QixDQUFFLENBQUM7UUFDbkcseUJBQXlCLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUVwRCxLQUFNLElBQUksR0FBRyxJQUFJLEtBQUssRUFDdEI7WUFDQyx3QkFBd0IsQ0FBRSxzQkFBc0IsR0FBRyxHQUFHLEVBQUUsa0JBQWtCLENBQUUsR0FBRyxDQUFFLEVBQUUsR0FBRyxFQUFFO2dCQUV2RixJQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxhQUFhLEVBQUUsRUFBRSxDQUFFLEtBQUssTUFBTSxFQUN6RTtvQkFDQyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBRSxzQkFBc0IsRUFBRSxHQUFHLENBQUUsQ0FBQztpQkFDakU7cUJBRUQ7b0JBQ0MsZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUUseUJBQXlCLEVBQUUsR0FBRyxDQUFFLENBQUM7aUJBQ3BFO2dCQUVELENBQUMsQ0FBQyxhQUFhLENBQUUsa0JBQWtCLEVBQUUsRUFBRSxDQUFFLENBQUM7WUFDM0MsQ0FBQyxDQUFFLENBQUM7U0FDSjtJQUNGLENBQUM7QUFDRixDQUFDLEVBdktTLHlCQUF5QixLQUF6Qix5QkFBeUIsUUF1S2xDIn0=