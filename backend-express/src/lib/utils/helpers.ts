export const getEnvVar = (varname: string, defaultValue?: string): string => {
    const value = process.env[varname] || defaultValue;
    if (!value && defaultValue === undefined) {
        throw new Error(`${varname} must be set as environment variable`);
    }
    return value || "";
};

export const sleep = (seconds: number) => {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
};

export const parseDotNotation = (data: any): any => {
    const result: any = {};

    for (const dotKey in data) {
        if (!Object.prototype.hasOwnProperty.call(data, dotKey)) {
            continue; // Ensure it's an own property from the input data
        }

        const parts = dotKey.split(".");
        let current: { [key: string]: any } = result;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!(part in current)) {
                current[part] = {};
            }
            current = current[part];
        }

        // Assign the original value and operation object to the deepest (last) part
        const lastPart = parts[parts.length - 1];
        current[lastPart] = data[dotKey];
    }

    return result;
};

export const flattenJson = (
    obj: Record<string, any>,
    acceptArrays: boolean = false,
    prefix = ""
): Record<string, any> => {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (Array.isArray(value)) {
            if (!acceptArrays) {
                throw new Error(
                    `Array encountered at path '${newKey}' but arrays are not allowed`
                );
            }
            value.forEach((item, index) => {
                if (typeof item === "object" && item !== null) {
                    Object.assign(
                        result,
                        flattenJson(item, acceptArrays, `${newKey}.${index}`)
                    );
                } else {
                    result[`${newKey}.${index}`] = item;
                }
            });
        } else if (typeof value === "object" && value !== null) {
            Object.assign(result, flattenJson(value, acceptArrays, newKey));
        } else {
            result[newKey] = value;
        }
    }

    return result;
};
