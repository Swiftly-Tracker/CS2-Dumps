"use strict";
/// <reference path="csgo.d.ts" />
var SettingsMenuChatwheel;
(function (SettingsMenuChatwheel) {
    let m_options = [
        { text: "#Chatwheel_section_prepare", title: 1 },
        { text: "#Chatwheel_requestecoround", radio: "CW.EcoRound", icon: "icons/ui/chatwheel_requestecoround.svg" },
        { text: "#Chatwheel_requestspend", radio: "CW.SpendRound", icon: "icons/ui/chatwheel_requestspend.svg" },
        { text: "#Chatwheel_requestweapon", radio: "CW.NeedDrop", icon: "icons/ui/chatwheel_requestweapon.svg" },
        { text: "#Chatwheel_requestplan", radio: "CW.NeedPlan", icon: "icons/ui/chatwheel_requestplan.svg" },
        { text: "#Chatwheel_requestleader", radio: "CW.NeedLeader", icon: "icons/ui/chatwheel_requestplan.svg" },
        { text: "#Chatwheel_section_move", title: 1 },
        { text: "#Chatwheel_gogogo", radio: "CW.GoGoGo", icon: "icons/ui/chatwheel_gogogo.svg" },
        { text: "#Chatwheel_onmyway", radio: "CW.OMW", icon: "icons/ui/chatwheel_onmyway.svg" },
        { text: "#Chatwheel_followme", radio: "CW.FollowMe", icon: "icons/ui/chatwheel_followme.svg" },
        { text: "#Chatwheel_followingyou", radio: "CW.FollowingYou", icon: "icons/ui/chatwheel_followyou.svg" },
        { text: "#Chatwheel_aplan", radio: "CW.GoA", icon: "icons/ui/map_bombzone_a.svg" },
        { text: "#Chatwheel_bplan", radio: "CW.GoB", icon: "icons/ui/map_bombzone_b.svg" },
        { text: "#Chatwheel_midplan", radio: "CW.GoToLocMid", icon: "icons/ui/chatwheel_midplan.svg" },
        { text: "#Chatwheel_section_command", title: 1 },
        { text: "#Chatwheel_rotatetome", radio: "CW.Regroup", icon: "icons/ui/chatwheel_rotatetome.svg" },
        { text: "#Chatwheel_sticktogether", radio: "CW.StickTogether", icon: "icons/ui/chatwheel_sticktogether.svg" },
        { text: "#Chatwheel_spreadout", radio: "CW.SpreadOut", icon: "icons/ui/chatwheel_spreadout.svg" },
        { text: "#Chatwheel_fallback", radio: "CW.TeamFallBack", icon: "icons/ui/chatwheel_fallback.svg" },
        { text: "#Chatwheel_holdposition", radio: "CW.HoldPosition", icon: "icons/ui/chatwheel_holdposition.svg" },
        { text: "#Chatwheel_gethostage", radio: "CW.CheckHostage", icon: "icons/ui/chatwheel_gethostage.svg" },
        { text: "#Chatwheel_quiet", radio: "CW.NeedQuiet", icon: "icons/ui/chatwheel_heardnoise.svg" },
        { text: "#Chatwheel_attacking", radio: "CW.ImAttacking", icon: "icons/ui/chatwheel_gogogo.svg" },
        { text: "#Chatwheel_requestgethostages", radio: "CW.RequestGetHostages", icon: "icons/ui/chatwheel_gethostage.svg" },
        { text: "#Chatwheel_section_report", title: 1 },
        { text: "#Chatwheel_heardnoise", radio: "CW.HeardNoise", icon: "icons/ui/chatwheel_heardnoise.svg" },
        { text: "#Chatwheel_enemyspotted", radio: "CW.SeesEnemy", icon: "icons/ui/chatwheel_enemyspotted.svg" },
        { text: "#Chatwheel_oneenemyhere", radio: "CW.SeesSingleEnemy", icon: "icons/ui/chatwheel_oneenemyhere.svg" },
        { text: "#Chatwheel_multipleenemieshere", radio: "CW.SeesEnemiesMultiple", icon: "icons/ui/chatwheel_multipleenemieshere.svg" },
        { text: "#Chatwheel_needbackup", radio: "CW.NeedBackup", icon: "icons/ui/chatwheel_needbackup.svg" },
        { text: "#Chatwheel_sniperspotted", radio: "CW.SniperWarning", icon: "icons/ui/chatwheel_sniperspotted.svg" },
        { text: "#Chatwheel_bombcarrierspotted", radio: "CW.BombCarrierHere", icon: "icons/ui/chatwheel_bombcarrierspotted.svg" },
        { text: "#Chatwheel_inposition", radio: "CW.InPosition", icon: "icons/ui/chatwheel_inposition.svg" },
        { text: "#Chatwheel_coveringyou", radio: "CW.CoveringYou", icon: "icons/ui/chatwheel_covering.svg" },
        { text: "#Chatwheel_sectorclear", radio: "CW.SectorClear", icon: "icons/ui/chatwheel_sectorclear.svg" },
        { text: "#Chatwheel_bombcarrierspotted", radio: "CW.ISeeBomb", icon: "icons/ui/bomb_c4.svg" },
        { text: "#Chatwheel_planted", radio: "CW.wePlanted", icon: "icons/ui/bomb_c4.svg" },
        { text: "#Chatwheel_bombpickedup", radio: "CW.PickedUpC4", icon: "icons/ui/bomb_icon.svg" },
        { text: "#Chatwheel_seehostagestaken", radio: "CW.SeesHostagesBeingTaken", icon: "icons/ui/chatwheel_gethostage.svg" },
        { text: "#Chatwheel_bombsiteclear", radio: "CW.BombsiteClear", icon: "icons/ui/chatwheel_spreadout.svg" },
        { text: "#Chatwheel_guardinga", radio: "CW.GuardingA", icon: "icons/ui/map_bombzone_a.svg" },
        { text: "#Chatwheel_guardingb", radio: "CW.GuardingB", icon: "icons/ui/map_bombzone_b.svg" },
        { text: "#Chatwheel_section_bomb", title: 1 },
        { text: "#Chatwheel_ifixbomb", radio: "CW.IFixBomb", icon: "icons/ui/chatwheel_ifixbomb.svg" },
        { text: "#Chatwheel_youfixbomb", radio: "CW.YouFixBomb", icon: "icons/ui/chatwheel_youfixbomb.svg" },
        { text: "#Chatwheel_droppedbomb", radio: "CW.DroppedBomb", icon: "icons/ui/chatwheel_droppedbomb.svg" },
        { text: "#Chatwheel_guardingbomb", radio: "CW.GuardingDroppedBomb", icon: "icons/ui/chatwheel_guardingbomb.svg" },
        { text: "#Chatwheel_bombat", radio: "CW.BombAt", icon: "icons/ui/chatwheel_bombat.svg" },
        { text: "#Chatwheel_ihavethebomb", radio: "CW.WeHaveTheBomb", icon: "icons/ui/chatwheel_ihavethebomb.svg" },
        { text: "#Chatwheel_plantingata", radio: "CW.PlantingAtA", icon: "icons/ui/map_bombzone_a.svg" },
        { text: "#Chatwheel_plantingatb", radio: "CW.PlantingAtB", icon: "icons/ui/map_bombzone_b.svg" },
        { text: "#Chatwheel_plantedata", radio: "CW.PlantedAtA", icon: "icons/ui/map_bombzone_a.svg" },
        { text: "#Chatwheel_plantedatb", radio: "CW.PlantedAtB", icon: "icons/ui/map_bombzone_b.svg" },
        { text: "#Chatwheel_section_responses", title: 1 },
        { text: "#Chatwheel_affirmative", radio: "CW.Agree", icon: "icons/ui/chatwheel_affirmative.svg" },
        { text: "#Chatwheel_negative", radio: "CW.Disagree", icon: "icons/ui/chatwheel_negative.svg" },
        { text: "#Chatwheel_compliment", radio: "CW.Compliment", icon: "icons/ui/chatwheel_compliment.svg" },
        { text: "#Chatwheel_thanks", radio: "CW.Thanks", icon: "icons/ui/chatwheel_thanks.svg" },
        { text: "#Chatwheel_cheer", radio: "CW.Cheer", icon: "icons/ui/chatwheel_cheer.svg" },
        { text: "#Chatwheel_peptalk", radio: "CW.PepTalk", icon: "icons/ui/chatwheel_peptalk.svg" },
        { text: "#Chatwheel_sorry", radio: "CW.Sorry", icon: "icons/ui/chatwheel_sorry.svg" },
        { text: "#Chatwheel_lostround", radio: "CW.RoundLost", icon: "icons/ui/chatwheel_sorry.svg" },
        { text: "#Chatwheel_ikilledsniper", radio: "CW.IKilledSniper", icon: "Icons/ui/chatwheel_sniperspotted.svg" },
        { text: "#Chatwheel_gotheadshot", radio: "CW.MyHeadshot", icon: "icons/ui/chatwheel_cheer.svg" },
        { text: "#Chatwheel_sawheadshot", radio: "CW.SawHeadshot", icon: "icons/ui/chatwheel_compliment.svg" },
        { text: "#Chatwheel_section_grenades", title: 1 },
        { text: "#Chatwheel_decoy", radio: "CW.NeedDecoy", icon: "icons/ui/chatwheel_decoy.svg" },
        { text: "#Chatwheel_smoke", radio: "CW.NeedSmoke", icon: "icons/ui/chatwheel_smoke.svg" },
        { text: "#Chatwheel_grenade", radio: "CW.NeedGrenade", icon: "icons/ui/chatwheel_grenade.svg" },
        { text: "#Chatwheel_fire", radio: "CW.NeedFire", icon: "icons/ui/chatwheel_fire.svg" },
        { text: "#Chatwheel_flashbang", radio: "CW.NeedFlash", icon: "icons/ui/chatwheel_flashbang.svg" },
    ];
    let m_panelList = [];
    let m_chatwheelName = "0";
    function ClickChatwheelPanel() {
        _ClearHighlights();
    }
    SettingsMenuChatwheel.ClickChatwheelPanel = ClickChatwheelPanel;
    function ActivateChatwheel(chatwheelNumber) {
        _ClearHighlights();
        m_chatwheelName = String(chatwheelNumber);
        _PopulateSegments();
    }
    SettingsMenuChatwheel.ActivateChatwheel = ActivateChatwheel;
    let m_activeSegment = -1;
    function ActivateSegment(segmentNumber) {
        m_activeSegment = segmentNumber;
        for (let i = 0; i < 8; ++i) {
            if (i != segmentNumber) {
                $("#radio-segment-" + i).RemoveClass('RadialRadioSettingsSegment--selected');
            }
        }
        $("#radio-segment-" + segmentNumber).AddClass('RadialRadioSettingsSegment--selected');
        $('#chatwheel-settings-list').FindChildrenWithClassTraverse('RadialRadioSettingsSingleOptionPanel').forEach(el => el.AddClass('RadialRadioSettingsSingleOptionPanel--highlight'));
    }
    SettingsMenuChatwheel.ActivateSegment = ActivateSegment;
    function _ClearHighlights() {
        $('#chatwheel-settings-list').FindChildrenWithClassTraverse('RadialRadioSettingsSingleOptionPanel').forEach(el => el.RemoveClass('RadialRadioSettingsSingleOptionPanel--highlight'));
        m_activeSegment = -1;
        for (let i = 0; i < 8; ++i) {
            $("#radio-segment-" + i).RemoveClass('RadialRadioSettingsSegment--selected');
        }
    }
    function _PopulateSegments() {
        for (let i = 0; i < 8; ++i) {
            let elPanel = $('#radio-segment-' + i);
            let elLabel = elPanel.FindChildTraverse('segment-label');
            let strText = GameInterfaceAPI.GetSettingString('cl_radial_radio_tab_' + m_chatwheelName + '_text_' + (i + 1));
            elLabel.text = $.Localize(strText);
            let elIcon = elPanel.FindChildTraverse('segment-icon');
            for (let j = 0; j < m_options.length; ++j) {
                if (m_options[j].text == strText) {
                    if (m_options[j].icon) {
                        elIcon.SetImage("file://{images}/" + m_options[j].icon);
                    }
                    else {
                        elIcon.SetImage("");
                    }
                }
            }
        }
    }
    function _PopulateSettingsList() {
        let elOptionsList = $('#chatwheel-settings-list');
        for (let i = 0; i < m_options.length; ++i) {
            let strOption = m_options[i].text;
            let strIcon = m_options[i].icon;
            let elPanel;
            if (m_options[i].title) {
                elPanel = $.CreatePanel("Panel", elOptionsList, "chatwheel-option-" + i);
                elPanel.BLoadLayoutSnippet("ChatWheelHeadingPanel");
            }
            else {
                elPanel = $.CreatePanel("Button", elOptionsList, "chatwheel-option-" + i);
                elPanel.BLoadLayoutSnippet("ChatWheelOptionPanel");
                elPanel.SetPanelEvent('onactivate', () => {
                    if (m_activeSegment != -1) {
                        let elSegment = $("#radio-segment-" + m_activeSegment);
                        elSegment.RemoveClass('RadialRadioSettingsSegment--selected');
                        elSegment.FindChildTraverse('segment-label').text = $.Localize(strOption);
                        let elIcon = elSegment.FindChildTraverse('segment-icon');
                        for (let j = 0; j < m_options.length; ++j) {
                            if (m_options[j].text == strOption) {
                                if (m_options[j].icon) {
                                    elIcon.SetImage("file://{images}/" + m_options[j].icon);
                                }
                                else {
                                    elIcon.SetImage("");
                                }
                            }
                        }
                        GameInterfaceAPI.SetSettingString('cl_radial_radio_tab_' + m_chatwheelName + '_text_' + (m_activeSegment + 1), strOption);
                        GameInterfaceAPI.ConsoleCommand('host_writeconfig');
                    }
                    m_activeSegment = -1;
                    _ClearHighlights();
                });
            }
            let elLabel = elPanel.FindChildTraverse('chat-wheel-option-label');
            elLabel.text = $.Localize(strOption);
            if (strIcon) {
                let elImage = elPanel.FindChildTraverse('chat-wheel-option-icon');
                elImage.SetImage("file://{images}/" + strIcon);
            }
            let searchEntry = {
                panel: elPanel,
                text: $.Localize(strOption).toLowerCase(),
            };
            m_panelList.push(searchEntry);
        }
    }
    function SearchChanged() {
        let text = $('#RadialRadioSettingsSearchText').text.toLowerCase();
        for (let i = 0; i < m_panelList.length; ++i) {
            let found = (m_panelList[i].text.indexOf(text) != -1);
            m_panelList[i].panel.visible = found;
        }
    }
    SettingsMenuChatwheel.SearchChanged = SearchChanged;
    _PopulateSegments();
    _PopulateSettingsList();
})(SettingsMenuChatwheel || (SettingsMenuChatwheel = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3NtZW51X2NoYXR3aGVlbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3NldHRpbmdzbWVudV9jaGF0d2hlZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUVsQyxJQUFVLHFCQUFxQixDQStPOUI7QUEvT0QsV0FBVSxxQkFBcUI7SUFHOUIsSUFBSSxTQUFTLEdBQUc7UUFDZixFQUFFLElBQUksRUFBRSw0QkFBNEIsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFO1FBQ2hELEVBQUUsSUFBSSxFQUFFLDRCQUE0QixFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLHdDQUF3QyxFQUFFO1FBQzVHLEVBQUUsSUFBSSxFQUFFLHlCQUF5QixFQUFFLEtBQUssRUFBRSxlQUFlLEVBQUUsSUFBSSxFQUFFLHFDQUFxQyxFQUFFO1FBQ3hHLEVBQUUsSUFBSSxFQUFFLDBCQUEwQixFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLHNDQUFzQyxFQUFFO1FBQ3hHLEVBQUUsSUFBSSxFQUFFLHdCQUF3QixFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLG9DQUFvQyxFQUFFO1FBQ3BHLEVBQUUsSUFBSSxFQUFFLDBCQUEwQixFQUFFLEtBQUssRUFBRSxlQUFlLEVBQUUsSUFBSSxFQUFFLG9DQUFvQyxFQUFFO1FBRXhHLEVBQUUsSUFBSSxFQUFFLHlCQUF5QixFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUU7UUFDN0MsRUFBRSxJQUFJLEVBQUUsbUJBQW1CLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsK0JBQStCLEVBQUU7UUFDeEYsRUFBRSxJQUFJLEVBQUUsb0JBQW9CLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsZ0NBQWdDLEVBQUU7UUFDdkYsRUFBRSxJQUFJLEVBQUUscUJB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