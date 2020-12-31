import express, { Express } from "express";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import RamClient from "../BotClass";
import chalk from "chalk";
import WebAPIRouter from "./WebAPIRouter";
import path from "path";

export default class WebApp {
    public app: Express;
    public apiapp: WebAPIRouter;
    
    public log: typeof console.log;
    public info: typeof console.info;
    public warn: typeof console.warn;
    public error: typeof console.error;
    public fatal: typeof console.error;
    public debug: typeof console.debug;
    public logPrefix: string;


    constructor(public client: RamClient, app?: express.Express) {
        this.client = client;
        app = app || express(); // if undefined, create default app
        this.app = app;

        // Logger functions
        this.logPrefix = chalk`{red [WebApp]}`;

        //TODO: add writing to files
        this.log = console.log.bind(console, this.logPrefix);
        this.info = console.info.bind(console, this.logPrefix);
        this.warn = console.warn.bind(console, this.logPrefix);
        this.error = console.error.bind(console, this.logPrefix);
        this.fatal = console.error.bind(console, this.logPrefix);
        this.debug = console.debug.bind(console, this.logPrefix);

        app.use(
            morgan("dev", {
                stream: {
                    write: (...args) => {
                        process.stdout.write(this.logPrefix + " ");
                        process.stdout.write(...args);
                    },
                },
            })
        );

        app.use(helmet());
        app.use(cors());

        app.use(
            rateLimit({
                windowMs: 2 * 60 * 1000, // 2 minutes
                max: 120,
            })
        );
        
        this.apiapp = new WebAPIRouter(this.client);
        app.use("/api", this.apiapp.app);
        app.use(express.static(path.join(__dirname, "../../../resources/public")));
        app.use((req, res, next) => {
            res.status(404);
            next();
        });
    }

    
}
