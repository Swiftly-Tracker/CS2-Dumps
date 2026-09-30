"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../popups/popup_inspect_shared.ts" />
/// <reference path="../watchtile.ts" />
var PopupRedeemSouvenir;
(function (PopupRedeemSouvenir) {
    let m_scheduleHandle = null;
    let m_tournamentIndex = null;
    let m_matchId = '';
    let m_redeemsAvailable = 0;
    function Init() {
        $.GetContextPanel().FindChildInLayoutFile('popup-redeem-spinner').visible = false;
        m_tournamentIndex = $.GetContextPanel().GetAttributeString("tournamentindex", "");
        m_matchId = $.GetContextPanel().GetAttributeString("matchid", "");
        if (!m_tournamentIndex || !m_matchId) {
            OnClose();
            return;
        }
        _SetMatchTile();
        _SetDescText();
    }
    PopupRedeemSouvenir.Init = Init;
    ;
    function _SetMatchTile() {
        const elMatchtile = $.CreatePanel('Panel', $.GetContextPanel().FindChildInLayoutFile('id-popup-matchtile-redeem'), 'id-match-tile', {
            class: 'MatchTile--Redeem'
        });
        elMatchtile.Data().matchId = m_matchId;
        elMatchtile.BLoadLayout('file://{resources}/layout/matchtiles/tournament.xml', false, false);
        elMatchtile.RemoveClass('MatchTile--Collapse');
        watchTile.Init(elMatchtile);
    }
    ;
    function _SetDescText() {
        const coinId = InventoryAPI.GetActiveTournamentCoinItemId(parseInt(m_tournamentIndex));
        const elLabel = $.GetContextPanel().FindChildInLayoutFile('MessageLabel');
        if (!coinId || coinId === '0') {
            elLabel.visible = false;
            return;
        }
        let coinLevel = InventoryAPI.GetItemAttributeValue(coinId, "upgrade level");
        let coinRedeemsPurchased = InventoryAPI.GetItemAttributeValue(coinId, "operation drops awarded 1");
        if (coinRedeemsPurchased)
            coinLevel += coinRedeemsPurchased;
        const redeemed = InventoryAPI.GetItemAttributeValue(coinId, "operation drops awarded 0");
        var redeemsAvailable = coinLevel - redeemed;
        m_redeemsAvailable = redeemsAvailable;
        elLabel.SetDialogVariableInt('redeems', redeemsAvailable);
        elLabel.text = (redeemsAvailable > 1) ?
            $.Localize('#popup_redeem_souvenir_desc:f', elLabel) :
            $.Localize('#popup_redeem_souvenir_desc_single', elLabel);
        elLabel.visible = true;
    }
    ;
    function OnRedeem() {
        _ResetTimeouthandle();
        const coinId = InventoryAPI.GetActiveTournamentCoinItemId(parseInt(m_tournamentIndex));
        if (!coinId || coinId === '0') {
            return;
        }
        if (m_redeemsAvailable <= 0) {
            OnClose();
            UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_tournament_journal.xml', 'journalid=' + coinId);
            return;
        }
        const contextPanel = $.GetContextPanel();
        m_scheduleHandle = $.Schedule(5, () => _CancelWaitforCallBack(contextPanel));
        $.GetContextPanel().FindChildInLayoutFile('popup-redeem-spinner').visible = true;
        $.GetContextPanel().FindChildInLayoutFile('id-popup-redeem-btn').visible = false;
        MatchInfoAPI.RequestMatchTournamentSouvenir(m_matchId, coinId);
    }
    PopupRedeemSouvenir.OnRedeem = OnRedeem;
    ;
    function ItemCustomizationNotification(numericType, type, itemid) {
        _ResetTimeouthandle();
        if (type === 'souvenir_generated') {
            InventoryAPI.AcknowledgeNewItembyItemID(itemid);
            const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_inventory_inspect.xml');
            let oSettings = {
                item_id: itemid,
                inspect_only: true,
                hide_char_select: true,
                hide_all_action_items: true,
                show_market_link: false,
                hide_item_cert: true,
            };
            elPanel.Data().oSettings = oSettings;
            OnClose();
        }
    }
    PopupRedeemSouvenir.ItemCustomizationNotification = ItemCustomizationNotification;
    ;
    function _ResetTimeouthandle() {
        if (m_scheduleHandle) {
            $.CancelScheduled(m_scheduleHandle);
            m_scheduleHandle = null;
        }
    }
    ;
    function _CancelWaitforCallBack(elPanel) {
        m_scheduleHandle = null;
        if (!elPanel || !elPanel.IsValid()) {
            return;
        }
        elPanel.FindChildInLayoutFile('popup-redeem-spinner').visible = false;
        $.DispatchEvent('UIPopupButtonClicked', '');
        UiToolkitAPI.ShowGenericPopupOk($.Localize('#SFUI_SteamConnectionErrorTitle'), $.Localize('#SFUI_InvError_Item_Not_Given'), '', function () {
        });
    }
    ;
    function OnClose() {
        _ResetTimeouthandle();
        $.DispatchEvent('UIPopupButtonClicked', '');
    }
    PopupRedeemSouvenir.OnClose = OnClose;
    $.RegisterForUnhandledEvent('PanoramaComponent_Inventory_ItemCustomizationNotification', ItemCustomizationNotification);
})(PopupRedeemSouvenir || (PopupRedeemSouvenir = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfcmVkZWVtX3NvdXZlbmlyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvcG9wdXBzL3BvcHVwX3JlZGVlbV9zb3V2ZW5pci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBQ3JDLDBEQUEwRDtBQUMxRCx3Q0FBd0M7QUFFeEMsSUFBVSxtQkFBbUIsQ0F1SzVCO0FBdktELFdBQVUsbUJBQW1CO0lBRXpCLElBQUksZ0JBQWdCLEdBQWtCLElBQUksQ0FBQztJQUMzQyxJQUFJLGlCQUFpQixHQUFtQixJQUFJLENBQUM7SUFDaEQsSUFBSSxTQUFTLEdBQUcsRUFBRSxDQUFDO0lBQ25CLElBQUksa0JBQWtCLEdBQUcsQ0FBQyxDQUFDO0lBRXhCLFNBQWdCLElBQUk7UUFFaEIsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLHNCQUFzQixDQUFFLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztRQUNwRixpQkFBaUIsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsa0JBQWtCLENBQUUsaUJBQWlCLEVBQUUsRUFBRSxDQUFZLENBQUM7UUFDOUYsU0FBUyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxTQUFTLEVBQUUsRUFBRSxDQUFFLENBQUM7UUFFcEUsSUFBSyxDQUFDLGlCQUFpQixJQUFJLENBQUMsU0FBUyxFQUNyQztZQUNJLE9BQU8sRUFBRSxDQUFDO1lBQ1YsT0FBTztTQUNWO1FBRUQsYUFBYSxFQUFFLENBQUM7UUFDaEIsWUFBWSxFQUFFLENBQUM7SUFDbkIsQ0FBQztJQWRlLHdCQUFJLE9BY25CLENBQUE7SUFBQSxDQUFDO0lBRUYsU0FBUyxhQUFhO1FBRWxCLE1BQU0sV0FBVyxHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FB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