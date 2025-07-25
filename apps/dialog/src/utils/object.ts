/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Creates a deep copy of the provided object or array, and handling
 * a wider range of built-in types: Date, Map, Set, File.
 *
 * @template T The type of the input object or array.
 * @param {T} obj The object or array to be copied.
 * @return {T} A deep copy of the provided object or array.
 */
export function deepCopy<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  let copy: any;
  if (Array.isArray(obj)) {
    copy = [];
    obj.forEach((item, index) => {
      copy[index] = deepCopy(item);
    });
  } else if (obj instanceof Date) {
    copy = new Date(obj.getTime());
  } else if (obj instanceof Map) {
    copy = new Map();
    obj.forEach((value, key) => {
      copy.set(key, deepCopy(value));
    });
  } else if (obj instanceof Set) {
    copy = new Set();
    obj.forEach((value) => {
      copy.add(deepCopy(value));
    });
  } else if (obj instanceof File) {
    copy = new File([obj], obj.name, { type: obj.type, lastModified: obj.lastModified });
  } else {
    copy = {};
    Object.keys(obj).forEach((key) => {
      copy[key] = deepCopy((obj as any)[key]);
    });
  }

  return copy;
}

/**
 * Performs a deep comparison between two values to determine if they are equivalent.
 * Supports deep equality checks for objects, arrays, Maps, Sets, Dates, and Files.
 *
 * @template T - The type of the objects being compared.
 * @param {T} obj1 - The first object to compare.
 * @param {T} obj2 - The second object to compare.
 * @returns {boolean} - Returns `true` if the objects are deeply equal, otherwise `false`.
 *
 * @example
 * const obj1 = { a: 1, b: [2, 3], c: new Date('2023-12-13') };
 * const obj2 = { a: 1, b: [2, 3], c: new Date('2023-12-13') };
 * console.log(deepEqual(obj1, obj2)); // true
 */
export function deepEqual<T>(obj1: T, obj2: T): boolean {
  if (obj1 === obj2) {
    return true;
  }

  if (obj1 === null || obj2 === null || typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return false;
  }

  if (obj1 instanceof Date && obj2 instanceof Date) {
    return obj1.getTime() === obj2.getTime();
  }

  if (obj1 instanceof Map && obj2 instanceof Map) {
    if (obj1.size !== obj2.size) {
      return false;
    }
    for (const [key, value] of obj1.values()) {
      if (!obj2.has(key) || !deepEqual(value, obj2.get(key))) {
        return false;
      }
    }
    return true;
  }

  if (obj1 instanceof Set && obj2 instanceof Set) {
    if (obj1.size !== obj2.size) {
      return false;
    }
    for (const value of obj1.values()) {
      if (!Array.from(obj2).some((v) => deepEqual(value, v))) {
        return false;
      }
    }
    return true;
  }

  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) {
      return false;
    }
    return obj1.every((item, index) => deepEqual(item, obj2[index]));
  }

  if (obj1 instanceof File && obj2 instanceof File) {
    return (
      obj1.name === obj2.name &&
      obj1.type === obj2.type &&
      obj1.size === obj2.size &&
      obj1.lastModified === obj2.lastModified
    );
  }

  if (obj1 instanceof Object && obj2 instanceof Object) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
      return false;
    }

    return keys1.every((key) => deepEqual((obj1 as any)[key], (obj2 as any)[key]));
  }

  return false;
}
