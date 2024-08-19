import { Readable, Transform } from 'stream';
import Logger from './logger.js';

class InterpolateInsertCommandStream extends Transform {

    #table
    #columns;
    #logger;

    constructor(table, columns, options = {}, logger) {
        super(options);
        this.#table = table;
        this.#columns = columns;
        this.#logger = logger ?? new Logger('quiet');
    }

    _transform(row, encoding, callback) {
        this.#logger.log('-'.repeat(50))
        this.#logger.log('>>> transform: ', this.#table, '->', row[this.#columns[0]])

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
        this.#logger.log(transformed)
        this.#logger.log('')
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

export {
    InterpolateInsertCommandStream,
    TableRowsStream,
    TableCommentsStream,
    CommentTransformStream
}