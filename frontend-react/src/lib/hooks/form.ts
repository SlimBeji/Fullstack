import { useCallback, useMemo, useReducer } from "react";

interface InputState {
    val: any;
    isActive?: boolean;
    isValid: boolean;
}

export interface FormState<T extends string> {
    inputs: Record<T, InputState>;
    isValid: boolean; // Is the whole form valid
}

const recheckFormValidity = <T extends string>(
    inputs: Record<T, InputState>
): boolean => {
    for (const key in inputs) {
        const { isActive, isValid } = inputs[key];
        if (isActive && !isValid) return false;
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
    payload: { fieldName: T; val: any; isValid: boolean };
}

interface PrefillAction<T extends string> {
    type: ActionType.PREFILL;
    payload: Partial<Record<T, InputState>>;
}

interface FieldsActivationAction<T extends string> {
    type: ActionType.FIELDS_ACTIVATION;
    payload: Partial<Record<T, boolean>>;
}

type FormAction<T extends string> =
    | UpdateInputAction<T>
    | PrefillAction<T>
    | FieldsActivationAction<T>;

const deepStateCopy = <T extends string>(state: FormState<T>): FormState<T> => {
    return {
        ...state,
        inputs: (Object.keys(state.inputs) as T[]).reduce(
            (accumultaed, key) => {
                accumultaed[key] = { ...state.inputs[key] };
                return accumultaed;
            },
            {} as Record<T, InputState>
        ),
    };
};

const formReducer = <T extends string>(
    state: FormState<T>,
    action: FormAction<T>
): FormState<T> => {
    const newState = deepStateCopy(state);
    switch (action.type) {
        case ActionType.UPDATE_FIELD:
            newState.inputs[action.payload.fieldName] = {
                val: action.payload.val,
                isValid: action.payload.isValid,
                isActive: true,
            };
            break;
        case ActionType.PREFILL: {
            for (const key of Object.keys(action.payload) as T[]) {
                const input = action.payload[key]!;
                input.isActive = !!input.isActive;
                newState.inputs[key] = input;
            }
            break;
        }
        case ActionType.FIELDS_ACTIVATION:
            for (const fieldName in action.payload) {
                newState.inputs[fieldName].isActive = action.payload[fieldName];
            }
            break;
        default:
            return state;
    }
    newState.isValid = recheckFormValidity(newState.inputs);
    return newState;
};

export const emptyStateBuilder = <T extends string>(
    formConfig: Record<T, boolean>
): FormState<T> => {
    const inputs = (Object.keys(formConfig) as T[]).reduce(
        (result, name) => {
            result[name] = {
                val: "",
                isActive: formConfig[name],
                isValid: false,
            };
            return result;
        },
        {} as Record<T, InputState>
    );
    return { inputs, isValid: false };
};

type InputHandler = (val: any, isValid: boolean) => void;
type InputHandlers<T extends string> = { [key in T]: InputHandler };
type SetFormData<T extends string> = (
    payload: Partial<Record<T, InputState>>
) => void;
type FieldsActivationHandler<T extends string> = (
    payload: Partial<Record<T, boolean>>
) => void;

export const useForm = <T extends string>(
    initialState: FormState<T>
): [
    FormState<T>,
    InputHandlers<T>,
    SetFormData<T>,
    FieldsActivationHandler<T>,
] => {
    const [state, dispatch] = useReducer(formReducer<T>, initialState);

    const inputHandlers = useMemo(() => {
        const handlers: InputHandlers<T> = {} as any;
        for (const key in initialState.inputs) {
            handlers[key] = (val: any, isValid: boolean) => {
                dispatch({
                    type: ActionType.UPDATE_FIELD,
                    payload: { fieldName: key, val, isValid },
                });
            };
        }
        return handlers;
    }, [initialState.inputs, dispatch]);

    const setFormData = useCallback(
        (payload: Partial<Record<T, InputState>>) => {
            dispatch({
                type: ActionType.PREFILL,
                payload,
            });
        },
        []
    );

    const fieldsActivationHandler = useCallback(
        (payload: Partial<Record<T, boolean>>) => {
            dispatch({
                type: ActionType.FIELDS_ACTIVATION,
                payload,
            });
        },
        []
    );

    return [state, inputHandlers, setFormData, fieldsActivationHandler];
};
