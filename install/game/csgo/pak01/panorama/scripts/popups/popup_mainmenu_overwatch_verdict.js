"use strict";
/// <reference path="../csgo.d.ts" />
var overwatch_verdict;
(function (overwatch_verdict) {
    var _verdictTypes = [
        { type: "aimbot", classification: "#Panorama_Overwatch_Major_Disruption", title: "#Panorama_Overwatch_Res_AimHacking", desc: "#SFUI_Overwatch_Res_AimHacking_Desc" },
    ];
    var _finalVerdict = "";
    function Init() {
        var elVerdictTypes = $.GetContextPanel().FindChildInLayoutFile('VerdictTypes');
        if (elVerdictTypes === undefined || elVerdictTypes === null)
            return;
        elVerdictTypes.RemoveAndDeleteChildren();
        _verdictTypes.forEach(function (verdict, i) {
            var elVerdict = $.CreatePanel('Panel', elVerdictTypes, 'Verdict' + i);
            elVerdict.BLoadLayoutSnippet('verdict_type');
            elVerdict.SetDialogVariable('verdict_classification', $.Localize(verdict.classification));
            elVerdict.SetDialogVariable('verdict_title', $.Localize(verdict.title));
            elVerdict.SetDialogVariable('verdict_desc', $.Localize(verdict.desc));
            _SetupVerdictButtons(elVerdict.FindChildInLayoutFile('verdict_btn_not_guilty'), verdict);
            _SetupVerdictButtons(elVerdict.FindChildInLayoutFile('verdict_btn_guilty'), verdict);
        });
    }
    overwatch_verdict.Init = Init;
    function _SetupVerdictButtons(elButton, verdict) {
        if (elButton === undefined || elButton === null)
            return;
        elButton.group = verdict.type;
        elButton.SetPanelEvent('onselect', _UpdateSubmitButton);
    }
    function _UpdateFinalVerdict() {
        _finalVerdict = "";
        var bHasAllVerdict = true;
        _verdictTypes.forEach(function (verdict, i) {
            var elVerdict = $.GetContextPanel().FindChildInLayoutFile('Verdict' + i);
            if (elVerdict === undefined || elVerdict === null)
                return false;
            if (elVerdict.FindChildInLayoutFile('verdict_btn_not_guilty').checked) {
                _finalVerdict += verdict.type + ":dismiss;";
            }
            else if (elVerdict.FindChildInLayoutFile('verdict_btn_guilty').checked) {
                _finalVerdict += verdict.type + ":convict;";
            }
            else {
                bHasAllVerdict = false;
                return true;
            }
        });
        return bHasAllVerdict;
    }
    function _UpdateSubmitButton() {
        var btnSubmitVerdict = $.GetContextPanel().FindChildInLayoutFile('SubmitVerdictBtn');
        if (btnSubmitVerdict === undefined || btnSubmitVerdict === null || btnSubmitVerdict.enabled == true)
            return;
        btnSubmitVerdict.enabled = _UpdateFinalVerdict();
    }
    function SubmitVerdict() {
        OverwatchAPI.SubmitCaseVerdict(_finalVerdict);
        $.DispatchEvent('UIPopupButtonClicked', '');
    }
    overwatch_verdict.SubmitVerdict = SubmitVerdict;
    ;
})(overwatch_verdict || (overwatch_verdict = {}));
(function () {
    overwatch_verdict.Init();
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfbWFpbm1lbnVfb3ZlcndhdGNoX3ZlcmRpY3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfbWFpbm1lbnVfb3ZlcndhdGNoX3ZlcmRpY3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQVdyQyxJQUFVLGlCQUFpQixDQTZGMUI7QUE3RkQsV0FBVSxpQkFBaUI7SUFFdkIsSUFBSSxhQUFhLEdBQ2pCO1FBQ0ksRUFBRSxJQUFJLEVBQUMsUUFBUSxFQUFLLGNBQWMsRUFBRSxzQ0FBc0MsRUFBRSxLQUFLLEVBQUMsb0NBQW9DLEVBQUksSUFBSSxFQUFDLHFDQUFxQyxFQUFFO0tBSXpLLENBQUM7SUFFRixJQUFJLGFBQWEsR0FBRyxFQUFFLENBQUM7SUFFdkIsU0FBZ0IsSUFBSTtRQUV0QixJQUFJLGNBQWMsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUUsY0FBYyxDQUFFLENBQUM7UUFFakYsSUFBSyxjQUFjLEtBQUssU0FBUyxJQUFJLGNBQWMsS0FBSyxJQUFJO1lBQzNELE9BQU87UUFFRixjQUFjLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUV6QyxhQUFhLENBQUMsT0FBTyxDQUFFLFVBQVUsT0FBTyxFQUFFLENBQUM7WUFDdkMsSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxPQUFPLEVBQUUsY0FBYyxFQUFFLFNBQVMsR0FBRyxDQUFDLENBQUUsQ0FBQztZQUN4RSxTQUFTLENBQUMsa0JBQWtCLENBQUUsY0FBYyxDQUFFLENBQUM7WUFDL0MsU0FBUyxDQUFDLGlCQUFpQixDQUFFLHdCQUF3QixFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUUsT0FBTyxDQUFDLGNBQWMsQ0FBRSxDQUFFLENBQUM7WUFDOUYsU0FBUyxDQUFDLGlCQUFpQixDQUFFLGVBQWUsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUUsQ0FBRSxDQUFDO1lBQzVFLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBRSxjQUFjLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxPQUFPLENBQUMsSUFBSSxDQUFFLENBQUUsQ0FBQztZQUUxRSxvQkFBb0IsQ0FBRSxTQUFTLENBQUMscUJBQXFCLENBQUUsd0JBQXdCLENBQW1CLEVBQUUsT0FBTyxDQUFFLENBQUM7WUFFOUcsb0JBQW9CLENBQUUsU0FBUyxDQUFDLHFCQUFxQixDQUFFLG9CQUFvQixDQUFtQixFQUFFLE9BQU8sQ0FBRSxDQUFDO1FBQzlHLENBQUMsQ0FBRSxDQUFDO0lBQ1IsQ0FBQztJQXBCZSxzQkFBSSxPQW9CbkIsQ0FBQTtJQUVELFNBQVMsb0JBQW9CLENBQUUsUUFBdUIsRUFBRSxPQUFrQjtRQUV0RSxJQUFLLFFBQVEsS0FBSyxTQUFTLElBQUksUUFBUSxLQUFLLElBQUk7WUFDNUMsT0FBTztRQUVqQixRQUFRLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUM7UUFDeEIsUUFBUSxDQUFDLGFBQWEsQ0FBRSxVQUFVLEVBQUUsbUJBQW1CLENBQUUsQ0FBQztJQUM5RCxDQUFDO0lBRUQsU0FBUyxtQkFBbUI7UUFHeEIsYUFBYSxHQUFHLEVBQUUsQ0FBQztRQUVuQixJQUFJLGNBQWMsR0FBRyxJQUFJLENBQUM7UUFDMUIsYUFBYSxDQUFDLE9BQU8sQ0FBRSxVQUFVLE9BQU8sRUFBRSxDQUFDO1lBQ3ZDLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxTQUFTLEdBQUcsQ0FBQyxDQUFFLENBQUM7WUFDM0UsSUFBSyxTQUFTLEtBQUssU0FBUyxJQUFJLFNBQVMsS0FBSyxJQUFJO2dCQUM5QyxPQUFPLEtBQUssQ0FBQztZQUVqQixJQUFLLFNBQVMsQ0FBQyxxQkFBcUIsQ0FBRSx3QkFBd0IsQ0FBRSxDQUFDLE9BQU8sRUFDeEU7Z0JBQ0ksYUFBYSxJQUFJLE9BQU8sQ0FBQyxJQUFJLEdBQUcsV0FBVyxDQUFDO2FBQy9DO2lCQUtJLElBQUssU0FBUyxDQUFDLHFCQUFxQixDQUFFLG9CQUFvQixDQUFFLENBQUMsT0FBTyxFQUN6RTtnQkFDSSxhQUFhLElBQUksT0FBTyxDQUFDLElBQUksR0FBRyxXQUFXLENBQUM7YUFDL0M7aUJBRUQ7Z0JBRUksY0FBYyxHQUFHLEtBQUssQ0FBQztnQkFDdkIsT0FBTyxJQUFJLENBQUM7YUFDZjtRQUNMLENBQUMsQ0FBRSxDQUFDO1FBRUosT0FBTyxjQUFjLENBQUM7SUFDMUIsQ0FBQztJQUVELFNBQVMsbUJBQW1CO1FBRXhCLElBQUksZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLGtCQUFrQixDQUFFLENBQUM7UUFDdkYsSUFBSyxnQkFBZ0IsS0FBSyxTQUFTLElBQUksZ0JBQWdCLEtBQUssSUFBSSxJQUFJLGdCQUFnQixDQUFDLE9BQU8sSUFBSSxJQUFJO1lBQ2hHLE9BQU87UUFFWCxnQkFBZ0IsQ0FBQyxPQUFPLEdBQUcsbUJBQW1CLEVBQUUsQ0FBQztJQUNyRCxDQUFDO0lBRUQsU0FBZ0IsYUFBYTtRQUV6QixZQUFZLENBQUMsaUJBQWlCLENBQUUsYUFBYSxDQUFFLENBQUM7UUFFaEQsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxzQkFBc0IsRUFBRSxFQUFFLENBQUUsQ0FBQztJQUNsRCxDQUFDO0lBTGUsK0JBQWEsZ0JBSzVCLENBQUE7SUFBQSxDQUFDO0FBRU4sQ0FBQyxFQTdGUyxpQkFBaUIsS0FBakIsaUJBQWlCLFFBNkYxQjtBQUtELENBQUM7SUFFRyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUM3QixDQUFDLENBQUMsRUFBRSxDQUFDIn0=