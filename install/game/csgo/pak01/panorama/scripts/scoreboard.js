"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="mock_adapter.ts" />
/// <reference path="common/gamerules_constants.ts" />
/// <reference path="common/formattext.ts" />
/// <reference path="rating_emblem.ts" />
/// <reference path="match_stakes.ts" />
/// <reference path="context_menus/context_menu_playercard.ts" />
var Scoreboard;
(function (Scoreboard) {
    const _m_cP = $.GetContextPanel();
    class PanelCache_t {
        m_elTimelineRoundLabel = null;
        m_elTimelineScoreOt = null;
        m_elMusicKitUnborrow = null;
        m_elMetaLabelsModeMap = null;
        m_elPlayersTableAny = null;
        m_elMouseBinding = null;
        m_elFooterWebsite = null;
        m_elTimelineSegments = null;
        m_elRoundLossBonus = null;
        m_elMuteImage = null;
        m_elBlockUgcImage = null;
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
    let _m_LocalPlayerID = '';
    function GetLocalPlayerId() {
        if (_m_LocalPlayerID === '')
            _m_LocalPlayerID = GameStateAPI.GetLocalPlayerXuid();
        return _m_LocalPlayerID;
    }
    const _commendNames = ['leader', 'teacher', 'friendly'];
    const _statNames = ['teamname', 'dc', 'score', 'risc', 'mvps', 'kills', 'assists', 'deaths', 'rank', 'idx', 'damage', 'avgrisc', 'money', 'hsp', 'kdr', 'adr', 'utilitydamage', 'enemiesflashed', 'musickit', 'skillgroup', 'ping', '3k', '4k', '5k', 'status', 'name', 'flair', 'avatar', 'gglevel', 'knifekills', 'taserkills', 'honoricon', ..._commendNames];
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
        m_elPlayer = undefined;
        m_elTeam = undefined;
        m_oStats = {};
        m_oElStats = {};
        m_isMuted = false;
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
    let _m_updatePlayerIndex = 0;
    let _m_oTeams = {};
    let _m_arrSortingPausedRefGetCounter = 0;
    let _m_hDenyInputToGame = null;
    let _m_dataSetCurrent = 0;
    let _m_dataSetGetCount = 0;
    let _m_areTeamsSwapped = false;
    let _m_maxRounds = 0;
    let _m_oPlayers;
    let _m_RoundUpdated = {};
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
        'assists': 0,
        'deaths': -1,
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
        'assists': 0,
        'deaths': -1,
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
        'score': 0,
        'avgrisc': 0,
        'money': 0,
        'hsp': 0,
        'kdr': 0,
        'adr': 0,
        'utilitydamage': 0,
        'enemiesflashed': 0,
    };
    let _m_sortOrder = sortOrder_default;
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
    }
    function _Helper_LoadSnippet(element, snippet) {
        if (element && !element.m_bSnippetLoaded) {
            element.BLoadLayoutSnippet(snippet);
            element.m_bSnippetLoaded = true;
        }
    }
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
            if (!oPlayer) {
                let oNewPlayer = _m_oPlayers.AddPlayer(xuid);
                _NewPlayerPanel(oNewPlayer);
                oNewPlayer.UpdateAndSort(_m_oUpdateStatNames, true);
                highlightSortStatLabel = true;
            }
            else if (oPlayer.m_oStats['teamname'] != teamName) {
                _ChangeTeams(oPlayer, teamName);
            }
        }
        if (highlightSortStatLabel) {
            let sortOrder = Object.keys(_m_sortOrder)[1];
            _HighlightSortStatLabel(sortOrder);
        }
    }
    function _ChangeTeams(oPlayer, newTeamName) {
        if (oPlayer.m_oStats['teamname'] == newTeamName)
            return false;
        let xuid = oPlayer.m_xuid;
        let oldTeam = oPlayer.m_oStats['teamname'];
        let elPlayer = oPlayer.m_elPlayer;
        oPlayer.m_oStats['teamname'] = newTeamName;
        if (oldTeam in _m_oTeams) {
            _m_oTeams[oldTeam].DeletePlayerFromCommendsLeaderboards(xuid);
        }
        if (newTeamName in _m_oTeams) {
            oPlayer.m_team = _m_oTeams[newTeamName];
        }
        else {
            oPlayer.m_team = undefined;
        }
        oPlayer.m_oStats['leader'] = -1;
        oPlayer.m_oStats['teacher'] = -1;
        oPlayer.m_oStats['friendly'] = -1;
        if (!elPlayer || !elPlayer.IsValid())
            return true;
        if (oldTeam)
            elPlayer.RemoveClass('sb-team--' + oldTeam);
        elPlayer.AddClass('sb-team--' + newTeamName);
        if (IsTeamASpecTeam(newTeamName) && MatchStatsAPI.IsTournamentMatch()) {
            elPlayer.AddClass('hidden');
            return true;
        }
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
    function _UpdateAllPlayers(bInitialCreate = false) {
        if (!_m_bInit)
            return;
        const bSilent = true;
        const oPlayerData = GameStateAPI.GetPlayerDataJSO();
        _m_oPlayers.DeleteMissingPlayers(oPlayerData);
        _PopulatePlayerList(oPlayerData);
        _m_updatePlayerIndex = 0;
        if (!bInitialCreate) {
            for (let i = 0; i < _m_oPlayers.GetCount(); i++) {
                let elPlayer = _m_oPlayers.GetPlayerByIndex(i).m_elPlayer;
                if (elPlayer && elPlayer.IsValid())
                    elPlayer.RemoveClass('sb-row--transition');
            }
            for (let i = 0; i < _m_oPlayers.GetCount(); i++) {
                _UpdatePlayer(i, bSilent);
            }
            for (let i = 0; i < _m_oPlayers.GetCount(); i++) {
                let elPlayer = _m_oPlayers.GetPlayerByIndex(i).m_elPlayer;
                if (elPlayer && elPlayer.IsValid())
                    elPlayer.AddClass('sb-row--transition');
            }
        }
    }
    function _Pulse(el) {
        el.RemoveClass('sb-pulse-highlight');
        el.AddClass('sb-pulse-highlight');
    }
    function _UpdatePlayerByPlayerSlot(slot) {
        let index = _m_oPlayers.GetPlayerIndexByPlayerSlot(slot);
        _UpdatePlayer(index, true);
    }
    function _UpdatePlayerByPlayerSlot_delayed(slot) {
        $.Schedule(0.01, () => _UpdatePlayerByPlayerSlot(slot));
    }
    function _UpdatePlayer(idx, bSilent = false) {
        let oPlayer = _m_oPlayers.GetPlayerByIndex(idx);
        if (!oPlayer)
            return;
        bSilent = bSilent && _m_cP.visible;
        oPlayer.UpdateAndSort(_m_oUpdateStatNames, bSilent);
    }
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
            if (oPlayer.m_xuid === children[i].m_xuid)
                continue;
            let oCompareTargetPlayer = _m_oPlayers.GetPlayerByXuid(children[i].m_xuid);
            if (!oCompareTargetPlayer)
                continue;
            for (let stat in _m_sortOrder) {
                let p1stat = oPlayer.m_oStats[stat];
                let p2stat = oCompareTargetPlayer.m_oStats[stat];
                if (_m_sortOrder[stat] === -1) {
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
    function _UpdateAllStatsForPlayer(oPlayer, oUpdateStatNames, bSilent = false) {
        const bIsUpdatingAllStats = true;
        for (let stat of oUpdateStatNames) {
            _UpdatePlayerStat(oPlayer, stat, bIsUpdatingAllStats, bSilent);
        }
    }
    function _GenericUpdateStat(oPlayer, stat, fnGetStat, bSilent = false) {
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
                        if (isLocalPlayer) {
                            let elMusicKit = _m_panelCache.m_elMusicKit;
                            if (!elMusicKit || !elMusicKit.IsValid())
                                return;
                            let isValidMusicKit = newStatValue > 0;
                            elMusicKit.SetHasClass('hidden', !isValidMusicKit);
                            if (isValidMusicKit) {
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
                        _UpdateAllStatsForPlayer(oPlayer, _m_oUpdateStatNames, true);
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
                    elLabel.SetHasClass('sb-row__cell--ping__label--bot', !!szCustomLabel);
                    if (szCustomLabel) {
                        elLabel.text = $.Localize(szCustomLabel);
                        oPlayer.m_oStats[stat] = szCustomLabel;
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
                        let kdrFn = _GetMatchStatFn('kdr');
                        kdr = kdrFn(oPlayer.m_xuid);
                        if (typeof kdr == 'number' && kdr > 0) {
                            kdr = kdr / 100.0;
                        }
                    }
                    else {
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
                        let elMVPStarImage = elMVPPanel.FindChildTraverse('star-image');
                        if (!elMVPStarImage || !elMVPStarImage.IsValid())
                            return;
                        let elMVPStarNumberLabel = elMVPPanel.FindChildTraverse('star-count');
                        if (!elMVPStarNumberLabel || !elMVPStarNumberLabel.IsValid())
                            return;
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
                    let newStatValue = oPlayer.GetGameStat('status');
                    if (newStatValue !== oPlayer.m_oStats[stat]) {
                        oPlayer.m_oStats[stat] = newStatValue;
                        let elPlayer = oPlayer.m_elPlayer;
                        if (!elPlayer || !elPlayer.IsValid())
                            return;
                        elPlayer.SetHasClass('sb-player-status-dead', newStatValue === 1);
                        elPlayer.SetHasClass('sb-player-status-disconnected', newStatValue === 15);
                        oPlayer.m_oStats['dc'] = newStatValue === 15 ? 0 : 1;
                        let elPanel = oPlayer.m_oElStats[stat];
                        if (!elPanel || !elPanel.IsValid())
                            return;
                        let elStatusImage = elPanel.m_elImage;
                        if (!elStatusImage || !elStatusImage.IsValid())
                            return;
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
                    let elPanel = oPlayer.m_oElStats[stat];
                    if (!elPanel || !elPanel.IsValid())
                        return;
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
                    if (oPlayer.m_oStats[stat] != newStatValue) {
                        oPlayer.m_oStats[stat] = newStatValue;
                        if (oPlayer.m_team)
                            oPlayer.m_team.UpdateCommendForPlayer(oPlayer.m_xuid, stat, newStatValue);
                    }
                }
                break;
            case 'flair':
                {
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
                    let elAvatarImage = elPanel.m_elImage;
                    if (!elAvatarImage || !elAvatarImage.IsValid())
                        return;
                    const slot = oPlayer.GetGameStat('slot');
                    if (slot >= 0) {
                        elAvatarImage.PopulateFromPlayerSlot(slot);
                    }
                    const team = oPlayer.m_team?.m_teamName || '';
                    elAvatarImage.SwitchClass('teamstyle', 'team--' + team);
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
        if (set !== '') {
            let labelSetContainerId = 'id-sb-row__set-container';
            let elLabelSetContainer = $('#' + labelSetContainerId);
            if (!elLabelSetContainer || !elLabelSetContainer.IsValid()) {
                elLabelSetContainer = $.CreatePanel('Panel', elLabelRow, labelSetContainerId);
                elLabelSetContainer.BLoadLayoutSnippet('snippet_sb-label-set-container');
                if ($('#id-sb-row__set-container')) {
                    $('#id-sb-meta__cycle').RemoveClass('hidden');
                }
            }
            let elSetLabels = elLabelSetContainer.FindChildTraverse('id-sb-row__sets');
            let LabelSetId = 'id-sb-labels-set-' + set;
            let elLabelSet = elSetLabels.FindChildTraverse(LabelSetId);
            let elLabelSetClasses = [];
            if (!elLabelSet || !elLabelSet.IsValid()) {
                _m_dataSetGetCount++;
                elLabelSet = $.CreatePanel('Panel', elSetLabels, LabelSetId);
                elLabelSetClasses.push('sb-row__set', 'no-hover');
            }
            elLabelRowOrSet = elLabelSet;
            if (set != _m_dataSetCurrent.toString()) {
                elLabelSetClasses.push('hidden');
            }
            if (elLabelSetClasses.length > 0) {
                elLabelSet.AddClasses(elLabelSetClasses);
            }
        }
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
            let toolTipString = $.Localize('#Scoreboard_' + stat + '_tooltip');
            if (toolTipString !== '') {
                elStatLabel.SetPanelEvent('onmouseover', () => UiToolkitAPI.ShowTextTooltip(elStatLabel.id, toolTipString));
                elStatLabel.SetPanelEvent('onmouseout', () => UiToolkitAPI.HideTextTooltip());
            }
            elStatPanel.SetPanelEvent('onactivate', () => {
                let newSortOrder = { 'dc': 0 };
                let modeDefaultSortOrder = _GetSortOrderForMode(MockAdapter.GetGameModeInternalName(false));
                if (stat in modeDefaultSortOrder)
                    newSortOrder[stat] = modeDefaultSortOrder[stat];
                else
                    return;
                _HighlightSortStatLabel(stat);
                for (let s in modeDefaultSortOrder) {
                    if (s == stat)
                        continue;
                    if (s == 'dc')
                        continue;
                    newSortOrder[s] = modeDefaultSortOrder[s];
                }
                _m_sortOrder = newSortOrder;
                for (let i = 0; i < _m_oPlayers.GetCount(); i++) {
                    let oPlayer = _m_oPlayers.GetPlayerByIndex(i);
                    _SortPlayer(oPlayer);
                }
            });
        }
    }
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
                if (!oPlayer.m_oElStats.hasOwnProperty(entry.name))
                    continue;
                const elContextMenuBtns = oPlayer.m_oElStats[entry.name];
                if ('xml' in entry) {
                    let elEntryBtn = $.CreatePanel('Panel', elContextMenuBtns, entry.name, {
                        class: 'cell__button',
                        style: 'tooltip-position: bottom;'
                    });
                    elEntryBtn.BLoadLayout(entry.xml, false, false);
                }
                else {
                    let elEntryBtn = $.CreatePanel('Button', elContextMenuBtns, entry.name + '_' + xuid, {
                        class: 'cell__button',
                        style: 'tooltip-position: bottom;'
                    });
                    $.CreatePanel('Image', elEntryBtn, entry.name, { src: 'file://{images}/icons/ui/' + entry.icon + '.svg' });
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
                    {
                        elEntryBtn.SetPanelEvent('onmouseover', () => UiToolkitAPI.ShowTextTooltip(elEntryBtn.id, tooltip));
                        elEntryBtn.SetPanelEvent('onmouseout', () => UiToolkitAPI.HideTextTooltip());
                    }
                }
            }
        }
    }
    function _NewPlayerPanel(oPlayer) {
        if (!oPlayer.m_elTeam || !oPlayer.m_elTeam.IsValid())
            return;
        oPlayer.m_elPlayer = $.CreatePanel('Panel', oPlayer.m_elTeam, 'player-' + oPlayer.m_xuid);
        oPlayer.m_elPlayer.m_xuid = oPlayer.m_xuid;
        _Helper_LoadSnippet(oPlayer.m_elPlayer, _GetPlayerRowForGameMode());
        _CreateLabelsForRow(oPlayer.m_elPlayer);
        oPlayer.m_elPlayer.m_elSkillGroup = oPlayer.m_elPlayer.FindChildTraverse('jsRatingEmblem');
        {
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
            let children = elStatCell.Children();
            for (let i = 0; i < children.length; i++) {
                _InitStatCell(children[i], oPlayer);
            }
            if (stat === '') {
                return;
            }
            oPlayer.m_oElStats[stat] = elStatCell;
            if (oPlayer.m_oElStats[stat]) {
                let elLabel = oPlayer.m_oElStats[stat].FindChildTraverse('label');
                oPlayer.m_oElStats[stat].m_elLabel = elLabel;
                let elImg = oPlayer.m_oElStats[stat].FindChildTraverse('image');
                oPlayer.m_oElStats[stat].m_elImage = elImg;
            }
            let elStatCellClasses = ['sb-row__cell', 'sb-row__cell--' + stat];
            const set = elStatCell.GetAttributeString('data-set', '');
            if (set !== '') {
                let SetContainerId = 'id-sb-row__set-container';
                let elParent = elStatCell.GetParent();
                let elSetContainer = oPlayer.m_elPlayer.FindChildTraverse(SetContainerId);
                if (!elSetContainer || !elSetContainer.IsValid()) {
                    elSetContainer = $.CreatePanel('Panel', elParent, SetContainerId);
                    elParent.MoveChildAfter(elSetContainer, elStatCell);
                }
                let setId = 'id-sb-set-' + set;
                let elSetClasses = [];
                let elSet = elSetContainer.FindChildTraverse(setId);
                if (!elSet || !elSet.IsValid) {
                    elSet = $.CreatePanel('Panel', elSetContainer, setId);
                    elSetClasses.push('sb-row__set', 'no-hover');
                    idx = 0;
                }
                elStatCell.SetParent(elSet);
                if (set != _m_dataSetCurrent.toString()) {
                    elSetClasses.push('hidden');
                }
                if (elSetClasses.length > 0) {
                    elSet.AddClasses(elSetClasses);
                }
            }
            if (idx++ % 2)
                elStatCellClasses.push('sb-row__cell--dark');
            elStatCell.AddClasses(elStatCellClasses);
            const isHidden = elStatCell.GetAttributeString('data-hidden', '');
            if (!isHidden) {
                _RegisterStatUpdate(stat);
            }
        }
        const elStatCells = oPlayer.m_elPlayer.Children();
        for (let i = 0; i < elStatCells.length; i++) {
            _InitStatCell(elStatCells[i], oPlayer);
        }
        _CreatePlayerButtons(oPlayer);
        oPlayer.m_oStats = {};
        oPlayer.m_oStats['idx'] = GameStateAPI.GetPlayerSlot(oPlayer.m_xuid);
        oPlayer.m_elPlayer.SetPanelEvent('onmouseover', () => { _m_arrSortingPausedRefGetCounter++; });
        oPlayer.m_elPlayer.SetPanelEvent('onmouseout', () => { _m_arrSortingPausedRefGetCounter--; });
        if (MockAdapter.IsXuidValid(oPlayer.m_xuid)) {
            oPlayer.m_elPlayer.SetPanelEvent('onactivate', () => {
                _m_arrSortingPausedRefGetCounter++;
                let elPlayerCardContextMenu = UiToolkitAPI.ShowCustomLayoutContextMenuParametersDismissEventSetFocus('', '', 'file://{resources}/layout/context_menus/context_menu_playercard.xml', 'xuid=' + oPlayer.m_xuid, _OnPlayerCardDismiss, false);
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
        elRndTop.AddClass('sb-team--CT');
        elRndBot.AddClass('sb-team--TERRORIST');
        const roundData = oScoreData.rounddata[rnd];
        if (typeof roundData !== 'object') {
            return;
        }
        let result = roundData.result;
        if (result.charAt(0) === 'c') {
            if (bFlippedSides)
                m_botScore++;
            else
                m_topScore++;
            if ((result.charAt(1) === 't') && (result.charAt(2) === '_')) {
                result = result.substring(3);
            }
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
        if (GameInterfaceAPI.GetSettingString('cl_scoreboard_survivors_always_on') == '0') {
            _ShowSurvivors();
        }
    }
    function _Casualties_OnMouseOut() {
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
        _m_cP.SetDialogVariable('sb_team_name--' + teamName, clanName);
        _m_cP.SetDialogVariableInt(teamName + '_alive', living);
        _m_cP.SetDialogVariableInt(teamName + '_total', total);
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
        for (const teamName in _m_oTeams) {
            const teamData = TeamInfoForName(teamName, teamdata);
            _UpdateTeamInfo(teamName, teamData);
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
        if (jsoTime.overtime > 0) {
            m_topScore = (jsoTime.maxrounds + (jsoTime.overtime - 1) * jsoTime.maxrounds_overtime) / 2;
            m_botScore = (jsoTime.maxrounds + (jsoTime.overtime - 1) * jsoTime.maxrounds_overtime) / 2;
        }
        for (let rnd = firstRound; rnd <= lastRound; rnd++) {
            _UpdateRound(rnd, oScoreData, jsoTime);
        }
    }
    function _UpdateScore_Classic() {
        if (Object.keys(_m_oTeams).length === 0) {
            _InitClassicTeams();
        }
        let oScoreData = MockAdapter.GetScoreDataJSO();
        let jsoTime = MockAdapter.GetTimeDataJSO();
        _UpdateTeams(oScoreData);
        if (!jsoTime)
            return;
        let currentRound = jsoTime.rounds_played + 1;
        _m_cP.SetDialogVariable('match_phase', $.Localize('#gamephase_' + jsoTime.gamephase));
        _m_cP.SetDialogVariableInt('rounds_remaining', jsoTime.rounds_remaining);
        _m_cP.SetDialogVariableInt('scoreboard_ot', jsoTime.overtime);
        _m_cP.SetHasClass('sb-tournament-match', MatchStatsAPI.IsTournamentMatch());
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
        elTimeline.AddClass('sb-team-tint');
        let id = 'id-sb-timeline__segment--' + phase;
        let elSegment = elTimeline.FindChildTraverse(id);
        if (!elSegment || !elSegment.IsValid()) {
            elSegment = $.CreatePanel('Panel', elTimeline, id);
            elSegment.BLoadLayoutSnippet('snippet_scoreboard-classic__timeline__segment');
        }
        let elRoundContainer = elSegment.FindChildTraverse('id-sb-timeline__round-container');
        if (elRoundContainer && elRoundContainer.IsValid()) {
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
        _UpdateRoundLossBonus();
        let elTimeline = _m_panelCache.m_elTimelineSegments;
        if (!elTimeline || !elTimeline.IsValid())
            return;
        elTimeline.RemoveAndDeleteChildren();
        if (!jsoTime)
            return;
        if (!_SupportsTimeline(jsoTime))
            return;
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
        else {
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
    function _CycleStats() {
        if (_m_dataSetGetCount === 0)
            return;
        {
            _m_dataSetCurrent++;
            if (_m_dataSetCurrent >= _m_dataSetGetCount)
                _m_dataSetCurrent = 0;
        }
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
    function _Initialize() {
        _Reset();
        let jsoTime = MockAdapter.GetTimeDataJSO();
        if (!jsoTime) {
            return;
        }
        _LoadScoreboardTemplate();
        _m_bRowLabelsCreated = false;
        let temp = $.CreatePanel('Panel', _m_cP, 'temp');
        _Helper_LoadSnippet(temp, _GetPlayerRowForGameMode());
        temp.visible = false;
        _CreateLabelsForRow(temp);
        temp.DeleteAsync(.0);
        let oScoreData = MockAdapter.GetScoreDataJSO();
        _ResetTimeline(oScoreData, jsoTime);
        _m_bInit = true;
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
            _UpdateAllPlayers(bInitialCreate);
        }
        else {
            _UpdateAllPlayers_delayed();
        }
        _UpdateMatchInfo();
        _UpdateScore();
        _UpdateSpectatorButtons();
    }
    function _CloseScoreboard() {
        if (_m_updatePlayerHandler) {
            $.UnregisterForUnhandledEvent('Scoreboard_UpdatePlayerByPlayerSlot', _m_updatePlayerHandler);
            _m_updatePlayerHandler = null;
        }
        $.DispatchEvent('DismissAllContextMenus');
        UiToolkitAPI.HideTextTooltip();
        _UnregisterEvents();
    }
    function _OpenScoreboard() {
        _UpdateEverything();
        _ShowSurvivors((GameInterfaceAPI.GetSettingString('cl_scoreboard_survivors_always_on') == '0'));
        if (!_m_updatePlayerHandler) {
            _m_updatePlayerHandler = $.RegisterForUnhandledEvent('Scoreboard_UpdatePlayerByPlayerSlot', _UpdatePlayerByPlayerSlot_delayed);
        }
        _RegisterEvents();
    }
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
        });
    }
    function _UnregisterEvents() {
        const msg = $.GetContextPanel().id + ' unregistering ';
        events.forEach(function (arrEvent, idx) {
            $.UnregisterForUnhandledEvent(arrEvent[0], eventHandles[idx]);
        });
    }
    function _LoadScoreboardTemplate() {
        let scoreboardTemplate;
        let mode = MockAdapter.GetGameModeInternalName(false);
        let skirmish = MockAdapter.GetGameModeInternalName(true);
        if (mode == 'deathmatch') {
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
        if (MockAdapter.IsDemoOrHltv())
            _m_cP.AddClass('IsDemoOrHltv');
        if (MatchStatsAPI.IsTournamentMatch())
            _m_cP.AddClass('IsTournamentMatch');
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
        _m_cP.SetDialogVariable('server_name', '');
        _UpdateHLTVViewerNumber(0);
        $.DispatchEvent('DismissAllContextMenus');
        UiToolkitAPI.HideTextTooltip();
    }
    function _CreateAndInitialize(bImmediately = false) {
        if (bImmediately) {
            _CreateAndInitializeFunc();
        }
        else {
            $.Schedule(0.01, _CreateAndInitializeFunc);
        }
    }
    {
        _m_oAllUpdateStatNames = [];
        _InitializeStatUpdateFuncs();
        $.RegisterEventHandler('OnOpenScoreboard', $.GetContextPanel(), _OpenScoreboard);
        $.RegisterEventHandler('OnCloseScoreboard', $.GetContextPanel(), _CloseScoreboard);
        $.RegisterEventHandler('Scoreboard_UpdateJob', $.GetContextPanel(), _UpdateJob);
        $.RegisterEventHandler('Scoreboard_ResetAndInit', $.GetContextPanel(), _Initialize);
        $.RegisterEventHandler('Scoreboard_CreateAndInit', $.GetContextPanel(), _CreateAndInitialize);
        $.RegisterForUnhandledEvent('GameState_OnLevelLoad', _Initialize);
        $.RegisterForUnhandledEvent('Scoreboard_CycleStats', _CycleStats);
        $.RegisterForUnhandledEvent('Scoreboard_ToggleSetCasterIsCameraman', _ToggleSetCasterIsCameraman);
        $.RegisterForUnhandledEvent('Scoreboard_ToggleSetCasterIsHeard', _ToggleSetCasterIsHeard);
        $.RegisterForUnhandledEvent('Scoreboard_ToggleSetCasterControlsXray', _ToggleSetCasterControlsXray);
        $.RegisterForUnhandledEvent('Scoreboard_ToggleSetCasterControlsUI', _ToggleSetCasterControlsUI);
        $.RegisterForUnhandledEvent('GameState_RankRevealAll', _RankRevealAll);
        $.RegisterForUnhandledEvent('Scoreboard_UpdateHLTVViewers', _UpdateHLTVViewerNumber);
    }
})(Scoreboard || (Scoreboard = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NvcmVib2FyZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3Njb3JlYm9hcmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUNsQyx3Q0FBd0M7QUFDeEMsc0RBQXNEO0FBQ3RELDZDQUE2QztBQUM3Qyx5Q0FBeUM7QUFDekMsd0NBQXdDO0FBQ3hDLGlFQUFpRTtBQXNCakUsSUFBVSxVQUFVLENBODVIbkI7QUE5NUhELFdBQVUsVUFBVTtJQTRCbkIsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBc0IsQ0FBQztJQTJCdEQsTUFBTSxZQUFZO1FBR2pCLHNCQUFzQixHQUFtQixJQUFJLENBQUM7UUFDOUMsbUJBQW1CLEdBQW1CLElBQUksQ0FBQztRQUMzQyxvQkFBb0IsR0FBbUIsSUFBSSxDQUFDO1FBQzVDLHFCQUFxQixHQUFtQixJQUFJLENBQUM7UUFHN0MsbUJBQW1CLEdBQW1CLElBQUksQ0FBQztRQUMzQyxnQkFBZ0IsR0FBNEIsSUFBSSxDQUFDO1FBQ2pELGlCQUFpQixHQUFtQixJQUFJLENBQUM7UUFDekMsb0JBQW9CLEdBQW1CLElBQUksQ0FBQztRQUM1QyxrQkFBa0IsR0FBbUIsSUFBSSxDQUFDO1FBQzFDLGFBQWEsR0FBbUIsSUFBSSxDQUFDO1FBQ3JDLGlCQUFpQixHQUFtQixJQUFJLENBQUM7UUFHekMsVUFBVSxHQUE0QixFQUFFLENBQUM7UUFDekMsZUFBZSxHQUFtQixJQUFJLENBQUM7UUFDdkMsZUFBZSxHQUFtQixJQUFJLENBQUM7UUFDdkMsV0FBVyxHQUFtQixJQUFJLENBQUM7UUFDbkMsWUFBWSxHQUFtQixJQUFJLENBQUM7UUFFcEMsYUFBYSxHQUE2QyxFQUFFLENBQUM7UUFFN0QsUUFBUTtZQUVQLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLENBQUM7WUFDbkMsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElB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