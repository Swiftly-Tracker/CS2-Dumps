"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../common/icon.ts" />
/// <reference path="../common/iteminfo.ts" />
/// <reference path="popup_inspect_shared.ts" />
var InspectHeader;
(function (InspectHeader) {
    function Init() {
        const elHeaderPanel = $.GetContextPanel().FindChildInLayoutFile('PopUpInspectHeader');
        const showXRayMachineUi = InspectShared.GetPopupSetting('is_xray_machine');
        const isInspectOnly = InspectShared.GetPopupSetting('inspect_only');
        if (isInspectOnly === false && !showXRayMachineUi)
            return;
        const itemId = showXRayMachineUi ? $.GetContextPanel().Data().existingRewardFromXrayId : InspectShared.GetPopupSetting('item_id');
        elHeaderPanel.RemoveClass('hidden');
        _SetName(elHeaderPanel, itemId);
        _SetRarity(elHeaderPanel, itemId);
        _SetCollectionInfo(elHeaderPanel, itemId);
        _SetRentalTime(elHeaderPanel, itemId);
        _SetOriginalOwner(elHeaderPanel, itemId);
    }
    InspectHeader.Init = Init;
    function _SetName(elPanel, ItemId) {
        const strViewFunc = InspectShared.GetPopupSetting('force_inspect_view_type');
        if (ItemInfo.ItemDefinitionNameSubstrMatch(ItemId, 'tournament_journal_'))
            ItemId = (strViewFunc === 'primary') ? ItemId : ItemInfo.GetFauxReplacementItemID(ItemId, 'graffiti');
        elPanel.SetDialogVariable('item_name', InventoryAPI.GetItemNameUncustomized(ItemId));
        elPanel.SetDialogVariable('item_custom_name', InventoryAPI.GetItemNameCustomized(ItemId));
        const bShowCustomName = InventoryAPI.HasCustomName(ItemId);
        elPanel.FindChildInLayoutFile('InspectCustomName').visible = bShowCustomName;
        elPanel.FindChildInLayoutFile('InspectName').SetHasClass('text-align-left', ItemInfo.GetSet(ItemId) !== '');
    }
    function _SetRentalTime(elPanel, ItemId) {
        const elLabel = elPanel.FindChildInLayoutFile('ItemRentalTime');
        const expirationDate = InventoryAPI.IsRental(ItemId) ? InventoryAPI.GetExpirationDate(ItemId) : 0;
        const bHasExpirationDate = (expirationDate > 0);
        if (bHasExpirationDate) {
            const oLocData = FormatText.FormatRentalTime(expirationDate);
            elPanel.SetDialogVariable('time-remaining', oLocData.time);
            elLabel.RemoveClass('hide');
        }
        elLabel.SetHasClass('hide', !bHasExpirationDate);
    }
    function _SetOriginalOwner(elPanel, itemId) {
        const elOriginalOwner = elPanel.FindChildInLayoutFile('InspectOriginalOwner');
        elOriginalOwner.visible = (InventoryAPI.GetItemAttributeValue(itemId, '{uint32}purchaser account id') != undefined);
        const elImage = elPanel.FindChildInLayoutFile('InspectSetImage');
        elOriginalOwner.SetHasClass('horizontal-center', !elImage.visible);
    }
    function _SetRarity(elPanel, itemId) {
        const rarityColor = InventoryAPI.GetItemRarityColor(itemId);
        if (rarityColor) {
            elPanel.FindChildInLayoutFile('InspectBar').style.washColor = rarityColor;
        }
    }
    function _SetCollectionInfo(elPanel, itemId) {
        const setName = ItemInfo.GetSet(itemId);
        const elImage = elPanel.FindChildInLayoutFile('InspectSetImage');
        const elLabel = elPanel.FindChildInLayoutFile('InspectCollection');
        if (InventoryAPI.DoesItemMatchDefinitionByName(itemId, "Remove Keychain Tool")) {
            elImage.SetImage('file://{images}/icons/ui/keychain_removal.svg');
            elImage.visible = true;
            const numKeychainRemoveToolChargesRemaining = InventoryAPI.GetCacheTypeElementFieldByIndex('KeychainRemoveToolCharges', 0, 'charges');
            elLabel.SetDialogVariableInt('item_count', numKeychainRemoveToolChargesRemaining);
            elLabel.text = $.Localize('#Attrib_KeychainRemoveTool_Charges', elLabel);
            elLabel.visible = true;
            return;
        }
        if (setName === '') {
            elImage.visible = false;
            elLabel.visible = false;
            return;
        }
        elLabel.text = $.Localize('#CSGO_' + setName);
        elLabel.visible = true;
        IconUtil.SetupFallbackItemSetIcon(elImage, setName);
        IconUtil.SetItemSetSVGImage(elImage, setName);
        elImage.visible = true;
    }
})(InspectHeader || (InspectHeader = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfaW5zcGVjdF9oZWFkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfaW5zcGVjdF9oZWFkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQywwQ0FBMEM7QUFDMUMsOENBQThDO0FBQzlDLGdEQUFnRDtBQUVoRCxJQUFVLGFBQWEsQ0FnSHRCO0FBaEhELFdBQVUsYUFBYTtJQUV0QixTQUFnQixJQUFJO1FBRW5CLE1BQU0sYUFBYSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxvQkFBb0IsQ0FBRSxDQUFDO1FBQ3hGLE1BQU0saUJBQWlCLEdBQUcsYUFBYSxDQUFDLGVBQWUsQ0FBRSxpQkFBaUIsQ0FBRSxDQUFDO1FBQzdFLE1BQU0sYUFBYSxHQUFHLGFBQWEsQ0FBQyxlQUFlLENBQUUsY0FBYyxDQUFFLENBQUM7UUFFdEUsSUFBSyxhQUFhLEtBQUssS0FBSyxJQUFJLENBQUMsaUJBQWlCO1lBQ2pELE9BQU87UUFFUixNQUFNLE1BQU0sR0FBRyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsZUFBZSxDQUFFLFNBQVMsQ0FBWSxDQUFDO1FBQzlJLGFBQWEsQ0FBQyxXQUFXLENBQUUsUUFBUSxDQUFFLENBQUM7UUFFdEMsUUFBUSxDQUFFLGFBQWEsRUFBRSxNQUFNLENBQUUsQ0FBQztRQUNsQyxVQUFVLENBQUUsYUFBYSxFQUFFLE1BQU0sQ0FBRSxDQUFDO1FBQ3BDLGtCQUFrQixDQUFFLGFBQWEsRUFBRSxNQUFNLENBQUUsQ0FBQztRQUM1QyxjQUFjLENBQUMsYUFBYSxFQUFFLE1BQU0sQ0FBRSxDQUFDO1FBQ3ZDLGlCQUFpQixDQUFFLGFBQWEsRUFBRSxNQUFNLENBQUUsQ0FBQztJQUM1QyxDQUFDO0lBakJlLGtCQUFJLE9BaUJuQixDQUFBO0lBRUQsU0FBUyxRQUFRLENBQUUsT0FBZ0IsRUFBRSxNQUFjO1FBSWxELE1BQU0sV0FBVyxHQUFHLGFBQWEsQ0FBQyxlQUFlLENBQUUseUJBQXlCLENBQUUsQ0FBQztRQUUvRSxJQUFLLFFBQVEsQ0FBQyw2QkFBNkIsQ0FBRSxNQUFNLEVBQUUscUJBQXFCLENBQUU7WUFDM0UsTUFBTSxHQUFHLENBQUUsV0FBVyxLQUFLLFNBQVMsQ0FBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyx3QkFBd0IsQ0FBRSxNQUFNLEVBQUUsVUFBVSxDQUFFLENBQUM7UUFHM0csT0FBTyxDQUFDLGlCQUFpQixDQUFFLFdBQVcsRUFBRSxZQUFZLENBQUMsdUJBQXVCLENBQUUsTUFBTSxDQUFFLENBQUUsQ0FBQztRQUN6RixPQUFPLENBQUMsaUJBQWlCLENBQUUsa0JBQWtCLEVBQUUsWUFBWSxDQUFDLHFCQUFxQixDQUFFLE1BQU0sQ0FBRSxDQUFFLENBQUM7UUFFOUYsTUFBTSxlQUFlLEdBQUcsWUFBWSxDQUFDLGFBQWEsQ0FBRSxNQUFNLENBQUUsQ0FBQztRQUM3RCxPQUFPLENBQUMscUJBQXFCLENBQUUsbUJBQW1CLENBQUUsQ0FBQyxPQUFPLEdBQUcsZUFBZSxDQUFDO1FBQy9FLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBRSxhQUFhLENBQUUsQ0FBQyxXQUFXLENBQUMsaUJBQWlCLEVBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBRSxNQUFNLENBQUUsS0FBSyxFQUFFLENBQUUsQ0FBQTtJQUNsSCxDQUFDO0lBRUQsU0FBUyxjQUFjLENBQUMsT0FBZSxFQUFFLE1BQWE7UUFFckQsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLHFCQUFxQixDQUFFLGdCQUFnQixDQUFFLENBQUM7UUFFbEUsTUFBTSxjQUFjLEdBQUcsWUFBWSxDQUFDLFFBQVEsQ0FBRSxNQUFNLENBQUUsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFFLE1BQU0sQ0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdEcsTUFBTSxrQkFBa0IsR0FBRyxDQUFFLGNBQWMsR0FBRyxDQUFDLENBQUUsQ0FBQztRQUNsRCxJQUFLLGtCQUFrQixFQUN2QjtZQUNDLE1BQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBRSxjQUFjLENBQUUsQ0FBQztZQUMvRCxPQUFPLENBQUMsaUJBQWlCLENBQUUsZ0JBQWdCLEVBQUUsUUFBUSxDQUFDLElBQUssQ0FBRSxDQUFDO1lBQzlELE9BQU8sQ0FBQyxXQUFXLENBQUUsTUFBTSxDQUFFLENBQUM7U0FDOUI7UUFFRCxPQUFPLENBQUMsV0FBVyxDQUFFLE1BQU0sRUFBRSxDQUFDLGtCQUFrQixDQUFFLENBQUM7SUFDcEQsQ0FBQztJQUVELFNBQVMsaUJBQWlCLENBQUUsT0FBZ0IsRUFBRSxNQUFjO1FBRTNELE1BQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBRSxzQkFBc0IsQ0FBYSxDQUFDO1FBQzNGLGVBQWUsQ0FBQyxPQUFPLEdBQUcsQ0FBRSxZQUFZLENBQUMscUJBQXFCLENBQUUsTUFBTSxFQUFFLDhCQUE4QixDQUFFLElBQUksU0FBUyxDQUFFLENBQUM7UUFHeEgsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLHFCQUFxQixDQUFFLGlCQUFpQixDQUFhLENBQUM7UUFDOUUsZUFBZSxDQUFDLFdBQVcsQ0FBRSxtQkFBbUIsRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUUsQ0FBQztJQUN0RSxDQUFDO0lBRUQsU0FBUyxVQUFVLENBQUUsT0FBZ0IsRUFBRSxNQUFjO1FBRXBELE1BQU0sV0FBVyxHQUFHLFlBQVksQ0FBQyxrQkFBa0IsQ0FBRSxNQUFNLENBQUUsQ0FBQztRQUU5RCxJQUFLLFdBQVcsRUFDaEI7WUFDQyxPQUFPLENBQUMscUJBQXFCLENBQUUsWUFBWSxDQUFFLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxXQUFXLENBQUM7U0FDNUU7SUFDRixDQUFDO0lBRUQsU0FBUyxrQkFBa0IsQ0FBRSxPQUFnQixFQUFFLE1BQWM7UUFFNUQsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBRSxNQUFNLENBQUUsQ0FBQztRQUMxQyxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMscUJBQXFCLENBQUUsaUJBQWlCLENBQWEsQ0FBQztRQUM5RSxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMscUJBQXFCLENBQUUsbUJBQW1CLENBQWEsQ0FBQztRQUVoRixJQUFLLFlBQVksQ0FBQyw2QkFBNkIsQ0FBRSxNQUFNLEVBQUUsc0JBQXNCLENBQUUsRUFDakY7WUFDQyxPQUFPLENBQUMsUUFBUSxDQUFFLCtDQUErQyxDQUFFLENBQUM7WUFDcEUsT0FBTyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFFdkIsTUFBTSxxQ0FBcUMsR0FBRyxZQUFZLENBQUMsK0JBQStCLENBQUUsMkJBQTJCLEVBQUUsQ0FBQyxFQUFFLFNBQVMsQ0FBRSxDQUFDO1lBQ3hJLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBRSxZQUFZLEVBQUUscUNBQXFDLENBQUUsQ0FBQztZQUNwRixPQUFPLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUUsb0NBQW9DLEVBQUUsT0FBTyxDQUFFLENBQUM7WUFDM0UsT0FBTyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDdkIsT0FBTztTQUNQO1FBRUQsSUFBSyxPQUFPLEtBQUssRUFBRSxFQUNuQjtZQUNDLE9BQU8sQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1lBQ3hCLE9BQU8sQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1lBQ3hCLE9BQU87U0FDUDtRQUVELE9BQU8sQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxRQUFRLEdBQUcsT0FBTyxDQUFFLENBQUM7UUFDaEQsT0FBTyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7UUFPdkIsUUFBUSxDQUFDLHdCQUF3QixDQUFFLE9BQU8sRUFBRSxPQUFPLENBQUUsQ0FBQztRQUN0RCxRQUFRLENBQUMsa0JBQWtCLENBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBRSxDQUFDO1FBQ2hELE9BQU8sQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO0lBQ3hCLENBQUM7QUFDRixDQUFDLEVBaEhTLGFBQWEsS0FBYixhQUFhLFFBZ0h0QiJ9