// errno
const errnos = {
  ERRNO_INVALID_API_CLIENT_NAME : 100,
  ERRNO_UNAUTHORIZED            : 401,
  ERRNO_FORBIDDEN               : 403,
  ERRNO_INTERNAL_ERROR          : 500
};
exports.errnos = errnos;

// Error messages.
const errors = {
  BAD_REQUEST     : 'Bad Request',
  FORBIDDEN       : 'Forbidden',
  INTERNAL_ERROR  : 'Internal Server Error',
  UNAUTHORIZED    : 'Unauthorized'
};
exports.errors = errors;

// Model errors.
const modelErrors = {
  RECORD_ALREADY_EXISTS: 'RecordAlreadyExists'
};
exports.modelErrors = modelErrors;

exports.ApiError = (res, code, errno, error, message) => {
  if (!res) {
    throw new Error('Missing response object');
  }

  if (!errnos[errno]) {
    throw new Error('Invalid errno');
  }

  if (!errors[error]) {
    throw new Error('Invalid error');
  }

  return res.status(code).send({
    code,
    errno: errnos[errno],
    error: errors[error],
    message
  });
};

[errnos, errors, modelErrors].forEach(object => {
  Object.keys(object).forEach(key => exports[key] = key);
});
