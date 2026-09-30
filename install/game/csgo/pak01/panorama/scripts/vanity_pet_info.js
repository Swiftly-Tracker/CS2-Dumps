"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="avatar.ts" />
/// <reference path="common/sessionutil.ts" />
/// <reference path="mock_adapter.ts" />
/// <reference path="rating_emblem.ts" />
var VanityPetInfo;
(function (VanityPetInfo) {
    // Null when the camera is pulled back.
    let _m_zoomedPetId = null;
    VanityPetInfo._m_idPrefix = "id-mainmenu-pet-info";
    let _m_infoPanel;
    let _m_textEntry;
    // let _m_elTimer:Panel_t;
    let _m_petId;
    let _m_scheduleEggTimerHandle;
    let _m_focusEventHandler;
    let _m_oldName = '';
    _m_scheduleEggTimerHandle = null;
    function CreateOrUpdatePetInfoPanel(elParent, petItemId) {
        let newPanel = elParent.FindChildInLayoutFile(VanityPetInfo._m_idPrefix);
        if (!petItemId || Number(petItemId) === 0) {
            // Hide info panel
            RemovePanel(elParent);
            return null;
        }
        if (!newPanel) {
            newPanel = $.CreatePanel('Panel', elParent, VanityPetInfo._m_idPrefix);
            newPanel.BLoadLayout('file://{resources}/layout/vanity_pet_info.xml', false, false);
        }
        _m_petId = petItemId;
        let nPetUpgradeLevel = Number(InventoryAPI.GetItemAttributeValue(petItemId, '{uint32}upgrade level'));
        newPanel.SetHasClass('is-grown', nPetUpgradeLevel > 1);
        newPanel.SetHasClass('show', true);
        _m_infoPanel = newPanel;
        // _m_elTimer = newPanel.FindChildInLayoutFile( 'id-pet-milestone-egg' );
        _m_textEntry = newPanel.FindChildInLayoutFile('id-name-input-text');
        _m_textEntry.SetMaxChars(20);
        if (!_m_focusEventHandler) {
            _m_focusEventHandler = true;
            $.RegisterEventHandler('InputFocusLost', _m_textEntry, () => {
                if (newPanel.BHasClass('text-entry-active')) {
                    _CloseTextEntry();
                    newPanel.SetHasClass('hover-show', false);
                }
            });
        }
        // Pet can only be renamed once per life stage
        const bCanRenameThisLifeStage = (nPetUpgradeLevel >= 1) && !InventoryAPI.GetItemAttributeValue(petItemId, '{bytestring}custom name attr'
            + ((nPetUpgradeLevel >= 2) ? ' ' + nPetUpgradeLevel : ''));
        _SetButtonEvents(newPanel, petItemId, nPetUpgradeLevel, bCanRenameThisLifeStage);
        _HoverEvents(newPanel, nPetUpgradeLevel);
        _ShowFoodHint(newPanel, petItemId);
        let petName = InventoryAPI.GetItemName(petItemId);
        let elPetName = newPanel.FindChildInLayoutFile('id-pet-name');
        if (petItemId !== '' && petItemId !== undefined) {
            newPanel.SetDialogVariable('pet_name', InventoryAPI.HasCustomName(petItemId) ? petName : "");
            elPetName.SetHasClass('has-name', InventoryAPI.HasCustomName(petItemId));
            if (_m_oldName !== petName) {
                _m_oldName = petName;
                elPetName.TriggerClass('name-update');
                _CloseTextEntry();
            }
        }
        return newPanel;
    }
    VanityPetInfo.CreateOrUpdatePetInfoPanel = CreateOrUpdatePetInfoPanel;
    function RemovePanel(elParent) {
        let elPanel = elParent.FindChildInLayoutFile(VanityPetInfo._m_idPrefix);
        if (elPanel && elPanel.IsValid()) {
            CancelEggTimer();
            elPanel.RemoveClass('show');
        }
    }
    VanityPetInfo.RemovePanel = RemovePanel;
    function _RoundToPixel(context, value, axis) {
        const scale = axis === "x" ? context.actualuiscale_x : context.actualuiscale_y;
        return Math.round(value * scale) / scale;
    }
    function SetVanityPetInfoPos(elParent, oPos) {
        let elPanel = elParent.FindChildInLayoutFile("id-mainmenu-pet-info");
        if (!elPanel || !elPanel.IsValid()) {
            return;
        }
        elPanel.style.transform = 'translate3d( ' + _RoundToPixel(elParent, oPos.x, "x") + 'px, ' + _RoundToPixel(elParent, oPos.y, "y") + 'px, 0px );';
    }
    VanityPetInfo.SetVanityPetInfoPos = SetVanityPetInfoPos;
    function _HoverEvents(elPanel, nPetUpgradeLevel) {
        let elHoverTarget = elPanel.FindChild('id-vanity-pet-hitbox');
        elHoverTarget.SetPanelEvent('onmouseover', () => {
            if (!SessionUtil.BCanUseMyPetInCurrentLobby()) {
                return;
            }
            if (!InventoryAPI.GetPetItemID()) {
                return; // my pet was alive, but expired in the middle of this game session, prevent toolbar from coming up
            }
            _UpdateProgressBars(nPetUpgradeLevel);
            _ShowFoodHint(elPanel, InventoryAPI.GetPetItemID());
            elPanel.SetHasClass('hover-show', true);
        });
        elPanel.SetPanelEvent('onmouseout', () => {
            // CancelEggTimer();
            // Stays up while a name is being typed, so moving the mouse off does not take the text entry
            // with it. Closing that is InputFocusLost's job.
            elPanel.SetHasClass('hover-show', elPanel.BHasClass('text-entry-active'));
        });
    }
    function _SetButtonEvents(elPanel, petId, nPetUpgradeLevel, bCanRenameThisLifeStage) {
        // inspect		
        elPanel.FindChildInLayoutFile('id-inspect-pet').SetPanelEvent('onactivate', () => {
            $.DispatchEvent("InventoryItemPreview", petId, '');
        });
        // nametag	
        let elNameTag = elPanel.FindChildInLayoutFile('id-name-pet');
        if (bCanRenameThisLifeStage) {
            elNameTag.SetPanelEvent('onactivate', () => {
                _m_textEntry.text = _nameWithQuotes(petId);
                _m_textEntry.SetFocus();
                elPanel.SetHasClass('text-entry-active', true);
                $.DispatchEvent('CSGOPlaySoundEffect', 'sidemenu_slidein', 'MOUSE');
            });
        }
        elNameTag.SetHasClass('hide', !bCanRenameThisLifeStage);
        // A pet carrying a name from an earlier life stage is being renamed, not named.
        elNameTag.SetPanelEvent('onmouseover', () => {
            UiToolkitAPI.ShowTextTooltip('id-name-pet', InventoryAPI.HasCustomName(petId) ? '#pet_tooltip_rename' : '#pet_tooltip_name');
        });
        let elPhotoBooth = elPanel.FindChildInLayoutFile('id-photo-booth');
        elPhotoBooth.SetPanelEvent('onactivate', () => { _OpenPhotoBooth(nPetUpgradeLevel); });
        elPhotoBooth.SetHasClass('hide', nPetUpgradeLevel < 1);
        // picture book - hidden until the bird hatches, same gate the photo booth uses. Nothing can go
        // in the book before there is a chick to photograph.
        let elPetBook = elPanel.FindChildInLayoutFile('id-pet-book');
        elPetBook.SetPanelEvent('onactivate', _OpenPetBook);
        elPetBook.SetHasClass('hide', nPetUpgradeLevel < 1);
        elPanel.FindChildInLayoutFile('id-name-input-text-cancel').SetPanelEvent('onactivate', CancelTextEntry);
        elPanel.FindChildInLayoutFile('id-name-input-text-submit').SetPanelEvent('onactivate', () => { _SubmitText(petId); });
        elPanel.FindChildInLayoutFile('id-name-input-text-back').SetPanelEvent('onactivate', _CloseTextEntry);
        _EnableDisableSubmitButton(false);
    }
    function CancelTextEntry() {
        if (_m_infoPanel !== null && _m_infoPanel.IsValid())
            _m_textEntry.text = '';
    }
    VanityPetInfo.CancelTextEntry = CancelTextEntry;
    function _SubmitText(petId) {
        const fauxNameTag = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(1200, 0); // "Name Tag"
        InventoryAPI.UseTool(fauxNameTag, petId);
    }
    function _EnableDisableSubmitButton(bEnable) {
        if (_m_infoPanel !== null && _m_infoPanel.IsValid()) {
            _m_infoPanel.FindChildInLayoutFile('id-name-input-text-submit').enabled = (bEnable && _m_textEntry.text != _nameWithQuotes(_m_petId));
        }
    }
    function _CloseTextEntry() {
        $.DispatchEvent('CSGOPlaySoundEffect', 'sidemenu_slideout', 'MOUSE');
        _m_infoPanel.SetHasClass('text-entry-active', false);
    }
    function OnEntryChanged() {
        let isValid = InventoryAPI.SetNameToolString(_m_textEntry.text, '');
        _EnableDisableSubmitButton(isValid);
        $.DispatchEvent("CSGOPlaySoundEffect", "rename_teletype", "MOUSE");
    }
    VanityPetInfo.OnEntryChanged = OnEntryChanged;
    ;
    function _nameWithQuotes(petId) {
        let nameWithQuotes = InventoryAPI.GetItemName(petId);
        if (nameWithQuotes && nameWithQuotes.length > 4
            && nameWithQuotes[0] == "'" && nameWithQuotes[1] == "'"
            && nameWithQuotes[nameWithQuotes.length - 1] == "'" && nameWithQuotes[nameWithQuotes.length - 2] == "'") {
            return nameWithQuotes.substring(2, nameWithQuotes.length - 2);
        }
        else {
            return nameWithQuotes;
        }
    }
    function _BPetNeedsFood(petItemId) {
        const nPetUpgradeLevel = Number(InventoryAPI.GetItemAttributeValue(petItemId, '{uint32}upgrade level'));
        if (nPetUpgradeLevel < 1)
            return false;
        const rtFoodExp = Number(InventoryAPI.GetItemAttributeValue(petItemId, '{uint32}pet food expiration date'));
        const rtPetUpgr = Number(InventoryAPI.GetItemAttributeValue(petItemId, '{uint32}pet next upgrade date'));
        return !!(rtFoodExp && rtPetUpgr && (rtFoodExp < rtPetUpgr));
    }
    function _ShowFoodHint(elPanel, petItemId) {
        const bLowFood = InventoryAPI.IsPetLowOnFood(petItemId);
        const bNeedsFood = _BPetNeedsFood(petItemId);
        elPanel.SetHasClass('low-food', bLowFood);
        elPanel.SetHasClass('needs-food', bNeedsFood);
        if (!bLowFood && !bNeedsFood)
            return;
        const elWarning = elPanel.FindChildInLayoutFile('id-pet-food-warning');
        const elIcon = elPanel.FindChildInLayoutFile('id-pet-food-warning-icon');
        const elLabel = elPanel.FindChildInLayoutFile('id-pet-food-warning-label');
        elIcon.SetImage(bLowFood ? 'file://{images}/icons/ui/warning.svg' : 'file://{images}/icons/ui/pet_feed.svg');
        const szHint = bLowFood ? '#pet_low_food_hint' : '#pet_needs_food_hint';
        if (InventoryAPI.HasCustomName(petItemId)) {
            elWarning.SetDialogVariable('name', _nameWithQuotes(petItemId));
            elLabel.text = $.Localize(szHint + '_name', elWarning);
            return;
        }
        elLabel.text = $.Localize(szHint);
    }
    // _BCanUsePet is the gate _HoverEvents uses to reveal the action row, so failing it leaves the
    // zoom-out button collapsed.
    function BShouldKeepZoom(petItemIdOnScreen) {
        return SessionUtil.BCanUseMyPetInCurrentLobby() && _m_zoomedPetId === petItemIdOnScreen;
    }
    VanityPetInfo.BShouldKeepZoom = BShouldKeepZoom;
    function SetZoomBtns(elMapPanel, elPanel, petItemId) {
        let elZoomInBtn = elPanel.FindChildInLayoutFile('id-zoom-in-pet');
        elZoomInBtn.SetPanelEvent('onactivate', () => {
            elMapPanel.TransitionToCamera('cam_pet', 1);
            $.DispatchEvent('CSGOPlaySoundEffect', 'Chicken.Vanity.ZoomIn', 'MOUSE');
            elMapPanel.SetParallaxOffset(elMapPanel.Data().parallax_zoomed);
            _m_zoomedPetId = petItemId;
            elPanel.TriggerClass('hide-during-zoom');
            elPanel.SetHasClass('is-zoomed', true);
        });
        let elZoomOutBtn = elPanel.FindChildInLayoutFile('id-zoom-out-pet');
        elZoomOutBtn.SetPanelEvent('onactivate', () => {
            elMapPanel.TransitionToCamera('cam_default', 1);
            $.DispatchEvent('CSGOPlaySoundEffect', 'Chicken.Vanity.ZoomOut', 'MOUSE');
            elMapPanel.SetParallaxOffset(elMapPanel.Data().parallax_unzoomed);
            _m_zoomedPetId = null;
            elPanel.SetHasClass('is-zoomed', false);
            elPanel.TriggerClass('hide-during-zoom');
        });
        // Restores the class when the panel is rebuilt for a pet that is already zoomed.
        elPanel.SetHasClass('is-zoomed', _m_zoomedPetId === petItemId);
    }
    VanityPetInfo.SetZoomBtns = SetZoomBtns;
    function ResetPetZoom(elMapPanel) {
        if (_m_zoomedPetId === null) {
            return;
        }
        // Silent on purpose: a 0s snap with no visible move, and it fires while navigating away.
        elMapPanel.TransitionToCamera('cam_default', 0);
        elMapPanel.SetParallaxOffset(elMapPanel.Data().parallax_unzoomed);
        _m_zoomedPetId = null;
        // Hidden along with its pet by now, so the camera reset above cannot depend on it.
        if (_m_infoPanel && _m_infoPanel.IsValid()) {
            _m_infoPanel.SetHasClass('is-zoomed', false);
        }
    }
    VanityPetInfo.ResetPetZoom = ResetPetZoom;
    // function _SetUpEggTimer( nPetUpgradeLevel: number, newPanel:Panel_t )
    // {
    // 	_m_elTimer = newPanel.FindChildInLayoutFile( 'id-pet-milestone-egg' );
    // 	_m_elTimer.SetPanelEvent( 'onmouseover', ()=>{
    // 		_m_elTimer.visible = true;
    // 		UiToolkitAPI.ShowTextTooltip( 'id-pet-clock', '#tooltip_pet_egg' );
    // 	});
    // 	_m_elTimer.SetPanelEvent( 'onmouseout', ()=>{
    // 		_m_elTimer.visible = false;
    // 		UiToolkitAPI.HideTextTooltip();
    // 	});
    // }
    // export function StartEggTimer()
    // {
    // 	if( !_m_elTimer || !_m_elTimer.IsValid() )
    // 	{
    // 		CancelEggTimer();
    // 		return;
    // 	}
    // 	CancelEggTimer();
    // 	let nGrowth =  InventoryAPI.GetPetGrowthPercent( _m_petId );
    // 	// $.Msg( 'eggtimer: ' + nGrowth );
    // 	const nDegrees = Math.floor( nGrowth * 360 );
    // 	(_m_elTimer.FindChild('id-pet-progress-bar-eg') as Panel_t).style.clip = 'radial(50% 50%, 0deg, ' + nDegrees + 'deg)';
    // 	if( !_m_scheduleEggTimerHandle )
    // 	{
    // 		_m_scheduleEggTimerHandle = $.Schedule( 10, StartEggTimer );
    // 	}
    // }
    function CancelEggTimer() {
        if (_m_scheduleEggTimerHandle) {
            // $.Msg( 'eggtimerCANCEL' );
            $.CancelScheduled(_m_scheduleEggTimerHandle);
            _m_scheduleEggTimerHandle = null;
        }
    }
    VanityPetInfo.CancelEggTimer = CancelEggTimer;
    function _UpdateProgressBars(nPetUpgradeLevel) {
        function _UpdateProgressMeter(idMeter, nLevelValue, flFillRatio) {
            const elProgress = _m_infoPanel.FindChildInLayoutFile(idMeter);
            const nGrowth = (nPetUpgradeLevel < nLevelValue) ? 0
                : (nPetUpgradeLevel < nLevelValue + 1) ? flFillRatio
                    : 1;
            UpdateRadialProgressBar(elProgress, nGrowth, nPetUpgradeLevel === nLevelValue, nPetUpgradeLevel > nLevelValue);
        }
        // egg
        _UpdateProgressMeter('id-pet-milestone-egg', 0, InventoryAPI.GetPetGrowthPercent(_m_petId));
        // life stages. Whether the row is shown at all while the pet waits on feed is decided by
        // _ShowFoodHint through the needs-food class, so the meters always reflect real growth here.
        const flLifeStageMeter = 1 - InventoryAPI.GetPetLifetimeRemaining(_m_petId);
        _UpdateProgressMeter('id-pet-milestone-chick', 1, flLifeStageMeter);
        _UpdateProgressMeter('id-pet-milestone-pullet', 2, flLifeStageMeter);
        _UpdateProgressMeter('id-pet-milestone-hen', 3, flLifeStageMeter);
    }
    function UpdateRadialProgressBar(elProgress, nGrowth, IsActive, isComplete) {
        const elRadial = elProgress.FindChild('id-pet-progress-timer');
        if (!nGrowth && nGrowth !== 0) {
            elRadial.style.clip = 'radial(50% 50%, 0deg, 0deg, deg)';
            return;
        }
        const nDegrees = isComplete ? 360 : Math.floor(nGrowth * 360);
        elRadial.style.clip = 'radial(50% 50%, 0deg, ' + nDegrees + 'deg)';
        elProgress.SetHasClass('active', IsActive);
        elProgress.SetHasClass('complete', isComplete);
    }
    function UpdateProgressBar(elProgress, nFeedEarned, IsActive, isComplete) {
        if ((!nFeedEarned && nFeedEarned !== 0))
            return;
        const aPips = elProgress.FindChild('id-pet-progress-bar')?.Children();
        aPips?.forEach((pip, idx) => {
            pip.SetHasClass('filled', ((nFeedEarned >= idx + 1 && IsActive) || isComplete));
        });
        elProgress.SetHasClass('active', IsActive);
        elProgress.SetHasClass('complete', isComplete);
    }
    function _OpenPetBook() {
        UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_pet_book.xml');
    }
    function _OpenPhotoBooth(nPetUpgradeLevel) {
        const OnClosePetEventNotification = UiToolkitAPI.RegisterJSCallback(() => { $.Msg('Close Photo Booth Callback'); });
        UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_pet_photobooth.xml', 'action-type=expire'
            + '&' + 'title=' + ''
            + '&' + 'msg=' + ''
            + '&' + 'pet_id=' + _m_petId
            + '&' + 'photo_booth=' + 'true'
            + '&' + 'upgrade_level=' + nPetUpgradeLevel
            + '&' + 'callback=' + OnClosePetEventNotification);
    }
    // export function DeleteVanityInfoPanel ( elParent: Panel_t, index: number ): void
    // {
    // 	const idPrefix = "id-player-vanity-info-" + index;
    // 	const elPanel = elParent.FindChildInLayoutFile( idPrefix );
    // 	if ( elPanel && elPanel.IsValid() )
    // 	{
    // 		elPanel.DeleteAsync( 0 );
    // 	}
    // }
    // function _RoundToPixel ( context: Panel_t, value: number, axis: "x" | "y" ): number
    // {
    // 	const scale = axis === "x" ? context.actualuiscale_x : context.actualuiscale_y;
    // 	return Math.round( value * scale ) / scale;
    // }
    // export function SetVanityInfoPanelPos ( elParent: Panel_t, index: number, oPos: Vector2D, idPrefix:string, OnlyXOrY?: "x" | "y" ): void
    // {
    // 	const elPanel = elParent.FindChildInLayoutFile( idPrefix );
    // 	if ( elPanel && elPanel.IsValid() )
    // 	{
    // 		switch ( OnlyXOrY )
    // 		{
    // 			case 'x':
    // 				elPanel.style.transform = 'translateX( ' + oPos.x + 'px );';
    // 				break;
    // 			case 'y':
    // 				elPanel.style.transform = 'translateY( ' + oPos.x + 'px );';
    // 				break;
    // 			default:
    // 				elPanel.style.transform = 'translate3d( ' + _RoundToPixel( elParent, oPos.x, "x" ) + 'px, ' + _RoundToPixel( elParent, oPos.y, "y" ) + 'px, 0px );';
    // 				break;
    // 		}
    // 	}
    // }
    // // individual elements
    // function _SetName ( newPanel: Panel_t, xuid: string ): void
    // {
    // 	const name = MockAdapter.IsFakePlayer( xuid )
    // 		? MockAdapter.GetPlayerName( xuid )
    // 		: FriendsListAPI.GetFriendName( xuid );
    // 	newPanel.SetDialogVariable( 'player_name', name );
    // }
    // function _SetAvatar ( newPanel: Panel_t, xuid: string ): void
    // {
    // 	const elParent = newPanel.FindChildInLayoutFile( 'vanity-avatar-container' );
    // 	let elAvatar = elParent.FindChildInLayoutFile( 'JsPlayerVanityAvatar-' + xuid );
    // 	if ( !elAvatar )
    // 	{
    // 		elAvatar = $.CreatePanel( "Panel", elParent, 'JsPlayerVanityAvatar-' + xuid );
    // 		elAvatar.SetAttributeString( 'xuid', xuid );
    // 		elAvatar.BLoadLayout( 'file://{resources}/layout/avatar.xml', false, false );
    // 		elAvatar.BLoadLayoutSnippet( "AvatarPlayerCard" );
    // 		elAvatar.AddClass( 'avatar--vanity' );
    // 	}
    // 	Avatar.Init( elAvatar, xuid, 'partymember' );
    // 	if ( MockAdapter.IsFakePlayer( xuid ) )
    // 	{
    // 		const elAvatarImage = elAvatar.FindChildInLayoutFile( "JsAvatarImage" ) as CSGOAvatarImage_t;
    // 		elAvatarImage.PopulateFromPlayerSlot( MockAdapter.GetPlayerSlot( xuid ) );
    // 	}
    // }
    // function _SetRank ( newPanel: Panel_t, xuid: string, isLocalPlayer: boolean ): void
    // {
    // 	const elRankIcon = newPanel.FindChildInLayoutFile( 'vanity-xp-icon' ) as Image_t;
    // 	const elXpBarInner = newPanel.FindChildInLayoutFile( 'vanity-xp-bar-inner' );
    // 	if ( !isLocalPlayer || !MyPersonaAPI.IsInventoryValid() )
    // 	{
    // 		newPanel.FindChildInLayoutFile( 'vanity-xp-container' ).visible = false;
    // 		return;
    // 	}
    // 	newPanel.FindChildInLayoutFile( 'vanity-xp-container' ).visible = true;
    // 	const currentLvl = FriendsListAPI.GetFriendLevel( xuid );
    // 	if ( !MyPersonaAPI.IsInventoryValid() ||
    // 		!currentLvl ||
    // 		( !_HasXpProgressToFreeze() && !_IsPlayerPrime( xuid ) )
    // 	)
    // 	{
    // 		newPanel.AddClass( 'no-valid-xp' );
    // 		return;
    // 	}
    // 	const bHasRankToFreezeButNoPrestige = ( !_IsPlayerPrime( xuid ) && _HasXpProgressToFreeze() ) ? true : false;
    // 	const currentPoints = FriendsListAPI.GetFriendXp( xuid );
    // 	const pointsPerLevel = MyPersonaAPI.GetXpPerLevel();
    // 	// Set Xp bar and show.
    // 	if ( bHasRankToFreezeButNoPrestige )
    // 	{
    // 		elXpBarInner.GetParent().visible = false;
    // 	}
    // 	else
    // 	{
    // 		const percentComplete = ( currentPoints / pointsPerLevel ) * 100;
    // 		elXpBarInner.style.width = percentComplete + '%';
    // 		elXpBarInner.GetParent().visible = true;
    // 		_ShowPrestigeUpgrade( newPanel, xuid, isLocalPlayer );
    // 	}
    // 	// Set Xp rank image and show.
    // 	elRankIcon.SetImage( 'file://{images}/icons/xp/level' + currentLvl + '.png' );
    // 	newPanel.RemoveClass( 'no-valid-xp' );
    // }
    // function _SetSkillGroup ( newPanel: Panel_t, xuid: string, isLocalPlayer: boolean ): void
    // {
    // 	let rating_type;
    // 	let score;
    // 	let wins;
    // 	if ( isLocalPlayer && !PartyListAPI.IsPartySessionActive() )
    // 	{
    // 		rating_type = 'Premier' as SkillRatingType_t;
    // 		score = MyPersonaAPI.GetPipRankCount( rating_type );
    // 		wins = MyPersonaAPI.GetPipRankWins( rating_type );
    // 	}
    // 	else
    // 	{
    // 		rating_type = PartyListAPI.GetFriendCompetitiveRankType( xuid ) as SkillRatingType_t;
    // 		score = PartyListAPI.GetFriendCompetitiveRank( xuid );
    // 		wins = PartyListAPI.GetFriendCompetitiveWins( xuid );			
    // 	}
    // 	let options =
    // 	{
    // 		root_panel: newPanel,
    // 	//	xuid: xuid,
    // 	//	api: 'partylist' as SkillRatingSourceAPI_t,
    // 		do_fx: true,
    // 		full_details: false,
    // 		rating_type: rating_type,
    // 		leaderboard_details: { score: score, matchesWon: wins },
    // 		local_player: xuid === MyPersonaAPI.GetXuid()
    // 	};
    // 	RatingEmblem.SetXuid( options );
    // 	newPanel.SetDialogVariable( 'rating-text', RatingEmblem.GetRatingDesc( newPanel ) );
    // }
    // function _SetHonorIcon ( elPanel: Panel_t, xuid: string ): void
    // {
    // 	// honor icon
    // 	const honorIconOptions =
    // 	{
    // 		honor_icon_frame_panel: elPanel.FindChildTraverse( 'jsHonorIcon' ),
    // 		debug_xuid: xuid,
    // 		do_fx: true,
    // 		xptrail_value: PartyListAPI.GetFriendXpTrailLevel( xuid ),
    // 		prime_value: PartyListAPI.GetFriendPrimeEligible( xuid )
    // 	} as HonorIconOptions_t;
    // 	HonorIcon.SetOptions( honorIconOptions );
    // }
    // function _ShowPrestigeUpgrade(elPanel:Panel_t, xuid:string, isLocalPlayer:boolean )
    // {
    // 	let bPrestigeAvailable = isLocalPlayer && ( FriendsListAPI.GetFriendLevel( xuid ) >= InventoryAPI.GetMaxLevel() );
    // 	elPanel.FindChildInLayoutFile( 'vanity-xp-prestige' ).SetHasClass( 'hidden', !bPrestigeAvailable );
    // 	if ( bPrestigeAvailable )
    // 	{
    // 		elPanel.FindChildInLayoutFile( 'vanity-xp-prestige' ).SetPanelEvent(
    // 			'onactivate',
    // 			_OnActivateGetPrestigeButtonClickable
    // 		);
    // 	}
    // }
    // function _OnActivateGetPrestigeButtonClickable()
    // {
    // 	UiToolkitAPI.ShowCustomLayoutPopupParameters(
    // 		'',
    // 		'file://{resources}/layout/popups/popup_inventory_inspect.xml',
    // 		'itemid=' + '0' + 
    // 		'&' + 'asyncworkitemwarning=no' +
    // 		'&' + 'asyncworktype=prestigecheck'
    // 	);
    // }
    // export function UpdateVoiceIcon ( elAvatar: Panel_t, xuid: string ): void
    // {
    // 	Avatar.UpdateTalkingState( elAvatar, xuid );
    // }
    // function _HasXpProgressToFreeze (): boolean
    // {
    // 	return MyPersonaAPI.HasPrestige() || ( MyPersonaAPI.GetCurrentLevel() > 2 );
    // }
    // function _IsPlayerPrime ( xuid: string ): boolean
    // {
    // 	return FriendsListAPI.GetFriendPrimeEligible( xuid );
    // }
    // function _SetLobbyLeader ( elPanel: Panel_t, xuid: string )
    // {
    // 	elPanel.SetHasClass( 'is-not-leader', LobbyAPI.GetHostSteamID() !== xuid );
    // }
    // function _ShowSettingsBtn( elPanel: Panel_t, xuid :string )
    // {
    // 	elPanel.SetHasClass( "show-controls", MyPersonaAPI.GetXuid() === xuid );
    // }
    // function _AddOpenPlayerCardAction ( elPanel: Panel_t, xuid: string ): void
    // {
    // 	elPanel.SetPanelEvent( "onactivate", () =>
    // 	{
    // 		if ( xuid !== "0" )
    // 		{
    // 			const contextMenuPanel = UiToolkitAPI.ShowCustomLayoutContextMenuParametersDismissEvent(
    // 				'',
    // 				'',
    // 				'file://{resources}/layout/context_menus/context_menu_playercard.xml',
    // 				'xuid=' + xuid,
    // 				() => {}
    // 			);
    // 			contextMenuPanel.AddClass( "ContextMenu_NoArrow" );
    // 		}
    // 	} );
    // }
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        if ($.DbgIsReloadingScript()) {
            $.Msg("Vanity Pet reloaded\n ");
        }
    }
})(VanityPetInfo || (VanityPetInfo = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFuaXR5X3BldF9pbmZvLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvdmFuaXR5X3BldF9pbmZvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFDbEMsa0NBQWtDO0FBQ2xDLDhDQUE4QztBQUM5Qyx3Q0FBd0M7QUFDeEMseUNBQXlDO0FBWXpDLElBQVUsYUFBYSxDQThxQnRCO0FBOXFCRCxXQUFVLGFBQWE7SUFFdEIsdUNBQXVDO0lBQ3ZDLElBQUksY0FBYyxHQUFpQixJQUFJLENBQUM7SUFDM0IseUJBQVcsR0FBRyxzQkFBc0IsQ0FBQztJQUNsRCxJQUFJLFlBQW9CLENBQUM7SUFDekIsSUFBSSxZQUF3QixDQUFDO0lBQzdCLDBCQUEwQjtJQUMxQixJQUFJLFFBQWUsQ0FBQztJQUNwQixJQUFJLHlCQUF1QyxDQUFDO0lBQzVDLElBQUksb0JBQTZCLENBQUM7SUFDbEMsSUFBSSxVQUFVLEdBQVUsRUFBRSxDQUFDO0lBRTNCLHlCQUF5QixHQUFHLElBQUksQ0FBQztJQUVqQyxTQUFnQiwwQkFBMEIsQ0FBRyxRQUFpQixFQUFFLFNBQWlCO1FBRWhGLElBQUksUUFBUSxHQUFHLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBRSxjQUFBLFdBQVcsQ0FBRSxDQUFDO1FBRTdELElBQUssQ0FBQyxTQUFTLElBQUksTUFBTSxDQUFFLFNBQVMsQ0FBRSxLQUFLLENBQUMsRUFDNUM7WUFDQyxrQkFBa0I7WUFDbEIsV0FBVyxDQUFFLFFBQVEsQ0FBRSxDQUFDO1lBQ3hCLE9BQU8sSUFBSSxDQUFDO1NBQ1o7UUFFRCxJQUFJLENBQUMsUUFBUSxFQUNiO1lBQ0MsUUFBUSxHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxjQUFBLFdBQVcsQ0FBRSxDQUFDO1lBQzNELFFBQVEsQ0FBQyxXQUFXLENBQUUsK0NBQStDLEVBQUUsS0FBSyxFQUFF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