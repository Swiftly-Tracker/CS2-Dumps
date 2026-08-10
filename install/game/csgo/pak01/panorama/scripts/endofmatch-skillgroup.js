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
                    let modePrefix = (oData.mode === 'Wingman') ? 'wingman' : 'skillgroup';
                    oData.old_image = 'file://{images}/icons/skillgroups/' + modePrefix + oData.old_rating + '.svg';
                    oData.old_rating_info = $.Localize('#RankName_' + oData.old_rating);
                    oData.old_rating_desc = $.Localize(skillgroupDescString, _m_cP);
                    if (oData.old_rating < oData.new_rating) {
                        oData.new_image = 'file://{images}/icons/skillgroups/' + modePrefix + oData.new_rating + '.svg';
                        oData.new_rating_info = $.Localize('#RankName_' + oData.new_rating);
                        oData.new_rating_desc = $.Localize(skillgroupDescString, _m_cP);
                        _m_pauseBeforeEnd = 3.0;
                        _LoadAndShowNewRankReveal(oData);
                    }
                    break;
                case 'Premier':
                    if (oData.old_rating !== oData.new_rating) {
                        _m_pauseBeforeEnd = 5.0;
                        _LoadAndShowNewRankReveal(oData);
                    }
                    break;
            }
            _m_cP.SetHasClass('rating-mismatch', oData.rating_mismatch);
        }
        if (oData.mode === 'Premier') {
            _FilloutPremierRankData(oData);
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
        let winLossStyle = ((oData.new_rating === 0) || (oData.new_rating > 0 && oData.old_rating < 1) || !oData.rating_change) ?
            'no-points' : oData.rating_change < 0 ?
            'lost-points' : oData.rating_change > 0 ?
            'gain-points' : '';
        return winLossStyle;
    }
    function SpeedLinesAnim(winLossStyle) {
        $.DispatchEvent('CSGOPlaySoundEffect', 'UI.Premier.EOM.SlideIn', 'MOUSE');
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
            elPanel.SwitchClass('tier', RatingEmblem.GetTierColorClass(_m_cP.FindChildInLayoutFile('jsRatingEmblem')));
        });
        let elPanel = _m_cP.FindChildInLayoutFile('id-eom-skillgroup-premier-bg');
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
    {
        EndOfMatch.RegisterPanelObject({
            name: 'eom-skillgroup',
            Start: Start,
            Shutdown: Shutdown
        });
    }
})(EOM_Skillgroup || (EOM_Skillgroup = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5kb2ZtYXRjaC1za2lsbGdyb3VwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvZW5kb2ZtYXRjaC1za2lsbGdyb3VwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFDbEMsNkNBQTZDO0FBQzdDLHdDQUF3QztBQUN4QyxxREFBcUQ7QUFDckQsc0NBQXNDO0FBeUJ0QyxJQUFVLGNBQWMsQ0FtZXZCO0FBbmVELFdBQVUsY0FBYztJQUV2QixJQUFJLGlCQUFpQixHQUFHLEdBQUcsQ0FBQztJQUM1QixJQUFJLEtBQUssR0FBbUMsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBRWhFLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO0lBRTNCLFNBQVMsVUFBVTtRQUVsQixJQUFLLENBQUMsS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRTtZQUM5QixPQUFPLEtBQUssQ0FBQztRQUVkLE1BQU0sRUFBRSxDQUFDO1FBRVQsSUFBSyxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBRSxLQUFLLENBQUU7WUFDOUMsT0FBTyxLQUFLLENBQUM7UUFFZCxJQUFLLFlBQVksQ0FBQyxnQkFBZ0IsRUFBRSxLQUFLLFVBQVU7WUFDbEQsT0FBTyxLQUFLLENBQUM7UUFFZCxJQUFJLGVBQWUsR0FBRyxXQUFXLENBQUMsaUJBQWlCLENBQUUsS0FBSyxDQUFFLENBQUM7UUFDN0QsSUFBSSxpQkFBaUIsR0FBRyxlQUFlLENBQUUsV0FBVyxDQUFDLGtCQUFrQixFQUFFLENBQUUsQ0FBQztRQUU1RSxJQUFLLENBQUMsaUJBQWlCO1lBQ3RCLE9BQU8sS0FBSyxDQUFDO1FBRWQsTUFBTSxlQUFlLEdBQUcsaUJBQWlCLENBQUMsUUFBUSxHQUFHLGlCQUFpQixDQUFDLFFBQVEsSUFBSSxpQkFBaUIsQ0FBQyxXQUFXO1lBQy9HLGlCQUFpQixDQUFDLFFBQVEsSUFBSSxDQUFDLENBQUM7UUFFakMsSUFBSSxLQUFLLEdBQXFCO1lBQzdCLGNBQWMsRUFBRSxpQkFBaUIsQ0FBQyxRQUFRO1lBQzFDLFFBQVEsRUFBRSxpQkFBaUIsQ0FBQyxRQUFRO1lBRXBDLFVBQVUsRUFBRSxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUMsUUFBUTtZQUM1RCxlQUFlLEVBQUUsRUFBRTtZQUNuQixlQUFlLEVBQUUsRUFBRTtZQUNuQixTQUFTLEVBQUUsRUFBRTtZQUViLFVBQVUsRUFBRSxpQkFBaUIsQ0FBQyxRQUFRO1lBQ3RDLGVBQWUsRUFBRSxFQUFFO1lBQ25CLGVBQWUsRUFBRSxFQUFFO1lBQ25CLFNBQVMsRUFBRSxFQUFFO1lBRWIsYUFBYSxFQUFFLGlCQUFpQixDQUFDLFdBQVc7WUFFNUMsZUFBZSxFQUFFLGVBQWU7WUFFaEMsSUFBSSxFQUFFLGlCQUFpQixDQUFDLFNBQVM7WUFDakMsS0FBSyxFQUFFLEVBQUU7U0FDVCxDQUFDO1FBRUYsSUFBSSxjQUFjLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBRSxNQUFNLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUUsQ0FBQztRQUNwRixJQUFJLGlCQUFpQixHQUFHLFdBQVcsQ0FBQyx1QkFBdUIsQ0FBRSxLQUFLLENBQUMsSUFBSSxDQUFFLENBQUM7UUFDMUUsSUFBSSxhQUFhLEdBQUcsaUJBQWlCLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQztRQUV2RCxLQUFLLENBQUMsaUJBQWlCLENBQUUsYUFBYSxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUUsZ0JBQWdCLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBRSxDQUFFLENBQUM7UUFDdEYsS0FBSyxDQUFDLGlCQUFpQixDQUFFLEtBQUssRUFBRSxZQUFZLENBQUMsVUFBVSxFQUFFLENBQUUsQ0FBQztRQUc1RCxJQUFLLGNBQWMsR0FBRyxDQUFDLElBQUksYUFBYSxJQUFJLENBQUMsRUFDN0M7WUFHQyxRQUFTLEtBQUssQ0FBQyxJQUFJLEVBQ25CO2dCQUNBLEtBQUssU0FBUyxDQUFDO2dCQUNmLEtBQUssYUFBYTtvQkFFakIsSUFBSSxVQUFVLEdBQUcsQ0FBRSxLQUFLLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQztvQkFFekUsS0FBSyxDQUFDLGVBQWUsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFFLHlCQUF5QixFQUFFLEtBQUssQ0FBRSxDQUFDO29CQUN2RSxLQUFLLENBQUMsU0FBUyxHQUFHLG9DQUFvQyxHQUFHLFVBQVUsR0FBRyxjQUFjLENBQUM7b0JBRXJGLE1BQU07Z0JBRVAsS0FBSyxTQUFTO29CQUNiLEtBQUssQ0FBQyxlQUFlLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBRSx5QkFBeUIsRUFBRSxLQUFLLENBQUUsQ0FBQztvQkFDdkUsTUFBTTthQUNOO1NBQ0Q7YUFDSSxJQUFLLGNBQWMsR0FBRyxDQUFDLEVBQzVCO1lBRUMsS0FBSyxDQUFDLG9CQUFvQixDQUFFLFlBQVksRUFBRSxhQUFhLENBQUUsQ0FBQztZQUUxRCxRQUFTLEtBQUssQ0FBQyxJQUFJLEVBQ25CO2dCQUNBLEtBQUssU0FBUyxDQUFDO2dCQUNmLEtBQUssYUFBYTtvQkFFakIsSUFBSSxVQUFVLEdBQUcsQ0FBRSxLQUFLLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQztvQkFFekUsS0FBSyxDQUFDLGVBQWUsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFFLCtCQUErQixFQUFFLEtBQUssQ0FBRSxDQUFDO29CQUM3RSxLQUFLLENBQUMsU0FBUyxHQUFHLG9DQUFvQyxHQUFHLFVBQVUsR0FBRyxPQUFPLENBQUM7b0JBRTlFLE1BQU07Z0JBRVAsS0FBSyxTQUFTO29CQUNiLE1BQU07YUFDTjtTQUNEO2FBQ0ksSUFBSyxjQUFjLElBQUksQ0FBQyxFQUM3QjtZQUNDLElBQUksb0JBQW9CLEdBQUcsRUFBRSxDQUFDO1lBRTlCLFFBQVMsS0FBSyxDQUFDLElBQUksRUFDbkI7Z0JBQ0MsS0FBSyxTQUFTLENBQUM7Z0JBQ2YsS0FBSyxTQUFTO29CQUNiLG9CQUFvQixHQUFHLHNCQUFzQixDQUFDO29CQUM5QyxNQUFNO2dCQUVQLEtBQUssYUFBYTtvQkFDakIsb0JBQW9CLEdBQUcsMEJBQTBCLENBQUM7b0JBQ2xELE1BQU07YUFDUDtZQUVELFFBQVMsS0FBSyxDQUFDLElBQUksRUFDbkI7Z0JBQ0MsS0FBSyxTQUFTLENBQUM7Z0JBQ2YsS0FBSyxhQUFhO29CQUdqQixJQUFJLFVBQVUsR0FBRyxDQUFFLEtBQUssQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDO29CQUN6RSxLQUFLLENBQUMsU0FBUyxHQUFHLG9DQUFvQyxHQUFHLFVBQVUsR0FBRyxLQUFLLENBQUMsVUFBVSxHQUFHLE1BQU0sQ0FBQztvQkFDaEcsS0FBSyxDQUFDLGVBQWUsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFFLFlBQVksR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFFLENBQUM7b0JBQ3RFLEtBQUssQ0FBQyxlQUFlLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxvQkFBb0IsRUFBRSxLQUFLLENBQUUsQ0FBQztvQkFFbEUsSUFBSyxLQUFLLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQyxVQUFVLEVBQ3hDO3dCQUNDLEtBQUssQ0FBQyxTQUFTLEdBQUcsb0NBQW9DLEdBQUcsVUFBVSxHQUFHLEtBQUssQ0FBQyxVQUFVLEdBQUcsTUFBTSxDQUFDO3dCQUNoRyxLQUFLLENBQUMsZUFBZSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUUsWUFBWSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUUsQ0FBQzt3QkFDdEUsS0FBSyxDQUFDLGVBQWUsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFFLG9CQUFvQixFQUFFLEtBQUssQ0FBRSxDQUFDO3dCQUVsRSxpQkFBaUIsR0FBRyxHQUFHLENBQUM7d0JBQ3hCLHlCQUF5QixDQUFFLEtBQUssQ0FBRSxDQUFDO3FCQUNuQztvQkFFRCxNQUFNO2dCQUVQLEtBQUssU0FBUztvQkFDYixJQUFLLEtBQUssQ0FBQyxVQUFVLEtBQUssS0FBSyxDQUFDLFVBQVUsRUFDMUM7d0JBQ0MsaUJBQWlCLEdBQUcsR0FBRyxDQUFDO3dCQUN4Qix5QkFBeUIsQ0FBRSxLQUFLLENBQUUsQ0FBQztxQkFDbkM7b0JBRUQsTUFBTTthQUNQO1lBRUQsS0FBSyxDQUFDLFdBQVcsQ0FBRSxpQkFBaUIsRUFBRSxLQUFLLENBQUMsZUFBZSxDQUFFLENBQUM7U0FDOUQ7UUFFRCxJQUFLLEtBQUssQ0FBQyxJQUFJLEtBQUssU0FBUyxFQUM3QjtZQUNDLHVCQUF1QixDQUFFLEtBQUssQ0FBRSxDQUFDO1lBR2pDLEtBQUssQ0FBQyxxQkFBcUIsQ0FBRSw4QkFBOEIsQ0FBRSxDQUFDLFdBQVcsQ0FBRSxNQUFNLEVBQUUsWUFBWSxDQUFDLGlCQUFpQixDQUFFLEtBQUssQ0FBQyxxQkFBcUIsQ0FBRSxnQkFBZ0IsQ0FBRSxDQUFFLENBQUUsQ0FBQztTQUN2SzthQUVEO1lBQ0MsZ0JBQWdCLENBQUUsS0FBSyxDQUFFLENBQUM7U0FDMUI7UUFFRCxLQUFLLENBQUMscUJBQXFCLENBQUUsc0JBQXNCLENBQUUsQ0FBQyxXQUFXLENBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFFLENBQUM7UUFDdEcsS0FBSyxDQUFDLHFCQUFxQixDQUFFLDhCQUE4QixDQUFFLENBQUMsV0FBVyxDQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBRSxDQUFDO1FBQzlHLEtBQUssQ0FBQyxRQUFRLENBQUUscUJBQXFCLENBQUUsQ0FBQztRQUV4QyxPQUFPLElBQUksQ0FBQztJQUNiLENBQUM7SUFBQSxDQUFDO0lBRUYsU0FBUyx5QkFBeUIsQ0FBRyxLQUFzQjtRQUUxRCxDQUFDLENBQUMsUUFBUSxDQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxjQUFjLENBQUUsS0FBSyxDQUFFLENBQUUsQ0FBQztJQUNoRCxDQUFDO0lBRUQsU0FBUyxjQUFjLENBQUcsS0FBdUI7UUFFaEQsSUFBSyxDQUFDLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUU7WUFDOUIsT0FBTztRQUVSLElBQUssS0FBSyxDQUFDLElBQUksS0FBSyxhQUFhLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxTQUFTLEVBQzdEO1lBQ0csS0FBSyxDQUFDLHFCQUFxQixDQUFFLHNDQUFzQyxDQUFjLENBQUMsUUFBUSxDQUFFLEtBQUssQ0FBQyxTQUFTLENBQUUsQ0FBQztZQUNoSCxLQUFLLENBQUMscUJBQXFCLENBQUUsMEJBQTBCLENBQUUsQ0FBQyxRQUFRLENBQUUsYUFBYSxDQUFFLENBQUM7WUFFcEYsS0FBSyxDQUFDLGlCQUFpQixDQUFFLFdBQVcsRUFBRSxLQUFLLENBQUMsZUFBZSxDQUFFLENBQUM7WUFFOUQsSUFBSSxlQUFlLEdBQUcsS0FBSyxDQUFDLHFCQUFxQixDQUFFLDJDQUEyQyxDQUEwQixDQUFDO1lBQ3pILElBQUksaUJBQWlCLEdBQUcsdUJBQXVCLENBQUMscUJBQXFCLENBQUUsS0FBSyxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFFLENBQUM7WUFFdEcsZUFBZSxDQUFDLHlCQUF5QixDQUFFLGlCQUFpQixDQUFDLFlBQVksQ0FBRSxDQUFDO1lBQzVFLGVBQWUsQ0FBQyxlQUFlLENBQUUsaUJBQWlCLENBQUMsUUFBUSxFQUFFLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxpQkFBaUIsQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDOUgsZUFBZSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBRWpDLElBQUksYUFBYSxHQUFHLEtBQUssQ0FBQyxxQkFBcUIsQ0FBRSwyQ0FBMkMsQ0FBMEIsQ0FBQztZQUN2SCxJQUFJLG9CQUFvQixHQUFHLHVCQUF1QixDQUFDLDRCQUE0QixDQUFFLEtBQUssQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBRSxDQUFDO1lBQ2hILGFBQWEsQ0FBQyx5QkFBeUIsQ0FBRSxvQkFBb0IsQ0FBQyxZQUFZLENBQUUsQ0FBQztZQUM3RSxhQUFhLENBQUMsZUFBZSxDQUFFLG9CQUFvQixDQUFDLFFBQVEsRUFBRSxvQkFBb0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsb0JBQW9CLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO1lBQ3BJLGFBQWEsQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUUvQixDQUFDLENBQUMsYUFBYSxDQUFFLHFCQUFxQixFQUFFLDZCQUE2QixFQUFFLE9BQU8sQ0FBRSxDQUFDO1NBQ2pGO2FBQ0ksSUFBSyxLQUFLLENBQUMsSUFBSSxLQUFLLFNBQVMsRUFDbEM7WUFDQyxJQUFJLE9BQU8sR0FDWDtnQkFDQyxVQUFVLEVBQUUsS0FBSyxDQUFDLHFCQUFxQixDQUFFLGdCQUFnQixDQUFFO2dCQUUzRCxtQkFBbUIsRUFBRSxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxLQUFLLENBQUMsUUFBUSxFQUFFO2dCQUM1RSxLQUFLLEVBQUUsS0FBSztnQkFDWixZQUFZLEVBQUUsU0FBUztnQkFDdkIsNEJBQTRCLEVBQUUsc0JBQXNCLENBQUUsS0FBSyxDQUFDLFVBQVUsQ0FBRTtnQkFDeEUsWUFBWSxFQUFFLElBQUk7Z0JBQ2xCLFdBQVcsRUFBRSxTQUFTO2dCQUN0QixZQUFZLEVBQUUsSUFBSTthQUNsQixDQUFDO1lBRUYsSUFBSSxZQUFZLEdBQUcsZUFBZSxDQUFFLEtBQUssQ0FBRSxDQUFDO1lBQzVDLEtBQUssQ0FBQyxxQkFBcUIsQ0FBRSxnQkFBZ0IsQ0FBRSxDQUFDLFdBQVcsQ0FBRSxTQUFTLEVBQUUsWUFBWSxHQUFHLE9BQU8sQ0FBRSxDQUFDO1lBQ2pHLGVBQWUsQ0FBRSxLQUFLLENBQUUsQ0FBQztZQUN6QixjQUFjLENBQUUsWUFBWSxDQUFFLENBQUM7WUFDL0IsZ0JBQWdCLENBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxZQUFZLENBQUUsQ0FBQztTQUNqRDtJQUNGLENBQUM7SUFFRCxTQUFTLE1BQU07UUFFZCxJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUMscUJBQXFCLENBQUUsc0NBQXNDLENBQWEsQ0FBQztRQUM5RixNQUFNLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUVqQixLQUFLLENBQUMsaUJBQWlCLENBQUUsWUFBWSxFQUFFLEVBQUUsQ0FBRSxDQUFDO1FBQzVDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBRSxXQUFXLEVBQUUsRUFBRSxDQUFFLENBQUM7UUFFM0MsSUFBSSxVQUFVLEdBQUcsS0FBSyxDQUFDLHFCQUFxQixDQUFFLG1DQUFtQyxDQUFhLENBQUM7UUFDL0YsVUFBVSxDQUFDLFFBQVEsQ0FBRSxRQUFRLENBQUUsQ0FBQztRQUNoQyxVQUFVLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUVyQixJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUMscUJBQXFCLENBQUUsMENBQTBDLENBQWEsQ0FBQztRQUNuRyxPQUFPLENBQUMsUUFBUSxDQUFFLFFBQVEsQ0FBRSxDQUFDO1FBQzdCLE9BQU8sQ0FBQyxRQUFRLENBQUUsRUFBRSxDQUFFLENBQUM7UUFFckIsS0FBSyxDQUFDLHFCQUFxQixDQUFFLHNDQUFzQyxDQUFlLENBQUMsUUFBUSxDQUFFLEVBQUUsQ0FBRSxDQUFDO1FBQ3BHLEtBQUssQ0FBQyxxQkFBcUIsQ0FBRSwwQkFBMEIsQ0FBRSxDQUFDLFdBQVcsQ0FBRSxhQUFhLENBQUUsQ0FBQztRQUV2RixLQUFLLENBQUMsV0FBVyxDQUFFLHFCQUFxQixDQUFFLENBQUM7UUFFM0MsSUFBSSxlQUFlLEdBQUcsS0FBSyxDQUFDLHFCQUFxQixDQUFFLDJDQUEyQyxDQUEwQixDQUFDO1FBQ3pILGVBQWUsQ0FBQyx3QkFBd0IsQ0FBRSxJQUFJLENBQUUsQ0FBQztRQUVqRCxJQUFJLGFBQWEsR0FBRyxLQUFLLENBQUMscUJBQXFCLENBQUUsMkNBQTJDLENBQTBCLENBQUM7UUFDdkgsYUFBYSxDQUFDLHdCQUF3QixDQUFFLElBQUksQ0FBRSxDQUFDO1FBRS9DLEtBQUssQ0FBQyxXQUFXLENBQUUsaUJBQWlCLENBQUUsQ0FBQztJQUN4QyxDQUFDO0lBRUQsU0FBUyxnQkFBZ0IsQ0FBRyxLQUFzQjtRQUVqRCxnQkFBZ0IsQ0FBRSxLQUFLLEVBQUksS0FBSyxDQUFDLHFCQUFxQixDQUFFLHNDQUFzQyxDQUFlLENBQUUsQ0FBQztRQUVoSCxLQUFLLENBQUMsaUJBQWlCLENBQUUsWUFBWSxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUUsQ0FBQztRQUNuRSxLQUFLLENBQUMsaUJBQWlCLENBQUUsV0FBVyxFQUFFLEtBQUssQ0FBQyxlQUFlLENBQUUsQ0FBQztRQUU5RCxJQUFJLFVBQVUsR0FBRyxLQUFLLENBQUMscUJBQXFCLENBQUUsbUNBQW1DLENBQWEsQ0FBQztRQUUvRixJQUFLLEtBQUssQ0FBQyxlQUFlLEVBQzFCO1lBQ0MsVUFBVSxDQUFDLFdBQVcsQ0FBRSxRQUFRLENBQUUsQ0FBQztZQUNuQyxVQUFVLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUM7U0FDeEM7UUFFRCxJQUFLLEtBQUssQ0FBQyxJQUFJLEtBQUssYUFBYSxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssU0FBUyxFQUM3RDtZQUNDLElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQyxxQkFBcUIsQ0FBRSwwQ0FBMEMsQ0FBYSxDQUFDO1lBQ25HLE9BQU8sQ0FBQyxXQUFXLENBQUUsUUFBUSxDQUFFLENBQUM7WUFDaEMsT0FBTyxDQUFDLFFBQVEsQ0FBRSxLQUFLLENBQUMsU0FBUyxDQUFFLENBQUM7WUFFcEMsSUFBSSxlQUFlLEdBQUcsS0FBSyxDQUFDLHFCQUFxQixDQUFFLHdDQUF3QyxDQUEwQixDQUFDO1lBQ3RILElBQUksaUJBQWlCLEdBQUcsdUJBQXVCLENBQUMscUJBQXFCLENBQUUsS0FBSyxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFFLENBQUM7WUFDdEcsZUFBZSxDQUFDLHlCQUF5QixDQUFFLGlCQUFpQixDQUFDLFlBQVksQ0FBRSxDQUFDO1lBQzVFLGVBQWUsQ0FBQyxlQUFlLENBQUUsaUJBQWlCLENBQUMsUUFBUSxFQUFFLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7WUFDN0gsZUFBZSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBRWpDLElBQUksYUFBYSxHQUFHLEtBQUssQ0FBQyxxQkFBcUIsQ0FBRSx3Q0FBd0MsQ0FBMEIsQ0FBQztZQUNwSCxJQUFJLG9CQUFvQixHQUFHLHVCQUF1QixDQUFDLDRCQUE0QixDQUFFLEtBQUssQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBRSxDQUFDO1lBQ2hILGFBQWEsQ0FBQyx5QkFBeUIsQ0FBRSxvQkFBb0IsQ0FBQyxZQUFZLENBQUUsQ0FBQztZQUM3RSxhQUFhLENBQUMsZUFBZSxDQUFFLG9CQUFvQixDQUFDLFFBQVEsRUFBRSxvQkFBb0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsb0JBQW9CLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDO1lBQ3BJLGFBQWEsQ0FBQyxjQUFjLEVBQUUsQ0FBQztTQUMvQjtJQUNGLENBQUM7SUFFRCxTQUFTLHNCQUFzQixDQUFHLFVBQWlCO1FBRWxELE9BQU8sVUFBVSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMscUNBQXFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLHFDQUFxQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFDcEksQ0FBQztJQUVELFNBQVMsdUJBQXVCLENBQUcsS0FBc0I7UUFJeEQsTUFBTSxPQUFPLEdBQ2I7WUFDQyxVQUFVLEVBQUUsS0FBSyxDQUFDLHFCQUFxQixDQUFFLGdCQUFnQixDQUFFO1lBQzNELG1CQUFtQixFQUFFLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUU7WUFDNUUsS0FBSyxFQUFFLEtBQUs7WUFDWixXQUFXLEVBQUUsS0FBSyxDQUFDLElBQXlCO1lBQzVDLFlBQVksRUFBRSxTQUFTO1lBQ3ZCLDRCQUE0QixFQUFFLHNCQUFzQixDQUFFLEtBQUssQ0FBQyxVQUFVLENBQUU7WUFDeEUsWUFBWSxFQUFFLElBQUk7WUFDbEIsWUFBWSxFQUFFLElBQUk7U0FDbEIsQ0FBQztRQUVGLElBQUssS0FBSyxDQUFDLGFBQWEsS0FBSyxDQUFDLEVBQzlCO1lBQ0MsWUFBWSxDQUFDLE9BQU8sQ0FBRSxPQUFPLENBQUUsQ0FBQztZQUVoQyxJQUFJLFlBQVksR0FBRyxlQUFlLENBQUUsS0FBSyxDQUFFLENBQUM7WUFDNUMsS0FBSyxDQUFDLHFCQUFxQixDQUFFLGdCQUFnQixDQUFFLENBQUMsV0FBVyxDQUFFLFNBQVMsRUFBRSxZQUFZLEdBQUcsT0FBTyxDQUFFLENBQUM7WUFDakcsZUFBZSxDQUFFLEtBQUssQ0FBRSxDQUFDO1lBQ3pCLGNBQWMsQ0FBRSxZQUFZLENBQUUsQ0FBQztZQUMvQixnQkFBZ0IsQ0FBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLFlBQVksQ0FBRSxDQUFDO1lBQ2pELE9BQU87U0FDUDtRQUVELFlBQVksQ0FBQyxPQUFPLENBQUUsT0FBTyxDQUFFLENBQUM7SUFDakMsQ0FBQztJQUVELFNBQVMsZUFBZSxDQUFHLEtBQXNCO1FBRWhELGdCQUFnQixDQUFFLEtBQUssRUFBSSxLQUFLLENBQUMscUJBQXFCLENBQUUscUNBQXFDLENBQWMsQ0FBRSxDQUFDO1FBQzlHLEtBQUssQ0FBQyxpQkFBaUIsQ0FBRSxZQUFZLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBRSxDQUFDO1FBRW5FLElBQUksSUFBWSxDQUFDO1FBQ2pCLElBQUksT0FBZSxDQUFDO1FBQ3BCLElBQUssS0FBSyxDQUFDLFVBQVUsR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDLFVBQVUsR0FBRyxDQUFDLEVBQ2pEO1lBQ0MsSUFBSSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUUsK0JBQStCLENBQUUsQ0FBQztZQUNyRCxPQUFPLEdBQUcsQ0FBQyxDQUFDO1NBQ1o7YUFFRDtZQUNDLElBQUksR0FBRyxZQUFZLENBQUMsY0FBYyxDQUFFLEtBQUssQ0FBQyxxQkFBcUIsQ0FBRSxnQkFBZ0IsQ0FBRSxDQUFFLENBQUM7WUFDdEYsT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBRSxDQUFDO1NBQzFDO1FBRUQsSUFBSyxLQUFLLENBQUMsZUFBZSxFQUMxQjtZQUNDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBRSxjQUFjLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFFLENBQUM7U0FDN0U7YUFDSSxJQUFLLElBQUksSUFBSSxJQUFJLEtBQUssRUFBRSxFQUM3QjtZQUNDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBRSxjQUFjLEVBQUUsSUFBSSxDQUFFLENBQUM7U0FDaEQ7UUFDRCxLQUFLLENBQUMscUJBQXFCLENBQUUsZ0NBQWdDLENBQUUsQ0FBQyxXQUFXLENBQUUsTUFBTSxFQUFFLElBQUksS0FBSyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUUsQ0FBQztRQUU1RyxJQUFJLGFBQWEsR0FBRyxFQUFFLENBQUM7UUFFdkIsYUFBYSxHQUFHLEtBQUssQ0FBQyxVQUFVLElBQUksS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsNEJBQTRCLENBQUMsQ0FBQyxDQUFDLDBCQUEwQixDQUFDO1FBQ2pILEtBQUssQ0FBQyxvQkFBb0IsQ0FBRSxnQkFBZ0IsRUFBRSxPQUFPLENBQUUsQ0FBQztRQUN0RCxLQUFLLENBQUMscUJBQXFCLENBQUUsa0NBQWtDLENBQWMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxhQUFhLEVBQUUsS0FBSyxDQUFFLENBQUM7SUFDM0gsQ0FBQztJQUVELFNBQVMsZUFBZSxDQUFHLEtBQXNCO1FBR2hELElBQUksWUFBWSxHQUFHLENBQUUsQ0FBRSxLQUFLLENBQUMsVUFBVSxLQUFLLENBQUMsQ0FBRSxJQUFJLENBQUUsS0FBSyxDQUFDLFVBQVUsR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUUsQ0FBQyxDQUFDO1lBQzlILFdBQVcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUN0QyxhQUFhLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDeEMsYUFBYSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFFdEIsT0FBTyxZQUFZLENBQUM7SUFDckIsQ0FBQztJQUVELFNBQVMsY0FBYyxDQUFHLFlBQW1CO1FBRTVDLENBQUMsQ0FBQyxhQUFhLENBQUUscUJBQXFCLEVBQUUsd0JBQXdCLEVBQUUsT0FBTyxDQUFFLENBQUM7UUFFNUUsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxHQUFHLEVBQUUsR0FBRyxFQUFFO1lBRXJCLElBQUssQ0FBQyxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFO2dCQUM5QixPQUFPO1lBRVIsSUFBSSxVQUFVLEdBQUcsS0FBSyxDQUFDLHFCQUFxQixDQUFFLDRCQUE0QixDQUFhLENBQUM7WUFDeEYsSUFBSyxVQUFVLElBQUksVUFBVSxDQUFDLE9BQU8sRUFBRSxFQUN2QztnQkFDQyxVQUFVLENBQUMsUUFBUSxDQUFFLDRDQUE0QyxDQUFFLENBQUM7Z0JBQ3BFLFVBQVUsQ0FBQyxXQUFXLENBQUUsU0FBUyxFQUFFLFlBQVksQ0FBRSxDQUFDO2dCQUNsRCxVQUFVLENBQUMsV0FBVyxDQUFFLE1BQU0sQ0FBRSxDQUFDO2dCQUNqQyxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUM7YUFDbEI7UUFDRixDQUFDLENBQUUsQ0FBQztJQUNMLENBQUM7SUFFRCxTQUFTLGdCQUFnQixDQUFHLEtBQXNCLEVBQUUsT0FBNkIsRUFBRSxZQUFtQjtRQUVyRyxvQkFBb0IsQ0FBRSxZQUFZLENBQUUsQ0FBQztRQUVyQyxDQUFDLENBQUMsUUFBUSxDQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUU7WUFFckIsSUFBSyxDQUFDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRTtnQkFDMUYsT0FBTztZQUVSLFlBQVksQ0FBQyxPQUFPLENBQUUsT0FBTyxDQUFFLENBQUM7WUFDaEMsZUFBZSxDQUFFLEtBQUssQ0FBRSxDQUFDO1lBRXpCLE9BQU8sQ0FBQyxXQUFXLENBQUUsTUFBTSxFQUFFLFlBQVksQ0FBQyxpQkFBaUIsQ0FBRSxLQUFLLENBQUMscUJBQXFCLENBQUUsZ0JBQWdCLENBQUUsQ0FBRSxDQUFFLENBQUM7UUFDbEgsQ0FBQyxDQUFFLENBQUM7UUFFSixJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUMscUJBQXFCLENBQUUsOEJBQThCLENBQUUsQ0FBQztRQUU1RSxPQUFPLENBQUMsV0FBVyxDQUFFLFNBQVMsRUFBRSxZQUFZLENBQUUsQ0FBQztJQUNoRCxDQUFDO0lBRUQsU0FBUyxvQkFBb0IsQ0FBRyxZQUFtQjtRQUVsRCxJQUFLLFlBQVksS0FBSyxXQUFXLEVBQ2pDO1lBQ0MsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxxQkFBcUIsRUFBRSw0QkFBNEIsRUFBRSxPQUFPLENBQUUsQ0FBQztTQUNoRjthQUNJLElBQUssWUFBWSxLQUFLLGFBQWEsRUFDeEM7WUFDQyxDQUFDLENBQUMsYUFBYSxDQUFFLHFCQUFxQixFQUFFLHlCQUF5QixFQUFFLE9BQU8sQ0FBRSxDQUFDO1NBQzdFO2FBRUQ7WUFDQyxDQUFDLENBQUMsYUFBYSxDQUFFLHFCQUFxQixFQUFFLHVCQUF1QixFQUFFLE9BQU8sQ0FBRSxDQUFDO1NBQzNFO0lBQ0YsQ0FBQztJQUVELFNBQVMsZ0JBQWdCLENBQUcsS0FBc0IsRUFBRSxPQUFlO1FBRWxFLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBRSxZQUFZLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBRSxDQUFDO1FBRTdELFFBQVMsS0FBSyxDQUFDLElBQUksRUFDbkI7WUFFQyxLQUFLLGFBQWE7Z0JBQ2pCLE9BQU8sQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBRSwyQkFBMkIsRUFBRSxPQUFPLENBQUUsQ0FBQztnQkFDbEUsTUFBTTtZQUVQLEtBQUssU0FBUyxDQUFDO1lBQ2YsS0FBSyxTQUFTO2dCQUNiLE9BQU8sQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBRSx1QkFBdUIsRUFBRSxPQUFPLENBQUUsQ0FBQztnQkFDOUQsTUFBTTtTQUNQO0lBQ0YsQ0FBQztJQUVELFNBQVMsS0FBSztRQUViLElBQUssVUFBVSxFQUFFLEVBQ2pCO1lBQ0MsVUFBVSxDQUFDLGFBQWEsQ0FBRSxnQkFBZ0IsQ0FBRSxDQUFDO1lBQzdDLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBRSxpQkFBaUIsQ0FBRSxDQUFDO1lBRWxELENBQUMsQ0FBQyxRQUFRLENBQUUsaUJBQWlCLEVBQUUsSUFBSSxDQUFFLENBQUM7U0FDdEM7YUFFRDtZQUNDLElBQUksRUFBRSxDQUFDO1lBQ1AsT0FBTztTQUNQO0lBQ0YsQ0FBQztJQUVELFNBQVMsSUFBSTtRQUVaLFVBQVUsQ0FBQyxhQUFhLEVBQUUsQ0FBQztJQUM1QixDQUFDO0lBRUQsU0FBUyxRQUFRO0lBRWpCLENBQUM7SUFLRDtRQUNDLFVBQVUsQ0FBQyxtQkFBbUIsQ0FBRTtZQUMvQixJQUFJLEVBQUUsZ0JBQWdCO1lBQ3RCLEtBQUssRUFBRSxLQUFLO1lBQ1osUUFBUSxFQUFFLFFBQVE7U0FDbEIsQ0FBRSxDQUFDO0tBQ0o7QUFDRixDQUFDLEVBbmVTLGNBQWMsS0FBZCxjQUFjLFFBbWV2QiJ9