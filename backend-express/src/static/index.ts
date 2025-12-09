import fs from "fs";

export const getImagePath = (p: string) => {
    return `/app/src/static/images/${p}`;
};

export const readImage = (p: string) => {
    return fs.readFileSync(getImagePath(p));
};
