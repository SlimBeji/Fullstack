import { AxiosError, AxiosResponse, HttpStatusCode } from "axios";
import { useCallback, useEffect, useReducer, useRef } from "react";

import { HeaderContent, HttpMethods } from "../../types";
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

enum ActionType {
    STORED_TOKEN_EXPIRED,
    SEND_REQUEST,
    PARSE_RESPONSE,
    PARSE_ERROR,
    CLEAR_ERROR,
}

interface StoredTokenExpiredAction {
    type: ActionType.STORED_TOKEN_EXPIRED;
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
    | StoredTokenExpiredAction
    | SendRequestAction
    | ParseResponseAction
    | ParseErrorAction
    | ClearErrorAction;

const emptyState: State = { loading: false };

const reducer = (state: State, action: Action): State => {
    switch (action.type) {
        case ActionType.STORED_TOKEN_EXPIRED:
            return {
                loading: false,
                error: {
                    tokenExpired: true,
                    message: TOKEN_EXPIRED,
                },
            };
        case ActionType.SEND_REQUEST:
            return { loading: true };
        case ActionType.PARSE_RESPONSE:
            return {
                loading: false,
                statusCode: action.payload.status,
                json: action.payload.data,
            };
        case ActionType.PARSE_ERROR: {
            const statusCode = action.payload.status;
            const response = action.payload.response;
            const data = response?.data as {
                message?: string;
                details?: { error: any };
            };
            const message = data.message || "Something went wrong!";
            const tokenExpired = message === TOKEN_EXPIRED;
            return {
                loading: false,
                statusCode,
                error: { tokenExpired, message, response },
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

type SendRequestType = (
    url: string,
    method: HttpMethods,
    data?: Record<string, any>,
    tokenRequired?: boolean
) => Promise<AxiosResponse>;

type ClearErrorType = () => void;

export const useHttp = (
    options: useHttpOptions = {}
): [State, SendRequestType, ClearErrorType] => {
    const abortControllerRef = useRef<AbortController>(null);
    const [state, dispatch] = useReducer(reducer, emptyState);

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

            // Check the Token
            const token = webClient.defaults.headers.Authorization;
            if (!token && tokenRequired) {
                dispatch({ type: ActionType.STORED_TOKEN_EXPIRED });
                abortControllerRef.current = null;
                // We raise the same error as if we actually send
                // a request and got a token expired response
                throw new AxiosError(TOKEN_EXPIRED);
            }

            try {
                // Send Request
                dispatch({ type: ActionType.SEND_REQUEST });
                const resp = await webClient[method](url, data, {
                    signal: abortControllerRef.current.signal,
                });

                // Handle good response
                dispatch({
                    type: ActionType.PARSE_RESPONSE,
                    payload: resp,
                });
                return resp;
            } catch (err) {
                // Handle error
                if (err instanceof AxiosError) {
                    if (
                        err.response?.status === HttpStatusCode.NotFound &&
                        options.ignoreNotFound
                    ) {
                        dispatch({
                            type: ActionType.PARSE_RESPONSE,
                            payload: err.response,
                        });
                        return err.response;
                    } else {
                        dispatch({
                            type: ActionType.PARSE_ERROR,
                            payload: err,
                        });
                        throw err;
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
