"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../common/iteminfo.ts" />
var TooltipLoadoutItem;
(function (TooltipLoadoutItem) {
    function SetupTooltip() {
        let ctx = $.GetContextPanel();
        let id = ctx.GetAttributeString("itemid", "");
        let nameOnly = ctx.GetAttributeString("nameonly", "");
        let slot = ctx.GetAttributeString("slot", "");
        let idForItemName = id;
        if (slot === 'spray0') {
            idForItemName = ItemInfo.GetFauxReplacementItemID(id, 'graffiti');
        }
        ctx.SetDialogVariable('name', InventoryAPI.GetItemName(idForItemName));
        let color = InventoryAPI.GetItemRarityColor(id);
        if (color) {
            $.GetContextPanel().FindChildInLayoutFile('id-tooltip-layout-name').style.color = color;
        }
        else {
            $.GetContextPanel().FindChildInLayoutFile('id-tooltip-layout-name').style.color = 'white';
        }
        $.GetContextPanel().FindChildInLayoutFile('id-tooltip-layout-desc').visible = nameOnly === 'true';
        $.GetContextPanel().FindChildInLayoutFile('id-tooltip-layout-seperator').visible = nameOnly === 'true';
        if (nameOnly === 'true') {
            let defName = InventoryAPI.GetItemDefinitionName(id);
            defName = defName ? defName?.replace('weapon_', '') : '';
            ctx.SetDialogVariable('desc', $.Localize('#csgo_item_usage_desc_' + defName));
        }
    }
    TooltipLoadoutItem.SetupTooltip = SetupTooltip;
})(TooltipLoadoutItem || (TooltipLoadoutItem = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbHRpcF9sb2Fkb3V0X2l0ZW0uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy90b29sdGlwcy90b29sdGlwX2xvYWRvdXRfaXRlbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBQ3JDLDhDQUE4QztBQUU5QyxJQUFVLGtCQUFrQixDQXVDM0I7QUF2Q0QsV0FBVSxrQkFBa0I7SUFFeEIsU0FBZ0IsWUFBWTtRQUV4QixJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDOUIsSUFBSSxFQUFFLEdBQUcsR0FBRyxDQUFDLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUM5QyxJQUFJLFFBQVEsR0FBRyxHQUFHLENBQUMsa0JBQWtCLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3RELElBQUksSUFBSSxHQUFHLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBRSxNQUFNLEVBQUUsRUFBRSxDQUFFLENBQUM7UUFHaEQsSUFBSSxhQUFhLEdBQUcsRUFBRSxDQUFDO1FBQ3ZCLElBQUssSUFBSSxLQUFLLFFBQVEsRUFBRztZQUNyQixhQUFhLEdBQUcsUUFBUSxDQUFDLHdCQUF3QixDQUFFLEVBQUUsRUFBRSxVQUFVLENBQUUsQ0FBQztTQUN2RTtRQUNELEdBQUcsQ0FBQyxpQkFBaUIsQ0FBRSxNQUFNLEVBQUUsWUFBWSxDQUFDLFdBQVcsQ0FBRSxhQUFhLENBQUUsQ0FBRSxDQUFDO1FBRTNFLElBQUksS0FBSyxHQUFHLFlBQVksQ0FBQyxrQkFBa0IsQ0FBRSxFQUFFLENBQUUsQ0FBQztRQUVsRCxJQUFLLEtBQUssRUFDVjtZQUNJLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSx3QkFBd0IsQ0FBRSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1NBQzdGO2FBRUQ7WUFDSSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUUsd0JBQXdCLENBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQztTQUMvRjtRQUlELENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSx3QkFBd0IsQ0FBRSxDQUFDLE9BQU8sR0FBRyxRQUFRLEtBQUssTUFBTSxDQUFDO1FBQ3BHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSw2QkFBNkIsQ0FBRSxDQUFDLE9BQU8sR0FBRyxRQUFRLEtBQUssTUFBTSxDQUFDO1FBRXpHLElBQUssUUFBUSxLQUFLLE1BQU0sRUFDeEI7WUFDSSxJQUFJLE9BQU8sR0FBRyxZQUFZLENBQUMscUJBQXFCLENBQUUsRUFBRSxDQUFFLENBQUM7WUFDdkQsT0FBTyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBRSxTQUFTLEVBQUUsRUFBRSxDQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUMzRCxHQUFHLENBQUMsaUJBQWlCLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUUsd0JBQXdCLEdBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztTQUNqRjtJQUNMLENBQUM7SUFwQ2UsK0JBQVksZUFvQzNCLENBQUE7QUFDTCxDQUFDLEVBdkNTLGtCQUFrQixLQUFsQixrQkFBa0IsUUF1QzNCIn0=