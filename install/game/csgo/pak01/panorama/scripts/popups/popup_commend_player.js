"use strict";
/// <reference path="../csgo.d.ts" />
var PopupCommendPlayer;
(function (PopupCommendPlayer) {
    let m_loadingJob = 0;
    let m_elStatus = null;
    let m_elCommend = null;
    function Init() {
        m_elStatus = $("#id-commend-status");
        m_elCommend = $("#id-commend");
        let xuid = $.GetContextPanel().GetAttributeString("xuid", "");
        $.GetContextPanel().SetDialogVariable("target_player", $.HTMLEscape(GameStateAPI.GetPlayerName(xuid)));
        _Update();
    }
    PopupCommendPlayer.Init = Init;
    function _CancelLoading() {
        m_loadingJob = 0;
        if (m_elStatus && m_elStatus.IsValid()) {
            m_elStatus.text = $.Localize('#SFUI_PlayerDetails_Loading_Failed');
        }
        m_elCommend.visible = false;
    }
    function _ReceivedCommendationFromServer() {
        if (m_loadingJob) {
            $.CancelScheduled(m_loadingJob);
            m_loadingJob = 0;
        }
        _Update();
    }
    function _Update() {
        let xuid = $.GetContextPanel().GetAttributeString("xuid", "");
        let bAskedServersForCommendation = GameStateAPI.QueryServersForCommendation(xuid);
        if (bAskedServersForCommendation) {
            let numTokens = GameStateAPI.GetCommendationTokensAvailable();
            if (numTokens == 0) {
                if (m_elStatus && m_elStatus.IsValid()) {
                    m_elStatus.text = $.Localize("#SFUI_PlayerDetails_NoCommendations_Left");
                }
                m_elCommend.visible = false;
            }
            else {
                if (m_elStatus && m_elStatus.IsValid()) {
                    m_elStatus.SetDialogVariableInt("num_token", numTokens);
                    m_elStatus.text = $.Localize("#Panorama_PlayerDetails_Commendations_Left:f", m_elStatus);
                }
                m_elCommend.visible = true;
            }
            if (m_elCommend.visible) {
                let oCommends = GameStateAPI.GetMyCommendationsJSOForUser(xuid);
                if (oCommends['valid']) {
                    let bHasPrevCommendations = false;
                    $.GetContextPanel().FindChildInLayoutFile("id-commend").Children().forEach(el => {
                        let category = el.GetAttributeString("data-category", "");
                        if (oCommends[category]) {
                            el.checked = true;
                            bHasPrevCommendations = true;
                        }
                    });
                    if (bHasPrevCommendations) {
                        m_elStatus.text = $.Localize("#SFUI_PlayerDetails_Previously_Submitted");
                    }
                }
            }
        }
        else {
            m_loadingJob = $.Schedule(10, _CancelLoading);
            if (m_elStatus && m_elStatus.IsValid()) {
                m_elStatus.text = $.Localize("#SFUI_PlayerDetails_Loading");
            }
            m_elCommend.visible = false;
        }
        $("#id-commend-submit").visible = m_elCommend.visible;
    }
    function Submit() {
        let xuid = $.GetContextPanel().GetAttributeString("xuid", "");
        let commendString = "";
        $.GetContextPanel().FindChildInLayoutFile("id-commend").Children().forEach(el => {
            let category = el.GetAttributeString("data-category", "");
            if (el.checked) {
                commendString += category + ",";
            }
        });
        GameStateAPI.SubmitCommendation(xuid, commendString);
        $.DispatchEvent('UIPopupButtonClicked', '');
    }
    PopupCommendPlayer.Submit = Submit;
    {
        $.RegisterForUnhandledEvent("GameState_CommendPlayerQueryResponse", _ReceivedCommendationFromServer);
    }
})(PopupCommendPlayer || (PopupCommendPlayer = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfY29tbWVuZF9wbGF5ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfY29tbWVuZF9wbGF5ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUVyQyxJQUFVLGtCQUFrQixDQTJJM0I7QUEzSUQsV0FBVSxrQkFBa0I7SUFFM0IsSUFBSSxZQUFZLEdBQUcsQ0FBQyxDQUFDO0lBQ3JCLElBQUksVUFBVSxHQUFtQixJQUFJLENBQUM7SUFDdEMsSUFBSSxXQUFXLEdBQW1CLElBQUksQ0FBQztJQUV2QyxTQUFnQixJQUFJO1FBRW5CLFVBQVUsR0FBRyxDQUFDLENBQUUsb0JBQW9CLENBQUUsQ0FBQztRQUN2QyxXQUFXLEdBQUcsQ0FBQyxDQUFFLGFBQWEsQ0FBRSxDQUFDO1FBRWpDLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxNQUFNLEVBQUUsRUFBRSxDQUFFLENBQUM7UUFDaEUsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGlCQUFpQixDQUFFLGVBQWUsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFFLFlBQVksQ0FBQyxhQUFhLENBQUUsSUFBSSxDQUFFLENBQUUsQ0FBRSxDQUFDO1FBRTdHLE9BQU8sRUFBRSxDQUFDO0lBQ1gsQ0FBQztJQVRlLHVCQUFJLE9BU25CLENBQUE7SUFFRCxTQUFTLGNBQWM7UUFFdEIsWUFBWSxHQUFHLENBQUMsQ0FBQztRQUVqQixJQUFLLFVBQVUsSUFBSSxVQUFVLENBQUMsT0FBTyxFQUFFLEVBQ3ZDO1lBQ0MsVUFBVSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFFLG9DQUFvQyxDQUFFLENBQUM7U0FDckU7UUFFRCxXQUFZLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztJQUM5QixDQUFDO0lBRUQsU0FBUywrQkFBK0I7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