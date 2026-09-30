"use strict";
/// <reference path="..//csgo.d.ts" />
var PopupWorkshopModeSelect;
(function (PopupWorkshopModeSelect) {
    let m_elPopup = null;
    let m_elButtonContainer;
    let m_elButtons = [];
    function Init() {
        // Load mode buttons from parameters
        m_elButtons = [];
        m_elPopup = $.GetContextPanel();
        m_elButtonContainer = m_elPopup.FindChildTraverse('popup-workshop-mode-items');
        // enable buttons
        m_elPopup.FindChildTraverse('GoButton').SetPanelEvent('onactivate', _Apply);
        m_elPopup.FindChildTraverse('CancelButton').SetPanelEvent('onactivate', _Cancel);
        let strModes = m_elPopup.GetAttributeString('workshop-modes', '');
        if (!strModes)
            strModes = 'casual';
        let modes = [];
        modes = strModes.split(',');
        if (modes.length <= 1) {
            _Apply(modes[0]);
            return;
        }
        _InitModes(modes);
    }
    PopupWorkshopModeSelect.Init = Init;
    function _InitModes(modes) {
        // delete all buttons
        m_elButtons.forEach(elButton => elButton.DeleteAsync(0.0));
        m_elButtons = [];
        for (let i = 0; i < modes.length; ++i) {
            let strMode = modes[i];
            if (!strMode) {
                continue;
            }
            let elButton = $.CreatePanel('RadioButton', m_elButtonContainer, undefined);
            elButton.BLoadLayoutSnippet('workshop-mode-item');
            elButton.SetAttributeString('data-mode', strMode);
            elButton.SetDialogVariable('workshop-mode-item-name', $.Localize('#CSGO_Workshop_Mode_' + strMode));
            if (i === 0)
                elButton.checked = true;
            m_elButtons.push(elButton);
        }
    }
    function _Apply(singleModeOverride = '') {
        let strGameMode = 'casual';
        let nSkirmishId = 0;
        if (singleModeOverride !== '') {
            strGameMode = singleModeOverride;
        }
        else {
            // find checked button and its mode
            let elSelectedButton = m_elButtons.find(elButton => elButton.checked);
            if (elSelectedButton)
                strGameMode = elSelectedButton.GetAttributeString('data-mode', strGameMode);
        }
        // Look up game type from mode
        let strGameType = GameTypesAPI.GetGameModeType(strGameMode);
        if (!strGameType) {
            // Try looking up skirmish mode
            nSkirmishId = GameTypesAPI.GetSkirmishIdFromInternalName(strGameMode);
            if (nSkirmishId !== 0) {
                strGameMode = 'skirmish';
                strGameType = 'skirmish';
            }
        }
        if (!strGameType) {
            $.Msg("Can't find game mode '" + strGameMode + "'\n");
            // just fall back to casual (should never happen)
            strGameType = 'classic';
            strGameMode = 'casual';
        }
        let settings = {
            update: {
                Game: {
                    type: strGameType,
                    mode: strGameMode,
                }
            }
        };
        if (nSkirmishId !== 0) {
            settings.update.Game.skirmishmode = nSkirmishId;
        }
        else {
            settings.delete = {
                Game: {
                    skirmishmode: '#empty#'
                }
            };
        }
        $.DispatchEvent('UIPopupButtonClicked', '');
        LobbyAPI.UpdateSessionSettings(settings);
        LobbyAPI.StartMatchmaking("", "", "", "");
    }
    ;
    function _Cancel() {
        $.DispatchEvent('UIPopupButtonClicked', '');
        // TODO: make 'go' button reappear
    }
    ;
})(PopupWorkshopModeSelect || (PopupWorkshopModeSelect = {}));
/*
    Options {
        anytypemode 0
        server official
        action custommatch
        conteammatch int( 1 = 0x1 )
    }
    Game {
        type classic
        state lobby
        map cs_agency
        search_key k13600
        ark int( 0 = 0x0 )
        apr int( 1 = 0x1 )
        loc
        hosted int( 1 = 0x1 )
        prime int( 1 = 0x1 )
        mode competitive
        mapgroupname mg_de_lite,mg_de_shipped,mg_de_thrill
    }
    System {
        access public
        network LIVE
    }
    members {
        numMachines int( 1 = 0x1 )
        numPlayers int( 1 = 0x1 )
        numSlots int( 5 = 0x5 )
        machine0 {
            id u64( 148618791998277666 = 0x210000100014822 )
            flags u64( 0 = 0x0 )
            numPlayers int( 1 = 0x1 )
            dlcmask u64( 0 = 0x0 )
            tuver 00000000
            ping int( 0 = 0x0 )
            player0 {
                xuid u64( 148618791998277666 = 0x210000100014822 )
                name Gautam
                    game {
                        clanID int( 0 = 0x0 )
                        ranking int( 0 = 0x0 )
                        wins int( 111 = 0x6F )
                        level int( 8 = 0x8 )
                        xppts int( 327683213 = 0x13880C8D )
                        commends [f5][t1][l2]
                        teamcolor int( 0 = 0x0 )
                        prime int( 1 = 0x1 )
                        loc
                    }
                }
            }
        }
    }
*/ 
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfd29ya3Nob3BfbW9kZV9zZWxlY3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfd29ya3Nob3BfbW9kZV9zZWxlY3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHNDQUFzQztBQUV0QyxJQUFVLHVCQUF1QixDQW1JaEM7QUFuSUQsV0FBVSx1QkFBdUI7SUFFaEMsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDO0lBQ3JCLElBQUksbUJBQTRCLENBQUM7SUFDakMsSUFBSSxXQUFXLEdBQW9CLEVBQUUsQ0FBQztJQUV0QyxTQUFnQixJQUFJO1FBRW5CLG9DQUFvQztRQUNwQyxXQUFXLEdBQUcsRUFBRSxDQUFDO1FBQ2pCLFNBQVMsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDaEMsbUJBQW1CLEdBQUcsU0FBUyxDQUFDLGlCQUFpQixDQUFFLDJCQUEyQixDQUFFLENBQUM7UUFFakYsaUJBQWlCO1FBQ2pCLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBRSxVQUFVLENBQUUsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLE1BQU0sQ0FBRSxDQUFDO1FBQ2hGLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBRSxjQUFjLENBQUUsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLE9BQU8sQ0FBRSxDQUFDO1FBRXJGLElBQUksUUFBUSxHQUFHLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBRSxnQkFBZ0IsRUFBRSxFQUFFLENBQUUsQ0FBQztRQUNwRSxJQUFLLENBQUMsUUFBUTtZQUNiLFFBQVEsR0FBRyxRQUFRLENBQUM7UUFFckIsSUFBSSxLQUFLLEdBQVksRUFBRSxDQUFDO1FBQ3hCLEtBQUssR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFFLEdBQUcsQ0FBRSxDQUFDO1FBRTlCLElBQUcsS0FBSyxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQ3BCO1lBQ0MsTUFB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