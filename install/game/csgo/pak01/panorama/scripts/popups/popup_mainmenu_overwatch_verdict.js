"use strict";
/// <reference path="../csgo.d.ts" />
var overwatch_verdict;
(function (overwatch_verdict) {
    var _verdictTypes = [
        { type: "aimbot", classification: "#Panorama_Overwatch_Major_Disruption", title: "#Panorama_Overwatch_Res_AimHacking", desc: "#SFUI_Overwatch_Res_AimHacking_Desc" },
        // { type:"wallhack",  classification: "#Panorama_Overwatch_Major_Disruption", title:"#Panorama_Overwatch_Res_WallHacking",  desc:"#SFUI_Overwatch_Res_WallHacking_Desc" },
        // { type:"speedhack", classification: "#Panorama_Overwatch_Major_Disruption", title:"#Panorama_Overwatch_Res_SpeedHacking", desc:"#SFUI_Overwatch_Res_SpeedHacking_Desc" },
        // { type:"grief",     classification: "#Panorama_Overwatch_Minor_Disruption", title:"#Panorama_Overwatch_Res_Griefing",     desc:"#SFUI_Overwatch_Res_Griefing_Desc" }
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
            // _SetupVerdictButtons( elVerdict.FindChildInLayoutFile( 'verdict_btn_maybe_guilty' ) as RadioButton_t, verdict );
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
        // reset verdict
        _finalVerdict = "";
        var bHasAllVerdict = true;
        _verdictTypes.forEach(function (verdict, i) {
            var elVerdict = $.GetContextPanel().FindChildInLayoutFile('Verdict' + i);
            if (elVerdict === undefined || elVerdict === null)
                return false;
            if (elVerdict.FindChildInLayoutFile('verdict_btn_not_guilty').checked) {
                _finalVerdict += verdict.type + ":dismiss;";
            }
            // else if ( elVerdict.FindChildInLayoutFile( 'verdict_btn_maybe_guilty' ).checked )
            // {
            //     _finalVerdict += verdict.type + ":inconclusive;";
            // }            
            else if (elVerdict.FindChildInLayoutFile('verdict_btn_guilty').checked) {
                _finalVerdict += verdict.type + ":convict;";
            }
            else {
                // didn't select this verdict, stop the loop now
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
//--------------------------------------------------------------------------------------------------
// Entry point called when panel is created
//--------------------------------------------------------------------------------------------------
(function () {
    overwatch_verdict.Init();
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfbWFpbm1lbnVfb3ZlcndhdGNoX3ZlcmRpY3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfbWFpbm1lbnVfb3ZlcndhdGNoX3ZlcmRpY3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQVdyQyxJQUFVLGlCQUFpQixDQTZGMUI7QUE3RkQsV0FBVSxpQkFBaUI7SUFFdkIsSUFBSSxhQUFhLEdBQ2pCO1FBQ0ksRUFBRSxJQUFJLEVBQUMsUUFBUSxFQUFLLGNBQWMsRUFBRSxzQ0FBc0MsRUFBRSxLQUFLLEVBQUMsb0NBQW9DLEVBQUksSUFBSSxFQUFDLHFDQUFxQyxFQUFFO1FBQ3RLLDJLQUEySztRQUMzSyw0S0FBNEs7UUFDNUssdUtBQXVLO0tBQzFLLENBQUM7SUFFRixJQUFJLGFBQWEsR0FBRyxFQUFFLENBQUM7SUFFdkIsU0FBZ0IsSUFBSTtRQUV0QixJQUFJLGNBQWMsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUUsY0FBYyxDQUFFLENBQUM7UUFFakYsSUFBSyxjQUFjLEtBQUssU0FBUyxJQUFJLGNBQWMsS0FBSyxJQUFJO1lBQzNELE9BQU87UUFFRixjQUFjLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUV6QyxhQUFhLENBQUMsT0FBTyxDQUFFLFVBQVUsT0FBTyxFQUFFLENBQUM7WUFDdkMsSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxPQUFPLEVBQUUsY0FBYyxFQUFFLFNBQVMsR0FBRyxDQUFDLENBQUUsQ0FBQztZQUN4RSxTQUFTLENBQUMsa0JBQWtCLENBQUUsY0FBYyxDQUFFLENBQUM7WUFDL0MsU0FBUyxDQUFDLGlCQUFpQixDQUFFLHdCQUF3QixFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUUsT0FBTyxDQUFDLGNBQWMsQ0FBRSxDQUFFLENBQUM7WUFD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