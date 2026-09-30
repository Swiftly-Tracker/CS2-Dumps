"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="digitpanel.ts" />
/// <reference path="common/sessionutil.ts" />
$.LogChannel('p.rating', "LV_OFF");
var RatingEmblem;
(function (RatingEmblem) {
    function _GetMainPanel(root_panel) {
        if (root_panel &&
            root_panel.IsValid() &&
            root_panel.FindChildTraverse('jsPremierRating') &&
            root_panel.FindChildTraverse('jsPremierRating').IsValid()) {
            return root_panel.FindChildTraverse('jsPremierRating').GetParent();
        }
        else {
            return null;
        }
    }
    function GetRatingDesc(root_panel) {
        let elMain = _GetMainPanel(root_panel);
        return elMain ? elMain.Data().ratingDesc : '';
    }
    RatingEmblem.GetRatingDesc = GetRatingDesc;
    function GetTooltipText(root_panel) {
        let elMain = _GetMainPanel(root_panel);
        return elMain ? elMain.Data().tooltipText : '';
    }
    RatingEmblem.GetTooltipText = GetTooltipText;
    function GetTierColorClass(root_panel) {
        let elMain = _GetMainPanel(root_panel);
        return elMain ? elMain.Data().colorClassName : '';
    }
    RatingEmblem.GetTierColorClass = GetTierColorClass;
    function GetEomDescText(root_panel) {
        let elMain = _GetMainPanel(root_panel);
        return elMain ? elMain.Data().eomDescText : '';
    }
    RatingEmblem.GetEomDescText = GetEomDescText;
    function GetIntroText(root_panel) {
        let elMain = _GetMainPanel(root_panel);
        return elMain ? elMain.Data().introText : '';
    }
    RatingEmblem.GetIntroText = GetIntroText;
    function GetWinCountString(root_panel) {
        let elMain = _GetMainPanel(root_panel);
        return elMain ? elMain.Data().winCountText : '';
    }
    RatingEmblem.GetWinCountString = GetWinCountString;
    function GetPromotionState(root_panel) {
        let elMain = _GetMainPanel(root_panel);
        return elMain ? elMain.Data().promotionState : '';
    }
    RatingEmblem.GetPromotionState = GetPromotionState;
    function SetXuid(options) {
        let rating = undefined;
        let wins = undefined;
        let rank = undefined;
        let pct = undefined;
        let bFullDetails = options.hasOwnProperty('full_details') ? options.full_details : false;
        //		let source = options.api;
        let do_fx = options.do_fx;
        let rating_type = options.rating_type;
        let root_panel = _GetMainPanel(options.root_panel);
        if (!root_panel)
            return false;
        let debug_wins = false;
        if (debug_wins) {
            wins = Math.floor(Math.random() * 20);
        }
        // values were pushed down
        rating = options.leaderboard_details.score;
        wins = options.leaderboard_details.matchesWon;
        rank = options.leaderboard_details.rank;
        pct = options.leaderboard_details.pct;
        // DISPLAY
        ///////////
        $.Msg('[p.rating] ' + rating_type + root_panel.id);
        root_panel.SwitchClass('type', rating_type);
        if (bFullDetails) {
            $.Msg('[p.rating] making strings');
            root_panel.SetDialogVariable('rating_type', rating_type);
        }
        let elSkillGroupImage = null;
        let imagePath = '';
        let winsNeededForRank = SessionUtil ? SessionUtil.GetNumWinsNeededForRank(rating_type) : 10; // a fancy of way of saying 10
        let isloading = (rating === undefined || rating < 0);
        let bRatingExpired = !isloading && rating === 0;
        let bTooFewWins = wins === undefined || wins < winsNeededForRank;
        let bHasRating = !bRatingExpired && !bTooFewWins && !isloading;
        let ratingDesc = '';
        let tooltipText = '';
        let eomDescText = '';
        let tooltipExtraText = '';
        let colorClassName = '';
        let introText = '';
        let promotionState = '';
        let winCountText = '';
        //DEVONLY{
        $.Msg('[p.rating] \n\n');
        $.Msg('[p.rating] rating: ' + rating);
        $.Msg('[p.rating] wins:   ' + wins + '\n\n');
        //}DEVONLY
        if (!wins || wins < 0) {
            wins = 0;
        }
        if (isloading) {
            ratingDesc = $.Localize('#SFUI_LOADING');
        }
        root_panel.SetDialogVariableInt("wins", wins);
        // WINGMAN or COMPETITIVE
        if (rating_type === 'Wingman' || rating_type === 'Competitive') {
            elSkillGroupImage = root_panel.FindChildTraverse('jsRating-' + rating_type);
            let locTypeModifer = rating_type === 'Competitive' ? '' : rating_type.toLowerCase();
            imagePath = locTypeModifer !== '' ? locTypeModifer : 'skillgroup';
            const elCompWinsNeeded = root_panel.FindChildTraverse('jsRating-CompetitiveWinsNeeded');
            elCompWinsNeeded.visible = !isloading && bTooFewWins && options.local_player;
            if (bTooFewWins || isloading) {
                elSkillGroupImage.SetImage('file://{images}/icons/skillgroups/' + imagePath + '_none.svg');
                // if we don't have enough wins show the num wins required IF this is the local player
                if (!isloading && options.local_player) {
                    const winsneeded = Math.max(0, winsNeededForRank - wins);
                    elSkillGroupImage.SetDialogVariableInt('wins', wins);
                    elSkillGroupImage.SetDialogVariableInt('wins-needed', winsneeded);
                    if (bFullDetails) {
                        ratingDesc = $.Localize('#skillgroup_0' + locTypeModifer);
                        root_panel.SetDialogVariableInt("winsneeded", winsneeded);
                        tooltipText = $.Localize('#tooltip_skill_group_none' + imagePath + ':f', root_panel);
                    }
                }
            }
            else if (bRatingExpired) // expired
             {
                elSkillGroupImage.SetImage('file://{images}/icons/skillgroups/' + imagePath + '_expired.svg');
                if (bFullDetails) {
                    ratingDesc = $.Localize('#skillgroup_expired' + locTypeModifer);
                    tooltipText = $.Localize('#tooltip_skill_group_expired' + locTypeModifer);
                }
            }
            else // has a rating
             {
                elSkillGroupImage.SetImage('file://{images}/icons/skillgroups/' + imagePath + rating + '.svg');
                if (bFullDetails) {
                    ratingDesc = $.Localize('#skillgroup_' + rating);
                    tooltipText = $.Localize('#tooltip_skill_group_generic' + locTypeModifer);
                }
            }
        }
        // PREMIER
        else if (rating_type === 'Premier') {
            let elPremierRating = root_panel.FindChildTraverse('jsPremierRating');
            let presentation = options.presentation ? options.presentation : 'simple';
            root_panel.FindChildTraverse('JsSimpleNumbers').visible = presentation === 'simple';
            root_panel.FindChildTraverse('JsDigitPanels').visible = presentation === 'digital';
            let majorRating = '';
            let minorRating = '';
            root_panel.SwitchClass('tier', 'tier-0');
            // background
            _SetPremierBackgroundImage(root_panel, rating);
            if (rating && rating > 0) // has a rating
             {
                let clampedRating = GetClampedRating(rating);
                root_panel.SwitchClass('tier', 'tier-' + clampedRating);
                colorClassName = 'tier-' + clampedRating;
                let arrRating = SplitRating(rating);
                majorRating = arrRating[0];
                minorRating = arrRating[1];
                if (do_fx && rating) {
                    RatingParticleControls.UpdateRatingEffects(elPremierRating, majorRating, minorRating.slice(-3), parseInt(arrRating[2]));
                }
                if (bFullDetails) {
                    if (rank && rank <= LeaderboardsAPI.GetPremierLeaderboardTopBestCount()) {
                        root_panel.SetDialogVariableInt('rank', rank);
                        ratingDesc = $.Localize('#cs_rating_rank', root_panel);
                        eomDescText = ratingDesc;
                    }
                    else if (pct) {
                        root_panel.SetDialogVariable('percentile', pct.toFixed(2) + '');
                        ratingDesc = $.Localize('#cs_rating_percentile', root_panel);
                        eomDescText = ratingDesc;
                    }
                    else {
                        ratingDesc = $.Localize('#cs_rating_generic');
                    }
                    // relegation or promotion
                    if (arrRating[2] === '2') {
                        tooltipExtraText = $.Localize('#cs_rating_relegation_nextmatch');
                        introText = $.Localize('#cs_rating_relegation_match');
                        eomDescText = $.Localize('#cs_rating_relegation_nextmatch');
                        ratingDesc = $.Localize('#cs_rating_relegation_nextmatch');
                        promotionState = 'relegation';
                    }
                    else if (arrRating[2] === '1') {
                        tooltipExtraText = $.Localize('#cs_rating_promotion_nextmatch');
                        introText = $.Localize('#cs_rating_promotion_match');
                        eomDescText = $.Localize('#cs_rating_promotion_nextmatch');
                        ratingDesc = $.Localize('#cs_rating_promotion_nextmatch');
                        promotionState = 'promotion';
                    }
                    tooltipText = $.Localize('#tooltip_cs_rating_generic');
                }
            }
            else {
                if (bFullDetails) {
                    if (isloading) {
                        ratingDesc = $.Localize('#skillgroup_loading');
                    }
                    else if (bTooFewWins) {
                        let winsneeded = (winsNeededForRank - wins);
                        root_panel.SetDialogVariableInt("winsneeded", winsneeded);
                        tooltipText = $.Localize('#tooltip_cs_rating_none:f', root_panel);
                        eomDescText = $.Localize('#cs_rating_wins_needed_verbose:f', root_panel);
                        introText = $.Localize('#cs_rating_wins_needed_verbose_intro:f', root_panel);
                        if (options.local_player) {
                            ratingDesc = $.Localize('#cs_rating_wins_needed:f', root_panel);
                        }
                        else {
                            ratingDesc = $.Localize('#cs_rating_none');
                        }
                    }
                    else if (bRatingExpired) // expired
                     {
                        ratingDesc = $.Localize('#cs_rating_expired');
                        tooltipText = $.Localize('#tooltip_cs_rating_expired');
                        eomDescText = $.Localize('#eom-skillgroup-expired-premier', root_panel);
                        introText = $.Localize('#eom-skillgroup-expired-premier', root_panel);
                    }
                }
            }
            _SetEomStyleOverrides(options, root_panel);
            _SetPremierRatingValue(root_panel, majorRating, minorRating, presentation);
        }
        if (bFullDetails) {
            if (tooltipExtraText !== '') {
                tooltipText = tooltipText + '<br><br>' + tooltipExtraText;
            }
            // set text fields
            if (wins) {
                root_panel.SetDialogVariableInt('wins', wins);
                let winText = $.Localize('#tooltip_skill_group_wins:f', root_panel);
                tooltipText = (tooltipText !== '') ? tooltipText + '<br><br>' + winText : winText;
                winCountText = $.Localize('#wins_count:f', root_panel);
            }
            root_panel.Data().ratingDesc = ratingDesc;
            root_panel.Data().tooltipText = tooltipText;
            root_panel.Data().colorClassName = colorClassName;
            root_panel.Data().eomDescText = eomDescText;
            root_panel.Data().introText = introText;
            root_panel.Data().promotionState = promotionState;
            root_panel.Data().winCountText = winCountText;
        }
        root_panel.SwitchClass('rating_type', rating_type);
        return bHasRating;
    }
    RatingEmblem.SetXuid = SetXuid;
    function GetClampedRating(rating) {
        let remappedRating = Math.floor(rating / 1000.00 / 5);
        return Math.max(0, Math.min(remappedRating, 6));
    }
    RatingEmblem.GetClampedRating = GetClampedRating;
    function _SetPremierBackgroundImage(root_panel, rating) {
        let bgImage = (rating && rating > 0) ? 'premier_rating_bg_large.svg' : 'premier_rating_bg_large_none.svg';
        let elImage = root_panel.FindChildInLayoutFile('jsPremierRatingBg');
        elImage.SetImage('file://{images}/icons/ui/' + bgImage);
    }
    function _SetEomStyleOverrides(options, root_panel) {
        root_panel.FindChildInLayoutFile('JsDigitPanels').SwitchClass('emblemstyle', options.eom_digipanel_class_override ? options.eom_digipanel_class_override : '');
    }
    function _SetPremierRatingValue(root_panel, major, minor, premierPresentation) {
        // set premier values
        root_panel.SetDialogVariable('rating-major', major);
        root_panel.SetDialogVariable('rating-minor', minor);
        if (premierPresentation === 'digital') {
            const elMajor = $.GetContextPanel().FindChildTraverse('jsPremierRatingMajor');
            const elMinor = $.GetContextPanel().FindChildTraverse('jsPremierRatingMinor');
            let bFastSet = false;
            if (!$.GetContextPanel().FindChildTraverse('DigitPanel')) {
                DigitPanelFactory.MakeDigitPanel(elMajor, 2, '', 1, "#digitpanel_digits_premier");
                DigitPanelFactory.MakeDigitPanel(elMinor, 4, '', 1, "#digitpanel_digits_premier");
                bFastSet = true;
            }
            DigitPanelFactory.SetDigitPanelString(elMajor, major, bFastSet);
            DigitPanelFactory.SetDigitPanelString(elMinor, minor, bFastSet);
        }
    }
    function SplitRating(rating) {
        let matchType = '0';
        if (rating === 5000 || rating === 10000 || rating === 15000 ||
            rating === 20000 || rating === 25000 || rating === 30000)
            matchType = '2'; // relegation
        else if (rating === 5000 - 1 || rating === 10000 - 1 || rating === 15000 - 1 ||
            rating === 20000 - 1 || rating === 25000 - 1 || rating === 30000 - 1)
            matchType = '1'; // promotion
        rating = rating / 1000.00;
        let strRating = (String((rating).toFixed(3))).padStart(6, '0');
        let major = strRating.slice(0, 2);
        let minor = strRating.slice(-3);
        major = major.replace(/^00/g, '  ');
        major = major.replace(/^0/g, ' ');
        if (major === '  ') {
            minor = minor.replace(/^00/g, '  ');
            minor = minor.replace(/^0/g, ' ');
        }
        else {
            minor = ',' + minor;
        }
        return [major, minor, matchType];
    }
    RatingEmblem.SplitRating = SplitRating;
})(RatingEmblem || (RatingEmblem = {}));
var RatingParticleControls;
(function (RatingParticleControls) {
    function GetAllChildren(panel) {
        const children = panel.Children();
        return [...children, ...children.flatMap(GetAllChildren)];
    }
    function IsParticleScenePanel(panel) {
        return panel.type === "ParticleScenePanel";
    }
    function ColorConvert(tier) {
        let rarityColors = [
            //["default", 106, 97, 86],
            ["common", 176, 195, 217],
            ["uncommon", 94, 152, 217],
            ["rare", 75, 105, 255],
            ["mythical", 136, 71, 255],
            ["legendary", 211, 44, 230],
            ["ancient", 235, 75, 75],
            //["immortal", 228, 174, 57],
            //["strange", 207, 106, 50],
            ["unusual", 255, 215, 0],
        ];
        if (tier < 0 || tier >= rarityColors.length)
            return { R: 0, G: 0, B: 0 };
        let R = rarityColors[tier][1];
        let G = rarityColors[tier][2];
        let B = rarityColors[tier][3];
        return { R, G, B };
    }
    RatingParticleControls.ColorConvert = ColorConvert;
    function UpdateRatingEffects(panelId, MajorRating, MinorRating, matchType) {
        const AllPanels = GetAllChildren(panelId);
        let ratingEffect = [
            "particles/ui/premier_ratings_bg.vpcf",
            "particles/ui/premier_ratings_promomatch.vpcf",
            "particles/ui/premier_ratings_relegation.vpcf"
        ];
        let tier = Math.floor(+MajorRating / 5.0);
        let tierColor = ColorConvert(tier);
        for (const panel of AllPanels) {
            if (IsParticleScenePanel(panel)) {
                if (+MajorRating > 0) {
                    panel.StartParticles();
                    panel.SetParticleNameAndRefresh(ratingEffect[matchType]);
                    panel.SetControlPoint(16, tierColor.R, tierColor.G, tierColor.B);
                }
                else {
                    panel.StopParticlesImmediately(true);
                }
            }
        }
    }
    RatingParticleControls.UpdateRatingEffects = UpdateRatingEffects;
})(RatingParticleControls || (RatingParticleControls = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmF0aW5nX2VtYmxlbS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3JhdGluZ19lbWJsZW0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUNsQyxzQ0FBc0M7QUFDdEMsOENBQThDO0FBRTlDLENBQUMsQ0FBQyxVQUFVLENBQUUsVUFBVSxFQUFFLFFBQVEsQ0FBRSxDQUFDO0FBcUJyQyxJQUFVLFlBQVksQ0E0WnJCO0FBNVpELFdBQVUsWUFBWTtJQUVyQixTQUFTLGFBQWEsQ0FBRyxVQUFtQjtRQUUzQyxJQUFLLFVBQVU7WUFDZCxVQUFVLENBQUMsT0FBTyxFQUFFO1lBQ3BCLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBRSxpQkFBaUIsQ0FBRTtZQUNqRCxVQUFVLENBQUMsaUJBQWlCLENBQUUsaUJBQWlCLENBQUUsQ0FBQyxPQUFPLEVBQUUsRUFDNUQ7WUFDQyxPQUFPLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBRSxpQkFBaUIsQ0FBRSxDQUFDLFNBQVMsRUFBRSxDQUFDO1NBQ3JFO2FBRUQ7WUFDQyxPQUFPLElBQUksQ0FBQztTQUNaO0lBQ0YsQ0FBQztJQUVELFNBQWdCLGFBQWEsQ0FBRyxVQUFtQjtRQUVsRCxJQUFJLE1BQU0sR0FBRyxhQUFhLENBQUUsVUFBVSxDQUFFLENBQUM7UUFDekMsT0FBTyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztJQUMvQyxDQUFDO0lBSmUsMEJBQWEsZ0JBSTVCLENBQUE7SUFFRCxTQUFnQixjQUFjLENBQUcsVUFBbUI7UUFFbkQsSUFBSSxNQUFNLEdBQUcsYUFBYSxDQUFFLFVBQVUsQ0FBRSxDQUFDO1FBQ3pDLE9BQU8sTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FB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