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
        $.RegisterEventHandler('ScrolledIntoView', elTile, () => { });
        $.Schedule(1, () => { });
    }
    ;
    function AddTransitionEndEventHandler(elTile) {
        $.RegisterEventHandler('PropertyTransitionEnd', elTile, fnOnPropertyTransitionEndEvent);
        function fnOnPropertyTransitionEndEvent(panel, propertyName) {
            if (elTile === panel && propertyName === 'opacity') {
                if (elTile.visible === true && elTile.BIsTransparent()) {
                    elTile.DeleteAsync(0.0);
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
    {
        $.RegisterForUnhandledEvent('PanoramaComponent_PartyBrowser_InviteConsumed', Init);
        $.RegisterForUnhandledEvent('PanoramaComponent_PartyBrowser_InviteReceived', Init);
        let elLister = $.GetContextPanel().FindChildInLayoutFile('id-context-menu-lobbies');
        elLister.SetSendScrollPositionChangedEvents(true);
        $.RegisterEventHandler('ScrollPositionChanged', elLister, ShowHideNewLobbiesBtn);
    }
})(ContextMenuLobbies || (ContextMenuLobbies = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dF9tZW51X2xvYmJpZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9jb250ZXh0X21lbnVzL2NvbnRleHRfbWVudV9sb2JiaWVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFDckMsMENBQTBDO0FBRTFDLElBQVUsa0JBQWtCLENBZ0szQjtBQWhLRCxXQUFVLGtCQUFrQjtJQUV4QixJQUFJLGVBQWUsR0FBbUIsSUFBSSxDQUFDO0lBQzNDLElBQUksWUFBWSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxpQ0FBaUMsQ0FBa0IsQ0FBQztJQUNsSCxJQUFJLGtCQUFrQixHQUFZLEtBQUssQ0FBQztJQUV4QyxTQUFnQixJQUFJO1FBRWhCLElBQUksVUFBVSxHQUFHLGVBQWUsQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUNuRCxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsb0JBQW9CLENBQUUsYUFBYSxFQUFFLFVBQVUsQ0FBRSxDQUFDO1FBQ3RFLElBQUksaUJBQWlCLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLHlCQUF5QixDQUFFLENBQUM7UUFFL0YsSUFBSyxVQUFVLEdBQUksQ0FBQyxFQUMxQjtZQUVVLENBQUMsQ0FBQyxhQUFhLENBQUUsa0JBQWtCLEVBQUUsRUFBRSxDQUFFLENBQUM7WUFDbkQsT0FBTztTQUNQO1FBRUssSUFBSSxlQUFlLEdBQWEsRUFBRSxDQUFDO1FBRW5DLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLEVBQUUsQ0FBQyxFQUFFLEVBQ3pDO1lBQ1UsSUFBSSxJQUFJLEdBQUcsZUFBZSxDQUFDLG9CQUFvQixDQUFFLENBQUMsQ0FBRSxDQUFDO1lBQzlELGVBQWUsQ0FBQyxJQUFJLENBQUUsSUFBSSxDQUFFLENBQUM7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