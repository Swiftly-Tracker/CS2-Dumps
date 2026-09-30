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
    // Set once in Init. Everything after reads these instead of threading them through as parameters.
    let _m_event;
    let _m_elPreviewPanel;
    const SEQ_FLY_AWAY = 'chick_retirement01';
    const SEQ_GRUMPY_RETIRE = 'chick_retirement02';
    const NEGLECT_FADE_SEC = 5;
    // One neglect body is drawn at random per ending. Each set is numbered from 0 in csgo_english.txt,
    // so a count here must match the lines that exist for its set.
    const NEGLECT_LINE_COUNT = 3;
    const NEGLECT_EGG_LINE_COUNT = 3;
    // Continue starts the animation, then holds back every way out so the reveal gets its own beat.
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
        // Load bearing: the max-age fly-away plays chick_retirement01, whose Chicken.Flap.Long is in the
        // ducked Chickens mixgroup. Without this the retirement is silent when opened over a content tab.
        GameInterfaceAPI.SetChickenAudioExempt('pet_event', true);
        _m_cp.GetParent().GetParent().SetHasClass('pet-event-blur', true);
        _SetupCloseBtn('id-pet-event-close-btn');
        // Rides the frame's 'show' rise rather than the popup's own open, so it lands with the circle.
        UiToolkitAPI.PlaySoundEvent('Chicken.Popup.Message');
        _m_elPetFrame.AddClass('show');
        // Built now either way, so the map is loaded behind the white cover by the time it lifts.
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
    // A pet's book on disk, as the pet id its folder is named with. '' when that pet has no book:
    // the sidecar is only written once the book has been touched. The path is PetBookMetaPath in
    // uicomponent_gameinterface.cpp, and 'pet.bin' is its k_szPetBookMetaFile.
    function _PetBookId(strPetId) {
        if (!strPetId) {
            return '';
        }
        return GameInterfaceAPI.FindFiles('pet/' + strPetId + '/book/pet.bin', 'USRLOCAL').length > 0 ? strPetId : '';
    }
    // The book this popup can offer: the pet that just expired if it left one, else the living pet's.
    function _EventPetBookId() {
        return _PetBookId(_m_cp.GetAttributeString('ack_exp_pet_id', '')) || _PetBookId(InventoryAPI.GetPetItemID());
    }
    // The book outlives the pet, so a retirement offers it instead of only closing.
    function _SetupBookBtn() {
        _m_cp.FindChildInLayoutFile('id-pet-event-book-btn').SetPanelEvent('onactivate', () => {
            // Book first, then close: the book's dim covers this popup right away.
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
            // Hiding this one only fades it, so disable it too, or a second press replays the event.
            elContinueBtn.enabled = false;
            elContinueBtn.SetHasClass('hide-btn', true);
            _m_cp.FindChildInLayoutFile('id-pet-event-text').SetHasClass('hide-text', true);
            $.Schedule(PLAY_EVENT_DELAY_SEC, () => { _PlayPetEvent(); });
            _RevealPet();
            // Both buttons and the escape / background-click path _m_bWaitingOnContinue gates wait out
            // the same beat, so the reveal cannot be dismissed the instant it starts.
            $.Schedule(PLAY_EVENT_DELAY_SEC + DISMISS_DELAY_SEC, () => {
                _m_bWaitingOnContinue = false;
                // Old age is the kind ending, so that one gets the book.
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
    // One line per stage, suffixed onto the msg token the mainmenu passes.
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
    // Escape key and background clicks. Routed through the close button so cancelling runs the
    // same teardown as clicking Close, and refused while the growth is still behind Continue.
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
            load_map_item_entities_as_info_targets: 'true', //don't load item entities from map
        });
        _ResetMapEntities(mapName, elItemModelPreviewPanel);
        return elItemModelPreviewPanel;
    }
    // Spawn items before _PlayPetEvent to minimize the chance of animations getting out of sync due to different spawn times.
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
            // Only the fly-away needs the retirement stage; neglect stays on the reveal camera.
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
                // Neglect so the scene just goes out.
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
        // Extra lighting for de_nuke_vanity
        if (mapName === 'de_nuke_vanity') {
            InspectModelImage.SetSpotlightBrightness(elItemModelPreviewPanel);
        }
        else {
            InspectModelImage.SetSunBrightness(elItemModelPreviewPanel);
        }
        InspectModelImage.DisableItemLighting(elItemModelPreviewPanel);
    }
})(PopupPetEvent || (PopupPetEvent = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfcGV0X2V2ZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvcG9wdXBzL3BvcHVwX3BldF9ldmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBQ3JDLHNDQUFzQztBQUN0QyxvREFBb0Q7QUFFcEQsSUFBVSxhQUFhLENBNFd0QjtBQTVXRCxXQUFVLGFBQWE7SUFFdEIsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBQ2xDLE1BQU0sYUFBYSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0lBQ3RGLE1BQU0sd0JBQXdCLEdBQUcsS0FBSyxDQUFDLHFCQUFxQixDQUFFLGNBQWMsQ0FBRSxDQUFDO0lBQy9FLElBQUksYUFBYSxHQUFtQixJQUFJLENBQUM7SUFDekMsSUFBSSxxQkFBcUIsR0FBRyxLQUFLLENBQUM7SUFDbEMsa0dBQWtHO0lBQ2xHLElBQUksUUFBb0IsQ0FBQztJQUN6QixJQUFJLGlCQUFvQyxDQUFDO0lBRXpDLE1BQU0sWUFBWSxHQUFHLG9CQUFvQixDQUFDO0lBQzFDLE1BQU0saUJBQWlCLEdBQUcsb0JBQW9CLENBQUM7SUFDL0MsTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLENBQUM7SUFDM0IsbUdBQW1HO0lBQ25HLCtEQUErRDtJQUMvRCxNQUFNLGtCQUFrQixHQUFHLENBQUMsQ0FBQztJQUM3QixNQUFNLHNCQUFzQixHQUFHLENBQUMsQ0FBQztJQUNqQyxnR0FBZ0c7SUFDaEcsTUFBTSxvQkFBb0IsR0FBRyxFQUFFLENBQUM7SUFDaEMsTUFBTSxpQkFBaUIsR0FBRyxDQUFDLENBQUM7SUFjNUIsU0FBUyxjQUFjO1FBRXRCLE1BQU0sY0FBYyxHQUFHLEtBQUssQ0FBQyxrQkFBa0IsQ0FBRSxRQUFRLEVBQUUsRUFBRSxDQUFFLENB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