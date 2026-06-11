import { HttpStatusCode } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import type { AxiosInstance, AxiosResponse } from 'axios';
import axios from 'axios';
import { AxiosError } from 'axios';

import { getToken } from '@/storage';
import type { HeaderContent, HttpMethods } from '@/types';

const TOKEN_EXPIRED = 'Token expired';

interface State {
    loading: boolean;
    statusCode?: number;
    json?: any;
    error?: {
        tokenExpired?: boolean;
        message: string;
        response?: any;
    };
}

interface BackendOptions {
    ignoreNotFound?: boolean;
    tokenRequired?: boolean;
}

const getClient = (contentType: HeaderContent, token: string): AxiosInstance => {
    const headers = {
        'Content-Type': contentType,
        ...(token && { Authorization: token }),
    };

    return axios.create({
        baseURL: `${import.meta.env['NG_APP_BACKEND_URL']}`,
        headers,
    });
};

@Injectable({ providedIn: 'root' })
export class BackendService {
    private abortController: AbortController | null = null;

    httpData = signal<State>({ loading: false });

    clear() {
        this.httpData.set({ loading: false });
    }

    private handleSuccess(resp: AxiosResponse) {
        this.httpData.set({
            loading: false,
            statusCode: resp.status,
            json: resp.data,
        });
    }

    private handleError(err: AxiosError) {
        const statusCode = err.status || 500;
        const response = err.response;
        const data = response?.data as { message?: string } | undefined;
        const message = data?.message || 'Something went wrong!';
        const tokenExpired = message === TOKEN_EXPIRED;

        this.httpData.set({
            loading: false,
            statusCode,
            error: {
                tokenExpired,
                message,
                response,
            },
        });
    }

    async sendRequest(url: string, method: HttpMethods, data?: any, options: BackendOptions = {}) {
        // Create abort controller
        this.abortController?.abort();
        this.abortController = new AbortController();

        // Check the Token
        const token = getToken();
        const tokenRequired = options.tokenRequired ?? true;
        if (!token && tokenRequired) {
            this.abortController = null;
            this.httpData.set({
                loading: false,
                error: {
                    tokenExpired: true,
                    message: TOKEN_EXPIRED,
                },
            });
            // We raise the same error as if we actually send
            // a request and got a token expired response
            throw new Error(TOKEN_EXPIRED);
        }

        // Get the http client
        let contentType: HeaderContent = 'application/json';
        if (data instanceof FormData) {
            contentType = 'multipart/form-data';
        } else if (data instanceof URLSearchParams) {
            contentType = 'application/x-www-form-urlencoded';
        }
        const webClient = getClient(contentType, token);

        try {
            // Send the request
            this.httpData.set({ loading: true });
            const resp = await webClient[method](url, data, {
                signal: this.abortController.signal,
            });
            this.handleSuccess(resp);
            return resp;
        } catch (err) {
            // Handle error
            if (err instanceof AxiosError) {
                if (err.response?.status === HttpStatusCode.NotFound && options.ignoreNotFound) {
                    this.handleSuccess(err.response);
                    return err.response;
                } else {
                    this.handleError(err);
                }
            }

            throw err;
        } finally {
            this.abortController = null;
        }
    }
}
