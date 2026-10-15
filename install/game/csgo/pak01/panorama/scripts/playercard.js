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
        _m_InventoryUpdatedHandler = $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', OnPlayerUpdatedOrInventoryUpdated);
        _m_cp.RegisterForReadyEvents(true);
        $.RegisterEventHandler('ReadyForDisplay', _m_cp, () => {
            if (!_m_InventoryUpdatedHandler) {
                _m_InventoryUpdatedHandler = $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', OnPlayerUpdatedOrInventoryUpdated);
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
            OnPlayerUpdatedOrInventoryUpdated();
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
    function OnPlayerUpdatedOrInventoryUpdated() {
        _SetHonorIcon();
        _SetAvatar();
        _SetFlairItems();
        _SetPlayerBackground();
        _SetRank();
        _SetPrimeUpsell();
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
        $.RegisterForUnhandledEvent("PanoramaComponent_Lobby_PlayerUpdated", OnPlayerUpdatedOrInventoryUpdated);
    }
})(PlayerCard || (PlayerCard = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxheWVyY2FyZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3BsYXllcmNhcmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUNsQyw4Q0FBOEM7QUFDOUMseUNBQXlDO0FBQ3pDLGtDQUFrQztBQUVsQyxJQUFVLFVBQVUsQ0E4b0JuQjtBQTlvQkQsV0FBVSxVQUFVO0lBRW5CLElBQUksT0FBTyxHQUFHLEVBQUUsQ0FBQztJQUNqQixJQUFJLGFBQWEsR0FBa0IsSUFBSSxDQUFDO0lBQ3hDLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQztJQUN0QixJQUFJLHNCQUFzQixHQUFHLEtBQUssQ0FBQztJQUNuQyxJQUFJLHFCQUFxQixHQUFlLElBQUksQ0FBQztJQUM3QyxJQUFJLDJCQUEyQixHQUFHLENBQUUsU0FBUyxDQUFFLENBQUM7SUFDaEQsSUFBSSwwQkFBMEIsR0FBa0IsSUFBSSxDQUFDO0lBQ3JELElBQUksZ0NBQWdDLEdBQUcsS0FBSyxDQUFDO0lBQzdDLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztJQUVoQyxTQUFTLElBQUk7UUFFWixPQUFPLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGtCQUFrQixDQUFFLE1BQU0sRUFBRSxlQUFlLENBQUUsQ0FBQztRQUM1RSxTQUFTLEdBQUcsT0FBTyxLQUFLLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7UUFDOUQsc0JBQXNCLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGtCQUFrQixDQUFFLFdBQVcsRUFBRSxFQUFFLENBQUUsS0FBSyxFQUFFLENBQUM7UUFFeEYsQ0FBQyxDQUFDLGlCQUFpQixDQUFrQyxDQUFDLG1CQUFtQixDQUFFLE9BQU8sQ0FBRSxDQUFDO1FBRXZGLDJCQUEy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