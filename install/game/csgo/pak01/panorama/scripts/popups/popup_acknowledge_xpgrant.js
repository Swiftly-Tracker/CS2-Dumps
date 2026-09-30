"use strict";
/// <reference path="../csgo.d.ts" />
var AcknowledgeXpGrant;
(function (AcknowledgeXpGrant) {
    let _m_xuid = MyPersonaAPI.GetXuid();
    let _m_currentLvl = FriendsListAPI.GetFriendLevel(_m_xuid);
    function OnLoad() {
        let elRankIcon = $.GetContextPanel().FindChildInLayoutFile('JsPlayerXpIcon');
        let elRankText = $.GetContextPanel().FindChildInLayoutFile('JsPlayerRankName');
        // Set Xp rank name.
        elRankText.SetDialogVariable('name', $.Localize('#SFUI_XP_RankName_' + _m_currentLvl));
        elRankText.SetDialogVariableInt('level', _m_currentLvl);
        // Set Xp rank image and show.
        elRankIcon.SetImage('file://{images}/icons/xp/level' + _m_currentLvl + '.png');
        //
        // Movie
        //
        let fauxItemID = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(4607, 0); // xpgrant
        let rarityColor = InventoryAPI.GetItemRarityColor(fauxItemID);
        rarityColor = "#8847ff"; // Operation Shattered Web
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfYWNrbm93bGVkZ2VfeHBncmFudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3BvcHVwcy9wb3B1cF9hY2tub3dsZWRnZV94cGdyYW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFFckMsSUFBVSxrQkFBa0IsQ0FxQzNCO0FBckNELFdBQVUsa0JBQWtCO0lBRTNCLElBQUksT0FBTyxHQUFHLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUNyQyxJQUFJLGFBQWEsR0FBRyxjQUFjLENBQUMsY0FBYyxDQUFFLE9BQU8sQ0FBRSxDQUFDO0lBRTdELFNBQWdCLE1BQU07UUFFckIsSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLGdCQUFnQixDQUFhLENBQUM7UUFDMUYsSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLGtCQUFrQixDQUFFLENBQUM7UUFFakYsb0JBQW9CO1FBQ3BCLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxvQkFBb0IsR0FBRyxhQUFhLENBQUUsQ0FBRSxDQUFDO1FBQzNGLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBRSxPQUFPLEVBQUUsYUFBYSxDQUFFLENBQUM7UUFFMUQsOEJBQThCO1FBQzlCLFVBQVUsQ0FBQyxRQUFRLENBQUUsZ0NBQWdDLEdBQUcsYUFBYSxHQUFHLE1BQU0sQ0FBRSxDQUFDO1FBRWpGLEVBQUU7UUFDRixRQUFRO1FBQ1IsRUFBRTtRQUVGLElBQUksVUFBVSxHQUFHLFlBQVksQ0FBQyxpQ0FBaUMsQ0FBRSxJQUFJLEVBQUUsQ0FBQyxDQUFFLENBQUMsQ0FBQyxVQUFVO1FBQ3RGLElBQUksV0FBVyxHQUFHLFlBQVksQ0FBQyxrQkFBa0IsQ0FBRSxVQUFVLENBQUUsQ0FBQztRQUNoRSxXQUFXLEdBQUcsU0FBUyxDQUFDLENBQUMsMEJBQTBCO1FBRW5ELElBQUksT0FBTyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxrQkFBa0IsQ0FBRSxDQUFDO1FBQzlFLE9BQU8sQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLFdBQVcsQ0FBQztRQUV0QyxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUUsZ0JBQWdCLENBQUUsQ0FBQztRQUMxRSxLQUFLLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxXQUFXLENBQUM7SUFDckMsQ0FBQztJQXpCZSx5QkFBTSxTQXlCckIsQ0FBQTtJQUFBLENBQUM7SUFFRixTQUFnQixVQUFVO1FBRXpCLENBQUMsQ0FBQyxhQUFhLENBQUUsc0JBQXNCLEVBQUUsRUFBRSxDQUFFLENBQUM7UUFDOUMsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxxQkFBcUIsRUFBRSxzQ0FBc0MsRUFBRSxPQUFPLENBQUUsQ0FBQztJQUMzRixDQUFDO0lBSmUsNkJBQVUsYUFJekIsQ0FBQTtBQUNGLENBQUMsRUFyQ1Msa0JBQWtCLEtBQWxCLGtCQUFrQixRQXFDM0IifQ==