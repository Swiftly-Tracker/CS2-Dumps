"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/formattext.ts" />
/// <reference path="common/gamerules_constants.ts" />
/// <reference path="endofmatch-characters.ts" />
/// <reference path="mock_adapter.ts" />
var EndOfMatch;
(function (EndOfMatch) {
    const _m_cP = $('#EndOfMatch');
    const _m_data = {
        _m_arrPanelObjects: [],
        _m_currentPanelIndex: -1,
        _m_jobStart: null,
        _m_elActiveTab: null,
        _m_scoreboardVisible: false,
    };
    $.RegisterEventHandler("EndOfMatch_Show", _m_cP, _Start);
    $.RegisterForUnhandledEvent("EndOfMatch_Shutdown", _Shutdown);
    _m_cP.AddClass('scoreboard-visible');
    function _NavigateToTab(tab) {
        if (_m_data._m_elActiveTab && _m_data._m_elActiveTab.IsValid()) {
            _m_data._m_elActiveTab.RemoveClass('eom-panel--active');
        }
        _m_data._m_elActiveTab = _m_cP.FindChildTraverse(tab);
        if (_m_data._m_elActiveTab) {
            _m_data._m_elActiveTab.AddClass('eom-panel--active');
        }
    }
    function SwitchToPanel(tab) {
        _m_cP.FindChildTraverse('rb--' + tab).RemoveClass("hidden");
        _m_cP.FindChildTraverse('rb--' + tab).checked = true;
        _NavigateToTab(tab);
    }
    EndOfMatch.SwitchToPanel = SwitchToPanel;
    function RegisterPanelObject(panel) {
        _m_data._m_arrPanelObjects.push(panel);
    }
    EndOfMatch.RegisterPanelObject = RegisterPanelObject;
    function _Initialize() {
        _m_cP.SetMouseCapture(true);
        for (var j = 1; j < 10; ++j) {
            var elPanel = $.GetContextPanel().FindChildTraverse('EomCancelReason' + j);
            if (elPanel)
                elPanel.RemoveClass('show');
        }
        $.Schedule(1, () => { $.DispatchEvent("EndOfMatch_Latch"); });
        _m_data._m_arrPanelObjects = [];
        _m_data._m_currentPanelIndex = -1;
        _m_data._m_elActiveTab = null;
        if (_m_data._m_jobStart !== null) {
            $.CancelScheduled(_m_data._m_jobStart);
            _m_data._m_jobStart = null;
        }
        var mode = MockAdapter.GetGameModeInternalName(false);
        _m_data._m_scoreboardVisible = (mode == "cooperative") || (mode == "coopmission");
        var elLayout = _m_cP.FindChildTraverse("id-eom-layout");
        elLayout.RemoveAndDeleteChildren();
        let strEomLayoutSnippet = "snippet-eom-layout--default";
        if (mode == "premier") {
            strEomLayoutSnippet = "snippet-eom-layout--premier";
        }
        elLayout.BLoadLayoutSnippet(strEomLayoutSnippet);
        let elProgBar = _m_cP.FindChildTraverse("id-display-timer-progress-bar");
        elProgBar.style.transitionDuration = "0s";
        elProgBar.style.width = '0%';
        var bind = GameInterfaceAPI.GetSettingString("cl_scoreboard_mouse_enable_binding");
        if (bind.charAt(0) == '+' || bind.charAt(0) == '-')
            bind = bind.substring(1);
        bind = "{s:bind_" + bind + "}";
        bind = $.Localize(bind, _m_cP);
        _m_cP.SetDialogVariable("scoreboard_toggle_bind", bind);
        _m_cP.FindChildrenWithClassTraverse("timer").forEach(el => el.active = false);
        var elNavBar = _m_cP.FindChildTraverse("id-content-navbar__tabs");
        elNavBar.RemoveAndDeleteChildren();
        _m_cP.FindChildrenWithClassTraverse("eom-panel").forEach((elPanel, i) => {
            var elRBtn = $.CreatePanel("RadioButton", elNavBar, "rb--" + elPanel.id);
            elRBtn.BLoadLayoutSnippet("snippet_navbar-button");
            elRBtn.AddClass("navbar-button");
            elRBtn.AddClass("appear");
            let tabName = elPanel.id;
            elRBtn.SetPanelEvent('onactivate', () => _NavigateToTab(tabName));
            elRBtn.FindChildTraverse("id-navbar-button__label").text = $.Localize("#" + elPanel.id);
        });
    }
    function _ShowPanelStart() {
        if (!_m_cP || !_m_cP.IsValid())
            return;
        _m_cP.AddClass("eom--reveal");
        const elFade = $("#id-eom-fade");
        elFade.AddClass("active");
        let elFallbackBackground = $("#id-eom-fallback-background");
        elFallbackBackground.AddClass("hidden");
        var elBackgroundImage = _m_cP.FindChildInLayoutFile('BackgroundMapImage');
        elBackgroundImage.SetImage('file://{images}/map_icons/screenshots/1080p/' + GameStateAPI.GetMapBSPName() + '.png');
        $.Schedule(0.5, () => {
            _m_cP.SetWantsCamera(true);
            if (_m_cP.FindChildTraverse('id-eom-characters-root')) {
                EOM_Characters.Start();
            }
            elFade.RemoveClass("active");
            if (_m_cP.IsInFallbackMode()) {
                elFallbackBackground.RemoveClass("hidden");
            }
        });
    }
    function _Start(bHardCut) {
        _Initialize();
        if (bHardCut) {
            _m_data._m_jobStart = $.Schedule(0.0, () => {
                _m_data._m_jobStart = null;
                _ShowPanelStart();
                ShowNextPanel();
            });
        }
        else {
            _m_data._m_jobStart = $.Schedule(0.0, () => {
                _m_data._m_jobStart = null;
                _ShowPanelStart();
                $.Schedule(1.25, ShowNextPanel);
            });
        }
    }
    function _StartTestShow(mockData) {
        MockAdapter.SetMockData(mockData);
        $.DispatchEvent("Scoreboard_ResetAndInit");
        $.DispatchEvent("OnOpenScoreboard");
        _m_cP.SetMouseCapture(false);
        _Initialize();
        _ShowPanelStart();
        $.Schedule(1.25, ShowNextPanel);
    }
    function StartDisplayTimer(time) {
        var elProgBar = _m_cP.FindChildTraverse("id-display-timer-progress-bar");
        $.Schedule(0.0, () => {
            if (elProgBar && elProgBar.IsValid()) {
                elProgBar.style.transitionDuration = "0s";
                elProgBar.style.width = '0%';
            }
        });
        $.Schedule(0.0, () => {
            if (elProgBar && elProgBar.IsValid()) {
                elProgBar.style.transitionDuration = time + "s";
                elProgBar.style.width = '100%';
            }
        });
    }
    EndOfMatch.StartDisplayTimer = StartDisplayTimer;
    function ShowNextPanel() {
        _m_data._m_currentPanelIndex++;
        if (_m_data._m_currentPanelIndex < _m_data._m_arrPanelObjects.length) {
            if (_m_data._m_currentPanelIndex === (_m_data._m_arrPanelObjects.length - 1) &&
                !GameStateAPI.IsDemoOrHltv() &&
                !GameStateAPI.IsQueuedMatchmaking()) {
                _m_cP.FindChildrenWithClassTraverse("timer").forEach(el => el.active = true);
            }
            _m_data._m_arrPanelObjects[_m_data._m_currentPanelIndex].Start();
        }
    }
    EndOfMatch.ShowNextPanel = ShowNextPanel;
    function _Shutdown() {
        if (_m_data._m_jobStart) {
            $.CancelScheduled(_m_data._m_jobStart);
            _m_data._m_jobStart = null;
        }
        var elLayout = _m_cP.FindChildTraverse("id-eom-layout");
        elLayout.RemoveAndDeleteChildren();
        for (const panelObject of _m_data._m_arrPanelObjects) {
            if (panelObject.Shutdown)
                panelObject.Shutdown();
        }
        _m_cP.RemoveClass("eom--reveal");
        if (_m_cP.FindChildTraverse('id-eom-characters-root')) {
            EOM_Characters.Shutdown();
        }
        _m_cP.SetWantsCamera(false);
    }
})(EndOfMatch || (EndOfMatch = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5kb2ZtYXRjaC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL2VuZG9mbWF0Y2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUNsQyw2Q0FBNkM7QUFDN0Msc0RBQXNEO0FBQ3RELGlEQUFpRDtBQUNqRCx3Q0FBd0M7QUFpQ3hDLElBQVUsVUFBVSxDQW9ZbkI7QUFwWUQsV0FBVSxVQUFVO0lBR25CLE1BQU0sS0FBSyxHQUFxQixDQUFDLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDakQsTUFBTSxPQUFPLEdBQ2I7UUFDQyxrQkFBa0IsRUFBRyxFQUFFO1FBQ3ZCLG9CQUFvQixFQUFHLENBQUMsQ0FBQztRQUN6QixXQUFXLEVBQUcsSUFBSTtRQUNsQixjQUFjLEVBQUcsSUFBSTtRQUNyQixvQkFBb0IsRUFBRyxLQUFLO0tBQzVCLENBQUE7SUFFRCxDQUFDLENBQUMsb0JBQW9CLENBQUUsaUJBQWlCLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBRSxDQUFDO0lBQzNELENBQUMsQ0FBQyx5QkFBeUIsQ0FBRSxxQkFBcUIsRUFBRSxTQUFTLENBQUUsQ0FBQztJQU9oRSxLQUFLLENBQUMsUUFBUSxDQUFFLG9CQUFvQixDQUFFLENBQUM7SUFFdkMsU0FBUyxjQUFjLENBQUcsR0FBVztRQUdwQyxJQUFLLE9BQU8sQ0FBQyxjQUFjLElBQUksT0FBTyxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsRUFDL0Q7WUFDQyxPQUFPLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBRSxtQkFBbUIsQ0FBRSxDQUFDO1NBQzFEO1FBRUQsT0FBTyxDQUFDLGNBQWMsR0FBRyxLQUFLLENBQUMsaUJBQWlCLENBQUUsR0FBRyxDQUFFLENBQUM7UUFFeEQsSUFBSyxPQUFPLENBQUMsY0FBYyxFQUMzQjtZQUNDLE9BQU8sQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFFLG1CQUFtQixDQUFFLENB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