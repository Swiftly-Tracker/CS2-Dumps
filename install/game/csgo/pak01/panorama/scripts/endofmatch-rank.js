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
        $.Msg('endofmatch-rank.js -- xp data = ');
        $.Msg(JSON.stringify(oXpData));
        // care package
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
        let arrPreRankXP = []; // array of xp earned before rank up
        let arrPostRankXP = []; // array of xp earned after rank up
        let totalXP = 0;
        let maxLevel = InventoryAPI.GetMaxLevel();
        let elPanel = _m_cP.FindChildTraverse('id-eom-rank__current');
        elPanel.TriggerClass('show');
        _m_cP.AddClass('eom-rank-show');
        // current rank
        let currentRank = oXpData.current_level;
        currentRank = currentRank < maxLevel ? currentRank : maxLevel;
        elCurrent.SetDialogVariableInt("level", currentRank);
        elCurrent.SetDialogVariable('name', $.Localize('#XP_RankName_' + currentRank, elCurrent));
        _m_cP.FindChildInLayoutFile("id-eom-rank__current__emblem").SetImage("file://{images}/icons/xp/level" + currentRank + ".png");
        // next rank
        const newRank = currentRank < maxLevel ? (currentRank + 1) : maxLevel;
        let elCurrentListerItem;
        let _xpSoundNum = 1;
        let currentXpPointer = 0;
        function _AddXPBar(reason, xp, xpToXpTrailEvent = -1) {
            // add a progress bar segment and line item to the lister
            const sPerXp = 0.0005;
            const duration = sPerXp * xp;
            const sPerSoundTick = 0.082;
            for (let t = sPerSoundTick; t < duration; t += sPerSoundTick) {
                $.Schedule(animTime + t, () => $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.XP.Ticker', 'eom-rank'));
            }
            /////////////////////////////
            $.Schedule(animTime, () => {
                if (!elBar.IsValid())
                    return 0;
                let elRankSegment = $.CreatePanel('Panel', elBar, 'id-eom-rank__bar__segment');
                elRankSegment.AddClass("eom-rank__bar__segment");
                // move the lister to follow the bar
                elBar.MoveChildAfter(elRankLister, elRankSegment);
                // color
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
                // diminish the previous item
                if (elCurrentListerItem) {
                    elCurrentListerItem.AddClass("eom-rank__lister__item--old");
                }
                // add a lister item
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
            ///// XP TRAIL
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
        // insert existing xp
        totalXP += oXpData.current_xp;
        // insert new xp
        for (let elem of oXpData.xp_progress_data) {
            let xp = elem.xp_points;
            let key = elem.xp_category;
            // sort xp by whether it's before or after a rank up event
            if (totalXP + xp < xPPerLevel) {
                arrPreRankXP.push({ reason: key, xp: xp });
            }
            else {
                let xp_upto = xPPerLevel - totalXP;
                let xp_remainder = totalXP + xp - xPPerLevel;
                // we just crossed the rank limit so split the xp into pre and post
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
        // NOW SCHEDULE ALL OF THE ANIMATIONS
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
            // honor icon
            const elHonorIcon = _m_cP.FindChildTraverse('jsHonorIcon');
            elHonorIcon.Set(xp_trail_level, false);
            _m_cP.SetHasClass('xptrail-enabled', xp >= 0);
            if (xp < 0)
                return;
            const XpTrail_pct = (xp / xPPerLevel * 100) - 2;
            elHonorIcon.style.x = (XpTrail_pct) + '%;';
            $.Msg(xp + ' ' + xPPerLevel + ' ' + (xpTrailXpPosition / xPPerLevel * 100) + '%;');
        }
        function _DisplayXpTrailRemainingTime(xp_trail_remaining) {
            _m_cP.SetHasClass('xptrail-remaining-time-enabled', (xp_trail_remaining != undefined) && (xp_trail_remaining > 0));
            _m_cP.SetDialogVariable('xp-trail-remaining', FormatText.SecondsToSignificantTimeString(xp_trail_remaining).toLowerCase());
        }
        // EXISTING XP
        if (oXpData.current_xp > 0) {
            const xpToXpTrailEvent = ((xpTrailXpPosition > 0) && (xpTrailXpPosition <= oXpData.current_xp)) ? xpTrailXpPosition : -1;
            _AnimPause(_AddXPBar("old", oXpData.current_xp, xpToXpTrailEvent));
        }
        // place the xp trail on the current bar?
        const xpToXpTrailEvent = xpTrailXpPosition <= 5000 ? xpTrailXpPosition : -1;
        _PlaceXpTrail(xpToXpTrailEvent);
        // is the bar going to pass the overdrive icon? if so, wait until it does. Otherwise, display overdrive immediately.
        const DelayXpTrailAnnounce = xpTrailXpPosition > 0 && xpTrailXpPosition <= totalXP;
        if (!DelayXpTrailAnnounce)
            _DisplayXpTrailRemainingTime(oXpData.xp_trail_remaining);
        // NEW XP
        for (let i = 0; i < arrPreRankXP.length; i++) {
            _AnimPause(1.0);
            if (arrPreRankXP[i].xp > 0) {
                const xpToXpTrailEvent = ((xpTrailXpPosition > currentXpPointer) && (xpTrailXpPosition <= currentXpPointer + arrPreRankXP[i].xp)) ? xpTrailXpPosition - currentXpPointer : -1;
                _AnimPause(_AddXPBar(arrPreRankXP[i].reason, arrPreRankXP[i].xp, xpToXpTrailEvent));
            }
        }
        // NEW RANK?
        if (totalXP >= xPPerLevel) {
            let elRankEarnedCarePackagefx = _m_cP.FindChildInLayoutFile("id-eom-rank_carepackage_earned_effects");
            let elRankCarePackageBgfx = _m_cP.FindChildInLayoutFile("id-eom-rank_carepackage_bg_effects");
            // SHINE ON
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
            // CARE PACKAGE?
            if (earnedFreeRewards > 0) {
                _AnimSequenceNext(() => {
                    if (!_m_cP || !_m_cP.IsValid())
                        return;
                    let elCarePackage = _m_cP.FindChildTraverse('jsEomCarePackage');
                    $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.tab_mainmenu_shop', 'eom-rank');
                    elCarePackage.AddClass('earned-rewards');
                    //particles/ui/ui_circle_play.vpcf
                    //"particles/ui/ui_mainmenu_nav_play.vpcf"
                    elRankEarnedCarePackagefx.SetParticleNameAndRefresh("particles/ui/rank_carepackage_recieve.vpcf");
                    elRankEarnedCarePackagefx.SetControlPoint(3, 0, 0, 1);
                }, 2);
            }
            // NEW RANK
            // Clear and set the new progress bar
            _AnimSequenceNext(() => {
                if (!elProgress || !elProgress.IsValid() ||
                    !elCurrent || !elCurrent.IsValid() ||
                    !elBar || !elBar.IsValid() ||
                    !elNew || !elNew.IsValid() ||
                    !elCurrent || !elCurrent.IsValid())
                    return;
                $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.XP.NewRank', 'eom-rank');
                // Clear segments
                elBar.FindChildrenWithClassTraverse("eom-rank__bar__segment").forEach(entry => entry.DeleteAsync(.0));
                //Reset Background Particles
                elRankCarePackageBgfx.StopParticlesWithEndcaps();
                // Update shown current rank to new one
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
                //returns { particleName: sParticlelevel0, cpNumber: 3, cpValue: [ 1, 0, 1 ], playEndcap: false },
                elParticleEffect.SetParticleNameAndRefresh(aParticleSettings.particleName);
                elParticleEffect.SetControlPoint(aParticleSettings.cpNumber, aParticleSettings.cpValue[0], aParticleSettings.cpValue[1], aParticleSettings.cpValue[2]);
                elParticleEffect.StartParticles();
            }, 3);
            // do we want to show an xp trail icon on this bar?
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
            //	MORE NEW XP?
            for (let i = 0; i < arrPostRankXP.length; i++) {
                const xpToXpTrailEvent = ((xpTrailXpPosition > currentXpPointer) && (xpTrailXpPosition <= currentXpPointer + arrPostRankXP[i].xp)) ? xpTrailXpPosition - currentXpPointer : -1;
                _AnimPause(_AddXPBar(arrPostRankXP[i].reason, arrPostRankXP[i].xp, xpToXpTrailEvent));
            }
            _AnimPause(2.0);
        }
        // fade bar
        _AnimSequenceNext(() => {
            // elProgress.AddClass( "eom-fade-away" );
        }, 1);
        // xp shop
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
            }, 
            // 	should match:
            // 	animation-name: xpshop - reveal;
            // 	animation-duration: 0.5s;
            0.3);
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
        // $( '#id-eom-new-reveal-flare' ).StopParticlesWithEndcaps();
    }
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        EndOfMatch.RegisterPanelObject({
            name: 'eom-rank',
            Start: Start,
            Shutdown: Shutdown
        });
    }
})(EOM_Rank || (EOM_Rank = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5kb2ZtYXRjaC1yYW5rLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvZW5kb2ZtYXRjaC1yYW5rLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFDbEMsNkNBQTZDO0FBQzdDLHdDQUF3QztBQUN4Qyx3Q0FBd0M7QUFDeEMscURBQXFEO0FBQ3JELHNDQUFzQztBQVN0QyxJQUFVLFFBQVEsQ0FrZ0JqQjtBQWxnQkQsV0FBVSxRQUFRO0lBRWpCLElBQUksaUJBQWlCLEdBQUcsR0FBRyxDQUFDO0lBQzVCLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQTZCLENBQUM7SUFFN0QsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7SUFFM0IsU0FBUyxVQUFVO1FBRWxCLElBQUssQ0FBQyxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFO1lBQzlCLE9BQU87UUFFUixJQUFLLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBRSxLQUFLLENBQUU7WUFDdEMsT0FBTyxLQUFLLENBQUM7UUFFZCxJQUFLLFlBQVksQ0FBQyxnQkFBZ0IsRUFBRSxLQUFLLFVBQVU7WUFDbEQsT0FBTyxLQUFLLENBQUM7UUFFZCxJQUFJLFVBQVUsR0FBRyxZQUFZLENBQUMsYUFBYSxFQUFFLENBQUM7UUFFOUMsSUFBSSxPQUFPLEdBQUcsV0FBVyxDQUFDLFNBQVMsQ0FBRSxLQUFLLENBQUUsQ0FBQztRQUU3QyxJQUFLLENBQUMsT0FBTztZQUNaLE9BQU8sS0FBSyxDQUFDO1FBRWQsQ0FBQyxDQUFDLEdBQUcsQ0FBRSxrQ0FBa0MsQ0FBRSxDQUFDO1FBQzVDLENBQUMsQ0FBQyxHQUFHLENBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBRSxPQUFPLENBQUUsQ0FBRSxDQUFDO1FBRW5DLGVBQWU7UUFDZixNQUFNLFNBQVMsR0FBRyxZQUFZLENB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