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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFydHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wYXJ0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBQ2xDLGtDQUFrQztBQUNsQyx1Q0FBdUM7QUFLdkMsSUFBVSxTQUFTLENBK1ZsQjtBQS9WRCxXQUFVLFNBQVM7SUFFbEIsSUFBSSxjQUFjLEdBQUcsQ0FBQyxDQUFFLFlBQVksQ0FBRyxDQUFDO0lBRXhDLElBQUksdUJBQTJDLENBQUM7SUFFaEQsSUFBSSxvQkFBb0IsR0FBRyxDQUFDLENBQUM7SUFFN0IsU0FBUyxLQUFLO1FBRWIsb0JBQW9CLEVBQUUsQ0FBQztRQUN2QixzQkFBc0IsRUFBRSxDQUFDO1FBQ3pCLGtDQUFrQyxFQUFFLENBQUM7SUFDdEMsQ0FBQztJQUVELFNBQVMsb0JBQW9CO1FBRTVCLElBQUssQ0FBQyxnQkFBZ0IsRUFBRSxFQUN4QjtZQUNDLE9BQU87U0FDUDtRQUVELElBQUksYUFBYSxHQUFHLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLElBQUksQ0FBQztRQUN2RCxJQUFLLENBQUMsYUFBYSxFQUNuQjtZQUNDLE9BQU87U0FDUDtRQUVELElBQUksa0JBQWtCLEdBQUcsY0FBYyxDQUFDLHFCQUFxQixDQUFFLGNBQWMsQ0FBRSxDQUFDO1FBQ2hGLHdCQUF3QixFQUFFLENBQUM7UUFHM0IsSUFBSSxZQUFZLEdBQUcsWUFBWSxFQUFFLENBQUM7UUFDbEMsSUFBSyxvQkFBb0IsSUFBSSxZQUFZLENBQUMsMEJBQTBCLEVBQUUsSUFBSSxZQUFZLEVBQ3RGO1lBQ0Msa0JBQWtCLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztZQUM3QyxrQkFBa0IsQ0FBRSxhQUFhLEVBQUUsb0JBQW9CLENBQUUsQ0FBQztTQUMxRDthQUVEO1lBQ0MsY0FBYyxDQUFDLFFBQVEsQ0FBRSxRQUFRLENBQUUsQ0FBQztZQUNwQyxXQUFXLENBQUMs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