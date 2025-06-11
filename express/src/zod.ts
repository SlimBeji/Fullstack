import { z, ZodTypeAny } from "zod";
import { Types } from "mongoose";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import Config from "./config";
import { HttpStatus, MimeType, ApiError } from "./types";

extendZodWithOpenApi(z);

const zodObjectId = () => {
    return z
        .string()
        .min(24)
        .refine((val) => Types.ObjectId.isValid(val), {
            message: "Must be a valid ObjectId",
        })
        .transform((val) => new Types.ObjectId(val));
};

const fileRuntimeSchema = (
    acceptedMimetypes: string[] | null = null,
    maxSize: number = Config.FILEUPLOAD_MAX_SIZE
) => {
    acceptedMimetypes = acceptedMimetypes || [MimeType.JPEG, MimeType.PNG];
    return z.object({
        fieldname: z.string(),
        originalname: z.string(),
        encoding: z.string(),
        mimetype: z.string().refine((val) => acceptedMimetypes.includes(val)),
        size: z
            .number()
            .max(maxSize * 1024 * 1024, `File must be ≤${maxSize}MB`),
        buffer: z.instanceof(Buffer),
    });
};

const zodFile = (
    description: string,
    acceptedMimetypes: string[] | null = null,
    maxSize: number = Config.FILEUPLOAD_MAX_SIZE
) => {
    return z
        .any()
        .transform((val) => {
            const rs = fileRuntimeSchema(acceptedMimetypes, maxSize);
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

const zodObject = (config: { [fieldname: string]: ZodTypeAny }) => {
    // Fix swagger UI error of stringifying objects
    return z.preprocess(
        (val) => (typeof val === "string" ? JSON.parse(val) : val),
        z.object(config)
    );
};

export { z, zodObjectId, zodFile, zodObject };
