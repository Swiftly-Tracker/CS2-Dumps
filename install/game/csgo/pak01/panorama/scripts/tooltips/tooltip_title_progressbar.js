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
        $.Msg('locl player current XP: ' + value);
        $('#TitleLabel').text = $.Localize(titleText);
        $('#TextLabel').text = $.Localize(bodyText);
        $('#TextPercentage').text = Math.floor(value) + '%';
        $('#js-tooltip-progress-bar-inner').style.width = value + '%';
        $('#ProgressBarContainer').visible = showBar;
    }
    TooltipProgress.Init = Init;
})(TooltipProgress || (TooltipProgress = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbHRpcF90aXRsZV9wcm9ncmVzc2Jhci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3Rvb2x0aXBzL3Rvb2x0aXBfdGl0bGVfcHJvZ3Jlc3NiYXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUVyQyxJQUFVLGVBQWUsQ0FrQ3hCO0FBbENELFdBQVUsZUFBZTtJQUV4QixTQUFnQixJQUFJO1FBRW5CLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxXQUFXLEVBQUUsV0FBVyxDQUFFLENBQUM7UUFDbkYsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGtCQUFrQixDQUFFLFVBQVUsRUFBRSxXQUFXLENBQUUsQ0FBQztRQUNqRixJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsa0JBQWtCLENBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBRSxLQUFLLE1BQU0sQ0FBQztRQUNsRixJQUFJLFdBQVcsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsa0JBQWtCLENBQUUsYUFBYSxFQUFFLEdBQUcsQ0FBRSxDQUFDO1FBQy9FLElBQUksT0FBTyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxTQUFTLEVBQUUsTUFBTSxDQUFFLEtBQUssTUFBTSxDQUFDO1FBQ3JGLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztRQUVkLElBQUssS0FBSyxFQUNWO1lBQ0MsTUFBTSxhQUFhLEdBQUcsY0FBYyxDQUFDLFdBQVcsQ0FBRSxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUUsQ0FBQztZQUMzRSxNQUFNLGNBQWMsR0FBRyxZQUFZLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDcEQsTUFBTSxjQUFjLEdBQUcsY0FBYyxDQUFDLGNBQWMsQ0FBRSxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUUsQ0FBQztZQUMvRSxNQUFNLG1CQUFtQixHQUFHLENBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFFLGNBQWMsR0FBRyxDQUFDLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFFLEdBQUcsY0FBYyxHQUFHLGFBQWEsQ0FBQztZQUM3RyxNQUFNLG1CQUFtQixHQUFHLENBQUUsTUFBTSxDQUFFLFdBQVcsQ0FBRSxHQUFHLENBQUMsQ0FBRSxHQUFHLGNBQWMsQ0FBQztZQUUzRSxLQUFLLEdBQUcsbUJBQW1CLEdBQUcsbUJBQW1CLEdBQUcsS0FBSyxDQUFDO1NBQzFEO2FBRUQ7WUFDQyxLQUFLLEdBQUcsTUFBTSxDQUFFLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxVQUFVLEVBQUUsR0FBRyxDQUFFLENBQUUsQ0FBQztTQUM1RTtRQUVELENBQUMsQ0FBQyxHQUFHLENBQUUsMEJBQTBCLEdBQUcsS0FBSyxDQUFFLENBQUM7UUFFMUMsQ0FBQyxDQUFFLGFBQWEsQ0FBZSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFFLFNBQVMsQ0FBRSxDQUFDO1FBQy9ELENBQUMsQ0FBRSxZQUFZLENBQWUsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxRQUFRLENBQUUsQ0FBQztRQUM3RCxDQUFDLENBQUUsaUJBQWlCLENBQWUsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBRSxLQUFLLENBQUUsR0FBRyxHQUFHLENBQUM7UUFDdkUsQ0FBQyxDQUFFLGdDQUFnQyxDQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxLQUFLLEdBQUcsR0FBRyxDQUFDO1FBQ2pFLENBQUMsQ0FBRSx1QkFBdUIsQ0FBRyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7SUFDakQsQ0FBQztJQS9CZSxvQkFBSSxPQStCbkIsQ0FBQTtBQUNGLENBQUMsRUFsQ1MsZUFBZSxLQUFmLGVBQWUsUUFrQ3hCIn0=