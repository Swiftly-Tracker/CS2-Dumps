"use strict";
/// <reference path="../csgo.d.ts" />
// this is a wrapper for $.Schedule() that eliminates the need to keep track of which jobs are finished, since calling $.CancelScheduled()
// on a finished job breaks panorama. Particularly useful when sequencing animation events using schedule offsets.
//
// Usage:
// Call Scheduler.Schedule( delay, func ), just as you would $.Schedule().
// Call Scheduler.Cancel() to cancel any jobs previously added. 
//
// Additionally, you can keep sets of jobs separate using an optional keyword, e.g.
// 
// Scheduler.Schedule( delay, func, 'LASERS' );
// Scheduler.Cancel( 'LASERS' );
//
var Scheduler;
(function (Scheduler) {
    // a keyword indexed array of jobs
    const oJobs = {};
    function Schedule(delay, fn, key = 'default') {
        if (!oJobs.hasOwnProperty(key))
            oJobs[key] = [];
        oJobs[key].push(Job(delay, fn, key));
    }
    Scheduler.Schedule = Schedule;
    function Cancel(key = 'default') {
        if (oJobs.hasOwnProperty(key)) {
            while (oJobs[key].length) {
                const job = oJobs[key].pop();
                job.Cancel();
            }
        }
    }
    Scheduler.Cancel = Cancel;
    function Job(delay, func, key) {
        let m_handle = $.Schedule(delay, function () {
            m_handle = null; // we null it out first in case the func will try to clear out all jobs
            func();
            // $.Msg( 'SCHED: running\t', m_handle, '\t', key  );
        });
        // $.Msg( 'SCHED: adding\t', m_handle, ' \t', key );
        return {
            GetHandle: () => m_handle,
            Cancel: () => {
                if (m_handle) {
                    // $.Msg( 'SCHED: cancelling\t', m_handle, '\t', key );
                    $.CancelScheduled(m_handle);
                    m_handle = null;
                }
            },
        };
    }
})(Scheduler || (Scheduler = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZWR1bGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvY29tbW9uL3NjaGVkdWxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBRXJDLDBJQUEwSTtBQUMxSSxrSEFBa0g7QUFDbEgsRUFBRTtBQUNGLFNBQVM7QUFDVCwwRUFBMEU7QUFDMUUsZ0VBQWdFO0FBQ2hFLEVBQUU7QUFDRixtRkFBbUY7QUFDbkYsR0FBRztBQUNILCtDQUErQztBQUMvQyxnQ0FBZ0M7QUFDaEMsRUFBRTtBQUVGLElBQVUsU0FBUyxDQXdEbEI7QUF4REQsV0FBVSxTQUFTO0lBUWxCLGtDQUFrQztJQUNsQyxNQUFNLEtBQUssR0FBMEIsRUFBRSxDQUFDO0lBRXhDLFNBQWdCLFFBQVEsQ0FBRyxLQUFhLEVBQUUsRUFBYyxFQUFFLE1BQWMsU0FBUztRQUVoRixJQUFLLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBRSxHQUFHLENBQUU7WUFDaEMsS0FBSyxDQUFFLEdBQUcsQ0FBRSxHQUFHLEVBQUUsQ0FBQztRQUVuQixLQUFLLENBQUUsR0FBRyxDQUFFLENBQUMsSUFBSSxDQUFFLEdBQUcsQ0FBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLEdBQUcsQ0FBRSxDQUFFLENBQUM7SUFDNUMsQ0FBQztJQU5lLGtCQUFRLFdBTXZCLENBQUE7SUFFRCxTQUFnQixNQUFNLENBQUcsTUFBYyxTQUFTO1FBRS9DLElBQUssS0FBSyxDQUFDLGNBQWMsQ0FBRSxHQUFHLENBQUUsRUFDaEM7WUFDQyxPQUFRLEtBQUssQ0FBRSxHQUFHLENBQUUsQ0FBQyxNQUFNLEVBQzNCO2dCQUNDLE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBRSxHQUFHLENBQUUsQ0FBQyxHQUFHLEVBQUcsQ0FBQztnQkFDaEMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDO2FBQ2I7U0FDRDtJQUNGLENBQUM7SUFWZSxnQkFBTSxTQVVyQixDQUFBO0lBRUQsU0FBUyxHQUFHLENBQUcsS0FBYSxFQUFFLElBQWdCLEVBQUUsR0FBVztRQUUxRCxJQUFJLFFBQVEsR0FBa0IsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxLQUFLLEVBQUU7WUFFaEQsUUFBUSxHQUFHLElBQUksQ0FBQyxDQUFDLHVFQUF1RTtZQUN4RixJQUFJLEVBQUUsQ0FBQztZQUNQLHFEQUFxRDtRQUV0RCxDQUFDLENBQUUsQ0FBQztRQUVKLG9EQUFvRDtRQUVwRCxPQUFPO1lBQ04sU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLFFBQVE7WUFDekIsTUFBTSxFQUFFLEdBQUcsRUFBRTtnQkFFWixJQUFLLFFBQVEsRUFDYjtvQkFDQyx1REFBdUQ7b0JBQ3ZELENBQUMsQ0FBQyxlQUFlLENBQUUsUUFBUSxDQUFFLENBQUM7b0JBQzlCLFFBQVEsR0FBRyxJQUFJLENBQUM7aUJBQ2hCO1lBQ0YsQ0FBQztTQUNELENBQUM7SUFDSCxDQUFDO0FBQ0YsQ0FBQyxFQXhEUyxTQUFTLEtBQVQsU0FBUyxRQXdEbEIifQ==