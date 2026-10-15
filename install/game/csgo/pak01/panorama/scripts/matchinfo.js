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
    function _UpdateDownloadProgress(elParentPanel) {
        if (!elParentPanel.IsValid())
            return;
        elParentPanel.Data().downloadProgressHandler = undefined;
        let flProgress = MatchInfoAPI.GetDownloadProgress(elParentPanel.Data().matchId);
        elParentPanel.FindChildInLayoutFile('id-mi-download-progress').value = Math.max(flProgress, 0);
        elParentPanel.FindChildInLayoutFile('id-mi-download-percent').text = (flProgress < 0) ? '' : Math.floor(flProgress * 100) + '%';
        if (flProgress < 0)
            return;
        elParentPanel.Data().downloadProgressHandler = $.Schedule(0.1, _UpdateDownloadProgress.bind(undefined, elParentPanel));
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
                    if (!elParentPanel.Data().downloadProgressHandler)
                        _UpdateDownloadProgress(elParentPanel);
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
        if (elParentPanel.Data().updateMatchMenuHandler)
            $.UnregisterForUnhandledEvent('PanoramaComponent_MatchInfo_StateChange', elParentPanel.Data().updateMatchMenuHandler);
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
        if (elParentPanel.Data().downloadProgressHandler) {
            $.CancelScheduled(elParentPanel.Data().downloadProgressHandler);
            elParentPanel.Data().downloadProgressHandler = undefined;
        }
        if (elParentPanel.Data().updateMatchInfoHandler) {
            $.UnregisterForUnhandledEvent('PanoramaComponent_MatchInfo_StateChange', elParentPanel.Data().updateMatchInfoHandler);
            elParentPanel.Data().updateMatchInfoHandler = undefined;
        }
        if (elParentPanel.Data().updateMatchMenuHandler) {
            $.UnregisterForUnhandledEvent('PanoramaComponent_MatchInfo_StateChange', elParentPanel.Data().updateMatchMenuHandler);
            elParentPanel.Data().updateMatchMenuHandler = undefined;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWF0Y2hpbmZvLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvbWF0Y2hpbmZvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFTQSxrQ0FBa0M7QUFDbEMsMENBQTBDO0FBQzFDLDJDQUEyQztBQUMzQyw2Q0FBNkM7QUFDN0MseUVBQXlFO0FBRXpFLElBQVUsU0FBUyxDQTR0Q2xCO0FBNXRDRCxXQUFVLFNBQVM7SUFFZixJQUFJLFdBQVcsR0FBRyxDQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUUsQ0FBQztJQUNwRSxJQUFJLEtBQUssR0FBRSxDQUFFLElBQUksRUFBRSxXQUFXLENBQUUsQ0FBQztJQUNqQyxJQUFJLFFBQVEsR0FBRyxDQUFDLENBQUM7SUFFakIsU0FBUyxpQkFBaUIsQ0FBRSxLQUFhLEVBQUUsR0FBWTtRQUVuRCxJQUFLLEdBQUcsRUFDUjtZQUNJLElBQUksU0FBUyxHQUFHLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBRSxrQkFBa0IsQ0FBRSxDQUFDO1lBQ2hFLElBQUssU0FBUyxFQUNkO2dCQUNJLElBQUssS0FBSyxFQUNWO29CQUNJLFNBQVMsQ0FBQyxXQUFXLENBQUUsTUFBTSxDQUFFLENBQUM7aUJBQ25DO3FCQUVEO29CQUNJLFNBQVMsQ0FBQyxRQUFRLENBQUUsTUFBTSxDQUFFLENBQUM7aUJBQ2hDO2FBQ0o7U0FDSjtJQUNMLENBQUM7SUFFRCxTQUFTLGdCQUFnQixDQUFFLEtBQWEsRUFBRSxJQUFhLEVBQUUsR0FBWTtRQUVqRSxJQUFLLEdBQUcsRUFDUjtZQUNJLElBQUksU0FBUyxHQUFHLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBRSxrQkFBa0IsQ0FBYSxDQUFDO1lBQzNFLElBQUssU0FBUyxFQUNkO2dCQUNJLFNBQVMsQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDO2FBQzFCO1lBQ0QsSUFBSSxrQkFBa0Is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