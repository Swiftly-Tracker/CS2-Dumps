"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../util_gamemodeflags.ts" />
/// <reference path="../common/formattext.ts" />
/// <reference path="../common/sessionutil.ts" />
/// <reference path="../common/teamcolor.ts" />
/// <reference path="../common/iteminfo.ts" />
/// <reference path="../rating_emblem.ts" />
/// <reference path="../avatar.ts" />
var PremierPickBan;
(function (PremierPickBan) {
    let _m_nPhase = 0;
    // Handles for the global unhandled-event registrations so we register them at most once
    // and can unregister them when this popup is torn down (see _OnUnreadyForDisplay).
    let _m_draftUpdateHandler = null;
    let _m_playerActivityVoiceHandler = null;
    const k_EMapVetoPickPhase_BeginDraftType1 = 0;
    const k_EMapVetoPickPhase_DecideWhoGoesFirst = 1;
    const k_EMapVetoPickPhase_PickFirstOfTwoMaps = 2;
    const k_EMapVetoPickPhase_PickBothOtherMaps = 3;
    const k_EMapVetoPickPhase_PickLastOfTwoMaps = 4;
    const k_EMapVetoPickPhase_SelectingMap = 5;
    const k_EMapVetoPickPhase_PickStartingSide = 6;
    const k_EMapVetoPickPhase_EndDraftType1 = 7;
    const TEAM_TERRORIST = 2;
    const TEAM_CT = 3;
    const _m_aTeams = ['3', '2'];
    const _m_elPickBanPanel = $.GetContextPanel().FindChildInLayoutFile('id-premier-pick-ban');
    function Init() {
        if (!_m_draftUpdateHandler) {
            _m_draftUpdateHandler = $.RegisterForUnhandledEvent('PanoramaComponent_PregameDraft_DraftUpdate', OnDraftUpdate);
        }
        if (!_m_playerActivityVoiceHandler) {
            _m_playerActivityVoiceHandler = $.RegisterForUnhandledEvent("PanoramaComponent_PartyList_PlayerActivityVoice", PlayerActivityVoice);
        }
        SetDefaultTimerValue();
        Show();
        OnDraftUpdate();
        UpdateActivePhaseTimerAndBar();
        const spiderGraph = _m_elPickBanPanel.FindChildInLayoutFile("id-team-vote-spider-graph");
        if (spiderGraph.BCanvasReady()) {
            DrawSpiderGraph();
        }
        else {
            $.RegisterEventHandler("CanvasReady", spiderGraph, DrawSpiderGraph);
        }
        let reflection = _m_elPickBanPanel.FindChildInLayoutFile('id-team-vote-reflection');
        $.Schedule(1.1, () => reflection.SetImageFromPanel(_m_elPickBanPanel.FindChildInLayoutFile('id-team-vote-phasebar-container'), false));
    }
    PremierPickBan.Init = Init;
    function Show() {
        _m_elPickBanPanel.SetHasClass('show', true);
    }
    function SetDefaultTimerValue() {
        let aChildren = _m_elPickBanPanel.FindChildInLayoutFile('id-team-vote-phasebar-container').Children();
        for (let phase of aChildren) {
            phase.SetDialogVariable('section-time', '');
        }
    }
    function OnDraftUpdate() {
        let bNewPhase = _m_nPhase !== MatchDraftAPI.GetPregamePhase();
        PlayNewPhaseSound(bNewPhase);
        _m_nPhase = MatchDraftAPI.GetPregamePhase();
        let mapIdsList = MatchDraftAPI.GetPregameMapIdsList().split(',');
        let mapName2Id = new Map();
        mapIdsList.forEach(x => mapName2Id.set(DeepStatsAPI.MapIDToString(parseInt(x)), x));
        let mapNames = Object.keys(FriendsListAPI.GetFriendCompetitivePremierWindowStatsObject("0")); // string[] = [ "de_cache", "de_anubis", ... ]
        let mapIds = [];
        mapNames.forEach(x => mapIds.push(mapName2Id.get(x)));
        if (mapIds.filter(x => !x).length > 0) {
            $.Msg("WARNING: falling back to server map list, failed to resolve Premier maps client-side");
            mapIds = mapIdsList; // fall back to server-supplied list if we failed to resolve all premier maps client-side to IDs
        }
        _m_elPickBanPanel.SwitchClass('pick-ban-phase', 'premier-pickban-phase-' + _m_nPhase);
        let btnMapSettings = {
            isTeam: false,
            list: mapIds,
            btnId: 'id-map-vote-btn-'
        };
        UpdateVoteBtns(btnMapSettings, bNewPhase);
        let btnSettings = {
            isTeam: true,
            list: _m_aTeams,
            btnId: 'id-team-vote-btn-'
        };
        UpdateVoteBtns(btnSettings, bNewPhase);
        UpdateTeamPanelBackground();
        UpdatePhaseProgressBar();
        UpdateTitleText(bNewPhase);
        SetBackgroundColor();
        PlayerTeam();
    }
    function SetBackgroundColor() {
        let elPanel = _m_elPickBanPanel.FindChildInLayoutFile('id-team-vote-middle');
        if (_m_nPhase <= k_EMapVetoPickPhase_DecideWhoGoesFirst) {
            elPanel.SwitchClass('bg-fade', 'premier-pickban__middle--neutral');
            return;
        }
        if (MatchDraftAPI.GetPregameTeamToActNow() === MatchDraftAPI.GetPregameMyTeam()) {
            elPanel.SwitchClass('bg-fade', 'premier-pickban__middle--light');
        }
        else {
            elPanel.SwitchClass('bg-fade', 'premier-pickban__middle--dark');
        }
    }
    function PlayNewPhaseSound(bNewPhase) {
        if (bNewPhase && _m_nPhase > k_EMapVetoPickPhase_BeginDraftType1 && _m_nPhase < k_EMapVetoPickPhase_SelectingMap) {
            $.DispatchEvent('CSGOPlaySoundEffectMuteBypass', 'UI.Premier.MapsLocked', 'MOUSE', 1.0);
        }
        else if (bNewPhase && _m_nPhase >= k_EMapVetoPickPhase_SelectingMap) {
            $.DispatchEvent('CSGOPlaySoundEffectMuteBypass', 'UI.Premier.SubmenuTransition', 'MOUSE', 1.0);
        }
    }
    function PhaseStringSuffix(nPhaseBarIndex) {
        return ''
            + ((nPhaseBarIndex <= k_EMapVetoPickPhase_SelectingMap) ? (nPhaseBarIndex) : (nPhaseBarIndex - 1))
            + (((nPhaseBarIndex > k_EMapVetoPickPhase_DecideWhoGoesFirst && nPhaseBarIndex <= k_EMapVetoPickPhase_SelectingMap)
                || (nPhaseBarIndex == k_EMapVetoPickPhase_BeginDraftType1)) ? '_v2' : '');
    }
    function UpdatePhaseProgressBar() {
        let aChildren = _m_elPickBanPanel.FindChildInLayoutFile('id-team-vote-phasebar-container').Children();
        for (let phase of aChildren) {
            const nPhaseBarIndex = parseInt(phase.GetAttributeString('data-phase', ''));
            phase.SetDialogVariable('section-label', $.Localize('#matchdraft_phase_' + PhaseStringSuffix(nPhaseBarIndex)));
            phase.SetHasClass('premier-pickban__progress--ban', IsBanPhase() && nPhaseBarIndex === _m_nPhase);
            phase.SetHasClass('premier-pickban__progress--pick', !IsBanPhase() && nPhaseBarIndex === _m_nPhase);
            phase.SetHasClass('premier-pickban__progress--pre', nPhaseBarIndex > _m_nPhase);
            phase.SetHasClass('premier-pickban__progress--post', nPhaseBarIndex < _m_nPhase);
        }
    }
    function IsBanPhase() {
        return false; // post-2026 : we always "pick maps", and "pick side"
        // return _m_nPhase > 1 && _m_nPhase < 5;
    }
    function UpdateActivePhaseTimerAndBar() {
        let nPlaySound = 0;
        $.Schedule(.5, () => {
            let elBarContainer = _m_elPickBanPanel.FindChildInLayoutFile('id-team-vote-phasebar-' + _m_nPhase);
            if (elBarContainer) {
                let nTimeRemaining = MatchDraftAPI.GetPregamePhaseSecondsRemaining();
                nTimeRemaining = nTimeRemaining ? nTimeRemaining : 0;
                elBarContainer.SetDialogVariable('section-time', nTimeRemaining.toString());
                let percentComplete = 100 - Math.floor((nTimeRemaining / GetMaxTimeForPhase()) * 100);
                elBarContainer.FindChildInLayoutFile('id-team-phase-bar-inner').style.width = percentComplete + '%';
                if (nTimeRemaining < 5 && nPlaySound === 0) {
                    $.DispatchEvent('CSGOPlaySoundEffectMuteBypass', 'UI.Premier.CounterTimer', 'MOUSE', 1.0);
                    nPlaySound++;
                }
                else if (nPlaySound > 0) {
                    nPlaySound = 0;
                }
            }
            UpdateActivePhaseTimerAndBar();
        });
    }
    ;
    function GetMaxTimeForPhase() {
        let timeMax = 0;
        switch (_m_nPhase) {
            case k_EMapVetoPickPhase_PickFirstOfTwoMaps:
                timeMax = 15;
                break;
            case k_EMapVetoPickPhase_PickBothOtherMaps:
                timeMax = 15;
                break;
            case k_EMapVetoPickPhase_PickLastOfTwoMaps:
                timeMax = 10;
                break;
            case k_EMapVetoPickPhase_SelectingMap:
                timeMax = 5;
                break;
            case k_EMapVetoPickPhase_PickStartingSide:
                timeMax = 5;
                break;
            case k_EMapVetoPickPhase_EndDraftType1:
                timeMax = 5;
                break;
            default:
                timeMax = 0;
                break;
        }
        return timeMax;
    }
    function UpdateTitleText(bNewPhase) {
        let isWaiting = MatchDraftAPI.GetPregameTeamToActNow() !== MatchDraftAPI.GetPregameMyTeam() || _m_nPhase <= k_EMapVetoPickPhase_DecideWhoGoesFirst;
        let elTitle = _m_elPickBanPanel.FindChildInLayoutFile('id-team-vote-title-phase');
        _m_elPickBanPanel.SetHasClass('your-turn', !isWaiting);
        _m_elPickBanPanel.FindChildInLayoutFile('id-team-vote-title-spinner').SetHasClass('hide', !isWaiting);
        elTitle.visible = true;
        if (bNewPhase) {
            _m_elPickBanPanel.FindChildInLayoutFile('id-team-vote-title').TriggerClass('premier-pickban__title--change');
        }
        if (isWaiting) {
            elTitle.text = $.Localize('#matchdraft_phase_action_wait_' + PhaseStringSuffix(_m_nPhase));
            return;
        }
        let nPickedMaps = GetCurrentVotes().filter(vote => vote !== -1).length;
        elTitle.SetDialogVariableInt('maps', nPickedMaps);
        elTitle.text = $.Localize('#matchdraft_phase_action_' + PhaseStringSuffix(_m_nPhase), elTitle);
    }
    function UpdateVoteBtns(btnSettings, bNewPhase) {
        let aVoteIds = btnSettings.list;
        let btnId = btnSettings.btnId;
        if (aVoteIds.length > 1) {
            const nYourTeam = MatchDraftAPI.GetPregameMyTeam();
            const sYourTeamPick = 'veto' + nYourTeam;
            let rndStyles = [1, 2, 3]; // shuffled animation sequence for the tiles (index 0 is pre-reserved for the "winner")
            for (let i = rndStyles.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [rndStyles[i], rndStyles[j]] = [rndStyles[j], rndStyles[i]];
            }
            for (let i = 0; i < aVoteIds.length; i++) {
                const elMapBtnParent = _m_elPickBanPanel.FindChildInLayoutFile(btnId + i);
                const elMapBtn = elMapBtnParent.FindChild('id-pickban-btn');
                if (!elMapBtn.Data().voteId) {
                    //
                    // This is one-time configuration for each of the buttons
                    //
                    let imageName = '';
                    let imagePath = '';
                    let backgroundColor = 'none;';
                    elMapBtn.SetDialogVariable('btm-line', '');
                    if (btnSettings.isTeam) // team pick
                     {
                        let team = aVoteIds[i] === '3' ? "ct" : "t";
                        let charId = LoadoutAPI.GetItemID(team, 'customplayer');
                        imageName = InventoryAPI.GetItemInventoryImage(charId);
                        imagePath = 'url("file://{images}' + imageName + '.png")';
                        elMapBtn.SetDialogVariable('map-name', $.Localize('#SFUI_InvUse_Equipped_' + team));
                        elMapBtn.Data().isTeamBtn = true;
                        let elReflection = _m_elPickBanPanel.FindChildInLayoutFile(btnId + 'ref-' + i);
                        elReflection.SetImageFromPanel(elMapBtnParent, false);
                        backgroundColor = team === 'ct' ? 'rgb(150, 200, 250);' : '#eabe54;';
                    }
                    else {
                        imageName = DeepStatsAPI.MapIDToString(parseInt(aVoteIds[i]));
                        imagePath = 'url("file://{images}/map_icons/screenshots/360p/' + imageName + '.png")';
                        elMapBtn.SetDialogVariable('map-name', $.Localize('#SFUI_Map_' + imageName));
                        elMapBtn.Data().isTeamBtn = false;
                        let elReflection = _m_elPickBanPanel.FindChildInLayoutFile(btnId + 'ref-' + i);
                        elReflection.SetImageFromPanel(elMapBtnParent, false);
                        elMapBtn.AddClass('premier-pickban-canblur'); // maps can blur, but T/CT buttons don't blur
                    }
                    let elBtnMapImage = elMapBtn.FindChildInLayoutFile('id-pickban-map-btn-bg');
                    elBtnMapImage.style.backgroundImage = imagePath;
                    elBtnMapImage.style.backgroundPosition = '50% 50%';
                    elBtnMapImage.style.backgroundSize = 'cover';
                    elBtnMapImage.style.backgroundColor = backgroundColor;
                    elMapBtn.Data().voteId = aVoteIds[i];
                    elMapBtn.SetPanelEvent('onactivate', () => onActivateCastVote(elMapBtn));
                }
                // New phase so no icon for voting should be set
                if (bNewPhase) {
                    elMapBtn.SetHasClass('is-ban-phase', false);
                    elMapBtn.SetHasClass('is-vote-phase', false);
                    // Always uncheck the button before new phase begins to avoid inconsistent checkbox state
                    elMapBtn.checked = false;
                    // Unset veto/pick styles and only set correct ones from the MatchDraftAPI
                    elMapBtn.SetHasClass('premier-pickban-veto', false);
                    elMapBtn.SetHasClass('premier-pickban-pick', false);
                    // see: MatchDraftAPI.GetPregameMapIdState call below that sets the correct class
                }
                let isMyTurn = MatchDraftAPI.GetPregameTeamToActNow() === MatchDraftAPI.GetPregameMyTeam();
                if (btnSettings.isTeam) // team pick
                 {
                    elMapBtn.enabled = isMyTurn;
                    if (_m_nPhase === k_EMapVetoPickPhase_EndDraftType1) {
                        elMapBtn.SetHasClass('premier-pickban-pick', parseInt(aVoteIds[i]) === GetStartingTeam());
                    }
                }
                else // map pick
                 {
                    let mapState = MatchDraftAPI.GetPregameMapIdState(parseInt(elMapBtn.Data().voteId));
                    if (_m_nPhase >= k_EMapVetoPickPhase_PickStartingSide) {
                        if (mapState !== 'pick')
                            mapState = 'veto';
                    }
                    else {
                        if (mapState.startsWith('veto')) {
                            // We set the dialog variable once we know it's your pick or their pick, and we let it persist all the way till the end of the draft
                            elMapBtn.SetDialogVariable('btm-line', $.Localize((mapState === sYourTeamPick) ? '#matchdraft_pick_your' : '#matchdraft_pick_their'));
                            if ((_m_nPhase >= k_EMapVetoPickPhase_SelectingMap)
                                && ("pick" === MatchDraftAPI.GetPregameMapIdState(-parseInt(elMapBtn.Data().voteId)))) {
                                elMapBtn.SwitchClass('premier-pickban-pick-seq', 'premier-pickban-pick-seq' + 0);
                            }
                            else {
                                const nAnimSequence = (rndStyles.length > 0) ? rndStyles.pop() : 0;
                                elMapBtn.SwitchClass('premier-pickban-pick-seq', 'premier-pickban-pick-seq' + nAnimSequence);
                            }
                            mapState = 'pick'; // post-2026 all map selections are "pick"
                        }
                    }
                    elMapBtn.SetHasClass('premier-pickban-' + mapState, mapState !== '');
                    elMapBtn.enabled = mapState === '' && isMyTurn;
                    if (_m_nPhase >= k_EMapVetoPickPhase_PickStartingSide) {
                        elMapBtnParent.SetHasClass("premier-pickban__map-btn--picked", mapState === "pick");
                        elMapBtnParent.SetHasClass("not-picked", mapState !== "pick");
                        let elReflection = _m_elPickBanPanel.FindChildInLayoutFile(btnId + 'ref-' + i);
                        elReflection.visible = false;
                    }
                }
                let sXuids = MatchDraftAPI.GetPregameXuidsForVote(parseInt(elMapBtn.Data().voteId));
                if (sXuids) {
                    let aVoteIds = MatchDraftAPI.GetPregameWinningVotes().split(',');
                    elMapBtn.SetHasClass('map-draft-phase-button--winning-vote', aVoteIds.indexOf(elMapBtn.Data().voteId) !== -1);
                }
                UpdateWinningVote(elMapBtn, aVoteIds[i], isMyTurn);
                UpdateBtnAvatars(elMapBtnParent, parseInt(aVoteIds[i]), isMyTurn);
            }
        }
    }
    function onActivateCastVote(elMapBtn) {
        let aCurrentVotes = GetCurrentVotes();
        let matchingVoteSlot = aCurrentVotes.indexOf(parseInt(elMapBtn.Data().voteId));
        // You are trying to unselect an already selected btn and you already selected.
        if (matchingVoteSlot !== -1) {
            $.Msg("Vote Remove, Phase: " + _m_nPhase + " slot: " + matchingVoteSlot + "voteid" + 0);
            MatchDraftAPI.ActionPregameCastMyVote(_m_nPhase, matchingVoteSlot, 0);
            $.DispatchEvent('CSGOPlaySoundEffect', 'UI.Premier.MapDeselect', 'MOUSE');
            return;
        }
        // If you are on phase that only has 2 options. Unselect the selected option and set pressed one.
        if (elMapBtn.Data().isTeamBtn) // team vote
         {
            for (let i = 0; i < 2; i++) {
                let elBtn = _m_elPickBanPanel.FindChildInLayoutFile('id-team-vote-btn-' + i).FindChild('id-pickban-btn');
                elBtn.checked = false;
                elBtn.SetHasClass('is-vote-phase', false);
            }
            MatchDraftAPI.ActionPregameCastMyVote(_m_nPhase, 0, parseInt(elMapBtn.Data().voteId));
            $.Msg("Vote Add, Phase: " + _m_nPhase + " slot: 0" + "voteid" + elMapBtn.Data().voteId);
            elMapBtn.checked = true;
            elMapBtn.SetHasClass('is-vote-phase', true);
            $.DispatchEvent('CSGOPlaySoundEffect', 'UI.Premier.TeamSelect', 'MOUSE');
            return;
        }
        // Let you vote if you are allowed.
        let freeSlot = GetFirstFreeVoteSlot(aCurrentVotes);
        if (freeSlot !== null) // all map veto btns
         {
            $.Msg("Vote Add, Phase: " + _m_nPhase + " slot: " + freeSlot + "voteid" + elMapBtn.Data().voteId);
            MatchDraftAPI.ActionPregameCastMyVote(_m_nPhase, freeSlot, parseInt(elMapBtn.Data().voteId));
            elMapBtn.SetHasClass('is-ban-phase', IsBanPhase());
            elMapBtn.SetHasClass('is-vote-phase', !IsBanPhase());
            $.DispatchEvent('CSGOPlaySoundEffect', 'UI.Premier.MapSelect', 'MOUSE');
        }
        else {
            // Show already selected btns
            elMapBtn.checked = false;
            let aBtns = _m_elPickBanPanel.FindChildInLayoutFile('id-team-vote-btns-container').Children();
            for (let btn of aBtns) {
                if (btn.id.indexOf('ref') === -1) {
                    $.Msg("Vote, btn.IsSelected() : " + btn.IsSelected());
                    let childBtn = btn.FindChild('id-pickban-btn');
                    if (childBtn.IsSelected() && childBtn.enabled) {
                        $.Msg("Vote, PLAYANIM: ");
                        btn.TriggerClass('map-draft-phase-button--pulse');
                    }
                }
            }
            $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.buymenu_failure', 'MOUSE');
        }
    }
    function GetCurrentVotes() {
        let aCurrentVotes = [];
        for (let i = 0; i < GetNumVoteSlots(); i++) {
            let voteId = MatchDraftAPI.GetPregameMyVoteInSlot(i);
            voteId = voteId ? voteId : -1;
            aCurrentVotes.push(voteId);
        }
        return aCurrentVotes;
    }
    function GetFirstFreeVoteSlot(aCurrentVotes) {
        for (let i = 0; i < aCurrentVotes.length; i++) {
            if (aCurrentVotes[i] === -1) {
                return i;
            }
        }
        return null;
    }
    function GetNumVoteSlots() {
        if (_m_nPhase === k_EMapVetoPickPhase_PickFirstOfTwoMaps) {
            return 1;
        }
        if (_m_nPhase === k_EMapVetoPickPhase_PickBothOtherMaps) {
            return 2;
        }
        if (_m_nPhase === k_EMapVetoPickPhase_PickLastOfTwoMaps) {
            return 1;
        }
        if (_m_nPhase === k_EMapVetoPickPhase_PickStartingSide) {
            return 1;
        }
        return 0;
    }
    function UpdateWinningVote(elButton, voteId, isMyTurn) {
        // Is this tile winning the vote? It must be our turn and maps stages should not be confused with team stages (they can share numeric IDs)
        let bTileWinningThisVote = false;
        if (isMyTurn && ((elButton.Data().isTeamBtn && _m_nPhase == k_EMapVetoPickPhase_PickStartingSide)
            ||
                (!elButton.Data().isTeamBtn && _m_nPhase < k_EMapVetoPickPhase_SelectingMap))) {
            bTileWinningThisVote = !!MatchDraftAPI.GetPregameXuidsForVote(parseInt(voteId));
        }
        if (bTileWinningThisVote) {
            let statusText = elButton.Data().isTeamBtn ? $.Localize('#matchdraft_vote_status_pick') : $.Localize('#matchdraft_vote_status_pick'); // '#matchdraft_vote_status_ban'
            elButton.SetDialogVariable('status', statusText);
            let aVoteIds = MatchDraftAPI.GetPregameWinningVotes().split(',');
            elButton.SetHasClass('premier-pickban__map-btn__show-status', aVoteIds.indexOf(voteId) !== -1);
            elButton.SetHasClass('is-team-pick', elButton.Data().isTeamBtn);
        }
        else {
            elButton.SetHasClass('premier-pickban__map-btn__show-status', false);
        }
    }
    function GetSelectedMap() {
        let aMapIds = MatchDraftAPI.GetPregameMapIdsList().split(',');
        let mapPickId = aMapIds.filter(id => MatchDraftAPI.GetPregameMapIdState(parseInt(id)) === 'pick')[0];
        return DeepStatsAPI.MapIDToString(parseInt(mapPickId));
    }
    function GetStartingTeam() {
        let nYourTeam = MatchDraftAPI.GetPregameMyTeam();
        let nOtherTeam = nYourTeam === 2 ? 3 : 2;
        // If terrorist-team picked to start CT then we switch sides
        let nStartingTeam = nYourTeam;
        if (2 === MatchDraftAPI.GetPregameTeamStartingCT())
            nStartingTeam = nOtherTeam;
        $.Msg("nStartingTeam " + nStartingTeam);
        return nStartingTeam;
    }
    function UpdateBtnAvatars(elBtn, voteId, isMyTurn) {
        let aVotedXuids = MatchDraftAPI.GetPregameXuidsForVote(voteId).split(',');
        let elAvatarsContainer = elBtn.FindChildInLayoutFile('id-pickban-btn-avatars');
        elAvatarsContainer.RemoveAndDeleteChildren();
        if (!isMyTurn) {
            return;
        }
        for (let i = 0; i < aVotedXuids.length; i++) {
            MakeAvatar(aVotedXuids[i], elAvatarsContainer);
        }
    }
    function MakeAvatar(xuid, elTeammates) {
        if (xuid === '0' || !xuid)
            return;
        if (xuid) {
            let elAvatar = $.CreatePanel('Panel', elTeammates, xuid);
            elAvatar.BLoadLayoutSnippet('small-avatar');
            let avatarImage = elAvatar.FindChildTraverse('JsAvatarImage');
            avatarImage.PopulateFromSteamID(xuid);
            elAvatar.FindChildTraverse('FriendContextMenuButton').SetPanelEvent('onactivate', _OpenContextMenu.bind(undefined, xuid));
            const teamColorIdx = PartyListAPI.GetPartyMemberTeammateColor(xuid);
            const teamColorRgb = TeamColor.GetTeamColor(Number(teamColorIdx));
            avatarImage.style.border = '2px solid rgb(' + teamColorRgb + ')';
            elAvatar.SetDialogVariable('xuid', xuid);
            return elAvatar;
        }
    }
    function _OpenContextMenu(xuid) {
        let contextMenuPanel = UiToolkitAPI.ShowCustomLayoutContextMenuParameters('', '', 'file://{resources}/layout/context_menus/context_menu_playercard.xml', 'xuid=' + xuid + '&pregame=true');
        contextMenuPanel.AddClass("ContextMenu_NoArrow");
    }
    function SetPlayerRank(playerIdx, elAvatar) {
        let playerWindowStats = MatchDraftAPI.GetPregamePlayerWindowStatsObject(playerIdx);
        if (!elAvatar)
            return;
        let options = {
            local_player: false,
            root_panel: elAvatar,
            rating_type: 'Premier',
            do_fx: true,
            full_details: false,
            leaderboard_details: { score: playerWindowStats.rank_id }
        };
        RatingEmblem.SetXuid(options);
    }
    function MakeOpponentAvatar(elTeammates, indexOpponent) {
        // Since these images start with 00 we add a 0 to images under 10
        let imgIndex = (indexOpponent < 9) ? ('0' + (indexOpponent + 1).toString()) : (indexOpponent + 1);
        let elAvatar = $.CreatePanel('Panel', elTeammates, indexOpponent.toString());
        elAvatar.BLoadLayoutSnippet('small-avatar-opponent');
        let elImage = elAvatar.FindChildInLayoutFile('id-avatar-opponent-avatar');
        elImage.SetImage('file://{images}/avatars/avatar_sub_' + imgIndex.toString() + '.psd');
        return elAvatar;
    }
    function UpdateTeamPanelBackground() {
        if (_m_nPhase >= k_EMapVetoPickPhase_PickStartingSide) {
            let selectedMapName = GetSelectedMap();
            let imagePath = 'url("file://{images}/map_icons/screenshots/360p/' + selectedMapName + '.png")';
            UpdateCharacterModels('ct', 'rifle0');
            UpdateCharacterModels('t', 'smg0');
            $.Schedule(1, () => {
                let elMapIcon = _m_elPickBanPanel.FindChildInLayoutFile('id-team-vote-map-icon');
                elMapIcon.SetImage('file://{images}/map_icons/map_icon_' + selectedMapName + '.svg');
                elMapIcon.AddClass('show');
                let elMapImage = _m_elPickBanPanel.FindChildInLayoutFile('id-team-vote-map-image');
                elMapImage.style.backgroundImage = imagePath;
                elMapImage.style.backgroundPosition = '50% 50%';
                elMapImage.style.backgroundSize = 'cover';
                elMapImage.style.brightness = '.1;';
                elMapImage.style.backgroundImgOpacity = '1';
                _m_elPickBanPanel.FindChildInLayoutFile('id-pick-vote-team').AddClass('show');
            });
            if (_m_nPhase === k_EMapVetoPickPhase_EndDraftType1) {
                for (let i = 0; i < _m_aTeams.length; i++) {
                    if (parseInt(_m_aTeams[i]) === GetStartingTeam()) {
                        let team = _m_aTeams[i] === '3' ? 'ct' : 't';
                        let elCharPanel = _m_elPickBanPanel.FindChildInLayoutFile('id-team-vote-agent-' + team);
                        elCharPanel.SetHasClass('premier-pickban__map-btn--picked', true);
                    }
                }
            }
        }
    }
    function UpdateCharacterModels(team, slot) {
        let elCharPanel = _m_elPickBanPanel.FindChildInLayoutFile('id-team-vote-agent-' + team);
        let charId = LoadoutAPI.GetItemID(team, 'customplayer');
        let weaponId = LoadoutAPI.GetItemID(team, slot);
        const settings = ItemInfo.GetOrUpdateVanityCharacterSettings(charId);
        settings.panel = elCharPanel;
        settings.weaponItemId = weaponId;
        CharacterAnims.PlayAnimsOnPanel(settings);
    }
    function _GetMapsList() {
        return Object.keys(FriendsListAPI.GetFriendCompetitivePremierWindowStatsObject("0"));
    }
    function ComputeAverageWindowStatsForTeam(teamID) {
        let averageWindowStats = {};
        let nCount = 0.0;
        let mapList = _GetMapsList();
        for (let i = 0; i < MatchDraftAPI.GetPregamePlayerCount(); i++) {
            let playerWindowStats = MatchDraftAPI.GetPregamePlayerWindowStatsObject(i);
            let thisTeamID = MatchDraftAPI.GetPregamePlayerTeam(i);
            if (thisTeamID != teamID)
                continue;
            nCount++;
            for (let mapName of mapList) {
                let myWinCount = Number(Math.floor(playerWindowStats[mapName] || 0));
                let teamWinCount = Number(Math.floor(averageWindowStats[mapName] || 0));
                averageWindowStats[mapName] = myWinCount + teamWinCount;
            }
        }
        return averageWindowStats;
    }
    function DrawSpiderGraph() {
        let rankWindowStats_T = ComputeAverageWindowStatsForTeam(TEAM_TERRORIST);
        let rankWindowShape_T = Object.keys(rankWindowStats_T).map(mapName => Number(rankWindowStats_T[mapName] | 0));
        let rankWindowStats_CT = ComputeAverageWindowStatsForTeam(TEAM_CT);
        let rankWindowShape_CT = Object.keys(rankWindowStats_T).map(mapName => Number(rankWindowStats_CT[mapName] | 0));
        let maxWinsInASingleMap = (Math.max(...rankWindowShape_T, ...rankWindowShape_CT, 3));
        const spiderGraph = _m_elPickBanPanel.FindChildInLayoutFile('id-team-vote-spider-graph');
        DrawBackground(spiderGraph, maxWinsInASingleMap);
        //Draw the other team last.
        if (MatchDraftAPI.GetPregameMyTeam() === TEAM_CT) {
            DrawTeamPlot(spiderGraph, rankWindowShape_CT, true, maxWinsInASingleMap);
            DrawTeamPlot(spiderGraph, rankWindowShape_T, false, maxWinsInASingleMap);
        }
        else {
            DrawTeamPlot(spiderGraph, rankWindowShape_T, true, maxWinsInASingleMap);
            DrawTeamPlot(spiderGraph, rankWindowShape_CT, false, maxWinsInASingleMap);
        }
    }
    function DrawBackground(spiderGraph, maxWinsInASingleMap) {
        const numMaps = 7;
        spiderGraph.ClearJS('rgba(0,0,0,0)');
        const options = {
            bkg_color: "#00000080",
            spokes_color: '#ffffff10',
            spoke_thickness: 2,
            spoke_softness: 100,
            spoke_length_scale: 1.2,
            guideline_color: '#ffffff10',
            guideline_thickness: 2,
            guideline_softness: 100,
            guideline_count: maxWinsInASingleMap + 1,
            deadzone_percent: 0.1,
            scale: 0.70
        };
        spiderGraph.SetGraphOptions(options);
        spiderGraph.DrawGraphBackground(numMaps);
    }
    function DrawTeamPlot(spiderGraph, rankWindowShape, isMyTeam, max) {
        const oColorsMyTeam = {
            line_color: 'rgba( 100, 100, 100, 1.0);',
            fill_color_inner: 'rgba( 100, 100, 100, 0.5);'
        };
        const oColorsOpponent = {
            line_color: 'rgba( 219, 68, 55, 1.0);',
            fill_color_inner: 'rgba( 219, 68, 55, 0.5);'
        };
        rankWindowShape = rankWindowShape.map(a => a / max);
        const polyOptions = {
            line_color: isMyTeam ? oColorsMyTeam.line_color : oColorsOpponent.line_color,
            line_thickness: 3,
            line_softness: 10,
            fill_color_inner: isMyTeam ? oColorsMyTeam.fill_color_inner : oColorsOpponent.fill_color_inner,
            fill_color_outer: isMyTeam ? oColorsMyTeam.fill_color_inner : oColorsOpponent.fill_color_inner
        };
        spiderGraph.DrawGraphPoly(rankWindowShape, polyOptions);
    }
    function PlayerTeam() {
        let DEBUG_AVATARS = false;
        let aTestids = [
            '148618791998277666',
            '148618791998261669',
            '148618791998203739',
            '148618792083695883',
            '148618791998365706',
            '148618791998209668',
            '148618791998345670',
            '148618792154451370',
            '',
            '148618792083696093'
        ];
        let aTestGroups = [
            1,
            2,
            2,
            3,
            3,
            4,
            5,
            5,
            6,
            7
        ];
        let clientXuid = MyPersonaAPI.GetXuid();
        let aPlayers = [];
        let nCount = MatchDraftAPI.GetPregamePlayerCount();
        if (DEBUG_AVATARS) {
            nCount = 10;
        }
        for (let i = 0; i < nCount; i++) {
            if (DEBUG_AVATARS) {
                if (aTestGroups[i] >= 0) {
                    let player = {
                        xuid: aTestids[i],
                        nParty: aTestGroups[i],
                        idx: i,
                        isClient: aTestids[i] === clientXuid
                    };
                    $.Msg('MatchDraftAPI.GetPregamePlayerXuid(): ' + aTestids[i]);
                    $.Msg('MatchDraftAPI.GetPregamePlayerParty(): ' + aTestGroups[i]);
                    aPlayers.push(player);
                }
            }
            else {
                if (MatchDraftAPI.GetPregamePlayerParty(i) >= 0) {
                    let player = {
                        xuid: MatchDraftAPI.GetPregamePlayerXuid(i),
                        nParty: MatchDraftAPI.GetPregamePlayerParty(i),
                        idx: i,
                        isClient: MatchDraftAPI.GetPregamePlayerXuid(i) === clientXuid
                    };
                    aPlayers.push(player);
                }
            }
        }
        if (aPlayers.length < 1) {
            return;
        }
        let indexClient = aPlayers.findIndex(object => object.isClient);
        $.Msg('MatchDraftAPI.indexClient: ' + indexClient);
        for (let i = 0; i < aPlayers.length; i++) {
            AddPlayerToGroup(aPlayers[i], indexClient);
        }
        AddPartyBoundryLines(_m_elPickBanPanel.FindChildInLayoutFile('id-team-vote-team-teammates'));
        AddPartyBoundryLines(_m_elPickBanPanel.FindChildInLayoutFile('id-team-vote-team-opponent'));
    }
    function AddPlayerToGroup(player, indexClient) {
        $.Msg('MatchDraftAPI.player.idx: ' + player.idx + ', player.xuid: ' + player.xuid);
        let isTeammate = (indexClient < 5 && player.idx < 5) || (indexClient >= 5 && player.idx >= 5);
        let elParent = isTeammate ?
            _m_elPickBanPanel.FindChildInLayoutFile('id-team-vote-team-teammates') :
            _m_elPickBanPanel.FindChildInLayoutFile('id-team-vote-team-opponent');
        let elContainer = elParent.FindChildInLayoutFile('id-player-party-container-' + player.nParty);
        if (!elContainer) {
            elContainer = $.CreatePanel('Panel', elParent, 'id-player-party-container-' + player.nParty, { class: 'premier-pickban__teammates-party' });
        }
        let elTeammate = isTeammate ? elParent.FindChildInLayoutFile(player.xuid) : elParent.FindChildInLayoutFile(player.idx.toString());
        if (!elTeammate) {
            if (isTeammate) {
                SetPlayerRank(player.idx, MakeAvatar(player.xuid, elContainer));
            }
            else {
                SetPlayerRank(player.idx, MakeOpponentAvatar(elContainer, player.idx));
            }
        }
    }
    function AddPartyBoundryLines(elParent) {
        for (let party of elParent.Children()) {
            let aPartyMembers = party.Children();
            if (aPartyMembers.length > 1) {
                aPartyMembers.forEach((element, index) => {
                    if (index === 0) {
                        element.FindChild('id-avatar-party-line')?.AddClass('premier-pickban__map-avatars__party-line-top');
                    }
                    else if (index === aPartyMembers.length - 1) {
                        element.FindChild('id-avatar-party-line')?.AddClass('premier-pickban__map-avatars__party-line-bottom');
                    }
                    else {
                        element.FindChild('id-avatar-party-line')?.AddClass('premier-pickban__map-avatars__party-line-middle');
                    }
                });
            }
            else if (aPartyMembers.length === 1) {
                aPartyMembers[0].FindChild('id-avatar-party-line')?.AddClass('premier-pickban__map-avatars__party-line-empty');
            }
        }
    }
    function PlayerActivityVoice(xuid) {
        const elTeammates = _m_elPickBanPanel.FindChildInLayoutFile('id-team-vote-team-teammates');
        const elAvatar = elTeammates.FindChildInLayoutFile(xuid);
        if (elAvatar && elAvatar.IsValid()) {
            Avatar.UpdateTalkingState(elAvatar, xuid);
        }
    }
})(PremierPickBan || (PremierPickBan = {}));
// 3 == ct
// GetPregamePlayerCount (): number;
// GetPregameMyTeam()
// GetPregamePlayerXuid ( idx: number ): string;
// GetPregamePlayerParty ( idx: number ): number;
// GetPregamePhase(): number;
// GetPregamePhaseSecondsRemaining(): number;
// GetPregameTeamWinningCoinToss(): number;
// GetPregameTeamWithFirstChoice(): number;
// GetPregameTeamToActNow(): number;
// GetPregameMapIdsList(): string;
// GetPregameMapIdState(nMapID: number): "pick" | "veto" | "";
// GetPregameTeamStartingCT(): number;
// GetPregameXuidsForVote(nMapID: number): string;
// GetPregameWinningVotes(): string;
// GetPregameMyVoteInSlot(nSlot: number): number;
// ActionPregameCastMyVote(phase: number, slot: number, vote: number): void;
// New events --
// this event means that we are heading into POST-ACCEPT pre-match UI (but we don't yet have all the match data, about who is participating and stuff, but it basically tells the ACCEPT UI that everybody accepted, but we will not be loading the map just yet) --
// $.RegisterForUnhandledEvent('PanoramaComponent_Lobby_ShowPreMatchInterface', PopupAcceptMatch.ShowPreMatchInterface);
// this event fires every time something about the draft state changes (somebody voted on something, or stage auto-advanced or whatever) --
// $.RegisterForUnhandledEvent('PanoramaComponent_PregameDraft_DraftUpdate', PopupAcceptMatch.PregameDraftUpdate);
// I shortened all the timers a bunch, probably can shorten some more. There's current a problem with the hosting map where the entity I need doesn't spawn, but once it's resolved all the flow should be fully functional and then it will be just about adding more data that we need exposed to the component methods (e.g. spidergraph points).
// This is a reference shelf for hooking up the events:
// https://swarm.valve.org/changes/7933647
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfcHJlbWllcl9waWNrX2Jhbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3BvcHVwcy9wb3B1cF9wcmVtaWVyX3BpY2tfYmFuLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFDckMsaURBQWlEO0FBQ2pELGdEQUFnRDtBQUNoRCxpREFBaUQ7QUFDakQsK0NBQStDO0FBQy9DLDhDQUE4QztBQUM5Qyw0Q0FBNEM7QUFDNUMscUNBQXFDO0FBRXJDLElBQVUsY0FBYyxDQXMrQnZCO0FBdCtCRCxXQUFVLGNBQWM7SUFFdkIsSUFBSSxTQUFTLEdBQVcsQ0FBQyxDQUFDO0lBRTFCLHdGQUF3RjtJQUN4RixtRkFBbUY7SUFDbkYsSUFBSSxxQkFBcUIsR0FBa0IsSUFBSSxDQUFDO0lBQ2hELElBQUksNkJBQTZCLEdBQWtCLElBQUksQ0FBQztJQUV4RCxNQUFNLG1DQUFtQyxHQUFHLENBQUMsQ0FBQztJQUM5QyxNQUFNLHNDQUFzQyxHQUFHLENBQUMsQ0FBQztJQUNqRCxNQUFNLHNDQUFzQyxHQUFHLENBQUMsQ0FBQztJQUNqRCxNQUFNLHFDQUFxQyxHQUFHLENBQUMsQ0FBQztJQUNoRCxNQUFNLHFDQUFxQyxHQUFHLENBQUMsQ0FBQztJQUNoRCxNQUFNLGdDQUFnQyxHQUFHLENBQUMsQ0FBQztJQUMzQyxNQUFNLG9DQUFvQyxHQUFHLENBQUMsQ0FBQztJQUMvQyxNQUFNLGlDQUFpQyxHQUFHLENBQUMsQ0FBQztJQUU1QyxNQUFNLGNBQWMsR0FBRyxDQUFDLENBQUM7SUFDekIsTUFBTSxPQUFPLEdBQUcsQ0FBQyxDQUFDO0lBRWxCLE1BQU0sU0FBUyxHQUFHLENBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBRSxDQUFDO0lBQy9CLE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLHFCQUFxQixDQUFFLENB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