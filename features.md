# 5 Features to Add to Doc Data Cleanup Agent

1.  **Interactive Data Visualization:** Allow users to generate interactive charts and graphs (like histograms, scatter plots, box plots) directly within the agent after cleaning the data to quickly identify patterns or remaining anomalies before exporting.
2.  **Export to Multiple Formats:** Expand the export options beyond just CSV. Support exporting to common formats like Microsoft Excel (.xlsx), SQLite databases (.sqlite), and JSON files, as well as analytical tool-specific formats (like deeper integration with SPSS and Orange).
3.  **Advanced PII Scrubbing:** Enhance the `maskSensitivePII` function to include more sophisticated recognition models using Gemini, capable of identifying and masking contextual PII (like addresses, medical information, or specific organizational terminology) beyond simple regex patterns.
4.  **Data Versioning and History:** Implement a robust versioning system that tracks the original data and every cleaning step applied. Users should be able to review the history, undo specific cleaning steps, and compare the current state with previous versions.
5.  **Scheduled/Batch Processing:** Allow users to schedule cleaning tasks for recurring data dumps or process multiple files simultaneously in a batch, saving time on repetitive data preparation workflows.
