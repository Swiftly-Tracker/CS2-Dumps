"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="iteminfo.ts" />
/// <reference path="../generated/items_event_current_generated_store.ts" />
var ItemContextEntries;
(function (ItemContextEntries) {
    function FilterEntries(id, populateFilterText) {
        const bHasFilter = populateFilterText !== "(not found)";
        return _Entries.filter((entry) => {
            // exclusive only
            if (entry.exclusiveFilter) {
                if (!entry.exclusiveFilter.includes(populateFilterText))
                    return false;
            }
            // filter if specified
            else if (bHasFilter && entry.populateFilter) {
                if (!entry.populateFilter.includes(populateFilterText))
                    return false;
            }
            // if we don't have filter, just include everything that's not exclusive
            else {
                if (bHasFilter)
                    return false;
            }
            // actions must opt-in to rental items, by default rentals don't have any actions
            if (!entry.bActionIsRentalAware && InventoryAPI.IsRental(id))
                return false;
            // filter by availability
            return entry.AvailableForItem(id);
        });
    }
    ItemContextEntries.FilterEntries = FilterEntries;
    //--------------------------------------------------------------------------------------------------
    // Define new context menu entries here.
    // Uses iteminfo.ts to get items info for from item ids
    // ItemInfo is a part of the script and you need to include it
    //--------------------------------------------------------------------------------------------------
    const _Entries = [
        /*
            {
                name: 'example', // Name must match the tail of the loc token for this entry
                populateFilter: ['bla'], // always include unless filter is specified
                exclusiveFilter: ['exclusive'], // only include this if matching filter is specified
                AvailableForItem: ( id ) => {
                    // Decide if this context menu entry should show up for this item
                    return true;
                },
                OnSelected: ( id ) => {
                    // Called when the entry is selected
                }
            },
        */
        //DEVONLY{
        {
            name: '_DEV_DELETE_ITEM',
            populateFilter: ['loadout', 'loadout_slot_t', 'loadout_slot_ct'],
            AvailableForItem: (id) => parseInt(GameInterfaceAPI.GetSettingString('dev_delete_items_allowed')) > 0,
            OnSelected: (id) => {
                $.DispatchEvent('ContextMenuEvent', '');
                InventoryAPI.DeleteItem(id);
            }
        },
        //}DEVONLY
        {
            name: 'preview',
            populateFilter: ['lootlist', 'loadout', 'loadout_slot_t', 'loadout_slot_ct', 'tradeup_items', 'tradeup_ingredients'],
            bActionIsRentalAware: true,
            AvailableForItem: (id) => {
                // Special inspect to see the total number of charm pliers owned
                if (InventoryAPI.DoesItemMatchDefinitionByName(id, "Remove Keychain Tool"))
                    return true;
                if (InventoryAPI.DoesItemMatchDefinitionByName(id, "sticker_display_case"))
                    return true;
                // Anything with an equip slot has a preview, as well as stickers
                return ItemInfo.IsPreviewable(id);
            },
            OnSelected: (id, contextmenuparam) => {
                $.DispatchEvent('ContextMenuEvent', '');
                $.DispatchEvent("InventoryItemPreview", id, contextmenuparam);
            }
        },
        {
            name: 'view_highlight_reel',
            populateFilter: ['loadout', 'loadout_slot_t', 'loadout_slot_ct'],
            AvailableForItem: (id) => {
                return !!InventoryAPI.GetItemAttributeValue(id, '{uint32}keychain slot 0 highlight');
            },
            OnSelected: (id) => {
                const reelId = InventoryAPI.GetItemAttributeValue(id, '{uint32}keychain slot 0 highlight');
                UiToolkitAPI.ShowCustomLayoutPopupParameters('popup-videoclip-' + reelId, 'file://{resources}/layout/popups/popup_videoclip.xml', 'reelid=' + reelId + '&' +
                    'itemid=' + id);
                $.DispatchEvent('ContextMenuEvent', '');
            }
        },
        {
            name: 'open_season_stats_panel',
            populateFilter: ['loadout', 'loadout_slot_t', 'loadout_slot_ct'],
            AvailableForItem: (id) => {
                return (ItemInfo.ItemDefinitionNameStartsWith(id, 'premier season coin'));
            },
            OnSelected: (id) => {
                const season = InventoryAPI.GetItemAttributeValue(id, 'premier season');
                UiToolkitAPI.ShowCustomLayoutPopupParameters('id-popup-season-stats', 'file://{resources}/layout/popups/popup_season_stats.xml', 'seasonid=' + season + '&' +
                    'itemid=' + id);
                $.DispatchEvent('ContextMenuEvent', '');
            }
        },
        {
            name: 'bulkretrieve',
            populateFilter: ['loadout', 'loadout_slot_t', 'loadout_slot_ct'],
            AvailableForItem: (id) => {
                // Caskets have bulk retrieve operation too
                const defName = InventoryAPI.GetItemDefinitionName(id);
                return (defName === 'casket') && !!InventoryAPI.GetItemAttributeValue(id, 'modification date');
            },
            OnSelected: (id) => {
                $.DispatchEvent('ContextMenuEvent', '');
                const defName = InventoryAPI.GetItemDefinitionName(id);
                if (defName === 'casket') { // Caskets have custom preview
                    if (InventoryAPI.GetItemAttributeValue(id, 'items count')) {
                        // Do the popup
                        UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_casket_operation.xml', 'op=loadcontents' +
                            '&nextcapability=casketretrieve' +
                            '&spinner=1' +
                            '&casket_item_id=' + id +
                            '&subject_item_id=' + id);
                    }
                    else {
                        UiToolkitAPI.ShowGenericPopupOk($.Localize('#popup_casket_title_error_casket_empty'), $.Localize('#popup_casket_message_error_casket_empty'), '', () => { });
                    }
                    return;
                }
            }
        },
        {
            name: 'bulkstore',
            populateFilter: ['loadout', 'loadout_slot_t', 'loadout_slot_ct'],
            style: (id) => 'BottomSeparator',
            AvailableForItem: (id) => {
                // Caskets have bulk retrieve operation too
                const defName = InventoryAPI.GetItemDefinitionName(id);
                return (defName === 'casket') && !!InventoryAPI.GetItemAttributeValue(id, 'modification date');
            },
            OnSelected: (id) => {
                $.DispatchEvent('ContextMenuEvent', '');
                const defName = InventoryAPI.GetItemDefinitionName(id);
                if (defName === 'casket') { // Bulk load items into casket
                    $.DispatchEvent('ShowSelectItemForCapabilityPopup', id, '', 'casketstore');
                }
            }
        },
        {
            name: 'openloadout',
            style: (id) => 'TopSeparator',
            bActionIsRentalAware: true,
            AvailableForItem: (id) => !!InventoryAPI.GetRawDefinitionKey(id, 'flexible_loadout_group'),
            OnSelected: (id) => {
                $.DispatchEvent('ContextMenuEvent', '');
                $.DispatchEvent("ShowLoadoutForItem", id);
            }
        },
        {
            name: 'swap_finish_both',
            populateFilter: ['inspect', 'loadout', 'loadout_slot_t', 'loadout_slot_ct'],
            bActionIsRentalAware: true,
            AvailableForItem: (id) => _CanSwapFinish(id, 'ct') && _CanSwapFinish(id, 't'),
            OnSelected: (id) => {
                $.DispatchEvent('ContextMenuEvent', '');
                EquipItem(id, ['ct', 't']);
            }
        },
        {
            // Replace CT item (that is already equipped but a different finish)
            // this is also the context item for gloves/agents/musickits/etc
            // no further input needed
            name: 'swap_finish_ct',
            CustomName: (id) => GetItemToReplaceName(id, 'ct'),
            populateFilter: ['inspect', 'loadout', 'loadout_slot_t', 'loadout_slot_ct'],
            bActionIsRentalAware: true,
            AvailableForItem: (id) => _CanSwapFinish(id, 'ct'),
            OnSelected: (id) => {
                $.DispatchEvent('ContextMenuEvent', '');
                EquipItem(id, ['ct']);
            }
        },
        {
            // Replace T item (that is already equipped but a different finish)
            // no further input needed
            name: 'swap_finish_t',
            CustomName: (id) => GetItemToReplaceName(id, 't'),
            populateFilter: ['inspect', 'loadout', 'loadout_slot_t', 'loadout_slot_ct'],
            bActionIsRentalAware: true,
            AvailableForItem: (id) => _CanSwapFinish(id, 't'),
            OnSelected: (id) => {
                $.DispatchEvent('ContextMenuEvent', '');
                EquipItem(id, ['t']);
            }
        },
        {
            name: 'flair',
            populateFilter: ['inspect', 'loadout', 'loadout_slot_t', 'loadout_slot_ct'],
            bActionIsRentalAware: true,
            AvailableForItem: (id) => {
                return InventoryAPI.GetDefaultSlot(id) === 'flair0' && (!InventoryAPI.IsEquipped(id, "noteam") || (InventoryAPI.GetRawDefinitionKey(id, 'item_sub_position2') !== ''));
            },
            OnSelected: (id) => {
                $.DispatchEvent('ContextMenuEvent', '');
                EquipItem(id, ['noteam']);
            }
        },
        {
            // Replace spray item weapon
            name: 'equip_spray',
            populateFilter: ['inspect', 'loadout', 'loadout_slot_t', 'loadout_slot_ct'],
            AvailableForItem: (id) => ItemInfo.IsSprayPaint(id) && !InventoryAPI.IsEquipped(id, "noteam"),
            OnSelected: (id) => {
                $.DispatchEvent('ContextMenuEvent', '');
                EquipItem(id, ['noteam'], 'spray0');
            }
        },
        {
            // Replace spray item weapon
            name: 'equip_tournament_spray',
            populateFilter: ['inspect', 'loadout', 'loadout_slot_t', 'loadout_slot_ct'],
            AvailableForItem: (id) => {
                return (ItemInfo.ItemDefinitionNameSubstrMatch(id, 'tournament_journal_') && (InventoryAPI.GetRawDefinitionKey(id, 'item_sub_position2') === 'spray0'));
            },
            OnSelected: (id) => {
                $.DispatchEvent('ContextMenuEvent', '');
                UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_tournament_select_spray.xml', 'journalid=' + id);
            }
        },
        {
            //Musickit
            name: 'equip_musickit',
            CustomName: (id) => GetItemToReplaceName(id, 'noteam'),
            populateFilter: ['inspect', 'loadout', 'loadout_slot_t', 'loadout_slot_ct'],
            bActionIsRentalAware: true,
            AvailableForItem: (id) => InventoryAPI.GetDefaultSlot(id) === 'musickit' && !InventoryAPI.IsEquipped(id, "noteam"),
            OnSelected: (id) => {
                $.DispatchEvent('ContextMenuEvent', '');
                const isMusicvolumeOn = InventoryAPI.TestMusicVolume();
                if (isMusicvolumeOn) {
                    $.DispatchEvent('CSGOPlaySoundEffect', 'equip_musickit', 'MOUSE');
                    EquipItem(id, ['noteam']);
                }
            }
        },
        {
            name: 'unequip',
            populateFilter: ['inspect', 'loadout', 'loadout_slot_t', 'loadout_slot_ct'],
            bActionIsRentalAware: true,
            AvailableForItem: (id) => {
                let availableForSlots = ['flair0', 'spray0'];
                return InventoryAPI.IsEquipped(id, "noteam") && availableForSlots.includes(InventoryAPI.GetDefaultSlot(id));
            },
            OnSelected: (id) => {
                $.DispatchEvent('ContextMenuEvent', '');
                TryEquipItemInSlot('noteam', '0', InventoryAPI.GetDefaultSlot(id));
            },
        },
        {
            name: 'open_watch_panel_pickem',
            AvailableForItem: (id) => {
                if (GameStateAPI.GetMapBSPName()) // not available when connected to a server
                    return false;
                return (ItemInfo.ItemDefinitionNameSubstrMatch(id, 'tournament_journal_') && (InventoryAPI.GetRawDefinitionKey(id, 'item_sub_position2') === 'spray0'));
            },
            OnSelected: (id) => {
                $.DispatchEvent('OpenWatchMenu');
                $.DispatchEvent('ShowActiveTournamentPage', '');
                $.DispatchEvent('ContextMenuEvent', '');
            }
        },
        {
            name: 'getprestige',
            AvailableForItem: (id) => {
                return (ItemInfo.ItemDefinitionNameSubstrMatch(id, 'xpgrant') &&
                    (FriendsListAPI.GetFriendLevel(MyPersonaAPI.GetXuid()) >= InventoryAPI.GetMaxLevel()));
            },
            OnSelected: (id) => {
                const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_inventory_inspect.xml');
                let oSettings = {
                    item_id: '0',
                    show_work_type_warning: false,
                    work_type: 'prestigecheck'
                };
                elPanel.Data().oSettings = oSettings;
                $.DispatchEvent('ContextMenuEvent', '');
            }
        },
        {
            name: (id) => InventoryAPI.IsRental(id) ? 'preview' : 'useitem',
            bActionIsRentalAware: true,
            AvailableForItem: (id) => {
                if (ItemInfo.ItemDefinitionNameSubstrMatch(id, 'tournament_pass_'))
                    return true;
                if (ItemInfo.ItemDefinitionNameSubstrMatch(id, 'XpShopTicket'))
                    return true;
                if (ItemInfo.ItemDefinitionNameSubstrMatch(id, 'Remove Keychain Tool '))
                    return true; // extra space is intentional, there's a default contract named without the space which we don't want
                if (ItemInfo.ItemDefinitionNameSubstrMatch(id, 'xpgrant')) { // see 'getprestige' above for when user needs to prestige first
                    return (FriendsListAPI.GetFriendLevel(MyPersonaAPI.GetXuid()) < InventoryAPI.GetMaxLevel());
                }
                if (!InventoryAPI.IsTool(id))
                    return false;
                const season = InventoryAPI.GetItemAttributeValue(id, 'season access');
                if (season != undefined)
                    return true; // this is an operation ticket pass
                return false;
            },
            OnSelected: (id) => {
                if (InventoryAPI.IsRental(id)) {
                    const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_inventory_inspect.xml');
                    let oSettings = {
                        item_id: id,
                        inspect_only: true
                    };
                    elPanel.Data().oSettings = oSettings;
                }
                else if (ItemInfo.ItemDefinitionNameSubstrMatch(id, 'tournament_pass_') && !ItemInfo.ItemDefinitionNameSubstrMatch(id, '_credits')) {
                    const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_capability_decodable.xml');
                    let oSettings = {
                        item_id: id,
                        work_type: 'decodeable'
                    };
                    elPanel.Data().oSettings = oSettings;
                }
                else {
                    const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_inventory_inspect.xml');
                    let oSettings = {
                        item_id: id,
                        work_type: 'useitem'
                    };
                    elPanel.Data().oSettings = oSettings;
                }
                $.DispatchEvent('ContextMenuEvent', '');
            }
        },
        {
            name: 'usespray',
            populateFilter: ['inspect'],
            AvailableForItem: (id) => ItemInfo.IsSpraySealed(id),
            OnSelected: (id) => {
                const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_capability_decodable.xml');
                let oSettings = {
                    item_id: id,
                    work_type: 'decodeable'
                };
                elPanel.Data().oSettings = oSettings;
                $.DispatchEvent('ContextMenuEvent', '');
            }
        },
        {
            name: 'secure_connection_line',
            AvailableForItem: (id) => {
                return ItemInfo.ItemHasCapability(id, 'decodable') &&
                    !!InventoryAPI.GetItemAttributeValue(id, '{uint32}volatile container') &&
                    InventoryAPI.IsRental(id) &&
                    (InventoryAPI.GetItemQuality(id) === 14); // AE_VOLATILE (quality#14)
            },
            bActionIsRentalAware: true,
            OnSelected: (id) => {
                $.DispatchEvent('ContextMenuEvent', '');
                const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('popup-inspect-' + id, 'file://{resources}/layout/popups/popup_offers_laptop.xml');
                let oSettings = {
                    item_id: id,
                    work_type: 'decodeable',
                };
                elPanel.Data().oSettings = oSettings;
            }
        },
        {
            name: (id) => {
                if (InventoryAPI.GetItemAttributeValue(id, '{uint32}volatile container'))
                    return InventoryAPI.IsRental(id) ? 'inspect_contents' : 'open_terminal';
                else if (InventoryAPI.GetDecodeableRestriction(id) === 'restricted' && !InventoryAPI.IsTool(id) && !InventoryAPI.CanOpenForRental(id))
                    return 'look_inside';
                else if (InventoryAPI.IsRental(id))
                    return 'look_inside';
                else
                    return 'open_package';
            },
            AvailableForItem: (id) => {
                return ItemInfo.ItemHasCapability(id, 'decodable');
            },
            bActionIsRentalAware: true,
            OnSelected: (id) => {
                $.DispatchEvent('ContextMenuEvent', '');
                if (InventoryAPI.GetItemAttributeValue(id, '{uint32}volatile container')
                    && InventoryAPI.IsRental(id)) {
                    $.DispatchEvent("LootlistItemPreview", InventoryAPI.GetLootListItemIdByIndex(id, 0), id +
                        ',' + id);
                    return;
                }
                if (InventoryAPI.GetChosenActionItemsCount(id, 'decodable') === 0) {
                    if (InventoryAPI.IsTool(id)) {
                        // User has no cases to this key, still show the empty dialog
                        $.DispatchEvent('ShowSelectItemForCapabilityPopup', id, '', 'decodable');
                    }
                    else if (InventoryAPI.GetItemAttributeValue(id, '{uint32}volatile container')) {
                        const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('popup-inspect-' + id, 'file://{resources}/layout/popups/popup_offers_laptop.xml');
                        let oSettings = {
                            item_id: id,
                            work_type: 'decodeable',
                        };
                        elPanel.Data().oSettings = oSettings;
                        return;
                    }
                    else {
                        const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('popup-inspect-' + id, 'file://{resources}/layout/popups/popup_capability_decodable.xml');
                        let oSettings = {
                            item_id: id,
                            work_type: 'decodeable'
                        };
                        elPanel.Data().oSettings = oSettings;
                    }
                    $.DispatchEvent('ContextMenuEvent', '');
                    return;
                }
                $.DispatchEvent('ShowSelectItemForCapabilityPopup', id, '', 'decodable');
            }
        },
        {
            name: (id) => {
                if (InventoryAPI.IsRental(id))
                    return 'preview';
                if (InventoryAPI.GetItemDefinitionName(id) === 'casket') {
                    // This is a freshly purchased casket, user must give it a name (which also makes it non-refundable)
                    return InventoryAPI.GetItemAttributeValue(id, 'modification date') ? 'yourcasket' : 'newcasket';
                }
                return 'nameable';
            },
            style: (id) => {
                const defName = InventoryAPI.GetItemDefinitionName(id);
                return (defName === 'casket' || defName === 'Name Tag') ? '' : 'TopSeparator';
            },
            bActionIsRentalAware: true,
            AvailableForItem: (id) => {
                if (InventoryAPI.IsRental(id))
                    return InventoryAPI.IsTool(id) && ItemInfo.ItemHasCapability(id, 'nameable');
                return ItemInfo.ItemHasCapability(id, 'nameable');
            },
            OnSelected: (id) => {
                if (InventoryAPI.IsRental(id)) {
                    $.DispatchEvent('ContextMenuEvent', '');
                    const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_inventory_inspect.xml');
                    let oSettings = {
                        item_id: id,
                        inspect_only: true
                    };
                    elPanel.Data().oSettings = oSettings;
                }
                else if (InventoryAPI.GetItemDefinitionName(id) === 'casket') {
                    // This is a freshly purchased casket, user must give it a name (which also makes it non-refundable)
                    const fauxNameTag = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(1200, 0); // "Name Tag"
                    const noteText = InventoryAPI.GetItemAttributeValue(id, 'modification date') ? 'yourcasket' : 'newcasket';
                    $.DispatchEvent('ContextMenuEvent', '');
                    const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_capability_nameable.xml');
                    let oSettings = {
                        item_id: id,
                        tool_id: fauxNameTag,
                        work_type: 'nameable',
                        async_work_type_warning_text: '#popup_' + noteText + '_warning'
                    };
                    elPanel.Data().oSettings = oSettings;
                }
                else if (DoesNotHaveChosenActionItems(id, 'nameable')) {
                    const nameTagId = '', itemToNameId = id;
                    const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_capability_nameable.xml');
                    let oSettings = {
                        item_id: itemToNameId,
                        tool_id: nameTagId,
                        work_type: 'nameable'
                    };
                    elPanel.Data().oSettings = oSettings;
                }
                else {
                    $.DispatchEvent('ShowSelectItemForCapabilityPopup', id, '', 'nameable');
                    $.DispatchEvent('ContextMenuEvent', '');
                }
            }
        },
        {
            // Actual keychain not weapon that has 'can keychain' capability
            name: (id) => InventoryAPI.IsRental(id) ? 'preview_can_keychain' : 'can_keychain',
            populateFilter: ['inspect', 'preview', 'loadout', 'loadout_slot_t', 'loadout_slot_ct'],
            bActionIsRentalAware: true,
            AvailableForItem: (id) => ItemInfo.IsKeychain(id) && ItemInfo.ItemHasCapability(id, 'can_keychain'),
            OnSelected: (id) => {
                $.DispatchEvent('CSGOPlaySoundEffect', 'sticker_applySticker', 'MOUSE');
                $.DispatchEvent('ShowSelectItemForCapabilityPopup', id, '', 'can_keychain');
                $.DispatchEvent('ContextMenuEvent', '');
            }
        },
        {
            name: 'can_unwrap_sticker',
            style: (id) => 'TopSeparator',
            populateFilter: ['loadout', 'loadout_slot_t', 'loadout_slot_ct'],
            AvailableForItem: (id) => ItemInfo.IsKeychain(id) && ItemInfo.ItemHasCapability(id, 'can_keychain') &&
                !!InventoryAPI.GetItemAttributeValue(id, '{uint32}keychain slot 0 sticker'),
            OnSelected: (id) => {
                $.DispatchEvent('CSGOPlaySoundEffect', 'sticker_applySticker', 'MOUSE');
                $.DispatchEvent('ContextMenuEvent', '');
                const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('popup-inspect-' + id, 'file://{resources}/layout/popups/popup_capability_can_keychain.xml');
                let oSettings = {
                    popup_panel: elPanel,
                    item_id: id,
                    work_type: 'can_wrap_sticker'
                };
                elPanel.Data().oSettings = oSettings;
            }
        },
        {
            name: 'can_keychain',
            populateFilter: ['loadout', 'loadout_slot_t', 'loadout_slot_ct'],
            AvailableForItem: (id) => {
                return ItemInfo.ItemHasCapability(id, 'can_keychain') &&
                    InventoryAPI.GetItemKeychainSlotCount(id) > InventoryAPI.GetItemKeychainCount(id);
            },
            OnSelected: (id) => {
                $.DispatchEvent('CSGOPlaySoundEffect', 'sticker_applySticker', 'MOUSE');
                $.DispatchEvent('ShowSelectItemForCapabilityPopup', id, '', 'can_keychain');
                $.DispatchEvent('ContextMenuEvent', '');
            }
        },
        {
            name: 'remove_keychain',
            AvailableForItem: (id) => InventoryAPI.DoesItemMatchDefinitionByName(id, "Remove Keychain Tool"),
            OnSelected: (id) => {
                $.DispatchEvent('ContextMenuEvent', '');
                $.DispatchEvent('ShowSelectItemForCapabilityPopup', id, '', 'remove_keychain');
            }
        },
        {
            name: 'remove_keychain',
            populateFilter: ['loadout', 'loadout_slot_t', 'loadout_slot_ct'],
            AvailableForItem: (id) => ItemInfo.ItemHasCapability(id, 'can_keychain') && InventoryAPI.GetItemKeychainCount(id) > 0,
            OnSelected: (id) => {
                $.DispatchEvent('ContextMenuEvent', '');
                const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_capability_can_keychain.xml');
                let oSettings = {
                    popup_panel: elPanel,
                    item_id: id,
                    work_type: 'remove_keychain'
                };
                elPanel.Data().oSettings = oSettings;
            }
        },
        {
            // Actual sticker not weapon that has 'can sticker' capability
            name: (id) => InventoryAPI.IsRental(id) ? 'preview_can_sticker' : 'can_sticker',
            populateFilter: ['inspect', 'preview', 'loadout', 'loadout_slot_t', 'loadout_slot_ct'],
            bActionIsRentalAware: true,
            AvailableForItem: (id) => ItemInfo.IsSticker(id) && ItemInfo.ItemHasCapability(id, 'can_sticker'),
            OnSelected: (id) => {
                $.DispatchEvent('CSGOPlaySoundEffect', 'sticker_applySticker', 'MOUSE');
                $.DispatchEvent('ContextMenuEvent', '');
                $.DispatchEvent('ShowSelectItemForCapabilityPopup', id, '', 'can_sticker');
            }
        },
        {
            name: 'can_sticker',
            populateFilter: ['loadout', 'loadout_slot_t', 'loadout_slot_ct'],
            AvailableForItem: (id) => {
                return ItemInfo.ItemHasCapability(id, 'can_sticker') &&
                    InventoryAPI.GetItemStickerSlotCount(id) > InventoryAPI.GetItemStickerCount(id);
            },
            OnSelected: (id) => {
                $.DispatchEvent('CSGOPlaySoundEffect', 'sticker_applySticker', 'MOUSE');
                $.DispatchEvent('ContextMenuEvent', '');
                $.DispatchEvent('ShowSelectItemForCapabilityPopup', id, '', 'can_sticker');
            }
        },
        {
            name: 'can_wrap_sticker',
            populateFilter: ['inspect', 'loadout', 'loadout_slot_t', 'loadout_slot_ct'],
            AvailableForItem: (id) => {
                return InventoryAPI.DoesItemMatchDefinitionByName(id, "sticker_display_case");
            },
            OnSelected: (id) => {
                $.DispatchEvent('CSGOPlaySoundEffect', 'sticker_applySticker', 'MOUSE');
                $.DispatchEvent('ContextMenuEvent', '');
                $.DispatchEvent('ShowSelectItemForCapabilityPopup', id, '', 'can_wrap_sticker');
            }
        },
        {
            name: 'wrap_sticker',
            populateFilter: ['loadout', 'loadout_slot_t', 'loadout_slot_ct'],
            AvailableForItem: (id) => {
                return ItemInfo.ItemHasCapability(id, 'can_wrap_sticker') &&
                    !InventoryAPI.DoesItemMatchDefinitionByName(id, "sticker_display_case");
            },
            OnSelected: (id) => {
                $.DispatchEvent('CSGOPlaySoundEffect', 'sticker_applySticker', 'MOUSE');
                $.DispatchEvent('ContextMenuEvent', '');
                if (InventoryAPI.GetChosenActionItemsCount(id, 'can_wrap_sticker') > 0) { // pick the pouch to wrap around our sticker
                    $.DispatchEvent('ShowSelectItemForCapabilityPopup', id, '', 'can_wrap_sticker');
                }
                else { // buy a pouch that we sell from in-game store
                    const defidxWrapper = InventoryAPI.GetItemDefinitionIndexFromDefinitionName("sticker_display_case");
                    const fauxCasket = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(defidxWrapper, 0); // "casket"
                    /*
                    const boundSticker = InventoryAPI.GetItemAttributeValue( id, '{uint32}sticker slot 0 id' ) as number;
                    const inspectSticker = `{ "keychain slot 0 sticker": ${boundSticker} }`;
                    UiToolkitAPI.ShowCustomLayoutPopupParameters(
                        '',
                        'file://{resources}/layout/popups/popup_inventory_inspect.xml',
                        'itemid=' + fauxCasket
                        + '&' +
                        'inspect-attributes=' + inspectSticker
                        + '&' +
                        'inspectonly=false'
                        + '&' +
                        'asyncworkitemwarning=no'
                        + '&' +
                        'storeitemid=' + fauxCasket
                    );
                    */
                    const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('popup-inspect-' + id, 'file://{resources}/layout/popups/popup_capability_can_keychain.xml');
                    let oSettings = {
                        popup_panel: elPanel,
                        tool_id: id,
                        item_id: fauxCasket,
                        work_type: 'can_wrap_sticker'
                    };
                    elPanel.Data().oSettings = oSettings;
                }
            }
        },
        {
            name: 'remove_sticker',
            populateFilter: ['loadout', 'loadout_slot_t', 'loadout_slot_ct'],
            AvailableForItem: (id) => ItemInfo.ItemHasCapability(id, 'can_sticker') && InventoryAPI.GetItemStickerCount(id) > 0,
            OnSelected: (id) => {
                $.DispatchEvent('ContextMenuEvent', '');
                const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_capability_can_sticker.xml');
                let oSettings = {
                    popup_panel: elPanel,
                    item_id: id,
                    work_type: 'remove_sticker'
                };
                elPanel.Data().oSettings = oSettings;
            }
        },
        {
            // Actual patch not agent that has 'can patch' capability
            name: (id) => InventoryAPI.IsRental(id) ? 'preview_can_patch' : 'can_patch',
            populateFilter: ['inspect', 'preview', 'loadout', 'loadout_slot_t', 'loadout_slot_ct'],
            bActionIsRentalAware: true,
            AvailableForItem: (id) => ItemInfo.IsPatch(id) && ItemInfo.ItemHasCapability(id, 'can_patch'),
            OnSelected: (id) => {
                $.DispatchEvent('CSGOPlaySoundEffect', 'sticker_applySticker', 'MOUSE');
                $.DispatchEvent('ContextMenuEvent', '');
                $.DispatchEvent('ShowSelectItemForCapabilityPopup', id, '', 'can_patch');
            }
        },
        {
            name: 'can_patch',
            populateFilter: ['loadout', 'loadout_slot_t', 'loadout_slot_ct'],
            AvailableForItem: (id) => {
                return ItemInfo.ItemHasCapability(id, 'can_patch') &&
                    InventoryAPI.GetItemStickerSlotCount(id) > InventoryAPI.GetItemStickerCount(id);
            },
            OnSelected: (id) => {
                $.DispatchEvent('CSGOPlaySoundEffect', 'sticker_applySticker', 'MOUSE');
                $.DispatchEvent('ContextMenuEvent', '');
                $.DispatchEvent('ShowSelectItemForCapabilityPopup', id, '', 'can_patch');
            }
        },
        {
            name: 'remove_patch',
            AvailableForItem: (id) => ItemInfo.ItemHasCapability(id, 'can_patch') && InventoryAPI.GetItemStickerCount(id) > 0,
            OnSelected: (id) => {
                $.DispatchEvent('ContextMenuEvent', '');
                const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_capability_can_patch.xml');
                let oSettings = {
                    item_id: id,
                    work_type: 'remove_patch'
                };
                elPanel.Data().oSettings = oSettings;
            }
        },
        {
            name: 'recipe',
            AvailableForItem: (id) => ItemInfo.IsRecipe(id),
            OnSelected: (id) => $.DispatchEvent('ContextMenuEvent', ''),
        },
        {
            name: (id) => InventoryAPI.IsRental(id) ? 'preview' : 'can_stattrack_swap',
            AvailableForItem: (id) => ItemInfo.ItemHasCapability(id, 'can_stattrack_swap') && InventoryAPI.IsTool(id),
            bActionIsRentalAware: true,
            OnSelected: (id) => {
                if (InventoryAPI.IsRental(id)) {
                    const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_inventory_inspect.xml');
                    let oSettings = {
                        item_id: id,
                        inspect_only: true
                    };
                    elPanel.Data().oSettings = oSettings;
                }
                else {
                    $.DispatchEvent('ShowSelectItemForCapabilityPopup', id, '', 'can_stattrack_swap');
                }
                $.DispatchEvent('ContextMenuEvent', '');
            }
        },
        {
            //Trade up add
            name: 'tradeup_add',
            populateFilter: ['tradeup_items'],
            AvailableForItem: (id) => {
                const slot = InventoryAPI.GetDefaultSlot(id);
                return !!slot && slot !== "melee" && slot !== "c4" && slot !== "clothing_hands" && !ItemInfo.IsEquippalbleButNotAWeapon(id) &&
                    (InventoryAPI.CanTradeUp(id) || InventoryAPI.GetNumItemsNeededToTradeUp(id) > 0);
            },
            OnSelected: (id) => {
                $.DispatchEvent('ContextMenuEvent', '');
                InventoryAPI.AddCraftIngredient(id);
            }
        },
        {
            //Trade up remove
            name: 'tradeup_remove',
            exclusiveFilter: ['tradeup_ingredients'],
            AvailableForItem: (id) => {
                const slot = InventoryAPI.GetDefaultSlot(id);
                return !!slot && slot !== "melee" && slot !== "c4" && slot !== "clothing_hands" && !ItemInfo.IsEquippalbleButNotAWeapon(id);
            },
            OnSelected: (id) => {
                $.DispatchEvent('ContextMenuEvent', '');
                InventoryAPI.RemoveCraftIngredient(id);
            }
        },
        {
            // open tradeup contract
            name: 'open_contract',
            AvailableForItem: (id) => ItemInfo.IsTradeUpContract(id),
            OnSelected: (id) => {
                $.DispatchEvent('ShowTradeUpPanel');
                $.DispatchEvent('ContextMenuEvent', '');
            }
        },
        {
            name: 'usegift',
            AvailableForItem: (id) => InventoryAPI.GetToolType(id) === 'gift',
            OnSelected: (id) => {
                $.DispatchEvent('ContextMenuEvent', '');
                const CapDisabledMessage = InventoryAPI.GetItemCapabilityDisabledMessageByIndex(id, 0);
                if (CapDisabledMessage === "") {
                    // No error so go ahead and give the gift.
                    const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_inventory_inspect.xml');
                    let oSettings = {
                        item_id: id,
                        show_work_type_warning: false,
                        work_type: 'usegift'
                    };
                    elPanel.Data().oSettings = oSettings;
                }
                else {
                    const capDisabledMessage = InventoryAPI.GetItemCapabilityDisabledMessageByIndex(id, 0);
                    UiToolkitAPI.ShowGenericPopupOk($.Localize('#inv_context_usegift'), $.Localize(capDisabledMessage), '', () => { });
                }
            }
        },
        {
            name: 'add_to_favorites_both',
            style: (id) => 'TopSeparator',
            populateFilter: ['inspect', 'loadout', 'loadout_slot_t', 'loadout_slot_ct'],
            bActionIsRentalAware: true,
            AvailableForItem: (id) => CanAddToFavorites(id, 't') && CanAddToFavorites(id, 'ct'),
            OnSelected: (id) => {
                $.DispatchEvent('ContextMenuEvent', '');
                InventoryAPI.AddItemToFavorites('ct', id);
                InventoryAPI.AddItemToFavorites('t', id);
            },
        },
        {
            name: 'add_to_favorites_ct',
            style: (id) => {
                // If we can also add this item to T favorites then use the add_to_favorites_both TopSeparator
                if (CanAddToFavorites(id, 't'))
                    return '';
                return 'TopSeparator';
            },
            populateFilter: ['inspect', 'loadout', 'loadout_slot_t', 'loadout_slot_ct'],
            bActionIsRentalAware: true,
            AvailableForItem: id => CanAddToFavorites(id, 'ct'),
            OnSelected: id => {
                $.DispatchEvent('ContextMenuEvent', '');
                InventoryAPI.AddItemToFavorites('ct', id);
            },
        },
        {
            name: 'remove_from_favorites_ct',
            style: (id) => 'TopSeparator',
            populateFilter: ['inspect', 'loadout', 'loadout_slot_t', 'loadout_slot_ct'],
            bActionIsRentalAware: true,
            AvailableForItem: (id) => InventoryAPI.ItemIsInFavorites('ct', id),
            OnSelected: (id) => {
                $.DispatchEvent('ContextMenuEvent', '');
                InventoryAPI.RemoveItemFromFavorites('ct', id);
            },
        },
        {
            name: 'add_to_favorites_t',
            style: (id) => {
                // If we can add to or remove from CT favorites then use that TopSeparator
                if (CanAddToFavorites(id, 'ct') || InventoryAPI.ItemIsInFavorites('ct', id))
                    return '';
                return 'TopSeparator';
            },
            populateFilter: ['inspect', 'loadout', 'loadout_slot_t', 'loadout_slot_ct'],
            bActionIsRentalAware: true,
            AvailableForItem: (id) => CanAddToFavorites(id, 't'),
            OnSelected: (id) => {
                $.DispatchEvent('ContextMenuEvent', '');
                InventoryAPI.AddItemToFavorites('t', id);
            },
        },
        {
            name: 'remove_from_favorites_t',
            style: (id) => {
                // If we can add to or remove from CT favorites then use that TopSeparator
                if (CanAddToFavorites(id, 'ct') || InventoryAPI.ItemIsInFavorites('ct', id))
                    return '';
                return 'TopSeparator';
            },
            populateFilter: ['inspect', 'loadout', 'loadout_slot_t', 'loadout_slot_ct'],
            bActionIsRentalAware: true,
            AvailableForItem: (id) => InventoryAPI.ItemIsInFavorites('t', id),
            OnSelected: (id) => {
                $.DispatchEvent('ContextMenuEvent', '');
                InventoryAPI.RemoveItemFromFavorites('t', id);
            },
        },
        {
            name: 'add_to_favorites_noteam',
            style: (id) => 'TopSeparator',
            populateFilter: ['inspect', 'loadout', 'loadout_slot_t', 'loadout_slot_ct'],
            bActionIsRentalAware: true,
            AvailableForItem: id => CanAddToFavorites(id, 'noteam'),
            OnSelected: id => {
                $.DispatchEvent('ContextMenuEvent', '');
                InventoryAPI.AddItemToFavorites('noteam', id);
            },
        },
        {
            name: 'remove_from_favorites_noteam',
            style: (id) => 'TopSeparator',
            populateFilter: ['inspect', 'loadout', 'loadout_slot_t', 'loadout_slot_ct'],
            bActionIsRentalAware: true,
            AvailableForItem: (id) => InventoryAPI.ItemIsInFavorites('noteam', id),
            OnSelected: (id) => {
                $.DispatchEvent('ContextMenuEvent', '');
                InventoryAPI.RemoveItemFromFavorites('noteam', id);
            },
        },
        {
            name: 'enable_shuffle_slot',
            exclusiveFilter: ['loadout_slot_ct'],
            bActionIsRentalAware: true,
            AvailableForItem: (id) => {
                const category = InventoryAPI.GetLoadoutCategory(id);
                return ['customplayer', 'clothing', 'melee', 'c4', 'musickit', 'equipment2'].includes(category);
            },
            OnSelected: (id) => {
                const [team, slot] = _GetLoadoutSlot(id, 'ct');
                LoadoutAPI.SetShuffleEnabled(team, slot, true);
                $.DispatchEvent('ContextMenuEvent', '');
            },
        },
        {
            name: 'enable_shuffle_slot',
            exclusiveFilter: ['loadout_slot_t'],
            bActionIsRentalAware: true,
            AvailableForItem: (id) => {
                const category = InventoryAPI.GetLoadoutCategory(id);
                return ['customplayer', 'clothing', 'melee', 'c4', 'musickit', 'equipment2'].includes(category);
            },
            OnSelected: (id) => {
                const [team, slot] = _GetLoadoutSlot(id, 't');
                LoadoutAPI.SetShuffleEnabled(team, slot, true);
                $.DispatchEvent('ContextMenuEvent', '');
            },
        },
        {
            name: 'enable_weapon_shuffle',
            exclusiveFilter: ['loadout_slot_ct'],
            bActionIsRentalAware: true,
            AvailableForItem: (id) => {
                const category = InventoryAPI.GetLoadoutCategory(id);
                if (category != 'secondary' && category != 'smg' && category != 'rifle')
                    return false;
                $.GetContextPanel().SetDialogVariable("weapon_type", $.Localize(InventoryAPI.GetItemBaseName(id)));
                return true;
            },
            OnSelected: (id) => {
                const [team, slot] = _GetLoadoutSlot(id, 'ct');
                LoadoutAPI.SetShuffleEnabled(team, slot, true);
                $.DispatchEvent('ContextMenuEvent', '');
            },
        },
        {
            name: 'enable_weapon_shuffle',
            exclusiveFilter: ['loadout_slot_t'],
            bActionIsRentalAware: true,
            AvailableForItem: (id) => {
                const category = InventoryAPI.GetLoadoutCategory(id);
                if (category != 'secondary' && category != 'smg' && category != 'rifle')
                    return false;
                $.GetContextPanel().SetDialogVariable("weapon_type", $.Localize(InventoryAPI.GetItemBaseName(id)));
                return true;
            },
            OnSelected: (id) => {
                const [team, slot] = _GetLoadoutSlot(id, 't');
                LoadoutAPI.SetShuffleEnabled(team, slot, true);
                $.DispatchEvent('ContextMenuEvent', '');
            },
        },
        {
            name: 'disable_shuffle_slot',
            exclusiveFilter: ['shuffle_slot_ct'],
            bActionIsRentalAware: true,
            AvailableForItem: (id) => {
                const category = InventoryAPI.GetLoadoutCategory(id);
                return ['customplayer', 'clothing', 'melee', 'c4', 'musickit', 'equipment2'].includes(category);
            },
            OnSelected: (id) => {
                const [team, slot] = _GetLoadoutSlot(id, 'ct');
                LoadoutAPI.SetShuffleEnabled(team, slot, false);
                $.DispatchEvent('ContextMenuEvent', '');
            },
        },
        {
            name: 'disable_shuffle_slot',
            exclusiveFilter: ['shuffle_slot_t'],
            bActionIsRentalAware: true,
            AvailableForItem: (id) => {
                const category = InventoryAPI.GetLoadoutCategory(id);
                return ['customplayer', 'clothing', 'melee', 'c4', 'musickit', 'equipment2'].includes(category);
            },
            OnSelected: (id) => {
                const [team, slot] = _GetLoadoutSlot(id, 't');
                LoadoutAPI.SetShuffleEnabled(team, slot, false);
                $.DispatchEvent('ContextMenuEvent', '');
            },
        },
        {
            name: 'disable_weapon_shuffle',
            exclusiveFilter: ['shuffle_slot_ct'],
            bActionIsRentalAware: true,
            AvailableForItem: (id) => {
                const category = InventoryAPI.GetLoadoutCategory(id);
                if (category != 'secondary' && category != 'smg' && category != 'rifle')
                    return false;
                $.GetContextPanel().SetDialogVariable("weapon_type", $.Localize(InventoryAPI.GetItemBaseName(id)));
                return true;
            },
            OnSelected: (id) => {
                const [team, slot] = _GetLoadoutSlot(id, 'ct');
                LoadoutAPI.SetShuffleEnabled(team, slot, false);
                $.DispatchEvent('ContextMenuEvent', '');
            },
        },
        {
            name: 'disable_weapon_shuffle',
            exclusiveFilter: ['shuffle_slot_t'],
            bActionIsRentalAware: true,
            AvailableForItem: (id) => {
                const category = InventoryAPI.GetLoadoutCategory(id);
                if (category != 'secondary' && category != 'smg' && category != 'rifle')
                    return false;
                $.GetContextPanel().SetDialogVariable("weapon_type", $.Localize(InventoryAPI.GetItemBaseName(id)));
                return true;
            },
            OnSelected: (id) => {
                const [team, slot] = _GetLoadoutSlot(id, 't');
                LoadoutAPI.SetShuffleEnabled(team, slot, false);
                $.DispatchEvent('ContextMenuEvent', '');
            },
        },
        {
            name: 'intocasket',
            style: (id) => 'TopSeparator',
            AvailableForItem: (id) => InventoryAPI.IsPotentiallyMarketable(id),
            OnSelected: (id) => {
                $.DispatchEvent('ContextMenuEvent', '');
                if (InventoryAPI.GetChosenActionItemsCount(id, 'can_collect') > 0) { // pick a casket
                    $.DispatchEvent('ShowSelectItemForCapabilityPopup', id, '', 'can_collect');
                }
                else { // buy a casket
                    const fauxCasket = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(1201, 0); // "casket"
                    const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_inventory_inspect.xml');
                    let oSettings = {
                        item_id: fauxCasket,
                        inspect_only: true,
                        show_work_type_warning: false,
                        store_item_id: 'fauxCasket'
                    };
                    elPanel.Data().oSettings = oSettings;
                }
            }
        },
        {
            name: 'sell',
            AvailableForItem: (id) => InventoryAPI.IsMarketable(id),
            OnSelected: (id) => {
                $.DispatchEvent('CSGOPlaySoundEffect', 'inventory_inspect_sellOnMarket', 'MOUSE');
                $.DispatchEvent('ContextMenuEvent', '');
                InventoryAPI.MarketListingForItem(id, 'create');
            }
        },
        {
            name: 'marketlisting',
            style: (id) => 'TopSeparator',
            bActionIsRentalAware: true,
            AvailableForItem: (id) => {
                if (MyPersonaAPI.GetLauncherType() === 'perfectworld')
                    return false;
                let unProtectedEscrowValue = InventoryAPI.GetItemAttributeValue(id, '{uint32}trade protected escrow date');
                return ((unProtectedEscrowValue !== undefined) && (unProtectedEscrowValue == 0));
            },
            OnSelected: (id) => {
                $.DispatchEvent('CSGOPlaySoundEffect', 'inventory_inspect_sellOnMarket', 'MOUSE');
                $.DispatchEvent('ContextMenuEvent', '');
                InventoryAPI.MarketListingForItem(id, 'view');
            }
        },
        {
            name: 'delete',
            style: (id) => !InventoryAPI.IsMarketable(id) ? 'TopSeparator' : '',
            AvailableForItem: (id) => InventoryAPI.IsDeletable(id),
            OnSelected: (id) => {
                $.DispatchEvent('ContextMenuEvent', '');
                const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_inventory_inspect.xml');
                let oSettings = {
                    item_id: id,
                    override_async_btn_style: 'Negative',
                    work_type: 'delete'
                };
                elPanel.Data().oSettings = oSettings;
            }
        },
        {
            name: 'loadout_slot_reset_t',
            exclusiveFilter: ['loadout_slot_t'],
            bActionIsRentalAware: true,
            AvailableForItem: (id) => {
                let team = 't';
                let slot = InventoryAPI.GetDefaultSlot(id);
                if (slot == 'musickit')
                    team = 'noteam';
                else if (slot != 'customplayer' && slot != 'clothing_hands' && slot != 'melee' && slot != 'c4' && slot != 'equipment2')
                    return false;
                return id != LoadoutAPI.GetDefaultItem(team, slot);
            },
            OnSelected: (id) => {
                let team = 't';
                let slot = InventoryAPI.GetDefaultSlot(id);
                if (slot == 'musickit')
                    team = 'noteam';
                let defaultId = LoadoutAPI.GetDefaultItem(team, slot);
                $.DispatchEvent('ContextMenuEvent', ''); // hide context menu on click
                TryEquipItemInSlot(team, defaultId, slot);
            },
        },
        {
            name: 'loadout_slot_reset_ct',
            exclusiveFilter: ['loadout_slot_ct'],
            bActionIsRentalAware: true,
            AvailableForItem: (id) => {
                let team = 'ct';
                let slot = InventoryAPI.GetDefaultSlot(id);
                if (slot == 'musickit')
                    team = 'noteam';
                else if (slot != 'customplayer' && slot != 'clothing_hands' && slot != 'melee' && slot != 'c4' && slot != 'equipment2')
                    return false;
                return id != LoadoutAPI.GetDefaultItem(team, slot);
            },
            OnSelected: (id) => {
                let team = 'ct';
                let slot = InventoryAPI.GetDefaultSlot(id);
                if (slot == 'musickit')
                    team = 'noteam';
                let defaultId = LoadoutAPI.GetDefaultItem(team, slot);
                $.DispatchEvent('ContextMenuEvent', ''); // hide context menu on click
                TryEquipItemInSlot(team, defaultId, slot);
            },
        },
        {
            name: 'loadout_slot_reset_weapon_t',
            exclusiveFilter: ['loadout_slot_t'],
            bActionIsRentalAware: true,
            AvailableForItem: (id) => {
                let team = 't';
                let category = InventoryAPI.GetLoadoutCategory(id);
                if (category != 'secondary' && category != 'smg' && category != 'rifle')
                    return false;
                let defIndex = InventoryAPI.GetItemDefinitionIndex(id);
                let slot = LoadoutAPI.GetSlotEquippedWithDefIndex(team, defIndex);
                let defaultId = LoadoutAPI.GetDefaultItem(team, slot);
                let defaultDefIndex = InventoryAPI.GetItemDefinitionIndex(defaultId);
                return defIndex != defaultDefIndex;
            },
            OnSelected: (id) => {
                let team = 't';
                let defIndex = InventoryAPI.GetItemDefinitionIndex(id);
                let slot = LoadoutAPI.GetSlotEquippedWithDefIndex(team, defIndex);
                let defaultId = LoadoutAPI.GetDefaultItem(team, slot);
                let defaultDefIndex = InventoryAPI.GetItemDefinitionIndex(defaultId);
                let preferredId = LoadoutAPI.GetPreferredItemIdForItemDefIndex(team, defaultDefIndex);
                $.DispatchEvent('ContextMenuEvent', ''); // hide context menu on click
                TryEquipItemInSlot(team, preferredId, slot);
            },
        },
        {
            name: 'loadout_slot_reset_weapon_ct',
            exclusiveFilter: ['loadout_slot_ct'],
            bActionIsRentalAware: true,
            AvailableForItem: (id) => {
                let team = 'ct';
                let category = InventoryAPI.GetLoadoutCategory(id);
                if (category != 'secondary' && category != 'smg' && category != 'rifle')
                    return false;
                let defIndex = InventoryAPI.GetItemDefinitionIndex(id);
                let slot = LoadoutAPI.GetSlotEquippedWithDefIndex(team, defIndex);
                let defaultId = LoadoutAPI.GetDefaultItem(team, slot);
                let defaultDefIndex = InventoryAPI.GetItemDefinitionIndex(defaultId);
                return defIndex != defaultDefIndex;
            },
            OnSelected: (id) => {
                let team = 'ct';
                let defIndex = InventoryAPI.GetItemDefinitionIndex(id);
                let slot = LoadoutAPI.GetSlotEquippedWithDefIndex(team, defIndex);
                let defaultId = LoadoutAPI.GetDefaultItem(team, slot);
                let defaultDefIndex = InventoryAPI.GetItemDefinitionIndex(defaultId);
                let preferredId = LoadoutAPI.GetPreferredItemIdForItemDefIndex(team, defaultDefIndex);
                $.DispatchEvent('ContextMenuEvent', ''); // hide context menu on click
                TryEquipItemInSlot(team, preferredId, slot);
            },
        },
        {
            name: 'loadout_slot_reset_finish_t',
            exclusiveFilter: ['loadout_slot_t'],
            bActionIsRentalAware: true,
            AvailableForItem: (id) => {
                let category = InventoryAPI.GetLoadoutCategory(id);
                if (category == 'secondary' || category == 'smg' || category == 'rifle')
                    return !InventoryAPI.IsFauxItemID(id);
                else
                    return false;
            },
            OnSelected: (id) => {
                let team = 't';
                let defIndex = InventoryAPI.GetItemDefinitionIndex(id);
                let slot = LoadoutAPI.GetSlotEquippedWithDefIndex(team, defIndex);
                let fauxId = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(defIndex, 0);
                $.DispatchEvent('ContextMenuEvent', ''); // hide context menu on click
                TryEquipItemInSlot(team, fauxId, slot);
            },
        },
        {
            name: 'loadout_slot_reset_finish_ct',
            exclusiveFilter: ['loadout_slot_ct'],
            bActionIsRentalAware: true,
            AvailableForItem: (id) => {
                let category = InventoryAPI.GetLoadoutCategory(id);
                if (category == 'secondary' || category == 'smg' || category == 'rifle')
                    return !InventoryAPI.IsFauxItemID(id);
                else
                    return false;
            },
            OnSelected: (id) => {
                let team = 'ct';
                let defIndex = InventoryAPI.GetItemDefinitionIndex(id);
                let slot = LoadoutAPI.GetSlotEquippedWithDefIndex(team, defIndex);
                let fauxId = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(defIndex, 0);
                $.DispatchEvent('ContextMenuEvent', ''); // hide context menu on click
                TryEquipItemInSlot(team, fauxId, slot);
            },
        },
    ];
    //--------------------------------------------------------------------------------------------------
    // context menu specific helpers
    //--------------------------------------------------------------------------------------------------
    function GetItemToReplaceName(id, team, slot) {
        if (slot === null || slot === undefined || slot === '') {
            if (ItemInfo.IsWeapon(id) && !['melee', 'secondary0', 'c4', 'equipment2'].includes(InventoryAPI.GetDefaultSlot(id))) {
                slot = ItemInfo.GetEquippedSlot(id, team);
            }
            else {
                slot = InventoryAPI.GetDefaultSlot(id);
            }
        }
        const currentEquippedItem = ItemInfo.GetItemIdForItemEquippedInSlot(team, slot);
        if (currentEquippedItem && currentEquippedItem !== '0') {
            $.GetContextPanel().SetDialogVariable("item_name", GetNameWithRarity(currentEquippedItem));
            if (team != 'noteam') {
                return $.Localize('#inv_context_equip_team', $.GetContextPanel());
            }
            else
                return $.Localize('#inv_context_equip', $.GetContextPanel());
        }
        return 'WRONG CONTEXT -GetItemToReplaceName()' + id;
    }
    function GetNameWithRarity(id) {
        const rarityColor = InventoryAPI.GetItemRarityColor(id);
        let sName = InventoryAPI.HasCustomName(id) ? $.HTMLEscape(InventoryAPI.GetItemNameCustomized(id)) : InventoryAPI.GetItemName(id);
        return '<font color="' + rarityColor + '">' + sName + '</font>';
    }
    function EquipItem(id, team, slot) {
        if (slot === null || slot === undefined || slot === '') {
            slot = InventoryAPI.GetDefaultSlot(id); // item slot can be implied (most common scenario)
            if (ItemInfo.IsWeapon(id) && !["melee", "secondary0", "c4", "equipment2"].includes(slot))
                slot = ItemInfo.GetEquippedSlot(id, team[0]);
        }
        const teamShownOnMainMenu = GameInterfaceAPI.GetSettingString('ui_vanitysetting_team');
        for (let element of team) {
            if (!TryEquipItemInSlot(element, id, slot))
                return;
        }
        // Check if we need to restart main menu vanity
        let bNeedToRestartMainMenuVanity = false;
        if (ItemInfo.IsCharacter(id)) {
            const teamOfCharacter = (InventoryAPI.GetItemTeam(id).search('Team_T') === -1) ? 'ct' : 't';
            if (teamOfCharacter !== teamShownOnMainMenu) { // equipping character flips the main menu shown team
                GameInterfaceAPI.SetSettingString('ui_vanitysetting_team', teamOfCharacter);
            }
            // flipping the character always restarts vanity
            bNeedToRestartMainMenuVanity = true;
        }
        else {
            // if we equipped onto a team featured on the main menu
            // and the item is either gloves or the item character holds
            // then we should restart our main menu presentation
            team.filter(e => e === teamShownOnMainMenu);
            if (team.length > 0) {
                if ((slot === 'clothing_hands') ||
                    (slot === GameInterfaceAPI.GetSettingString('ui_vanitysetting_loadoutslot_' + teamShownOnMainMenu))) {
                    bNeedToRestartMainMenuVanity = true;
                }
            }
        }
        // Restart main menu vanity if applicable
        if (bNeedToRestartMainMenuVanity) {
            $.DispatchEvent('ForceRestartVanity');
        }
    }
    function TryEquipItemInSlot(szTeam, szItemID, szSlot) {
        let bSuccess = LoadoutAPI.EquipItemInSlot(szTeam, szItemID, szSlot);
        if (!bSuccess) {
            UiToolkitAPI.ShowGenericPopupOk($.Localize('#LoadoutLockedPopupTitle'), $.Localize('#LoadoutLockedPopupText'), '', () => { });
        }
        return bSuccess;
    }
    function DoesNotHaveChosenActionItems(id, capability) {
        return (InventoryAPI.GetChosenActionItemsCount(id, capability) === 0 && !InventoryAPI.IsTool(id));
    }
    function DoesItemTeamMatchTeamRequired(team, id) {
        if (team === 't') {
            return ItemInfo.IsItemT(id) || ItemInfo.IsItemAnyTeam(id);
        }
        if (team === 'ct') {
            return ItemInfo.IsItemCt(id) || ItemInfo.IsItemAnyTeam(id);
        }
        if (team === 'noteam') {
            return InventoryAPI.GetLoadoutCategory(id) == 'musickit';
        }
        return false;
    }
    function CanEquipItem(itemID) {
        return !!InventoryAPI.GetDefaultSlot(itemID) && !ItemInfo.IsEquippableThroughContextMenu(itemID);
    }
    function IsKeyForXrayItem(id) {
        const oData = ItemInfo.GetItemsInXray();
        if (oData.case && oData.reward) {
            const numActionItems = InventoryAPI.GetChosenActionItemsCount(oData.case, 'decodable');
            if (numActionItems > 0) {
                for (let i = 0; i < numActionItems; i++) {
                    if (id === InventoryAPI.GetChosenActionItemIDByIndex(oData.case, 'decodable', i)) {
                        return oData.case;
                    }
                }
            }
        }
        return '';
    }
    function _CanSwapFinish(id, team) {
        if (!DoesItemTeamMatchTeamRequired(team, id))
            return false;
        let slot;
        let group = InventoryAPI.GetRawDefinitionKey(id, 'flexible_loadout_group');
        switch (group) {
            case 'customplayer':
            case 'clothing_hands':
            case 'melee':
            case 'c4':
            case 'equipment2':
                {
                    slot = group;
                    break;
                }
            case 'secondary0':
            case 'secondary':
            case 'smg':
            case 'rifle':
                {
                    let itemDefIndex = InventoryAPI.GetItemDefinitionIndex(id);
                    slot = LoadoutAPI.GetSlotEquippedWithDefIndex(team, itemDefIndex);
                    if (!slot)
                        return false;
                    break;
                }
            default:
                {
                    return false;
                }
        }
        if (LoadoutAPI.GetItemID(team, slot) == id)
            return false; // It's already equipped! Don't show swap finish options.
        if (LoadoutAPI.IsShuffleEnabled(team, slot))
            return false;
        return CanEquipItem(id);
    }
    function _GetLoadoutSlot(id, team) {
        let group = InventoryAPI.GetRawDefinitionKey(id, 'flexible_loadout_group');
        if (['equipment2', 'secondary0', 'secondary', 'smg', 'rifle'].includes(group)) {
            let itemDefIndex = InventoryAPI.GetItemDefinitionIndex(id);
            return [team, LoadoutAPI.GetSlotEquippedWithDefIndex(team, itemDefIndex)];
        }
        else if (['musickit', 'flair0', 'spray0'].includes(group)) {
            return ['noteam', group];
        }
        else {
            return [team, group];
        }
    }
    function CanAddToFavorites(id, team) {
        const [_, slot] = _GetLoadoutSlot(id, team);
        if (!(ItemInfo.IsWeapon(id) || ItemInfo.IsMelee(id)) && slot != 'customplayer' && slot != 'clothing_hands' && slot != 'musickit')
            return false;
        if (slot == 'musickit' && team != 'noteam')
            return false;
        // InventoryAPI.ItemIsInFavorites will need a team check
        if (InventoryAPI.ItemIsInFavorites(team, id))
            return false;
        if (!DoesItemTeamMatchTeamRequired(team, id))
            return false;
        return !!InventoryAPI.GetDefaultSlot(id);
    }
})(ItemContextEntries || (ItemContextEntries = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXRlbV9jb250ZXh0X2VudHJpZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9jb21tb24vaXRlbV9jb250ZXh0X2VudHJpZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyxvQ0FBb0M7QUFDcEMsNEVBQTRFO0FBYzVFLElBQVUsa0JBQWtCLENBOHNEM0I7QUE5c0RELFdBQVUsa0JBQWtCO0lBRTNCLFNBQWdCLGFBQWEsQ0FBRyxFQUFVLEVBQUUsa0JBQTBCO1FBRXJFLE1BQU0sVUFBVSxHQUFHLGtCQUFrQixLQUFLLGFBQWEsQ0FBQztRQUV4RCxPQUFPLFFBQVEsQ0FBQyxNQUFNLENBQUUsQ0FBRSxLQUFLLEVBQUcsRUFBRTtZQUVuQyxpQkFBaUI7WUFDakIsSUFBSyxLQUFLLENBQUMsZUFBZSxFQUMxQjtnQkFDQyxJQUFLLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUUsa0JBQWtCLENBQUU7b0JBQ3pELE9BQU8sS0FBSyxDQUFDO2FBQ2Q7WUFDRCxzQkFBc0I7aUJBQ2pCLElBQUssVUFBVSxJQUFJLEtBQUssQ0FBQyxjQUFjLEVBQzVDO2dCQUNDLElBQUssQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBRSxrQkFBa0IsQ0FBRTtvQkFDeEQsT0FBTyxLQUFLLENBQUM7YUFDZDtZQUNELHdFQUF3RTtpQkFFeEU7Z0JBQ0MsSUFBSyxVQUFVO29CQUNkLE9BQU8sS0FBSyxDQUFDO2FBQ2Q7WUFFRCxpRkFBaUY7WUFDakYsSUFBSyxDQUFDLEtBQUssQ0FBQyxvQkFBb0IsSUFBSSxZQUFZLENBQUMsUUFBUSxDQUFFLEVBQUUsQ0FBRTtnQkFDOUQsT0FBTyxLQUFLLENBQUM7WUFFZCx5QkFBeUI7WUFDekIsT0FBTyxLQUFLLENBQUMsZ0JBQWdCLENBQUUsRUFBRSxDQUFFLENBQUM7UUFDckMsQ0FBQyxDQUFF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