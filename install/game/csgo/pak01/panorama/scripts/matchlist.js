"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="mainmenu_watch.ts" />
/// <reference path="matchinfo.ts" />
var matchList;
(function (matchList) {
    let _m_myXuid = MyPersonaAPI.GetXuid();
    function ShowListSpinner(value, tab) {
        if (tab) {
            let elSpinner = tab.FindChildInLayoutFile("id-list-spinner");
            ShowInfoPanel(false, tab);
            _ShowListPanel(false, tab);
            if (elSpinner) {
                if (value) {
                    elSpinner.RemoveClass('hide');
                }
                else {
                    elSpinner.AddClass('hide');
                }
            }
        }
    }
    matchList.ShowListSpinner = ShowListSpinner;
    function SetListMessage(value, show, tab = null) {
        if (tab) {
            let elMessage = tab.FindChildInLayoutFile("id-list-message");
            if (elMessage) {
                elMessage.text = value;
            }
            let elMessageContainer = tab.FindChildInLayoutFile("id-list-message-container");
            if (elMessageContainer) {
                if (show) {
                    elMessageContainer.RemoveClass('hide');
                }
                else {
                    elMessageContainer.AddClass('hide');
                }
            }
        }
    }
    matchList.SetListMessage = SetListMessage;
    function ShowInfoPanel(value, tab = null) {
        if (tab) {
            let elInfoPanel = tab.FindChildInLayoutFile("Info");
            let elMatchList = tab.FindChildInLayoutFile("JsMatchList");
            if (elInfoPanel) {
                if (value) {
                    elInfoPanel.AddClass('subsection-content__background-color--dark');
                    if (tab.Data().activeMatchInfoPanel) {
                        matchInfo.Refresh(tab.Data().activeMatchInfoPanel);
                    }
                }
                else {
                    elInfoPanel.RemoveClass('subsection-content__background-color--dark');
                    if (tab.Data().activeMatchInfoPanel) {
                        matchInfo.Hide(tab.Data().activeMatchInfoPanel);
                    }
                }
            }
            if (elMatchList) {
                if (value) {
                    elMatchList.AddClass("MatchList--Filled");
                }
                else {
                    elMatchList.RemoveClass("MatchList--Filled");
                }
            }
        }
    }
    matchList.ShowInfoPanel = ShowInfoPanel;
    function _ShowListPanel(value, tab = undefined) {
        if (tab) {
            let elMatchList = tab.FindChildInLayoutFile("JsMatchList");
            if (elMatchList) {
                if (!value) {
                    elMatchList.AddClass('hide');
                }
                else {
                    elMatchList.RemoveClass('hide');
                }
            }
        }
    }
    function _ClearList(elListPanel, tournament_id) {
        let activeTiles = elListPanel.Children();
        for (let i = activeTiles.length - 1; i >= 0; i--) {
            if (activeTiles[i].Data().markForDelete) {
                if (elListPanel.Data().activeButton === activeTiles[i]) {
                    elListPanel.Data().activeButton = undefined;
                }
                activeTiles[i].checked = false;
                if (watchTile.GetDownloadHandler(activeTiles[i])) {
                    $.UnregisterForUnhandledEvent('PanoramaComponent_MatchInfo_StateChange', watchTile.GetDownloadHandler(activeTiles[i]));
                    watchTile.SetDownloadHandler(activeTiles[i], null);
                }
                if (tournament_id) {
                    activeTiles[i].AddClass('MatchTile--Collapse');
                }
                else {
                    watchTile.Delete(activeTiles[i]);
                }
            }
        }
    }
    function _SelectFirstTile(parentPanel, elMatchList, matchListDescriptor) {
        if (elMatchList && !(elMatchList.Data().activeButton) && (elMatchList.GetChildCount() > 0)) {
            let tileIsVisible = false;
            let elFirstTile = null;
            let n = 0; // ( matchListDescriptor === 'live' ? 1 : 0 );
            do {
                elFirstTile = elMatchList.GetChild(n);
                tileIsVisible = (elFirstTile && !elFirstTile.BHasClass('MatchTile--Collapse'));
                n = n + 1;
            } while ((!tileIsVisible) && (elFirstTile != undefined));
            if (elFirstTile) {
                elFirstTile.checked = true;
                elMatchList.Data().activeButton = elFirstTile;
                elFirstTile.ScrollParentToMakePanelFit(2, false);
                _PopulateMatchInfo(parentPanel, matchListDescriptor, elFirstTile.Data().matchId);
            }
        }
    }
    function ReselectActiveTile(elListRoot) {
        let elMatchList = elListRoot.FindChildTraverse("JsMatchList");
        if (elMatchList && elMatchList.Data().activeButton) {
            (elMatchList.Data().activeButton).checked = true;
            _PopulateMatchInfo(elListRoot, elListRoot.Data().matchListDescriptor, elMatchList.Data().activeButton.Data().matchId);
        }
        else {
            _SelectFirstTile(elListRoot, elMatchList, elListRoot.Data().matchListDescriptor);
        }
    }
    matchList.ReselectActiveTile = ReselectActiveTile;
    let _OnTournamentTeamSelected = function (elParentPanel, elMatchList, matchListDescriptor) {
        elParentPanel.Data().matchListIsPopulated = false;
        UpdateMatchList(elParentPanel, elParentPanel.Data().tournament_id);
        elMatchList.Data().activeButton = undefined;
        _SelectFirstTile(elParentPanel, elMatchList, matchListDescriptor);
    };
    let _OnTournamentSectionSelected = function (elParentPanel, elMatchList, matchListDescriptor) {
        // changed section so update the teams dropdown
        _PopulateMatchTeamsDropdown(elParentPanel, elParentPanel.Data().tournament_id);
        elParentPanel.Data().matchListIsPopulated = false;
        UpdateMatchList(elParentPanel, elParentPanel.Data().tournament_id);
        elMatchList.Data().activeButton = undefined;
        _SelectFirstTile(elParentPanel, elMatchList, matchListDescriptor);
    };
    function MakeDropDownEntry(index, sectionDesc, sectionName, elMatchlistDropdown) {
        let elSection = $.CreatePanel('Label', elMatchlistDropdown, 'group_' + sectionDesc, { text: sectionName });
        elSection.AddClass("DropDownMenu");
        elSection.AddClass("Width-300");
        elSection.AddClass("White");
        elSection.SetAttributeString('value', index.toString());
        elSection.SetAttributeString('section_id', sectionDesc.toString());
        elMatchlistDropdown.AddOption(elSection);
    }
    let _PopulateMatchlistDropdown = function (elParentPanel, tournamentId) {
        let elMatchlistDropdown = elParentPanel.FindChildTraverse("id-match-list-selector");
        elMatchlistDropdown.ClearPanelEvent('oninputsubmit');
        let nSections = PredictionsAPI.GetEventSectionsCount(tournamentId);
        elMatchlistDropdown.RemoveAllOptions();
        for (let i = 0; i < nSections; i++) {
            let sectionDesc = PredictionsAPI.GetEventSectionIDByIndex(tournamentId, i);
            let sectionName = PredictionsAPI.GetSectionName(tournamentId, sectionDesc);
            sectionName = $.Localize("#CSGO_MatchInfo_Stage_" + sectionName.replace(/\s+/g, ''));
            MakeDropDownEntry(i, sectionDesc.toString(), sectionName, elMatchlistDropdown);
        }
        let sectionsCount = PredictionsAPI.GetEventSectionsCount(tournamentId);
        let activeIndex = sectionsCount - 1;
        for (let i = 0; i < sectionsCount; i++) {
            let sectionId = PredictionsAPI.GetEventSectionIDByIndex(tournamentId, i);
            if (PredictionsAPI.GetSectionIsActive(tournamentId, sectionId)) {
                activeIndex = i;
                break;
            }
        }
        elMatchlistDropdown.SetSelectedIndex(activeIndex);
        elMatchlistDropdown.RemoveClass('hide');
        let elMatchList = elParentPanel.FindChildTraverse("JsMatchList");
        elMatchlistDropdown.SetPanelEvent('oninputsubmit', _OnTournamentSectionSelected.bind(undefined, elParentPanel, elMatchList, tournamentId));
    };
    let _PopulateMatchTeamsDropdown = function (elParentPanel, tournamentId) {
        let elMatchistTeamDropdown = elParentPanel.FindChildTraverse("id-match-list-selector-teams");
        elMatchistTeamDropdown.ClearPanelEvent('oninputsubmit');
        elMatchistTeamDropdown.RemoveAllOptions();
        let elStageDropdown = elParentPanel.FindChildTraverse("id-match-list-selector");
        let sectionId = elStageDropdown.GetSelected().GetAttributeString('section_id', '');
        let teamsList = [];
        let numGroups = PredictionsAPI.GetSectionGroupsCount(tournamentId, parseInt(sectionId));
        MakeDropDownEntry(0, 'allteams', '#Matchlist_Team_Selection', elMatchistTeamDropdown);
        teamsList.push('allteams');
        for (let j = 0; j < numGroups; j++) {
            let numGroupId = PredictionsAPI.GetSectionGroupIDByIndex(tournamentId, parseInt(sectionId), j);
            let count = PredictionsAPI.GetGroupTeamsPickableCount(tournamentId, numGroupId);
            for (let h = 0; h < count; h++) {
                let teamId = PredictionsAPI.GetGroupTeamIDByIndex(tournamentId, numGroupId, h);
                if (teamsList.indexOf(teamId) === -1 && teamId) {
                    teamsList.push(teamId);
                    let teamName = PredictionsAPI.GetTeamName(teamId);
                    MakeDropDownEntry((teamsList.length - 1), teamId.toString(), teamName, elMatchistTeamDropdown);
                }
            }
        }
        elMatchistTeamDropdown.SetSelectedIndex(teamsList.indexOf('allteams'));
        elMatchistTeamDropdown.RemoveClass('hide');
        elMatchistTeamDropdown.enabled = (teamsList.length > 1);
        let elMatchList = elParentPanel.FindChildTraverse("JsMatchList");
        elMatchistTeamDropdown.SetPanelEvent('oninputsubmit', _OnTournamentTeamSelected.bind(undefined, elParentPanel, elMatchList, tournamentId));
    };
    function UpdateMatchList(elTab, matchListDescriptor, optbFromMatchListChangeEvent = false) {
        let listState = MatchListAPI.GetState(matchListDescriptor);
        if (listState === 'none') {
            listState = _RequestMatchListUpdate(elTab, matchListDescriptor);
        }
        else if (listState === 'ready' && !optbFromMatchListChangeEvent) {
            // Not sure how frequently UpdateMatchList runs, but code will throttle refresh calls if needed
            listState = _RequestMatchListUpdate(elTab, matchListDescriptor);
            // optbFromMatchListChangeEvent is required to prevent re-entry in this function when refreshing
            // the list of "downloaded" matches.
            // This code is flawed because it cannot tell a proactive refresh vs reacting to a match list
            // event state change vs a tab click
        }
        if (elTab && (listState !== "loading")) {
            _PopulateMatchList(elTab, matchListDescriptor);
        }
    }
    matchList.UpdateMatchList = UpdateMatchList;
    function _PopulateMatchInfo(parentPanel, matchListDescriptor, matchId) {
        let elMatchList = parentPanel.FindChildTraverse("JsMatchList");
        let elButton = parentPanel.FindChildTraverse(matchListDescriptor + "_" + matchId);
        if (elMatchList.Data().activeButton) {
            watchTile.SetParentActive(elMatchList.Data().activeButton, false);
        }
        if (elButton) {
            elMatchList.Data().activeButton = elButton;
        }
        if ((parentPanel.Data().activeMatchInfoPanel) && (parentPanel.Data().activeMatchInfoPanel.Data().matchId === matchId) && (matchId != 'gotv')) {
            matchInfo.Refresh(parentPanel.Data().activeMatchInfoPanel);
            return;
        }
        if ((parentPanel.Data().activeMatchInfoPanel) && (parentPanel.Data().activeMatchInfoPanel.Data().matchId != matchId)) {
            matchInfo.Hide(parentPanel.Data().activeMatchInfoPanel);
            parentPanel.Data().activeMatchInfoPanel = undefined;
        }
        let parentInfoPanel = parentPanel.FindChildTraverse('Info');
        parentPanel.Data().activeMatchInfoPanel = parentInfoPanel.FindChild('info_' + matchId);
        if (parentPanel.Data().activeMatchInfoPanel == undefined) {
            parentPanel.Data().activeMatchInfoPanel = $.CreatePanel('Panel', parentInfoPanel, 'info_' + matchId);
            parentPanel.Data().activeMatchInfoPanel.Data().matchId = matchId;
            parentPanel.Data().activeMatchInfoPanel.Data().matchListDescriptor = matchListDescriptor;
            parentPanel.Data().activeMatchInfoPanel.BLoadLayout("file://{resources}/layout/matchinfo.xml", false, false);
            parentPanel.Data().activeMatchInfoPanel.Data().tournament_id = parentPanel.Data().tournament_id;
            parentPanel.Data().activeMatchInfoPanel.Data().tournamentIndex = parentPanel.Data().tournamentIndex;
            matchInfo.Init(parentPanel.Data().activeMatchInfoPanel);
        }
        else {
            matchInfo.Refresh(parentPanel.Data().activeMatchInfoPanel);
        }
    }
    function _RequestMatchListUpdate(elTab, matchListDescriptor) {
        function _ShowLoadingError(elBoundTab) {
            ShowListSpinner(false, elBoundTab);
            let msg = "";
            if (elBoundTab.Data().tournament_id) {
                msg = "#CSGO_Watch_NoMatch_Tournament_" + elBoundTab.Data().tournament_id.split(':')[1];
            }
            else {
                switch (elTab.id) {
                    case "JsLive":
                        msg = "#CSGO_Watch_NoMatch_live";
                        break;
                    case "JsYourMatches":
                        msg = "#CSGO_Watch_NoMatch_your_ranked";
                        break;
                }
            }
            SetListMessage($.Localize(msg), true, elBoundTab);
            elBoundTab.Data().downloadFailedHandler = undefined;
        }
        if (elTab) {
            MatchListAPI.Refresh(matchListDescriptor);
            let newState = MatchListAPI.GetState(matchListDescriptor);
            if (newState === "loading") {
                //
                // WARNING: THIS CODE IS FLAWED
                // correct design is to rely on event notifications when match list state change occurs
                // then Javascript can call "Refresh", get a notification that state transitioned to "loading"
                // and put up spinners correctly.
                // Keeping it here for the smallest amount of refactoring before shipping all London Major pickems
                ShowListSpinner(true, elTab);
                SetListMessage("", false, elTab);
                elTab.Data().matchListIsPopulated = false;
                // Prevent re-entry double-scheduling the error handling function
                if (elTab.Data().downloadFailedHandler) {
                    $.CancelScheduled(elTab.Data().downloadFailedHandler);
                    elTab.Data().downloadFailedHandler = undefined;
                }
                elTab.Data().downloadFailedHandler = $.Schedule(3.0, _ShowLoadingError.bind(undefined, elTab));
            }
            return newState;
        }
    }
    function _MarkActiveTabUnpopulated() {
        mainmenu_watch.GetActiveTab().Data().matchListIsPopulated = false;
    }
    function _PopulateMatchList(parentPanel, matchListDescriptor) {
        if (!parentPanel)
            return;
        function OnMouseOverButton(currentParentPanel, buttonId) {
            let elButton = currentParentPanel.FindChildTraverse(buttonId);
            watchTile.SetParentActive(elButton, true);
        }
        function OnMouseOutButton(currentParentPanel, buttonId) {
            let elButton = currentParentPanel.FindChildTraverse(buttonId);
            if (!elButton.IsSelected()) {
                watchTile.SetParentActive(elButton, false);
            }
        }
        function _ClearMatchInfo() {
            if (parentPanel.Data().activeMatchInfoPanel) {
                matchInfo.Hide(parentPanel.Data().activeMatchInfoPanel);
                parentPanel.Data().activeMatchInfoPanel = undefined;
            }
        }
        function _ShowGOTVConfirmPopup(elListRoot) {
            _ClearMatchInfo();
            UiToolkitAPI.ShowGenericPopupOkCancel($.Localize('#CSGO_Watch_Gotv_Theater'), $.Localize('#CSGO_Watch_Gotv_Theater_tip'), '', function () { MatchListAPI.StartGOTVTheater("live"); }, ReselectActiveTile.bind(undefined, elListRoot));
        }
        if (parentPanel.Data().downloadFailedHandler) {
            $.CancelScheduled(parentPanel.Data().downloadFailedHandler);
            parentPanel.Data().downloadFailedHandler = undefined;
        }
        function GetListOfMatchIds(matchListDescriptor, tournamentIndex, unfilteredCount, sectionDesc, teamId = null) {
            let MatchIds = [];
            for (let i = 0; i < unfilteredCount; i++) {
                let matchId = '';
                if (tournamentIndex > 3) {
                    matchId = PredictionsAPI.GetSectionMatchByIndex(matchListDescriptor, sectionDesc, i);
                }
                else if (tournamentIndex <= 3 || !tournamentIndex) {
                    // Used for old tournaments and 'live', 'downloaded', 'mymatches'.
                    matchId = MatchListAPI.GetMatchByIndex(matchListDescriptor, i).toString();
                }
                if (tournamentIndex && teamId && teamId != 0) {
                    if (IsTeamInMatch(teamId, matchId)) {
                        MatchIds.push(matchId);
                    }
                }
                else {
                    MatchIds.push(matchId);
                }
            }
            return MatchIds;
        }
        function IsTeamInMatch(teamId, matchId) {
            for (let i = 0; i <= 1; i++) {
                if (MatchInfoAPI.GetMatchTournamentTeamID(matchId, i) === teamId) {
                    return true;
                }
            }
            return false;
        }
        let unfilteredCount = MatchListAPI.GetCount(matchListDescriptor);
        let nCount = 0;
        $.Msg("JS match lister setting " + nCount + " matches for " + matchListDescriptor + " tab");
        let sectionDesc = 0;
        let tournamentIndex = 0;
        let MatchIdsFiltered = [];
        if ((unfilteredCount > 0) && (parentPanel.Data().tournament_id)) {
            tournamentIndex = parentPanel.Data().tournament_id.split(':')[1];
            parentPanel.Data().tournamentIndex = tournamentIndex;
            if (!parentPanel.Data().matchListDropdownIsPopulated) {
                if (tournamentIndex > 3) {
                    _PopulateMatchlistDropdown(parentPanel, parentPanel.Data().tournament_id);
                    _PopulateMatchTeamsDropdown(parentPanel, parentPanel.Data().tournament_id);
                }
                parentPanel.Data().matchListDropdownIsPopulated = true;
            }
            if (tournamentIndex > 3) {
                let elDropdown = parentPanel.FindChildTraverse("id-match-list-selector");
                sectionDesc = parseInt(elDropdown.GetSelected().GetAttributeString('section_id', ''));
                unfilteredCount = PredictionsAPI.GetSectionMatchesCount(parentPanel.Data().tournament_id, sectionDesc);
                let elStageDropdown = parentPanel.FindChildTraverse("id-match-list-selector-teams");
                ;
                let strTeamId = elStageDropdown.GetSelected().GetAttributeString('section_id', '');
                let nteamId = strTeamId === 'allteams' ? 0 : Number(strTeamId);
                MatchIdsFiltered = GetListOfMatchIds(parentPanel.Data().tournament_id, tournamentIndex, unfilteredCount, sectionDesc, nteamId);
                nCount = MatchIdsFiltered.length;
            }
            else if (tournamentIndex == 1) {
                MatchIdsFiltered = GetListOfMatchIds(parentPanel.Data().tournament_id, tournamentIndex, unfilteredCount, sectionDesc, null);
                nCount = MatchIdsFiltered.length - 3; // hide bad match data and test matches
            }
            else if (tournamentIndex == 3) {
                MatchIdsFiltered = GetListOfMatchIds(parentPanel.Data().tournament_id, tournamentIndex, unfilteredCount, sectionDesc, null);
                nCount = MatchIdsFiltered.length - 1; // hide test match
            }
        }
        else {
            MatchIdsFiltered = GetListOfMatchIds(matchListDescriptor, null, unfilteredCount, null, null);
            nCount = unfilteredCount;
        }
        ShowListSpinner(false, parentPanel);
        // No matches returned, display error message
        if (nCount <= 0) {
            ShowInfoPanel(false, parentPanel);
            _ShowListPanel(false, parentPanel);
            let msg = "";
            if (parentPanel.Data().tournament_id) {
                msg = "#CSGO_Watch_NoMatch_Tournament_" + parentPanel.Data().tournament_id.split(':')[1];
            }
            else {
                switch (parentPanel.id) {
                    case "JsLive":
                        msg = "#CSGO_Watch_NoMatch_live";
                        break;
                    case "JsYourMatches":
                        msg = "#CSGO_Watch_NoMatch_your_ranked";
                        break;
                    case "JsDownloaded":
                        msg = "#CSGO_Watch_NoMatch_downloaded";
                        break;
                }
            }
            SetListMessage($.Localize(msg), true, parentPanel);
        }
        let elMatchList = parentPanel.FindChildTraverse("JsMatchList");
        if (!elMatchList) {
            return;
        }
        for (let i = 0; i < elMatchList.GetChildCount(); i++) {
            elMatchList.GetChild(i).Data().markForDelete = true;
        }
        function _CreateOrValidateMatchTile(matchId) {
            let elMatchButton = elMatchList.FindChildInLayoutFile(matchListDescriptor + "_" + matchId);
            if (!elMatchButton || matchListDescriptor === 'live') {
                // Recreate all the live match tiles since the order updates and matters.
                if (matchListDescriptor === 'live') {
                    if (elMatchButton) {
                        elMatchButton.DeleteAsync(0.0);
                    }
                }
                elMatchButton = $.CreatePanel('RadioButton', elMatchList, matchListDescriptor + "_" + matchId);
                elMatchButton.Data().downloadStateHandler = undefined;
                elMatchButton.Data().group = parentPanel.id;
                elMatchButton.Data().myXuid = _m_myXuid;
                elMatchButton.Data().matchId = matchId;
                elMatchButton.Data().matchListDescriptor = matchListDescriptor;
                if (matchId != 'gotv') {
                    elMatchButton.SetPanelEvent('onactivate', _PopulateMatchInfo.bind(undefined, parentPanel, matchListDescriptor, matchId));
                }
                else {
                    elMatchButton.SetPanelEvent('onactivate', _ShowGOTVConfirmPopup.bind(undefined, parentPanel));
                }
                elMatchButton.SetPanelEvent('onmouseover', OnMouseOverButton.bind(undefined, parentPanel, matchListDescriptor + "_" + matchId));
                elMatchButton.SetPanelEvent('onmouseout', OnMouseOutButton.bind(undefined, parentPanel, matchListDescriptor + "_" + matchId));
                watchTile.Init(elMatchButton);
                elMatchButton.RemoveClass('MatchTile--Collapse');
            }
            else {
                watchTile.Refresh(elMatchButton);
            }
            elMatchButton.Data().markForDelete = false;
            function _UpdateDownloadState(elBoundMatchButton) {
                if ((elBoundMatchButton) && (!elBoundMatchButton.Data().markForDelete)) {
                    let elDownloadIndicator = elBoundMatchButton.FindChildInLayoutFile('id-download-state');
                    if (elDownloadIndicator) {
                        let isDownloading = Boolean((MatchInfoAPI.GetMatchState(elBoundMatchButton.Data().matchId) === "downloading"));
                        let canWatch = Boolean(MatchInfoAPI.CanWatch(elBoundMatchButton.Data().matchId));
                        let isLive = Boolean(MatchInfoAPI.IsLive(elBoundMatchButton.Data().matchId));
                        elDownloadIndicator.SetHasClass("download-animation", isDownloading);
                        elDownloadIndicator.SetHasClass("watchlive", isLive);
                        elDownloadIndicator.SetHasClass("downloaded", canWatch && !isLive);
                    }
                }
            }
            if ((elMatchButton.Data().downloadStateHandler == undefined) && elMatchButton.FindChildInLayoutFile('id-download-state')) {
                elMatchButton.Data().downloadStateHandler = $.RegisterForUnhandledEvent('PanoramaComponent_MatchInfo_StateChange', _UpdateDownloadState.bind(undefined, elMatchButton));
            }
            // Since 7671791 we are doing a relayout of child panels when refreshed, so also update the download state to show the correct icon 
            _UpdateDownloadState(elMatchButton);
            elMatchButton.RemoveClass('MatchTile--Collapse');
        }
        for (let i = 0; i < nCount; i++) {
            if ((parentPanel.Data().tournament_id) && (tournamentIndex > 3)) {
                _CreateOrValidateMatchTile(MatchIdsFiltered[i]);
            }
            else {
                let matchbyindex = MatchListAPI.GetMatchByIndex(matchListDescriptor, i);
                $.Msg("JS match lister idx=" + i + " / " + nCount + " = " + MatchIdsFiltered[i]);
                _CreateOrValidateMatchTile(MatchIdsFiltered[i]);
            }
        }
        if ((matchListDescriptor === 'live') && elMatchList.FindChildInLayoutFile("live_gotv")) {
            elMatchList.FindChildInLayoutFile("live_gotv").Data().markForDelete = true;
        }
        _ClearList(elMatchList, parentPanel.Data().tournament_id);
        _SelectFirstTile(parentPanel, elMatchList, matchListDescriptor);
        if (nCount > 0) {
            _ShowListPanel(true, parentPanel);
            ShowInfoPanel(true, parentPanel);
            SetListMessage("", false, parentPanel);
        }
        // last tile of live match list is gotv theatre
        if ((matchListDescriptor === 'live') && (nCount > 0)) {
            _CreateOrValidateMatchTile('gotv');
        }
        parentPanel.Data().matchListIsPopulated = true;
    }
})(matchList || (matchList = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWF0Y2hsaXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvbWF0Y2hsaXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFDbEMsMENBQTBDO0FBQzFDLHFDQUFxQztBQUVyQyxJQUFVLFNBQVMsQ0FrckJsQjtBQWxyQkQsV0FBVSxTQUFTO0lBR2YsSUFBSSxTQUFTLEdBQUcsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBRXZDLFNBQWdCLGVBQWUsQ0FBRyxLQUFhLEVBQUUsR0FBVztRQUV4RCxJQUFLLEdBQUcsRUFDUjtZQUNJLElBQUksU0FBUyxHQUFHLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBRSxpQkFBaUIsQ0FBRSxDQUFDO1lBQy9ELGFBQWEsQ0FBRSxLQUFLLEVBQUUsR0FBRyxDQUFFLENBQUM7WUFDNUIsY0FBYyxDQUFFLEtBQUssRUFBRSxHQUFHLENBQUUsQ0FBQztZQUM3QixJQUFLLFNBQVMsRUFDZDtnQkFDSSxJQUFLLEtBQUssRUFDVjtvQkFDSSxTQUFTLENBQUMsV0FBVyxDQUFFLE1BQU0sQ0FBRSxDQUFDO2lCQUNuQztxQkFFRDtvQkFDSSxTQUFTLENBQUMsUUFBUSxDQUFFLE1BQU0sQ0FBRSxDQUFDO2lCQUNoQzthQUNKO1NBQ0o7SUFDTCxDQUFDO0lBbkJlLHlCQUFlLGtCQW1COUIsQ0FBQTtJQUVELFNBQWdCLGNBQWMsQ0FBRyxLQUFZLEVBQUUsSUFBWSxFQUFFLE1BQXFCLElBQUk7UUFFbEYsSUFBSyxHQUFHLEVBQ1I7WUFDSSxJQUFJLFNBQVMsR0FBRyxHQUFHLENBQUMscUJBQXFCLENBQUUsaUJBQWlCLENBQWEsQ0FBQztZQUMxRSxJQUFLLFNBQVMsRUFDZDtnQkFDSSxTQUFTLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQzthQUMxQjtZQUNELElBQUksa0JBQWtCLEdBQUcsR0FBRyxDQUFDLHFCQUFxQixDQUFFLDJCQUEyQixDQUFFLENBQUM7WUFDbEYsSUFBSyxrQkFBa0IsRUFDdkI7Z0JBQ0ksSUFBSyxJQUFJLEVBQ1Q7b0JBQ0ksa0JBQWtCLENBQUMsV0FBVyxDQUFFLE1BQU0sQ0FBRSxDQUFDO2lCQUM1QztxQkFFRDtvQkFDSSxrQkFBa0IsQ0FBQyxRQUFRLENBQUUsTUFBTSxDQUFFLENBQUM7aUJBQ3pDO2FBQ0o7U0FDSjtJQUNMLENBQUM7SUF0QmUsd0JBQWMsaUJBc0I3QixDQUFBO0lBRUQsU0FBZ0IsYUFBYSxDQUFHLEtBQWEsRUFBRSxNQUFxQixJQUFJO1FBRXBFLElBQUssR0FBRyxFQUNSO1lBQ0ksSUFBSSxXQUFXLEdBQUcsR0FBRyxDQUFDLHFCQUFxQixDQUFFLE1BQU0sQ0FBRSxDQUFDO1lBQ3RELElBQUksV0FBVyxHQUFHLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBRSxhQUFhLENBQUUsQ0FBQztZQUM3RCxJQUFLLFdBQVcsRUFDaEI7Z0JBQ0ksSUFBSyxLQUFLLEVBQ1Y7b0JBQ0ksV0FBVyxDQUFDLFFBQVEsQ0FBRSw0Q0FBNEMsQ0FBRSxDQUFDO29CQUNyRSxJQUFLLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxvQkFBb0IsRUFDcEM7d0JBQ0ksU0FBUyxDQUFDLE9BQU8sQ0FBRSxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsb0JBQW9CLENBQUUsQ0FBQztxQkFDeEQ7aUJBQ0o7cUJBRUQ7b0JBQ0ksV0FBVyxDQUFDLFdBQVcsQ0FBRSw0Q0FBNEMsQ0FBRSxDQUFDO29CQUN4RSxJQUFLLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxvQkFBb0IsRUFDcEM7d0JBQ0ksU0FBUyxDQUFDLElBQUksQ0FBRSxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsb0JBQW9CLENBQUUsQ0FBQztxQkFDckQ7aUJBQ0o7YUFDSjtZQUNELElBQUssV0FBVyxFQUNoQjtnQkFDSSxJQUFLLEtBQUssRUFDVjtvQkFDSSxXQUFXLENBQUMsUUFBUSxDQUFFLG1CQUFtQixDQUFFLENBQUM7aUJBQy9DO3FCQUVEO29CQUNJLFdBQVcsQ0FBQyxXQUFXLENBQUUsbUJBQW1CLENBQUUsQ0FBQztpQkFDbEQ7YUFDSjtTQUNKO0lBQ0wsQ0FBQztJQXJDZSx1QkFBYSxnQkFxQzVCLENBQUE7SUFFRCxTQUFTLGNBQWMsQ0FBRyxLQUFhLEVBQUUsTUFBMEIsU0FBUztRQUV4RSxJQUFLLEdBQUcsRUFDUjtZQUNJLElBQUksV0FBVyxHQUFHLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBRSxhQUFhLENBQUUsQ0FBQztZQUU3RCxJQUFLLFdBQVcsRUFDaEI7Z0JBQ0ksSUFBSyxDQUFDLEtBQUssRUFDWDtvQkFDSSxXQUFXLENBQUMsUUFBUSxDQUFFLE1BQU0sQ0FBRSxDQUFDO2lCQUNsQztxQkFFRDtvQkFDSSxXQUFXLENBQUMsV0FBVyxDQUFFLE1BQU0sQ0FBRSxDQUFDO2lCQUNyQzthQUNKO1NBQ0o7SUFDTCxDQUFDO0lBRUQsU0FBUyxVQUFVLENBQUcsV0FBbUIsRUFBRSxhQUFvQjtRQUUzRCxJQUFJLFdBQVcsR0FBRyxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDekMsS0FBTSxJQUFJLENBQUMsR0FBRyxXQUFXLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUNqRDtZQUNJLElBQUssV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLGFBQWEsRUFDeEM7Z0JBQ0ksSUFBSyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsWUFBWSxLQUFJLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFDdEQ7b0JBQ0ksV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLFlBQVksR0FBRSxTQUFTLENBQUM7aUJBQzlDO2dCQUNELFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO2dCQUMvQixJQUFLLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUUsRUFDcEQ7b0JBQ0ksQ0FBQyxDQUFDLDJCQUEyQixDQUFFLHlDQUF5QyxFQUFFLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBRSxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBRSxDQUFDO29CQUMzSCxTQUFTLENBQUMsa0JBQWtCLENBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBRSxDQUFDO2lCQUN6RDtnQkFDRCxJQUFLLGFBQWEsRUFDbEI7b0JBQ0ksV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxxQkFBcUIsQ0FBRSxDQUFDO2lCQUNwRDtxQkFFRDtvQkFDSSxTQUFTLENBQUMsTUFBTSxDQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDO2lCQUN0QzthQUNKO1NBQ0o7SUFDTCxDQUFDO0lBRUQsU0FBUyxnQkFBZ0IsQ0FBRyxXQUFvQixFQUFFLFdBQW9CLEVBQUUsbUJBQTBCO1FBRTlGLElBQUssV0FBVyxJQUFJLENBQUMsQ0FBRSxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBRSxXQUFXLENBQUMsYUFBYSxFQUFFLEdBQUcsQ0FBQyxDQUFFLEVBQzlGO1lBQ0ksSUFBSSxhQUFhLEdBQUcsS0FBSyxDQUFDO1lBQzFCLElBQUksV0FBVyxHQUFtQixJQUFJLENBQUM7WUFDdkMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsOENBQThDO1lBQ3pELEdBQ0E7Z0JBQ0ksV0FBVyxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUUsQ0FBQyxDQUFFLENBQUM7Z0JBQ3hDLGFBQWEsR0FBRyxDQUFFLFdBQVcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUUscUJBQXFCLENBQUUsQ0FBRSxDQUFDO2dCQUNuRixDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUNiLFFBQVMsQ0FBRSxDQUFDLGFBQWEsQ0FBRSxJQUFJLENBQUUsV0FBVyxJQUFJLFNBQVMsQ0FBRSxFQUFHO1lBQy9ELElBQUssV0FBVyxFQUNoQjtnQkFDSSxXQUFXLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztnQkFDM0IsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLFlBQVksR0FBRSxXQUFXLENBQUM7Z0JBQzdDLFdBQVcsQ0FBQywwQkFBMEIsQ0FBRSxDQUFDLEVBQUUsS0FBSyxDQUFFLENBQUM7Z0JBQ25ELGtCQUFrQixDQUFFLFdBQVcsRUFBRSxtQkFBbUIsRUFBRSxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFFLENBQUM7YUFDdEY7U0FDSjtJQUNMLENBQUM7SUFFRCxTQUFnQixrQkFBa0IsQ0FBRyxVQUFtQjtRQUVwRCxJQUFJLFdBQVcsR0FBRyxVQUFVLENBQUMsaUJBQWlCLENBQUUsYUFBYSxDQUFFLENBQUM7UUFDaEUsSUFBSyxXQUFXLElBQUksV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLFlBQVksRUFDbkQ7WUFDSSxDQUFFLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxZQUFZLENBQUUsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQ25ELGtCQUFrQixDQUFFLFVBQVUsRUFBRSxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUMsbUJBQW1CLEVBQUUsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLENBQUUsQ0FBQztTQUMzSDthQUVEO1lBQ0ksZ0JBQWdCLENBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUMsbUJBQW1CLENBQUUsQ0FBQztTQUN0RjtJQUNMLENBQUM7SUFaZSw0QkFBa0IscUJBWWpDLENBQUE7SUFFRCxJQUFJLHlCQUF5QixHQUFHLFVBQVcsYUFBc0IsRUFBRSxXQUFvQixFQUFFLG1CQUEwQjtRQUUvRyxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsb0JBQW9CLEdBQUcsS0FBSyxDQUFDO1FBQ2xELGVBQWUsQ0FBRSxhQUFhLEVBQUUsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLGFBQWEsQ0FBRSxDQUFDO1FBQ3JFLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxZQUFZLEdBQUUsU0FBUyxDQUFDO1FBQzNDLGdCQUFnQixDQUFFLGFBQWEsRUFBRSxXQUFXLEVBQUUsbUJBQW1CLENBQUUsQ0FBQztJQUN4RSxDQUFDLENBQUM7SUFFRixJQUFJLDRCQUE0QixHQUFHLFVBQVcsYUFBcUIsRUFBRSxXQUFtQixFQUFFLG1CQUEwQjtRQUVoSCwrQ0FBK0M7UUFDL0MsMkJBQTJCLENBQUUsYUFBYSxFQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxhQUFhLENBQUUsQ0FBQztRQUVqRixhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsb0JBQW9CLEdBQUcsS0FBSyxDQUFDO1FBQ2xELGVBQWUsQ0FBRSxhQUFhLEVBQUUsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLGFBQWEsQ0FBRSxDQUFDO1FBQ3JFLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxZQUFZLEdBQUUsU0FBUyxDQUFDO1FBQzNDLGdCQUFnQixDQUFFLGFBQWEsRUFBRSxXQUFXLEVBQUUsbUJBQW1CLENBQUUsQ0FBQztJQUN4RSxDQUFDLENBQUM7SUFFRixTQUFTLGlCQUFpQixDQUFHLEtBQVksRUFBRSxXQUFrQixFQUFFLFdBQWtCLEVBQUUsbUJBQStCO1FBRTlHLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUUsT0FBTyxFQUFFLG1CQUFtQixFQUFFLFFBQVEsR0FBRyxXQUFXLEVBQUUsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLENBQUUsQ0FBQztRQUM3RyxTQUFTLENBQUMsUUFBUSxDQUFFLGNBQWMsQ0FBRSxDQUFDO1FBQ3JDLFNBQVMsQ0FBQyxRQUFRLENBQUUsV0FBVyxDQUFFLENBQUM7UUFDbEMsU0FBUyxDQUFDLFFBQVEsQ0FBRSxPQUFPLENBQUUsQ0FBQztRQUM5QixTQUFTLENBQUMsa0JBQWtCLENBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBRSxDQUFDO1FBQzFELFNBQVMsQ0FBQyxrQkFBa0IsQ0FBRSxZQUFZLEVBQUUsV0FBVyxDQUFDLFFBQVEsRUFBRSxDQUFFLENBQUM7UUFDckUsbUJBQW1CLENBQUMsU0FBUyxDQUFFLFNBQVMsQ0FBRSxDQUFDO0lBQy9DLENBQUM7SUFFRCxJQUFJLDBCQUEwQixHQUFHLFVBQVcsYUFBc0IsRUFBRSxZQUFtQjtRQUVuRixJQUFJLG1CQUFtQixHQUFHLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBRSx3QkFBd0IsQ0FBZ0IsQ0FBQztRQUNwRyxtQkFBbUIsQ0FBQyxlQUFlLENBQUUsZUFBZSxDQUFFLENBQUM7UUFDdkQsSUFBSSxTQUFTLEdBQUcsY0FBYyxDQUFDLHFCQUFxQixDQUFFLFlBQVksQ0FBRSxDQUFDO1FBQ3JFLG1CQUFtQixDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFFdkMsS0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsRUFBRSxDQUFDLEVBQUUsRUFDbkM7WUFDSSxJQUFJLFdBQVcsR0FBRyxjQUFjLENBQUMsd0JBQXdCLENBQUUsWUFBWSxFQUFFLENBQUMsQ0FBRSxDQUFDO1lBQzdFLElBQUksV0FBVyxHQUFHLGNBQWMsQ0FBQyxjQUFjLENBQUUsWUFBWSxFQUFFLFdBQVcsQ0FBRSxDQUFDO1lBQzdFLFdBQVcsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFFLHdCQUF3QixHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBRSxDQUFFLENBQUM7WUFDekYsaUJBQWlCLENBQUUsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxRQUFRLEVBQUUsRUFBRSxXQUFXLEVBQUUsbUJBQW1CLENBQUUsQ0FBQztTQUNwRjtRQUVELElBQUksYUFBYSxHQUFHLGNBQWMsQ0FBQyxxQkFBcUIsQ0FBRSxZQUFZLENBQUUsQ0FBQztRQUN6RSxJQUFJLFdBQVcsR0FBRyxhQUFhLEdBQUcsQ0FBQyxDQUFDO1FBQ3BDLEtBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxhQUFhLEVBQUUsQ0FBQyxFQUFFLEVBQ3ZDO1lBQ0ksSUFBSSxTQUFTLEdBQUcsY0FBYyxDQUFDLHdCQUF3QixDQUFFLFlBQVksRUFBRSxDQUFDLENBQUUsQ0FBQztZQUMzRSxJQUFLLGNBQWMsQ0FBQyxrQkFBa0IsQ0FBRSxZQUFZLEVBQUUsU0FBUyxDQUFFLEVBQ2pFO2dCQUNJLFdBQVcsR0FBRyxDQUFDLENBQUM7Z0JBQ2hCLE1BQU07YUFDVDtTQUNKO1FBRUQsbUJBQW1CLENBQUMsZ0JBQWdCLENBQUUsV0FBVyxDQUFFLENBQUM7UUFFcEQsbUJBQW1CLENBQUMsV0FBVyxDQUFFLE1BQU0sQ0FBRSxDQUFDO1FBQzFDLElBQUksV0FBVyxHQUFHLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBRSxhQUFhLENBQUUsQ0FBQztRQUNuRSxtQkFBbUIsQ0FBQyxhQUFhLENBQUUsZUFBZSxFQUFFLDRCQUE0QixDQUFDLElBQUksQ0FBRSxTQUFTLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSxZQUFZLENBQUUsQ0FBRSxDQUFDO0lBQ25KLENBQUMsQ0FBQztJQUVGLElBQUksMkJBQTJCLEdBQUcsVUFBVyxhQUFzQixFQUFFLFlBQW9CO1FBRXJGLElBQUksc0JBQXNCLEdBQUcsYUFBYSxDQUFDLGlCQUFpQixDQUFFLDhCQUE4QixDQUFnQixDQUFDO1FBQzdHLHNCQUFzQixDQUFDLGVBQWUsQ0FBRSxlQUFlLENBQUUsQ0FBQztRQUMxRCxzQkFBc0IsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBRTFDLElBQUksZUFBZSxHQUFHLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBRSx3QkFBd0IsQ0FBZ0IsQ0FBQztRQUNoRyxJQUFJLFNBQVMsR0FBRyxlQUFlLENBQUMsV0FBVyxFQUFFLENBQUMsa0JBQWtCLENBQUUsWUFBWSxFQUFFLEVBQUUsQ0FBRSxDQUFDO1FBRXJGLElBQUksU0FBUyxHQUFHLEVBQUUsQ0FBQztRQUNuQixJQUFJLFNBQVMsR0FBRyxjQUFjLENBQUMscUJBQXFCLENBQUUsWUFBWSxFQUFFLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBRSxDQUFDO1FBRTFGLGlCQUFpQixDQUFFLENBQUMsRUFBRSxVQUFVLEVBQUUsMkJBQTJCLEVBQUUsc0JBQXNCLENBQUUsQ0FBQztRQUN4RixTQUFTLENBQUMsSUFBSSxDQUFFLFVBQVUsQ0FBRSxDQUFDO1FBRTdCLEtBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLEVBQUUsQ0FBQyxFQUFFLEVBQ25DO1lBQ0ksSUFBSSxVQUFVLEdBQUcsY0FBYyxDQUFDLHdCQUF3QixDQUFFLFlBQVksRUFBRSxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7WUFDakcsSUFBSSxLQUFLLEdBQUcsY0FBYyxDQUFDLDBCQUEwQixDQUFFLFlBQVksRUFBRSxVQUFVLENBQUUsQ0FBQztZQUVsRixLQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUMvQjtnQkFDSSxJQUFJLE1BQU0sR0FBRyxjQUFjLENBQUMscUJBQXFCLENBQUUsWUFBWSxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUUsQ0FBQztnQkFFakYsSUFBSyxTQUFTLENBQUMsT0FBTyxDQUFFLE1BQU0sQ0FBRSxLQUFLLENBQUMsQ0FBQyxJQUFJLE1BQU0sRUFDakQ7b0JBQ0ksU0FBUyxDQUFDLElBQUksQ0FBRSxNQUFNLENBQUUsQ0FBQztvQkFDekIsSUFBSSxRQUFRLEdBQUcsY0FBYyxDQUFDLFdBQVcsQ0FBRSxNQUFNLENBQUUsQ0FBQztvQkFDcEQsaUJBQWlCLENBQUUsQ0FBRSxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBRSxFQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRSxRQUFRLEVBQUUsc0JBQXNCLENBQUUsQ0FBQztpQkFDdEc7YUFDSjtTQUNKO1FBRUQsc0JBQXNCLENBQUMsZ0JBQWdCLENBQUUsU0FBUyxDQUFDLE9BQU8sQ0FBRSxVQUFVLENBQUUsQ0FBRSxDQUFDO1FBRTNFLHNCQUFzQixDQUFDLFdBQVcsQ0FBRSxNQUFNLENBQUUsQ0FBQztRQUM3QyxzQkFBc0IsQ0FBQyxPQUFPLEdBQUcsQ0FBRSxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBRSxDQUFDO1FBQzFELElBQUksV0FBVyxHQUFHLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBRSxhQUFhLENBQUUsQ0FBQztRQUNuRSxzQkFBc0IsQ0FBQyxhQUFhLENBQUUsZUFBZSxFQUFFLHlCQUF5QixDQUFDLElBQUksQ0FBRSxTQUFTLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSxZQUFZLENBQUUsQ0FBRSxDQUFDO0lBQ25KLENBQUMsQ0FBQztJQUVGLFNBQWdCLGVBQWUsQ0FBRyxLQUFjLEVBQUUsbUJBQTBCLEVBQUUsK0JBQXVDLEtBQUs7UUFFdEgsSUFBSSxTQUFTLEdBQXNCLFlBQVksQ0FBQyxRQUFRLENBQUUsbUJBQW1CLENBQUUsQ0FBQztRQUVoRixJQUFLLFNBQVMsS0FBSyxNQUFNLEVBQ3pCO1lBQ0ksU0FBUyxHQUFHLHVCQUF1QixDQUFFLEtBQUssRUFBRSxtQkFBbUIsQ0FBRSxDQUFDO1NBQ3JFO2FBQ0ksSUFBSyxTQUFTLEtBQUssT0FBTyxJQUFJLENBQUMsNEJBQTRCLEVBQ2hFO1lBQ0ksK0ZBQStGO1lBQy9GLFNBQVMsR0FBRyx1QkFBdUIsQ0FBRSxLQUFLLEVBQUUsbUJBQW1CLENBQUUsQ0FBQztZQUNsRSxnR0FBZ0c7WUFDaEcsb0NBQW9DO1lBQ3BDLDZGQUE2RjtZQUM3RixvQ0FBb0M7U0FDdkM7UUFFRCxJQUFLLEtBQUssSUFBSSxDQUFFLFNBQVMsS0FBSyxTQUFTLENBQUUsRUFDekM7WUFDSSxrQkFBa0IsQ0FBRSxLQUFLLEVBQUUsbUJBQW1CLENBQUUsQ0FBQztTQUNwRDtJQUNMLENBQUM7SUF0QmUseUJBQWUsa0JBc0I5QixDQUFBO0lBRUQsU0FBUyxrQkFBa0IsQ0FBRyxXQUFtQixFQUFFLG1CQUEwQixFQUFFLE9BQWM7UUFFekYsSUFBSSxXQUFXLEdBQUcsV0FBVyxDQUFDLGlCQUFpQixDQUFFLGFBQWEsQ0FBRSxDQUFDO1FBQ2pFLElBQUksUUFBUSxHQUFHLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBRSxtQkFBbUIsR0FBRyxHQUFHLEdBQUcsT0FBTyxDQUFFLENBQUM7UUFFcEYsSUFBSyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsWUFBWSxFQUNwQztZQUNJLFNBQVMsQ0FBQyxlQUFlLENBQUUsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLFlBQVksRUFBRSxLQUFLLENBQUUsQ0FBQztTQUN2RTtRQUNELElBQUssUUFBUSxFQUNiO1lBQ0ksV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLFlBQVksR0FBRSxRQUFRLENBQUM7U0FDN0M7UUFFRCxJQUFLLENBQUUsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLG9CQUFvQixDQUFFLElBQUksQ0FBRSxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsb0JBQW9CLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxLQUFLLE9BQU8sQ0FBRSxJQUFJLENBQUUsT0FBTyxJQUFJLE1BQU0sQ0FBRSxFQUNuSjtZQUNJLFNBQVMsQ0FBQyxPQUFPLENBQUUsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLG9CQUFvQixDQUFFLENBQUM7WUFDN0QsT0FBTztTQUNWO1FBRUQsSUFBSyxDQUFFLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBRSxJQUFJLENBQUUsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLG9CQUFvQixDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sSUFBSSxPQUFPLENBQUUsRUFDekg7WUFDSSxTQUFTLENBQUMsSUFBSSxDQUFFLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBRSxDQUFDO1lBQzFELFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxvQkFBb0IsR0FBRyxTQUFTLENBQUM7U0FDdkQ7UUFFRCxJQUFJLGVBQWUsR0FBRyxXQUFXLENBQUMsaUJBQWlCLENBQUUsTUFBTSxDQUFFLENBQUM7UUFDOUQsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLG9CQUFvQixHQUFHLGVBQWUsQ0FBQyxTQUFTLENBQUUsT0FBTyxHQUFHLE9BQU8sQ0FBRSxDQUFDO1FBQ3pGLElBQUssV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLG9CQUFvQixJQUFJLFNBQVMsRUFDekQ7WUFDSSxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsb0JBQW9CLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxPQUFPLEVBQUUsZUFBZSxFQUFFLE9BQU8sR0FBRyxPQUFPLENBQUUsQ0FBQztZQUN2RyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsb0JBQW9CLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztZQUNqRSxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsb0JBQW9CLENBQUMsSUFBSSxFQUFFLENBQUMsbUJBQW1CLEdBQUcsbUJBQW1CLENBQUM7WUFDekYsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLG9CQUFvQixDQUFDLFdBQVcsQ0FBRSx5Q0FBeUMsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFFLENBQUM7WUFDL0csV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLG9CQUFvQixDQUFDLElBQUksRUFBRSxDQUFDLGFBQWEsR0FBRyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsYUFBYSxDQUFDO1lBQ2hHLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxlQUFlLEdBQUcsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLGVBQWUsQ0FBQztZQUVwRyxTQUFTLENBQUMsSUFBSSxDQUFFLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBRSxDQUFDO1NBQzdEO2FBRUQ7WUFDSSxTQUFTLENBQUMsT0FBTyxDQUFFLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBRSxDQUFDO1NBQ2hFO0lBQ0wsQ0FBQztJQUVELFNBQVMsdUJBQXVCLENBQUcsS0FBYyxFQUFFLG1CQUEwQjtRQUV6RSxTQUFTLGlCQUFpQixDQUFHLFVBQWtCO1lBRTNDLGVBQWUsQ0FBRSxLQUFLLEVBQUUsVUFBVSxDQUFFLENBQUM7WUFDckMsSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDO1lBQ2IsSUFBSyxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUMsYUFBYSxFQUNwQztnQkFDSSxHQUFHLEdBQUcsaUNBQWlDLEdBQUcsVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUUsR0FBRyxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDN0Y7aUJBRUQ7Z0JBQ0ksUUFBUyxLQUFLLENBQUMsRUFBRSxFQUNqQjtvQkFDSSxLQUFLLFFBQVE7d0JBQ1QsR0FBRyxHQUFHLDBCQUEwQixDQUFDO3dCQUNqQyxNQUFNO29CQUNWLEtBQUssZUFBZTt3QkFDaEIsR0FBRyxHQUFHLGlDQUFpQyxDQUFDO3dCQUN4QyxNQUFNO2lCQUNiO2FBQ0o7WUFDRCxjQUFjLENBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxHQUFHLENBQUUsRUFBRSxJQUFJLEVBQUUsVUFBVSxDQUFFLENBQUM7WUFDdEQsVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDLHFCQUFxQixHQUFHLFNBQVMsQ0FBQztRQUN4RCxDQUFDO1FBRUQsSUFBSyxLQUFLLEVBQ1Y7WUFDSSxZQUFZLENBQUMsT0FBTyxDQUFFLG1CQUFtQixDQUFFLENBQUM7WUFFNUMsSUFBSSxRQUFRLEdBQUcsWUFBWSxDQUFDLFFBQVEsQ0FBRSxtQkFBbUIsQ0FBRSxDQUFDO1lBQzVELElBQUssUUFBUSxLQUFLLFNBQVMsRUFDM0I7Z0JBQ0ksRUFBRTtnQkFDRiwrQkFBK0I7Z0JBQy9CLHVGQUF1RjtnQkFDdkYsOEZBQThGO2dCQUM5RixpQ0FBaUM7Z0JBQ2pDLGtHQUFrRztnQkFDbEcsZUFBZSxDQUFFLElBQUksRUFBRSxLQUFLLENBQUUsQ0FBQztnQkFDL0IsY0FBYyxDQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFFLENBQUM7Z0JBQ25DLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxvQkFBb0IsR0FBRyxLQUFLLENBQUM7Z0JBRTFDLGlFQUFpRTtnQkFDakUsSUFBSyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMscUJBQXFCLEVBQ3ZDO29CQUNJLENBQUMsQ0FBQyxlQUFlLENBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLHFCQUFxQixDQUFFLENBQUM7b0JBQ3hELEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxxQkFBcUIsR0FBRyxTQUFTLENBQUM7aUJBQ2xEO2dCQUNELEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxxQkFBcUIsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFFLEdBQUcsRUFBRSxpQkFBaUIsQ0FBQyxJQUFJLENBQUUsU0FBUyxFQUFFLEtBQUssQ0FBRSxDQUFFLENBQUM7YUFDdEc7WUFDRCxPQUFPLFFBQVEsQ0FBQztTQUNuQjtJQUNMLENBQUM7SUFFRCxTQUFTLHlCQUF5QjtRQUU5QixjQUFjLENBQUMsWUFBWSxFQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsb0JBQW9CLEdBQUcsS0FBSyxDQUFDO0lBQ3ZFLENBQUM7SUFFRCxTQUFTLGtCQUFrQixDQUFFLFdBQW9CLEVBQUUsbUJBQTBCO1FBRXpFLElBQUssQ0FBQyxXQUFXO1lBQUcsT0FBTztRQUUzQixTQUFTLGlCQUFpQixDQUFHLGtCQUEyQixFQUFFLFFBQWU7WUFFckUsSUFBSSxRQUFRLEdBQUcsa0JBQWtCLENBQUMsaUJBQWlCLENBQUUsUUFBUSxDQUFFLENBQUM7WUFDaEUsU0FBUyxDQUFDLGVBQWUsQ0FBRSxRQUFRLEVBQUUsSUFBSSxDQUFFLENBQUM7UUFDaEQsQ0FBQztRQUVELFNBQVMsZ0JBQWdCLENBQUcsa0JBQTBCLEVBQUUsUUFBZTtZQUVuRSxJQUFJLFFBQVEsR0FBRyxrQkFBa0IsQ0FBQyxpQkFBaUIsQ0FBRSxRQUFRLENBQUUsQ0FBQztZQUNoRSxJQUFLLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxFQUMzQjtnQkFDSSxTQUFTLENBQUMsZUFBZSxDQUFFLFFBQVEsRUFBRSxLQUFLLENBQUUsQ0FBQzthQUNoRDtRQUNMLENBQUM7UUFFRCxTQUFTLGVBQWU7WUFFcEIsSUFBSyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsb0JBQW9CLEVBQzVDO2dCQUNJLFNBQVMsQ0FBQyxJQUFJLENBQUUsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLG9CQUFvQixDQUFFLENBQUM7Z0JBQzFELFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxvQkFBb0IsR0FBRyxTQUFTLENBQUM7YUFDdkQ7UUFDTCxDQUFDO1FBRUQsU0FBUyxxQkFBcUIsQ0FBRyxVQUFtQjtZQUVoRCxlQUFlLEVBQUUsQ0FBQztZQUNsQixZQUFZLENBQUMsd0JBQXdCLENBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBRSwwQkFBMEIsQ0FBRSxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUUsOEJBQThCLENBQUUsRUFBRSxFQUFFLEVBQUUsY0FBYyxZQUFZLENBQUMsZ0JBQWdCLENBQUUsTUFBTSxDQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsa0JBQWtCLENBQUMsSUFBSSxDQUFFLFNBQVMsRUFBRSxVQUFVLENBQUUsQ0FBRSxDQUFDO1FBQ3BQLENBQUM7UUFFRCxJQUFLLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxxQkFBcUIsRUFDN0M7WUFDSSxDQUFDLENBQUMsZUFBZSxDQUFFLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxDQUFDO1lBQzlELFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxxQkFBcUIsR0FBRyxTQUFTLENBQUM7U0FDeEQ7UUFFRCxTQUFTLGlCQUFpQixDQUFHLG1CQUEwQixFQUFFLGVBQTZCLEVBQUUsZUFBNkIsRUFBRSxXQUF5QixFQUFFLFNBQXVCLElBQUk7WUFFekssSUFBSSxRQUFRLEdBQUcsRUFBRSxDQUFDO1lBRWxCLEtBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxlQUFnQixFQUFFLENBQUMsRUFBRSxFQUMxQztnQkFDSSxJQUFJLE9BQU8sR0FBRyxFQUFFLENBQUM7Z0JBQ2pCLElBQUssZUFBZ0IsR0FBRyxDQUFDLEVBQ3pCO29CQUNJLE9BQU8sR0FBRyxjQUFjLENBQUMsc0JBQXNCLENBQUUsbUJBQW1CLEVBQUUsV0FBWSxFQUFFLENBQUMsQ0FBRSxDQUFDO2lCQUMzRjtxQkFDSSxJQUFLLGVBQWdCLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUNuRDtvQkFDSSxrRUFBa0U7b0JBQ2xFLE9BQU8sR0FBRyxZQUFZLENBQUMsZUFBZSxDQUFFLG1CQUFtQixFQUFFLENBQUMsQ0FBRSxDQUFDLFFBQVEsRUFBRSxDQUFDO2lCQUMvRTtnQkFFRCxJQUFLLGVBQWUsSUFBSSxNQUFNLElBQUksTUFBTSxJQUFJLENBQUMsRUFDN0M7b0JBQ0ksSUFBSyxhQUFhLENBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBRSxFQUNyQzt3QkFDSSxRQUFRLENBQUMsSUFBSSxDQUFFLE9BQU8sQ0FBRSxDQUFDO3FCQUM1QjtpQkFDSjtxQkFFRDtvQkFDSSxRQUFRLENBQUMsSUFBSSxDQUFFLE9BQU8sQ0FBRSxDQUFDO2lCQUM1QjthQUNKO1lBRUQsT0FBTyxRQUFRLENBQUM7UUFDcEIsQ0FBQztRQUVELFNBQVMsYUFBYSxDQUFHLE1BQWEsRUFBRSxPQUFjO1lBRWxELEtBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQzVCO2dCQUNJLElBQUssWUFBWSxDQUFDLHdCQUF3QixDQUFFLE9BQU8sRUFBRSxDQUFDLENBQUUsS0FBSyxNQUFNLEVBQ25FO29CQUNJLE9BQU8sSUFBSSxDQUFDO2lCQUNmO2FBQ0o7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNqQixDQUFDO1FBRUQsSUFBSSxlQUFlLEdBQUcsWUFBWSxDQUFDLFFBQVEsQ0FBRSxtQkFBbUIsQ0FBRSxDQUFDO1FBQ25FLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQztRQUNmLENBQUMsQ0FBQyxHQUFHLENBQUUsMEJBQTBCLEdBQUcsTUFBTSxHQUFHLGVBQWUsR0FBRyxtQkFBbUIsR0FBRyxNQUFNLENBQUUsQ0FBQztRQUM5RixJQUFJLFdBQVcsR0FBRyxDQUFDLENBQUM7UUFDcEIsSUFBSSxlQUFlLEdBQUcsQ0FBQyxDQUFDO1FBQ3hCLElBQUksZ0JBQWdCLEdBQVksRUFBRSxDQUFDO1FBRW5DLElBQUssQ0FBRSxlQUFlLEdBQUcsQ0FBQyxDQUFFLElBQUksQ0FBRSxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsYUFBYSxDQUFFLEVBQ3BFO1lBQ0ksZUFBZSxHQUFHLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFFLEdBQUcsQ0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ25FLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxlQUFlLEdBQUcsZUFBZSxDQUFDO1lBQ3JELElBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsNEJBQTRCLEVBQ3JEO2dCQUNJLElBQUssZUFBZSxHQUFHLENBQUMsRUFDeEI7b0JBQ0ksMEJBQTBCLENBQUUsV0FBVyxFQUFFLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxhQUFhLENBQUUsQ0FBQztvQkFDNUUsMkJBQTJCLENBQUUsV0FBVyxFQUFFLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxhQUFhLENBQUUsQ0FBQztpQkFDaEY7Z0JBQ0QsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLDRCQUE0QixHQUFHLElBQUksQ0FBQzthQUMxRDtZQUVELElBQUssZUFBZSxHQUFHLENBQUMsRUFDeEI7Z0JBQ0ksSUFBSSxVQUFVLEdBQUcsV0FBVyxDQUFDLGlCQUFpQixDQUFFLHdCQUF3QixDQUFnQixDQUFDO2dCQUN6RixXQUFXLEdBQUcsUUFBUSxDQUFFLFVBQVUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxZQUFZLEVBQUUsRUFBRSxDQUFFLENBQUMsQ0FBQztnQkFDekYsZUFBZSxHQUFHLGNBQWMsQ0FBQyxzQkFBc0IsQ0FBRSxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsYUFBYSxFQUFFLFdBQVcsQ0FBRSxDQUFDO2dCQUV6RyxJQUFJLGVBQWUsR0FBRyxXQUFXLENBQUMsaUJBQWlCLENBQUUsOEJBQThCLENBQWdCLENBQUM7Z0JBQUEsQ0FBQztnQkFDckcsSUFBSSxTQUFTLEdBQUcsZUFBZSxDQUFDLFdBQVcsRUFBRSxDQUFDLGtCQUFrQixDQUFFLFlBQVksRUFBRSxFQUFFLENBQUUsQ0FBQztnQkFDckYsSUFBSSxPQUFPLEdBQUcsU0FBUyxLQUFLLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUUsU0FBUyxDQUFFLENBQUM7Z0JBRWpFLGdCQUFnQixHQUFHLGlCQUFpQixDQUFFLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxhQUFhLEVBQUUsZUFBZSxFQUFFLGVBQWUsRUFBRSxXQUFXLEVBQUUsT0FBTyxDQUFFLENBQUM7Z0JBQ2pJLE1BQU0sR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUM7YUFDcEM7aUJBQ0ksSUFBSyxlQUFlLElBQUksQ0FBQyxFQUM5QjtnQkFDSSxnQkFBZ0IsR0FBRyxpQkFBaUIsQ0FBRSxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsYUFBYSxFQUFFLGVBQWUsRUFBRSxlQUFlLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBRSxDQUFDO2dCQUM5SCxNQUFNLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFBLHVDQUF1QzthQUMvRTtpQkFDSSxJQUFLLGVBQWUsSUFBSSxDQUFDLEVBQzlCO2dCQUNJLGdCQUFnQixHQUFHLGlCQUFpQixDQUFFLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxhQUFhLEVBQUUsZUFBZSxFQUFFLGVBQWUsRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFFLENBQUM7Z0JBQzlILE1BQU0sR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsa0JBQWtCO2FBQzNEO1NBQ0o7YUFFRDtZQUNJLGdCQUFnQixHQUFHLGlCQUFpQixDQUFFLG1CQUFtQixFQUFFLElBQUksRUFBRSxlQUFlLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBRSxDQUFDO1lBQy9GLE1BQU0sR0FBRyxlQUFlLENBQUM7U0FDNUI7UUFFRCxlQUFlLENBQUUsS0FBSyxFQUFFLFdBQVcsQ0FBRSxDQUFDO1FBQ3RDLDZDQUE2QztRQUM3QyxJQUFLLE1BQU0sSUFBSSxDQUFDLEVBQ2hCO1lBQ0ksYUFBYSxDQUFFLEtBQUssRUFBRSxXQUFXLENBQUUsQ0FBQztZQUNwQyxjQUFjLENBQUUsS0FBSyxFQUFFLFdBQVcsQ0FBRSxDQUFDO1lBQ3JDLElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQztZQUNiLElBQUssV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLGFBQWEsRUFDckM7Z0JBQ0ksR0FBRyxHQUFHLGlDQUFpQyxHQUFHLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFFLEdBQUcsQ0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQzlGO2lCQUVEO2dCQUNJLFFBQVMsV0FBVyxDQUFDLEVBQUUsRUFDdkI7b0JBQ0ksS0FBSyxRQUFRO3dCQUNULEdBQUcsR0FBRywwQkFBMEIsQ0FBQzt3QkFDakMsTUFBTTtvQkFDVixLQUFLLGVBQWU7d0JBQ2hCLEdBQUcsR0FBRyxpQ0FBaUMsQ0FBQzt3QkFDeEMsTUFBTTtvQkFDVixLQUFLLGNBQWM7d0JBQ2YsR0FBRyxHQUFHLGdDQUFnQyxDQUFDO3dCQUN2QyxNQUFNO2lCQUNiO2FBQ0o7WUFDRCxjQUFjLENBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxHQUFHLENBQUUsRUFBRSxJQUFJLEVBQUUsV0FBVyxDQUFFLENBQUM7U0FDMUQ7UUFFRCxJQUFJLFdBQVcsR0FBRyxXQUFXLENBQUMsaUJBQWlCLENBQUUsYUFBYSxDQUFFLENBQUM7UUFDakUsSUFBSyxDQUFDLFdBQVcsRUFDakI7WUFDSSxPQUFPO1NBQ1Y7UUFFRCxLQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsV0FBVyxDQUFDLGFBQWEsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUNyRDtZQUNJLFdBQVcsQ0FBQyxRQUFRLENBQUUsQ0FBQyxDQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztTQUN6RDtRQUVELFNBQVMsMEJBQTBCLENBQUcsT0FBYztZQUVoRCxJQUFJLGFBQWEsR0FBRyxXQUFXLENBQUMscUJBQXFCLENBQUUsbUJBQW1CLEdBQUcsR0FBRyxHQUFHLE9BQU8sQ0FBRSxDQUFDO1lBQzdGLElBQUssQ0FBQyxhQUFhLElBQUksbUJBQW1CLEtBQUssTUFBTSxFQUNyRDtnQkFDSSx5RUFBeUU7Z0JBQ3pFLElBQUssbUJBQW1CLEtBQUssTUFBTSxFQUNuQztvQkFDSSxJQUFLLGFBQWEsRUFDbEI7d0JBQ0ksYUFBYSxDQUFDLFdBQVcsQ0FBRSxHQUFHLENBQUUsQ0FBQztxQkFDcEM7aUJBQ0o7Z0JBRUQsYUFBYSxHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSxtQkFBbUIsR0FBRyxHQUFHLEdBQUcsT0FBTyxDQUFFLENBQUM7Z0JBQ2pHLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxvQkFBb0IsR0FBRyxTQUFTLENBQUM7Z0JBQ3RELGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxLQUFLLEdBQUcsV0FBVyxDQUFDLEVBQUUsQ0FBQztnQkFDNUMsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUM7Z0JBQ3hDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO2dCQUN2QyxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsbUJBQW1CLEdBQUcsbUJBQW1CLENBQUM7Z0JBQy9ELElBQUssT0FBTyxJQUFJLE1BQU0sRUFDdEI7b0JBQ0ksYUFBYSxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsa0JBQWtCLENBQUMsSUFBSSxDQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsbUJBQW1CLEVBQUUsT0FBTyxDQUFFLENBQUUsQ0FBQztpQkFDaEk7cUJBRUQ7b0JBQ0ksYUFBYSxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUscUJBQXFCLENBQUMsSUFBSSxDQUFFLFNBQVMsRUFBRSxXQUFXLENBQUUsQ0FBRSxDQUFDO2lCQUNyRztnQkFDRCxhQUFhLENBQUMsYUFBYSxDQUFFLGFBQWEsRUFBRSxpQkFBaUIsQ0FBQyxJQUFJLENBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxtQkFBbUIsR0FBRyxHQUFHLEdBQUcsT0FBTyxDQUFFLENBQUUsQ0FBQztnQkFDcEksYUFBYSxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsZ0JBQWdCLENBQUMsSUFBSSxDQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsbUJBQW1CLEdBQUcsR0FBRyxHQUFHLE9BQU8sQ0FBRSxDQUFFLENBQUM7Z0JBQ2xJLFNBQVMsQ0FBQyxJQUFJLENBQUUsYUFBYSxDQUFFLENBQUM7Z0JBQ2hDLGFBQWEsQ0FBQyxXQUFXLENBQUUscUJBQXFCLENBQUUsQ0FBQzthQUN0RDtpQkFFRDtnQkFDSSxTQUFTLENBQUMsT0FBTyxDQUFFLGFBQWEsQ0FBRSxDQUFDO2FBQ3RDO1lBQ0QsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUM7WUFFM0MsU0FBUyxvQkFBb0IsQ0FBRyxrQkFBMkI7Z0JBRXZELElBQUssQ0FBRSxrQkFBa0IsQ0FBRSxJQUFJLENBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxhQUFhLENBQUUsRUFDM0U7b0JBQ0ksSUFBSSxtQkFBbUIsR0FBRyxrQkFBa0IsQ0FBQyxxQkFBcUIsQ0FBRSxtQkFBbUIsQ0FBRSxDQUFDO29CQUMxRixJQUFLLG1CQUFtQixFQUN4Qjt3QkFDSSxJQUFJLGFBQWEsR0FBRyxPQUFPLENBQUUsQ0FBRSxZQUFZLENBQUMsYUFBYSxDQUFFLGtCQUFrQixDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBRSxLQUFLLGFBQWEsQ0FBRSxDQUFFLENBQUM7d0JBQ3JILElBQUksUUFBUSxHQUFHLE9BQU8sQ0FBRSxZQUFZLENBQUMsUUFBUSxDQUFFLGtCQUFrQixDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBRSxDQUFFLENBQUM7d0JBQ3JGLElBQUksTUFBTSxHQUFHLE9BQU8sQ0FBRSxZQUFZLENBQUMsTUFBTSxDQUFFLGtCQUFrQixDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBRSxDQUFFLENBQUM7d0JBQ2pGLG1CQUFtQixDQUFDLFdBQVcsQ0FBRSxvQkFBb0IsRUFBRSxhQUFhLENBQUUsQ0FBQzt3QkFDdkUsbUJBQW1CLENBQUMsV0FBVyxDQUFFLFdBQVcsRUFBRSxNQUFNLENBQUUsQ0FBQzt3QkFDdkQsbUJBQW1CLENBQUMsV0FBVyxDQUFFLFlBQVksRUFBRSxRQUFRLElBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQztxQkFDeEU7aUJBQ0o7WUFDTCxDQUFDO1lBRUQsSUFBSyxDQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxvQkFBb0IsSUFBSSxTQUFTLENBQUUsSUFBSSxhQUFhLENBQUMscUJBQXFCLENBQUUsbUJBQW1CLENBQUUsRUFDN0g7Z0JBQ0ksYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLG9CQUFvQixHQUFHLENBQUMsQ0FBQyx5QkFBeUIsQ0FBRSx5Q0FBeUMsRUFBRSxvQkFBb0IsQ0FBQyxJQUFJLENBQUUsU0FBUyxFQUFFLGFBQWEsQ0FBRSxDQUFFLENBQUM7YUFDL0s7WUFFRCxvSUFBb0k7WUFDcEksb0JBQW9CLENBQUUsYUFBYSxDQUFFLENBQUM7WUFHdEMsYUFBYSxDQUFDLFdBQVcsQ0FBRSxxQkFBcUIsQ0FBRSxDQUFDO1FBQ3ZELENBQUM7UUFFRCxLQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUNoQztZQUNJLElBQUssQ0FBRSxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsYUFBYSxDQUFFLElBQUksQ0FBRSxlQUFlLEdBQUcsQ0FBQyxDQUFFLEVBQ3BFO2dCQUNJLDBCQUEwQixDQUFFLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFFLENBQUM7YUFDckQ7aUJBRUQ7Z0JBQ0ksSUFBSSxZQUFZLEdBQUcsWUFBWSxDQUFDLGVBQWUsQ0FBRSxtQkFBbUIsRUFBRSxDQUFDLENBQUUsQ0FBQztnQkFDMUUsQ0FBQyxDQUFDLEdBQUcsQ0FBRSxzQkFBc0IsR0FBRyxDQUFDLEdBQUcsS0FBSyxHQUFHLE1BQU0sR0FBRyxLQUFLLEdBQUcsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQztnQkFDbkYsMEJBQTBCLENBQUUsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQzthQUNyRDtTQUNKO1FBR0QsSUFBSyxDQUFFLG1CQUFtQixLQUFLLE1BQU0sQ0FBRSxJQUFJLFdBQVcsQ0FBQyxxQkFBcUIsQ0FBRSxXQUFXLENBQUUsRUFDM0Y7WUFDSSxXQUFXLENBQUMscUJBQXFCLENBQUUsV0FBVyxDQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztTQUNoRjtRQUNELFVBQVUsQ0FBRSxXQUFXLEVBQUUsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLGFBQWEsQ0FBRSxDQUFDO1FBQzVELGdCQUFnQixDQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsbUJBQW1CLENBQUUsQ0FBQztRQUVsRSxJQUFLLE1BQU0sR0FBRyxDQUFDLEVBQ2Y7WUFDSSxjQUFjLENBQUUsSUFBSSxFQUFFLFdBQVcsQ0FBRSxDQUFDO1lBQ3BDLGFBQWEsQ0FBRSxJQUFJLEVBQUUsV0FBVyxDQUFFLENBQUM7WUFDbkMsY0FBYyxDQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsV0FBVyxDQUFFLENBQUM7U0FDNUM7UUFFRCwrQ0FBK0M7UUFDL0MsSUFBSyxDQUFFLG1CQUFtQixLQUFLLE1BQU0sQ0FBRSxJQUFJLENBQUUsTUFBTSxHQUFHLENBQUMsQ0FBRSxFQUN6RDtZQUNJLDBCQUEwQixDQUFFLE1BQU0sQ0FBRSxDQUFDO1NBQ3hDO1FBRUQsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQztJQUNuRCxDQUFDO0FBQ0wsQ0FBQyxFQWxyQlMsU0FBUyxLQUFULFNBQVMsUUFrckJsQiJ9