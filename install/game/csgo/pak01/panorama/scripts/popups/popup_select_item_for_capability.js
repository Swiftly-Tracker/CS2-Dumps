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
        let elDropdown = _m_cp.FindChildInLayoutFile('InvSortDropdown');
        const sortString = (!elDropdown || !elDropdown.GetSelected()) ? 'newest' : elDropdown.GetSelected().id;
        let filterApplicationToPhantomItems = ItemInfo.IsFauxOrRentalOrPreviewTool(SelectItemForCapability.oCapabilityInfo.initialItemId) ? '' : ',is_rental:false,is_sealed:false';
        let capabilityFilter = SelectItemForCapability.oCapabilityInfo.capability + ':' + SelectItemForCapability.oCapabilityInfo.initialItemId + filterApplicationToPhantomItems;
        $.DispatchEvent('SetInventoryFilter', _m_elItemList, 'any', 'any', 'any', sortString, capabilityFilter, '');
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
            emptyText = $.Localize('#inv_empty_lister_for_stattrackswap', elEmpty);
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
        if (InventoryAPI.IsTool(capInfo.initialItemId)) {
            const sWorkshop = false;
            $.DispatchEvent('CSGOPlaySoundEffect', 'tab_mainmenu_inventory', 'MOUSE');
            $.DispatchEvent('ShowSelectItemForCapabilityPopup', id, capInfo.initialItemId, capInfo.capability);
            ClosePopUp();
        }
        else {
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
        $.DispatchEvent('ContextMenuEvent', '');
        if (!cap) {
            $.DispatchEvent('HideSelectItemForCapabilityPopup');
            $.DispatchEvent('UIPopupButtonClicked', '');
            $.DispatchEvent('CapabilityPopupIsOpen', false);
        }
        if (InventoryAPI.GetItemAttributeValue(idCasket, 'modification date')) {
            UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_casket_operation.xml', 'op=add' +
                (cap ? '&nextcapability=' + cap : '') +
                '&spinner=1' +
                '&casket_item_id=' + idCasket +
                '&subject_item_id=' + idItem);
        }
        else {
            const fauxNameTag = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(1200, 0);
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
    {
        $.RegisterForUnhandledEvent("OnItemTileActivated", _OnItemTileActivated);
        $.RegisterForUnhandledEvent('UpdateSelectItemForCapabilityPopup', _UpdateSelectItemForCapabilityPopup);
    }
})(SelectItemForCapability || (SelectItemForCapability = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfc2VsZWN0X2l0ZW1fZm9yX2NhcGFiaWxpdHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfc2VsZWN0X2l0ZW1fZm9yX2NhcGFiaWxpdHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyxtREFBbUQ7QUFDbkQsb0RBQW9EO0FBQ3BELGdEQUFnRDtBQUNoRCw4Q0FBOEM7QUFDOUMsc0NBQXNDO0FBRXRDLElBQVUsdUJBQXVCLENBK2pCaEM7QUEvakJELFdBQVUsdUJBQXVCO0lBRWhDLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztJQUNoQyxJQUFJLGFBQWEsR0FBSSxLQUFLLENBQUMscUJBQXFCLENBQUUsMkJBQTJCLENBQXlCLENBQUM7SUFXNUYsdUNBQWUsR0FBcUI7UUFDOUMsVUFBVSxFQUFFLEVBQUU7UUFDZCxhQUFhLEVBQUMsRUFBRTtRQUNoQixZQUFZLEVBQUUsS0FBSztRQUNuQixvQkFBb0IsRUFBRSxLQUFLO1FBQzNCLGNBQWMsRUFBRSxLQUFLO0tBQ3JCLENBQUM7SUFFRixTQUFnQixJQUFJO1FBRW5CLHdCQUFBLGVBQWUsQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDLGtCQUFrQixDQUFFLFFBQVEsRUFBRSxFQUFFLENBQUUsQ0FBQztRQUN6RSx3QkFBQSxlQUFlLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQyxrQkFBa0IsQ0FBRSxpQkFBaUIsRUFBRSxFQUFFLENBQUUsQ0FBQztRQUNwRix3QkFBQSxlQUFlLENBQUMsb0JBQW9CLEdBQUksS0FBSyxDQUFDLGtCQUFrQixDQUFFLHNCQUFzQixFQUFFLE9BQU8sQ0FBRSxLQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7UUFDOUgsd0JBQUEsZUFBZSxDQUFDLFVBQVUs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