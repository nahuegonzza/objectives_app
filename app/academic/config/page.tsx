'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseSession } from '@hooks/useSupabaseSession';

export default function AcademicConfigPage() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSupabaseSession();

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) {
      router.push('/login');
      return;
    }
    router.push('/settings/modules');
  }, [session, sessionLoading, router]);

  return null;
}
