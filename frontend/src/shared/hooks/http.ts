import { useCallback, useReducer, useRef, useEffect } from "react";
import { AxiosError, AxiosResponse } from "axios";
import { HttpMethods } from "../types";
import { backendApi } from "../util/axios";

interface State {
    loading: boolean;
    statusCode?: number;
    data?: {
        parsed: object;
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

export const useHttp = (): [
    State,
    (url: string, method: HttpMethods, data?: object) => Promise<void>,
    () => void
] => {
    const abortControllerRef = useRef<AbortController>(null);
    const [state, dispatch] = useReducer(reducer, emptyState);

    const sendRequest = useCallback(
        async (url: string, method: HttpMethods, data?: object) => {
            abortControllerRef.current?.abort();
            abortControllerRef.current = new AbortController();
            dispatch({ type: ActionType.SEND_REQUEST });
            try {
                const resp = await backendApi[method](url, data, {
                    signal: abortControllerRef.current.signal,
                });
                dispatch({
                    type: ActionType.PARSE_RESPONSE,
                    payload: resp,
                });
            } catch (err) {
                if (err instanceof AxiosError) {
                    dispatch({
                        type: ActionType.PARSE_ERROR,
                        payload: err,
                    });
                }
                throw err;
            }
            abortControllerRef.current = null;
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
