"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../friendlobby.ts" />
var ContextMenuLobbies;
(function (ContextMenuLobbies) {
    let m_elNewestLobby = null;
    let m_btnGoToNew = $.GetContextPanel().FindChildInLayoutFile('id-context-menu-lobbies-new-btn');
    let m_bSeenNewestLobby = false;
    function Init() {
        let numInvites = PartyBrowserAPI.GetInvitesCount();
        $.GetContextPanel().SetDialogVariableInt('lobby_count', numInvites);
        let elInviteContainer = $.GetContextPanel().FindChildInLayoutFile('id-context-menu-lobbies');
        if (numInvites < 1) {
            // responsible for closing the context menu
            $.DispatchEvent('ContextMenuEvent', '');
            return;
        }
        let xuidsFromUpdate = [];
        for (let i = 0; i < numInvites; i++) {
            let xuid = PartyBrowserAPI.GetInviteXuidByIndex(i);
            xuidsFromUpdate.push(xuid);
        }
        DeleteTilesNotInUpdate(elInviteContainer, xuidsFromUpdate);
        xuidsFromUpdate.reverse();
        for (let i = 0; i < xuidsFromUpdate.length; i++) {
            let xuid = xuidsFromUpdate[i];
            let elTile = elInviteContainer.FindChildTraverse(xuid);
            if (!elTile)
                AddTile(elInviteContainer, xuid, i);
            else
                UpdateTilePosition(elInviteContainer, elTile, i);
        }
        let elLastItem = elInviteContainer.Children()[elInviteContainer.Children().length - 1];
        if (elLastItem && elLastItem.IsValid()) {
            if (m_elNewestLobby === null) {
                m_elNewestLobby = elLastItem;
            }
            else if (m_elNewestLobby && m_elNewestLobby.IsValid() && m_elNewestLobby.id !== elLastItem.id) {
                m_elNewestLobby = elLastItem;
                m_bSeenNewestLobby = false;
            }
        }
        ShowHideNewLobbiesBtn();
        elInviteContainer.SetSendScrollPositionChangedEvents(true);
    }
    ContextMenuLobbies.Init = Init;
    ;
    function DeleteTilesNotInUpdate(elList, xuidsFromUpdate) {
        let children = elList.Children();
        let sectionChildrenCount = children.length;
        // Remove any tiles that are not in the latest updated list of xuids
        // Those xuids have gone offline.
        for (let i = 0; i < sectionChildrenCount; i++) {
            let panelId = children[i].id;
            if (xuidsFromUpdate.indexOf(panelId) < 0)
                children[i].DeleteAsync(0);
        }
    }
    ;
    function UpdateTilePosition(elList, elTile, index) {
        let children = elList.Children();
        if (children[index])
            elList.MoveChildBefore(elTile, children[index]);
        friendLobby.Init(elTile);
    }
    ;
    function ShowHideNewLobbiesBtn() {
        $.Schedule(1, () => {
            if (!m_elNewestLobby || !m_elNewestLobby.IsValid()) {
                m_btnGoToNew.SetHasClass('hide', true);
                return;
            }
            else if (m_elNewestLobby.BCanSeeInParentScroll() && !m_bSeenNewestLobby) {
                m_btnGoToNew.SetHasClass('hide', true);
                m_bSeenNewestLobby = true;
            }
            else if (!m_elNewestLobby.BCanSeeInParentScroll() && !m_bSeenNewestLobby) {
                m_btnGoToNew.SetHasClass('hide', false);
            }
            $.Msg('elTile.BCanSeeInParentScroll(): ' + m_elNewestLobby.BCanSeeInParentScroll());
        });
    }
    ContextMenuLobbies.ShowHideNewLobbiesBtn = ShowHideNewLobbiesBtn;
    function AddTile(elList, xuid, index) {
        let elTile = $.CreatePanel("Panel", elList, xuid);
        elTile.SetAttributeString('xuid', xuid);
        elTile.BLoadLayout('file://{resources}/layout/friendlobby.xml', false, false);
        AddTransitionEndEventHandler(elTile);
        elTile.SetAttributeString('showinpopup', 'true');
        friendLobby.Init(elTile);
        elTile.RemoveClass('hidden');
        $.RegisterEventHandler('ScrolledIntoView', elTile, () => { $.Msg('ScrolledIntoView'); });
        $.Schedule(1, () => { $.Msg(index + ': elTile.BCanSeeInParentScroll(): ' + elTile.BCanSeeInParentScroll()); });
    }
    ;
    function AddTransitionEndEventHandler(elTile) {
        // Handler that catches OnPropertyTransitionEndEvent event for this panel.
        $.RegisterEventHandler('PropertyTransitionEnd', elTile, fnOnPropertyTransitionEndEvent);
        function fnOnPropertyTransitionEndEvent(panel, propertyName) {
            if (elTile === panel && propertyName === 'opacity') {
                // Panel is visible and fully transparent
                if (elTile.visible === true && elTile.BIsTransparent()) {
                    elTile.DeleteAsync(0.0);
                    $.Msg('Removed Lobby: ' + FriendsListAPI.GetFriendName(elTile.id));
                    return true;
                }
            }
            return false;
        }
        ;
    }
    ;
    function OnPressGotoNew() {
        let elPanel = $.GetContextPanel().FindChildInLayoutFile('id-context-menu-lobbies');
        elPanel.ScrollToBottom();
    }
    ContextMenuLobbies.OnPressGotoNew = OnPressGotoNew;
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        $.RegisterForUnhandledEvent('PanoramaComponent_PartyBrowser_InviteConsumed', Init);
        $.RegisterForUnhandledEvent('PanoramaComponent_PartyBrowser_InviteReceived', Init);
        let elLister = $.GetContextPanel().FindChildInLayoutFile('id-context-menu-lobbies');
        elLister.SetSendScrollPositionChangedEvents(true);
        $.RegisterEventHandler('ScrollPositionChanged', elLister, ShowHideNewLobbiesBtn);
    }
})(ContextMenuLobbies || (ContextMenuLobbies = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dF9tZW51X2xvYmJpZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9jb250ZXh0X21lbnVzL2NvbnRleHRfbWVudV9sb2JiaWVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFDckMsMENBQTBDO0FBRTFDLElBQVUsa0JBQWtCLENBZ0szQjtBQWhLRCxXQUFVLGtCQUFrQjtJQUV4QixJQUFJLGVBQWUsR0FBbUIsSUFBSSxDQUFDO0lBQzNDLElBQUksWUFBWSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxpQ0FBaUMsQ0FBa0IsQ0FBQztJQUNsSCxJQUFJLGtCQUFrQixHQUFZLEtBQUssQ0FBQztJQUV4QyxTQUFnQixJQUFJO1FBRWhCLElBQUksVUFBVSxHQUFHLGVBQWUsQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUNuRCxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsb0JBQW9CLENBQUUsYUFBYSxFQUFFLFVBQVUsQ0FBRSxDQUFDO1FBQ3RFLElBQUksaUJBQWlCLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLHlCQUF5QixDQUFFLENBQUM7UUFFL0YsSUFBSyxVQUFVLEdBQUksQ0FBQyxFQUMxQjtZQUNVLDJDQUEyQztZQUMzQyxDQUFDLENBQUMsYUFBYSxDQUFFLGtCQUFrQixFQUFFLEVBQUUsQ0FBRSxDQUFDO1lBQ25ELE9BQU87U0FDUDtRQUVLLElBQUksZUFBZSxHQUFhLEVBQUUsQ0FBQztRQUVuQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxFQUFFLENBQUMsRUFBRSxFQUN6QztZQUNVLElBQUksSUFBSSxHQUFHLGVBQWUsQ0FBQyxvQkFBb0IsQ0FBRSxDQUFDLENBQUUsQ0FBQztZQUM5RCxlQUFlLENBQUMsSUFBSSxDQUFFLElBQUksQ0FBRSxDQUFDO1NBQzdCO1FBRUssc0JBQXNCLENBQUUsaUJBQWlCLEVBQUUsZUFBZSxDQUFFLENBQUM7UUFDN0QsZUFBZSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBRTFCLEtBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxlQUFlLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUN0RDtZQUNDLElBQUksSUFBSSxHQUFHLGVBQWUsQ0FBRSxDQUFDLENBQUUsQ0FBQztZQUNoQyxJQUFJLE1BQU0sR0FBRyxpQkFBaUIsQ0FBQyxpQkFBaUIsQ0FBRSxJQUFJLENBQUUsQ0FBQztZQUV6RCxJQUFLLENBQUMsTUFBTTtnQkFDWCxPQUFPLENBQUUsaUJBQWlCLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBRSxDQUFDOztnQkFFMUIsa0JBQWtCLENBQUUsaUJBQWlCLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBRSxDQUFDO1NBQ2hFO1FBRUssSUFBSSxVQUFVLEdBQUcsaUJBQWlCLENBQUMsUUFBUSxFQUFFLENBQUUsaUJBQWlCLENBQUMsUUFBUSxFQUFFLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBRSxDQUFDO1FBQ3pGLElBQUssVUFBVSxJQUFJLFVBQVUsQ0FBQyxPQUFPLEVBQUUsRUFDdkM7WUFDSSxJQUFLLGVBQWUsS0FBSyxJQUFJLEVBQzdCO2dCQUNJLGVBQWUsR0FBRyxVQUFVLENBQUM7YUFDaEM7aUJBQ0ksSUFBSyxlQUFlLElBQUksZUFBZSxDQUFDLE9BQU8sRUFBRSxJQUFJLGVBQWUsQ0FBQyxFQUFFLEtBQUssVUFBVSxDQUFDLEVBQUUsRUFDOUY7Z0JBQ0ksZUFBZSxHQUFHLFVBQVUsQ0FBQztnQkFDN0Isa0JBQWtCLEdBQUcsS0FBSyxDQUFDO2FBQzlCO1NBQ0o7UUFFRCxxQkFBcUIsRUFBRSxDQUFDO1FBRXhCLGlCQUFpQixDQUFDLGtDQUFrQyxDQUFFLElBQUksQ0FBRSxDQUFDO0lBQ2pFLENBQUM7SUFwRGUsdUJBQUksT0FvRG5CLENBQUE7SUFBQSxDQUFDO0lBRUYsU0FBUyxzQkFBc0IsQ0FBRSxNQUFlLEVBQUUsZUFBeUI7UUFFN0UsSUFBSSxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ2pDLElBQUksb0JBQW9CLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQztRQUUzQyxvRUFBb0U7UUFDcEUsaUNBQWlDO1FBQ2pDLEtBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxvQkFBb0IsRUFBRSxDQUFDLEVBQUUsRUFDOUM7WUFDQyxJQUFJLE9BQU8sR0FBVyxRQUFRLENBQUUsQ0FBQyxDQUFFLENBQUMsRUFBRSxDQUFDO1lBQzlCLElBQUssZUFBZSxDQUFDLE9BQU8sQ0FBRSxPQUFPLENBQUUsR0FBRyxDQUFDO2dCQUNuRCxRQUFRLENBQUUsQ0FBQyxDQUFFLENBQUMsV0FBVyxDQUFFLENBQUMsQ0FBRSxDQUFDO1NBQ2hDO0lBQ0YsQ0FBQztJQUFBLENBQUM7SUFFQyxTQUFTLGtCQUFrQixDQUFFLE1BQWUsRUFBRSxNQUFlLEVBQUUsS0FBYTtRQUU5RSxJQUFJLFFBQVEsR0FBRyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDM0IsSUFBSyxRQUFRLENBQUUsS0FBSyxDQUFFO1lBQzNCLE1BQU0sQ0FBQyxlQUFlLENBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBRSxLQUFLLENBQUUsQ0FBRSxDQUFDO1FBRS9DLFdBQVcsQ0FBQyxJQUFJLENBQUUsTUFBTSxDQUFFLENBQUM7SUFDbEMsQ0FBQztJQUFBLENBQUM7SUFFQyxTQUFnQixxQkFBcUI7UUFFakMsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxDQUFDLEVBQUUsR0FBRyxFQUFFO1lBRWhCLElBQUssQ0FBQyxlQUFlLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFLEVBQ25EO2dCQUNJLFlBQVksQ0FBQyxXQUFXLENBQUUsTUFBTSxFQUFFLElBQUksQ0FBRSxDQUFDO2dCQUN6QyxPQUFPO2FBQ1Y7aUJBQ0ksSUFBSyxlQUFlLENBQUMscUJBQXFCLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixFQUN4RTtnQkFDSSxZQUFZLENBQUMsV0FBVyxDQUFFLE1BQU0sRUFBRSxJQUFJLENBQUUsQ0FBQztnQkFDekMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDO2FBQzdCO2lCQUNJLElBQUssQ0FBQyxlQUFlLENBQUMscUJBQXFCLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixFQUN6RTtnQkFDSSxZQUFZLENBQUMsV0FBVyxDQUFFLE1BQU0sRUFBRSxLQUFLLENBQUUsQ0FBQzthQUM3QztZQUNELENBQUMsQ0FBQyxHQUFHLENBQUUsa0NBQWtDLEdBQUcsZUFBZSxDQUFDLHFCQUFxQixFQUFFLENBQUUsQ0FBQTtRQUN6RixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFwQmUsd0NBQXFCLHdCQW9CcEMsQ0FBQTtJQUVELFNBQVMsT0FBTyxDQUFFLE1BQWUsRUFBRSxJQUFZLEVBQUUsS0FBYTtRQUVoRSxJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFFLENBQUM7UUFDcEQsTUFBTSxDQUFDLGtCQUFrQixDQUFFLE1BQU0sRUFBRSxJQUFJLENBQUUsQ0FBQztRQUMxQyxNQUFNLENBQUMsV0FBVyxDQUFFLDJDQUEyQyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUUsQ0FBQztRQUVoRiw0QkFBNEIsQ0FBRSxNQUFNLENBQUUsQ0FBQztRQUNqQyxNQUFNLENBQUMsa0JBQWtCLENBQUUsYUFBYSxFQUFFLE1BQU0sQ0FBRSxDQUFDO1FBQ25ELFdBQVcsQ0FBQyxJQUFJLENBQUUsTUFBTSxDQUFFLENBQUM7UUFFM0IsTUFBTSxDQUFDLFdBQVcsQ0FBRSxRQUFRLENBQUUsQ0FBQztRQUUvQixDQUFDLENBQUMsb0JBQW9CLENBQUUsa0JBQWtCLEVBQUUsTUFBTSxFQUFFLEdBQUUsRUFBRSxHQUFFLENBQUMsQ0FBQyxHQUFHLENBQUUsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRS9GLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLEdBQUUsRUFBRSxHQUFFLENBQUMsQ0FBQyxHQUFHLENBQUUsS0FBSyxHQUFHLG9DQUFvQyxHQUFHLE1BQU0sQ0FBQyxxQkFBcUIsRUFBRSxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNoSCxDQUFDO0lBQUEsQ0FBQztJQUVDLFNBQVMsNEJBQTRCLENBQUUsTUFBZTtRQUV4RCwwRUFBMEU7UUFDcEUsQ0FBQyxDQUFDLG9CQUFvQixDQUFFLHVCQUF1QixFQUFFLE1BQU0sRUFBRSw4QkFBOEIsQ0FBRSxDQUFDO1FBQ2hHLFNBQVMsOEJBQThCLENBQUUsS0FBYyxFQUFFLFlBQW9CO1lBRTVFLElBQUssTUFBTSxLQUFLLEtBQUssSUFBSSxZQUFZLEtBQUssU0FBUyxFQUNuRDtnQkFDQyx5Q0FBeUM7Z0JBQ3pDLElBQUssTUFBTSxDQUFDLE9BQU8sS0FBSyxJQUFJLElBQUksTUFBTSxDQUFDLGNBQWMsRUFBRSxFQUN2RDtvQkFDQyxNQUFNLENBQUMsV0FBVyxDQUFFLEdBQUcsQ0FBRSxDQUFDO29CQUMxQixDQUFDLENBQUMsR0FBRyxDQUFFLGlCQUFpQixHQUFHLGNBQWMsQ0FBQyxhQUFhLENBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBRSxDQUFFLENBQUM7b0JBQ3ZFLE9BQU8sSUFBSSxDQUFDO2lCQUNaO2FBQ0Q7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFBQSxDQUFDO0lBQ0gsQ0FBQztJQUFBLENBQUM7SUFFQyxTQUFnQixjQUFjO1FBRTFCLElBQUksT0FBTyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSx5QkFBeUIsQ0FBYSxDQUFDO1FBQ2hHLE9BQU8sQ0FBQyxjQUFjLEVBQUUsQ0FBQztJQUM3QixDQUFDO0lBSmUsaUNBQWMsaUJBSTdCLENBQUE7SUFFRCxvR0FBb0c7SUFDcEcsMkNBQTJDO0lBQzNDLG9HQUFvRztJQUNwRztRQUNJLENBQUMsQ0FBQyx5QkFBeUIsQ0FBRSwrQ0FBK0MsRUFBRSxJQUFJLENBQUUsQ0FBQztRQUNyRixDQUFDLENBQUMseUJBQXlCLENBQUUsK0NBQStDLEVBQUUsSUFBSSxDQUFFLENBQUM7UUFFckYsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLHlCQUF5QixDQUFFLENBQUM7UUFDdEYsUUFBUSxDQUFDLGtDQUFrQyxDQUFFLElBQUksQ0FBRSxDQUFDO1FBQ3BELENBQUMsQ0FBQyxvQkFBb0IsQ0FBRSx1QkFBdUIsRUFBRSxRQUFRLEVBQUUscUJBQXFCLENBQUUsQ0FBQztLQUN0RjtBQUNMLENBQUMsRUFoS1Msa0JBQWtCLEtBQWxCLGtCQUFrQixRQWdLM0IifQ==