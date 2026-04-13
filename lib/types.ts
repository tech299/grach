export type CriterionStatus = 'met' | 'partial' | 'missing';
export type ChangeType = 'addition' | 'deletion' | 'modification';

export interface CriterionEvaluation {
  name: string;
  status_before: CriterionStatus;
  status_after: CriterionStatus;
  reason: string;
  changes_made: string;
}

export interface DraftChange {
  id: string;
  type: ChangeType;
  original_text: string;
  new_text: string;
  reason: string;
  criterion: string;
  impact: 'high' | 'medium' | 'minor';
}

export interface FullMarksResult {
  original_score: number;
  improved_score: number;
  criteria: CriterionEvaluation[];
  missing_information: string[];
  improved_draft: string;
  changes: DraftChange[];
  prompt: string;
  rubric: string;
  original_draft: string;
  insight: string;
}
