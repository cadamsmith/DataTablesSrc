export function _isPlainObject(obj) {
  var proto, Ctor;

  // Detect obvious negatives
  // Use toString instead of jQuery.type to catch host objects
  if (!obj || toString.call(obj) !== '[object Object]') {
    return false;
  }

  proto = Object.getPrototypeOf(obj);

  // Objects with no prototype (e.g., `Object.create( null )`) are plain
  if (!proto) {
    return true;
  }

  // Objects with prototype are plain iff they were constructed by a global Object function
  Ctor = {}.hasOwnProperty.call(proto, 'constructor') && proto.constructor;
  return (
    typeof Ctor === 'function' &&
    {}.hasOwnProperty.toString.call(Ctor) ===
      {}.hasOwnProperty.toString.call(Object)
  );
}

export function _each(obj, callback) {
  var length,
    i = 0;

  if (isArrayLike(obj)) {
    length = obj.length;
    for (; i < length; i++) {
      if (callback.call(obj[i], i, obj[i]) === false) {
        break;
      }
    }
  } else {
    for (i in obj) {
      if (callback.call(obj[i], i, obj[i]) === false) {
        break;
      }
    }
  }

  return obj;
}

export function _map(elems, callback, arg) {
  var length,
    value,
    i = 0,
    ret = [];

  // Go through the array, translating each of the items to their new values
  if (isArrayLike(elems)) {
    length = elems.length;
    for (; i < length; i++) {
      value = callback(elems[i], i, arg);

      if (value != null) {
        ret.push(value);
      }
    }

    // Go through every key on the object,
  } else {
    for (i in elems) {
      value = callback(elems[i], i, arg);

      if (value != null) {
        ret.push(value);
      }
    }
  }

  // Flatten any nested arrays
  return flat(ret);
}

export function _extend() {
  var options,
    name,
    src,
    copy,
    copyIsArray,
    clone,
    target = arguments[0] || {},
    i = 1,
    length = arguments.length,
    deep = false;

  // Handle a deep copy situation
  if (typeof target === 'boolean') {
    deep = target;

    // Skip the boolean and the target
    target = arguments[i] || {};
    i++;
  }

  // Handle case when target is a string or something (possible in deep copy)
  if (typeof target !== 'object' && typeof target !== 'function') {
    target = {};
  }

  // Extend jQuery itself if only one argument is passed
  if (i === length) {
    target = this;
    i--;
  }

  for (; i < length; i++) {
    // Only deal with non-null/undefined values
    if ((options = arguments[i]) != null) {
      // Extend the base object
      for (name in options) {
        copy = options[name];

        // Prevent Object.prototype pollution
        // Prevent never-ending loop
        if (name === '__proto__' || target === copy) {
          continue;
        }

        // Recurse if we're merging plain objects or arrays
        if (
          deep &&
          copy &&
          (_isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))
        ) {
          src = target[name];

          // Ensure proper type for the source value
          if (copyIsArray && !Array.isArray(src)) {
            clone = [];
          } else if (!copyIsArray && !_isPlainObject(src)) {
            clone = {};
          } else {
            clone = src;
          }
          copyIsArray = false;

          // Never move original objects, clone them
          target[name] = _extend(deep, clone, copy);

          // Don't bring in undefined values
        } else if (copy !== undefined) {
          target[name] = copy;
        }
      }
    }
  }

  // Return the modified object
  return target;
}

// eslint-disable-next-line compat/compat
var flat = [].flat
  ? function (array) {
      // eslint-disable-next-line compat/compat
      return [].flat.call(array);
    }
  : function (array) {
      return [].concat.apply([], array);
    };

function isArrayLike(obj) {
  var length = !!obj && obj.length,
    type = toType(obj);

  if (typeof obj === 'function' || isWindow(obj)) {
    return false;
  }

  return (
    type === 'array' ||
    length === 0 ||
    (typeof length === 'number' && length > 0 && length - 1 in obj)
  );
}

function toType(obj) {
  if (obj == null) {
    return obj + '';
  }

  return typeof obj === 'object'
    ? {}[toString.call(obj)] || 'object'
    : typeof obj;
}

function isWindow(obj) {
  return obj != null && obj === obj.window;
}
