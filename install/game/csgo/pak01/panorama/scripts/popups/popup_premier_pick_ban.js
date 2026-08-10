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
    let _m_pickedMapReveal = false;
    const TEAM_TERRORIST = 2;
    const TEAM_CT = 3;
    const _m_aTeams = ['3', '2'];
    const _m_elPickBanPanel = $.GetContextPanel().FindChildInLayoutFile('id-premier-pick-ban');
    function Init() {
        $.RegisterForUnhandledEvent('PanoramaComponent_PregameDraft_DraftUpdate', OnDraftUpdate);
        $.RegisterForUnhandledEvent('PanoramaComponent_FriendsList_NameChanged', UpdateName);
        $.RegisterForUnhandledEvent("PanoramaComponent_PartyList_PlayerActivityVoice", PlayerActivityVoice);
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
        let mapIds = MatchDraftAPI.GetPregameMapIdsList().split(',');
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
        if (_m_nPhase < 2) {
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
        if (bNewPhase && _m_nPhase > 0 && _m_nPhase <= 4) {
            $.DispatchEvent('CSGOPlaySoundEffectMuteBypass', 'UI.Premier.MapsLocked', 'MOUSE', 1.0);
        }
        else if (bNewPhase && _m_nPhase > 4) {
            $.DispatchEvent('CSGOPlaySoundEffectMuteBypass', 'UI.Premier.SubmenuTransition', 'MOUSE', 1.0);
        }
    }
    function UpdatePhaseProgressBar() {
        let aChildren = _m_elPickBanPanel.FindChildInLayoutFile('id-team-vote-phasebar-container').Children();
        for (let phase of aChildren) {
            let nPhaseBarIndex = parseInt(phase.GetAttributeString('data-phase', ''));
            phase.SetDialogVariable('section-label', $.Localize('#matchdraft_phase_' + nPhaseBarIndex));
            phase.SetHasClass('premier-pickban__progress--ban', IsBanPhase() && nPhaseBarIndex === _m_nPhase);
            phase.SetHasClass('premier-pickban__progress--pick', !IsBanPhase() && nPhaseBarIndex === _m_nPhase);
            phase.SetHasClass('premier-pickban__progress--pre', nPhaseBarIndex > _m_nPhase);
            phase.SetHasClass('premier-pickban__progress--post', nPhaseBarIndex < _m_nPhase);
        }
    }
    function IsBanPhase() {
        return _m_nPhase > 1 && _m_nPhase < 5;
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
            case 0:
                timeMax = 0;
                break;
            case 1:
                timeMax = 0;
                break;
            case 2:
                timeMax = 15;
                break;
            case 3:
                timeMax = 20;
                break;
            case 4:
                timeMax = 10;
                break;
            case 5:
                timeMax = 10;
                break;
            case 6:
                timeMax = 5;
                break;
            default:
                timeMax = 0;
                break;
        }
        return timeMax;
    }
    function UpdateTitleText(bNewPhase) {
        let isWaiting = MatchDraftAPI.GetPregameTeamToActNow() !== MatchDraftAPI.GetPregameMyTeam() || _m_nPhase < 2;
        let elTitle = _m_elPickBanPanel.FindChildInLayoutFile('id-team-vote-title-phase');
        _m_elPickBanPanel.SetHasClass('your-turn', !isWaiting);
        _m_elPickBanPanel.FindChildInLayoutFile('id-team-vote-title-spinner').SetHasClass('hide', !isWaiting);
        elTitle.visible = true;
        if (bNewPhase) {
            _m_elPickBanPanel.FindChildInLayoutFile('id-team-vote-title').TriggerClass('premier-pickban__title--change');
        }
        if (isWaiting) {
            elTitle.text = $.Localize('#matchdraft_phase_action_wait_' + _m_nPhase);
            return;
        }
        let nPickedMaps = GetCurrentVotes().filter(vote => vote !== -1).length;
        elTitle.SetDialogVariableInt('maps', nPickedMaps);
        elTitle.text = $.Localize('#matchdraft_phase_action_' + _m_nPhase, elTitle);
    }
    function UpdateVoteBtns(btnSettings, bNewPhase) {
        let aVoteIds = btnSettings.list;
        let btnId = btnSettings.btnId;
        if (aVoteIds.length > 1) {
            for (let i = 0; i < aVoteIds.length; i++) {
                const elMapBtnParent = _m_elPickBanPanel.FindChildInLayoutFile(btnId + i);
                const elMapBtn = elMapBtnParent.FindChild('id-pickban-btn');
                if (!elMapBtn.Data().voteId) {
                    let imageName = '';
                    let imagePath = '';
                    let backgroundColor = 'none;';
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
                    if (_m_nPhase === 6) {
                        elMapBtn.SetHasClass('premier-pickban-pick', parseInt(aVoteIds[i]) === GetStartingTeam());
                    }
                }
                else {
                    let mapState = MatchDraftAPI.GetPregameMapIdState(parseInt(elMapBtn.Data().voteId));
                    elMapBtn.SetHasClass('premier-pickban-' + mapState, mapState !== '');
                    elMapBtn.enabled = mapState === '' && isMyTurn;
                    if (_m_nPhase >= 5 && !_m_pickedMapReveal) {
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
        if (_m_nPhase === 2) {
            return 2;
        }
        if (_m_nPhase === 3) {
            return 3;
        }
        if (_m_nPhase === 4) {
            return 1;
        }
        if (_m_nPhase === 5) {
            return 1;
        }
        return 0;
    }
    function UpdateWinningVote(elButton, voteId, isMyTurn) {
        let bTileWinningThisVote = false;
        if (isMyTurn && ((elButton.Data().isTeamBtn && _m_nPhase == 5)
            ||
                (!elButton.Data().isTeamBtn && _m_nPhase < 5))) {
            bTileWinningThisVote = !!MatchDraftAPI.GetPregameXuidsForVote(parseInt(voteId));
        }
        if (bTileWinningThisVote) {
            let statusText = elButton.Data().isTeamBtn ? $.Localize('#matchdraft_vote_status_pick') : $.Localize('#matchdraft_vote_status_ban');
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
        let nStartingTeam = (MatchDraftAPI.GetPregameTeamWithFirstChoice() === MatchDraftAPI.GetPregameTeamStartingCT())
            ? nOtherTeam : nYourTeam;
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
            elAvatar.SetDialogVariable('teammate_name', FriendsListAPI.GetFriendName(xuid));
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
        if (_m_nPhase >= 5) {
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
            if (_m_nPhase === 6) {
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
    function UpdateName(xuid) {
        let elList = _m_elPickBanPanel.FindChildInLayoutFile('id-team-vote-team-teammates');
        let elAvatar = elList.FindChildInLayoutFile(xuid);
        if (elAvatar) {
            elAvatar.SetDialogVariable('teammate_name', FriendsListAPI.GetFriendName(xuid));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfcHJlbWllcl9waWNrX2Jhbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3BvcHVwcy9wb3B1cF9wcmVtaWVyX3BpY2tfYmFuLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFDckMsaURBQWlEO0FBQ2pELGdEQUFnRDtBQUNoRCxpREFBaUQ7QUFDakQsK0NBQStDO0FBQy9DLDhDQUE4QztBQUM5Qyw0Q0FBNEM7QUFDNUMscUNBQXFDO0FBRXJDLElBQVUsY0FBYyxDQTI2QnZCO0FBMzZCRCxXQUFVLGNBQWM7SUFFdkIsSUFBSSxTQUFTLEdBQVcsQ0FBQyxDQUFDO0lBQzFCLElBQUksa0JBQWtCLEdBQUcsS0FBSyxDQUFDO0lBRS9CLE1BQU0sY0FBYyxHQUFHLENBQUMsQ0FBQztJQUN6QixNQUFNLE9BQU8sR0FBRyxDQUFDLENBQUM7SUFFbEIsTUFBTSxTQUFTLEdBQUcsQ0FBRSxHQUFHLEVBQUUsR0FBRyxDQUFFLENBQUM7SUFDL0IsTUFBTSxpQkFBaUIsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUUscUJBQXFCLENBQUUsQ0FBQztJQVE3RixTQUFnQixJQUFJO1FBRW5CLENBQUMsQ0FBQyx5QkFBeUIsQ0FBRSw0Q0FBNEMsRUFBRSxhQUFhLENBQUUsQ0FBQztRQUMzRixDQUFDLENBQUMseUJBQXlCLENBQUUsMkNBQTJDLEVBQUUsVUFBVSxDQUFFLENBQUM7UUFDdkYsQ0FBQyxDQUFDLHlCQUF5QixDQUFFLGlEQUFpRCxFQUFFLG1CQUFtQixDQUFFLENBQUM7UUFFdEcsb0JBQW9CLEVBQUUsQ0FBQztRQUN2QixJQUFJLEVBQUUsQ0FBQztRQUNQLGFBQWEsRUFBRSxDQUFDO1FBQ2hCLDRCQUE0QixFQUFFLENBQUM7UUFFL0IsTUFBTSxXQUFXLEdBQUcsaUJBQWlCLENBQUMscUJBQXFCLENBQUUsMkJBQTJC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