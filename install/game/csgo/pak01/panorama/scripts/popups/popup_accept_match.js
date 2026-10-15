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
        elAvatar.SetDialogVariable('xuid', xuid);
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
    $.RegisterForUnhandledEvent('PanoramaComponent_Lobby_ReadyUpForMatch', _ReadyForMatch);
    $.RegisterForUnhandledEvent('MatchAssistedAccept', OnAcceptMatchPressed);
    $.RegisterForUnhandledEvent('PanoramaComponent_Lobby_ShowPreMatchInterface', ShowPreMatchInterface);
})(PopupAcceptMatch || (PopupAcceptMatch = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfYWNjZXB0X21hdGNoLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvcG9wdXBzL3BvcHVwX2FjY2VwdF9tYXRjaC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBQ3JDLGlEQUFpRDtBQUNqRCxnREFBZ0Q7QUFDaEQsaURBQWlEO0FBQ2pELDREQUE0RDtBQUM1RCwrQ0FBK0M7QUFDL0MsNENBQTRDO0FBQzVDLHFDQUFxQztBQUVyQyxJQUFVLGdCQUFnQixDQWdaekI7QUFoWkQsV0FBVSxnQkFBZ0I7SUFFekIsSUFBSSxrQkFBa0IsR0FBRyxLQUFLLENBQUM7SUFDL0IsSUFBSSxpQkFBaUIsR0FBRyxDQUFDLENBQUM7SUFDMUIsSUFBSSw4QkFBOEIsR0FBRyxDQUFDLENBQUM7SUFDdkMsSUFBSSxxQkFBcUIsR0FBRyxDQUFDLENBQUM7SUFDOUIsSUFBSSxhQUFhLEdBQUcsS0FBSyxDQUFDO0lBQzFCLElBQUksd0JBQXdCLEdBQUcsS0FBSyxDQUFDO0lBQ3JDLElBQUksWUFBWSxHQUFHLEVBQUUsQ0FBQztJQUN0QixJQUFJLFFBQVEsR0FBVyxDQUFDLENBQUM7SUFDekIsSUFBSSxlQUFlLEdBQTJCLElBQUksQ0FBQztJQUNuRCxNQUFNLFNBQVMsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUUsc0JBQXNCLENBQUUsQ0FBQztJQUN0RixJQUFJLHFCQUFxQixHQUFtQixLQUFLLENBQUM7SUFNbEQsU0FBZ0IsSUFBSTtRQUduQixNQUFNLGFBQWEsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUUsa0JBQWtCLENBQUUsQ0FBQztRQUN0RixhQUFhLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUV4QyxNQUFNLFFBQVEsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsa0JBQWtCLENBQUUs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