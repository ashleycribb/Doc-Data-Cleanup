export const convertToJsonl = (data: string[][]): string => {
  if (!data || data.length < 2) return '';
  const headers = data[0];
  const rows = data.slice(1);

  let jsonl = '';

  rows.forEach(row => {
    const obj: any = {};
    // Simple key-value mapping for each row
    headers.forEach((header, index) => {
        obj[header] = row[index];
    });

    // For conversational fine-tuning, you often need prompt/completion pairs.
    // If there is a target variable, we could try to infer it.
    // Without knowing the target, we provide the whole object as a JSON record.
    // This is the simplest standard JSONL export of tabular data.
    jsonl += JSON.stringify(obj) + '\n';
  });

  return jsonl;
};

export const convertToInstructionJsonl = (data: string[][]): string => {
    if (!data || data.length < 2) return '';
    const headers = data[0];
    const rows = data.slice(1);
    let jsonl = '';

    rows.forEach(row => {
        // Construct a generic prompt/completion pair
        // Prompt: the context (first N-1 columns)
        // Completion: the final column (often the target)

        if (headers.length < 2) return;

        let promptText = "Given the following details:\n";
        for (let i = 0; i < headers.length - 1; i++) {
            promptText += `- ${headers[i]}: ${row[i]}\n`;
        }
        promptText += `What is the expected ${headers[headers.length-1]}?`;

        const completionText = row[headers.length - 1];

        const pair = {
            prompt: promptText,
            completion: completionText
        };
        jsonl += JSON.stringify(pair) + '\n';
    });
    return jsonl;
}
