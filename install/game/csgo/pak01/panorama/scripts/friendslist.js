"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/formattext.ts" />
/// <reference path="advertising_toggle.ts" />
/// <reference path="friendtile.ts" />
/// <reference path="friendlobby.ts" />
/// <reference path="friend_advertise_tile.ts" />
var FriendsList;
(function (FriendsList) {
    let _m_isPerfectWorld = MyPersonaAPI.GetLauncherType() === "perfectworld" ? true : false;
    let m_activeSection = 'id-friendslist-section-friends';
    let m_Sections = $.GetContextPanel().FindChildInLayoutFile('id-friendslist-accordian');
    let _m_sLobbiesTabListFiltersString = GameInterfaceAPI.GetSettingString('ui_nearbylobbies_filter');
    let _m_schfnUpdateAntiAddiction = null;
    let _m_ClosedSectionHeight = Math.floor($.GetContextPanel().FindChildInLayoutFile('id-friendslist-section-recent').desiredlayoutheight / $.GetContextPanel().actualuiscale_x);
    function _Init() {
        $.Msg('friends list init: ');
        let btnLobbiesTabListFilters = $('#JsFriendsList-lobbies-toolbar-button-' + _m_sLobbiesTabListFiltersString);
        AdvertisingToggle.OnFilterPressed(_m_sLobbiesTabListFiltersString);
        if (btnLobbiesTabListFilters) { // set the correct filter checked by default when we initialize the panel
            btnLobbiesTabListFilters.checked = true;
            // remove radio buttons for modes that don't support advertising
            let elParent = btnLobbiesTabListFilters.GetParent();
            for (let child of elParent.Children()) {
                let gameMode = child.GetAttributeString('data-type', '');
                if (gameMode !== '') {
                    child.visible = PartyListAPI.IsPlayerForHireAdvertisingEnabledForGameMode(gameMode);
                }
            }
        }
        _UpdateBroadcastIcon();
    }
    function _UpdateBroadcastIcon() {
        let adSetting = AdvertisingToggle.GetAdvertisingSetting();
        _ActiveFilterOnTab(adSetting);
        $.GetContextPanel().FindChildInLayoutFile('id-friendslist-section-broadcast-icon').SetHasClass('advertising-active', adSetting !== "");
    }
    function _UpdateAntiAddiction() {
        let elAAGroup = $.GetContextPanel().FindChildInLayoutFile('AntiAddiction');
        let numSec = _m_isPerfectWorld ? MyPersonaAPI.GetAntiAddictionTimeRemaining() : -1;
        if (numSec < 0) {
            elAAGroup.AddClass('hidden');
            return false;
        }
        elAAGroup.RemoveClass('hidden');
        let szSeverity = 'Green';
        if (numSec <= 300) // last 5 minutes
            szSeverity = 'Red';
        else if (numSec <= 1800) // last 30 minutes
            szSeverity = 'Yellow';
        let elAAIcon = elAAGroup.FindChildInLayoutFile('AntiAddictionIcon');
        elAAIcon.SetHasClass('anti-addiction-Green', 'Green' === szSeverity);
        elAAIcon.SetHasClass('anti-addiction-Yellow', 'Yellow' === szSeverity);
        elAAIcon.SetHasClass('anti-addiction-Red', 'Red' === szSeverity);
        // elAAGroup.SetDialogVariable( 'aadesc', $.Localize( '#UI_AntiAddiction_Desc_' + szSeverity ) );
        let strTimeRemainingSentence = (numSec >= 60)
            ? FormatText.SecondsToSignificantTimeString(numSec)
            : $.Localize('#AntiAddiction_Label_TimeRemainingNone');
        elAAGroup.SetDialogVariable('aatime', strTimeRemainingSentence);
        let szLocalizedTooltip = $.Localize(((numSec >= 60)
            ? '#UI_AntiAddiction_Tooltip_GameTime'
            : '#UI_AntiAddiction_Tooltip_GameTimeNone'), elAAGroup);
        elAAGroup.SetPanelEvent("onmouseover", () => {
            UiToolkitAPI.ShowTextTooltip('AntiAddiction', szLocalizedTooltip);
        });
        if (_m_schfnUpdateAntiAddiction)
            $.CancelScheduled(_m_schfnUpdateAntiAddiction);
        _m_schfnUpdateAntiAddiction = $.Schedule(30, _UpdateAntiAddictionTimer);
    }
    function _UpdateAntiAddictionTimer() {
        _m_schfnUpdateAntiAddiction = null;
        _UpdateAntiAddiction();
    }
    function _UpdateIncomingInvitesContainer() {
        let elInviteRoot = $.GetContextPanel().FindChildInLayoutFile('JsIncomingInvites');
        elInviteRoot.AddClass('hidden');
        let elInviteContainer = elInviteRoot.FindChildInLayoutFile('JsIncomingInviteContainer');
        elInviteContainer.RemoveAndDeleteChildren();
        let numInvites = PartyBrowserAPI.GetInvitesCount();
        if (numInvites > 0) { // We have an incoming invite, set it up here
            let xuid = PartyBrowserAPI.GetInviteXuidByIndex(0);
            _AddTile(elInviteContainer, null, xuid, 0, 'friendlobby', null);
            elInviteRoot.RemoveClass('hidden');
        }
        UpdateHeightOpenSection();
    }
    // -------------------------------------------------------------------------
    // Updating / Selecting Panels
    // -------------------------------------------------------------------------
    function OnSectionPressed(sectionId) {
        if (!sectionId) {
            return;
        }
        if (m_activeSection !== sectionId) {
            m_activeSection = sectionId;
            if (sectionId === 'id-friendslist-section-recent') { // only refresh the recent players if user explicitly clicks the section header, don't refresh for all
                TeammatesAPI.Refresh();
            }
            if (sectionId === 'id-friendslist-section-broadcast') { // only refresh the looking to play from GC if user explicitly clicks the section header
                RefreshLobbyListings();
            }
        }
        _UpdateSection(sectionId, false);
    }
    FriendsList.OnSectionPressed = OnSectionPressed;
    function _UpdateAllSections() {
        _UpdateSection('', true);
    }
    function _UpdateSection(sectionId, bUpdateAll) {
        // Get the height for a closed panel
        if (_m_ClosedSectionHeight === 0 || _m_ClosedSectionHeight === undefined) {
            _m_ClosedSectionHeight = Math.floor($.GetContextPanel().FindChildInLayoutFile('id-friendslist-section-recent').desiredlayoutheight / $.GetContextPanel().actualuiscale_x);
            $.Msg('_m_ClosedSectionHeight' + _m_ClosedSectionHeight);
        }
        let funcGetXuid;
        if (sectionId === 'id-friendslist-section-friends' || bUpdateAll) {
            funcGetXuid = _GetXuidByIndex;
            _UpdateSectionContent({
                id: 'id-friendslist-section-friends',
                count: _GetFriendsCount(),
                xml: 'friendtile',
                xuid_func: funcGetXuid,
                no_data_String: '#FriendsList_nodata_friends'
            });
        }
        if (sectionId === 'id-friendslist-section-recent' || bUpdateAll) {
            funcGetXuid = _GetRecentXuidByIndex;
            _UpdateSectionContent({
                id: 'id-friendslist-section-recent',
                count: _GetRecentsCount(),
                xml: 'friendtile',
                xuid_func: funcGetXuid,
                type: 'recent',
                no_data_String: '#FriendsList_nodata_recents',
                show_loading_bar_only: _ShowRecentsLoadingBar(),
                loading_bar_id: 'JsFriendsListRecentsLoadingBar'
            });
        }
        // if invites is active then refresh it.
        // Because we only have one event for rebuilding the list and if we are on this tab we may have ignored or accepted a friend request.
        if (sectionId === 'id-friendslist-section-invite' || m_activeSection === 'id-friendslist-section-invite' || bUpdateAll) {
            funcGetXuid = _GetRequestsXuidByIndex;
            _UpdateSectionContent({
                id: 'id-friendslist-section-invite',
                count: _GetRequestsCount(),
                alerts_count: _GetRequestsAlertCount(),
                xml: 'friendtile',
                xuid_func: funcGetXuid,
                no_data_String: '#FriendsList_nodata_requests',
                hide_if_empty: true
            });
        }
        if (sectionId === 'id-friendslist-section-broadcast' || bUpdateAll) {
            _UpdateLobbiesLoadingBar();
            funcGetXuid = _GetLobbyXuidByIndex;
            _UpdateSectionContent({
                id: 'id-friendslist-section-broadcast',
                count: _GetLobbiesCount(),
                xml: 'friend_advertise_tile',
                xuid_func: funcGetXuid,
                no_data_String: '#FriendsList_nodata_advertising'
            });
        }
    }
    function _UpdateSectionContent(oSettings) {
        let elSection = m_Sections.FindChildInLayoutFile(oSettings.id);
        let count = (oSettings.hasOwnProperty('alerts_count') ? oSettings.alerts_count : oSettings.count);
        _ShowHideCounter(elSection, count);
        if (oSettings.hasOwnProperty('hide_if_empty') && oSettings.hide_if_empty === true && count < 1) {
            elSection.SetHasClass('hidden', true);
            return;
        }
        elSection.SetHasClass('hidden', false);
        if (oSettings.hasOwnProperty('show_loading_bar_only') && oSettings.show_loading_bar_only) {
            return;
        }
        // Only up date the tiles and the height of the selected tiles
        if (m_activeSection === oSettings.id) {
            let elNodata = elSection.FindChildInLayoutFile('id-friendslist-nodata');
            let elList = elSection.FindChildInLayoutFile('id-friendslist-section-list-contents');
            if (oSettings.count && oSettings.count > 0) {
                elNodata.visible = false;
                elList.visible = true;
                _MakeOrUpdateTiles(elList, oSettings);
                _SetSectionHeight(oSettings.id);
                return;
            }
            elNodata.SetDialogVariable('no_data_title', $.Localize(oSettings.no_data_String + '_title'));
            elNodata.SetDialogVariable('no_data_body', $.Localize(oSettings.no_data_String));
            elNodata.visible = true;
            elList.visible = false;
            _SetSectionHeight(oSettings.id);
        }
    }
    function _GetAddtionalSectionHeight(idSection) {
        let elPanel = $.GetContextPanel().FindChildInLayoutFile(idSection);
        return elPanel.BHasClass('hidden') ? 0 :
            Math.floor(elPanel.desiredlayoutheight / m_Sections.actualuiscale_x);
    }
    function _SetSectionHeight(sectionId) {
        let aSectionsToClose = m_Sections.Children().filter(element => element.id !== m_activeSection && !element.BHasClass('hidden'));
        for (let element of aSectionsToClose) {
            let elList = element.FindChildInLayoutFile('id-friendslist-section-list');
            elList.style.height = '0px;';
        }
        let closedSectionsHeight = _m_ClosedSectionHeight * (aSectionsToClose.length + 1);
        let basicHeight = Math.floor(($.GetContextPanel().desiredlayoutheight / $.GetContextPanel().actualuiscale_x)) -
            (closedSectionsHeight + _GetAddtionalSectionHeight('PartyList') + _GetAddtionalSectionHeight('JsIncomingInvites'));
        m_Sections.FindChildInLayoutFile(sectionId).FindChildInLayoutFile('id-friendslist-section-list').style.height = basicHeight + "px;";
    }
    function _ShowHideCounter(elSection, count) {
        if (!count) {
            elSection.SetHasClass('hide-notification', true);
            return;
        }
        elSection.SetDialogVariable('alert_value', String(count));
        elSection.SetHasClass('hide-notification', false);
    }
    function _MakeOrUpdateTiles(elList, oSettings) {
        elList.SetLoadListItemFunction((parent, nPanelIdx, reusePanel) => {
            let xuid = oSettings.xuid_func(nPanelIdx);
            if (!reusePanel || !reusePanel.IsValid()) {
                // create panel
                reusePanel = _AddTile(elList, null, xuid, nPanelIdx, oSettings.xml, oSettings.type);
            }
            else {
                reusePanel.SetAttributeString("xuid", xuid);
                _InitTile(reusePanel, oSettings.xml);
            }
            return reusePanel;
        });
        if (oSettings.count) {
            elList.UpdateListItemsNonDestructive(oSettings.count);
            for (let i = 0; i < oSettings.count; ++i) {
                if (elList.TryGetListItemAtIndex(i))
                    elList.ReloadListItem(i);
            }
        }
    }
    function _AddTile(elList, children, xuid, index, tileXmlToUse, type) {
        let elTile = $.CreatePanel("Panel", elList, xuid);
        elTile.SetAttributeString('xuid', xuid);
        elTile.BLoadLayout('file://{resources}/layout/' + tileXmlToUse + '.xml', false, false);
        if (type) {
            elTile.Data().type = type;
        }
        if (tileXmlToUse) {
            elTile.Data().tileXmlToUse = tileXmlToUse;
        }
        if (children && children[index + 1])
            elList.MoveChildBefore(elTile, children[index + 1]);
        _AddTransitionEndEventHandler(elTile);
        _InitTile(elTile, tileXmlToUse);
        return elTile;
    }
    function _InitTile(elTile, tileXmlToUse) {
        if (tileXmlToUse === "friendtile") {
            FriendTile.Init(elTile);
        }
        else if (tileXmlToUse === "friendlobby") {
            elTile.SetAttributeString('showinpopup', 'false');
            friendLobby.Init(elTile);
        }
        else {
            FriendAdvertiseTile.Init(elTile);
        }
        elTile.RemoveClass('hidden');
    }
    function _AddTransitionEndEventHandler(elTile) {
        $.RegisterEventHandler('PropertyTransitionEnd', elTile, (panel, propertyName) => {
            if (elTile === panel && propertyName === 'opacity') {
                // Panel is visible and fully transparent
                if (elTile.visible === true && elTile.BIsTransparent()) {
                    elTile.DeleteAsync(.0);
                    $.Msg('Removed Friend: ' + FriendsListAPI.GetFriendName(elTile.id));
                    return true;
                }
            }
            return false;
        });
    }
    // -------------------------------------------------------------------------
    // loading bar
    // -------------------------------------------------------------------------
    function _ShowRecentsLoadingBar() {
        let elBarOuter = $('#JsFriendsListRecentsLoadingBar');
        let elBarInner = $('#JsFriendsListRecentsLoadingBarInner');
        if (TeammatesAPI.GetSecondsAgoFinished() < 0) {
            if (elBarOuter.BHasClass('hidden'))
                elBarOuter.RemoveClass('hidden');
            elBarInner.AddClass('loadingbar-indeterminate');
            return true;
        }
        else {
            elBarInner.RemoveClass('loadingbar-indeterminate');
            elBarOuter.AddClass('hidden');
            return false;
        }
    }
    function _UpdateLobbiesLoadingBar() {
        let progress = PartyBrowserAPI.GetProgress();
        let elBarOuter = $('#JsFriendsListLobbyLoadingBar');
        let elBarInner = $('#JsFriendsListLobbyLoadingBarInner');
        if (progress > 1 && progress < 100) {
            if (elBarOuter.BHasClass('hidden'))
                elBarOuter.RemoveClass('hidden');
            elBarInner.style.width = progress + '%';
            return true;
        }
        else {
            elBarOuter.AddClass('hidden');
            return false;
        }
    }
    function UpdateHeightOpenSection() {
        _UpdateSection(m_activeSection, false);
    }
    FriendsList.UpdateHeightOpenSection = UpdateHeightOpenSection;
    // -------------------------------------------------------------------------
    // from lobbies list
    // -------------------------------------------------------------------------
    function SetLobbiesTabListFilters(sFilterString) {
        _m_sLobbiesTabListFiltersString = sFilterString;
        AdvertisingToggle.OnFilterPressed(sFilterString);
        let adSetting = AdvertisingToggle.GetAdvertisingSetting();
        _ActiveFilterOnTab(adSetting);
        RefreshLobbyListings();
    }
    FriendsList.SetLobbiesTabListFilters = SetLobbiesTabListFilters;
    function _ActiveFilterOnTab(adSetting) {
        let aBtns = $.GetContextPanel().FindChildInLayoutFile('JsFriendsListSettingsBtns').Children();
        for (let btn of aBtns) {
            btn.SetHasClass('toggle-active', ((btn.GetAttributeString('data-type', '') === adSetting) && adSetting !== ''));
        }
    }
    function RefreshLobbyListings() {
        m_Sections.FindChildInLayoutFile('id-friendslist-section-broadcast').FindChildInLayoutFile('id-friendslist-section-list-contents').ScrollToTop();
        GameInterfaceAPI.SetSettingString('ui_nearbylobbies_filter', _m_sLobbiesTabListFiltersString);
        PartyBrowserAPI.SetSearchFilter(_m_sLobbiesTabListFiltersString, "");
        PartyBrowserAPI.Refresh();
    }
    FriendsList.RefreshLobbyListings = RefreshLobbyListings;
    // -------------------------------------------------------------------------
    // from Events
    // -------------------------------------------------------------------------
    function _OnGcHello() {
        _UpdateAllSections();
        UpdateHeightOpenSection();
    }
    function _FriendsListNameChanged(xuid) {
        let elSection = m_Sections.FindChildInLayoutFile(m_activeSection);
        if (!elSection)
            return;
        let elList = elSection.FindChildInLayoutFile('id-friendslist-section-list-contents');
        if (!elList)
            return;
        let elTile = elList.FindChildTraverse(xuid);
        if (!elTile)
            return;
        _InitTile(elTile, elTile.Data().tileXmlToUse);
    }
    function OnAddFriend() {
        UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_add_friend.xml');
    }
    FriendsList.OnAddFriend = OnAddFriend;
    // -------------------------------------------------------------------------
    // Getters
    // -------------------------------------------------------------------------
    function _GetFriendsCount() {
        return FriendsListAPI.GetCount();
    }
    function _GetRequestsCount() {
        return FriendsListAPI.GetFriendRequestsCount();
    }
    function _GetRecentsCount() {
        let count = TeammatesAPI.GetCount();
        if (count)
            return count;
    }
    function _GetLobbiesCount() {
        $.Msg('_GetLobbiesCount: ' + PartyBrowserAPI.GetResultsCount());
        let count = PartyBrowserAPI.GetResultsCount();
        if (count)
            return count;
    }
    function _GetRequestsAlertCount() {
        return FriendsListAPI.GetFriendRequestsNotificationNumber();
    }
    function _GetXuidByIndex(index) {
        return FriendsListAPI.GetXuidByIndex(index);
    }
    function _GetRequestsXuidByIndex(index) {
        return FriendsListAPI.GetFriendRequestsXuidByIdx(index);
    }
    function _GetRecentXuidByIndex(index) {
        return TeammatesAPI.GetXuidByIndex(index);
    }
    function _GetLobbyXuidByIndex(index) {
        return PartyBrowserAPI.GetXuidByIndex(index);
    }
    function _ShowMatchAcceptPopUp(map, location, ping) {
        UiToolkitAPI.ShowGlobalCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_accept_match.xml', 'map_and_isreconnect=' + map + ',false' + ((location && ping) ? '&ping=' + ping + '&location=' + location : ''));
    }
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        _Init();
        $.RegisterForUnhandledEvent('PanoramaComponent_GC_Hello', _OnGcHello);
        $.RegisterForUnhandledEvent("PanoramaComponent_FriendsList_RebuildFriendsList", () => _UpdateSection('id-friendslist-section-friends', false));
        $.RegisterForUnhandledEvent('PanoramaComponent_Teammates_Refresh', () => _UpdateSection('id-friendslist-section-recent', false));
        $.RegisterForUnhandledEvent('PanoramaComponent_PartyBrowser_Refresh', () => _UpdateSection('id-friendslist-section-broadcast', false));
        $.RegisterForUnhandledEvent('PanoramaComponent_FriendsList_NameChanged', _FriendsListNameChanged);
        $.RegisterForUnhandledEvent('PanoramaComponent_PartyBrowser_InviteConsumed', _UpdateIncomingInvitesContainer);
        $.RegisterForUnhandledEvent('PanoramaComponent_PartyBrowser_InviteReceived', _UpdateIncomingInvitesContainer);
        $.RegisterForUnhandledEvent('PanoramaComponent_PartyBrowser_LocalPlayerForHireAdvertisingChanged', _UpdateBroadcastIcon);
        $.RegisterForUnhandledEvent("ServerReserved", _ShowMatchAcceptPopUp);
    }
})(FriendsList || (FriendsList = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJpZW5kc2xpc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9mcmllbmRzbGlzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBQ2xDLDZDQUE2QztBQUM3Qyw4Q0FBOEM7QUFDOUMsc0NBQXNDO0FBQ3RDLHVDQUF1QztBQUN2QyxpREFBaUQ7QUFFakQsSUFBVSxXQUFXLENBK2tCcEI7QUEva0JELFdBQVUsV0FBVztJQUVwQixJQUFJLGlCQUFpQixHQUFHLFlBQVksQ0FBQyxlQUFlLEVBQUUsS0FBSyxjQUFjLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO0lBQ3pGLElBQUksZUFBZSxHQUFHLGdDQUFnQyxDQUFDO0lBQ3ZELElBQUksVUFBVSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSwwQkFBMEIsQ0FBRSxDQUFDO0lBQ3pGLElBQUksK0JBQStCLEdBQUcsZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUUseUJBQXlCLENBQUUsQ0FBQztJQUNyRyxJQUFJLDJCQUEyQixHQUFrQixJQUFJLENBQUM7SUFDdEQsSUFBSSxzQkFBc0IsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFFLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSwrQkFBK0IsQ0FBRSxDQUFDLG1CQUFtQixHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxlQUFlLENBQUUsQ0FBQztJQUVsTCxTQUFTLEtBQUs7UUFFYixDQUFDLENBQUMsR0FBRyxDQUFFLHFCQUFxQixDQUFFLENBQUM7UUFFL0IsSUFBSSx3QkFBd0IsR0FBRyxDQUFDLENBQUUsd0NBQXdDLEdBQUcsK0JBQStCLENBQUUsQ0FBQztRQUMvRyxpQkFBaUIsQ0FBQyxlQUFlLENBQUUsK0JBQStCLENBQUUsQ0FBQztRQUNyRSxJQUFLLHdCQUF3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