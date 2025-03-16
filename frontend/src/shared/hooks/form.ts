import { useCallback, useReducer } from "react";
import { RecursivePartial } from "../types";

interface InputState {
    val: string;
    isValid: boolean;
}

export interface FormState<T extends string> {
    inputs: { [key in T]: InputState };
    isValid: boolean;
}

const recheckValidity = <T extends string>(data: FormState<T>): boolean => {
    return (Object.keys(data.inputs) as T[]).every(
        (k) => data.inputs[k].isValid
    );
};

enum FormActionType {
    UPDATE = "UPDATE",
    PREFILL = "PREFILL",
}

interface FormUpdateAction<T extends string> {
    type: FormActionType.UPDATE;
    payload: { fieldName: T; val: string; isValid: boolean };
}

interface FormPrefillAction<T extends string> {
    type: FormActionType.PREFILL;
    payload: RecursivePartial<FormState<T>>;
}

const formReducer = <T extends string>(
    state: FormState<T>,
    action: FormUpdateAction<T> | FormPrefillAction<T>
): FormState<T> => {
    switch (action.type) {
        case FormActionType.UPDATE:
            const newState = {
                ...state,
                inputs: {
                    ...state.inputs,
                    [action.payload.fieldName]: {
                        val: action.payload.val,
                        isValid: action.payload.isValid,
                    },
                },
            };
            newState.isValid = recheckValidity(newState);
            return newState;
        case FormActionType.PREFILL:
            const prefilled = {
                ...state,
                inputs: {
                    ...state.inputs,
                    ...action.payload.inputs,
                },
            };
            prefilled.isValid = recheckValidity(prefilled);
            return prefilled;
        default:
            return state;
    }
};

export const emptyStateBuilder = <T extends string>(
    t: Record<any, T>
): FormState<T> => {
    const inputs = (Object.values(t) as T[]).reduce((result, name) => {
        result[name] = { val: "", isValid: false };
        return result;
    }, {} as { [key in T]: InputState });
    return { inputs, isValid: false };
};

export const useForm = <T extends string>(
    initialState: FormState<T>
): [
    FormState<T>,
    (fieldName: string, val: string, isValid: boolean) => void,
    (data: RecursivePartial<FormState<T>>) => void
] => {
    const [state, dispatch] = useReducer(formReducer<T>, initialState);

    const inputHandler = useCallback(
        (fieldName: string, val: string, isValid: boolean) => {
            dispatch({
                type: FormActionType.UPDATE,
                payload: {
                    fieldName: fieldName as T,
                    val,
                    isValid,
                },
            });
        },
        []
    );

    const setFormData = useCallback((data: RecursivePartial<FormState<T>>) => {
        dispatch({
            type: FormActionType.PREFILL,
            payload: data,
        });
    }, []);

    return [state, inputHandler, setFormData];
};
