"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../inspect.ts" />
/// <reference path="../common/characteranims.ts" />
var PopupPetEvent;
(function (PopupPetEvent) {
    const _m_cp = $.GetContextPanel();
    const _m_elPetFrame = $.GetContextPanel().FindChildInLayoutFile('id-pet-event-frame');
    const _m_elItemModelImagePanel = _m_cp.FindChildInLayoutFile('id-pet-model');
    let _m_elCloseBtn = null;
    let _m_bWaitingOnContinue = false;
    let _m_event;
    let _m_elPreviewPanel;
    const SEQ_FLY_AWAY = 'chick_retirement01';
    const SEQ_GRUMPY_RETIRE = 'chick_retirement02';
    const NEGLECT_FADE_SEC = 5;
    const NEGLECT_LINE_COUNT = 3;
    const NEGLECT_EGG_LINE_COUNT = 3;
    const PLAY_EVENT_DELAY_SEC = .1;
    const DISMISS_DELAY_SEC = 4;
    function _ParsePetEvent() {
        const popupPetParams = _m_cp.GetAttributeString('pet_id', '').split(',');
        const petItemId = popupPetParams.length > 0 ? popupPetParams[0] : '';
        const strSecond = popupPetParams.length > 1 ? popupPetParams[1] : '';
        const bExpired = (strSecond === 'maxage' || strSecond === 'nofood');
        const upgradeLevel = Number(InventoryAPI.GetItemAttributeValue(petItemId, '{uint32}upgrade level'));
        return {
            petItemId: petItemId,
            previousPetItemId: (bExpired || !strSecond) ? petItemId : strSecond,
            upgradeLevel: upgradeLevel,
            expiryReason: bExpired ? strSecond : '',
            bMaxAge: strSecond === 'maxage',
            bEggNoFood: upgradeLevel === 0 && strSecond === 'nofood',
        };
    }
    function Init() {
        _m_event = _ParsePetEvent();
        GameInterfaceAPI.SetChickenAudioExempt('pet_event', true);
        _m_cp.GetParent().GetParent().SetHasClass('pet-event-blur', true);
        _SetupCloseBtn('id-pet-event-close-btn');
        UiToolkitAPI.PlaySoundEvent('Chicken.Popup.Message');
        _m_elPetFrame.AddClass('show');
        _m_elPreviewPanel = _CreatePetPreviewPanel();
        _m_bWaitingOnContinue = true;
        if (_m_event.expiryReason) {
            _SetExpiryText();
        }
        else {
            _SetUpgradeText();
        }
        _SetupBookBtn();
        _SetupContinueBtn();
    }
    PopupPetEvent.Init = Init;
    function _SetExpiryText() {
        const strNeglect = _m_event.bEggNoFood ? 'nofood_egg' : 'nofood';
        const nNeglectLines = _m_event.bEggNoFood ? NEGLECT_EGG_LINE_COUNT : NEGLECT_LINE_COUNT;
        const strTitle = _m_event.bMaxAge ? _m_cp.GetAttributeString('title', '') : '#pet_expired_notification_title_' + strNeglect;
        const strBody = _m_event.bMaxAge ? (_EventPetBookId() !== '' ? '#pet_expired_notification_msg_maxage_book' : '#pet_expired_notification_msg_maxage')
            : '#pet_expired_notification_msg_' + strNeglect + '_' + Math.floor(Math.random() * nNeglectLines);
        _m_cp.SetDialogVariable('title', $.Localize(strTitle, _m_cp));
        _m_cp.SetDialogVariable('body', $.Localize(strBody, _m_cp));
    }
    function _PetBookId(strPetId) {
        if (!strPetId) {
            return '';
        }
        return GameInterfaceAPI.FindFiles('pet/' + strPetId + '/book/pet.bin', 'USRLOCAL').length > 0 ? strPetId : '';
    }
    function _EventPetBookId() {
        return _PetBookId(_m_cp.GetAttributeString('ack_exp_pet_id', '')) || _PetBookId(InventoryAPI.GetPetItemID());
    }
    function _SetupBookBtn() {
        _m_cp.FindChildInLayoutFile('id-pet-event-book-btn').SetPanelEvent('onactivate', () => {
            UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_pet_book.xml');
            Close();
        });
    }
    function _SetupContinueBtn() {
        const elContinueBtn = _m_cp.FindChildInLayoutFile('id-pet-event-continue-btn');
        elContinueBtn.SetHasClass('hide-btn', false);
        _m_elCloseBtn.SetHasClass('hide-btn', true);
        _SpawnPetEventItems();
        elContinueBtn.SetPanelEvent('onactivate', () => {
            elContinueBtn.enabled = false;
            elContinueBtn.SetHasClass('hide-btn', true);
            _m_cp.FindChildInLayoutFile('id-pet-event-text').SetHasClass('hide-text', true);
            $.Schedule(PLAY_EVENT_DELAY_SEC, () => { _PlayPetEvent(); });
            _RevealPet();
            $.Schedule(PLAY_EVENT_DELAY_SEC + DISMISS_DELAY_SEC, () => {
                _m_bWaitingOnContinue = false;
                if (_m_event.bMaxAge && _EventPetBookId()) {
                    _m_cp.FindChildInLayoutFile('id-pet-event-book-btn').SetHasClass('hide-btn', false);
                }
                _m_elCloseBtn.SetHasClass('hide-btn', false);
            });
            $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.resetSettings', 'MOUSE');
        });
    }
    function _RevealPet() {
        _m_cp.FindChildInLayoutFile('id-pet-white').AddClass('hide-white');
    }
    function _SetUpgradeText() {
        _m_cp.SetDialogVariable('title', $.Localize(_m_cp.GetAttributeString('title', ''), _m_cp));
        _m_cp.SetDialogVariable('body', $.Localize(_m_cp.GetAttributeString('msg', '') + '_' + _m_event.upgradeLevel, _m_cp));
    }
    function _SetupCloseBtn(btnId) {
        const callbackHandle = _m_cp.GetAttributeInt('callback', -1);
        const closeButton = _m_cp.FindChildTraverse(btnId);
        _m_elCloseBtn = closeButton;
        closeButton.SetPanelEvent('onactivate', () => {
            if (callbackHandle >= 0) {
                UiToolkitAPI.InvokeJSCallback(callbackHandle);
            }
            GameInterfaceAPI.SetChickenAudioExempt('pet_event', false);
            _m_cp.GetParent().GetParent().SetHasClass('pet-event-blur', false);
            _m_elPetFrame.RemoveClass('show');
            _m_cp.FindChildInLayoutFile('id-pet-white').RemoveClass('hide-white');
            $.DispatchEvent('UIPopupButtonClicked', '');
            $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.mainmenu_press_quit', 'MOUSE');
        });
    }
    function Close() {
        if (_m_bWaitingOnContinue) {
            return;
        }
        if (_m_elCloseBtn && _m_elCloseBtn.IsValid()) {
            $.DispatchEvent('Activated', _m_elCloseBtn, 'keyboard');
        }
    }
    PopupPetEvent.Close = Close;
    function _CreatePetPreviewPanel() {
        let mapName = GameInterfaceAPI.GetSettingString('ui_mainmenu_bkgnd_movie') + '_vanity';
        let elItemModelPreviewPanel = $.CreatePanel('MapPreviewPanel', _m_elItemModelImagePanel, 'PetUpgradePanel', {
            'require-composition-layer': 'true',
            'transparent-background': 'false',
            class: 'inspect-model-image-panel',
            camera: 'cam_gloves',
            map: mapName,
            panzoom_enabled: true,
            load_map_char_entities_as_info_targets: 'true',
            load_map_item_entities_as_info_targets: 'true',
        });
        _ResetMapEntities(mapName, elItemModelPreviewPanel);
        return elItemModelPreviewPanel;
    }
    function _SpawnPetEventItems() {
        if (_m_event.expiryReason) {
            if (_m_event.bEggNoFood) {
                _m_elPreviewPanel.SpawnModel('nest', 'models/nest/nest.vmdl', '', 'item11');
                return;
            }
            _m_elPreviewPanel.SpawnItem('adult', _m_event.petItemId, '', 'item13');
            return;
        }
        if (_m_event.upgradeLevel === 1) {
            _m_elPreviewPanel.SpawnModel('nest', 'models/nest/nest.vmdl', '', 'item9');
            _m_elPreviewPanel.SpawnModelWithItemID('egg', 'models/chicken/chicknegg.vmdl', _m_event.previousPetItemId, '', 'item9');
            _m_elPreviewPanel.SpawnItem('chick', _m_event.petItemId, '', 'item9');
        }
        else if (_m_event.upgradeLevel === 2) {
            _m_elPreviewPanel.SpawnItem('chick', _m_event.previousPetItemId, '', 'item11');
            _m_elPreviewPanel.SpawnItem('teen', _m_event.petItemId, '', 'item12');
        }
        else if (_m_event.upgradeLevel === 3) {
            _m_elPreviewPanel.SpawnItem('teen', _m_event.previousPetItemId, '', 'item12');
            _m_elPreviewPanel.SpawnItem('adult', _m_event.petItemId, '', 'item13');
        }
    }
    function _PlayPetEvent() {
        let camera = '';
        if (_m_event.expiryReason) {
            camera = _m_event.bMaxAge ? 'expiration' : _m_event.bEggNoFood ? 'pet_growth_teen' : 'retire';
            _m_elPreviewPanel.TransitionToCamera('cam_' + camera + '_intro', 0);
            _m_elPreviewPanel.FireEntityInput('adult', 'Alpha', '255');
            if (_m_event.bMaxAge) {
                $.Schedule(3, () => {
                    _m_elPreviewPanel.TransitionToCamera('cam_' + camera, 2);
                });
                _m_elPreviewPanel.PlaySequenceOnItem('adult', SEQ_FLY_AWAY);
            }
            else {
                $.Schedule(.25, () => {
                    _m_elPreviewPanel.TransitionToCamera('cam_' + camera, _m_event.bEggNoFood ? 15 : 5);
                });
                $.Schedule(_m_event.bEggNoFood ? 2 : NEGLECT_FADE_SEC, () => { _m_cp.FindChildInLayoutFile('id-pet-model-container').AddClass('fade-black'); });
                if (_m_event.bEggNoFood) {
                    return;
                }
                _m_elPreviewPanel.PlaySequenceOnItem('adult', SEQ_GRUMPY_RETIRE);
            }
            return;
        }
        if (_m_event.upgradeLevel === 1) {
            camera = 'egg_hatch';
            _m_elPreviewPanel.TransitionToCamera('cam_' + camera + '_intro', 0);
            _m_elPreviewPanel.TransitionToCamera('cam_' + camera, 4);
            let hatchNum = 1 + Math.floor(Math.random() * 2);
            _m_elPreviewPanel.PlaySequenceOnItem('egg', 'chicknegg_hatch0' + hatchNum);
            _m_elPreviewPanel.PlaySequenceOnItem('chick', 'chicknegg_hatch0' + hatchNum);
        }
        else if (_m_event.upgradeLevel === 2) {
            camera = 'pet_growth_teen';
            _m_elPreviewPanel.TransitionToCamera('cam_' + camera + '_intro', 0);
            _m_elPreviewPanel.PlaySequenceOnItem('chick', 'chick_chicken_reveal');
            _m_elPreviewPanel.FireEntityInput('teen', 'Alpha', '0');
            _m_elPreviewPanel.PlaySequenceOnItem('teen', 'chick_chicken_reveal');
            $.Schedule(4, () => {
                _m_elPreviewPanel.TransitionToCamera('cam_' + camera, 5);
                _m_elPreviewPanel.FireEntityInput('particle_growth', 'Start');
                _m_elPreviewPanel.FireEntityInput('chick', 'Alpha', '0');
                _m_elPreviewPanel.FireEntityInput('teen', 'Alpha', '255');
            });
        }
        else if (_m_event.upgradeLevel === 3) {
            camera = 'pet_growth_adult';
            _m_elPreviewPanel.TransitionToCamera('cam_' + camera + '_intro', 0);
            _m_elPreviewPanel.TransitionToCamera('cam_' + camera, 3);
            _m_elPreviewPanel.PlaySequenceOnItem('teen', 'chick_chicken_reveal02');
            _m_elPreviewPanel.FireEntityInput('adult', 'Alpha', '0');
            _m_elPreviewPanel.PlaySequenceOnItem('adult', 'chick_chicken_reveal02');
            $.Schedule(3.4, () => {
                _m_elPreviewPanel.FireEntityInput('particle_growth', 'Start');
                _m_elPreviewPanel.FireEntityInput('teen', 'Alpha', '0');
                _m_elPreviewPanel.FireEntityInput('adult', 'Alpha', '255');
            });
        }
    }
    function _ResetMapEntities(mapName, elItemModelPreviewPanel) {
        if (mapName === 'de_nuke_vanity') {
            InspectModelImage.SetSpotlightBrightness(elItemModelPreviewPanel);
        }
        else {
            InspectModelImage.SetSunBrightness(elItemModelPreviewPanel);
        }
        InspectModelImage.DisableItemLighting(elItemModelPreviewPanel);
    }
})(PopupPetEvent || (PopupPetEvent = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfcGV0X2V2ZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvcG9wdXBzL3BvcHVwX3BldF9ldmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBQ3JDLHNDQUFzQztBQUN0QyxvREFBb0Q7QUFFcEQsSUFBVSxhQUFhLENBNFd0QjtBQTVXRCxXQUFVLGFBQWE7SUFFdEIsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBQ2xDLE1BQU0sYUFBYSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0lBQ3RGLE1BQU0sd0JBQXdCLEdBQUcsS0FBSyxDQUFDLHFCQUFxQixDQUFFLGNBQWMsQ0FBRSxDQUFDO0lBQy9FLElBQUksYUFBYSxHQUFtQixJQUFJLENBQUM7SUFDekMsSUFBSSxxQkFBcUIsR0FBRyxLQUFLLENBQUM7SUFFbEMsSUFBSSxRQUFvQixDQUFDO0lBQ3pCLElBQUksaUJBQW9DLENBQUM7SUFFekMsTUFBTSxZQUFZLEdBQUcsb0JBQW9CLENBQUM7SUFDMUMsTUFBTSxpQkFBaUIsR0FBRyxvQkFBb0IsQ0FBQztJQUMvQyxNQUFNLGdCQUFnQixHQUFHLENBQUMsQ0FBQztJQUczQixNQUFNLGtCQUFrQixHQUFHLENBQUMsQ0FBQztJQUM3QixNQUFNLHNCQUFzQixHQUFHLENBQUMsQ0FBQztJQUVqQyxNQUFNLG9CQUFvQixHQUFHLEVBQUUsQ0FBQztJQUNoQyxNQUFNLGlCQUFpQixHQUFHLENBQUMsQ0FBQztJQWM1QixTQUFTLGNBQWM7UUFFdEIsTUFBTSxjQUFjLEdBQUcsS0FBSyxDQUFDLGtCQUFrQixDQUFFLFFBQVEsRUFBRSxFQUFFLENBQUUsQ0FBQyxLQUFLLENBQUUsR0FBRyxDQUFFLENBQUM7UUFDN0UsTUFBTSxTQUFTLEdBQUcsY0FB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