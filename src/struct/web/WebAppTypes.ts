import { Snowflake } from "discord.js";

export interface WebSocketAPIData {
    gateway: string | null;
    status: number;
    ping: number;
}

export interface ClientCacheAPIData {
    channels: number;
    guilds: number;
    users: number;
}

export interface UserAPIData {
    avatar: string | null;
    bot: boolean;
    discriminator: string;
    id: Snowflake;
    tag: string;
    username: string;
}

export interface ClientAPIData {
    ws: WebSocketAPIData;
    cache: ClientCacheAPIData;
    uptime: number | null;
    user?: UserAPIData;
    ownerID?: Snowflake | Snowflake[];
}

export interface ProcessAPIData {
    uptime: number;
    nodeVersion: string;
    appVersion: string;
}

export interface APIInfoResponse {
    client?: ClientAPIData;
    process?: ProcessAPIData;
}