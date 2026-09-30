"use strict";
/// <reference path="../csgo.d.ts" />
//This file contains functions that helps setting up map icon
var CommonUtil;
(function (CommonUtil) {
    // For languages we show a region background,
    // but language ICU codes differ from country ISO codes for a lot of languages
    // so we try to remap using this table first, and use the region otherwise
    const remap_lang_to_region = {
        af: 'za',
        ar: 'sa',
        be: 'by',
        cs: 'cz',
        da: 'dk',
        el: 'gr',
        en: 'gb',
        et: 'ee',
        ga: 'ie',
        he: 'il',
        hi: 'in',
        ja: 'jp',
        kk: 'kz',
        ko: 'kr',
        nn: 'no',
        sl: 'si',
        sr: 'rs',
        sv: 'se',
        uk: 'ua',
        ur: 'pk',
        vi: 'vn',
        zh: 'cn',
        zu: 'za',
    };
    const valid_country_codes = [
        "ae", "ar", "asia", "at", "au", "be", "bg", "br", "by", "ca",
        "cc", "ch", "cl", "cn", "cz", "de", "dk", "dz", "ee", "es",
        "eu", "fi", "fr", "gb", "gp", "gr", "hk", "hr", "hu", "id",
        "ie", "il", "in", "ir", "is", "it", "jp", "kr", "kz", "lt",
        "lu", "lv", "ly", "mk", "mo", "mx", "my", "nam", "nl", "no",
        "nz", "oce", "pe", "ph", "pk", "pl", "pt", "re", "ro", "rs",
        "ru", "sa", "sam", "se", "sg", "si", "sk", "sq", "th", "tr",
        "tw", "ua", "us", "ve", "vn", "za",
    ];
    // elPanel is presumed to have a unique id. Otherwise the tooltip anchor won't work.
    function SetRegionOnLabel(isoCode, elPanel, tooltip = true) {
        let tooltipString = "";
        if (isoCode) {
            tooltipString = $.Localize("#SFUI_Country_" + isoCode.toUpperCase());
        }
        SetDataOnLabelInternal(isoCode, isoCode, tooltip ? tooltipString : "", elPanel, tooltipString ? false : true);
    }
    CommonUtil.SetRegionOnLabel = SetRegionOnLabel;
    function SetLanguageOnLabel(isoCode, elPanel, tooltip = true) {
        let tooltipString = "";
        let imgCode = isoCode;
        if (isoCode) {
            const sTranslated = $.Localize("#Language_Name_Translated_" + isoCode);
            const sLocal = $.Localize("#Language_Name_Native_" + isoCode);
            if (sTranslated && sLocal && sTranslated === sLocal) {
                tooltipString = sLocal;
            }
            else {
                tooltipString = (sTranslated && sLocal) ? sTranslated + " (" + sLocal + ")" : "";
            }
            if (remap_lang_to_region[isoCode]) { // check in the remapping table for languages to fall back to region images (e.g. "EN" ==> "GB")
                imgCode = remap_lang_to_region[isoCode];
            }
        }
        SetDataOnLabelInternal(isoCode, imgCode, tooltip ? tooltipString : "", elPanel, tooltipString ? false : true);
    }
    CommonUtil.SetLanguageOnLabel = SetLanguageOnLabel;
    function SetDataOnLabelInternal(isoCode, imgCode, tooltipString, elPanel, bWarningColor) {
        if (!elPanel)
            return;
        const elLabel = elPanel.FindChildTraverse('JsRegionLabel');
        elLabel.AddClass('visible-if-not-perfectworld');
        if (isoCode) {
            elLabel.text = isoCode.toUpperCase();
            imgCode = imgCode.toLowerCase();
            imgCode = valid_country_codes.indexOf(imgCode) > -1 ? imgCode : "world";
            elLabel.style.backgroundImage = 'url("file://{images}/regions/' + imgCode + '.png")';
            let elTTAnchor = elLabel.FindChildTraverse('region-tt-anchor');
            if (!elTTAnchor) {
                elTTAnchor = $.CreatePanel("Panel", elLabel, elPanel.id + '-region-tt-anchor');
            }
            if (tooltipString) {
                elLabel.SetPanelEvent('onmouseover', () => UiToolkitAPI.ShowTextTooltip(elTTAnchor.id, tooltipString));
                elLabel.SetPanelEvent('onmouseout', () => UiToolkitAPI.HideTextTooltip());
            }
            //DEVONLY{
            if (bWarningColor) {
                // in trunk we want to see the string
                elPanel.style.washColor = "yellow";
                elLabel.SetPanelEvent('onmouseover', () => UiToolkitAPI.ShowTextTooltip(elTTAnchor.id, isoCode.toUpperCase()));
            }
            //}DEVONLY
            elLabel.RemoveClass('hidden');
            elLabel.SetHasClass('world-region-label', true);
            elLabel.SetHasClass('world-region-label--image', true);
        }
        else {
            elLabel.AddClass('hidden');
            elLabel.SetHasClass('world-region-label', false);
            elLabel.SetHasClass('world-region-label--image', false);
        }
    }
})(CommonUtil || (CommonUtil = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9udXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL2NvbW1vbi9jb21tb251dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFFckMsNkRBQTZEO0FBRTdELElBQVUsVUFBVSxDQStIbkI7QUEvSEQsV0FBVSxVQUFVO0lBRW5CLDZDQUE2QztJQUM3Qyw4RUFBOEU7SUFDOUUsMEVBQTBFO0lBQzFFLE1BQU0sb0JBQW9CLEdBQTJCO1FBQ3BELEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLElBQUk7S0FDUixDQUFDO0lBRUYsTUFBTSxtQkFBbUIsR0FBRztRQUMzQixJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJO1FBQzVELElBQUksRUFBRSxJQUFJLEVB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