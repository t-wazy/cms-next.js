'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Toast } from '@/components/ui/Toast';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [needs2FA, setNeeds2FA] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 2FAステップでない場合、まず事前チェック
      if (!needs2FA) {
        const checkResponse = await fetch('/api/auth/check-2fa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const checkResult = await checkResponse.json();

        if (!checkResult.valid) {
          setError('メールアドレスまたはパスワードが正しくありません');
          setIsLoading(false);
          return;
        }

        if (checkResult.needs2FA) {
          // 2FAが必要な場合、入力欄を表示
          setNeeds2FA(true);
          setIsLoading(false);
          return;
        }
      }

      // NextAuth.jsでログイン
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
        totpCode: needs2FA ? totpCode : undefined,
      });

      if (result?.error) {
        if (needs2FA) {
          setError('認証コードが正しくありません');
        } else {
          setError('ログインに失敗しました');
        }
      } else {
        router.push(callbackUrl);
      }
    } catch (err) {
      setError('ログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-2xl font-bold">ログイン</h1>

        <form onSubmit={handleSubmit}>
          <Input
            label="メールアドレス"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.jp"
            required
          />

          <Input
            label="パスワード"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            required
          />

          {needs2FA && (
            <Input
              label="認証コード"
              type="text"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              placeholder="000000"
              required
            />
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="mt-4 w-full"
          >
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </Button>
        </form>
      </div>

      {error && (
        <Toast
          message={error}
          type="error"
          onClose={() => setError('')}
        />
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
