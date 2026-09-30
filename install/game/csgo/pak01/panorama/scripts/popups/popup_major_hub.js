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
        // '&' + 'titleoverride=#CSGO_official_leaderboard_pickem_cph2024_team' +
        // '&' + 'showglobaloverride=false' +
    }
    PopupMajorHub.LeaderboardPopup = LeaderboardPopup;
    function Init() {
        // Set Event id for the hub since you can eventually open it for past events
        let eventId = $.GetContextPanel().GetAttributeString('eventid', '') ? parseInt($.GetContextPanel().GetAttributeString('eventid', '')) : -1;
        if (eventId < 0) {
            ClosePopup();
            return;
        }
        ReadyForDisplay();
    }
    PopupMajorHub.Init = Init;
    function ReadyForDisplay() {
        $.Msg('PopupMajorHub ReadyForDisplay: ' + _m_cp.id);
        if (!MyPersonaAPI.IsConnectedToGC()) {
            // _m_cp.SetHasClass( 'Hidden', true );
            ClosePopup();
            return;
        }
        let restrictions = LicenseUtil.GetCurrentLicenseRestrictions();
        if (restrictions) {
            // _m_cp.SetHasClass( 'Hidden', true );
            ClosePopup();
            return;
        }
        // Expensive event handlers here
        if (!_m_inventoryUpdatedHandler) {
            _m_inventoryUpdatedHandler = $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', OnInventoryUpdated);
        }
        // Set Event id for the hub since you can eventually open it for past events
        let eventId = $.GetContextPanel().GetAttributeString('eventid', '') ? parseInt($.GetContextPanel().GetAttributeString('eventid', '')) : -1;
        if (eventId < 0) {
            //Don't  close.  the Init fires on panel load a little later.
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
        $.Msg('PopupMajorHub UnReadyForDisplay: ' + _m_cp.id);
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
        if (MyPersonaAPI.GetMyOfficialTournamentName() && // my account has tournament, and this is active event
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
        // Initialize the embedded leaderboard
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
            // All sections were false so assume the tournament is over
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
        // const allStickerIds = g_ActiveTournamentTeams.flatMap( team => [
        //     ...team.stickerids,
        //     ...team.players.flatMap(player => player.stickerids)
        // ]);
        const elStore = _m_cp.FindChildInLayoutFile('id-major-store-banner');
        const defidxStickerItem = InventoryAPI.GetItemDefinitionIndexFromDefinitionName('sticker');
        const numStickers = 10;
        for (let i = 0; i < numStickers; i++) {
            // Event Series
            //const stickerIndex = g_ActiveTournamentTeams[ getRandomInt( 0, g_ActiveTournamentTeams.length - 1 ) ].players[ getRandomInt( 0, 4 ) ].stickerids[ getRandomInt( 0, 3 ) ] ;
            // Champions and EVent Series 
            //const stickerIndex = ( i == 4 || i == 5 || i == 8 ) ? 
            // g_ActiveTournamentTeams.filter( team => team.champions.length > 1 )[0].champions[ getRandomInt( 0, 4 )].stickerids[ getRandomInt( 0, 3 ) ]  :
            // g_ActiveTournamentTeams[ getRandomInt( 0, g_ActiveTournamentTeams.length - 1 ) ].players[ getRandomInt( 0, 4 ) ].rankingids[ getRandomInt( 0, 2 ) ] ;
            // Ranked Series
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
        // If we don't own any relevant weapons, then fall back to something default
        if (!itemId) {
            /*
            let randomItems:string[] = [];
            [ 'set_timed_drops_warm', 'set_timed_drops_exuberant', 'set_timed_drops_cool' ]
            .forEach( (szLootlist)=>{
                const llname = 'lootlist:'+szLootlist;
                const llcount = InventoryAPI.GetLootListItemsCount( llname );
                for ( let ill = 0; ill < llcount; ++ ill )
                {
                    const llitem = InventoryAPI.GetLootListItemIdByIndex( llname, ill );
                    if ( InventoryAPI.GetLoadoutCategory( llitem ) === 'rifle' )
                        randomItems.push( llitem );
                }
            } );
            itemId = randomItems[ getRandomInt( 0, randomItems.length-1 ) ];
            */
            const randomRifles = [7, 8, 9, 10, 11, 13, 16, 40, 60];
            itemId = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(randomRifles[getRandomInt(0, randomRifles.length - 1)], 0);
        }
        // Now that we have ItemID, feed it into the souvenir process
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
        // no coin so use a fake one to get the challenges
        if (!tournamentCoinItemId || tournamentCoinItemId === '0') {
            bHasActiveCoin = false;
            tournamentCoinItemId = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(g_ActiveTournamentInfo.itemid_coins[0], 0);
        }
        $.Msg("tournamentCoinItemId = " + tournamentCoinItemId);
        let nCampaignID = InventoryAPI.GetItemAttributeValue(tournamentCoinItemId, "campaign id");
        $.Msg("Campaign ID = " + nCampaignID);
        let numTotalChallenges = InventoryAPI.GetCampaignNodeCount(nCampaignID);
        $.Msg("Total challenges = " + numTotalChallenges);
        let nPointsEarned = 0;
        let arrMissions = [];
        for (let i = 0; i < numTotalChallenges; ++i) {
            let nMissionNodeID = InventoryAPI.GetCampaignNodeIDbyIndex(nCampaignID, i);
            // Is this mission completed?
            let strNodeState = InventoryAPI.GetCampaignNodeState(nCampaignID, nMissionNodeID, tournamentCoinItemId, true);
            nPointsEarned = strNodeState === "complete" ? ++nPointsEarned : nPointsEarned;
            // Information about the mission
            let nQuestID = InventoryAPI.GetCampaignNodeQuestID(nCampaignID, nMissionNodeID);
            ;
            let strFauxQuestItem = InventoryAPI.GetQuestItemIDFromQuestID(nQuestID);
            let strQuestIcon = InventoryAPI.GetQuestIcon(strFauxQuestItem);
            let strQuestName = InventoryAPI.GetItemName(strFauxQuestItem);
            // Add it to the journal table of missions
            $.Msg("  mission #" + i + " questid=" + nQuestID + " (" + strQuestName + ") = " + strNodeState);
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
            // elList.AddBlurPanel( elChallenge );
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
        if (coinRedeemsPurchased) // also support legacy fan coin that didn't have purchased drop souvenirs
            coinLevel += coinRedeemsPurchased;
        let redeemed = parseInt(InventoryAPI.GetItemAttributeValue(tournamentCoinItemId, "operation drops awarded 0"));
        m_redeemAvailable = coinLevel - redeemed;
        if (_m_eventId >= 26) // Starting with Cologne 2026 Major there are no "redeemable souvenirs", rather you "Make Your Own Souvenirs"
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
        // No coin so we check if you own a pass that you can activate.  For sum reason we multiply by -1.
        let passItemId = InventoryAPI.GetActiveTournamentCoinItemId(_m_eventId * -1);
        if ((!passItemId || passItemId === '0')) // We don't have a pass so try to sell one.
         {
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
        else // We have a pass but its not active 
         {
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
        // Graffiti cannot be selected if the event is no longer active or the user does not own the tournament coin
        if (!tournamentCoinItemId || tournamentCoinItemId === '0' || g_ActiveTournamentInfo.eventid !== _m_eventId || !g_ActiveTournamentInfo.active) {
            elParent.SetHasClass('graffiti-panel-visible', false);
            return;
        }
        var elImage = $.GetContextPanel().FindChildInLayoutFile('id-tournament-journal-spray');
        elImage.itemid = ItemInfo.GetFauxReplacementItemID(tournamentCoinItemId, 'graffiti');
        $.Msg('_SetUpSpray' + elImage.itemid);
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
        // Each section locks all the groups at the same time.  We use to have many group that locked at different times. 
        // The get by index still supports that
        let groupId = PredictionsAPI.GetSectionGroupIDByIndex(_m_tournamentId, sectionId, 0);
        m_selectedPage = elPage;
        m_oPageData.panel = elPage;
        m_oPageData.eventId = _m_eventId;
        m_oPageData.tournamentId = _m_tournamentId;
        m_oPageData.sectionId = sectionId;
        m_oPageData.groupId = groupId;
        m_oPageData.sectionIndex = sectionIndex;
        PredictionsTimer.UpdateTimer();
        // Set up pages for first 2 stages. These are the same so they share logic
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
        $.Msg('MatchListAPIGetState: ' + listState);
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
            $.Msg('GetMyPredictionsLoaded: ' + isLoaded);
            _CancelMatchStatsLoadedTimeout();
            _m_cp.SetHasClass('loading', false);
            // Delay since we have frames in frames. 
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
        // timer already checks for what panel is active to update its self
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
        /*
        Object.entries(nSouvenir.souvenirs).forEach( element => {
            let defName = InventoryAPI.GetItemDefinitionName( InventoryAPI.GetFauxItemIDFromDefAndPaintIndex( element[1], 0 )) as string;
            if( defName === newItemDefName )
            {
                // PopupMajorHub.ClosePopup();
                $.DispatchEvent( 'ShowAcknowledgePopup', '', '' );
                $.DispatchEvent( 'HideStoreStatusPanel' );

                return;
            }
        });
        */
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
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
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
                $.Msg('oPageData.panel.id = ' + oPageData.panel.id);
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
            // elBtn!.SetHasClass( 'saved', !bPicksDifferent );
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
            for (var i = 0; i < nCount; ++i) { // Add my prediction per each slot into the batch (3 params per each pick)
                args.push(aLocalPicks[i].group.toString(), aLocalPicks[i].groupIndex.toString(), PredictionsAPI.GetFakeItemIDToRepresentTeamID(oPageData.tournamentId, aLocalPicks[i].teamId)); // Add 3 params for this pick
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