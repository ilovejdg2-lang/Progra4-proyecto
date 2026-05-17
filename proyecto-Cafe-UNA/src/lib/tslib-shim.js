export function __assign(target, ...sources) {
  return Object.assign(target, ...sources);
}

export function __rest(source, exclude) {
  const target = {};

  for (const property in source) {
    if (Object.prototype.hasOwnProperty.call(source, property) && !exclude.includes(property)) {
      target[property] = source[property];
    }
  }

  return target;
}

export function __spreadArray(to, from, pack) {
  if (pack || arguments.length === 2) {
    for (let index = 0; index < from.length; index += 1) {
      to.push(from[index]);
    }

    return to;
  }

  return to.concat(from);
}

export function __importStar(mod) {
  return mod;
}
