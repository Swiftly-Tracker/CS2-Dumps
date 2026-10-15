"use strict";
/// <reference path="csgo.d.ts" />
var Crafting;
(function (Crafting) {
    function _Init() {
        _AddSort();
    }
    function _AddSort() {
        let elDropdown = $.GetContextPanel().FindChildInLayoutFile('CraftingSortDropdown');
        let count = InventoryAPI.GetSortMethodsCount();
        for (let i = 0; i < count; i++) {
            let sort = InventoryAPI.GetSortMethodByIndex(i);
            let newEntry = $.CreatePanel('Label', elDropdown, sort, {
                class: 'DropDownMenu'
            });
            newEntry.text = $.Localize('#' + sort);
            elDropdown.AddOption(newEntry);
        }
        elDropdown.SetSelected(InventoryAPI.GetSortMethodByIndex(1));
    }
    function OnReadyToTradeUpClicked() {
        let elTradeUpConfirmBtn = $.GetContextPanel().FindChildTraverse('TradeUpConfirmBtn');
        if (elTradeUpConfirmBtn.checked) {
            InventoryAPI.SetInventorySortAndFilters('inv_sort_age', false, 'ingredient,item_quality:tournament', '', '');
            const count = InventoryAPI.GetInventoryCount();
            if (count > 0) {
                elTradeUpConfirmBtn.SetDialogVariableInt('count', count);
                UiToolkitAPI.ShowGenericPopupOkCancelBgStyle('#CSGO_Recipe_TradeUp', $.Localize('#CSGO_Recipe_TradeUp_Souvenirs:f', elTradeUpConfirmBtn), '', () => UpdateButtons(), () => { if (elTradeUpConfirmBtn && elTradeUpConfirmBtn.IsValid()) {
                    elTradeUpConfirmBtn.checked = false;
                    UpdateButtons();
                } }, '');
                return;
            }
        }
        UpdateButtons();
    }
    Crafting.OnReadyToTradeUpClicked = OnReadyToTradeUpClicked;
    function UpdateButtons() {
        let elTradeUpConfirmBtn = $.GetContextPanel().FindChildTraverse('TradeUpConfirmBtn');
        elTradeUpConfirmBtn.enabled = InventoryAPI.IsCraftReady();
        if (!elTradeUpConfirmBtn.enabled) {
            elTradeUpConfirmBtn.checked = false;
        }
        let elClearIngredientsBtn = $.GetContextPanel().FindChildTraverse('ClearIngredientsBtn');
        elClearIngredientsBtn.enabled = InventoryAPI.GetCraftIngredientCount() > 0;
        let elCraftItemBtn = $.GetContextPanel().FindChildTraverse('CraftItemBtn');
        elCraftItemBtn.enabled = elTradeUpConfirmBtn.checked;
    }
    Crafting.UpdateButtons = UpdateButtons;
    function UpdateItemList() {
        let elDropdown = $.GetContextPanel().FindChildInLayoutFile('CraftingSortDropdown');
        let sortType = elDropdown.GetSelected().id;
        $.DispatchEvent('SetInventoryFilter', $('#Crafting-Items'), 'inv_group_equipment', 'any', 'any', sortType, 'recipe,is_rental:false,is_sealed:false', '');
    }
    Crafting.UpdateItemList = UpdateItemList;
    function _UpdateCraftingPanelDisplay() {
        UpdateButtons();
        {
            UpdateItemList();
            $.DispatchEvent('SetInventoryFilter', $('#Crafting-Ingredients'), 'inv_group_equipment', 'any', 'any', '', 'ingredient', '');
        }
        {
            function _UpdateItemCount(ItemListName, LabelName, nRecipeCount) {
                let elItemList = $.GetContextPanel().FindChildTraverse(ItemListName);
                let elLabel = $.GetContextPanel().FindChildTraverse(LabelName);
                elLabel.SetDialogVariableInt('count', elItemList.count);
                if (nRecipeCount >= 0) {
                    elLabel.SetDialogVariableInt('recipecount', nRecipeCount);
                    elLabel.text = $.Localize((nRecipeCount > 0) ? '#CSGO_Recipe_TradeUp_Items_XofY:f' : '#CSGO_Recipe_TradeUp_Items_NoSelection', elLabel);
                }
            }
            _UpdateItemCount('Crafting-Items', 'CraftingItemsText', -1);
            let numRequiredToCraft = InventoryAPI.GetCraftIngredientsRequired();
            _UpdateItemCount('Crafting-Ingredients', 'CraftingIngredientsText', numRequiredToCraft);
        }
    }
    {
        _Init();
        $.RegisterForUnhandledEvent('UpdateTradeUpPanel', _UpdateCraftingPanelDisplay);
        $.RegisterForUnhandledEvent('PanoramaComponent_Inventory_CraftIngredientAdded', _UpdateCraftingPanelDisplay);
        $.RegisterForUnhandledEvent('PanoramaComponent_Inventory_CraftIngredientRemoved', _UpdateCraftingPanelDisplay);
    }
})(Crafting || (Crafting = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JhZnRpbmcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9jcmFmdGluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBRWxDLElBQVUsUUFBUSxDQXNJakI7QUF0SUQsV0FBVSxRQUFRO0lBRWpCLFNBQVMsS0FBSztRQUViLFFBQVEsRUFBRSxDQUFDO0lBQ1osQ0FBQztJQUVELFNBQVMsUUFBUTtRQUVoQixJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUUsc0JBQXNCLENBQWdCLENBQUM7UUFDbkcsSUFBSSxLQUFLLEdBQUcsWUFBWSxDQUFDLG1CQUFtQixFQUFFLENBQUM7UUFFL0MsS0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFDL0I7WUFDQyxJQUFJLElBQUksR0FBRyxZQUFZLENBQUMsb0JBQW9CLENBQUUsQ0FBQyxDQUFFLENBQUM7WUFDbEQsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRTtnQkFDeEQsS0FBSyxFQUFFLGNBQWM7YUFDckIsQ0FBRSxDQUFDO1lBRUosUUFBUSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFFLEdBQUcsR0FBRyxJQUFJLENBQUUsQ0FBQztZQUN6QyxVQUFVLENBQUMsU0FBUyxDQUFFLFFBQVEsQ0FBRSxDQUFDO1NBQ2pDO1FBR0QsVUFBVSxDQUFDLFdBQVcsQ0FBRSxZQUFZLENBQUMsb0JBQW9CLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQztJQUNsRSxDQUFDO0lBRUQsU0FBZ0IsdUJBQXVCO1FBRXRDLElBQUksbUJBQW1CLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGlCQUFpQixDQUFFLG1CQUFtQixDQUFF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