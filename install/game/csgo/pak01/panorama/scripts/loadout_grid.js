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
    // helper for getting correct slot name for weapon.
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
    // -------Events Handeler registration and unregistration-------
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
            // we might have missed OnEquipSlotChanged events, so update all equipped items
            UpdateCharModel('ct');
            UpdateCharModel('t');
            FillOutGridItems('ct');
            FillOutGridItems('t');
            // We do this here because OnReadyForDisplay() once the panel is visible fires after other events
            // But when the panel is created it fires before other events.
            m_updatedFromShowItemInLoadout = m_updatedFromShowItemInLoadout ? false : false;
        }
        m_equipSlotChangedHandler = $.RegisterForUnhandledEvent('PanoramaComponent_Loadout_EquipSlotChanged', OnEquipSlotChanged);
        m_setShuffleEnabledHandler = $.RegisterForUnhandledEvent('PanoramaComponent_Loadout_SetShuffleEnabled', UpdateGridShuffleIcons);
        m_inventoryUpdatedHandler = $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', () => {
            $.Msg('LoadoutGrid-PanoramaComponent_MyPersona_InventoryUpdated');
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
        UpdateGridFilterIcons(); // e.g. if you moved or unequipped the weapon you're filtering by
    }
    // -------------------------------------------------------------------------------------------------------
    function Init() {
        UpdateCharModel('ct');
        UpdateCharModel('t');
        SetUpTeamSelectBtns();
        InitSortDropDown();
        UpdateGridShuffleIcons();
        // Select ct team loadout as first selection.
        // The Style 'loadout_t_selected' is applied by defaul_FillOutGridItemst so when we choose ct on display we get the animation.
        $.DispatchEvent("Activated", $.GetContextPanel().FindChildInLayoutFile('id-loadout-select-team-btn-t'), "mouse");
        $.DispatchEvent("Activated", $.GetContextPanel().FindChildInLayoutFile('id-loadout-select-team-btn-ct'), "mouse");
        // Disable drag scrolling. It's annoying when you're trying to drag item to your loadout.
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
        // keeping these active so you can filter and change team when you this these on the other side. Leaving here may use later.
        // elSection.FindChildInLayoutFile( 'id-loadout-row-slots-' + suffex ).hittestchildren = true;
        let oppositeTeam = suffex === 't' ? 'ct' : 't';
        let elOppositeSection = $.GetContextPanel().FindChildInLayoutFile('id-loadout-grid-section-' + oppositeTeam);
        elOppositeSection.FindChildInLayoutFile('id-loadout-grid-slots-' + oppositeTeam).hittest = false;
        // keeping these active so you can filter and change team when you this these on the other side. Leaving here may use later.
        // elOppositeSection.FindChildInLayoutFile( 'id-loadout-row-slots-' + oppositeTeam ).hittestchildren = false;
        m_selectedTeam = suffex;
        // Update the slots to make sure we have the right ones when you switch teams
        FillOutGridItems(m_selectedTeam);
        FillOutRowItems(m_selectedTeam);
        if (!_BIsSlotAndTeamConfigurationValid(GetSelectedGroup(), m_selectedTeam)) {
            let elGroupDropdown = $.GetContextPanel().FindChildInLayoutFile('id-loadout-filter-group');
            elGroupDropdown.SetSelected('all');
        }
        else {
            // UpdateFilters() transitively calls UpdateItemList(). Both can be necessary when changing teams.
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
        // If we're filtering by something specific, prefer that over the given weapon ID.
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
        // Default to the last weapon we showed.
        if (!weaponId || weaponId == '0') {
            weaponId = m_currentCharWeaponId[team];
            if (!weaponId || weaponId == '0')
                weaponId = LoadoutAPI.GetItemID(team, 'melee'); // Default to knife.
        }
        // Only update if necessary. Unnecessary updates can result in gloves blinking.
        if (charId != m_currentCharId[team] ||
            glovesId != m_currentCharGlovesId[team] ||
            weaponId != m_currentCharWeaponId[team]
            // Always update if a pet's equipped in-case something about the pet changed.
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
                // grenades and equipment are non interactive
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
                continue; // skip C4 slot for CTs
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
        // T has no defuser slot in the loadout grid
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
                itemImage.SetAttributeInt('ItemInventoryImagePurpose', 1); // k_EEconItemInventoryImagePurpose_Graffiti
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
                $.Msg('Shuffle Name: ' + InventoryAPI.GetItemName(element));
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
        $.Msg('InventoryAPI.GetItemBaseName( itemid ): ' + InventoryAPI.GetItemBaseName(itemid));
        let aDefName = [];
        //
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
            $.Msg('loudout-item-image-' + m_mouseOverSlot);
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
        // Weapons in the grid are draggable
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
        // override filter value
        let filterForContextMenuEntries = '&populatefiltertext=' + filterValue;
        // If you are browsing the inventory
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
        // Parent to $.GetContextPanel() instead of elDragSource.
        // Parenting to elDragSource results in item images getting stuck in weird places for some reason.
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
        // // Disable scrolling while dragging.
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
        // Re-enable scrolling.
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
                        // Catch the items that are using the subslot
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
                    $.Msg('oldSlot: ' + oldSlot);
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
                    // keep gun from making a drop target right away
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
        // 'id-loadout-column0', equipment
        'id-loadout-column1',
        'id-loadout-column2',
        'id-loadout-column3',
        // 'id-loadout-column4' grenades
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
                    $.Msg('elColumn- ' + elColumn.id + ' slot- ' + slot + 'oldSlot: ' + oldSlot);
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
            // user selected a slot, but this slot is not valid for selected team...
            // ... well, use the fact that there are only two teams and we should just auto-switch
            // the user to the opposite team because clearly they want to work on that slot now
            $.DispatchEvent("Activated", $.GetContextPanel().FindChildInLayoutFile('id-loadout-select-team-btn-t'), "mouse");
            // return here, because activating the button will update filters again
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
        // If we have a item id we are filtering for and change the drop down catagory then clear m_filterItemId
        // If the item changed under us and is not valid then also clear the m_filterItemId
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
        $.DispatchEvent('SetInventoryFilter', elItemList, 'any', 'any', 'any', sortType, loadoutSlotParams, '' // text filter
        );
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
                // grenades and equipment are non interactive
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
        // Only show the popup if it failed but we thought it was possible.
        if (!bSuccess && LoadoutAPI.CanEquipItemInSlot(szTeam, szItemID, szSlot)) {
            UiToolkitAPI.ShowGenericPopupOk($.Localize('#LoadoutLockedPopupTitle'), $.Localize('#LoadoutLockedPopupText'), '', () => { });
        }
        return bSuccess;
    }
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        $.RegisterEventHandler('ReadyForDisplay', $.GetContextPanel(), OnReadyForDisplay);
        $.RegisterEventHandler('UnreadyForDisplay', $.GetContextPanel(), OnUnreadyForDisplay);
        $.RegisterForUnhandledEvent('LoadoutFilterByItemType', FilterByItemType);
        $.RegisterEventHandler('CSGOInventoryItemLoaded', $.GetContextPanel(), OnItemTileLoaded);
        $.RegisterForUnhandledEvent('ShowLoadoutForItem', ShowLoadoutForItem);
    }
})(LoadoutGrid || (LoadoutGrid = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZG91dF9ncmlkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvbG9hZG91dF9ncmlkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFDbEMsbUNBQW1DO0FBQ25DLDJDQUEyQztBQUMzQyxrREFBa0Q7QUFDbEQsNkNBQTZDO0FBRTdDLElBQVUsV0FBVyxDQWcwQ3BCO0FBaDBDRCxXQUFVLFdBQVc7SUFFcEIsSUFBSSxpQkFBaUIsR0FBRyxLQUFLLENBQUM7SUFDOUIsSUFBSSx5QkFBd0MsQ0FBQztJQUM3QyxJQUFJLDBCQUF5QyxDQUFDO0lBQzlDLElBQUkseUJBQXdDLENBQUM7SUFDN0MsSUFBSSxjQUEwQixDQUFDO0lBQy9CLElBQUksZUFBdUIsQ0FBQztJQUM1QixJQUFJLGNBQXVCLENBQUM7SUFDNUIsSUFBSSxZQUFvQixDQUFDO0lBQ3pCLElBQUksY0FBYyxHQUFXLEVBQUUsQ0FBQztJQUNoQyxJQUFJLDhCQUE4QixHQUFZLEtBQUssQ0FBQztJQUVwRCxJQUFJLGVBQWUsR0FBRztRQUNyQixDQUFDLEVBQUUsRUFBRTtRQUNMLEVBQUUsRUFBRSxFQUFFO1FBQ04sTUFBTSxFQUFFLEVBQUU7S0FDVixDQUFDO0lBRUYsSUFBSSxxQkFBcUIsR0FBRztRQUMzQixDQUFDLEVBQUUsRUFBRTtRQUNMLEVBQUUsRUFBRSxFQUFFO1FBQ04sTUFBTSxFQUFFLEVBQUU7S0FDVixDQUFDO0lBRUYsSUFBSSxxQkFBcUIsR0FBRztRQUMzQixDQUFDLEVBQUUsRUFBRTtRQUNMLEVBQUUsRUFBRSxFQUFFO1FBQ04sTUFBTSxFQUFFLEVBQUU7S0FDVixDQUFDO0lBRUYsSUFBSSxjQUFjLEdBQUc7UUFDcEIsQ0FBQyxFQUFFLEVBQUU7UUFDTCxFQUFFLEVBQUUsRUFBRTtRQUNOLE1BQU0sRUFBRSxFQUFFO0tBQ1YsQ0FBQztJQUVGLG1EQUFtRDtJQUNuRCxNQUFN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