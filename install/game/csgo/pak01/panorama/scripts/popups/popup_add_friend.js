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
        // Set submit button disabled by default.
        $('#JsPopupYourSendRequest').enabled = false;
        // Set found friends messages hidden by default.
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
            // Show friend
            let elTile = $.GetContextPanel().FindChildTraverse('JsPopupFriendTile');
            if (!elTile) {
                elTile = $.CreatePanel("Panel", $('#JsFriendCodeFound'), 'JsPopupFriendTile');
                elTile.SetAttributeString('xuid', xuid);
                elTile.BLoadLayout('file://{resources}/layout/friendtile.xml', false, false);
            }
            // This gives the panel enough time to load so we call the init
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
            // Show not found Message.
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
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created 
    //--------------------------------------------------------------------------------------------------
    {
        $.RegisterForUnhandledEvent('PanoramaComponent_FriendsList_NameChanged', _FriendsListUpdateName);
    }
})(PopupAddFriend || (PopupAddFriend = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfYWRkX2ZyaWVuZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3BvcHVwcy9wb3B1cF9hZGRfZnJpZW5kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFDckMseUNBQXlDO0FBRXpDLElBQVUsY0FBYyxDQTRHdkI7QUE1R0QsV0FBVSxjQUFjO0lBRXZCLElBQUksY0FBYyxHQUFHLEVBQUUsQ0FBQztJQUV4QixTQUFnQixJQUFJO1FBRW5CLElBQUksUUFBUSxHQUFHLFlBQVksQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUU1QyxJQUFJLGFBQWEsR0FBRyxDQUFDLENBQUUsd0JBQXdCLENBQUcsQ0FBQztRQUVuRCxhQUFhLENBQUMsYUFBYSxDQUFFLGFBQWEsRUFBRSxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFFLHVCQUF1QixFQUFFLFFBQVEsQ0FBRSxDQUFFLENBQUM7UUFDdEgsYUFBYSxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLGVBQWUsRUFBRSxDQUFFLENBQUM7UUFDbEYsYUFBYSxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsR0FBRyxFQUFFO1lBRS9DLGVBQWUsQ0FBQyxtQkFBbUIsQ0FBRSxRQUFRLENBQUUsQ0FBQztZQUNoRCxZQUFZLENBQUMsZUFBZSxDQUFFLHVCQUF1QixFQUFFLDJCQUEyQixDQUFFLENBQUM7UUFDdEYsQ0FBQyxDQUFFLENBQUM7UUFFSix5Q0FBeUM7UUFDekMsQ0FBQyxDQUFFLHlCQUF5QixDQUFHLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztRQUVoRCxnREFBZ0Q7UUFDaEQsQ0FBQyxDQUFFLHVCQUF1QixDQUFHLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztRQUM5QyxDQUFDLENBQUUsb0JBQW9CLENBQUcsQ0FBQyxPQUFPLEdBQUcsS0FB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