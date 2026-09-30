"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../popups/popup_major_hub.ts" />
var PredictionsGroup;
(function (PredictionsGroup) {
    let _m_foundTarget = false;
    const _m_targetNamePrefix = "id-pickem-pick-";
    // Current version of how groups stages work.
    function Init() {
        let oPageData = PopupMajorHub.GetActivePageData();
        // Doesn't re-fetch saved picks for display the picks when you are just browsing tabs in the major hub
        // So picks do not change user the user.
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
                // _UpdateDragTargets( oPageData, false );
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
            $.Msg('teamId' + teamId);
            if (teamId !== 0 && teamId) {
                if (!elTeam) {
                    elTeam = $.CreatePanel("Panel", elParent, sourceNamePrefix + teamId);
                    elTeam.BLoadLayoutSnippet("team-draggable");
                    elTeam.Data().teamId = teamId;
                    elTeam.Data().isSource = true;
                    // prevents adding multiple events
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
                //Prevents hover states and any unintentional dragging
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
                // aPicks.push( elTarget.Data().teamId )
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
        // Parent to $.GetContextPanel() instead of elDragSource.
        // Parenting to elDragSource results in item images getting stuck in weird places for some reason.
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
        // Drop event fires before EndDrag.
        // If user did not successfully drop and are not from the source icons then remove the pick from the slot
        // User dragged out into empty space
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
                // prevents adding multiple events
                if (isActiveSection && !oPageData.hasAlreadyInit.includes(oPageData.panel.id)) {
                    _ItemDragTargetEvents(elTarget);
                    _AddDragSourceEvents(elTarget.FindChildInLayoutFile('id-team-panel'));
                }
                else {
                    let sCorrectPicks = PredictionsAPI.GetGroupCorrectPicksByIndex(oPageData.tournamentId, oPageData.groupId, i);
                    if (PopupMajorHub.CheckIfPickIsCorrect(sCorrectPicks, savedTeamId) && savedTeamId) {
                        elTarget.SwitchClass('correct-state', 'is-correct');
                    }
                    else if (savedTeamId && !isActiveSection) // only add the correct-state if user made a pick
                     {
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
        // Null clears out the slot
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
        let aLocalPicks = _GetLocalSetPicks(oPageData, true); // does not filter for unfilled slots
        let aTeams = [];
        // Get available teams
        let nTeams = PredictionsAPI.GetGroupTeamsCount(oPageData.tournamentId, oPageData.groupId);
        for (let i = 0; i < nTeams; ++i) {
            aTeams.push(PredictionsAPI.GetGroupTeamIDByIndex(oPageData.tournamentId, oPageData.groupId, i));
            aTeams = aTeams.filter(value => value !== 0);
        }
        if (aTeams.length === 0) {
            return;
        }
        let aUnpickedTeams = aTeams.filter((value, index) => !aLocalPicks.find(p => p.teamId == value));
        //shuffle
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
    //
    // Data and methods for match lister presentation
    //
    let _m_elSections = {};
    let _m_elPlacements = {};
    function InitializeMatchLister(oPageData) {
        // Must have a stable match list before updating any data in our UI
        if (MatchListAPI.GetState(oPageData.tournamentId) !== 'ready')
            return;
        //
        // Find all the sections and fully reset them to default presentation
        //
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
        //
        // Find all the placement tiles
        //
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
                        return; // placeholders are not valid teams
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
        //
        // Dictionary of current team states
        //
        let numBestOf1Rounds = ((g_ActiveTournamentInfo.eventid >= 26)
            && (oPageData.sectionIndex >= g_ActiveTournamentInfo.num_stages_with_swiss - 1))
            ? 0 : 2; // how many best-of-1 rounds before teams start playing best-of-3 matchups (starting with Cologne 2026 Major we play Stage III all best-of-3)
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
        //
        // Let's roll through the match lister
        //
        // let nCount:number = MatchListAPI.GetCount( oPageData.tournamentId );
        let nCount = PredictionsAPI.GetSectionMatchesCount(oPageData.tournamentId, oPageData.sectionId);
        $.Msg('InitializeMatchLister has ' + nCount + ' matches');
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
            $.Msg('   ' + team0 + '-vs-' + team1 + ' in ' + matchup + ' UMID:' + umid + ' res=' + res);
            if (!_m_elSections[matchup].hasOwnProperty(keyteam)) {
                _m_elSections[matchup][keyteam] = _m_elSections[matchup].results;
                $.Msg('      added matchup key for ' + keyteam + ' = ' + _m_elSections[matchup].results + ' out of ' + _m_elSections[matchup].matches.length);
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
                if (steam.wins >= numBestOf1Rounds || steam.loss >= numBestOf1Rounds) { // BEST-OF-3 scores show "2:0" or "2:1"
                    nLeftScore = (omatch.keyteam_wins >= omatch.keyteam_loss) ? omatch.keyteam_wins : omatch.keyteam_loss;
                    nRightScore = (omatch.keyteam_wins < omatch.keyteam_loss) ? omatch.keyteam_wins : omatch.keyteam_loss;
                }
                else { // BEST-OF-1 shows actual match score
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
        // Set known team placements here
        for (let teamtag in teamStates) {
            if (teamStates[teamtag].wins < 3 && teamStates[teamtag].loss < 3)
                continue; // this team state is unknown
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
        $.Msg('InitializeMatchLister finished processing ' + nCount + ' matches');
    }
})(PredictionsGroup || (PredictionsGroup = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZGljdGlvbnNfZ3JvdXBfc3RhZ2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy90b3VybmFtZW50cy9wcmVkaWN0aW9uc19ncm91cF9zdGFnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBQ3JDLHFEQUFxRDtBQUVyRCxJQUFVLGdCQUFnQixDQWl1QnpCO0FBanVCRCxXQUFVLGdCQUFnQjtJQUV6QixJQUFJLGNBQWMsR0FBWSxLQUFLLENBQUM7SUFDcEMsTUFBTSxtQkFBbUIsR0FBRyxpQkFBaUIsQ0FBQztJQUU5Qyw2Q0FBNkM7SUFDN0MsU0FBZ0IsSUFBSTtRQUVuQixJQUFJLFNBQVMsR0FBRyxhQUFhLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUVsRCxzR0FBc0c7UUFDdEcsd0NBQXdDO1FBQ3hDLElBQUksQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBRSxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBRSxFQUM1RDtZQUNDLGtCQUFrQixDQUFFLFNBQVMsQ0FBRSxDQUFDO1lBQ2hDLHNCQUFzQixDQUFFLFNBQVMsQ0FBRSxDQUFDO1lBQ3BDLG1CQUFtQixDQUFFLFNBQVMsQ0FBRSxDQUFDO1NBQ2pDO1FBRUQscUJBQXFCLENBQUUsU0FBUyxDQUFFLENBQUM7SUFDcEMsQ0FBQztJQWRlLHFCQUFJLE9BY25CLENBQUE7SUFFRCxTQUFnQixpQ0FBaUM7UUFFaEQsSUFBSSxTQUFTLEdBQUcsYUFBYSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDbEQsa0JBQWtCLENBQUUsU0FBUyxDQUFFLENBQUM7UUFDaEMsc0JBQXNCLENBQUUsU0FBUyxDQUFFLENBQUM7UUFDcEMsbUJBQW1CLENBQUUsU0FBUyxDQUFDLENBQUM7SUFDakMsQ0FBQztJQU5lLGtEQUFpQyxvQ0FNaEQsQ0FBQTtJQUVELFNBQVMsbUJBQW1CLENBQUUsU0FBbUM7UUFFaEUsSUFBSSxlQUFlLEdBQUcsY0FBYyxDQUFDLGtCQUFrQixDQUFFLFNBQVMsQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLFNBQVMsQ0FBRSxDQUFDO1FBQ3ZHLElBQUksT0FBTyxHQUFHLGNBQWMsQ0FBQyxlQUFlLENBQUUsU0FBUyxDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsT0FBTyxDQUFFLENBQUM7UUFFMUYsSUFBSSxXQUFXLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsQ0FBRSxnQkFBZ0IsQ0FBYyxDQUFDO1FBQ3hGLElBQUksVUFBVSxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMscUJBQXFCLENBQUUsb0JBQW9CLENBQWMsQ0FBQztRQUUzRixXQUFXLENBQUMsT0FBTyxHQUFHLGVBQWUsSUFBSSxPQUFPLENBQUM7UUFDakQsVUFBVSxDQUFDLE9BQU8sR0FBRyxlQUFlLElBQUksT0FBTyxDQUFDO1FBRWhELElBQUksZUFBZSxJQUFJLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUUsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUUsRUFDL0U7WUFDQyxXQUFXLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxHQUFFLEVBQUU7Z0JBQzVDLDBDQUEwQztnQkFDMUMsc0JBQXNCLENBQUUsU0FBUyxDQUFFLENBQUM7Z0JBQ3BDLG1CQUFtQixFQUFFLENBQUM7Z0JBQ3RCLFdBQVcsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1lBQzdCLENBQUMsQ0FBQyxDQUFDO1lBRUgsV0FBVyxDQUFDLGFBQWEsQ0FBRSxhQUFhLEVBQUUsR0FBRSxFQUFFO2dCQUM3QyxZQUFZLENBQUMsZUFBZSxDQUFFLGdCQUFnQixFQUFFLDRCQUE0QixDQUFFLENBQUM7WUFDaEYsQ0FBQyxDQUFDLENBQUM7WUFFSCxXQUFXLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxHQUFFLEVBQUU7Z0JBQzVDLFlBQVksQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUNoQyxDQUFDLENBQUMsQ0FBQztZQUVILFVBQVUsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLEdBQUUsRUFBRTtnQkFDM0Msa0JBQWtCLENBQUUsU0FBUyxFQUFFLElBQUksQ0FBRSxDQUFDO2dCQUN0QyxzQkFBc0IsQ0FBRSxTQUFTLENBQUUsQ0FBQztZQUNyQyxDQUFDLENBQUMsQ0FBQztZQUVILFVBQVUsQ0FBQyxhQUFhLENBQUUsYUFBYSxFQUFFLEdBQUUsRUFBRTtnQkFDNUMsWUFBWSxDQUFDLGVBQWUsQ0FBRSxnQkFBZ0IsRUFBRSxrQ0FBa0MsQ0FBRSxDQUFDO1lBQ3RGLENBQUMsQ0FBQyxDQUFDO1lBRUgsVUFBVSxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsR0FBRSxFQUFFO2dCQUMzQyxZQUFZLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDaEMsQ0FBQyxDQUFDLENBQUM7U0FDSDtJQUNGLENBQUM7SUFFRCxTQUFTLHNCQUFzQixDQUFFLFNBQWtDO1FBRWxFLElBQUksTUFBTSxHQUFHLGNBQWMsQ0FBQyxrQkFBa0IsQ0FBRSxTQUFTLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxPQUFPLENBQUUsQ0FBQztRQUM1RixJQUFJLFlBQVksR0FBRyxDQUFDLENBQUM7UUFDckIsSUFBSSxXQUFXLEdBQWdDLGlCQUFpQixDQUFFLFNBQVMsQ0FBRSxDQUFDO1FBQzlFLElBQUksZUFBZSxHQUFHLGNBQWMsQ0FBQyxrQkFBa0IsQ0FBRSxTQUFTLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxTQUFTLENBQUUsQ0FBQztRQUN2RyxJQUFJLE9BQU8sR0FBRyxjQUFjLENBQUMsZUFBZSxDQUFFLFNBQVMsQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLE9BQU8sQ0FBRSxDQUFDO1FBQzFGLElBQUksUUFBUSxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMscUJBQXFCLENBQUUsZ0NBQWdDLENBQUUsQ0FBQztRQUV6RixNQUFNLGdCQUFnQixHQUFHLFVBQVUsR0FBRyxTQUFTLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQztRQUVuRSxRQUFRLENBQUMsU0FBUyxFQUFFLENBQUMscUJBQXFCLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFFLE1BQU0sR0FBRyxDQUFDLENBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBRSxJQUFJLE9BQU8sQ0FBQztRQUN0SCxRQUFRLENBQUMsU0FBUyxFQUFFLENBQUMscUJBQXFCLENBQUMsZUFBZSxDQUFDLENBQUMsT0FBTyxHQUFHLENBQUUsTUFBTSxHQUFHLENBQUMsSUFBSSxlQUFlLENBQUUsQ0FBQztRQUV4RyxLQUFLLElBQUksQ0FBQyxHQUFVLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUN0QztZQUNDLElBQUksTUFBTSxHQUFHLGNBQWMsQ0FBQyxxQkFBcUIsQ0FBRSxTQUFTLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFFLENBQUM7WUFDbEcsSUFBSyxNQUFNLEtBQUssQ0FBQyxJQUFJLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyw4QkFBOEIsQ0FBRSxTQUFTLENBQUMsWUFBWSxFQUFFLE1BQU0sQ0FBRTtnQkFDOUcsTUFBTSxHQUFHLENBQUMsQ0FBQztZQUNaLElBQUksTUFBTSxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMscUJBQXFCLENBQUUsZ0JBQWdCLEdBQUcsTUFBTSxDQUFhLENBQUM7WUFDM0YsQ0FBQyxDQUFDLEdBQUcsQ0FBRSxRQUFRLEdBQUcsTUFBTSxDQUFDLENBQUM7WUFFMUIsSUFBSSxNQUFNLEtBQUssQ0FBQyxJQUFJLE1BQU0sRUFDMUI7Z0JBQ0MsSUFBSSxDQUFDLE1BQU0sRUFDWDtvQkFDQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixHQUFHLE1BQU0sQ0FBRSxDQUFDO29CQUN2RSxNQUFNLENBQUMsa0JBQWtCLENBQUUsZ0JBQWdCLENBQUUsQ0FBQztvQkFDOUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7b0JBQzlCLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO29CQUU5QixrQ0FBa0M7b0JBQ2xDLElBQUksZUFBZSxJQUFJLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUUsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUUsRUFDL0U7d0JBQ0Msb0JBQW9CLENBQUUsTUFBTSxDQUFFLENBQUM7d0JBQy9CLG9CQUFvQixDQUFFLE1BQU0sQ0FBRSxDQUFDO3FCQUMvQjtpQkFDRDtnQkFFRCx1QkFBdUIsQ0FBRSxNQUFNLEVBQUUsTUFBTSxDQUFFLENBQUM7Z0JBRTFDLElBQUksV0FBVyxHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxJQUFJLE1BQU0sQ0FBRSxDQUFDO2dCQUU3RCxJQUFJLFdBQVcsRUFDZjtvQkFDQyxNQUFNLENBQUMsV0FBVyxDQUFFLFlBQVksRUFBRSxnQkFBZ0IsQ0FBRSxDQUFDO2lCQUNyRDtxQkFDSSxJQUFJLENBQUMsZUFBZSxJQUFJLENBQUMsT0FBTyxFQUNyQztvQkFDQyxNQUFNLENBQUMsV0FBVyxDQUFFLFlBQVksRUFBRSxhQUFhLENBQUUsQ0FBQztpQkFDbEQ7cUJBRUQ7b0JBQ0MsTUFBTSxDQUFDLFdBQVcsQ0FBRSxZQUFZLEVBQUUsRUFBRSxDQUFFLENBQUM7aUJBQ3ZDO2dCQUVELHNEQUFzRDtnQkFDdEQsTUFBTSxDQUFDLE9BQU8sR0FBRyxDQUFDLFdBQVcsQ0FBQztnQkFDOUIsTUFBTSxDQUFDLGVBQWUsR0FBRyxDQUFDLFdBQVcsQ0FBQztnQkFDdEMsTUFBTSxDQUFDLFlBQVksQ0FBRSxDQUFDLGVBQWUsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBRSxDQUFDO2dCQUVwRSxFQUFFLFlBQVksQ0FBQzthQUNmO1NBQ0Q7UUFFRCxlQUFlLENBQUMsU0FBUyxDQUFFLFdBQVcsQ0FBRSxDQUFDO1FBRXpDLElBQUksZUFBZSxFQUNuQjtZQUNDLElBQUksY0FBYyxHQUFHLGNBQWMsQ0FBQyxrQkFBa0IsQ0FBRSxTQUFTLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxPQUFPLENBQUUsQ0FBQztZQUVsRyxTQUFTLENBQUMsS0FBSyxDQUFDLHFCQUFxQixDQUFFLGdCQUFnQixDQUFnQixDQUFDLE9BQU87Z0JBQ2hGLFlBQVksR0FBRyxDQUFDO29CQUNoQixDQUFFLFdBQVcsQ0FBQyxNQUFNLEdBQUcsY0FBYyxDQUFFO29CQUN2QyxDQUFFLFlBQVksSUFBSSxjQUFjLENBQUUsQ0FBQztZQUVsQyxTQUFTLENBQUMsS0FBSyxDQUFDLHFCQUFxQixDQUFFLG9CQUFvQixDQUFnQixDQUFDLE9BQU87Z0JBQ3BGLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1NBQ3hCO1FBRUQsbUJBQW1CLENBQUUsUUFBUSxFQUFFLFlBQVksQ0FBRSxDQUFDO0lBQy9DLENBQUM7SUFFRCxTQUFTLG9CQUFvQixDQUFFLE9BQWdCLEVBQUUsdUJBQStCLEVBQUU7UUFFakYsT0FBTyxDQUFDLGFBQWEsQ0FBRSxhQUFhLEVBQUUsR0FBRSxFQUFFO1lBQ3pDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTTtnQkFDekIsT0FBTztZQUVSLElBQUksU0FBUyxHQUFHLGFBQWEsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQ2xELElBQUssU0FBUyxJQUFJLFNBQVMsQ0FBQyxLQUFLLEVBQ2pDO2dCQUNDLElBQUssU0FBUyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUUsd0JBQXdCLENBQUU7b0JBQ3pELE9BQU87YUFDUjtZQUVELFlBQVksQ0FBQyxlQUFlLENBQzNCLG9CQUFvQixDQUFDLENBQUM7Z0JBQ3RCLG9CQUFvQixDQUFDLENBQUM7Z0JBQ3RCLE9BQU8sQ0FBQyxFQUFFLEVBQUUsY0FBYyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBQztRQUNsRSxDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLEdBQUUsRUFBRTtZQUN4QyxZQUFZLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDaEMsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDO0lBRUQsU0FBUyxtQkFBbUIsQ0FBRSxRQUFnQixFQUFFLE1BQWE7UUFFNUQsSUFBSSxjQUFjLEdBQUcsRUFBRSxDQUFDO1FBQ3hCLElBQUksV0FBVyxHQUFHLGNBQWMsR0FBRyxNQUFNLENBQUM7UUFFMUMsS0FBSyxJQUFJLENBQUMsR0FBVSxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQzFEO1lBQ0MsSUFBSSxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxZQUFZLEVBQ3hFO2dCQUNDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDdEM7U0FDRDtRQUdELElBQUksV0FBVyxHQUFHLENBQUMsRUFDbkI7WUFDQyxLQUFLLElBQUksQ0FBQyxHQUFVLENBQUMsRUFBRSxDQUFDLEdBQUcsV0FBVyxFQUFFLEVBQUUsQ0FBQyxFQUMzQztnQkFDQyxJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUMsWUFBWSxDQUFFLENBQUM7Z0JBQzdELE1BQU0sQ0FBQyxrQkFBa0IsQ0FBRSxnQkFBZ0IsQ0FBRSxDQUFDO2dCQUM5QyxNQUFNLENBQUMsV0FBVyxDQUFFLFlBQVksRUFBRSxZQUFZLENBQUUsQ0FBQztnQkFDakQsTUFBTSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7Z0JBQ3ZCLE1BQU0sQ0FBQyxlQUFlLEdBQUcsS0FBSyxDQUFDO2FBQy9CO1NBQ0Q7SUFDRixDQUFDO0lBRUQsU0FBUyxvQkFBb0IsQ0FBRSxNQUFjO1FBRTVDLENBQUMsQ0FBQyxvQkFBb0IsQ0FBRSxXQUFXLEVBQUUsTUFBTSxFQUFFLENBQUUsT0FBTyxFQUFFLElBQUksRUFBRyxFQUFFO1lBRWhFLFdBQVcsQ0FBRSxNQUFNLEVBQUUsSUFBSSxDQUFHLENBQUM7WUFDN0IsYUFBYSxDQUFDLGlCQUFpQixFQUFFLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBRSxhQUFhLEVBQUUsSUFBSSxDQUFFLENBQUM7WUFDM0UsTUFBTSxDQUFDLFFBQVEsQ0FBRSxjQUFjLENBQUUsQ0FBQztRQUNuQyxDQUFDLENBQUUsQ0FBQztRQUVKLENBQUMsQ0FBQyxvQkFBb0IsQ0FBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLENBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRyxFQUFFO1lBRXRFLFNBQVMsQ0FBRSxXQUEwQixDQUFFLENBQUM7WUFDeEMsYUFBYSxDQUFDLGlCQUFpQixFQUFFLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBRSxhQUFhLEVBQUUsS0FBSyxDQUFFLENBQUM7WUFDNUUsTUFBTSxDQUFDLFdBQVcsQ0FBRSxjQUFjLENBQUUsQ0FBQztRQUN0QyxDQUFDLENBQUUsQ0FBQztJQUNMLENBQUM7SUFFRCxTQUFTLHVCQUF1QixDQUFFLE1BQWMsRUFBRSxNQUFvQjtRQUVyRSxJQUFJLFdBQVcsR0FBRyxNQUFNLENBQUMscUJBQXFCLENBQUUsY0FBYyxDQUFhLENBQUE7UUFFM0UsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNaLFdBQVcsQ0FBQyxRQUFRLENBQUUsRUFBRSxDQUFFLENBQUM7WUFDM0IsT0FBTztTQUNQO1FBRUQsV0FBVyxDQUFDLFFBQVEsQ0FBRyxhQUFhLENBQUMsV0FBVyxDQUFFLE1BQU0sQ0FBRSxDQUFDLENBQUM7SUFDN0QsQ0FBQztJQUVELFNBQVMsaUJBQWlCLENBQUUsU0FBa0MsRUFBRSxtQkFBMkIsS0FBSztRQUUvRixJQUFJLE1BQU0sR0FBRyxjQUFjLENBQUMsa0JBQWtCLENBQUUsU0FBUyxDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsT0FBTyxDQUFHLENBQUM7UUFDN0YsSUFBSSxNQUFNLEdBQStCLEVBQUUsQ0FBQztRQUU1QyxLQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUNoQztZQUNDLElBQUksUUFBUSxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMscUJBQXFCLENBQUUsbUJBQW1CLEdBQUcsQ0FBQyxDQUFhLENBQUM7WUFDM0YsSUFBSSxnQkFBZ0IsRUFDcEI7Z0JBQ0MsTUFBTSxDQUFDLElBQUksQ0FBRSxFQUFFLE1BQU0sRUFBRSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLENBQUMsT0FBTyxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUMxRix3Q0FBd0M7YUFDeEM7aUJBQ0ksSUFBSSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxFQUMvQjtnQkFDQyxNQUFNLENBQUMsSUFBSSxDQUFFLEVBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsQ0FBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRyxDQUFDLENBQUM7YUFDM0Y7U0FDRDtRQUVELE9BQU8sTUFBTSxDQUFDO0lBQ2YsQ0FBQztJQUVELFNBQVMsa0JBQWtCLENBQUcsTUFBYTtRQUUxQyxJQUFJLFNBQVMsR0FBRyxhQUFhLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUNsRCxJQUFJLE1BQU0sR0FBRyxjQUFjLENBQUMsa0JBQWtCLENBQUUsU0FBUyxDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsT0FBTyxDQUFHLENBQUM7UUFFN0YsS0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFDaEM7WUFDQyxJQUFJLFFBQVEsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLHFCQUFxQixDQUFFLG1CQUFtQixHQUFHLENBQUMsQ0FBYSxDQUFDO1lBQzNGLElBQUksUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sS0FBSyxNQUFNLEVBQUc7Z0JBQ3ZDLE9BQU8sUUFBUSxDQUFDO2FBQ2hCO1NBQ0Q7UUFFRCxPQUFPLElBQUksQ0FBQztJQUNiLENBQUM7SUFFRCxTQUFTLFdBQVcsQ0FBRyxZQUFxQixFQUFFLElBQW1CO1FBRWhFLHlEQUF5RDtRQUN6RCxrR0FBa0c7UUFDbEcsYUFBYSxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBRS9CLElBQUksV0FBVyxHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQyxlQUFlLEVBQUUsRUFBRSxFQUFFLEVBQUU7WUFDdEUsS0FBSyxFQUFFLHVCQUF1QjtZQUM5QixhQUFhLEVBQUUsSUFBSTtZQUNuQixZQUFZLEVBQUUsSUFBSTtTQUNsQixDQUFhLENBQUM7UUFFZixXQUFXLENBQUMsUUFBUSxDQUFFLGFBQWEsQ0FBQyxXQUFXLENBQUUsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBRSxDQUFFLENBQUM7UUFDaEYsV0FBVyxDQUFDLFFBQVEsQ0FBRSxZQUFZLENBQUUsQ0FBQztRQUNyQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxHQUFHLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUM7UUFDdkQsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLFFBQVEsR0FBRyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7UUFFbEcsYUFBYSxDQUFDLGFBQWEsR0FBRyxXQUFXLENBQUM7UUFFMUMsSUFBSSxDQUFDLFlBQVksR0FBRyxXQUFXLENBQUM7UUFDaEMsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDbEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDbEIsSUFBSSxDQUFDLHdCQUF3QixHQUFHLEtBQUssQ0FBQztRQUV0QyxDQUFDLENBQUMsYUFBYSxDQUFFLHFCQUFxQixFQUFFLGtDQUFrQyxFQUFFLE9BQU8sQ0FBRSxDQUFDO1FBQ3RGLFlBQVksQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUUvQixXQUFXLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxHQUFFLEVBQUUsR0FBRyxhQUFhLENBQUMsY0FBYyxFQUFFLENBQUEsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNuRixDQUFDO0lBRUQsU0FBUyxTQUFTLENBQUcsV0FBd0I7UUFFNUMsV0FBVyxDQUFDLFFBQVEsQ0FBRSxVQUFVLENBQUUsQ0FBQztRQUNuQyxhQUFhLENBQUMsY0FBYyxFQUFFLENBQUM7UUFFL0IsbUNBQW1DO1FBQ25DLHlHQUF5RztRQUN6RyxvQ0FBb0M7UUFDcEMsSUFBSSxDQUFDLGNBQWMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQ25EO1lBQ0MsSUFBSSxXQUFXLEdBQUcsa0JBQWtCLENBQUUsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBRSxDQUFDO1lBQ2xFLGlCQUFpQixDQUFFLFdBQVksRUFBRSxJQUFJLENBQUUsQ0FBQztZQUN4QyxzQkFBc0IsQ0FBRSxhQUFhLENBQUMsaUJBQWlCLEVBQUUsQ0FBRSxDQUFDO1NBQzVEO1FBRUQsY0FBYyxHQUFHLEtBQUssQ0FBQztJQUN4QixDQUFDO0lBRUQsU0FBUyxrQkFBa0IsQ0FBRSxTQUFrQyxFQUFFLGNBQXNCLEtBQUs7UUFFM0YsSUFBSSxNQUFNLEdBQUcsY0FBYyxDQUFDLGtCQUFrQixDQUFFLFNBQVMsQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLE9BQU8sQ0FBRSxDQUFDO1FBQzVGLElBQUksZUFBZSxHQUFHLGNBQWMsQ0FBQyxrQkFBa0IsQ0FBRSxTQUFTLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxTQUFTLENBQUUsQ0FBQztRQUV2RyxLQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUNoQztZQUNDLElBQUksUUFBUSxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMscUJBQXFCLENBQUUsbUJBQW1CLEdBQUcsQ0FBQyxDQUFhLENBQUM7WUFFM0YseUJBQXlCLENBQUUsUUFBUSxFQUFFLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFFLENBQUM7WUFFNUQsSUFBSSxXQUFXLEVBQ2Y7Z0JBQ0MsaUJBQWlCLENBQUUsUUFBUyxFQUFFLElBQUksQ0FBRSxDQUFDO2dCQUNyQyxRQUFRLENBQUMsV0FBVyxDQUFFLGVBQWUsRUFBRSxZQUFZLENBQUUsQ0FBQzthQUN0RDtpQkFFRDtnQkFDQyxJQUFJLFdBQVcsR0FBRyxjQUFjLENBQUMscUJBQXFCLENBQUUsU0FBUyxDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBRSxDQUFDO2dCQUN2RyxJQUFJLFdBQVcsR0FBRyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDO2dCQUV6QyxpQkFBaUIsQ0FBRSxRQUFTLEVBQUUsQ0FBRSxXQUFXLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBRSxDQUFDLENBQUM7Z0JBRWhHLGtDQUFrQztnQkFDbEMsSUFBSSxlQUFlLElBQUksQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBRSxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBRSxFQUMvRTtvQkFDQyxxQkFBcUIsQ0FBRSxRQUFRLENBQUUsQ0FBQztvQkFDbEMsb0JBQW9CLENBQUUsUUFBUSxDQUFDLHFCQUFxQixDQUFDLGVBQWUsQ0FBQyxDQUFFLENBQUM7aUJBQ3hFO3FCQUVEO29CQUNDLElBQUksYUFBYSxHQUFHLGNBQWMsQ0FBQywyQkFBMkIsQ0FBRSxTQUFTLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFFLENBQUM7b0JBRS9HLElBQUksYUFBYSxDQUFDLG9CQUFvQixDQUFFLGFBQWEsRUFBRSxXQUFXLENBQUUsSUFBSSxXQUFXLEVBQ25GO3dCQUNDLFFBQVEsQ0FBQyxXQUFXLENBQUUsZUFBZSxFQUFFLFlBQVksQ0FBRSxDQUFDO3FCQUN0RDt5QkFDSSxJQUFJLFdBQVcsSUFBSSxDQUFDLGVBQWUsRUFBRyxpREFBaUQ7cUJBQzVGO3dCQUNDLFFBQVEsQ0FBQyxXQUFXLENBQUUsZUFBZSxFQUFFLGNBQWMsQ0FBRSxDQUFDO3FCQUN4RDt5QkFDRzt3QkFDSCxRQUFRLENBQUMsV0FBVyxDQUFFLGVBQWUsRUFBRSxZQUFZLENBQUUsQ0FBQztxQkFDdEQ7aUJBQ0Q7YUFDRDtTQUNEO1FBRUQsSUFBSSxXQUFXLEVBQ2Y7WUFDQyxDQUFDLENBQUMsYUFBYSxDQUFFLHFCQUFxQixFQUFFLHVDQUF1QyxFQUFFLE9BQU8sQ0FBRSxDQUFDO1NBQzNGO0lBQ0YsQ0FBQztJQUVELFNBQVMseUJBQXlCLENBQUUsUUFBaUIsRUFBRSxPQUFjLEVBQUUsS0FBWTtRQUVsRixJQUFJLFlBQVksR0FBRyx3QkFBd0IsR0FBRyxPQUFPLEdBQUUsR0FBRyxHQUFHLEtBQUssQ0FBQztRQUNuRSxJQUFJLFVBQVUsR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFFLFlBQVksQ0FBRSxDQUFDO1FBQ3BELElBQUksZUFBZSxHQUFHLENBQUUsS0FBSyxLQUFLLENBQUMsSUFBSSxLQUFLLEtBQUssQ0FBQyxJQUFJLEtBQUssS0FBSyxDQUFDLENBQUUsQ0FBQyxDQUFDLENBQUEsNkNBQTZDLENBQUMsQ0FBQyxDQUFBLHNDQUFzQyxDQUFDO1FBQzNKLElBQUssQ0FBQyxVQUFVLEVBQ2hCO1lBQ0MsVUFBVSxHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUUsRUFBRSxLQUFLLEVBQUUsZUFBZSxFQUFFLENBQUUsQ0FBQztZQUMxRixRQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQztTQUM1QztJQUNGLENBQUM7SUFFRCxTQUFTLHFCQUFxQixDQUFHLFFBQWlCO1FBRWpELENBQUMsQ0FBQyxvQkFBb0IsQ0FBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRTtZQUVuRCxRQUFRLENBQUMsUUFBUSxDQUFFLHdCQUF3QixDQUFFLENBQUM7UUFDL0MsQ0FBQyxDQUFFLENBQUM7UUFFSixDQUFDLENBQUMsb0JBQW9CLENBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUU7WUFFbkQsUUFBUSxDQUFDLFdBQVcsQ0FBRSx3QkFBd0IsQ0FBRSxDQUFDO1FBQ2xELENBQUMsQ0FBRSxDQUFDO1FBRUosQ0FBQyxDQUFDLG9CQUFvQixDQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsQ0FBRSxRQUFRLEVBQUUsV0FBVyxFQUFHLEVBQUU7WUFFekUsV0FBVyxDQUFFLFFBQVEsRUFBRSxXQUEwQixDQUFFLENBQUM7UUFDckQsQ0FBQyxDQUFFLENBQUM7SUFDTCxDQUFDO0lBRUQsU0FBUyxXQUFXLENBQUcsUUFBaUIsRUFBRSxXQUF3QjtRQUVqRSxJQUFJLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLEtBQUssUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sRUFDeEQ7WUFDQyxJQUFJLFdBQVcsR0FBRyxrQkFBa0IsQ0FBRSxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFFLENBQUM7WUFFbEUsSUFBSSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxFQUMxQjtnQkFDQyxpQkFBaUIsQ0FBRSxXQUFZLEVBQUUsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBRSxDQUFDO2FBQzFEO2lCQUVEO2dCQUNDLGlCQUFpQixDQUFFLFdBQVksRUFBRSxJQUFJLENBQUUsQ0FBQzthQUN4QztTQUNEO1FBRUQsaUJBQWlCLENBQUUsUUFBUSxFQUFFLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUUsQ0FBQztRQUN6RCxzQkFBc0IsQ0FBRSxhQUFhLENBQUMsaUJBQWlCLEVBQUUsQ0FBRSxDQUFDO1FBQzVELENBQUMsQ0FBQyxhQUFhLENBQUUscUJBQXFCLEVBQUUsbUNBQW1DLEVBQUUsT0FBTyxDQUFFLENBQUM7UUFFdkYsY0FBYyxHQUFHLElBQUksQ0FBQztJQUN2QixDQUFDO0lBRUQsU0FBUyxpQkFBaUIsQ0FBRyxRQUFnQixFQUFFLE1BQW9CO1FBRWxFLDJCQUEyQjtRQUMzQixJQUFJLFFBQVEsSUFBSSxRQUFRLENBQUMsT0FBTyxFQUFFLEVBQ2xDO1lBQ0MsSUFBSSxTQUFTLEdBQUcsYUFBYSxDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDbEQsSUFBSSxlQUFlLEdBQUcsY0FBYyxDQUFDLGtCQUFrQixDQUFFLFNBQVMsQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLFNBQVMsQ0FBRSxDQUFDO1lBQ3ZHLElBQUksT0FBTyxHQUFHLGNBQWMsQ0FBQyxlQUFlLENBQUUsU0FBUyxDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsT0FBTyxDQUFFLENBQUM7WUFFMUYsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFFLGVBQWUsSUFBSSxPQUFPLENBQUUsQ0FBQyxDQUFDO1lBRXRELFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1lBQ2hDLFFBQVEsQ0FBQyxXQUFXLENBQUUsVUFBVSxFQUFFLE1BQU0sS0FBSyxJQUFJLENBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFFLENBQUM7WUFDcEUsUUFBUSxDQUFDLFdBQVcsQ0FBRSxZQUFZLEVBQUUsTUFBTSxLQUFLLElBQUksQ0FBRSxDQUFDO1lBRXRELElBQUksTUFBTSxLQUFLLElBQUksSUFBSSxDQUFDLGVBQWUsSUFBSSxDQUFDLE9BQU8sRUFDbkQ7Z0JBQ0MsUUFBUSxDQUFDLHFCQUFxQixDQUFDLGVBQWUsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxZQUFZLEVBQUUsYUFBYSxDQUFFLENBQUM7YUFDM0Y7aUJBRUQ7Z0JBQ0MsUUFBUSxDQUFDLHFCQUFxQixDQUFDLGVBQWUsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxZQUFZLEVBQUUsRUFBRSxDQUFFLENBQUM7YUFDaEY7WUFFRCxRQUFRLENBQUMscUJBQXFCLENBQUMsZUFBZSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztZQUN2RSxRQUFRLENBQUMscUJBQXFCLENBQUMsZUFBZSxDQUFDLENBQUMsWUFBWSxDQUFFLENBQUUsZUFBZSxJQUFJLE9BQU8sQ0FBRSxJQUFJLE1BQU0sS0FBSyxJQUFJLENBQUUsQ0FBQztZQUNsSCx1QkFBdUIsQ0FBRSxRQUFRLEVBQUUsTUFBTSxDQUFFLENBQUM7WUFDNUMsb0JBQW9CLENBQUUsUUFBUSxFQUFHLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxZQUFZLENBQUUsQ0FBQztTQUNoRTtJQUNGLENBQUM7SUFFRCxTQUFTLG1CQUFtQjtRQUUzQixJQUFJLFNBQVMsR0FBRyxhQUFhLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUNsRCxJQUFJLFdBQVcsR0FBZ0MsaUJBQWlCLENBQUUsU0FBUyxFQUFFLElBQUksQ0FBRSxDQUFDLENBQUEscUNBQXFDO1FBQ3pILElBQUksTUFBTSxHQUFhLEVBQUUsQ0FBQztRQUUxQixzQkFBc0I7UUFDdEIsSUFBSSxNQUFNLEdBQUcsY0FBYyxDQUFDLGtCQUFrQixDQUFFLFNBQVMsQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLE9BQU8sQ0FBRSxDQUFDO1FBQzVGLEtBQUssSUFBSSxDQUFDLEdBQVcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQ3ZDO1lBQ0MsTUFBTSxDQUFDLElBQUksQ0FBRSxjQUFjLENBQUMscUJBQXFCLENBQUUsU0FBUyxDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBRSxDQUFDLENBQUM7WUFDbkcsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLEtBQUssQ0FBQyxDQUFFLENBQUM7U0FDL0M7UUFFRCxJQUFJLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUN2QjtZQUNDLE9BQU87U0FDUDtRQUVELElBQUksY0FBYyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBRSxDQUFDLENBQUE7UUFFaEcsU0FBUztRQUNULElBQUksR0FBRyxHQUFHLGNBQWMsQ0FBQyxNQUFNLENBQUM7UUFDaEMsT0FBTyxFQUFFLEdBQUcsRUFBRTtZQUNiLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEQsSUFBSSxHQUFHLEdBQUcsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2xDLGNBQWMsQ0FBQyxPQUFPLENBQUMsR0FBRyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDOUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQztTQUMxQjtRQUVELElBQUksaUJBQWlCLEdBQWEsRUFBRSxDQUFDO1FBRXJDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBRSxJQUFJLEVBQUUsS0FBSyxFQUFHLEVBQUU7WUFDckMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLElBQUksS0FBSyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUU7Z0JBQzFDLGlCQUFpQixDQUFDLElBQUksQ0FBRSxLQUFLLENBQUUsQ0FBQzthQUNoQztRQUNGLENBQUMsQ0FBQyxDQUFBO1FBRUYsSUFBSSxNQUFNLEdBQVUsQ0FBQyxDQUFDO1FBQ3RCLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxDQUFFLEtBQUssRUFBRSxLQUFLLEVBQUcsRUFBRTtZQUM1QyxJQUFJLFFBQVEsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLHFCQUFxQixDQUFFLG1CQUFtQixHQUFHLEtBQUssQ0FBYSxDQUFDO1lBQy9GLENBQUMsQ0FBQyxRQUFRLENBQUUsTUFBTSxFQUFFLEdBQUUsRUFBRTtnQkFDdkIsaUJBQWlCLENBQUUsUUFBUyxFQUFFLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUNyRCxDQUFDLENBQUMsYUFBYSxDQUFFLHFCQUFxQixFQUFFLG1DQUFtQyxFQUFFLE9BQU8sQ0FBRSxDQUFDO1lBQUEsQ0FBQyxDQUFDLENBQUM7WUFDM0YsTUFBTSxHQUFHLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDdkIsQ0FBQyxDQUFDLENBQUM7UUFFSCxDQUFDLENBQUMsUUFBUSxDQUFFLE1BQU0sRUFBRSxHQUFFLEVBQUUsR0FBRSxzQkFBc0IsQ0FBRSxTQUFTLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ25FLENBQUM7SUFFRCxFQUFFO0lBQ0YsaURBQWlEO0lBQ2pELEVBQUU7SUFFRixJQUFJLGFBQWEsR0FBUSxFQUFFLENBQUM7SUFDNUIsSUFBSSxlQUFlLEdBQVEsRUFBRSxDQUFDO0lBRTlCLFNBQVMscUJBQXFCLENBQUUsU0FBa0M7UUFFakUsbUVBQW1FO1FBQ25FLElBQUssWUFBWSxDQUFDLFFBQVEsQ0FBRSxTQUFTLENBQUMsWUFBWSxDQUFFLEtBQUssT0FBTztZQUFHLE9BQU87UUFFMUUsRUFBRTtRQUNGLHFFQUFxRTtRQUNyRSxFQUFFO1FBQ0YsS0FBTSxJQUFJLEtBQUssR0FBVSxDQUFDLEVBQUUsS0FBSyxJQUFJLENBQUMsRUFBRSxFQUFHLEtBQUssRUFDaEQ7WUFDQyxLQUFNLElBQUksS0FBSyxHQUFVLENBQUMsRUFBRSxLQUFLLElBQUksQ0FBQyxFQUFFLEVBQUcsS0FBSyxFQUNoRDtnQkFDQyxJQUFJLFdBQVcsR0FBRyxXQUFXLEdBQUcsS0FBSyxHQUFHLEdBQUcsR0FBRyxLQUFLLENBQUM7Z0JBQ3BELElBQUksVUFBVSxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMscUJBQXFCLENBQUUsV0FBVyxDQUFFLENBQUM7Z0JBQ3RFLElBQUssQ0FBQyxVQUFVO29CQUFHLFNBQVM7Z0JBRTNCLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBRSxlQUFlLENBQWMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxzQkFBc0IsR0FBQyxLQUFLLEdBQUMsS0FBSyxDQUFDLENBQUM7Z0JBRXZILElBQUksWUFBWSxHQUFRLEVBQUUsQ0FBQztnQkFDM0IsS0FBTSxJQUFJLE1BQU0sR0FBVSxDQUFDLEdBQUksRUFBRyxNQUFNLEVBQ3hDO29CQUNDLElBQUksVUFBVSxHQUFHLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBRSxZQUFZLEdBQUcsTUFBTSxDQUFFLENBQUM7b0JBQzNFLElBQUssQ0FBQyxVQUFVO3dCQUFHLE1BQU07b0JBQ3pCLFlBQVksQ0FBQyxJQUFJLENBQUUsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsWUFBWSxFQUFFLENBQUMsRUFBRSxZQUFZLEVBQUUsQ0FBQyxFQUFFLENBQUUsQ0FBQztvQkFDM0YsVUFBVSxDQUFDLFdBQVcsQ0FBRSxtQkFBbUIsRUFBRSxLQUFLLENBQUUsQ0FBQztvQkFDckQsVUFBVSxDQUFDLFdBQVcsQ0FBRSx1QkFBdUIsRUFBRSxLQUFLLENBQUUsQ0FBQztvQkFDeEQsVUFBVSxDQUFDLHFCQUFxQixDQUFFLHdCQUF3QixDQUFjLENBQUMsUUFBUSxDQUFFLFNBQVMsQ0FBQyxZQUFZLElBQUksZUFBZSxDQUFDLENBQUMsQ0FBQyxtREFBbUQsQ0FBQyxDQUFDLENBQUMsOENBQThDLENBQUMsQ0FBQztvQkFDck8sVUFBVSxDQUFDLHFCQUFxQixDQUFFLHdCQUF3QixDQUFjLENBQUMsUUFBUSxDQUFFLFNBQVMsQ0FBQyxZQUFZLElBQUksZUFBZSxDQUFDLENBQUMsQ0FBQyxtREFBbUQsQ0FBQyxDQUFDLENBQUMsOENBQThDLENBQUMsQ0FBQztvQkFDdE8sVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7b0JBRTdCLFVBQVUsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLEdBQUUsRUFBRTt3QkFFNUMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQzt3QkFFM0YsSUFBSSxnQkFBZ0IsR0FBRyxZQUFZLENBQUMscUNBQXFDLENBQ3hFLEVBQUUsRUFDRixFQUFFLEVBQ0YsdUVBQXVFLEVBQ3ZFLFFBQVEsR0FBRyxNQUFNOzRCQUNqQixHQUFHLEdBQUcsZUFBZSxHQUFHLGFBQWEsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLE9BQU8sQ0FDakUsQ0FBQzt3QkFDRixnQkFBZ0IsQ0FBQyxRQUFRLENBQUUscUJBQXFCLENBQUUsQ0FBQztvQkFDcEQsQ0FBQyxDQUFDLENBQUM7aUJBQ0g7Z0JBQ0QsYUFBYSxDQUFFLFdBQVcsQ0FBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUM7YUFDckU7U0FDRDtRQUVELEVBQUU7UUFDRiwrQkFBK0I7UUFDL0IsRUFBRTtRQUNGLEtBQU0sSUFBSSxLQUFLLEdBQVcsQ0FBQyxFQUFFLEtBQUssSUFBSSxDQUFDLEVBQUUsRUFBRyxLQUFLLEVBQ2pEO1lBQ0MsS0FBTSxJQUFJLEtBQUssR0FBVyxDQUFDLEVBQUUsS0FBSyxJQUFJLENBQUMsRUFBRSxFQUFHLEtBQUssRUFDakQ7Z0JBQ0MsSUFBSyxLQUFLLElBQUksQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDO29CQUFHLFNBQVM7Z0JBQ3pDLElBQUksS0FBSyxHQUFHLFlBQVksR0FBRyxLQUFLLEdBQUcsR0FBRyxHQUFHLEtBQUssQ0FBQztnQkFDL0MsSUFBSSxXQUFXLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsQ0FBRSxLQUFLLENBQUUsQ0FBQztnQkFDakUsSUFBSyxDQUFDLFdBQVc7b0JBQUcsU0FBUztnQkFDN0IsSUFBSSxRQUFRLEdBQWMsRUFBRSxDQUFDO2dCQUM3QixXQUFXLENBQUMsUUFBUSxFQUFFLENBQUMsT0FBTyxDQUFFLEVBQUUsQ0FBQyxFQUFFO29CQUNwQyxJQUFLLEVBQUUsQ0FBQyxTQUFTLENBQUUsdUJBQXVCLENBQUM7d0JBQUcsT0FBTyxDQUFDLG1DQUFtQztvQkFDekYsSUFBSyxFQUFFLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxFQUFHO3dCQUM5QixRQUFRLENBQUMsSUFBSSxDQUFFLEVBQWEsQ0FBRSxDQUFDO3FCQUMvQjt5QkFBTTt3QkFDTixFQUFFLENBQUMsV0FBVyxDQUFFLDJCQUEyQixDQUFFLENBQUM7d0JBQzlDLFFBQVEsQ0FBQyxJQUFJLENBQUUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLHFCQUFxQixDQUFhLENBQUUsQ0FBQztxQkFDOUU7Z0JBQ0YsQ0FBQyxDQUFFLENBQUM7Z0JBQ0osUUFBUSxDQUFDLE9BQU8sQ0FBRSxFQUFFLENBQUMsRUFBRTtvQkFDdEIsRUFBRSxDQUFDLFFBQVEsQ0FBRSxTQUFTLENBQUMsWUFBWSxJQUFJLGVBQWUsQ0FBQyxDQUFDLENBQUMsbURBQW1ELENBQUMsQ0FBQyxDQUFDLDhDQUE4QyxDQUFDLENBQUM7Z0JBQ2hLLENBQUMsQ0FBRSxDQUFDO2dCQUNKLGVBQWUsQ0FBRSxLQUFLLENBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDO2FBQzNEO1NBQ0Q7UUFFRCxFQUFFO1FBQ0Ysb0NBQW9DO1FBQ3BDLEVBQUU7UUFDRixJQUFJLGdCQUFnQixHQUFHLENBQUUsQ0FBRSxzQkFBc0IsQ0FBQyxPQUFPLElBQUksRUFBRSxDQUFFO2VBQzdELENBQUUsU0FBUyxDQUFDLFlBQVksSUFBSSxzQkFBc0IsQ0FBQyxxQkFBcUIsR0FBRyxDQUFDLENBQUUsQ0FBRTtZQUNuRixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyw2SUFBNkk7UUFDdkosSUFBSSxVQUFVLEdBQVEsRUFBRSxDQUFDO1FBQ3pCLFNBQVMsWUFBWSxDQUFFLE1BQWE7WUFFbkMsSUFBSyxDQUFDLFVBQVUsQ0FBQyxjQUFjLENBQUUsTUFBTSxDQUFFLEVBQUc7Z0JBQzNDLFVBQVUsQ0FBRSxNQUFNLENBQUUsR0FBRztvQkFDdEIsSUFBSSxFQUFFLENBQUM7b0JBQ1AsSUFBSSxFQUFFLENBQUM7b0JBQ1AsSUFBSSxFQUFFLENBQUM7b0JBQ1AsSUFBSSxFQUFFLENBQUM7aUJBQ1AsQ0FBQzthQUNGO1lBQ0QsT0FBTyxVQUFVLENBQUUsTUFBTSxDQUFFLENBQUM7UUFDN0IsQ0FBQztRQUNELFNBQVMsTUFBTSxDQUFFLEtBQVM7WUFFekIsSUFBSyxLQUFLLENBQUMsSUFBSSxJQUFJLGdCQUFnQixJQUFJLEtBQUssQ0FBQyxJQUFJLElBQUksZ0JBQWdCLEVBQUc7Z0JBQ3ZFLEVBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztnQkFDZCxJQUFLLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxFQUFHO29CQUN0QixLQUFLLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDO29CQUM1QixFQUFHLEtBQUssQ0FBQyxJQUFJLENBQUM7aUJBQ2Q7YUFDRDtpQkFBTTtnQkFDTixFQUFHLEtBQUssQ0FBQyxJQUFJLENBQUM7YUFDZDtRQUNGLENBQUM7UUFDRCxTQUFTLE9BQU8sQ0FBRSxLQUFTO1lBRTFCLElBQUssS0FBSyxDQUFDLElBQUksSUFBSSxnQkFBZ0IsSUFBSSxLQUFLLENBQUMsSUFBSSxJQUFJLGdCQUFnQixFQUFHO2dCQUN2RSxFQUFHLEtBQUssQ0FBQyxJQUFJLENBQUM7Z0JBQ2QsSUFBSyxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsRUFBRztvQkFDdEIsS0FBSyxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQztvQkFDNUIsRUFBRyxLQUFLLENBQUMsSUFBSSxDQUFDO2lCQUNkO2FBQ0Q7aUJBQU07Z0JBQ04sRUFBRyxLQUFLLENBQUMsSUFBSSxDQUFDO2FBQ2Q7UUFDRixDQUFDO1FBRUQsRUFBRTtRQUNGLHNDQUFzQztRQUN0QyxFQUFFO1FBQ0YsdUVBQXVFO1FBQ3ZFLElBQUksTUFBTSxHQUFHLGNBQWMsQ0FBQyxzQkFBc0IsQ0FBRSxTQUFTLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxTQUFTLENBQUUsQ0FBQztRQUNsRyxDQUFDLENBQUMsR0FBRyxDQUFFLDRCQUE0QixHQUFHLE1BQU0sR0FBRyxVQUFVLENBQUUsQ0FBQztRQUM1RCxLQUFNLElBQUksUUFBUSxHQUFVLE1BQU0sRUFBRSxRQUFRLEVBQUcsR0FBRSxDQUFDLEdBQ2xEO1lBQ0MsSUFBSSxJQUFJLEdBQUcsY0FBYyxDQUFDLHNCQUFzQixDQUFFLFNBQVMsQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUUsQ0FBQztZQUMxRyxJQUFJLEtBQUssR0FBRyxZQUFZLENBQUMseUJBQXlCLENBQUUsSUFBSSxFQUFFLENBQUMsQ0FBRSxDQUFDO1lBQzlELElBQUksS0FBSyxHQUFHLFlBQVksQ0FBQyx5QkFBeUIsQ0FBRSxJQUFJLEVBQUUsQ0FBQyxDQUFFLENBQUM7WUFDOUQsSUFBSSxHQUFHLEdBQUcsWUFBWSxDQUFDLGVBQWUsQ0FBRSxJQUFJLENBQUUsQ0FBQztZQUMvQyxJQUFJLHFCQUFxQixHQUFHLENBQUUsQ0FBQyxHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBRSxDQUFDO1lBRWpELElBQUksT0FBTyxHQUFHLENBQUUsQ0FBRSxHQUFHLElBQUksQ0FBQyxDQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFFLENBQUM7WUFDL0MsSUFBSSxPQUFPLEdBQUcsQ0FBRSxLQUFLLEdBQUcsS0FBSyxDQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1lBQ2hELElBQUksS0FBSyxHQUFHLFlBQVksQ0FBRSxPQUFPLENBQUUsQ0FBQztZQUNwQyxJQUFJLE9BQU8sR0FBRyxXQUFXLEdBQUcsS0FBSyxDQUFDLElBQUksR0FBRyxHQUFHLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztZQUUxRCxDQUFDLENBQUMsR0FBRyxDQUFFLEtBQUssR0FBRyxLQUFLLEdBQUcsTUFBTSxHQUFHLEtBQUssR0FBRyxNQUFNLEdBQUcsT0FBTyxHQUFHLFFBQVEsR0FBRyxJQUFJLEdBQUcsT0FBTyxHQUFHLEdBQUcsQ0FBRSxDQUFDO1lBQzdGLElBQUssQ0FBQyxhQUFhLENBQUUsT0FBTyxDQUFFLENBQUMsY0FBYyxDQUFFLE9BQU8sQ0FBRSxFQUFHO2dCQUMxRCxhQUFhLENBQUUsT0FBTyxDQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsYUFBYSxDQUFFLE9BQU8sQ0FBRSxDQUFDLE9BQU8sQ0FBQztnQkFDckUsQ0FBQyxDQUFDLEdBQUcsQ0FBRSw4QkFBOEIsR0FBRyxPQUFPLEdBQUcsS0FBSyxHQUFHLGFBQWEsQ0FBRSxPQUFPLENBQUUsQ0FBQyxPQUFPLEdBQUcsVUFBVSxHQUFHLGFBQWEsQ0FBRSxPQUFPLENBQUUsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFFLENBQUM7Z0JBQ3BKLEVBQUcsYUFBYSxDQUFFLE9BQU8sQ0FBRSxDQUFDLE9BQU8sQ0FBQzthQUNwQztZQUVELElBQUssYUFBYSxDQUFFLE9BQU8sQ0FBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLGFBQWEsQ0FBRSxPQUFPLENBQUUsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUNoRjtnQkFDQyxJQUFJLE1BQU0sR0FBRyxhQUFhLENBQUUsT0FBTyxDQUFFLENBQUMsT0FBTyxDQUFFLGFBQWEsQ0FBRSxPQUFPLENBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBRSxDQUFDO2dCQUNuRixJQUFJLFVBQVUsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO2dCQUM5QixJQUFJLHFCQUFxQixHQUFHLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDMUQsTUFBTSxDQUFDLFNBQVMsSUFBSSxDQUFFLENBQUUsT0FBTyxJQUFJLE9BQU8sQ0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFFLEdBQUcscUJBQXFCLENBQUM7Z0JBQ2hGLE1BQU0sQ0FBQyxZQUFZLElBQUksQ0FBRSxDQUFFLE9BQU8sSUFBSSxPQUFPLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUUsR0FBRyxxQkFBcUIsQ0FBQztnQkFDbEYsTUFBTSxDQUFDLFlBQVksSUFBSSxDQUFFLENBQUUsT0FBTyxJQUFJLE9BQU8sQ0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRSxHQUFHLHFCQUFxQixDQUFDO2dCQUVsRixJQUFJLE9BQU8sR0FBRyxDQUFFLE1BQU0sQ0FBQyxTQUFTLElBQUksQ0FBQyxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBRSxLQUFLLElBQUksT0FBTyxDQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFFO29CQUNoRixDQUFDLENBQUMsQ0FBRSxDQUFFLEtBQUssSUFBSSxPQUFPLENBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUUsQ0FBQztnQkFDM0MsSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDO2dCQUNuQixJQUFJLFdBQVcsR0FBRyxDQUFDLENBQUM7Z0JBQ3BCLElBQUssS0FBSyxDQUFDLElBQUksSUFBSSxnQkFBZ0IsSUFBSSxLQUFLLENBQUMsSUFBSSxJQUFJLGdCQUFnQixFQUFHLEVBQUUsdUNBQXVDO29CQUNoSCxVQUFVLEdBQUcsQ0FBRSxNQUFNLENBQUMsWUFBWSxJQUFJLE1BQU0sQ0FBQyxZQUFZLENBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQztvQkFDeEcsV0FBVyxHQUFHLENBQUUsTUFBTSxDQUFDLFlBQVksR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUM7aUJBQ3hHO3FCQUFNLEVBQUUscUNBQXFDO29CQUM3QyxVQUFVLEdBQUcsWUFBWSxDQUFDLHlCQUF5QixDQUFFLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFFLENBQUM7b0JBQzdFLFdBQVcsR0FBRyxZQUFZLENBQUMseUJBQXlCLENBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQztpQkFDOUU7Z0JBRUQsVUFBVSxDQUFDLFdBQVcsQ0FBRSxtQkFBbUIsRUFBRSxJQUFJLENBQUUsQ0FBQztnQkFDcEQsVUFBVSxDQUFDLFdBQVcsQ0FBRSx1QkFBdUIsRUFBRSxxQkFBcUIsQ0FBRSxDQUFDO2dCQUN4RSxVQUFVLENBQUMscUJBQXFCLENBQUUsd0JBQXdCLENBQWMsQ0FBQyxRQUFRLENBQUUsb0NBQW9DO29CQUN2SCxDQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUUsR0FBRyxNQUFNLENBQUUsQ0FBQztnQkFDdkMsVUFBVSxDQUFDLHFCQUFxQixDQUFFLHdCQUF3QixDQUFjLENBQUMsUUFBUSxDQUFFLG9DQUFvQztvQkFDdkgsQ0FBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFFLEdBQUcsTUFBTSxDQUFFLENBQUM7Z0JBQ3hDLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBRSxlQUFlLEVBQUUsVUFBVSxDQUFFLENBQUM7Z0JBQy9ELFVBQVUsQ0FBQyxvQkFBb0IsQ0FBRSxlQUFlLEVBQUUsV0FBVyxDQUFFLENBQUM7Z0JBQ2hFLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFFLElBQUksQ0FBRSxDQUFDO2dCQUVyQyxJQUFLLHFCQUFxQjtvQkFDekIsVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7YUFDOUI7WUFFRCxJQUFLLENBQUMscUJBQXFCLEVBQzNCO2dCQUNDLE1BQU0sQ0FBRSxZQUFZLENBQUUsT0FBTyxDQUFFLENBQUUsQ0FBQztnQkFDbEMsT0FBTyxDQUFFLFlBQVksQ0FBRSxDQUFFLEtBQUssSUFBSSxPQUFPLENBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUUsQ0FBRSxDQUFDO2FBQ2hFO1NBQ0Q7UUFFRCxpQ0FBaUM7UUFDakMsS0FBTSxJQUFJLE9BQU8sSUFBSSxVQUFVLEVBQUc7WUFDakMsSUFBSyxVQUFVLENBQUUsT0FBTyxDQUFFLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxVQUFVLENBQUUsT0FBTyxDQUFFLENBQUMsSUFBSSxHQUFHLENBQUM7Z0JBQUcsU0FBUyxDQUFDLDZCQUE2QjtZQUMvRyxJQUFJLEtBQUssR0FBRyxZQUFZLEdBQUcsVUFBVSxDQUFFLE9BQU8sQ0FBRSxDQUFDLElBQUksR0FBRyxHQUFHLEdBQUcsVUFBVSxDQUFFLE9BQU8sQ0FBRSxDQUFDLElBQUksQ0FBQztZQUN6RixJQUFJLEdBQUcsR0FBRyxlQUFlLENBQUUsS0FBSyxDQUFFLENBQUMsT0FBTyxFQUFHLENBQUM7WUFDOUMsSUFBSyxHQUFHLElBQUksZUFBZSxDQUFFLEtBQUssQ0FBRSxDQUFDLEtBQUssQ0FBQyxNQUFNO2dCQUFHLFNBQVM7WUFDN0QsZUFBZSxDQUFFLEtBQUssQ0FBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUUsb0NBQW9DLEdBQUcsT0FBTyxHQUFHLE1BQU0sQ0FBRSxDQUFDO1lBQ3hHLElBQUksUUFBUSxHQUFHLGVBQWUsQ0FBRSxLQUFLLENBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDL0QsSUFBSyxRQUFRLElBQUksUUFBUSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUUsaUJBQWlCLENBQUUsRUFDNUQ7Z0JBQ0MsSUFBSSxXQUFXLEdBQUcsUUFBUSxDQUFFLFFBQVEsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFFLGlCQUFpQixDQUFDLE1BQU0sQ0FBRSxDQUFFLENBQUM7Z0JBQ2hGLElBQUksYUFBYSxHQUFHLENBQUUsV0FBVyxJQUFJLENBQUMsSUFBSSxXQUFXLElBQUksQ0FBQyxDQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDcEYsQ0FBRSxXQUFXLElBQUksQ0FBQyxJQUFJLFdBQVcsSUFBSSxDQUFDLENBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO3dCQUNqRSxDQUFFLFdBQVcsSUFBSSxDQUFDLElBQUksV0FBVyxJQUFJLENBQUMsQ0FBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7NEJBQ2pFLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxHQUFHLEVBQUUsV0FBVyxFQUFFLENBQUM7Z0JBQzFDLElBQUksa0JBQWtCLEdBQUcsS0FBSyxDQUFDO2dCQUMvQixLQUFNLElBQUksRUFBRSxHQUFHLGFBQWEsQ0FBQyxLQUFLLEVBQUUsRUFBRSxJQUFJLGFBQWEsQ0FBQyxHQUFHLEVBQUUsRUFBRyxFQUFFLEVBQ2xFO29CQUNDLElBQUksWUFBWSxHQUFHLGNBQWMsQ0FBQyxxQkFBcUIsQ0FBRSxTQUFTLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFFLENBQUM7b0JBQ3pHLElBQUksYUFBYSxHQUFHLGNBQWMsQ0FBQyxVQUFVLENBQUUsWUFBWSxDQUFFLENBQUM7b0JBQzlELElBQUssYUFBYSxLQUFLLE9BQU8sRUFBRzt3QkFDaEMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDO3dCQUMxQixNQUFNO3FCQUNOO2lCQUNEO2dCQUNELFFBQVEsQ0FBQyxXQUFXLENBQUUsMkJBQTJCLEVBQUUsa0JBQWtCLENBQUUsQ0FBQzthQUN4RTtTQUNEO1FBRUQsQ0FBQyxDQUFDLEdBQUcsQ0FBRSw0Q0FBNEMsR0FBRyxNQUFNLEdBQUcsVUFBVSxDQUFFLENBQUM7SUFFN0UsQ0FBQztBQUNGLENBQUMsRUFqdUJTLGdCQUFnQixLQUFoQixnQkFBZ0IsUUFpdUJ6QiJ9