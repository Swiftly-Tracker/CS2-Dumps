"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/formattext.ts" />
/// <reference path="common/gamerules_constants.ts" />
/// <reference path="endofmatch-characters.ts" />
/// <reference path="mock_adapter.ts" />
var EndOfMatch;
(function (EndOfMatch) {
    // for the case when we're a debug panel, use "PanelToTest". see \scripts\mainmenu_tests.js
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
    //DEVONLY{
    const DEBUG_EOM = false;
    $.RegisterForUnhandledEvent("EndOfMatch_Test_Show", _StartTestShow);
    //}DEVONLY
    _m_cP.AddClass('scoreboard-visible');
    function _NavigateToTab(tab) {
        // if an active tab exists, first deactivate it
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
        // we delay the latch to capture the last bits of data
        $.Schedule(1, () => { $.DispatchEvent("EndOfMatch_Latch"); });
        _m_data._m_arrPanelObjects = [];
        _m_data._m_currentPanelIndex = -1;
        _m_data._m_elActiveTab = null;
        if (_m_data._m_jobStart !== null) {
            $.CancelScheduled(_m_data._m_jobStart);
            _m_data._m_jobStart = null;
        }
        // Determine the game mode
        var mode = MockAdapter.GetGameModeInternalName(false);
        _m_data._m_scoreboardVisible = (mode == "cooperative") || (mode == "coopmission");
        var elLayout = _m_cP.FindChildTraverse("id-eom-layout");
        elLayout.RemoveAndDeleteChildren();
        let strEomLayoutSnippet = "snippet-eom-layout--default";
        if (mode == "premier") {
            strEomLayoutSnippet = "snippet-eom-layout--premier";
        }
        elLayout.BLoadLayoutSnippet(strEomLayoutSnippet);
        // reset progress bar
        let elProgBar = _m_cP.FindChildTraverse("id-display-timer-progress-bar");
        elProgBar.style.transitionDuration = "0s";
        elProgBar.style.width = '0%';
        // SCOREBOARD TOGGLE BINDING (start with scoreboard in coop)
        var bind = GameInterfaceAPI.GetSettingString("cl_scoreboard_mouse_enable_binding");
        if (bind.charAt(0) == '+' || bind.charAt(0) == '-')
            bind = bind.substring(1);
        bind = "{s:bind_" + bind + "}";
        bind = $.Localize(bind, _m_cP);
        _m_cP.SetDialogVariable("scoreboard_toggle_bind", bind);
        _m_cP.FindChildrenWithClassTraverse("timer").forEach(el => el.active = false);
        // populate navbar
        var elNavBar = _m_cP.FindChildTraverse("id-content-navbar__tabs");
        elNavBar.RemoveAndDeleteChildren();
        _m_cP.FindChildrenWithClassTraverse("eom-panel").forEach((elPanel, i) => {
            // create the navbar button
            var elRBtn = $.CreatePanel("RadioButton", elNavBar, "rb--" + elPanel.id);
            elRBtn.BLoadLayoutSnippet("snippet_navbar-button");
            elRBtn.AddClass("navbar-button");
            elRBtn.AddClass("appear");
            let tabName = elPanel.id;
            elRBtn.SetPanelEvent('onactivate', () => _NavigateToTab(tabName));
            //DEVONLY{
            if (DEBUG_EOM) {
                elRBtn.style.border = '1px solid red';
                function _r(min = 0, max = 100) {
                    return Math.ceil(Math.random() * ((max - min) + min));
                }
                ;
                let tabName = elPanel.id;
                elRBtn.SetPanelEvent('onactivate', () => {
                    _NavigateToTab(tabName);
                    if (i === 0) {
                        let rankType = 'Premier';
                        let oldrank;
                        let newrank;
                        switch (rankType) {
                            case 'Wingman':
                            case 'Competitive':
                                oldrank = Math.ceil(Math.random() * 17);
                                newrank = oldrank + _r(-1, +1);
                                break;
                            case 'Premier':
                                //oldrank = Math.ceil( Math.random() * 7 ) * 500 - Math.floor( Math.random() * 50);
                                //Keep for promotion state
                                //newrank = oldrank + (100 - (oldrank - (Math.floor(oldrank/100)*100))) - 1 ; // _r( 0, 100 );
                                //newrank = oldrank + _r( 0, 100 );
                                oldrank = 30001;
                                newrank = 30002;
                                break;
                        }
                        const k_SkillgroupDataJSO = {};
                        k_SkillgroupDataJSO[MockAdapter.GetLocalPlayerXuid()] = {
                            old_rank: oldrank,
                            new_rank: newrank,
                            num_wins: 13,
                            rank_change: 666,
                            rank_type: rankType
                        };
                        const xpTracksPreMatch = [
                            Math.random() * 20000,
                            Math.random() * 20000,
                            Math.random() * 20000,
                            Math.random() * 20000,
                            Math.random() * 20000
                        ];
                        const xpEarned = 400;
                        const xptracksPostMatch = xpTracksPreMatch.map(xp => xp + xpEarned);
                        MockAdapter.AddTable('custom', {
                            k_bSkillgroupDataReady: false,
                            k_SkillgroupDataJSO,
                            k_GetPlayerCompetitiveRankType: {
                                0: rankType
                            },
                            k_GetPlayerCompetitiveRanking: 0,
                            k_GetPlayerCompetitiveWins: 734,
                            // xp
                            k_bXpDataReady: true,
                            k_XpDataJSO: {
                                current_level: _r(0, 39),
                                current_xp: 100,
                                free_rewards: 2,
                                xp_progress_data: [
                                    { xp_points: 100, xp_category: 2 },
                                    { xp_points: 0, xp_category: 6 },
                                ],
                                xp_trail_xp_needed: -10000,
                                xp_trail_remaining: 20000,
                            },
                            // xpshop
                            k_bXpShopDataReady: true,
                            k_XpShopDataJSO: {
                                prematch: {
                                    redeemable_balance: 3,
                                    xp_tracks: xpTracksPreMatch
                                },
                                postmatch: {
                                    redeemable_balance: 1,
                                    xp_tracks: xptracksPostMatch
                                },
                            }
                        });
                        $.DispatchEvent('EndOfMatch_Test_Show', 'custom,EOM_WIN,RANK');
                    }
                    else {
                        _m_data._m_arrPanelObjects[i - 1].Start();
                    }
                });
            }
            //}DEVONLY
            elRBtn.FindChildTraverse("id-navbar-button__label").text = $.Localize("#" + elPanel.id);
        });
    }
    function _ShowPanelStart() {
        if (!_m_cP || !_m_cP.IsValid())
            return;
        _m_cP.AddClass("eom--reveal");
        // Fade to black before enabling the in-world camera.
        // Then transition back by hiding the fade.
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
            // unfortunately we can't do this synchronously --
            // we might be in the last frame of a killer replay,
            // which erroneously makes us think we are in a "demo".
            //
            // so instead do an async schedule here to wait 1 frame
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
        // reset
        $.Schedule(0.0, () => {
            if (elProgBar && elProgBar.IsValid()) {
                elProgBar.style.transitionDuration = "0s";
                elProgBar.style.width = '0%';
            }
        });
        // play
        $.Schedule(0.0, () => {
            if (elProgBar && elProgBar.IsValid()) {
                elProgBar.style.transitionDuration = time + "s";
                elProgBar.style.width = '100%';
            }
        });
    }
    EndOfMatch.StartDisplayTimer = StartDisplayTimer;
    // the shownext event will cycle the end of match to the next state
    function ShowNextPanel() {
        _m_data._m_currentPanelIndex++;
        if (_m_data._m_currentPanelIndex < _m_data._m_arrPanelObjects.length) {
            // reveal timer on last panel if live game
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5kb2ZtYXRjaC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL2VuZG9mbWF0Y2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUNsQyw2Q0FBNkM7QUFDN0Msc0RBQXNEO0FBQ3RELGlEQUFpRDtBQUNqRCx3Q0FBd0M7QUE2QnhDLElBQVUsVUFBVSxDQW9ZbkI7QUFwWUQsV0FBVSxVQUFVO0lBRW5CLDJGQUEyRjtJQUMzRixNQUFNLEtBQUssR0FBcUIsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQ2pELE1BQU0sT0FBTyxHQUNiO1FBQ0Msa0JBQWtCLEVBQUcsRUFBRTtRQUN2QixvQkFBb0IsRUFBRyxDQUFDLENBQUM7UUFDekIsV0FBVyxFQUFHLElBQUk7UUFDbEIsY0FBYyxFQUFHLElBQUk7UUFDckIsb0JBQW9CLEVBQUcsS0FBSztLQUM1QixDQUFBO0lBRUQsQ0FBQyxDQUFDLG9CQUFvQixDQUFFLGlCQUFpQixFQUFFLEtBQUssRUFBRSxNQUFNLENBQUUsQ0FBQztJQUMzRCxDQUFDLENBQUMseUJBQXlCLENBQUUscUJBQXFCLEVBQUUsU0FBUyxDQUFFLENBQUM7SUFFaEUsVUFBVTtJQUNWLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQztJQUN4QixDQUFDLENBQUMseUJBQXlCLENBQUUsc0JBQXNCLEVBQUUsY0FBYyxDQUFFLENBQUM7SUFDdEUsVUFBVTtJQUVWLEtBQUssQ0FBQyxRQUFRLENBQUUsb0JBQW9CLENBQUUsQ0FBQztJQUV2QyxTQUFTLGNBQWMsQ0FBRyxHQUFXO1FBRXBDLCtDQUErQztRQUMvQyxJQUFLLE9BQU8sQ0FBQyxjQUFjLElBQUksT0FBTyxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsRUFDL0Q7WUFDQyxPQUFPLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBRSxtQkFBbUIsQ0FBRSxDQUFDO1NBQzFEO1FBRUQsT0FBTyxD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