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
            let n = 0;
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
            listState = _RequestMatchListUpdate(elTab, matchListDescriptor);
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
                ShowListSpinner(true, elTab);
                SetListMessage("", false, elTab);
                elTab.Data().matchListIsPopulated = false;
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
                nCount = MatchIdsFiltered.length - 3;
            }
            else if (tournamentIndex == 3) {
                MatchIdsFiltered = GetListOfMatchIds(parentPanel.Data().tournament_id, tournamentIndex, unfilteredCount, sectionDesc, null);
                nCount = MatchIdsFiltered.length - 1;
            }
        }
        else {
            MatchIdsFiltered = GetListOfMatchIds(matchListDescriptor, null, unfilteredCount, null, null);
            nCount = unfilteredCount;
        }
        ShowListSpinner(false, parentPanel);
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
            _UpdateDownloadState(elMatchButton);
            elMatchButton.RemoveClass('MatchTile--Collapse');
        }
        for (let i = 0; i < nCount; i++) {
            if ((parentPanel.Data().tournament_id) && (tournamentIndex > 3)) {
                _CreateOrValidateMatchTile(MatchIdsFiltered[i]);
            }
            else {
                let matchbyindex = MatchListAPI.GetMatchByIndex(matchListDescriptor, i);
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
        if ((matchListDescriptor === 'live') && (nCount > 0)) {
            _CreateOrValidateMatchTile('gotv');
        }
        parentPanel.Data().matchListIsPopulated = true;
    }
})(matchList || (matchList = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWF0Y2hsaXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvbWF0Y2hsaXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFDbEMsMENBQTBDO0FBQzFDLHFDQUFxQztBQUVyQyxJQUFVLFNBQVMsQ0FrckJsQjtBQWxyQkQsV0FBVSxTQUFTO0lBR2YsSUFBSSxTQUFTLEdBQUcsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBRXZDLFNBQWdCLGVBQWUsQ0FBRyxLQUFhLEVBQUUsR0FBVztRQUV4RCxJQUFLLEdBQUcsRUFDUjtZQUNJLElBQUksU0FBUyxHQUFHLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBRSxpQkFBaUIsQ0FBRSxDQUFDO1lBQy9ELGFBQWEsQ0FBRSxLQUFLLEVBQUUsR0FBRyxDQUFFLENBQUM7WUFDNUIsY0FBYyxDQUFFLEtBQUssRUFBRSxHQUFHLENBQUUsQ0FBQztZQUM3QixJQUFLLFNBQVMsRUFDZDtnQkFDSSxJQUFLLEtBQUssRUFDVjtvQkFDSSxTQUFTLENBQUMsV0FBVyxDQUFFLE1BQU0sQ0FBRSxDQUFDO2lCQUNuQztxQkFFRDtvQkFDSSxTQUFTLENBQUMsUUFBUSxDQUFFLE1BQU0sQ0FBRSxDQUFDO2lCQUNoQzthQUNKO1NBQ0o7SUFDTCxDQUFDO0lBbkJlLHlCQUFlLGtCQW1COUIsQ0FBQTtJQUVELFNBQWdCLGNBQWMsQ0FBRyxLQUFZLEVBQUUsSUFBWSxFQUFFLE1BQXFCLElBQUk7UUFFbEYsSUFBSyxHQUFHLEVBQ1I7WUFDSSxJQUFJLFNBQVMsR0FBRyxHQUFHLENBQUMscUJBQXFCLENBQUUsaUJBQWlCLENBQWEsQ0FBQztZQUMxRSxJQUFLLFNBQVMsRUFDZDtnQkFDSSxTQUFTLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQzthQUMxQjtZQUNELElBQUksa0JBQWtCLEdBQUcsR0FBRyxDQUFDLHFCQUFxQixDQUFFLDJCQUEy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