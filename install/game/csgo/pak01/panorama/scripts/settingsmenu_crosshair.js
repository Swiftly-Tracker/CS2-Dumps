"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="settingsmenu_shared.ts" />
/// <reference path="common/promoted_settings.ts" />
/// <reference path="context_menus/context_menu_color_picker.ts" />
var SettingsMenuCrosshairSettings;
(function (SettingsMenuCrosshairSettings) {
    function OnCrosshairStyleChange() {
        let nStyle = parseInt(GameInterfaceAPI.GetSettingString('cl_crosshairstyle'));
        const cp = $.GetContextPanel();
        $("#XhairCenterDot").visible = false;
        $("#XhairCenterDotSeparator").visible = false;
        $("#XhairGap").visible = false;
        $("#XhairGapSeparator").visible = false;
        $("#XhairLength").visible = false;
        $("#XhairLengthSeparator").visible = false;
        $("#XhairTStyle").visible = false;
        $("#XhairTStyleSeparator").visible = false;
        $("#XhairDynamicSpreadDist").visible = false;
        $("#XhairDynamicSpreadDistSeparator").visible = false;
        $("#XhairLegacySplitDist").visible = false;
        $("#XhairLegacySplitDistSeparator").visible = false;
        $("#XhairLegacySplitInnerAlpha").visible = false;
        $("#XhairLegacySplitInnerAlphaSeparator").visible = false;
        $("#XhairLegacySplitOuterAlpha").visible = false;
        $("#XhairLegacySplitOuterAlphaSeparator").visible = false;
        $("#XhairLegacySplitRatio").visible = false;
        $("#XhairLegacySplitRatioSeparator").visible = false;
        if (nStyle == 0) {
            $("#XhairCenterDot").visible = true;
            $("#XhairCenterDotSeparator").visible = true;
            $("#XhairGap").visible = true;
            $("#XhairGapSeparator").visible = true;
            $("#XhairLength").visible = true;
            $("#XhairLengthSeparator").visible = true;
            $("#XhairTStyle").visible = true;
            $("#XhairTStyleSeparator").visible = true;
            $("#XhairDynamicSpreadDist").visible = true;
            $("#XhairDynamicSpreadDistSeparator").visible = true;
        }
        else if (nStyle == 1) {
            $("#XhairCenterDot").visible = true;
            $("#XhairCenterDotSeparator").visible = true;
            $("#XhairDynamicSpreadDist").visible = true;
            $("#XhairDynamicSpreadDistSeparator").visible = true;
        }
        else if (nStyle == 2) {
            $("#XhairCenterDot").visible = true;
            $("#XhairCenterDotSeparator").visible = true;
            $("#XhairGap").visible = true;
            $("#XhairGapSeparator").visible = true;
            $("#XhairLength").visible = true;
            $("#XhairLengthSeparator").visible = true;
            $("#XhairTStyle").visible = true;
            $("#XhairTStyleSeparator").visible = true;
            $("#XhairLegacySplitRatio").visible = true;
            $("#XhairLegacySplitRatioSeparator").visible = true;
            $("#XhairLegacySplitDist").visible = true;
            $("#XhairLegacySplitDistSeparator").visible = true;
            $("#XhairLegacySplitInnerAlpha").visible = true;
            $("#XhairLegacySplitInnerAlphaSeparator").visible = true;
            $("#XhairLegacySplitOuterAlpha").visible = true;
            $("#XhairLegacySplitOuterAlphaSeparator").visible = true;
        }
        else if (nStyle == 3) {
            $("#XhairCenterDot").visible = true;
            $("#XhairCenterDotSeparator").visible = true;
            $("#XhairGap").visible = true;
            $("#XhairGapSeparator").visible = true;
        }
        else if (nStyle == 4) {
            $("#XhairCenterDot").visible = true;
            $("#XhairCenterDotSeparator").visible = true;
            $("#XhairGap").visible = true;
            $("#XhairGapSeparator").visible = true;
            $("#XhairLength").visible = true;
            $("#XhairLengthSeparator").visible = true;
            $("#XhairTStyle").visible = true;
            $("#XhairTStyleSeparator").visible = true;
        }
        else if (nStyle == 5) {
            $("#XhairCenterDot").visible = true;
            $("#XhairCenterDotSeparator").visible = true;
            $("#XhairGap").visible = true;
            $("#XhairGapSeparator").visible = true;
            $("#XhairLength").visible = true;
            $("#XhairLengthSeparator").visible = true;
            $("#XhairTStyle").visible = true;
            $("#XhairTStyleSeparator").visible = true;
        }
        else if (nStyle == 6) {
        }
        else if (nStyle == 7) {
            $("#XhairCenterDot").visible = true;
            $("#XhairCenterDotSeparator").visible = true;
            $("#XhairGap").visible = true;
            $("#XhairGapSeparator").visible = true;
            $("#XhairLength").visible = true;
            $("#XhairLengthSeparator").visible = true;
            $("#XhairTStyle").visible = true;
            $("#XhairTStyleSeparator").visible = true;
            $("#XhairDynamicSpreadDist").visible = true;
            $("#XhairDynamicSpreadDistSeparator").visible = true;
        }
        $("#CrosshairEditorPreview").SetHasClass("dynamic-crosshair", nStyle === 0 || nStyle === 1 || nStyle === 2 || nStyle === 6);
        let obsCrosshairs = parseInt(GameInterfaceAPI.GetSettingString('cl_show_observer_crosshair'));
        let showObserverBotSetting = (obsCrosshairs === 2);
        $("#XhairObservedBotCrosshair").visible = showObserverBotSetting;
        $("#XhairObservedBotCrosshairSeparator").visible = showObserverBotSetting;
        _RefreshColorDisplay(cp);
        const elStaticColorBox = $("#XhairColorDisplayBox");
        $("#XhairColorDisplay")?.SetPanelEvent('onactivate', () => {
            let contextMenuPanel = UiToolkitAPI.ShowCustomLayoutContextMenuParameters('', '', 'file://{resources}/layout/context_menus/context_menu_color_picker.xml', '');
            contextMenuPanel.AddClass("ContextMenu_NoArrow");
            contextMenuPanel.Data().initRGB = {
                r: parseInt(GameInterfaceAPI.GetSettingString('cl_crosshaircolor_r')),
                g: parseInt(GameInterfaceAPI.GetSettingString('cl_crosshaircolor_g')),
                b: parseInt(GameInterfaceAPI.GetSettingString('cl_crosshaircolor_b'))
            };
            contextMenuPanel.Data().nInitAlpha = parseInt(GameInterfaceAPI.GetSettingString('cl_crosshaircolor_a'));
            contextMenuPanel.Data().funcCallback = (oResult) => {
                if ('rgb' in oResult) {
                    const safeRgb = oResult.rgb;
                    GameInterfaceAPI.SetSettingString('cl_crosshaircolor_r', safeRgb.r.toString());
                    GameInterfaceAPI.SetSettingString('cl_crosshaircolor_g', safeRgb.g.toString());
                    GameInterfaceAPI.SetSettingString('cl_crosshaircolor_b', safeRgb.b.toString());
                    _RefreshColorDisplay(cp);
                }
                if ('alpha' in oResult) {
                    const alphaVal = oResult.alpha;
                    GameInterfaceAPI.SetSettingString('cl_crosshaircolor_a', alphaVal.toString());
                }
            };
        });
    }
    SettingsMenuCrosshairSettings.OnCrosshairStyleChange = OnCrosshairStyleChange;
    function _RefreshColorDisplay(cp) {
        let ColorR = GameInterfaceAPI.GetSettingString('cl_crosshaircolor_r');
        let ColorG = GameInterfaceAPI.GetSettingString('cl_crosshaircolor_g');
        let ColorB = GameInterfaceAPI.GetSettingString('cl_crosshaircolor_b');
        cp.FindChildInLayoutFile('XhairColorDisplayBox').style.backgroundColor = 'rgb(' + ColorR + ',' + ColorG + ',' + ColorB + ');';
    }
    function _RefreshControlsRecursive(panel) {
        if (panel == null) {
            return;
        }
        if ('OnShow' in panel) {
            panel.OnShow();
        }
        if (panel.GetChildCount == undefined) {
            return;
        }
        else {
            let nCount = panel.GetChildCount();
            for (let i = 0; i < nCount; i++) {
                let child = panel.GetChild(i);
                _RefreshControlsRecursive(child);
            }
        }
    }
    const k_arrNewCrosshairStyles = [3, 6, 0, 1, 7];
    const k_arrTaggedCrosshairSettings = [
        { id: 'XhairStyle', loc_name: '#GameUI_CrosshairStyle', tag: 'new', loc_tooltip: '#GameUI_CrosshairUpdated_Style' },
        { id: 'XhairColorPicker', loc_name: '#GameUI_CrosshairColor', tag: 'updated', loc_tooltip: '#GameUI_CrosshairUpdated_Info' },
        { id: 'XhairThickness', loc_name: '#GameUI_CrosshairThickness', tag: 'updated', loc_tooltip: '#GameUI_CrosshairUpdated_Info' },
        { id: 'XhairLength', loc_name: '#GameUI_CrosshairLength', tag: 'updated', loc_tooltip: '#GameUI_CrosshairUpdated_Info' },
        { id: 'XhairGap', loc_name: '#GameUI_CrosshairGap', tag: 'updated', loc_tooltip: '#GameUI_CrosshairUpdated_Info' }
    ];
    function _MakeTagSpan(strLocToken, strModifier) {
        return '<span class="settings-tag ' + strModifier + '"> ' + $.Localize(strLocToken) + ' </span>';
    }
    function _SetHtmlText(el, strText) {
        if (!el)
            return;
        el.html = true;
        el.text = strText;
    }
    function _TagCrosshairSettings() {
        if (!PromotedSettingsUtil.GetUnacknowledgedPromotedSettings().some(setting => setting.id === 'XhairStyle'))
            return;
        const elDropdown = $('#XhairStyleDropdown');
        if (elDropdown) {
            for (const nStyle of k_arrNewCrosshairStyles) {
                const id = 'crosshairstyle' + nStyle;
                const strText = _MakeTagSpan('#settings_new', 'settings-tag--new') + ' ' + $.Localize('#GameUI_CrosshairStyle' + nStyle);
                _SetHtmlText(elDropdown.FindDropDownMenuChild(id), strText);
                _SetHtmlText(elDropdown.FindChild(id), strText);
            }
        }
        for (const setting of k_arrTaggedCrosshairSettings) {
            const elRow = $('#' + setting.id);
            if (!elRow)
                continue;
            const elTitle = elRow.FindChildTraverse('Title');
            _SetHtmlText(elTitle, $.Localize(setting.loc_name) + ' ' + _MakeTagSpan('#settings_' + setting.tag, 'settings-tag--' + setting.tag));
            elRow.SetPanelEvent('onmouseover', () => UiToolkitAPI.ShowTextTooltipOnPanel(elRow, setting.loc_tooltip));
            elRow.SetPanelEvent('onmouseout', () => UiToolkitAPI.HideTextTooltip());
        }
    }
    {
        OnCrosshairStyleChange();
        _TagCrosshairSettings();
        SettingsMenuShared.ChangeBackground(0);
    }
})(SettingsMenuCrosshairSettings || (SettingsMenuCrosshairSettings = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3NtZW51X2Nyb3NzaGFpci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3NldHRpbmdzbWVudV9jcm9zc2hhaXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUNsQywrQ0FBK0M7QUFDL0Msb0RBQW9EO0FBQ3BELG1FQUFtRTtBQUVuRSxJQUFVLDZCQUE2QixDQW9TdEM7QUFwU0QsV0FBVSw2QkFBNkI7SUFFdEMsU0FBZ0Isc0JBQXNCO1FBRXJDLElBQUksTUFBTSxHQUFHLFFBQVEsQ0FBRSxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBRSxtQkFBbUIsQ0FBRSxDQUFFLENBQUM7UUFDbEYsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBSy9CLENBQUMsQ0FBRSxpQkFBaUIsQ0FBRyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7UUFDeEMsQ0FBQyxDQUFFLDBCQUEwQixDQUFHLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztRQUVqRCxDQUFDLENBQUUsV0FBVyxDQUFHLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztRQUNsQyxDQUFDLENBQUUsb0JBQW9CLENBQUcsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1FBRTNDLENBQUMsQ0FBRSxjQUFjLENBQUcsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1FBQ3JDLENBQUMsQ0FBRSx1QkFBdUIsQ0FBRyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7UUFFOUMsQ0FBQyxDQUFFLGNBQWMsQ0FBRyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7UUFDckMsQ0FBQyxDQUFFLHVCQUF1QixDQUFHLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztRQUU5QyxDQUFDLENBQUUseUJBQXlCLENBQUcsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1FBQ2hELENBQUMsQ0FBRSxrQ0FBa0Ms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