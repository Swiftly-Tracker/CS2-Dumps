"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../common/licenseutil.ts" />
/// <reference path="../common/eventutil.ts" />
/// <reference path="../common/store_items.ts" />
/// <reference path="../generated/items_event_current_generated_store.d.ts" />
/// <reference path="../generated/items_event_current_generated_store.ts" />
/// <reference path="../common/xpshop_tile_weapon_camera_settings.ts" />
/// <reference path="../popups/popup_acknowledge_item.ts" />
/// <reference path="../itemtile_store.ts" />
/// <reference path="../tournaments/predictions_timer.ts" />
/// <reference path="../tournaments/predictions_group_stage.ts" />
/// <reference path="../tournaments/predictions_bracket_stage.ts" />
var PopupMajorHub;
(function (PopupMajorHub) {
    const _m_cp = $.GetContextPanel();
    const _m_elPickemPages = _m_cp.FindChildInLayoutFile('id-pickem-pages');
    let _m_timeoutHandle;
    let _m_eventId;
    let _m_tournamentId;
    let _m_inventoryUpdatedHandler;
    let m_selectedPage;
    let m_setDefaultTab;
    let m_redeemAvailable = 0;
    let m_oPageData = {};
    m_oPageData.hasAlreadyInit = [];
    function ClosePopup() {
        if (_m_elPickemPages.IsValid() && _m_elPickemPages) {
            m_oPageData.hasAlreadyInit.forEach(id => {
                let elPage = _m_elPickemPages.FindChild(id);
                if (elPage && elPage.IsValid()) {
                    let elBtn = elPage.FindChildInLayoutFile('id-predictions-apply-btn').FindChild('id-apply-btn');
                    if (elBtn.enabled) {
                        elBtn.AddClass('activated-by-program');
                        $.DispatchEvent("Activated", elBtn, "program");
                    }
                }
            });
        }
        PopupMajorHub.DeleteDragItem();
        $.DispatchEvent('CSGOPlaySoundEffect', 'inventory_inspect_close', 'MOUSE');
        _m_cp.SetReadyForDisplay(false);
        $.DispatchEvent('UIPopupButtonClicked', '');
        $.DispatchEvent('ContextMenuEvent', '');
        UiToolkitAPI.HideTextTooltip();
    }
    PopupMajorHub.ClosePopup = ClosePopup;
    function LeaderboardPopup() {
        UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_leaderboards.xml', 'type=official_leaderboard_pickem_' + g_ActiveTournamentInfo.location + '_team.friends' +
            '&' + 'titleoverride=#CSGO_PickEm_Leaderboard_Title' +
            '&' + 'points-title=#tournament_coin_completed_challenges' +
            '&' + 'popup-style=major-hub-popup-leaderboard' +
            '&' + 'eventid=' + _m_eventId);
    }
    PopupMajorHub.LeaderboardPopup = LeaderboardPopup;
    function Init() {
        let eventId = $.GetContextPanel().GetAttributeString('eventid', '') ? parseInt($.GetContextPanel().GetAttributeString('eventid', '')) : -1;
        if (eventId < 0) {
            ClosePopup();
            return;
        }
        ReadyForDisplay();
    }
    PopupMajorHub.Init = Init;
    function ReadyForDisplay() {
        if (!MyPersonaAPI.IsConnectedToGC()) {
            ClosePopup();
            return;
        }
        let restrictions = LicenseUtil.GetCurrentLicenseRestrictions();
        if (restrictions) {
            ClosePopup();
            return;
        }
        if (!_m_inventoryUpdatedHandler) {
            _m_inventoryUpdatedHandler = $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', OnInventoryUpdated);
        }
        let eventId = $.GetContextPanel().GetAttributeString('eventid', '') ? parseInt($.GetContextPanel().GetAttributeString('eventid', '')) : -1;
        if (eventId < 0) {
            return;
        }
        _m_eventId = eventId;
        SavePicksButton._m_eventId = eventId;
        _m_tournamentId = 'tournament:' + _m_eventId;
        if (_m_eventId > 22) {
            _m_cp.SetHasClass('major-' + _m_eventId, true);
        }
        SetUpHubBasedOnEventId();
    }
    function UnreadyForDisplay() {
        if (_m_inventoryUpdatedHandler) {
            $.UnregisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', _m_inventoryUpdatedHandler);
            _m_inventoryUpdatedHandler = null;
        }
    }
    function SetUpHubBasedOnEventId() {
        _UpdateTournamentTitle();
        _UpdateChallenges();
        _SetUpSpray();
        _SetBackgroundImages();
        let bItemsForSale = _ItemsForSale();
        _m_cp.SetHasClass('no-items-on-sale', !bItemsForSale);
        if (bItemsForSale) {
            _UpdateStoreBannar();
        }
        LoadPickEmData();
        SetUpTournamentControlRoom();
        InitializeEmbeddedLeaderboard();
    }
    function SetUpTournamentControlRoom() {
        var elBtn = _m_cp.FindChildInLayoutFile('JsTournamentOperatorBtn');
        var bCanControl = false;
        if (MyPersonaAPI.GetMyOfficialTournamentName() &&
            g_ActiveTournamentInfo.eventid === _m_eventId) {
            bCanControl = true;
            elBtn.SetPanelEvent('onactivate', function () {
                UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_tournament_controlroom.xml', 'type=matches' +
                    '&' + 'eventid=tournament:' + _m_eventId +
                    '&' + 'titleoverride=#Control');
            });
        }
        elBtn.SetHasClass('hidden', !bCanControl);
    }
    function InitializeEmbeddedLeaderboard() {
        let elLeaderboard = _m_cp.FindChildInLayoutFile('id-leaderboard');
        if (elLeaderboard && elLeaderboard.BHasClass('hidden')) {
            elLeaderboard.SetAttributeString("type", 'official_leaderboard_pickem_' + g_ActiveTournamentInfo.location + '_team.friends');
            elLeaderboard.SetAttributeString("titleoverride", '#CSGO_TournamentHub_FriendsCoinLeaderboards');
            elLeaderboard.SetAttributeString("points-title", '#tournament_coin_completed_challenges');
            elLeaderboard.SetAttributeInt("limitrows", 4);
            elLeaderboard.BLoadLayout('file://{resources}/layout/popups/popup_leaderboards.xml', true, false);
            elLeaderboard.RemoveClass('hidden');
            elLeaderboard.AddClass('leaderboard_embedded');
            elLeaderboard.RemoveClass('Hidden');
        }
    }
    function SetDefaultTab() {
        let passItemId = InventoryAPI.GetActiveTournamentCoinItemId(_m_eventId * -1);
        let coinItemId = InventoryAPI.GetActiveTournamentCoinItemId(_m_eventId);
        if ((!coinItemId || coinItemId === '0') && (passItemId && passItemId !== '0') && !m_setDefaultTab)
            OpenPassActivate(passItemId);
        let elLastActiveSection;
        for (let i = g_ActiveTournamentInfo.num_stages_with_swiss; i >= 0; --i) {
            let sectionId = PredictionsAPI.GetEventSectionIDByIndex(_m_tournamentId, i);
            if (PredictionsAPI.GetSectionIsActive(_m_tournamentId, sectionId) === true) {
                let elNavBtn = _m_cp.FindChildInLayoutFile('id-pickem-nav-stage' + i);
                if (elNavBtn && elNavBtn.IsValid()) {
                    elNavBtn.SetHasClass('active', true);
                    elLastActiveSection = elNavBtn;
                }
                else {
                    elNavBtn.SetHasClass('active', false);
                }
            }
        }
        if (elLastActiveSection && elLastActiveSection.IsValid()) {
            $.DispatchEvent("Activated", elLastActiveSection, "mouse");
        }
        else {
            let elNavBtn = _m_cp.FindChildInLayoutFile('id-pickem-nav-stage' + g_ActiveTournamentInfo.num_stages_with_swiss);
            $.DispatchEvent("Activated", elNavBtn, "mouse");
        }
        m_setDefaultTab = true;
        return;
    }
    function _UpdateTournamentTitle() {
        _m_cp.SetDialogVariable('tournament_name', $.Localize('#CSGO_Tournament_Event_NameShort_' + _m_eventId));
        _m_cp.FindChildInLayoutFile('id-major-logo').SetImage('file://{images}/tournaments/events/tournament_logo_' + _m_eventId + '.svg');
        _m_cp.SetDialogVariable('store-title', $.Localize('#major_hub_store_title_event', _m_cp));
    }
    function _SetBackgroundImages() {
        if (!_m_eventId)
            return;
        let bgImage = "url( 'file://{images}/tournaments/backgrounds/pickem_bg_" + _m_eventId + ".png')";
        if (_m_eventId !== 24) {
            _m_cp.FindChildInLayoutFile('id-graffiti-block').style.backgroundImage = bgImage;
            _m_cp.FindChildInLayoutFile('id-graffiti-block').SetHasClass('major-background-size', true);
            _m_cp.FindChildInLayoutFile('id-major-store-block').style.backgroundImage = bgImage;
            _m_cp.FindChildInLayoutFile('id-major-store-block').SetHasClass('major-background-size', true);
        }
        else {
            _m_cp.FindChildInLayoutFile('id-major-store').style.backgroundImage = bgImage;
            _m_cp.FindChildInLayoutFile('id-major-store').SetHasClass('major-background-size', true);
        }
        _m_cp.FindChildInLayoutFile('id-challenges-block').style.backgroundImage = bgImage;
        _m_cp.FindChildInLayoutFile('id-challenges-block').SetHasClass('major-background-size', true);
    }
    function _UpdateSouvenirSection(bItemsForSale) {
        let elDesc = _m_cp.FindChildInLayoutFile('id-major-hub-souvenir-desc');
        elDesc.visible = true;
        if (bItemsForSale) {
            let idForCharges = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(g_ActiveTournamentInfo.itemid_charge, 0);
            if (StoreAPI.GetStoreItemSalePrice(idForCharges, 1, '')) {
                _m_cp.SetDialogVariable('souvenir_price', StoreAPI.GetStoreItemSalePrice(idForCharges, 1, ''));
            }
            elDesc.SetDialogVariable('souvenir_package_desc', $.Localize('#major_hub_souvenir_package_desc', _m_cp));
        }
        else if (m_redeemAvailable && m_redeemAvailable > 0) {
            elDesc.SetDialogVariable('souvenir_package_desc', $.Localize('#major_hub_souvenir_package_desc_no_price', _m_cp));
        }
        else {
            elDesc.visible = false;
        }
        _m_cp.SetDialogVariable('souvenir_package', $.Localize('#CSGO_TournamentPass_' + g_ActiveTournamentInfo.location + '_store_desc'));
    }
    const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    function _UpdateStoreBannar() {
        _m_cp.FindChildInLayoutFile('id-major-open-store').SetPanelEvent('onactivate', () => {
            UiToolkitAPI.ShowCustomLayoutPopup('id-popup-major-store', 'file://{resources}/layout/popups/popup_major_store.xml');
            $.DispatchEvent("CSGOPlaySoundEffect", "UIPanorama.tab_mainmenu_shop", "MOUSE");
        });
        const elStore = _m_cp.FindChildInLayoutFile('id-major-store-banner');
        const defidxStickerItem = InventoryAPI.GetItemDefinitionIndexFromDefinitionName('sticker');
        const numStickers = 10;
        for (let i = 0; i < numStickers; i++) {
            const stickerIndex = g_ActiveTournamentTeams[getRandomInt(0, g_ActiveTournamentTeams.length - 1)].players[getRandomInt(0, 4)].rankingids[getRandomInt(0, 2)];
            const itemId = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(defidxStickerItem, stickerIndex);
            let elDisplay;
            if (i == 2 || i == 8) {
                elDisplay = elStore.FindChildInLayoutFile('id-major-store-banner-item-' + i);
                elDisplay.SetCamera('camera_weapon_7');
                elDisplay.SetActiveItem(0);
                elDisplay.SetItemItemId(itemId, '');
                let nRenderInterval = 1;
                elDisplay.SetRenderInterval(nRenderInterval);
            }
            else {
                elDisplay = elStore.FindChildInLayoutFile('id-major-store-banner-item-' + i);
                elDisplay.itemid = itemId;
            }
            elDisplay.AddClass('show');
        }
        _SetUpBannerSouvenir(elStore);
    }
    function _SetUpBannerSouvenir(elStore) {
        InventoryAPI.SetInventorySortAndFilters('inv_sort_rarity', false, 'rifle,craft_souvenir,is_rental:false,is_sealed:false', '', '');
        let itemId = '';
        const count = InventoryAPI.GetInventoryCount();
        if (count > 0) {
            const rarityCutoff = Math.floor(InventoryAPI.GetItemRarity(InventoryAPI.GetInventoryItemIDByIndex(0)) / 3);
            let maxInclusiveIndex = count - 1;
            while (maxInclusiveIndex > 0) {
                const rarityMid = InventoryAPI.GetItemRarity(InventoryAPI.GetInventoryItemIDByIndex(maxInclusiveIndex));
                if (rarityMid >= rarityCutoff)
                    break;
                else
                    maxInclusiveIndex = Math.floor(maxInclusiveIndex / 2);
            }
            itemId = InventoryAPI.GetInventoryItemIDByIndex(getRandomInt(0, maxInclusiveIndex));
        }
        if (!itemId) {
            const randomRifles = [7, 8, 9, 10, 11, 13, 16, 40, 60];
            itemId = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(randomRifles[getRandomInt(0, randomRifles.length - 1)], 0);
        }
        if (itemId) {
            const halfTeams = Math.floor(g_ActiveTournamentTeams.length / 2);
            const fauxSouvenirItemId = InventoryAPI.CreateTempCombinedItemWithTool(itemId, 'craft_souvenir:faux_' + g_ActiveTournamentInfo.eventid + '_'
                + g_ActiveTournamentTeams[getRandomInt(0, halfTeams - 1)].teamid + '_'
                + g_ActiveTournamentTeams[getRandomInt(halfTeams, g_ActiveTournamentTeams.length - 1)].teamid);
            if (fauxSouvenirItemId)
                itemId = fauxSouvenirItemId;
        }
        const defName = InventoryAPI.GetItemDefinitionName(itemId);
        let cameraData = XpShopWeaponCameraSettings.CameraSettings.find(({ type }) => type === defName);
        let cameraSuffix = cameraData !== undefined ? cameraData.camera : '0';
        const elModelPanel = elStore.FindChildInLayoutFile('id-major-store-banner-souvenir');
        elModelPanel.SetCamera('camera_weapon_' + cameraSuffix);
        elModelPanel.SetActiveItem(0);
        elModelPanel.SetItemItemId(itemId, '');
        let nRenderInterval = 1;
        elModelPanel.SetRenderInterval(nRenderInterval);
    }
    function _ItemsForSale() {
        var tournamentEventId = NewsAPI.GetActiveTournamentEventID();
        if (tournamentEventId === 0)
            return false;
        if (g_ActiveTournamentInfo.eventid !== tournamentEventId)
            return false;
        return g_ActiveTournamentInfo.active;
    }
    ;
    function _UpdateChallenges() {
        let tournamentCoinItemId = InventoryAPI.GetActiveTournamentCoinItemId(_m_eventId);
        let bHasActiveCoin = true;
        if (!tournamentCoinItemId || tournamentCoinItemId === '0') {
            bHasActiveCoin = false;
            tournamentCoinItemId = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(g_ActiveTournamentInfo.itemid_coins[0], 0);
        }
        let nCampaignID = InventoryAPI.GetItemAttributeValue(tournamentCoinItemId, "campaign id");
        let numTotalChallenges = InventoryAPI.GetCampaignNodeCount(nCampaignID);
        let nPointsEarned = 0;
        let arrMissions = [];
        for (let i = 0; i < numTotalChallenges; ++i) {
            let nMissionNodeID = InventoryAPI.GetCampaignNodeIDbyIndex(nCampaignID, i);
            let strNodeState = InventoryAPI.GetCampaignNodeState(nCampaignID, nMissionNodeID, tournamentCoinItemId, true);
            nPointsEarned = strNodeState === "complete" ? ++nPointsEarned : nPointsEarned;
            let nQuestID = InventoryAPI.GetCampaignNodeQuestID(nCampaignID, nMissionNodeID);
            ;
            let strFauxQuestItem = InventoryAPI.GetQuestItemIDFromQuestID(nQuestID);
            let strQuestIcon = InventoryAPI.GetQuestIcon(strFauxQuestItem);
            let strQuestName = InventoryAPI.GetItemName(strFauxQuestItem);
            let oChallenge = {
                idx: i,
                text: strQuestName,
                isComplete: strNodeState === "complete",
                isDisqualified: strNodeState === 'disqualified',
                icon: (!bHasActiveCoin || (strNodeState === 'disqualified')) ? 'locked' :
                    (strQuestIcon === 'watchem') ? 'watch' :
                        (strQuestIcon === 'pickem') ? 'trophy' :
                            strQuestIcon,
            };
            arrMissions.push(oChallenge);
        }
        let counter = 0;
        arrMissions.forEach(oChallenge => { if (oChallenge.isDisqualified) {
            oChallenge.idx = counter++;
            _CreateUpdateChallenge(oChallenge);
        } });
        arrMissions.forEach(oChallenge => { if (!oChallenge.isDisqualified) {
            oChallenge.idx = counter++;
            _CreateUpdateChallenge(oChallenge);
        } });
        _m_cp.SetHasClass('no-active-coin', !bHasActiveCoin);
        if (bHasActiveCoin) {
            _SetPoints(nPointsEarned, tournamentCoinItemId);
            _SetThresholdText(nPointsEarned, numTotalChallenges, tournamentCoinItemId);
            _RedemptionChargesRemaining(tournamentCoinItemId);
            _m_cp.FindChildInLayoutFile('id-major-hub-coin-model').SetActiveItem(0);
            _m_cp.FindChildInLayoutFile('id-major-hub-coin-model').SetItemItemId(tournamentCoinItemId, '');
            _m_cp.FindChildInLayoutFile('id-major-hub-coin-model').SetPanelEvent('onactivate', () => {
                $.DispatchEvent("InventoryItemPreview", tournamentCoinItemId, '');
            });
        }
        else {
            let passIndex = g_ActiveTournamentInfo.itemid_pass;
            let passId = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(passIndex, 0);
            _m_cp.FindChildInLayoutFile('id-pass-upsell-image').itemid = passId;
            let coinIndex = g_ActiveTournamentInfo.itemid_coins[0];
            let coinId = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(coinIndex, 0);
            _m_cp.FindChildInLayoutFile('id-pass-upsell-image-coin').itemid = coinId;
            _SetPassBtnAction();
        }
    }
    function _CreateUpdateChallenge(oChallenge) {
        var elList = _m_cp.FindChildInLayoutFile('id-major-challenges');
        var elChallenge = _m_cp.FindChildInLayoutFile('id-major-challenge-' + oChallenge.idx);
        if (!elChallenge) {
            elChallenge = $.CreatePanel("Panel", elList, 'id-major-challenge-' + oChallenge.idx);
            elChallenge.BLoadLayoutSnippet("major-challenge");
        }
        _UpdateChallenge(elChallenge, oChallenge);
    }
    function _UpdateChallenge(elChallenge, oChallenge) {
        let elIcon = elChallenge.FindChildInLayoutFile('id-major-challenge-icon');
        elChallenge.SetDialogVariable('challenge_desc', oChallenge.text);
        let iconPath = oChallenge.isComplete ? 'file://{images}/icons/ui/check.svg' :
            oChallenge.isDisqualified ? 'file://{images}/icons/ui/cancel.svg' :
                'file://{images}/icons/ui/' + oChallenge.icon + '.svg';
        elIcon.SetImage(iconPath);
        elChallenge.SetHasClass('complete', oChallenge.isComplete);
        elChallenge.SetHasClass('disqualified', !oChallenge.isComplete && oChallenge.isDisqualified);
    }
    function _SetPoints(nPointsEarned, tournamentCoinItemId) {
        _m_cp.SetDialogVariableInt('challenges_complete', nPointsEarned);
        let coinLevel = InventoryAPI.GetItemAttributeValue(tournamentCoinItemId, "upgrade level");
        let style = coinLevel < 1 ? 'bronze' : coinLevel === 1 ? 'silver' : coinLevel > 1 ? 'gold' : 'bronze';
        $.GetContextPanel().FindChildInLayoutFile('id-coin-status-image').AddClass(style);
    }
    var _SetThresholdText = function (nPointsEarned, nTotalChallenges, tournamentCoinItemId) {
        let threshold = InventoryAPI.GetItemAttributeValue(tournamentCoinItemId, "upgrade threshold");
        let sText = (nTotalChallenges - nPointsEarned) === 0 ? '#tournament_coin_completed_challenges' :
            (threshold > nPointsEarned) ? '#tournament_coin_remaining_challenges_curr' : '';
        let challengesRemain = threshold - nPointsEarned;
        _m_cp.SetDialogVariableInt('challenges', challengesRemain);
        _m_cp.SetDialogVariable('challenges_status', $.Localize(sText, $.GetContextPanel()));
    };
    var _RedemptionChargesRemaining = function (tournamentCoinItemId) {
        let coinLevel = parseInt(InventoryAPI.GetItemAttributeValue(tournamentCoinItemId, "upgrade level"));
        let coinRedeemsPurchased = parseInt(InventoryAPI.GetItemAttributeValue(tournamentCoinItemId, "operation drops awarded 1"));
        if (coinRedeemsPurchased)
            coinLevel += coinRedeemsPurchased;
        let redeemed = parseInt(InventoryAPI.GetItemAttributeValue(tournamentCoinItemId, "operation drops awarded 0"));
        m_redeemAvailable = coinLevel - redeemed;
        if (_m_eventId >= 26)
            m_redeemAvailable = 0;
        _m_cp.SetDialogVariableInt('redeems', m_redeemAvailable);
        let elPanel = _m_cp.FindChildInLayoutFile('id-coin-status-charges');
        elPanel.visible = m_redeemAvailable > 0;
        let sTooltip = $.Localize('#popup_redeem_souvenir_desc:f', _m_cp);
        elPanel.SetPanelEvent('onmouseover', () => { UiToolkitAPI.ShowTextTooltip('id-coin-status-charges', sTooltip); });
        elPanel.SetPanelEvent('onmouseout', () => { UiToolkitAPI.HideTextTooltip(); });
    };
    var _SetPassBtnAction = function () {
        let btn = _m_cp.FindChildInLayoutFile('id-pass-upsell-btn');
        let passItemId = InventoryAPI.GetActiveTournamentCoinItemId(_m_eventId * -1);
        if ((!passItemId || passItemId === '0')) {
            let bCanPurchasePass = (g_ActiveTournamentInfo.eventid === _m_eventId) &&
                ('' !== StoreAPI.GetStoreItemSalePrice(InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(g_ActiveTournamentStoreLayout[0][0], 0), 1, ''));
            if (bCanPurchasePass) {
                btn.text = '#SFUI_ConfirmBtn_GetPassNow';
                btn.SetPanelEvent('onactivate', () => {
                    var contextMenuPanel = UiToolkitAPI.ShowCustomLayoutContextMenuParameters('', '', 'file://{resources}/layout/context_menus/context_menu_store_linked_items.xml', 'itemids=' + InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(g_ActiveTournamentInfo.itemid_pass, 0) +
                        ',' + InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(g_ActiveTournamentInfo.itemid_pack, 0) +
                        '&' + 'linkedWarning=#tournament_items_notice');
                    contextMenuPanel.AddClass("ContextMenu_NoArrow");
                });
            }
            else {
                btn.text = '';
                btn.visible = false;
                btn.SetPanelEvent('onactivate', () => {
                });
            }
        }
        else {
            btn.text = '#SFUI_ConfirmBtn_ActivatePassNow';
            btn.SetPanelEvent('onactivate', () => {
                InventoryAPI.UseTool(passItemId, '');
            });
        }
    };
    function _SetUpSpray() {
        let elParent = $.GetContextPanel().FindChildInLayoutFile('id-major-store');
        if (!_m_eventId) {
            elParent.SetHasClass('graffiti-panel-visible', false);
            return;
        }
        let tournamentCoinItemId = InventoryAPI.GetActiveTournamentCoinItemId(_m_eventId);
        if (!tournamentCoinItemId || tournamentCoinItemId === '0' || g_ActiveTournamentInfo.eventid !== _m_eventId || !g_ActiveTournamentInfo.active) {
            elParent.SetHasClass('graffiti-panel-visible', false);
            return;
        }
        var elImage = $.GetContextPanel().FindChildInLayoutFile('id-tournament-journal-spray');
        elImage.itemid = ItemInfo.GetFauxReplacementItemID(tournamentCoinItemId, 'graffiti');
        var elIBtn = $.GetContextPanel().FindChildInLayoutFile('id-tournament-journal-selectspray-btn');
        elIBtn.SetPanelEvent('onactivate', function () {
            UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_tournament_select_spray.xml', 'journalid=' + tournamentCoinItemId +
                '&' + 'eventid=' + _m_eventId);
        });
        elParent.SetHasClass('graffiti-panel-visible', true);
    }
    ;
    function NavigateToTab(sectionIndex) {
        let elPage = _m_elPickemPages.FindChild('id-pickem-page-stage' + sectionIndex);
        elPage?.SetHasClass('hidden', m_selectedPage === elPage);
        m_selectedPage?.SetHasClass('hidden', m_selectedPage !== elPage);
        let sectionId = PredictionsAPI.GetEventSectionIDByIndex(_m_tournamentId, sectionIndex);
        let groupId = PredictionsAPI.GetSectionGroupIDByIndex(_m_tournamentId, sectionId, 0);
        m_selectedPage = elPage;
        m_oPageData.panel = elPage;
        m_oPageData.eventId = _m_eventId;
        m_oPageData.tournamentId = _m_tournamentId;
        m_oPageData.sectionId = sectionId;
        m_oPageData.groupId = groupId;
        m_oPageData.sectionIndex = sectionIndex;
        PredictionsTimer.UpdateTimer();
        if ((sectionIndex < g_ActiveTournamentInfo.num_stages_with_swiss) && elPage) {
            PredictionsGroup.Init();
        }
        else {
            PredictionsBracket.Init();
        }
        if (!m_oPageData.hasAlreadyInit.includes(elPage.id)) {
            m_oPageData.hasAlreadyInit.push(elPage.id);
        }
    }
    PopupMajorHub.NavigateToTab = NavigateToTab;
    function GetActivePageData() {
        return m_oPageData;
    }
    PopupMajorHub.GetActivePageData = GetActivePageData;
    function RefreshData() {
        MatchListAPI.Refresh(_m_tournamentId);
    }
    PopupMajorHub.RefreshData = RefreshData;
    function LoadPickEmData() {
        let listState = MatchListAPI.GetState(_m_tournamentId);
        let elLoadingPanel = _m_cp.FindChildInLayoutFile('id-pickem-loading-status');
        if (listState === 'none') {
            MatchListAPI.Refresh(_m_tournamentId);
            _CancelMatchStatsLoadedTimeout();
            _m_cp.SetHasClass('loading', true);
            _m_cp.SetHasClass('timeout', false);
            elLoadingPanel.SetDialogVariable('pickem_loaded_status', $.Localize('#CSGO_Watch_Loading_PickEm'));
        }
        if (listState === 'ready') {
            let isLoaded = PredictionsAPI.GetMyPredictionsLoaded(_m_tournamentId);
            let sectionsCount = PredictionsAPI.GetEventSectionsCount(_m_tournamentId);
            if (!isLoaded || !sectionsCount) {
                _CancelMatchStatsLoadedTimeout();
                _m_timeoutHandle = $.Schedule(5, () => {
                    _m_timeoutHandle = null;
                    elLoadingPanel.SetDialogVariable('pickem_loaded_status', $.Localize('#pickem_apply_timeout'));
                    _m_cp.SetHasClass('timeout', true);
                });
                return;
            }
            _CancelMatchStatsLoadedTimeout();
            _m_cp.SetHasClass('loading', false);
            if (!m_setDefaultTab) {
                $.Schedule(.15, SetDefaultTab);
            }
            else {
                NavigateToTab(m_oPageData.sectionIndex);
            }
            return;
        }
        return;
    }
    function _CancelMatchStatsLoadedTimeout() {
        if (_m_timeoutHandle) {
            $.CancelScheduled(_m_timeoutHandle);
            _m_timeoutHandle = null;
        }
    }
    ;
    function CheckIfPickIsCorrect(sCorrectPicks, userPickTeamID) {
        let aCorrectPicks = sCorrectPicks.split(',');
        return aCorrectPicks.includes(userPickTeamID.toString());
    }
    PopupMajorHub.CheckIfPickIsCorrect = CheckIfPickIsCorrect;
    function IsSectionActive() {
        if (PredictionsAPI.GetSectionIsActive(m_oPageData.tournamentId, m_oPageData.sectionId)) {
            return true;
        }
        return false;
    }
    PopupMajorHub.IsSectionActive = IsSectionActive;
    function IsPreviousSectionActive() {
        if (PredictionsAPI.GetSectionIsActive(m_oPageData.tournamentId, m_oPageData.sectionId - 1)) {
            return true;
        }
        return false;
    }
    PopupMajorHub.IsPreviousSectionActive = IsPreviousSectionActive;
    function GetTeamIcon(teamId) {
        let teamTag = PredictionsAPI.GetTeamTag(teamId);
        return 'file://{images}/tournaments/teams/' + teamTag + '.svg';
    }
    PopupMajorHub.GetTeamIcon = GetTeamIcon;
    function OnInventoryUpdated() {
        _SetUpSpray();
        _UpdateChallenges();
        SavePicksButton.ShowHideNoActivePassWarning(m_oPageData, false);
    }
    function RefreshActivePage() {
        PredictionsTimer.UpdateTimer();
        if (m_oPageData.sectionIndex < g_ActiveTournamentInfo.num_stages_with_swiss) {
            PredictionsGroup.UpdateFromPredictionUploadedEvent();
        }
        else if (m_oPageData.sectionIndex == g_ActiveTournamentInfo.num_stages_with_swiss) {
            PredictionsBracket.UpdateFromPredictionUploadedEvent();
        }
    }
    function ItemAcquired(itemId) {
        let nSouvenir = g_ActiveTournamentInfo;
        let newItemDefName = InventoryAPI.GetItemDefinitionName(itemId);
        let passDef = InventoryAPI.GetItemDefinitionName(InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(g_ActiveTournamentInfo.itemid_pass, 0));
        let passPackDef = InventoryAPI.GetItemDefinitionName(InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(g_ActiveTournamentInfo.itemid_pack, 0));
        if (InventoryAPI.GetItemDefinitionName(itemId) === passDef || InventoryAPI.GetItemDefinitionName(itemId) === passPackDef) {
            AcknowledgeItems.GetItemsByType([passDef, passPackDef], true);
            OpenPassActivate(itemId);
            return;
        }
    }
    function OpenPassActivate(itemId) {
        const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_capability_decodable.xml');
        let oSettings = {
            item_id: itemId,
            work_type: 'decodeable'
        };
        elPanel.Data().oSettings = oSettings;
    }
    function DeleteDragItem() {
        if (PopupMajorHub.m_elDragImage && PopupMajorHub.m_elDragImage.IsValid()) {
            PopupMajorHub.m_elDragImage.DeleteAsync(0.25);
        }
    }
    PopupMajorHub.DeleteDragItem = DeleteDragItem;
    {
        ReadyForDisplay();
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_GcLogonNotificationReceived', ReadyForDisplay);
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_UpdateConnectionToGC', ReadyForDisplay);
        $.RegisterForUnhandledEvent('PanoramaComponent_MatchList_StateChange', LoadPickEmData);
        $.RegisterForUnhandledEvent('PanoramaComponent_MatchList_PredictionUploaded', RefreshActivePage);
        $.RegisterForUnhandledEvent('PanoramaComponent_Store_PurchaseCompleted', ItemAcquired);
        $.RegisterForUnhandledEvent('OpenInventory', ClosePopup);
        $.RegisterEventHandler('ReadyForDisplay', _m_cp, ReadyForDisplay);
        $.RegisterEventHandler('UnreadyForDisplay', _m_cp, UnreadyForDisplay);
    }
})(PopupMajorHub || (PopupMajorHub = {}));
var SavePicksButton;
(function (SavePicksButton) {
    let _m_timeoutApplyHandle;
    function UpdateBtn(aLocalPicks = []) {
        ResetTimeoutHandle();
        let oPageData = PopupMajorHub.GetActivePageData();
        let elBtn = oPageData.panel.FindChildInLayoutFile('id-predictions-apply-btn').FindChild('id-apply-btn');
        let elWarning = oPageData.panel.FindChildInLayoutFile('id-predictions-apply-btn').FindChild('id-apply-warning');
        elWarning.SetDialogVariable('pass-name', InventoryAPI.GetItemName(InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(g_ActiveTournamentInfo.itemid_pass, 0)));
        let bThisSectionIsNoLongerActive = !PredictionsAPI.GetSectionIsActive(oPageData.tournamentId, oPageData.sectionId);
        if (!PredictionsAPI.GetGroupCanPick(oPageData.tournamentId, oPageData.groupId)) {
            elBtn.enabled = false;
            elBtn.visible = false;
            ShowHideNoActivePassWarning(oPageData, true);
            let elToggleBtn = oPageData.panel.FindChildInLayoutFile('id-predictions-apply-btn').FindChild('id-toggle-correct-btn');
            elToggleBtn.visible = true;
            elToggleBtn.SetPanelEvent('onactivate', () => {
                oPageData.panel.SetHasClass('show-all-correct-picks', !oPageData.panel.BHasClass('show-all-correct-picks'));
            });
            elToggleBtn.checked = bThisSectionIsNoLongerActive;
            oPageData.panel.SetHasClass('show-all-correct-picks', bThisSectionIsNoLongerActive);
            return;
        }
        if (bThisSectionIsNoLongerActive) {
            elBtn.enabled = false;
            elBtn.visible = false;
            ShowHideNoActivePassWarning(oPageData, true);
            return;
        }
        elBtn.visible = true;
        ShowHideNoActivePassWarning(oPageData, false);
        let nCount = (oPageData.sectionIndex >= g_ActiveTournamentInfo.num_stages_with_swiss) ? 7 : PredictionsAPI.GetGroupPicksCount(oPageData.tournamentId, oPageData.groupId);
        if (aLocalPicks.length === nCount) {
            let bPicksDifferent = false;
            for (let i = 0; i < nCount; ++i) {
                if (aLocalPicks[i].teamId !== PredictionsAPI.GetMyPredictionTeamID(oPageData.tournamentId, aLocalPicks[i].group, aLocalPicks[i].groupIndex)) {
                    bPicksDifferent = true;
                    break;
                }
                ;
            }
            elBtn.enabled = bPicksDifferent;
            elBtn.SetDialogVariable('save-btn-text', bPicksDifferent ?
                $.Localize('#pickem_save_all') :
                $.Localize('#pickem_saved'));
            elBtn.SwitchClass('btn_state', !bPicksDifferent ? 'saved' : '');
            if (bPicksDifferent) {
                _SetPicks(elBtn, oPageData, nCount, aLocalPicks);
            }
        }
        else {
            elBtn.enabled = false;
            elBtn.SwitchClass('btn_state', '');
            elBtn.SetDialogVariableInt('user-picks', aLocalPicks.length);
            elBtn.SetDialogVariableInt('total-picks', nCount);
            elBtn.SetDialogVariable('save-btn-text', $.Localize('#pickem_make_picks', elBtn));
        }
    }
    SavePicksButton.UpdateBtn = UpdateBtn;
    function ShowHideNoActivePassWarning(oPageData, bHide = false) {
        if (!oPageData.panel || oPageData.panel.IsValid() === false) {
            return;
        }
        let elWarning = oPageData.panel.FindChildInLayoutFile('id-predictions-apply-btn').FindChild('id-apply-warning');
        let tournamentCoinItemId = InventoryAPI.GetActiveTournamentCoinItemId(SavePicksButton._m_eventId);
        elWarning.visible = (!tournamentCoinItemId || tournamentCoinItemId === '0') && !bHide;
    }
    SavePicksButton.ShowHideNoActivePassWarning = ShowHideNoActivePassWarning;
    function _SetPicks(elBtn, oPageData, nCount, aLocalPicks) {
        if (elBtn.enabled) {
            var args = [oPageData.tournamentId];
            for (var i = 0; i < nCount; ++i) {
                args.push(aLocalPicks[i].group.toString(), aLocalPicks[i].groupIndex.toString(), PredictionsAPI.GetFakeItemIDToRepresentTeamID(oPageData.tournamentId, aLocalPicks[i].teamId));
            }
            elBtn.SetPanelEvent('onactivate', () => {
                let tournamentCoinItemId = InventoryAPI.GetActiveTournamentCoinItemId(oPageData.eventId);
                let passItemId = InventoryAPI.GetActiveTournamentCoinItemId(SavePicksButton._m_eventId * -1);
                let bHasActiveCoin = tournamentCoinItemId && tournamentCoinItemId !== '0';
                let bIsPrime = (MyPersonaAPI.GetElevatedState() === 'elevated');
                if (!elBtn.BHasClass('activated-by-program')) {
                    if (!bIsPrime && !bHasActiveCoin) {
                        if (!elBtn.BHasClass('activated-by-program')) {
                            UiToolkitAPI.ShowGenericPopupTwoOptions('#CSGO_official_leaderboard_pickem_' + g_ActiveTournamentInfo.location + '_team', '#CSGO_PickEm_Leaderboards_PassOrPrime_Message', '', '#SFUI_ConfirmBtn_GetPassNow', () => { }, '#SFUI_Elevated_Status_Sale_action', () => { UiToolkitAPI.ShowCustomLayoutPopup('prime_status', 'file://{resources}/layout/popups/popup_prime_status.xml'); });
                        }
                        return;
                    }
                    if (!bHasActiveCoin && (passItemId && passItemId !== '0')) {
                        let elPopup = UiToolkitAPI.ShowGenericPopupTwoOptions('#pickem_submit_warning_popup_title', '#pickem_submit_warning_popup_desc', '', '#pickem_submit_warning_popup_action2', () => {
                            InventoryAPI.UseTool(passItemId, '');
                            _SubmitPicks(elBtn, args);
                        }, '#pickem_submit_warning_popup_action', () => { _SubmitPicks(elBtn, args); });
                        elPopup.SetDialogVariable('pass-name', InventoryAPI.GetItemName(InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(g_ActiveTournamentInfo.itemid_pass, 0)));
                        return;
                    }
                    if (!bHasActiveCoin) {
                        let elPopup = UiToolkitAPI.ShowGenericPopupTwoOptions('#pickem_submit_warning_popup_title', '#pickem_submit_warning_popup_desc', '', '#SFUI_ConfirmBtn_GetPassNow', () => {
                            $.DispatchEvent('UIPopupButtonClicked', elPopup, '');
                            $.DispatchEvent('ContextMenuEvent', '');
                            UiToolkitAPI.HideTextTooltip();
                            var contextMenuPanel = UiToolkitAPI.ShowCustomLayoutContextMenuParameters('', '', 'file://{resources}/layout/context_menus/context_menu_store_linked_items.xml', 'itemids=' + InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(g_ActiveTournamentInfo.itemid_pass, 0) +
                                ',' + InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(g_ActiveTournamentInfo.itemid_pack, 0) +
                                '&' + 'linkedWarning=#tournament_items_notice');
                            contextMenuPanel.AddClass("ContextMenu_NoArrow");
                            contextMenuPanel.SetFocus();
                        }, '#pickem_submit_warning_popup_action', () => { _SubmitPicks(elBtn, args); });
                        elPopup.SetDialogVariable('pass-name', InventoryAPI.GetItemName(InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(g_ActiveTournamentInfo.itemid_pass, 0)));
                        return;
                    }
                }
                _SubmitPicks(elBtn, args);
            });
        }
    }
    function _SubmitPicks(elBtn, args) {
        elBtn.enabled = false;
        elBtn.SwitchClass('btn_state', 'waiting-for-update');
        $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.tab_mainmenu_shop', 'MOUSE');
        PredictionsAPI.SetMyPredictionUsingItemID.apply(PredictionsAPI, args);
        ResetTimeoutHandle();
        _m_timeoutApplyHandle = $.Schedule(7, () => {
            _CancelWaitForCallBack(elBtn);
        });
    }
    SavePicksButton._SubmitPicks = _SubmitPicks;
    function ResetTimeoutHandle() {
        if (_m_timeoutApplyHandle) {
            $.CancelScheduled(_m_timeoutApplyHandle);
            _m_timeoutApplyHandle = null;
        }
    }
    SavePicksButton.ResetTimeoutHandle = ResetTimeoutHandle;
    function _CancelWaitForCallBack(elBtn) {
        _m_timeoutApplyHandle = null;
        PopupMajorHub.ClosePopup();
        UiToolkitAPI.ShowGenericPopupOk($.Localize('#SFUI_SteamConnectionErrorTitle'), $.Localize('#CSGO_PickEm_Pick_TimeOut'), '', () => { });
    }
})(SavePicksButton || (SavePicksButton = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfbWFqb3JfaHViLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvcG9wdXBzL3BvcHVwX21ham9yX2h1Yi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQ0EscUNBQXFDO0FBQ3JDLGlEQUFpRDtBQUNqRCwrQ0FBK0M7QUFDL0MsaURBQWlEO0FBQ2pELDhFQUE4RTtBQUM5RSw0RUFBNEU7QUFDNUUsd0VBQXdFO0FBQ3hFLDREQUE0RDtBQUM1RCw2Q0FBNkM7QUFDN0MsNERBQTREO0FBQzVELGtFQUFrRTtBQUNsRSxvRUFBb0U7QUFFcEUsSUFBVSxhQUFhLENBMDVCdEI7QUExNUJELFdBQVUsYUFBYTtJQUV0QixNQUFNLEtBQUssR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUM7SUFDL0IsTUFBTSxnQkFBZ0IsR0FBWSxLQUFLLENBQUMscUJBQXFCLENBQUUsaUJBQWlCLENBQUUsQ0FBQztJQUNuRixJQUFJLGdCQUErQixDQUFDO0lBQ3BDLElBQUksVUFBa0IsQ0FBQztJQUN2QixJQUFJLGVBQXVCLENBQUM7SUFDNUIsSUFBSSwwQkFBeUMsQ0FBQztJQUM5QyxJQUFJLGNBQThCLENBQUM7SUFDbkMsSUFBSSxlQUF5QixDQUFDO0lBQzlCLElBQUksaUJBQWlCLEdBQVcsQ0FBQyxDQUFDO0lBMkJsQyxJQUFJLFdBQVcsR0FBRyxFQUFnQixDQUFDO0lBQ25DLFdBQVcsQ0FBQyxjQUFjLEdBQUcsRUFBRSxDQUFDO0lBRWhDLFNBQWdCLFVBQVU7UUFFdEIsSUFBSSxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsSUFBSSxnQkFBZ0IsRUFDbEQ7WUFDSSxXQUFXLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBRSxFQUFFLENBQUMsRUFBRTtnQkFDckMsSUFBSSxNQUFNLEdBQUcsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUM1QyxJQUFLLE1BQU0s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