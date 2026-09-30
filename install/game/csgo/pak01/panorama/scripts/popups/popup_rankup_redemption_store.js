"use strict";
/// <reference path="..\csgo.d.ts" />
var PopupRankUpRedemptionStore;
(function (PopupRankUpRedemptionStore) {
    function OnClose() {
        const callbackHandle = $.GetContextPanel().GetAttributeInt("callback", -1);
        if (callbackHandle != -1) {
            UiToolkitAPI.InvokeJSCallback(callbackHandle);
        }
        let fnPopupRankUpRedemptionStoreOnClose = $.GetContextPanel().Data().fnPopupRankUpRedemptionStoreOnClose;
        $.DispatchEvent('UIPopupButtonClicked', '');
        $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.inventory_new_item_accept', 'MOUSE');
        // Run the callback: see rankup_redemption_store.ts binding DiscoverPanels/ClickToMainMenuAndZoomIn
        if (fnPopupRankUpRedemptionStoreOnClose)
            fnPopupRankUpRedemptionStoreOnClose();
    }
    PopupRankUpRedemptionStore.OnClose = OnClose;
})(PopupRankUpRedemptionStore || (PopupRankUpRedemptionStore = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfcmFua3VwX3JlZGVtcHRpb25fc3RvcmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfcmFua3VwX3JlZGVtcHRpb25fc3RvcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUVyQyxJQUFVLDBCQUEwQixDQW1CbkM7QUFuQkQsV0FBVSwwQkFBMEI7SUFFbkMsU0FBZ0IsT0FBTztRQUV0QixNQUFNLGNBQWMsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsZUFBZSxDQUFFLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBRSxDQUFDO1FBQzdFLElBQUssY0FBYyxJQUFJLENBQUMsQ0FBQyxFQUN6QjtZQUNDLFlBQVksQ0FBQyxnQkFBZ0IsQ0FBRSxjQUFjLENBQUUsQ0FBQztTQUNoRDtRQUVELElBQUksbUNBQW1DLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDLG1DQUFtQyxDQUFDO1FBRXpHLENBQUMsQ0FBQyxhQUFhLENBQUUsc0JBQXNCLEVBQUUsRUFBRSxDQUFFLENBQUM7UUFDOUMsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxxQkFBcUIsRUFBRSxzQ0FBc0MsRUFBRSxPQUFPLENBQUUsQ0FBQztRQUUxRixtR0FBbUc7UUFDbkcsSUFBSyxtQ0FBbUM7WUFDdkMsbUNBQW1DLEVBQUUsQ0FBQztJQUN4QyxDQUFDO0lBaEJlLGtDQUFPLFVBZ0J0QixDQUFBO0FBQ0YsQ0FBQyxFQW5CUywwQkFBMEIsS0FBMUIsMEJBQTBCLFFBbUJuQyJ9