"use strict";
/// <reference path="csgo.d.ts" />
var NewNewsEntryCheck;
(function (NewNewsEntryCheck) {
    let _m_RSSFeedReceivedEventHandler = null;
    function GetRssFeed() {
        BlogAPI.RequestRSSFeed();
    }
    NewNewsEntryCheck.GetRssFeed = GetRssFeed;
    function _OnRssFeedReceived(feed) {
        let feeds = [
            {
                linkmatch: '/newsentry/',
                cvarname: 'ui_news_last_read_link',
                processed: false
            },
            {
                linkmatch: '/newsentry2/',
                cvarname: 'ui_news_last_read_link2',
                processed: false
            }
        ];
        feed['items'].forEach(function (item, i) {
            if (item.categories.includes('Minor'))
                return;
            feeds.forEach(function (feed) {
                if (feed.processed)
                    return;
                const urlpos = item.link.indexOf(feed.linkmatch);
                if (urlpos === -1)
                    return;
                feed.processed = true;
                const postid = item.link.substring(urlpos + feed.linkmatch.length);
                const lastseen = GameInterfaceAPI.GetSettingString(feed.cvarname);
                if (postid === lastseen)
                    return;
                UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_news.xml', 'date=' + item.date + "&" +
                    'title=' + item.title + "&" +
                    'link=' + item.link);
                GameInterfaceAPI.SetSettingString(feed.cvarname, postid);
            });
        });
    }
    function RegisterForRssReceivedEvent() {
        if (!_m_RSSFeedReceivedEventHandler)
            _m_RSSFeedReceivedEventHandler = $.RegisterForUnhandledEvent("PanoramaComponent_Blog_RSSFeedReceived", _OnRssFeedReceived);
    }
    NewNewsEntryCheck.RegisterForRssReceivedEvent = RegisterForRssReceivedEvent;
    function UnRegisterForRssReceivedEvent() {
        if (_m_RSSFeedReceivedEventHandler) {
            $.UnregisterForUnhandledEvent("PanoramaComponent_Blog_RSSFeedReceived", _m_RSSFeedReceivedEventHandler);
            _m_RSSFeedReceivedEventHandler = null;
        }
    }
    NewNewsEntryCheck.UnRegisterForRssReceivedEvent = UnRegisterForRssReceivedEvent;
    {
        GetRssFeed();
    }
})(NewNewsEntryCheck || (NewNewsEntryCheck = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmV3X25ld3NfZW50cnlfY2hlY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9uZXdfbmV3c19lbnRyeV9jaGVjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBRWxDLElBQVUsaUJBQWlCLENBOEUxQjtBQTlFRCxXQUFVLGlCQUFpQjtJQUUxQixJQUFJLDhCQUE4QixHQUFrQixJQUFJLENBQUM7SUFFdEQsU0FBZ0IsVUFBVTtRQUU1QixPQUFPLENBQUMsY0FBYyxFQUFFLENBQUM7SUFDMUIsQ0FBQztJQUhrQiw0QkFBVSxhQUc1QixDQUFBO0lBU0QsU0FBUyxrQkFBa0IsQ0FBRSxJQUFtQjtRQUcvQyxJQUFJLEtBQUssR0FBc0I7WUFDOUI7Z0JBQ0MsU0FBUyxFQUFFLGFBQWE7Z0JBQ3hCLFFBQVEsRUFBRSx3QkFBd0I7Z0JBQ2xDLFNBQVMsRUFBRSxLQUFLO2FBQ2hCO1lBQ0Q7Z0JBQ0MsU0FBUyxFQUFFLGNBQWM7Z0JBQ3pCLFFBQVEsRUFBRSx5QkFBeUI7Z0JBQ25DLFNBQVMsRUFBRSxLQUFLO2FBQ2hCO1NBQ0QsQ0FBQztRQUVGLElBQUksQ0FBRSxPQUFPLENBQUUsQ0FBQyxPQUFPLENBQUUsVUFBVSxJQUFJLEVBQUUsQ0FBQztZQUd6QyxJQUFLLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFFLE9BQU8sQ0FBRTtnQkFBRyxPQUFPO1lBRWxELEtBQUssQ0FBQyxPQUFPLENBQUUsVUFBVSxJQUFJO2dCQUM1QixJQUFLLElBQUksQ0FBQyxTQUFTO29CQUFHLE9BQU87Z0JBQzdCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxTQUFTLENBQUUsQ0FBQztnQkFDbkQsSUFBSyxNQUFNLEtBQUssQ0FBQyxDQUFDO29CQUFHLE9BQU87Z0JBQzVCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO2dCQUV0QixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBRSxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUUsQ0FBQztnQkFDckUsTUFBTSxRQUFRLEdBQUcsZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBRSxDQUFDO2dCQUNwRSxJQUFLLE1BQU0sS0FBSyxRQUFRO29CQUFHLE9BQU87Z0JBRWxDLFlBQVksQ0FBQywrQkFBK0IsQ0FBRSxFQUFFLEVBQUUsaURBQWlELEVBQ2xHLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLEdBQUc7b0JBQ3pCLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLEdBQUc7b0JBQzNCLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFFLENBQUM7Z0JBRXZCLGdCQUFnQixDQUFDLGdCQUFnQixDQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFFLENBQUM7WUFDNUQsQ0FBQyxDQUFFLENBQUM7UUFDTCxDQUFDLENBQUUsQ0FBQztJQUNMLENBQUM7SUFFRSxTQUFnQiwyQkFBMkI7UUFFdkMsSUFBSyxDQUFDLDhCQUE4QjtZQUNoQyw4QkFBOEIsR0FBRyxDQUFDLENBQUMseUJBQXlCLENBQUUsd0NBQXdDLEVBQUUsa0JBQWtCLENBQUUsQ0FBQztJQUNySSxDQUFDO0lBSmUsNkNBQTJCLDhCQUkxQyxDQUFBO0lBRUQsU0FBZ0IsNkJBQTZCO1FBRXpDLElBQUksOEJBQThCLEVBQ2xDO1lBQ0ksQ0FBQyxDQUFDLDJCQUEyQixDQUFFLHdDQUF3QyxFQUFFLDhCQUE4QixDQUFFLENBQUM7WUFDMUcsOEJBQThCLEdBQUcsSUFBSSxDQUFDO1NBQ3pDO0lBQ0wsQ0FBQztJQVBlLCtDQUE2QixnQ0FPNUMsQ0FBQTtJQUtKO1FBQ0MsVUFBVSxFQUFFLENBQUM7S0FDYjtBQUNGLENBQUMsRUE5RVMsaUJBQWlCLEtBQWpCLGlCQUFpQixRQThFMUIifQ==