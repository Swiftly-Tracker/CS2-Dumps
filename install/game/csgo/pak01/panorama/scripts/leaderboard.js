"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="rating_emblem.ts" />
/// <reference path="common/teamcolor.ts" />
/// <reference path="honor_icon.ts" />
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
    function _msg(msg) {
    }
    let m_bEventsRegistered = false;
    let m_myXuid = MyPersonaAPI.GetXuid();
    let m_lbType;
    let m_LeaderboardsDirtyEventHandler;
    let m_LeaderboardsStateChangeEventHandler;
    let m_FriendsListNameChangedEventHandler;
    let m_LobbyPlayerUpdatedEventHandler;
    let m_NameLockEventHandler;
    let m_leaderboardName = '';
    let m_onlyAvailableSeasonLeaderboard = '';
    const IS_NEW_SEASON = false;
    const IS_AROUND_PLAYER = true;
    function RegisterEventHandlers() {
        _msg('RegisterEventHandlers');
        if (!m_bEventsRegistered) {
            m_LeaderboardsDirtyEventHandler = $.RegisterForUnhandledEvent('PanoramaComponent_Leaderboards_Dirty', OnLeaderboardDirty);
            m_LeaderboardsStateChangeEventHandler = $.RegisterForUnhandledEvent('PanoramaComponent_Leaderboards_StateChange', OnLeaderboardStateChange);
            m_FriendsListNameChangedEventHandler = $.RegisterForUnhandledEvent('PanoramaComponent_FriendsList_NameChanged', _UpdateName);
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
        _msg('UnregisterEventHandlers');
        if (m_bEventsRegistered) {
            $.UnregisterForUnhandledEvent('PanoramaComponent_Leaderboards_Dirty', m_LeaderboardsDirtyEventHandler);
            $.UnregisterForUnhandledEvent('PanoramaComponent_Leaderboards_StateChange', m_LeaderboardsStateChangeEventHandler);
            $.UnregisterForUnhandledEvent('PanoramaComponent_FriendsList_NameChanged', m_FriendsListNameChangedEventHandler);
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
        _msg('init');
        m_lbType = $.GetContextPanel().GetAttributeString('lbtype', '');
        RegisterEventHandlers();
        _SetTitle();
        _InitNavPanels();
        _UpdateLeaderboardName();
        if (m_lbType === 'party') {
            _UpdatePartyList();
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
        m_onlyAvailableSeasonLeaderboard = LeaderboardsAPI.GetCurrentSeasonPremierLeaderboard();
        let elSeason = $.GetContextPanel().FindChildTraverse('jsNavSeason');
        elSeason.text = $.Localize('#' + m_onlyAvailableSeasonLeaderboard + '_name');
    }
    let _LastRegionList = '';
    function _MaybeRefreshRegionsDropdown() {
        if (m_lbType === 'party')
            return;
        let currentRegionList = '(friends)';
        const arrLBsOfInterest = LeaderboardsAPI.GetPremierLeaderboardsOfInterest();
        for (let i = 0; i < arrLBsOfInterest.length; i++) {
            currentRegionList = currentRegionList + '(' + arrLBsOfInterest[i] + ')';
        }
        if (_LastRegionList === currentRegionList) {
            return;
        }
        _LastRegionList = currentRegionList;
        _InitLocationDropdown();
    }
    function _InitLocationDropdown() {
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
        _msg(m_leaderboardName);
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
        _msg('-------------- UpdateLeaderboardList ' + m_leaderboardName);
        _UpdateGoToMeButton();
        let count = LeaderboardsAPI.GetCount(m_leaderboardName);
        let status = LeaderboardsAPI.GetState(m_leaderboardName);
        _msg(status + '');
        let seasonName = $.Localize('#' + m_onlyAvailableSeasonLeaderboard + '_name');
        $.GetContextPanel().SetDialogVariable('season_name', seasonName);
        if ("ready" == status && count !== 0) {
            _FillOutEntries();
        }
        if (1 <= LeaderboardsAPI.HowManyMinutesAgoCached(m_leaderboardName)) {
            LeaderboardsAPI.Refresh(m_leaderboardName);
            _msg('leaderboard status: requested');
        }
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
                    _ShowNewSeasonFriends();
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
            if (m_lbType === 'party') {
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
            elEntry.SetDialogVariable('player-name', oPlayer.displayName ?? FriendsListAPI.GetFriendName(oPlayer.XUID));
            elEntry.Data().allowNameUpdates = !oPlayer.hasOwnProperty('displayName');
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
                if (!oPlayer.XUID) {
                    oPlayer.XUID = xuid;
                }
                if (PartyListAPI.GetFriendCompetitiveRankType(xuid) === "Premier") {
                    let partyScore = PartyListAPI.GetFriendCompetitiveRank(xuid);
                    let partyWins = PartyListAPI.GetFriendCompetitiveWins(xuid);
                    if (partyScore || partyWins) {
                        oPlayer.score = PartyListAPI.GetFriendCompetitiveRank(xuid);
                        oPlayer.matchesWon = PartyListAPI.GetFriendCompetitiveWins(xuid);
                        oPlayer.rankWindowStats = PartyListAPI.GetFriendCompetitivePremierWindowStatsObject(xuid);
                        _msg('PartyList player ' + xuid + ' score=' + oPlayer.score + ' wins=' + oPlayer.matchesWon + ' data={' + JSON.stringify(oPlayer) + '}');
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
        _msg('OnLeaderboardDirty');
        if (m_leaderboardName && m_leaderboardName === type) {
            _MaybeRefreshRegionsDropdown();
            LeaderboardsAPI.Refresh(m_leaderboardName);
        }
    }
    function ReadyForDisplay() {
        _msg("ReadyForDisplay");
        RegisterEventHandlers();
        _MaybeRefreshRegionsDropdown();
        if (m_leaderboardName) {
            LeaderboardsAPI.Refresh(m_leaderboardName);
        }
    }
    Leaderboard.ReadyForDisplay = ReadyForDisplay;
    function UnReadyForDisplay() {
        _msg("UnReadyForDisplay");
        UnregisterEventHandlers();
    }
    Leaderboard.UnReadyForDisplay = UnReadyForDisplay;
    function _UpdateName(xuid) {
        let elList = $.GetContextPanel().FindChildInLayoutFile('id-leaderboard-entries');
        let elEntry = elList.FindChildInLayoutFile(xuid);
        if (elEntry && elEntry.Data().allowNameUpdates) {
            elEntry.SetDialogVariable('player-name', FriendsListAPI.GetFriendName(xuid));
        }
    }
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
        _msg(nPlayers + ' accounts found.');
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
        _msg('OnLeaderboardStateChange');
        _msg('leaderboard status: received');
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
    function OnLeaderboardChange() {
        _UpdateLeaderboardName();
        UpdateLeaderboardList();
    }
    Leaderboard.OnLeaderboardChange = OnLeaderboardChange;
    function GoToSelf() {
        let myIndex = LeaderboardsAPI.GetIndexByXuid(m_leaderboardName, m_myXuid);
        const elList = $.GetContextPanel().FindChildInLayoutFile('id-leaderboard-entries');
        $.DispatchEvent('ScrollToDelayLoadListItem', elList, myIndex, 'center', true);
    }
    Leaderboard.GoToSelf = GoToSelf;
    function GoToTop() {
        const elList = $.GetContextPanel().FindChildInLayoutFile('id-leaderboard-entries');
        $.DispatchEvent('ScrollToDelayLoadListItem', elList, 0, 'topleft', true);
    }
    Leaderboard.GoToTop = GoToTop;
    {
        $.RegisterEventHandler('ReadyForDisplay', $.GetContextPanel(), Leaderboard.ReadyForDisplay);
        $.RegisterEventHandler('UnreadyForDisplay', $.GetContextPanel(), Leaderboard.UnReadyForDisplay);
        _Init();
    }
})(Leaderboard || (Leaderboard = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGVhZGVyYm9hcmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9sZWFkZXJib2FyZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBQ2xDLHlDQUF5QztBQUN6Qyw0Q0FBNEM7QUFDNUMsc0NBQXNDO0FBY3RDLE1BQU0sa0JBQWtCLEdBQThCO0lBQ3JELE1BQU0sRUFBRSxjQUFjO0lBQ3RCLE1BQU0sRUFBRSxjQUFjO0lBQ3RCLE1BQU0sRUFBRSxRQUFRO0lBQ2hCLE1BQU0sRUFBRSxNQUFNO0lBQ2QsTUFBTSxFQUFFLFdBQVc7SUFDbkIsTUFBTSxFQUFFLFFBQVE7SUFDaEIsSUFBSSxFQUFFLE9BQU87Q0FDYixDQUFBO0FBRUQsSUFBVSxXQUFXLENBMHpCcEI7QUExekJELFdBQVUsV0FBVztJQUVwQixTQUFTLElBQUksQ0FBRyxHQUFXO0lBRzNCLENBQUM7SUFFRCxJQUFJLG1CQUFtQixHQUFHLEtBQUssQ0FBQztJQUNoQyxJQUFJLFFBQVEsR0FBRyxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDdEMsSUFBSSxRQUEyQixDQUFDO0lBRWhDLElBQUksK0JBQXVDLENBQUM7SUFDNUMsSUFBSSxxQ0FBNkMsQ0FBQztJQUNsRCxJQUFJLG9DQUE0QyxDQUFDO0lBQ2pELElBQUksZ0NBQXdDLENBQUM7SUFDN0MsSUFBSSxzQkFBOEIsQ0FBQztJQUVuQyxJQUFJLGlCQUFpQixHQUFXLEVBQUUsQ0FBQztJQUVuQyxJQUFJLGdDQUFnQyxHQUFXLEVBQUUsQ0FBQztJQUVsRCxNQUFNLGFBQWEsR0FBRyxLQUFLLENBQUM7SUFDNUIsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7SUFFOUIsU0FBZ0IscUJBQXFCO1FBRXBDLElBQUksQ0FBRSx1QkFBdUIsQ0FBRSxDQUFDO1FBRWhDLElBQUssQ0FBQyxtQkFBbUIsRUFDekI7WUFDQywrQkFBK0IsR0FBRyxD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