"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/promoted_settings.ts" />
var SettingsMenuPromoted;
(function (SettingsMenuPromoted) {
    class CreatePromotedSettingEntry {
        id;
        loc_name;
        loc_desc;
        setting;
        elRoot;
        elemID;
        constructor(setting) {
            this.id = setting.id;
            this.loc_name = setting.loc_name;
            this.loc_desc = setting.loc_desc;
            this.setting = setting;
            this.elRoot = $('#SettingContainer');
            this.elemID = "PromotedSetting__" + setting.id;
        }
        view() {
            $.DispatchEvent("SettingsMenu_NavigateToSetting", this.setting.section, this.setting.subsection ?? '', this.setting.id);
        }
        createPanel() {
            let elNewSetting = $.CreatePanel("Panel", this.elRoot, this.elemID);
            if (elNewSetting.BLoadLayoutSnippet("PromotedSetting")) {
                elNewSetting.FindChild("SettingName").text = $.Localize(this.loc_name);
                elNewSetting.FindChild("SettingDesc").text = $.Localize(this.loc_desc);
                elNewSetting.FindChildTraverse("ViewSetting").SetPanelEvent('onactivate', () => this.view());
                if (this.setting.highlight) {
                    elNewSetting.AddClass("Highlight");
                }
            }
        }
    }
    function _Init() {
        // Decorate settings this client hasn't seen yet
        let arrUnacknowledgedSettings = PromotedSettingsUtil.GetUnacknowledgedPromotedSettings();
        arrUnacknowledgedSettings.forEach(setting => setting.highlight = true);
        for (const setting of g_PromotedSettings) {
            const now = new Date();
            if (setting.end_date > now && setting.start_date <= now) {
                let elGoToSettingPanel = new CreatePromotedSettingEntry(setting);
                elGoToSettingPanel.createPanel();
            }
        }
        if (arrUnacknowledgedSettings.length > 0) {
            // Update last viewed time if we have unacknowledged settings
            $.DispatchEvent("MainMenu_PromotedSettingsViewed");
        }
    }
    // On creation
    {
        _Init();
    }
})(SettingsMenuPromoted || (SettingsMenuPromoted = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3NtZW51X3Byb21vdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvc2V0dGluZ3NtZW51X3Byb21vdGVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFDbEMsb0RBQW9EO0FBRXBELElBQVUsb0JBQW9CLENBdUU3QjtBQXZFRCxXQUFVLG9CQUFvQjtJQUU3QixNQUFNLDBCQUEwQjtRQUUvQixFQUFFLENBQVM7UUFDWCxRQUFRLENBQVM7UUFDakIsUUFBUSxDQUFTO1FBRVQsT0FBTyxDQUFvQjtRQUMzQixNQUFNLENBQVU7UUFDaEIsTUFBTSxDQUFTO1FBRXZCLFlBQWEsT0FBMEI7WUFFdEMsSUFBSSxDQUFDLEVBQUUsR0FBRyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ3JCLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQztZQUNqQyxJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUM7WUFFakMsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7WUFDdkIsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsbUJBQW1CLENBQUMsQ0FBQztZQUNyQyxJQUFJLENBQUMsTUFBTSxHQUFHLG1CQUFtQixHQUFHLE9BQU8sQ0FBQyxFQUFFLENBQUM7UUFDaEQsQ0FBQztRQUVELElBQUk7WUFFSCxDQUFDLENBQUMsYUFBYSxDQUFFLGdDQUFnQyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxJQUFJLEVBQUUsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBRSxDQUFDO1FBQzNILENBQUM7UUFFRCxXQUFXO1lBRVYsSUFBSSxZQUFZLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFFLENBQUM7WUFDdEUsSUFBSyxZQUFZLENBQUMsa0JBQWtCLENBQUUsaUJBQWlCLENBQUUsRUFDekQ7Z0JBQ0csWUFBWSxDQUFDLFNBQVMsQ0FBRSxhQUFhLENBQWUsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxJQUFJLENBQUMsUUFBUSxDQUFFLENBQUM7Z0JBQ3hGLFlBQVksQ0FBQyxTQUFTLENBQUUsYUFBYSxDQUFlLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBRSxDQUFDO2dCQUMxRixZQUFZLENBQUMsaUJBQWlCLENBQUUsYUFBYSxDQUFFLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUUsQ0FBQztnQkFDakcsSUFBSyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFDM0I7b0JBQ0MsWUFBWSxDQUFDLFFBQVEsQ0FBRSxXQUFXLENBQUUsQ0FBQztpQkFDckM7YUFDRDtRQUNGLENBQUM7S0FDRDtJQUVELFNBQVMsS0FBSztRQUViLGdEQUFnRDtRQUNoRCxJQUFJLHlCQUF5QixHQUFHLG9CQUFvQixDQUFDLGlDQUFpQyxFQUFFLENBQUE7UUFDeEYseUJBQXlCLENBQUMsT0FBTyxDQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUUsQ0FBQztRQUV6RSxLQUFNLE1BQU0sT0FBTyxJQUFJLGtCQUFrQixFQUN6QztZQUNDLE1BQU0sR0FBRyxHQUFHLElBQUksSUFBSSxFQUFFLENBQUM7WUFDdkIsSUFBSyxPQUFPLENBQUMsUUFBUSxHQUFHLEdBQUcsSUFBSSxPQUFPLENBQUMsVUFBVSxJQUFJLEdBQUcsRUFDeEQ7Z0JBQ0MsSUFBSSxrQkFBa0IsR0FBRyxJQUFJLDBCQUEwQixDQUFFLE9BQU8sQ0FBRSxDQUFDO2dCQUNuRSxrQkFBa0IsQ0FBQyxXQUFXLEVBQUUsQ0FBQzthQUNqQztTQUNEO1FBRUQsSUFBSyx5QkFBeUIsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUN6QztZQUNDLDZEQUE2RDtZQUM3RCxDQUFDLENBQUMsYUFBYSxDQUFFLGlDQUFpQyxDQUFFLENBQUM7U0FDckQ7SUFDRixDQUFDO0lBRUQsY0FBYztJQUNkO1FBQ0MsS0FBSyxFQUFFLENBQUM7S0FDUjtBQUNGLENBQUMsRUF2RVMsb0JBQW9CLEtBQXBCLG9CQUFvQixRQXVFN0IifQ==