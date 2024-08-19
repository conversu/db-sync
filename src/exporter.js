import dotenv from 'dotenv';
import fs from 'fs';
import { resolve } from 'path';
import QueryStream from 'pg-query-stream';
import PostgresConnection from './database.js';
import { DbConfigBuilder } from './config.js';
import { PathUtils } from './utils.js';
import { TableRowsStream, InterpolateInsertCommandStream, TableCommentsStream, CommentTransformStream } from './streams.js'
import { pipelineAsync } from './pipeline.js';
import Logger from './logger.js';




class DbExporter {

    #outFile;
    #outPath;
    #database;
    #tables;
    #schemas;
    #isDefaultPath;
    #logger;
    #globalRows;
    #start;


    constructor() {
        this.#globalRows = 0
        this.#logger = new Logger('quiet')
    }


    #setDbConfig(params) {

        if (!!params?.env) {

            if (!PathUtils.isFile(params.env)) {

                throw new Error('Invalid directory for "env" property.')
            }

            dotenv.config({
                path: params.env,
            });
            this.#database = DbConfigBuilder.loadEnv();

        } else if (!!params?.config) {

            this.#database = DbConfigBuilder.load(params.config);
        } else {

            throw new Error('Bad database configuration, you must inform a "env" path or a database "config".')
        }
    }

    #setPaths(params) {
        if (!params?.path || !PathUtils.isDir(params?.path)) {
            throw new Error(`Output path directory "${params?.path}" it's not a valid directory path`)
        }
        const outPath = !!params?.path ? params?.path : import.meta.dirname;

        const defaultFilename = `${this.#database.database.toLowerCase()}.sql`;
        const filename = !!params?.filename ? `${params?.filename}.sql`.replace('.sql.sql', '.sql') : defaultFilename;

        const outFile = resolve(outPath, filename);
        this.#isDefaultPath = filename === defaultFilename;
        PathUtils.createDirectoryIfNotExists(outPath);
        PathUtils.removeFile(outFile);
        this.#outPath = outPath;
        this.#outFile = outFile;
    }

    /**
    * Initialize the exporter
    * @param {
    * path {string} - the output path of the generated file
    * filename {filename} - the filename of the generated file
    * env {string} - the path of env file that contains the configurations
    * config {string} - if informed will be used for connection
    * mode {quiet | debug} - log mode
    * } params 
    */
    initialize(params) {
        this.#logger.setMode(params?.mode ?? 'quiet')
        this.#logger.log('')
        this.#logger.log('#'.repeat(50));
        this.#logger.log(`# DB-SYNC - EXPORT`);
        this.#logger.log('#'.repeat(50));
        this.#logger.log('')
        this.#setDbConfig(params);
        this.#setPaths(params);
        this.#start = new Date();
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

    async  #processTable(pool, table, options = {
        batchSize: 1000,
        encoding: 'utf-8',
        writeStream: null
    }) {

        const { batchSize, encoding } = options;
        this.#logger.log('');
        this.#logger.log(`Processing table: ${table}`);
        this.#logger.log('')
        const rowsCount = await pool.query(`SELECT count(*) FROM "${table}"`);
        this.#logger.log(`rows: ${rowsCount.rows[0].count}`)
        const tableSchema = this.#schemas[table];
        const columns = tableSchema.map(column => column.column_name);
        this.#logger.log("Preparing query stream...");

        this.#logger.log("Stream created, beginning to process...");

        const writeStream = options?.writeStream ?? fs.createWriteStream(this.#outFile, {
            encoding: encoding ?? 'utf-8',
            autoClose: true,
            flags: 'a'
        });

        await pipelineAsync(
            new TableCommentsStream([
                `-- ${'*'.repeat(83)} --`,
                `-- TABLE: "${table}"`,
                ' '
            ]),
            new CommentTransformStream(),
            options?.writeStream ?? fs.createWriteStream(this.#outFile, {
                encoding: encoding ?? 'utf-8',
                autoClose: true,
                flags: 'a'
            })
        )

        const start = new Date().getTime();
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

        const duration = new Date().getTime() - start;
        this.#globalRows += Number(rowsCount.rows[0].count);
        const perf = `${rowsCount.rows[0].count} rows exported in ${duration / 1000} sec(s)`;
        await pipelineAsync(
            new TableCommentsStream([
                '\n',
                `-- ${perf}`,
                `-- ${'*'.repeat(83)} --`,
                ' ',
                ' ',
            ]),
            new CommentTransformStream(),
            options?.writeStream ?? fs.createWriteStream(this.#outFile, {
                encoding: encoding ?? 'utf-8',
                autoClose: true,
                flags: 'a'
            })
        )

        this.#logger.log(perf);

        return;
    }

    /**
     * Export a single table into a file <table>.sql
     * 
     * @param {string} table - table name
     * @param {*} params - params
     * @returns 
     */
    async exportTable(table, params = {
        path: null,
        batchSize: 1000,
        encoding: 'utf-8'
    }) {

        const { batchSize, encoding, path } = params;

        if (path) {
            if (!PathUtils.isDir(path)) {
                throw new Error(`Output path directory "${params?.path}" it's not a valid directory path`)
            }
            this.#outPath = path;
        }
        if (this.#isDefaultPath) {
            this.#outFile = resolve(this.#outPath, `${table.toLowerCase()}.sql`)
        }

        PathUtils.removeFile(this.#outFile)
        const pg = new PostgresConnection(this.#database);
        await pg.connect();
        let schema = {};
        schema[table] = await pg.describeTable(table);
        this.#schemas = schema;
        const pool = pg.createDatabasePool();

        return this.#processTable(pool, table, { batchSize, encoding });
    }

    /**
     * Exports all the data of database into a single file .sql
     * 
     * 
     * @param {*} params 
     */
    async exportDatabase(params = {
        exclude: null,
        batchSize: 1000,
        encoding: 'utf-8'
    }) {

        const { exclude, batchSize, encoding } = params;

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

                this.#logger.log('')
                this.#logger.log('-'.repeat(100))
                await this.#processTable(pool, table, { batchSize, encoding });
            }

        } catch (error) {
            this.#logger.error(error);
        } finally {
            // Close the PostgreSQL pool to release all resources
            await pool.end();
            this.#logger.log("Export completed.");
        }


    }

    finalize() {
        const duration = new Date().getTime() - this.#start.getTime();
        this.#logger.log('')
        this.#logger.log('#'.repeat(50));
        console.log('')
        console.log('Output file available in:')
        console.log(this.#outFile)
        console.log('')
        this.#logger.log('')
        this.#logger.log('#'.repeat(50));
        this.#logger.log(`# DONE - ${this.#globalRows} rows exported in ${duration / 1000} sec(s)`);
        this.#logger.log('#'.repeat(50));
        this.#logger.log('')
    }
}

export default DbExporter;