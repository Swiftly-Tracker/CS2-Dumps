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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3NtZW51X3NlYXJjaC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3NldHRpbmdzbWVudV9zZWFyY2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUNsQyxvREFBb0Q7QUFFcEQsSUFBVSxrQkFBa0IsQ0FzSzNCO0FBdEtELFdBQVUsa0JBQWtCO0lBRTNCLElBQUkseUJBQXlCLEdBQUcsQ0FBQyxDQUFDLDBCQUEwQixDQUFnQixDQUFDO0lBQzdFLElBQUksa0JBQWtCLEdBQUcsQ0FBQyxDQUFDLHlCQUF5QixDQUFFLENBQUM7SUFFdkQsU0FBUyxLQUFLO1FBRWIsQ0FBQyxDQUFDLG9CQUFvQixDQUFFLGlCQUFpQixFQUFFLHlCQUF5QixFQUFFLGtCQUFrQixDQUFFLENBQUM7UUFDM0YsQ0FBQyxDQUFDLG9CQUFvQixDQUFFLG1CQUFtQixFQUFFLHlCQUF5QixFQUFFLG9CQUFvQixDQUFFLENBQUM7UUFDL0YseUJBQXlCLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdkQseUJBQXlCLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFbkQseUJBQXlCLENBQUMsYUFBYSxDQUFFLG1CQUFtQixFQUFFLGtCQUFrQixDQUFFLENBQUM7UUFDbkYsa0JBQWtCLEVBQUUsQ0FBQztJQUN0QixDQUFDO0lBRUQsU0FBUyxrQkFBa0I7UUFFMUIseUJBQXlCLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDckMseUJBQXlCLENBQUMsaUJBQWlCLENBQUUsSUFBSSxDQUFFLENBQUM7SUFDckQsQ0FBQztJQUVELFNBQVMsb0JBQW9CO1FBRTVCLHlCQUF5QixDQUFDLFNBQVMsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ2pELHlCQUF5QixDQUFDLGlCQUFpQixDQUFFLEtBQUssQ0FBRSxDQUFDO0lBQ3RELENBQUM7SUFFRCxT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