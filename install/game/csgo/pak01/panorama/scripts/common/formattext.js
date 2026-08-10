"use strict";
/// <reference path="../csgo.d.ts" />
var CFormattedText = class {
    tag;
    vars;
    constructor(strLocTag, mapDialogVars) {
        this.tag = strLocTag;
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
            elLabel.SetDialogVariable(varName, '');
        }
        delete elLabel.fmtTextVars;
    }
    function SecondsToDDHHMMSSWithSymbolSeperator(rawSeconds) {
        const time = ConvertSecondsToDaysHoursMinSec(rawSeconds);
        const timeText = [];
        let returnRemaining = false;
        for (const key in time) {
            const value = time[key];
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
            let lockey = '#SFUI_Store_Timer_Day:f';
            if (key == 'days') {
                if (time['hours'] > 16)
                    ++value;
            }
            else if (key == 'hours') {
                lockey = '#SFUI_Store_Timer_Hour:f';
                if (time['minutes'] > 40)
                    ++value;
            }
            else if (key == 'minutes') {
                lockey = '#SFUI_Store_Timer_Min:f';
                if (time['seconds'] > 40)
                    ++value;
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
        const scaledNumber = number / scale;
        const decimals = scaledNumber < 10.0 ? 1 : 0;
        const finalNum = scaledNumber.toFixed(fixed).replace(/\.0+$/, '');
        return [finalNum, $.Localize(stringToken)];
    }
    FormatText.SplitAbbreviateNumber = SplitAbbreviateNumber;
    function AbbreviateNumber(number) {
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
        const scaledNumber = number / scale;
        const decimals = scaledNumber < 10.0 ? 1 : 0;
        const finalNum = scaledNumber.toFixed(decimals).replace(/\.0+$/, '');
        $.GetContextPanel().SetDialogVariable('abbreviated_number', finalNum);
        const result = $.Localize(stringToken, $.GetContextPanel());
        return result;
    }
    FormatText.AbbreviateNumber = AbbreviateNumber;
    function FormatRentalTime(expirationDate) {
        let currentDate = Math.trunc(Date.now() / 1000);
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
        let currentDate = Math.trunc(Date.now() / 1000);
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
    function FormatNumberToNiceString(value, nsigdigits) {
        let strNum = value.toFixed(nsigdigits);
        strNum = strNum.replace('.', $.Localize('#LOC_Number_DecimalPoint'));
        strNum = strNum.replace(/\B(?=(\d{3})+(?!\d))/g, $.Localize("#LOC_Number_Grouping"));
        return strNum;
    }
    FormatText.FormatNumberToNiceString = FormatNumberToNiceString;
})(FormatText || (FormatText = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ybWF0dGV4dC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL2NvbW1vbi9mb3JtYXR0ZXh0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUE0QnJDLElBQUksY0FBYyxHQUFHO0lBRXBCLEdBQUcsQ0FBUztJQUNaLElBQUksQ0FBcUI7SUFFekIsWUFBYSxTQUFpQixFQUFFLGFBQWlDO1FBRWhFLElBQUksQ0FBQyxHQUFHLEdBQUcsU0FBUyxDQUFDO1FBR3JCLElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBRSxFQUFFLEVBQUUsYUFBYSxDQUFFLENBQUM7SUFDaEQsQ0FBQztJQUVELFVBQVUsQ0FBRyxPQUFnQjtRQUU1QixVQUFVLENBQUMsdUJBQXVCLENBQUUsT0FBTyxFQUFFLElBQUksQ0FBRSxDQUFDO0lBQ3JELENBQUM7Q0FDRCxDQUFDO0FBRUYsSUFBVSxVQUFVLENBa1RuQjtBQWxURCxXQUFVLFVBQVU7SUFFbkIsU0FBZ0IsdUJBQXVCLENBQUcsT0FBdUIsRUFBRSxPQUFtRDtRQUVySCxJQUFJLENBQUMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxFQUNsQztZQUNDLE9BQU87U0FDUDtRQUVELDJCQUEyQixDQUFFLE9BQU8sQ0FBRSxDQUFDO1FBRXZDLE9BQU8sQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQztRQUMzQixPQUFPLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQztRQUN6QixLQUFNLE1BQU0sT0FBTyxJQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQ25DO1lBQ0MsT0FBTyxDQUFDLGlCQUFpQixDQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUUsT0FBTyxDQUFHLENBQUUsQ0FB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