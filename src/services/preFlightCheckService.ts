export interface PreFlightIssue {
  type: 'error' | 'warning';
  platform: 'SPSS' | 'Orange' | 'General';
  message: string;
}

export const runPreFlightChecks = (data: string[][]): PreFlightIssue[] => {
  const issues: PreFlightIssue[] = [];
  if (!data || data.length === 0) {
    return [{ type: 'error', platform: 'General', message: 'Dataset is empty.' }];
  }

  const headers = data[0];

  // Check for SPSS compatibility
  headers.forEach((header, index) => {
    // SPSS variables must start with a letter and contain only letters, numbers, and certain symbols
    if (!/^[a-zA-Z@#$][a-zA-Z0-9_.$@#]*$/.test(header)) {
      issues.push({
        type: 'warning',
        platform: 'SPSS',
        message: `Column ${index + 1} ('${header}') may be invalid for SPSS. Consider using only letters, numbers, and underscores, and start with a letter.`
      });
    }
    // Check for overly long headers (SPSS limit is typically 64 bytes)
    if (header.length > 64) {
      issues.push({
        type: 'warning',
        platform: 'SPSS',
        message: `Column ${index + 1} ('${header}') is too long for SPSS (max 64 characters).`
      });
    }
  });

  // Check for duplicate headers (breaks many platforms)
  const headerSet = new Set();
  headers.forEach(header => {
    if (headerSet.has(header)) {
      issues.push({
        type: 'error',
        platform: 'General',
        message: `Duplicate column name detected: '${header}'. This will cause issues in Orange and SPSS.`
      });
    }
    headerSet.add(header);
  });

  // Basic check for empty headers
  if (headers.some(h => !h.trim())) {
    issues.push({
      type: 'error',
      platform: 'General',
      message: 'One or more columns have empty header names.'
    });
  }

  return issues;
};
