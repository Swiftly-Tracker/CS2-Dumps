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
        // name
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
        // description
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbHRpcF9sb2Fkb3V0X2l0ZW0uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy90b29sdGlwcy90b29sdGlwX2xvYWRvdXRfaXRlbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBQ3JDLDhDQUE4QztBQUU5QyxJQUFVLGtCQUFrQixDQXVDM0I7QUF2Q0QsV0FBVSxrQkFBa0I7SUFFeEIsU0FBZ0IsWUFBWTtRQUV4QixJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDOUIsSUFBSSxFQUFFLEdBQUcsR0FBRyxDQUFDLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUM5QyxJQUFJLFFBQVEsR0FBRyxHQUFHLENBQUMsa0JBQWtCLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3RELElBQUksSUFBSSxHQUFHLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBRSxNQUFNLEVBQUUsRUFBRSxDQUFFLENBQUM7UUFFaEQsT0FBTztRQUNQLElBQUksYUFBYSxHQUFHLEVBQUUsQ0FBQztRQUN2QixJQUFLLElBQUksS0FBSyxRQUFRLEVBQUc7WUFDckIsYUFBYSxHQUFHLFFBQVEsQ0FBQyx3QkFBd0IsQ0FBRSxFQUFFLEVBQUUsVUFBVSxDQUFFLENBQUM7U0FDdkU7UUFDRCxHQUFHLENBQUMsaUJBQWlCLENBQUUsTUFBTSxFQUFFLFlBQVksQ0FBQyxXQUFXLENBQUUsYUFBYSxDQUFFLENBQUUsQ0FBQztRQUUzRSxJQUFJLEtBQUssR0FBRyxZQUFZLENBQUMsa0JBQWtCLENBQUUsRUFBRSxDQUFFLENBQUM7UUFFbEQsSUFBSyxLQUFLLEVBQ1Y7WUFDSSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUUsd0JBQXdCLENBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztTQUM3RjthQUVEO1lBQ0ksQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLHdCQUF3QixDQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUM7U0FDL0Y7UUFFRCxjQUFjO1FBRWQsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLHdCQUF3QixDQUFFLENBQUMsT0FBTyxHQUFHLFFBQVEsS0FBSyxNQUFNLENBQUM7UUFDcEcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLDZCQUE2QixDQUFFLENBQUMsT0FBTyxHQUFHLFFBQVEsS0FBSyxNQUFNLENBQUM7UUFFekcsSUFBSyxRQUFRLEtBQUssTUFBTSxFQUN4QjtZQUNJLElBQUksT0FBTyxHQUFHLFlBQVksQ0FBQyxxQkFBcUIsQ0FBRSxFQUFFLENBQUUsQ0FBQztZQUN2RCxPQUFPLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFFLFNBQVMsRUFBRSxFQUFFLENBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBQzNELEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBRSx3QkFBd0IsR0FBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO1NBQ2pGO0lBQ0wsQ0FBQztJQXBDZSwrQkFBWSxlQW9DM0IsQ0FBQTtBQUNMLENBQUMsRUF2Q1Msa0JBQWtCLEtBQWxCLGtCQUFrQixRQXVDM0IifQ==