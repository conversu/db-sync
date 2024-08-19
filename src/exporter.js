import dotenv from 'dotenv';
import fs from 'fs';
import QueryStream from 'pg-query-stream';
import PostgresConnection from './database.js';
import { DbConfigBuilder } from './config.js';
import { createDirectoryIfNotExists, removeFile } from './utils.js';
import { exportStream, TableRowsStream, InterpolateInsertCommandStream, TableCommentsStream, CommentTransformStream } from './streams.js'
import { pipelineAsync } from './pipeline.js';



class DbExporter {

    #outFile;
    #outPath;
    #database;
    #tables;
    #schemas;

    /**
     * 
     * @param {
     * path {string} - the output path of the generated file
     * filename {filename} - the filename of the generated file
     * } params 
     */
    constructor(params) {
        this.#database = DbConfigBuilder.loadEnv();
        this.#outPath = params?.path ?? import.meta.url;
        this.#outFile = new URL(params?.filename ?? `${this.#database.database.toLowerCase()}-data.sql`, this.#outPath);
        removeFile(this.#outFile)
    }

    async #collectTables() {
        const pg = new PostgresConnection(this.#database);
        this.#tables = await pg.getAllTables();
    }

    async #collectTableSchemas() {
        const pg = new PostgresConnection(this.#database);
        let tableSchemas = {};
        await pg.connect();
        for (const table of this.#tables) {
            tableSchemas[table] = await pg.describeTable(table);
        }
        await pg.close();
        this.#schemas = tableSchemas;
    }

    async exportTable(table, params = {
        path: null,
        batchSize: 1000,
        encoding: 'utf-8'
    }) {

        const { batchSize, encoding, path } = params;
        createDirectoryIfNotExists(path);
        if (path) {
            this.#outPath = path;
        }
        this.#outFile = new URL(`${table.toLowerCase()}.sql`, this.#outPath)
        removeFile(this.#outFile)
        const pg = new PostgresConnection(this.#database);
        await pg.connect();
        let schema = {};
        schema[table] = await pg.describeTable(table);
        this.#schemas = schema;
        const pool = pg.createDatabasePool();

        return this.#processTable(pool, table, { batchSize, encoding });
    }


    async  #processTable(pool, table, options = {
        batchSize: 1000,
        encoding: 'utf-8',
        writeStream: null
    }) {

        const { batchSize, encoding } = options;

        console.log(`Processing table: ${table}`);
        console.log('')
        const rowsCount = await pool.query(`SELECT count(*) FROM "${table}"`);
        console.log(`rows: ${rowsCount.rows[0].count}`)
        const tableSchema = this.#schemas[table];
        const columns = tableSchema.map(column => column.column_name);
        console.log("Preparing query stream...");

        console.log("Stream created, beginning to process...");

        const writeStream = options?.writeStream ?? fs.createWriteStream(this.#outFile, {
            encoding: encoding ?? 'utf-8',
            autoClose: true,
            flags: 'a'
        });

        await pipelineAsync(
            new TableCommentsStream([
                '\n',
                '\n',
                '-'.repeat(40),
                `-- TABLE: "${table}"`,
                '-'.repeat(40),
                '\n',
            ]),
            new CommentTransformStream(),
            options?.writeStream ?? fs.createWriteStream(this.#outFile, {
                encoding: encoding ?? 'utf-8',
                autoClose: true,
                flags: 'a'
            })
        )

        const transformStream = new InterpolateInsertCommandStream(table, columns, { objectMode: true });

        const batch = batchSize ?? 1000;
        let readableStream = null;

        if (rowsCount > batch) {

            readableStream = pool.query(new QueryStream(`SELECT * FROM "${table}"`, [], { batchSize: batch }));

        } else {

            const rows = await pool.query(`SELECT * FROM "${table}"`);
            readableStream = new TableRowsStream(rows.rows);
        }

        await pipelineAsync(
            readableStream,
            transformStream,
            writeStream
        )


        return;
    }


    async export(params = {
        exclude: null,
        batchSize: 1000,
        encoding: 'utf-8'
    }) {

        const { exclude, batchSize, encoding } = params;

        console.log("STARTED: ", new Date());
        await this.#collectTables();
        await this.#collectTableSchemas();

        const pg = new PostgresConnection(this.#database);
        const pool = pg.createDatabasePool();

        try {
            let tables = Object.keys(this.#schemas);
            if (!!exclude) {
                tables = tables.filter(table => !exclude.includes(table))
            }
            for await (const table of tables) {
                console.log('#'.repeat(50))
                await this.#processTable(pool, table, { batchSize, encoding });
            }

        } catch (error) {
            console.error("Error during export: ", error);
        } finally {
            // Close the PostgreSQL pool to release all resources
            await pool.end();
            console.log("Export completed.");
        }

        console.log('')
        console.log('#'.repeat(50));
        console.log("FINISHED: ", new Date());
        console.log('#'.repeat(50));
    }
}

export default DbExporter;