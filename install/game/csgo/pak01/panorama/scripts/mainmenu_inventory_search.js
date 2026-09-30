"use strict";
/// <reference path="csgo.d.ts" />
var InventorySearch;
(function (InventorySearch) {
    let m_elList = null;
    let m_elSearchPanel = $.GetContextPanel();
    let m_elSuggestedPanel = null;
    let m_InventoryUpdatedHandler = null;
    function _Init() {
        _RegisterForInventoryUpdate();
        let elTextEntry = m_elSearchPanel.FindChildInLayoutFile('InvSearchTextEntry');
        elTextEntry.SetPanelEvent('ontextentrychange', UpdateItemList);
        _PopulateSuggested(m_elSearchPanel.FindChildInLayoutFile('InvSearchSuggestionsList'));
        _TextEntrySettings.SetTextEntryPanel(elTextEntry);
        m_elSuggestedPanel = m_elSearchPanel.FindChildInLayoutFile('InvSearchSuggestions');
        m_elList = m_elSearchPanel.FindChildInLayoutFile('InvSearchPanel-List');
        _AddSortDropdownEntries();
        UpdateItemList();
    }
    function _RegisterForInventoryUpdate() {
        m_InventoryUpdatedHandler = $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', UpdateItemList);
        m_elSearchPanel.RegisterForReadyEvents(true);
        $.RegisterEventHandler('ReadyForDisplay', m_elSearchPanel, () => {
            if (!m_InventoryUpdatedHandler) {
                m_InventoryUpdatedHandler = $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', UpdateItemList);
            }
        });
        $.RegisterEventHandler('UnreadyForDisplay', m_elSearchPanel, () => {
            if (m_InventoryUpdatedHandler) {
                $.UnregisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', m_InventoryUpdatedHandler);
                m_InventoryUpdatedHandler = null;
            }
        });
    }
    function UpdateItemList() {
        if (!m_elList) {
            return;
        }
        let filterString = _TextEntrySettings.GetText();
        if (filterString === '') {
            _ShowHideSuggestedPanel(true);
        }
        else {
            let sortText = m_elSearchPanel.FindChildInLayoutFile('InvSortDropdown').GetSelected().id;
            $.DispatchEvent('SetInventoryFilter', m_elList, 'any', 'any', 'any', sortText, '', filterString);
            _ShowHideSuggestedPanel(m_elList.count < 1);
        }
    }
    InventorySearch.UpdateItemList = UpdateItemList;
    let _TextEntrySettings;
    (function (_TextEntrySettings) {
        let elTextEntry = null;
        function SetTextEntryPanel(elPanel) {
            elTextEntry = elPanel;
        }
        _TextEntrySettings.SetTextEntryPanel = SetTextEntryPanel;
        function UpdateText(selectedEntryText) {
            elTextEntry.text = selectedEntryText;
        }
        _TextEntrySettings.UpdateText = UpdateText;
        function GetText() {
            return elTextEntry ? elTextEntry.text : '';
        }
        _TextEntrySettings.GetText = GetText;
    })(_TextEntrySettings || (_TextEntrySettings = {}));
    function _PopulateSuggested(elSearchResults) {
        let settings = {
            0: ['inv_sort_rarity', 'melee'],
            1: ['inv_sort_age', 'not_equipment'],
            2: ['inv_sort_rarity', 'rifle'],
            3: ['inv_sort_age', 'flair0'],
            4: ['inv_sort_rarity', 'smg'],
            5: ['inv_sort_age', 'spray'],
            6: ['inv_sort_rarity', 'secondary']
        };
        let delay = 0.25;
        let count = 0;
        for (let entry of Object.values(settings)) {
            count++;
            let sortType = entry[0];
            let searchText = entry[1];
            $.Schedule(count * delay, () => {
                let id = _GetSuggested(sortType, searchText);
                if (id !== '')
                    _AddSuggestedEntry(id, elSearchResults);
            });
        }
    }
    function _GetSuggested(sortType, searchText) {
        InventoryAPI.SetInventorySortAndFilters(sortType, false, searchText, '', '');
        let count = InventoryAPI.GetInventoryCount();
        let itemsList = [];
        let itemsValid = 0;
        let itemsNeedToCollect = 5;
        for (let i = 0; i < count; i++) {
            let itemId = InventoryAPI.GetInventoryItemIDByIndex(i);
            itemsValid++;
            itemsList.push(itemId);
            if (itemsValid > itemsNeedToCollect)
                break;
        }
        let countValidItems = itemsList.length;
        if (countValidItems > 0) {
            let index = countValidItems > itemsNeedToCollect ?
                Math.floor(Math.random() * itemsNeedToCollect) :
                Math.floor(Math.random() * countValidItems);
            return itemsList[index];
        }
        return '';
    }
    function _AddSuggestedEntry(id, elSearchResults) {
        let elEntry = $.CreatePanel('Panel', elSearchResults, id);
        elEntry.BLoadLayoutSnippet('SuggestedEntry');
        let itemName = InventoryAPI.GetItemName(id);
        elEntry.SetPanelEvent('onactivate', () => {
            _TextEntrySettings.UpdateText(itemName);
        });
        elEntry.SetDialogVariable('suggestion_text', itemName);
        let elImage = elEntry.FindChildInLayoutFile('SuggestedImage');
        elImage.itemid = id;
        let elPanel = elEntry.FindChildInLayoutFile('SuggestedRarity');
        elPanel.style.washColor = InventoryAPI.GetItemRarityColor(id);
    }
    function _ShowHideSuggestedPanel(bShow) {
        m_elSuggestedPanel.SetHasClass('collapse', !bShow);
        m_elList.SetHasClass('hide', bShow);
    }
    function _AddSortDropdownEntries() {
        let elDropdown = m_elSearchPanel.FindChildInLayoutFile('InvSortDropdown');
        elDropdown.SetPanelEvent('oninputsubmit', UpdateItemList);
        let count = InventoryAPI.GetSortMethodsCount();
        for (let i = 0; i < count; i++) {
            let sort = InventoryAPI.GetSortMethodByIndex(i);
            let newEntry = $.CreatePanel('Label', elDropdown, sort, {
                class: 'DropDownMenu'
            });
            newEntry.text = $.Localize('#' + sort);
            elDropdown.AddOption(newEntry);
        }
        elDropdown.SetSelected(InventoryAPI.GetSortMethodByIndex(0));
    }
    {
        _Init();
    }
})(InventorySearch || (InventorySearch = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbm1lbnVfaW52ZW50b3J5X3NlYXJjaC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL21haW5tZW51X2ludmVudG9yeV9zZWFyY2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUVsQyxJQUFVLGVBQWUsQ0FvTnhCO0FBcE5ELFdBQVUsZUFBZTtJQUV4QixJQUFJLFFBQVEsR0FBK0IsSUFBSSxDQUFDO0lBQ2hELElBQUksZUFBZSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztJQUMxQyxJQUFJLGtCQUFrQixHQUFtQixJQUFJLENBQUM7SUFDOUMsSUFBSSx5QkFBeUIsR0FBa0IsSUFBSSxDQUFDO0lBRXBELFNBQVMsS0FBSztRQUViLDJCQUEyQixFQUFFLENBQUM7UUFFOUIsSUFBSSxXQUFXLEdBQUcsZUFBZSxDQUFDLHFCQUFxQixDQUFFLG9CQUFvQixDQUFpQixDQUFDO1FBQy9GLFdBQVcsQ0FBQyxhQUFhLENBQUUsbUJBQW1CLEVBQUUsY0FBYyxDQUFFLENBQUM7UUFFakUsa0JBQWtCLENBQUUsZUFBZSxDQUFDLHFCQUFxQixDQUFFLDBCQUEwQixDQUFFLENBQUUsQ0FBQztRQUMxRixrQkFBa0IsQ0FBQyxpQkFBaUIsQ0FBRSxXQUFXLENBQUUsQ0FBQztRQUVwRCxrQkFBa0IsR0FBRyxlQUFlLENBQUMscUJBQXFCLENBQUUsc0JBQXNCLENBQUUsQ0FBQztRQUNyRixRQUFRLEdBQUcsZUFBZSxDQUFDLHFCQUFxQixDQUFFLHFCQUFxQixDQUF5QixDQUFDO1FBRWpHLHVCQUF1QixFQUFFLENBQUM7UUFDMUIsY0FBYyxFQUFFLENBQUM7SUFDbEIsQ0FBQztJQUVELFNBQVMsMkJBQTJCO1FBRW5DLHlCQUF5QixHQUFHLENBQUMsQ0FBQyx5QkFBeUIsQ0FBRSw4Q0FBOEMsRUFBRSxjQUFjLENBQUUsQ0FBQztRQUMxSCxlQUFlLENBQUMs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