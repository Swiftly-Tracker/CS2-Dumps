"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../popups/popup_major_hub.ts" />
var PredictionsBracket;
(function (PredictionsBracket) {
    let _m_foundTarget = false;
    let _m_aBracketSectionIndexes = [g_ActiveTournamentInfo.num_stages_with_swiss, g_ActiveTournamentInfo.num_stages_with_swiss + 1, g_ActiveTournamentInfo.num_stages_with_swiss + 2];
    let _m_aPickPanels;
    function Init() {
        let oPageData = PopupMajorHub.GetActivePageData();
        if (!oPageData.hasAlreadyInit.includes(oPageData.panel.id)) {
            SetPicksDataOnPanels(oPageData.panel, oPageData.tournamentId);
        }
        _UpdateAllPickSections();
        InitializeMatchLister(oPageData);
    }
    PredictionsBracket.Init = Init;
    function SetPicksDataOnPanels(elPanel, tournamentId) {
        _m_aPickPanels = [];
        let sectionId = PredictionsAPI.GetEventSectionIDByIndex(tournamentId, _m_aBracketSectionIndexes[0]);
        let groupId = PredictionsAPI.GetSectionGroupIDByIndex(tournamentId, sectionId, 0);
        let elGroup = elPanel.FindChildInLayoutFile('bracket-section-3-group-0');
        let elTeam = elGroup.FindChildInLayoutFile('team-pick-0');
        elTeam.Data().pickSection = _m_aBracketSectionIndexes[0];
        elTeam.Data().pickGroup = 0;
        elTeam.Data().groupId = groupId;
        elTeam.Data().pickId = '0';
        elTeam.Data().validSlotIds = "4,6";
        _m_aPickPanels.push(elTeam);
        groupId = PredictionsAPI.GetSectionGroupIDByIndex(tournamentId, sectionId, 1);
        elTeam = elGroup.FindChildInLayoutFile('team-pick-1');
        elTeam.Data().pickSection = _m_aBracketSectionIndexes[0];
        elTeam.Data().pickGroup = 1;
        elTeam.Data().groupId = groupId;
        elTeam.Data().pickId = "1";
        elTeam.Data().validSlotIds = "4,6";
        _m_aPickPanels.push(elTeam);
        groupId = PredictionsAPI.GetSectionGroupIDByIndex(tournamentId, sectionId, 2);
        elGroup = elPanel.FindChildInLayoutFile('bracket-section-3-group-1');
        elTeam = elGroup.FindChildInLayoutFile('team-pick-0');
        elTeam.Data().pickSection = _m_aBracketSectionIndexes[0];
        elTeam.Data().pickGroup = 2;
        elTeam.Data().groupId = groupId;
        elTeam.Data().pickId = '2';
        elTeam.Data().validSlotIds = "5,6";
        _m_aPickPanels.push(elTeam);
        groupId = PredictionsAPI.GetSectionGroupIDByIndex(tournamentId, sectionId, 3);
        elTeam = elGroup.FindChildInLayoutFile('team-pick-1');
        elTeam.Data().pickSection = _m_aBracketSectionIndexes[0];
        elTeam.Data().pickGroup = 3;
        elTeam.Data().pickId = "3";
        elTeam.Data().groupId = groupId;
        elTeam.Data().validSlotIds = "5,6";
        _m_aPickPanels.push(elTeam);
        sectionId = PredictionsAPI.GetEventSectionIDByIndex(tournamentId, _m_aBracketSectionIndexes[1]);
        groupId = PredictionsAPI.GetSectionGroupIDByIndex(tournamentId, sectionId, 0);
        elGroup = elPanel.FindChildInLayoutFile('bracket-section-4-group-0');
        elTeam = elGroup.FindChildInLayoutFile('team-pick-0');
        elTeam.Data().pickSection = _m_aBracketSectionIndexes[1];
        elTeam.Data().pickGroup = 0;
        elTeam.Data().groupId = groupId;
        elTeam.Data().pickId = "4";
        elTeam.Data().validSlotIds = "6";
        _m_aPickPanels.push(elTeam);
        groupId = PredictionsAPI.GetSectionGroupIDByIndex(tournamentId, sectionId, 1);
        elTeam = elGroup.FindChildInLayoutFile('team-pick-1');
        elTeam.Data().pickSection = _m_aBracketSectionIndexes[1];
        elTeam.Data().pickGroup = 1;
        elTeam.Data().groupId = groupId;
        elTeam.Data().pickId = "5";
        elTeam.Data().validSlotIds = "6";
        _m_aPickPanels.push(elTeam);
        sectionId = PredictionsAPI.GetEventSectionIDByIndex(tournamentId, _m_aBracketSectionIndexes[2]);
        groupId = PredictionsAPI.GetSectionGroupIDByIndex(tournamentId, sectionId, 0);
        elGroup = elPanel.FindChildInLayoutFile('bracket-section-5');
        elTeam = elGroup.FindChildInLayoutFile('team-pick-0');
        elTeam.Data().pickSection = _m_aBracketSectionIndexes[2];
        elTeam.Data().pickGroup = 0;
        elTeam.Data().groupId = groupId;
        elTeam.Data().pickId = "6";
        _m_aPickPanels.push(elTeam);
        _m_aPickPanels.forEach(element => {
            _AddDragSourceEvents(element);
            _ItemDragDropEvents(element);
        });
    }
    function _AddDragSourceEvents(elTeam) {
        $.RegisterEventHandler('DragStart', elTeam, (elPanel, drag) => {
            OnDragStart(elTeam, drag);
            _GetValidDropTargets(elTeam.Data().validSlotIds).forEach(panel => panel.SetHasClass('is-dragging', true));
            elTeam.AddClass('dragged-away');
        });
        $.RegisterEventHandler('DragEnd', elTeam, (elRadial, elDragImage) => {
            OnDragEnd(elDragImage);
            _GetValidDropTargets(elTeam.Data().validSlotIds).forEach(panel => panel.SetHasClass('is-dragging', false));
            elTeam.RemoveClass('dragged-away');
        });
    }
    function _ItemDragDropEvents(elTarget) {
        $.RegisterEventHandler('DragEnter', elTarget, () => {
            elTarget.AddClass('bracket-stage-drag-enter');
        });
        $.RegisterEventHandler('DragLeave', elTarget, () => {
            elTarget.RemoveClass('bracket-stage-drag-enter');
        });
        $.RegisterEventHandler('DragDrop', elTarget, (dispayId, elDragImage) => {
            _OnDragDrop(elTarget, elDragImage);
        });
    }
    function OnDragStart(elDragSource, drag) {
        let elDragImage = $.CreatePanel('ItemImage', $.GetContextPanel(), '', {
            class: 'group-stage-drag-icon',
            textureheight: '48',
            texturewidth: '48'
        });
        elDragImage.SetImage(PopupMajorHub.GetTeamIcon(elDragSource.Data().teamId));
        elDragImage.AddClass('start-drag');
        elDragImage.Data().teamId = elDragSource.Data().teamId;
        elDragImage.Data().pickId = elDragSource.Data().pickId;
        elDragImage.Data().validSlotIds = elDragSource.Data().validSlotIds;
        PopupMajorHub.m_elDragImage = elDragImage;
        drag.displayPanel = elDragImage;
        drag.offsetX = 32;
        drag.offsetY = 32;
        drag.removePositionBeforeDrop = false;
        $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.inventory_item_pickup', 'MOUSE');
    }
    function OnDragEnd(elDragImage) {
        if (!_m_foundTarget) {
            let aValidTargets = _GetValidDropTargets(elDragImage.Data().validSlotIds + ',' + elDragImage.Data().pickId);
            aValidTargets.forEach(target => {
                if (parseInt(target.Data().pickId) >= parseInt(elDragImage.Data().pickId)) {
                    _UpdateDropTarget(target, null);
                    $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.inventory_item_notequipped', 'MOUSE');
                }
            });
        }
        elDragImage.AddClass('drag-end');
        PopupMajorHub.DeleteDragItem();
        _m_foundTarget = false;
    }
    function _OnDragDrop(elTarget, elDragImage) {
        _m_foundTarget = true;
        let teamIdRemoved = elTarget.Data().teamId;
        let aValidTargets = _GetValidDropTargets(elDragImage.Data().validSlotIds);
        aValidTargets.forEach(target => {
            if (parseInt(target.Data().pickId) <= parseInt(elTarget.Data().pickId)) {
                _UpdateDropTarget(target, elDragImage.Data().teamId);
                $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.inventory_item_putdown', 'MOUSE');
            }
            else {
                if (target.Data().teamId === teamIdRemoved &&
                    elTarget.Data().teamId !== target.Data().teamId) {
                    teamIdRemoved = target.Data().teamId;
                    _UpdateDropTarget(target, null);
                }
            }
        });
    }
    function _UpdateDropTarget(elTarget, teamId) {
        if (elTarget && elTarget.IsValid()) {
            let oPageData = PopupMajorHub.GetActivePageData();
            let isActiveSection = PredictionsAPI.GetSectionIsActive(oPageData.tournamentId, oPageData.sectionId);
            let canPick = PredictionsAPI.GetGroupCanPick(oPageData.tournamentId, oPageData.groupId);
            elTarget.SetDraggable((isActiveSection && canPick));
            elTarget.Data().teamId = teamId;
            if (teamId === null || !isActiveSection || !canPick) {
                elTarget.SwitchClass('team-state', 'team-locked');
            }
            else {
                elTarget.SwitchClass('team-state', '');
            }
            UpdatePick(oPageData, elTarget, teamId === null ? 0 : teamId);
        }
    }
    function _GetValidDropTargets(validSlotIds) {
        let aValidSlots;
        aValidSlots = [];
        if (validSlotIds) {
            validSlotIds.split(',').forEach(id => _m_aPickPanels.forEach(panel => {
                if (panel.Data().pickId === id) {
                    aValidSlots.push(panel);
                }
            }));
        }
        return aValidSlots;
    }
    function _UpdateAllPickSections() {
        let oPageData = PopupMajorHub.GetActivePageData();
        for (var i = 0; i < _m_aBracketSectionIndexes.length; i++) {
            if (i == 0) {
                _SetUpStartTeams(oPageData);
            }
            _UpdateAllPicksForSection(oPageData, _m_aBracketSectionIndexes[i]);
        }
    }
    ;
    function UpdateFromPredictionUploadedEvent() {
        _UpdateAllPickSections();
    }
    PredictionsBracket.UpdateFromPredictionUploadedEvent = UpdateFromPredictionUploadedEvent;
    function _SetUpStartTeams(oPageData) {
        let sectionId = PredictionsAPI.GetEventSectionIDByIndex(oPageData.tournamentId, _m_aBracketSectionIndexes[0]);
        let nGroupCount = PredictionsAPI.GetSectionGroupsCount(oPageData.tournamentId, sectionId);
        let isActiveSection = PredictionsAPI.GetSectionIsActive(oPageData.tournamentId, sectionId);
        for (let i = 0; i < nGroupCount; ++i) {
            let groupId = PredictionsAPI.GetSectionGroupIDByIndex(oPageData.tournamentId, sectionId, i);
            let canPick = PredictionsAPI.GetGroupCanPick(oPageData.tournamentId, groupId);
            let elGroup = oPageData.panel.FindChildInLayoutFile('bracket-section-' + 2 + '-group-' + i);
            let sValidSlotIds = elGroup.GetAttributeString('data-valid-slots', '');
            let nTeamCount = PredictionsAPI.GetGroupTeamsCount(oPageData.tournamentId, groupId);
            for (var j = 0; j < nTeamCount; j++) {
                let teamId = PredictionsAPI.GetGroupTeamIDByIndex(oPageData.tournamentId, groupId, j);
                let elTeam = elGroup.FindChildInLayoutFile('team-pick-' + j);
                elTeam.Data().validSlotIds = sValidSlotIds;
                elTeam.Data().teamId = teamId;
                SetTeamName(elTeam, teamId, true);
                elTeam.FindChild('id-team-logo').SetImage(!elTeam || teamId === 0 ?
                    '' :
                    PopupMajorHub.GetTeamIcon(teamId));
                if (!oPageData.hasAlreadyInit.includes(oPageData.panel.id)) {
                    _AddDragSourceEvents(elTeam);
                }
                elTeam.SwitchClass('team-state', 'not-active');
                elTeam.SetDraggable((isActiveSection && canPick));
                elTeam.hittest = (isActiveSection && canPick);
                elTeam.hittestchildren = (isActiveSection && canPick);
            }
        }
    }
    function _UpdateAllPicksForSection(oPageData, sectionIndex) {
        let aPicksInSection = _m_aPickPanels.filter(element => element.Data().pickSection === sectionIndex);
        aPicksInSection.forEach(element => {
            UpdatePick(oPageData, element, 0, true);
        });
    }
    function UpdatePick(oPageData, elTeam, teamId = 0, bUsePrediction = false) {
        let secId = PredictionsAPI.GetEventSectionIDByIndex(oPageData.tournamentId, elTeam.Data().pickSection);
        let groupId = PredictionsAPI.GetSectionGroupIDByIndex(oPageData.tournamentId, secId, elTeam.Data().pickGroup);
        let isActiveSection = PredictionsAPI.GetSectionIsActive(oPageData.tournamentId, oPageData.sectionId);
        let canPick = PredictionsAPI.GetGroupCanPick(oPageData.tournamentId, groupId);
        teamId = (teamId === 0 && bUsePrediction) ? PredictionsAPI.GetMyPredictionTeamID(oPageData.tournamentId, groupId, 0) : teamId;
        elTeam.Data().teamId = teamId;
        SetTeamName(elTeam, teamId);
        elTeam.FindChild('id-team-logo').SetImage(!elTeam || teamId === 0 ?
            '' :
            PopupMajorHub.GetTeamIcon(teamId));
        let sCorrectPicks = PredictionsAPI.GetGroupCorrectPicksByIndex(oPageData.tournamentId, groupId, 0);
        if (PopupMajorHub.CheckIfPickIsCorrect(sCorrectPicks, teamId) && teamId) {
            elTeam.SwitchClass('team-state', 'is-correct');
        }
        else if (teamId && !isActiveSection) {
            elTeam.SwitchClass('team-state', 'is-incorrect');
        }
        else {
            elTeam.SwitchClass('team-state', '');
        }
        elTeam.SetDraggable((isActiveSection && canPick));
        elTeam.hittest = (isActiveSection && canPick);
        elTeam.hittestchildren = (isActiveSection && canPick);
        SavePicksButton.UpdateBtn(_GetLocalSetPicks());
    }
    function SetTeamName(elTeam, teamId, bisStartTeam = false) {
        elTeam.SetDialogVariable('team-name', teamId === 0 && elTeam.BHasClass('bracket-team-pick') && !bisStartTeam ?
            $.Localize('#CSGO_Fantasy_Team_Action') :
            teamId === 0 ?
                $.Localize('#CSGO_PickEm_Team_TBD') :
                PredictionsAPI.GetTeamName(teamId));
    }
    function _GetLocalSetPicks() {
        let aPicks = [];
        _m_aPickPanels.forEach(pick => {
            if (pick.Data().teamId && pick.Data().teamId !== 0) {
                aPicks.push({ teamId: pick.Data().teamId, group: pick.Data().groupId, groupIndex: 0 });
            }
        });
        return aPicks;
    }
    ;
    let _m_elSections = {};
    function _GetMatchlisterMatchupsIdForWinCount(numWs) {
        return 'bracket-section-' + (2 + numWs);
    }
    function _SetTeamDataIntoPanel(elPanel, idx, teamtag, teamname, score, bIsCorrectPickemPick, extraClass = '') {
        if (!elPanel)
            return;
        elPanel = elPanel.FindChildInLayoutFile('team-result-' + idx);
        if (!elPanel)
            return;
        elPanel.SetDialogVariable('team-name', teamname);
        elPanel.SetDialogVariable('team-score', (score < 0) ? '' : ('' + score));
        if (extraClass)
            elPanel.AddClass(extraClass);
        elPanel.FindChildInLayoutFile('id-team-logo').SetImage("file://{images}/tournaments/teams/" + teamtag + ".svg");
        if (bIsCorrectPickemPick)
            elPanel.AddClass('is-correct');
    }
    function InitializeMatchLister(oPageData) {
        if (MatchListAPI.GetState(oPageData.tournamentId) !== 'ready')
            return;
        for (let numWs = 0; numWs <= 3; ++numWs) {
            let strMatchups = _GetMatchlisterMatchupsIdForWinCount(numWs);
            let elMatchups = oPageData.panel.FindChildInLayoutFile(strMatchups);
            if (!elMatchups)
                continue;
            let arrTeamPairs = [];
            for (let iMatch = 0;; ++iMatch) {
                let elTeamPair = elMatchups.FindChildInLayoutFile(strMatchups + '-group-' + iMatch);
                if (!elTeamPair)
                    break;
                arrTeamPairs.push({ panel: elTeamPair, keyteamwl: 0, keyteam_wins: 0, keyteam_loss: 0 });
                elTeamPair.SetHasClass('has_valid_matchup', false);
                elTeamPair.SetHasClass('has_match_in_progress', false);
                elTeamPair.SetHasClass('is_winner', false);
                elTeamPair.SetHasClass('is_loser', false);
                [elTeamPair.FindChildInLayoutFile('team-result-0'),
                    elTeamPair.FindChildInLayoutFile('team-result-1')].forEach(elTeam => {
                    if (elTeam) {
                        elTeam.SetDialogVariable('team-name', $.Localize('#CSGO_PickEm_Team_TBD'));
                        elTeam.SetDialogVariable('team-score', '');
                        elTeam.FindChildInLayoutFile('id-team-logo').SetImage(oPageData.tournamentId == "tournament:24" ? "file://{images}/tournaments/unknown_team_dark.svg" : "file://{images}/tournaments/unknown_team.svg");
                        elTeam.RemoveClass('is-correct');
                    }
                });
                elTeamPair.Data().umids = [];
                if (numWs < 3)
                    elTeamPair.SetPanelEvent('onactivate', () => {
                        let sUmids = (elTeamPair.Data().umids.length > 0) ? elTeamPair.Data().umids.join(',') : '';
                        if (!sUmids)
                            return;
                        var contextMenuPanel = UiToolkitAPI.ShowCustomLayoutContextMenuParameters('', '', 'file://{resources}/layout/context_menus/context_menu_get_souvenir.xml', 'umids=' + sUmids +
                            '&' + 'tournamentId=' + PopupMajorHub.GetActivePageData().eventId);
                        contextMenuPanel.AddClass("ContextMenu_NoArrow");
                    });
            }
            _m_elSections[strMatchups] = { matches: arrTeamPairs };
        }
        let teamStates = {};
        function GetTeamState(teamid) {
            if (!teamStates.hasOwnProperty(teamid)) {
                teamStates[teamid] = {
                    wins: 0,
                    loss: 0,
                    boXw: 0,
                    boXl: 0
                };
            }
            return teamStates[teamid];
        }
        function AddWin(state, winsNeeded) {
            ++state.boXw;
            if (state.boXw >= winsNeeded) {
                state.boXw = state.boXl = 0;
                ++state.wins;
            }
        }
        function AddLoss(state, winsNeeded) {
            ++state.boXl;
            if (state.boXl >= winsNeeded) {
                state.boXl = state.boXw = 0;
                ++state.loss;
            }
        }
        for (let idxGroup = 0; idxGroup < 4; ++idxGroup) {
            let nTeams = PredictionsAPI.GetGroupTeamsCount(oPageData.tournamentId, oPageData.groupId + idxGroup);
            for (let i = 0; i < nTeams; ++i) {
                let teamId = PredictionsAPI.GetGroupTeamIDByIndex(oPageData.tournamentId, oPageData.groupId + idxGroup, i);
                if (teamId !== 0 && teamId && !PredictionsAPI.GetFakeItemIDToRepresentTeamID(oPageData.tournamentId, teamId))
                    teamId = 0;
                if (!teamId)
                    continue;
                let teamtag = PredictionsAPI.GetTeamTag(teamId);
                let idxMatchup = idxGroup;
                let idxSlotInMatch = i;
                _SetTeamDataIntoPanel(_m_elSections[_GetMatchlisterMatchupsIdForWinCount(0)].matches[idxGroup].panel, idxSlotInMatch, teamtag, PredictionsAPI.GetTeamName(teamId), -1, false);
                for (let numWs = 0; numWs <= 3; ++numWs) {
                    let matchup = _GetMatchlisterMatchupsIdForWinCount(numWs);
                    _m_elSections[matchup][teamtag] = idxMatchup;
                    _m_elSections[matchup]['slot:' + teamtag] = idxSlotInMatch;
                    idxSlotInMatch = idxMatchup % 2;
                    idxMatchup = (idxMatchup - (idxMatchup % 2)) / 2;
                }
            }
        }
        for (let idxSection = 0; idxSection <= 2; ++idxSection) {
            let nCount = PredictionsAPI.GetSectionMatchesCount(oPageData.tournamentId, oPageData.sectionId + idxSection);
            for (let idxMatch = nCount; idxMatch-- > 0;) {
                let umid = PredictionsAPI.GetSectionMatchByIndex(oPageData.tournamentId, oPageData.sectionId + idxSection, idxMatch);
                let team0 = MatchInfoAPI.GetMatchTournamentTeamTag(umid, 0);
                let team1 = MatchInfoAPI.GetMatchTournamentTeamTag(umid, 1);
                let team0name = MatchInfoAPI.GetMatchTournamentTeamName(umid, 0);
                let team1name = MatchInfoAPI.GetMatchTournamentTeamName(umid, 1);
                let res = MatchInfoAPI.GetMatchOutcome(umid);
                let bMatchStillInProgress = (!res || res <= 0);
                let matchup = _GetMatchlisterMatchupsIdForWinCount(GetTeamState(team0).wins);
                if (!_m_elSections[matchup].hasOwnProperty(team0) || !_m_elSections[matchup].hasOwnProperty(team1))
                    continue;
                let winteam = ((res == 2) ? team1 : team0);
                let keyteam = (_m_elSections[matchup]['slot:' + team0] === 0) ? team0 : team1;
                let steam = GetTeamState(keyteam);
                const nStageID = MatchInfoAPI.GetMatchTournamentStageID(umid);
                const numWinsNeeded = MatchInfoAPI.GetMatchTournamentStageIDWinsNeeded(nStageID);
                if (_m_elSections[matchup][keyteam] < _m_elSections[matchup].matches.length) {
                    let omatch = _m_elSections[matchup].matches[_m_elSections[matchup][keyteam]];
                    let elTeamPair = omatch.panel;
                    let nCountThisMatchForBO3 = bMatchStillInProgress ? 0 : 1;
                    omatch.keyteamwl += ((winteam == keyteam) ? 1 : -1) * nCountThisMatchForBO3;
                    omatch.keyteam_wins += ((winteam == keyteam) ? 1 : 0) * nCountThisMatchForBO3;
                    omatch.keyteam_loss += ((winteam != keyteam) ? 1 : 0) * nCountThisMatchForBO3;
                    let bSwap01 = ((team0 == keyteam) ? false : true);
                    let nLeftScore = omatch.keyteam_wins;
                    let nRightScore = omatch.keyteam_loss;
                    elTeamPair.SetHasClass('has_valid_matchup', true);
                    elTeamPair.SetHasClass('has_match_in_progress', bMatchStillInProgress);
                    _SetTeamDataIntoPanel(elTeamPair, 0, (bSwap01 ? team1 : team0), (bSwap01 ? team1name : team0name), nLeftScore, false, (nLeftScore == numWinsNeeded || nRightScore == numWinsNeeded) ? (nLeftScore == numWinsNeeded ? 'is_winner' : 'is_loser') : '');
                    _SetTeamDataIntoPanel(elTeamPair, 1, (bSwap01 ? team0 : team1), (bSwap01 ? team0name : team1name), nRightScore, false, (nLeftScore == numWinsNeeded || nRightScore == numWinsNeeded) ? (nRightScore == numWinsNeeded ? 'is_winner' : 'is_loser') : '');
                    elTeamPair.Data().umids.push(umid);
                    if (bMatchStillInProgress)
                        elTeamPair.Data().umids = [];
                    if (nLeftScore == numWinsNeeded || nRightScore == numWinsNeeded) {
                        let matchOffset = _m_elSections[matchup][keyteam];
                        let groupOffset = ((idxSection == 2) ? 6 : (idxSection * 4)) + matchOffset;
                        let teamidPicked = PredictionsAPI.GetMyPredictionTeamID(oPageData.tournamentId, oPageData.groupId + groupOffset, 0);
                        let teamTagPicked = PredictionsAPI.GetTeamTag(teamidPicked);
                        let nextmatchup = _GetMatchlisterMatchupsIdForWinCount(steam.wins + 1);
                        let elMatch = _m_elSections[nextmatchup].matches[(matchOffset - (matchOffset % 2)) / 2];
                        _SetTeamDataIntoPanel(elMatch.panel, matchOffset % 2, winteam, (winteam === team0) ? team0name : team1name, -1, teamTagPicked === winteam);
                    }
                }
                if (!bMatchStillInProgress) {
                    AddWin(GetTeamState(winteam), numWinsNeeded);
                    AddLoss(GetTeamState((team0 == winteam) ? team1 : team0), numWinsNeeded);
                }
            }
        }
    }
})(PredictionsBracket || (PredictionsBracket = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZGljdGlvbnNfYnJhY2tldF9zdGFnZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3RvdXJuYW1lbnRzL3ByZWRpY3Rpb25zX2JyYWNrZXRfc3RhZ2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyxxREFBcUQ7QUFFckQsSUFBVSxrQkFBa0IsQ0F1bkIzQjtBQXZuQkQsV0FBVSxrQkFBa0I7SUFFeEIsSUFBSSxjQUFjLEdBQVksS0FBSyxDQUFDO0lBQ3BDLElBQUkseUJBQXlCLEdBQWEsQ0FBRSxzQkFBc0IsQ0FBQyxxQkFBcUIsRUFBRSxzQkFBc0IsQ0FBQyxxQkFBcUIsR0FBRyxDQUFDLEVBQUUsc0JBQXNCLENBQUMscUJBQXFCLEdBQUcsQ0FBQyxDQUFFLENBQUM7SUFDL0wsSUFBSSxjQUF5QixDQUFDO0lBRzlCLFNBQWdCLElBQUk7UUFFaEIsSUFBSSxTQUFTLEdBQUcsYUFBYSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFJbEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFFLEVBQzVEO1lBRUksb0JBQW9CLENBQUUsU0FBUyxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsWUFBWSxDQUFFLENBQUM7U0FNbkU7UUFFRCxzQkFBc0IsRUFBRSxDQUFDO1FBRXpCLHFCQUFxQixDQUFFLFNBQVMsQ0FBRSxDQUFDO0lBQ3ZDLENBQUM7SUFwQmUsdUJBQUksT0FvQm5CLENBQUE7SUFFRCxTQUFTLG9CQUFvQixDQUFDLE9BQWdCLEVBQUUsWUFBbUI7UUFFL0QsY0FBYyxHQUFHLEVBQUUsQ0FBQztRQUNwQixJQUFJLFNBQVMsR0FBRyxjQUFjLENBQUMsd0JBQXdCLENBQUMsWUFBWSxFQUFFLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFFLENBQUM7UUFDckcs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