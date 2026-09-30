"use strict";
/// <reference path="../csgo.d.ts" />
var HoldButton;
(function (HoldButton) {
    let m_LoopingSounds = {};
    let _m_btnSettings = {
        holdTimer: 0,
        holdTimeMax: 10,
        holdTimerHandle: null,
        isButtonPressed: false
    };
    function StartLoopingSound(s) {
        if (!s)
            return;
        if (m_LoopingSounds[s] !== undefined)
            return;
        m_LoopingSounds[s] = UiToolkitAPI.PlaySoundEvent(s);
    }
    HoldButton.StartLoopingSound = StartLoopingSound;
    function StopLoopingSound(s) {
        if (!s)
            return;
        if (m_LoopingSounds[s] === undefined)
            return;
        UiToolkitAPI.StopSoundEvent(m_LoopingSounds[s], 0);
        m_LoopingSounds[s] = undefined;
    }
    HoldButton.StopLoopingSound = StopLoopingSound;
    function SetupButton(settings) {
        if (!settings.btn)
            return;
        if ('tooltip' in settings && settings.tooltip !== '') {
            settings.btn.SetPanelEvent('onmouseover', () => {
                if (settings.btn.enabled) {
                    UiToolkitAPI.ShowTextTooltipStyled(settings.btn.id, settings.tooltip, ('tooltipStyle' in settings) ? settings.tooltipStyle : '');
                }
            });
            settings.btn.SetPanelEvent('onmouseout', () => { UiToolkitAPI.HideTextTooltip(); });
        }
        settings.btn.SetDialogVariable('action-label', $.Localize(settings.locString));
        settings.btn.SetPanelEvent('onmouseup', () => _OnMouseUp(settings));
        settings.btn.SetPanelEvent('onmousedown', () => _OnMouseDown(settings));
    }
    HoldButton.SetupButton = SetupButton;
    function _OnMouseUp(settings) {
        CancelButtonTimer(settings);
        _m_btnSettings.isButtonPressed = false;
        _m_btnSettings.holdTimer = 0;
        settings.btn.FindChild('id-response-btn-timer').visible = false;
        settings.btn.FindChild('id-response-btn-timer').style.width = '0%;';
        if ('mouseUpAction' in settings)
            settings.mouseUpAction();
    }
    function _OnMouseDown(settings) {
        CancelButtonTimer(settings);
        _m_btnSettings.isButtonPressed = true;
        _m_btnSettings.holdTimer = 0;
        IncrementButtonTimer(settings);
    }
    function CancelButtonTimer(settings) {
        if (_m_btnSettings.holdTimerHandle !== null) {
            $.CancelScheduled(_m_btnSettings.holdTimerHandle);
            if ('cancelTimerAction' in settings) {
                settings.cancelTimerAction();
            }
            StopLoopingSound(settings.loopingSound);
            _m_btnSettings.holdTimerHandle = null;
        }
    }
    function IncrementButtonTimer(settings) {
        ++_m_btnSettings.holdTimer;
        if (_m_btnSettings.holdTimer <= _m_btnSettings.holdTimeMax && _m_btnSettings.isButtonPressed) {
            settings.btn.FindChild('id-response-btn-timer').visible = true;
            settings.btn.FindChild('id-response-btn-timer').style.width = (_m_btnSettings.holdTimer * 10) + '%;';
            if (_m_btnSettings.holdTimerHandle == null) {
                _m_btnSettings.holdTimerHandle = $.Schedule(.1, () => IncrementButtonTimer(settings));
                StartLoopingSound(settings.loopingSound);
            }
            else {
                $.Schedule(.1, () => IncrementButtonTimer(settings));
            }
            return;
        }
        if (_m_btnSettings.isButtonPressed) {
            if ('timerCompleteAction' in settings)
                settings.timerCompleteAction();
        }
        _OnMouseUp(settings);
    }
})(HoldButton || (HoldButton = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9sZF9idXR0b24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9jb21tb24vaG9sZF9idXR0b24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUVyQyxJQUFVLFVBQVUsQ0EySW5CO0FBM0lELFdBQVUsVUFBVTtJQXFCaEIsSUFBSSxlQUFlLEdBQXlCLEVBQUUsQ0FBQztJQUUvQyxJQUFJLGNBQWMsR0FBcUI7UUFFbkMsU0FBUyxFQUFFLENBQUM7UUFDWixXQUFXLEVBQUUsRUFBRTtRQUNmLGVBQWUsRUFBRSxJQUFJO1FBQ3JCLGVBQWUsRUFBRSxLQUFLO0tBQ3pCLENBQUE7SUFFRCxTQUFnQixpQkFBaUIsQ0FBRSxDQUFTO1FBRTlDLElBQUssQ0FBQyxDQUFDO1lBQUcsT0FBTztRQUNqQixJQUFLLGVBQWUsQ0FBQyxDQUFDLENBQUMsS0FBSyxTQUFTO1lBQUcsT0FBTztRQUMvQyxlQUFlLENBQUUsQ0FBQyxDQUFFLEdBQUcsWUFBWSxDQUFDLGNBQWMsQ0FBRSxDQUFDLENBQUUsQ0FBQztJQUN6RCxDQUFDO0lBTGtCLDRCQUFpQixvQkFLbkMsQ0FBQTtJQUVELFNBQWdCLGdCQUFnQixDQUFFLENBQVM7UUFFMUMsSUFBSyxDQUFDLENBQUM7WUFBRyxPQUFPO1FBQ2pCLElBQUssZUFBZSxDQUFDLENBQUMsQ0FBQyxLQUFLLFNBQVM7WUFBRyxPQUFPO1FBQy9DLFlBQVksQ0FBQyxjQUFjLENBQUUsZUFBZSxDQUFDLENBQUMsQ0FBRSxFQUFFLENBQUMsQ0FBRSxDQUFDO1FBQ3RELGVBQWUsQ0FBQyxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUM7SUFDaEMsQ0FBQztJQU5lLDJCQUFnQixtQkFNL0IsQ0FBQTtJQUVFLFNBQWdCLFdBQVcsQ0FBRSxRQUEyQjtRQUVwRCxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUc7WUFDYixPQUFNO1FBRVYsSUFBSSxT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