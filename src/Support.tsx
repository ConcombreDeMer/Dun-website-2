import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { getSupportIssueById, supportIssues as mockSupportIssues, type SupportComment } from './supportMocks';

const useMock = false;

type SupportSortMode = 'recent' | 'popular';

type SupportIssueListItem = {
  id: string;
  slug: string;
  title: string;
  likes: number;
  createdAt: string;
  hasCurrentUserVote: boolean;
};

type SupportIssueDetail = {
  id: string;
  slug: string;
  title: string;
  description: string;
  publishedAgo: string;
  authorName: string;
  likes: number;
  hasCurrentUserVote: boolean;
  comments: SupportComment[];
};

type SupportIssueRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  author_id: string;
  created_at: string;
  author_name: string | null;
  likes_count: number | null;
  comments_count: number | null;
};

type SupportCommentRow = {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
};

type ProfileRow = {
  id: string;
  name: string | null;
  email: string | null;
};

type SupportProfile = {
  id: string;
  email: string;
  name: string;
};

function useSupportDocumentScroll() {
  useEffect(() => {
    document.documentElement.classList.add('designDocumentScroll');
    document.body.classList.add('designDocumentScroll');

    return () => {
      document.documentElement.classList.remove('designDocumentScroll');
      document.body.classList.remove('designDocumentScroll');
    };
  }, []);
}

function formatRelativeDate(dateValue: string) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const diffInSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const ranges: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
  ];
  const formatter = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });

  for (const [unit, secondsInUnit] of ranges) {
    if (Math.abs(diffInSeconds) >= secondsInUnit || unit === 'minute') {
      return formatter.format(Math.round(diffInSeconds / secondsInUnit), unit);
    }
  }

  return "à l'instant";
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function mockListItems(): SupportIssueListItem[] {
  return mockSupportIssues.map((issue, index) => ({
    id: issue.id,
    slug: issue.id,
    title: issue.title,
    likes: issue.likes,
    createdAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
    hasCurrentUserVote: false,
  }));
}

function mockIssueDetail(issueId: string): SupportIssueDetail | null {
  const issue = getSupportIssueById(issueId);

  if (!issue) {
    return null;
  }

  return {
    id: issue.id,
    slug: issue.id,
    title: issue.title,
    description: issue.description,
    publishedAgo: issue.publishedAgo,
    authorName: issue.authorName,
    likes: issue.likes,
    hasCurrentUserVote: false,
    comments: issue.comments,
  };
}

function createProfileName(profile?: ProfileRow) {
  return profile?.name || profile?.email?.split('@')[0] || 'Utilisateur';
}

async function getCurrentUserId() {
  if (!supabase) {
    return null;
  }

  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

async function loadCurrentUserProfile(): Promise<SupportProfile | null> {
  if (!supabase) {
    return null;
  }

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase.from('Profiles').select('id, name, email').eq('id', user.id).maybeSingle();

  return {
    id: user.id,
    email: user.email ?? '',
    name: createProfileName(profile as ProfileRow | undefined),
  };
}

export function SupportPage() {
  useSupportDocumentScroll();

  const [issues, setIssues] = useState<SupportIssueListItem[]>(useMock ? mockListItems() : []);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SupportSortMode>('recent');
  const [isLoading, setIsLoading] = useState(!useMock && isSupabaseConfigured);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isCancelled = false;

    async function loadIssues() {
      if (useMock) {
        setIssues(mockListItems());
        setIsLoading(false);
        return;
      }

      if (!supabase) {
        setErrorMessage("La connexion Supabase n'est pas configurée.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      const currentUserId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('support_issues_with_counts')
        .select('id, slug, title, description, author_id, created_at, author_name, likes_count, comments_count')
        .order('created_at', { ascending: false });

      if (isCancelled) {
        return;
      }

      if (error) {
        setErrorMessage("Les demandes n'ont pas pu être chargées.");
        setIsLoading(false);
        return;
      }

      const rows = (data ?? []) as SupportIssueRow[];
      let votedIssueIds = new Set<string>();

      if (currentUserId && rows.length > 0) {
        const { data: votes } = await supabase
          .from('support_issue_votes')
          .select('issue_id')
          .eq('user_id', currentUserId)
          .in(
            'issue_id',
            rows.map((issue) => issue.id),
          );

        votedIssueIds = new Set((votes ?? []).map((vote) => vote.issue_id as string));
      }

      setIssues(
        rows.map((issue) => ({
          id: issue.id,
          slug: issue.slug,
          title: issue.title,
          likes: issue.likes_count ?? 0,
          createdAt: issue.created_at,
          hasCurrentUserVote: votedIssueIds.has(issue.id),
        })),
      );
      setIsLoading(false);
    }

    loadIssues();

    return () => {
      isCancelled = true;
    };
  }, []);

  const filteredAndSortedIssues = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const visibleIssues = normalizedQuery
      ? issues.filter((issue) => issue.title.toLowerCase().includes(normalizedQuery))
      : issues;

    return [...visibleIssues].sort((firstIssue, secondIssue) => {
      if (sortMode === 'popular') {
        return secondIssue.likes - firstIssue.likes;
      }

      return new Date(secondIssue.createdAt).getTime() - new Date(firstIssue.createdAt).getTime();
    });
  }, [issues, searchQuery, sortMode]);

  const toggleVote = async (issue: SupportIssueListItem) => {
    if (useMock || !supabase) {
      return;
    }

    const currentUserId = await getCurrentUserId();

    if (!currentUserId) {
      window.location.href = '/login';
      return;
    }

    setIssues((currentIssues) =>
      currentIssues.map((currentIssue) =>
        currentIssue.id === issue.id
          ? {
              ...currentIssue,
              likes: currentIssue.likes + (currentIssue.hasCurrentUserVote ? -1 : 1),
              hasCurrentUserVote: !currentIssue.hasCurrentUserVote,
            }
          : currentIssue,
      ),
    );

    if (issue.hasCurrentUserVote) {
      await supabase.from('support_issue_votes').delete().eq('issue_id', issue.id).eq('user_id', currentUserId);
      return;
    }

    await supabase.from('support_issue_votes').insert({ issue_id: issue.id, user_id: currentUserId });
  };

  return (
    <main className="supportShell">
      <section className="supportStage" aria-labelledby="support-title">
        <SupportHeader titleId="support-title" />

        <div className="supportSearchRow">
          <label className="supportSearch" aria-label="Rechercher une demande">
            <input
              type="search"
              placeholder="Rechercher une demande"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
              <circle cx="10.8" cy="10.8" r="6.6" />
              <path d="m16 16 5 5" />
            </svg>
          </label>
          <a className="supportCreateButton" href="/support/create" aria-label="Créer une demande">
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </a>
        </div>

        <div className="supportSortControl" aria-label="Trier les demandes">
          <button
            className={sortMode === 'recent' ? 'supportSortButton supportSortButtonActive' : 'supportSortButton'}
            type="button"
            onClick={() => setSortMode('recent')}
          >
            Récentes
          </button>
          <button
            className={sortMode === 'popular' ? 'supportSortButton supportSortButtonActive' : 'supportSortButton'}
            type="button"
            onClick={() => setSortMode('popular')}
          >
            Populaires
          </button>
        </div>

        {errorMessage && <p className="supportNotice">{errorMessage}</p>}
        {isLoading && <p className="supportNotice">Chargement des demandes...</p>}

        <div className="supportIssueList" aria-label="Demandes populaires">
          {filteredAndSortedIssues.map((issue) => (
            <article className="supportIssue" key={issue.id}>
              <a className="supportIssueLink" href={`/support/${issue.slug || issue.id}`}>
                <span className="supportIssueTitle">{issue.title}</span>
              </a>
              <button
                className={`supportLikeButton${issue.hasCurrentUserVote ? ' supportLikeButtonActive' : ''}`}
                type="button"
                aria-label={`${issue.likes} likes`}
                onClick={() => toggleVote(issue)}
              >
                <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                  <path d="M12 21S4.2 16.45 4.2 9.8A4.35 4.35 0 0 1 12 7.15 4.35 4.35 0 0 1 19.8 9.8C19.8 16.45 12 21 12 21Z" />
                </svg>
                <span>{issue.likes}</span>
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export function LoginPage() {
  useSupportDocumentScroll();

  const [profile, setProfile] = useState<SupportProfile | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(!useMock && isSupabaseConfigured);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function loadProfile() {
      const currentProfile = await loadCurrentUserProfile();

      if (isCancelled) {
        return;
      }

      setProfile(currentProfile);
      setIsLoadingProfile(false);
    }

    loadProfile();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabase) {
      setMessage("La connexion Supabase n'est pas configurée.");
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setIsSubmitting(false);

    if (error) {
      setMessage("La connexion a échoué.");
      return;
    }

    window.location.href = '/support';
  };

  const handleSignOut = async () => {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    setProfile(null);
    setMessage('Tu es déconnecté.');
  };

  if (isLoadingProfile) {
    return (
      <main className="supportShell">
        <section className="supportStage supportFormStage" aria-labelledby="profile-loading-title">
          <BackToSupportLink />
          <header className="supportFormHeader">
            <h1 className="supportTitle" id="profile-loading-title">
              Profil
            </h1>
            <p className="supportSubtitle">Chargement du profil...</p>
          </header>
        </section>
      </main>
    );
  }

  if (profile) {
    return (
      <main className="supportShell">
        <section className="supportStage supportFormStage" aria-labelledby="profile-title">
          <BackToSupportLink />
          <header className="supportFormHeader">
            <h1 className="supportTitle" id="profile-title">
              Profil
            </h1>
            <p className="supportSubtitle">Tu es connecté</p>
          </header>
          <div className="supportProfileSummary">
            <p className="supportProfileName">{profile.name}</p>
            <p className="supportProfileEmail">{profile.email}</p>
          </div>
          <button className="supportSubmitButton" type="button" onClick={handleSignOut}>
            Se déconnecter
          </button>
          {message && <p className="supportNotice">{message}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="supportShell">
      <section className="supportStage supportFormStage" aria-labelledby="login-title">
        <BackToSupportLink />
        <header className="supportFormHeader">
          <h1 className="supportTitle" id="login-title">
            Connexion
          </h1>
          <p className="supportSubtitle">Accède à ton espace support</p>
        </header>
        <form className="supportForm" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              placeholder="ton@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Mot de passe
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <button className="supportSubmitButton" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Connexion...' : 'Se connecter'}
          </button>
          {message && <p className="supportNotice">{message}</p>}
        </form>
      </section>
    </main>
  );
}

export function CreateIssuePage() {
  useSupportDocumentScroll();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabase) {
      setMessage("La connexion Supabase n'est pas configurée.");
      return;
    }

    const currentUserId = await getCurrentUserId();

    if (!currentUserId) {
      window.location.href = '/login';
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle || !trimmedDescription) {
      setMessage('Ajoute un titre et une description.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    const slug = `${slugify(trimmedTitle) || 'demande'}-${Date.now().toString(36)}`;
    const { data, error } = await supabase
      .from('support_issues')
      .insert({
        title: trimmedTitle,
        description: trimmedDescription,
        slug,
        author_id: currentUserId,
      })
      .select('slug')
      .single();

    setIsSubmitting(false);

    if (error) {
      setMessage("La demande n'a pas pu être créée.");
      return;
    }

    window.location.href = `/support/${data.slug}`;
  };

  return (
    <main className="supportShell">
      <section className="supportStage supportFormStage" aria-labelledby="create-issue-title">
        <BackToSupportLink />
        <header className="supportFormHeader">
          <h1 className="supportTitle" id="create-issue-title">
            Nouvelle demande
          </h1>
          <p className="supportSubtitle">Décris ce que tu aimerais voir évoluer</p>
        </header>
        <form className="supportForm" onSubmit={handleSubmit}>
          <label>
            Titre
            <input
              type="text"
              placeholder="Titre de la demande"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </label>
          <label>
            Description
            <textarea
              placeholder="Ajoute quelques détails"
              rows={6}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
            />
          </label>
          <button className="supportSubmitButton" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Création...' : 'Créer la demande'}
          </button>
          {message && <p className="supportNotice">{message}</p>}
        </form>
      </section>
    </main>
  );
}

type IssueDetailPageProps = {
  issueId: string;
};

export function IssueDetailPage({ issueId }: IssueDetailPageProps) {
  useSupportDocumentScroll();

  const [issue, setIssue] = useState<SupportIssueDetail | null>(useMock ? mockIssueDetail(issueId) : null);
  const [commentBody, setCommentBody] = useState('');
  const [isCommentFormVisible, setIsCommentFormVisible] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(!useMock && isSupabaseConfigured);
  const [hasFinishedInitialLoad, setHasFinishedInitialLoad] = useState(useMock || !isSupabaseConfigured);

  const loadIssue = async () => {
    if (useMock) {
      setIssue(mockIssueDetail(issueId));
      setIsLoading(false);
      setHasFinishedInitialLoad(true);
      return;
    }

    if (!supabase) {
      setIssue(null);
      setIsLoading(false);
      setHasFinishedInitialLoad(true);
      return;
    }

    setIsLoading(true);

    const currentUserId = await getCurrentUserId();
    const issueQuery = supabase
      .from('support_issues_with_counts')
      .select('id, slug, title, description, author_id, created_at, author_name, likes_count, comments_count');
    const { data: issueData, error: issueError } = await (isUuid(issueId)
      ? issueQuery.or(`slug.eq.${issueId},id.eq.${issueId}`)
      : issueQuery.eq('slug', issueId)
    ).maybeSingle();

    if (issueError || !issueData) {
      setIssue(null);
      setIsLoading(false);
      setHasFinishedInitialLoad(true);
      return;
    }

    const issueRow = issueData as SupportIssueRow;
    const { data: commentRows } = await supabase
      .from('support_issue_comments')
      .select('id, author_id, body, created_at')
      .eq('issue_id', issueRow.id)
      .order('created_at', { ascending: true });

    const comments = (commentRows ?? []) as SupportCommentRow[];
    const authorIds = Array.from(new Set(comments.map((comment) => comment.author_id)));
    let profilesById = new Map<string, ProfileRow>();

    if (authorIds.length > 0) {
      const { data: profileRows } = await supabase.from('Profiles').select('id, name, email').in('id', authorIds);

      profilesById = new Map(((profileRows ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]));
    }

    let hasCurrentUserVote = false;

    if (currentUserId) {
      const { data: vote } = await supabase
        .from('support_issue_votes')
        .select('issue_id')
        .eq('issue_id', issueRow.id)
        .eq('user_id', currentUserId)
        .maybeSingle();

      hasCurrentUserVote = Boolean(vote);
    }

    setIssue({
      id: issueRow.id,
      slug: issueRow.slug,
      title: issueRow.title,
      description: issueRow.description,
      publishedAgo: formatRelativeDate(issueRow.created_at),
      authorName: issueRow.author_name || 'Utilisateur',
      likes: issueRow.likes_count ?? 0,
      hasCurrentUserVote,
      comments: comments.map((comment) => ({
        id: comment.id,
        authorName: createProfileName(profilesById.get(comment.author_id)),
        publishedAgo: formatRelativeDate(comment.created_at),
        body: comment.body,
      })),
    });
    setIsLoading(false);
    setHasFinishedInitialLoad(true);
  };

  useEffect(() => {
    loadIssue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issueId]);

  const toggleIssueVote = async () => {
    if (useMock || !supabase || !issue) {
      return;
    }

    const currentUserId = await getCurrentUserId();

    if (!currentUserId) {
      window.location.href = '/login';
      return;
    }

    setIssue({
      ...issue,
      likes: issue.likes + (issue.hasCurrentUserVote ? -1 : 1),
      hasCurrentUserVote: !issue.hasCurrentUserVote,
    });

    if (issue.hasCurrentUserVote) {
      await supabase.from('support_issue_votes').delete().eq('issue_id', issue.id).eq('user_id', currentUserId);
      return;
    }

    await supabase.from('support_issue_votes').insert({ issue_id: issue.id, user_id: currentUserId });
  };

  const handleCommentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (useMock || !supabase || !issue) {
      return;
    }

    const currentUserId = await getCurrentUserId();

    if (!currentUserId) {
      window.location.href = '/login';
      return;
    }

    const trimmedBody = commentBody.trim();

    if (!trimmedBody) {
      return;
    }

    setIsSubmittingComment(true);
    setMessage('');

    const { error } = await supabase.from('support_issue_comments').insert({
      issue_id: issue.id,
      author_id: currentUserId,
      body: trimmedBody,
    });

    setIsSubmittingComment(false);

    if (error) {
      setMessage("Le commentaire n'a pas pu être ajouté.");
      return;
    }

    setCommentBody('');
    setIsCommentFormVisible(false);
    await loadIssue();
  };

  if (!issue && !hasFinishedInitialLoad) {
    return (
      <main className="supportShell">
        <section className="supportStage supportFormStage" aria-labelledby="issue-loading-title">
          <BackToSupportLink />
          <header className="supportFormHeader">
            <h1 className="supportTitle" id="issue-loading-title">
              Chargement
            </h1>
            <p className="supportSubtitle">La demande arrive...</p>
          </header>
        </section>
      </main>
    );
  }

  if (!issue) {
    return (
      <main className="supportShell">
        <section className="supportStage supportFormStage" aria-labelledby="issue-not-found-title">
          <BackToSupportLink />
          <header className="supportFormHeader">
            <h1 className="supportTitle" id="issue-not-found-title">
              Demande introuvable
            </h1>
            <p className="supportSubtitle">Cette demande n'existe pas encore.</p>
          </header>
        </section>
      </main>
    );
  }

  return (
    <main className="supportShell">
      <section className="supportStage supportDetailStage" aria-labelledby="issue-detail-title">
        <a className="supportDetailBackButton" href="/support" aria-label="Retour aux demandes">
          <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path d="M15 5 8 12l7 7" />
          </svg>
        </a>

        <SupportHeader />

        <article className="supportDetailCard">
          <div className="supportDetailTop">
            <h2 className="supportDetailTitle" id="issue-detail-title">
              {issue.title}
            </h2>
            <button
              className={`supportLikeButton supportDetailLikeButton${
                issue.hasCurrentUserVote ? ' supportLikeButtonActive' : ''
              }`}
              type="button"
              aria-label={`${issue.likes} likes`}
              onClick={toggleIssueVote}
            >
              <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                <path d="M12 21S4.2 16.45 4.2 9.8A4.35 4.35 0 0 1 12 7.15 4.35 4.35 0 0 1 19.8 9.8C19.8 16.45 12 21 12 21Z" />
              </svg>
              <span>{issue.likes}</span>
            </button>
          </div>

          <p className="supportDetailDescription">{issue.description}</p>

          <div className="supportDetailMeta">
            <span>{issue.publishedAgo}</span>
            <span>par {issue.authorName}</span>
          </div>

          <div className="supportDetailSeparator" />

          <div className="supportCommentList" aria-label="Commentaires">
            {issue.comments.map((comment) => (
              <article className="supportComment" key={comment.id}>
                <header className="supportCommentHeader">
                  <div className="supportCommentAuthor">
                    <span className="supportCommentAvatar" aria-hidden="true">
                      <svg viewBox="0 0 24 24" focusable="false">
                        <path d="M12 12.5c1.35 0 2.45-1.1 2.45-2.45S13.35 7.6 12 7.6 9.55 8.7 9.55 10.05s1.1 2.45 2.45 2.45Z" />
                        <path d="M7.8 17.7c.35-2.15 2.02-3.52 4.2-3.52s3.85 1.37 4.2 3.52H7.8Z" />
                      </svg>
                    </span>
                    <span>{comment.authorName}</span>
                  </div>
                  <span className="supportCommentDate">{comment.publishedAgo}</span>
                </header>
                <p>{comment.body}</p>
              </article>
            ))}
          </div>
        </article>

        {isCommentFormVisible && (
          <form className="supportInlineCommentForm" onSubmit={handleCommentSubmit}>
            <textarea
              placeholder="Ton commentaire"
              rows={4}
              value={commentBody}
              onChange={(event) => setCommentBody(event.target.value)}
              required
            />
            <button className="supportSubmitButton" type="submit" disabled={isSubmittingComment}>
              {isSubmittingComment ? 'Ajout...' : 'Publier'}
            </button>
          </form>
        )}

        <button className="supportCommentButton" type="button" onClick={() => setIsCommentFormVisible(true)}>
          Ajouter un commentaire
        </button>
        {message && <p className="supportNotice">{message}</p>}
      </section>
    </main>
  );
}

type SupportHeaderProps = {
  titleId?: string;
};

function SupportHeader({ titleId }: SupportHeaderProps) {
  const [profile, setProfile] = useState<SupportProfile | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadProfile() {
      const currentProfile = await loadCurrentUserProfile();

      if (!isCancelled) {
        setProfile(currentProfile);
      }
    }

    loadProfile();

    const { data: subscription } =
      supabase?.auth.onAuthStateChange(() => {
        loadProfile();
      }) ?? {};

    return () => {
      isCancelled = true;
      subscription?.subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="supportHeader">
      <div>
        <h1 className="supportTitle" id={titleId}>
          Support
        </h1>
        <p className="supportSubtitle">Fais remonter tes demandes</p>
      </div>
      <a
        className={`supportLoginButton${profile ? ' supportLoginButtonConnected' : ''}`}
        href="/login"
        aria-label={profile ? 'Profil connecté' : 'Connexion'}
      >
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
          <path d="M12 12.5c2 0 3.6-1.6 3.6-3.6S14 5.3 12 5.3 8.4 6.9 8.4 8.9s1.6 3.6 3.6 3.6Z" />
          <path d="M5.5 20c.45-3.25 3.1-5.35 6.5-5.35s6.05 2.1 6.5 5.35H5.5Z" />
        </svg>
      </a>
    </header>
  );
}

function BackToSupportLink() {
  return (
    <a className="supportBackLink" href="/support" aria-label="Retour au support">
      <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
        <path d="M15 5 8 12l7 7" />
      </svg>
    </a>
  );
}
