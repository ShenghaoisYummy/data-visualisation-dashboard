import { cn, formatDate, formatRelativeTime, generateInvitationCodePrefix } from '@/lib/utils';

describe('Utility Functions', () => {
  describe('cn (className utility)', () => {
    test('should combine simple class names', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    test('should handle undefined and null values', () => {
      expect(cn('class1', null, undefined, 'class2')).toBe('class1 class2');
    });

    test('should handle conditional classes', () => {
      const isActive = true;
      const isDisabled = false;
      
      expect(cn('base', isActive && 'active', isDisabled && 'disabled'))
        .toBe('base active');
    });

    test('should handle empty input', () => {
      expect(cn()).toBe('');
    });

    test('should handle array of classes', () => {
      expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3');
    });

    test('should handle object with boolean values', () => {
      expect(cn({
        'class1': true,
        'class2': false,
        'class3': true
      })).toBe('class1 class3');
    });

    test('should combine multiple class strings', () => {
      expect(cn('class1 class2', 'class1 class3')).toBe('class1 class2 class1 class3');
    });
  });

  describe('formatDate', () => {
    // Using a fixed date to ensure consistent testing
    const testDate = new Date('2024-03-15T14:30:00.000Z');
    
    test('should format Date object correctly', () => {
      const result = formatDate(testDate);
      expect(result).toContain('2024');
      expect(result).toContain('Mar');
      expect(result).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/); // Time format
    });

    test('should format date string correctly', () => {
      const result = formatDate('2024-03-15T14:30:00.000Z');
      expect(result).toContain('2024');
      expect(result).toContain('Mar');
    });

    test('should handle different date formats', () => {
      const result1 = formatDate('2024-12-25');
      const result2 = formatDate('2024-01-01T00:00:00Z');
      
      expect(result1).toContain('Dec 25, 2024');
      expect(result2).toContain('Jan 1, 2024');
    });

    test('should handle leap year dates', () => {
      const result = formatDate('2024-02-29T12:00:00Z');
      expect(result).toContain('Feb 29, 2024');
    });

    test('should handle invalid date strings gracefully', () => {
      const result = formatDate('invalid-date');
      expect(result).toMatch(/Invalid Date|NaN/);
    });
  });

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      // Use fake timers and set to a fixed time
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-03-15T14:30:00.000Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should return "Just now" for very recent dates', () => {
      const recentDate = new Date('2024-03-15T14:29:45.000Z'); // 15 seconds ago
      expect(formatRelativeTime(recentDate)).toBe('Just now');
    });

    test('should return minutes for dates within an hour', () => {
      const fiveMinutesAgo = new Date('2024-03-15T14:25:00.000Z');
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5m ago');
      
      const thirtyMinutesAgo = new Date('2024-03-15T14:00:00.000Z');
      expect(formatRelativeTime(thirtyMinutesAgo)).toBe('30m ago');
    });

    test('should return hours for dates within a day', () => {
      const twoHoursAgo = new Date('2024-03-15T12:30:00.000Z');
      expect(formatRelativeTime(twoHoursAgo)).toBe('2h ago');
      
      const twelveHoursAgo = new Date('2024-03-15T02:30:00.000Z');
      expect(formatRelativeTime(twelveHoursAgo)).toBe('12h ago');
    });

    test('should return days for dates older than 24 hours', () => {
      const oneDayAgo = new Date('2024-03-14T14:30:00.000Z');
      expect(formatRelativeTime(oneDayAgo)).toBe('1d ago');
      
      const threeDaysAgo = new Date('2024-03-12T14:30:00.000Z');
      expect(formatRelativeTime(threeDaysAgo)).toBe('3d ago');
      
      const tenDaysAgo = new Date('2024-03-05T14:30:00.000Z');
      expect(formatRelativeTime(tenDaysAgo)).toBe('10d ago');
    });

    test('should handle date strings', () => {
      const dateString = '2024-03-15T14:25:00.000Z';
      expect(formatRelativeTime(dateString)).toBe('5m ago');
    });

    test('should handle future dates (should show as "Just now")', () => {
      const futureDate = new Date('2024-03-15T15:00:00.000Z');
      expect(formatRelativeTime(futureDate)).toBe('Just now');
    });

    test('should handle edge cases around boundaries', () => {
      // Exactly 1 minute ago
      const oneMinuteAgo = new Date('2024-03-15T14:29:00.000Z');
      expect(formatRelativeTime(oneMinuteAgo)).toBe('1m ago');
      
      // Exactly 1 hour ago
      const oneHourAgo = new Date('2024-03-15T13:30:00.000Z');
      expect(formatRelativeTime(oneHourAgo)).toBe('1h ago');
      
      // Exactly 24 hours ago
      const twentyFourHoursAgo = new Date('2024-03-14T14:30:00.000Z');
      expect(formatRelativeTime(twentyFourHoursAgo)).toBe('1d ago');
    });

    test('should handle very old dates', () => {
      const veryOldDate = new Date('2023-01-01T00:00:00.000Z');
      const result = formatRelativeTime(veryOldDate);
      expect(result).toMatch(/\d+d ago/);
      expect(parseInt(result)).toBeGreaterThan(400); // More than a year
    });
  });

  describe('generateInvitationCodePrefix', () => {
    test('should return default "STAFF" when no department provided', () => {
      expect(generateInvitationCodePrefix()).toBe('STAFF');
      expect(generateInvitationCodePrefix('')).toBe('STAFF');
      expect(generateInvitationCodePrefix(undefined)).toBe('STAFF');
    });

    test('should convert department to uppercase', () => {
      expect(generateInvitationCodePrefix('sales')).toBe('SALES');
      expect(generateInvitationCodePrefix('Marketing')).toBe('MARKETING');
      expect(generateInvitationCodePrefix('ACCOUNTING')).toBe('ACCOUNTING');
    });

    test('should remove non-alphanumeric characters', () => {
      expect(generateInvitationCodePrefix('IT & Support')).toBe('ITSUPPORT');
      expect(generateInvitationCodePrefix('Human-Resources')).toBe('HUMANRESOU'); // Truncated at 10 chars
      expect(generateInvitationCodePrefix('R&D Department!')).toBe('RDDEPARTME'); // Truncated at 10 chars
      expect(generateInvitationCodePrefix('Sales/Marketing')).toBe('SALESMARKE'); // Truncated at 10 chars
    });

    test('should handle special characters and spaces', () => {
      expect(generateInvitationCodePrefix('Customer Service')).toBe('CUSTOMERSE'); // Truncated at 10 chars
      expect(generateInvitationCodePrefix('Quality@Assurance#')).toBe('QUALITYASS'); // Truncated at 10 chars
      expect(generateInvitationCodePrefix('Dept. 123')).toBe('DEPT123');
    });

    test('should truncate to maximum 10 characters', () => {
      expect(generateInvitationCodePrefix('VeryLongDepartmentName')).toBe('VERYLONGDE');
      expect(generateInvitationCodePrefix('CustomerServiceAndSupport')).toBe('CUSTOMERSE'); // Truncated at 10 chars
    });

    test('should handle departments with only numbers', () => {
      expect(generateInvitationCodePrefix('123')).toBe('123');
      expect(generateInvitationCodePrefix('Department 456')).toBe('DEPARTMENT');
    });

    test('should handle edge cases', () => {
      // Only special characters should return empty string after filtering
      expect(generateInvitationCodePrefix('!@#$%^&*()')).toBe('');
      
      // Mixed alphanumeric with special chars
      expect(generateInvitationCodePrefix('ABC-123-XYZ')).toBe('ABC123XYZ');
      
      // Single character
      expect(generateInvitationCodePrefix('A')).toBe('A');
      
      // Exactly 10 characters
      expect(generateInvitationCodePrefix('MARKETING1')).toBe('MARKETING1');
    });

    test('should handle lowercase mixed with numbers', () => {
      expect(generateInvitationCodePrefix('dept123')).toBe('DEPT123');
      expect(generateInvitationCodePrefix('team4you')).toBe('TEAM4YOU');
    });

    test('should handle unicode characters', () => {
      expect(generateInvitationCodePrefix('Café Management')).toBe('CAFMANAGEM');
      expect(generateInvitationCodePrefix('São Paulo Office')).toBe('SOPAULOOFF');
    });

    test('should be consistent for same input', () => {
      const department = 'Human Resources';
      const result1 = generateInvitationCodePrefix(department);
      const result2 = generateInvitationCodePrefix(department);
      expect(result1).toBe(result2);
      expect(result1).toBe('HUMANRESOU');
    });
  });

  describe('Integration Tests', () => {
    test('should work together in typical use cases', () => {
      // Test combining className utility with formatted dates
      const isRecent = true;
      const date = new Date('2024-03-15T14:25:00.000Z');
      
      const className = cn('date-display', isRecent && 'recent');
      const formattedDate = formatDate(date);
      
      expect(className).toContain('date-display recent');
      expect(formattedDate).toContain('2024');
    });

    test('should handle null and undefined gracefully across all functions', () => {
      expect(() => cn(null, undefined)).not.toThrow();
      expect(() => formatDate('invalid')).not.toThrow();
      expect(() => formatRelativeTime('invalid')).not.toThrow();
      expect(() => generateInvitationCodePrefix(undefined)).not.toThrow();
    });

    test('should maintain consistent behavior with edge inputs', () => {
      // Empty strings
      expect(cn('')).toBe('');
      expect(generateInvitationCodePrefix('')).toBe('STAFF');
      
      // Very long inputs
      const longClassName = 'a'.repeat(100);
      expect(cn(longClassName)).toBe(longClassName);
      
      const longDepartment = 'Department'.repeat(10);
      expect(generateInvitationCodePrefix(longDepartment).length).toBeLessThanOrEqual(10);
    });
  });
});