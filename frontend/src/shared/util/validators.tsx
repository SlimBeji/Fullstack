export enum ValidatorEnum {
    ANY = "ANY",
    REQUIRE = "REQUIRE",
    MINLENGTH = "MINLENGTH",
    MAXLENGTH = "MAXLENGTH",
    MIN = "MIN",
    MAX = "MAX",
    EMAIL = "EMAIL",
}

interface AnyValidatorType {
    name: ValidatorEnum.ANY;
}

export const anyValidator = (): AnyValidatorType => {
    return { name: ValidatorEnum.ANY };
};

interface RequireValidatorType {
    name: ValidatorEnum.REQUIRE;
}

export const requireValidator = (): RequireValidatorType => {
    return { name: ValidatorEnum.REQUIRE };
};

interface MinlengthValidatorType {
    name: ValidatorEnum.MINLENGTH;
    val: number;
}

export const minLengthValidator = (val: number): MinlengthValidatorType => {
    return { name: ValidatorEnum.MINLENGTH, val };
};

interface MaxlengthValidatorType {
    name: ValidatorEnum.MAXLENGTH;
    val: number;
}

export const maxLengthValidator = (val: number): MaxlengthValidatorType => {
    return { name: ValidatorEnum.MAXLENGTH, val };
};

interface MinValidatorType {
    name: ValidatorEnum.MIN;
    val: number;
}

export const minValidator = (val: number): MinValidatorType => {
    return { name: ValidatorEnum.MIN, val };
};

interface MaxValidatorType {
    name: ValidatorEnum.MAX;
    val: number;
}

export const maxValidator = (val: number): MaxValidatorType => {
    return { name: ValidatorEnum.MAX, val };
};

interface EmailValidatorType {
    name: ValidatorEnum.EMAIL;
}

export const emailValidator = (): EmailValidatorType => {
    return { name: ValidatorEnum.EMAIL };
};

export type ValidatorType =
    | AnyValidatorType
    | RequireValidatorType
    | MinlengthValidatorType
    | MaxlengthValidatorType
    | MinValidatorType
    | MaxValidatorType
    | EmailValidatorType;

export const validate = (
    value: string,
    validators: ValidatorType[]
): boolean => {
    for (const validator of validators) {
        switch (validator.name) {
            case ValidatorEnum.ANY:
                return true;
            case ValidatorEnum.REQUIRE:
                if (value.trim().length === 0) return false;
                break;
            case ValidatorEnum.MINLENGTH:
                if (value.trim().length < validator.val) return false;
                break;
            case ValidatorEnum.MAXLENGTH:
                if (value.trim().length > validator.val) return false;
                break;
            case ValidatorEnum.MIN:
                if (+value < validator.val) return false;
                break;
            case ValidatorEnum.MAX:
                if (+value > validator.val) return false;
                break;
            case ValidatorEnum.EMAIL:
                if (!/^\S+@\S+\.\S+$/.test(value)) return false;
                break;
            default:
                throw Error(`Unknow validator type ${validator}`);
        }
    }
    return true;
};
