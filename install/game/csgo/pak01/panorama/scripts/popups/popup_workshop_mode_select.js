"use strict";
/// <reference path="..//csgo.d.ts" />
var PopupWorkshopModeSelect;
(function (PopupWorkshopModeSelect) {
    let m_elPopup = null;
    let m_elButtonContainer;
    let m_elButtons = [];
    function Init() {
        m_elButtons = [];
        m_elPopup = $.GetContextPanel();
        m_elButtonContainer = m_elPopup.FindChildTraverse('popup-workshop-mode-items');
        m_elPopup.FindChildTraverse('GoButton').SetPanelEvent('onactivate', _Apply);
        m_elPopup.FindChildTraverse('CancelButton').SetPanelEvent('onactivate', _Cancel);
        let strModes = m_elPopup.GetAttributeString('workshop-modes', '');
        if (!strModes)
            strModes = 'casual';
        let modes = [];
        modes = strModes.split(',');
        if (modes.length <= 1) {
            _Apply(modes[0]);
            return;
        }
        _InitModes(modes);
    }
    PopupWorkshopModeSelect.Init = Init;
    function _InitModes(modes) {
        m_elButtons.forEach(elButton => elButton.DeleteAsync(0.0));
        m_elButtons = [];
        for (let i = 0; i < modes.length; ++i) {
            let strMode = modes[i];
            if (!strMode) {
                continue;
            }
            let elButton = $.CreatePanel('RadioButton', m_elButtonContainer, undefined);
            elButton.BLoadLayoutSnippet('workshop-mode-item');
            elButton.SetAttributeString('data-mode', strMode);
            elButton.SetDialogVariable('workshop-mode-item-name', $.Localize('#CSGO_Workshop_Mode_' + strMode));
            if (i === 0)
                elButton.checked = true;
            m_elButtons.push(elButton);
        }
    }
    function _Apply(singleModeOverride = '') {
        let strGameMode = 'casual';
        let nSkirmishId = 0;
        if (singleModeOverride !== '') {
            strGameMode = singleModeOverride;
        }
        else {
            let elSelectedButton = m_elButtons.find(elButton => elButton.checked);
            if (elSelectedButton)
                strGameMode = elSelectedButton.GetAttributeString('data-mode', strGameMode);
        }
        let strGameType = GameTypesAPI.GetGameModeType(strGameMode);
        if (!strGameType) {
            nSkirmishId = GameTypesAPI.GetSkirmishIdFromInternalName(strGameMode);
            if (nSkirmishId !== 0) {
                strGameMode = 'skirmish';
                strGameType = 'skirmish';
            }
        }
        if (!strGameType) {
            strGameType = 'classic';
            strGameMode = 'casual';
        }
        let settings = {
            update: {
                Game: {
                    type: strGameType,
                    mode: strGameMode,
                }
            }
        };
        if (nSkirmishId !== 0) {
            settings.update.Game.skirmishmode = nSkirmishId;
        }
        else {
            settings.delete = {
                Game: {
                    skirmishmode: '#empty#'
                }
            };
        }
        $.DispatchEvent('UIPopupButtonClicked', '');
        LobbyAPI.UpdateSessionSettings(settings);
        LobbyAPI.StartMatchmaking("", "", "", "");
    }
    ;
    function _Cancel() {
        $.DispatchEvent('UIPopupButtonClicked', '');
    }
    ;
})(PopupWorkshopModeSelect || (PopupWorkshopModeSelect = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfd29ya3Nob3BfbW9kZV9zZWxlY3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfd29ya3Nob3BfbW9kZV9zZWxlY3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHNDQUFzQztBQUV0QyxJQUFVLHVCQUF1QixDQW1JaEM7QUFuSUQsV0FBVSx1QkFBdUI7SUFFaEMsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDO0lBQ3JCLElBQUksbUJBQTRCLENBQUM7SUFDakMsSUFBSSxXQUFXLEdBQW9CLEVBQUUsQ0FBQztJQUV0QyxTQUFnQixJQUFJO1FBR25CLFdBQVcsR0FBRyxFQUFFLENBQUM7UUFDakIsU0FBUyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUNoQyxtQkFBbUIsR0FBRyxTQUFTLENBQUMsaUJBQWlCLENBQUUsMkJBQTJCLENBQUUsQ0FBQztRQUdqRixTQUFTLENBQUMsaUJBQWlCLENBQUUsVUFBVSxDQUFFLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxNQUFNLENBQUUsQ0FBQztRQUNoRixTQUFTLENBQUMsaUJBQWlCLENBQUUsY0FBYyxDQUFFLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxPQUFPLENBQUUsQ0FBQztRQUVyRixJQUFJLFFBQVEsR0FBRyxTQUFTLENBQUMsa0JBQWtCLENBQUUsZ0JBQWdCLEVBQUUsRUFBRSxDQUFFLENBQUM7UUFDcEUsSUFBSyxDQUFDLFFBQVE7WUFDYixRQUFRLEdBQUcsUUFBUSxDQUFDO1FBRXJCLElBQUksS0FBSyxHQUFZLEVBQUUsQ0FBQztRQUN4QixLQUFLLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBRSxHQUFHLENBQUUsQ0FBQztRQUU5QixJQUFHLEtBQUssQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUNwQjtZQUNDLE1BQU0sQ0FBRSxLQUFLLENBQUMsQ0FBQyxDQUFD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