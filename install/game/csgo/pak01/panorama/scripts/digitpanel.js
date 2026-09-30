"use strict";
/// <reference path="csgo.d.ts" />
var DigitPanelFactory;
(function (DigitPanelFactory) {
    // because this setup might happen before layout, we can't get or infer the size of the container so we
    // require that the height and width be specified in the maker
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
        // if we passed in any suffix then we want to replace whatever is there
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
            // elContainer.style.paddingRight = '5px';
            for (let i = 0; i < elContainer.m_nDigits; i++) {
                const elDigit = $.CreatePanel('Panel', elContainer, 'DigitPanel-Digit-' + i);
                elDigit.style.flowChildren = 'down';
                elDigit.AddClass("digitpanel__digit");
                elDigit.style.transitionProperty = 'transform, position';
                elDigit.m_duration = elContainer.m_duration + 's'; // we store the duration so we can make instant transitions and revert to non-instant.
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
            // set the width
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
            // $.Msg( "Postpone _SetDigitPanelString until digit panels have been created for " + elParent.id );
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
                    //	elDigit.style.position = ri * 25 + "% " + -Number( number ) + "00% 0px";
                    elDigit.style.transitionDuration = bInstant ? '0s' : elDigit.m_duration;
                    // we schedule this out a fraction so that we can pick up the transition duration change above.
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlnaXRwYW5lbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL2RpZ2l0cGFuZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUVsQyxJQUFVLGlCQUFpQixDQWlOMUI7QUFqTkQsV0FBVSxpQkFBaUI7SUFrQjFCLHVHQUF1RztJQUN2Ryw4REFBOEQ7SUFDOUQsU0FBZ0IsY0FBYyxDQUFHLFFBQWlCLEVBQUUsT0FBZSxFQUFFLFNBQTZCLFNBQVMsRUFBRSxXQUFtQixHQUFHLEVBQUUsbUJBQTJCLG9CQUFvQixFQUFFLGFBQXFCLG1DQUFtQztRQUU3TyxRQUFRLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUNuQyxNQUFNLFdBQVcsR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsWUFBWSxDQUFrQixDQUFDO1FBQ3JGLFdBQVcsQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFDO1FBQ2hDLFdBQVcsQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDO1FBQzlCLFdBQVcsQ0FBQyxVQUFVLEdBQUcsUUFBUSxDQUFDO1FBQ2xDLFdBQVcsQ0FBQyxnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQztRQUNoRCxXQUFXLENBQUMsWUFBWSxHQUFHLFVBQVUsQ0FBQztRQUN0QyxXQUFXLENBQUMsd0JBQXdCLEdBQUcsSUFBSSxDQUFDO1FBQzVDLFdBQVcsQ0FBQywwQkFBMEIsR0FBRyxLQUFLLENBQUM7UUFFL0MsV0FBVyxDQUFDLEtBQUssQ0FBQyxZQUFZLEdBQUcsT0FBTyxDQUFDO1FBQ3pDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQztRQUVwQyx1QkFBdUIsQ0FBRSxXQUFXLENBQUUsQ0FBQztRQUV2QyxPQUFPLFdBQVcsQ0FBQztJQUNwQixDQUFDO0lBbEJlLGdDQUFjLGlCQWtCN0IsQ0FBQTtJQUVELFNBQVMsYUFBYSxDQUFHLFdBQXlCO1FBRWpELHVFQUF1RTtRQUN2RSxJQUFLLFdBQVcsQ0FBQyxRQUFRLElBQUksU0FBUyxFQUN0QztZQUNDLElBQUksYUFBYSxHQUFHLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBRSxtQkFBbUIsQ0FBb0IsQ0FBQztZQUMzRixJQUFLLENBQUMsYUFBYSxFQUNuQjtnQkFDQyxhQUFhLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLG1CQUFtQixDQUFFLENBQUM7Z0JBQzNFLGFBQWEsQ0FBQyxLQUFLLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztnQkFDdkMsYUFBYSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO2dCQUNwQyxhQUFhLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxPQUFPLENBQUM7YUFDeEM7WUFFRCxhQUFhLENBQUMsSUFBSSxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUM7U0FDMUM7UUFFRCxTQUFTLENBQUUsV0FBVyxDQUFFLENBQUM7SUFDMUIsQ0FBQztJQUVELFNBQVMsdUJBQXVCLENBQUcsV0FBeUI7UUFFM0QsSUFBSyxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUU7WUFDMUIsT0FBTztRQUVSLE1BQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUV6QyxJQUFLLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxFQUM1QjtZQUNDLENBQUMsQ0FBQyxRQUFRLENBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLHVCQUF1QixDQUFFLFdBQVcsQ0FBRSxDQUFFLENBQUM7U0FDaEU7YUFFRDtZQUNDLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUUsUUFBUSxDQUFDLGtCQUFrQixHQUFHLFFBQVEsQ0FBQyxlQUFlLENBQUUsQ0FBQztZQUUxRixXQUFXLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxZQUFZLEdBQUcsSUFBSSxDQUFDO1lBQy9DLDBDQUEwQztZQUUxQyxLQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsV0FBVyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsRUFDL0M7Z0JBQ0MsTUFBTSxPQUFPLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLG1CQUFtQixHQUFHLENBQUMsQ0FBdUIsQ0FBQztnQkFDcEcsT0FBTyxDQUFDLEtBQUssQ0FBQyxZQUFZLEdBQUcsTUFBTSxDQUFDO2dCQUNwQyxPQUFPLENBQUMsUUFBUSxDQUFFLG1CQUFtQixDQUFFLENBQUM7Z0JBQ3hDLE9BQU8sQ0FBQyxLQUFLLENBQUMsa0JBQWtCLEdBQUcscUJBQXFCLENBQUM7Z0JBQ3pELE9BQU8sQ0FBQyxVQUFVLEdBQUcsV0FBVyxDQUFDLFVBQVUsR0FBRyxHQUFHLENBQUMsQ0FBQyxzRkFBc0Y7Z0JBQ3pJLE9BQU8sQ0FBQyxLQUFLLENBQUMsa0JBQWtCLEdBQUcsV0FBVyxDQUFDLFVBQVUsR0FBRyxHQUFHLENBQUM7Z0JBQ2hFLE9BQU8sQ0FBQyxLQUFLLENBQUMsd0JBQXdCLEdBQUcsV0FBVyxDQUFDLFlBQVksQ0FBQztnQkFHbEUsTUFBTSxVQUFVLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxXQUFXLENBQUMsZ0JBQWdCLENBQUUsQ0FBQyxLQUFLLENBQUUsRUFBRSxDQUFFLENBQUM7Z0JBRTFFLFVBQVUsQ0FBQyxPQUFPLENBQUUsVUFBVyxNQUFNO29CQUVwQyxNQUFNLGNBQWMsR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUscUJBQXFCLEdBQUcsTUFBTSxDQUFFLENBQUM7b0JBQ3pGLGNBQWMsQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztvQkFDMUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDO29CQUMzQyxjQUFjLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQztvQkFDN0IsY0FBYyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsWUFBWSxHQUFHLElBQUksQ0FBQztvQkFDbEQsY0FBYyxDQUFDLEtBQUssQ0FBQyxlQUFlLEdBQUcsUUFBUSxDQUFDO29CQUNoRCxjQUFjLENBQUMsUUFBUSxDQUFFLGlCQUFpQixDQUFFLENBQUM7Z0JBRTlDLENBQUMsQ0FBRSxDQUFDO2FBQ0o7WUFFRCxhQUFhLENBQUUsV0FBVyxDQUFHLENBQUM7U0FDOUI7SUFDRixDQUFDO0lBRUQsU0FBUyxTQUFTLENBQUcsV0FBeUI7UUFFN0MsSUFBSyxDQUFDLFdBQVcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUU7WUFDMUMsT0FBTztRQUVSLElBQUssQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFLEVBQy9CO1lBQ0MsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUyxDQUFFLFdBQVcsQ0FBRSxDQUFFLENBQUM7U0FDbEQ7YUFFRDtZQUNDLGdCQUFnQjtZQUNoQixNQUFNLElBQUksR0FBRyxXQUFXLENBQUMsaUJBQWlCLENBQUUsb0JBQW9CLENBQUUsQ0FBQztZQUNuRSxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFFLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFFLENBQUM7WUFFL0UsSUFBSSxLQUFLLEdBQUcsV0FBVyxDQUFDLFNBQVMsR0FBRyxXQUFXLENBQUM7WUFFaEQsTUFBTSxhQUFhLEdBQUcsV0FBVyxDQUFDLGlCQUFpQixDQUFFLG1CQUFtQixDQUFFLENBQUM7WUFDM0UsSUFBSyxhQUFhLEVBQ2xCO2dCQUNDLEtBQUssSUFBSSxhQUFhLENBQUMsaUJBQWlCLEdBQUcsYUFBYSxDQUFDLGVBQWUsQ0FBQzthQUN6RTtZQUVELFdBQVcsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEtBQUssR0FBRyxJQUFJLENBQUM7U0FDdkM7SUFDRixDQUFDO0lBRUQsU0FBZ0IsbUJBQW1CLENBQUcsUUFBaUIsRUFBRSxNQUFjLEVBQUUsUUFBUSxHQUFHLEtBQUs7UUFFeEYsSUFBSyxDQUFDLFFBQVEsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUU7WUFDcEMsT0FBTztRQUVSLE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBRSxZQUFZLENBQXlCLENBQUM7UUFDdEYsSUFBSyxDQUFDLFdBQVc7WUFDaEIsT0FBTztRQUVSLElBQUssV0FBVyxDQUFDLHdCQUF3QixLQUFLLElBQUksRUFDbEQ7WUFDQyxDQUFDLENBQUMsZUFBZSxDQUFFLFdBQVcsQ0FBQyx3QkFBd0IsQ0FBRSxDQUFBO1lBQ3pELFdBQVcsQ0FBQyx3QkFBd0IsR0FBRyxJQUFJLENBQUM7U0FDNUM7UUFFRCxRQUFRLEtBQUssV0FBVyxDQUFDLDBCQUEwQixDQUFDO1FBRXBELElBQUssV0FBVyxDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsRUFDdEM7WUFDQyxvR0FBb0c7WUFDcEcsV0FBVyxDQUFDLHdCQUF3QixHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRTtnQkFDNUQsV0FBVyxDQUFDLHdCQUF3QixHQUFHLElBQUksQ0FBQztnQkFDNUMsbUJBQW1CLENBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxRQUFRLENBQUUsQ0FBQztZQUNuRCxDQUFDLENBQUUsQ0FBQztZQUNKLFdBQVcsQ0FBQywwQkFBMEIsR0FBRyxRQUFRLENBQUM7WUFDbEQsT0FBTztTQUNQO1FBRUQsV0FBVyxDQUFDLDBCQUEwQixHQUFHLEtBQUssQ0FBQztRQUUvQyxNQUFNLE9BQU8sR0FBRyxXQUFXLENBQUMsU0FBUyxDQUFDO1FBRXRDLElBQUksU0FBUyxHQUFHLE1BQU0sQ0FBRSxNQUFNLENBQUUsQ0FBQyxLQUFLLENBQUUsRUFBRSxDQUFFLENBQUM7UUFFN0MsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBRSxDQUFDLEVBQUUsT0FBTyxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUUsQ0FBQztRQUM3RCxJQUFLLFVBQVUsR0FBRyxDQUFDLEVBQ25CO1lBQ0MsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFFLFVBQVUsQ0FBRSxDQUFDLElBQUksQ0FBRSxHQUFHLENBQUUsQ0FBQztZQUNoRCxTQUFTLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBRSxTQUFTLENBQUUsQ0FBQztZQUN4QyxTQUFTLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBRSxDQUFDLEVBQUUsT0FBTyxDQUFFLENBQUM7U0FDMUM7UUFFRCxNQUFNLFVBQVUsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFFLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBRSxDQUFDLEtBQUssQ0FBRSxFQUFFLENBQUUsQ0FBQztRQUUxRSxLQUFNLElBQUksQ0FBQyxHQUFHLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUNsQztZQUNDLE1BQU0sTUFBTSxHQUFHLFNBQVMsQ0FBRSxDQUFDLENBQUUsQ0FBQztZQUM5QixNQUFNLE9BQU8sR0FBRyxXQUFXLENBQUMsaUJBQWlCLENBQUUsbUJBQW1CLEdBQUcsQ0FBQyxDQUE4QixDQUFDO1lBRXJHLElBQUssT0FBTyxFQUNaO2dCQUNDLE1BQU0sS0FBSyxHQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUUsTUFBTSxDQUFFLENBQUM7Z0JBRTNDLE9BQU8sQ0FBQyxPQUFPLEdBQUcsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUM7Z0JBRXZDLElBQUssS0FBSyxJQUFJLENBQUMsRUFDZjtvQkFDQywyRUFBMkU7b0JBQzNFLE9BQU8sQ0FBQyxLQUFLLENBQUMsa0JBQWtCLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUM7b0JBRXhFLCtGQUErRjtvQkFDL0YsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxJQUFJLEVBQUUsR0FBRyxFQUFFO3dCQUV0QixJQUFLLE9BQU8sSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFLEVBQ2pDOzRCQUNDLE9BQU8sQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLGVBQWUsR0FBRyxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsTUFBTSxDQUFFLEtBQUssQ0FBRSxHQUFHLEdBQUcsR0FBRyxVQUFVLENBQUM7eUJBQzNGO29CQUNGLENBQUMsQ0FBRSxDQUFDO2lCQUNKO2FBQ0Q7U0FDRDtRQUVELGFBQWEsQ0FBRSxXQUFXLENBQUUsQ0FBQztJQUM5QixDQUFDO0lBekVlLHFDQUFtQixzQkF5RWxDLENBQUE7QUFDRixDQUFDLEVBak5TLGlCQUFpQixLQUFqQixpQkFBaUIsUUFpTjFCIn0=