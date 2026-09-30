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
    {
        $.RegisterEventHandler("SpinnerValueChanged", $.GetContextPanel(), _OnValueChanged);
    }
})(MuteSpinner || (MuteSpinner = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXV0ZV9zcGlubmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvbXV0ZV9zcGlubmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFFbEMsSUFBVSxXQUFXLENBcUlwQjtBQXJJRCxXQUFVLFdBQVc7SUFFcEIsSUFBSSxRQUE0QixDQUFDO0lBQ2pDLElBQUksU0FBOEIsQ0FBQztJQUNuQyxJQUFJLGlCQUFpQixHQUF1QixTQUFTLENBQUM7SUFFdEQsU0FBUyxPQUFPLENBQUUsT0FBZ0I7UUFFakMsT0FBTyxNQUFNLElBQUksT0FBTyxDQUFDO0lBQzFCLENBQUM7SUFFRCxTQUFnQixVQUFVO1FBRXpCLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBRSxpQkFBaUIsQ0FBZSxDQUFDO1FBTXhGLE1BQU0sUUFBUSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNqRCxJQUFLLE9BQU8sQ0FBRSxRQUFRLENBQUUsRUFDeEI7WUFDQyxJQUFJLElBQUksR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDO1lBRXpCLFlBQVksQ0FBQyxVQUFVLENBQUUsSUFBSSxDQUFFLENBQUM7WUFFaEMsbUJBQW1CLEVBQUUsQ0FBQztTQUN0QjtJQUNGLENBQUM7SUFqQmUsc0JBQVUsYUFpQnpCLENBQUE7SUFFRCxTQUFTLGlCQUFpQjtRQUV6QixNQUFNLFFBQVEsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDakQsSUFBSyxPQUFPLENBQUUsUUFBUSxDQUFFLEVBQ3hCO1lBQ0MsSUFBSSxJQUFJLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQztZQUV6QixRQUFRLEdBQUcsWUFBWSxDQUFDLG9CQUFvQixDQUFFLElBQUksQ0FBRSxDQUFDLE9BQU8sQ0FBRSxD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