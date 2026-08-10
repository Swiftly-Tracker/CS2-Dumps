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