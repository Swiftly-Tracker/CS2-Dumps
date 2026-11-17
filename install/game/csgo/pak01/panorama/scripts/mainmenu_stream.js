"use strict";
/// <reference path="csgo.d.ts" />m_cp
var StreamPanel;
(function (StreamPanel) {
    let m_cp;
    let m_elEmbeddedStream;
    let m_bAllowStream = true;
    let m_bMainMenuActive = true;
    let m_valLastKnownVolume = 0;
    let m_nVolumeSliderChangedFromScript = 0;
    let m_userClosedStream = false;
    const m_pinnedParent = $.GetContextPanel().GetParent();
    const m_dragParent = $.GetContextPanel().GetParent().GetParent().GetParent();
    function _Init() {
        m_cp = $.GetContextPanel();
        _UpdateEmbeddedStream();
        m_cp.SetHasClass('stream-drag-enabled', false);
    }
    function _CloseStream() {
        m_bAllowStream = false;
        m_userClosedStream = true;
        _UpdateEmbeddedStream();
    }
    ;
    function _MinimizeStream() {
        m_cp.SetHasClass('minimize_stream', true);
        let elDragPanel = m_dragParent.FindChildInLayoutFile('main-menu-drag-panel');
        if (m_cp.GetParent().id === elDragPanel.id) {
            $.Schedule(.25, () => { elDragPanel.style.width = 'fit-children'; });
        }
    }
    ;
    function _FullSizeStream() {
        m_cp.SetHasClass('minimize_stream', false);
    }
    ;
    function _StreamDragEnable() {
        let elDragPanel = m_dragParent.FindChildInLayoutFile('main-menu-drag-panel');
        m_cp.SetParent(elDragPanel);
        m_cp.style.y = "0px";
        m_cp.style.x = "0px";
        $.Schedule(.25, () => { elDragPanel.style.width = 'fit-children'; });
        let rightOffset = 140;
        let xpos = (elDragPanel.GetParent().actuallayoutwidth / elDragPanel.GetParent().actualuiscale_x);
        xpos = xpos - ((m_cp.actuallayoutwidth / m_cp.actualuiscale_x) + rightOffset);
        let ypos = (elDragPanel.GetParent().actuallayoutheight / elDragPanel.GetParent().actualuiscale_y);
        ypos = ypos - ((m_cp.actuallayoutheight / m_cp.actualuiscale_y) + rightOffset);
        elDragPanel.SetDragPosition(xpos, ypos);
        m_cp.SetHasClass('stream-drag-enabled', true);
    }
    function _StreamDragDisable() {
        m_cp.style.y = m_cp.actualyoffset + 150 + 'px';
        m_cp.style.x = m_cp.actualxoffset - 55 + 'px';
        m_cp.FindChild('StreamPanelFeed').style.opacity = '0';
        $.Schedule(.3, () => {
            m_cp.SetParent(m_pinnedParent);
            m_cp.SetHasClass('stream-drag-enabled', false);
            m_cp.style.x = '0px';
            m_cp.style.y = '0px';
            m_cp.FindChild('StreamPanelFeed').style.opacity = '1';
            m_pinnedParent.MoveChildBefore(m_cp, m_pinnedParent.FindChild('VanityControls'));
        });
    }
    function _CSGOHideMainMenu() {
        m_bMainMenuActive = false;
        _UpdateEmbeddedStream();
    }
    ;
    function _CSGOShowMainMenu() {
        m_bMainMenuActive = true;
        m_bAllowStream = true;
        _UpdateEmbeddedStream();
    }
    ;
    function _UpdateEmbeddedStream() {
        let urlStreamFeed = EmbeddedStreamAPI.GetStreamFeedSourceURL();
        let elStreamPanelFeed = m_cp.FindChildInLayoutFile('StreamPanelFeed');
        if (!m_bAllowStream || !m_bMainMenuActive) {
            urlStreamFeed = '';
        }
        if (urlStreamFeed) {
            if (!elStreamPanelFeed) {
                elStreamPanelFeed = $.CreatePanel('Panel', m_cp, 'StreamPanelFeed');
                elStreamPanelFeed.BLoadLayoutSnippet('stream-panel');
                let elSlider = elStreamPanelFeed.FindChildInLayoutFile('VolumeSlider');
                if (elSlider) {
                    elSlider.min = 0;
                    elSlider.max = 100;
                    elSlider.increment = 1;
                    ++m_nVolumeSliderChangedFromScript;
                    elSlider.value = EmbeddedStreamAPI.GetAudioVolume();
                    elSlider.SetPanelEvent('onvaluechanged', OnVolumeSliderValueChanged);
                }
                _UpdateVolumeImageFromSlider();
                let elVolumeImage = elStreamPanelFeed.FindChildInLayoutFile('VolumeImage');
                if (elVolumeImage) {
                    elVolumeImage.SetPanelEvent('onactivate', ToggleVolumeMute);
                }
                elStreamPanelFeed.FindChildInLayoutFile("id-close-btn").SetPanelEvent('onactivate', _CloseStream);
                elStreamPanelFeed.FindChildInLayoutFile("id-minimize-btn").SetPanelEvent('onactivate', _MinimizeStream);
                elStreamPanelFeed.FindChildInLayoutFile("id-full-size-btn").SetPanelEvent('onactivate', _FullSizeStream);
                elStreamPanelFeed.FindChildInLayoutFile("id-popout-btn").SetPanelEvent('onactivate', _StreamDragEnable);
                elStreamPanelFeed.FindChildInLayoutFile("id-popout-reset-btn").SetPanelEvent('onactivate', _StreamDragDisable);
            }
            m_elEmbeddedStream = elStreamPanelFeed.FindChildInLayoutFile('StreamHTML');
            m_elEmbeddedStream.SetURL(urlStreamFeed);
            _SetClassesForVideoPlaying(EmbeddedStreamAPI.IsVideoPlaying());
        }
        else if (elStreamPanelFeed) {
            elStreamPanelFeed.DeleteAsync(0);
            _SetClassesForVideoPlaying(false);
        }
    }
    ;
    function ToggleVolumeMute() {
        let valCurrentVolume = EmbeddedStreamAPI.GetAudioVolume();
        if (valCurrentVolume > 0) {
            m_valLastKnownVolume = valCurrentVolume;
            EmbeddedStreamAPI.SetAudioVolume(0);
        }
        else {
            if (m_valLastKnownVolume < 15)
                m_valLastKnownVolume = 20;
            EmbeddedStreamAPI.SetAudioVolume(m_valLastKnownVolume);
        }
        _OnVolumeCodeValueChanged();
    }
    StreamPanel.ToggleVolumeMute = ToggleVolumeMute;
    ;
    function OnVolumeSliderValueChanged() {
        if (m_nVolumeSliderChangedFromScript > 0) {
            --m_nVolumeSliderChangedFromScript;
            return;
        }
        let elSlider = m_cp.FindChildInLayoutFile('VolumeSlider');
        if (elSlider) {
            let vol = elSlider.value;
            EmbeddedStreamAPI.SetAudioVolume(vol);
            _UpdateVolumeImageFromSlider();
        }
    }
    StreamPanel.OnVolumeSliderValueChanged = OnVolumeSliderValueChanged;
    ;
    function _MuteStream() {
        let elSlider = m_cp.FindChildInLayoutFile('VolumeSlider');
        if (elSlider && elSlider.IsValid()) {
            let valCurrentVolume = EmbeddedStreamAPI.GetAudioVolume();
            if (valCurrentVolume > 0) {
                m_valLastKnownVolume = valCurrentVolume;
                EmbeddedStreamAPI.SetAudioVolume(0);
                _OnVolumeCodeValueChanged();
            }
        }
    }
    function _OnVolumeCodeValueChanged() {
        let elSlider = m_cp.FindChildInLayoutFile('VolumeSlider');
        if (elSlider) {
            ++m_nVolumeSliderChangedFromScript;
            elSlider.value = EmbeddedStreamAPI.GetAudioVolume();
            _UpdateVolumeImageFromSlider();
        }
    }
    StreamPanel._OnVolumeCodeValueChanged = _OnVolumeCodeValueChanged;
    ;
    function _UpdateVolumeImageFromSlider() {
        let elSlider = m_cp.FindChildInLayoutFile('VolumeSlider');
        let elVolumeImage = m_cp.FindChildInLayoutFile('VolumeImage');
        if (elSlider && elVolumeImage) {
            elVolumeImage.SetImage((elSlider.value > 0) ? 'file://{images}/icons/ui/unmuted.svg' : 'file://{images}/icons/ui/sound_off.svg');
        }
    }
    function _UpdateEmbeddedStreamVisibility() {
        _SetClassesForVideoPlaying(EmbeddedStreamAPI.IsVideoPlaying());
    }
    StreamPanel._UpdateEmbeddedStreamVisibility = _UpdateEmbeddedStreamVisibility;
    ;
    function _HTMLJSAlertV8(elPanel, sAlertText) {
        EmbeddedStreamAPI.PanoramaJSAlert(m_elEmbeddedStream, sAlertText);
    }
    StreamPanel._HTMLJSAlertV8 = _HTMLJSAlertV8;
    ;
    function _HTMLFinishRequest(elPanel, sUrl, sPageTitle) {
        EmbeddedStreamAPI.PanoramaFinishRequest(m_elEmbeddedStream, sUrl, sPageTitle);
    }
    StreamPanel._HTMLFinishRequest = _HTMLFinishRequest;
    ;
    function _SetClassesForVideoPlaying(bIsVideoPlaying) {
        if (m_cp) {
            if (bIsVideoPlaying) {
                m_cp.SetDialogVariable('title', $.Localize('#SFUI_MajorEventVenue_StreamTitle_' + NewsAPI.GetActiveTournamentEventID() + '_' + EmbeddedStreamAPI.GetStreamEventVenueID()));
                let elNavBarWatchExternalExtraButtons = m_cp.FindChildInLayoutFile("NavBarWatchExternalExtraButtons");
                let sSupportedStreamTypes = EmbeddedStreamAPI.GetStreamExternalLinkTypes();
                let sChildrenWithTypeName = "NavBarWatchExternal";
                elNavBarWatchExternalExtraButtons.Children().forEach(function (elchild) {
                    if (elchild.id.startsWith(sChildrenWithTypeName)) {
                        let chrLookupTypeCharacter = elchild.id.substring(sChildrenWithTypeName.length, sChildrenWithTypeName.length + 1);
                        elchild.SetHasClass('hidden', sSupportedStreamTypes.indexOf(chrLookupTypeCharacter) < 0);
                    }
                });
                if (m_userClosedStream) {
                    m_userClosedStream = false;
                    _MinimizeStream();
                    _StreamDragDisable();
                    _MuteStream();
                }
            }
            else {
                $.DispatchEvent('StreamPanelClosed');
            }
            m_cp.SetHasClass('hidden', !bIsVideoPlaying);
        }
    }
    ;
    {
        _Init();
        $.RegisterForUnhandledEvent("PanoramaComponent_EmbeddedStream_VideoReload", _UpdateEmbeddedStream);
        $.RegisterForUnhandledEvent("PanoramaComponent_EmbeddedStream_VideoPlaying", _UpdateEmbeddedStreamVisibility);
        $.RegisterForUnhandledEvent("PanoramaComponent_EmbeddedStream_VolumeChanged", _OnVolumeCodeValueChanged);
        $.RegisterForUnhandledEvent("CSGOHideMainMenu", _CSGOHideMainMenu);
        $.RegisterForUnhandledEvent("CSGOShowMainMenu", _CSGOShowMainMenu);
        $.RegisterForUnhandledEvent("MuteStreamPanel", _MuteStream);
        $.RegisterEventHandler("HTMLJSAlertV8", $.GetContextPanel(), _HTMLJSAlertV8);
        $.RegisterEventHandler("HTMLFinishRequest", $.GetContextPanel(), _HTMLFinishRequest);
    }
})(StreamPanel || (StreamPanel = {}));
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbm1lbnVfc3RyZWFtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvbWFpbm1lbnVfc3RyZWFtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxzQ0FBc0M7QUFFdEMsSUFBVSxXQUFXLENBdVNwQjtBQXZTRCxXQUFVLFdBQVc7SUFFcEIsSUFBSSxJQUFhLENBQUM7SUFDbEIsSUFBSSxrQkFBMEIsQ0FBQztJQUMvQixJQUFJLGNBQWMsR0FBRyxJQUFJLENBQUM7SUFDMUIsSUFBSSxpQkFBaUIsR0FBRyxJQUFJLENBQUM7SUFDN0IsSUFBSSxvQkFBb0IsR0FBRyxDQUFDLENBQUM7SUFDN0IsSUFBSSxnQ0FBZ0MsR0FBRyxDQUFDLENBQUM7SUFDekMsSUFBSSxrQkFBa0IsR0FBVyxLQUFLLENBQUM7SUFDcEMsTUFBTSxjQUFjLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDO0lBQ3ZELE1BQU0sWUFBWSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztJQUVoRixTQUFTLEtBQUs7UUFFYixJQUFJLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQzNCLHFCQUFxQixFQUFFLENBQUM7UUFDbEIsSUFBSSxDQUFDLFdBQVcsQ0FBRSxxQkFBcUIsRUFBRSxLQUFLLENBQUUsQ0FBQztJQUN4RCxDQUFDO0lBRUQsU0FBUyxZQUFZO1FBRXBCLGNBQWMsR0FBRyxLQUFLLENBQUM7UUFDdkIsa0JBQWtCLEdBQUcsSUFBSSxDQUFDO1FBQ3pCLHFCQUFxQixFQUFFLENBQUM7SUFDMUIsQ0FBQztJQUFBLENBQUM7SUFFRixTQUFTLGVBQWU7UUFFdkIsSUFBSSxDQUFDLFdBQVcsQ0FBRSxpQkFBaUIsRUFBRSxJQUFJLENBQUUsQ0FBQztRQUM1QyxJQUFJLFdBQVcsR0FBRyxZQUFZLENBQUMscUJBQXFCLENBQUUsc0JBQXNCLENBQWlCLENBQUM7UUFDOUYsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxLQUFLLFdBQVcsQ0FBQyxFQUFFLEVBQzFDO1lBQ0MsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxHQUFHLEVBQUUsR0FBRSxFQUFFLEdBQUUsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsY0FBYyxDQUFBLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDbkU7SUFDRixDQUFDO0lBQUEsQ0FBQztJQUVGLFNBQVMsZUFBZTtRQUV2QixJQUFJLENBQUMsV0FBVyxDQUFFLGlCQUFpQixFQUFFLEtBQUssQ0FBRSxDQUFDO0lBQzlDLENBQUM7SUFBQSxDQUFDO0lBRUMsU0FBUyxpQkFBaUI7UUFFdEIsSUFBSSxXQUFXLEdBQUcsWUFBWSxDQUFDLHFCQUFxQixDQUFFLHNCQUFzQixDQUFpQixDQUFDO1FBQzlGLElBQUksQ0FBQyxTQUFTLENBQUUsV0FBVyxDQUFFLENBQUM7UUFDcEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDO1FBQ3JCLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQztRQUNyQixDQUFDLENBQUMsUUFBUSxDQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxjQUFjLENBQUEsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVyRSxJQUFJLFdBQVcsR0FBRyxHQUFHLENBQUM7UUFDdEIsSUFBSSxJQUFJLEdBQUcsQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLENBQUMsaUJBQWlCLEdBQUUsV0FBVyxDQUFDLFNBQVMsRUFBRSxDQUFDLGVBQWUsQ0FBRSxDQUFDO1FBQ2pHLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFFLElBQUksQ0FBQyxpQkFBaUIsR0FBRSxJQUFJLENBQUMsZUFBZSxDQUFFLEdBQUcsV0FBVyxDQUFFLENBQUM7UUFFaEYsSUFBSSxJQUFJLEdBQUcsQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLENBQUMsa0JBQWtCLEdBQUUsV0FBVyxDQUFDLFNBQVMsRUFBRSxDQUFDLGVBQWUsQ0FBRSxDQUFDO1FBQ2xHLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFFLElBQUksQ0FBQyxrQkFBa0IsR0FBRSxJQUFJLENBQUMsZUFBZSxDQUFFLEdBQUcsV0FBVyxDQUFFLENBQUM7UUFFakYsV0FBVyxDQUFDLGVBQWUsQ0FBRSxJQUFJLEVBQUUsSUFBSSxDQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLFdBQVcsQ0FBRSxxQkFBcUIsRUFBRSxJQUFJLENBQUUsQ0FBQztJQUM5QyxDQUFDO0lBRUQsU0FBUyxrQkFBa0I7UUFHN0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLGFBQWEsR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDO1FBQy9DLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxhQUFhLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQztRQUM1QyxJQUFJLENBQUMsU0FBUyxDQUFDLGlCQUFpQixDQUFjLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUM7UUFFckUsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxFQUFFLEVBQUUsR0FBRSxFQUFFO1lBQ25CLElBQUksQ0FBQyxTQUFTLENBQUUsY0FBYyxDQUFFLENBQUM7WUFDakMsSUFBSSxDQUFDLFdBQVcsQ0FBRSxxQkFBcUIsRUFBRSxLQUFLLENBQUUsQ0FBQztZQUNqRCxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUM7WUFDckIsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDO1lBQ25CLElBQUksQ0FBQyxTQUFTLENBQUMsaUJBQWlCLENBQWMsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQztZQUNyRSxjQUFjLENBQUMsZUFBZSxDQUFFLElBQUksRUFBRSxjQUFjLENBQUMsU0FBUyxDQUFFLGdCQUFnQixDQUFZLENBQUUsQ0FBQztRQUNoRyxDQUFDLENBQUMsQ0FBQztJQUNELENBQUM7SUFFSixTQUFTLGlCQUFpQjtRQUV6QixpQkFBaUIsR0FBRyxLQUFLLENBQUM7UUFDMUIscUJBQXFCLEVBQUUsQ0FBQztJQUN6QixDQUFDO0lBQUEsQ0FBQztJQUVGLFNBQVMsaUJBQWlCO1FBRXpCLGlCQUFpQixHQUFHLElBQUksQ0FBQztRQUN6QixjQUFjLEdBQUcsSUFBSSxDQUFDO1FBQ3RCLHFCQUFxQixFQUFFLENBQUM7SUFDekIsQ0FBQztJQUFBLENBQUM7SUFFRixTQUFTLHFCQUFxQjtRQUU3QixJQUFJLGFBQWEsR0FBRyxpQkFBaUIsQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO1FBRy9ELElBQUksaUJBQWlCLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFFLGlCQUFpQixDQUFFLENBQUM7UUFFeEUsSUFBSyxDQUFDLGNBQWMsSUFBSSxDQUFDLGlCQUFpQixFQUMxQztZQUNDLGFBQWEsR0FBRyxFQUFFLENBQUM7U0FDbkI7UUFFRCxJQUFLLGFBQWEsRUFDbEI7WUFDQyxJQUFLLENBQUMsaUJBQWlCLEVBQ3ZCO2dCQUVDLGlCQUFpQixHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxpQkFBaUIsQ0FBRSxDQUFDO2dCQUN0RSxpQkFBaUIsQ0FBQyxrQkFBa0IsQ0FBRSxjQUFjLENBQUUsQ0FBQztnQkFHdkQsSUFBSSxRQUFRLEdBQUcsaUJBQWlCLENBQUMscUJBQXFCLENBQUUsY0FBYyxDQUFjLENBQUM7Z0JBQ3JGLElBQUssUUFBUSxFQUNiO29CQUNDLFFBQVEsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO29CQUNqQixRQUFRLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztvQkFDbkIsUUFBUSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7b0JBQ3ZCLEVBQUUsZ0NBQWdDLENBQUM7b0JBQ25DLFFBQVEsQ0FBQyxLQUFLLEdBQUcsaUJBQWlCLENBQUMsY0FBYyxFQUFFLENBQUM7b0JBQ3BELFFBQVEsQ0FBQyxhQUFhLENBQUUsZ0JBQWdCLEVBQUUsMEJBQTBCLENBQUUsQ0FBQztpQkFDdkU7Z0JBRUQsNEJBQTRCLEVBQUUsQ0FBQztnQkFDL0IsSUFBSSxhQUFhLEdBQUcsaUJBQWlCLENBQUMscUJBQXFCLENBQUUsYUFBYSxDQUFhLENBQUM7Z0JBQ3hGLElBQUssYUFBYSxFQUNsQjtvQkFDQyxhQUFhLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxnQkFBZ0IsQ0FBRSxDQUFDO2lCQUM5RDtnQkFFRCxpQkFBaUIsQ0FBQyxxQkFBcUIsQ0FBRSxjQUFjLENBQUUsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLFlBQVksQ0FBRSxDQUFDO2dCQUN0RyxpQkFBaUIsQ0FBQyxxQkFBcUIsQ0FBRSxpQkFBaUIsQ0FBRSxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsZUFBZSxDQUFFLENBQUM7Z0JBQzVHLGlCQUFpQixDQUFDLHFCQUFxQixDQUFFLGtCQUFrQixDQUFFLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxlQUFlLENBQUUsQ0FBQztnQkFDN0csaUJBQWlCLENBQUMscUJBQXFCLENBQUUsZUFBZSxDQUFFLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxpQkFBaUIsQ0FBRSxDQUFDO2dCQUM1RyxpQkFBaUIsQ0FBQyxxQkFBcUIsQ0FBRSxxQkFBcUIsQ0FBRSxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsa0JBQWtCLENBQUUsQ0FBQzthQUNuSDtZQUtELGtCQUFrQixHQUFHLGlCQUFpQixDQUFDLHFCQUFxQixDQUFFLFlBQVksQ0FBWSxDQUFDO1lBQ3ZGLGtCQUFrQixDQUFDLE1BQU0sQ0FBRSxhQUFhLENBQUUsQ0FBQztZQUMzQywwQkFBMEIsQ0FBRSxpQkFBaUIsQ0FBQyxjQUFjLEVBQUUsQ0FBRSxDQUFDO1NBQ2pFO2FBQ0ksSUFBSyxpQkFBaUIsRUFDM0I7WUFDQyxpQkFBaUIsQ0FBQyxXQUFXLENBQUUsQ0FBQyxDQUFFLENBQUM7WUFDbkMsMEJBQTBCLENBQUUsS0FBSyxDQUFFLENBQUM7U0FDcEM7SUFDRixDQUFDO0lBQUEsQ0FBQztJQUVGLFNBQWdCLGdCQUFnQjtRQUV6QixJQUFJLGdCQUFnQixHQUFHLGlCQUFpQixDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQ2hFLElBQUssZ0JBQWdCLEdBQUcsQ0FBQyxFQUN6QjtZQUNDLG9CQUFvQixHQUFHLGdCQUFnQixDQUFDO1lBQ3hDLGlCQUFpQixDQUFDLGNBQWMsQ0FBRSxDQUFDLENBQUUsQ0FBQztTQUN0QzthQUVEO1lBQ0MsSUFBSyxvQkFBb0IsR0FBRyxFQUFFO2dCQUFHLG9CQUFvQixHQUFHLEVBQUUsQ0FBQztZQUMzRCxpQkFBaUIsQ0FBQyxjQUFjLENBQUUsb0JBQW9CLENBQUUsQ0FBQztTQUN6RDtRQUNELHlCQUF5QixFQUFFLENBQUM7SUFDN0IsQ0FBQztJQWRlLDRCQUFnQixtQkFjL0IsQ0FBQTtJQUFBLENBQUM7SUFFRixTQUFnQiwwQkFBMEI7UUFFekMsSUFBSyxnQ0FBZ0MsR0FBRyxDQUFDLEVBQ3pDO1lBQ0MsRUFBRSxnQ0FBZ0MsQ0FBQztZQUNuQyxPQUFPO1NBQ1A7UUFFRCxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUUsY0FBYyxDQUFjLENBQUM7UUFDeEUsSUFBSyxRQUFRLEVBQ2I7WUFDQyxJQUFJLEdBQUcsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDO1lBRXpCLGlCQUFpQixDQUFDLGNBQWMsQ0FBRSxHQUFHLENBQUUsQ0FBQztZQUN4Qyw0QkFBNEIsRUFBRSxDQUFDO1NBQy9CO0lBQ0YsQ0FBQztJQWhCZSxzQ0FBMEIsNkJBZ0J6QyxDQUFBO0lBQUEsQ0FBQztJQUVGLFNBQVMsV0FBVztRQUVuQixJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUUsY0FBYyxDQUFjLENBQUM7UUFDeEUsSUFBSyxRQUFRLElBQUksUUFBUSxDQUFDLE9BQU8sRUFBRSxFQUNuQztZQUNDLElBQUksZ0JBQWdCLEdBQUcsaUJBQWlCLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDMUQsSUFBSyxnQkFBZ0IsR0FBRyxDQUFDLEVBQ3pCO2dCQUNDLG9CQUFvQixHQUFHLGdCQUFnQixDQUFDO2dCQUN4QyxpQkFBaUIsQ0FBQyxjQUFjLENBQUUsQ0FBQyxDQUFFLENBQUM7Z0JBQ3RDLHlCQUF5QixFQUFFLENBQUM7YUFDNUI7U0FDRDtJQUNGLENBQUM7SUFFRCxTQUFnQix5QkFBeUI7UUFFeEMsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFFLGNBQWMsQ0FBYyxDQUFDO1FBQ3hFLElBQUssUUFBUSxFQUNiO1lBQ0MsRUFBRSxnQ0FBZ0MsQ0FBQztZQUNuQyxRQUFRLENBQUMsS0FBSyxHQUFHLGlCQUFpQixDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3BELDRCQUE0QixFQUFFLENBQUM7U0FDL0I7SUFDRixDQUFDO0lBVGUscUNBQXlCLDRCQVN4QyxDQUFBO0lBQUEsQ0FBQztJQUVGLFNBQVMsNEJBQTRCO1FBRXBDLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBRSxjQUFjLENBQWMsQ0FBQztRQUN4RSxJQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUUsYUFBYSxDQUFhLENBQUM7UUFDM0UsSUFBSyxRQUFRLElBQUksYUFBYSxFQUM5QjtZQUNDLGFBQWEsQ0FBQyxRQUFRLENBQUUsQ0FBRSxRQUFRLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBRSxDQUFDLENBQUMsQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDLENBQUMsd0NBQXdDLENBQUUsQ0FBQztTQUNySTtJQUNGLENBQUM7SUFFRCxTQUFnQiwrQkFBK0I7UUFFeEMsMEJBQTBCLENBQUUsaUJBQWlCLENBQUMsY0FBYyxFQUFFLENBQUUsQ0FBQztJQUN4RSxDQUFDO0lBSGUsMkNBQStCLGtDQUc5QyxDQUFBO0lBQUEsQ0FBQztJQUVGLFNBQWdCLGNBQWMsQ0FBRSxPQUFnQixFQUFFLFVBQWlCO1FBRWxFLGlCQUFpQixDQUFDLGVBQWUsQ0FBRSxrQkFBa0IsRUFBRSxVQUFVLENBQUUsQ0FBQztJQUNyRSxDQUFDO0lBSGUsMEJBQWMsaUJBRzdCLENBQUE7SUFBQSxDQUFDO0lBRUYsU0FBZ0Isa0JBQWtCLENBQUUsT0FBZ0IsRUFBRSxJQUFXLEVBQUUsVUFBaUI7UUFHbkYsaUJBQWlCLENBQUMscUJBQXFCLENBQUUsa0JBQWtCLEVBQUUsSUFBSSxFQUFFLFVBQVUsQ0FBRSxDQUFDO0lBQ2pGLENBQUM7SUFKZSw4QkFBa0IscUJBSWpDLENBQUE7SUFBQSxDQUFDO0lBRUYsU0FBUywwQkFBMEIsQ0FBRSxlQUF1QjtRQUUzRCxJQUFLLElBQUksRUFDVDtZQUNDLElBQUssZUFBZSxFQUNwQjtnQkFDQyxJQUFJLENBQUMsaUJBQWlCLENBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUUsb0NBQW9DLEdBQUcsT0FBTyxDQUFDLDBCQUEwQixFQUFFLEdBQUcsR0FBRyxHQUFHLGlCQUFpQixDQUFDLHFCQUFxQixFQUFFLENBQUUsQ0FBQyxDQUFDO2dCQVE5SyxJQUFJLGlDQUFpQyxHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBRSxpQ0FBaUMsQ0FBRSxDQUFDO2dCQUN4RyxJQUFJLHFCQUFxQixHQUFHLGlCQUFpQixDQUFDLDBCQUEwQixFQUFFLENBQUM7Z0JBQzNFLElBQUkscUJBQXFCLEdBQUcscUJBQXFCLENBQUM7Z0JBQ2xELGlDQUFpQyxDQUFDLFFBQVEsRUFBRSxDQUFDLE9BQU8sQ0FBRSxVQUFVLE9BQU87b0JBQ3RFLElBQUssT0FBTyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUUscUJBQXFCLENBQUUsRUFDbkQ7d0JBQ0MsSUFBSSxzQkFBc0IsR0FBRyxPQUFPLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBRSxxQkFBcUIsQ0FBQyxNQUFNLEVBQUUscUJBQXFCLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBRSxDQUFDO3dCQUNwSCxPQUFPLENBQUMsV0FBVyxDQUFFLFFBQVEsRUFBRSxxQkFBcUIsQ0FBQyxPQUFPLENBQUUsc0JBQXNCLENBQUUsR0FBRyxDQUFDLENBQUUsQ0FBQztxQkFDN0Y7Z0JBQ0YsQ0FBQyxDQUFFLENBQUM7Z0JBRUosSUFBSSxrQkFBa0IsRUFDdEI7b0JBQ0Msa0JBQWtCLEdBQUcsS0FBSyxDQUFDO29CQUMzQixlQUFlLEVBQUUsQ0FBQztvQkFDbEIsa0JBQWtCLEVBQUUsQ0FBQztvQkFDckIsV0FBVyxFQUFFLENBQUM7aUJBQ2Q7YUFDRDtpQkFFRDtnQkFDQyxDQUFDLENBQUMsYUFBYSxDQUFFLG1CQUFtQixDQUFFLENBQUM7YUFDdkM7WUFFUSxJQUFJLENBQUMsV0FBVyxDQUFFLFFBQVEsRUFBRSxDQUFDLGVBQWUsQ0FBRSxDQUFDO1NBQ3hEO0lBQ0YsQ0FBQztJQUFBLENBQUM7SUFLQztRQUNJLEtBQUssRUFBRSxDQUFDO1FBQ1IsQ0FBQyxDQUFDLHlCQUF5QixDQUFDLDhDQUE4QyxFQUFFLHFCQUFxQixDQUFFLENBQUM7UUFDcEcsQ0FBQyxDQUFDLHlCQUF5QixDQUFDLCtDQUErQyxFQUFFLCtCQUErQixDQUFFLENBQUM7UUFDL0csQ0FBQyxDQUFDLHlCQUF5QixDQUFDLGdEQUFnRCxFQUFFLHlCQUF5QixDQUFFLENBQUM7UUFDMUcsQ0FBQyxDQUFDLHlCQUF5QixDQUFDLGtCQUFrQixFQUFFLGlCQUFpQixDQUFFLENBQUM7UUFDcEUsQ0FBQyxDQUFDLHlCQUF5QixDQUFDLGtCQUFrQixFQUFFLGlCQUFpQixDQUFFLENBQUM7UUFDMUUsQ0FBQyxDQUFDLHlCQUF5QixDQUFDLGlCQUFpQixFQUFFLFdBQVcsQ0FBRSxDQUFDO1FBR3ZELENBQUMsQ0FBQyxvQkFBb0IsQ0FBRSxlQUFlLEVBQUUsQ0FBQyxDQUFDLGVBQWUsRUFBRSxFQUFFLGNBQWMsQ0FBRSxDQUFDO1FBQy9FLENBQUMsQ0FBQyxvQkFBb0IsQ0FBRSxtQkFBbUIsRUFBRSxDQUFDLENBQUMsZUFBZSxFQUFFLEVBQUUsa0JBQWtCLENBQUUsQ0FBQztLQUMxRjtBQUNMLENBQUMsRUF2U1MsV0FBVyxLQUFYLFdBQVcsUUF1U3BCO0FBQUEsQ0FBQyJ9