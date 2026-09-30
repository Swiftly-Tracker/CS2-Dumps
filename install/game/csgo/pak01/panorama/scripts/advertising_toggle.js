"use strict";
/// <reference path="csgo.d.ts" />
var AdvertisingToggle;
(function (AdvertisingToggle) {
    let _m_elParent = $.GetContextPanel().FindChildInLayoutFile('id-friendslist-broadcast-toggle');
    let _m_elBtn = _m_elParent.FindChildInLayoutFile('id-slider-btn');
    let _m_lobbyListerFilter = '';
    function _Init() {
        _m_elBtn.SetPanelEvent('onactivate', _OnActivateToggle);
    }
    ;
    function OnFilterPressed(sFilter) {
        _m_lobbyListerFilter = sFilter;
        _UpdateToggle();
        _UpdateTooltip(PartyListAPI.GetCount() > 1);
    }
    AdvertisingToggle.OnFilterPressed = OnFilterPressed;
    //Update button state to represent current state
    function _UpdateToggle() {
        if (PartyListAPI.GetCount() > 1) {
            _m_elBtn.checked = false;
            _m_elBtn.enabled = false;
            _UpdateTooltip(true);
            return;
        }
        _m_elBtn.enabled = true;
        _m_elBtn.checked = GetAdvertisingSetting() === _m_lobbyListerFilter;
        _m_elBtn.SetDialogVariable('slide_toggle_text', $.Localize("#advertising_for_hire_" + _m_lobbyListerFilter));
        _UpdateTooltip(false);
    }
    ;
    //On btn Press pass the setting we want.
    function _OnActivateToggle() {
        let currentSetting = GetAdvertisingSetting();
        let newSetting = currentSetting === _m_lobbyListerFilter ? '' : _m_lobbyListerFilter;
        PartyListAPI.SetLocalPlayerForHireAdvertising(newSetting);
    }
    function GetAdvertisingSetting() {
        let strAdvertising = PartyListAPI.GetLocalPlayerForHireAdvertising();
        return strAdvertising.split('-')[0];
    }
    AdvertisingToggle.GetAdvertisingSetting = GetAdvertisingSetting;
    function _AdvertisingChanged() {
        let currentSetting = GetAdvertisingSetting();
        _m_elBtn.checked = (currentSetting !== '' && currentSetting === _m_lobbyListerFilter);
        PartyBrowserAPI.Refresh();
    }
    function _UpdateTooltip(isDisabled) {
        let OnMouseOver = function () {
            let tooltipText = isDisabled === true ? '#advertising_for_hire_tooltip_disabled' : '#advertising_for_hire_tooltip';
            UiToolkitAPI.ShowTitleTextTooltip(_m_elBtn.id, '#advertising_for_hire_tooltip_title', tooltipText);
        };
        _m_elBtn.SetPanelEvent('onmouseover', OnMouseOver);
        _m_elBtn.SetPanelEvent('onmouseout', function () { UiToolkitAPI.HideTitleTextTooltip(); });
    }
    ;
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        _Init();
        $.RegisterForUnhandledEvent('PanoramaComponent_PartyBrowser_LocalPlayerForHireAdvertisingChanged', _AdvertisingChanged);
        $.RegisterForUnhandledEvent("PanoramaComponent_PartyList_RebuildPartyList", _UpdateToggle);
    }
})(AdvertisingToggle || (AdvertisingToggle = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWR2ZXJ0aXNpbmdfdG9nZ2xlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvYWR2ZXJ0aXNpbmdfdG9nZ2xlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFFbEMsSUFBVSxpQkFBaUIsQ0E0RTFCO0FBNUVELFdBQVUsaUJBQWlCO0lBRXZCLElBQUksV0FBVyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxpQ0FBaUMsQ0FBRSxDQUFDO0lBQ2pHLElBQUksUUFBUSxHQUFHLFdBQVcsQ0FBQyxxQkFBcUIsQ0FBRSxlQUFlLENBQUUsQ0FBQztJQUNwRSxJQUFJLG9CQUFvQixHQUFHLEVBQUUsQ0FBQztJQUU5QixTQUFTLEtBQUs7UUFFVixRQUFRLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxpQkFBaUIsQ0FBRSxDQUFDO0lBQzlELENBQUM7SUFBQSxDQUFDO0lBRUYsU0FBZ0IsZUFBZSxDQUFFLE9BQWU7UUFFNUMsb0JBQW9CLEdBQUcsT0FBTyxDQUFDO1FBQy9CLGFBQWEsRUFBRSxDQUFDO1FBQ2hCLGNBQWMsQ0FBRSxZQUFZLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFHLENBQUM7SUFDbkQsQ0FBQztJQUxlLGlDQUFlLGtCQUs5QixDQUFBO0lBRUQsZ0RBQWdEO0lBQ2hELFNBQVMsYUFBYTtRQUVsQixJQUFLLFlBQVksQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLEVBQ2hDO1lBQ0ksUUFBUSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7WUFDekIsUUFBUSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7WUFDekIsY0FBYyxDQUFFLElBQUksQ0FBRSxDQUFDO1lBQ3ZCLE9BQU87U0FDVjtRQUVELFFBQVEsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBQ3hCLFFBQVEsQ0FBQyxPQUFPLEdBQUcscUJBQXFCLEVBQUUsS0FBSyxvQkFBb0IsQ0FBQztRQUNwRSxRQUFRLENBQUMsaUJBQWlCLENBQUUsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBRSx3QkFBd0IsR0FBRyxvQkFBb0IsQ0FBRSxDQUFFLENBQUM7UUFDakgsY0FBYyxDQUFFLEtBQUssQ0FBRSxDQUFDO0lBQzVCLENBQUM7SUFBQSxDQUFDO0lBRUYsd0NBQXdDO0lBQ3hDLFNBQVMsaUJBQWlCO1FBRXRCLElBQUksY0FBYyxHQUFHLHFCQUFxQixFQUFFLENBQUM7UUFDN0MsSUFBSSxVQUFVLEdBQUcsY0FBYyxLQUFLLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixDQUFDO1FBQ3JGLFlBQVksQ0FBQyxnQ0FBZ0MsQ0FBRSxVQUFVLENBQUUsQ0FBQztJQUNoRSxDQUFDO0lBRUQsU0FBZ0IscUJBQXFCO1FBRWpDLElBQUksY0FBYyxHQUFHLFlBQVksQ0FBQyxnQ0FBZ0MsRUFBRSxDQUFDO1FBQ3JFLE9BQU8sY0FBYyxDQUFDLEtBQUssQ0FBRSxHQUFHLENBQUUsQ0FBRSxDQUFDLENBQUUsQ0FBQztJQUM1QyxDQUFDO0lBSmUsdUNBQXFCLHdCQUlwQyxDQUFBO0lBRUQsU0FBUyxtQkFBbUI7UUFFeEIsSUFBSSxjQUFjLEdBQUcscUJBQXFCLEVBQUUsQ0FBQztRQUM3QyxRQUFRLENBQUMsT0FBTyxHQUFHLENBQUUsY0FBYyxLQUFLLEVBQUUsSUFBSSxjQUFjLEtBQUssb0JBQW9CLENBQUUsQ0FBQztRQUN4RixlQUFlLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDOUIsQ0FBQztJQUVELFNBQVMsY0FBYyxDQUFFLFVBQW1CO1FBRXhDLElBQUksV0FBVyxHQUFHO1lBRWQsSUFBSSxXQUFXLEdBQUcsVUFBVSxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsd0NBQXdDLENBQUMsQ0FBQyxDQUFDLCtCQUErQixDQUFDO1lBQ25ILFlBQVksQ0FBQyxvQkFBb0IsQ0FBRSxRQUFRLENBQUMsRUFBRSxFQUFFLHFDQUFxQyxFQUFFLFdBQVcsQ0FBRSxDQUFDO1FBQ3pHLENBQUMsQ0FBQztRQUVGLFFBQVEsQ0FBQyxhQUFhLENBQUUsYUFBYSxFQUFFLFdBQVcsQ0FBRSxDQUFDO1FBQ3JELFFBQVEsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLGNBQWEsWUFBWSxDQUFDLG9CQUFvQixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQztJQUNoRyxDQUFDO0lBQUEsQ0FBQztJQUVGLG9HQUFvRztJQUNwRywyQ0FBMkM7SUFDM0Msb0dBQW9HO0lBQ3BHO1FBQ0ksS0FBSyxFQUFFLENBQUM7UUFDUixDQUFDLENBQUMseUJBQXlCLENBQUUscUVBQXFFLEVBQUUsbUJBQW1CLENBQUUsQ0FBQztRQUMxSCxDQUFDLENBQUMseUJBQXlCLENBQUUsOENBQThDLEVBQUUsYUFBYSxDQUFFLENBQUM7S0FDaEc7QUFDTCxDQUFDLEVBNUVTLGlCQUFpQixLQUFqQixpQkFBaUIsUUE0RTFCIn0=