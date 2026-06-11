export interface FieldState extends FieldConfig {
    value: any;
    initial?: any;
    active: boolean;
    valid: boolean;
    validators: ValidatorType[];
}

type ValidatorType = (txt: string) => boolean;

export interface FieldConfig {
    active?: boolean;
    initial?: any;
    validators?: ValidatorType[];
}

export type FormConfig = Record<string, FieldConfig>;

// REMOVE THIS
export const validatorPlaceholder = (txt: string): boolean => txt.length > 6;
