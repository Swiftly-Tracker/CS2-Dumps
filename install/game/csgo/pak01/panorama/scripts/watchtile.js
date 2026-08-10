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
            }
            else {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2h0aWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvd2F0Y2h0aWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFFbEMsSUFBVSxTQUFTLENBb1NsQjtBQXBTRCxXQUFVLFNBQVM7SUFFZixJQUFJLEtBQUssR0FBRSxDQUFFLElBQUksRUFBRSxXQUFXLENBQUUsQ0FBQztJQUVqQyxTQUFnQixlQUFlLENBQUUsTUFBYyxFQUFFLFFBQWlCLEtBQUs7UUFFbkUsSUFBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxhQUFhLEVBQ2pDO1lBQ0ksSUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLGlCQUFpQixDQUFFLFVBQVUsQ0FBRSxDQUFDO1lBQ3BELElBQUssTUFBTSxFQUNYO2dCQUNJLElBQUssS0FBSyxFQUNWO29CQUNJLE1BQU0sQ0FBQyxRQUFRLENBQUUseUJBQXlCLENBQUUsQ0FBQztpQkFDaEQ7cUJBRUQ7b0JBQ0ksTUFBTSxDQUFDLFdBQVcsQ0FBRSx5QkFBeUIsQ0FBRSxDQUFDO2lCQUNuRDthQUNKO1NBQ0o7SUFDTCxDQUFDO0lBakJlLHlCQUFlLGtCQWlCOUIsQ0FBQTtJQUVELFNBQWdCLE1BQU0sQ0FBRSxNQUFlO1FBRW5DLENBQUMsQ0FBQyxhQUFhLENBQUUsYUFBYSxFQUFFLE1BQU0sQ0FBRSxDQUFDO0lBQ2hELENBQUM7SUFIa0IsZ0JBQU0sU0FHeEIsQ0FBQTtJQUVELFNBQVMsK0JBQStCLENBQUUsTUFBZTtRQUV4RCxJQUFJLG1CQUFtQixHQUFHLEtBQUssQ0FBQztRQUNoQyxJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFFZixLQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUMzQjtZQUNVLEtBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENB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