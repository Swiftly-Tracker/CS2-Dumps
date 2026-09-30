"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../popups/popup_major_hub.ts" />
var PredictionsBracket;
(function (PredictionsBracket) {
    let _m_foundTarget = false;
    let _m_aBracketSectionIndexes = [g_ActiveTournamentInfo.num_stages_with_swiss, g_ActiveTournamentInfo.num_stages_with_swiss + 1, g_ActiveTournamentInfo.num_stages_with_swiss + 2];
    let _m_aPickPanels;
    // Current version of how groups stages work.
    function Init() {
        let oPageData = PopupMajorHub.GetActivePageData();
        // Doesn't re-fetch saved picks for display the picks when you are just browsing tabs in the major hub
        // So picks do not change user the user.
        if (!oPageData.hasAlreadyInit.includes(oPageData.panel.id)) {
            SetPicksDataOnPanels(oPageData.panel, oPageData.tournamentId);
            // _UpdateDragTargets( oPageData );
            // _UpdateDragSourceTeams( oPageData );
            // _SetUpExtraPickBtns( oPageData );
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
            // PopupMajorHub.GetActivePageData().panel.SetHasClass( 'is-dragging', true );
            _GetValidDropTargets(elTeam.Data().validSlotIds).forEach(panel => panel.SetHasClass('is-dragging', true));
            elTeam.AddClass('dragged-away');
        });
        $.RegisterEventHandler('DragEnd', elTeam, (elRadial, elDragImage) => {
            OnDragEnd(elDragImage);
            // PopupMajorHub.GetActivePageData().panel.SetHasClass( 'is-dragging', false );
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
        // Parent to $.GetContextPanel() instead of elDragSource.
        // Parenting to elDragSource results in item images getting stuck in weird places for some reason.
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
        // elDragImage.Data().isSource = elDragSource.Data().isSource ? elDragSource.Data().isSource : false;
        PopupMajorHub.m_elDragImage = elDragImage;
        drag.displayPanel = elDragImage;
        drag.offsetX = 32;
        drag.offsetY = 32;
        drag.removePositionBeforeDrop = false;
        $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.inventory_item_pickup', 'MOUSE');
    }
    function OnDragEnd(elDragImage) {
        // Drop event fires before EndDrag.
        // If user did not successfully drop and are not from the source icons then remove the pick from the slot
        // User dragged out into empty space
        if (!_m_foundTarget) {
            // Add your source slot to the valid list
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
        // Null clears out the slot
        if (elTarget && elTarget.IsValid()) {
            let oPageData = PopupMajorHub.GetActivePageData();
            let isActiveSection = PredictionsAPI.GetSectionIsActive(oPageData.tournamentId, oPageData.sectionId);
            let canPick = PredictionsAPI.GetGroupCanPick(oPageData.tournamentId, oPageData.groupId);
            elTarget.SetDraggable((isActiveSection && canPick));
            elTarget.Data().teamId = teamId;
            // elTarget.SetHasClass( 'has-pick', teamId !== null  ? true : false );
            // elTarget.SetHasClass( 'not-active', teamId !== null );
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
        // picks are for the previous section's matches
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
        else if (teamId && !isActiveSection) // only add the correct-state if user made a pick
         {
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
    //
    // Data and methods for match lister presentation
    //
    let _m_elSections = {};
    function _GetMatchlisterMatchupsIdForWinCount(numWs) {
        // Section 3 is Semifinal (teams have 1 win in the bracket, i.e. they won Quarterfinal)
        // Section 4 is the Grand Final
        // Section 5 is fake for the Champion (there's no opponent in that matchup)
        return 'bracket-section-' + (2 + numWs);
    }
    function _SetTeamDataIntoPanel(elPanel, idx, teamtag, teamname, score, bIsCorrectPickemPick, extraClass = '') {
        $.Msg(`       _SetTeamDataIntoPanel ${elPanel.id} (slot ${idx}) - ${teamname} - score ${score} ${bIsCorrectPickemPick ? 'CORRECT' : ''}`);
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
        if (bIsCorrectPickemPick) // important to not remove this class, because matchups are setting this ahead
            elPanel.AddClass('is-correct');
    }
    function InitializeMatchLister(oPageData) {
        // Must have a stable match list before updating any data in our UI
        if (MatchListAPI.GetState(oPageData.tournamentId) !== 'ready')
            return;
        //
        // Find all the sections and fully reset them to default presentation
        // 1 win = Quarterfinal>>Semifinal
        // 2 wins = Semifinal >> Grand Final
        // 3 wins = CHAMPION
        //
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
        //
        // Dictionary of current team states
        //
        let teamStates = {};
        function GetTeamState(teamid) {
            if (!teamStates.hasOwnProperty(teamid)) {
                teamStates[teamid] = {
                    wins: 0,
                    loss: 0,
                    boXw: 0,
                    boXl: 0 // best-of-X (e.g. best-of-3 or best-of-5)
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
        //
        // Pin teams to slots through which they can advance
        //
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
        //
        // Let's roll through the match lister
        //
        for (let idxSection = 0; idxSection <= 2; ++idxSection) {
            let nCount = PredictionsAPI.GetSectionMatchesCount(oPageData.tournamentId, oPageData.sectionId + idxSection);
            $.Msg('InitializeMatchLister has ' + nCount + ' matches in section ' + idxSection);
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
                const numWinsNeeded = MatchInfoAPI.GetMatchTournamentStageIDWinsNeeded(nStageID); // 2 wins required for best-of-3 series
                $.Msg('   ' + team0 + '-vs-' + team1 + ' in ' + matchup + ' UMID:' + umid + ' res=' + res);
                if (_m_elSections[matchup][keyteam] < _m_elSections[matchup].matches.length) {
                    let omatch = _m_elSections[matchup].matches[_m_elSections[matchup][keyteam]];
                    let elTeamPair = omatch.panel;
                    let nCountThisMatchForBO3 = bMatchStillInProgress ? 0 : 1;
                    omatch.keyteamwl += ((winteam == keyteam) ? 1 : -1) * nCountThisMatchForBO3;
                    omatch.keyteam_wins += ((winteam == keyteam) ? 1 : 0) * nCountThisMatchForBO3;
                    omatch.keyteam_loss += ((winteam != keyteam) ? 1 : 0) * nCountThisMatchForBO3;
                    let bSwap01 = ((team0 == keyteam) ? false : true);
                    // BEST-OF-3 scores show "2:0" or "2:1"
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
            $.Msg('InitializeMatchLister finished processing ' + nCount + ' matches in section ' + idxSection);
        }
    }
})(PredictionsBracket || (PredictionsBracket = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZGljdGlvbnNfYnJhY2tldF9zdGFnZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3RvdXJuYW1lbnRzL3ByZWRpY3Rpb25zX2JyYWNrZXRfc3RhZ2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyxxREFBcUQ7QUFFckQsSUFBVSxrQkFBa0IsQ0F1bkIzQjtBQXZuQkQsV0FBVSxrQkFBa0I7SUFFeEIsSUFBSSxjQUFjLEdBQVksS0FBSyxDQUFDO0lBQ3BDLElBQUkseUJBQXlCLEdBQWEsQ0FBRSxzQkFBc0IsQ0FBQyxxQkFBcUIsRUFBRSxzQkFBc0IsQ0FBQyxxQkFBcUIsR0FBRyxDQUFDLEVBQUUsc0JBQXNCLENBQUMscUJBQXFCLEdBQUcsQ0FBQyxDQUFFLENBQUM7SUFDL0wsSUFBSSxjQUF5QixDQUFDO0lBRTlCLDZDQUE2QztJQUM3QyxTQUFnQixJQUFJO1FBRWhCLElBQUksU0FBUyxHQUFHLGFBQWEsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBRWxELHNHQUFzRztRQUN0Ryx3Q0FBd0M7UUFDeEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFFLEVBQzVEO1lBRUksb0JBQW9CLENBQUUsU0FBUyxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsWUFBWSxDQUFFLENBQUM7WUFHaEUsbUNBQW1DO1lBQ25DLHVDQUF1QztZQUN2QyxvQ0FBb0M7U0FDdkM7UUFFRCxzQkFBc0IsRUFBRSxDQUFDO1FBRXpCLHFCQUFxQixDQUFFLFNBQVMsQ0FBRSxDQUFDO0lBQ3ZDLENBQUM7SUFwQmUsdUJBQUksT0FvQm5CLENBQUE7SUFFRCxTQUFTLG9CQUFvQixDQUFDLE9BQWdCLEVBQUUsWUFBbUI7UUFFL0QsY0FBYyxHQUFHLEVBQUUsQ0FBQztRQUNwQixJQUFJLFNBQVMsR0FBRyxjQUFjLENBQUMsd0JBQXdCLENBQUMsWUFBWSxFQUFFLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFFLENBQUM7UUFDckcsSUFBSSxPQUFPLEdBQUcsY0FBYyxDQUFDLHdCQUF3QixDQUFFLFlBQVksRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFFLENBQUM7UUFFcEYsSUFBSSxPQUFPLEdBQUcsT0FBTyxDQUFDLHFCQUFxQixDQUFFLDJCQUEyQixDQUFFLENBQUM7UUFDM0UsSUFBSSxNQUFNLEdBQUcsT0FBTyxDQUFDLHFCQUFxQixDQUFFLGFBQWEsQ0FBRSxDQUFDO1FBQzVELE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxXQUFXLEdBQUcseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDekQsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7UUFDNUIsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDaEMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDM0IsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUM7UUFDbkMsY0FBYyxDQUFDLElBQUksQ0FBRSxNQUFNLENBQUUsQ0FBQztRQUU5QixPQUFPLEdBQUcsY0FBYyxDQUFDLHdCQUF3QixDQUFFLFlBQVksRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFFLENBQUM7UUFDaEYsTUFBTSxHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBRSxhQUFhLENBQUUsQ0FBQztRQUN4RCxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxHQUFHLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3pELE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO1FBQzVCLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ2hDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDO1FBQzNCLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO1FBQ25DLGNBQWMsQ0FBQyxJQUFJLENBQUUsTUFBTSxDQUFFLENBQUM7UUFFOUIsT0FBTyxHQUFHLGNBQWMsQ0FBQyx3QkFBd0IsQ0FBRSxZQUFZLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBRSxDQUFDO1FBQ2hGLE9BQU8sR0FBRyxPQUFPLENBQUMscUJBQXFCLENBQUUsMkJBQTJCLENBQUUsQ0FBQztRQUN2RSxNQUFNLEdBQUcsT0FBTyxDQUFDLHFCQUFxQixDQUFFLGFBQWEsQ0FBRSxDQUFDO1FBQ3hELE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxXQUFXLEdBQUcseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDekQsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7UUFDNUIsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDaEMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUE7UUFDMUIsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUM7UUFDbkMsY0FBYyxDQUFDLElBQUksQ0FBRSxNQUFNLENBQUUsQ0FBQztRQUU5QixPQUFPLEdBQUcsY0FBYyxDQUFDLHdCQUF3QixDQUFFLFlBQVksRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFFLENBQUM7UUFDaEYsTUFBTSxHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBRSxhQUFhLENBQUUsQ0FBQztRQUN4RCxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxHQUFHLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3pELE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO1FBQzVCLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDO1FBQzNCLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ2hDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO1FBQ25DLGNBQWMsQ0FBQyxJQUFJLENBQUUsTUFBTSxDQUFFLENBQUM7UUFFOUIsU0FBUyxHQUFHLGNBQWMsQ0FBQyx3QkFBd0IsQ0FBQyxZQUFZLEVBQUUseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQztRQUNqRyxPQUFPLEdBQUcsY0FBYyxDQUFDLHdCQUF3QixDQUFFLFlBQVksRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFFLENBQUM7UUFDaEYsT0FBTyxHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBRSwyQkFBMkIsQ0FBRSxDQUFDO1FBQ3ZFLE1BQU0sR0FBRyxPQUFPLENBQUMscUJBQXFCLENBQUUsYUFBYSxDQUFFLENBQUM7UUFDeEQsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLFdBQVcsR0FBRyx5QkFBeUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN6RCxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQztRQUM1QixNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUNoQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQztRQUMzQixNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsWUFBWSxHQUFHLEdBQUcsQ0FBQztRQUNqQyxjQUFjLENBQUMsSUFBSSxDQUFFLE1BQU0sQ0FBRSxDQUFDO1FBRTlCLE9BQU8sR0FBRyxjQUFjLENBQUMsd0JBQXdCLENBQUUsWUFBWSxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUUsQ0FBQztRQUNoRixNQUFNLEdBQUcsT0FBTyxDQUFDLHFCQUFxQixDQUFFLGFBQWEsQ0FBRSxDQUFDO1FBQ3hELE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxXQUFXLEdBQUcseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDekQsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7UUFDNUIsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDaEMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDM0IsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLFlBQVksR0FBRyxHQUFHLENBQUM7UUFDakMsY0FBYyxDQUFDLElBQUksQ0FBRSxNQUFNLENBQUUsQ0FBQztRQUU5QixTQUFTLEdBQUcsY0FBYyxDQUFDLHdCQUF3QixDQUFDLFlBQVksRUFBRSx5QkFBeUIsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDO1FBQ2pHLE9BQU8sR0FBRyxjQUFjLENBQUMsd0JBQXdCLENBQUUsWUFBWSxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUUsQ0FBQztRQUNoRixPQUFPLEdBQUcsT0FBTyxDQUFDLHFCQUFxQixDQUFFLG1CQUFtQixDQUFFLENBQUM7UUFDL0QsTUFBTSxHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBRSxhQUFhLENBQUUsQ0FBQztRQUN4RCxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxHQUFHLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3pELE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO1FBQzVCLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ2hDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDO1FBQzNCLGNBQWMsQ0FBQyxJQUFJLENBQUUsTUFBTSxDQUFFLENBQUM7UUFFOUIsY0FBYyxDQUFDLE9BQU8sQ0FBRSxPQUFPLENBQUMsRUFBRTtZQUM5QixvQkFBb0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM5QixtQkFBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNqQyxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRCxTQUFTLG9CQUFvQixDQUFFLE1BQWM7UUFFekMsQ0FBQyxDQUFDLG9CQUFvQixDQUFFLFdBQVcsRUFBRSxNQUFNLEVBQUUsQ0FBRSxPQUFPLEVBQUUsSUFBSSxFQUFHLEVBQUU7WUFFN0QsV0FBVyxDQUFFLE1BQU0sRUFBRSxJQUFJLENBQUcsQ0FBQztZQUM3Qiw4RUFBOEU7WUFDOUUsb0JBQW9CLENBQUUsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLFlBQVksQ0FBQyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUUsYUFBYSxFQUFFLElBQUksQ0FBRSxDQUFFLENBQUM7WUFDL0csTUFBTSxDQUFDLFFBQVEsQ0FBRSxjQUFjLENBQUUsQ0FBQztRQUN0QyxDQUFDLENBQUUsQ0FBQztRQUVKLENBQUMsQ0FBQyxvQkFBb0IsQ0FBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLENBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRyxFQUFFO1lBRW5FLFNBQVMsQ0FBRSxXQUEwQixDQUFFLENBQUM7WUFDeEMsK0VBQStFO1lBQy9FLG9CQUFvQixDQUFFLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFFLGFBQWEsRUFBRSxLQUFLLENBQUUsQ0FBRSxDQUFDO1lBQ2hILE1BQU0sQ0FBQyxXQUFXLENBQUUsY0FBYyxDQUFFLENBQUM7UUFDekMsQ0FBQyxDQUFFLENBQUM7SUFDUixDQUFDO0lBRUQsU0FBUyxtQkFBbUIsQ0FBRyxRQUFpQjtRQUU1QyxDQUFDLENBQUMsb0JBQW9CLENBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUU7WUFFaEQsUUFBUSxDQUFDLFFBQVEsQ0FBRSwwQkFBMEIsQ0FBRSxDQUFDO1FBQ3BELENBQUMsQ0FBRSxDQUFDO1FBRUosQ0FBQyxDQUFDLG9CQUFvQixDQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFO1lBRWhELFFBQVEsQ0FBQyxXQUFXLENBQUUsMEJBQTBCLENBQUUsQ0FBQztRQUN2RCxDQUFDLENBQUUsQ0FBQztRQUVKLENBQUMsQ0FBQyxvQkFBb0IsQ0FBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLENBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRyxFQUFFO1lBRXRFLFdBQVcsQ0FBRSxRQUFRLEVBQUUsV0FBMEIsQ0FBRSxDQUFDO1FBQ3hELENBQUMsQ0FBRSxDQUFDO0lBQ1gsQ0FBQztJQUVFLFNBQVMsV0FBVyxDQUFHLFlBQXFCLEVBQUUsSUFBbUI7UUFFbkUseURBQXlEO1FBQ3pELGtHQUFrRztRQUNsRyxJQUFJLFdBQVcsR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFFLFdBQVcsRUFBRSxDQUFDLENBQUMsZUFBZSxFQUFFLEVBQUUsRUFBRSxFQUFFO1lBQ3RFLEtBQUssRUFBRSx1QkFBdUI7WUFDOUIsYUFBYSxFQUFFLElBQUk7WUFDbkIsWUFBWSxFQUFFLElBQUk7U0FDbEIsQ0FBYSxDQUFDO1FBRVQsV0FBVyxDQUFDLFFBQVEsQ0FBRSxhQUFhLENBQUMsV0FBVyxDQUFFLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUUsQ0FBRSxDQUFDO1FBQ2hGLFdBQVcsQ0FBQyxRQUFRLENBQUUsWUFBWSxDQUFFLENBQUM7UUFDckMsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sR0FBRyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDO1FBQ3ZELFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLEdBQUcsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQztRQUN2RCxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxZQUFZLENBQUM7UUFFbkUscUdBQXFHO1FBRXJHLGFBQWEsQ0FBQyxhQUFhLEdBQUcsV0FBVyxDQUFDO1FBRWhELElBQUksQ0FBQyxZQUFZLEdBQUcsV0FBVyxDQUFDO1FBQ2hDLElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ2xCLElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ2xCLElBQUksQ0FBQyx3QkFBd0IsR0FBRyxLQUFLLENBQUM7UUFFdEMsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxxQkFBcUIsRUFBRSxrQ0FBa0MsRUFBRSxPQUFPLENBQUUsQ0FBQztJQUN2RixDQUFDO0lBRUUsU0FBUyxTQUFTLENBQUcsV0FBd0I7UUFFekMsbUNBQW1DO1FBQ25DLHlHQUF5RztRQUN6RyxvQ0FBb0M7UUFFcEMsSUFBSSxDQUFDLGNBQWMsRUFDbkI7WUFDSSx5Q0FBeUM7WUFDekMsSUFBSSxhQUFhLEdBQUcsb0JBQW9CLENBQUUsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLFlBQVksR0FBRyxHQUFHLEdBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBRSxDQUFDO1lBRTVHLGFBQWEsQ0FBQyxPQUFPLENBQUUsTUFBTSxDQUFDLEVBQUU7Z0JBQzVCLElBQUksUUFBUSxDQUFFLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUUsSUFBSyxRQUFRLENBQUUsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBRSxFQUM5RTtvQkFDSSxpQkFBaUIsQ0FBRSxNQUFNLEVBQUUsSUFBSSxDQUFFLENBQUM7b0JBQ2xDLENBQUMsQ0FBQyxhQUFhLENBQUUscUJBQXFCLEVBQUUsdUNBQXVDLEVBQUUsT0FBTyxDQUFFLENBQUM7aUJBQzlGO1lBQ0wsQ0FBQyxDQUFDLENBQUE7U0FDTDtRQUVELFdBQVcsQ0FBQyxRQUFRLENBQUUsVUFBVSxDQUFFLENBQUM7UUFDbkMsYUFBYSxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQy9CLGNBQWMsR0FBRyxLQUFLLENBQUM7SUFDOUIsQ0FBQztJQUVFLFNBQVMsV0FBVyxDQUFHLFFBQWlCLEVBQUUsV0FBd0I7UUFFOUQsY0FBYyxHQUFHLElBQUksQ0FBQztRQUV0QixJQUFJLGFBQWEsR0FBRyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDO1FBRTNDLElBQUksYUFBYSxHQUFHLG9CQUFvQixDQUFFLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxZQUFZLENBQUUsQ0FBQztRQUM1RSxhQUFhLENBQUMsT0FBTyxDQUFFLE1BQU0sQ0FBQyxFQUFFO1lBQzVCLElBQUksUUFBUSxDQUFFLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUUsSUFBSyxRQUFRLENBQUUsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBRSxFQUMzRTtnQkFDSSxpQkFBaUIsQ0FBRSxNQUFNLEVBQUUsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBRSxDQUFDO2dCQUN2RCxDQUFDLENBQUMsYUFBYSxDQUFFLHFCQUFxQixFQUFFLG1DQUFtQyxFQUFFLE9BQU8sQ0FBRSxDQUFDO2FBQzFGO2lCQUNHO2dCQUNBLElBQUssTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sS0FBSyxhQUFhO29CQUN2QyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxLQUFLLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLEVBQ25EO29CQUNJLGFBQWEsR0FBRyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDO29CQUNyQyxpQkFBaUIsQ0FBRSxNQUFNLEVBQUUsSUFBSSxDQUFFLENBQUM7aUJBQ3JDO2FBQ0o7UUFDTCxDQUFDLENBQUMsQ0FBQTtJQUNOLENBQUM7SUFFRCxTQUFTLGlCQUFpQixDQUFHLFFBQWdCLEVBQUUsTUFBb0I7UUFFL0QsMkJBQTJCO1FBQzNCLElBQUksUUFBUSxJQUFJLFFBQVEsQ0FBQyxPQUFPLEVBQUUsRUFDbEM7WUFDSSxJQUFJLFNBQVMsR0FBRyxhQUFhLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUNsRCxJQUFJLGVBQWUsR0FBRyxjQUFjLENBQUMsa0JBQWtCLENBQUUsU0FBUyxDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsU0FBUyxDQUFFLENBQUM7WUFDdkcsSUFBSSxPQUFPLEdBQUcsY0FBYyxDQUFDLGVBQWUsQ0FBRSxTQUFTLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxPQUFPLENBQUUsQ0FBQztZQUUxRixRQUFRLENBQUMsWUFBWSxDQUFDLENBQUUsZUFBZSxJQUFJLE9BQU8sQ0FBRSxDQUFDLENBQUM7WUFFdEQsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7WUFDaEMsdUVBQXVFO1lBQ3ZFLHlEQUF5RDtZQUV6RCxJQUFJLE1BQU0sS0FBSyxJQUFJLElBQUksQ0FBQyxlQUFlLElBQUksQ0FBQyxPQUFPLEVBQ25EO2dCQUNJLFFBQVEsQ0FBQyxXQUFXLENBQUUsWUFBWSxFQUFFLGFBQWEsQ0FBRSxDQUFDO2FBQ3ZEO2lCQUVEO2dCQUNJLFFBQVEsQ0FBQyxXQUFXLENBQUUsWUFBWSxFQUFFLEVBQUUsQ0FBRSxDQUFDO2FBQzVDO1lBRUQsVUFBVSxDQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsTUFBTyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUUsQ0FBQztTQUNwRTtJQUNMLENBQUM7SUFFRCxTQUFTLG9CQUFvQixDQUFFLFlBQW1CO1FBRTlDLElBQUksV0FBdUIsQ0FBQztRQUM1QixXQUFXLEdBQUcsRUFBRSxDQUFDO1FBRWpCLElBQUksWUFBWSxFQUNoQjtZQUNJLFlBQVksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUMsRUFBRTtnQkFDbkUsSUFBSSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxLQUFLLEVBQUUsRUFDOUI7b0JBQ0ksV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztpQkFDM0I7WUFDTCxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ1A7UUFFRCxPQUFPLFdBQVcsQ0FBQztJQUN2QixDQUFDO0lBRUosU0FBUyxzQkFBc0I7UUFFeEIsSUFBSSxTQUFTLEdBQUcsYUFBYSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFFbEQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLHlCQUF5QixDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFDekQ7WUFDSSxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQ1Y7Z0JBQ0ksZ0JBQWdCLENBQUUsU0FBUyxDQUFFLENBQUM7YUFDakM7WUFFRCx5QkFBeUIsQ0FBRSxTQUFTLEVBQUUseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQztTQUN4RTtJQUNSLENBQUM7SUFBQSxDQUFDO0lBRUMsU0FBZ0IsaUNBQWlDO1FBRTdDLHNCQUFzQixFQUFFLENBQUM7SUFDN0IsQ0FBQztJQUhlLG9EQUFpQyxvQ0FHaEQsQ0FBQTtJQUVELFNBQVMsZ0JBQWdCLENBQUcsU0FBa0M7UUFFMUQsSUFBSSxTQUFTLEdBQUcsY0FBYyxDQUFDLHdCQUF3QixDQUFDLFNBQVMsQ0FBQyxZQUFZLEVBQUUseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQztRQUMvRyxJQUFJLFdBQVcsR0FBRyxjQUFjLENBQUMscUJBQXFCLENBQUUsU0FBUyxDQUFDLFlBQVksRUFBRSxTQUFTLENBQUUsQ0FBQztRQUM1RixJQUFJLGVBQWUsR0FBRyxjQUFjLENBQUMsa0JBQWtCLENBQUUsU0FBUyxDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsQ0FBQztRQUU1RixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsV0FBVyxFQUFFLEVBQUUsQ0FBQyxFQUNwQztZQUNJLElBQUksT0FBTyxHQUFHLGNBQWMsQ0FBQyx3QkFBd0IsQ0FBRSxTQUFTLENBQUMsWUFBWSxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUUsQ0FBQztZQUM5RixJQUFJLE9BQU8sR0FBRyxjQUFjLENBQUMsZUFBZSxDQUFFLFNBQVMsQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFFLENBQUM7WUFDaEYsSUFBSSxPQUFPLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsQ0FBRSxrQkFBa0IsR0FBRSxDQUFDLEdBQUcsU0FBUyxHQUFHLENBQUMsQ0FBRSxDQUFDO1lBQzdGLElBQUksYUFBYSxHQUFHLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxrQkFBa0IsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUV2RSxJQUFJLFVBQVUsR0FBRyxjQUFjLENBQUMsa0JBQWtCLENBQUUsU0FBUyxDQUFDLFlBQVksRUFBRSxPQUFPLENBQUUsQ0FBQztZQUV0RixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxFQUFFLENBQUMsRUFBRSxFQUNuQztnQkFDSSxJQUFJLE1BQU0sR0FBRyxjQUFjLENBQUMscUJBQXFCLENBQUUsU0FBUyxDQUFDLFlBQVksRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFFLENBQUM7Z0JBQ3hGLElBQUksTUFBTSxHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBRSxZQUFZLEdBQUcsQ0FBQyxDQUFFLENBQUM7Z0JBQy9ELE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxZQUFZLEdBQUcsYUFBYSxDQUFDO2dCQUMzQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztnQkFDOUIsV0FBVyxDQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUcsSUFBSSxDQUFDLENBQUM7Z0JBRWxDLE1BQU0sQ0FBQyxTQUFTLENBQUUsY0FBYyxDQUFjLENBQUMsUUFBUSxDQUFFLENBQUMsTUFBTSxJQUFLLE1BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQztvQkFDbEYsRUFBRSxDQUFDLENBQUM7b0JBQ0osYUFBYSxDQUFDLFdBQVcsQ0FBRSxNQUFNLENBQUUsQ0FDdEMsQ0FBQztnQkFFRixJQUFJLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUUsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUUsRUFDNUQ7b0JBQ0ksb0JBQW9CLENBQUUsTUFBTSxDQUFFLENBQUM7aUJBQ2xDO2dCQUVELE1BQU0sQ0FBQyxXQUFXLENBQUUsWUFBWSxFQUFFLFlBQVksQ0FBRSxDQUFDO2dCQUVqRCxNQUFNLENBQUMsWUFBWSxDQUFFLENBQUMsZUFBZSxJQUFJLE9BQU8sQ0FBRSxDQUFDLENBQUM7Z0JBQ3BELE1BQU0sQ0FBQyxPQUFPLEdBQUcsQ0FBQyxlQUFlLElBQUksT0FBTyxDQUFFLENBQUM7Z0JBQy9DLE1BQU0sQ0FBQyxlQUFlLEdBQUcsQ0FBQyxlQUFlLElBQUksT0FBTyxDQUFFLENBQUM7YUFDMUQ7U0FDSjtJQUNMLENBQUM7SUFFRCxTQUFTLHlCQUF5QixDQUFFLFNBQWtDLEVBQUUsWUFBb0I7UUFFeEYsK0NBQStDO1FBQy9DLElBQUksZUFBZSxHQUFJLGNBQWMsQ0FBQyxNQUFNLENBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxLQUFLLFlBQVksQ0FBRSxDQUFDO1FBRXZHLGVBQWUsQ0FBQyxPQUFPLENBQUUsT0FBTyxDQUFDLEVBQUU7WUFDL0IsVUFBVSxDQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBRSxDQUFBO1FBQzdDLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVELFNBQVMsVUFBVSxDQUFDLFNBQWtDLEVBQUUsTUFBYyxFQUFFLFNBQWdCLENBQUMsRUFBRSxpQkFBeUIsS0FBSztRQUVySCxJQUFJLEtBQUssR0FBRyxjQUFjLENBQUMsd0JBQXdCLENBQUUsU0FBUyxDQUFDLFlBQVksRUFBRSxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxDQUFFLENBQUM7UUFDekcsSUFBSSxPQUFPLEdBQUcsY0FBYyxDQUFDLHdCQUF3QixDQUFFLFNBQVMsQ0FBQyxZQUFZLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxTQUFTLENBQUUsQ0FBQztRQUNoSCxJQUFJLGVBQWUsR0FBRyxjQUFjLENBQUMsa0JBQWtCLENBQUUsU0FBUyxDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsU0FBUyxDQUFFLENBQUM7UUFDdkcsSUFBSSxPQUFPLEdBQUcsY0FBYyxDQUFDLGVBQWUsQ0FBRSxTQUFTLENBQUMsWUFBWSxFQUFFLE9BQU8sQ0FBRSxDQUFDO1FBRWhGLE1BQU0sR0FBRyxDQUFFLE1BQU0sS0FBTSxDQUFDLElBQUssY0FBYyxDQUFFLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxxQkFBcUIsQ0FBRSxTQUFTLENBQUMsWUFBWSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO1FBQ3BJLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBRTlCLFdBQVcsQ0FBRSxNQUFNLEVBQUUsTUFBTSxDQUFFLENBQUM7UUFFNUIsTUFBTSxDQUFDLFNBQVMsQ0FBRSxjQUFjLENBQWMsQ0FBQyxRQUFRLENBQUUsQ0FBQyxNQUFNLElBQUssTUFBTyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLEVBQUUsQ0FBQyxDQUFDO1lBQ0osYUFBYSxDQUFDLFdBQVcsQ0FBRSxNQUFNLENBQUUsQ0FDdEMsQ0FBQztRQUVGLElBQUksYUFBYSxHQUFHLGNBQWMsQ0FBQywyQkFBMkIsQ0FBRSxTQUFTLENBQUMsWUFBWSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUUsQ0FBQztRQUVyRyxJQUFJLGFBQWEsQ0FBQyxvQkFBb0IsQ0FBRSxhQUFhLEVBQUUsTUFBTSxDQUFFLElBQUksTUFBTSxFQUN6RTtZQUNJLE1BQU0sQ0FBQyxXQUFXLENBQUUsWUFBWSxFQUFFLFlBQVksQ0FBRSxDQUFDO1NBQ3BEO2FBQ0ksSUFBSSxNQUFNLElBQUksQ0FBQyxlQUFlLEVBQUcsaURBQWlEO1NBQ3ZGO1lBQ0ksTUFBTSxDQUFDLFdBQVcsQ0FBRSxZQUFZLEVBQUUsY0FBYyxDQUFFLENBQUM7U0FDdEQ7YUFFRDtZQUNJLE1BQU0sQ0FBQyxXQUFXLENBQUUsWUFBWSxFQUFFLEVBQUUsQ0FBRSxDQUFDO1NBQzFDO1FBRUQsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFFLGVBQWUsSUFBSSxPQUFPLENBQUUsQ0FBQyxDQUFDO1FBQ3BELE1BQU0sQ0FBQyxPQUFPLEdBQUcsQ0FBQyxlQUFlLElBQUksT0FBTyxDQUFFLENBQUM7UUFDL0MsTUFBTSxDQUFDLGVBQWUsR0FBRyxDQUFDLGVBQWUsSUFBSSxPQUFPLENBQUUsQ0FBQztRQUV2RCxlQUFlLENBQUMsU0FBUyxDQUFFLGlCQUFpQixFQUFFLENBQUMsQ0FBQztJQUNwRCxDQUFDO0lBRUQsU0FBUyxXQUFXLENBQUMsTUFBYyxFQUFFLE1BQWEsRUFBRyxlQUF3QixLQUFLO1FBRTlFLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBRSxXQUFXLEVBQUUsTUFBTyxLQUFLLENBQUMsSUFBSSxNQUFNLENBQUMsU0FBUyxDQUFFLG1CQUFtQixDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUM3RyxDQUFDLENBQUMsUUFBUSxDQUFFLDJCQUEyQixDQUFDLENBQUMsQ0FBQztZQUMxQyxNQUFPLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQ2YsQ0FBQyxDQUFDLFFBQVEsQ0FBRSx1QkFBdUIsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RDLGNBQWMsQ0FBQyxXQUFXLENBQUUsTUFBTSxDQUFFLENBQUMsQ0FBQztJQUM5QyxDQUFDO0lBRUQsU0FBUyxpQkFBaUI7UUFFdEIsSUFBSSxNQUFNLEdBQStCLEVBQUUsQ0FBQztRQUU1QyxjQUFjLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxFQUFFO1lBRXZCLElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxLQUFLLENBQUMsRUFDbEQ7Z0JBQ0ksTUFBTSxDQUFDLElBQUksQ0FBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2FBQzNGO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFUCxPQUFPLE1BQU0sQ0FBQztJQUNsQixDQUFDO0lBQUEsQ0FBQztJQUVGLEVBQUU7SUFDRixpREFBaUQ7SUFDakQsRUFBRTtJQUVGLElBQUksYUFBYSxHQUFRLEVBQUUsQ0FBQztJQUU1QixTQUFTLG9DQUFvQyxDQUFFLEtBQWE7UUFFeEQsdUZBQXVGO1FBQ3ZGLCtCQUErQjtRQUMvQiwyRUFBMkU7UUFDM0UsT0FBTyxrQkFBa0IsR0FBRyxDQUFDLENBQUMsR0FBQyxLQUFLLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBRUQsU0FBUyxxQkFBcUIsQ0FBRSxPQUFnQixFQUFFLEdBQVcsRUFBRSxPQUFlLEVBQUUsUUFBZ0IsRUFBRSxLQUFhLEVBQUUsb0JBQTZCLEVBQUUsYUFBcUIsRUFBRTtRQUVuSyxDQUFDLENBQUMsR0FBRyxDQUFFLGdDQUFnQyxPQUFPLENBQUMsRUFBRSxVQUFVLEdBQUcsT0FBTyxRQUFRLFlBQVksS0FBSyxJQUFJLG9CQUFvQixDQUFBLENBQUMsQ0FBQSxTQUFTLENBQUEsQ0FBQyxDQUFBLEVBQUUsRUFBRSxDQUFFLENBQUM7UUFDeEksSUFBSyxDQUFDLE9BQU87WUFBRyxPQUFPO1FBQ3ZCLE9BQU8sR0FBRyxPQUFPLENBQUMscUJBQXFCLENBQUUsY0FBYyxHQUFHLEdBQUcsQ0FBRSxDQUFDO1FBQ2hFLElBQUssQ0FBQyxPQUFPO1lBQUcsT0FBTztRQUV2QixPQUFPLENBQUMsaUJBQWlCLENBQUUsV0FBVyxFQUFFLFFBQVEsQ0FBRSxDQUFDO1FBQ25ELE9BQU8sQ0FBQyxpQkFBaUIsQ0FBRSxZQUFZLEVBQUUsQ0FBRSxLQUFLLEdBQUcsQ0FBQyxDQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBRSxFQUFFLEdBQUcsS0FBSyxDQUFFLENBQUUsQ0FBQztRQUUvRSxJQUFLLFVBQVU7WUFDWCxPQUFPLENBQUMsUUFBUSxDQUFFLFVBQVUsQ0FBRSxDQUFDO1FBRWpDLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBRSxjQUFjLENBQWUsQ0FBQyxRQUFRLENBQUUsb0NBQW9DLEdBQUcsT0FBTyxHQUFHLE1BQU0sQ0FBRSxDQUFDO1FBRW5JLElBQUssb0JBQW9CLEVBQUcsOEVBQThFO1lBQ3RHLE9BQU8sQ0FBQyxRQUFRLENBQUUsWUFBWSxDQUFFLENBQUM7SUFDekMsQ0FBQztJQUVELFNBQVMscUJBQXFCLENBQUUsU0FBa0M7UUFFOUQsbUVBQW1FO1FBQ25FLElBQUssWUFBWSxDQUFDLFFBQVEsQ0FBRSxTQUFTLENBQUMsWUFBWSxDQUFFLEtBQUssT0FBTztZQUFHLE9BQU87UUFFMUUsRUFBRTtRQUNGLHFFQUFxRTtRQUNyRSxrQ0FBa0M7UUFDbEMsb0NBQW9DO1FBQ3BDLG9CQUFvQjtRQUNwQixFQUFFO1FBQ0YsS0FBTSxJQUFJLEtBQUssR0FBVSxDQUFDLEVBQUUsS0FBSyxJQUFJLENBQUMsRUFBRSxFQUFHLEtBQUssRUFDaEQ7WUFDSSxJQUFJLFdBQVcsR0FBRyxvQ0FBb0MsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM5RCxJQUFJLFVBQVUsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLHFCQUFxQixDQUFFLFdBQVcsQ0FBRSxDQUFDO1lBQ3RFLElBQUssQ0FBQyxVQUFVO2dCQUFHLFNBQVM7WUFFNUIsSUFBSSxZQUFZLEdBQVEsRUFBRSxDQUFDO1lBQzNCLEtBQU0sSUFBSSxNQUFNLEdBQVUsQ0FBQyxHQUFJLEVBQUcsTUFBTSxFQUN4QztnQkFDSSxJQUFJLFVBQVUsR0FBRyxVQUFVLENBQUMscUJBQXFCLENBQUUsV0FBVyxHQUFHLFNBQVMsR0FBRyxNQUFNLENBQUUsQ0FBQztnQkFDdEYsSUFBSyxDQUFDLFVBQVU7b0JBQUcsTUFBTTtnQkFDekIsWUFBWSxDQUFDLElBQUksQ0FBRSxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxZQUFZLEVBQUUsQ0FBQyxFQUFFLFlBQVksRUFBRSxDQUFDLEVBQUUsQ0FBRSxDQUFDO2dCQUMzRixVQUFVLENBQUMsV0FBVyxDQUFFLG1CQUFtQixFQUFFLEtBQUssQ0FBRSxDQUFDO2dCQUNyRCxVQUFVLENBQUMsV0FBVyxDQUFFLHVCQUF1QixFQUFFLEtBQUssQ0FBRSxDQUFDO2dCQUN6RCxVQUFVLENBQUMsV0FBVyxDQUFFLFdBQVcsRUFBRSxLQUFLLENBQUUsQ0FBQztnQkFDN0MsVUFBVSxDQUFDLFdBQVcsQ0FBRSxVQUFVLEVBQUUsS0FBSyxDQUFFLENBQUM7Z0JBQzVDLENBQUUsVUFBVSxDQUFDLHFCQUFxQixDQUFFLGVBQWUsQ0FBRTtvQkFDbkQsVUFBVSxDQUFDLHFCQUFxQixDQUFFLGVBQWUsQ0FBRSxDQUFFLENBQUMsT0FBTyxDQUFFLE1BQU0sQ0FBQyxFQUFFO29CQUFHLElBQUssTUFBTSxFQUFHO3dCQUN2RixNQUFNLENBQUMsaUJBQWlCLENBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUUsdUJBQXVCLENBQUUsQ0FBRSxDQUFDO3dCQUMvRSxNQUFNLENBQUMsaUJBQWlCLENBQUUsWUFBWSxFQUFFLEVBQUUsQ0FBRSxDQUFDO3dCQUMzQyxNQUFNLENBQUMscUJBQXFCLENBQUUsY0FBYyxDQUFlLENBQUMsUUFBUSxDQUNsRSxTQUFTLENBQUMsWUFBWSxJQUFJLGVBQWUsQ0FBQyxDQUFDLENBQUMsbURBQW1ELENBQUMsQ0FBQyxDQUFDLDhDQUE4QyxDQUFDLENBQUM7d0JBQ3RKLE1BQU0sQ0FBQyxXQUFXLENBQUUsWUFBWSxDQUFFLENBQUM7cUJBQ3RDO2dCQUFDLENBQUMsQ0FBRSxDQUFDO2dCQUNOLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO2dCQUU3QixJQUFLLEtBQUssR0FBRyxDQUFDO29CQUFHLFVBQVUsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLEdBQUUsRUFBRTt3QkFFekQsSUFBSSxNQUFNLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQzt3QkFDNUYsSUFBSyxDQUFDLE1BQU07NEJBQUcsT0FBTzt3QkFFdEIsSUFBSSxnQkFBZ0IsR0FBRyxZQUFZLENBQUMscUNBQXFDLENBQ3JFLEVBQUUsRUFDRixFQUFFLEVBQ0YsdUVBQXVFLEVBQ3ZFLFFBQVEsR0FBRyxNQUFNOzRCQUNqQixHQUFHLEdBQUcsZUFBZSxHQUFHLGFBQWEsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLE9BQU8sQ0FDcEUsQ0FBQzt3QkFDRixnQkFBZ0IsQ0FBQyxRQUFRLENBQUUscUJBQXFCLENBQUUsQ0FBQztvQkFDdkQsQ0FBQyxDQUFDLENBQUM7YUFDTjtZQUNELGFBQWEsQ0FBRSxXQUFXLENBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUUsQ0FBQztTQUM1RDtRQUVELEVBQUU7UUFDRixvQ0FBb0M7UUFDcEMsRUFBRTtRQUNGLElBQUksVUFBVSxHQUFRLEVBQUUsQ0FBQztRQUN6QixTQUFTLFlBQVksQ0FBRSxNQUFhO1lBRWhDLElBQUssQ0FBQyxVQUFVLENBQUMsY0FBYyxDQUFFLE1BQU0sQ0FBRSxFQUFHO2dCQUN4QyxVQUFVLENBQUUsTUFBTSxDQUFFLEdBQUc7b0JBQ25CLElBQUksRUFBRSxDQUFDO29CQUNQLElBQUksRUFBRSxDQUFDO29CQUNQLElBQUksRUFBRSxDQUFDO29CQUNQLElBQUksRUFBRSxDQUFDLENBQUUsMENBQTBDO2lCQUN0RCxDQUFDO2FBQ0w7WUFDRCxPQUFPLFVBQVUsQ0FBRSxNQUFNLENBQUUsQ0FBQztRQUNoQyxDQUFDO1FBQ0QsU0FBUyxNQUFNLENBQUUsS0FBUyxFQUFFLFVBQWlCO1lBRXpDLEVBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztZQUNkLElBQUssS0FBSyxDQUFDLElBQUksSUFBSSxVQUFVLEVBQUc7Z0JBQzVCLEtBQUssQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUM7Z0JBQzVCLEVBQUcsS0FBSyxDQUFDLElBQUksQ0FBQzthQUNqQjtRQUNMLENBQUM7UUFDRCxTQUFTLE9BQU8sQ0FBRSxLQUFTLEVBQUUsVUFBaUI7WUFFMUMsRUFBRyxLQUFLLENBQUMsSUFBSSxDQUFDO1lBQ2QsSUFBSyxLQUFLLENBQUMsSUFBSSxJQUFJLFVBQVUsRUFBRztnQkFDNUIsS0FBSyxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQztnQkFDNUIsRUFBRyxLQUFLLENBQUMsSUFBSSxDQUFDO2FBQ2pCO1FBQ0wsQ0FBQztRQUVELEVBQUU7UUFDRixvREFBb0Q7UUFDcEQsRUFBRTtRQUNGLEtBQU0sSUFBSSxRQUFRLEdBQVcsQ0FBQyxFQUFFLFFBQVEsR0FBRyxDQUFDLEVBQUUsRUFBRyxRQUFRLEVBQ3pEO1lBQ0ksSUFBSSxNQUFNLEdBQUcsY0FBYyxDQUFDLGtCQUFrQixDQUFFLFNBQVMsQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUUsQ0FBQztZQUN2RyxLQUFNLElBQUksQ0FBQyxHQUFXLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLEVBQUcsQ0FBQyxFQUN6QztnQkFDSSxJQUFJLE1BQU0sR0FBRyxjQUFjLENBQUMscUJBQXFCLENBQUUsU0FBUyxDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsT0FBTyxHQUFHLFFBQVEsRUFBRSxDQUFDLENBQUUsQ0FBQztnQkFDN0csSUFBSyxNQUFNLEtBQUssQ0FBQyxJQUFJLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyw4QkFBOEIsQ0FBRSxTQUFTLENBQUMsWUFBWSxFQUFFLE1BQU0sQ0FBRTtvQkFDM0csTUFBTSxHQUFHLENBQUMsQ0FBQztnQkFDZixJQUFLLENBQUMsTUFBTTtvQkFBRyxTQUFTO2dCQUV4QixJQUFJLE9BQU8sR0FBRyxjQUFjLENBQUMsVUFBVSxDQUFFLE1BQU0sQ0FBRSxDQUFDO2dCQUNsRCxJQUFJLFVBQVUsR0FBRyxRQUFRLENBQUM7Z0JBQzFCLElBQUksY0FBYyxHQUFHLENBQUMsQ0FBQztnQkFFdkIscUJBQXFCLENBQUUsYUFBYSxDQUFFLG9DQUFvQyxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUMsT0FBTyxDQUFFLFFBQVEsQ0FBRSxDQUFDLEtBQUssRUFDdkcsY0FBYyxFQUFFLE9BQU8sRUFBRSxjQUFjLENBQUMsV0FBVyxDQUFFLE1BQU0sQ0FBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBRSxDQUFDO2dCQUUvRSxLQUFNLElBQUksS0FBSyxHQUFXLENBQUMsRUFBRSxLQUFLLElBQUksQ0FBQyxFQUFFLEVBQUcsS0FBSyxFQUNqRDtvQkFDSSxJQUFJLE9BQU8sR0FBRyxvQ0FBb0MsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDMUQsYUFBYSxDQUFFLE9BQU8sQ0FBRSxDQUFFLE9BQU8sQ0FBRSxHQUFHLFVBQVUsQ0FBQztvQkFDakQsYUFBYSxDQUFFLE9BQU8sQ0FBRSxDQUFFLE9BQU8sR0FBQyxPQUFPLENBQUUsR0FBRyxjQUFjLENBQUM7b0JBQzdELGNBQWMsR0FBRyxVQUFVLEdBQUMsQ0FBQyxDQUFDO29CQUM5QixVQUFVLEdBQUcsQ0FBRSxVQUFVLEdBQUcsQ0FBQyxVQUFVLEdBQUMsQ0FBQyxDQUFDLENBQUUsR0FBQyxDQUFDLENBQUM7aUJBQ2xEO2FBQ0o7U0FDSjtRQUVELEVBQUU7UUFDRixzQ0FBc0M7UUFDdEMsRUFBRTtRQUNGLEtBQU0sSUFBSSxVQUFVLEdBQVcsQ0FBQyxFQUFFLFVBQVUsSUFBSSxDQUFDLEVBQUUsRUFBRyxVQUFVLEVBQ2hFO1lBQ0ksSUFBSSxNQUFNLEdBQUcsY0FBYyxDQUFDLHNCQUFzQixDQUFFLFNBQVMsQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLFNBQVMsR0FBRyxVQUFVLENBQUUsQ0FBQztZQUMvRyxDQUFDLENBQUMsR0FBRyxDQUFFLDRCQUE0QixHQUFHLE1BQU0sR0FBRyxzQkFBc0IsR0FBRyxVQUFVLENBQUUsQ0FBQztZQUNyRixLQUFNLElBQUksUUFBUSxHQUFVLE1BQU0sRUFBRSxRQUFRLEVBQUcsR0FBRSxDQUFDLEdBQ2xEO2dCQUNJLElBQUksSUFBSSxHQUFHLGNBQWMsQ0FBQyxzQkFBc0IsQ0FBRSxTQUFTLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxTQUFTLEdBQUcsVUFBVSxFQUFFLFFBQVEsQ0FBRSxDQUFDO2dCQUN2SCxJQUFJLEtBQUssR0FBRyxZQUFZLENBQUMseUJBQXlCLENBQUUsSUFBSSxFQUFFLENBQUMsQ0FBRSxDQUFDO2dCQUM5RCxJQUFJLEtBQUssR0FBRyxZQUFZLENBQUMseUJBQXlCLENBQUUsSUFBSSxFQUFFLENBQUMsQ0FBRSxDQUFDO2dCQUM5RCxJQUFJLFNBQVMsR0FBRyxZQUFZLENBQUMsMEJBQTBCLENBQUUsSUFBSSxFQUFFLENBQUMsQ0FBRSxDQUFDO2dCQUNuRSxJQUFJLFNBQVMsR0FBRyxZQUFZLENBQUMsMEJBQTBCLENBQUUsSUFBSSxFQUFFLENBQUMsQ0FBRSxDQUFDO2dCQUNuRSxJQUFJLEdBQUcsR0FBRyxZQUFZLENBQUMsZUFBZSxDQUFFLElBQUksQ0FBRSxDQUFDO2dCQUMvQyxJQUFJLHFCQUFxQixHQUFHLENBQUUsQ0FBQyxHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBRSxDQUFDO2dCQUVqRCxJQUFJLE9BQU8sR0FBRyxvQ0FBb0MsQ0FBRSxZQUFZLENBQUUsS0FBSyxDQUFFLENBQUMsSUFBSSxDQUFFLENBQUM7Z0JBQ2pGLElBQUssQ0FBQyxhQUFhLENBQUUsT0FBTyxDQUFFLENBQUMsY0FBYyxDQUFFLEtBQUssQ0FBRSxJQUFJLENBQUMsYUFBYSxDQUFFLE9BQU8sQ0FBRSxDQUFDLGNBQWMsQ0FBRSxLQUFLLENBQUU7b0JBQUcsU0FBUztnQkFFdkgsSUFBSSxPQUFPLEdBQUcsQ0FBRSxDQUFFLEdBQUcsSUFBSSxDQUFDLENBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUUsQ0FBQztnQkFDL0MsSUFBSSxPQUFPLEdBQUcsQ0FBRSxhQUFhLENBQUUsT0FBTyxDQUFFLENBQUUsT0FBTyxHQUFDLEtBQUssQ0FBRSxLQUFLLENBQUMsQ0FBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztnQkFDbEYsSUFBSSxLQUFLLEdBQUcsWUFBWSxDQUFFLE9BQU8sQ0FBRSxDQUFDO2dCQUVwQyxNQUFNLFFBQVEsR0FBRyxZQUFZLENBQUMseUJBQXlCLENBQUUsSUFBSSxDQUFFLENBQUM7Z0JBQ2hFLE1BQU0sYUFBYSxHQUFHLFlBQVksQ0FBQyxtQ0FBbUMsQ0FBRSxRQUFRLENBQUUsQ0FBQyxDQUFDLHVDQUF1QztnQkFFM0gsQ0FBQyxDQUFDLEdBQUcsQ0FBRSxLQUFLLEdBQUcsS0FBSyxHQUFHLE1BQU0sR0FBRyxLQUFLLEdBQUcsTUFBTSxHQUFHLE9BQU8sR0FBRyxRQUFRLEdBQUcsSUFBSSxHQUFHLE9BQU8sR0FBRyxHQUFHLENBQUUsQ0FBQztnQkFFN0YsSUFBSyxhQUFhLENBQUUsT0FBTyxDQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsYUFBYSxDQUFFLE9BQU8sQ0FBRSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQ2hGO29CQUNJLElBQUksTUFBTSxHQUFHLGFBQWEsQ0FBRSxPQUFPLENBQUUsQ0FBQyxPQUFPLENBQUUsYUFBYSxDQUFFLE9BQU8sQ0FBRSxDQUFDLE9BQU8sQ0FBQyxDQUFFLENBQUM7b0JBQ25GLElBQUksVUFBVSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUM7b0JBQzlCLElBQUkscUJBQXFCLEdBQUcscUJBQXFCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUMxRCxNQUFNLENBQUMsU0FBUyxJQUFJLENBQUUsQ0FBRSxPQUFPLElBQUksT0FBTyxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUUsR0FBRyxxQkFBcUIsQ0FBQztvQkFDaEYsTUFBTSxDQUFDLFlBQVksSUFBSSxDQUFFLENBQUUsT0FBTyxJQUFJLE9BQU8sQ0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRSxHQUFHLHFCQUFxQixDQUFDO29CQUNsRixNQUFNLENBQUMsWUFBWSxJQUFJLENBQUUsQ0FBRSxPQUFPLElBQUksT0FBTyxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFFLEdBQUcscUJBQXFCLENBQUM7b0JBRWxGLElBQUksT0FBTyxHQUFHLENBQUUsQ0FBRSxLQUFLLElBQUksT0FBTyxDQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFFLENBQUM7b0JBQ3RELHVDQUF1QztvQkFDdkMsSUFBSSxVQUFVLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQztvQkFDckMsSUFBSSxXQUFXLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQztvQkFFdEMsVUFBVSxDQUFDLFdBQVcsQ0FBRSxtQkFBbUIsRUFBRSxJQUFJLENBQUUsQ0FBQztvQkFDcEQsVUFBVSxDQUFDLFdBQVcsQ0FBRSx1QkFBdUIsRUFBRSxxQkFBcUIsQ0FBRSxDQUFDO29CQUN6RSxxQkFBcUIsQ0FBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLENBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBRSxFQUFFLENBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBRSxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQ3JILENBQUUsVUFBVSxJQUFJLGFBQWEsSUFBSSxXQUFXLElBQUksYUFBYSxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUUsVUFBVSxJQUFJLGFBQWEsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFFLENBQUM7b0JBQ3hJLHFCQUFxQixDQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsQ0FBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFFLEVBQUUsQ0FBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFFLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFDdEgsQ0FBRSxVQUFVLElBQUksYUFBYSxJQUFJLFdBQVcsSUFBSSxhQUFhLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBRSxXQUFXLElBQUksYUFBYSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUUsQ0FBQztvQkFDekksVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUUsSUFBSSxDQUFFLENBQUM7b0JBRXJDLElBQUsscUJBQXFCO3dCQUN0QixVQUFVLENBQUMsSUFBSSxFQUFFLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztvQkFFakMsSUFBSyxVQUFVLElBQUksYUFBYSxJQUFJLFdBQVcsSUFBSSxhQUFhLEVBQ2hFO3dCQUNJLElBQUksV0FBVyxHQUFHLGFBQWEsQ0FBRSxPQUFPLENBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQzt3QkFDcEQsSUFBSSxXQUFXLEdBQUcsQ0FBRSxDQUFDLFVBQVUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsR0FBQyxDQUFDLENBQUMsQ0FBRSxHQUFHLFdBQVcsQ0FBQzt3QkFDM0UsSUFBSSxZQUFZLEdBQUcsY0FBYyxDQUFDLHFCQUFxQixDQUFFLFNBQVMsQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLE9BQU8sR0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFFLENBQUM7d0JBQ3BILElBQUksYUFBYSxHQUFHLGNBQWMsQ0FBQyxVQUFVLENBQUUsWUFBWSxDQUFFLENBQUM7d0JBRTlELElBQUksV0FBVyxHQUFHLG9DQUFvQyxDQUFFLEtBQUssQ0FBQyxJQUFJLEdBQUMsQ0FBQyxDQUFFLENBQUM7d0JBQ3ZFLElBQUksT0FBTyxHQUFHLGFBQWEsQ0FBRSxXQUFXLENBQUUsQ0FBQyxPQUFPLENBQUUsQ0FBQyxXQUFXLEdBQUcsQ0FBQyxXQUFXLEdBQUMsQ0FBQyxDQUFDLENBQUUsR0FBQyxDQUFDLENBQUUsQ0FBQzt3QkFDekYscUJBQXFCLENBQUUsT0FBTyxDQUFDLEtBQUssRUFBRSxXQUFXLEdBQUMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFFLE9BQU8sS0FBSyxLQUFLLENBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLEVBQUUsYUFBYSxLQUFLLE9BQU8sQ0FBRSxDQUFDO3FCQUNoSjtpQkFDSjtnQkFFRCxJQUFLLENBQUMscUJBQXFCLEVBQzNCO29CQUNJLE1BQU0sQ0FBRSxZQUFZLENBQUUsT0FBTyxDQUFFLEVBQUUsYUFBYSxDQUFFLENBQUM7b0JBQ2pELE9BQU8sQ0FBRSxZQUFZLENBQUUsQ0FBRSxLQUFLLElBQUksT0FBTyxDQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFFLEVBQUUsYUFBYSxDQUFFLENBQUM7aUJBQ2xGO2FBQ0o7WUFDRCxDQUFDLENBQUMsR0FBRyxDQUFFLDRDQUE0QyxHQUFHLE1BQU0sR0FBRyxzQkFBc0IsR0FBRyxVQUFVLENBQUUsQ0FBQztTQUN4RztJQUNMLENBQUM7QUFDTCxDQUFDLEVBdm5CUyxrQkFBa0IsS0FBbEIsa0JBQWtCLFFBdW5CM0IifQ==