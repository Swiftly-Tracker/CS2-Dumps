"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/async.ts" />
/// <reference path="mock_adapter.ts" />
/// <reference path="match_stakes.ts" />
/// <reference path="honor_icon.ts" />
var TeamIntroMenu;
(function (TeamIntroMenu) {
    function _msg(msg) {
    }
    async function _StartTeamIntro() {
        _msg('_StartTeamIntro');
        const type = MockAdapter.GetPlayerCompetitiveRankType(GameStateAPI.GetLocalPlayerXuid());
        const elMenu = $.GetContextPanel();
        elMenu.SetHasClass('premier', type === 'Premier');
        const sLocalXuid = GameStateAPI.GetLocalPlayerXuid();
        const nLocalTeam = GameStateAPI.GetPlayerTeamNumber(sLocalXuid);
        const endPromise = Async.UnhandledEvent("EndTeamIntro");
        elMenu.SetHasClass("active", true);
        _SetFaded(true, 0);
        elMenu.StartCamera();
        const modelRefs = _SetupModels(nLocalTeam);
        _SetTeam(nLocalTeam);
        _SetupHeader(nLocalTeam);
        const teamInfoAbort = new Async.AbortController();
        _SetupTeamInfos(nLocalTeam, modelRefs, teamInfoAbort.signal);
        await Async.Delay(0.5);
        _SetFaded(false, 0.5);
        MatchStakes.StartTeamIntro();
        $.DispatchEvent('CSGOPlaySoundEffect', 'TeamIntro', 'MOUSE');
        if (nLocalTeam == 2) {
            $.DispatchEvent('CSGOPlaySoundEffect', 'TeamIntro_TSuits', 'MOUSE');
        }
        else {
            $.DispatchEvent('CSGOPlaySoundEffect', 'TeamIntro_CTSuits', 'MOUSE');
        }
        await endPromise;
        _SetFaded(true, 0.5);
        await Async.Delay(0.5);
        teamInfoAbort.abort();
        $("#TeamIntroHeader").AddClass("hidden");
        $("#TeamIntroTeammateInfos").RemoveAndDeleteChildren();
        MatchStakes.EndTeamIntro();
        _ClearBackground();
        elMenu.StopCamera();
        elMenu.ClearModels();
        _SetFaded(false, 0.5);
        await Async.Delay(0.5);
        elMenu.SetHasClass("active", false);
    }
    function _SetTeam(nTeamNumber) {
        switch (nTeamNumber) {
            case 2:
                $.GetContextPanel().SwitchClass('team', "TERRORIST");
                break;
            case 3:
                $.GetContextPanel().SwitchClass('team', "CT");
                break;
        }
    }
    function _ClearBackground() {
        $.GetContextPanel().SwitchClass('team', "no-background");
    }
    function _SetupTeamInfos(nTeamNumber, modelRefs, abortSignal) {
        const elMenu = $.GetContextPanel();
        $("#TeamIntroTeammateInfos").RemoveAndDeleteChildren();
        const teammateInfos = new Map();
        Async.RunSequence(function* () {
            for (const ref of modelRefs.values()) {
                yield Async.Delay(1.0);
                const elInfo = _CreateTeammateInfo(ref);
                teammateInfos.set(ref.nOrdinal, elInfo);
                elInfo.RemoveClass("hidden");
            }
        }, abortSignal);
        Async.RunSequence(function* () {
            while (true) {
                for (const [nOrdinal, elInfo] of teammateInfos) {
                    let { x, y } = elMenu.GetModelBonePosition(nTeamNumber, nOrdinal, "neck_0");
                    if (isFinite(x) && isFinite(y) && elInfo) {
                        y -= 10.0;
                        x -= elInfo.actuallayoutwidth / elInfo.actualuiscale_x * 0.5;
                        y -= elInfo.actuallayoutheight / elInfo.actualuiscale_y;
                        elInfo.style.transform = "translate3d( " + x + "px, " + y + "px, 0px )";
                    }
                }
                yield Async.NextFrame();
            }
        }, abortSignal);
    }
    function _SetHonorIcon(elPanel, xuid, teamColor) {
        const elHonorIconFrame = elPanel.FindChildTraverse('jsHonorIcon');
        if (elHonorIconFrame) {
            elHonorIconFrame.Set(GameStateAPI.GetPlayerXpTrailLevel(xuid), false);
            if (teamColor) {
                const elImage = elHonorIconFrame.FindChildTraverse('JsHonorIconImage');
                if (elImage) {
                    elImage.style.washColor = teamColor;
                }
            }
        }
    }
    function _CreateTeammateInfo(ref) {
        const sXuid = ref.sXuid;
        const nOrdinal = ref.nOrdinal;
        const elInfos = $("#TeamIntroTeammateInfos");
        const elInfo = $.CreatePanel("Panel", elInfos, nOrdinal.toString());
        elInfo.BLoadLayoutSnippet("TeamIntroTeammateInfo");
        const elAvatarImage = elInfo.FindChildInLayoutFile("AvatarImage");
        elAvatarImage.PopulateFromPlayerSlot(GameStateAPI.GetPlayerSlot(sXuid));
        const elName = elInfo.FindChildInLayoutFile("Name");
        elName.SetDialogVariableInt("intro_player_slot", GameStateAPI.GetPlayerSlot(sXuid));
        const teamColor = GameStateAPI.GetPlayerColor(sXuid);
        if (teamColor)
            elName.style.washColor = teamColor;
        _SetHonorIcon(elInfo, sXuid, teamColor);
        return elInfo;
    }
    function _SetupModels(nLocalTeam) {
        const elMenu = $.GetContextPanel();
        elMenu.ClearModels();
        const modelRefs = [];
        for (let nOrdinal = 1;; ++nOrdinal) {
            const jso = elMenu.AddModel(nLocalTeam, nOrdinal);
            const sXuid = jso.sXuid;
            if (!sXuid)
                break;
            const ref = { sXuid, nOrdinal };
            modelRefs.push(ref);
        }
        return modelRefs;
    }
    function _SetFaded(bVisible, transitionDuration) {
        const elFade = $("#TeamIntroFade");
        elFade.style.transitionDuration = `${transitionDuration}s`;
        elFade.SetHasClass("hidden", !bVisible);
    }
    function _SetupHeader(nTeamNumber) {
        const timeData = GameStateAPI.GetTimeDataJSO();
        const nOvertime = timeData.overtime;
        const bFirstHalf = timeData.gamephase === 2;
        $("#TeamIntroHeader").RemoveClass("hidden");
        const elIcon = $("#TeamIntroIcon");
        const elHalfLabel = $("#TeamIntroHalfLabel");
        const elTeamLabel = $("#TeamIntroTeamLabel");
        if (nOvertime > 0) {
            elHalfLabel.SetDialogVariableInt("overtime_num", nOvertime);
            elHalfLabel.SetLocString(bFirstHalf ? "#team-intro-overtime-1st-half:f" : "#team-intro-overtime-2nd-half:f");
        }
        else {
            elHalfLabel.SetLocString(bFirstHalf ? "#team-intro-1st-half" : "#team-intro-2nd-half");
        }
        switch (nTeamNumber) {
            case 2:
                if (elIcon) {
                    elIcon.SetImage("file://{images}/icons/t_logo.svg");
                }
                elTeamLabel.SetLocString(nOvertime == 0 && bFirstHalf ? "#team-intro-starting-as-t" : "#team-intro-playing-as-t");
                break;
            case 3:
                if (elIcon) {
                    elIcon.SetImage("file://{images}/icons/ct_logo.svg");
                }
                elTeamLabel.SetLocString(nOvertime == 0 && bFirstHalf ? "#team-intro-starting-as-ct" : "#team-intro-playing-as-ct");
                break;
        }
    }
    {
        $.RegisterForUnhandledEvent("StartTeamIntro", _StartTeamIntro);
    }
})(TeamIntroMenu || (TeamIntroMenu = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVhbWludHJvbWVudS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3RlYW1pbnRyb21lbnUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUNsQyx3Q0FBd0M7QUFDeEMsd0NBQXdDO0FBQ3hDLHdDQUF3QztBQUN4QyxzQ0FBc0M7QUFHdEMsSUFBVSxhQUFhLENBbVF0QjtBQW5RRCxXQUFVLGFBQWE7SUFzQnRCLFNBQVMsSUFBSSxDQUFHLEdBQVc7SUFHM0IsQ0FBQztJQUVELEtBQUssVUFBVSxlQUFlO1FBRTdCLElBQUksQ0FBRSxpQkFBaUIsQ0FBRSxDQUFDO1FBRTFCLE1BQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQyw0QkFBNEIsQ0FBRSxZQUFZLENBQUMsa0JBQWtCLEVBQUUsQ0FBRSxDQUFDO1FBQzNGLE1BQU0sTUFBTSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQXlCLENBQUM7UUFDMUQsTUFBTSxDQUFDLFdBQVcsQ0FBRSxTQUFTLEVBQUUsSUFBSSxLQUFLLFNBQVMsQ0FBRSxDQUFDO1FBRXBELE1BQU0sVUFBVSxHQUFHLFlBQVksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBQ3JELE1BQU0sVUFBVSxHQUFHLFlBQVksQ0FBQyxtQkFBbUIsQ0FBRSxVQUFVLENBQUUsQ0FBQztRQUVsRSxNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFFLGNBQWMsQ0FBRSxDQUFDO1FBRTFELE1BQU0sQ0FBQyxXQUFXLENBQUUsUUFBUSxFQUFFLElBQUksQ0FBRSxDQUFDO1FBQ3JDLFNBQVMsQ0FBRSxJQUFJLEVBQUUsQ0FBQyxDQUFFLENBQUM7UUFDckIsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3JCLE1BQU0sU0FBUyxHQUFHLFlBQVksQ0FBRSxVQUFVLENBQUUsQ0FBQztRQUU3QyxRQUFRLENBQUUsVUFBVSxDQUFFLENBQUM7UUFFdkIsWUFB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