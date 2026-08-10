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
        let btnLobbiesTabListFilters = $('#JsFriendsList-lobbies-toolbar-button-' + _m_sLobbiesTabListFiltersString);
        AdvertisingToggle.OnFilterPressed(_m_sLobbiesTabListFiltersString);
        if (btnLobbiesTabListFilters) {
            btnLobbiesTabListFilters.checked = true;
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
        if (numSec <= 300)
            szSeverity = 'Red';
        else if (numSec <= 1800)
            szSeverity = 'Yellow';
        let elAAIcon = elAAGroup.FindChildInLayoutFile('AntiAddictionIcon');
        elAAIcon.SetHasClass('anti-addiction-Green', 'Green' === szSeverity);
        elAAIcon.SetHasClass('anti-addiction-Yellow', 'Yellow' === szSeverity);
        elAAIcon.SetHasClass('anti-addiction-Red', 'Red' === szSeverity);
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
        if (numInvites > 0) {
            let xuid = PartyBrowserAPI.GetInviteXuidByIndex(0);
            _AddTile(elInviteContainer, null, xuid, 0, 'friendlobby', null);
            elInviteRoot.RemoveClass('hidden');
        }
        UpdateHeightOpenSection();
    }
    function OnSectionPressed(sectionId) {
        if (!sectionId) {
            return;
        }
        if (m_activeSection !== sectionId) {
            m_activeSection = sectionId;
            if (sectionId === 'id-friendslist-section-recent') {
                TeammatesAPI.Refresh();
            }
            if (sectionId === 'id-friendslist-section-broadcast') {
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
        if (_m_ClosedSectionHeight === 0 || _m_ClosedSectionHeight === undefined) {
            _m_ClosedSectionHeight = Math.floor($.GetContextPanel().FindChildInLayoutFile('id-friendslist-section-recent').desiredlayoutheight / $.GetContextPanel().actualuiscale_x);
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
                if (elTile.visible === true && elTile.BIsTransparent()) {
                    elTile.DeleteAsync(.0);
                    return true;
                }
            }
            return false;
        });
    }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJpZW5kc2xpc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9mcmllbmRzbGlzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBQ2xDLDZDQUE2QztBQUM3Qyw4Q0FBOEM7QUFDOUMsc0NBQXNDO0FBQ3RDLHVDQUF1QztBQUN2QyxpREFBaUQ7QUFFakQsSUFBVSxXQUFXLENBK2tCcEI7QUEva0JELFdBQVUsV0FBVztJQUVwQixJQUFJLGlCQUFpQixHQUFHLFlBQVksQ0FBQyxlQUFlLEVBQUUsS0FBSyxjQUFjLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO0lBQ3pGLElBQUksZUFBZSxHQUFHLGdDQUFnQyxDQUFDO0lBQ3ZELElBQUksVUFBVSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSwwQkFBMEIsQ0FBRSxDQUFDO0lBQ3pGLElBQUksK0JBQStCLEdBQUcsZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUUseUJBQXlCLENBQUUsQ0FBQztJQUNyRyxJQUFJLDJCQUEyQixHQUFrQixJQUFJLENBQUM7SUFDdEQsSUFBSSxzQkFBc0IsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFFLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSwrQkFBK0IsQ0FBRSxDQUFDLG1CQUFtQixHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxlQUFlLENBQUUsQ0FBQztJQUVsTCxTQUFTLEtBQUs7UUFJYixJQUFJLHdCQUF3QixHQUFHLENBQUMsQ0FBRSx3Q0FBd0MsR0FBRywrQkFBK0IsQ0FBRSxDQUFDO1FBQy9HLGlCQUFpQixDQUFDLGVBQWUsQ0FBRSwrQkFBK0IsQ0FBRSxDQUFDO1FBQ3JFLElBQUssd0JBQXdCLEVBQzdCO1lBQ0Msd0JBQXdCLENBQUMsT0FBTyxHQUFHLElBQUksQ0FB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