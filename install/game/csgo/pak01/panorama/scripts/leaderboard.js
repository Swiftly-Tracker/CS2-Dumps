"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="rating_emblem.ts" />
/// <reference path="common/teamcolor.ts" />
$.LogChannel('p.leaderboard', "LV_OFF");
const regionToRegionName = {
    'namc': 'NorthAmerica',
    'samc': 'SouthAmerica',
    'euro': 'Europe',
    'asia': 'Asia',
    'ausc': 'Australia',
    'afrc': 'Africa',
    'cn': 'China',
};
var Leaderboard;
(function (Leaderboard) {
    let m_bEventsRegistered = false;
    let m_myXuid = MyPersonaAPI.GetXuid();
    let m_lbType;
    let m_LeaderboardsDirtyEventHandler;
    let m_LeaderboardsStateChangeEventHandler;
    let m_LobbyPlayerUpdatedEventHandler;
    let m_NameLockEventHandler;
    let m_leaderboardName = '';
    let m_onlyAvailableSeasonLeaderboard = '';
    const IS_NEW_SEASON = false; // when we are in early season, some features are disabled
    const IS_AROUND_PLAYER = true; // when we are showing other players around me then UI looks differently
    function RegisterEventHandlers() {
        $.Msg('[p.leaderboard] RegisterEventHandlers');
        if (!m_bEventsRegistered) {
            m_LeaderboardsDirtyEventHandler = $.RegisterForUnhandledEvent('PanoramaComponent_Leaderboards_Dirty', OnLeaderboardDirty);
            m_LeaderboardsStateChangeEventHandler = $.RegisterForUnhandledEvent('PanoramaComponent_Leaderboards_StateChange', OnLeaderboardStateChange);
            if (m_lbType === 'party') {
                m_LobbyPlayerUpdatedEventHandler = $.RegisterForUnhandledEvent("PanoramaComponent_PartyList_RebuildPartyList", _UpdatePartyList);
            }
            if (m_lbType === 'general') {
                m_NameLockEventHandler = $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_SetPlayerLeaderboardSafeName', _UpdateNameLockButton);
            }
            m_bEventsRegistered = true;
        }
    }
    Leaderboard.RegisterEventHandlers = RegisterEventHandlers;
    function UnregisterEventHandlers() {
        $.Msg('[p.leaderboard] UnregisterEventHandlers');
        if (m_bEventsRegistered) {
            $.UnregisterForUnhandledEvent('PanoramaComponent_Leaderboards_Dirty', m_LeaderboardsDirtyEventHandler);
            $.UnregisterForUnhandledEvent('PanoramaComponent_Leaderboards_StateChange', m_LeaderboardsStateChangeEventHandler);
            if (m_lbType === 'party') {
                $.UnregisterForUnhandledEvent('PanoramaComponent_PartyList_RebuildPartyList', m_LobbyPlayerUpdatedEventHandler);
            }
            if (m_lbType === 'general') {
                $.UnregisterForUnhandledEvent('PanoramaComponent_MyPersona_SetPlayerLeaderboardSafeName', m_NameLockEventHandler);
            }
            m_bEventsRegistered = false;
        }
    }
    Leaderboard.UnregisterEventHandlers = UnregisterEventHandlers;
    function _Init() {
        $.Msg('[p.leaderboard] init');
        m_lbType = $.GetContextPanel().GetAttributeString('lbtype', '');
        RegisterEventHandlers(); // this is also done in ReadyForDisplay which will fire later (but we make sure to not double-register)
        _SetTitle();
        _InitNavPanels();
        _UpdateLeaderboardName();
        if (m_lbType === 'party') {
            _UpdatePartyList();
            // check local players display name
            if (LeaderboardsAPI.DoesTheLocalPlayerNeedALeaderboardSafeNameSet()) {
                _AutomaticLeaderboardNameLockPopup();
            }
        }
        else if (m_lbType === 'general') {
            UpdateLeaderboardList();
            $.Schedule(0.5, _UpdateNameLockButton);
        }
        _ShowGlobalRank();
    }
    function _SetHonorIcon(elPanel, xuid) {
        const elHonorIcon = elPanel.FindChildTraverse('jsHonorIcon');
        if (elHonorIcon) {
            elHonorIcon.Set(PartyListAPI.GetFriendXpTrailLevel(xuid), PartyListAPI.GetFriendPrimeEligible(xuid));
        }
    }
    function _SetTitle() {
        $.GetContextPanel().SetDialogVariable('leaderboard-title', $.Localize('#leaderboard_title_' + String(m_lbType)));
    }
    function _InitSeason() {
        // SEASON
        m_onlyAvailableSeasonLeaderboard = LeaderboardsAPI.GetCurrentSeasonPremierLeaderboard();
        let elSeason = $.GetContextPanel().FindChildTraverse('jsNavSeason');
        elSeason.text = $.Localize('#' + m_onlyAvailableSeasonLeaderboard + '_name');
    }
    let _LastRegionList = '';
    function _MaybeRefreshRegionsDropdown() {
        if (m_lbType === 'party')
            return; // party leaderboard doesn't use regions selector
        let currentRegionList = '(friends)';
        const arrLBsOfInterest = LeaderboardsAPI.GetPremierLeaderboardsOfInterest();
        for (let i = 0; i < arrLBsOfInterest.length; i++) {
            currentRegionList = currentRegionList + '(' + arrLBsOfInterest[i] + ')';
        }
        if (_LastRegionList === currentRegionList) {
            $.Msg('leaderboard.ts: Regions Dropdown Unchanged: ' + currentRegionList);
            return;
        }
        $.Msg('leaderboard.ts: Refreshing Regions Dropdown: ' + currentRegionList);
        _LastRegionList = currentRegionList;
        _InitLocationDropdown(); // re-initialize location dropdown because regions could have changed
    }
    function _InitLocationDropdown() {
        // LOCATION
        let elLocationDropdown = $('#jsNavLocation');
        elLocationDropdown.visible = true;
        elLocationDropdown.RemoveAllOptions();
        let regions = LeaderboardsAPI.GetAllSeasonPremierLeaderboardRegions();
        regions.sort();
        regions.unshift('World');
        regions.unshift('Friends');
        let defaultRegion = 'World';
        for (let i = 0; i < regions.length; i++) {
            const szRegion = regions[i];
            const bCurrentRegion = _FindLocalPlayerInRegion(szRegion);
            // don't make dropdowns for different regions when player is not in those regions (including World)
            // if ( IS_AROUND_PLAYER && !bCurrentRegion && ( szRegion != 'Friends') && ( szRegion != 'World') ) continue;
            if (IS_AROUND_PLAYER && !bCurrentRegion && (szRegion != 'Friends'))
                continue;
            const elEntry = $.CreatePanel('Label', elLocationDropdown, szRegion);
            elEntry.SetHasClass('of-interest', bCurrentRegion && (szRegion != 'Friends') && !IS_NEW_SEASON && !IS_AROUND_PLAYER);
            switch (szRegion) {
                case 'World':
                    elEntry.SetAttributeString('leaderboard-class', szRegion.toLowerCase());
                    break;
                case 'Friends':
                    elEntry.SetAttributeString('friendslb', 'true');
                    elEntry.SetAttributeString('leaderboard-class', 'friends');
                    break;
                default:
                    elEntry.SetAttributeString('location-suffix', '_' + szRegion);
                    elEntry.SetAttributeString('leaderboard-class', szRegion.toLowerCase());
                    if (bCurrentRegion) {
                        defaultRegion = szRegion;
                    }
            }
            elEntry.SetAcceptsFocus(true);
            elEntry.text = $.Localize('#leaderboard_region_' + szRegion);
            elLocationDropdown.AddOption(elEntry);
        }
        // Always set default region to "Friends"
        // if ( MyPersonaAPI.GetLauncherType() === "perfectworld" )
        {
            defaultRegion = 'friends';
        }
        elLocationDropdown.SetSelected(defaultRegion);
    }
    function _getRegionFromLeaderboardName(lbname) {
        return lbname.split('_').slice(-1)[0];
    }
    function _isLeaderboardTheFriendsLeaderboard(lbname) {
        return lbname.split('.').slice(-1)[0] === 'friends';
    }
    function _FindLocalPlayerInRegion(region) {
        let arrLBsOfInterest = LeaderboardsAPI.GetPremierLeaderboardsOfInterest();
        for (let i = 0; i < arrLBsOfInterest.length; i++) {
            switch (region) {
                case 'World':
                    if (arrLBsOfInterest[i] === m_onlyAvailableSeasonLeaderboard)
                        return true;
                    break;
                case 'Friends':
                    if (_isLeaderboardTheFriendsLeaderboard(arrLBsOfInterest[i]))
                        return true;
                    break;
                default:
                    if (_getRegionFromLeaderboardName(arrLBsOfInterest[i]) === region)
                        return true;
            }
        }
        return false;
    }
    function _UpdateLeaderboardName() {
        // Note: if you want the leaderboard filtered to just friends, add ".friends" to the name.
        if (m_lbType === 'general') {
            let elLocationDropdown = $('#jsNavLocation');
            let elregion = elLocationDropdown.GetSelected();
            if (elregion) {
                if (elregion.GetAttributeString('friendslb', '') === 'true') {
                    m_leaderboardName = m_onlyAvailableSeasonLeaderboard + '.friends';
                }
                else {
                    m_leaderboardName = m_onlyAvailableSeasonLeaderboard + elregion.GetAttributeString('location-suffix', '') +
                        (IS_AROUND_PLAYER ? '.self' : '');
                }
                $.GetContextPanel().SwitchClass('region', elregion.GetAttributeString('leaderboard-class', ''));
            }
        }
        else if (m_lbType === 'party') {
            m_leaderboardName = LeaderboardsAPI.GetCurrentSeasonPremierLeaderboard() + '.party';
        }
        $.Msg('[p.leaderboard] ' + m_leaderboardName);
        return m_leaderboardName;
    }
    function _UpdateNameLockButton() {
        let elNameButton = $.GetContextPanel().FindChildTraverse('lbNameButton');
        elNameButton.visible = true;
        let status = MyPersonaAPI.GetMyLeaderboardNameStatus();
        let needsName = LeaderboardsAPI.DoesTheLocalPlayerNeedALeaderboardSafeNameSet();
        let showButton = status !== '' || needsName;
        elNameButton.visible = showButton;
        elNameButton.SetHasClass('no-hover', status !== '');
        elNameButton.ClearPanelEvent('onactivate');
        let buttonText = '';
        if (status) {
            let name = MyPersonaAPI.GetMyLeaderboardName();
            elNameButton.SetDialogVariable('leaderboard-name', name);
            buttonText = $.Localize('#leaderboard_namelock_button_hasname', elNameButton);
            let tooltipText = '';
            switch (status) {
                case 'submitted':
                    elNameButton.SwitchClass('status', 'submitted');
                    tooltipText = $.Localize('#leaderboard_namelock_button_tooltip_submitted');
                    break;
                case 'approved':
                    elNameButton.SwitchClass('status', 'approved');
                    tooltipText = $.Localize('#leaderboard_namelock_button_tooltip_approved');
                    break;
            }
            function onMouseOver(id, tooltipText) {
                UiToolkitAPI.ShowTextTooltip(id, tooltipText);
            }
            elNameButton.SetPanelEvent('onmouseover', onMouseOver.bind(elNameButton, elNameButton.id, tooltipText));
            elNameButton.SetPanelEvent('onmouseout', () => UiToolkitAPI.HideTextTooltip());
        }
        else if (needsName) {
            buttonText = $.Localize('#leaderboard_namelock_button_needsname');
            elNameButton.SetPanelEvent('onactivate', _NameLockPopup);
        }
        elNameButton.SetDialogVariable('leaderboard_namelock_button', buttonText);
    }
    function _InitNavPanels() {
        $('#jsNavLocation').visible = false;
        $('#jsGoToTop').visible = (m_lbType === 'general') && !IS_AROUND_PLAYER;
        $('#jsGoToMe').visible = (m_lbType === 'general') && !IS_AROUND_PLAYER;
        if (m_lbType === 'party')
            return;
        _InitSeason();
        _MaybeRefreshRegionsDropdown();
    }
    function _ShowGlobalRank() {
        let showRank = $.GetContextPanel().GetAttributeString('showglobaloverride', 'true');
        $.GetContextPanel().SetHasClass('hide-global-rank', showRank === 'false');
    }
    function _UpdateGoToMeButton() {
        let lb = m_leaderboardName;
        let arrLBsOfInterest = LeaderboardsAPI.GetPremierLeaderboardsOfInterest();
        let myIndex = LeaderboardsAPI.GetIndexByXuid(lb, m_myXuid);
        let bPresent = arrLBsOfInterest.includes(lb) && myIndex !== -1;
        $.GetContextPanel().FindChildInLayoutFile('jsGoToMe').enabled = bPresent && !IS_NEW_SEASON && !IS_AROUND_PLAYER;
    }
    function _ShowNoData() {
        $.GetContextPanel().FindChildInLayoutFile('id-leaderboard-list').visible = false;
        $.GetContextPanel().SwitchClass('leaderboard-status', 'lb-status-nodata');
    }
    function _ShowNewSeason() {
        $.GetContextPanel().FindChildInLayoutFile('id-leaderboard-list').visible = false;
        $.GetContextPanel().SwitchClass('leaderboard-status', 'lb-status-newseason');
    }
    function _ShowNewSeasonFriends() {
        $.GetContextPanel().FindChildInLayoutFile('id-leaderboard-list').visible = false;
        $.GetContextPanel().SwitchClass('leaderboard-status', 'lb-status-newseason-friends');
    }
    function _ShowLoading() {
        $.GetContextPanel().FindChildInLayoutFile('id-leaderboard-list').visible = false;
        $.GetContextPanel().SwitchClass('leaderboard-status', 'lb-status-loading');
    }
    function _ShowLeaderboards() {
        $.GetContextPanel().FindChildInLayoutFile('id-leaderboard-list').visible = true;
        $.GetContextPanel().SwitchClass('leaderboard-status', 'lb-status-ready');
        if (m_lbType === 'general' && IS_AROUND_PLAYER) {
            GoToSelf();
        }
    }
    function UpdateLeaderboardList() {
        $.Msg('[p.leaderboard] -------------- UpdateLeaderboardList ' + m_leaderboardName);
        _UpdateGoToMeButton();
        let count = LeaderboardsAPI.GetCount(m_leaderboardName);
        let status = LeaderboardsAPI.GetState(m_leaderboardName);
        $.Msg('[p.leaderboard] ' + status + '');
        let seasonName = $.Localize('#' + m_onlyAvailableSeasonLeaderboard + '_name');
        $.GetContextPanel().SetDialogVariable('season_name', seasonName);
        if ("ready" == status && count !== 0) {
            _FillOutEntries();
        }
        if (1 <= LeaderboardsAPI.HowManyMinutesAgoCached(m_leaderboardName)) {
            LeaderboardsAPI.Refresh(m_leaderboardName);
            $.Msg('[p.leaderboard] leaderboard status: requested');
        }
        // friends
        if (m_leaderboardName.includes('friends')) {
            if (count == 0) {
                _ShowNewSeasonFriends();
            }
            else {
                _ShowLeaderboards();
            }
            return;
        }
        if (IS_NEW_SEASON) {
            _ShowNewSeason();
        }
        else {
            if (("none" == status) || ("ready" == status && count == 0)) {
                if (IS_AROUND_PLAYER)
                    _ShowNewSeasonFriends(); // always show the message about "you need to establish a rating"
                else
                    _ShowNoData();
            }
            else if ("loading" == status) {
                _ShowLoading();
            }
            else if ("ready" == status) {
                _ShowLeaderboards();
            }
        }
    }
    Leaderboard.UpdateLeaderboardList = UpdateLeaderboardList;
    function _AddPlayer(elEntry, oPlayer, index) {
        elEntry.SetDialogVariable('player-rank', '');
        elEntry.SetDialogVariable('player-name', '');
        elEntry.SetDialogVariable('player-wins', '');
        elEntry.SetDialogVariable('player-winrate', '');
        elEntry.SetDialogVariable('player-percentile', '');
        elEntry.SetHasClass('no-hover', oPlayer === null);
        elEntry.SetHasClass('background', index % 2 === 0);
        let elAvatar = elEntry.FindChildInLayoutFile('leaderboard-entry-avatar');
        elAvatar.visible = false;
        if (oPlayer) {
            function _AddOpenPlayerCardAction(elPanel, xuid) {
                function openCard() {
                    if (xuid && (xuid !== 0)) {
                        // Tell the sidebar to stay open and ignore its on mouse event while the context menu is open
                        $.DispatchEvent('SidebarContextMenuActive', true);
                        let contextMenuPanel = UiToolkitAPI.ShowCustomLayoutContextMenuParametersDismissEvent('', '', 'file://{resources}/layout/context_menus/context_menu_playercard.xml', 'xuid=' + xuid, () => $.DispatchEvent('SidebarContextMenuActive', false));
                        contextMenuPanel.AddClass("ContextMenu_NoArrow");
                    }
                }
                elPanel.SetPanelEvent("onactivate", openCard);
                elPanel.SetPanelEvent("oncontextmenu", openCard);
            }
            elEntry.enabled = true;
            if (m_lbType === 'party' && oPlayer.XUID) {
                elAvatar.PopulateFromSteamID(oPlayer.XUID);
                elAvatar.visible = true;
                _SetHonorIcon(elEntry, oPlayer.XUID);
            }
            else {
                elAvatar.visible = false;
            }
            let elRatingEmblem = elEntry.FindChildTraverse('jsRatingEmblem');
            if (m_lbType === 'party') {
                const teamColorIdx = PartyListAPI.GetPartyMemberSetting(oPlayer.XUID, 'game/teamcolor');
                const teamColorRgb = TeamColor.GetTeamColor(Number(teamColorIdx));
                elAvatar.style.border = '2px solid rgb(' + teamColorRgb + ')';
            }
            _AddOpenPlayerCardAction(elEntry, oPlayer.XUID);
            let options;
            // set the cs rating explicitly if from the leaderboard,
            if (m_lbType === 'party') {
                options =
                    {
                        root_panel: elRatingEmblem,
                        //	xuid: oPlayer.XUID!,
                        //	api: 'partylist',
                        rating_type: 'Premier',
                        do_fx: true,
                        leaderboard_details: oPlayer,
                        full_details: false,
                        local_player: oPlayer.XUID === MyPersonaAPI.GetXuid()
                    };
            }
            else {
                options =
                    {
                        root_panel: elRatingEmblem,
                        rating_type: 'Premier',
                        do_fx: true,
                        leaderboard_details: oPlayer,
                        full_details: false,
                        local_player: oPlayer.XUID === MyPersonaAPI.GetXuid()
                    };
            }
            RatingEmblem.SetXuid(options);
            elEntry.SetDialogVariable('partyxuid', oPlayer.XUID ?? '');
            elEntry.SetDialogVariable('xuid', oPlayer.XUID ?? '');
            elEntry.SetDialogVariable('player-name', oPlayer.displayName ?? '');
            let elPlayerNameLabel = elEntry.FindChildTraverse('jsPlayerName');
            if (m_lbType === 'party' && oPlayer.XUID) {
                elPlayerNameLabel.SetLocString('#friends_name_in_party_leaderboard');
            }
            else if (oPlayer.displayName) {
                elPlayerNameLabel.SetLocString('#friends_name_generic');
            }
            else {
                elPlayerNameLabel.SetLocString('#friends_name_from_steam');
            }
            elEntry.SetDialogVariable('player-wins', oPlayer.hasOwnProperty('matchesWon') ? String(oPlayer.matchesWon) : '-');
            let bHasRank = oPlayer.hasOwnProperty('rank') && oPlayer.rank > 0;
            elEntry.SetDialogVariableInt('player-rank', bHasRank ? oPlayer.rank : 0);
            elEntry.FindChildTraverse('jsPlayerRank').text = bHasRank ? $.Localize('{d:player-rank}', elEntry) : '-';
            let canShowWinRate = oPlayer.hasOwnProperty('matchesWon') && oPlayer.hasOwnProperty('matchesTied') && oPlayer.hasOwnProperty('matchesLost');
            if (canShowWinRate) {
                let matchesPlayed = (oPlayer.matchesWon ? oPlayer.matchesWon : 0) +
                    (oPlayer.matchesTied ? oPlayer.matchesTied : 0) +
                    (oPlayer.matchesLost ? oPlayer.matchesLost : 0);
                let winRate = matchesPlayed === 0 ? 0 : oPlayer.matchesWon * 100.00 / matchesPlayed;
                elEntry.SetDialogVariable('player-winrate', winRate.toFixed(2) + '%');
            }
            else {
                elEntry.SetDialogVariable('player-winrate', '-');
            }
            elEntry.SetDialogVariable('player-percentile', (oPlayer.hasOwnProperty('pct') && oPlayer.pct && oPlayer.pct > 0) ? oPlayer.pct.toFixed(0) + '%' : '-');
            elEntry.SetDialogVariable('player-region', (oPlayer.hasOwnProperty('region')) ? $.Localize('#leaderboard_region_abbr_' + regionToRegionName[oPlayer.region]) : '-');
        }
        return elEntry;
    }
    function _UpdatePartyList() {
        if (m_lbType !== 'party')
            return;
        let elStatus = $.GetContextPanel().FindChildInLayoutFile('id-leaderboard-loading');
        let elNoData = $.GetContextPanel().FindChildInLayoutFile('id-leaderboard-nodata');
        let elLeaderboardList = $.GetContextPanel().FindChildInLayoutFile('id-leaderboard-list');
        elLeaderboardList.SetHasClass('hidden', false);
        elStatus.SetHasClass('hidden', true);
        elNoData.SetHasClass('hidden', true);
        function OnMouseOver(xuid) {
            $.DispatchEvent('LeaderboardHoverPlayer', xuid);
        }
        function OnMouseOut() {
            $.DispatchEvent('LeaderboardHoverPlayer', '');
        }
        let elList = $.GetContextPanel().FindChildInLayoutFile('id-leaderboard-entries');
        if (LobbyAPI.IsSessionActive()) {
            let members = LobbyAPI.GetSessionSettings().members;
            function GetPartyLBRow(idx) {
                let oPlayer = null;
                let machine = 'machine' + idx;
                let bValidPartyPlayer = members.hasOwnProperty(machine) && members[machine].hasOwnProperty('player0') &&
                    members[machine].player0.hasOwnProperty('xuid');
                if (!bValidPartyPlayer)
                    return null;
                let xuid = members[machine].player0.xuid;
                oPlayer = LeaderboardsAPI.GetEntryDetailsObjectByXuid(m_leaderboardName, xuid);
                // party member isn't on the leaderboards
                if (!oPlayer.XUID) {
                    oPlayer.XUID = xuid;
                }
                // ... and always use the most up-to-date data from the party for the fields we can use
                if (PartyListAPI.GetFriendCompetitiveRankType(xuid) === "Premier") {
                    let partyScore = PartyListAPI.GetFriendCompetitiveRank(xuid);
                    let partyWins = PartyListAPI.GetFriendCompetitiveWins(xuid);
                    if (partyScore || partyWins) {
                        oPlayer.score = PartyListAPI.GetFriendCompetitiveRank(xuid);
                        oPlayer.matchesWon = PartyListAPI.GetFriendCompetitiveWins(xuid);
                        oPlayer.rankWindowStats = PartyListAPI.GetFriendCompetitivePremierWindowStatsObject(xuid);
                        $.Msg('[p.leaderboard] PartyList player ' + xuid + ' score=' + oPlayer.score + ' wins=' + oPlayer.matchesWon + ' data={' + JSON.stringify(oPlayer) + '}');
                    }
                }
                return oPlayer;
            }
            elList.SetLoadListItemFunction((parent, nPanelIdx, reusePanel) => {
                let oPlayer = GetPartyLBRow(nPanelIdx);
                if (!reusePanel || !reusePanel.IsValid()) {
                    reusePanel = $.CreatePanel("Button", elList, oPlayer ? oPlayer.XUID : '');
                    reusePanel.BLoadLayoutSnippet("leaderboard-entry");
                }
                _AddPlayer(reusePanel, oPlayer, nPanelIdx);
                reusePanel.SetPanelEvent('onmouseover', oPlayer ? OnMouseOver.bind(reusePanel, oPlayer.XUID) : OnMouseOut);
                reusePanel.SetPanelEvent('onmouseout', OnMouseOut);
                return reusePanel;
            });
            elList.UpdateListItems(PartyListAPI.GetCount());
        }
    }
    function OnLeaderboardDirty(type) {
        $.Msg('[p.leaderboard] OnLeaderboardDirty');
        if (m_leaderboardName && m_leaderboardName === type) {
            _MaybeRefreshRegionsDropdown();
            LeaderboardsAPI.Refresh(m_leaderboardName);
        }
    }
    function ReadyForDisplay() {
        $.Msg("[p.leaderboard] ReadyForDisplay");
        RegisterEventHandlers();
        _MaybeRefreshRegionsDropdown();
        if (m_leaderboardName) {
            LeaderboardsAPI.Refresh(m_leaderboardName);
        }
    }
    Leaderboard.ReadyForDisplay = ReadyForDisplay;
    function UnReadyForDisplay() {
        $.Msg("[p.leaderboard] UnReadyForDisplay");
        UnregisterEventHandlers();
    }
    Leaderboard.UnReadyForDisplay = UnReadyForDisplay;
    function _NameLockPopup() {
        UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_leaderboard_namelock.xml');
    }
    function _AutomaticLeaderboardNameLockPopup() {
        let data = $.GetContextPanel().Data();
        let bAlreadyAsked = data && data.bPromptedForLeaderboardSafeName;
        if (bAlreadyAsked)
            return;
        _NameLockPopup();
        data.bPromptedForLeaderboardSafeName = true;
    }
    function _FillOutEntries() {
        let nPlayers = LeaderboardsAPI.GetCount(m_leaderboardName);
        $.Msg('[p.leaderboard] ' + nPlayers + ' accounts found.');
        const elList = $.GetContextPanel().FindChildInLayoutFile('id-leaderboard-entries');
        elList.SetLoadListItemFunction((parent, nPanelIdx, reusePanel) => {
            let oPlayer = LeaderboardsAPI.GetEntryDetailsObjectByIndex(m_leaderboardName, nPanelIdx);
            if (!reusePanel || !reusePanel.IsValid()) {
                reusePanel = $.CreatePanel("Button", elList, oPlayer ? oPlayer.XUID : '');
                reusePanel.BLoadLayoutSnippet("leaderboard-entry");
            }
            _AddPlayer(reusePanel, oPlayer, nPanelIdx);
            reusePanel.SetHasClass('local-player', (oPlayer ? oPlayer.XUID : '') === m_myXuid);
            return reusePanel;
        });
        elList.UpdateListItems(nPlayers);
        if (m_lbType === 'general' && IS_AROUND_PLAYER)
            GoToSelf();
        else
            GoToTop();
    }
    function OnLeaderboardStateChange(type) {
        $.Msg('[p.leaderboard] OnLeaderboardStateChange');
        $.Msg('[p.leaderboard] leaderboard status: received');
        if (m_leaderboardName === type) {
            if (m_lbType === 'party') {
                _UpdatePartyList();
            }
            else if (m_lbType === 'general') {
                UpdateLeaderboardList();
            }
            return;
        }
    }
    Leaderboard.OnLeaderboardStateChange = OnLeaderboardStateChange;
    // called when we change one of the dropdowns and want a different leaderboard
    function OnLeaderboardChange() {
        _UpdateLeaderboardName();
        UpdateLeaderboardList();
    }
    Leaderboard.OnLeaderboardChange = OnLeaderboardChange;
    function GoToSelf() {
        let myIndex = LeaderboardsAPI.GetIndexByXuid(m_leaderboardName, m_myXuid);
        $.Msg('leaderboards.ts: GoToSelf: ' + m_leaderboardName + ' (' + m_myXuid + ') --> ' + myIndex);
        const elList = $.GetContextPanel().FindChildInLayoutFile('id-leaderboard-entries');
        $.DispatchEvent('ScrollToDelayLoadListItem', elList, myIndex, 'center', true);
    }
    Leaderboard.GoToSelf = GoToSelf;
    function GoToTop() {
        $.Msg('leaderboards.ts: GoToTop: ' + m_leaderboardName);
        const elList = $.GetContextPanel().FindChildInLayoutFile('id-leaderboard-entries');
        $.DispatchEvent('ScrollToDelayLoadListItem', elList, 0, 'topleft', true);
    }
    Leaderboard.GoToTop = GoToTop;
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        $.RegisterEventHandler('ReadyForDisplay', $.GetContextPanel(), Leaderboard.ReadyForDisplay);
        $.RegisterEventHandler('UnreadyForDisplay', $.GetContextPanel(), Leaderboard.UnReadyForDisplay);
        _Init();
    }
})(Leaderboard || (Leaderboard = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGVhZGVyYm9hcmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9sZWFkZXJib2FyZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBQ2xDLHlDQUF5QztBQUN6Qyw0Q0FBNEM7QUFFNUMsQ0FBQyxDQUFDLFVBQVUsQ0FBRSxlQUFlLEVBQUUsUUFBUSxDQUFFLENBQUM7QUFjMUMsTUFBTSxrQkFBa0IsR0FBOEI7SUFDckQsTUFBTSxFQUFFLGNBQWM7SUFDdEIsTUFBTSxFQUFFLGNBQWM7SUFDdEIsTUFBTSxFQUFFLFFBQVE7SUFDaEIsTUFBTSxFQUFFLE1BQU07SUFDZCxNQUFNLEVBQUUsV0FBVztJQUNuQixNQUFNLEVBQUUsUUFBUTtJQUNoQixJQUFJLEVBQUUsT0FBTztDQUNiLENBQUE7QUFFRCxJQUFVLFdBQVcsQ0FzekJwQjtBQXR6QkQsV0FBVSxXQUFXO0lBRXBCLElBQUksbUJBQW1CLEdBQUcsS0FBSyxDQUFDO0lBQ2hDLElBQUksUUFBUSxHQUFHLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUN0QyxJQUFJLFFBQTJCLENBQUM7SUFFaEMsSUFBSSwrQkFBdUMsQ0FBQztJQUM1QyxJQUFJLHFDQUE2QyxDQUFDO0lBQ2xELElBQUksZ0NBQXdDLENBQUM7SUFDN0MsSUFBSSxzQkFBOEIsQ0FBQztJQUVuQyxJQUFJLGlCQUFpQixHQUFXLEVBQUUsQ0FBQztJQUVuQyxJQUFJLGdDQUFnQyxHQUFXLEVBQUUsQ0FBQztJQUVsRCxNQUFNLGFBQWEsR0FBRyxLQUFLLENBQUMsQ0FBQywwREFBMEQ7SUFDdkYsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsQ0FBQyx3RUFBd0U7SUFFdkcsU0FBZ0IscUJBQXFCO1FBRXBDLENBQUMsQ0FBQyxHQUFHLENBQUUsdUNBQXVDLENBQUUsQ0FBQztRQUVqRCxJQUFLLENBQUMsbUJBQW1CLEVBQ3pCO1lBQ0Ms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