"use strict";
/// <reference path="../csgo.d.ts" />
//This file contains functions that helps setting up map icon
var IconUtil;
(function (IconUtil) {
    // Used in the for loop below
    function SetPNGImageFallback(mapIconDetails, icon_image_path) {
        if (mapIconDetails.m_type == 'svg') {
            mapIconDetails.m_type = 'png';
            mapIconDetails.m_icon.SetImage(icon_image_path + '.png');
        }
        else {
            mapIconDetails.m_icon.SetImage('file://{images}/map_icons/map_icon_NONE.png'); // this should a known valid path
        }
    }
    function SetupFallbackMapIcon(elIconPanel, icon_image_path) {
        const mapIconDetails = { m_icon: elIconPanel, m_type: 'svg', m_handler: -1 };
        $.RegisterEventHandler('ImageFailedLoad', elIconPanel, () => SetPNGImageFallback(mapIconDetails, icon_image_path));
    }
    IconUtil.SetupFallbackMapIcon = SetupFallbackMapIcon;
    // For Item Set Icons
    function SetItemSetPNGImageFallback(elIconPanel, icon_image_name) {
        $.Msg('IconUtil did not find a SVG for ' + icon_image_name + ' using a _small.PNG');
        elIconPanel.SetImage('file://{images}/econ/set_icons/' + icon_image_name + '_small.png'); // this should a known valid path
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWNvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL2NvbW1vbi9pY29uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFFckMsNkRBQTZEO0FBRTdELElBQVUsUUFBUSxDQWlEakI7QUFqREQsV0FBVSxRQUFRO0lBU2QsNkJBQTZCO0lBQzdCLFNBQVMsbUJBQW1CLENBQUcsY0FBOEIsRUFBRSxlQUF1QjtRQUVsRixJQUFLLGNBQWMsQ0FBQyxNQUFNLElBQUksS0FBSyxFQUNuQztZQUNJLGNBQWMsQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1lBQzlCLGNBQWMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFFLGVBQWUsR0FBRyxNQUFNLENBQUUsQ0FBQztTQUM5RDthQUVEO1lBQ0ksY0FBYyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUUsNkNBQTZDLENBQUUsQ0FBQyxDQUFDLGlDQUFpQztTQUNySDtJQUNMLENBQUM7SUFFRCxTQUFnQixvQkFBb0IsQ0FBRyxXQUFvQixFQUFFLGVBQXVCO1FBRWhGLE1BQU0sY0FBYyxHQUFtQixFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUM3RixDQUFDLENBQUMsb0JBQW9CLENBQUUsaUJBQWlCLEVBQUUsV0FBVyxFQUFFLEdBQUcsRUFBRSxDQUFDLG1CQUFtQixDQUFFLGNBQWMsRUFBRSxlQUFlLENBQUUsQ0FBRSxDQUFDO0lBQzNILENBQUM7SUFKZSw2QkFBb0IsdUJBSW5DLENBQUE7SUFFRCxxQkFBcUI7SUFDckIsU0FBZ0IsMEJBQTBCLENBQUcsV0FBb0IsRUFBRSxlQUF1QjtRQUV0RixDQUFDLENBQUMsR0FBRyxDQUFFLGtDQUFrQyxHQUFJLGVBQWUsR0FBRyxxQkFBcUIsQ0FBQyxDQUFDO1FBQ3RGLFdBQVcsQ0FBQyxRQUFRLENBQUUsaUNBQWlDLEdBQUcsZUFBZSxHQUFHLFlBQVksQ0FBRSxDQUFDLENBQUMsaUNBQWlDO0lBQ2pJLENBQUM7SUFKZSxtQ0FBMEIsNkJBSXpDLENBQUE7SUFFRCxTQUFnQixrQkFBa0IsQ0FBRSxXQUFvQixFQUFFLGVBQXVCO1FBRTdFLFdBQVcsQ0FBQyxRQUFRLENBQUUsaUNBQWlDLEdBQUcsZUFBZSxHQUFHLE1BQU0sQ0FBRSxDQUFDO0lBQ3pGLENBQUM7SUFIZSwyQkFBa0IscUJBR2pDLENBQUE7SUFFRCxTQUFnQix3QkFBd0IsQ0FBRyxXQUFvQixFQUFFLGVBQXVCO1FBRXBGLElBQUksV0FBVyxDQUFDLE9BQU8sRUFBRSxJQUFJLFdBQVcsSUFBSSxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsZUFBZSxLQUFLLFNBQVMsRUFDNUY7WUFDSSxDQUFDLENBQUMsb0JBQW9CLENBQUUsaUJBQWlCLEVBQUUsV0FBVyxFQUFFLEdBQUcsRUFBRSxDQUFDLDBCQUEwQixDQUFFLFdBQVcsRUFBRSxlQUFlLENBQUUsQ0FBRSxDQUFDO1lBQzNILFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFBO1NBQzVDO0lBQ0wsQ0FBQztJQVBlLGlDQUF3QiwyQkFPdkMsQ0FBQTtBQUNMLENBQUMsRUFqRFMsUUFBUSxLQUFSLFFBQVEsUUFpRGpCIn0=