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

        const self = this;
        this.EventEmitter = new EventEmitter();
        this.filePaths = options.files;
        this.files = {};
        this.count = 0;
        const fs = require('fs');
        this.filePaths.forEach(function(file, index) {
            const readStream = fs.createReadStream(file);

            readStream.on('data', function(data) {
                data = data.toString('utf8')
                console.log('reading')
                if (!self.files[file]) {
                    const fileObject = {
                        path: file,
                        name: require('path').basename(file),
                        ext: require('path').extname(file),
                        contents: [data],
                        index
                    }
                    self.files[file] = fileObject;
                } else {
                    self.files[file].contents.push(data);
                }
            })

            readStream.on('end', function() {
                self.files[file].isFullyRead = true
                self.EventEmitter.emit('fileRead', self.files[file]);
                readStream.close();
            })
        })
    }

    _read() {
        const self = this;

        if (self.count === this.filePaths.length - 1) {
            console.log('pushing null')
            self.push(null);
        } else {
            self.EventEmitter.once('fileRead', function(file) {
                self.push(file);
                self.count += 1;
            })
        }
    }
}


function src() {
    return new MultiFileReadStream({
        files: Array.prototype.slice.call(arguments)
    })
}


src('./bin/myoutfile.json', './bin/myreadfile.json')
    .on('data', function(data) {

        console.log('file: ')
        console.log('========')
        console.dir(data)
        console.log('==========')
    }).on('end', function() {
        console.log('finished reading')
    })