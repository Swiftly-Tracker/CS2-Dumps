"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/promoted_settings.ts" />
var SettingsMenuSearch;
(function (SettingsMenuSearch) {
    let m_SettingsSearchTextEntry = $("#SettingsSearchTextEntry");
    let m_ResultsContainer = $("#SearchResultsContainer");
    function _Init() {
        $.RegisterEventHandler('ReadyForDisplay', m_SettingsSearchTextEntry, _OnReadyForDisplay);
        $.RegisterEventHandler('UnreadyForDisplay', m_SettingsSearchTextEntry, _OnUnreadyForDisplay);
        m_SettingsSearchTextEntry.RegisterForReadyEvents(true);
        m_SettingsSearchTextEntry.SetReadyForDisplay(true);
        m_SettingsSearchTextEntry.SetPanelEvent('ontextentrychange', OnTextEntryChanged);
        OnTextEntryChanged();
    }
    function _OnReadyForDisplay() {
        m_SettingsSearchTextEntry.SetFocus();
        m_SettingsSearchTextEntry.RaiseChangeEvents(true);
    }
    function _OnUnreadyForDisplay() {
        m_SettingsSearchTextEntry.GetParent().SetFocus();
        m_SettingsSearchTextEntry.RaiseChangeEvents(false);
    }
    function OnTextEntryChanged() {
        m_ResultsContainer.RemoveAndDeleteChildren();
        let hasText = /.*\S.*/;
        if (!hasText.test(m_SettingsSearchTextEntry.text)) {
            PopulateWithPromotedSettings();
            return;
        }
        let arrStrings = m_SettingsSearchTextEntry.text.split(/\s/).filter(s => /^\w+$/.test(s));
        let searchableMenus = [
            'GameSettings',
            'AudioSettings',
            'video_settings',
            'advanced_video',
            'KeybdMouseSettings',
            'CrosshairSettings',
            'ControllerSettings'
        ];
        let arrMatches = [];
        let elSettingsMenu = $.GetContextPanel().GetParent();
        let curMenuTab = null;
        searchableMenus.forEach(id => {
            curMenuTab = id;
            let elRootPanel = elSettingsMenu.FindChildTraverse(id);
            if (!elRootPanel || !elRootPanel.IsValid())
                return;
            TraverseChildren(elRootPanel, SearchSettingText);
            function TraverseChildren(elRoot, fnSearch) {
                if (typeof elRoot.Children !== 'function')
                    return;
                elRoot.Children().forEach(c => { TraverseChildren(c, fnSearch); fnSearch(c); });
            }
            function SearchSettingText(setting) {
                if (ShouldSearchPanelText(setting)) {
                    let bPass = arrStrings.every(s => {
                        let search = new RegExp(s, "giu");
                        return search.test(setting.text);
                    });
                    if (bPass) {
                        let curSubMenu = '';
                        if (curMenuTab.includes('video')) {
                            curSubMenu = curMenuTab.includes('advanced') ? 'AdvancedVideoSettingsRadio' : 'SimpleVideoSettingsRadio';
                            curMenuTab = 'VideoSettings';
                        }
                        arrMatches.push({
                            panel: setting.GetParent(),
                            text: setting.text,
                            menu: curMenuTab,
                            submenu: curSubMenu
                        });
                    }
                }
                function ShouldSearchPanelText(setting) {
                    if (!setting.hasOwnProperty('text'))
                        return false;
                    if (setting.paneltype === 'TextEntry')
                        return false;
                    if (setting.BHasClass('DropDownChild'))
                        return false;
                    if (setting.BHasClass('BindingRowButton'))
                        return false;
                    if (setting.GetParent().paneltype === ('RadioButton'))
                        return false;
                    return true;
                }
            }
        });
        for (let searchResult of arrMatches) {
            CreateSearchResultPanel(searchResult.text, searchResult.menu, searchResult.submenu, searchResult.panel);
        }
    }
    function CreateSearchResultPanel(text, menuid, submenu, panel) {
        let elSearchResult = $.CreatePanel("Panel", m_ResultsContainer, "setting_result_link");
        if (elSearchResult.BLoadLayoutSnippet("SearchResult")) {
            elSearchResult.FindChild("ResultString").SetAlreadyLocalizedText(text);
            elSearchResult.SetPanelEvent('onactivate', () => {
                $.DispatchEvent("SettingsMenu_NavigateToSettingPanel", menuid, submenu, panel);
            });
        }
    }
    function PopulateWithPromotedSettings() {
        let elTitle = $.CreatePanel("Label", m_ResultsContainer, "promoted_settings_title");
        elTitle.text = $.Localize("#GameUI_Settings_Promoted");
        elTitle.AddClass("SettingsSectionTitleLabel");
        elTitle.AddClass("setting-search-recently-added-header");
        g_PromotedSettings.forEach(s => {
            let elSettingsMenu = $.GetContextPanel().GetParent();
            let elPanel = elSettingsMenu.FindChildTraverse(s.id);
            if (elPanel) {
                CreateSearchResultPanel($.Localize(s.loc_name), s.section, s.subsection || "", elPanel);
            }
        });
    }
    {
        _Init();
    }
})(SettingsMenuSearch || (SettingsMenuSearch = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3NtZW51X3NlYXJjaC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3NldHRpbmdzbWVudV9zZWFyY2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUNsQyxvREFBb0Q7QUFFcEQsSUFBVSxrQkFBa0IsQ0F1SzNCO0FBdktELFdBQVUsa0JBQWtCO0lBRTNCLElBQUkseUJBQXlCLEdBQUcsQ0FBQyxDQUFDLDBCQUEwQixDQUFnQixDQUFDO0lBQzdFLElBQUksa0JBQWtCLEdBQUcsQ0FBQyxDQUFDLHlCQUF5QixDQUFFLENBQUM7SUFFdkQsU0FBUyxLQUFLO1FBRWIsQ0FBQyxDQUFDLG9CQUFvQixDQUFFLGlCQUFpQixFQUFFLHlCQUF5QixFQUFFLGtCQUFrQixDQUFFLENBQUM7UUFDM0YsQ0FBQyxDQUFDLG9CQUFvQixDQUFFLG1CQUFtQixFQUFFLHlCQUF5QixFQUFFLG9CQUFvQixDQUFFLENBQUM7UUFDL0YseUJBQXlCLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdkQseUJBQXlCLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFbkQseUJBQXlCLENBQUMsYUFBYSxDQUFFLG1CQUFtQixFQUFFLGtCQUFrQixDQUFFLENBQUM7UUFDbkYsa0JBQWtCLEVBQUUsQ0FBQztJQUN0QixDQUFDO0lBRUQsU0FBUyxrQkFBa0I7UUFFMUIseUJBQXlCLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDckMseUJBQXlCLENBQUMsaUJBQWlCLENBQUUsSUFBSSxDQUFFLENBQUM7SUFDckQsQ0FBQztJQUVELFNBQVMsb0JBQW9CO1FBRTVCLHlCQUF5QixDQUFDLFNBQVMsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ2pELHlCQUF5QixDQUFDLGlCQUFpQixDQUFFLEtBQUssQ0FBRSxDQUFDO0lBQ3RELENBQUM7SUFFRCxT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