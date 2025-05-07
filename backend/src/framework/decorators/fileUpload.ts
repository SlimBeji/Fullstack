import "reflect-metadata";
import multer from "multer";
import {
    MetadataKeys,
    ParsedRequestHandler,
    RequestHandlerDescriptor,
    MulterFilesConfig,
} from "../types";

const filesUpload = multer({});

export function fileUploader(config: MulterFilesConfig) {
    return function (
        target: Object,
        key: string,
        desc: RequestHandlerDescriptor
    ) {
        Reflect.defineMetadata(MetadataKeys.multer, config, target, key);
    };
}

export function getFileUploader(
    target: object,
    key: string
): ParsedRequestHandler {
    const uploadConfig: MulterFilesConfig = Reflect.getMetadata(
        MetadataKeys.multer,
        target,
        key
    );
    return filesUpload.fields(uploadConfig) as ParsedRequestHandler;
}
