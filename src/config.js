import pg from "pg";

const { Pool } = pg;

class DbConfig {

    type;
    url;
    host;
    port;
    database;
    user;
    password;



    constructor() {
        this.type = 'postgres';
    }

    loadEnv() {
        this.url = process.env.DATABASE_URL ?? null;
        this.host = process.env.DATABASE_HOST ?? null;
        this.port = +process.env.DATABASE_PORT ?? null;
        this.database = process.env.DATABASE_NAME ?? null;
        this.user = process.env.DATABASE_USERNAME ?? null;
        this.password = String(process.env.DATABASE_PASSWORD) ?? null;
        return this
    }

    load(params) {
        this.url = params.url ?? null;
        this.host = params.host ?? null;
        this.port = port ?? null;
        this.database = database ?? null;
        this.user = user ?? null;
        this.password = password ?? null;
        return this;
    }


    cnx_string() {

        if (!!this.url) {

            return this.url;
        }

        return `${this.type}ql://${this.user}:${this.password}@${this.host}:${this.port}/${this.database}`
    }


    get() {
        return {
            type: this.type,
            host: this.host,
            port: this.port,
            username: this.user,
            password: String(this.password),
            database: this.database,
            // ssl: { rejectUnauthorized: false },
        }
    }

    getPool() {
        return new Pool(this.get());
    }

    getClient(){

        return new pg.Client(this.get());
    }
}


const DbConfigBuilder = {
    loadEnv: () => new DbConfig().loadEnv(),
    load: (params) => new DbConfig().load(params),
}


export { DbConfig, DbConfigBuilder };