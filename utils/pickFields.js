export const pickFields = (source, allowedKeys) => {
  if (!source || typeof source !== 'object') {
    return {};
  }

  return allowedKeys.reduce((result, key) => {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      result[key] = source[key];
    }
    return result;
  }, {});
};
