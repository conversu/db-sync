import pg from "pg";
import QueryStream from "pg-query-stream";

class PostgresConnection {

    #client;
    #config;

    constructor(config) {
        this.#config = config;
        this.#client = new pg.Client(config.get());
    }

    async connect() {
        try {
            await this.#client.connect();
        } catch (err) {

        }
    }

    queryStream(query, params = [], options) {
        return new QueryStream(
            query,
            params,
            { batchSize: options?.batchSize ?? 1000 }
        );
    }

    createDatabasePool() {
        try {

          return new pg.Pool(this.#config.get());
        } catch (error) {
          console.error('Error creating database pool:', error);
          throw error;
        }
      }

    async query(query, params = []) {


        try {
            await this.connect();
            const result = await this.#client.query(query, params);
            return result.rows;
        } catch (err) {
            console.log(`>> ERROR: ${err}`)
            throw Error('Fail during query execution');
        } finally {
            await this.close();
        }
    }

    async getAllTables() {
        const query = `
            SELECT table_schema, table_name
            FROM information_schema.tables
            WHERE table_type = 'BASE TABLE'
              AND table_schema NOT IN ('pg_catalog', 'information_schema');
        `;

        const result = await this.query(query);
        return result.filter(row => row.table_schema === 'public').map(row => row.table_name);
    }

    async describeTable(tableName) {

        const query = `
            SELECT 
                column_name,
                data_type,
                is_nullable
            FROM 
                information_schema.columns
            WHERE 
                table_name = $1
            ORDER BY 
                ordinal_position;
        `;

        try {

            const result = await this.#client.query(query, [tableName]);
            return result.rows;

        } catch (err) {
            console.error('Error describing the table:', err);
            return null
        }
    }


    async close() {
        await this.#client.end();
    }
}


export default PostgresConnection;
