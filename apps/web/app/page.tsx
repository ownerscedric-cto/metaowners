'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // 클라이언트 사이드에서 리다이렉트
    router.push('/dashboard');
  }, [router]);

  // 로딩 중 표시할 간단한 UI
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Meta Ads Platform 로딩 중...</p>
      </div>
    </div>
  );
}