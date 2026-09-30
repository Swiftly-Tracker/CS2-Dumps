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
    let _m_contextTab; // this is the active tab that may be at the bottom of the stack for any pop-up tabs that are in its hierarchy
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
    // ==================================================================================================================================================================
    // STREAMS
    // ==================================================================================================================================================================
    function _PopulateStreamList(parentPanel) {
        //Get the number of streams
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
                //Adding stuff to panel 
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
    // ==================================================================================================================================================================
    // TOURNAMENTS
    // ==================================================================================================================================================================
    function _OnMouseOverTextTooltip(_panel, _text) {
        UiToolkitAPI.ShowTextTooltip(_panel, _text);
    }
    function _OnMouseOutTextTooltip() {
        UiToolkitAPI.HideTextTooltip();
    }
    function _PopulateTournamentPage(parentPanel) {
        let elTournamentList = parentPanel.FindChildTraverse("JsTournamentList");
        if (!elTournamentList.FindChildTraverse("other-tournaments")) {
            //Load main tournament page layout
            elTournamentList.BLoadLayout("file://{resources}/layout/matchtiles/tournament_page.xml", false, false);
            let pastTournamentPanel = elTournamentList.FindChildTraverse("other-tournaments");
            // START When we have a new tournament that is actually a live event. We don't include that tournament in this lister.
            let maxTournaments = g_ActiveTournamentInfo.eventid;
            // END
            // START When there is not live tournament then just show all the tournaments
            // let maxTournaments = g_ActiveTournamentInfo.eventid;
            // END
            for (let i = maxTournaments; i >= 1; i--) {
                if (i == 2)
                    continue; // Valve DPR
                if (i == 17)
                    continue; // RMR 2020
                //Create panel for single tournament tile
                let elTournamentPanel = $.CreatePanel('Panel', pastTournamentPanel, "Tournament_" + i);
                //Load Layout
                elTournamentPanel.BLoadLayoutSnippet("tournament_tile");
                elTournamentPanel.SetDialogVariable('tournament-title', $.Localize('#CSGO_Tournament_Event_Location_' + i));
                let elTOLogo = elTournamentPanel.FindChildTraverse('id-tournament-to-logo');
                elTOLogo.SetImage('file://{images}/tournaments/events/tournament_logo_' + i + '.svg');
                elTOLogo.GetParent().SetHasClass('tall-logo', i == 22 || i == 24 || i == 25);
                // CHAMPIONS
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
                // LEGENDS
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
                        // This is our most recent Major Championship - allow opening the Major Hub from right here
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
                $.Msg('teamTag' + team + ', ' + teamTag + ', ' + $.Localize('#CSGO_TeamID_' + team));
                let teamLogo = 'file://{images}/tournaments/teams/' + teamTag.toLowerCase() + '.svg';
                teamName = $.Localize('#CSGO_TeamID_' + team);
                teamPlaceStr = $.Localize(teamPlaceToken);
                elTeamLogo.SetImage(teamLogo);
                if (bTooltip) {
                    let TooltipString = $.Localize(teamName);
                    let elTooltipAnchor = $.CreatePanel("Panel", elTeam, uniqueIdentifier + "_" + elTeam.id, { style: "	tooltip-position: bottom;" });
                    //				elTeam.SetPanelEvent( 'onmouseover', _OnMouseOverTextTooltip.bind( undefined, elTooltipAnchor.id, TooltipString ) );
                    //				elTeam.SetPanelEvent( 'onmouseout', _OnMouseOutTextTooltip );
                }
            }
            elTeam.SetDialogVariable("team-place", teamPlaceStr);
            elTeam.SetDialogVariable("team-name", teamName);
        }
        function _PopulateTeamPlayers(elPlayerContainer, elHoverPanel, elLegendsContainer, oTeamData, eventid) {
            if (!oTeamData)
                return;
            // PLAYERS
            // shuffle indices
            let arrIndices = [0, 1, 2, 3, 4];
            for (let i = 0; i < 5; i++) {
                let n = arrIndices.splice(Math.floor(Math.random() * 5), 1)[0];
                arrIndices.push(n);
            }
            let arrTeamPlayers = Object.entries(oTeamData['players']);
            arrIndices.forEach(function (i) {
                let oPlayer = arrTeamPlayers[i][1]; // entries puts the key in [0] and the value in [1]
                let elPlayer = $.CreatePanel('Panel', elPlayerContainer, 'JsPlayerCard');
                elPlayer.BLoadLayoutSnippet('snippet-tournament-player');
                // Override for karrigan winning IEM Cologne 2026 Major as replacement for kyxsan
                let playername = oPlayer['name'];
                let steamid64 = oPlayer['accountid64'];
                if (eventid === 26 && playername === 'kyxsan') {
                    playername = 'karrigan';
                    steamid64 = '76561197989430253';
                }
                // PLAYER NAME
                elPlayer.SetDialogVariable('tournament-player-name', playername);
                //PLAYER IMAGE
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
                        // time the click with the end of the reveal
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
    // ==================================================================================================================================================================
    // TAB AND POPUP MANAGEMENT
    // ==================================================================================================================================================================
    function _UpdateTab(elTab, optbFromMatchListChangeEvent = false) {
        elTab.SetReadyForDisplay(true);
        elTab.visible = true;
        switch (elTab.id) {
            case "JsTournaments":
                _PopulateTournamentPage(elTab);
                break;
            // case "JsActiveTournament":
            // 	$.DispatchEvent( 'InitializeTournamentsPage', elTab, 'tournament:' + g_ActiveTournamentInfo.eventid );
            // 	break;
            case "JsYourMatches":
            case "JsDownloaded":
            case "JsLive":
                matchList.UpdateMatchList(elTab, MATCHLISTDESCRIPTOR[elTab.id], optbFromMatchListChangeEvent);
                break;
            case "JsEvents":
                TournamentsAPI.RequestTournaments();
                break;
        }
        // Sub-tab of individual tournament
        /*if ( tournament_id != undefined )
        {
            let listStateTournament = MatchListAPI.GetState( tournament_id );
            //let listStatePersona = MatchListAPI.GetState( MyPersonaAPI.GetXuid() );

            if ( listStateTournament === 'none' )//|| listStatePersona === "none" )
            {
                MatchListAPI.Refresh( MyPersonaAPI.GetXuid() );
                matchList.ShowListSpinner( true, elTab );
                matchList.SetListMessage( "", false, elTab );
                MatchListAPI.Refresh( tournament_id );
            }
            if ( listStateTournament === 'ready' )//&& listStatePersona === "ready" )
            {
                elTab.Data().tournament_id = tournament_id;

                if( !elTab.isInitialized )
                {
                    matchList.ShowListSpinner( false, elTab );
                    $.DispatchEvent( 'InitializeTournamentsPage', tournament_id, elTab );
                    return;
                }
                
                matchList.UpdateMatchList( elTab, tournament_id );
            }
            return;
        }*/
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
        $.Msg("JS: _UpdateMatchList( " + listId + " )");
        let tabbyid = MATCHLISTTABBYNAME[listId];
        if (tabbyid) {
            $.Msg("JS: _UpdateMatchList( tab = #" + tabbyid + " )");
            _UpdateTab($("#" + tabbyid), optbFromMatchListChangeEvent);
        }
    }
    function _UpdateMatchListFromMatchListChangeEvent(listId) {
        _UpdateMatchList(listId, true);
    }
    function NavigateToTab(tab = '', xmlName = '', tournament_id = '', isSubTab = false, addToStack = false) {
        //TO DO: Set Ready for display 
        $.Msg('mainmenu_watch NavigateToTab ' + tab + ' ' + xmlName + ' ' + (tournament_id ? tournament_id : 'null'));
        //Hiding panel underneath
        if (isSubTab && addToStack) {
            //If there is a popup underneath, take the previous subtab underneath and hide it
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
        //If subtab doesn't exist, create panel and load layout
        let parent = $.GetContextPanel().FindChildInLayoutFile(tab);
        if (isSubTab && !parent) {
            //Make Panel and load xml file
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
            // Handler that catches OnPropertyTransitionEndEvent event for this panel.
            // Check if the panel is transparent then collapse it. 
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
                    $.Msg('Early return with null active tab (1)');
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
                    $.Msg('Early return with null active tab (2)');
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
        $.Msg('Updating active tab = #' + tab + ' id = ' + _m_activeTab.id);
        _UpdateTab(_m_activeTab);
    }
    mainmenu_watch.NavigateToTab = NavigateToTab;
    function CloseSubMenuContent() {
        if ((!_m_tabStack) || (_m_tabStack.length == 0) || (!_m_tabStack[_m_tabStack.length - 1].visible)) {
            return false;
        }
        _m_tabStack.pop();
        //If underneath is a subtab, navigate to the last item in array
        if (_m_tabStack.length >= 1) {
            NavigateToTab(_m_tabStack[_m_tabStack.length - 1].id, undefined, undefined, false);
        }
        //If there's only the context tab underneath, navigate to the context tab
        else {
            NavigateToTab(_m_contextTab.id);
        }
        return true;
    }
    mainmenu_watch.CloseSubMenuContent = CloseSubMenuContent;
    function _InitResourceManagement(elTab) {
        $.RegisterEventHandler('PropertyTransitionEnd', elTab, (panelName, propertyName) => {
            if (elTab === panelName && propertyName === 'opacity') {
                // Panel is visible and fully transparent
                if (elTab.visible === true && elTab.BIsTransparent()) {
                    // Set visibility to false and unload resources
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
            $.Msg(tab + "Tried to load match list snippet and failed. Should probably call _InitResourceManagement directly instead of _InitTab");
        }
        _InitResourceManagement(elTab);
    }
    // ==================================================================================================================================================================
    // INTERFACE AND INIT
    // ==================================================================================================================================================================
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
        // No streams or events in Perfect World mode
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
            // START if there is a live tournament then add the tab here other wise default to live
            // if ( false )
            // {
            // 	_InitResourceManagement( $( '#JsActiveTournament' ) );
            // 	NavigateToTab( 'JsActiveTournament' );
            // 	$( '#WatchNavBarActiveTourament' )!.checked = true;
            // 	return;
            // }
        }
        // If we wasnt to default to default to Your Matches tab ( in non-Perfect World ).
        NavigateToTab('JsYourMatches');
        $('#WatchNavBarYourMatches').checked = true;
        // If we wasnt to default to default to Events tab ( in non-Perfect World ).
        // NavigateToTab( 'JsEvents' );
        // $( '#WatchNavBarButtonEvents' ).checked = true;
    }
    mainmenu_watch.InitMainWatchPanel = InitMainWatchPanel;
    let _RunEveryTimeWatchIsShown = function () {
        // When the watch is created for the first time we don't have a way to trigger ReadyForDisplay,
        // but on all subsequent clicks to show watch panel we don't run Init and run ReadyForDisplay
        // Put all the shared code here
        if (!MyPersonaAPI.IsInventoryValid() || !MyPersonaAPI.IsConnectedToGC()) {
            //No connection to GC so show a message
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
            continue; // keep closing tab stacks until they are all up to the top-level
        // Open the main tab of the Majors:
        NavigateToTab('JsTournaments');
        $('#WatchNavBarButtonTournaments').checked = true;
        // Now navigate to the specific event for the active event
        let i = g_ActiveTournamentInfo.eventid; // the active event
        NavigateToTab('JsMainMenuSubContent_Tournament' + i, 'mainmenu_watch_tournament', 'tournament:' + i, true, true);
        // Latest tab in the stack is the one that we just activated
        let elTournamentActive = _m_activeTab; // ( _m_tabStack.length > 0 ) ? _m_tabStack[ _m_tabStack.length - 1 ] : null;
        if (idOfTab && elTournamentActive) {
            let elTabToActivate = elTournamentActive.FindChildTraverse('content-navbar__tabs');
            if (elTabToActivate) {
                elTabToActivate = elTabToActivate.FindChildInLayoutFile(idOfTab);
            }
            if (elTabToActivate) {
                $.Msg('ShowActiveTournamentPage: ' + idOfTab + ' << activating >>');
                $.DispatchEvent("Activated", elTabToActivate, "mouse");
            }
            else {
                $.Msg('ShowActiveTournamentPage: ' + idOfTab + ' << not found >>');
            }
        }
    }
    mainmenu_watch.ShowActiveTournamentPage = ShowActiveTournamentPage;
})(mainmenu_watch || (mainmenu_watch = {}));
//--------------------------------------------------------------------------------------------------
// Entry point called when panel is created
//--------------------------------------------------------------------------------------------------
(function () {
    $.RegisterEventHandler('Cancelled', $('#JsWatch'), mainmenu_watch.CloseSubMenuContent);
    $.RegisterEventHandler('ReadyForDisplay', $('#JsWatch'), mainmenu_watch.OnReadyForDisplay);
    $.RegisterForUnhandledEvent('ShowActiveTournamentPage', mainmenu_watch.ShowActiveTournamentPage);
})();
//todo
//-update button with enabled state reflective of timing delay (in top bar)
//
//-download link (in top bar?)
//
//-perfect world
// -remove streams for perfect world china client
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbm1lbnVfd2F0Y2guanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9tYWlubWVudV93YXRjaC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBQ2xDLHFDQUFxQztBQUNyQyxxQ0FBcUM7QUFDckMsNkNBQTZDO0FBQzdDLDRDQUE0QztBQUM1Qyw4Q0FBOEM7QUFDOUMsMkNBQTJDO0FBQzNDLDZDQUE2QztBQUM3Qyx5RUFBeUU7QUFJekUsSUFBVSxjQUFjLENBK3RCdkI7QUEvdEJELFdBQVUsY0FBYztJQUV2QixJQUFJLGdCQUFnQixHQUFHLENBQUUsWUFBWSxDQUFDLGVBQWUsRUFBRSxLQUFLLGNBQWMsQ0FBRSxDQUFDO0lBQzdFLElBQUksWUFBNEIsQ0FBQztJQUNqQyxJQUFJLGFBQXNCLENBQUMsQ0FBQyw4R0FBOEc7SUFDMUksSUFBSSxXQUFXLEdBQVksRUFBRSxDQUFDO0lBQzlCLElBQUksZUFBd0IsQ0FBQztJQUM3QixJQUFJLFNBQVMsR0FBVyxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDL0MsSUFBSSxtQkFBbUIsR0FBRztRQUN6QixRQUFRLEVBQUUsTUFBTTtRQUNoQixlQUFlLEVBQUUsU0FBUztRQUMxQixjQUFjLEVBQUUsWUFBWTtLQUM1QixDQUFDO0lBQ0YsSUFBSSxrQkFBa0IsR0FBdUI7UUFDNUMsTUFBTSxFQUFFLFFBQVE7UUFDaEIsWUFBWSxFQUFFLGNBQWM7UUFDNUIsQ0FBQyxTQUFTLENBQUMsRUFBRSxlQUFlO0tBQzVCLENBQUM7SUFFQyxTQUFnQixZQUFZO1FBRXhCLE9BQU8sWUFBWSxDQUFDO0lBQ3hCLENBQUM7SUFIZSwyQkFBWSxlQUczQixDQUFBO0lBRUoscUtBQXFLO0lBQ3JLLFVBQVU7SUFDVixxS0FBcUs7SUFFckssU0FBUyxtQkFBbUIsQ0FBRyxXQUFvQjtRQUVsRCwyQkFBMkI7UUFDM0IsSUFBSSxTQUFT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