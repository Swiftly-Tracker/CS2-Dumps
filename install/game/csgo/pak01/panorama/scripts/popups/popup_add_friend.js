"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../friendtile.ts" />
var PopupAddFriend;
(function (PopupAddFriend) {
    let m_xuidToInvite = '';
    function Init() {
        let yourCode = MyPersonaAPI.GetFriendCode();
        let elYourCodeBtn = $('#JsPopupYourFriendCode');
        elYourCodeBtn.SetPanelEvent('onmouseover', () => UiToolkitAPI.ShowTextTooltip('JsPopupYourFriendCode', yourCode));
        elYourCodeBtn.SetPanelEvent('onmouseout', () => UiToolkitAPI.HideTextTooltip());
        elYourCodeBtn.SetPanelEvent('onactivate', () => {
            SteamOverlayAPI.CopyTextToClipboard(yourCode);
            UiToolkitAPI.ShowTextTooltip('JsPopupYourFriendCode', '#AddFriend_copy_code_Hint');
        });
        $('#JsPopupYourSendRequest').enabled = false;
        $('#JsFriendCodeNotFound').visible = false;
        $('#JsFriendCodeFound').visible = false;
        $('#JsAddFriendTextEntryLabel').SetFocus();
        $('#JsAddFriendTextEntryLabel').SetPanelEvent('ontextentrychange', OnEntrySubmit);
    }
    PopupAddFriend.Init = Init;
    function OnEntrySubmit() {
        let elNotFoundLabel = $('#JsFriendCodeNotFound');
        let elTextEntry = $('#JsAddFriendTextEntryLabel');
        let xuid = FriendsListAPI.GetXuidFromFriendCode(elTextEntry.text.toUpperCase());
        if (xuid) {
            let elTile = $.GetContextPanel().FindChildTraverse('JsPopupFriendTile');
            if (!elTile) {
                elTile = $.CreatePanel("Panel", $('#JsFriendCodeFound'), 'JsPopupFriendTile');
                elTile.SetAttributeString('xuid', xuid);
                elTile.BLoadLayout('file://{resources}/layout/friendtile.xml', false, false);
            }
            $.Schedule(.1, () => {
                FriendTile.Init(elTile);
                elTile.RemoveClass('hidden');
            });
            $('#JsAddFriendInviteImg').AddClass('hidden');
            $('#JsFriendCodeFound').visible = true;
            $('#JsPopupYourSendRequest').enabled = true;
            elNotFoundLabel.visible = false;
            $.GetContextPanel().FindChildInLayoutFile('JSFriendValidIcon').SetHasClass('valid', true);
            m_xuidToInvite = xuid;
        }
        else {
            if (elTextEntry.text === '') {
                elNotFoundLabel.visible = false;
                return;
            }
            elNotFoundLabel.SetDialogVariable('code', elTextEntry.text.toUpperCase());
            elNotFoundLabel.text = $.Localize('#AddFriend_not_found', elNotFoundLabel);
            $.GetContextPanel().FindChildInLayoutFile('JSFriendValidIcon').SetHasClass('valid', false);
            elNotFoundLabel.visible = true;
            $('#JsPopupYourSendRequest').enabled = false;
            $('#JsFriendCodeFound').visible = false;
        }
    }
    PopupAddFriend.OnEntrySubmit = OnEntrySubmit;
    function OnSendInvite() {
        $('#JsAddFriendInviteImg').RemoveClass('hidden');
        $('#JsPopupYourSendRequest').enabled = false;
        SteamOverlayAPI.InteractWithUser(m_xuidToInvite, 'friendadd');
        $.DispatchEvent('UIPopupButtonClicked', '');
    }
    PopupAddFriend.OnSendInvite = OnSendInvite;
    function _FriendsListUpdateName(xuid) {
        let elTile = $.GetContextPanel().FindChildTraverse('JsPopupFriendTile');
        if (elTile && elTile.IsValid() && (xuid === elTile.GetAttributeString('xuid', ''))) {
            FriendTile.Init(elTile);
        }
    }
    {
        $.RegisterForUnhandledEvent('PanoramaComponent_FriendsList_NameChanged', _FriendsListUpdateName);
    }
})(PopupAddFriend || (PopupAddFriend = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfYWRkX2ZyaWVuZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3BvcHVwcy9wb3B1cF9hZGRfZnJpZW5kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFDckMseUNBQXlDO0FBRXpDLElBQVUsY0FBYyxDQTRHdkI7QUE1R0QsV0FBVSxjQUFjO0lBRXZCLElBQUksY0FBYyxHQUFHLEVBQUUsQ0FBQztJQUV4QixTQUFnQixJQUFJO1FBRW5CLElBQUksUUFBUSxHQUFHLFlBQVksQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUU1QyxJQUFJLGFBQWEsR0FBRyxDQUFDLENBQUUsd0JBQXdCLENBQUcsQ0FBQztRQUVuRCxhQUFhLENBQUMsYUFBYSxDQUFFLGFBQWEsRUFBRSxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFFLHVCQUF1QixFQUFFLFFBQVEsQ0FBRSxDQUFFLENBQUM7UUFDdEgsYUFBYSxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLGVBQWUsRUFBRSxDQUFFLENBQUM7UUFDbEYsYUFBYSxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsR0FBRyxFQUFFO1lBRS9DLGVBQWUsQ0FBQyxtQkFBbUIsQ0FBRSxRQUFRLENBQUUsQ0FBQztZQUNoRCxZQUFZLENBQUMsZUFBZSxDQUFFLHVCQUF1QixFQUFFLDJCQUEyQixDQUFFLENBQUM7UUFDdEYsQ0FBQyxDQUFFLENBQUM7UUFHSixDQUFDLENBQUUseUJBQXlCLENBQUcsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1FBR2hELENBQUMsQ0FBRSx1QkFBdUIsQ0FBRyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7UUFDOUMsQ0FBQyxDQUFFLG9CQUFvQixDQUFHLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztRQUUzQyxDQUFDLENBQUUsNEJB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