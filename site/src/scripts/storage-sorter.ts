/**
 * Makes <StorageSorter> interactive: each workload gets three buttons (Amazon
 * S3, Amazon EBS, Amazon EFS). Choosing one marks the workload right or wrong,
 * reveals the explanation, and updates the running score. Without this script
 * the component shows a full answer key instead.
 *
 * Scoring is the pure score() from lib/storage-sorter, so the buttons and the
 * tally always agree.
 */
import { score, scoreText, type Assignments, type StorageId } from '../lib/storage-sorter';
import { questions } from '../lib/storage-sorter-data';

function enhance(root: HTMLElement): void {
  const scoreEl = root.querySelector<HTMLElement>('[data-sorter-score]');
  if (!scoreEl) return;
  const assignments: Assignments = {};

  const qEls = Array.from(root.querySelectorAll<HTMLElement>('[data-sorter-q]'));
  // Match each question element to its data entry by order.
  qEls.forEach((qEl, index) => {
    const question = questions[index];
    if (!question) return;
    const choices = qEl.querySelector<HTMLElement>('[data-sorter-choices]');
    const buttons = Array.from(qEl.querySelectorAll<HTMLButtonElement>('[data-sorter-choice]'));
    if (!choices) return;
    choices.hidden = false;

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const choice = btn.dataset.sorterChoice as StorageId;
        assignments[question.id] = choice;
        buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));

        const correct = choice === question.answer;
        qEl.classList.add('is-answered');
        qEl.classList.toggle('is-correct', correct);
        qEl.classList.toggle('is-wrong', !correct);
        update();
      });
    });
  });

  function update(): void {
    const s = score(questions, assignments);
    scoreEl!.hidden = false;
    scoreEl!.textContent = s.allCorrect
      ? `${scoreText(s)} — every workload placed correctly.`
      : scoreText(s);
  }

  root.classList.add('is-enhanced');
}

document.querySelectorAll<HTMLElement>('[data-storage-sorter]').forEach(enhance);
