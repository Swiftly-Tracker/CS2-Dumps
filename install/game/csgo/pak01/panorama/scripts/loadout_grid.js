"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="inspect.ts" />
/// <reference path="common/iteminfo.ts" />
/// <reference path="common/tint_spray_icon.ts" />
/// <reference path="common/formattext.ts" />
var LoadoutGrid;
(function (LoadoutGrid) {
    let m_hasRunFirstTime = false;
    let m_equipSlotChangedHandler;
    let m_setShuffleEnabledHandler;
    let m_inventoryUpdatedHandler;
    let m_selectedTeam;
    let m_mouseOverSlot;
    let m_elDragSource;
    let m_dragItemId;
    let m_filterItemId = '';
    let m_updatedFromShowItemInLoadout = false;
    let m_currentCharId = {
        t: '',
        ct: '',
        noteam: '',
    };
    let m_currentCharGlovesId = {
        t: '',
        ct: '',
        noteam: '',
    };
    let m_currentCharWeaponId = {
        t: '',
        ct: '',
        noteam: '',
    };
    let m_currentPetId = {
        t: '',
        ct: '',
        noteam: '',
    };
    const m_arrGenericCharacterGlobalSlots = [
        { slot: 'customplayer', category: 'customplayer' },
        { slot: 'clothing_hands', category: 'clothing' },
        { slot: 'melee', category: 'melee', equip_on_hover: true },
        { slot: 'equipment2', category: 'equipment2', equip_on_hover: true },
        { slot: 'c4', category: 'c4', required_team: 't', equip_on_hover: true },
        { slot: 'musickit', category: 'musickit' },
        { slot: 'flair0', category: 'flair0' },
        { slot: 'spray0', category: 'spray' },
    ];
    function _BCanFitIntoNonWeaponSlot(category, team) {
        return m_arrGenericCharacterGlobalSlots.find((entry) => { return entry.category === category && (!entry.required_team || (entry.required_team === team)); })
            ? true
            : false;
    }
    function _BIsSlotAndTeamConfigurationValid(slot, team) {
        return m_arrGenericCharacterGlobalSlots.find((entry) => { return entry.slot === slot && entry.required_team && (entry.required_team !== team); })
            ? false
            : true;
    }
    function OnReadyForDisplay() {
        if (!m_hasRunFirstTime) {
            m_hasRunFirstTime = true;
            Init();
        }
        else {
            FillOutRowItems('ct');
            FillOutRowItems('t');
            UpdateGridFilterIcons();
            UpdateGridShuffleIcons();
            UpdateItemList();
            UpdateCharModel('ct');
            UpdateCharModel('t');
            FillOutGridItems('ct');
            FillOutGridItems('t');
            m_updatedFromShowItemInLoadout = m_updatedFromShowItemInLoadout ? false : false;
        }
        m_equipSlotChangedHandler = $.RegisterForUnhandledEvent('PanoramaComponent_Loadout_EquipSlotChanged', OnEquipSlotChanged);
        m_setShuffleEnabledHandler = $.RegisterForUnhandledEvent('PanoramaComponent_Loadout_SetShuffleEnabled', UpdateGridShuffleIcons);
        m_inventoryUpdatedHandler = $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', () => {
            OnMyPersonaInventoryUpdated();
        });
    }
    function OnMyPersonaInventoryUpdated() {
        UpdateItemList();
        FillOutRowItems('ct');
        FillOutRowItems('t');
        UpdateCharModel('ct');
        UpdateCharModel('t');
    }
    function OnUnreadyForDisplay() {
        if (m_equipSlotChangedHandler) {
            $.UnregisterForUnhandledEvent('PanoramaComponent_Loadout_EquipSlotChanged', m_equipSlotChangedHandler);
            m_equipSlotChangedHandler = null;
        }
        if (m_setShuffleEnabledHandler) {
            $.UnregisterForUnhandledEvent('PanoramaComponent_Loadout_SetShuffleEnabled', m_setShuffleEnabledHandler);
            m_setShuffleEnabledHandler = null;
        }
        if (m_inventoryUpdatedHandler) {
            $.UnregisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', m_inventoryUpdatedHandler);
            m_inventoryUpdatedHandler = null;
        }
        UiToolkitAPI.HideCustomLayoutTooltip('JsLoadoutItemTooltip');
    }
    function OnEquipSlotChanged(team, slot, oldItemId, newItemId, bNew) {
        if (team == 't' || team == 'ct') {
            FillOutGridItems(team);
            if (['melee', 'secondary', 'smg', 'rifle', 'c4', 'equipment2'].includes(InventoryAPI.GetLoadoutCategory(newItemId)))
                UpdateCharModel(team, newItemId);
            else
                UpdateCharModel(team);
        }
        else if (slot == 'pet') {
            UpdateCharModel('ct');
            UpdateCharModel('t');
        }
        FillOutRowItems('ct');
        FillOutRowItems('t');
        UpdateGridFilterIcons();
    }
    function Init() {
        UpdateCharModel('ct');
        UpdateCharModel('t');
        SetUpTeamSelectBtns();
        InitSortDropDown();
        UpdateGridShuffleIcons();
        $.DispatchEvent("Activated", $.GetContextPanel().FindChildInLayoutFile('id-loadout-select-team-btn-t'), "mouse");
        $.DispatchEvent("Activated", $.GetContextPanel().FindChildInLayoutFile('id-loadout-select-team-btn-ct'), "mouse");
        let elItemList = $('#id-loadout-item-list');
        elItemList.SetAttributeInt('DragScrollSpeedHorizontal', 0);
        elItemList.SetAttributeInt('DragScrollSpeedVertical', 0);
        RegisterGridItemEvents('ct');
        RegisterGridItemEvents('t');
    }
    function SetUpTeamSelectBtns() {
        let aSectionSuffexes = ['ct', 't'];
        for (let suffex of aSectionSuffexes) {
            let elSection = $.GetContextPanel().FindChildInLayoutFile('id-loadout-grid-section-' + suffex);
            let elBtn = elSection.FindChildInLayoutFile('id-loadout-select-team-btn-' + suffex);
            elBtn.Data().team = suffex;
            ItemDragTargetEvents(elBtn);
            elBtn.SetPanelEvent('onactivate', ChangeSelectedTeam);
            elBtn.SetPanelEvent('onmouseover', () => { UiToolkitAPI.HideCustomLayoutTooltip('JsLoadoutItemTooltip'); });
        }
    }
    function ChangeSelectedTeam() {
        let suffex = (m_selectedTeam == 't' ? 'ct' : 't');
        let elSection = $.GetContextPanel().FindChildInLayoutFile('id-loadout-grid-section-' + suffex);
        $.GetContextPanel().SetHasClass('loadout_t_selected', suffex === 't');
        elSection.FindChildInLayoutFile('id-loadout-grid-slots-' + suffex).hittest = true;
        let oppositeTeam = suffex === 't' ? 'ct' : 't';
        let elOppositeSection = $.GetContextPanel().FindChildInLayoutFile('id-loadout-grid-section-' + oppositeTeam);
        elOppositeSection.FindChildInLayoutFile('id-loadout-grid-slots-' + oppositeTeam).hittest = false;
        m_selectedTeam = suffex;
        FillOutGridItems(m_selectedTeam);
        FillOutRowItems(m_selectedTeam);
        if (!_BIsSlotAndTeamConfigurationValid(GetSelectedGroup(), m_selectedTeam)) {
            let elGroupDropdown = $.GetContextPanel().FindChildInLayoutFile('id-loadout-filter-group');
            elGroupDropdown.SetSelected('all');
        }
        else {
            UpdateFilters();
        }
        UiToolkitAPI.HideCustomLayoutTooltip('JsLoadoutItemTooltip');
        $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.submenu_select', 'MOUSE');
    }
    function OnActivateSideItem(slotName, TeamName) {
        if (m_selectedTeam !== TeamName) {
            ChangeSelectedTeam();
            ToggleGroupDropdown(slotName, true);
        }
        else {
            ClearItemIdFilter();
            ToggleGroupDropdown(slotName, false);
        }
    }
    function UpdateCharModel(team, weaponId = '') {
        let elPanel = $.GetContextPanel().FindChildInLayoutFile('id-loadout-agent-' + team);
        if (!elPanel)
            return;
        let charId = LoadoutAPI.GetItemID(team, 'customplayer');
        let glovesId = LoadoutAPI.GetItemID(team, 'clothing_hands');
        let petId = InventoryAPI.GetPetItemID();
        const settings = ItemInfo.GetOrUpdateVanityCharacterSettings(charId);
        if (team == m_selectedTeam) {
            let selectedGroup = GetSelectedGroup();
            if (['melee', 'secondary0', 'c4', 'equipment2'].includes(selectedGroup)) {
                weaponId = LoadoutAPI.GetItemID(team, selectedGroup);
            }
            else if (['secondary', 'smg', 'rifle'].includes(selectedGroup)) {
                let selectedItemDef = GetSelectedItemDef();
                if (selectedItemDef != 'all') {
                    let itemDefIndex = InventoryAPI.GetItemDefinitionIndexFromDefinitionName(selectedItemDef);
                    if (LoadoutAPI.IsItemDefEquipped(team, itemDefIndex)) {
                        let slot = LoadoutAPI.GetSlotEquippedWithDefIndex(team, itemDefIndex);
                        weaponId = LoadoutAPI.GetItemID(team, slot);
                    }
                }
            }
        }
        if (!weaponId || weaponId == '0') {
            weaponId = m_currentCharWeaponId[team];
            if (!weaponId || weaponId == '0')
                weaponId = LoadoutAPI.GetItemID(team, 'melee');
        }
        if (charId != m_currentCharId[team] ||
            glovesId != m_currentCharGlovesId[team] ||
            weaponId != m_currentCharWeaponId[team]
            || Number(petId) != 0 || Number(m_currentPetId[team]) != 0) {
            m_currentCharId[team] = charId;
            m_currentCharGlovesId[team] = glovesId;
            m_currentCharWeaponId[team] = weaponId;
            m_currentPetId[team] = petId;
            settings.panel = elPanel;
            settings.weaponItemId = weaponId;
            settings.petItemId = petId;
            elPanel.SetPetPlacement(!!petId && Number(petId) != 0 ? 'shoulder' : 'none');
            CharacterAnims.PlayAnimsOnPanel(settings);
        }
    }
    function FillOutGridItems(team) {
        let elSection = $.GetContextPanel().FindChildInLayoutFile('id-loadout-grid-section-' + team);
        let elGrid = elSection.FindChildInLayoutFile('id-loadout-grid-slots-' + team);
        for (let column of elGrid.Children()) {
            let aPanels = column.Children().filter(panel => panel.GetAttributeString('data-slot', '') !== '');
            for (let i = 0; i < aPanels.length; i++) {
                if (column.GetAttributeString('data-slot', '') === 'equipment' ||
                    column.GetAttributeString('data-slot', '') === 'grenade') {
                    UpdateSlotItemImage(team, aPanels[i], true, false, true);
                }
                else {
                    UpdateSlotItemImage(team, aPanels[i], false, true);
                    UpdateName(aPanels[i]);
                    UpdateMoney(aPanels[i], team);
                    UpdateIsRentable(aPanels[i], team);
                }
            }
        }
    }
    function FillOutRowItems(team) {
        let elSection = $.GetContextPanel().FindChildInLayoutFile('id-loadout-grid-section-' + team);
        let elRow = elSection.FindChildInLayoutFile('id-loadout-row-slots-' + team);
        for (let entry of m_arrGenericCharacterGlobalSlots) {
            if (entry.required_team && entry.required_team !== team)
                continue;
            let panelId = 'id-loadout-row-slots-' + entry.slot + '-' + team;
            let elBtn = elRow.FindChild(panelId);
            if (!elBtn) {
                elBtn = $.CreatePanel('ItemImage', elRow, panelId, {
                    class: 'loadout-model-panel__slot'
                });
                elBtn.SetAttributeString('data-slot', entry.slot);
            }
            let slotName = entry.slot;
            let itemid = LoadoutAPI.GetItemID(OverrideTeam(team, slotName), slotName);
            let useIconSlots = ['musickit', 'spray0', 'flair0'];
            let bUseIcon = useIconSlots.includes(slotName) && itemid === '0' ? true : false;
            UpdateSlotItemImage(team, elBtn, bUseIcon, true);
            if (itemid && itemid != '0' && elBtn) {
                elBtn.SetPanelEvent('oncontextmenu', () => {
                    let filterValue = '';
                    if (LoadoutAPI.IsShuffleEnabled(OverrideTeam(team, slotName), slotName))
                        filterValue = 'shuffle_slot_' + team;
                    else
                        filterValue = 'loadout_slot_' + team;
                    if (slotName === 'spray0')
                        filterValue += '&contextmenuparam=graffiti';
                    OpenContextMenu(elBtn, filterValue);
                });
                elBtn.SetPanelEvent('onmouseover', () => {
                    if (team == m_selectedTeam && entry.equip_on_hover)
                        UpdateCharModel(team, LoadoutAPI.GetItemID(team, slotName));
                    UiToolkitAPI.ShowCustomLayoutParametersTooltip(panelId, 'JsLoadoutItemTooltip', 'file://{resources}/layout/tooltips/tooltip_loadout_item.xml', 'itemid=' + elBtn.Data().itemid +
                        '&' + 'slot=' + slotName +
                        '&' + 'team=' + m_selectedTeam);
                });
                elBtn.SetPanelEvent('onmouseout', () => { UiToolkitAPI.HideCustomLayoutTooltip('JsLoadoutItemTooltip'); });
            }
            else {
                elBtn.ClearPanelEvent('oncontextmenu');
                elBtn.ClearPanelEvent('onmouseover');
                elBtn.ClearPanelEvent('onmouseout');
            }
            elBtn.SetPanelEvent('onactivate', () => OnActivateSideItem(slotName, team));
        }
    }
    function BTeamHasIconForSlot(team, slot) {
        return (team == "t" && slot == "equipment3") ? false : true;
    }
    function UpdateSlotItemImage(team, elPanel, bUseIcon, bReplacable, bIsEquipment = false) {
        let slot = elPanel.GetAttributeString('data-slot', '');
        team = OverrideTeam(team, slot);
        let itemImage = elPanel.FindChild('loudout-item-image-' + slot);
        let itemid = LoadoutAPI.GetItemID(team, slot);
        let elRarity = elPanel.FindChild('id-loadout-item-rarity');
        if (!itemImage) {
            itemImage = $.CreatePanel('ItemImage', elPanel, 'loudout-item-image-' + slot, {
                class: 'loadout-slot__image'
            });
            if (slot === 'spray0') {
                itemImage.SetAttributeInt('ItemInventoryImagePurpose', 1);
            }
            if (!bUseIcon) {
                elRarity = $.CreatePanel('Panel', elPanel, 'id-loadout-item-rarity', {
                    class: 'loadout-slot-rarity'
                });
            }
            if (bReplacable) {
                $.CreatePanel('Image', elPanel, 'id-loadout-item-filter-icon', {
                    class: 'loadout-slot-filter-icon'
                });
                let elShuffleIcon = $.CreatePanel('Image', elPanel, 'id-loadout-item-shuffle-icon', {
                    class: 'loadout-slot-shuffle-icon'
                });
                elShuffleIcon.visible = LoadoutAPI.IsShuffleEnabled(team, slot);
            }
        }
        itemImage.SetHasClass('loadout-slot__image', !bUseIcon);
        itemImage.SetHasClass('loadout-slot-svg__image', bUseIcon);
        if (!bIsEquipment) {
            TintSprayImage(itemImage, itemid);
        }
        if (bUseIcon && BTeamHasIconForSlot(team, slot)) {
            itemImage.itemid = '';
            itemImage.SetImage('file://{images}/icons/equipment/' + GetDefName(itemid, slot) + '.svg');
        }
        else {
            itemImage.itemid = itemid;
        }
        if (LoadoutAPI.IsShuffleEnabled(team, slot)) {
            let sShuffleIds = GetShuffleItems(team, slot);
            let elContainer = elPanel.FindChild('loudout-item-image-' + slot + '-shuffle');
            if (!elContainer) {
                elContainer = $.CreatePanel('Panel', elPanel, 'loudout-item-image-' + slot + '-shuffle', {});
            }
            for (let element of sShuffleIds) {
                $.CreatePanel('ItemImage', elContainer, 'loudout-item-image-' + slot, {
                    class: 'loadout-slot__image'
                });
            }
        }
        elPanel.Data().itemid = itemid;
        elPanel.Data().visuals_itemid = itemid;
        if (slot === 'spray0') {
            elPanel.Data().visuals_itemid = ItemInfo.GetFauxReplacementItemID(itemid, 'graffiti');
        }
        let color = InventoryAPI.GetItemRarityColor(itemid);
        if (elRarity) {
            elRarity.visible = color ? true : false;
            if (color)
                elRarity.style.backgroundColor = color;
            return;
        }
    }
    function TintSprayImage(itemImage, itemId) {
        TintSprayIcon.CheckIsSprayAndTint(itemId, itemImage);
    }
    function UpdateName(elPanel) {
        let elName = elPanel.FindChild('id-loadout-item-name');
        if (!elName) {
            elName = $.CreatePanel('Label', elPanel, 'id-loadout-item-name', {
                class: 'loadout-slot__name stratum-regular',
                text: '{s:item-name}'
            });
        }
        elPanel.SetDialogVariable('item-name', $.Localize(InventoryAPI.GetItemBaseName(elPanel.Data().visuals_itemid)));
    }
    function UpdateMoney(elPanel, team) {
        let elMoney = elPanel.FindChild('id-loadout-item-money');
        if (!elMoney) {
            elMoney = $.CreatePanel('Label', elPanel, 'id-loadout-item-money', {
                class: 'loadout-slot__money stratum-regular',
                text: '{d:money}'
            });
        }
        elPanel.SetDialogVariableInt('money', LoadoutAPI.GetItemGamePrice(team, elPanel.GetAttributeString('data-slot', '')));
        elMoney.text = $.Localize("#buymenu_money", elPanel);
    }
    function GetDefName(itemid, slot) {
        let defName = InventoryAPI.GetItemDefinitionName(itemid);
        let aDefName = [];
        if (slot === 'clothing_hands' || slot === 'melee' || slot === 'customplayer' || itemid === '0') {
            return slot;
        }
        else {
            aDefName = defName ? defName.split('_') : [];
            return aDefName[1];
        }
    }
    function UpdateIsRentable(elPanel, team) {
        let elLabel = elPanel.FindChild('id-loadout-item-is-rentable');
        if (!elLabel) {
            elLabel = $.CreatePanel('Label', elPanel, 'id-loadout-item-is-rentable', {
                html: 'true',
                class: 'item-tile__rental-expiration stratum-regular-italic',
                text: '#item-rental-time-remaining'
            });
        }
        let slot = elPanel.GetAttributeString('data-slot', '');
        let itemId = LoadoutAPI.GetItemID(team, slot);
        if (!InventoryAPI.IsRental(itemId)) {
            elLabel.AddClass('hide');
            return;
        }
        let expirationDate = InventoryAPI.GetExpirationDate(itemId);
        if (expirationDate <= 0) {
            elLabel.AddClass('hide');
            return;
        }
        let oLocData = FormatText.FormatRentalTime(expirationDate);
        elLabel.SetHasClass('item-expired', oLocData.isExpired);
        elLabel.SetDialogVariable('time-remaining', oLocData.time);
        elLabel.text = $.Localize(oLocData.locString, elLabel);
        elLabel.RemoveClass('hide');
    }
    function OverrideTeam(team, slot) {
        let noteamSlots = ['musickit', 'spray0', 'flair0'];
        return noteamSlots.includes(slot) ? 'noteam' : team;
    }
    function LoadoutSlotItemTileEvents(elPanel) {
        elPanel.SetPanelEvent('onactivate', () => {
            ClearItemIdFilter();
            FilterByItemType(elPanel.Data().itemid, true);
        });
        elPanel.SetPanelEvent('onmouseover', () => {
            m_mouseOverSlot = elPanel.GetAttributeString('data-slot', '');
            UpdateCharModel(m_selectedTeam, LoadoutAPI.GetItemID(m_selectedTeam, m_mouseOverSlot));
            UiToolkitAPI.ShowCustomLayoutParametersTooltip('loudout-item-image-' + m_mouseOverSlot, 'JsLoadoutItemTooltip', 'file://{resources}/layout/tooltips/tooltip_loadout_item.xml', 'itemid=' + elPanel.Data().itemid +
                '&' + 'slot=' + m_mouseOverSlot +
                '&' + 'team=' + m_selectedTeam +
                '&' + 'nameonly=' + 'true');
        });
        elPanel.SetPanelEvent('onmouseout', () => {
            m_mouseOverSlot = '';
            elPanel.SetPanelEvent('onmouseout', () => { UiToolkitAPI.HideCustomLayoutTooltip('JsLoadoutItemTooltip'); });
        });
        elPanel.SetPanelEvent('oncontextmenu', () => {
            let slot = elPanel.GetAttributeString('data-slot', '');
            let filterValue = '';
            if (LoadoutAPI.IsShuffleEnabled(m_selectedTeam, slot))
                filterValue = 'shuffle_slot_' + m_selectedTeam;
            else
                filterValue = 'loadout_slot_' + m_selectedTeam;
            if (slot === 'spray0')
                filterValue += '&contextmenuparam=graffiti';
            OpenContextMenu(elPanel, filterValue);
        });
        elPanel.SetDraggable(true);
        $.RegisterEventHandler('DragStart', elPanel, (elPanel, drag) => {
            if (m_mouseOverSlot !== null) {
                let itemid = LoadoutAPI.GetItemID(m_selectedTeam, m_mouseOverSlot);
                let bShuffle = LoadoutAPI.IsShuffleEnabled(m_selectedTeam, m_mouseOverSlot);
                OnDragStart(elPanel, drag, itemid, bShuffle);
            }
        });
        $.RegisterEventHandler('DragEnd', elPanel, (elRadial, elDragImage) => {
            OnDragEnd(elDragImage);
        });
    }
    function OpenContextMenu(elPanel, filterValue) {
        UiToolkitAPI.HideCustomLayoutTooltip('JsLoadoutItemTooltip');
        let filterForContextMenuEntries = '&populatefiltertext=' + filterValue;
        let contextMenuPanel = UiToolkitAPI.ShowCustomLayoutContextMenuParametersDismissEvent('', '', 'file://{resources}/layout/context_menus/context_menu_inventory_item.xml', 'itemid=' + elPanel.Data().itemid + filterForContextMenuEntries, () => { });
        contextMenuPanel.AddClass("ContextMenu_NoArrow");
    }
    function ItemDragTargetEvents(elPanel) {
        $.RegisterEventHandler('DragEnter', elPanel, () => {
            elPanel.AddClass('loadout-drag-enter');
            m_mouseOverSlot = elPanel.GetAttributeString('data-slot', '');
        });
        $.RegisterEventHandler('DragLeave', elPanel, () => {
            elPanel.RemoveClass('loadout-drag-enter');
            m_mouseOverSlot = '';
        });
        $.RegisterEventHandler('DragDrop', elPanel, (dispayId, elDragImage) => {
            OnDragDrop(elPanel, elDragImage);
        });
    }
    function OnDragStart(elDragSource, drag, itemid, bShuffle) {
        let elDragImage = $.CreatePanel('ItemImage', $.GetContextPanel(), '', {
            class: 'loadout-drag-icon',
            textureheight: '128',
            texturewidth: '128'
        });
        elDragImage.itemid = itemid;
        elDragImage.Data().bShuffle = bShuffle;
        TintSprayImage(elDragImage, itemid);
        drag.displayPanel = elDragImage;
        drag.offsetX = 96;
        drag.offsetY = 64;
        drag.removePositionBeforeDrop = false;
        elDragImage.AddClass('drag-start');
        m_elDragSource = elDragSource;
        m_elDragSource.AddClass('dragged-away');
        m_dragItemId = itemid;
        UpdateValidDropTargets();
        let elItemList = $('#id-loadout-item-list');
        elItemList.hittest = false;
        elItemList.hittestchildren = false;
        $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.inventory_item_pickup', 'MOUSE');
    }
    function OnDragEnd(elDragImage) {
        elDragImage.DeleteAsync(0.1);
        elDragImage.AddClass('drag-end');
        m_elDragSource.RemoveClass('dragged-away');
        m_dragItemId = '';
        UpdateValidDropTargets();
        let elItemList = $('#id-loadout-item-list');
        elItemList.hittest = true;
        elItemList.hittestchildren = true;
    }
    function OnDragDrop(elPanel, elDragImage) {
        let newSlot = elPanel.GetAttributeString('data-slot', '');
        if (newSlot !== null) {
            if (newSlot === 'side_slots' && m_selectedTeam === elPanel.GetAttributeString('data-team', '')) {
                let itemId = elDragImage.itemid;
                let bShuffle = elDragImage.Data().bShuffle;
                if (ItemInfo.IsSpraySealed(itemId)) {
                    const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_capability_decodable.xml');
                    let oSettings = {
                        item_id: itemId,
                        work_type: 'decodeable'
                    };
                    elPanel.Data().oSettings = oSettings;
                }
                else {
                    let category = InventoryAPI.GetLoadoutCategory(itemId);
                    if (_BCanFitIntoNonWeaponSlot(category, m_selectedTeam)) {
                        let slot = category === 'spray' ? 'spray0' : category === 'clothing' ? 'clothing_hands' : category;
                        let team = OverrideTeam(m_selectedTeam, slot);
                        let elRow = $.GetContextPanel().FindChildInLayoutFile('id-loadout-row-slots-' + m_selectedTeam);
                        let elItemPanel = elRow.FindChildInLayoutFile('id-loadout-row-slots-' + slot + '-' + m_selectedTeam);
                        let isSameId = elDragImage.itemid === elItemPanel.Data().itemid ? true : false;
                        let equipSuccess = TryEquipItemInSlot(team, itemId, slot);
                        PlayDropSounds(equipSuccess, isSameId);
                        if (equipSuccess && bShuffle) {
                            LoadoutAPI.SetShuffleEnabled(team, slot, true);
                        }
                    }
                }
                return;
            }
            let canEquip = LoadoutAPI.CanEquipItemInSlot(m_selectedTeam, elDragImage.itemid, newSlot);
            if (canEquip) {
                let itemId = elDragImage.itemid;
                let bShuffle = elDragImage.Data().bShuffle;
                if (InventoryAPI.IsValidItemID(itemId)) {
                    let itemDefIndex = InventoryAPI.GetItemDefinitionIndex(itemId);
                    let oldSlot = LoadoutAPI.GetSlotEquippedWithDefIndex(m_selectedTeam, itemDefIndex);
                    let isSameId = elDragImage.itemid === elPanel.Data().itemid ? true : false;
                    let equipSuccess = TryEquipItemInSlot(m_selectedTeam, itemId, newSlot);
                    PlayDropSounds(equipSuccess, isSameId);
                    if (equipSuccess && bShuffle) {
                        LoadoutAPI.SetShuffleEnabled(m_selectedTeam, newSlot, true);
                    }
                    elPanel.TriggerClass('drop-target');
                    $.Schedule(.5, () => { if (elPanel) {
                        elPanel.RemoveClass('drop-target');
                    } });
                    elPanel.hittestchildren = false;
                    $.Schedule(1, () => { elPanel.hittestchildren = true; });
                    let oldTile = FindGridTile(oldSlot);
                    if (oldTile) {
                        oldTile.AddClass('old-item-slot');
                        $.Schedule(.5, () => { if (oldTile) {
                            oldTile.RemoveClass('old-item-slot');
                        } });
                    }
                }
            }
        }
    }
    function PlayDropSounds(equipSuccess, isSameId) {
        if (equipSuccess && !isSameId) {
            $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.inventory_item_putdown', 'MOUSE');
        }
        else {
            $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.inventory_item_notequipped', 'MOUSE');
        }
    }
    const m_aActiveUsedColumns = [
        'id-loadout-column1',
        'id-loadout-column2',
        'id-loadout-column3',
    ];
    function UpdateValidDropTargets() {
        if (m_dragItemId && InventoryAPI.IsValidItemID(m_dragItemId)) {
            let category = InventoryAPI.GetLoadoutCategory(m_dragItemId);
            if (!category || _BCanFitIntoNonWeaponSlot(category, m_selectedTeam)) {
                let elBtn = $.GetContextPanel().FindChildInLayoutFile('id-loadout-agent-' + m_selectedTeam);
                elBtn.SetHasClass('loadout-valid-target', true);
                return;
            }
        }
        let aSectionSuffexes = ['ct', 't'];
        for (let suffex of aSectionSuffexes) {
            let elBtn = $.GetContextPanel().FindChildInLayoutFile('id-loadout-agent-' + suffex);
            elBtn.SetHasClass('loadout-valid-target', false);
        }
        let elSection = $.GetContextPanel().FindChildInLayoutFile('id-loadout-grid-section-' + m_selectedTeam);
        let elGrid = elSection.FindChildInLayoutFile('id-loadout-grid-slots-' + m_selectedTeam);
        for (let columnId of m_aActiveUsedColumns) {
            let elColumn = elGrid.FindChildInLayoutFile(columnId);
            for (let elPanel of elColumn.Children()) {
                let slot = elPanel.GetAttributeString('data-slot', '');
                let canEquip = LoadoutAPI.CanEquipItemInSlot(m_selectedTeam, m_dragItemId, slot);
                elPanel.SetHasClass('loadout-valid-target', canEquip);
            }
        }
    }
    function FindGridTile(oldSlot) {
        let elGrid = $.GetContextPanel().FindChildInLayoutFile('id-loadout-grid-slots-' + m_selectedTeam);
        {
            for (let columnId of m_aActiveUsedColumns) {
                let elColumn = elGrid.FindChildInLayoutFile(columnId);
                for (let elPanel of elColumn.Children()) {
                    let slot = elPanel.GetAttributeString('data-slot', '');
                    if (slot === oldSlot) {
                        return elPanel;
                    }
                }
            }
        }
        return null;
    }
    function InitSortDropDown() {
        let elDropdown = $.GetContextPanel().FindChildInLayoutFile('id-loadout-sort');
        let count = InventoryAPI.GetSortMethodsCount();
        for (let i = 0; i < count; i++) {
            let id = InventoryAPI.GetSortMethodByIndex(i);
            let newEntry = $.CreatePanel('Label', elDropdown, id, { class: 'DropDownMenu' });
            newEntry.text = $.Localize('#' + id);
            elDropdown.AddOption(newEntry);
        }
        elDropdown.SetSelected(GameInterfaceAPI.GetSettingString("cl_loadout_saved_sort"));
    }
    function UpdateFilters() {
        let group = GetSelectedGroup();
        if (!_BIsSlotAndTeamConfigurationValid(group, m_selectedTeam)) {
            $.DispatchEvent("Activated", $.GetContextPanel().FindChildInLayoutFile('id-loadout-select-team-btn-t'), "mouse");
            return;
        }
        let elClearBtn = $.GetContextPanel().FindChildInLayoutFile('id-loadout-clear-filters');
        elClearBtn.visible = (group != 'all' || m_filterItemId !== '');
        let itemDefNames = null;
        if (['secondary', 'smg', 'rifle'].includes(group)) {
            itemDefNames = JSON.parse(LoadoutAPI.GetGroupItemDefNames(m_selectedTeam, group));
            itemDefNames.sort();
        }
        let elItemDefDropdown = $.GetContextPanel().FindChildInLayoutFile('id-loadout-filter-itemdef');
        if (itemDefNames) {
            let prevSelected = GetSelectedItemDef();
            elItemDefDropdown.RemoveAllOptions();
            {
                let elOption = $.CreatePanel('Label', elItemDefDropdown, 'all', { class: 'DropDownMenu' });
                elOption.text = $.Localize('#inv_filter_all_' + group);
                elItemDefDropdown.AddOption(elOption);
            }
            let itemDefNames = JSON.parse(LoadoutAPI.GetGroupItemDefNames(m_selectedTeam, group)).sort();
            for (let itemDefName of itemDefNames) {
                let itemDefIndex = InventoryAPI.GetItemDefinitionIndexFromDefinitionName(itemDefName);
                let itemId = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(itemDefIndex, 0);
                let elOption = $.CreatePanel('Label', elItemDefDropdown, itemDefName, { class: 'DropDownMenu' });
                elOption.text = $.Localize(InventoryAPI.GetItemBaseName(itemId));
                elItemDefDropdown.AddOption(elOption);
                ;
            }
            elItemDefDropdown.visible = true;
            if (elItemDefDropdown.HasOption(prevSelected))
                elItemDefDropdown.SetSelected(prevSelected);
            else
                elItemDefDropdown.SetSelected('all');
        }
        else {
            elItemDefDropdown.visible = false;
            elItemDefDropdown.SetSelected('all');
            UpdateItemList();
        }
        UpdateGridFilterIcons();
    }
    LoadoutGrid.UpdateFilters = UpdateFilters;
    function UpdateItemList() {
        let loadoutSlotParams = m_selectedTeam;
        let group = GetSelectedGroup();
        loadoutSlotParams += ',flexible_loadout_group:' + (group == 'all' ? 'any' : group);
        let elItemDefDropdown = $.GetContextPanel().FindChildInLayoutFile('id-loadout-filter-itemdef');
        if (elItemDefDropdown.visible) {
            let itemDefName = GetSelectedItemDef();
            if (itemDefName != 'all')
                loadoutSlotParams += ',item_definition:' + itemDefName;
        }
        let elSortDropdown = $.GetContextPanel().FindChildInLayoutFile('id-loadout-sort');
        let sortType = elSortDropdown.GetSelected().id;
        if (GameInterfaceAPI.GetSettingString("cl_loadout_saved_sort") != sortType) {
            GameInterfaceAPI.SetSettingString("cl_loadout_saved_sort", sortType);
            GameInterfaceAPI.ConsoleCommand("host_writeconfig");
        }
        if (m_filterItemId !== '' &&
            InventoryAPI.IsValidItemID(m_filterItemId) &&
            group === InventoryAPI.GetRawDefinitionKey(m_filterItemId, 'flexible_loadout_group') &&
            m_updatedFromShowItemInLoadout) {
            loadoutSlotParams += ',item_id:' + m_filterItemId;
        }
        else if (m_filterItemId) {
            ClearItemIdFilter();
        }
        let elItemList = $.GetContextPanel().FindChildInLayoutFile('id-loadout-item-list');
        $.DispatchEvent('SetInventoryFilter', elItemList, 'any', 'any', 'any', sortType, loadoutSlotParams, '');
        UpdateGridFilterIcons();
        ShowHideItemFilterText(m_filterItemId != '');
    }
    LoadoutGrid.UpdateItemList = UpdateItemList;
    function ClearFilters() {
        let elGroupDropdown = $.GetContextPanel().FindChildInLayoutFile('id-loadout-filter-group');
        if ($.GetContextPanel().FindChildInLayoutFile('id-loadout-clear-filters-label').visible) {
            ShowHideItemFilterText(false);
            ClearItemIdFilter();
            UpdateItemList();
            return;
        }
        elGroupDropdown.SetSelected('all');
    }
    LoadoutGrid.ClearFilters = ClearFilters;
    function ShowHideItemFilterText(bShow) {
        $.GetContextPanel().FindChildInLayoutFile('id-loadout-clear-filters-label').visible = bShow;
    }
    function FilterByItemType(itemId, bToggle = false) {
        let group = InventoryAPI.GetRawDefinitionKey(itemId, 'flexible_loadout_group');
        let elGroupDropdown = $.GetContextPanel().FindChildInLayoutFile('id-loadout-filter-group');
        let elItemDefDropdown = $.GetContextPanel().FindChildInLayoutFile('id-loadout-filter-itemdef');
        if (bToggle && GetSelectedGroup() == group && !elItemDefDropdown.visible) {
            elGroupDropdown.SetSelected('all');
            return;
        }
        elGroupDropdown.SetSelected(group);
        if (elItemDefDropdown.visible) {
            let itemDefName = InventoryAPI.GetItemDefinitionName(itemId);
            if (bToggle && GetSelectedItemDef() == itemDefName)
                elItemDefDropdown.SetSelected('all');
            else
                elItemDefDropdown.SetSelected(itemDefName);
        }
    }
    function ToggleGroupDropdown(group, bDisallowToggle = false) {
        let elGroupDropdown = $.GetContextPanel().FindChildInLayoutFile('id-loadout-filter-group');
        let elItemDefDropdown = $.GetContextPanel().FindChildInLayoutFile('id-loadout-filter-itemdef');
        if (GetSelectedGroup() == group && !bDisallowToggle) {
            if (GetSelectedItemDef() != 'all')
                elItemDefDropdown.SetSelected('all');
            else
                elGroupDropdown.SetSelected('all');
        }
        else {
            elGroupDropdown.SetSelected(group);
            if (elItemDefDropdown.visible)
                elItemDefDropdown.SetSelected('all');
        }
    }
    LoadoutGrid.ToggleGroupDropdown = ToggleGroupDropdown;
    function OnItemTileLoaded(elItemTile) {
        elItemTile.SetPanelEvent('onactivate', () => { });
        elItemTile.SetDraggable(true);
        $.RegisterEventHandler('DragStart', elItemTile, (elItemTile, drag) => {
            $.DispatchEvent('CSGOInventoryHideTooltip');
            OnDragStart(elItemTile, drag, elItemTile.GetAttributeString('itemid', '0'), false);
        });
        $.RegisterEventHandler('DragEnd', elItemTile, (elItemTile, elDragImage) => {
            OnDragEnd(elDragImage);
        });
    }
    function ShowLoadoutForItem(itemId) {
        if (!DoesItemTeamMatchTeamRequired(m_selectedTeam, itemId)) {
            ChangeSelectedTeam();
        }
        m_filterItemId = itemId;
        m_updatedFromShowItemInLoadout = true;
        let elClearBtn = $.GetContextPanel().FindChildInLayoutFile('id-loadout-clear-filters');
        elClearBtn.SetDialogVariable('item_name', InventoryAPI.GetItemName(m_filterItemId));
        ShowHideItemFilterText(true);
        FilterByItemType(itemId);
    }
    function ClearItemIdFilter() {
        m_filterItemId = m_filterItemId !== '' ? '' : '';
    }
    function DoesItemTeamMatchTeamRequired(team, id) {
        if (team === 't') {
            return ItemInfo.IsItemT(id) || ItemInfo.IsItemAnyTeam(id);
        }
        if (team === 'ct') {
            return ItemInfo.IsItemCt(id) || ItemInfo.IsItemAnyTeam(id);
        }
        return false;
    }
    function UpdateGridFilterIcons() {
        let selectedGroup = GetSelectedGroup();
        let selectedItemDef = GetSelectedItemDef();
        let elGrid = $.GetContextPanel().FindChildInLayoutFile('id-loadout-grid-slots-' + m_selectedTeam);
        if (elGrid) {
            for (let group of ['secondary0', 'secondary', 'smg', 'rifle']) {
                let btn = elGrid.FindChildInLayoutFile('id-loadout-btn-' + group);
                if (btn) {
                    btn.checked = (group == selectedGroup && (!selectedItemDef || selectedItemDef == 'all'));
                }
            }
            for (let columnId of m_aActiveUsedColumns) {
                let elColumn = elGrid.FindChildInLayoutFile(columnId);
                for (let elPanel of elColumn.Children()) {
                    let elFilterIcon = elPanel.FindChildInLayoutFile('id-loadout-item-filter-icon');
                    if (elFilterIcon) {
                        let slot = elPanel.GetAttributeString('data-slot', '');
                        let itemId = LoadoutAPI.GetItemID(m_selectedTeam, slot);
                        let itemDef = InventoryAPI.GetItemDefinitionName(itemId);
                        elFilterIcon.visible = (itemDef == selectedItemDef);
                    }
                }
            }
        }
        for (let team of ['ct', 't']) {
            let elSection = $.GetContextPanel().FindChildInLayoutFile('id-loadout-grid-section-' + team);
            let elRow = elSection.FindChildInLayoutFile('id-loadout-row-slots-' + team);
            for (let elPanel of elRow.Children()) {
                let elFilterIcon = elPanel.FindChildInLayoutFile('id-loadout-item-filter-icon');
                if (elFilterIcon) {
                    if (team == m_selectedTeam) {
                        let slot = elPanel.GetAttributeString('data-slot', '');
                        elFilterIcon.visible = (slot == selectedGroup);
                    }
                    else {
                        elFilterIcon.visible = false;
                    }
                }
            }
        }
        UpdateCharModel(m_selectedTeam);
    }
    function UpdateGridShuffleIcons() {
        let elGrid = $.GetContextPanel().FindChildInLayoutFile('id-loadout-grid-slots-' + m_selectedTeam);
        if (elGrid) {
            for (let columnId of m_aActiveUsedColumns) {
                let elColumn = elGrid.FindChildInLayoutFile(columnId);
                for (let elPanel of elColumn.Children()) {
                    let elShuffleIcon = elPanel.FindChildInLayoutFile('id-loadout-item-shuffle-icon');
                    if (elShuffleIcon) {
                        let slot = elPanel.GetAttributeString('data-slot', '');
                        elShuffleIcon.visible = LoadoutAPI.IsShuffleEnabled(OverrideTeam(m_selectedTeam, slot), slot);
                    }
                }
            }
        }
        for (let team of ['ct', 't']) {
            let elSection = $.GetContextPanel().FindChildInLayoutFile('id-loadout-grid-section-' + team);
            let elRow = elSection.FindChildInLayoutFile('id-loadout-row-slots-' + team);
            for (let elPanel of elRow.Children()) {
                let elShuffleIcon = elPanel.FindChildInLayoutFile('id-loadout-item-shuffle-icon');
                if (elShuffleIcon) {
                    let slot = elPanel.GetAttributeString('data-slot', '');
                    elShuffleIcon.visible = LoadoutAPI.IsShuffleEnabled(OverrideTeam(team, slot), slot);
                }
            }
        }
    }
    function GetSelectedGroup() {
        let elDropdown = $.GetContextPanel().FindChildInLayoutFile('id-loadout-filter-group');
        return (elDropdown?.visible ? elDropdown.GetSelected()?.id : null) ?? 'all';
    }
    function GetSelectedItemDef() {
        let elDropdown = $.GetContextPanel().FindChildInLayoutFile('id-loadout-filter-itemdef');
        return (elDropdown?.visible ? elDropdown.GetSelected()?.id : null) ?? 'all';
    }
    function GetShuffleItems(team, slot) {
        return JSON.parse(LoadoutAPI.GetShuffleItems(team, slot));
    }
    function RegisterGridItemEvents(team) {
        let elSection = $.GetContextPanel().FindChildInLayoutFile('id-loadout-grid-section-' + team);
        let elGrid = elSection.FindChildInLayoutFile('id-loadout-grid-slots-' + team);
        for (let column of elGrid.Children()) {
            let aPanels = column.Children().filter(panel => panel.GetAttributeString('data-slot', '') !== '');
            for (let i = 0; i < aPanels.length; i++) {
                if (column.GetAttributeString('data-slot', '') !== 'equipment' &&
                    column.GetAttributeString('data-slot', '') !== 'grenade') {
                    LoadoutSlotItemTileEvents(aPanels[i]);
                    ItemDragTargetEvents(aPanels[i]);
                }
            }
        }
    }
    function TryEquipItemInSlot(szTeam, szItemID, szSlot) {
        let bSuccess = LoadoutAPI.EquipItemInSlot(szTeam, szItemID, szSlot);
        if (!bSuccess && LoadoutAPI.CanEquipItemInSlot(szTeam, szItemID, szSlot)) {
            UiToolkitAPI.ShowGenericPopupOk($.Localize('#LoadoutLockedPopupTitle'), $.Localize('#LoadoutLockedPopupText'), '', () => { });
        }
        return bSuccess;
    }
    {
        $.RegisterEventHandler('ReadyForDisplay', $.GetContextPanel(), OnReadyForDisplay);
        $.RegisterEventHandler('UnreadyForDisplay', $.GetContextPanel(), OnUnreadyForDisplay);
        $.RegisterForUnhandledEvent('LoadoutFilterByItemType', FilterByItemType);
        $.RegisterEventHandler('CSGOInventoryItemLoaded', $.GetContextPanel(), OnItemTileLoaded);
        $.RegisterForUnhandledEvent('ShowLoadoutForItem', ShowLoadoutForItem);
    }
})(LoadoutGrid || (LoadoutGrid = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZG91dF9ncmlkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvbG9hZG91dF9ncmlkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFDbEMsbUNBQW1DO0FBQ25DLDJDQUEyQztBQUMzQyxrREFBa0Q7QUFDbEQsNkNBQTZDO0FBRTdDLElBQVUsV0FBVyxDQWcwQ3BCO0FBaDBDRCxXQUFVLFdBQVc7SUFFcEIsSUFBSSxpQkFBaUIsR0FBRyxLQUFLLENBQUM7SUFDOUIsSUFBSSx5QkFBd0MsQ0FBQztJQUM3QyxJQUFJLDBCQUF5QyxDQUFDO0lBQzlDLElBQUkseUJBQXdDLENBQUM7SUFDN0MsSUFBSSxjQUEwQixDQUFDO0lBQy9CLElBQUksZUFBdUIsQ0FBQztJQUM1QixJQUFJLGNBQXVCLENBQUM7SUFDNUIsSUFBSSxZQUFvQixDQUFDO0lBQ3pCLElBQUksY0FBYyxHQUFXLEVBQUUsQ0FBQztJQUNoQyxJQUFJLDhCQUE4QixHQUFZLEtBQUssQ0FBQztJQUVwRCxJQUFJLGVBQWUsR0FBRztRQUNyQixDQUFDLEVBQUUsRUFBRTtRQUNMLEVBQUUsRUFBRSxFQUFFO1FBQ04sTUFBTSxFQUFFLEVBQUU7S0FDVixDQUFDO0lBRUYsSUFBSSxxQkFBcUIsR0FBRztRQUMzQixDQUFDLEVBQUUsRUFBRTtRQUNMLEVBQUUsRUFBRSxFQUFFO1FBQ04sTUFBTSxFQUFFLEVBQUU7S0FDVixDQUFDO0lBRUYsSUFBSSxxQkFBcUIsR0FBRztRQUMzQixDQUFDLEVBQUUsRUFBRTtRQUNMLEVBQUUsRUFBRSxFQUFFO1FBQ04sTUFBTSxFQUFFLEVBQUU7S0FDVixDQUFDO0lBRUYsSUFBSSxjQUFjLEdBQUc7UUFDcEIsQ0FBQyxFQUFFLEVBQUU7UUFDTCxFQUFFLEVBQUUsRUFBRTtRQUNOLE1BQU0sRUFBRSxFQUFFO0tBQ1YsQ0FBQztJQUdGLE1BQU0sZ0NBQWdDLEdBQUc7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