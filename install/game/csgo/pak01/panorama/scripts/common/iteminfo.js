"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="formattext.ts" />
/// <reference path="characteranims.ts" />
var ItemInfo;
(function (ItemInfo) {
    // Requires common/formattext.ts
    function GetFormattedName(id) {
        const strName = InventoryAPI.GetItemNameUncustomized(id);
        const strCustomName = InventoryAPI.GetItemNameCustomized(id);
        if (InventoryAPI.HasCustomName(id)) {
            const splitLoc = strName.indexOf('|');
            let strWeaponName;
            let strPaintName;
            if (splitLoc >= 0) {
                strWeaponName = strName.substring(0, splitLoc).trim(); // Eat extra whitespace before "|"
                strPaintName = strName.substring(splitLoc + 1).trim(); // Eat extra whitespace after "|"
                return new CFormattedText('#CSGO_ItemName_Custom_Painted', { item_name: strWeaponName, paintkit_name: strPaintName, custom_item_name: strCustomName });
            }
            else
                return new CFormattedText('#CSGO_ItemName_Custom_Simple', { item_name: strName, custom_item_name: strCustomName });
        }
        else {
            // Check for painted weapon name e.g. "M4A4 | Howl" and split into weapon and paintkit name
            const splitLoc = strName.indexOf('|');
            if (splitLoc >= 0) {
                const strWeaponName = strName.substring(0, splitLoc).trim(); // Eat extra whitespace before "|"
                const strPaintName = strName.substring(splitLoc + 1).trim(); // Eat extra whitespace after "|"
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
            // User owns keys for this case and use the oldist one
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
        const modelRenderSettingsOneOffTempCopy = // or google for JS deep copy to ensure that array is not referenced
         JSON.parse(JSON.stringify(inVanityCharacterSettings));
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
            petItemId: undefined,
            cameraPreset: undefined
        };
        //
        // See if we have been passed a character item
        //
        if (optionalCharacterItemId && InventoryAPI.IsValidItemID(optionalCharacterItemId)) {
            const charTeam = InventoryAPI.GetItemTeam(optionalCharacterItemId);
            if (charTeam.search('Team_CT') !== -1)
                oSettings.team = 'ct';
            else if (charTeam.search('Team_T') !== -1)
                oSettings.team = 't';
            if (oSettings.team)
                oSettings.charItemId = optionalCharacterItemId;
        }
        //
        // Read team or randomize between CT and T
        // optional team parameter can be passed to process a specific team
        //
        if (!oSettings.team) {
            oSettings.team = GameInterfaceAPI.GetSettingString('ui_vanitysetting_team');
            if (oSettings.team !== 'ct' && oSettings.team !== 't') {
                oSettings.team = (Math.round(Math.random()) > 0) ? 'ct' : 't';
                $.Msg("  Vanity random team: " + oSettings.team);
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
                // remove MGs from the random weapon list because they squat
                slots.splice(slots.indexOf('heavy3'), 1);
                slots.splice(slots.indexOf('heavy4'), 1);
                const nRandomSlotIndex = Math.floor(Math.random() * slots.length);
                myResult.loadoutSlot = slots.splice(nRandomSlotIndex, 1)[0]; // remove the random slot and use it
                myResult.weaponItemId = LoadoutAPI.GetItemID(strTeam, myResult.loadoutSlot);
                if (ItemInfo.IsWeapon(myResult.weaponItemId) || ItemInfo.IsMelee(myResult.weaponItemId))
                    break; // break out of slots scanning once we found a valid weapon to use
            }
            return myResult;
        }
        ;
        //
        // Read the loadout slot that is supposed to be used
        //
        oSettings.loadoutSlot = GameInterfaceAPI.GetSettingString('ui_vanitysetting_loadoutslot_' + oSettings.team);
        // Validate the setting slot
        if (!JSON.parse(LoadoutAPI.GetLoadoutSlotNames(false)).includes(oSettings.loadoutSlot))
            oSettings.loadoutSlot = '';
        oSettings.weaponItemId = LoadoutAPI.GetItemID(oSettings.team, oSettings.loadoutSlot);
        if (!(ItemInfo.IsWeapon(oSettings.weaponItemId) || ItemInfo.IsMelee(oSettings.weaponItemId))) { // most likely the slot itself is invalid for this team since there's no possible weapon there
            // re-roll a valid slot and weapon now
            const randomResult = RollRandomLoadoutSlotAndWeapon(oSettings.team);
            oSettings.loadoutSlot = randomResult.loadoutSlot;
            oSettings.weaponItemId = randomResult.weaponItemId;
            // since we had to re-roll the slot or itemid make sure we write the picked slot into our config
            $.Msg("  Vanity random slot: " + oSettings.loadoutSlot);
            GameInterfaceAPI.SetSettingString('ui_vanitysetting_loadoutslot_' + oSettings.team, oSettings.loadoutSlot);
        }
        //
        // Read the gloves
        //
        oSettings.glovesItemId = LoadoutAPI.GetItemID(oSettings.team, 'clothing_hands');
        //
        // Read the pet
        //
        oSettings.petItemId = InventoryAPI.GetPetItemID(); // LoadoutAPI.GetItemID( 'noteam', 'pet' ); // << EGG IS NOT AUTO-EQUIPPED, so read any pet
        //
        // Read the character from loadout slot if not explicitly requested
        //
        if (!oSettings.charItemId)
            oSettings.charItemId = LoadoutAPI.GetItemID(oSettings.team, 'customplayer');
        //
        // If the caller wants the character in 'unowned' state
        // then we will not use our own gloves and our own weapon
        // but rather will use some default ones
        //
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
        // rules is a new optional parameter that is passed as a string to C++
        // '' (empty string) means to return price formatted in user wallet currency
        // '#' means to return raw integer number of cents/yens/etc. for relative comparisons in Javascript
        return StoreAPI.GetStoreItemOriginalPrice(id, count, rules ? rules : '');
    }
    ItemInfo.GetStoreOriginalPrice = GetStoreOriginalPrice;
    function GetStoreSalePrice(id, count, rules) {
        // rules is a new optional parameter that is passed as a string to C++
        // '' (empty string) means to return price formatted in user wallet currency
        // '#' means to return raw integer number of cents/yens/etc. for relative comparisons in Javascript
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
        // In the case of Tournament Access Coin it can also act as a graffiti, so we may
        // use a different ID for display that is a synthetic faux item representing the
        // corresponding graffiti object
        if (purpose === 'graffiti') {
            if (ItemDefinitionNameSubstrMatch(id, 'tournament_journal_')) {
                return GetFauxItemIdForGraffiti(parseInt(InventoryAPI.GetItemAttributeValue(id, 'sticker slot 0 id')));
            }
        }
        return id;
    }
    ItemInfo.GetFauxReplacementItemID = GetFauxReplacementItemID;
    function GetFauxItemIdForGraffiti(stickestickerid_graffiti) {
        // In the case of Tournament Access Coin it can also act as a graffiti, so we may
        // use a different ID for display that is a synthetic faux item representing the
        // corresponding graffiti object
        return InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(// 'spraypaint'
        1349, stickestickerid_graffiti);
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
        // if you are one of the items types that has a model then return it
        // "model_player" is used to defing modesl for weapons.
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
    // returns the path to the mdl specified in the "model_player" keyvalue.
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
    function IsPet(itemId) {
        return InventoryAPI.DoesItemMatchDefinitionByName(itemId, 'pet') ||
            InventoryAPI.DoesItemMatchDefinitionByName(itemId, 'chicken_egg') ||
            InventoryAPI.DoesItemMatchDefinitionByName(itemId, 'chicken_feed');
    }
    ItemInfo.IsPet = IsPet;
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
        // 0 may be valid so let that go
        if (id === '' || id === undefined || id === null) {
            return '';
        }
        let pedistalModel = '';
        const itemSchemaDef = BuildItemSchemaDef(id);
        if (InventoryAPI.GetDefaultSlot(id) === "flair0") {
            pedistalModel = itemSchemaDef.hasOwnProperty('attributes') ? itemSchemaDef.attributes["pedestal display model"] : '';
        }
        else if (ItemHasCapability(id, 'decodable')) {
            // This is a case that has a model
            pedistalModel = itemSchemaDef.hasOwnProperty("model_player") ? itemSchemaDef.model_player : '';
            $.Msg('decodable pedistalModel ' + pedistalModel);
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
        // Preview of a sticker/patch/keychain can be activated from a tool,
        // or from a faux item in the store, or from a rental sticker preview,
        // primarily we are trying to unrestrict items eligible for preview
        // with a given faux tool and to show a custom warning that "this is merely a preview"
        // the  9223231297218904062
        // and  9223231297218904063 < Market inspects
        // from 9223231297218904064 < dynamic items
        // to   9223231297218905064
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXRlbWluZm8uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9jb21tb24vaXRlbWluZm8udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyxzQ0FBc0M7QUFDdEMsMENBQTBDO0FBa0IxQyxJQUFVLFFBQVEsQ0FnbEJqQjtBQWhsQkQsV0FBVSxRQUFRO0lBRWpCLGdDQUFnQztJQUNoQyxTQUFnQixnQkFBZ0IsQ0FBRyxFQUFVO1FBRTVDLE1BQU0sT0FBTyxHQUFHLFlBQVksQ0FBQyx1QkFBdUIsQ0FBRSxFQUFFLENBQUUsQ0FBQztRQUMzRCxNQUFNLGFBQWEsR0FBRyxZQUFZLENBQUMscUJBQXFCLENBQUUsRUFBRSxDQUFFLENBQUM7UUFFL0QsSUFBSyxZQUFZLENBQUMsYUFBYSxDQUFFLEVBQUUsQ0FBRSxFQUNyQztZQUNDLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUUsR0FBRyxDQUFFLENBQUM7WUFFeEMsSUFBSSxhQUFhLENBQUM7WUFDbEIsSUFBSSxZQUFZLENBQUM7WUFDakIsSUFBSyxRQUFRLElBQUksQ0FBQyxFQUNsQjtnQkFDQyxhQUFhLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBRSxDQUFDLEVBQUUsUUFBUSxDQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBUSxrQ0FBa0M7Z0JBQ2xHLFlBQVksR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFFLFFBQVEsR0FBRyxDQUFDLENBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFLLGlDQUFpQztnQkFFOUYsT0FBTyxJQUFJLGNBQWMsQ0FBRSwrQkFBK0IsRUFBRSxFQUFFLFNBQVMsRUFBRSxhQUFhLEVBQUUsYUFBYSxFQUFFLFlBQVksRUFBRSxnQkFBZ0IsRUFBRSxhQUFhLEVBQUUsQ0FBRSxDQUFDO2FBQ3pKOztnQkFFQSxPQUFPLElBQUksY0FBYyxDQUFFLDhCQUE4QixF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