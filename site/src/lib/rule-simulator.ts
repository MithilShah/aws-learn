/**
 * Logic behind <RuleSimulator>: given a rule and a resource, work out which
 * of AWS Config's four evaluation results applies. Pure functions, so the
 * browser script stays thin and the behaviour is unit-tested.
 *
 * The four results come straight from the AWS documentation (Components of
 * an AWS Config Rule):
 *   COMPLIANT       the rule passes the conditions of the compliance check
 *   NON_COMPLIANT   the rule fails the conditions of the compliance check
 *   ERROR           a required parameter is missing or the wrong type
 *   NOT_APPLICABLE  the rule's logic doesn't apply to this resource
 *
 * Each rule models one AWS Config managed rule closely enough to teach how
 * evaluation works, not to reproduce AWS's implementation.
 */

export type EvaluationResult = 'COMPLIANT' | 'NON_COMPLIANT' | 'ERROR' | 'NOT_APPLICABLE';

/** A resource the reader can point a rule at. */
export interface SimResource {
  id: string;
  /** Label shown in the UI, e.g. "Encrypted EBS volume". */
  label: string;
  /** AWS resource type, e.g. "AWS::EC2::Volume". */
  type: string;
  /** Attributes a rule reads. Kept loose on purpose. */
  attributes: Record<string, unknown>;
}

/** A rule the reader can run against a resource. */
export interface SimRule {
  id: string;
  /** Managed-rule name, e.g. "encrypted-volumes". */
  name: string;
  /** One-line "Checks if…" description, mirroring the docs' style. */
  description: string;
  /** Resource types this rule's logic applies to. Others are NOT_APPLICABLE. */
  appliesTo: readonly string[];
  /** The compliance check. Returns COMPLIANT / NON_COMPLIANT / ERROR only. */
  check: (resource: SimResource, params: Record<string, string>) => EvaluationResult;
}

/**
 * Evaluate a resource against a rule, applying scope first: a rule whose
 * logic cannot apply to the resource type is NOT_APPLICABLE, exactly as the
 * docs describe (e.g. alb-desync-mode-check ignores non-ALB load balancers).
 */
export function evaluate(
  rule: SimRule,
  resource: SimResource,
  params: Record<string, string> = {},
): EvaluationResult {
  if (!rule.appliesTo.includes(resource.type)) return 'NOT_APPLICABLE';
  return rule.check(resource, params);
}

/** Human-readable label for a result, for the UI and the live region. */
export function resultLabel(result: EvaluationResult): string {
  switch (result) {
    case 'COMPLIANT':
      return 'Compliant';
    case 'NON_COMPLIANT':
      return 'Noncompliant';
    case 'ERROR':
      return 'Error';
    case 'NOT_APPLICABLE':
      return 'Not applicable';
  }
}

/** One-line explanation of why a result came out the way it did. */
export function resultReason(result: EvaluationResult, ruleName: string): string {
  switch (result) {
    case 'COMPLIANT':
      return `The resource passes the conditions of ${ruleName}.`;
    case 'NON_COMPLIANT':
      return `The resource fails the conditions of ${ruleName}.`;
    case 'ERROR':
      return `${ruleName} could not run: a required parameter is missing or the wrong type.`;
    case 'NOT_APPLICABLE':
      return `${ruleName} does not apply to this resource type, so it is filtered out.`;
  }
}
