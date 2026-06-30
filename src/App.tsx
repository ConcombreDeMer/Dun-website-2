import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import characterImage from './assets/character/1.png';
import ritualCharacterImage from './assets/character/3.png';
import statsCharacterImage from './assets/character/14.png';
import restCharacterImage from './assets/character/17.png';
import betaCharacterImage from './assets/character/5.png';
import characterMenuImage from './assets/character/20.png';
import characterShadow from './assets/character/0.png';
import dailyImage from './assets/daily/daily.png';
import dailyMockupImage from './assets/daily/daily-mockup.png';
import graphImage from './assets/stats/graph.png';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { CreateIssuePage, IssueDetailPage, LoginPage, SupportPage } from './Support';
import designMockupImage from '../assets/design-mockup.png';

type ScreenId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

type Screen = {
  id: ScreenId;
  eyebrow: string;
  title: string;
  body: string;
};

const screens: Record<ScreenId, Screen> = {
  1: {
    id: 1,
    eyebrow: 'Etat 1',
    title: 'Dun',
    body: 'Le point de depart du site vitrine mobile first.',
  },
  2: {
    id: 2,
    eyebrow: 'Etat 2',
    title: 'Choisir un parcours',
    body: 'Cet etat central servira a afficher les differents moments produit.',
  },
  3: {
    id: 3,
    eyebrow: 'Etat 3',
    title: 'Parcours 1',
    body: 'Un futur ecran anime pourra prendre cette place.',
  },
  4: {
    id: 4,
    eyebrow: 'Etat 4',
    title: 'Parcours 2',
    body: 'La structure reste volontairement simple pour iterer vite.',
  },
  5: {
    id: 5,
    eyebrow: 'Etat 5',
    title: 'Parcours 3',
    body: 'Chaque etat est isole pour faciliter les transitions a venir.',
  },
  6: {
    id: 6,
    eyebrow: 'Etat 6',
    title: 'Parcours 4',
    body: 'Dernier emplacement reserve aux screens du one pager.',
  },
  7: {
    id: 7,
    eyebrow: 'Etat 7',
    title: 'Beta',
    body: 'Inscription a la beta.',
  },
};

const menuTasks: { id: ScreenId; text: ReactNode }[] = [
  { id: 3, text: <>Un <strong>rituel</strong> matinale</> },
  { id: 4, text: <>Une <strong>to do list</strong> qui va a l'essentiel</> },
  { id: 5, text: <>Un <strong>suivi</strong> intelligent</> },
  { id: 6, text: <>Un <strong>mode repos</strong> necessaire</> },
];

const ritualSteps = [
  {
    title: 'Regarde hier sans te juger',
    body: 'Les tâches en suspens sont reprises calmement, pour repartir proprement.',
    index: 1,
  },
  {
    title: "Prépare aujourd’hui",
    body: 'Tu gardes une liste claire, courte, et ajustable au rythme réel de ta journée.',
    index: 2,
  },
  {
    title: 'Lance ta journée',
    body: 'Un geste, une intention, et Dun se fait discret pendant que tu avances.',
    index: 3,
  },
];

const isMobileSafari =
  /iP(ad|hone|od)/i.test(navigator.userAgent) &&
  /Safari/i.test(navigator.userAgent) &&
  !/(CriOS|FxiOS|EdgiOS|OPiOS)/i.test(navigator.userAgent);

const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const turnstileScriptSrc = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

const screenPaths: Record<ScreenId, string> = {
  1: '/',
  2: '/menu',
  3: '/informations/rituel',
  4: '/informations/design',
  5: '/informations/statistiques',
  6: '/informations/repos',
  7: '/beta',
};

function getScreenIdFromPath(pathname: string): ScreenId {
  const matchingEntry = Object.entries(screenPaths).find(([, path]) => path === pathname);

  return matchingEntry ? (Number(matchingEntry[0]) as ScreenId) : 1;
}

function App() {
  const pathname = window.location.pathname;

  if (pathname === '/support') {
    return <SupportPage />;
  }

  if (pathname === '/login') {
    return <LoginPage />;
  }

  if (pathname === '/support/create') {
    return <CreateIssuePage />;
  }

  if (pathname.startsWith('/support/')) {
    const issueId = decodeURIComponent(pathname.replace('/support/', ''));

    return <IssueDetailPage issueId={issueId} />;
  }

  return <OnePager />;
}

function OnePager() {
  const [currentScreenId, setCurrentScreenId] = useState<ScreenId>(() => getScreenIdFromPath(window.location.pathname));
  const [shouldDelayStateContent, setShouldDelayStateContent] = useState(false);
  const [stateThreeMotion, setStateThreeMotion] = useState<'entering' | 'leaving' | null>(null);
  const [stateFourMotion, setStateFourMotion] = useState<'entering' | 'leaving' | null>(null);
  const [stateFiveMotion, setStateFiveMotion] = useState<'entering' | 'leaving' | null>(null);
  const [stateSixMotion, setStateSixMotion] = useState<'entering' | 'leaving' | null>(null);
  const [stateSevenMotion, setStateSevenMotion] = useState<'entering' | 'leaving' | null>(null);
  const [dailyMockupState, setDailyMockupState] = useState<'open' | 'closing' | null>(null);
  const [betaEmail, setBetaEmail] = useState('');
  const [isBetaSubmitting, setIsBetaSubmitting] = useState(false);
  const [betaToast, setBetaToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [betaTurnstileToken, setBetaTurnstileToken] = useState<string | null>(null);
  const delayResetTimeoutRef = useRef<number | null>(null);
  const stateThreeMotionTimeoutRef = useRef<number | null>(null);
  const stateFourMotionTimeoutRef = useRef<number | null>(null);
  const stateFiveMotionTimeoutRef = useRef<number | null>(null);
  const stateSixMotionTimeoutRef = useRef<number | null>(null);
  const stateSevenMotionTimeoutRef = useRef<number | null>(null);
  const betaToastTimeoutRef = useRef<number | null>(null);
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);
  const turnstileResolveRef = useRef<((token: string | null) => void) | null>(null);
  const turnstileTimeoutRef = useRef<number | null>(null);
  const dailyMockupCloseTimeoutRef = useRef<number | null>(null);
  const currentScreen = screens[currentScreenId];
  const delayedContentClassName = shouldDelayStateContent ? ' delayedContent' : '';
  const isDailyMockupVisible = dailyMockupState !== null;
  const shouldBlurRitualContent = dailyMockupState === 'open';
  const stateThreeContentClassName =
    stateThreeMotion === 'entering'
      ? ' stateThreeContentEntering'
      : stateThreeMotion === 'leaving'
        ? ' stateThreeContentLeaving'
        : '';
  const stateFourContentClassName =
    stateFourMotion === 'entering'
      ? ' stateFourContentEntering'
      : stateFourMotion === 'leaving'
        ? ' stateFourContentLeaving'
        : '';
  const stateFiveContentClassName =
    stateFiveMotion === 'entering'
      ? ' stateFiveContentEntering'
      : stateFiveMotion === 'leaving'
        ? ' stateFiveContentLeaving'
        : '';
  const stateSixContentClassName =
    stateSixMotion === 'entering'
      ? ' stateSixContentEntering'
      : stateSixMotion === 'leaving'
        ? ' stateSixContentLeaving'
        : '';
  const stateSevenContentClassName =
    stateSevenMotion === 'entering'
      ? ' stateSevenContentEntering'
      : stateSevenMotion === 'leaving'
        ? ' stateSevenContentLeaving'
        : '';

  useEffect(() => {
    const shouldUseDocumentScroll = currentScreenId === 4 || currentScreenId === 5 || currentScreenId === 6;

    document.documentElement.classList.toggle('designDocumentScroll', shouldUseDocumentScroll);
    document.body.classList.toggle('designDocumentScroll', shouldUseDocumentScroll);

    return () => {
      document.documentElement.classList.remove('designDocumentScroll');
      document.body.classList.remove('designDocumentScroll');
    };
  }, [currentScreenId]);

  useEffect(() => {
    if (currentScreenId !== 7 || !turnstileSiteKey || !turnstileContainerRef.current) {
      return;
    }

    let isCancelled = false;

    const renderTurnstile = () => {
      if (isCancelled || !window.turnstile || !turnstileContainerRef.current || turnstileWidgetIdRef.current) {
        return;
      }

      turnstileWidgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
        sitekey: turnstileSiteKey,
        size: 'invisible',
        callback: (token) => {
          if (turnstileTimeoutRef.current !== null) {
            window.clearTimeout(turnstileTimeoutRef.current);
            turnstileTimeoutRef.current = null;
          }

          setBetaTurnstileToken(token);
          turnstileResolveRef.current?.(token);
          turnstileResolveRef.current = null;
        },
        'expired-callback': () => {
          if (turnstileTimeoutRef.current !== null) {
            window.clearTimeout(turnstileTimeoutRef.current);
            turnstileTimeoutRef.current = null;
          }

          setBetaTurnstileToken(null);
          turnstileResolveRef.current?.(null);
          turnstileResolveRef.current = null;
        },
        'error-callback': () => {
          if (turnstileTimeoutRef.current !== null) {
            window.clearTimeout(turnstileTimeoutRef.current);
            turnstileTimeoutRef.current = null;
          }

          setBetaTurnstileToken(null);
          turnstileResolveRef.current?.(null);
          turnstileResolveRef.current = null;
        },
      });
    };

    if (window.turnstile) {
      renderTurnstile();
    } else {
      const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${turnstileScriptSrc}"]`);
      const script = existingScript ?? document.createElement('script');

      script.src = turnstileScriptSrc;
      script.async = true;
      script.defer = true;
      script.addEventListener('load', renderTurnstile);

      if (!existingScript) {
        document.head.appendChild(script);
      }
    }

    return () => {
      isCancelled = true;
      setBetaTurnstileToken(null);

      if (turnstileTimeoutRef.current !== null) {
        window.clearTimeout(turnstileTimeoutRef.current);
        turnstileTimeoutRef.current = null;
      }

      turnstileResolveRef.current?.(null);
      turnstileResolveRef.current = null;

      if (window.turnstile && turnstileWidgetIdRef.current) {
        window.turnstile.remove(turnstileWidgetIdRef.current);
      }

      turnstileWidgetIdRef.current = null;
    };
  }, [currentScreenId]);

  const resetTurnstile = () => {
    setBetaTurnstileToken(null);

    if (window.turnstile && turnstileWidgetIdRef.current) {
      window.turnstile.reset(turnstileWidgetIdRef.current);
    }
  };

  const getTurnstileToken = () =>
    new Promise<string | null>((resolve) => {
      if (betaTurnstileToken) {
        resolve(betaTurnstileToken);
        return;
      }

      if (!window.turnstile || !turnstileWidgetIdRef.current) {
        resolve(null);
        return;
      }

      turnstileResolveRef.current = resolve;
      window.turnstile.execute(turnstileWidgetIdRef.current);

      if (turnstileTimeoutRef.current !== null) {
        window.clearTimeout(turnstileTimeoutRef.current);
      }

      turnstileTimeoutRef.current = window.setTimeout(() => {
        turnstileResolveRef.current?.(null);
        turnstileResolveRef.current = null;
        turnstileTimeoutRef.current = null;
      }, 10000);
    });

  const goToScreen = (screenId: ScreenId, options: { updateHistory?: boolean } = {}) => {
    const shouldUpdateHistory = options.updateHistory ?? true;
    const shouldAnimateCharacterTransition =
      (currentScreenId === 1 && screenId === 2) || (currentScreenId === 2 && screenId === 1);
    const documentWithTransition = document as Document & {
      startViewTransition?: (callback: () => void) => { finished: Promise<void> };
    };

    if (shouldUpdateHistory && window.location.pathname !== screenPaths[screenId]) {
      window.history.pushState({ screenId }, '', screenPaths[screenId]);
    }

    if (delayResetTimeoutRef.current !== null) {
      window.clearTimeout(delayResetTimeoutRef.current);
      delayResetTimeoutRef.current = null;
    }

    if (stateThreeMotionTimeoutRef.current !== null) {
      window.clearTimeout(stateThreeMotionTimeoutRef.current);
      stateThreeMotionTimeoutRef.current = null;
    }

    if (stateFourMotionTimeoutRef.current !== null) {
      window.clearTimeout(stateFourMotionTimeoutRef.current);
      stateFourMotionTimeoutRef.current = null;
    }

    if (stateFiveMotionTimeoutRef.current !== null) {
      window.clearTimeout(stateFiveMotionTimeoutRef.current);
      stateFiveMotionTimeoutRef.current = null;
    }

    if (stateSixMotionTimeoutRef.current !== null) {
      window.clearTimeout(stateSixMotionTimeoutRef.current);
      stateSixMotionTimeoutRef.current = null;
    }

    if (stateSevenMotionTimeoutRef.current !== null) {
      window.clearTimeout(stateSevenMotionTimeoutRef.current);
      stateSevenMotionTimeoutRef.current = null;
    }

    if (dailyMockupCloseTimeoutRef.current !== null) {
      window.clearTimeout(dailyMockupCloseTimeoutRef.current);
      dailyMockupCloseTimeoutRef.current = null;
    }

    setDailyMockupState(null);

    if (currentScreenId === 3 && screenId !== 3) {
      setStateThreeMotion('leaving');
      stateThreeMotionTimeoutRef.current = window.setTimeout(() => {
        setStateThreeMotion(null);
        setCurrentScreenId(screenId);
        stateThreeMotionTimeoutRef.current = null;
      }, 220);
      return;
    }

    if (currentScreenId === 4 && screenId !== 4) {
      setStateFourMotion('leaving');
      stateFourMotionTimeoutRef.current = window.setTimeout(() => {
        setStateFourMotion(null);
        setCurrentScreenId(screenId);
        stateFourMotionTimeoutRef.current = null;
      }, 220);
      return;
    }

    if (currentScreenId === 5 && screenId !== 5) {
      setStateFiveMotion('leaving');
      stateFiveMotionTimeoutRef.current = window.setTimeout(() => {
        setStateFiveMotion(null);
        setCurrentScreenId(screenId);
        stateFiveMotionTimeoutRef.current = null;
      }, 220);
      return;
    }

    if (currentScreenId === 6 && screenId !== 6) {
      setStateSixMotion('leaving');
      stateSixMotionTimeoutRef.current = window.setTimeout(() => {
        setStateSixMotion(null);
        setCurrentScreenId(screenId);
        stateSixMotionTimeoutRef.current = null;
      }, 220);
      return;
    }

    if (currentScreenId === 7 && screenId !== 7) {
      setStateSevenMotion('leaving');
      stateSevenMotionTimeoutRef.current = window.setTimeout(() => {
        setStateSevenMotion(null);
        setCurrentScreenId(screenId);
        stateSevenMotionTimeoutRef.current = null;
      }, 220);
      return;
    }

    if (screenId === 3) {
      setStateThreeMotion('entering');
      setShouldDelayStateContent(false);
      setCurrentScreenId(3);
      stateThreeMotionTimeoutRef.current = window.setTimeout(() => {
        setStateThreeMotion(null);
        stateThreeMotionTimeoutRef.current = null;
      }, 760);
      return;
    }

    if (screenId === 4) {
      setStateFourMotion('entering');
      setShouldDelayStateContent(false);
      setCurrentScreenId(4);
      stateFourMotionTimeoutRef.current = window.setTimeout(() => {
        setStateFourMotion(null);
        stateFourMotionTimeoutRef.current = null;
      }, 760);
      return;
    }

    if (screenId === 5) {
      setStateFiveMotion('entering');
      setShouldDelayStateContent(false);
      setCurrentScreenId(5);
      stateFiveMotionTimeoutRef.current = window.setTimeout(() => {
        setStateFiveMotion(null);
        stateFiveMotionTimeoutRef.current = null;
      }, 760);
      return;
    }

    if (screenId === 6) {
      setStateSixMotion('entering');
      setShouldDelayStateContent(false);
      setCurrentScreenId(6);
      stateSixMotionTimeoutRef.current = window.setTimeout(() => {
        setStateSixMotion(null);
        stateSixMotionTimeoutRef.current = null;
      }, 760);
      return;
    }

    if (screenId === 7) {
      setStateSevenMotion('entering');
      setShouldDelayStateContent(false);
      setCurrentScreenId(7);
      stateSevenMotionTimeoutRef.current = window.setTimeout(() => {
        setStateSevenMotion(null);
        stateSevenMotionTimeoutRef.current = null;
      }, 760);
      return;
    }

    if (shouldAnimateCharacterTransition && documentWithTransition.startViewTransition) {
      const transition = documentWithTransition.startViewTransition(() => {
        flushSync(() => {
          setShouldDelayStateContent(true);
          setCurrentScreenId(screenId);
        });
      });
      transition.finished.finally(() => {
        delayResetTimeoutRef.current = window.setTimeout(() => {
          setShouldDelayStateContent(false);
          delayResetTimeoutRef.current = null;
        }, 360);
      });
      return;
    }

    setShouldDelayStateContent(false);
    setCurrentScreenId(screenId);
  };

  useEffect(() => {
    const handlePopState = () => {
      goToScreen(getScreenIdFromPath(window.location.pathname), { updateHistory: false });
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  });

  const openDailyMockup = () => {
    if (dailyMockupCloseTimeoutRef.current !== null) {
      window.clearTimeout(dailyMockupCloseTimeoutRef.current);
      dailyMockupCloseTimeoutRef.current = null;
    }

    setDailyMockupState('open');
  };

  const closeDailyMockup = () => {
    setDailyMockupState('closing');
    dailyMockupCloseTimeoutRef.current = window.setTimeout(() => {
      setDailyMockupState(null);
      dailyMockupCloseTimeoutRef.current = null;
    }, 260);
  };

  const showBetaToast = (type: 'success' | 'error', message: string) => {
    if (betaToastTimeoutRef.current !== null) {
      window.clearTimeout(betaToastTimeoutRef.current);
    }

    setBetaToast({ type, message });
    betaToastTimeoutRef.current = window.setTimeout(() => {
      setBetaToast(null);
      betaToastTimeoutRef.current = null;
    }, 3600);
  };

  const handleBetaSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const email = betaEmail.trim().toLowerCase();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

    if (!isValidEmail) {
      showBetaToast('error', 'Entre une adresse email valide.');
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      showBetaToast('error', 'La connexion Supabase n’est pas configurée.');
      return;
    }

    if (!turnstileSiteKey) {
      showBetaToast('error', 'La protection anti-spam n’est pas configurée.');
      return;
    }

    setIsBetaSubmitting(true);

    const turnstileToken = await getTurnstileToken();

    if (!turnstileToken) {
      setIsBetaSubmitting(false);
      resetTurnstile();
      showBetaToast('error', 'La vérification anti-spam a échoué. Réessaie dans un instant.');
      return;
    }

    const { error } = await supabase.functions.invoke('beta-signup', {
      body: { email, turnstileToken },
    });

    setIsBetaSubmitting(false);
    resetTurnstile();

    if (error) {
      showBetaToast('error', "L’inscription n’a pas pu être envoyée. Réessaie dans un instant.");
      return;
    }

    setBetaEmail('');
    showBetaToast('success', 'Merci, ton email a bien été ajouté à la beta.');
  };

  const navigation = (
    <button className="button buttonGhost" onClick={() => goToScreen(2)}>
      Retour
    </button>
  );
  const desktopNav = <DesktopNav currentScreenId={currentScreenId} goToScreen={goToScreen} />;

  if (currentScreenId === 1) {
    return (
      <main className="pageShell">
        {desktopNav}
        <section className="stage introStage" aria-labelledby="intro-title">
          <div className={`introCopy${delayedContentClassName}`}>
            <h1 className="introTitle" id="intro-title">
              Dun.
            </h1>
            <p className="introSubtitle">Reprends le controle</p>
          </div>

          <button
            className="characterButton"
            onClick={() => goToScreen(2)}
            aria-label="Cliquer sur Dun pour continuer"
          >
            <img className="characterImage" src={characterImage} alt="" />
            <img className="characterShadow" src={characterShadow} alt="" />
          </button>

          <div className={`introHint${delayedContentClassName}`} aria-hidden="true">
            <span className="introChevron" />
            <span>Cliques sur Dun</span>
          </div>
        </section>
      </main>
    );
  }

  if (currentScreenId === 2) {
    return (
      <main className="pageShell">
        {desktopNav}
        <section className="stage menuStage" aria-label="Choisir une presentation de Dun">
          <button
            className={`menuBackButton${delayedContentClassName}`}
            onClick={() => goToScreen(1)}
            aria-label="Retour a l'accueil"
          >
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
              <path d="M15 5 8 12l7 7" />
            </svg>
          </button>

          <div className="menuCharacterWrap" aria-hidden="true">
            <img className="menuCharacterImage" src={characterMenuImage} alt="" />
            <img className="menuCharacterShadow" src={characterShadow} alt="" />
          </div>

          <div className={`taskList${delayedContentClassName}`} aria-label="Parcours disponibles">
            {menuTasks.map((task) => (
              <button className="taskButton" key={task.id} onClick={() => goToScreen(task.id)}>
                <span className="taskText">{task.text}</span>
                <span className="taskCheckbox" aria-hidden="true">
                  <svg className="taskCheckIcon" viewBox="0 0 24 24" focusable="false">
                    <path d="M5 12.5 10 17.5 19.5 6.5" />
                  </svg>
                </span>
              </button>
            ))}
          </div>

          <div className={`menuActions${delayedContentClassName}`}>
            <button className="betaButton" type="button" onClick={() => goToScreen(7)}>
              Rejoindre la beta
            </button>
            <a className="supportButton" href="/support">
              Support
            </a>
          </div>
        </section>
      </main>
    );
  }

  if (currentScreenId === 3) {
    return (
      <main className="pageShell">
        {desktopNav}
        <section
          className={`stage ritualStage${isMobileSafari ? ' ritualStageSafari' : ''}`}
          aria-labelledby="ritual-title"
        >
          <button
            className={`menuBackButton${stateThreeContentClassName}${
              shouldBlurRitualContent ? ' ritualBlurredContent' : ''
            }`}
            onClick={() => goToScreen(2)}
            aria-label="Retour aux parcours"
          >
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
              <path d="M15 5 8 12l7 7" />
            </svg>
          </button>

          <div
            className={`ritualContent${stateThreeContentClassName}${
              shouldBlurRitualContent ? ' ritualBlurredContent' : ''
            }`}
          >
            <header className="ritualHeader">
              <h1 className="ritualTitle" id="ritual-title">
                Un rituel
              </h1>
              <p className="ritualSubtitle">
                pour commencer la journée
                <br />
                avec intention
              </p>
            </header>

            <section className="ritualCard" aria-label="Les trois étapes du rituel">
              {ritualSteps.map((step) => (
                <article className="ritualStep" key={step.index}>
                  <div>
                    <h2>{step.title}</h2>
                    <p>{step.body}</p>
                  </div>
                  <span>{step.index}</span>
                </article>
              ))}
            </section>

            <div className="ritualShowcase">
              <div className="dailyBox">
                <img src={dailyImage} alt="" />
              </div>
              <button
                className="dailyMockupButton"
                onClick={openDailyMockup}
                aria-label="Agrandir la mockup Daily"
              >
                <img className="dailyMockup" src={dailyMockupImage} alt="" />
              </button>
            </div>
          </div>

          {!isMobileSafari && !isDailyMockupVisible && (
            <img className="ritualCharacter" src={ritualCharacterImage} alt="" aria-hidden="true" />
          )}

          {isDailyMockupVisible && (
            <div
              className={`mockupOverlay${dailyMockupState === 'closing' ? ' mockupOverlayClosing' : ''}`}
            >
              <button
                className="mockupBackdrop"
                onClick={closeDailyMockup}
                aria-label="Fermer l'aperçu Daily"
              />
              <img
                className={`mockupOverlayImage${
                  dailyMockupState === 'closing' ? ' mockupOverlayImageClosing' : ''
                }`}
                src={dailyMockupImage}
                alt="Aperçu agrandi de l'écran Daily"
              />
            </div>
          )}
        </section>
      </main>
    );
  }

  if (currentScreenId === 4) {
    return (
      <main className="pageShell designPageShell">
        {desktopNav}
        <section className="stage designStage" aria-labelledby="design-title">
          <button
            className={`menuBackButton${stateFourContentClassName}`}
            onClick={() => goToScreen(2)}
            aria-label="Retour aux parcours"
          >
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
              <path d="M15 5 8 12l7 7" />
            </svg>
          </button>

          <div className={`designContent${stateFourContentClassName}`}>
            <header className="designHeader">
              <h1 className="designTitle" id="design-title">
                Un design
              </h1>
              <p className="designSubtitle">calme, directe et fluide</p>
            </header>

            <section className="designCard designCardTop">
              <h2>Une interface qui laisse respirer.</h2>
              <p>
                Dun va droit à l’essentiel : ta journée, tes tâches, ton rythme. L’interface évite
                le bruit visuel pour que chaque action reste claire, rapide et naturelle.
              </p>
            </section>

            <img
              className="designMockup"
              src={designMockupImage}
              alt="Mockups de l'interface Dun"
            />

            <section className="designCard designCardBottom">
              <h2>Dun se place entre la todo list minimaliste et l’outil de productivité ultra complexe.</h2>
              <p>
                L’app donne juste assez de structure pour organiser ses journées, suivre son rythme
                et personnaliser son espace, sans imposer une méthode unique. Chacun peut y
                construire son propre système, avec une interface qui reste claire, calme et directe.
              </p>
            </section>
          </div>
        </section>
      </main>
    );
  }

  if (currentScreenId === 5) {
    return (
      <main className="pageShell designPageShell">
        {desktopNav}
        <section className="stage statsStage" aria-labelledby="stats-title">
          <button
            className={`menuBackButton${stateFiveContentClassName}`}
            onClick={() => goToScreen(2)}
            aria-label="Retour aux parcours"
          >
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
              <path d="M15 5 8 12l7 7" />
            </svg>
          </button>

          <div className={`statsContent${stateFiveContentClassName}`}>
            <header className="statsHeader">
              <h1 className="statsTitle" id="stats-title">
                Des statistiques
              </h1>
              <p className="statsSubtitle">pour mieux comprendre ton quotidien</p>
            </header>

            <div className="statsGraphArea" aria-hidden="true">
              <svg className="statsGraphSvg" viewBox="0 0 430 360" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="statsAreaGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#C8C8C8" stopOpacity="0.92" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  className="statsGraphFill"
                  d="M-14 224 L22 188 L80 226 L112 162 L140 208 L194 88 L280 54 L328 104 L386 28 L412 72 L446 -18 L446 360 L-14 360 Z"
                />
                <path
                  className="statsGraphStroke"
                  d="M-14 224 L22 188 L80 226 L112 162 L140 208 L194 88 L280 54 L328 104 L386 28 L412 72 L446 -18"
                />
              </svg>
              <img className="statsCharacter" src={statsCharacterImage} alt="" />
            </div>

            <section className="statsText statsMetrics">
              <h2>Métriques clées</h2>
              <p>Complétion , charge, taux de réajustement, retards, répartition des tags et plein d’autres...</p>
            </section>

            <section className="statsText statsExplanations">
              <h2>Explications</h2>
              <p>Chaque métrique est accompagné d’explications simples afin de facilité leur interprétation.</p>
            </section>

            <section className="statsText statsAdvice">
              <h2>Conseils</h2>
              <p>Dun a pour objectif de t’aider et te donnera plusieurs pistes d’amélioration en se basant sur tes résultats.</p>
            </section>

            <img className="statsGraphCard" src={graphImage} alt="Graphique de statistiques Dun" />
          </div>
        </section>
      </main>
    );
  }

  if (currentScreenId === 6) {
    return (
      <main className="pageShell designPageShell">
        {desktopNav}
        <section className="stage restStage" aria-labelledby="rest-title">
          <button
            className={`menuBackButton${stateSixContentClassName}`}
            onClick={() => goToScreen(2)}
            aria-label="Retour aux parcours"
          >
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
              <path d="M15 5 8 12l7 7" />
            </svg>
          </button>

          <div className={`restContent${stateSixContentClassName}`}>
            <header className="restHeader">
              <h1 className="restTitle" id="rest-title">
                Repos
              </h1>
              <p className="restSubtitle">Les journées off ont leur place</p>
            </header>

            <div className="restCharacterWrap" aria-hidden="true">
              <img className="restCharacter" src={restCharacterImage} alt="" />
              <img className="restShadow" src={characterShadow} alt="" />
            </div>

            <section className="restCard restCardSmall">
              <p>
                Le mode repos met la journée <strong>entre parenthèses</strong>, <strong>reporte</strong> ce qui doit l’être,
                et rappelle qu’avancer demande aussi de <strong>respirer</strong>.
              </p>
            </section>

            <section className="restCard restCardLarge">
              <div className="restMoon" aria-hidden="true" />
              <p>
                Le repos <strong>fait partie du rythme.</strong>
              </p>
              <p>
                Dun n’est pas là pour te pousser à cocher des cases coûte que coûte. Certaines
                journées servent à <strong>récupérer</strong>, à <strong>ralentir</strong>, ou simplement à <strong>ne rien porter de plus</strong>.
              </p>
              <p>
                Le mode repos existe pour que tu puisses faire une pause <strong>sans culpabilité</strong>,
                sans casser ton suivi, et revenir quand tu es prêt.
              </p>
            </section>
          </div>
        </section>
      </main>
    );
  }

  if (currentScreenId === 7) {
    return (
      <main className="pageShell">
        {desktopNav}
        <section className="stage betaStage" aria-labelledby="beta-title">
          <button
            className={`menuBackButton${stateSevenContentClassName}`}
            onClick={() => goToScreen(2)}
            aria-label="Retour aux parcours"
          >
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
              <path d="M15 5 8 12l7 7" />
            </svg>
          </button>

          <div className={`betaContent${stateSevenContentClassName}`}>
            <div className="betaCharacterWrap" aria-hidden="true">
              <img className="betaCharacter" src={betaCharacterImage} alt="" />
              <img className="betaShadow" src={characterShadow} alt="" />
            </div>

            <header className="betaHeader">
              <h1 className="betaTitle" id="beta-title">
                Prends le
                <br />
                contrôle de
                <br />
                tes journées
              </h1>
              <p className="betaSubtitle">
                Dun arrive avec une idée simple :
                <br />
                faire moins de bruit, et t’aider à mieux avancer.
              </p>
            </header>

            <form className="betaForm" onSubmit={handleBetaSubmit} noValidate>
              <input
                className="betaInput"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="ton@email.com"
                value={betaEmail}
                onChange={(event) => setBetaEmail(event.target.value)}
                disabled={isBetaSubmitting}
                aria-label="Adresse email"
              />
              <button className="betaSubmitButton" type="submit" disabled={isBetaSubmitting}>
                {isBetaSubmitting ? 'Envoi...' : 'Me prévenir'}
              </button>
              <div className="turnstileWidget" ref={turnstileContainerRef} aria-hidden="true" />
            </form>
          </div>

          {betaToast && (
            <div className={`betaToast betaToast${betaToast.type === 'success' ? 'Success' : 'Error'}`} role="status">
              {betaToast.message}
            </div>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="pageShell">
      {desktopNav}
      <section className="stage" aria-labelledby="screen-title">
        <div className="screen" key={currentScreen.id}>
          <p className="eyebrow">{currentScreen.eyebrow}</p>
          <h1 id="screen-title">{currentScreen.title}</h1>
          <p className="screenBody">{currentScreen.body}</p>
          <div className="actions">{navigation}</div>
        </div>
      </section>
    </main>
  );
}

type DesktopNavProps = {
  currentScreenId: ScreenId;
  goToScreen: (screenId: ScreenId) => void;
};

function DesktopNav({ currentScreenId, goToScreen }: DesktopNavProps) {
  const backTarget = currentScreenId === 2 ? 1 : 2;
  const [isInfoMenuOpen, setIsInfoMenuOpen] = useState(false);
  const infoMenuRef = useRef<HTMLDetailsElement | null>(null);

  useEffect(() => {
    if (!isInfoMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!infoMenuRef.current?.contains(event.target as Node)) {
        setIsInfoMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isInfoMenuOpen]);

  const goToInfoScreen = (screenId: ScreenId) => {
    setIsInfoMenuOpen(false);
    goToScreen(screenId);
  };

  return (
    <nav className="desktopNav" aria-label="Navigation principale">
      <div className="desktopNavLeft">
        {currentScreenId !== 1 && (
          <button className="desktopNavBack" type="button" onClick={() => goToScreen(backTarget)} aria-label="Retour">
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
              <path d="M15 5 8 12l7 7" />
            </svg>
          </button>
        )}
      </div>

      <div className="desktopNavCenter">
        <button className="desktopNavLink" type="button" onClick={() => goToScreen(1)}>
          Accueil
        </button>
        <details
          className="desktopNavMenu"
          open={isInfoMenuOpen}
          onToggle={(event) => setIsInfoMenuOpen(event.currentTarget.open)}
          ref={infoMenuRef}
        >
          <summary>Informations</summary>
          <div className="desktopNavMenuPanel">
            <button type="button" onClick={() => goToInfoScreen(3)}>
              Rituel
            </button>
            <button type="button" onClick={() => goToInfoScreen(4)}>
              Design
            </button>
            <button type="button" onClick={() => goToInfoScreen(5)}>
              Statistiques
            </button>
            <button type="button" onClick={() => goToInfoScreen(6)}>
              Repos
            </button>
          </div>
        </details>
      </div>

      <div className="desktopNavRight">
        <a className="desktopNavLink" href="/support">
          Support
        </a>
        <button className="desktopNavCta" type="button" onClick={() => goToScreen(7)}>
          Rejoindre la beta
        </button>
      </div>
    </nav>
  );
}

export default App;
