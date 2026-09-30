"use strict";
/// <reference path="csgo.d.ts" />
var MainMenuSelectItemForCapability;
(function (MainMenuSelectItemForCapability) {
    function _ShowSelectItemForCapabilityPopup(itemid, itemid2, capability, bWorkshopItemPreview = false) {
        _OpenSelectItemForCapabilityPopUp(itemid, itemid2, capability, bWorkshopItemPreview);
    }
    function _ShowSelectItemForWorkshopPreviewCapability(capability, itemid, itemid2) {
        _OpenSelectItemForCapabilityPopUp(capability, itemid, itemid2, true);
    }
    function _PromptShowSelectItemForCapabilityPopup(titletxt, messagetxt, capability, itemid, itemid2) {
        UiToolkitAPI.ShowGenericPopupOkCancel($.Localize(titletxt), $.Localize(messagetxt), '', () => $.DispatchEvent('ShowSelectItemForCapabilityPopup', itemid, itemid2, capability), () => { });
    }
    function _OpenSelectItemForCapabilityPopUp(itemid, itemid2 = '', capability, bWorkshopItemPreview = false) {
        const CloseItemForCapabilityCallbackHandle = UiToolkitAPI.RegisterJSCallback(() => {
            if (CloseItemForCapabilityCallbackHandle) {
                UiToolkitAPI.UnregisterJSCallback(CloseItemForCapabilityCallbackHandle);
            }
        });
        const sWorkshop = bWorkshopItemPreview === true ? bWorkshopItemPreview : false;
        $.DispatchEvent('CSGOPlaySoundEffect', 'tab_mainmenu_inventory', 'MOUSE');
        UiToolkitAPI.ShowCustomLayoutPopupParameters('id-select-item-for-capability=' + itemid, 'file://{resources}/layout/popups/popup_select_item_for_capability.xml', 'itemid=' + itemid +
            '&' + 'secondaryItemid=' + itemid2 +
            '&' + 'bWorkshopItemPreview=' + sWorkshop +
            '&' + 'capability=' + capability +
            '&' + 'callback=' + CloseItemForCapabilityCallbackHandle);
    }
    {
        $.RegisterForUnhandledEvent('PromptShowSelectItemForCapabilityPopup', _PromptShowSelectItemForCapabilityPopup);
        $.RegisterForUnhandledEvent('ShowSelectItemForCapabilityPopup', _ShowSelectItemForCapabilityPopup);
        $.RegisterForUnhandledEvent('ShowSelectItemForWorkshopPreviewCapability', _ShowSelectItemForWorkshopPreviewCapability);
    }
})(MainMenuSelectItemForCapability || (MainMenuSelectItemForCapability = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbm1lbnVfc2VsZWN0X2l0ZW1fZm9yX2NhcGFiaWxpdHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9tYWlubWVudV9zZWxlY3RfaXRlbV9mb3JfY2FwYWJpbGl0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBRWxDLElBQVUsK0JBQStCLENBcUR4QztBQXJERCxXQUFVLCtCQUErQjtJQUVyQyxTQUFTLGlDQUFpQyxDQUFFLE1BQWMsRUFBRSxPQUFlLEVBQUUsVUFBa0IsRUFBRSx1QkFBK0IsS0FBSztRQUVqSSxpQ0FBaUMsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBRSxvQkFBb0IsQ0FBRSxDQUFDO0lBQzFGLENBQUM7SUFFRCxTQUFTLDJDQUEyQyxDQUFFLFVBQWtCLEVBQUUsTUFBYyxFQUFFLE9BQWU7UUFFM0csaUNBQWlDLENBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFFLENBQUM7SUFDeEUsQ0FBQztJQUdFLFNBQVMsdUNBQXVDLENBQUUsUUFBZ0IsRUFBRSxVQUFrQixFQUFFLFVBQWtCLEVBQUUsTUFBYyxFQUFFLE9BQWU7UUFFN0ksWUFBWSxDQUFDLHdCQUF3QixDQUNwQyxDQUFDLENBQUMsUUFBUSxDQUFFLFFBQVEsQ0FBRSxFQUN0QixDQUFDLENBQUMsUUFBUSxDQUFFLFVBQVUsQ0FBRSxFQUN4QixFQUFFLEVBQ0YsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxrQ0FBa0MsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLFVBQVUsQ0FBRSxFQUN4RixHQUFHLEVBQUUsR0FBRSxDQUFDLENBQ1IsQ0FBQztJQUNILENBQUM7SUFFRSxTQUFTLGlDQUFpQyxDQUFDLE1BQWMsRUFBRSxVQUFrQixFQUFFLEVBQUUsVUFBa0IsRUFBRSx1QkFBK0IsS0FBSztRQUVySSxNQUFNLG9DQUFvQyxHQUFHLFlBQVksQ0FBQyxrQkFBa0IsQ0FBRSxHQUFFLEVBQUU7WUFFOUUsSUFBSSxvQ0FBb0MsRUFDeEM7Z0JBQ0ksWUFBWSxDQUFDLG9CQUFvQixDQUFFLG9DQUFvQyxDQUFFLENBQUM7YUFDN0U7UUFDTCxDQUFDLENBQUUsQ0FBQztRQUVKLE1BQU0sU0FBUyxHQUFHLG9CQUFvQixLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztRQUMvRSxDQUFDLENBQUMsYUFBYSxDQUFFLHFCQUFxQixFQUFFLHdCQUF3QixFQUFFLE9BQU8sQ0FBRSxDQUFDO1FBRTVFLFlBQVksQ0FBQywrQkFBK0IsQ0FDeEMsZ0NBQWdDLEdBQUUsTUFBTSxFQUN4Qyx1RUFBdUUsRUFDdkUsU0FBUyxHQUFHLE1BQU07WUFDbEIsR0FBRyxHQUFHLGtCQUFrQixHQUFHLE9BQU87WUFDbEMsR0FBRyxHQUFHLHVCQUF1QixHQUFHLFNBQVM7WUFDekMsR0FBRyxHQUFHLGFBQWEsR0FBRyxVQUFVO1lBQ2hDLEdBQUcsR0FBRyxXQUFXLEdBQUcsb0NBQW9DLENBQzNELENBQUM7SUFDTixDQUFDO0lBRUQ7UUFDRixDQUFDLENBQUMseUJBQXlCLENBQUUsd0NBQXdDLEVBQUUsdUNBQXVDLENBQUUsQ0FBQztRQUNqSCxDQUFDLENBQUMseUJBQXlCLENBQUUsa0NBQWtDLEVBQUUsaUNBQWlDLENBQUUsQ0FBQztRQUMvRixDQUFDLENBQUMseUJBQXlCLENBQUUsNENBQTRDLEVBQUUsMkNBQTJDLENBQUUsQ0FBQztLQUM1SDtBQUNMLENBQUMsRUFyRFMsK0JBQStCLEtBQS9CLCtCQUErQixRQXFEeEMifQ==