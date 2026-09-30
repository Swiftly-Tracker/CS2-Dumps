"use strict";
/// <reference path="csgo.d.ts" />
var LoadingScreen;
(function (LoadingScreen) {
    const cvars = ['mp_roundtime', 'mp_fraglimit', 'mp_maxrounds'];
    const cvalues = ['0', '0', '0'];
    const MAX_SLIDES = 10;
    const SLIDE_DURATION = 4;
    let m_slideShowJob = null;
    let m_mapName = null;
    let m_numImageLoading = 0;
    function _Init() {
        $('#ProgressBar').value = 0;
        $('#LoadingScreenMapName').text = "";
        $('#LoadingScreenGameMode').SetLocString("#SFUI_LOADING");
        $('#LoadingScreenModeDesc').text = "";
        const elGameModeIcon = $('#LoadingScreenGameModeIcon');
        elGameModeIcon.visible = false;
        $('#LoadingScreenIcon').visible = false;
        const elSlideShow = $.GetContextPanel().FindChildTraverse('LoadingScreenSlideShow');
        elSlideShow.RemoveAndDeleteChildren();
        m_numImageLoading = 0;
        if (m_slideShowJob) {
            $.Msg('LoadingScreen.m_slideShowJob SET ' + m_slideShowJob);
            $.CancelScheduled(m_slideShowJob);
            m_slideShowJob = null;
        }
        m_mapName = null;
    }
    function _CreateSlide(n) {
        const suffix = n == 0 ? '' : '_' + n;
        // for the first image, use an image name with no index e..g de_dust.png
        const imagePath = 'file://{images}/map_icons/screenshots/1080p/' + m_mapName + suffix + '.png';
        if (!$.BImageFileExists(imagePath)) {
            //$.Msg( 'LoadingScreen: not found ' + imagePath );
            return false;
        }
        //$.Msg( 'LoadingScreen: found ' + imagePath );
        const elSlideShow = $.GetContextPanel().FindChildTraverse('LoadingScreenSlideShow');
        const elSlide = $.CreatePanel('Image', elSlideShow, 'slide_' + n);
        elSlide.BLoadLayoutSnippet('snippet-loadingscreen-slide');
        elSlide.SetImage(imagePath);
        elSlide.Data().imagePath = imagePath;
        elSlide.SwitchClass('viz', 'hide');
        // SET THE TITLE
        const titleToken = '#loadingscreen_title_' + m_mapName + suffix;
        let title = $.Localize(titleToken);
        if (title == titleToken)
            title = '';
        elSlide.SetDialogVariable('screenshot-title', title);
        m_numImageLoading++;
        $.RegisterEventHandler('ImageLoaded', elSlide, () => {
            $.Msg('LoadingScreen loaded image ' + imagePath);
            m_numImageLoading--;
            if (m_numImageLoading <= 0)
                _StartSlideShow();
        });
        $.RegisterEventHandler('ImageFailedLoad', elSlide, () => {
            $.Msg('LoadingScreen failed loaded image ' + imagePath);
            elSlide.DeleteAsync(0.0);
            m_numImageLoading--;
            if (m_numImageLoading <= 0)
                _StartSlideShow();
        });
        return true;
    }
    // gets called as soon as we have map information
    // Creates the slides, which start the slideshow when all have been found (or not)
    function _InitSlideShow() {
        if (m_slideShowJob)
            return;
        $.Msg('LoadingScreen.InitSlideShow');
        for (let n = 0; n < MAX_SLIDES; n++) {
            _CreateSlide(n);
            // Should we stop once we hit the first missing image?
        }
    }
    // gets called when the last image has succeeded or failed to load
    // in
    function _StartSlideShow() {
        $.Msg('LoadingScreen.StartSlideShow');
        const elSlideShow = $.GetContextPanel().FindChildTraverse('LoadingScreenSlideShow');
        const arrSlides = elSlideShow.Children();
        const randomOffset = Math.floor(Math.random() * arrSlides.length);
        // start with a random slide
        _NextSlide(randomOffset, true);
    }
    // calls itself repeatedly until interrupted by EndSlideShow
    function _NextSlide(n, bFirst = false) {
        m_slideShowJob = null;
        const elSlideShow = $.GetContextPanel().FindChildTraverse('LoadingScreenSlideShow');
        const arrSlides = elSlideShow.Children();
        if (arrSlides.length <= 1)
            return;
        if (n >= arrSlides.length)
            n = n - arrSlides.length;
        let m = n - 1;
        if (m < 0)
            m = arrSlides.length - 1;
        if (arrSlides[n]) {
            $.Msg('LoadingScreen.NextSlide ' + n + ', (' + arrSlides[n].Data().imagePath + ')');
            if (bFirst)
                arrSlides[n].SwitchClass('viz', 'show-first');
            else
                arrSlides[n].SwitchClass('viz', 'show');
        }
        const slide = arrSlides[m];
        if (slide)
            $.Schedule(0.25, () => {
                if (slide && slide.IsValid())
                    slide.SwitchClass('viz', 'hide');
            });
        m_slideShowJob = $.Schedule(SLIDE_DURATION, () => _NextSlide(n + 1));
        $.Msg('LoadingScreen.m_slideShowJob SET ' + m_slideShowJob);
    }
    function _EndSlideShow() {
        if (m_slideShowJob) {
            $.Msg('LoadingScreen.m_slideShowJob CLEAR ' + m_slideShowJob);
            $.CancelScheduled(m_slideShowJob);
            m_slideShowJob = null;
        }
    }
    function _OnMapLoadFinished() {
        _EndSlideShow();
    }
    function _UpdateLoadingScreenInfo(mapName, prettyMapName, prettyGameModeName, gameType, gameMode, descriptionText = '') {
        $.Msg('LoadingScreen.UpdateLoadingScreenInfo ' + mapName + ' ' + prettyMapName + ' ' + gameMode + ' ' + prettyGameModeName + ' ' + descriptionText);
        // Resolve cvar values (and keep known good values in case they temporarily set to zero)
        for (let j = 0; j < cvars.length; ++j) {
            const val = GameInterfaceAPI.GetSettingString(cvars[j]);
            if (val !== '0') {
                cvalues[j] = val;
            }
        }
        // Do string replacements and dialog variables
        for (let j = 0; j < cvars.length; ++j) {
            const regex = new RegExp('\\${d:' + cvars[j] + '}', 'gi');
            descriptionText = descriptionText.replace(regex, cvalues[j]);
            $.GetContextPanel().SetDialogVariable(cvars[j], cvalues[j]);
        }
        if (mapName) {
            m_mapName = mapName;
            // ** map icon
            $('#LoadingScreenIcon').visible = true;
            $('#LoadingScreenMapName').RemoveClass("loading-screen-content__info__text-title-long");
            $('#LoadingScreenMapName').AddClass("loading-screen-content__info__text-title-short");
            $('#LoadingScreenIcon').SetImage('file://{images}/map_icons/map_icon_' + mapName + '.svg');
            $('#LoadingScreenIcon').AddClass('show');
            if (prettyMapName != "")
                $('#LoadingScreenMapName').SetAlreadyLocalizedText(prettyMapName);
            else
                $('#LoadingScreenMapName').SetLocString(GameStateAPI.GetMapDisplayNameToken(mapName));
        }
        const elInfoBlock = $('#LoadingScreenInfo');
        if (gameMode) {
            elInfoBlock.RemoveClass('hidden');
            if (prettyGameModeName != "")
                $('#LoadingScreenGameMode').SetAlreadyLocalizedText(prettyGameModeName);
            else
                $('#LoadingScreenGameMode').SetLocString('#sfui_gamemode_' + gameMode);
            $('#LoadingScreenGameModeIcon').visible = true;
            if (GameStateAPI.IsQueuedMatchmakingMode_Team() || mapName === 'lobby_mapveto')
                $('#LoadingScreenGameModeIcon').SetImage("file://{images}/icons/ui/competitive_teams.svg");
            else
                $('#LoadingScreenGameModeIcon').SetImage('file://{images}/icons/ui/' + gameMode + '.svg');
            if (descriptionText != "")
                $('#LoadingScreenModeDesc').SetAlreadyLocalizedText(descriptionText);
            else
                $('#LoadingScreenModeDesc').SetLocString(""); //$.Localize('#gamemode_' + gameMode + '_desc');
        }
        else
            elInfoBlock.AddClass('hidden');
        _InitSlideShow();
    }
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        $.RegisterForUnhandledEvent('PopulateLoadingScreen', _UpdateLoadingScreenInfo);
        $.RegisterForUnhandledEvent('UnloadLoadingScreenAndReinit', _Init);
        $.RegisterForUnhandledEvent('JsOnMapLoadFinished', _OnMapLoadFinished);
        const elGameModeIcon = $('#LoadingScreenGameModeIcon');
        $.RegisterEventHandler('ImageFailedLoad', elGameModeIcon, () => elGameModeIcon.visible = false);
        function mapIconFailedToLoad() {
            $('#LoadingScreenMapName').RemoveClass("loading-screen-content__info__text-title-short");
            $('#LoadingScreenMapName').AddClass("loading-screen-content__info__text-title-long");
            $('#LoadingScreenIcon').visible = false;
        }
        $.RegisterEventHandler('ImageFailedLoad', $('#LoadingScreenIcon'), mapIconFailedToLoad.bind(undefined));
    }
})(LoadingScreen || (LoadingScreen = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZGluZ3NjcmVlbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL2xvYWRpbmdzY3JlZW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUVsQyxJQUFVLGFBQWEsQ0F1UXRCO0FBdlFELFdBQVUsYUFBYTtJQUV0QixNQUFNLEtBQUssR0FBRyxDQUFFLGNBQWMsRUFBRSxjQUFjLEVBQUUsY0FBYyxDQUFFLENBQUM7SUFDakUsTUFBTSxPQUFPLEdBQUcsQ0FBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBRSxDQUFDO0lBRWxDLE1BQU0sVUFBVSxHQUFHLEVBQUUsQ0FBQztJQUN0QixNQUFNLGNBQWMsR0FBRyxDQUFDLENBQUM7SUFDekIsSUFBSSxjQUFjLEdBQWtCLElBQUksQ0FBQztJQUN6QyxJQUFJLFNBQVMsR0FBa0IsSUFBSSxDQUFDO0lBQ3BDLElBQUksaUJBQWlCLEdBQUcsQ0FBQyxDQUFDO0lBRTFCLFNBQVMsS0FBSztRQUVYLENBQUMsQ0FBRSxjQUFjLENBQXFCLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztRQUVqRCxDQUFDLENBQUUsdUJBQXVCLENBQWUsQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ3BELENBQUMsQ0FBRSx3QkFBd0IsQ0FBZSxDQUFDLFlBQVksQ0FBRSxlQUFlLENBQUUsQ0FBQztRQUMzRSxDQUFDLENBQUUsd0JBQXdCLENBQWUsQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBRXZELE1BQU0sY0FBYyxHQUFHLENBQUMsQ0FBRSw0QkFBNEIsQ0FBYSxDQUFDO1FBQ3BFLGNBQWMsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1FBRS9CLENBQUMsQ0FBRSxvQkFBb0IsQ0FBRyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7UUFFM0MsTUFBTSxXQUFXLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGlC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