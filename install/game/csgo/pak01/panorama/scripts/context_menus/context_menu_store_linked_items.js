"use strict";
/// <reference path="../itemtile_store.ts" />
var StoreLinkedItems;
(function (StoreLinkedItems) {
    function Init() {
        const itemId = $.GetContextPanel().GetAttributeString("itemids", "");
        const isNotReleased = $.GetContextPanel().GetAttributeString("is-not-released", "") === "true";
        const aItemIds = itemId.split(',');
        let elItem = null;
        for (let i = 0; i < aItemIds.length; i++) {
            elItem = $.CreatePanel("Button", $.GetContextPanel().FindChildInLayoutFile('id-store-linked-items-images'), aItemIds[i]);
            elItem.BLoadLayout('file://{resources}/layout/itemtile_store.xml', false, false);
            let oItemData = {
                id: aItemIds[i],
                isNotReleased: isNotReleased,
                isDisabled: isNotReleased
            };
            ItemTileStore.Init(elItem, oItemData);
        }
        ShowWarningText();
    }
    StoreLinkedItems.Init = Init;
    function ShowWarningText() {
        let warningText = $.GetContextPanel().GetAttributeString("linkedWarning", "");
        if (warningText) {
            $.GetContextPanel().SetHasClass('hidewarning', false);
            $.GetContextPanel().SetDialogVariable('warning', $.Localize(warningText));
        }
        else {
            $.GetContextPanel().SetHasClass('hidewarning', true);
        }
    }
})(StoreLinkedItems || (StoreLinkedItems = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dF9tZW51X3N0b3JlX2xpbmtlZF9pdGVtcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL2NvbnRleHRfbWVudXMvY29udGV4dF9tZW51X3N0b3JlX2xpbmtlZF9pdGVtcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsNkNBQTZDO0FBRTdDLElBQVUsZ0JBQWdCLENBd0N6QjtBQXhDRCxXQUFVLGdCQUFnQjtJQUV6QixTQUFnQixJQUFJO1FBRW5CLE1BQU0sTUFBTSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxTQUFTLEVBQUUsRUFBRSxDQUFFLENBQUM7UUFDdkUsTUFBTSxhQUFhLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGtCQUFrQixDQUFFLGlCQUFpQixFQUFFLEVBQUUsQ0FBRSxLQUFLLE1BQU0sQ0FBQztRQUNqRyxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBR25DLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQztRQUVsQixLQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFDekM7WUFDQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLDhCQUE4QixDQUFFLEVBQUUsUUFBUSxDQUFFLENBQUMsQ0FBRSxDQUFhLENBQUM7WUFDMUksTUFBTSxDQUFDLFdBQVcsQ0FBRSw4Q0FBOEMsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFFLENBQUM7WUFFbkYsSUFBSSxTQUFTLEdBQWdCO2dCQUM1QixFQUFFLEVBQUUsUUFBUSxDQUFFLENBQUMsQ0FBRTtnQkFDakIsYUFBYSxFQUFFLGFBQWE7Z0JBQzVCLFVBQVUsRUFBRSxhQUFhO2FBQ3pCLENBQUE7WUFDRCxhQUFhLENBQUMsSUFBSSxDQUFFLE1BQU0sRUFBRSxTQUFTLENBQUUsQ0FBQztTQUN4QztRQUVELGVBQWUsRUFBRSxDQUFDO0lBQ25CLENBQUM7SUF2QmUscUJBQUksT0F1Qm5CLENBQUE7SUFFRCxTQUFTLGVBQWU7UUFFdkIsSUFBSSxXQUFXLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGtCQUFrQixDQUFFLGVBQWUsRUFBRSxFQUFFLENBQUUsQ0FBQztRQUNoRixJQUFLLFdBQVcsRUFDaEI7WUFDQyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsV0FBVyxDQUFFLGFBQWEsRUFBRSxLQUFLLENBQUUsQ0FBQztZQUN4RCxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsaUJBQWlCLENBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUUsV0FBVyxDQUFFLENBQUMsQ0FBQztTQUM3RTthQUVEO1lBQ0MsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLFdBQVcsQ0FBRSxhQUFhLEVBQUUsSUFBSSxDQUFFLENBQUM7U0FDdkQ7SUFDRixDQUFDO0FBQ0YsQ0FBQyxFQXhDUyxnQkFBZ0IsS0FBaEIsZ0JBQWdCLFFBd0N6QiJ9