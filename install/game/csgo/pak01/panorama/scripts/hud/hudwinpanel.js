"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../avatar.ts" />
/// <reference path="../digitpanel.ts" />
/// <reference path="../particle_controls.ts" />
/// <reference path="../common/formattext.ts" />
/// <reference path="../common/scheduler.ts" />
/// <reference path="../common/teamcolor.ts" />
/// <reference path="../hud/hudwinpanel_background_map.ts" />
var HudWinPanel;
(function (HudWinPanel) {
    // function MVPParticleSystem ( panelId: string, particlename : string , cp15 :  [ x:number , y: number , z:number ] ): void
    // {
    let _m_elCanvas; // the canvas we draw the line on
    let _m_elPlotContainer; // a panel that sits over the canvas and where we add the icons and text.
    // We use a separate panel so we can animate them separately.
    let _m_canvasHeightInPixels;
    let _m_canvasWidthInPixels;
    let _m_teamPerspective;
    let _m_localXuid;
    let _m_timeslice;
    let _m_bInit = false;
    let _m_xRange;
    let _m_prevChance; // for tracking delta;
    let _m_ListeningForGameEvents = false;
    let _m_bCanvasIsReady = false;
    // separating events into categories
    let _m_arrTimelineEvents = [];
    let _m_arrPersonalDamageEvents = [];
    let _m_winningTeam;
    const TOTAL_TIME_REVEAL = 5; // should match .show-canvas
    const BEAM_ONLY_ON_DAMAGE = false;
    function _Init() {
        if (_m_bInit)
            return;
        $.RegisterForUnhandledEvent('HudWinPanel_ShowRoundEndReport', _ShowRoundEndReport);
        $.RegisterForUnhandledEvent('Player_Hurt', _OnReceivePlayerHurt);
        $.RegisterForUnhandledEvent('Player_Death', _OnReceivePlayerDeath);
        _m_bInit = true;
    }
    function _SetMVP(xuid, reason, team) {
        $.Msg(`_SetMVP ${xuid} ${reason} ${team}`);
        const avatar = $("#MVPAvatar");
        avatar.PopulateFromPlayerSlot(GameStateAPI.GetPlayerSlot(xuid));
        avatar.SetHasClass("team--TERRORIST", team === 2);
        avatar.SetHasClass("team--CT", team === 3);
        $.GetContextPanel().SetDialogVariableInt('player_slot', GameStateAPI.GetPlayerSlot(xuid));
        let sMvpReasonToken = "#Panorama_winpanel_mvp_award";
        let elMapContainer = $.GetContextPanel().FindChildInLayoutFile('id-match-mvp-map-container');
        MvpBackgroundMap.SetUpMapWinPanel(xuid, reason, team, elMapContainer);
        switch (reason) {
            case 1: // CSMVP_ELIMINATION
                sMvpReasonToken = "#Panorama_winpanel_mvp_award_kills";
                break;
            case 2: // CSMVP_BOMBPLANT
                sMvpReasonToken = "#Panorama_winpanel_mvp_award_bombplant";
                break;
            case 3: // CSMVP_BOMBDEFUSE
                sMvpReasonToken = "#Panorama_winpanel_mvp_award_bombdefuse";
                break;
            case 4: // CSMVP_HOSTAGERESCUE
                sMvpReasonToken = "#Panorama_winpanel_mvp_award_rescue";
                break;
            case 5: // CSMVP_GUNGAMEWINNER
                sMvpReasonToken = "#Panorama_winpanel_mvp_award_gungame";
                break;
            case 7: // CSMVP_SURVIVALSURVIVOR
                sMvpReasonToken = "#Panorama_winpanel_mvp_winner";
                break;
            case 9: // CSMVP_ACEROUND
                sMvpReasonToken = "#Panorama_winpanel_mvp_award_ace";
                break;
            case 10: // CSMVP_BURNDAMAGE
                sMvpReasonToken = "#Panorama_winpanel_mvp_award_inferno";
                break;
            case 11: //CSMVP_NADEDAMAGE
                sMvpReasonToken = "#Panorama_winpanel_mvp_award_blast";
                break;
            case 12: // CSMVP_MotionGraphyTest
                sMvpReasonToken = "#Panorama_winpanel_mvp_winner";
                break;
            case 13: // CSMVP_MotionGraphyTest
                sMvpReasonToken = "#Panorama_winpanel_mvp_award_bombplant_clutch";
                break;
            case 14: // CSMVP_MotionGraphyTest
                sMvpReasonToken = "#Panorama_winpanel_mvp_award_bombdefuse_clutch";
                break;
            case 15:
                sMvpReasonToken = "#Panorama_winpanel_mvp_award_kills_three";
                break;
            case 16:
                sMvpReasonToken = "#Panorama_winpanel_mvp_award_kills_four";
                break;
        }
        $.GetContextPanel().SetDialogVariable("mvp_name_and_reason", $.Localize(sMvpReasonToken, $.GetContextPanel()));
        const jsHonorIcon = $("#jsHonorIcon");
        jsHonorIcon.Set(GameStateAPI.GetPlayerXpTrailLevel(xuid), false);
    }
    function _OnReceivePlayerHurt(attackerXuid, victimXuid, damage) {
        if (!_m_ListeningForGameEvents)
            return;
        // we recieved this message after the report message but before we're ready to display it. Retry in a 0.5s
        if (!_m_bCanvasIsReady) {
            $.Msg("-- deferred _OnReceivePlayerHurt");
            $.Schedule(0.5, () => _OnReceivePlayerHurt(attackerXuid, victimXuid, damage));
            return;
        }
        // we only care about damage if it relates to the local player
        if (_m_localXuid != attackerXuid && _m_localXuid != victimXuid)
            return;
        const wasDamageGiven = _m_localXuid == attackerXuid;
        const healthRemoved = wasDamageGiven ? damage : 0;
        const numHits = wasDamageGiven ? 1 : 0;
        const returnedHealthRemoved = wasDamageGiven ? 0 : damage;
        const returnHits = wasDamageGiven ? 0 : 1;
        _UpdateDamage(wasDamageGiven ? victimXuid : attackerXuid, healthRemoved, numHits, returnedHealthRemoved, returnHits);
    }
    function _OnReceivePlayerDeath(xuid) {
        if (!_m_ListeningForGameEvents)
            return;
        // we recieved this message after the report message but before we're ready to display it. Retry in a 0.5s
        if (!_m_bCanvasIsReady) {
            $.Msg("-- deferred _OnReceivePlayerDeath");
            $.Schedule(0.5, () => _OnReceivePlayerDeath(xuid));
            return;
        }
        const elEvent = $.GetContextPanel().FindChildTraverse('Event-' + xuid);
        if (!elEvent)
            return;
        const elDeath = elEvent.FindChildTraverse('Death');
        if (!elDeath)
            return;
        elDeath.visible = true;
    }
    function _TransformPointIntoCanvasSpace(point) {
        const denom = _m_xRange;
        const x = _m_canvasWidthInPixels / denom * point[0];
        const y = _m_canvasHeightInPixels - (_m_canvasHeightInPixels / 100 * point[1]);
        return [x, y];
    }
    function _FlipY(plotPoint) {
        return [plotPoint[0], _m_canvasHeightInPixels - plotPoint[1]];
    }
    function _ConvertToLocalOdds(terroristOdds) {
        if (_m_teamPerspective == 2)
            return terroristOdds;
        else
            return (100 - terroristOdds);
    }
    function _ShowRoundEndReport(msg) {
        if (!msg)
            return;
        // reset the display
        _Reset();
        _m_ListeningForGameEvents = true;
        // we need to know the canvas size to proceed, so let it init.
        if (!_m_elCanvas.IsSizeValid()) {
            $.Msg("-- deferred _ShowRoundEndReport");
            $.Schedule(0.5, () => _ShowRoundEndReport.bind(msg));
            return;
        }
        _m_bCanvasIsReady = true;
        // set the title
        $.GetContextPanel().SetDialogVariable('player_name', GameStateAPI.GetPlayerName(_m_localXuid));
        // now we can record dimensions
        _m_canvasHeightInPixels = _m_elCanvas.actuallayoutheight / _m_elCanvas.actualuiscale_y;
        _m_canvasWidthInPixels = _m_elCanvas.actuallayoutwidth / _m_elCanvas.actualuiscale_x;
        const oInitialConditions = msg.init_conditions;
        //plot the starting probability
        const nStartingOdds = oInitialConditions.terrorist_odds;
        const arrEvents = msg.all_rer_event_data;
        _m_arrTimelineEvents = _ExtractTimelineEvents(arrEvents);
        _m_arrPersonalDamageEvents = _ExtractLivingEnemies(arrEvents);
        _m_winningTeam = '';
        if (_m_arrTimelineEvents.length > 0) {
            const FinalTOdds = _m_arrTimelineEvents[_m_arrTimelineEvents.length - 1]['terrorist_odds'];
            _m_winningTeam = FinalTOdds == 100 ? 2 : FinalTOdds == 0 ? 3 : '';
        }
        _m_xRange = _m_arrTimelineEvents.length + _m_arrPersonalDamageEvents.length + 1.5;
        _m_timeslice = TOTAL_TIME_REVEAL / _m_xRange;
        const x = 0;
        const y = _ConvertToLocalOdds(nStartingOdds);
        const startPoint = [x, y];
        const startPlotPoint = _TransformPointIntoCanvasSpace(startPoint);
        const points = [];
        points.push(startPoint);
        const plotPoints = [];
        plotPoints.push(startPlotPoint);
        _PlotStartingOdds(nStartingOdds, startPlotPoint);
        _ProcessTimelineEvents(_m_arrTimelineEvents, points, plotPoints, nStartingOdds);
        const finalPoint = points[points.length - 1];
        _ProcessDamageEvents(_m_arrPersonalDamageEvents, finalPoint[0]);
        // draw the graph line
        const bCT = _m_teamPerspective == 3;
        const drawColor = bCT ? '#B5D4EEaa' : '#EAD18Aaa';
        _m_elCanvas.DrawSoftLinePointsJS(plotPoints.length, plotPoints.flat(), 4, 1.0, drawColor);
        _m_elCanvas.TriggerClass('show-canvas');
        // separate the display
        const graphWidth = (_m_arrTimelineEvents.length) / _m_xRange * 100;
        const elGraphGuides = $.GetContextPanel().FindChildTraverse('GraphGuides');
        elGraphGuides.style.width = graphWidth + "%";
        const elLivingBG = $.GetContextPanel().FindChildTraverse('LivingBG');
        elLivingBG.style.width = 100 - graphWidth + "%";
        _Colorize();
        // shut it down 1 second before the end of freezetime
        const freezetime = Number(GameInterfaceAPI.GetSettingString('mp_freezetime'));
        const roundRestartDelay = Number(GameInterfaceAPI.GetSettingString('mp_round_restart_delay'));
        const shutdownDelay = roundRestartDelay + freezetime - 1;
        Scheduler.Schedule(shutdownDelay, () => {
            _m_ListeningForGameEvents = false;
            _m_bCanvasIsReady = false;
        });
    }
    function _ExtractTimelineEvents(arrEvents) {
        const arrResults = [];
        for (let oEvent of arrEvents) {
            const oVictimData = oEvent['victim_data'];
            const isLivingPlayer = oVictimData && !oVictimData['is_dead'];
            if (!isLivingPlayer)
                arrResults.push(oEvent);
        }
        return arrResults;
    }
    function _ExtractLivingEnemies(arrEvents) {
        const arrResults = [];
        for (let oEvent of arrEvents) {
            const oVictimData = oEvent['victim_data'];
            const isLivingPlayer = oVictimData && !oVictimData['is_dead'];
            const localTeam = GameStateAPI.GetAssociatedTeamNumber(_m_localXuid);
            const isEnemy = oVictimData && oVictimData['team_number'] != localTeam && (localTeam == 2 || localTeam == 3);
            if (isLivingPlayer && isEnemy)
                arrResults.push(oEvent);
        }
        return arrResults;
    }
    function _ProcessTimelineEvents(arrEvents, points, plotPoints, nStartingOdds) {
        let loopingSfxHandle = null;
        // go through all of the events and plot them
        for (let index = 0; index < arrEvents.length; ++index) {
            const oEvent = arrEvents[index];
            const x = index + 1;
            const y = _ConvertToLocalOdds(oEvent['terrorist_odds']);
            const point = [x, y];
            const plotPoint = _TransformPointIntoCanvasSpace(point);
            points.push(point);
            plotPoints.push(plotPoint);
            let delta = 0;
            // play the line sfx
            if (index == 0)
                delta = oEvent['terrorist_odds'] - nStartingOdds;
            else
                delta = oEvent['terrorist_odds'] - arrEvents[index - 1]['terrorist_odds'];
            const sfx = delta < 0 ? "UIPanorama.round_report_line_down" : "UIPanorama.round_report_line_up";
            const delay = index * _m_timeslice;
            Scheduler.Schedule(delay, () => {
                _AddDamageToDamagePanel(oEvent, plotPoint);
                _DecoratePoint(oEvent, plotPoint);
                if (loopingSfxHandle)
                    UiToolkitAPI.StopSoundEvent(loopingSfxHandle, 0.1);
                loopingSfxHandle = UiToolkitAPI.PlaySoundEvent(sfx);
            });
        }
        // kill the last looping sound at the end of the graph
        Scheduler.Schedule(_m_arrTimelineEvents.length * _m_timeslice, () => {
            if (loopingSfxHandle)
                UiToolkitAPI.StopSoundEvent(loopingSfxHandle, 0.1);
        });
    }
    function _ProcessDamageEvents(arrEvents, startX) {
        // go through all of the events and plot them
        for (let index = 0; index < arrEvents.length; ++index) {
            const oEvent = arrEvents[index];
            const x = startX + index + 1;
            const y = 50;
            const plotPoint = _TransformPointIntoCanvasSpace([x, y]);
            const delay = (_m_arrTimelineEvents.length + index) * _m_timeslice;
            Scheduler.Schedule(delay, () => {
                _AddDamageToDamagePanel(oEvent, plotPoint);
                _DecoratePoint(oEvent, plotPoint);
            });
        }
    }
    function _Colorize() {
        const bCT = _m_winningTeam == 3;
        for (let el of $.GetContextPanel().FindChildrenWithClassTraverse('team-colorize')) {
            el.SetHasClass('color-ct', bCT);
            el.SetHasClass('color-t', !bCT);
        }
    }
    function _FindDamageDataForPlayer(oEvent, xuid) {
        const oDamageData = oEvent.all_damage_data;
        // we're going to merge attack and defend damage events
        const returnObj = {};
        for (let i = 0; i < oDamageData.length; i++) {
            if (oDamageData[i].other_xuid.toString() == xuid)
                Object.assign(returnObj, oDamageData[i]);
        }
        return returnObj;
    }
    function _UpdateDamage(xuid, healthRemoved, numHits, returnHealthRemoved, returnHits) {
        const elDamage = $.GetContextPanel().FindChildTraverse('Damage-' + xuid);
        if (!elDamage)
            return;
        elDamage.healthRemoved += healthRemoved;
        elDamage.healthRemoved = Math.min(elDamage.healthRemoved, 100);
        elDamage.numHits += numHits;
        elDamage.returnHealthRemoved += returnHealthRemoved;
        elDamage.returnHealthRemoved = Math.min(elDamage.returnHealthRemoved, 100);
        elDamage.returnHits += returnHits;
        if ((elDamage.returnHealthRemoved > 0) || (elDamage.healthRemoved > 0)) {
            const elDGiven = elDamage.FindChildTraverse('DamageGiven');
            const elDTaken = elDamage.FindChildTraverse('DamageTaken');
            elDGiven.SetDialogVariable('health_removed', elDamage.healthRemoved.toString());
            elDGiven.SetDialogVariable('num_hits', elDamage.numHits.toString());
            elDTaken.SetDialogVariable('health_removed', elDamage.returnHealthRemoved.toString());
            elDTaken.SetDialogVariable('num_hits', elDamage.returnHits.toString());
            elDGiven.visible = elDamage.healthRemoved > 0;
            elDTaken.visible = elDamage.returnHealthRemoved > 0;
            if (BEAM_ONLY_ON_DAMAGE) {
                const elTeamColorBar = $.GetContextPanel().FindChildTraverse('bar-' + xuid);
                if (elTeamColorBar) {
                    elTeamColorBar.RemoveClass('prereveal');
                }
            }
            const dmgDelay = 0.1;
            Scheduler.Schedule(dmgDelay, () => {
                if (elDamage && elDamage.IsValid())
                    elDamage.RemoveClass('prereveal');
            });
        }
    }
    function _AddDamageToDamagePanel(oEvent, plotPoint) {
        const elDamageContainer = $.GetContextPanel().FindChildTraverse('DamageContainer');
        const oDamage = _FindDamageDataForPlayer(oEvent, _m_localXuid);
        const victimData = oEvent['victim_data'];
        const objectiveData = oEvent['objective_data'];
        if (objectiveData)
            return;
        const elDamage = $.CreatePanel('Panel', elDamageContainer, 'Damage-' + victimData['xuid']);
        elDamage.BLoadLayoutSnippet('snippet-damage');
        elDamage.healthRemoved = 0;
        elDamage.numHits = 0;
        elDamage.returnHealthRemoved = 0;
        elDamage.returnHits = 0;
        elDamage.style.x = plotPoint[0] + "px";
        // create beam
        if (BEAM_ONLY_ON_DAMAGE) {
            const bCT = _m_winningTeam == 3;
            const elTeamColorBar = $.CreatePanel('Panel', _m_elPlotContainer, 'bar-' + victimData['xuid']);
            elTeamColorBar.AddClass('ris-graph__bar');
            elTeamColorBar.AddClass('prereveal');
            elTeamColorBar.SetHasClass('color-ct', bCT);
            elTeamColorBar.SetHasClass('color-t', !bCT);
            elTeamColorBar.style.x = plotPoint[0] + "px";
            elTeamColorBar.style.height = _FlipY(plotPoint)[1] + 70 + "px";
        }
        // if there is damage at this time then show it. Otherwise everything is ready for post-round attacks.
        if (oDamage) {
            const healthRemoved = oDamage.health_removed || 0;
            const nHits = oDamage.num_hits || 0;
            const returnedHealthRemoved = oDamage.return_health_removed || 0;
            const nReturnHits = oDamage.return_num_hits || 0;
            _UpdateDamage(victimData['xuid'], healthRemoved, nHits, returnedHealthRemoved, nReturnHits);
        }
    }
    function _PlotStartingOdds(nStartingOdds, startPlotPoint) {
        const elStartPlot = $.CreatePanel("Panel", _m_elPlotContainer, 'Start');
        elStartPlot.BLoadLayoutSnippet('snippet-starting-odds');
        elStartPlot.style.y = startPlotPoint[1] + "px";
        $.GetContextPanel().SetDialogVariable('starting_chance', _ConvertToLocalOdds(nStartingOdds) + '%');
        _m_prevChance = nStartingOdds;
    }
    function _DecoratePoint(oEvent, plotPoint) {
        const victimData = oEvent['victim_data'];
        const objectiveData = oEvent['objective_data'];
        // we want to add the xuid to the event  so we can turn Death on later
        const key = objectiveData ? objectiveData['type'] : victimData ? victimData['xuid'] : '';
        const elEventPlot = $.CreatePanel("Panel", _m_elPlotContainer, 'Event-' + key);
        elEventPlot.BLoadLayoutSnippet('snippet-event');
        const elEventIcon = elEventPlot.FindChildTraverse('EventIcon');
        const elEventBG = elEventPlot.FindChildTraverse('EventBG');
        const elEventChance = elEventPlot.FindChildTraverse('EventChance');
        const elEventMain = elEventPlot.FindChildTraverse('EventMain');
        const elDeath = elEventPlot.FindChildTraverse('Death');
        const chance = _ConvertToLocalOdds(oEvent['terrorist_odds']);
        if (victimData) {
            const xuid = victimData['xuid'];
            const isBot = victimData['is_bot'];
            const teamNumber = victimData['team_number'];
            const color = victimData['color'];
            const isDead = victimData['is_dead'];
            elEventChance.visible = isDead;
            elDeath.visible = isDead;
            // event icon
            elEventIcon.SetImage("file://{images}/icons/ui/kill.svg");
            elEventIcon.visible = false;
            // avatar image
            const elAvatarImage = elEventPlot.FindChildTraverse('Avatar');
            elAvatarImage.PopulateFromPlayerSlot(GameStateAPI.GetPlayerSlot(xuid.toString()));
            const bCT = teamNumber == 3;
            elAvatarImage.SwitchClass('teamstyle', 'team--' + (bCT ? 'CT' : 'TERRORIST'));
            // create beam
            if (!BEAM_ONLY_ON_DAMAGE) {
                const elTeamColorBar = $.CreatePanel('Panel', _m_elPlotContainer, 'bar-' + victimData['xuid']);
                elTeamColorBar.AddClass('ris-graph__bar');
                elTeamColorBar.SetHasClass('color-ct', bCT);
                elTeamColorBar.SetHasClass('color-t', !bCT);
                elTeamColorBar.style.x = plotPoint[0] + "px";
                elTeamColorBar.style.height = _FlipY(plotPoint)[1] + 70 + "px";
            }
            // player color
            const rgbColor = TeamColor.GetTeamColor(Number(color));
            elEventMain.FindChildTraverse('JsAvatarTeamColor').style.washColor = 'rgb(' + rgbColor + ')';
        }
        else if (objectiveData) {
            const elAvatarImage = elEventPlot.FindChildTraverse('Avatar');
            elAvatarImage.visible = false;
            // event icon
            let src = "";
            let bEventCT = false;
            switch (objectiveData['type']) {
                case 0: // T_BOMB_PLANTED
                    src = "file://{images}/icons/ui/bomb_c4.svg";
                    bEventCT = false;
                    break;
                case 1: // T_BOMB_EXPLODED
                    src = "file://{images}/icons/ui/bomb.svg";
                    bEventCT = false;
                    break;
                case 2: // CT_BOMB_DEFUSED
                    src = "file://{images}/icons/equipment/defuser.svg";
                    bEventCT = true;
                    break;
                case 3: // CT_TIME_WIN
                    src = "file://{images}/icons/ui/time_exp.svg";
                    bEventCT = true;
                    break;
            }
            elEventIcon.SetImage(src);
            elEventIcon.AddClass('event__icon--objective');
            // tint the event
            elEventBG.SetHasClass('color-ct', bEventCT);
            elEventBG.SetHasClass('color-t', !bEventCT);
        }
        const delta = chance - _m_prevChance;
        const deltaSymbol = delta < 0 ? "▼" : delta > 0 ? "▲" : "";
        // chance label
        if (chance == 100) {
            elEventPlot.SetDialogVariable('chance', $.Localize('#ris_win'));
            elEventChance.FindChildTraverse('EventChanceNumber').style.color = '#ffffff';
        }
        else if (chance == 0) {
            elEventPlot.SetDialogVariable('chance', $.Localize('#ris_loss'));
            elEventChance.FindChildTraverse('EventChanceNumber').style.color = '#ffffff';
        }
        else {
            elEventPlot.SetDialogVariable('chance', deltaSymbol + chance + '%');
            elEventChance.FindChildTraverse('EventChanceNumber').style.color = _RemapToTeamColorRGB(chance - _m_prevChance, -20, 20);
        }
        // Plot the point
        elEventPlot.style.x = plotPoint[0] + "px";
        elEventPlot.style.y = plotPoint[1] + "px";
        // DISPLAY
        if (elEventMain && elEventMain.IsValid())
            elEventMain.RemoveClass('prereveal');
        if (elEventChance && elEventChance.IsValid())
            elEventChance.RemoveClass('prereveal');
        if (elDeath && elDeath.IsValid())
            elDeath.RemoveClass('prereveal');
        const sfx = delta > 0 ? "UIPanorama.round_report_odds_up" : delta < 0 ? "UIPanorama.round_report_odds_dn" : "UIPanorama.round_report_odds_none";
        UiToolkitAPI.PlaySoundEvent(sfx);
        _m_prevChance = chance;
    }
    function _RemapToTeamColorRGB(val, min, max) {
        let frac = Math.min(1, Math.max(0, (val - min) / (max - min)));
        const bCTWon = _m_winningTeam == 3;
        if (bCTWon)
            frac = 1 - frac;
        //		CT blue: [ 122, 210, 238 ];
        //		Terrorist yellow:  [ 234, 210, 139 ];
        const R = frac * (234 - 122) + 122;
        const G = 210;
        const B = (1 - frac) * (238 - 139) + 139;
        return 'rgb(' + R + "," + G + "," + B + ")";
    }
    function _Reset() {
        const localTeamNumber = GameStateAPI.GetAssociatedTeamNumber(_m_localXuid);
        // if we're not on a team, use the hud player's perspective.
        const bUseInEye = GameStateAPI.IsDemoOrHltv() || (localTeamNumber != 2 && localTeamNumber != 3);
        _m_localXuid = bUseInEye ? GameStateAPI.GetHudPlayerXuid() : GameStateAPI.GetLocalPlayerXuid();
        _m_teamPerspective = (localTeamNumber == 2 || localTeamNumber == 3) ? localTeamNumber : 2;
        const bCT = _m_teamPerspective == 3;
        // find some panels
        _m_elCanvas = $.GetContextPanel().FindChildTraverse('RisCanvas');
        _m_elPlotContainer = $.GetContextPanel().FindChildTraverse('RisPlotContainer');
        Scheduler.Cancel();
        // clear all pending jobs
        _m_arrTimelineEvents = [];
        _m_arrPersonalDamageEvents = [];
        _m_elPlotContainer.RemoveAndDeleteChildren();
        const elDamageContainer = $.GetContextPanel().FindChildTraverse('DamageContainer');
        elDamageContainer.RemoveAndDeleteChildren();
        _m_elCanvas.ClearJS('rgba(0,0,0,0)');
        $.GetContextPanel().SetDialogVariable('team', GameStateAPI.GetTeamClanName(bCT ? 'CT' : 'TERRORIST'));
        // set the team logo
        const elTeamLogo = $.GetContextPanel().FindChildTraverse('RisTeamLogo');
        if (elTeamLogo) {
            elTeamLogo.SetImage(bCT ? "file://{images}/icons/ui/ct_logo_1c.svg" : "file://{images}/icons/ui/t_logo_1c.svg");
        }
        _Colorize();
    }
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        $.RegisterEventHandler('HudWinPanel_MVP', $.GetContextPanel(), _SetMVP);
        _Init();
    }
})(HudWinPanel || (HudWinPanel = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHVkd2lucGFuZWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9odWQvaHVkd2lucGFuZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyxxQ0FBcUM7QUFDckMseUNBQXlDO0FBQ3pDLGdEQUFnRDtBQUNoRCxnREFBZ0Q7QUFDaEQsK0NBQStDO0FBQy9DLCtDQUErQztBQUMvQyw2REFBNkQ7QUFFN0QsSUFBVSxXQUFXLENBK3VCcEI7QUEvdUJELFdBQVUsV0FBVztJQUVwQiw0SEFBNEg7SUFDNUgsSUFBSTtJQTRCSixJQUFJLFdBQXVCLENBQUMsQ0FBQyxpQ0FBaUM7SUFDOUQsSUFBSSxrQkFBMkIsQ0FBQyxDQUFDLHlFQUF5RTtJQUMxRyw2REFBNkQ7SUFDN0QsSUFBSSx1QkFBK0IsQ0FBQztJQUNwQyxJQUFJLHNCQUE4QixDQUFDO0lBQ25DLElBQUksa0JBQTBCLENBQUM7SUFDL0IsSUFBSSxZQUFvQixDQUFDO0lBQ3pCLElBQUksWUFBb0IsQ0FBQztJQUV6QixJQUFJLFFBQVEsR0FBRyxLQUFLLENBQUM7SUFDckIsSUFBSSxTQUFpQixDQUFDO0lBQ3RCLElBQUksYUFBcUIsQ0FBQyxDQUFDLHNCQUFzQjtJQUNqRCxJQUFJLHlCQUF5QixHQUFHLEtBQUssQ0FBQztJQUN0QyxJQUFJLGlCQUFpQixHQUFHLEtBQUssQ0FBQztJQUU5QixvQ0FBb0M7SUFDcEMsSUFBSSxvQkFBb0IsR0FBNEMsRUFBRSxDQUFDO0lBQ3ZFLElBQUksMEJBQTBCLEdBQTRDLEVBQUUsQ0FBQztJQUU3RSxJQUFJLGNBQTBCLENBQUM7SUFFL0IsTUFBTSxpQkFBaUIsR0FBRyxDQUFDLENBQUMsQ0FBQyw0QkFBNEI7SUFFekQsTUFBTSxtQkFBbUIsR0FBRyxLQUFLLENBQUM7SUFFbEMsU0FBUyxLQUFLO1FBRWIsSUFBSyxRQUFRO1lBQ1osT0FBTztRQUVSLENB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