"use strict";
/// <reference path="../csgo.d.ts" />
var PopupCustomLayout;
(function (PopupCustomLayout) {
    // This panel is created with useglobalcontext, so handlers registered via
    // $.RegisterForUnhandledEvent live on the global context and are not torn down when the popup
    // panel is destroyed. We remember the watch-event registration and clear it on every close path
    // (and before registering a new one) so a single handler exists at a time and a stale one can't
    // run against a destroyed popup.
    let g_sWatchEvent;
    let g_nWatchEventHandlerId;
    function CleanupWatchEvent() {
        if (g_sWatchEvent !== undefined && g_nWatchEventHandlerId !== undefined) {
            $.UnregisterForUnhandledEvent(g_sWatchEvent, g_nWatchEventHandlerId);
        }
        g_sWatchEvent = undefined;
        g_nWatchEventHandlerId = undefined;
    }
    function Init() {
        const oSettings = $.GetContextPanel().Data().oSettings;
        $.GetContextPanel().SetHasClass('HideTitle', oSettings.title === undefined || oSettings.title === null || oSettings.title === '');
        $.GetContextPanel().SetDialogVariable("title", oSettings.title);
        $.GetContextPanel().SetDialogVariable("message", oSettings.message);
        $.GetContextPanel().SetHasClass('NoMinWidth', oSettings.no_min_width);
        $("#popupimage").SetImage(oSettings.image);
        $("#Spinner").SetHasClass("SpinnerVisible", oSettings.show_spinner != 0);
        // Loading bar is visible if loadingBarCallback is set up
        if (oSettings.show_loading_bar) {
            $.Msg('Loading bar should be visible');
            let progressBar = $("#ProgressBar");
            progressBar.SetHasClass("ProgressBarVisible", true);
            // Min / Max could be passed as attributes as well
            progressBar.min = 0.0;
            progressBar.max = 1.0;
            progressBar.value = 0.0;
            // Set up first update of the progress bar
            $.Schedule(0.1, UpdateProgressBar);
        }
        if (oSettings.timeout > 0) {
            $.Schedule(oSettings.timeout, () => {
                CleanupWatchEvent();
                $.DispatchEvent('UIPopupButtonClicked', '');
            });
        }
        $.GetContextPanel().SetHasClass('HideButtons', oSettings.hide_buttons);
        if (oSettings.watch_event && oSettings.watch_event_callback) {
            const sWatchEvent = oSettings.watch_event;
            const nCallbackHandle = oSettings.watch_event_callback;
            // Drop any registration left behind by a previous popup before adding this one.
            CleanupWatchEvent();
            g_sWatchEvent = sWatchEvent;
            g_nWatchEventHandlerId = $.RegisterForUnhandledEvent(sWatchEvent, () => {
                // Unregister before doing any work so the one-shot handler can't re-enter if the
                // callback dispatches the same event again.
                CleanupWatchEvent();
                UiToolkitAPI.InvokeJSCallback(nCallbackHandle);
                OnOKPressed();
            });
        }
    }
    PopupCustomLayout.Init = Init;
    ;
    function OnOKPressed() {
        // Covers the case where the popup is closed via the OK button before the watched event fires.
        CleanupWatchEvent();
        // Run some js code
        $.Msg('OnComplexPressed: Running from \'popup custom layout\'\n');
        // Invoke callback set up in the parent panel (if set)
        let callbackHandle = $.GetContextPanel().GetAttributeInt("callback", -1);
        if (callbackHandle != -1) {
            UiToolkitAPI.InvokeJSCallback(callbackHandle, 'OK');
        }
        // Do not forget to dispatch the UIPopupButtonClicked() panorama event
        // responsible for closing the popup
        $.DispatchEvent('UIPopupButtonClicked', '');
    }
    function UpdateProgressBar() {
        let loadingBarCallbackHandle = $.GetContextPanel().GetAttributeInt("loadingBarCallback", -1);
        if (loadingBarCallbackHandle != -1) {
            $("#ProgressBar").value = UiToolkitAPI.InvokeJSCallback(loadingBarCallbackHandle);
            // Set up next update
            $.Schedule(0.1, UpdateProgressBar);
        }
    }
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
    }
})(PopupCustomLayout || (PopupCustomLayout = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfY3VzdG9tX2xheW91dC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3BvcHVwcy9wb3B1cF9jdXN0b21fbGF5b3V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFrQnJDLElBQVUsaUJBQWlCLENBc0gxQjtBQXRIRCxXQUFVLGlCQUFpQjtJQUV2QiwwRUFBMEU7SUFDMUUsOEZBQThGO0lBQzlGLGdHQUFnRztJQUNoRyxnR0FBZ0c7SUFDaEcsaUNBQWlDO0lBQ2pDLElBQUksYUFBaUMsQ0FBQztJQUN0QyxJQUFJLHNCQUEwQyxDQUFDO0lBRS9DLFNBQVMsaUJBQWlCO1FBRXRCLElBQUssYUFBYSxLQUFLLFNBQVMsSUFBSSxzQkFBc0IsS0FBSyxTQUFTLEVBQ3hFO1lBQ0ksQ0FBQyxDQUFDLDJCQUEyQixDQUFFLGFBQWEsRUFBRSxzQkFBc0IsQ0FBRSxDQUFDO1NBQzFFO1FBQ0QsYUFBYSxHQUFHLFNBQVMsQ0FBQztRQUMxQixzQkFBc0IsR0FBRyxTQUFTLENBQUM7SUFDdkMsQ0FBQztJQUVELFNBQWdCLElBQUk7UUFFaEIsTUFBTSxTQUFTLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDLFNBQVMsQ0FBQztRQUV2RCxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsV0FBVyxDQUFFLFdBQVcsRUFBRSxTQUFTLENBQUMsS0FBSyxLQUFLLFNBQVMsSUFBSSxTQUFTLENBQUMsS0FBSyxLQUFLLElBQUksSUFBSSxTQUFTLENBQUMsS0FBSyxLQUFLLEVBQUUsQ0FBRSxDQUFDO1FBQ3BJLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBRSxPQUFPLEVBQUUsU0FBUyxDQUFDLEtBQUssQ0FBRSxDQUFDO1FBRWxFLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBRSxTQUFTLEVBQUUs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