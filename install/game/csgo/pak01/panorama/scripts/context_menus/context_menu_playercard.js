"use strict";
/// <reference path="../csgo.d.ts" />
var ContextmenuPlayerCard;
(function (ContextmenuPlayerCard) {
    function Init() {
        _LoadPlayerCard();
        _GetContextMenuEntries();
        // dispatch this event so the sidebar does not close when the context menu is up.
    }
    ContextmenuPlayerCard.Init = Init;
    function _LoadPlayerCard() {
        let xuid = $.GetContextPanel().GetAttributeString("xuid", "(not found)");
        let oldPanel = $.GetContextPanel().FindChildInLayoutFile('JsContextMenuPlayercard');
        if (oldPanel)
            oldPanel.DeleteAsync(.0);
        let newPanel = $.CreatePanel('Panel', $.GetContextPanel().FindChildInLayoutFile('JsContextMenuSections'), 'JsContextMenuPlayercard');
        newPanel.SetAttributeString("xuid", xuid);
        newPanel.BLoadLayout('file://{resources}/layout/playercard.xml', false, false);
    }
    ContextmenuPlayerCard.ContextMenus = [
        /*
        {
            name: 'example', // Name must match the tail of the loc token for this entry
            AvailableForItem: ( id ) =>
            {
                // Decide if this context menu entry should show up for this item
                return true;
            },
            OnSelected: ( id ) =>
            {
                // Called when the entry is selected
            }
        },
        */
        {
            name: 'invite',
            icon: 'invite',
            AvailableForItem: (id) => {
                return !GameStateAPI.IsLocalPlayerPlayingMatch() && !(LobbyAPI.IsPartyMember(id)) && !_IsSelf(id) &&
                    ('purchased' === MyPersonaAPI.GetLicenseType());
            },
            OnSelected: (id, type) => {
                FriendsListAPI.ActionInviteFriend(id, '');
                $.DispatchEvent('ContextMenuEvent', '');
                $.DispatchEvent('FriendInvitedFromContextMenu', id);
            },
            IsDisabled: () => {
                let gss = LobbyAPI.GetSessionSettings();
                if (!gss || !gss.hasOwnProperty('game')) {
                    return false;
                }
                // You are searching so you can't invite
                return gss.game.apr > 1 ? true : false;
            },
        },
        {
            name: 'join',
            icon: 'JoinPlayer',
            AvailableForItem: (id) => {
                if (FriendsListAPI.IsFriendJoinable(id)) {
                    if (GameStateAPI.IsPlayerConnected(id))
                        return false;
                    if (LobbyAPI.IsSessionActive()) {
                        let party = LobbyAPI.GetSessionSettings().members;
                        for (let i = 0; i < party.numPlayers; i++) {
                            if (id === party['machine' + i].player0.xuid)
                                return false;
                        }
                    }
                    return ('purchased' === MyPersonaAPI.GetLicenseType());
                }
                return false;
            },
            OnSelected: (id) => {
                FriendsListAPI.ActionJoinFriendSession(id);
                $.DispatchEvent('ContextMenuEvent', '');
            },
        },
        {
            name: 'watch',
            icon: 'watch_tv',
            AvailableForItem: (id) => {
                return !GameStateAPI.IsLocalPlayerPlayingMatch() &&
                    FriendsListAPI.IsFriendWatchable(id) &&
                    !GameStateAPI.IsPlayerConnected(id);
            },
            OnSelected: (id) => {
                FriendsListAPI.ActionWatchFriendSession(id);
                $.DispatchEvent('ContextMenuEvent', '');
            },
        },
        {
            name: 'steamprofile',
            icon: 'profile',
            AvailableForItem: (id) => MyPersonaAPI.GetLauncherType() !== "perfectworld",
            OnSelected: (id) => {
                SteamOverlayAPI.ShowUserProfilePage(id);
                $.DispatchEvent('ContextMenuEvent', '');
            },
        },
        {
            name: 'changeclantag',
            icon: 'clantag',
            AvailableForItem: (id) => !GameStateAPI.IsLocalPlayerPlayingMatch() && _IsSelf(id) && MyPersonaAPI.GetLauncherType() !== "perfectworld",
            OnSelected: null,
            xml: 'file://{resources}/layout/change_clantag_playercard_button.xml',
        },
        {
            name: 'petbook',
            icon: 'pet_book',
            AvailableForItem: (id) => {
                // Your own books only, and not from inside a match: the book is a main menu thing. An egg
                // alone has no book yet.
                return !GameStateAPI.IsLocalPlayerPlayingMatch() && _IsSelf(id) &&
                    (_HatchedPetItemID() !== '' || _RetiredPetBookKeys().length > 0);
            },
            OnSelected: () => _ShowPetBookMenu(),
        },
        {
            name: 'kick_from_lobby',
            icon: 'friendignore',
            AvailableForItem: (id) => {
                if (GameStateAPI.IsLocalPlayerPlayingMatch())
                    return false;
                if (LobbyAPI.IsSessionActive() && LobbyAPI.BIsHost()) {
                    let party = LobbyAPI.GetSessionSettings().members;
                    for (let i = 0; i < party.numPlayers; i++) {
                        if (id === party['machine' + i].player0.xuid && !_IsSelf(id))
                            return true;
                    }
                }
                return false;
            },
            OnSelected: (id) => {
                LobbyAPI.KickPlayer(id); // TODO: Need a confirm dialog
                $.DispatchEvent('ContextMenuEvent', '');
            },
        },
        {
            // Temp: Useful for testing, probably not where we want this?
            name: 'leave_lobby',
            icon: 'leave',
            AvailableForItem: (id) => {
                if (!GameStateAPI.IsLocalPlayerPlayingMatch() && _IsSelf(id) && LobbyAPI.IsSessionActive()) {
                    let party = LobbyAPI.GetSessionSettings().members;
                    return party.numPlayers > 1 ? true : false;
                }
                return false;
            },
            OnSelected: (id) => {
                LobbyAPI.CloseSession();
                $.DispatchEvent('ContextMenuEvent', '');
            },
        },
        {
            name: 'message',
            icon: 'message',
            AvailableForItem: (id) => {
                return !_IsSelf(id); // return FriendsListAPI.GetFriendRelationship( id ) === "friend";
            },
            OnSelected: (id) => {
                SteamOverlayAPI.StartChatWithUser(id);
                $.DispatchEvent('ContextMenuEvent', '');
            },
        },
        {
            name: 'trade',
            icon: 'trade',
            AvailableForItem: (id) => FriendsListAPI.GetFriendRelationship(id) === "friend",
            OnSelected: (id) => {
                SteamOverlayAPI.StartTradeWithUser(id);
                $.DispatchEvent('ContextMenuEvent', '');
            },
        },
        {
            name: 'friendaccept',
            icon: 'friendaccept',
            AvailableForItem: (id) => FriendsListAPI.GetFriendStatusBucket(id) === 'AwaitingLocalAccept',
            OnSelected: (id) => {
                SteamOverlayAPI.InteractWithUser(id, 'friendrequestaccept');
                $.DispatchEvent('ContextMenuEvent', '');
            },
        },
        {
            name: 'friendignore',
            icon: 'friendignore',
            AvailableForItem: (id) => FriendsListAPI.GetFriendStatusBucket(id) === 'AwaitingLocalAccept',
            OnSelected: (id) => {
                SteamOverlayAPI.InteractWithUser(id, 'friendrequestignore');
                $.DispatchEvent('ContextMenuEvent', '');
            },
        },
        {
            name: 'cancelinvite',
            icon: 'friendignore',
            AvailableForItem: (id) => FriendsListAPI.GetFriendStatusBucket(id) === 'AwaitingRemoteAccept',
            OnSelected: (id) => {
                SteamOverlayAPI.InteractWithUser(id, 'friendremove');
                $.DispatchEvent('ContextMenuEvent', '');
            },
        },
        {
            name: 'removefriend',
            icon: 'friendremove',
            AvailableForItem: (id) => {
                if (MyPersonaAPI.GetLauncherType() === "perfectworld") {
                    if (_IsSelf(id))
                        return false;
                    let status = FriendsListAPI.GetFriendStatusBucket(id);
                    return status !== 'AwaitingRemoteAccept' && status !== 'AwaitingLocalAccept';
                }
                return false;
            },
            OnSelected: (id) => {
                SteamOverlayAPI.InteractWithUser(id, 'friendremove');
                $.DispatchEvent('ContextMenuEvent', '');
            },
        },
        {
            name: 'request',
            icon: 'addplayer',
            AvailableForItem: (id) => {
                let status = FriendsListAPI.GetFriendStatusBucket(id);
                let isRequest = status === 'AwaitingRemoteAccept' || status === 'AwaitingLocalAccept';
                return FriendsListAPI.GetFriendRelationship(id) !== "friend" && !_IsSelf(id) && !isRequest;
            },
            OnSelected: (id) => {
                SteamOverlayAPI.InteractWithUser(id, 'friendadd');
                $.DispatchEvent('ContextMenuEvent', '');
            },
        },
        {
            name: 'editprofile',
            icon: 'edit',
            AvailableForItem: (id) => _IsSelf(id),
            OnSelected: (id) => {
                let communityUrl = SteamOverlayAPI.GetSteamCommunityURL();
                SteamOverlayAPI.OpenURL(communityUrl + "/profiles/" + id + "/minimaledit");
                // format of the link we are making
                // http://steamcommunity.com/profiles/NAME/minimaledit
                $.DispatchEvent('ContextMenuEvent', '');
            },
        },
        {
            name: 'changecolor',
            icon: 'colorwheel',
            AvailableForItem: (id) => {
                return !GameStateAPI.IsLocalPlayerPlayingMatch() &&
                    LobbyAPI.IsSessionActive() &&
                    _IsSelf(id);
            },
            OnSelected: (id) => {
                LobbyAPI.ChangeTeammateColor();
                // don't close the panel for friend to cycle colors easily
            },
        },
        {
            name: 'mute',
            xml: 'file://{resources}/layout/mute_spinner.xml',
            icon: null,
            AvailableForItem: (id) => {
                const bInGameAndMutable = GameStateAPI.IsLocalPlayerPlayingMatch() && !_IsSelf(id) && GameStateAPI.IsPlayerConnected(id);
                const bInPartyAndMutable = !_IsSelf(id) && PartyListAPI.BIsVoiceChatEnabled() && PartyListAPI.BIsPlayerInParty(id);
                return bInGameAndMutable || bInPartyAndMutable;
            },
            OnSelected: null, // managed by the xml
        },
        {
            name: 'report',
            icon: 'alert',
            AvailableForItem: (id) => {
                return (GameStateAPI.IsLocalPlayerPlayingMatch() ||
                    (GameStateAPI.IsLocalPlayerWatchingOwnDemo() && MatchInfoAPI.CanReportFromCurrentlyPlayingDemo()) ||
                    GameStateAPI.GetGameModeInternalName(false) === "survival") &&
                    !_IsSelf(id) &&
                    GameStateAPI.IsPlayerConnected(id);
            },
            OnSelected: (id) => {
                UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_report_player.xml', 'xuid=' + id);
                $.DispatchEvent('ContextMenuEvent', '');
            },
        },
        {
            name: 'commend',
            icon: 'smile',
            AvailableForItem: (id) => {
                return (GameStateAPI.IsLocalPlayerPlayingMatch() || GameStateAPI.GetGameModeInternalName(false) === "survival") &&
                    !_IsSelf(id) &&
                    GameStateAPI.IsPlayerConnected(id);
            },
            OnSelected: (id) => {
                UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_commend_player.xml', 'xuid=' + id);
                $.DispatchEvent('ContextMenuEvent', '');
            },
        },
        {
            name: 'borrowmusickit',
            icon: 'music_kit',
            AvailableForItem: (id) => {
                let borrowedPlayerSlot = parseInt(GameInterfaceAPI.GetSettingString("cl_borrow_music_from_player_slot"));
                return GameStateAPI.IsLocalPlayerPlayingMatch() &&
                    !_IsSelf(id) &&
                    borrowedPlayerSlot !== GameStateAPI.GetPlayerSlot(id) &&
                    _HasMusicKit(id) &&
                    GameStateAPI.IsPlayerConnected(id);
            },
            OnSelected: (id) => {
                GameInterfaceAPI.SetSettingString("cl_borrow_music_from_player_slot", "" + GameStateAPI.GetPlayerSlot(id));
                $.DispatchEvent('ContextMenuEvent', '');
            },
        },
        {
            name: 'stopborrowmusickit',
            icon: 'no_musickit',
            AvailableForItem: (id) => {
                let borrowedPlayerSlot = parseInt(GameInterfaceAPI.GetSettingString("cl_borrow_music_from_player_slot"));
                if (borrowedPlayerSlot === -1)
                    return false;
                return GameStateAPI.IsLocalPlayerPlayingMatch() &&
                    ((_IsSelf(id) && borrowedPlayerSlot !== -1) ||
                        (borrowedPlayerSlot === GameStateAPI.GetPlayerSlot(id))) &&
                    GameStateAPI.IsPlayerConnected(id);
            },
            OnSelected: (id) => {
                $.DispatchEvent('Scoreboard_UnborrowMusicKit');
                $.DispatchEvent('ContextMenuEvent', '');
            },
        },
        {
            name: 'copycrosshair',
            icon: 'crosshair',
            AvailableForItem: (id) => {
                return GameStateAPI.IsLocalPlayerPlayingMatch() &&
                    !_IsSelf(id) &&
                    GameStateAPI.IsPlayerConnected(id);
            },
            OnSelected: (xuid) => {
                $.DispatchEvent('Scoreboard_ApplyPlayerCrosshairCode', xuid);
                $.DispatchEvent('ContextMenuEvent', '');
            },
        },
        {
            name: 'viewaddon',
            icon: 'globe',
            AvailableForItem: (id) => {
                if (FriendsListAPI.IsFriendJoinable(id) && FriendsListAPI.GetFriendAddon(id)) {
                    return true;
                }
                return false;
            },
            OnSelected: (xuid) => {
                const workshopID = FriendsListAPI.GetFriendAddon(xuid);
                if (workshopID) {
                    $.DispatchEvent('CSGOOpenSteamWorkshop', workshopID);
                }
                $.DispatchEvent('ContextMenuEvent', '');
            },
        },
        {
            name: 'kick_player',
            icon: 'ban_global',
            AvailableForItem: (id) => {
                return GameStateAPI.BIsLocalServerHost() && !_IsSelf(id);
            },
            OnSelected: (xuid) => {
                FriendsListAPI.Kick(xuid);
                $.DispatchEvent('ContextMenuEvent', '');
            },
        }
    ];
    function _HasMusicKit(id) {
        return (InventoryAPI.GetMusicIDForPlayer(id) > 1);
    }
    function _IsSelf(id) {
        //DEVONLY{
        const debug = false;
        if (debug)
            return false;
        //}DEVONLY
        return id === MyPersonaAPI.GetXuid();
    }
    //----------------------------------------------------------------------------------
    // The pet picture books. The living pet's is named after the bird, because the bird is in the
    // inventory; the ones left behind are numbered, because reading a name out of one means unpacking
    // it and that waits until a book is opened.
    //----------------------------------------------------------------------------------
    // The living pet's item id, or '' while it is still an egg: an egg has no book to show.
    function _HatchedPetItemID() {
        const strLivePet = InventoryAPI.GetPetItemID();
        const nStage = strLivePet === '' ? 0 : Number(InventoryAPI.GetItemAttributeValue(strLivePet, '{uint32}upgrade level'));
        return nStage > 0 ? strLivePet : '';
    }
    // Cloud keys for the books left behind, newest first. C++ hands them over ascending by item id and
    // sorts them as uint64, so this only turns that around - re-sorting a 20 digit id here would run
    // out of precision. The living pet's own book is dropped: it is the row above these.
    function _RetiredPetBookKeys() {
        const strLivePet = InventoryAPI.GetPetItemID();
        const strLivePrefix = strLivePet === '' ? '' : '_p' + strLivePet + '_x';
        return GameInterfaceAPI.GetPetBookCloudFileKeys().reverse()
            .filter(strCloudKey => strLivePrefix === '' || !strCloudKey.startsWith(strLivePrefix));
    }
    // The living pet's book goes by the bird's name. No unpacking: the item is in the inventory.
    function _LivePetBookLabel(elPanel) {
        /*
        const strPetId = InventoryAPI.GetPetItemID();
        const strName = InventoryAPI.HasCustomName( strPetId ) ? InventoryAPI.GetItemName( strPetId )
            : InventoryAPI.GetItemNameUncustomized( strPetId );

        // Eggs never reach the list, but a bird without a name still needs a row.
        if ( strName === '' )
        {
            return $.Localize( '#pet_book_menu_current_unnamed' );
        }

        elPanel.SetDialogVariable( 'pet_name', strName );
        */
        return $.Localize('#pet_book_menu_current_unnamed', elPanel); // ( '#pet_book_menu_current', elPanel );
    }
    // One row per book, the living pet's first. Localize bakes the number into the string it returns,
    // so the one dialog variable serves every row.
    function _ShowPetBookMenu() {
        const elPanel = $.GetContextPanel();
        const items = [];
        if (_HatchedPetItemID() !== '') {
            items.push({ label: _LivePetBookLabel(elPanel), jsCallback: _OpenLivePetBook });
        }
        function MakeRetiredPetName(pet_id, locPanel) {
            const strName = InventoryAPI.HasCustomName(pet_id) ? InventoryAPI.GetItemName(pet_id)
                : InventoryAPI.GetItemNameUncustomized(pet_id);
            if (!strName)
                return '';
            locPanel.SetDialogVariable('pet_name', strName);
            const value = Number(InventoryAPI.GetItemAttributeValue(pet_id, '{uint32}deployment date'));
            if (!value)
                return '';
            locPanel.SetDialogVariable('hatch_date', InventoryAPI.LocalizeDateCoarsely(value, 'month'));
            return $.Localize('#pet_book_menu_retired', locPanel);
        }
        // The loop will asynchronously create all the other buttons for this context menu
        _RetiredPetBookKeys().forEach((strCloudKey, nIndex) => {
            const oldPetItemID = GameInterfaceAPI.UnpackPetBookCloudFile('[header]' + strCloudKey); // unpack the header of the file
            const strPetMenuEntry = MakeRetiredPetName(oldPetItemID, elPanel);
            if (strPetMenuEntry) {
                items.push({
                    label: strPetMenuEntry,
                    jsCallback: _OpenPetBook.bind(undefined, strCloudKey),
                });
            }
        });
        if (items.length > 0) {
            UiToolkitAPI.ShowSimpleContextMenu('petbook', 'PetBookContextMenu', items);
        }
    }
    // Asked for no book by name, the popup reads the living pet - see PetBookPages.Init.
    function _OpenLivePetBook() {
        UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_pet_book.xml');
        _CloseForBook();
    }
    // The popup unpacks the key it is handed, so nothing is unpacked to build the list.
    function _OpenPetBook(strCloudKey) {
        UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_pet_book.xml', 'bookkey=' + strCloudKey);
        _CloseForBook();
    }
    // The list closes itself on the click; this takes the player card behind it with it.
    function _CloseForBook() {
        $.DispatchEvent('DismissAllContextMenus');
    }
    function _GetContextMenuEntries() {
        $.CreatePanel('Panel', $.GetContextPanel(), '', { class: 'context-menu-playercard-seperator' });
        let elContextMenuBtnsParent = $.CreatePanel('Panel', $.GetContextPanel(), '', { class: 'context-menu-playercard-btns' });
        let xuid = $.GetContextPanel().GetAttributeString("xuid", "(not found)");
        let type = $.GetContextPanel().GetAttributeString("type", "");
        let count = 0;
        let rowCount = 0;
        let elContextMenuBtns;
        for (let entry of ContextmenuPlayerCard.ContextMenus) {
            if (entry.AvailableForItem(xuid)) {
                $.Msg('context menu' + entry.name);
                count = count === 5 ? 0 : count;
                if (count === 0) {
                    elContextMenuBtns = $.GetContextPanel().FindChildInLayoutFile('id_playercard-button-row' + rowCount);
                    if (!elContextMenuBtns) {
                        elContextMenuBtns = $.CreatePanel('Panel', elContextMenuBtnsParent, 'id_playercard-button-row' + rowCount, { class: 'context-menu-playercard-btns__container' });
                        elContextMenuBtns.xuid = xuid; //store it in the parent so we can access it when we create buttons.
                        rowCount++;
                    }
                }
                if ('xml' in entry) // we have an XML for the button
                 {
                    let elEntryBtn = $.CreatePanel('Panel', elContextMenuBtns, entry.name, {
                        class: 'IconButton',
                        style: 'tooltip-position: bottom;'
                    });
                    elEntryBtn.BLoadLayout(entry.xml, false, false);
                }
                else // default case
                 {
                    let elEntryBtn = $.CreatePanel('Button', elContextMenuBtns, entry.name, {
                        class: 'IconButton',
                        style: 'tooltip-position: bottom;'
                    });
                    $.CreatePanel('Image', elEntryBtn, entry.name, { src: 'file://{images}/icons/ui/' + entry.icon + '.svg' });
                    let label = $.CreatePanel('Label', elEntryBtn, entry.name + '-label');
                    label.text = $.Localize('#tooltip_short_' + entry.name);
                    let tooltip = '#tooltip_' + entry.name;
                    if ('IsDisabled' in entry) {
                        if (entry.IsDisabled()) {
                            elEntryBtn.enabled = false;
                            tooltip = '#tooltip_disabled_' + entry.name;
                        }
                        else {
                            elEntryBtn.enabled = true;
                        }
                    }
                    let onSelected = entry.OnSelected;
                    elEntryBtn.SetPanelEvent('onactivate', () => onSelected(xuid, type));
                    // tooltip
                    elEntryBtn.SetPanelEvent('onmouseover', () => UiToolkitAPI.ShowTextTooltip(elEntryBtn.id, tooltip));
                    elEntryBtn.SetPanelEvent('onmouseout', () => UiToolkitAPI.HideTextTooltip());
                }
                count++;
            }
        }
    }
})(ContextmenuPlayerCard || (ContextmenuPlayerCard = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dF9tZW51X3BsYXllcmNhcmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9jb250ZXh0X21lbnVzL2NvbnRleHRfbWVudV9wbGF5ZXJjYXJkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFFckMsSUFBVSxxQkFBcUIsQ0F1cEI5QjtBQXZwQkQsV0FBVSxxQkFBcUI7SUFFOUIsU0FBZ0IsSUFBSTtRQUVuQixlQUFlLEVBQUUsQ0FBQztRQUNsQixzQkFBc0IsRUFBRSxDQUFDO1FBRXpCLGlGQUFpRjtJQUNsRixDQUFDO0lBTmUsMEJBQUksT0FNbkIsQ0FBQTtJQUVELFNBQVMsZUFBZTtRQUV2QixJQUFJLElBQUksR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsa0JBQWtCLENBQUUsTUFBTSxFQUFFLGFBQWEsQ0FBRSxDQUFDO1FBRTNFLElBQUksUUFBUSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSx5QkFBeUIsQ0FBRSxDQUFDO1FBQ3RGLElBQUssUUFBUTtZQUNiLFFBQVEsQ0FBQyxXQUFXLENBQUUsRUFBRSxDQUFFLENBQUM7UUFFM0IsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFDLHVCQUF1QixDQUFDLEVBQUUseUJBQXlCLENBQUUsQ0FBQztRQUN0SSxRQUFRLENBQUMsa0JBQWtCLENBQUUsTUFBTSxFQUFFLElBQUksQ0FBRSxDQUFDO1FBQzVDLFFBQVEsQ0FBQyxXQUFXLENBQUMsMENBQTBDLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2hGLENBQUM7SUFXVSxrQ0FBWSxHQUFrQjtRQUN4Qzs7Ozs7Ozs7Ozs7OztVQWFFO1FBQ0Y7WUFDQyxJQUFJLEVBQUUsUUFBUTtZQUNk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