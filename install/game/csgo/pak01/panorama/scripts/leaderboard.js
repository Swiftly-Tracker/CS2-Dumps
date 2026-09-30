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
    const IS_NEW_SEASON = false;
    const IS_AROUND_PLAYER = true;
    function RegisterEventHandlers() {
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
        _UpdateGoToMeButton();
        let count = LeaderboardsAPI.GetCount(m_leaderboardName);
        let status = LeaderboardsAPI.GetState(m_leaderboardName);
        let seasonName = $.Localize('#' + m_onlyAvailableSeasonLeaderboard + '_name');
        $.GetContextPanel().SetDialogVariable('season_name', seasonName);
        if ("ready" == status && count !== 0) {
            _FillOutEntries();
        }
        if (1 <= LeaderboardsAPI.HowManyMinutesAgoCached(m_leaderboardName)) {
            LeaderboardsAPI.Refresh(m_leaderboardName);
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
        if (m_leaderboardName && m_leaderboardName === type) {
            _MaybeRefreshRegionsDropdown();
            LeaderboardsAPI.Refresh(m_leaderboardName);
        }
    }
    function ReadyForDisplay() {
        RegisterEventHandlers();
        _MaybeRefreshRegionsDropdown();
        if (m_leaderboardName) {
            LeaderboardsAPI.Refresh(m_leaderboardName);
        }
    }
    Leaderboard.ReadyForDisplay = ReadyForDisplay;
    function UnReadyForDisplay() {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGVhZGVyYm9hcmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9sZWFkZXJib2FyZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBQ2xDLHlDQUF5QztBQUN6Qyw0Q0FBNEM7QUFFNUMsQ0FBQyxDQUFDLFVBQVUsQ0FBRSxlQUFlLEVBQUUsUUFBUSxDQUFFLENBQUM7QUFjMUMsTUFBTSxrQkFBa0IsR0FBOEI7SUFDckQsTUFBTSxFQUFFLGNBQWM7SUFDdEIsTUFBTSxFQUFFLGNBQWM7SUFDdEIsTUFBTSxFQUFFLFFBQVE7SUFDaEIsTUFBTSxFQUFFLE1BQU07SUFDZCxNQUFNLEVBQUUsV0FBVztJQUNuQixNQUFNLEVBQUUsUUFBUTtJQUNoQixJQUFJLEVBQUUsT0FBTztDQUNiLENBQUE7QUFFRCxJQUFVLFdBQVcsQ0FzekJwQjtBQXR6QkQsV0FBVSxXQUFXO0lBRXBCLElBQUksbUJBQW1CLEdBQUcsS0FBSyxDQUFDO0lBQ2hDLElBQUksUUFBUSxHQUFHLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUN0QyxJQUFJLFFBQTJCLENBQUM7SUFFaEMsSUFBSSwrQkFBdUMsQ0FBQztJQUM1QyxJQUFJLHFDQUE2QyxDQUFDO0lBQ2xELElBQUksZ0NBQXdDLENBQUM7SUFDN0MsSUFBSSxzQkFBOEIsQ0FBQztJQUVuQyxJQUFJLGlCQUFpQixHQUFXLEVBQUUsQ0FBQztJQUVuQyxJQUFJLGdDQUFnQyxHQUFXLEVBQUUsQ0FBQztJQUVsRCxNQUFNLGFBQWEsR0FBRyxLQUFLLENBQUM7SUFDNUIsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7SUFFOUIsU0FBZ0IscUJBQXFCO1FBSXBDLElBQUssQ0FBQyxtQkFBbUIsRUFDekI7WUFDQywrQkFBK0IsR0FBRyxDQUFDLENBQUMseUJBQXlCLENBQUUsc0NBQXNDLEVBQUUsa0JBQWtCLENBQUUsQ0FBQztZQUM1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