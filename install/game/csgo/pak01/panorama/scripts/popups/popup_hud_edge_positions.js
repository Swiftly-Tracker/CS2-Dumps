"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../common/async.ts" />
var HudEdgePositions;
(function (HudEdgePositions) {
    const m_CP = $.GetContextPanel();
    const m_Edge = $('#HudEdge');
    const m_XSlider = $('#HudEdgeX');
    const m_YSlider = $('#HudEdgeY');
    async function Init() {
        // Call OnShow manually here on sliders, to correctly init from convars. This is required
        // because using the .CSGOSettingsSlider__hidevalue #Value style to hide the slider values results in
        // OnShow not being automatically called.
        m_XSlider.OnShow();
        m_YSlider.OnShow();
        await Async.NextFrame();
        HudEdgePositions.Update();
    }
    HudEdgePositions.Init = Init;
    function Update() {
        const height = m_CP.actuallayoutheight / m_CP.actualuiscale_y; // logical pixels. Always 1080?
        const width = m_CP.actuallayoutwidth / m_CP.actualuiscale_x;
        const minHeight = m_YSlider.actualvalue * height;
        m_XSlider.min = minHeight / width;
        if (m_XSlider.actualvalue < m_XSlider.min)
            m_XSlider.actualvalue = m_XSlider.min;
        // clamp x to allowable values
        m_XSlider.min = Math.max(m_XSlider.min, OptionsMenuAPI.GetHudSafeZoneXMin());
        m_Edge.style.margin = `${(1 - m_YSlider.actualvalue) * 100 / 2}% ${(1 - m_XSlider.actualvalue) * 100 / 2}%`;
        //     $.Msg( OptionsMenuAPI.GetHudSafeZoneXMin(), ' ', m_XSlider.actualvalue );
    }
    HudEdgePositions.Update = Update;
    ;
})(HudEdgePositions || (HudEdgePositions = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfaHVkX2VkZ2VfcG9zaXRpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvcG9wdXBzL3BvcHVwX2h1ZF9lZGdlX3Bvc2l0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBQ3JDLDJDQUEyQztBQUUzQyxJQUFVLGdCQUFnQixDQW1DekI7QUFuQ0QsV0FBVSxnQkFBZ0I7SUFFdEIsTUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBQ2pDLE1BQU0sTUFBTSxHQUFHLENBQUMsQ0FBRSxVQUFVLENBQUcsQ0FBQztJQUNoQyxNQUFNLFNBQVMsR0FBRyxDQUFDLENBQUUsV0FBVyxDQUEwQixDQUFDO0lBQzNELE1BQU0sU0FBUyxHQUFHLENBQUMsQ0FBRSxXQUFXLENBQTBCLENBQUM7SUFFcEQsS0FBSyxVQUFVLElBQUk7UUFFeEIseUZBQXlGO1FBQ3pGLHFHQUFxRztRQUNyRyx5Q0FBeUM7UUFDdkMsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ25CLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUVuQixNQUFNLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUV4QixnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUM5QixDQUFDO0lBWHFCLHFCQUFJLE9BV3pCLENBQUE7SUFFRCxTQUFnQixNQUFNO1FBRWxCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsK0JBQStCO1FBQzlGLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDO1FBQzVELE1BQU0sU0FBUyxHQUFHLFNBQVMsQ0FBQyxXQUFXLEdBQUcsTUFBTSxDQUFDO1FBQ2pELFNBQVMsQ0FBQyxHQUFHLEdBQUcsU0FBUyxHQUFHLEtBQUssQ0FBQztRQUNsQyxJQUFLLFNBQVMsQ0FBQyxXQUFXLEdBQUcsU0FBUyxDQUFDLEdBQUc7WUFDdEMsU0FBUyxDQUFDLFdBQVcsR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDO1FBRTFDLDhCQUE4QjtRQUM5QixTQUFTLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUUsU0FBUyxDQUFDLEdBQUcsRUFBRSxjQUFjLENBQUMsa0JBQWtCLEVBQUUsQ0FBRSxDQUFDO1FBQy9FLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFJLEdBQUksQ0FBRSxDQUFDLEdBQUcsU0FBUyxDQUFDLFdBQVcsQ0FBRSxHQUFHLEdBQUcsR0FBRyxDQUFFLEtBQU0sQ0FBRSxDQUFDLEdBQUcsU0FBUyxDQUFDLFdBQVcsQ0FBRSxHQUFHLEdBQUcsR0FBRyxDQUFFLEdBQUcsQ0FBQztRQUUxSCxnRkFBZ0Y7SUFDL0UsQ0FBQztJQWRlLHVCQUFNLFNBY3JCLENBQUE7SUFBQSxDQUFDO0FBQ04sQ0FBQyxFQW5DUyxnQkFBZ0IsS0FBaEIsZ0JBQWdCLFFBbUN6QiJ9