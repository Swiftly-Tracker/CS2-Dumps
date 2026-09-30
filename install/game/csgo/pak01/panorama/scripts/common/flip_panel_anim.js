"use strict";
/// <reference path="../csgo.d.ts" />
var FlipPanelAnimation = class {
    oData;
    get ActiveIndex() { return this.oData.activeIndex; }
    set ActiveIndex(value) { this.oData.activeIndex = value; }
    set CallbackData(value) { this.oData.oCallbackData = value; }
    constructor(oData) {
        this.oData = oData;
    }
    AddParamToCallbackData(param, value) {
        this.oData.oCallbackData[param] = value;
    }
    ControlBtnActions() {
        if (this.oData.controlBtnPrev) {
            this.oData.controlBtnPrev.SetPanelEvent('onactivate', this.oData.funcCallback.bind(this, this.oData, true));
            this.oData.controlBtnNext.SetPanelEvent('onactivate', this.oData.funcCallback.bind(this, this.oData, false));
            this.oData.controlBtnPrev.enabled = false;
            this.oData.controlBtnNext.enabled = false;
        }
    }
    UpdateTextLabel(elPanel, aTextData) {
        aTextData.forEach(element => {
            if (typeof element.value == 'number' && element.value > 0) {
                elPanel.SetDialogVariableInt(element.name, element.value);
            }
            else if (element.value) {
                elPanel.SetDialogVariable(element.name, element.value.toString());
            }
        });
    }
    UseCallback() {
        this.oData.funcCallback(this.oData, false);
    }
    DetermineVisiblePanel(animPanelA, animPanelB) {
        return animPanelA.BHasClass('flip-panel-anim-down-show') || animPanelA.BHasClass('flip-panel-anim-up-show') ? animPanelA : animPanelB;
    }
    // The anim functions take args so we can use it with some other panels
    BtnPressNextAnim(panelA, panelB) {
        const visiblePanel = this.DetermineVisiblePanel(panelA, panelB);
        const hiddenPanel = visiblePanel === panelA ? panelB : panelA;
        visiblePanel.RemoveClass('flip-panel-anim-transition');
        visiblePanel.RemoveClass('flip-panel-anim-up-hidden');
        visiblePanel.RemoveClass('flip-panel-anim-down-show');
        visiblePanel.RemoveClass('flip-panel-anim-up-show');
        visiblePanel.RemoveClass('flip-panel-anim-down-hidden');
        visiblePanel.AddClass('flip-panel-anim-transition');
        visiblePanel.AddClass('flip-panel-anim-down-hidden');
        hiddenPanel.RemoveClass('flip-panel-anim-transition');
        hiddenPanel.RemoveClass('flip-panel-anim-down-hidden');
        hiddenPanel.AddClass('flip-panel-anim-up-hidden');
        hiddenPanel.AddClass('flip-panel-anim-transition');
        hiddenPanel.AddClass('flip-panel-anim-down-show');
    }
    // The anim functions take args so we can use it with some other panels
    BtnPressPrevAnim(panelA, panelB) {
        const visiblePanel = this.DetermineVisiblePanel(panelA, panelB);
        const hiddenPanel = visiblePanel === panelA ? panelB : panelA;
        visiblePanel.RemoveClass('flip-panel-anim-transition');
        visiblePanel.RemoveClass('flip-panel-anim-up-hidden');
        visiblePanel.RemoveClass('flip-panel-anim-down-show');
        visiblePanel.RemoveClass('flip-panel-anim-up-show');
        visiblePanel.RemoveClass('flip-panel-anim-down-hidden');
        visiblePanel.AddClass('flip-panel-anim-transition');
        visiblePanel.AddClass('flip-panel-anim-up-hidden');
        hiddenPanel.RemoveClass('flip-panel-anim-transition');
        hiddenPanel.RemoveClass('flip-panel-anim-up-hidden');
        hiddenPanel.AddClass('flip-panel-anim-down-hidden');
        hiddenPanel.AddClass('flip-panel-anim-transition');
        hiddenPanel.AddClass('flip-panel-anim-up-show');
    }
    DetermineHiddenPanel(animPanelA, animPanelB) {
        return (!animPanelA.BHasClass('flip-panel-anim-down-show') &&
            !animPanelA.BHasClass('flip-panel-anim-up-show')) ?
            animPanelA : animPanelB;
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmxpcF9wYW5lbF9hbmltLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvY29tbW9uL2ZsaXBfcGFuZWxfYW5pbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBZ0JyQyxJQUFJLGtCQUFrQixHQUFHO0lBRXhCLEtBQUssQ0FBeUI7SUFFOUIsSUFBVyxXQUFXLEtBQU0sT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7SUFDNUQsSUFBVyxXQUFXLENBQUcsS0FBYSxJQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFFNUUsSUFBVyxZQUFZLENBQUcsS0FBa0MsSUFBSyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBRXBHLFlBQWEsS0FBNkI7UUFFekMsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7SUFDcEIsQ0FBQztJQUVELHNCQUFzQixDQUFHLEtBQXNCLEVBQUUsS0FBc0I7UUFFdEUsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUUsS0FBSyxDQUFFLEdBQUcsS0FBSyxDQUFDO0lBQzNDLENBQUM7SUFFRCxpQkFBaUI7UUFFaEIsSUFBSyxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsRUFDOUI7WUFDQyxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUUsQ0FBRSxDQUFDO1lBQ2hILElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENB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