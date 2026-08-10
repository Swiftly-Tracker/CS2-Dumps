"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../common/iteminfo.ts" />
var SelectInventoryItem;
(function (SelectInventoryItem) {
    const m_ItemList = $('#ItemList');
    const m_SortDropdown = $("#SortDropdown");
    const m_SearchText = $("#Search");
    const m_ItemImage = $("#SelectItemImage");
    let m_InvFilter = '';
    let m_AssociatedItemId = '';
    function Init() {
        $.DispatchEvent('CSGOPlaySoundEffect', 'tab_mainmenu_inventory', 'MOUSE');
        m_InvFilter = $.GetContextPanel().GetAttributeString('filter_category', 'all');
        m_AssociatedItemId = $.GetContextPanel().GetAttributeString('associated_item', '');
        if (m_AssociatedItemId !== '') {
            $.GetContextPanel().SetDialogVariable('item_name', InventoryAPI.GetItemNameUncustomized(m_AssociatedItemId));
            m_ItemImage.itemid = m_AssociatedItemId;
        }
        const sortMethods = InventoryAPI.GetSortMethodsCount();
        for (let i = 0; i < sortMethods; i++) {
            let sort = InventoryAPI.GetSortMethodByIndex(i);
            let newEntry = $.CreatePanel('Label', m_SortDropdown.GetParent(), sort, {
                class: 'DropDownMenu'
            });
            newEntry.text = $.Localize('#' + sort);
            m_SortDropdown.AddOption(newEntry);
        }
        m_SortDropdown.SetSelected("inv_sort_age");
        m_SortDropdown.SetPanelEvent('oninputsubmit', UpdatePopup);
        m_SearchText.RaiseChangeEvents(true);
        m_SearchText.SetPanelEvent('ontextentrychange', UpdatePopup);
        UpdatePopup();
    }
    SelectInventoryItem.Init = Init;
    function UpdatePopup() {
        $.DispatchEvent('SetInventoryFilter', m_ItemList, "any", "any", "any", m_SortDropdown.GetSelected() ? m_SortDropdown.GetSelected().id : 'inv_sort_age', m_InvFilter, m_SearchText.text);
    }
    SelectInventoryItem.UpdatePopup = UpdatePopup;
    function ClosePopUp() {
        $.DispatchEvent('CSGOPlaySoundEffect', 'inventory_inspect_close', 'MOUSE');
        $.DispatchEvent('UIPopupButtonClicked', '');
    }
    SelectInventoryItem.ClosePopUp = ClosePopUp;
    function OnItemTileActivated(panel, itemid) {
        $.DispatchEvent('UIPopupButtonClicked', 'OnInventoryItemSelected(' + itemid + ')');
    }
    SelectInventoryItem.OnItemTileActivated = OnItemTileActivated;
    {
        $.RegisterForUnhandledEvent("OnItemTileActivated", OnItemTileActivated);
    }
})(SelectInventoryItem || (SelectInventoryItem = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfc2VsZWN0X2ludmVudG9yeV9pdGVtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvcG9wdXBzL3BvcHVwX3NlbGVjdF9pbnZlbnRvcnlfaXRlbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBQ3JDLDhDQUE4QztBQUU5QyxJQUFVLG1CQUFtQixDQXdFNUI7QUF4RUQsV0FBVSxtQkFBbUI7SUFFekIsTUFBTSxVQUFVLEdBQXlCLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUN4RCxNQUFNLGNBQWMsR0FBZ0IsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDO0lBQ3ZELE1BQU0sWUFBWSxHQUFpQixDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDaEQsTUFBTSxXQUFXLEdBQWlCLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0lBRXhELElBQUksV0FBVyxHQUFZLEVBQUUsQ0FBQztJQUM5QixJQUFJLGtCQUFrQixHQUFZLEVBQUUsQ0FBQztJQUV4QyxTQUFnQixJQUFJO1FBRW5CLENBQUMsQ0FBQyxhQUFhLENBQUUscUJBQXFCLEVBQUUsd0JBQXdCLEVBQUUsT0FBTyxDQUFFLENBQUM7UUFFdEUsV0FBVyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxpQkFBaUIsRUFBRSxLQUFLLENBQUUsQ0FBRTtRQUNsRixrQkFBa0IsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsa0JBQWtCLENBQUUsaUJBQWlCLEVBQUUsRUFBRSxDQUFFLENBQUU7UUFHdEYsSUFBSyxrQkFBa0IsS0FBSyxFQUFFLEVBQzlCO1lBQ0YsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGlCQUFpQixDQUFFLFdBQVcsRUFBRSxZQUFZLENBQUMsdUJBQXVCLENBQUUsa0JBQWtCLENBQUUsQ0FBRSxDQUFDO1lBQzNHLFdBQVcsQ0FBQyxNQUFNLEdBQUcsa0JBQWtCLENBQUM7U0FDM0M7UUFLRCxNQUFNLFdBQVcsR0FBRyxZQUFZLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztRQUN2RCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsV0FBVyxFQUFFLENBQUMsRUFBRSxFQUNwQztZQUNJLElBQUksSUFBSSxHQUFXLFlBQVksQ0FBQyxvQkFBb0IsQ0FBRSxDQUFDLENBQUUsQ0FBQztZQUMxRCxJQUFJLFFBQVEsR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFFLE9BQU8sRUFBRSxjQUFjLENBQUMsU0FBUyxFQUFFLEVBQUUsSUFBSSxFQUFFO2dCQUNyRSxLQUFLLEVBQUUsY0FBYzthQUN4QixDQUFFLENBQUM7WUFFSixRQUFRLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUUsR0FBRyxHQUFHLElBQUksQ0FBRSxDQUFDO1lBQ3pDLGNBQWMsQ0FBQyxTQUFTLENBQUUsUUFBUSxDQUFFLENBQUM7U0FDeEM7UUFDRCxjQUFjLENBQUMsV0FBVyxDQUFFLGNBQWMsQ0FBRSxDQUFDO1FBQzdDLGNBQWMsQ0FBQyxhQUFhLENBQUUsZUFBZSxFQUFFLFdBQVcsQ0FBRSxDQUFDO1FBRTdELFlBQVksQ0FBQyxpQkFBaUIsQ0FBRSxJQUFJLENBQUUsQ0FBQztRQUN2QyxZQUFZLENBQUMsYUFBYSxDQUFFLG1CQUFtQixFQUFFLFdBQVcsQ0FBRSxDQUFDO1FBRXJFLFdBQVcsRUFBRSxDQUFDO0lBQ2YsQ0FBQztJQW5DZSx3QkFBSSxPQW1DbkIsQ0FBQTtJQUVFLFNBQWdCLFdBQVc7UUFFdkIsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxvQkFBb0IsRUFDaEMsVUFBVSxFQUNWLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUNuQixjQUFjLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLGNBQWMsRUFDL0UsV0FBVyxFQUNYLFlBQVksQ0FBQyxJQUFJLENBQUUsQ0FBQztJQUM1QixDQUFDO0lBUmUsK0JBQVcsY0FRMUIsQ0FBQTtJQUVKLFNBQWdCLFVBQVU7UUFFekIsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxxQkFBcUIsRUFBRSx5QkFBeUIsRUFBRSxPQUFPLENBQUUsQ0FBQztRQUM3RSxDQUFDLENBQUMsYUFBYSxDQUFFLHNCQUFzQixFQUFFLEVBQUUsQ0FBRSxDQUFDO0lBQy9DLENBQUM7SUFKZSw4QkFBVSxhQUl6QixDQUFBO0lBRUUsU0FBZ0IsbUJBQW1CLENBQUUsS0FBZSxFQUFFLE1BQWU7UUFFdkUsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxzQkFBc0IsRUFBRSwwQkFBMEIsR0FBQyxNQUFNLEdBQUMsR0FBRyxDQUFFLENBQUM7SUFDL0UsQ0FBQztJQUhlLHVDQUFtQixzQkFHbEMsQ0FBQTtJQUdKO1FBQ0MsQ0FBQyxDQUFDLHlCQUF5QixDQUFFLHFCQUFxQixFQUFFLG1CQUFtQixDQUFFLENBQUM7S0FDMUU7QUFDRixDQUFDLEVBeEVTLG1CQUFtQixLQUFuQixtQkFBbUIsUUF3RTVCIn0=