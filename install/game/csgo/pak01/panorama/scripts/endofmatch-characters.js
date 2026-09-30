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
    let m_bNoGimmeAccolades = false; // if we show mixed teams, don't show gimmes.
    function _GetSnippetForMode(mode) {
        switch (mode) {
            // 2 x 2
            case 'scrimcomp2v2':
                return 'snippet-eom-chars__layout--scrimcomp2v2';
            // team line up
            case 'competitive':
            case 'cooperative':
            case 'casual':
            case 'teamdm':
            case 'rush':
                return 'snippet-eom-chars__layout--classic';
            // podium formationa
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
                    // manually create the array to preserve the order of the players.
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
                    // force local player into the front (if localplayer is shown)
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
        // We want to differentiate the different deathmatch modes but aren't sure this needs to be done outside of this scope.
        if (mode == 'deathmatch') {
            // FFA
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
        // always show your own team
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
            // if we are supposed to show the winner but there was a tie
            if (!teamNumToShow && localPlayer) {
                _m_localPlayer = localPlayer;
                teamNumToShow = _m_localPlayer['teamnumber'];
            }
        }
        if (teamNumToShow == 2) {
            _m_teamToShow = 'TERRORIST';
        }
        else // if team to show is CT or unknown, show CT
         {
            _m_teamToShow = 'CT';
        }
        _SetupPanel(mode);
        let arrPlayerList = _CollectPlayersForMode(mode);
        arrPlayerList = _SortPlayers(mode, arrPlayerList);
        // add the player models
        let cheerSet = new Set(); // only allow unique cheers to play once;
        // claim the fun cheer for the local player
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
        // Evenly divide middle 4:3 (1440x1080 in panel space) along the x-axis.
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
        // only play sfx if characters are visible
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
                // ACCOLADE
                // we don't know what the value type is so stuff it in all the ways and let the string use the correct one, e.g. accolade_livetime_desc
                let accName = GameStateAPI.GetAccoladeLocalizationString(Number(oTitle.eaccolade));
                let showAccolade = !(bNoGimmes && accName.includes('gimme_'));
                if (showAccolade) {
                    let accValue = oTitle.value.toString();
                    let accPosition = oTitle.position.toString();
                    PlayerStatsCard.SetAccolade(elCard, accValue, accName, accPosition);
                    $.Msg('EOM Accolade UI display: ' + xuid + ' ' + accPosition + ' ' + accName + ' ' + accValue);
                }
                PlayerStatsCard.SetStats(elCard, xuid, arrBestStats);
                PlayerStatsCard.SetFlair(elCard, xuid);
                PlayerStatsCard.SetSkillGroup(elCard, xuid);
                PlayerStatsCard.SetAvatar(elCard, xuid);
                PlayerStatsCard.SetTeammateColor(elCard, xuid);
                $.Schedule(ACCOLADE_START_TIME + (index * DELAY_PER_PLAYER), _DisplayPlayerStatsCard.bind(undefined, elCardContainer, index, nPlayerCount));
            }
            else {
                $.Msg('EOM Accolade UI display: ' + oPlayer.xuid + ' is missing from accolades.');
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
            // put local player in center.
            case 'no longer used but force local player to the middle':
                if (_m_localPlayer &&
                    _m_localPlayer.hasOwnProperty('xuid') &&
                    (arrPlayerList.filter(p => p.xuid == _m_localPlayer.xuid).length > 0)) {
                    // move local player to center of display
                    midpoint = Math.floor(arrPlayerList.length / 2);
                    arrPlayerList = arrPlayerList.filter(player => player['xuid'] != _m_localPlayer['xuid']);
                    arrPlayerList.splice(midpoint, 0, _m_localPlayer);
                }
                break;
            case 'no longer used but force player to have a spot':
                if (_m_localPlayer && arrPlayerList.includes(_m_localPlayer)) {
                    // guarantee local player a position on the board
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
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        $.RegisterForUnhandledEvent('GameState_RankRevealAll', _RankRevealAll);
    }
})(EOM_Characters || (EOM_Characters = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5kb2ZtYXRjaC1jaGFyYWN0ZXJzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvZW5kb2ZtYXRjaC1jaGFyYWN0ZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFDbEMsc0NBQXNDO0FBQ3RDLHNDQUFzQztBQUN0Qyw2Q0FBNkM7QUFDN0Msd0NBQXdDO0FBRXhDLElBQVUsY0FBYyxDQW1sQnZCO0FBbmxCRCxXQUFVLGNBQWM7SUFFdkIsSUFBSSw0QkFBNEIsR0FBb0QsRUFBRSxDQUFDO0lBRXZGLElBQUksY0FBYyxHQUF5RCxJQUFJLENBQUM7SUFDaEYsSUFBSSxhQUFhLEdBQThCLElBQUksQ0FBQztJQUVwRCxNQUFNLG1CQUFtQixHQUFHLENBQUMsQ0FBQztJQUM5QixNQUFNLGdCQUFnQixHQUFHLEdBQUcsQ0FBQztJQUU3QixJQUFJLG1CQUFtQixHQUFHLEtBQUssQ0FBQyxDQUFDLDZDQUE2QztJQUU5RSxTQUFTLGtCQUFrQixDQUFHLElBQVk7UUFFekMsUUFBUyxJQUFJLEVBQ2I7WUFDQyxRQUFRO1lBQ1IsS0FBSyxjQUFjO2dCQUNsQixPQUFPLHlDQUF5QyxDQUFDO1lBRWxELGVBQWU7WUFDZixLQUFLLGFBQWEsQ0FBQztZQUNuQixLQUFLLGFBQWEsQ0FBQztZQUNuQixLQUFLLFFBQVEsQ0FBQztZQUNkLEtBQUssUUFBUSxDQUFDO1lBQ2QsS0FBSyxNQUFNO2dCQUNWLE9BQU8sb0NBQW9DLENBQUM7WUFFN0Msb0JBQW9CO1lBQ3BCLEtBQUssVUFBVSxDQUFDO1lBQ2hCLEtBQUssWUFBWSxDQUFDO1lBQ2xCLEtBQUssT0FBTyxDQUFDO1lBQ2IsS0FBSyxvQkFBb0I7Z0JBQ3hCLE9BQU8sZ0NBQWdDLENBQUM7WUFFekM7Z0JBQ0MsT0FBTyxvQ0FBb0MsQ0FBQztTQUM3QztJQUNGLENBQUM7SUFFRCxTQUFTLFlBQVksQ0FBRyxJQUFnQjtR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