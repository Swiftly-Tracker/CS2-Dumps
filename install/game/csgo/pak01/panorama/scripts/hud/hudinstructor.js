"use strict";
/// <reference path="../csgo.d.ts" />
var HudInstructor;
(function (HudInstructor) {
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
    {
        $.RegisterEventHandler('CSGOHudInstructorShowBindings', $.GetContextPanel(), OnShowBindingsEvent);
        $.RegisterEventHandler('CSGOHudInstructorHideBindings', $.GetContextPanel(), OnHideBindingsEvent);
    }
})(HudInstructor || (HudInstructor = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHVkaW5zdHJ1Y3Rvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL2h1ZC9odWRpbnN0cnVjdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFFckMsSUFBVSxhQUFhLENBa0l0QjtBQWxJRCxXQUFVLGFBQWE7SUFVdEIsU0FBUyxXQUFXLENBQUcsUUFBdUIsRUFBRSxRQUFnQixFQUFFLENBQVM7UUFFMUUsSUFBSyxRQUFRLENBQUMsU0FBUyxDQUFFLFFBQVEsQ0FBRSxFQUNuQztZQUNDLFlBQVksQ0FBRSxRQUFRLENBQUUsQ0FBQztZQUN6QixPQUFPO1NBQ1A7UUFFRCxJQUFJLGNBQWMsR0FBRyxlQUFlLENBQUM7UUFDckMsSUFBSSxXQUFXLEdBQUcsb0JBQW9CLENBQUM7UUFDdkMsTUFBTSxPQUFPLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBdUIsQ0FBQyxVQUFVLENBQUUsUUFBUSxFQUFFLENBQUMsQ0FBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ2pHLElBQUssT0FBTyxJQUFJLEVBQUUsRUFDbEI7WUFDQyxXQUFXLEdBQUcsRUFBRSxDQUFDO1lBRWpCLElBQUssT0FBTyxLQUFLLFFBQVEsRUFDekI7Z0JBQ0MsY0FBYyxHQUFHLGdCQUFnQixDQUFDO2FBQ2xDO2lCQUNJLElBQUssT0FBTyxLQUFLLFFBQVEsRUFDOUI7Z0JBQ0MsY0FBYyxHQUFHLGlCQUFpQixDQUFDO2FBQ25DO2lCQUNJLElBQUssT0FBTyxLQUFLLFFBQVEsRUFDOUI7Z0JBQ0MsY0FBYyxHQUFHLGlCQUFpQixDQUFDO2FBQ25DO2lCQUNJLElBQUssT0FBTyxLQUFLLFVBQVUsRUFDaEM7Z0JBQ0MsY0FBYyxHQUFHLG9CQUFvQixDQUFDO2FBQ3RDO2lCQUNJLElBQUssT0FBTyxLQUFLLFlBQVksRUFDbEM7Z0JBQ0MsY0FBYyxHQUFHLHNCQUFzQixDQUFDO2FBQ3hDO2lC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