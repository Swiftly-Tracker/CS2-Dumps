"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../common/formattext.ts" />
/// <reference path="../common/teamcolor.ts" />
/// <reference path="../rating_emblem.ts" />
var PopupSeasonStats;
(function (PopupSeasonStats) {
    const _m_cp = $.GetContextPanel();
    const _m_spiderGraph = $('#id-wins-spider-graph');
    let _m_seasonId;
    let _m_timeoutHandle;
    let _m_elSelectedMap;
    let _m_selectedGridStat;
    function Init() {
        let seasonid = $.GetContextPanel().GetAttributeString('seasonid', '') ? parseInt($.GetContextPanel().GetAttributeString('seasonid', '')) : -1;
        if (seasonid < 1) {
            ClosePopup();
            return;
        }
        _ReadyForDisplay();
    }
    PopupSeasonStats.Init = Init;
    function _ReadyForDisplay() {
        if (!MyPersonaAPI.IsConnectedToGC()) {
            ClosePopup();
            return;
        }
        let seasonid = $.GetContextPanel().GetAttributeString('seasonid', '') ? parseInt($.GetContextPanel().GetAttributeString('seasonid', '')) : -1;
        if (seasonid < 1) {
            return;
        }
        _m_seasonId = seasonid;
        _m_cp.SetHasClass('season-' + _m_seasonId, true);
        _UpdateSeasonData(seasonid);
    }
    function _UpdateSeasonData(seasonid) {
        if (seasonid !== _m_seasonId) {
            ClosePopup();
            return;
        }
        let seasonData = TournamentsAPI.GetPremierSeasonSummaryJSO(seasonid);
        if (!seasonData) {
            _CancelWaitForCallBack();
            _m_timeoutHandle = $.Schedule(5, () => {
                _TimeoutPopup();
            });
        }
        else {
            _CancelWaitForCallBack();
            _SetModelPanel();
            _SetGlobalStats(seasonData);
            _SetUpPerMapStats(seasonData);
            _SetUpStatsPanelTypeButtons();
            _SetUpSpiderGraph(seasonData);
            _SetRank(seasonData);
            $.Schedule(.25, () => { _m_cp.SetHasClass('stats-loaded', true); });
        }
    }
    function _UnreadyForDisplay() {
    }
    function ClosePopup() {
        $.DispatchEvent('CSGOPlaySoundEffect', 'inventory_inspect_close', 'MOUSE');
        _m_cp.SetReadyForDisplay(false);
        UiToolkitAPI.HideCustomLayoutTooltip('tooltip-season-rank');
        $.DispatchEvent('UIPopupButtonClicked', '');
        $.DispatchEvent('ContextMenuEvent', '');
        UiToolkitAPI.HideTextTooltip();
    }
    PopupSeasonStats.ClosePopup = ClosePopup;
    function _CancelWaitForCallBack() {
        if (_m_timeoutHandle) {
            $.CancelScheduled(_m_timeoutHandle);
            _m_timeoutHandle = null;
        }
    }
    ;
    function _TimeoutPopup() {
        _CancelWaitForCallBack();
        ClosePopup();
        UiToolkitAPI.ShowGenericPopupOk($.Localize('#SFUI_SteamConnectionErrorTitle'), $.Localize('#SFUI_InvError_Item_Not_Given'), '', function () {
        });
    }
    ;
    function _SetModelPanel() {
        let itemId = $.GetContextPanel().GetAttributeString('itemid', '');
        if (!itemId || !InventoryAPI.IsValidItemID(itemId)) {
            return;
        }
        _m_cp.FindChildInLayoutFile('id-season-medal-model').SetActiveItem(0);
        _m_cp.FindChildInLayoutFile('id-season-medal-model').SetItemItemId(itemId, '');
        _m_cp.FindChildInLayoutFile('id-medal-model-zoom-btn').SetPanelEvent('onactivate', () => {
            $.DispatchEvent("InventoryItemPreview", itemId, '');
            ClosePopup();
        });
    }
    function _SetGlobalStats(seasonData) {
        let oTotals_data_for_display = {
            wins: 0,
            ties: 0,
            losses: 0,
            rounds: 0,
            kills: 0,
            headshots: 0,
            assists: 0,
            deaths: 0,
            mvps: 0,
            rounds_3k: 0,
            rounds_4k: 0,
            rounds_5k: 0,
            map_id: 0,
            map_name: ''
        };
        Object.entries(oTotals_data_for_display).forEach(([key, value]) => {
            if (_IsSimpleStat(key, value)) {
                let total = 0;
                seasonData.data_per_map.forEach(dataPerMap => {
                    let stat = dataPerMap[key];
                    total = stat + total;
                });
                oTotals_data_for_display[key] = total;
                _SetSimpleStat(key, 'id-global-stat-', total);
            }
        });
        _SetKDRatio(_m_cp.FindChildInLayoutFile('id-global-stat-k-d'), oTotals_data_for_display.kills, oTotals_data_for_display.deaths);
        _SetKillPerRound(_m_cp.FindChildInLayoutFile('id-global-stat-kpr'), oTotals_data_for_display.kills, oTotals_data_for_display.rounds);
        _SetMatchesPlayed(_m_cp.FindChildInLayoutFile('id-global-stat-matches-played'), oTotals_data_for_display.wins, oTotals_data_for_display.losses, oTotals_data_for_display.ties);
        _SetWinPercentStat(_m_cp.FindChildInLayoutFile('id-global-stat-win-percent'), oTotals_data_for_display.wins, oTotals_data_for_display.losses, oTotals_data_for_display.ties);
        _SetHeadshotPercentStat(_m_cp.FindChildInLayoutFile('id-global-stat-hs-percent'), oTotals_data_for_display.headshots, oTotals_data_for_display.kills);
        let elBar = _m_cp.FindChildInLayoutFile('id-global-bar-container');
        _SetWinsBar(elBar, {
            wins: oTotals_data_for_display.wins,
            ties: oTotals_data_for_display.ties,
            losses: oTotals_data_for_display.losses
        });
        $.Schedule(.5, () => {
            _PositionTiesLabel(_m_cp.FindChildInLayoutFile('id-global-stat-ties'), elBar.FindChild('id-bar-ties'), oTotals_data_for_display.ties);
        });
    }
    ;
    function _IsSimpleStat(key, value) {
        return key !== 'map_name' && key !== 'map_id' && typeof value === 'number';
    }
    function _SetSimpleStat(statName, prefix, value, mapStatPanel = null) {
        let elStat = mapStatPanel && mapStatPanel.IsValid() ?
            mapStatPanel.FindChildInLayoutFile(prefix + statName) :
            _m_cp.FindChildInLayoutFile(prefix + statName);
        if (elStat && elStat.IsValid()) {
            if (elStat.FindChild('stat-title')) {
                elStat.SetDialogVariable('stat-title', $.Localize('#season_stat_title_' + statName));
            }
            if (elStat.FindChild('stat-icon')) {
                elStat.FindChild('stat-icon').SetImage('file://{images}/icons/ui/stat_' + statName + '.svg');
            }
            var displayValue = FormatText.FormatNumberToNiceString(value, 0);
            elStat.SetDialogVariable('stat-value', displayValue);
        }
    }
    function _SetKillPerRound(elStat, kills, rounds) {
        let nStatKPR = ((kills / Math.max(1, rounds)).toFixed(3));
        elStat.Data().value = nStatKPR;
        elStat.SetDialogVariable('stat-title', $.Localize('#season_stat_title_kpr'));
        elStat.SetDialogVariable('stat-value', nStatKPR);
    }
    function _SetKDRatio(elStat, kills, deaths) {
        let nStat = ((kills / Math.max(1, deaths))).toFixed(3);
        elStat.Data().value = nStat;
        elStat.SetDialogVariable('stat-title', $.Localize('#season_stat_title_kd'));
        elStat.SetDialogVariable('kdratio', nStat);
        elStat.FindChild('stat-value').text = $.Localize('#season_stat_value_kd', elStat);
    }
    function _SetMatchesPlayed(elStat, wins, losses, ties) {
        let nStatMatchesTotal = (wins + losses + ties);
        elStat.Data().value = nStatMatchesTotal;
        elStat.SetDialogVariable('stat-title', $.Localize('#season_stat_title_matches_played'));
        elStat.SetDialogVariable('stat-value', FormatText.FormatNumberToNiceString(nStatMatchesTotal, 0));
    }
    function _SetWinPercentStat(elStat, wins, losses, ties) {
        let nWinPercent = ((wins / Math.max(1, losses + wins + ties)) * 100).toFixed(1);
        elStat.Data().value = nWinPercent;
        elStat.SetDialogVariable('stat-title', $.Localize('#season_stat_title_win_percent'));
        elStat.SetDialogVariable('win-percent', nWinPercent);
        elStat.FindChild('stat-value').text = $.Localize('#season_stat_value_win_percent', elStat);
    }
    function _SetHeadshotPercentStat(elStat, headshots, kills) {
        let nHsPercent = ((headshots / kills) * 100).toFixed(1);
        elStat.Data().value = nHsPercent;
        elStat.SetDialogVariable('stat-title', $.Localize('#season_stat_title_hs_percent'));
        elStat.SetDialogVariable('hs-percent', nHsPercent);
        elStat.FindChild('stat-value').text = $.Localize('#season_stat_value_hs_percent', elStat);
        if (elStat.FindChild('stat-icon')) {
            elStat.FindChild('stat-icon').SetImage('file://{images}/icons/ui/stat_headshots.svg');
        }
    }
    function _SetWinsBar(elBarContainer, oData) {
        const totalValue = (oData.wins + oData.ties + oData.losses);
        elBarContainer.FindChildInLayoutFile('id-bar-wins').style.width = Math.ceil((oData.wins / totalValue) * 100).toString() + '%';
        elBarContainer.FindChildInLayoutFile('id-bar-losses').style.width = Math.ceil((oData.losses / totalValue) * 100).toString() + '%';
        elBarContainer.FindChildInLayoutFile('id-bar-ties').style.width = Math.ceil((oData.ties / totalValue) * 100).toString() + '%';
    }
    function _PositionTiesLabel(elTies, elTiesBar, nTies) {
        elTies.visible = nTies > 0;
        if (nTies > 0) {
            let nXPos = Math.floor(elTiesBar.actualxoffset / elTiesBar.actualuiscale_x);
            if (nXPos > 1920 || nXPos <= 0) {
                elTies.visible = false;
                return;
            }
            elTies.style.x = nXPos + 'px;';
        }
    }
    function _SetRank(seasonData) {
        let nRank = 0;
        let weekName = '';
        seasonData.data_per_week.forEach(data_per_week => {
            if (data_per_week.rank_id > nRank) {
                nRank = data_per_week.rank_id;
                weekName = data_per_week.week_name;
            }
        });
        const options = {
            root_panel: _m_cp.FindChildInLayoutFile('id-premier-rating'),
            do_fx: true,
            full_details: false,
            rating_type: 'Premier',
            leaderboard_details: { score: nRank },
            local_player: false
        };
        RatingEmblem.SetXuid(options);
        let elStat = _m_cp.FindChildInLayoutFile('id-global-stat-week');
        elStat.SetDialogVariable('stat-title', $.Localize('#season_stat_title_achieved_week'));
        elStat.SetDialogVariable('stat-value', $.Localize(weekName));
    }
    function _SetUpPerMapStats(seasonData) {
        let elBtns = _m_cp.FindChildInLayoutFile('id-stats-per-map-btns');
        let elRows = _m_cp.FindChildInLayoutFile('id-stats-mode-grid-rows');
        let mostPlayedMap = '';
        let mostPlayedMapCount = 0;
        let aMapList = TournamentsAPI.GetPremierSeasonMaps(_m_seasonId).split(',');
        let oEmptyMap = {
            wins: 0,
            ties: 0,
            losses: 0,
            rounds: 0,
            kills: 0,
            headshots: 0,
            assists: 0,
            deaths: 0,
            mvps: 0,
            rounds_3k: 0,
            rounds_4k: 0,
            rounds_5k: 0,
            map_id: 0,
            map_name: ''
        };
        if (elBtns.Children().length < 1) {
            let elHeaderRow = $.CreatePanel('Panel', elRows, 'id-stat-map-row-header');
            elHeaderRow.BLoadLayoutSnippet('grid-row');
            elHeaderRow.SetHasClass('row-header', true);
            _FillOutMapRow(elHeaderRow, oEmptyMap);
            aMapList.forEach((mapName, idx) => {
                let map = seasonData.data_per_map.find(function (element) {
                    return element.map_name === mapName;
                });
                if (map && map.hasOwnProperty('map_name')) {
                    let elBtn = _MakeMapRadioButton(elBtns, map.map_name, true);
                    _MapBtnOnPanelEvents(elBtns, elBtn, map);
                    _MakeMapStatsRow(elRows, map.map_name, map);
                    if ((map.wins + map.losses + map.ties) > mostPlayedMapCount) {
                        mostPlayedMapCount = (map.wins + map.losses + map.ties);
                        mostPlayedMap = map.map_name;
                    }
                }
                else {
                    let elBtn = _MakeMapRadioButton(elBtns, mapName, false);
                    _MapBtnOnPanelEvents(elBtns, elBtn, null);
                    oEmptyMap.map_name = mapName;
                    _MakeMapStatsRow(elRows, mapName, oEmptyMap);
                }
            });
        }
        if (mostPlayedMap) {
            let defaultBtn = elBtns.FindChild('id-stat-map-btn-' + mostPlayedMap);
            defaultBtn.checked = true;
            $.DispatchEvent("Activated", defaultBtn, "mouse");
            let defaultGridStat = elRows.Children()[0].FindChild('id-row-stat-wins');
            defaultGridStat.checked = true;
            $.DispatchEvent("Activated", defaultGridStat, "mouse");
        }
    }
    function _MakeMapRadioButton(elBtns, mapName, isEnabled) {
        let elBtn = $.CreatePanel('RadioButton', elBtns, 'id-stat-map-btn-' + mapName, {
            text: $.Localize('#SFUI_Map_' + mapName),
            class: 'stats-panel-map-btn',
            group: 'stat-maps'
        });
        let btnImg = $.CreatePanel('Image', elBtn, '', { textureheight: '48px', texturewidth: '-1' });
        btnImg.SetImage("file://{images}/map_icons/map_icon_" + mapName + ".svg");
        elBtn.enabled = isEnabled;
        return elBtn;
    }
    function _MapBtnOnPanelEvents(elBtns, elBtn, map) {
        if (!map) {
            elBtn.SetPanelEvent('onmouseover', () => {
                UiToolkitAPI.ShowTextTooltip(elBtn.id, '#tooltip-no-map-stats');
            });
            elBtn.SetPanelEvent('onmouseout', () => { UiToolkitAPI.HideTextTooltip(); });
            return;
        }
        let elStatsPanelsParent = _m_cp.FindChildInLayoutFile('id-stats-panel-all-maps-container');
        let prefixMapStatPanel = 'id-stat-map-stats-';
        elBtn.SetPanelEvent('onactivate', () => {
            let elPanel = elStatsPanelsParent.FindChild(prefixMapStatPanel + map.map_name);
            if (!elPanel) {
                elPanel = $.CreatePanel('Panel', elStatsPanelsParent, prefixMapStatPanel + map.map_name);
                elPanel.BLoadLayoutSnippet('single-map-stats');
                elPanel.style.backgroundImage = 'url("file://{images}/map_icons/screenshots/360p/' + map.map_name + '.png")';
                elPanel.style.backgroundPosition = '50% 50%';
                elPanel.style.backgroundSize = 'clip_then_cover';
                elPanel.style.backgroundImgOpacity = '.035';
                _FillOutPerMapStats(elPanel, map);
            }
            let aBtns = elBtns.Children();
            aBtns.forEach(element => { element.hittest = false; });
            if (_m_elSelectedMap && _m_elSelectedMap.IsValid() && _m_elSelectedMap !== elPanel) {
                _m_elSelectedMap.SwitchClass('show-page', 'map-hide');
            }
            if (_m_elSelectedMap !== elPanel) {
                elPanel.SwitchClass('show-page', 'map-reset');
            }
            $.Schedule(.16, () => {
                elPanel?.SwitchClass('show-page', 'map-selected');
                aBtns.forEach(element => { element.hittest = true; });
            });
            _m_elSelectedMap = elPanel;
        });
    }
    function _MakeMapStatsRow(elRows, mapName, map) {
        let elRow = $.CreatePanel('Panel', elRows, 'id-stat-map-row-' + mapName);
        elRow.BLoadLayoutSnippet('grid-row');
        _FillOutMapRow(elRow, map);
    }
    function _FillOutPerMapStats(elPanel, mapData) {
        Object.entries(mapData).forEach(([key, value]) => {
            if (_IsSimpleStat(key, value)) {
                _SetSimpleStat(key, 'id-map-stat-', value, elPanel);
            }
        });
        _SetMatchesPlayed(elPanel.FindChildInLayoutFile('id-map-stat-matches-played'), mapData.wins, mapData.losses, mapData.ties);
        _SetWinPercentStat(elPanel.FindChildInLayoutFile('id-map-stat-win-percent'), mapData.wins, mapData.losses, mapData.ties);
        _SetKDRatio(elPanel.FindChildInLayoutFile('id-map-stat-k-d'), mapData.kills, mapData.deaths);
        _SetKillPerRound(elPanel.FindChildInLayoutFile('id-map-stat-kpr'), mapData.kills, mapData.rounds);
        _SetHeadshotPercentStat(elPanel.FindChildInLayoutFile('id-map-stat-hs-percent'), mapData.headshots, mapData.kills);
        let elBar = elPanel.FindChildInLayoutFile('id-bar-container');
        _SetWinsBar(elBar, {
            wins: mapData.wins,
            ties: mapData.ties,
            losses: mapData.losses
        });
        let elTies = elPanel.FindChildInLayoutFile('id-map-stat-ties');
        elTies.visible = false;
        $.Schedule(.8, () => {
            _PositionTiesLabel(elTies, elBar.FindChild('id-bar-ties'), mapData.ties);
        });
    }
    function _SetUpStatsPanelTypeButtons() {
        _m_cp.FindChildInLayoutFile('id-stats-mode-row-btn').SetPanelEvent('onactivate', () => {
            _ShowStatsPanelType('row');
            _m_cp.FindChildInLayoutFile('id-map-stats-header').visible = true;
        });
        _m_cp.FindChildInLayoutFile('id-stats-mode-grid-btn').SetPanelEvent('onactivate', () => {
            _ShowStatsPanelType('grid');
            _m_cp.FindChildInLayoutFile('id-map-stats-header').visible = false;
        });
        $.DispatchEvent("Activated", _m_cp.FindChildInLayoutFile('id-stats-mode-row-btn'), "mouse");
    }
    function _ShowStatsPanelType(type) {
        let elGridPanel = _m_cp.FindChildInLayoutFile('id-stats-mode-grid');
        let elRowPanel = _m_cp.FindChildInLayoutFile('id-stats-mode-row');
        elGridPanel.SetHasClass('show', type === 'grid');
        elRowPanel.SetHasClass('show', type === 'row');
    }
    function _FillOutMapRow(elRow, mapData) {
        let isHeader = mapData.map_id === 0 && mapData.map_name == '';
        let hasNoData = mapData.map_id === 0 && mapData.map_name !== '';
        Object.entries(mapData).forEach(([key, value]) => {
            if (_IsSimpleStat(key, value)) {
                if (key !== 'headshots') {
                    if (!isHeader) {
                        _CreateRowEntry(elRow, 'Panel', 'id-row-stat-', key, value);
                        if (!hasNoData)
                            _SetSimpleStat(key, 'id-row-stat-', value, elRow);
                    }
                    else {
                        _CreateRowEntry(elRow, 'RadioButton', 'id-row-stat-', key, value);
                        elRow.FindChild('id-row-stat-' + key).SetDialogVariable('stat-value', $.Localize('#season_stat_title_' + key));
                    }
                }
            }
        });
        let elEntry;
        let panelType = isHeader ? 'RadioButton' : 'Panel';
        elEntry = _CreateRowEntry(elRow, panelType, 'id-row-stat-', 'matches-played');
        elEntry = _CreateRowEntry(elRow, panelType, 'id-row-stat-', 'win-percent');
        elEntry = _CreateRowEntry(elRow, panelType, 'id-row-stat-', 'k-d');
        elEntry = _CreateRowEntry(elRow, panelType, 'id-row-stat-', 'kpr');
        elEntry = _CreateRowEntry(elRow, panelType, 'id-row-stat-', 'hs-percent');
        _MoveEntryToCorrectPosition(elRow);
        if (!isHeader) {
            elRow.FindChildInLayoutFile('map-icon').SetImage("file://{images}/map_icons/map_icon_" + mapData.map_name + ".svg");
            let aEntries = elRow?.Children();
            aEntries?.[1].SetHasClass('has-mask', true);
            aEntries?.[aEntries.length - 1].SetHasClass('has-mask-reverse', true);
            if (hasNoData) {
                elRow.SetDialogVariable('stat-value', '-');
                elRow.Data().isEmpty = true;
                return;
            }
            _SetMatchesPlayed(elRow.FindChildInLayoutFile('id-row-stat-matches-played'), mapData.wins, mapData.losses, mapData.ties);
            _SetWinPercentStat(elRow.FindChildInLayoutFile('id-row-stat-win-percent'), mapData.wins, mapData.losses, mapData.ties);
            _SetKDRatio(elRow.FindChildInLayoutFile('id-row-stat-k-d'), mapData.kills, mapData.deaths);
            _SetKillPerRound(elRow.FindChildInLayoutFile('id-row-stat-kpr'), mapData.kills, mapData.rounds);
            _SetHeadshotPercentStat(elRow.FindChildInLayoutFile('id-row-stat-hs-percent'), mapData.headshots, mapData.kills);
        }
        else {
            elRow.FindChild('id-row-stat-matches-played').SetDialogVariable('stat-value', $.Localize('#season_stat_title_matches_played'));
            elRow.FindChild('id-row-stat-win-percent').SetDialogVariable('stat-value', $.Localize('#season_stat_title_win_percent'));
            elRow.FindChild('id-row-stat-k-d').SetDialogVariable('stat-value', $.Localize('#season_stat_title_kd'));
            elRow.FindChild('id-row-stat-kpr').SetDialogVariable('stat-value', $.Localize('#season_stat_title_kpr'));
            elRow.FindChild('id-row-stat-hs-percent').SetDialogVariable('stat-value', $.Localize('#season_stat_title_hs_percent'));
        }
    }
    function _CreateRowEntry(elRow, type, prefix, key, value = -1) {
        let elEntry;
        if (type === 'Panel') {
            elEntry = $.CreatePanel('Panel', elRow, prefix + key);
            elEntry.BLoadLayoutSnippet('grid-row-entry');
            elEntry.Data().value = value > 0 ? value : 0;
            elEntry.Data().key = key;
        }
        else {
            elEntry = $.CreatePanel('RadioButton', elRow, prefix + key, { group: 'row-sort-btn' });
            elEntry.BLoadLayoutSnippet('grid-row-entry');
            elEntry.Data().key = key;
            elEntry.SetPanelEvent('onactivate', () => {
                if (!_m_selectedGridStat || _m_selectedGridStat !== elEntry) {
                    let elParent = elRow.GetParent();
                    let aRows = elParent.Children();
                    aRows.slice(1);
                    let aNewSort = _SortRows(aRows, prefix, key);
                    aNewSort.forEach((row, idx) => {
                        elParent.MoveChildAfter(row, elParent.Children()[0]);
                        row.Children().forEach(entry => {
                            entry.SetHasClass('highlight-entry', entry.Data().key === key);
                        });
                    });
                    elParent.Children().forEach((row, idx) => {
                        row.SetHasClass('no-background', (idx % 2) == 1);
                    });
                    _m_selectedGridStat = elEntry;
                }
            });
        }
        return elEntry;
    }
    function _SortRows(aRows, prefix, key) {
        return aRows.sort((a, b) => {
            if (a.Data().isEmpty) {
                return -1;
            }
            if (key === 'losses' || key === 'deaths') {
                return a.FindChild(prefix + key)?.Data().value > b.FindChild(prefix + key)?.Data().value ? -1 :
                    a.FindChild(prefix + key)?.Data().value < b.FindChild(prefix + key)?.Data().value ? 1 : 0;
            }
            return a.FindChild(prefix + key)?.Data().value < b.FindChild(prefix + key)?.Data().value ? -1 :
                a.FindChild(prefix + key)?.Data().value > b.FindChild(prefix + key)?.Data().value ? 1 : 0;
        });
    }
    function _MoveEntryToCorrectPosition(elRow) {
        const aOrder = [
            'matches-played',
            'win-percent',
            'wins',
            'losses',
            'ties',
            'kills',
            'deaths',
            'assists',
            'rounds',
            'k-d',
            'kpr',
            'hs-percent',
            'mvps',
            'rounds_5k',
            'rounds_4k',
            'rounds_3k'
        ];
        let elChildren = elRow.Children();
        for (let i = 0; i < aOrder.length; i++) {
            let elPanel = elRow.FindChild('id-row-stat-' + aOrder[i]);
            if (elPanel && elPanel.IsValid()) {
                if (i == 0) {
                    elRow?.MoveChildAfter(elRow.FindChild('id-row-stat-' + aOrder[i]), elChildren[0]);
                }
                else {
                    elRow?.MoveChildAfter(elRow.FindChild('id-row-stat-' + aOrder[i]), elRow.FindChild('id-row-stat-' + aOrder[i - 1]));
                }
            }
        }
    }
    function _SetUpSpiderGraph(seasonData) {
        if (_m_spiderGraph.BCanvasReady()) {
            _DrawSpiderGraph(seasonData);
            _CreateRanksHistoryGraph(seasonData.data_per_week);
            _CreateMatchesBarGraph(seasonData.data_per_week);
            _m_cp.SetDialogVariableInt('week_min', 1);
            _m_cp.SetDialogVariableInt('week_max', seasonData.data_per_week.length);
        }
        else {
            $.Schedule(0.1, () => { _SetUpSpiderGraph(seasonData); });
        }
    }
    function _DrawSpiderGraph(seasonData) {
        let maxWins = 0;
        let aMapList = TournamentsAPI.GetPremierSeasonMaps(_m_seasonId).split(',');
        var playerWins = {};
        seasonData.data_per_map.forEach(dataPerMap => {
            maxWins = dataPerMap.wins > maxWins ? dataPerMap.wins : maxWins;
            playerWins[dataPerMap.map_name] = dataPerMap.wins;
        });
        _DrawSpiderGraphGuides(maxWins, aMapList.length);
        let winsForDisplay = aMapList.map((map_name) => { return map_name.startsWith('de_') ? Number(playerWins[map_name] | 0) : 0; });
        _DrawSpiderGraphPlayerPlot(winsForDisplay, maxWins);
        _MakeSpiderGraphMapPanels(aMapList);
    }
    function _DrawSpiderGraphGuides(maxWins, numMaps) {
        _m_spiderGraph.ClearJS('rgba(0,0,0,0)');
        const options = {
            bkg_color: "#00000090",
            spokes_color: '#27628581',
            spoke_thickness: 2,
            spoke_softness: 100,
            spoke_length_scale: 1.2,
            guideline_color: '#1b455e62',
            guideline_thickness: 2,
            guideline_softness: 100,
            guideline_count: maxWins > 20 ? 20 : maxWins + 1,
            deadzone_percent: 0.03,
            scale: 0.68
        };
        _m_spiderGraph.SetGraphOptions(options);
        _m_spiderGraph.DrawGraphBackground(numMaps);
    }
    function _DrawSpiderGraphPlayerPlot(arrValues, max) {
        const teamColorIdx = PartyListAPI.GetPartyMemberSetting(MyPersonaAPI.GetXuid(), 'game/teamcolor');
        const teamColorRgb = TeamColor.GetTeamColor(Number(teamColorIdx));
        let rgbColorLine = 'rgba(' + teamColorRgb + ',' + '1' + ')';
        let rgbColorInner = 'rgba(' + teamColorRgb + ',' + '.1' + ')';
        let rgbColorOuter = 'rgba(' + teamColorRgb + ',' + '.2' + ')';
        arrValues = arrValues.map(a => a / max);
        const options = {
            line_color: rgbColorLine,
            line_thickness: 3,
            line_softness: 10,
            fill_color_inner: rgbColorInner,
            fill_color_outer: rgbColorOuter,
        };
        _m_spiderGraph.DrawGraphPoly(arrValues, options);
    }
    function _MakeSpiderGraphMapPanels(arrMaps) {
        let elMapContainer = _m_spiderGraph;
        elMapContainer.RemoveAndDeleteChildren();
        for (let s = 0; s < arrMaps.length; s++) {
            let elMap = $.CreatePanel('Panel', elMapContainer, String(s));
            elMap.BLoadLayoutSnippet('snippet-mwr-map');
            let elMapImage = elMap.FindChildInLayoutFile('mwr-map__image');
            let imageName = arrMaps[s];
            elMapImage.SetImage('file://{images}/map_icons/map_icon_' + imageName + ".svg");
            elMapImage.style.backgroundPosition = '50% 50%';
            elMapImage.style.backgroundSize = 'auto 150%';
            elMap.style.flowChildren = 'up';
            elMap.SetDialogVariable('map-name', $.Localize('#SFUI_Map_' + imageName));
            let vPos = _m_spiderGraph.GraphPositionToUIPosition(s, 1.3);
            elMap.SetPositionInPixels(vPos.x, vPos.y, 0);
        }
    }
    function _CreateRanksHistoryGraph(aDataPerWeek) {
        const lineGraph = $('#id-rank-history-line-graph');
        let aRankData = [];
        let aWeeks = [];
        let aWeekNames = [];
        let minRank = 0;
        let maxRank = 0;
        aDataPerWeek.forEach((week, idx) => {
            aRankData.push(week.rank_id);
            aWeeks.push(idx);
            aWeekNames.push(week.week_name);
            if (week.rank_id > 0) {
                if (minRank <= 0)
                    minRank = week.rank_id;
                if (week.rank_id < minRank)
                    minRank = week.rank_id;
                if (maxRank <= 0)
                    maxRank = week.rank_id;
                if (week.rank_id > maxRank)
                    maxRank = week.rank_id;
            }
        });
        if (minRank > 0)
            minRank = Math.floor(minRank / 5000) * 5000;
        maxRank = Math.ceil(maxRank / 5000) * 5000;
        if (maxRank <= minRank) {
            if (minRank > 0)
                minRank -= 5000;
            else
                maxRank += 5000;
        }
        const xvals = aWeeks;
        const yvals = aRankData;
        const options = {
            draw_guidelines: true,
            guideline_color: "#1b48638a",
            guideline_thick: 2,
            guideline_soft: 1,
            guideline_count: 5,
            line_color: "#68B5DF",
            line_thickness: 2,
            line_softness: 1,
            draw_points: true,
            point_size: 3,
            point_color: "#68B5DF",
            yaxis_min: minRank,
            yaxis_max: maxRank,
            yaxis_interp: 0,
            xaxis_centroidcoords: true,
            gradient_color: "#42619133;",
        };
        lineGraph.SetGraphOptions(options);
        lineGraph.SetData(xvals, yvals);
        lineGraph.Show();
        _AddYAxisRanks(lineGraph);
        _MakeDots(lineGraph, aWeekNames.filter((word, index) => aRankData[index] !== 0), aWeeks.filter((word, index) => aRankData[index] !== 0), aRankData.filter(rank => rank !== 0));
    }
    function _AddYAxisRanks(lineGraph) {
        const guidelineYPositions = lineGraph.GetGuidelinePositions();
        guidelineYPositions.forEach((posData, index) => {
            let elParent = _m_cp.FindChildInLayoutFile('id-line-graph-y-axis');
            let elRating = $.CreatePanel('Panel', elParent, 'id-rating-y-' + posData.x);
            elRating.BLoadLayout('file://{resources}/layout/rating_emblem.xml', false, false);
            elRating.SetHasClass('y-axis-premier-rating', true);
            const options = {
                root_panel: elRating,
                do_fx: false,
                full_details: false,
                rating_type: 'Premier',
                leaderboard_details: { score: posData.x },
                local_player: false
            };
            RatingEmblem.SetXuid(options);
            elRating.style.y = posData.y + 'px;';
        });
    }
    function _MakeDots(lineGraph, aWeekNames, aWeeks, aRanks) {
        const pointPositions = lineGraph.GetDataPointPositions();
        let highestRank = Math.max(...aRanks);
        pointPositions.forEach((posData, index) => {
            let elPoint = $.CreatePanel('Panel', lineGraph, 'id-point-' + index, { class: 'stats-rank-line-graph-dot' });
            elPoint.style.x = posData.x + 'px;';
            elPoint.style.y = posData.y + 'px;';
            elPoint.SetHasClass('highest-rank', highestRank === aRanks[index]);
            elPoint.SetPanelEvent('onmouseover', () => {
                UiToolkitAPI.ShowCustomLayoutParametersTooltip(elPoint.id, 'tooltip-season-rank', 'file://{resources}/layout/tooltips/tooltip_stat_season_rank.xml', 'rank=' + aRanks[index].toString() + '&' +
                    'week_name=' + aWeekNames[index] + '&' +
                    'week_idx=' + (aWeeks[index] + 1));
            });
            elPoint.SetPanelEvent('onmouseout', () => {
                UiToolkitAPI.HideCustomLayoutTooltip('tooltip-season-rank');
            });
        });
    }
    function _CreateMatchesBarGraph(aDataPerWeek) {
        const barGraph = $('#stats-panel-matches-bar-graph');
        const textHeight = 15;
        const graphHeight = (barGraph.actuallayoutheight / barGraph.actualuiscale_y) - textHeight;
        const graphWidth = (barGraph.actuallayoutwidth / barGraph.actualuiscale_x);
        let maxMatches = 0;
        aDataPerWeek.forEach((week) => {
            maxMatches = week.matches_played > maxMatches ? week.matches_played : maxMatches;
        });
        let singleMatchHeight = maxMatches > 10 ? graphHeight / maxMatches : 10;
        let singleMatchWidth = graphWidth / aDataPerWeek.length;
        aDataPerWeek.forEach((week, idx) => {
            let elBar = barGraph.FindChild('id-weekly-bar-' + week.week_id);
            if (!elBar && week.matches_played > 0) {
                elBar = $.CreatePanel('Panel', barGraph, 'id-weekly-bar-' + week.week_id);
                elBar.BLoadLayoutSnippet('graph-bar');
                elBar.FindChild('id-bar-inner').style.height = (singleMatchHeight * week.matches_played) + 'px';
                elBar.style.x = (singleMatchWidth * idx) + 'px';
                elBar.SetDialogVariableInt('num-matches', week.matches_played);
                elBar.SetHasClass('angle-text', maxMatches > 99);
                elBar.SetPanelEvent('onmouseover', () => {
                    UiToolkitAPI.ShowCustomLayoutParametersTooltip(elBar.id, 'tooltip-season-rank', 'file://{resources}/layout/tooltips/tooltip_stat_season_rank.xml', 'rank=' + '&' +
                        'week_name=' + week.week_name + '&' +
                        'week_idx=' + (idx + 1));
                });
                elBar.SetPanelEvent('onmouseout', () => {
                    UiToolkitAPI.HideCustomLayoutTooltip('tooltip-season-rank');
                });
            }
        });
    }
    {
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_GcLogonNotificationReceived', _ReadyForDisplay);
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_UpdateConnectionToGC', _ReadyForDisplay);
        $.RegisterForUnhandledEvent('PanoramaComponent_Tournaments_PremierSeasonSummaryReceived', _UpdateSeasonData);
        $.RegisterEventHandler('ReadyForDisplay', _m_cp, _ReadyForDisplay);
        $.RegisterEventHandler('UnreadyForDisplay', _m_cp, _UnreadyForDisplay);
    }
})(PopupSeasonStats || (PopupSeasonStats = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfc2Vhc29uX3N0YXRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvcG9wdXBzL3BvcHVwX3NlYXNvbl9zdGF0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBQ3JDLGdEQUFnRDtBQUNoRCwrQ0FBK0M7QUFDL0MsNENBQTRDO0FBRTVDLElBQVUsZ0JBQWdCLENBNmdDekI7QUE3Z0NELFdBQVUsZ0JBQWdCO0lBRXpCLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztJQUMvQixNQUFNLGNBQWMsR0FBRyxDQUFDLENBQUUsdUJBQXVCLENBQW1CLENBQUM7SUFDckUsSUFBSSxXQUFrQixDQUFDO0lBQ3ZCLElBQUksZ0JBQStCLENBQUM7SUFDcEMsSUFBSSxnQkFBeUIsQ0FBQztJQUM5QixJQUFJLG1CQUFtQyxDQUFDO0lBRXhDLFNBQWdCLElBQUk7UUFHaEIsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGtCQUFrQixDQUFFLFVBQVUsRUFBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFFLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxVQUFVLEVBQUcsRUFBRSxDQUFDLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFcEosSUFBSSxRQUFRLEdBQUcsQ0FBQyxFQUNoQjtZQUNJLFVBQVUsRUFBRSxDQUFDO1lBQ3RCLE9BQU87U0FDRDtRQUVELGdCQUFnQixFQUFFLENBQUM7SUFDdkIsQ0FBQztJQVplLHFCQUFJLE9BWW5CLENBQUE7SUFFRCxTQUFTLGdCQUFnQjtRQUczQixJQUFLLENBQUMsWUFBWSxDQUFDLGVBQWUsRUFBRSxFQUNwQztZQUNVLFVBQVUsRUFBRSxDQUFDO1lBQ3RCLE9BQU87U0FDUDtRQUVLLElBQUksUUFBUSxH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