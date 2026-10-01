/**
 * Makes <RuleSimulator> interactive: pick a rule and a resource, optionally
 * set a parameter, and see the evaluation result. Without this script the
 * component shows a complete results table instead.
 *
 * The evaluation itself is the pure evaluate() from lib/rule-simulator, so
 * the picker and the static table always agree.
 */
import { evaluate, resultLabel, resultReason, type EvaluationResult } from '../lib/rule-simulator';
import { resources, rules } from '../lib/rule-simulator-data';

/** Rules that take a parameter, and how to present it. */
const PARAMS: Record<string, { key: string; label: string; placeholder: string }> = {
  'encrypted-volumes': { key: 'kmsId', label: 'kmsId (optional KMS key)', placeholder: 'e.g. key-approved' },
  'required-tags': { key: 'tagKey', label: 'tagKey (required)', placeholder: 'e.g. team' },
};

function enhance(root: HTMLElement): void {
  const ui = root.querySelector<HTMLElement>('[data-rule-sim-ui]');
  const table = root.querySelector<HTMLElement>('[data-rule-sim-table]');
  const ruleSel = root.querySelector<HTMLSelectElement>('[data-sim-rule]');
  const resSel = root.querySelector<HTMLSelectElement>('[data-sim-resource]');
  const paramField = root.querySelector<HTMLElement>('[data-sim-param-field]');
  const paramLabel = root.querySelector<HTMLElement>('[data-sim-param-label]');
  const paramInput = root.querySelector<HTMLInputElement>('[data-sim-param]');
  const desc = root.querySelector<HTMLElement>('[data-sim-desc]');
  const pill = root.querySelector<HTMLElement>('[data-sim-pill]');
  const reason = root.querySelector<HTMLElement>('[data-sim-reason]');
  const live = root.querySelector<HTMLElement>('[data-sim-live]');
  if (!ui || !table || !ruleSel || !resSel || !paramField || !paramLabel || !paramInput || !desc || !pill || !reason || !live) {
    return;
  }

  const pillClass = (result: EvaluationResult) => `pill pill-${result.toLowerCase().replace(/_/g, '-')}`;
  const pillIcon = (result: EvaluationResult) =>
    ({ COMPLIANT: '✓', NON_COMPLIANT: '✕', ERROR: '!', NOT_APPLICABLE: '–' })[result];

  function render(announce: boolean): void {
    const rule = rules.find((r) => r.id === ruleSel!.value) ?? rules[0];
    const resource = resources.find((r) => r.id === resSel!.value) ?? resources[0];
    const param = PARAMS[rule.id];

    // Show the parameter input only for rules that take one.
    paramField!.hidden = !param;
    if (param) {
      paramLabel!.textContent = param.label;
      paramInput!.placeholder = param.placeholder;
    }

    const params = param ? { [param.key]: paramInput!.value } : {};
    const result = evaluate(rule, resource, params);

    desc!.textContent = rule.description;
    pill!.className = pillClass(result);
    pill!.innerHTML = `<span class="pill-icon" aria-hidden="true">${pillIcon(result)}</span>${result}`;
    reason!.textContent = resultReason(result, rule.name);
    if (announce) {
      live!.textContent = `${rule.name} on ${resource.label}: ${resultLabel(result)}. ${resultReason(result, rule.name)}`;
    }
  }

  ruleSel.addEventListener('change', () => render(true));
  resSel.addEventListener('change', () => render(true));
  paramInput.addEventListener('input', () => render(true));

  table.hidden = true;
  ui.hidden = false;
  render(false);
}

document.querySelectorAll<HTMLElement>('[data-rule-sim]').forEach(enhance);
