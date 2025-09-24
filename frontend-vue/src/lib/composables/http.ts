import type { AxiosResponse } from "axios";
import { AxiosError, HttpStatusCode } from "axios";
import { ref } from "vue";

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

export const useHttp = (options: useHttpOptions = {}) => {
    const emptyState: State = { loading: false };

    let abortControllerRef: AbortController | null = null;
    const httpData = ref<State>(emptyState);

    const clear = () => {
        httpData.value = { loading: false };
    };

    const handleSuccess = (resp: AxiosResponse) => {
        httpData.value = {
            loading: false,
            statusCode: resp.status,
            json: resp.data,
        };
    };

    const handleError = (err: AxiosError) => {
        const statusCode = err.status || 500;
        const response = err.response;
        const data = response?.data as { message?: string } | undefined;
        const message = data?.message || "Something went wrong!";
        const tokenExpired = message === TOKEN_EXPIRED;
        httpData.value = {
            loading: false,
            statusCode,
            error: { tokenExpired, message, response },
        };
    };

    const sendRequest = async (
        url: string,
        method: HttpMethods,
        data?: object,
        tokenRequired: boolean = true
    ): Promise<AxiosResponse> => {
        // Create abort controller
        abortControllerRef?.abort();
        abortControllerRef = new AbortController();

        // Prepare the web client
        let contentType: HeaderContent = "application/json";
        if (data instanceof FormData) {
            contentType = "multipart/form-data";
        }
        const webClient = getClient(contentType);

        // Check the Token
        const token = webClient.defaults.headers.Authorization;
        if (!token && tokenRequired) {
            abortControllerRef = null;
            httpData.value = {
                loading: false,
                error: {
                    tokenExpired: true,
                    message: TOKEN_EXPIRED,
                },
            };
            // We raise the same error as if we actually send
            // a request and got a token expired response
            throw new AxiosError(TOKEN_EXPIRED);
        }

        try {
            httpData.value = { loading: true };
            const resp = await webClient[method](url, data, {
                signal: abortControllerRef.signal,
            });
            handleSuccess(resp);
            return resp;
        } catch (err) {
            // Handle error
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
            abortControllerRef = null;
        }
    };

    return {
        httpData,
        sendRequest,
        clear,
    };
};
