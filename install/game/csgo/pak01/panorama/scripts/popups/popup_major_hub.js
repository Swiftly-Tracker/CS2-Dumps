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
        elPrice.FindChildInLayoutFile('id-major-hub-store-price-label').text =
            $.Localize(bOnSale ? '#major_store_sale_banner' : '#major_hub_store_finish_prices', elPrice);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfbWFqb3JfaHViLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvcG9wdXBzL3BvcHVwX21ham9yX2h1Yi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQ0EscUNBQXFDO0FBQ3JDLGlEQUFpRDtBQUNqRCx3REFBd0Q7QUFDeEQsK0NBQStDO0FBQy9DLGlEQUFpRDtBQUNqRCw4RUFBOEU7QUFDOUUsNEVBQTRFO0FBQzVFLHdFQUF3RTtBQUN4RSw0REFBNEQ7QUFDNUQsNkNBQTZDO0FBQzdDLDREQUE0RDtBQUM1RCxrRUFBa0U7QUFDbEUsb0VBQW9FO0FBRXBFLElBQVUsYUFBYSxDQXM3QnRCO0FBdDdCRCxXQUFVLGFBQWE7SUFFdEIsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBQy9CLE1BQU0sZ0JBQWdCLEdBQVksS0FBSyxDQUFDLHFCQUFxQixDQUFFLGlCQUFpQixDQUFFLENBQUM7SUFDbkYsSUFBSSxnQkFBK0IsQ0FBQztJQUNwQyxJQUFJLFVBQWtCLENBQUM7SUFDdkIsSUFBSSxlQUF1QixDQUFDO0lBQzVCLElBQUksMEJBQXlDLENBQUM7SUFDOUMsSUFBSSxjQUE4QixDQUFDO0lBQ25DLElBQUksZUFBeUIsQ0FBQztJQUM5QixJQUFJLHNCQUFzQixHQUFrQixJQUFJLENBQUM7SUFDakQsSUFBSSxpQkFBaUIsR0FBVyxDQUFDLENBQUM7SUFHbEMsTUFBTSx5QkFBeUIsR0FBRyxHQUFHLENBQUM7SUFDdEMsSUFBSSxnQkFBZ0IsR0FBRyxLQUFLLENBQUM7SUFDN0IsSUFBSSxlQUFlLEdBQUcsQ0FBQyxDQUFDO0lBQ3hCLElBQUksbUJBQW1CLEdBQWtCLElBQUksQ0FBQztJQTRCOUMsSUFBSSxXQUFXLEdBQUcsRUFBZ0IsQ0FBQztJQUNuQyxXQUFXLENBQUMsY0FBYyxHQUFHLEVBQUUsQ0FBQztJQUVoQyxTQUFnQixVQUFV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