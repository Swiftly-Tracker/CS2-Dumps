"use strict";
/// <reference path="../csgo.d.ts" />
var HudInstructor;
(function (HudInstructor) {
    // ShowBinding is javascript equivalent of src1 CLocatorTarget::UseBindingImage().
    // Cycles through the list of bindings showing each one in turn.
    function ShowBinding(elLesson, hLocator, i) {
        if (elLesson.BHasClass('hidden')) {
            HideBindings(elLesson);
            return;
        }
        let bindingTexture = 'icon_key_wide';
        let bindingText = '#GameUI_Icons_NONE';
        const binding = $.GetContextPanel().GetBinding(hLocator, i).toUpperCase();
        if (binding != '') {
            bindingText = '';
            if (binding === 'MOUSE1') {
                bindingTexture = 'icon_mouseLeft';
            }
            else if (binding === 'MOUSE2') {
                bindingTexture = 'icon_mouseRight';
            }
            else if (binding === 'MOUSE3') {
                bindingTexture = 'icon_mouseThree';
            }
            else if (binding === 'MWHEELUP') {
                bindingTexture = 'icon_mouseWheel_up';
            }
            else if (binding === 'MWHEELDOWN') {
                bindingTexture = 'icon_mouseWheel_down';
            }
            else if (binding === 'UPARROW') {
                bindingTexture = 'icon_key_up';
            }
            else if (binding === 'LEFTARROW') {
                bindingTexture = 'icon_key_left';
            }
            else if (binding === 'DOWNARROW') {
                bindingTexture = 'icon_key_down';
            }
            else if (binding === 'RIGHTARROW') {
                bindingTexture = 'icon_key_right';
            }
            else if (binding === 'SEMICOLON') {
                bindingTexture = 'icon_key_generic';
                bindingText = ';';
            }
            else if (binding.length <= 3) {
                bindingTexture = 'icon_key_generic';
                bindingText = binding;
            }
            else {
                bindingTexture = 'icon_key_wide';
                bindingText = binding;
            }
            const elBindingLabel = elLesson.FindChildTraverse('LocatorBindingText');
            const bShowBindingText = (bindingText != '');
            elLesson.SetHasClass('ShowBindingText', bShowBindingText);
            if (bShowBindingText) {
                elBindingLabel.text = $.Localize(bindingText);
            }
            elLesson.SwitchClass('BindingIcon', bindingTexture);
            if (elLesson.bindingCount && elLesson.bindingCount > 1) {
                // Schedule display of next binding in the list
                let iNext = i + 1;
                if (iNext == elLesson.bindingCount) {
                    iNext = 0;
                }
                elLesson.animhandle = $.Schedule(.75, () => ShowBinding(elLesson, hLocator, iNext));
            }
        }
    }
    function HideBindings(elLesson) {
        if (elLesson.animhandle) {
            $.CancelScheduled(elLesson.animhandle);
            elLesson.animhandle = undefined;
        }
        elLesson.SetHasClass('ShowBindingText', false);
        elLesson.SwitchClass('BindingIcon', 'none');
    }
    function OnShowBindingsEvent(elLesson, hLocator, bindingCount) {
        HideBindings(elLesson);
        elLesson.bindingCount = bindingCount;
        ShowBinding(elLesson, hLocator, 0);
    }
    function OnHideBindingsEvent(elLesson) {
        HideBindings(elLesson);
    }
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        $.RegisterEventHandler('CSGOHudInstructorShowBindings', $.GetContextPanel(), OnShowBindingsEvent);
        $.RegisterEventHandler('CSGOHudInstructorHideBindings', $.GetContextPanel(), OnHideBindingsEvent);
    }
})(HudInstructor || (HudInstructor = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHVkaW5zdHJ1Y3Rvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL2h1ZC9odWRpbnN0cnVjdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFFckMsSUFBVSxhQUFhLENBa0l0QjtBQWxJRCxXQUFVLGFBQWE7SUFRdEIsa0ZBQWtGO0lBQ2xGLGdFQUFnRTtJQUNoRSxTQUFTLFdBQVcsQ0FBRyxRQUF1QixFQUFFLFFBQWdCLEVBQUUsQ0FBUztRQUUxRSxJQUFLLFFBQVEsQ0FBQyxTQUFTLENBQUUsUUFBUSxDQUFFLEVBQ25DO1lBQ0MsWUFBWSxDQUFFLFFBQVEsQ0FBRSxDQUFDO1lBQ3pCLE9BQU87U0FDUDtRQUVELElBQUksY0FBYyxHQUFHLGVBQWUsQ0FBQztRQUNyQyxJQUFJLFdBQVcsR0FBRyxvQkFBb0IsQ0FBQztRQUN2QyxNQUFNLE9BQU8sR0FBRyxDQUFDLENBQUMsZUFBZSxFQUF1QixDQUFDLFVBQVUsQ0FBRSxRQUFRLEVBQUUsQ0FBQyxDQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDakcsSUFBSyxPQUFPLElBQUksRUFBRSxFQUNsQjtZQUNDLFdBQVcsR0FBRyxFQUFFLENBQUM7WUFFakIsSUFBSyxPQUFPLEtBQUssUUFBUSxFQUN6QjtnQkFDQyxjQUFjLEdBQUcsZ0JBQWdCLENBQUM7YUFDbEM7aUJBQ0ksSUFBSyxPQUFPLEtBQUssUUFBUSxFQUM5QjtnQkFDQyxjQUFjLEdBQUcsaUJBQWlCLENBQUM7YUFDbkM7aUJBQ0ksSUFBSyxPQUFPLEtBQUssUUFBUSxFQUM5QjtnQkFDQyxjQUFjLEdBQUcsaUJBQWlCLENBQUM7YUFDbkM7aUJBQ0ksSUFBSyxPQUFPLEtBQUssVUFBVSxFQUNoQztnQkFDQyxjQUFjLEdBQUcsb0JBQW9CLENBQUM7YUFDdEM7aUJBQ0ksSUFBSyxPQUFPLEtBQUssWUFBWSxFQUNsQztnQkFDQyxjQUFj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