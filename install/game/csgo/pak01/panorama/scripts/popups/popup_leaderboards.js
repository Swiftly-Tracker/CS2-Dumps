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
            // Leaderboard type can have .friends designation, strip it off when building the title
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
        $.Msg('Leaderboard: ' + type);
        m_type = type;
        var count = 0;
        var status = LeaderboardsAPI.GetState(type);
        $.Msg('Leaderboard Status: ' + status);
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
            if (limitRows > 0 && limitRows < count) { // Limit display to only requested number of rows
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
                // Tell the sidebar to stay open and ignore its on mouse event while the context menu is open
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
        // var strThousandsSeparator = $.Localize( '#csgo_thousands_separator' );
        for (var i = 0; i < count; i++) {
            var lbData = LeaderboardsAPI.GetEntryDetailsObjectByIndex(type, i);
            var xuid = lbData.XUID;
            var score = lbData.score;
            // var rankpct = lbData.pct;
            var elEntry = $.CreatePanel("Panel", elParent, xuid);
            elEntry.BLoadLayoutSnippet("leaderboard-entry");
            elEntry.FindChildInLayoutFile('popup-leaderboard-entry-avatar').PopulateFromSteamID(xuid);
            _AddOpenPlayerCardAction(elEntry, xuid);
            elEntry.SetDialogVariable('player-rank', (i + 1).toString());
            elEntry.SetDialogVariable('player-score', score?.toString());
            elEntry.SetDialogVariable('player-name', FriendsListAPI.GetFriendName(xuid));
            // let elItemImage = elEntry.FindChildInLayoutFile( 'id-itemimage' );
            // let itemid = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex( lbData.defidx, 0 );
            // if ( $.GetContextPanel().BHasClass( 'leaderboard_embedded' ) )
            // {
            // 	elItemImage.small = true;
            // }
            // elItemImage.itemid = itemid;
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
        //_CancelTimeout();
        $.DispatchEvent('UIPopupButtonClicked', '');
    }
    PopupLeaderboards.Close = Close;
    ;
})(PopupLeaderboards || (PopupLeaderboards = {}));
(function () {
    $.RegisterForUnhandledEvent('PanoramaComponent_Leaderboards_StateChange', PopupLeaderboards.RefreshLeaderBoard);
    $.RegisterForUnhandledEvent('PanoramaComponent_FriendsList_NameChanged', PopupLeaderboards.UpdateName);
    // _global.MainMenuAPI.GetScaleformComponentEventParamString( "ScaleformComponent_Leaderboards_StateChange", "leaderboard" );
    PopupLeaderboards.Init();
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfbGVhZGVyYm9hcmRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvcG9wdXBzL3BvcHVwX2xlYWRlcmJvYXJkcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBRXJDLElBQVUsaUJBQWlCLENBNFIxQjtBQTVSRCxXQUFVLGlCQUFpQjtJQUUxQixJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7SUFDaEIsSUFBSSxRQUFRLEdBQUcsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBRTNCLHNCQUFJLEdBQUc7UUFFakIsSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGtCQUFrQixDQUFFLE1BQU0sRUFBRSxFQUFFLENBQUUsQ0FBQztRQUVoRSxJQUFLLElBQUksS0FBSyxFQUFFLEVBQ2hCO1lBQ0MsT0FBTztTQUNQO1FBRUQsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBRSxHQUFHLENBQUUsQ0FBQztRQUUvQixTQUFTLENBQUUsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7UUFDbkIsY0FBYyxFQUFFLENBQUM7UUFDdkIsZUFBZSxFQUFFLENBQUM7UUFDbEIsU0FBUyxDQUFFLE1BQU0sQ0FBRSxDQUFDO1FBQ3BCLGVBQWUsRUFBRSxDQUFDO1FBRWxCLElBQUksVUFBVSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxhQUFhLEVBQUUsRUFBRSxDQUFFLENBQUM7UUFDN0UsSUFBSyxVQUFVLEVBQ2Y7WUFDQyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsUUFBUSxDQUFFLFVBQVUsQ0FBRSxDQUFDO1NBQzNDO1FBRUQsQ0FBQyxDQUFFLHNDQUFzQyxDQUFFLEVBQUUsYUFBYSxDQUN6RCxZQUFZLEVBQ1osVUFBVSxNQUFhLElBQUssZUFBZSxDQUFDLE9BQU8sQ0FBRSxN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