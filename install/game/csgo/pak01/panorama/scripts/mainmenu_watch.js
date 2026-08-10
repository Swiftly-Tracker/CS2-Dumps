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
    let _m_contextTab;
    let _m_tabStack = [];
    let _m_contextPanel;
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
                elTOLogo.GetParent().SetHasClass('tall-logo', i == 22 || i == 24 || i == 25);
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
                    if (i == maxTournaments) {
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
            if (_m_activeTab.id === 'JsActiveTournament') {
                $.DispatchEvent('RefreshPickemPage', 'tournament:' + g_ActiveTournamentInfo.eventid);
                return;
            }
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
    function NavigateToTab(tab = '', xmlName = '', tournament_id = '', isSubTab = false, addToStack = false) {
        if (isSubTab && addToStack) {
            if (_m_tabStack.length > 0) {
                _m_tabStack[_m_tabStack.length - 1].AddClass("mainmenu-content--hidden");
            }
            else {
                if (!_m_contextPanel) {
                    _m_contextPanel = $("#main-content");
                }
                if (_m_contextPanel) {
                    _m_contextPanel.AddClass("mainmenu-content--hidden");
                }
            }
        }
        let parent = $.GetContextPanel().FindChildInLayoutFile(tab);
        if (isSubTab && !parent) {
            let newPanel = undefined;
            parent = $.CreatePanel('Panel', $('#JsWatchContent'), tab);
            parent.AddClass("mainmenu-content--popuptab");
            parent.AddClass("mainmenu-content--hidden");
            parent.AddClass("mainmenu-content__container");
            parent.AddClass("no-margin");
            parent.AddClass('hide');
            newPanel = $.CreatePanel('Panel', parent, "tournament_content_" + tournament_id);
            newPanel.Data().elMainMenuRoot = $.GetContextPanel().Data().elMainMenuRoot;
            parent.RemoveClass('hide');
            parent.RemoveClass('mainmenu-content--hidden');
            parent.Data().tournament_id = tournament_id;
            newPanel.BLoadLayout('file://{resources}/layout/' + xmlName + '.xml', false, false);
            newPanel.RegisterForReadyEvents(true);
            parent.Data().isSubTab = true;
            _InitResourceManagement(newPanel);
            $.DispatchEvent('InitializeTournamentsPage', newPanel, tournament_id);
        }
        let pressedTab = $('#' + tab);
        if (_m_activeTab != pressedTab) {
            if (!isSubTab) {
                if (_m_activeTab) {
                    if (!_m_activeTab.Data().isSubTab) {
                        _m_activeTab.AddClass('WatchMenu--Hide');
                    }
                    else {
                        _m_activeTab.AddClass('mainmenu-content--hidden');
                    }
                }
                _m_activeTab = pressedTab;
                _m_contextTab = pressedTab;
                if (!_m_contextPanel) {
                    _m_contextPanel = $("#main-content");
                }
                if (_m_contextPanel) {
                    _m_contextPanel.RemoveClass("mainmenu-content--hidden");
                }
                if (!_m_activeTab) {
                    return;
                }
                _m_activeTab.RemoveClass('WatchMenu--Hide');
            }
            else {
                if (!addToStack)
                    _m_activeTab.AddClass('mainmenu-content--hidden');
                _m_activeTab = pressedTab;
                _m_activeTab.SetFocus();
                if (!_m_activeTab) {
                    return;
                }
                _m_activeTab.RemoveClass('mainmenu-content--hidden');
                if (_m_activeTab.Data().tournament_id) {
                    matchList.ReselectActiveTile(_m_activeTab);
                }
                if (addToStack)
                    _m_tabStack.push(_m_activeTab);
            }
        }
        _UpdateTab(_m_activeTab);
    }
    mainmenu_watch.NavigateToTab = NavigateToTab;
    function CloseSubMenuContent() {
        if ((!_m_tabStack) || (_m_tabStack.length == 0) || (!_m_tabStack[_m_tabStack.length - 1].visible)) {
            return false;
        }
        _m_tabStack.pop();
        if (_m_tabStack.length >= 1) {
            NavigateToTab(_m_tabStack[_m_tabStack.length - 1].id, undefined, undefined, false);
        }
        else {
            NavigateToTab(_m_contextTab.id);
        }
        return true;
    }
    mainmenu_watch.CloseSubMenuContent = CloseSubMenuContent;
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
        _m_contextPanel = $("#main-content");
        $.RegisterForUnhandledEvent("PanoramaComponent_MatchList_StateChange", _UpdateMatchListFromMatchListChangeEvent);
        $.RegisterForUnhandledEvent("CloseSubMenuContent", CloseSubMenuContent);
        $.RegisterForUnhandledEvent("NavigateToTab", NavigateToTab);
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
        let restrictions = LicenseUtil.GetCurrentLicenseRestrictions();
        if (restrictions === false) {
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
    function ShowActiveTournamentPage(idOfTab = '') {
        while (CloseSubMenuContent())
            continue;
        NavigateToTab('JsTournaments');
        $('#WatchNavBarButtonTournaments').checked = true;
        let i = g_ActiveTournamentInfo.eventid;
        NavigateToTab('JsMainMenuSubContent_Tournament' + i, 'mainmenu_watch_tournament', 'tournament:' + i, true, true);
        let elTournamentActive = _m_activeTab;
        if (idOfTab && elTournamentActive) {
            let elTabToActivate = elTournamentActive.FindChildTraverse('content-navbar__tabs');
            if (elTabToActivate) {
                elTabToActivate = elTabToActivate.FindChildInLayoutFile(idOfTab);
            }
            if (elTabToActivate) {
                $.DispatchEvent("Activated", elTabToActivate, "mouse");
            }
            else {
            }
        }
    }
    mainmenu_watch.ShowActiveTournamentPage = ShowActiveTournamentPage;
})(mainmenu_watch || (mainmenu_watch = {}));
(function () {
    $.RegisterEventHandler('Cancelled', $('#JsWatch'), mainmenu_watch.CloseSubMenuContent);
    $.RegisterEventHandler('ReadyForDisplay', $('#JsWatch'), mainmenu_watch.OnReadyForDisplay);
    $.RegisterForUnhandledEvent('ShowActiveTournamentPage', mainmenu_watch.ShowActiveTournamentPage);
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbm1lbnVfd2F0Y2guanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9tYWlubWVudV93YXRjaC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBQ2xDLHFDQUFxQztBQUNyQyxxQ0FBcUM7QUFDckMsNkNBQTZDO0FBQzdDLDRDQUE0QztBQUM1Qyw4Q0FBOEM7QUFDOUMsMkNBQTJDO0FBQzNDLDZDQUE2QztBQUM3Qyx5RUFBeUU7QUFJekUsSUFBVSxjQUFjLENBK3RCdkI7QUEvdEJELFdBQVUsY0FBYztJQUV2QixJQUFJLGdCQUFnQixHQUFHLENBQUUsWUFBWSxDQUFDLGVBQWUsRUFBRSxLQUFLLGNBQWMsQ0FBRSxDQUFDO0lBQzdFLElBQUksWUFBNEIsQ0FBQztJQUNqQyxJQUFJLGFBQXNCLENBQUM7SUFDM0IsSUFBSSxXQUFXLEdBQVksRUFBRSxDQUFDO0lBQzlCLElBQUksZUFBd0IsQ0FBQztJQUM3QixJQUFJLFNBQVMsR0FBVyxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDL0MsSUFBSSxtQkFBbUIsR0FBRztRQUN6QixRQUFRLEVBQUUsTUFBTTtRQUNoQixlQUFlLEVBQUUsU0FBUztRQUMxQixjQUFjLEVBQUUsWUFBWTtLQUM1QixDQUFDO0lBQ0YsSUFBSSxrQkFBa0IsR0FBdUI7UUFDNUMsTUFBTSxFQUFFLFFBQVE7UUFDaEIsWUFBWSxFQUFFLGNBQWM7UUFDNUIsQ0FBQyxTQUFTLENBQUMsRUFBRSxlQUFlO0tBQzVCLENBQUM7SUFFQyxTQUFnQixZQUFZO1FBRXhCLE9BQU8sWUFBWSxDQUFDO0lBQ3hCLENBQUM7SUFIZSwyQkFBWSxlQUczQixDQUFBO0lBTUosU0FBUyxtQkFBbUIsQ0FBRyxXQUFvQjtRQUdsRCxJQUFJLFNBQVMsR0FBRyxVQUFVLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDNUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFD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