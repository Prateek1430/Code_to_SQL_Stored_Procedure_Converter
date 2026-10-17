export const DETECT_DB_SCHEMA = {
  type: "object",
  properties: {
    detected_db: {
      type: "string",
      enum: ["MySQL", "PostgreSQL", "SQL Server", "Oracle"],
      description: "Best-guess target database dialect based on context clues in the code.",
    },
    confidence: {
      type: "string",
      enum: ["high", "medium", "low"],
    },
    reasoning: {
      type: "string",
      description: "One or two sentences explaining the signal used to guess (or why it's a low-confidence default).",
    },
  },
  required: ["detected_db", "confidence", "reasoning"],
  additionalProperties: false,
};

export const CONVERT_SCHEMA = {
  type: "object",
  properties: {
    source_language: {
      type: "string",
      description: "The detected source programming language, e.g. Python, Java, JavaScript, C#.",
    },
    database: {
      type: "string",
      enum: ["MySQL", "PostgreSQL", "SQL Server", "Oracle"],
    },
    stored_procedure_name: { type: "string" },
    sp_code: {
      type: "string",
      description: "The complete, runnable CREATE PROCEDURE statement, including DELIMITER changes if required by the dialect, transaction handling, and error handling.",
    },
    parameters: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          direction: { type: "string", enum: ["IN", "OUT", "INOUT"] },
          sql_type: { type: "string" },
          description: { type: "string" },
        },
        required: ["name", "direction", "sql_type", "description"],
        additionalProperties: false,
      },
    },
    usage_guide: {
      type: "object",
      properties: {
        call_syntax: {
          type: "string",
          description: "The exact CALL/EXEC statement template for this dialect.",
        },
        example_with_values: {
          type: "string",
          description: "The same statement filled in with concrete example values.",
        },
        steps: {
          type: "array",
          items: { type: "string" },
          description: "Ordered, step-by-step instructions for deploying and invoking the procedure.",
        },
      },
      required: ["call_syntax", "example_with_values", "steps"],
      additionalProperties: false,
    },
    dev_notes: {
      type: "array",
      items: { type: "string" },
      description: "Plain-language notes on what was changed from the source code and why (e.g. loops to cursors, exceptions to OUT params, OOP calls inlined).",
    },
    assumptions: {
      type: "array",
      items: { type: "string" },
      description: "Schema or environment assumptions made because they weren't given in the source code (table names, column names, etc.).",
    },
  },
  required: [
    "source_language",
    "database",
    "stored_procedure_name",
    "sp_code",
    "parameters",
    "usage_guide",
    "dev_notes",
    "assumptions",
  ],
  additionalProperties: false,
};
