'use client';

import {
  loginSchema,
  registerSchema,
  type AuthUser,
} from '@purrfect/contracts';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ApiError } from '../lib/api-types';
import { useAuth } from './auth-provider';
import { Alert } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { FieldFrame, TextInput } from '../components/ui/form-field';

type FieldErrors = Record<string, string>;

function workspaceFor(user: AuthUser) {
  if (user.role === 'PARTNER') return '/partner';
  if (user.role === 'ADMIN') return '/admin';
  return '/account';
}

function issuesToFields(issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>) {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export function AuthForm({ mode, returnTo }: { mode: 'login' | 'signup'; returnTo?: string }) {
  const router = useRouter();
  const { login, register } = useAuth();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [requestError, setRequestError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequestError(null);
    setErrors({});

    const form = new FormData(event.currentTarget);

    const raw =
      mode === 'login'
        ? {
            email: form.get('email'),
            password: form.get('password'),
          }
        : {
            fullName: form.get('fullName'),
            email: form.get('email'),
            phone: String(form.get('phone') ?? '').trim() || undefined,
            city: String(form.get('city') ?? '').trim() || undefined,
            password: form.get('password'),
          };

    setSubmitting(true);

    try {
      let user: AuthUser;

      if (mode === 'login') {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) {
          setErrors(issuesToFields(parsed.error.issues));
          return;
        }
        user = await login(parsed.data);
      } else {
        const parsed = registerSchema.safeParse(raw);
        if (!parsed.success) {
          setErrors(issuesToFields(parsed.error.issues));
          return;
        }
        user = await register(parsed.data);
      }

      router.replace(returnTo ?? workspaceFor(user));
      router.refresh();
    } catch (error) {
      setRequestError(
        error instanceof ApiError
          ? error.message
          : 'Purrfect Stays could not complete that request. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      {requestError ? (
        <Alert tone="danger" title="We couldn’t continue">
          {requestError}
        </Alert>
      ) : null}

      {mode === 'signup' ? (
        <FieldFrame label="Full name" error={errors.fullName} required>
          <TextInput
            autoComplete="name"
            name="fullName"
            placeholder="Your name"
            required
          />
        </FieldFrame>
      ) : null}

      <FieldFrame label="Email address" error={errors.email} required>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          inputMode="email"
          name="email"
          placeholder="you@example.com"
          required
          type="email"
        />
      </FieldFrame>

      {mode === 'signup' ? (
        <div className="form-grid-two">
          <FieldFrame label="Phone" error={errors.phone} hint="Optional">
            <TextInput
              autoComplete="tel"
              inputMode="tel"
              name="phone"
              placeholder="+91…"
            />
          </FieldFrame>
          <FieldFrame label="City" error={errors.city} hint="Optional">
            <TextInput
              autoComplete="address-level2"
              name="city"
              placeholder="Bengaluru"
            />
          </FieldFrame>
        </div>
      ) : null}

      <FieldFrame
        label="Password"
        error={errors.password}
        hint={
          mode === 'signup'
            ? '12+ characters with uppercase, lowercase, number and symbol.'
            : undefined
        }
        required
      >
        <TextInput
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          name="password"
          placeholder={mode === 'signup' ? 'Create a strong password' : 'Your password'}
          required
          type="password"
        />
      </FieldFrame>

      <Button disabled={submitting} fullWidth size="lg" type="submit">
        {submitting
          ? mode === 'login'
            ? 'Signing in…'
            : 'Creating account…'
          : mode === 'login'
            ? 'Sign in'
            : 'Create account'}
        {!submitting ? <ArrowRight size={17} aria-hidden="true" /> : null}
      </Button>
    </form>
  );
}
