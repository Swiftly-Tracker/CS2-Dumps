"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="endofmatch.ts" />
/// <reference path="scoreboard.ts" />
/// <reference path="player_stats_card.ts" />
/// <reference path="mock_adapter.ts" />
var EOM_Characters;
(function (EOM_Characters) {
    let _m_arrAllPlayersMatchDataJSO = [];
    let _m_localPlayer = null;
    let _m_teamToShow = null;
    const ACCOLADE_START_TIME = 1;
    const DELAY_PER_PLAYER = 0.5;
    let m_bNoGimmeAccolades = false;
    function _GetSnippetForMode(mode) {
        switch (mode) {
            case 'scrimcomp2v2':
                return 'snippet-eom-chars__layout--scrimcomp2v2';
            case 'competitive':
            case 'cooperative':
            case 'casual':
            case 'teamdm':
            case 'rush':
                return 'snippet-eom-chars__layout--classic';
            case 'training':
            case 'deathmatch':
            case 'ffadm':
            case 'gungameprogressive':
                return 'snippet-eom-chars__layout--ffa';
            default:
                return 'snippet-eom-chars__layout--classic';
        }
    }
    function _SetTeamLogo(team) {
        let elRoot = $('#id-eom-characters-root');
        let teamLogoPath = 'file://{images}/icons/ui/' + (team == 'ct' ? 'ct_logo_1c.svg' : 't_logo_1c.svg');
        let elTeamLogo = elRoot.FindChildTraverse('id-eom-chars__layout__logo--' + team);
        if (elTeamLogo) {
            elTeamLogo.SetImage(teamLogoPath);
        }
    }
    function _SetupPanel(mode) {
        let elRoot = $('#id-eom-characters-root');
        let snippet = _GetSnippetForMode(mode);
        elRoot.RemoveAndDeleteChildren();
        elRoot.BLoadLayoutSnippet(snippet);
        _SetTeamLogo('t');
        _SetTeamLogo('ct');
    }
    function _CollectPlayersForMode(mode) {
        let arrPlayerList = [];
        switch (mode) {
            case 'deathmatch':
            case 'ffadm':
            case 'gungameprogressive':
                {
                    let arrPlayerXuids = Scoreboard.GetFreeForAllTopThreePlayers();
                    if (MockAdapter.GetMockData() != undefined) {
                        arrPlayerXuids = ['1', '2', '3'];
                    }
                    arrPlayerList[0] = _m_arrAllPlayersMatchDataJSO.filter(o => o['xuid'] == arrPlayerXuids[0])[0];
                    arrPlayerList[1] = _m_arrAllPlayersMatchDataJSO.filter(o => o['xuid'] == arrPlayerXuids[1])[0];
                    arrPlayerList[2] = _m_arrAllPlayersMatchDataJSO.filter(o => o['xuid'] == arrPlayerXuids[2])[0];
                    m_bNoGimmeAccolades = true;
                    break;
                }
            case 'training':
            case 'scrimcomp2v2':
                {
                    let listCT = _CollectPlayersOfTeam('CT').slice(0, 2);
                    let listT = _CollectPlayersOfTeam('TERRORIST').slice(0, 2);
                    arrPlayerList = listCT.concat(listT);
                    m_bNoGimmeAccolades = false;
                    break;
                }
            case 'rush':
                {
                    let listCT = _CollectPlayersOfTeam('CT').slice(0, 3);
                    let listT = _CollectPlayersOfTeam('TERRORIST').slice(0, 3);
                    arrPlayerList = listCT.concat(listT);
                    m_bNoGimmeAccolades = false;
                    break;
                }
            case 'competitive':
            case 'casual':
            case 'cooperative':
            case 'teamdm':
            default:
                {
                    arrPlayerList = _CollectPlayersOfTeam(_m_teamToShow);
                    arrPlayerList = arrPlayerList.sort(_SortByScoreFn);
                    m_bNoGimmeAccolades = false;
                    if (_m_localPlayer) {
                        arrPlayerList = arrPlayerList.filter(player => player['xuid'] != _m_localPlayer['xuid']);
                        arrPlayerList.splice(0, 0, _m_localPlayer);
                    }
                    break;
                }
        }
        if (arrPlayerList)
            arrPlayerList = arrPlayerList.slice(0, _GetNumCharsToShowForMode(mode));
        return arrPlayerList;
    }
    function _CollectPlayersOfTeam(teamName) {
        let teamNum = 0;
        switch (teamName) {
            case 'TERRORIST':
                teamNum = 2;
                break;
            case 'CT':
                teamNum = 3;
                break;
        }
        return _m_arrAllPlayersMatchDataJSO.filter(o => o['teamnumber'] == teamNum);
    }
    function _GetNumCharsToShowForMode(mode) {
        switch (mode) {
            case 'scrimcomp2v2':
                return 4;
            case 'competitive':
                return 5;
            case 'rush':
                return 6;
            case 'casual':
            case 'teamdm':
                return 5;
            case 'cooperative':
                return 2;
            case 'deathmatch':
            case 'ffadm':
            case 'gungameprogressive':
                return 3;
            case 'training':
                return 1;
            default:
                return 5;
        }
    }
    function GetModeForEndOfMatchPurposes() {
        let mode = MockAdapter.GetGameModeInternalName(false);
        if (mode == 'deathmatch') {
            if (GameInterfaceAPI.GetSettingString('mp_teammates_are_enemies') !== '0') {
                mode = 'ffadm';
            }
            else if (GameInterfaceAPI.GetSettingString('mp_dm_teammode') !== '0') {
                mode = 'teamdm';
            }
        }
        return mode;
    }
    EOM_Characters.GetModeForEndOfMatchPurposes = GetModeForEndOfMatchPurposes;
    function ShowWinningTeam(mode) {
        return false;
    }
    EOM_Characters.ShowWinningTeam = ShowWinningTeam;
    function _DisplayMe() {
        if (GameStateAPI.IsOverwatch()) {
            return false;
        }
        let data = MockAdapter.GetAllPlayersMatchDataJSO();
        if (data && data.allplayerdata && data.allplayerdata.length > 0) {
            _m_arrAllPlayersMatchDataJSO = data.allplayerdata;
        }
        else {
            return false;
        }
        let localPlayerSet = _m_arrAllPlayersMatchDataJSO.filter(oPlayer => oPlayer['xuid'] == MockAdapter.GetLocalPlayerXuid());
        let localPlayer = (localPlayerSet.length > 0) ? localPlayerSet[0] : undefined;
        let oMatchEndData = MockAdapter.GetMatchEndWinDataJSO();
        let teamNumToShow = 3;
        let losingTeamNum = oMatchEndData ? oMatchEndData.losing_team_number : 0;
        let mode = GetModeForEndOfMatchPurposes();
        if (localPlayer && !ShowWinningTeam(mode)) {
            _m_localPlayer = localPlayer;
            teamNumToShow = _m_localPlayer['teamnumber'];
        }
        else {
            if (oMatchEndData)
                teamNumToShow = oMatchEndData['winning_team_number'];
            if (!teamNumToShow && localPlayer) {
                _m_localPlayer = localPlayer;
                teamNumToShow = _m_localPlayer['teamnumber'];
            }
        }
        if (teamNumToShow == 2) {
            _m_teamToShow = 'TERRORIST';
        }
        else {
            _m_teamToShow = 'CT';
        }
        _SetupPanel(mode);
        let arrPlayerList = _CollectPlayersForMode(mode);
        arrPlayerList = _SortPlayers(mode, arrPlayerList);
        let cheerSet = new Set();
        let localPlayerCheer = '';
        if (_m_localPlayer) {
            let arrLocalPlayer = _m_localPlayer.hasOwnProperty('items') ? _m_localPlayer.items.filter(oItem => ItemInfo.IsCharacter(oItem.itemid)) : [];
            let localPlayerModel = arrLocalPlayer[0];
            if (localPlayerModel) {
                if (_m_localPlayer['teamnumber'] == losingTeamNum) {
                    if (GameInterfaceAPI.GetSettingString('eom_local_player_defeat_anim_enabled') !== '0')
                        localPlayerCheer = ItemInfo.GetDefaultDefeat(localPlayerModel['itemid']);
                }
                else {
                    localPlayerCheer = ItemInfo.GetDefaultCheer(localPlayerModel['itemid']);
                }
            }
            cheerSet.add(localPlayerCheer);
        }
        let gapIndex = -1;
        if (mode == 'scrimcomp2v2' && arrPlayerList.length > 0) {
            let firstTeamNum = arrPlayerList[0].teamnumber;
            gapIndex = arrPlayerList.findIndex(player => player.teamnumber != firstTeamNum);
        }
        $.GetContextPanel().SetPlayerCount(arrPlayerList.length + (gapIndex >= 0 ? 1 : 0));
        arrPlayerList.forEach((oPlayer, index) => {
            if (oPlayer) {
                if (index >= gapIndex && gapIndex >= 0)
                    index += 1;
                let sAgentItemId = '';
                let sGlovesItemId = '';
                let sWeaponItemId = '';
                let cheer = '';
                let sPetItemId = '';
                if ('items' in oPlayer) {
                    let agentItem = oPlayer['items'].filter(oItem => ItemInfo.IsCharacter(oItem['itemid']))[0];
                    if (agentItem) {
                        sAgentItemId = agentItem['itemid'];
                        if (oPlayer.teamnumber == losingTeamNum)
                            cheer = ItemInfo.GetDefaultDefeat(sAgentItemId);
                        else
                            cheer = ItemInfo.GetDefaultCheer(sAgentItemId);
                    }
                    let glovesItem = oPlayer['items'].filter(oItem => ItemInfo.IsGloves(oItem['itemid']))[0];
                    if (glovesItem) {
                        sGlovesItemId = glovesItem['itemid'];
                    }
                    let weaponItem = oPlayer['items'].filter(oItem => ItemInfo.IsWeapon(oItem['itemid']) || ItemInfo.IsMelee(oItem['itemid']))[0];
                    if (weaponItem) {
                        sWeaponItemId = weaponItem['itemid'];
                    }
                    let items = oPlayer['items'];
                    let petItem = oPlayer['items'].filter(oItem => ItemInfo.IsPet(oItem['itemid']))[0];
                    if (petItem) {
                        sPetItemId = petItem['itemid'];
                    }
                }
                if (oPlayer === _m_localPlayer)
                    cheer = localPlayerCheer;
                else if (cheerSet.has(cheer))
                    cheer = '';
                cheerSet.add(cheer);
                let label = oPlayer['xuid'];
                $.GetContextPanel().AddPlayer(index, label, sAgentItemId, sGlovesItemId, sWeaponItemId, cheer, sPetItemId);
            }
        });
        _CreatePlayerStatCards(arrPlayerList, gapIndex, m_bNoGimmeAccolades);
        return true;
    }
    ;
    function _DisplayPlayerStatsCard(elCardContainer, index, nPlayerCount) {
        let elEndOfMatch = $.GetContextPanel();
        let w = elEndOfMatch.actuallayoutwidth;
        let h = elEndOfMatch.actuallayoutheight;
        let xMin = 1080 * (w / h) * 0.5 - 720;
        let x = xMin + 1440 * ((index + 1) / (nPlayerCount + 1));
        let charPos = { x: x, y: 540 };
        if (elCardContainer && elCardContainer.IsValid()) {
            elCardContainer.style.x = charPos.x + 'px;';
            let elCard = elCardContainer.FindChildTraverse('card');
            elCardContainer.AddClass('reveal');
            $.Schedule(0.3, () => PlayerStatsCard.RevealStats(elCard));
        }
        if (!$.GetContextPanel().BAscendantHasClass('scoreboard-visible')) {
            $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.stats_reveal', 'MOUSE');
        }
    }
    function _CreatePlayerStatCards(arrPlayerList, gapIndex, bNoGimmes) {
        if (!arrPlayerList || arrPlayerList.length == 0)
            return;
        let arrBestStats = [
            { stat: 'adr', value: null, elCard: null },
            { stat: 'hsp', value: null, elCard: null },
            { stat: 'enemiesflashed', value: null, elCard: null },
            { stat: 'utilitydamage', value: null, elCard: null }
        ];
        let nPlayerCount = arrPlayerList.length + (gapIndex >= 0 ? 1 : 0);
        let elRoot = $('#id-eom-characters-root');
        for (let oPlayer of arrPlayerList) {
            if (!oPlayer)
                continue;
            let oTitle = oPlayer.nomination;
            let index = arrPlayerList.indexOf(oPlayer);
            if (index >= gapIndex && gapIndex >= 0)
                index += 1;
            if (oTitle != undefined) {
                let xuid = oPlayer.xuid;
                let elCardContainer = $.CreatePanel('Panel', elRoot, 'cardcontainer-' + xuid);
                elCardContainer.AddClass('player-stats-card-container');
                elCardContainer.style.zIndex = (index * 10).toString();
                let elCard = PlayerStatsCard.Init(elCardContainer, xuid, index);
                let accName = GameStateAPI.GetAccoladeLocalizationString(Number(oTitle.eaccolade));
                let showAccolade = !(bNoGimmes && accName.includes('gimme_'));
                if (showAccolade) {
                    let accValue = oTitle.value.toString();
                    let accPosition = oTitle.position.toString();
                    PlayerStatsCard.SetAccolade(elCard, accValue, accName, accPosition);
                }
                PlayerStatsCard.SetStats(elCard, xuid, arrBestStats);
                PlayerStatsCard.SetFlair(elCard, xuid);
                PlayerStatsCard.SetSkillGroup(elCard, xuid);
                PlayerStatsCard.SetAvatar(elCard, xuid);
                PlayerStatsCard.SetTeammateColor(elCard, xuid);
                $.Schedule(ACCOLADE_START_TIME + (index * DELAY_PER_PLAYER), _DisplayPlayerStatsCard.bind(undefined, elCardContainer, index, nPlayerCount));
            }
            else {
            }
        }
        for (let oBest of arrBestStats) {
            if (oBest.elCard)
                PlayerStatsCard.HighlightStat(oBest.elCard, oBest.stat);
        }
    }
    function _SortByTeamFn(a, b) {
        let team_a = Number(a['teamnumber']);
        let team_b = Number(b['teamnumber']);
        let index_a = Number(a['slot']);
        let index_b = Number(b['slot']);
        if (team_a != team_b) {
            return team_b - team_a;
        }
        else {
            return index_a - index_b;
        }
    }
    function _SortByScoreFn(a, b) {
        let score_a = MockAdapter.GetPlayerScore(a['xuid']);
        let score_b = MockAdapter.GetPlayerScore(b['xuid']);
        let index_a = Number(a['slot']);
        let index_b = Number(b['slot']);
        if (score_a != score_b) {
            return score_b - score_a;
        }
        else {
            return index_a - index_b;
        }
    }
    function _SortPlayers(mode, arrPlayerList) {
        let midpoint;
        let localPlayerPosition;
        switch (mode) {
            case 'scrimcomp2v2':
                arrPlayerList.sort(_SortByTeamFn);
                break;
            case 'no longer used but force local player to the middle':
                if (_m_localPlayer &&
                    _m_localPlayer.hasOwnProperty('xuid') &&
                    (arrPlayerList.filter(p => p.xuid == _m_localPlayer.xuid).length > 0)) {
                    midpoint = Math.floor(arrPlayerList.length / 2);
                    arrPlayerList = arrPlayerList.filter(player => player['xuid'] != _m_localPlayer['xuid']);
                    arrPlayerList.splice(midpoint, 0, _m_localPlayer);
                }
                break;
            case 'no longer used but force player to have a spot':
                if (_m_localPlayer && arrPlayerList.includes(_m_localPlayer)) {
                    localPlayerPosition = Math.min(arrPlayerList.indexOf(_m_localPlayer), 7);
                    arrPlayerList = arrPlayerList.filter(player => player['xuid'] != _m_localPlayer['xuid']);
                    arrPlayerList.splice(localPlayerPosition, 0, _m_localPlayer);
                }
                break;
            case 'deathmatch':
            case 'ffadm':
            case 'casual':
            case 'teamdm':
            case 'rush':
            default:
                break;
        }
        return arrPlayerList;
    }
    function _RankRevealAll() {
        let mode = GetModeForEndOfMatchPurposes();
        let arrPlayerList = _CollectPlayersForMode(mode);
        for (let oPlayer of arrPlayerList) {
            if (!oPlayer)
                continue;
            let xuid = oPlayer.xuid;
            let elCardContainer = $.GetContextPanel().FindChildTraverse('cardcontainer-' + xuid);
            if (elCardContainer) {
                let elCard = PlayerStatsCard.GetCard(elCardContainer);
                PlayerStatsCard.SetSkillGroup(elCard, xuid);
            }
        }
    }
    function Start() {
        _DisplayMe();
        $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.gameover_show', 'MOUSE');
    }
    EOM_Characters.Start = Start;
    function Shutdown() {
        $('#id-eom-characters-root').FindChildrenWithClassTraverse('eom-chars__accolade').forEach(el => el.DeleteAsync(.0));
        $('#id-eom-characters-root').RemoveAndDeleteChildren();
    }
    EOM_Characters.Shutdown = Shutdown;
    {
        $.RegisterForUnhandledEvent('GameState_RankRevealAll', _RankRevealAll);
    }
})(EOM_Characters || (EOM_Characters = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5kb2ZtYXRjaC1jaGFyYWN0ZXJzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvZW5kb2ZtYXRjaC1jaGFyYWN0ZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFDbEMsc0NBQXNDO0FBQ3RDLHNDQUFzQztBQUN0Qyw2Q0FBNkM7QUFDN0Msd0NBQXdDO0FBRXhDLElBQVUsY0FBYyxDQW1sQnZCO0FBbmxCRCxXQUFVLGNBQWM7SUFFdkIsSUFBSSw0QkFBNEIsR0FBb0QsRUFBRSxDQUFDO0lBRXZGLElBQUksY0FBYyxHQUF5RCxJQUFJLENBQUM7SUFDaEYsSUFBSSxhQUFhLEdBQThCLElBQUksQ0FBQztJQUVwRCxNQUFNLG1CQUFtQixHQUFHLENBQUMsQ0FBQztJQUM5QixNQUFNLGdCQUFnQixHQUFHLEdBQUcsQ0FBQztJQUU3QixJQUFJLG1CQUFtQixHQUFHLEtBQUssQ0FBQztJQUVoQyxTQUFTLGtCQUFrQixDQUFHLElBQVk7UUFFekMsUUFBUyxJQUFJLEVBQ2I7WUFFQyxLQUFLLGNBQWM7Z0JBQ2xCLE9BQU8seUNBQXlDLENBQUM7WUFHbEQsS0FBSyxhQUFhLENBQUM7WUFDbkIsS0FBSyxhQUFhLENBQUM7WUFDbkIsS0FBSyxRQUFRLENBQUM7WUFDZCxLQUFLLFFBQVEsQ0FBQztZQUNkLEtBQUssTUFBTTtnQkFDVixPQUFPLG9DQUFvQyxDQUFDO1lBRzdDLEtBQUssVUFBVSxDQUFDO1lBQ2hCLEtBQUssWUFBWSxDQUFDO1lBQ2xCLEtBQUssT0FBTyxDQUFDO1lBQ2IsS0FBSyxvQkFBb0I7Z0JBQ3hCLE9BQU8sZ0NBQWdDLENBQUM7WUFFekM7Z0JBQ0MsT0FBTyxvQ0FBb0MsQ0FBQztTQUM3QztJQUNGLENBQUM7SUFFRCxTQUFTLFlBQVksQ0FBRyxJQUFnQjtRQUV2QyxJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUUseUJBQXlCLENBQUcsQ0FB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