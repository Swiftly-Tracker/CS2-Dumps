"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../popups/popup_custom_layout.ts" />
var PlayerCardContextMenuClanTags;
(function (PlayerCardContextMenuClanTags) {
    let m_myPrevClanId = MyPersonaAPI.GetMyClanId32BitEquipped();
    function Init() {
        m_myPrevClanId = MyPersonaAPI.GetMyClanId32BitEquipped();
        const elClanTagContextMenu = $('#id-scrolling-tag-container');
        elClanTagContextMenu.RemoveAndDeleteChildren();
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
        AddTextButtonItem(elClanTagContextMenu, 'id-manage-groups', $.Localize('#ClanTag_Manage_Groups'), () => {
            const url = 'https://' + SteamOverlayAPI.GetSteamCommunityURL() + '/profiles/' + MyPersonaAPI.GetXuid() + '/groups/';
            SteamOverlayAPI.OpenUrlInOverlayOrExternalBrowser(url);
            $.DispatchEvent('ContextMenuEvent', '');
        });
    }
    PlayerCardContextMenuClanTags.Init = Init;
    function AddClanTagItem(elParent, id, clanID, tagText, nameText) {
        const elItem = $.CreatePanel('Button', elParent, id);
        elItem.BLoadLayoutSnippet('snippet-clantag-item');
        const elClanTagLabel = elItem.FindChildTraverse('id-clan-tag__label');
        elClanTagLabel.text = tagText;
        elItem.SetHasClass('current-clantag', m_myPrevClanId == clanID);
        elItem.enabled = m_myPrevClanId != clanID;
        const elClanNameLabel = elItem.FindChildTraverse('id-clan-name__label');
        elClanNameLabel.text = nameText;
        elItem.SetPanelEvent('onactivate', () => EquipClanWithSpinner(clanID));
    }
    function AddTextButtonItem(elParent, id, labelText, fnActivate) {
        const elItem = $.CreatePanel('Button', elParent, id);
        elItem.BLoadLayoutSnippet('snippet-clantag-text-button');
        const elLabel = elItem.FindChildTraverse('id-clantag-text-button__label');
        elLabel.text = labelText;
        elItem.SetPanelEvent('onactivate', fnActivate);
        return elItem;
    }
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
        MyPersonaAPI.SetMyClanId32BitEquipped(clanID);
    }
    function OnMyPersonaInventoryUpdatedCallback() {
        if (!MyPersonaAPI.IsInventoryValid() || !MyPersonaAPI.IsConnectedToGC()) {
            $.DispatchEvent('UIPopupButtonClicked', '');
            return;
        }
        const myNewClanId = MyPersonaAPI.GetMyClanId32BitEquipped();
        if (myNewClanId != m_myPrevClanId) {
            $.DispatchEvent('UIPopupButtonClicked', '');
        }
    }
    {
    }
})(PlayerCardContextMenuClanTags || (PlayerCardContextMenuClanTags = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dF9tZW51X2NsYW5fdGFncy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL2NvbnRleHRfbWVudXMvY29udGV4dF9tZW51X2NsYW5fdGFncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBQ3JDLHlEQUF5RDtBQUV6RCxJQUFVLDZCQUE2QixDQW9JdEM7QUFwSUQsV0FBVSw2QkFBNkI7SUFFdEMsSUFBSSxjQUFjLEdBQUcsWUFBWSxDQUFDLHdCQUF3QixFQUFFLENBQUM7SUFFN0QsU0FBZ0IsSUFBSTtRQUVuQixjQUFjLEdBQUcsWUFBWSxDQUFDLHdCQUF3QixFQUFFLENBQUM7UUFFekQsTUFBTSxvQkFBb0IsR0FBRyxDQUFDLENBQUMsNkJBQTZCLENBQUUsQ0FBQztRQUcvRCxvQkFBb0IsQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1FBSy9DLE1BQU0sV0FBVyxHQUFHLGlCQUFpQixDQUFFLG9CQUFvQixFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFFLHdCQUF3QixDQUFFLEVBQzVHLEdBQUcsRUFBRSxDQUFDLG9CQUFvQixDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7UUFDbkMsV0FBVyxDQUFDLFdBQVcsQ0FBRSxpQkFBaUIsRUFBRSxjQUFjLElBQUksQ0FBQyxDQUFFLENBQUM7UUFDbEUsV0FBVyxDQUFDLE9BQU8sR0FBRyxjQUFjLElBQUksQ0FBQyxDQUFDO1FBRzFDLE1BQU0sU0FBUyxHQUFHLFlBQVksQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUNoRCxLQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsU0FBUyxFQUFFLENBQUMsRUFBRSxFQUNuQztZQUNDLE1BQU0sTUFBTSxHQUFHLFlBQVksQ0FBQyx1QkFBdUIsQ0FBRSxDQUFDLENBQUUsQ0FBQztZQUN6RCxNQUFNLE9BQU8sR0FBRyxjQUFjLENB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