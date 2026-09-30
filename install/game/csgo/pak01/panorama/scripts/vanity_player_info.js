"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="avatar.ts" />
/// <reference path="common/sessionutil.ts" />
/// <reference path="mock_adapter.ts" />
/// <reference path="rating_emblem.ts" />
var VanityPlayerInfo;
(function (VanityPlayerInfo) {
    function CreateOrUpdateVanityInfoPanel(elParent = null, oSettings = null) {
        if (!elParent) {
            elParent = $.GetContextPanel();
        }
        const idPrefix = "id-player-vanity-info-" + oSettings.playeridx;
        let newPanel = elParent.FindChildInLayoutFile(idPrefix);
        if (!newPanel) {
            newPanel = $.CreatePanel('Button', elParent, idPrefix);
            newPanel.BLoadLayout('file://{resources}/layout/vanity_player_info.xml', false, false);
            newPanel.AddClass('vanity-info-loc-' + oSettings.playeridx);
            newPanel.AddClass('show');
        }
        _SetName(newPanel, oSettings.xuid);
        _SetAvatar(newPanel, oSettings.xuid);
        _SetRank(newPanel, oSettings.xuid, oSettings.isLocalPlayer);
        _SetSkillGroup(newPanel, oSettings.xuid, oSettings.isLocalPlayer);
        _SetHonorIcon(newPanel, oSettings.xuid);
        _AddOpenPlayerCardAction(newPanel.FindChildInLayoutFile('vanity-info-container'), oSettings.xuid);
        _SetLobbyLeader(newPanel, oSettings.xuid);
        _ShowSettingsBtn(newPanel, oSettings.xuid);
        return newPanel;
    }
    VanityPlayerInfo.CreateOrUpdateVanityInfoPanel = CreateOrUpdateVanityInfoPanel;
    function DeleteVanityInfoPanel(elParent, index) {
        const idPrefix = "id-player-vanity-info-" + index;
        const elPanel = elParent.FindChildInLayoutFile(idPrefix);
        if (elPanel && elPanel.IsValid()) {
            elPanel.DeleteAsync(0);
        }
    }
    VanityPlayerInfo.DeleteVanityInfoPanel = DeleteVanityInfoPanel;
    function _RoundToPixel(context, value, axis) {
        const scale = axis === "x" ? context.actualuiscale_x : context.actualuiscale_y;
        return Math.round(value * scale) / scale;
    }
    function SetVanityInfoPanelPos(elParent, index, oPos, idPrefix, OnlyXOrY) {
        const elPanel = elParent.FindChildInLayoutFile(idPrefix);
        if (elPanel && elPanel.IsValid()) {
            switch (OnlyXOrY) {
                case 'x':
                    elPanel.style.transform = 'translateX( ' + oPos.x + 'px );';
                    break;
                case 'y':
                    elPanel.style.transform = 'translateY( ' + oPos.x + 'px );';
                    break;
                default:
                    elPanel.style.transform = 'translate3d( ' + _RoundToPixel(elParent, oPos.x, "x") + 'px, ' + _RoundToPixel(elParent, oPos.y, "y") + 'px, 0px );';
                    break;
            }
        }
    }
    VanityPlayerInfo.SetVanityInfoPanelPos = SetVanityInfoPanelPos;
    // individual elements
    function _SetName(newPanel, xuid) {
        newPanel.SetDialogVariable('partyxuid', xuid);
    }
    function _SetAvatar(newPanel, xuid) {
        const elParent = newPanel.FindChildInLayoutFile('vanity-avatar-container');
        let elAvatar = elParent.FindChildInLayoutFile('JsPlayerVanityAvatar-' + xuid);
        if (!elAvatar) {
            elAvatar = $.CreatePanel("Panel", elParent, 'JsPlayerVanityAvatar-' + xuid);
            elAvatar.SetAttributeString('xuid', xuid);
            elAvatar.BLoadLayout('file://{resources}/layout/avatar.xml', false, false);
            elAvatar.BLoadLayoutSnippet("AvatarPlayerCard");
            elAvatar.AddClass('avatar--vanity');
        }
        Avatar.Init(elAvatar, xuid, 'partymember');
        if (MockAdapter.IsFakePlayer(xuid)) {
            const elAvatarImage = elAvatar.FindChildInLayoutFile("JsAvatarImage");
            elAvatarImage.PopulateFromPlayerSlot(MockAdapter.GetPlayerSlot(xuid));
        }
    }
    function _SetRank(newPanel, xuid, isLocalPlayer) {
        const elRankIcon = newPanel.FindChildInLayoutFile('vanity-xp-icon');
        const elXpBarInner = newPanel.FindChildInLayoutFile('vanity-xp-bar-inner');
        if (!isLocalPlayer || !MyPersonaAPI.IsInventoryValid()) {
            newPanel.FindChildInLayoutFile('vanity-xp-container').visible = false;
            return;
        }
        newPanel.FindChildInLayoutFile('vanity-xp-container').visible = true;
        const currentLvl = FriendsListAPI.GetFriendLevel(xuid);
        if (!MyPersonaAPI.IsInventoryValid() ||
            !currentLvl ||
            (!_HasXpProgressToFreeze() && !_IsPlayerPrime(xuid))) {
            newPanel.AddClass('no-valid-xp');
            return;
        }
        const bHasRankToFreezeButNoPrestige = (!_IsPlayerPrime(xuid) && _HasXpProgressToFreeze()) ? true : false;
        const currentPoints = FriendsListAPI.GetFriendXp(xuid);
        const pointsPerLevel = MyPersonaAPI.GetXpPerLevel();
        // Set Xp bar and show.
        if (bHasRankToFreezeButNoPrestige) {
            elXpBarInner.GetParent().visible = false;
        }
        else {
            const percentComplete = (currentPoints / pointsPerLevel) * 100;
            elXpBarInner.style.width = percentComplete + '%';
            elXpBarInner.GetParent().visible = true;
            _ShowPrestigeUpgrade(newPanel, xuid, isLocalPlayer);
        }
        // Set Xp rank image and show.
        elRankIcon.SetImage('file://{images}/icons/xp/level' + currentLvl + '.png');
        newPanel.RemoveClass('no-valid-xp');
    }
    function _SetSkillGroup(newPanel, xuid, isLocalPlayer) {
        let rating_type;
        let score;
        let wins;
        if (isLocalPlayer && !PartyListAPI.IsPartySessionActive()) {
            rating_type = 'Premier';
            score = MyPersonaAPI.GetPipRankCount(rating_type);
            wins = MyPersonaAPI.GetPipRankWins(rating_type);
        }
        else {
            rating_type = PartyListAPI.GetFriendCompetitiveRankType(xuid);
            score = PartyListAPI.GetFriendCompetitiveRank(xuid);
            wins = PartyListAPI.GetFriendCompetitiveWins(xuid);
        }
        let options = {
            root_panel: newPanel,
            //	xuid: xuid,
            //	api: 'partylist' as SkillRatingSourceAPI_t,
            do_fx: true,
            full_details: false,
            rating_type: rating_type,
            leaderboard_details: { score: score, matchesWon: wins },
            local_player: xuid === MyPersonaAPI.GetXuid()
        };
        RatingEmblem.SetXuid(options);
        newPanel.SetDialogVariable('rating-text', RatingEmblem.GetRatingDesc(newPanel));
    }
    function _SetHonorIcon(elPanel, xuid) {
        const elHonorIcon = elPanel.FindChildTraverse('jsHonorIcon');
        if (elHonorIcon) {
            elHonorIcon.Set(PartyListAPI.GetFriendXpTrailLevel(xuid), PartyListAPI.GetFriendPrimeEligible(xuid));
        }
    }
    function _ShowPrestigeUpgrade(elPanel, xuid, isLocalPlayer) {
        let bPrestigeAvailable = isLocalPlayer && (FriendsListAPI.GetFriendLevel(xuid) >= InventoryAPI.GetMaxLevel());
        elPanel.FindChildInLayoutFile('vanity-xp-prestige').SetHasClass('hidden', !bPrestigeAvailable);
        if (bPrestigeAvailable) {
            elPanel.FindChildInLayoutFile('vanity-xp-prestige').SetPanelEvent('onactivate', _OnActivateGetPrestigeButtonClickable);
        }
    }
    function _OnActivateGetPrestigeButtonClickable() {
        const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_inventory_inspect.xml');
        let oSettings = {
            item_id: '0',
            show_work_type_warning: false,
            work_type: 'prestigecheck'
        };
        elPanel.Data().oSettings = oSettings;
    }
    function UpdateVoiceIcon(elAvatar, xuid) {
        Avatar.UpdateTalkingState(elAvatar, xuid);
    }
    VanityPlayerInfo.UpdateVoiceIcon = UpdateVoiceIcon;
    function _HasXpProgressToFreeze() {
        return MyPersonaAPI.HasPrestige() || (MyPersonaAPI.GetCurrentLevel() > 2);
    }
    function _IsPlayerPrime(xuid) {
        return FriendsListAPI.GetFriendPrimeEligible(xuid);
    }
    function _SetLobbyLeader(elPanel, xuid) {
        elPanel.SetHasClass('is-not-leader', LobbyAPI.GetHostSteamID() !== xuid);
    }
    function _ShowSettingsBtn(elPanel, xuid) {
        elPanel.SetHasClass("show-controls", MyPersonaAPI.GetXuid() === xuid);
    }
    function _AddOpenPlayerCardAction(elPanel, xuid) {
        elPanel.SetPanelEvent("onactivate", () => {
            if (xuid !== "0") {
                const contextMenuPanel = UiToolkitAPI.ShowCustomLayoutContextMenuParametersDismissEvent('', '', 'file://{resources}/layout/context_menus/context_menu_playercard.xml', 'xuid=' + xuid, () => { });
                contextMenuPanel.AddClass("ContextMenu_NoArrow");
            }
        });
    }
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        if ($.DbgIsReloadingScript()) {
            $.Msg("Vanity player reloaded\n ");
        }
    }
})(VanityPlayerInfo || (VanityPlayerInfo = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFuaXR5X3BsYXllcl9pbmZvLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvdmFuaXR5X3BsYXllcl9pbmZvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFDbEMsa0NBQWtDO0FBQ2xDLDhDQUE4QztBQUM5Qyx3Q0FBd0M7QUFDeEMseUNBQXlDO0FBWXpDLElBQVUsZ0JBQWdCLENBbVJ6QjtBQW5SRCxXQUFVLGdCQUFnQjtJQUV6QixTQUFnQiw2QkFBNkIsQ0FBRyxXQUF5QixJQUFJLEVBQUUsWUFBNEMsSUFBSTtRQUU5SCxJQUFLLENBQUMsUUFBUSxFQUNkO1lBQ0MsUUFBUSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztTQUMvQjtRQUVELE1BQU0sUUFBUSxHQUFHLHdCQUF3QixHQUFHLFNBQVUsQ0FBQyxTQUFTLENBQUM7UUFDakUsSUFBSSxRQUFRLEdBQUcsUUFBUSxDQUFDLHFCQUFxQixDQUFFLFFBQVEsQ0FBRSxDQUFDO1FBRTFELElBQUssQ0FBQyxRQUFRLEVBQ2Q7WUFDQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLFFBQVEsQ0FBRSxDQUFDO1lBQ3pELFFBQVEsQ0FBQyxXQUFXLENBQUUsa0RBQWtELEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBRSxDQUFDO1lBQ3pGLFFBQVEsQ0FBQyxRQUFRLENBQUUsa0JBQWtCLEdBQUcsU0FBVSxDQUFDLFNBQVMsQ0FBRSxDQUFDO1lBQy9ELFFBQVEsQ0FBQyxRQUFRLENBQUUsTUFBTSxDQUFFLENBQUM7U0FDNUI7UUFFRCxRQUFRLENBQUUsUUFBUSxFQUFFLFNBQVUsQ0FBQyxJQUFJLENBQUUsQ0FBQztRQUN0QyxVQUFVLENBQUUsUUFBUSxFQUFFLFNBQVUsQ0FBQyxJQUFJLENBQUUsQ0FBQztRQUN4QyxRQUFRLENBQUUsUUFBUSxFQUFFLFNB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