"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="rating_emblem.ts" />
/// <reference path="common/formattext.ts" />
var SeasonProgress;
(function (SeasonProgress) {
    const _m_nWinsForMedal = 25;
    function _Init() {
        SetRating();
    }
    function SetRating() {
        let elRatingEmblem = $.GetContextPanel().FindChildInLayoutFile('js-highest-rating');
        let rating = MyPersonaAPI.GetPipRankHighest("Premier");
        // debug
        // rating = 25000;
        // debug
        let options;
        options = {
            root_panel: elRatingEmblem,
            rating_type: 'Premier',
            leaderboard_details: { score: rating },
            do_fx: true,
            full_details: false,
            local_player: true
        };
        RatingEmblem.SetXuid(options);
        _SetProgressBar(rating);
    }
    SeasonProgress.SetRating = SetRating;
    function _SetProgressBar(rating) {
        let nWins = MyPersonaAPI.GetPipRankWins("Premier");
        // debug
        // nWins = 120;
        // debug
        let clampedRating = RatingEmblem.GetClampedRating(rating);
        $.Msg('clampedRating: ' + clampedRating);
        let color = clampedRating;
        let nBars = nWins > 24 && nWins < 50 ? 1 :
            nWins > 49 && nWins < 75 ? 2 :
                nWins > 74 && nWins < 100 ? 3 :
                    nWins > 99 && nWins < 125 ? 4 :
                        nWins > 124 ? 5 :
                            0;
        nBars = nBars < 5 ? nBars + 1 : 5;
        let elParent = $.GetContextPanel().FindChildInLayoutFile('id-premier-season-bars');
        for (let i = 1; i <= nBars; i++) {
            let elBar = elParent.FindChild('bar-' + i);
            if (!elBar) {
                elBar = $.CreatePanel('Panel', elParent, 'bar-' + i);
                elBar.BLoadLayoutSnippet('one-bar');
            }
            let rangeOfMatchesInBar = { min: i == 1 ? 1 : ((i - 1) * _m_nWinsForMedal), max: (i * _m_nWinsForMedal) }; // 25th is the diamond thats why -1
            let widthInnerBar = (nWins >= (rangeOfMatchesInBar.max - 1)) ? 1 : ((nWins - rangeOfMatchesInBar.min) / (_m_nWinsForMedal - 1));
            elBar.FindChildInLayoutFile('id-inner-bar').style.width = (widthInnerBar * 100) + '%';
            elBar.FindChildInLayoutFile('id-inner-bar').SwitchClass('tier', 'rank-tier-' + color);
            elBar.SwitchClass('num-bars', nBars + '-bars');
            elBar.FindChildInLayoutFile('id-inner-medal').SwitchClass('tier', nWins >= rangeOfMatchesInBar.max ? 'rank-tier-' + color : 'rank-tier-none');
        }
        // What's the current season number?
        const nSeasonNumberNow = LeaderboardsAPI.GetCurrentSeasonPremierLeaderboard().replace('official_leaderboard_premier_season', '');
        clampedRating = clampedRating < 1 ? 1 : clampedRating + 1;
        let itemDef = InventoryAPI.GetItemDefinitionIndexFromDefinitionName('premier season coin s=' + nSeasonNumberNow + ' c=' + clampedRating + ' b=' + nBars);
        let itemId = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(itemDef, 0);
        $.GetContextPanel().FindChildInLayoutFile('id-medal-end').itemid = itemId;
        $.GetContextPanel().SetDialogVariableInt('wins', nWins);
        $.GetContextPanel().SetDialogVariableInt('threshold', nBars * 25);
        _ShowHideExpirationWarning();
        _SetInfoIconTooltip();
    }
    function _ShowHideExpirationWarning() {
        let nTime = MyPersonaAPI.GetPipRankExpiration("Premier");
        let nWins = MyPersonaAPI.GetPipRankWins("Premier");
        let elParent = $.GetContextPanel().FindChildInLayoutFile('id-premier-bar-container');
        // If user has a rank, but zero expiration ==&gt; means the rank is good through end of season
        // If you have not won 25 matches then you can't get the coin any way and have no rank to expire
        if (nWins < _m_nWinsForMedal || nTime >= 0) {
            elParent.SetHasClass('show-warning', false);
            let elImages = elParent.FindChildInLayoutFile('id-premier-bar-icons');
            elImages.SetPanelEvent('onmouseover', () => {
                return;
            });
            elImages.SetPanelEvent('onmouseout', () => {
                return;
            });
            return;
        }
        if (nTime < 0) {
            elParent.SetHasClass('show-warning', true);
            let elImages = elParent.FindChildInLayoutFile('id-premier-bar-icons');
            elImages.SetPanelEvent('onmouseover', () => {
                UiToolkitAPI.ShowTextTooltip('id-premier-bar-icons', '#season_progress_rating_expired');
            });
            elImages.SetPanelEvent('onmouseout', () => {
                UiToolkitAPI.HideTextTooltip();
            });
        }
    }
    function _SetInfoIconTooltip() {
        let nTime = MyPersonaAPI.GetPipRankExpiration("Premier");
        let nWins = MyPersonaAPI.GetPipRankWins("Premier");
        let elTooltip = $.GetContextPanel().FindChildInLayoutFile('id-season-progress-tooltip');
        let sTooltip = $.Localize('#season_progress_tooltip-body');
        if (nWins >= _m_nWinsForMedal && nTime > 0) {
            elTooltip.SetDialogVariable('time', FormatText.SecondsToSignificantTimeString(nTime));
            sTooltip = sTooltip + $.Localize('#season_progress_tooltip-expiration_time', elTooltip);
        }
        elTooltip.SetPanelEvent('onmouseover', () => {
            UiToolkitAPI.ShowTitleTextTooltip('id-season-progress-tooltip', '#season_progress_tooltip-title', sTooltip);
        });
        elTooltip.SetPanelEvent('onmouseout', () => {
            UiToolkitAPI.HideTitleTextTooltip();
        });
    }
    function ReadyForDisplay() {
        $.Msg("SeasonProgress-ReadyForDisplay");
        SetRating();
    }
    SeasonProgress.ReadyForDisplay = ReadyForDisplay;
    function UnReadyForDisplay() {
        $.Msg("SeasonProgress-UnReadyForDisplay");
    }
    SeasonProgress.UnReadyForDisplay = UnReadyForDisplay;
    function PipRankUpdate() {
        $.Msg("SeasonProgress-PipRankUpdate");
        SetRating();
    }
    SeasonProgress.PipRankUpdate = PipRankUpdate;
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        $.RegisterEventHandler('ReadyForDisplay', $.GetContextPanel(), SeasonProgress.ReadyForDisplay);
        $.RegisterEventHandler('UnreadyForDisplay', $.GetContextPanel(), SeasonProgress.UnReadyForDisplay);
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_PipRankUpdate', PipRankUpdate);
        _Init();
    }
})(SeasonProgress || (SeasonProgress = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlbWllcl9zZWFzb25fcHJvZ3Jlc3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wcmVtaWVyX3NlYXNvbl9wcm9ncmVzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBQ2xDLHlDQUF5QztBQUN6Qyw2Q0FBNkM7QUFFN0MsSUFBVSxjQUFjLENBcUx2QjtBQXJMRCxXQUFVLGNBQWM7SUFFcEIsTUFBTSxnQkFBZ0IsR0FBRyxFQUFFLENBQUM7SUFFNUIsU0FBUyxLQUFLO1FBRVYsU0FBUyxFQUFFLENBQUM7SUFDaEIsQ0FBQztJQUVELFNBQWdCLFNBQVM7UUFHckIsSUFBSSxjQUFjLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLG1CQUFtQixDQUFFLENBQUM7UUFDdEYsSUFBSSxNQUFNLEdBQUcsWUFBWSxDQUFDLGlCQUFpQixDQUFFLFNBQVMsQ0FBRSxDQUFDO1FBRXpELFFBQVE7UUFDUixrQkFBa0I7UUFDbEIsUUFBUTtRQUVSLElBQUksT0FBOEIsQ0FBQztRQUNuQyxPQUFPLEdBQUc7WUFDTixVQUFVLEVBQUUsY0FBYztZQUMxQixXQUFXLEVBQUUsU0FBUztZQUN0QixtQkFBbUIsRUFBRSxFQUFFLEtBQUssRUFBQyxNQUFNLEVBQUU7WUFDckMsS0FBSyxFQUFFLElBQUk7WUFDWCxZQUFZLEVBQUUsS0FBSztZQUNuQixZQUFZLEVBQUUsSUFBSTtTQUNyQixDQUFBO1FBRUQsWUFBWSxDQUFDLE9BQU8sQ0FBRSxPQUFPLENBQUUsQ0FBQztRQUVoQyxlQUFlLENBQUUsTUFBTSxDQUFFLENBQUM7SUFDOUIsQ0FBQztJQXZCZSx3QkFBUyxZQXVCeEIsQ0FBQTtJQUVELFNBQVMsZUFBZSxDQUFFLE1BQWE7UUFFbkMsSUFBSSxLQUFLLEdBQUcsWUFBWSxDQUFDLGNBQWMsQ0FBRSxTQUFTLENBQUUsQ0FBQztRQUVyRCxR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