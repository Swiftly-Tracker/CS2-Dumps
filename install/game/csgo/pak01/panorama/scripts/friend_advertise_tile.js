"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/commonutil.ts" />
/// <reference path="rating_emblem.ts" />
var FriendAdvertiseTile;
(function (FriendAdvertiseTile) {
    let _m_xuid = '';
    function Init(elTile) {
        _m_xuid = elTile.GetAttributeString('xuid', '(not found)');
        let gameMode = PartyBrowserAPI.GetPartySessionSetting(_m_xuid, 'game/mode');
        let _m_isPerfectWorld = MyPersonaAPI.GetLauncherType() === "perfectworld" ? true : false;
        _SetNameAvatar(elTile);
        _SetPrime(elTile);
        if (!_m_isPerfectWorld)
            _SetRegion(elTile);
        _SetSkillGroup(elTile, gameMode);
        _SetInvitedFromCallback(elTile);
        _ShowInviteButton(elTile);
        _OnInviteSetPanelEvent(elTile);
    }
    FriendAdvertiseTile.Init = Init;
    function _SetNameAvatar(elTile) {
        let xuidLobbyLeader = PartyBrowserAPI.GetPartyMemberXuid(_m_xuid, 0);
        elTile.SetDialogVariable('friendname', FriendsListAPI.GetFriendName(xuidLobbyLeader));
        elTile.FindChildTraverse('JsFriendAvatar').PopulateFromSteamID(xuidLobbyLeader);
        elTile.FindChildTraverse('JsFriendAvatarBtn').SetPanelEvent('onactivate', _OpenContextMenu.bind(undefined, xuidLobbyLeader));
    }
    function _SetPrime(elTile) {
        let primeValue = PartyBrowserAPI.GetPartySessionSetting(_m_xuid, 'game/apr');
        elTile.FindChildTraverse('JsFriendAdvertisePrime').visible = (primeValue && primeValue != '0') ? true : false;
    }
    function _SetRegion(elTile) {
        let countryCode = PartyBrowserAPI.GetPartySessionSetting(_m_xuid, 'game/loc');
        CommonUtil.SetRegionOnLabel(countryCode, elTile);
    }
    function _SetSkillGroup(elTile, gameMode) {
        let szSkillGroupType = "skillgroup";
        if (gameMode === 'scrimcomp2v2') {
            szSkillGroupType = 'Wingman';
        }
        else {
            szSkillGroupType = 'Premier';
        }
        let score = Number(PartyBrowserAPI.GetPartySessionSetting(_m_xuid, 'game/ark'));
        score = Math.floor(score / 10);
        const options = {
            root_panel: elTile.FindChildTraverse('jsRatingEmblem'),
            xuid: _m_xuid,
            do_fx: true,
            full_details: false,
            rating_type: szSkillGroupType,
            leaderboard_details: { score: score },
            local_player: _m_xuid === MyPersonaAPI.GetXuid()
        };
        RatingEmblem.SetXuid(options);
    }
    function _OpenContextMenu(xuid) {
        $.DispatchEvent('SidebarContextMenuActive', true);
        let contextMenuPanel = UiToolkitAPI.ShowCustomLayoutContextMenuParametersDismissEvent('', '', 'file://{resources}/layout/context_menus/context_menu_playercard.xml', 'xuid=' + xuid +
            '&type=nearby', () => $.DispatchEvent('SidebarContextMenuActive', false));
        contextMenuPanel.AddClass("ContextMenu_NoArrow");
    }
    function _ShowInviteButton(elTile) {
        let elInvited = elTile.FindChildTraverse('JsInviteAdvertisingPlayer');
        elInvited.visible = !(_m_xuid === MyPersonaAPI.GetXuid());
    }
    function _SetInvitedFromCallback(elTile) {
        let isInvited = FriendsListAPI.IsFriendInvited(_m_xuid);
        _SetInvited(elTile, isInvited);
    }
    function _SetInvited(elTile, isInvited) {
        let elInvited = elTile.FindChildTraverse('JsFriendInvited');
        if (elInvited !== null)
            elInvited.SetHasClass('hidden', !isInvited);
    }
    function _OnInviteSetPanelEvent(elTile) {
        let xuid = _m_xuid;
        elTile.FindChildTraverse('JsInviteAdvertisingPlayer').SetPanelEvent('onactivate', () => {
            FriendsListAPI.ActionInviteFriend(xuid, '');
            $.DispatchEvent('FriendInvitedFromContextMenu', xuid);
        });
    }
})(FriendAdvertiseTile || (FriendAdvertiseTile = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJpZW5kX2FkdmVydGlzZV90aWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvZnJpZW5kX2FkdmVydGlzZV90aWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFDbEMsNkNBQTZDO0FBQzdDLHlDQUF5QztBQUV6QyxJQUFVLG1CQUFtQixDQXNINUI7QUF0SEQsV0FBVSxtQkFBbUI7SUFFNUIsSUFBSSxPQUFPLEdBQUcsRUFBRSxDQUFDO0lBRWpCLFNBQWdCLElBQUksQ0FBRSxNQUFlO1FBRXBDLE9BQU8sR0FBRyxNQUFNLENBQUMsa0JBQWtCLENBQUUsTUFBTSxFQUFFLGFBQWEsQ0FBRSxDQUFDO1FBQzdELElBQUksUUFBUSxHQUFHLGVBQWUsQ0FBQyxzQkFBc0IsQ0FBRSxPQUFPLEVBQUUsV0FBVyxDQUFFLENBQUM7UUFFOUUsSUFBSSxpQkFBaUIsR0FBRyxZQUFZLENBQUMsZUFBZSxFQUFFLEtBQUssY0FBYyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztRQUV6RixjQUFjLENBQUUsTUFBTSxDQUFFLENBQUM7UUFDekIsU0FBUyxDQUFFLE1BQU0sQ0FBRSxDQUFDO1FBRXBCLElBQUssQ0FBQyxpQkFBaUI7WUFDdEIsVUFBVSxDQUFFLE1BQU0sQ0FBRSxDQUFDO1FBRXRCLGNBQWMsQ0FBRSxNQUFNLEVBQUUsUUFBUSxDQUFFLENBQUM7UUFDbkMsdUJBQXVCLENBQUUsTUFBTSxDQUFFLENBQUM7UUFDbEMsaUJBQWlCLENBQUUsTUFBTSxDQUFFLENBQUM7UUFDNUIsc0JBQXNCLENBQUUsTUFBTSxDQUFFLENBQUM7SUFDbEMsQ0FBQztJQWpCZSx3QkFBSSxPQWlCbkIsQ0FBQTtJQUVELFNBQVMsY0FBYyxDQUFFLE1BQWU7UUFFdkMsSUFBSSxlQUFlLEdBQUcsZUFBZSxDQUFDLGtCQUFrQixDQUFFLE9BQU8s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