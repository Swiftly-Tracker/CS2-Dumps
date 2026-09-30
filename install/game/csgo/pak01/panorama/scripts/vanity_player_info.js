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
        if (bHasRankToFreezeButNoPrestige) {
            elXpBarInner.GetParent().visible = false;
        }
        else {
            const percentComplete = (currentPoints / pointsPerLevel) * 100;
            elXpBarInner.style.width = percentComplete + '%';
            elXpBarInner.GetParent().visible = true;
            _ShowPrestigeUpgrade(newPanel, xuid, isLocalPlayer);
        }
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
    {
        if ($.DbgIsReloadingScript()) {
        }
    }
})(VanityPlayerInfo || (VanityPlayerInfo = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFuaXR5X3BsYXllcl9pbmZvLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvdmFuaXR5X3BsYXllcl9pbmZvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFDbEMsa0NBQWtDO0FBQ2xDLDhDQUE4QztBQUM5Qyx3Q0FBd0M7QUFDeEMseUNBQXlDO0FBWXpDLElBQVUsZ0JBQWdCLENBbVJ6QjtBQW5SRCxXQUFVLGdCQUFnQjtJQUV6QixTQUFnQiw2QkFBNkIsQ0FBRyxXQUF5QixJQUFJLEVBQUUsWUFBNEMsSUFBSTtRQUU5SCxJQUFLLENBQUMsUUFBUSxFQUNkO1lBQ0MsUUFBUSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztTQUMvQjtRQUVELE1BQU0sUUFBUSxHQUFHLHdCQUF3QixHQUFHLFNBQVUsQ0FBQyxTQUFTLENBQUM7UUFDakUsSUFBSSxRQUFRLEdBQUcsUUFBUSxDQUFDLHFCQUFxQixDQUFFLFFBQVEsQ0FBRSxDQUFDO1FBRTFELElBQUssQ0FBQyxRQUFRLEVBQ2Q7WUFDQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLFFBQVEsQ0FBRSxDQUFDO1lBQ3pELFFBQVEsQ0FBQyxXQUFXLENBQUUsa0RBQWtELEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBRSxDQUFDO1lBQ3pGLFFBQVEsQ0FBQyxRQUFRLENBQUUsa0JBQWtCLEdBQUcsU0FBVSxDQUFDLFNBQVMsQ0FBRSxDQUFDO1lBQy9ELFFBQVEsQ0FBQyxRQUFRLENBQUUsTUFBTSxDQUFFLENBQUM7U0FDNUI7UUFFRCxRQUFRLENBQUUsUUFBUSxFQUFFLFNBQVUsQ0FBQyxJQUFJLENBQUUsQ0FBQztRQUN0QyxVQUFVLENBQUUsUUFBUSxFQUFFLFNBQVUsQ0FBQyxJQUFJLENBQUUsQ0FBQztRQUN4QyxRQUFRLENBQUUsUUFBUSxFQUFFLFNB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