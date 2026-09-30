"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/async.ts" />
/// <reference path="mock_adapter.ts" />
/// <reference path="match_stakes.ts" />
$.LogChannel('p.teamintro', "LV_OFF");
var TeamIntroMenu;
(function (TeamIntroMenu) {
    async function _StartTeamIntro() {
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
        if (timeData.has_halftime) {
            elHalfLabel.RemoveClass('collapse');
            if (nOvertime > 0) {
                elHalfLabel.SetDialogVariableInt("overtime_num", nOvertime);
                elHalfLabel.SetLocString(bFirstHalf ? "#team-intro-overtime-1st-half:f" : "#team-intro-overtime-2nd-half:f");
            }
            else {
                elHalfLabel.SetLocString(bFirstHalf ? "#team-intro-1st-half" : "#team-intro-2nd-half");
            }
        }
        else {
            elHalfLabel.AddClass('collapse');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVhbWludHJvbWVudS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3RlYW1pbnRyb21lbnUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUNsQyx3Q0FBd0M7QUFDeEMsd0NBQXdDO0FBQ3hDLHdDQUF3QztBQUV4QyxDQUFDLENBQUMsVUFBVSxDQUFFLGFBQWEsRUFBRSxRQUFRLENBQUUsQ0FBQztBQUV4QyxJQUFVLGFBQWEsQ0FzUXRCO0FBdFFELFdBQVUsYUFBYTtJQXNCdEIsS0FBSyxVQUFVLGVBQWU7UUFJN0IsTUFBTSxJQUFJLEdBQUcsV0FBVyxDQUFDLDRCQUE0QixDQUFFLFlBQVksQ0FBQyxrQkFBa0IsRUFBRSxDQUFFLENBQUM7UUFDM0YsTUFBTSxNQUFNLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBeUIsQ0FBQztRQUMxRCxNQUFNLENBQUMsV0FBVyxDQUFFLFNBQVMsRUFBRSxJQUFJLEtBQUssU0FBUyxDQUFFLENBQUM7UUFFcEQsTUFBTSxVQUFVLEdBQUcsWUFBWSxDQUFDLGtCQUFrQixFQUFFLENBQUM7UUFDckQsTUFBTSxVQUFVLEdBQUcsWUFBWSxDQUFDLG1CQUFtQixDQUFFLFVBQVUsQ0FBRSxDQUFDO1FBRWxFLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUUsY0FBYyxDQUFFLENBQUM7UUFFMUQsTUFBTSxDQUFDLFdBQVcsQ0FBRSxRQUFRLEVBQUUsSUFBSSxDQUFFLENBQUM7UUFDckMsU0FBUyxDQUFFLElBQUksRUFBRSxDQUFDLENBQUUsQ0FBQztRQUNyQixNQUFNLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDckIsTUFBTSxTQUFTLEdBQUcsWUFBWSxDQUFFLFVBQVUsQ0FBRSxDQUFDO1FBRTdDLFFBQVEsQ0FBRSxVQUFVLENBQUUsQ0FBQztRQUV2QixZQUFZLENBQUUsVUFBVSxDQUFFLENBQUM7UUFFM0IsTUFBTSxhQUFhLEdBQUcsSUFBSSxLQUFLLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDbEQsZUFBZSxDQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsYUFBYSxDQUFDLE1BQU0sQ0FBRSxDQUFDO1FBRS9ELE1BQU0sS0FBSyxDQUFDLEtBQUssQ0FBRSxHQUFHLENBQUUsQ0FBQztRQUN6QixTQUFTLENBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBRSxDQUFDO1FBRXhCLFdBQVcsQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUU3QixDQUFDLENBQUMsYUFBYSxDQUFFLHFCQUFxQixFQUFFLFdBQVcsRUFBRSxPQUFPLENBQUUsQ0FBQztRQUUvRCxJQUFLLFVBQVUsSUFBSSxDQUFDLEVBQ3BCO1lBQ0MsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxxQkFBcUIsRUFBRSxrQkFBa0IsRUFBRSxPQUFPLENBQUUsQ0FBQztTQUN0RTthQUVEO1lBQ0MsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxxQkFBcUIsRUFBRSxtQkFBbUIsRUFBRSxPQUFPLENBQUUsQ0FBQztTQUN2RTtRQUVELE1BQU0sVUFBVSxDQUFDO1FBQ2pCLFNBQVMsQ0FBRSxJQUFJLEVBQUUsR0FBRyxDQUFFLENBQUM7UUFFdkIsTUFBTSxLQUFLLENBQUMsS0FBSyxDQUFFLEdBQUcsQ0FBRSxDQUFDO1FBRXpCLGFBQWEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUN0QixDQUFDLENBQUUsa0JBQWtCLENBQUcsQ0FBQyxRQUFRLENBQUUsUUFBUSxDQUFFLENBQUM7UUFDOUMsQ0FBQyxDQUFFLHlCQUF5QixDQUFHLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUMxRCxXQUFXLENBQUMsWUFBWSxFQUFFLENBQUM7UUFDM0IsZ0JBQWdCLEVBQUUsQ0FBQztRQUNuQixNQUFNLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDcEIsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3JCLFNBQVMsQ0FBRSxLQUFLLEVBQUUsR0FBRyxDQUFFLENBQUM7UUFFeEIsTUFBTSxLQUFLLENBQUMsS0FBSyxDQUFFLEdBQUcsQ0FBRSxDQUFDO1FBQ3pCLE1BQU0sQ0FBQyxXQUFXLENBQUUsUUFBUSxFQUFFLEtBQUssQ0FBRSxDQUFDO0lBQ3ZDLENBQUM7SUFFRCxTQUFTLFFBQVEsQ0FBRyxXQUFtQjtRQUV0QyxRQUFTLFdBQVcsRUFDcEI7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLFdBQVcsQ0FBRSxNQUFNLEVBQUUsV0FBVyxDQUFFLENBQUM7Z0JBQ3ZELE1BQU07WUFDUCxLQUFLLENBQUM7Z0JBQ0wsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLFdBQVcsQ0FBRSxNQUFNLEVBQUUsSUFBSSxDQUFFLENBQUM7Z0JBQ2hELE1BQU07U0FDUDtJQUNGLENBQUM7SUFFRCxTQUFTLGdCQUFnQjtRQUV4QixDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsV0FBVyxDQUFFLE1BQU0sRUFBRSxlQUFlLENBQUUsQ0FBQztJQUM1RCxDQUFDO0lBRUQsU0FBUyxlQUFlLENBQUcsV0FBbUIsRUFBRSxTQUF1QixFQUFFLFdBQWdDO1FBRXhHLE1BQU0sTUFBTSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQXlCLENBQUM7UUFDMUQsQ0FBQyxDQUFFLHlCQUF5QixDQUFHLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUMxRCxNQUFNLGFBQWEsR0FBeUIsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUV0RCxLQUFLLENBQUMsV0FBVyxDQUFFLFFBQVEsQ0FBQztZQUUzQixLQUFNLE1BQU0sR0FBRyxJQUFJLFNBQVMsQ0FBQyxNQUFNLEVBQUUsRUFDckM7Z0JBQ0MsTUFBTSxLQUFLLENBQUMsS0FBSyxDQUFFLEdBQUcsQ0FBRSxDQUFDO2dCQUN6QixNQUFNLE1BQU0sR0FBRyxtQkFBbUIsQ0FBRSxHQUFHLENBQUUsQ0FBQztnQkFDMUMsYUFBYSxDQUFDLEdBQUcsQ0FBRSxHQUFHLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBRSxDQUFDO2dCQUMxQyxNQUFNLENBQUMsV0FBVyxDQUFFLFFBQVEsQ0FBRSxDQUFDO2FBQy9CO1FBQ0YsQ0FBQyxFQUFFLFdBQVcsQ0FBRSxDQUFDO1FBRWpCLEtBQUssQ0FBQyxXQUFXLENBQUUsUUFBUSxDQUFDO1lBRTNCLE9BQVEsSUFBSSxFQUNaO2dCQUNDLEtBQU0sTUFBTSxDQUFFLFFBQVEsRUFBRSxNQUFNLENBQUUsSUFBSSxhQUFhLEVBQ2pEO29CQUNDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsTUFBTSxDQUFDLG9CQUFvQixDQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsUUFBUSxDQUFFLENBQUM7b0JBQzlFLElBQUssUUFBUSxDQUFFLENBQUMsQ0FBRSxJQUFJLFFBQVEsQ0FBRSxDQUFDLENBQUUsSUFBSSxNQUFNLEVBQzdDO3dCQUNDLENBQUMsSUFBSSxJQUFJLENBQUM7d0JBQ1YsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxpQkFBaUIsR0FBRyxNQUFNLENBQUMsZUFBZSxHQUFHLEdBQUcsQ0FBQzt3QkFDN0QsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxrQkFBa0IsR0FBRyxNQUFNLENBQUMsZUFBZSxDQUFDO3dCQUN4RCxNQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxlQUFlLEdBQUcsQ0FBQyxHQUFHLE1BQU0sR0FBRyxDQUFDLEdBQUcsV0FBVyxDQUFDO3FCQUN4RTtpQkFDRDtnQkFDRCxNQUFNLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQzthQUN4QjtRQUNGLENBQUMsRUFBRSxXQUFXLENBQUUsQ0FBQztJQUNsQixDQUFDO0lBRUQsU0FBUyxhQUFhLENBQUcsT0FBZ0IsRUFBRSxJQUFZLEVBQUUsU0FBaUI7UUFFekUsTUFBTSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUUsYUFBYSxDQUFxQixDQUFDO1FBQ3ZGLElBQUssZ0JBQWdCLEVBQ3JCO1lBQ0MsZ0JBQWdCLENBQUMsR0FBRyxDQUFFLFlBQVksQ0FBQyxxQkFBcUIsQ0FBRSxJQUFJLENBQUUsRUFBRSxLQUFLLENBQUUsQ0FBQztZQUUxRSxJQUFLLFNBQVMsRUFDZDtnQkFDQyxNQUFNLE9BQU8sR0FBRyxnQkFBZ0IsQ0FBQyxpQkFBaUIsQ0FBRSxrQkFBa0IsQ0FBRSxDQUFDO2dCQUN6RSxJQUFLLE9BQU8sRUFDWjtvQkFDQyxPQUFPLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7aUJBQ3BDO2FBQ0Q7U0FDRDtJQUNGLENBQUM7SUFFRCxTQUFTLG1CQUFtQixDQUFHLEdBQWU7UUFFN0MsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQztRQUN4QixNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDO1FBRTlCLE1BQU0sT0FBTyxHQUFHLENBQUMsQ0FBRSx5QkFBeUIsQ0FBRyxDQUFDO1FBQ2hELE1BQU0sTUFBTSxHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUUsQ0FBQztRQUN0RSxNQUFNLENBQUMsa0JBQWtCLENBQUUsdUJBQXVCLENBQUUsQ0FBQztRQUdyRCxNQUFNLGFBQWEsR0FBRyxNQUFNLENBQUMscUJBQXFCLENBQUUsYUFBYSxDQUF1QixDQUFDO1FBQ3pGLGFBQWEsQ0FBQyxzQkFBc0IsQ0FBRSxZQUFZLENBQUMsYUFBYSxDQUFFLEtBQUssQ0FBRSxDQUFFLENBQUM7UUFHNUUsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLHFCQUFxQixDQUFFLE1BQU0sQ0FBYSxDQUFDO1FBQ2pFLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBRSxtQkFBbUIsRUFBRSxZQUFZLENBQUMsYUFBYSxDQUFFLEtBQUssQ0FBRSxDQUFFLENBQUM7UUFDeEYsTUFBTSxTQUFTLEdBQUcsWUFBWSxDQUFDLGNBQWMsQ0FBRSxLQUFLLENBQUUsQ0FBQztRQUN2RCxJQUFLLFNBQVM7WUFDYixNQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7UUFFcEMsYUFBYSxDQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxDQUFFLENBQUM7UUFFMUMsT0FBTyxNQUFNLENBQUM7SUFDZixDQUFDO0lBRUQsU0FBUyxZQUFZLENBQUcsVUFBa0I7UUFFekMsTUFBTSxNQUFNLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBeUIsQ0FBQztRQUUxRCxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUM7UUFFckIsTUFBTSxTQUFTLEdBQWlCLEVBQUUsQ0FBQztRQUNuQyxLQUFNLElBQUksUUFBUSxHQUFHLENBQUMsR0FBRyxFQUFFLFFBQVEsRUFDbkM7WUFDQyxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFFLFVBQVUsRUFBRSxRQUFRLENBQUUsQ0FBQztZQUNwRCxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDO1lBQ3hCLElBQUssQ0FBQyxLQUFLO2dCQUNWLE1BQU07WUFFUCxNQUFNLEdBQUcsR0FBZSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsQ0FBQztZQUM1QyxTQUFTLENBQUMsSUFBSSxDQUFFLEdBQUcsQ0FBRSxDQUFDO1NBQ3RCO1FBRUQsT0FBTyxTQUFTLENBQUM7SUFDbEIsQ0FBQztJQUVELFNBQVMsU0FBUyxDQUFHLFFBQWlCLEVBQUUsa0JBQTBCO1FBRWpFLE1BQU0sTUFBTSxHQUFHLENBQUMsQ0FBRSxnQkFBZ0IsQ0FBRyxDQUFDO1FBQ3RDLE1BQU0sQ0FBQyxLQUFLLENBQUMsa0JBQWtCLEdBQUcsR0FBRyxrQkFBa0IsR0FBRyxDQUFDO1FBQzNELE1BQU0sQ0FBQyxXQUFXLENBQUUsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFFLENBQUM7SUFDM0MsQ0FBQztJQUVELFNBQVMsWUFBWSxDQUFHLFdBQW1CO1FBRTFDLE1BQU0sUUFBUSxHQUFHLFlBQVksQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUMvQyxNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDO1FBQ3BDLE1BQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQyxTQUFTLEtBQUssQ0FBQyxDQUFDO1FBRTVDLENBQUMsQ0FBRSxrQkFBa0IsQ0FBRyxDQUFDLFdBQVcsQ0FBRSxRQUFRLENBQUUsQ0FBQztRQUVqRCxNQUFNLE1BQU0sR0FBRyxDQUFDLENBQUUsZ0JBQWdCLENBQWEsQ0FBQztRQUNoRCxNQUFNLFdBQVcsR0FBRyxDQUFDLENBQUUscUJBQXFCLENBQWEsQ0FBQztRQUMxRCxNQUFNLFdBQVcsR0FBRyxDQUFDLENBQUUscUJBQXFCLENBQWEsQ0FBQztRQUUxRCxJQUFLLFFBQVEsQ0FBQyxZQUFZLEVBQzFCO1lBQ0MsV0FBVyxDQUFDLFdBQVcsQ0FBRSxVQUFVLENBQUUsQ0FBQztZQUN0QyxJQUFLLFNBQVMsR0FBRyxDQUFDLEVBQ2xCO2dCQUNDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBRSxjQUFjLEVBQUUsU0FBUyxDQUFFLENBQUM7Z0JBQzlELFdBQVcsQ0FBQyxZQUFZLENBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDLENBQUMsaUNBQWlDLENBQUUsQ0FBQzthQUMvRztpQkFFRDtnQkFDQyxXQUFXLENBQUMsWUFBWSxDQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLHNCQUFzQixDQUFFLENBQUM7YUFDekY7U0FDRDthQUVEO1lBQ0MsV0FBVyxDQUFDLFFBQVEsQ0FBRSxVQUFVLENBQUUsQ0FBQztTQUNuQztRQUVELFFBQVMsV0FBVyxFQUNwQjtZQUNDLEtBQUssQ0FBQztnQkFDTCxJQUFLLE1BQU0sRUFDWDtvQkFDQyxNQUFNLENBQUMsUUFBUSxDQUFFLGtDQUFrQyxDQUFFLENBQUM7aUJBQ3REO2dCQUNELFdBQVcsQ0FBQyxZQUFZLENBQUUsU0FBUyxJQUFJLENBQUMsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLDJCQUEyQixDQUFDLENBQUMsQ0FBQywwQkFBMEIsQ0FBRSxDQUFDO2dCQUNwSCxNQUFNO1lBQ1AsS0FBSyxDQUFDO2dCQUNMLElBQUssTUFBTSxFQUNYO29CQUNDLE1BQU0sQ0FBQyxRQUFRLENBQUUsbUNBQW1DLENBQUUsQ0FBQztpQkFDdkQ7Z0JBQ0QsV0FBVyxDQUFDLFlBQVksQ0FBRSxTQUFTLElBQUksQ0FBQyxJQUFJLFVBQVUsQ0FBQyxDQUFDLENBQUMsNEJBQTRCLENBQUMsQ0FBQyxDQUFDLDJCQUEyQixDQUFFLENBQUM7Z0JBQ3RILE1BQU07U0FDUDtJQUNGLENBQUM7SUFLRDtRQUNDLENBQUMsQ0FBQyx5QkFBeUIsQ0FBRSxnQkFBZ0IsRUFBRSxlQUFlLENBQUUsQ0FBQztLQUNqRTtBQUNGLENBQUMsRUF0UVMsYUFBYSxLQUFiLGFBQWEsUUFzUXRCIn0=