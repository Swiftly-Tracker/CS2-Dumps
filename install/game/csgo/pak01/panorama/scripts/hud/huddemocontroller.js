"use strict";
/// <reference path="../csgo.d.ts" />
var HudDemoController;
(function (HudDemoController) {
    function EatClick() {
        return true;
    }
    HudDemoController.EatClick = EatClick;
    let ObserverMode;
    (function (ObserverMode) {
        ObserverMode[ObserverMode["OBS_MODE_NONE"] = 0] = "OBS_MODE_NONE";
        ObserverMode[ObserverMode["OBS_MODE_FIXED"] = 1] = "OBS_MODE_FIXED";
        ObserverMode[ObserverMode["OBS_MODE_IN_EYE"] = 2] = "OBS_MODE_IN_EYE";
        ObserverMode[ObserverMode["OBS_MODE_CHASE"] = 3] = "OBS_MODE_CHASE";
        ObserverMode[ObserverMode["OBS_MODE_ROAMING"] = 4] = "OBS_MODE_ROAMING";
    })(ObserverMode || (ObserverMode = {}));
    let Team;
    (function (Team) {
        Team[Team["TEAM_TERRORIST"] = 2] = "TEAM_TERRORIST";
        Team[Team["TEAM_CT"] = 3] = "TEAM_CT";
    })(Team || (Team = {}));
    let DemoTimelineEvent;
    (function (DemoTimelineEvent) {
        DemoTimelineEvent[DemoTimelineEvent["EDemoTimelineEvent_Kill"] = 0] = "EDemoTimelineEvent_Kill";
        DemoTimelineEvent[DemoTimelineEvent["EDemoTimelineEvent_Death"] = 1] = "EDemoTimelineEvent_Death";
        DemoTimelineEvent[DemoTimelineEvent["EDemoTimelineEvent_DamageInflicted"] = 2] = "EDemoTimelineEvent_DamageInflicted";
        DemoTimelineEvent[DemoTimelineEvent["EDemoTimelineEvent_DamageReceived"] = 3] = "EDemoTimelineEvent_DamageReceived";
        DemoTimelineEvent[DemoTimelineEvent["EDemoTimelineEvent_TickMarker"] = 4] = "EDemoTimelineEvent_TickMarker";
    })(DemoTimelineEvent || (DemoTimelineEvent = {}));
    function TimelineEventToLabel(timelineEvent) {
        const labels = [
            "kill",
            "death",
            "dealt_damage",
            "received_damage",
            "tick"
        ];
        return labels[timelineEvent];
    }
    const timeStepSeconds = 15;
    const cp = $.GetContextPanel();
    cp.SetDialogVariableInt("timestep_value", timeStepSeconds);
    const slider = $("#Slider");
    const speedSlider = $("#SpeedSlider");
    const timescale = $("#TimeScale");
    const PlayerListPanel = $("#PlayerList");
    const RoundMenuPanel = $("#RoundMenu");
    const playButton = $("#PlayButton");
    const XRayToggleButton = $("#XRayToggleButton");
    const TrueViewToggleButton = $("#TrueViewToggleButton");
    const TrueViewDOACheckBox = $("#TrueViewDOACheckBox");
    const TrueViewDOAToggleButton = $("#TrueViewDOAToggleButton");
    const TrueViewWrongVersionCheckBox = $("#TrueViewWrongVersionCheckBox");
    const TrueViewWrongVersionToggleButton = $("#TrueViewWrongVersionToggleButton");
    const SettingsPanel = $("#Settings");
    const speedStops = [0, 0.1, 0.25, 0.5, 1, 2, 4];
    const nSpeedStopNormal = speedStops.indexOf(1);
    speedSlider.min = 0;
    speedSlider.max = speedStops.length - 1;
    speedSlider.increment = 1;
    function ShowEndPlaybackTooltip() {
        if (lastState?.bIsOverwatch)
            return;
        UiToolkitAPI.ShowTextTooltip('EndPlayback', '#CSGO_Demo_End_Playback');
    }
    HudDemoController.ShowEndPlaybackTooltip = ShowEndPlaybackTooltip;
    function ShowPlayButtonTooltip() {
        UiToolkitAPI.ShowTextTooltip(playButton.id, cp.BHasClass("paused") ? '#tooltip_demo_play' : '#tooltip_demo_pause');
    }
    HudDemoController.ShowPlayButtonTooltip = ShowPlayButtonTooltip;
    const hud = cp.GetParent();
    $.RegisterForUnhandledEvent("DemoToggleUI", () => {
        if (!cp.IsPlayingDemo())
            return;
        if (lastState && lastState.bIsPlayingBroadcast)
            return;
        if (lastState && lastState.bIsOverwatch)
            return;
        if (hud.BHasClass("DemoControllerMinimal")) {
            hud.SetHasClass("DemoControllerMinimal", false);
            hud.SetHasClass("DemoControllerFull", true);
        }
        else if (hud.BHasClass("DemoControllerFull")) {
            hud.SetHasClass("DemoControllerMinimal", false);
            hud.SetHasClass("DemoControllerFull", false);
        }
        else {
            hud.SetHasClass("DemoControllerMinimal", true);
            hud.SetHasClass("DemoControllerFull", false);
        }
    });
    $.RegisterForUnhandledEvent("DemoSetHUDVisible", (bVisible) => {
        if (!cp.IsPlayingDemo())
            return;
        hud.SetHasClass("hide", !bVisible);
    });
    $.RegisterForUnhandledEvent("DemoSetMouseEnabled", (bEnabled) => {
        if (!cp.IsPlayingDemo())
            return;
        cp.SetHasClass("mouseActive", bEnabled);
    });
    let lastState = null;
    let bRoundsMarked = false;
    let bAtEndOfPlayback = false;
    let nSpectatingPlayerId = -1;
    let bHighlightsMode = false;
    function FrameUpdate() {
        const state = cp.GetDemoControllerState();
        if (state == null) {
            hud.SetHasClass("DemoControllerMinimal", false);
            hud.SetHasClass("DemoControllerFull", false);
            lastState = null;
            $.Schedule(1, FrameUpdate);
            return;
        }
        const nFinalTick = state.bIsPlayingHighlights && state.HighlightIntervals ?
            state.HighlightIntervals.at(-1)?.nTickEnd :
            state.RoundIntervals.at(-1)?.nTickEnd;
        const bStateAtEndOfPlayback = nFinalTick != undefined && state.nTick >= nFinalTick;
        if (bStateAtEndOfPlayback != bAtEndOfPlayback) {
            if (state.bIsOverwatch) {
                const sEndPlayback = bStateAtEndOfPlayback ?
                    $.Localize('#CSGO_Demo_End_Playback_Overwatch_Finished') :
                    $.Localize('#CSGO_Demo_End_Playback_Overwatch');
                cp.SetDialogVariable('end-playback', sEndPlayback);
            }
            bAtEndOfPlayback = bStateAtEndOfPlayback;
        }
        if (!cp.visible || !cp.BReadyForDisplay() || !cp.IsSizeValid()) {
            $.Schedule(1, FrameUpdate);
            return;
        }
        $.Schedule(0, FrameUpdate);
        let bStateChanged = false;
        if (lastState == null || lastState.sFileName !== state.sFileName) {
            bRoundsMarked = false;
            bStateChanged = true;
            let sFileName = state.sFileName.replaceAll("\\", "/");
            let nSlashIndex = sFileName.lastIndexOf("/");
            if (nSlashIndex !== -1)
                sFileName = sFileName.substring(nSlashIndex + 1);
            cp.SetDialogVariable("total_time", TicksToTimeText(state.nTotalTicks, state.nSecondsPerTick));
            if (state?.bIsPlayingBroadcast) {
                hud.SetHasClass("DemoControllerHidden", false);
                hud.SetHasClass("DemoControllerMinimal", false);
                hud.SetHasClass("DemoControllerFull", false);
            }
            else {
                let nUIMode = Number(GameInterfaceAPI.GetSettingString("demo_ui_mode"));
                hud.SetHasClass("DemoControllerHidden", nUIMode == 0);
                hud.SetHasClass("DemoControllerMinimal", nUIMode == 1);
                hud.SetHasClass("DemoControllerFull", nUIMode == 2);
            }
            OnHighlightsModeChanged(state.bIsPlayingHighlights);
            bHighlightsMode = state.bIsPlayingHighlights;
            const sEndPlayback = state.bIsOverwatch ?
                $.Localize('#CSGO_Demo_End_Playback_Overwatch') :
                $.Localize('#CSGO_Demo_Quit');
            cp.SetDialogVariable('end-playback', sEndPlayback);
        }
        lastState = state;
        const pMarkers = $("#RoundMarkers");
        if (pMarkers.actuallayoutwidth > 0 && !bRoundsMarked) {
            bRoundsMarked = true;
            pMarkers.RemoveAndDeleteChildren();
            const pThumb = $("#SliderThumb");
            const nThumbWidth = pThumb.actuallayoutwidth / pThumb.actualuiscale_x;
            const nMarkersWidth = (pMarkers.actuallayoutwidth / pThumb.actualuiscale_x) - nThumbWidth;
            for (let i = 0; i < state.RoundIntervals.length; i++) {
                const nStartTick = state.RoundIntervals[i].nTickStart;
                const nEndTick = state.RoundIntervals[i].nTickEnd;
                let nLeft = nStartTick / state.nTotalTicks * nMarkersWidth + nThumbWidth / 2;
                let nWidth = (nEndTick - nStartTick) / state.nTotalTicks * nMarkersWidth;
                if (i === 0) {
                    nWidth += nLeft;
                    nLeft = 0;
                }
                else if (i === state.RoundIntervals.length - 1) {
                    nWidth += nThumbWidth / 2;
                }
                const className = i % 2 === 0 ? "roundMarker even" : "roundMarker odd";
                const pMarker = $.CreatePanel("Panel", pMarkers, "", { class: className });
                pMarker.style.position = `${nLeft}px 0 0`;
                pMarker.style.width = nWidth + "px";
            }
        }
        if (nSpectatingPlayerId != state.nSpectatingPlayerId) {
            CreateHighlightIntervals();
            CreateTimelineEvents();
            nSpectatingPlayerId = state.nSpectatingPlayerId;
            $("#HighlightsButton")?.SetHasClass("hide", !ShouldShowHighlightsButton());
        }
        if ((state.bIsPlayingHighlights != bHighlightsMode) || bStateChanged) {
            OnHighlightsModeChanged(state.bIsPlayingHighlights);
            bHighlightsMode = state.bIsPlayingHighlights;
        }
        cp.SetHasClass("paused", state.bIsPaused);
        $("#HighlightsButton").SetHasClass("disabled", IsHighlightsToggleDisabled());
        UpdateCameraModeLabel(state.nObserverMode);
        UpdateSpectatedPlayerName();
        slider.min = 0;
        slider.max = state.nTotalTicks;
        if (!slider.mousedown) {
            slider.value = state.nTick;
            SetCurrentTimeText(state.nTick);
            SetRoundNumberLabel();
        }
        CreateSpeedTicks();
        UpdateControlRowFit();
        if (!speedSlider.mousedown) {
            speedSlider.SetValueNoEvents(state.bIsPaused ? 0 : TimeScaleToSpeedStop(state.fTimeScale));
        }
        timescale.text = SpeedToText(state.bIsPaused ? 0 : state.fTimeScale);
        if (PlayerListPanel.BHasClass("Visible")) {
            UpdatePlayerList();
        }
        const bSettingsVisible = cp.BHasClass("SettingsVisible");
        if (bSettingsVisible) {
            SettingsPanel.AddClass("Visible");
            const spec_show_xray = parseInt(GameInterfaceAPI.GetSettingString("spec_show_xray"));
            XRayToggleButton.SetSelected(spec_show_xray != 0);
            const cl_demo_predict = parseInt(GameInterfaceAPI.GetSettingString("cl_demo_predict"));
            const cl_trueview_show_doa_predictions = parseInt(GameInterfaceAPI.GetSettingString("cl_trueview_show_doa_predictions"));
            TrueViewToggleButton.SetSelected(cl_demo_predict > 0);
            TrueViewDOAToggleButton.SetSelected(cl_trueview_show_doa_predictions != 0);
            TrueViewDOACheckBox.enabled = cl_demo_predict > 0;
            TrueViewWrongVersionCheckBox.enabled = cl_demo_predict > 0;
            if (cl_demo_predict > 0) {
                TrueViewWrongVersionToggleButton.SetSelected(cl_demo_predict >= 2);
            }
        }
        else {
            SettingsPanel.RemoveClass("Visible");
        }
        const cl_demo_predict = parseInt(GameInterfaceAPI.GetSettingString("cl_demo_predict"));
    }
    $.Schedule(0, FrameUpdate);
    $.RegisterEventHandler("SliderReleased", slider, (_, fValue) => {
        if (lastState == null)
            return true;
        SetCurrentTimeText(fValue);
        SetRoundNumberLabel();
        cp.GotoTick(Math.floor(fValue));
        return true;
    });
    $.RegisterEventHandler("SliderValueChanged", slider, (_, fValue) => {
        if (lastState == null)
            return true;
        SetCurrentTimeText(fValue);
        SetRoundNumberLabel();
        return true;
    });
    $.RegisterEventHandler("SliderValueChanged", speedSlider, (_, fValue) => {
        const nStop = Math.round(fValue);
        if (nStop != fValue) {
            speedSlider.SetValueNoEvents(nStop);
        }
        SetPlaybackSpeedStop(nStop);
        return true;
    });
    function OnPlayClicked() {
        const nStop = cp.BHasClass("paused") ? nSpeedStopNormal : 0;
        speedSlider.SetValueNoEvents(nStop);
        SetPlaybackSpeedStop(nStop);
        ShowPlayButtonTooltip();
        return true;
    }
    HudDemoController.OnPlayClicked = OnPlayClicked;
    function SetPlaybackSpeedStop(nStop) {
        const fSpeed = speedStops[nStop];
        const bWasPaused = cp.BHasClass("paused");
        if (fSpeed == 0) {
            cp.SetPaused(true);
        }
        else {
            cp.SetDemoTimeScale(fSpeed);
            if (bWasPaused)
                cp.SetPaused(false);
        }
        cp.SetHasClass("paused", fSpeed == 0);
        timescale.text = SpeedToText(fSpeed);
    }
    const rowFitSteps = [
        { sPanel: "#CameraButton", sClass: "hide-label", nWidthBefore: 0 },
        { sPanel: "#TimeLabel", sClass: "hide-tick", nWidthBefore: 0 },
        { sPanel: "#TimeLabel", sClass: "short-time", nWidthBefore: 0 },
    ];
    let nRowFitCollapsed = 0;
    function UpdateControlRowFit() {
        const nSpacerWidth = $("#ControlRowSpacer").actuallayoutwidth;
        if ($("#ControlRow").actuallayoutwidth <= 0)
            return;
        if (nSpacerWidth <= 0) {
            if (nRowFitCollapsed < rowFitSteps.length) {
                const step = rowFitSteps[nRowFitCollapsed++];
                const pPanel = $(step.sPanel);
                step.nWidthBefore = pPanel.actuallayoutwidth;
                pPanel.AddClass(step.sClass);
            }
            return;
        }
        if (nRowFitCollapsed > 0) {
            const step = rowFitSteps[nRowFitCollapsed - 1];
            const pPanel = $(step.sPanel);
            if (nSpacerWidth > step.nWidthBefore - pPanel.actuallayoutwidth + 1) {
                pPanel.RemoveClass(step.sClass);
                nRowFitCollapsed--;
            }
        }
    }
    let sSpeedTicksLayout = "";
    function CreateSpeedTicks() {
        const pTicks = $("#SpeedTicks");
        const pThumb = speedSlider.FindChildTraverse("SliderThumb");
        if (!pThumb || pTicks.actuallayoutwidth <= 0 || pThumb.actuallayoutwidth <= 0)
            return;
        const sLayout = `${pTicks.actuallayoutwidth}:${pThumb.actuallayoutwidth}:${pTicks.actualuiscale_x}`;
        if (sLayout == sSpeedTicksLayout)
            return;
        sSpeedTicksLayout = sLayout;
        pTicks.RemoveAndDeleteChildren();
        const nThumbWidth = pThumb.actuallayoutwidth / pThumb.actualuiscale_x;
        const nTravelWidth = (pTicks.actuallayoutwidth / pTicks.actualuiscale_x) - nThumbWidth;
        for (let i = 0; i < speedStops.length; i++) {
            if (speedStops[i] == 0) {
                const nPauseWidth = 12;
                const nPauseLeft = (i / (speedStops.length - 1)) * nTravelWidth + nThumbWidth / 2 - nPauseWidth / 2;
                const pPause = $.CreatePanel("Image", pTicks, "", { class: "speed-tick-pause", src: "file://{images}/icons/ui/pause.svg" });
                pPause.style.marginLeft = `${nPauseLeft}px`;
                continue;
            }
            if (speedStops[i] >= 1) {
                const nArrowWidth = 5;
                const nArrowOverlap = 2;
                const nArrows = speedStops[i];
                const nRowWidth = nArrowWidth + (nArrows - 1) * (nArrowWidth - nArrowOverlap);
                const nArrowsLeft = (i / (speedStops.length - 1)) * nTravelWidth + nThumbWidth / 2 - nRowWidth / 2;
                const pArrows = $.CreatePanel("Panel", pTicks, "", { class: "speed-tick-arrows" });
                pArrows.style.marginLeft = `${nArrowsLeft}px`;
                for (let nArrow = 0; nArrow < nArrows; nArrow++) {
                    const pArrow = $.CreatePanel("Image", pArrows, "", { class: "speed-tick-arrow", src: "file://{images}/icons/ui/message_arrow.svg" });
                    if (nArrow > 0)
                        pArrow.style.marginLeft = `${-nArrowOverlap}px`;
                }
                continue;
            }
            const nTickWidth = i;
            const nLeft = (i / (speedStops.length - 1)) * nTravelWidth + nThumbWidth / 2 - nTickWidth / 2;
            const pTick = $.CreatePanel("Panel", pTicks, "", { class: "speed-tick" });
            pTick.style.width = `${nTickWidth}px`;
            pTick.style.marginLeft = `${nLeft}px`;
        }
    }
    function TimeScaleToSpeedStop(fTimeScale) {
        let nBest = 1;
        for (let i = 2; i < speedStops.length; i++) {
            if (Math.abs(speedStops[i] - fTimeScale) < Math.abs(speedStops[nBest] - fTimeScale))
                nBest = i;
        }
        return nBest;
    }
    function SpeedToText(fSpeed) {
        if (fSpeed == 0)
            return $.Localize('#CSGO_Demo_Paused');
        return parseFloat(fSpeed.toFixed(4)).toString() + "x";
    }
    function SetCurrentTimeText(nTick) {
        if (!lastState)
            return;
        cp.SetDialogVariable("current_time", TicksToTimeText(nTick, lastState.nSecondsPerTick));
        cp.SetDialogVariable("current_tick", Math.floor(nTick).toString().padStart(6, "0"));
    }
    function UpdateCameraModeLabel(nObserverMode) {
        let sMode = '#CSGO_Demo_Camera_FirstPerson';
        if (nObserverMode == ObserverMode.OBS_MODE_CHASE)
            sMode = '#CSGO_Demo_Camera_Chase';
        else if (nObserverMode == ObserverMode.OBS_MODE_ROAMING)
            sMode = '#CSGO_Demo_Camera_Free';
        $("#CameraModeLabel").text = $.Localize(sMode);
    }
    let nSpectatedPlayerSlot = -2;
    let nSpectatedPawnId = -2;
    let flNextPlayerNameRefresh = 0;
    function UpdateSpectatedPlayerName() {
        const flNow = Date.now();
        const nPawnId = lastState ? lastState.nSpectatingPlayerId : -1;
        if (nPawnId == nSpectatedPawnId && flNow < flNextPlayerNameRefresh)
            return;
        nSpectatedPawnId = nPawnId;
        flNextPlayerNameRefresh = flNow + 500;
        const player = nPawnId >= 0 ? cp.GetDemoPlayers().find(p => p.nPawnEntIndex == nPawnId) : undefined;
        const pName = $("#PlayerName");
        pName.SetHasClass("team-ct", player?.nTeam == Team.TEAM_CT);
        pName.SetHasClass("team-t", player?.nTeam == Team.TEAM_TERRORIST);
        const nSlot = player ? player.nPlayerSlot : -1;
        if (nSlot == nSpectatedPlayerSlot)
            return;
        nSpectatedPlayerSlot = nSlot;
        if (player) {
            pName.SetDialogVariableInt("player_slot", nSlot);
            pName.SetLocString("#CSGO_Demo_Player_Name");
        }
        else {
            pName.SetLocString("#CSGO_Demo_Player_None");
        }
    }
    function TogglePlayerListVisible() {
        const bVisible = !PlayerListPanel.BHasClass("Visible");
        PlayerListPanel.SetHasClass("Visible", bVisible);
        if (bVisible) {
            cp.RemoveClass("SettingsVisible");
            SetRoundMenuVisible(false);
            sPlayerListSignature = "";
            UpdatePlayerList();
            const pPrev = $("#PlayerPrev");
            const pNext = $("#PlayerNext");
            const fLeft = pPrev.GetPositionWithinAncestor(cp).x;
            const fRight = pNext.GetPositionWithinAncestor(cp).x + pNext.actuallayoutwidth;
            PlayerListPanel.style.marginLeft = (fLeft / pPrev.actualuiscale_x) + "px";
            PlayerListPanel.style.width = ((fRight - fLeft) / pPrev.actualuiscale_x) + "px";
        }
    }
    HudDemoController.TogglePlayerListVisible = TogglePlayerListVisible;
    let sPlayerListSignature = "";
    function UpdatePlayerList() {
        const players = cp.GetDemoPlayers();
        const SortName = (p) => p.sName.toLowerCase();
        players.sort((a, b) => (a.nTeam - b.nTeam) || (SortName(a) < SortName(b) ? -1 : SortName(a) > SortName(b) ? 1 : 0));
        const sSignature = players.map(p => `${p.nEntIndex}:${p.nPawnEntIndex}:${p.bAlive}:${p.nTeam}:${p.sName}`).join("|") + `#${lastState?.nSpectatingPlayerId}`;
        if (sSignature == sPlayerListSignature)
            return;
        sPlayerListSignature = sSignature;
        PlayerListPanel.RemoveAndDeleteChildren();
        for (const player of players) {
            const pEntry = $.CreatePanel("Panel", PlayerListPanel, "", { class: "player-list-entry interactive" });
            $.CreatePanel("Image", pEntry, "", { class: "player-list-skull", src: "file://{images}/icons/ui/kill.svg" });
            const pName = $.CreatePanel("Label", pEntry, "", { class: "player-list-name", html: "true" });
            pName.SetDialogVariableInt("player_slot", player.nPlayerSlot);
            pName.SetLocString("#CSGO_Demo_Player_Name");
            pEntry.SetHasClass("dead", !player.bAlive);
            pEntry.SetHasClass("team-ct", player.nTeam == Team.TEAM_CT);
            pEntry.SetHasClass("team-t", player.nTeam == Team.TEAM_TERRORIST);
            pEntry.SetHasClass("selected", player.nPawnEntIndex >= 0 && player.nPawnEntIndex == lastState?.nSpectatingPlayerId);
            if (player.bAlive) {
                pEntry.SetPanelEvent('onactivate', () => {
                    cp.SpectatePlayer(player.nEntIndex);
                    PlayerListPanel.RemoveClass("Visible");
                });
            }
        }
    }
    function OnStepTimeBackward() {
        return OnStepTime(-timeStepSeconds);
    }
    HudDemoController.OnStepTimeBackward = OnStepTimeBackward;
    function OnStepTimeForward() {
        return OnStepTime(timeStepSeconds);
    }
    HudDemoController.OnStepTimeForward = OnStepTimeForward;
    function OnStepTime(fStep) {
        if (lastState) {
            cp.GotoTick(lastState.nTick + (fStep / lastState.nSecondsPerTick));
        }
        return true;
    }
    function GetIntervalIndexAtTick(intervals, nTick) {
        const nNext = intervals.findIndex(r => r.nTickStart > nTick);
        return (nNext < 0 ? intervals.length : nNext) - 1;
    }
    function OnStepInterval(nStep) {
        if (!lastState) {
            return false;
        }
        if (lastState.bIsPlayingHighlights) {
            if (lastState.HighlightIntervals?.length > 0) {
                const nIntervalIndex = GetIntervalIndexAtTick(lastState.HighlightIntervals, lastState.nTick);
                let nNewInterval = nIntervalIndex + nStep;
                if (nNewInterval < 0)
                    nNewInterval = 0;
                else if (nNewInterval > lastState.HighlightIntervals.length - 1)
                    nNewInterval = lastState.HighlightIntervals.length - 1;
                cp.GotoTick(lastState.HighlightIntervals[nNewInterval].nTickStart);
            }
        }
        else if (lastState.RoundIntervals?.length > 0) {
            const nIntervalIndex = GetIntervalIndexAtTick(lastState.RoundIntervals, lastState.nTick);
            let nNewInterval = nIntervalIndex + nStep;
            if (nNewInterval < 0)
                nNewInterval = 0;
            else if (nNewInterval > lastState.RoundIntervals.length - 1)
                nNewInterval = lastState.RoundIntervals.length - 1;
            cp.GotoTick(lastState.RoundIntervals[nNewInterval].nTickStart);
        }
        return true;
    }
    HudDemoController.OnStepInterval = OnStepInterval;
    const fEventLeadSeconds = 2;
    function OnRoundButtonActivate() {
        if (!lastState)
            return false;
        const bVisible = !RoundMenuPanel.BHasClass("Visible");
        SetRoundMenuVisible(bVisible);
        if (!bVisible)
            return true;
        cp.RemoveClass("SettingsVisible");
        PlayerListPanel.RemoveClass("Visible");
        RoundMenuPanel.RemoveAndDeleteChildren();
        if (lastState.bIsPlayingHighlights) {
            AddRoundMenuEntry('#CSGO_Demo_Highlight_Start', () => OnStepInterval(0));
        }
        else {
            AddRoundMenuEntry('#CSGO_Demo_Round_Start', () => OnStepInterval(0));
            if (GetCurrentRoundActionStartTick() !== undefined) {
                AddRoundMenuEntry('#CSGO_Demo_Action_Start', () => {
                    const nActionStartTick = GetCurrentRoundActionStartTick();
                    if (nActionStartTick !== undefined)
                        cp.GotoTick(nActionStartTick);
                });
            }
        }
        const pButton = $("#RoundRestart");
        const pos = pButton.GetPositionWithinAncestor(cp);
        RoundMenuPanel.style.marginLeft = (pos.x / pButton.actualuiscale_x) + "px";
        return true;
    }
    HudDemoController.OnRoundButtonActivate = OnRoundButtonActivate;
    function SetRoundMenuVisible(bVisible) {
        RoundMenuPanel.SetHasClass("Visible", bVisible);
    }
    function AddRoundMenuEntry(sLocToken, fnActivate) {
        const pEntry = $.CreatePanel("Panel", RoundMenuPanel, "", { class: "round-menu-entry interactive" });
        const pLabel = $.CreatePanel("Label", pEntry, "");
        pLabel.SetLocString(sLocToken);
        pEntry.SetPanelEvent('onactivate', () => {
            fnActivate();
            SetRoundMenuVisible(false);
        });
    }
    function GetCurrentRoundActionStartTick() {
        if (!lastState || !(lastState.RoundIntervals?.length > 0))
            return undefined;
        const nRound = Math.max(GetIntervalIndexAtTick(lastState.RoundIntervals, lastState.nTick), 0);
        const round = lastState.RoundIntervals[nRound];
        return cp.GetActionStartTicks().find(t => t >= round.nTickStart && t < round.nTickEnd);
    }
    function OnNextEvent() {
        if (lastState?.bIsPlayingHighlights)
            OnGotoNextHighlightEvent();
        else
            OnGotoNextEvent();
        return true;
    }
    HudDemoController.OnNextEvent = OnNextEvent;
    function OnGotoNextEvent() {
        if (!lastState)
            return;
        const nLeadTicks = Math.round(fEventLeadSeconds / lastState.nSecondsPerTick);
        const nTick = lastState.nTick;
        const death = cp.GetDeathEvents().find(d => d.nTick - nLeadTicks > nTick);
        if (death)
            cp.GotoTickAndSpectate(death.nTick - nLeadTicks, death.nControllerEntIndex);
    }
    function OnGotoNextHighlightEvent() {
        if (!lastState)
            return;
        const nLeadTicks = Math.round(fEventLeadSeconds / lastState.nSecondsPerTick);
        const nTick = lastState.nTick;
        const nEventTicks = (lastState.TimelineEvents ?? [])
            .filter(e => (e.eEventType == DemoTimelineEvent.EDemoTimelineEvent_Kill) || (e.eEventType == DemoTimelineEvent.EDemoTimelineEvent_Death))
            .map(e => e.nTick)
            .filter(t => t - nLeadTicks > nTick);
        if (nEventTicks.length > 0)
            cp.GotoTick(Math.min(...nEventTicks) - nLeadTicks);
    }
    function OnStepPlayer(nStep) {
        if (lastState?.nObserverMode == ObserverMode.OBS_MODE_ROAMING)
            GameInterfaceAPI.ConsoleCommand(`spec_mode ${ObserverMode.OBS_MODE_IN_EYE}`);
        GameInterfaceAPI.ConsoleCommand(nStep > 0 ? "spec_next" : "spec_prev");
        return true;
    }
    HudDemoController.OnStepPlayer = OnStepPlayer;
    function OnNextCamera() {
        GameInterfaceAPI.ConsoleCommand("spec_mode");
        return true;
    }
    HudDemoController.OnNextCamera = OnNextCamera;
    function OnStopPlayback() {
        cp.StopPlayback();
        return true;
    }
    HudDemoController.OnStopPlayback = OnStopPlayback;
    function IsHighlightsToggleDisabled() {
        return lastState?.nObserverMode == ObserverMode.OBS_MODE_ROAMING && !lastState.bIsPlayingHighlights;
    }
    function OnHighlightsToggle() {
        if (IsHighlightsToggleDisabled())
            return;
        let bIsEnabled = !lastState?.bIsPlayingHighlights;
        cp.SetHighlightsModeEnabled(!!bIsEnabled);
    }
    HudDemoController.OnHighlightsToggle = OnHighlightsToggle;
    function ShouldShowHighlightsButton() {
        if (lastState?.bIsOverwatch)
            return false;
        return true;
    }
    function OnHighlightsModeChanged(bEnabled) {
        cp.SetHasClass("highlightsActive", bEnabled);
        $("#IntervalLabel").text = bEnabled ? $.Localize('#CSGO_Demo_Highlight') : $.Localize('#CSGO_Demo_Round');
        CreateHighlightIntervals();
        CreateTimelineEvents();
        SetRoundNumberLabel();
        return true;
    }
    function DestroyTimelineEvents() {
        const pHighlightIcons = $("#HighlightIcons");
        pHighlightIcons.RemoveAndDeleteChildren();
    }
    function CreateTimelineEvents() {
        DestroyTimelineEvents();
        if (!lastState || !lastState.TimelineEvents)
            return;
        const pThumb = $("#SliderThumb");
        const pHighlightIcons = $("#HighlightIcons");
        const nThumbWidth = pThumb.actuallayoutwidth / pThumb.actualuiscale_x;
        const nMarkersWidth = (pHighlightIcons.actuallayoutwidth / pHighlightIcons.actualuiscale_x) - nThumbWidth;
        for (let iEvent = lastState.TimelineEvents.length - 1; iEvent >= 0; --iEvent) {
            const timelineEvent = lastState.TimelineEvents[iEvent];
            const nHalfIconWidth = 11;
            const nLeft = (timelineEvent.nTick / lastState.nTotalTicks * nMarkersWidth + nThumbWidth / 2) - nHalfIconWidth;
            const sClass = TimelineEventToLabel(timelineEvent.eEventType);
            const pIcon = $.CreatePanel("Panel", pHighlightIcons, "", { class: `highlight-icon ${sClass}` });
            pIcon.style.marginLeft = nLeft + "px";
            const flSkipToTicksBefore = 64 * 2;
            pIcon.SetPanelEvent('onactivate', () => cp.GotoTick(timelineEvent.nTick - flSkipToTicksBefore));
        }
    }
    function DestroyHighlightIntervals() {
        const pMarkers = $("#HighlightMarkers");
        pMarkers.RemoveAndDeleteChildren();
    }
    function CreateHighlightIntervals() {
        DestroyHighlightIntervals();
        if (!lastState || !lastState.HighlightIntervals)
            return;
        const pMarkers = $("#HighlightMarkers");
        const pThumb = $("#SliderThumb");
        const nThumbWidth = pThumb.actuallayoutwidth / pThumb.actualuiscale_x;
        const nMarkersWidth = (pMarkers.actuallayoutwidth / pThumb.actualuiscale_x) - nThumbWidth;
        for (let i = 0; i < lastState.HighlightIntervals.length; i++) {
            const highlight = lastState.HighlightIntervals[i];
            const nStartTick = highlight.nTickStart;
            const nEndTick = highlight.nTickEnd;
            let nLeft = nStartTick / lastState.nTotalTicks * nMarkersWidth + nThumbWidth / 2;
            let nWidth = (nEndTick - nStartTick) / lastState.nTotalTicks * nMarkersWidth;
            const pMarker = $.CreatePanel("Panel", pMarkers, "");
            pMarker.style.marginLeft = nLeft + "px";
            pMarker.style.width = nWidth + "px";
        }
    }
    function GetCurrentIntervalNumber() {
        if (!lastState)
            return 0;
        if (lastState.bIsPlayingHighlights) {
            return 0;
        }
        return TicksToRound(lastState.nTick, lastState.RoundIntervals);
    }
    function TicksToTimeText(nTick, nSecondsPerTick) {
        const nTime = Math.floor(nSecondsPerTick * nTick);
        const nMinutes = Math.floor(nTime / 60);
        const nSeconds = nTime - nMinutes * 60;
        return `${nMinutes.toString().padStart(2, "0")}:${nSeconds.toString().padStart(2, "0")}`;
    }
    function TicksToRound(nTick, rounds) {
        if (rounds.length === 0 || rounds[0].nTickStart > nTick)
            return 0;
        for (let i = 0; i < rounds.length; i++) {
            if (nTick < rounds[i].nTickStart) {
                return i;
            }
        }
        return rounds.length;
    }
    function ToggleSettingsVisible() {
        cp.ToggleClass("SettingsVisible");
        PlayerListPanel.RemoveClass("Visible");
        SetRoundMenuVisible(false);
        $.Schedule(0, FrameUpdate);
    }
    HudDemoController.ToggleSettingsVisible = ToggleSettingsVisible;
    function ToggleXRay() {
        let spec_show_xray = parseInt(GameInterfaceAPI.GetSettingString("spec_show_xray"));
        spec_show_xray = spec_show_xray ? 0 : 1;
        GameInterfaceAPI.ConsoleCommand(`spec_show_xray ${spec_show_xray}`);
    }
    HudDemoController.ToggleXRay = ToggleXRay;
    function ToggleTrueView() {
        const cl_demo_predict = parseInt(GameInterfaceAPI.GetSettingString("cl_demo_predict"));
        if (cl_demo_predict) {
            GameInterfaceAPI.ConsoleCommand("cl_demo_predict 0");
        }
        else {
            if (!TrueViewWrongVersionToggleButton.IsSelected()) {
                GameInterfaceAPI.ConsoleCommand("cl_demo_predict 1");
            }
            else {
                GameInterfaceAPI.ConsoleCommand("cl_demo_predict 2");
            }
        }
    }
    HudDemoController.ToggleTrueView = ToggleTrueView;
    function ToggleTrueViewDOACommands() {
        let cl_trueview_show_doa_predictions = parseInt(GameInterfaceAPI.GetSettingString("cl_trueview_show_doa_predictions"));
        cl_trueview_show_doa_predictions = cl_trueview_show_doa_predictions ? 0 : 1;
        GameInterfaceAPI.ConsoleCommand(`cl_trueview_show_doa_predictions ${cl_trueview_show_doa_predictions}`);
    }
    HudDemoController.ToggleTrueViewDOACommands = ToggleTrueViewDOACommands;
    function ToggleTrueViewWrongVersion() {
        const cl_demo_predict = parseInt(GameInterfaceAPI.GetSettingString("cl_demo_predict"));
        if (cl_demo_predict == 1) {
            GameInterfaceAPI.ConsoleCommand("cl_demo_predict 2");
        }
        else if (cl_demo_predict == 2) {
            GameInterfaceAPI.ConsoleCommand("cl_demo_predict 1");
        }
    }
    HudDemoController.ToggleTrueViewWrongVersion = ToggleTrueViewWrongVersion;
    function SetRoundNumberLabel() {
        if (lastState && lastState.bIsPlayingHighlights) {
            var roundNumber = $("#RoundNumber");
            if (roundNumber) {
                roundNumber.visible = false;
            }
        }
        else {
            var roundNumber = $("#RoundNumber");
            if (roundNumber) {
                roundNumber.visible = true;
            }
            cp.SetDialogVariableInt("round_number", GetCurrentIntervalNumber());
        }
    }
})(HudDemoController || (HudDemoController = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHVkZGVtb2NvbnRyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9odWQvaHVkZGVtb2NvbnRyb2xsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUVyQyxJQUFVLGlCQUFpQixDQWttQzFCO0FBbG1DRCxXQUFVLGlCQUFpQjtJQUV2QixTQUFnQixRQUFRO1FBRXBCLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFIZSwwQkFBUSxXQUd2QixDQUFBO0lBNkJELElBQUssWUFPSjtJQVBELFdBQUssWUFBWTtRQUViLGlFQUFpQixDQUFBO1FBQ2pCLG1FQUFjLENBQUE7UUFDZCxxRUFBZSxDQUFBO1FBQ2YsbUVBQWMsQ0FBQTtRQUNkLHVFQUFnQixDQUFBO0lBQ3BCLENBQUMsRUFQSSxZQUFZLEtBQVosWUFBWSxRQU9oQjtJQUdELElBQUssSUFJSjtJQUpELFdBQUssSUFBSTtRQUVMLG1EQUFrQixDQUFBO1FBQ2xCLHFDQUFXLENBQUE7SUFDZixDQUFDLEVBSkksSUFBSSxLQUFKLElBQUksUUFJUjtJQUdELElBQUssaUJBT0o7SUFQRCxXQUFLLGlCQUFpQjtRQUVsQiwrRkFBMkIsQ0FBQTtRQUMzQixpR0FBd0IsQ0FBQTtRQUN4QixxSEFBa0MsQ0FBQTtRQUNsQyxtSEFBaUMsQ0FBQTtRQUNqQywyR0FBNkIsQ0FBQTtJQUNqQyxDQUFDLEVBUEksaUJBQWlCLEtBQWpCLGlCQUFpQixRQU9yQjtJQXdDRCxTQUFTLG9CQUFvQixDQUFFLGFBQWdDO1FBRTNELE1BQU0sTUFBTSxHQUFHO1lBQ1gsTUFBTTtZQUNOLE9BQU87WUFDUCxjQUFjO1lBQ2QsaUJBQWlCO1lBQ2pCLE1BQU07U0FDVCxDQUFBO1FBRUQsT0FBTyxNQUFNLENBQUUsYUFBYSxDQUFFLENBQUM7SUFDbkMsQ0FBQztJQUVELE1BQU0sZUFBZSxHQUFHLEVBQUUsQ0FBQztJ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