'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Toast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { Loading } from '@/components/ui/Loading';
import Image from 'next/image';

export default function Setup2FAPage() {
  const [is2FAEnabled, setIs2FAEnabled] = useState<boolean | null>(null);
  const [step, setStep] = useState<'generate' | 'verify'>('generate');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    check2FAStatus();
  }, []);

  const check2FAStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const res = await fetch('/api/auth/setup-2fa');
      if (res.ok) {
        const data = await res.json();
        setIs2FAEnabled(data.is2FAEnabled);
      }
    } catch (error) {
      console.error('Failed to check 2FA status:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/setup-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate' }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate QR code');
      }

      const data = await response.json();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStep('verify');
    } catch (err) {
      setError('QRコードの生成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/setup-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          secret,
          totpCode,
        }),
      });

      if (!response.ok) {
        throw new Error('Verification failed');
      }

      setSuccessMessage('2FAを有効化しました');
      setIs2FAEnabled(true);
      setStep('generate');
      setQrCode('');
      setSecret('');
      setTotpCode('');
    } catch (err) {
      setError('検証コードが正しくありません');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/disable-2fa', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to disable 2FA');
      }

      setSuccessMessage('2FAを無効化しました');
      setIs2FAEnabled(false);
      setDisableModalOpen(false);
    } catch (err) {
      setError('2FAの無効化に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-2xl font-bold">2FA設定</h1>

        {is2FAEnabled ? (
          <div>
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">✓ 2FAが有効です</p>
              <p className="text-sm text-green-600 mt-1">
                二要素認証が有効化されています。ログイン時に6桁のコードが必要です。
              </p>
            </div>
            <Button
              onClick={() => setDisableModalOpen(true)}
              variant="secondary"
              className="w-full"
            >
              2FAを無効化
            </Button>
            <Button
              onClick={() => router.push('/')}
              variant="secondary"
              className="w-full mt-2"
            >
              ダッシュボードに戻る
            </Button>
          </div>
        ) : (
          <>
            {step === 'generate' ? (
              <div>
                <p className="mb-4 text-sm text-gray-600">
                  二要素認証を有効にすると、ログイン時にパスワードに加えて6桁のコードが必要になります。
                </p>
                <Button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'QRコード生成中...' : 'QRコードを生成'}
                </Button>
                <Button
                  onClick={() => router.push('/')}
                  variant="secondary"
                  className="w-full mt-2"
                >
                  キャンセル
                </Button>
              </div>
            ) : (
              <form onSubmit={handleVerify}>
                <div className="mb-4">
                  <p className="mb-2 text-sm text-gray-600">
                    認証アプリ（Google Authenticator、Authyなど）でQRコードをスキャンしてください。
                  </p>
                  {qrCode && (
                    <div className="flex justify-center mb-4">
                      <Image
                        src={qrCode}
                        alt="QR Code"
                        width={200}
                        height={200}
                      />
                    </div>
                  )}
                </div>

                <Input
                  label="認証コード"
                  type="text"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="000000"
                  required
                />

                <Button
                  type="submit"
                  disabled={isLoading || totpCode.length !== 6}
                  className="mt-4 w-full"
                >
                  {isLoading ? '検証中...' : '検証して有効化'}
                </Button>
              </form>
            )}
          </>
        )}
      </div>

      {/* 無効化確認モーダル */}
      <Modal
        isOpen={disableModalOpen}
        onClose={() => setDisableModalOpen(false)}
        title="2FAを無効化"
        onConfirm={handleDisable}
        confirmText="無効化"
        cancelText="キャンセル"
      >
        <p>二要素認証を無効化してもよろしいですか？</p>
        <p className="text-sm text-gray-500 mt-2">
          無効化すると、ログイン時にパスワードのみで認証されます。
        </p>
      </Modal>

      {error && (
        <Toast
          message={error}
          type="error"
          onClose={() => setError('')}
        />
      )}

      {successMessage && (
        <Toast
          message={successMessage}
          type="success"
          onClose={() => setSuccessMessage('')}
        />
      )}
    </div>
  );
}
