"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/formattext.ts" />
/// <reference path="mock_adapter.ts" />
/// <reference path="rank_skillgroup_particles.ts" />
/// <reference path="endofmatch.ts" />
var EOM_Skillgroup;
(function (EOM_Skillgroup) {
    let _m_pauseBeforeEnd = 1.5;
    let _m_cP = $.GetContextPanel();
    _m_cP.Data().m_retries = 0;
    function _DisplayMe() {
        if (!_m_cP || !_m_cP.IsValid())
            return false;
        _Reset();
        if (!MockAdapter.bSkillgroupDataReady(_m_cP))
            return false;
        if (MyPersonaAPI.GetElevatedState() !== 'elevated')
            return false;
        let oSkillgroupData = MockAdapter.SkillgroupDataJSO(_m_cP);
        let localPlayerUpdate = oSkillgroupData[MockAdapter.GetLocalPlayerXuid()];
        if (!localPlayerUpdate)
            return false;
        const rating_mismatch = localPlayerUpdate.new_rank - localPlayerUpdate.old_rank != localPlayerUpdate.rank_change &&
            localPlayerUpdate.old_rank != 0;
        let oData = {
            current_rating: localPlayerUpdate.new_rank,
            num_wins: localPlayerUpdate.num_wins,
            old_rating: rating_mismatch ? 0 : localPlayerUpdate.old_rank,
            old_rating_info: '',
            old_rating_desc: '',
            old_image: '',
            new_rating: localPlayerUpdate.new_rank,
            new_rating_info: '',
            new_rating_desc: '',
            new_image: '',
            rating_change: localPlayerUpdate.rank_change,
            rating_mismatch: rating_mismatch,
            mode: localPlayerUpdate.rank_type,
            model: ''
        };
        let current_rating = Math.max(Number(oData.new_rating), Number(oData.old_rating));
        let winsNeededForRank = SessionUtil.GetNumWinsNeededForRank(oData.mode);
        let matchesNeeded = winsNeededForRank - oData.num_wins;
        _m_cP.SetDialogVariable('rating_type', $.Localize('#SFUI_GameMode' + oData.mode));
        _m_cP.SetDialogVariable('map', GameStateAPI.GetMapName());
        if (current_rating < 1 && matchesNeeded <= 0) {
            //Rank is expired show how to get a skillGroup
            switch (oData.mode) {
                case 'Wingman':
                case 'Competitive':
                    let modePrefix = (oData.mode === 'Wingman') ? 'wingman' : 'skillgroup';
                    oData.old_rating_info = $.Localize('#eom-skillgroup-expired', _m_cP);
                    oData.old_image = 'file://{images}/icons/skillgroups/' + modePrefix + '_expired.svg';
                    break;
                case 'Premier':
                    oData.old_rating_info = $.Localize('#eom-skillgroup-expired', _m_cP);
                    break;
            }
        }
        else if (current_rating < 1) {
            // Not enough wins for a skillGroup
            _m_cP.SetDialogVariableInt('winsneeded', matchesNeeded);
            switch (oData.mode) {
                case 'Wingman':
                case 'Competitive':
                    let modePrefix = (oData.mode === 'Wingman') ? 'wingman' : 'skillgroup';
                    oData.old_rating_info = $.Localize('#eom-skillgroup-needed-wins:f', _m_cP);
                    oData.old_image = 'file://{images}/icons/skillgroups/' + modePrefix + '0.svg';
                    break;
                case 'Premier':
                    break;
            }
        }
        else if (current_rating >= 1) {
            let skillgroupDescString = '';
            switch (oData.mode) {
                case 'Wingman':
                case 'Premier':
                    skillgroupDescString = '#eom-skillgroup-name';
                    break;
                case 'Competitive':
                    skillgroupDescString = '#eom-skillgroup-map-name';
                    break;
            }
            switch (oData.mode) {
                case 'Wingman':
                case 'Competitive':
                    // Has Skillgroup to show
                    let modePrefix = (oData.mode === 'Wingman') ? 'wingman' : 'skillgroup';
                    oData.old_image = 'file://{images}/icons/skillgroups/' + modePrefix + oData.old_rating + '.svg';
                    oData.old_rating_info = $.Localize('#RankName_' + oData.old_rating);
                    oData.old_rating_desc = $.Localize(skillgroupDescString, _m_cP);
                    if (oData.old_rating < oData.new_rating) // Has earned now Skillgroup
                     {
                        oData.new_image = 'file://{images}/icons/skillgroups/' + modePrefix + oData.new_rating + '.svg';
                        oData.new_rating_info = $.Localize('#RankName_' + oData.new_rating);
                        oData.new_rating_desc = $.Localize(skillgroupDescString, _m_cP);
                        _m_pauseBeforeEnd = 3.0;
                        _LoadAndShowNewRankReveal(oData);
                    }
                    break;
                case 'Premier':
                    if (oData.old_rating !== oData.new_rating) // Has earned now Skillgroup
                     {
                        _m_pauseBeforeEnd = 5.0;
                        _LoadAndShowNewRankReveal(oData);
                    }
                    break;
            }
            _m_cP.SetHasClass('rating-mismatch', oData.rating_mismatch);
        }
        if (oData.mode === 'Premier') {
            _FilloutPremierRankData(oData);
            $.Msg('RatingEmblem.GetTierColorClass(' + RatingEmblem.GetTierColorClass(_m_cP.FindChildInLayoutFile('jsRatingEmblem')));
            _m_cP.FindChildInLayoutFile('id-eom-skillgroup-premier-bg').SwitchClass('tier', RatingEmblem.GetTierColorClass(_m_cP.FindChildInLayoutFile('jsRatingEmblem')));
        }
        else {
            _FilloutRankData(oData);
        }
        _m_cP.FindChildInLayoutFile('id-eom-skillgroup-bg').SetHasClass('hide', oData.mode === 'Premier');
        _m_cP.FindChildInLayoutFile('id-eom-skillgroup-premier-bg').SetHasClass('hide', oData.mode !== 'Premier');
        _m_cP.AddClass('eom-skillgroup-show');
        return true;
    }
    ;
    function _LoadAndShowNewRankReveal(oData) {
        $.Schedule(1, () => _RevealNewIcon(oData));
    }
    function _RevealNewIcon(oData) {
        if (!_m_cP || !_m_cP.IsValid())
            return;
        if (oData.mode === 'Competitive' || oData.mode === 'Wingman') {
            _m_cP.FindChildInLayoutFile('id-eom-skillgroup-emblem--new__image').SetImage(oData.new_image);
            _m_cP.FindChildInLayoutFile('id-eom-skillgroup-emblem').AddClass("uprank-anim");
            _m_cP.SetDialogVariable('rank-info', oData.new_rating_info);
            let elParticleFlare = _m_cP.FindChildInLayoutFile('id-eom-skillgroup-emblem--new__pfx--above');
            let aParticleSettings = RankSkillgroupParticles.GetSkillGroupSettings(oData.new_rating, oData.mode);
            //returns { particleName: sParticlelevel0, cpNumber: 3, cpValue: [ 1, 0, 1 ], playEndcap: false },
            elParticleFlare.SetParticleNameAndRefresh(aParticleSettings.particleName);
            elParticleFlare.SetControlPoint(aParticleSettings.cpNumber, aParticleSettings.cpValue[0], aParticleSettings.cpValue[1], 1);
            elParticleFlare.StartParticles();
            let elParticleAmb = _m_cP.FindChildInLayoutFile('id-eom-skillgroup-emblem--new__pfx--below');
            let aParticleAmbSettings = RankSkillgroupParticles.GetSkillGroupAmbientSettings(oData.new_rating, oData.mode);
            elParticleAmb.SetParticleNameAndRefresh(aParticleAmbSettings.particleName);
            elParticleAmb.SetControlPoint(aParticleAmbSettings.cpNumber, aParticleAmbSettings.cpValue[0], aParticleAmbSettings.cpValue[1], 1);
            elParticleAmb.StartParticles();
            $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.XP.NewSkillGroup', 'MOUSE');
        }
        else if (oData.mode === 'Premier') {
            let options = {
                root_panel: _m_cP.FindChildInLayoutFile('jsRatingEmblem'),
                //	xuid: MockAdapter.GetLocalPlayerXuid(),
                leaderboard_details: { score: oData.new_rating, matchesWon: oData.num_wins },
                do_fx: false,
                presentation: 'digital',
                eom_digipanel_class_override: GetEmblemStyleOverride(oData.new_rating),
                full_details: true,
                rating_type: "Premier",
                local_player: true
            };
            let winLossStyle = GetWinLossStyle(oData);
            _m_cP.FindChildInLayoutFile('jsRatingEmblem').SwitchClass('winloss', winLossStyle + '-anim');
            PremierRankText(oData);
            SpeedLinesAnim(winLossStyle);
            RatingEmblemAnim(oData, options, winLossStyle);
        }
    }
    function _Reset() {
        let elDesc = _m_cP.FindChildInLayoutFile("id-eom-skillgroup__current_wins_desc");
        elDesc.text = '';
        _m_cP.SetDialogVariable('total-wins', '');
        _m_cP.SetDialogVariable('rank-info', '');
        let elRankDesc = _m_cP.FindChildInLayoutFile("id-eom-skillgroup__current__title");
        elRankDesc.AddClass('hidden');
        elRankDesc.text = '';
        let elImage = _m_cP.FindChildInLayoutFile("id-eom-skillgroup-emblem--current__image");
        elImage.AddClass('hidden');
        elImage.SetImage('');
        _m_cP.FindChildInLayoutFile('id-eom-skillgroup-emblem--new__image').SetImage('');
        _m_cP.FindChildInLayoutFile('id-eom-skillgroup-emblem').RemoveClass("uprank-anim");
        _m_cP.RemoveClass('eom-skillgroup-show');
        let elParticleFlare = _m_cP.FindChildInLayoutFile('id-eom-skillgroup-emblem--new__pfx--above');
        elParticleFlare.StopParticlesImmediately(true);
        let elParticleAmb = _m_cP.FindChildInLayoutFile('id-eom-skillgroup-emblem--new__pfx--below');
        elParticleAmb.StopParticlesImmediately(true);
        _m_cP.RemoveClass('rating-mismatch');
    }
    function _FilloutRankData(oData) {
        SetWinDescString(oData, _m_cP.FindChildInLayoutFile("id-eom-skillgroup__current_wins_desc"));
        _m_cP.SetDialogVariable('total-wins', oData.num_wins.toString());
        _m_cP.SetDialogVariable('rank-info', oData.old_rating_info);
        let elRankDesc = _m_cP.FindChildInLayoutFile("id-eom-skillgroup__current__title");
        if (oData.old_rating_desc) {
            elRankDesc.RemoveClass('hidden');
            elRankDesc.text = oData.old_rating_desc;
        }
        if (oData.mode === 'Competitive' || oData.mode === 'Wingman') {
            let elImage = _m_cP.FindChildInLayoutFile("id-eom-skillgroup-emblem--current__image");
            elImage.RemoveClass('hidden');
            elImage.SetImage(oData.old_image);
            let elParticleFlare = _m_cP.FindChildInLayoutFile('id-eom-skillgroup--current__pfx--above');
            let aParticleSettings = RankSkillgroupParticles.GetSkillGroupSettings(oData.old_rating, oData.mode);
            elParticleFlare.SetParticleNameAndRefresh(aParticleSettings.particleName);
            elParticleFlare.SetControlPoint(aParticleSettings.cpNumber, aParticleSettings.cpValue[0], aParticleSettings.cpValue[1], 0);
            elParticleFlare.StartParticles();
            let elParticleAmb = _m_cP.FindChildInLayoutFile('id-eom-skillgroup--current__pfx--below');
            let aParticleAmbSettings = RankSkillgroupParticles.GetSkillGroupAmbientSettings(oData.old_rating, oData.mode);
            elParticleAmb.SetParticleNameAndRefresh(aParticleAmbSettings.particleName);
            elParticleAmb.SetControlPoint(aParticleAmbSettings.cpNumber, aParticleAmbSettings.cpValue[0], aParticleAmbSettings.cpValue[1], 0);
            elParticleAmb.StartParticles();
        }
    }
    function GetEmblemStyleOverride(new_rating) {
        return new_rating < 1000 ? 'digitpanel-container-3-digit-offset' : new_rating < 10000 ? 'digitpanel-container-4-digit-offset' : '';
    }
    function _FilloutPremierRankData(oData) {
        // you don't have a rating. the reveal will not get called so set the data here
        const options = {
            root_panel: _m_cP.FindChildInLayoutFile('jsRatingEmblem'),
            leaderboard_details: { score: oData.old_rating, matchesWon: oData.num_wins },
            do_fx: false,
            rating_type: oData.mode,
            presentation: 'digital',
            eom_digipanel_class_override: GetEmblemStyleOverride(oData.old_rating),
            full_details: true,
            local_player: true
        };
        if (oData.rating_change === 0) {
            RatingEmblem.SetXuid(options);
            let winLossStyle = GetWinLossStyle(oData);
            _m_cP.FindChildInLayoutFile('jsRatingEmblem').SwitchClass('winloss', winLossStyle + '-anim');
            PremierRankText(oData);
            SpeedLinesAnim(winLossStyle);
            RatingEmblemAnim(oData, options, winLossStyle);
            return;
        }
        RatingEmblem.SetXuid(options);
    }
    function PremierRankText(oData) {
        SetWinDescString(oData, _m_cP.FindChildInLayoutFile("id-eom-skillgroup-premier-wins-desc"));
        _m_cP.SetDialogVariable('total-wins', oData.num_wins.toString());
        let desc;
        let nPoints;
        if (oData.new_rating > 0 && oData.old_rating < 1) {
            desc = $.Localize('#cs_rating_rating_established');
            nPoints = 0;
        }
        else {
            desc = RatingEmblem.GetEomDescText(_m_cP.FindChildInLayoutFile('jsRatingEmblem'));
            nPoints = Math.abs(oData.rating_change);
        }
        if (oData.rating_mismatch) {
            _m_cP.SetDialogVariable('premier-desc', $.Localize('#cs_rating_mismatch'));
        }
        else if (desc && desc !== '') {
            _m_cP.SetDialogVariable('premier-desc', desc);
        }
        _m_cP.FindChildInLayoutFile('id-eom-skillgroup-premier-desc').SetHasClass('hide', desc === '' || !desc);
        let sPointsString = '';
        sPointsString = oData.new_rating >= oData.old_rating ? "#eom-premier-points-gained" : "#eom-premier-points-lost";
        _m_cP.SetDialogVariableInt('premier_points', nPoints);
        _m_cP.FindChildInLayoutFile('id-eom-skillgroup-premier-points').text = $.Localize(sPointsString, _m_cP);
    }
    function GetWinLossStyle(oData) {
        //emblem anim
        let winLossStyle = ((oData.new_rating === 0) || (oData.new_rating > 0 && oData.old_rating < 1) || !oData.rating_change) ?
            'no-points' : oData.rating_change < 0 ?
            'lost-points' : oData.rating_change > 0 ?
            'gain-points' : '';
        return winLossStyle;
    }
    function SpeedLinesAnim(winLossStyle) {
        $.DispatchEvent('CSGOPlaySoundEffect', 'UI.Premier.EOM.SlideIn', 'MOUSE');
        //speed lines
        $.Schedule(.25, () => {
            if (!_m_cP || !_m_cP.IsValid())
                return;
            let speedLines = _m_cP.FindChildInLayoutFile('id-eom-premier-speed-lines');
            if (speedLines && speedLines.IsValid()) {
                speedLines.SetMovie("file://{resources}/videos/speed_lines.webm");
                speedLines.SwitchClass('winloss', winLossStyle);
                speedLines.SetControls('none');
                speedLines.Play();
            }
        });
    }
    function RatingEmblemAnim(oData, options, winLossStyle) {
        PlayPremierRankSound(winLossStyle);
        $.Schedule(.75, () => {
            if (!elPanel || !elPanel.IsValid() || !options.root_panel || !options.root_panel.IsValid())
                return;
            RatingEmblem.SetXuid(options);
            PremierRankText(oData);
            // tint elements
            elPanel.SwitchClass('tier', RatingEmblem.GetTierColorClass(_m_cP.FindChildInLayoutFile('jsRatingEmblem')));
        });
        let elPanel = _m_cP.FindChildInLayoutFile('id-eom-skillgroup-premier-bg');
        // gain or lost layouts
        elPanel.SwitchClass('winloss', winLossStyle);
    }
    function PlayPremierRankSound(winLossStyle) {
        if (winLossStyle === 'no-points') {
            $.DispatchEvent('CSGOPlaySoundEffect', 'UI.Premier.EOM.RankNeutral', 'MOUSE');
        }
        else if (winLossStyle === 'lost-points') {
            $.DispatchEvent('CSGOPlaySoundEffect', 'UI.Premier.EOM.RankDown', 'MOUSE');
        }
        else {
            $.DispatchEvent('CSGOPlaySoundEffect', 'UI.Premier.EOM.RankUp', 'MOUSE');
        }
    }
    function SetWinDescString(oData, elLabel) {
        elLabel.SetDialogVariableInt("matcheswon", oData.num_wins);
        switch (oData.mode) {
            case 'Competitive':
                elLabel.text = $.Localize('#eom-skillgroup-map-win:f', elLabel);
                break;
            case 'Wingman':
            case 'Premier':
                elLabel.text = $.Localize('#eom-skillgroup-win:f', elLabel);
                break;
        }
    }
    function Start() {
        if (_DisplayMe()) {
            EndOfMatch.SwitchToPanel('eom-skillgroup');
            EndOfMatch.StartDisplayTimer(_m_pauseBeforeEnd);
            $.Schedule(_m_pauseBeforeEnd, _End);
        }
        else {
            _End();
            return;
        }
    }
    function _End() {
        EndOfMatch.ShowNextPanel();
    }
    function Shutdown() {
    }
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        EndOfMatch.RegisterPanelObject({
            name: 'eom-skillgroup',
            Start: Start,
            Shutdown: Shutdown
        });
    }
})(EOM_Skillgroup || (EOM_Skillgroup = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5kb2ZtYXRjaC1za2lsbGdyb3VwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvZW5kb2ZtYXRjaC1za2lsbGdyb3VwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFDbEMsNkNBQTZDO0FBQzdDLHdDQUF3QztBQUN4QyxxREFBcUQ7QUFDckQsc0NBQXNDO0FBeUJ0QyxJQUFVLGNBQWMsQ0FtZXZCO0FBbmVELFdBQVUsY0FBYztJQUV2QixJQUFJLGlCQUFpQixHQUFHLEdBQUcsQ0FBQztJQUM1QixJQUFJLEtBQUssR0FBbUMsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBRWhFLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO0lBRTNCLFNBQVMsVUFBVTtRQUVsQixJQUFLLENBQUMsS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRTtZQUM5QixPQUFPLEtBQUssQ0FBQztRQUVkLE1BQU0sRUFBRSxDQUFDO1FBRVQsSUFBSyxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBRSxLQUFLLENBQUU7WUFDOUMsT0FBTyxLQUFLLENBQUM7UUFFZCxJQUFLLFlBQVksQ0FBQyxnQkFBZ0IsRUFBRSxLQUFLLFVBQVU7WUFDbEQsT0FBTyxLQUFLLENBQUM7UUFFZCxJQUFJLGVBQWUsR0FBRyxXQUFXLENBQUMsaUJBQWlCLENBQUUsS0FBSyxDQUFFLENBQUM7UUFDN0QsSUFBSSxpQkFBaUIsR0FBRyxlQUFlLENBQUUsV0FBVyxDQUFDLGtCQUFrQixFQUFFLENBQUUsQ0FBQztRQUU1RSxJQUFLLENBQUMsaUJBQWlCO1lBQ3RCLE9BQU8sS0FBSyxDQUFDO1FBRWQsTUFBTSxlQUFlLEdBQUcsaUJBQWlCLENBQUMsUUFBUSxHQUFHLGlCQUFpQixDQUFDLFFBQVEsSUFBSSxpQkFBaUIsQ0FBQyxXQUFXO1lBQy9HLGlCQUFp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