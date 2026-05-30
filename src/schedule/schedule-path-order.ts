export type SchedulePath = {
  id: string;
  subject_id: string;
  schedule_position: number;
};

/**
 * Reorders paths by schedule_position, interleaving subjects when possible.
 * Deterministic: same catalog always yields the same order. Best-effort when only one subject remains.
 */
export function interleavePathsBySubject(paths: SchedulePath[]): SchedulePath[] {
  const remaining = [...paths].sort((a, b) => a.schedule_position - b.schedule_position);
  const result: SchedulePath[] = [];

  while (remaining.length > 0) {
    const head = remaining[0];
    const lastSubject = result.length > 0 ? result[result.length - 1].subject_id : null;

    if (lastSubject === null || head.subject_id !== lastSubject) {
      result.push(remaining.shift()!);
      continue;
    }

    const candidates = remaining.filter((path) => path.subject_id !== lastSubject);
    if (candidates.length === 0) {
      result.push(remaining.shift()!);
      continue;
    }

    const pick = candidates.reduce((best, path) =>
      path.schedule_position < best.schedule_position ? path : best,
    );
    const index = remaining.findIndex((path) => path.id === pick.id);
    result.push(remaining.splice(index, 1)[0]);
  }

  return result;
}
