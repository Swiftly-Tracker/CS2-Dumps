"use strict";
/// <reference path="../csgo.d.ts" />
var TooltipProgress;
(function (TooltipProgress) {
    function Init() {
        let titleText = $.GetContextPanel().GetAttributeString("titletext", "not-found");
        let bodyText = $.GetContextPanel().GetAttributeString("bodytext", "not-found");
        let useXp = $.GetContextPanel().GetAttributeString("usexp", "false") === 'true';
        let targetLevel = $.GetContextPanel().GetAttributeString("targetlevel", "2");
        let showBar = $.GetContextPanel().GetAttributeString("showbar", "true") === 'true';
        let value = 0;
        if (useXp) {
            const currentPoints = FriendsListAPI.GetFriendXp(MyPersonaAPI.GetXuid());
            const pointsPerLevel = MyPersonaAPI.GetXpPerLevel();
            const levelsAttained = FriendsListAPI.GetFriendLevel(MyPersonaAPI.GetXuid());
            const totalPointsAttained = (levelsAttained ? (levelsAttained - 1) : 0) * pointsPerLevel + currentPoints;
            const totalPointsRequired = (Number(targetLevel) - 1) * pointsPerLevel;
            value = totalPointsAttained / totalPointsRequired * 100.0;
        }
        else {
            value = Number($.GetContextPanel().GetAttributeString("barvalue", "0"));
        }
        $('#TitleLabel').text = $.Localize(titleText);
        $('#TextLabel').text = $.Localize(bodyText);
        $('#TextPercentage').text = Math.floor(value) + '%';
        $('#js-tooltip-progress-bar-inner').style.width = value + '%';
        $('#ProgressBarContainer').visible = showBar;
    }
    TooltipProgress.Init = Init;
})(TooltipProgress || (TooltipProgress = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbHRpcF90aXRsZV9wcm9ncmVzc2Jhci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3Rvb2x0aXBzL3Rvb2x0aXBfdGl0bGVfcHJvZ3Jlc3NiYXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUVyQyxJQUFVLGVBQWUsQ0FrQ3hCO0FBbENELFdBQVUsZUFBZTtJQUV4QixTQUFnQixJQUFJO1FBRW5CLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxXQUFXLEVBQUUsV0FBVyxDQUFFLENBQUM7UUFDbkYsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGtCQUFrQixDQUFFLFVBQVUsRUFBRSxXQUFXLENBQUUsQ0FBQztRQUNqRixJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsa0JBQWtCLENBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBRSxLQUFLLE1BQU0sQ0FBQztRQUNsRixJQUFJLFdBQVcsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsa0JBQWtCLENBQUUsYUFBYSxFQUFFLEdBQUcsQ0FBRSxDQUFDO1FBQy9FLElBQUksT0FBTyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxTQUFTLEVBQUUsTUFBTSxDQUFFLEtBQUssTUFBTSxDQUFDO1FBQ3JGLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztRQUVkLElBQUssS0FBSyxFQUNWO1lBQ0MsTUFBTSxhQUFhLEdBQUcsY0FBYyxDQUFDLFdBQVcsQ0FBRSxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUUsQ0FBQztZQUMzRSxNQUFNLGNBQWMsR0FBRyxZQUFZLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDcEQsTUFBTSxjQUFjLEdBQUcsY0FBYyxDQUFDLGNBQWMsQ0FBRSxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUUsQ0FBQztZQUMvRSxNQUFNLG1CQUFtQixHQUFHLENBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFFLGNBQWMsR0FBRyxDQUFDLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFFLEdBQUcsY0FBYyxHQUFHLGFBQWEsQ0FBQztZQUM3RyxNQUFNLG1CQUFtQixHQUFHLENBQUUsTUFBTSxDQUFFLFdBQVcsQ0FBRSxHQUFHLENBQUMsQ0FBRSxHQUFHLGNBQWMsQ0FBQztZQUUzRSxLQUFLLEdBQUcsbUJBQW1CLEdBQUcsbUJBQW1CLEdBQUcsS0FBSyxDQUFDO1NBQzFEO2FBRUQ7WUFDQyxLQUFLLEdBQUcsTUFBTSxDQUFFLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxVQUFVLEVBQUUsR0FBRyxDQUFFLENBQUUsQ0FBQztTQUM1RTtRQUlDLENBQUMsQ0FBRSxhQUFhLENBQWUsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxTQUFTLENBQUUsQ0FBQztRQUMvRCxDQUFDLENBQUUsWUFBWSxDQUFlLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUUsUUFBUSxDQUFFLENBQUM7UUFDN0QsQ0FBQyxDQUFFLGlCQUFpQixDQUFlLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUUsS0FBSyxDQUFFLEdBQUcsR0FBRyxDQUFDO1FBQ3ZFLENBQUMsQ0FBRSxnQ0FBZ0MsQ0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsS0FBSyxHQUFHLEdBQUcsQ0FBQztRQUNqRSxDQUFDLENBQUUsdUJBQXVCLENBQUcsQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO0lBQ2pELENBQUM7SUEvQmUsb0JBQUksT0ErQm5CLENBQUE7QUFDRixDQUFDLEVBbENTLGVBQWUsS0FBZixlQUFlLFFBa0N4QiJ9