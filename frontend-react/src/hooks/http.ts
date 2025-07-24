import { AxiosError, AxiosResponse, HttpStatusCode } from "axios";
import { useCallback, useEffect, useReducer, useRef } from "react";

import { HeaderContent, HttpMethods } from "../types";
import { getClient } from "../util";

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

enum ActionType {
    SEND_REQUEST,
    PARSE_RESPONSE,
    PARSE_ERROR,
    CLEAR_ERROR,
    TOKEN_EXPIRED,
}

interface SendRequestAction {
    type: ActionType.SEND_REQUEST;
}

interface ParseResponseAction {
    type: ActionType.PARSE_RESPONSE;
    payload: AxiosResponse;
}

interface ParseErrorAction {
    type: ActionType.PARSE_ERROR;
    payload: AxiosError;
}

interface ClearErrorAction {
    type: ActionType.CLEAR_ERROR;
}

type Action =
    | SendRequestAction
    | ParseResponseAction
    | ParseErrorAction
    | ClearErrorAction;

const emptyState: State = { loading: false };

const reducer = (state: State, action: Action): State => {
    switch (action.type) {
        case ActionType.SEND_REQUEST:
            return { loading: true };
        case ActionType.PARSE_RESPONSE:
            return {
                loading: false,
                statusCode: action.payload.status,
                json: action.payload.data,
            };
        case ActionType.PARSE_ERROR: {
            if (action.payload.message === "Token expired") {
                // Token stored was purged after expiring
                return {
                    loading: false,
                    error: {
                        tokenExpired: true,
                        message: TOKEN_EXPIRED,
                    },
                };
            }

            // Sent expired token
            const errResponse = action.payload.response;
            const status = errResponse?.status;
            const errorData = errResponse?.data as any;
            const errMessage: string = errorData?.details?.error || "";
            if (errMessage === TOKEN_EXPIRED) {
                return {
                    loading: false,
                    statusCode: status,
                    error: {
                        tokenExpired: true,
                        message: TOKEN_EXPIRED,
                        response: errResponse,
                    },
                };
            }

            const data = action.payload.response?.data as { message?: string };
            const message = data?.message || "Something went wrong!";
            return {
                loading: false,
                statusCode: action.payload.status,
                error: {
                    tokenExpired: false,
                    message,
                    response: action.payload.response,
                },
            };
        }
        case ActionType.CLEAR_ERROR:
            return { loading: false };
        default:
            return state;
    }
};

interface useHttpOptions {
    ignoreNotFound?: boolean;
}

export const useHttp = (
    options: useHttpOptions = {}
): [
    State,
    (
        url: string,
        method: HttpMethods,
        data?: Record<string, any>,
        tokenRequired?: boolean
    ) => Promise<AxiosResponse>,
    () => void,
] => {
    const abortControllerRef = useRef<AbortController>(null);
    const [state, dispatch] = useReducer(reducer, emptyState);

    const dispatchOk = (resp: AxiosResponse): void => {
        dispatch({
            type: ActionType.PARSE_RESPONSE,
            payload: resp,
        });
    };

    const dispatchNotOk = (err: AxiosError): void => {
        dispatch({
            type: ActionType.PARSE_ERROR,
            payload: err,
        });
    };

    const sendRequest = useCallback(
        async (
            url: string,
            method: HttpMethods,
            data?: object,
            tokenRequired: boolean = true
        ): Promise<AxiosResponse> => {
            // Create abort controller
            abortControllerRef.current?.abort();
            abortControllerRef.current = new AbortController();

            // Prepare the web client
            let contentType: HeaderContent = "application/json";
            if (data instanceof FormData) {
                contentType = "multipart/form-data";
            }
            const webClient = getClient(contentType);
            const token = webClient.defaults.headers.Authorization;

            if (!token && tokenRequired) {
                const err = new AxiosError(TOKEN_EXPIRED);
                dispatchNotOk(err);
                abortControllerRef.current = null;
                throw err;
            }

            try {
                // Send Request
                dispatch({ type: ActionType.SEND_REQUEST });
                const resp = await webClient[method](url, data, {
                    signal: abortControllerRef.current.signal,
                });

                // Handle good response
                dispatchOk(resp);
                return resp;
            } catch (err) {
                // Handle error
                if (err instanceof AxiosError) {
                    if (
                        err.response?.status === HttpStatusCode.NotFound &&
                        options.ignoreNotFound
                    ) {
                        dispatchOk(err.response);
                        return err.response;
                    } else {
                        dispatchNotOk(err);
                    }
                }

                throw err;
            } finally {
                abortControllerRef.current = null;
            }
        },
        [options.ignoreNotFound]
    );

    const clear = useCallback(() => {
        dispatch({ type: ActionType.CLEAR_ERROR });
    }, []);

    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort();
        };
    }, []);

    return [state, sendRequest, clear];
};
