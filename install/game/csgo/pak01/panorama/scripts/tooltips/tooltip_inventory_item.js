"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../common/icon.ts" />
var TooltipInventoryItem;
(function (TooltipInventoryItem) {
    function SetupTooltip() {
        let ctx = $.GetContextPanel();
        let id = ctx.GetAttributeString("itemid", "0");
        let bThisIsFauxItemID = InventoryAPI.IsFauxItemID(id);
        ctx.SetDialogVariable('name', InventoryAPI.GetItemNameUncustomized(id));
        const elCustomName = ctx.FindChildInLayoutFile('jsCustomName');
        if (elCustomName) {
            elCustomName.visible = InventoryAPI.HasCustomName(id);
            ctx.SetDialogVariable('custom-name', '"' + InventoryAPI.GetItemNameCustomized(id) + '"');
        }
        let strDesc = InventoryAPI.GetItemDescription(id, '');
        if (strDesc.endsWith('<br>')) {
            strDesc = strDesc.slice(0, -4);
        }
        if (bThisIsFauxItemID && InventoryAPI.DoesItemMatchDefinitionByName(id, "Remove Keychain Tool")) {
            let numKeychainRemoveToolChargesRemaining = InventoryAPI.GetCacheTypeElementFieldByIndex('KeychainRemoveToolCharges', 0, 'charges');
            if (numKeychainRemoveToolChargesRemaining > 0) {
                ctx.SetDialogVariableInt('item_count', numKeychainRemoveToolChargesRemaining);
                strDesc = strDesc + '<br/><font color="#99ccff">' + $.Localize('#Attrib_KeychainRemoveTool_Charges', ctx) + '</font>';
            }
        }
        ctx.SetDialogVariable('description', strDesc);
        let isOriginalOwner = (InventoryAPI.GetItemAttributeValue(id, '{uint32}purchaser account id') != undefined);
        let elOrignalOwner = $('#JsOriginalOwnerTooltip');
        elOrignalOwner.visible = isOriginalOwner;
        $('#JsOriginalOwnerTooltipSeperator').visible = isOriginalOwner;
        let strSetName = InventoryAPI.GetTag(id, 'ItemSet');
        let elCollectionLogo = $('#CollectionLogo');
        if (elCollectionLogo)
            elCollectionLogo.DeleteAsync(0.0);
        elCollectionLogo = $.CreatePanel('Image', $.GetContextPanel().FindChildInLayoutFile('jsTopItemTooltipRow'), 'CollectionLogo', { class: "collection-logo", texturewidth: "56", scaling: "stretch-to-fit-preserve-aspect" });
        if (strSetName && strSetName != '0') {
            ctx.AddClass('tooltip-inventory-item__has-set');
            IconUtil.SetupFallbackItemSetIcon(elCollectionLogo, strSetName);
            IconUtil.SetItemSetSVGImage(elCollectionLogo, strSetName);
            ctx.SetDialogVariable('collection', InventoryAPI.GetTagString(strSetName));
        }
        else {
            ctx.RemoveClass('tooltip-inventory-item__has-set');
            elCollectionLogo.SetImage('');
            ctx.SetDialogVariable('collection', '');
        }
        let rarity = InventoryAPI.GetItemRarity(id);
        let rarityName = InventoryAPI.GetItemType(id);
        if (rarityName) {
            ctx.AddClass('tooltip-inventory-item__has-rarity');
            ctx.SwitchClass('tooltip-rarity', 'tooltip-inventory-item__rarity-' + rarity);
            ctx.SetDialogVariable('rarity', rarityName);
        }
        else {
            ctx.RemoveClass('tooltip-inventory-item__has-rarity');
            ctx.SetDialogVariable('rarity', '');
        }
        let numWear = bThisIsFauxItemID ? undefined : InventoryAPI.GetWear(id);
        if (numWear != undefined && numWear >= 0) {
            ctx.AddClass('tooltip-inventory-item__has-grade');
            ctx.SetDialogVariable('grade', $.Localize('#SFUI_InvTooltip_Wear_Amount_' + numWear));
        }
        else {
            ctx.RemoveClass('tooltip-inventory-item__has-grade');
            ctx.SetDialogVariable('grade', '');
        }
        let strTeam = InventoryAPI.GetItemTeam(id);
        let strCategory = InventoryAPI.GetLoadoutCategory(id);
        if (!strCategory || strCategory === 'flair0' || strCategory === 'musickit' || strCategory === 'spray0') {
            strTeam = undefined;
        }
        if (strTeam) {
            ctx.AddClass('tooltip-inventory-item__has-team');
            ctx.SetDialogVariable('team', $.Localize(strTeam));
            let bAny = (strTeam == '#CSGO_Inventory_Team_Any');
            let bCT = bAny || (strTeam == '#CSGO_Inventory_Team_CT');
            let bT = bAny || (strTeam == '#CSGO_Inventory_Team_T');
            ctx.SetHasClass('tooltip-inventory-item__team-ct', bCT);
            ctx.SetHasClass('tooltip-inventory-item__team-t', bT);
        }
        else {
            ctx.RemoveClass('tooltip-inventory-item__has-team');
            ctx.RemoveClass('tooltip-inventory-item__team-ct');
            ctx.RemoveClass('tooltip-inventory-item__team-t');
        }
        if (GameInterfaceAPI.GetSettingString("cl_inventory_debug_tooltip") == "1") {
            let debugOutput = "<br />";
            function Print(string) {
                debugOutput += string + "<br />";
            }
            Print("--------------------------------------");
            Print("itemID: " + id);
            Print("--------------------------------------");
            let oTags = InventoryAPI.BuildItemTagsObject(id);
            for (let key of Object.keys(oTags)) {
                let tag = oTags[key];
                let cat = Object.keys(tag)[0];
                let val = tag[Object.keys(tag)[0]];
                Print(cat + ": " + val);
            }
            ctx.SetDialogVariable('description', debugOutput);
        }
    }
    TooltipInventoryItem.SetupTooltip = SetupTooltip;
})(TooltipInventoryItem || (TooltipInventoryItem = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbHRpcF9pbnZlbnRvcnlfaXRlbS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3Rvb2x0aXBzL3Rvb2x0aXBfaW52ZW50b3J5X2l0ZW0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQywwQ0FBMEM7QUFFMUMsSUFBVSxvQkFBb0IsQ0FxSzdCO0FBcktELFdBQVUsb0JBQW9CO0lBRTdCLFNBQWdCLFlBQVk7UUFFM0IsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQzlCLElBQUksRUFBRSxHQUFHLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFHL0MsSUFBSSxpQkFBaUIsR0FBRyxZQUFZLENBQUMsWUFBWSxDQUFFLEVBQUUsQ0FBRSxDQUFDO1FBR3hELEdBQUcsQ0FBQyxpQkFBaUIsQ0FBRSxNQUFNLEVBQUUsWUFBWSxDQUFDLHVCQUF1QixDQUFFLEVBQUUsQ0FBRSxDQUFFLENBQUM7UUFFNUUsTUFBTSxZQUFZLEdBQUcsR0FBRyxDQUFDLHFCQUFxQixDQUFFLGNBQWMsQ0FBRSxDQUFDO1FBQ2pFLElBQUssWUFBWSxFQUNqQjtZQUNDLFlBQVksQ0FBQyxPQUFPLEdBQUcsWUFBWSxDQUFDLGFBQWEsQ0FBRSxFQUFFLENBQUUsQ0FBQztZQUN4RCxHQUFHLENBQUMsaUJBQWlCLENBQUUsYUFBYSxFQUFFLEdBQUcsR0FBRyxZQUFZLENBQUMscUJBQXFCLENBQUUsRUFBRSxDQUFFLEdBQUcsR0FBRyxDQUFFLENBQUM7U0FDN0Y7UUFHRCxJQUFJLE9BQU8sR0FBRyxZQUFZLENBQUMsa0JBQWtCLENBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBRSxDQUFDO1FBQ3hELElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFDNUI7WUFFQyxPQUFPLEdBQUcsT0FBTyxD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