"use strict";
/// <reference path="../csgo.d.ts" />
var TeamColor;
(function (TeamColor) {
    function GetColorString(color) {
        const list = color.split(' ');
        return list.join(',');
    }
    const colorRGB = [
        '100,100,100',
        GetColorString(GameInterfaceAPI.GetSettingString("cl_teammate_color_1")),
        GetColorString(GameInterfaceAPI.GetSettingString("cl_teammate_color_2")),
        GetColorString(GameInterfaceAPI.GetSettingString("cl_teammate_color_3")),
        GetColorString(GameInterfaceAPI.GetSettingString("cl_teammate_color_4")),
        GetColorString(GameInterfaceAPI.GetSettingString("cl_teammate_color_5"))
    ];
    function GetTeamColor(teamColorInx) {
        if (teamColorInx >= 0 && teamColorInx <= 4) {
            return colorRGB[teamColorInx + 1];
        }
        return colorRGB[0];
    }
    TeamColor.GetTeamColor = GetTeamColor;
})(TeamColor || (TeamColor = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVhbWNvbG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvY29tbW9uL3RlYW1jb2xvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBRXJDLElBQVUsU0FBUyxDQTBCbEI7QUExQkQsV0FBVSxTQUFTO0lBRWxCLFNBQVMsY0FBYyxDQUFHLEtBQWE7UUFFdEMsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM5QixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDdkIsQ0FBQztJQUVELE1BQU0sUUFBUSxHQUFHO1FBQ2hCLGFBQWE7UUFDYixjQUFjLENBQUUsZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUUscUJBQXFCLENBQUUsQ0FBQztRQUMzRSxjQUFjLENBQUUsZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUUscUJBQXFCLENBQUUsQ0FBQztRQUMzRSxjQUFjLENBQUUsZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUUscUJBQXFCLENBQUUsQ0FBQztRQUMzRSxjQUFjLENBQUUsZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUUscUJBQXFCLENBQUUsQ0FBQztRQUMzRSxjQUFjLENBQUUsZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUUscUJBQXFCLENBQUUsQ0FBQztLQUMzRSxDQUFBO0lBRUQsU0FBZ0IsWUFBWSxDQUFHLFlBQW9CO1FBRWxELElBQUssWUFBWSxJQUFJLENBQUMsSUFBSSxZQUFZLElBQUksQ0FBQyxFQUMzQztZQUNDLE9BQU8sUUFBUSxDQUFFLFlBQVksR0FBRyxDQUFDLENBQUUsQ0FBQztTQUNwQztRQUVELE9BQU8sUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLENBQUM7SUFSZSxzQkFBWSxlQVEzQixDQUFBO0FBQ0YsQ0FBQyxFQTFCUyxTQUFTLEtBQVQsU0FBUyxRQTBCbEIifQ==