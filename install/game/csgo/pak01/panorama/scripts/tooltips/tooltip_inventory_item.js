"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../common/icon.ts" />
var TooltipInventoryItem;
(function (TooltipInventoryItem) {
    function SetupTooltip() {
        let ctx = $.GetContextPanel();
        let id = ctx.GetAttributeString("itemid", "0");
        // is this a faux item id?
        let bThisIsFauxItemID = InventoryAPI.IsFauxItemID(id);
        // name
        ctx.SetDialogVariable('name', InventoryAPI.GetItemNameUncustomized(id));
        const elCustomName = ctx.FindChildInLayoutFile('jsCustomName');
        if (elCustomName) {
            elCustomName.visible = InventoryAPI.HasCustomName(id);
            ctx.SetDialogVariable('custom-name', '"' + InventoryAPI.GetItemNameCustomized(id) + '"');
        }
        // description
        let strDesc = InventoryAPI.GetItemDescription(id, '');
        if (strDesc.endsWith('<br>')) {
            // remove trailing <br>
            strDesc = strDesc.slice(0, -4);
        }
        // special tooltip line for "Charm Pliers" to display Keychain Remove Charges
        if (bThisIsFauxItemID && InventoryAPI.DoesItemMatchDefinitionByName(id, "Remove Keychain Tool")) {
            let numKeychainRemoveToolChargesRemaining = InventoryAPI.GetCacheTypeElementFieldByIndex('KeychainRemoveToolCharges', 0, 'charges');
            if (numKeychainRemoveToolChargesRemaining > 0) {
                ctx.SetDialogVariableInt('item_count', numKeychainRemoveToolChargesRemaining);
                strDesc = strDesc + '<br/><font color="#99ccff">' + $.Localize('#Attrib_KeychainRemoveTool_Charges', ctx) + '</font>';
            }
        }
        ctx.SetDialogVariable('description', strDesc);
        //Original Owner
        let isOriginalOwner = (InventoryAPI.GetItemAttributeValue(id, '{uint32}purchaser account id') != undefined);
        let elOrignalOwner = $('#JsOriginalOwnerTooltip');
        elOrignalOwner.visible = isOriginalOwner;
        $('#JsOriginalOwnerTooltipSeperator').visible = isOriginalOwner;
        // Set collection name
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
        // Set rarity color/label
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
        // set grade (wear amount)
        let numWear = bThisIsFauxItemID ? undefined : InventoryAPI.GetWear(id);
        if (numWear != undefined && numWear >= 0) {
            ctx.AddClass('tooltip-inventory-item__has-grade');
            ctx.SetDialogVariable('grade', $.Localize('#SFUI_InvTooltip_Wear_Amount_' + numWear));
        }
        else {
            ctx.RemoveClass('tooltip-inventory-item__has-grade');
            ctx.SetDialogVariable('grade', '');
        }
        // set teams
        let strTeam = InventoryAPI.GetItemTeam(id);
        // HACK: Check for no team.
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
        // replace description with debug information
        if (GameInterfaceAPI.GetSettingString("cl_inventory_debug_tooltip") == "1") {
            let debugOutput = "<br />";
            function Print(string) {
                debugOutput += string + "<br />";
            }
            // generic
            Print("--------------------------------------");
            Print("itemID: " + id);
            Print("--------------------------------------");
            // tags
            let oTags = InventoryAPI.BuildItemTagsObject(id);
            for (let key of Object.keys(oTags)) {
                let tag = oTags[key];
                let cat = Object.keys(tag)[0];
                let val = tag[Object.keys(tag)[0]];
                Print(cat + ": " + val);
            }
            ///////////////////////////////////////////////////////
            ctx.SetDialogVariable('description', debugOutput);
        }
    }
    TooltipInventoryItem.SetupTooltip = SetupTooltip;
})(TooltipInventoryItem || (TooltipInventoryItem = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbHRpcF9pbnZlbnRvcnlfaXRlbS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3Rvb2x0aXBzL3Rvb2x0aXBfaW52ZW50b3J5X2l0ZW0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQywwQ0FBMEM7QUFFMUMsSUFBVSxvQkFBb0IsQ0FxSzdCO0FBcktELFdBQVUsb0JBQW9CO0lBRTdCLFNBQWdCLFlBQVk7UUFFM0IsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQzlCLElBQUksRUFBRSxHQUFHLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFFL0MsMEJBQTBCO1FBQzFCLElBQUksaUJBQWlCLEdBQUcsWUFBWSxDQUFDLFlBQVksQ0FBRSxFQUFFLENBQUUsQ0FBQztRQUV4RCxPQUFPO1FBQ1AsR0FBRyxDQUFDLGlCQUFpQixDQUFFLE1BQU0sRUFBRSxZQUFZLENBQUMsdUJBQXVCLENBQUUsRUFBRSxDQUFFLENBQUUsQ0FBQztRQUU1RSxNQUFNLFlBQVksR0FBRyxHQUFHLENBQUMscUJBQXFCLENBQUUsY0FBYyxDQUFFLENBQUM7UUFDakUsSUFBSyxZQUFZLEVBQ2pCO1lBQ0MsWUFBWSxDQUFDLE9BQU8sR0FBRyxZQUFZLENBQUMsYUFBYSxDQUFFLEVBQUUsQ0FBRSxDQUFDO1lBQ3hELEdBQUcsQ0FBQyxpQkFBaUIsQ0FBRSxhQUFhLEVBQUUsR0FBRyxHQUFHLFlBQVksQ0FBQyxxQkFBcUIsQ0FBRSxFQUFFLENBQUUsR0FBRyxHQUFHLENBQUUsQ0FBQztTQUM3RjtRQUVELGNBQWM7UUFDZCxJQUFJLE9BQU8sR0FBRyxZQUFZLENBQUMsa0JBQWtCLENBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBRSxDQUFDO1FBQ3hELElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFN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