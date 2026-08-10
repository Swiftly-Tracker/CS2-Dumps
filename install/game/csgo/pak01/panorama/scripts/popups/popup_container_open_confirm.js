"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../common/formattext.ts" />
var PopupContainerOpenConfirm;
(function (PopupContainerOpenConfirm) {
    function Init() {
        let itemId = $.GetContextPanel().GetAttributeString('case', '');
        let actionType = $.GetContextPanel().GetAttributeString('action-type', '');
        SetImage(itemId);
        SetWarningText(actionType);
        $.GetContextPanel().SetHasClass('open-container', actionType === 'open');
        $.GetContextPanel().SetDialogVariable('name', InventoryAPI.GetItemName(itemId));
        $.GetContextPanel().SetDialogVariable('title', $.Localize("#popup_container_confirm_title_" + actionType, $.GetContextPanel()));
        let msg_override = $.GetContextPanel().GetAttributeString('msg_override', '');
        $.GetContextPanel().SetDialogVariable('body', msg_override ? msg_override : $.Localize("#popup_container_confirm_body_" + actionType, $.GetContextPanel()));
        let actionBtn = $.GetContextPanel().FindChildInLayoutFile('id-open-confirm-btn');
        let closeBtn = $.GetContextPanel().FindChildInLayoutFile('id-close-confirm-btn');
        var callbackHandle = $.GetContextPanel().GetAttributeInt("callback", -1);
        if (actionType === 'expire') {
            closeBtn.text = "#UI_OK";
            closeBtn.SetPanelEvent('onactivate', () => {
                if (callbackHandle != -1) {
                    UiToolkitAPI.InvokeJSCallback(callbackHandle, '');
                }
                $.DispatchEvent('UIPopupButtonClicked', '');
                $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.mainmenu_press_quit', 'MOUSE');
            });
            actionBtn.visible = false;
            return;
        }
        closeBtn.text = "#UI_Cancel";
        closeBtn.SetPanelEvent('onactivate', () => {
            $.DispatchEvent('UIPopupButtonClicked', '');
            $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.mainmenu_press_quit', 'MOUSE');
        });
        actionBtn.SwitchClass('action-type', actionType === 'open' ? 'Positive' : 'Blue');
        actionBtn.text = actionType === 'open' ? '#popup_decodable_open_case' : '#popup_decodable_rent_weapons';
        actionBtn.SetPanelEvent('onactivate', () => {
            if (callbackHandle != -1) {
                UiToolkitAPI.InvokeJSCallback(callbackHandle, actionType);
            }
            $.DispatchEvent('UIPopupButtonClicked', '');
        });
    }
    PopupContainerOpenConfirm.Init = Init;
    function SetImage(itemId) {
        $.GetContextPanel().FindChildInLayoutFile('id-confirm-item-image').itemid = itemId;
        let reflection = $.GetContextPanel().FindChildInLayoutFile('id-confirm-item-image-ref');
        $.Schedule(.1, () => reflection.SetImageFromPanel($.GetContextPanel().FindChildInLayoutFile('id-confirm-item-image'), false));
    }
    function SetWarningText(actionType) {
        $.GetContextPanel().FindChildInLayoutFile('id-warning-label').visible = actionType === 'rent';
        if (actionType === 'rent') {
            $.GetContextPanel().SetDialogVariable('warning', $.Localize("#popup_container_confirm_warning_" + actionType));
        }
    }
})(PopupContainerOpenConfirm || (PopupContainerOpenConfirm = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfY29udGFpbmVyX29wZW5fY29uZmlybS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3BvcHVwcy9wb3B1cF9jb250YWluZXJfb3Blbl9jb25maXJtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFDckMsZ0RBQWdEO0FBR2hELElBQVUseUJBQXlCLENBc0VsQztBQXRFRCxXQUFVLHlCQUF5QjtJQUVsQyxTQUFnQixJQUFJO1FBRW5CLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDakUsSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGtCQUFrQixDQUFFLGFBQWEsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUU1RSxRQUFRLENBQUUsTUFBTSxDQUFFLENBQUM7UUFDbkIsY0FBYyxDQUFFLFVBQVUsQ0FBRSxDQUFDO1FBQzdCLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxXQUFXLENBQUUsZ0JBQWdCLEVBQUUsVUFBVSxLQUFLLE1BQU0sQ0FBRyxDQUFDO1FBRTVFLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBRSxNQUFNLEVBQUUsWUFBWSxDQUFDLFdBQVcsQ0FBRSxNQUFNLENBQUUsQ0FBQyxDQUFDO1FBQ25GLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBRSxPQUFPLEVBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxpQ0FBaUMsR0FBRyxVQUFVLEVBQUUsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUUsQ0FBQztRQUVwSSxJQUFJLFlBQVksR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsa0JBQWtCLENBQUUsY0FBYyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQy9FLENBQUMs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