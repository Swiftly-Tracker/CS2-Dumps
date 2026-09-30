"use strict";
/// <reference path="csgo.d.ts" />
var SettingsMenuChatwheel;
(function (SettingsMenuChatwheel) {
    //When editing these options, also have to add corresponding entries to csgo_radial_radio.cpp
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
    //Setup
    _PopulateSegments();
    _PopulateSettingsList();
})(SettingsMenuChatwheel || (SettingsMenuChatwheel = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3NtZW51X2NoYXR3aGVlbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3NldHRpbmdzbWVudV9jaGF0d2hlZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUVsQyxJQUFVLHFCQUFxQixDQStPOUI7QUEvT0QsV0FBVSxxQkFBcUI7SUFFOUIsNkZBQTZGO0lBQzdGLElBQUksU0FBUyxHQUFHO1FBQ2YsRUFBRSxJQUFJLEVBQUUsNEJBQTRCLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRTtRQUNoRCxFQUFFLElBQUksRUFBRSw0QkFBNEIsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSx3Q0FBd0MsRUFBRTtRQUM1RyxFQUFFLElBQUksRUFBRSx5QkFBeUIsRUFBRSxLQUFLLEVBQUUsZUFBZSxFQUFFLElBQUksRUFBRSxxQ0FBcUMsRUFBRTtRQUN4RyxFQUFFLElBQUksRUFBRSwwQkFBMEIsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxzQ0FBc0MsRUFBRTtRQUN4RyxFQUFFLElBQUksRUFBRSx3QkFBd0IsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxvQ0FBb0MsRUFBRTtRQUNwRyxFQUFFLElBQUksRUFBRSwwQkFBMEIsRUFBRSxLQUFLLEVBQUUsZUFBZSxFQUFFLElBQUksRUFBRSxvQ0FBb0MsRUFBRTtRQUV4RyxFQUFFLElBQUksRUFBRSx5QkFBeUIsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFO1FBQzdDLEVBQUUsSUFBSSxFQUFFLG1CQUFtQixFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLCtCQUErQixFQUFFO1FBQ3hGLEVBQUUsSUFBSSxFQUFFLG9CQUFvQixFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLGdDQUFnQyxFQUFFO1FBQ3ZGLEVBQUUs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