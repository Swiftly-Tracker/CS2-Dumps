"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/iteminfo.ts" />
/// <reference path="hud/hudwinpanel_background_map.ts" />
/// <reference path="generated/items_event_current_generated_store.d.ts" />
/// <reference path="generated/items_event_current_generated_store.ts" />
//--------------------------------------------------------------------------------------------------
// Nav bar
//--------------------------------------------------------------------------------------------------
var controlsLibActiveTab = null;
function ControlsLibNavigateToTab(tab, msg) {
    $.Msg(tab);
    $.Msg(msg);
    if (controlsLibActiveTab) {
        controlsLibActiveTab.RemoveClass('Active');
    }
    controlsLibActiveTab = $('#' + tab);
    if (controlsLibActiveTab) {
        controlsLibActiveTab.AddClass('Active');
    }
}
function CloseControlsLib() {
    //Deletes the panel after a small delay to insure the animation for the panel hiding has finished.
    $.GetContextPanel().DeleteAsync(.3);
    var controlsLibPanel = $.GetContextPanel();
    controlsLibPanel.RemoveClass("Active");
}
function OpenControlsLib() {
    var controlsLibPanel = $.GetContextPanel();
    controlsLibPanel.AddClass("Active");
}
//--------------------------------------------------------------------------------------------------
// Popups
//--------------------------------------------------------------------------------------------------
var jsPopupCallbackHandle = null;
var jsPopupLoadingBarCallbackHandle = null;
var popupLoadingBarLevel = 0;
function ClearPopupsText() {
    $('#ControlsLibPopupsText').text = '--';
}
function OnControlsLibPopupEvent(msg) {
    $.Msg('OnControlsLibPopupEvent: You pressed ' + msg + '\n');
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
//DEVONLY{
function OnPopupCustomLayoutArmsDealOffers() {
    UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_collection_offers.xml', 'none');
}
//}DEVONLY
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
//--------------------------------------------------------------------------------------------------
// Context menus
//--------------------------------------------------------------------------------------------------
var jsContextMenuCallbackHandle = null;
function ClearContextMenuText() {
    $('#ControlsLibContextMenuText').text = '--';
}
function OnControlsLibContextMenuEvent(msg) {
    $.Msg('OnControlsLibContextMenuEvent: You pressed ' + msg + '\n');
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
//--------------------------------------------------------------------------------------------------
// Videos
//--------------------------------------------------------------------------------------------------
var g_VideoNumTrailers = 2;
var g_VideoCurrentTrailer = 0;
function VideoPlayNextTrailer() {
    g_VideoCurrentTrailer = (g_VideoCurrentTrailer + 1) % g_VideoNumTrailers;
    var videoPlayer = $('#VideoTrailerPlayer');
    videoPlayer.SetMovie("file://{resources}/videos/trailer_" + g_VideoCurrentTrailer + ".webm");
    videoPlayer.SetTitle("Trailer " + g_VideoCurrentTrailer);
    videoPlayer.Play();
}
//--------------------------------------------------------------------------------------------------
// Scene
//--------------------------------------------------------------------------------------------------
function InitScenePanel() {
    // Setting up camera playback speed slider
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
    //$.Msg( "SceneCameraPlaybackSpeedSliderChanged callback called" );
}
function SceneCameraPlaybackSpeedTextChanged() {
    var playbackSpeedText = $('#PlaybackSpeedText');
    var value = parseFloat(playbackSpeedText.text);
    if (!isNaN(value)) {
        var playbackSpeedSlider = $('#PlaybackSpeedSlider');
        playbackSpeedSlider.value = value;
        //$.Msg( "SceneCameraPlaybackSpeedTextChanged callback called" );
    }
    else {
        $.Msg("SceneCameraPlaybackSpeedTextChanged - INVALID VALUE");
    }
}
//--------------------------------------------------------------------------------------------------
// Dialog Variables
//--------------------------------------------------------------------------------------------------
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
    //$.GetContextPanel().SetDialogVariableInt( "count", g_DialogVarCount );
    // dynamically setting the text of the label
    $("#DiagVarLabel").text = $.Localize("\tDynamic Label Count: {d:r:count}", $("#ControlsLibDiagVars"));
    // Increment "count" every second
    $.Schedule(1.0, UpdateDialogVariables);
    $("#ParentDialogVarTextEntry").RaiseChangeEvents(true);
    $("#ChildDialogVarTextEntry").RaiseChangeEvents(true);
    $.RegisterEventHandler('TextEntryChanged', $("#ParentDialogVarTextEntry"), UpdateParentDialogVariablesFromTextEntry);
    $.RegisterEventHandler('TextEntryChanged', $("#ChildDialogVarTextEntry"), UpdateChildDialogVariablesFromTextEntry);
}
function UpdateDialogVariables() {
    g_DialogVarCount++;
    $("#ControlsLibDiagVars").SetDialogVariableInt("count", g_DialogVarCount);
    //$.GetContextPanel().SetDialogVariableInt( "count", g_DialogVarCount );
    $.Schedule(1.0, UpdateDialogVariables);
}
function InitCaseTest() {
    $("#CaseTest").SetDialogVariable("casetest", "iİıI");
}
//--------------------------------------------------------------------------------------------------
// Panels tab
//--------------------------------------------------------------------------------------------------
function OnImageFailLoad() {
    $.Msg('ControlsLib javascript - Unable to load image, falling back to file://{images}/icons/knife.psd.');
    $("#ControlsLibPanelImageFallback").SetImage("file://{images}/icons/knife.psd");
}
function InitPanels() {
    var parent = $.FindChildInContext("#ControlsLibPanelsDynParent");
    $.CreatePanel('Label', parent, '', { text: 'Label, with text property, created dynamically from js.' });
    $.CreatePanel('Label', parent, '', { class: 'fontSize-l fontWeight-Bold', style: 'color:#558927;', text: 'Label, with text and class properties, created dynamically from js.' });
    $.CreatePanel('TextButton', parent, '', { class: 'PopupButton', text: "Output to console", onactivate: "$.Msg('Panel tab - Button pressed !!!')" });
    $.CreatePanel('ControlLibTestPanel', $.FindChildInContext('#ControlsLibPanelsJS'), '', { MyCustomProp: 'Created dynamically from javascript', CreatedFromJS: 1 });
    // image fallback
    $.RegisterEventHandler('ImageFailedLoad', $("#ControlsLibPanelImageFallback"), OnImageFailLoad);
    $("#ControlsLibPanelImageFallback").SetImage("file://{images}/unknown2.vtf");
    $("#ImageApngtest").SetImage("file://{resources}/videos/test/apngtestnoext");
}
//--------------------------------------------------------------------------------------------------
// BlendBlur tab
//--------------------------------------------------------------------------------------------------
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
    //$.Msg( "Received RSS Feed." + JSON.stringify( feed ) );
    var RSSFeedPanel = $("#RSSFeed");
    if (RSSFeedPanel == null) {
        return;
    }
    RSSFeedPanel.RemoveAndDeleteChildren();
    // Assume success for now
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
//--------------------------------------------------------------------------------------------------
// Bugs tab
//--------------------------------------------------------------------------------------------------
function JSReadyReset() {
    $.Msg('Ready for display reset.');
    var elParent = $('#ControlsLibBugsReadyParent');
    var elBtnAddChild = $('#ControlsLibBugsReadyButtonAddChild');
    var elBtnAddBgImg = $('#ControlsLibBugsReadyButtonAddBgImg');
    elParent.RemoveAndDeleteChildren();
    elParent.SetReadyForDisplay(false);
    elBtnAddChild.enabled = true;
    elBtnAddBgImg.enabled = false;
    //var elChild = $('#ControlsLibBugsReadyChild');
    //elChild.RemoveClass( 'ControlLibBugs__ReadyChild--Ready' );
    //elChild.RegisterForReadyEvents( false );
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
        $.Msg("Reveal ", panelId);
    }
    $.Msg("Schedule reveal ", Delay, "seconds");
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
    $.Msg(' ShowHideWinPanel ');
    let elPanel = $.GetContextPanel().FindChildInLayoutFile('ZooWinPanel');
    elPanel.RemoveClass('WinPanelRoot--Win--T');
    // We are setting this on the panel for debug. These are actually passed in from code when you play the game.
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
    // let elReason = elPanel.FindChildInLayoutFile( 'MVP__WinnerName' ) as Label_t;
    // elReason.text = $.Localize( '#Panorama_winpanel_mvp_award_bombplant' );
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
        $.Msg("Canvas relative spoke position " + s + ": " + vPos.x + ',' + vPos.y);
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
    $.Msg(guidelineYPositions);
    const pointPositions = lineGraph.GetDataPointPositions();
    $.Msg(pointPositions);
}
//--------------------------------------------------------------------------------------------------
// Entry point called when panel is created
//--------------------------------------------------------------------------------------------------
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udHJvbHNsaWJyYXJ5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvY29udHJvbHNsaWJyYXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQyxrQ0FBa0M7QUFDbkMsMkNBQTJDO0FBQzNDLDBEQUEwRDtBQUMxRCwyRUFBMkU7QUFDM0UseUVBQXlFO0FBR3pFLG9HQUFvRztBQUNwRyxVQUFVO0FBQ1Ysb0dBQW9HO0FBRXBHLElBQUksb0JBQW9CLEdBQW1CLElBQUksQ0FBQztBQUVoRCxTQUFTLHdCQUF3QixDQUFHLEdBQVcsRUFBRSxHQUFXO0lBRXhELENBQUMsQ0FBQyxHQUFHLENBQUUsR0FBRyxDQUFFLENBQUM7SUFDYixDQUFDLENBQUMsR0FBRyxDQUFFLEdBQUcsQ0FBRSxDQUFDO0lBQ2IsSUFBSyxvQkFBb0IsRUFDekI7UUFDSSxvQkFBb0IsQ0FBQyxXQUFXLENBQUUsUUFBUSxDQUFFLENBQUM7S0FDaEQ7SUFFRCxvQkFBb0IsR0FBRyxDQUFDLENBQUUsR0FBRyxHQUFHLEdBQUcsQ0FBRSxDQUFDO0lBRXRDLElBQUssb0JBQW9CLEVBQ3pCO1FBQ0ksb0JBQW9CLENBQUMsUUFBUSxDQUFFLFFBQVEsQ0FBRSxDQUFDO0tBQzdDO0FBRUwsQ0FBQztBQUVELFNBQVMsZ0JBQWdCO0lBRXJCLGtHQUFrRztJQUNsRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsV0FBVyxDQUFFLEVBQUUsQ0FBRSxDQUFDO0lBRXRDLElBQUksZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBQzNDLGdCQUFnQixDQUFDLFdBQVcsQ0FBRSxRQUFRLENBQUUsQ0FBQztBQUM3QyxDQUFDO0FBRUQsU0FBUyxlQUFlO0lBRXBCLElBQUksZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBQzNDLGdCQUFnQixDQUFDLFFBQVEsQ0FBRSxRQUFRLENB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