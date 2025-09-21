import { Reactive, reactive, ref, watch } from "vue";

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

export interface FormState<T extends string> {
    fields: Record<T, FieldState>;
    valid: boolean; // Is the whole form valid
}

export const useForm = <T extends string>(config: Record<T, FieldConfig>) => {
    // Setup
    const fieldNames = Object.keys(config) as T[];

    // State
    const fields = fieldNames.reduce(
        (result, name) => {
            const fieldConfig = config[name];
            const value = fieldConfig.initial || "";
            const validators = fieldConfig.validators || [];
            const initial = fieldConfig.initial;
            const active = fieldConfig.active ?? true;
            const valid = validate(value, validators);
            result[name] = reactive<FieldState>({
                value,
                initial,
                active,
                valid,
                validators,
            });
            return result;
        },
        {} as Record<T, Reactive<FieldState>>
    );
    const recheckFormValidity = (): boolean => {
        for (const name of fieldNames) {
            const { active, valid } = fields[name];
            if (active && !valid) return false;
        }
        return true;
    };
    const formValid = ref<boolean>(recheckFormValidity());

    // Watchers
    for (const name of fieldNames) {
        const field = (fields as Record<T, FieldState>)[name];
        watch([() => field.value, () => field.validators], () => {
            const isValid = validate(field.value, field.validators);
            field.valid = isValid;
            formValid.value = recheckFormValidity();
        });
    }

    // Handlers
    const prefillData = (data: Partial<Record<T, any>>) => {
        (Object.keys(data) as T[]).forEach((name) => {
            fields[name].value = data[name]!;
        });
    };

    const updateFieldConfig = (update: Partial<Record<T, FieldConfig>>) => {
        (Object.keys(update) as T[]).forEach((name) => {
            const field = fields[name];
            const config = update[name]!;
            if (config.active !== undefined) field.active = config.active;
            if (config.validators !== undefined)
                field.validators = config.validators;
            if (config.initial !== undefined) field.initial = config.initial;
        });
    };

    return { fields, formValid, prefillData, updateFieldConfig };
};
