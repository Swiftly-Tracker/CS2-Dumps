"use strict";
/// <reference path="../csgo.d.ts" />
var CommonUtil;
(function (CommonUtil) {
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
            if (remap_lang_to_region[isoCode]) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9udXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL2NvbW1vbi9jb21tb251dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFJckMsSUFBVSxVQUFVLENBK0huQjtBQS9IRCxXQUFVLFVBQVU7SUFLbkIsTUFBTSxvQkFBb0IsR0FBMkI7UUFDcEQsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsSUFBSTtLQUNSLENBQUM7SUFFRixNQUFNLG1CQUFtQixHQUFHO1FBQzNCLElBQUksRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUk7UUFDNUQsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFF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