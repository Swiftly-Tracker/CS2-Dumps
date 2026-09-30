"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/formattext.ts" />
/// <reference path="mock_adapter.ts" />
/// <reference path="endofmatch.ts" />
var EOM_Voting;
(function (EOM_Voting) {
    const _m_cP = $('#eom-voting');
    const _m_elVoteItemPanels = {};
    let _m_updateJob = undefined;
    let m_randIdx = 0;
    function _DisplayMe() {
        if (!_m_cP || !_m_cP.IsValid())
            return;
        if (GameStateAPI.IsDemoOrHltv())
            return false;
        // time
        const oTime = MockAdapter.GetTimeDataJSO();
        if (!oTime)
            return false;
        $.RegisterForUnhandledEvent('EndOfMatch_Shutdown', _CancelUpdateJob);
        // populate vote options
        const oMatchEndVoteData = MockAdapter.NextMatchVotingData(_m_cP);
        $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.submenu_leveloptions_slidein', 'MOUSE');
        if (!oMatchEndVoteData || !oMatchEndVoteData.voting_options)
            return false;
        const elMapSelectionList = _m_cP.FindChildInLayoutFile('id-map-selection-list');
        // create buttons for the different options
        Object.keys(oMatchEndVoteData.voting_options).forEach((key, index) => {
            const type = oMatchEndVoteData.voting_options[key].type;
            // separator
            if (type == "separator") {
                // $$$REI we have 2 separator types, 'blank' and 'switch mode', do you want to do anything different for those?
                const elVoteItem = $.CreatePanel("Panel", elMapSelectionList, "");
                elVoteItem.AddClass("vote-item--separator");
            }
            else {
                let text = '';
                const elVoteItem = $.CreatePanel("RadioButton", elMapSelectionList, "id-vote-item--" + key);
                elVoteItem.BLoadLayoutSnippet("MapGroupSelection");
                elVoteItem.Data().m_key = key;
                if (type == "skirmish") {
                    const skirmishId = oMatchEndVoteData.voting_options[key].id;
                    text = $.Localize(GameTypesAPI.GetSkirmishName(skirmishId));
                    const cfg = GameTypesAPI.GetConfig();
                    if (cfg) {
                        const mg = cfg.mapgroups['mg_skirmish_' + GameTypesAPI.GetSkirmishInternalName(skirmishId)];
                        if (mg) {
                            Object.keys(mg.maps).forEach((map, i) => {
                                const elMapImage = $.CreatePanel('Panel', elVoteItem.FindChildInLayoutFile('MapGroupImagesCarousel'), 'MapSelectionScreenshot' + i);
                                elMapImage.AddClass('map-selection-btn__screenshot');
                                const image = 'url("file://{images}/map_icons/screenshots/360p/' + map + '.png")';
                                if (map in cfg.maps) {
                                    elMapImage.style.backgroundImage = image;
                                    elMapImage.style.backgroundPosition = '50% 0%';
                                    elMapImage.style.backgroundSize = 'auto 100%';
                                }
                            });
                        }
                    }
                    const elMapIcon = elVoteItem.FindChildInLayoutFile("id-map-selection-btn__modeicon");
                    const modeIcon = "file://{images}/icons/ui/" + GameTypesAPI.GetSkrimishIcon(skirmishId) + ".svg";
                    elMapIcon.SetImage(modeIcon);
                    elMapIcon.RemoveClass('hidden');
                }
                else if (type == "map") {
                    const internalName = oMatchEndVoteData.voting_options[key].name;
                    text = GameTypesAPI.GetFriendlyMapName(internalName);
                    let image;
                    const elMapImage = $.CreatePanel('Panel', elVoteItem.FindChildInLayoutFile('MapGroupImagesCarousel'), 'MapSelectionScreenshot');
                    elMapImage.AddClass('map-selection-btn__screenshot');
                    const cfg = GameTypesAPI.GetConfig();
                    if (cfg && ('maps' in cfg) && (internalName in cfg.maps)) {
                        image = 'url("file://{images}/map_icons/screenshots/360p/' + internalName + '.png")';
                    }
                    else {
                        image = 'url("file://{images}/map_icons/screenshots/360p/random.png")';
                    }
                    elMapImage.style.backgroundImage = image;
                    elMapImage.style.backgroundPosition = '50% 0%';
                    elMapImage.style.backgroundSize = 'auto 100%';
                }
                elVoteItem.FindChildTraverse("MapGroupName").text = text;
                elVoteItem.Data().m_name = text;
                // user vote event
                elVoteItem.SetPanelEvent('onactivate', () => {
                    GameInterfaceAPI.ConsoleCommand("endmatch_votenextmap" + " " + elVoteItem.Data().m_key);
                    // disable vote buttons
                    elMapSelectionList.FindChildrenWithClassTraverse("map-selection-btn").forEach(btn => btn.enabled = false);
                    $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.submenu_leveloptions_select', 'MOUSE');
                    $.Msg("VOTED FOR MAP " + elVoteItem.Data().m_key + ":" + elVoteItem.Data().m_name);
                });
                _m_elVoteItemPanels[index] = elVoteItem;
            }
        });
        _UpdateVotes();
        return true;
    }
    function _UpdateVotes() {
        _m_updateJob = undefined;
        // Count
        if (!_m_cP || !_m_cP.IsValid())
            return;
        const oMatchEndVoteData = MockAdapter.NextMatchVotingData(_m_cP);
        if (!oMatchEndVoteData) {
            return;
        }
        function _GetWinningMaps() {
            // find the highest tally
            let arrVoteWinnersKeys = [];
            let highestVote = 0;
            // find the highest vote count
            for (let key of Object.keys(oMatchEndVoteData.voting_options)) {
                const nVotes = oMatchEndVoteData.voting_options[key].votes;
                if (nVotes > highestVote)
                    highestVote = nVotes;
            }
            // identify all of the ties
            for (let key of Object.keys(oMatchEndVoteData.voting_options)) {
                const nVotes = oMatchEndVoteData.voting_options[key].votes;
                if ((nVotes === highestVote) &&
                    (oMatchEndVoteData.voting_options[key].type != 'separator'))
                    arrVoteWinnersKeys.push(key);
            }
            return arrVoteWinnersKeys;
        }
        if (oMatchEndVoteData) {
            // we're done. lock the results
            if (oMatchEndVoteData.voting_done) {
                const elMapSelectionList = _m_cP.FindChildInLayoutFile('id-map-selection-list');
                // disable the buttons
                elMapSelectionList.FindChildrenWithClassTraverse("map-selection-btn").forEach(btn => btn.enabled = false);
                const winner = oMatchEndVoteData["voting_winner"];
                $.Msg("winning map index " + winner);
                if (winner !== -1) {
                    let winningKey = '';
                    for (let key of Object.keys(_m_elVoteItemPanels)) {
                        if (_m_elVoteItemPanels[key].Data().m_key == winner)
                            winningKey = key;
                    }
                    if (winningKey != '' && _m_elVoteItemPanels[winningKey]) {
                        // add the checkmark panel
                        const elCheckmark = _m_elVoteItemPanels[winningKey].FindChildTraverse('id-map-selection-btn__winner');
                        if (!elCheckmark.BHasClass('appear')) {
                            elCheckmark.AddClass("appear");
                            $.DispatchEvent('CSGOPlaySoundEffect', 'mainmenu_press_GO', 'MOUSE');
                        }
                    }
                }
                else {
                    const arrWinners = _GetWinningMaps();
                    if (arrWinners.length == 0)
                        return;
                    // it should not be possible that  1 map has the most votes _and_ we have no voting_winner
                    if (arrWinners.length == 1) {
                        $.Msg("voting: no winner but one map has more votes than the others?\n");
                        $.Msg(JSON.stringify(oMatchEndVoteData));
                        return;
                    }
                    // random shuffle
                    // pick a random value but avoid picking the previous result.
                    let randIdx = 0;
                    if (arrWinners.length > 2) {
                        randIdx = Math.floor(Math.random() * arrWinners.length);
                    }
                    // if we have selected the same value, pick the next one
                    if (randIdx == m_randIdx) {
                        m_randIdx++;
                        // wrap around index
                        if (m_randIdx >= arrWinners.length) {
                            m_randIdx = 0;
                        }
                    }
                    else {
                        m_randIdx = randIdx;
                    }
                    const voteidx = arrWinners[m_randIdx];
                    const elVoteItem = _m_elVoteItemPanels[voteidx];
                    if (!elVoteItem || !elVoteItem.IsValid())
                        return;
                    const panelToHilite = elVoteItem.FindChildTraverse("id-map-selection-btn__gradient");
                    if (!panelToHilite || !panelToHilite.IsValid())
                        return;
                    panelToHilite.RemoveClass("map-selection-btn__gradient--whiteout");
                    panelToHilite.AddClass("map-selection-btn__gradient--whiteout");
                    $.DispatchEvent('CSGOPlaySoundEffect', 'buymenu_select', elVoteItem.id);
                }
            }
            else {
                for (let key of Object.keys(_m_elVoteItemPanels)) {
                    const elVoteItem = _m_elVoteItemPanels[key];
                    const oVoteOptions = oMatchEndVoteData.voting_options[_m_elVoteItemPanels[key].Data().m_key];
                    // display the Count
                    const elVoteCountLabel = elVoteItem.FindChildTraverse("id-map-selection-btn__count");
                    const votes = oVoteOptions.votes;
                    const votesNeeded = oMatchEndVoteData["votes_to_succeed"];
                    if (votes > 0 && votes !== elVoteCountLabel.Data().votecount) {
                        $.DispatchEvent('CSGOPlaySoundEffect', 'tab_settings_settings', elVoteItem.id);
                        elVoteCountLabel.Data().votecount = votes;
                    }
                    elVoteCountLabel.text = "<font color='#ffc130'>" + votes + '</font>/' + votesNeeded;
                }
            }
            _m_updateJob = $.Schedule(0.2, _UpdateVotes);
        }
    }
    function Start() {
        if (MockAdapter.GetMockData() && !MockAdapter.GetMockData().includes('VOTING')) {
            _End();
            return;
        }
        if (_DisplayMe()) {
            EndOfMatch.SwitchToPanel('eom-voting');
        }
        else {
            _End();
        }
    }
    function _End() {
        _CancelUpdateJob();
        EndOfMatch.ShowNextPanel();
    }
    function _CancelUpdateJob() {
        if (_m_updateJob != undefined) {
            $.CancelScheduled(_m_updateJob);
            _m_updateJob = undefined;
        }
    }
    function Shutdown() {
    }
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        EndOfMatch.RegisterPanelObject({
            name: 'eom-voting',
            Start: Start,
            Shutdown: Shutdown
        });
    }
})(EOM_Voting || (EOM_Voting = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5kb2ZtYXRjaC12b3RpbmcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9lbmRvZm1hdGNoLXZvdGluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBQ2xDLDZDQUE2QztBQUM3Qyx3Q0FBd0M7QUFDeEMsc0NBQXNDO0FBRXRDLElBQVUsVUFBVSxDQWtXbkI7QUFsV0QsV0FBVSxVQUFVO0lBRW5CLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBRSxhQUFhLENBQWlDLENBQUM7SUFFaEUsTUFBTSxtQkFBbUIsR0FBOEIsRUFBRSxDQUFDO0lBQzFELElBQUksWUFBWSxHQUFxQixTQUFTLENBQUM7SUFDL0MsSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDO0lBRWxCLFNBQVMsVUFBVTtRQUVsQixJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRTtZQUM3QixPQUFPO1FBRVIsSUFBSyxZQUFZLENBQUMsWUFBWSxFQUFFO1lBQy9CLE9BQU8sS0FBSyxDQUFDO1FBRWQsT0FBTztRQUNQLE1BQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUUzQyxJQUFLLENBQUMsS0FBSztZQUNWLE9BQU8sS0FBSyxDQUFDO1FBRWQsQ0FBQyxDQUFDLHlCQUF5QixDQUFFLHFCQUFxQixFQUFFLGdCQUFnQixDQUFFLENBQUM7UUFFdkUsd0JBQXdCO1FBQ3hCLE1BQU0saUJBQWlCLEdBQUcsV0FBVyxDQUFDLG1CQUFtQixDQUFFLEtBQUssQ0FBRSxDQUFDO1FBRW5FLENBQUMsQ0FBQyxhQUFhLENBQUUscUJBQXFCLEVBQUUseUNBQXlDLEVBQUUsT0FBTyxDQUFFLENBQUM7UUFFN0YsSUFBSyxDQUFDLGlCQUFpQixJQUFJLENBQUMsaUJBQWlCLENBQUMsY0FBYztZQUMzRCxPQUFPLEtBQUssQ0FBQztRQUVkLE1BQU0sa0JBQWtC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