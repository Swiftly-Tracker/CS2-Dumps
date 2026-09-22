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
        let mapNames = Object.keys(FriendsListAPI.GetFriendCompetitivePremierWindowStatsObject("0"));
        let mapIds = [];
        mapNames.forEach(x => mapIds.push(mapName2Id.get(x)));
        if (mapIds.filter(x => !x).length > 0) {
            mapIds = mapIdsList;
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
        return false;
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
            let rndStyles = [1, 2, 3];
            for (let i = rndStyles.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [rndStyles[i], rndStyles[j]] = [rndStyles[j], rndStyles[i]];
            }
            for (let i = 0; i < aVoteIds.length; i++) {
                const elMapBtnParent = _m_elPickBanPanel.FindChildInLayoutFile(btnId + i);
                const elMapBtn = elMapBtnParent.FindChild('id-pickban-btn');
                if (!elMapBtn.Data().voteId) {
                    let imageName = '';
                    let imagePath = '';
                    let backgroundColor = 'none;';
                    elMapBtn.SetDialogVariable('btm-line', '');
                    if (btnSettings.isTeam) {
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
                        elMapBtn.AddClass('premier-pickban-canblur');
                    }
                    let elBtnMapImage = elMapBtn.FindChildInLayoutFile('id-pickban-map-btn-bg');
                    elBtnMapImage.style.backgroundImage = imagePath;
                    elBtnMapImage.style.backgroundPosition = '50% 50%';
                    elBtnMapImage.style.backgroundSize = 'cover';
                    elBtnMapImage.style.backgroundColor = backgroundColor;
                    elMapBtn.Data().voteId = aVoteIds[i];
                    elMapBtn.SetPanelEvent('onactivate', () => onActivateCastVote(elMapBtn));
                }
                if (bNewPhase) {
                    elMapBtn.SetHasClass('is-ban-phase', false);
                    elMapBtn.SetHasClass('is-vote-phase', false);
                    elMapBtn.checked = false;
                    elMapBtn.SetHasClass('premier-pickban-veto', false);
                    elMapBtn.SetHasClass('premier-pickban-pick', false);
                }
                let isMyTurn = MatchDraftAPI.GetPregameTeamToActNow() === MatchDraftAPI.GetPregameMyTeam();
                if (btnSettings.isTeam) {
                    elMapBtn.enabled = isMyTurn;
                    if (_m_nPhase === k_EMapVetoPickPhase_EndDraftType1) {
                        elMapBtn.SetHasClass('premier-pickban-pick', parseInt(aVoteIds[i]) === GetStartingTeam());
                    }
                }
                else {
                    let mapState = MatchDraftAPI.GetPregameMapIdState(parseInt(elMapBtn.Data().voteId));
                    if (_m_nPhase >= k_EMapVetoPickPhase_PickStartingSide) {
                        if (mapState !== 'pick')
                            mapState = 'veto';
                    }
                    else {
                        if (mapState.startsWith('veto')) {
                            elMapBtn.SetDialogVariable('btm-line', $.Localize((mapState === sYourTeamPick) ? '#matchdraft_pick_your' : '#matchdraft_pick_their'));
                            if ((_m_nPhase >= k_EMapVetoPickPhase_SelectingMap)
                                && ("pick" === MatchDraftAPI.GetPregameMapIdState(-parseInt(elMapBtn.Data().voteId)))) {
                                elMapBtn.SwitchClass('premier-pickban-pick-seq', 'premier-pickban-pick-seq' + 0);
                            }
                            else {
                                const nAnimSequence = (rndStyles.length > 0) ? rndStyles.pop() : 0;
                                elMapBtn.SwitchClass('premier-pickban-pick-seq', 'premier-pickban-pick-seq' + nAnimSequence);
                            }
                            mapState = 'pick';
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
        if (matchingVoteSlot !== -1) {
            MatchDraftAPI.ActionPregameCastMyVote(_m_nPhase, matchingVoteSlot, 0);
            $.DispatchEvent('CSGOPlaySoundEffect', 'UI.Premier.MapDeselect', 'MOUSE');
            return;
        }
        if (elMapBtn.Data().isTeamBtn) {
            for (let i = 0; i < 2; i++) {
                let elBtn = _m_elPickBanPanel.FindChildInLayoutFile('id-team-vote-btn-' + i).FindChild('id-pickban-btn');
                elBtn.checked = false;
                elBtn.SetHasClass('is-vote-phase', false);
            }
            MatchDraftAPI.ActionPregameCastMyVote(_m_nPhase, 0, parseInt(elMapBtn.Data().voteId));
            elMapBtn.checked = true;
            elMapBtn.SetHasClass('is-vote-phase', true);
            $.DispatchEvent('CSGOPlaySoundEffect', 'UI.Premier.TeamSelect', 'MOUSE');
            return;
        }
        let freeSlot = GetFirstFreeVoteSlot(aCurrentVotes);
        if (freeSlot !== null) {
            MatchDraftAPI.ActionPregameCastMyVote(_m_nPhase, freeSlot, parseInt(elMapBtn.Data().voteId));
            elMapBtn.SetHasClass('is-ban-phase', IsBanPhase());
            elMapBtn.SetHasClass('is-vote-phase', !IsBanPhase());
            $.DispatchEvent('CSGOPlaySoundEffect', 'UI.Premier.MapSelect', 'MOUSE');
        }
        else {
            elMapBtn.checked = false;
            let aBtns = _m_elPickBanPanel.FindChildInLayoutFile('id-team-vote-btns-container').Children();
            for (let btn of aBtns) {
                if (btn.id.indexOf('ref') === -1) {
                    let childBtn = btn.FindChild('id-pickban-btn');
                    if (childBtn.IsSelected() && childBtn.enabled) {
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
        let bTileWinningThisVote = false;
        if (isMyTurn && ((elButton.Data().isTeamBtn && _m_nPhase == k_EMapVetoPickPhase_PickStartingSide)
            ||
                (!elButton.Data().isTeamBtn && _m_nPhase < k_EMapVetoPickPhase_SelectingMap))) {
            bTileWinningThisVote = !!MatchDraftAPI.GetPregameXuidsForVote(parseInt(voteId));
        }
        if (bTileWinningThisVote) {
            let statusText = elButton.Data().isTeamBtn ? $.Localize('#matchdraft_vote_status_pick') : $.Localize('#matchdraft_vote_status_pick');
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
        let nStartingTeam = nYourTeam;
        if (2 === MatchDraftAPI.GetPregameTeamStartingCT())
            nStartingTeam = nOtherTeam;
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
        for (let i = 0; i < aPlayers.length; i++) {
            AddPlayerToGroup(aPlayers[i], indexClient);
        }
        AddPartyBoundryLines(_m_elPickBanPanel.FindChildInLayoutFile('id-team-vote-team-teammates'));
        AddPartyBoundryLines(_m_elPickBanPanel.FindChildInLayoutFile('id-team-vote-team-opponent'));
    }
    function AddPlayerToGroup(player, indexClient) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfcHJlbWllcl9waWNrX2Jhbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3BvcHVwcy9wb3B1cF9wcmVtaWVyX3BpY2tfYmFuLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFDckMsaURBQWlEO0FBQ2pELGdEQUFnRDtBQUNoRCxpREFBaUQ7QUFDakQsK0NBQStDO0FBQy9DLDhDQUE4QztBQUM5Qyw0Q0FBNEM7QUFDNUMscUNBQXFDO0FBRXJDLElBQVUsY0FBYyxDQXMrQnZCO0FBdCtCRCxXQUFVLGNBQWM7SUFFdkIsSUFBSSxTQUFTLEdBQVcsQ0FBQyxDQUFDO0lBSTFCLElBQUkscUJBQXFCLEdBQWtCLElBQUksQ0FBQztJQUNoRCxJQUFJLDZCQUE2QixHQUFrQixJQUFJLENBQUM7SUFFeEQsTUFBTSxtQ0FBbUMsR0FBRyxDQUFDLENBQUM7SUFDOUMsTUFBTSxzQ0FBc0MsR0FBRyxDQUFDLENBQUM7SUFDakQsTUFBTSxzQ0FBc0MsR0FBRyxDQUFDLENBQUM7SUFDakQsTUFBTSxxQ0FBcUMsR0FBRyxDQUFDLENBQUM7SUFDaEQsTUFBTSxxQ0FBcUMsR0FBRyxDQUFDLENBQUM7SUFDaEQsTUFBTSxnQ0FBZ0MsR0FBRyxDQUFDLENBQUM7SUFDM0MsTUFBTSxvQ0FBb0MsR0FBRyxDQUFDLENBQUM7SUFDL0MsTUFBTSxpQ0FBaUMsR0FBRyxDQUFDLENBQUM7SUFFNUMsTUFBTSxjQUFjLEdBQUcsQ0FBQyxDQUFDO0lBQ3pCLE1BQU0sT0FBTyxHQUFHLENBQUMsQ0FBQztJQUVsQixNQUFNLFNBQVMsR0FBRyxDQUFFLEdBQUcsRUFBRSxHQUFHLENBQUUsQ0FBQztJQUMvQixNQUFNLGlCQUFpQixHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxxQkFBcUIsQ0FBRSxDQUFDO0lBUTdGLFNBQWdCLElBQUk7UUFFbkIs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