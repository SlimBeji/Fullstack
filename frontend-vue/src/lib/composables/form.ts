import { reactive, watch } from "vue";

interface InputState {
    val: any;
    isActive?: boolean;
    isValid: boolean;
}

export interface FormState<T extends string> {
    inputs: Record<T, InputState>;
    isValid: boolean; // Is the whole form valid
}

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

const recheckFormValidity = <T extends string>(
    inputs: Record<T, InputState>
): boolean => {
    for (const key in inputs) {
        const { isActive, isValid } = inputs[key];
        if (isActive && !isValid) return false;
    }
    return true;
};

type InputHandler = (val: any, isValid: boolean) => void;
type InputHandlers<T extends string> = Record<T, InputHandler>;

export const useForm = <T extends string>(initialState: FormState<T>) => {
    const formState = reactive<FormState<T>>(initialState);
    const formStateInputs = formState.inputs as Record<T, InputState>;

    watch(
        () => formState.inputs,
        () => {
            formState.isValid = recheckFormValidity(formStateInputs);
        },
        { deep: true }
    );

    const inputHandlers = {} as InputHandlers<T>;
    (Object.keys(formStateInputs) as T[]).forEach((key) => {
        inputHandlers[key] = (val: any, isValid: boolean) => {
            formStateInputs[key].val = val;
            formStateInputs[key].isValid = isValid;
        };
    });

    const setFormData = (payload: Partial<Record<T, InputState>>) => {
        (Object.keys(payload) as T[]).forEach((key) => {
            formStateInputs[key] = payload[key]!;
        });
    };

    const fieldsActivationHandler = (payload: Partial<Record<T, boolean>>) => {
        (Object.keys(payload) as T[]).forEach((key) => {
            formStateInputs[key].isActive = payload[key];
        });
    };

    return { formState, inputHandlers, setFormData, fieldsActivationHandler };
};
