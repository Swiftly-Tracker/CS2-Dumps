"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../common/licenseutil.ts" />
/// <reference path="../common/major_store_prices.ts" />
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
    let _m_setDefaultTabHandle = null;
    let m_redeemAvailable = 0;
    const BANNER_MODEL_FADE_SECONDS = 0.8;
    let _m_bBannerFilled = false;
    let _m_bannerTeamId = 0;
    let _m_hBannerModelSwap = null;
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
            _SetUpShop();
            _SetUpSouvenir();
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
        let bgImage = "url( 'file://{images}/tournaments/backgrounds/pickem_bg_" + _m_eventId + ".psd')";
        ['id-major-store-block', 'id-major-souvenir-block', 'id-graffiti-block', 'id-challenges-block'].forEach(id => {
            const elBlock = _m_cp.FindChildInLayoutFile(id);
            elBlock.style.backgroundImage = bgImage;
            elBlock.AddClass('major-background-size');
        });
    }
    const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    function _SetUpShop() {
        _m_cp.FindChildInLayoutFile('id-major-open-store').SetPanelEvent('onactivate', () => {
            UiToolkitAPI.ShowCustomLayoutPopup('id-popup-major-store', 'file://{resources}/layout/popups/popup_major_store.xml');
            $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.tab_mainmenu_shop', 'MOUSE');
        });
        StoreAPI.VolatileShopSubscribe(g_ActiveTournamentInfo.itemid_dynamic_stickers, false);
        _UpdateStorePrice();
        _FillBannerStickers();
    }
    function _FillBannerStickers() {
        if (_m_bBannerFilled) {
            return;
        }
        const aTeams = MajorStorePrices.GetTopTeams();
        if (aTeams.length === 0) {
            return;
        }
        _m_bBannerFilled = true;
        _ShowBannerStickers([
            MajorStorePrices.GetTeamGoldSticker(aTeams[0]),
            ...aTeams.slice(1, 5).flatMap(team => MajorStorePrices.PickPlayerStickers(team, 1)),
        ]);
    }
    function ShowBannerTeam(teamId) {
        const team = g_ActiveTournamentTeams.find(t => t.teamid === teamId);
        if (!team || teamId === _m_bannerTeamId) {
            return;
        }
        _m_bannerTeamId = teamId;
        _m_bBannerFilled = true;
        _ShowBannerStickers([
            MajorStorePrices.GetTeamGoldSticker(team),
            ...MajorStorePrices.PickPlayerStickers(team, 4),
        ]);
    }
    PopupMajorHub.ShowBannerTeam = ShowBannerTeam;
    function _ShowBannerStickers(aItemIds) {
        _m_cp.FindChildInLayoutFile('id-major-store-banner-images').Children().forEach((elSlot, i) => {
            const itemId = aItemIds[i];
            if (!itemId) {
                return;
            }
            if (elSlot.paneltype === 'MapItemPreviewPanel') {
                _SwapBannerModel(elSlot, itemId);
                return;
            }
            const [elFirst, elSecond] = elSlot.Children();
            const elNext = elFirst.BHasClass('show') ? elSecond : elFirst;
            elNext.itemid = itemId;
            elFirst.SetHasClass('show', elNext === elFirst);
            elSecond.SetHasClass('show', elNext === elSecond);
        });
    }
    function _SwapBannerModel(elModel, itemId) {
        if (_m_hBannerModelSwap !== null) {
            $.CancelScheduled(_m_hBannerModelSwap);
        }
        const nWait = elModel.BHasClass('show') ? BANNER_MODEL_FADE_SECONDS : 0;
        elModel.RemoveClass('show');
        _m_hBannerModelSwap = $.Schedule(nWait, () => {
            _m_hBannerModelSwap = null;
            if (!elModel.IsValid()) {
                return;
            }
            elModel.SetCamera('camera_weapon_7');
            elModel.SetActiveItem(0);
            elModel.SetItemItemId(itemId, '');
            elModel.SetRenderInterval(1);
            elModel.AddClass('show');
        });
    }
    function _UpdateStorePrice() {
        const elPrice = _m_cp.FindChildInLayoutFile('id-major-hub-store-price');
        const range = MajorStorePrices.GetStickerPriceRange();
        const bOnSale = range.maxDiscountPct > 0;
        elPrice.SetDialogVariableInt('discount', range.maxDiscountPct);
        elPrice.SetDialogVariableInt('price_red', 3000);
        elPrice.SetDialogVariableInt('price_pink', 800);
        elPrice.SetDialogVariableInt('price_purp', 150);
        elPrice.SetDialogVariableInt('price_blue', 25);
        elPrice.FindChildInLayoutFile('id-major-hub-store-price-label').text =
            $.Localize(bOnSale ? '#major_store_sale_banner' : '#major_hub_store_finish_prices_v', elPrice);
        elPrice.SetHasClass('on-sale', bOnSale);
    }
    function _OnStorePricesChanged() {
        if (_ItemsForSale()) {
            _UpdateStorePrice();
        }
    }
    function _SetUpSouvenir() {
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
        const elModelPanel = _m_cp.FindChildInLayoutFile('id-major-souvenir-model');
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
            UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_tournament_select_spray.xml', 'journalid=' + tournamentCoinItemId);
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
                if (!_m_setDefaultTabHandle) {
                    _m_setDefaultTabHandle = $.Schedule(.15, () => {
                        _m_setDefaultTabHandle = null;
                        SetDefaultTab();
                    });
                }
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
        $.RegisterForUnhandledEvent('PanoramaComponent_Store_PriceSheetChanged', _OnStorePricesChanged);
        $.RegisterForUnhandledEvent('PanoramaComponent_Store_VolatileShopSubscribe', _OnStorePricesChanged);
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
                    if (!bHasActiveCoin && (passItemId && passItemId !== '0')) {
                        let elPopup = UiToolkitAPI.ShowGenericPopupTwoOptions('#pickem_submit_warning_popup_title', '#pickem_submit_warning_popup_desc', '', '#pickem_submit_warning_popup_action2', () => {
                            InventoryAPI.UseTool(passItemId, '');
                            _SubmitPicks(elBtn, args);
                        }, '#pickem_submit_warning_popup_action', () => { _SubmitPicks(elBtn, args); });
                        elPopup.SetDialogVariable('pass-name', InventoryAPI.GetItemName(InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(g_ActiveTournamentInfo.itemid_pass, 0)));
                        return;
                    }
                    if (!bIsPrime && !bHasActiveCoin) {
                        let elPopup = UiToolkitAPI.ShowGenericPopupTwoOptions('#CSGO_official_leaderboard_pickem_' + g_ActiveTournamentInfo.location + '_team', '#CSGO_PickEm_Leaderboards_PassOrPrime_Message', '', '#SFUI_ConfirmBtn_GetPassNow', () => { _ShowGetPassMenu(elPopup); }, '#SFUI_Elevated_Status_Sale_action', () => { UiToolkitAPI.ShowCustomLayoutPopup('prime_status', 'file://{resources}/layout/popups/popup_prime_status.xml'); });
                        return;
                    }
                    if (!bHasActiveCoin) {
                        let elPopup = UiToolkitAPI.ShowGenericPopupTwoOptions('#pickem_submit_warning_popup_title', '#pickem_submit_warning_popup_desc', '', '#SFUI_ConfirmBtn_GetPassNow', () => { _ShowGetPassMenu(elPopup); }, '#pickem_submit_warning_popup_action', () => { _SubmitPicks(elBtn, args); });
                        elPopup.SetDialogVariable('pass-name', InventoryAPI.GetItemName(InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(g_ActiveTournamentInfo.itemid_pass, 0)));
                        return;
                    }
                }
                _SubmitPicks(elBtn, args);
            });
        }
    }
    function _ShowGetPassMenu(elPopup) {
        $.DispatchEvent('UIPopupButtonClicked', elPopup, '');
        $.DispatchEvent('ContextMenuEvent', '');
        UiToolkitAPI.HideTextTooltip();
        const contextMenuPanel = UiToolkitAPI.ShowCustomLayoutContextMenuParameters('', '', 'file://{resources}/layout/context_menus/context_menu_store_linked_items.xml', 'itemids=' + InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(g_ActiveTournamentInfo.itemid_pass, 0) +
            ',' + InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(g_ActiveTournamentInfo.itemid_pack, 0) +
            '&' + 'linkedWarning=#tournament_items_notice');
        contextMenuPanel.AddClass("ContextMenu_NoArrow");
        contextMenuPanel.SetFocus();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfbWFqb3JfaHViLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvcG9wdXBzL3BvcHVwX21ham9yX2h1Yi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQ0EscUNBQXFDO0FBQ3JDLGlEQUFpRDtBQUNqRCx3REFBd0Q7QUFDeEQsK0NBQStDO0FBQy9DLGlEQUFpRDtBQUNqRCw4RUFBOEU7QUFDOUUsNEVBQTRFO0FBQzVFLHdFQUF3RTtBQUN4RSw0REFBNEQ7QUFDNUQsNkNBQTZDO0FBQzdDLDREQUE0RDtBQUM1RCxrRUFBa0U7QUFDbEUsb0VBQW9FO0FBRXBFLElBQVUsYUFBYSxDQTA3QnRCO0FBMTdCRCxXQUFVLGFBQWE7SUFFdEIsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBQy9CLE1BQU0sZ0JBQWdCLEdBQVksS0FBSyxDQUFDLHFCQUFxQixDQUFFLGlCQUFpQixDQUFFLENBQUM7SUFDbkYsSUFBSSxnQkFBK0IsQ0FBQztJQUNwQyxJQUFJLFVBQWtCLENBQUM7SUFDdkIsSUFBSSxlQUF1QixDQUFDO0lBQzVCLElBQUksMEJBQXlDLENBQUM7SUFDOUMsSUFBSSxjQUE4QixDQUFDO0lBQ25DLElBQUksZUFBeUIsQ0FBQztJQUM5QixJQUFJLHNCQUFzQixHQUFrQixJQUFJLENBQUM7SUFDakQsSUFBSSxpQkFBaUIsR0FBVyxDQUFDLENBQUM7SUFHbEMsTUFBTSx5QkFBeUIsR0FBRyxHQUFHLENBQUM7SUFDdEMsSUFBSSxnQkFBZ0IsR0FBRyxLQUFLLENBQUM7SUFDN0IsSUFBSSxlQUFlLEdBQUcsQ0FBQyxDQUFDO0lBQ3hCLElBQUksbUJBQW1CLEdBQWtCLElBQUksQ0FBQztJQTRCOUMsSUFBSSxXQUFXLEdBQUcsRUFBZ0IsQ0FBQztJQUNuQyxXQUFXLENBQUMsY0FBYyxHQUFHLEVBQUUsQ0FBQztJQUVoQyxTQUFnQixVQUFV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