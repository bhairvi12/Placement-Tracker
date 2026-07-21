/**
 * Middleware factory that validates request bodies against Zod schemas.
 * @param {ZodSchema} schema - Zod schema to validate against
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }
  // Use the parsed data (includes coercion, stripping unrecognized fields, etc.)
  req.body = result.data;
  next();
};

export default validate;
