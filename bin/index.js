//Import our readable stream
const { Readable, Transform } = require('stream');


class MultiFileReadStream extends Readable {

    constructor(options) {
        super(Object.assign(options || {}, {
            objectMode: true
        }));

        if (!options.files || !Array.isArray(options.files)) {
            throw new Error('files must be supplied')
        }

        this.count = 0;
        this.options = options;
        this._readFiles(options.files, options.errorFn);
    }

    _readFiles(files, errCb) {
        const fs = require('fs');
        const self = this;

        files.forEach(function(file, index) {
            const readStream = fs.createReadStream(file);

            const fileObject = {
                path: file,
                name: require('path').basename(file),
                ext: require('path').extname(file),
                contents: [],
                index
            }

            readStream.on('data', function(data) {
                data = data.toString('utf8')
                fileObject.contents.push(data);
            })

            readStream.on('end', function() {
                if (!self.errorState)
                    self.emit('fileRead', fileObject);
                readStream.close();
            })

            readStream.on('error', function(err) {
                if (!self.errorState) {
                    self.emit('error', err);
                    readStream.close();
                    if (errCb) {
                        errCb.call(self, err);
                    }

                    self.errorState = true;
                }
            })

        })
    }

    _read() {
        const self = this;

        if (self.count === self.options.files.length - 1) {
            console.log('pushing null')
            self.push(null);
        } else {
            self.once('fileRead', function(file) {
                self.push(file);
                self.count += 1;
            })
            self.once('error', function(file) {
                self.push(null);
            })
        }
    }
}


class ConcatTransformStream extends Transform {
    constructor(options) {
        super(Object.assign(options || {}, {
            objectMode: true
        }))
        this.contents = ""
    }

    _transform(chunk, enc, callback) {
        this.contents += chunk.contents.join('');
        callback();
    }

    /*
        Called before end is emitted by the stream, push any last contents.
    */
    _flush() {
        this.push(this.contents);
        this.emit('end')
    }
}


function src() {
    return new MultiFileReadStream({
        files: Array.prototype.slice.call(arguments, 0, arguments.length - 1),
        errorFn: arguments[arguments.length - 1]
    })
}

function concatFiles(options) {
    return new ConcatTransformStream(options)
}


src('./bin/myoutfile.json', './bin/myreadfile.json', function(err) {
    console.log('error: ' + err)
}).pipe(concatFiles()).on('data', function(data) {
    console.log(data)
}).on('finish', function() {
    console.log('finished')
}).on('end', function() {
    console.log('end')
})