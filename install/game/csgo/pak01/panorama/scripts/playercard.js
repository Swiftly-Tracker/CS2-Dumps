"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/sessionutil.ts" />
/// <reference path="rating_emblem.ts" />
/// <reference path="honor_icon.ts" />
/// <reference path="avatar.ts" />
var PlayerCard;
(function (PlayerCard) {
    let _m_xuid = '';
    let _m_currentLvl = null;
    let _m_isSelf = false;
    let _m_bShownInFriendsList = false;
    let _m_tooltipDelayHandle = null;
    let _m_arrAdditionalSkillGroups = ['Wingman'];
    let _m_InventoryUpdatedHandler = null;
    let _m_ShowLockedRankSkillGroupState = false;
    let _m_cp = $.GetContextPanel();
    function Init() {
        _m_xuid = $.GetContextPanel().GetAttributeString('xuid', 'no XUID found');
        _m_isSelf = _m_xuid === MyPersonaAPI.GetXuid() ? true : false;
        _m_bShownInFriendsList = $.GetContextPanel().GetAttributeString('data-slot', '') !== '';
        $("#AnimBackground").PopulateFromSteamID(_m_xuid);
        _RegisterForInventoryUpdate();
        if (!_m_isSelf)
            FriendsListAPI.RequestFriendProfileUpdateFromScript(_m_xuid);
        FillOutFriendCard();
    }
    function _RegisterForInventoryUpdate() {
        _m_InventoryUpdatedHandler = $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', UpdateAvatar);
        _m_cp.RegisterForReadyEvents(true);
        $.RegisterEventHandler('ReadyForDisplay', _m_cp, () => {
            if (!_m_InventoryUpdatedHandler) {
                _m_InventoryUpdatedHandler = $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', UpdateAvatar);
            }
        });
        $.RegisterEventHandler('UnreadyForDisplay', _m_cp, () => {
            if (_m_InventoryUpdatedHandler) {
                $.UnregisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', _m_InventoryUpdatedHandler);
                _m_InventoryUpdatedHandler = null;
            }
        });
    }
    function FillOutFriendCard() {
        if (_m_xuid) {
            _m_currentLvl = FriendsListAPI.GetFriendLevel(_m_xuid);
            _m_ShowLockedRankSkillGroupState = !_IsPlayerPrime() && _HasXpProgressToFreeze();
            UpdateName();
            _SetHonorIcon();
            _SetAvatar();
            _SetFlairItems();
            _SetPlayerBackground();
            _SetRank();
            _SetPrimeUpsell();
            if (_m_isSelf) {
                if (MyPersonaAPI.GetPipRankWins("Premier") >= 0) {
                    if (_m_bShownInFriendsList)
                        _SetSkillGroup('Premier');
                    else
                        SetAllSkillGroups();
                }
                else {
                    let elToggleBtn = $.GetContextPanel().FindChildInLayoutFile('SkillGroupExpand');
                    elToggleBtn.visible = false;
                }
            }
            else {
                SetAllSkillGroups();
            }
            if (_m_bShownInFriendsList) {
                $.GetContextPanel().FindChildInLayoutFile('JsPlayerCommendations').AddClass('hidden');
                $.GetContextPanel().FindChildInLayoutFile('JsPlayerPrime').AddClass('hidden');
                _SetTeam();
            }
            else {
                let bHasNoCommendsToShow = _SetCommendations();
                _SetPrime(bHasNoCommendsToShow);
            }
        }
    }
    function ProfileUpdated(xuid) {
        if (_m_xuid === xuid)
            FillOutFriendCard();
    }
    function UpdateName() {
        $.GetContextPanel().SetDialogVariable('xuid', _m_xuid);
    }
    function _SetHonorIcon() {
        const elHonorIcon = $.GetContextPanel().FindChildInLayoutFile('jsHonorIcon');
        if (elHonorIcon)
            elHonorIcon.Set(FriendsListAPI.GetFriendXpTrailLevel(_m_xuid), false);
    }
    function _SetAvatar() {
        let elAvatarExisting = $.GetContextPanel().FindChildInLayoutFile('JsPlayerCardAvatar');
        if (!elAvatarExisting) {
            let elParent = $.GetContextPanel().FindChildInLayoutFile('JsPlayerCardTop');
            let elAvatar = $.CreatePanel("Panel", elParent, 'JsPlayerCardAvatar');
            elAvatar.SetAttributeString('xuid', _m_xuid);
            elAvatar.BLoadLayout('file://{resources}/layout/avatar.xml', false, false);
            elAvatar.BLoadLayoutSnippet("AvatarPlayerCard");
            Avatar.Init(elAvatar, _m_xuid, 'playercard');
            elParent.MoveChildBefore(elAvatar, $.GetContextPanel().FindChildInLayoutFile('JsPlayerCardName'));
        }
        else {
            Avatar.Init(elAvatarExisting, _m_xuid, 'playercard');
        }
    }
    function _SetPlayerBackground() {
        let flairDefIdx = FriendsListAPI.GetFriendDisplayItemDefFeatured(_m_xuid);
        let flairItemId = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(flairDefIdx, 0);
        let imagePath = InventoryAPI.GetItemInventoryImage(flairItemId);
        let elBgImage = $.GetContextPanel().FindChildInLayoutFile('AnimBackground');
        elBgImage.style.backgroundImage = (imagePath) ? 'url("file://{images}' + imagePath + '.png")' : 'none';
        elBgImage.style.backgroundPosition = '50% 50%';
        elBgImage.style.backgroundSize = 'auto 165%';
        elBgImage.style.backgroundRepeat = 'no-repeat';
        elBgImage.style.blur = 'gaussian(2,2,1)';
        elBgImage.AddClass('player-card-bg-anim');
    }
    function _SetRank() {
        let elRank = $.GetContextPanel().FindChildInLayoutFile('JsPlayerXp');
        if (!MyPersonaAPI.IsInventoryValid() || !_m_currentLvl || (!_HasXpProgressToFreeze() && !_IsPlayerPrime())) {
            elRank.AddClass('hidden');
            return;
        }
        if (!_IsPlayerPrime() && !_m_isSelf) {
            elRank.AddClass('hidden');
            return;
        }
        let bHasRankToFreezeButNoPrestige = (_m_ShowLockedRankSkillGroupState) ? true : false;
        let currentPoints = FriendsListAPI.GetFriendXp(_m_xuid), pointsPerLevel = MyPersonaAPI.GetXpPerLevel();
        let elXpBarInner = $.GetContextPanel().FindChildInLayoutFile('JsPlayerXpBarInner');
        if (bHasRankToFreezeButNoPrestige) {
            elXpBarInner.GetParent().visible = false;
        }
        else {
            let percentComplete = (currentPoints / pointsPerLevel) * 100;
            elXpBarInner.style.width = percentComplete + '%';
            elXpBarInner.GetParent().visible = true;
        }
        if (_m_isSelf) {
            const xpBonuses = MyPersonaAPI.GetActiveXpBonuses();
            const bEligibleForCarePackage = xpBonuses.split(',').includes('2');
            $.GetContextPanel().SetHasClass('care-package-eligible', bEligibleForCarePackage);
        }
        let elRankText = $.GetContextPanel().FindChildInLayoutFile('JsPlayerRankName');
        elRankText.SetHasClass('player-card-prime-text', bHasRankToFreezeButNoPrestige);
        elRank.SetHasClass('player-card-nonprime-locked-xp-row', bHasRankToFreezeButNoPrestige);
        if (bHasRankToFreezeButNoPrestige) {
            elRankText.text = $.Localize('#Xp_RankName_Locked');
        }
        else {
            elRankText.SetDialogVariable('name', $.Localize('#SFUI_XP_RankName_' + _m_currentLvl));
            elRankText.SetDialogVariableInt('level', _m_currentLvl);
        }
        let elRankIcon = $.GetContextPanel().FindChildInLayoutFile('JsPlayerXpIcon');
        elRankIcon.SetImage('file://{images}/icons/xp/level' + _m_currentLvl + '.png');
        elRank.RemoveClass('hidden');
        let bPrestigeAvailable = _m_isSelf && (_m_currentLvl >= InventoryAPI.GetMaxLevel());
        $.GetContextPanel().FindChildInLayoutFile('GetPrestigeButton').SetHasClass('hidden', !bPrestigeAvailable);
        if (bPrestigeAvailable) {
            $.GetContextPanel().FindChildInLayoutFile('GetPrestigeButtonClickable').SetPanelEvent('onactivate', _OnActivateGetPrestigeButtonClickable);
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
    function SetAllSkillGroups() {
        let elSkillGroupContainer = $.GetContextPanel().FindChildInLayoutFile('JsPlayerCardSkillGroupContainer');
        if (!_HasXpProgressToFreeze() && !_IsPlayerPrime()) {
            elSkillGroupContainer.AddClass('hidden');
            return;
        }
        _SetSkillGroup('Premier');
        _m_arrAdditionalSkillGroups.forEach(type => _SetSkillGroup(type));
        elSkillGroupContainer.RemoveClass('hidden');
    }
    function _SetSkillGroup(type) {
        _UpdateSkillGroup(_LoadSkillGroupSnippet(type), type);
    }
    function _LoadSkillGroupSnippet(type) {
        let id = 'JsPlayerCardSkillGroup-' + type;
        let elParent = $.GetContextPanel().FindChildInLayoutFile('SkillGroupContainer');
        let elSkillGroup = elParent.FindChildInLayoutFile(id);
        if (!elSkillGroup) {
            elSkillGroup = $.CreatePanel("Panel", elParent, id);
            elSkillGroup.BLoadLayoutSnippet('PlayerCardRatingEmblem');
            _ShowOtherRanksByDefault(elSkillGroup, type);
        }
        return elSkillGroup;
    }
    function _ShowOtherRanksByDefault(elSkillGroup, type) {
        let elToggleBtn = $.GetContextPanel().FindChildInLayoutFile('SkillGroupExpand');
        if (type !== 'Competitive' && _m_bShownInFriendsList) {
            elSkillGroup.AddClass('collapsed');
            return;
        }
        elToggleBtn.visible = _m_bShownInFriendsList ? true : false;
        if (!_m_bShownInFriendsList && _m_isSelf) {
            _AskForLocalPlayersAdditionalSkillGroups();
        }
    }
    function _AskForLocalPlayersAdditionalSkillGroups() {
        let hintLoadSkillGroups = '';
        for (let type of _m_arrAdditionalSkillGroups) {
            if (FriendsListAPI.GetFriendCompetitiveRank(_m_xuid, type) === -1) {
                hintLoadSkillGroups += (hintLoadSkillGroups ? ',' : '') + type;
            }
        }
        if (hintLoadSkillGroups) {
            MyPersonaAPI.HintLoadPipRanks(hintLoadSkillGroups);
        }
        _m_arrAdditionalSkillGroups.forEach(type => _SetSkillGroup(type));
    }
    function _UpdateSkillGroup(elSkillGroup, type) {
        const score = FriendsListAPI.GetFriendCompetitiveRank(_m_xuid, type);
        const wins = FriendsListAPI.GetFriendCompetitiveWins(_m_xuid, type);
        let options = {
            root_panel: elSkillGroup,
            rating_type: type,
            do_fx: true,
            full_details: true,
            leaderboard_details: { score: score, matchesWon: wins },
            local_player: _m_xuid === MyPersonaAPI.GetXuid()
        };
        let haveRating = RatingEmblem.SetXuid(options);
        let showRating = haveRating || MyPersonaAPI.GetXuid() === _m_xuid;
        elSkillGroup.SetHasClass('hidden', !showRating);
        elSkillGroup.SetDialogVariable('rating-text', RatingEmblem.GetRatingDesc(elSkillGroup));
        let skillGroupId = elSkillGroup.id;
        let tooltipText = RatingEmblem.GetTooltipText(elSkillGroup);
        elSkillGroup.SetPanelEvent('onmouseover', () => ShowSkillGroupTooltip(skillGroupId, tooltipText));
        elSkillGroup.SetPanelEvent('onmouseout', HideSkillGroupTooltip);
    }
    function _SetPrimeUpsell() {
        let elUpsellPanel = $.GetContextPanel().FindChildInLayoutFile('JsPlayerCardPrimeUpsell');
        elUpsellPanel.SetHasClass('hidden', !MyPersonaAPI.IsInventoryValid() || _IsPlayerPrime() || !_m_isSelf);
        elUpsellPanel.FindChildInLayoutFile("id-player-card-prime-upsell-xp").visible = !_HasXpProgressToFreeze() && !_IsPlayerPrime();
        elUpsellPanel.FindChildInLayoutFile("id-player-card-prime-upsell-skillgroup").visible = !_HasXpProgressToFreeze() && !_IsPlayerPrime();
    }
    function _SetCommendations() {
        let catagories = [
            { key: 'friendly', value: 0 },
            { key: 'teaching', value: 0 },
            { key: 'leader', value: 0 }
        ];
        let catagoriesCount = catagories.length;
        let countHiddenCommends = 0;
        let elCommendsBlock = $.GetContextPanel().FindChildInLayoutFile('JsPlayerCommendations');
        for (let i = 0; i < catagoriesCount; i++) {
            catagories[i].value = FriendsListAPI.GetFriendCommendations(_m_xuid, catagories[i].key);
            let elCommend = $.GetContextPanel().FindChildInLayoutFile('JsPlayer' + catagories[i].key);
            if (!catagories[i].value || catagories[i].value === 0) {
                elCommend.AddClass('hidden');
                countHiddenCommends++;
            }
            else {
                if (elCommendsBlock.BHasClass('hidden'))
                    elCommendsBlock.RemoveClass('hidden');
                elCommend.RemoveClass('hidden');
                elCommend.FindChild('JsCommendLabel').text = String(catagories[i].value);
            }
        }
        elCommendsBlock.SetHasClass('hidden', countHiddenCommends === catagoriesCount && !_IsPlayerPrime());
        return countHiddenCommends === catagoriesCount;
    }
    function _SetPrime(bHasNoCommendsToShow) {
        let elPrime = $.GetContextPanel().FindChildInLayoutFile('JsPlayerPrime');
        if (!MyPersonaAPI.IsInventoryValid())
            elPrime.AddClass('hidden');
        if (_IsPlayerPrime()) {
            elPrime.RemoveClass('hidden');
            elPrime.FindChildInLayoutFile('JsCommendLabel').visible = bHasNoCommendsToShow;
            return;
        }
        else
            elPrime.AddClass('hidden');
    }
    function _IsPlayerPrime() {
        return FriendsListAPI.GetFriendPrimeEligible(_m_xuid);
    }
    function _HasXpProgressToFreeze() {
        return MyPersonaAPI.HasPrestige() || MyPersonaAPI.GetCurrentLevel() > 2;
    }
    function _SetTeam() {
        if (!_m_isSelf)
            return;
        let teamName = MyPersonaAPI.GetMyOfficialTeamName(), tournamentName = MyPersonaAPI.GetMyOfficialTournamentName();
        if (!teamName || !tournamentName) {
            $.GetContextPanel().FindChildInLayoutFile('JsPlayerTeam').AddClass('hidden');
            return;
        }
        $.GetContextPanel().FindChildInLayoutFile('JsPlayerXp').AddClass('hidden');
        $.GetContextPanel().FindChildInLayoutFile('JsPlayerCardSkillGroupContainer').AddClass('hidden');
        $.GetContextPanel().FindChildInLayoutFile('JsPlayerTeam').RemoveClass('hidden');
        let teamTag = MyPersonaAPI.GetMyOfficialTeamTag();
        $.GetContextPanel().FindChildInLayoutFile('JsTeamIcon').SetImage('file://{images}/tournaments/teams/' + teamTag + '.svg');
        $.GetContextPanel().FindChildInLayoutFile('JsTeamLabel').text = teamName;
        $.GetContextPanel().FindChildInLayoutFile('JsTournamentLabel').text = tournamentName;
    }
    function _SetFlairItems() {
        let flairItems = FriendsListAPI.GetFriendDisplayItemDefCount(_m_xuid);
        let flairItemIdList = [];
        let elFlairPanal = $.GetContextPanel().FindChildInLayoutFile('FlairCarouselAndControls');
        if (!flairItems) {
            elFlairPanal.AddClass('hidden');
            return;
        }
        for (let i = 0; i < flairItems; i++) {
            let flairDefIdx = FriendsListAPI.GetFriendDisplayItemDefByIndex(_m_xuid, i);
            let flairItemId = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(flairDefIdx, 0);
            flairItemIdList.push(flairItemId);
        }
        $.GetContextPanel().FindChildInLayoutFile('FlairCarousel').RemoveAndDeleteChildren();
        _MakeFlairCarouselPages(flairItemIdList);
        elFlairPanal.RemoveClass('hidden');
    }
    function _MakeFlairCarouselPages(flairItemIdList) {
        let countFlairItems = flairItemIdList.length;
        let elFlairCarousel = $.GetContextPanel().FindChildInLayoutFile('FlairCarousel');
        let elCarouselPage = null;
        for (let i = 0; i < countFlairItems; i++) {
            if (i % 5 === 0) {
                elCarouselPage = $.CreatePanel('Panel', elFlairCarousel, '', { class: 'playercard-flair-carousel__page' });
            }
            function onMouseOver(flairItemId, idForTooltipLocaation) {
                let tooltipText = InventoryAPI.GetItemName(flairItemId);
                UiToolkitAPI.ShowTextTooltip(idForTooltipLocaation, tooltipText);
            }
            ;
            let imagePath = InventoryAPI.GetItemInventoryImage(flairItemIdList[i]);
            let panelName = _m_xuid + flairItemIdList[i];
            if (elCarouselPage) {
                if (imagePath !== '') {
                    let elFlair = $.CreatePanel('Image', elCarouselPage, panelName, {
                        class: 'playercard-flair__icon',
                        src: 'file://{images}' + imagePath + '_small.png',
                        scaling: 'stretch-to-fit-preserve-aspect'
                    });
                    let flairItemId = flairItemIdList[i];
                    elFlair.SetPanelEvent('onmouseover', () => onMouseOver(flairItemId, panelName));
                    elFlair.SetPanelEvent('onmouseout', () => UiToolkitAPI.HideTextTooltip());
                }
            }
        }
    }
    function ShowXpTooltip() {
        if (_m_ShowLockedRankSkillGroupState) {
            ShowSkillGroupTooltip('JsPlayerXpIcon', '#tooltip_xp_locked');
            return;
        }
        function ShowTooltip() {
            _m_tooltipDelayHandle = null;
            if (!_m_isSelf)
                return;
            if (_m_currentLvl && _m_currentLvl > 0)
                UiToolkitAPI.ShowCustomLayoutParametersTooltip('JsPlayerXpIcon', 'XpToolTip', 'file://{resources}/layout/tooltips/tooltip_player_xp.xml', 'xuid=' + _m_xuid);
        }
        ;
        _m_tooltipDelayHandle = $.Schedule(0.3, ShowTooltip);
    }
    PlayerCard.ShowXpTooltip = ShowXpTooltip;
    function HideXpTooltip() {
        if (_m_ShowLockedRankSkillGroupState) {
            HideSkillGroupTooltip();
            return;
        }
        if (_m_tooltipDelayHandle) {
            $.CancelScheduled(_m_tooltipDelayHandle);
            _m_tooltipDelayHandle = null;
        }
        UiToolkitAPI.HideCustomLayoutTooltip('XpToolTip');
    }
    PlayerCard.HideXpTooltip = HideXpTooltip;
    function ShowSkillGroupTooltip(id, tooltipText) {
        function ShowTooltipSkill() {
            _m_tooltipDelayHandle = null;
            UiToolkitAPI.ShowTextTooltip(id, tooltipText);
        }
        ;
        _m_tooltipDelayHandle = $.Schedule(0.3, ShowTooltipSkill);
    }
    function HideSkillGroupTooltip() {
        if (_m_tooltipDelayHandle) {
            $.CancelScheduled(_m_tooltipDelayHandle);
            _m_tooltipDelayHandle = null;
        }
        UiToolkitAPI.HideTextTooltip();
    }
    function UpdateAvatar() {
        _SetAvatar();
        _SetPlayerBackground();
        _SetFlairItems();
        _SetPrimeUpsell();
        _SetRank();
    }
    function ShowHideAdditionalRanks() {
        let elToggleBtn = $.GetContextPanel().FindChildInLayoutFile('SkillGroupExpand');
        if (elToggleBtn.checked) {
            _AskForLocalPlayersAdditionalSkillGroups();
        }
        for (let type of _m_arrAdditionalSkillGroups) {
            $.GetContextPanel().FindChildInLayoutFile('JsPlayerCardSkillGroup-' + type).SetHasClass('collapsed', !elToggleBtn.checked);
        }
    }
    PlayerCard.ShowHideAdditionalRanks = ShowHideAdditionalRanks;
    function FriendsListUpdateName(xuid) {
        if (xuid === _m_xuid) {
            UpdateName();
        }
    }
    {
        if ($.DbgIsReloadingScript()) {
        }
        Init();
        $.RegisterForUnhandledEvent('PanoramaComponent_GC_Hello', FillOutFriendCard);
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_NameChanged', UpdateName);
        $.RegisterForUnhandledEvent('PanoramaComponent_FriendsList_ProfileUpdated', ProfileUpdated);
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_PipRankUpdate', SetAllSkillGroups);
        $.RegisterForUnhandledEvent("PanoramaComponent_Lobby_PlayerUpdated", UpdateAvatar);
        $.RegisterForUnhandledEvent('PanoramaComponent_FriendsList_NameChanged', FriendsListUpdateName);
    }
})(PlayerCard || (PlayerCard = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxheWVyY2FyZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3BsYXllcmNhcmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUNsQyw4Q0FBOEM7QUFDOUMseUNBQXlDO0FBQ3pDLHNDQUFzQztBQUN0QyxrQ0FBa0M7QUFFbEMsSUFBVSxVQUFVLENBMHBCbkI7QUExcEJELFdBQVUsVUFBVTtJQUVuQixJQUFJLE9BQU8sR0FBRyxFQUFFLENBQUM7SUFDakIsSUFBSSxhQUFhLEdBQWtCLElBQUksQ0FBQztJQUN4QyxJQUFJLFNBQVMsR0FBRyxLQUFLLENBQUM7SUFDdEIsSUFBSSxzQkFBc0IsR0FBRyxLQUFLLENBQUM7SUFDbkMsSUFBSSxxQkFBcUIsR0FBZSxJQUFJLENBQUM7SUFDN0MsSUFBSSwyQkFBMkIsR0FBRyxDQUFFLFNBQVMsQ0FBRSxDQUFDO0lBQ2hELElBQUksMEJBQTBCLEdBQWtCLElBQUksQ0FBQztJQUNyRCxJQUFJLGdDQUFnQyxHQUFHLEtBQUssQ0FBQztJQUM3QyxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUM7SUFFaEMsU0FBUyxJQUFJO1FBRVosT0FBTyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxNQUFNLEVBQUUsZUFBZSxDQUFFLENBQUM7UUFDNUUsU0FBUyxHQUFHLE9BQU8sS0FBSyxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1FBQzlELHNCQUFzQixHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxXQUFXLEVBQUUsRUFBRSxDQUFFLEtBQUssRUFBRSxDQUFDO1FBRXhGLENBQUMsQ0FBQyxpQkFBaUIsQ0FBa0MsQ0FBQyxtQkFBbUIsQ0FBRSxPQUFPLENBQUUsQ0FB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