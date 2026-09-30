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
        // Hide all style settings
        //-----------------------------------------------------------------------
        $("#XhairCenterDot").visible = false;
        $("#XhairCenterDotSeparator").visible = false;
        $("#XhairGap").visible = false;
        $("#XhairGapSeparator").visible = false;
        $("#XhairClassicGap").visible = false;
        $("#XhairClassicGapSeparator").visible = false;
        $("#XhairLength").visible = false;
        $("#XhairLengthSeparator").visible = false;
        $("#XhairTStyle").visible = false;
        $("#XhairTStyleSeparator").visible = false;
        $("#XhairDynamicSpreadDist").visible = false;
        $("#XhairDynamicSpreadDistSeparator").visible = false;
        $("#XhairClassicSplitDist").visible = false;
        $("#XhairClassicSplitDistSeparator").visible = false;
        $("#XhairClassicSplitInnerAlpha").visible = false;
        $("#XhairClassicSplitInnerAlphaSeparator").visible = false;
        $("#XhairClassicSplitOuterAlpha").visible = false;
        $("#XhairClassicSplitOuterAlphaSeparator").visible = false;
        $("#XhairClassicSplitRatio").visible = false;
        $("#XhairClassicSplitRatioSeparator").visible = false;
        $("#XhairOutlineColorPicker").visible = false;
        $("#XhairOutlineColorPickerSeparator").visible = false;
        $("#XhairStaticQuadSplitRatio").visible = false;
        $("#XhairStaticQuadSplitRatioSeparator").visible = false;
        // Outline color
        //-----------------------------------------------------------------------
        let nDrawOutline = parseInt(GameInterfaceAPI.GetSettingString('cl_crosshair_drawoutline'));
        if (nDrawOutline != 0) {
            $("#XhairOutlineColorPicker").visible = true;
            $("#XhairOutlineColorPickerSeparator").visible = true;
        }
        // Show only relevant settings per style
        //-----------------------------------------------------------------------
        // Dynamic Cross
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
        // Dynamic Circle
        else if (nStyle == 1) {
            $("#XhairCenterDot").visible = true;
            $("#XhairCenterDotSeparator").visible = true;
            $("#XhairDynamicSpreadDist").visible = true;
            $("#XhairDynamicSpreadDistSeparator").visible = true;
        }
        // Dynamic Cross (Classic)
        else if (nStyle == 2) {
            $("#XhairCenterDot").visible = true;
            $("#XhairCenterDotSeparator").visible = true;
            $("#XhairClassicGap").visible = true;
            $("#XhairClassicGapSeparator").visible = true;
            $("#XhairLength").visible = true;
            $("#XhairLengthSeparator").visible = true;
            $("#XhairTStyle").visible = true;
            $("#XhairTStyleSeparator").visible = true;
            $("#XhairClassicSplitRatio").visible = true;
            $("#XhairClassicSplitRatioSeparator").visible = true;
            $("#XhairClassicSplitDist").visible = true;
            $("#XhairClassicSplitDistSeparator").visible = true;
            $("#XhairClassicSplitInnerAlpha").visible = true;
            $("#XhairClassicSplitInnerAlphaSeparator").visible = true;
            $("#XhairClassicSplitOuterAlpha").visible = true;
            $("#XhairClassicSplitOuterAlphaSeparator").visible = true;
        }
        // Static Circle
        else if (nStyle == 3) {
            $("#XhairCenterDot").visible = true;
            $("#XhairCenterDotSeparator").visible = true;
            $("#XhairGap").visible = true;
            $("#XhairGapSeparator").visible = true;
        }
        // Static Cross
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
        // Static Cross (Feedback)
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
        // Dot-Only
        else if (nStyle == 6) {
            // Nothing
        }
        // Dynamic Quad
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
        // Static Square
        else if (nStyle == 8) {
            $("#XhairCenterDot").visible = true;
            $("#XhairCenterDotSeparator").visible = true;
            $("#XhairGap").visible = true;
            $("#XhairGapSeparator").visible = true;
        }
        // Static Quad
        else if (nStyle == 9) {
            $("#XhairCenterDot").visible = true;
            $("#XhairCenterDotSeparator").visible = true;
            $("#XhairGap").visible = true;
            $("#XhairGapSeparator").visible = true;
            $("#XhairStaticQuadSplitRatio").visible = true;
            $("#XhairStaticQuadSplitRatioSeparator").visible = true;
        }
        // Misc Settings
        //-----------------------------------------------------------------------
        $("#CrosshairEditorPreview").SetHasClass("dynamic-crosshair", nStyle === 0 || nStyle === 1 || nStyle === 2 || nStyle === 6);
        let obsCrosshairs = parseInt(GameInterfaceAPI.GetSettingString('cl_show_observer_crosshair'));
        let showObserverBotSetting = (obsCrosshairs === 2);
        $("#XhairObservedBotCrosshair").visible = showObserverBotSetting;
        $("#XhairObservedBotCrosshairSeparator").visible = showObserverBotSetting;
        // Color
        //-----------------------------------------------------------------------
        _RefreshColorDisplay(cp);
        const elColorBox = $("#XhairColorDisplayBox");
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
        // Outline Color
        //-----------------------------------------------------------------------
        const elOutlineColorBox = $("#XhairOutlineColorDisplayBox");
        $("#XhairOutlineColorDisplay")?.SetPanelEvent('onactivate', () => {
            let contextMenuPanel = UiToolkitAPI.ShowCustomLayoutContextMenuParameters('', '', 'file://{resources}/layout/context_menus/context_menu_color_picker.xml', '');
            contextMenuPanel.AddClass("ContextMenu_NoArrow");
            contextMenuPanel.Data().initRGB = {
                r: parseInt(GameInterfaceAPI.GetSettingString('cl_crosshairoutline_r')),
                g: parseInt(GameInterfaceAPI.GetSettingString('cl_crosshairoutline_g')),
                b: parseInt(GameInterfaceAPI.GetSettingString('cl_crosshairoutline_b'))
            };
            contextMenuPanel.Data().nInitAlpha = parseInt(GameInterfaceAPI.GetSettingString('cl_crosshairoutline_a'));
            contextMenuPanel.Data().funcCallback = (oResult) => {
                if ('rgb' in oResult) {
                    const safeRgb = oResult.rgb;
                    GameInterfaceAPI.SetSettingString('cl_crosshairoutline_r', safeRgb.r.toString());
                    GameInterfaceAPI.SetSettingString('cl_crosshairoutline_g', safeRgb.g.toString());
                    GameInterfaceAPI.SetSettingString('cl_crosshairoutline_b', safeRgb.b.toString());
                    _RefreshColorDisplay(cp);
                }
                if ('alpha' in oResult) {
                    const alphaVal = oResult.alpha;
                    GameInterfaceAPI.SetSettingString('cl_crosshairoutline_a', alphaVal.toString());
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
        let OutlineR = GameInterfaceAPI.GetSettingString('cl_crosshairoutline_r');
        let OutlineG = GameInterfaceAPI.GetSettingString('cl_crosshairoutline_g');
        let OutlineB = GameInterfaceAPI.GetSettingString('cl_crosshairoutline_b');
        cp.FindChildInLayoutFile('XhairOutlineColorDisplayBox').style.backgroundColor = 'rgb(' + OutlineR + ',' + OutlineG + ',' + OutlineB + ');';
    }
    function _RefreshControlsRecursive(panel) {
        if (panel == null) {
            return;
        }
        if ('OnShow' in panel) {
            panel.OnShow();
        }
        if (panel.GetChildCount == undefined) {
            // This happens sometimes. Not sure why
            return;
        }
        else // We don't have nested settings controls
         {
            let nCount = panel.GetChildCount();
            for (let i = 0; i < nCount; i++) {
                let child = panel.GetChild(i);
                _RefreshControlsRecursive(child);
            }
        }
    }
    // Hardcoded for now: crosshair styles that get an inline "new" tag in the Style dropdown
    const k_arrNewCrosshairStyles = [3, 6, 0, 1, 7, 8, 9];
    // Hardcoded for now: setting rows that get an inline tag after their name (Title label) and a tooltip on the row. tag picks the #settings_<tag> string and settings-tag--<tag> modifier
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
        // Only while the crosshair Style promotion counts as new; clears together with the other promoted-setting badges
        if (!PromotedSettingsUtil.GetUnacknowledgedPromotedSettings().some(setting => setting.id === 'XhairStyle'))
            return;
        // "New" in front of the tagged styles in the Style dropdown
        const elDropdown = $('#XhairStyleDropdown');
        if (elDropdown) {
            for (const nStyle of k_arrNewCrosshairStyles) {
                const id = 'crosshairstyle' + nStyle;
                const strText = _MakeTagSpan('#settings_new', 'settings-tag--new') + ' ' + $.Localize('#GameUI_CrosshairStyle' + nStyle);
                // The option in the menu, plus the dropdown's clone of it when it is the current selection
                _SetHtmlText(elDropdown.FindDropDownMenuChild(id), strText);
                _SetHtmlText(elDropdown.FindChild(id), strText);
            }
        }
        // Tag after the name on the tagged rows (each keeps its name in a Title label), plus the tooltip on the row
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
    // On creation
    {
        OnCrosshairStyleChange();
        _TagCrosshairSettings();
        SettingsMenuShared.ChangeBackground(0);
    }
})(SettingsMenuCrosshairSettings || (SettingsMenuCrosshairSettings = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3NtZW51X2Nyb3NzaGFpci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3NldHRpbmdzbWVudV9jcm9zc2hhaXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUNsQywrQ0FBK0M7QUFDL0Msb0RBQW9EO0FBQ3BELG1FQUFtRTtBQUVuRSxJQUFVLDZCQUE2QixDQXVYdEM7QUF2WEQsV0FBVSw2QkFBNkI7SUFFdEMsU0FBZ0Isc0JBQXNCO1FBRXJDLElBQUksTUFBTSxHQUFHLFFBQVEsQ0FBRSxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBRSxtQkFBbUIsQ0FBRSxDQUFFLENBQUM7UUFDbEYsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBRS9CLDBCQUEwQjtRQUMxQix5RUFBeUU7UUFFekUsQ0FBQyxDQUFFLGlCQUFpQixDQUFHLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztRQUN4QyxDQUFDLENBQUUsMEJBQTBCLENBQUcsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1FBRWpELENBQUMsQ0FBRSxXQUFXLENBQUcsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1FBQ2xDLENBQUMsQ0FBRSxvQkFBb0IsQ0FBRyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7UUFFM0MsQ0FBQyxDQUFFLGtCQUFrQixDQUFHLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztRQUN6QyxDQUFDLENBQUUsMkJBQTJCLENBQUcsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1FBRWxELENBQUMsQ0FBRSxjQUFjLENBQUcsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1FBQ3JDLENBQUMsQ0FBRSx1QkFBdUIsQ0FBRyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7UUFFOUMsQ0FBQyxDQUFFLGNBQWMsQ0FBRyxDQUFDLE9BQU8sR0FBRyxLQUFLLENB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