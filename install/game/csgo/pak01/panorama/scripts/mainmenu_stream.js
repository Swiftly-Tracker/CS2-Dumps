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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbm1lbnVfc3RyZWFtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvbWFpbm1lbnVfc3RyZWFtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxzQ0FBc0M7QUFFdEMsSUFBVSxXQUFXLENBcVNwQjtBQXJTRCxXQUFVLFdBQVc7SUFFcEIsSUFBSSxJQUFhLENBQUM7SUFDbEIsSUFBSSxrQkFBMEIsQ0FBQztJQUMvQixJQUFJLGNBQWMsR0FBRyxJQUFJLENBQUM7SUFDMUIsSUFBSSxpQkFBaUIsR0FBRyxJQUFJLENBQUM7SUFDN0IsSUFBSSxvQkFBb0IsR0FBRyxDQUFDLENBQUM7SUFDN0IsSUFBSSxnQ0FBZ0MsR0FBRyxDQUFDLENBQUM7SUFDekMsSUFBSSxrQkFBa0IsR0FBVyxLQUFLLENBQUM7SUFDcEMsTUFBTSxjQUFjLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDO0lBQ3ZELE1BQU0sWUFBWSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztJQUVoRixTQUFTLEtBQUs7UUFFYixJQUFJLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQzNCLHFCQUFxQixFQUFFLENBQUM7UUFDbEIsSUFBSSxDQUFDLFdBQVcsQ0FBRSxxQkFBcUIsRUFBRSxLQUFLLENBQUUsQ0FBQztJQUN4RCxDQUFDO0lBRUQsU0FBUyxZQUFZO1FBRXBCLGNBQWMsR0FBRyxLQUFLLENBQUM7UUFDdkIsa0JBQWtCLEdBQUcsSUFBSSxDQUFDO1FBQ3pCLHFCQUFxQixFQUFFLENBQUM7SUFDMUIsQ0FBQztJQUFBLENBQUM7SUFFRixTQUFTLGVBQWU7UUFFdkIsSUFBSSxDQUFDLFdBQVcsQ0FBRSxpQkFBaUIsRUFBRSxJQUFJLENBQUUsQ0FBQztRQUM1QyxJQUFJ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