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
        if (isActiveSection) {
            elRandomBtn.SetPanelEvent('onactivate', () => {
                _UpdateDragSourceTeams(oPageData);
                _FillOutPicksRandom();
                elRandomBtn.enabled = false;
            });
            elRandomBtn.SetPanelEvent('onmouseover', () => {
                UiToolkitAPI.ShowTextTooltipOnPanel(elRandomBtn, '#pickem_teams_fill_tooltip');
            });
            elRandomBtn.SetPanelEvent('onmouseout', () => {
                UiToolkitAPI.HideTextTooltip();
            });
            elClearBtn.SetPanelEvent('onactivate', () => {
                _UpdateDragTargets(oPageData, true);
                _UpdateDragSourceTeams(oPageData);
            });
            elClearBtn.SetPanelEvent('onmouseover', () => {
                UiToolkitAPI.ShowTextTooltipOnPanel(elClearBtn, '#pickem_teams_remove_all_tooltip');
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
                    _AddDragSourceEvents(elTeam);
                    _ShowHideTeamTooltip(elTeam);
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
        PopupMajorHub.ShowBannerTeam(elDragSource.Data().teamId);
        let elDragImage = $.CreatePanel('ItemImage', $.GetContextPanel(), '', {
            class: 'group-stage-drag-icon',
            textureheight: '48',
            texturewidth: '48'
        });
        elDragImage.SetImage(PopupMajorHub.GetTeamIcon(elDragSource.Data().teamId));
        elDragImage.AddClass('drag-start');
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
            if (!elTarget) {
                continue;
            }
            _MakeUniqueTooltipLocator(elTarget, oPageData.groupId, i);
            if (!elTarget.Data().hasDragEvents) {
                _ItemDragTargetEvents(elTarget);
                _AddDragSourceEvents(elTarget.FindChildInLayoutFile('id-team-panel'));
                elTarget.Data().hasDragEvents = true;
            }
            if (bForceClear) {
                elTarget.SwitchClass('correct-state', '');
                _UpdateDropTarget(elTarget, null);
                continue;
            }
            let savedTeamId = PredictionsAPI.GetMyPredictionTeamID(oPageData.tournamentId, oPageData.groupId, i);
            let LocalTeamId = elTarget.Data().teamId;
            let sCorrectPicks = PredictionsAPI.GetGroupCorrectPicksByIndex(oPageData.tournamentId, oPageData.groupId, i);
            if (isActiveSection) {
                elTarget.SwitchClass('correct-state', '');
            }
            else if (savedTeamId && PopupMajorHub.CheckIfPickIsCorrect(sCorrectPicks, savedTeamId)) {
                elTarget.SwitchClass('correct-state', 'is-correct');
            }
            else if (savedTeamId) {
                elTarget.SwitchClass('correct-state', 'is-incorrect');
            }
            else {
                elTarget.SwitchClass('correct-state', '');
            }
            _UpdateDropTarget(elTarget, (savedTeamId ? savedTeamId : LocalTeamId ? LocalTeamId : null));
            if (!isActiveSection) {
                elTarget.AddClass('not-active');
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
        for (let top = aUnpickedTeams.length - 1; top > 0; --top) {
            const current = Math.floor(Math.random() * (top + 1));
            [aUnpickedTeams[current], aUnpickedTeams[top]] = [aUnpickedTeams[top], aUnpickedTeams[current]];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZGljdGlvbnNfZ3JvdXBfc3RhZ2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy90b3VybmFtZW50cy9wcmVkaWN0aW9uc19ncm91cF9zdGFnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBQ3JDLHFEQUFxRDtBQUVyRCxJQUFVLGdCQUFnQixDQWl1QnpCO0FBanVCRCxXQUFVLGdCQUFnQjtJQUV6QixJQUFJLGNBQWMsR0FBWSxLQUFLLENBQUM7SUFDcEMsTUFBTSxtQkFBbUIsR0FBRyxpQkFBaUIsQ0FBQztJQUU5QyxTQUFnQixJQUFJO1FBRW5CLElBQUksU0FBUyxHQUFHLGFBQWEsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBR2xELElBQUksQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBRSxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBRSxFQUM1RDtZQUNDLGtCQUFrQixDQUFFLFNBQVMsQ0FBRSxDQUFDO1lBQ2hDLHNCQUFzQixDQUFFLFNBQVMsQ0FBRSxDQUFDO1lBQ3BDLG1CQUFtQixDQUFFLFNBQVMsQ0FBRSxDQUFDO1NBQ2pDO1FBRUQscUJBQXFCLENBQUUsU0FBUyxDQUFFLENBQUM7SUFDcEMsQ0FBQztJQWJlLHFCQUFJLE9BYW5CLENBQUE7SUFFRCxTQUFnQixpQ0FBaUM7UUFFaEQsSUFBSSxTQUFTLEdBQUcsYUFBYSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDbEQsa0JBQWtCLENBQUUsU0FBUyxDQUFFLENBQUM7UUFDaEMsc0JBQXNCLENBQUUsU0FBUyxDQUFFLENBQUM7UUFDcEMsbUJBQW1CLENBQUUsU0FBUyxDQUFDLENBQUM7SUFDakMsQ0FBQztJQU5lLGtEQUFpQyxvQ0FNaEQsQ0FBQTtJQUVELFNBQVMsbUJBQW1CLENBQUUsU0FBbUM7UUFFaEUsSUFBSSxlQUFlLEdBQUcsY0FBYyxDQUFDLGtC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