import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { infer, RefinementCtx, z, ZodNever } from "zod";

extendZodWithOpenApi(z);

export const zod = z;
export type { RefinementCtx, infer as ZodInfer, ZodNever };
