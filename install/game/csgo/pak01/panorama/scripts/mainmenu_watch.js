"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="matchlist.ts" />
/// <reference path="watchtile.ts" />
/// <reference path="common/commonutil.ts" />
/// <reference path="common/scheduler.ts" />
/// <reference path="common/licenseutil.ts" />
/// <reference path="common/iteminfo.ts" />
/// <reference path="common/formattext.ts" />
/// <reference path="generated/items_event_current_generated_store.ts" />
var mainmenu_watch;
(function (mainmenu_watch) {
    let _m_bPerfectWorld = (MyPersonaAPI.GetLauncherType() === 'perfectworld');
    let _m_activeTab;
    let _m_myXuid = MyPersonaAPI.GetXuid();
    let MATCHLISTDESCRIPTOR = {
        "JsLive": "live",
        "JsYourMatches": _m_myXuid,
        "JsDownloaded": "downloaded"
    };
    let MATCHLISTTABBYNAME = {
        "live": "JsLive",
        "downloaded": "JsDownloaded",
        [_m_myXuid]: "JsYourMatches"
    };
    function GetActiveTab() {
        return _m_activeTab;
    }
    mainmenu_watch.GetActiveTab = GetActiveTab;
    function _PopulateStreamList(parentPanel) {
        let streamNum = StreamsAPI.GetStreamCount();
        let count = 9;
        if (streamNum < 9) {
            count = streamNum;
        }
        let elStreamList = parentPanel.FindChildTraverse("JsStreamList");
        for (let i = 0; i < elStreamList.GetChildCount(); i++) {
            elStreamList.GetChild(i).Data().markForDelete = true;
        }
        if (count === 0) {
            matchList.ShowListSpinner(false, parentPanel);
            matchList.SetListMessage($.Localize("#CSGO_Watch_NoSteams"), true, parentPanel);
            matchList.ShowInfoPanel(false, parentPanel);
        }
        else {
            matchList.SetListMessage("", false, parentPanel);
            matchList.ShowInfoPanel(true, parentPanel);
        }
        function _SendToTwitch(streamId) {
            let url = StreamsAPI.GetStreamVideoFeedByName(streamId);
            SteamOverlayAPI.OpenExternalBrowserURL(url);
        }
        function _ClearList(elListPanel) {
            let activeTiles = elListPanel.Children();
            for (let i = activeTiles.length - 1; i >= 0; i--) {
                if (activeTiles[i].Data().markForDelete) {
                    if (elListPanel.Data().activeButton === activeTiles[i]) {
                        elListPanel.Data().activeButton = undefined;
                    }
                    activeTiles[i].checked = false;
                    watchTile.Delete(activeTiles[i]);
                }
            }
        }
        for (let i = 0; i < count; i++) {
            let streamName = StreamsAPI.GetStreamNameByIndex(i);
            let elStreamPanel = elStreamList.FindChildInLayoutFile("TwitchStream_" + streamName);
            if (elStreamPanel == undefined) {
                let elStreamPanel = $.CreatePanel('Button', elStreamList, "TwitchStream_" + streamName);
                let streamCountry = StreamsAPI.GetStreamCountryByName(streamName);
                elStreamPanel.BLoadLayout("file://{resources}/layout/matchtiles/streams.xml", false, false);
                let elStreamText = elStreamPanel.FindChildTraverse('Text-Panel');
                elStreamPanel.FindChildInLayoutFile('stream-button__blur-target').AddBlurPanel(elStreamText);
                elStreamPanel.SetDialogVariable('streamText', StreamsAPI.GetStreamTextDescriptionByName(streamName));
                elStreamPanel.SetDialogVariable("numberOfViewers", (StreamsAPI.GetStreamViewersByName(streamName)).toString());
                elStreamPanel.SetDialogVariable("channel", StreamsAPI.GetStreamDisplayNameByName(streamName));
                elStreamPanel.FindChildTraverse("TwitchThumb").SetImage(StreamsAPI.GetStreamPreviewImageByName(streamName));
                CommonUtil.SetLanguageOnLabel(streamCountry, elStreamPanel);
                elStreamPanel.SetPanelEvent('onactivate', _SendToTwitch.bind(undefined, streamName));
            }
            elStreamPanel.Data().markForDelete = false;
        }
        _ClearList(parentPanel.FindChildTraverse("JsStreamList"));
    }
    function _OnMouseOverTextTooltip(_panel, _text) {
        UiToolkitAPI.ShowTextTooltip(_panel, _text);
    }
    function _OnMouseOutTextTooltip() {
        UiToolkitAPI.HideTextTooltip();
    }
    function _PopulateTournamentPage(parentPanel) {
        let elTournamentList = parentPanel.FindChildTraverse("JsTournamentList");
        if (!elTournamentList.FindChildTraverse("other-tournaments")) {
            elTournamentList.BLoadLayout("file://{resources}/layout/matchtiles/tournament_page.xml", false, false);
            let pastTournamentPanel = elTournamentList.FindChildTraverse("other-tournaments");
            let maxTournaments = g_ActiveTournamentInfo.eventid;
            for (let i = maxTournaments; i >= 1; i--) {
                if (i == 2)
                    continue;
                if (i == 17)
                    continue;
                let elTournamentPanel = $.CreatePanel('Panel', pastTournamentPanel, "Tournament_" + i);
                elTournamentPanel.BLoadLayoutSnippet("tournament_tile");
                elTournamentPanel.SetDialogVariable('tournament-title', $.Localize('#CSGO_Tournament_Event_Location_' + i));
                let elTOLogo = elTournamentPanel.FindChildTraverse('id-tournament-to-logo');
                elTOLogo.SetImage('file://{images}/tournaments/events/tournament_logo_' + i + '.svg');
                elTOLogo.GetParent().SetHasClass('tall-logo', i == 22 || i == 24 || i == 25 || i == 27);
                let ProEventJSO = TournamentsAPI.GetProEventDataJSO(i, 8);
                let oWinningTeam;
                let hasEventData = false;
                if (ProEventJSO
                    && ProEventJSO.hasOwnProperty('eventdata')
                    && ProEventJSO['eventdata'].hasOwnProperty(i)) {
                    oWinningTeam = ProEventJSO['eventdata'][i][0];
                    hasEventData = true;
                }
                let elChampions = elTournamentPanel.FindChildTraverse('JsChampions');
                _SetTeam(elChampions, oWinningTeam, i, false);
                let elLegendsContainer = elTournamentPanel.FindChildTraverse('JsLegendsContainer');
                let elPlayerRoot = elTournamentPanel.FindChildTraverse("JsPlayersContainer");
                let elHoverPanel = elTournamentPanel.FindChildTraverse('JsChampionsHoverTarget');
                _PopulateTeamPlayers(elPlayerRoot, elHoverPanel, elLegendsContainer, oWinningTeam, i);
                for (let iTeam = 1; iTeam < 8; iTeam++) {
                    let oTeam;
                    if (hasEventData &&
                        ProEventJSO['eventdata'][i].hasOwnProperty(iTeam) &&
                        ProEventJSO['eventdata'][i][iTeam]) {
                        oTeam = ProEventJSO['eventdata'][i][iTeam];
                    }
                    let elLegend = $.CreatePanel('Panel', elLegendsContainer, iTeam.toString());
                    elLegend.BLoadLayoutSnippet("snippet-tournament-legends");
                    _SetTeam(elLegend, oTeam, i);
                }
                let elModel = elTournamentPanel.FindChildTraverse('ParticleModel');
                elModel.StopParticlesImmediately(true);
                elModel.StartParticles();
                elModel.SetControlPoint(4, 0, 0, -80);
                let elButton = elTournamentPanel.FindChild('JsTournamentContent');
                let image = 'url("file://{images}/tournaments/events/bg_' + i + '.png")';
                if (elButton?.IsValid() && elButton) {
                    elButton.style.backgroundImage = image;
                    elButton.style.backgroundPosition = '50% 50%';
                    elButton.style.backgroundSize = 'auto 110%';
                    elButton.style.backgroundImgOpacity = '.7';
                    if ((i == maxTournaments) && (g_ActiveTournamentInfo.active)) {
                        elButton.SetPanelEvent('onactivate', () => {
                            UiToolkitAPI.ShowCustomLayoutPopupParameters('id-popup-major-hub', 'file://{resources}/layout/popups/popup_major_hub.xml', 'eventid=' + i);
                        });
                    }
                }
            }
        }
        function _SetTeam(elTeam, oTeamData, uniqueIdentifier, bTooltip = true) {
            let elTeamLogo = elTeam.FindChildTraverse('JsTeamLogo');
            let teamName = $.Localize("#CSGO_PickEm_Team_TBD");
            let teamPlaceStr = "";
            if (oTeamData) {
                let team = oTeamData['team_id'];
                let teamTag = oTeamData['tag'];
                let teamGeo = oTeamData['geo'];
                let teamPlaceToken = oTeamData['place_token'];
                let teamLogo = 'file://{images}/tournaments/teams/' + teamTag.toLowerCase() + '.svg';
                teamName = $.Localize('#CSGO_TeamID_' + team);
                teamPlaceStr = $.Localize(teamPlaceToken);
                elTeamLogo.SetImage(teamLogo);
                if (bTooltip) {
                    let TooltipString = $.Localize(teamName);
                    let elTooltipAnchor = $.CreatePanel("Panel", elTeam, uniqueIdentifier + "_" + elTeam.id, { style: "	tooltip-position: bottom;" });
                }
            }
            elTeam.SetDialogVariable("team-place", teamPlaceStr);
            elTeam.SetDialogVariable("team-name", teamName);
        }
        function _PopulateTeamPlayers(elPlayerContainer, elHoverPanel, elLegendsContainer, oTeamData, eventid) {
            if (!oTeamData)
                return;
            let arrIndices = [0, 1, 2, 3, 4];
            for (let i = 0; i < 5; i++) {
                let n = arrIndices.splice(Math.floor(Math.random() * 5), 1)[0];
                arrIndices.push(n);
            }
            let arrTeamPlayers = Object.entries(oTeamData['players']);
            arrIndices.forEach(function (i) {
                let oPlayer = arrTeamPlayers[i][1];
                let elPlayer = $.CreatePanel('Panel', elPlayerContainer, 'JsPlayerCard');
                elPlayer.BLoadLayoutSnippet('snippet-tournament-player');
                let playername = oPlayer['name'];
                let steamid64 = oPlayer['accountid64'];
                if (eventid === 26 && playername === 'kyxsan') {
                    playername = 'karrigan';
                    steamid64 = '76561197989430253';
                }
                elPlayer.SetDialogVariable('tournament-player-name', playername);
                let elPlayerImage = elPlayer.FindChildTraverse('JsTournamentPlayerPhoto');
                if (elPlayerImage) {
                    let photo_url = "file://{images}/tournaments/avatars/" + eventid + "/" + steamid64 + ".png";
                    elPlayerImage.SetImage(photo_url);
                }
            });
            elHoverPanel.AddClass("has-team-data");
            elHoverPanel.SetPanelEvent('onmouseover', function (elPlayerContainer, elLegendsContainer) { _RevealPlayers(elPlayerContainer, elLegendsContainer); }.bind(undefined, elPlayerContainer, elLegendsContainer));
            elHoverPanel.SetPanelEvent('onmouseout', function (elPlayerContainer, elLegendsContainer) { _HidePlayers(elPlayerContainer, elLegendsContainer); }.bind(undefined, elPlayerContainer, elLegendsContainer));
            function _RevealPlayers(elPlayerContainer, elLegendsContainer) {
                let arrElPlayers = elPlayerContainer.Children();
                elLegendsContainer.AddClass('hidden');
                const DELAY_INIT = 0;
                const DELAY_DELTA = 0.1;
                arrElPlayers.forEach(function (elPlayer, i) {
                    let delay = DELAY_INIT + i * DELAY_DELTA;
                    Scheduler.Schedule(delay, () => {
                        if (elPlayer && elPlayer.IsValid())
                            elPlayer.RemoveClass('hidden');
                        Scheduler.Schedule(0.1, function () {
                            $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.mainmenu_rollover', 'MOUSE');
                        }, "player-reveal");
                    }, "player-reveal");
                });
            }
            function _HidePlayers(elPlayerContainer, elLegendsContainer) {
                elLegendsContainer.RemoveClass('hidden');
                let arrElPlayers = elPlayerContainer.Children();
                Scheduler.Cancel("player-reveal");
                arrElPlayers.forEach(function (elPlayer) {
                    elPlayer.AddClass('hidden');
                });
            }
        }
    }
    function _UpdateTab(elTab, optbFromMatchListChangeEvent = false) {
        elTab.SetReadyForDisplay(true);
        elTab.visible = true;
        switch (elTab.id) {
            case "JsTournaments":
                _PopulateTournamentPage(elTab);
                break;
            case "JsYourMatches":
            case "JsDownloaded":
            case "JsLive":
                matchList.UpdateMatchList(elTab, MATCHLISTDESCRIPTOR[elTab.id], optbFromMatchListChangeEvent);
                break;
            case "JsEvents":
                TournamentsAPI.RequestTournaments();
                break;
        }
    }
    function UpdateActiveTab() {
        if (_m_activeTab) {
            _UpdateTab(_m_activeTab);
        }
    }
    mainmenu_watch.UpdateActiveTab = UpdateActiveTab;
    function _UpdateMatchList(listId, optbFromMatchListChangeEvent) {
        let tabbyid = MATCHLISTTABBYNAME[listId];
        if (tabbyid) {
            _UpdateTab($("#" + tabbyid), optbFromMatchListChangeEvent);
        }
    }
    function _UpdateMatchListFromMatchListChangeEvent(listId) {
        _UpdateMatchList(listId, true);
    }
    function NavigateToTab(tab = '') {
        const pressedTab = $('#' + tab);
        if (_m_activeTab != pressedTab) {
            if (_m_activeTab) {
                _m_activeTab.AddClass('WatchMenu--Hide');
            }
            _m_activeTab = pressedTab;
            if (!_m_activeTab) {
                return;
            }
            _m_activeTab.RemoveClass('WatchMenu--Hide');
        }
        _UpdateTab(_m_activeTab);
    }
    mainmenu_watch.NavigateToTab = NavigateToTab;
    function _InitResourceManagement(elTab) {
        $.RegisterEventHandler('PropertyTransitionEnd', elTab, (panelName, propertyName) => {
            if (elTab === panelName && propertyName === 'opacity') {
                if (elTab.visible === true && elTab.BIsTransparent()) {
                    elTab.visible = false;
                    elTab.SetReadyForDisplay(false);
                    return true;
                }
            }
            return false;
        });
        elTab.Data().elMainMenuRoot = $.GetContextPanel().Data().elMainMenuRoot;
    }
    function _InitTab(tab) {
        let elTab = $('#' + tab);
        if (!elTab.BLoadLayoutSnippet("MatchListAndInfo")) {
        }
        _InitResourceManagement(elTab);
    }
    function InitMainWatchPanel() {
        _m_activeTab = null;
        $.RegisterForUnhandledEvent("PanoramaComponent_MatchList_StateChange", _UpdateMatchListFromMatchListChangeEvent);
        _InitTab('JsYourMatches');
        _InitTab('JsDownloaded');
        _InitTab('JsLive');
        _InitResourceManagement($('#JsTournaments'));
        if (_m_bPerfectWorld) {
            let elWatchNavBarButtonStreams = $('#WatchNavBarButtonStreams');
            if (elWatchNavBarButtonStreams)
                elWatchNavBarButtonStreams.DeleteAsync(.0);
            elWatchNavBarButtonStreams = $('#WatchNavBarButtonEvents');
            if (elWatchNavBarButtonStreams)
                elWatchNavBarButtonStreams.DeleteAsync(.0);
        }
        else {
            _InitResourceManagement($('#JsEvents'));
        }
        NavigateToTab('JsYourMatches');
        $('#WatchNavBarYourMatches').checked = true;
    }
    mainmenu_watch.InitMainWatchPanel = InitMainWatchPanel;
    let _RunEveryTimeWatchIsShown = function () {
        if (!MyPersonaAPI.IsInventoryValid() || !MyPersonaAPI.IsConnectedToGC()) {
            UiToolkitAPI.ShowGenericPopupOk($.Localize('#SFUI_SteamConnectionErrorTitle'), $.Localize('#SFUI_Steam_Error_LinkUnexpected'), '', function () {
                $.DispatchEvent('HideContentPanel');
            });
        }
    };
    function OnReadyForDisplay() {
    }
    mainmenu_watch.OnReadyForDisplay = OnReadyForDisplay;
    ;
})(mainmenu_watch || (mainmenu_watch = {}));
(function () {
    $.RegisterEventHandler('ReadyForDisplay', $('#JsWatch'), mainmenu_watch.OnReadyForDisplay);
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbm1lbnVfd2F0Y2guanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9tYWlubWVudV93YXRjaC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBQ2xDLHFDQUFxQztBQUNyQyxxQ0FBcUM7QUFDckMsNkNBQTZDO0FBQzdDLDRDQUE0QztBQUM1Qyw4Q0FBOEM7QUFDOUMsMkNBQTJDO0FBQzNDLDZDQUE2QztBQUM3Qyx5RUFBeUU7QUFJekUsSUFBVSxjQUFjLENBa2hCdkI7QUFsaEJELFdBQVUsY0FBYztJQUV2QixJQUFJLGdCQUFnQixHQUFHLENBQUUsWUFBWSxDQUFDLGVBQWUsRUFBRSxLQUFLLGNBQWMsQ0FBRSxDQUFDO0lBQzdFLElBQUksWUFBNEIsQ0FBQztJQUNqQyxJQUFJLFNBQVMsR0FBVyxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDL0MsSUFBSSxtQkFBbUIsR0FBRztRQUN6QixRQUFRLEVBQUUsTUFBTTtRQUNoQixlQUFlLEVBQUUsU0FBUztRQUMxQixjQUFjLEVBQUUsWUFBWTtLQUM1QixDQUFDO0lBQ0YsSUFBSSxrQkFBa0IsR0FBdUI7UUFDNUMsTUFBTSxFQUFFLFFBQVE7UUFDaEIsWUFBWSxFQUFFLGNBQWM7UUFDNUIsQ0FBQyxTQUFTLENBQUMsRUFBRSxlQUFlO0tBQzVCLENBQUM7SUFFQyxTQUFnQixZQUFZO1FBRXhCLE9BQU8sWUFBWSxDQUFDO0lBQ3hCLENBQUM7SUFIZSwyQkFBWSxlQUczQixDQUFBO0lBTUosU0FBUyxtQkFBbUIsQ0FBRyxXQUFvQjtRQUdsRCxJQUFJLFNBQVMsR0FBRyxVQUFVLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDNUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO1FBQ2QsSUFBSyxTQUFTLEdBQUcsQ0FBQyxFQUNsQjtZQUNDLEtBQUssR0FBRyxTQUFTLENBQUM7U0FDbEI7UUFFRCxJQUFJLFlB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