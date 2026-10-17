import './index.css';

// Sample rows for the hero's product preview (1 = done, 0 = missed, null = upcoming)
const PREVIEW_HABITS = [
  { name: 'Morning run', dot: 'bg-emerald-400', done: 'bg-emerald-500 border-emerald-400', days: [1, 1, 0, 1, 1, null, null] },
  { name: 'Deep work · 90 min', dot: 'bg-violet-400', done: 'bg-violet-500 border-violet-400', days: [1, 1, 1, 1, 1, null, null] },
  { name: 'Meditate', dot: 'bg-amber-400', done: 'bg-amber-500 border-amber-400', days: [1, 0, 1, 1, 1, null, null] },
  { name: 'Read 20 pages', dot: 'bg-sky-400', done: 'bg-sky-500 border-sky-400', days: [0, 1, 1, 0, 1, null, null] },
];

const CHECK_ICON =
  '<svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

const renderCell = (state, doneClasses) => {
  if (state === 1) {
    return `<span class="mx-auto w-7 h-7 rounded-lg border flex items-center justify-center ${doneClasses}">${CHECK_ICON}</span>`;
  }
  if (state === 0) {
    return '<span class="mx-auto block w-7 h-7 rounded-lg border border-slate-700 bg-slate-800/60"></span>';
  }
  return '<span class="mx-auto block w-7 h-7 rounded-lg border border-dashed border-slate-800"></span>';
};

const grid = document.getElementById('preview-grid');
if (grid) {
  grid.innerHTML = PREVIEW_HABITS.map(
    (habit) => `
      <tr>
        <td class="py-3 pr-4">
          <span class="flex items-center gap-2.5 font-medium text-slate-200 whitespace-nowrap">
            <span class="w-2 h-2 rounded-full ${habit.dot}"></span>${habit.name}
          </span>
        </td>
        ${habit.days.map((d) => `<td class="py-3 text-center">${renderCell(d, habit.done)}</td>`).join('')}
      </tr>`
  ).join('');
}

document.getElementById('year').textContent = new Date().getFullYear();
