"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/iteminfo.ts" />
/// <reference path="hud/hudwinpanel_background_map.ts" />
/// <reference path="generated/items_event_current_generated_store.d.ts" />
/// <reference path="generated/items_event_current_generated_store.ts" />
var controlsLibActiveTab = null;
function ControlsLibNavigateToTab(tab, msg) {
    if (controlsLibActiveTab) {
        controlsLibActiveTab.RemoveClass('Active');
    }
    controlsLibActiveTab = $('#' + tab);
    if (controlsLibActiveTab) {
        controlsLibActiveTab.AddClass('Active');
    }
}
function CloseControlsLib() {
    $.GetContextPanel().DeleteAsync(.3);
    var controlsLibPanel = $.GetContextPanel();
    controlsLibPanel.RemoveClass("Active");
}
function OpenControlsLib() {
    var controlsLibPanel = $.GetContextPanel();
    controlsLibPanel.AddClass("Active");
}
var jsPopupCallbackHandle = null;
var jsPopupLoadingBarCallbackHandle = null;
var popupLoadingBarLevel = 0;
function ClearPopupsText() {
    $('#ControlsLibPopupsText').text = '--';
}
function OnControlsLibPopupEvent(msg) {
    $('#ControlsLibPopupsText').text = msg;
}
function OnPopupCustomLayoutParamsPressed() {
    ClearPopupsText();
    UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_custom_layout_test.xml', 'popupvalue=123456&callback=' + jsPopupCallbackHandle);
}
function OnPopupCustomLayoutImagePressed() {
    ClearPopupsText();
    UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_custom_layout_test_image.xml', 'message=Example of popup with an image&image=file://{images}/control_icons/home_icon.vtf&callback=' + jsPopupCallbackHandle);
}
function OnPopupCustomLayoutImageSpinnerPressed() {
    ClearPopupsText();
    UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_custom_layout_test_image.xml', 'message=Example of popup with an image and a spinner&image=file://{images}/control_icons/home_icon.vtf&spinner=1&callback=' + jsPopupCallbackHandle);
}
function OnPopupCustomLayoutImageLoadingPressed() {
    ClearPopupsText();
    popupLoadingBarLevel = 0;
    UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_custom_layout_test_image.xml', 'message=Example of popup with an image and a loading bar&image=file://{images}/control_icons/home_icon.vtf&callback=' + jsPopupCallbackHandle + '&loadingBarCallback=' + jsPopupLoadingBarCallbackHandle);
}
function OnPopupCustomLayoutMatchAccept() {
    ClearPopupsText();
    popupLoadingBarLevel = 0;
    var popup = UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_accept_match.xml', 'map_and_isreconnect=de_dust2,false&ping=155&location=China, Tianjin');
    $.DispatchEvent("ShowAcceptPopup", popup);
}
function OnPopupCustomLayoutPremierPickBan() {
    UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_premier_pick_ban.xml', "none");
}
function OnPopupCustomLayoutXpGrant() {
    UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_acknowledge_xpgrant.xml', 'none');
}
function OnPopupCustomLayoutMajorStore() {
    const popupPanel = UiToolkitAPI.ShowCustomLayoutPopup('id-popup-major-store', 'file://{resources}/layout/popups/popup_major_store.xml');
    popupPanel.Data().eventId = g_ActiveTournamentInfo.eventid;
}
function OnPopupCustomLayoutCaseConfirm() {
    UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_container_open_confirm.xml', 'none');
}
function OnPopupCustomLayoutLoadingScreen() {
    ClearPopupsText();
    UiToolkitAPI.ShowCustomLayoutPopup('teams', 'file://{resources}/layout/teamselectmenu.xml');
}
function OnControlsLibPopupLoadingBarEvent() {
    popupLoadingBarLevel += 0.05;
    if (popupLoadingBarLevel > 1.0) {
        popupLoadingBarLevel = 1.0;
    }
}
var jsContextMenuCallbackHandle = null;
function ClearContextMenuText() {
    $('#ControlsLibContextMenuText').text = '--';
}
function OnControlsLibContextMenuEvent(msg) {
    $('#ControlsLibContextMenuText').text = msg;
}
function OnSimpleContextMenu() {
    ClearContextMenuText();
    var items = [];
    items.push({ label: 'Item 1', jsCallback: function () { OnControlsLibContextMenuEvent('Item1'); } });
    items.push({ label: 'Item 2', jsCallback: function () { OnControlsLibContextMenuEvent('Item2'); } });
    items.push({ label: 'Item 3', jsCallback: function () { OnControlsLibContextMenuEvent('Item3'); } });
    UiToolkitAPI.ShowSimpleContextMenu('', 'ControlLibSimpleContextMenu', items);
}
function OnContextMenuCustomLayoutParamsPressed() {
    ClearContextMenuText();
    UiToolkitAPI.ShowCustomLayoutContextMenuParameters('', '', 'file://{resources}/layout/context_menus/context_menu_custom_layout_test.xml', 'test=123456&callback=' + jsContextMenuCallbackHandle);
}
var g_VideoNumTrailers = 2;
var g_VideoCurrentTrailer = 0;
function VideoPlayNextTrailer() {
    g_VideoCurrentTrailer = (g_VideoCurrentTrailer + 1) % g_VideoNumTrailers;
    var videoPlayer = $('#VideoTrailerPlayer');
    videoPlayer.SetMovie("file://{resources}/videos/trailer_" + g_VideoCurrentTrailer + ".webm");
    videoPlayer.SetTitle("Trailer " + g_VideoCurrentTrailer);
    videoPlayer.Play();
}
function InitScenePanel() {
    var playbackSpeedSlider = $('#PlaybackSpeedSlider');
    playbackSpeedSlider.min = -2;
    playbackSpeedSlider.max = 2;
    playbackSpeedSlider.value = 1;
}
function SceneCameraPlaybackSpeedSliderChanged() {
    var playbackSpeedSlider = $('#PlaybackSpeedSlider');
    var playbackSpeedText = $('#PlaybackSpeedText');
    var vanityPanel = $('#MapForVanity');
    playbackSpeedText.text = playbackSpeedSlider.value.toFixed(3);
    vanityPanel.SetCameraPlaybackSpeed(playbackSpeedSlider.value);
}
function SceneCameraPlaybackSpeedTextChanged() {
    var playbackSpeedText = $('#PlaybackSpeedText');
    var value = parseFloat(playbackSpeedText.text);
    if (!isNaN(value)) {
        var playbackSpeedSlider = $('#PlaybackSpeedSlider');
        playbackSpeedSlider.value = value;
    }
    else {
    }
}
var g_DialogVarCount = 0;
function UpdateParentDialogVariablesFromTextEntry() {
    var varStr = $("#ParentDialogVarTextEntry").text;
    $("#DialogVarParentPanel").SetDialogVariable('testvar', varStr);
}
function UpdateChildDialogVariablesFromTextEntry() {
    var varStr = $("#ChildDialogVarTextEntry").text;
    $("#DialogVarChildPanel").SetDialogVariable('testvar', varStr);
}
function InitDialogVariables() {
    $("#ControlsLibDiagVars").SetDialogVariableInt("count", g_DialogVarCount);
    $("#ControlsLibDiagVars").SetDialogVariable("s1", "Test1");
    $("#ControlsLibDiagVars").SetDialogVariable("s2", "Test2");
    $("#ControlsLibDiagVars").SetDialogVariable("cam_key", "%jump%");
    $("#ControlsLibDiagVars").SetDialogVariable("np_key", "%attack%");
    $("#ControlsLibDiagVars").SetDialogVariable("sp_key", "%radio%");
    $("#DiagVarLabel").text = $.Localize("\tDynamic Label Count: {d:r:count}", $("#ControlsLibDiagVars"));
    $.Schedule(1.0, UpdateDialogVariables);
    $("#ParentDialogVarTextEntry").RaiseChangeEvents(true);
    $("#ChildDialogVarTextEntry").RaiseChangeEvents(true);
    $.RegisterEventHandler('TextEntryChanged', $("#ParentDialogVarTextEntry"), UpdateParentDialogVariablesFromTextEntry);
    $.RegisterEventHandler('TextEntryChanged', $("#ChildDialogVarTextEntry"), UpdateChildDialogVariablesFromTextEntry);
}
function UpdateDialogVariables() {
    g_DialogVarCount++;
    $("#ControlsLibDiagVars").SetDialogVariableInt("count", g_DialogVarCount);
    $.Schedule(1.0, UpdateDialogVariables);
}
function InitCaseTest() {
    $("#CaseTest").SetDialogVariable("casetest", "iİıI");
}
function InitMonoNumbersTest() {
    UpdateMonoNumbersTest();
}
function UpdateMonoNumbersTest() {
    const panel = $("#MonoNumbersTest");
    if (!panel || !panel.IsValid())
        return;
    const RandomDigits = () => String(Math.floor(Math.random() * 100000)).padStart(5, '0');
    panel.SetDialogVariable("mono_numbers", RandomDigits() + '+' + RandomDigits());
    $.Schedule(0.1, UpdateMonoNumbersTest);
}
function OnImageFailLoad() {
    $("#ControlsLibPanelImageFallback").SetImage("file://{images}/icons/knife.psd");
}
function InitPanels() {
    var parent = $.FindChildInContext("#ControlsLibPanelsDynParent");
    $.CreatePanel('Label', parent, '', { text: 'Label, with text property, created dynamically from js.' });
    $.CreatePanel('Label', parent, '', { class: 'fontSize-l fontWeight-Bold', style: 'color:#558927;', text: 'Label, with text and class properties, created dynamically from js.' });
    $.CreatePanel('TextButton', parent, '', { class: 'PopupButton', text: "Output to console", onactivate: "$.Msg('Panel tab - Button pressed !!!')" });
    $.CreatePanel('ControlLibTestPanel', $.FindChildInContext('#ControlsLibPanelsJS'), '', { MyCustomProp: 'Created dynamically from javascript', CreatedFromJS: 1 });
    $.RegisterEventHandler('ImageFailedLoad', $("#ControlsLibPanelImageFallback"), OnImageFailLoad);
    $("#ControlsLibPanelImageFallback").SetImage("file://{images}/unknown2.vtf");
    $("#ImageApngtest").SetImage("file://{resources}/videos/test/apngtestnoext");
}
function TransitionBlurPanel() {
    $("#MyBlendBlurFitParent").RemoveClass("TheBlurAnimOut");
    $("#MyBlendBlurFitParent").RemoveClass("TheBlurAnimIn");
    $("#MyBlendBlurFitParent").AddClass("TheBlurAnimIn");
}
function TransitionBlurPanel2() {
    $("#MyBlendBlurFitParent").RemoveClass("TheBlurAnimIn");
    $("#MyBlendBlurFitParent").RemoveClass("TheBlurAnimOut");
    $("#MyBlendBlurFitParent").AddClass("TheBlurAnimOut");
}
function CreateSvgFromJs() {
    $.CreatePanel('Image', $('#svgButton'), '', {
        src: "file://{images}/icons/ui/smile.svg",
        texturewidth: 100,
        textureheight: 100
    });
}
function GetRssFeed() {
    BlogAPI.RequestRSSFeed();
}
function OnRssFeedReceived(feed) {
    var RSSFeedPanel = $("#RSSFeed");
    if (RSSFeedPanel == null) {
        return;
    }
    RSSFeedPanel.RemoveAndDeleteChildren();
    for (const item of feed.items) {
        var itemPanel = $.CreatePanel('Panel', RSSFeedPanel, '', { acceptsinput: true });
        itemPanel.AddClass('RSSFeed__Item');
        $.CreatePanel('Label', itemPanel, '', { text: item.title, html: true, class: 'RSSFeed__ItemTitle' });
        if (item.imageUrl.length !== 0) {
            $.CreatePanel('Image', itemPanel, '', { src: item.imageUrl, class: 'RSSFeed__ItemImage', scaling: 'stretch-to-fit-preserve-aspect' });
        }
        $.CreatePanel('Label', itemPanel, '', { text: item.description, html: true, class: 'RSSFeed__ItemDesc' });
        $.CreatePanel('Label', itemPanel, '', { text: item.date, html: true, class: 'RSSFeed__ItemDate' });
        itemPanel.SetPanelEvent("onactivate", SteamOverlayAPI.OpenURL.bind(SteamOverlayAPI, item.link));
    }
}
function JSReadyReset() {
    var elParent = $('#ControlsLibBugsReadyParent');
    var elBtnAddChild = $('#ControlsLibBugsReadyButtonAddChild');
    var elBtnAddBgImg = $('#ControlsLibBugsReadyButtonAddBgImg');
    elParent.RemoveAndDeleteChildren();
    elParent.SetReadyForDisplay(false);
    elBtnAddChild.enabled = true;
    elBtnAddBgImg.enabled = false;
}
function JSReadyAddChild() {
    var elParent = $('#ControlsLibBugsReadyParent');
    var elBtnAddChild = $('#ControlsLibBugsReadyButtonAddChild');
    var elBtnAddBgImg = $('#ControlsLibBugsReadyButtonAddBgImg');
    $.CreatePanel('Panel', elParent, 'ControlsLibBugsReadyChild', { class: 'ControlLibBugs__ReadyChild' });
    elBtnAddChild.enabled = false;
    elBtnAddBgImg.enabled = true;
}
function JSReadyAddBgImg() {
    var elBtnAddChild = $('#ControlsLibBugsReadyButtonAddChild');
    var elBtnAddBgImg = $('#ControlsLibBugsReadyButtonAddBgImg');
    var elParent = $('#ControlsLibBugsReadyParent');
    var elChild = $('#ControlsLibBugsReadyChild');
    elBtnAddChild.enabled = false;
    elBtnAddBgImg.enabled = false;
    elChild.AddClass('ControlLibBugs__ReadyChild--Ready');
    elParent.SetReadyForDisplay(true);
}
function JSTestTransition() {
    var Delay = 0.2;
    function _reveal(panelId) {
        $(panelId).AddClass('TestTransition');
    }
    $.Schedule(Delay, () => _reveal("#RepaintBugGrandchild"));
    $.Schedule(Delay * 2.0, () => _reveal("#RepaintBugChild"));
}
function JSResetTransition() {
    $('#RepaintBugChild').RemoveClass('TestTransition');
    $('#RepaintBugGrandchild').RemoveClass('TestTransition');
}
function JSControlsPageStartParticles() {
    for (const curPanel of $('#ControlsLibParticles').FindChildrenWithClassTraverse('TestParticlePanel')) {
        curPanel.StartParticles();
    }
}
function JSControlsPageStopPlayEndCapParticles() {
    for (const curPanel of $('#ControlsLibParticles').FindChildrenWithClassTraverse('TestParticlePanel')) {
        curPanel.StopParticlesWithEndcaps();
    }
}
function JSControlsPageSetControlPointParticles(cp, xpos, ypos, zpos) {
    for (const curPanel of $('#ControlsLibParticles').FindChildrenWithClassTraverse('TestParticlePanel')) {
        curPanel.SetControlPoint(cp, 0, 1 + ypos, zpos);
        curPanel.SetControlPoint(cp, xpos, ypos, zpos);
    }
}
function JSPanelStartParticles(name) {
    for (const curPanel of $.GetContextPanel().FindChildrenWithClassTraverse(name)) {
        curPanel.StartParticles();
    }
}
function JSPanelStopPlayEndCapParticles(name) {
    for (const curPanel of $.GetContextPanel().FindChildrenWithClassTraverse(name)) {
        curPanel.StopParticlesWithEndcaps();
    }
}
function JSPanelSetControlPointParticles(name, cp, xpos, ypos, zpos) {
    for (const curPanel of $.GetContextPanel().FindChildrenWithClassTraverse(name)) {
        curPanel.SetControlPoint(cp, 0, 1 + ypos, zpos);
        curPanel.SetControlPoint(cp, xpos, ypos, zpos);
    }
}
function JSPanelSetParticlesName(name, particleName) {
    for (const curPanel of $.GetContextPanel().FindChildrenWithClassTraverse(name)) {
        curPanel.SetParticleNameAndRefresh(particleName);
    }
}
function ShowHideWinPanel(bshow, teamOverride = 2, mode = 'casual') {
    let elPanel = $.GetContextPanel().FindChildInLayoutFile('ZooWinPanel');
    elPanel.RemoveClass('WinPanelRoot--Win--T');
    elPanel.Data().teamOverride = teamOverride;
    elPanel.Data().gameModeOverride = mode;
    elPanel.SetHasClass('winpanel-basic-round-result-visible', bshow);
    elPanel.SetHasClass('WinPanelRoot--Win', bshow);
    elPanel.SetHasClass('winpanel-mvp--show', bshow);
    elPanel.SetHasClass('MVP__MusicKit--show', bshow);
    elPanel.SetHasClass('winpanel-funfacts--show', bshow);
    elPanel.SetDialogVariable('winpanel-funfact', $.Localize('#GameUI_Stat_LastMatch_MaxPlayers'));
    elPanel.SetDialogVariable('winpanel-title', $.Localize('#WinPanel_RoundWon'));
    let elAvatar = elPanel.FindChildInLayoutFile('MVPAvatar');
    elAvatar.PopulateFromSteamID(MyPersonaAPI.GetXuid());
    let musicKitId = LoadoutAPI.GetItemID('noteam', 'musickit');
    let elKitName = elPanel.FindChildInLayoutFile('MVPMusicKitName');
    elKitName.text = InventoryAPI.GetItemName(musicKitId);
    let elKitLabel = elPanel.FindChildInLayoutFile('MVPMusicKitStatTrak');
    elKitLabel.text = '1000';
}
function CtrlLib_RandomColorString() {
    return "rgba("
        + Math.random() * 255 + ","
        + Math.random() * 255 + ","
        + Math.random() * 255 + ","
        + Number(0.3 + Math.random() * 0.6)
        + ")";
}
function CtrlLib_CreateSpiderGraph() {
    const spiderGraph = $('#SpiderGraph');
    spiderGraph.ClearJS('rgba(0,0,0,0)');
    const elGuidelines = $('#SpiderGraphNumGuidelines');
    const numGuidelines = Number(elGuidelines.text);
    const options = {
        bkg_color: "#44444444",
        spoke_length_scale: 1.0,
        guideline_count: numGuidelines,
        deadzone_percent: .2
    };
    spiderGraph.SetGraphOptions(options);
    const elSpokes = $('#SpiderGraphSpokes');
    const spokesCount = Number(elSpokes.text);
    spiderGraph.DrawGraphBackground(spokesCount);
    const elNumPolys = $('#SpiderGraphNumPolys');
    const polyCount = Number(elNumPolys.text);
    for (let p = 0; p < polyCount; p++) {
        let values = Array.from({ length: spokesCount }, () => Math.random());
        const options = {
            line_color: CtrlLib_RandomColorString(),
            fill_color_inner: CtrlLib_RandomColorString(),
            fill_color_outer: CtrlLib_RandomColorString(),
        };
        spiderGraph.DrawGraphPoly(values, options);
    }
    for (let s = 0; s < spokesCount; s++) {
        let vPos = spiderGraph.GraphPositionToUIPosition(s, 1.0);
    }
}
function gen_graph_data(i, max) {
    return Math.random() * max;
}
function CtrlLib_CreateLineGraph() {
    const lineGraph = $('#LineGraph');
    const elNumVals = $('#num_points');
    const numPoints = Math.floor(Number(4 + elNumVals.value * (15)));
    const xvals = [...Array(numPoints).keys()];
    const yvals = xvals.map(x => gen_graph_data(x, numPoints));
    const options = {
        draw_guidelines: true,
        guideline_color: "#88888888",
        guideline_thick: 4,
        guideline_soft: .5,
        line_color: "#aaffffaa",
        line_thickness: 6,
        line_softness: .5,
        draw_points: true,
        point_size: 8.5,
        point_color: "#ff3344ff",
        gradient_color: "#344d7333",
    };
    lineGraph.SetGraphOptions(options);
    lineGraph.SetData(xvals, yvals);
    lineGraph.Show();
    const guidelineYPositions = lineGraph.GetGuidelinePositions();
    const pointPositions = lineGraph.GetDataPointPositions();
}
(function () {
    OpenControlsLib();
    ControlsLibNavigateToTab('ControlLibStyleGuide', 'init');
    const spiderGraph = $('#SpiderGraph');
    if (spiderGraph) {
        $.RegisterEventHandler("CanvasReady", spiderGraph, CtrlLib_CreateSpiderGraph);
        if (spiderGraph.BCanvasReady()) {
            CtrlLib_CreateSpiderGraph();
        }
    }
    var elTime = $("#TimeZoo");
    if (elTime) {
        elTime.SetDialogVariableTime("time", 1605560584);
    }
    jsPopupCallbackHandle = UiToolkitAPI.RegisterJSCallback(OnControlsLibPopupEvent);
    jsContextMenuCallbackHandle = UiToolkitAPI.RegisterJSCallback(OnControlsLibContextMenuEvent);
    jsPopupLoadingBarCallbackHandle = UiToolkitAPI.RegisterJSCallback(OnControlsLibPopupLoadingBarEvent);
    $.RegisterForUnhandledEvent("PanoramaComponent_Blog_RSSFeedReceived", OnRssFeedReceived);
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udHJvbHNsaWJyYXJ5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvY29udHJvbHNsaWJyYXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQyxrQ0FBa0M7QUFDbkMsMkNBQTJDO0FBQzNDLDBEQUEwRDtBQUMxRCwyRUFBMkU7QUFDM0UseUVBQXlFO0FBT3pFLElBQUksb0JBQW9CLEdBQW1CLElBQUksQ0FBQztBQUVoRCxTQUFTLHdCQUF3QixDQUFHLEdBQVcsRUFBRSxHQUFXO0lBSXhELElBQUssb0JBQW9CLEVBQ3pCO1FBQ0ksb0JBQW9CLENBQUMsV0FBVyxDQUFFLFFBQVEsQ0FBRSxDQUFDO0tBQ2hEO0lBRUQsb0JBQW9CLEdBQUcsQ0FBQyxDQUFFLEdBQUcsR0FBRyxHQUFHLENBQUUsQ0FBQztJQUV0QyxJQUFLLG9CQUFvQixFQUN6QjtRQUNJLG9CQUFvQixDQUFDLFFBQVEsQ0FBRSxRQUFRLENBQUUsQ0FBQztLQUM3QztBQUVMLENBQUM7QUFFRCxTQUFTLGdCQUFnQjtJQUdyQixDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsV0FBVyxDQUFFLEVBQUUsQ0FBRSxDQUFDO0lBRXRDLElBQUksZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBQzNDLGdCQUFnQixDQUFDLFdBQVcsQ0FBRSxRQUFRLENBQUUsQ0FBQztBQUM3QyxDQUFDO0FBRUQsU0FBUyxlQUFlO0lBRXBCLElBQUksZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBQzNDLGdCQUFnQixDQUFDLFFBQVEsQ0FBRSxRQUFRLENBQUUsQ0FBQztBQUMxQyxDQUFDO0FBS0QsSUFBSSxxQkFBcUIsR0FBa0IsSUFBSSxDQUFDO0FBQ2hELElBQUksK0JBQStCLEdBQWtCLElBQUksQ0FBQztBQUMxRCxJQUFJLG9CQUFvQixHQUFHLENBQUMsQ0FBQztBQUU3QixTQUFT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