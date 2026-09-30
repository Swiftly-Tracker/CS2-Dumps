"use strict";
/// <reference path="csgo.d.ts" />
var Chat;
(function (Chat) {
    let m_isContentPanelOpen = false;
    let m_lastChatEntry = null;
    //This is a hack
    let m_isChatType = $.GetContextPanel().GetParent().id === "id-team-vote-middle" ? true : false;
    function _Init() {
        let elInput = $('#ChatInput');
        elInput.SetPanelEvent('oninputsubmit', _ChatTextSubmitted);
        $.Msg('m_isChatType: ' + m_isChatType);
        $.Msg('m_isChatType: ' + $.GetContextPanel().GetParent().id);
        if (m_isChatType) {
            _OpenChat();
            return;
        }
        let elOpenChat = $.GetContextPanel().FindChildInLayoutFile('ChatContainer');
        elOpenChat.SetPanelEvent("onactivate", _OpenChat);
        let elCloseChat = $.GetContextPanel().FindChildInLayoutFile('ChatCloseButton');
        elCloseChat.SetPanelEvent("onactivate", () => { _Close(); });
    }
    function _OpenChat() {
        let elChatContainer = $('#ChatContainer');
        if (!elChatContainer.BHasClass("chat-open")) {
            elChatContainer.RemoveClass('closed-minimized');
            elChatContainer.AddClass("chat-open");
            $("#ChatInput").SetFocus();
            $.Schedule(.1, _ScrollToBottom);
        }
    }
    function _Close() {
        if (m_isChatType)
            return true; // swallow ESC key and don't allow closing chat in Premier - it breaks the layout and cannot get chat back
        let elChatContainer = $('#ChatContainer');
        if (elChatContainer.BHasClass("chat-open")) {
            elChatContainer.RemoveClass("chat-open");
            elChatContainer.SetFocus();
            $.Schedule(.1, _ScrollToBottom);
            _SetClosedHeight();
            return true; // swallow escape key if we closed the chat
        }
        return false;
    }
    function _SetClosedHeight() {
        let elChatContainer = $('#ChatContainer');
        if (!elChatContainer.BHasClass("chat-open")) {
            elChatContainer.SetHasClass('closed-minimized', m_isContentPanelOpen);
            $.Schedule(.1, _ScrollToBottom);
        }
    }
    function _ChatTextSubmitted() {
        if (m_lastChatEntry && (Date.now() - m_lastChatEntry < 200))
            return; // ignore client-side chat spam, require at least 200ms between sending text, server has more rate-limits too
        else
            m_lastChatEntry = Date.now();
        if (m_isChatType) {
            MatchDraftAPI.ActionPregameChat($('#ChatInput').text, false);
        }
        else {
            $.GetContextPanel().SubmitChatText();
        }
        $('#ChatInput').text = "";
    }
    function _OnNewChatEntry() {
        $.Schedule(.1, _ScrollToBottom);
    }
    function _ScrollToBottom() {
        $('#ChatLinesContainer').ScrollToBottom();
    }
    function _SessionUpdate(status) {
        let elChat = $.GetContextPanel().FindChildInLayoutFile('ChatPanelContainer');
        if (status === 'closed')
            _ClearChatMessages();
        if (!LobbyAPI.IsSessionActive()) {
            elChat.AddClass('hidden');
        }
        else {
            let numPlayersActuallyInParty = PartyListAPI.GetCount();
            let networkSetting = PartyListAPI.GetPartySessionSetting("system/network");
            elChat.SetHasClass('hidden', (networkSetting !== 'LIVE' && !m_isChatType));
            if (networkSetting !== 'LIVE' && !m_isChatType) {
                _Close();
            }
            let elPlaceholder = $.GetContextPanel().FindChildInLayoutFile('PlaceholderText');
            if (m_isChatType) {
                elPlaceholder.text = $.Localize('#party_chat_placeholder_pickban');
            }
            else if (numPlayersActuallyInParty > 1) {
                elPlaceholder.text = $.Localize('#party_chat_placeholder');
            }
            else {
                elPlaceholder.text = $.Localize('#party_chat_placeholder_empty_lobby');
            }
        }
    }
    function _ClearChatMessages() {
        let elMessagesContainer = $('#ChatLinesContainer');
        elMessagesContainer.RemoveAndDeleteChildren();
    }
    function _ClipPanelToNotOverlapSideBar(noClip) {
        let panelToClip = $.GetContextPanel();
        if (!panelToClip || panelToClip.BHasClass('hidden'))
            return;
        // Chat has its parent reset when we have the accept match button up.
        // We check to make sure its in under the correct parent for the clip styles to apply
        if ($.GetContextPanel().GetParent().id !== 'MainMenuFriendsAndParty')
            return;
        let panelToClipWidth = panelToClip.actuallayoutwidth;
        let friendsListWidthWhenExpanded = panelToClip.GetParent().FindChildInLayoutFile('mainmenu-sidebar__blur-target').contentwidth;
        let sideBarWidth = noClip ? 0 : friendsListWidthWhenExpanded;
        let widthDiff = panelToClipWidth - sideBarWidth;
        let clipPercent = (panelToClipWidth <= 0 || widthDiff <= 0 ? 1 : (widthDiff / panelToClipWidth)) * 100;
        if (clipPercent)
            panelToClip.style.clip = 'rect( 0%, ' + clipPercent + '%, 100%, 0% );';
    }
    ;
    function _OnHideContentPanel() {
        m_isContentPanelOpen = false;
        _SetClosedHeight();
    }
    ;
    function _OnShowContentPanel() {
        m_isContentPanelOpen = true;
        _SetClosedHeight();
    }
    ;
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        _Init();
        $.RegisterForUnhandledEvent("PanoramaComponent_Lobby_MatchmakingSessionUpdate", _SessionUpdate);
        $.RegisterForUnhandledEvent("OnNewChatEntry", _OnNewChatEntry);
        $.RegisterEventHandler("Cancelled", $.GetContextPanel(), _Close);
        $.RegisterForUnhandledEvent('SidebarIsCollapsed', _ClipPanelToNotOverlapSideBar);
        $.RegisterForUnhandledEvent('HideContentPanel', _OnHideContentPanel);
        $.RegisterForUnhandledEvent('ShowContentPanel', _OnShowContentPanel);
    }
})(Chat || (Chat = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL2NoYXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUVsQyxJQUFVLElBQUksQ0FpTWI7QUFqTUQsV0FBVSxJQUFJO0lBRWIsSUFBSSxvQkFBb0IsR0FBRyxLQUFLLENBQUM7SUFDakMsSUFBSSxlQUFlLEdBQWtCLElBQUksQ0FBQztJQUUxQyxnQkFBZ0I7SUFDaEIsSUFBSSxZQUFZLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsS0FBSyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7SUFFL0YsU0FBUyxLQUFLO1FBRWIsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFFLFlBQVksQ0FBRyxDQUFDO1FBQ2pDLE9BQU8sQ0FBQyxhQUFhLENBQUUsZUFBZSxFQUFFLGtCQUFrQixDQUFFLENBQUM7UUFDN0QsQ0FBQyxDQUFDLEdBQUcsQ0FBRSxnQkFBZ0IsR0FBRyxZQUFZLENBQUUsQ0FBQztRQUN6QyxDQUFDLENBQUMsR0FBRyxDQUFFLGdCQUFnQixHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUUsQ0FBQztRQUUvRCxJQUFLLFlBQVksRUFDakI7WUFDQyxTQUFTLEVBQUUsQ0FBQztZQUNaLE9BQU87U0FDUDtRQUVELElBQUksVUFBVSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxlQUFlLENBQUUsQ0FBQztRQUM5RSxVQUFVLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxTQUFTLENBQUUsQ0FBQztRQUVwRCxJQUFJLFdBQVcsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUUsaUJBQWlCLENBQUUsQ0FBQztR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