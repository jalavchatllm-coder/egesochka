export interface CriterionScore {
  score: number;
  comment: string;
  errors?: { text: string }[];
}

export type CriteriaKeys = "K1" | "K2" | "K3" | "K4" | "K5" | "K6" | "K7" | "K8" | "K9" | "K10";

export interface EvaluationResult {
  scores: Record<CriteriaKeys, CriterionScore>;
  totalScore: number;
  overallFeedback: string;
}

export interface Criterion {
  id: CriteriaKeys;
  title: string;
  maxScore: number;
  color: string;
  recommendation: string;
}

export interface CriterionGroup {
  title: string;
  criteria: Criterion[];
  description: string;
  shortDescription: string;
}

export interface StoredEvaluation {
  id: number;
  created_at: string;
  essay_text: string;
  result_data: EvaluationResult;
}