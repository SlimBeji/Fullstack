import { Request, RequestHandler } from "express";

import multer from "multer";

export interface MulterFileConfig {
    name: string;
    maxCount?: number;
}

export const fileUpload = (config: MulterFileConfig[]): RequestHandler => {
    const multerObj = multer({});
    return multerObj.fields(config);
};

export function extractFile(
    req: Request,
    field: string
): Express.Multer.File | null {
    try {
        const files = req.files as Record<string, Express.Multer.File[]>;
        return files[field][0];
    } catch {
        return null;
    }
}
