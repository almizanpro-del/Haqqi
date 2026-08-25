// PII redaction before LLM calls (gap C5)
// Minimizes what's sent to third-party AI providers for PDPL compliance.
//
// Strategy: detect and redact common PII patterns BEFORE the message goes to the LLM.
// The LLM sees redacted text; the original is stored locally only.
//
// In production with a real DPA (data processing agreement) with the provider,
// you may choose to send some PII — but redaction should be the default.

export interface PiiRedactionResult {
  redacted: string;
  found: Array<{ type: string; count: number; sample: string }>;
  redactionLevel: "minimal" | "aggressive";
}

const PATTERNS: Array<{ type: string; regex: RegExp; placeholder: string; sample: string }> = [
  // Jordanian National ID (10 digits)
  { type: "national_id", regex: /\b\d{10}\b/g, placeholder: "[NATIONAL_ID]", sample: "**********" },
  // Phone numbers (Jordanian +962 or local 07)
  { type: "phone", regex: /(\+962[-\s]?\d{8,9}|\b07\d{8}\b)/g, placeholder: "[PHONE]", sample: "*********" },
  // Email addresses
  { type: "email", regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, placeholder: "[EMAIL]", sample: "***@***.***" },
  // Credit card numbers (basic pattern)
  { type: "credit_card", regex: /\b(?:\d[ -]*?){13,19}\b/g, placeholder: "[CARD]", sample: "****" },
  // IBAN (JO + 30 chars)
  { type: "iban", regex: /\bJO\d{2}[A-Z0-9]{28}\b/g, placeholder: "[IBAN]", sample: "JO**********************" },
  // License plate (Jordanian: N-NNNNN or similar)
  { type: "license_plate", regex: /\b\d{1,2}-\d{4,6}\b/g, placeholder: "[PLATE]", sample: "**-****" },
  // Passport numbers
  { type: "passport", regex: /\b[A-Z]{1,2}\d{6,9}\b/g, placeholder: "[PASSPORT]", sample: "** *******" },
  // Dates of birth (YYYY-MM-DD or DD/MM/YYYY)
  { type: "dob", regex: /\b(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})\b/g, placeholder: "[DATE]", sample: "****-**-**" },
];

// Medical terms that may be sensitive — only redact in "aggressive" mode
const MEDICAL_TERMS = [
  "إيدز", "HIV", "AIDS",
  "السكر", "diabetes",
  "إعاقة", "disabled", "disability",
  "صعوبة", "mental",
  "نفسي", "psychiatric",
];

export function redactPii(text: string, level: "minimal" | "aggressive" = "minimal"): PiiRedactionResult {
  if (!text || typeof text !== "string") {
    return { redacted: "", found: [], redactionLevel: level };
  }

  let redacted = text;
  const found: Array<{ type: string; count: number; sample: string }> = [];

  for (const pattern of PATTERNS) {
    const matches = redacted.match(pattern.regex);
    if (matches && matches.length > 0) {
      found.push({
        type: pattern.type,
        count: matches.length,
        sample: pattern.sample,
      });
      redacted = redacted.replace(pattern.regex, pattern.placeholder);
    }
  }

  // Aggressive mode: also redact specific medical terms (rarely needed for legal intake)
  if (level === "aggressive") {
    for (const term of MEDICAL_TERMS) {
      const regex = new RegExp(term, "gi");
      const matches = redacted.match(regex);
      if (matches) {
        found.push({ type: "medical_term", count: matches.length, sample: "[REDACTED]" });
        redacted = redacted.replace(regex, "[MEDICAL]");
      }
    }
  }

  return {
    redacted,
    found,
    redactionLevel: level,
  };
}

// What we tell the LLM about the redaction
export const REDACTION_NOTICE = `[Note: PII has been redacted from this message for privacy compliance. Placeholders like [PHONE], [EMAIL], [NATIONAL_ID] represent data the user provided but should not be stored externally.]`;
