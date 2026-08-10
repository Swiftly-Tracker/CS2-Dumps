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
                }
                if (oPlayer === _m_localPlayer)
                    cheer = localPlayerCheer;
                else if (cheerSet.has(cheer))
                    cheer = '';
                cheerSet.add(cheer);
                let label = oPlayer['xuid'];
                $.GetContextPanel().AddPlayer(index, label, sAgentItemId, sGlovesItemId, sWeaponItemId, cheer);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5kb2ZtYXRjaC1jaGFyYWN0ZXJzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvZW5kb2ZtYXRjaC1jaGFyYWN0ZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFDbEMsc0NBQXNDO0FBQ3RDLHNDQUFzQztBQUN0Qyw2Q0FBNkM7QUFDN0Msd0NBQXdDO0FBRXhDLElBQVUsY0FBYyxDQTBrQnZCO0FBMWtCRCxXQUFVLGNBQWM7SUFFdkIsSUFBSSw0QkFBNEIsR0FBb0QsRUFBRSxDQUFDO0lBRXZGLElBQUksY0FBYyxHQUF5RCxJQUFJLENBQUM7SUFDaEYsSUFBSSxhQUFhLEdBQThCLElBQUksQ0FBQztJQUVwRCxNQUFNLG1CQUFtQixHQUFHLENBQUMsQ0FBQztJQUM5QixNQUFNLGdCQUFnQixHQUFHLEdBQUcsQ0FBQztJQUU3QixJQUFJLG1CQUFtQixHQUFHLEtBQUssQ0FBQztJQUVoQyxTQUFTLGtCQUFrQixDQUFHLElBQVk7UUFFekMsUUFBUyxJQUFJLEVBQ2I7WUFFQyxLQUFLLGNBQWM7Z0JBQ2xCLE9BQU8seUNBQXlDLENBQUM7WUFHbEQsS0FBSyxhQUFhLENBQUM7WUFDbkIsS0FBSyxhQUFhLENBQUM7WUFDbkIsS0FBSyxRQUFRLENBQUM7WUFDZCxLQUFLLFFBQVE7Z0JBQ1osT0FBTyxvQ0FBb0MsQ0FBQztZQUc3QyxLQUFLLFVBQVUsQ0FBQztZQUNoQixLQUFLLFlBQVksQ0FBQztZQUNsQixLQUFLLE9BQU8sQ0FBQztZQUNiLEtBQUssb0JBQW9CO2dCQUN4QixPQUFPLGdDQUFnQyxDQUFDO1lBRXpDO2dCQUNDLE9BQU8sb0NBQW9DLENBQUM7U0FDN0M7SUFDRixDQUFDO0lBRUQsU0FBUyxZQUFZLENBQUcsSUFBZ0I7UUFFdkMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFFLHlCQUF5QixDQUFHLENBQUM7UUFFN0MsSUFBSSxZQUFZLEdBQUcsMkJBQTJCLEdBQUcsQ0FBRSxJQUFJLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFFLENBQUM7UUFDdkcsSUFBSSxVQUFVLEdBQUcsTUFBTSxDQUFDLGlCQUFpQixDQUFFLDhCQUE4QixHQUFHLElBQUksQ0FBRSxDQUFDO1FBRW5GLElBQUssVUFBVSxFQUNmO1lBQ0csVUFBdUIsQ0FBQyxRQUFRLENBQUUsWUFBWSxDQUFFLENBQUM7U0FDbkQ7SUFDRixDQUFDO0lBRUQsU0FBUyxXQUFXLENBQUcsSUFBWTtRQUVsQyxJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUUseUJBQXlCLENBQUcsQ0FBQztRQUU3QyxJQUFJLE9BQU8sR0FBRyxrQkFBa0IsQ0FBRSxJQUFJLENBQUUsQ0FBQztRQUV6QyxNQUFNLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUNqQyxNQUFNLENBQUMsa0JBQWtCLENBQUUsT0FBTyxDQUFFLENBQUM7UUFFckMsWUFBWSxDQUFFLEdBQUcsQ0FBRSxDQUFDO1FBQ3BCLFlBQVksQ0FBRSxJQUFJLENBQUUsQ0FBQztJQUV0QixDQUFDO0lBRUQsU0FBUyxzQkFBc0IsQ0FBRyxJQUFZO1FBRTdDLElBQUksYUFBYSxHQUFvRCxFQUFFLENBQUM7UUFFeEUsUUFBUyxJQUFJLEVBQ2I7WUFDQyxLQUFLLFlBQVksQ0FBQztZQUNsQixLQUFLLE9BQU8sQ0FBQztZQUNiLEtBQUssb0JBQW9CO2dCQUN6QjtvQkFDQyxJQUFJLGNBQWMsR0FBRyxVQUFVLENBQUMsNEJBQTRCLEVBQUUsQ0FBQztvQkFDL0QsSUFBSyxXQUFXLENBQUMsV0FBVyxFQUFFLElBQUksU0FBUyxFQUMzQzt3QkFDQyxjQUFjLEdBQUcsQ0FBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBRSxDQUFDO3FCQUNuQztvQkFHRCxhQUFhLENBQUUsQ0FBQyxDQUFFLEdBQUcsNEJBQTRCLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFFLE1BQU0sQ0FBRSxJQUFJLGNBQWMsQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFFLENBQUMsQ0FBRSxDQUFDO29CQUN6RyxhQUFhLENBQUUsQ0FBQyxDQUFFLEdBQUcsNEJBQTRCLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFFLE1BQU0sQ0FBRSxJQUFJLGNBQWMsQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFFLENBQUMsQ0FBRSxDQUFDO29CQUN6RyxhQUFhLENBQUUsQ0FBQyxDQUFFLEdBQUcsNEJBQTRCLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFFLE1BQU0sQ0FBRSxJQUFJLGNBQWMsQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFFLENBQUMsQ0FBRSxDQUFDO29CQUV6RyxtQkFBbUIsR0FBRyxJQUFJLENBQUM7b0JBRTNCLE1BQU07aUJBQ047WUFFRCxLQUFLLFVBQVUsQ0FBQztZQUNoQixLQUFLLGNBQWM7Z0JBQ25CO29CQUNDLElBQUksTUFBTSxHQUFHLHFCQUFxQixDQUFFLElBQUksQ0FBRSxDQUFDLEtBQUssQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7b0JBQ3pELElBQUksS0FBSyxHQUFHLHFCQUFxQixDQUFFLFdBQVcsQ0FBRSxDQUFDLEtBQUssQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7b0JBRS9ELGFBQWEsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFFLEtBQUssQ0FBRSxDQUFDO29CQUV2QyxtQkFBbUIsR0FBRyxLQUFLLENBQUM7b0JBRTVCLE1BQU07aUJBQ047WUFFRCxLQUFLLGFBQWEsQ0FBQztZQUNuQixLQUFLLFFBQVEsQ0FBQztZQUNkLEtBQUssYUFBYSxDQUFDO1lBQ25CLEtBQUssUUFBUSxDQUFDO1lBQ2Q7Z0JBQ0E7b0JBQ0MsYUFBYSxHQUFHLHFCQUFxQixDQUFFLGFBQWMsQ0FBRSxDQUFDO29CQUN4RCxhQUFhLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBRSxjQUFjLENBQUUsQ0FBQztvQkFDckQsbUJBQW1CLEdBQUcsS0FBSyxDQUFDO29CQUc1QixJQUFLLGNBQWMsRUFDbkI7d0JBQ0MsYUFBYSxHQUFHLGFBQWEsQ0FBQyxNQUFNLENBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUUsTUFBTSxDQUFFLElBQUksY0FBZSxDQUFFLE1BQU0sQ0FBRSxDQUFFLENBQUM7d0JBQ2hHLGFBQWEsQ0FBQyxNQUFNLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxjQUFjLENBQUUsQ0FBQztxQkFDN0M7b0JBQ0QsTUFBTTtpQkFFTjtTQUNEO1FBRUQsSUFBSyxhQUFhO1lBQ2pCLGFBQWEsR0FBRyxhQUFhLENBQUMsS0FBSyxDQUFFLENBQUMsRUFBRSx5QkFBeUIsQ0FBRSxJQUFJLENBQUUsQ0FBRSxDQUFDO1FBRTdFLE9BQU8sYUFBYSxDQUFDO0lBQ3RCLENBQUM7SUFFRCxTQUFTLHFCQUFxQixDQUFHLFFBQTRCO1FBRTVELElBQUksT0FBTyxHQUFHLENBQUMsQ0FBQztRQUNoQixRQUFTLFFBQVEsRUFDakI7WUFDQSxLQUFLLFdBQVc7Z0JBQ2YsT0FBTyxHQUFHLENBQUMsQ0FBQztnQkFDWixNQUFNO1lBRVAsS0FBSyxJQUFJO2dCQUNSLE9BQU8sR0FBRyxDQUFDLENBQUM7Z0JBQ1osTUFBTTtTQUNOO1FBRUQsT0FBTyw0QkFBNEIsQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUUsWUFBWSxDQUFFLElBQUksT0FBTyxDQUFFLENBQUM7SUFDakYsQ0FBQztJQUVELFNBQVMseUJBQXlCLENBQUcsSUFBWTtRQUVoRCxRQUFTLElBQUksRUFDYjtZQUNBLEtBQUssY0FBYztnQkFDbEIsT0FBTyxDQUFDLENBQUM7WUFFVixLQUFLLGFBQWE7Z0JBQ2pCLE9BQU8sQ0FBQyxDQUFDO1lBRVYsS0FBSyxRQUFRLENBQUM7WUFDZCxLQUFLLFFBQVE7Z0JBQ1osT0FBTyxDQUFDLENBQUM7WUFFVixLQUFLLGFBQWE7Z0JBQ2pCLE9BQU8sQ0FBQyxDQUFDO1lBRVYsS0FBSyxZQUFZLENBQUM7WUFDbEIsS0FBSyxPQUFPLENBQUM7WUFDYixLQUFLLG9CQUFvQjtnQkFDeEIsT0FBTyxDQUFDLENBQUM7WUFFVixLQUFLLFVBQVU7Z0JBQ2QsT0FBTyxDQUFDLENBQUM7WUFFVjtnQkFDQyxPQUFPLENBQUMsQ0FBQztTQUNUO0lBQ0YsQ0FBQztJQUVELFNBQWdCLDRCQUE0QjtRQUUzQyxJQUFJLElBQUksR0FBRyxXQUFXLENBQUMsdUJBQXVCLENBQUUsS0FBSyxDQUFFLENBQUM7UUFHeEQsSUFBSyxJQUFJLElBQUksWUFBWSxFQUN6QjtZQUVDLElBQUssZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUUsMEJBQTBCLENBQUUsS0FBSyxHQUFHLEVBQzVFO2dCQUNDLElBQUksR0FBRyxPQUFPLENBQUM7YUFDZjtpQkFDSSxJQUFLLGdCQUFnQixDQUFDLGdCQUFnQixDQUFFLGdCQUFnQixDQUFFLEtBQUssR0FBRyxFQUN2RTtnQkFDQyxJQUFJLEdBQUcsUUFBUSxDQUFDO2FBQ2hCO1NBQ0Q7UUFFRCxPQUFPLElBQUksQ0FBQztJQUNiLENBQUM7SUFuQmUsMkNBQTRCLCtCQW1CM0MsQ0FBQTtJQUVELFNBQWdCLGVBQWUsQ0FBRyxJQUFZO1FBRzdDLE9BQU8sS0FBSyxDQUFDO0lBQ2QsQ0FBQztJQUplLDhCQUFlLGtCQUk5QixDQUFBO0lBRUQsU0FBUyxVQUFVO1FBRWxCLElBQUssWUFBWSxDQUFDLFdBQVcsRUFBRSxFQUMvQjtZQUNDLE9BQU8sS0FBSyxDQUFDO1NBQ2I7UUFFRCxJQUFJLElBQUksR0FBRyxXQUFXLENBQUMseUJBQXlCLEVBQUUsQ0FBQztRQUVuRCxJQUFLLElBQUksSUFBSSxJQUFJLENBQUMsYUFBYSxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxHQUFHLENBQUMsRUFDaEU7WUFDQyw0QkFBNEIsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDO1NBQ2xEO2FBRUQ7WUFDQyxPQUFPLEtBQUssQ0FBQztTQUNiO1FBRUQsSUFBSSxjQUFjLEdBQUcsNEJBQTRCLENBQUMsTUFBTSxDQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFFLE1BQU0sQ0FBRSxJQUFJLFdBQVcsQ0FBQyxrQkFBa0IsRUFBRSxDQUFFLENBQUM7UUFDN0gsSUFBSSxXQUFXLEdBQUcsQ0FBRSxjQUFjLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBRSxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUUsQ0FBQyxDQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztRQUVsRixJQUFJLGFBQWEsR0FBRyxXQUFXLENBQUMscUJBQXFCLEVBQUUsQ0FBQztRQUN4RCxJQUFJLGFBQWEsR0FBRyxDQUFDLENBQUM7UUFDdEIsSUFBSSxhQUFhLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUV6RSxJQUFJLElBQUksR0FBRyw0QkFBNEIsRUFBRSxDQUFDO1FBQzFDLElBQUssV0FBVyxJQUFJLENBQUMsZUFBZSxDQUFFLElBQUksQ0FBRSxFQUM1QztZQUNDLGNBQWMsR0FBRyxXQUFXLENBQUM7WUFDN0IsYUFBYSxHQUFHLGNBQWMsQ0FBRSxZQUFZLENBQUUsQ0FBQztTQUMvQzthQUVEO1lBQ0MsSUFBSyxhQUFhO2dCQUNqQixhQUFhLEdBQUcsYUFBYSxDQUFFLHFCQUFxQixDQUFFLENBQUM7WUFHeEQsSUFBSyxDQUFDLGFBQWEsSUFBSSxXQUFXLEVBQ2xDO2dCQUNDLGNBQWMsR0FBRyxXQUFXLENBQUM7Z0JBQzdCLGFBQWEsR0FBRyxjQUFjLENBQUUsWUFBWSxDQUFFLENBQUM7YUFDL0M7U0FDRDtRQUVELElBQUssYUFBYSxJQUFJLENBQUMsRUFDdkI7WUFDQyxhQUFhLEdBQUcsV0FBVyxDQUFDO1NBQzVCO2FBRUQ7WUFDQyxhQUFhLEdBQUcsSUFBSSxDQUFDO1NBQ3JCO1FBRUQsV0FBVyxDQUFFLElBQUksQ0FBRSxDQUFDO1FBRXBCLElBQUksYUFBYSxHQUFHLHNCQUFzQixDQUFFLElBQUksQ0FBRSxDQUFDO1FBQ25ELGFBQWEsR0FBRyxZQUFZLENBQUUsSUFBSSxFQUFFLGFBQWEsQ0FBRSxDQUFDO1FBR3BELElBQUksUUFBUSxHQUFnQixJQUFJLEdBQUcsRUFBRSxDQUFDO1FBR3RDLElBQUksZ0JBQWdCLEdBQUcsRUFBRSxDQUFDO1FBQzFCLElBQUssY0FBYyxFQUNuQjtZQUNDLElBQUksY0FBYyxHQUFHLGNBQWMsQ0FBQyxjQUFjLENBQUUsT0FBTyxDQUFFLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFFLEtBQUssQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBRSxLQUFLLENBQUMsTUFBTSxDQUFFLENBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBQ2xKLElBQUksZ0JBQWdCLEdBQUcsY0FBYyxDQUFFLENBQUMsQ0FBRSxDQUFDO1lBRTNDLElBQUssZ0JBQWdCLEVBQ3JCO2dCQUNDLElBQUssY0FBYyxDQUFFLFlBQVksQ0FBRSxJQUFJLGFBQWEsRUFDcEQ7b0JBQ0MsSUFBSyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBRSxzQ0FBc0MsQ0FBRSxLQUFLLEdBQUc7d0JBQ3ZGLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBRSxnQkFBZ0IsQ0FBRSxRQUFRLENBQUUsQ0FBRSxDQUFDO2lCQUM5RTtxQkFFRDtvQkFDQyxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsZUFBZSxDQUFFLGdCQUFnQixDQUFFLFFBQVEsQ0FBRSxDQUFFLENBQUM7aUJBQzVFO2FBQ0Q7WUFDRCxRQUFRLENBQUMsR0FBRyxDQUFFLGdCQUFnQixDQUFFLENBQUM7U0FDakM7UUFFRCxJQUFJLFFBQVEsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNsQixJQUFLLElBQUksSUFBSSxjQUFjLElBQUksYUFBYSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQ3ZEO1lBQ0MsSUFBSSxZQUFZLEdBQUcsYUFBYSxDQUFFLENBQUMsQ0FBRSxDQUFDLFVBQVUsQ0FBQztZQUNqRCxRQUFRLEdBQUcsYUFBYSxDQUFDLFNBQVMsQ0FBRSxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxVQUFVLElBQUksWUFBWSxDQUFFLENBQUM7U0FDbEY7UUFFRCxDQUFDLENBQUMsZUFBZSxFQUFvQixDQUFDLGNBQWMsQ0FBRSxhQUFhLENBQUMsTUFBTSxHQUFHLENBQUUsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBRSxDQUFDO1FBQ3pHLGFBQWEsQ0FBQyxPQUFPLENBQUUsQ0FBRSxPQUFPLEVBQUUsS0FBSyxFQUFHLEVBQUU7WUFFM0MsSUFBSyxPQUFPLEVBQ1o7Z0JBQ0MsSUFBSyxLQUFLLElBQUksUUFBUSxJQUFJLFFBQVEsSUFBSSxDQUFDO29CQUN0QyxLQUFLLElBQUksQ0FBQyxDQUFDO2dCQUVaLElBQUksWUFBWSxHQUFHLEVBQUUsQ0FBQztnQkFDdEIsSUFBSSxhQUFhLEdBQUcsRUFBRSxDQUFDO2dCQUN2QixJQUFJLGFBQWEsR0FBRyxFQUFFLENBQUM7Z0JBQ3ZCLElBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQztnQkFLZixJQUFLLE9BQU8sSUFBSSxPQUFPLEVBQ3ZCO29CQUNDLElBQUksU0FBUyxHQUFHLE9BQU8sQ0FBRSxPQUFPLENBQUUsQ0FBQyxNQUFNLENBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFFLEtBQUssQ0FBRSxRQUFRLENBQUUsQ0FBRSxDQUFFLENBQUUsQ0FBQyxDQUFFLENBQUM7b0JBQ3JHLElBQUssU0FBUyxFQUNkO3dCQUNDLFlBQVksR0FBRyxTQUFTLENBQUUsUUFBUSxDQUFFLENBQUM7d0JBQ3JDLElBQUssT0FBTyxDQUFDLFVBQVUsSUFBSSxhQUFhOzRCQUN2QyxLQUFLLEdBQUcsUUFBUSxDQUFDLGdCQUFnQixDQUFFLFlBQVksQ0FBRSxDQUFDOzs0QkFFbEQsS0FBSyxHQUFHLFFBQVEsQ0FBQyxlQUFlLENBQUUsWUFBWSxDQUFFLENBQUM7cUJBQ2xEO29CQUVELElBQUksVUFBVSxHQUFHLE9BQU8sQ0FBRSxPQUFPLENBQUUsQ0FBQyxNQUFNLENBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFFLEtBQUssQ0FBRSxRQUFRLENBQUUsQ0FBRSxDQUFFLENBQUUsQ0FBQyxDQUFFLENBQUM7b0JBQ25HLElBQUssVUFBVSxFQUNmO3dCQUNDLGFBQWEsR0FBRyxVQUFVLENBQUUsUUFBUSxDQUFFLENBQUM7cUJBQ3ZDO29CQUVELElBQUksVUFBVSxHQUFHLE9BQU8sQ0FBRSxPQUFPLENBQUUsQ0FBQyxNQUFNLENBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFFLEtBQUssQ0FBRSxRQUFRLENBQUUsQ0FBRSxJQUFJLFFBQVEsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFFLFFBQVEsQ0FBRSxDQUFFLENBQUUsQ0FBRSxDQUFDLENBQUUsQ0FBQztvQkFDNUksSUFBSyxVQUFVLEVBQ2Y7d0JBQ0MsYUFBYSxHQUFHLFVBQVUsQ0FBRSxRQUFRLENBQUUsQ0FBQztxQkFDdkM7aUJBU0Q7Z0JBRUQsSUFBSyxPQUFPLEtBQUssY0FBYztvQkFDOUIsS0FBSyxHQUFHLGdCQUFnQixDQUFDO3FCQUNyQixJQUFLLFFBQVEsQ0FBQyxHQUFHLENBQUUsS0FBSyxDQUFFO29CQUM5QixLQUFLLEdBQUcsRUFBRSxDQUFDO2dCQUVaLFFBQVEsQ0FBQyxHQUFHLENBQUUsS0FBSyxDQUFFLENBQUM7Z0JBRXRCLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBRSxNQUFNLENBQUUsQ0FBQztnQkFNOUIsQ0FBQyxDQUFDLGVBQWUsRUFBb0IsQ0FBQyxTQUFTLENBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUUsYUFBYSxFQUFFLGFBQWEsRUFBRSxLQUFLLENBQUUsQ0FBQzthQUNuSDtRQUNGLENBQUMsQ0FBRSxDQUFDO1FBRUosc0JBQXNCLENBQUUsYUFBYSxFQUFFLFFBQVEsRUFBRSxtQkFBbUIsQ0FBRSxDQUFDO1FBRXZFLE9BQU8sSUFBSSxDQUFDO0lBQ2IsQ0FBQztJQUFBLENBQUM7SUFFRixTQUFTLHVCQUF1QixDQUFHLGVBQXdCLEVBQUUsS0FBYSxFQUFFLFlBQW9CO1FBRS9GLElBQUksWUFBWSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUd2QyxJQUFJLENBQUMsR0FBRyxZQUFZLENBQUMsaUJBQWlCLENBQUM7UUFDdkMsSUFBSSxDQUFDLEdBQUcsWUFBWSxDQUFDLGtCQUFrQixDQUFDO1FBQ3hDLElBQUksSUFBSSxHQUFHLElBQUksR0FBRyxDQUFFLENBQUMsR0FBRyxDQUFDLENBQUUsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQ3hDLElBQUksQ0FBQyxHQUFHLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBRSxDQUFFLEtBQUssR0FBRyxDQUFDLENBQUUsR0FBRyxDQUFFLFlBQVksR0FBRyxDQUFDLENBQUUsQ0FBRSxDQUFDO1FBQy9ELElBQUksT0FBTyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7UUFFL0IsSUFBSyxlQUFlLElBQUksZUFBZSxDQUFDLE9BQU8sRUFBRSxFQUNqRDtZQUNDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDO1lBRTVDLElBQUksTUFBTSxHQUFHLGVBQWUsQ0FBQyxpQkFBaUIsQ0FBRSxNQUFNLENBQUUsQ0FBQztZQUV6RCxlQUFlLENBQUMsUUFBUSxDQUFFLFFBQVEsQ0FBRSxDQUFDO1lBRXJDLENBQUMsQ0FBQyxRQUFRLENBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUUsTUFBTSxDQUFFLENBQUUsQ0FBQztTQUMvRDtRQUdELElBQUssQ0FBQyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsa0JBQWtCLENBQUUsb0JBQW9CLENBQUUsRUFDcEU7WUFDQyxDQUFDLENBQUMsYUFBYSxDQUFFLHFCQUFxQixFQUFFLHlCQUF5QixFQUFFLE9BQU8sQ0FBRSxDQUFDO1NBQzdFO0lBQ0YsQ0FBQztJQUVELFNBQVMsc0JBQXNCLENBQUcsYUFBOEQsRUFBRSxRQUFnQixFQUFFLFNBQWtCO1FBRXJJLElBQUssQ0FBQyxhQUFhLElBQUksYUFBYSxDQUFDLE1BQU0sSUFBSSxDQUFDO1lBQy9DLE9BQU87UUFFUixJQUFJLFlBQVksR0FBRztZQUNsQixFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFO1lBQzFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUU7WUFDMUMsRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFO1lBQ3JELEVBQUUsSUFBSSxFQUFFLGVBQWUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUU7U0FDcEQsQ0FBQztRQUVGLElBQUksWUFBWSxHQUFHLGFBQWEsQ0FBQyxNQUFNLEdBQUcsQ0FBRSxRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDO1FBQ3BFLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBRSx5QkFBeUIsQ0FBRyxDQUFDO1FBRTdDLEtBQU0sSUFBSSxPQUFPLElBQUksYUFBYSxFQUNsQztZQUNDLElBQUssQ0FBQyxPQUFPO2dCQUNaLFNBQVM7WUFFVixJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDO1lBQ2hDLElBQUksS0FBSyxHQUFHLGFBQWEsQ0FBQyxPQUFPLENBQUUsT0FBTyxDQUFFLENBQUM7WUFDN0MsSUFBSyxLQUFLLElBQUksUUFBUSxJQUFJLFFBQVEsSUFBSSxDQUFDO2dCQUN0QyxLQUFLLElBQUksQ0FBQyxDQUFDO1lBRVosSUFBSyxNQUFNLElBQUksU0FBUyxFQUN4QjtnQkFDQyxJQUFJLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDO2dCQUV4QixJQUFJLGVBQWUsR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsZ0JBQWdCLEdBQUcsSUFBSSxDQUFFLENBQUM7Z0JBQ2hGLGVBQWUsQ0FBQyxRQUFRLENBQUUsNkJBQTZCLENBQUUsQ0FBQztnQkFDMUQsZUFBZSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBRSxLQUFLLEdBQUcsRUFBRSxDQUFFLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBRXpELElBQUksTUFBTSxHQUFHLGVBQWUsQ0FBQyxJQUFJLENBQUUsZUFBZSxFQUFFLElBQUksRUFBRSxLQUFLLENBQUUsQ0FBQztnQkFJbEUsSUFBSSxPQUFPLEdBQUcsWUFBWSxDQUFDLDZCQUE2QixDQUFFLE1BQU0sQ0FBRSxNQUFNLENBQUMsU0FBUyxDQUFFLENBQUUsQ0FBQztnQkFDdkYsSUFBSSxZQUFZLEdBQUcsQ0FBQyxDQUFFLFNBQVMsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFFLFFBQVEsQ0FBRSxDQUFFLENBQUM7Z0JBQ2xFLElBQUssWUFBWSxFQUNqQjtvQkFDQyxJQUFJLFFBQVEsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUN2QyxJQUFJLFdBQVcsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUU3QyxlQUFlLENBQUMsV0FBVyxDQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLFdBQVcsQ0FBRSxDQUFDO2lCQUd0RTtnQkFFRCxlQUFlLENBQUMsUUFBUSxDQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsWUFBWSxDQUFFLENBQUM7Z0JBQ3ZELGVBQWUsQ0FBQyxRQUFRLENBQUUsTUFBTSxFQUFFLElBQUksQ0FBRSxDQUFDO2dCQUN6QyxlQUFlLENBQUMsYUFBYSxDQUFFLE1BQU0sRUFBRSxJQUFJLENBQUUsQ0FBQztnQkFDOUMsZUFBZSxDQUFDLFNBQVMsQ0FBRSxNQUFNLEVBQUUsSUFBSSxDQUFFLENBQUM7Z0JBQzFDLGVBQWUsQ0FBQyxnQkFBZ0IsQ0FBRSxNQUFNLEVBQUUsSUFBSSxDQUFFLENBQUM7Z0JBRWpELENBQUMsQ0FBQyxRQUFRLENBQUUsbUJBQW1CLEdBQUcsQ0FBRSxLQUFLLEdBQUcsZ0JBQWdCLENBQUUsRUFBRSx1QkFBdUIsQ0FBQyxJQUFJLENBQUUsU0FBUyxFQUFFLGVBQWUsRUFBRSxLQUFLLEVBQUUsWUFBWSxDQUFFLENBQUUsQ0FBQzthQUNsSjtpQkFFRDthQUVDO1NBQ0Q7UUFFRCxLQUFNLElBQUksS0FBSyxJQUFJLFlBQVksRUFDL0I7WUFDQyxJQUFLLEtBQUssQ0FBQyxNQUFNO2dCQUNoQixlQUFlLENBQUMsYUFBYSxDQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBRSxDQUFDO1NBQzNEO0lBQ0YsQ0FBQztJQUVELFNBQVMsYUFBYSxDQUFHLENBQWdELEVBQUUsQ0FBZ0Q7UUFFMUgsSUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFFLENBQUMsQ0FBRSxZQUFZLENBQUUsQ0FBRSxDQUFDO1FBQ3pDLElBQUksTUFBTSxHQUFHLE1BQU0sQ0FBRSxDQUFDLENBQUUsWUFBWSxDQUFFLENBQUUsQ0FBQztRQUV6QyxJQUFJLE9BQU8sR0FBRyxNQUFNLENBQUUsQ0FBQyxDQUFFLE1BQU0sQ0FBRSxDQUFFLENBQUM7UUFDcEMsSUFBSSxPQUFPLEdBQUcsTUFBTSxDQUFFLENBQUMsQ0FBRSxNQUFNLENBQUUsQ0FBRSxDQUFDO1FBRXBDLElBQUssTUFBTSxJQUFJLE1BQU0sRUFDckI7WUFDQyxPQUFPLE1BQU0sR0FBRyxNQUFNLENBQUM7U0FDdkI7YUFFRDtZQUNDLE9BQU8sT0FBTyxHQUFHLE9BQU8sQ0FBQztTQUN6QjtJQUNGLENBQUM7SUFFRCxTQUFTLGNBQWMsQ0FBRyxDQUFnRCxFQUFFLENBQWdEO1FBRTNILElBQUksT0FBTyxHQUFHLFdBQVcsQ0FBQyxjQUFjLENBQUUsQ0FBQyxDQUFFLE1BQU0sQ0FBRSxDQUFFLENBQUM7UUFDeEQsSUFBSSxPQUFPLEdBQUcsV0FBVyxDQUFDLGNBQWMsQ0FBRSxDQUFDLENBQUUsTUFBTSxDQUFFLENBQUUsQ0FBQztRQUV4RCxJQUFJLE9BQU8sR0FBRyxNQUFNLENBQUUsQ0FBQyxDQUFFLE1BQU0sQ0FBRSxDQUFFLENBQUM7UUFDcEMsSUFBSSxPQUFPLEdBQUcsTUFBTSxDQUFFLENBQUMsQ0FBRSxNQUFNLENBQUUsQ0FBRSxDQUFDO1FBRXBDLElBQUssT0FBTyxJQUFJLE9BQU8sRUFDdkI7WUFDQyxPQUFPLE9BQU8sR0FBRyxPQUFPLENBQUM7U0FDekI7YUFFRDtZQUNDLE9BQU8sT0FBTyxHQUFHLE9BQU8sQ0FBQztTQUN6QjtJQUNGLENBQUM7SUFFRCxTQUFTLFlBQVksQ0FBRyxJQUFZLEVBQUUsYUFBOEQ7UUFFbkcsSUFBSSxRQUFRLENBQUM7UUFDYixJQUFJLG1CQUFtQixDQUFDO1FBRXhCLFFBQVMsSUFBSSxFQUNiO1lBQ0EsS0FBSyxjQUFjO2dCQUNsQixhQUFhLENBQUMsSUFBSSxDQUFFLGFBQWEsQ0FBRSxDQUFDO2dCQUNwQyxNQUFNO1lBR1AsS0FBSyxxREFBcUQ7Z0JBQ3pELElBQUssY0FBYztvQkFDbEIsY0FBYyxDQUFDLGNBQWMsQ0FBRSxNQUFNLENBQUU7b0JBQ3ZDLENBQUUsYUFBYSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksY0FBZSxDQUFDLElBQUksQ0FBRSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUUsRUFDM0U7b0JBRUMsUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUUsYUFBYSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUUsQ0FBQztvQkFDbEQsYUFBYSxHQUFHLGFBQWEsQ0FBQyxNQUFNLENBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUUsTUFBTSxDQUFFLElBQUksY0FBZSxDQUFFLE1BQU0sQ0FBRSxDQUFFLENBQUM7b0JBQ2hHLGFBQWEsQ0FBQyxNQUFNLENBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxjQUFjLENBQUUsQ0FBQztpQkFDcEQ7Z0JBQ0QsTUFBTTtZQUVQLEtBQUssZ0RBQWdEO2dCQUNwRCxJQUFLLGNBQWMsSUFBSSxhQUFhLENBQUMsUUFBUSxDQUFFLGNBQWMsQ0FBRSxFQUMvRDtvQkFFQyxtQkFBbUIsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFFLGFBQWEsQ0FBQyxPQUFPLENBQUUsY0FBYyxDQUFFLEVBQUUsQ0FBQyxDQUFFLENBQUM7b0JBQzdFLGFBQWEsR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFFLE1BQU0sQ0FBRSxJQUFJLGNBQWUsQ0FBRSxNQUFNLENBQUUsQ0FBRSxDQUFDO29CQUNoRyxhQUFhLENBQUMsTUFBTSxDQUFFLG1CQUFtQixFQUFFLENBQUMsRUFBRSxjQUFjLENBQUUsQ0FBQztpQkFDL0Q7Z0JBQ0QsTUFBTTtZQUVQLEtBQUssWUFBWSxDQUFDO1lBQ2xCLEtBQUssT0FBTyxDQUFDO1lBQ2IsS0FBSyxRQUFRLENBQUM7WUFDZCxLQUFLLFFBQVEsQ0FBQztZQUNkO2dCQUNDLE1BQU07U0FDTjtRQUVELE9BQU8sYUFBYSxDQUFDO0lBQ3RCLENBQUM7SUFFRCxTQUFTLGNBQWM7UUFFdEIsSUFBSSxJQUFJLEdBQUcsNEJBQTRCLEVBQUUsQ0FBQztRQUMxQyxJQUFJLGFBQWEsR0FBRyxzQkFBc0IsQ0FBRSxJQUFJLENBQUUsQ0FBQztRQUVuRCxLQUFNLElBQUksT0FBTyxJQUFJLGFBQWEsRUFDbEM7WUFDQyxJQUFLLENBQUMsT0FBTztnQkFDWixTQUFTO1lBRVYsSUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztZQUV4QixJQUFJLGVBQWUsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsaUJBQWlCLENBQUUsZ0JBQWdCLEdBQUcsSUFBSSxDQUFFLENBQUM7WUFDdkYsSUFBSyxlQUFlLEVBQ3BCO2dCQUNDLElBQUksTUFBTSxHQUFHLGVBQWUsQ0FBQyxPQUFPLENBQUUsZUFBZSxDQUFFLENBQUM7Z0JBQ3hELGVBQWUsQ0FBQyxhQUFhLENBQUUsTUFBTSxFQUFFLElBQUksQ0FBRSxDQUFDO2FBQzlDO1NBQ0Q7SUFDRixDQUFDO0lBRUQsU0FBZ0IsS0FBSztRQUVwQixVQUFVLEVBQUUsQ0FBQztRQUNiLENBQUMsQ0FBQyxhQUFhLENBQUUscUJBQXFCLEVBQUUsMEJBQTBCLEVBQUUsT0FBTyxDQUFFLENBQUM7SUFDL0UsQ0FBQztJQUplLG9CQUFLLFFBSXBCLENBQUE7SUFFRCxTQUFnQixRQUFRO1FBRXZCLENBQUMsQ0FBRSx5QkFBeUIsQ0FBRyxDQUFDLDZCQUE2QixDQUFFLHFCQUFxQixDQUFFLENBQUMsT0FBTyxDQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBRSxFQUFFLENBQUUsQ0FBRSxDQUFDO1FBQzdILENBQUMsQ0FBRSx5QkFBeUIsQ0FBRyxDQUFDLHVCQUF1QixFQUFFLENBQUM7SUFDM0QsQ0FBQztJQUplLHVCQUFRLFdBSXZCLENBQUE7SUFLRDtRQUNDLENBQUMsQ0FBQyx5QkFBeUIsQ0FBRSx5QkFBeUIsRUFBRSxjQUFjLENBQUUsQ0FBQztLQUN6RTtBQUNGLENBQUMsRUExa0JTLGNBQWMsS0FBZCxjQUFjLFFBMGtCdkIifQ==