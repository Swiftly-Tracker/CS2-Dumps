"use strict";
/// <reference path="../csgo.d.ts" />
var HudDemoController;
(function (HudDemoController) {
    function EatClick() {
        return true;
    }
    HudDemoController.EatClick = EatClick;
    // Should mirror ObserverMode_t in C++
    let ObserverMode;
    (function (ObserverMode) {
        ObserverMode[ObserverMode["OBS_MODE_NONE"] = 0] = "OBS_MODE_NONE";
        ObserverMode[ObserverMode["OBS_MODE_FIXED"] = 1] = "OBS_MODE_FIXED";
        ObserverMode[ObserverMode["OBS_MODE_IN_EYE"] = 2] = "OBS_MODE_IN_EYE";
        ObserverMode[ObserverMode["OBS_MODE_CHASE"] = 3] = "OBS_MODE_CHASE";
        ObserverMode[ObserverMode["OBS_MODE_ROAMING"] = 4] = "OBS_MODE_ROAMING";
    })(ObserverMode || (ObserverMode = {}));
    // Should mirror EDemoTimelineEvent_t in C++
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
            "tick" // EDemoTimelineEvent_TickMarker
        ];
        return labels[timelineEvent];
    }
    const timeStepSeconds = 15;
    const cp = $.GetContextPanel();
    cp.SetDialogVariableInt("timestep_value", timeStepSeconds);
    const slider = $("#Slider");
    const timescale = $("#TimeScale");
    //const XRayCheckBox = $( "#XRayCheckBox" ) as Panel_t
    const XRayToggleButton = $("#XRayToggleButton");
    //const TrueViewCheckBox = $( "#TrueViewCheckBox" ) as Panel_t
    const TrueViewToggleButton = $("#TrueViewToggleButton");
    const TrueViewDOACheckBox = $("#TrueViewDOACheckBox");
    const TrueViewDOAToggleButton = $("#TrueViewDOAToggleButton");
    const TrueViewWrongVersionCheckBox = $("#TrueViewWrongVersionCheckBox");
    const TrueViewWrongVersionToggleButton = $("#TrueViewWrongVersionToggleButton");
    const SettingsPanel = $("#Settings");
    // UG this is not working
    timescale.SetPanelEvent('onmouseover', () => UiToolkitAPI.ShowTextTooltip(timescale.id, "Playback speed"));
    timescale.SetPanelEvent('onmouseout', () => UiToolkitAPI.HideTextTooltip());
    const hud = cp.GetParent();
    $.RegisterForUnhandledEvent("DemoToggleUI", () => {
        if (!cp.IsPlayingDemo())
            return;
        if (lastState && lastState.bIsPlayingBroadcast)
            return;
        // disallow toggling in overwatch
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
            // show the correct text on the "end playback" button
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
            // Toggle the UI to its initial state (0 = disabled, 1 = minimal, 2 = full)
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
            // set the initial highlights state
            OnHighlightsModeChanged(state.bIsPlayingHighlights);
            bHighlightsMode = state.bIsPlayingHighlights;
            // set the correct string on the "end playback" button
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
            // The calculations in here are complected by the SliderThumb having a range that differs from the Slider total
            // SliderThumb is (usually) 16px wide and its position is clamped to keep itself fully within the SliderTrack.
            // SliderThumb can have pixel offsets from the left of 0px to 984px on a 1000px SliderTrack.
            // Below we place markers to align with the center of the SliderThumb.
            const pThumb = $("#SliderThumb");
            const nThumbWidth = pThumb.actuallayoutwidth / pThumb.actualuiscale_x;
            const nMarkersWidth = (pMarkers.actuallayoutwidth / pThumb.actualuiscale_x) - nThumbWidth;
            for (let i = 0; i < state.RoundIntervals.length; i++) {
                const nStartTick = state.RoundIntervals[i].nTickStart;
                const nEndTick = state.RoundIntervals[i].nTickEnd;
                let nLeft = nStartTick / state.nTotalTicks * nMarkersWidth + nThumbWidth / 2;
                let nWidth = (nEndTick - nStartTick) / state.nTotalTicks * nMarkersWidth;
                if (i === 0) {
                    // First range marker is extended to the left so the SliderTrack doesn't look like it has a gap
                    // (except for highlights, where gaps between the ranges is expected)
                    nWidth += nLeft;
                    nLeft = 0;
                }
                else if (i === state.RoundIntervals.length - 1) {
                    // Last range marker is extended to the right so the SliderTrack doesn't look like it has a gap
                    nWidth += nThumbWidth / 2;
                }
                const className = i % 2 === 0 ? "roundMarker even" : "roundMarker odd";
                const pMarker = $.CreatePanel("Panel", pMarkers, "", { class: className });
                pMarker.style.position = `${nLeft}px 0 0`;
                pMarker.style.width = nWidth + "px";
            }
        }
        // update highlight markers when the focused player changes
        if (nSpectatingPlayerId != state.nSpectatingPlayerId) {
            CreateHighlightIntervals();
            CreateTimelineEvents();
            nSpectatingPlayerId = state.nSpectatingPlayerId;
            $("#HighlightsButton")?.SetHasClass("hide", !ShouldShowHighlightsButton());
        }
        // check whether highlights mode has changed
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
            //TrueViewCheckBox.SetHasClass( "Selected", cl_demo_predict > 0 );
            TrueViewToggleButton.SetSelected(cl_demo_predict > 0);
            //TrueViewDOACheckBox.SetHasClass( "Selected", cl_trueview_show_doa_predictions != 0 );
            TrueViewDOAToggleButton.SetSelected(cl_trueview_show_doa_predictions != 0);
            TrueViewDOACheckBox.enabled = cl_demo_predict > 0;
            //TrueViewDOAToggleButton.enabled = cl_demo_predict > 0;
            TrueViewWrongVersionCheckBox.enabled = cl_demo_predict > 0;
            //TrueViewWrongVersionToggleButton.enabled = cl_demo_predict > 0;
            if (cl_demo_predict > 0) {
                TrueViewWrongVersionToggleButton.SetSelected(cl_demo_predict >= 2);
            }
        }
        else {
            SettingsPanel.RemoveClass("Visible");
        }
        const cl_demo_predict = parseInt(GameInterfaceAPI.GetSettingString("cl_demo_predict"));
        //TrueViewCheckBox.SetSelected( cl_demo_predict > 0 );
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
            $.Msg(lastState.nTick, fStep / lastState.nSecondsPerTick, lastState.nTick + (fStep / lastState.nSecondsPerTick));
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
        // show either "Round" or "Highlight" depending on the playback mode
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
            const flSkipToTicksBefore = 64 * 2; // skip to 2 seconds before the event when clicking the icon
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
            // Turn it on
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHVkZGVtb2NvbnRyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9odWQvaHVkZGVtb2NvbnRyb2xsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUVyQyxJQUFVLGlCQUFpQixDQStwQjFCO0FBL3BCRCxXQUFVLGlCQUFpQjtJQUV2QixTQUFnQixRQUFRO1FBRXBCLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFIZSwwQkFBUSxXQUd2QixDQUFBO0lBYUQsc0NBQXNDO0lBQ3RDLElBQUssWUFPSjtJQVBELFdBQUssWUFBWTtRQUViLGlFQUFpQixDQUFBO1FBQ2pCLG1FQUFjLENBQUE7UUFDZCxxRUFBZSxDQUFBO1FBQ2YsbUVBQWMsQ0FBQTtRQUNkLHVFQUFnQixDQUFBO0lBQ3BCLENBQUMsRUFQSSxZQUFZLEtBQVosWUFBWSxRQU9oQjtJQUVELDRDQUE0QztJQUM1QyxJQUFLLGlCQU9KO0lBUEQsV0FBSyxpQkFBaUI7UUFFbEIsK0ZBQTJCLENBQUE7UUFDM0IsaUdBQXdCLENBQUE7UUFDeEIscUhBQWtDLENBQUE7UUFDbEMsbUhBQWlDLENBQUE7UUFDakMsMkdBQTZCLENBQUE7SUFDakMsQ0FBQyxFQVBJLGlCQUFpQixLQUFqQixpQkFBaUIsUUFPckI7SUFrQ0QsU0FBUyxvQkFBb0IsQ0FBRSxhQUFnQztRQUUzRCxNQUFNLE1BQU0sR0FBRztZQUNYLE1BQU07WUFDTixPQUFPO1lBQ1AsY0FBYztZQUNkLGlCQUFpQjtZQUNqQixNQUFNLENBQWMsZ0NBQWdDO1NBQ3ZELENBQUE7UUFFRCxPQUFPLE1BQU0sQ0FBRSxhQUFhLENBQUUsQ0FBQztJQUNuQyxDQUFDO0lBT0QsTUFBTSxlQUFlLEdBQUcsRUFBRSxDQUFDO0lBQzNCLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQTZCLENBQUM7SUFDMUQsRUFBRSxDQUFD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