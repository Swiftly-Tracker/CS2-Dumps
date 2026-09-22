"use strict";
/// <reference path="../csgo.d.ts" />
var ContextmenuPlayerCard;
(function (ContextmenuPlayerCard) {
    function Init() {
        _LoadPlayerCard();
        _GetContextMenuEntries();
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
                return !GameStateAPI.IsLocalPlayerPlayingMatch() && _IsSelf(id) &&
                    (InventoryAPI.GetPetItemID() !== '' || _RetiredPetBookKeys().length > 0);
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
                LobbyAPI.KickPlayer(id);
                $.DispatchEvent('ContextMenuEvent', '');
            },
        },
        {
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
                return !_IsSelf(id);
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
            OnSelected: null,
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
        return id === MyPersonaAPI.GetXuid();
    }
    function _RetiredPetBookKeys() {
        const strLivePet = InventoryAPI.GetPetItemID();
        const strLivePrefix = strLivePet === '' ? '' : '_p' + strLivePet + '_x';
        return GameInterfaceAPI.GetPetBookCloudFileKeys().reverse()
            .filter(strCloudKey => strLivePrefix === '' || !strCloudKey.startsWith(strLivePrefix));
    }
    function _LivePetBookLabel(elPanel) {
        const strPetId = InventoryAPI.GetPetItemID();
        const strName = InventoryAPI.HasCustomName(strPetId) ? InventoryAPI.GetItemName(strPetId)
            : InventoryAPI.GetItemNameUncustomized(strPetId);
        if (strName === '') {
            return $.Localize('#pet_book_menu_current_unnamed');
        }
        elPanel.SetDialogVariable('pet_name', strName);
        return $.Localize('#pet_book_menu_current', elPanel);
    }
    function _ShowPetBookMenu() {
        const elPanel = $.GetContextPanel();
        const items = [];
        if (InventoryAPI.GetPetItemID() !== '') {
            items.push({ label: _LivePetBookLabel(elPanel), jsCallback: _OpenLivePetBook });
        }
        _RetiredPetBookKeys().forEach((strCloudKey, nIndex) => {
            elPanel.SetDialogVariableInt('book_number', nIndex + 1);
            items.push({
                label: $.Localize(nIndex === 0 ? '#pet_book_menu_recent' : '#pet_book_menu_numbered', elPanel),
                jsCallback: _OpenPetBook.bind(undefined, strCloudKey),
            });
        });
        if (items.length > 0) {
            UiToolkitAPI.ShowSimpleContextMenu('petbook', 'PetBookContextMenu', items);
        }
    }
    function _OpenLivePetBook() {
        UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_pet_book.xml');
        _CloseForBook();
    }
    function _OpenPetBook(strCloudKey) {
        UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_pet_book.xml', 'bookkey=' + strCloudKey);
        _CloseForBook();
    }
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
                count = count === 5 ? 0 : count;
                if (count === 0) {
                    elContextMenuBtns = $.GetContextPanel().FindChildInLayoutFile('id_playercard-button-row' + rowCount);
                    if (!elContextMenuBtns) {
                        elContextMenuBtns = $.CreatePanel('Panel', elContextMenuBtnsParent, 'id_playercard-button-row' + rowCount, { class: 'context-menu-playercard-btns__container' });
                        elContextMenuBtns.xuid = xuid;
                        rowCount++;
                    }
                }
                if ('xml' in entry) {
                    let elEntryBtn = $.CreatePanel('Panel', elContextMenuBtns, entry.name, {
                        class: 'IconButton',
                        style: 'tooltip-position: bottom;'
                    });
                    elEntryBtn.BLoadLayout(entry.xml, false, false);
                }
                else {
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
                    elEntryBtn.SetPanelEvent('onmouseover', () => UiToolkitAPI.ShowTextTooltip(elEntryBtn.id, tooltip));
                    elEntryBtn.SetPanelEvent('onmouseout', () => UiToolkitAPI.HideTextTooltip());
                }
                count++;
            }
        }
    }
})(ContextmenuPlayerCard || (ContextmenuPlayerCard = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dF9tZW51X3BsYXllcmNhcmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9jb250ZXh0X21lbnVzL2NvbnRleHRfbWVudV9wbGF5ZXJjYXJkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFFckMsSUFBVSxxQkFBcUIsQ0F1bkI5QjtBQXZuQkQsV0FBVSxxQkFBcUI7SUFFOUIsU0FBZ0IsSUFBSTtRQUVuQixlQUFlLEVBQUUsQ0FBQztRQUNsQixzQkFBc0IsRUFBRSxDQUFDO0lBRzFCLENBQUM7SUFOZSwwQkFBSSxPQU1uQixDQUFBO0lBRUQsU0FBUyxlQUFlO1FBRXZCLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxNQUFNLEVBQUUsYUFBYSxDQUFFLENBQUM7UUFFM0UsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLHlCQUF5QixDQUFFLENBQUM7UUFDdEYsSUFBSyxRQUFRO1lBQ2IsUUFBUSxDQUFDLFdBQVcsQ0FBRSxFQUFFLENBQUUsQ0FBQztRQUUzQixJQUFJLFFBQVEsR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUMsdUJBQXVCLENBQUMsRUFBRSx5QkFBeUIsQ0FBRSxDQUFDO1FBQ3RJLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBRSxNQUFNLEVBQUUsSUFBSSxDQUFFLENBQUM7UUFDNUMsUUFBUSxDQUFDLFdBQVcsQ0FBQywwQ0FBMEMsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDaEYsQ0FBQztJQVdVLGtDQUFZLEdBQWtCO1FBZXhDO1lBQ0MsSUFBSSxFQUFFLFFBQVE7WUFDZCxJQUFJLEVBQUUsUUFBUTtZQUNkLGdCQUFnQixFQUFFLENB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