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
        $.GetContextPanel().SetHasClass('show-title', title !== '');
        $.GetContextPanel().SetHasClass('show-tooltip', tooltip !== '');
        $.GetContextPanel().SetHasClass('show-link', link !== '');
        $.GetContextPanel().SetDialogVariable('title', title);
        $.GetContextPanel().SetDialogVariable('tooltip', $.Localize(tooltip));
        $.GetContextPanel().SetDialogVariable('link', link);
        $.GetContextPanel().FindChildInLayoutFile('id-notification-text-block').SetHasClass(color, true);
    }
    ContextMenuNavBarNotification.SetupContextMenu = SetupContextMenu;
    {
    }
})(ContextMenuNavBarNotification || (ContextMenuNavBarNotification = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dF9tZW51X25hdmJhcl9ub3RpZmljYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9jb250ZXh0X21lbnVzL2NvbnRleHRfbWVudV9uYXZiYXJfbm90aWZpY2F0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFFckMsSUFBVSw2QkFBNkIsQ0F3RHRDO0FBeERELFdBQVUsNkJBQTZCO0lBRXRDLFNBQWdCLGdCQUFnQjtRQUU5QixNQUFNLElBQUksR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsa0JBQWtCLENBQUUsTUFBTSxFQUFHLEVBQUUsQ0FBRSxDQUFDO1FBQ25FLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxPQUFPLEVBQUcsRUFBRSxDQUFFLENBQUM7UUFDckUsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGtCQUFrQixDQUFFLE9BQU8sRUFBRyxFQUFFLENBQUUsQ0FBQztRQUNyRSxNQUFNLE9BQU8sR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsa0JBQWtCLENBQUUsU0FBUyxFQUFHLEVBQUUsQ0FBRSxDQUFDO1FBQ3pFLE1BQU0sSUFBSSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxNQUFNLEVBQUcsRUFBRSxDQUFFLENBQUM7UUFDbkUsTUFBTSxZQUFZLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGtCQUFrQixDQUFFLGNBQWMsRUFBRSxFQUFFLENBQUUsQ0FBQztRQUVsRixNQUFNLE9BQU8sR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFFLE9BQU8sRUFBRSxDQUFDLENBQUMsZUFBZSxFQUFFLEVBQUUsRUFBRSxDQUFFLENBQUM7UUFDbEUsT0FBTyxDQUFDLGtCQUFrQixDQUFFLGNBQWMsQ0FBRSxDQUFDO1FBSzdDLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSx5QkFBeUIsQ0FBRSxDQUFDLFdBQVcsQ0FBRSxNQUFNLEVBQUUsWUFBWSxLQUFLLE1BQU0sQ0FBRSxDQUFDO1FBRXRILElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxzQkFBc0IsQ0FBYSxDQUFDO1FBQzVGLE1BQU0sQ0FBQyxXQUFXLENBQUUsTUFBTSxFQUFFLFlBQVksS0FBSyxNQUFNLENBQUUsQ0FBQztRQUV0RCxJQUFJLFlBQVksS0FBSyxNQUFNLEVBQzNCO1lBQ0MsTUFBTSxDQUFDLFFBQVEsQ0FBRSwyQkFBMkIsR0FBRyxJQUFJLEdBQUcsTUFBTSxDQUFDLENBQUM7WUFDOUQsTUFBTSxDQUFDLFdBQVcsQ0FBRSxLQUFLLEVBQUUsS0FBSyxLQUFLLEVBQUUsQ0FBRSxDQUFDO1NBQzFDO1FBRUQsSUFBSSxJQUFJLEtBQUssRUFBRSxFQUNmO1lBQ0MsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLHNCQUFzQixDQUFFLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxHQUFHLEVBQUUsQ0FBQyxlQUFlLENBQUMsaUNBQWlDLENBQUUsSUFBSSxDQUFFLENBQUUsQ0FBQztTQUNuSztRQUdELENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxXQUFXLENBQUUsWUFBWSxFQUFFLEtBQUssS0FBSyxFQUFFLENBQUUsQ0FBQztRQUM5RCxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsV0FBVyxDQUFFLGNBQWMsRUFBRSxPQUFPLEtBQUssRUFBRSxDQUFFLENBQUM7UUFDbEUsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLFdBQVcsQ0FBRSxXQUFXLEVBQUUsSUFBSSxLQUFLLEVBQUUsQ0FBRSxDQUFDO1FBRzVELENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBRSxPQUFPLEVBQUUsS0FBSyxDQUFFLENBQUM7UUFDeEQsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGlCQUFpQixDQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDeEUsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGlCQUFpQixDQUFFLE1BQU0sRUFBRSxJQUFJLENBQUUsQ0FBQztRQUd0RCxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUMsNEJBQTRCLENBQUMsQ0FBQyxXQUFXLENBQUUsS0FBSyxFQUFFLElBQUksQ0FBRSxDQUFDO0lBQ3JHLENBQUM7SUEzQ2UsOENBQWdCLG1CQTJDL0IsQ0FBQTtJQU9EO0tBR0M7QUFDRixDQUFDLEVBeERTLDZCQUE2QixLQUE3Qiw2QkFBNkIsUUF3RHRDIn0=