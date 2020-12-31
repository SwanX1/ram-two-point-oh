import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import {
    RESTGetAPICurrentUserResult,
    RESTPostOAuth2AccessTokenResult,
} from "discord-api-types/v8";
import { User } from "discord.js";
import qs from "qs";
import { randomString } from "../../util/Util";
import RamClient from "../BotClass";

export default class APIUser extends User {
    public token: string;
    public discordAuthorization: RESTPostOAuth2AccessTokenResult & {
        expires_at: number;
    };
    private clientSecret: string;
    constructor(
        client: RamClient,
        authorization: RESTPostOAuth2AccessTokenResult & { expires_at: number },
        discordUserData: RESTGetAPICurrentUserResult,
        existingTokens: string[],
        public authRedirectURI: string
    ) {
        super(client, discordUserData);
        this.clientSecret = client.clientSecret;
        do {
            this.token = randomString(64);
        } while (existingTokens.includes(this.token));
        this.discordAuthorization = authorization;
    }

    isAccessTokenExpired(): boolean {
        return Date.now() >= this.discordAuthorization.expires_at;
    }

    async refreshAccessToken(): Promise<
        RESTPostOAuth2AccessTokenResult & {
            expires_at: number;
        }
    > {
        if (!this.client.user) {
            return Promise.reject();
        }
        const authRequestData = qs.stringify({
            client_id: this.client.user.id,
            client_secret: this.clientSecret,
            refresh_token: this.discordAuthorization.refresh_token,
            redirect_uri: this.authRedirectURI,
            scope: "identify",
            grant_type: "refresh_token",
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

        return this.discordAuthorization = {
            expires_at: Date.now() + authResponse.data.expires_in,
            ...authResponse.data,
        };
    }
}
