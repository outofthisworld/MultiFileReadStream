/*
    Runs a task in series on the next tick.
    All tasks will run consecutively on the next tick.
*/
function series_1(arr, cb) {
    process.nextTick(function() {
        let results = []
        let err = null;
        for (let i = 0; i < arr.length; i++) {
            try {
                const r = arr[i].call(null, results[results.length - 1], results)
                results.push(r);
            } catch (err) {
                err = err;
            }
        }
        return cb(err, results);
    });

    return series_1;
}

series_1([
    function calculateAddition() {
        return 1 + 2;
    },
    function calculateDivision(result) {
        return result / 3;
    },
    function multiplyBy10(result) {
        return result * 10;
    }
], function(err, results) {
    if (err) {
        console.log(err)
    } else {
        console.log('done results:' + results)
    }
})

console.log('down here')

/*
    Runs tasks in series, however this next each task in the series runs 
    on the next event tick after the prior task.
*/
function series_2(arr, cb) {
    let pos = 0;
    const results = [];

    function schedule(err, result) {
        if (pos > 0)
            results.push(result);

        if (err || pos === arr.length) {
            return cb(err, results);
        }
        process.nextTick(() => wrapper(schedule, results));
    }

    function wrapper(schedule, results) {
        const fn = arr[pos++];
        let result;
        let err;
        try {
            result = fn.call(null, results[pos - 2]);
        } catch (err) {
            err = err;
        }
        return schedule(err, result);
    }

    schedule();
}


series_2([
    function calculateAddition() {
        return 1 + 2;
    },
    function calculateDivision(result) {
        return result / 3;
    },
    function multiplyBy10(result) {
        return result * 10;
    }
], function(err, results) {
    if (err) {
        console.log(err)
    } else {
        console.log('series 2 done results:' + results)
    }
})