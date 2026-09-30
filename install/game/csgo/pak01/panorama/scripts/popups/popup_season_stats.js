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
        // Set Event id for the hub since you can eventually open it for past events
        let seasonid = $.GetContextPanel().GetAttributeString('seasonid', '') ? parseInt($.GetContextPanel().GetAttributeString('seasonid', '')) : -1;
        if (seasonid < 1) {
            ClosePopup();
            return;
        }
        _ReadyForDisplay();
    }
    PopupSeasonStats.Init = Init;
    function _ReadyForDisplay() {
        $.Msg('PopupSeasonStats ReadyForDisplay: ' + _m_cp.id);
        if (!MyPersonaAPI.IsConnectedToGC()) {
            ClosePopup();
            return;
        }
        let seasonid = $.GetContextPanel().GetAttributeString('seasonid', '') ? parseInt($.GetContextPanel().GetAttributeString('seasonid', '')) : -1;
        if (seasonid < 1) {
            //Don't  close.  the Init fires on panel load a little later.
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
            // start timer
            _CancelWaitForCallBack();
            _m_timeoutHandle = $.Schedule(5, () => {
                // do loading styles in here
                _TimeoutPopup();
                $.Msg('loading');
            });
        }
        else {
            // Cancel timer
            _CancelWaitForCallBack();
            _SetModelPanel();
            _SetGlobalStats(seasonData);
            _SetUpPerMapStats(seasonData);
            _SetUpStatsPanelTypeButtons();
            _SetUpSpiderGraph(seasonData);
            _SetRank(seasonData);
            $.Schedule(.25, () => { _m_cp.SetHasClass('stats-loaded', true); });
            $.Msg('loaded');
        }
    }
    function _UnreadyForDisplay() {
        $.Msg('PopupSeasonStats UnReadyForDisplay: ' + _m_cp.id);
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
            $.Msg('CancelScheduled');
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
                $.Msg('stat: ' + key);
                let total = 0;
                seasonData.data_per_map.forEach(dataPerMap => {
                    let stat = dataPerMap[key];
                    total = stat + total;
                    // $.Msg( '_SetGlobalStats-'+dataPerMap.map_name +': ' +  key +', stat: ' + stat + ', total:' + total );
                });
                oTotals_data_for_display[key] = total;
                // Set all the stats that map directly to the global stats
                _SetSimpleStat(key, 'id-global-stat-', total);
            }
        });
        //Set calculated stats
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
            // let elParent = elTiesBar.GetParent();
            // let parentWidth = elParent.actuallayoutwidth / elParent.actualuiscale_x;
            let nXPos = Math.floor(elTiesBar.actualxoffset / elTiesBar.actualuiscale_x);
            if (nXPos > 1920 || nXPos <= 0) // wider then the screen then just don't show
             {
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
        // no btns exist
        if (elBtns.Children().length < 1) {
            // Create headers for grid view before we loop through per map data
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
        // make rows for grid since we are iterating over the same data
        let elRow = $.CreatePanel('Panel', elRows, 'id-stat-map-row-' + mapName);
        elRow.BLoadLayoutSnippet('grid-row');
        _FillOutMapRow(elRow, map);
    }
    function _FillOutPerMapStats(elPanel, mapData) {
        Object.entries(mapData).forEach(([key, value]) => {
            if (_IsSimpleStat(key, value)) {
                // Set all the stats that map directly to the global stats
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
            // Value is saved on entry when we calculate this specific stats.
            _SetMatchesPlayed(elRow.FindChildInLayoutFile('id-row-stat-matches-played'), mapData.wins, mapData.losses, mapData.ties);
            _SetWinPercentStat(elRow.FindChildInLayoutFile('id-row-stat-win-percent'), mapData.wins, mapData.losses, mapData.ties);
            _SetKDRatio(elRow.FindChildInLayoutFile('id-row-stat-k-d'), mapData.kills, mapData.deaths);
            _SetKillPerRound(elRow.FindChildInLayoutFile('id-row-stat-kpr'), mapData.kills, mapData.rounds);
            _SetHeadshotPercentStat(elRow.FindChildInLayoutFile('id-row-stat-hs-percent'), mapData.headshots, mapData.kills);
        }
        else {
            // Header titles.
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
                    $.Msg('MoveChildAfter:' + i + '-1:' + aOrder[i - 1]);
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
        // make sure to add zero for maps that we don't have data for
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
            // spoof all points: aRankData.push( ( week.rank_id > 0 ) ? week.rank_id : 5000 + ( idx + 1 ) * 100 );
            aWeeks.push(idx);
            aWeekNames.push(week.week_name);
            // keep track of min/max
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
        // Make sure that "minRank" is on the 5,000 boundary below the lowest value
        if (minRank > 0)
            minRank = Math.floor(minRank / 5000) * 5000;
        // Make sure that "maxRank" is on the 5,000 boundary above the highest value
        maxRank = Math.ceil(maxRank / 5000) * 5000;
        if (maxRank <= minRank) {
            if (minRank > 0)
                minRank -= 5000;
            else
                maxRank += 5000;
        }
        // Make sure that the halfway line will go at proper 5,000 increment
        // if ( ( maxRank - minRank ) % 10000 != 0 )
        // {
        //     if ( minRank > 0 ) minRank -= 5000;
        //     else maxRank += 5000;
        // }
        //
        // Build the graph
        //
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
        // const graphY = lineGraph.actualyoffset / lineGraph.actualuiscale_y;
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
        $.Msg(pointPositions);
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
    // min 20 total wins, min  lowest map 10  // 1/7
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_GcLogonNotificationReceived', _ReadyForDisplay);
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_UpdateConnectionToGC', _ReadyForDisplay);
        $.RegisterForUnhandledEvent('PanoramaComponent_Tournaments_PremierSeasonSummaryReceived', _UpdateSeasonData);
        $.RegisterEventHandler('ReadyForDisplay', _m_cp, _ReadyForDisplay);
        $.RegisterEventHandler('UnreadyForDisplay', _m_cp, _UnreadyForDisplay);
    }
})(PopupSeasonStats || (PopupSeasonStats = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfc2Vhc29uX3N0YXRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvcG9wdXBzL3BvcHVwX3NlYXNvbl9zdGF0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBQ3JDLGdEQUFnRDtBQUNoRCwrQ0FBK0M7QUFDL0MsNENBQTRDO0FBRTVDLElBQVUsZ0JBQWdCLENBNmdDekI7QUE3Z0NELFdBQVUsZ0JBQWdCO0lBRXpCLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztJQUMvQixNQUFNLGNBQWMsR0FBRyxDQUFDLENBQUUsdUJBQXVCLENBQW1CLENBQUM7SUFDckUsSUFBSSxXQUFrQixDQUFDO0lBQ3ZCLElBQUksZ0JBQStCLENBQUM7SUFDcEMsSUFBSSxnQkFBeUIsQ0FBQztJQUM5QixJQUFJLG1CQUFtQyxDQUFDO0lBRXhDLFNBQWdCLElBQUk7UUFFaEIsNEVBQTRFO1FBQzVFLElBQUksUUFBUSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxVQUFVLEVBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsa0JBQWtCLENBQUUsVUFBVSxFQUFHLEVBQUUsQ0FBQyxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRXBKLElBQUksUUFBUSxHQUFHLENBQUMsRUFDaEI7WUFDSSxVQUFVLEVBQUUsQ0FBQztZQUN0QixPQUFPO1NBQ0Q7UUFFRCxnQkFBZ0IsRUFBRSxDQUFDO0lBQ3ZCLENBQUM7SUFaZSxxQkFBSSxPQVluQixDQUFBO0lBRUQsU0FBUyxnQkFBZ0I7UUFFM0IsQ0FBQyxDQUFDLEdBQUcsQ0FBRSxvQ0FBb0MsR0FBRyxLQUFLLENBQUMsRUFBRSxDQUFFLENBQUM7UUFDekQsSUFBSyxDQUFDLFlB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