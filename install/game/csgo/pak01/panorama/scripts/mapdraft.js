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
    //#define TEAM_TERRORIST	2
    //#define TEAM_CT			3
    const _m_nT = 2;
    const _m_nCt = 3;
    let _m_msLastSoundTimestamp = (new Date()).getTime();
    function _PlaySoundEffect(strSoundEffect, msThrottleRequired = 0) {
        const msTimestampNow = (new Date()).getTime();
        if (msThrottleRequired && (msThrottleRequired > 0)) {
            if (msTimestampNow - _m_msLastSoundTimestamp < msThrottleRequired)
                return; // do not play this sound, throttle is required and we need to wait it out
        }
        $.DispatchEvent('CSGOPlaySoundEffect', strSoundEffect, 'MOUSE');
        _m_msLastSoundTimestamp = msTimestampNow;
    }
    function _Update() {
        let sGameUiState = GameStateAPI.GetCSGOGameUIStateName();
        $.Msg('GameStateAPI.GetCSGOGameUIStateName(): ' + sGameUiState);
        $.Msg('MatchDraftAPI.GetDraft(): ' + MatchDraftAPI.GetDraft());
        $.Msg('MatchDraftAPI.GetIngamePhase(): ' + MatchDraftAPI.GetIngamePhase());
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
        //Show the panel
        _m_cp.visible = true;
        _m_cp.SetHasClass('map-draft--show', true);
        //
        // Custom rules for when to play a "click" sound
        // ... we don't want enemy selections to spam it, we don't want our teammates
        // to spam it ... basically just play it only when the phase changes
        //
        if (MatchDraftAPI.GetIngamePhase() != _m_nPhase) { // phase changed, play a gong hit sound
            _PlaySoundEffect('tab_mainmenu_watch');
        }
        else { // other players voted, play a subtle click but no more frequently than once a second
            // if it's my team's turn to act and teammates are voting
            const ingameTeamToActNow = MatchDraftAPI.GetIngameTeamToActNow();
            if (ingameTeamToActNow && (ingameTeamToActNow == GameStateAPI.GetPlayerTeamNumber(MyPersonaAPI.GetXuid()))) {
                _PlaySoundEffect('UIPanorama.mainmenu_rollover', 400);
            }
        }
        //Update the Phase
        _m_nPhase = MatchDraftAPI.GetIngamePhase();
        $.Msg('_m_nPhase: ' + _m_nPhase);
        if (_m_nPhase > 6) { // Clamp the phase to 6 = "start match"
            _m_nPhase = 6;
        }
        // Hide old Phase btns if we have a new phase
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
        // Find this phase's container
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
            // Ban first or pick team later
            _m_isThisPhasePick = true;
            // Your team need to be in the slot to ban first
            // You are actually voting for your team to ban first or other team to pick team later
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
            // Pick Starting side
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
            // Map Vetos
            _m_isThisPhasePick = false;
            const aVoteIds = MatchDraftAPI.GetIngameMapIdsList().split(',');
            for (let i = 0; i < aVoteIds.length; i++) {
                const nVoteId = parseInt(aVoteIds[i]);
                const mapName = DeepStatsAPI.MapIDToString(nVoteId);
                // Skip making maps in the final ban phase that have already been vetoed
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
        // Not your turn to vote or the map is already vetoed.
        if (MatchDraftAPI.GetIngameTeamToActNow() !== GameStateAPI.GetPlayerTeamNumber(MyPersonaAPI.GetXuid()) ||
            oBtnData.hasOwnProperty('mapstatus') && oBtnData.mapstatus === 'veto') {
            elButton.SetHasClass('map-draft-phase-button--vetoed', oBtnData.mapstatus === 'veto');
            elButton.enabled = false;
            return;
        }
        // Who voted for this from my team.
        const aVotedXuids = MatchDraftAPI.GetIngameXuidsForVote(Number(oBtnData.voteid)).split(',');
        elButton.SetHasClass('map-draft-phase-button--selected', aVotedXuids.indexOf(MyPersonaAPI.GetXuid()) !== -1);
        // Is this tile winning the vote.
        if (MatchDraftAPI.GetIngameXuidsForVote(Number(oBtnData.voteid))) {
            const aVoteIds = MatchDraftAPI.GetIngameWinningVotes().split(',');
            elButton.SetHasClass('map-draft-phase-button--winning-vote', aVoteIds.indexOf(oBtnData.voteid.toString()) !== -1);
        }
        else {
            elButton.SetHasClass('map-draft-phase-button--winning-vote', false);
        }
        // Fill out avatars that voted.
        const elAvatarsContainer = elButton.FindChildInLayoutFile('id-map-draft-phase-avatars-container');
        elAvatarsContainer.RemoveAndDeleteChildren();
        for (let i = 0; i < aVotedXuids.length; i++) {
            _MakeAvatar(aVotedXuids[i], elAvatarsContainer);
        }
    }
    function _OnActivateVoteTile(elContainer, oBtnData) {
        const aCurrentVotes = _GetCurrentVotes();
        // You are trying to unselect an already selected btn and you already selected.
        const matchingVoteSlot = aCurrentVotes.indexOf(oBtnData.voteid);
        if (matchingVoteSlot !== -1) {
            $.Msg("Vote Remove, Phase: " + _m_nPhase + " slot: " + matchingVoteSlot + "voteid" + 0);
            MatchDraftAPI.ActionIngameCastMyVote(_m_nPhase, matchingVoteSlot, 0);
            _PlaySoundEffect('buymenu_select');
            return;
        }
        // Filter out panels that are not vote btns.
        const aBtns = elContainer.Children().filter(btn => btn.Data().voteid);
        // If you are on pick that only has 2 options. Unselect the selected option and set this one.
        if (aBtns.length < 3) {
            MatchDraftAPI.ActionIngameCastMyVote(_m_nPhase, 0, oBtnData.voteid);
            _PlaySoundEffect('buymenu_purchase');
            return;
        }
        // Let you vote if you are allowed.
        const freeSlot = _GetFirstFreeVoteSlot(aCurrentVotes);
        if (freeSlot !== null) {
            $.Msg("Vote Sent, Phase: " + _m_nPhase + " slot: " + freeSlot + " voteid: " + oBtnData.voteid);
            MatchDraftAPI.ActionIngameCastMyVote(_m_nPhase, freeSlot, oBtnData.voteid);
            _PlaySoundEffect('buymenu_purchase');
        }
        else {
            // Show already selected btns
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
            $.Msg("voteId: " + voteId);
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
        // Buttons update before this so we can count how many buttons are selected for this phase
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
            // If you Banned fist then other team pick the starting side
            // If they picked the same side as you then you will start as the opposite team.
            const nStartingTeam = (MatchDraftAPI.GetIngameTeamWithFirstChoice() === MatchDraftAPI.GetIngameTeamStartingCT())
                ? nOtherTeam : nYourTeam;
            $.Msg("nStartingTeam " + nStartingTeam);
            const teamLogo = nStartingTeam === _m_nT ? 't_logo.svg' : 'ct_logo.svg';
            const startingTeam = nStartingTeam === _m_nT ? '#CSGO_Inventory_Team_T' : '#CSGO_Inventory_Team_CT';
            elContainer.FindChildInLayoutFile('id-map-draft-starting-team').visible = true;
            elContainer.FindChildInLayoutFile('id-map-draft-starting-team-icon').SetImage("file://{images}/icons/" + teamLogo);
            elContainer.SetDialogVariable('teamname', $.Localize(startingTeam));
        }
    }
    function _PopulatePlayerList() {
        const yourXuid = MyPersonaAPI.GetXuid();
        // when spectator/hltv, account for yourXuid not being on any team
        $.Msg('_PopulatePlayerList');
        // Get player on server
        const oPlayerData = GameStateAPI.GetPlayerDataJSO();
        // Go through each team we care about and update the players
        const teamNames = ['TERRORIST', 'CT'];
        let iYourXuidTeamIdx = 1;
        for (let iTeam = 0; iTeam < teamNames.length; ++iTeam) {
            const teamName = teamNames[iTeam];
            const teamIndex = oPlayerData.teams.findIndex(t => t.name === teamName);
            if (iTeam === 0 && oPlayerData.players.find(p => p.team === teamIndex)) { // check first team whether it contains your player? if yes => you are team0; else => you are team1
                iYourXuidTeamIdx = 0;
            }
            // check if you are in the player list and assing the correct list.
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
            $.Msg('teamColor: ' + teamColor);
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
            // Tell the sidebar to stay open and ignore its on mouse event while the context menu is open
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
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        $.RegisterEventHandler('ReadyForDisplay', $.GetContextPanel(), _OnReadyForDisplay);
        $.RegisterEventHandler('UnreadyForDisplay', $.GetContextPanel(), _OnUnreadyForDisplay);
    }
})(MapDraft || (MapDraft = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwZHJhZnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9tYXBkcmFmdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBQ2xDLGtDQUFrQztBQUVsQyxJQUFVLFFBQVEsQ0F3bkJqQjtBQXhuQkQsV0FBVSxRQUFRO0lBRWpCLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztJQUNsQyxJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUM7SUFDbEIsSUFBSSxtQkFBbUIsR0FBa0IsSUFBSSxDQUFDO0lBQzlDLElBQUksa0JBQWtCLEdBQUcsS0FBSyxDQUFDO0lBQy9CLE1BQU0saUJBQWlCLEdBQUcsS0FBSyxDQUFDLHFCQUFxQixDQUFFLHlCQUF5QixDQUFhLENBQUM7SUFDOUYsTUFBTSxnQkFBZ0IsR0FBRyxLQUFLLENBQUMscUJBQXFCLENBQUUseUJBQXlCLENBQUUsQ0FBQztJQUNsRixNQUFNLGVBQWUsR0FBRyxzQ0FBc0MsQ0FBQztJQUUvRCwwQkFBMEI7SUFDMUIscUJBQXFCO0lBQ3JCLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQztJQUNoQixNQUFNLE1BQU0sR0FBRyxDQUFDLENBQUM7SUFFakIsSUFBSSx1QkFBdUIsR0FBRyxDQUFFLElBQUksSUFBSSxFQUFFLENBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUN2RCxTQUFTLGdCQUFnQixDQUFHLGNBQXNCLEVBQUUscUJBQTZCLENBQUM7UUFFakYsTUFBTSxjQUFjLEdBQUcsQ0FBRSxJQUFJLElBQUksRUFBRSxDQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDaEQsSUFBSyxrQkFBa0IsSUFBSSxDQUFFLGtCQUFrQixHQUFHLENBQUMsQ0FBRSxFQUNyRDtZQUNDLElBQUssY0FBYyxHQUFHLHVCQUF1QixHQUFHLGtCQUFrQjtnQkFDakUsT0FBTyxDQUFDLDBFQUEwRTtTQUNu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