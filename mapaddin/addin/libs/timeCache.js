export class TimeCache {
    __findItem (sorted, date) {
        let pos = this.__findClosestIndex
        let point = sorted[pos];

        if (date > point.from && date < point.to) {
            return pivot;
        }

        return -1;
    }

    __findClosestIndex (sorted, date) {
        let end = sorted.length - 1;
        let start = 0;
        let pivot = Math.floor(end - start);

        while (start !== end) {
            let point = sorted[pivot];

            if (date < point.from) {
                end = pivot;
                pivot = Math.floor(end - start);
            } else {
                start = pivot;
                pivot = Math.ceil(end - start);
            }
        }

        return pivot;
    }

    __formCachedItem (data) {
        return { start: data.start, end: data.end, data };
    }

    constructor () {
        this.cache = {};
    }

    get (id, start) {
        let cached = this.cache[id] || [];
        let pos = this.__findItem(cached, start);
        return pos >= 0 ? cached[pos].data : undefined;
    }

    set (id, timeRangeDate) {
        this.cache[id] = this.cache[id] || [];

        let rangeData = Array.isArray(timeRangeDate) ? timeRangeDate : [timeRangeDate];
        let cached = this.cache[id];

        rangeData.forEach(data => {
            let newCacheItem = this.__formCachedItem(data);
            let pos = this.__findClosestIndex(cached, newCacheItem.start);
            let point = cached[pos];

            if (point) {
                cached.splice(pos, 0, newCacheItem);
            } else {
                cached.push(newCacheItem);
            }
        });
    }
}