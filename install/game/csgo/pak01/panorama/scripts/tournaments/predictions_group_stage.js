"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../popups/popup_major_hub.ts" />
var PredictionsGroup;
(function (PredictionsGroup) {
    let _m_foundTarget = false;
    const _m_targetNamePrefix = "id-pickem-pick-";
    function Init() {
        let oPageData = PopupMajorHub.GetActivePageData();
        if (!oPageData.hasAlreadyInit.includes(oPageData.panel.id)) {
            _UpdateDragTargets(oPageData);
            _UpdateDragSourceTeams(oPageData);
            _SetUpExtraPickBtns(oPageData);
        }
        InitializeMatchLister(oPageData);
    }
    PredictionsGroup.Init = Init;
    function UpdateFromPredictionUploadedEvent() {
        let oPageData = PopupMajorHub.GetActivePageData();
        _UpdateDragTargets(oPageData);
        _UpdateDragSourceTeams(oPageData);
        _SetUpExtraPickBtns(oPageData);
    }
    PredictionsGroup.UpdateFromPredictionUploadedEvent = UpdateFromPredictionUploadedEvent;
    function _SetUpExtraPickBtns(oPageData) {
        let isActiveSection = PredictionsAPI.GetSectionIsActive(oPageData.tournamentId, oPageData.sectionId);
        let canPick = PredictionsAPI.GetGroupCanPick(oPageData.tournamentId, oPageData.groupId);
        let elRandomBtn = oPageData.panel.FindChildInLayoutFile('id-fill-random');
        let elClearBtn = oPageData.panel.FindChildInLayoutFile('id-clear-all-picks');
        elRandomBtn.visible = isActiveSection && canPick;
        elClearBtn.visible = isActiveSection && canPick;
        if (isActiveSection && !oPageData.hasAlreadyInit.includes(oPageData.panel.id)) {
            elRandomBtn.SetPanelEvent('onactivate', () => {
                _UpdateDragSourceTeams(oPageData);
                _FillOutPicksRandom();
                elRandomBtn.enabled = false;
            });
            elRandomBtn.SetPanelEvent('onmouseover', () => {
                UiToolkitAPI.ShowTextTooltip('id-fill-random', '#pickem_teams_fill_tooltip');
            });
            elRandomBtn.SetPanelEvent('onmouseout', () => {
                UiToolkitAPI.HideTextTooltip();
            });
            elClearBtn.SetPanelEvent('onactivate', () => {
                _UpdateDragTargets(oPageData, true);
                _UpdateDragSourceTeams(oPageData);
            });
            elClearBtn.SetPanelEvent('onmouseover', () => {
                UiToolkitAPI.ShowTextTooltip('id-fill-random', '#pickem_teams_remove_all_tooltip');
            });
            elClearBtn.SetPanelEvent('onmouseout', () => {
                UiToolkitAPI.HideTextTooltip();
            });
        }
    }
    function _UpdateDragSourceTeams(oPageData) {
        let nTeams = PredictionsAPI.GetGroupTeamsCount(oPageData.tournamentId, oPageData.groupId);
        let nActualTeams = 0;
        let aLocalPicks = _GetLocalSetPicks(oPageData);
        let isActiveSection = PredictionsAPI.GetSectionIsActive(oPageData.tournamentId, oPageData.sectionId);
        let canPick = PredictionsAPI.GetGroupCanPick(oPageData.tournamentId, oPageData.groupId);
        let elParent = oPageData.panel.FindChildInLayoutFile('id-predictions-draggable-teams');
        const sourceNamePrefix = 'id-group' + oPageData.groupId + '-team-';
        elParent.GetParent().FindChildInLayoutFile('id-no-teams').visible = (!(nTeams > 0) || !isActiveSection) && canPick;
        elParent.GetParent().FindChildInLayoutFile('id-drag-teams').visible = (nTeams > 0 && isActiveSection);
        for (let i = 0; i < nTeams; ++i) {
            let teamId = PredictionsAPI.GetGroupTeamIDByIndex(oPageData.tournamentId, oPageData.groupId, i);
            if (teamId !== 0 && teamId && !PredictionsAPI.GetFakeItemIDToRepresentTeamID(oPageData.tournamentId, teamId))
                teamId = 0;
            let elTeam = oPageData.panel.FindChildInLayoutFile(sourceNamePrefix + teamId);
            if (teamId !== 0 && teamId) {
                if (!elTeam) {
                    elTeam = $.CreatePanel("Panel", elParent, sourceNamePrefix + teamId);
                    elTeam.BLoadLayoutSnippet("team-draggable");
                    elTeam.Data().teamId = teamId;
                    elTeam.Data().isSource = true;
                    if (isActiveSection && !oPageData.hasAlreadyInit.includes(oPageData.panel.id)) {
                        _AddDragSourceEvents(elTeam);
                        _ShowHideTeamTooltip(elTeam);
                    }
                }
                _SetSourceDragTeamImage(elTeam, teamId);
                let isLocalPick = aLocalPicks.find(p => p.teamId == teamId);
                if (isLocalPick) {
                    elTeam.SwitchClass('team-state', 'already-picked');
                }
                else if (!isActiveSection || !canPick) {
                    elTeam.SwitchClass('team-state', 'team-locked');
                }
                else {
                    elTeam.SwitchClass('team-state', '');
                }
                elTeam.hittest = !isLocalPick;
                elTeam.hittestchildren = !isLocalPick;
                elTeam.SetDraggable((isActiveSection && canPick) && !isLocalPick);
                ++nActualTeams;
            }
        }
        SavePicksButton.UpdateBtn(aLocalPicks);
        if (isActiveSection) {
            let groupPickCount = PredictionsAPI.GetGroupPicksCount(oPageData.tournamentId, oPageData.groupId);
            oPageData.panel.FindChildInLayoutFile('id-fill-random').enabled =
                nActualTeams > 0 &&
                    (aLocalPicks.length < groupPickCount) &&
                    (nActualTeams >= groupPickCount);
            oPageData.panel.FindChildInLayoutFile('id-clear-all-picks').enabled =
                aLocalPicks.length > 0;
        }
        _FillWithEmptyTeams(elParent, nActualTeams);
    }
    function _ShowHideTeamTooltip(elPanel, tooltipLocIdOverride = '') {
        elPanel.SetPanelEvent('onmouseover', () => {
            if (!elPanel.Data().teamId)
                return;
            let oPageData = PopupMajorHub.GetActivePageData();
            if (oPageData && oPageData.panel) {
                if (oPageData.panel.BHasClass('show-all-correct-picks'))
                    return;
            }
            UiToolkitAPI.ShowTextTooltip(tooltipLocIdOverride ?
                tooltipLocIdOverride :
                elPanel.id, PredictionsAPI.GetTeamName(elPanel.Data().teamId));
        });
        elPanel.SetPanelEvent('onmouseout', () => {
            UiToolkitAPI.HideTextTooltip();
        });
    }
    function _FillWithEmptyTeams(elParent, nTeams) {
        let nTeamsPossible = 16;
        let nEmptyteams = nTeamsPossible - nTeams;
        for (let i = 0; i < elParent.Children().length; ++i) {
            if (elParent.Children()[i] && elParent.Children()[i].id === 'empty-team') {
                elParent.Children()[i].DeleteAsync(0);
            }
        }
        if (nEmptyteams > 0) {
            for (let i = 0; i < nEmptyteams; ++i) {
                let elTeam = $.CreatePanel("Panel", elParent, 'empty-team');
                elTeam.BLoadLayoutSnippet("team-draggable");
                elTeam.SwitchClass('team-state', 'empty-team');
                elTeam.hittest = false;
                elTeam.hittestchildren = false;
            }
        }
    }
    function _AddDragSourceEvents(elTeam) {
        $.RegisterEventHandler('DragStart', elTeam, (elPanel, drag) => {
            OnDragStart(elTeam, drag);
            PopupMajorHub.GetActivePageData().panel.SetHasClass('is-dragging', true);
            elTeam.AddClass('dragged-away');
        });
        $.RegisterEventHandler('DragEnd', elTeam, (elRadial, elDragImage) => {
            OnDragEnd(elDragImage);
            PopupMajorHub.GetActivePageData().panel.SetHasClass('is-dragging', false);
            elTeam.RemoveClass('dragged-away');
        });
    }
    function _SetSourceDragTeamImage(elTeam, teamId) {
        let elLogoImage = elTeam.FindChildInLayoutFile('id-team-logo');
        if (!teamId) {
            elLogoImage.SetImage('');
            return;
        }
        elLogoImage.SetImage(PopupMajorHub.GetTeamIcon(teamId));
    }
    function _GetLocalSetPicks(oPageData, bAllowEmptySlots = false) {
        let nCount = PredictionsAPI.GetGroupPicksCount(oPageData.tournamentId, oPageData.groupId);
        let aPicks = [];
        for (let i = 0; i < nCount; ++i) {
            let elTarget = oPageData.panel.FindChildInLayoutFile(_m_targetNamePrefix + i);
            if (bAllowEmptySlots) {
                aPicks.push({ teamId: elTarget.Data().teamId, group: oPageData.groupId, groupIndex: i });
            }
            else if (elTarget.Data().teamId) {
                aPicks.push({ teamId: elTarget.Data().teamId, group: oPageData.groupId, groupIndex: i });
            }
        }
        return aPicks;
    }
    function _GetLocalPickPanel(teamId) {
        let oPageData = PopupMajorHub.GetActivePageData();
        let nCount = PredictionsAPI.GetGroupPicksCount(oPageData.tournamentId, oPageData.groupId);
        for (let i = 0; i < nCount; ++i) {
            let elTarget = oPageData.panel.FindChildInLayoutFile(_m_targetNamePrefix + i);
            if (elTarget.Data().teamId === teamId) {
                return elTarget;
            }
        }
        return null;
    }
    function OnDragStart(elDragSource, drag) {
        PopupMajorHub.DeleteDragItem();
        let elDragImage = $.CreatePanel('ItemImage', $.GetContextPanel(), '', {
            class: 'group-stage-drag-icon',
            textureheight: '48',
            texturewidth: '48'
        });
        elDragImage.SetImage(PopupMajorHub.GetTeamIcon(elDragSource.Data().teamId));
        elDragImage.AddClass('start-drag');
        elDragImage.Data().teamId = elDragSource.Data().teamId;
        elDragImage.Data().isSource = elDragSource.Data().isSource ? elDragSource.Data().isSource : false;
        PopupMajorHub.m_elDragImage = elDragImage;
        drag.displayPanel = elDragImage;
        drag.offsetX = 32;
        drag.offsetY = 32;
        drag.removePositionBeforeDrop = false;
        $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.inventory_item_pickup', 'MOUSE');
        UiToolkitAPI.HideTextTooltip();
        elDragImage.SetPanelEvent('onmouseout', () => { PopupMajorHub.DeleteDragItem(); });
    }
    function OnDragEnd(elDragImage) {
        elDragImage.AddClass('drag-end');
        PopupMajorHub.DeleteDragItem();
        if (!_m_foundTarget && !elDragImage.Data().isSource) {
            let elOldTarget = _GetLocalPickPanel(elDragImage.Data().teamId);
            _UpdateDropTarget(elOldTarget, null);
            _UpdateDragSourceTeams(PopupMajorHub.GetActivePageData());
        }
        _m_foundTarget = false;
    }
    function _UpdateDragTargets(oPageData, bForceClear = false) {
        let nCount = PredictionsAPI.GetGroupPicksCount(oPageData.tournamentId, oPageData.groupId);
        let isActiveSection = PredictionsAPI.GetSectionIsActive(oPageData.tournamentId, oPageData.sectionId);
        for (let i = 0; i < nCount; ++i) {
            let elTarget = oPageData.panel.FindChildInLayoutFile(_m_targetNamePrefix + i);
            _MakeUniqueTooltipLocator(elTarget, oPageData.groupId, i);
            if (bForceClear) {
                _UpdateDropTarget(elTarget, null);
                elTarget.SwitchClass('correct-state', 'not-active');
            }
            else {
                let savedTeamId = PredictionsAPI.GetMyPredictionTeamID(oPageData.tournamentId, oPageData.groupId, i);
                let LocalTeamId = elTarget.Data().teamId;
                _UpdateDropTarget(elTarget, (savedTeamId ? savedTeamId : LocalTeamId ? LocalTeamId : null));
                if (isActiveSection && !oPageData.hasAlreadyInit.includes(oPageData.panel.id)) {
                    _ItemDragTargetEvents(elTarget);
                    _AddDragSourceEvents(elTarget.FindChildInLayoutFile('id-team-panel'));
                }
                else {
                    let sCorrectPicks = PredictionsAPI.GetGroupCorrectPicksByIndex(oPageData.tournamentId, oPageData.groupId, i);
                    if (PopupMajorHub.CheckIfPickIsCorrect(sCorrectPicks, savedTeamId) && savedTeamId) {
                        elTarget.SwitchClass('correct-state', 'is-correct');
                    }
                    else if (savedTeamId && !isActiveSection) {
                        elTarget.SwitchClass('correct-state', 'is-incorrect');
                    }
                    else {
                        elTarget.SwitchClass('correct-state', 'not-active');
                    }
                }
            }
        }
        if (bForceClear) {
            $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.inventory_item_notequipped', 'MOUSE');
        }
    }
    function _MakeUniqueTooltipLocator(elTarget, groupId, index) {
        let tooltipLocId = 'id-target-tooltip-loc-' + groupId + '-' + index;
        let tooltipLoc = elTarget.FindChild(tooltipLocId);
        let tooltipLocClass = (index === 5 || index === 6 || index === 7) ? 'group-stage-drop-target__tooltip-loc bottom' : 'group-stage-drop-target__tooltip-loc';
        if (!tooltipLoc) {
            tooltipLoc = $.CreatePanel('Panel', elTarget, tooltipLocId, { class: tooltipLocClass });
            elTarget.Data().tooltipLocId = tooltipLocId;
        }
    }
    function _ItemDragTargetEvents(elTarget) {
        $.RegisterEventHandler('DragEnter', elTarget, () => {
            elTarget.AddClass('group-stage-drag-enter');
        });
        $.RegisterEventHandler('DragLeave', elTarget, () => {
            elTarget.RemoveClass('group-stage-drag-enter');
        });
        $.RegisterEventHandler('DragDrop', elTarget, (dispayId, elDragImage) => {
            _OnDragDrop(elTarget, elDragImage);
        });
    }
    function _OnDragDrop(elTarget, elDragImage) {
        if (elDragImage.Data().teamId !== elTarget.Data().teamId) {
            let elOldTarget = _GetLocalPickPanel(elDragImage.Data().teamId);
            if (elTarget.Data().teamId) {
                _UpdateDropTarget(elOldTarget, elTarget.Data().teamId);
            }
            else {
                _UpdateDropTarget(elOldTarget, null);
            }
        }
        _UpdateDropTarget(elTarget, elDragImage.Data().teamId);
        _UpdateDragSourceTeams(PopupMajorHub.GetActivePageData());
        $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.inventory_item_putdown', 'MOUSE');
        _m_foundTarget = true;
    }
    function _UpdateDropTarget(elTarget, teamId) {
        if (elTarget && elTarget.IsValid()) {
            let oPageData = PopupMajorHub.GetActivePageData();
            let isActiveSection = PredictionsAPI.GetSectionIsActive(oPageData.tournamentId, oPageData.sectionId);
            let canPick = PredictionsAPI.GetGroupCanPick(oPageData.tournamentId, oPageData.groupId);
            elTarget.SetDraggable((isActiveSection && canPick));
            elTarget.Data().teamId = teamId;
            elTarget.SetHasClass('has-pick', teamId !== null ? true : false);
            elTarget.SetHasClass('not-active', teamId !== null);
            if (teamId === null || !isActiveSection || !canPick) {
                elTarget.FindChildInLayoutFile('id-team-panel').SwitchClass('team-state', 'team-locked');
            }
            else {
                elTarget.FindChildInLayoutFile('id-team-panel').SwitchClass('team-state', '');
            }
            elTarget.FindChildInLayoutFile('id-team-panel').Data().teamId = teamId;
            elTarget.FindChildInLayoutFile('id-team-panel').SetDraggable((isActiveSection && canPick) && teamId !== null);
            _SetSourceDragTeamImage(elTarget, teamId);
            _ShowHideTeamTooltip(elTarget, elTarget.Data().tooltipLocId);
        }
    }
    function _FillOutPicksRandom() {
        let oPageData = PopupMajorHub.GetActivePageData();
        let aLocalPicks = _GetLocalSetPicks(oPageData, true);
        let aTeams = [];
        let nTeams = PredictionsAPI.GetGroupTeamsCount(oPageData.tournamentId, oPageData.groupId);
        for (let i = 0; i < nTeams; ++i) {
            aTeams.push(PredictionsAPI.GetGroupTeamIDByIndex(oPageData.tournamentId, oPageData.groupId, i));
            aTeams = aTeams.filter(value => value !== 0);
        }
        if (aTeams.length === 0) {
            return;
        }
        let aUnpickedTeams = aTeams.filter((value, index) => !aLocalPicks.find(p => p.teamId == value));
        let top = aUnpickedTeams.length;
        while (--top) {
            var current = Math.floor(Math.random() * (top + 1));
            var tmp = aUnpickedTeams[current];
            aUnpickedTeams[current] = aUnpickedTeams[top];
            aUnpickedTeams[top] = tmp;
        }
        let aEmptySlotsToFill = [];
        aLocalPicks.forEach((pick, index) => {
            if (!pick.teamId && index < aTeams.length) {
                aEmptySlotsToFill.push(index);
            }
        });
        let nDelay = 0;
        aEmptySlotsToFill.forEach((value, index) => {
            let elTarget = oPageData.panel.FindChildInLayoutFile(_m_targetNamePrefix + value);
            $.Schedule(nDelay, () => {
                _UpdateDropTarget(elTarget, aUnpickedTeams[index]);
                $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.inventory_item_putdown', 'MOUSE');
            });
            nDelay = nDelay + .04;
        });
        $.Schedule(nDelay, () => { _UpdateDragSourceTeams(oPageData); });
    }
    let _m_elSections = {};
    let _m_elPlacements = {};
    function InitializeMatchLister(oPageData) {
        if (MatchListAPI.GetState(oPageData.tournamentId) !== 'ready')
            return;
        for (let numWs = 0; numWs <= 2; ++numWs) {
            for (let numLs = 0; numLs <= 2; ++numLs) {
                let strMatchups = 'matchups-' + numWs + '-' + numLs;
                let elMatchups = oPageData.panel.FindChildInLayoutFile(strMatchups);
                if (!elMatchups)
                    continue;
                elMatchups.FindChildInLayoutFile('matchup-score').text = $.Localize('#pickem_swiss_group_' + numWs + numLs);
                let arrTeamPairs = [];
                for (let iMatch = 0;; ++iMatch) {
                    let elTeamPair = elMatchups.FindChildInLayoutFile('match-idx-' + iMatch);
                    if (!elTeamPair)
                        break;
                    arrTeamPairs.push({ panel: elTeamPair, keyteamwl: 0, keyteam_wins: 0, keyteam_loss: 0 });
                    elTeamPair.SetHasClass('has_valid_matchup', false);
                    elTeamPair.SetHasClass('has_match_in_progress', false);
                    elTeamPair.FindChildInLayoutFile('id-team-matchup-logo-0').SetImage(oPageData.tournamentId == "tournament:24" ? "file://{images}/tournaments/unknown_team_dark.svg" : "file://{images}/tournaments/unknown_team.svg");
                    elTeamPair.FindChildInLayoutFile('id-team-matchup-logo-1').SetImage(oPageData.tournamentId == "tournament:24" ? "file://{images}/tournaments/unknown_team_dark.svg" : "file://{images}/tournaments/unknown_team.svg");
                    elTeamPair.Data().umids = [];
                    elTeamPair.SetPanelEvent('onactivate', () => {
                        let sUmids = (elTeamPair.Data().umids.length > 0) ? elTeamPair.Data().umids.join(',') : '';
                        var contextMenuPanel = UiToolkitAPI.ShowCustomLayoutContextMenuParameters('', '', 'file://{resources}/layout/context_menus/context_menu_get_souvenir.xml', 'umids=' + sUmids +
                            '&' + 'tournamentId=' + PopupMajorHub.GetActivePageData().eventId);
                        contextMenuPanel.AddClass("ContextMenu_NoArrow");
                    });
                }
                _m_elSections[strMatchups] = { matches: arrTeamPairs, results: 0 };
            }
        }
        for (let numWs = 0; numWs <= 3; ++numWs) {
            for (let numLs = 0; numLs <= 3; ++numLs) {
                if (numWs != 3 && numLs != 3)
                    continue;
                let strID = 'placement-' + numWs + '-' + numLs;
                let elContainer = oPageData.panel.FindChildInLayoutFile(strID);
                if (!elContainer)
                    continue;
                let arrSlots = [];
                elContainer.Children().forEach(el => {
                    if (el.BHasClass('placeholder-team-icon'))
                        return;
                    if (el.GetChildCount() == 0) {
                        arrSlots.push(el);
                    }
                    else {
                        el.RemoveClass('actual-result-green-check');
                        arrSlots.push(el.FindChildInLayoutFile('placement-team-icon'));
                    }
                });
                arrSlots.forEach(el => {
                    el.SetImage(oPageData.tournamentId == "tournament:24" ? "file://{images}/tournaments/unknown_team_dark.svg" : "file://{images}/tournaments/unknown_team.svg");
                });
                _m_elPlacements[strID] = { slots: arrSlots, results: 0 };
            }
        }
        let numBestOf1Rounds = ((g_ActiveTournamentInfo.eventid >= 26)
            && (oPageData.sectionIndex >= g_ActiveTournamentInfo.num_stages_with_swiss - 1))
            ? 0 : 2;
        let teamStates = {};
        function GetTeamState(teamid) {
            if (!teamStates.hasOwnProperty(teamid)) {
                teamStates[teamid] = {
                    wins: 0,
                    loss: 0,
                    bo3w: 0,
                    bo3l: 0
                };
            }
            return teamStates[teamid];
        }
        function AddWin(state) {
            if (state.wins >= numBestOf1Rounds || state.loss >= numBestOf1Rounds) {
                ++state.bo3w;
                if (state.bo3w >= 2) {
                    state.bo3w = state.bo3l = 0;
                    ++state.wins;
                }
            }
            else {
                ++state.wins;
            }
        }
        function AddLoss(state) {
            if (state.wins >= numBestOf1Rounds || state.loss >= numBestOf1Rounds) {
                ++state.bo3l;
                if (state.bo3l >= 2) {
                    state.bo3l = state.bo3w = 0;
                    ++state.loss;
                }
            }
            else {
                ++state.loss;
            }
        }
        let nCount = PredictionsAPI.GetSectionMatchesCount(oPageData.tournamentId, oPageData.sectionId);
        for (let idxMatch = nCount; idxMatch-- > 0;) {
            let umid = PredictionsAPI.GetSectionMatchByIndex(oPageData.tournamentId, oPageData.sectionId, idxMatch);
            let team0 = MatchInfoAPI.GetMatchTournamentTeamTag(umid, 0);
            let team1 = MatchInfoAPI.GetMatchTournamentTeamTag(umid, 1);
            let res = MatchInfoAPI.GetMatchOutcome(umid);
            let bMatchStillInProgress = (!res || res <= 0);
            let winteam = ((res == 2) ? team1 : team0);
            let keyteam = (team0 < team1) ? team0 : team1;
            let steam = GetTeamState(keyteam);
            let matchup = 'matchups-' + steam.wins + '-' + steam.loss;
            if (!_m_elSections[matchup].hasOwnProperty(keyteam)) {
                _m_elSections[matchup][keyteam] = _m_elSections[matchup].results;
                ++_m_elSections[matchup].results;
            }
            if (_m_elSections[matchup][keyteam] < _m_elSections[matchup].matches.length) {
                let omatch = _m_elSections[matchup].matches[_m_elSections[matchup][keyteam]];
                let elTeamPair = omatch.panel;
                let nCountThisMatchForBO3 = bMatchStillInProgress ? 0 : 1;
                omatch.keyteamwl += ((winteam == keyteam) ? 1 : -1) * nCountThisMatchForBO3;
                omatch.keyteam_wins += ((winteam == keyteam) ? 1 : 0) * nCountThisMatchForBO3;
                omatch.keyteam_loss += ((winteam != keyteam) ? 1 : 0) * nCountThisMatchForBO3;
                let bSwap01 = (omatch.keyteamwl >= 0) ? ((team0 == keyteam) ? false : true)
                    : ((team0 == keyteam) ? true : false);
                let nLeftScore = 0;
                let nRightScore = 0;
                if (steam.wins >= numBestOf1Rounds || steam.loss >= numBestOf1Rounds) {
                    nLeftScore = (omatch.keyteam_wins >= omatch.keyteam_loss) ? omatch.keyteam_wins : omatch.keyteam_loss;
                    nRightScore = (omatch.keyteam_wins < omatch.keyteam_loss) ? omatch.keyteam_wins : omatch.keyteam_loss;
                }
                else {
                    nLeftScore = MatchInfoAPI.GetMatchRoundScoreForTeam(umid, bSwap01 ? 1 : 0);
                    nRightScore = MatchInfoAPI.GetMatchRoundScoreForTeam(umid, bSwap01 ? 0 : 1);
                }
                elTeamPair.SetHasClass('has_valid_matchup', true);
                elTeamPair.SetHasClass('has_match_in_progress', bMatchStillInProgress);
                elTeamPair.FindChildInLayoutFile('id-team-matchup-logo-0').SetImage("file://{images}/tournaments/teams/" +
                    (bSwap01 ? team1 : team0) + ".svg");
                elTeamPair.FindChildInLayoutFile('id-team-matchup-logo-1').SetImage("file://{images}/tournaments/teams/" +
                    (bSwap01 ? team0 : team1) + ".svg");
                elTeamPair.SetDialogVariableInt('match-score-0', nLeftScore);
                elTeamPair.SetDialogVariableInt('match-score-1', nRightScore);
                elTeamPair.Data().umids.push(umid);
                if (bMatchStillInProgress)
                    elTeamPair.Data().umids = [];
            }
            if (!bMatchStillInProgress) {
                AddWin(GetTeamState(winteam));
                AddLoss(GetTeamState((team0 == winteam) ? team1 : team0));
            }
        }
        for (let teamtag in teamStates) {
            if (teamStates[teamtag].wins < 3 && teamStates[teamtag].loss < 3)
                continue;
            let strID = 'placement-' + teamStates[teamtag].wins + '-' + teamStates[teamtag].loss;
            let idx = _m_elPlacements[strID].results++;
            if (idx >= _m_elPlacements[strID].slots.length)
                continue;
            _m_elPlacements[strID].slots[idx].SetImage("file://{images}/tournaments/teams/" + teamtag + ".svg");
            let elParent = _m_elPlacements[strID].slots[idx].GetParent();
            if (elParent && elParent.id.startsWith('id-pickem-pick-')) {
                let pickSlotIdx = parseInt(elParent.id.substring('id-pickem-pick-'.length));
                let pickSlotRange = (pickSlotIdx >= 0 && pickSlotIdx <= 1) ? { begin: 0, end: 1 } :
                    (pickSlotIdx >= 2 && pickSlotIdx <= 7) ? { begin: 2, end: 7 } :
                        (pickSlotIdx >= 8 && pickSlotIdx <= 9) ? { begin: 8, end: 9 } :
                            { begin: pickSlotIdx, end: pickSlotIdx };
                let bCorrectActualPick = false;
                for (let jj = pickSlotRange.begin; jj <= pickSlotRange.end; ++jj) {
                    let teamidPicked = PredictionsAPI.GetMyPredictionTeamID(oPageData.tournamentId, oPageData.groupId, jj);
                    let teamTagPicked = PredictionsAPI.GetTeamTag(teamidPicked);
                    if (teamTagPicked === teamtag) {
                        bCorrectActualPick = true;
                        break;
                    }
                }
                elParent.SetHasClass('actual-result-green-check', bCorrectActualPick);
            }
        }
    }
})(PredictionsGroup || (PredictionsGroup = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZGljdGlvbnNfZ3JvdXBfc3RhZ2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy90b3VybmFtZW50cy9wcmVkaWN0aW9uc19ncm91cF9zdGFnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBQ3JDLHFEQUFxRDtBQUVyRCxJQUFVLGdCQUFnQixDQWl1QnpCO0FBanVCRCxXQUFVLGdCQUFnQjtJQUV6QixJQUFJLGNBQWMsR0FBWSxLQUFLLENBQUM7SUFDcEMsTUFBTSxtQkFBbUIsR0FBRyxpQkFBaUIsQ0FBQztJQUc5QyxTQUFnQixJQUFJO1FBRW5CLElBQUksU0FBUyxHQUFHLGFBQWEsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBSWxELElBQUksQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBRSxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBRSxFQUM1RDtZQUNDLGtCQUFrQixDQUFFLFNBQVMsQ0FBRSxDQUFDO1lBQ2hDLHNCQUFzQixDQUFFLFNBQVMsQ0FBRSxDQUFDO1lBQ3BDLG1CQUFtQixDQUFFLFNBQVMsQ0FBRSxDQUFDO1NBQ2pDO1FBRUQscUJBQXFCLENBQUUsU0FBUyxDQUFFLENBQUM7SUFDcEMsQ0FBQztJQWRlLHFCQUFJLE9BY25CLENBQUE7SUFFRCxTQUFnQixpQ0FBaUM7UUFFaEQsSUFBSSxTQUFTLEdBQUcsYUFBYSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDbEQsa0JBQWtCLENBQUUsU0FBUyxDQUFFLENBQUM7UUFDaEMsc0JBQXNCLENBQUUsU0FBUyxDQUFFLENBQUM7UUFDcEMsbUJBQW1CLENBQUUsU0FBUyxDQUFDLENBQUM7SUFDakMsQ0FBQztJQU5lLGtEQUFpQyxvQ0FNaEQsQ0FBQTtJQUVELFNBQVMsbUJBQW1CLENBQUUsU0FBbUM7UUFFaEUsSUFBSSxlQUFlLEdBQUcsY0FBYyxDQUFDLGtC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