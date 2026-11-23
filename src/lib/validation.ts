import { z } from "zod";

const clean = (max: number) =>
  z.string().max(max, `Maximum ${max} caractères`).transform((s) => s.replace(/\u0000/g, "").trim());
const optional = (max: number) => clean(max).optional().default("");

export const proposalSchema = z.object({
  categoryId: z.string().min(1, "Choisissez une catégorie").max(60),
  title: clean(160).pipe(z.string().min(3, "Le titre doit contenir au moins 3 caractères")),
  description: clean(5000).pipe(z.string().min(10, "Décrivez votre idée en quelques phrases (10 caractères min.)")),
  objective: optional(2000),
  organization: optional(3000),
  budgetType: z.enum(["unspecified", "none", "unknown", "amount"]).default("unspecified"),
  budgetAmount: optional(120),
  period: optional(160),
  inclusion: optional(2000),
  specialNote: optional(3000),
  extra: z.record(z.string().max(40), clean(2000)).default({}),
});

export const submissionSchema = z.object({
  commissionSlug: z.string().min(1).max(60),
  anonymous: z.boolean(),
  fullName: optional(120),
  department: optional(120),
  proposals: z.array(proposalSchema).min(1, "Ajoutez au moins une proposition").max(10, "10 propositions maximum par envoi"),
  // Anti-robot
  website: z.string().max(0).optional().default(""), // honeypot : doit rester vide
  startedAt: z.number().int().positive(),
});

export type SubmissionInput = z.input<typeof submissionSchema>;
export type ProposalInput = z.input<typeof proposalSchema>;
