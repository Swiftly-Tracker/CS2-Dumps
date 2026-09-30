"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="mission_tile.ts" />
$.LogChannel('p.progressbar', "LV_OFF");
var SegmentedProgressBar;
(function (SegmentedProgressBar) {
    const WHOLE_BAR_WIDTH = 180;
    const PROGRESS_PIP_WIDTH = 24;
    const SEGMENT_MARGIN_LEFT = 1;
    const SEGMENT_MARGIN_RIGHT = 1;
    class CSegment {
        min;
        max;
        totalMax;
        elRoot;
        elProg;
        elPip;
        constructor(parent, name, min, max, totalMax, addPip, numSegments) {
            this.totalMax = totalMax;
            this.min = min;
            this.max = max;
            this.elRoot = $.CreatePanel('Panel', parent, name);
            this.elRoot.BLoadLayoutSnippet("snippet__progress-bar-segment");
            this.elProg = this.elRoot.FindChildTraverse('pbs-progressbar');
            this.elProg.max = this.max;
            this.elProg.min = this.min;
            this.elProg.value = 0;
            const totalWidth = WHOLE_BAR_WIDTH - (numSegments * PROGRESS_PIP_WIDTH);
            const fractionOfTotalProgress = (this.max - this.min) / totalMax;
            const segmentBarWidth = fractionOfTotalProgress * totalWidth;
            const segmentBarWidthWithPip = segmentBarWidth + PROGRESS_PIP_WIDTH;
            this.elRoot.style.width = segmentBarWidthWithPip + 'px';
            this.elProg.style.marginLeft = SEGMENT_MARGIN_LEFT + 'px';
            this.elProg.style.marginRight = SEGMENT_MARGIN_RIGHT + 'px';
            const elPip = this.elRoot.FindChildTraverse('pbs-progresspip');
            const goalLabel = this.elRoot.FindChildTraverse('pbs-progress-goal-label');
            elPip.style.visibility = addPip ? 'visible' : 'collapse';
            elPip.style.width = PROGRESS_PIP_WIDTH + 'px';
            elPip.style.height = PROGRESS_PIP_WIDTH + 'px';
            this.elPip = elPip;
            goalLabel.SetDialogVariableInt('goal-checkpoint', this.max);
            $.Msg('[p.progressbar] ' + $.GetContextPanel().id + ': ' + name + ' ' + min + ' ' + max + ' ' + totalMax + ' ' + totalWidth);
        }
        setValue(value) {
            this.elProg.value = value;
            if (value >= this.max) {
                this.elRoot.SwitchClass('state', 'complete');
            }
            else if (value < this.min) {
                this.elRoot.SwitchClass('state', 'future');
            }
            else {
                this.elRoot.SwitchClass('state', 'current');
            }
        }
    }
    class CWholeBar {
        segments;
        constructor(elParent, barType, missionData) {
            this.segments = [];
            const arrGoals = missionData.goal_points;
            const arrXpRewards = missionData.xp_reward;
            for (let i = 0; i < arrGoals.length; i++) {
                let min = 0;
                let max = arrGoals[i];
                if (i > 0) {
                    min = arrGoals[i - 1];
                    max = arrGoals[i];
                }
                const totalGoal = arrGoals.slice(-1)[0];
                const addPip = arrGoals.length > 1;
                const seg = new CSegment(elParent, barType + i, min, max, totalGoal, addPip, arrGoals.length);
                this.segments.push(seg);
                if (barType == "Base") {
                    seg.elRoot.SetDialogVariableInt('mission-points', max - min);
                    seg.elRoot.SetDialogVariableInt('xp-reward', arrXpRewards[i]);
                    seg.elRoot.SetPanelEvent('onmouseover', () => {
                        const strTooltip = $.Localize("#mission_segment_tooltip", seg.elRoot);
                        UiToolkitAPI.ShowTextTooltipOnPanelStyled(seg.elRoot, strTooltip, 'mission-segment-tooltip');
                    });
                    seg.elRoot.SetPanelEvent('onmouseout', () => {
                        UiToolkitAPI.HideTextTooltip();
                    });
                }
            }
        }
        setBarValue(val) {
            for (let i = 0; i < this.segments.length; i++) {
                let seg = this.segments[i];
                seg.setValue(val);
            }
        }
    }
    function CreateSegmentedProgressBar(elPanel, missionData) {
        elPanel.BLoadLayout('file://{resources}/layout/segmented_progress_bar.xml', true, false);
        elPanel.Data().m_backgroundProgBar = new CWholeBar(elPanel.FindChildTraverse('spbBackground'), 'Background', missionData);
        elPanel.Data().m_liveProgBar = new CWholeBar(elPanel.FindChildTraverse('spbLive'), 'Live', missionData);
        elPanel.Data().m_baseProgBar = new CWholeBar(elPanel.FindChildTraverse('spbBase'), 'Base', missionData);
        MissionTile.ExtractStringTokens(elPanel.FindChildTraverse('spbBase'), missionData.string_tokens);
        elPanel.style.width = WHOLE_BAR_WIDTH + 'px';
    }
    SegmentedProgressBar.CreateSegmentedProgressBar = CreateSegmentedProgressBar;
    function Init(elPanel, missionData) {
        elPanel.RemoveAndDeleteChildren();
        CreateSegmentedProgressBar(elPanel, missionData);
    }
    SegmentedProgressBar.Init = Init;
    function SetValue(elPanel, val, bar) {
        if (elPanel && elPanel.IsValid() && elPanel.Data().m_liveProgBar) {
            switch (bar) {
                case 'Live':
                    elPanel.Data().m_liveProgBar.setBarValue(val);
                    break;
                case 'Base':
                    elPanel.Data().m_baseProgBar.setBarValue(val);
                    break;
            }
            elPanel.Data().m_backgroundProgBar.setBarValue(val);
        }
    }
    SegmentedProgressBar.SetValue = SetValue;
})(SegmentedProgressBar || (SegmentedProgressBar = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VnbWVudGVkX3Byb2dyZXNzX2Jhci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3NlZ21lbnRlZF9wcm9ncmVzc19iYXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUNsQyx3Q0FBd0M7QUFFeEMsQ0FBQyxDQUFDLFVBQVUsQ0FBRSxlQUFlLEVBQUUsUUFBUSxDQUFFLENBQUM7QUFJMUMsSUFBVSxvQkFBb0IsQ0F3SzdCO0FBeEtELFdBQVUsb0JBQW9CO0lBRTdCLE1BQU0sZUFBZSxHQUFHLEdBQUcsQ0FBQztJQUM1QixNQUFNLGtCQUFrQixHQUFHLEVBQUUsQ0FBQztJQUM5QixNQUFNLG1CQUFtQixHQUFHLENBQUMsQ0FBQztJQUM5QixNQUFNLG9CQUFvQixHQUFHLENBQUMsQ0FBQztJQUcvQixNQUFNLFFBQVE7UUFFYixHQUFHLENBQVM7UUFDWixHQUFHLENBQVM7UUFDWixRQUFRLENBQVM7UUFDakIsTUFBTSxDQUFVO1FBQ2hCLE1BQU0sQ0FBZ0I7UUFDdEIsS0FBSyxDQUFVO1FBRWYsWUFBYSxNQUFlLEVBQUUsSUFBWSxFQUFFLEdBQVcsRUFBRSxHQUFXLEVBQUUsUUFBZ0IsRUFBRSxNQUFlLEVBQUUsV0FBbUI7WUFFM0gsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7WUFDekIsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7WUFDZixJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztZQUVmLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBRSxDQUFDO1lBQ3JELElBQUksQ0FBQyxNQUFNLENBQUMsa0JBQWtCLENBQUUsK0JBQStCLENBQUUsQ0FBQztZQUVsRSxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsaUJBQWlC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