"use strict";
/// <reference path="csgo.d.ts" />
var NewsPanel;
(function (NewsPanel) {
    function _GetRssFeed() {
        BlogAPI.RequestRSSFeed();
    }
    function _OnRssFeedReceived(feed) {
        if ($.GetContextPanel().BHasClass('news-panel--hide-news-panel')) {
            return;
        }
        ;
        let elLister = $.GetContextPanel().FindChildInLayoutFile('NewsPanelLister');
        if (elLister === undefined || elLister === null || !feed)
            return;
        elLister.RemoveAndDeleteChildren();
        let foundFirstNewsItem = false;
        feed['items'].forEach(function (item, i) {
            let elEntry = $.CreatePanel('Panel', elLister, 'NewEntry' + i, {
                acceptsinput: true
            });
            if (!foundFirstNewsItem && !item.categories.includes('Minor')) {
                foundFirstNewsItem = true;
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
            elEntry.FindChildInLayoutFile('NewsEntryBlurTarget').AddBlurPanel(elEntryInfo);
            let link = item.link;
            let clearNew = i == 0;
            elEntry.SetPanelEvent("onactivate", () => {
                SteamOverlayAPI.OpenURL(link);
                if (clearNew) {
                    elEntry.RemoveClass('new');
                }
            });
        });
    }
    {
        _GetRssFeed();
        $.RegisterForUnhandledEvent("PanoramaComponent_Blog_RSSFeedReceived", _OnRssFeedReceived);
    }
})(NewsPanel || (NewsPanel = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbm1lbnVfbmV3cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL21haW5tZW51X25ld3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUVsQyxJQUFVLFNBQVMsQ0F1R2xCO0FBdkdELFdBQVUsU0FBUztJQUVsQixTQUFTLFdBQVc7UUFFbkIsT0FBTyxDQUFDLGNBQWMsRUFBRSxDQUFDO0lBQzFCLENBQUM7SUFFRCxTQUFTLGtCQUFrQixDQUFFLElBQW1CO1FBSS9DLElBQUksQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLFNBQVMsQ0FBRSw2QkFBNkIsQ0FBRSxFQUNsRTtZQUNDLE9BQU87U0FDUDtRQUFBLENBQUM7UUFFRixJQUFJLFFBQVEsR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMscUJBQXFCLENBQUUsaUJBQWlCLENBQUUsQ0FBQztRQUU5RSxJQUFLLFFBQVEsS0FBSyxTQUFTLElBQUksUUFBUSxLQUFLLElBQUksSUFBSSxDQUFDLElBQUk7WUFDeEQsT0FBTztRQUVSLFFBQVEsQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1FBR25DLElBQUksa0JBQWtCLEdBQUcsS0FBSyxDQUFDO1FBRS9CLElBQUksQ0FBRSxPQUFPLENBQUUsQ0FBQyxPQUFPLENBQUUsVUFBVSxJQUFJLEVBQUUsQ0FBQztZQUV6QyxJQUFJLE9BQU8sR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsVUFBVSxHQUFHLENBQUMsRUFBRTtnQkFDL0QsWUFBWSxFQUFFLElBQUk7YUFDbEIsQ0FBRSxDQUFDO1lBR0osSUFBSyxDQUFDLGtCQUFrQixJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUUsT0FBTyxDQUFFLEVBQ2hFO2dCQUNDLGtCQUFrQixHQUFHLElBQUksQ0FBQztnQkFHMUIsT0FBTyxDQUFDLFFBQVEsQ0FB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