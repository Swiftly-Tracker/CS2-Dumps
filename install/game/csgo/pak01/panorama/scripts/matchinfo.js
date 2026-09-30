"use strict";
// avatar content
// name content
// avatar right-click functionality
// match top bar info styling
// Ts
// player stats panel
// animations
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
                // also support legacy fan coin that didn't have purchased drop souvenirs
                coinLevel += coinRedeemsPurchased;
            }
            let redeemed = Number(InventoryAPI.GetItemAttributeValue(id, "operation drops awarded 0"));
            let redeemsAvailable = coinLevel - redeemed;
            // If this is the current tournament and it has "redeem charges" for sale then allow redeem button to show up
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
        // let canWatch = MatchInfoAPI.CanWatch( elParentPanel.Data().matchId );
        let canWatch = false; // DISABLING round watch in the UI until we make it functional
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
        $.Msg('_UpdateMatchMenu for ' + elParentPanel.Data().matchId + ' watch=' + canWatch + ' state=' + matchState);
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
            // Set visibility to false and unload resources
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
        $.Msg("maxrounds: " + maxRounds + "\ttotalrounds: " + totalRounds + "\tplayedrounds: " + playedRounds + "\t OTs: " + nOvertime);
        // Round wins and losses
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
        // add bars
        function _IsMajorTick(n) {
            // first round
            if (n == 1)
                return true;
            // end of regulation time
            if (n == maxRounds)
                return true;
            // max number of possible rounds including ot
            if (n == totalRounds)
                return true;
            // new overtime
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
            else // overtime
             {
                // no minor ticks in ot
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
        // "currentTeamId" is the team on which the player finished the match, but the round stats
        // will be filled out from Round One, so we need to figure out which team the player started on
        let numTimesPlayersChangedSides = 0;
        numTimesPlayersChangedSides += ((totalRounds > (maxRounds / 2)) ? 1 : 0); // team switch at halftime
        if (totalRounds > maxRounds) {
            let numRoundsPlayedInLastOvertime = (totalRounds - maxRounds) % 6;
            let numFullOvertimesPlayed = (totalRounds - maxRounds - numRoundsPlayedInLastOvertime) / 6;
            // every full overtime encountered change of sides, and every partial OT going to 2nd half had a change of sides
            numTimesPlayersChangedSides += numFullOvertimesPlayed + ((numRoundsPlayedInLastOvertime > 3) ? 1 : 0);
        }
        // Flip the starting team from ending team if we see an odd number of side changes
        if (numTimesPlayersChangedSides % 2 == 1) {
            currentTeamId = flipBit(currentTeamId);
        }
        // Go ahead and create a panel for every round in the match
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
                // MVP star on/off and team tint
                if (mvps[n] != 0) {
                    elMVPStarImg.RemoveClass('hide');
                    elMVPStarImg.RemoveClass('sb-tint--' + TEAMS[flipBit(currentTeamId)]);
                    elMVPStarImg.AddClass('sb-tint--' + TEAMS[currentTeamId]);
                }
                else {
                    elMVPStarImg.AddClass('hide');
                }
                //Kills and headshots
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
                //Deaths
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
        // label the ticks
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
        _ShowMatchSpinner(false, elParentPanel); // todo: move to this file
        _SetMatchMessage("", false, elParentPanel); // todo: move to this file
        // figure out if the teams have switched sides.  If so, the scoreboard needs repopulating to reorder the teams.
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
        //
        // Map icon
        //
        let elMatchMapIcon = elParentPanel.FindChildTraverse("id-mi-map-icon");
        let setDefaultMapImage = function (mapIcon) {
            mapIcon.SetImage("file://{images}/map_icons/map_icon_NONE.png");
        };
        if (elMatchMapIcon) {
            $.RegisterEventHandler('ImageFailedLoad', elMatchMapIcon, setDefaultMapImage.bind(undefined, elMatchMapIcon));
            elMatchMapIcon.SetImage("file://{images}/map_icons/map_icon_" + rawMapName + ".svg");
        }
        //
        // Mode icon
        //
        let elMatchModeIcon = elParentPanel.FindChildTraverse("id-mi-mode-icon");
        let setDefaultModeImage = function (mapIcon) {
            mapIcon.SetImage("file://{images}/icons/ui/competitive.vsvg");
        };
        if (elMatchModeIcon) {
            $.RegisterEventHandler('ImageFailedLoad', elMatchModeIcon, setDefaultModeImage.bind(undefined, elMatchModeIcon));
            elMatchModeIcon.SetImage("file://{images}/icons/ui/" + rawModeName + ".svg");
        }
        //
        // Rest of match details
        //
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
        _ShowMatchSpinner(true, elParentPanel); // todo: move to this file
        _SetMatchMessage("", false, elParentPanel); // todo: move to this file
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
                        // elStar.text = $.Localize( '#Scoreboard_MVP_Star' );
                        elStat = $.CreatePanel('Label', elMvpsPanel, PLAYERSTATS[p]);
                        elStat.AddClass('mi-mvps-shrink-overflow');
                        elMvpsPanel.AddClass('sb-row__cell');
                        elMvpsPanel.AddClass('sb-row__cell--mvps');
                        elStar.AddClass('sb-row__cell--mvps__star');
                        elStat.AddClass('sb-row__cell--mvps__count');
                        elStat = elMvpsPanel; // Make sure the entire star and number get tinted
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWF0Y2hpbmZvLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvbWF0Y2hpbmZvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxpQkFBaUI7QUFDakIsZUFBZTtBQUNmLG1DQUFtQztBQUNuQyw2QkFBNkI7QUFDN0IsS0FBSztBQUVMLHFCQUFxQjtBQUNyQixhQUFhO0FBRWIsa0NBQWtDO0FBQ2xDLDBDQUEwQztBQUMxQywyQ0FBMkM7QUFDM0MsNkNBQTZDO0FBQzdDLHlFQUF5RTtBQUV6RSxJQUFVLFNBQVMsQ0F5ckNsQjtBQXpyQ0QsV0FBVSxTQUFTO0lBRWYsSUFBSSxXQUFXLEdBQUcsQ0FBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFFLENBQUM7SUFDcEUsSUFBSSxLQUFLLEdBQUUsQ0FBRSxJQUFJLEVBQUUsV0FBVyxDQUFFLENBQUM7SUFDakMsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDO0lBRWpCLFNBQVMsaUJBQWlCLENBQUUsS0FBYSxFQUFFLEdBQVk7UUFFbkQsSUFBSyxHQUFHLEVBQ1I7WUFDSSxJQUFJLFNBQVMsR0FBRyxHQUFHLENBQUMscUJBQXFCLENBQUUsa0JBQWtCLENBQUUsQ0FBQztZQUNoRSxJQUFLLFNBQVMsRUFDZDtnQkFDSSxJQUFLLEtBQUssRUFDVjtvQkFDSSxTQUFTLENBQUMsV0FBVyxDQUFFLE1BQU0sQ0FBRSxDQUFDO2lCQUNuQztxQkFFRDtvQkFDSSxTQUFTLENBQUMsUUFBUSxDQUFFLE1BQU0sQ0FBRSxDQUFDO2lCQUNoQzthQUNKO1NBQ0o7SUFDTCxDQUFDO0lBRUQsU0FBUyxnQkFBZ0IsQ0FBRSxLQUFhLEVBQUUsSUFBYSxFQUFFLEdBQVk7UUFFakUsSUFBSyxHQUFHLEVBQ1I7WUFDSSxJQUFJLFNBQVMsR0FBRyxHQUFHLENBQUMscUJBQXFCLENBQUUsa0JBQWtCLENBQWEsQ0FB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Q0FBQyxDQUFDLEtBQUssQ0FBRSxXQUFXLENBQUUsQ0FBQyxJQUFJLENBQUUsQ0FBQyxDQUFFLENBQUM7UUFFN0UsSUFBSSxTQUFTLEdBQVUsWUFBWSxDQUFDLHdCQUF3QixDQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxVQUFVLEVBQUUsYUFBYSxDQUFFLENBQUM7UUFDcEssSUFBSSxLQUFLLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFFLEdBQUcsQ0FBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUUsV0FBVyxDQUFFLENBQUMsSUFBSSxDQUFFLENBQUMsQ0FBRSxDQUFDO1FBRWhGLElBQUksYUFBYSxHQUFVLFlBQVksQ0FBQyx3QkFBd0IsQ0FBRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLENBQUMsVUFBVSxFQUFFLGlCQUFpQixDQUFFLENBQUM7UUFDNUssSUFBSSxTQUFTLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFFLEdBQUcsQ0FBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUUsV0FBVyxDQUFFLENBQUMsSUFBSSxDQUFFLENBQUMsQ0FBRSxDQUFDO1FBRTVGLElBQUksVUFBVSxHQUFVLFlBQVksQ0FBQyx3QkFBd0IsQ0FBRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBRSxDQUFDO1FBQ2hLLElBQUksTUFBTSxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBRSxHQUFHLENBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFFLFdBQVcsQ0FBRSxDQUFDLElBQUksQ0FBRSxDQUFDLENBQUUsQ0FBQztRQUU3RSxXQUFXO1FBQ1gsU0FBUyxZQUFZLENBQUcsQ0FBUTtZQUU1QixjQUFjO1lBQ2QsSUFBSyxDQUFDLElBQUksQ0FBQztnQkFDUCxPQUFPLElBQUksQ0FBQztZQUVoQix5QkFBeUI7WUFDekIsSUFBSyxDQUFDLElBQUksU0FBUztnQkFDZixPQUFPLElBQUksQ0FBQztZQUVoQiw2Q0FBNkM7WUFDN0MsSUFBSyxDQUFDLElBQUksV0FBVztnQkFDakIsT0FBTyxJQUFJLENBQUM7WUFFaEIsZUFBZTtZQUNmLElBQUssQ0FBQyxHQUFHLFNBQVMsSUFBSSxDQUFFLENBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBRSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUU7Z0JBQ2hELE9BQU8sSUFBSSxDQUFDO1lBRWhCLE9BQU8sS0FBSyxDQUFDO1FBQ2pCLENBQUM7UUFFRCxTQUFTLFlBQVksQ0FBRyxDQUFRO1lBRTVCLElBQUssQ0FBQyxHQUFHLFNBQVMsRUFDbEI7Z0JBQ0ksSUFBSyxTQUFTLEdBQUcsQ0FBQyxJQUFJLENBQUM7b0JBQ25CLE9BQU8sQ0FBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBRSxDQUFDO3FCQUNyQixJQUFLLFNBQVMsR0FBRyxDQUFDLElBQUksQ0FBQztvQkFDeEIsT0FBTyxDQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFFLENBQUM7cUJBQ3JCLElBQUssU0FBUyxJQUFJLEVBQUUsSUFBSSxTQUFTLEdBQUcsQ0FBQyxJQUFJLENBQUM7b0JBQzNDLE9BQU8sQ0FBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBRSxDQUFDO3FCQUNyQixJQUFLLFNBQVMsSUFBSSxDQUFDLElBQUksU0FBUyxHQUFHLENBQUMsSUFBSSxDQUFDO29CQUMxQyxPQUFPLENBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUUsQ0FBQzthQUM3QjtpQkFDSSxXQUFXO2FBQ2hCO2dCQUNJLHVCQUF1QjthQUMxQjtZQUVELE9BQU8sS0FBSyxDQUFDO1FBQ2pCLENBQUM7UUFFRCxTQUFTLGtCQUFrQixDQUFHLENBQVE7WUFFbEMsSUFBSyxDQUFDLElBQUksQ0FBRSxTQUFTLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBRTtnQkFDM0IsT0FBTyxJQUFJLENBQUM7UUFDcEIsQ0FBQztRQUVELFNBQVMsaUJBQWlCLENBQUcsQ0FBUTtZQUVqQyxJQUFLLENBQUMsSUFBSSxDQUFFLFNBQVMsR0FBRyxDQUFDLENBQUU7Z0JBQ3ZCLE9BQU8sSUFBSSxDQUFDO1FBQ3BCLENBQUM7UUFFRCxTQUFTLHFCQUFxQixDQUFHLENBQVE7WUFFckMsSUFBSyxrQkFBa0IsQ0FBRSxDQUFDLENBQUU7Z0JBQ3hCLE9BQU8scUNBQXFDLENBQUM7aUJBQzVDLElBQUssaUJBQWlCLENBQUUsQ0FBQyxDQUFFO2dCQUM1QixPQUFPLG9DQUFvQyxDQUFDO2lCQUMzQyxJQUFLLFlBQVksQ0FBRSxDQUFDLENBQUU7Z0JBQ3ZCLE9BQU8sc0JBQXNCLENBQUM7aUJBQzdCLElBQUssWUFBWSxDQUFFLENBQUMsQ0FBRTtnQkFDdkIsT0FBTyxzQkFBc0IsQ0FBQzs7Z0JBRTlCLE9BQU8sb0JBQW9CLENBQUM7UUFDcEMsQ0FBQztRQUVELFNBQVMsV0FBVyxDQUFHLENBQVE7WUFFM0IsT0FBTyxDQUFFLENBQUMsR0FBRyxTQUFTLENBQUUsQ0FBQztRQUM3QixDQUFDO1FBRUQsU0FBUyxjQUFjLENBQUcsQ0FBUTtZQUU5QixJQUFLLENBQUMsSUFBSSxTQUFTO2dCQUNmLE9BQU8sRUFBRSxDQUFDO1lBRWQsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBRSxDQUFDLEdBQUcsU0FBUyxDQUFFLEdBQUcsQ0FBQyxDQUFDO1lBRXhDLElBQUssU0FBUyxHQUFHLENBQUMsRUFDbEI7Z0JBQ0ksT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFFLHFCQUFxQixDQUFFLEdBQUcsR0FBRyxHQUFHLENBQUUsRUFBRSxDQUFFLENBQUM7YUFDN0Q7aUJBRUQ7Z0JBQ0ksT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFFLHFCQUFxQixDQUFFLENBQUM7YUFDOUM7UUFDTCxDQUFDO1FBRUQsU0FBUyxnQkFBZ0IsQ0FBRyxDQUFRO1lBRWhDLElBQUssa0JBQWtCLENBQUUsQ0FBQyxDQUFFO2dCQUN4QixPQUFPLElBQUksQ0FBQztpQkFDWCxJQUFLLGtCQUFrQixDQUFFLENBQUMsQ0FBRSxJQUFJLGlCQUFpQixDQUFFLENBQUMsQ0FBRTtnQkFDdkQsT0FBTyxFQUFFLENBQUM7aUJBQ1QsSUFBSyxZQUFZLENBQUUsQ0FBQyxDQUFFLElBQUksWUFBWSxDQUFFLENBQUMsQ0FBRTtnQkFDNUMsT0FBTyxDQUFDLENBQUM7O2dCQUVULE9BQU8sRUFBRSxDQUFDO1FBQ2xCLENBQUM7UUFFRCwwRkFBMEY7UUFDMUYsK0ZBQStGO1FBQy9GLElBQUksMkJBQTJCLEdBQUcsQ0FBQyxDQUFDO1FBQ3BDLDJCQUEyQixJQUFJLENBQUUsQ0FBRSxXQUFXLEdBQUcsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQyxDQUFDLDBCQUEwQjtRQUN4RyxJQUFLLFdBQVcsR0FBRyxTQUFTLEVBQzVCO1lBQ0ksSUFBSSw2QkFBNkIsR0FBRyxDQUFFLFdBQVcsR0FBRyxTQUFTLENBQUUsR0FBRyxDQUFDLENBQUM7WUFDcEUsSUFBSSxzQkFBc0IsR0FBRyxDQUFFLFdBQVcsR0FBRyxTQUFTLEdBQUcsNkJBQTZCLENBQUUsR0FBRyxDQUFDLENBQUM7WUFDN0YsZ0hBQWdIO1lBQ2hILDJCQUEyQixJQUFJLHNCQUFzQixHQUFHLENBQUUsQ0FBRSw2QkFBNkIsR0FBRyxDQUFDLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQztTQUM3RztRQUNELGtGQUFrRjtRQUNsRixJQUFLLDJCQUEyQixHQUFHLENBQUMsSUFBSSxDQUFDLEVBQ3pDO1lBQ0ksYUFBYSxHQUFHLE9BQU8sQ0FBRSxhQUFhLENBQUUsQ0FBQztTQUM1QztRQUVELDJEQUEyRDtRQUMzRCxLQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksV0FBVyxFQUFFLENBQUMsRUFBRSxFQUN0QztZQUNJLElBQUksWUFBWSxHQUFHLFNBQVMsQ0FBQztZQUM3QixJQUFLLENBQUMsR0FBRyxTQUFTLEVBQ2xCO2dCQUNJLFlBQVksR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFFLFFBQVEsRUFBRSxnQkFBZ0IsRUFBRSxtQkFBbUIsR0FBRyxDQUFDLENBQUUsQ0FBQztnQkFDcEYsWUFBWSxDQUFDLGtCQUFrQixDQUFFLDhCQUE4QixDQUFFLENBQUM7Z0JBQ2xFLFlBQVksQ0FBQyxRQUFRLENBQUUsd0JBQXdCLENBQUUsQ0FBQzthQUNyRDtpQkFFRDtnQkFDSSxZQUFZLEdBQUcsZ0JBQWdCLENBQUMsUUFBUSxDQUFFLENBQUMsR0FBQyxDQUFDLENBQUUsQ0FBQzthQUNuRDtZQUVELElBQUksVUFBVSxHQUFHLFlBQVksQ0FBQyxpQkFBaUIsQ0FBRSxvQ0FBb0MsQ0FBRSxDQUFDO1lBQ3hGLElBQUksZUFBZSxHQUFHLFlBQVksQ0FBQyxpQkFBaUIsQ0FBRSx3QkFBd0IsQ0FBQyxDQUFDO1lBRWhGLElBQUssQ0FBQyxHQUFHLFNBQVMsRUFDbEI7Z0JBQ0ksSUFBSSxNQUFNLEdBQUcsVUFBVSxDQUFDLFFBQVEsQ0FBRSxDQUFDLENBQUUsQ0FBQyxRQUFRLENBQUUsQ0FBQyxDQUFFLENBQUM7Z0JBQ3BEO29CQUNJLE1BQU0sQ0FBQyxRQUFRLENBQUUscUJBQXFCLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQztpQkFDakQ7YUFFSjtpQkFFRDtnQkFDSSxVQUFVLENBQUMsV0FBVyxDQUFFLE1BQU0sQ0FBRSxDQUFDO2FBQ3BDO1lBQ0QsSUFBSSxRQUFRLEdBQUcsVUFBVSxDQUFDLFFBQVEsQ0FBRSxDQUFDLENBQUUsQ0FBQyxRQUFRLENBQUUsQ0FBQyxDQUFFLENBQUM7WUFDdEQsSUFBSSxlQUFlLEdBQUcsVUFBVSxDQUFDLFFBQVEsQ0FBRSxDQUFDLENBQUUsQ0FBQztZQUMvQyxJQUFJLFNBQVMsR0FBRyxVQUFVLENBQUMsUUFBUSxDQUFFLENBQUMsQ0FBRSxDQUFDLFFBQVEsQ0FBRSxDQUFDLENBQUUsQ0FBQztZQUN2RCxJQUFLLENBQUMsR0FBRyxZQUFZLEVBQ3JCO2dCQUNJLGVBQWUsQ0FBQyxXQUFXLENBQUUsYUFBYSxDQUFFLENBQUE7Z0JBQzVDLGVBQWUsQ0FBQyxXQUFXLENBQUUsb0JBQW9CLENBQUUsQ0FBQTtnQkFDbkQsUUFBUSxDQUFDLFFBQVEsQ0FBRSw2QkFBNkIsQ0FBRSxDQUFDO2dCQUNuRCxTQUFTLENBQUMsUUFBUSxDQUFFLDZCQUE2QixDQUFFLENBQUM7Z0JBQ3BELGVBQWUsQ0FBQyxRQUFRLENBQUUsTUFBTSxDQUFFLENBQUM7Z0JBQ25DLFlBQVksQ0FBQyxRQUFRLENBQUUsVUFBVSxDQUFFLENBQUM7YUFDdkM7aUJBRUQ7Z0JBQ0kseUJBQXlCLENBQUUsYUFBYSxDQUFFLENBQUE7Z0JBQzFDLGVBQWUsQ0FBQyxXQUFXLENBQUUsTUFBTSxDQUFFLENBQUM7Z0JBRXRDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBQyxDQUFDLENBQUM7Z0JBRVosSUFBSSxZQUFZLEdBQUcsWUFBWSxDQUFDLGlCQUFpQixDQUFFLGFBQWEsQ0FBRSxDQUFDO2dCQUNuRSxnQ0FBZ0M7Z0JBQ2hDLElBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFDakI7b0JBQ0ksWUFBWSxDQUFDLFdBQVcsQ0FBRSxNQUFNLENBQUUsQ0FBQztvQkFDbkMsWUFBWSxDQUFDLFdBQVcsQ0FBRSxXQUFXLEdBQUcsS0FBSyxDQUFFLE9BQU8sQ0FBRSxhQUFhLENBQUUsQ0FBRSxDQUFFLENBQUM7b0JBQzVFLFlBQVksQ0FBQyxRQUFRLENBQUUsV0FBVyxHQUFHLEtBQUssQ0FBRSxhQUFhLENBQUUsQ0FBRSxDQUFDO2lCQUNqRTtxQkFFRDtvQkFDSSxZQUFZLENBQUMsUUFBUSxDQUFFLE1BQU0sQ0FBRSxDQUFDO2lCQUNuQztnQkFFRCxxQkFBcUI7Z0JBQ3JCLElBQUksTUFBTSxHQUFHLFFBQVEsQ0FBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQztnQkFDbEMsSUFBSSxVQUFVLEdBQUcsUUFBUSxDQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDO2dCQUUxQyxJQUFJLHFCQUFxQixHQUFHLFlBQVksQ0FBQyxpQkFBaUIsQ0FBRSx3QkFBd0IsQ0FBRSxDQUFDO2dCQUN2RixLQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUMzQjtvQkFDSSxJQUFJLEtBQUssR0FBRyxxQkFBcUIsQ0FBQyxpQkFBaUIsQ0FBRSx5QkFBeUIsR0FBRyxDQUFDLENBQUUsQ0FBQztvQkFDckYsSUFBSSxLQUFLLEdBQUcscUJBQXFCLENBQUMsaUJBQWlCLENBQUUsbUNBQW1DLEdBQUcsQ0FBQyxDQUFFLENBQUM7b0JBQy9GLElBQUssQ0FBQyxJQUFJLENBQUUsTUFBTSxDQUFFLEVBQ3BCO3dCQUNJLEtBQUssQ0FBQyxRQUFRLENBQUUsTUFBTSxDQUFFLENBQUM7d0JBQ3pCLEtBQUssQ0FBQyxRQUFRLENBQUUsTUFBTSxDQUFFLENBQUM7cUJBQzVCO3lCQUNJLElBQUssQ0FBQyxJQUFJLFVBQVUsRUFDekI7d0JBQ0ksS0FBSyxDQUFDLFdBQVcsQ0FBRSxNQUFNLENBQUUsQ0FBQzt3QkFDNUIsS0FBSyxDQUFDLFFBQVEsQ0FBRSxNQUFNLENBQUUsQ0FBQztxQkFDNUI7eUJBRUQ7d0JBQ0ksS0FBSyxDQUFDLFFBQVEsQ0FBRSxNQUFNLENBQUUsQ0FBQzt3QkFDekIsS0FBSyxDQUFDLFdBQVcsQ0FBRSxNQUFNLENBQUUsQ0FBQztxQkFDL0I7aUJBQ0o7Z0JBRUQsUUFBUTtnQkFDUixJQUFJLFdBQVcsR0FBRyxlQUFlLENBQUMsaUJBQWlCLENBQUUseUJBQXlCLENBQUUsQ0FBQztnQkFDakYsSUFBSyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUNuQjtvQkFDSSxXQUFXLENBQUMsV0FBVyxDQUFFLE1BQU0sQ0FBRSxDQUFDO2lCQUNyQztxQkFFRDtvQkFDSSxXQUFXLENBQUMsUUFBUSxDQUFFLE1BQU0sQ0FBRSxDQUFDO2lCQUNsQztnQkFFRCxJQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQ3RCO29CQUNJLFFBQVEsQ0FBQyxXQUFXLENBQUUsNkJBQTZCLENBQUUsQ0FBQztvQkFDdEQsU0FBUyxDQUFDLFFBQVEsQ0FBRSw2QkFBNkIsQ0FBRSxDQUFDO2lCQUN2RDtxQkFFRDtvQkFDSSxRQUFRLENBQUMsUUFBUSxDQUFFLDZCQUE2QixDQUFFLENBQUM7b0JBQ25ELFNBQVMsQ0FBQyxXQUFXLENBQUUsNkJBQTZCLENBQUUsQ0FBQztpQkFDMUQ7Z0JBQ0QsUUFBUSxDQUFDLFdBQVcsQ0FBRSxXQUFXLEdBQUcsS0FBSyxDQUFFLE9BQU8sQ0FBRSxhQUFhLENBQUUsQ0FBRSxDQUFFLENBQUM7Z0JBQ3hFLFFBQVEsQ0FBQyxRQUFRLENBQUUsV0FBVyxHQUFHLEtBQUssQ0FBRSxhQUFhLENBQUUsQ0FBRSxDQUFDO2dCQUMxRCxlQUFlLENBQUMsV0FBVyxDQUFFLFdBQVcsR0FBRyxLQUFLLENBQUUsT0FBTyxDQUFFLGFBQWEsQ0FBRSxDQUFFLENBQUUsQ0FBQztnQkFDL0UsZUFBZSxDQUFDLFFBQVEsQ0FBRSxXQUFXLEdBQUcsS0FBSyxDQUFFLGFBQWEsQ0FBRSxDQUFFLENBQUM7Z0JBQ2pFLHFCQUFxQixDQUFDLFdBQVcsQ0FBRSxXQUFXLEdBQUcsS0FBSyxDQUFFLE9BQU8sQ0FBRSxhQUFhLENBQUUsQ0FBRSxDQUFFLENBQUM7Z0JBQ3JGLHFCQUFxQixDQUFDLFFBQVEsQ0FBRSxXQUFXLEdBQUcsS0FBSyxDQUFFLGFBQWEsQ0FBRSxDQUFFLENBQUM7YUFDMUU7WUFDRCxJQUFLLENBQUUsQ0FBQyxJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUUsSUFBSSxDQUFFLENBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBRSxJQUFJLENBQUUsQ0FBRSxDQUFFLENBQUMsR0FBRyxTQUFTLENBQUUsR0FBRyxDQUFDLENBQUUsSUFBSSxDQUFDLENBQUUsQ0FBRSxFQUMxRjtnQkFDSSxhQUFhLEdBQUcsT0FBTyxDQUFFLGFBQWEsQ0FBRSxDQUFDO2FBQzVDO1NBQ0o7UUFFRCxrQkFBa0I7UUFDbEIsYUFBYSxDQUFDLHFCQUFxQixDQUFFLGdDQUFnQyxDQUFFLENBQUM7UUFDeEUsWUFBWSxDQUFDLHVCQUF1QixFQUFFLENBQUM7UUFFdkMsS0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLFdBQVcsRUFBRSxDQUFDLEVBQUUsRUFDdEM7WUFDSSxJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUUsU0FBUyxHQUFHLENBQUMsQ0FBRSxDQUFDO1lBQ25FLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBRSxjQUFjLENBQUUsQ0FBQztZQUU1QyxJQUFJLGVBQWUsR0FBRyxnQkFBZ0IsQ0FBRSxDQUFDLENBQUUsQ0FBQztZQUM1QyxNQUFNLENBQUMsaUJBQWlCLENBQUUsR0FBRyxFQUFFLGVBQWUsQ0FBQyxRQUFRLEVBQUUsQ0FBRSxDQUFDO1lBQzVELE1BQU0sQ0FBQyxXQUFXLENBQUUsOEJBQThCLEVBQUUsZUFBZSxLQUFLLElBQUksQ0FBRSxDQUFDO1NBQ2xGO0lBSVIsQ0FBQztJQUVELFNBQVMsZUFBZSxDQUFFLElBQVc7UUFFcEMsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxxQkFBcUIsRUFBRSw0QkFBNEIsRUFBRSxPQUFPLENBQUUsQ0FBQztRQUNoRixJQUFJLHVCQUF1QixHQUFHLFlBQVksQ0FBQyxpREFBaUQsQ0FDM0YsWUFBWSxHQUFHLElBQUksRUFDbkIsRUFBRSxFQUNGLHFFQUFxRSxFQUNyRSxPQUFPLEdBQUMsSUFBSSxFQUNaLGNBQVcsQ0FBQyxDQUNaLENBQUE7UUFFRCx1QkFBdUIsQ0FBQyxRQUFRLENBQUUscUJBQXFCLENBQUUsQ0FBQztJQUMzRCxDQUFDO0lBRUUsU0FBUyxlQUFlLENBQUUsYUFBcUI7UUFHM0MsSUFBSSxZQUFZLEdBQUcsYUFBYSxDQUFDLHFCQUFxQixDQUFFLFlBQVksQ0FBRSxDQUFDO1FBQ3ZFLFlBQVksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBQzVCLGlCQUFpQixDQUFFLEtBQUssRUFBRSxhQUFhLENBQUUsQ0FBQyxDQUFDLDBCQUEwQjtRQUNyRSxnQkFBZ0IsQ0FBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLGFBQWEsQ0FBRSxDQUFDLENBQUMsMEJBQTBCO1FBRXhFLCtHQUErRztRQUMvRyxJQUFJLHFCQUFxQixHQUFHLFlBQVksQ0FBQyx3QkFBd0IsQ0FBRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBRSxDQUFDO1FBQ3JHLElBQUssYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLFdBQVcsRUFDckM7WUFDSSxJQUFLLHFCQUFxQixJQUFJLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxvQkFBb0IsRUFDdkU7Z0JBQ0ksYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7YUFDNUM7U0FDSjtRQUNELGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxvQkFBb0IsR0FBRyxxQkFBcUIsQ0FBQztRQUVsRSxTQUFTLG9CQUFvQixDQUFFLE1BQWE7WUFFeEMsSUFBSSxNQUFNLEdBQUcsYUFBYSxDQUFDLHFCQUFxQixDQUFFLGdCQUFnQixHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBRSxDQUFDO1lBQ3JGLElBQUksa0JBQWtCLEdBQUcsYUFBYSxDQUFDLHFCQUFxQixDQUFFLDJCQUEyQixHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBYSxDQUFDO1lBQ3ZILElBQUssYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLFlBQVksRUFDdEM7Z0JBQ1IsSUFBSSxHQUFHLEdBQUcsWUFBWSxDQUFDLHlCQUF5QixDQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFFLENBQUM7Z0JBQ3pGLElBQUssQ0FBQyxHQUFHLEVBQ1Q7b0JBQ0MsR0FBRyxHQUFHLEVBQUUsQ0FBQztpQkFDVDtnQkFDVyxrQkFBa0IsQ0FBQyxRQUFRLENBQUUsb0NBQW9DLEdBQUcsR0FBRyxDQUFDLFdBQVcsRUFBRSxHQUFHLE1BQU0sQ0FBRSxDQUFDO2dCQUNqRyxrQkFBa0IsQ0FBQyxRQUFRLENBQUUsK0JBQStCLENBQUUsQ0FBQztnQkFDL0QsYUFBYSxDQUFDLGlCQUFpQixDQUFFLGdCQUFnQixHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxZQUFZLENBQUMsMEJBQTBCLENBQUUsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUUsQ0FBRSxDQUFDO2FBQ3hKO2lCQUVEO2dCQUNJLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBRSxnQkFBZ0IsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxZQUFZLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFFLENBQUUsQ0FBQzthQUNuSDtZQUNELGFBQWEsQ0FBQyxpQkFBaUIsQ0FBRSxRQUFRLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLHlCQUF5QixDQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFFLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBRSxDQUFDO1lBQ3pKLEtBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQ2xDO2dCQUNJLElBQUksV0FBVyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUUsQ0FBQyxDQUFFLENBQUM7Z0JBQ3ZDLElBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxFQUN0QztvQkFDSSxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsVUFBVSxHQUFHLFlBQVksQ0FBQyxnQ0FBZ0MsQ0FBRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUUsQ0FBQztpQkFDNUg7Z0JBQ0QsSUFBSSxVQUFVLEdBQUcsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLFVBQVUsQ0FBQztnQkFDL0MsSUFBSSxZQUFZLEdBQUcsV0FBVyxDQUFDLGlCQUFpQixDQUFFLGFBQWEsQ0FBWSxDQUFDO2dCQUN4RixJQUFJLGFBQWEsR0FBRyxXQUFXLENBQUMsaUJBQWlCLENBQUUsUUFBUSxDQUF1QixDQUFDO2dCQUNuRixJQUFJLGdCQUFnQixHQUFHLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBRSxnQkFBZ0IsQ0FBYSxDQUFDO2dCQUN4RSxJQUFLLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLFdBQVcsRUFDdEM7b0JBQ0ksWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sR0FBRyxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFDO29CQUMzRCxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztvQkFDM0QsYUFBYSxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsZUFBZSxDQUFDLElBQUksQ0FBRSxTQUFTLEVBQUUsVUFBVSxDQUFFLENBQUUsQ0FBQztvQkFDM0YsZ0JBQWdCLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxlQUFlLENBQUMsSUFBSSxDQUFFLFNBQVMsRUFBRSxVQUFVLENBQUUsQ0FBRSxDQUFDO2lCQUNsRjtnQkFDRCxJQUFLLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxpQkFBaUIsSUFBSSxTQUFTLEVBQ3ZEO29CQUNJLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxpQkFBaUIsR0FBRyxDQUFDLENBQUMseUJBQXlCLENBQUUsMkNBQTJDLEVBQUUsV0FBVyxDQUFDLElBQUksQ0FBRSxTQUFTLEVBQUUsYUFBYSxFQUFFLFlBQVksQ0FBRSxDQUFFLENBQUM7aUJBQ2xMO2dCQUNELFdBQVcsQ0FBRSxhQUFhLEVBQUUsWUFBWSxDQUFFLENBQUM7Z0JBRzNDLElBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxFQUN0QztvQkFDWCxJQUFJLEdBQUcsR0FBRyxZQUFZLENBQUMseUJBQXlCLENBQUUsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUUsQ0FBQztvQkFDekYsSUFBSyxDQUFDLEdBQUcsRUFDVDt3QkFDQyxHQUFHLEdBQUcsRUFBRSxDQUFDO3FCQUNUO29CQUVELGFBQWEsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsWUFBWSxDQUFDO29CQUMzRCxnQkFBZ0IsQ0FBQyxPQUFPLEdBQUcsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLFlBQVksQ0FBQztvQkFDN0QsSUFBSyxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsWUFBWSxFQUN0Qzt3QkFDQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUUsb0NBQW9DLEdBQUcsR0FBRyxDQUFDLFdBQVcsRUFBRSxHQUFHLE1BQU0sQ0FBRSxDQUFDO3FCQUMvRjt5QkFDbUIsSUFBSyxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxLQUFLLFVBQVUsRUFDckQ7d0JBQ0ksYUFBYSxDQUFDLG1CQUFtQixDQUFDLFVBQVUsQ0FBQyxDQUFDO3dCQUM5QyxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxHQUFHLFVBQVUsQ0FBQztxQkFDN0M7aUJBQ0o7Z0JBRUQsS0FBTSxJQUFJLENBQUMsSUFBSSxXQUFXLEVBQzFCO29CQUNJLElBQUksTUFBTSxHQUFHLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBRSxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQWEsQ0FBQztvQkFDeEUsSUFBSSxVQUFVLEdBQVUsWUFBWSxDQUFDLGtCQUFrQixDQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDO29CQUNwSCxNQUFNLENBQUMsSUFBSSxHQUFHLFVBQVUsQ0FBQztvQkFDekIsSUFBSyxXQUFXLENBQUMsQ0FBQyxDQUFDLEtBQUssTUFBTSxFQUM5Qjt3QkFDSSxJQUFLLFVBQVUsSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLEVBQ3JDOzRCQUNJLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBRSxhQUFhLENBQUUsQ0FBQyxRQUFRLENBQUUsV0FBVyxDQUFFLENBQUM7eUJBQzFFOzZCQUVEOzRCQUNJLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBRSxhQUFhLENBQUUsQ0FBQyxXQUFXLENBQUUsV0FBVyxDQUFFLENBQUM7eUJBQzdFO3FCQUNKO2lCQUNKO2FBQ0o7UUFDTCxDQUFDO1FBRUQsb0JBQW9CLENBQUUsQ0FBQyxDQUFFLENBQUM7UUFDMUIsb0JBQW9CLENBQUUsQ0FBQyxDQUFFLENBQUM7UUFDMUIsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7UUFFeEMsSUFBSSxXQUFXLEdBQUcsWUFBWSxDQUFDLFlBQVksQ0FBRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFFLENBQUM7UUFDNUUsSUFBSSxVQUFVLEdBQUcsWUFBWSxDQUFDLFdBQVcsQ0FBRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFFLENBQUM7UUFDMUUsSUFBSSxlQUFlLEdBQUcsWUFBWSxDQUFDO1FBQ25DLElBQUksT0FBTyxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUUsZUFBZSxHQUFHLFVBQVUsQ0FBRSxDQUFDO1FBQ3pELElBQUssT0FBTyxLQUFLLGVBQWUsR0FBRyxVQUFVO1lBQUcsT0FBTyxHQUFHLFVBQVUsQ0FBQztRQUNyRSxhQUFhLENBQUMsaUJBQWlCLENBQUUsVUFBVSxFQUFFLE9BQU8sQ0FBRSxDQUFDO1FBRXZELEVBQUU7UUFDRixXQUFXO1FBQ1gsRUFBRTtRQUNGLElBQUksY0FBYyxHQUFHLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBRSxnQkFBZ0IsQ0FBYSxDQUFDO1FBRXBGLElBQUksa0JBQWtCLEdBQUcsVUFBVyxPQUFlO1lBRS9DLE9BQU8sQ0FBQyxRQUFRLENBQUUsNkNBQTZDLENBQUUsQ0FBQztRQUN0RSxDQUFDLENBQUE7UUFFRCxJQUFLLGNBQWMsRUFDbkI7WUFDSSxDQUFDLENBQUMsb0JBQW9CLENBQUUsaUJBQWlCLEVBQUUsY0FBYyxFQUFFLGtCQUFrQixDQUFDLElBQUksQ0FBRSxTQUFTLEVBQUUsY0FBYyxDQUFFLENBQUUsQ0FBQztZQUNsSCxjQUFjLENBQUMsUUFBUSxDQUFFLHFDQUFxQyxHQUFDLFVBQVUsR0FBQyxNQUFNLENBQUUsQ0FBQztTQUN0RjtRQUVELEVBQUU7UUFDRixZQUFZO1FBQ1osRUFBRTtRQUNGLElBQUksZUFBZSxHQUFHLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBRSxpQkFBaUIsQ0FBYSxDQUFDO1FBRXRGLElBQUksbUJBQW1CLEdBQUcsVUFBVyxPQUFnQjtZQUVqRCxPQUFPLENBQUMsUUFBUSxDQUFFLDJDQUEyQyxDQUFFLENBQUM7UUFDcEUsQ0FBQyxDQUFBO1FBRUQsSUFBSyxlQUFlLEVBQ3BCO1lBQ0ksQ0FBQyxDQUFDLG9CQUFvQixDQUFFLGlCQUFpQixFQUFFLGVBQWUsRUFBRSxtQkFBbUIsQ0FBQyxJQUFJLENBQUUsU0FBUyxFQUFFLGVBQWUsQ0FBRSxDQUFFLENBQUM7WUFDckgsZUFBZSxDQUFDLFFBQVEsQ0FBRSwyQkFBMkIsR0FBRyxXQUFXLEdBQUcsTUFBTSxDQUFFLENBQUM7U0FDbEY7UUFFRCxFQUFFO1FBQ0Ysd0JBQXdCO1FBQ3hCLEVBQUU7UUFDRixJQUFJLGFBQWEsR0FBRyxZQUFZLENBQUMsZ0JBQWdCLENBQUUsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBRSxDQUFDO1FBQ2xGLGFBQWEsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUUsYUFBYSxHQUFHLEVBQUUsQ0FBRSxFQUFFLENBQUMsQ0FBRSxDQUFDO1FBQ2hFLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDLGVBQWUsQ0FBRSxzQkFBc0IsRUFBRSxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsQ0FBRSxDQUFFLENBQUM7UUFFckgsSUFBSyxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsbUJBQW1CLEtBQUssTUFBTSxFQUN4RDtZQUNJLElBQUksS0FBSyxHQUFHLENBQUMsR0FBRyxZQUFZLENBQUMseUJBQXlCLENBQUUsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUUsR0FBRyxZQUFZLENBQUMseUJBQXlCLENBQUUsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUUsQ0FBQztZQUMvSyxJQUFJLHNCQUFzQixHQUFHLHNCQUFzQixDQUFDO1lBQ3BELElBQUssS0FBSyxHQUFHLEVBQUUsRUFDTjtnQkFDSSxzQkFBc0IsR0FBRyxxQkFBcUIsQ0FBQzthQUNsRDtpQkFDSSxJQUFLLEtBQUssR0FBRyxFQUFFLEVBQ3BCO2dCQUNJLHNCQUFzQixHQUFHLHVCQUF1QixDQUFDO2FBQ3BEO1lBQ0QsYUFBYSxDQUFDLGlCQUFpQixDQUFFLGFBQWEsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFFLHNCQUFzQixDQUFFLENBQUUsQ0FBQztZQUN2RixhQUFhLENBQUMsaUJBQWlCLENBQUUsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxvQkFBb0IsQ0FBRSxDQUFFLENBQUM7WUFDMUYsYUFBYSxDQUFDLGlCQUFpQixDQUFFLGVBQWUsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFFLG9CQUFvQixDQUFFLENBQUUsQ0FBQztTQUMxRjthQUVEO1lBQ0ksYUFBYSxDQUFDLGlCQUFpQixDQUFFLGFBQWEsRUFBRSxZQUFZLENBQUMsTUFBTSxDQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBRSw2QkFBNkIsQ0FBRSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUUsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBRSxDQUFFLENBQUM7WUFDck4sYUFBYSxDQUFDLGlCQUFpQixDQUFFLGtCQUFrQixFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUUsb0JBQW9CLENBQUUsQ0FBRSxDQUFDO1lBQzFGLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBRSxlQUFlLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxvQkFBb0IsQ0FBRSxDQUFFLENBQUM7U0FDMUY7SUFDTCxDQUFDO0lBRUQsU0FBUyw0QkFBNEIsQ0FBRSxhQUFxQjtRQUV4RCxlQUFlLENBQUUsQ0FBQyxDQUFFLENBQUM7UUFDckIsZUFBZSxDQUFFLENBQUMsQ0FBRSxDQUFDO1FBRXJCLFNBQVMsZUFBZSxDQUFFLEtBQVk7WUFFbEMsSUFBSSxHQUFHLEdBQUcsWUFBWSxDQUFDLHlCQUF5QixDQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFFLENBQUM7WUFDeEYsSUFBSyxHQUFHLEVBQ1I7Z0JBQ0ksSUFBSSxXQUFXLEdBQUUsb0NBQW9DLEdBQUcsR0FBRyxDQUFDLFdBQVcsRUFBRSxHQUFHLE1BQU0sQ0FBQztnQkFDbkYsSUFBSSxHQUFHLEdBQUcsYUFBYSxDQUFDLGlCQUFpQixDQUFFLFlBQVksR0FBRyxLQUFLLENBQWEsQ0FBQztnQkFDN0UsR0FBRyxDQUFDLFFBQVEsQ0FBRSxXQUFXLENBQUUsQ0FBQzthQUMvQjtZQUVELGFBQWEsQ0FBQyxpQkFBaUIsQ0FBRSxVQUFVLEdBQUcsS0FBSyxFQUFFLFlBQVksQ0FBQywwQkFBMEIsQ0FBRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBRSxDQUFFLENBQUM7WUFDdEksYUFBYSxDQUFDLGlCQUFpQixDQUFFLE9BQU8sR0FBRyxLQUFLLEVBQUUsQ0FBQyxZQUFZLENBQUMseUJBQXlCLENBQUUsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUUsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFFLENBQUM7UUFDbkosQ0FBQztRQUVELElBQUksVUFBVSxHQUFHLFlBQVksQ0FBQyxXQUFXLENBQUUsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBRSxDQUFDO1FBQzFFLElBQUksZUFBZSxHQUFHLFlBQVksQ0FBQztRQUNuQyxJQUFJLE9BQU8sR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFFLGVBQWUsR0FBRyxVQUFVLENBQUUsQ0FBQztRQUN6RCxJQUFLLE9BQU8sS0FBSyxlQUFlLEdBQUcsVUFBVTtZQUFHLE9BQU8sR0FBRyxVQUFVLENBQUM7UUFDckUsYUFBYSxDQUFDLGlCQUFpQixDQUFFLFNBQVMsRUFBRSxPQUFPLENBQUUsQ0FBQztRQUN0RCxJQUFJLGNBQWMsR0FBRyxhQUFhLENBQUMsaUJBQWlCLENBQUUsV0FBVyxDQUFhLENBQUM7UUFDL0UsSUFBSyxjQUFjLEVBQ25CO1lBQ0ksY0FBYyxDQUFDLFFBQVEsQ0FBRSxxQ0FBcUMsR0FBQyxVQUFVLEdBQUMsTUFBTSxDQUFFLENBQUM7U0FDdEY7UUFFRCxJQUFJLGdCQUFnQixHQUFHLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBRSxpQkFBaUIsQ0FBYSxDQUFDO1FBQ3ZGLGdCQUFnQixDQUFDLFFBQVEsQ0FBRSxxREFBcUQsR0FBRyxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsZUFBZSxHQUFHLE1BQU0sQ0FBRSxDQUFDO1FBRW5JLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBRSxpQkFBaUIsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFFLFlBQVksQ0FBQywyQkFBMkIsQ0FBRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFFLENBQUUsQ0FBRSxDQUFDO1FBQzdJLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBRSxZQUFZLEVBQUUsWUFBWSxDQUFDLE1BQU0sQ0FBRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUUsNkJBQTZCLENBQUUsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLENBQUUsQ0FBRSxDQUFDO0lBQ3hOLENBQUM7SUFFRCxTQUFnQixJQUFJLENBQUUsYUFBcUI7UUFFdkMsaUJBQWlCLENBQUUsSUFBSSxFQUFFLGFBQWEsQ0FBRSxDQUFDLENBQUMsMEJBQTBCO1FBQ3BFLGdCQUFnQixDQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsYUFBYSxDQUFFLENBQUMsQ0FBQywwQkFBMEI7UUFFeEUsSUFBSSxtQkFBbUIsR0FBRyxZQUFZLENBQUMsMEJBQTBCLENBQUUsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBRSxDQUFDO1FBQ2xHLGFBQWEsQ0FBQyxXQUFXLENBQUUsb0JBQW9CLEVBQUUsbUJBQW1CLENBQUUsQ0FBQztRQUN2RSxJQUFLLG1CQUFtQixFQUN4QjtZQUNJLElBQUksZUFBZSxHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUUsT0FBTyxFQUFFLGFBQWEsRUFBRSxvQkFBb0IsQ0FBRSxDQUFDO1lBQ3BGLGVBQWUsQ0FBQyxrQkFBa0IsQ0FBRSx1Q0FBdUMsQ0FBQyxDQUFDO1NBQ2hGO1FBRUQsSUFBSSxNQUFNLEdBQUcsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBRXBDLFNBQVMsdUJBQXVCLENBQUUsTUFBYTtZQUUzQyxJQUFJLGVBQWUsR0FBRyxTQUFTLENBQUM7WUFDaEMsSUFBSSxNQUFNLEdBQUcsYUFBYSxDQUFDLHFCQUFxQixDQUFFLGdCQUFnQixHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBRSxDQUFDO1lBQ3JGLEtBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQ2xDO2dCQUNJLElBQUksVUFBVSxHQUFHLFlBQVksQ0FBQyxnQ0FBZ0MsQ0FBRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUUsQ0FBQztnQkFDMUcsSUFBSSxXQUFXLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLFlBQVksR0FBRyxVQUFVLENBQUMsQ0FBQztnQkFDNUUsSUFBSyxDQUFDLFVBQVUsRUFDaEI7b0JBQ0ksTUFBTSxDQUFDLFFBQVEsQ0FBRSxpQkFBaUIsQ0FBRSxDQUFDO2lCQUN4QztnQkFDRCxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztnQkFDM0MsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7Z0JBQ25DLElBQUssYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLG1CQUFtQixJQUFJLE1BQU0sRUFDdkQ7b0JBQ0ksV0FBVyxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsZUFBZSxDQUFDLElBQUksQ0FBRSxTQUFTLEVBQUUsYUFBYSxFQUFFLFdBQVcsQ0FBRSxDQUFFLENBQUM7b0JBQ3pHLElBQUssQ0FBRSxDQUFFLENBQUMsSUFBSSxDQUFDLENBQUUsSUFBSSxDQUFFLE1BQU0sSUFBSSxDQUFDLENBQUUsQ0FBRSxJQUFJLENBQUUsTUFBTSxLQUFLLFVBQVUsQ0FBRSxFQUNuRTt3QkFDSSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsZUFBZSxHQUFHLFdBQVcsQ0FBQztxQkFDdEQ7aUJBQ0o7Z0JBQ0QsV0FBVyxDQUFDLGtCQUFrQixDQUFFLHVDQUF1QyxDQUFFLENBQUM7Z0JBQzFFLElBQUksYUFBYSxHQUFHLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBRSxRQUFRLENBQUUsQ0FBQztnQkFDMUUsYUFBYSxDQUFDLFFBQVEsQ0FBRSx3QkFBd0IsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUUsQ0FBQztnQkFFbkUsSUFBSSxpQkFBaUIsR0FBRyxXQUFXLENBQUMsaUJBQWlCLENBQUUsYUFBYSxDQUFFLENBQUM7Z0JBQ3ZFLGlCQUFpQixDQUFDLFFBQVEsQ0FBRSxXQUFXLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFFLENBQUM7Z0JBQzFELGlCQUFpQixDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQzVDLFVBQVUsYUFBcUIsRUFBRSxXQUFtQixFQUFFLFVBQWlCO29CQUV0RSxJQUFLLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxtQkFBbUIsSUFBSSxNQUFNO3dCQUN0RCxlQUFlLENBQUUsYUFBYSxFQUFFLFdBQVcsQ0FBRSxDQUFDO29CQUMvQyxlQUFlLENBQUUsVUFBVSxDQUFFLENBQUM7Z0JBQy9CLENBQUM7cUJBQ0EsSUFBSSxDQUFFLFNBQVMsRUFBRSxhQUFhLEVBQUUsV0FBVyxFQUFFLFVBQVUsQ0FBRSxDQUFFLENBQUM7Z0JBRWxELElBQUksZ0JBQWdCLEdBQUcsV0FBVyxDQUFDLGlCQUFpQixDQUFFLGlCQUFpQixDQUFFLENBQUM7Z0JBRTFFLEtBQU0sSUFBSSxDQUFDLElBQUksV0FBVyxFQUMxQjtvQkFDSSxJQUFJLE1BQU0sQ0FBQztvQkFDWCxJQUFLLFdBQVcsQ0FBQyxDQUFDLENBQUMsS0FBSSxNQUFNLEVBQzdCO3dCQUNJLElBQUksV0FBVyxHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUUsT0FBTyxFQUFFLGdCQUFnQixFQUFFLGFBQWEsQ0FBRSxDQUFDO3dCQUM1RSxJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsYUFBYSxDQUFFLENBQUM7d0JBQ2xFLE1BQU0sQ0FBQyxRQUFRLENBQUUsbUNBQW1DLENBQUUsQ0FBQzt3QkFDekUsc0RBQXNEO3dCQUNwQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDO3dCQUMvRCxNQUFNLENBQUMsUUFBUSxDQUFFLHlCQUF5QixDQUFFLENBQUM7d0JBQzdDLFdBQVcsQ0FBQyxRQUFRLENBQUUsY0FBYyxDQUFFLENBQUM7d0JBQ3ZDLFdBQVcsQ0FBQyxRQUFRLENBQUUsb0JBQW9CLENBQUUsQ0FBQzt3QkFDN0MsTUFBTSxDQUFDLFFBQVEsQ0FBRSwwQkFBMEIsQ0FBRSxDQUFDO3dCQUNoRSxNQUFNLENBQUMsUUFBUSxDQUFFLDJCQUEyQixDQUFHLENBQUM7d0JBQ2hELE1BQU0sR0FBRyxXQUFXLENBQUMsQ0FBQyxrREFBa0Q7cUJBQ3pEO3lCQUVEO3dCQUNJLE1BQU0sR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFFLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxFQUFFLENBQUUsQ0FBQzt3QkFDeEQsTUFBTSxDQUFDLFFBQVEsQ0FBRSxjQUFjLENBQUUsQ0FBQzt3QkFDbEMsTUFBTSxDQUFDLFFBQVEsQ0FBRSxnQkFBZ0IsR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQzt3QkFDckQsTUFBTSxHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQztxQkFDNUU7b0JBRUQsTUFBTSxDQUFDLFFBQVEsQ0FBRSxXQUFXLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFFLENBQUM7aUJBQ25DO2FBQ0o7UUFDTCxDQUFDO1FBRUQsdUJBQXVCLENBQUUsQ0FBQyxDQUFFLENBQUM7UUFDN0IsdUJBQXVCLENBQUUsQ0FBQyxDQUFFLENBQUM7UUFFN0IsSUFBSSxjQUFjLEdBQUcsWUFBWSxDQUFDLHNCQUFzQixDQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLENBQUUsQ0FBQztRQUN6RixhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsWUFBWSxHQUFHLENBQUUsQ0FBRSxjQUFjLElBQUksRUFBRSxDQUFFLElBQUksQ0FBRSxjQUFjLElBQUksU0FBUyxDQUFFLENBQUUsQ0FBQztRQUNwRyxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsZUFBZSxHQUFHLFlBQVksQ0FBQyxrQkFBa0IsQ0FBRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBRSxDQUFDO1FBRS9HLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxrQkFBa0IsR0FBRyxTQUFTLENBQUM7UUFDcEQsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLHNCQUFzQixHQUFHLFNBQVMsQ0FBQztRQUN4RCxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztRQUN6QyxJQUFJLGNBQWMsR0FBRyxhQUFhLENBQUMscUJBQXFCLENBQUUsMkJBQTJCLENBQUUsQ0FBQTtRQUN2RixLQUFNLElBQUksQ0FBQyxJQUFJLFdBQVcsRUFDMUI7WUFDSSxJQUFJLGdCQUFnQixHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUUsT0FBTyxFQUFFLGNBQWMsRUFBRSxFQUFFLENBQUUsQ0FBQztZQUNwRSxnQkFBZ0IsQ0FBQyxRQUFRLENBQUUsY0FBYyxDQUFFLENBQUM7WUFDckQsZ0JBQWdCLENBQUMsUUFBUSxDQUFFLGdCQUFnQixHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDO1lBQy9ELGdCQUFnQixDQUFDLFFBQVEsQ0FBRSx1Q0FBdUMsQ0FBRSxDQUFDO1lBQzVELElBQUksV0FBVyxHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUUsT0FBTyxFQUFFLGdCQUFnQixFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDO1lBQzdFLFdBQVcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxjQUFjLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBRSxDQUFDO1NBQ2hGO1FBRUQsQ0FBQyxDQUFDLG9CQUFvQixDQUFFLHVCQUF1QixFQUFFLGFBQWEsRUFBRSxhQUFhLENBQUMsSUFBSSxDQUFFLFNBQVMsRUFBRSxhQUFhLENBQUUsQ0FBRSxDQUFDO1FBRWpILElBQUksZ0JBQWdCLEdBQUcsYUFBYSxDQUFDLHFCQUFxQixDQUFFLGdCQUFnQixDQUFFLENBQUM7UUFDL0UsSUFBSSxpQkFBaUIsR0FBRyxhQUFhLENBQUMscUJBQXFCLENBQUUsWUFBWSxDQUFFLENBQUM7UUFDNUUsSUFBSSxhQUFhLEdBQUcsYUFBYSxDQUFDLHFCQUFxQixDQUFFLGFBQWEsQ0FBRSxDQUFDO1FBQy9FLElBQUksdUJBQXVCLEdBQUcsYUFBYSxDQUFDLHFCQUFxQixDQUFFLHdCQUF3QixDQUFFLENBQUM7UUFDOUYsSUFBSSxzQkFBc0IsR0FBRyxhQUFhLENBQUMscUJBQXFCLENBQUUsdUJBQXVCLENBQUUsQ0FBQztRQUN0RixJQUFJLGNBQWMsR0FBRyxhQUFhLENBQUMscUJBQXFCLENBQUUsY0FBYyxDQUFFLENBQUM7UUFDM0UsSUFBSSxtQkFBbUIsR0FBRyxhQUFhLENBQUMscUJBQXFCLENBQUUsbUJBQW1CLENBQUUsQ0FBQztRQUNyRixJQUFJLHNCQUFzQixHQUFHLGFBQWEsQ0FBQyxxQkFBcUIsQ0FBRSxvQkFBb0IsQ0FBRSxDQUFDO1FBQ3pGLElBQUksZ0JBQWdCLEdBQUcsYUFBYSxDQUFDLHFCQUFxQixDQUFFLGdCQUFnQixDQUFFLENBQUM7UUFHL0UsSUFBSyxhQUFhLElBQUksQ0FBRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsbUJBQW1CLElBQUksTUFBTSxDQUFFLEVBQzVFO1lBQ0ksSUFBSSxZQUFZLEdBQUcsYUFBYSxDQUFDLFFBQVEsQ0FBRSxDQUFDLENBQWEsQ0FBQztZQUMxRCxZQUFZLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUcsdUJBQXVCLENBQUUsQ0FBQztZQUMzRCxZQUFZLENBQUMsS0FBSyxDQUFDLGFBQWEsR0FBRyxXQUFXLENBQUM7U0FDbEQ7UUFFRCxnQkFBZ0IsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLGNBQWMsQ0FBQyxJQUFJLENBQUUsU0FBUyxFQUFFLGFBQWEsQ0FBRSxDQUFFLENBQUM7UUFDaEcsaUJBQWlCLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxXQUFXLENBQUMsSUFBSSxDQUFFLFNBQVMsRUFBRSxhQUFhLENBQUUsQ0FBRSxDQUFDO1FBQzlGLGlCQUFpQixDQUFDLGlCQUFpQixDQUFFLFdBQVcsRUFBRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsZUFBZSxDQUFFLENBQUM7UUFDekYsaUJBQWlCLENBQUMsYUFBYSxDQUFFLGFBQWEsRUFBRSxjQUFZLFlBQVksQ0FBQyxzQkFBc0IsQ0FBRSxpQkFBaUIsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFFLDJCQUEyQixDQUFDLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDO1FBQ3BLLGlCQUFpQixDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsY0FBYSxZQUFZLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQztRQUNoRyxhQUFhLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFFLFNBQVMsRUFBRSxhQUFhLENBQUUsQ0FBRSxDQUFDO1FBQ3JGLHVCQUF1QixDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsZ0JBQWdCLENBQUMsSUFBSSxDQUFFLFNBQVMsRUFBRSxhQUFhLENBQUUsQ0FBRSxDQUFDO1FBQ3pHLHVCQUF1QixDQUFDLGFBQWEsQ0FBRSxhQUFhLEVBQUUsY0FBWSxZQUFZLENBQUMsc0JBQXNCLENBQUUsdUJBQXVCLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBRSw2QkFBNkIsQ0FBQyxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQztRQUNsTCx1QkFBdUIsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLGNBQWEsWUFBWSxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFFLENBQUM7UUFDdEcsc0JBQXNCLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxlQUFlLENBQUMsSUFBSSxDQUFFLFNBQVMsRUFBRSxhQUFhLENBQUUsQ0FBRSxDQUFDO1FBQ3ZHLHNCQUFzQixDQUFDLGFBQWEsQ0FBRSxhQUFhLEVBQUUsY0FBWSxZQUFZLENBQUMsc0JBQXNCLENBQUUsc0JBQXNCLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBRSw0QkFBNEIsQ0FBQyxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQztRQUMvSyxzQkFBc0IsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLGNBQWEsWUFBWSxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFFLENBQUM7UUFDckcsY0FBYyxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsV0FBVyxDQUFDLElBQUksQ0FBRSxTQUFTLEVBQUUsYUFBYSxDQUFFLENBQUUsQ0FBQztRQUMzRixjQUFjLENBQUMsYUFBYSxDQUFFLGFBQWEsRUFBRSxjQUFZLFlBQVksQ0FBQyxzQkFBc0IsQ0FBRSxjQUFjLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxtQkFBbUIsQ0FBQyxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQztRQUN0SixjQUFjLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxjQUFhLFlBQVksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDO1FBQzdGLHNCQUFzQixDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUscUJBQXFCLENBQUMsSUFBSSxDQUFFLFNBQVMsRUFBRSxhQUFhLENBQUUsQ0FBRSxDQUFDO1FBQzdHLGdCQUFnQixDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsZUFBZSxDQUFDLElBQUksQ0FBRSxTQUFTLEVBQUUsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLGVBQWUsRUFBRSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFFLENBQUUsQ0FBQztRQUV0SixPQUFPLENBQUUsYUFBYSxDQUFFLENBQUM7SUFDN0IsQ0FBQztJQWhKZSxjQUFJLE9BZ0puQixDQUFBO0FBRUwsQ0FBQyxFQXpyQ1MsU0FBUyxLQUFULFNBQVMsUUF5ckNsQiJ9