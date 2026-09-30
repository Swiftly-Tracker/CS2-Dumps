"use strict";
/// <reference path="..\csgo.d.ts" />
var PopupNews;
(function (PopupNews) {
    function Init() {
        let date = $.GetContextPanel().GetAttributeString("date", '');
        date = date.split(' ')[0];
        $.GetContextPanel().SetDialogVariable('news_date', date);
        let title = $.GetContextPanel().GetAttributeString("title", '');
        $.GetContextPanel().SetDialogVariable('news_title', title);
        let link = $.GetContextPanel().GetAttributeString("link", '');
        let elUrlBtn = $.GetContextPanel().FindChildTraverse('id-news-url-button');
        if (elUrlBtn) {
            let strUrl = link;
            elUrlBtn.SetPanelEvent('onactivate', () => {
                SteamOverlayAPI.OpenUrlInOverlayOrExternalBrowser(strUrl);
                $.DispatchEvent('UIPopupButtonClicked', '');
                $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.mainmenu_press_home', 'MOUSE');
            });
        }
        //
        // Adjust the link as needed for display in client and navigate to it
        //
        let elBlogHTML = $.GetContextPanel().FindChildTraverse('BlogHTML');
        if (elBlogHTML) {
            // Debug links:
            // link = 'https://csgostaging.wpcomstaging.com/index.php/2019/04/23968/';
            // link = 'https://stackoverflow.com/';
            // Make a special URL that allows for distinguishing in-client views -vs- web views
            // also fixes proxy caching settings when generating in-client PHP to not pollute
            // the in-browser stylesheets (wordpress woes)
            if (link.indexOf('?') < 0)
                link += '?';
            else
                link += '&';
            link += 'is_embedded_in_client=1';
            // Navigate to the URL
            elBlogHTML.SetURL(link);
        }
    }
    PopupNews.Init = Init;
    function Close() {
        $.DispatchEvent('UIPopupButtonClicked', '');
    }
    PopupNews.Close = Close;
    function _HTMLOpenPopupLink(elPanel, sLinkUrl) {
        SteamOverlayAPI.OpenUrlInOverlayOrExternalBrowser(sLinkUrl);
        $.DispatchEvent('UIPopupButtonClicked', '');
        $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.mainmenu_press_home', 'MOUSE');
    }
    function _HTMLFinishRequest() {
        $.Schedule(0.3, () => {
            let elHTML = $.GetContextPanel().FindChildTraverse('BlogHTML');
            if (elHTML) {
                elHTML.AddClass('visible');
            }
        });
    }
    $.RegisterEventHandler("HTMLFinishRequest", $.GetContextPanel(), _HTMLFinishRequest);
    $.RegisterEventHandler("HTMLOpenPopupLink", $.GetContextPanel(), _HTMLOpenPopupLink);
})(PopupNews || (PopupNews = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfbmV3cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3BvcHVwcy9wb3B1cF9uZXdzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFFckMsSUFBVSxTQUFTLENBMEVsQjtBQTFFRCxXQUFVLFNBQVM7SUFFbEIsU0FBZ0IsSUFBSTtRQUVuQixJQUFJLElBQUksR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsa0JBQWtCLENBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBRSxDQUFDO1FBQ2hFLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFFLEdBQUcsQ0FBRSxDQUFFLENBQUMsQ0FBRSxDQUFDO1FBQzlCLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBRSxXQUFXLEVBQUUsSUFBSSxDQUFFLENBQUM7UUFFM0QsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGtCQUFrQixDQUFFLE9BQU8sRUFBRSxFQUFFLENBQUUsQ0FBQztRQUNsRSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsaUJBQWlCLENBQUUsWUFBWSxFQUFFLEtBQUssQ0FBRSxDQUFDO1FBRTdELElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRSxNQUFNLEVBQUUsRUFBRSxDQUFFLENBQUM7UUFFaEUsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLGlCQUFpQixDQUFFLG9CQUFvQixDQUFFLENBQUM7UUFDN0UsSUFBSyxRQUFRLEVBQ2I7WUFDQyxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUM7WUFDbEIsUUFBUSxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsR0FBRyxFQUFFO2dCQUUxQyxlQUFlLENBQUMsaUNBQWlDLENBQUUsTUFBTSxDQUFFLENBQUM7Z0JBQzVELENBQUMsQ0FBQyxhQUFhLENBQUUsc0JBQXNCLEVBQUUsRUFBRSxDQUFFLENBQUM7Z0JBQzlDLENBQUMsQ0FBQyxhQUFhLENBQUUscUJBQXFCLEVBQUUsZ0NBQWdDLEVBQUUsT0FBTyxDQUFFLENBQUM7WUFDckYsQ0FBQyxDQUFFLENBQUM7U0FDSjtRQUNELEVBQUU7UUFDRixxRUFBcUU7UUFDckUsRUFBRTtRQUNGLElBQUksVUFBVSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBRSxVQUFVLENBQVksQ0FBQztRQUMvRSxJQUFLLFVBQVUsRUFDZjtZQUNDLGVBQWU7WUFDZiwwRUFBMEU7WUFDMUUsdUNBQXVDO1lBRXZDLG1GQUFtRjtZQUNuRixpRkFBaUY7WUFDakYsOENBQThDO1lBQzlDLElBQUssSUFBSSxDQUFDLE9BQU8sQ0FBRSxHQUFHLENBQUUsR0FBRyxDQUFDO2dCQUMzQixJQUFJLElBQUksR0FBRyxDQUFDOztnQkFFWixJQUFJLElBQUksR0FBRyxDQUFDO1lBQ2IsSUFBSSxJQUFJLHlCQUF5QixDQUFDO1lBRWxDLHNCQUFzQjtZQUN0QixVQUFVLENBQUMsTUFBTSxDQUFFLElBQUksQ0FBRSxDQUFDO1NBQzFCO0lBQ0YsQ0FBQztJQTVDZSxjQUFJLE9BNENuQixDQUFBO0lBRUQsU0FBZ0IsS0FBSztRQUVwQixDQUFDLENBQUMsYUFBYSxDQUFFLHNCQUFzQixFQUFFLEVBQUUsQ0FBRSxDQUFDO0lBQy9DLENBQUM7SUFIZSxlQUFLLFFBR3BCLENBQUE7SUFFRCxTQUFTLGtCQUFrQixDQUFHLE9BQWdCLEVBQUUsUUFBZ0I7UUFFL0QsZUFBZSxDQUFDLGlDQUFpQyxDQUFFLFFBQVEsQ0FBRSxDQUFDO1FBQzlELENBQUMsQ0FBQyxhQUFhLENBQUUsc0JBQXNCLEVBQUUsRUFBRSxDQUFFLENBQUM7UUFDOUMsQ0FBQyxDQUFDLGFBQWEsQ0FBRSxxQkFBcUIsRUFBRSxnQ0FBZ0MsRUFBRSxPQUFPLENBQUUsQ0FBQztJQUNyRixDQUFDO0lBRUQsU0FBUyxrQkFBa0I7UUFFMUIsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxHQUFHLEVBQUUsR0FBRyxFQUFFO1lBRXJCLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBRSxVQUFVLENBQUUsQ0FBQztZQUNqRSxJQUFLLE1BQU0sRUFDWDtnQkFDQyxNQUFNLENBQUMsUUFBUSxDQUFFLFNBQVMsQ0FBRSxDQUFDO2FBQzdCO1FBQ0YsQ0FBQyxDQUFFLENBQUM7SUFDTCxDQUFDO0lBRUQsQ0FBQyxDQUFDLG9CQUFvQixDQUFFLG1CQUFtQixFQUFFLENBQUMsQ0FBQyxlQUFlLEVBQUUsRUFBRSxrQkFBa0IsQ0FBRSxDQUFDO0lBQ3ZGLENBQUMsQ0FBQyxvQkFBb0IsQ0FBRSxtQkFBbUIsRUFBRSxDQUFDLENBQUMsZUFBZSxFQUFFLEVBQUUsa0JBQWtCLENBQUUsQ0FBQztBQUN4RixDQUFDLEVBMUVTLFNBQVMsS0FBVCxTQUFTLFFBMEVsQiJ9