"use strict";
/// <reference path="csgo.d.ts" />
var watchTile;
(function (watchTile) {
    let TEAMS = ['CT', 'TERRORIST'];
    function SetParentActive(elTile, value = false) {
        if (!elTile.Data().markForDelete) {
            let elLogo = elTile.FindChildTraverse('gotvicon');
            if (elLogo) {
                if (value) {
                    elLogo.AddClass('GOTV-Icon--ParentActive');
                }
                else {
                    elLogo.RemoveClass('GOTV-Icon--ParentActive');
                }
            }
        }
    }
    watchTile.SetParentActive = SetParentActive;
    function Delete(elTile) {
        $.DispatchEvent('DeletePanel', elTile);
    }
    watchTile.Delete = Delete;
    function _CheckPlayerParticipatedInMatch(elTile) {
        let bPlayerParticipated = false;
        let myTeam = 0;
        for (let t = 0; t < 2; t++) {
            for (let n = 0; n < 5; n++) {
                let playerXuid = MatchInfoAPI.GetMatchPlayerXuidByIndexForTeam(elTile.Data().matchId, t, n);
                if (playerXuid === elTile.Data().myXuid) {
                    bPlayerParticipated = true;
                    myTeam = t;
                }
            }
        }
        return { bPlayerParticipated: bPlayerParticipated, myTeam: myTeam };
    }
    function Init(elTile) {
        let bPlayerParticipated = false;
        let matchState = MatchInfoAPI.GetMatchState(elTile.Data().matchId);
        let matchTileDescriptor = 'player';
        let myTeam = 0;
        if (elTile.id == 'live_gotv')
            matchTileDescriptor = 'gotv';
        let isLive = Boolean(MatchInfoAPI.IsLive(elTile.Data().matchId));
        let tournamentName = MatchInfoAPI.GetMatchTournamentName(elTile.Data().matchId);
        if ((tournamentName != undefined) && (tournamentName != "")) {
            matchTileDescriptor = 'tournament';
        }
        else if (matchState == 'live') {
            matchTileDescriptor = 'live';
        }
        let _multiresult = _CheckPlayerParticipatedInMatch(elTile);
        bPlayerParticipated = _multiresult.bPlayerParticipated;
        myTeam = _multiresult.myTeam;
        let rawModeName = MatchInfoAPI.GetMatchMode(elTile.Data().matchId);
        let mapName = MatchInfoAPI.GetMatchMap(elTile.Data().matchId);
        $.Msg("Loading layout " + matchTileDescriptor + ".xml for match tile " + elTile.Data().matchId + " (t=" + tournamentName + "), (ms=" + matchState + ")");
        elTile.BLoadLayout("file://{resources}/layout/matchtiles/" + matchTileDescriptor + ".xml", true, false);
        let elTileMenu = elTile.FindChildTraverse('MatchTileMenu');
        let elDownloadingButton = undefined;
        let elDownloadButton = undefined;
        let elShareButton = undefined;
        let elMoreButton = undefined;
        let elDownloadFailedButton = undefined;
        let elWatchButton = undefined;
        if (elTileMenu) {
            if (elTile.Data().matchListDescriptor === 'live') {
                //elWatchButton = _AddButton( elTileMenu, elTile.Data().matchListDescriptor + "_" + elTile.Data().matchId, "watch", $.Localize( "#CSGO_Watch_Info_live"), _Watch.bind( "", elTile), false );
            }
            else {
                //elShareButton =  _AddButton( elTileMenu, elTile.Data().matchListDescriptor + "_" + elTile.Data().matchId, "link", $.Localize( "#CSGO_Watch_Copy_Url" ), _ShareMatch.bind( "", elTile ), false );
                //elDownloadButton = _AddButton( elTileMenu, elTile.Data().matchListDescriptor + "_" + elTile.Data().matchId, "downloaded", $.Localize( "#CSGO_Watch_Download" ), _DownloadMatch.bind( "", elTile ), false );
                //elDownloadingButton = _AddButton( elTileMenu, elTile.Data().matchListDescriptor + "_" + elTile.Data().matchId, "downloading", $.Localize( "#SFUI_GameUI_MatchDlDownloading"), undefined, true );
                //elDownloadFailedButton = _AddButton( elTileMenu, elTile.Data().matchListDescriptor + "_" + elTile.Data().matchId, "warning", $.Localize( "#WatchMenu_Info_Download_Failed" ), _UpdateFailedNotify.bind( "", elTile ), false );
                //elMoreButton = _AddButton( elTileMenu, elTile.Data().matchListDescriptor + "_" + elTile.Data().matchId, "expand", $.Localize( "#WatchMenu_Expand_Match_Menu" ), _OpenContextMenu.bind( "", elTile ), false );
                //_UpdateMatchState( elTile );
            }
        }
        let elMatchMapLabel = elTile.FindChildInLayoutFile('mapname');
        let elMatchMapIcon = elTile.FindChildInLayoutFile('mapicon');
        let elMatchModeIcon = elTile.FindChildInLayoutFile('modeicon');
        let elSkillGroupImg = elTile.FindChildInLayoutFile('skillgroup');
        let elScore0Label = elTile.FindChildInLayoutFile('score_team0');
        let elVsLabel = elTile.FindChildInLayoutFile('vs');
        let elScore1Label = elTile.FindChildInLayoutFile('score_team1');
        let elViewersLabel = elTile.FindChildInLayoutFile('viewers');
        let elOutcomeLabel = elTile.FindChildInLayoutFile('outcome');
        let elTimestampLabel = elTile.FindChildInLayoutFile('timestamp');
        if (elMatchMapLabel) {
            let mapLabelText = "#SFUI_Map_" + mapName;
            let mapLabelLocalizedText = $.Localize("#SFUI_Map_" + mapName);
            if (mapLabelText === mapLabelLocalizedText) {
                elMatchMapLabel.text = mapName;
            }
            else {
                elMatchMapLabel.text = mapLabelLocalizedText;
            }
        }
        // reverse score order if player participated, such that player's team is always listed first in the matchup
        let team0 = 0;
        let team1 = 1;
        if (bPlayerParticipated && (myTeam != 0)) {
            team0 = 1;
            team1 = 0;
        }
        let vsText = '-';
        if (matchTileDescriptor === 'tournament') {
            let elTournamentNameLabel = elTile.FindChildInLayoutFile('tournamentname');
            let elTournamentTeam0Icon = elTile.FindChildInLayoutFile('team0');
            let elTournamentTeam1Icon = elTile.FindChildInLayoutFile('team1');
            vsText = '-' + $.Localize("#WatchMenu_Tournament_Versus") + '-';
            elTournamentNameLabel.text = $.Localize(MatchInfoAPI.GetMatchTournamentStageName(elTile.Data().matchId));
            let setDefaultTeamImage = function (teamIcon) {
                teamIcon.SetImage("file://{images}/tournaments/teams/nologo.svg");
            };
            $.RegisterEventHandler('ImageFailedLoad', elTournamentTeam0Icon, setDefaultTeamImage.bind(undefined, elTournamentTeam0Icon));
            $.RegisterEventHandler('ImageFailedLoad', elTournamentTeam1Icon, setDefaultTeamImage.bind(undefined, elTournamentTeam1Icon));
            let icon0Filename = 'file://{images}/tournaments/teams/' + MatchInfoAPI.GetMatchTournamentTeamTag(elTile.Data().matchId, team0).toLowerCase() + '.svg';
            let icon1Filename = 'file://{images}/tournaments/teams/' + MatchInfoAPI.GetMatchTournamentTeamTag(elTile.Data().matchId, team1).toLowerCase() + '.svg';
            if (elTournamentTeam0Icon)
                elTournamentTeam0Icon.SetImage(icon0Filename);
            if (elTournamentTeam1Icon)
                elTournamentTeam1Icon.SetImage(icon1Filename);
        }
        if (elScore0Label) {
            elScore0Label.text = MatchInfoAPI.GetMatchRoundScoreForTeam(elTile.Data().matchId, team0).toString();
            if (matchTileDescriptor != 'tournament') {
                elScore0Label.AddClass('tint--' + TEAMS[team0]);
            }
        }
        if (elVsLabel) {
            elVsLabel.text = vsText;
        }
        if (elScore1Label) {
            elScore1Label.text = MatchInfoAPI.GetMatchRoundScoreForTeam(elTile.Data().matchId, team1).toString();
            if (matchTileDescriptor != 'tournament') {
                elScore1Label.AddClass('tint--' + TEAMS[team1]);
            }
        }
        if (elViewersLabel) {
            let spectatorCount = MatchInfoAPI.GetMatchSpectators(elTile.Data().matchId);
            if (!spectatorCount) {
                spectatorCount = 0;
            }
            elTile.SetDialogVariableInt('spectatorCount', spectatorCount);
            elViewersLabel.SetHasClass('hide', spectatorCount === 0);
        }
        if (bPlayerParticipated) {
            if (elOutcomeLabel) {
                let outcomeCode = MatchInfoAPI.GetMatchOutcome(elTile.Data().matchId);
                if (outcomeCode == undefined) {
                    elOutcomeLabel.AddClass('MatchInfo--Hide');
                }
                else {
                    if (myTeam != 0) {
                        if (outcomeCode == 1)
                            outcomeCode = 2;
                        else if (outcomeCode == 2)
                            outcomeCode = 1;
                    }
                    switch (outcomeCode) {
                        case 0:
                            elTile.AddClass('MatchTied');
                            elOutcomeLabel.text = $.Localize("#WatchMenu_Outcome_Tied", elOutcomeLabel);
                            break;
                        case 1:
                            elTile.AddClass('MatchVictory');
                            elOutcomeLabel.text = $.Localize("#WatchMenu_Outcome_Won", elOutcomeLabel);
                            break;
                        case 2:
                            elTile.AddClass('MatchLoss');
                            elOutcomeLabel.text = $.Localize("#WatchMenu_Outcome_Lost", elOutcomeLabel);
                            break;
                        case 3:
                            elOutcomeLabel.text = $.Localize("#WatchMenu_Outcome_Abandon");
                            break;
                    }
                }
            }
        }
        if (elTimestampLabel) {
            if (isLive)
                elTimestampLabel.text = $.Localize("#CSGO_Watch_Cat_LiveMatches");
            else
                elTimestampLabel.text = MatchInfoAPI.GetMatchTimestamp(elTile.Data().matchId);
        }
        let setDefaultMapImage = function (mapIcon) {
            mapIcon.SetImage("file://{images}/map_icons/map_icon_NONE.png");
        };
        if (elMatchMapIcon) {
            $.RegisterEventHandler('ImageFailedLoad', elMatchMapIcon, setDefaultMapImage.bind(undefined, elMatchMapIcon));
            elMatchMapIcon.SetImage("file://{images}/map_icons/map_icon_" + mapName + ".svg");
        }
        let setDefaultModeImage = function (mapIcon) {
            mapIcon.SetImage("file://{images}/icons/ui/competitive.vsvg");
        };
        if (elMatchModeIcon) {
            $.RegisterEventHandler('ImageFailedLoad', elMatchModeIcon, setDefaultModeImage.bind(undefined, elMatchModeIcon));
            elMatchModeIcon.SetImage("file://{images}/icons/ui/" + rawModeName + ".svg");
        }
        if (elSkillGroupImg) {
            let skillgroup = MatchInfoAPI.GetMatchSkillGroup(elTile.Data().matchId);
            if (skillgroup)
                elSkillGroupImg.SetImage("file://{images}/icons/skillgroups/skillgroup" + skillgroup + ".svg");
        }
    }
    watchTile.Init = Init;
    function Refresh(elTile) {
        Init(elTile);
    }
    watchTile.Refresh = Refresh;
    function SetDownloadHandler(elTile, handle = null) {
        elTile.Data().downloadStateHandler = handle;
    }
    watchTile.SetDownloadHandler = SetDownloadHandler;
    function GetDownloadHandler(elTile, handle = null) {
        return elTile.Data().downloadStateHandler;
    }
    watchTile.GetDownloadHandler = GetDownloadHandler;
})(watchTile || (watchTile = {}));
// TODO:
// Tooltips for popup buttons
// Tooltips for tile buttons
// Copy download link
// Activate actions from popup buttons
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2h0aWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvd2F0Y2h0aWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFFbEMsSUFBVSxTQUFTLENBb1NsQjtBQXBTRCxXQUFVLFNBQVM7SUFFZixJQUFJLEtBQUssR0FBRSxDQUFFLElBQUksRUFBRSxXQUFXLENBQUUsQ0FBQztJQUVqQyxTQUFnQixlQUFlLENBQUUsTUFBYyxFQUFFLFFBQWlCLEtBQUs7UUFFbkUsSUFBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxhQUFhLEVBQ2pDO1lBQ0ksSUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLGlCQUFpQixDQUFFLFVBQVUsQ0FBRSxDQUFDO1lBQ3BELElBQUssTUFBTSxFQUNYO2dCQUNJLElBQUssS0FBSyxFQUNWO29CQUNJLE1BQU0sQ0FBQyxRQUFRLENBQUUseUJBQXlCLENBQUUsQ0FBQztpQkFDaEQ7cUJBRUQ7b0JBQ0ksTUFBTSxDQUFDLFdBQVcsQ0FBRSx5QkFBeUIsQ0FBRSxDQUFDO2lCQUNuRDthQUNKO1NBQ0o7SUFDTCxDQUFDO0lBakJlLHlCQUFlLGtCQWlCOUIsQ0FBQTtJQUVELFNBQWdCLE1BQU0sQ0FBRSxNQUFlO1FBRW5DLENBQUMsQ0FBQyxhQUFhLENBQUUsYUFBYSxFQUFFLE1BQU0sQ0FBRSxDQUFDO0lBQ2hELENBQUM7SUFIa0IsZ0JBQU0sU0FHeEIsQ0FBQTtJQUVELFNBQVMsK0JBQStCLENBQUUsTUFBZTtRQUV4RCxJQUFJLG1CQUFtQixHQUFHLEtBQUssQ0FBQztRQUNoQyxJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFFZixLQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUMzQjtZQUNVLEtBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENB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