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
        $.GetContextPanel().SetDialogVariable("target_player", GameStateAPI.GetPlayerName(xuid));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfY29tbWVuZF9wbGF5ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfY29tbWVuZF9wbGF5ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUVyQyxJQUFVLGtCQUFrQixDQTJJM0I7QUEzSUQsV0FBVSxrQkFBa0I7SUFFM0IsSUFBSSxZQUFZLEdBQUcsQ0FBQyxDQUFDO0lBQ3JCLElBQUksVUFBVSxHQUFtQixJQUFJLENBQUM7SUFDdEMsSUFBSSxXQUFXLEdBQW1CLElBQUksQ0FBQztJQUV2QyxTQUFnQixJQUFJO1FBRW5CLFVBQVUsR0FBRyxDQUFDLENBQUUsb0JBQW9CLENBQUUsQ0FBQztRQUN2QyxXQUFXLEdBQUcsQ0FBQyxDQUFFLGFBQWEsQ0FBRSxDQUFDO1FBRWpDLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxNQUFNLEVBQUUsRUFBRSxDQUFFLENBQUM7UUFDaEUsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGlCQUFpQixDQUFFLGVBQWUsRUFBRSxZQUFZLENBQUMsYUFBYSxDQUFFLElBQUksQ0FBRSxDQUFFLENBQUM7UUFFN0YsT0FBTyxFQUFFLENBQUM7SUFDWCxDQUFDO0lBVGUsdUJBQUksT0FTbkIsQ0FBQTtJQUVELFNBQVMsY0FBYztRQUV0QixZQUFZLEdBQUcsQ0FBQyxDQUFDO1FBRWpCLElBQUssVUFBVSxJQUFJLFVBQVUsQ0FBQyxPQUFPLEVBQUUsRUFDdkM7WUFDQyxVQUFVLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUUsb0NBQW9DLENBQUUsQ0FBQztTQUNyRTtRQUVELFdBQVksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO0lBQzlCLENBQUM7SUFFRCxTQUFTLCtCQUErQjtRQUV2QyxJQUFLLFlBQVksRUFDakI7WUFD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