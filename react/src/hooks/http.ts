import { useCallback, useReducer, useRef, useEffect } from "react";
import { AxiosError, AxiosResponse, HttpStatusCode } from "axios";
import { HeaderContent, HttpMethods } from "../types";
import { getClient } from "../util/axios";

interface State {
    loading: boolean;
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
                statusCode: action.payload.status,
                error: { message, raw: action.payload },
            };
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
            abortControllerRef.current?.abort();
            abortControllerRef.current = new AbortController();
            let contentType: HeaderContent = "application/json";
            if (data instanceof FormData) {
                contentType = "multipart/form-data";
            }
            const webClient = getClient(contentType);
            dispatch({ type: ActionType.SEND_REQUEST });
            try {
                const resp = await webClient[method](url, data, {
                    signal: abortControllerRef.current.signal,
                });
                dispatchOk(resp);
                abortControllerRef.current = null;
                return resp;
            } catch (err) {
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
                abortControllerRef.current = null;
                throw err;
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
