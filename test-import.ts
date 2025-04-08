import { fromZodError } from "zod-validation-error";
import { z } from "zod";

const schema = z.object({
  name: z.string(),
});

try {
  schema.parse({});
} catch (err) {
  if (err instanceof z.ZodError) {
    const validationError = fromZodError(err);
    console.log(validationError.message);
  }
}