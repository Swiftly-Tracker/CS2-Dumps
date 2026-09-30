"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/iteminfo.ts" />
var CharacterButtons;
(function (CharacterButtons) {
    function _PopulateWeaponDropdownForCharacter(elDropdown, modelPanelSettings) {
        const list = ItemInfo.GetLoadoutWeapons(modelPanelSettings.team);
        if (!list || list.length == 0) {
            return;
        }
        elDropdown.RemoveAllOptions();
        for (let entry of list) {
            const newEntry = $.CreatePanel('Panel', elDropdown, entry[1], {
                'class': 'DropDownMenu'
            });
            newEntry.SetAcceptsFocus(true);
            const elRarity = $.CreatePanel('Label', newEntry, 'rarity');
            elRarity.style.width = '100%';
            elRarity.style.height = '100%';
            elRarity.style.padding = '0px 0px';
            const rarityColor = InventoryAPI.GetItemRarityColor(entry[1]);
            elRarity.style.backgroundColor = "gradient( linear, 0% 0%, 100% 0%, from(" + rarityColor + " ),  color-stop( 0.0125, #00000000 ), to( #00000000 ) );";
            const elLabel = $.CreatePanel('Label', newEntry, 'label', {
                'text': InventoryAPI.GetItemName(entry[1])
            });
            elDropdown.AddOption(newEntry);
        }
        elDropdown.SetPanelEvent('oninputsubmit', () => _OnUpdateWeaponSelection(elDropdown, modelPanelSettings));
        elDropdown.SetSelected(modelPanelSettings.weaponItemId);
    }
    function _OnUpdateWeaponSelection(elDropdown, modelPanelSettings) {
        modelPanelSettings.weaponItemId = elDropdown.GetSelected() ? elDropdown.GetSelected().id : "";
        modelPanelSettings.panel.SetActiveCharacter(5);
        CharacterAnims.PlayAnimsOnPanel(modelPanelSettings);
    }
    ;
    function ZoomCamera() {
        const data = $.GetContextPanel().Data();
        const elZoomButton = $.GetContextPanel().FindChildInLayoutFile('LoadoutSingleItemModelZoom');
        if (elZoomButton.checked) {
            data.m_modelPanelSettings.panel.TransitionToCamera('cam_char_inspect_closeup', 0.5);
        }
        else {
            data.m_modelPanelSettings.panel.TransitionToCamera('cam_char_inspect_wide', 0.5);
        }
    }
    CharacterButtons.ZoomCamera = ZoomCamera;
    function PlayCheer() {
        const elZoomButton = $.GetContextPanel().FindChildInLayoutFile('LoadoutSingleItemModelZoom');
        if (elZoomButton.checked)
            elZoomButton.checked = false;
        const data = $.GetContextPanel().Data();
        data.m_modelPanelSettings.cameraPreset = data.m_characterToolbarButtonSettings.cameraPresetUnzoomed;
        const modelRenderSettingsOneOffTempCopy = ItemInfo.DeepCopyVanityCharacterSettings(data.m_modelPanelSettings);
        modelRenderSettingsOneOffTempCopy.cheer = InventoryAPI.GetCharacterDefaultCheerByItemId(modelRenderSettingsOneOffTempCopy.charItemId);
        CharacterAnims.PlayAnimsOnPanel(modelRenderSettingsOneOffTempCopy);
    }
    CharacterButtons.PlayCheer = PlayCheer;
    function PlayDefeat() {
        const elZoomButton = $.GetContextPanel().FindChildInLayoutFile('LoadoutSingleItemModelZoom');
        if (elZoomButton.checked)
            elZoomButton.checked = false;
        const data = $.GetContextPanel().Data();
        data.m_modelPanelSettings.cameraPreset = data.m_characterToolbarButtonSettings.cameraPresetUnzoomed;
        const modelRenderSettingsOneOffTempCopy = ItemInfo.DeepCopyVanityCharacterSettings(data.m_modelPanelSettings);
        modelRenderSettingsOneOffTempCopy.cheer = InventoryAPI.GetCharacterDefaultDefeatByItemId(modelRenderSettingsOneOffTempCopy.charItemId);
        CharacterAnims.PlayAnimsOnPanel(modelRenderSettingsOneOffTempCopy);
    }
    CharacterButtons.PlayDefeat = PlayDefeat;
    function UpdateScenery() {
        UiToolkitAPI.ShowCustomLayoutContextMenuParametersDismissEvent('id-inspect-contextmenu-maps', '', 'file://{resources}/layout/context_menus/context_menu_mainmenu_vanity.xml', 'type=maps' +
            '&' + 'inspect-map=true', () => $.DispatchEvent('ContextMenuEvent', ''));
    }
    CharacterButtons.UpdateScenery = UpdateScenery;
    function PreviewModelVoice() {
        const data = $.GetContextPanel().Data();
        InventoryAPI.PreviewModelVoice(data.m_modelPanelSettings.charItemId);
    }
    CharacterButtons.PreviewModelVoice = PreviewModelVoice;
    function InitCharacterButtons(elButtons, elPreviewpanel, characterButtonSettings) {
        if (!elButtons)
            return;
        elButtons.Children().forEach(el => el.enabled = true);
        if (!elPreviewpanel)
            return;
        const elZoomButton = elButtons.FindChildInLayoutFile('LoadoutSingleItemModelZoom');
        const modelPanelSettings = ItemInfo.GetOrUpdateVanityCharacterSettings(characterButtonSettings.charItemId);
        modelPanelSettings.panel = elPreviewpanel;
        modelPanelSettings.cameraPreset = elZoomButton.checked ? characterButtonSettings.cameraPresetZoomed : characterButtonSettings.cameraPresetUnzoomed;
        const elDropdown = elButtons.FindChildInLayoutFile('LoadoutSingleItemModelWeaponChoice');
        _PopulateWeaponDropdownForCharacter(elDropdown, modelPanelSettings);
        const cheer = ItemInfo.GetDefaultCheer(modelPanelSettings.charItemId);
        const elCheer = elButtons.FindChildInLayoutFile('PlayCheer');
        elCheer.enabled = cheer != undefined && cheer != "";
        const defeat = ItemInfo.GetDefaultDefeat(modelPanelSettings.charItemId);
        const elDefeat = elButtons.FindChildInLayoutFile('PlayDefeat');
        elDefeat.enabled = defeat != undefined && defeat != "";
        elButtons.Data().m_characterToolbarButtonSettings = characterButtonSettings;
        elButtons.Data().m_modelPanelSettings = modelPanelSettings;
    }
    CharacterButtons.InitCharacterButtons = InitCharacterButtons;
})(CharacterButtons || (CharacterButtons = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhcmFjdGVyYnV0dG9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL2NoYXJhY3RlcmJ1dHRvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUNsQywyQ0FBMkM7QUFFM0MsSUFBVSxnQkFBZ0IsQ0FpS3pCO0FBaktELFdBQVUsZ0JBQWdCO0lBZXpCLFNBQVMsbUNBQW1DLENBQUcsVUFBc0IsRUFBRSxrQkFBc0U7UUFFNUksTUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLGlCQUFpQixDQUFFLGtCQUFrQixDQUFDLElBQUksQ0FBRSxDQUFDO1FBRW5FLElBQUssQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQzlCO1lBQ0MsT0FBTztTQUNQO1FBRUQsVUFBVSxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFFOUIsS0FBTSxJQUFJLEtBQUssSUFBSSxJQUFJLEVBQ3ZCO1lBQ0MsTUFBTSxRQUFRLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDOUQsT0FBTyxFQUFFLGNBQWM7YUFDdkIsQ0FBRSxDQUFDO1lBQ0osUUFBUSxDQUFDLGVBQWUsQ0FBRSxJQUFJLENBQUUsQ0FBQztZQUVqQyxNQUFNLFFBQVEsR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsUUFBUSxDQUFFLENBQUM7WUFDOUQsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDO1lBQzlCLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztZQUMvQixRQUFRLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxTQUFTLENBQUM7WUFDbkMsTUFBTSxXQUFXLEdBQUcsWUFBWSxDQUFDLGtCQUFrQixDQUFFLEtB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