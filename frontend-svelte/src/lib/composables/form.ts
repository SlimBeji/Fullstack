import type { Writable } from "svelte/store";
import { derived, writable } from "svelte/store";

import type { ValidatorType } from "../utils";
import { validate } from "../utils";

interface FieldConfig {
    active?: boolean;
    initial?: any;
    validators?: ValidatorType[];
}

interface FieldState extends FieldConfig {
    value: any;
    active: boolean;
    valid: boolean;
    validators: ValidatorType[];
}

export type FormConfig = Record<string, FieldConfig>;

export const useForm = <T extends string>(config: Record<T, FieldConfig>) => {
    // Init
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
            const field = writable<FieldState>({
                value,
                initial,
                active,
                valid,
                validators,
            });
            field.subscribe((f) => {
                const isValid = validate(f.value, f.validators);
                if (isValid != f.valid) {
                    field.update((f) => ({ ...f, valid: isValid }));
                }
            });
            result[name] = field;
            return result;
        },
        {} as Record<T, Writable<FieldState>>
    );

    const formValid = derived(
        Object.values(fields) as Writable<FieldState>[],
        ($fields) => $fields.every((f: FieldState) => !f.active || f.valid)
    );

    const prefillData = (data: Partial<Record<T, any>>) => {
        (Object.keys(data) as T[]).forEach((name) => {
            fields[name].update((f) => ({ ...f, value: data[name]! }));
        });
    };

    const updateFieldConfig = (update: Partial<Record<T, FieldConfig>>) => {
        (Object.keys(update) as T[]).forEach((name) => {
            fields[name].update((f) => {
                const conf = update[name]!;
                return {
                    ...f,
                    active: conf.active ?? f.active,
                    validators: conf.validators ?? f.validators,
                    initial: conf.initial ?? f.initial,
                };
            });
        });
    };

    return { fields, formValid, prefillData, updateFieldConfig };
};
