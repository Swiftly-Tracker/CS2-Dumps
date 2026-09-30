"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="mainmenu_watch.ts" />
/// <reference path="common/iteminfo.ts" />
/// <reference path="common/formattext.ts" />
/// <reference path="generated/items_event_current_generated_store.ts" />
var matchInfo;
(function (matchInfo) {
    let PLAYERSTATS = ['kills', 'assists', 'deaths', 'mvps', 'score'];
    let TEAMS = ['CT', 'TERRORIST'];
    let TEAMSIZE = 5;
    function _ShowMatchSpinner(value, tab) {
        if (tab) {
            let elSpinner = tab.FindChildInLayoutFile("id-match-spinner");
            if (elSpinner) {
                if (value) {
                    elSpinner.RemoveClass('hide');
                }
                else {
                    elSpinner.AddClass('hide');
                }
            }
        }
    }
    function _SetMatchMessage(value, show, tab) {
        if (tab) {
            let elMessage = tab.FindChildInLayoutFile("id-match-message");
            if (elMessage) {
                elMessage.text = value;
            }
            let elMessageContainer = tab.FindChildInLayoutFile("id-match-message-container");
            if (elMessageContainer) {
                if (show) {
                    elMessageContainer.RemoveClass('hide');
                }
                else {
                    elMessageContainer.AddClass('hide');
                }
            }
        }
    }
    function _IsMatchMetadataFullyLoaded(elParentPanel) {
        return (((elParentPanel.Data().matchListDescriptor == 'live') && (elParentPanel.Data().matchId != 'gotv')) || (MatchInfoAPI.GetMatchMetadataFullState(elParentPanel.Data().matchId)));
    }
    function _DownloadMatch(elParentPanel) {
        MatchInfoAPI.Delete(elParentPanel.Data().matchId);
        MatchInfoAPI.Download(elParentPanel.Data().matchId);
        _UpdateMatchMenu(elParentPanel);
    }
    function _DownloadFailedNotify(elParentPanel) {
        let canDownload = !(elParentPanel.Data().matchListDescriptor === 'downloaded')
            && ((MatchInfoAPI.GetMatchState(elParentPanel.Data().matchInfo) === 'recent') || (elParentPanel.Data().isTournament));
        if (canDownload) {
            UiToolkitAPI.ShowGenericPopupYesNo($.Localize("#WatchMenu_Info_Download_Failed"), $.Localize("#WatchMenu_Info_Download_Failed_Retry"), '', function () { _DownloadMatch(elParentPanel); }, function () { });
        }
        else {
            UiToolkitAPI.ShowGenericPopupOk($.Localize("#WatchMenu_Info_Download_Failed"), $.Localize("#WatchMenu_Info_Download_Failed_Info"), '', function () { });
        }
    }
    function _DeleteDemo(elParentPanel) {
        MatchInfoAPI.Delete(elParentPanel.Data().matchId);
        if (elParentPanel.Data().matchListDescriptor === 'downloaded') {
            mainmenu_watch.UpdateActiveTab();
        }
        else {
            _UpdateMatchMenu(elParentPanel);
        }
    }
    function _Watch(elParentPanel) {
        MatchInfoAPI.Watch(elParentPanel.Data().matchId, 0);
    }
    function _WatchHighlights(elParentPanel) {
        MatchInfoAPI.WatchHighlights(elParentPanel.Data().matchId, elParentPanel.Data().activePlayerRow.Data().playerXuid);
    }
    function _WatchLowlights(elParentPanel) {
        MatchInfoAPI.WatchLowlights(elParentPanel.Data().matchId, elParentPanel.Data().activePlayerRow.Data().playerXuid);
    }
    function _ShareMatch(elParentPanel) {
        SteamOverlayAPI.CopyTextToClipboard(MatchInfoAPI.GetMatchShareToken(elParentPanel.Data().matchId, "copyurl"));
        let elShareLinkButton = elParentPanel.FindChildInLayoutFile('id-mi-copy');
        UiToolkitAPI.HideTextTooltip();
        UiToolkitAPI.ShowTextTooltipOnPanel(elShareLinkButton, $.Localize("#WatchMenu_Share_Link_Copied"));
    }
    let _CanRedeem = function (elParentPanel) {
        if (!elParentPanel.Data().tournamentIndex) {
            return false;
        }
        let id = InventoryAPI.GetActiveTournamentCoinItemId(elParentPanel.Data().tournamentIndex);
        if (!id || id === '0') {
            return false;
        }
        else {
            let coinLevel = Number(InventoryAPI.GetItemAttributeValue(id, "upgrade level"));
            let coinRedeemsPurchased = Number(InventoryAPI.GetItemAttributeValue(id, "operation drops awarded 1"));
            if (coinRedeemsPurchased && coinLevel != undefined) {
                coinLevel += coinRedeemsPurchased;
            }
            let redeemed = Number(InventoryAPI.GetItemAttributeValue(id, "operation drops awarded 0"));
            let redeemsAvailable = coinLevel - redeemed;
            if ((elParentPanel.Data().tournamentIndex == g_ActiveTournamentInfo.eventid) &&
                g_ActiveTournamentInfo.itemid_charge &&
                ItemInfo.GetStoreSalePrice(InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(g_ActiveTournamentInfo.itemid_charge, 0), 1, '')) {
                ++redeemsAvailable;
            }
            let tournamentName = MatchInfoAPI.GetMatchTournamentName(elParentPanel.Data().matchId);
            return redeemsAvailable > 0 &&
                ((tournamentName != undefined) && (tournamentName != ""));
        }
    };
    function _RedeemSouvenir(tournamentIndex, matchId) {
        UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_redeem_souvenir.xml', 'matchid=' + matchId +
            '&' + 'tournamentindex=' + tournamentIndex);
    }
    function _RefreshRoundWatchEnabled(elParentPanel) {
        let isLive = Boolean(MatchInfoAPI.IsLive(elParentPanel.Data().matchId));
        if (isLive) {
            return;
        }
        let elStatsContainer = elParentPanel.FindChildInLayoutFile('id-mi-round-stats__container');
        let totalBars = elStatsContainer.Children().length;
        if (totalBars == 0) {
            return;
        }
        let canWatch = false;
        for (let i = 1; i <= totalBars; i++) {
            let elRoundStats = elStatsContainer.GetChild(i - 1);
            if (!canWatch) {
                elRoundStats.AddClass('no-hover');
            }
            else {
                elRoundStats.RemoveClass('no-hover');
                elRoundStats.style.tooltipPosition = "bottom";
                elRoundStats.style.tooltipBodyPosition = "50% 0%";
                function _OnRoundMouseOver(elButton) {
                    UiToolkitAPI.ShowTextTooltipOnPanel(elButton, $.Localize("#CSGO_Watch_Round"));
                }
                function _OnRoundActivate(nMatch, nRound) {
                    MatchInfoAPI.Watch(nMatch.toString(), nRound);
                }
                elRoundStats.SetPanelEvent('onmouseover', _OnRoundMouseOver.bind(undefined, elRoundStats));
                elRoundStats.SetPanelEvent('onmouseout', function () { UiToolkitAPI.HideTextTooltip(); });
                elRoundStats.SetPanelEvent('onactivate', _OnRoundActivate.bind(undefined, elParentPanel.Data().matchId, i));
            }
        }
    }
    function _UpdateMatchMenu(elParentPanel) {
        let matchState = MatchInfoAPI.GetMatchState(elParentPanel.Data().matchId);
        let elDownloadButton = elParentPanel.FindChildInLayoutFile('id-mi-download');
        let elShareLinkButton = elParentPanel.FindChildInLayoutFile('id-mi-copy');
        let elWatchButton = elParentPanel.FindChildInLayoutFile('id-mi-watch');
        let elSouvenirButton = elParentPanel.FindChildInLayoutFile('id-mi-souvenir');
        let elWatchHighlightsButton = elParentPanel.FindChildInLayoutFile('id-mi-watch-highlights');
        let elWatchLowlightsButton = elParentPanel.FindChildInLayoutFile('id-mi-watch-lowlights');
        let elDeleteButton = elParentPanel.FindChildInLayoutFile('id-mi-delete');
        let elDownloadingButton = elParentPanel.FindChildInLayoutFile('id-mi-downloading');
        let elDownloadFailedButton = elParentPanel.FindChildInLayoutFile('id-mi-error-delete');
        function _ShowButton(elButton, value) {
            if (elButton) {
                if (value) {
                    elButton.RemoveClass('hide');
                }
                else {
                    elButton.AddClass('hide');
                }
            }
        }
        function _EnableButton(elButton, value) {
            if (elButton) {
                if (value) {
                    elButton.enabled = true;
                }
                else {
                    elButton.enabled = false;
                }
            }
        }
        let canWatch = MatchInfoAPI.CanWatch(elParentPanel.Data().matchId);
        _EnableButton(elWatchButton, canWatch);
        if (elParentPanel.Data().matchListDescriptor != 'live') {
            _ShowButton(elWatchButton, canWatch);
            _ShowButton(elWatchHighlightsButton, canWatch);
            _ShowButton(elWatchLowlightsButton, canWatch);
            _ShowButton(elDownloadButton, !canWatch);
            _ShowButton(elSouvenirButton, (matchState !== "live") && _CanRedeem(elParentPanel));
            let szSouvenirButtonHint = '#popup_redeem_souvenir_title';
            elSouvenirButton.SetPanelEvent('onmouseover', function () { UiToolkitAPI.ShowTextTooltipOnPanel(elSouvenirButton, szSouvenirButtonHint); });
            elSouvenirButton.SetPanelEvent('onmouseout', function () { UiToolkitAPI.HideTextTooltip(); });
            if (elParentPanel.Data().matchListDescriptor != 'downloaded') {
                let szDownloadButtonHint = '#WatchMenu_Download_Demo';
                if (matchState === "downloaded") {
                    _EnableButton(elDownloadButton, false);
                    _ShowButton(elDownloadingButton, false);
                    _ShowButton(elDownloadFailedButton, false);
                }
                else if (matchState === "downloading") {
                    _EnableButton(elDownloadButton, false);
                    _ShowButton(elDownloadingButton, true);
                    _ShowButton(elDownloadFailedButton, false);
                    _ShowButton(elWatchHighlightsButton, false);
                    _ShowButton(elWatchLowlightsButton, false);
                    _ShowButton(elWatchButton, false);
                }
                else if (MatchInfoAPI.CanDownload(elParentPanel.Data().matchId)) {
                    _EnableButton(elDownloadButton, true);
                    _ShowButton(elDownloadingButton, false);
                    _ShowButton(elDownloadFailedButton, false);
                }
                else {
                    szDownloadButtonHint = '#WatchMenu_Download_Disabled_Hint';
                    _EnableButton(elDownloadButton, false);
                    _ShowButton(elDownloadingButton, false);
                    _ShowButton(elDownloadFailedButton, false);
                }
                _EnableButton(elShareLinkButton, (elParentPanel.Data().matchShareToken != "") && (elParentPanel.Data().matchShareToken != undefined));
                elDownloadButton.SetPanelEvent('onmouseover', function () { UiToolkitAPI.ShowTextTooltipOnPanel(elDownloadButton, szDownloadButtonHint); });
                elDownloadButton.SetPanelEvent('onmouseout', function () { UiToolkitAPI.HideTextTooltip(); });
            }
            else {
                _ShowButton(elDownloadButton, false);
                _ShowButton(elDownloadingButton, false);
                _ShowButton(elDownloadFailedButton, false);
            }
            let bEnabledReelLightsButton = ((elParentPanel.Data().activePlayerRow) && (MatchInfoAPI.CanWatchHighlights(elParentPanel.Data().matchId, elParentPanel.Data().activePlayerRow.Data().playerXuid)));
            _EnableButton(elWatchHighlightsButton, bEnabledReelLightsButton);
            _EnableButton(elWatchLowlightsButton, bEnabledReelLightsButton);
            let canDelete = MatchInfoAPI.CanDelete(elParentPanel.Data().matchId);
            _EnableButton(elDeleteButton, canDelete);
            if (!canWatch && canDelete) {
                _ShowButton(elDownloadFailedButton, true);
            }
        }
        else {
            _ShowButton(elDownloadButton, false);
            _ShowButton(elDownloadingButton, false);
            _ShowButton(elDownloadFailedButton, false);
            _ShowButton(elWatchHighlightsButton, false);
            _ShowButton(elWatchLowlightsButton, false);
            _ShowButton(elShareLinkButton, false);
            _ShowButton(elDeleteButton, false);
            _ShowButton(elSouvenirButton, false);
        }
        _RefreshRoundWatchEnabled(elParentPanel);
    }
    function Refresh(elParentPanel) {
        function _ShowLoadingError(elBoundParentPanel) {
            _ShowMatchSpinner(false, elBoundParentPanel);
            _SetMatchMessage($.Localize('#CSGO_Watch_NoMatchData'), true, elBoundParentPanel);
            if (elBoundParentPanel.Data().updateMatchInfoHandler) {
                $.UnregisterForUnhandledEvent('PanoramaComponent_MatchInfo_StateChange', elBoundParentPanel.Data().updateMatchInfoHandler);
            }
            elParentPanel.Data().downloadFailedHandler = undefined;
        }
        if (_IsMatchMetadataFullyLoaded(elParentPanel)) {
            _PopulateMatchInfo(elParentPanel);
        }
        else if (MatchInfoAPI.IsServerLogTournamentMatch(elParentPanel.Data().matchId)) {
            _PopulateServerLogTournamentMatchInfo(elParentPanel);
        }
        else if (!elParentPanel.Data().downloadFailedHandler) {
            MatchInfoAPI.DownloadWithShareToken(elParentPanel.Data().matchId);
            elParentPanel.Data().downloadFailedHandler = $.Schedule(3.0, _ShowLoadingError.bind(undefined, elParentPanel));
            elParentPanel.Data().updateMatchInfoHandler = $.RegisterForUnhandledEvent('PanoramaComponent_MatchInfo_StateChange', _PopulateMatchInfo.bind(undefined, elParentPanel));
        }
    }
    matchInfo.Refresh = Refresh;
    function _PopulateMatchInfo(elParentPanel) {
        if (elParentPanel.Data().downloadFailedHandler) {
            $.CancelScheduled(elParentPanel.Data().downloadFailedHandler);
            elParentPanel.Data().downloadFailedHandler = undefined;
        }
        _FillScoreboard(elParentPanel);
        _UpdateMatchMenu(elParentPanel);
        if (elParentPanel.Data().matchListDescriptor != 'live') {
            _FillRoundStats(elParentPanel, elParentPanel.Data().activePlayerRow);
        }
        _Show(elParentPanel);
    }
    function _PopulateServerLogTournamentMatchInfo(elParentPanel) {
        _FillServerLogTournamentInfo(elParentPanel);
        _UpdateMatchMenu(elParentPanel);
        _Show(elParentPanel);
    }
    function _UpdateName(elParentPanel, elPlayerName) {
        if (elParentPanel.Data().isTournament) {
            elPlayerName.text = MatchInfoAPI.GetMatchPlayerStat(elParentPanel.Data().matchId, elPlayerName.Data().playerXuid, 'name');
        }
        else {
            elPlayerName.text = FriendsListAPI.GetFriendName(elPlayerName.Data().playerXuid);
        }
    }
    function _UpdateTitle(elParentPanel, playerXuid) {
        if (elParentPanel.Data().isTournament) {
            elParentPanel.SetDialogVariable('playerNameTitle', MatchInfoAPI.GetMatchPlayerStat(elParentPanel.Data().matchId, playerXuid, 'name'));
        }
        else {
            elParentPanel.SetDialogVariable('playerNameTitle', FriendsListAPI.GetFriendName(playerXuid));
        }
        let elWatchHighlightsButton = elParentPanel.FindChildInLayoutFile('id-mi-watch-highlights');
        let elWatchLowlightsButton = elParentPanel.FindChildInLayoutFile('id-mi-watch-lowlights');
        if (elWatchHighlightsButton) {
            elWatchHighlightsButton.SetPanelEvent('onmouseover', function () { UiToolkitAPI.ShowTextTooltipOnPanel(elWatchHighlightsButton, UiToolkitAPI.MakeStringSafe($.Localize('#WatchMenu_Watch_Highlights_Player_Selected', elParentPanel))); });
            elWatchLowlightsButton.SetPanelEvent('onmouseover', function () { UiToolkitAPI.ShowTextTooltipOnPanel(elWatchLowlightsButton, UiToolkitAPI.MakeStringSafe($.Localize('#WatchMenu_Watch_Lowlights_Player_Selected', elParentPanel))); });
        }
    }
    function _Show(elParentPanel) {
        elParentPanel.SetReadyForDisplay(true);
        elParentPanel.visible = true;
        elParentPanel.RemoveClass('mi-sb--hidden');
        elParentPanel.Data().updateMatchMenuHandler = $.RegisterForUnhandledEvent('PanoramaComponent_MatchInfo_StateChange', _UpdateMatchMenu.bind(undefined, elParentPanel));
    }
    function _OnFadeOutEnd(elParentPanel) {
        if (elParentPanel.visible === true && elParentPanel.BIsTransparent()) {
            elParentPanel.visible = false;
            elParentPanel.SetReadyForDisplay(false);
        }
    }
    function Hide(elParentPanel) {
        for (let teamId in TEAMS) {
            let elTeam = elParentPanel.FindChildInLayoutFile('players-table-' + TEAMS[teamId]);
            for (let i = 0; i < TEAMSIZE; i++) {
                let elPlayerName = elTeam.GetChild(i).FindChildTraverse('name__label');
                if (elPlayerName.Data().nameUpdateHandler) {
                    $.UnregisterForUnhandledEvent('PanoramaComponent_FriendsList_NameChanged', elPlayerName.Data().nameUpdateHandler);
                    elPlayerName.Data().nameUpdateHandler = undefined;
                }
            }
        }
        if (elParentPanel.Data().downloadFailedHandler) {
            $.CancelScheduled(elParentPanel.Data().downloadFailedHandler);
            elParentPanel.Data().downloadFailedHandler = undefined;
        }
        if (elParentPanel.Data().updateMatchInfoHandler) {
            $.UnregisterForUnhandledEvent('PanoramaComponent_MatchInfo_StateChange', elParentPanel.Data().updateMatchInfoHandler);
            elParentPanel.Data().updateMatchInfoHandler = undefined;
        }
        let elTitle = elParentPanel.FindChildInLayoutFile('id-mi-player-stats-title');
        if (elTitle.Data().nameUpdateHandler) {
            $.UnregisterForUnhandledEvent('PanoramaComponent_FriendsList_NameChanged', elTitle.Data().nameUpdateHandler);
            elTitle.Data().nameUpdateHandler = undefined;
        }
        elParentPanel.AddClass('mi-sb--hidden');
    }
    matchInfo.Hide = Hide;
    function _FillRoundStats(elParentPanel, elPlayerRow) {
        let tickPatternOvertime = [
            'mi-round-tick--right-of-team-switch',
            'mi-round-tick--sub',
            'mi-round-tick--sub',
            'mi-round-tick--sub',
            'mi-round-tick--sub',
            'mi-round-tick--major'
        ];
        function flipBit(n) {
            if (n == 0)
                return 1;
            return 0;
        }
        let elTitle = elParentPanel.FindChildInLayoutFile('id-mi-player-stats-title');
        if (elTitle.Data().nameUpdateHandler == undefined) {
            elTitle.Data().nameUpdateHandler = $.RegisterForUnhandledEvent('PanoramaComponent_FriendsList_NameChanged', _UpdateTitle.bind(undefined, elParentPanel, elPlayerRow.Data().playerXuid));
        }
        _UpdateTitle(elParentPanel, elPlayerRow.Data().playerXuid);
        let currentTeamId = elPlayerRow.Data().teamId;
        if (elParentPanel.Data().activePlayerRow) {
            elParentPanel.Data().activePlayerRow.checked = false;
            elParentPanel.Data().activePlayerRow.RemoveClass('no-hover');
        }
        elPlayerRow.checked = true;
        elPlayerRow.AddClass('no-hover');
        elParentPanel.Data().activePlayerRow = elPlayerRow;
        let isLive = Boolean(MatchInfoAPI.IsLive(elParentPanel.Data().matchId));
        if (isLive == false) {
            elParentPanel.FindChildInLayoutFile('id-mi-player-stats').RemoveClass('mi-player-stats__collapse');
        }
        let elStatsContainer = elParentPanel.FindChildInLayoutFile('id-mi-round-stats__container');
        let elTickLabels = elParentPanel.FindChildInLayoutFile('id-mi-round-stats__tick-labels');
        let team0Score = MatchInfoAPI.GetMatchRoundScoreForTeam(elParentPanel.Data().matchId, 0);
        if (team0Score === undefined)
            team0Score = 0;
        let team1Score = MatchInfoAPI.GetMatchRoundScoreForTeam(elParentPanel.Data().matchId, 1);
        if (team1Score === undefined)
            team1Score = 0;
        let playedRounds = team0Score + team1Score;
        let maxRounds = MatchInfoAPI.GetMatchMaxRounds(elParentPanel.Data().matchId);
        let totalRounds = Math.max(playedRounds, maxRounds);
        let nOvertime = Math.ceil((totalRounds - maxRounds) / 6);
        if (nOvertime > 0) {
            totalRounds = maxRounds + 6 * nOvertime;
        }
        let totalBars = elStatsContainer.Children().length;
        elStatsContainer.SetHasClass("horizontal-center", nOvertime == 0);
        let roundWinsStat = MatchInfoAPI.GetMatchPlayerRoundStats(elParentPanel.Data().matchId, elParentPanel.Data().activePlayerRow.Data().playerXuid, "round_wins");
        let roundWins = roundWinsStat ? roundWinsStat.split(',') : Array(totalRounds).fill(0);
        let mvpsStat = MatchInfoAPI.GetMatchPlayerRoundStats(elParentPanel.Data().matchId, elParentPanel.Data().activePlayerRow.Data().playerXuid, "mvps");
        let mvps = mvpsStat ? mvpsStat.split(',') : Array(totalRounds).fill(0);
        let killsStat = MatchInfoAPI.GetMatchPlayerRoundStats(elParentPanel.Data().matchId, elParentPanel.Data().activePlayerRow.Data().playerXuid, "enemy_kills");
        let kills = killsStat ? killsStat.split(',') : Array(totalRounds).fill(0);
        let headshotsStat = MatchInfoAPI.GetMatchPlayerRoundStats(elParentPanel.Data().matchId, elParentPanel.Data().activePlayerRow.Data().playerXuid, "enemy_headshots");
        let headshots = headshotsStat ? headshotsStat.split(',') : Array(totalRounds).fill(0);
        let deathsStat = MatchInfoAPI.GetMatchPlayerRoundStats(elParentPanel.Data().matchId, elParentPanel.Data().activePlayerRow.Data().playerXuid, "deaths");
        let deaths = deathsStat ? deathsStat.split(',') : Array(totalRounds).fill(0);
        function _IsMajorTick(n) {
            if (n == 1)
                return true;
            if (n == maxRounds)
                return true;
            if (n == totalRounds)
                return true;
            if (n > maxRounds && ((n - maxRounds) % 6 == 0))
                return true;
            return false;
        }
        function _IsMinorTick(n) {
            if (n < maxRounds) {
                if (maxRounds % 5 == 0)
                    return (n % 5 == 0);
                else if (maxRounds % 4 == 0)
                    return (n % 4 == 0);
                else if (maxRounds <= 12 && maxRounds % 3 == 0)
                    return (n % 3 == 0);
                else if (maxRounds <= 8 && maxRounds % 2 == 0)
                    return (n % 2 == 0);
            }
            else {
            }
            return false;
        }
        function _IsRightOfHalftime(n) {
            if (n == (maxRounds / 2 + 1))
                return true;
        }
        function _IsLeftOfHalftime(n) {
            if (n == (maxRounds / 2))
                return true;
        }
        function _GetTickStyleForRound(n) {
            if (_IsRightOfHalftime(n))
                return 'mi-round-tick--right-of-team-switch';
            else if (_IsLeftOfHalftime(n))
                return 'mi-round-tick--left-of-team-switch';
            else if (_IsMajorTick(n))
                return 'mi-round-tick--major';
            else if (_IsMinorTick(n))
                return 'mi-round-tick--minor';
            else
                return 'mi-round-tick--sub';
        }
        function _IsOvertime(n) {
            return (n > maxRounds);
        }
        function _OverTimeLabel(n) {
            if (n <= maxRounds)
                return '';
            let ot = Math.ceil(n - maxRounds) / 6;
            if (nOvertime > 1) {
                return $.Localize('#MatchInfo_Overtime') + ' ' + (ot);
            }
            else {
                return $.Localize('#MatchInfo_Overtime');
            }
        }
        function _GetLabelForTick(n) {
            if (_IsRightOfHalftime(n))
                return '<>';
            else if (_IsRightOfHalftime(n) || _IsLeftOfHalftime(n))
                return '';
            else if (_IsMajorTick(n) || _IsMinorTick(n))
                return n;
            else
                return '';
        }
        let numTimesPlayersChangedSides = 0;
        numTimesPlayersChangedSides += ((totalRounds > (maxRounds / 2)) ? 1 : 0);
        if (totalRounds > maxRounds) {
            let numRoundsPlayedInLastOvertime = (totalRounds - maxRounds) % 6;
            let numFullOvertimesPlayed = (totalRounds - maxRounds - numRoundsPlayedInLastOvertime) / 6;
            numTimesPlayersChangedSides += numFullOvertimesPlayed + ((numRoundsPlayedInLastOvertime > 3) ? 1 : 0);
        }
        if (numTimesPlayersChangedSides % 2 == 1) {
            currentTeamId = flipBit(currentTeamId);
        }
        for (let i = 1; i <= totalRounds; i++) {
            let elRoundStats = undefined;
            if (i > totalBars) {
                elRoundStats = $.CreatePanel('Button', elStatsContainer, 'id-stat-bar-round' + i);
                elRoundStats.BLoadLayoutSnippet('snippet_mi-round-summary-bar');
                elRoundStats.AddClass('round-selection-button');
            }
            else {
                elRoundStats = elStatsContainer.GetChild(i - 1);
            }
            let elRoundBar = elRoundStats.FindChildTraverse('id-mi-round-summary-bar__container');
            let elIconContainer = elRoundStats.FindChildTraverse('id-mi-icons__container');
            if (i > totalBars) {
                let elTick = elRoundBar.GetChild(2).GetChild(1);
                {
                    elTick.AddClass(_GetTickStyleForRound(i));
                }
            }
            else {
                elRoundBar.RemoveClass('hide');
            }
            let elWinBar = elRoundBar.GetChild(0).GetChild(0);
            let elWinLossBorder = elRoundBar.GetChild(1);
            let elLossBar = elRoundBar.GetChild(2).GetChild(0);
            if (i > playedRounds) {
                elWinLossBorder.RemoveClass('sb-tint--CT');
                elWinLossBorder.RemoveClass('sb-tint--TERRORIST');
                elWinBar.AddClass('mi-round-summary-bar--EMPTY');
                elLossBar.AddClass('mi-round-summary-bar--EMPTY');
                elIconContainer.AddClass('hide');
                elRoundStats.AddClass('no-hover');
            }
            else {
                _RefreshRoundWatchEnabled(elParentPanel);
                elIconContainer.RemoveClass('hide');
                let n = i - 1;
                let elMVPStarImg = elRoundStats.FindChildTraverse('id-mvp-star');
                if (mvps[n] != 0) {
                    elMVPStarImg.RemoveClass('hide');
                    elMVPStarImg.RemoveClass('sb-tint--' + TEAMS[flipBit(currentTeamId)]);
                    elMVPStarImg.AddClass('sb-tint--' + TEAMS[currentTeamId]);
                }
                else {
                    elMVPStarImg.AddClass('hide');
                }
                let nKills = parseInt(kills[n]);
                let nHeadshots = parseInt(headshots[n]);
                let elEliminationWinIcons = elRoundStats.FindChildTraverse('id-mi-eliminations-win');
                for (let k = 0; k < 5; k++) {
                    let kIcon = elEliminationWinIcons.FindChildTraverse('id-mi-icon-elimination_' + k);
                    let hIcon = elEliminationWinIcons.FindChildTraverse('id-mi-icon-elimination--headshot_' + k);
                    if (k >= (nKills)) {
                        kIcon.AddClass('hide');
                        hIcon.AddClass('hide');
                    }
                    else if (k >= nHeadshots) {
                        kIcon.RemoveClass('hide');
                        hIcon.AddClass('hide');
                    }
                    else {
                        kIcon.AddClass('hide');
                        hIcon.RemoveClass('hide');
                    }
                }
                let elDeathIcon = elIconContainer.FindChildTraverse('id-mi-elimination-death');
                if (deaths[n] == 1) {
                    elDeathIcon.RemoveClass('hide');
                }
                else {
                    elDeathIcon.AddClass('hide');
                }
                if (roundWins[n] == 1) {
                    elWinBar.RemoveClass('mi-round-summary-bar--EMPTY');
                    elLossBar.AddClass('mi-round-summary-bar--EMPTY');
                }
                else {
                    elWinBar.AddClass('mi-round-summary-bar--EMPTY');
                    elLossBar.RemoveClass('mi-round-summary-bar--EMPTY');
                }
                elWinBar.RemoveClass('sb-tint--' + TEAMS[flipBit(currentTeamId)]);
                elWinBar.AddClass('sb-tint--' + TEAMS[currentTeamId]);
                elWinLossBorder.RemoveClass('sb-tint--' + TEAMS[flipBit(currentTeamId)]);
                elWinLossBorder.AddClass('sb-tint--' + TEAMS[currentTeamId]);
                elEliminationWinIcons.RemoveClass('sb-tint--' + TEAMS[flipBit(currentTeamId)]);
                elEliminationWinIcons.AddClass('sb-tint--' + TEAMS[currentTeamId]);
            }
            if ((i == maxRounds / 2) || ((i > maxRounds) && (((i - maxRounds) % 6) == 3))) {
                currentTeamId = flipBit(currentTeamId);
            }
        }
        elParentPanel.FindChildInLayoutFile('id-mi-round-stats__tick-labels');
        elTickLabels.RemoveAndDeleteChildren();
        for (let i = 1; i <= totalRounds; i++) {
            let elTick = $.CreatePanel('Panel', elTickLabels, 'id-tick' + i);
            elTick.BLoadLayoutSnippet('snippet-tick');
            let strLabelForTick = _GetLabelForTick(i);
            elTick.SetDialogVariable('n', strLabelForTick.toString());
            elTick.SetHasClass('mi-tick-class-halftime-align', strLabelForTick === '<>');
        }
    }
    function _OpenPlayerCard(xuid) {
        $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.sidemenu_select', 'MOUSE');
        let elPlayerCardContextMenu = UiToolkitAPI.ShowCustomLayoutContextMenuParametersDismissEvent('id-player-' + xuid, '', 'file://{resources}/layout/context_menus/context_menu_playercard.xml', 'xuid=' + xuid, function () { });
        elPlayerCardContextMenu.AddClass("ContextMenu_NoArrow");
    }
    function _FillScoreboard(elParentPanel) {
        let elScoreboard = elParentPanel.FindChildInLayoutFile('Scoreboard');
        elScoreboard.visible = true;
        _ShowMatchSpinner(false, elParentPanel);
        _SetMatchMessage("", false, elParentPanel);
        let currentTopPanelTeamId = MatchInfoAPI.GetMatchTournamentTeamID(elParentPanel.Data().matchId, 0);
        if (elParentPanel.Data().teamsFilled) {
            if (currentTopPanelTeamId != elParentPanel.Data().cachedTopPanelTeamId) {
                elParentPanel.Data().teamsFilled = false;
            }
        }
        elParentPanel.Data().cachedTopPanelTeamId = currentTopPanelTeamId;
        function Helper_FillTeamStats(teamId) {
            let elTeam = elParentPanel.FindChildInLayoutFile('players-table-' + TEAMS[teamId]);
            let elScoreboxBackdrop = elParentPanel.FindChildInLayoutFile('id-sb-scorebox_backdrop--' + TEAMS[teamId]);
            if (elParentPanel.Data().isTournament) {
                let tag = MatchInfoAPI.GetMatchTournamentTeamTag(elParentPanel.Data().matchId, teamId);
                if (!tag) {
                    tag = '';
                }
                elScoreboxBackdrop.SetImage('file://{images}/tournaments/teams/' + tag.toLowerCase() + '.svg');
                elScoreboxBackdrop.AddClass('scorebox_backdrop--tournament');
                elParentPanel.SetDialogVariable('sb_team_name--' + TEAMS[teamId], MatchInfoAPI.GetMatchTournamentTeamName(elParentPanel.Data().matchId, teamId));
            }
            else {
                elParentPanel.SetDialogVariable('sb_team_name--' + TEAMS[teamId], $.Localize('#teamname_' + TEAMS[teamId]));
            }
            elParentPanel.SetDialogVariable('score_' + TEAMS[teamId], (MatchInfoAPI.GetMatchRoundScoreForTeam(elParentPanel.Data().matchId, teamId)).toString());
            for (let i = 0; i < TEAMSIZE; i++) {
                let elPlayerRow = elTeam.GetChild(i);
                if (!elParentPanel.Data().teamsFilled) {
                    elPlayerRow.Data().playerXuid = MatchInfoAPI.GetMatchPlayerXuidByIndexForTeam(elParentPanel.Data().matchId, teamId, i);
                }
                let playerXuid = elPlayerRow.Data().playerXuid;
                let elPlayerName = elPlayerRow.FindChildTraverse('name__label');
                let elAvatarImage = elPlayerRow.FindChildTraverse('avatar');
                let elAvatarTeamLogo = elPlayerRow.FindChildTraverse('avatarteamlogo');
                if (!elParentPanel.Data().teamsFilled) {
                    elPlayerName.Data().matchId = elParentPanel.Data().matchId;
                    elPlayerName.Data().playerXuid = playerXuid;
                    elAvatarImage.SetPanelEvent('onactivate', _OpenPlayerCard.bind(undefined, playerXuid));
                    elAvatarTeamLogo.SetPanelEvent('onactivate', _OpenPlayerCard.bind(undefined, playerXuid));
                }
                if (elPlayerName.Data().nameUpdateHandler == undefined) {
                    elPlayerName.Data().nameUpdateHandler = $.RegisterForUnhandledEvent('PanoramaComponent_FriendsList_NameChanged', _UpdateName.bind(undefined, elParentPanel, elPlayerName));
                }
                _UpdateName(elParentPanel, elPlayerName);
                if (!elParentPanel.Data().teamsFilled) {
                    let tag = MatchInfoAPI.GetMatchTournamentTeamTag(elParentPanel.Data().matchId, teamId);
                    if (!tag) {
                        tag = '';
                    }
                    elAvatarImage.visible = !elParentPanel.Data().isTournament;
                    elAvatarTeamLogo.visible = elParentPanel.Data().isTournament;
                    if (elParentPanel.Data().isTournament) {
                        elAvatarTeamLogo.SetImage('file://{images}/tournaments/teams/' + tag.toLowerCase() + '.svg');
                    }
                    else if (elAvatarImage.Data().steamid !== playerXuid) {
                        elAvatarImage.PopulateFromSteamID(playerXuid);
                        elAvatarImage.Data().steamid = playerXuid;
                    }
                }
                for (let p in PLAYERSTATS) {
                    let elStat = elPlayerRow.FindChildTraverse(PLAYERSTATS[p]);
                    let elStatData = MatchInfoAPI.GetMatchPlayerStat(elParentPanel.Data().matchId, playerXuid, PLAYERSTATS[p]);
                    elStat.text = elStatData;
                    if (PLAYERSTATS[p] === 'mvps') {
                        if (elStatData == '0' || !elStatData) {
                            elPlayerRow.FindChildTraverse('mvps__panel').AddClass('hide-mvps');
                        }
                        else {
                            elPlayerRow.FindChildTraverse('mvps__panel').RemoveClass('hide-mvps');
                        }
                    }
                }
            }
        }
        Helper_FillTeamStats(0);
        Helper_FillTeamStats(1);
        elParentPanel.Data().teamsFilled = true;
        let rawModeName = MatchInfoAPI.GetMatchMode(elParentPanel.Data().matchId);
        let rawMapName = MatchInfoAPI.GetMatchMap(elParentPanel.Data().matchId);
        let mapStringPrefix = '#SFUI_Map_';
        let mapName = $.Localize(mapStringPrefix + rawMapName);
        if (mapName === mapStringPrefix + rawMapName)
            mapName = rawMapName;
        elParentPanel.SetDialogVariable('map_name', mapName);
        let elMatchMapIcon = elParentPanel.FindChildTraverse("id-mi-map-icon");
        let setDefaultMapImage = function (mapIcon) {
            mapIcon.SetImage("file://{images}/map_icons/map_icon_NONE.png");
        };
        if (elMatchMapIcon) {
            $.RegisterEventHandler('ImageFailedLoad', elMatchMapIcon, setDefaultMapImage.bind(undefined, elMatchMapIcon));
            elMatchMapIcon.SetImage("file://{images}/map_icons/map_icon_" + rawMapName + ".svg");
        }
        let elMatchModeIcon = elParentPanel.FindChildTraverse("id-mi-mode-icon");
        let setDefaultModeImage = function (mapIcon) {
            mapIcon.SetImage("file://{images}/icons/ui/competitive.vsvg");
        };
        if (elMatchModeIcon) {
            $.RegisterEventHandler('ImageFailedLoad', elMatchModeIcon, setDefaultModeImage.bind(undefined, elMatchModeIcon));
            elMatchModeIcon.SetImage("file://{images}/icons/ui/" + rawModeName + ".svg");
        }
        let matchDuration = MatchInfoAPI.GetMatchDuration(elParentPanel.Data().matchId);
        matchDuration = Math.max(Math.floor(matchDuration / 60), 1);
        elParentPanel.SetDialogVariable('duration', $.ConstructString('#CSGO_Watch_Minute:f', { value: matchDuration }));
        if (elParentPanel.Data().matchListDescriptor === 'live') {
            let round = 1 + MatchInfoAPI.GetMatchRoundScoreForTeam(elParentPanel.Data().matchId, 0) + MatchInfoAPI.GetMatchRoundScoreForTeam(elParentPanel.Data().matchId, 1);
            let progressionStateString = '#WatchMenu_FirstHalf';
            if (round > 31) {
                progressionStateString = '#WatchMenu_Overtime';
            }
            else if (round > 15) {
                progressionStateString = '#WatchMenu_SecondHalf';
            }
            elParentPanel.SetDialogVariable('dateOrRound', $.Localize(progressionStateString));
            elParentPanel.SetDialogVariable('dateOrRoundLabel', $.Localize('#CSGO_Watch_Info_4'));
            elParentPanel.SetDialogVariable('durationLabel', $.Localize("#CSGO_Watch_Info_5"));
        }
        else {
            elParentPanel.SetDialogVariable('dateOrRound', MatchInfoAPI.IsLive(elParentPanel.Data().matchId) ? $.Localize('#CSGO_Watch_Cat_LiveMatches') : MatchInfoAPI.GetMatchTimestamp(elParentPanel.Data().matchId));
            elParentPanel.SetDialogVariable('dateOrRoundLabel', $.Localize('#CSGO_Watch_Info_2'));
            elParentPanel.SetDialogVariable('durationLabel', $.Localize("#CSGO_Watch_Info_1"));
        }
    }
    function _FillServerLogTournamentInfo(elParentPanel) {
        PopulateForTeam(0);
        PopulateForTeam(1);
        function PopulateForTeam(nTeam) {
            let tag = MatchInfoAPI.GetMatchTournamentTeamTag(elParentPanel.Data().matchId, nTeam);
            if (tag) {
                let strFilename = 'file://{images}/tournaments/teams/' + tag.toLowerCase() + '.svg';
                let img = elParentPanel.FindChildTraverse('team_image' + nTeam);
                img.SetImage(strFilename);
            }
            elParentPanel.SetDialogVariable('teamname' + nTeam, MatchInfoAPI.GetMatchTournamentTeamName(elParentPanel.Data().matchId, nTeam));
            elParentPanel.SetDialogVariable('score' + nTeam, (MatchInfoAPI.GetMatchRoundScoreForTeam(elParentPanel.Data().matchId, nTeam)).toString());
        }
        let rawMapName = MatchInfoAPI.GetMatchMap(elParentPanel.Data().matchId);
        let mapStringPrefix = '#SFUI_Map_';
        let mapName = $.Localize(mapStringPrefix + rawMapName);
        if (mapName === mapStringPrefix + rawMapName)
            mapName = rawMapName;
        elParentPanel.SetDialogVariable('mapname', mapName);
        let elMatchMapIcon = elParentPanel.FindChildTraverse("map_image");
        if (elMatchMapIcon) {
            elMatchMapIcon.SetImage("file://{images}/map_icons/map_icon_" + rawMapName + ".svg");
        }
        let elTournamentLogo = elParentPanel.FindChildTraverse("tournament_logo");
        elTournamentLogo.SetImage('file://{images}/tournaments/events/tournament_logo_' + elParentPanel.Data().tournamentIndex + '.svg');
        elParentPanel.SetDialogVariable('tournamentphase', $.Localize(MatchInfoAPI.GetMatchTournamentStageName(elParentPanel.Data().matchId)));
        elParentPanel.SetDialogVariable('matchphase', MatchInfoAPI.IsLive(elParentPanel.Data().matchId) ? $.Localize('#CSGO_Watch_Cat_LiveMatches') : MatchInfoAPI.GetMatchTimestamp(elParentPanel.Data().matchId));
    }
    function Init(elParentPanel) {
        _ShowMatchSpinner(true, elParentPanel);
        _SetMatchMessage("", false, elParentPanel);
        let bIsMinimalMatchInfo = MatchInfoAPI.IsServerLogTournamentMatch(elParentPanel.Data().matchId);
        elParentPanel.SetHasClass('matchinfo--minimal', bIsMinimalMatchInfo);
        if (bIsMinimalMatchInfo) {
            let minimalInfoBody = $.CreatePanel('Panel', elParentPanel, 'minimal-match-info');
            minimalInfoBody.BLoadLayoutSnippet('matchinfo_serverlogtournament_minimal');
        }
        let myXuid = MyPersonaAPI.GetXuid();
        function Helper_CreateScoreboard(teamId) {
            let elRowToActivate = undefined;
            let elTeam = elParentPanel.FindChildInLayoutFile('players-table-' + TEAMS[teamId]);
            for (let i = 0; i < TEAMSIZE; i++) {
                let playerXuid = MatchInfoAPI.GetMatchPlayerXuidByIndexForTeam(elParentPanel.Data().matchId, teamId, i);
                let elPlayerRow = $.CreatePanel('Panel', elTeam, 'id-player-' + playerXuid);
                if (!playerXuid) {
                    elTeam.AddClass('with-empty-rows');
                }
                elPlayerRow.Data().playerXuid = playerXuid;
                elPlayerRow.Data().teamId = teamId;
                if (elParentPanel.Data().matchListDescriptor != 'live') {
                    elPlayerRow.SetPanelEvent('onactivate', _FillRoundStats.bind(undefined, elParentPanel, elPlayerRow));
                    if (((i == 0) && (teamId == 0)) || (myXuid === playerXuid)) {
                        elParentPanel.Data().activePlayerRow = elPlayerRow;
                    }
                }
                elPlayerRow.BLoadLayoutSnippet('snippet_scoreboard-classic__row--comp');
                let elAvatarImage = elPlayerRow.FindChildTraverse('avatar');
                elAvatarImage.AddClass('sb-row__cell--avatar--' + TEAMS[teamId]);
                let elPlayerNameLabel = elPlayerRow.FindChildTraverse('name__label');
                elPlayerNameLabel.AddClass('sb-tint--' + TEAMS[teamId]);
                elPlayerNameLabel.SetPanelEvent('onactivate', function (elParentPanel, elPlayerRow, playerXuid) {
                    if (elParentPanel.Data().matchListDescriptor != 'live')
                        _FillRoundStats(elParentPanel, elPlayerRow);
                    _OpenPlayerCard(playerXuid);
                }
                    .bind(undefined, elParentPanel, elPlayerRow, playerXuid));
                let elStatsContainer = elPlayerRow.FindChildTraverse('id-sb-row-stats');
                for (let p in PLAYERSTATS) {
                    let elStat;
                    if (PLAYERSTATS[p] === 'mvps') {
                        let elMvpsPanel = $.CreatePanel('Panel', elStatsContainer, 'mvps__panel');
                        let elStar = $.CreatePanel("Image", elMvpsPanel, 'mvps--image');
                        elStar.SetImage('file://{images}/icons/ui/star.svg');
                        elStat = $.CreatePanel('Label', elMvpsPanel, PLAYERSTATS[p]);
                        elStat.AddClass('mi-mvps-shrink-overflow');
                        elMvpsPanel.AddClass('sb-row__cell');
                        elMvpsPanel.AddClass('sb-row__cell--mvps');
                        elStar.AddClass('sb-row__cell--mvps__star');
                        elStat.AddClass('sb-row__cell--mvps__count');
                        elStat = elMvpsPanel;
                    }
                    else {
                        elStat = $.CreatePanel('Panel', elStatsContainer, "");
                        elStat.AddClass('sb-row__cell');
                        elStat.AddClass('sb-row__cell--' + PLAYERSTATS[p]);
                        elStat = $.CreatePanel('Label', elStat, PLAYERSTATS[p]);
                    }
                    elStat.AddClass('sb-tint--' + TEAMS[teamId]);
                }
            }
        }
        Helper_CreateScoreboard(0);
        Helper_CreateScoreboard(1);
        let tournamentName = MatchInfoAPI.GetMatchTournamentName(elParentPanel.Data().matchId);
        elParentPanel.Data().isTournament = ((tournamentName != "") && (tournamentName != undefined));
        elParentPanel.Data().matchShareToken = MatchInfoAPI.GetMatchShareToken(elParentPanel.Data().matchId, "text");
        elParentPanel.Data().downloadFailedTest = undefined;
        elParentPanel.Data().updateMatchInfoHandler = undefined;
        elParentPanel.Data().teamsFilled = false;
        let elColumnLabels = elParentPanel.FindChildInLayoutFile('players-table__labels-row');
        for (let p in PLAYERSTATS) {
            let elStatContainter = $.CreatePanel('Panel', elColumnLabels, "");
            elStatContainter.AddClass('sb-row__cell');
            elStatContainter.AddClass('sb-row__cell--' + PLAYERSTATS[p]);
            elStatContainter.AddClass('matchinfo-scoreboard-header-stat-cell');
            let elStatLabel = $.CreatePanel('Label', elStatContainter, PLAYERSTATS[p]);
            elStatLabel.text = $.Localize('#Scoreboard_' + PLAYERSTATS[p] + '_header');
        }
        $.RegisterEventHandler('PropertyTransitionEnd', elParentPanel, _OnFadeOutEnd.bind(undefined, elParentPanel));
        let elDownloadButton = elParentPanel.FindChildInLayoutFile('id-mi-download');
        let elShareLinkButton = elParentPanel.FindChildInLayoutFile('id-mi-copy');
        let elWatchButton = elParentPanel.FindChildInLayoutFile('id-mi-watch');
        let elWatchHighlightsButton = elParentPanel.FindChildInLayoutFile('id-mi-watch-highlights');
        let elWatchLowlightsButton = elParentPanel.FindChildInLayoutFile('id-mi-watch-lowlights');
        let elDeleteButton = elParentPanel.FindChildInLayoutFile('id-mi-delete');
        let elDownloadingButton = elParentPanel.FindChildInLayoutFile('id-mi-downloading');
        let elDownloadFailedButton = elParentPanel.FindChildInLayoutFile('id-mi-error-delete');
        let elSouvenirButton = elParentPanel.FindChildInLayoutFile('id-mi-souvenir');
        if (elWatchButton && (elParentPanel.Data().matchListDescriptor == 'live')) {
            let elWatchLabel = elWatchButton.GetChild(0);
            elWatchLabel.text = $.Localize("#WatchMenu_Watch_Live");
            elWatchLabel.style.textTransform = "uppercase";
        }
        elDownloadButton.SetPanelEvent('onactivate', _DownloadMatch.bind(undefined, elParentPanel));
        elShareLinkButton.SetPanelEvent('onactivate', _ShareMatch.bind(undefined, elParentPanel));
        elShareLinkButton.SetDialogVariable('matchcode', elParentPanel.Data().matchShareToken);
        elShareLinkButton.SetPanelEvent('onmouseover', function () { UiToolkitAPI.ShowTextTooltipOnPanel(elShareLinkButton, $.Localize('#WatchMenu_Get_Share_Link')); });
        elShareLinkButton.SetPanelEvent('onmouseout', function () { UiToolkitAPI.HideTextTooltip(); });
        elWatchButton.SetPanelEvent('onactivate', _Watch.bind(undefined, elParentPanel));
        elWatchHighlightsButton.SetPanelEvent('onactivate', _WatchHighlights.bind(undefined, elParentPanel));
        elWatchHighlightsButton.SetPanelEvent('onmouseover', function () { UiToolkitAPI.ShowTextTooltipOnPanel(elWatchHighlightsButton, $.Localize('#WatchMenu_Watch_Highlights')); });
        elWatchHighlightsButton.SetPanelEvent('onmouseout', function () { UiToolkitAPI.HideTextTooltip(); });
        elWatchLowlightsButton.SetPanelEvent('onactivate', _WatchLowlights.bind(undefined, elParentPanel));
        elWatchLowlightsButton.SetPanelEvent('onmouseover', function () { UiToolkitAPI.ShowTextTooltipOnPanel(elWatchLowlightsButton, $.Localize('#WatchMenu_Watch_Lowlights')); });
        elWatchLowlightsButton.SetPanelEvent('onmouseout', function () { UiToolkitAPI.HideTextTooltip(); });
        elDeleteButton.SetPanelEvent('onactivate', _DeleteDemo.bind(undefined, elParentPanel));
        elDeleteButton.SetPanelEvent('onmouseover', function () { UiToolkitAPI.ShowTextTooltipOnPanel(elDeleteButton, $.Localize('#WatchMenu_Delete')); });
        elDeleteButton.SetPanelEvent('onmouseout', function () { UiToolkitAPI.HideTextTooltip(); });
        elDownloadFailedButton.SetPanelEvent('onactivate', _DownloadFailedNotify.bind(undefined, elParentPanel));
        elSouvenirButton.SetPanelEvent('onactivate', _RedeemSouvenir.bind(undefined, elParentPanel.Data().tournamentIndex, elParentPanel.Data().matchId));
        Refresh(elParentPanel);
    }
    matchInfo.Init = Init;
})(matchInfo || (matchInfo = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWF0Y2hpbmZvLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvbWF0Y2hpbmZvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFTQSxrQ0FBa0M7QUFDbEMsMENBQTBDO0FBQzFDLDJDQUEyQztBQUMzQyw2Q0FBNkM7QUFDN0MseUVBQXlFO0FBRXpFLElBQVUsU0FBUyxDQXlyQ2xCO0FBenJDRCxXQUFVLFNBQVM7SUFFZixJQUFJLFdBQVcsR0FBRyxDQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUUsQ0FBQztJQUNwRSxJQUFJLEtBQUssR0FBRSxDQUFFLElBQUksRUFBRSxXQUFXLENBQUUsQ0FBQztJQUNqQyxJQUFJLFFBQVEsR0FBRyxDQUFDLENBQUM7SUFFakIsU0FBUyxpQkFBaUIsQ0FBRSxLQUFhLEVBQUUsR0FBWTtRQUVuRCxJQUFLLEdBQUcsRUFDUjtZQUNJLElBQUksU0FBUyxHQUFHLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBRSxrQkFBa0IsQ0FBRSxDQUFDO1lBQ2hFLElBQUssU0FBUyxFQUNkO2dCQUNJLElBQUssS0FBSyxFQUNWO29CQUNJLFNBQVMsQ0FBQyxXQUFXLENBQUUsTUFBTSxDQUFFLENBQUM7aUJBQ25DO3FCQUVEO29CQUNJLFNBQVMsQ0FBQyxRQUFRLENBQUUsTUFBTSxDQUFFLENBQUM7aUJBQ2hDO2FBQ0o7U0FDSjtJQUNMLENBQUM7SUFFRCxTQUFTLGdCQUFnQixDQUFFLEtBQWEsRUFBRSxJQUFhLEVBQUUsR0FBWTtRQUVqRSxJQUFLLEdBQUcsRUFDUjtZQUNJLElBQUksU0FBUyxHQUFHLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBRSxrQkFBa0IsQ0FBYSxDQUFDO1lBQzNFLElBQUssU0FBUyxFQUNkO2dCQUNJLFNBQVMsQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDO2FBQzFCO1lBQ0QsSUFBSSxrQkFBa0IsR0FBRyxHQUFHLENBQUMscUJBQXFCLENBQUUsNEJBQTRCLENBQUUsQ0FBQztZQUNuRixJQUFLLGtCQUFrQixFQUN2QjtnQkFDSSxJQUFLLElBQUksRUFDVDtvQkFDSSxrQkFBa0IsQ0FBQyxXQUFXLENBQUUsTUFBTSxDQUFFLENBQUM7aUJBQzVDO3FCQUVEO29CQUNJLGtCQUFrQixDQUFDLFFBQVEsQ0FBRSxNQUFNLENBQUUsQ0FBQztpQkFDekM7YUFDSjtTQUNKO0lBQ0wsQ0FBQztJQUVELFNBQVMsMkJBQTJCLENBQUUsYUFBc0I7UUFFeEQsT0FBTyxDQUFFLENBQUUsQ0FBRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsbUJBQW1CLElBQUksTUFBTSxDQUFFLElBQUksQ0FBRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxJQUFJLE1BQU0sQ0FBRSxDQUFFLElBQUksQ0FBRSxZQUFZLENBQUMseUJBQXlCLENBQUUsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBRSxDQUFFLENBQUUsQ0FBQztJQUN0TSxDQUFDO0lBRUQsU0FBUyxjQUFjLENBQUUsYUFBc0I7UUFFM0MsWUFBWSxDQUFDLE1BQU0sQ0FBRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFFLENBQUM7UUFDcEQsWUFBWSxDQUFDLFFBQVEsQ0FBRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFFLENBQUM7UUFDdEQsZ0JBQWdCLENBQUUsYUFBYSxDQUFFLENBQUM7SUFDdEMsQ0FBQztJQUVELFNBQVMscUJBQXFCLENBQUUsYUFBc0I7UUFFbEQsSUFBSSxXQUFXLEdBQUcsQ0FBQyxDQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxtQkFBbUIsS0FBSyxZQUFZLENBQUU7ZUFDekUsQ0FBRSxDQUFFLFlBQVksQ0FBQyxhQUFhLENBQUUsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLFNBQVMsQ0FBRSxLQUFLLFFBQVEsQ0FBRSxJQUFJLENBQUUsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLFlBQVksQ0FBRSxDQUFFLENBQUM7UUFDbEksSUFBSyxXQUFXLEVBQ2hCO1lBQ0ksWUFBWSxDQUFDLHFCQUFxQixDQUFFLENBQUMsQ0FBQyxRQUFRLENBQUUsaUNBQWlDLENBQUUsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFFLHVDQUF1QyxDQUFFLEVBQUUsRUFBRSxFQUFFLGNBQWEsY0FBYyxDQUFFLGFBQWEsQ0FBRSxDQUFBLENBQUMsQ0FBQyxFQUFFLGNBQVksQ0FBQyxDQUFFLENBQUM7U0FDbk47YUFFRDtZQUNJLFlBQVksQ0FBQyxrQkFBa0IsQ0FBRSxDQUFDLENBQUMsUUFBUSxDQUFFLGlDQUFpQyxDQUFFLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxzQ0FBc0MsQ0FBRSxFQUFFLEVBQUUsRUFBRSxjQUFZLENBQUMsQ0FBRSxDQUFDO1NBQy9KO0lBQ0wsQ0FBQztJQUVELFNBQVMsV0FBVyxDQUFFLGFBQXNCO1FBRXhDLFlBQVksQ0FBQyxNQUFNLENBQUUsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBRSxDQUFBO1FBQ25ELElBQUssYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLG1CQUFtQixLQUFLLFlBQVksRUFDOUQ7WUFDSSxjQUFjLENBQUMsZUFBZSxFQUFFLENBQUM7U0FDcEM7YUFFRDtZQUNJLGdCQUFnQixDQUFFLGFBQWEsQ0FBRSxDQUFDO1NBQ3JDO0lBQ0wsQ0FBQztJQUVELFNBQVMsTUFBTSxDQUFFLGFBQXNCO1FBRW5DLFlBQVksQ0FBQyxLQUFLLENBQUUsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUUsQ0FBQztJQUMxRCxDQUFDO0lBRUQsU0FBUyxnQkFBZ0IsQ0FBRSxhQUFzQjtRQUU3QyxZQUFZLENBQUMsZUFBZSxDQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUUsQ0FBQztJQUM1SCxDQUFDO0lBRUQsU0FBUyxlQUFlLENBQUUsYUFBc0I7UUFFekMsWUFBWSxDQUFDLGNBQWMsQ0FBRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFFLENBQUM7SUFDeEgsQ0FBQztJQUVELFNBQVMsV0FBVyxDQUFFLGFBQXNCO1FBRXhDLGVBQWUsQ0FBQyxtQkFBbUIsQ0FBRSxZQUFZLENBQUMsa0JBQWtCLENBQUUsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUUsQ0FBRSxDQUFDO1FBQ2xILElBQUksaUJBQWlCLEdBQUcsYUFBYSxDQUFDLHFCQUFxQixDQUFFLFlBQVksQ0FBRSxDQUFDO1FBQzVFLFlBQVksQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUMvQixZQUFZLENBQUMsc0JBQXNCLENBQUUsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFFLENBQUM7SUFDekcsQ0FBQztJQUVELElBQUksVUFBVSxHQUFHLFVBQVcsYUFBc0I7UUFFOUMsSUFBSyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxlQUFlLEVBQzFDO1lBQ0ksT0FBTyxLQUFLLENBQUM7U0FDaEI7UUFFRCxJQUFJLEVBQUUsR0FBRyxZQUFZLENBQUMsNkJBQTZCLENBQUUsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLGVBQWUsQ0FBRSxDQUFDO1FBQzVGLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEdBQUcsRUFDckI7WUFDSSxPQUFPLEtBQUssQ0FBQztTQUNoQjthQUVEO1lBQ0wsSUFBSSxTQUFTLEdBQUcsTUFBTSxDQUFFLFlBQVksQ0FBQyxxQkFBcUIsQ0FBRSxFQUFFLEVBQUUsZUFBZSxDQUFFLENBQUMsQ0FBQztZQUVuRixJQUFJLG9CQUFvQixHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMscUJBQXFCLENBQUUsRUFBRSxFQUFFLDJCQUEyQixDQUFFLENBQUMsQ0FBQztZQUN6RyxJQUFLLG9CQUFvQixJQUFJLFNBQVMsSUFBSSxTQUFTLEVBQzFDO2dCQUVSLFNBQVMsSUFBSSxvQkFBb0IsQ0FBQzthQUN6QjtZQUVELElBQUksUUFBUSxHQUFHLE1BQU0sQ0FBRSxZQUFZLENBQUMscUJBQXFCLENBQUUsRUFBRSxFQUFFLDJCQUEyQixDQUFFLENBQUMsQ0FBQztZQUN2RyxJQUFJLGdCQUFnQixHQUFHLFNBQVMsR0FBRyxRQUFRLENBQUM7WUFHNUMsSUFBSyxDQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxlQUFlLElBQUksc0JBQXNCLENBQUMsT0FBTyxDQUFFO2dCQUM5RSxzQkFBc0IsQ0FBQyxhQUFhO2dCQUNwQyxRQUFRLENBQUMsaUJBQWlCLENBQUUsWUFBWSxDQUFDLGlDQUFpQyxDQUFFLHNCQUFzQixDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFFLEVBQzdIO2dCQUNELEVBQUcsZ0JBQWdCLENBQUM7YUFDcEI7WUFFUSxJQUFJLGNBQWMsR0FBRyxZQUFZLENBQUMsc0JBQXNCLENBQUUsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBRSxDQUFDO1lBQ3pGLE9BQU8sZ0JBQWdCLEdBQUcsQ0FBQztnQkFDdkIsQ0FBRSxDQUFFLGNBQWMsSUFBSSxTQUFTLENBQUUsSUFBSSxDQUFFLGNBQWMsSUFBSSxFQUFFLENBQUUsQ0FBRSxDQUFDO1NBQ3ZFO0lBQ0wsQ0FBQyxDQUFDO0lBRUYsU0FBUyxlQUFlLENBQUUsZUFBc0IsRUFBRSxPQUFjO1FBRTVELFlBQVksQ0FBQywrQkFBK0IsQ0FDeEMsRUFBRSxFQUNGLDREQUE0RCxFQUM1RCxVQUFVLEdBQUcsT0FBTztZQUNwQixHQUFHLEdBQUcsa0JBQWtCLEdBQUcsZUFBZSxDQUM3QyxDQUFDO0lBQ04sQ0FBQztJQUVELFNBQVMseUJBQXlCLENBQUUsYUFBcUI7UUFFckQsSUFBSSxNQUFNLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFFeEUsSUFBSyxNQUFNLEVBQ1g7WUFDSSxPQUFPO1NBQ1Y7UUFFRCxJQUFJLGdCQUFnQixHQUFHLGFBQWEsQ0FBQyxxQkFBcUIsQ0FBRSw4QkFBOEIsQ0FBRSxDQUFDO1FBRTdGLElBQUksU0FBUyxHQUFHLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxDQUFDLE1BQU0sQ0FBQztRQUVuRCxJQUFLLFNBQVMsSUFBSSxDQUFDLEVBQ25CO1lBQ0ksT0FBTztTQUNWO1FBR0QsSUFBSSxRQUFRLEdBQUcsS0FBSyxDQUFDO1FBRXJCLEtBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxTQUFTLEVBQUUsQ0FBQyxFQUFFLEVBQ3BDO1lBQ0ksSUFBSSxZQUFZLEdBQUcsZ0JBQWdCLENBQUMsUUFBUSxDQUFFLENBQUMsR0FBQyxDQUFDLENBQUUsQ0FBQztZQUVwRCxJQUFLLENBQUMsUUFBUSxFQUNkO2dCQUNJLFlBQVksQ0FBQyxRQUFRLENBQUUsVUFBVSxDQUFFLENBQUM7YUFDdkM7aUJBRUQ7Z0JBQ0ksWUFBWSxDQUFDLFdBQVcsQ0FBRSxVQUFVLENBQUUsQ0FBQztnQkFDdkMsWUFBWSxDQUFDLEtBQUssQ0FBQyxlQUFlLEdBQUcsUUFBUSxDQUFDO2dCQUM5QyxZQUFZLENBQUMsS0FBSyxDQUFDLG1CQUFtQixHQUFHLFFBQVEsQ0FBQztnQkFDbEQsU0FBUyxpQkFBaUIsQ0FBRSxRQUFpQjtvQkFFekMsWUFBWSxDQUFDLHNCQUFzQixDQUFFLFFBQVEsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFFLG1CQUFtQixDQUFFLENBQUUsQ0FBQztnQkFDdkYsQ0FBQztnQkFFRCxTQUFTLGdCQUFnQixDQUFFLE1BQWEsRUFBRSxNQUFhO29CQUVuRCxZQUFZLENBQUMsS0FBSyxDQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRSxNQUFNLENBQUUsQ0FBQztnQkFDcEQsQ0FBQztnQkFFRCxZQUFZLENBQUMsYUFBYSxDQUFFLGFBQWEsRUFBRSxpQkFBaUIsQ0FBQyxJQUFJLENBQUUsU0FBUyxFQUFFLFlBQVksQ0FBRSxDQUFFLENBQUM7Z0JBQy9GLFlBQVksQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLGNBQVksWUFBWSxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFFLENBQUM7Z0JBQzFGLFlBQVksQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLGdCQUFnQixDQUFDLElBQUksQ0FBRSxTQUFTLEVBQUUsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUUsQ0FBRSxDQUFDO2FBRW5IO1NBQ0o7SUFDTCxDQUFDO0lBRUQsU0FBUyxnQkFBZ0IsQ0FBRSxhQUFxQjtRQUU1QyxJQUFJLFVBQVUsR0FBVSxZQUFZLENBQUMsYUFBYSxDQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLENBQUUsQ0FBQztRQUVuRixJQUFJLGdCQUFnQixHQUFHLGFBQWEsQ0FBQyxxQkFBcUIsQ0FBRSxnQkFBZ0IsQ0FBRSxDQUFDO1FBQy9FLElBQUksaUJBQWlCLEdBQUcsYUFBYSxDQUFDLHFCQUFxQixDQUFFLFlBQVksQ0FBRSxDQUFDO1FBQzVFLElBQUksYUFBYSxHQUFHLGFBQWEsQ0FBQyxxQkFBcUIsQ0FBRSxhQUFhLENBQUUsQ0FBQztRQUN6RSxJQUFJLGdCQUFnQixHQUFHLGFBQWEsQ0FBQyxxQkFBcUIsQ0FBRSxnQkFBZ0IsQ0FBRSxDQUFDO1FBQ3JGLElBQUksdUJBQXVCLEdBQUcsYUFBYSxDQUFDLHFCQUFxQixDQUFFLHdCQUF3QixDQUFFLENBQUM7UUFDOUYsSUFBSSxzQkFBc0IsR0FBRyxhQUFhLENBQUMscUJBQXFCLENBQUUsdUJBQXVCLENBQUUsQ0FBQztRQUN0RixJQUFJLGNBQWMsR0FBRyxhQUFhLENBQUMscUJBQXFCLENBQUUsY0FBYyxDQUFFLENBQUM7UUFDM0UsSUFBSSxtQkFBbUIsR0FBRyxhQUFhLENBQUMscUJBQXFCLENBQUUsbUJBQW1CLENBQUUsQ0FBQztRQUNyRixJQUFJLHNCQUFzQixHQUFHLGFBQWEsQ0FBQyxxQkFBcUIsQ0FBRSxvQkFBb0IsQ0FBRSxDQUFDO1FBRXpGLFNBQVMsV0FBVyxDQUFFLFFBQWlCLEVBQUUsS0FBYTtZQUVsRCxJQUFLLFFBQVEsRUFDYjtnQkFDSSxJQUFLLEtBQUssRUFDVjtvQkFDSSxRQUFRLENBQUMsV0FBVyxDQUFFLE1BQU0sQ0FBRSxDQUFDO2lCQUNsQztxQkFFRDtvQkFDSSxRQUFRLENBQUMsUUFBUSxDQUFFLE1BQU0sQ0FBRSxDQUFDO2lCQUMvQjthQUNKO1FBQ0wsQ0FBQztRQUVELFNBQVMsYUFBYSxDQUFFLFFBQWlCLEVBQUUsS0FBYTtZQUVwRCxJQUFLLFFBQVEsRUFDYjtnQkFDSSxJQUFLLEtBQUssRUFDVjtvQkFDSSxRQUFRLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztpQkFDM0I7cUJBRUQ7b0JBQ0ksUUFBUSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7aUJBQzVCO2FBQ0o7UUFDTCxDQUFDO1FBRUQsSUFBSSxRQUFRLEdBQUcsWUFBWSxDQUFDLFFBQVEsQ0FBRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFFLENBQUM7UUFDM0UsYUFBYSxDQUFFLGFBQWEsRUFBRSxRQUFRLENBQUUsQ0FBQztRQUluQyxJQUFLLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxtQkFBbUIsSUFBSSxNQUFNLEVBQ3ZEO1lBQ0wsV0FBVyxDQUFFLGFBQWEsRUFBRSxRQUFRLENBQUUsQ0FBQztZQUN2QyxXQUFXLENBQUUsdUJBQXVCLEVBQUUsUUFBUSxDQUFFLENBQUM7WUFDakQsV0FBVyxDQUFFLHNCQUFzQixFQUFFLFFBQVEsQ0FBRSxDQUFDO1lBQ3ZDLFdBQVcsQ0FBRSxnQkFBZ0IsRUFBRSxDQUFDLFFBQVEsQ0FBRSxDQUFDO1lBQzNDLFdBQVcsQ0FBRSxnQkFBZ0IsRUFBRSxDQUFFLFVBQVUsS0FBSyxNQUFNLENBQUUsSUFBSSxVQUFVLENBQUUsYUFBYSxDQUFFLENBQUMsQ0FBQztZQUV6RixJQUFJLG9CQUFvQixHQUFHLDhCQUE4QixDQUFDO1lBQzFELGdCQUFnQixDQUFDLGFBQWEsQ0FBRSxhQUFhLEVBQUUsY0FBWSxZQUFZLENBQUMsc0JBQXNCLENBQUUsZ0JBQWdCLEVBQUUsb0JBQW9CLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDO1lBQzlJLGdCQUFnQixDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsY0FBYSxZQUFZLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQztZQUV4RyxJQUFLLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxtQkFBbUIsSUFBSSxZQUFZLEVBQ3BEO2dCQUNSLElBQUksb0JBQW9CLEdBQUcsMEJBQTBCLENBQUM7Z0JBRTFDLElBQUssVUFBVSxLQUFLLFlBQVksRUFDaEM7b0JBQ0ksYUFBYSxDQUFFLGdCQUFnQixFQUFFLEtBQUssQ0FBRSxDQUFDO29CQUN6QyxXQUFXLENBQUUsbUJBQW1CLEVBQUUsS0FBSyxDQUFFLENBQUM7b0JBQ3pELFdBQVcsQ0FBRSxzQkFBc0IsRUFBRSxLQUFLLENBQUUsQ0FBQztpQkFDakM7cUJBQ0ksSUFBSyxVQUFVLEtBQUssYUFBYSxFQUN0QztvQkFDSSxhQUFhLENBQUUsZ0JBQWdCLEVBQUUsS0FBSyxDQUFFLENBQUM7b0JBQ3pDLFdBQVcsQ0FBRSxtQkFBbUIsRUFBRSxJQUFJLENBQUUsQ0FBQztvQkFDeEQsV0FBVyxDQUFFLHNCQUFzQixFQUFFLEtBQUssQ0FBRSxDQUFDO29CQUM3QyxXQUFXLENBQUUsdUJBQXVCLEVBQUUsS0FBSyxDQUFFLENBQUM7b0JBQzlDLFdBQVcsQ0FBRSxzQkFBc0IsRUFBRSxLQUFLLENBQUUsQ0FBQztvQkFDN0MsV0FBVyxDQUFFLGFBQWEsRUFBRSxLQUFLLENBQUUsQ0FBQztpQkFDeEI7cUJBQ0ksSUFBSyxZQUFZLENBQUMsV0FBVyxDQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLENBQUUsRUFDbEU7b0JBQ0ksYUFBYSxDQUFFLGdCQUFnQixFQUFFLElBQUksQ0FBRSxDQUFDO29CQUN4QyxXQUFXLENBQUUsbUJBQW1CLEVBQUUsS0FBSyxDQUFFLENBQUM7b0JBQzFDLFdBQVcsQ0FBRSxzQkFBc0IsRUFBRSxLQUFLLENBQUUsQ0FBQztpQkFDaEQ7cUJBRUQ7b0JBQ1gsb0JBQW9CLEdBQUcsbUNBQW1DLENBQUM7b0JBQzVDLGFBQWEsQ0FBRSxnQkFBZ0IsRUFBRSxLQUFLLENBQUUsQ0FBQztvQkFDekMsV0FBVyxDQUFFLG1CQUFtQixFQUFFLEtBQUssQ0FBRSxDQUFDO29CQUMxQyxXQUFXLENBQUUsc0JBQXNCLEVBQUUsS0FBSyxDQUFFLENBQUM7aUJBQzVEO2dCQUVXLGFBQWEsQ0FBRSxpQkFBaUIsRUFBRSxDQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxlQUFlLElBQUksRUFBRSxDQUFFLElBQUksQ0FBRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsZUFBZSxJQUFJLFNBQVMsQ0FBRSxDQUFFLENBQUM7Z0JBR3hKLGdCQUFnQixDQUFDLGFBQWEsQ0FBRSxhQUFhLEVBQUUsY0FBWSxZQUFZLENBQUMsc0JBQXNCLENBQUUsZ0JBQWdCLEVBQUUsb0JBQW9CLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDO2dCQUNsSSxnQkFBZ0IsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLGNBQWEsWUFBWSxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFFLENBQUM7YUFDbEc7aUJBRUQ7Z0JBQ0ksV0FBVyxDQUFFLGdCQUFnQixFQUFFLEtBQUssQ0FBRSxDQUFDO2dCQUN2QyxXQUFXLENBQUUsbUJBQW1CLEVBQUUsS0FBSyxDQUFFLENBQUM7Z0JBQzFDLFdBQVcsQ0FBRSxzQkFBc0IsRUFBRSxLQUFLLENBQUUsQ0FBQzthQUNoRDtZQUVWLElBQUksd0JBQXdCLEdBQUcsQ0FBRSxDQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxlQUFlLENBQUUsSUFBSSxDQUFFLFlBQVksQ0FBQyxrQkFBa0IsQ0FBRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFFLENBQUUsQ0FBRSxDQUFDO1lBQzNNLGFBQWEsQ0FBRSx1QkFBdUIsRUFBRSx3QkFBd0IsQ0FBRSxDQUFDO1lBQ25FLGFBQWEsQ0FBRSxzQkFBc0IsRUFBRSx3QkFBd0IsQ0FBRSxDQUFDO1lBRXpELElBQUksU0FBUyxHQUFHLFlBQVksQ0FBQyxTQUFTLENBQUUsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBRSxDQUFDO1lBQ3ZFLGFBQWEsQ0FBRSxjQUFjLEVBQUUsU0FBUyxDQUFFLENBQUM7WUFFM0MsSUFBSyxDQUFDLFFBQVEsSUFBSSxTQUFTLEVBQzNCO2dCQUNJLFdBQVcsQ0FBRSxzQkFBc0IsRUFBRSxJQUFJLENBQUUsQ0FBQzthQUMvQztTQUNKO2FBRUQ7WUFDSSxXQUFXLENBQUUsZ0JBQWdCLEVBQUUsS0FBSyxDQUFFLENBQUM7WUFDdkMsV0FBVyxDQUFFLG1CQUFtQixFQUFFLEtBQUssQ0FBRSxDQUFDO1lBQzFDLFdBQVcsQ0FBRSxzQkFBc0IsRUFBRSxLQUFLLENBQUUsQ0FBQztZQUN0RCxXQUFXLENBQUUsdUJBQXVCLEVBQUUsS0FBSyxDQUFFLENBQUM7WUFDOUMsV0FBVyxDQUFFLHNCQUFzQixFQUFFLEtBQUssQ0FBRSxDQUFDO1lBQ3BDLFdBQVcsQ0FBRSxpQkFBaUIsRUFBRSxLQUFLLENBQUUsQ0FBQztZQUN4QyxXQUFXLENBQUUsY0FBYyxFQUFFLEtBQUssQ0FBRSxDQUFDO1lBQ3JDLFdBQVcsQ0FBRSxnQkFBZ0IsRUFBRSxLQUFLLENBQUUsQ0FBQztTQUMxQztRQUVELHlCQUF5QixDQUFFLGFBQWEsQ0FBRSxDQUFDO0lBQy9DLENBQUM7SUFFRCxTQUFnQixPQUFPLENBQUUsYUFBcUI7UUFFMUMsU0FBUyxpQkFBaUIsQ0FBRSxrQkFBMEI7WUFFbEQsaUJBQWlCLENBQUUsS0FBSyxFQUFFLGtCQUFrQixDQUFFLENBQUM7WUFDL0MsZ0JBQWdCLENBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBRSx5QkFBeUIsQ0FBQyxFQUFFLElBQUksRUFBRSxrQkFBa0IsQ0FBRSxDQUFDO1lBQ3JGLElBQUssa0JBQWtCLENBQUMsSUFBSSxFQUFFLENBQUMsc0JBQXNCLEVBQ3JEO2dCQUNJLENBQUMsQ0FBQywyQkFBMkIsQ0FBRSx5Q0FBeUMsRUFBRSxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxzQkFBc0IsQ0FBRSxDQUFDO2FBQ2hJO1lBQ0QsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLHFCQUFxQixHQUFHLFNBQVMsQ0FBQztRQUMzRCxDQUFDO1FBRUQsSUFBSywyQkFBMkIsQ0FBRSxhQUFhLENBQUUsRUFDakQ7WUFDSSxrQkFBa0IsQ0FBRSxhQUFhLENBQUUsQ0FBQztTQUN2QzthQUNJLElBQUssWUFBWSxDQUFDLDBCQUEwQixDQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLENBQUUsRUFDakY7WUFDSSxxQ0FBcUMsQ0FBRSxhQUFhLENBQUUsQ0FBQztTQUMxRDthQUNJLElBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMscUJBQXFCLEVBQ3JEO1lBQ0ksWUFBWSxDQUFDLHNCQUFzQixDQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLENBQUUsQ0FBQztZQUNwRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMscUJBQXFCLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBRyxHQUFHLEVBQUUsaUJBQWlCLENBQUMsSUFBSSxDQUFFLFNBQVMsRUFBRSxhQUFhLENBQUUsQ0FBRSxDQUFDO1lBQ3BILGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxzQkFBc0IsR0FBRyxDQUFDLENBQUMseUJBQXlCLENBQUUseUNBQXlDLEVBQUUsa0JBQWtCLENBQUMsSUFBSSxDQUFFLFNBQVMsRUFBRSxhQUFhLENBQUUsQ0FBRSxDQUFDO1NBQy9LO0lBRUwsQ0FBQztJQTVCZSxpQkFBTyxVQTRCdEIsQ0FBQTtJQUVELFNBQVMsa0JBQWtCLENBQUUsYUFBcUI7UUFFOUMsSUFBSyxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMscUJBQXFCLEVBQy9DO1lBQ0ksQ0FBQyxDQUFDLGVBQWUsQ0FBRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMscUJBQXFCLENBQUUsQ0FBQTtZQUMvRCxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMscUJBQXFCLEdBQUcsU0FBUyxDQUFDO1NBQzFEO1FBQ0QsZUFBZSxDQUFFLGFBQWEsQ0FBRSxDQUFDO1FBQ2pDLGdCQUFnQixDQUFFLGFBQWEsQ0FBRSxDQUFDO1FBQ2xDLElBQUssYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLG1CQUFtQixJQUFJLE1BQU0sRUFDdkQ7WUFDSSxlQUFlLENBQUUsYUFBYSxFQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxlQUFlLENBQUUsQ0FBQztTQUMxRTtRQUNELEtBQUssQ0FBRSxhQUFhLENBQUUsQ0FBQztJQUMzQixDQUFDO0lBRUQsU0FBUyxxQ0FBcUMsQ0FBRSxhQUFxQjtRQUVqRSw0QkFBNEIsQ0FBRSxhQUFhLENBQUUsQ0FBQztRQUM5QyxnQkFBZ0IsQ0FBRSxhQUFhLENBQUUsQ0FBQztRQUNsQyxLQUFLLENBQUUsYUFBYSxDQUFFLENBQUM7SUFDM0IsQ0FBQztJQUVELFNBQVMsV0FBVyxDQUFFLGFBQXFCLEVBQUUsWUFBb0I7UUFFN0QsSUFBSyxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsWUFBWSxFQUN0QztZQUNJLFlBQVksQ0FBQyxJQUFJLEdBQUcsWUFBWSxDQUFDLGtCQUFrQixDQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUUsQ0FBQztTQUMvSDthQUVEO1lBQ0ksWUFBWSxDQUFDLElBQUksR0FBRyxjQUFjLENBQUMsYUFBYSxDQUFFLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUUsQ0FBQztTQUN0RjtJQUNMLENBQUM7SUFFRCxTQUFTLFlBQVksQ0FBRSxhQUFxQixFQUFFLFVBQWlCO1FBRTNELElBQUssYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLFlBQVksRUFDdEM7WUFDSSxhQUFhLENBQUMsaUJBQWlCLENBQUUsaUJBQWlCLEVBQUUsWUFBWSxDQUFDLGtCQUFrQixDQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sQ0FBRSxDQUFFLENBQUM7U0FDN0k7YUFFRDtZQUNJLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBRSxpQkFBaUIsRUFBRSxjQUFjLENBQUMsYUFBYSxDQUFFLFVBQVUsQ0FBRSxDQUFFLENBQUM7U0FDcEc7UUFFUCxJQUFJLHVCQUF1QixHQUFHLGFBQWEsQ0FBQyxxQkFBcUIsQ0FBRSx3QkFBd0IsQ0FBRSxDQUFDO1FBQzlGLElBQUksc0JBQXNCLEdBQUcsYUFBYSxDQUFDLHFCQUFxQixDQUFFLHVCQUF1QixDQUFFLENBQUM7UUFDdEYsSUFBSyx1QkFBdUIsRUFDNUI7WUFDTCx1QkFBdUIsQ0FBQyxhQUFhLENBQUUsYUFBYSxFQUFFLGNBQVksWUFBWSxDQUFDLHNCQUFzQixDQUFFLHVCQUF1QixFQUFFLFlBQVksQ0FBQyxjQUFjLENBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBRSw2Q0FBNkMsRUFBRSxhQUFhLENBQUMsQ0FBRSxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQztZQUNoUCxzQkFBc0IsQ0FBQyxhQUFhLENBQUUsYUFBYSxFQUFFLGNBQVksWUFBWSxDQUFDLHNCQUFzQixDQUFFLHNCQUFzQixFQUFFLFlBQVksQ0FBQyxjQUFjLENBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBRSw0Q0FBNEMsRUFBRSxhQUFhLENBQUMsQ0FBRSxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQztTQUN2TztJQUNMLENBQUM7SUFFRCxTQUFTLEtBQUssQ0FBRSxhQUFxQjtRQUVqQyxhQUFhLENBQUMsa0JBQWtCLENBQUUsSUFBSSxDQUFFLENBQUM7UUFDekMsYUFBYSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDN0IsYUFBYSxDQUFDLFdBQVcsQ0FBRSxlQUFlLENBQUUsQ0FBQztRQUU3QyxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsc0JBQXNCLEdBQUcsQ0FBQyxDQUFDLHlCQUF5QixDQUFFLHlDQUF5QyxFQUFFLGdCQUFnQixDQUFDLElBQUksQ0FBRSxTQUFTLEVBQUUsYUFBYSxDQUFDLENBQUUsQ0FBQztJQUU3SyxDQUFDO0lBRUQsU0FBUyxhQUFhLENBQUUsYUFBcUI7UUFFekMsSUFBSSxhQUFhLENBQUMsT0FBTyxLQUFLLElBQUksSUFBSSxhQUFhLENBQUMsY0FBYyxFQUFFLEVBQ3BFO1lBRUksYUFBYSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7WUFDOUIsYUFBYSxDQUFDLGtCQUFrQixDQUFFLEtBQUssQ0FBRSxDQUFDO1NBQzdDO0lBQ0wsQ0FBQztJQUVELFNBQWdCLElBQUksQ0FBRSxhQUFxQjtRQUV2QyxLQUFNLElBQUksTUFBTSxJQUFJLEtBQUssRUFDekI7WUFDSSxJQUFJLE1BQU0sR0FBRyxhQUFhLENBQUMscUJBQXFCLENBQUUsZ0JBQWdCLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFFLENBQUM7WUFDckYsS0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFDbEM7Z0JBQ0ksSUFBSSxZQUFZLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBRSxDQUFDLENBQUUsQ0FBQyxpQkFBaUIsQ0FBRSxhQUFhLENBQUUsQ0FBQztnQkFFM0UsSUFBSyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUMsaUJBQWlCLEVBQzFDO29CQUNJLENBQUMsQ0FBQywyQkFBMkIsQ0FBRSwyQ0FBMkMsRUFBRSxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUMsaUJBQWlCLENBQUUsQ0FBQztvQkFDcEgsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDLGlCQUFpQixHQUFHLFNBQVMsQ0FBQztpQkFDckQ7YUFDSjtTQUNKO1FBQ0QsSUFBSyxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMscUJBQXFCLEVBQy9DO1lBQ0ksQ0FBQyxDQUFDLGVBQWUsQ0FBRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMscUJBQXFCLENBQUUsQ0FBQztZQUNoRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMscUJBQXFCLEdBQUcsU0FBUyxDQUFDO1NBQzFEO1FBRUQsSUFBSyxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsc0JBQXNCLEVBQ2hEO1lBQ0ksQ0FBQyxDQUFDLDJCQUEyQixDQUFFLHlDQUF5QyxFQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxzQkFBc0IsQ0FBRSxDQUFDO1lBQ3hILGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxzQkFBc0IsR0FBRyxTQUFTLENBQUM7U0FDM0Q7UUFFRCxJQUFJLE9BQU8sR0FBRyxhQUFhLENBQUMscUJBQXFCLENBQUUsMEJBQTBCLENBQUUsQ0FBQztRQUNoRixJQUFLLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxpQkFBaUIsRUFDckM7WUFDSSxDQUFDLENBQUMsMkJBQTJCLENBQUUsMkNBQTJDLEVBQUUsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLGlCQUFpQixDQUFFLENBQUM7WUFDL0csT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLGlCQUFpQixHQUFHLFNBQVMsQ0FBQztTQUNoRDtRQUVELGFBQWEsQ0FBQyxRQUFRLENBQUUsZUFBZSxDQUFFLENBQUM7SUFDOUMsQ0FBQztJQXBDZSxjQUFJLE9Bb0NuQixDQUFBO0lBRUQsU0FBUyxlQUFlLENBQUUsYUFBcUIsRUFBRSxXQUFtQjtRQUVoRSxJQUFJLG1CQUFtQixHQUFHO1lBQ3RCLHFDQUFxQztZQUNyQyxvQkFBb0I7WUFDcEIsb0JBQW9CO1lBQ3BCLG9CQUFvQjtZQUNwQixvQkFBb0I7WUFDcEIsc0JBQXNCO1NBQ3pCLENBQUE7UUFFRCxTQUFTLE9BQU8sQ0FBRSxDQUFRO1lBRXRCLElBQUssQ0FBQyxJQUFJLENBQUM7Z0JBQUcsT0FBTyxDQUFDLENBQUM7WUFDdkIsT0FBTyxDQUFDLENBQUM7UUFDYixDQUFDO1FBRUQsSUFBSSxPQUFPLEdBQUcsYUFBYSxDQUFDLHFCQUFxQixDQUFFLDBCQUEwQixDQUFFLENBQUM7UUFDaEYsSUFBSyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsaUJBQWlCLElBQUksU0FBUyxFQUNsRDtZQUNJLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxpQkFBaUIsR0FBRyxDQUFDLENBQUMseUJBQXlCLENBQUUsMkNBQTJDLEVBQUUsWUFBWSxDQUFDLElBQUksQ0FBRSxTQUFTLEVBQUUsYUFBYSxFQUFFLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUUsQ0FBRSxDQUFDO1NBQy9MO1FBQ0QsWUFBWSxDQUFFLGFBQWEsRUFBRSxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFFLENBQUM7UUFFN0QsSUFBSSxhQUFhLEdBQUcsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQztRQUU5QyxJQUFLLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxlQUFlLEVBQ3pDO1lBQ0ksYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLGVBQWUsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1lBQ3JELGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFFLFVBQVUsQ0FBRSxDQUFDO1NBQ2xFO1FBQ0QsV0FBVyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDM0IsV0FBVyxDQUFDLFFBQVEsQ0FBRSxVQUFVLENBQUUsQ0FBQztRQUNuQyxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsZUFBZSxHQUFHLFdBQVcsQ0FBQztRQUVuRCxJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUN4RSxJQUFJLE1BQU0sSUFBSSxLQUFLLEVBQ25CO1lBQ0ksYUFBYSxDQUFDLHFCQUFxQixDQUFDLG9CQUFvQixDQUFDLENBQUMsV0FBVyxDQUFDLDJCQUEyQixDQUFDLENBQUM7U0FDdEc7UUFFRCxJQUFJLGdCQUFnQixHQUFHLGFBQWEsQ0FBQyxxQkFBcUIsQ0FBRSw4QkFBOEIsQ0FBRSxDQUFDO1FBQzdGLElBQUksWUFBWSxHQUFHLGFBQWEsQ0FBQyxxQkFBcUIsQ0FBRSxnQ0FBZ0MsQ0FBRSxDQUFDO1FBRTNGLElBQUksVUFBVSxHQUFHLFlBQVksQ0FBQyx5QkFBeUIsQ0FBRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBRSxDQUFDO1FBQzNGLElBQUssVUFBVSxLQUFLLFNBQVM7WUFDekIsVUFBVSxHQUFHLENBQUMsQ0FBQztRQUVuQixJQUFJLFVBQVUsR0FBRyxZQUFZLENBQUMseUJBQXlCLENBQUUsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUUsQ0FBQztRQUMzRixJQUFLLFVBQVUsS0FBSyxTQUFTO1lBQ3pCLFVBQVUsR0FBRyxDQUFDLENBQUM7UUFFbkIsSUFBSSxZQUFZLEdBQUcsVUFBVSxHQUFHLFVBQVUsQ0FBQztRQUMzQyxJQUFJLFNBQVMsR0FBRyxZQUFZLENBQUMsaUJBQWlCLENBQUUsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBRSxDQUFDO1FBQy9FLElBQUksV0FBVyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUUsWUFBWSxFQUFFLFNBQVMsQ0FBRSxDQUFDO1FBRXRELElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUUsQ0FBRSxXQUFXLEdBQUcsU0FBUyxDQUFFLEdBQUcsQ0FBQyxDQUFFLENBQUM7UUFDN0QsSUFBSyxTQUFTLEdBQUcsQ0FBQyxFQUNsQjtZQUNJLFdBQVcsR0FBRyxTQUFTLEdBQUcsQ0FBQyxHQUFHLFNBQVMsQ0FBQztTQUMzQztRQUNELElBQUksU0FBUyxHQUFHLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxDQUFDLE1BQU0sQ0FBQztRQUVuRCxnQkFBZ0IsQ0FBQyxXQUFXLENBQUUsbUJBQW1CLEVBQUUsU0FBUyxJQUFJLENBQUMsQ0FBRSxDQUFDO1FBSzFFLElBQUksYUFBYSxHQUFVLFlBQVksQ0FBQyx3QkFBd0IsQ0FBRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLENBQUMsVUFBVSxFQUFFLFlBQVksQ0FBRSxDQUFDO1FBQ3ZLLElBQUksU0FBUyxHQUFHLGFBQWEsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBRSxHQUFHLENBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFFLFdBQVcsQ0FBRSxDQUFDLElBQUksQ0FBRSxDQUFDLENBQUUsQ0FBQztRQUU1RixJQUFJLFFBQVEsR0FBVSxZQUFZLENBQUMsd0JBQXdCLENBQUUsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUUsQ0FBQztRQUM1SixJQUFJLElBQUksR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUUsR0FBRyxDQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBRSxXQUFXLENBQUUsQ0FBQyxJQUFJLENBQUUsQ0FBQyxDQUFFLENBQUM7UUFFN0UsSUFBSSxTQUFTLEdBQVUsWUFBWSxDQUFDLHdCQUF3QixDQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxVQUFVLEVBQUUsYUFBYSxDQUFFLENBQUM7UUFDcEssSUFBSSxLQUFLLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFFLEdBQUcsQ0FBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUUsV0FBVyxDQUFFLENBQUMsSUFBSSxDQUFFLENBQUMsQ0FBRSxDQUFDO1FBRWhGLElBQUksYUFBYSxHQUFVLFlBQVksQ0FBQyx3QkFBd0IsQ0FBRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLENBQUMsVUFBVSxFQUFFLGlCQUFpQixDQUFFLENBQUM7UUFDNUssSUFBSSxTQUFTLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFFLEdBQUcsQ0FBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUUsV0FBVyxDQUFFLENBQUMsSUFBSSxDQUFFLENBQUMsQ0FBRSxDQUFDO1FBRTVGLElBQUksVUFBVSxHQUFVLFlBQVksQ0FBQyx3QkFBd0IsQ0FBRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBRSxDQUFDO1FBQ2hLLElBQUksTUFBTSxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBRSxHQUFHLENBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFFLFdBQVcsQ0FBRSxDQUFDLElBQUksQ0FBRSxDQUFDLENBQUUsQ0FBQztRQUc3RSxTQUFTLFlBQVksQ0FBRyxDQUFRO1lBRzVCLElBQUssQ0FBQyxJQUFJLENBQUM7Z0JBQ1AsT0FBTyxJQUFJLENBQUM7WUFHaEIsSUFBSyxDQUFDLElBQUksU0FBUztnQkFDZixPQUFPLElBQUksQ0FBQztZQUdoQixJQUFLLENBQUMsSUFBSSxXQUFXO2dCQUNqQixPQUFPLElBQUksQ0FBQztZQUdoQixJQUFLLENBQUMsR0FBRyxTQUFTLElBQUksQ0FBRSxDQUFFLENBQUMsR0FBRyxTQUFTLENBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFFO2dCQUNoRCxPQUFPLElBQUksQ0FBQztZQUVoQixPQUFPLEtBQUssQ0FBQztRQUNqQixDQUFDO1FBRUQsU0FBUyxZQUFZLENBQUcsQ0FBUTtZQUU1QixJQUFLLENBQUMsR0FBRyxTQUFTLEVBQ2xCO2dCQUNJLElBQUssU0FBUyxHQUFHLENBQUMsSUFBSSxDQUFDO29CQUNuQixPQUFPLENBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUUsQ0FBQztxQkFDckIsSUFBSyxTQUFTLEdBQUcsQ0FBQyxJQUFJLENBQUM7b0JBQ3hCLE9BQU8sQ0FBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBRSxDQUFDO3FCQUNyQixJQUFLLFNBQVMsSUFBSSxFQUFFLElBQUksU0FBUyxHQUFHLENBQUMsSUFBSSxDQUFDO29CQUMzQyxPQUFPLENBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUUsQ0FBQztxQkFDckIsSUFBSyxTQUFTLElBQUksQ0FBQyxJQUFJLFNBQVMsR0FBRyxDQUFDLElBQUksQ0FBQztvQkFDMUMsT0FBTyxDQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFFLENBQUM7YUFDN0I7aUJBRUQ7YUFFQztZQUVELE9BQU8sS0FBSyxDQUFDO1FBQ2pCLENBQUM7UUFFRCxTQUFTLGtCQUFrQixDQUFHLENBQVE7WUFFbEMsSUFBSyxDQUFDLElBQUksQ0FBRSxTQUFTLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBRTtnQkFDM0IsT0FBTyxJQUFJLENBQUM7UUFDcEIsQ0FBQztRQUVELFNBQVMsaUJBQWlCLENBQUcsQ0FBUTtZQUVqQyxJQUFLLENBQUMsSUFBSSxDQUFFLFNBQVMsR0FBRyxDQUFDLENBQUU7Z0JBQ3ZCLE9BQU8sSUFBSSxDQUFDO1FBQ3BCLENBQUM7UUFFRCxTQUFTLHFCQUFxQixDQUFHLENBQVE7WUFFckMsSUFBSyxrQkFBa0IsQ0FBRSxDQUFDLENBQUU7Z0JBQ3hCLE9BQU8scUNBQXFDLENBQUM7aUJBQzVDLElBQUssaUJBQWlCLENBQUUsQ0FBQyxDQUFFO2dCQUM1QixPQUFPLG9DQUFvQyxDQUFDO2lCQUMzQyxJQUFLLFlBQVksQ0FBRSxDQUFDLENBQUU7Z0JBQ3ZCLE9BQU8sc0JBQXNCLENBQUM7aUJBQzdCLElBQUssWUFBWSxDQUFFLENBQUMsQ0FBRTtnQkFDdkIsT0FBTyxzQkFBc0IsQ0FBQzs7Z0JBRTlCLE9BQU8sb0JBQW9CLENBQUM7UUFDcEMsQ0FBQztRQUVELFNBQVMsV0FBVyxDQUFHLENBQVE7WUFFM0IsT0FBTyxDQUFFLENBQUMsR0FBRyxTQUFTLENBQUUsQ0FBQztRQUM3QixDQUFDO1FBRUQsU0FBUyxjQUFjLENBQUcsQ0FBUTtZQUU5QixJQUFLLENBQUMsSUFBSSxTQUFTO2dCQUNmLE9BQU8sRUFBRSxDQUFDO1lBRWQsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBRSxDQUFDLEdBQUcsU0FBUyxDQUFFLEdBQUcsQ0FBQyxDQUFDO1lBRXhDLElBQUssU0FBUyxHQUFHLENBQUMsRUFDbEI7Z0JBQ0ksT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFFLHFCQUFxQixDQUFFLEdBQUcsR0FBRyxHQUFHLENBQUUsRUFBRSxDQUFFLENBQUM7YUFDN0Q7aUJBRUQ7Z0JBQ0ksT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFFLHFCQUFxQixDQUFFLENBQUM7YUFDOUM7UUFDTCxDQUFDO1FBRUQsU0FBUyxnQkFBZ0IsQ0FBRyxDQUFRO1lBRWhDLElBQUssa0JBQWtCLENBQUUsQ0FBQyxDQUFFO2dCQUN4QixPQUFPLElBQUksQ0FBQztpQkFDWCxJQUFLLGtCQUFrQixDQUFFLENBQUMsQ0FBRSxJQUFJLGlCQUFpQixDQUFFLENBQUMsQ0FBRTtnQkFDdkQsT0FBTyxFQUFFLENBQUM7aUJBQ1QsSUFBSyxZQUFZLENBQUUsQ0FBQyxDQUFFLElBQUksWUFBWSxDQUFFLENBQUMsQ0FBRTtnQkFDNUMsT0FBTyxDQUFDLENBQUM7O2dCQUVULE9BQU8sRUFBRSxDQUFDO1FBQ2xCLENBQUM7UUFJRCxJQUFJLDJCQUEyQixHQUFHLENBQUMsQ0FBQztRQUNwQywyQkFBMkIsSUFBSSxDQUFFLENBQUUsV0FBVyxHQUFHLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFFLENBQUM7UUFDN0UsSUFBSyxXQUFXLEdBQUcsU0FBUyxFQUM1QjtZQUNJLElBQUksNkJBQTZCLEdBQUcsQ0FBRSxXQUFXLEdBQUcsU0FBUyxDQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ3BFLElBQUksc0JBQXNCLEdBQUcsQ0FBRSxXQUFXLEdBQUcsU0FBUyxHQUFHLDZCQUE2QixDQUFFLEdBQUcsQ0FBQyxDQUFDO1lBRTdGLDJCQUEyQixJQUFJLHNCQUFzQixHQUFHLENBQUUsQ0FBRSw2QkFBNkIsR0FBRyxDQUFDLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQztTQUM3RztRQUVELElBQUssMkJBQTJCLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFDekM7WUFDSSxhQUFhLEdBQUcsT0FBTyxDQUFFLGFBQWEsQ0FBRSxDQUFDO1NBQzVDO1FBR0QsS0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLFdBQVcsRUFBRSxDQUFDLEVBQUUsRUFDdEM7WUFDSSxJQUFJLFlBQVksR0FBRyxTQUFTLENBQUM7WUFDN0IsSUFBSyxDQUFDLEdBQUcsU0FBUyxFQUNsQjtnQkFDSSxZQUFZLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxRQUFRLEVBQUUsZ0JBQWdCLEVBQUUsbUJBQW1CLEdBQUcsQ0FBQyxDQUFFLENBQUM7Z0JBQ3BGLFlBQVksQ0FBQyxrQkFBa0IsQ0FBRSw4QkFBOEIsQ0FBRSxDQUFDO2dCQUNsRSxZQUFZLENBQUMsUUFBUSxDQUFFLHdCQUF3QixDQUFFLENBQUM7YUFDckQ7aUJBRUQ7Z0JBQ0ksWUFBWSxHQUFHLGdCQUFnQixDQUFDLFFBQVEsQ0FBRSxDQUFDLEdBQUMsQ0FBQyxDQUFFLENBQUM7YUFDbkQ7WUFFRCxJQUFJLFVBQVUsR0FBRyxZQUFZLENBQUMsaUJBQWlCLENBQUUsb0NBQW9DLENBQUUsQ0FBQztZQUN4RixJQUFJLGVBQWUsR0FBRyxZQUFZLENBQUMsaUJBQWlCLENBQUUsd0JBQXdCLENBQUMsQ0FBQztZQUVoRixJQUFLLENBQUMsR0FBRyxTQUFTLEVBQ2xCO2dCQUNJLElBQUksTUFBTSxHQUFHLFVBQVUsQ0FBQyxRQUFRLENBQUUsQ0FBQyxDQUFFLENBQUMsUUFBUSxDQUFFLENBQUMsQ0FBRSxDQUFDO2dCQUNwRDtvQkFDSSxNQUFNLENBQUMsUUFBUSxDQUFFLHFCQUFxQixDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUM7aUJBQ2pEO2FBRUo7aUJBRUQ7Z0JBQ0ksVUFBVSxDQUFDLFdBQVcsQ0FBRSxNQUFNLENBQUUsQ0FBQzthQUNwQztZQUNELElBQUksUUFBUSxHQUFHLFVBQVUsQ0FBQyxRQUFRLENBQUUsQ0FBQyxDQUFFLENBQUMsUUFBUSxDQUFFLENBQUMsQ0FBRSxDQUFDO1lBQ3RELElBQUksZUFBZSxHQUFHLFVBQVUsQ0FBQyxRQUFRLENBQUUsQ0FBQyxDQUFFLENBQUM7WUFDL0MsSUFBSSxTQUFTLEdBQUcsVUFBVSxDQUFDLFFBQVEsQ0FBRSxDQUFDLENBQUUsQ0FBQyxRQUFRLENBQUUsQ0FBQyxDQUFFLENBQUM7WUFDdkQsSUFBSyxDQUFDLEdBQUcsWUFBWSxFQUNyQjtnQkFDSSxlQUFlLENBQUMsV0FBVyxDQUFFLGFBQWEsQ0FBRSxDQUFBO2dCQUM1QyxlQUFlLENBQUMsV0FBVyxDQUFFLG9CQUFvQixDQUFFLENBQUE7Z0JBQ25ELFFBQVEsQ0FBQyxRQUFRLENBQUUsNkJBQTZCLENBQUUsQ0FBQztnQkFDbkQsU0FBUyxDQUFDLFFBQVEsQ0FBRSw2QkFBNkIsQ0FBRSxDQUFDO2dCQUNwRCxlQUFlLENBQUMsUUFBUSxDQUFFLE1BQU0sQ0FBRSxDQUFDO2dCQUNuQyxZQUFZLENBQUMsUUFBUSxDQUFFLFVBQVUsQ0FBRSxDQUFDO2FBQ3ZDO2lCQUVEO2dCQUNJLHlCQUF5QixDQUFFLGFBQWEsQ0FBRSxDQUFBO2dCQUMxQyxlQUFlLENBQUMsV0FBVyxDQUFFLE1BQU0sQ0FBRSxDQUFDO2dCQUV0QyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUMsQ0FBQyxDQUFDO2dCQUVaLElBQUksWUFBWSxHQUFHLFlBQVksQ0FBQyxpQkFBaUIsQ0FBRSxhQUFhLENBQUUsQ0FBQztnQkFFbkUsSUFBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUNqQjtvQkFDSSxZQUFZLENBQUMsV0FBVyxDQUFFLE1BQU0sQ0FBRSxDQUFDO29CQUNuQyxZQUFZLENBQUMsV0FBVyxDQUFFLFdBQVcsR0FBRyxLQUFLLENBQUUsT0FBTyxDQUFFLGFBQWEsQ0FBRSxDQUFFLENBQUUsQ0FBQztvQkFDNUUsWUFBWSxDQUFDLFFBQVEsQ0FBRSxXQUFXLEdBQUcsS0FBSyxDQUFFLGFBQWEsQ0FBRSxDQUFFLENBQUM7aUJBQ2pFO3FCQUVEO29CQUNJLFlBQVksQ0FBQyxRQUFRLENBQUUsTUFBTSxDQUFFLENBQUM7aUJBQ25DO2dCQUdELElBQUksTUFBTSxHQUFHLFFBQVEsQ0FBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQztnQkFDbEMsSUFBSSxVQUFVLEdBQUcsUUFBUSxDQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDO2dCQUUxQyxJQUFJLHFCQUFxQixHQUFHLFlBQVksQ0FBQyxpQkFBaUIsQ0FBRSx3QkFBd0IsQ0FBRSxDQUFDO2dCQUN2RixLQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUMzQjtvQkFDSSxJQUFJLEtBQUssR0FBRyxxQkFBcUIsQ0FBQyxpQkFBaUIsQ0FBRSx5QkFBeUIsR0FBRyxDQUFDLENBQUUsQ0FBQztvQkFDckYsSUFBSSxLQUFLLEdBQUcscUJBQXFCLENBQUMsaUJBQWlCLENBQUUsbUNBQW1DLEdBQUcsQ0FBQyxDQUFFLENBQUM7b0JBQy9GLElBQUssQ0FBQyxJQUFJLENBQUUsTUFBTSxDQUFFLEVBQ3BCO3dCQUNJLEtBQUssQ0FBQyxRQUFRLENBQUUsTUFBTSxDQUFFLENBQUM7d0JBQ3pCLEtBQUssQ0FBQyxRQUFRLENBQUUsTUFBTSxDQUFFLENBQUM7cUJBQzVCO3lCQUNJLElBQUssQ0FBQyxJQUFJLFVBQVUsRUFDekI7d0JBQ0ksS0FBSyxDQUFDLFdBQVcsQ0FBRSxNQUFNLENBQUUsQ0FBQzt3QkFDNUIsS0FBSyxDQUFDLFFBQVEsQ0FBRSxNQUFNLENBQUUsQ0FBQztxQkFDNUI7eUJBRUQ7d0JBQ0ksS0FBSyxDQUFDLFFBQVEsQ0FBRSxNQUFNLENBQUUsQ0FBQzt3QkFDekIsS0FBSyxDQUFDLFdBQVcsQ0FBRSxNQUFNLENBQUUsQ0FBQztxQkFDL0I7aUJBQ0o7Z0JBR0QsSUFBSSxXQUFXLEdBQUcsZUFBZSxDQUFDLGlCQUFpQixDQUFFLHlCQUF5QixDQUFFLENBQUM7Z0JBQ2pGLElBQUssTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFDbkI7b0JBQ0ksV0FBVyxDQUFDLFdBQVcsQ0FBRSxNQUFNLENBQUUsQ0FBQztpQkFDckM7cUJBRUQ7b0JBQ0ksV0FBVyxDQUFDLFFBQVEsQ0FBRSxNQUFNLENBQUUsQ0FBQztpQkFDbEM7Z0JBRUQsSUFBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUN0QjtvQkFDSSxRQUFRLENBQUMsV0FBVyxDQUFFLDZCQUE2QixDQUFFLENBQUM7b0JBQ3RELFNBQVMsQ0FBQyxRQUFRLENBQUUsNkJBQTZCLENBQUUsQ0FBQztpQkFDdkQ7cUJBRUQ7b0JBQ0ksUUFBUSxDQUFDLFFBQVEsQ0FBRSw2QkFBNkIsQ0FBRSxDQUFDO29CQUNuRCxTQUFTLENBQUMsV0FBVyxDQUFFLDZCQUE2QixDQUFFLENBQUM7aUJBQzFEO2dCQUNELFFBQVEsQ0FBQyxXQUFXLENBQUUsV0FBVyxHQUFHLEtBQUssQ0FBRSxPQUFPLENBQUUsYUFBYSxDQUFFLENBQUUsQ0FBRSxDQUFDO2dCQUN4RSxRQUFRLENBQUMsUUFBUSxDQUFFLFdBQVcsR0FBRyxLQUFLLENBQUUsYUFBYSxDQUFFLENBQUUsQ0FBQztnQkFDMUQsZUFBZSxDQUFDLFdBQVcsQ0FBRSxXQUFXLEdBQUcsS0FBSyxDQUFFLE9BQU8sQ0FBRSxhQUFhLENBQUUsQ0FBRSxDQUFFLENBQUM7Z0JBQy9FLGVBQWUsQ0FBQyxRQUFRLENBQUUsV0FBVyxHQUFHLEtBQUssQ0FBRSxhQUFhLENBQUUsQ0FBRSxDQUFDO2dCQUNqRSxxQkFBcUIsQ0FBQyxXQUFXLENBQUUsV0FBVyxHQUFHLEtBQUssQ0FBRSxPQUFPLENBQUUsYUFBYSxDQUFFLENBQUUsQ0FBRSxDQUFDO2dCQUNyRixxQkFBcUIsQ0FBQyxRQUFRLENBQUUsV0FBVyxHQUFHLEtBQUssQ0FBRSxhQUFhLENBQUUsQ0FBRSxDQUFDO2FBQzFFO1lBQ0QsSUFBSyxDQUFFLENBQUMsSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFFLElBQUksQ0FBRSxDQUFFLENBQUMsR0FBRyxTQUFTLENBQUUsSUFBSSxDQUFFLENBQUUsQ0FBRSxDQUFDLEdBQUcsU0FBUyxDQUFFLEdBQUcsQ0FBQyxDQUFFLElBQUksQ0FBQyxDQUFFLENBQUUsRUFDMUY7Z0JBQ0ksYUFBYSxHQUFHLE9BQU8sQ0FBRSxhQUFhLENBQUUsQ0FBQzthQUM1QztTQUNKO1FBR0QsYUFBYSxDQUFDLHFCQUFxQixDQUFFLGdDQUFnQyxDQUFFLENBQUM7UUFDeEUsWUFBWSxDQUFDLHVCQUF1QixFQUFFLENBQUM7UUFFdkMsS0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLFdBQVcsRUFBRSxDQUFDLEVBQUUsRUFDdEM7WUFDSSxJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUUsU0FBUyxHQUFHLENBQUMsQ0FBRSxDQUFDO1lBQ25FLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBRSxjQUFjLENBQUUsQ0FBQztZQUU1QyxJQUFJLGVBQWUsR0FBRyxnQkFBZ0IsQ0FBRSxDQUFDLENBQUUsQ0FBQztZQUM1QyxNQUFNLENBQUMsaUJBQWlCLENBQUUsR0FBRyxFQUFFLGVBQWUsQ0FBQyxRQUFRLEVBQUUsQ0FBRSxDQUFDO1lBQzVELE1BQU0sQ0FBQyxXQUFXLENBQUUsOEJBQThCLEVBQUUsZUFBZSxLQUFLLElBQUksQ0FBRSxDQUFDO1NBQ2xGO0lBSVIsQ0FBQztJQUVELFNBQVMsZUFBZSxDQUFFLElBQVc7UUFFcEMsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxxQkFBcUIsRUFBRSw0QkFBNEIsRUFBRSxPQUFPLENBQUUsQ0FBQztRQUNoRixJQUFJLHVCQUF1QixHQUFHLFlBQVksQ0FBQyxpREFBaUQsQ0FDM0YsWUFBWSxHQUFHLElBQUksRUFDbkIsRUFBRSxFQUNGLHFFQUFxRSxFQUNyRSxPQUFPLEdBQUMsSUFBSSxFQUNaLGNBQVcsQ0FBQyxDQUNaLENBQUE7UUFFRCx1QkFBdUIsQ0FBQyxRQUFRLENBQUUscUJBQXFCLENBQUUsQ0FBQztJQUMzRCxDQUFDO0lBRUUsU0FBUyxlQUFlLENBQUUsYUFBcUI7UUFHM0MsSUFBSSxZQUFZLEdBQUcsYUFBYSxDQUFDLHFCQUFxQixDQUFFLFlBQVksQ0FBRSxDQUFDO1FBQ3ZFLFlBQVksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBQzVCLGlCQUFpQixDQUFFLEtBQUssRUFBRSxhQUFhLENBQUUsQ0FBQztRQUMxQyxnQkFBZ0IsQ0FBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLGFBQWEsQ0FBRSxDQUFDO1FBRzdDLElBQUkscUJBQXFCLEdBQUcsWUFBWSxDQUFDLHdCQUF3QixDQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFFLENBQUM7UUFDckcsSUFBSyxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxFQUNyQztZQUNJLElBQUsscUJBQXFCLElBQUksYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLG9CQUFvQixFQUN2RTtnQkFDSSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQzthQUM1QztTQUNKO1FBQ0QsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLG9CQUFvQixHQUFHLHFCQUFxQixDQUFDO1FBRWxFLFNBQVMsb0JBQW9CLENBQUUsTUFBYTtZQUV4QyxJQUFJLE1BQU0sR0FBRyxhQUFhLENBQUMscUJBQXFCLENBQUUsZ0JBQWdCLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFFLENBQUM7WUFDckYsSUFBSSxrQkFBa0IsR0FBRyxhQUFhLENBQUMscUJBQXFCLENBQUUsMkJBQTJCLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFhLENBQUM7WUFDdkgsSUFBSyxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsWUFBWSxFQUN0QztnQkFDUixJQUFJLEdBQUcsR0FBRyxZQUFZLENBQUMseUJBQXlCLENBQUUsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUUsQ0FBQztnQkFDekYsSUFBSyxDQUFDLEdBQUcsRUFDVDtvQkFDQyxHQUFHLEdBQUcsRUFBRSxDQUFDO2lCQUNUO2dCQUNXLGtCQUFrQixDQUFDLFFBQVEsQ0FBRSxvQ0FBb0MsR0FBRyxHQUFHLENBQUMsV0FBVyxFQUFFLEdBQUcsTUFBTSxDQUFFLENBQUM7Z0JBQ2pHLGtCQUFrQixDQUFDLFFBQVEsQ0FBRSwrQkFBK0IsQ0FBRSxDQUFDO2dCQUMvRCxhQUFhLENBQUMsaUJBQWlCLENBQUUsZ0JBQWdCLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLFlBQVksQ0FBQywwQkFBMEIsQ0FBRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBRSxDQUFFLENBQUM7YUFDeEo7aUJBRUQ7Z0JBQ0ksYUFBYSxDQUFDLGlCQUFpQixDQUFFLGdCQUFnQixHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFFLFlBQVksR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUUsQ0FBRSxDQUFDO2FBQ25IO1lBQ0QsYUFBYSxDQUFDLGlCQUFpQixDQUFFLFFBQVEsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMseUJBQXlCLENBQUUsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUUsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFFLENBQUM7WUFDekosS0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFDbEM7Z0JBQ0ksSUFBSSxXQUFXLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBRSxDQUFDLENBQUUsQ0FBQztnQkFDdkMsSUFBSyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQ3RDO29CQUNJLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxVQUFVLEdBQUcsWUFBWSxDQUFDLGdDQUFnQyxDQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBRSxDQUFDO2lCQUM1SDtnQkFDRCxJQUFJLFVBQVUsR0FBRyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDO2dCQUMvQyxJQUFJLFlBQVksR0FBRyxXQUFXLENBQUMsaUJBQWlCLENBQUUsYUFBYSxDQUFZLENBQUM7Z0JBQ3hGLElBQUksYUFBYSxHQUFHLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBRSxRQUFRLENBQXVCLENBQUM7Z0JBQ25GLElBQUksZ0JBQWdCLEdBQUcsV0FBVyxDQUFDLGlCQUFpQixDQUFFLGdCQUFnQixDQUFhLENBQUM7Z0JBQ3hFLElBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxFQUN0QztvQkFDSSxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxHQUFHLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLENBQUM7b0JBQzNELFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO29CQUMzRCxhQUFhLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxlQUFlLENBQUMsSUFBSSxDQUFFLFNBQVMsRUFBRSxVQUFVLENBQUUsQ0FBRSxDQUFDO29CQUMzRixnQkFBZ0IsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLGVBQWUsQ0FBQyxJQUFJLENBQUUsU0FBUyxFQUFFLFVBQVUsQ0FBRSxDQUFFLENBQUM7aUJBQ2xGO2dCQUNELElBQUssWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDLGlCQUFpQixJQUFJLFNBQVMsRUFDdkQ7b0JBQ0ksWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDLGlCQUFpQixHQUFHLENBQUMsQ0FBQyx5QkFBeUIsQ0FBRSwyQ0FBMkMsRUFBRSxXQUFXLENBQUMsSUFBSSxDQUFFLFNBQVMsRUFBRSxhQUFhLEVBQUUsWUFBWSxDQUFFLENBQUUsQ0FBQztpQkFDbEw7Z0JBQ0QsV0FBVyxDQUFFLGFBQWEsRUFBRSxZQUFZLENBQUUsQ0FBQztnQkFHM0MsSUFBSyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQ3RDO29CQUNYLElBQUksR0FBRyxHQUFHLFlBQVksQ0FBQyx5QkFBeUIsQ0FBRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBRSxDQUFDO29CQUN6RixJQUFLLENBQUMsR0FBRyxFQUNUO3dCQUNDLEdBQUcsR0FBRyxFQUFFLENBQUM7cUJBQ1Q7b0JBRUQsYUFBYSxDQUFDLE9BQU8sR0FBRyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxZQUFZLENBQUM7b0JBQzNELGdCQUFnQixDQUFDLE9BQU8sR0FBRyxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsWUFBWSxDQUFDO29CQUM3RCxJQUFLLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxZQUFZLEVBQ3RDO3dCQUNDLGdCQUFnQixDQUFDLFFBQVEsQ0FBRSxvQ0FBb0MsR0FBRyxHQUFHLENBQUMsV0FBVyxFQUFFLEdBQUcsTUFBTSxDQUFFLENBQUM7cUJBQy9GO3lCQUNtQixJQUFLLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLEtBQUssVUFBVSxFQUNyRDt3QkFDSSxhQUFhLENBQUMsbUJBQW1CLENBQUMsVUFBVSxDQUFDLENBQUM7d0JBQzlDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLEdBQUcsVUFBVSxDQUFDO3FCQUM3QztpQkFDSjtnQkFFRCxLQUFNLElBQUksQ0FBQyxJQUFJLFdBQVcsRUFDMUI7b0JBQ0ksSUFBSSxNQUFNLEdBQUcsV0FBVyxDQUFDLGlCQUFpQixDQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBYSxDQUFDO29CQUN4RSxJQUFJLFVBQVUsR0FBVSxZQUFZLENBQUMsa0JBQWtCLENBQUUsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFFLENBQUM7b0JBQ3BILE1BQU0sQ0FBQyxJQUFJLEdBQUcsVUFBVSxDQUFDO29CQUN6QixJQUFLLFdBQVcsQ0FBQyxDQUFDLENBQUMsS0FBSyxNQUFNLEVBQzlCO3dCQUNJLElBQUssVUFBVSxJQUFJLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFDckM7NEJBQ0ksV0FBVyxDQUFDLGlCQUFpQixDQUFFLGFBQWEsQ0FBRSxDQUFDLFFBQVEsQ0FBRSxXQUFXLENBQUUsQ0FBQzt5QkFDMUU7NkJBRUQ7NEJBQ0ksV0FBVyxDQUFDLGlCQUFpQixDQUFFLGFBQWEsQ0FBRSxDQUFDLFdBQVcsQ0FBRSxXQUFXLENBQUUsQ0FBQzt5QkFDN0U7cUJBQ0o7aUJBQ0o7YUFDSjtRQUNMLENBQUM7UUFFRCxvQkFBb0IsQ0FBRSxDQUFDLENBQUUsQ0FBQztRQUMxQixvQkFBb0IsQ0FBRSxDQUFDLENBQUUsQ0FBQztRQUMxQixhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztRQUV4QyxJQUFJLFdBQVcsR0FBRyxZQUFZLENBQUMsWUFBWSxDQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLENBQUUsQ0FBQztRQUM1RSxJQUFJLFVBQVUsR0FBRyxZQUFZLENBQUMsV0FBVyxDQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLENBQUUsQ0FBQztRQUMxRSxJQUFJLGVBQWUsR0FBRyxZQUFZLENBQUM7UUFDbkMsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxlQUFlLEdBQUcsVUFBVSxDQUFFLENBQUM7UUFDekQsSUFBSyxPQUFPLEtBQUssZUFBZSxHQUFHLFVBQVU7WUFBRyxPQUFPLEdBQUcsVUFBVSxDQUFDO1FBQ3JFLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBRSxVQUFVLEVBQUUsT0FBTyxDQUFFLENBQUM7UUFLdkQsSUFBSSxjQUFjLEdBQUcsYUFBYSxDQUFDLGlCQUFpQixDQUFFLGdCQUFnQixDQUFhLENBQUM7UUFFcEYsSUFBSSxrQkFBa0IsR0FBRyxVQUFXLE9BQWU7WUFFL0MsT0FBTyxDQUFDLFFBQVEsQ0FBRSw2Q0FBNkMsQ0FBRSxDQUFDO1FBQ3RFLENBQUMsQ0FBQTtRQUVELElBQUssY0FBYyxFQUNuQjtZQUNJLENBQUMsQ0FBQyxvQkFBb0IsQ0FBRSxpQkFBaUIsRUFBRSxjQUFjLEVBQUUsa0JBQWtCLENBQUMsSUFBSSxDQUFFLFNBQVMsRUFBRSxjQUFjLENBQUUsQ0FBRSxDQUFDO1lBQ2xILGNBQWMsQ0FBQyxRQUFRLENBQUUscUNBQXFDLEdBQUMsVUFBVSxHQUFDLE1BQU0sQ0FBRSxDQUFDO1NBQ3RGO1FBS0QsSUFBSSxlQUFlLEdBQUcsYUFBYSxDQUFDLGlCQUFpQixDQUFFLGlCQUFpQixDQUFhLENBQUM7UUFFdEYsSUFBSSxtQkFBbUIsR0FBRyxVQUFXLE9BQWdCO1lBRWpELE9BQU8sQ0FBQyxRQUFRLENBQUUsMkNBQTJDLENBQUUsQ0FBQztRQUNwRSxDQUFDLENBQUE7UUFFRCxJQUFLLGVBQWUsRUFDcEI7WUFDSSxDQUFDLENBQUMsb0JBQW9CLENBQUUsaUJBQWlCLEVBQUUsZUFBZSxFQUFFLG1CQUFtQixDQUFDLElBQUksQ0FBRSxTQUFTLEVBQUUsZUFBZSxDQUFFLENBQUUsQ0FBQztZQUNySCxlQUFlLENBQUMsUUFBUSxDQUFFLDJCQUEyQixHQUFHLFdBQVcsR0FBRyxNQUFNLENBQUUsQ0FBQztTQUNsRjtRQUtELElBQUksYUFBYSxHQUFHLFlBQVksQ0FBQyxnQkFBZ0IsQ0FBRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFFLENBQUM7UUFDbEYsYUFBYSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBRSxhQUFhLEdBQUcsRUFBRSxDQUFFLEVBQUUsQ0FBQyxDQUFFLENBQUM7UUFDaEUsYUFBYSxDQUFDLGlCQUFpQixDQUFFLFVBQVUsRUFBRSxDQUFDLENBQUMsZUFBZSxDQUFFLHNCQUFzQixFQUFFLEVBQUUsS0FBSyxFQUFFLGFBQWEsRUFBRSxDQUFFLENBQUUsQ0FBQztRQUVySCxJQUFLLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxtQkFBbUIsS0FBSyxNQUFNLEVBQ3hEO1lBQ0ksSUFBSSxLQUFLLEdBQUcsQ0FBQyxHQUFHLFlBQVksQ0FBQyx5QkFBeUIsQ0FBRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBRSxHQUFHLFlBQVksQ0FBQyx5QkFBeUIsQ0FBRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBRSxDQUFDO1lBQy9LLElBQUksc0JBQXNCLEdBQUcsc0JBQXNCLENBQUM7WUFDcEQsSUFBSyxLQUFLLEdBQUcsRUFBRSxFQUNOO2dCQUNJLHNCQUFzQixHQUFHLHFCQUFxQixDQUFDO2FBQ2xEO2lCQUNJLElBQUssS0FBSyxHQUFHLEVBQUUsRUFDcEI7Z0JBQ0ksc0JBQXNCLEdBQUcsdUJBQXVCLENBQUM7YUFDcEQ7WUFDRCxhQUFhLENBQUMsaUJBQWlCLENBQUUsYUFBYSxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUUsc0JBQXNCLENBQUUsQ0FBRSxDQUFDO1lBQ3ZGLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBRSxrQkFBa0IsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFFLG9CQUFvQixDQUFFLENBQUUsQ0FBQztZQUMxRixhQUFhLENBQUMsaUJBQWlCLENBQUUsZUFBZSxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUUsb0JBQW9CLENBQUUsQ0FBRSxDQUFDO1NBQzFGO2FBRUQ7WUFDSSxhQUFhLENBQUMsaUJBQWlCLENBQUUsYUFBYSxFQUFFLFlBQVksQ0FBQyxNQUFNLENBQUUsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFFLDZCQUE2QixDQUFFLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFFLENBQUUsQ0FBQztZQUNyTixhQUFhLENBQUMsaUJBQWlCLENBQUUsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxvQkFBb0IsQ0FBRSxDQUFFLENBQUM7WUFDMUYsYUFBYSxDQUFDLGlCQUFpQixDQUFFLGVBQWUsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFFLG9CQUFvQixDQUFFLENBQUUsQ0FBQztTQUMxRjtJQUNMLENBQUM7SUFFRCxTQUFTLDRCQUE0QixDQUFFLGFBQXFCO1FBRXhELGVBQWUsQ0FBRSxDQUFDLENBQUUsQ0FBQztRQUNyQixlQUFlLENBQUUsQ0FBQyxDQUFFLENBQUM7UUFFckIsU0FBUyxlQUFlLENBQUUsS0FBWTtZQUVsQyxJQUFJLEdBQUcsR0FBRyxZQUFZLENBQUMseUJBQXlCLENBQUUsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUUsQ0FBQztZQUN4RixJQUFLLEdBQUcsRUFDUjtnQkFDSSxJQUFJLFdBQVcsR0FBRSxvQ0FBb0MsR0FBRyxHQUFHLENBQUMsV0FBVyxFQUFFLEdBQUcsTUFBTSxDQUFDO2dCQUNuRixJQUFJLEdBQUcsR0FBRyxhQUFhLENBQUMsaUJBQWlCLENBQUUsWUFBWSxHQUFHLEtBQUssQ0FBYSxDQUFDO2dCQUM3RSxHQUFHLENBQUMsUUFBUSxDQUFFLFdBQVcsQ0FBRSxDQUFDO2FBQy9CO1lBRUQsYUFBYSxDQUFDLGlCQUFpQixDQUFFLFVBQVUsR0FBRyxLQUFLLEVBQUUsWUFBWSxDQUFDLDBCQUEwQixDQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFFLENBQUUsQ0FBQztZQUN0SSxhQUFhLENBQUMsaUJBQWlCLENBQUUsT0FBTyxHQUFHLEtBQUssRUFBRSxDQUFDLFlBQVksQ0FBQyx5QkFBeUIsQ0FBRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBRSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUUsQ0FBQztRQUNuSixDQUFDO1FBRUQsSUFBSSxVQUFVLEdBQUcsWUFBWSxDQUFDLFdBQVcsQ0FBRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFFLENBQUM7UUFDMUUsSUFBSSxlQUFlLEdBQUcsWUFBWSxDQUFDO1FBQ25DLElBQUksT0FBTyxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUUsZUFBZSxHQUFHLFVBQVUsQ0FBRSxDQUFDO1FBQ3pELElBQUssT0FBTyxLQUFLLGVBQWUsR0FBRyxVQUFVO1lBQUcsT0FBTyxHQUFHLFVBQVUsQ0FBQztRQUNyRSxhQUFhLENBQUMsaUJBQWlCLENBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBRSxDQUFDO1FBQ3RELElBQUksY0FBYyxHQUFHLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBRSxXQUFXLENBQWEsQ0FBQztRQUMvRSxJQUFLLGNBQWMsRUFDbkI7WUFDSSxjQUFjLENBQUMsUUFBUSxDQUFFLHFDQUFxQyxHQUFDLFVBQVUsR0FBQyxNQUFNLENBQUUsQ0FBQztTQUN0RjtRQUVELElBQUksZ0JBQWdCLEdBQUcsYUFBYSxDQUFDLGlCQUFpQixDQUFFLGlCQUFpQixDQUFhLENBQUM7UUFDdkYsZ0JBQWdCLENBQUMsUUFBUSxDQUFFLHFEQUFxRCxHQUFHLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxlQUFlLEdBQUcsTUFBTSxDQUFFLENBQUM7UUFFbkksYUFBYSxDQUFDLGlCQUFpQixDQUFFLGlCQUFpQixFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUUsWUFBWSxDQUFDLDJCQUEyQixDQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLENBQUUsQ0FBRSxDQUFFLENBQUM7UUFDN0ksYUFBYSxDQUFDLGlCQUFpQixDQUFFLFlBQVksRUFBRSxZQUFZLENBQUMsTUFBTSxDQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBRSw2QkFBNkIsQ0FBRSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUUsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBRSxDQUFFLENBQUM7SUFDeE4sQ0FBQztJQUVELFNBQWdCLElBQUksQ0FBRSxhQUFxQjtRQUV2QyxpQkFBaUIsQ0FBRSxJQUFJLEVBQUUsYUFBYSxDQUFFLENBQUM7UUFDekMsZ0JBQWdCLENBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxhQUFhLENBQUUsQ0FBQztRQUU3QyxJQUFJLG1CQUFtQixHQUFHLFlBQVksQ0FBQywwQkFBMEIsQ0FBRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFFLENBQUM7UUFDbEcsYUFBYSxDQUFDLFdBQVcsQ0FBRSxvQkFBb0IsRUFBRSxtQkFBbUIsQ0FBRSxDQUFDO1FBQ3ZFLElBQUssbUJBQW1CLEVBQ3hCO1lBQ0ksSUFBSSxlQUFlLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxPQUFPLEVBQUUsYUFBYSxFQUFFLG9CQUFvQixDQUFFLENBQUM7WUFDcEYsZUFBZSxDQUFDLGtCQUFrQixDQUFFLHVDQUF1QyxDQUFDLENBQUM7U0FDaEY7UUFFRCxJQUFJLE1BQU0sR0FBRyxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUM7UUFFcEMsU0FBUyx1QkFBdUIsQ0FBRSxNQUFhO1lBRTNDLElBQUksZUFBZSxHQUFHLFNBQVMsQ0FBQztZQUNoQyxJQUFJLE1BQU0sR0FBRyxhQUFhLENBQUMscUJBQXFCLENBQUUsZ0JBQWdCLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFFLENBQUM7WUFDckYsS0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFDbEM7Z0JBQ0ksSUFBSSxVQUFVLEdBQUcsWUFBWSxDQUFDLGdDQUFnQyxDQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBRSxDQUFDO2dCQUMxRyxJQUFJLFdBQVcsR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsWUFBWSxHQUFHLFVBQVUsQ0FBQyxDQUFDO2dCQUM1RSxJQUFLLENBQUMsVUFBVSxFQUNoQjtvQkFDSSxNQUFNLENBQUMsUUFBUSxDQUFFLGlCQUFpQixDQUFFLENBQUM7aUJBQ3hDO2dCQUNELFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO2dCQUMzQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztnQkFDbkMsSUFBSyxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsbUJBQW1CLElBQUksTUFBTSxFQUN2RDtvQkFDSSxXQUFXLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxlQUFlLENBQUMsSUFBSSxDQUFFLFNBQVMsRUFBRSxhQUFhLEVBQUUsV0FBVyxDQUFFLENBQUUsQ0FBQztvQkFDekcsSUFBSyxDQUFFLENBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBRSxJQUFJLENBQUUsTUFBTSxJQUFJLENBQUMsQ0FBRSxDQUFFLElBQUksQ0FBRSxNQUFNLEtBQUssVUFBVSxDQUFFLEVBQ25FO3dCQUNJLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxlQUFlLEdBQUcsV0FBVyxDQUFDO3FCQUN0RDtpQkFDSjtnQkFDRCxXQUFXLENBQUMsa0JBQWtCLENBQUUsdUNBQXVDLENBQUUsQ0FBQztnQkFDMUUsSUFBSSxhQUFhLEdBQUcsV0FBVyxDQUFDLGlCQUFpQixDQUFFLFFBQVEsQ0FBRSxDQUFDO2dCQUMxRSxhQUFhLENBQUMsUUFBUSxDQUFFLHdCQUF3QixHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBRSxDQUFDO2dCQUVuRSxJQUFJLGlCQUFpQixHQUFHLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBRSxhQUFhLENBQUUsQ0FBQztnQkFDdkUsaUJBQWlCLENBQUMsUUFBUSxDQUFFLFdBQVcsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUUsQ0FBQztnQkFDMUQsaUJBQWlCLENBQUMsYUFBYSxDQUFFLFlBQVksRUFDNUMsVUFBVSxhQUFxQixFQUFFLFdBQW1CLEVBQUUsVUFBaUI7b0JBRXRFLElBQUssYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLG1CQUFtQixJQUFJLE1BQU07d0JBQ3RELGVBQWUsQ0FBRSxhQUFhLEVBQUUsV0FBVyxDQUFFLENBQUM7b0JBQy9DLGVBQWUsQ0FBRSxVQUFVLENBQUUsQ0FBQztnQkFDL0IsQ0FBQztxQkFDQSxJQUFJLENBQUUsU0FBUyxFQUFFLGFBQWEsRUFBRSxXQUFXLEVBQUUsVUFBVSxDQUFFLENBQUUsQ0FBQztnQkFFbEQsSUFBSSxnQkFBZ0IsR0FBRyxXQUFXLENBQUMsaUJBQWlCLENBQUUsaUJBQWlCLENBQUUsQ0FBQztnQkFFMUUsS0FBTSxJQUFJLENBQUMsSUFBSSxXQUFXLEVBQzFCO29CQUNJLElBQUksTUFBTSxDQUFDO29CQUNYLElBQUssV0FBVyxDQUFDLENBQUMsQ0FBQyxLQUFJLE1BQU0sRUFDN0I7d0JBQ0ksSUFBSSxXQUFXLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsYUFBYSxDQUFFLENBQUM7d0JBQzVFLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxhQUFhLENBQUUsQ0FBQzt3QkFDbEUsTUFBTSxDQUFDLFFBQVEsQ0FBRSxtQ0FBbUMsQ0FBRSxDQUFDO3dCQUV2RCxNQUFNLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDO3dCQUMvRCxNQUFNLENBQUMsUUFBUSxDQUFFLHlCQUF5QixDQUFFLENBQUM7d0JBQzdDLFdBQVcsQ0FBQyxRQUFRLENBQUUsY0FBYyxDQUFFLENBQUM7d0JBQ3ZDLFdBQVcsQ0FBQyxRQUFRLENBQUUsb0JBQW9CLENBQUUsQ0FBQzt3QkFDN0MsTUFBTSxDQUFDLFFBQVEsQ0FBRSwwQkFBMEIsQ0FBRSxDQUFDO3dCQUNoRSxNQUFNLENBQUMsUUFBUSxDQUFFLDJCQUEyQixDQUFHLENBQUM7d0JBQ2hELE1BQU0sR0FBRyxXQUFXLENBQUM7cUJBQ047eUJBRUQ7d0JBQ0ksTUFBTSxHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUUsT0FBTyxFQUFFLGdCQUFnQixFQUFFLEVBQUUsQ0FBRSxDQUFDO3dCQUN4RCxNQUFNLENBQUMsUUFBUSxDQUFFLGNBQWMsQ0FBRSxDQUFDO3dCQUNsQyxNQUFNLENBQUMsUUFBUSxDQUFFLGdCQUFnQixHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDO3dCQUNyRCxNQUFNLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDO3FCQUM1RTtvQkFFRCxNQUFNLENBQUMsUUFBUSxDQUFFLFdBQVcsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUUsQ0FBQztpQkFDbkM7YUFDSjtRQUNMLENBQUM7UUFFRCx1QkFBdUIsQ0FBRSxDQUFDLENBQUUsQ0FBQztRQUM3Qix1QkFBdUIsQ0FBRSxDQUFDLENBQUUsQ0FBQztRQUU3QixJQUFJLGNBQWMsR0FBRyxZQUFZLENBQUMsc0JBQXNCLENBQUUsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBRSxDQUFDO1FBQ3pGLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxZQUFZLEdBQUcsQ0FBRSxDQUFFLGNBQWMsSUFBSSxFQUFFLENBQUUsSUFBSSxDQUFFLGNBQWMsSUFBSSxTQUFTLENBQUUsQ0FBRSxDQUFDO1FBQ3BHLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxlQUFlLEdBQUcsWUFBWSxDQUFDLGtCQUFrQixDQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFFLENBQUM7UUFFL0csYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLGtCQUFrQixHQUFHLFNBQVMsQ0FBQztRQUNwRCxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsc0JBQXNCLEdBQUcsU0FBUyxDQUFDO1FBQ3hELGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO1FBQ3pDLElBQUksY0FBYyxHQUFHLGFBQWEsQ0FBQyxxQkFBcUIsQ0FBRSwyQkFBMkIsQ0FBRSxDQUFBO1FBQ3ZGLEtBQU0sSUFBSSxDQUFDLElBQUksV0FBVyxFQUMxQjtZQUNJLElBQUksZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxPQUFPLEVBQUUsY0FBYyxFQUFFLEVBQUUsQ0FBRSxDQUFDO1lBQ3BFLGdCQUFnQixDQUFDLFFBQVEsQ0FBRSxjQUFjLENBQUUsQ0FBQztZQUNyRCxnQkFBZ0IsQ0FBQyxRQUFRLENBQUUsZ0JBQWdCLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFFLENBQUM7WUFDL0QsZ0JBQWdCLENBQUMsUUFBUSxDQUFFLHVDQUF1QyxDQUFFLENBQUM7WUFDNUQsSUFBSSxXQUFXLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFFLENBQUM7WUFDN0UsV0FBVyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFFLGNBQWMsR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFFLENBQUM7U0FDaEY7UUFFRCxDQUFDLENBQUMsb0JBQW9CLENBQUUsdUJBQXVCLEVBQUUsYUFBYSxFQUFFLGFBQWEsQ0FBQyxJQUFJLENBQUUsU0FBUyxFQUFFLGFBQWEsQ0FBRSxDQUFFLENBQUM7UUFFakgsSUFBSSxnQkFBZ0IsR0FBRyxhQUFhLENBQUMscUJBQXFCLENBQUUsZ0JBQWdCLENBQUUsQ0FBQztRQUMvRSxJQUFJLGlCQUFpQixHQUFHLGFBQWEsQ0FBQyxxQkFBcUIsQ0FBRSxZQUFZLENBQUUsQ0FBQztRQUM1RSxJQUFJLGFBQWEsR0FBRyxhQUFhLENBQUMscUJBQXFCLENBQUUsYUFBYSxDQUFFLENBQUM7UUFDL0UsSUFBSSx1QkFBdUIsR0FBRyxhQUFhLENBQUMscUJBQXFCLENBQUUsd0JBQXdCLENBQUUsQ0FBQztRQUM5RixJQUFJLHNCQUFzQixHQUFHLGFBQWEsQ0FBQyxxQkFBcUIsQ0FBRSx1QkFBdUIsQ0FBRSxDQUFDO1FBQ3RGLElBQUksY0FBYyxHQUFHLGFBQWEsQ0FBQyxxQkFBcUIsQ0FBRSxjQUFjLENBQUUsQ0FBQztRQUMzRSxJQUFJLG1CQUFtQixHQUFHLGFBQWEsQ0FBQyxxQkFBcUIsQ0FBRSxtQkFBbUIsQ0FBRSxDQUFDO1FBQ3JGLElBQUksc0JBQXNCLEdBQUcsYUFBYSxDQUFDLHFCQUFxQixDQUFFLG9CQUFvQixDQUFFLENBQUM7UUFDekYsSUFBSSxnQkFBZ0IsR0FBRyxhQUFhLENBQUMscUJBQXFCLENBQUUsZ0JBQWdCLENBQUUsQ0FBQztRQUcvRSxJQUFLLGFBQWEsSUFBSSxDQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxtQkFBbUIsSUFBSSxNQUFNLENBQUUsRUFDNUU7WUFDSSxJQUFJLFlBQVksR0FBRyxhQUFhLENBQUMsUUFBUSxDQUFFLENBQUMsQ0FBYSxDQUFDO1lBQzFELFlBQVksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBRyx1QkFBdUIsQ0FBRSxDQUFDO1lBQzNELFlBQVksQ0FBQyxLQUFLLENBQUMsYUFBYSxHQUFHLFdBQVcsQ0FBQztTQUNsRDtRQUVELGdCQUFnQixDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsY0FBYyxDQUFDLElBQUksQ0FBRSxTQUFTLEVBQUUsYUFBYSxDQUFFLENBQUUsQ0FBQztRQUNoRyxpQkFBaUIsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLFdBQVcsQ0FBQyxJQUFJLENBQUUsU0FBUyxFQUFFLGFBQWEsQ0FBRSxDQUFFLENBQUM7UUFDOUYsaUJBQWlCLENBQUMsaUJBQWlCLENBQUUsV0FBVyxFQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxlQUFlLENBQUUsQ0FBQztRQUN6RixpQkFBaUIsQ0FBQyxhQUFhLENBQUUsYUFBYSxFQUFFLGNBQVksWUFBWSxDQUFDLHNCQUFzQixDQUFFLGlCQUFpQixFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUUsMkJBQTJCLENBQUMsQ0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFFLENBQUM7UUFDcEssaUJBQWlCLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxjQUFhLFlBQVksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDO1FBQ2hHLGFBQWEsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUUsU0FBUyxFQUFFLGFBQWEsQ0FBRSxDQUFFLENBQUM7UUFDckYsdUJBQXVCLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUUsU0FBUyxFQUFFLGFBQWEsQ0FBRSxDQUFFLENBQUM7UUFDekcsdUJBQXVCLENBQUMsYUFBYSxDQUFFLGFBQWEsRUFBRSxjQUFZLFlBQVksQ0FBQyxzQkFBc0IsQ0FBRSx1QkFBdUIsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFFLDZCQUE2QixDQUFDLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDO1FBQ2xMLHVCQUF1QixDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsY0FBYSxZQUFZLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQztRQUN0RyxzQkFBc0IsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLGVBQWUsQ0FBQyxJQUFJLENBQUUsU0FBUyxFQUFFLGFBQWEsQ0FBRSxDQUFFLENBQUM7UUFDdkcsc0JBQXNCLENBQUMsYUFBYSxDQUFFLGFBQWEsRUFBRSxjQUFZLFlBQVksQ0FBQyxzQkFBc0IsQ0FBRSxzQkFBc0IsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFFLDRCQUE0QixDQUFDLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDO1FBQy9LLHNCQUFzQixDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsY0FBYSxZQUFZLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQztRQUNyRyxjQUFjLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxXQUFXLENBQUMsSUFBSSxDQUFFLFNBQVMsRUFBRSxhQUFhLENBQUUsQ0FBRSxDQUFDO1FBQzNGLGNBQWMsQ0FBQyxhQUFhLENBQUUsYUFBYSxFQUFFLGNBQVksWUFBWSxDQUFDLHNCQUFzQixDQUFFLGNBQWMsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFFLG1CQUFtQixDQUFDLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDO1FBQ3RKLGNBQWMsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLGNBQWEsWUFBWSxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFFLENBQUM7UUFDN0Ysc0JBQXNCLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxxQkFBcUIsQ0FBQyxJQUFJLENBQUUsU0FBUyxFQUFFLGFBQWEsQ0FBRSxDQUFFLENBQUM7UUFDN0csZ0JBQWdCLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxlQUFlLENBQUMsSUFBSSxDQUFFLFNBQVMsRUFBRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsZUFBZSxFQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLENBQUUsQ0FBRSxDQUFDO1FBRXRKLE9BQU8sQ0FBRSxhQUFhLENBQUUsQ0FBQztJQUM3QixDQUFDO0lBaEplLGNBQUksT0FnSm5CLENBQUE7QUFFTCxDQUFDLEVBenJDUyxTQUFTLEtBQVQsU0FBUyxRQXlyQ2xCIn0=