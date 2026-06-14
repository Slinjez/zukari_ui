import { useEffect, useMemo, useRef, useState } from 'react';
import { LogIn, ShieldCheck, UserPlus } from 'lucide-react';
import PhoneInput, { isPossiblePhoneNumber, parsePhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import '../styles/phone-input.css';
import { Card, Input, Label, PrimaryButton } from '../components/ui';
import BrandLogo from '../components/BrandLogo';
import { apiAuth } from '../services/apiAuth';
import { BORDER, BRAND, BRAND_DARK, BRAND_FAINT, BRAND_SOFT, GREEN, MUTED, RED, TEXT } from '../constants/theme';

const DIABETES_TYPES = [
  { value: 'type_1', label: 'Type 1 diabetes' },
  { value: 'type_2', label: 'Type 2 diabetes' },
  { value: 'gestational', label: 'Gestational diabetes' },
  { value: 'other', label: 'Other / not sure' },
];

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizePhone(value) {
  if (!value) {
    return '';
  }

  try {
    const parsed = parsePhoneNumber(value);
    return parsed?.number || value;
  } catch {
    return value;
  }
}

function isValidSignupPhone(value) {
  if (!value) {
    return false;
  }

  try {
    return isPossiblePhoneNumber(value);
  } catch {
    return false;
  }
}

function AuthInput({ value, onChange, type = 'text', placeholder, ...props }) {
  return (
    <Input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      {...props}
    />
  );
}

function SelectField({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      style={{
        width: '100%',
        height: 48,
        background: BRAND_FAINT,
        border: `1px solid ${BORDER}`,
        borderRadius: 14,
        padding: '0 14px',
        color: TEXT,
        fontSize: 15,
        outline: 'none',
        fontWeight: 750,
      }}
    >
      {children}
    </select>
  );
}

function MobilePhoneField({ value, onChange, showError }) {
  const normalizedPhone = useMemo(() => normalizePhone(value), [value]);

  return (
    <div>
      <Label>Mobile number</Label>
      <PhoneInput
        className={`zukari-phone-input${showError ? ' is-invalid' : ''}`}
        defaultCountry="KE"
        addInternationalOption={false}
        countryCallingCodeEditable={false}
        smartCaret={false}
        value={value || undefined}
        onChange={(nextValue) => onChange(nextValue || '')}
        placeholder="712 345 678"
        international={false}
        autoComplete="tel"
      />

      <div style={{ color: showError ? RED : MUTED, fontWeight: 700, fontSize: 11, marginTop: 7 }}>
        {normalizedPhone
          ? `We will save it as ${normalizedPhone}`
          : 'Choose your country and enter your mobile number.'}
      </div>
    </div>
  );
}

function AuthTab({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: 'none',
        borderRadius: 999,
        padding: '11px 14px',
        background: active ? BRAND : 'transparent',
        color: active ? '#fff' : MUTED,
        fontWeight: 950,
        cursor: 'pointer',
        flex: 1,
      }}
    >
      {children}
    </button>
  );
}

export default function AuthScreen({ onLogin, onRegister, onGoogleLogin }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [diabetesType, setDiabetesType] = useState('type_1');
  const [message, setMessage] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const googleButtonRef = useRef(null);

  const isSignup = mode === 'signup';
  const Icon = isSignup ? UserPlus : LogIn;
  const normalizedPhone = useMemo(() => normalizePhone(phone), [phone]);
  const showPhoneError = isSignup && phoneTouched && Boolean(phone) && !isValidSignupPhone(phone);

  const helperText = useMemo(() => {
    if (isSignup) {
      return 'Create your Zukari cloud account. Mobile number included, because ghosts cannot receive OTPs.';
    }

    return 'Welcome back. Unlock your sugar command center.';
  }, [isSignup]);

  useEffect(() => {
    if (!apiAuth.hasGoogleClient || !googleButtonRef.current || typeof onGoogleLogin !== 'function') {
      return undefined;
    }

    googleButtonRef.current.innerHTML = '';

    apiAuth.renderGoogleButton(
      googleButtonRef.current,
      async (session) => {
        try {
          setIsBusy(true);
          setMessage('');
          await onGoogleLogin(session);
        } catch (error) {
          setMessage(error?.message || 'Google login failed. Try again.');
        } finally {
          setIsBusy(false);
        }
      },
      (error) => {
        console.warn('Google sign-in could not initialize', error);
      }
    );

    return undefined;
  }, [onGoogleLogin]);

  const resetMessage = () => setMessage('');

  const submit = async () => {
    resetMessage();

    if (isSignup) {
      const email = normalizeEmail(identifier);

      if (!name.trim()) {
        setMessage('Enter your name. Zukari needs to know who the glucose boss is.');
        return;
      }

      if (!email) {
        setMessage('Enter your email address.');
        return;
      }

      if (!email.includes('@')) {
        setMessage('Enter a valid email address.');
        return;
      }

      if (!isValidSignupPhone(phone)) {
        setPhoneTouched(true);
        setMessage('Enter a valid mobile number with the correct country selected.');
        return;
      }

      if (!password) {
        setMessage('Enter your password.');
        return;
      }

      if (password.length < 6) {
        setMessage('Password should be at least 6 characters.');
        return;
      }

      if (password !== confirmPassword) {
        setMessage('Passwords do not match. Tiny chaos detected.');
        return;
      }
    } else {
      if (!identifier.trim()) {
        setMessage('Enter your email or mobile number. Zukari cannot login a ghost account.');
        return;
      }

      if (!password) {
        setMessage('Enter your password.');
        return;
      }
    }

    try {
      setIsBusy(true);

      if (isSignup) {
        const email = normalizeEmail(identifier);

        await onRegister({
          name: name.trim(),
          identifier: email,
          email,
          phone: normalizedPhone,
          password,
          diabetesType,
        });
      } else {
        await onLogin({
          identifier: identifier.trim(),
          password,
        });
      }
    } catch (error) {
      setMessage(error?.message || 'Authentication failed. Try again.');
    } finally {
      setIsBusy(false);
    }
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setMessage('');
    setPassword('');
    setConfirmPassword('');
    setPhoneTouched(false);
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        width: '100%',
        background: `linear-gradient(155deg, ${BRAND_DARK} 0%, #3f2412 48%, #130b06 100%)`,
        color: '#fff',
        display: 'grid',
        placeItems: 'center',
        padding: 18,
        boxSizing: 'border-box',
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ marginBottom: 18, textAlign: 'center' }}>
          <BrandLogo
            size={92}
            style={{
              margin: '0 auto 13px',
              borderColor: 'rgba(255,255,255,.22)',
              boxShadow: '0 18px 42px rgba(0,0,0,.20)',
            }}
          />
          <h1 style={{ margin: '8px 0 6px', fontSize: 29, lineHeight: 1.05 }}>Your account gate</h1>
          <div style={{ color: 'rgba(255,255,255,.68)', fontWeight: 700, fontSize: 13 }}>{helperText}</div>
        </div>

        <Card style={{ background: '#fffaf5', borderRadius: 28 }}>
          <div style={{ display: 'flex', background: BRAND_SOFT, borderRadius: 999, padding: 4, marginBottom: 18 }}>
            <AuthTab active={!isSignup} onClick={() => switchMode('login')}>Login</AuthTab>
            <AuthTab active={isSignup} onClick={() => switchMode('signup')}>Sign up</AuthTab>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 13,
              borderRadius: 18,
              background: `${BRAND}10`,
              border: `1px solid ${BORDER}`,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 15,
                background: BRAND_SOFT,
                color: BRAND,
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <Icon size={21} />
            </div>
            <div>
              <div style={{ color: TEXT, fontWeight: 950, fontSize: 14 }}>{isSignup ? 'Create account' : 'Login'}</div>
              <div style={{ color: MUTED, fontWeight: 650, fontSize: 12, marginTop: 2 }}>
                Secure API auth with JWT.
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 13 }}>
            {isSignup && (
              <div>
                <Label>Name</Label>
                <AuthInput value={name} onChange={setName} placeholder="Your name" autoComplete="name" />
              </div>
            )}

            <div>
              <Label>{isSignup ? 'Email address' : 'Email or mobile number'}</Label>
              <AuthInput
                value={identifier}
                onChange={setIdentifier}
                type={isSignup ? 'email' : 'text'}
                inputMode={isSignup ? 'email' : 'text'}
                autoComplete={isSignup ? 'email' : 'username'}
                placeholder={isSignup ? 'you@example.com' : 'you@example.com or +2547...'}
              />
            </div>

            {isSignup && (
              <MobilePhoneField
                value={phone}
                onChange={(nextPhone) => {
                  setPhone(nextPhone);
                  setPhoneTouched(true);
                }}
                showError={showPhoneError}
              />
            )}

            {isSignup && (
              <div>
                <Label>Diabetes type</Label>
                <SelectField value={diabetesType} onChange={setDiabetesType}>
                  {DIABETES_TYPES.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </SelectField>
              </div>
            )}

            <div>
              <Label>Password</Label>
              <AuthInput
                value={password}
                onChange={setPassword}
                type="password"
                placeholder="Password"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
              />
            </div>

            {isSignup && (
              <div>
                <Label>Confirm password</Label>
                <AuthInput
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  type="password"
                  placeholder="Repeat password"
                  autoComplete="new-password"
                />
              </div>
            )}
          </div>

          {message && (
            <div
              style={{
                borderRadius: 16,
                padding: 13,
                border: `1px solid ${RED}`,
                background: '#f4e1dc',
                color: RED,
                fontWeight: 900,
                fontSize: 13,
                marginTop: 15,
              }}
            >
              {message}
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <PrimaryButton color={isBusy ? MUTED : BRAND} onClick={isBusy ? undefined : submit}>
              {isBusy ? 'Working...' : isSignup ? 'Create account' : 'Login'}
            </PrimaryButton>
          </div>

          {apiAuth.hasGoogleClient && (
            <div style={{ marginTop: 14 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  color: MUTED,
                  fontWeight: 800,
                  fontSize: 11,
                  margin: '8px 0 12px',
                }}
              >
                <span style={{ height: 1, background: BORDER, flex: 1 }} />
                <span>or continue with</span>
                <span style={{ height: 1, background: BORDER, flex: 1 }} />
              </div>
              <div ref={googleButtonRef} style={{ display: 'grid', placeItems: 'center', minHeight: 44 }} />
            </div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              color: GREEN,
              background: `${GREEN}10`,
              borderRadius: 16,
              padding: 12,
              marginTop: 14,
              fontWeight: 800,
              fontSize: 12,
            }}
          >
            <ShieldCheck size={18} />
            <span>All main screens are guarded until login.</span>
          </div>

          <div style={{ color: MUTED, fontWeight: 650, fontSize: 11, lineHeight: 1.45, marginTop: 12 }}>
            Note: Zukari now signs in through the Symfony API. Local device storage remains useful for offline diary data.
          </div>
        </Card>
      </div>
    </div>
  );
}
