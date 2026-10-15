"use strict";
/// <reference path="..\csgo.d.ts" />
var LeaderboardNameLock;
(function (LeaderboardNameLock) {
    let m_timeoutHandler;
    function Init() {
        $.GetContextPanel().SetDialogVariable('profile-name', MyPersonaAPI.GetName());
    }
    LeaderboardNameLock.Init = Init;
    function Submit() {
        let entry = $('#TextEntry').text;
        LeaderboardsAPI.SetLocalPlayerLeaderboardSafeName(entry);
        m_timeoutHandler = $.Schedule(15, () => {
            UiToolkitAPI.ShowGenericPopup('Generic', $.Localize('#leaderboard_namelock_submission_timeout'), '');
            $.DispatchEvent('UIPopupButtonClicked', '');
        });
        $.GetContextPanel().FindChildrenWithClassTraverse('button').forEach(element => element.enabled = false);
        $.GetContextPanel().AddClass('submitted');
    }
    LeaderboardNameLock.Submit = Submit;
    function Cancel() {
        $.DispatchEvent('UIPopupButtonClicked', '');
    }
    LeaderboardNameLock.Cancel = Cancel;
    function Success() {
        if (m_timeoutHandler) {
            $.CancelScheduled(m_timeoutHandler);
        }
        UiToolkitAPI.ShowGenericPopup('Generic', $.Localize('#leaderboard_namelock_submission_success'), '');
        $.DispatchEvent('UIPopupButtonClicked', '');
    }
    function OpenProfile() {
        SteamOverlayAPI.ShowUserProfilePage(MyPersonaAPI.GetXuid());
        $.DispatchEvent('ContextMenuEvent', '');
    }
    LeaderboardNameLock.OpenProfile = OpenProfile;
    {
        $.RegisterForUnhandledEvent('PanoramaComponent_FriendsList_NameChanged', Init);
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_SetPlayerLeaderboardSafeName', Success);
    }
})(LeaderboardNameLock || (LeaderboardNameLock = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfbGVhZGVyYm9hcmRfbmFtZWxvY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfbGVhZGVyYm9hcmRfbmFtZWxvY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUVyQyxJQUFVLG1CQUFtQixDQXVENUI7QUF2REQsV0FBVSxtQkFBbUI7SUFFNUIsSUFBSSxnQkFBeUIsQ0FBQztJQUU5QixTQUFnQixJQUFJO1FBRW5CLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBRSxjQUFjLEVBQUUsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFFLENBQUM7SUFDakYsQ0FBQztJQUhlLHdCQUFJLE9BR25CLENBQUE7SUFFRCxTQUFnQixNQUFNO1FBRXJCLElBQUksS0FBSyxHQUFLLENBQUMsQ0FBRSxZQUFZLENBQWUsQ0FBQyxJQUFJLENBQUM7UUFFbEQsZUFBZSxDQUFDLGlDQUFpQyxDQUFFLEtBQUssQ0FBRSxDQUFDO1FBRTNELGdCQUFnQixHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRTtZQUV2QyxZQUFZLENBQUMsZ0JBQWdCLENBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUUsMENBQTBDLENBQUUsRUFBRSxFQUFFLENBQUUsQ0FBQztZQUN6RyxDQUFDLENBQUMsYUFBYSxDQUFFLHNCQUFzQixFQUFFLEVBQUUsQ0FBRSxDQUFDO1FBQy9DLENBQUMsQ0FBRSxDQUFDO1FBRUosQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLDZCQUE2QixDQUFFLFFBQVEsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFFLENBQUM7UUFDNUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLFFBQVEsQ0FBRSxXQUFXLENBQUUsQ0FBQztJQUM3QyxDQUFDO0lBZGUsMEJBQU0sU0FjckIsQ0FBQTtJQUVELFNBQWdCLE1BQU07UUFFckIsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxzQkFBc0IsRUFBRSxFQUFFLENBQUUsQ0FBQztJQUMvQyxDQUFDO0lBSGUsMEJBQU0sU0FHckIsQ0FBQTtJQUVELFNBQVMsT0FBTztRQUVmLElBQUssZ0JBQWdCLEVBQ3JCO1lBQ0MsQ0FBQyxDQUFDLGVBQWUsQ0FBRSxnQkFBZ0IsQ0FBRSxDQUFDO1NBQ3RDO1FBRUQsWUFBWSxDQUFDLGdCQUFnQixDQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLDBDQUEwQyxDQUFDLEVBQUUsRUFBRSxDQUFFLENBQUM7UUFFdkcsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxzQkFBc0IsRUFBRSxFQUFFLENBQUUsQ0FBQztJQUMvQyxDQUFDO0lBRUQsU0FBZ0IsV0FBVztRQUUxQixlQUFlLENBQUMsbUJBQW1CLENBQUUsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFFLENBQUM7UUFDOUQsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxrQkFBa0IsRUFBRSxFQUFFLENBQUUsQ0FBQztJQUMzQyxDQUFDO0lBSmUsK0JBQVcsY0FJMUIsQ0FBQTtJQUtEO1FBQ0MsQ0FBQyxDQUFDLHlCQUF5QixDQUFFLDJDQUEyQyxFQUFFLElBQUksQ0FBRSxDQUFDO1FBQ2pGLENBQUMsQ0FBQyx5QkFBeUIsQ0FBRSwwREFBMEQsRUFBRSxPQUFPLENBQUUsQ0FBQztLQUNuRztBQUNGLENBQUMsRUF2RFMsbUJBQW1CLEtBQW5CLG1CQUFtQixRQXVENUIifQ==