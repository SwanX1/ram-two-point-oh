import express, { Router } from "express";
import rateLimit from "express-rate-limit";
import {
    APIInfoResponse,
    ClientAPIData,
    ProcessAPIData,
    UserAPIData,
} from "./WebAppTypes";
import qs from "qs";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import {
    RESTGetAPICurrentUserResult,
    RESTPostOAuth2AccessTokenResult,
} from "discord-api-types";
import RamClient from "../BotClass";
import APIUser from "./APIUser";

export default class WebAPIRouter {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private memory: Map<string, Array<any>>;
    public app: express.Router;
    public static endpoints: Array<string> = [
        "/auth",
        "/endpoints",
        "/info/<type>",
        "/token/refresh/<token>",
        "/token/validate/<token>",
    ];
    constructor(public client: RamClient) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.memory = new Map<string, Array<any>>();
        this.memory.set("tokens", new Array<string>());
        this.memory.set("users", new Array<APIUser>());
        this.app = Router();

        this.app.get("/", (req, res) => {
            res.setHeader(
                "Redirect-Reason",
                "No endpoint specified, redirecting to available endpoints: '/api/endpoints'"
            );
            res.redirect("/api/endpoints");
        });

        this.app.get("/endpoints", (req, res) => {
            res.status(200);
            res.json(WebAPIRouter.endpoints);
        });

        this.app.get("/info", (req, res) => {
            res.setHeader(
                "Redirect-Reason",
                "Parameter 'type' must be specified, redirecting to default"
            );
            res.redirect("/api/info/all");
        });

        this.app.get("/info/:type", (req, res) => {
            let JSONResponse: APIInfoResponse | null;
            switch (req.params.type) {
                case "client":
                    JSONResponse = {
                        client: this.getClientAPIData(),
                    };
                    res.status(200);
                    break;
                case "process":
                    JSONResponse = {
                        process: this.getProcessAPIData(),
                    };
                    res.status(200);
                    break;
                case "all":
                    JSONResponse = {
                        client: this.getClientAPIData(),
                        process: this.getProcessAPIData(),
                    };
                    res.status(200);
                    break;
                default:
                    JSONResponse = null;
                    res.status(400);
                    break;
            }
            res.json(
                JSONResponse || {
                    error: `Parameter 'type' must be of type 'all' | 'client' | 'process', got '${req.params.type}' instead`,
                }
            );
            res.end();
        });

        this.app.get(
            "/auth",
            rateLimit({
                windowMs: 60 * 1000, // 1 minute
                max: 15,
                skip: (req) => !this.client.user || !req.query.code,
            })
        );
        this.app.get("/auth", async (req, res) => {
            if (!this.client.user) {
                res.setHeader(
                    "Retry-After",
                    new Date(Date.now() + 5000).toUTCString()
                );
                res.setHeader("Retry-After", 5);
                res.status(503);
            } else if (typeof req.query.code === "string") {
                this.getAuthorizationToken(
                    req.query.code as string,
                    `http${req.secure ? "s" : ""}://` +
                        req.headers.host +
                        req.baseUrl +
                        req.path
                )
                    .then(async (response) => {
                        const userData = await this.getUserData(
                            response.access_token,
                            response.token_type
                        );
                        const user = new APIUser(
                            this.client,
                            response,
                            userData,
                            this.memory.get("tokens") as string[],
                            `http${req.secure ? "s" : ""}://${
                                req.headers.host
                            }${req.originalUrl}`
                        );
                        (this.memory.get("users") as APIUser[]).push(user);
                        res.json({
                            id: user.id,
                            token: user.token,
                        });
                        res.end();
                    })
                    .catch((error) => {
                        if (error.response) {
                            res.status(error.response.status);
                            res.json(error.response.data);
                            res.end();
                        } else {
                            console.error(error);
                        }
                    });
            } else if (req.query.code) {
                res.status(400);
                res.end();
            } else {
                res.redirect(
                    "https://discord.com/oauth2/authorize?" +
                        qs.stringify({
                            client_id: this.client.user.id,
                            redirect_uri: `http${req.secure ? "s" : ""}://${
                                req.headers.host
                            }${req.originalUrl}`,
                            response_type: "code",
                            scope: "identify",
                        })
                );
            }
        });

        this.app.get("/token/validate/:token", (req, res) => {
            const apiuser = (this.memory.get("users") as APIUser[]).find(
                (user) => user.token === req.params.token
            );
            res.json({
                valid: apiuser !== undefined,
            });
            res.end();
        });

        this.app.get("/token/validate", (req, res) => {
            res.status(400);
            res.json({
                error: "invalid_token",
                message: "Invalid `token` provided for parameter `token`",
            });
            res.end();
        });

        this.app.get("/token/refresh/:token", (req, res) => {
            const apiuser = (this.memory.get("users") as APIUser[]).find(
                (user) => user.token === req.params.token
            );
            if (apiuser === undefined) {
                res.status(400);
                res.json({
                    error: "invalid_token",
                    message: "Invalid `token` provided for parameter `token`",
                });
                res.end();
            } else {
                apiuser
                    .refreshAccessToken()
                    .then((value) => {
                        res.json(value);
                        res.end();
                    })
                    .catch((error) => {
                        if (error.response) {
                            res.status(error.response.status);
                            res.json(error.response.data);
                            res.end();
                        } else {
                            console.error(error);
                        }
                    });
            }
        });

        this.app.get("/token/refresh", (req, res) => {
            res.status(400);
            res.json({
                error: "invalid_token",
                message: "Invalid `token` provided for parameter `token`",
            });
            res.end();
        });
    }

    getClientUserAPIData(): UserAPIData | undefined {
        if (!this.client.user) return undefined;
        return {
            avatar: this.client.user.avatar,
            bot: this.client.user.bot,
            discriminator: this.client.user.discriminator,
            id: this.client.user.id,
            tag: this.client.user.tag,
            username: this.client.user.username,
        };
    }

    getClientAPIData(): ClientAPIData {
        return {
            cache: {
                channels: this.client.channels.cache.size,
                guilds: this.client.guilds.cache.size,
                users: this.client.users.cache.size,
            },
            user: this.getClientUserAPIData(),
            uptime: this.client.uptime,
            ownerID: this.client.ownerID,
            ws: {
                gateway: this.client.ws.gateway,
                status: this.client.ws.status,
                ping: this.client.ws.ping,
            },
        };
    }

    getProcessAPIData(): ProcessAPIData {
        return {
            appVersion: this.client.version,
            nodeVersion: process.version,
            uptime: process.uptime(),
        };
    }

    async getAuthorizationToken(
        code: string,
        redirect_uri: string
    ): Promise<RESTPostOAuth2AccessTokenResult & { expires_at: number }> {
        if (!this.client.user) {
            return Promise.reject();
        }
        const authRequestData = qs.stringify({
            client_id: this.client.user.id,
            client_secret: this.client.clientSecret,
            code,
            redirect_uri,
            scope: "identify",
            grant_type: "authorization_code",
        });

        const config: AxiosRequestConfig = {
            method: "post",
            url: "https://discord.com/api/oauth2/token",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data: authRequestData,
        };

        const authResponse = (await axios(config).catch((error) =>
            Promise.reject(error)
        )) as AxiosResponse<RESTPostOAuth2AccessTokenResult>;

        return {
            expires_at: Date.now() + authResponse.data.expires_in,
            ...authResponse.data,
        };
    }

    async getUserData(
        access_token: string,
        token_type = "Bearer"
    ): Promise<RESTGetAPICurrentUserResult> {
        const config: AxiosRequestConfig = {
            method: "get",
            url: "https://discord.com/api/users/@me",
            headers: {
                Authorization: `${token_type} ${access_token}`,
            },
        };

        const { data: responseData } = (await axios(config).catch((error) =>
            Promise.reject(error)
        )) as AxiosResponse;

        return responseData;
    }
}
