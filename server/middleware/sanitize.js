// Strips MongoDB operator injection vectors from request input.
//
// Express's default `qs` query parser turns `?x[$ne]=` or `?x[$gt]=` into a
// nested object, which — when spread straight into a Mongoose filter — lets a
// caller inject query operators. This middleware recursively removes any key
// that starts with '$' or contains a '.' from req.body, req.query and
// req.params. Values are left untouched.

const FORBIDDEN_KEY = /^\$|\./;

const sanitizeInPlace = (obj) => {
  if (!obj || typeof obj !== 'object') return;
  if (Array.isArray(obj)) {
    obj.forEach(sanitizeInPlace);
    return;
  }
  for (const key of Object.keys(obj)) {
    if (FORBIDDEN_KEY.test(key)) {
      delete obj[key];
    } else {
      sanitizeInPlace(obj[key]);
    }
  }
};

export const mongoSanitize = (req, res, next) => {
  sanitizeInPlace(req.body);
  sanitizeInPlace(req.query);
  sanitizeInPlace(req.params);
  next();
};

export default mongoSanitize;
