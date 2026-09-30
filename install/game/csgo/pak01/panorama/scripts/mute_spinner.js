"use strict";
/// <reference path="csgo.d.ts" />
var MuteSpinner;
(function (MuteSpinner) {
    let m_curVal;
    let m_isMuted;
    let m_hFadeOutMuteBar = undefined;
    function HasXuid(elPanel) {
        return 'xuid' in elPanel;
    }
    function ToggleMute() {
        let elSpinner = $.GetContextPanel().FindChildTraverse('id-mute-spinner');
        $.Msg("mute: " + m_isMuted);
        $.Msg("vol: " + m_curVal);
        $.Msg("spinlock: " + elSpinner.spinlock);
        const elParent = $.GetContextPanel().GetParent();
        if (HasXuid(elParent)) {
            let xuid = elParent.xuid;
            GameStateAPI.ToggleMute(xuid);
            UpdateVolumeDisplay();
        }
    }
    MuteSpinner.ToggleMute = ToggleMute;
    function _GetCurrentValues() {
        const elParent = $.GetContextPanel().GetParent();
        if (HasXuid(elParent)) {
            let xuid = elParent.xuid;
            m_curVal = GameStateAPI.GetPlayerVoiceVolume(xuid).toFixed(2);
            m_isMuted = GameStateAPI.IsSelectedPlayerMuted(xuid);
            let locMsg = GameStateAPI.HasCommunicationBan(xuid) ? '#tooltip_cannot_unmute' : '#tooltip_mute';
            $.GetContextPanel().SetDialogVariableLocString('mute_tooltip_message', locMsg);
            if (m_isMuted === undefined)
                m_isMuted = false;
        }
    }
    function _OnValueChanged(panel, flNewVal) {
        const elParent = $.GetContextPanel().GetParent();
        if (HasXuid(elParent)) {
            let xuid = elParent.xuid;
            let sNewVal = flNewVal.toFixed(2);
            _GetCurrentValues();
            if (m_curVal != sNewVal) {
                GameStateAPI.SetPlayerVoiceVolume(xuid, Number(sNewVal));
                UpdateVolumeDisplay();
                // animate the bar
                let elMuteBar = $.GetContextPanel().FindChildTraverse('id-mute-bar');
                if (elMuteBar) {
                    elMuteBar.RemoveClass("fade");
                    elMuteBar.style.height = Number(m_curVal) * 100 + "%";
                    if (m_hFadeOutMuteBar != undefined)
                        $.CancelScheduled(m_hFadeOutMuteBar);
                    m_hFadeOutMuteBar = $.Schedule(0.5, () => {
                        elMuteBar.AddClass("fade");
                        m_hFadeOutMuteBar = undefined;
                    });
                }
            }
        }
    }
    function UpdateVolumeDisplay() {
        _GetCurrentValues();
        $.Msg("mute: " + m_isMuted);
        $.Msg("vol: " + m_curVal);
        $.GetContextPanel().SetDialogVariable('value', (Number(m_curVal) * 100).toFixed(0));
        let elSpinner = $.GetContextPanel().FindChildTraverse('id-mute-spinner');
        let elSpinnerBar = $.GetContextPanel().FindChildTraverse('id-mute-bar');
        if (!elSpinnerBar || !elSpinnerBar.IsValid())
            return;
        let elSpinnerLabel = $.GetContextPanel().FindChildTraverse('id-mute-value');
        if (!elSpinnerLabel || !elSpinnerLabel.IsValid())
            return;
        let elMutedImage = $.GetContextPanel().FindChildTraverse('id-mute-muted-img');
        if (!elMutedImage || !elMutedImage.IsValid())
            return;
        if (m_isMuted) {
            elMutedImage.RemoveClass("hidden");
            elSpinnerLabel.AddClass("hidden");
            elSpinnerBar.AddClass("hidden");
            elSpinner.AddClass('muted');
        }
        else {
            elMutedImage.AddClass("hidden");
            elSpinnerLabel.RemoveClass("hidden");
            elSpinnerBar.RemoveClass("hidden");
            elSpinner.RemoveClass('muted');
        }
        elSpinner.spinlock = m_isMuted;
    }
    MuteSpinner.UpdateVolumeDisplay = UpdateVolumeDisplay;
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        $.RegisterEventHandler("SpinnerValueChanged", $.GetContextPanel(), _OnValueChanged);
    }
})(MuteSpinner || (MuteSpinner = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXV0ZV9zcGlubmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvbXV0ZV9zcGlubmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFFbEMsSUFBVSxXQUFXLENBcUlwQjtBQXJJRCxXQUFVLFdBQVc7SUFFcEIsSUFBSSxRQUE0QixDQUFDO0lBQ2pDLElBQUksU0FBOEIsQ0FBQztJQUNuQyxJQUFJLGlCQUFpQixHQUF1QixTQUFTLENBQUM7SUFFdEQsU0FBUyxPQUFPLENBQUUsT0FBZ0I7UUFFakMsT0FBTyxNQUFNLElBQUksT0FBTyxDQUFDO0lBQzFCLENBQUM7SUFFRCxTQUFnQixVQUFVO1FBRXpCLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBRSxpQkFBaUIsQ0FBZSxDQUFDO1FBRXhGLENBQUMsQ0FBQyxHQUFHLENBQUUsUUFBUSxHQUFHLFNBQVMsQ0FBRSxDQUFDO1FBQzlCLENBQUMsQ0FBQyxHQUFHLENBQUUsT0FBTyxHQUFHLFFBQVEsQ0FBRSxDQUFDO1FBQzVCLENBQUMsQ0FBQyxHQUFHLENBQUUsWUFBWSxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUUsQ0FBQztRQUUzQyxNQUFNLFFBQVEsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDakQsSUFBSyxPQUFPLENBQUUsUUFBUSxDQUFFLEVBQ3hCO1lBQ0MsSUFBSSxJQUFJLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQztZQUV6QixZQUFZLENBQUMsVUFBVSxDQUFFLElBQUksQ0FBRSxDQUFDO1lBRWhDLG1CQUFtQixFQUFFLENBQUM7U0FDdEI7SUFDRixDQUFDO0lBakJlLHNCQUFVLGFBaUJ6QixDQUFBO0lBRUQsU0FBUyxpQkFBaUI7UUFFekIsTUFBTSxRQUFRLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFB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