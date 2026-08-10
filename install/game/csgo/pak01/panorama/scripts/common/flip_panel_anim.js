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