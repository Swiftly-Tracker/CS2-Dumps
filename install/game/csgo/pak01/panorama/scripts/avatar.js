"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/teamcolor.ts" />
var CAvatar = class {
    Init(elAvatar, xuid, type) {
        //	$.Msg( "avatar image xuid: " + xuid );
        const sXuid = xuid.toString();
        switch (type) {
            case 'playercard':
            case 'partymember':
                this.SetImage(elAvatar, sXuid);
                this.SetFlair(elAvatar, sXuid, type);
                this.SetTeamColor(elAvatar, sXuid);
                this.SetLobbyLeader(elAvatar);
                break;
            case 'flair':
                this.SetImage(elAvatar, sXuid);
                this.SetFlair(elAvatar, sXuid, type);
                break;
            default:
                this.SetImage(elAvatar, sXuid);
                this.SetTeamColor(elAvatar, sXuid);
        }
    }
    UpdateTalkingState(elAvatar, xuid, bCalledFromScheduledFunction) {
        if (!elAvatar || !elAvatar.IsValid())
            return;
        const elSpeaking = elAvatar.FindChildTraverse('JsAvatarSpeaking');
        if (!elSpeaking)
            return;
        const bFriendIsTalking = PartyListAPI.GetFriendIsTalking(xuid);
        elSpeaking.SetHasClass('hidden', !bFriendIsTalking);
        if (bFriendIsTalking && (bCalledFromScheduledFunction || !elAvatar.GetAttributeString('updatetalkingstate', ''))) {
            const schfn = $.Schedule(.1, () => this.UpdateTalkingState(elAvatar, xuid, true));
            elAvatar.SetAttributeString('updatetalkingstate', '' + schfn);
        }
        if (!bFriendIsTalking) {
            elAvatar.SetAttributeString('updatetalkingstate', '');
        }
    }
    ;
    SetImage(elAvatar, xuid) {
        const elImage = elAvatar.FindChildTraverse('JsAvatarImage');
        if (xuid === '' || xuid === '0') {
            elImage.AddClass('hidden');
            return;
        }
        elImage.PopulateFromSteamID(xuid);
        elImage.RemoveClass('hidden');
    }
    ;
    SetFlair(elAvatar, xuid, type) {
        const elFlair = elAvatar.FindChildTraverse('JsAvatarFlair');
        if (xuid === '' || xuid === '0') {
            elFlair.AddClass('hidden');
            return;
        }
        let flairItemId = InventoryAPI.GetFlairItemId(xuid);
        // We can't access the xuid inventory so we ask for the display item a differnt way
        if (flairItemId === "0" || !flairItemId) {
            const flairDefIdx = (type === 'partymember')
                ? PartyListAPI.GetFriendDisplayItemDefFeatured(xuid)
                : FriendsListAPI.GetFriendDisplayItemDefFeatured(xuid);
            flairItemId = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(flairDefIdx, 0);
            if (flairItemId === "0" || !flairItemId) {
                elFlair.AddClass('hidden');
                return;
            }
        }
        const imagePath = InventoryAPI.GetItemInventoryImage(flairItemId);
        if (imagePath !== '') {
            elFlair.SetImage('file://{images}' + imagePath + '_small.png');
            elFlair.RemoveClass('hidden');
        }
    }
    ;
    SetTeamColor(elAvatar, xuid) {
        const teamColor = PartyListAPI.GetPartyMemberSetting(xuid, 'game/teamcolor');
        const elTeamColor = elAvatar.FindChildTraverse('JsAvatarTeamColor');
        if (!teamColor) {
            if (elTeamColor)
                elTeamColor.AddClass('hidden');
            return;
        }
        if (typeof TeamColor !== 'undefined') {
            const rgbColor = TeamColor.GetTeamColor(Number(teamColor));
            elTeamColor.RemoveClass('hidden');
            elTeamColor.style.washColor = 'rgb(' + rgbColor + ')';
        }
    }
    ;
    SetLobbyLeader(elAvatar) {
        if (!elAvatar.hasOwnProperty("GetAttributeString"))
            return;
        const show = elAvatar.GetAttributeString('showleader', '');
        const elLeader = elAvatar.FindChildTraverse('JsAvatarLeader');
        if (elLeader) {
            if (show === 'show')
                elLeader.RemoveClass('hidden');
            else
                elLeader.AddClass('hidden');
        }
    }
    ;
};
var Avatar = Avatar ?? new CAvatar();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXZhdGFyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvYXZhdGFyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFDbEMsNENBQTRDO0FBRTVDLElBQUksT0FBTyxHQUFHO0lBRWIsSUFBSSxDQUFHLFFBQWlCLEVBQUUsSUFBcUIsRUFBRSxJQUE2QztRQUU3Rix5Q0FBeUM7UUFDekMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzlCLFFBQVMsSUFBSSxFQUNiO1lBQ0MsS0FBSyxZQUFZLENBQUM7WUFDbEIsS0FBSyxhQUFhO2dCQUNqQixJQUFJLENBQUMsUUFBUSxDQUFFLFFBQVEsRUFBRSxLQUFLLENBQUUsQ0FBQztnQkFDakMsSUFBSSxDQUFDLFFBQVEsQ0FBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBRSxDQUFDO2dCQUN2QyxJQUFJLENBQUMsWUFBWSxDQUFFLFFBQVEsRUFBRSxLQUFLLENBQUUsQ0FBQztnQkFDckMsSUFBSSxDQUFDLGNBQWMsQ0FBRSxRQUFRLENBQUUsQ0FBQztnQkFDaEMsTUFBTTtZQUNQLEtBQUssT0FBTztnQkFDWCxJQUFJLENBQUMsUUFBUSxDQUFFLFFBQVEsRUFBRSxLQUFLLENBQUUsQ0FBQztnQkFDakMsSUFBSSxDQUFDLFFBQVEsQ0FBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBRSxDQUFDO2dCQUN2QyxNQUFNO1lBQ1A7Z0JBQ0MsSUFBSSxDQUFDLFFBQVEsQ0FBRSxRQUFRLEVBQUUsS0FBSyxDQUFFLENBQUM7Z0JBQ2pDLElBQUksQ0FBQyxZQUFZLENBQUUsUUFBUSxFQUFFLEtBQUssQ0FBRSxDQUFDO1NBQ3RDO0lBQ0YsQ0FBQztJQUVELGtCQUFrQixDQUFHLFFBQWlCLEVBQUUsSUFBWSxFQUFFLDRCQUFzQztRQUUzRixJQUFLLENBQUMsUUFBUSxJQUFJLENB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