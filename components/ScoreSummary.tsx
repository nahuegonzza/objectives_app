import type { DailyScore } from '@types';

interface ScoreSummaryProps {
  score: DailyScore;
}

export default function ScoreSummary({ score }: ScoreSummaryProps) {
  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-slate-900">{score.points.toFixed(1)}</p>
          <p className="text-sm text-slate-500">Puntos calculados para {new Date(score.date).toLocaleDateString('es-ES')}</p>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
          {score.points >= 0 ? 'Positivo' : 'Ajuste'}
        </span>
      </div>
      <p className="text-sm text-slate-600">{score.note}</p>
    </div>
  );
}
