import { Types } from "mongoose";
import { ZodTypeAny } from "zod";

import { env } from "@/config";
import { ApiError, HttpStatus, MimeType } from "@/lib/express";

import { zod } from "./base";

export const zodObjectId = () => {
    return zod
        .string()
        .min(24)
        .refine((val) => Types.ObjectId.isValid(val), {
            message: "Must be a valid ObjectId",
        })
        .transform((val) => new Types.ObjectId(val));
};

const _zodFile = (
    acceptedMimetypes: string[] | null = null,
    maxSize: number = env.FILEUPLOAD_MAX_SIZE
) => {
    acceptedMimetypes = acceptedMimetypes || [MimeType.JPEG, MimeType.PNG];
    return zod.object({
        fieldname: zod.string(),
        originalname: zod.string(),
        encoding: zod.string(),
        mimetype: zod.string().refine((val) => acceptedMimetypes.includes(val)),
        size: zod
            .number()
            .max(maxSize * 1024 * 1024, `File must be ≤${maxSize}MB`),
        buffer: zod.instanceof(Buffer),
    });
};

export const zodFile = (
    description: string,
    acceptedMimetypes: string[] | null = null,
    maxSize: number = env.FILEUPLOAD_MAX_SIZE
) => {
    return zod
        .any()
        .transform((val) => {
            const rs = _zodFile(acceptedMimetypes, maxSize);
            const result = rs.safeParse(val);
            if (!result.success) {
                throw new ApiError(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "Invalid file upload"
                );
            }
            return result.data;
        })
        .openapi({
            type: "string",
            format: "binary",
            description,
        });
};

export const zodObject = (config: { [fieldname: string]: ZodTypeAny }) => {
    // Fix swagger UI error of stringifying objects
    return zod.preprocess(
        (val) => (typeof val === "string" ? JSON.parse(val) : val),
        zod.object(config)
    );
};
