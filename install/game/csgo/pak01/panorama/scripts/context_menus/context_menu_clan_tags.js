"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../popups/popup_custom_layout.ts" />
var PlayerCardContextMenuClanTags;
(function (PlayerCardContextMenuClanTags) {
    let m_myPrevClanId = MyPersonaAPI.GetMyClanId32BitEquipped();
    function Init() {
        m_myPrevClanId = MyPersonaAPI.GetMyClanId32BitEquipped();
        const elClanTagContextMenu = $('#id-scrolling-tag-container');
        // Rebuild the list from scratch every time the menu opens so it reflects the latest clan membership.
        elClanTagContextMenu.RemoveAndDeleteChildren();
        // "Clear Clan Tag" option at the top of the list. Equipping clan id 0 unequips the current tag
        // (see SetMyClanId32BitEquipped: "pass zero to unequip"), so the player displays no clan tag.
        // Collapsed when nothing is equipped, since there is nothing to clear.
        const elClearItem = AddTextButtonItem(elClanTagContextMenu, 'noclan', $.Localize('#ClanTag_Clear_ClanTag'), () => EquipClanWithSpinner(0));
        elClearItem.SetHasClass('current-clantag', m_myPrevClanId == 0);
        elClearItem.enabled = m_myPrevClanId != 0;
        const nNumClans = MyPersonaAPI.GetMyClanCount();
        for (let i = 0; i < nNumClans; i++) {
            const clanID = MyPersonaAPI.GetMyClanId32BitByIndex(i);
            const clanTag = FriendsListAPI.GetClanInfoById32Bit(clanID, 'tag');
            const clanName = FriendsListAPI.GetClanInfoById32Bit(clanID, 'name');
            AddClanTagItem(elClanTagContextMenu, 'clanid' + i, clanID, '[' + clanTag + ']', clanName);
        }
        // Trailing shortcut to the player's Steam groups page. Clan tags come from Steam group
        // membership, so this lets the player review or join groups to get more tags to choose from.
        AddTextButtonItem(elClanTagContextMenu, 'id-manage-groups', $.Localize('#ClanTag_Manage_Groups'), () => {
            // GetSteamCommunityURL() returns the bare host (e.g. "steamcommunity.com"), so prepend the
            // scheme; "/profiles/<xuid>/groups/" is the player's own group list.
            const url = 'https://' + SteamOverlayAPI.GetSteamCommunityURL() + '/profiles/' + MyPersonaAPI.GetXuid() + '/groups/';
            SteamOverlayAPI.OpenUrlInOverlayOrExternalBrowser(url);
            // close the context menu
            $.DispatchEvent('ContextMenuEvent', '');
        });
    }
    PlayerCardContextMenuClanTags.Init = Init;
    // Creates a single selectable clan row (tag + name). Selecting it equips that clan's tag.
    function AddClanTagItem(elParent, id, clanID, tagText, nameText) {
        const elItem = $.CreatePanel('Button', elParent, id);
        elItem.BLoadLayoutSnippet('snippet-clantag-item');
        const elClanTagLabel = elItem.FindChildTraverse('id-clan-tag__label');
        elClanTagLabel.text = tagText;
        // Collapse the row for the currently-equipped clan; there's nothing to switch to.
        elItem.SetHasClass('current-clantag', m_myPrevClanId == clanID);
        elItem.enabled = m_myPrevClanId != clanID;
        const elClanNameLabel = elItem.FindChildTraverse('id-clan-name__label');
        elClanNameLabel.text = nameText;
        elItem.SetPanelEvent('onactivate', () => EquipClanWithSpinner(clanID));
    }
    // Creates a centered text-button row (e.g. "Clear Clan Tag", "Manage Steam Groups") from the shared
    // snippet and wires fnActivate to it. Returns the button so callers can adjust it further.
    function AddTextButtonItem(elParent, id, labelText, fnActivate) {
        const elItem = $.CreatePanel('Button', elParent, id);
        elItem.BLoadLayoutSnippet('snippet-clantag-text-button');
        const elLabel = elItem.FindChildTraverse('id-clantag-text-button__label');
        elLabel.text = labelText;
        elItem.SetPanelEvent('onactivate', fnActivate);
        return elItem;
    }
    // Equips clanID (0 unequips) and shows a blocking spinner popup that stays up until the persona
    // inventory-updated event confirms the GC round-trip (or the popup times out).
    function EquipClanWithSpinner(clanID) {
        let elPopup = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_custom_layout.xml');
        const jsEventHandler = UiToolkitAPI.RegisterJSCallback(OnMyPersonaInventoryUpdatedCallback);
        let oSettings = {
            image: 'file://{images}/control_icons/home_icon.vtf',
            message: $.Localize('#ClanTag_Updating'),
            show_spinner: true,
            no_min_width: true,
            show_loading_bar: false,
            hide_buttons: true,
            timeout: 1,
            watch_event: 'PanoramaComponent_MyPersona_InventoryUpdated',
            watch_event_callback: jsEventHandler,
        };
        elPopup.Data().oSettings = oSettings;
        // Kick off the actual change; the popup's watch_event above waits for the GC to confirm.
        MyPersonaAPI.SetMyClanId32BitEquipped(clanID);
    }
    // Fires when the persona inventory reports an update, i.e. the GC responded to our clan change.
    function OnMyPersonaInventoryUpdatedCallback() {
        // If we lost the inventory or GC connection there's nothing to confirm; just dismiss the spinner.
        if (!MyPersonaAPI.IsInventoryValid() || !MyPersonaAPI.IsConnectedToGC()) {
            $.DispatchEvent('UIPopupButtonClicked', '');
            return;
        }
        // Dismiss the spinner if the equipped clan actually changed from what it was when the menu opened.
        const myNewClanId = MyPersonaAPI.GetMyClanId32BitEquipped();
        if (myNewClanId != m_myPrevClanId) {
            $.DispatchEvent('UIPopupButtonClicked', '');
        }
    }
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
    }
})(PlayerCardContextMenuClanTags || (PlayerCardContextMenuClanTags = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dF9tZW51X2NsYW5fdGFncy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL2NvbnRleHRfbWVudXMvY29udGV4dF9tZW51X2NsYW5fdGFncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBQ3JDLHlEQUF5RDtBQUV6RCxJQUFVLDZCQUE2QixDQW9JdEM7QUFwSUQsV0FBVSw2QkFBNkI7SUFFdEMsSUFBSSxjQUFjLEdBQUcsWUFBWSxDQUFDLHdCQUF3QixFQUFFLENBQUM7SUFFN0QsU0FBZ0IsSUFBSTtRQUVuQixjQUFjLEdBQUcsWUFBWSxDQUFDLHdCQUF3QixFQUFFLENBQUM7UUFFekQsTUFBTSxvQkFBb0IsR0FBRyxDQUFDLENBQUMsNkJBQTZCLENBQUUsQ0FBQztRQUUvRCxxR0FBcUc7UUFDckcsb0JBQW9CLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUUvQywrRkFBK0Y7UUFDL0YsOEZBQThGO1FBQzlGLHVFQUF1RTtRQUN2RSxNQUFNLFdBQVcsR0FBRyxpQkFBaUIsQ0FBRSxvQkFBb0IsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBRSx3QkFBd0IsQ0FBRSxFQUM1RyxHQUFHLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDO1FBQ25DLFdBQVcsQ0FBQyxXQUFXLENBQUUsaUJBQWlCLEVBQUUsY0FBYyxJQUFJLENBQUMsQ0FBRSxDQUFDO1FBQ2xFLFdBQVcsQ0FBQyxPQUFPLEdBQUcsY0FBYyxJQUFJLENBQUMsQ0FBQztRQUcxQyxNQUFNLFNBQVMsR0FBRyxZQUFZLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDaEQsS0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsRUFBRSxDQUFDLEVBQUUsRUFDbkM7WUFDQyxNQUFNLE1BQU0sR0FBRyxZQUFZLENBQUMsdUJB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