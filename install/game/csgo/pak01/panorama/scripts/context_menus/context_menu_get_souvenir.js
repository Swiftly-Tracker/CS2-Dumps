"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../popups/popup_acknowledge_item.ts" />
/// <reference path="../generated/items_event_current_generated_store.d.ts" />
/// <reference path="../generated/items_event_current_generated_store.ts" />
var ContextMenuGetSouvenir;
(function (ContextMenuGetSouvenir) {
    let _m_redeemsAvailable = 0;
    let _m_coinId = '';
    let m_scheduleHandle;
    function Init() {
        let sUmids = $.GetContextPanel().GetAttributeString('umids', '');
        if (!sUmids) {
            $.GetContextPanel().SetHasClass('no-score', true);
            return;
        }
        $.GetContextPanel().SetHasClass('no-score', false);
        let tournamentIndex = $.GetContextPanel().GetAttributeString('tournamentId', '');
        _m_coinId = InventoryAPI.GetActiveTournamentCoinItemId(parseInt(tournamentIndex));
        if (_m_coinId && _m_coinId !== '0') {
            let coinLevel = parseInt(InventoryAPI.GetItemAttributeValue(_m_coinId, "upgrade level"));
            let coinRedeemsPurchased = parseInt(InventoryAPI.GetItemAttributeValue(_m_coinId, "operation drops awarded 1"));
            if (coinRedeemsPurchased)
                coinLevel += coinRedeemsPurchased;
            let redeemed = parseInt(InventoryAPI.GetItemAttributeValue(_m_coinId, "operation drops awarded 0"));
            _m_redeemsAvailable = coinLevel - redeemed;
        }
        let aUmids = sUmids.split(',');
        aUmids.forEach(umid => {
            let elParent = $.GetContextPanel().FindChildInLayoutFile('id-get-souvenir-matches-list');
            MakeMatch(elParent, umid);
        });
        _SetRedeemHeader();
    }
    ContextMenuGetSouvenir.Init = Init;
    function _SetRedeemHeader() {
        let elRedeemHeader = $.GetContextPanel().FindChildInLayoutFile('id-get-souvenir-matches-redeem');
        elRedeemHeader.visible = false;
        if (_m_redeemsAvailable > 0) {
            elRedeemHeader.visible = true;
            elRedeemHeader.SetDialogVariableInt('redeems', _m_redeemsAvailable);
            elRedeemHeader.SetDialogVariable('redeems-text', $.Localize('#popup_redeem_souvenir_desc:f', elRedeemHeader));
        }
        else {
            elRedeemHeader.GetParent().visible = false;
        }
    }
    function MakeMatch(elParent, umid) {
        let elMatch = elParent.FindChild(umid);
        if (!elMatch) {
            elMatch = $.CreatePanel("Panel", elParent, umid);
            elMatch.BLoadLayoutSnippet("get-souvenir-tile");
        }
        let team0 = MatchInfoAPI.GetMatchTournamentTeamTag(umid, 0);
        let team1 = MatchInfoAPI.GetMatchTournamentTeamTag(umid, 1);
        let res = MatchInfoAPI.GetMatchOutcome(umid);
        let team0Score = MatchInfoAPI.GetMatchRoundScoreForTeam(umid, 0);
        let team1Score = MatchInfoAPI.GetMatchRoundScoreForTeam(umid, 1);
        let bTteamSwap = (res == 2);
        elMatch.SetDialogVariableInt('match-score-0', bTteamSwap ? team1Score : team0Score);
        elMatch.SetDialogVariableInt('match-score-1', bTteamSwap ? team0Score : team1Score);
        elMatch.SetDialogVariable('teamname-0', bTteamSwap ?
            MatchInfoAPI.GetMatchTournamentTeamName(umid, 1) :
            MatchInfoAPI.GetMatchTournamentTeamName(umid, 0));
        elMatch.SetDialogVariable('teamname-1', bTteamSwap ?
            MatchInfoAPI.GetMatchTournamentTeamName(umid, 0) :
            MatchInfoAPI.GetMatchTournamentTeamName(umid, 1));
        elMatch.FindChildInLayoutFile('id-team-logo-0').SetImage("file://{images}/tournaments/teams/" +
            (bTteamSwap ? team1 : team0) + ".svg");
        elMatch.FindChildInLayoutFile('id-team-logo-1').SetImage("file://{images}/tournaments/teams/" +
            (bTteamSwap ? team0 : team1) + ".svg");
        var rawMapName = MatchInfoAPI.GetMatchMap(umid);
        let mapBg = elMatch.FindChild('id-map-bg');
        mapBg.style.backgroundImage = 'url("file://{images}/map_icons/screenshots/720p/' + rawMapName + '.png")';
        mapBg.style.backgroundPosition = '50% 50%';
        mapBg.style.backgroundSize = 'clip_then_cover';
        mapBg.style.backgroundImgOpacity = '.25';
        elMatch.FindChildInLayoutFile('id-map-logo').SetImage("file://{images}/map_icons/map_icon_" + rawMapName + ".svg");
        let tournamentId = $.GetContextPanel().GetAttributeString('tournamentId', '');
        _SetButtonHintText(elMatch, parseInt(tournamentId), umid);
        _SetPreviewBtn(elMatch, rawMapName, umid);
        elMatch.SetHasClass('show', true);
    }
    function _SetButtonHintText(elMatch, tournamentIndex, umid) {
        let elGetSouvenir = elMatch.FindChildInLayoutFile('id-get-souvenir');
        let elGetSouvenirBtn = elMatch.FindChildInLayoutFile('id-get-souvenir-btn');
        let elDropdown = elMatch.FindChildInLayoutFile('PurchaseCountDropdown');
        let tailUmid = umid.split('_').at(-1);
        const nEventID = MatchInfoAPI.GetMatchTournamentEventID(umid);
        const nStageID = MatchInfoAPI.GetMatchTournamentStageID(umid);
        const team0 = MatchInfoAPI.GetMatchTournamentTeamID(umid, 0);
        const team1 = MatchInfoAPI.GetMatchTournamentTeamID(umid, 1);
        const bPlayoffMatch = MatchInfoAPI.IsMatchTournamentStageIDPlayoff(nStageID);
        const bThisMatchHasRedeemsEnabled = !bPlayoffMatch || InventoryAPI.HasHighlightReelSchema(nEventID, nStageID, team0, team1);
        elGetSouvenir.SetHasClass('awaiting-highlights', !bThisMatchHasRedeemsEnabled && (nEventID < 26));
        if (nEventID >= 26) {
            let previewBtn = elMatch.FindChildInLayoutFile('id-preview-souvenir-btn');
            previewBtn.text = $.Localize('#popup_redeem_souvenir_action_craft');
            return;
        }
        if (_m_redeemsAvailable > 0) {
            elGetSouvenir.SetDialogVariable('price', $.Localize('#popup_redeem_souvenir_action_redeem'));
            elDropdown.visible = false;
            elGetSouvenir.SetHasClass('only-purchase', false);
            elGetSouvenirBtn.SetPanelEvent('onactivate', () => {
                _ResetTimeouthandle();
                MatchInfoAPI.RequestMatchTournamentSouvenir(umid, _m_coinId);
                $.GetContextPanel().FindChildInLayoutFile('id-get-souvenir-matches-spinner').visible = true;
                $.GetContextPanel().FindChildInLayoutFile('id-get-souvenir-matches-spinner').SetPanelEvent('onactivate', () => { });
                m_scheduleHandle = $.Schedule(5, () => _CancelWaitforCallBack());
            });
            return;
        }
        let defIndexForCharges = g_ActiveTournamentInfo.itemid_charge;
        let idFaux = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(defIndexForCharges, 0);
        if (StoreAPI.GetStoreItemSalePrice(idFaux, 1, '')) {
            elGetSouvenir.SetDialogVariable('redeems-text', $.Localize('#popup_redeem_souvenir_action'));
            UpdateQuantity(elMatch);
            elGetSouvenirBtn.SetPanelEvent('onactivate', () => {
                _ResetTimeouthandle();
                let elDropdown = elMatch.FindChildInLayoutFile('PurchaseCountDropdown');
                let qty = Number(elDropdown.GetSelected().id);
                let purchaseList = [];
                for (let i = 0; i < qty; i++) {
                    purchaseList.push(defIndexForCharges + '(' + tailUmid + ')');
                }
                let purchaseString = purchaseList.join(',');
                StoreAPI.StoreItemPurchase(purchaseString);
            });
            elDropdown.visible = true;
            elGetSouvenir.SetHasClass('only-purchase', true);
            elDropdown.SetPanelEvent('oninputsubmit', () => UpdateQuantity(elMatch));
            return;
        }
        elGetSouvenir.visible = false;
    }
    ;
    function UpdateQuantity(elMatch) {
        if (!elMatch || !elMatch.IsValid())
            return;
        let elDropdown = elMatch.FindChildInLayoutFile('PurchaseCountDropdown');
        let qty = Number(elDropdown.GetSelected().id);
        let elGetSouvenir = elMatch.FindChildInLayoutFile('id-get-souvenir');
        let idForCharges = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(g_ActiveTournamentInfo.itemid_charge, 0);
        elGetSouvenir.SetDialogVariable('price', StoreAPI.GetStoreItemSalePrice(idForCharges, qty, ''));
    }
    ContextMenuGetSouvenir.UpdateQuantity = UpdateQuantity;
    function _ResetTimeouthandle() {
        if (m_scheduleHandle) {
            $.CancelScheduled(m_scheduleHandle);
            m_scheduleHandle = null;
        }
    }
    ;
    function _CancelWaitforCallBack() {
        m_scheduleHandle = null;
        const elPanel = $.GetContextPanel();
        if (!elPanel || !elPanel.IsValid()) {
            return;
        }
        elPanel.FindChildInLayoutFile('id-get-souvenir-matches-spinner').visible = false;
        $.DispatchEvent('ContextMenuEvent', '');
        UiToolkitAPI.ShowGenericPopupOk($.Localize('#SFUI_SteamConnectionErrorTitle'), $.Localize('#SFUI_InvError_Item_Not_Given'), '', function () {
        });
    }
    ;
    function _SetPreviewBtn(elMatch, rawMapName, umid) {
        let previewBtn = elMatch.FindChildInLayoutFile('id-preview-souvenir-btn');
        StoreAPI.VolatileShopSubscribe(g_ActiveTournamentInfo.itemid_dynamic_stickers, true);
        previewBtn.SetPanelEvent('onactivate', () => {
            const defidxStickerItem = InventoryAPI.GetItemDefinitionIndexFromDefinitionName('sticker');
            const idFauxSticker = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(defidxStickerItem, g_ActiveTournamentInfo.stickerids[g_ActiveTournamentInfo.stickerids.length - 1]);
            if (!MissionsAPI.GetSeasonalOperationFauxCreditsCost(g_ActiveTournamentInfo.credits_id, idFauxSticker)) {
                StoreAPI.VolatileShopSubscribe(g_ActiveTournamentInfo.itemid_dynamic_stickers, true);
                return;
            }
            $.DispatchEvent('CSGOPlaySoundEffect', 'sticker_applySticker', 'MOUSE');
            $.DispatchEvent('ContextMenuEvent', '');
            $.DispatchEvent('ShowSelectItemForCapabilityPopup', umid, '', 'craft_souvenir');
        });
    }
    var _ItemCustomizationNotification = function (numericType, type, itemid) {
        _ResetTimeouthandle();
        if (type === 'souvenir_generated') {
            let itemsToAcknowledge = AcknowledgeItems.GetItems();
            if (itemsToAcknowledge.length > 0) {
                $.DispatchEvent('ShowAcknowledgePopup', '', '');
            }
            return;
        }
    };
    {
        $.RegisterForUnhandledEvent('PanoramaComponent_Inventory_ItemCustomizationNotification', _ItemCustomizationNotification);
    }
})(ContextMenuGetSouvenir || (ContextMenuGetSouvenir = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dF9tZW51X2dldF9zb3V2ZW5pci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL2NvbnRleHRfbWVudXMvY29udGV4dF9tZW51X2dldF9zb3V2ZW5pci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBQ3JDLDREQUE0RDtBQUM1RCw4RUFBOEU7QUFDOUUsNEVBQTRFO0FBRTVFLElBQVUsc0JBQXNCLENBcVQvQjtBQXJURCxXQUFVLHNCQUFzQjtJQUU1QixJQUFJLG1CQUFtQixHQUFVLENBQUMsQ0FBQztJQUNuQyxJQUFJLFNBQVMsR0FBRyxFQUFFLENBQUM7SUFDbkIsSUFBSSxnQkFBOEIsQ0FBQztJQUVuQyxTQUFnQixJQUFJO1FBRWhCLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxPQUFPLEVBQUUsRUFBRSxDQUFFLENBQUM7UUFDbkUsSUFBSSxDQUFDLE1BQU0sRUFDWDtZQUNJLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxXQUFXLENBQUUsVUFBVSxFQUFFLElBQUksQ0FBRSxDQUFDO1lBQ3BELE9BQU87U0FDVjtRQUdELENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxXQUFXLENBQUUsVUFBVSxFQUFFLEtBQUssQ0FBRSxDQUFDO1FBRXJELElBQUksZUFBZSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxjQUFjLEVBQUUsRUFBRSxDQUFFLENBQUM7UUFDbkYsU0FBUyxHQUFHLFlBQVksQ0FBQyw2QkFBNkIsQ0FBRSxRQUFRLENBQUUsZUFBZSxDQUFFLENBQUMsQ0FBQztRQUNyRixJQUFJLFNBQVMsSUFBSSxTQUFTLEtBQUssR0FBRyxFQUNsQztZQUNJLElBQUksU0FBUyxHQUFHLFFBQVEsQ0FBRSxZQUFZLENBQUMscUJBQXFCLENBQUUsU0FBUyxFQUFF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