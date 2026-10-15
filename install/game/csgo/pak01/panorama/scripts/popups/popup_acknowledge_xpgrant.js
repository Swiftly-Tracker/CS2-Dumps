"use strict";
/// <reference path="../csgo.d.ts" />
var AcknowledgeXpGrant;
(function (AcknowledgeXpGrant) {
    let _m_xuid = MyPersonaAPI.GetXuid();
    let _m_currentLvl = FriendsListAPI.GetFriendLevel(_m_xuid);
    function OnLoad() {
        let elRankIcon = $.GetContextPanel().FindChildInLayoutFile('JsPlayerXpIcon');
        let elRankText = $.GetContextPanel().FindChildInLayoutFile('JsPlayerRankName');
        elRankText.SetDialogVariable('name', $.Localize('#SFUI_XP_RankName_' + _m_currentLvl));
        elRankText.SetDialogVariableInt('level', _m_currentLvl);
        elRankIcon.SetImage('file://{images}/icons/xp/level' + _m_currentLvl + '.png');
        let fauxItemID = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(4607, 0);
        let rarityColor = InventoryAPI.GetItemRarityColor(fauxItemID);
        rarityColor = "#8847ff";
        let elMovie = $.GetContextPanel().FindChildInLayoutFile('AcknowledgeMovie');
        elMovie.style.washColor = rarityColor;
        let elBar = $.GetContextPanel().FindChildInLayoutFile('AcknowledgeBar');
        elBar.style.washColor = rarityColor;
    }
    AcknowledgeXpGrant.OnLoad = OnLoad;
    ;
    function OnActivate() {
        $.DispatchEvent('UIPopupButtonClicked', '');
        $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.inventory_new_item_accept', 'MOUSE');
    }
    AcknowledgeXpGrant.OnActivate = OnActivate;
})(AcknowledgeXpGrant || (AcknowledgeXpGrant = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfYWNrbm93bGVkZ2VfeHBncmFudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3BvcHVwcy9wb3B1cF9hY2tub3dsZWRnZV94cGdyYW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFFckMsSUFBVSxrQkFBa0IsQ0FxQzNCO0FBckNELFdBQVUsa0JBQWtCO0lBRTNCLElBQUksT0FBTyxHQUFHLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUNyQyxJQUFJLGFBQWEsR0FBRyxjQUFjLENBQUMsY0FBYyxDQUFFLE9BQU8sQ0FBRSxDQUFDO0lBRTdELFNBQWdCLE1BQU07UUFFckIsSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLGdCQUFnQixDQUFhLENBQUM7UUFDMUYsSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLGtCQUFrQixDQUFFLENBQUM7UUFHakYsVUFBVSxDQUFDLGlCQUFpQixDQUFFLE1BQU0sRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFFLG9CQUFvQixHQUFHLGFBQWEsQ0FBRSxDQUFFLENBQUM7UUFDM0YsVUFBVSxDQUFDLG9CQUFvQixDQUFFLE9BQU8sRUFBRSxhQUFhLENBQUUsQ0FBQztRQUcxRCxVQUFVLENBQUMsUUFBUSxDQUFFLGdDQUFnQyxHQUFHLGFBQWEsR0FBRyxNQUFNLENBQUUsQ0FBQztRQU1qRixJQUFJLFVBQVUsR0FBRyxZQUFZLENBQUMsaUNBQWlDLENBQUUsSUFBSSxFQUFFLENBQUMsQ0FBRSxDQUFDO1FBQzNFLElBQUksV0FBVyxHQUFHLFlBQVksQ0FBQyxrQkFBa0IsQ0FBRSxVQUFVLENBQUUsQ0FBQztRQUNoRSxXQUFXLEdBQUcsU0FBUyxDQUFDO1FBRXhCLElBQUksT0FBTyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxrQkFBa0IsQ0FBRSxDQUFDO1FBQzlFLE9BQU8sQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLFdBQVcsQ0FBQztRQUV0QyxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUUsZ0JBQWdCLENBQUUsQ0FBQztRQUMxRSxLQUFLLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxXQUFXLENBQUM7SUFDckMsQ0FBQztJQXpCZSx5QkFBTSxTQXlCckIsQ0FBQTtJQUFBLENBQUM7SUFFRixTQUFnQixVQUFVO1FBRXpCLENBQUMsQ0FBQyxhQUFhLENBQUUsc0JBQXNCLEVBQUUsRUFBRSxDQUFFLENBQUM7UUFDOUMsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxxQkFBcUIsRUFBRSxzQ0FBc0MsRUFBRSxPQUFPLENBQUUsQ0FBQztJQUMzRixDQUFDO0lBSmUsNkJBQVUsYUFJekIsQ0FBQTtBQUNGLENBQUMsRUFyQ1Msa0JBQWtCLEtBQWxCLGtCQUFrQixRQXFDM0IifQ==