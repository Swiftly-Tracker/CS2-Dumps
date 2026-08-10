"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../common/item_context_entries.ts" />
var ItemContextMenu;
(function (ItemContextMenu) {
    function SetupContextMenu() {
        let id = $.GetContextPanel().GetAttributeString("itemid", "(not found)");
        let populateFilterText = $.GetContextPanel().GetAttributeString("populatefiltertext", "(not found)");
        InventoryAPI.PrecacheCustomMaterials(id);
        _PopulateContextMenu(id, populateFilterText);
    }
    ItemContextMenu.SetupContextMenu = SetupContextMenu;
    function _PopulateContextMenu(id, populateFilterText) {
        let elParent = $.GetContextPanel();
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
        if (!validEntries.length) {
            let elButton = $.CreatePanel('Button', elParent, 'ContextMenuItem');
            let elLabel = $.CreatePanel('Label', elButton, '', { html: 'true' });
            elLabel.text = '#inv_context_no_valid_actions';
            elButton.SetPanelEvent('onactivate', () => $.DispatchEvent('ContextMenuEvent', ''));
        }
    }
})(ItemContextMenu || (ItemContextMenu = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dF9tZW51X2ludmVudG9yeV9pdGVtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvY29udGV4dF9tZW51cy9jb250ZXh0X21lbnVfaW52ZW50b3J5X2l0ZW0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQywwREFBMEQ7QUFFMUQsSUFBVSxlQUFlLENBOEZ4QjtBQTlGRCxXQUFVLGVBQWU7SUFFeEIsU0FBZ0IsZ0JBQWdCO1FBRS9CLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxRQUFRLEVBQUUsYUFBYSxDQUFFLENBQUM7UUFDM0UsSUFBSSxrQkFBa0IsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsa0JBQWtCLENBQUUsb0JBQW9CLEVBQUUsYUFBYSxDQUFFLENBQUM7UUFNdkcsWUFBWSxDQUFDLHVCQUF1QixDQUFFLEVBQUUsQ0FBRSxDQUFDO1FBRTNDLG9CQUFvQixDQUFFLEVBQUUsRUFBRSxrQkFBa0IsQ0FBRSxDQUFDO0lBQ2hELENBQUM7SUFaZSxnQ0FBZ0IsbUJBWS9CLENBQUE7SUFFRCxTQUFTLG9CQUFvQixDQUFHLEVBQVUsRUFBRSxrQkFBMEI7UUFFckUsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBTW5DLElBQUksWUFBWSxHQUFHLGtCQUFrQixDQUFDLGFBQWEsQ0FBRSxFQUFFLEVBQUUsa0JBQWtCLENBQUUsQ0FBQztRQUU5RSxTQUFTLFdBQVcsQ0FBRSxRQUFnQixFQUFFLFdBQW1CO1lBRTFELFlBQVksQ0FBQyxlQUFlLENBQUUsUUFBUSxFQUFFLFdBQVcsQ0FBRSxDQUFDO1FBQ3ZELENBQUM7UUFFRCxJQUFJLGdCQUFnQixHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxrQkFBa0IsRUFBRSxF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