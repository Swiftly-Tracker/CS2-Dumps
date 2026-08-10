"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="mission_tile.ts" />
var SegmentedProgressBar;
(function (SegmentedProgressBar) {
    function _msg(text) {
    }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VnbWVudGVkX3Byb2dyZXNzX2Jhci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3NlZ21lbnRlZF9wcm9ncmVzc19iYXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUNsQyx3Q0FBd0M7QUFJeEMsSUFBVSxvQkFBb0IsQ0E2SzdCO0FBN0tELFdBQVUsb0JBQW9CO0lBRTdCLFNBQVMsSUFBSSxDQUFHLElBQVk7SUFHNUIsQ0FBQztJQUVELE1BQU0sZUFBZSxHQUFHLEdBQUcsQ0FBQztJQUM1QixNQUFNLGtCQUFrQixHQUFHLEVBQUUsQ0FBQztJQUM5QixNQUFNLG1CQUFtQixHQUFHLENBQUMsQ0FBQztJQUM5QixNQUFNLG9CQUFvQixHQUFHLENBQUMsQ0FBQztJQUcvQixNQUFNLFFBQVE7UUFFYixHQUFHLENBQVM7UUFDWixHQUFHLENBQVM7UUFDWixRQUFRLENBQVM7UUFDakIsTUFBTSxDQUFVO1FBQ2hCLE1BQU0sQ0FBZ0I7UUFDdEIsS0FBSyxDQUFVO1FBRWYsWUFBYSxNQUFlLEVBQUUsSUFBWSxFQUFFLEdBQVcsRUFBRSxHQUFXLEVBQUUsUUFBZ0IsRUFBRSxNQUFlLEVBQUUsV0FBbUI7WUFFM0gsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7WUFDekIsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7WUFDZixJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztZQUVmLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBRSxDQUFDO1lBQ3JELElBQUksQ0FBQyxNQUFNLENBQUMsa0JBQWtCLENBQUUsK0JBQStCLENBQUUsQ0FBQztZQUVsRSxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUUsaUJBQWlCLENB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