"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="iteminfo.ts" />
/// <reference path="../generated/items_event_current_generated_store.ts" />
var ItemContextEntries;
(function (ItemContextEntries) {
    function FilterEntries(id, populateFilterText) {
        const bHasFilter = populateFilterText !== "(not found)";
        return _Entries.filter((entry) => {
            if (entry.exclusiveFilter) {
                if (!entry.exclusiveFilter.includes(populateFilterText))
                    return false;
            }
            else if (bHasFilter && entry.populateFilter) {
                if (!entry.populateFilter.includes(populateFilterText))
                    return false;
            }
            else {
                if (bHasFilter)
                    return false;
            }
            if (!entry.bActionIsRentalAware && InventoryAPI.IsRental(id))
                return false;
            return entry.AvailableForItem(id);
        });
    }
    ItemContextEntries.FilterEntries = FilterEntries;
    const _Entries = [
        {
            name: 'preview',
            populateFilter: ['lootlist', 'loadout', 'loadout_slot_t', 'loadout_slot_ct', 'tradeup_items', 'tradeup_ingredients'],
            bActionIsRentalAware: true,
            AvailableForItem: (id) => {
                if (InventoryAPI.DoesItemMatchDefinitionByName(id, "Remove Keychain Tool"))
                    return true;
                if (InventoryAPI.DoesItemMatchDefinitionByName(id, "sticker_display_case"))
                    return true;
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
                const defName = InventoryAPI.GetItemDefinitionName(id);
                return (defName === 'casket') && !!InventoryAPI.GetItemAttributeValue(id, 'modification date');
            },
            OnSelected: (id) => {
                $.DispatchEvent('ContextMenuEvent', '');
                const defName = InventoryAPI.GetItemDefinitionName(id);
                if (defName === 'casket') {
                    if (InventoryAPI.GetItemAttributeValue(id, 'items count')) {
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
                const defName = InventoryAPI.GetItemDefinitionName(id);
                return (defName === 'casket') && !!InventoryAPI.GetItemAttributeValue(id, 'modification date');
            },
            OnSelected: (id) => {
                $.DispatchEvent('ContextMenuEvent', '');
                const defName = InventoryAPI.GetItemDefinitionName(id);
                if (defName === 'casket') {
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
            name: 'equip_spray',
            populateFilter: ['inspect', 'loadout', 'loadout_slot_t', 'loadout_slot_ct'],
            AvailableForItem: (id) => ItemInfo.IsSprayPaint(id) && !InventoryAPI.IsEquipped(id, "noteam"),
            OnSelected: (id) => {
                $.DispatchEvent('ContextMenuEvent', '');
                EquipItem(id, ['noteam'], 'spray0');
            }
        },
        {
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
                if (GameStateAPI.GetMapBSPName())
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
                    return true;
                if (ItemInfo.ItemDefinitionNameSubstrMatch(id, 'xpgrant')) {
                    return (FriendsListAPI.GetFriendLevel(MyPersonaAPI.GetXuid()) < InventoryAPI.GetMaxLevel());
                }
                if (!InventoryAPI.IsTool(id))
                    return false;
                const season = InventoryAPI.GetItemAttributeValue(id, 'season access');
                if (season != undefined)
                    return true;
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
                    (InventoryAPI.GetItemQuality(id) === 14);
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
                    const fauxNameTag = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(1200, 0);
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
                if (InventoryAPI.GetChosenActionItemsCount(id, 'can_wrap_sticker') > 0) {
                    $.DispatchEvent('ShowSelectItemForCapabilityPopup', id, '', 'can_wrap_sticker');
                }
                else {
                    const defidxWrapper = InventoryAPI.GetItemDefinitionIndexFromDefinitionName("sticker_display_case");
                    const fauxCasket = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(defidxWrapper, 0);
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
                if (InventoryAPI.GetChosenActionItemsCount(id, 'can_collect') > 0) {
                    $.DispatchEvent('ShowSelectItemForCapabilityPopup', id, '', 'can_collect');
                }
                else {
                    const fauxCasket = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(1201, 0);
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
                $.DispatchEvent('ContextMenuEvent', '');
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
                $.DispatchEvent('ContextMenuEvent', '');
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
                $.DispatchEvent('ContextMenuEvent', '');
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
                $.DispatchEvent('ContextMenuEvent', '');
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
                $.DispatchEvent('ContextMenuEvent', '');
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
                $.DispatchEvent('ContextMenuEvent', '');
                TryEquipItemInSlot(team, fauxId, slot);
            },
        },
    ];
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
            slot = InventoryAPI.GetDefaultSlot(id);
            if (ItemInfo.IsWeapon(id) && !["melee", "secondary0", "c4", "equipment2"].includes(slot))
                slot = ItemInfo.GetEquippedSlot(id, team[0]);
        }
        const teamShownOnMainMenu = GameInterfaceAPI.GetSettingString('ui_vanitysetting_team');
        for (let element of team) {
            if (!TryEquipItemInSlot(element, id, slot))
                return;
        }
        let bNeedToRestartMainMenuVanity = false;
        if (ItemInfo.IsCharacter(id)) {
            const teamOfCharacter = (InventoryAPI.GetItemTeam(id).search('Team_T') === -1) ? 'ct' : 't';
            if (teamOfCharacter !== teamShownOnMainMenu) {
                GameInterfaceAPI.SetSettingString('ui_vanitysetting_team', teamOfCharacter);
            }
            bNeedToRestartMainMenuVanity = true;
        }
        else {
            team.filter(e => e === teamShownOnMainMenu);
            if (team.length > 0) {
                if ((slot === 'clothing_hands') ||
                    (slot === GameInterfaceAPI.GetSettingString('ui_vanitysetting_loadoutslot_' + teamShownOnMainMenu))) {
                    bNeedToRestartMainMenuVanity = true;
                }
            }
        }
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
            return false;
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
        if (InventoryAPI.ItemIsInFavorites(team, id))
            return false;
        if (!DoesItemTeamMatchTeamRequired(team, id))
            return false;
        return !!InventoryAPI.GetDefaultSlot(id);
    }
})(ItemContextEntries || (ItemContextEntries = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXRlbV9jb250ZXh0X2VudHJpZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9jb21tb24vaXRlbV9jb250ZXh0X2VudHJpZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyxvQ0FBb0M7QUFDcEMsNEVBQTRFO0FBYzVFLElBQVUsa0JBQWtCLENBaXREM0I7QUFqdERELFdBQVUsa0JBQWtCO0lBRTNCLFNBQWdCLGFBQWEsQ0FBRyxFQUFVLEVBQUUsa0JBQTBCO1FBRXJFLE1BQU0sVUFBVSxHQUFHLGtCQUFrQixLQUFLLGFBQWEsQ0FBQztRQUV4RCxPQUFPLFFBQVEsQ0FBQyxNQUFNLENBQUUsQ0FBRSxLQUFLLEVBQUcsRUFBRTtZQUduQyxJQUFLLEtBQUssQ0FBQyxlQUFlLEVBQzFCO2dCQUNDLElBQUssQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBRSxrQkFBa0IsQ0FBRTtvQkFDekQsT0FBTyxLQUFLLENBQUM7YUFDZDtpQkFFSSxJQUFLLFVBQVUsSUFBSSxLQUFLLENBQUMsY0FBYyxFQUM1QztnQkFDQyxJQUFLLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUUsa0JBQWtCLENBQUU7b0JBQ3hELE9BQU8sS0FBSyxDQUFDO2FBQ2Q7aUJBR0Q7Z0JBQ0MsSUFBSyxVQUFVO29CQUNkLE9BQU8sS0FBSyxDQUFDO2FBQ2Q7WUFHRCxJQUFLLENBQUMsS0FBSyxDQUFDLG9CQUFvQixJQUFJLFlBQVksQ0FBQyxRQUFRLENBQUUsRUFBRSxDQUFFO2dCQUM5RCxPQUFPLEtBQUssQ0FBQztZQUdkLE9BQU8sS0FBSyxDQUFDLGdCQUFnQixDQUFFLEVBQUUsQ0FBRSxDQUFDO1FBQ3JDLENBQUMsQ0FBRSxDQUFDO0lBQ0wsQ0FBQztJQWhDZSxnQ0FBYSxnQkFnQzVCLENBQUE7SUFPRCxNQUFNLFFBQVEsR0FBeUI7UUEy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