import { useCallback, useMemo, useReducer } from "react";

interface InputState<T extends string> {
    fieldName: T;
    val: any;
    isActive?: boolean;
    isValid: boolean;
}

export interface FormState<T extends string> {
    inputs: { [key in T]: InputState<T> };
    isValid: boolean;
}

const recheckFormValidity = <T extends string>(data: FormState<T>): boolean => {
    for (const key in data.inputs) {
        const { isActive, isValid } = data.inputs[key];
        if (isActive && !isValid) {
            return false;
        }
    }
    return true;
};

enum ActionType {
    UPDATE_FIELD,
    PREFILL,
    FIELDS_ACTIVATION,
}

interface UpdateInputAction<T extends string> {
    type: ActionType.UPDATE_FIELD;
    payload: InputState<T>;
}

interface PrefillAction<T extends string> {
    type: ActionType.PREFILL;
    payload: InputState<T>[];
}

interface FieldsActivationAction<T extends string> {
    type: ActionType.FIELDS_ACTIVATION;
    payload: { [K in T]?: boolean };
}

type FormAction<T extends string> =
    | UpdateInputAction<T>
    | PrefillAction<T>
    | FieldsActivationAction<T>;

const formReducer = <T extends string>(
    state: FormState<T>,
    action: FormAction<T>
): FormState<T> => {
    const newState = {
        ...state,
        inputs: { ...state.inputs },
    };
    switch (action.type) {
        case ActionType.UPDATE_FIELD:
            newState.inputs[action.payload.fieldName] = {
                ...action.payload,
                isActive: action.payload.isActive === false ? false : true,
            };
            break;
        case ActionType.PREFILL:
            for (const item of action.payload) {
                newState.inputs[item.fieldName] = {
                    ...item,
                    isActive: item.isActive === false ? false : true,
                };
            }
            break;
        case ActionType.FIELDS_ACTIVATION:
            for (const fieldName in action.payload) {
                newState.inputs[fieldName].isActive = action.payload[fieldName];
            }
            break;
        default:
            return state;
    }
    newState.isValid = recheckFormValidity(newState);
    return newState;
};

export const emptyStateBuilder = <T extends string>(formConfig: {
    [key in T]: boolean;
}): FormState<T> => {
    const inputs = (Object.keys(formConfig) as T[]).reduce(
        (result, name) => {
            result[name] = {
                fieldName: name,
                val: "",
                isActive: formConfig[name],
                isValid: false,
            };
            return result;
        },
        {} as { [key in T]: InputState<T> }
    );
    return { inputs, isValid: false };
};

export const useForm = <T extends string>(
    initialState: FormState<T>
): [
    FormState<T>,
    { [key in T]: (val: any, isValid: boolean) => void },
    (payload: InputState<T>[]) => void,
    (payload: { [key in T]?: boolean }) => void,
] => {
    const [state, dispatch] = useReducer(formReducer<T>, initialState);

    const inputHandlers = useMemo(() => {
        const handlers: {
            [key in T]: (val: any, isValid: boolean) => void;
        } = {} as any;
        for (const key in initialState.inputs) {
            handlers[key] = (val: any, isValid: boolean) => {
                dispatch({
                    type: ActionType.UPDATE_FIELD,
                    payload: {
                        fieldName: key as T,
                        val,
                        isValid,
                    },
                });
            };
        }
        return handlers;
    }, [initialState.inputs, dispatch]);

    const setFormData = useCallback((payload: InputState<T>[]) => {
        dispatch({
            type: ActionType.PREFILL,
            payload,
        });
    }, []);

    const fieldsActivationHandler = useCallback(
        (payload: { [key in T]?: boolean }) => {
            dispatch({
                type: ActionType.FIELDS_ACTIVATION,
                payload,
            });
        },
        []
    );

    return [state, inputHandlers, setFormData, fieldsActivationHandler];
};
