"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="honor_icon.ts" />
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
            _m_hasClanInfo = MyPersonaAPI.GetMyClanNameById(_m_xuid) != '';
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
            elLabel.text = MyPersonaAPI.GetMyClanNameById(_m_xuid);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJpZW5kdGlsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL2ZyaWVuZHRpbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUNsQyxzQ0FBc0M7QUFFdEMsSUFBVSxVQUFVLENBMExuQjtBQTFMRCxXQUFVLFVBQVU7SUFFbkIsSUFBSSxPQUFPLEdBQUcsRUFBRSxDQUFDO0lBQ2pCLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQztJQUN0QixJQUFJLGNBQWMsR0FBRyxLQUFLLENBQUM7SUFDM0IsSUFBSSxhQUFhLEdBQWtCLElBQUksQ0FBQztJQUV4QyxTQUFnQixJQUFJLENBQUUsTUFBZTtRQUVwQyxPQUFPLEdBQUcsTUFBTSxDQUFDLGtCQUFrQixDQUFFLE1BQU0sRUFBRSxhQUFhLENBQUUsQ0FBQztRQUM3RCxTQUFTLEdBQUcsTUFBTSxDQUFDLGtCQUFrQixDQUFFLFFBQVEsRUFBRSxPQUFPLENBQUUsS0FBSyxNQUFNLENBQUM7UUFFdEUsSUFBSyxTQUFTLEVBQ2Q7WUFDQyxjQUFjLEdBQUcsWUFBWSxDQUFDLGlCQUFpQixDQUFFLE9BQU8sQ0FBRSxJQUFJLEVBQUUsQ0FBQztZQUVqRSxJQUFLLENBQUMsYUFBYTtnQkFDbEIsYUFBYSxHQUFHLENBQUMsQ0FBQyx5QkFBeUIsQ0FBRSw4Q0FBOEMsRUFBRSxpQkFBaUIsQ0FBRSxDQUFDO1NBQ2xIO1FBRUQsU0FBUyxDQUFFLE1BQU0sQ0FBRSxDQUFDO1FBQ3BCLGFBQWEsQ0FBRSxNQUFNLENBQUUsQ0FBQztRQUN4QixRQUFRLENBQUUsTUFBTSxDQUFFLENBQUM7UUFDbkIsVUFBVSxDQUFFLE1BQU0sQ0FBRSxDQUFDO1FBQ3JCLGFBQWEsQ0FBRSxNQUFNLENBQUUsQ0FBQztRQUN4Qix1QkFBdUIsQ0FBRSxNQUFNLENBQUUsQ0FBQztRQUNsQyxXQUFXLENBQUUsTUFBTSxDQUFFLENBQUM7UUFDdEIsWUFBWSxDQUFFLE1BQU0sQ0FBRSxDQUFDO1FBQ3ZCLG1CQUFtQixDQUFFLE1BQU0sQ0FBRSxDQUFDO0lBQy9CLENBQUM7SUF0QmUsZUFBSSxPQXNCbkIsQ0FBQTtJQUVELFNBQVMsYUFBYSxDQUFHLE1BQWU7UUFFdkMsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLGlCQUFpQixDQUFFLGFBQWEsQ0FBcUIsQ0FBQztRQUNqRixJQUFLLFdBQVc7WUFDZixXQUFXLENBQUMsR0FBRyxDQUFFLGNBQWMsQ0FBQyxxQkFBcUIsQ0FBRSxPQUFPLENBQUUsRUFBRSxLQUFLLENBQUUsQ0FBQztJQUM1RSxDQUFDO0lBRUQsU0FBUyxTQUFTLENBQUUsTUFBZTtRQUVsQyxJQUFJLFdBQVcsR0FBRyxNQUFNLENBQUMsaUJBQWlCLENBQUUsZ0JBQWdCLENBQXVCLENBQUM7UUFDcEYsV0FBVyxDQUFDLG1CQUFtQixDQUFFLE9BQU8sQ0FBRSxDQUFDO1FBRzNDLFdBQVcsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxTQUFTLElBQUksY0FBYyxDQUFDO0lBQ3BELENBQUM7SUFFRCxTQUFTLGFBQWEsQ0FBRSxNQUFlO1FBRXRDLElBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBRSxzQkFBc0IsQ0FBRSxDQUFDO1FBQzlELElBQUksWUFBWSxHQUFHLGNBQWMsQ0FBQyxxQkFBcUIsQ0FBRSxPQUFPLENBQUUsQ0FBQztRQUNuRSxJQUFJLFFBQVEsR0FBRyxjQUFjLENBQUMscUJBQXFCLENBQUUsT0FBTyxDQUFFLENBQUM7UUFJL0QsSUFBSyxZQUFZLENBQUMsaUJBQWlCLENBQUUsT0FBTyxDQUFFLElBQUksUUFBUSxLQUFLLFFBQVEsRUFDdkU7WUFDQyxZQUFZLEdBQUcsYUFBYSxDQUFDO1NBQzdCO2FBQ0ksSUFBSyxRQUFRLEtBQUssUUFBUSxFQUMvQjtZQUNDLFlBQVksR0FBRyxTQUFTLENBQUM7U0FDekI7UUFFRCxJQUFJLENBQUMsV0FBVyxDQUFFLFFBQVEsRUFBRSxZQUFZLEtBQUssYUFBYSxDQUFFLENBQUM7SUFDOUQsQ0FBQztJQUVELFNBQVMsUUFBUSxDQUFFLE1BQWU7UUFFakMsSUFBSSxPQUFPLEdBQUcsTUFBTSxDQUFDLGlCQUFpQixDQUFFLGNBQWMsQ0FBYSxDQUFDO1FBRXBFLElBQUssQ0FBQyxTQUFTLEVBQ2Y7WUFDQyxJQUFJLElBQUksR0FBRyxjQUFjLENBQUMsYUFBYSxDQUFFLE9BQU8sQ0FBRSxDQUFDO1lBQ25ELElBQUssSUFBSSxLQUFLLFdBQVcsRUFDekI7Z0JBQ0MsSUFBSSxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFFLHNCQUFzQixDQUFFLEdBQUcsR0FBRyxDQUFDO2FBQ3hEO1lBRUQsT0FBTyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7U0FDcEI7YUFFRDtZQUNDLE9BQU8sQ0FBQyxJQUFJLEdBQUcsWUFBWSxDQUFDLGlCQUFpQixDQUFFLE9BQU8sQ0FBRSxDQUFDO1lBQ3pELE9BQU8sQ0FBQyxPQUFPLEdBQUcsQ0FBQyxTQUFTLElBQUksY0FBYyxDQUFDO1NBQy9DO0lBQ0YsQ0FBQztJQUVELFNBQVMsVUFBVSxDQUFFLE1BQWU7UUFFbkMsSUFBSSxnQkFBZ0IsR0FBRyxFQUFFLENBQUM7UUFFMUIsSUFBSyxTQUFTLEVBQ2Q7WUFDQyxnQkFBZ0IsR0FBRyxhQUFhLENBQUM7U0FDakM7YUFFRDtZQUNDLElBQUssTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksS0FBSyxRQUFRLEVBQ3BDO2dCQUNDLGdCQUFnQixHQUFHLFlBQVksQ0FBQyxlQUFlLENBQUUsT0FBTyxDQUFFLENBQUM7YUFDM0Q7WUFFRCxJQUFLLENBQUMsZ0JBQWdCO2dCQUNyQixnQkFBZ0IsR0FBRyxjQUFjLENBQUMsZUFBZSxDQUFFLE9BQU8sQ0FBRSxDQUFDO1NBQzlEO1FBRUQsSUFBSSxPQUFPLEdBQUcsTUFBTSxDQUFDLGlCQUFpQixDQUFFLGdCQUFnQixDQUFhLENBQUM7UUFDdEUsT0FBTyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFFLGdCQUFnQixDQUFFLENBQUM7SUFDL0MsQ0FBQztJQUVELFNBQVMsdUJBQXVCLENBQUUsTUFBZTtRQUVoRCxJQUFJLFNBQVMsR0FBRyxjQUFjLENBQUMsZUFBZSxDQUFFLE9BQU8sQ0FBRSxDQUFDO1FBQzFELFdBQVcsQ0FBRSxNQUFNLEVBQUUsU0FBUyxDQUFFLENBQUM7SUFDbEMsQ0FBQztJQUVELFNBQWdCLHlCQUF5QixDQUFFLE1BQWU7UUFFekQsV0FBVyxDQUFFLE1BQU0sRUFBRSxJQUFJLENBQUUsQ0FBQztJQUM3QixDQUFDO0lBSGUsb0NBQXlCLDRCQUd4QyxDQUFBO0lBRUQsU0FBUyxXQUFXLENBQUUsTUFBZSxFQUFFLFNBQWtCO1FBRXhELElBQUksU0FBUyxHQUFHLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBRSxpQkFBaUIsQ0FBRSxDQUFDO1FBRTlELElBQUssU0FBUyxLQUFLLElBQUk7WUFDdEIsU0FBUyxDQUFDLFdBQVcsQ0FBRSxRQUFRLEVBQUUsQ0FBQyxTQUFTLENBQUUsQ0FBQztJQUNoRCxDQUFDO0lBRUQsU0FBUyxXQUFXLENBQUUsTUFBZTtRQUVwQyxJQUFJLE9BQU8sR0FBRyxjQUFjLENBQUMsZ0JBQWdCLENBQUUsT0FBTyxDQUFFLENBQUM7UUFFekQsTUFBTSxDQUFDLGlCQUFpQixDQUFFLGNBQWMsQ0FBRSxDQUFDLFdBQVcsQ0FBRSxRQUFRLEVBQUUsQ0FBQyxPQUFPLENBQUUsQ0FBQztJQUM5RSxDQUFDO0lBRUQsU0FBUyxZQUFZLENBQUUsTUFBZTtRQUVyQyxJQUFJLFFBQVEsR0FBRyxjQUFjLENBQUMsaUJBQWlCLENBQUUsT0FBTyxDQUFFLENBQUM7UUFFM0QsTUFBTSxDQUFDLGlCQUFpQixDQUFFLGVBQWUsQ0FBRSxDQUFDLFdBQVcsQ0FBRSxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUUsQ0FBQztJQUNoRixDQUFDO0lBRUQsU0FBUyxtQkFBbUIsQ0FBRSxNQUFlO1FBRTVDLElBQUssU0FBUyxFQUNkO1lBQ0MsTUFBTSxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsR0FBRyxFQUFFO2dCQUV4QyxlQUFlLENBQUMsaUNBQWlDLENBQUUsVUFBVSxHQUFHLGVBQWUsQ0FBQyxvQkFBb0IsRUFBRSxHQUFHLE9BQU8sR0FBRyxPQUFPLENBQUUsQ0FBQztZQUM5SCxDQUFDLENBQUUsQ0FBQztZQUVKLE9BQU87U0FDUDtRQUVELFNBQVMsZUFBZSxDQUFFLElBQVk7WUFHckMsQ0FBQyxDQUFDLGFBQWEsQ0FBRSwwQkFBMEIsRUFBRSxJQUFJLENBQUUsQ0FBQztZQUVwRCxJQUFJLGdCQUFnQixHQUFHLFlBQVksQ0FBQyxpREFBaUQsQ0FDcEYsRUFBRSxFQUNGLEVBQUUsRUFDRixxRUFBcUUsRUFDckUsT0FBTyxHQUFHLElBQUk7Z0JBQ2QsQ0FBRSxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFFLFFBQVEsR0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBRSxFQUM3RCxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFFLDBCQUEwQixFQUFFLEtBQUssQ0FBRSxDQUMxRCxDQUFDO1lBQ0YsZ0JBQWdCLENBQUMsUUFBUSxDQUFFLHFCQUFxQixDQUFFLENBQUM7UUFDcEQsQ0FBQztRQUVELE1BQU0sQ0FBQyxpQkFBaUIsQ0FBRSxpQkFBaUIsQ0FBRSxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsZUFBZSxDQUFDLElBQUksQ0FBRSxTQUFTLEVBQUUsT0FBTyxDQUFFLENBQUUsQ0FBQztRQUN4SCxNQUFNLENBQUMsaUJBQWlCLENBQUUsaUJBQWlCLENBQUUsQ0FBQyxhQUFhLENBQUUsZUFBZSxFQUFFLGVBQWUsQ0FBQyxJQUFJLENBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBRSxDQUFFLENBQUM7SUFDNUgsQ0FBQztJQUVELFNBQVMsaUJBQWlCO1FBR3pCLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBRSxzQkFBc0IsQ0FBMEIsQ0FBQztRQUVyRyxJQUFLLE1BQU0sQ0FBQyxRQUFRLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFFLGVBQWUsQ0FBRSxFQUM1RTtZQUNDLElBQUksQ0FBRSxNQUFNLENBQUUsQ0FBQztTQUNmO0lBQ0YsQ0FBQztBQUNGLENBQUMsRUExTFMsVUFBVSxLQUFWLFVBQVUsUUEwTG5CIn0=