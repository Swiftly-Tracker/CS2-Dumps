"use strict";
/// <reference path="../csgo.d.ts" />
var PrimeButtonAction;
(function (PrimeButtonAction) {
    function SetUpPurchaseBtn(btnPurchase) {
        // buy  upgrade
        $.Msg('GetStoreUrl(): ' + GetStoreUrl());
        let sPrice = StoreAPI.GetStoreItemSalePrice(InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(1353, 0), 1, '');
        btnPurchase.SetDialogVariable("price", sPrice ? sPrice : '$0');
        btnPurchase.SetPanelEvent('onactivate', () => {
            SteamOverlayAPI.OpenURL(GetStoreUrl() + '/sub/54029');
            $.DispatchEvent('UIPopupButtonClicked', '');
        });
    }
    PrimeButtonAction.SetUpPurchaseBtn = SetUpPurchaseBtn;
    function GetStoreUrl() {
        return 'https://store.' +
            ((SteamOverlayAPI.GetAppID() == 710) ? 'beta.' : '') +
            ((MyPersonaAPI.GetSteamType() === 'china' || MyPersonaAPI.GetLauncherType() === "perfectworld") ? 'steamchina' : 'steampowered') + '.com';
    }
})(PrimeButtonAction || (PrimeButtonAction = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJpbWVfYnV0dG9uX2FjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL2NvbW1vbi9wcmltZV9idXR0b25fYWN0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFFckMsSUFBVSxpQkFBaUIsQ0FzQjFCO0FBdEJELFdBQVUsaUJBQWlCO0lBRTFCLFNBQWdCLGdCQUFnQixDQUFHLFdBQXdCO1FBRTFELGVBQWU7UUFDVCxDQUFDLENBQUMsR0FBRyxDQUFFLGlCQUFpQixHQUFHLFdBQVcsRUFBRSxDQUFFLENBQUM7UUFFakQsSUFBSSxNQUFNLEdBQUcsUUFBUSxDQUFDLHFCQUFxQixDQUFFLFlBQVksQ0FBQyxpQ0FBaUMsQ0FBRSxJQUFJLEVBQUUsQ0FBQyxDQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBRSxDQUFDO1FBQ2hILFdBQVksQ0FBQyxpQkFBaUIsQ0FBRSxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBRSxDQUFDO1FBRWxFLFdBQVksQ0FBQyxhQUFhLENBQUMsWUFBWSxFQUFFLEdBQUcsRUFBRTtZQUM3QyxlQUFlLENBQUMsT0FBTyxDQUFFLFdBQVcsRUFBRSxHQUFHLFlBQVksQ0FBQyxDQUFDO1lBQ3ZELENBQUMsQ0FBQyxhQUFhLENBQUMsc0JBQXNCLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDN0MsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDO0lBWmUsa0NBQWdCLG1CQVkvQixDQUFBO0lBRUQsU0FBUyxXQUFXO1FBRW5CLE9BQU8sZ0JBQWdCO1lBQ3RCLENBQUMsQ0FBQyxlQUFlLENBQUMsUUFBUSxFQUFFLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBQ3BELENBQUMsQ0FBQyxZQUFZLENBQUMsWUFBWSxFQUFFLEtBQUssT0FBTyxJQUFJLFlBQVksQ0FBQyxlQUFlLEVBQUUsS0FBSyxjQUFjLENBQUUsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsR0FBRyxNQUFNLENBQUM7SUFDN0ksQ0FBQztBQUNGLENBQUMsRUF0QlMsaUJBQWlCLEtBQWpCLGlCQUFpQixRQXNCMUIifQ==