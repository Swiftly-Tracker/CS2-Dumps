"use strict";
/// <reference path="csgo.d.ts" />
var DigitPanelFactory;
(function (DigitPanelFactory) {
    function MakeDigitPanel(elParent, nDigits, suffix = undefined, duration = 0.5, digitStringToken = "#digitpanel_digits", timingFunc = 'cubic-bezier( 0.9, 0.01, 0.1, 1 )') {
        elParent.RemoveAndDeleteChildren();
        const elContainer = $.CreatePanel('Panel', elParent, 'DigitPanel');
        elContainer.m_nDigits = nDigits;
        elContainer.m_suffix = suffix;
        elContainer.m_duration = duration;
        elContainer.m_strDigitsToken = digitStringToken;
        elContainer.m_timingFunc = timingFunc;
        elContainer.m_pendingSetStringHandle = null;
        elContainer.m_bPendingSetStringInstant = false;
        elContainer.style.flowChildren = 'right';
        elContainer.style.overflow = 'clip';
        _MakeDigitPanelContents(elContainer);
        return elContainer;
    }
    DigitPanelFactory.MakeDigitPanel = MakeDigitPanel;
    function _UpdateSuffix(elContainer) {
        if (elContainer.m_suffix != undefined) {
            let elSuffixLabel = elContainer.FindChildTraverse('DigitPanel-Suffix');
            if (!elSuffixLabel) {
                elSuffixLabel = $.CreatePanel('Label', elContainer, 'DigitPanel-Suffix');
                elSuffixLabel.style.marginLeft = '2px';
                elSuffixLabel.style.height = "100%";
                elSuffixLabel.style.textAlign = "right";
            }
            elSuffixLabel.text = elContainer.m_suffix;
        }
        _SetWidth(elContainer);
    }
    function _MakeDigitPanelContents(elContainer) {
        if (!elContainer.IsValid())
            return;
        const elParent = elContainer.GetParent();
        if (!elParent.IsSizeValid()) {
            $.Schedule(0.5, () => _MakeDigitPanelContents(elContainer));
        }
        else {
            const ParentHeight = Math.floor(elParent.actuallayoutheight / elParent.actualuiscale_y);
            elContainer.style.height = ParentHeight + 'px';
            for (let i = 0; i < elContainer.m_nDigits; i++) {
                const elDigit = $.CreatePanel('Panel', elContainer, 'DigitPanel-Digit-' + i);
                elDigit.style.flowChildren = 'down';
                elDigit.AddClass("digitpanel__digit");
                elDigit.style.transitionProperty = 'transform, position';
                elDigit.m_duration = elContainer.m_duration + 's';
                elDigit.style.transitionDuration = elContainer.m_duration + 's';
                elDigit.style.transitionTimingFunction = elContainer.m_timingFunc;
                const arrSymbols = $.Localize(elContainer.m_strDigitsToken).split("");
                arrSymbols.forEach(function (number) {
                    const elNumeralLabel = $.CreatePanel('Label', elDigit, 'DigitPanel-Numeral-' + number);
                    elNumeralLabel.style.textAlign = 'center';
                    elNumeralLabel.style.letterSpacing = '0px';
                    elNumeralLabel.text = number;
                    elNumeralLabel.style.height = ParentHeight + "px";
                    elNumeralLabel.style.horizontalAlign = 'center';
                    elNumeralLabel.AddClass('digitpanel-font');
                });
            }
            _UpdateSuffix(elContainer);
        }
    }
    function _SetWidth(elContainer) {
        if (!elContainer || !elContainer.IsValid())
            return;
        if (!elContainer.IsSizeValid()) {
            $.Schedule(0.1, () => _SetWidth(elContainer));
        }
        else {
            const dig0 = elContainer.FindChildTraverse('DigitPanel-Digit-0');
            const nDigitWidth = Math.ceil(dig0.actuallayoutwidth / dig0.actualuiscale_x);
            let width = elContainer.m_nDigits * nDigitWidth;
            const elSuffixLabel = elContainer.FindChildTraverse('DigitPanel-Suffix');
            if (elSuffixLabel) {
                width += elSuffixLabel.actuallayoutwidth / elSuffixLabel.actualuiscale_x;
            }
            elContainer.style.width = width + 'px';
        }
    }
    function SetDigitPanelString(elParent, string, bInstant = false) {
        if (!elParent || !elParent.IsValid())
            return;
        const elContainer = elParent.FindChildTraverse('DigitPanel');
        if (!elContainer)
            return;
        if (elContainer.m_pendingSetStringHandle !== null) {
            $.CancelScheduled(elContainer.m_pendingSetStringHandle);
            elContainer.m_pendingSetStringHandle = null;
        }
        bInstant ||= elContainer.m_bPendingSetStringInstant;
        if (elContainer.GetChildCount() === 0) {
            elContainer.m_pendingSetStringHandle = $.Schedule(0.1, () => {
                elContainer.m_pendingSetStringHandle = null;
                SetDigitPanelString(elParent, string, bInstant);
            });
            elContainer.m_bPendingSetStringInstant = bInstant;
            return;
        }
        elContainer.m_bPendingSetStringInstant = false;
        const nDigits = elContainer.m_nDigits;
        let arrDigits = String(string).split("");
        const padsNeeded = Math.max(0, nDigits - arrDigits.length);
        if (padsNeeded > 0) {
            const padding = Array(padsNeeded).fill(" ");
            arrDigits = padding.concat(arrDigits);
            arrDigits = arrDigits.slice(0, nDigits);
        }
        const arrSymbols = $.Localize(elContainer.m_strDigitsToken).split("");
        for (let d = nDigits; d >= 0; d--) {
            const symbol = arrDigits[d];
            const elDigit = elContainer.FindChildTraverse('DigitPanel-Digit-' + d);
            if (elDigit) {
                const index = arrSymbols.indexOf(symbol);
                elDigit.visible = d < arrDigits.length;
                if (index >= 0) {
                    elDigit.style.transitionDuration = bInstant ? '0s' : elDigit.m_duration;
                    $.Schedule(0.01, () => {
                        if (elDigit && elDigit.IsValid()) {
                            elDigit.style.transform = "translate3D( " + d + "%," + -Number(index) * 100 + "%, 0px);";
                        }
                    });
                }
            }
        }
        _UpdateSuffix(elContainer);
    }
    DigitPanelFactory.SetDigitPanelString = SetDigitPanelString;
})(DigitPanelFactory || (DigitPanelFactory = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlnaXRwYW5lbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL2RpZ2l0cGFuZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUVsQyxJQUFVLGlCQUFpQixDQWlOMUI7QUFqTkQsV0FBVSxpQkFBaUI7SUFvQjFCLFNBQWdCLGNBQWMsQ0FBRyxRQUFpQixFQUFFLE9BQWUsRUFBRSxTQUE2QixTQUFTLEVBQUUsV0FBbUIsR0FBRyxFQUFFLG1CQUEyQixvQkFBb0IsRUFBRSxhQUFxQixtQ0FBbUM7UUFFN08sUUFBUSxDQUFDLHVCQUF1QixFQUFFLENBQUM7UUFDbkMsTUFBTSxXQUFXLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLFlBQVksQ0FBa0IsQ0FBQztRQUNyRixXQUFXLENBQUMsU0FBUyxHQUFHLE9BQU8sQ0FBQztRQUNoQyxXQUFXLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQztRQUM5QixXQUFXLENBQUMsVUFBVSxHQUFHLFFBQVEsQ0FBQztRQUNsQyxXQUFXLENBQUMsZ0JBQWdCLEdBQUcsZ0JBQWdCLENBQUM7UUFDaEQsV0FBVyxDQUFDLFlBQVksR0FBRyxVQUFVLENBQUM7UUFDdEMsV0FBVyxDQUFDLHdCQUF3QixHQUFHLElBQUksQ0FBQztRQUM1QyxXQUFXLENBQUMsMEJBQTBCLEdBQUcsS0FBSyxDQUFDO1FBRS9DLFdBQVcsQ0FBQyxLQUFLLENBQUMsWUFBWSxHQUFHLE9BQU8sQ0FBQztRQUN6QyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUM7UUFFcEMsdUJBQXVCLENBQUUsV0FBVyxDQUFFLENBQUM7UUFFdkMsT0FBTyxXQUFXLENBQUM7SUFDcEIsQ0FBQztJQWxCZSxnQ0FBYyxpQkFrQjdCLENBQUE7SUFFRCxTQUFTLGFBQWEsQ0FBRyxXQUF5QjtRQUdqRCxJQUFLLFdB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