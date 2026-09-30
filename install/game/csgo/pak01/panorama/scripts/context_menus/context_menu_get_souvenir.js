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
        $.Msg('sUmids" ' + sUmids);
        $.GetContextPanel().SetHasClass('no-score', false);
        let tournamentIndex = $.GetContextPanel().GetAttributeString('tournamentId', '');
        _m_coinId = InventoryAPI.GetActiveTournamentCoinItemId(parseInt(tournamentIndex));
        if (_m_coinId && _m_coinId !== '0') {
            let coinLevel = parseInt(InventoryAPI.GetItemAttributeValue(_m_coinId, "upgrade level"));
            let coinRedeemsPurchased = parseInt(InventoryAPI.GetItemAttributeValue(_m_coinId, "operation drops awarded 1"));
            if (coinRedeemsPurchased) // also support legacy fan coin that didn't have purchased drop souvenirs
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
        // var mapStringPrefix = '#SFUI_Map_';
        // elMatch.SetDialogVariable( 'map-name', $.Localize( mapStringPrefix + rawMapName ) );
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
        // Playoff souvenirs can only be redeemed when the highlight reels have been generated
        const nEventID = MatchInfoAPI.GetMatchTournamentEventID(umid);
        const nStageID = MatchInfoAPI.GetMatchTournamentStageID(umid);
        const team0 = MatchInfoAPI.GetMatchTournamentTeamID(umid, 0);
        const team1 = MatchInfoAPI.GetMatchTournamentTeamID(umid, 1);
        const bPlayoffMatch = MatchInfoAPI.IsMatchTournamentStageIDPlayoff(nStageID);
        const bThisMatchHasRedeemsEnabled = !bPlayoffMatch || InventoryAPI.HasHighlightReelSchema(nEventID, nStageID, team0, team1);
        elGetSouvenir.SetHasClass('awaiting-highlights', !bThisMatchHasRedeemsEnabled && (nEventID < 26)); // EventID=26 => Cologne 2026 Major => Make Your Own Souvenirs
        if (nEventID >= 26) {
            let previewBtn = elMatch.FindChildInLayoutFile('id-preview-souvenir-btn');
            previewBtn.text = $.Localize('#popup_redeem_souvenir_action_craft');
            return;
        }
        // You can only redeem before buying
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
        // If souvenirs are for sale then you can purchase
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
        // Make sure we are subscirbed to the shop prices if we are going to make souvenirs
        StoreAPI.VolatileShopSubscribe(g_ActiveTournamentInfo.itemid_dynamic_stickers, true);
        previewBtn.SetPanelEvent('onactivate', () => {
            /*
            $.Msg( 'g_ActiveTournamentInfo + ' + g_ActiveTournamentInfo.souvenirs[rawMapName]);

            let nEventID = MatchInfoAPI.GetMatchTournamentEventID( umid );
            let nStageID = MatchInfoAPI.GetMatchTournamentStageID( umid );
            let team0 = MatchInfoAPI.GetMatchTournamentTeamID( umid, 0 );
            let team1 = MatchInfoAPI.GetMatchTournamentTeamID( umid, 1 );

            const bPlayoffMatch = MatchInfoAPI.IsMatchTournamentStageIDPlayoff( nStageID );
            let idFaux = InventoryAPI.GetFauxItemIDFromDefAndPaintIndexUB1( g_ActiveTournamentInfo.souvenirs[rawMapName], 0, bPlayoffMatch ? 13 : 0 );

            let attributes = `{ "tournament event id": ${nEventID}, "tournament event stage id": ${nStageID}, "tournament event team0 id": ${team0}, "tournament event team1 id": ${team1} }`;

            const elPanel = UiToolkitAPI.ShowCustomLayoutPopup(
                'popup-inspect-' + idFaux,
                'file://{resources}/layout/popups/popup_capability_decodable.xml'
            );

            let oSettings: InspectPopupSettings_t= {
                item_id: idFaux,
                item_attributes: attributes,
                show_work_type_warning: false,
                force_hide_async_bar: true,
                inspect_only: true,
                work_type: 'decodeable',
                only_close_btn: true
            }

            elPanel.Data().oSettings = oSettings;
            */
            const defidxStickerItem = InventoryAPI.GetItemDefinitionIndexFromDefinitionName('sticker');
            const idFauxSticker = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(defidxStickerItem, g_ActiveTournamentInfo.stickerids[g_ActiveTournamentInfo.stickerids.length - 1]);
            if (!MissionsAPI.GetSeasonalOperationFauxCreditsCost(g_ActiveTournamentInfo.credits_id, idFauxSticker)) {
                StoreAPI.VolatileShopSubscribe(g_ActiveTournamentInfo.itemid_dynamic_stickers, true);
                return; // we have to wait till we have actual pricesheet to use our credits
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
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        $.RegisterForUnhandledEvent('PanoramaComponent_Inventory_ItemCustomizationNotification', _ItemCustomizationNotification);
    }
})(ContextMenuGetSouvenir || (ContextMenuGetSouvenir = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dF9tZW51X2dldF9zb3V2ZW5pci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL2NvbnRleHRfbWVudXMvY29udGV4dF9tZW51X2dldF9zb3V2ZW5pci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBQ3JDLDREQUE0RDtBQUM1RCw4RUFBOEU7QUFDOUUsNEVBQTRFO0FBRTVFLElBQVUsc0JBQXNCLENBcVQvQjtBQXJURCxXQUFVLHNCQUFzQjtJQUU1QixJQUFJLG1CQUFtQixHQUFVLENBQUMsQ0FBQztJQUNuQyxJQUFJLFNBQVMsR0FBRyxFQUFFLENBQUM7SUFDbkIsSUFBSSxnQkFBOEIsQ0FBQztJQUVuQyxTQUFnQixJQUFJO1FBRWhCLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxPQUFPLEVBQUUsRUFBRSxDQUFFLENBQUM7UUFDbkUsSUFBSSxDQUFDLE1BQU0sRUFDWDtZQUNJLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxXQUFXLENBQUUsVUFBVSxFQUFFLElBQUksQ0FBRSxDQUFDO1lBQ3BELE9BQU87U0FDVjtRQUVELENBQUMsQ0FBQyxHQUFHLENBQUUsVUFBVSxHQUFHLE1BQU0sQ0FBQyxDQUFDO1FBQzVCLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxXQUFXLENBQUUsVUFBVSxFQUFFLEtBQUssQ0FBRSxDQUFDO1FBRXJELElBQUksZUFBZSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxjQUFjLEVBQUUsRUFBRSxDQUFFLENBQUM7UUFDbkYsU0FBUyxHQUFHLFlBQVksQ0FBQyw2QkFBNkIsQ0FBRSxRQUFRLENBQUUsZUFBZSxDQUFFLENBQUMsQ0FBQztRQUNyRixJQUFJLFNBQVMsSUFBSSxTQUFTLEtBQUssR0FBRyxFQUNsQztZQUNJLElBQUks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