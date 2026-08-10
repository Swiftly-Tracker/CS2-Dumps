"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="avatar.ts" />
/// <reference path="friendslist.ts" />
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
                _SetPartyMemberName(elPartyMemberCurrent, xuid);
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
    function _SetPartyMemberName(elPartyMember, xuid) {
        let elName = elPartyMember.FindChildInLayoutFile('JsFriendName');
        elName.text = FriendsListAPI.GetFriendName(xuid);
    }
    function _SetPartyMemberRank(elPartyMember, xuid) {
        let skillgroupType = PartyListAPI.GetFriendCompetitiveRankType(xuid);
        let skillGroup = PartyListAPI.GetFriendCompetitiveRank(xuid);
        let wins = PartyListAPI.GetFriendCompetitiveWins(xuid);
        let winsNeededForRank = SessionUtil.GetNumWinsNeededForRank(skillgroupType);
        let elRank = elPartyMember.FindChildInLayoutFile('PartyRank');
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
    function _UpdateLeaveBtn() {
        let elLeaveBtn = elPartySection.FindChildInLayoutFile('PartyLeaveBtn');
        elLeaveBtn.visible = (!GameStateAPI.IsLocalPlayerPlayingMatch() && LobbyAPI.IsSessionActive());
    }
    function _AddOnActivateLeaveBtn() {
        let elLeaveBtn = elPartySection.FindChildInLayoutFile('PartyLeaveBtn');
        elLeaveBtn.SetPanelEvent('onactivate', () => LobbyAPI.CloseSession());
    }
    function _GetSearchStatus() {
        return LobbyAPI.GetMatchmakingStatusString();
    }
    function _IsSearching() {
        let StatusString = _GetSearchStatus();
        return (StatusString !== '' && StatusString !== null) ? true : false;
    }
    function _ShowMatchmakingStatusTooltipEvent() {
        let btnSettings = $.GetContextPanel().FindChildInLayoutFile('MatchStatusInfo');
        btnSettings.SetPanelEvent('onmouseover', () => {
            UiToolkitAPI.ShowCustomLayoutParametersTooltip('MatchStatusInfo', 'LobbySettingsTooltip', 'file://{resources}/layout/tooltips/tooltip_lobby_settings.xml', 'xuid=' + '');
        });
        btnSettings.SetPanelEvent('onmouseout', () => UiToolkitAPI.HideCustomLayoutTooltip('LobbySettingsTooltip'));
    }
    {
        _Init();
        $.RegisterForUnhandledEvent("PanoramaComponent_Lobby_MatchmakingSessionUpdate", _SessionUpdate);
        $.RegisterForUnhandledEvent("PanoramaComponent_Lobby_PlayerUpdated", _SessionUpdate);
        $.RegisterForUnhandledEvent("PanoramaComponent_PartyList_PlayerActivityVoice", _PlayerActivityVoice);
    }
})(PartyMenu || (PartyMenu = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFydHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wYXJ0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBQ2xDLGtDQUFrQztBQUNsQyx1Q0FBdUM7QUFLdkMsSUFBVSxTQUFTLENBcVdsQjtBQXJXRCxXQUFVLFNBQVM7SUFFbEIsSUFBSSxjQUFjLEdBQUcsQ0FBQyxDQUFFLFlBQVksQ0FBRyxDQUFDO0lBRXhDLElBQUksdUJBQTJDLENBQUM7SUFFaEQsSUFBSSxvQkFBb0IsR0FBRyxDQUFDLENBQUM7SUFFN0IsU0FBUyxLQUFLO1FBRWIsb0JBQW9CLEVBQUUsQ0FBQztRQUN2QixzQkFBc0IsRUFBRSxDQUFDO1FBQ3pCLGtDQUFrQyxFQUFFLENBQUM7SUFDdEMsQ0FBQztJQUVELFNBQVMsb0JBQW9CO1FBRTVCLElBQUssQ0FBQyxnQkFBZ0IsRUFBRSxFQUN4QjtZQUNDLE9BQU87U0FDUDtRQUVELElBQUksYUFBYSxHQUFHLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLElBQUksQ0FBQztRQUN2RCxJQUFLLENBQUMsYUFBYSxFQUNuQjtZQUNDLE9BQU87U0FDUDtRQUVELElBQUksa0JBQWtCLEdBQUcsY0FBYyxDQUFDLHFCQUFxQixDQUFFLGNBQWMsQ0FBRSxDQUFDO1FBQ2hGLHdCQUF3QixFQUFFLENBQUM7UUFHM0IsSUFBSSxZQUFZLEdBQUcsWUFBWSxFQUFFLENBQUM7UUFDbEMsSUFBSyxvQkFBb0IsSUFBSSxZQUFZLENBQUMsMEJBQTBCLEVBQUUsSUFBSSxZQUFZLEVBQ3RGO1lBQ0Msa0JBQWtCLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztZQUM3QyxrQkFBa0IsQ0FBRSxhQUFhLEVBQUUsb0JBQW9CLENBQUUsQ0FBQztTQUMxRDthQUVEO1lBQ0MsY0FBYyxDQUFDLFFBQVEsQ0FBRSxRQUFRLENBQUUsQ0FBQztZQUNwQyxXQUFXLENBQUMs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