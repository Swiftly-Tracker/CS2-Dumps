"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="popup_capability_header.ts" />
/// <reference path="popup_inspect_action-bar.ts" />
/// <reference path="popup_inspect_shared.ts" />
/// <reference path="../common/iteminfo.ts" />
/// <reference path="../inspect.ts" />
var SelectItemForCapability;
(function (SelectItemForCapability) {
    let _m_cp = $.GetContextPanel();
    let _m_elItemList = _m_cp.FindChildInLayoutFile('id-popup-select-item-list');
    SelectItemForCapability.oCapabilityInfo = {
        capability: '',
        initialItemId: '',
        popupVisible: false,
        bWorkshopItemPreview: false,
        bIsMultiSelect: false
    };
    function Init() {
        SelectItemForCapability.oCapabilityInfo.initialItemId = _m_cp.GetAttributeString('itemid', '');
        SelectItemForCapability.oCapabilityInfo.secondaryItemId = _m_cp.GetAttributeString('secondaryItemid', '');
        SelectItemForCapability.oCapabilityInfo.bWorkshopItemPreview = _m_cp.GetAttributeString("bWorkshopItemPreview", 'false') === 'true' ? true : false;
        SelectItemForCapability.oCapabilityInfo.capability = _m_cp.GetAttributeString("capability", '');
        SelectItemForCapability.oCapabilityInfo.bIsMultiSelect = (SelectItemForCapability.oCapabilityInfo.capability === "casketstore" || SelectItemForCapability.oCapabilityInfo.capability === "casketretrieve");
        SelectItemForCapability.oCapabilityInfo.popupVisible = true;
        $.DispatchEvent('CapabilityPopupIsOpen', true);
        _m_cp.FindChildInLayoutFile('id-initial-item-image').itemid = SelectItemForCapability.oCapabilityInfo.initialItemId;
        _m_elItemList.SetHasClass('inv-multi-select-allow', SelectItemForCapability.oCapabilityInfo.bIsMultiSelect);
        _m_cp.SetDialogVariable('item-name', InventoryAPI.GetItemName(SelectItemForCapability.oCapabilityInfo.initialItemId));
        _SetTitle();
        let elDropDownParent = _m_cp.FindChildInLayoutFile('id-dropdown-container');
        _AddSortDropdownToNavBar(elDropDownParent);
        _UpdateMultiSelectDisplay();
    }
    SelectItemForCapability.Init = Init;
    function _SetTitle() {
        let szPrefixString = '#inv_select_item_use_capability';
        if (SelectItemForCapability.oCapabilityInfo.capability === 'can_stattrack_swap') {
            szPrefixString = InventoryAPI.IsTool(SelectItemForCapability.oCapabilityInfo.initialItemId) ?
                '#inv_select_item_use_capability' :
                '#inv_select_item_stattrack_swap_capability';
        }
        else if (SelectItemForCapability.oCapabilityInfo.capability === 'can_collect') {
            let defName = InventoryAPI.GetItemDefinitionName(SelectItemForCapability.oCapabilityInfo.initialItemId);
            szPrefixString = (defName === 'casket') ?
                '#inv_select_item_tostoreincasket' :
                '#inv_select_casketitem_tostorethis';
        }
        else if (SelectItemForCapability.oCapabilityInfo.capability === 'casketcontents') {
            szPrefixString = '#inv_select_casketcontents';
        }
        else if (SelectItemForCapability.oCapabilityInfo.capability === 'casketretrieve') {
            szPrefixString = '#inv_select_casketretrieve';
        }
        else if (SelectItemForCapability.oCapabilityInfo.capability === 'casketstore') {
            szPrefixString = '#inv_select_casketstore';
        }
        else if (SelectItemForCapability.oCapabilityInfo.capability === 'craft_souvenir') {
            szPrefixString = '#inv_select_item_craft_souvenir';
        }
        _m_cp.AddClass('PopupSelectItemForCapability_' + SelectItemForCapability.oCapabilityInfo.capability);
        _m_cp.SetDialogVariable('title', $.Localize(szPrefixString, _m_cp));
    }
    function _AddSortDropdownToNavBar(elDropDownParent) {
        let elDropdown = elDropDownParent.FindChildInLayoutFile('InvSortDropdown');
        let count = InventoryAPI.GetSortMethodsCount();
        for (let i = 0; i < count; i++) {
            let sort = InventoryAPI.GetSortMethodByIndex(i);
            let newEntry = $.CreatePanel('Label', elDropdown, sort, {
                class: 'DropDownMenu'
            });
            newEntry.text = $.Localize('#' + sort);
            elDropdown.AddOption(newEntry);
        }
        elDropdown.SetPanelEvent('oninputsubmit', () => UpdateSort());
        elDropdown.SetSelected(GameInterfaceAPI.GetSettingString("newest"));
    }
    function UpdateSort() {
        // just incase drop down is not initiated then just sort with newest
        let elDropdown = _m_cp.FindChildInLayoutFile('InvSortDropdown');
        const sortString = (!elDropdown || !elDropdown.GetSelected()) ? 'newest' : elDropdown.GetSelected().id;
        let filterApplicationToPhantomItems = ItemInfo.IsFauxOrRentalOrPreviewTool(SelectItemForCapability.oCapabilityInfo.initialItemId) ? '' : ',is_rental:false,is_sealed:false';
        let capabilityFilter = SelectItemForCapability.oCapabilityInfo.capability + ':' + SelectItemForCapability.oCapabilityInfo.initialItemId + filterApplicationToPhantomItems;
        $.DispatchEvent('SetInventoryFilter', _m_elItemList, 'any', 'any', 'any', sortString, capabilityFilter, '' // text filter
        );
        _ShowHideNoItemsMessage();
    }
    SelectItemForCapability.UpdateSort = UpdateSort;
    function _ShowHideNoItemsMessage() {
        let count = _m_elItemList.count;
        let elParent = _m_elItemList.GetParent();
        let elEmpty = elParent.FindChildInLayoutFile('id-select-item-empty-lister');
        if (count > 0) {
            elEmpty.visible = false;
            return;
        }
        let emptyText = '';
        elEmpty.SetDialogVariable('type', InventoryAPI.GetItemName(SelectItemForCapability.oCapabilityInfo.initialItemId));
        if ((SelectItemForCapability.oCapabilityInfo.capability === 'can_stattrack_swap') && !InventoryAPI.IsTool(SelectItemForCapability.oCapabilityInfo.initialItemId))
            emptyText = $.Localize('#inv_empty_lister_for_stattrackswap', elEmpty); // second phase didn't find any items to swap with
        else if (SelectItemForCapability.oCapabilityInfo.capability === 'can_collect')
            emptyText = $.Localize('#inv_empty_lister_nocaskets', elEmpty);
        else if (SelectItemForCapability.oCapabilityInfo.capability === 'craft_souvenir')
            emptyText = $.Localize('#inv_empty_lister_for_craft_souvenir', elEmpty);
        else
            emptyText = $.Localize('#inv_empty_lister_for_use', elEmpty);
        elEmpty.SetDialogVariable('empty-text', emptyText);
        elEmpty.visible = true;
    }
    function _UpdateMultiSelectDisplay() {
        const elMultiSelectDisplay = _m_cp.FindChildInLayoutFile('id-popup-select-multi-item-display');
        if (!SelectItemForCapability.oCapabilityInfo.bIsMultiSelect) {
            elMultiSelectDisplay.visible = false;
            return;
        }
        let count = _m_elItemList.selectedItemCount;
        elMultiSelectDisplay.SetDialogVariableInt('count', count);
        _m_cp.FindChildInLayoutFile('id-popup-select-multi-item-btn').enabled = (count > 0);
        elMultiSelectDisplay.visible = true;
    }
    function ClosePopUp() {
        if (_m_cp.IsValid()) {
            const callbackFunc = _m_cp.GetAttributeInt('callback', -1);
            if (callbackFunc != -1) {
                UiToolkitAPI.InvokeJSCallback(callbackFunc);
            }
        }
        SelectItemForCapability.oCapabilityInfo.popupVisible = false;
        $.DispatchEvent('CSGOPlaySoundEffect', 'inventory_inspect_close', 'MOUSE');
        $.DispatchEvent('CapabilityPopupIsOpen', false);
        $.DispatchEvent('BlurPopupPanel', 'popup-lootlist-item-inspect-' + SelectItemForCapability.oCapabilityInfo.initialItemId, false);
        $.DispatchEvent('UIPopupButtonClicked', '');
    }
    SelectItemForCapability.ClosePopUp = ClosePopUp;
    function _OnItemTileActivated(itemTile, itemid) {
        $.DispatchEvent('CSGOPlaySoundEffect', 'inventory_item_select', 'MOUSE');
        if (SelectItemForCapability.oCapabilityInfo.capability === 'can_sticker') {
            _CapabilityCanStickerAction(SortIdsIntoToolAndItemID(itemid, SelectItemForCapability.oCapabilityInfo.initialItemId), SelectItemForCapability.oCapabilityInfo.bWorkshopItemPreview);
        }
        else if (SelectItemForCapability.oCapabilityInfo.capability === 'can_wrap_sticker') {
            _CapabilityWrapStickerAsKeychainAction(SortIdsIntoToolAndItemID(itemid, SelectItemForCapability.oCapabilityInfo.initialItemId, ItemInfo.IsSticker));
        }
        else if (SelectItemForCapability.oCapabilityInfo.capability === 'nameable') {
            _CapabilityNameableAction(SortIdsIntoToolAndItemID(itemid, SelectItemForCapability.oCapabilityInfo.initialItemId));
        }
        else if (SelectItemForCapability.oCapabilityInfo.capability === 'can_keychain') {
            _CapabilityCanKeychainAction(SortIdsIntoToolAndItemID(itemid, SelectItemForCapability.oCapabilityInfo.initialItemId), SelectItemForCapability.oCapabilityInfo.bWorkshopItemPreview);
        }
        else if (SelectItemForCapability.oCapabilityInfo.capability === 'remove_keychain') {
            _CapabilityRemoveKeychainAction(SortIdsIntoToolAndItemID(itemid, SelectItemForCapability.oCapabilityInfo.initialItemId));
        }
        else if (SelectItemForCapability.oCapabilityInfo.capability === 'can_patch') {
            _CapabilityCanPatchAction(SortIdsIntoToolAndItemID(itemid, SelectItemForCapability.oCapabilityInfo.initialItemId));
        }
        else if (SelectItemForCapability.oCapabilityInfo.capability === 'decodable') {
            _CapabilityDecodableAction(SortIdsIntoToolAndItemID(itemid, SelectItemForCapability.oCapabilityInfo.initialItemId));
        }
        else if (SelectItemForCapability.oCapabilityInfo.capability === 'can_stattrack_swap') {
            _CapabilityStatTrakSwapAction(SelectItemForCapability.oCapabilityInfo, itemid);
        }
        else if (SelectItemForCapability.oCapabilityInfo.capability === 'can_collect') {
            _CapabilityPutIntoCasketAction(itemid, SelectItemForCapability.oCapabilityInfo.initialItemId);
        }
        if (SelectItemForCapability.oCapabilityInfo.capability === 'casketretrieve') {
            let listPanel = itemTile.FindAncestor("id-popup-select-item-list");
            listPanel.OnItemActivated(itemid);
            _UpdateMultiSelectDisplay();
            return;
        }
        else if (SelectItemForCapability.oCapabilityInfo.capability === 'casketstore') {
            let listPanel = itemTile.FindAncestor("id-popup-select-item-list");
            listPanel.OnItemActivated(itemid);
            _UpdateMultiSelectDisplay();
            return;
        }
        else if (SelectItemForCapability.oCapabilityInfo.capability === 'craft_souvenir') {
            _CapabilityCraftSouvenirAction(itemid, SelectItemForCapability.oCapabilityInfo.initialItemId);
        }
        ClosePopUp();
    }
    function SortIdsIntoToolAndItemID(id, initalId, fnWhatIsTool) {
        let bIdIsTool = fnWhatIsTool ? fnWhatIsTool(id) : InventoryAPI.IsTool(id);
        let toolId = bIdIsTool ? id : initalId;
        let itemID = bIdIsTool ? initalId : id;
        $.Msg('SelectedId is tool: ' + InventoryAPI.IsTool(id));
        $.Msg('Initial_Id is tool: ' + InventoryAPI.IsTool(initalId));
        $.Msg('(Tool, Item) pair: (' + toolId + ", " + itemID + ')');
        return {
            tool: toolId,
            item: itemID
        };
    }
    ;
    function _CapabilityCanStickerAction(idsToUse, bWorkshopItemPreview) {
        const workshopPreview = bWorkshopItemPreview ? 'true' : 'false';
        const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('popup-inspect-' + idsToUse.item, 'file://{resources}/layout/popups/popup_capability_can_sticker.xml');
        let oSettings = {
            popup_panel: elPanel,
            item_id: idsToUse.item,
            tool_id: idsToUse.tool,
            work_type: 'can_sticker',
            is_workshop_preview: bWorkshopItemPreview
        };
        elPanel.Data().oSettings = oSettings;
    }
    ;
    function _CapabilityNameableAction(idsToUse) {
        const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('popup-inspect-' + idsToUse.item, 'file://{resources}/layout/popups/popup_capability_nameable.xml');
        let oSettings = {
            item_id: idsToUse.item,
            tool_id: idsToUse.tool,
            work_type: 'nameable'
        };
        elPanel.Data().oSettings = oSettings;
    }
    ;
    function _CapabilityCanKeychainAction(idsToUse, bWorkshopItemPreview) {
        const workshopPreview = bWorkshopItemPreview ? 'true' : 'false';
        const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('popup-inspect-' + idsToUse.item, 'file://{resources}/layout/popups/popup_capability_can_keychain.xml');
        let oSettings = {
            popup_panel: elPanel,
            tool_id: idsToUse.tool,
            item_id: idsToUse.item,
            work_type: 'can_keychain',
            is_workshop_preview: bWorkshopItemPreview
        };
        elPanel.Data().oSettings = oSettings;
    }
    ;
    function _CapabilityCraftSouvenirAction(itemid, umid) {
        if (InventoryAPI.GetItemStickerCount(itemid) > 0) {
            //
            // Take the user to a different popup where they can pre-remove all stickers from their weapon
            //
            const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_capability_can_sticker.xml');
            let oSettings = {
                popup_panel: elPanel,
                item_id: itemid,
                remove_sticker_all_at_once: true,
                work_type: 'remove_sticker',
                umid_souvenir: umid
            };
            elPanel.Data().oSettings = oSettings;
        }
        else {
            //
            // Go straight to make the souvenir - weapon is fully ready
            //
            const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('popup-inspect-' + itemid, 'file://{resources}/layout/popups/popup_capability_can_keychain.xml');
            let oSettings = {
                item_id: itemid,
                tool_id: '',
                umid_souvenir: umid,
                work_type: 'craft_souvenir'
            };
            elPanel.Data().oSettings = oSettings;
        }
    }
    function _CapabilityWrapStickerAsKeychainAction(idsToUse) {
        const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('popup-inspect-' + idsToUse.item, 'file://{resources}/layout/popups/popup_capability_can_keychain.xml');
        let oSettings = {
            item_id: idsToUse.item,
            tool_id: idsToUse.tool,
            work_type: 'can_wrap_sticker'
        };
        elPanel.Data().oSettings = oSettings;
    }
    ;
    function _CapabilityRemoveKeychainAction(idsToUse) {
        const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('popup-inspect-' + idsToUse.item, 'file://{resources}/layout/popups/popup_capability_can_keychain.xml');
        let oSettings = {
            item_id: idsToUse.item,
            work_type: 'remove_keychain'
        };
        elPanel.Data().oSettings = oSettings;
    }
    ;
    function _CapabilityCanPatchAction(idsToUse) {
        const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('popup-inspect-' + idsToUse.item, 'file://{resources}/layout/popups/popup_capability_can_patch.xml');
        let oSettings = {
            item_id: idsToUse.item,
            tool_id: idsToUse.tool,
            work_type: 'can_patch'
        };
        elPanel.Data().oSettings = oSettings;
    }
    ;
    function _CapabilityDecodableAction(idsToUse) {
        const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('popup-inspect-' + idsToUse.item, 'file://{resources}/layout/popups/popup_capability_decodable.xml');
        let oSettings = {
            item_id: idsToUse.item,
            tool_id: idsToUse.tool,
            work_type: 'decodeable'
        };
        elPanel.Data().oSettings = oSettings;
    }
    ;
    function _CapabilityStatTrakSwapAction(capInfo, id) {
        // StatTrak(tm) Swap Tool has a two-stage process:
        // First stage: capInfo.initialItemId is the Tool itself and we are picking the first item
        // Second stage: capInfo.initialItemId is the first item selected and we are picking the second item
        if (InventoryAPI.IsTool(capInfo.initialItemId)) {
            const sWorkshop = false;
            $.DispatchEvent('CSGOPlaySoundEffect', 'tab_mainmenu_inventory', 'MOUSE');
            $.DispatchEvent('ShowSelectItemForCapabilityPopup', id, capInfo.initialItemId, capInfo.capability);
            ClosePopUp();
        }
        else {
            // both items are now selected:
            // capInfo.secondaryItemId is The Swap Tool
            // capInfo.initialItemId is The First Item
            // id is The Second Item
            const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_capability_can_stattrack_swap.xml');
            let oSettings = {
                tool_id: capInfo.secondaryItemId,
                item_id: capInfo.initialItemId,
                stattrak_swap_second_item_id: id
            };
            elPanel.Data().oSettings = oSettings;
        }
    }
    ;
    function _CapabilityPutIntoCasketAction(idCasket, idItem, cap) {
        $.Msg('Put item ' + idItem + ' into casket ' + idCasket + ' (' + (cap ? cap : 'none') + ')');
        $.DispatchEvent('ContextMenuEvent', '');
        if (!cap) {
            $.DispatchEvent('HideSelectItemForCapabilityPopup');
            $.DispatchEvent('UIPopupButtonClicked', '');
            $.DispatchEvent('CapabilityPopupIsOpen', false);
        }
        if (InventoryAPI.GetItemAttributeValue(idCasket, 'modification date')) {
            // Do the popup
            UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_casket_operation.xml', 'op=add' +
                (cap ? '&nextcapability=' + cap : '') +
                '&spinner=1' +
                '&casket_item_id=' + idCasket +
                '&subject_item_id=' + idItem);
        }
        else {
            // This is a freshly purchased casket, user must give it a name (which also makes it non-refundable)
            const fauxNameTag = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(1200, 0); // "Name Tag"
            const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_capability_nameable.xml');
            let oSettings = {
                item_id: idCasket,
                tool_id: fauxNameTag,
                work_type: 'nameable',
                async_work_type_warning_text: '#popup_newcasket_warning'
            };
            elPanel.Data().oSettings = oSettings;
        }
    }
    ;
    function ProceedForMultiStatusCapabilityPopup() {
        let capability = SelectItemForCapability.oCapabilityInfo.capability;
        let count = _m_elItemList.selectedItemCount;
        let arrItemIDs = [];
        for (let i = 0; i < count; i++) {
            arrItemIDs.push(_m_elItemList.GetSelectedItemId(i).toString());
        }
        $.Msg('Selected ' + arrItemIDs.length + ' items for ' + capability);
        if (arrItemIDs.length <= 0)
            return;
        switch (capability) {
            case 'casketretrieve':
                {
                    let strItemIDs = arrItemIDs.join(",");
                    UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_casket_operation.xml', 'op=remove' +
                        '&nextcapability=batch' +
                        '&spinner=1' +
                        '&casket_item_id=' + SelectItemForCapability.oCapabilityInfo.initialItemId +
                        '&subject_item_id=' + strItemIDs);
                    break;
                }
            case 'casketstore':
                {
                    let strItemIDs = arrItemIDs.join(",");
                    UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_casket_operation.xml', 'op=add' +
                        '&nextcapability=batch' +
                        '&spinner=1' +
                        '&casket_item_id=' + SelectItemForCapability.oCapabilityInfo.initialItemId +
                        '&subject_item_id=' + strItemIDs);
                    break;
                }
        }
        ClosePopUp();
    }
    SelectItemForCapability.ProceedForMultiStatusCapabilityPopup = ProceedForMultiStatusCapabilityPopup;
    function _UpdateSelectItemForCapabilityPopup(capability, itemid, bSelected) {
        if (SelectItemForCapability.oCapabilityInfo.capability !== capability)
            return false;
        if (!itemid)
            return false;
        _UpdateMultiSelectDisplay();
        UpdateSort();
        return true;
    }
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        $.RegisterForUnhandledEvent("OnItemTileActivated", _OnItemTileActivated);
        $.RegisterForUnhandledEvent('UpdateSelectItemForCapabilityPopup', _UpdateSelectItemForCapabilityPopup);
    }
})(SelectItemForCapability || (SelectItemForCapability = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfc2VsZWN0X2l0ZW1fZm9yX2NhcGFiaWxpdHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfc2VsZWN0X2l0ZW1fZm9yX2NhcGFiaWxpdHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyxtREFBbUQ7QUFDbkQsb0RBQW9EO0FBQ3BELGdEQUFnRDtBQUNoRCw4Q0FBOEM7QUFDOUMsc0NBQXNDO0FBRXRDLElBQVUsdUJBQXVCLENBK2pCaEM7QUEvakJELFdBQVUsdUJBQXVCO0lBRWhDLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztJQUNoQyxJQUFJLGFBQWEsR0FBSSxLQUFLLENBQUMscUJBQXFCLENBQUUsMkJBQTJCLENBQXlCLENBQUM7SUFXNUYsdUNBQWUsR0FBcUI7UUFDOUMsVUFBVSxFQUFFLEVBQUU7UUFDZCxhQUFhLEVBQUMsRUFBRTtRQUNoQixZQUFZLEVBQUUsS0FBSztRQUNuQixvQkFBb0IsRUFBRSxLQUFLO1FBQzNCLGNBQWMsRUFBRSxLQUFLO0tBQ3JCLENBQUM7SUFFRixTQUFnQixJQUFJO1FBRW5CLHdCQUFBLGVBQWUsQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDLGtCQUFrQixDQUFFLFFBQVEsRUFBRSxFQUFFLENBQUUsQ0FBQztRQUN6RSx3QkFBQSxlQUFlLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQyxrQkFBa0IsQ0FBRSxpQkFBaUIsRUFBRSxFQUFFLENBQUUsQ0FBQztRQUNwRix3QkFBQSxlQUFlLENBQUMsb0JBQW9CLEdBQUksS0FBSyxDQUFDLGtCQUFrQixDQUFFLHNCQUFzQixFQUFFLE9BQU8sQ0FBRSxLQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7UUFDOUgsd0JBQUEsZUFBZSxDQUFDLFVBQVUs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