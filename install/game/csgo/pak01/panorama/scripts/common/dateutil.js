"use strict";
/// <reference path="../csgo.d.ts" />
// G	Era designator										Text				AD
// y	Year												Year				1996; 96
// Y	Week year											Year				2009; 09
// M	Month in year										Month				July; Jul; 07
// w	Week in year										Number				27
// W	Week in month										Number				2
// D	Day in year											Number				189
// d	Day in month										Number				10
// F	Day of week in month								Number				2
// E	Day name in week									Text				Tuesday; Tue
// u	Day number of week (1 = Monday, ..., 7 = Sunday)	Number				1
// a	Am/pm marker										Text				PM
// H	Hour in day (0-23)									Number				0
// k	Hour in day (1-24)									Number				24
// K	Hour in am/pm (0-11)								Number				0
// h	Hour in am/pm (1-12)								Number				12
// m	Minute in hour										Number				30
// s	Second in minute									Number				55
// S	Millisecond											Number				978
// z	Time zone											General time zone	Pacific Standard Time; PST; GMT-08:00
// Z	Time zone											RFC 822 time zone	-0800
// X	Time zone											ISO 8601 time zone	-08; -0800; -08:00
var DateUtil;
(function (DateUtil) {
    function PopulateDateFormatStrings(panel, date) {
        // MONTH
        //
        // month number
        panel.SetDialogVariableInt('M', date.getMonth() + 1);
        // zero padded month number
        const monthPaddedNumber = ('0' + (date.getMonth() + 1)).slice(-2);
        panel.SetDialogVariable('MM', monthPaddedNumber);
        // short month
        panel.SetDialogVariable('MMM', $.Localize('#MonthName' + monthPaddedNumber + '_Short'));
        // full month
        panel.SetDialogVariable('MMMM', $.Localize('#MonthName' + monthPaddedNumber + '_Long'));
        // DAY
        //
        // date number e.g. 31
        panel.SetDialogVariableInt('d', date.getDate());
        // zero padded
        const dayPaddedNumber = ('0' + (date.getDate())).slice(-2);
        panel.SetDialogVariable('dd', dayPaddedNumber);
        // abbrev day of week
        panel.SetDialogVariable('ddd', $.Localize('#LOC_Date_DayShort' + date.getDay()));
        // full day of the week
        panel.SetDialogVariable('dddd', $.Localize('#LOC_Date_Day' + date.getDay()));
    }
    DateUtil.PopulateDateFormatStrings = PopulateDateFormatStrings;
})(DateUtil || (DateUtil = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0ZXV0aWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9jb21tb24vZGF0ZXV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUVyQyx1Q0FBdUM7QUFDdkMscUNBQXFDO0FBQ3JDLHlDQUF5QztBQUN6QyxrREFBa0Q7QUFDbEQsdUNBQXVDO0FBQ3ZDLHVDQUF1QztBQUN2Qyx3Q0FBd0M7QUFDeEMsdUNBQXVDO0FBQ3ZDLDRDQUE0QztBQUM1QyxrREFBa0Q7QUFDbEQsaUVBQWlFO0FBQ2pFLHFDQUFxQztBQUNyQywyQ0FBMkM7QUFDM0MsNENBQTRDO0FBQzVDLDRDQUE0QztBQUM1Qyw2Q0FBNkM7QUFDN0MseUNBQXlDO0FBQ3pDLDBDQUEwQztBQUMxQyx3Q0FBd0M7QUFDeEMsZ0ZBQWdGO0FBQ2hGLGdEQUFnRDtBQUNoRCw4REFBOEQ7QUFFOUQsSUFBVSxRQUFRLENBbUNqQjtBQW5DRCxXQUFVLFFBQVE7SUFFakIsU0FBZ0IseUJBQXlCLENBQUcsS0FBYyxFQUFFLElBQVU7UUFFckUsUUFBUTtRQUNSLEVBQUU7UUFDRixlQUFlO1FBQ2YsS0FBSyxDQUFDLG9CQUFvQixDQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFFLENBQUM7UUFFdkQsMkJBQTJCO1FBQzNCLE1BQU0saUJBQWlCLEdBQUcsQ0FBRSxHQUFHLEdBQUcsQ0FBRSxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFFLENBQUUsQ0FBQyxLQUFLLENBQUUsQ0FBQyxDQUFDLENBQUUsQ0FBQztRQUN4RSxLQUFLLENBQUMsaUJBQWlCLENBQUUsSUFBSSxFQUFFLGlCQUFpQixDQUFFLENBQUM7UUFFbkQsY0FBYztRQUNkLEtBQUssQ0FBQyxpQkFBaUIsQ0FBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxZQUFZLEdBQUcsaUJBQWlCLEdBQUcsUUFBUSxDQUFFLENBQUUsQ0FBQztRQUU1RixhQUFhO1FBQ2IsS0FBSyxDQUFDLGlCQUFpQixDQUFFLE1BQU0sRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFFLFlBQVksR0FBRyxpQkFBaUIsR0FBRyxPQUFPLENBQUUsQ0FBRSxDQUFDO1FBRzVGLE1BQU07UUFDTixFQUFFO1FBQ0Ysc0JBQXNCO1FBQ3RCLEtBQUssQ0FBQyxvQkFBb0IsQ0FBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFFLENBQUM7UUFFbEQsY0FBYztRQUNkLE1BQU0sZUFBZSxHQUFHLENBQUUsR0FBRyxHQUFHLENBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFFLENBQUUsQ0FBQyxLQUFLLENBQUUsQ0FBQyxDQUFDLENBQUUsQ0FBQztRQUNqRSxLQUFLLENBQUMsaUJBQWlCLENBQUUsSUFBSSxFQUFFLGVBQWUsQ0FBRSxDQUFDO1FBRWpELHFCQUFxQjtRQUNyQixLQUFLLENBQUMsaUJBQWlCLENBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUUsb0JBQW9CLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFFLENBQUUsQ0FBQztRQUVyRix1QkFBdUI7UUFDdkIsS0FBSyxDQUFDLGlCQUFpQixDQUFFLE1BQU0sRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFFLGVBQWUsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUUsQ0FBRSxDQUFDO0lBQ2xGLENBQUM7SUFoQ2Usa0NBQXlCLDRCQWdDeEMsQ0FBQTtBQUNGLENBQUMsRUFuQ1MsUUFBUSxLQUFSLFFBQVEsUUFtQ2pCIn0=