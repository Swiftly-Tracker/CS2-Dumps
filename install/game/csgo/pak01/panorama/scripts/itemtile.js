"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/iteminfo.ts" />
/// <reference path="popups/popup_select_item_for_capability.ts" />
/// <reference path="common/formattext.ts" />
var ItemTile;
(function (ItemTile) {
    function _OnTileUpdated(elTeamTile) {
        let id = elTeamTile.GetAttributeString('itemid', '0');
        if (id === '0')
            return;
        let idForDisplay = id;
        if (elTeamTile.GetAttributeString('filter_category', '') === 'inv_graphic_art') {
            idForDisplay = ItemInfo.GetFauxReplacementItemID(id, 'graffiti');
        }
        _SetItemName(idForDisplay);
        _SetItemRarity(id);
        _SetEquippedState(id);
        _SetStickers(id);
        _SetRecentLabel(id);
        _TintSprayImage(id);
        _DisableTile(id);
        _SetBackground(id);
        _SetRentalTime(id);
        _SetIsRentable(id);
        _SetOriginalOwner(id);
        let loadImage = $.GetContextPanel().GetAttributeString('loadimage', '');
        if (loadImage) {
            _SetImage(id);
        }
    }
    ;
    function _SetItemName(id) {
        let fmtName = ItemInfo.GetFormattedName(id);
        fmtName.SetOnLabel($('#JsItemName'));
    }
    ;
    function _SetBackground(id) {
        let elTeamTile = $.GetContextPanel().FindChildInLayoutFile('ItemTileTeam');
        let subSlot = InventoryAPI.GetDefaultSlot(id);
        if (subSlot == 'customplayer') {
            elTeamTile.visible = true;
            let isCT = ItemInfo.IsItemCt(id);
            if (isCT) {
                elTeamTile.SetImage("file://{images}/icons/ui/ct_logo_1c.svg");
                elTeamTile.style.washColor = '#B5D4EE';
            }
            else {
                elTeamTile.SetImage("file://{images}/icons/ui/t_logo_1c.svg");
                elTeamTile.style.washColor = '#EAD18A';
            }
        }
        else {
            elTeamTile.visible = false;
        }
    }
    function _SetImage(id) {
        $.GetContextPanel().FindChildInLayoutFile('ItemImage').itemid = id;
    }
    ;
    function _SetItemRarity(id) {
        let color = InventoryAPI.GetItemRarityColor(id);
        if (!color)
            return;
        $.GetContextPanel().FindChildInLayoutFile('JsRarity').style.backgroundColor = color;
    }
    ;
    function _SetEquippedState(id) {
        let elNoteamDot = $.GetContextPanel().FindChildInLayoutFile('ItemEquipped-noteam');
        let elCtDot = $.GetContextPanel().FindChildInLayoutFile('ItemEquipped-ct');
        let elTDot = $.GetContextPanel().FindChildInLayoutFile('ItemEquipped-t');
        let elFavoriteIconNoteam = $.GetContextPanel().FindChildInLayoutFile('FavoriteIcon-noteam');
        let elFavoriteIconCt = $.GetContextPanel().FindChildInLayoutFile('FavoriteIcon-ct');
        let elFavoriteIconT = $.GetContextPanel().FindChildInLayoutFile('FavoriteIcon-t');
        elTDot.AddClass('hidden');
        elCtDot.AddClass('hidden');
        elNoteamDot.AddClass('hidden');
        elTDot.RemoveClass('item-tile__equipped__radiodot--filled');
        elCtDot.RemoveClass('item-tile__equipped__radiodot--filled');
        elNoteamDot.RemoveClass('item-tile__equipped__radiodot--filled');
        elFavoriteIconNoteam.SetHasClass('hidden', !InventoryAPI.ItemIsInFavorites('noteam', id));
        elFavoriteIconCt.SetHasClass('hidden', !InventoryAPI.ItemIsInFavorites('ct', id));
        elFavoriteIconT.SetHasClass('hidden', !InventoryAPI.ItemIsInFavorites('t', id));
        for (let team of ['t', 'ct', 'noteam']) {
            if (_ItemIsInShuffle(id, team)) {
                _SetEquipIcon(true, team);
            }
            else if (InventoryAPI.IsEquipped(id, team)) {
                _SetEquipIcon(false, team);
            }
        }
    }
    ;
    function _ItemIsInShuffle(id, team) {
        let slot = InventoryAPI.GetRawDefinitionKey(id, 'flexible_loadout_group');
        if (['secondary0', 'secondary', 'smg', 'rifle'].includes(slot)) {
            let itemDefIndex = InventoryAPI.GetItemDefinitionIndex(id);
            slot = LoadoutAPI.GetSlotEquippedWithDefIndex(team, itemDefIndex);
        }
        return LoadoutAPI.IsShuffleEnabled(team, slot) && InventoryAPI.ItemIsInFavorites(team, id);
    }
    ;
    function _SetEquipIcon(isShuffle, team) {
        let elCtDot = $.GetContextPanel().FindChildInLayoutFile('ItemEquipped-' + team);
        elCtDot.RemoveClass('hidden');
        elCtDot.AddClass('item-tile__equipped__radiodot--filled');
        elCtDot.SetHasClass('shuffle', isShuffle);
    }
    ;
    function _SetStickers(id) {
        let elParentStickers = $.GetContextPanel().FindChildInLayoutFile('StickersOnWeapon');
        elParentStickers.RemoveAndDeleteChildren();
        let elParentKeychains = $.GetContextPanel().FindChildInLayoutFile('KeychainsOnWeapon');
        elParentKeychains.RemoveAndDeleteChildren();
        let listStickers = ItemInfo.GetitemStickerList(id);
        for (let entry of listStickers) {
            $.CreatePanel('Image', elParentStickers, 'ItemImage' + entry.image, {
                src: 'file://{images}' + entry.image + '.png',
                scaling: 'stretch-to-fit-preserve-aspect',
                class: 'item-tile__stickers__image'
            });
        }
        elParentStickers.SetHasClass('hidden', listStickers.length <= 0 || listStickers === undefined);
        let listKeychains = ItemInfo.GetitemKeychainList(id);
        for (let entry of listKeychains) {
            $.CreatePanel('Image', elParentKeychains, 'ItemImage' + entry.image, {
                src: 'file://{images}' + entry.image + '.png',
                scaling: 'stretch-to-fit-preserve-aspect',
                class: 'item-tile__stickers__image'
            });
        }
        elParentKeychains.SetHasClass('hidden', listKeychains.length <= 0 || listKeychains === undefined);
    }
    ;
    function _SetRecentLabel(id) {
        let elLabel = $.GetContextPanel().FindChildInLayoutFile('JsRecent');
        let unProtectedEscrowValue = InventoryAPI.GetItemAttributeValue(id, '{uint32}trade protected escrow date');
        if ((unProtectedEscrowValue !== undefined) && (unProtectedEscrowValue == 0)) {
            elLabel.RemoveClass('hidden');
            elLabel.text = $.Localize('#inv_session_prop_marketlisting');
            return;
        }
        let isRecentValue = InventoryAPI.GetItemSessionPropertyValue(id, 'recent');
        let isUpdatedValue = InventoryAPI.GetItemSessionPropertyValue(id, 'updated');
        if (isUpdatedValue === '1' || isRecentValue === '1') {
            let locString = 'recent';
            if (isRecentValue === '1') {
                let strItemPickupMethod = InventoryAPI.GetItemSessionPropertyValue(id, 'item_pickup_method');
                if (strItemPickupMethod && ['xpshopredeem', 'quest_reward'].includes(strItemPickupMethod)) {
                    locString = strItemPickupMethod;
                }
            }
            else {
                locString = 'updated';
            }
            elLabel.RemoveClass('hidden');
            elLabel.text = $.Localize('#inv_session_prop_' + locString);
            return;
        }
        elLabel.AddClass('hidden');
    }
    ;
    function _TintSprayImage(id) {
        let elImage = $.GetContextPanel().FindChildInLayoutFile('ItemImage');
        TintSprayIcon.CheckIsSprayAndTint(id, elImage);
    }
    ;
    function _DisableTile(id) {
        let capabilityInfo = _GetPopUpCapability();
        if (capabilityInfo && capabilityInfo.capability === 'can_sticker' && !ItemInfo.IsSticker(id)) {
            $.GetContextPanel().enabled = (InventoryAPI.GetItemStickerSlotCount(id) > InventoryAPI.GetItemStickerCount(id));
        }
        else if (capabilityInfo && capabilityInfo.capability === 'can_patch' && !ItemInfo.IsPatch(id)) {
            $.GetContextPanel().enabled = (InventoryAPI.GetItemStickerSlotCount(id) > InventoryAPI.GetItemStickerCount(id));
        }
        else if (capabilityInfo && capabilityInfo.capability === 'can_keychain' && !ItemInfo.IsKeychain(id)) {
            $.GetContextPanel().enabled = (InventoryAPI.GetItemKeychainSlotCount(id) > InventoryAPI.GetItemKeychainCount(id));
        }
    }
    ;
    function _SetRentalTime(id) {
        let elLabel = $.GetContextPanel().FindChildInLayoutFile('JsItemRental');
        let bHide = !InventoryAPI.IsRental(id);
        if (bHide) {
            elLabel.AddClass('hidden');
            return;
        }
        const expirationDate = InventoryAPI.GetExpirationDate(id);
        if (expirationDate <= 0) {
            elLabel.AddClass('hidden');
            return;
        }
        let oLocData = FormatText.FormatRentalTime(expirationDate);
        elLabel.SetHasClass('item-expired', oLocData.isExpired);
        elLabel.SetDialogVariable('time-remaining', oLocData.time);
        elLabel.text = $.Localize(oLocData.locString, elLabel);
        elLabel.RemoveClass('hidden');
    }
    function _SetIsRentable(id) {
        let elLabel = $.GetContextPanel().FindChildInLayoutFile('JsCanRentItem');
        if (!InventoryAPI.CanOpenForRental(id)) {
            elLabel.AddClass('hidden');
            return;
        }
        elLabel.text = $.Localize('#item-can-rent');
        elLabel.RemoveClass('hidden');
    }
    ItemTile._SetIsRentable = _SetIsRentable;
    function _SetOriginalOwner(id) {
        const elImage = $.GetContextPanel().FindChildInLayoutFile('JsOriginalOwner');
        elImage.SetHasClass('hidden', !(InventoryAPI.GetItemAttributeValue(id, '{uint32}purchaser account id') != undefined));
    }
    function OnActivate() {
        HideTooltip();
        let id = $.GetContextPanel().GetAttributeString('itemid', '0');
        if ($.GetContextPanel().FindAncestor("id-popup-select-item-list") != null) {
            $.DispatchEvent("OnItemTileActivated", $.GetContextPanel(), id);
            return;
        }
        if ($.GetContextPanel().FindAncestor("id-pet-sticker-item-list") != null) {
            $.DispatchEvent("OnItemTileActivated", $.GetContextPanel(), id);
            return;
        }
        if ($.GetContextPanel().FindAncestor("Crafting-Items") != null) {
            InventoryAPI.AddCraftIngredient(id);
            return;
        }
        if ($.GetContextPanel().FindAncestor("Crafting-Ingredients") != null) {
            InventoryAPI.RemoveCraftIngredient(id);
            return;
        }
        let filterValue = $.GetContextPanel().GetAttributeString('context_menu_filter', '');
        let filterForContextMenuEntries = filterValue ? '&populatefiltertext=' + filterValue : '';
        let contextmenuparam = '';
        if ($.GetContextPanel().GetAttributeString('filter_category', '') === 'inv_graphic_art')
            contextmenuparam = '&contextmenuparam=graffiti';
        let contextMenuPanel = UiToolkitAPI.ShowCustomLayoutContextMenuParametersDismissEvent('', '', 'file://{resources}/layout/context_menus/context_menu_inventory_item.xml', 'itemid=' + id + filterForContextMenuEntries + contextmenuparam, () => { });
        contextMenuPanel.AddClass("ContextMenu_NoArrow");
        contextMenuPanel.AddClass("ContextMenuCursorTopLeft");
    }
    ItemTile.OnActivate = OnActivate;
    ;
    let updateItemListCallback;
    function OnActivateInspectButtonFromTile() {
        let id = $.GetContextPanel().GetAttributeString('itemid', '0');
        if ($.GetContextPanel().FindAncestor("Crafting-Items") != null || $.GetContextPanel().FindAncestor("Crafting-Ingredients") != null) {
            $.DispatchEvent("InventoryItemPreview", id, '');
            return;
        }
        let oCapabilityInfo = _GetPopUpCapability();
        if (oCapabilityInfo !== null && oCapabilityInfo.popupVisible) {
            if (updateItemListCallback) {
                UiToolkitAPI.UnregisterJSCallback(updateItemListCallback);
            }
            updateItemListCallback = UiToolkitAPI.RegisterJSCallback(SelectItemForCapability.UpdateSort);
            const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_inventory_inspect.xml');
            let oSettings = {
                item_id: id,
                inspect_only: true,
                is_inside_casket: oCapabilityInfo.initialItemId ? true : false,
                capability: oCapabilityInfo.capability,
                hide_all_action_items: true,
                is_selected: $.GetContextPanel().BHasClass('capability_multistatus_selected'),
                callback_handle: updateItemListCallback
            };
            elPanel.Data().oSettings = oSettings;
        }
    }
    ItemTile.OnActivateInspectButtonFromTile = OnActivateInspectButtonFromTile;
    function _GetPopUpCapability() {
        if (typeof SelectItemForCapability === "object") {
            if (SelectItemForCapability.oCapabilityInfo.popupVisible) {
                return SelectItemForCapability.oCapabilityInfo;
            }
        }
        return null;
    }
    ;
    let jsTooltipDelayHandle = null;
    function ShowVideoClip() {
        const id = $.GetContextPanel().GetAttributeString('itemid', '0');
        const reelId = InventoryAPI.GetItemAttributeValue(id, '{uint32}keychain slot 0 highlight');
        if (reelId) {
            const reelJson = InventoryAPI.BuildHighlightReelSchemaJSON(reelId);
            const reelSchemaDef = JSON.parse(reelJson);
            const videoPlayerContainer = $.GetContextPanel().FindChildTraverse('VideoClipMovieContainer');
            const videoPlayer = $.GetContextPanel().FindChildTraverse('VideoClipMovie');
            if (videoPlayerContainer && videoPlayer) {
                videoPlayerContainer.AddClass('play');
                videoPlayer.AddClass('play');
                videoPlayer.SetMovie(reelSchemaDef["url_480p"]);
                videoPlayer.Play();
            }
        }
    }
    function HideVideoClip() {
        let id = $.GetContextPanel().GetAttributeString('itemid', '0');
        if (InventoryAPI.GetItemAttributeValue(id, '{uint32}keychain slot 0 highlight')) {
            const videoPlayerContainer = $.GetContextPanel().FindChildTraverse('VideoClipMovieContainer');
            const videoPlayer = $.GetContextPanel().FindChildTraverse('VideoClipMovie');
            if (videoPlayerContainer && videoPlayer) {
                videoPlayerContainer.RemoveClass('play');
                videoPlayer.RemoveClass('play');
                videoPlayer.Stop();
            }
        }
    }
    function ShowTooltip() {
        jsTooltipDelayHandle = $.Schedule(.4, ShowToolTipOnDelay);
    }
    ItemTile.ShowTooltip = ShowTooltip;
    function ShowToolTipOnDelay() {
        let id = $.GetContextPanel().GetAttributeString('itemid', '0');
        jsTooltipDelayHandle = null;
        if (!InventoryAPI.IsItemInfoValid(id)) {
            return;
        }
        UiToolkitAPI.ShowCustomLayoutParametersTooltip('ItemImage', 'JsItemTooltip', 'file://{resources}/layout/tooltips/tooltip_inventory_item.xml', 'itemid=' + id);
        ShowVideoClip();
    }
    ;
    function HideTooltip() {
        UiToolkitAPI.HideCustomLayoutTooltip('JsItemTooltip');
        if (jsTooltipDelayHandle) {
            $.CancelScheduled(jsTooltipDelayHandle);
            jsTooltipDelayHandle = null;
        }
        HideVideoClip();
    }
    ItemTile.HideTooltip = HideTooltip;
    ;
    {
        $.RegisterEventHandler('CSGOInventoryItemLoaded', $.GetContextPanel(), _OnTileUpdated);
        $.RegisterEventHandler('UpdateItemTile', $.GetContextPanel(), _OnTileUpdated);
        $.RegisterEventHandler('CSGOInventoryHideTooltip', $.GetContextPanel(), HideTooltip);
    }
})(ItemTile || (ItemTile = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXRlbXRpbGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9pdGVtdGlsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBQ2xDLDJDQUEyQztBQUMzQyxtRUFBbUU7QUFDbkUsNkNBQTZDO0FBRTdDLElBQVUsUUFBUSxDQThkakI7QUE5ZEQsV0FBVSxRQUFRO0lBRWpCLFNBQVMsY0FBYyxDQUFFLFVBQWtCO1FBRTFDLElBQUksRUFBRSxHQUFHLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBRSxRQUFRLEVBQUUsR0FBRyxDQUFFLENBQUM7UUFFeEQsSUFBSyxFQUFFLEtBQUssR0FBRztZQUNkLE9BQU87UUFFUixJQUFJLFlBQVksR0FBRyxFQUFFLENBQUM7UUFDdEIsSUFBSyxVQUFVLENBQUMsa0JBQWtCLENBQUUsaUJBQWlCLEVBQUUsRUFBRSxDQUFFLEtBQUssaUJBQWlCLEVBQ2pGO1lBQ0MsWUFBWSxHQUFHLFFBQVEsQ0FBQyx3QkFBd0IsQ0FBRSxFQUFFLEVBQUUsVUFBVSxDQUFFLENBQUM7U0FDbkU7UUFFRCxZQUFZLENBQUUsWUFBWSxDQUFFLENBQUM7UUFDN0IsY0FBYyxDQUFFLEVBQUUsQ0FBRSxDQUFDO1FBQ3JCLGlCQUFpQixDQUFFLEVBQUUsQ0FBRSxDQUFDO1FBQ3hCLFlBQVksQ0FBRSxFQUFFLENBQUUsQ0FBQztRQUNuQixlQUFlLENBQUUsRUFBRSxDQUFFLENBQUM7UUFDdEIsZUFBZSxDQUFFLEVBQUUsQ0FBRSxDQUFDO1FBQ3RCLFlBQVksQ0FBRSxFQUFFLENBQUUsQ0FBQztRQUNuQixjQUFjLENBQUUsRUFBRSxDQUFFLENBQUM7UUFDckIsY0FBYyxDQUFFLEVBQUUsQ0FBRSxDQUFDO1FBQ3JCLGNBQWMsQ0FBRSxFQUFFLENBQUMsQ0FBQztRQUNwQixpQkFBaUIsQ0FBRSxFQUFFLENBQUUsQ0FBQztRQUl4QixJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsa0JBQWtCLENBQUUsV0FBVyxFQUFFLEVBQUUsQ0FBRSxDQUFDO1FBRTFFLElBQUssU0FBUyxFQUNkO1lBQ0MsU0FBUyxDQUFFLEVBQUUsQ0FBRSxDQUFDO1NBQ2hCO0lBQ0YsQ0FBQztJQUFBLENBQUM7SUFLRixTQUFTLFlBQVksQ0FBRSxFQUFVO1FBRWhDLElBQUksT0FBTyxHQUFHLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBRSxFQUFFLENBQUUsQ0FBQztRQUM5QyxPQUFPLENBQUMsVUFBVSxDQUFFLENBQUMsQ0FBRSxhQUFhLENBQUUsQ0FBRSxDQUFDO0lBQzFDLENBQUM7SUFBQSxDQUFDO0lBRUYsU0FBUyxjQUFjLENBQUUsRUFBVTtRQUVsQyxJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUUsY0FBYyxDQUFhLENBQUM7UUFDeEYsSUFBSSxPQUFPLEdBQUcsWUFBWSxDQUFDLGNBQWMsQ0FBRSxFQUFFLENBQUUsQ0FBQztRQUNoRCxJQUFLLE9BQU8sSUFBSSxjQUFjLEVBQzlCO1lBQ0MsVUFBVSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFFMUIsSUFBSSxJQUFJLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBRSxFQUFFLENBQUUsQ0FBQztZQUVuQyxJQUFLLElBQUksRUFDVDtnQkFDQyxVQUFVLENBQUMsUUFBUSxDQUFFLHlDQUF5QyxDQUFFLENBQUM7Z0JBQ2pFLFVBQVUsQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQzthQUN2QztpQkFFRDtnQkFDQyxVQUFVLENBQUMsUUFBUSxDQUFFLHdDQUF3QyxDQUFFLENBQUM7Z0JBQ2hFLFVBQVUsQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQzthQUN2QztTQUNEO2FBRUQ7WUFDQyxVQUFVLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztTQUMzQjtJQUNGLENBQUM7SUFFRCxTQUFTLFNBQVMsQ0FBRSxFQUFVO1FBRTNCLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxXQUFXLENBQW1CLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztJQUN6RixDQUFDO0lBQUEsQ0FBQztJQUVGLFNBQVMsY0FBYyxDQUFFLEVBQVU7UUFFbEMsSUFBSSxLQUFLLEdBQUcsWUFBWSxDQUFDLGtCQUFrQixDQUFFLEVBQUUsQ0FBRSxDQUFDO1FBRWxELElBQUssQ0FBQyxLQUFLO1lBQ1YsT0FBTztRQUVSLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxVQUFVLENBQUUsQ0FBQyxLQUFLLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQztJQUN2RixDQUFDO0lBQUEsQ0FBQztJQUVGLFNBQVMsaUJBQWlCLENBQUUsRUFBVTtRQUVyQyxJQUFJLFdBQVcsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUUscUJBQXFCLENBQUUsQ0FBQztRQUNyRixJQUFJLE9BQU8sR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUUsaUJBQWlCLENBQUUsQ0FBQztRQUM3RSxJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUUsZ0JBQWdCLENBQUUsQ0FBQztRQUMzRSxJQUFJLG9CQUFvQixHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxxQkFBcUIsQ0FBRSxDQUFDO1FBQzlGLElBQUksZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLGlCQUFpQixDQUFFLENBQUM7UUFDdEYsSUFBSSxlQUFlLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLGdCQUFnQixDQUFFLENBQUM7UUFDcEYsTUFBTSxDQUFDLFFBQVEsQ0FBRSxRQUFRLENBQUUsQ0FBQztRQUM1QixPQUFPLENBQUMsUUFBUSxDQUFFLFFBQVEsQ0FBRSxDQUFDO1FBQzdCLFdBQVcsQ0FBQyxRQUFRLENBQUUsUUFBUSxDQUFFLENBQUM7UUFDakMsTUFBTSxDQUFDLFdBQVcsQ0FBRSx1Q0FBdUMsQ0FBRSxDQUFDO1FBQzlELE9BQU8sQ0FBQyxXQUFXLENBQUUsdUNBQXVDLENBQUUsQ0FBQztRQUMvRCxXQUFXLENBQUMsV0FBVyxDQUFFLHVDQUF1QyxDQUFFLENBQUM7UUFDbkUsb0JBQW9CLENBQUMsV0FBVyxDQUFFLFFBQVEsRUFBRSxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBRSxRQUFRLEVBQUUsRUFBRSxDQUFFLENBQUUsQ0FBQztRQUM5RixnQkFBZ0IsQ0FBQyxXQUFXLENBQUUsUUFBUSxFQUFFLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFFLElBQUksRUFBRSxFQUFFLENBQUUsQ0FBRSxDQUFDO1FBQ3RGLGVBQWUsQ0FBQyxXQUFXLENBQUUsUUFBUSxFQUFFLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFFLEdBQUcsRUFBRSxFQUFFLENBQUUsQ0FBRSxDQUFDO1FBRXBGLEtBQU0sSUFBSSxJQUFJLElBQUksQ0FBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBa0IsRUFDekQ7WUFDQyxJQUFLLGdCQUFnQixDQUFFLEVBQUUsRUFBRSxJQUFJLENBQUUsRUFDakM7Z0JBQ0MsYUFBYSxDQUFFLElBQUksRUFBRSxJQUFJLENBQUUsQ0FBQzthQUM1QjtpQkFDSSxJQUFLLFlBQVksQ0FBQyxVQUFVLENBQUUsRUFBRSxFQUFFLElBQUksQ0FBRSxFQUM3QztnQkFDQyxhQUFhLENBQUUsS0FBSyxFQUFFLElBQUksQ0FBRSxDQUFDO2FBQzdCO1NBQ0Q7SUFDRixDQUFDO0lBQUEsQ0FBQztJQUVGLFNBQVMsZ0JBQWdCLENBQUUsRUFBVSxFQUFFLElBQWdCO1FBRXRELElBQUksSUFBSSxHQUFHLFlBQVksQ0FBQyxtQkFBbUIsQ0FBRSxFQUFFLEVBQUUsd0JBQXdCLENBQUUsQ0FBQztRQUM1RSxJQUFLLENBQUUsWUFBWSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFFLENBQUMsUUFBUSxDQUFFLElBQUksQ0FBRSxFQUNuRTtZQUNDLElBQUksWUFBWSxHQUFHLFlBQVksQ0FBQyxzQkFBc0IsQ0FBRSxFQUFFLENBQUUsQ0FBQztZQUM3RCxJQUFJLEdBQUcsVUFBVSxDQUFDLDJCQUEyQixDQUFFLElBQUksRUFBRSxZQUFZLENBQUUsQ0FBQztTQUNwRTtRQUVELE9BQU8sVUFBVSxDQUFDLGdCQUFnQixDQUFFLElBQUksRUFBRSxJQUFJLENBQUUsSUFBSSxZQUFZLENBQUMsaUJBQWlCLENBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBRSxDQUFDO0lBQ2hHLENBQUM7SUFBQSxDQUFDO0lBRUYsU0FBUyxhQUFhLENBQUUsU0FBa0IsRUFBRSxJQUFnQjtRQUUzRCxJQUFJLE9BQU8sR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUUsZUFBZSxHQUFHLElBQUksQ0FBRSxDQUFDO1FBRWxGLE9BQU8sQ0FBQyxXQUFXLENBQUUsUUFBUSxDQUFFLENBQUM7UUFDaEMsT0FBTyxDQUFDLFFBQVEsQ0FBRSx1Q0FBdUMsQ0FBRSxDQUFDO1FBQzVELE9BQU8sQ0FBQyxXQUFXLENBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBRSxDQUFDO0lBQzdDLENBQUM7SUFBQSxDQUFDO0lBRUYsU0FBUyxZQUFZLENBQUUsRUFBVTtRQUVoQyxJQUFJLGdCQUFnQixHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxrQkFBa0IsQ0FBRSxDQUFDO1FBQ3ZGLGdCQUFnQixDQUFDLHVCQUF1QixFQUFFLENBQUM7UUFFM0MsSUFBSSxpQkFBaUIsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUUsbUJBQW1CLENBQUUsQ0FBQztRQUN6RixpQkFBaUIsQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1FBRTVDLElBQUksWUFBWSxHQUFHLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBRSxFQUFFLENBQUUsQ0FBQztRQUVyRCxLQUFNLElBQUksS0FBSyxJQUFJLFlBQVksRUFDL0I7WUFFQyxDQUFDLENBQUMsV0FBVyxDQUFFLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxXQUFXLEdBQUcsS0FBSyxDQUFDLEtBQUssRUFBRTtnQkFDcEUsR0FBRyxFQUFFLGlCQUFpQixHQUFHLEtBQUssQ0FBQyxLQUFLLEdBQUcsTUFBTTtnQkFDN0MsT0FBTyxFQUFFLGdDQUFnQztnQkFDekMsS0FBSyxFQUFFLDRCQUE0QjthQUNuQyxDQUFFLENBQUM7U0FDSjtRQUVELGdCQUFnQixDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsWUFBWSxDQUFDLE1BQU0sSUFBSSxDQUFDLElBQUksWUFBWSxLQUFLLFNBQVMsQ0FBRSxDQUFDO1FBRWhHLElBQUksYUFBYSxHQUFHLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBRSxFQUFFLENBQUUsQ0FBQztRQUN2RCxLQUFNLElBQUksS0FBSyxJQUFJLGFBQWEsRUFDaEM7WUFFQyxDQUFDLENBQUMsV0FBVyxDQUFFLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxXQUFXLEdBQUcsS0FBSyxDQUFDLEtBQUssRUFBRTtnQkFDckUsR0FBRyxFQUFFLGlCQUFpQixHQUFHLEtBQUssQ0FBQyxLQUFLLEdBQUcsTUFBTTtnQkFDN0MsT0FBTyxFQUFFLGdDQUFnQztnQkFDekMsS0FBSyxFQUFFLDRCQUE0QjthQUNuQyxDQUFFLENBQUM7U0FDSjtRQUVELGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsYUFBYSxDQUFDLE1BQU0sSUFBSSxDQUFDLElBQUksYUFBYSxLQUFLLFNBQVMsQ0FBRSxDQUFDO0lBQ3BHLENBQUM7SUFBQSxDQUFDO0lBRUYsU0FBUyxlQUFlLENBQUUsRUFBVTtRQUVuQyxJQUFJLE9BQU8sR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUUsVUFBVSxDQUFhLENBQUM7UUFFakYsSUFBSSxzQkFBc0IsR0FBRyxZQUFZLENBQUMscUJBQXFCLENBQUUsRUFBRSxFQUFFLHFDQUFxQyxDQUFFLENBQUM7UUFDN0csSUFBSyxDQUFFLHNCQUFzQixLQUFLLFNBQVMsQ0FBRSxJQUFJLENBQUUsc0JBQXNCLElBQUksQ0FBQyxDQUFFLEVBQ2hGO1lBRUMsT0FBTyxDQUFDLFdBQVcsQ0FBRSxRQUFRLENBQUUsQ0FBQztZQUNoQyxPQUFPLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUUsaUNBQWlDLENBQUUsQ0FBQztZQUMvRCxPQUFPO1NBQ1A7UUFFRCxJQUFJLGFBQWEsR0FBRyxZQUFZLENBQUMsMkJBQTJCLENBQUUsRUFBRSxFQUFFLFFBQVEsQ0FBRSxDQUFDO1FBQzdFLElBQUksY0FBYyxHQUFHLFlBQVksQ0FBQywyQkFBMkIsQ0FBRSxFQUFFLEVBQUUsU0FBUyxDQUFFLENBQUM7UUFDL0UsSUFBSyxjQUFjLEtBQUssR0FBRyxJQUFJLGFBQWEsS0FBSyxHQUFHLEVBQ3BEO1lBQ0MsSUFBSSxTQUFTLEdBQUcsUUFBUSxDQUFDO1lBQ3pCLElBQUssYUFBYSxLQUFLLEdBQUcsRUFDMUI7Z0JBQ0MsSUFBSSxtQkFBbUIsR0FBRyxZQUFZLENBQUMsMkJBQTJCLENBQUUsRUFBRSxFQUFFLG9CQUFvQixDQUFFLENBQUM7Z0JBQy9GLElBQUssbUJBQW1CLElBQUksQ0FBRSxjQUFjLEVBQUUsY0FBYyxDQUFFLENBQUMsUUFBUSxDQUFFLG1CQUFtQixDQUFFLEVBQzlGO29CQUNDLFNBQVMsR0FBRyxtQkFBbUIsQ0FBQztpQkFDaEM7YUFDRDtpQkFFRDtnQkFDQyxTQUFTLEdBQUcsU0FBUyxDQUFDO2FBQ3RCO1lBRUQsT0FBTyxDQUFDLFdBQVcsQ0FBRSxRQUFRLENBQUUsQ0FBQztZQUNoQyxPQUFPLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUUsb0JBQW9CLEdBQUcsU0FBUyxDQUFFLENBQUM7WUFDOUQsT0FBTztTQUNQO1FBRUQsT0FBTyxDQUFDLFFBQVEsQ0FBRSxRQUFRLENBQUUsQ0FBQztJQUM5QixDQUFDO0lBQUEsQ0FBQztJQUVGLFNBQVMsZUFBZSxDQUFFLEVBQVU7UUFFbkMsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLFdBQVcsQ0FBRSxDQUFDO1FBQ3ZFLGFBQWEsQ0FBQyxtQkFBbUIsQ0FBRSxFQUFFLEVBQUUsT0FBTyxDQUFFLENBQUM7SUFDbEQsQ0FBQztJQUFBLENBQUM7SUFFRixTQUFTLFlBQVksQ0FBRSxFQUFVO1FBRWhDLElBQUksY0FBYyxHQUFHLG1CQUFtQixFQUFFLENBQUM7UUFFM0MsSUFBSyxjQUFjLElBQUksY0FBYyxDQUFDLFVBQVUsS0FBSyxhQUFhLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFFLEVBQUUsQ0FBRSxFQUMvRjtZQUNDLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxPQUFPLEdBQUcsQ0FBRSxZQUFZLENBQUMsdUJBQXVCLENBQUUsRUFBRSxDQUFFLEdBQUcsWUFBWSxDQUFDLG1CQUFtQixDQUFFLEVBQUUsQ0FBRSxDQUFFLENBQUM7U0FDdEg7YUFDSSxJQUFLLGNBQWMsSUFBSSxjQUFjLENBQUMsVUFBVSxLQUFLLFdBQVcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUUsRUFBRSxDQUFFLEVBQ2hHO1lBQ0MsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLE9BQU8sR0FBRyxDQUFFLFlBQVksQ0FBQyx1QkFBdUIsQ0FBRSxFQUFFLENBQUUsR0FBRyxZQUFZLENBQUMsbUJBQW1CLENBQUUsRUFBRSxDQUFFLENBQUUsQ0FBQztTQUN0SDthQUNJLElBQUssY0FBYyxJQUFJLGNBQWMsQ0FBQyxVQUFVLEtBQUssY0FBYyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBRSxFQUFFLENBQUUsRUFDdEc7WUFDQyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsT0FBTyxHQUFHLENBQUUsWUFBWSxDQUFDLHdCQUF3QixDQUFFLEVBQUUsQ0FBRSxHQUFHLFlBQVksQ0FBQyxvQkFBb0IsQ0FBRSxFQUFFLENBQUUsQ0FBRSxDQUFDO1NBQ3hIO0lBQ0YsQ0FBQztJQUFBLENBQUM7SUFFRixTQUFTLGNBQWMsQ0FBRSxFQUFTO1FBRWpDLElBQUksT0FBTyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxjQUFjLENBQWEsQ0FBQztRQUVyRixJQUFJLEtBQUssR0FBRyxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUUsRUFBRSxDQUFFLENBQUM7UUFDekMsSUFBSyxLQUFLLEVBQ1Y7WUFDQyxPQUFPLENBQUMsUUFBUSxDQUFFLFFBQVEsQ0FBRSxDQUFDO1lBQzdCLE9BQU87U0FDUDtRQUVELE1BQU0sY0FBYyxHQUFHLFlBQVksQ0FBQyxpQkFBaUIsQ0FBRSxFQUFFLENBQUUsQ0FBQztRQUM1RCxJQUFLLGNBQWMsSUFBSSxDQUFDLEVBQ3hCO1lBQ0MsT0FBTyxDQUFDLFFBQVEsQ0FBRSxRQUFRLENBQUUsQ0FBQztZQUM3QixPQUFPO1NBQ1A7UUFFRCxJQUFJLFFBQVEsR0FBRyxVQUFVLENBQUMsZ0JBQWdCLENBQUUsY0FBYyxDQUFFLENBQUM7UUFDN0QsT0FBTyxDQUFDLFdBQVcsQ0FBRSxjQUFjLEVBQUUsUUFBUSxDQUFDLFNBQVUsQ0FBRSxDQUFDO1FBQzNELE9BQU8sQ0FBQyxpQkFBaUIsQ0FBRSxnQkFBZ0IsRUFBRSxRQUFRLENBQUMsSUFBSyxDQUFDLENBQUM7UUFDN0QsT0FBTyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFFLFFBQVEsQ0FBQyxTQUFVLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDekQsT0FBTyxDQUFDLFdBQVcsQ0FBRSxRQUFRLENBQUUsQ0FBQztJQUNqQyxDQUFDO0lBRUQsU0FBZ0IsY0FBYyxDQUFFLEVBQVM7UUFFeEMsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLGVBQWUsQ0FBYSxDQUFDO1FBRXRGLElBQUksQ0FBQyxZQUFZLENBQUMsZ0JBQWdCLENBQUUsRUFBRSxDQUFFLEVBQ3hDO1lBQ0MsT0FBTyxDQUFDLFFBQVEsQ0FBRSxRQUFRLENBQUUsQ0FBQztZQUM3QixPQUFPO1NBQ1A7UUFFRCxPQUFPLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUUsZ0JBQWdCLENBQUUsQ0FBQztRQUM5QyxPQUFPLENBQUMsV0FBVyxDQUFFLFFBQVEsQ0FBRSxDQUFDO0lBQ2pDLENBQUM7SUFaZSx1QkFBYyxpQkFZN0IsQ0FBQTtJQUVELFNBQVMsaUJBQWlCLENBQUUsRUFBUztRQUVwQyxNQUFNLE9BQU8sR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUUsaUJBQWlCLENBQWEsQ0FBQztRQUMxRixPQUFPLENBQUMsV0FBVyxDQUFFLFFBQVEsRUFBRSxDQUFDLENBQUUsWUFBWSxDQUFDLHFCQUFxQixDQUFFLEVBQUUsRUFBRSw4QkFBOEIsQ0FBRSxJQUFJLFNBQVMsQ0FBRSxDQUFDLENBQUM7SUFDNUgsQ0FBQztJQUVELFNBQWdCLFVBQVU7UUFFekIsV0FBVyxFQUFFLENBQUM7UUFDZCxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsa0JBQWtCLENBQUUsUUFBUSxFQUFFLEdBQUcsQ0FBRSxDQUFDO1FBR2pFLElBQUssQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLFlBQVksQ0FBRSwyQkFBMkIsQ0FBRSxJQUFJLElBQUksRUFDNUU7WUFDQyxDQUFDLENBQUMsYUFBYSxDQUFFLHFCQUFxQixFQUFFLENBQUMsQ0FBQyxlQUFlLEVBQUUsRUFBRSxFQUFFLENBQUUsQ0FBQztZQUNsRSxPQUFPO1NBQ1A7UUFFRCxJQUFLLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxZQUFZLENBQUUsMEJBQTBCLENBQUUsSUFBSSxJQUFJLEVBQzNFO1lBQ0MsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxxQkFBcUIsRUFBRSxDQUFDLENBQUMsZUFBZSxFQUFFLEVBQUUsRUFBRSxDQUFFLENBQUM7WUFDbEUsT0FBTztTQUNQO1FBRUQsSUFBSyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsWUFBWSxDQUFFLGdCQUFnQixDQUFFLElBQUksSUFBSSxFQUNqRTtZQUNDLFlBQVksQ0FBQyxrQkFBa0IsQ0FBRSxFQUFFLENBQUUsQ0FBQztZQUN0QyxPQUFPO1NBQ1A7UUFFRCxJQUFLLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxZQUFZLENBQUUsc0JBQXNCLENBQUUsSUFBSSxJQUFJLEVBQ3ZFO1lBQ0MsWUFBWSxDQUFDLHFCQUFxQixDQUFFLEVBQUUsQ0FBRSxDQUFDO1lBQ3pDLE9BQU87U0FDUDtRQUdELElBQUksV0FBVyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxxQkFBcUIsRUFBRSxFQUFFLENBQUUsQ0FBQztRQUN0RixJQUFJLDJCQUEyQixHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsc0JBQXNCLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDMUYsSUFBSSxnQkFBZ0IsR0FBRyxFQUFFLENBQUM7UUFDMUIsSUFBSyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsa0JBQWtCLENBQUUsaUJBQWlCLEVBQUUsRUFBRSxDQUFFLEtBQUssaUJBQWlCO1lBQ3pGLGdCQUFnQixHQUFHLDRCQUE0QixDQUFDO1FBR2pELElBQUksZ0JBQWdCLEdBQUcsWUFBWSxDQUFDLGlEQUFpRCxDQUNwRixFQUFFLEVBQ0YsRUFBRSxFQUNGLHlFQUF5RSxFQUN6RSxTQUFTLEdBQUcsRUFBRSxHQUFHLDJCQUEyQixHQUFHLGdCQUFnQixFQUMvRCxHQUFHLEVBQUUsR0FBRSxDQUFDLENBQ1IsQ0FBQztRQUNGLGdCQUFnQixDQUFDLFFBQVEsQ0FBRSxxQkFBcUIsQ0FBRSxDQUFDO1FBQ25ELGdCQUFnQixDQUFDLFFBQVEsQ0FBRSwwQkFBMEIsQ0FBRSxDQUFDO0lBQ3pELENBQUM7SUEvQ2UsbUJBQVUsYUErQ3pCLENBQUE7SUFBQSxDQUFDO0lBR0YsSUFBSSxzQkFBb0MsQ0FBQztJQUV6QyxTQUFnQiwrQkFBK0I7UUFFOUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGtCQUFrQixDQUFFLFFBQVEsRUFBRSxHQUFHLENBQUUsQ0FBQztRQUVqRSxJQUFLLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxZQUFZLENBQUUsZ0JBQWdCLENBQUUsSUFBSSxJQUFJLElBQUksQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLFlBQVksQ0FBRSxzQkFBc0IsQ0FBRSxJQUFJLElBQUksRUFDdkk7WUFDQyxDQUFDLENBQUMsYUFBYSxDQUFFLHNCQUFzQixFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUUsQ0FBQztZQUNsRCxPQUFPO1NBQ1A7UUFFRCxJQUFJLGVBQWUsR0FBRyxtQkFBbUIsRUFBOEMsQ0FBQztRQUN4RixJQUFJLGVBQWUsS0FBSyxJQUFJLElBQUssZUFBZSxDQUFDLFlBQVksRUFDN0Q7WUFDQyxJQUFJLHNCQUFzQixFQUMxQjtnQkFDQyxZQUFZLENBQUMsb0JBQW9CLENBQUUsc0JBQXNCLENBQUUsQ0FBQzthQUM1RDtZQUVELHNCQUFzQixHQUFHLFlBQVksQ0FBQyxrQkFBa0IsQ0FBRSx1QkFBdUIsQ0FBQyxVQUFVLENBQUUsQ0FBQztZQUkvRixNQUFNLE9BQU8sR0FBRyxZQUFZLENBQUMscUJBQXFCLENBQ2pELEVBQUUsRUFDRiw4REFBOEQsQ0FDOUQsQ0FBQztZQUVGLElBQUksU0FBUyxHQUEwQjtnQkFDdEMsT0FBTyxFQUFFLEVBQUU7Z0JBQ1gsWUFBWSxFQUFFLElBQUk7Z0JBQ2xCLGdCQUFnQixFQUFFLGVBQWUsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSztnQkFDOUQsVUFBVSxFQUFFLGVBQWUsQ0FBQyxVQUFVO2dCQUN0QyxxQkFBcUIsRUFBRSxJQUFJO2dCQUMzQixXQUFXLEVBQUUsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLFNBQVMsQ0FBRSxpQ0FBaUMsQ0FBRTtnQkFDL0UsZUFBZSxFQUFFLHNCQUFzQjthQUN2QyxDQUFBO1lBRUQsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7U0FDckM7SUFDRixDQUFDO0lBdkNlLHdDQUErQixrQ0F1QzlDLENBQUE7SUFFRCxTQUFTLG1CQUFtQjtRQUUzQixJQUFLLE9BQU8sdUJBQXVCLEtBQUssUUFBUSxFQUNoRDtZQUNDLElBQUksdUJBQXVCLENBQUMsZUFBZSxDQUFDLFlBQVksRUFDeEQ7Z0JBQ0MsT0FBTyx1QkFBdUIsQ0FBQyxlQUFlLENBQUE7YUFDOUM7U0FDRDtRQUVELE9BQU8sSUFBSSxDQUFDO0lBQ2IsQ0FBQztJQUFBLENBQUM7SUFFRixJQUFJLG9CQUFvQixHQUFrQixJQUFJLENBQUM7SUFFL0MsU0FBUyxhQUFhO1FBRXJCLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxRQUFRLEVBQUUsR0FBRyxDQUFFLENBQUM7UUFDbkUsTUFBTSxNQUFNLEdBQUcsWUFBWSxDQUFDLHFCQUFxQixDQUFFLEVBQUUsRUFBRSxtQ0FBbUMsQ0FBRSxDQUFBO1FBQzVGLElBQUssTUFBTSxFQUNYO1lBQ0MsTUFBTSxRQUFRLEdBQUcsWUFBWSxDQUFDLDRCQUE0QixDQUFFLE1BQWdCLENBQUUsQ0FBQztZQUMvRSxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFFLFFBQVEsQ0FBRSxDQUFDO1lBRTdDLE1BQU0sb0JBQW9CLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGlCQUFpQixDQUFFLHlCQUF5QixDQUFFLENBQUM7WUFDaEcsTUFBTSxXQUFXLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGlCQUFpQixDQUFFLGdCQUFnQixDQUFhLENBQUM7WUFDekYsSUFBSyxvQkFBb0IsSUFBSSxXQUFXLEVBQ3hDO2dCQUNDLG9CQUFvQixDQUFDLFFBQVEsQ0FBRSxNQUFNLENBQUUsQ0FBQztnQkFDeEMsV0FBVyxDQUFDLFFBQVEsQ0FBRSxNQUFNLENBQUUsQ0FBQztnQkFDL0IsV0FBVyxDQUFDLFFBQVEsQ0FBRSxhQUFhLENBQUUsVUFBVSxDQUFFLENBQUUsQ0FBQztnQkFDcEQsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDO2FBQ25CO1NBQ0Q7SUFDRixDQUFDO0lBRUQsU0FBUyxhQUFhO1FBRXJCLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxRQUFRLEVBQUUsR0FBRyxDQUFFLENBQUM7UUFDakUsSUFBSyxZQUFZLENBQUMscUJBQXFCLENBQUUsRUFBRSxFQUFFLG1DQUFtQyxDQUFFLEVBQ2xGO1lBRUMsTUFBTSxvQkFBb0IsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsaUJBQWlCLENBQUUseUJBQXlCLENBQUUsQ0FBQztZQUNoRyxNQUFNLFdBQVcsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsaUJBQWlCLENBQUUsZ0JBQWdCLENBQWEsQ0FBQztZQUN6RixJQUFLLG9CQUFvQixJQUFJLFdBQVcsRUFDeEM7Z0JBQ0Msb0JBQW9CLENBQUMsV0FBVyxDQUFFLE1BQU0sQ0FBRSxDQUFDO2dCQUMzQyxXQUFXLENBQUMsV0FBVyxDQUFFLE1BQU0sQ0FBRSxDQUFDO2dCQUNsQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7YUFDbkI7U0FDRDtJQUNGLENBQUM7SUFFRCxTQUFnQixXQUFXO1FBRTFCLG9CQUFvQixHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUUsRUFBRSxFQUFFLGtCQUFrQixDQUFFLENBQUM7SUFDN0QsQ0FBQztJQUhlLG9CQUFXLGNBRzFCLENBQUE7SUFFRCxTQUFTLGtCQUFrQjtRQUUxQixJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsa0JBQWtCLENBQUUsUUFBUSxFQUFFLEdBQUcsQ0FBRSxDQUFDO1FBRWpFLG9CQUFvQixHQUFHLElBQUksQ0FBQztRQUM1QixJQUFLLENBQUMsWUFBWSxDQUFDLGVBQWUsQ0FBRSxFQUFFLENBQUUsRUFDeEM7WUFDQyxPQUFPO1NBQ1A7UUFFRCxZQUFZLENBQUMsaUNBQWlDLENBQzdDLFdBQVcsRUFDWCxlQUFlLEVBQ2YsK0RBQStELEVBQy9ELFNBQVMsR0FBRyxFQUFFLENBQ2QsQ0FBQztRQUVGLGFBQWEsRUFBRSxDQUFDO0lBRWpCLENBQUM7SUFBQSxDQUFDO0lBRUYsU0FBZ0IsV0FBVztRQUUxQixZQUFZLENBQUMsdUJBQXVCLENBQUUsZUFBZSxDQUFFLENBQUM7UUFFeEQsSUFBSyxvQkFBb0IsRUFDekI7WUFDQyxDQUFDLENBQUMsZUFBZSxDQUFFLG9CQUFvQixDQUFFLENBQUM7WUFDMUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDO1NBQzVCO1FBRUQsYUFBYSxFQUFFLENBQUM7SUFDakIsQ0FBQztJQVhlLG9CQUFXLGNBVzFCLENBQUE7SUFBQSxDQUFDO0lBTUY7UUFDQyxDQUFDLENBQUMsb0JBQW9CLENBQUUseUJBQXlCLEVBQUUsQ0FBQyxDQUFDLGVBQWUsRUFBRSxFQUFFLGNBQWMsQ0FBRSxDQUFDO1FBQ3pGLENBQUMsQ0FBQyxvQkFBb0IsQ0FBRSxnQkFBZ0IsRUFBRSxDQUFDLENBQUMsZUFBZSxFQUFFLEVBQUUsY0FBYyxDQUFFLENBQUM7UUFDaEYsQ0FBQyxDQUFDLG9CQUFvQixDQUFFLDBCQUEwQixFQUFFLENBQUMsQ0FBQyxlQUFlLEVBQUUsRUFBRSxXQUFXLENBQUUsQ0FBQztLQUN2RjtBQUNGLENBQUMsRUE5ZFMsUUFBUSxLQUFSLFFBQVEsUUE4ZGpCIn0=