"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../inspect.ts" />
/// <reference path="../common/iteminfo.ts" />
/// <reference path="popup_can_apply_pick_slot.ts" />
/// <reference path="popup_inspect_async-bar.ts" />
var CapabilityCanPatch;
(function (CapabilityCanPatch) {
    // let m_prevCameraSlot: number = 0;
    // let m_firstCameraAnim: boolean = false;
    // let m_pos = 0;
    //--------------------------------------------------------------------------------------------------
    function ResetPos() {
        $.GetContextPanel().Data().charCardinal = 'e';
        $.GetContextPanel().Data().bFirstCameraAnim = false;
        $.GetContextPanel().Data().prevCameraSlot = 0;
    }
    CapabilityCanPatch.ResetPos = ResetPos;
    function PreviewPatchOnChar(toolId, activeIndex, contextPanel) {
        $.DispatchEvent('CSGOPlaySoundEffect', 'sticker_nextPosition', 'MOUSE');
        let elPreviewPanel = contextPanel.FindChildInLayoutFile('CanApplyItemModel');
        let elCharPanel = elPreviewPanel.FindChildInLayoutFile("CharPreviewPanel");
        if (!elCharPanel || !elCharPanel.IsValid()) {
            return;
        }
        InventoryAPI.PreviewStickerInModelPanel(toolId, activeIndex, elCharPanel);
        CameraAnim(activeIndex, contextPanel);
    }
    CapabilityCanPatch.PreviewPatchOnChar = PreviewPatchOnChar;
    ;
    //--------------------------------------------------------------------------------------------------
    // camera
    //--------------------------------------------------------------------------------------------------
    function CameraAnim(activeIndex, contextPanel) {
        let prevCameraSlot = contextPanel.Data().prevCameraSlot;
        if ((prevCameraSlot === activeIndex || activeIndex == -1) && prevCameraSlot)
            return;
        let elPreviewPanel = contextPanel.FindChildInLayoutFile('CanApplyItemModel');
        if (!InventoryAPI.IsItemInfoValid(elPreviewPanel.Data().id))
            return;
        contextPanel.Data().bFirstCameraAnim = true;
        InventoryAPI.HighlightPatchBySlot(activeIndex);
        _UpdatePreviewPanelSettingsForPatchPosition(elPreviewPanel.Data().id, activeIndex, contextPanel);
        prevCameraSlot = activeIndex;
    }
    CapabilityCanPatch.CameraAnim = CameraAnim;
    ;
    let m_positionData = [
        { type: 'chest', loadoutSlot: 'melee', direction: 'e' },
        { type: 'rightarm', loadoutSlot: 'rifle1', direction: 'n' },
        { type: 'rightleg', loadoutSlot: 'rifle1', direction: 'n' },
        { type: 'rightside', loadoutSlot: 'rifle1', direction: 'n' },
        { type: 'back', loadoutSlot: 'rifle1', direction: 'w' },
        { type: 'leftarm', loadoutSlot: 'rifle1', direction: 's' },
        { type: 'leftside', loadoutSlot: 'rifle1', direction: 's' },
        { type: 'leftleg', loadoutSlot: 'rifle1', direction: 's' },
    ];
    function _UpdatePreviewPanelSettingsForPatchPosition(charItemId, activeIndex = 0, contextPanel) {
        const elPreviewPanel = contextPanel.FindChildInLayoutFile('CanApplyItemModel');
        const charTeam = InventoryAPI.GetItemTeam(elPreviewPanel.Data().id);
        const setting_team = charTeam.search('Team_CT') !== -1 ? 'ct' : 't';
        const patchPosition = InventoryAPI.GetCharacterPatchPosition(charItemId, activeIndex.toString());
        const oPositionData = m_positionData.filter(entry => entry.type === patchPosition)[0];
        if (!oPositionData) {
            $.Msg('No position data that matches the patch position you want to look at.');
            contextPanel.Data().bFirstCameraAnim = false; // if the VMDL was not available, then allow re-lookup of the patch positions
            return;
        }
        InspectModelImage.SetCharScene(elPreviewPanel.Data().id, LoadoutAPI.GetItemID(setting_team, oPositionData.loadoutSlot), contextPanel);
        if (contextPanel.Data().charCardinal !== oPositionData.direction) {
            contextPanel.Data().charCardinal = oPositionData.direction;
        }
        $.Msg('charCardinal :' + contextPanel.Data().charCardinal + ', oPositionData.direction: ' + oPositionData.direction + ', oPositionData.loadoutSlot: ' + oPositionData.loadoutSlot + ', activeIndex: ' + activeIndex);
        const elModelPanel = elPreviewPanel.FindChildInLayoutFile("CharPreviewPanel");
        $.Schedule(.1, () => { elModelPanel.SetCardinalFacing(contextPanel.Data().charCardinal); });
        const camSuffix = !patchPosition ? 'wide_intro' : patchPosition + _CameraForModel(charItemId, activeIndex);
        $.Msg('camSuffix: ' + camSuffix + ' cam name: ' + 'cam_char_inspect_' + camSuffix);
        elModelPanel.Data().camera = 'char_inspect_' + camSuffix;
        elModelPanel.TransitionToCamera('cam_char_inspect_' + camSuffix, 1.2);
    }
    function _CameraForModel(charItemId, activeIndex) {
        const modelplayer = ItemInfo.GetModelPlayer(charItemId);
        if (modelplayer.indexOf('tm_jungle_raider_variantb2') !== -1 && activeIndex === 2) {
            return '_low';
        }
        if (modelplayer.indexOf('tm_professional_letg') !== -1 && activeIndex === 0) {
            return '_shoulder';
        }
        if (modelplayer.indexOf('tm_professional_letg') !== -1 && activeIndex === 2) {
            return '_offset';
        }
        if (modelplayer.indexOf('tm_professional_leth') !== -1 && activeIndex === 2) {
            return '_shoulder_top_left';
        }
        return '';
    }
})(CapabilityCanPatch || (CapabilityCanPatch = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfY2FwYWJpbGl0eV9jYW5fcGF0Y2guanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfY2FwYWJpbGl0eV9jYW5fcGF0Y2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyxzQ0FBc0M7QUFDdEMsOENBQThDO0FBQzlDLHFEQUFxRDtBQUNyRCxtREFBbUQ7QUFFbkQsSUFBVSxrQkFBa0IsQ0EwSDNCO0FBMUhELFdBQVUsa0JBQWtCO0lBRTNCLG9DQUFvQztJQUNwQywwQ0FBMEM7SUFDMUMsaUJBQWlCO0lBRWpCLG9HQUFvRztJQUNwRyxTQUFnQixRQUFRO1FBRXZCLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxZQUFZLEdBQUcsR0FBRyxDQUFBO1FBQzdDLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxnQkFBZ0IsR0FBRyxLQUFLLENBQUM7UUFDcEQsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDLGNBQWMsR0FBRyxDQUFDLENBQUM7SUFDL0MsQ0FBQztJQUxlLDJCQUFRLFdBS3ZCLENBQUE7SUFFRCxTQUFnQixrQkFBa0IsQ0FBRSxNQUFjLEVBQUUsV0FBbUIsRUFBRSxZQUFxQjtRQUU3RixDQUFDLENBQUMsYUFBYSxDQUFFLHFCQUFxQixFQUFFLHNCQUFzQixFQUFFLE9BQU8sQ0FBRSxDQUFDO1FBQzFFLElBQUksY0FBYyxHQUFHLFlBQVksQ0FBQyxxQkFBcUIsQ0FBRSxtQkFBbUIsQ0FBRSxDQUFDO1FBQy9FLElBQUksV0FBVyxHQUFHLGNBQWMsQ0FBQyxxQkFBcUIsQ0FBRSxrQkFBa0IsQ0FBRSxDQUFDO1FBRTdFLElBQUksQ0FBQyxXQUFXLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLEVBQzFDO1lBQ0MsT0FBTztT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