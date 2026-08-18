export const generateDataDictionary = (data: string[][]): string => {
  if (!data || data.length === 0) return '';
  const headers = data[0];
  const rows = data.slice(1);

  let dictionary = "# Data Dictionary\n\n";
  dictionary += "| Column Name | Inferred Type | Sample Values | Null Count |\n";
  dictionary += "|---|---|---|---|\n";

  headers.forEach((header, colIndex) => {
    let isNumeric = true;
    let nullCount = 0;
    const sampleValues = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const val = rows[i][colIndex]?.trim();
      if (!val || val === 'N/A' || val === 'Unknown') {
        nullCount++;
      } else {
        if (sampleValues.size < 3) sampleValues.add(val);
        if (isNaN(Number(val))) {
          isNumeric = false;
        }
      }
    }

    const type = isNumeric ? 'Numeric' : 'Categorical/Text';
    const samplesStr = Array.from(sampleValues).join(', ');

    dictionary += `| **${header}** | ${type} | ${samplesStr} | ${nullCount} |\n`;
  });

  return dictionary;
};
