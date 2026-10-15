"use strict";
/// <reference path="../csgo.d.ts" />
var IconUtil;
(function (IconUtil) {
    function SetPNGImageFallback(mapIconDetails, icon_image_path) {
        if (mapIconDetails.m_type == 'svg') {
            mapIconDetails.m_type = 'png';
            mapIconDetails.m_icon.SetImage(icon_image_path + '.png');
        }
        else {
            mapIconDetails.m_icon.SetImage('file://{images}/map_icons/map_icon_NONE.png');
        }
    }
    function SetupFallbackMapIcon(elIconPanel, icon_image_path) {
        const mapIconDetails = { m_icon: elIconPanel, m_type: 'svg', m_handler: -1 };
        $.RegisterEventHandler('ImageFailedLoad', elIconPanel, () => SetPNGImageFallback(mapIconDetails, icon_image_path));
    }
    IconUtil.SetupFallbackMapIcon = SetupFallbackMapIcon;
    function SetItemSetPNGImageFallback(elIconPanel, icon_image_name) {
        elIconPanel.SetImage('file://{images}/econ/set_icons/' + icon_image_name + '_small.png');
    }
    IconUtil.SetItemSetPNGImageFallback = SetItemSetPNGImageFallback;
    function SetItemSetSVGImage(elIconPanel, icon_image_name) {
        elIconPanel.SetImage('file://{images}/econ/set_icons/' + icon_image_name + '.svg');
    }
    IconUtil.SetItemSetSVGImage = SetItemSetSVGImage;
    function SetupFallbackItemSetIcon(elIconPanel, icon_image_name) {
        if (elIconPanel.IsValid() && elIconPanel && elIconPanel.Data().fallbackHandler === undefined) {
            $.RegisterEventHandler('ImageFailedLoad', elIconPanel, () => SetItemSetPNGImageFallback(elIconPanel, icon_image_name));
            elIconPanel.Data().fallbackHandler = true;
        }
    }
    IconUtil.SetupFallbackItemSetIcon = SetupFallbackItemSetIcon;
})(IconUtil || (IconUtil = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWNvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL2NvbW1vbi9pY29uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFJckMsSUFBVSxRQUFRLENBaURqQjtBQWpERCxXQUFVLFFBQVE7SUFVZCxTQUFTLG1CQUFtQixDQUFHLGNBQThCLEVBQUUsZUFBdUI7UUFFbEYsSUFBSyxjQUFjLENBQUMsTUFBTSxJQUFJLEtBQUssRUFDbkM7WUFDSSxjQUFjLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztZQUM5QixjQUFjLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBRSxlQUFlLEdBQUcsTUFBTSxDQUFFLENBQUM7U0FDOUQ7YUFFRDtZQUNJLGNBQWMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFFLDZDQUE2QyxDQUFFLENBQUM7U0FDbkY7SUFDTCxDQUFDO0lBRUQsU0FBZ0Isb0JBQW9CLENBQUcsV0FBb0IsRUFBRSxlQUF1QjtRQUVoRixNQUFNLGNBQWMsR0FBbUIsRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDN0YsQ0FBQyxDQUFDLG9CQUFvQixDQUFFLGlCQUFpQixFQUFFLFdBQVcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBRSxjQUFjLEVBQUUsZUFBZSxDQUFFLENBQUUsQ0FBQztJQUMzSCxDQUFDO0lBSmUsNkJBQW9CLHVCQUluQyxDQUFBO0lBR0QsU0FBZ0IsMEJBQTBCLENBQUcsV0FBb0IsRUFBRSxlQUF1QjtRQUd0RixXQUFXLENBQUMsUUFBUSxDQUFFLGlDQUFpQyxHQUFHLGVBQWUsR0FBRyxZQUFZLENBQUUsQ0FBQztJQUMvRixDQUFDO0lBSmUsbUNBQTBCLDZCQUl6QyxDQUFBO0lBRUQsU0FBZ0Isa0JBQWtCLENBQUUsV0FBb0IsRUFBRSxlQUF1QjtRQUU3RSxXQUFXLENBQUMsUUFBUSxDQUFFLGlDQUFpQyxHQUFHLGVBQWUsR0FBRyxNQUFNLENBQUUsQ0FBQztJQUN6RixDQUFDO0lBSGUsMkJBQWtCLHFCQUdqQyxDQUFBO0lBRUQsU0FBZ0Isd0JBQXdCLENBQUcsV0FBb0IsRUFBRSxlQUF1QjtRQUVwRixJQUFJLFdBQVcsQ0FBQyxPQUFPLEVBQUUsSUFBSSxXQUFXLElBQUksV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLGVBQWUsS0FBSyxTQUFTLEVBQzVGO1lBQ0ksQ0FBQyxDQUFDLG9CQUFvQixDQUFFLGlCQUFpQixFQUFFLFdBQVcsRUFBRSxHQUFHLEVBQUUsQ0FBQywwQkFBMEIsQ0FBRSxXQUFXLEVBQUUsZUFBZSxDQUFFLENBQUUsQ0FBQztZQUMzSCxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQTtTQUM1QztJQUNMLENBQUM7SUFQZSxpQ0FBd0IsMkJBT3ZDLENBQUE7QUFDTCxDQUFDLEVBakRTLFFBQVEsS0FBUixRQUFRLFFBaURqQiJ9