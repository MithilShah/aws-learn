/**
 * Makes <StorageClassMatrix> interactive: three inputs (how often the data is
 * read, how fast a read must return, whether one AZ is acceptable) drive a
 * recommended Amazon S3 storage class. Without this script the component shows
 * a table of worked scenarios instead.
 *
 * The recommendation is the pure recommend() from lib/storage-class, so the
 * picker and the static table always agree.
 */
import { CLASSES, recommend, type AccessPattern, type Choice, type Retrieval } from '../lib/storage-class';

function enhance(root: HTMLElement): void {
  const ui = root.querySelector<HTMLElement>('[data-scm-ui]');
  const table = root.querySelector<HTMLElement>('[data-scm-table]');
  const access = root.querySelector<HTMLSelectElement>('[data-scm-access]');
  const retrieval = root.querySelector<HTMLSelectElement>('[data-scm-retrieval]');
  const oneZone = root.querySelector<HTMLInputElement>('[data-scm-onezone]');
  const classEl = root.querySelector<HTMLElement>('[data-scm-class]');
  const reasonEl = root.querySelector<HTMLElement>('[data-scm-reason]');
  const live = root.querySelector<HTMLElement>('[data-scm-live]');
  if (!ui || !table || !access || !retrieval || !oneZone || !classEl || !reasonEl || !live) return;

  const update = (announce: boolean) => {
    const choice: Choice = {
      access: access.value as AccessPattern,
      retrieval: retrieval.value as Retrieval,
      oneZoneOk: oneZone.checked,
    };
    const { classId, reason } = recommend(choice);
    const name = CLASSES[classId].name;
    classEl.textContent = name;
    reasonEl.textContent = reason;
    if (announce) live.textContent = `Recommended: ${name}. ${reason}`;
  };

  for (const el of [access, retrieval, oneZone]) el.addEventListener('change', () => update(true));

  table.hidden = true;
  ui.hidden = false;
  root.classList.add('is-enhanced');
  update(false);
}

document.querySelectorAll<HTMLElement>('[data-scm]:not(.is-enhanced)').forEach(enhance);
