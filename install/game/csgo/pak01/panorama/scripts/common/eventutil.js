"use strict";
/// <reference path="../csgo.d.ts" />
var EventUtil;
(function (EventUtil) {
    const _eventIdSet = new Set([
        '5277',
        '5278',
        '5279',
        '5281',
        '5282',
        '5356',
        '5339',
        '5338',
        '5376',
        '5500',
        '5506',
        '5465',
        '5464',
        '5937',
        '5967',
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnR1dGlsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvY29tbW9uL2V2ZW50dXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBVXJDLElBQVUsU0FBUyxDQTBEbEI7QUExREQsV0FBVSxTQUFTO0lBRWxCLE1BQU0sV0FBVyxHQUFHLElBQUksR0FBRyxDQUFFO1FBRTVCLE1BQU07UUFDTixNQUFNO1FBQ04sTUFBTTtRQUNOLE1BQU07UUFDTixNQUFNO1FBR04sTUFBTTtRQUNOLE1BQU07UUFDTixNQUFNO1FBQ04sTUFBTTtRQUdOLE1BQU07UUFDTixNQUFNO1FBQ04sTUFBTTtRQUNOLE1BQU07UUFHTixNQUFNO1FBQ04sTUFBTTtRQUdOLE1BQU07UUFDTixNQUFNO0tBQ04sQ0FBRSxDQUFDO0lBRUosU0FBZ0Isc0JBQXNCLENBQThCLFVBQWU7UUFFbEYsS0FBTSxJQUFJLEtBQUssSUFBSSxVQUFVLEVBQzdCO1lBQ0MsSUFBSyxXQUFXLENBQUMsR0FBRyxDQUFFLEtBQUssQ0FBQyxRQUFRLENBQUUsRUFDdEM7Z0JBQ0MsS0FBSyxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7YUFDekI7U0FDRDtRQUVELE9BQU8sVUFBVSxDQUFDO0lBQ25CLENBQUM7SUFYZSxnQ0FBc0IseUJBV3JDLENBQUE7SUFFRCxTQUFnQixtQkFBbUIsQ0FBRyxZQUFtQixFQUFFLFFBQWU7UUFFekUsSUFBSSxXQUFXLEdBQUcsY0FBYyxDQUFDLGtCQUFrQixDQUFFLFlBQVksRUFBRSxRQUFRLENBQUUsQ0FBQztRQUM5RSxJQUFJLFlBQVksQ0FBQztRQUVqQixJQUFLLFdBQVc7ZUFDWixXQUFXLENBQUMsY0FBYyxDQUFFLFdBQVcsQ0FBRTtlQUN6QyxXQUFXLENBQUUsV0FBVyxDQUFFLENBQUMsY0FBYyxDQUFFLFlBQVksQ0FBRSxFQUM3RDtZQUNDLFlBQVksR0FBRyxXQUFXLENBQUUsV0FBVyxDQUFHLENBQUUsWUFBWSxDQUFHLENBQUUsQ0FBQyxDQUFFLENBQUM7U0FDakU7UUFFRCxPQUFPLFlBQVksQ0FBQztJQUNyQixDQUFDO0lBYmUsNkJBQW1CLHNCQWFsQyxDQUFBO0lBQUEsQ0FBQztBQUNILENBQUMsRUExRFMsU0FBUyxLQUFULFNBQVMsUUEwRGxCIn0=