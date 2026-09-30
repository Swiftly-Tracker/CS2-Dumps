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
    //DEVONLY{
    let spoof10 = false;
    //}DEVONLY
    function Init() {
        // reset dialog
        const elPlayerSlots = $.GetContextPanel().FindChildInLayoutFile('AcceptMatchSlots');
        elPlayerSlots.RemoveAndDeleteChildren();
        const settings = $.GetContextPanel().GetAttributeString('map_and_isreconnect', '');
        m_gsLocation = $.GetContextPanel().GetAttributeString('location', '');
        m_gsPing = parseInt($.GetContextPanel().GetAttributeString('ping', '0'));
        $.GetContextPanel().SetDialogVariable('region', m_gsLocation);
        $.GetContextPanel().SetDialogVariableInt('ping', m_gsPing);
        $.Msg('PopupAcceptMatch ' + settings + ' location = ' + m_gsLocation + ' ping = ' + m_gsPing);
        const settingsList = settings.split(',');
        let map = settingsList[0];
        if (map.charAt(0) === '@') {
            m_isNqmmAnnouncementOnly = true;
            m_hasPressedAccept = true;
            map = map.substr(1);
        }
        // If its a recconect we don't need to show the Accept button
        m_isReconnect = settingsList[1] === 'true' ? true : false;
        m_lobbySettings = LobbyAPI.GetSessionSettings();
        //DEVONLY{
        if (spoof10) {
            m_isNqmmAnnouncementOnly = false;
            m_hasPressedAccept = true;
            m_isReconnect = false;
        }
        //}DEVONLY
        if (!m_isReconnect && m_lobbySettings && m_lobbySettings.game) {
            // agreement parent panel
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
        $.Msg('AcceptMatch._PopulatePlayerList');
        let numPlayers = LobbyAPI.GetConfirmedMatchPlayerCount();
        //DEVONLY{
        if (spoof10) {
            numPlayers = 10;
            _UpdateTimeRemainingSeconds();
            _UpdateUiState();
        }
        //}DEVONLY
        if (!numPlayers || numPlayers <= 2)
            return;
        $.GetContextPanel().SetHasClass("accept-match-with-player-list", true);
        $.GetContextPanel().FindChildInLayoutFile('id-map-draft-phase-teams').RemoveClass('hidden');
        let iYourXuidTeamIdx = 0;
        const yourXuid = MyPersonaAPI.GetXuid();
        // yourXuid should always be on one of the teams
        for (let i = 0; i < numPlayers; ++i) {
            const xuidPlayer = LobbyAPI.GetConfirmedMatchPlayerByIdx(i);
            if (xuidPlayer && xuidPlayer === yourXuid)
                iYourXuidTeamIdx = (i < (numPlayers / 2)) ? 0 : 1;
        }
        // Go through each team we care about and update the players
        for (let i = 0; i < numPlayers; ++i) {
            let xuid = LobbyAPI.GetConfirmedMatchPlayerByIdx(i);
            if (!xuid) {
                //DEVONLY{
                if (spoof10)
                    xuid = yourXuid;
                else
                    //}DEVONLY
                    continue;
            }
            // check if you are in the player list and assing the correct list.
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
        $.Msg('Accept: created player entry ' + xuid + ' = ' + FriendsListAPI.GetFriendName(xuid));
        elAvatar.SetDialogVariable('xuid', xuid);
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
        //DEVONLY{
        if (spoof10)
            m_numSecondsRemaining = 10;
        //}DEVONLY
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
        // Called from event PanoramaComponent_Lobby_ReadyUpForMatch.
        // We are not supposed to show so hide and leave
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
            // $.Msg( "Accept: popup_accept_match_person("+playersReadyCount+">"+m_numPlayersReady+")\n" );
            $.DispatchEvent('CSGOPlaySoundEffectMuteBypass', 'popup_accept_match_person', 'MOUSE', 1.0);
        }
        if (playersReadyCount == 1 && numTotalClientsInReservation == 1 && (m_numTotalClientsInReservation > 1)) { // This is a special notification that we should immediately connect to the match.
            // Try reusing the match size if configured and spoof everybody as "ready".
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
        //DEVONLY{
        if (spoof10) {
            m_numTotalClientsInReservation = 10;
            m_numPlayersReady = 3;
        }
        //}DEVONLY
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
    // Called from $.RegisterForUnhandledEvent( 'ServerReserved', PopupAcceptMatch.SetMatchData )
    function _SetMatchData(map) {
        if (!m_lobbySettings || !m_lobbySettings.game)
            return;
        let gameMode = m_lobbySettings.game.mode;
        if (gameMode === "skirmish")
            gameMode = "gungameprogressive";
        const labelData = $.GetContextPanel().FindChildInLayoutFile('AcceptMatchModeMap');
        let strLocalize = '#match_ready_match_data';
        $.Msg('Accept: mode=' + gameMode + ', map=' + map + ' (' + GameTypesAPI.GetMapGroupAttribute('mg_' + map, 'competitivemod') + ')');
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
                // It's a Private Matchmaking with challenge key, show it as such
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
        $.Msg('Show ShowPreMatchInterface');
        PremierPickBan.Init();
        $.GetContextPanel().FindChildInLayoutFile('id-accept-match').AddClass('hide');
        CancelTimerSound();
    }
    PopupAcceptMatch.ShowPreMatchInterface = ShowPreMatchInterface;
    /*
    UI_COMPONENT_DECLARE_EVENT2( Lobby, ReadyUpForMatch, "shouldShow", bool, "numPlayersReady", int32 );
    Spams once we learn of a new readiness, including when you click ready (if it sends successfully that is).
    */
    $.RegisterForUnhandledEvent('PanoramaComponent_Lobby_ReadyUpForMatch', _ReadyForMatch);
    $.RegisterForUnhandledEvent('MatchAssistedAccept', OnAcceptMatchPressed);
    $.RegisterForUnhandledEvent('PanoramaComponent_Lobby_ShowPreMatchInterface', ShowPreMatchInterface);
})(PopupAcceptMatch || (PopupAcceptMatch = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfYWNjZXB0X21hdGNoLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvcG9wdXBzL3BvcHVwX2FjY2VwdF9tYXRjaC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBQ3JDLGlEQUFpRDtBQUNqRCxnREFBZ0Q7QUFDaEQsaURBQWlEO0FBQ2pELDREQUE0RDtBQUM1RCwrQ0FBK0M7QUFDL0MsNENBQTRDO0FBQzVDLHFDQUFxQztBQUVyQyxJQUFVLGdCQUFnQixDQWdaekI7QUFoWkQsV0FBVSxnQkFBZ0I7SUFFekIsSUFBSSxrQkFBa0IsR0FBRyxLQUFLLENBQUM7SUFDL0IsSUFBSSxpQkFBaUIsR0FBRyxDQUFDLENBQUM7SUFDMUIsSUFBSSw4QkFBOEIsR0FBRyxDQUFDLENBQUM7SUFDdkMsSUFBSSxxQkFBcUIsR0FBRyxDQUFDLENBQUM7SUFDOUIsSUFBSSxhQUFhLEdBQUcsS0FBSyxDQUFDO0lBQzFCLElBQUksd0JBQXdCLEdBQUcsS0FBSyxDQUFDO0lBQ3JDLElBQUksWUFBWSxHQUFHLEVBQUUsQ0FBQztJQUN0QixJQUFJLFFBQVEsR0FBVyxDQUFDLENBQUM7SUFDekIsSUFBSSxlQUFlLEdBQTJCLElBQUksQ0FBQztJQUNuRCxNQUFNLFNBQVMsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUUsc0JBQXNCLENBQUUsQ0FBQztJQUN0RixJQUFJLHFCQUFxQixHQUFtQixLQUFLLENBQUM7SUFFbEQsVUFBVTtJQUNWLElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQztJQUNwQixVQUFVO0lBRVYsU0FBZ0IsSUFBSTtRQUVuQixlQUFlO1FBQ2YsTUFBTSxhQUFhLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLGtCQUFrQixDQUFFLENBQUM7UUFDdEYsYUFBYSxDQUFDLHVCQUF1QixFQUFFLENB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