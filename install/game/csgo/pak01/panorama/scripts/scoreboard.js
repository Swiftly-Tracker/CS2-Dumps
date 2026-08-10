"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="mock_adapter.ts" />
/// <reference path="common/gamerules_constants.ts" />
/// <reference path="common/formattext.ts" />
/// <reference path="rating_emblem.ts" />
/// <reference path="match_stakes.ts" />
/// <reference path="honor_icon.ts" />
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
                if (skirmish == 'flyingscoutsman') {
                    scoreboardTemplate = 'snippet_scoreboard-classic--with-timeline--no-half-times';
                }
                else {
                    scoreboardTemplate = 'snippet_scoreboard-classic--no-timeline';
                }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NvcmVib2FyZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3Njb3JlYm9hcmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUNsQyx3Q0FBd0M7QUFDeEMsc0RBQXNEO0FBQ3RELDZDQUE2QztBQUM3Qyx5Q0FBeUM7QUFDekMsd0NBQXdDO0FBQ3hDLHNDQUFzQztBQUN0QyxpRUFBaUU7QUFzQmpFLElBQVUsVUFBVSxDQW01SG5CO0FBbjVIRCxXQUFVLFVBQVU7SUE0Qm5CLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQXNCLENBQUM7SUEyQnRELE1BQU0sWUFBWTtRQUdqQixzQkFBc0IsR0FBbUIsSUFBSSxDQUFDO1FBQzlDLG1CQUFtQixHQUFtQixJQUFJLENBQUM7UUFDM0Msb0JBQW9CLEdBQW1CLElBQUksQ0FBQztRQUM1QyxxQkFBcUIsR0FBbUIsSUFBSSxDQUFDO1FBRzdDLG1CQUFtQixHQUFtQixJQUFJLENBQUM7UUFDM0MsZ0JBQWdCLEdBQTRCLElBQUksQ0FBQztRQUNqRCxpQkFBaUIsR0FBbUIsSUFBSSxDQUFDO1FBQ3pDLG9CQUFvQixHQUFtQixJQUFJLENBQUM7UUFDNUMsa0JBQWtCLEdBQW1CLElBQUksQ0FBQztRQUMxQyxhQUFhLEdBQW1CLElBQUksQ0FBQztRQUNyQyxpQkFBaUIsR0FBbUIsSUFBSSxDQUFDO1FBR3pDLFVBQVUsR0FBNEIsRUFBRSxDQUFDO1FBQ3pDLGVBQWUsR0FBbUIsSUFBSSxDQUFDO1FBQ3ZDLGVBQWUsR0FBbUIsSUFBSSxDQUFDO1FBQ3ZDLFdBQVcsR0FBbUIsSUFBSSxDQUFDO1FBQ25DLFlBQVksR0FBbUIsSUFBSSxDQUFDO1FBRXBDLGFBQWEsR0FBNkMsRUFBRSxDQUFDO1FBRTdELFFBQVE7WUFFUCxJQUFJLENBQUMsc0JBQXNCLEdBQUcsSUFBSSxDQUFDO1lBQ25DLElBQUksQ0FBQyxt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