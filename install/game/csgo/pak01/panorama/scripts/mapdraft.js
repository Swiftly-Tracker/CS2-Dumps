"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="avatar.ts" />
var MapDraft;
(function (MapDraft) {
    const _m_cp = $.GetContextPanel();
    let _m_nPhase = 0;
    let _m_hDenyInputToGame = null;
    let _m_isThisPhasePick = false;
    const _m_phaseTitleText = _m_cp.FindChildInLayoutFile('id-map-draft-phase-info');
    const _m_rowsContainer = _m_cp.FindChildInLayoutFile('id-map-draft-phase-rows');
    const _m_rowPhaseName = 'id-map-draft-phase-buttons-container';
    const _m_nT = 2;
    const _m_nCt = 3;
    let _m_msLastSoundTimestamp = (new Date()).getTime();
    function _PlaySoundEffect(strSoundEffect, msThrottleRequired = 0) {
        const msTimestampNow = (new Date()).getTime();
        if (msThrottleRequired && (msThrottleRequired > 0)) {
            if (msTimestampNow - _m_msLastSoundTimestamp < msThrottleRequired)
                return;
        }
        $.DispatchEvent('CSGOPlaySoundEffect', strSoundEffect, 'MOUSE');
        _m_msLastSoundTimestamp = msTimestampNow;
    }
    function _Update() {
        let sGameUiState = GameStateAPI.GetCSGOGameUIStateName();
        let bThisPanelIsVisible = true;
        if (sGameUiState === 'CSGO_GAME_UI_STATE_LOADINGSCREEN' || MatchDraftAPI.GetDraft() !== 'ingame' || MatchDraftAPI.GetIngamePhase() < 1) {
            bThisPanelIsVisible = false;
        }
        _m_cp.visible = bThisPanelIsVisible;
        _m_cp.SetHasClass('map-draft--show', bThisPanelIsVisible);
        let bMouseCaptureActive = _m_hDenyInputToGame ? true : false;
        if (bMouseCaptureActive != bThisPanelIsVisible) {
            if (bThisPanelIsVisible) {
                _m_hDenyInputToGame = UiToolkitAPI.AddDenyInputFlagsToGame(_m_cp, "MapDraft", "ShareMouse");
                _PopulatePlayerList();
            }
            else {
                UiToolkitAPI.ReleaseDenyInputFlagsToGame(_m_hDenyInputToGame);
                _m_hDenyInputToGame = null;
            }
        }
        if (!bThisPanelIsVisible) {
            _m_rowsContainer.RemoveAndDeleteChildren();
            return;
        }
        _m_cp.visible = true;
        _m_cp.SetHasClass('map-draft--show', true);
        if (MatchDraftAPI.GetIngamePhase() != _m_nPhase) {
            _PlaySoundEffect('tab_mainmenu_watch');
        }
        else {
            const ingameTeamToActNow = MatchDraftAPI.GetIngameTeamToActNow();
            if (ingameTeamToActNow && (ingameTeamToActNow == GameStateAPI.GetPlayerTeamNumber(MyPersonaAPI.GetXuid()))) {
                _PlaySoundEffect('UIPanorama.mainmenu_rollover', 400);
            }
        }
        _m_nPhase = MatchDraftAPI.GetIngamePhase();
        if (_m_nPhase > 6) {
            _m_nPhase = 6;
        }
        _HideFinishedPhaseRows();
        _MakeVoteButtons(_UpdateButtonsRow());
        _UpdateActionText();
        _UpdatePhaseProgressBar();
    }
    function _UpdatePhaseProgressBar() {
        const aChildren = _m_cp.FindChildInLayoutFile('id-map-draft-phasebar-container').Children();
        for (let phase of aChildren) {
            const nPhaseBarIndex = parseInt(phase.GetAttributeString('data-phase', ''));
            phase.SetHasClass('map-draft-phasebar--ban', !_m_isThisPhasePick && nPhaseBarIndex === _m_nPhase);
            phase.SetHasClass('map-draft-phasebar--pick', _m_isThisPhasePick && nPhaseBarIndex === _m_nPhase);
            phase.SetHasClass('map-draft-phasebar--pre', nPhaseBarIndex > _m_nPhase);
            phase.SetHasClass('map-draft-phasebar--post', nPhaseBarIndex < _m_nPhase);
            phase.FindChildInLayoutFile('id-map-draft-phase-name').text = $.Localize('#matchdraft_phase_' + nPhaseBarIndex);
            if (nPhaseBarIndex === _m_nPhase) {
                const nTimeRemaining = MatchDraftAPI.GetIngamePhaseSecondsRemaining() || 0;
                phase.FindChildInLayoutFile('id-map-draft-phase-timer').timeleft = nTimeRemaining;
            }
        }
    }
    function _UpdateButtonsRow() {
        let elContainer = _m_rowsContainer.FindChildInLayoutFile(_m_rowPhaseName + _m_nPhase);
        if (!elContainer) {
            elContainer = $.CreatePanel('Panel', _m_rowsContainer, _m_rowPhaseName + _m_nPhase);
            elContainer.AddClass('map-draft-phase-buttons-container');
            elContainer.AddClass('map-draft-phase-buttons-container--show');
            elContainer.Data().phase = _m_nPhase;
        }
        elContainer.SetHasClass('map-draft-phase-buttons-container--show', true);
        elContainer.SetHasClass('map-draft-phase-buttons-container--hide', false);
        elContainer.hittest = true;
        elContainer.hittestchildren = true;
        return elContainer;
    }
    function _HideFinishedPhaseRows() {
        const aRows = _m_rowsContainer.Children();
        for (let row of aRows) {
            if (row.Data().phase !== _m_nPhase) {
                row.RemoveClass('map-draft-phase-buttons-container--show');
                row.AddClass('map-draft-phase-buttons-container--hide');
                row.hittest = false;
                row.hittestchildren = false;
            }
        }
    }
    function _MakeVoteButtons(elContainer) {
        if (_m_nPhase === 1) {
            _m_isThisPhasePick = true;
            const nYourTeam = GameStateAPI.GetPlayerTeamNumber(MyPersonaAPI.GetXuid());
            const nOtherTeam = nYourTeam === _m_nT ? _m_nCt : _m_nT;
            _MakeButton(elContainer, {
                id: 'id-phase-1-btn-ban-first',
                image: 'url("file://{images}/mapdraft/ban_first.png")',
                selectorimg: "file://{images}/mapdraft/green_check.png",
                name: "#matchdraft_vote_ban_first",
                statustext: '#matchdraft_vote_status_pick',
                ispick: _m_isThisPhasePick,
                voteid: nYourTeam
            });
            _MakeButton(elContainer, {
                id: 'id-phase-1-btn-pick-side',
                image: 'url("file://{images}/mapdraft/pick_team.png")',
                selectorimg: "file://{images}/mapdraft/green_check.png",
                name: "#matchdraft_vote_pick_team",
                statustext: '#matchdraft_vote_status_pick',
                ispick: _m_isThisPhasePick,
                voteid: nOtherTeam
            });
        }
        else if (_m_nPhase === 5) {
            _m_isThisPhasePick = true;
            _MakeButton(elContainer, {
                id: 'id-phase-5-btn-start-ct',
                image: 'url("file://{images}/mapdraft/pick_ct.png")',
                selectorimg: "file://{images}/mapdraft/green_check.png",
                name: "#CSGO_Inventory_Team_CT",
                statustext: '#matchdraft_vote_status_pick',
                ispick: _m_isThisPhasePick,
                voteid: _m_nCt
            });
            _MakeLargeMap(elContainer);
            _MakeButton(elContainer, {
                id: 'id-phase-5-btn-start-t',
                image: 'url("file://{images}/mapdraft/pick_t.png")',
                selectorimg: "file://{images}/mapdraft/green_check.png",
                name: "#CSGO_Inventory_Team_T",
                statustext: '#matchdraft_vote_status_pick',
                ispick: _m_isThisPhasePick,
                voteid: _m_nT
            });
        }
        else if (_m_nPhase === 6) {
            _MakeLargeMap(elContainer, 'map-draft-phase-pick-map-image--large');
        }
        else if (_m_nPhase < 5) {
            _m_isThisPhasePick = false;
            const aVoteIds = MatchDraftAPI.GetIngameMapIdsList().split(',');
            for (let i = 0; i < aVoteIds.length; i++) {
                const nVoteId = parseInt(aVoteIds[i]);
                const mapName = DeepStatsAPI.MapIDToString(nVoteId);
                if (_m_nPhase !== 4 ||
                    (_m_nPhase === 4 && MatchDraftAPI.GetIngameTeamToActNow() !== GameStateAPI.GetPlayerTeamNumber(MyPersonaAPI.GetXuid())) ||
                    (_m_nPhase === 4 && MatchDraftAPI.GetIngameTeamToActNow() === GameStateAPI.GetPlayerTeamNumber(MyPersonaAPI.GetXuid()) &&
                        MatchDraftAPI.GetIngameMapIdState(nVoteId) !== 'veto')) {
                    _MakeButton(elContainer, {
                        id: 'id-phase-' + _m_nPhase + '-btn-' + aVoteIds[i],
                        image: 'url("file://{images}/map_icons/screenshots/360p/' + mapName + '.png")',
                        selectorimg: "file://{images}/mapdraft/red_x.png",
                        name: '#SFUI_Map_' + mapName,
                        statustext: '#matchdraft_vote_status_ban',
                        ispick: _m_isThisPhasePick,
                        mapstatus: MatchDraftAPI.GetIngameMapIdState(nVoteId),
                        voteid: nVoteId
                    });
                }
            }
        }
    }
    function _MakeButton(elContainer, oBtnData) {
        let elButton = elContainer.FindChildInLayoutFile(oBtnData.id);
        if (!elButton) {
            elButton = $.CreatePanel('Button', elContainer, oBtnData.id);
            elButton.BLoadLayoutSnippet('ButtonMapTile');
            const bgImage = elButton.FindChildInLayoutFile('draft-phase-button-image');
            bgImage.style.backgroundImage = oBtnData.image;
            bgImage.style.backgroundPosition = '50% 0%';
            bgImage.style.backgroundSize = 'auto 100%';
            elButton.FindChildInLayoutFile('draft-phase-button-selectorimg').SetImage(oBtnData.selectorimg);
            elButton.SetDialogVariable('mapname', $.Localize(oBtnData.name));
            const elStatusText = elButton.FindChildInLayoutFile('draft-phase-button-statustext');
            elStatusText.text = $.Localize(oBtnData.statustext);
            elButton.SetPanelEvent('onactivate', () => _OnActivateVoteTile(elContainer, oBtnData));
            elButton.SetPanelEvent('onmouseover', () => {
                if (elButton.enabled) {
                    _PlaySoundEffect('UIPanorama.mainmenu_rollover');
                }
            });
            elButton.Data().voteid = oBtnData.voteid;
        }
        elButton.SetHasClass('map-draft-phase-button__status--positive', oBtnData.ispick);
        elButton.enabled = true;
        if (MatchDraftAPI.GetIngameTeamToActNow() !== GameStateAPI.GetPlayerTeamNumber(MyPersonaAPI.GetXuid()) ||
            oBtnData.hasOwnProperty('mapstatus') && oBtnData.mapstatus === 'veto') {
            elButton.SetHasClass('map-draft-phase-button--vetoed', oBtnData.mapstatus === 'veto');
            elButton.enabled = false;
            return;
        }
        const aVotedXuids = MatchDraftAPI.GetIngameXuidsForVote(Number(oBtnData.voteid)).split(',');
        elButton.SetHasClass('map-draft-phase-button--selected', aVotedXuids.indexOf(MyPersonaAPI.GetXuid()) !== -1);
        if (MatchDraftAPI.GetIngameXuidsForVote(Number(oBtnData.voteid))) {
            const aVoteIds = MatchDraftAPI.GetIngameWinningVotes().split(',');
            elButton.SetHasClass('map-draft-phase-button--winning-vote', aVoteIds.indexOf(oBtnData.voteid.toString()) !== -1);
        }
        else {
            elButton.SetHasClass('map-draft-phase-button--winning-vote', false);
        }
        const elAvatarsContainer = elButton.FindChildInLayoutFile('id-map-draft-phase-avatars-container');
        elAvatarsContainer.RemoveAndDeleteChildren();
        for (let i = 0; i < aVotedXuids.length; i++) {
            _MakeAvatar(aVotedXuids[i], elAvatarsContainer);
        }
    }
    function _OnActivateVoteTile(elContainer, oBtnData) {
        const aCurrentVotes = _GetCurrentVotes();
        const matchingVoteSlot = aCurrentVotes.indexOf(oBtnData.voteid);
        if (matchingVoteSlot !== -1) {
            MatchDraftAPI.ActionIngameCastMyVote(_m_nPhase, matchingVoteSlot, 0);
            _PlaySoundEffect('buymenu_select');
            return;
        }
        const aBtns = elContainer.Children().filter(btn => btn.Data().voteid);
        if (aBtns.length < 3) {
            MatchDraftAPI.ActionIngameCastMyVote(_m_nPhase, 0, oBtnData.voteid);
            _PlaySoundEffect('buymenu_purchase');
            return;
        }
        const freeSlot = _GetFirstFreeVoteSlot(aCurrentVotes);
        if (freeSlot !== null) {
            MatchDraftAPI.ActionIngameCastMyVote(_m_nPhase, freeSlot, oBtnData.voteid);
            _PlaySoundEffect('buymenu_purchase');
        }
        else {
            for (let btn of aBtns) {
                if (btn.BHasClass('map-draft-phase-button--selected')) {
                    btn.RemoveClass('map-draft-phase-button--pulse');
                    btn.AddClass('map-draft-phase-button--pulse');
                }
            }
            _PlaySoundEffect('buymenu_failure');
        }
    }
    function _GetCurrentVotes() {
        const aCurrentVotes = [];
        for (let i = 0; i < _GetNumVoteSlots(); i++) {
            const voteId = MatchDraftAPI.GetIngameMyVoteInSlot(i) || "empty";
            aCurrentVotes.push(voteId);
        }
        return aCurrentVotes;
    }
    function _GetFirstFreeVoteSlot(aCurrentVotes) {
        for (let i = 0; i < aCurrentVotes.length; i++) {
            if (aCurrentVotes[i] === 'empty') {
                return i;
            }
        }
        return null;
    }
    function _GetNumVoteSlots() {
        if (_m_nPhase === 1 || _m_nPhase === 5) {
            return 1;
        }
        if (_m_nPhase === 2) {
            return 2;
        }
        if (_m_nPhase === 3) {
            return 3;
        }
        if (_m_nPhase === 4) {
            return 1;
        }
        return 0.;
    }
    function _UpdateActionText() {
        const isWaiting = MatchDraftAPI.GetIngameTeamToActNow() !== GameStateAPI.GetPlayerTeamNumber(MyPersonaAPI.GetXuid());
        _m_cp.FindChildInLayoutFile('id-map-draft-phase-info').SetHasClass('map-draft-phase-info--hidden', isWaiting);
        _m_cp.FindChildInLayoutFile('id-map-draft-phase-waiting').SetHasClass('map-draft-phase-info--hidden', !isWaiting);
        if (isWaiting) {
            _m_cp.FindChildInLayoutFile('id-map-draft-phase-wait').text = $.Localize('#matchdraft_phase_action_wait_' + _m_nPhase);
            return;
        }
        const elContainer = _m_rowsContainer.FindChildInLayoutFile(_m_rowPhaseName + _m_nPhase);
        const nPickedMaps = elContainer.Children().filter(btn => btn.BHasClass('map-draft-phase-button--selected'));
        _m_cp.SetDialogVariableInt('maps', nPickedMaps.length);
        _m_phaseTitleText.text = $.Localize('#matchdraft_phase_action_' + _m_nPhase, _m_cp);
    }
    function _MakeLargeMap(elContainer, style) {
        const aMapIds = MatchDraftAPI.GetIngameMapIdsList().split(',');
        const mapPickId = aMapIds.filter(id => MatchDraftAPI.GetIngameMapIdState(parseInt(id)) === 'pick')[0];
        const mapName = DeepStatsAPI.MapIDToString(parseInt(mapPickId));
        let elMapImage = elContainer.FindChildInLayoutFile('id-map-draft-phase-pick-map-image');
        if (!elMapImage) {
            elMapImage = $.CreatePanel('Panel', elContainer, 'id-map-draft-phase-pick-map-image');
            elMapImage.BLoadLayoutSnippet('FinalMapPick');
        }
        elMapImage.SetDialogVariable('mapname', $.Localize('#SFUI_Map_' + mapName));
        elMapImage.style.backgroundImage = 'url("file://{images}/map_icons/screenshots/360p/' + mapName + '.png")';
        elMapImage.style.backgroundPosition = '50% 0%';
        elMapImage.style.backgroundSize = 'auto 100%';
        elMapImage.style.backgroundImgOpacity = '.5';
        if (style) {
            elMapImage.AddClass(style);
            const nYourTeam = GameStateAPI.GetPlayerTeamNumber(MyPersonaAPI.GetXuid());
            const nOtherTeam = nYourTeam === _m_nT ? _m_nCt : _m_nT;
            const nStartingTeam = (MatchDraftAPI.GetIngameTeamWithFirstChoice() === MatchDraftAPI.GetIngameTeamStartingCT())
                ? nOtherTeam : nYourTeam;
            const teamLogo = nStartingTeam === _m_nT ? 't_logo.svg' : 'ct_logo.svg';
            const startingTeam = nStartingTeam === _m_nT ? '#CSGO_Inventory_Team_T' : '#CSGO_Inventory_Team_CT';
            elContainer.FindChildInLayoutFile('id-map-draft-starting-team').visible = true;
            elContainer.FindChildInLayoutFile('id-map-draft-starting-team-icon').SetImage("file://{images}/icons/" + teamLogo);
            elContainer.SetDialogVariable('teamname', $.Localize(startingTeam));
        }
    }
    function _PopulatePlayerList() {
        const yourXuid = MyPersonaAPI.GetXuid();
        const oPlayerData = GameStateAPI.GetPlayerDataJSO();
        const teamNames = ['TERRORIST', 'CT'];
        let iYourXuidTeamIdx = 1;
        for (let iTeam = 0; iTeam < teamNames.length; ++iTeam) {
            const teamName = teamNames[iTeam];
            const teamIndex = oPlayerData.teams.findIndex(t => t.name === teamName);
            if (iTeam === 0 && oPlayerData.players.find(p => p.team === teamIndex)) {
                iYourXuidTeamIdx = 0;
            }
            const teamPanelId = (iYourXuidTeamIdx === iTeam) ? 'id-map-draft-phase-your-team' : 'id-map-draft-phase-other-team';
            const elTeammates = _m_cp.FindChildInLayoutFile(teamPanelId).FindChild('id-map-draft-phase-avatars');
            elTeammates.RemoveAndDeleteChildren();
            for (const p of oPlayerData.players) {
                if (p.team == teamIndex) {
                    const xuid = p.xuid;
                    if (!GameStateAPI.IsFakePlayer(xuid)) {
                        _MakeAvatar(xuid, elTeammates, true);
                    }
                }
            }
        }
    }
    function _MakeAvatar(xuid, elTeammates, bisTeamLister = false) {
        if (xuid === "0")
            return;
        if (xuid) {
            let elAvatar = elTeammates.FindChildInLayoutFile(xuid);
            const panelType = bisTeamLister ? 'Button' : 'Panel';
            if (!elAvatar || elAvatar.BHasClass('hidden')) {
                elAvatar = $.CreatePanel(panelType, elTeammates, xuid);
                elAvatar.BLoadLayoutSnippet('SmallAvatar');
                if (bisTeamLister) {
                    _AddOpenPlayerCardAction(elAvatar, xuid);
                }
            }
            elAvatar.FindChildTraverse('JsAvatarImage').PopulateFromSteamID(xuid);
            const teamColor = GameStateAPI.GetPlayerColor(xuid);
            const elTeamColor = elAvatar.FindChildInLayoutFile('JsAvatarTeamColor');
            if (!teamColor) {
                elTeamColor.visible = false;
            }
            else {
                elTeamColor.visible = true;
                elTeamColor.style.washColor = teamColor;
            }
            elAvatar.SetDialogVariable('teammate_name', FriendsListAPI.GetFriendName(xuid));
        }
    }
    function _AddOpenPlayerCardAction(elAvatar, xuid) {
        elAvatar.SetPanelEvent("onactivate", () => {
            $.DispatchEvent('SidebarContextMenuActive', true);
            if (xuid !== "0") {
                const contextMenuPanel = UiToolkitAPI.ShowCustomLayoutContextMenuParametersDismissEvent('', '', 'file://{resources}/layout/context_menus/context_menu_playercard.xml', 'xuid=' + xuid, () => $.DispatchEvent('SidebarContextMenuActive', false));
                contextMenuPanel.AddClass("ContextMenu_NoArrow");
            }
        });
    }
    const m_eventHandles = [];
    function _OnReadyForDisplay() {
        m_eventHandles.push(['PanoramaComponent_IngameDraft_DraftUpdate', $.RegisterForUnhandledEvent('PanoramaComponent_IngameDraft_DraftUpdate', _Update)]);
        m_eventHandles.push(['UnloadLoadingScreenAndReinit', $.RegisterForUnhandledEvent('UnloadLoadingScreenAndReinit', _Update)]);
        m_eventHandles.push(['PlayerTeamChanged', $.RegisterForUnhandledEvent('PlayerTeamChanged', _PopulatePlayerList)]);
    }
    function _OnUnreadyForDisplay() {
        while (m_eventHandles.length > 0) {
            const h = m_eventHandles.pop();
            $.UnregisterForUnhandledEvent(h[0], h[1]);
        }
    }
    {
        $.RegisterEventHandler('ReadyForDisplay', $.GetContextPanel(), _OnReadyForDisplay);
        $.RegisterEventHandler('UnreadyForDisplay', $.GetContextPanel(), _OnUnreadyForDisplay);
    }
})(MapDraft || (MapDraft = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwZHJhZnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9tYXBkcmFmdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBQ2xDLGtDQUFrQztBQUVsQyxJQUFVLFFBQVEsQ0F3bkJqQjtBQXhuQkQsV0FBVSxRQUFRO0lBRWpCLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztJQUNsQyxJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUM7SUFDbEIsSUFBSSxtQkFBbUIsR0FBa0IsSUFBSSxDQUFDO0lBQzlDLElBQUksa0JBQWtCLEdBQUcsS0FBSyxDQUFDO0lBQy9CLE1BQU0saUJBQWlCLEdBQUcsS0FBSyxDQUFDLHFCQUFxQixDQUFFLHlCQUF5QixDQUFhLENBQUM7SUFDOUYsTUFBTSxnQkFBZ0IsR0FBRyxLQUFLLENBQUMscUJBQXFCLENBQUUseUJBQXlCLENBQUUsQ0FBQztJQUNsRixNQUFNLGVBQWUsR0FBRyxzQ0FBc0MsQ0FBQztJQUkvRCxNQUFNLEtBQUssR0FBRyxDQUFDLENBQUM7SUFDaEIsTUFBTSxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBRWpCLElBQUksdUJBQXVCLEdBQUcsQ0FBRSxJQUFJLElBQUksRUFBRSxDQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDdkQsU0FBUyxnQkFBZ0IsQ0FBRyxjQUFzQixFQUFFLHFCQUE2QixDQUFDO1FBRWpGLE1BQU0sY0FBYyxHQUFHLENBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBRSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2hELElBQUssa0JBQWtCLElBQUksQ0FBRSxrQkFBa0IsR0FBRyxDQUFDLENBQUUsRUFDckQ7WUFDQyxJQUFLLGNBQWMsR0FBRyx1QkFBdUIsR0FBRyxrQkFBa0I7Z0JBQ2pFLE9BQU87U0FDUjtRQUVELENBQUMsQ0FBQyxhQUFhLENBQUUscUJBQXFCLEVBQUUs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