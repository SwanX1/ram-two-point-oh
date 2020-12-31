import chalk from 'chalk';
import postgres, { Sql as SQLFunction, Options as PostgresOptions } from 'postgres';


export default class PostgreSQLProvider {
    public sql: SQLFunction<Record<string, unknown>>;
    constructor(options?: PostgresOptions<Record<string, unknown>>) {
        options = {
            debug: (connection, query) =>
                console.log(chalk`{redBright [SQL]} {green ${query}}`),
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            onnotice: () => {},
            ...options,
        };
        this.sql = postgres(options);
    }

    async checkConnection(): Promise<boolean> {
        try {
            await this.sql`SELECT 1+1 AS result`;
            return true;
        } catch (e) {
            return false;
        }
    }

    async setup(): Promise<void> {
        await this.sql`CREATE TABLE IF NOT EXISTS rambot_guild_config (id VARCHAR(256) PRIMARY KEY, value JSON)`;
    }
}