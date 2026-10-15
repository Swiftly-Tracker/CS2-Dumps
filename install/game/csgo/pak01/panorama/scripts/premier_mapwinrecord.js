"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/teamcolor.ts" />
/// <reference path="common/formattext.ts"/>
var PremierMapWinRecord;
(function (PremierMapWinRecord) {
    const m_numMaps = 7;
    const spiderGraph = $('#jsMapWinsSpiderGraph');
    var m_LobbyPlayerUpdatedEventHandler;
    var m_LeaderboardHoverPlayerEventHandler;
    var m_bEventsRegistered = false;
    function Init() {
        RegisterEventHandlers();
        if (spiderGraph.BCanvasReady()) {
            Draw();
        }
        else {
            $.Schedule(0.1, Init);
        }
    }
    function RegisterEventHandlers() {
        if (!m_bEventsRegistered) {
            m_LobbyPlayerUpdatedEventHandler = $.RegisterForUnhandledEvent("PanoramaComponent_Lobby_PlayerUpdated", Draw);
            m_LeaderboardHoverPlayerEventHandler = $.RegisterForUnhandledEvent("LeaderboardHoverPlayer", _HighlightPlayer);
            $.RegisterForUnhandledEvent("CSGOHideMainMenu", UnregisterEventHandlers);
            $.RegisterForUnhandledEvent("CSGOShowMainMenu", RegisterEventHandlers);
            $.RegisterEventHandler('ReadyForDisplay', $.GetContextPanel(), Draw);
            m_bEventsRegistered = true;
        }
    }
    function UnregisterEventHandlers() {
        if (m_bEventsRegistered) {
            $.UnregisterForUnhandledEvent('PanoramaComponent_Lobby_PlayerUpdated', m_LobbyPlayerUpdatedEventHandler);
            $.UnregisterForUnhandledEvent('LeaderboardHoverPlayer', m_LeaderboardHoverPlayerEventHandler);
            m_bEventsRegistered = false;
        }
    }
    function Draw() {
        _DrawParty();
        _MakeMapPanels();
    }
    PremierMapWinRecord.Draw = Draw;
    function _HighlightPlayer(xuid) {
        _DrawParty(xuid);
    }
    const oAlpha = {
        'normal': { 'outer': 0.5, 'inner': 0.1 },
        'dim': { 'outer': 0.2, 'inner': 0 },
        'hilit': { 'outer': 1, 'inner': 0.2 },
    };
    function _DrawPlayerPlot(arrValues, rgb, max, plotType = 'normal') {
        let rgbColorOuter = 'rgba(' + rgb + ',' + oAlpha[plotType].outer + ')';
        let rgbColorInner = 'rgba(' + rgb + ',' + oAlpha[plotType].inner + ')';
        arrValues = arrValues.map(a => a / max);
        const options = {
            line_color: rgbColorOuter,
            line_thickness: 3,
            line_softness: 10,
            fill_color_inner: rgbColorInner,
            fill_color_outer: rgbColorInner,
        };
        spiderGraph.DrawGraphPoly(arrValues, options);
    }
    function _GetMapsList() {
        return Object.keys(FriendsListAPI.GetFriendCompetitivePremierWindowStatsObject("0"));
    }
    function _DrawGuides(maxWinsInASingleMap) {
        spiderGraph.ClearJS('rgba(0,0,0,0)');
        const options = {
            bkg_color: "#00000080",
            spokes_color: '#ffffff10',
            spoke_thickness: 2,
            spoke_softness: 100,
            spoke_length_scale: 1.2,
            guideline_color: '#ffffff10',
            guideline_thickness: 2,
            guideline_softness: 100,
            guideline_count: maxWinsInASingleMap + 1,
            deadzone_percent: 0.1,
            scale: 0.70
        };
        spiderGraph.SetGraphOptions(options);
        spiderGraph.DrawGraphBackground(m_numMaps);
    }
    function _SetTitle(totalWins) {
        const pLabel = $('#jsMapWinsLabel');
        pLabel.text = $.ConstructString("#mapwinrecord_graph_title:f", { wins: totalWins });
    }
    function _DrawParty(highlightedPlayerXuid = '') {
        if (LobbyAPI.IsSessionActive()) {
            const party = LobbyAPI.GetSessionSettings().members;
            const nPlayers = party.numPlayers;
            let totalWins = 0;
            let maxWinsInASingleMap = 3;
            let mapList = _GetMapsList();
            let wso = [];
            let lbFallbackName = LeaderboardsAPI.GetCurrentSeasonPremierLeaderboard() + '.party';
            for (let p = 0; p < nPlayers; p++) {
                let xuid = party['machine' + p].player0.xuid;
                let playerObj = null;
                if (PartyListAPI.GetFriendCompetitiveRankType(xuid) === "Premier") {
                    var partyScore = PartyListAPI.GetFriendCompetitiveRank(xuid);
                    var partyWins = PartyListAPI.GetFriendCompetitiveWins(xuid);
                    if (partyScore || partyWins)
                        playerObj = PartyListAPI.GetFriendCompetitivePremierWindowStatsObject(xuid);
                }
                if (!playerObj) {
                    let objLbRow = LeaderboardsAPI.GetEntryDetailsObjectByXuid(lbFallbackName, xuid);
                    if (objLbRow && objLbRow.XUID && objLbRow.rankWindowStats)
                        playerObj = objLbRow.rankWindowStats;
                }
                if (!playerObj)
                    playerObj = PartyListAPI.GetFriendCompetitivePremierWindowStatsObject(xuid);
                wso.push(playerObj);
            }
            for (let p = 0; p < nPlayers; p++) {
                let RankWindowObject = wso[p];
                let playerWins = mapList.map((mapName) => { return mapName.startsWith('de_') ? Number(RankWindowObject[mapName] | 0) : 0; });
                totalWins = totalWins + playerWins.reduce((a, b) => a + b, 0);
                maxWinsInASingleMap = Math.max(maxWinsInASingleMap, Math.max.apply(null, playerWins));
            }
            _DrawGuides(maxWinsInASingleMap);
            _SetTitle(totalWins);
            for (let p = 0; p < nPlayers; p++) {
                let xuid = party['machine' + p].player0.xuid;
                let RankWindowObject = wso[p];
                let playerWins = mapList.map((mapName) => { return mapName.startsWith('de_') ? Number(RankWindowObject[mapName] | 0) : 0; });
                const teamColorIdx = PartyListAPI.GetPartyMemberSetting(xuid, 'game/teamcolor');
                const teamColorRgb = TeamColor.GetTeamColor(Number(teamColorIdx));
                let hilite = highlightedPlayerXuid === '' ? 'normal' : highlightedPlayerXuid === xuid ? 'hilit' : 'dim';
                _DrawPlayerPlot(playerWins, teamColorRgb, maxWinsInASingleMap, hilite);
            }
        }
    }
    function _MakeMapPanels() {
        let arrMaps = _GetMapsList();
        let elMapContainer = $.GetContextPanel().FindChildTraverse('jsMapWinsSpiderGraph');
        elMapContainer.RemoveAndDeleteChildren();
        for (let s = 0; s < m_numMaps; s++) {
            let elMap = $.CreatePanel('Panel', elMapContainer, String(s));
            elMap.BLoadLayoutSnippet('snippet-mwr-map');
            let elMapImage = elMap.FindChildInLayoutFile('mwr-map__image');
            let imageName = arrMaps[s];
            elMapImage.SetImage("file://{images}/map_icons/map_icon_" + imageName + ".svg");
            elMapImage.style.backgroundPosition = '50% 50%';
            elMapImage.style.backgroundSize = 'auto 150%';
            elMap.style.flowChildren = 'up';
            elMap.SetDialogVariable('map-name', $.Localize('#SFUI_Map_' + imageName));
            let vPos = spiderGraph.GraphPositionToUIPosition(s, 1.3);
            elMap.SetPositionInPixels(vPos.x, vPos.y, 0);
        }
    }
    {
        Init();
    }
})(PremierMapWinRecord || (PremierMapWinRecord = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlbWllcl9tYXB3aW5yZWNvcmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wcmVtaWVyX21hcHdpbnJlY29yZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBQ2xDLDRDQUE0QztBQUM1Qyw0Q0FBNEM7QUFFNUMsSUFBVSxtQkFBbUIsQ0EyTjVCO0FBM05ELFdBQVUsbUJBQW1CO0lBSTVCLE1BQU0sU0FBUyxHQUFHLENBQUMsQ0FBQztJQUNwQixNQUFNLFdBQVcsR0FBRyxDQUFDLENBQUUsdUJBQXVCLENBQW1CLENBQUM7SUFDbEUsSUFBSSxnQ0FBd0MsQ0FBQztJQUM3QyxJQUFJLG9DQUE0QyxDQUFDO0lBQ2pELElBQUksbUJBQW1CLEdBQUcsS0FBSyxDQUFDO0lBRWhDLFNBQVMsSUFBSTtRQUVaLHFCQUFxQixFQUFFLENBQUM7UUFFeEIsSUFBSyxXQUFXLENBQUMsWUFBWSxFQUFFLEVBQy9CO1lBQ0MsSUFBSSxFQUFFLENBQUM7U0FDUDthQUVEO1lBQ0MsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxHQUFHLEVBQUUsSUFBSSxDQUFFLENBQUM7U0FDeEI7SUFDRixDQUFDO0lBRUQsU0FBUyxxQkFBcUI7UUFFN0IsSUFBSyxDQUFDLG1CQUFtQixFQUN6QjtZQUNDLGdDQUFnQyxHQUFHLENBQUMsQ0FBQyx5QkFBeUIsQ0FBRSx1Q0FBdUMsRUFBRSxJQUFJLENBQUUsQ0FBQztZQUNoSCxvQ0FBb0MsR0FBRyxDQUFDLENBQUMseUJBQXlCLENBQUUsd0JBQXdCLEVBQUUsZ0JBQWdCLENBQUUsQ0FBQztZQUVqSCxDQUFDLENBQUMseUJBQXlCLENBQUUsa0JBQWtCLEVBQUUsdUJBQXVCLENBQUUsQ0FBQztZQUMzRSxDQUFDLENBQUMseUJBQXlCLENBQUUsa0JBQWtCLEVBQUUscUJBQXFCLENBQUUsQ0FBQztZQUd6RSxDQUFDLENBQUMsb0JBQW9CLENBQUUs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