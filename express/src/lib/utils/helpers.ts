import fs from "fs";

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

export const getImagePath = (p: string) => {
    return `/app/src/static/images/${p}`;
};

export const readImage = (p: string) => {
    return fs.readFileSync(getImagePath(p));
};
