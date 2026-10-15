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
    let _m_elCanvas;
    let _m_elPlotContainer;
    let _m_canvasHeightInPixels;
    let _m_canvasWidthInPixels;
    let _m_teamPerspective;
    let _m_localXuid;
    let _m_timeslice;
    let _m_bInit = false;
    let _m_xRange;
    let _m_prevChance;
    let _m_ListeningForGameEvents = false;
    let _m_bCanvasIsReady = false;
    let _m_arrTimelineEvents = [];
    let _m_arrPersonalDamageEvents = [];
    let _m_winningTeam;
    const TOTAL_TIME_REVEAL = 5;
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
        const avatar = $("#MVPAvatar");
        avatar.PopulateFromPlayerSlot(GameStateAPI.GetPlayerSlot(xuid));
        avatar.SetHasClass("team--TERRORIST", team === 2);
        avatar.SetHasClass("team--CT", team === 3);
        $.GetContextPanel().SetDialogVariableInt('player_slot', GameStateAPI.GetPlayerSlot(xuid));
        let sMvpReasonToken = "#Panorama_winpanel_mvp_award";
        let elMapContainer = $.GetContextPanel().FindChildInLayoutFile('id-match-mvp-map-container');
        MvpBackgroundMap.SetUpMapWinPanel(xuid, reason, team, elMapContainer);
        switch (reason) {
            case 1:
                sMvpReasonToken = "#Panorama_winpanel_mvp_award_kills";
                break;
            case 2:
                sMvpReasonToken = "#Panorama_winpanel_mvp_award_bombplant";
                break;
            case 3:
                sMvpReasonToken = "#Panorama_winpanel_mvp_award_bombdefuse";
                break;
            case 4:
                sMvpReasonToken = "#Panorama_winpanel_mvp_award_rescue";
                break;
            case 5:
                sMvpReasonToken = "#Panorama_winpanel_mvp_award_gungame";
                break;
            case 7:
                sMvpReasonToken = "#Panorama_winpanel_mvp_winner";
                break;
            case 9:
                sMvpReasonToken = "#Panorama_winpanel_mvp_award_ace";
                break;
            case 10:
                sMvpReasonToken = "#Panorama_winpanel_mvp_award_inferno";
                break;
            case 11:
                sMvpReasonToken = "#Panorama_winpanel_mvp_award_blast";
                break;
            case 12:
                sMvpReasonToken = "#Panorama_winpanel_mvp_winner";
                break;
            case 13:
                sMvpReasonToken = "#Panorama_winpanel_mvp_award_bombplant_clutch";
                break;
            case 14:
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
        if (!_m_bCanvasIsReady) {
            $.Schedule(0.5, () => _OnReceivePlayerHurt(attackerXuid, victimXuid, damage));
            return;
        }
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
        if (!_m_bCanvasIsReady) {
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
        _Reset();
        _m_ListeningForGameEvents = true;
        if (!_m_elCanvas.IsSizeValid()) {
            $.Schedule(0.5, () => _ShowRoundEndReport.bind(msg));
            return;
        }
        _m_bCanvasIsReady = true;
        $.GetContextPanel().SetDialogVariable('player_name', GameStateAPI.GetPlayerName(_m_localXuid));
        _m_canvasHeightInPixels = _m_elCanvas.actuallayoutheight / _m_elCanvas.actualuiscale_y;
        _m_canvasWidthInPixels = _m_elCanvas.actuallayoutwidth / _m_elCanvas.actualuiscale_x;
        const oInitialConditions = msg.init_conditions;
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
        const bCT = _m_teamPerspective == 3;
        const drawColor = bCT ? '#B5D4EEaa' : '#EAD18Aaa';
        _m_elCanvas.DrawSoftLinePointsJS(plotPoints.length, plotPoints.flat(), 4, 1.0, drawColor);
        _m_elCanvas.TriggerClass('show-canvas');
        const graphWidth = (_m_arrTimelineEvents.length) / _m_xRange * 100;
        const elGraphGuides = $.GetContextPanel().FindChildTraverse('GraphGuides');
        elGraphGuides.style.width = graphWidth + "%";
        const elLivingBG = $.GetContextPanel().FindChildTraverse('LivingBG');
        elLivingBG.style.width = 100 - graphWidth + "%";
        _Colorize();
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
        for (let index = 0; index < arrEvents.length; ++index) {
            const oEvent = arrEvents[index];
            const x = index + 1;
            const y = _ConvertToLocalOdds(oEvent['terrorist_odds']);
            const point = [x, y];
            const plotPoint = _TransformPointIntoCanvasSpace(point);
            points.push(point);
            plotPoints.push(plotPoint);
            let delta = 0;
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
        Scheduler.Schedule(_m_arrTimelineEvents.length * _m_timeslice, () => {
            if (loopingSfxHandle)
                UiToolkitAPI.StopSoundEvent(loopingSfxHandle, 0.1);
        });
    }
    function _ProcessDamageEvents(arrEvents, startX) {
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
            elEventIcon.SetImage("file://{images}/icons/ui/kill.svg");
            elEventIcon.visible = false;
            const elAvatarImage = elEventPlot.FindChildTraverse('Avatar');
            elAvatarImage.PopulateFromPlayerSlot(GameStateAPI.GetPlayerSlot(xuid.toString()));
            const bCT = teamNumber == 3;
            elAvatarImage.SwitchClass('teamstyle', 'team--' + (bCT ? 'CT' : 'TERRORIST'));
            if (!BEAM_ONLY_ON_DAMAGE) {
                const elTeamColorBar = $.CreatePanel('Panel', _m_elPlotContainer, 'bar-' + victimData['xuid']);
                elTeamColorBar.AddClass('ris-graph__bar');
                elTeamColorBar.SetHasClass('color-ct', bCT);
                elTeamColorBar.SetHasClass('color-t', !bCT);
                elTeamColorBar.style.x = plotPoint[0] + "px";
                elTeamColorBar.style.height = _FlipY(plotPoint)[1] + 70 + "px";
            }
            const rgbColor = TeamColor.GetTeamColor(Number(color));
            elEventMain.FindChildTraverse('JsAvatarTeamColor').style.washColor = 'rgb(' + rgbColor + ')';
        }
        else if (objectiveData) {
            const elAvatarImage = elEventPlot.FindChildTraverse('Avatar');
            elAvatarImage.visible = false;
            let src = "";
            let bEventCT = false;
            switch (objectiveData['type']) {
                case 0:
                    src = "file://{images}/icons/ui/bomb_c4.svg";
                    bEventCT = false;
                    break;
                case 1:
                    src = "file://{images}/icons/ui/bomb.svg";
                    bEventCT = false;
                    break;
                case 2:
                    src = "file://{images}/icons/equipment/defuser.svg";
                    bEventCT = true;
                    break;
                case 3:
                    src = "file://{images}/icons/ui/time_exp.svg";
                    bEventCT = true;
                    break;
            }
            elEventIcon.SetImage(src);
            elEventIcon.AddClass('event__icon--objective');
            elEventBG.SetHasClass('color-ct', bEventCT);
            elEventBG.SetHasClass('color-t', !bEventCT);
        }
        const delta = chance - _m_prevChance;
        const deltaSymbol = delta < 0 ? "▼" : delta > 0 ? "▲" : "";
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
        elEventPlot.style.x = plotPoint[0] + "px";
        elEventPlot.style.y = plotPoint[1] + "px";
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
        const R = frac * (234 - 122) + 122;
        const G = 210;
        const B = (1 - frac) * (238 - 139) + 139;
        return 'rgb(' + R + "," + G + "," + B + ")";
    }
    function _Reset() {
        const localTeamNumber = GameStateAPI.GetAssociatedTeamNumber(_m_localXuid);
        const bUseInEye = GameStateAPI.IsDemoOrHltv() || (localTeamNumber != 2 && localTeamNumber != 3);
        _m_localXuid = bUseInEye ? GameStateAPI.GetHudPlayerXuid() : GameStateAPI.GetLocalPlayerXuid();
        _m_teamPerspective = (localTeamNumber == 2 || localTeamNumber == 3) ? localTeamNumber : 2;
        const bCT = _m_teamPerspective == 3;
        _m_elCanvas = $.GetContextPanel().FindChildTraverse('RisCanvas');
        _m_elPlotContainer = $.GetContextPanel().FindChildTraverse('RisPlotContainer');
        Scheduler.Cancel();
        _m_arrTimelineEvents = [];
        _m_arrPersonalDamageEvents = [];
        _m_elPlotContainer.RemoveAndDeleteChildren();
        const elDamageContainer = $.GetContextPanel().FindChildTraverse('DamageContainer');
        elDamageContainer.RemoveAndDeleteChildren();
        _m_elCanvas.ClearJS('rgba(0,0,0,0)');
        $.GetContextPanel().SetDialogVariable('team', GameStateAPI.GetTeamClanName(bCT ? 'CT' : 'TERRORIST'));
        const elTeamLogo = $.GetContextPanel().FindChildTraverse('RisTeamLogo');
        if (elTeamLogo) {
            elTeamLogo.SetImage(bCT ? "file://{images}/icons/ui/ct_logo_1c.svg" : "file://{images}/icons/ui/t_logo_1c.svg");
        }
        _Colorize();
    }
    {
        $.RegisterEventHandler('HudWinPanel_MVP', $.GetContextPanel(), _SetMVP);
        _Init();
    }
})(HudWinPanel || (HudWinPanel = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHVkd2lucGFuZWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9odWQvaHVkd2lucGFuZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyxxQ0FBcUM7QUFDckMseUNBQXlDO0FBQ3pDLGdEQUFnRDtBQUNoRCxnREFBZ0Q7QUFDaEQsK0NBQStDO0FBQy9DLCtDQUErQztBQUMvQyw2REFBNkQ7QUFFN0QsSUFBVSxXQUFXLENBK3VCcEI7QUEvdUJELFdBQVUsV0FBVztJQStCcEIsSUFBSSxXQUF1QixDQUFDO0lBQzVCLElBQUksa0JBQTJCLENBQUM7SUFFaEMsSUFBSSx1QkFBK0IsQ0FBQztJQUNwQyxJQUFJLHNCQUE4QixDQUFDO0lBQ25DLElBQUksa0JBQTBCLENBQUM7SUFDL0IsSUFBSSxZQUFvQixDQUFDO0lBQ3pCLElBQUksWUFBb0IsQ0FBQztJQUV6QixJQUFJLFFBQVEsR0FBRyxLQUFLLENBQUM7SUFDckIsSUFBSSxTQUFpQixDQUFDO0lBQ3RCLElBQUksYUFBcUIsQ0FBQztJQUMxQixJQUFJLHlCQUF5QixHQUFHLEtBQUssQ0FBQztJQUN0QyxJQUFJLGlCQUFpQixHQUFHLEtBQUssQ0FBQztJQUc5QixJQUFJLG9CQUFvQixHQUE0QyxFQUFFLENBQUM7SUFDdkUsSUFBSSwwQkFBMEIsR0FBNEMsRUFBRSxDQUFDO0lBRTdFLElBQUksY0FBMEIsQ0FBQztJQUUvQixNQUFNLGlCQUFpQixHQUFHLENBQUMsQ0FBQztJQUU1QixNQUFNLG1CQUFtQixHQUFHLEtBQUssQ0FBQztJQUVsQyxTQUFTLEtBQUs7UUFFYixJQUFLLFFBQVE7WUFDWixPQUFPO1FBRVIsQ0FBQyxDQUFDLHlCQUF5QixDQUFFLGdDQUFnQyxFQUFFLG1CQUFtQixDQUFFLENBQUM7UUFDckYsQ0FBQyxDQUFDLHlCQUF5QixDQUFFLGFBQWEsRUFBRSxvQkFBb0IsQ0FB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