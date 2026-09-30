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
        let nDrawOutline = parseInt(GameInterfaceAPI.GetSettingString('cl_crosshair_drawoutline'));
        if (nDrawOutline != 0) {
            $("#XhairOutlineColorPicker").visible = true;
            $("#XhairOutlineColorPickerSeparator").visible = true;
        }
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
        else if (nStyle == 8) {
            $("#XhairCenterDot").visible = true;
            $("#XhairCenterDotSeparator").visible = true;
            $("#XhairGap").visible = true;
            $("#XhairGapSeparator").visible = true;
        }
        else if (nStyle == 9) {
            $("#XhairCenterDot").visible = true;
            $("#XhairCenterDotSeparator").visible = true;
            $("#XhairGap").visible = true;
            $("#XhairGapSeparator").visible = true;
            $("#XhairStaticQuadSplitRatio").visible = true;
            $("#XhairStaticQuadSplitRatioSeparator").visible = true;
        }
        $("#CrosshairEditorPreview").SetHasClass("dynamic-crosshair", nStyle === 0 || nStyle === 1 || nStyle === 2 || nStyle === 6);
        let obsCrosshairs = parseInt(GameInterfaceAPI.GetSettingString('cl_show_observer_crosshair'));
        let showObserverBotSetting = (obsCrosshairs === 2);
        $("#XhairObservedBotCrosshair").visible = showObserverBotSetting;
        $("#XhairObservedBotCrosshairSeparator").visible = showObserverBotSetting;
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
    const k_arrNewCrosshairStyles = [3, 6, 0, 1, 7, 8, 9];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3NtZW51X2Nyb3NzaGFpci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3NldHRpbmdzbWVudV9jcm9zc2hhaXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUNsQywrQ0FBK0M7QUFDL0Msb0RBQW9EO0FBQ3BELG1FQUFtRTtBQUVuRSxJQUFVLDZCQUE2QixDQXVYdEM7QUF2WEQsV0FBVSw2QkFBNkI7SUFFdEMsU0FBZ0Isc0JBQXNCO1FBRXJDLElBQUksTUFBTSxHQUFHLFFBQVEsQ0FBRSxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBRSxtQkFBbUIsQ0FBRSxDQUFFLENBQUM7UUFDbEYsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBSy9CLENBQUMsQ0FBRSxpQkFBaUIsQ0FBRyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7UUFDeEMsQ0FBQyxDQUFFLDBCQUEwQixDQUFHLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztRQUVqRCxDQUFDLENBQUUsV0FBVyxDQUFHLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztRQUNsQyxDQUFDLENBQUUsb0JBQW9CLENBQUcsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1FBRTNDLENBQUMsQ0FBRSxrQkFBa0IsQ0FBRyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7UUFDekMsQ0FBQyxDQUFFLDJCQUEyQixDQUFHLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztRQUVsRCxDQUFDLENBQUUsY0FBYyxDQUFHLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztRQUNyQyxDQUFDLENBQUUsdUJBQXVCLENBQUcsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1FBRTlDLENBQUMsQ0FBRSxjQUFjLENBQUcsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1FBQ3JDLENBQUMsQ0FBRSx1QkFBdUIsQ0FBRyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7UUFFOUMsQ0FBQyxDQUFFLHlCQUF5QixDQUFHLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztRQUNoRCxDQUFDLENBQUUsa0NBQWtDLENBQUcsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1FBRXpELENBQUMsQ0FBRSx3QkFBd0IsQ0FBRyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7UUFDL0MsQ0FBQyxDQUFFLGlDQUFpQyxDQUFHLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztRQUV4RCxDQUFDLENBQUUsOEJBQThCLENBQUcsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1FBQ3JELENBQUMsQ0FBRSx1Q0FBdUMsQ0FBRyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7UUFFOUQsQ0FBQyxDQUFFLDhCQUE4QixDQUFHLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztRQUNyRCxDQUFDLENBQUUsdUNBQXVDLENBQUcsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1FBRTlELENBQUMsQ0FBRSx5QkFBeUIsQ0FBRyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7UUFDaEQsQ0FBQyxDQUFFLGtDQUFrQyxDQUFHLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztRQUV6RCxDQUFDLENBQUUsMEJBQTBCLENBQUcsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1FBQ2pELENBQUMsQ0FBRSxtQ0FBbUMsQ0FBRyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7UUFFMUQsQ0FBQyxDQUFFLDRCQUE0QixDQUFHLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztRQUNuRCxDQUFDLENBQUUscUNBQXFDLENBQUcsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1FBSzVELElBQUksWUFBWSxHQUFHLFFBQVEsQ0FBRSxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBRSwwQkFBMEIsQ0FBRSxDQUFFLENBQUM7UUFDL0YsSUFBSSxZQUFZLElBQUksQ0FBQyxFQUNyQjtZQUNDLENBQUMsQ0FBRSwwQkFBMEIsQ0FBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDaEQsQ0FBQyxDQUFFLG1DQUFtQyxDQUFHLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztTQUN6RDtRQU1ELElBQUksTUFBTSxJQUFJLENBQUMsRUFDZjtZQUNDLENBQUMsQ0FBRSxpQkFBaUIsQ0FBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDdkMsQ0FBQyxDQUFFLDBCQUEwQixDQUFHLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztZQUNoRCxDQUFDLENBQUUsV0FBVyxDQUFHLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztZQUNqQyxDQUFDLENBQUUsb0JBQW9CLENBQUcsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQzFDLENBQUMsQ0FBRSxjQUFjLENBQUcsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQ3BDLENBQUMsQ0FBRSx1QkFBdUIsQ0FBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDN0MsQ0FBQyxDQUFFLGNBQWMsQ0FBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDcEMsQ0FBQyxDQUFFLHVCQUF1QixDQUFHLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztZQUM3QyxDQUFDLENBQUUseUJBQXlCLENBQUcsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQy9DLENBQUMsQ0FBRSxrQ0FBa0MsQ0FBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7U0FDeEQ7YUFFSSxJQUFJLE1BQU0sSUFBSSxDQUFDLEVBQ3BCO1lBQ0MsQ0FBQyxDQUFFLGlCQUFpQixDQUFHLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztZQUN2QyxDQUFDLENBQUUsMEJBQTBCLENBQUcsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQ2hELENBQUMsQ0FBRSx5QkFBeUIsQ0FBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDL0MsQ0FBQyxDQUFFLGtDQUFrQyxDQUFHLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztTQUN4RDthQUVJLElBQUksTUFBTSxJQUFJLENBQUMsRUFDcEI7WUFDQyxDQUFDLENBQUUsaUJBQWlCLENBQUcsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQ3ZDLENBQUMsQ0FBRSwwQkFBMEIsQ0FBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDaEQsQ0FBQyxDQUFFLGtCQUFrQixDQUFHLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztZQUN4QyxDQUFDLENBQUUsMkJBQTJCLENBQUcsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQ2pELENBQUMsQ0FBRSxjQUFjLENBQUcsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQ3BDLENBQUMsQ0FBRSx1QkFBdUIsQ0FBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDN0MsQ0FBQyxDQUFFLGNBQWMsQ0FBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDcEMsQ0FBQyxDQUFFLHVCQUF1QixDQUFHLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztZQUM3QyxDQUFDLENBQUUseUJBQXlCLENBQUcsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQy9DLENBQUMsQ0FBRSxrQ0FBa0MsQ0FBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDeEQsQ0FBQyxDQUFFLHdCQUF3QixDQUFHLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztZQUM5QyxDQUFDLENBQUUsaUNBQWlDLENBQUcsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQ3ZELENBQUMsQ0FBRSw4QkFBOEIsQ0FBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDcEQsQ0FBQyxDQUFFLHVDQUF1QyxDQUFHLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztZQUM3RCxDQUFDLENBQUUsOEJBQThCLENBQUcsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQ3BELENBQUMsQ0FBRSx1Q0FBdUMsQ0FBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7U0FDN0Q7YUFFSSxJQUFJLE1BQU0sSUFBSSxDQUFDLEVBQ3BCO1lBQ0MsQ0FBQyxDQUFFLGlCQUFpQixDQUFHLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztZQUN2QyxDQUFDLENBQUUsMEJBQTBCLENBQUcsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQ2hELENBQUMsQ0FBRSxXQUFXLENBQUcsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQ2pDLENBQUMsQ0FBRSxvQkFBb0IsQ0FBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7U0FDMUM7YUFFSSxJQUFJLE1BQU0sSUFBSSxDQUFDLEVBQ3BCO1lBQ0MsQ0FBQyxDQUFFLGlCQUFpQixDQUFHLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztZQUN2QyxDQUFDLENBQUUsMEJBQTBCLENBQUcsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQ2hELENBQUMsQ0FBRSxXQUFXLENBQUcsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQ2pDLENBQUMsQ0FBRSxvQkFBb0IsQ0FBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDMUMsQ0FBQyxDQUFFLGNBQWMsQ0FBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDcEMsQ0FBQyxDQUFFLHVCQUF1QixDQUFHLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztZQUM3QyxDQUFDLENBQUUsY0FBYyxDQUFHLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztZQUNwQyxDQUFDLENBQUUsdUJBQXVCLENBQUcsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1NBQzdDO2FBRUksSUFBSSxNQUFNLElBQUksQ0FBQyxFQUNwQjtZQUNDLENBQUMsQ0FBRSxpQkFBaUIsQ0FBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDdkMsQ0FBQyxDQUFFLDBCQUEwQixDQUFHLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztZQUNoRCxDQUFDLENBQUUsV0FBVyxDQUFHLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztZQUNqQyxDQUFDLENBQUUsb0JBQW9CLENBQUcsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQzFDLENBQUMsQ0FBRSxjQUFjLENBQUcsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQ3BDLENBQUMsQ0FBRSx1QkFBdUIsQ0FBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDN0MsQ0FBQyxDQUFFLGNBQWMsQ0FBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDcEMsQ0FBQyxDQUFFLHVCQUF1QixDQUFHLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztTQUM3QzthQUVJLElBQUksTUFBTSxJQUFJLENBQUMsRUFDcEI7U0FFQzthQUVJLElBQUksTUFBTSxJQUFJLENBQUMsRUFDcEI7WUFDQyxDQUFDLENBQUUsaUJBQWlCLENBQUcsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQ3ZDLENBQUMsQ0FBRSwwQkFBMEIsQ0FBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDaEQsQ0FBQyxDQUFFLFdBQVcsQ0FBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDakMsQ0FBQyxDQUFFLG9CQUFvQixDQUFHLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztZQUMxQyxDQUFDLENBQUUsY0FBYyxDQUFHLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztZQUNwQyxDQUFDLENBQUUsdUJBQXVCLENBQUcsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQzdDLENBQUMsQ0FBRSxjQUFjLENBQUcsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQ3BDLENBQUMsQ0FBRSx1QkFBdUIsQ0FBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDN0MsQ0FBQyxDQUFFLHlCQUF5QixDQUFHLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztZQUMvQyxDQUFDLENBQUUsa0NBQWtDLENBQUcsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1NBQ3hEO2FBRUksSUFBSSxNQUFNLElBQUksQ0FBQyxFQUNwQjtZQUNDLENBQUMsQ0FBRSxpQkFBaUIsQ0FBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDdkMsQ0FBQyxDQUFFLDBCQUEwQixDQUFHLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztZQUNoRCxDQUFDLENBQUUsV0FBVyxDQUFHLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztZQUNqQyxDQUFDLENBQUUsb0JBQW9CLENBQUcsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1NBQzFDO2FBRUksSUFBSSxNQUFNLElBQUksQ0FBQyxFQUNwQjtZQUNDLENBQUMsQ0FBRSxpQkFBaUIsQ0FBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDdkMsQ0FBQyxDQUFFLDBCQUEwQixDQUFHLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztZQUNoRCxDQUFDLENBQUUsV0FBVyxDQUFHLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztZQUNqQyxDQUFDLENBQUUsb0JBQW9CLENBQUcsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQzFDLENBQUMsQ0FBRSw0QkFBNEIsQ0FBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDbEQsQ0FBQyxDQUFFLHFDQUFxQyxDQUFHLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztTQUMzRDtRQUtELENBQUMsQ0FBRSx5QkFBeUIsQ0FBRyxDQUFDLFdBQVcsQ0FBRSxtQkFBbUIsRUFBRSxNQUFNLEtBQUssQ0FBQyxJQUFJLE1BQU0sS0FBSyxDQUFDLElBQUksTUFBTSxLQUFLLENBQUMsSUFBSSxNQUFNLEtBQUssQ0FBQyxDQUFFLENBQUM7UUFFakksSUFBSSxhQUFhLEdBQUcsUUFBUSxDQUFFLGdCQUFnQixDQUFDLGdCQUFnQixDQUFFLDRCQUE0QixDQUFFLENBQUUsQ0FBQztRQUVsRyxJQUFJLHNCQUFzQixHQUFHLENBQUMsYUFBYSxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ25ELENBQUMsQ0FBRSw0QkFBNEIsQ0FBRyxDQUFDLE9BQU8sR0FBRyxzQkFBc0IsQ0FBQztRQUNwRSxDQUFDLENBQUUscUNBQXFDLENBQUcsQ0FBQyxPQUFPLEdBQUcsc0JBQXNCLENBQUM7UUFLN0Usb0JBQW9CLENBQUUsRUFBRSxDQUFFLENBQUM7UUFFM0IsTUFBTSxVQUFVLEdBQUcsQ0FBQyxDQUFFLHVCQUF1QixDQUFFLENBQUM7UUFDaEQsQ0FBQyxDQUFFLG9CQUFvQixDQUFFLEVBQUUsYUFBYSxDQUFFLFlBQVksRUFBRSxHQUFFLEVBQUU7WUFDM0QsSUFBSSxnQkFBZ0IsR0FBRyxZQUFZLENBQUMscUNBQXFDLENBQ3hFLEVBQUUsRUFDRixFQUFFLEVBQ0YsdUVBQXVFLEVBQ3ZFLEVBQUUsQ0FDRixDQUFDO1lBRUYsZ0JBQWdCLENBQUMsUUFBUSxDQUFFLHFCQUFxQixDQUFFLENBQUM7WUFDbkQsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxHQUFHO2dCQUNqQyxDQUFDLEVBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLGdCQUFnQixDQUFFLHFCQUFxQixDQUFDLENBQUM7Z0JBQ3JFLENBQUMsRUFBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUUscUJBQXFCLENBQUMsQ0FBQztnQkFDckUsQ0FBQyxFQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBRSxxQkFBcUIsQ0FBQyxDQUFDO2FBQWlDLENBQUE7WUFFOUYsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLENBQUMsVUFBVSxHQUFHLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBRSxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7WUFDekcsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLENBQUMsWUFBWSxHQUFHLENBQUUsT0FBa0QsRUFBRyxFQUFFO2dCQUU1RixJQUFJLEtBQUssSUFBSSxPQUFPLEVBQ3BCO29CQUNJLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxHQUFtQyxDQUFFO29CQUU3RCxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBRSxxQkFBcUIsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFFLENBQUM7b0JBQ2pGLGdCQUFnQixDQUFDLGdCQUFnQixDQUFFLHFCQUFxQixFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUUsQ0FBQztvQkFDakYsZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUUscUJBQXFCLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBRSxDQUFDO29CQUVqRixvQkFBb0IsQ0FBRSxFQUFFLENBQUUsQ0FBQztpQkFDOUI7Z0JBRUQsSUFBSSxPQUFPLElBQUksT0FBTyxFQUN0QjtvQkFDSSxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDO29CQUMvQixnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBRSxxQkFBcUIsRUFBRSxRQUFTLENBQUMsUUFBUSxFQUFFLENBQUUsQ0FBQztpQkFDcEY7WUFDTCxDQUFDLENBQUM7UUFDWixDQUFDLENBQUMsQ0FBQztRQUtILE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxDQUFFLDhCQUE4QixDQUFFLENBQUM7UUFDOUQsQ0FBQyxDQUFFLDJCQUEyQixDQUFFLEVBQUUsYUFBYSxDQUFFLFlBQVksRUFBRSxHQUFFLEVBQUU7WUFDbEUsSUFBSSxnQkFBZ0IsR0FBRyxZQUFZLENBQUMscUNBQXFDLENBQ3hFLEVBQUUsRUFDRixFQUFFLEVBQ0YsdUVBQXVFLEVBQ3ZFLEVBQUUsQ0FDRixDQUFDO1lBRUYsZ0JBQWdCLENBQUMsUUFBUSxDQUFFLHFCQUFxQixDQUFFLENBQUM7WUFDbkQsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxHQUFHO2dCQUNqQyxDQUFDLEVBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLGdCQUFnQixDQUFFLHVCQUF1QixDQUFDLENBQUM7Z0JBQ3ZFLENBQUMsRUFBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUUsdUJBQXVCLENBQUMsQ0FBQztnQkFDdkUsQ0FBQyxFQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBRSx1QkFBdUIsQ0FBQyxDQUFDO2FBQWlDLENBQUE7WUFFaEcsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLENBQUMsVUFBVSxHQUFHLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBRSx1QkFBdUIsQ0FBQyxDQUFDLENBQUM7WUFDM0csZ0JBQWdCLENBQUMsSUFBSSxFQUFFLENBQUMsWUFBWSxHQUFHLENBQUUsT0FBa0QsRUFBRyxFQUFFO2dCQUU1RixJQUFJLEtBQUssSUFBSSxPQUFPLEVBQ3BCO29CQUNJLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxHQUFtQyxDQUFFO29CQUU3RCxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBRSx1QkFBdUIsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFFLENBQUM7b0JBQ25GLGdCQUFnQixDQUFDLGdCQUFnQixDQUFFLHVCQUF1QixFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUUsQ0FBQztvQkFDbkYsZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUUsdUJBQXVCLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBRSxDQUFDO29CQUVuRixvQkFBb0IsQ0FBRSxFQUFFLENBQUUsQ0FBQztpQkFDOUI7Z0JBRUQsSUFBSSxPQUFPLElBQUksT0FBTyxFQUN0QjtvQkFDSSxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDO29CQUMvQixnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBRSx1QkFBdUIsRUFBRSxRQUFTLENBQUMsUUFBUSxFQUFFLENBQUUsQ0FBQztpQkFDdEY7WUFDTCxDQUFDLENBQUM7UUFDWixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUM7SUFyUWUsb0RBQXNCLHlCQXFRckMsQ0FBQTtJQUVELFNBQVMsb0JBQW9CLENBQUUsRUFBVTtRQUV4QyxJQUFJLE1BQU0sR0FBRyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBRSxxQkFBcUIsQ0FBRSxDQUFDO1FBQ3hFLElBQUksTUFBTSxHQUFHLGdCQUFnQixDQUFDLGdCQUFnQixDQUFFLHFCQUFxQixDQUFFLENBQUM7UUFDeEUsSUFBSSxNQUFNLEdBQUcsZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUUscUJBQXFCLENBQUUsQ0FBQztRQUV2RSxFQUFFLENBQUMscUJBQXFCLENBQUUsc0JBQXNCLENBQWMsQ0FBQyxLQUFLLENBQUMsZUFBZSxHQUFHLE1BQU0sR0FBRyxNQUFNLEdBQUcsR0FBRyxHQUFHLE1BQU0sR0FBRyxHQUFHLEdBQUcsTUFBTSxHQUFHLElBQUksQ0FBQTtRQUU1SSxJQUFJLFFBQVEsR0FBRyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBRSx1QkFBdUIsQ0FBRSxDQUFDO1FBQzVFLElBQUksUUFBUSxHQUFHLGdCQUFnQixDQUFDLGdCQUFnQixDQUFFLHVCQUF1QixDQUFFLENBQUM7UUFDNUUsSUFBSSxRQUFRLEdBQUcsZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUUsdUJBQXVCLENBQUUsQ0FBQztRQUUzRSxFQUFFLENBQUMscUJBQXFCLENBQUUsNkJBQTZCLENBQWMsQ0FBQyxLQUFLLENBQUMsZUFBZSxHQUFHLE1BQU0sR0FBRyxRQUFRLEdBQUcsR0FBRyxHQUFHLFFBQVEsR0FBRyxHQUFHLEdBQUcsUUFBUSxHQUFHLElBQUksQ0FBQTtJQUMxSixDQUFDO0lBRUUsU0FBUyx5QkFBeUIsQ0FBRSxLQUFjO1FBRXBELElBQUssS0FBSyxJQUFJLElBQUksRUFDbEI7WUFDQyxPQUFPO1NBQ1A7UUFFRCxJQUFLLFFBQVEsSUFBSSxLQUFLLEVBQ3RCO1lBQ0UsS0FBSyxDQUFDLE1BQXFCLEVBQUUsQ0FBQztTQUMvQjtRQUVELElBQUksS0FBSyxDQUFDLGFBQWEsSUFBSSxTQUFTLEVBQ3BDO1lBRUMsT0FBTztTQUNQO2FBRUQ7WUFDQyxJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDbkMsS0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFDaEM7Z0JBQ0MsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDOUIseUJBQXlCLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDakM7U0FDRDtJQUNGLENBQUM7SUFHRCxNQUFNLHVCQUF1QixHQUFHLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7SUFHeEQsTUFBTSw0QkFBNEIsR0FBRztRQUNwQyxFQUFFLEVBQUUsRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLHdCQUF3QixFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLGdDQUFnQyxFQUFFO1FBQ25ILEVBQUUsRUFBRSxFQUFFLGtCQUFrQixFQUFFLFFBQVEsRUFBRSx3QkFBd0IsRUFBRSxHQUFHLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSwrQkFBK0IsRUFBRTtRQUM1SCxFQUFFLEVBQUUsRUFBRSxnQkFBZ0IsRUFBRSxRQUFRLEVBQUUsNEJBQTRCLEVBQUUsR0FBRyxFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsK0JBQStCLEVBQUU7UUFDOUgsRUFBRSxFQUFFLEVBQUUsYUFBYSxFQUFFLFFBQVEsRUFBRSx5QkFBeUIsRUFBRSxHQUFHLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSwrQkFBK0IsRUFBRTtRQUN4SCxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLHNCQUFzQixFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLCtCQUErQixFQUFFO0tBQ2xILENBQUM7SUFFRixTQUFTLFlBQVksQ0FBRyxXQUFtQixFQUFFLFdBQW1CO1FBRS9ELE9BQU8sNEJBQTRCLEdBQUcsV0FBVyxHQUFHLEtBQUssR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFFLFdBQVcsQ0FBRSxHQUFHLFVBQVUsQ0FBQztJQUNwRyxDQUFDO0lBRUQsU0FBUyxZQUFZLENBQUcsRUFBa0IsRUFBRSxPQUFlO1FBRTFELElBQUssQ0FBQyxFQUFFO1lBQ1AsT0FBTztRQUVOLEVBQWUsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQzVCLEVBQWUsQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDO0lBQ2xDLENBQUM7SUFFRCxTQUFTLHFCQUFxQjtRQUc3QixJQUFLLENBQUMsb0JBQW9CLENBQUMsaUNBQWlDLEVBQUUsQ0FBQyxJQUFJLENBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRSxLQUFLLFlBQVksQ0FBRTtZQUM1RyxPQUFPO1FBR1IsTUFBTSxVQUFVLEdBQUcsQ0FBQyxDQUFFLHFCQUFxQixDQUF1QyxDQUFDO1FBQ25GLElBQUssVUFBVSxFQUNmO1lBQ0MsS0FBTSxNQUFNLE1BQU0sSUFBSSx1QkFBdUIsRUFDN0M7Z0JBQ0MsTUFBTSxFQUFFLEdBQUcsZ0JBQWdCLEdBQUcsTUFBTSxDQUFDO2dCQUNyQyxNQUFNLE9BQU8sR0FBRyxZQUFZLENBQUUsZUFBZSxFQUFFLG1CQUFtQixDQUFFLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUUsd0JBQXdCLEdBQUcsTUFBTSxDQUFFLENBQUM7Z0JBRzdILFlBQVksQ0FBRSxVQUFVLENBQUMscUJBQXFCLENBQUUsRUFBRSxDQUFFLEVBQUUsT0FBTyxDQUFFLENBQUM7Z0JBQ2hFLFlBQVksQ0FBRSxVQUFVLENBQUMsU0FBUyxDQUFFLEVBQUUsQ0FBRSxFQUFFLE9BQU8sQ0FBRSxDQUFDO2FBQ3BEO1NBQ0Q7UUFHRCxLQUFNLE1BQU0sT0FBTyxJQUFJLDRCQUE0QixFQUNuRDtZQUNDLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBRSxHQUFHLEdBQUcsT0FBTyxDQUFDLEVBQUUsQ0FBRSxDQUFDO1lBQ3BDLElBQUssQ0FBQyxLQUFLO2dCQUNWLFNBQVM7WUFFVixNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsaUJBQWlCLENBQUUsT0FBTyxDQUFFLENBQUM7WUFDbkQsWUFBWSxDQUFFLE9BQU8sRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUUsR0FBRyxHQUFHLEdBQUcsWUFBWSxDQUFFLFlBQVksR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFFLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUUsQ0FBRSxDQUFDO1lBQzNJLEtBQUssQ0FBQyxhQUFhLENBQUUsYUFBYSxFQUFFLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxzQkFBc0IsQ0FBRSxLQUFLLEVBQUUsT0FBTyxDQUFDLFdBQVcsQ0FBRSxDQUFFLENBQUM7WUFDOUcsS0FBSyxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLGVBQWUsRUFBRSxDQUFFLENBQUM7U0FDMUU7SUFDRixDQUFDO0lBR0Q7UUFDQyxzQkFBc0IsRUFBRSxDQUFDO1FBQ3pCLHFCQUFxQixFQUFFLENBQUM7UUFDeEIsa0JBQWtCLENBQUMsZ0JBQWdCLENBQUUsQ0FBQyxDQUFFLENBQUM7S0FDekM7QUFDRixDQUFDLEVBdlhTLDZCQUE2QixLQUE3Qiw2QkFBNkIsUUF1WHRDIn0=