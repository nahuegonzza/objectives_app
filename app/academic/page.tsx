import Navigation from '@components/Navigation';
import AcademicOverview from '@modules/academic/AcademicOverview';

export default function AcademicPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-4 py-6 md:px-10">
      <div className="mx-auto max-w-6xl">
        <Navigation />
        <AcademicOverview />
      </div>
    </main>
  );
}
