"use strict";
/// <reference path="../csgo.d.ts" />
var EventUtil;
(function (EventUtil) {
    const _eventIdSet = new Set([
        // ESL One: Road to Rio events
        '5277',
        '5278',
        '5279',
        '5281',
        '5282',
        // Summer RMR events
        '5356',
        '5339',
        '5338',
        '5376',
        // Fall 2020 RMR Events
        '5500',
        '5506',
        '5465',
        '5464',
        // 2021 RMR Events
        '5937',
        '5967',
        // 2021 PGL Major
        '4866',
        '6207',
    ]);
    function AnnotateOfficialEvents(jsonEvents) {
        for (let event of jsonEvents) {
            if (_eventIdSet.has(event.event_id)) {
                event.is_official = true;
            }
        }
        return jsonEvents;
    }
    EventUtil.AnnotateOfficialEvents = AnnotateOfficialEvents;
    function GetTournamentWinner(tournamentId, numTeams) {
        let ProEventJSO = TournamentsAPI.GetProEventDataJSO(tournamentId, numTeams);
        let oWinningTeam;
        if (ProEventJSO
            && ProEventJSO.hasOwnProperty('eventdata')
            && ProEventJSO['eventdata'].hasOwnProperty(tournamentId)) {
            oWinningTeam = ProEventJSO['eventdata'][tournamentId][0];
        }
        return oWinningTeam;
    }
    EventUtil.GetTournamentWinner = GetTournamentWinner;
    ;
})(EventUtil || (EventUtil = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnR1dGlsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvY29tbW9uL2V2ZW50dXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBVXJDLElBQVUsU0FBUyxDQTBEbEI7QUExREQsV0FBVSxTQUFTO0lBRWxCLE1BQU0sV0FBVyxHQUFHLElBQUksR0FBRyxDQUFFO1FBQzVCLDhCQUE4QjtRQUM5QixNQUFNO1FBQ04sTUFBTTtRQUNOLE1BQU07UUFDTixNQUFNO1FBQ04sTUFBTTtRQUVOLG9CQUFvQjtRQUNwQixNQUFNO1FBQ04sTUFBTTtRQUNOLE1BQU07UUFDTixNQUFNO1FBRU4sdUJBQXVCO1FBQ3ZCLE1BQU07UUFDTixNQUFNO1FBQ04sTUFBTTtRQUNOLE1BQU07UUFFTixrQkFBa0I7UUFDbEIsTUFBTTtRQUNOLE1BQU07UUFFTixpQkFBaUI7UUFDakIsTUFBTTtRQUNOLE1BQU07S0FDTixDQUFFLENBQUM7SUFFSixTQUFnQixzQkFBc0IsQ0FBOEIsVUFBZTtRQUVsRixLQUFNLElBQUksS0FBSyxJQUFJLFVBQVUsRUFDN0I7WUFDQyxJQUFLLFdBQVcsQ0FBQyxHQUFHLENBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBRSxFQUN0QztnQkFDQyxLQUFLLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQzthQUN6QjtTQUNEO1FBRUQsT0FBTyxVQUFVLENBQUM7SUFDbkIsQ0FBQztJQVhlLGdDQUFzQix5QkFXckMsQ0FBQTtJQUVELFNBQWdCLG1CQUFtQixDQUFHLFlBQW1CLEVBQUUsUUFBZTtRQUV6RSxJQUFJLFdBQVcsR0FBRyxjQUFjLENBQUMsa0JBQWtCLENBQUUsWUFBWSxFQUFFLFFBQVEsQ0FBRSxDQUFDO1FBQzlFLElBQUksWUFBWSxDQUFDO1FBRWpCLElBQUssV0FBVztlQUNaLFdBQVcsQ0FBQyxjQUFjLENBQUUsV0FBVyxDQUFFO2VBQ3pDLFdBQVcsQ0FBRSxXQUFXLENBQUUsQ0FBQyxjQUFjLENBQUUsWUFBWSxDQUFFLEVBQzdEO1lBQ0MsWUFBWSxHQUFHLFdBQVcsQ0FBRSxXQUFXLENBQUcsQ0FBRSxZQUFZLENBQUcsQ0FBRSxDQUFDLENBQUUsQ0FBQztTQUNqRTtRQUVELE9BQU8sWUFBWSxDQUFDO0lBQ3JCLENBQUM7SUFiZSw2QkFBbUIsc0JBYWxDLENBQUE7SUFBQSxDQUFDO0FBQ0gsQ0FBQyxFQTFEUyxTQUFTLEtBQVQsU0FBUyxRQTBEbEIifQ==