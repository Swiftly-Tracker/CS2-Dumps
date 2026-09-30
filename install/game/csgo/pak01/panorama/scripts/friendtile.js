"use strict";
/// <reference path="csgo.d.ts" />
var FriendTile;
(function (FriendTile) {
    let _m_xuid = '';
    let _m_isClan = false;
    let _m_hasClanInfo = false;
    let _m_clanHandle = null;
    function Init(elTile) {
        _m_xuid = elTile.GetAttributeString('xuid', '(not found)');
        _m_isClan = elTile.GetAttributeString('isClan', 'false') === 'true';
        if (_m_isClan) {
            _m_hasClanInfo = FriendsListAPI.GetClanInfoById32Bit(FriendsListAPI.ConvertXuidToId32Bit(_m_xuid), 'name') != '';
            if (!_m_clanHandle)
                _m_clanHandle = $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_ClansInfoUpdated', _ClansInfoUpdated);
        }
        _SetImage(elTile);
        _SetHonorIcon(elTile);
        _SetName(elTile);
        _SetStatus(elTile);
        _SetStatusBar(elTile);
        _SetInvitedFromCallback(elTile);
        _SetCanJoin(elTile);
        _SetCanWatch(elTile);
        _SetOnActivateEvent(elTile);
    }
    FriendTile.Init = Init;
    function _SetHonorIcon(elTile) {
        const elHonorIcon = elTile.FindChildTraverse('jsHonorIcon');
        if (elHonorIcon)
            elHonorIcon.Set(FriendsListAPI.GetFriendXpTrailLevel(_m_xuid), false);
    }
    function _SetImage(elTile) {
        let elAvatarImg = elTile.FindChildTraverse('JsFriendAvatar');
        elAvatarImg.PopulateFromSteamID(_m_xuid);
        elAvatarImg.visible = !_m_isClan || _m_hasClanInfo;
    }
    function _SetStatusBar(elTile) {
        let elBg = elTile.FindChildTraverse('JsFriendTileStatusBg');
        let statusBucket = FriendsListAPI.GetFriendStatusBucket(_m_xuid);
        let isFriend = FriendsListAPI.GetFriendRelationship(_m_xuid);
        if (TeammatesAPI.GetCoPlayerInCSGO(_m_xuid) && isFriend !== "friend") {
            statusBucket = "PlayingCSGO";
        }
        else if (isFriend !== "friend") {
            statusBucket = "Offline";
        }
        elBg.SetHasClass('ingame', statusBucket === "PlayingCSGO");
    }
    function _SetName(elTile) {
        let elLabel = elTile.FindChildTraverse('JsFriendName');
        if (!_m_isClan) {
            let name = FriendsListAPI.GetFriendName(_m_xuid);
            if (name === "[unknown]") {
                name = '[' + $.Localize('SFUI_Friends_Unknown') + ']';
            }
            elLabel.text = name;
        }
        else {
            elLabel.text = FriendsListAPI.GetClanInfoById32Bit(FriendsListAPI.ConvertXuidToId32Bit(_m_xuid), 'name');
            elLabel.visible = !_m_isClan || _m_hasClanInfo;
        }
    }
    function _SetStatus(elTile) {
        let friendStatusText = '';
        if (_m_isClan) {
            friendStatusText = "#steamgroup";
        }
        else {
            if (elTile.Data().type === 'recent') {
                friendStatusText = TeammatesAPI.GetCoPlayerTime(_m_xuid);
            }
            if (!friendStatusText)
                friendStatusText = FriendsListAPI.GetFriendStatus(_m_xuid);
        }
        let elLabel = elTile.FindChildTraverse('JsFriendStatus');
        elLabel.text = $.Localize(friendStatusText);
    }
    function _SetInvitedFromCallback(elTile) {
        let isInvited = FriendsListAPI.IsFriendInvited(_m_xuid);
        _SetInvited(elTile, isInvited);
    }
    function SetInvitedFromContextMenu(elTile) {
        _SetInvited(elTile, true);
    }
    FriendTile.SetInvitedFromContextMenu = SetInvitedFromContextMenu;
    function _SetInvited(elTile, isInvited) {
        let elInvited = elTile.FindChildTraverse('JsFriendInvited');
        if (elInvited !== null)
            elInvited.SetHasClass('hidden', !isInvited);
    }
    function _SetCanJoin(elTile) {
        let canJoin = FriendsListAPI.IsFriendJoinable(_m_xuid);
        elTile.FindChildTraverse('JsFriendJoin').SetHasClass('hidden', !canJoin);
    }
    function _SetCanWatch(elTile) {
        let canWatch = FriendsListAPI.IsFriendWatchable(_m_xuid);
        elTile.FindChildTraverse('JsFriendWatch').SetHasClass('hidden', !canWatch);
    }
    function _SetOnActivateEvent(elTile) {
        if (_m_isClan) {
            elTile.SetPanelEvent('onactivate', () => {
                SteamOverlayAPI.OpenUrlInOverlayOrExternalBrowser("https://" + SteamOverlayAPI.GetSteamCommunityURL() + "/gid/" + _m_xuid);
            });
            return;
        }
        function OpenContextMenu(xuid) {
            $.DispatchEvent('SidebarContextMenuActive', true);
            let contextMenuPanel = UiToolkitAPI.ShowCustomLayoutContextMenuParametersDismissEvent('', '', 'file://{resources}/layout/context_menus/context_menu_playercard.xml', 'xuid=' + xuid +
                (elTile.Data().type ? ('&type=' + elTile.Data().type) : ''), () => $.DispatchEvent('SidebarContextMenuActive', false));
            contextMenuPanel.AddClass("ContextMenu_NoArrow");
        }
        elTile.FindChildTraverse('JsFriendTileBtn').SetPanelEvent('onactivate', OpenContextMenu.bind(undefined, _m_xuid));
        elTile.FindChildTraverse('JsFriendTileBtn').SetPanelEvent('oncontextmenu', OpenContextMenu.bind(undefined, _m_xuid));
    }
    function _ClansInfoUpdated() {
        let elTile = $.GetContextPanel().FindChildTraverse('JsKeyValidatedResult');
        if (elTile.codeType === 'g' && !elTile.FindChildTraverse('JsAvatarImage')) {
            Init(elTile);
        }
    }
})(FriendTile || (FriendTile = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJpZW5kdGlsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL2ZyaWVuZHRpbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUVsQyxJQUFVLFVBQVUsQ0E4TG5CO0FBOUxELFdBQVUsVUFBVTtJQUVuQixJQUFJLE9BQU8sR0FBRyxFQUFFLENBQUM7SUFDakIsSUFBSSxTQUFTLEdBQUcsS0FBSyxDQUFDO0lBQ3RCLElBQUksY0FBYyxHQUFHLEtBQUssQ0FBQztJQUMzQixJQUFJLGFBQWEsR0FBa0IsSUFBSSxDQUFDO0lBRXhDLFNBQWdCLElBQUksQ0FBRSxNQUFlO1FBRXBDLE9BQU8sR0FBRyxNQUFNLENBQUMsa0JBQWtCLENBQUUsTUFBTSxFQUFFLGFBQWEsQ0FBRSxDQUFDO1FBQzdELFNBQVMsR0FBRyxNQUFNLENBQUMsa0JBQWtCLENBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBRSxLQUFLLE1BQU0sQ0FBQztRQUV0RSxJQUFLLFNBQVMsRUFDZDtZQUNDLGNBQWMsR0FBRyxjQUFjLENBQUMsb0JBQW9CLENBQ25ELGNBQWMsQ0FBQyxvQkFBb0IsQ0FBRSxPQUFPLENBQUUsRUFDOUMsTUFBTSxDQUFFLElBQUksRUFBRSxDQUFDO1lBRWhCLElBQUssQ0FBQyxhQUFhO2dCQUNsQixhQUFhLEdBQUcsQ0FBQyxDQUFDLHlCQUF5QixDQUFFLDhDQUE4QyxFQUFFLGlCQUFpQixDQUFFLENBQUM7U0FDbEg7UUFFRCxTQUFTLENBQUUsTUFBTSxDQUFFLENBQUM7UUFDcEIsYUFBYSxDQUFFLE1BQU0sQ0FBRSxDQUFDO1FBQ3hCLFFBQVEsQ0FBRSxNQUFNLENBQUUsQ0FBQztRQUNuQixVQUFVLENBQUUsTUFBTSxDQUFFLENBQUM7UUFDckIsYUFBYSxDQUFFLE1BQU0sQ0FBRSxDQUFDO1FBQ3hCLHVCQUF1QixDQUFFLE1BQU0sQ0FBRSxDQUFDO1FBQ2xDLFdBQVcs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