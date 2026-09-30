"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="mock_adapter.ts" />
/// <reference path="common/gamerules_constants.ts" />
/// <reference path="common/formattext.ts" />
/// <reference path="rating_emblem.ts" />
/// <reference path="match_stakes.ts" />
/// <reference path="context_menus/context_menu_playercard.ts" />
/*
globals

$
MockAdapter
GameStateAPI
InventoryAPI
GameInterfaceAPI
dictPlayerStatusImage
UiToolkitAPI
MatchStatsAPI
GameTypesAPI
MissionsAPI
dictRoundResultImage
StoreAPI
LeaderboardsAPI
MyPersonaAPI
*/
var Scoreboard;
(function (Scoreboard) {
    const _m_cP = $.GetContextPanel();
    class PanelCache_t {
        // Scoreboard children
        m_elTimelineRoundLabel = null;
        m_elTimelineScoreOt = null;
        m_elMusicKitUnborrow = null;
        m_elMetaLabelsModeMap = null;
        // Scoreboard layout children
        m_elPlayersTableAny = null;
        m_elMouseBinding = null;
        m_elFooterWebsite = null;
        m_elTimelineSegments = null;
        m_elRoundLossBonus = null;
        m_elMuteImage = null;
        m_elBlockUgcImage = null;
        // context children
        m_elRounds = [];
        m_metaModeImage = null;
        m_metaLabelsMap = null;
        m_coopStats = null;
        m_elMusicKit = null;
        m_namedPanels = {};
        ClearAll() {
            this.m_elTimelineRoundLabel = null;
            this.m_elTimelineScoreOt = null;
            this.m_elMusicKitUnborrow = null;
            this.m_elMetaLabelsModeMap = null;
            this.m_elPlayersTableAny = null;
            this.m_elMouseBinding = null;
            this.m_elFooterWebsite = null;
            this.m_elTimelineSegments = null;
            this.m_elRoundLossBonus = null;
            this.m_elMuteImage = null;
            this.m_elBlockUgcImage = null;
            this.m_elRounds = [];
            this.m_metaModeImage = null;
            this.m_metaLabelsMap = null;
            this.m_coopStats = null;
            this.m_elMusicKit = null;
            this.m_namedPanels = {};
        }
        CacheScoreboard(scoreBoard) {
            this.ClearAll();
            if (scoreBoard && scoreBoard.IsValid()) {
                this.m_elTimelineRoundLabel = this.GetAndCacheChildPanel(scoreBoard, 'id-sb-timeline__round-label');
                this.m_elTimelineScoreOt = this.GetAndCacheChildPanel(scoreBoard, 'id-sb-timeline__score_ot');
                this.m_elMusicKitUnborrow = this.GetAndCacheChildPanel(scoreBoard, 'id-sb-meta__musickit-unborrow');
                this.m_elMetaLabelsModeMap = this.GetAndCacheChildPanel(scoreBoard, 'id-sb-meta__labels__mode-map');
                this.m_elPlayersTableAny = this.GetAndCacheLayoutPanel(scoreBoard, 'players-table-ANY');
                this.m_elMouseBinding = this.GetAndCacheLayoutPanel(scoreBoard, 'id-sb-mouse-instructions');
                this.m_elFooterWebsite = this.GetAndCacheLayoutPanel(scoreBoard, 'id-sb-footer-server-website');
                this.m_elTimelineSegments = this.GetAndCacheLayoutPanel(scoreBoard, 'id-sb-timeline__segments');
                this.m_elRoundLossBonus = this.GetAndCacheLayoutPanel(scoreBoard, 'id-sb-timeline__round-loss-bonus-money');
                this.m_elMuteImage = this.GetAndCacheLayoutPanel(scoreBoard, 'id-sb-meta__mutevoice__image');
                this.m_elBlockUgcImage = this.GetAndCacheLayoutPanel(scoreBoard, 'id-sb-meta__blockugc__image');
                this.m_elRounds = [];
                this.m_metaModeImage = this.GetAndCacheContextPanel('#id-sb-meta__mode__image');
                this.m_metaLabelsMap = this.GetAndCacheContextPanel('#sb-meta__labels__map');
                this.m_coopStats = this.GetAndCacheContextPanel('#CoopStats');
                this.m_elMusicKit = this.GetAndCacheContextPanel('#id-sb-meta__musickit');
            }
        }
        GetPanel(name) {
            let result = null;
            if (name in this.m_namedPanels) {
                result = this.m_namedPanels[name];
            }
            return result;
        }
        static GetChildPanelOrNull(scoreBoard, name) {
            let elPanel = null;
            if (name) {
                let elFound = scoreBoard.FindChildTraverse(name);
                elPanel = ((elFound && elFound.IsValid()) ? elFound : null);
            }
            return elPanel;
        }
        static GetLayoutPanelOrNull(scoreBoard, name) {
            let elPanel = null;
            if (name) {
                let elFound = scoreBoard.FindChildInLayoutFile(name);
                elPanel = ((elFound && elFound.IsValid()) ? elFound : null);
            }
            return elPanel;
        }
        static GetContextPanelOrNull(name) {
            let elPanel = null;
            if (name) {
                let elFound = $(name);
                elPanel = ((elFound && elFound.IsValid()) ? elFound : null);
            }
            return elPanel;
        }
        GetAndCacheChildPanel(scoreBoard, name) {
            let elPanel = PanelCache_t.GetChildPanelOrNull(scoreBoard, name);
            if (name) {
                this.m_namedPanels[name] = elPanel;
            }
            return elPanel;
        }
        GetAndCacheLayoutPanel(scoreBoard, name) {
            let elPanel = PanelCache_t.GetLayoutPanelOrNull(scoreBoard, name);
            if (name) {
                this.m_namedPanels[name] = elPanel;
            }
            return elPanel;
        }
        GetAndCacheContextPanel(name) {
            let elPanel = PanelCache_t.GetContextPanelOrNull(name);
            if (name) {
                this.m_namedPanels[name] = elPanel;
            }
            return elPanel;
        }
    }
    let _m_panelCache = new PanelCache_t();
    let _m_LocalPlayerID = ''; // xuid of local player for highlighting
    function GetLocalPlayerId() {
        if (_m_LocalPlayerID === '')
            _m_LocalPlayerID = GameStateAPI.GetLocalPlayerXuid();
        return _m_LocalPlayerID;
    }
    const _commendNames = ['leader', 'teacher', 'friendly'];
    // NOTE: 'teamname' can influence the value of some other stats, make sure this is the *first* stat!
    const _statNames = ['teamname', 'dc', 'score', 'risc', 'mvps', 'kills', 'assists', 'deaths', 'rank', 'idx', 'damage', 'avgrisc', 'money', 'hsp', 'kdr', 'adr', 'utilitydamage', 'enemiesflashed', 'musickit', 'skillgroup', 'ping', '3k', '4k', '5k', 'status', 'name', 'flair', 'avatar', 'gglevel', 'knifekills', 'taserkills', 'honoricon', ..._commendNames];
    // object to keep track of team data
    //
    class Team_t {
        static GetOrCreateTeam(scoreBoard, teamName) {
            if (!_m_oTeams[teamName]) {
                _m_oTeams[teamName] = new Team_t(teamName, scoreBoard);
            }
            return _m_oTeams[teamName];
        }
        static GetTeam(teamName) {
            return _m_oTeams[teamName];
        }
        m_CommendLeaderboards = {
            'leader': [],
            'teacher': [],
            'friendly': [],
        };
        m_teamName;
        m_teamLogoImagePath;
        // cached panels
        m_elPlayersTable;
        m_elLogoChildren;
        constructor(teamName, scoreBoard) {
            this.m_teamName = teamName;
            this.m_teamLogoImagePath = '';
            let elPlayersTable = scoreBoard.FindChildInLayoutFile('players-table-' + teamName);
            this.m_elPlayersTable = (elPlayersTable && elPlayersTable.IsValid()) ? elPlayersTable : undefined;
            let elTeamLogoChildren = [];
            if (scoreBoard && scoreBoard.IsValid()) {
                const children_ = scoreBoard.FindChildrenWithClassTraverse('sb-team-logo-background--' + teamName);
                for (let child of children_) {
                    if (child && child.IsValid()) {
                        elTeamLogoChildren.push(child);
                    }
                }
            }
            this.m_elLogoChildren = elTeamLogoChildren;
        }
        // only call for the local player's team because we only want to show local player team commendations
        CalculateAllCommends() {
            let leader = this.m_CommendLeaderboards["leader"];
            let teacher = this.m_CommendLeaderboards["teacher"];
            let friendly = this.m_CommendLeaderboards["friendly"];
            leader.sort((a, b) => b.m_value - a.m_value);
            teacher.sort((a, b) => b.m_value - a.m_value);
            friendly.sort((a, b) => b.m_value - a.m_value);
            let bestLeaderXuid = '';
            {
                bestLeaderXuid = leader[0] ? leader[0].m_xuid : "0";
            }
            let bestTeacherXuid = '';
            {
                let teacher0 = teacher[0] ? teacher[0].m_xuid : "0";
                let teacher1 = teacher[1] ? teacher[1].m_xuid : "0";
                if (teacher0 != bestLeaderXuid) {
                    bestTeacherXuid = teacher0;
                }
                else {
                    bestTeacherXuid = teacher1;
                }
            }
            let bestFriendlyXuid = '';
            {
                let friendly0 = friendly[0] ? friendly[0].m_xuid : "0";
                let friendly1 = friendly[1] ? friendly[1].m_xuid : "0";
                let friendly2 = friendly[2] ? friendly[2].m_xuid : "0";
                if (friendly0 != bestLeaderXuid && friendly0 != bestTeacherXuid) {
                    bestFriendlyXuid = friendly0;
                }
                else if (friendly1 != bestLeaderXuid && friendly1 != bestTeacherXuid) {
                    bestFriendlyXuid = friendly1;
                }
                else {
                    bestFriendlyXuid = friendly2;
                }
            }
            {
                let oldTop = _m_TopCommends2.leader;
                let newTop = bestLeaderXuid;
                _m_TopCommends2.leader = newTop;
                if (newTop != oldTop) {
                    let stat = "leader";
                    this._ChangeCommendDisplay(oldTop, stat, false);
                    this._ChangeCommendDisplay(newTop, stat, true);
                }
            }
            {
                let oldTop = _m_TopCommends2.teacher;
                let newTop = bestTeacherXuid;
                _m_TopCommends2.teacher = newTop;
                if (newTop != oldTop) {
                    let stat = "teacher";
                    this._ChangeCommendDisplay(oldTop, stat, false);
                    this._ChangeCommendDisplay(newTop, stat, true);
                }
            }
            {
                let oldTop = _m_TopCommends2.friendly;
                let newTop = bestFriendlyXuid;
                _m_TopCommends2.friendly = newTop;
                if (newTop != oldTop) {
                    let stat = "friendly";
                    this._ChangeCommendDisplay(oldTop, stat, false);
                    this._ChangeCommendDisplay(newTop, stat, true);
                }
            }
        }
        UpdateCommendForPlayer(xuid, stat, value) {
            if (value == 0)
                return;
            let playerCommend = this.m_CommendLeaderboards[stat].find(p => p.m_xuid === xuid);
            if (!playerCommend) {
                this.m_CommendLeaderboards[stat].push({ m_xuid: xuid, m_value: value });
            }
            else {
                playerCommend.m_value = value;
            }
        }
        DeletePlayerFromCommendsLeaderboards(xuid) {
            for (let stat of ['leader', 'teacher', 'friendly']) {
                let index = this.m_CommendLeaderboards[stat].findIndex(p => p.m_xuid === xuid);
                if (index != -1) {
                    this.m_CommendLeaderboards[stat].splice(index, 1);
                }
            }
        }
        _ChangeCommendDisplay(xuid, stat, turnon) {
            let oPlayer = _m_oPlayers.GetPlayerByXuid(xuid);
            if (!oPlayer)
                return;
            let elPlayer = oPlayer.m_elPlayer;
            if (!elPlayer || !elPlayer.IsValid())
                return;
            let elCommendationImage = elPlayer.FindChildTraverse('id-sb-name__commendations__' + stat);
            if (!elCommendationImage || !elCommendationImage.IsValid())
                return;
            elCommendationImage.SetHasClass('hidden', !turnon);
        }
    }
    class Player_t {
        static m_defaulPlayerGameStats = {
            is_fake_player: false,
            is_valid_xuid: false,
            is_muted: false,
            is_enemy: false,
            has_abuse_mute: false,
            team_name: "",
            team_number: 0,
            slot: 0,
            color: "",
            status: 0,
            comp_ranking: -1,
            comp_type: "",
            comp_wins: -1,
            ping: -1,
            kills: -1,
            round_kills: -1,
            assists: -1,
            deaths: -1,
            mvps: -1,
            money: 0,
            score: -1,
            xp_trail_level: 0,
            commend_leader: 0,
            commend_teacher: 0,
            commend_friendly: 0,
        };
        m_xuid;
        m_elPlayer = undefined; // panel of the player's row
        m_elTeam = undefined; // panel of the player's team, also parent of player row/panel
        m_oStats = {}; // collection of the players stat values
        m_oElStats = {}; // collection of the player's cell panels
        m_isMuted = false; // muted state;
        m_oMatchStats = undefined;
        m_oGameStats = undefined;
        m_xp_trail_level;
        m_team = undefined;
        constructor(xuid) {
            this.m_xuid = xuid;
        }
        GetStatNum(stat, dflt = 0) {
            const val = this.m_oStats[stat];
            return typeof val === "number" && isFinite(val) ? val : dflt;
        }
        GetStatText(stat, dflt = "") {
            const val = this.m_oStats[stat];
            return typeof val === "string" ? val : val != null ? val.toString() : dflt;
        }
        RetrieveGameStats() {
            this.m_oMatchStats = MatchStatsAPI.GetPlayerStatsJSO(this.m_xuid);
            this.m_oGameStats = GameStateAPI.GetPlayerStatsJSO(this.m_xuid);
        }
        GetGameStat(member) {
            const gameStats = (this.m_oGameStats ? this.m_oGameStats : Player_t.m_defaulPlayerGameStats);
            return gameStats[member];
        }
        UpdateAndSort(updateStatNames, bSilent) {
            this.RetrieveGameStats();
            _UpdateAllStatsForPlayer(this, updateStatNames, bSilent);
            _SortPlayer(this);
        }
    }
    class AllPlayers_t {
        m_arrPlayers = [];
        AddPlayer(xuid) {
            let newPlayer = new Player_t(xuid);
            let teamName = (xuid ? GameStateAPI.GetPlayerTeamName(xuid) : '');
            if (IsTeamASpecTeam(teamName))
                teamName = 'Spectator';
            let team = Team_t.GetTeam(teamName);
            let elTeam = team ? team.m_elPlayersTable : undefined;
            if (!elTeam || !elTeam.IsValid()) {
                elTeam = (_m_panelCache.m_elPlayersTableAny ? _m_panelCache.m_elPlayersTableAny : undefined);
            }
            newPlayer.m_elTeam = elTeam;
            newPlayer.m_team = _m_oTeams[teamName];
            this.m_arrPlayers.push(newPlayer);
            return newPlayer;
        }
        GetPlayerByIndex(i) {
            return this.m_arrPlayers[i];
        }
        GetPlayerByXuid(xuid) {
            return this.m_arrPlayers.find(p => p.m_xuid === xuid);
        }
        GetPlayerIndexByPlayerSlot(slot) {
            let xuid = GameStateAPI.GetPlayerXuidStringFromPlayerSlot(slot);
            return this.GetPlayerIndexByXuid(xuid);
        }
        GetPlayerIndexByXuid(xuid) {
            return this.m_arrPlayers.findIndex(p => p.m_xuid === xuid);
        }
        GetCount() {
            return this.m_arrPlayers.length;
        }
        DeletePlayerByXuid(xuid) {
            let oPlayer = this.GetPlayerByXuid(xuid);
            const teamName = oPlayer?.m_oStats?.teamname;
            if (teamName && _m_oTeams[teamName]) {
                _m_oTeams[teamName].DeletePlayerFromCommendsLeaderboards(xuid);
            }
            let i = this.GetPlayerIndexByXuid(xuid);
            if (this.m_arrPlayers[i].m_elPlayer && this.m_arrPlayers[i].m_elPlayer.IsValid()) {
                this.m_arrPlayers[i].m_elPlayer.m_elSkillGroup = undefined;
                this.m_arrPlayers[i].m_elPlayer.DeleteAsync(.0);
            }
            this.m_arrPlayers.splice(i, 1);
        }
        DeleteMissingPlayers(oPlayerData) {
            const xuids = oPlayerData.players.map(p => p.xuid);
            for (const player of this.m_arrPlayers) {
                if (!xuids.includes(player.m_xuid)) {
                    this.DeletePlayerByXuid(player.m_xuid);
                }
            }
        }
    }
    let _m_bInit = false;
    let _m_bRowLabelsCreated = false;
    let _m_oAllUpdateStatNames = [];
    let _m_oUpdateStatNames = [];
    let _m_updatePlayerIndex = 0; // pointer to next player to update
    let _m_oTeams = {}; // a collection of teams
    let _m_arrSortingPausedRefGetCounter = 0; // Pause the player sorting when > 0
    let _m_hDenyInputToGame = null; // Handle used by the player card context menu to deny input to the game
    let _m_dataSetCurrent = 0;
    let _m_dataSetGetCount = 0;
    let _m_areTeamsSwapped = false;
    let _m_maxRounds = 0;
    let _m_oPlayers; // object that contains players
    let _m_RoundUpdated = {}; // keeping track of which rounds have been updated so we don't updated multiple times per round
    let _m_TopCommends = {
        'leader': "0",
        'teacher': "0",
        'friendly': "0",
    };
    ;
    let _m_TopCommends2 = {
        leader: "0",
        teacher: "0",
        friendly: "0",
    };
    let _m_overtime = 0;
    let _m_updatePlayerHandler = null;
    let _m_haveViewers = false;
    let FAKEMODE = '';
    //DEVONLY{
    FAKEMODE = '';
    //}DEVONLY
    const sortOrder_default = {
        'dc': 0,
        'score': 0,
        'risc': 0,
        'mvps': 0,
        'kills': 0,
        'assists': 0,
        'deaths': -1,
        'leader': 0,
        'teacher': 0,
        'friendly': 0,
        'rank': 0,
        'idx': -1,
        // we include the below so players can choose to sort by them.
        // otherwise they never get used because player index never ties
        'damage': 0,
        'avgrisc': 0,
        'money': 0,
        'hsp': 0,
        'kdr': 0,
        'adr': 0,
        'utilitydamage': 0,
        'enemiesflashed': 0,
    };
    const sortOrder_reverse = {
        'dc': 0,
        'score': -1,
        'risc': -1,
        'mvps': -1,
        'kills': -1,
        'assists': -1,
        'deaths': 0,
        'leader': -1,
        'teacher': -1,
        'friendly': -1,
        'rank': -1,
        'idx': 0,
        // we include the below so players can choose to sort by them.
        // otherwise they never get used because player index never ties
        'damage': 0,
        'avgrisc': 0,
        'money': 0,
        'hsp': 0,
        'kdr': 0,
        'adr': 0,
        'utilitydamage': 0,
        'enemiesflashed': 0,
    };
    const sortOrder_dm = {
        'dc': 0,
        'score': 0,
        'kills': 0,
        'kdr': 0,
        'damage': 0,
        'hsp': 0,
        'idx': -1,
        // we include the below so players can choose to sort by them.
        // otherwise they never get used because player index never ties
        'assists': 0,
        'deaths': -1, // reverse
    };
    const sortOrder_gg = {
        'dc': 0,
        'gglevel': 0,
        'knifekills': 0,
        'taserkills': 0,
        'kills': 0,
        'kdr': 0,
        'hsp': 0,
        'idx': -1,
        // we include the below so players can choose to sort by them.
        // otherwise they never get used because player index never ties
        'assists': 0,
        'deaths': -1, // reverse
    };
    const sortOrder_tmm = {
        'dc': 0,
        'damage': 0,
        'kills': 0,
        'risc': 0,
        'mvps': 0,
        'assists': 0,
        'deaths': -1,
        'leader': 0,
        'teacher': 0,
        'friendly': 0,
        'rank': 0,
        'idx': -1,
        // we include the below so players can choose to sort by them.
        // otherwise they never get used because player index never ties
        'score': 0,
        'avgrisc': 0,
        'money': 0,
        'hsp': 0,
        'kdr': 0,
        'adr': 0,
        'utilitydamage': 0,
        'enemiesflashed': 0,
    };
    let _m_sortOrder = sortOrder_default; // which player sort we're using
    _Reset();
    function _Reset() {
        _m_bInit = false;
        _m_bRowLabelsCreated = false;
        _m_oPlayers = new AllPlayers_t();
        _m_oUpdateStatNames = [];
        _m_updatePlayerIndex = 0;
        _m_oTeams = {};
        _m_arrSortingPausedRefGetCounter = 0;
        _m_hDenyInputToGame = null;
        _m_dataSetCurrent = 0;
        _m_dataSetGetCount = 0;
        _m_areTeamsSwapped = false;
        _m_maxRounds = 0;
        _m_sortOrder = sortOrder_default;
        _m_overtime = 0;
        _m_RoundUpdated = {};
        _m_TopCommends = {
            'leader': "0",
            'teacher': "0",
            'friendly': "0",
        };
        _m_TopCommends2 = {
            leader: "0",
            teacher: "0",
            friendly: "0",
        };
        _m_panelCache.ClearAll();
        _m_cP.RemoveAndDeleteChildren();
        _m_cP.m_matchInfo = undefined;
        _m_cP.m_bSnippetLoaded = false;
        //DEVONLY{
        if (FAKEMODE === 'Premier') {
            MockAdapter.AddTable('scoreboard_premier', {
                k_GetPlayerCompetitiveRanking: 1234,
                k_GetPlayerCompetitiveRankType: {
                    0: FAKEMODE
                },
            });
            MockAdapter.SetMockData('scoreboard_premier');
        }
        //}DEVONLY
    }
    function _Helper_LoadSnippet(element, snippet) {
        if (element && !element.m_bSnippetLoaded) {
            element.BLoadLayoutSnippet(snippet);
            element.m_bSnippetLoaded = true;
        }
    }
    //
    // get a jso of teams and their players
    //
    function _PopulatePlayerList(oPlayerData) {
        if (oPlayerData.teams.length === 0)
            return;
        for (const team of oPlayerData.teams) {
            if (team.player_count > 0) {
                Team_t.GetOrCreateTeam(_m_cP, team.name);
            }
        }
        Team_t.GetOrCreateTeam(_m_cP, 'CT');
        Team_t.GetOrCreateTeam(_m_cP, 'TERRORIST');
        let highlightSortStatLabel = false;
        for (let p of oPlayerData.players) {
            const xuid = p.xuid;
            if (xuid == null || xuid == '' || xuid === "0")
                continue;
            const teamName = oPlayerData.teams[p.team].name;
            const oPlayer = _m_oPlayers.GetPlayerByXuid(xuid);
            // if it is a new player, add to the list of players
            if (!oPlayer) {
                let oNewPlayer = _m_oPlayers.AddPlayer(xuid);
                _NewPlayerPanel(oNewPlayer);
                oNewPlayer.UpdateAndSort(_m_oUpdateStatNames, true);
                // Since the label is on the scoreboard, there's no need to highlight it every time we create a player
                highlightSortStatLabel = true;
            }
            else if (oPlayer.m_oStats['teamname'] != teamName) // changed teams
             {
                _ChangeTeams(oPlayer, teamName);
            }
        }
        if (highlightSortStatLabel) {
            // only use the first stat ( after 'dc' ) in sortorder
            let sortOrder = Object.keys(_m_sortOrder)[1]; // 0 is 'dc'
            _HighlightSortStatLabel(sortOrder);
        }
    }
    function _ChangeTeams(oPlayer, newTeamName) {
        // nm if no change.
        if (oPlayer.m_oStats['teamname'] == newTeamName)
            return false;
        let xuid = oPlayer.m_xuid;
        let oldTeam = oPlayer.m_oStats['teamname'];
        let elPlayer = oPlayer.m_elPlayer;
        // update the stat on the player
        oPlayer.m_oStats['teamname'] = newTeamName;
        // update the commendation lists
        if (oldTeam in _m_oTeams) {
            _m_oTeams[oldTeam].DeletePlayerFromCommendsLeaderboards(xuid);
        }
        if (newTeamName in _m_oTeams) {
            oPlayer.m_team = _m_oTeams[newTeamName];
        }
        else {
            oPlayer.m_team = undefined;
        }
        // reset commendations so they get picked up in UpdateAllStats and entered into new team
        oPlayer.m_oStats['leader'] = -1;
        oPlayer.m_oStats['teacher'] = -1;
        oPlayer.m_oStats['friendly'] = -1;
        if (!elPlayer || !elPlayer.IsValid())
            return true;
        // update the player's row class for team color
        if (oldTeam)
            elPlayer.RemoveClass('sb-team--' + oldTeam);
        elPlayer.AddClass('sb-team--' + newTeamName);
        // hide spectators in tournament matches
        if (IsTeamASpecTeam(newTeamName) && MatchStatsAPI.IsTournamentMatch()) {
            elPlayer.AddClass('hidden');
            return true;
        }
        // move the player row panel to the new team
        //
        let team = oPlayer.m_team;
        let elTeam = team ? team.m_elPlayersTable : null;
        if (!elTeam && !IsTeamASpecTeam(newTeamName)) {
            elTeam = _m_panelCache.m_elPlayersTableAny;
        }
        if (elTeam && elTeam.IsValid()) {
            oPlayer.m_elTeam = elTeam;
            elPlayer.SetParent(elTeam);
            elPlayer.RemoveClass('hidden');
        }
        else {
            elPlayer.AddClass('hidden');
        }
        return true;
    }
    //
    // function that walks over list of players, one each call, and updates them.
    // refresh the player list every go-through
    //
    function _UpdateNextPlayer() {
        const oPlayerData = GameStateAPI.GetPlayerDataJSO();
        _m_oPlayers.DeleteMissingPlayers(oPlayerData);
        if (_m_updatePlayerIndex >= _m_oPlayers.GetCount()) {
            _PopulatePlayerList(oPlayerData);
            _m_updatePlayerIndex = 0;
        }
        _UpdatePlayer(_m_updatePlayerIndex);
        _m_updatePlayerIndex++;
    }
    function _UpdateAllPlayers_delayed() {
        $.Schedule(0.01, _UpdateAllPlayers);
    }
    ////////////////////////////////////////////////
    function _UpdateAllPlayers(bInitialCreate = false) {
        if (!_m_bInit)
            return;
        const bSilent = true;
        const oPlayerData = GameStateAPI.GetPlayerDataJSO();
        _m_oPlayers.DeleteMissingPlayers(oPlayerData);
        _PopulatePlayerList(oPlayerData);
        _m_updatePlayerIndex = 0;
        if (!bInitialCreate) {
            // traverse the dictionary we made and update each player
            // this could update player row positions, so disable position
            // animation first to avoid catch-up effect
            for (let i = 0; i < _m_oPlayers.GetCount(); i++) {
                let elPlayer = _m_oPlayers.GetPlayerByIndex(i).m_elPlayer;
                if (elPlayer && elPlayer.IsValid())
                    elPlayer.RemoveClass('sb-row--transition');
            }
            for (let i = 0; i < _m_oPlayers.GetCount(); i++) {
                _UpdatePlayer(i, bSilent);
            }
            //	re-enable position animation
            for (let i = 0; i < _m_oPlayers.GetCount(); i++) {
                let elPlayer = _m_oPlayers.GetPlayerByIndex(i).m_elPlayer;
                if (elPlayer && elPlayer.IsValid())
                    elPlayer.AddClass('sb-row--transition');
            }
        }
    }
    // highlight a stat
    function _Pulse(el) {
        el.RemoveClass('sb-pulse-highlight');
        el.AddClass('sb-pulse-highlight');
    }
    function _UpdatePlayerByPlayerSlot(slot) {
        let index = _m_oPlayers.GetPlayerIndexByPlayerSlot(slot);
        _UpdatePlayer(index, true);
    }
    function _UpdatePlayerByPlayerSlot_delayed(slot) {
        // we need to delay the update because the gameresource updates after the game event that we're reacting to.
        // If we don't delay, the data will not be new
        $.Schedule(0.01, () => _UpdatePlayerByPlayerSlot(slot));
    }
    ////////////////////////////////////////////////
    //
    // update a player
    //
    function _UpdatePlayer(idx, bSilent = false) {
        let oPlayer = _m_oPlayers.GetPlayerByIndex(idx);
        if (!oPlayer)
            return;
        bSilent = bSilent && _m_cP.visible;
        oPlayer.UpdateAndSort(_m_oUpdateStatNames, bSilent);
    }
    ////////////////////////////////////////////////
    function _UpdateSpectatorButtons() {
        let elButtonPanel = $('#spec-button-group');
        if (!elButtonPanel || !elButtonPanel.IsValid())
            return;
        let nCameraMan = parseInt(GameInterfaceAPI.GetSettingString('spec_autodirector_cameraman'));
        let bQ = (GameStateAPI.IsLocalPlayerHLTV() && nCameraMan > -1);
        if (bQ) {
            elButtonPanel.visible = true;
            UpdateCasterButtons();
        }
        else {
            elButtonPanel.visible = false;
        }
    }
    function _lessthan(x, y) {
        x = Number(x);
        y = Number(y);
        if (isNaN(x))
            return (!isNaN(y));
        if (isNaN(y))
            return false;
        return (x < y);
    }
    // NOTE: Sort player only supports numeric stat comparison
    //
    function _SortPlayer(oPlayer) {
        if (_m_arrSortingPausedRefGetCounter != 0)
            return;
        let elTeam = oPlayer.m_elTeam;
        if (!elTeam || !elTeam.IsValid())
            return;
        let elPlayer = oPlayer.m_elPlayer;
        if (!elPlayer || !elPlayer.IsValid())
            return;
        let children = elTeam.Children();
        for (let i = 0; i < children.length; i++) {
            // dont sort against ourselves
            if (oPlayer.m_xuid === children[i].m_xuid)
                continue;
            let oCompareTargetPlayer = _m_oPlayers.GetPlayerByXuid(children[i].m_xuid);
            if (!oCompareTargetPlayer)
                continue;
            for (let stat in _m_sortOrder) {
                let p1stat = oPlayer.m_oStats[stat];
                let p2stat = oCompareTargetPlayer.m_oStats[stat];
                if (_m_sortOrder[stat] === -1) // reverse
                 {
                    // swap
                    let tmp = p1stat;
                    p1stat = p2stat;
                    p2stat = tmp;
                }
                if (_lessthan(p2stat, p1stat)) {
                    if (children[i - 1] != elPlayer) {
                        elTeam.MoveChildBefore(elPlayer, children[i]);
                    }
                    return;
                }
                else if (_lessthan(p1stat, p2stat)) {
                    break;
                }
            }
        }
    }
    function IsTeamASpecTeam(teamname) {
        return (teamname === 'Spectator' ||
            teamname === 'Unassigned' ||
            teamname === 'Unknown' ||
            teamname === 'UNKNOWN TEAM' ||
            teamname === '');
    }
    ////////////////////////////////////////////////
    function _UpdateAllStatsForPlayer(oPlayer, oUpdateStatNames, bSilent = false) {
        const bIsUpdatingAllStats = true;
        for (let stat of oUpdateStatNames) {
            _UpdatePlayerStat(oPlayer, stat, bIsUpdatingAllStats, bSilent);
        }
    }
    // an update method for simple text labels ( e.g. kills, deaths, assists )
    function _GenericUpdateStat(oPlayer, stat, fnGetStat, bSilent = false) {
        // create a label in the panel if it doesn't exist
        let elPanel = oPlayer.m_oElStats[stat];
        if (!elPanel || !elPanel.IsValid())
            return;
        let newStatValue = fnGetStat(oPlayer.m_xuid);
        if (newStatValue !== oPlayer.m_oStats[stat]) {
            let elLabel = elPanel.m_elLabel;
            const validLabel = (elLabel && elLabel.IsValid()) ? true : false;
            if (!bSilent) {
                if (validLabel) {
                    _Pulse(elLabel);
                }
            }
            oPlayer.m_oStats[stat] = newStatValue;
            if (validLabel) {
                elLabel.text = newStatValue.toString();
            }
        }
    }
    function _GenericUpdateStatDirect(oPlayer, stat, val, bSilent = false) {
        // create a label in the panel if it doesn't exist
        let elPanel = oPlayer.m_oElStats[stat];
        if (!elPanel || !elPanel.IsValid())
            return;
        let newStatValue = val;
        if (newStatValue !== oPlayer.m_oStats[stat]) {
            let elLabel = elPanel.m_elLabel;
            const validLabel = (elLabel && elLabel.IsValid()) ? true : false;
            if (!bSilent) {
                if (validLabel) {
                    _Pulse(elLabel);
                }
            }
            oPlayer.m_oStats[stat] = newStatValue;
            if (validLabel) {
                elLabel.text = newStatValue.toString();
            }
        }
    }
    function _GetMatchStatFn(stat) {
        function _fn(xuid) {
            let oPlayer = _m_oPlayers.GetPlayerByXuid(xuid);
            if (oPlayer) {
                let allstats = oPlayer.m_oMatchStats;
                if (allstats)
                    return (allstats[stat] == -1) ? '-' : allstats[stat];
            }
            return '-';
        }
        return _fn;
    }
    function _UpdatePlayerStat(oPlayer, stat, bIsUpdatingAllStats, bSilent = false) {
        switch (stat) {
            case 'musickit':
                {
                    if (oPlayer.GetGameStat('is_fake_player')) {
                        return;
                    }
                    let ownerXuid = oPlayer.m_xuid;
                    let isLocalPlayer = oPlayer.m_xuid == GetLocalPlayerId();
                    let isBorrowed = false;
                    let borrowedXuid = "0";
                    let borrowedPlayerSlot = parseInt(GameInterfaceAPI.GetSettingString('cl_borrow_music_from_player_slot'));
                    if (borrowedPlayerSlot >= 0 && isLocalPlayer) {
                        borrowedXuid = GameStateAPI.GetPlayerXuidStringFromPlayerSlot(borrowedPlayerSlot);
                        if (MockAdapter.IsPlayerConnected(borrowedXuid)) {
                            ownerXuid = borrowedXuid;
                            isBorrowed = true;
                        }
                    }
                    let newStatValue = InventoryAPI.GetMusicIDForPlayer(ownerXuid);
                    if (newStatValue !== oPlayer.m_oStats[stat]) {
                        oPlayer.m_oStats[stat] = newStatValue;
                        // update local music kit display
                        if (isLocalPlayer) {
                            let elMusicKit = _m_panelCache.m_elMusicKit;
                            if (!elMusicKit || !elMusicKit.IsValid())
                                return;
                            let isValidMusicKit = newStatValue > 0;
                            elMusicKit.SetHasClass('hidden', !isValidMusicKit);
                            if (isValidMusicKit) {
                                // set cancel borrow state
                                if (_m_panelCache.m_elMusicKitUnborrow) {
                                    _m_panelCache.m_elMusicKitUnborrow.SetHasClass('hidden', !isBorrowed);
                                }
                                let imagepath = 'file://{images}/' + InventoryAPI.GetItemInventoryImageFromMusicID(newStatValue) + '.png';
                                let elMusicKitImage = $('#id-sb-meta__musickit-image');
                                if (elMusicKitImage) {
                                    elMusicKitImage.SetImage(imagepath);
                                }
                                let elMusicKitName = $('#id-sb-meta__musickit-name');
                                if (elMusicKitName) {
                                    elMusicKitName.text = $.Localize(InventoryAPI.GetMusicNameFromMusicID(newStatValue));
                                }
                            }
                        }
                    }
                    let elPlayer = oPlayer.m_elPlayer;
                    if (elPlayer && elPlayer.IsValid()) {
                        ////////////////////////////////
                        // ICON ON NAME LABEL
                        ////////////////////////////////
                        let elMusicKitIcon = elPlayer.FindChildTraverse('id-sb-name__musickit');
                        if (elMusicKitIcon && elMusicKitIcon.IsValid()) {
                            elMusicKitIcon.SetHasClass('hidden', newStatValue <= 1);
                        }
                    }
                }
                break;
            case 'teamname':
                {
                    const newTeam = (oPlayer.GetGameStat('team_name'));
                    const bChangedTeams = _ChangeTeams(oPlayer, newTeam);
                    if (bChangedTeams && !bIsUpdatingAllStats) {
                        // update all player stats
                        _UpdateAllStatsForPlayer(oPlayer, _m_oUpdateStatNames, true); // will recurse but ok because will exit early
                        _SortPlayer(oPlayer);
                    }
                }
                break;
            case 'ping':
                {
                    let elPlayer = oPlayer.m_elPlayer;
                    if (!elPlayer || !elPlayer.IsValid())
                        return;
                    let elPanel = oPlayer.m_oElStats[stat];
                    if (!elPanel || !elPanel.IsValid())
                        return;
                    let elLabel = elPanel.m_elLabel;
                    if (!elLabel)
                        return;
                    oPlayer.m_elPlayer?.SetHasClass('bot', oPlayer.GetGameStat('is_fake_player'));
                    let szCustomLabel = _GetCustomStatTextValue('ping', oPlayer);
                    elLabel.SetHasClass('sb-row__cell--ping__label--bot', !!szCustomLabel); // TODO: fix this style to use same function making rules
                    if (szCustomLabel) {
                        elLabel.text = $.Localize(szCustomLabel);
                        oPlayer.m_oStats[stat] = szCustomLabel; // We have to set this otherwise _GenericUpdateStat will not update the actual label
                    }
                    else {
                        _GenericUpdateStatDirect(oPlayer, stat, oPlayer.GetGameStat('ping'), true);
                    }
                }
                break;
            case 'kills':
                {
                    _GenericUpdateStatDirect(oPlayer, stat, oPlayer.GetGameStat('kills'), bSilent);
                }
                break;
            case 'assists':
                {
                    _GenericUpdateStatDirect(oPlayer, stat, oPlayer.GetGameStat('assists'), bSilent);
                }
                break;
            case 'deaths':
                {
                    _GenericUpdateStatDirect(oPlayer, stat, oPlayer.GetGameStat('deaths'), bSilent);
                }
                break;
            case '3k':
            case '4k':
            case '5k':
            case 'adr':
            case 'hsp':
            case 'utilitydamage':
            case 'enemiesflashed':
            case 'damage':
            case 'knifekills':
            case 'taserkills':
                {
                    _GenericUpdateStat(oPlayer, stat, _GetMatchStatFn(stat), bSilent);
                }
                break;
            case 'kdr':
                {
                    let kdr;
                    if (_m_overtime == 0) {
                        // using matchstats version of kdr which is consistent with other stats:
                        // does not deduct for suicides and updates at the end of the round.
                        let kdrFn = _GetMatchStatFn('kdr');
                        kdr = kdrFn(oPlayer.m_xuid);
                        if (typeof kdr == 'number' && kdr > 0) {
                            kdr = kdr / 100.0;
                        }
                    }
                    else {
                        //
                        // for overtime support we use kills/deaths and NOT matchstats because
                        // kdr that does not match visible kills and deaths is confusing.
                        // This is a stop gap for Majors. A proper solution would rethink kills/deaths/etc on the player resource.
                        //
                        let denom = oPlayer.GetStatNum('deaths') || 1;
                        kdr = oPlayer.GetStatNum('kills') / denom;
                    }
                    if (typeof kdr == 'number') {
                        kdr = kdr.toFixed(2);
                    }
                    _GenericUpdateStat(oPlayer, stat, () => { return kdr; }, bSilent);
                }
                break;
            case 'mvps':
                {
                    let newStatValue = oPlayer.GetGameStat('mvps');
                    if (newStatValue !== oPlayer.m_oStats[stat]) {
                        let elMVPPanel = oPlayer.m_oElStats[stat];
                        if (!elMVPPanel || !elMVPPanel.IsValid())
                            return;
                        // create the star image
                        let elMVPStarImage = elMVPPanel.FindChildTraverse('star-image');
                        if (!elMVPStarImage || !elMVPStarImage.IsValid())
                            return;
                        // create the numerator label
                        let elMVPStarNumberLabel = elMVPPanel.FindChildTraverse('star-count');
                        if (!elMVPStarNumberLabel || !elMVPStarNumberLabel.IsValid())
                            return;
                        //////////////
                        oPlayer.m_oStats[stat] = newStatValue;
                        elMVPStarImage.SetHasClass('hidden', newStatValue == 0);
                        elMVPStarNumberLabel.SetHasClass('hidden', newStatValue == 0);
                        elMVPStarNumberLabel.text = newStatValue.toString();
                        if (!bSilent) {
                            _Pulse(elMVPStarImage);
                            _Pulse(elMVPStarNumberLabel);
                        }
                    }
                }
                break;
            case 'status':
                {
                    // 	None,
                    // 	Dead,
                    // 	Bomb,
                    // 	Dominated,
                    // 	DominatedDead,
                    // 	Nemesis,
                    // 	NemesisDead,
                    // 	Defuser,
                    // 	SwitchTeams,
                    // 	SwitchTeamsDead,
                    // 	MatchmakingTwoStackSmallParty,
                    // 	MatchmakingTwoStackParty,
                    // 	MatchmakingThreeStackParty,
                    // 	MatchmakingFourStackParty,
                    // 	MatchmakingFiveStackParty,
                    // 	Disconnected,
                    // 	ScoreboardStatusMax
                    let newStatValue = oPlayer.GetGameStat('status');
                    // uncomment to debug DC sorting.
                    //		newStatValue = GameStateAPI.GetPlayerSlot( oPlayer.m_xuid ) % 3 ? 15 : newStatValue; // for sorting
                    if (newStatValue !== oPlayer.m_oStats[stat]) {
                        oPlayer.m_oStats[stat] = newStatValue;
                        let elPlayer = oPlayer.m_elPlayer;
                        if (!elPlayer || !elPlayer.IsValid())
                            return;
                        elPlayer.SetHasClass('sb-player-status-dead', newStatValue === 1);
                        // stylize and set status of players on condition of connection status
                        elPlayer.SetHasClass('sb-player-status-disconnected', newStatValue === 15);
                        oPlayer.m_oStats['dc'] = newStatValue === 15 ? 0 : 1; // for sorting
                        let elPanel = oPlayer.m_oElStats[stat];
                        if (!elPanel || !elPanel.IsValid())
                            return;
                        let elStatusImage = elPanel.m_elImage;
                        if (!elStatusImage || !elStatusImage.IsValid())
                            return;
                        // set the image
                        elStatusImage.SetImage(dictPlayerStatusImage[newStatValue]);
                    }
                }
                break;
            case 'score':
                {
                    _GenericUpdateStatDirect(oPlayer, stat, oPlayer.GetGameStat('score'));
                }
                break;
            case 'gglevel':
                {
                    _GenericUpdateStat(oPlayer, stat, () => Math.floor(oPlayer.GetGameStat('score') / 2));
                }
                break;
            case 'money':
                {
                    // create a label in the panel if it doesn't exist
                    let elPanel = oPlayer.m_oElStats[stat];
                    if (!elPanel || !elPanel.IsValid())
                        return;
                    // This code is really cludgey - it doesn't really update, but rather creates
                    // or updates labels, but is a copy of generic update stat code so should probably use that
                    // <fix this>
                    let elLabel = elPanel.m_elLabel;
                    if (!elLabel || !elLabel.IsValid())
                        return;
                    let newStatValue = oPlayer.GetGameStat('money');
                    if (newStatValue !== oPlayer.m_oStats[stat]) {
                        if (newStatValue >= 0) {
                            elLabel.SetHasClass('hidden', false);
                            elLabel.SetDialogVariableInt('stat_d_money', newStatValue);
                        }
                        else {
                            elLabel.SetHasClass('hidden', true);
                        }
                        oPlayer.m_oStats[stat] = newStatValue;
                    }
                }
                break;
            case 'name':
                {
                    if (!oPlayer.m_elPlayer || !oPlayer.m_elPlayer.IsValid())
                        return;
                    oPlayer.m_elPlayer.SetHasClass('sb-row--localplayer', oPlayer.m_xuid === GetLocalPlayerId());
                    let elPanel = oPlayer.m_oElStats[stat];
                    if (!elPanel || !elPanel.IsValid())
                        return;
                    ////////////////////////////////
                    // NAME
                    ////////////////////////////////
                    oPlayer.m_elPlayer.SetDialogVariableInt('player_slot', oPlayer.GetGameStat('slot'));
                }
                break;
            case 'honoricon':
                {
                    if (!oPlayer.m_elPlayer || !oPlayer.m_elPlayer.IsValid())
                        return;
                    const xp_trail_level = oPlayer.GetGameStat('xp_trail_level');
                    if (oPlayer.m_xp_trail_level != xp_trail_level) {
                        const elHonorIcon = oPlayer.m_elPlayer.FindChildTraverse('jsHonorIcon');
                        if (elHonorIcon)
                            elHonorIcon.Set(xp_trail_level, false);
                        oPlayer.m_xp_trail_level = xp_trail_level;
                    }
                    /////////////////////// dbug to show player models
                    //DEVONLY{
                    //					const model = MockAdapter.GetPlayerModel( oPlayer.m_xuid );
                    //					elNameLabel.text = model;
                    //}DEVONLY
                }
                break;
            case 'leader':
            case 'teacher':
            case 'friendly':
                {
                    let localPlayer = _m_oPlayers.GetPlayerByXuid(GetLocalPlayerId());
                    let teamName = localPlayer?.m_team?.m_teamName || '';
                    if (GameStateAPI.IsDemoOrHltv() || IsTeamASpecTeam(teamName))
                        return;
                    let newStatValue;
                    if (!oPlayer.GetGameStat('is_valid_xuid')) {
                        return;
                    }
                    else {
                        switch (stat) {
                            case 'leader':
                                newStatValue = oPlayer.GetGameStat('commend_leader');
                                break;
                            case 'teacher':
                                newStatValue = oPlayer.GetGameStat('commend_teacher');
                                break;
                            case 'friendly':
                                newStatValue = oPlayer.GetGameStat('commend_friendly');
                                break;
                        }
                    }
                    // new value? Update it.
                    if (oPlayer.m_oStats[stat] != newStatValue) {
                        oPlayer.m_oStats[stat] = newStatValue;
                        if (oPlayer.m_team)
                            oPlayer.m_team.UpdateCommendForPlayer(oPlayer.m_xuid, stat, newStatValue);
                    }
                }
                break;
            case 'flair':
                {
                    // Don't access InventoryAPI while state is latched --
                    // we could be referring to a player who has already disconnected.
                    if (GameStateAPI.IsLatched()) {
                        return;
                    }
                    let newStatValue = InventoryAPI.GetFlairItemId(oPlayer.m_xuid);
                    if (oPlayer.m_oStats[stat] !== newStatValue) {
                        oPlayer.m_oStats[stat] = newStatValue;
                        let elPanel = oPlayer.m_oElStats[stat];
                        if (!elPanel || !elPanel.IsValid())
                            return;
                        let elFlairImage = elPanel.m_elImage;
                        if (!elFlairImage || !elFlairImage.IsValid())
                            return;
                        let imagepath = InventoryAPI.GetFlairItemImage(oPlayer.m_xuid);
                        if (imagepath !== '') {
                            elFlairImage.SetImage('file://{images}' + imagepath + '_small.png');
                        }
                    }
                }
                break;
            case 'avatar':
                {
                    let elPanel = oPlayer.m_oElStats[stat];
                    if (!elPanel || !elPanel.IsValid())
                        return;
                    // AVATAR IMAGE
                    //
                    // create
                    let elAvatarImage = elPanel.m_elImage;
                    if (!elAvatarImage || !elAvatarImage.IsValid())
                        return;
                    // update
                    const slot = oPlayer.GetGameStat('slot');
                    if (slot >= 0) {
                        elAvatarImage.PopulateFromPlayerSlot(slot);
                    }
                    const team = oPlayer.m_team?.m_teamName || '';
                    elAvatarImage.SwitchClass('teamstyle', 'team--' + team);
                    /////////////////////////////////////////////////////////////////////////
                    // TEAM COLOR
                    //
                    if (elAvatarImage.m_elPlayerColor == undefined) {
                        elAvatarImage.m_elPlayerColor = elAvatarImage.FindChildTraverse('player-color');
                    }
                    let elPlayerColor = elAvatarImage.m_elPlayerColor;
                    if (elPlayerColor && elPlayerColor.IsValid()) {
                        let teamColor = oPlayer.GetGameStat('color');
                        if ((elAvatarImage.m_playerCol == undefined) || (teamColor !== elAvatarImage.m_playerCol)) {
                            elAvatarImage.m_playerCol = teamColor;
                            if (teamColor !== '') {
                                elPlayerColor.style.washColor = teamColor;
                                elPlayerColor.RemoveClass('hidden');
                            }
                            else {
                                elPlayerColor.AddClass('hidden');
                            }
                        }
                    }
                    //////////////////////////
                    // MUTE STATE
                    //
                    let isMuted = oPlayer.GetGameStat('is_muted');
                    oPlayer.m_isMuted = isMuted;
                    let isEnemyTeamMuted = GameInterfaceAPI.GetSettingString("cl_mute_enemy_team") == "1";
                    let isEnemy = oPlayer.GetGameStat('is_enemy');
                    let hasComAbusePenalty = oPlayer.GetGameStat('has_abuse_mute');
                    let isLocalPlayer = oPlayer.m_xuid == GetLocalPlayerId();
                    oPlayer.m_elPlayer.SetHasClass('muted', isMuted || (isEnemy && isEnemyTeamMuted) || (isLocalPlayer && hasComAbusePenalty));
                }
                break;
            case 'skillgroup':
                {
                    const elPlayer = oPlayer.m_elPlayer;
                    if (!elPlayer || !elPlayer.IsValid())
                        return;
                    let elSkillgroup = elPlayer.m_elSkillGroup;
                    if (elSkillgroup && elSkillgroup.IsValid()) {
                        let newStatValue = oPlayer.GetGameStat('comp_ranking');
                        if (newStatValue > 0) {
                            elSkillgroup.visible = true;
                            if (oPlayer.m_oStats[stat] !== newStatValue) {
                                oPlayer.m_oStats[stat] = newStatValue;
                                const rating_type = oPlayer.GetGameStat('comp_type');
                                const score = oPlayer.GetGameStat('comp_ranking');
                                const wins = oPlayer.GetGameStat('comp_wins');
                                let options = {
                                    root_panel: elSkillgroup,
                                    //	xuid: oPlayer.m_xuid,
                                    //	api: 'gamestate' as SkillRatingSourceAPI_t,
                                    full_details: false,
                                    rating_type: rating_type,
                                    leaderboard_details: { score: score, matchesWon: wins },
                                    local_player: oPlayer.m_xuid === MyPersonaAPI.GetXuid()
                                };
                                RatingEmblem.SetXuid(options);
                            }
                        }
                        else {
                            elSkillgroup.visible = false;
                        }
                    }
                }
                break;
            case 'rank':
                {
                    let newStatValue = MockAdapter.GetPlayerXpLevel(oPlayer.m_xuid);
                    if (oPlayer.m_oStats[stat] !== newStatValue) {
                        oPlayer.m_oStats[stat] = newStatValue;
                        let elPanel = oPlayer.m_oElStats[stat];
                        if (!elPanel || !elPanel.IsValid())
                            return;
                        let elRankImage = elPanel.m_elImage;
                        if (!elRankImage || !elRankImage.IsValid())
                            return;
                        let imagepath = '';
                        if (newStatValue > 0) {
                            imagepath = 'file://{images}/icons/xp/level' + newStatValue + '.png';
                        }
                        else {
                            imagepath = '';
                        }
                        elRankImage.SetImage(imagepath);
                    }
                }
                break;
            default:
                {
                    $.Msg(stat + ' is an unhandled stat');
                }
                break;
        }
    }
    function _InitializeStatUpdateFuncs() {
        try {
            for (let stat of _statNames) {
                _m_oAllUpdateStatNames.push(stat);
            }
            _UpdateJob();
        }
        catch {
        }
    }
    function _RegisterStatUpdate(stat) {
        if (_m_oAllUpdateStatNames.includes(stat) && !_m_oUpdateStatNames.includes(stat)) {
            _m_oUpdateStatNames.push(stat);
        }
    }
    function _GetPlayerRowForGameMode() {
        let mode = MockAdapter.GetGameModeInternalName(false);
        let skirmish = MockAdapter.GetGameModeInternalName(true);
        //DEVONLY{
        if (FAKEMODE !== '') {
            switch (FAKEMODE) {
                case 'Premier':
                    return 'snippet_scoreboard-classic__row--premier';
                case 'Competitive':
                    return 'snippet_scoreboard-classic__row--comp';
                case 'Wingman':
                    return 'snippet_scoreboard-classic__row--wingman';
            }
        }
        //}DEVONLY
        if (GameStateAPI.IsQueuedMatchmakingMode_Team()) {
            return 'snippet_scoreboard-classic__row--premier';
        }
        switch (mode) {
            case 'scrimcomp2v2':
                return 'snippet_scoreboard-classic__row--wingman';
            case 'competitive':
            case 'premier':
            case 'rush':
                return 'snippet_scoreboard-classic__row--comp';
            case 'training':
                return 'snippet_scoreboard__row--training';
            case 'deathmatch':
                return 'snippet_scoreboard__row--deathmatch';
            case 'gungameprogressive':
                return 'snippet_scoreboard__row--armsrace';
            case 'coopmission':
            case 'cooperative':
                return 'snippet_scoreboard__row--cooperative';
            case 'casual':
                if (skirmish == 'flyingscoutsman')
                    return 'snippet_scoreboard__row--flyingscoutsman';
                else
                    return 'snippet_scoreboard-classic__row--casual';
            default:
                return 'snippet_scoreboard-classic__row--casual';
        }
    }
    function _HighlightSortStatLabel(stat) {
        // remove hiliting class
        for (let el of _m_cP.FindChildrenWithClassTraverse('sb-row__cell')) {
            if (el && el.IsValid()) {
                if (el.BHasClass('sb-row__cell--' + stat)) {
                    el.AddClass('sortstat');
                }
                else {
                    el.RemoveClass('sortstat');
                }
            }
        }
    }
    function _CreateLabelForStat(stat, set, isHidden) {
        let elLabelRow = $('#id-sb-players-table__labels-row__inner');
        if (!elLabelRow || !elLabelRow.IsValid())
            return;
        let elLabelRowOrSet = elLabelRow;
        // PROCESS SETS
        if (set !== '') {
            //////////////
            // LABEL SETS
            //
            // structure of sets
            //
            //				+-----+     +----------------+
            //				|label+-----+ set containers |
            //				+-----+     +----+---------+-+
            //								 |         |
            //						 +-------+--+     ++--------+
            //						 |set 1     |     |set 2    |
            //						 +--+-----+-+     +--+----+-+
            //							|     |          |    |
            //						 +--+-----+---+ +----++ +-+---+
            //						 |label||label| |label| |label|
            //						 +------------+ +-----+ +-----+
            //
            // do we have a set container?
            let labelSetContainerId = 'id-sb-row__set-container';
            let elLabelSetContainer = $('#' + labelSetContainerId);
            if (!elLabelSetContainer || !elLabelSetContainer.IsValid()) {
                elLabelSetContainer = $.CreatePanel('Panel', elLabelRow, labelSetContainerId);
                elLabelSetContainer.BLoadLayoutSnippet('snippet_sb-label-set-container');
                // enable the cycle button
                if ($('#id-sb-row__set-container')) {
                    $('#id-sb-meta__cycle').RemoveClass('hidden');
                }
            }
            let elSetLabels = elLabelSetContainer.FindChildTraverse('id-sb-row__sets');
            // do we have a set?
            let LabelSetId = 'id-sb-labels-set-' + set;
            let elLabelSet = elSetLabels.FindChildTraverse(LabelSetId);
            let elLabelSetClasses = [];
            if (!elLabelSet || !elLabelSet.IsValid()) {
                _m_dataSetGetCount++; // keep track of the total number of sets
                // create the set container
                elLabelSet = $.CreatePanel('Panel', elSetLabels, LabelSetId);
                elLabelSetClasses.push('sb-row__set', 'no-hover');
            }
            elLabelRowOrSet = elLabelSet;
            // hide any set other than the current one
            if (set != _m_dataSetCurrent.toString()) {
                elLabelSetClasses.push('hidden');
            }
            if (elLabelSetClasses.length > 0) {
                elLabelSet.AddClasses(elLabelSetClasses);
            }
        }
        // Create the label for the column for this stat
        let elStatPanel = elLabelRowOrSet.FindChildInLayoutFile('id-sb-' + stat);
        if (!elStatPanel || !elStatPanel.IsValid()) {
            let statPanelClasses = ['sb-row__cell', 'sb-row__cell--' + stat, 'sb-row__cell--label'].join(" ");
            elStatPanel = $.CreatePanel('Button', elLabelRowOrSet, 'id-sb-' + stat, { class: statPanelClasses });
            let elStatLabel;
            if (stat === 'ping') {
                elStatLabel = $.CreatePanel('Image', elStatPanel, 'label-' + elStatPanel.id);
                elStatLabel.SetImage('file://{images}/icons/ui/ping_4.svg');
            }
            else {
                elStatLabel = $.CreatePanel('Label', elStatPanel, 'label-' + elStatPanel.id);
                if (isHidden == '1') {
                    elStatLabel.text = '';
                }
                else {
                    elStatLabel.text = $.Localize('#Scoreboard_' + stat);
                }
            }
            // Create the tooltip
            let toolTipString = $.Localize('#Scoreboard_' + stat + '_tooltip');
            if (toolTipString !== '') {
                elStatLabel.SetPanelEvent('onmouseover', () => UiToolkitAPI.ShowTextTooltip(elStatLabel.id, toolTipString));
                elStatLabel.SetPanelEvent('onmouseout', () => UiToolkitAPI.HideTextTooltip());
            }
            elStatPanel.SetPanelEvent('onactivate', () => {
                let newSortOrder = { 'dc': 0 };
                // get the unmodified sort order for this mode
                let modeDefaultSortOrder = _GetSortOrderForMode(MockAdapter.GetGameModeInternalName(false));
                // insert the desired stat as the first entry
                // if it doesn't exist then abort
                if (stat in modeDefaultSortOrder)
                    newSortOrder[stat] = modeDefaultSortOrder[stat];
                else
                    return;
                _HighlightSortStatLabel(stat);
                // copy the other stats in order.
                for (let s in modeDefaultSortOrder) {
                    if (s == stat)
                        continue;
                    // 'dc' is forced to the top regardless of player sort preference
                    if (s == 'dc')
                        continue;
                    newSortOrder[s] = modeDefaultSortOrder[s];
                }
                // set the global sort to this new sort.
                _m_sortOrder = newSortOrder;
                // resort players with new sort.
                for (let i = 0; i < _m_oPlayers.GetCount(); i++) {
                    let oPlayer = _m_oPlayers.GetPlayerByIndex(i);
                    _SortPlayer(oPlayer);
                }
            });
        }
    }
    //DEVONLY{
    function _ToggleSortOrderAndResort() {
        let defaultSort = _GetSortOrderForMode(MockAdapter.GetGameModeInternalName(false));
        if (_m_sortOrder == defaultSort)
            _m_sortOrder = sortOrder_reverse;
        else
            _m_sortOrder = defaultSort;
    }
    //}DEVONLY
    // custom stat values override
    function _GetCustomStatTextValue(stat, oPlayer) {
        let szCustomLabel = null;
        if (stat === 'ping') {
            if (oPlayer.GetGameStat('status') == 15) {
                szCustomLabel = '#SFUI_scoreboard_lbl_dc';
            }
            else if (IsTeamASpecTeam(oPlayer.m_team?.m_teamName || '')) {
                szCustomLabel = '#SFUI_scoreboard_lbl_spec';
            }
        }
        return szCustomLabel;
    }
    function _CreatePlayerButtons(oPlayer) {
        if ((oPlayer.m_xuid == '') || MockAdapter.IsFakePlayer(oPlayer.m_xuid))
            return;
        const xuid = oPlayer.m_elPlayer ? oPlayer.m_elPlayer.m_xuid : '';
        for (let entry of ContextmenuPlayerCard.ContextMenus) {
            if (entry.AvailableForItem(xuid)) {
                $.Msg('scoreboard context button ' + entry.name);
                // is there a scoreboard cell for it?
                if (!oPlayer.m_oElStats.hasOwnProperty(entry.name))
                    continue;
                const elContextMenuBtns = oPlayer.m_oElStats[entry.name];
                if ('xml' in entry) // we have an XML for the button
                 {
                    let elEntryBtn = $.CreatePanel('Panel', elContextMenuBtns, entry.name, {
                        class: 'cell__button',
                        style: 'tooltip-position: bottom;'
                    });
                    elEntryBtn.BLoadLayout(entry.xml, false, false);
                }
                else // default case
                 {
                    let elEntryBtn = $.CreatePanel('Button', elContextMenuBtns, entry.name + '_' + xuid, {
                        class: 'cell__button',
                        style: 'tooltip-position: bottom;'
                    });
                    $.CreatePanel('Image', elEntryBtn, entry.name, { src: 'file://{images}/icons/ui/' + entry.icon + '.svg' });
                    //			let label = $.CreatePanel( 'Label', elEntryBtn, entry.name + '-label' );
                    //			label.text = $.Localize( '#tooltip_short_' + entry.name );
                    let tooltip = '#tooltip_' + entry.name;
                    if ('IsDisabled' in entry) {
                        if (entry.IsDisabled()) {
                            elEntryBtn.enabled = false;
                            tooltip = '#tooltip_disabled_' + entry.name;
                        }
                        else {
                            elEntryBtn.enabled = true;
                        }
                    }
                    let onSelected = entry.OnSelected;
                    elEntryBtn.SetPanelEvent('onactivate', () => onSelected(xuid, ''));
                    // tooltip
                    {
                        elEntryBtn.SetPanelEvent('onmouseover', () => UiToolkitAPI.ShowTextTooltip(elEntryBtn.id, tooltip));
                        elEntryBtn.SetPanelEvent('onmouseout', () => UiToolkitAPI.HideTextTooltip());
                    }
                }
            }
        }
    }
    // create a player row
    function _NewPlayerPanel(oPlayer) {
        if (!oPlayer.m_elTeam || !oPlayer.m_elTeam.IsValid())
            return;
        oPlayer.m_elPlayer = $.CreatePanel('Panel', oPlayer.m_elTeam, 'player-' + oPlayer.m_xuid);
        oPlayer.m_elPlayer.m_xuid = oPlayer.m_xuid; // store it on the panel as well for easy reverse lookup.
        _Helper_LoadSnippet(oPlayer.m_elPlayer, _GetPlayerRowForGameMode());
        _CreateLabelsForRow(oPlayer.m_elPlayer);
        oPlayer.m_elPlayer.m_elSkillGroup = oPlayer.m_elPlayer.FindChildTraverse('jsRatingEmblem');
        {
            // stats we want regardless of whether they have a column or not
            _RegisterStatUpdate('teamname');
            _RegisterStatUpdate('musickit');
            _RegisterStatUpdate('status');
            _RegisterStatUpdate('skillgroup');
            _RegisterStatUpdate('leader');
            _RegisterStatUpdate('teacher');
            _RegisterStatUpdate('friendly');
            _RegisterStatUpdate('honoricon');
        }
        let idx = 0;
        function _InitStatCell(elStatCell, oPlayer) {
            if (!elStatCell || !elStatCell.IsValid())
                return;
            const stat = elStatCell.GetAttributeString('data-stat', '');
            //	$.Msg( 'scoreboard: init cell ' + stat );
            // sometimes we group stat panels for layout. so recurse!
            let children = elStatCell.Children();
            for (let i = 0; i < children.length; i++) {
                _InitStatCell(children[i], oPlayer);
            }
            if (stat === '') {
                return;
            }
            // store pointer to the stat element
            oPlayer.m_oElStats[stat] = elStatCell;
            if (oPlayer.m_oElStats[stat]) {
                let elLabel = oPlayer.m_oElStats[stat].FindChildTraverse('label');
                oPlayer.m_oElStats[stat].m_elLabel = elLabel;
                let elImg = oPlayer.m_oElStats[stat].FindChildTraverse('image');
                oPlayer.m_oElStats[stat].m_elImage = elImg;
            }
            let elStatCellClasses = ['sb-row__cell', 'sb-row__cell--' + stat];
            // STAT CELLS
            //
            const set = elStatCell.GetAttributeString('data-set', '');
            if (set !== '') {
                // do we have a set container?
                let SetContainerId = 'id-sb-row__set-container';
                let elParent = elStatCell.GetParent();
                let elSetContainer = oPlayer.m_elPlayer.FindChildTraverse(SetContainerId);
                if (!elSetContainer || !elSetContainer.IsValid()) {
                    elSetContainer = $.CreatePanel('Panel', elParent, SetContainerId);
                    elParent.MoveChildAfter(elSetContainer, elStatCell);
                }
                // do we have a set?
                let setId = 'id-sb-set-' + set;
                let elSetClasses = [];
                let elSet = elSetContainer.FindChildTraverse(setId);
                if (!elSet || !elSet.IsValid) {
                    // create the set container
                    elSet = $.CreatePanel('Panel', elSetContainer, setId);
                    elSetClasses.push('sb-row__set', 'no-hover');
                    // reset the alt bg color
                    idx = 0;
                }
                // move the stat to the set
                elStatCell.SetParent(elSet);
                // hide any set other than the current one
                if (set != _m_dataSetCurrent.toString()) {
                    elSetClasses.push('hidden');
                }
                if (elSetClasses.length > 0) {
                    elSet.AddClasses(elSetClasses);
                }
            }
            // alternate dark backgrounds
            if (idx++ % 2)
                elStatCellClasses.push('sb-row__cell--dark');
            elStatCell.AddClasses(elStatCellClasses);
            const isHidden = elStatCell.GetAttributeString('data-hidden', '');
            if (!isHidden) {
                _RegisterStatUpdate(stat);
            }
        }
        // process each stat:
        // - add a label for it in the header
        // - register the stat update function
        //
        // add the cells that are inside 'highlight'
        const elStatCells = oPlayer.m_elPlayer.Children();
        for (let i = 0; i < elStatCells.length; i++) {
            _InitStatCell(elStatCells[i], oPlayer);
        }
        _CreatePlayerButtons(oPlayer);
        // copies of stats
        oPlayer.m_oStats = {}; // dictionary of stats
        oPlayer.m_oStats['idx'] = GameStateAPI.GetPlayerSlot(oPlayer.m_xuid);
        // mouse events
        oPlayer.m_elPlayer.SetPanelEvent('onmouseover', () => { _m_arrSortingPausedRefGetCounter++; });
        oPlayer.m_elPlayer.SetPanelEvent('onmouseout', () => { _m_arrSortingPausedRefGetCounter--; });
        if (MockAdapter.IsXuidValid(oPlayer.m_xuid)) {
            oPlayer.m_elPlayer.SetPanelEvent('onactivate', () => {
                _m_arrSortingPausedRefGetCounter++;
                let elPlayerCardContextMenu = UiToolkitAPI.ShowCustomLayoutContextMenuParametersDismissEventSetFocus('', '', 'file://{resources}/layout/context_menus/context_menu_playercard.xml', 'xuid=' + oPlayer.m_xuid, _OnPlayerCardDismiss, 
                /*bSetFocus*/ false);
                if (elPlayerCardContextMenu) {
                    elPlayerCardContextMenu.AddClass('ContextMenu_NoArrow');
                }
                if (!_m_hDenyInputToGame) {
                    _m_hDenyInputToGame = UiToolkitAPI.AddDenyInputFlagsToGame(elPlayerCardContextMenu, 'ScoreboardPlayercard', 'CaptureMouse');
                }
            });
        }
        return oPlayer.m_elPlayer;
    }
    function _OnPlayerCardDismiss() {
        _m_arrSortingPausedRefGetCounter--;
        if (_m_hDenyInputToGame) {
            UiToolkitAPI.ReleaseDenyInputFlagsToGame(_m_hDenyInputToGame);
            _m_hDenyInputToGame = null;
        }
    }
    function _UpdateMatchInfo() {
        if (!_m_bInit)
            return;
        /////////////////////////////////////// NAME
        let updateMapLabel = false;
        let queueChanged = false;
        let imagePathChanged = false;
        const mi = GameStateAPI.GetMatchInfoJSO();
        const server_name = _m_haveViewers ? '' : mi.server_name;
        const map_name = mi.map_name;
        const map_bsp_name = mi.map_bsp_name;
        const gamemode_name = mi.gamemode_name;
        const gamemode_internal_name = mi.gamemode_internal_name;
        const gamemode_image_path = mi.gamemode_image_path;
        const tournament_stage = mi.tournament_stage;
        const is_queued_mm_team = mi.is_queued_mm_team;
        const is_demo_or_hltv = mi.is_demo_or_hltv;
        if (_m_cP.m_matchInfo == undefined) {
            updateMapLabel = true;
            queueChanged = true;
            imagePathChanged = true;
            // Make sure we *clone* the object rather than just storing a reference to it!
            _m_cP.m_matchInfo = { ...mi };
        }
        else {
            if ((_m_cP.m_matchInfo.server_name !== server_name)
                || (_m_cP.m_matchInfo.map_name !== map_name)
                || (_m_cP.m_matchInfo.gamemode_name !== gamemode_name)
                || (_m_cP.m_matchInfo.tournament_stage !== tournament_stage)
                || (_m_cP.m_matchInfo.map_bsp_name !== map_bsp_name)
                || (_m_cP.m_matchInfo.gamemode_internal_name !== gamemode_internal_name)) {
                updateMapLabel = true;
            }
            if (_m_cP.m_matchInfo.gamemode_image_path !== gamemode_image_path) {
                imagePathChanged = true;
            }
            if (_m_cP.m_matchInfo.is_queued_mm_team !== is_queued_mm_team) {
                updateMapLabel = true;
                queueChanged = true;
            }
            if (updateMapLabel || imagePathChanged || queueChanged || (_m_cP.m_matchInfo.is_demo_or_hltv !== is_demo_or_hltv)) {
                // Only copy the object if anything actually changed, since the copy is so very slow
                _m_cP.m_matchInfo = { ...mi };
            }
        }
        if (updateMapLabel) {
            _m_cP.SetDialogVariable('server_name', server_name);
            _m_cP.SetDialogVariable('map_name', map_name);
            _m_cP.SetDialogVariable('gamemode_name', gamemode_name);
            _m_cP.SetDialogVariable('tournament_stage', tournament_stage);
            const elMapLabel = _m_panelCache.m_elMetaLabelsModeMap;
            if (elMapLabel) {
                if (MatchStatsAPI.IsTournamentMatch()) {
                    const labelText = $.Localize('{s:tournament_stage} | {s:map_name}', _m_cP);
                    elMapLabel.text = labelText;
                }
                else {
                    let strLocalizeScoreboardTitle = '{s:gamemode_name} | {s:map_name}';
                    const mode = gamemode_internal_name;
                    if ((mode === 'competitive' || mode === 'premier') &&
                        (GameTypesAPI.GetMapGroupAttribute('mg_' + map_bsp_name, 'competitivemod') === 'unranked')) {
                        strLocalizeScoreboardTitle = $.Localize('#SFUI_RankType_Modifier_Unranked', _m_cP) + ' | {s:map_name}';
                    }
                    else if (is_queued_mm_team) {
                        let sMapName = '{s:map_name}';
                        if (map_bsp_name === 'lobby_mapveto')
                            sMapName = $.Localize('#matchdraft_arena_name', _m_cP);
                        strLocalizeScoreboardTitle = $.Localize('#SFUI_GameModeCompetitiveTeams', _m_cP) + ' | ' + sMapName;
                    }
                    const labelText = $.Localize(strLocalizeScoreboardTitle, _m_cP);
                    elMapLabel.text = labelText;
                }
            }
        }
        const elMetaModeImage = _m_panelCache.m_metaModeImage;
        const updateModeImage = (queueChanged || (!is_queued_mm_team && imagePathChanged));
        if (elMetaModeImage && updateModeImage) {
            if (is_queued_mm_team)
                elMetaModeImage.SetImage('file://{images}/icons/ui/competitive_teams.svg');
            else
                elMetaModeImage.SetImage(gamemode_image_path);
        }
        const elMetaLabelsMap = _m_panelCache.m_metaLabelsMap;
        if (elMetaLabelsMap) {
            elMetaLabelsMap.SetImage('file://{images}/map_icons/map_icon_' + map_bsp_name + '.svg');
        }
        const elCoopStats = _m_panelCache.m_coopStats;
        if (elCoopStats) {
            let questID = GameStateAPI.GetActiveQuestID();
            if (questID > 0) {
                elCoopStats.AddClass('show-mission-desc');
                //MissionsAPI.ApplyQuestDialogVarsToPanelJS( questID, elCoopStats );
                let elLabel = elCoopStats.FindChildInLayoutFile('MissionDescriptionLabel');
                if (elLabel) {
                    let strMissionDescriptionToken = MissionsAPI.GetQuestDefinitionField(questID, 'loc_description');
                    elLabel.text = $.Localize(strMissionDescriptionToken, elCoopStats);
                }
            }
        }
        if (!is_demo_or_hltv) {
            let oPlayer = _m_oPlayers.GetPlayerByXuid(GetLocalPlayerId());
            if (oPlayer && oPlayer.m_team) {
                oPlayer.m_team.CalculateAllCommends();
            }
        }
        // mouse enable bind
        const elMouseBinding = _m_panelCache.m_elMouseBinding;
        if (elMouseBinding && elMouseBinding.IsValid()) {
            let bind = GameInterfaceAPI.GetSettingString('cl_scoreboard_mouse_enable_binding');
            if (bind.charAt(0) == '+' || bind.charAt(0) == '-')
                bind = bind.substring(1);
            if ((elMouseBinding.m_bindStr == undefined) || (bind != elMouseBinding.m_bindStr)) {
                elMouseBinding.m_bindStr = bind;
                elMouseBinding.SetDialogVariable('scoreboard_mouse_enable_bind', $.Localize(`{s:bind_${bind}}`, elMouseBinding));
                let strinstruction = $.Localize('#Scoreboard_Mouse_Enable_Instruction', elMouseBinding);
                elMouseBinding.text = $.Localize('#Scoreboard_Mouse_Enable_Instruction', elMouseBinding);
            }
        }
        const elFooterWebsite = _m_panelCache.m_elFooterWebsite;
        if (elFooterWebsite && elFooterWebsite.IsValid()) {
            const strWebsiteURL = MatchStatsAPI.GetServerWebsiteURL(false);
            if (strWebsiteURL) {
                elFooterWebsite.SetHasClass('hidden', false);
                elFooterWebsite.SetPanelEvent('onmouseover', () => UiToolkitAPI.ShowTextTooltip('id-sb-footer-server-website', strWebsiteURL));
                elFooterWebsite.SetPanelEvent('onmouseout', () => UiToolkitAPI.HideTextTooltip());
            }
            else {
                elFooterWebsite.SetHasClass('hidden', true);
            }
        }
    }
    function _UpdateHLTVViewerNumber(nViewers) {
        _m_cP.SetDialogVariableInt('viewers', nViewers);
        _m_haveViewers = nViewers > 0;
        _m_cP.SetDialogVariable('hltv_viewers', _m_haveViewers ? $.Localize('#Scoreboard_Viewers', _m_cP) : '');
    }
    function _UpdateRound(rnd, oScoreData, jsoTime) {
        if (!_SupportsTimeline(jsoTime))
            return;
        if (!oScoreData)
            return;
        if (!jsoTime)
            return;
        if (!('teamdata' in oScoreData))
            return;
        let elTimeline = _m_panelCache.m_elTimelineSegments;
        if (!elTimeline || !elTimeline.IsValid())
            return;
        let elRnd = ((rnd >= 0) && (rnd < _m_panelCache.m_elRounds.length)) ? _m_panelCache.m_elRounds[rnd] : undefined;
        if (!elRnd || !elRnd.IsValid())
            return;
        let elRndTop = elRnd.m_elRndTop;
        let elRndBot = elRnd.m_elRndBot;
        let elRndTick = elRnd.m_elRndTick;
        let elRndTickLabel = elRnd.m_elRndTickLabel;
        let elTick = elRndTick;
        elRndTop.m_elResult.SetImage('');
        elRndBot.m_elResult.SetImage('');
        elRndTop.SetDialogVariable('sb_clinch', '');
        elRndBot.SetDialogVariable('sb_clinch', '');
        if (elTick && elTick.IsValid()) {
            elTick.SetHasClass('hilite', rnd <= jsoTime.rounds_played + 1);
        }
        // clear all rounds in the future that may have been set before a match restart
        if (rnd > jsoTime.rounds_played) {
            let bCanClinch = jsoTime.can_clinch;
            if (bCanClinch) {
                let numToClinch = jsoTime.num_wins_to_clinch;
                let topClinchRound = jsoTime.rounds_played + numToClinch - m_topScore;
                let bThisRoundIsClinchTop = rnd == topClinchRound;
                let botClinchRound = jsoTime.rounds_played + numToClinch - m_botScore;
                let bThisRoundIsClinchBot = rnd == botClinchRound;
                let bShowClinchTop = (bThisRoundIsClinchTop && topClinchRound <= botClinchRound);
                let bShowClinchBot = (bThisRoundIsClinchBot && botClinchRound <= topClinchRound);
                let thisRoundIsClinchAndShowIt = false;
                if (bShowClinchTop) {
                    elRndTop.m_elResult.SetImage(dictRoundResultImage['win']);
                    thisRoundIsClinchAndShowIt = true;
                }
                if (bShowClinchBot) {
                    elRndBot.m_elResult.SetImage(dictRoundResultImage['win']);
                    thisRoundIsClinchAndShowIt = true;
                }
                let roundIsPastClinch = (rnd > topClinchRound || rnd > botClinchRound);
                elRnd.SetHasClass('past-clinch', roundIsPastClinch);
                elRnd.SetHasClass('clinch-round', thisRoundIsClinchAndShowIt);
            }
            elRndTick.RemoveClasses(['sb-team--CT', 'sb-team--TERRORIST']);
            elRndTickLabel.RemoveClasses(['sb-team--CT', 'sb-team--TERRORIST']);
            function _ClearCasualties(elRnd) {
                for (let i = 1; i <= 5; i++) {
                    let img = elRnd.m_elCasualties[i];
                    if (!img)
                        break;
                    img.AddClass('hidden');
                }
            }
            ;
            _ClearCasualties(elRndTop);
            _ClearCasualties(elRndBot);
            return;
        }
        let bFlippedSides = false;
        if (MockAdapter.AreTeamsPlayingSwitchedSides() !== MockAdapter.AreTeamsPlayingSwitchedSidesInRound(rnd)) {
            bFlippedSides = true;
            let elTemp = elRndTop;
            elRndTop = elRndBot;
            elRndBot = elTemp;
        }
        // set the team colors
        elRndTop.AddClass('sb-team--CT');
        elRndBot.AddClass('sb-team--TERRORIST');
        const roundData = oScoreData.rounddata[rnd];
        if (typeof roundData !== 'object') {
            return;
        }
        // ROUND RESULTS
        let result = roundData.result;
        if (result.charAt(0) === 'c') {
            if (bFlippedSides)
                m_botScore++;
            else
                m_topScore++;
            if ((result.charAt(1) === 't') && (result.charAt(2) === '_')) {
                result = result.substring(3);
            }
            // rush
            if ((MockAdapter.GetGameModeInternalName(false) == 'rush')) {
                result = "win_rush";
            }
            elRndTop.m_elResult.SetImage(dictRoundResultImage[result]);
            elRndTop.m_elResult.AddClass('sb-timeline__segment__round--active');
            elRndBot.m_elResult.SetImage('');
            elRndBot.m_elResult.RemoveClass('sb-timeline__segment__round--active');
            elRndTick.AddClass('sb-team--CT');
            elRndTickLabel.AddClass('sb-team--CT');
            elRndTick.RemoveClass('sb-team--TERRORIST');
            elRndTickLabel.RemoveClass('sb-team--TERRORIST');
        }
        else if (result.charAt(0) === 't') {
            if (bFlippedSides)
                m_topScore++;
            else
                m_botScore++;
            if (result.charAt(1) === '_') {
                result = result.substring(2);
            }
            // rush
            if ((MockAdapter.GetGameModeInternalName(false) == 'rush')) {
                result = "win_rush";
            }
            elRndBot.m_elResult.SetImage(dictRoundResultImage[result]);
            elRndBot.m_elResult.AddClass('sb-timeline__segment__round--active');
            elRndTop.m_elResult.SetImage('');
            elRndTop.m_elResult.RemoveClass('sb-timeline__segment__round--active');
            elRndTick.AddClass('sb-team--TERRORIST');
            elRndTickLabel.AddClass('sb-team--TERRORIST');
            elRndTick.RemoveClass('sb-team--CT');
            elRndTickLabel.RemoveClass('sb-team--CT');
        }
        // expecting "CT" or "TERRORIST" for teamName
        let _UpdateCasualties = (teamName, elRnd, nPlayers) => {
            if (_m_oTeams[teamName]) {
                let livingCount = teamName === 'CT' ? roundData.players_alive_CT : roundData.players_alive_TERRORIST;
                for (let i = 1; i <= nPlayers; i++) {
                    let img = elRnd.m_elCasualties[i];
                    if (!img)
                        break;
                    img.RemoveClass('hidden');
                    if (i > livingCount) {
                        img.AddClass('dead-casualty');
                    }
                    else {
                        img.RemoveClass('dead-casualty');
                    }
                }
            }
        };
        // CASUALTIES
        let nPlayers = 5;
        if (MockAdapter.GetGameModeInternalName(false) == 'scrimcomp2v2') {
            nPlayers = 2;
        }
        _UpdateCasualties('CT', elRndTop, nPlayers);
        _UpdateCasualties('TERRORIST', elRndBot, nPlayers);
    }
    function _ShowSurvivors(hide = false) {
        let elTimeline = _m_panelCache.m_elTimelineSegments;
        if (!elTimeline || !elTimeline.IsValid())
            return;
        let arrPanelsToToggleTransparency = elTimeline.FindChildrenWithAttributeTraverse('data-casualty-mouse-over-toggle-transparency');
        arrPanelsToToggleTransparency.forEach(el => el.SetHasClass('transparent', hide));
    }
    function _Casualties_OnMouseOver() {
        // ignore if survivors are always on
        if (GameInterfaceAPI.GetSettingString('cl_scoreboard_survivors_always_on') == '0') {
            _ShowSurvivors();
        }
    }
    function _Casualties_OnMouseOut() {
        // ignore if survivors are always on
        if (GameInterfaceAPI.GetSettingString('cl_scoreboard_survivors_always_on') == '0') {
            _ShowSurvivors(true);
        }
        UiToolkitAPI.HideCustomLayoutTooltip('id-tooltip-sb-casualties');
    }
    function _RoundLossBonusMoneyForTeam(teamname) {
        let nLossAmount = MockAdapter.GetTeamNextRoundLossBonus(teamname);
        let nMaxLoss = parseInt(GameInterfaceAPI.GetSettingString('mp_consecutive_loss_max'));
        if (nLossAmount > nMaxLoss) {
            nLossAmount = nMaxLoss;
        }
        if (nLossAmount < 0) {
            nLossAmount = 0;
        }
        let nBaseAmount = parseInt(GameInterfaceAPI.GetSettingString('cash_team_loser_bonus'));
        let nConsecutiveBonus = parseInt(GameInterfaceAPI.GetSettingString('cash_team_loser_bonus_consecutive_rounds'));
        let nTotalAmount = nBaseAmount + (nLossAmount * nConsecutiveBonus);
        return nTotalAmount;
    }
    function _RoundLossBonusMoney_OnMouseOver_CT() {
        _m_cP.SetDialogVariable('round_loss_income_team', $.Localize('#counter-terrorists'));
        _m_cP.SetDialogVariableInt('round_loss_income_amount', _RoundLossBonusMoneyForTeam('CT'));
        let sTooltipText = $.Localize('#Scoreboard_lossmoneybonus_tooltip', _m_cP);
        UiToolkitAPI.ShowTextTooltip('id-sb-timeline__round-loss-bonus-money', sTooltipText);
    }
    function _RoundLossBonusMoney_OnMouseOut_CT() {
        UiToolkitAPI.HideTextTooltip();
    }
    function _RoundLossBonusMoney_OnMouseOver_TERRORIST() {
        _m_cP.SetDialogVariable('round_loss_income_team', $.Localize('#terrorists'));
        _m_cP.SetDialogVariableInt('round_loss_income_amount', _RoundLossBonusMoneyForTeam('TERRORIST'));
        let sTooltipText = $.Localize('#Scoreboard_lossmoneybonus_tooltip', _m_cP);
        UiToolkitAPI.ShowTextTooltip('id-sb-timeline__round-loss-bonus-money', sTooltipText);
    }
    function _RoundLossBonusMoney_OnMouseOut_TERRORIST() {
        UiToolkitAPI.HideTextTooltip();
    }
    const defaultScoreTeamData = {
        team_name: '',
        team_number: 0,
        team_logo_image_path: '',
        clan_id: 0,
        clan_name: '',
        flag: '',
        logo: '',
        map_victories: 0,
        player_count: 0,
        alive_count: -1,
        score: 0,
        score_1h: undefined,
        score_2h: undefined,
        score_ot: undefined,
        surrendered: undefined,
        next_round_loss_bonus: 0,
    };
    function _UpdateTeamInfo(teamName, teamInfo) {
        let team = Team_t.GetOrCreateTeam(_m_cP, teamName);
        let clanName = teamInfo.clan_name;
        let teamLogoImagePath = teamInfo.team_logo_image_path;
        let total = teamInfo.player_count;
        let living = teamInfo.alive_count;
        let updateLogo = (teamLogoImagePath != team.m_teamLogoImagePath) && (teamLogoImagePath != '');
        team.m_teamLogoImagePath = teamLogoImagePath;
        // team name
        _m_cP.SetDialogVariable('sb_team_name--' + teamName, clanName);
        _m_cP.SetDialogVariableInt(teamName + '_alive', living);
        _m_cP.SetDialogVariableInt(teamName + '_total', total);
        // team logo
        if (updateLogo) {
            const elLogoChildren = team.m_elLogoChildren;
            for (const elTeamLogoBackground of elLogoChildren) {
                elTeamLogoBackground.style.backgroundImage = `url("file://{images}${teamLogoImagePath}")`;
                elTeamLogoBackground.AddClass('sb-team-logo-bg');
            }
        }
    }
    function _UpdateTeams(oScoreData) {
        function TeamInfoForName(name, teamdata) {
            let info = defaultScoreTeamData;
            for (let td of teamdata) {
                if (td.team_name == name) {
                    info = td;
                    break;
                }
            }
            return info;
        }
        const teamdata = (oScoreData ? oScoreData.teamdata : []);
        // update team meta data
        for (const teamName in _m_oTeams) {
            const teamData = TeamInfoForName(teamName, teamdata);
            _UpdateTeamInfo(teamName, teamData);
            // score
            if (teamData) {
                _m_cP.SetDialogVariableInt('sb_team_score--' + teamName, teamData.score);
                if (teamData.score_1h !== undefined) {
                    _m_cP.SetDialogVariableInt('sb_team_score_2--' + teamName, teamData.score_1h);
                }
                if (teamData.score_2h !== undefined) {
                    _m_cP.SetDialogVariableInt('sb_team_score_3--' + teamName, teamData.score_2h);
                }
                let hideOt = true;
                if (teamData.score_ot !== undefined) {
                    hideOt = false;
                    _m_cP.SetDialogVariableInt('sb_team_score_ot--' + teamName, teamData.score_ot);
                }
                let elOTScore = _m_panelCache.m_elTimelineScoreOt;
                if (elOTScore) {
                    elOTScore.SetHasClass('hidden', hideOt);
                    elOTScore.SetHasClass('fade', hideOt);
                }
            }
        }
    }
    function _InitClassicTeams() {
        _UpdateTeamInfo('TERRORIST', defaultScoreTeamData);
        _UpdateTeamInfo('CT', defaultScoreTeamData);
    }
    let m_topScore = 0;
    let m_botScore = 0;
    function _UpdateAllRounds(oScoreData, jsoTime) {
        if (!jsoTime)
            return;
        if (!oScoreData)
            return;
        if (!_SupportsTimeline(jsoTime))
            return;
        let firstRound = jsoTime.first_round_this_period;
        let lastRound = jsoTime.last_round_this_period;
        m_topScore = 0;
        m_botScore = 0;
        // scores are measured for the current period so if we're in overtime, intialize it with half of the rounds leading into this OT
        if (jsoTime.overtime > 0) {
            m_topScore = (jsoTime.maxrounds + (jsoTime.overtime - 1) * jsoTime.maxrounds_overtime) / 2;
            m_botScore = (jsoTime.maxrounds + (jsoTime.overtime - 1) * jsoTime.maxrounds_overtime) / 2;
        }
        for (let rnd = firstRound; rnd <= lastRound; rnd++) {
            _UpdateRound(rnd, oScoreData, jsoTime);
        }
    }
    function _UpdateScore_Classic() {
        // we may be trying to update scores before players and teams have been initialized.
        if (Object.keys(_m_oTeams).length === 0) {
            _InitClassicTeams();
        }
        let oScoreData = MockAdapter.GetScoreDataJSO();
        let jsoTime = MockAdapter.GetTimeDataJSO();
        _UpdateTeams(oScoreData);
        // MATCH INFO
        if (!jsoTime)
            return;
        let currentRound = jsoTime.rounds_played + 1;
        _m_cP.SetDialogVariable('match_phase', $.Localize('#gamephase_' + jsoTime.gamephase));
        _m_cP.SetDialogVariableInt('rounds_remaining', jsoTime.rounds_remaining);
        _m_cP.SetDialogVariableInt('scoreboard_ot', jsoTime.overtime);
        _m_cP.SetHasClass('sb-tournament-match', MatchStatsAPI.IsTournamentMatch());
        // clear the timelines and remake them because first half round results need to swap positions.
        let bResetTimeline = false;
        if (_m_maxRounds != jsoTime.maxrounds_this_period) {
            bResetTimeline = true;
            _m_maxRounds = jsoTime.maxrounds_this_period;
        }
        if (_m_areTeamsSwapped !== MockAdapter.AreTeamsPlayingSwitchedSides()) {
            bResetTimeline = true;
            _m_areTeamsSwapped = MockAdapter.AreTeamsPlayingSwitchedSides();
        }
        if (!_SupportsTimeline(jsoTime)) {
            bResetTimeline = true;
        }
        if (_m_overtime != jsoTime.overtime) {
            _m_overtime = jsoTime.overtime;
            bResetTimeline = true;
        }
        // should we update the rounds?
        if (bResetTimeline || !(currentRound in _m_RoundUpdated)) {
            if (bResetTimeline) {
                let shouldUpdateRounds = false;
                _ResetTimeline(oScoreData, jsoTime, shouldUpdateRounds);
            }
            _UpdateAllRounds(oScoreData, jsoTime);
            _m_RoundUpdated[currentRound] = true;
        }
        else {
            if (oScoreData) {
                _UpdateRound(currentRound - 1, oScoreData, jsoTime);
            }
        }
        _UpdateRoundLossBonus(oScoreData.teamdata);
    }
    function _InsertTimelineDivider() {
        let elTimeline = _m_panelCache.m_elTimelineSegments;
        if (!elTimeline || !elTimeline.IsValid())
            return;
        let elDivider = $.CreatePanel('Panel', elTimeline, 'id-sb-timeline__divider');
        elDivider.AddClass('sb-timeline__divider');
    }
    function _InitTimelineSegment(startRound, endRound, phase) {
        let elTimeline = _m_panelCache.m_elTimelineSegments;
        if (!elTimeline || !elTimeline.IsValid())
            return;
        elTimeline.AddClass('sb-team-tint'); // we mark the entire timeline to be tinted whenever a team is applied
        let id = 'id-sb-timeline__segment--' + phase;
        let elSegment = elTimeline.FindChildTraverse(id);
        if (!elSegment || !elSegment.IsValid()) {
            elSegment = $.CreatePanel('Panel', elTimeline, id);
            elSegment.BLoadLayoutSnippet('snippet_scoreboard-classic__timeline__segment');
        }
        let elRoundContainer = elSegment.FindChildTraverse('id-sb-timeline__round-container');
        if (elRoundContainer && elRoundContainer.IsValid()) {
            // create the rounds
            for (let rnd = startRound; rnd <= endRound; rnd++) {
                const rndStr = rnd.toString();
                let elRnd = elSegment.FindChildTraverse(rndStr);
                if (!elRnd || !elRnd.IsValid()) {
                    elRnd = $.CreatePanel('Panel', elRoundContainer, rndStr);
                    elRnd.BLoadLayoutSnippet('snippet_scoreboard-classic__timeline__segment__round');
                    let elTop = elRnd.FindChildTraverse('id-sb-timeline__segment__round--top');
                    elTop.BLoadLayoutSnippet('snippet_scoreboard-classic__timeline__segment__round__data');
                    let elBot = elRnd.FindChildTraverse('id-sb-timeline__segment__round--bot');
                    elBot.BLoadLayoutSnippet('snippet_scoreboard-classic__timeline__segment__round__data');
                    // put larger gaps every 5 rounds
                    let elRndTickLabel = elRnd.FindChildTraverse('id-sb-timeline__segment__round__tick__label');
                    if (rnd % 5 == 0) {
                        elRndTickLabel.text = rndStr;
                    }
                    elTop.SetDialogVariable('sb_clinch', '');
                    elBot.SetDialogVariable('sb_clinch', '');
                    let elRndCache = elRnd;
                    elRndCache.m_elRndTop = elTop;
                    elRndCache.m_elRndBot = elBot;
                    elRndCache.m_elRndTop.m_elResult = elRndCache.m_elRndTop.FindChildTraverse('result');
                    elRndCache.m_elRndBot.m_elResult = elRndCache.m_elRndBot.FindChildTraverse('result');
                    _InitCasualties(elRndCache.m_elRndTop);
                    _InitCasualties(elRndCache.m_elRndBot);
                    function _InitCasualties(elRndSeg) {
                        elRndSeg.m_elCasualties = [];
                        elRndSeg.m_elCasualties.push(null);
                        for (let i = 1; i <= 5; i++) {
                            elRndSeg.m_elCasualties.push(elRndSeg.FindChildTraverse('casualty-' + i));
                        }
                    }
                    elRndCache.m_elRndTick = elRnd.FindChildTraverse('id-sb-timeline__segment__round__tick');
                    elRndCache.m_elRndTickLabel = elRndTickLabel;
                    _m_panelCache.m_elRounds[rnd] = elRndCache;
                }
            }
        }
        // flip first half score positions
        if (MockAdapter.AreTeamsPlayingSwitchedSides() !== MockAdapter.AreTeamsPlayingSwitchedSidesInRound(endRound)) {
            let elCTScore = elSegment.FindChildTraverse('id-sb-timeline__segment__score__ct');
            let elTScore = elSegment.FindChildTraverse('id-sb-timeline__segment__score__t');
            if (elCTScore && elCTScore.IsValid()) {
                elCTScore.RemoveClass('sb-color--CT');
                elCTScore.AddClass('sb-color--TERRORIST');
            }
            if (elTScore && elTScore.IsValid()) {
                elTScore.RemoveClass('sb-color--TERRORIST');
                elTScore.AddClass('sb-color--CT');
            }
        }
    }
    function _SupportsTimeline(jsoTime) {
        if (jsoTime == undefined)
            jsoTime = MockAdapter.GetTimeDataJSO();
        let roundCountToEvaluate = jsoTime.maxrounds_this_period;
        return (roundCountToEvaluate <= 30);
    }
    function _UpdateRoundLossBonus(teamdata) {
        let elRoundLossBonusMoney = _m_panelCache.m_elRoundLossBonus;
        if (elRoundLossBonusMoney && elRoundLossBonusMoney.IsValid()) {
            let hideRoundLossPanel = true;
            if (parseInt(GameInterfaceAPI.GetSettingString('mp_consecutive_loss_max')) > 0 &&
                parseInt(GameInterfaceAPI.GetSettingString('cash_team_loser_bonus_consecutive_rounds')) > 0) {
                let nLossT = -1;
                let nLossCT = -1;
                if (teamdata) {
                    for (const td of teamdata) {
                        if (td.team_name == 'TERRORIST') {
                            nLossT = td.next_round_loss_bonus;
                        }
                        else if (td.team_name == 'CT') {
                            nLossCT = td.next_round_loss_bonus;
                        }
                    }
                }
                else {
                    nLossT = MockAdapter.GetTeamNextRoundLossBonus('TERRORIST');
                    nLossCT = MockAdapter.GetTeamNextRoundLossBonus('CT');
                }
                if (nLossT >= 0 && nLossCT >= 0) {
                    hideRoundLossPanel = false;
                    for (let nClassIdx = 1; nClassIdx <= 4; ++nClassIdx) {
                        elRoundLossBonusMoney.SetHasClass('sb-timeline__round-loss-bonus-money__TERRORIST' + nClassIdx, nLossT >= nClassIdx);
                    }
                    for (let nClassIdx = 1; nClassIdx <= 4; ++nClassIdx) {
                        elRoundLossBonusMoney.SetHasClass('sb-timeline__round-loss-bonus-money__CT' + nClassIdx, nLossCT >= nClassIdx);
                    }
                }
            }
            if (hideRoundLossPanel) {
                elRoundLossBonusMoney.AddClass('hidden');
            }
            else {
                elRoundLossBonusMoney.RemoveClass('hidden');
            }
        }
    }
    function _ResetTimeline(oScoreData, jsoTime, updateRounds = true) {
        // When we reset timeline we should also update bonus
        _UpdateRoundLossBonus();
        let elTimeline = _m_panelCache.m_elTimelineSegments;
        if (!elTimeline || !elTimeline.IsValid())
            return;
        // clear the timeline
        elTimeline.RemoveAndDeleteChildren();
        if (!jsoTime)
            return;
        if (!_SupportsTimeline(jsoTime))
            return;
        // Show overtime rounds if we support them.
        let firstRound;
        let lastRound;
        let midRound;
        firstRound = jsoTime.first_round_this_period;
        lastRound = jsoTime.last_round_this_period;
        let elLabel = _m_panelCache.m_elTimelineRoundLabel;
        if (elLabel && elLabel.IsValid()) {
            elLabel.SetHasClass('hidden', jsoTime.overtime == 0);
        }
        midRound = firstRound + Math.ceil((lastRound - firstRound) / 2) - 1;
        _m_panelCache.m_elRounds = new Array(lastRound + 1).fill(null);
        if (MockAdapter.HasHalfTime()) {
            _InitTimelineSegment(firstRound, midRound, 'first-half');
            _InsertTimelineDivider();
            _InitTimelineSegment(midRound + 1, lastRound, 'second-half');
        }
        else // captures "casual"
         {
            _InitTimelineSegment(firstRound, lastRound, 'no-halves');
        }
        if (updateRounds) {
            _UpdateAllRounds(oScoreData, jsoTime);
        }
        if (GameInterfaceAPI.GetSettingString('cl_scoreboard_survivors_always_on') == '1')
            _ShowSurvivors();
    }
    function _UnborrowMusicKit() {
        GameInterfaceAPI.SetSettingString('cl_borrow_music_from_player_slot', '-1');
        let oLocalPlayer = _m_oPlayers.GetPlayerByXuid(GetLocalPlayerId());
        _UpdatePlayerStat(oLocalPlayer, 'musickit', false, true);
    }
    function UpdateCasterButtons() {
        for (let i = 0; i < 4; i++) {
            let buttonName = '#spec-button' + (i + 1);
            let bActive = true;
            switch (i) {
                default:
                case 0:
                    bActive = !!GetCasterIsCameraman();
                    break;
                case 1:
                    bActive = !!GetCasterIsHeard();
                    break;
                case 2:
                    bActive = !!GetCasterControlsXray();
                    break;
                case 3:
                    bActive = !!GetCasterControlsUI();
                    break;
            }
            ToggleCasterButtonActive(buttonName, bActive);
        }
    }
    function ToggleCasterButtonActive(buttonName, bActive) {
        let button = $(buttonName);
        if (button == null)
            return;
        if (bActive == false && button.BHasClass('sb-spectator-control-button-notactive') == false) {
            button.AddClass('sb-spectator-control-button-notactive');
        }
        else if (bActive == true && button.BHasClass('sb-spectator-control-button-notactive') == true) {
            button.RemoveClass('sb-spectator-control-button-notactive');
        }
    }
    function _ToggleSetCasterIsCameraman() {
        $.DispatchEvent('CSGOPlaySoundEffect', 'generic_button_press', 'MOUSE');
        let nCameraMan = parseInt(GameInterfaceAPI.GetSettingString('spec_autodirector_cameraman'));
        if (GetCasterIsCameraman()) {
            GameStateAPI.SetCasterIsCameraman(0);
        }
        else {
            GameStateAPI.SetCasterIsCameraman(nCameraMan);
        }
        UpdateCasterButtons();
    }
    function _ToggleSetCasterIsHeard() {
        $.DispatchEvent('CSGOPlaySoundEffect', 'generic_button_press', 'MOUSE');
        let nCameraMan = parseInt(GameInterfaceAPI.GetSettingString('spec_autodirector_cameraman'));
        if (GetCasterIsHeard()) {
            GameStateAPI.SetCasterIsHeard(0);
        }
        else {
            GameStateAPI.SetCasterIsHeard(nCameraMan);
        }
        UpdateCasterButtons();
    }
    function _ToggleSetCasterControlsXray() {
        $.DispatchEvent('CSGOPlaySoundEffect', 'generic_button_press', 'MOUSE');
        let nCameraMan = parseInt(GameInterfaceAPI.GetSettingString('spec_autodirector_cameraman'));
        if (GetCasterControlsXray()) {
            GameStateAPI.SetCasterControlsXray(0);
            ToggleCasterButtonActive('#spec-button3', false);
        }
        else {
            GameStateAPI.SetCasterControlsXray(nCameraMan);
            ToggleCasterButtonActive('#spec-button3', true);
        }
    }
    function _ToggleSetCasterControlsUI() {
        $.DispatchEvent('CSGOPlaySoundEffect', 'generic_button_press', 'MOUSE');
        let nCameraMan = parseInt(GameInterfaceAPI.GetSettingString('spec_autodirector_cameraman'));
        if (GetCasterControlsUI()) {
            GameStateAPI.SetCasterControlsUI(0);
        }
        else {
            GameStateAPI.SetCasterControlsUI(nCameraMan);
        }
        UpdateCasterButtons();
    }
    ////////////////////////////////////////////////
    function _CycleStats() {
        if (_m_dataSetGetCount === 0)
            return;
        {
            _m_dataSetCurrent++;
            if (_m_dataSetCurrent >= _m_dataSetGetCount)
                _m_dataSetCurrent = 0;
        }
        // Labels
        let elLabelSets = $('#id-sb-row__sets');
        let labelSetsChildren = elLabelSets.Children();
        for (let i = 0; i < labelSetsChildren.length; i++) {
            let elChild = labelSetsChildren[i];
            if (elChild.id == 'id-sb-labels-set-' + _m_dataSetCurrent) {
                elChild.RemoveClass('hidden');
            }
            else {
                elChild.AddClass('hidden');
            }
        }
        // Players
        for (let i = 0; i < _m_oPlayers.GetCount(); i++) {
            let elPlayer = _m_oPlayers.GetPlayerByIndex(i).m_elPlayer;
            if (elPlayer && elPlayer.IsValid()) {
                let elSetContainer = elPlayer.FindChildTraverse('id-sb-row__set-container');
                if (elSetContainer && elSetContainer.IsValid()) {
                    let containerChildren = elSetContainer.Children();
                    for (let j = 0; j < containerChildren.length; j++) {
                        let elChild = containerChildren[j];
                        if (elChild.id == 'id-sb-set-' + _m_dataSetCurrent) {
                            elChild.RemoveClass('hidden');
                        }
                        else {
                            elChild.AddClass('hidden');
                        }
                    }
                }
            }
        }
    }
    function _MuteVoice() {
        GameInterfaceAPI.ConsoleCommand('voice_modenable_toggle');
        $.Schedule(0.1, _UpdateMuteVoiceState);
    }
    function _UpdateMuteVoiceState() {
        let muteState = GameInterfaceAPI.GetSettingString('voice_modenable') === '1';
        let elMuteImage = _m_panelCache.m_elMuteImage;
        if (!elMuteImage)
            return;
        if (muteState) {
            elMuteImage.SetImage('file://{images}/icons/ui/unmuted.svg');
        }
        else {
            elMuteImage.SetImage('file://{images}/icons/ui/muted.svg');
        }
    }
    function _BlockUgc() {
        let ugcBlockState = GameInterfaceAPI.GetSettingString('cl_hide_avatar_images') !== '0' ||
            GameInterfaceAPI.GetSettingString('cl_sanitize_player_names') !== '0';
        if (ugcBlockState) {
            GameInterfaceAPI.SetSettingString('cl_sanitize_player_names', '0');
            GameInterfaceAPI.SetSettingString('cl_hide_avatar_images', '0');
        }
        else {
            GameInterfaceAPI.SetSettingString('cl_sanitize_player_names', '1');
            GameInterfaceAPI.SetSettingString('cl_hide_avatar_images', '2');
        }
        $.Schedule(0.1, _UpdateUgcState);
    }
    function _UpdateUgcState() {
        let ugcBlockState = GameInterfaceAPI.GetSettingString('cl_hide_avatar_images') !== '0' ||
            GameInterfaceAPI.GetSettingString('cl_sanitize_player_names') !== '0';
        let elBlockUgcImage = _m_panelCache.m_elBlockUgcImage;
        if (!elBlockUgcImage)
            return;
        if (ugcBlockState) {
            elBlockUgcImage.SetImage('file://{images}/icons/ui/votekick.svg');
        }
        else {
            elBlockUgcImage.SetImage('file://{images}/icons/ui/player.svg');
        }
    }
    function _CreateLabelsForRow(panel) {
        if (!panel || !panel.IsValid()) {
            return;
        }
        if (_m_bRowLabelsCreated) {
            return;
        }
        let dataStatChildren = panel.FindChildrenWithAttributeTraverse('data-stat');
        for (let i = 0; i < dataStatChildren.length; i++) {
            let el = dataStatChildren[i];
            if (el && el.IsValid()) {
                let stat = el.GetAttributeString('data-stat', '');
                let set = el.GetAttributeString('data-set', '');
                let isHidden = el.GetAttributeString('data-hidden', '');
                const noLabel = el.GetAttributeString('no-label', 'false');
                if (stat != '' && !(noLabel === 'true')) {
                    _CreateLabelForStat(stat, set, isHidden);
                }
            }
        }
        _m_bRowLabelsCreated = true;
    }
    function _GetSortOrderForMode(mode) {
        if (GameStateAPI.IsQueuedMatchmakingMode_Team())
            return sortOrder_tmm;
        switch (mode) {
            case 'deathmatch':
                if (GameInterfaceAPI.GetSettingString('mp_dm_teammode') !== '0') {
                    return sortOrder_default;
                }
                return sortOrder_dm;
            case 'competitive':
            case 'premier':
            case 'rush':
                return sortOrder_tmm;
            case 'gungameprogressive':
                return sortOrder_gg;
            default:
                return sortOrder_default;
        }
    }
    ////////////////////////////////////////////////
    function _Initialize() {
        _Reset();
        let jsoTime = MockAdapter.GetTimeDataJSO();
        if (!jsoTime) {
            return;
        }
        _LoadScoreboardTemplate();
        _m_bRowLabelsCreated = false;
        // set labels
        let temp = $.CreatePanel('Panel', _m_cP, 'temp');
        _Helper_LoadSnippet(temp, _GetPlayerRowForGameMode());
        temp.visible = false;
        _CreateLabelsForRow(temp);
        temp.DeleteAsync(.0);
        let oScoreData = MockAdapter.GetScoreDataJSO();
        _ResetTimeline(oScoreData, jsoTime);
        _m_bInit = true;
        // init these to blanks
        _m_cP.SetDialogVariable('server_name', '');
        _UpdateHLTVViewerNumber(0);
        _UpdateMatchInfo();
    }
    function _RankRevealAll() {
        for (let i = 0; i < _m_oPlayers.GetCount(); i++) {
            let oPlayer = _m_oPlayers.GetPlayerByIndex(i);
            _UpdatePlayerStat(oPlayer, 'skillgroup', false, true);
        }
    }
    function _UpdateScore() {
        switch (MockAdapter.GetGameModeInternalName(false)) {
            case 'competitive':
            case 'premier':
                _UpdateScore_Classic();
                break;
            case 'deathmatch':
                if (GameInterfaceAPI.GetSettingString('mp_dm_teammode') !== '0') {
                    _UpdateScore_Classic();
                }
                break;
            default:
            case 'casual':
                _UpdateScore_Classic();
                break;
        }
    }
    function _UpdateJob() {
        if (_m_bInit) {
            _UpdateMatchInfo();
            _UpdateScore();
            _UpdateNextPlayer();
        }
    }
    function _UpdateEverything(bInitialCreate = false) {
        if (!_m_bInit) {
            _Initialize();
        }
        _UpdateMuteVoiceState();
        _UpdateUgcState();
        if (bInitialCreate) {
            // Make sure we create the teams before updating any match and score info
            _UpdateAllPlayers(bInitialCreate);
        }
        else {
            _UpdateAllPlayers_delayed();
        }
        _UpdateMatchInfo();
        _UpdateScore();
        _UpdateSpectatorButtons();
    }
    ////////////////////////////////////////////////
    function _CloseScoreboard() {
        if (_m_updatePlayerHandler) {
            $.UnregisterForUnhandledEvent('Scoreboard_UpdatePlayerByPlayerSlot', _m_updatePlayerHandler);
            _m_updatePlayerHandler = null;
        }
        // close any open player cards:
        $.DispatchEvent('DismissAllContextMenus');
        UiToolkitAPI.HideTextTooltip();
        _UnregisterEvents();
    }
    ////////////////////////////////////////////////
    function _OpenScoreboard() {
        _UpdateEverything();
        _ShowSurvivors((GameInterfaceAPI.GetSettingString('cl_scoreboard_survivors_always_on') == '0'));
        if (!_m_updatePlayerHandler) {
            _m_updatePlayerHandler = $.RegisterForUnhandledEvent('Scoreboard_UpdatePlayerByPlayerSlot', _UpdatePlayerByPlayerSlot_delayed);
        }
        _RegisterEvents();
    }
    ////////////////////////////////////////////////
    function GetFreeForAllTopThreePlayers() {
        _UpdateEverything();
        if (!_m_cP)
            return [undefined, undefined, undefined];
        let elTeam = _m_cP.FindChildInLayoutFile('players-table-ANY');
        if (elTeam && elTeam.IsValid()) {
            const players = elTeam.Children();
            return [players[0]?.m_xuid || '0', players[1]?.m_xuid || '0', players[2]?.m_xuid || '0'];
        }
        return [undefined, undefined, undefined];
    }
    Scoreboard.GetFreeForAllTopThreePlayers = GetFreeForAllTopThreePlayers;
    //DEVONLY{
    //--------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------
    function _CreateBugReport() {
        let strReport = 'Sample\n';
        for (let i = 0; i < 10; i++) {
            strReport += 'Line' + i + '\n';
        }
        return strReport;
    }
    //}DEVONLY
    function GetCasterIsCameraman() {
        let nCameraMan = parseInt(GameInterfaceAPI.GetSettingString('spec_autodirector_cameraman'));
        let bQ = (MockAdapter.IsDemoOrHltv() && nCameraMan != 0 && MockAdapter.IsHLTVAutodirectorOn());
        return bQ;
    }
    function GetCasterIsHeard() {
        if (MockAdapter.IsDemoOrHltv()) {
            return !!parseInt(GameInterfaceAPI.GetSettingString('voice_caster_enable'));
        }
        return false;
    }
    function GetCasterControlsXray() {
        let bXRay = MockAdapter.IsDemoOrHltv() && parseInt(GameInterfaceAPI.GetSettingString('spec_cameraman_xray'));
        return bXRay;
    }
    function GetCasterControlsUI() {
        let bSpecCameraMan = parseInt(GameInterfaceAPI.GetSettingString('spec_cameraman_ui'));
        let bQ = (MockAdapter.IsDemoOrHltv() && bSpecCameraMan);
        return bQ;
    }
    function _ApplyPlayerCrosshairCode(panel, xuid) {
        UiToolkitAPI.ShowGenericPopupYesNo($.Localize('#tooltip_copycrosshair'), $.Localize('#GameUI_Xhair_Copy_Code_Confirm'), '', () => { let code = GameStateAPI.GetCrosshairCode(xuid); MyPersonaAPI.BApplyCrosshairCode(code); }, () => { });
    }
    const events = [
        ['Scoreboard_UnborrowMusicKit', _UnborrowMusicKit],
        ['Scoreboard_Casualties_OnMouseOver', _Casualties_OnMouseOver],
        ['Scoreboard_Casualties_OnMouseOut', _Casualties_OnMouseOut],
        ['Scoreboard_RoundLossBonusMoney_OnMouseOver_CT', _RoundLossBonusMoney_OnMouseOver_CT],
        ['Scoreboard_RoundLossBonusMoney_OnMouseOut_CT', _RoundLossBonusMoney_OnMouseOut_CT],
        ['Scoreboard_RoundLossBonusMoney_OnMouseOver_TERRORIST', _RoundLossBonusMoney_OnMouseOver_TERRORIST],
        ['Scoreboard_RoundLossBonusMoney_OnMouseOut_TERRORIST', _RoundLossBonusMoney_OnMouseOut_TERRORIST],
        ['Scoreboard_MuteVoice', _MuteVoice],
        ['Scoreboard_BlockUgc', _BlockUgc],
        ['Scoreboard_ApplyPlayerCrosshairCode', _ApplyPlayerCrosshairCode]
    ];
    let eventHandles = [];
    function _RegisterEvents() {
        const msg = $.GetContextPanel().id + ' registering ';
        events.forEach(function (arrEvent, idx) {
            eventHandles[idx] = $.RegisterForUnhandledEvent(arrEvent[0], arrEvent[1]);
            $.Msg(msg + arrEvent[0]);
        });
    }
    function _UnregisterEvents() {
        const msg = $.GetContextPanel().id + ' unregistering ';
        events.forEach(function (arrEvent, idx) {
            $.UnregisterForUnhandledEvent(arrEvent[0], eventHandles[idx]);
            $.Msg(msg + arrEvent[0]);
        });
    }
    function _LoadScoreboardTemplate() {
        let scoreboardTemplate;
        let mode = MockAdapter.GetGameModeInternalName(false);
        let skirmish = MockAdapter.GetGameModeInternalName(true);
        // We want to differentiate the deathmatch modes but aren't sure this needs to be done outside of this scope. Do it here.
        if (mode == 'deathmatch') {
            // FFA
            if (GameInterfaceAPI.GetSettingString('mp_teammates_are_enemies') !== '0') {
                skirmish = 'ffadm';
            }
            else if (GameInterfaceAPI.GetSettingString('mp_dm_teammode') !== '0') {
                skirmish = 'teamdm';
            }
        }
        switch (mode.toLowerCase()) {
            case 'premier':
            case 'competitive':
            case 'scrimcomp2v2':
                scoreboardTemplate = 'snippet_scoreboard-classic--with-timeline--half-times';
                break;
            case 'deathmatch':
                if (skirmish == 'teamdm') {
                    scoreboardTemplate = 'snippet_scoreboard-classic--no-timeline';
                }
                else {
                    scoreboardTemplate = 'snippet_scoreboard--no-teams';
                }
                break;
            case 'gungameprogressive':
            case 'training':
                scoreboardTemplate = 'snippet_scoreboard--no-teams';
                break;
            case 'cooperative':
                scoreboardTemplate = 'snippet_scoreboard--cooperative';
                break;
            case 'coopmission':
                scoreboardTemplate = 'snippet_scoreboard--coopmission';
                break;
            case 'casual':
                scoreboardTemplate = 'snippet_scoreboard-classic--no-timeline';
                break;
            case 'rush':
                scoreboardTemplate = 'snippet_scoreboard-classic--with-timeline--no-half-times';
                break;
            default:
                scoreboardTemplate = 'snippet_scoreboard-classic--no-timeline';
                break;
        }
        _m_panelCache.ClearAll();
        _Helper_LoadSnippet(_m_cP, scoreboardTemplate);
        _m_panelCache.CacheScoreboard(_m_cP);
        // add a class to the root based on server conditions so we style appropriately
        //
        //
        if (MockAdapter.IsDemoOrHltv())
            _m_cP.AddClass('IsDemoOrHltv');
        if (MatchStatsAPI.IsTournamentMatch())
            _m_cP.AddClass('IsTournamentMatch');
        // choose a mode-appropriate sorting order
        _m_sortOrder = _GetSortOrderForMode(mode);
    }
    function _CreateAndInitializeFunc() {
        _Reset();
        let jsoTime = MockAdapter.GetTimeDataJSO();
        if (!jsoTime) {
            return;
        }
        let loadedScoreboardTemplate = _LoadScoreboardTemplate();
        _m_bRowLabelsCreated = false;
        // make sure _m_bInit is set before calling _UpdateEverything!
        _m_bInit = true;
        const bInitialCreate = true;
        _UpdateEverything(bInitialCreate);
        if (!_m_bRowLabelsCreated) {
            let temp = $.CreatePanel('Panel', _m_cP, 'temp');
            _Helper_LoadSnippet(temp, _GetPlayerRowForGameMode());
            temp.visible = false;
            _CreateLabelsForRow(temp);
            temp.DeleteAsync(.0);
        }
        // init these to blanks
        _m_cP.SetDialogVariable('server_name', '');
        _UpdateHLTVViewerNumber(0);
        // close any open player cards:
        $.DispatchEvent('DismissAllContextMenus');
        UiToolkitAPI.HideTextTooltip();
    }
    function _CreateAndInitialize(bImmediately = false) {
        if (bImmediately) {
            // NOTE: This case is only used for panel reload where we need to make sure
            // the scoreboard is created and initialized immediately esp in a case where
            // the scoreboard is open and the _UpdateJob() is registered and running
            // which expects a correctly initialized scoreboard.
            _CreateAndInitializeFunc();
        }
        else {
            // NOTE: ok we schedule the actual creation to be executed later in the frame. We need to wait for certain events to be handled
            // e.g. C_BaseEntity::OnFlagsChanged() since we won't get correct xuids for the players/bots before those are handled meaning
            // we would not be able to create the panels and then trigger creating them upon first opening the scoreboard...
            $.Schedule(0.01, _CreateAndInitializeFunc);
        }
    }
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        _m_oAllUpdateStatNames = [];
        _InitializeStatUpdateFuncs();
        $.Msg("Scoreboard: Registering events for " + $.GetContextPanel().GetParent().id);
        // specific to this scoreboard panel (Hud or Pause Menu)
        $.RegisterEventHandler('OnOpenScoreboard', $.GetContextPanel(), _OpenScoreboard);
        $.RegisterEventHandler('OnCloseScoreboard', $.GetContextPanel(), _CloseScoreboard);
        $.RegisterEventHandler('Scoreboard_UpdateJob', $.GetContextPanel(), _UpdateJob);
        $.RegisterEventHandler('Scoreboard_ResetAndInit', $.GetContextPanel(), _Initialize);
        $.RegisterEventHandler('Scoreboard_CreateAndInit', $.GetContextPanel(), _CreateAndInitialize);
        // events that all scoreboards should listen to.
        $.RegisterForUnhandledEvent('GameState_OnLevelLoad', _Initialize);
        $.RegisterForUnhandledEvent('Scoreboard_CycleStats', _CycleStats);
        $.RegisterForUnhandledEvent('Scoreboard_ToggleSetCasterIsCameraman', _ToggleSetCasterIsCameraman);
        $.RegisterForUnhandledEvent('Scoreboard_ToggleSetCasterIsHeard', _ToggleSetCasterIsHeard);
        $.RegisterForUnhandledEvent('Scoreboard_ToggleSetCasterControlsXray', _ToggleSetCasterControlsXray);
        $.RegisterForUnhandledEvent('Scoreboard_ToggleSetCasterControlsUI', _ToggleSetCasterControlsUI);
        $.RegisterForUnhandledEvent('GameState_RankRevealAll', _RankRevealAll);
        $.RegisterForUnhandledEvent('Scoreboard_UpdateHLTVViewers', _UpdateHLTVViewerNumber);
    }
    //DEVONLY{
    // $.RegisterForUnhandledEvent( 'Scoreboard_Debug_Sort', _ToggleSortOrderAndResort );
    //}DEVONLY
})(Scoreboard || (Scoreboard = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NvcmVib2FyZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3Njb3JlYm9hcmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUNsQyx3Q0FBd0M7QUFDeEMsc0RBQXNEO0FBQ3RELDZDQUE2QztBQUM3Qyx5Q0FBeUM7QUFDekMsd0NBQXdDO0FBQ3hDLGlFQUFpRTtBQUdqRTs7Ozs7Ozs7Ozs7Ozs7Ozs7RUFpQkU7QUFFRixJQUFVLFVBQVUsQ0E4NUhuQjtBQTk1SEQsV0FBVSxVQUFVO0lBNEJuQixNQUFNLEtBQUssR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFzQixDQUFDO0lBMkJ0RCxNQUFNLFlBQVk7UUFFakIsc0JBQXNCO1FBQ3RCLHNCQUFzQixHQUFtQixJQUFJLENBQUM7UUFDOUMsbUJBQW1CLEdBQW1CLElBQUksQ0FBQztRQUMzQyxvQkFBb0IsR0FBbUIsSUFBSSxDQUFDO1FBQzVDLHFCQUFxQixHQUFtQixJQUFJLENBQUM7UUFFN0MsNkJBQTZCO1FBQzdCLG1CQUFtQixHQUFtQixJQUFJLENBQUM7UUFDM0MsZ0JBQWdCLEdBQTRCLElBQUksQ0FBQztRQUNqRCxpQkFBaUIsR0FBbUIsSUFBSSxDQUFDO1FBQ3pDLG9CQUFvQixHQUFtQixJQUFJLENBQUM7UUFDNUMsa0JBQWtCLEdBQW1CLElBQUksQ0FBQztRQUMxQyxhQUFhLEdBQW1CLElBQUksQ0FBQztRQUNyQyxpQkFBaUIsR0FBbUIsSUFBSSxDQUFDO1FBRXpDLG1CQUFtQjtRQUNuQixVQUFVLEdBQTRCLEVBQUUsQ0FBQztRQUN6QyxlQUFlLEdBQW1CLElBQUksQ0FBQztRQUN2QyxlQUFlLEdBQW1CLElBQUksQ0FBQztRQUN2QyxXQUFXLEdBQW1CLElBQUksQ0FBQztRQUNuQyxZQUFZLEdBQW1CLElBQUksQ0FBQztRQUVwQyxhQUFhLEdBQTZDLEVBQUUsQ0FBQztRQUU3RCxRQUFRO1lB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