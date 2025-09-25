import type { AxiosResponse } from "axios";
import { AxiosError, HttpStatusCode } from "axios";
import { writable } from "svelte/store";

import type { HeaderContent, HttpMethods } from "@/types";

import { getClient } from "../utils";

const TOKEN_EXPIRED = "Token expired";

interface State {
    loading: boolean;
    statusCode?: number;
    json?: Record<string, any>;
    error?: {
        tokenExpired?: boolean;
        message: string;
        response?: AxiosResponse;
    };
}

interface useHttpOptions {
    ignoreNotFound?: boolean;
}

export function useHttp(options: useHttpOptions = {}) {
    const emptyState: State = { loading: false };

    let abortController: AbortController | null = null;
    let httpData = writable<State>(emptyState);

    function clear() {
        httpData.set({ loading: false });
    }

    function handleSuccess(resp: AxiosResponse) {
        httpData.set({
            loading: false,
            statusCode: resp.status,
            json: resp.data,
        });
    }

    function handleError(err: AxiosError) {
        const statusCode = err.status || 500;
        const response = err.response;
        const data = response?.data as { message?: string } | undefined;
        const message = data?.message || "Something went wrong!";
        const tokenExpired = message === TOKEN_EXPIRED;
        httpData.set({
            loading: false,
            statusCode,
            error: { tokenExpired, message, response },
        });
    }

    async function sendRequest(
        url: string,
        method: HttpMethods,
        data?: object,
        tokenRequired: boolean = true
    ): Promise<AxiosResponse> {
        // Cancel previous request
        abortController?.abort();
        abortController = new AbortController();

        // Prepare the client
        let contentType: HeaderContent = "application/json";
        if (data instanceof FormData) {
            contentType = "multipart/form-data";
        }
        const webClient = getClient(contentType);

        // Token check
        const token = webClient.defaults.headers.Authorization;
        if (!token && tokenRequired) {
            abortController = null;
            httpData.set({
                loading: false,
                error: {
                    tokenExpired: true,
                    message: TOKEN_EXPIRED,
                },
            });
            throw new AxiosError(TOKEN_EXPIRED);
        }

        try {
            httpData.set({ loading: true });
            const resp = await webClient[method](url, data, {
                signal: abortController.signal,
            });
            handleSuccess(resp);
            return resp;
        } catch (err) {
            if (err instanceof AxiosError) {
                if (
                    err.response?.status === HttpStatusCode.NotFound &&
                    options.ignoreNotFound
                ) {
                    handleSuccess(err.response);
                    return err.response;
                } else {
                    handleError(err);
                }
            }
            throw err;
        } finally {
            abortController = null;
        }
    }

    return {
        httpData: { subscribe: httpData.subscribe },
        sendRequest,
        clear,
    };
}
