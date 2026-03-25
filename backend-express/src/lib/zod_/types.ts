import { ZodTypeAny } from "zod";

import { ApiError, HttpStatus, MimeType } from "../types";
import { parseTime } from "../utils";
import { zod } from "./base";

export const zodDatetime = zod.preprocess((val) => {
    if (typeof val === "string") {
        return parseTime(val);
    }
    return val;
}, zod.date());

const _zodFile = (acceptedMimetypes: string[] | null, maxSize: number) => {
    acceptedMimetypes = acceptedMimetypes || [MimeType.JPEG, MimeType.PNG];
    return zod.object({
        fieldname: zod.string(),
        originalname: zod.string(),
        encoding: zod.string(),
        mimetype: zod
            .string()
            .refine((val) => acceptedMimetypes.includes(val), {
                message: `File type must be one of: ${acceptedMimetypes.join(", ")}`,
            }),
        size: zod
            .number()
            .max(maxSize * 1024 * 1024, `File must be ≤${maxSize}MB`),
        buffer: zod.instanceof(Buffer),
    });
};

export const zodFile = (
    description: string,
    maxSize: number,
    acceptedMimetypes: string[] | null = null
) => {
    return zod
        .any()
        .transform((val) => {
            const rs = _zodFile(acceptedMimetypes, maxSize);
            const result = rs.safeParse(val);
            if (!result.success) {
                throw new ApiError(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "Invalid file upload",
                    result.error.issues
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
