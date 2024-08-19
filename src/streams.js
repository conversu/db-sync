import { Readable, Transform } from 'stream';

class InterpolateInsertCommandStream extends Transform {

    #table
    #columns;

    constructor(table, columns, options = {}) {
        super(options);
        this.#table = table;
        this.#columns = columns;
    }

    _transform(row, encoding, callback) {
        // console.log('-'.repeat(50))
        // console.log('>>> transform: ', this.#table, '->', row[this.#columns[0]])

        const valuesAsString = this.#columns.map(column => {

            const value = String(row[column])

            if (!!value && value.length > 0 && value !== 'null' && value !== 'undefined') {

                return `'${value.trim()}'`
            } else {
                return 'NULL'
            }
        }).join(', ')

        const columnsAsString = this.#columns.map(value => `"${value}"`).join(', ')
        const transformed = `INSERT INTO "${this.#table}" (${columnsAsString}) VALUES (${valuesAsString});\n`
        // console.log(transformed)
        // console.log('')
        callback(null, transformed);
    }
}


class TableRowsStream extends Readable {
    constructor(rows, options) {
        super({ ...options, objectMode: true });
        this.rows = rows;
        this.currentIndex = 0;
    }

    _read(size) {
        if (this.currentIndex >= this.rows.length) {
            this.push(null); // End of stream
        } else {
            this.push(this.rows[this.currentIndex]);
            this.currentIndex++;
        }
    }
}

class TableCommentsStream extends Readable {
    constructor(rows, options) {
        super(options);
        this.rows = rows;
        this.currentIndex = 0;
    }

    _read(size) {
        if (this.currentIndex >= this.rows.length) {
            this.push(null); // End of stream
        } else {
            this.push(this.rows[this.currentIndex]);
            this.currentIndex++;
        }
    }
}

class CommentTransformStream extends Transform {

    constructor(options = {}) {
        super(options);
    }

    _transform(chunk, encoding, callback) {

        callback(null, `${chunk.toString()}\n`);
    }
}


const exportStream = async (pool, queryStream, transformStream, writeStream) => {

    pool.connect(async (err, client, done) => {
        if (err) console.error(err);

        const stream = client.query(queryStream);

        stream
            .pipe(transformStream)
            .pipe(writeStream)
            .on("error", console.error)
            .on("finish", () => {
                done();
                writeStream.end();
            })
            .on("end", () => {
                writeStream.destroy();
                transformStream.destroy();
                done();
                process.kill(process.pid, 'SIGTERM')
                console.log('aquii')
            });
    });
};


export { 
    InterpolateInsertCommandStream, 
    TableRowsStream, 
    TableCommentsStream,
    CommentTransformStream,
    exportStream
 }