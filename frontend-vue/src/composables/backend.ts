import type { AxiosInstance, AxiosResponse } from "axios";
import axios, { AxiosError, HttpStatusCode } from "axios";
import { ref } from "vue";

import { getToken } from "@/storage";
import type { HeaderContent, HttpMethods } from "@/types";

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

interface useBackendOptions {
    ignoreNotFound?: boolean;
}

const getClient = (
    contentType: HeaderContent,
    token: string
): AxiosInstance => {
    const headers = {
        "Content-Type": contentType,
        ...(token && { Authorization: token }),
    };

    return axios.create({
        baseURL: `${import.meta.env.VITE_BACKEND_URL}`,
        headers,
    });
};

export const useBackend = (options: useBackendOptions = {}) => {
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

        // Check the Token
        const token = getToken();
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

        // Get the http client
        let contentType: HeaderContent = "application/json";
        if (data instanceof FormData) {
            contentType = "multipart/form-data";
        } else if (data instanceof URLSearchParams) {
            contentType = "application/x-www-form-urlencoded";
        }
        const webClient = getClient(contentType, token);

        try {
            // Sending the request
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
