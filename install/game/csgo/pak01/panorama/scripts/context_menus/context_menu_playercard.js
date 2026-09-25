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
    function _HatchedPetItemID() {
        const strLivePet = InventoryAPI.GetPetItemID();
        const nStage = strLivePet === '' ? 0 : Number(InventoryAPI.GetItemAttributeValue(strLivePet, '{uint32}upgrade level'));
        return nStage > 0 ? strLivePet : '';
    }
    function _RetiredPetBookKeys() {
        const strLivePet = InventoryAPI.GetPetItemID();
        const strLivePrefix = strLivePet === '' ? '' : '_p' + strLivePet + '_x';
        return GameInterfaceAPI.GetPetBookCloudFileKeys().reverse()
            .filter(strCloudKey => strLivePrefix === '' || !strCloudKey.startsWith(strLivePrefix));
    }
    function _LivePetBookLabel(elPanel) {
        return $.Localize('#pet_book_menu_current_unnamed', elPanel);
    }
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
        _RetiredPetBookKeys().forEach((strCloudKey, nIndex) => {
            const oldPetItemID = GameInterfaceAPI.UnpackPetBookCloudFile('[header]' + strCloudKey);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dF9tZW51X3BsYXllcmNhcmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9jb250ZXh0X21lbnVzL2NvbnRleHRfbWVudV9wbGF5ZXJjYXJkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFFckMsSUFBVSxxQkFBcUIsQ0F1cEI5QjtBQXZwQkQsV0FBVSxxQkFBcUI7SUFFOUIsU0FBZ0IsSUFBSTtRQUVuQixlQUFlLEVBQUUsQ0FBQztRQUNsQixzQkFBc0IsRUFBRSxDQUFDO0lBRzFCLENBQUM7SUFOZSwwQkFBSSxPQU1uQixDQUFBO0lBRUQsU0FBUyxlQUFlO1FBRXZCLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxNQUFNLEVBQUUsYUFBYSxDQUFFLENBQUM7UUFFM0UsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLHlCQUF5QixDQUFFLENBQUM7UUFDdEYsSUFBSyxRQUFRO1lBQ2IsUUFBUSxDQUFDLFdBQVcsQ0FBRSxFQUFFLENBQUUsQ0FBQztRQUUzQixJQUFJLFFBQVEsR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUMsdUJBQXVCLENBQUMsRUFBRSx5QkFBeUIsQ0FBRSxDQUFDO1FBQ3RJLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBRSxNQUFNLEVBQUUsSUFBSSxDQUFFLENBQUM7UUFDNUMsUUFBUSxDQUFDLFdBQVcsQ0FBQywwQ0FBMEMsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDaEYsQ0FBQztJQVdVLGtDQUFZLEdBQWtCO1FBZXhDO1lBQ0MsSUFBSSxFQUFFLFFBQVE7WUFDZCxJQUFJLEVBQUUsUUFBUTtZQUNkLGdCQUFnQixFQUFFLENB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