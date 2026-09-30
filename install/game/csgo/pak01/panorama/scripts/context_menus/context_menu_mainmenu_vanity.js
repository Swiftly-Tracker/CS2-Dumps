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
    // Function that creates buttons in popup context menu
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
        // Switch displayed agent to another team
        // Precache the other team so that when you switch to the other loadout it was mostly composited
        let elContextMenuBodyNoScroll = $.GetContextPanel().FindChildTraverse('ContextMenuBodyNoScroll');
        elContextMenuBodyNoScroll.RemoveAndDeleteChildren();
        //DEVONLY{
        fnAddVanityPopupMenuItem('DebugLobbyOfFive', '#mainmenu_debug_lobby_of_five', () => {
            $.DispatchEvent("DebugLobbyOfFive");
        }).AddClass('BottomSeparator');
        //}DEVONLY
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
        // Go to your agent loadout
        fnAddVanityPopupMenuItem('GoToLoadout', '#mainmenu_go_to_character_loadout', () => {
            $.DispatchEvent("MainMenuGoToCharacterLoadout", team);
            $.DispatchEvent('ContextMenuEvent', '');
        });
        //
        // Precache the other team when this menu pops up
        //
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dF9tZW51X21haW5tZW51X3Zhbml0eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL2NvbnRleHRfbWVudXMvY29udGV4dF9tZW51X21haW5tZW51X3Zhbml0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBQ3JDLDhDQUE4QztBQUM5QyxvREFBb0Q7QUFFcEQsSUFBVSx5QkFBeUIsQ0F1S2xDO0FBdktELFdBQVUseUJBQXlCO0lBRWxDLFNBQVMsa0JBQWtCLENBQUUsR0FBVTtRQUV0QyxJQUFJLEtBQUssR0FBRyxpQkFBaUIsR0FBRyxHQUFHLENBQUM7UUFDcEMsSUFBSyxDQUFDLENBQUMsUUFBUSxDQUFFLEtBQUssQ0FBRSxJQUFJLEtBQUssRUFDakM7WUFDQyxLQUFLLEdBQUcsWUFBWSxHQUFHLEdBQUcsQ0FBQztTQUMzQjtRQUNELE9BQU8sS0FBSyxDQUFDO0lBQ2QsQ0FBQztJQUVELFNBQWdCLElBQUk7UUFFbkIsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGtCQUFrQixDQUFFLE1BQU0sRUFBRSxFQUFFLENBQUUsQ0FBQztRQUNuRSxJQUFJLElBQUksR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsa0JBQWtCLENBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBRSxDQUFDO1FBRWhFLElBQUkseUJBQXlCLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGlCQUFpQixDQUFFLHlCQUF5QixDQUFFLENBQUM7UUFDbkcseUJBQXlCLENBQUMsMEJBQTBCLENBQUUsZ0JBQWdCLEVBQ3JFLGtCQUFrQixDQUFFLGdCQUFnQixDQUFDLGdCQUFnQixDQUFFLHlCQUF5QixDQUFFLENBQUUsQ0FBRSxDQUFDO1FBRXhGLENBQUMsQ0FBQyx5QkFBeUIsQ0FBRSw2QkFBNkIsRUFBRSxHQUFHLEVBQUU7WUFFaEUs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