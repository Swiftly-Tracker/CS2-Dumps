"use strict";
/// <reference path="../csgo.d.ts" />
var PopupLeaderboards;
(function (PopupLeaderboards) {
    var m_type = '';
    var m_myXuid = MyPersonaAPI.GetXuid();
    PopupLeaderboards.Init = function () {
        var type = $.GetContextPanel().GetAttributeString('type', '');
        if (type === '') {
            return;
        }
        var aTypes = type.split(',');
        _SetTitle(aTypes[0]);
        _SetBackground();
        _SetPointsTitle();
        _MakeTabs(aTypes);
        _ShowGlobalRank();
        var extraStyle = $.GetContextPanel().GetAttributeString('popup-style', '');
        if (extraStyle) {
            $.GetContextPanel().AddClass(extraStyle);
        }
        $('#id-popup-leaderboard-refresh-button')?.SetPanelEvent('onactivate', function (lbType) { LeaderboardsAPI.Refresh(lbType); }.bind(undefined, type));
    };
    function _SetTitle(type) {
        var titleOverride = $.GetContextPanel().GetAttributeString('titleoverride', '');
        var title = titleOverride;
        if (!title) {
            title = '#CSGO_' + (type.split('.')[0]);
        }
        $.GetContextPanel().FindChildInLayoutFile('id-popup-leaderboard-title').text = $.Localize(title);
    }
    ;
    function _SetBackground() {
        const eventId = $.GetContextPanel().GetAttributeString('eventid', '');
        if (!eventId) {
            return;
        }
        let elBackground = $.GetContextPanel().FindChild('id-popup-leaderboard-bg');
        elBackground.style.backgroundImage = 'url( "file://{images}/tournaments/backgrounds/pickem_bg_' + $.GetContextPanel().GetAttributeString('eventid', '') + '.png");';
        elBackground.style.backgroundSize = 'cover';
        elBackground.style.backgroundPosition = ' 50% 50%;';
        elBackground.visible = true;
        $.GetContextPanel().SetHasClass('major-' + $.GetContextPanel().GetAttributeString('eventid', ''), true);
    }
    function _SetPointsTitle() {
        var strPointsTitle = $.GetContextPanel().GetAttributeString('points-title', '');
        if (strPointsTitle !== '') {
            $.GetContextPanel().FindChildInLayoutFile('id-header-score').text = $.Localize(strPointsTitle);
        }
    }
    ;
    function _MakeTabs(aTypes) {
        if (aTypes.length <= 1) {
            m_type = aTypes[0];
            _UpdateLeaderboard(aTypes[0]);
            return;
        }
        var elNavBar = $.GetContextPanel().FindChildInLayoutFile('id-popup-leaderboard-navbar');
        elNavBar.RemoveClass('hidden');
        var elTabs = elNavBar.FindChild('id-popup-leaderboard-tabs');
        for (var i = 0; i < aTypes.length; i++) {
            var elTab = $.CreatePanel("RadioButton", elTabs, aTypes[i]);
            elTab.BLoadLayoutSnippet("leaderboard-tab");
            elTab.SetPanelEvent('onactivate', _UpdateLeaderboard.bind(undefined, aTypes[i]));
            elTab.FindChildInLayoutFile('leaderboard-tab-label').text = $.Localize('#CSGO_' + aTypes[i] + '_tab');
        }
        $.DispatchEvent("Activated", elTabs.Children()[0], "mouse");
    }
    ;
    function _ShowGlobalRank() {
        var showRank = $.GetContextPanel().GetAttributeString('showglobaloverride', 'true');
        $.GetContextPanel().SetHasClass('hide-global-rank', showRank === 'false');
    }
    ;
    function _UpdateLeaderboard(type) {
        m_type = type;
        var count = 0;
        var status = LeaderboardsAPI.GetState(type);
        var elStatus = $.GetContextPanel().FindChildInLayoutFile('id-popup-leaderboard-loading');
        var elData = $.GetContextPanel().FindChildInLayoutFile('id-popup-leaderboard-nodata');
        var elLeaderboardList = $.GetContextPanel().FindChildInLayoutFile('id-popup-leaderboard-list');
        if ("none" == status) {
            elStatus.SetHasClass('hidden', false);
            elData.SetHasClass('hidden', true);
            elLeaderboardList.SetHasClass('hidden', true);
            LeaderboardsAPI.Refresh(type);
        }
        if ("loading" == status) {
            elStatus.SetHasClass('hidden', false);
            elData.SetHasClass('hidden', true);
            elLeaderboardList.SetHasClass('hidden', true);
        }
        if ("ready" == status) {
            count = LeaderboardsAPI.GetCount(type);
            let limitRows = $.GetContextPanel().GetAttributeInt('limitrows', 0);
            if (limitRows > 0 && limitRows < count) {
                count = limitRows;
            }
            if (count === 0) {
                elData.SetHasClass('hidden', false);
                elStatus.SetHasClass('hidden', true);
                elLeaderboardList.SetHasClass('hidden', true);
            }
            else {
                elLeaderboardList.SetHasClass('hidden', false);
                elStatus.SetHasClass('hidden', true);
                elData.SetHasClass('hidden', true);
                _FillOutEntries(type, count);
            }
            if (1 <= LeaderboardsAPI.HowManyMinutesAgoCached(type)) {
                LeaderboardsAPI.Refresh(type);
            }
        }
        $.GetContextPanel().SetHasClass('leaderboard-has-nodata', count === 0);
        if ($.GetContextPanel().BHasClass('leaderboard_embedded')) {
            let elParent = $.GetContextPanel().GetParent();
            if (elParent) {
                elParent.SetHasClass('leaderboard-has-nodata', count === 0);
            }
        }
    }
    ;
    function _FillOutEntries(type, count) {
        var elParent = $.GetContextPanel().FindChildInLayoutFile('id-popup-leaderboard-entries');
        elParent.RemoveAndDeleteChildren();
        function _AddOpenPlayerCardAction(elAvatar, xuid) {
            var openCard = function (xuid) {
                $.DispatchEvent('SidebarContextMenuActive', true);
                if (xuid !== '0' && xuid) {
                    var contextMenuPanel = UiToolkitAPI.ShowCustomLayoutContextMenuParametersDismissEvent('', '', 'file://{resources}/layout/context_menus/context_menu_playercard.xml', 'xuid=' + xuid, function () {
                        $.DispatchEvent('SidebarContextMenuActive', false);
                    });
                    contextMenuPanel.AddClass("ContextMenu_NoArrow");
                }
            };
            elAvatar.SetPanelEvent("onactivate", openCard.bind(undefined, xuid));
            elAvatar.SetPanelEvent("oncontextmenu", openCard.bind(undefined, xuid));
        }
        for (var i = 0; i < count; i++) {
            var lbData = LeaderboardsAPI.GetEntryDetailsObjectByIndex(type, i);
            var xuid = lbData.XUID;
            var score = lbData.score;
            var elEntry = $.CreatePanel("Panel", elParent, xuid);
            elEntry.BLoadLayoutSnippet("leaderboard-entry");
            elEntry.FindChildInLayoutFile('popup-leaderboard-entry-avatar').PopulateFromSteamID(xuid);
            _AddOpenPlayerCardAction(elEntry, xuid);
            elEntry.SetDialogVariable('player-rank', (i + 1).toString());
            elEntry.SetDialogVariable('player-score', score?.toString());
            elEntry.SetDialogVariable('player-name', FriendsListAPI.GetFriendName(xuid));
            var children = elEntry.FindChildrenWithClassTraverse('popup-leaderboard__list__column');
            if (i % 2 === 0) {
                children.forEach(element => {
                    element.AddClass('background');
                });
            }
        }
        _HighightMySelf();
    }
    ;
    function _HighightMySelf() {
        var elParent = $.GetContextPanel().FindChildInLayoutFile('id-popup-leaderboard-entries');
        var elEntry = elParent.FindChildInLayoutFile(m_myXuid);
        if (elEntry) {
            elEntry.AddClass('local-player');
            elEntry.ScrollParentToMakePanelFit(1, false);
        }
    }
    ;
    function RefreshLeaderBoard(type) {
        if (m_type === type) {
            _UpdateLeaderboard(type);
            return;
        }
    }
    PopupLeaderboards.RefreshLeaderBoard = RefreshLeaderBoard;
    ;
    function UpdateName(xuid) {
        var elParent = $.GetContextPanel().FindChildInLayoutFile('id-popup-leaderboard-entries');
        var elEntry = elParent.FindChildInLayoutFile(xuid);
        if (elEntry) {
            elEntry.SetDialogVariable('player-name', FriendsListAPI.GetFriendName(xuid));
        }
    }
    PopupLeaderboards.UpdateName = UpdateName;
    ;
    function Close() {
        $.DispatchEvent('UIPopupButtonClicked', '');
    }
    PopupLeaderboards.Close = Close;
    ;
})(PopupLeaderboards || (PopupLeaderboards = {}));
(function () {
    $.RegisterForUnhandledEvent('PanoramaComponent_Leaderboards_StateChange', PopupLeaderboards.RefreshLeaderBoard);
    $.RegisterForUnhandledEvent('PanoramaComponent_FriendsList_NameChanged', PopupLeaderboards.UpdateName);
    PopupLeaderboards.Init();
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfbGVhZGVyYm9hcmRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvcG9wdXBzL3BvcHVwX2xlYWRlcmJvYXJkcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBRXJDLElBQVUsaUJBQWlCLENBNFIxQjtBQTVSRCxXQUFVLGlCQUFpQjtJQUUxQixJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7SUFDaEIsSUFBSSxRQUFRLEdBQUcsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBRTNCLHNCQUFJLEdBQUc7UUFFakIsSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGtCQUFrQixDQUFFLE1BQU0sRUFBRSxFQUFFLENBQUUsQ0FBQztRQUVoRSxJQUFLLElBQUksS0FBSyxFQUFFLEVBQ2hCO1lBQ0MsT0FBTztTQUNQO1FBRUQsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBRSxHQUFHLENBQUUsQ0FBQztRQUUvQixTQUFTLENBQUUsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7UUFDbkIsY0FBYyxFQUFFLENBQUM7UUFDdkIsZUFBZSxFQUFFLENBQUM7UUFDbEIsU0FBUyxDQUFFLE1BQU0sQ0FBRSxDQUFDO1FBQ3BCLGVBQWUsRUFBRSxDQUFDO1FBRWxCLElBQUksVUFBVSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxhQUFhLEVBQUUsRUFBRSxDQUFFLENBQUM7UUFDN0UsSUFBSyxVQUFVLEVBQ2Y7WUFDQyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsUUFBUSxDQUFFLFVBQVUsQ0FBRSxDQUFDO1NBQzNDO1FBRUQsQ0FBQyxDQUFFLHNDQUFzQyxDQUFFLEVBQUUsYUFBYSxDQUN6RCxZQUFZLEVBQ1osVUFBVSxNQUFhLElBQUssZUFBZSxDQUFDLE9BQU8sQ0FBRSxN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