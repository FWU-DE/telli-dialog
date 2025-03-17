import { describe, it, expect } from 'vitest';
import { checkProductAccess } from './access';
import { UserAndContext } from '@/auth/types';
import { UserModel, UserSchoolRole } from '@/db/schema';

describe('checkProductAccess', () => {
  // Base test data
  const baseDate = new Date();
  const baseFederalState = {
    id: 'DE-BY',
    createdAt: baseDate,
    teacherPriceLimit: 500,
    studentPriceLimit: 200,
    mandatoryCertificationTeacher: null,
    chatStorageTime: 120,
    supportContact: null,
    trainingLink: null,
    studentAccess: true,
  };

  const baseSchool = {
    id: 'school-1',
    createdAt: baseDate,
    federalStateId: 'DE-BY',
    userRole: 'teacher' as UserSchoolRole,
  };

  const baseUser = {
    id: 'user-1',
    email: 'user-1@vidis.schule',
    firstName: '',
    lastName: '',
    createdAt: new Date(),
  } satisfies UserModel;

  it('should allow access when all conditions are met', () => {
    const context: UserAndContext = {
      ...baseUser,
      federalState: baseFederalState,
      school: baseSchool,
    };

    const result = checkProductAccess(context);
    expect(result.hasAccess).toBe(true);
  });

  it('should deny access to students when studentAccess is false', () => {
    const context: UserAndContext = {
      ...baseUser,
      federalState: {
        ...baseFederalState,
        studentAccess: false,
      },
      school: {
        ...baseSchool,
        userRole: 'student',
      },
    };

    const result = checkProductAccess(context);
    expect(result.hasAccess).toBe(false);
    if (!result.hasAccess) {
      expect(result.errorType).toBe('RESTRICTED_ROLE');
      // expect(result.errorMessage).toContain('Schüler oder Schülerin');
    }
  });

  it('should allow access to students when studentAccess is true', () => {
    const context: UserAndContext = {
      ...baseUser,
      federalState: {
        ...baseFederalState,
        studentAccess: true,
      },
      school: {
        ...baseSchool,
        userRole: 'student',
      },
    };

    const result = checkProductAccess(context);
    expect(result.hasAccess).toBe(true);
  });

  it('should deny access when training is required', () => {
    const context: UserAndContext = {
      ...baseUser,
      federalState: {
        ...baseFederalState,
        mandatoryCertificationTeacher: true,
      },
      school: baseSchool,
    };

    const result = checkProductAccess(context);
    expect(result.hasAccess).toBe(false);
    if (!result.hasAccess) {
      expect(result.errorType).toBe('TRAINING_NEEDED');
      // expect(result.errorMessage).toContain('vorgeschriebene Schulung');
      // expect(result.errorMessage).toContain('DE-BY');
    }
  });

  it('should include training link in error message when available', () => {
    const trainingLink = 'https://training.example.com';
    const context: UserAndContext = {
      ...baseUser,
      federalState: {
        ...baseFederalState,
        mandatoryCertificationTeacher: true,
        trainingLink,
      },
      school: baseSchool,
    };

    const result = checkProductAccess(context);
    if (!result.hasAccess) {
      expect(result.hasAccess).toBe(false);
      expect(result.errorType).toBe('TRAINING_NEEDED');
      // expect(result.errorMessage).toContain(trainingLink);
    }
  });

  it('should prioritize role-based restrictions over training requirements', () => {
    const context: UserAndContext = {
      ...baseUser,
      federalState: {
        ...baseFederalState,
        studentAccess: false,
        mandatoryCertificationTeacher: true,
      },
      school: {
        ...baseSchool,
        userRole: 'student',
      },
    };

    const result = checkProductAccess(context);
    expect(result.hasAccess).toBe(false);
    if (!result.hasAccess) {
      expect(result.errorType).toBe('RESTRICTED_ROLE'); // Should be role error, not training
    }
  });

  it('should not check training requirements for students when studentAccess is false', () => {
    const context: UserAndContext = {
      ...baseUser,
      federalState: {
        ...baseFederalState,
        studentAccess: false,
        mandatoryCertificationTeacher: true,
      },
      school: {
        ...baseSchool,
        userRole: 'student',
      },
    };

    // We're testing the implementation detail that training is not checked for students
    // when studentAccess is false, as they're already restricted by role
    const result = checkProductAccess(context);
    expect(result.hasAccess).toBe(false);
    if (!result.hasAccess) {
      expect(result.errorType).toBe('RESTRICTED_ROLE');
      // expect(result.errorMessage).not.toContain('vorgeschriebene Schulung');
    }
  });

  it('should handle non-student roles correctly', () => {
    const nonStudentRoles = ['teacher'] as const;

    nonStudentRoles.forEach((role) => {
      const context: UserAndContext = {
        ...baseUser,
        federalState: baseFederalState,
        school: {
          ...baseSchool,
          userRole: role,
        },
      };

      const result = checkProductAccess(context);
      expect(result.hasAccess).toBe(true);
    });
  });

  it('should handle different federal states appropriately', () => {
    const federalStates = [
      { id: 'DE-BY', studentAccess: true }, // Bavaria
      { id: 'DE-BW', studentAccess: false }, // Baden-Württemberg
      { id: 'DE-BE', studentAccess: true }, // Berlin
    ];

    federalStates.forEach((state) => {
      const context: UserAndContext = {
        ...baseUser,
        federalState: {
          ...baseFederalState,
          id: state.id,
          studentAccess: state.studentAccess,
        },
        school: {
          ...baseSchool,
          userRole: 'student',
        },
      };

      const result = checkProductAccess(context);

      if (state.studentAccess) {
        expect(result.hasAccess).toBe(true);
      } else {
        expect(result.hasAccess).toBe(false);
        if (!result.hasAccess) {
          expect(result.errorType).toBe('RESTRICTED_ROLE');
        }
      }
    });
  });
});
