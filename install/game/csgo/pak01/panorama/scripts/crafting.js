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
        // Set initial selection
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
        $.DispatchEvent('SetInventoryFilter', $('#Crafting-Items'), 'inv_group_equipment', 'any', 'any', sortType, 'recipe,is_rental:false,is_sealed:false', // items that can go in crafting
        '' // text filter
        );
    }
    Crafting.UpdateItemList = UpdateItemList;
    function _UpdateCraftingPanelDisplay() {
        UpdateButtons();
        // update item list panels
        {
            UpdateItemList();
            $.DispatchEvent('SetInventoryFilter', $('#Crafting-Ingredients'), 'inv_group_equipment', 'any', 'any', '', 'ingredient', // current ingredient items
            '' // text filter
            );
        }
        // update text
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
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        _Init();
        $.RegisterForUnhandledEvent('UpdateTradeUpPanel', _UpdateCraftingPanelDisplay);
        $.RegisterForUnhandledEvent('PanoramaComponent_Inventory_CraftIngredientAdded', _UpdateCraftingPanelDisplay);
        $.RegisterForUnhandledEvent('PanoramaComponent_Inventory_CraftIngredientRemoved', _UpdateCraftingPanelDisplay);
    }
})(Crafting || (Crafting = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JhZnRpbmcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9jcmFmdGluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBRWxDLElBQVUsUUFBUSxDQXNJakI7QUF0SUQsV0FBVSxRQUFRO0lBRWpCLFNBQVMsS0FBSztRQUViLFFBQVEsRUFBRSxDQUFDO0lBQ1osQ0FBQztJQUVELFNBQVMsUUFBUTtRQUVoQixJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUUsc0JBQXNCLENBQWdCLENBQUM7UUFDbkcsSUFBSSxLQUFLLEdBQUcsWUFBWSxDQUFDLG1CQUFtQixFQUFFLENBQUM7UUFFL0MsS0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFDL0I7WUFDQyxJQUFJLElBQUksR0FBRyxZQUFZLENBQUMsb0JBQW9CLENBQUUsQ0FBQyxDQUFFLENBQUM7WUFDbEQsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRTtnQkFDeEQsS0FBSyxFQUFFLGNBQWM7YUFDckIsQ0FBRSxDQUFDO1lBRUosUUFBUSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFFLEdBQUcsR0FBRyxJQUFJLENBQUUsQ0FBQztZQUN6QyxVQUFVLENBQUMsU0FBUyxDQUFFLFFBQVEsQ0FBRSxDQUFDO1NBQ2pDO1FBRUQsd0JBQXdCO1FBQ3hCLFVBQVUsQ0FBQyxXQUFXLENBQUUsWUFBWSxDQUFDLG9CQUFvQixDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7SUFDbEUsQ0FBQztJQUVELFNBQWdCLHVCQUF1QjtRQUV0QyxJQUFJLG1CQUFtQixHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxpQkFBaUIsQ0FB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