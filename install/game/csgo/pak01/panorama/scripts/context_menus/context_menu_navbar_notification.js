"use strict";
/// <reference path="../csgo.d.ts" />
var ContextMenuNavBarNotification;
(function (ContextMenuNavBarNotification) {
    function SetupContextMenu() {
        const icon = $.GetContextPanel().GetAttributeString('icon', '');
        const title = $.GetContextPanel().GetAttributeString('title', '');
        const color = $.GetContextPanel().GetAttributeString('color', '');
        const tooltip = $.GetContextPanel().GetAttributeString('tooltip', '');
        const link = $.GetContextPanel().GetAttributeString('link', '');
        const gcConnecting = $.GetContextPanel().GetAttributeString('gcconnecting', '');
        const elPanel = $.CreatePanel('Panel', $.GetContextPanel(), '');
        elPanel.BLoadLayoutSnippet('notification');
        $.Msg('ContextMenuNavBarNotification: ' + gcConnecting);
        // Show hide icons
        $.GetContextPanel().FindChildInLayoutFile('id-notification-gc-icon').SetHasClass('show', gcConnecting === 'true');
        let elIcon = $.GetContextPanel().FindChildInLayoutFile('id-notification-icon');
        elIcon.SetHasClass('show', gcConnecting !== 'true');
        if (gcConnecting !== 'true') {
            elIcon.SetImage('file://{images}/icons/ui/' + icon + '.svg');
            elIcon.SetHasClass(color, color !== '');
        }
        if (link !== '') {
            $.GetContextPanel().FindChildInLayoutFile('id-notification-link').SetPanelEvent('onactivate', () => SteamOverlayAPI.OpenUrlInOverlayOrExternalBrowser(link));
        }
        // Show hide text based on if we have text to show
        $.GetContextPanel().SetHasClass('show-title', title !== '');
        $.GetContextPanel().SetHasClass('show-tooltip', tooltip !== '');
        $.GetContextPanel().SetHasClass('show-link', link !== '');
        // Set text
        $.GetContextPanel().SetDialogVariable('title', title);
        $.GetContextPanel().SetDialogVariable('tooltip', $.Localize(tooltip));
        $.GetContextPanel().SetDialogVariable('link', link);
        $.GetContextPanel().FindChildInLayoutFile('id-notification-text-block').SetHasClass(color, true);
    }
    ContextMenuNavBarNotification.SetupContextMenu = SetupContextMenu;
    // $( '#DynamicLabel' ).text = "Parameter 'test' had value '" + strTest + "'";
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        // const oNotification = $.GetContextPanel().Data().oNotification as MainMenu.NotificationBarDef_t;
        $.Msg('ContextMenuNavBarNotification ');
    }
})(ContextMenuNavBarNotification || (ContextMenuNavBarNotification = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dF9tZW51X25hdmJhcl9ub3RpZmljYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9jb250ZXh0X21lbnVzL2NvbnRleHRfbWVudV9uYXZiYXJfbm90aWZpY2F0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFFckMsSUFBVSw2QkFBNkIsQ0F3RHRDO0FBeERELFdBQVUsNkJBQTZCO0lBRXRDLFNBQWdCLGdCQUFnQjtRQUU5QixNQUFNLElBQUksR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsa0JBQWtCLENBQUUsTUFBTSxFQUFHLEVBQUUsQ0FBRSxDQUFDO1FBQ25FLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxPQUFPLEVBQUcsRUFBRSxDQUFFLENBQUM7UUFDckUsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGtCQUFrQixDQUFFLE9BQU8sRUFBRyxFQUFFLENBQUUsQ0FBQztRQUNyRSxNQUFNLE9BQU8sR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsa0JBQWtCLENBQUUsU0FBUyxFQUFHLEVBQUUsQ0FBRSxDQUFDO1FBQ3pFLE1BQU0sSUFBSSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxNQUFNLEVBQUcsRUFBRSxDQUFFLENBQUM7UUFDbkUsTUFBTSxZQUFZLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGtCQUFrQixDQUFFLGNBQWMsRUFBRSxFQUFFLENBQUUsQ0FBQztRQUVsRixNQUFNLE9BQU8sR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFFLE9BQU8sRUFBRSxDQUFDLENBQUMsZUFBZSxFQUFFLEVBQUUsRUFBRSxDQUFFLENBQUM7UUFDbEUsT0FBTyxDQUFDLGtCQUFrQixDQUFFLGNBQWMsQ0FBRSxDQUFDO1FBRTdDLENBQUMsQ0FBQyxHQUFHLENBQUUsaUNBQWlDLEdBQUksWUFBWSxDQUFFLENBQUM7UUFFM0Qsa0JBQWtCO1FBQ2xCLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSx5QkFBeUIsQ0FBRSxDQUFDLFdBQVcsQ0FBRSxNQUFNLEVBQUUsWUFBWSxLQUFLLE1BQU0sQ0FBRSxDQUFDO1FBRXRILElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxzQkFBc0IsQ0FBYSxDQUFDO1FBQzVGLE1BQU0sQ0FBQyxXQUFXLENBQUUsTUFBTSxFQUFFLFlBQVksS0FBSyxNQUFNLENBQUUsQ0FBQztRQUV0RCxJQUFJLFlBQVksS0FBSyxNQUFNLEVBQzNCO1lBQ0MsTUFBTSxDQUFDLFFBQVEsQ0FBRSwyQkFBMkIsR0FBRyxJQUFJLEdBQUcsTUFBTSxDQUFDLENBQUM7WUFDOUQsTUFBTSxDQUFDLFdBQVcsQ0FBRSxLQUFLLEVBQUUsS0FBSyxLQUFLLEVBQUUsQ0FBRSxDQUFDO1NBQzFDO1FBRUQsSUFBSSxJQUFJLEtBQUssRUFBRSxFQUNmO1lBQ0MsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLHNCQUFzQixDQUFFLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxHQUFHLEVBQUUsQ0FBQyxlQUFlLENBQUMsaUNBQWlDLENBQUUsSUFBSSxDQUFFLENBQUUsQ0FBQztTQUNuSztRQUVELGtEQUFrRDtRQUNsRCxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsV0FBVyxDQUFFLFlBQVksRUFBRSxLQUFLLEtBQUssRUFBRSxDQUFFLENBQUM7UUFDOUQsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLFdBQVcsQ0FBRSxjQUFjLEVBQUUsT0FBTyxLQUFLLEVBQUUsQ0FBRSxDQUFDO1FBQ2xFLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxXQUFXLENBQUUsV0FBVyxFQUFFLElBQUksS0FBSyxFQUFFLENBQUUsQ0FBQztRQUU1RCxXQUFXO1FBQ1gsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGlCQUFpQixDQUFFLE9BQU8sRUFBRSxLQUFLLENBQUUsQ0FBQztRQUN4RCxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsaUJBQWlCLENBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUN4RSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsaUJBQWlCLENBQUUsTUFBTSxFQUFFLElBQUksQ0FBRSxDQUFDO1FBR3RELENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxLQUFLLEVBQUUsSUFBSSxDQUFFLENBQUM7SUFDckcsQ0FBQztJQTNDZSw4Q0FBZ0IsbUJBMkMvQixDQUFBO0lBRUQsOEVBQThFO0lBRTlFLG9HQUFvRztJQUNwRywyQ0FBMkM7SUFDM0Msb0dBQW9HO0lBQ3BHO1FBQ0MsbUdBQW1HO1FBQ25HLENBQUMsQ0FBQyxHQUFHLENBQUUsZ0NBQWdDLENBQUUsQ0FBQztLQUMxQztBQUNGLENBQUMsRUF4RFMsNkJBQTZCLEtBQTdCLDZCQUE2QixRQXdEdEMifQ==