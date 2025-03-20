import shuffle from '@/utils/array/array';

import fs from 'fs';
import crypto from 'crypto';
import { Account } from '../utils';
import { getErrorMessage } from '@/utils/error';

/**
 * Generates an array of n users mixed with student and teacher roles
 */
export function generateCustomUsers(n: number, password = 'test') {
  // Ensure n is even by rounding up if necessary
  if (n % 2 !== 0) {
    n = Math.ceil(n);
    console.log(`Adjusted user count to ${n} to ensure even distribution`);
  }

  const halfCount = n / 2;
  const users = [];

  // Generate teacher_test_X users (first half)
  for (let i = 1; i <= halfCount; i++) {
    users.push({
      username: `teacher_test_${i}`,
      password: password,
      type: 'teacher',
    });
  }

  // Generate student_test_X users (second half)
  for (let i = 1; i <= halfCount; i++) {
    users.push({
      username: `student_test_${i}`,
      password: password,
      type: 'student',
    });
  }

  return shuffle(users);
}

/**
 * Generate a random UUID v4
 * @returns {string} A random UUID
 */
function generateUUID() {
  return crypto.randomUUID();
}

function getUserNameByNumber(n: number) {
  if (n % 2 === 0) {
    return `teacher_test_${n}`;
  }
  if (n % 2 !== 0) {
    return `student_test_${n}`;
  }
  throw Error('Math not mathing');
}

/**
 * Generate test users with random UUIDs
 */
export function generateUsers(count = 1000) {
  const userMapping: Record<string, Account> = {};
  const halfCount = Math.ceil(count / 2);

  for (let i = 1; i <= halfCount * 2; i++) {
    const username = getUserNameByNumber(i);
    userMapping[username] = {
      sub: generateUUID(),
      schulkennung: 'school1',
      rolle: i % 2 === 0 ? 'LEHR' : 'LERN', // Even -> Teacher, Odd -> Student
      bundesland: 'DE-BY',
    };
  }

  userMapping['teacher'] = {
    sub: 'f4830567-2ca9-4b9c-9c27-1900d443c07c',
    schulkennung: 'school1',
    rolle: 'LEHR',
    bundesland: 'DE-BY',
  };

  userMapping['student'] = {
    sub: '322594dc-548c-45be-b880-fda58fe863d3b',
    schulkennung: 'school1',
    rolle: 'LERN',
    bundesland: 'DE-BY',
  };

  return userMapping;
}

export function writeUserMappings(users: Record<string, Account>, filePath = 'user-mappings.json') {
  try {
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
    console.log(`User mappings successfully written to ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error writing user mappings to file: ${getErrorMessage(error)}`);
    return false;
  }
}

/**
 * Read user mappings from a file
 */
export function readUserMappings(filePath = 'user-mappings.json') {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const userMappings = JSON.parse(fileContent);
    console.log(`Successfully read user mappings from ${filePath}`);
    return userMappings as Record<string, Account>;
  } catch (error) {
    console.error(`Error reading user mappings from file: ${getErrorMessage(error)}`);
    throw Error('Could not read file');
  }
}
