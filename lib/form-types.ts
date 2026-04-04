import { z } from "zod";

export type FieldType =
  | "text"
  | "email"
  | "number"
  | "textarea"
  | "select"
  | "checkbox"
  | "radio"
  | "date"
  | "time"
  | "file"
  | "rating"
  | "phone";

export interface FieldOption {
  id: string;
  label: string;
  value: string;
}

export interface ConditionalRule {
  id: string;
  fieldId: string;
  operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than";
  value: string;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  description?: string;
  options?: FieldOption[];
  defaultValue?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
  conditionalRules?: ConditionalRule[];
  order: number;
}

export interface FormSchema {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  slug: string;
  isPublished: boolean;
  publishedUrl?: string;
  googleSheetId?: string;
  googleDriveFolderId?: string;
  domainWhitelist?: string[];
  embedCode?: string;
}

// Validation schemas
export const fieldOptionSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  value: z.string(),
});

export const formFieldSchema = z.object({
  id: z.string(),
  type: z.enum([
    "text",
    "email",
    "number",
    "textarea",
    "select",
    "checkbox",
    "radio",
    "date",
    "time",
    "file",
    "rating",
    "phone",
  ]),
  label: z.string().min(1),
  placeholder: z.string().optional(),
  required: z.boolean(),
  description: z.string().optional(),
  options: z.array(fieldOptionSchema).optional(),
  defaultValue: z.string().optional(),
  validation: z
    .object({
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
      pattern: z.string().optional(),
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
  conditionalRules: z.array(z.unknown()).optional(),
  order: z.number(),
});

export const formSchemaValidation = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  fields: z.array(formFieldSchema),
});
