"use strict";
/// <reference path="../csgo.d.ts" />
var SessionUtil;
(function (SessionUtil) {
    function DoesGameModeHavePrimeQueue(gameModeSettingName) {
        return gameModeSettingName === 'competitive' || gameModeSettingName === 'scrimcomp2v2';
    }
    SessionUtil.DoesGameModeHavePrimeQueue = DoesGameModeHavePrimeQueue;
    function GetMaxLobbySlotsForGameMode(gameMode) {
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
        if (PartyListAPI.GetCount() <= 1)
            return true;
        if (LobbyAPI.GetHostSteamID() === MyPersonaAPI.GetXuid())
            return true;
        return false;
    }
    SessionUtil.BCanUseMyPetInCurrentLobby = BCanUseMyPetInCurrentLobby;
})(SessionUtil || (SessionUtil = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Vzc2lvbnV0aWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9jb21tb24vc2Vzc2lvbnV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUlyQyxJQUFVLFdBQVcsQ0FxRXBCO0FBckVELFdBQVUsV0FBVztJQUVwQixTQUFnQiwwQkFBMEIsQ0FBRSxtQkFBMkI7UUFRdEUsT0FBTyxtQkFBbUIsS0FBSyxhQUFhLElBQUksbUJBQW1CLEtBQUssY0FBYyxDQUFDO0lBQ3hGLENBQUM7SUFUZSxzQ0FBMEIsNkJBU3pDLENBQUE7SUFFRCxTQUFnQiwyQkFBMkIsQ0FBRSxRQUFnQjtRQUk1RCxRQUFTLFFBQVEsRUFDakI7WUFDQyxLQUFLLGNBQWM7Z0JBQ2xCLE9BQU8sQ0FBQyxDQUFDO1lBQ1YsS0FBSyxTQUFTO2dCQUNiLE9BQU8sQ0FBQyxDQUFDO1lBQ1YsS0FBSyxNQUFNO2dCQUNWLE9BQU8sQ0FBQyxDQUFDO1lBQ1Y7Z0JBQ0MsT0FBTyxDQUFDLENBQUM7U0FDVjtJQUNGLENBQUM7SUFmZSx1Q0FBMkIsOEJBZTFDLENBQUE7SUFFRCxTQUFnQixvQkFBb0I7UUFFbkMsTUFBTSxZQUFZLEdBQUcsWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBRTdDLEtBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxZQUFZLEVBQUUsQ0FBQyxFQUFFLEVBQ3RDO1lBQ0MsTUFBTSxJQUFJLEdBQUcsWUFBWSxDQUFDLGNBQWMsQ0FBRSxDQUFDLENBQUUsQ0FBQztZQUM5QyxNQUFNLGFBQWEsR0FBRyxZQUFZLENBQUMsc0JBQXNCLENBQUUsSUFBSSxDQUFFLENBQUM7WUFFbEUsSUFBSyxhQUFhLEtBQUssS0FBSyxFQUM1QjtnQkFDQyxPQUFPLEtBQUssQ0FBQzthQUNiO1NBQ0Q7UUFFRCxPQUFPLElBQUksQ0FBQztJQUNiLENBQUM7SUFoQmUsZ0NBQW9CLHVCQWdCbkMsQ0FBQTtJQUVELFNBQWdCLHVCQUF1QixDQUFFLGNBQXNCO1FBRTlELElBQUssY0FBYyxLQUFLLGFBQWE7WUFBRyxPQUFPLENBQUMsQ0FBQztRQUNqRCxPQUFPLEVBQUUsQ0FBQztJQUNYLENBQUM7SUFKZSxtQ0FBdUIsMEJBSXRDLENBQUE7SUFFRCxTQUFnQiwwQkFBMEI7UUFHekMsSUFBSyxZQUFZLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQztZQUNoQyxPQUFPLElBQUksQ0FBQztRQUtiLElBQUssUUFBUSxDQUFDLGNBQWMsRUFBRSxLQUFLLFlBQVksQ0FBQyxPQUFPLEVBQUU7WUFDeEQsT0FBTyxJQUFJLENBQUM7UUFHYixPQUFPLEtBQUssQ0FBQztJQUNkLENBQUM7SUFkZSxzQ0FBMEIsNkJBY3pDLENBQUE7QUFDRixDQUFDLEVBckVTLFdBQVcsS0FBWCxXQUFXLFFBcUVwQiJ9