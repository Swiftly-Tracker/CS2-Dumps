"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../common/item_context_entries.ts" />
var ItemContextMenu;
(function (ItemContextMenu) {
    function SetupContextMenu() {
        let id = $.GetContextPanel().GetAttributeString("itemid", "(not found)");
        let populateFilterText = $.GetContextPanel().GetAttributeString("populatefiltertext", "(not found)");
        $.Msg('Item context Menu for: ' + id);
        $.Msg('Item context type: ' + populateFilterText);
        // Precache custom materials in case item will be inspected - avoids delay in seeing custom materials on item
        InventoryAPI.PrecacheCustomMaterials(id);
        _PopulateContextMenu(id, populateFilterText);
    }
    ItemContextMenu.SetupContextMenu = SetupContextMenu;
    function _PopulateContextMenu(id, populateFilterText) {
        let elParent = $.GetContextPanel();
        //--------------------------------------------------------------------------------------------------
        // Uses item-context-entires.js to get the valid contexts for an item id
        // FilterEntries is an object is that script
        //--------------------------------------------------------------------------------------------------
        let validEntries = ItemContextEntries.FilterEntries(id, populateFilterText);
        function OnMouseOver(location, displayText) {
            UiToolkitAPI.ShowTextTooltip(location, displayText);
        }
        let contextmenuparam = $.GetContextPanel().GetAttributeString('contextmenuparam', '');
        for (let i = 0; i < validEntries.length; i++) {
            const entry = validEntries[i];
            let elButton = $.CreatePanel('Button', elParent, 'ContextMenuItem' + i);
            let elLabel = $.CreatePanel('Label', elButton, '', { html: 'true' });
            let displayName = '';
            if (entry.name instanceof Function) {
                displayName = entry.name(id);
            }
            else {
                displayName = entry.name;
            }
            elLabel.text = '#inv_context_' + displayName;
            if (entry.style) {
                let strStyleToAdd = entry.style(id);
                if (strStyleToAdd !== '') {
                    if (strStyleToAdd === 'BottomSeparator' && i !== (validEntries.length - 1) ||
                        strStyleToAdd === 'TopSeparator' && i !== 0) {
                        elButton.AddClass(strStyleToAdd);
                    }
                }
            }
            let handler = entry.OnSelected;
            elButton.SetPanelEvent('onactivate', () => {
                $.DispatchEvent('CSGOPlaySoundEffect', 'inventory_item_popupSelect', 'MOUSE');
                handler(id, contextmenuparam);
            });
            if (entry.CustomName) {
                if (entry.CustomName(id) !== '') {
                    let buttonId = elButton.id;
                    let customName = entry.CustomName(id);
                    elButton.SetPanelEvent('onmouseover', () => OnMouseOver(buttonId, customName));
                    elButton.SetPanelEvent('onmouseout', () => UiToolkitAPI.HideTextTooltip());
                }
            }
        }
        // if the context menu is empty then close it.
        if (!validEntries.length) {
            let elButton = $.CreatePanel('Button', elParent, 'ContextMenuItem');
            let elLabel = $.CreatePanel('Label', elButton, '', { html: 'true' });
            elLabel.text = '#inv_context_no_valid_actions';
            elButton.SetPanelEvent('onactivate', () => $.DispatchEvent('ContextMenuEvent', ''));
        }
    }
})(ItemContextMenu || (ItemContextMenu = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dF9tZW51X2ludmVudG9yeV9pdGVtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvY29udGV4dF9tZW51cy9jb250ZXh0X21lbnVfaW52ZW50b3J5X2l0ZW0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQywwREFBMEQ7QUFFMUQsSUFBVSxlQUFlLENBOEZ4QjtBQTlGRCxXQUFVLGVBQWU7SUFFeEIsU0FBZ0IsZ0JBQWdCO1FBRS9CLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxRQUFRLEVBQUUsYUFBYSxDQUFFLENBQUM7UUFDM0UsSUFBSSxrQkFBa0IsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsa0JBQWtCLENBQUUsb0JBQW9CLEVBQUUsYUFBYSxDQUFFLENBQUM7UUFFdkcsQ0FBQyxDQUFDLEdBQUcsQ0FBRSx5QkFBeUIsR0FBRyxFQUFFLENBQUUsQ0FBQztRQUN4QyxDQUFDLENBQUMsR0FBRyxDQUFFLHFCQUFxQixHQUFHLGtCQUFrQixDQUFFLENBQUM7UUFFcEQsNkdBQTZHO1FBQzdHLFlBQVksQ0FBQyx1QkFBdUIsQ0FBRSxFQUFFLENBQUUsQ0FBQztRQUUzQyxvQkFBb0IsQ0FBRSxFQUFFLEVBQUUsa0JBQWtCLENBQUUsQ0FBQztJQUNoRCxDQUFDO0lBWmUsZ0NBQWdCLG1CQVkvQixDQUFBO0lBRUQsU0FBUyxvQkFBb0IsQ0FBRyxFQUFVLEVBQUUsa0JBQTBCO1FBRXJFLElBQUksUUFBUSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUVuQyxvR0FBb0c7UUFDcEcsd0VBQXdFO1FBQ3hFLDRDQUE0QztRQUM1QyxvR0FBb0c7UUFDcEcsSUFBSSxZQUFZLEdBQUcsa0JBQWtCLENBQUMsYUFBYSxDQUFFLEVBQUUsRUFBRSxrQkFBa0IsQ0FBRSxDQUFD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