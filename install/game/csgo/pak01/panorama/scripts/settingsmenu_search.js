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
        // skip if all whitespace
        let hasText = /.*\S.*/;
        if (!hasText.test(m_SettingsSearchTextEntry.text)) {
            PopulateWithPromotedSettings();
            return;
        }
        // split based on whitespace but skip anything without word chars
        let arrStrings = m_SettingsSearchTextEntry.text.split(/\s/).filter(s => /^\w+$/.test(s));
        // This searches everything in the page with is overkill, but alternative is to keep
        // a list of setting containing IDs to search within which will go stale pretty fast...
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
        // Walk the whole dom looking for strings in the 'text' field
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
                    // must contain every string in the search bar to pass
                    let bPass = arrStrings.every(s => {
                        let search = new RegExp(s, "giu");
                        return search.test(setting.text);
                    });
                    if (bPass) {
                        let curSubMenu = '';
                        // HACK: Video is the only one with settings split into two buckets...
                        // So far we reorganize settings pretty rarely, but if we churn there more regularly
                        // this go-to-panel code is pretty fragile and might need to get reworked
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
                // Filter out a bunch of text on panel types we dont want to match...
                // Tradeoff here is search everything and cull down (slower, more future proof)
                // or curate a list of searchable lables (more work up front, breaks as people add settings and dont pay attention to search)
                // Going with the former until perf becomres a problem or these rules get too cumbersome.
                function ShouldSearchPanelText(setting) {
                    // Must have a text field to search
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
        // Make panels from the results
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
    // On creation
    {
        _Init();
    }
})(SettingsMenuSearch || (SettingsMenuSearch = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3NtZW51X3NlYXJjaC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3NldHRpbmdzbWVudV9zZWFyY2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUNsQyxvREFBb0Q7QUFFcEQsSUFBVSxrQkFBa0IsQ0F1SzNCO0FBdktELFdBQVUsa0JBQWtCO0lBRTNCLElBQUkseUJBQXlCLEdBQUcsQ0FBQyxDQUFDLDBCQUEwQixDQUFnQixDQUFDO0lBQzdFLElBQUksa0JBQWtCLEdBQUcsQ0FBQyxDQUFDLHlCQUF5QixDQUFFLENBQUM7SUFFdkQsU0FBUyxLQUFLO1FBRWIsQ0FBQyxDQUFDLG9CQUFvQixDQUFFLGlCQUFpQixFQUFFLHlCQUF5QixFQUFFLGtCQUFrQixDQUFFLENBQUM7UUFDM0YsQ0FBQyxDQUFDLG9CQUFvQixDQUFFLG1CQUFtQixFQUFFLHlCQUF5QixFQUFFLG9CQUFvQixDQUFFLENBQUM7UUFDL0YseUJBQXlCLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdkQseUJBQXlCLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFbkQseUJBQXlCLENBQUMsYUFBYSxDQUFFLG1CQUFtQixFQUFFLGtCQUFrQixDQUFFLENBQUM7UUFDbkYsa0JBQWtCLEVBQUUsQ0FBQztJQUN0QixDQUFDO0lBRUQsU0FBUyxrQkFBa0I7UUFFMUIseUJBQXlCLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDckMseUJBQXlCLENBQUMsaUJBQWlCLENBQUUsSUFBSSxDQUFFLENBQUM7SUFDckQsQ0FBQztJQUVELFNBQVMsb0JBQW9CO1FBRTVCLHlCQUF5QixDQUFDLFNBQVMsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ2pELHlCQUF5QixDQUFDLGlCQUFpQixDQUFFLEtBQUssQ0FBRSxDQUFDO0lBQ3RELENBQUM7SUFFRCxT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