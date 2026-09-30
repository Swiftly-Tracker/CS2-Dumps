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
    // This gets called when have added one item to the storage unit and are asked it we wat to add more to that unit.
    function _PromptShowSelectItemForCapabilityPopup(titletxt, messagetxt, capability, itemid, itemid2) {
        UiToolkitAPI.ShowGenericPopupOkCancel($.Localize(titletxt), $.Localize(messagetxt), '', () => $.DispatchEvent('ShowSelectItemForCapabilityPopup', itemid, itemid2, capability), () => { });
    }
    function _OpenSelectItemForCapabilityPopUp(itemid, itemid2 = '', capability, bWorkshopItemPreview = false) {
        const CloseItemForCapabilityCallbackHandle = UiToolkitAPI.RegisterJSCallback(() => {
            $.Msg('Close Item Capability Callback');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbm1lbnVfc2VsZWN0X2l0ZW1fZm9yX2NhcGFiaWxpdHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9tYWlubWVudV9zZWxlY3RfaXRlbV9mb3JfY2FwYWJpbGl0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBRWxDLElBQVUsK0JBQStCLENBcUR4QztBQXJERCxXQUFVLCtCQUErQjtJQUVyQyxTQUFTLGlDQUFpQyxDQUFFLE1BQWMsRUFBRSxPQUFlLEVBQUUsVUFBa0IsRUFBRSx1QkFBK0IsS0FBSztRQUVqSSxpQ0FBaUMsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBRSxvQkFBb0IsQ0FBRSxDQUFDO0lBQzFGLENBQUM7SUFFRCxTQUFTLDJDQUEyQyxDQUFFLFVBQWtCLEVBQUUsTUFBYyxFQUFFLE9BQWU7UUFFM0csaUNBQWlDLENBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFFLENBQUM7SUFDeEUsQ0FBQztJQUVFLGtIQUFrSDtJQUNsSCxTQUFTLHVDQUF1QyxDQUFFLFFBQWdCLEVBQUUsVUFBa0IsRUFBRSxVQUFrQixFQUFFLE1BQWMsRUFBRSxPQUFlO1FBRTdJLFlBQVksQ0FBQyx3QkFBd0IsQ0FDcEMsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxRQUFRLENBQUUsRUFDdEIsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxVQUFVLENBQUUsRUFDeEIsRUFBRSxFQUNGLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUUsa0NBQWtDLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxVQUFVLENBQUUsRUFDeEYsR0FBRyxFQUFFLEdBQUUsQ0FBQyxDQUNSLENBQUM7SUFDSCxDQUFDO0lBRUUsU0FBUyxpQ0FBaUMsQ0FBQyxNQUFjLEVBQUUsVUFBa0IsRUFBRSxFQUFFLFVBQWtCLEVBQUUsdUJBQStCLEtBQUs7UUFFckksTUFBTSxvQ0FBb0MsR0FBRyxZQUFZLENBQUMsa0JBQWtCLENBQUUsR0FBRSxFQUFFO1lBQzlFLENBQUMsQ0FBQyxHQUFHLENBQUUsZ0NBQWdDLENBQUMsQ0FBQztZQUN6QyxJQUFJLG9DQUFvQyxFQUN4QztnQkFDSSxZQUFZLENBQUMsb0JBQW9CLENBQUUsb0NBQW9DLENBQUUsQ0FBQzthQUM3RTtRQUNMLENBQUMsQ0FBRSxDQUFDO1FBRUosTUFBTSxTQUFTLEdBQUcsb0JBQW9CLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1FBQy9FLENBQUMsQ0FBQyxhQUFhLENBQUUscUJBQXFCLEVBQUUsd0JBQXdCLEVBQUUsT0FBTyxDQUFFLENBQUM7UUFFNUUsWUFBWSxDQUFDLCtCQUErQixDQUN4QyxnQ0FBZ0MsR0FBRSxNQUFNLEVBQ3hDLHVFQUF1RSxFQUN2RSxTQUFTLEdBQUcsTUFBTTtZQUNsQixHQUFHLEdBQUcsa0JBQWtCLEdBQUcsT0FBTztZQUNsQyxHQUFHLEdBQUcsdUJBQXVCLEdBQUcsU0FBUztZQUN6QyxHQUFHLEdBQUcsYUFBYSxHQUFHLFVBQVU7WUFDaEMsR0FBRyxHQUFHLFdBQVcsR0FBRyxvQ0FBb0MsQ0FDM0QsQ0FBQztJQUNOLENBQUM7SUFFRDtRQUNGLENBQUMsQ0FBQyx5QkFBeUIsQ0FBRSx3Q0FBd0MsRUFBRSx1Q0FBdUMsQ0FBRSxDQUFDO1FBQ2pILENBQUMsQ0FBQyx5QkFBeUIsQ0FBRSxrQ0FBa0MsRUFBRSxpQ0FBaUMsQ0FBRSxDQUFDO1FBQy9GLENBQUMsQ0FBQyx5QkFBeUIsQ0FBRSw0Q0FBNEMsRUFBRSwyQ0FBMkMsQ0FBRSxDQUFDO0tBQzVIO0FBQ0wsQ0FBQyxFQXJEUywrQkFBK0IsS0FBL0IsK0JBQStCLFFBcUR4QyJ9