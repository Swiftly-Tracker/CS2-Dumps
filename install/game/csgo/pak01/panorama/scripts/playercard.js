"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/sessionutil.ts" />
/// <reference path="rating_emblem.ts" />
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
            const petId = InventoryAPI.GetPetItemID();
            const nStage = petId ? Number(InventoryAPI.GetItemAttributeValue(petId, '{uint32}upgrade level')) : 0;
            $.GetContextPanel().SetHasClass('pet-feed-eligible', bEligibleForCarePackage && !!petId && nStage > 0);
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
    {
        if ($.DbgIsReloadingScript()) {
        }
        Init();
        $.RegisterForUnhandledEvent('PanoramaComponent_GC_Hello', FillOutFriendCard);
        $.RegisterForUnhandledEvent('PanoramaComponent_FriendsList_ProfileUpdated', ProfileUpdated);
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_PipRankUpdate', SetAllSkillGroups);
        $.RegisterForUnhandledEvent("PanoramaComponent_Lobby_PlayerUpdated", UpdateAvatar);
    }
})(PlayerCard || (PlayerCard = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxheWVyY2FyZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3BsYXllcmNhcmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUNsQyw4Q0FBOEM7QUFDOUMseUNBQXlDO0FBQ3pDLGtDQUFrQztBQUVsQyxJQUFVLFVBQVUsQ0FrcEJuQjtBQWxwQkQsV0FBVSxVQUFVO0lBRW5CLElBQUksT0FBTyxHQUFHLEVBQUUsQ0FBQztJQUNqQixJQUFJLGFBQWEsR0FBa0IsSUFBSSxDQUFDO0lBQ3hDLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQztJQUN0QixJQUFJLHNCQUFzQixHQUFHLEtBQUssQ0FBQztJQUNuQyxJQUFJLHFCQUFxQixHQUFlLElBQUksQ0FBQztJQUM3QyxJQUFJLDJCQUEyQixHQUFHLENBQUUsU0FBUyxDQUFFLENBQUM7SUFDaEQsSUFBSSwwQkFBMEIsR0FBa0IsSUFBSSxDQUFDO0lBQ3JELElBQUksZ0NBQWdDLEdBQUcsS0FBSyxDQUFDO0lBQzdDLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztJQUVoQyxTQUFTLElBQUk7UUFFWixPQUFPLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGtCQUFrQixDQUFFLE1BQU0sRUFBRSxlQUFlLENBQUUsQ0FBQztRQUM1RSxTQUFTLEdBQUcsT0FBTyxLQUFLLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7UUFDOUQsc0JBQXNCLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGtCQUFrQixDQUFFLFdBQVcsRUFBRSxFQUFFLENBQUUsS0FBSyxFQUFFLENBQUM7UUFFeEYsQ0FBQyxDQUFDLGlCQUFpQixDQUFrQyxDQUFDLG1CQUFtQixDQUFFLE9BQU8sQ0FBRSxDQUFDO1FBRXZGLDJCQUEy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