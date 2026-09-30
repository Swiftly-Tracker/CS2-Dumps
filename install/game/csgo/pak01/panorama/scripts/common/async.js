"use strict";
/// <reference path="../csgo.d.ts" />
var Async;
(function (Async) {
    function Delay(fDelay, value) {
        return new Promise(resolve => $.Schedule(fDelay, () => resolve(value)));
    }
    Async.Delay = Delay;
    /**
     * Returns a `Promise` that will resolve during the next frame.
     */
    function NextFrame() {
        return Delay(0.0);
    }
    Async.NextFrame = NextFrame;
    /**
     * Returns a `Promise` that will resolve the next time the event with name `sEvent` is dispatched.
     * The resolve value is an array of the event parameters.
     */
    function UnhandledEvent(sEvent) {
        return new Promise(resolve => {
            const nHandlerId = $.RegisterForUnhandledEvent(sEvent, function (...args) {
                $.UnregisterForUnhandledEvent(sEvent, nHandlerId);
                resolve(args);
            });
        });
    }
    Async.UnhandledEvent = UnhandledEvent;
    /**
     * A controller object that allows you to abort any process observing the `signal` member.
     */
    class AbortController {
        signal;
        _aborted = false;
        constructor() {
            const controller = this;
            this.signal = { get aborted() { return controller._aborted; } };
        }
        abort() {
            this._aborted = true;
        }
    }
    Async.AbortController = AbortController;
    function Condition(predicate, abortSignal) {
        return new Promise(resolve => {
            (async function () {
                while (abortSignal === undefined || !abortSignal.aborted) {
                    if (predicate()) {
                        resolve();
                        return;
                    }
                    await NextFrame();
                }
            })();
        });
    }
    Async.Condition = Condition;
    /**
     * Runs the `sequenceFn`, awaiting the result of every yield, and not resuming the `sequenceFn` if `abortSignal` has aborted.
     * Returns a `Promise` that resolve `true` on completion or `false` if `abortSignal` was aborted.
     */
    function RunSequence(sequenceFn, abortSignal) {
        return new Promise(resolve => {
            (async function () {
                const generator = sequenceFn(abortSignal || new Async.AbortController().signal);
                let value;
                while (true) {
                    const iterResult = await generator.next(value);
                    if (iterResult.done) {
                        resolve(true);
                        return;
                    }
                    value = await iterResult.value;
                    if (abortSignal && abortSignal.aborted) {
                        resolve(false);
                        return;
                    }
                }
            })();
        });
    }
    Async.RunSequence = RunSequence;
    /**
     * Utility class for scheduling relative to a point in time.
     * @example
     * const start = new TimeStamp();
     * await Async.Delay( 1 ); // Async.Delay is always relative to now
     * $.Msg( "1 second later" );
     * await start.Delay( 2 );
     * $.Msg( "2 seconds later" );
     * await start.Delay( 3 );
     * $.Msg( "3 seconds later" );
     */
    class TimeStamp {
        frameTime = $.FrameTime();
        /**
         * Schedule a function to be run later, relative to when this `TimeStamp` was created.
         */
        Schedule(fDelay, fn) {
            const fDelayFromNow = fDelay - ($.FrameTime() - this.frameTime);
            $.Schedule(fDelayFromNow, fn);
        }
        Delay(fDelay, value) {
            return new Promise(resolve => this.Schedule(fDelay, () => resolve(value)));
        }
    }
    Async.TimeStamp = TimeStamp;
})(Async || (Async = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXN5bmMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9jb21tb24vYXN5bmMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUVyQyxJQUFVLEtBQUssQ0EySmQ7QUEzSkQsV0FBVSxLQUFLO0lBVVgsU0FBZ0IsS0FBSyxDQUFNLE1BQWMsRUFBRSxLQUFTO1FBRWhELE9BQU8sSUFBSSxPQUFPLENBQUssT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUUsS0FBTSxDQUFFLENBQUUsQ0FBRSxDQUFDO0lBQ3RGLENBQUM7SUFIZSxXQUFLLFFBR3BCLENBQUE7SUFFRDs7T0FFRztJQUNILFNBQWdCLFNBQVM7UUFFckIsT0FBTyxLQUFLLENBQUUsR0FBRyxDQUFFLENBQUM7SUFDeEIsQ0FBQztJQUhlLGVBQVMsWUFHeEIsQ0FBQTtJQUVEOzs7T0FHRztJQUNILFNBQWdCLGNBQWMsQ0FBb0MsTUFBUztRQUV2RSxPQUFPLElBQUksT0FBTyxDQUFFLE9BQU8sQ0FBQyxFQUFFO1lBRTFCLE1BQU0sVUFBVSxHQUFHLENBQUMsQ0FBQyx5QkFBeUIsQ0FBSyxNQUFNLEVBQUUsVUFBVyxHQUFHLElBQW9CO2dCQUV6RixDQUFDLENBQUMsMkJBQTJCLENBQUUsTUFBTSxFQUFFLFVBQVUsQ0FBRSxDQUFDO2dCQUNwRCxPQUFPLENBQUUsSUFBSSxDQUFFLENBQUM7WUFDcEIsQ0FBd0MsQ0FBRSxDQUFDO1FBQy9DLENBQUMsQ0FBRSxDQUFDO0lBQ1IsQ0FBQztJQVZlLG9CQUFjLGlCQVU3QixDQUFBO0lBVUQ7O09BRUc7SUFDSCxNQUFhLGVBQWU7UUFFeEIsTUFBTSxDQUFnQjtRQUNkLFFBQVEsR0FBRyxLQUFLLENBQUM7UUFDekI7WUFFSSxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUM7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