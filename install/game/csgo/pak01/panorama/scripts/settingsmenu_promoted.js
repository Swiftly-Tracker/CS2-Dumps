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
            $.DispatchEvent("MainMenu_PromotedSettingsViewed");
        }
    }
    {
        _Init();
    }
})(SettingsMenuPromoted || (SettingsMenuPromoted = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3NtZW51X3Byb21vdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvc2V0dGluZ3NtZW51X3Byb21vdGVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFDbEMsb0RBQW9EO0FBRXBELElBQVUsb0JBQW9CLENBdUU3QjtBQXZFRCxXQUFVLG9CQUFvQjtJQUU3QixNQUFNLDBCQUEwQjtRQUUvQixFQUFFLENBQVM7UUFDWCxRQUFRLENBQVM7UUFDakIsUUFBUSxDQUFTO1FBRVQsT0FBTyxDQUFvQjtRQUMzQixNQUFNLENBQVU7UUFDaEIsTUFBTSxDQUFTO1FBRXZCLFlBQWEsT0FBMEI7WUFFdEMsSUFBSSxDQUFDLEVBQUUsR0FBRyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ3JCLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQztZQUNqQyxJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUM7WUFFakMsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7WUFDdkIsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsbUJBQW1CLENBQUMsQ0FBQztZQUNyQyxJQUFJLENBQUMsTUFBTSxHQUFHLG1CQUFtQixHQUFHLE9BQU8sQ0FBQyxFQUFFLENBQUM7UUFDaEQsQ0FBQztRQUVELElBQUk7WUFFSCxDQUFDLENBQUMsYUFBYSxDQUFFLGdDQUFnQyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxJQUFJLEVBQUUsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBRSxDQUFDO1FBQzNILENBQUM7UUFFRCxXQUFXO1lBRVYsSUFBSSxZQUFZLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFFLENBQUM7WUFDdEUsSUFBSyxZQUFZLENBQUMsa0JBQWtCLENBQUUsaUJBQWlCLENBQUUsRUFDekQ7Z0JBQ0csWUFBWSxDQUFDLFNBQVMsQ0FBRSxhQUFhLENBQWUsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxJQUFJLENBQUMsUUFBUSxDQUFFLENBQUM7Z0JBQ3hGLFlBQVksQ0FBQyxTQUFTLENBQUUsYUFBYSxDQUFlLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBRSxDQUFDO2dCQUMxRixZQUFZLENBQUMsaUJBQWlCLENBQUUsYUFBYSxDQUFFLENBQUMsYUFBYSxDQUFFLFlBQVksRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUUsQ0FBQztnQkFDakcsSUFBSyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFDM0I7b0JBQ0MsWUFBWSxDQUFDLFFBQVEsQ0FBRSxXQUFXLENBQUUsQ0FBQztpQkFDckM7YUFDRDtRQUNGLENBQUM7S0FDRDtJQUVELFNBQVMsS0FBSztRQUdiLElBQUkseUJBQXlCLEdBQUcsb0JBQW9CLENBQUMsaUNBQWlDLEVBQUUsQ0FBQTtRQUN4Rix5QkFBeUIsQ0FBQyxPQUFPLENBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBRSxDQUFDO1FBRXpFLEtBQU0sTUFBTSxPQUFPLElBQUksa0JBQWtCLEVBQ3pDO1lBQ0MsTUFBTSxHQUFHLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUN2QixJQUFLLE9BQU8sQ0FBQyxRQUFRLEdBQUcsR0FBRyxJQUFJLE9BQU8sQ0FBQyxVQUFVLElBQUksR0FBRyxFQUN4RDtnQkFDQyxJQUFJLGtCQUFrQixHQUFHLElBQUksMEJBQTBCLENBQUUsT0FBTyxDQUFFLENBQUM7Z0JBQ25FLGtCQUFrQixDQUFDLFdBQVcsRUFBRSxDQUFDO2FBQ2pDO1NBQ0Q7UUFFRCxJQUFLLHlCQUF5QixDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQ3pDO1lBRUMsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxpQ0FBaUMsQ0FBRSxDQUFDO1NBQ3JEO0lBQ0YsQ0FBQztJQUdEO1FBQ0MsS0FBSyxFQUFFLENBQUM7S0FDUjtBQUNGLENBQUMsRUF2RVMsb0JBQW9CLEtBQXBCLG9CQUFvQixRQXVFN0IifQ==