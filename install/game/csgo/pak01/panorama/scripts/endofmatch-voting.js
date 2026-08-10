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
        const oTime = MockAdapter.GetTimeDataJSO();
        if (!oTime)
            return false;
        $.RegisterForUnhandledEvent('EndOfMatch_Shutdown', _CancelUpdateJob);
        const oMatchEndVoteData = MockAdapter.NextMatchVotingData(_m_cP);
        $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.submenu_leveloptions_slidein', 'MOUSE');
        if (!oMatchEndVoteData || !oMatchEndVoteData.voting_options)
            return false;
        const elMapSelectionList = _m_cP.FindChildInLayoutFile('id-map-selection-list');
        Object.keys(oMatchEndVoteData.voting_options).forEach((key, index) => {
            const type = oMatchEndVoteData.voting_options[key].type;
            if (type == "separator") {
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
                elVoteItem.SetPanelEvent('onactivate', () => {
                    GameInterfaceAPI.ConsoleCommand("endmatch_votenextmap" + " " + elVoteItem.Data().m_key);
                    elMapSelectionList.FindChildrenWithClassTraverse("map-selection-btn").forEach(btn => btn.enabled = false);
                    $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.submenu_leveloptions_select', 'MOUSE');
                });
                _m_elVoteItemPanels[index] = elVoteItem;
            }
        });
        _UpdateVotes();
        return true;
    }
    function _UpdateVotes() {
        _m_updateJob = undefined;
        if (!_m_cP || !_m_cP.IsValid())
            return;
        const oMatchEndVoteData = MockAdapter.NextMatchVotingData(_m_cP);
        if (!oMatchEndVoteData) {
            return;
        }
        function _GetWinningMaps() {
            let arrVoteWinnersKeys = [];
            let highestVote = 0;
            for (let key of Object.keys(oMatchEndVoteData.voting_options)) {
                const nVotes = oMatchEndVoteData.voting_options[key].votes;
                if (nVotes > highestVote)
                    highestVote = nVotes;
            }
            for (let key of Object.keys(oMatchEndVoteData.voting_options)) {
                const nVotes = oMatchEndVoteData.voting_options[key].votes;
                if ((nVotes === highestVote) &&
                    (oMatchEndVoteData.voting_options[key].type != 'separator'))
                    arrVoteWinnersKeys.push(key);
            }
            return arrVoteWinnersKeys;
        }
        if (oMatchEndVoteData) {
            if (oMatchEndVoteData.voting_done) {
                const elMapSelectionList = _m_cP.FindChildInLayoutFile('id-map-selection-list');
                elMapSelectionList.FindChildrenWithClassTraverse("map-selection-btn").forEach(btn => btn.enabled = false);
                const winner = oMatchEndVoteData["voting_winner"];
                if (winner !== -1) {
                    let winningKey = '';
                    for (let key of Object.keys(_m_elVoteItemPanels)) {
                        if (_m_elVoteItemPanels[key].Data().m_key == winner)
                            winningKey = key;
                    }
                    if (winningKey != '' && _m_elVoteItemPanels[winningKey]) {
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
                    if (arrWinners.length == 1) {
                        return;
                    }
                    let randIdx = 0;
                    if (arrWinners.length > 2) {
                        randIdx = Math.floor(Math.random() * arrWinners.length);
                    }
                    if (randIdx == m_randIdx) {
                        m_randIdx++;
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
    {
        EndOfMatch.RegisterPanelObject({
            name: 'eom-voting',
            Start: Start,
            Shutdown: Shutdown
        });
    }
})(EOM_Voting || (EOM_Voting = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5kb2ZtYXRjaC12b3RpbmcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9lbmRvZm1hdGNoLXZvdGluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBQ2xDLDZDQUE2QztBQUM3Qyx3Q0FBd0M7QUFDeEMsc0NBQXNDO0FBRXRDLElBQVUsVUFBVSxDQWtXbkI7QUFsV0QsV0FBVSxVQUFVO0lBRW5CLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBRSxhQUFhLENBQWlDLENBQUM7SUFFaEUsTUFBTSxtQkFBbUIsR0FBOEIsRUFBRSxDQUFDO0lBQzFELElBQUksWUFBWSxHQUFxQixTQUFTLENBQUM7SUFDL0MsSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDO0lBRWxCLFNBQVMsVUFBVTtRQUVsQixJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRTtZQUM3QixPQUFPO1FBRVIsSUFBSyxZQUFZLENBQUMsWUFBWSxFQUFFO1lBQy9CLE9BQU8sS0FBSyxDQUFDO1FBR2QsTUFBTSxLQUFLLEdBQUcsV0FBVyxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBRTNDLElBQUssQ0FBQyxLQUFLO1lBQ1YsT0FBTyxLQUFLLENBQUM7UUFFZCxDQUFDLENBQUMseUJBQXlCLENBQUUscUJBQXFCLEVBQUUsZ0JBQWdCLENBQUUsQ0FBQztRQUd2RSxNQUFNLGlCQUFpQixHQUFHLFdBQVcsQ0FBQyxtQkFBbUIsQ0FBRSxLQUFLLENBQUUsQ0FBQztRQUVuRSxDQUFDLENBQUMsYUFBYSxDQUFFLHFCQUFxQixFQUFFLHlDQUF5QyxFQUFFLE9BQU8sQ0FBRSxDQUFDO1FBRTdGLElBQUssQ0FBQyxpQkFBaUIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGNBQWM7WUFDM0QsT0FBTyxLQUFLLENBQUM7UUFFZCxNQUFNLGtCQUFrQixHQUFHLEtBQUssQ0FBQyxxQkFBcUIs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