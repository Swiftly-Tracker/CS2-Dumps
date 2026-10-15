"use strict";
/// <reference path="../csgo.d.ts" />
var InspectShared;
(function (InspectShared) {
    function GetPopupSetting(key, contextPanel = null) {
        let cp = !contextPanel ? $.GetContextPanel() : contextPanel;
        let oSettings = cp.Data().oSettings;
        if (oSettings) {
            const value = oSettings[key];
            return value === undefined ? false : value;
        }
        return false;
    }
    InspectShared.GetPopupSetting = GetPopupSetting;
    function SetPopupSetting(setting, value, contextPanel = null) {
        let cp = !contextPanel ? $.GetContextPanel() : contextPanel;
        let oSettings = cp.Data().oSettings;
        if (oSettings) {
            oSettings[setting] = value;
        }
    }
    InspectShared.SetPopupSetting = SetPopupSetting;
})(InspectShared || (InspectShared = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfaW5zcGVjdF9zaGFyZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfaW5zcGVjdF9zaGFyZWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUVyQyxJQUFVLGFBQWEsQ0E0QnRCO0FBNUJELFdBQVUsYUFBYTtJQUVuQixTQUFnQixlQUFlLENBQzNCLEdBQVksRUFDWixlQUErQixJQUFJO1FBR25DLElBQUksRUFBRSxHQUFZLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQztRQUNyRSxJQUFJLFNBQVMsR0FBRyxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsU0FBbUMsQ0FBQztRQUU5RCxJQUFJLFNBQVMsRUFDYjtZQUNJLE1BQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM3QixPQUFPLEtBQUssS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1NBQzlDO1FBRUQsT0FBTyxLQUFLLENBQUM7SUFDakIsQ0FBQztJQWZlLDZCQUFlLGtCQWU5QixDQUFBO0lBRUosU0FBZ0IsZUFBZSxDQUFFLE9BQWUsRUFBRSxLQUFVLEVBQUUsZUFBK0IsSUFBSTtRQUVoRyxJQUFJLEVBQUUsR0FBWSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUM7UUFDL0QsSUFBSSxTQUFTLEdBQUcsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDLFNBQW1DLENBQUM7UUFDcEUsSUFBSSxTQUFTLEVBQ2I7WUFDRyxTQUFTLENBQUUsT0FBdUMsQ0FBOEMsR0FBRyxLQUFLLENBQUM7U0FDM0c7SUFDRixDQUFDO0lBUmUsNkJBQWUsa0JBUTlCLENBQUE7QUFDRixDQUFDLEVBNUJTLGFBQWEsS0FBYixhQUFhLFFBNEJ0QiJ9