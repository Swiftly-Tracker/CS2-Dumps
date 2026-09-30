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
        if (fnPopupRankUpRedemptionStoreOnClose)
            fnPopupRankUpRedemptionStoreOnClose();
    }
    PopupRankUpRedemptionStore.OnClose = OnClose;
})(PopupRankUpRedemptionStore || (PopupRankUpRedemptionStore = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfcmFua3VwX3JlZGVtcHRpb25fc3RvcmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfcmFua3VwX3JlZGVtcHRpb25fc3RvcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUVyQyxJQUFVLDBCQUEwQixDQW1CbkM7QUFuQkQsV0FBVSwwQkFBMEI7SUFFbkMsU0FBZ0IsT0FBTztRQUV0QixNQUFNLGNBQWMsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsZUFBZSxDQUFFLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBRSxDQUFDO1FBQzdFLElBQUssY0FBYyxJQUFJLENBQUMsQ0FBQyxFQUN6QjtZQUNDLFlBQVksQ0FBQyxnQkFBZ0IsQ0FBRSxjQUFjLENBQUUsQ0FBQztTQUNoRDtRQUVELElBQUksbUNBQW1DLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDLG1DQUFtQyxDQUFDO1FBRXpHLENBQUMsQ0FBQyxhQUFhLENBQUUsc0JBQXNCLEVBQUUsRUFBRSxDQUFFLENBQUM7UUFDOUMsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxxQkFBcUIsRUFBRSxzQ0FBc0MsRUFBRSxPQUFPLENBQUUsQ0FBQztRQUcxRixJQUFLLG1DQUFtQztZQUN2QyxtQ0FBbUMsRUFBRSxDQUFDO0lBQ3hDLENBQUM7SUFoQmUsa0NBQU8sVUFnQnRCLENBQUE7QUFDRixDQUFDLEVBbkJTLDBCQUEwQixLQUExQiwwQkFBMEIsUUFtQm5DIn0=