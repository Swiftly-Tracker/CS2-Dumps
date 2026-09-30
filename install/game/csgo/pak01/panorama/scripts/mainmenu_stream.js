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
        m_userClosedStream = true; // keep track of if user closed stream so we bring it back always docked, small and muted
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
        m_cp.style.y = "0px"; // Undoing a fixed y value that I think is coming from left column animation.
        m_cp.style.x = "0px"; // Undoing a fixed y value that I think is coming from left column animation.
        $.Schedule(.25, () => { elDragPanel.style.width = 'fit-children'; });
        let rightOffset = 140;
        let xpos = (elDragPanel.GetParent().actuallayoutwidth / elDragPanel.GetParent().actualuiscale_x);
        xpos = xpos - ((m_cp.actuallayoutwidth / m_cp.actualuiscale_x) + rightOffset);
        let ypos = (elDragPanel.GetParent().actuallayoutheight / elDragPanel.GetParent().actualuiscale_y);
        ypos = ypos - ((m_cp.actuallayoutheight / m_cp.actualuiscale_y) + rightOffset);
        elDragPanel.SetDragPosition(xpos, ypos); // A nice spot right above the current store. This is hard coded and bad.
        m_cp.SetHasClass('stream-drag-enabled', true);
    }
    function _StreamDragDisable() {
        // m_cp.SetHasClass( 'drag-disable-transition', true );
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
        m_bAllowStream = true; // re-activate main stream when you come back to main menu
        _UpdateEmbeddedStream();
    }
    ;
    function _UpdateEmbeddedStream() {
        let urlStreamFeed = EmbeddedStreamAPI.GetStreamFeedSourceURL();
        $.Msg('STREAM _UpdateEmbeddedStream: ' + urlStreamFeed + (m_bAllowStream ? " (allowed)" : " (closed)") + (m_bMainMenuActive ? " main menu" : " hidden"));
        let elStreamPanelFeed = m_cp.FindChildInLayoutFile('StreamPanelFeed');
        if (!m_bAllowStream || !m_bMainMenuActive) {
            urlStreamFeed = '';
        }
        if (urlStreamFeed) {
            if (!elStreamPanelFeed) {
                // Create the Stream feed panel 
                elStreamPanelFeed = $.CreatePanel('Panel', m_cp, 'StreamPanelFeed');
                elStreamPanelFeed.BLoadLayoutSnippet('stream-panel');
                // Set the slider configuration
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
            //
            // Configure the stream (possibly new URL changed)
            //
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
            $.Msg('STREAM Volume slider dragged to ' + vol);
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
        $.Msg('STREAM _UpdateEmbeddedStream: _HTMLFinishRequest ' + (elPanel == m_elEmbeddedStream ? '(embedded)' : '(unexpected)') + ' >> ' + sUrl + ' = ' + sPageTitle);
        EmbeddedStreamAPI.PanoramaFinishRequest(m_elEmbeddedStream, sUrl, sPageTitle);
    }
    StreamPanel._HTMLFinishRequest = _HTMLFinishRequest;
    ;
    function _SetClassesForVideoPlaying(bIsVideoPlaying) {
        if (m_cp) {
            if (bIsVideoPlaying) {
                m_cp.SetDialogVariable('title', $.Localize('#SFUI_MajorEventVenue_StreamTitle_' + NewsAPI.GetActiveTournamentEventID() + '_' + EmbeddedStreamAPI.GetStreamEventVenueID()));
                //
                // Set the available external buttons
                //
                // GC configuration specifies existing types, e.g.:
                // csgo_gc_blog_url "*XY=https://gaming.youtube.com/faceit/live*XT=https://www.twitch.tv/faceittv*T=SYTG*L=2@https://steamcommunity.com/broadcast/watch/76561197988571531"
                //
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
                    m_userClosedStream = false; // act once, and allow user to move
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
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        _Init();
        $.RegisterForUnhandledEvent("PanoramaComponent_EmbeddedStream_VideoReload", _UpdateEmbeddedStream);
        $.RegisterForUnhandledEvent("PanoramaComponent_EmbeddedStream_VideoPlaying", _UpdateEmbeddedStreamVisibility);
        $.RegisterForUnhandledEvent("PanoramaComponent_EmbeddedStream_VolumeChanged", _OnVolumeCodeValueChanged);
        $.RegisterForUnhandledEvent("CSGOHideMainMenu", _CSGOHideMainMenu);
        $.RegisterForUnhandledEvent("CSGOShowMainMenu", _CSGOShowMainMenu);
        $.RegisterForUnhandledEvent("MuteStreamPanel", _MuteStream);
        // These events are fired specifically to our HTML panel (other panels may exist)
        $.RegisterEventHandler("HTMLJSAlertV8", $.GetContextPanel(), _HTMLJSAlertV8);
        $.RegisterEventHandler("HTMLFinishRequest", $.GetContextPanel(), _HTMLFinishRequest);
    }
})(StreamPanel || (StreamPanel = {}));
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbm1lbnVfc3RyZWFtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvbWFpbm1lbnVfc3RyZWFtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxzQ0FBc0M7QUFFdEMsSUFBVSxXQUFXLENBcVNwQjtBQXJTRCxXQUFVLFdBQVc7SUFFcEIsSUFBSSxJQUFhLENBQUM7SUFDbEIsSUFBSSxrQkFBMEIsQ0FBQztJQUMvQixJQUFJLGNBQWMsR0FBRyxJQUFJLENBQUM7SUFDMUIsSUFBSSxpQkFBaUIsR0FBRyxJQUFJLENBQUM7SUFDN0IsSUFBSSxvQkFBb0IsR0FBRyxDQUFDLENBQUM7SUFDN0IsSUFBSSxnQ0FBZ0MsR0FBRyxDQUFDLENBQUM7SUFDekMsSUFBSSxrQkFBa0IsR0FBVyxLQUFLLENBQUM7SUFDcEMsTUFBTSxjQUFjLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDO0lBQ3ZELE1BQU0sWUFBWSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztJQUVoRixTQUFTLEtBQUs7UUFFYixJQUFJLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQzNCLHFCQUFxQixFQUFFLENBQUM7UUFDbEIsSUFBSSxDQUFDLFdBQVcsQ0FBRSxxQkFBcUIsRUFBRSxLQUFLLENBQUUsQ0FBQztJQUN4RCxDQUFDO0lBRUQsU0FBUyxZQUFZO1FBRXBCLGNBQWMsR0FBRyxLQUFLLENBQUM7UUFDdkIsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLENBQUMseUZBQXlGO1FBQ25ILHFCQUFxQixFQUFFLENBQUM7SUFDMUIsQ0FBQztJQUFBLENBQUM7SUFFRixTQUFTLGVBQWU7UUFFdkIsSUFBSSxDQUFDLFdBQVcsQ0FBRSxpQkFBaUIsRUFBRSxJQUFJLENBQUUsQ0FB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