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
            // we never unregister this one
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
            let maxWinsInASingleMap = 3; // min 3
            let mapList = _GetMapsList();
            // initial pass: find the window stats objects - do all the logic upfront to avoid re-fetching the JSOs
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
            // first pass: find scale for graph
            for (let p = 0; p < nPlayers; p++) {
                let RankWindowObject = wso[p];
                let playerWins = mapList.map((mapName) => { return mapName.startsWith('de_') ? Number(RankWindowObject[mapName] | 0) : 0; });
                totalWins = totalWins + playerWins.reduce((a, b) => a + b, 0);
                maxWinsInASingleMap = Math.max(maxWinsInASingleMap, Math.max.apply(null, playerWins));
            }
            _DrawGuides(maxWinsInASingleMap);
            _SetTitle(totalWins);
            // second pass: draw players at scale
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
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        Init();
    }
})(PremierMapWinRecord || (PremierMapWinRecord = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlbWllcl9tYXB3aW5yZWNvcmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wcmVtaWVyX21hcHdpbnJlY29yZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBQ2xDLDRDQUE0QztBQUM1Qyw0Q0FBNEM7QUFFNUMsSUFBVSxtQkFBbUIsQ0EyTjVCO0FBM05ELFdBQVUsbUJBQW1CO0lBSTVCLE1BQU0sU0FBUyxHQUFHLENBQUMsQ0FBQztJQUNwQixNQUFNLFdBQVcsR0FBRyxDQUFDLENBQUUsdUJBQXVCLENBQW1CLENBQUM7SUFDbEUsSUFBSSxnQ0FBd0MsQ0FBQztJQUM3QyxJQUFJLG9DQUE0QyxDQUFDO0lBQ2pELElBQUksbUJBQW1CLEdBQUcsS0FBSyxDQUFDO0lBRWhDLFNBQVMsSUFBSTtRQUVaLHFCQUFxQixFQUFFLENBQUM7UUFFeEIsSUFBSyxXQUFXLENBQUMsWUFBWSxFQUFFLEVBQy9CO1lBQ0MsSUFBSSxFQUFFLENBQUM7U0FDUDthQUVEO1lBQ0MsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxHQUFHLEVBQUUsSUFBSSxDQUFFLENBQUM7U0FDeEI7SUFDRixDQUFDO0lBRUQsU0FBUyxxQkFBcUI7UUFFN0IsSUFBSyxDQUFDLG1CQUFtQixFQUN6QjtZQUNDLGdDQUFnQyxHQUFHLENBQUMsQ0FBQyx5QkFBeUIsQ0FBRSx1Q0FBdUMsRUFBRSxJQUFJLENBQUUsQ0FBQztZQUNoSCxvQ0FBb0MsR0FBRyxDQUFDLENBQUMseUJBQXlCLENBQUUsd0JBQXdCLEVBQUUsZ0JBQWdCLENBQUUsQ0FBQztZQUVqSCxDQUFDLENBQUMseUJBQXlCLENBQUUsa0JBQWtCLEVBQUUsdUJBQXVCLENBQUUsQ0FBQztZQUMzRSxDQUFDLENBQUMseUJBQXlCLENBQUUsa0JBQWtCLEVBQUUscUJBQXFCLENBQUUsQ0FBQztZQUV6RSwrQkFBK0I7WUFDL0IsQ0FBQyxDQUFD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