import { deepCopy } from '../object';

/**
 * Returns random elements (without replacement) from an array of data.
 *
 * @param array - An array of data from which to select random values.
 * @param n - The number of values to select.
 * @returns An array containing random elements from the original array.
 */
export function getRandomElements<TItem>(arr: TItem[], n: number): TItem[] {
  return shuffleArray(arr).slice(0, n);
}

/**
 * Shuffles an array by randomly rearranging its elements.
 *
 * @param arr The array to be shuffled.
 * @returns A new array with the elements of the original array shuffled randomly.
 */
export function shuffleArray<TItem>(arr: TItem[]): TItem[] {
  const newArr = arr.slice();

  for (let i = newArr.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));

    const elem1 = newArr[randomIndex];
    const elem2 = newArr[i];

    if (elem1 === undefined || elem2 === undefined) continue;

    [newArr[i], newArr[randomIndex]] = [elem1, elem2];
  }

  return newArr;
}

/**
 * Retrieves a random element from the given array. If the array is empty, a specified default value is returned.
 * The function uses `Math.random()` to generate a random index for selecting an element from the array.
 * If the selected element is `undefined` (which can happen if the array contains `undefined` as a value),
 * the default value is returned instead.
 *
 * @template T The type of the elements in the array.
 * @param {T[]} array - The array from which to retrieve a random element.
 * @param {T} defaultValue - The value to return if the array is empty or if the randomly selected element is `undefined`.
 * @returns {T} A random element from the array or the default value if the array is empty or the selected element is `undefined`.
 *
 * @example
 * // Retrieve a random element from a list of numbers
 * const numbers = [1, 2, 3, 4, 5];
 * const randomNum = getRandomElement(numbers, 0);
 * console.log(randomNum); // Output: 3 (example output, actual output will vary)
 *
 * @example
 * // Retrieve a random element from an empty array with a default value
 * const emptyArray = [];
 * const defaultValue = 'default';
 * const result = getRandomElement(emptyArray, defaultValue);
 * console.log(result); // Output: 'default'
 */
export function getRandomElement<T>(array: T[], defaultValue: T): T {
  if (array.length === 0) {
    return defaultValue;
  }
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex] ?? defaultValue;
}

/**
 * Shuffles an array in place using the Fisher-Yates (aka Knuth) shuffle algorithm.
 * This algorithm ensures each permutation of the array is equally likely.
 *
 * @template T The type of the elements in the array.
 * @param {Array<T>} array - The array to shuffle.
 * @returns {Array<T>} The same array passed as parameter, but shuffled.
 *
 * @example
 * // Shuffling an array of numbers
 * const numbers = [1, 2, 3, 4, 5];
 * shuffle(numbers);
 * console.log(numbers); // Output: [3, 5, 1, 4, 2] (example output, actual output will vary)
 *
 * @example
 * // Shuffling an array of strings
 * const fruits = ['apple', 'banana', 'cherry', 'date'];
 * shuffle(fruits);
 * console.log(fruits); // Output: ['banana', 'date', 'apple', 'cherry'] (example output, actual output will vary)
 */
export default function shuffle<T>(array: Array<T>): Array<T> {
  let randomIndex = 0;
  let currentIndex = array.length;

  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    const current = array[currentIndex];
    const random = array[randomIndex];

    // @ts-expect-error T | undefined
    array[currentIndex] = random;
    // @ts-expect-error T | undefined
    array[randomIndex] = current;
  }

  return array;
}

/**
 * Creates a pseudo-random number generator (RNG) that is initialized with a given seed.
 * This RNG produces a deterministic sequence of numbers that is the same for the same seed.
 * The implementation is based on a linear congruential generator (LCG).
 *
 * @param {number} seed - The seed value to initialize the RNG.
 * @returns {() => number} A function that when called, returns a pseudo-random number between 0 (inclusive) and 1 (exclusive).
 */
function createSeededRNG(seed: number): () => number {
  let state = seed;
  const m = 0x80000000; // 2**31
  const a = 1103515245;
  const c = 12345;
  return () => {
    state = (a * state + c) % m;
    return state / m;
  };
}
/**
 * Shuffles an array in a deterministic manner using a provided seed value. This function
 * ensures that the same seed will result in the same shuffled array, making the shuffling
 * process repeatable and predictable. It also returns the mapping of indices from the original
 * array to their positions in the shuffled array.
 *
 * @template T The type of the elements in the array.
 * @param {T[]} array - The array to shuffle.
 * @param {number} seed - The seed value used to initialize the pseudo-random number generator for shuffling.
 * @returns An object containing:
 *  - `shuffled`: a new array with the elements shuffled.
 *  - `indicesMapping`: an array representing the mapping of each original index to the new index after shuffling.
 *
 * @example
 * // Example with integers
 * const { shuffled, indicesMapping } = shuffleArrayDeterministic([1, 2, 3, 4, 5], 12345);
 * console.log(shuffled); // Output might be [3, 1, 4, 5, 2] (example output, actual might differ based on RNG implementation)
 * console.log(indicesMapping); // Output might be [1, 4, 0, 2, 3] (example output, actual might differ)
 *
 * @example
 * // Example with strings
 * const result = shuffleArrayDeterministic(['apple', 'banana', 'cherry', 'date'], 67890);
 * console.log(result.shuffled); // Output might be ['banana', 'date', 'apple', 'cherry'] (example output, actual might differ)
 * console.log(result.indicesMapping); // Output might be [1, 3, 0, 2] (example output, actual might differ)
 */
export function shuffleArrayDeterministic<T>(
  array: T[],
  seed: number,
): {
  shuffled: T[];
  indicesMapping: number[];
} {
  const rng = createSeededRNG(Math.abs(seed));
  const shuffled = deepCopy(array);
  const indicesMapping = range(array.length);

  if (array.length === 1) {
    return { shuffled: array, indicesMapping };
  }

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    // @ts-expect-error we know that those elements are present
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    // @ts-expect-error we know that those element are present
    [indicesMapping[i], indicesMapping[j]] = [indicesMapping[j], indicesMapping[i]];
  }

  return { shuffled, indicesMapping };
}

export function range(end: number, start: number = 0): number[] {
  return Array(end)
    .fill(0)
    .map((_, index) => start + index);
}
