"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="formattext.ts" />
/// <reference path="characteranims.ts" />
var ItemInfo;
(function (ItemInfo) {
    function GetFormattedName(id) {
        const strName = InventoryAPI.GetItemNameUncustomized(id);
        const strCustomName = InventoryAPI.GetItemNameCustomized(id);
        if (InventoryAPI.HasCustomName(id)) {
            const splitLoc = strName.indexOf('|');
            let strWeaponName;
            let strPaintName;
            if (splitLoc >= 0) {
                strWeaponName = strName.substring(0, splitLoc).trim();
                strPaintName = strName.substring(splitLoc + 1).trim();
                return new CFormattedText('#CSGO_ItemName_Custom_Painted', { item_name: strWeaponName, paintkit_name: strPaintName, custom_item_name: strCustomName });
            }
            else
                return new CFormattedText('#CSGO_ItemName_Custom_Simple', { item_name: strName, custom_item_name: strCustomName });
        }
        else {
            const splitLoc = strName.indexOf('|');
            if (splitLoc >= 0) {
                const strWeaponName = strName.substring(0, splitLoc).trim();
                const strPaintName = strName.substring(splitLoc + 1).trim();
                return new CFormattedText('#CSGO_ItemName_Painted', { item_name: strWeaponName, paintkit_name: strPaintName });
            }
            return new CFormattedText('#CSGO_ItemName_Base', { item_name: strName });
        }
    }
    ItemInfo.GetFormattedName = GetFormattedName;
    function GetEquippedSlot(id, szTeam) {
        let defIndex = InventoryAPI.GetItemDefinitionIndex(id);
        return LoadoutAPI.GetSlotEquippedWithDefIndex(szTeam, defIndex);
    }
    ItemInfo.GetEquippedSlot = GetEquippedSlot;
    function IsSpraySealed(id) {
        return InventoryAPI.DoesItemMatchDefinitionByName(id, 'spray');
    }
    ItemInfo.IsSpraySealed = IsSpraySealed;
    function IsSprayPaint(id) {
        return InventoryAPI.DoesItemMatchDefinitionByName(id, 'spraypaint');
    }
    ItemInfo.IsSprayPaint = IsSprayPaint;
    function IsTradeUpContract(id) {
        return InventoryAPI.DoesItemMatchDefinitionByName(id, 'Recipe Trade Up');
    }
    ItemInfo.IsTradeUpContract = IsTradeUpContract;
    function ItemHasCapability(id, capName) {
        const caps = [];
        const capCount = InventoryAPI.GetItemCapabilitiesCount(id);
        for (let i = 0; i < capCount; i++) {
            caps.push(InventoryAPI.GetItemCapabilityByIndex(id, i));
        }
        return caps.includes(capName);
    }
    ItemInfo.ItemHasCapability = ItemHasCapability;
    function GetKeyForCaseInXray(caseId) {
        const numActionItems = InventoryAPI.GetChosenActionItemsCount(caseId, 'decodable');
        if (numActionItems > 0) {
            const aKeyIds = [];
            for (let i = 0; i < numActionItems; i++) {
                aKeyIds.push(InventoryAPI.GetChosenActionItemIDByIndex(caseId, 'decodable', i));
            }
            aKeyIds.sort();
            return aKeyIds[0];
        }
        return '';
    }
    ItemInfo.GetKeyForCaseInXray = GetKeyForCaseInXray;
    function GetItemsInXray() {
        InventoryAPI.SetInventorySortAndFilters('inv_sort_age', false, 'xraymachine', '', '');
        const count = InventoryAPI.GetInventoryCount();
        if (count === 0) {
            return {};
        }
        let xrayCaseId = '';
        let xrayRewardId = '';
        for (let i = 0; i < count; i++) {
            const id = InventoryAPI.GetInventoryItemIDByIndex(i);
            xrayRewardId = i === 0 ? id : xrayRewardId;
            xrayCaseId = i === 1 ? id : xrayCaseId;
        }
        return { case: xrayCaseId, reward: xrayRewardId };
    }
    ItemInfo.GetItemsInXray = GetItemsInXray;
    function GetLoadoutWeapons(team) {
        let teamName = CharacterAnims.NormalizeTeamName(team, true);
        const list = [];
        const slotStrings = LoadoutAPI.GetLoadoutSlotNames(false);
        const slots = JSON.parse(slotStrings);
        for (let slot of slots) {
            const weaponItemId = LoadoutAPI.GetItemID(teamName, slot);
            const bIsLoadoutWeapon = ItemInfo.IsWeapon(weaponItemId) || ItemInfo.IsMelee(weaponItemId);
            if (bIsLoadoutWeapon) {
                list.push([slot, weaponItemId]);
            }
        }
        return list;
    }
    ItemInfo.GetLoadoutWeapons = GetLoadoutWeapons;
    function DeepCopyVanityCharacterSettings(inVanityCharacterSettings) {
        const modelRenderSettingsOneOffTempCopy = JSON.parse(JSON.stringify(inVanityCharacterSettings));
        modelRenderSettingsOneOffTempCopy.panel = inVanityCharacterSettings.panel;
        return modelRenderSettingsOneOffTempCopy;
    }
    ItemInfo.DeepCopyVanityCharacterSettings = DeepCopyVanityCharacterSettings;
    function PrecacheVanityCharacterSettings(inVanityCharacterSettings) {
        if (inVanityCharacterSettings.weaponItemId)
            InventoryAPI.PrecacheCustomMaterials(inVanityCharacterSettings.weaponItemId);
        if (inVanityCharacterSettings.glovesItemId)
            InventoryAPI.PrecacheCustomMaterials(inVanityCharacterSettings.glovesItemId);
    }
    ItemInfo.PrecacheVanityCharacterSettings = PrecacheVanityCharacterSettings;
    function GetOrUpdateVanityCharacterSettings(optionalCharacterItemId, optionalState) {
        const oSettings = {
            panel: undefined,
            team: undefined,
            charItemId: undefined,
            loadoutSlot: undefined,
            weaponItemId: undefined,
            glovesItemId: undefined,
            cameraPreset: undefined
        };
        if (optionalCharacterItemId && InventoryAPI.IsValidItemID(optionalCharacterItemId)) {
            const charTeam = InventoryAPI.GetItemTeam(optionalCharacterItemId);
            if (charTeam.search('Team_CT') !== -1)
                oSettings.team = 'ct';
            else if (charTeam.search('Team_T') !== -1)
                oSettings.team = 't';
            if (oSettings.team)
                oSettings.charItemId = optionalCharacterItemId;
        }
        if (!oSettings.team) {
            oSettings.team = GameInterfaceAPI.GetSettingString('ui_vanitysetting_team');
            if (oSettings.team !== 'ct' && oSettings.team !== 't') {
                oSettings.team = (Math.round(Math.random()) > 0) ? 'ct' : 't';
                GameInterfaceAPI.SetSettingString('ui_vanitysetting_team', oSettings.team);
            }
        }
        function RollRandomLoadoutSlotAndWeapon(strTeam) {
            const myResult = {
                loadoutSlot: '',
                weaponItemId: ''
            };
            const slots = JSON.parse(LoadoutAPI.GetLoadoutSlotNames(false));
            while (slots.length > 0) {
                slots.splice(slots.indexOf('heavy3'), 1);
                slots.splice(slots.indexOf('heavy4'), 1);
                const nRandomSlotIndex = Math.floor(Math.random() * slots.length);
                myResult.loadoutSlot = slots.splice(nRandomSlotIndex, 1)[0];
                myResult.weaponItemId = LoadoutAPI.GetItemID(strTeam, myResult.loadoutSlot);
                if (ItemInfo.IsWeapon(myResult.weaponItemId) || ItemInfo.IsMelee(myResult.weaponItemId))
                    break;
            }
            return myResult;
        }
        ;
        oSettings.loadoutSlot = GameInterfaceAPI.GetSettingString('ui_vanitysetting_loadoutslot_' + oSettings.team);
        if (!JSON.parse(LoadoutAPI.GetLoadoutSlotNames(false)).includes(oSettings.loadoutSlot))
            oSettings.loadoutSlot = '';
        oSettings.weaponItemId = LoadoutAPI.GetItemID(oSettings.team, oSettings.loadoutSlot);
        if (!(ItemInfo.IsWeapon(oSettings.weaponItemId) || ItemInfo.IsMelee(oSettings.weaponItemId))) {
            const randomResult = RollRandomLoadoutSlotAndWeapon(oSettings.team);
            oSettings.loadoutSlot = randomResult.loadoutSlot;
            oSettings.weaponItemId = randomResult.weaponItemId;
            GameInterfaceAPI.SetSettingString('ui_vanitysetting_loadoutslot_' + oSettings.team, oSettings.loadoutSlot);
        }
        oSettings.glovesItemId = LoadoutAPI.GetItemID(oSettings.team, 'clothing_hands');
        if (!oSettings.charItemId)
            oSettings.charItemId = LoadoutAPI.GetItemID(oSettings.team, 'customplayer');
        if (optionalState && optionalState === 'unowned') {
            const randomResult = RollRandomLoadoutSlotAndWeapon(oSettings.team);
            oSettings.loadoutSlot = randomResult.loadoutSlot;
            oSettings.weaponItemId = LoadoutAPI.GetDefaultItem(oSettings.team, oSettings.loadoutSlot);
            oSettings.glovesItemId = LoadoutAPI.GetDefaultItem(oSettings.team, 'clothing_hands');
        }
        return oSettings;
    }
    ItemInfo.GetOrUpdateVanityCharacterSettings = GetOrUpdateVanityCharacterSettings;
    function GetitemStickerList(id) {
        const count = InventoryAPI.GetItemStickerCount(id);
        const stickerList = [];
        for (let i = 0; i < count; i++) {
            const oStickerInfo = {
                image: InventoryAPI.GetItemStickerImageByIndex(id, i),
                name: InventoryAPI.GetItemStickerNameByIndex(id, i)
            };
            stickerList.push(oStickerInfo);
        }
        return stickerList;
    }
    ItemInfo.GetitemStickerList = GetitemStickerList;
    function GetitemKeychainList(id) {
        const count = InventoryAPI.GetItemKeychainCount(id);
        const keychainList = [];
        for (let i = 0; i < count; i++) {
            const jsdata = InventoryAPI.GetItemKeychainJsonByIndex(id, i);
            if (jsdata) {
                const o = JSON.parse(jsdata);
                if (o)
                    keychainList.push(o);
            }
        }
        return keychainList;
    }
    ItemInfo.GetitemKeychainList = GetitemKeychainList;
    function GetStoreOriginalPrice(id, count, rules) {
        return StoreAPI.GetStoreItemOriginalPrice(id, count, rules ? rules : '');
    }
    ItemInfo.GetStoreOriginalPrice = GetStoreOriginalPrice;
    function GetStoreSalePrice(id, count, rules) {
        return StoreAPI.GetStoreItemSalePrice(id, count, rules ? rules : '');
    }
    ItemInfo.GetStoreSalePrice = GetStoreSalePrice;
    function IsStatTrak(id) {
        return Number(InventoryAPI.GetRawDefinitionKey(id, "will_produce_stattrak")) === 1;
    }
    ItemInfo.IsStatTrak = IsStatTrak;
    function IsEquippalbleButNotAWeapon(id) {
        const subSlot = InventoryAPI.GetDefaultSlot(id);
        return (subSlot === "flair0" || subSlot === "musickit" || subSlot === "spray0" || subSlot === "customplayer" || subSlot === "pet");
    }
    ItemInfo.IsEquippalbleButNotAWeapon = IsEquippalbleButNotAWeapon;
    function IsEquippableThroughContextMenu(id) {
        const subSlot = InventoryAPI.GetDefaultSlot(id);
        return (subSlot === "flair0" || subSlot === "musickit" || subSlot === "spray0");
    }
    ItemInfo.IsEquippableThroughContextMenu = IsEquippableThroughContextMenu;
    function IsWeapon(id) {
        const itemSchemaDef = BuildItemSchemaDef(id);
        return (itemSchemaDef["craft_class"] === "weapon");
    }
    ItemInfo.IsWeapon = IsWeapon;
    function IsMelee(id) {
        return InventoryAPI.GetLoadoutCategory(id) === "melee";
    }
    ItemInfo.IsMelee = IsMelee;
    function IsCase(id) {
        return ItemInfo.ItemHasCapability(id, 'decodable') && InventoryAPI.GetAssociatedItemsCount(id) > 0;
    }
    ItemInfo.IsCase = IsCase;
    function IsCharacter(id) {
        return InventoryAPI.GetDefaultSlot(id) === "customplayer";
    }
    ItemInfo.IsCharacter = IsCharacter;
    function IsGloves(id) {
        return InventoryAPI.GetDefaultSlot(id) === "clothing_hands";
    }
    ItemInfo.IsGloves = IsGloves;
    function IsItemCt(id) {
        return InventoryAPI.GetItemTeam(id) === '#CSGO_Inventory_Team_CT';
    }
    ItemInfo.IsItemCt = IsItemCt;
    function IsItemT(id) {
        return InventoryAPI.GetItemTeam(id) === '#CSGO_Inventory_Team_T';
    }
    ItemInfo.IsItemT = IsItemT;
    function IsItemAnyTeam(id) {
        return InventoryAPI.GetItemTeam(id) === '#CSGO_Inventory_Team_Any';
    }
    ItemInfo.IsItemAnyTeam = IsItemAnyTeam;
    function ItemDefinitionNameSubstrMatch(id, defSubstr) {
        const itemDefName = InventoryAPI.GetItemDefinitionName(id);
        return (!!itemDefName && (itemDefName.indexOf(defSubstr) != -1));
    }
    ItemInfo.ItemDefinitionNameSubstrMatch = ItemDefinitionNameSubstrMatch;
    function ItemDefinitionNameStartsWith(id, defSubstr) {
        const itemDefName = InventoryAPI.GetItemDefinitionName(id);
        return (!!itemDefName && (itemDefName.startsWith(defSubstr)));
    }
    ItemInfo.ItemDefinitionNameStartsWith = ItemDefinitionNameStartsWith;
    function GetFauxReplacementItemID(id, purpose) {
        if (purpose === 'graffiti') {
            if (ItemDefinitionNameSubstrMatch(id, 'tournament_journal_')) {
                return GetFauxItemIdForGraffiti(parseInt(InventoryAPI.GetItemAttributeValue(id, 'sticker slot 0 id')));
            }
        }
        return id;
    }
    ItemInfo.GetFauxReplacementItemID = GetFauxReplacementItemID;
    function GetFauxItemIdForGraffiti(stickestickerid_graffiti) {
        return InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(1349, stickestickerid_graffiti);
    }
    ItemInfo.GetFauxItemIdForGraffiti = GetFauxItemIdForGraffiti;
    function GetItemIdForItemEquippedInSlot(team, slot) {
        return LoadoutAPI.GetItemID(team, slot);
    }
    ItemInfo.GetItemIdForItemEquippedInSlot = GetItemIdForItemEquippedInSlot;
    function GetGifter(id) {
        const xuid = InventoryAPI.GetItemGifterXuid(id);
        return xuid !== undefined ? xuid : '';
    }
    ItemInfo.GetGifter = GetGifter;
    function GetSet(id) {
        const setName = InventoryAPI.GetSet(id);
        return setName !== undefined ? setName : '';
    }
    ItemInfo.GetSet = GetSet;
    function GetModelPath(id, itemSchemaDef) {
        const isMusicKit = InventoryAPI.DoesItemMatchDefinitionByName(id, 'musickit');
        const issMusicKitDefault = InventoryAPI.DoesItemMatchDefinitionByName(id, 'musickit_default');
        const isSpray = itemSchemaDef.name === 'spraypaint';
        const isSprayPaint = itemSchemaDef.name === 'spray';
        const isFanTokenOrShieldItem = itemSchemaDef.name && itemSchemaDef.name.indexOf('tournament_journal_') != -1;
        const isPet = InventoryAPI.DoesItemMatchDefinitionByName(id, 'pet');
        if (isSpray || isSprayPaint || isFanTokenOrShieldItem)
            return 'vmt://spraypreview_' + id;
        else if (IsSticker(id) || IsPatch(id))
            return 'vmt://stickerpreview_' + id;
        else if (itemSchemaDef.hasOwnProperty("model_player") || isMusicKit || issMusicKitDefault || isPet || IsKeychain(id))
            return 'img://inventory_' + id;
    }
    function BuildItemSchemaDef(id) {
        const schemaString = InventoryAPI.BuildItemSchemaDefJSON(id);
        return JSON.parse(schemaString);
    }
    ItemInfo.BuildItemSchemaDef = BuildItemSchemaDef;
    function GetModelPlayer(id) {
        const itemSchemaDef = BuildItemSchemaDef(id);
        return itemSchemaDef["model_player"];
    }
    ItemInfo.GetModelPlayer = GetModelPlayer;
    function IsKeychain(itemId) {
        return InventoryAPI.DoesItemMatchDefinitionByName(itemId, 'keychain');
    }
    ItemInfo.IsKeychain = IsKeychain;
    function IsSticker(itemId) {
        return InventoryAPI.DoesItemMatchDefinitionByName(itemId, 'sticker');
    }
    ItemInfo.IsSticker = IsSticker;
    function IsDisplayItem(itemId) {
        return InventoryAPI.GetDefaultSlot(itemId) == 'flair0';
    }
    ItemInfo.IsDisplayItem = IsDisplayItem;
    function IsPatch(itemId) {
        return InventoryAPI.DoesItemMatchDefinitionByName(itemId, 'patch');
    }
    ItemInfo.IsPatch = IsPatch;
    function GetDefaultCheer(id) {
        const itemSchemaDef = BuildItemSchemaDef(id);
        if (itemSchemaDef["default_cheer"])
            return itemSchemaDef["default_cheer"];
        else
            return "";
    }
    ItemInfo.GetDefaultCheer = GetDefaultCheer;
    function GetDefaultDefeat(id) {
        const itemSchemaDef = BuildItemSchemaDef(id);
        if (itemSchemaDef["default_defeat"])
            return itemSchemaDef["default_defeat"];
        else
            return "";
    }
    ItemInfo.GetDefaultDefeat = GetDefaultDefeat;
    function GetModelPathFromJSONOrAPI(id) {
        if (id === '' || id === undefined || id === null) {
            return '';
        }
        let pedistalModel = '';
        const itemSchemaDef = BuildItemSchemaDef(id);
        if (InventoryAPI.GetDefaultSlot(id) === "flair0") {
            pedistalModel = itemSchemaDef.hasOwnProperty('attributes') ? itemSchemaDef.attributes["pedestal display model"] : '';
        }
        else if (ItemHasCapability(id, 'decodable')) {
            pedistalModel = itemSchemaDef.hasOwnProperty("model_player") ? itemSchemaDef.model_player : '';
        }
        return (pedistalModel === '') ? GetModelPath(id, itemSchemaDef) : pedistalModel;
    }
    ItemInfo.GetModelPathFromJSONOrAPI = GetModelPathFromJSONOrAPI;
    function GetMarketLinkForLootlistItem(id) {
        const appID = SteamOverlayAPI.GetAppID();
        const communityUrl = SteamOverlayAPI.GetSteamCommunityURL();
        const strName = InventoryAPI.GetItemName(id);
        return communityUrl + "/market/search?appid=" + appID + "&lock_appid=" + appID + "&q=" + strName;
    }
    ItemInfo.GetMarketLinkForLootlistItem = GetMarketLinkForLootlistItem;
    function FindAnyUserOwnedCharacterItemID() {
        InventoryAPI.SetInventorySortAndFilters('inv_sort_rarity', false, 'customplayer,not_base_item', '', '');
        const count = InventoryAPI.GetInventoryCount();
        return (count > 0) ? InventoryAPI.GetInventoryItemIDByIndex(0) : '';
    }
    ItemInfo.FindAnyUserOwnedCharacterItemID = FindAnyUserOwnedCharacterItemID;
    function IsFauxOrRentalOrPreviewTool(id) {
        if ((id && id.length == 19 && id.startsWith('922323129721890'))
            || InventoryAPI.IsFauxItemID(id)
            || InventoryAPI.IsRental(id))
            return true;
        else
            return false;
    }
    ItemInfo.IsFauxOrRentalOrPreviewTool = IsFauxOrRentalOrPreviewTool;
    function IsPreviewable(id) {
        return !!InventoryAPI.GetDefaultSlot(id) || IsSticker(id) || IsPatch(id) || IsSpraySealed(id) || IsKeychain(id);
    }
    ItemInfo.IsPreviewable = IsPreviewable;
    function IsNameTag(id) {
        return InventoryAPI.DoesItemMatchDefinitionByName(id, 'name tag');
    }
    ItemInfo.IsNameTag = IsNameTag;
    function IsRecipe(id) {
        return InventoryAPI.DoesItemMatchDefinitionByName(id, 'recipe');
    }
    ItemInfo.IsRecipe = IsRecipe;
    ItemInfo.NUM_BACKPACK_SLOTS = 1000;
})(ItemInfo || (ItemInfo = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXRlbWluZm8uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9jb21tb24vaXRlbWluZm8udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyxzQ0FBc0M7QUFDdEMsMENBQTBDO0FBb0IxQyxJQUFVLFFBQVEsQ0FxbEJqQjtBQXJsQkQsV0FBVSxRQUFRO0lBR2pCLFNBQWdCLGdCQUFnQixDQUFHLEVBQVU7UUFFNUMsTUFBTSxPQUFPLEdBQUcsWUFBWSxDQUFDLHVCQUF1QixDQUFFLEVBQUUsQ0FBRSxDQUFDO1FBQzNELE1BQU0sYUFBYSxHQUFHLFlBQVksQ0FBQyxxQkFBcUIsQ0FBRSxFQUFFLENBQUUsQ0FBQztRQUUvRCxJQUFLLFlBQVksQ0FBQyxhQUFhLENBQUUsRUFBRSxDQUFFLEVBQ3JDO1lBQ0MsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBRSxHQUFHLENBQUUsQ0FBQztZQUV4QyxJQUFJLGFBQWEsQ0FBQztZQUNsQixJQUFJLFlBQVksQ0FBQztZQUNqQixJQUFLLFFBQVEsSUFBSSxDQUFDLEVBQ2xCO2dCQUNDLGFBQWEsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFFLENBQUMsRUFBRSxRQUFRLENBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDeEQsWUFBWSxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUUsUUFBUSxHQUFHLENBQUMsQ0FBRSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUV4RCxPQUFPLElBQUksY0FBYyxDQUFFLCtCQUErQixFQUFFLEVBQUUsU0FBUyxFQUFFLGFBQWEsRUFBRSxhQUFhLEVBQUUsWUFBWSxFQUFFLGdCQUFnQixFQUFFLGFBQWEsRUFBRSxDQUFFLENBQUM7YUFDeko7O2dCQUVBLE9BQU8sSUFBSSxjQUFjLENBQUUsOEJBQThCLEVBQUUsRUFBRSxTQUFTLEVBQUMsT0FBTyxFQUFFLGdCQUFnQixF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