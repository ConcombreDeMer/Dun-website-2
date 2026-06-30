import { useEffect, useState, type FormEvent } from 'react';
import resetPasswordIllustration from './assets/reset-password/7.png';
import { isSupabaseConfigured, supabase } from './lib/supabase';

export function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    document.documentElement.classList.add('designDocumentScroll');
    document.body.classList.add('designDocumentScroll');

    return () => {
      document.documentElement.classList.remove('designDocumentScroll');
      document.body.classList.remove('designDocumentScroll');
    };
  }, []);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setErrorMessage('');
      }
    });

    const code = new URLSearchParams(window.location.search).get('code');

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          console.error('Erreur exchangeCodeForSession:', error.message);
        }
      });
    }

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function ensureResetSession() {
    if (!supabase) {
      throw new Error("La connexion Supabase n'est pas configurée.");
    }

    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    if (!accessToken) {
      return;
    }

    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken ?? '',
    });

    if (error) {
      throw error;
    }
  }

  function createResetErrorMessage(error: unknown) {
    const message = error instanceof Error ? error.message : '';

    if (message.includes('invalid JWT') || message.includes('token') || message.includes('expired')) {
      return 'Le lien de réinitialisation est invalide ou a expiré. Demandez un nouveau lien depuis l’application.';
    }

    return message || 'Le lien de réinitialisation n’a pas pu être validé.';
  }

  async function updatePassword() {
    if (!supabase) {
      throw new Error("La connexion Supabase n'est pas configurée.");
    }

    const { data } = await supabase.auth.getSession();

    if (!data.session) {
      throw new Error('RESET_SESSION_MISSING');
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      throw error;
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);

    try {
      await ensureResetSession();
      await updatePassword();

      setSuccessMessage('Votre mot de passe a été réinitialisé avec succès !');
      setPassword('');
      setConfirmPassword('');

      window.setTimeout(() => {
        window.location.assign('/');
      }, 2500);
    } catch (error) {
      if (error instanceof Error && error.message === 'RESET_SESSION_MISSING') {
        setErrorMessage('Le lien de réinitialisation est invalide ou a expiré. Demandez un nouveau lien depuis l’application.');
      } else {
        setErrorMessage(createResetErrorMessage(error));
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="resetPasswordShell">
      <section className="resetPasswordStage" aria-labelledby="reset-password-title">
        <div className="resetPasswordCharacterWrap">
          <img
            className="resetPasswordIllustration"
            src={resetPasswordIllustration}
            alt="Illustration de réinitialisation du mot de passe"
          />
          <span className="resetPasswordShadow" aria-hidden="true" />
        </div>

        <header className="resetPasswordHeader">
          <h1 id="reset-password-title">Nouveau mot de passe</h1>
          <p className="resetPasswordDescription">Choisis un mot de passe clair, sécurisé, et on repart proprement.</p>
        </header>

        {!isSupabaseConfigured ? (
          <p className="resetPasswordMessage resetPasswordMessageError">
            La connexion Supabase n'est pas configurée.
          </p>
        ) : null}

        <form className="resetPasswordForm" onSubmit={handleResetPassword}>
          <label className="resetPasswordField" htmlFor="password">
            <span>Nouveau mot de passe</span>
            <input
              id="password"
              autoComplete="new-password"
              disabled={!isSupabaseConfigured || isLoading}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Votre nouveau mot de passe"
              required
              type="password"
              value={password}
            />
          </label>

          <label className="resetPasswordField" htmlFor="confirmPassword">
            <span>Confirmer le mot de passe</span>
            <input
              id="confirmPassword"
              autoComplete="new-password"
              disabled={!isSupabaseConfigured || isLoading}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirmez le mot de passe"
              required
              type="password"
              value={confirmPassword}
            />
          </label>

          {errorMessage ? (
            <p className="resetPasswordMessage resetPasswordMessageError" role="alert">
              {errorMessage}
            </p>
          ) : null}

          {successMessage ? (
            <p className="resetPasswordMessage resetPasswordMessageSuccess" role="status">
              {successMessage}
            </p>
          ) : null}

          <button
            className="resetPasswordSubmit"
            disabled={!isSupabaseConfigured || isLoading}
            type="submit"
          >
            {isLoading ? 'Mise à jour...' : 'Réinitialiser mon mot de passe'}
          </button>
        </form>
      </section>
    </main>
  );
}
