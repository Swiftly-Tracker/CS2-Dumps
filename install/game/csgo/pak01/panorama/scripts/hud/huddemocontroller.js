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
    const timescale = $("#TimeScale");
    const XRayToggleButton = $("#XRayToggleButton");
    const TrueViewToggleButton = $("#TrueViewToggleButton");
    const TrueViewDOACheckBox = $("#TrueViewDOACheckBox");
    const TrueViewDOAToggleButton = $("#TrueViewDOAToggleButton");
    const TrueViewWrongVersionCheckBox = $("#TrueViewWrongVersionCheckBox");
    const TrueViewWrongVersionToggleButton = $("#TrueViewWrongVersionToggleButton");
    const SettingsPanel = $("#Settings");
    timescale.SetPanelEvent('onmouseover', () => UiToolkitAPI.ShowTextTooltip(timescale.id, "Playback speed"));
    timescale.SetPanelEvent('onmouseout', () => UiToolkitAPI.HideTextTooltip());
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
        const sMouseMode = bEnabled ?
            $.Localize('#CSGO_Demo_Enable_Mouse_Camera', cp) :
            $.Localize('#CSGO_Demo_Enable_Mouse_Cursor', cp);
        cp.SetDialogVariable('mouse-mode', sMouseMode);
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
            cp.SetDialogVariable("total_time", TicksToTimeText(state.nTotalTicks, state.nSecondsPerTick, false));
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
                $.Localize('#CSGO_Demo_End_Playback');
            cp.SetDialogVariable('end-playback', sEndPlayback);
            const sMouseMode = $.Localize('#CSGO_Demo_Enable_Mouse_Camera', cp);
            cp.SetDialogVariable('mouse-mode', sMouseMode);
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
        cp.SetHasClass("mouseCamAllowed", IsMouseCameraAllowed());
        cp.SetHasClass("flyCamActive", state.nObserverMode == ObserverMode.OBS_MODE_ROAMING);
        slider.min = 0;
        slider.max = state.nTotalTicks;
        if (!slider.mousedown) {
            slider.value = state.nTick;
            cp.SetDialogVariable("current_time", TicksToTimeText(state.nTick, state.nSecondsPerTick, true));
            SetRoundNumberLabel();
        }
        timescale.text = parseFloat(state.fTimeScale.toFixed(4)).toString() + "x";
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
        cp.SetDialogVariable("current_time", TicksToTimeText(fValue, lastState.nSecondsPerTick, true));
        SetRoundNumberLabel();
        cp.GotoTick(Math.floor(fValue));
        return true;
    });
    $.RegisterEventHandler("SliderValueChanged", slider, (_, fValue) => {
        if (lastState == null)
            return true;
        cp.SetDialogVariable("current_time", TicksToTimeText(fValue, lastState.nSecondsPerTick, true));
        SetRoundNumberLabel();
        return true;
    });
    function OnPlayClicked() {
        cp.SetPaused(!cp.BHasClass("paused"));
        return true;
    }
    HudDemoController.OnPlayClicked = OnPlayClicked;
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
    function OnStepInterval(nStep) {
        if (!lastState) {
            return false;
        }
        if (lastState.bIsPlayingHighlights) {
            if (lastState.HighlightIntervals?.length > 0) {
                const nIntervalIndex = lastState.HighlightIntervals.findIndex(r => r.nTickStart > lastState.nTick) - 1;
                let nNewInterval = nIntervalIndex + nStep;
                if (nNewInterval < 0)
                    nNewInterval = 0;
                else if (nNewInterval > lastState.HighlightIntervals.length - 1)
                    nNewInterval = lastState.HighlightIntervals.length - 1;
                cp.GotoTick(lastState.HighlightIntervals[nNewInterval].nTickStart);
            }
        }
        else if (lastState.RoundIntervals?.length > 0) {
            const nIntervalIndex = lastState.RoundIntervals.findIndex(r => r.nTickStart > lastState.nTick) - 1;
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
    function OnShowTimeScaleContextMenu() {
        cp.OnShowTimeScaleContextMenu();
        return true;
    }
    HudDemoController.OnShowTimeScaleContextMenu = OnShowTimeScaleContextMenu;
    function OnStopPlayback() {
        cp.StopPlayback();
        return true;
    }
    HudDemoController.OnStopPlayback = OnStopPlayback;
    function OnHighlightsToggle() {
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
    function TicksToTimeText(nTick, nSecondsPerTick, bFractionalSeconds) {
        const nTime = nSecondsPerTick * nTick;
        const nMinutes = Math.floor(nTime / 60.0);
        const nSeconds = nTime - nMinutes * 60.0;
        let sSeconds = "";
        if (bFractionalSeconds) {
            sSeconds = (Math.floor(nSeconds * 10.0) / 10.0).toFixed(1);
            if (sSeconds.length < 4)
                sSeconds = "0" + sSeconds;
        }
        else {
            sSeconds = nSeconds.toFixed(0);
            if (sSeconds.length < 2)
                sSeconds = "0" + sSeconds;
        }
        return `${nMinutes}:${sSeconds}`;
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
    function IsMouseCameraAllowed() {
        return lastState?.nObserverMode == ObserverMode.OBS_MODE_CHASE ||
            lastState?.nObserverMode == ObserverMode.OBS_MODE_ROAMING;
    }
    function ToggleSettingsVisible() {
        cp.ToggleClass("SettingsVisible");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHVkZGVtb2NvbnRyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9odWQvaHVkZGVtb2NvbnRyb2xsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUVyQyxJQUFVLGlCQUFpQixDQStwQjFCO0FBL3BCRCxXQUFVLGlCQUFpQjtJQUV2QixTQUFnQixRQUFRO1FBRXBCLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFIZSwwQkFBUSxXQUd2QixDQUFBO0lBY0QsSUFBSyxZQU9KO0lBUEQsV0FBSyxZQUFZO1FBRWIsaUVBQWlCLENBQUE7UUFDakIsbUVBQWMsQ0FBQTtRQUNkLHFFQUFlLENBQUE7UUFDZixtRUFBYyxDQUFBO1FBQ2QsdUVBQWdCLENBQUE7SUFDcEIsQ0FBQyxFQVBJLFlBQVksS0FBWixZQUFZLFFBT2hCO0lBR0QsSUFBSyxpQkFPSjtJQVBELFdBQUssaUJBQWlCO1FBRWxCLCtGQUEyQixDQUFBO1FBQzNCLGlHQUF3QixDQUFBO1FBQ3hCLHFIQUFrQyxDQUFBO1FBQ2xDLG1IQUFpQyxDQUFBO1FBQ2pDLDJHQUE2QixDQUFBO0lBQ2pDLENBQUMsRUFQSSxpQkFBaUIsS0FBakIsaUJBQWlCLFFBT3JCO0lBa0NELFNBQVMsb0JBQW9CLENBQUUsYUFBZ0M7UUFFM0QsTUFBTSxNQUFNLEdBQUc7WUFDWCxNQUFNO1lBQ04sT0FBTztZQUNQLGNBQWM7WUFDZCxpQkFBaUI7WUFDakIsTUFBTTtTQUNULENBQUE7UUFFRCxPQUFPLE1BQU0sQ0FBRSxhQUFhLENBQUUsQ0FBQztJQUNuQyxDQUFDO0lBT0QsTUFBTSxlQUFlLEdBQUcsRUFBRSxDQUFDO0lBQzNCLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQTZCLENBQUM7SUFDMUQsRUFBRSxDQUFDLG9CQUFvQixDQUFFLGdCQUFnQixFQUFFLGVBQWUsQ0FBRSxDQUFD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