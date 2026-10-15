"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/formattext.ts" />
/// <reference path="mock_adapter.ts" />
/// <reference path="xpshop_track.ts" />
/// <reference path="rank_skillgroup_particles.ts" />
/// <reference path="endofmatch.ts" />
var EOM_Rank;
(function (EOM_Rank) {
    let _m_pauseBeforeEnd = 1.0;
    const _m_cP = $.GetContextPanel();
    _m_cP.Data().m_retries = 0;
    function _DisplayMe() {
        if (!_m_cP || !_m_cP.IsValid())
            return;
        if (!MockAdapter.bXpDataReady(_m_cP))
            return false;
        if (MyPersonaAPI.GetElevatedState() !== 'elevated')
            return false;
        let xPPerLevel = MyPersonaAPI.GetXpPerLevel();
        let oXpData = MockAdapter.XPDataJSO(_m_cP);
        if (!oXpData)
            return false;
        const xpBonuses = MyPersonaAPI.GetActiveXpBonuses();
        const bEligibleForCarePackage = xpBonuses.split(',').includes('2');
        const earnedFreeRewards = oXpData.hasOwnProperty('free_rewards') ? Number(oXpData.free_rewards) : 0;
        const xp_trail_level = oXpData.hasOwnProperty('xp_trail_level') ? Number(oXpData.xp_trail_level) : 0;
        $.GetContextPanel().SetHasClass('care-package-eligible', bEligibleForCarePackage || (earnedFreeRewards != 0));
        let elCarePackage = _m_cP.FindChildTraverse('jsEomCarePackage');
        elCarePackage.RemoveClass('earned-rewards');
        let elProgress = _m_cP.FindChildInLayoutFile("id-eom-rank__bar-container");
        let elNew = _m_cP.FindChildInLayoutFile("id-eom-new-reveal");
        let elCurrent = _m_cP.FindChildInLayoutFile("id-eom-rank__current");
        let elBar = _m_cP.FindChildInLayoutFile("id-eom-rank__bar");
        let elRankLister = _m_cP.FindChildInLayoutFile("id-eom-rank__lister");
        let elRankListerItems = _m_cP.FindChildInLayoutFile("id-eom-rank__lister__items");
        let arrPreRankXP = [];
        let arrPostRankXP = [];
        let totalXP = 0;
        let maxLevel = InventoryAPI.GetMaxLevel();
        let elPanel = _m_cP.FindChildTraverse('id-eom-rank__current');
        elPanel.TriggerClass('show');
        _m_cP.AddClass('eom-rank-show');
        let currentRank = oXpData.current_level;
        currentRank = currentRank < maxLevel ? currentRank : maxLevel;
        elCurrent.SetDialogVariableInt("level", currentRank);
        elCurrent.SetDialogVariable('name', $.Localize('#XP_RankName_' + currentRank, elCurrent));
        _m_cP.FindChildInLayoutFile("id-eom-rank__current__emblem").SetImage("file://{images}/icons/xp/level" + currentRank + ".png");
        const newRank = currentRank < maxLevel ? (currentRank + 1) : maxLevel;
        let elCurrentListerItem;
        let _xpSoundNum = 1;
        let currentXpPointer = 0;
        function _AddXPBar(reason, xp, xpToXpTrailEvent = -1) {
            const sPerXp = 0.0005;
            const duration = sPerXp * xp;
            const sPerSoundTick = 0.082;
            for (let t = sPerSoundTick; t < duration; t += sPerSoundTick) {
                $.Schedule(animTime + t, () => $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.XP.Ticker', 'eom-rank'));
            }
            $.Schedule(animTime, () => {
                if (!elBar.IsValid())
                    return 0;
                let elRankSegment = $.CreatePanel('Panel', elBar, 'id-eom-rank__bar__segment');
                elRankSegment.AddClass("eom-rank__bar__segment");
                elBar.MoveChildAfter(elRankLister, elRankSegment);
                let colorClass;
                if (reason == "old") {
                    colorClass = "eom-rank__blue";
                }
                else if (reason == "levelup") {
                    colorClass = "eom-rank__purple";
                }
                else if (reason == "6" || reason == "7") {
                    colorClass = "eom-rank__yellow";
                }
                else if (reason == "9" || reason == "10" || reason == "59") {
                    colorClass = "eom-rank__yellow";
                }
                else {
                    colorClass = "eom-rank__green";
                }
                $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.XP.Milestone_0' + _xpSoundNum.toString(), 'eom-rank');
                if (_xpSoundNum < 4) {
                    _xpSoundNum++;
                }
                elRankSegment.AddClass(colorClass);
                elRankSegment.style.width = '0%';
                $.Schedule(0.0, () => {
                    if (elRankSegment && elRankSegment.IsValid()) {
                        elRankSegment.style.width = (xp / xPPerLevel * 100) + '%;';
                    }
                });
                elRankSegment.style.transitionDuration = duration + "s";
                if (elCurrentListerItem) {
                    elCurrentListerItem.AddClass("eom-rank__lister__item--old");
                }
                if (elRankListerItems && elRankListerItems.IsValid()) {
                    elCurrentListerItem = $.CreatePanel('Panel', elRankListerItems, 'id-eom-rank__lister__items__' + reason);
                    elCurrentListerItem.BLoadLayoutSnippet("snippet_rank__lister__item");
                    elCurrentListerItem.RemoveClass("eom-rank__lister__item--appear");
                    let elAmtLabel = elCurrentListerItem.FindChildTraverse('id-eom-rank__lister__item__amt');
                    elAmtLabel.SetDialogVariable("xp", String(xp));
                    elAmtLabel.text = $.Localize("#EOM_XP_Bar", elAmtLabel);
                    elAmtLabel.AddClass(colorClass);
                    let elDescLabel = elCurrentListerItem.FindChildTraverse('id-eom-rank__lister__item__desc');
                    elDescLabel.SetDialogVariable("gamemode", $.Localize("#SFUI_GameMode_" + MatchStatsAPI.GetGameMode()));
                    elDescLabel.text = $.Localize("#XP_Bonus_RankUp_" + reason, elDescLabel);
                }
            });
            currentXpPointer += xp;
            if (xpToXpTrailEvent > -1) {
                const xpTrailAnimStartTime = xpToXpTrailEvent * sPerXp;
                $.Schedule(animTime + xpTrailAnimStartTime, () => {
                    if (_m_cP && _m_cP.IsValid()) {
                        _m_cP.SetHasClass('xptrail-acquired', true);
                        _DisplayXpTrailRemainingTime(oXpData.xp_trail_remaining);
                        const elHonorIcon = _m_cP.FindChildTraverse('jsHonorIcon');
                        elHonorIcon.Set(xp_trail_level, false);
                    }
                });
            }
            return duration;
        }
        ;
        totalXP += oXpData.current_xp;
        for (let elem of oXpData.xp_progress_data) {
            let xp = elem.xp_points;
            let key = elem.xp_category;
            if (totalXP + xp < xPPerLevel) {
                arrPreRankXP.push({ reason: key, xp: xp });
            }
            else {
                let xp_upto = xPPerLevel - totalXP;
                let xp_remainder = totalXP + xp - xPPerLevel;
                if (xp_upto > 0) {
                    arrPreRankXP.push({ reason: key, xp: xp_upto });
                    arrPostRankXP.push({ reason: key, xp: xp_remainder });
                }
                else
                    arrPostRankXP.push({ reason: key, xp: xp });
            }
            totalXP += xp;
        }
        const xpTrailXpPosition = totalXP + (oXpData.hasOwnProperty('xp_trail_xp_needed') ? Number(oXpData.xp_trail_xp_needed) : 0);
        function _AnimSequenceNext(func, duration = 0) {
            $.Schedule(animTime, func);
            animTime += duration;
        }
        let _AnimPause = function (sec) {
            animTime += sec;
        };
        let animTime = 0;
        _AnimPause(1.0);
        function _PlaceXpTrail(xp) {
            const elHonorIcon = _m_cP.FindChildTraverse('jsHonorIcon');
            elHonorIcon.Set(xp_trail_level, false);
            _m_cP.SetHasClass('xptrail-enabled', xp >= 0);
            if (xp < 0)
                return;
            const XpTrail_pct = (xp / xPPerLevel * 100) - 2;
            elHonorIcon.style.x = (XpTrail_pct) + '%;';
        }
        function _DisplayXpTrailRemainingTime(xp_trail_remaining) {
            _m_cP.SetHasClass('xptrail-remaining-time-enabled', (xp_trail_remaining != undefined) && (xp_trail_remaining > 0));
            _m_cP.SetDialogVariable('xp-trail-remaining', FormatText.SecondsToSignificantTimeString(xp_trail_remaining).toLowerCase());
        }
        if (oXpData.current_xp > 0) {
            const xpToXpTrailEvent = ((xpTrailXpPosition > 0) && (xpTrailXpPosition <= oXpData.current_xp)) ? xpTrailXpPosition : -1;
            _AnimPause(_AddXPBar("old", oXpData.current_xp, xpToXpTrailEvent));
        }
        const xpToXpTrailEvent = xpTrailXpPosition <= 5000 ? xpTrailXpPosition : -1;
        _PlaceXpTrail(xpToXpTrailEvent);
        const DelayXpTrailAnnounce = xpTrailXpPosition > 0 && xpTrailXpPosition <= totalXP;
        if (!DelayXpTrailAnnounce)
            _DisplayXpTrailRemainingTime(oXpData.xp_trail_remaining);
        for (let i = 0; i < arrPreRankXP.length; i++) {
            _AnimPause(1.0);
            if (arrPreRankXP[i].xp > 0) {
                const xpToXpTrailEvent = ((xpTrailXpPosition > currentXpPointer) && (xpTrailXpPosition <= currentXpPointer + arrPreRankXP[i].xp)) ? xpTrailXpPosition - currentXpPointer : -1;
                _AnimPause(_AddXPBar(arrPreRankXP[i].reason, arrPreRankXP[i].xp, xpToXpTrailEvent));
            }
        }
        if (totalXP >= xPPerLevel) {
            let elRankEarnedCarePackagefx = _m_cP.FindChildInLayoutFile("id-eom-rank_carepackage_earned_effects");
            let elRankCarePackageBgfx = _m_cP.FindChildInLayoutFile("id-eom-rank_carepackage_bg_effects");
            _AnimSequenceNext(() => {
                if (!elProgress || !elProgress.IsValid())
                    return;
                $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.XP.BarFull', 'eom-rank');
                elProgress.FindChildInLayoutFile('id-eom-rank-bar-white').AddClass('eom-rank__bar--white--show');
                if (earnedFreeRewards > 0) {
                    elRankCarePackageBgfx.SetParticleNameAndRefresh("particles/ui/rank_carepackage_bg_base.vpcf");
                    elRankCarePackageBgfx.SetControlPoint(3, 0, 0, 1);
                    elRankCarePackageBgfx.StartParticles();
                }
            }, 1);
            if (earnedFreeRewards > 0) {
                _AnimSequenceNext(() => {
                    if (!_m_cP || !_m_cP.IsValid())
                        return;
                    let elCarePackage = _m_cP.FindChildTraverse('jsEomCarePackage');
                    $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.tab_mainmenu_shop', 'eom-rank');
                    elCarePackage.AddClass('earned-rewards');
                    elRankEarnedCarePackagefx.SetParticleNameAndRefresh("particles/ui/rank_carepackage_recieve.vpcf");
                    elRankEarnedCarePackagefx.SetControlPoint(3, 0, 0, 1);
                }, 2);
            }
            _AnimSequenceNext(() => {
                if (!elProgress || !elProgress.IsValid() ||
                    !elCurrent || !elCurrent.IsValid() ||
                    !elBar || !elBar.IsValid() ||
                    !elNew || !elNew.IsValid() ||
                    !elCurrent || !elCurrent.IsValid())
                    return;
                $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.XP.NewRank', 'eom-rank');
                elBar.FindChildrenWithClassTraverse("eom-rank__bar__segment").forEach(entry => entry.DeleteAsync(.0));
                elRankCarePackageBgfx.StopParticlesWithEndcaps();
                elCurrent.SetDialogVariableInt("level", newRank);
                elCurrent.SetDialogVariable('name', $.Localize('#XP_RankName_' + newRank, elCurrent));
                _m_cP.SetDialogVariable('rank_new', $.Localize('#XP_RankName_Display', elCurrent));
                _m_cP.FindChildInLayoutFile("id-eom-rank__current__label").text = $.Localize("{s:rank_new}", elCurrent);
                _m_cP.FindChildInLayoutFile("id-eom-rank__current__emblem").SetImage("file://{images}/icons/xp/level" + newRank + ".png");
                elNew.RemoveClass("hidden");
                elNew.FindChildInLayoutFile('id-eom-new-reveal-image').SetImage("file://{images}/icons/xp/level" + newRank + ".png");
                elNew.TriggerClass("eom-rank-new-reveal--anim");
                let elParticleEffect = elNew.FindChildInLayoutFile('id-eom-new-reveal-flare');
                let aParticleSettings = RankSkillgroupParticles.GetRankParticleSettings(newRank);
                elParticleEffect.SetParticleNameAndRefresh(aParticleSettings.particleName);
                elParticleEffect.SetControlPoint(aParticleSettings.cpNumber, aParticleSettings.cpValue[0], aParticleSettings.cpValue[1], aParticleSettings.cpValue[2]);
                elParticleEffect.StartParticles();
            }, 3);
            _AnimSequenceNext(() => {
                if (!_m_cP || !_m_cP.IsValid())
                    return;
                const xpToXpTrailEvent = xpTrailXpPosition > 5000 && xpTrailXpPosition <= 10000 ? xpTrailXpPosition - 5000 : -1;
                _PlaceXpTrail(xpToXpTrailEvent);
            });
            _AnimSequenceNext(() => {
                if (!elProgress || !elProgress.IsValid() ||
                    !elCurrent || !elCurrent.IsValid() ||
                    !elBar || !elBar.IsValid() ||
                    !elNew || !elNew.IsValid() ||
                    !elCurrent || !elCurrent.IsValid())
                    return;
                elProgress.FindChildInLayoutFile('id-eom-rank-bar-white').RemoveClass('eom-rank__bar--white--show');
            });
            for (let i = 0; i < arrPostRankXP.length; i++) {
                const xpToXpTrailEvent = ((xpTrailXpPosition > currentXpPointer) && (xpTrailXpPosition <= currentXpPointer + arrPostRankXP[i].xp)) ? xpTrailXpPosition - currentXpPointer : -1;
                _AnimPause(_AddXPBar(arrPostRankXP[i].reason, arrPostRankXP[i].xp, xpToXpTrailEvent));
            }
            _AnimPause(2.0);
        }
        _AnimSequenceNext(() => {
        }, 1);
        let oXpShopData = MockAdapter.XPShopDataJSO(_m_cP);
        if (oXpShopData && oXpShopData.hasOwnProperty('prematch')) {
            const elRoot = _m_cP.FindChildTraverse('jsXpShopTrackRoot');
            const elXpShopContainer = _m_cP.FindChildTraverse('jsXpShopTrackContainer');
            oXpShopData.prematch.xp_tracks.forEach(function (track, idx) {
                const elTrack = $.CreatePanel('Panel', elXpShopContainer, 'id-xpshop_track_' + idx);
                elTrack.BLoadLayout('file://{resources}/layout/xpshop_track.xml', false, false);
                XpShopTrack.XpShopInit({
                    xpshop_track_frame_panel: elTrack,
                    xpshop_track_value: track,
                });
            });
            _AnimSequenceNext(() => {
                if (elRoot && elRoot.IsValid())
                    elRoot.AddClass('reveal');
            }, 0.3);
            if (oXpShopData.hasOwnProperty('postmatch')) {
                _AnimPause(1.0);
                _AnimSequenceNext(() => {
                    oXpShopData.postmatch.xp_tracks.forEach(function (track, idx) {
                        const elTrack = (elXpShopContainer && elXpShopContainer.IsValid()) ? elXpShopContainer.FindChildTraverse('id-xpshop_track_' + idx) : undefined;
                        if (elTrack) {
                            XpShopTrack.XpShopUpdate({
                                xpshop_track_frame_panel: elTrack,
                                xpshop_track_value: track,
                            });
                        }
                    });
                }, 2);
            }
        }
        _m_pauseBeforeEnd += animTime;
        return true;
    }
    ;
    function Start() {
        if (MockAdapter.GetMockData() && !MockAdapter.GetMockData().includes('RANK')) {
            _End();
            return;
        }
        if (_DisplayMe()) {
            EndOfMatch.SwitchToPanel('eom-rank');
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
            name: 'eom-rank',
            Start: Start,
            Shutdown: Shutdown
        });
    }
})(EOM_Rank || (EOM_Rank = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5kb2ZtYXRjaC1yYW5rLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvZW5kb2ZtYXRjaC1yYW5rLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFDbEMsNkNBQTZDO0FBQzdDLHdDQUF3QztBQUN4Qyx3Q0FBd0M7QUFDeEMscURBQXFEO0FBQ3JELHNDQUFzQztBQVN0QyxJQUFVLFFBQVEsQ0FrZ0JqQjtBQWxnQkQsV0FBVSxRQUFRO0lBRWpCLElBQUksaUJBQWlCLEdBQUcsR0FBRyxDQUFDO0lBQzVCLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQTZCLENBQUM7SUFFN0QsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7SUFFM0IsU0FBUyxVQUFVO1FBRWxCLElBQUssQ0FBQyxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFO1lBQzlCLE9BQU87UUFFUixJQUFLLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBRSxLQUFLLENBQUU7WUFDdEMsT0FBTyxLQUFLLENBQUM7UUFFZCxJQUFLLFlBQVksQ0FBQyxnQkFBZ0IsRUFBRSxLQUFLLFVBQVU7WUFDbEQsT0FBTyxLQUFLLENBQUM7UUFFZCxJQUFJLFVBQVUsR0FBRyxZQUFZLENBQUMsYUFBYSxFQUFFLENBQUM7UUFFOUMsSUFBSSxPQUFPLEdBQUcsV0FBVyxDQUFDLFNBQVMsQ0FBRSxLQUFLLENBQUUsQ0FBQztRQUU3QyxJQUFLLENBQUMsT0FBTztZQUNaLE9BQU8sS0FBSyxDQUFDO1FBTWQsTUFBTSxTQUFTLEdBQUcsWUFBWSxDQUFDLGtCQUFrQixFQUFFLENBQUM7UUFDcEQsTUFBTSx1QkFBdUIsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFFLEdBQUcsQ0FBRSxDQUFDLFFBQVEsQ0FBRSxHQUFHLENBQUUsQ0FBQztRQUN2RSxNQUFNLGlCQUFp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