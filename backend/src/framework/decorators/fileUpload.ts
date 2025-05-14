import "reflect-metadata";
import multer from "multer";
import {
    ParsedRequestHandler,
    RequestHandlerDescriptor,
    MulterFilesConfig,
    ParsedRequest,
} from "../types";

const filesUpload = multer({});

export function fileUploader(config: MulterFilesConfig) {
    return function (
        target: Object,
        key: string,
        desc: RequestHandlerDescriptor
    ) {
        Reflect.defineMetadata("multer", config, target, key);
    };
}

export function getFileUploader(
    target: object,
    key: string
): ParsedRequestHandler {
    const uploadConfig: MulterFilesConfig = Reflect.getMetadata(
        "multer",
        target,
        key
    );
    return filesUpload.fields(uploadConfig) as ParsedRequestHandler;
}

export function extractFile(
    req: ParsedRequest,
    field: string
): Express.Multer.File | null {
    try {
        const files = req.files as Record<string, Express.Multer.File[]>;
        return files[field][0];
    } catch {
        return null;
    }
}
