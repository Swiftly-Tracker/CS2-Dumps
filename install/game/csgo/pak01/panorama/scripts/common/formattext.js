"use strict";
/// <reference path="../csgo.d.ts" />
var CFormattedText = class {
    tag;
    vars;
    constructor(strLocTag, mapDialogVars) {
        this.tag = strLocTag;
        // clone vars to avoid reference mutation behind our back
        this.vars = Object.assign({}, mapDialogVars);
    }
    SetOnLabel(elLabel) {
        FormatText.SetFormattedTextOnLabel(elLabel, this);
    }
};
var FormatText;
(function (FormatText) {
    function SetFormattedTextOnLabel(elLabel, fmtText) {
        if (!elLabel || !elLabel.IsValid()) {
            return;
        }
        ClearFormattedTextFromLabel(elLabel);
        elLabel.text = fmtText.tag;
        elLabel.fmtTextVars = {};
        for (const varName in fmtText.vars) {
            elLabel.SetDialogVariable(varName, elLabel.html ? $.HTMLEscape(fmtText.vars[varName]) : fmtText.vars[varName]);
            elLabel.fmtTextVars[varName] = true;
        }
    }
    FormatText.SetFormattedTextOnLabel = SetFormattedTextOnLabel;
    function ClearFormattedTextFromLabel(elLabel) {
        elLabel.text = '';
        if (!elLabel.fmtTextVars)
            return;
        for (const varName in elLabel.fmtTextVars) {
            // TODO: Add 'ClearDialogVariable' to remove a dvar from a panel
            elLabel.SetDialogVariable(varName, '');
        }
        // remove key
        delete elLabel.fmtTextVars;
    }
    /////// time convertions ///////
    function SecondsToDDHHMMSSWithSymbolSeperator(rawSeconds) {
        const time = ConvertSecondsToDaysHoursMinSec(rawSeconds);
        const timeText = [];
        let returnRemaining = false;
        for (const key in time) {
            const value = time[key];
            // Always return minutes and seconds.
            // Don't return empty days hours.
            if ((value > 0 && !returnRemaining) || key == 'minutes')
                returnRemaining = true;
            if (returnRemaining) {
                const valueToShow = (value < 10) ? ('0' + value.toString()) : value.toString();
                timeText.push(valueToShow);
            }
        }
        return timeText.join(':');
    }
    FormatText.SecondsToDDHHMMSSWithSymbolSeperator = SecondsToDDHHMMSSWithSymbolSeperator;
    function SecondsToSignificantTimeString(rawSeconds) {
        rawSeconds = Math.floor(Number(rawSeconds));
        if (rawSeconds < 60)
            return $.ConstructString('#SFUI_Store_Timer_Min:f', { value: 1 });
        const time = ConvertSecondsToDaysHoursMinSec(rawSeconds);
        let timecomponents = ['days', 'hours', 'minutes', 'seconds'];
        for (const idx in timecomponents) {
            const key = timecomponents[idx];
            let value = time[key];
            if (key == 'seconds')
                break;
            if (value <= 0)
                continue;
            // See if we should bump up the value for better "rounding" purposes
            // and select a different locstring
            let lockey = '#SFUI_Store_Timer_Day:f';
            if (key == 'days') {
                if (time['hours'] > 16)
                    ++value; // round up 17,18,...,23 hours to an extra day
            }
            else if (key == 'hours') {
                lockey = '#SFUI_Store_Timer_Hour:f';
                if (time['minutes'] > 40)
                    ++value; // round up 40+ minutes to an hour
            }
            else if (key == 'minutes') {
                lockey = '#SFUI_Store_Timer_Min:f';
                if (time['seconds'] > 40)
                    ++value; // round up 40+ seconds to a minute
            }
            return $.ConstructString(lockey, { value: value });
        }
        return $.ConstructString('#SFUI_Store_Timer_Min:f', { value: 1 });
    }
    FormatText.SecondsToSignificantTimeString = SecondsToSignificantTimeString;
    function ConvertSecondsToDaysHoursMinSec(rawSeconds) {
        rawSeconds = Number(rawSeconds);
        const time = {
            days: Math.floor(rawSeconds / 86400),
            hours: Math.floor((rawSeconds % 86400) / 3600),
            minutes: Math.floor(((rawSeconds % 86400) % 3600) / 60),
            seconds: ((rawSeconds % 86400) % 3600) % 60
        };
        return time;
    }
    function PadNumber(integer, digits, char = '0') {
        integer = integer.toString();
        while (integer.length < digits)
            integer = char + integer;
        return integer;
    }
    FormatText.PadNumber = PadNumber;
    function SplitAbbreviateNumber(number, fixed = 0) {
        // missing feature: negative number support
        if (number < 0)
            return -1;
        let pow10 = Math.log10(number) | 0;
        let stringToken = "";
        const locFilePrefix = "#NumberAbbreviation_suffix_E";
        do {
            stringToken = locFilePrefix + [pow10];
            if ($.CanLocalize(stringToken))
                break;
        } while (--pow10 > 0);
        if (!$.CanLocalize(stringToken))
            return [number.toString(), ''];
        const scale = Math.pow(10, pow10);
        // scale the number
        const scaledNumber = number / scale;
        // allow decimals if scaled number is a single digit
        const decimals = scaledNumber < 10.0 ? 1 : 0;
        // trim to one decimal digit, remove ".0", and add the symbol suffix.
        const finalNum = scaledNumber.toFixed(fixed).replace(/\.0+$/, '');
        return [finalNum, $.Localize(stringToken)];
    }
    FormatText.SplitAbbreviateNumber = SplitAbbreviateNumber;
    // this uses language conventions to express large numbers, i.e. "5236.6" as "5.2K"
    // Looks for token "NumberAbbreviation_E" in localization file.
    function AbbreviateNumber(number) {
        // missing feature: negative number support
        if (number < 0)
            return -1;
        let pow10 = Math.log10(number) | 0;
        let stringToken = "";
        const locFilePrefix = "#NumberAbbreviation_E";
        do {
            stringToken = locFilePrefix + [pow10];
            if ($.CanLocalize(stringToken))
                break;
        } while (--pow10 > 0);
        if (!$.CanLocalize(stringToken))
            return number.toString();
        const scale = Math.pow(10, pow10);
        // scale the number
        const scaledNumber = number / scale;
        // allow decimals if scaled number is a single digit
        const decimals = scaledNumber < 10.0 ? 1 : 0;
        // trim to one decimal digit, remove ".0", and add the symbol suffix.
        const finalNum = scaledNumber.toFixed(decimals).replace(/\.0+$/, '');
        $.GetContextPanel().SetDialogVariable('abbreviated_number', finalNum);
        const result = $.Localize(stringToken, $.GetContextPanel());
        $.Msg(number + " : " + scaledNumber + " : " + result);
        return result;
    }
    FormatText.AbbreviateNumber = AbbreviateNumber;
    function FormatRentalTime(expirationDate) {
        // get total seconds between the times
        let currentDate = Math.trunc(Date.now() / 1000); // Js returns in milliseconds
        if (expirationDate <= currentDate) {
            return {
                time: '',
                locString: '#item-rental-time-expired',
                isExpired: true
            };
        }
        else {
            let seconds = expirationDate - currentDate;
            return {
                time: FormatText.SecondsToSignificantTimeString(seconds),
                locString: '#item-rental-time-remaining',
                isExpired: false
            };
        }
    }
    FormatText.FormatRentalTime = FormatRentalTime;
    function FormatExpirationToDDHHMMSSWithSymbolSeperator(expirationDate) {
        // get total seconds between the times
        let currentDate = Math.trunc(Date.now() / 1000); // Js returns in milliseconds
        if (expirationDate <= currentDate) {
            return {
                time: '',
                locString: '#item-rental-time-expired',
                isExpired: true
            };
        }
        else {
            let seconds = expirationDate - currentDate;
            return {
                time: FormatText.SecondsToDDHHMMSSWithSymbolSeperator(seconds),
                locString: '#item-rental-time-remaining',
                isExpired: false,
                seconds: seconds
            };
        }
    }
    FormatText.FormatExpirationToDDHHMMSSWithSymbolSeperator = FormatExpirationToDDHHMMSSWithSymbolSeperator;
    function FormatPetFoodTimeRemaining(expirationDate) {
        // get total seconds between the times
        let currentDate = Math.trunc(Date.now() / 1000); // Js returns in milliseconds
        let seconds = expirationDate - currentDate;
        return {
            time: FormatText.SecondsToSignificantTimeString(seconds),
            locString: '#pet_food_time_remaining',
            isExpired: false
        };
    }
    FormatText.FormatPetFoodTimeRemaining = FormatPetFoodTimeRemaining;
    // localizes decimal points, thousands delimiters, and sets significant digits
    function FormatNumberToNiceString(value, nsigdigits) {
        // sig digits
        let strNum = value.toFixed(nsigdigits);
        // localize decimal
        strNum = strNum.replace('.', $.Localize('#LOC_Number_DecimalPoint'));
        // localize thousanfs
        strNum = strNum.replace(/\B(?=(\d{3})+(?!\d))/g, $.Localize("#LOC_Number_Grouping"));
        return strNum;
    }
    FormatText.FormatNumberToNiceString = FormatNumberToNiceString;
})(FormatText || (FormatText = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ybWF0dGV4dC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL2NvbW1vbi9mb3JtYXR0ZXh0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUE0QnJDLElBQUksY0FBYyxHQUFHO0lBRXBCLEdBQUcsQ0FBUztJQUNaLElBQUksQ0FBcUI7SUFFekIsWUFBYSxTQUFpQixFQUFFLGFBQWlDO1FBRWhFLElBQUksQ0FBQyxHQUFHLEdBQUcsU0FBUyxDQUFDO1FBRXJCLHlEQUF5RDtRQUN6RCxJQUFJLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUUsRUFBRSxFQUFFLGFBQWEsQ0FBRSxDQUFDO0lBQ2hELENBQUM7SUFFRCxVQUFVLENBQUcsT0FBZ0I7UUFFNUIsVUFBVSxDQUFDLHVCQUF1QixDQUFFLE9BQU8sRUFBRSxJQUFJLENBQUUsQ0FBQztJQUNyRCxDQUFDO0NBQ0QsQ0FBQztBQUVGLElBQVUsVUFBVSxDQWdUbkI7QUFoVEQsV0FBVSxVQUFVO0lBRW5CLFNBQWdCLHVCQUF1QixDQUFHLE9BQXVCLEVBQUUsT0FBbUQ7UUFFckgsSUFBSSxDQUFDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsRUFDbEM7WUFDQyxPQUFPO1NBQ1A7UUFFRCwyQkFBMkIsQ0FBRSxPQUFPLENBQUUsQ0FBQztRQUV2QyxPQUFPLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUM7UUFDM0IsT0FBTyxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUM7UUFDekIsS0FBTSxNQUFNLE9BQU8sSUFBSSxPQUFPLENBQUMsSUFBSSxFQUNuQztZQUNDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBRSxPQUFPLENBQUMsSUFBSSxDQUFFLE9BQU8s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