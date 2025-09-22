import { useCallback, useMemo, useReducer } from "react";

import { validate, ValidatorType } from "../utils";

interface FieldConfig {
    active?: boolean;
    initial?: any;
    validators?: ValidatorType[];
}

interface FieldState extends FieldConfig {
    value: any;
    initial?: any;
    active: boolean;
    valid: boolean;
    validators: ValidatorType[];
}

export type FormConfig = Record<string, FieldConfig>;

interface FormState<T extends string> {
    fields: Record<T, FieldState>;
    valid: boolean; // is the whole form valid
}

const isFormValid = <T extends string>(
    inputs: Record<T, FieldState>
): boolean => {
    for (const name in inputs) {
        const { active, valid } = inputs[name];
        if (active && !valid) return false;
    }
    return true;
};

enum ActionType {
    UPDATE_VALUE,
    UPDATE_CONFIG,
    PREFILL,
}

interface UpdateValueAction<T extends string> {
    type: ActionType.UPDATE_VALUE;
    payload: { name: T; value: any };
}

interface UpdateConfigAction<T extends string> {
    type: ActionType.UPDATE_CONFIG;
    payload: Partial<Record<T, FieldConfig>>;
}

interface PrefillAction<T extends string> {
    type: ActionType.PREFILL;
    payload: Partial<Record<T, any>>;
}

type FormAction<T extends string> =
    | UpdateValueAction<T>
    | UpdateConfigAction<T>
    | PrefillAction<T>;

const fieldsStateCopy = <T extends string>(
    state: Record<T, FieldState>
): Record<T, FieldState> => {
    return (Object.keys(state) as T[]).reduce(
        (result, key) => {
            result[key] = { ...state[key] };
            return result;
        },
        {} as Record<T, FieldState>
    );
};

const formReducer = <T extends string>(
    state: FormState<T>,
    action: FormAction<T>
): FormState<T> => {
    const fields = fieldsStateCopy(state.fields);
    switch (action.type) {
        case ActionType.UPDATE_VALUE: {
            const { name, value } = action.payload;
            const fieldState = fields[name];
            const valid = validate(value, fieldState.validators || []);
            fields[name] = { ...fieldState, value, valid };
            break;
        }
        case ActionType.UPDATE_CONFIG: {
            (Object.keys(action.payload) as T[]).forEach((name) => {
                const config = action.payload[name]!;
                if (config.active !== undefined)
                    fields[name].active = config.active;
                if (config.validators !== undefined)
                    fields[name].validators = config.validators;
                if (config.initial !== undefined)
                    fields[name].initial = config.initial;

                // Recheck validity
                fields[name].valid = validate(
                    fields[name].value,
                    fields[name].validators || []
                );
            });
            break;
        }
        case ActionType.PREFILL: {
            (Object.keys(action.payload) as T[]).forEach((name) => {
                fields[name].value = action.payload[name]!;

                // Recheck validity
                fields[name].valid = validate(
                    fields[name].value,
                    fields[name].validators || []
                );
            });
            break;
        }
        default:
            return state;
    }
    return { fields, valid: isFormValid(fields) };
};

type InputHandler = (value: any) => void;
type InputHandlers<T extends string> = { [key in T]: InputHandler };
type PrefillData<T extends string> = (payload: Partial<Record<T, any>>) => void;
type UpdateFieldConfig<T extends string> = (
    payload: Partial<Record<T, FieldConfig>>
) => void;

export const useForm = <T extends string>(
    config: FormConfig
): [FormState<T>, InputHandlers<T>, PrefillData<T>, UpdateFieldConfig<T>] => {
    // Setup -> Building initial state
    const fieldNames = useMemo(() => Object.keys(config) as T[], [config]);
    const initialFields = fieldNames.reduce(
        (result, name) => {
            const fieldConfig = config[name];
            const value = fieldConfig.initial || "";
            const validators = fieldConfig.validators || [];
            const initial = fieldConfig.initial;
            const active = fieldConfig.active ?? true;
            const valid = validate(value, validators);
            result[name] = { value, initial, active, valid, validators };
            return result;
        },
        {} as Record<T, FieldState>
    );
    const initialState: FormState<T> = {
        fields: initialFields,
        valid: isFormValid(initialFields),
    };
    const [state, dispatch] = useReducer(formReducer<T>, initialState);

    // Values Update
    const inputHandlers = useMemo(() => {
        return fieldNames.reduce((result, name) => {
            result[name] = (value: any) => {
                dispatch({
                    type: ActionType.UPDATE_VALUE,
                    payload: { value, name },
                });
            };
            return result;
        }, {} as InputHandlers<T>);
    }, [fieldNames, dispatch]);

    /// Prefill Data
    const prefillData = useCallback((payload: Partial<Record<T, any>>) => {
        dispatch({
            type: ActionType.PREFILL,
            payload,
        });
    }, []);

    const updateFieldConfig = useCallback(
        (payload: Partial<Record<T, FieldConfig>>) => {
            dispatch({
                type: ActionType.UPDATE_CONFIG,
                payload,
            });
        },
        []
    );

    return [state, inputHandlers, prefillData, updateFieldConfig];
};
