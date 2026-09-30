"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="avatar.ts" />
/// <reference path="friendslist.ts" />
/////////////////////////////////////////////////////
// This object is used in Friendlist for the party part
/////////////////////////////////////////////////////
var PartyMenu;
(function (PartyMenu) {
    let elPartySection = $('#PartyList');
    let m_eventRebuildPartyList;
    let m_prevMembersInParty = 1;
    function _Init() {
        _RefreshPartyMembers();
        _AddOnActivateLeaveBtn();
        _ShowMatchmakingStatusTooltipEvent();
    }
    function _RefreshPartyMembers() {
        if (!_IsSessionActive()) {
            return;
        }
        let lobbySettings = LobbyAPI.GetSessionSettings().game;
        if (!lobbySettings) {
            return;
        }
        let elPartyMembersList = elPartySection.FindChildInLayoutFile('PartyMembers');
        _UpdateNumPlayersInparty();
        // Show lobby slots if you have more than just you in the lobby or you are searching
        let bIsSearching = _IsSearching();
        if (m_prevMembersInParty >= PartyListAPI.GetPartySessionUiThreshold() || bIsSearching) {
            elPartyMembersList.RemoveAndDeleteChildren();
            _UpdateMembersList(lobbySettings, m_prevMembersInParty);
        }
        else {
            elPartySection.AddClass('hidden');
            FriendsList.UpdateHeightOpenSection();
            elPartyMembersList.RemoveAndDeleteChildren();
        }
        // this style enables showing party list in the game pause menu
        // currently for survival searching in game happens only in solo mode, so only show the searching element in game if solo party
        elPartySection.GetParent().SetHasClass('friendslist-party-searching', bIsSearching && (m_prevMembersInParty <= 1));
        _UpdateLeaveBtn();
    }
    function _UpdateNumPlayersInparty() {
        let numPlayersActuallyInParty = PartyListAPI.GetCount();
        if (numPlayersActuallyInParty > m_prevMembersInParty) {
            $.DispatchEvent('CSGOPlaySoundEffectMuteBypass', 'PanoramaUI.Lobby.Joined', 'PartyList', 1.0);
        }
        else if (numPlayersActuallyInParty < m_prevMembersInParty) {
            $.DispatchEvent('CSGOPlaySoundEffectMuteBypass', 'PanoramaUI.Lobby.Left', 'PartyList', 1.0);
        }
        m_prevMembersInParty = numPlayersActuallyInParty;
        elPartySection.SetDialogVariable('alert_value', String(numPlayersActuallyInParty));
    }
    function _IsSessionActive() {
        if (!LobbyAPI.IsSessionActive()) {
            elPartySection.AddClass('hidden');
            FriendsList.UpdateHeightOpenSection();
            elPartySection.GetParent().SetHasClass('friendslist-party-searching', false);
            return false;
        }
        return true;
    }
    function _UpdateMembersList(lobbySettings, numPlayersActuallyInParty) {
        // Allows more people in the lobby then requred by the made modes.
        // This so you can meet up with people then kick out the ones you don't want to play with.
        let maxAllowedInLobby = 10;
        let numPlayersPossibleInMode = SessionUtil.GetMaxLobbySlotsForGameMode(lobbySettings.mode);
        if (elPartySection.BHasClass('hidden')) {
            elPartySection.RemoveClass('hidden');
        }
        FriendsList.UpdateHeightOpenSection();
        for (let i = 0; i < maxAllowedInLobby; i++) {
            let xuid = i < numPlayersActuallyInParty ? PartyListAPI.GetXuidByIndex(i) : '0';
            let isOverPossible = (numPlayersActuallyInParty > numPlayersPossibleInMode) ? true : false;
            let elPartyMemberCurrent = null;
            if (i < numPlayersActuallyInParty) {
                elPartyMemberCurrent = _MakeNewPartyMemberTile("PartyMember" + i, xuid);
                _SetPartyMemberRank(elPartyMemberCurrent, xuid);
                _SetPrimeForMember(elPartyMemberCurrent, xuid);
                _UpdateAvatar(elPartyMemberCurrent, xuid);
                _TintForOverPlayerCountForMode(elPartyMemberCurrent, isOverPossible);
            }
        }
        _SetLobbyTitle(numPlayersPossibleInMode, numPlayersActuallyInParty);
    }
    function _MakeNewPartyMemberTile(panelIdToLoad, xuid) {
        let elParent = $.GetContextPanel().FindChildInLayoutFile('PartyMembers');
        let elPartyMember = $.CreatePanel("Panel", elParent, panelIdToLoad);
        elPartyMember.BLoadLayoutSnippet('PartyMember');
        elPartyMember.Data().xuid = xuid;
        elPartyMember.SetDialogVariable('partyxuid', xuid);
        let memberBtn = elPartyMember.FindChildInLayoutFile('PartyMemberBtn');
        let elAvatar = $.CreatePanel("Panel", memberBtn, xuid);
        _SetAttributeStringsOnAvatarPanel(elAvatar, xuid);
        elAvatar.BLoadLayout('file://{resources}/layout/avatar.xml', false, false);
        elAvatar.BLoadLayoutSnippet("AvatarParty");
        elAvatar.enabled = false;
        _SetHonorIcon(elPartyMember, xuid);
        memberBtn.MoveChildBefore(elAvatar, memberBtn.GetChild(0));
        if (xuid != '0' && xuid)
            _AddOpenPlayerCardAction(memberBtn, xuid);
        else
            _ClearExisitingOnActivateEvent(memberBtn);
        return elPartyMember;
    }
    function _SetHonorIcon(elPartyMember, xuid) {
        const elHonorIcon = elPartyMember.FindChildTraverse('jsHonorIcon');
        if (elHonorIcon) {
            elHonorIcon.Set(PartyListAPI.GetFriendXpTrailLevel(xuid), PartyListAPI.GetFriendPrimeEligible(xuid));
        }
    }
    function _UpdateAvatar(elPartyMember, xuid) {
        let elAvatar = elPartyMember.FindChildInLayoutFile(xuid);
        Avatar.Init(elAvatar, xuid, 'partymember');
    }
    function _SetPartyMemberRank(elPartyMember, xuid) {
        let skillgroupType = PartyListAPI.GetFriendCompetitiveRankType(xuid);
        let skillGroup = PartyListAPI.GetFriendCompetitiveRank(xuid);
        let wins = PartyListAPI.GetFriendCompetitiveWins(xuid);
        let winsNeededForRank = SessionUtil.GetNumWinsNeededForRank(skillgroupType);
        let elRank = elPartyMember.FindChildInLayoutFile('PartyRank');
        $.Msg('_SetPartyMemberRank type=' + skillgroupType + ' xuid=' + xuid + ' wins=' + wins + ' needed=' + winsNeededForRank + ' skill=' + skillGroup);
        if (wins < winsNeededForRank || (wins >= winsNeededForRank && skillGroup < 1) || !PartyListAPI.GetFriendPrimeEligible(xuid)) {
            elRank.visible = false;
            return;
        }
        let imageName = (skillgroupType !== 'Competitive') ? skillgroupType : 'skillgroup';
        elRank.SetImage('file://{images}/icons/skillgroups/' + imageName + skillGroup + '.svg');
        elRank.visible = true;
    }
    function _SetPrimeForMember(elPartyMember, xuid) {
        return;
        // this is now part of honor icon
        // let elPrime = elPartyMember.FindChildInLayoutFile( 'PartyPrime' );
        // elPrime.visible = PartyListAPI.GetFriendPrimeEligible( xuid );
    }
    function _TintForOverPlayerCountForMode(elPartyMember, isOverCount) {
        elPartyMember.SetHasClass('friendtile--warning', isOverCount);
    }
    function _SetLobbyTitle(numPlayersPossibleInMode, numPlayersActuallyInParty) {
        let elPanel = $('#PartyList').FindChildInLayoutFile('PartyListHeader');
        elPanel.FindChildInLayoutFile('PartyCancelBtn').visible = LobbyAPI.BIsHost() && _IsSearching();
        let elCount = elPanel.FindChildInLayoutFile('PartyTitleAlertText');
        elCount.text = numPlayersActuallyInParty + '/' + numPlayersPossibleInMode;
    }
    function _SetAttributeStringsOnAvatarPanel(elAvatar, xuid) {
        elAvatar.SetAttributeString('xuid', xuid);
        elAvatar.SetAttributeString('showleader', _ShowLobbyLeaderIcon(xuid));
    }
    function _ShowLobbyLeaderIcon(xuid) {
        return LobbyAPI.GetHostSteamID() === xuid ? 'show' : '';
    }
    function _AddOpenPlayerCardAction(elPartyMember, xuid) {
        function openCard() {
            // Tell the sidebar to stay open and ignore its on mouse event while the context menu is open
            $.DispatchEvent('SidebarContextMenuActive', true);
            if (xuid != '0') {
                let contextMenuPanel = UiToolkitAPI.ShowCustomLayoutContextMenuParametersDismissEvent('', '', 'file://{resources}/layout/context_menus/context_menu_playercard.xml', 'xuid=' + xuid, () => $.DispatchEvent('SidebarContextMenuActive', false));
                contextMenuPanel.AddClass("ContextMenu_NoArrow");
            }
        }
        ;
        elPartyMember.SetPanelEvent("onactivate", openCard);
        elPartyMember.SetPanelEvent("oncontextmenu", openCard);
    }
    function _ClearExisitingOnActivateEvent(elPartyMember) {
        elPartyMember.SetPanelEvent("onactivate", () => { });
        elPartyMember.SetPanelEvent("onmouseover", () => UiToolkitAPI.ShowTextTooltip(elPartyMember.id, '#tooltip_invite_to_lobby'));
        elPartyMember.SetPanelEvent("onmouseout", () => UiToolkitAPI.HideTextTooltip());
    }
    function _SessionUpdate(updateType) {
        // Store the handlers to the events for the session. If we don't have a session then unregester them.
        if (LobbyAPI.IsSessionActive()) {
            if (m_eventRebuildPartyList == undefined) {
                m_eventRebuildPartyList = $.RegisterForUnhandledEvent("PanoramaComponent_PartyList_RebuildPartyList", _RefreshPartyMembers);
            }
        }
        else {
            if (m_eventRebuildPartyList) {
                $.UnregisterForUnhandledEvent("PanoramaComponent_PartyList_RebuildPartyList", m_eventRebuildPartyList);
                m_eventRebuildPartyList = undefined;
            }
        }
        _RefreshPartyMembers();
        _TintBgForSearch();
    }
    function _TintBgForSearch() {
        let serverWarning = NewsAPI.GetCurrentActiveAlertForUser();
        let isWarning = serverWarning !== '' && serverWarning !== undefined ? true : false;
        $.GetContextPanel().FindChildInLayoutFile('MatchStatusBackground').SetHasClass('party-list__bg--warning', (isWarning && _IsSeaching()));
        $.GetContextPanel().FindChildInLayoutFile('MatchStatusBackground').SetHasClass('party-list__bg--searching', _IsSeaching());
    }
    function _IsSeaching() {
        let StatusString = _GetSearchStatus();
        return (StatusString !== '' && StatusString !== null) ? true : false;
    }
    function _PlayerActivityVoice(xuid) {
        let elPartyMembersList = elPartySection.FindChildInLayoutFile('PartyMembers');
        elPartyMembersList.Children().forEach(element => {
            if (element.Data().xuid === xuid) {
                let elAvatar = element.FindChildInLayoutFile(xuid);
                if (elAvatar) {
                    Avatar.UpdateTalkingState(elAvatar, xuid);
                }
            }
        });
    }
    //--------------------------------------------------------------------------------------------------
    function _UpdateLeaveBtn() {
        let elLeaveBtn = elPartySection.FindChildInLayoutFile('PartyLeaveBtn');
        elLeaveBtn.visible = (!GameStateAPI.IsLocalPlayerPlayingMatch() && LobbyAPI.IsSessionActive());
    }
    function _AddOnActivateLeaveBtn() {
        let elLeaveBtn = elPartySection.FindChildInLayoutFile('PartyLeaveBtn');
        elLeaveBtn.SetPanelEvent('onactivate', () => LobbyAPI.CloseSession());
    }
    //--------------------------------------------------------------------------------------------------
    // Helpers for lobby state
    //--------------------------------------------------------------------------------------------------
    function _GetSearchStatus() {
        return LobbyAPI.GetMatchmakingStatusString();
    }
    function _IsSearching() {
        let StatusString = _GetSearchStatus();
        return (StatusString !== '' && StatusString !== null) ? true : false;
    }
    //--------------------------------------------------------------------------------------------------
    function _ShowMatchmakingStatusTooltipEvent() {
        let btnSettings = $.GetContextPanel().FindChildInLayoutFile('MatchStatusInfo');
        btnSettings.SetPanelEvent('onmouseover', () => {
            UiToolkitAPI.ShowCustomLayoutParametersTooltip('MatchStatusInfo', 'LobbySettingsTooltip', 'file://{resources}/layout/tooltips/tooltip_lobby_settings.xml', 'xuid=' + '');
        });
        btnSettings.SetPanelEvent('onmouseout', () => UiToolkitAPI.HideCustomLayoutTooltip('LobbySettingsTooltip'));
    }
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        _Init();
        $.RegisterForUnhandledEvent("PanoramaComponent_Lobby_MatchmakingSessionUpdate", _SessionUpdate);
        $.RegisterForUnhandledEvent("PanoramaComponent_Lobby_PlayerUpdated", _SessionUpdate);
        $.RegisterForUnhandledEvent("PanoramaComponent_PartyList_PlayerActivityVoice", _PlayerActivityVoice);
    }
})(PartyMenu || (PartyMenu = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFydHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wYXJ0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBQ2xDLGtDQUFrQztBQUNsQyx1Q0FBdUM7QUFFdkMscURBQXFEO0FBQ3JELHVEQUF1RDtBQUN2RCxxREFBcUQ7QUFDckQsSUFBVSxTQUFTLENBK1ZsQjtBQS9WRCxXQUFVLFNBQVM7SUFFbEIsSUFBSSxjQUFjLEdBQUcsQ0FBQyxDQUFFLFlBQVksQ0FBRyxDQUFDO0lBRXhDLElBQUksdUJBQTJDLENBQUM7SUFFaEQsSUFBSSxvQkFBb0IsR0FBRyxDQUFDLENBQUM7SUFFN0IsU0FBUyxLQUFLO1FBRWIsb0JBQW9CLEVBQUUsQ0FBQztRQUN2QixzQkFBc0IsRUFBRSxDQUFDO1FBQ3pCLGtDQUFrQyxFQUFFLENBQUM7SUFDdEMsQ0FBQztJQUVELFNBQVMsb0JBQW9CO1FBRTVCLElBQUssQ0FBQyxnQkFBZ0IsRUFBRSxFQUN4QjtZQUNDLE9BQU87U0FDUDtRQUVELElBQUksYUFBYSxHQUFHLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLElBQUksQ0FBQztRQUN2RCxJQUFLLENBQUMsYUFBYSxFQUNuQjtZQUNDLE9BQU87U0FDUDtRQUVELElBQUksa0JBQWtCLEdBQUcsY0FBYyxDQUFDLHFCQUFxQixDQUFFLGNBQWMsQ0FBRSxDQUFDO1FBQ2hGLHdCQUF3QixFQUFFLENBQUM7UUFFM0Isb0ZBQW9GO1FBQ3BGLElBQUksWUFBWSxHQUFHLFlBQVksRUFBRSxDQUFDO1FBQ2xDLElBQUssb0JBQW9CLElBQUksWUFBWSxDQUFDLDBCQUEwQixFQUFFLElBQUksWUFBWSxFQUN0RjtZQUNDLGtCQUFrQixDQUFDLHVCQUF1QixFQUFFLENBQUM7WUFDN0Msa0JBQWtCLENBQUUsYUFBYSxFQUFFLG9CQUFvQixDQUFFLENBQUM7U0FDMUQ7YUFFRDtZQUND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