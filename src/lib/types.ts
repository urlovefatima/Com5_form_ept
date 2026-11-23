export type Category = { id: string; label: string };
export type ExtraField = { key: string; label: string; placeholder?: string; type: "text" | "textarea" };

export type Commission = {
  slug: string;
  sortOrder: number;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  image: string;
  imageAlt: string;
  categories: Category[];
  extraFields: ExtraField[];
};

export type BudgetType = "unspecified" | "none" | "unknown" | "amount";

export type ProposalRow = {
  id: string;
  submissionId: string;
  commissionSlug: string;
  position: number;
  categoryId: string;
  categoryLabel: string;
  title: string;
  description: string;
  objective: string | null;
  organization: string | null;
  budgetType: BudgetType;
  budgetAmount: string | null;
  period: string | null;
  inclusion: string | null;
  specialNote: string | null;
  extra: Record<string, string>;
  createdAt: string;
  fullName: string | null;
  department: string | null;
  isAnonymous: boolean;
};
