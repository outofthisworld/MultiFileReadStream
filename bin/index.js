//Import our readable stream
const { Readable } = require('stream');
const { EventEmitter } = require('events')


class MultiFileReadStream extends Readable {

    constructor(options) {
        super(Object.assign(options, {
            objectMode: true
        }));

        if (!options.files || !Array.isArray(options.files)) {
            throw new Error('files must be supplied')
        }


        this.EventEmitter = new EventEmitter();
        this.count = 0;
        this.options = options;


        const fs = require('fs');
        const self = this;

        options.files.forEach(function(file, index) {
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
                self.EventEmitter.emit('fileRead', fileObject);
                readStream.close();
            })

            readStream.on('error', function(err) {
                self.EventEmitter.emit('error');
                readStream.close();
                self.close();
                if (options.errorFn) {
                    options.errorFn.call(null, err);
                }
            })

            readStream.emit('error', new Error('hm'))


        })
    }

    _read() {
        const self = this;

        if (self.count === self.options.files.length - 1) {
            console.log('pushing null')
            self.push(null);
        } else {
            self.EventEmitter.once('fileRead', function(file) {
                self.push(file);
                self.count += 1;
            })

            self.EventEmitter.once('error', function() {
                self.push(null);
            })
        }
    }
}


function src() {
    return new MultiFileReadStream({
        files: Array.prototype.slice.call(arguments, 0, arguments.length - 1),
        errorFn: arguments[arguments.length - 1]
    })
}


src('./bin/myoutfile.json', './bin/myreadfile.json', function(err) {
    console.log(err)
}).on('data', function(data) {
    console.log(data)
})