"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../util_gamemodeflags.ts" />
/// <reference path="../common/formattext.ts" />
/// <reference path="../common/sessionutil.ts" />
/// <reference path="../popups/popup_premier_pick_ban.ts" />
/// <reference path="../common/teamcolor.ts" />
/// <reference path="../rating_emblem.ts" />
/// <reference path="../avatar.ts" />
var PopupAcceptMatch;
(function (PopupAcceptMatch) {
    let m_hasPressedAccept = false;
    let m_numPlayersReady = 0;
    let m_numTotalClientsInReservation = 0;
    let m_numSecondsRemaining = 0;
    let m_isReconnect = false;
    let m_isNqmmAnnouncementOnly = false;
    let m_gsLocation = '';
    let m_gsPing = 0;
    let m_lobbySettings = null;
    const m_elTimer = $.GetContextPanel().FindChildInLayoutFile('AcceptMatchCountdown');
    let m_jsTimerUpdateHandle = false;
    function Init() {
        const elPlayerSlots = $.GetContextPanel().FindChildInLayoutFile('AcceptMatchSlots');
        elPlayerSlots.RemoveAndDeleteChildren();
        const settings = $.GetContextPanel().GetAttributeString('map_and_isreconnect', '');
        m_gsLocation = $.GetContextPanel().GetAttributeString('location', '');
        m_gsPing = parseInt($.GetContextPanel().GetAttributeString('ping', '0'));
        $.GetContextPanel().SetDialogVariable('region', m_gsLocation);
        $.GetContextPanel().SetDialogVariableInt('ping', m_gsPing);
        const settingsList = settings.split(',');
        let map = settingsList[0];
        if (map.charAt(0) === '@') {
            m_isNqmmAnnouncementOnly = true;
            m_hasPressedAccept = true;
            map = map.substr(1);
        }
        m_isReconnect = settingsList[1] === 'true' ? true : false;
        m_lobbySettings = LobbyAPI.GetSessionSettings();
        if (!m_isReconnect && m_lobbySettings && m_lobbySettings.game) {
            const elAgreement = $.GetContextPanel().FindChildInLayoutFile('Agreement');
            elAgreement.visible = true;
            const elAgreementComp = $.GetContextPanel().FindChildInLayoutFile('AcceptMatchAgreementCompetitive');
            elAgreementComp.visible = m_lobbySettings.game.mode === "competitive";
        }
        $.DispatchEvent("ShowReadyUpPanel");
        _SetMatchData(map);
        _UpdateGameServerUi();
        if (m_isNqmmAnnouncementOnly) {
            $('#AcceptMatchDataContainer').SetHasClass('auto', true);
            _UpdateUiState();
            $.DispatchEvent('CSGOPlaySoundEffectMuteBypass', 'popup_accept_match_confirmed_casual', 'MOUSE', 6.0);
            m_jsTimerUpdateHandle = $.Schedule(4.5, _OnNqmmAutoReadyUp);
        }
        _PopulatePlayerList();
        $.DispatchEvent('MuteStreamPanel');
    }
    PopupAcceptMatch.Init = Init;
    function _PopulatePlayerList() {
        let numPlayers = LobbyAPI.GetConfirmedMatchPlayerCount();
        if (!numPlayers || numPlayers <= 2)
            return;
        $.GetContextPanel().SetHasClass("accept-match-with-player-list", true);
        $.GetContextPanel().FindChildInLayoutFile('id-map-draft-phase-teams').RemoveClass('hidden');
        let iYourXuidTeamIdx = 0;
        const yourXuid = MyPersonaAPI.GetXuid();
        for (let i = 0; i < numPlayers; ++i) {
            const xuidPlayer = LobbyAPI.GetConfirmedMatchPlayerByIdx(i);
            if (xuidPlayer && xuidPlayer === yourXuid)
                iYourXuidTeamIdx = (i < (numPlayers / 2)) ? 0 : 1;
        }
        for (let i = 0; i < numPlayers; ++i) {
            let xuid = LobbyAPI.GetConfirmedMatchPlayerByIdx(i);
            if (!xuid) {
                continue;
            }
            const iThisPlayerTeamIdx = (i < (numPlayers / 2)) ? 0 : 1;
            const teamPanelId = (iYourXuidTeamIdx === iThisPlayerTeamIdx) ? 'id-map-draft-phase-your-team' : 'id-map-draft-phase-other-team';
            const elTeammates = $.GetContextPanel().FindChildInLayoutFile(teamPanelId).FindChild('id-map-draft-phase-avatars');
            _MakeAvatar(xuid, elTeammates, true);
        }
    }
    function _MakeAvatar(xuid, elTeammates, bisTeamLister = false) {
        const panelType = bisTeamLister ? 'Button' : 'Panel';
        const elAvatar = $.CreatePanel(panelType, elTeammates, xuid);
        elAvatar.BLoadLayoutSnippet('SmallAvatar');
        if (bisTeamLister) {
            _AddOpenPlayerCardAction(elAvatar, xuid);
        }
        elAvatar.FindChildTraverse('JsAvatarImage').PopulateFromSteamID(xuid);
        const elTeamColor = elAvatar.FindChildInLayoutFile('JsAvatarTeamColor');
        elTeamColor.visible = false;
        const strName = FriendsListAPI.GetFriendName(xuid);
        elAvatar.SetDialogVariable('teammate_name', strName);
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
    function _UpdateGameServerUi() {
        const elGameServer = $.GetContextPanel().FindChildInLayoutFile('AcceptMatchGameServer');
        elGameServer.SetHasClass('hidden', m_hasPressedAccept || m_isReconnect || m_isNqmmAnnouncementOnly ||
            !(m_gsLocation && m_gsPing));
    }
    function _UpdateUiState() {
        _UpdateGameServerUi();
        const btnAccept = $.GetContextPanel().FindChildInLayoutFile('AcceptMatchBtn');
        const elPlayerSlots = $.GetContextPanel().FindChildInLayoutFile('AcceptMatchSlots');
        let bHideTimer = false;
        let bShowPlayerSlots = m_hasPressedAccept || m_isReconnect;
        if (m_isNqmmAnnouncementOnly) {
            bShowPlayerSlots = false;
            bHideTimer = true;
        }
        btnAccept.SetHasClass('hidden', m_hasPressedAccept || m_isReconnect);
        elPlayerSlots.SetHasClass('hidden', !bShowPlayerSlots);
        if (bShowPlayerSlots) {
            _UpdatePlayerSlots(elPlayerSlots);
            bHideTimer = true;
        }
        m_elTimer.GetChild(0).text = "0:" + ((m_numSecondsRemaining < 10) ? "0" : "") + m_numSecondsRemaining;
        m_elTimer.SetHasClass("hidden", bHideTimer || (m_numSecondsRemaining <= 0));
        CancelTimerSound();
    }
    function CancelTimerSound() {
        if (m_jsTimerUpdateHandle) {
            $.CancelScheduled(m_jsTimerUpdateHandle);
            m_jsTimerUpdateHandle = false;
        }
    }
    function _UpdateTimeRemainingSeconds() {
        m_numSecondsRemaining = LobbyAPI.GetReadyTimeRemainingSeconds();
    }
    function _OnTimerUpdate() {
        m_jsTimerUpdateHandle = false;
        _UpdateTimeRemainingSeconds();
        _UpdateUiState();
        if (m_numSecondsRemaining > 0) {
            if (m_hasPressedAccept) {
                $.DispatchEvent('CSGOPlaySoundEffectMuteBypass', 'popup_accept_match_waitquiet', 'MOUSE', 1.0);
            }
            else {
                $.DispatchEvent('CSGOPlaySoundEffectMuteBypass', 'popup_accept_match_beep', 'MOUSE', 1.0);
            }
            m_jsTimerUpdateHandle = $.Schedule(1.0, _OnTimerUpdate);
        }
    }
    function _FriendsListNameChanged(xuid) {
        if (!xuid)
            return;
        const elNameLabel = $.GetContextPanel().FindChildTraverse('xuid');
        if (!elNameLabel)
            return;
        const strName = FriendsListAPI.GetFriendName(xuid);
        elNameLabel.SetDialogVariable('teammate_name', strName);
    }
    function _ReadyForMatch(shouldShow, playersReadyCount, numTotalClientsInReservation) {
        if (!shouldShow) {
            if (m_jsTimerUpdateHandle) {
                $.CancelScheduled(m_jsTimerUpdateHandle);
                m_jsTimerUpdateHandle = false;
            }
            $.DispatchEvent("CloseAcceptPopup");
            $.DispatchEvent('UIPopupButtonClicked', '');
            return;
        }
        if (m_hasPressedAccept && m_numPlayersReady && (playersReadyCount > m_numPlayersReady)) {
            $.DispatchEvent('CSGOPlaySoundEffectMuteBypass', 'popup_accept_match_person', 'MOUSE', 1.0);
        }
        if (playersReadyCount == 1 && numTotalClientsInReservation == 1 && (m_numTotalClientsInReservation > 1)) {
            numTotalClientsInReservation = m_numTotalClientsInReservation;
            playersReadyCount = m_numTotalClientsInReservation;
        }
        m_numPlayersReady = playersReadyCount;
        m_numTotalClientsInReservation = numTotalClientsInReservation;
        _UpdateTimeRemainingSeconds();
        _UpdateUiState();
        m_jsTimerUpdateHandle = $.Schedule(1.0, _OnTimerUpdate);
    }
    function _UpdatePlayerSlots(elPlayerSlots) {
        for (let i = 0; i < m_numTotalClientsInReservation; i++) {
            let Slot = $.GetContextPanel().FindChildInLayoutFile('AcceptMatchSlot' + i);
            if (!Slot) {
                Slot = $.CreatePanel('Panel', elPlayerSlots, 'AcceptMatchSlot' + i);
                Slot.BLoadLayoutSnippet('AcceptMatchPlayerSlot');
            }
            Slot.SetHasClass('accept-match__slots__player--accepted', (i < m_numPlayersReady));
        }
        const labelPlayersAccepted = $.GetContextPanel().FindChildInLayoutFile('AcceptMatchPlayersAccepted');
        labelPlayersAccepted.SetDialogVariableInt('accepted', m_numPlayersReady);
        labelPlayersAccepted.SetDialogVariableInt('slots', m_numTotalClientsInReservation);
        labelPlayersAccepted.text = $.Localize('#match_ready_players_accepted', labelPlayersAccepted);
    }
    function _SetMatchData(map) {
        if (!m_lobbySettings || !m_lobbySettings.game)
            return;
        let gameMode = m_lobbySettings.game.mode;
        if (gameMode === "skirmish")
            gameMode = "gungameprogressive";
        const labelData = $.GetContextPanel().FindChildInLayoutFile('AcceptMatchModeMap');
        let strLocalize = '#match_ready_match_data';
        labelData.SetDialogVariable('mode', $.Localize('#SFUI_GameMode_' + gameMode));
        const flags = parseInt(m_lobbySettings.game.gamemodeflags);
        if (GameModeFlags.DoesModeUseFlags(gameMode) && flags &&
            GameModeFlags.DoesModeShowUserVisibleFlags(gameMode)) {
            labelData.SetDialogVariable('modifier', $.Localize('#play_setting_gamemodeflags_' + gameMode + '_' + flags));
            strLocalize = '#match_ready_match_data_modifier';
        }
        if (MyPersonaAPI.GetElevatedState() === 'elevated' && SessionUtil.DoesGameModeHavePrimeQueue(gameMode) && ((m_lobbySettings.game.prime !== 1) || !SessionUtil.AreLobbyPlayersPrime())) {
            $.GetContextPanel().FindChildInLayoutFile('AcceptMatchWarning').RemoveClass('hidden');
        }
        labelData.SetDialogVariable('map', $.Localize('#SFUI_Map_' + map));
        if ((gameMode === 'competitive') && (map === 'lobby_mapveto')) {
            $('#AcceptMatchModeIcon').SetImage("file://{images}/icons/ui/competitive_teams.svg");
            if (m_lobbySettings.options && m_lobbySettings.options.challengekey) {
                strLocalize = '#match_ready_match_data_map';
                labelData.SetDialogVariable('map', $.Localize('#SFUI_Lobby_LeaderMatchmaking_Type_PremierPrivateQueue'));
            }
        }
        labelData.text = $.Localize(strLocalize, labelData);
        const imgMap = $.GetContextPanel().FindChildInLayoutFile('AcceptMatchMapImage');
        imgMap.style.backgroundImage = 'url("file://{images}/map_icons/screenshots/360p/' + map + '.png")';
    }
    function _OnNqmmAutoReadyUp() {
        m_jsTimerUpdateHandle = false;
        LobbyAPI.SetLocalPlayerReady('deferred');
        $.DispatchEvent("CloseAcceptPopup");
        $.DispatchEvent('UIPopupButtonClicked', '');
    }
    function OnAcceptMatchPressed() {
        m_hasPressedAccept = true;
        $.DispatchEvent('CSGOPlaySoundEffectMuteBypass', 'popup_accept_match_person', 'MOUSE', 1.0);
        LobbyAPI.SetLocalPlayerReady('accept');
    }
    PopupAcceptMatch.OnAcceptMatchPressed = OnAcceptMatchPressed;
    function ShowPreMatchInterface() {
        PremierPickBan.Init();
        $.GetContextPanel().FindChildInLayoutFile('id-accept-match').AddClass('hide');
        CancelTimerSound();
    }
    PopupAcceptMatch.ShowPreMatchInterface = ShowPreMatchInterface;
    $.RegisterForUnhandledEvent('PanoramaComponent_FriendsList_NameChanged', _FriendsListNameChanged);
    $.RegisterForUnhandledEvent('PanoramaComponent_Lobby_ReadyUpForMatch', _ReadyForMatch);
    $.RegisterForUnhandledEvent('MatchAssistedAccept', OnAcceptMatchPressed);
    $.RegisterForUnhandledEvent('PanoramaComponent_Lobby_ShowPreMatchInterface', ShowPreMatchInterface);
})(PopupAcceptMatch || (PopupAcceptMatch = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfYWNjZXB0X21hdGNoLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvcG9wdXBzL3BvcHVwX2FjY2VwdF9tYXRjaC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBQ3JDLGlEQUFpRDtBQUNqRCxnREFBZ0Q7QUFDaEQsaURBQWlEO0FBQ2pELDREQUE0RDtBQUM1RCwrQ0FBK0M7QUFDL0MsNENBQTRDO0FBQzVDLHFDQUFxQztBQUVyQyxJQUFVLGdCQUFnQixDQThaekI7QUE5WkQsV0FBVSxnQkFBZ0I7SUFFekIsSUFBSSxrQkFBa0IsR0FBRyxLQUFLLENBQUM7SUFDL0IsSUFBSSxpQkFBaUIsR0FBRyxDQUFDLENBQUM7SUFDMUIsSUFBSSw4QkFBOEIsR0FBRyxDQUFDLENBQUM7SUFDdkMsSUFBSSxxQkFBcUIsR0FBRyxDQUFDLENBQUM7SUFDOUIsSUFBSSxhQUFhLEdBQUcsS0FBSyxDQUFDO0lBQzFCLElBQUksd0JBQXdCLEdBQUcsS0FBSyxDQUFDO0lBQ3JDLElBQUksWUFBWSxHQUFHLEVBQUUsQ0FBQztJQUN0QixJQUFJLFFBQVEsR0FBVyxDQUFDLENBQUM7SUFDekIsSUFBSSxlQUFlLEdBQTJCLElBQUksQ0FBQztJQUNuRCxNQUFNLFNBQVMsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUUsc0JBQXNCLENBQUUsQ0FBQztJQUN0RixJQUFJLHFCQUFxQixHQUFtQixLQUFLLENBQUM7SUFNbEQsU0FBZ0IsSUFBSTtRQUduQixNQUFNLGFBQWEsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUUsa0JBQWtCLENBQUUsQ0FBQztRQUN0RixhQUFhLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUV4QyxNQUFNLFFBQVEsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsa0JBQWtCLENBQUUscUJBQXFCLEVBQUUsRUFBRSxDQUFFLENBQUM7UUFFckYsWUFBWSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxVQUFVLEVBQUUsRUFBRSxDQUFFLENBQUM7UUFDeEUsUUFBUSxHQUFHLFFBQVEsQ0FBRSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsa0JBQWtCLENBQUUsTUFBTSxFQUFFLEdBQUcsQ0FBRSxDQUFFLENBQUM7UUFFN0UsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGlCQUFpQixDQUFFLFFBQVEsRUFBRSxZQUFZLENBQUUsQ0FBQztRQUNoRSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsb0JBQW9CLENBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBRSxDQUFDO1FBRzdELE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUUsR0FBRyxDQUFFLENBQUM7UUFFM0MsSUFBSSxHQUFHLEdBQUcsWUFBWSxDQUFFLENBQUMsQ0FBRSxDQUFDO1FBQzVCLElBQUssR0FBRyxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsS0FBSyxHQUFHLEVBQzVCO1lBQ0Msd0JBQXdCLEdBQUcsSUFBSSxDQUFDO1lBQ2hDLGtCQUFrQixHQUFHLElBQUksQ0FBQztZQUMxQixHQUFHLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQztTQUN0QjtRQUdELGFBQWEsR0FBRyxZQUFZLENBQUUsQ0FBQyxDQUFFLEtBQUssTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztRQUM1RCxlQUFlLEdBQUcsUUFBUSxDQUFDLGtCQUFrQixFQUFxQixDQUFDO1FBV25FLElBQUssQ0FBQyxhQUFhLElBQUksZUFBZSxJQUFJLGVBQWUsQ0FBQyxJQUFJLEVBQzlEO1lBRUMsTUFBTSxXQUFXLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLFdBQVcsQ0FBRSxDQUFDO1lBQzdFLFdBQVcsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBRTNCLE1BQU0sZUFBZSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxpQ0FBaUMsQ0FBRSxDQUFDO1lBQ3ZHLGVBQWUsQ0FBQyxPQUFPLEdBQUcsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssYUFBYSxDQUFDO1NBQ3RFO1FBRUQsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxrQkFBa0IsQ0FBRSxDQUFDO1FBRXRDLGFBQWEsQ0FBRSxHQUFHLENBQUUsQ0FBQztRQUNyQixtQkFBbUIsRUFBRSxDQUFDO1FBRXRCLElBQUssd0JBQXdCLEVBQzdCO1lBQ0MsQ0FBQyxDQUFFLDJCQUEyQixDQUFHLENBQUMsV0FBVyxDQUFFLE1BQU0sRUFBRSxJQUFJLENBQUUsQ0FBQztZQUM5RCxjQUFjLEVBQUUsQ0FBQztZQUNqQixDQUFDLENBQUMsYUFBYSxDQUFFLCtCQUErQixFQUFFLHFDQUFxQyxFQUFFLE9BQU8sRUFBRSxHQUFHLENBQUUsQ0FBQztZQUN4RyxxQkFBcUIsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFFLEdBQUcsRUFBRSxrQkFBa0IsQ0FBRSxDQUFDO1NBQzlEO1FBRUQsbUJBQW1CLEVBQUUsQ0FBQztRQUV0QixDQUFDLENBQUMsYUFBYSxDQUFFLGlCQUFpQixDQUFFLENBQUM7SUFDdEMsQ0FBQztJQWhFZSxxQkFBSSxPQWdFbkIsQ0FBQTtJQUVELFNBQVMsbUJBQW1CO1FBSTNCLElBQUksVUFBVSxHQUFHLFFBQVEsQ0FBQyw0QkFBNEIsRUFBRSxDQUFDO1FBU3pELElBQUssQ0FBQyxVQUFVLElBQUksVUFBVSxJQUFJLENBQUM7WUFDbEMsT0FBTztRQUVSLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxXQUFXLENBQUUsK0JBQStCLEVBQUUsSUFBSSxDQUFFLENBQUM7UUFFekUsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLDBCQUEwQixDQUFFLENBQUMsV0FBVyxDQUFFLFFBQVEsQ0FBRSxDQUFDO1FBRWhHLElBQUksZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDO1FBQ3pCLE1BQU0sUUFBUSxHQUFHLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUV4QyxLQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxFQUFFLEVBQUUsQ0FBQyxFQUNwQztZQUNDLE1BQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQyw0QkFBNEIsQ0FBRSxDQUFDLENBQUUsQ0FBQztZQUM5RCxJQUFLLFVBQVUsSUFBSSxVQUFVLEtBQUssUUFBUTtnQkFDekMsZ0JBQWdCLEdBQUcsQ0FBRSxDQUFDLEdBQUcsQ0FBRSxVQUFVLEdBQUcsQ0FBQyxDQUFFLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDdkQ7UUFHRCxLQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxFQUFFLEVBQUUsQ0FBQyxFQUNwQztZQUNDLElBQUksSUFBSSxHQUFHLFFBQVEsQ0FBQyw0QkFBNEIsQ0FBRSxDQUFDLENBQUUsQ0FBQztZQUN0RCxJQUFLLENBQUMsSUFBSSxFQUNWO2dCQU1FLFNBQVM7YUFDVjtZQUdELE1BQU0sa0JBQWtCLEdBQUcsQ0FBRSxDQUFDLEdBQUcsQ0FBRSxVQUFVLEdBQUcsQ0FBQyxDQUFFLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDOUQsTUFBTSxXQUFXLEdBQUcsQ0FBRSxnQkFBZ0IsS0FBSyxrQkFBa0IsQ0FBRSxDQUFDLENBQUMsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDLENBQUMsK0JBQStCLENBQUM7WUFDbkksTUFBTSxXQUFXLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLFdBQVcsQ0FBRSxDQUFDLFNBQVMsQ0FBRSw0QkFBNEIsQ0FBRyxDQUFDO1lBQ3hILFdBQVcsQ0FBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBRSxDQUFDO1NBQ3ZDO0lBQ0YsQ0FBQztJQUVELFNBQVMsV0FBVyxDQUFHLElBQVksRUFBRSxXQUFvQixFQUFFLGFBQWEsR0FBRyxLQUFLO1FBRS9FLE1BQU0sU0FBUyxHQUFHLGFBQWEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFDckQsTUFBTSxRQUFRLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBRSxDQUFDO1FBQy9ELFFBQVEsQ0FBQyxrQkFBa0IsQ0FBRSxhQUFhLENBQUUsQ0FBQztRQUU3QyxJQUFLLGFBQWEsRUFDbEI7WUFDQyx3QkFBd0IsQ0FBRSxRQUFRLEVBQUUsSUFBSSxDQUFFLENBQUM7U0FDM0M7UUFFQyxRQUFRLENBQUMsaUJBQWlCLENBQUUsZUFBZSxDQUF5QixDQUFDLG1CQUFtQixDQUFFLElBQUksQ0FBRSxDQUFDO1FBQ25HLE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBRSxtQkFBbUIsQ0FBRSxDQUFDO1FBQzFFLFdBQVcsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1FBRTVCLE1BQU0sT0FBTyxHQUFHLGNBQWMsQ0FBQyxhQUFhLENBQUUsSUFBSSxDQUFFLENBQUM7UUFFckQsUUFBUSxDQUFDLGlCQUFpQixDQUFFLGVBQWUsRUFBRSxPQUFPLENBQUUsQ0FBQztJQUN4RCxDQUFDO0lBRUQsU0FBUyx3QkFBd0IsQ0FBRyxRQUFpQixFQUFFLElBQVk7UUFFbEUsUUFBUSxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsR0FBRyxFQUFFO1lBRzFDLENBQUMsQ0FBQyxhQUFhLENBQUUsMEJBQTBCLEVBQUUsSUFBSSxDQUFFLENBQUM7WUFFcEQsSUFBSyxJQUFJLEtBQUssR0FBRyxFQUNqQjtnQkFDQyxNQUFNLGdCQUFnQixHQUFHLFlBQVksQ0FBQyxpREFBaUQsQ0FDdEYsRUFBRSxFQUNGLEVBQUUsRUFDRixxRUFBcUUsRUFDckUsT0FBTyxHQUFHLElBQUksRUFDZCxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFFLDBCQUEwQixFQUFFLEtBQUssQ0FBRSxDQUMxRCxDQUFDO2dCQUNGLGdCQUFnQixDQUFDLFFBQVEsQ0FBRSxxQkFBcUIsQ0FBRSxDQUFDO2FBQ25EO1FBQ0YsQ0FBQyxDQUFFLENBQUM7SUFDTCxDQUFDO0lBRUQsU0FBUyxtQkFBbUI7UUFFM0IsTUFBTSxZQUFZLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLHVCQUF1QixDQUFFLENBQUM7UUFDMUYsWUFBWSxDQUFDLFdBQVcsQ0FBRSxRQUFRLEVBQUUsa0JBQWtCLElBQUksYUFBYSxJQUFJLHdCQUF3QjtZQUNsRyxDQUFDLENBQUUsWUFBWSxJQUFJLFFBQVEsQ0FBRSxDQUFFLENBQUM7SUFDbEMsQ0FBQztJQUVELFNBQVMsY0FBYztRQUV0QixtQkFBbUIsRUFBRSxDQUFDO1FBQ3RCLE1BQU0sU0FBUyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxnQkFBZ0IsQ0FBRSxDQUFDO1FBQ2hGLE1BQU0sYUFBYSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxrQkFBa0IsQ0FBRSxDQUFDO1FBRXRGLElBQUksVUFBVSxHQUFHLEtBQUssQ0FBQztRQUN2QixJQUFJLGdCQUFnQixHQUFHLGtCQUFrQixJQUFJLGFBQWEsQ0FBQztRQUMzRCxJQUFLLHdCQUF3QixFQUM3QjtZQUNDLGdCQUFnQixHQUFHLEtBQUssQ0FBQztZQUN6QixVQUFVLEdBQUcsSUFBSSxDQUFDO1NBQ2xCO1FBRUQsU0FBUyxDQUFDLFdBQVcsQ0FBRSxRQUFRLEVBQUUsa0JBQWtCLElBQUksYUFBYSxDQUFFLENBQUM7UUFDdkUsYUFBYSxDQUFDLFdBQVcsQ0FBRSxRQUFRLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBRSxDQUFDO1FBRXpELElBQUssZ0JBQWdCLEVBQ3JCO1lBQ0Msa0JBQWtCLENBQUUsYUFBYSxDQUFFLENBQUM7WUFDcEMsVUFBVSxHQUFHLElBQUksQ0FBQztTQUNsQjtRQUVDLFNBQVMsQ0FBQyxRQUFRLENBQUUsQ0FBQyxDQUFlLENBQUMsSUFBSSxHQUFHLElBQUksR0FBRyxDQUFFLENBQUUscUJBQXFCLEdBQUcsRUFBRSxDQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFFLEdBQUcscUJBQXFCLENBQUM7UUFDM0gsU0FBUyxDQUFDLFdBQVcsQ0FBRSxRQUFRLEVBQUUsVUFBVSxJQUFJLENBQUUscUJBQXFCLElBQUksQ0FBQyxDQUFFLENBQUUsQ0FBQztRQUVoRixnQkFBZ0IsRUFBRSxDQUFDO0lBQ3BCLENBQUM7SUFFRCxTQUFTLGdCQUFnQjtRQUV4QixJQUFLLHFCQUFxQixFQUMxQjtZQUNDLENBQUMsQ0FBQyxlQUFlLENBQUUscUJBQXFCLENBQUUsQ0FBQztZQUMzQyxxQkFBcUIsR0FBRyxLQUFLLENBQUM7U0FDOUI7SUFDRixDQUFDO0lBRUQsU0FBUywyQkFBMkI7UUFFbkMscUJBQXFCLEdBQUcsUUFBUSxDQUFDLDRCQUE0QixFQUFFLENBQUM7SUFLakUsQ0FBQztJQUVELFNBQVMsY0FBYztRQUV0QixxQkFBcUIsR0FBRyxLQUFLLENBQUM7UUFFOUIsMkJBQTJCLEVBQUUsQ0FBQztRQUM5QixjQUFjLEVBQUUsQ0FBQztRQUVqQixJQUFLLHFCQUFxQixHQUFHLENBQUMsRUFDOUI7WUFDQyxJQUFLLGtCQUFrQixFQUN2QjtnQkFDQyxDQUFDLENBQUMsYUFBYSxDQUFFLCtCQUErQixFQUFFLDhCQUE4QixFQUFFLE9BQU8sRUFBRSxHQUFHLENBQUUsQ0FBQzthQUNqRztpQkFFRDtnQkFDQyxDQUFDLENBQUMsYUFBYSxDQUFFLCtCQUErQixFQUFFLHlCQUF5QixFQUFFLE9BQU8sRUFBRSxHQUFHLENBQUUsQ0FBQzthQUM1RjtZQUNELHFCQUFxQixHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUUsR0FBRyxFQUFFLGNBQWMsQ0FBRSxDQUFDO1NBQzFEO0lBQ0YsQ0FBQztJQUVELFNBQVMsdUJBQXVCLENBQUcsSUFBWTtRQUc5QyxJQUFLLENBQUMsSUFBSTtZQUFHLE9BQU87UUFDcEIsTUFBTSxXQUFXLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGlCQUFpQixDQUFFLE1BQU0sQ0FBRSxDQUFDO1FBQ3BFLElBQUssQ0FBQyxXQUFXO1lBQUcsT0FBTztRQUUzQixNQUFNLE9BQU8sR0FBRyxjQUFjLENBQUMsYUFBYSxDQUFFLElBQUksQ0FBRSxDQUFDO1FBRXJELFdBQVcsQ0FBQyxpQkFBaUIsQ0FBRSxlQUFlLEVBQUUsT0FBTyxDQUFFLENBQUM7SUFDM0QsQ0FBQztJQUVELFNBQVMsY0FBYyxDQUFHLFVBQW1CLEVBQUUsaUJBQXlCLEVBQUUsNEJBQW9DO1FBSTdHLElBQUssQ0FBQyxVQUFVLEVBQ2hCO1lBQ0MsSUFBSyxxQkFBcUIsRUFDMUI7Z0JBQ0MsQ0FBQyxDQUFDLGVBQWUsQ0FBRSxxQkFBcUIsQ0FBRSxDQUFDO2dCQUMzQyxxQkFBcUIsR0FBRyxLQUFLLENBQUM7YUFDOUI7WUFFRCxDQUFDLENBQUMsYUFBYSxDQUFFLGtCQUFrQixDQUFFLENBQUM7WUFDdEMsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxzQkFBc0IsRUFBRSxFQUFFLENBQUUsQ0FBQztZQUM5QyxPQUFPO1NBQ1A7UUFFRCxJQUFLLGtCQUFrQixJQUFJLGlCQUFpQixJQUFJLENBQUUsaUJBQWlCLEdBQUcsaUJBQWlCLENBQUUsRUFDekY7WUFFQyxDQUFDLENBQUMsYUFBYSxDQUFFLCtCQUErQixFQUFFLDJCQUEyQixFQUFFLE9BQU8sRUFBRSxHQUFHLENBQUUsQ0FBQztTQUM5RjtRQUVELElBQUssaUJBQWlCLElBQUksQ0FBQyxJQUFJLDRCQUE0QixJQUFJLENBQUMsSUFBSSxDQUFFLDhCQUE4QixHQUFHLENBQUMsQ0FBRSxFQUMxRztZQUVDLDRCQUE0QixHQUFHLDhCQUE4QixDQUFDO1lBQzlELGlCQUFpQixHQUFHLDhCQUE4QixDQUFDO1NBQ25EO1FBQ0QsaUJBQWlCLEdBQUcsaUJBQWlCLENBQUM7UUFDdEMsOEJBQThCLEdBQUcsNEJBQTRCLENBQUM7UUFDOUQsMkJBQTJCLEVBQUUsQ0FBQztRQUM5QixjQUFjLEVBQUUsQ0FBQztRQUVqQixxQkFBcUIsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFFLEdBQUcsRUFBRSxjQUFjLENBQUUsQ0FBQztJQUMzRCxDQUFDO0lBRUQsU0FBUyxrQkFBa0IsQ0FBRyxhQUFzQjtRQVVuRCxLQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsOEJBQThCLEVBQUUsQ0FBQyxFQUFFLEVBQ3hEO1lBQ0MsSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLGlCQUFpQixHQUFHLENBQUMsQ0FBRSxDQUFDO1lBRTlFLElBQUssQ0FBQyxJQUFJLEVBQ1Y7Z0JBQ0MsSUFBSSxHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUUsT0FBTyxFQUFFLGFBQWEsRUFBRSxpQkFBaUIsR0FBRyxDQUFDLENBQUUsQ0FBQztnQkFDdEUsSUFBSSxDQUFDLGtCQUFrQixDQUFFLHVCQUF1QixDQUFFLENBQUM7YUFDbkQ7WUFFRCxJQUFJLENBQUMsV0FBVyxDQUFFLHVDQUF1QyxFQUFFLENBQUUsQ0FBQyxHQUFHLGlCQUFpQixDQUFFLENBQUUsQ0FBQztTQUN2RjtRQUVELE1BQU0sb0JBQW9CLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLDRCQUE0QixDQUFhLENBQUM7UUFDbEgsb0JBQW9CLENBQUMsb0JBQW9CLENBQUUsVUFBVSxFQUFFLGlCQUFpQixDQUFFLENBQUM7UUFDM0Usb0JBQW9CLENBQUMsb0JBQW9CLENBQUUsT0FBTyxFQUFFLDhCQUE4QixDQUFFLENBQUM7UUFDckYsb0JBQW9CLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUUsK0JBQStCLEVBQUUsb0JBQW9CLENBQUUsQ0FBQztJQUNqRyxDQUFDO0lBR0QsU0FBUyxhQUFhLENBQUcsR0FBVztRQUVuQyxJQUFLLENBQUMsZUFBZSxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUk7WUFDN0MsT0FBTztRQUVSLElBQUksUUFBUSxHQUFHLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ3pDLElBQUssUUFBUSxLQUFLLFVBQVU7WUFDM0IsUUFBUSxHQUFHLG9CQUFvQixDQUFDO1FBRWpDLE1BQU0sU0FBUyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxvQkFBb0IsQ0FBYSxDQUFDO1FBQy9GLElBQUksV0FBVyxHQUFHLHlCQUF5QixDQUFDO1FBSTVDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxpQkFBaUIsR0FBRyxRQUFRLENBQUUsQ0FBRSxDQUFDO1FBRWxGLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBRSxlQUFlLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBRSxDQUFDO1FBRTdELElBQUssYUFBYSxDQUFDLGdCQUFnQixDQUFFLFFBQVEsQ0FBRSxJQUFJLEtBQUs7WUFDdkQsYUFBYSxDQUFDLDRCQUE0QixDQUFFLFFBQVEsQ0FBRSxFQUN2RDtZQUNDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBRSw4QkFBOEIsR0FBRyxRQUFRLEdBQUcsR0FBRyxHQUFHLEtBQUssQ0FBRSxDQUFFLENBQUM7WUFDakgsV0FBVyxHQUFHLGtDQUFrQyxDQUFDO1NBQ2pEO1FBRUQsSUFBSyxZQUFZLENBQUMsZ0JBQWdCLEVBQUUsS0FBSyxVQUFVLElBQUksV0FBVyxDQUFDLDBCQUEwQixDQUFFLFFBQVEsQ0FBRSxJQUFJLENBQzVHLENBQUUsZUFBZSxDQUFDLElBQUksQ0FBQyxLQUFLLEtBQUssQ0FBQyxDQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsb0JBQW9CLEVBQUUsQ0FDMUUsRUFDRjtZQUNDLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxvQkFBb0IsQ0FBRSxDQUFDLFdBQVcsQ0FBRSxRQUFRLENBQUUsQ0FBQztTQUMxRjtRQUVELFNBQVMsQ0FBQyxpQkFBaUIsQ0FBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxZQUFZLEdBQUcsR0FBRyxDQUFFLENBQUUsQ0FBQztRQUV2RSxJQUFLLENBQUUsUUFBUSxLQUFLLGFBQWEsQ0FBRSxJQUFJLENBQUUsR0FBRyxLQUFLLGVBQWUsQ0FBRSxFQUNsRTtZQUNHLENBQUMsQ0FBRSxzQkFBc0IsQ0FBZSxDQUFDLFFBQVEsQ0FBRSxnREFBZ0QsQ0FBRSxDQUFDO1lBRXhHLElBQUssZUFBZSxDQUFDLE9BQU8sSUFBSSxlQUFlLENBQUMsT0FBTyxDQUFDLFlBQVksRUFDcEU7Z0JBRUMsV0FBVyxHQUFHLDZCQUE2QixDQUFDO2dCQUM1QyxTQUFTLENBQUMsaUJBQWlCLENBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUUsd0RBQXdELENBQUUsQ0FBRSxDQUFDO2FBQzdHO1NBQ0Q7UUFFRCxTQUFTLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUUsV0FBVyxFQUFFLFNBQVMsQ0FBRSxDQUFDO1FBRXRELE1BQU0sTUFBTSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxxQkFBcUIsQ0FBRSxDQUFDO1FBQ2xGLE1BQU0sQ0FBQyxLQUFLLENBQUMsZUFBZSxHQUFHLGtEQUFrRCxHQUFHLEdBQUcsR0FBRyxRQUFRLENBQUM7SUFDcEcsQ0FBQztJQUVELFNBQVMsa0JBQWtCO1FBRTFCLHFCQUFxQixHQUFHLEtBQUssQ0FBQztRQUM5QixRQUFRLENBQUMsbUJBQW1CLENBQUUsVUFBVSxDQUFFLENBQUM7UUFDM0MsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxrQkFBa0IsQ0FBRSxDQUFDO1FBQ3RDLENBQUMsQ0FBQyxhQUFhLENBQUUsc0JBQXNCLEVBQUUsRUFBRSxDQUFFLENBQUM7SUFDL0MsQ0FBQztJQUVELFNBQWdCLG9CQUFvQjtRQUVuQyxrQkFBa0IsR0FBRyxJQUFJLENBQUM7UUFDMUIsQ0FBQyxDQUFDLGFBQWEsQ0FBRSwrQkFBK0IsRUFBRSwyQkFBMkIsRUFBRSxPQUFPLEVBQUUsR0FBRyxDQUFFLENBQUM7UUFDOUYsUUFBUSxDQUFDLG1CQUFtQixDQUFFLFFBQVEsQ0FBRSxDQUFDO0lBQzFDLENBQUM7SUFMZSxxQ0FBb0IsdUJBS25DLENBQUE7SUFFRCxTQUFnQixxQkFBcUI7UUFHcEMsY0FBYyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3RCLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxpQkFBaUIsQ0FBRSxDQUFDLFFBQVEsQ0FBRSxNQUFNLENBQUUsQ0FBQztRQUNsRixnQkFBZ0IsRUFBRSxDQUFDO0lBQ3BCLENBQUM7SUFOZSxzQ0FBcUIsd0JBTXBDLENBQUE7SUFNRCxDQUFDLENBQUMseUJBQXlCLENBQUUsMkNBQTJDLEVBQUUsdUJBQXVCLENBQUUsQ0FBQztJQUNwRyxDQUFDLENBQUMseUJBQXlCLENBQUUseUNBQXlDLEVBQUUsY0FBYyxDQUFFLENBQUM7SUFDekYsQ0FBQyxDQUFDLHlCQUF5QixDQUFFLHFCQUFxQixFQUFFLG9CQUFvQixDQUFFLENBQUM7SUFDM0UsQ0FBQyxDQUFDLHlCQUF5QixDQUFDLCtDQUErQyxFQUFFLHFCQUFxQixDQUFFLENBQUM7QUFDdEcsQ0FBQyxFQTlaUyxnQkFBZ0IsS0FBaEIsZ0JBQWdCLFFBOFp6QiJ9