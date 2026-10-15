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
            $.CancelScheduled(m_slideShowJob);
            m_slideShowJob = null;
        }
        m_mapName = null;
    }
    function _CreateSlide(n) {
        const suffix = n == 0 ? '' : '_' + n;
        const imagePath = 'file://{images}/map_icons/screenshots/1080p/' + m_mapName + suffix + '.png';
        if (!$.BImageFileExists(imagePath)) {
            return false;
        }
        const elSlideShow = $.GetContextPanel().FindChildTraverse('LoadingScreenSlideShow');
        const elSlide = $.CreatePanel('Image', elSlideShow, 'slide_' + n);
        elSlide.BLoadLayoutSnippet('snippet-loadingscreen-slide');
        elSlide.SetImage(imagePath);
        elSlide.Data().imagePath = imagePath;
        elSlide.SwitchClass('viz', 'hide');
        const titleToken = '#loadingscreen_title_' + m_mapName + suffix;
        let title = $.Localize(titleToken);
        if (title == titleToken)
            title = '';
        elSlide.SetDialogVariable('screenshot-title', title);
        m_numImageLoading++;
        $.RegisterEventHandler('ImageLoaded', elSlide, () => {
            m_numImageLoading--;
            if (m_numImageLoading <= 0)
                _StartSlideShow();
        });
        $.RegisterEventHandler('ImageFailedLoad', elSlide, () => {
            elSlide.DeleteAsync(0.0);
            m_numImageLoading--;
            if (m_numImageLoading <= 0)
                _StartSlideShow();
        });
        return true;
    }
    function _InitSlideShow() {
        if (m_slideShowJob)
            return;
        for (let n = 0; n < MAX_SLIDES; n++) {
            _CreateSlide(n);
        }
    }
    function _StartSlideShow() {
        const elSlideShow = $.GetContextPanel().FindChildTraverse('LoadingScreenSlideShow');
        const arrSlides = elSlideShow.Children();
        const randomOffset = Math.floor(Math.random() * arrSlides.length);
        _NextSlide(randomOffset, true);
    }
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
    }
    function _EndSlideShow() {
        if (m_slideShowJob) {
            $.CancelScheduled(m_slideShowJob);
            m_slideShowJob = null;
        }
    }
    function _OnMapLoadFinished() {
        _EndSlideShow();
    }
    function _UpdateLoadingScreenInfo(mapName, prettyMapName, prettyGameModeName, gameType, gameMode, descriptionText = '') {
        for (let j = 0; j < cvars.length; ++j) {
            const val = GameInterfaceAPI.GetSettingString(cvars[j]);
            if (val !== '0') {
                cvalues[j] = val;
            }
        }
        for (let j = 0; j < cvars.length; ++j) {
            const regex = new RegExp('\\${d:' + cvars[j] + '}', 'gi');
            descriptionText = descriptionText.replace(regex, cvalues[j]);
            $.GetContextPanel().SetDialogVariable(cvars[j], cvalues[j]);
        }
        if (mapName) {
            m_mapName = mapName;
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
                $('#LoadingScreenModeDesc').SetLocString("");
        }
        else
            elInfoBlock.AddClass('hidden');
        _InitSlideShow();
    }
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