"use strict";
/// <reference path="csgo.d.ts" />
var NewsPanel;
(function (NewsPanel) {
    function _GetRssFeed() {
        BlogAPI.RequestRSSFeed();
    }
    function _OnRssFeedReceived(feed) {
        $.Msg('Revieved blog RSSs Feed' + feed);
        if ($.GetContextPanel().BHasClass('news-panel--hide-news-panel')) {
            return;
        }
        ;
        let elLister = $.GetContextPanel().FindChildInLayoutFile('NewsPanelLister');
        if (elLister === undefined || elLister === null || !feed)
            return;
        elLister.RemoveAndDeleteChildren();
        // find the first candidate for popup
        let foundFirstNewsItem = false;
        feed['items'].forEach(function (item, i) {
            let elEntry = $.CreatePanel('Panel', elLister, 'NewEntry' + i, {
                acceptsinput: true
            });
            // pop up the first news item if we've never seen it before
            if (!foundFirstNewsItem && !item.categories.includes('Minor')) {
                foundFirstNewsItem = true;
                // always highlight the latest important news
                elEntry.AddClass('new');
            }
            elEntry.BLoadLayoutSnippet('featured-news-full-entry');
            let elImage = elEntry.FindChildInLayoutFile('NewsHeaderImage');
            if (item.imageUrl) {
                elImage.SetImage(item.imageUrl);
            }
            else {
                elImage.SetImage("file://{images}/store/default-news.png");
            }
            let elEntryInfo = $.CreatePanel('Panel', elEntry, 'NewsInfo' + i);
            elEntryInfo.BLoadLayoutSnippet('featured-news-info');
            elEntryInfo.SetDialogVariable('news_item_date', item.date);
            elEntryInfo.SetDialogVariable('news_item_title', item.title);
            elEntryInfo.SetDialogVariable('news_item_body', item.description);
            // history articles  //
            elEntry.BLoadLayoutSnippet('history-news-full-entry');
            elImage = elEntry.FindChildInLayoutFile('NewsHeaderImage');
            if (item.imageUrl) {
                elImage.SetImage(item.imageUrl);
            }
            else {
                elImage.SetImage("file://{images}/store/default-news.png");
            }
            elEntryInfo = $.CreatePanel('Panel', elEntry, 'NewsInfo' + i);
            elEntryInfo.BLoadLayoutSnippet('history-news-info');
            elEntryInfo.SetDialogVariable('news_item_date', item.date);
            elEntryInfo.SetDialogVariable('news_item_title', item.title);
            elEntryInfo.SetDialogVariable('news_item_body', item.description);
            // Adding
            elEntry.FindChildInLayoutFile('NewsEntryBlurTarget').AddBlurPanel(elEntryInfo);
            let link = item.link;
            let clearNew = i == 0;
            elEntry.SetPanelEvent("onactivate", () => {
                SteamOverlayAPI.OpenURL(link);
                if (clearNew) {
                    // GameInterfaceAPI.SetSettingString( 'ui_news_last_read_link', link );
                    elEntry.RemoveClass('new');
                }
            });
        });
    }
    //--------------------------------------------------------------------------------------------------
    // Entry point called when panel is created
    //--------------------------------------------------------------------------------------------------
    {
        _GetRssFeed();
        $.RegisterForUnhandledEvent("PanoramaComponent_Blog_RSSFeedReceived", _OnRssFeedReceived);
    }
})(NewsPanel || (NewsPanel = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbm1lbnVfbmV3cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL21haW5tZW51X25ld3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUVsQyxJQUFVLFNBQVMsQ0F1R2xCO0FBdkdELFdBQVUsU0FBUztJQUVsQixTQUFTLFdBQVc7UUFFbkIsT0FBTyxDQUFDLGNBQWMsRUFBRSxDQUFDO0lBQzFCLENBQUM7SUFFRCxTQUFTLGtCQUFrQixDQUFFLElBQW1CO1FBRS9DLENBQUMsQ0FBQyxHQUFHLENBQUUseUJBQXlCLEdBQUcsSUFBSSxDQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsU0FBUyxDQUFFLDZCQUE2QixDQUFFLEVBQ2xFO1lBQ0MsT0FBTztTQUNQO1FBQUEsQ0FBQztRQUVGLElBQUksUUFBUSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxpQkFBaUIsQ0FBRSxDQUFDO1FBRTlFLElBQUssUUFBUSxLQUFLLFNBQVMsSUFBSSxRQUFRLEtBQUssSUFBSSxJQUFJLENBQUMsSUFBSTtZQUN4RCxPQUFPO1FBRVIsUUFBUSxDQUFDLHVCQUF1QixFQUFFLENBQUM7UUFFbkMscUNBQXFDO1FBQ3JDLElBQUksa0JBQWtCLEdBQUcsS0FBSyxDQUFDO1FBRS9CLElBQUksQ0FBRSxPQUFPLENBQUUsQ0FBQyxPQUFPLENBQUUsVUFBVSxJQUFJLEVBQUUsQ0FBQztZQUV6QyxJQUFJLE9BQU8sR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsVUFBVSxHQUFHLENBQUMsRUFBRTtnQkFDL0QsWUFBWSxFQUFFLElBQUk7YUFDbEIsQ0FBRSxDQUFDO1lBRUosMkRBQTJEO1lBQzNELElBQUssQ0FBQyxrQkFBa0IsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMs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