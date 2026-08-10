"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/iteminfo.ts" />
/// <reference path="rating_emblem.ts" />
var MockAdapter = (function () {
    const k_GetMatchEndWinDataJSO = "k_GetMatchEndWinDataJSO";
    const k_GetScoreDataJSO = "k_GetScoreDataJSO";
    const k_GetPlayerName = "k_GetPlayerName";
    const k_IsFakePlayer = "k_IsFakePlayer";
    const k_XpDataJSO = "k_XpDataJSO";
    const k_XpShopDataJSO = "k_XpShopDataJSO";
    const k_GetGameModeInternalName = "k_GetGameModeInternalName";
    const k_GetGameModeName = "k_GetGameModeName";
    const k_SkillgroupDataJSO = "k_SkillgroupDataJSO";
    const k_DropListJSO = "k_DropListJSO";
    const k_GetTimeDataJSO = "k_GetTimeDataJSO";
    const k_NextMatchVotingData = "k_NextMatchVotingData";
    const k_GetPlayerStatsJSO = "k_GetPlayerStatsJSO";
    const k_GetPlayerDataJSO = "k_GetPlayerDataJSO";
    const k_IsTournamentMatch = "k_IsTournamentMatch";
    const k_GetServerName = "k_GetServerName";
    const k_GetMapName = "k_GetMapName";
    const k_GetTournamentEventStage = "k_GetTournamentEventStage";
    const k_GetGameModeImagePath = "k_GetGameModeImagePath";
    const k_GetMapBSPName = "k_GetMapBSPName";
    const k_GetPlayerTeamName = "k_GetPlayerTeamName";
    const k_GetPlayerTeamNumber = "k_GetPlayerTeamNumber";
    const k_GetTeamNextRoundLossBonus = "k_GetTeamNextRoundLossBonus";
    const k_AreTeamsPlayingSwitchedSides = "k_AreTeamsPlayingSwitchedSides";
    const k_AreTeamsPlayingSwitchedSidesInRound = "k_AreTeamsPlayingSwitchedSidesInRound";
    const k_HasHalfTime = "k_HasHalfTime";
    const k_IsDemoOrHltv = "k_IsDemoOrHltv";
    const k_IsHLTVAutodirectorOn = "k_IsHLTVAutodirectorOn";
    const k_GetTeamLogoImagePath = "k_GetTeamLogoImagePath";
    const k_GetTeamLivingPlayerCount = "k_GetTeamLivingPlayerCount";
    const k_GetTeamTotalPlayerCount = "k_GetTeamTotalPlayerCount";
    const k_GetTeamClanName = "k_GetTeamClanName";
    const k_IsXuidValid = "k_IsXuidValid";
    const k_GetPlayerSlot = "k_GetPlayerSlot";
    const k_GetLocalPlayerXuid = "k_GetLocalPlayerXuid";
    const k_IsLocalPlayerHLTV = "k_IsLocalPlayerHLTV";
    const k_GetPlayerStatus = "k_GetPlayerStatus";
    const k_GetPlayerCommendsLeader = "k_GetPlayerCommendsLeader";
    const k_GetPlayerCommendsFriendly = "k_GetPlayerCommendsFriendly";
    const k_GetPlayerCommendsTeacher = "k_GetPlayerCommendsTeacher";
    const k_GetPlayerCompetitiveRanking = "k_GetPlayerCompetitiveRanking";
    const k_GetPlayerCompetitiveWins = "k_GetPlayerCompetitiveWins";
    const k_GetPlayerXpLevel = "k_GetPlayerXpLevel";
    const k_GetPlayerScore = "k_GetPlayerScore";
    const k_GetPlayerMVPs = "k_GetPlayerMVPs";
    const k_GetPlayerKills = "k_GetPlayerKills";
    const k_GetPlayerRoundKills = "k_GetPlayerRoundKills";
    const k_GetPlayerAssists = "k_GetPlayerAssists";
    const k_GetPlayerDeaths = "k_GetPlayerDeaths";
    const k_GetPlayerPing = "k_GetPlayerPing";
    const k_GetPlayerColor = "k_GetPlayerColor";
    const k_HasCommunicationAbuseMute = "k_HasCommunicationAbuseMute";
    const k_IsSelectedPlayerMuted = "IsSelectedPlayerMuted";
    const k_IsPlayerConnected = "k_IsPlayerConnected";
    const k_ArePlayersEnemies = "k_ArePlayersEnemies";
    const k_GetPlayerClanTag = "k_GetPlayerClanTag";
    const k_GetPlayerMoney = "k_GetPlayerMoney";
    const k_GetPlayerActiveWeaponItemId = "k_GetPlayerActiveWeaponItemId";
    const k_GetPlayerModel = "k_GetPlayerModel";
    const k_GetPlayerItemCT = "k_GetPlayerItemCT";
    const k_GetPlayerItemTerrorist = "k_GetPlayerItemTerrorist";
    const k_AccoladesJSO = "k_AccoladesJSO";
    const k_GetCharacterDefaultCheerByXuid = "k_GetCharacterDefaultCheerByXuid";
    const k_GetAllPlayersMatchDataJSO = "k_GetAllPlayersMatchDataJSO";
    const k_GetPlayerCharacterItemID = "k_GetPlayerCharacterItemID";
    const k_GetFauxItemIDFromDefAndPaintIndex = "k_GetFauxItemIDFromDefAndPaintIndex";
    const k_GetPlayerCompetitiveRankType = "k_GetPlayerCompetitiveRankType";
    const k_bSkillgroupDataReady = "k_bSkillgroupDataReady";
    const k_GetPipRankCount = "k_GetPipRankCount";
    const k_GetPlayerPremierRankStatsObject = "k_GetPlayerPremierRankStatsObject";
    const k_bXpDataReady = "k_bXpDataReady";
    const k_bXpShopDataReady = "k_bXpShopDataReady";
    var _m_mockData = _GetMockData();
    function _msg(msg) {
    }
    function _GetRootPanel() {
        let parent = $.GetContextPanel().GetParent();
        let newParent = parent.GetParent();
        while (newParent) {
            parent = newParent;
            newParent = parent.GetParent();
        }
        return parent;
    }
    function _SetMockData(dummydata) {
        let elRoot = _GetRootPanel();
        elRoot.Data().m_mockData = dummydata;
    }
    function _GetMockData() {
        let elRoot = _GetRootPanel();
        if (!elRoot.Data().hasOwnProperty('m_mockData'))
            return undefined;
        else
            return elRoot.Data().m_mockData;
    }
    function _GetMockTables() {
        let elRoot = _GetRootPanel();
        if (!elRoot.Data().hasOwnProperty('m_mockTables'))
            return undefined;
        else
            return elRoot.Data().m_mockTables;
    }
    function _AddTable(name, table) {
        let elRoot = _GetRootPanel();
        if (!elRoot.Data().hasOwnProperty('m_mockTables'))
            elRoot.Data().m_mockTables = {};
        elRoot.Data().m_mockTables[name] = table;
    }
    function FindMockTable(key) {
        const arrTablesInUse = _m_mockData.split(',');
        for (let group of arrTablesInUse) {
            let mockTables = _GetMockTables();
            if (mockTables && mockTables.hasOwnProperty(group) && mockTables[group].hasOwnProperty(key)) {
                return mockTables[group];
            }
        }
        return undefined;
    }
    function _APIAccessor(val, key, xuid = -1) {
        if (!_m_mockData) {
            return val;
        }
        const table = FindMockTable(key);
        if (!table) {
            return val;
        }
        let tableVal;
        if (xuid !== -1 && table[key].hasOwnProperty(xuid)) {
            tableVal = table[key][xuid];
        }
        else if (xuid !== -1 && !table[key].hasOwnProperty(xuid)) {
            tableVal = table[key][0];
        }
        else {
            tableVal = table[key];
        }
        if (tableVal && typeof tableVal === "function") {
            return tableVal(xuid);
        }
        else {
            return tableVal;
        }
    }
    const _getLoadoutWeapons = function (team) {
        const list = [];
        const slotStrings = LoadoutAPI.GetLoadoutSlotNames(false);
        const slots = JSON.parse(slotStrings);
        slots.forEach(slot => {
            const itemId = LoadoutAPI.GetItemID(team, slot);
            const bIsWeapon = ItemInfo.IsWeapon(itemId) || ItemInfo.IsMelee(itemId);
            if (bIsWeapon) {
                list.push(itemId);
            }
        });
        return list;
    };
    function _GetRandomWeaponFromLoadout() {
        const team = (_m_mockData.search('team_ct') !== -1) ? 'ct' : 't';
        const list = _getLoadoutWeapons(team);
        return list[_r(0, list.length)];
    }
    function _GetRandomPlayerStatsJSO(xuid) {
        const oPlayerStats = { "damage": 0, "kills": 0, "assists": 0, "deaths": 0, "adr": 0, "kdr": 0, "3k": 0, "4k": 0, "5k": 0, "headshotkills": 0, "hsp": 0, "worth": 0, "killreward": 0, "cashearned": 99, "livetime": 0, "objective": 0, "utilitydamage": 0, "enemiesflashed": 0 };
        Object.keys(oPlayerStats).forEach(stat => {
            oPlayerStats[stat] = _r();
        });
        return oPlayerStats;
    }
    function _r(min = 0, max = 100) {
        return Math.round(Math.random() * ((max - min) + min) + 0.5);
    }
    ;
    function _GetRandomXP() {
        const ret = {
            xp_earned: {
                "2": _r(0, 1000),
                "6": _r(0, 1000),
            },
            current_level: _r(0, 39),
            current_xp: _r(0, 4999),
        };
        return ret;
    }
    function _GetRandomSkillGroup() {
        const oldrank = _r(1, 18);
        const newrank = oldrank + _r(-1, 1);
        const ret = {
            "old_rank": oldrank,
            "new_rank": newrank,
            "num_wins": _r(10, 1000),
            "rank_change": newrank - oldrank,
            "rank_type": "Premier"
        };
        return ret;
    }
    function _GetRandomPlayerModel(team) {
        const PlayerModels = {
            "ct": [
                "agents/models/ctm_fbi/ctm_fbi.vmdl",
                "agents/models/ctm_fbi/ctm_fbi_varianta.vmdl",
                "agents/models/ctm_fbi/ctm_fbi_variantb.vmdl",
                "agents/models/ctm_fbi/ctm_fbi_variantc.vmdl",
                "agents/models/ctm_fbi/ctm_fbi_variantd.vmdl",
                "agents/models/ctm_fbi/ctm_fbi_variante.vmdl",
                "agents/models/ctm_fbi/ctm_fbi_varianth.vmdl",
                "agents/models/ctm_fbi/ctm_fbi_variantf.vmdl",
                "agents/models/ctm_fbi/ctm_fbi_variantg.vmdl",
                "agents/models/ctm_st6.vmdl",
                "agents/models/ctm_st6_varianta.vmdl",
                "agents/models/ctm_st6_variantb.vmdl",
                "agents/models/ctm_st6_variantc.vmdl",
                "agents/models/ctm_st6_variantd.vmdl",
                "agents/models/ctm_st6_varianti.vmdl",
                "agents/models/ctm_st6_variantm.vmdl",
                "agents/models/ctm_st6_variantg.vmdl",
                "agents/models/ctm_st6_variantk.vmdl",
                "agents/models/ctm_st6_variante.vmdl",
                "agents/models/ctm_gign/ctm_gign.vmdl",
                "agents/models/ctm_gign/ctm_gign_varianta.vmdl",
                "agents/models/ctm_gign/ctm_gign_variantb.vmdl",
                "agents/models/ctm_gign/ctm_gign_variantc.vmdl",
                "agents/models/ctm_gign/ctm_gign_variantd.vmdl",
                "agents/models/ctm_gsg9.vmdl",
                "agents/models/ctm_gsg9_varianta.vmdl",
                "agents/models/ctm_gsg9_variantb.vmdl",
                "agents/models/ctm_gsg9_variantc.vmdl",
                "agents/models/ctm_gsg9_variantd.vmdl",
                "agents/models/ctm_idf/ctm_idf.vmdl",
                "agents/models/ctm_idf/ctm_idf_variantb.vmdl",
                "agents/models/ctm_idf/ctm_idf_variantc.vmdl",
                "agents/models/ctm_idf/ctm_idf_variantd.vmdl",
                "agents/models/ctm_idf/ctm_idf_variante.vmdl",
                "agents/models/ctm_idf/ctm_idf_variantf.vmdl",
                "agents/models/ctm_sas/ctm_sas.vmdl",
                "agents/models/ctm_sas/ctm_sas_variantf.vmdl",
                "agents/models/ctm_swat/ctm_swat.vmdl",
                "agents/models/ctm_swat/ctm_swat_varianta.vmdl",
                "agents/models/ctm_swat/ctm_swat_variantb.vmdl",
                "agents/models/ctm_swat/ctm_swat_variantc.vmdl",
                "agents/models/ctm_swat/ctm_swat_variantd.vmdl",
                "agents/models/ctm_heavy/ctm_heavy.vmdl",
            ],
            "t": [
                "agents/models/tm_balkan/tm_balkan_variante.vmdl",
                "agents/models/tm_balkan/tm_balkan_varianta.vmdl",
                "agents/models/tm_balkan/tm_balkan_variantb.vmdl",
                "agents/models/tm_balkan/tm_balkan_variantc.vmdl",
                "agents/models/tm_balkan/tm_balkan_variantd.vmdl",
                "agents/models/tm_balkan/tm_balkan_variantf.vmdl",
                "agents/models/tm_balkan/tm_balkan_variantg.vmdl",
                "agents/models/tm_balkan/tm_balkan_varianth.vmdl",
                "agents/models/tm_balkan/tm_balkan_varianti.vmdl",
                "agents/models/tm_balkan/tm_balkan_variantj.vmdl",
                "agents/models/tm_leet/tm_leet_variante.vmdl",
                "agents/models/tm_leet/tm_leet_varianta.vmdl",
                "agents/models/tm_leet/tm_leet_variantb.vmdl",
                "agents/models/tm_leet/tm_leet_variantc.vmdl",
                "agents/models/tm_leet/tm_leet_variantd.vmdl",
                "agents/models/tm_leet/tm_leet_variantf.vmdl",
                "agents/models/tm_leet/tm_leet_varianth.vmdl",
                "agents/models/tm_leet/tm_leet_variantg.vmdl",
                "agents/models/tm_leet/tm_leet_varianti.vmdl",
                "agents/models/tm_anarchist/tm_anarchist.vmdl",
                "agents/models/tm_anarchist/tm_anarchist_varianta.vmdl",
                "agents/models/tm_anarchist/tm_anarchist_variantb.vmdl",
                "agents/models/tm_anarchist/tm_anarchist_variantc.vmdl",
                "agents/models/tm_anarchist/tm_anarchist_variantd.vmdl",
                "agents/models/tm_phoenix/tm_phoenix.vmdl",
                "agents/models/tm_phoenix/tm_phoenix_varianta.vmdl",
                "agents/models/tm_phoenix/tm_phoenix_variantb.vmdl",
                "agents/models/tm_phoenix/tm_phoenix_variantc.vmdl",
                "agents/models/tm_phoenix/tm_phoenix_variantd.vmdl",
                "agents/models/tm_pirate/tm_pirate.vmdl",
                "agents/models/tm_pirate/tm_pirate_varianta.vmdl",
                "agents/models/tm_pirate/tm_pirate_variantb.vmdl",
                "agents/models/tm_pirate/tm_pirate_variantc.vmdl",
                "agents/models/tm_pirate/tm_pirate_variantd.vmdl",
                "agents/models/tm_professional/tm_professional.vmdl",
                "agents/models/tm_professional_const1.vmdl",
                "agents/models/tm_professional_const2.vmdl",
                "agents/models/tm_professional_const3.vmdl",
                "agents/models/tm_professional_const4.vmdl",
                "agents/models/tm_separatist/tm_separatist.vmdl",
                "agents/models/tm_separatist/tm_separatist_varianta.vmdl",
                "agents/models/tm_separatist/tm_separatist_variantb.vmdl",
                "agents/models/tm_separatist/tm_separatist_variantc.vmdl",
                "agents/models/tm_separatist/tm_separatist_variantd.vmdl",
                "agents/models/tm_phoenix/tm_phoenix_variantg.vmdl",
                "agents/models/tm_phoenix/tm_phoenix_variante.vmdl",
                "agents/models/tm_phoenix/tm_phoenix_variantf.vmdl",
                "agents/models/tm_phoenix_heavy/tm_phoenix_heavy.vmdl",
            ]
        };
        return PlayerModels[team][Math.floor(Math.random() * PlayerModels[team].length)];
    }
    function _GetRandomAccolades() {
        function _GetRandomAccoladeTitle() {
            const titles = [
                "kills",
                "damage",
                "adr",
                "mvps",
                "assists",
                "hsp",
                "3k",
                "4k",
                "5k",
                "headshotkills",
                "killreward",
                "utilitydamage",
                "enemiesflashed",
                "objective",
                "worth",
                "score",
                "livetime",
                "deaths",
                "nopurchasewins",
                "clutchkills",
                "footsteps",
                "pistolkills",
                "firstkills",
                "sniperkills",
                "roundssurvived",
                "chickenskilled",
                "killswhileblind",
                "bombcarrierkills",
                "burndamage",
                "cashspent",
                "uniqueweaponkills",
                "gimme_01",
                "gimme_02",
                "gimme_03",
                "gimme_04",
                "gimme_05",
                "gimme_06",
            ];
            return titles[Math.floor(Math.random() * titles.length)];
        }
        function _GetRandomAccolade(xuid) {
            const name = _GetRandomAccoladeTitle();
            const pos = name.includes("gimme_") ? 1 : 1 + Math.floor(Math.random() * 2);
            const accolade = {
                accolade: name,
                value: Math.floor(Math.random() * 1000),
                xuid: xuid,
                position: pos
            };
            return accolade;
        }
        const oAccolades = {
            titles: [
                _GetRandomAccolade(1),
                _GetRandomAccolade(3),
                _GetRandomAccolade(5),
                _GetRandomAccolade(7),
                _GetRandomAccolade(9),
                _GetRandomAccolade(2),
                _GetRandomAccolade(4),
                _GetRandomAccolade(6),
                _GetRandomAccolade(8),
                _GetRandomAccolade(10),
                _GetRandomAccolade(11),
                _GetRandomAccolade(13),
                _GetRandomAccolade(15),
                _GetRandomAccolade(17),
                _GetRandomAccolade(19),
                _GetRandomAccolade(12),
                _GetRandomAccolade(14),
                _GetRandomAccolade(16),
                _GetRandomAccolade(18),
                _GetRandomAccolade(20),
            ]
        };
        return oAccolades;
    }
    function _InternalGetFauxItemId(defid, paintid) {
        return String(InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(defid, paintid));
    }
    function _GetRandomModelDefIndex(teamnum) {
        const models = [
            [],
            [],
            [
                4780,
                4777,
                4774,
            ],
            [
                4771,
                4757,
                4751
            ],
        ];
        const random = _r(0, 2);
        return (models[teamnum][random]);
    }
    let MOCK_TABLE = {};
    return {
        AddTable: _AddTable,
        GetMatchEndWinDataJSO: function _APIGetMatchEndWinDataJSO() { return _APIAccessor(GameStateAPI.GetMatchEndWinDataJSO(), k_GetMatchEndWinDataJSO); },
        GetScoreDataJSO: function _GetScoreDataJSO() { return _APIAccessor(GameStateAPI.GetScoreDataJSO(), k_GetScoreDataJSO); },
        GetPlayerName: function _GetPlayerName(xuid) { return _APIAccessor(GameStateAPI.GetPlayerName(xuid), k_GetPlayerName, xuid); },
        IsFakePlayer: function _IsFakePlayer(xuid) { return _APIAccessor(GameStateAPI.IsFakePlayer(xuid), k_IsFakePlayer); },
        XPDataJSO: function _XPDataJSO(panel) { return _APIAccessor(panel.XpDataJSO, k_XpDataJSO); },
        XPShopDataJSO: function _XPShopDataJSO(panel) { return _APIAccessor(panel.XpShopDataJSO, k_XpShopDataJSO); },
        GetGameModeInternalName: function _GetGameModeInternalName(bUseSkirmishName) { return _APIAccessor(GameStateAPI.GetGameModeInternalName(bUseSkirmishName), k_GetGameModeInternalName); },
        GetGameModeName: function _GetGameModeName(bUseSkirmishName) { return _APIAccessor(GameStateAPI.GetGameModeName(bUseSkirmishName), k_GetGameModeName); },
        SkillgroupDataJSO: function _SkillgroupDataJSO(panel) { return _APIAccessor(panel.SkillgroupDataJSO, k_SkillgroupDataJSO); },
        DropListJSO: function _DropListJSO(panel) { return _APIAccessor(panel.DropListJSO, k_DropListJSO); },
        GetTimeDataJSO: function _GetTimeDataJSO() { return _APIAccessor(GameStateAPI.GetTimeDataJSO(), k_GetTimeDataJSO); },
        NextMatchVotingData: function _NextMatchVotingData(panel) { return _APIAccessor(panel.NextMatchVotingData, k_NextMatchVotingData); },
        GetPlayerStatsJSO: function _GetPlayerStatsJSO(xuid) { return _APIAccessor(MatchStatsAPI.GetPlayerStatsJSO(xuid), k_GetPlayerStatsJSO, xuid); },
        GetPlayerDataJSO: function _GetPlayerDataJSO() { return _APIAccessor(GameStateAPI.GetPlayerDataJSO(), k_GetPlayerDataJSO); },
        IsTournamentMatch: function _IsTournamentMatch() { return _APIAccessor(MatchStatsAPI.IsTournamentMatch(), k_IsTournamentMatch); },
        GetServerName: function _GetServerName() { return _APIAccessor(GameStateAPI.GetServerName(), k_GetServerName); },
        GetMapName: function _GetMapName() { return _APIAccessor(GameStateAPI.GetMapName(), k_GetMapName); },
        GetTournamentEventStage: function _GetTournamentEventStage() { return _APIAccessor(GameStateAPI.GetTournamentEventStage(), k_GetTournamentEventStage); },
        GetGameModeImagePath: function _GetGameModeImagePath() {
            const path = GameStateAPI.GetGameModeImagePath();
            const modPath = _APIAccessor(path, k_GetGameModeImagePath);
            if (typeof modPath === 'string') {
                return modPath;
            }
            return path;
        },
        GetMapBSPName: function _GetMapBSPName() { return _APIAccessor(GameStateAPI.GetMapBSPName(), k_GetMapBSPName); },
        GetPlayerTeamName: function _GetPlayerTeamName(xuid) { return _APIAccessor(GameStateAPI.GetPlayerTeamName(xuid), k_GetPlayerTeamName, xuid); },
        GetPlayerTeamNumber: function _GetPlayerTeamNumber(xuid) { return _APIAccessor(GameStateAPI.GetPlayerTeamNumber(xuid), k_GetPlayerTeamNumber, xuid); },
        GetTeamNextRoundLossBonus: function _GetTeamNextRoundLossBonus(team) { return _APIAccessor(GameStateAPI.GetTeamNextRoundLossBonus(team), k_GetTeamNextRoundLossBonus); },
        AreTeamsPlayingSwitchedSides: function _AreTeamsPlayingSwitchedSides() { return _APIAccessor(GameStateAPI.AreTeamsPlayingSwitchedSides(), k_AreTeamsPlayingSwitchedSides); },
        AreTeamsPlayingSwitchedSidesInRound: function _AreTeamsPlayingSwitchedSidesInRound(rnd) { return _APIAccessor(GameStateAPI.AreTeamsPlayingSwitchedSidesInRound(rnd), k_AreTeamsPlayingSwitchedSidesInRound); },
        HasHalfTime: function _HasHalfTime() { return _APIAccessor(GameStateAPI.HasHalfTime(), k_HasHalfTime); },
        IsDemoOrHltv: function _IsDemoOrHltv() { return _APIAccessor(GameStateAPI.IsDemoOrHltv(), k_IsDemoOrHltv); },
        IsHLTVAutodirectorOn: function _IsHLTVAutodirectorOn() { return _APIAccessor(GameStateAPI.IsHLTVAutodirectorOn(), k_IsHLTVAutodirectorOn); },
        GetTeamLogoImagePath: function _GetTeamLogoImagePath(team) { return _APIAccessor(GameStateAPI.GetTeamLogoImagePath(team), k_GetTeamLogoImagePath); },
        GetTeamLivingPlayerCount: function _GetTeamLivingPlayerCount(team) { return _APIAccessor(GameStateAPI.GetTeamLivingPlayerCount(team), k_GetTeamLivingPlayerCount); },
        GetTeamTotalPlayerCount: function _GetTeamTotalPlayerCount(team) { return _APIAccessor(GameStateAPI.GetTeamTotalPlayerCount(team), k_GetTeamTotalPlayerCount); },
        GetTeamClanName: function _GetTeamClanName(team) { return _APIAccessor(GameStateAPI.GetTeamClanName(team), k_GetTeamClanName, team); },
        IsXuidValid: function _IsXuidValid(xuid) { return _APIAccessor(GameStateAPI.IsXuidValid(xuid), k_IsXuidValid); },
        GetPlayerSlot: function _GetPlayerSlot(xuid) { return _APIAccessor(GameStateAPI.GetPlayerSlot(xuid), k_GetPlayerSlot, xuid); },
        GetLocalPlayerXuid: function _GetLocalPlayerXuid() { return _APIAccessor(GameStateAPI.GetLocalPlayerXuid(), k_GetLocalPlayerXuid); },
        IsLocalPlayerHLTV: function _IsLocalPlayerHLTV() { return _APIAccessor(GameStateAPI.IsLocalPlayerHLTV(), k_IsLocalPlayerHLTV); },
        GetPlayerStatus: function _GetPlayerStatus(xuid) { return _APIAccessor(GameStateAPI.GetPlayerStatus(xuid), k_GetPlayerStatus); },
        GetPlayerCommendsLeader: function _GetPlayerCommendsLeader(xuid) { return _APIAccessor(GameStateAPI.GetPlayerCommendsLeader(xuid), k_GetPlayerCommendsLeader); },
        GetPlayerCommendsFriendly: function _GetPlayerCommendsFriendly(xuid) { return _APIAccessor(GameStateAPI.GetPlayerCommendsFriendly(xuid), k_GetPlayerCommendsFriendly); },
        GetPlayerCommendsTeacher: function _GetPlayerCommendsTeacher(xuid) { return _APIAccessor(GameStateAPI.GetPlayerCommendsTeacher(xuid), k_GetPlayerCommendsTeacher); },
        GetPlayerCompetitiveRanking: function _GetPlayerCompetitiveRanking(xuid) { return _APIAccessor(GameStateAPI.GetPlayerCompetitiveRanking(xuid), k_GetPlayerCompetitiveRanking); },
        GetPlayerCompetitiveWins: function _GetPlayerCompetitiveWins(xuid) { return _APIAccessor(GameStateAPI.GetPlayerCompetitiveWins(xuid), k_GetPlayerCompetitiveWins); },
        GetPlayerXpLevel: function _GetPlayerXpLevel(xuid) { return _APIAccessor(GameStateAPI.GetPlayerXpLevel(xuid), k_GetPlayerXpLevel, xuid); },
        GetPlayerScore: function _GetPlayerScore(xuid) { return _APIAccessor(GameStateAPI.GetPlayerScore(xuid), k_GetPlayerScore, xuid); },
        GetPlayerMVPs: function _GetPlayerMVPs(xuid) { return _APIAccessor(GameStateAPI.GetPlayerMVPs(xuid), k_GetPlayerMVPs, xuid); },
        GetPlayerKills: function _GetPlayerKills(xuid) { return _APIAccessor(GameStateAPI.GetPlayerKills(xuid), k_GetPlayerKills, xuid); },
        GetPlayerRoundKills: function GetPlayerRoundKills(xuid) { return _APIAccessor(GameStateAPI.GetPlayerRoundKills(xuid), k_GetPlayerRoundKills, xuid); },
        GetPlayerAssists: function _GetPlayerAssists(xuid) { return _APIAccessor(GameStateAPI.GetPlayerAssists(xuid), k_GetPlayerAssists, xuid); },
        GetPlayerDeaths: function _GetPlayerDeaths(xuid) { return _APIAccessor(GameStateAPI.GetPlayerDeaths(xuid), k_GetPlayerDeaths, xuid); },
        GetPlayerPing: function _GetPlayerPing(xuid) { return _APIAccessor(GameStateAPI.GetPlayerPing(xuid), k_GetPlayerPing, xuid); },
        GetPlayerColor: function _GetPlayerColor(xuid) { return _APIAccessor(GameStateAPI.GetPlayerColor(xuid), k_GetPlayerColor, xuid); },
        HasCommunicationAbuseMute: function _HasCommunicationAbuseMute(xuid) { return _APIAccessor(GameStateAPI.HasCommunicationAbuseMute(xuid), k_HasCommunicationAbuseMute); },
        IsSelectedPlayerMuted: function _IsSelectedPlayerMuted(xuid) { return _APIAccessor(GameStateAPI.IsSelectedPlayerMuted(xuid), k_IsSelectedPlayerMuted); },
        IsPlayerConnected: function _IsPlayerConnected(xuid) { return _APIAccessor(GameStateAPI.IsPlayerConnected(xuid), k_IsPlayerConnected); },
        ArePlayersEnemies: function _ArePlayersEnemies(xuid1, xuid2) { return _APIAccessor(GameStateAPI.ArePlayersEnemies(xuid1, xuid2), k_ArePlayersEnemies); },
        GetPlayerClanTag: function _GetPlayerClanTag(xuid) { return _APIAccessor(GameStateAPI.GetPlayerClanTag(xuid), k_GetPlayerClanTag); },
        GetPlayerMoney: function _GetPlayerMoney(xuid) { return _APIAccessor(GameStateAPI.GetPlayerMoney(xuid), k_GetPlayerMoney); },
        GetPlayerActiveWeaponItemId: function _GetPlayerActiveWeaponItemId(xuid) { return _APIAccessor(GameStateAPI.GetPlayerActiveWeaponItemId(xuid), k_GetPlayerActiveWeaponItemId, xuid); },
        GetPlayerModel: function _GetPlayerModel(xuid) { return _APIAccessor(GameStateAPI.GetPlayerModel(xuid), k_GetPlayerModel, xuid); },
        GetPlayerItemCT: function _GetPlayerItemCT(panel) { return _APIAccessor(panel.GetPlayerItemCT(), k_GetPlayerItemCT); },
        GetPlayerItemTerrorist: function _GetPlayerItemTerrorist(panel) { return _APIAccessor(panel.GetPlayerItemTerrorist(), k_GetPlayerItemTerrorist); },
        GetCharacterDefaultCheerByXuid: function _GetCharacterDefaultCheerByXuid(xuid) { return _APIAccessor(GameStateAPI.GetCharacterDefaultCheerByXuid(xuid), k_GetCharacterDefaultCheerByXuid, xuid); },
        GetCharacterDefaultDefeatByXuid: function _GetCharacterDefaultDefeatByXuid(xuid) { return _APIAccessor(GameStateAPI.GetCharacterDefaultDefeatByXuid(xuid), k_GetCharacterDefaultCheerByXuid, xuid); },
        GetAllPlayersMatchDataJSO: function _GetAllPlayersMatchDataJSO() { return _APIAccessor(GameStateAPI.GetAllPlayersMatchDataJSO(), k_GetAllPlayersMatchDataJSO); },
        GetPlayerCharacterItemID: function _GetPlayerCharacterItemID(xuid) { return _APIAccessor(GameStateAPI.GetPlayerCharacterItemID(xuid), k_GetPlayerCharacterItemID); },
        GetFauxItemIDFromDefAndPaintIndex: function _GetFauxItemIDFromDefAndPaintIndex(defindex, paintid) { return _APIAccessor(InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(defindex, paintid), k_GetFauxItemIDFromDefAndPaintIndex); },
        GetPlayerCompetitiveRankType: function _GetPlayerCompetitiveRankType(xuid) { return _APIAccessor(GameStateAPI.GetPlayerCompetitiveRankType(xuid), k_GetPlayerCompetitiveRankType, xuid); },
        bSkillgroupDataReady: function _bSkillgroupDataReady(panel) { return _APIAccessor(panel.bSkillgroupDataReady, k_bSkillgroupDataReady); },
        bXpDataReady: function _bXpDataReady(panel) { return _APIAccessor(panel.bXpDataReady, k_bXpDataReady); },
        bXpShopDataReady: function _bXpShopDataReady(panel) { return _APIAccessor(panel.bXpShopDataReady, k_bXpShopDataReady); },
        GetPipRankCount: function _GetPipRankCount(type) { return _APIAccessor(MyPersonaAPI.GetPipRankCount(type), k_GetPipRankCount); },
        GetPlayerPremierRankStatsObject: function (xuid) { return _APIAccessor(GameStateAPI.GetPlayerPremierRankStatsObject(xuid), k_GetPlayerPremierRankStatsObject, xuid); },
        SetMockData: _SetMockData,
        GetMockData: _GetMockData,
    };
})();
(function () {
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9ja19hZGFwdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvbW9ja19hZGFwdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFDbEMsMkNBQTJDO0FBQzNDLHlDQUF5QztBQUl6QyxJQUFJLFdBQVcsR0FBRyxDQUFFO0lBR25CLE1BQU0sdUJBQXVCLEdBQUcseUJBQXlCLENBQUM7SUFDMUQsTUFBTSxpQkFBaUIsR0FBRyxtQkFBbUIsQ0FBQztJQUM5QyxNQUFNLGVBQWUsR0FBRyxpQkFBaUIsQ0FBQztJQUMxQyxNQUFNLGNBQWMsR0FBRyxnQkFBZ0IsQ0FBQztJQUN4QyxNQUFNLFdBQVcsR0FBRyxhQUFhLENBQUM7SUFDbEMsTUFBTSxlQUFlLEdBQUcsaUJBQWlCLENBQUM7SUFDMUMsTUFBTSx5QkFBeUIsR0FBRywyQkFBMkIsQ0FBQztJQUM5RCxNQUFNLGlCQUFpQixHQUFHLG1CQUFtQixDQUFDO0lBQzlDLE1BQU0sbUJBQW1CLEdBQUcscUJBQXFCLENBQUM7SUFDbEQsTUFBTSxhQUFhLEdBQUcsZUFBZSxDQUFDO0lBQ3RDLE1BQU0sZ0JBQWdCLEdBQUcsa0JBQWtCLENBQUM7SUFDNUMsTUFBTSxxQkFBcUIsR0FBRyx1QkFBdUIsQ0FBQztJQUN0RCxNQUFNLG1CQUFtQixHQUFHLHFCQUFxQixDQUFDO0lBQ2xELE1BQU0sa0JBQWtCLEdBQUcsb0JBQW9CLENBQUM7SUFDaEQsTUFBTSxtQkFBbUIsR0FBRyxxQkFBcUIsQ0FBQztJQUNsRCxNQUFNLGVBQWUsR0FBRyxpQkFBaUIsQ0FBQztJQUMxQyxNQUFNLFlBQVksR0FBRyxjQUFjLENBQUM7SUFDcEMsTUFBTSx5QkFBeUIsR0FBRywyQkFBMkIsQ0FBQztJQUM5RCxNQUFNLHNCQUFzQixHQUFHLHdCQUF3QixDQUFDO0lBQ3hELE1BQU0sZUFBZSxHQUFHLGlCQUFpQixDQUFDO0lBQzFDLE1B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