"use strict";
var UniqueRandomUtils;
(function (UniqueRandomUtils) {
    class UniqueRandomGenerator {
        numbers;
        currentIndex;
        constructor(min, max) {
            this.numbers = [];
            for (let i = min; i <= max; i++) {
                this.numbers.push(i);
            }
            this.currentIndex = this.numbers.length - 1;
            this.shuffle();
        }
        shuffle() {
            for (let i = this.numbers.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.numbers[i], this.numbers[j]] = [this.numbers[j], this.numbers[i]];
            }
        }
        next() {
            if (this.currentIndex < 0) {
                return null;
            }
            // Return the number at the current index, then move the pointer down
            return this.numbers[this.currentIndex--];
        }
        reset() {
            this.shuffle(); // Reshuffle the existing array
            this.currentIndex = this.numbers.length - 1; // Reset the pointer
        }
    }
    UniqueRandomUtils.UniqueRandomGenerator = UniqueRandomGenerator;
})(UniqueRandomUtils || (UniqueRandomUtils = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW5pcXVlX3JhbmRvbV9udW1iZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9jb21tb24vdW5pcXVlX3JhbmRvbV9udW1iZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUdBLElBQVUsaUJBQWlCLENBb0MxQjtBQXBDRCxXQUFVLGlCQUFpQjtJQUN2QixNQUFhLHFCQUFxQjtRQUN0QixPQUFPLENBQVc7UUFDbEIsWUFBWSxDQUFTO1FBRTdCLFlBQVksR0FBVyxFQUFFLEdBQVc7WUFDcEMsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFFbEIsS0FBSyxJQUFJLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDN0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDeEI7WUFFRCxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztZQUM1QyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDZixDQUFDO1FBRU8sT0FBTztZQUNmLEtBQUssSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQzlDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzlDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUMzRTtRQUNELENBQUM7UUFFRCxJQUFJO1lBQ0osSUFBSSxJQUFJLENBQUMsWUFBWSxHQUFHLENBQUMsRUFBRTtnQkFDdkIsT0FBTyxJQUFJLENBQUM7YUFDZjtZQUNELHFFQUFxRTtZQUNyRSxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7UUFDekMsQ0FBQztRQUVELEtBQUs7WUFDTCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQywrQkFBK0I7WUFDL0MsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxvQkFBb0I7UUFDakUsQ0FBQztLQUNKO0lBbENZLHVDQUFxQix3QkFrQ2pDLENBQUE7QUFDTCxDQUFDLEVBcENTLGlCQUFpQixLQUFqQixpQkFBaUIsUUFvQzFCIn0=