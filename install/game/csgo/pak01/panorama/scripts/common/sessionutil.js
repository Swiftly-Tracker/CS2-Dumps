"use strict";
/// <reference path="../csgo.d.ts" />
//This file contains functions that helps polling session or game settings for answers
var SessionUtil;
(function (SessionUtil) {
    function DoesGameModeHavePrimeQueue(gameModeSettingName) {
        //
        // Make sure C++ also honors the prime request for the same game modes in cstrike15v2_matchmaking.cpp
        // CGCJob_EMsgGCCStrike15_v2_MatchmakingStart::BYieldingRunJobFromMsg {
        // 		bool bPrimeOnlyRequested = msg.Body().prime_only();
        // 		if ( bPrimeOnlyRequested ) { ...
        //
        return gameModeSettingName === 'competitive' || gameModeSettingName === 'scrimcomp2v2';
    }
    SessionUtil.DoesGameModeHavePrimeQueue = DoesGameModeHavePrimeQueue;
    function GetMaxLobbySlotsForGameMode(gameMode) {
        //
        // Returns max number of slots to display for the lobby in a given game mode
        switch (gameMode) {
            case "scrimcomp2v2":
                return 2;
            case "retakes":
                return 4;
            case "rush":
                return 3;
            default:
                return 5;
        }
    }
    SessionUtil.GetMaxLobbySlotsForGameMode = GetMaxLobbySlotsForGameMode;
    function AreLobbyPlayersPrime() {
        const playersCount = PartyListAPI.GetCount();
        for (let i = 0; i < playersCount; i++) {
            const xuid = PartyListAPI.GetXuidByIndex(i);
            const isFriendPrime = PartyListAPI.GetFriendPrimeEligible(xuid);
            if (isFriendPrime === false) {
                return false;
            }
        }
        return true;
    }
    SessionUtil.AreLobbyPlayersPrime = AreLobbyPlayersPrime;
    function GetNumWinsNeededForRank(skillgroupType) {
        if (skillgroupType === 'Competitive')
            return 2;
        return 10;
    }
    SessionUtil.GetNumWinsNeededForRank = GetNumWinsNeededForRank;
    function BCanUseMyPetInCurrentLobby() {
        // Allow pet toolbar for solo players
        if (PartyListAPI.GetCount() <= 1)
            return true;
        // But also allow the toolbar for players who are the lobby leader
        // since we always feature the lobby leader front-and-center in the lineup
        // on the lobby leader's screen
        if (LobbyAPI.GetHostSteamID() === MyPersonaAPI.GetXuid())
            return true;
        // Otherwise you are a client in the lobby and your pet might not be onscreen
        return false;
    }
    SessionUtil.BCanUseMyPetInCurrentLobby = BCanUseMyPetInCurrentLobby;
})(SessionUtil || (SessionUtil = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Vzc2lvbnV0aWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9jb21tb24vc2Vzc2lvbnV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUVyQyxzRkFBc0Y7QUFFdEYsSUFBVSxXQUFXLENBcUVwQjtBQXJFRCxXQUFVLFdBQVc7SUFFcEIsU0FBZ0IsMEJBQTBCLENBQUUsbUJBQTJCO1FBRXRFLEVBQUU7UUFDRixxR0FBcUc7UUFDckcsdUVBQXVFO1FBQ3ZFLHdEQUF3RDtRQUN4RCxxQ0FBcUM7UUFDckMsRUFBRTtRQUNGLE9BQU8sbUJBQW1CLEtBQUssYUFBYSxJQUFJLG1CQUFtQixLQUFLLGNBQWMsQ0FBQztJQUN4RixDQUFDO0lBVGUsc0NBQTBCLDZCQVN6QyxDQUFBO0lBRUQsU0FBZ0IsMkJBQTJCLENBQUUsUUFBZ0I7UUFFNUQsRUFBRTtRQUNGLDRFQUE0RTtRQUM1RSxRQUFTLFFBQVEsRUFDakI7WUFDQyxLQUFLLGNBQWM7Z0JBQ2xCLE9BQU8sQ0FBQyxDQUFDO1lBQ1YsS0FBSyxTQUFTO2dCQUNiLE9BQU8sQ0FBQyxDQUFDO1lBQ1YsS0FBSyxNQUFNO2dCQUNWLE9BQU8sQ0FBQyxDQUFDO1lBQ1Y7Z0JBQ0MsT0FBTyxDQUFDLENBQUM7U0FDVjtJQUNGLENBQUM7SUFmZSx1Q0FBMkIsOEJBZTFDLENBQUE7SUFFRCxTQUFnQixvQkFBb0I7UUFFbkMsTUFBTSxZQUFZLEdBQUcsWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBRTdDLEtBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxZQUFZLEVBQUUsQ0FBQyxFQUFFLEVBQ3RDO1lBQ0MsTUFBTSxJQUFJLEdBQUcsWUFBWSxDQUFDLGNBQWMsQ0FBRSxDQUFDLENBQUUsQ0FBQztZQUM5QyxNQUFNLGFBQWEsR0FBRyxZQUFZLENBQUMsc0JBQXNCLENBQUUsSUFBSSxDQUFFLENBQUM7WUFFbEUsSUFBSyxhQUFhLEtBQUssS0FBSyxFQUM1QjtnQkFDQyxPQUFPLEtBQUssQ0FBQzthQUNiO1NBQ0Q7UUFFRCxPQUFPLElBQUksQ0FBQztJQUNiLENBQUM7SUFoQmUsZ0NBQW9CLHVCQWdCbkMsQ0FBQTtJQUVELFNBQWdCLHVCQUF1QixDQUFFLGNBQXNCO1FBRTlELElBQUssY0FBYyxLQUFLLGFBQWE7WUFBRyxPQUFPLENBQUMsQ0FBQztRQUNqRCxPQUFPLEVBQUUsQ0FBQztJQUNYLENBQUM7SUFKZSxtQ0FBdUIsMEJBSXRDLENBQUE7SUFFRCxTQUFnQiwwQkFBMEI7UUFFekMscUNBQXFDO1FBQ3JDLElBQUssWUFBWSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUM7WUFDaEMsT0FBTyxJQUFJLENBQUM7UUFFYixrRUFBa0U7UUFDbEUsMEVBQTBFO1FBQzFFLCtCQUErQjtRQUMvQixJQUFLLFFBQVEsQ0FBQyxjQUFjLEVBQUUsS0FBSyxZQUFZLENBQUMsT0FBTyxFQUFFO1lBQ3hELE9BQU8sSUFBSSxDQUFDO1FBRWIsNkVBQTZFO1FBQzdFLE9BQU8sS0FBSyxDQUFDO0lBQ2QsQ0FBQztJQWRlLHNDQUEwQiw2QkFjekMsQ0FBQTtBQUNGLENBQUMsRUFyRVMsV0FBVyxLQUFYLFdBQVcsUUFxRXBCIn0=