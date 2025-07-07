import { useCallback, useReducer, useRef, useEffect } from "react";
import { AxiosError, AxiosResponse, HttpStatusCode } from "axios";
import { HeaderContent, HttpMethods } from "../types";
import { getClient } from "../util";

interface State {
    loading: boolean;
    tokenExpired: boolean;
    statusCode?: number;
    data?: {
        parsed: Record<string, any>;
        raw: AxiosResponse;
    };
    error?: {
        message: string;
        raw: AxiosError;
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

interface TokenExpiredAction {
    type: ActionType.TOKEN_EXPIRED;
}

interface ClearErrorAction {
    type: ActionType.CLEAR_ERROR;
}

type Action =
    | SendRequestAction
    | ParseResponseAction
    | ParseErrorAction
    | ClearErrorAction
    | TokenExpiredAction;

const emptyState: State = { loading: false, tokenExpired: false };

const reducer = (state: State, action: Action): State => {
    switch (action.type) {
        case ActionType.SEND_REQUEST:
            return { loading: true, tokenExpired: false };
        case ActionType.PARSE_RESPONSE:
            return {
                loading: false,
                tokenExpired: false,
                statusCode: action.payload.status,
                data: {
                    parsed: action.payload.data,
                    raw: action.payload,
                },
            };
        case ActionType.PARSE_ERROR:
            const data = action.payload.response?.data as { message?: string };
            const message = data?.message || "Something went wrong!";
            return {
                loading: false,
                tokenExpired: false,
                statusCode: action.payload.status,
                error: { message, raw: action.payload },
            };
        case ActionType.CLEAR_ERROR:
            return { loading: false, tokenExpired: false };
        case ActionType.TOKEN_EXPIRED:
            return { loading: false, tokenExpired: true };
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
        contentType?: HeaderContent
    ) => Promise<AxiosResponse>,
    () => void
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
            data?: object
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
                    const errorDetail: string =
                        err.response?.data?.details?.error || "";

                    if (
                        err.response?.status === HttpStatusCode.Unauthorized &&
                        errorDetail === "Token expired"
                    ) {
                        dispatch({ type: ActionType.TOKEN_EXPIRED });
                    } else if (
                        err.response?.status === HttpStatusCode.NotFound &&
                        options.ignoreNotFound
                    ) {
                        dispatchOk(err.response);
                        return err.response;
                    } else {
                        dispatchNotOk(err);
                    }
                }

                // This should not be reached. Defensive programming
                throw err;
            } finally {
                abortControllerRef.current = null;
            }
        },
        []
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
