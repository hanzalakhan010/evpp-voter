import React, { useEffect, useRef, useState } from "react";
import { host } from "../constants";
import { notifyError, notifySuccess } from "../notification";
import { socket } from "../socket";
import Mascot from "./Mascot";
import Confetti from "./Confetti";

interface Candidate {
  id: string;
  name: string;
  slogan: string;
  image: string;
  logo: string;
  post_id: string;
}
interface VoteProps {
  setLogin: React.Dispatch<React.SetStateAction<boolean>>;
}
type Post = {
  [key: string]: Candidate[];
};
// votes shape is post_id -> candidate_id
type Vote = Record<string, string>;

type Phase = "vote" | "toast" | "confirm" | "success";

const REWARD = 25;
const ROTS = [-2.2, 1.6, -1.2, 2.0, -0.8];

/* ============== header bar ============== */
const HeaderBar: React.FC<{
  raceIdx: number;
  totalRaces: number;
  post: string;
  xp: number;
  totalXp: number;
  level: number;
  streak: number;
}> = ({ raceIdx, totalRaces, post, xp, totalXp, level, streak }) => (
  <div className="shrink-0 pl-5 lg:pl-8 pr-6 lg:pr-10 py-3 border-b-[3px] border-[var(--ink)] bg-[var(--paper-2)] flex items-center gap-4 lg:gap-6">
    <div className="flex items-center gap-3 shrink-0 mr-2">
      <Mascot size={40} />
      <div className="whitespace-nowrap">
        <div className="font-bold text-[10px] lg:text-xs uppercase tracking-wider text-gray-600 leading-none">Race {raceIdx + 1} of {totalRaces}</div>
        <div className="font-display text-2xl leading-none mt-1">{post}</div>
      </div>
    </div>
    <div className="flex-1 min-w-0 max-w-[360px] hidden md:block">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-1">
        <span>Citizen Lv. {level}</span><span>{xp}/{totalXp} XP</span>
      </div>
      <div className="rounded-full h-3 bg-white overflow-hidden" style={{ border: "2px solid var(--ink)" }}>
        <div className="h-full xp-shine prog-fill" style={{ width: `${(xp / totalXp) * 100}%` }}></div>
      </div>
    </div>
    <div className="flex items-center gap-1.5 ml-auto shrink-0">
      {Array.from({ length: totalRaces }).map((_, i) => (
        <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center font-display text-sm"
          style={{
            border: "2.5px solid var(--ink)",
            background: i < raceIdx ? "var(--accent)" : i === raceIdx ? "var(--gold)" : "white",
            color: i < raceIdx ? "#fff" : "var(--ink)",
          }}>
          {i < raceIdx ? "✓" : i + 1}
        </div>
      ))}
    </div>
    <div className="shrink-0 rounded-xl bg-white px-3 py-1.5 text-center whitespace-nowrap" style={{ border: "2px solid var(--ink)", minWidth: 64 }}>
      <div className="text-[9px] font-bold uppercase leading-none">Streak</div>
      <div className="font-display text-xl leading-none whitespace-nowrap">🔥&nbsp;{streak}</div>
    </div>
  </div>
);

/* ============== poster card ============== */
const PosterCard: React.FC<{
  candidate: Candidate;
  selected: boolean;
  onPick: () => void;
  rot: number;
}> = ({ candidate, selected, onPick, rot }) => (
  <div className={`poster-card p-3 flex flex-col ${selected ? "selected" : ""}`} style={{ transform: `rotate(${rot}deg)` }} onClick={onPick}>
    <div className="aspect-[4/5] relative">
      <div className="poster-img w-full h-full relative overflow-hidden bg-gray-100">
        <img
          src={`${host}/api/images/candidate/${candidate.id}/image`}
          alt={`${candidate.name}`}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.05) 45%, rgba(0,0,0,0.25) 100%)" }}></div>
        <div className="absolute top-2 left-2 right-2 text-center">
          <div className="font-display leading-none drop-shadow-[2px_2px_0_rgba(0,0,0,0.85)] text-white" style={{ fontSize: "clamp(28px,3.4vw,52px)", WebkitTextStroke: "1.5px #0b1220" }}>VOTE</div>
          <div className="font-display leading-none mt-1 text-white drop-shadow-[1px_1px_0_rgba(0,0,0,0.85)]" style={{ fontSize: "clamp(16px,2vw,24px)" }}>{candidate.name.split(" ")[0]}!</div>
        </div>
        <img
          src={`${host}/api/images/candidate/${candidate.id}/logo`}
          alt={`${candidate.name} logo`}
          className="absolute bottom-9 left-2 w-12 h-12 object-cover rounded-full"
          style={{ border: "2.5px solid white", boxShadow: "0 2px 6px rgba(0,0,0,0.4)" }}
        />
        <div className="absolute bottom-2 inset-x-2 text-center font-bold text-[11px] tracking-wider uppercase bg-black/80 text-white py-1 rounded truncate">
          {candidate.slogan}
        </div>
        {/* tape corners */}
        <div className="absolute -top-1 -left-1 w-6 h-3 rotate-[-25deg]" style={{ background: "rgba(251,191,36,0.7)", border: "1.5px solid #0b1220" }}></div>
        <div className="absolute -top-1 -right-1 w-6 h-3 rotate-[25deg]" style={{ background: "rgba(251,191,36,0.7)", border: "1.5px solid #0b1220" }}></div>
      </div>
      {selected && (
        <div className="absolute -top-3 -right-3 w-12 h-12 rounded-full text-white font-display text-3xl flex items-center justify-center burst"
          style={{ background: "var(--accent)", border: "3px solid var(--ink)", boxShadow: "3px 3px 0 var(--ink)" }}>
          ✓
        </div>
      )}
    </div>
    <div className="mt-3 px-1">
      <div className="font-bold text-xl leading-tight">{candidate.name}</div>
    </div>
    <button className={`mt-3 rounded-xl py-2 font-bold text-sm ${selected ? "text-white" : ""}`}
      style={{
        border: "2.5px solid var(--ink)",
        background: selected ? "var(--accent)" : "white",
      }}>
      {selected ? "✓ PICKED" : "TAP TO PICK"}
    </button>
  </div>
);

/* ============== voting screen ============== */
const VotingScreen: React.FC<{
  postTitle: string;
  candidates: Candidate[];
  raceIdx: number;
  totalRaces: number;
  xp: number;
  totalXp: number;
  level: number;
  streak: number;
  picked: string | undefined;
  onPick: (cid: string) => void;
  onNext: () => void;
  onPrev: () => void;
  isLast: boolean;
}> = ({ postTitle, candidates, raceIdx, totalRaces, xp, totalXp, level, streak, picked, onPick, onNext, onPrev, isLast }) => {
  const pickedCandidate = candidates.find((c) => c.id === picked);
  const gridCls =
    candidates.length <= 2 ? "grid-cols-1 sm:grid-cols-2 max-w-[700px]" :
      candidates.length === 3 ? "grid-cols-1 sm:grid-cols-3 max-w-[980px]" :
        "grid-cols-2 sm:grid-cols-4 max-w-[1180px]";
  return (
    <div className="screen fade-in grid-paper">
      <HeaderBar raceIdx={raceIdx} totalRaces={totalRaces} post={postTitle} xp={xp} totalXp={totalXp} level={level} streak={streak} />
      <div className="flex-1 min-h-0 px-6 lg:px-10 py-5 overflow-y-auto">
        <div className="text-center mb-4">
          <div className="font-display text-4xl lg:text-5xl leading-none">Pick your champion</div>
          <div className="font-hand text-sm lg:text-base text-gray-600 mt-1">Tap a poster · you can change your mind before submitting</div>
        </div>
        <div className={`grid gap-4 lg:gap-5 mx-auto ${gridCls}`}>
          {candidates.map((c, i) => (
            <PosterCard key={c.id} candidate={c} selected={picked === c.id} onPick={() => onPick(c.id)} rot={ROTS[i % ROTS.length]} />
          ))}
        </div>
      </div>
      <div className="shrink-0 px-6 lg:px-10 py-3 border-t-[3px] border-[var(--ink)] bg-[var(--paper-2)] flex items-center justify-between gap-3">
        <button onClick={onPrev} disabled={raceIdx === 0}
          className="btn-pop rounded-xl px-5 py-2.5 font-bold bg-white disabled:opacity-40 disabled:cursor-not-allowed">
          ← Previous race
        </button>
        <div className="font-bold text-sm hidden sm:block text-center">
          {picked ? <>Picked: <span className="font-display text-xl">{pickedCandidate?.name}</span></> : <span className="text-gray-500">Pick someone to continue</span>}
        </div>
        <button onClick={onNext} disabled={!picked}
          className="btn-pop rounded-xl px-8 py-3 font-display text-3xl text-white disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "var(--accent)" }}>
          {isLast ? "REVIEW BALLOT →" : "NEXT RACE →"}
        </button>
      </div>
    </div>
  );
};

/* ============== progress toast ============== */
const ProgressToast: React.FC<{
  postTitle: string;
  nextTitle: string | undefined;
  nextCandidates: Candidate[];
  reward: number;
  onDone: () => void;
  autoMs?: number;
}> = ({ postTitle, nextTitle, nextCandidates, reward, onDone, autoMs = 2000 }) => {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => {
      const e = Date.now() - start;
      const p = Math.min(1, e / autoMs);
      setPct(p);
      if (p >= 1) { clearInterval(t); onDone(); }
    }, 30);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="screen fade-in relative grid-paper">
      {/* faded next-race preview behind */}
      <div className="absolute inset-0 opacity-25 pointer-events-none overflow-hidden">
        <div className="px-10 py-8 grid grid-cols-3 gap-5 max-w-[1000px] mx-auto mt-20">
          {nextCandidates.slice(0, 3).map((c, i) => (
            <div key={i} className="poster-card p-3" style={{ transform: `rotate(${i % 2 ? 1 : -1}deg)` }}>
              <div className="poster-img aspect-[4/5] bg-gray-200"></div>
              <div className="mt-2 font-bold text-lg">{c.name}</div>
            </div>
          ))}
        </div>
      </div>
      {/* toast */}
      <div className="absolute inset-0 flex items-center justify-center px-6">
        <div className="pop-in flex items-center gap-5 px-8 lg:px-10 py-7 rounded-3xl bg-white relative max-w-full"
          style={{ border: "3px solid var(--ink)", boxShadow: "10px 10px 0 var(--ink)", transform: "rotate(-0.5deg)" }}>
          <div className="absolute -top-4 -right-4 sticker" style={{ background: "var(--gold)", fontSize: 14, padding: "4px 12px" }}>+{reward} XP</div>
          <div className="w-20 h-20 rounded-full flex items-center justify-center font-display text-5xl text-white burst shrink-0"
            style={{ background: "var(--accent)", border: "3px solid var(--ink)", boxShadow: "4px 4px 0 var(--ink)" }}>✓</div>
          <div className="min-w-0">
            <div className="font-display text-4xl lg:text-5xl leading-none">{postTitle.toLowerCase()} done!</div>
            <div className="font-hand text-base lg:text-lg text-gray-600 mt-1">
              {nextTitle ? <>Next up: <b>{nextTitle.toLowerCase()}</b></> : <b>Last step: review your ballot</b>}
            </div>
          </div>
          <div className="hidden sm:block shrink-0"><Mascot size={72} waving mood="cheer" /></div>
        </div>
      </div>
      {/* timer bar */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-[var(--paper-2)]">
        <div className="h-full xp-shine" style={{ width: `${pct * 100}%` }}></div>
      </div>
      <div className="absolute bottom-4 right-6 font-hand text-sm text-gray-700 flex items-center gap-3">
        <span>auto-advancing…</span>
        <button onClick={onDone} className="btn-pop bg-white rounded-lg px-4 py-1.5 text-xs font-bold uppercase">
          Skip →
        </button>
      </div>
    </div>
  );
};

/* ============== confirm: hold-to-cast ============== */
const ConfirmScreen: React.FC<{
  postTitles: string[];
  posts: Post;
  votes: Vote;
  isVoting: boolean;
  onCast: () => void;
  onEdit: () => void;
}> = ({ postTitles, posts, votes, isVoting, onCast, onEdit }) => {
  const [progress, setProgress] = useState(0);
  const [casting, setCasting] = useState(false);
  const holdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const HOLD_MS = 1800;

  const start = () => {
    if (casting || isVoting) return;
    const t0 = Date.now();
    holdRef.current = setInterval(() => {
      const e = Date.now() - t0;
      const p = Math.min(1, e / HOLD_MS);
      setProgress(p);
      if (p >= 1) {
        if (holdRef.current) clearInterval(holdRef.current);
        setCasting(true);
        setTimeout(onCast, 350);
      }
    }, 30);
  };
  const stop = () => {
    if (casting || isVoting) return;
    if (holdRef.current) clearInterval(holdRef.current);
    setProgress(0);
  };
  useEffect(() => () => { if (holdRef.current) clearInterval(holdRef.current); }, []);

  const dash = 2 * Math.PI * 44;
  return (
    <div className="screen fade-in grid grid-cols-1 md:grid-cols-[1fr_1.1fr] grid-paper min-h-0">
      <div className="p-6 lg:p-10 flex flex-col justify-center min-h-0 overflow-y-auto">
        <div className="font-bold text-xs uppercase tracking-widest text-gray-600">Final step</div>
        <h2 className="font-display leading-none mt-1 text-left" style={{ fontSize: "clamp(40px,5.5vw,72px)" }}>Almost there!</h2>
        <p className="font-hand text-base lg:text-lg text-gray-700 mt-3 max-w-md">Press &amp; hold the big button to cast. Lift early to cancel — once cast, your picks are final.</p>

        <div className="mt-5 rounded-2xl p-4 bg-white max-w-md" style={{ border: "3px solid var(--ink)", boxShadow: "6px 6px 0 var(--ink)" }}>
          <div className="font-bold text-xs uppercase tracking-wider text-gray-600 mb-2">Your ballot</div>
          <div className="space-y-2 text-base">
            {postTitles.map((title) => {
              const candidates = posts[title] || [];
              const postId = candidates[0]?.post_id;
              const c = candidates.find((cc) => cc.id === votes[postId]);
              return (
                <div key={title} className="flex justify-between items-baseline gap-3 border-b border-dashed border-black/30 pb-2 last:border-0 last:pb-0">
                  <span className="shrink-0 font-bold text-[10px] uppercase tracking-wider text-gray-600">{title}</span>
                  <span className="font-display text-lg text-right whitespace-nowrap">{c?.name || "—"}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <button onClick={onEdit} className="btn-pop bg-white rounded-xl px-4 py-2 font-bold text-sm">← Edit picks</button>
          <span className="font-hand text-sm text-gray-600">+{REWARD} XP &amp; "I Voted" badge unlock on submit</span>
        </div>
      </div>

      <div className="relative flex items-center justify-center hatch-blue overflow-hidden min-h-0" style={{ background: "linear-gradient(135deg, #1d4ed8, #2563eb)", minHeight: 280 }}>
        <div className="relative select-none" style={{ width: "min(340px, 70vmin)", height: "min(340px, 70vmin)" }}
          onMouseDown={start} onMouseUp={stop} onMouseLeave={stop}
          onTouchStart={start} onTouchEnd={stop}>
          <div className="absolute inset-0 rounded-full bg-white" style={{ border: "4px solid var(--ink)", boxShadow: "6px 6px 0 var(--ink)" }}></div>
          <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
            <circle cx="50" cy="50" r="44" stroke="rgba(11,18,32,0.15)" strokeWidth="6" fill="none" />
            <circle className="hold-ring" cx="50" cy="50" r="44" stroke="var(--gold)" strokeWidth="6" fill="none"
              strokeDasharray={dash} strokeDashoffset={dash * (1 - progress)} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-10 rounded-full flex flex-col items-center justify-center text-white text-center cursor-pointer"
            style={{ background: casting ? "#10b981" : "var(--accent)", border: "4px solid var(--ink)", boxShadow: "4px 4px 0 var(--ink)", transition: "background .25s ease" }}>
            <div className="font-display leading-none whitespace-nowrap" style={{ fontSize: "clamp(32px,6.5vmin,52px)" }}>{casting ? "CAST!" : "HOLD"}</div>
            {!casting && <div className="font-display leading-none mt-1 whitespace-nowrap" style={{ fontSize: "clamp(12px,2.4vmin,18px)" }}>to cast</div>}
            <div className="font-hand text-sm mt-1.5 opacity-80">{casting ? "🎉" : `${(progress * 100).toFixed(0)}%`}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============== success: stadium roar ============== */
const SuccessScreen: React.FC<{
  postTitles: string[];
  xp: number;
  level: number;
  voterName: string;
  onRestart: () => void;
}> = ({ postTitles, xp, level, voterName, onRestart }) => (
  <div className="screen fade-in relative overflow-hidden hatch-blue text-center"
    style={{ background: "radial-gradient(ellipse at center, #2563eb 0%, #1d4ed8 60%, #1e3a8a 100%)" }}>
    <Confetti count={120} />
    {/* sun rays */}
    <svg className="absolute inset-0 pointer-events-none" viewBox="0 0 1000 600" preserveAspectRatio="none">
      {Array.from({ length: 18 }).map((_, i) => {
        const a = (i / 18) * Math.PI * 2;
        const x1 = 500 + Math.cos(a) * 200, y1 = 300 + Math.sin(a) * 200;
        const x2 = 500 + Math.cos(a) * 900, y2 = 300 + Math.sin(a) * 900;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(251,191,36,0.18)" strokeWidth="20" strokeLinecap="round" />;
      })}
    </svg>

    <div className="relative z-10 h-full flex flex-col items-center justify-center px-10 overflow-y-auto py-8">
      <div className="pop-in"><Mascot size={120} mood="cheer" waving /></div>
      <div className="font-display leading-[0.85] text-white mt-2 pop-in"
        style={{ fontSize: "min(200px, 16vw)", textShadow: "8px 8px 0 #0b1220", WebkitTextStroke: "3px #0b1220", animationDelay: ".15s" }}>
        NICE!!
      </div>
      <div className="rounded-2xl bg-white px-7 py-3 mt-3 font-display text-3xl lg:text-4xl pop-in"
        style={{ border: "3px solid var(--ink)", boxShadow: "6px 6px 0 var(--ink)", animationDelay: ".3s" }}>
        Your vote is cast 🎉
      </div>
      <div className="mt-5 flex gap-2 flex-wrap justify-center pop-in" style={{ animationDelay: ".4s" }}>
        {postTitles.map((title) => (
          <span key={title} className="sticker" style={{ background: "var(--paper)" }}>✓ {title.toLowerCase()}</span>
        ))}
      </div>
      <div className="mt-6 font-bold text-lg text-white tracking-wider uppercase pop-in" style={{ animationDelay: ".5s" }}>
        +{xp} XP · Citizen Lv. {level} unlocked
      </div>
      <div className="mt-1 font-hand text-base text-white/80">Thanks {voterName} — your vote matters</div>

      <div className="mt-6 flex gap-3 pop-in" style={{ animationDelay: ".6s" }}>
        <button onClick={onRestart} className="btn-pop rounded-xl px-7 py-3 font-display text-2xl text-white" style={{ background: "#0b1220" }}>SIGN OUT</button>
      </div>
    </div>
  </div>
);

/* ============== orchestrator ============== */
const Vote: React.FC<VoteProps> = ({ setLogin }) => {
  const [posts, setPosts] = useState<Post>({} as Post);
  const [phase, setPhase] = useState<Phase>("vote");
  const [raceIdx, setRaceIdx] = useState(0);
  const [votes, setVotes] = useState<Vote>({});
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isVoting, setIsVoting] = useState(false);

  const postTitles = Object.keys(posts);
  const totalRaces = postTitles.length;
  const totalXp = Math.max(totalRaces * REWARD, REWARD);
  const level = 1 + Math.floor(xp / 50);

  const currentTitle = postTitles[Math.min(raceIdx, Math.max(totalRaces - 1, 0))];
  const currentCandidates = posts[currentTitle] || [];
  const currentPostId = currentCandidates[0]?.post_id;
  const picked = currentPostId ? votes[currentPostId] : undefined;
  const nextTitle = postTitles[raceIdx + 1];
  const isLast = raceIdx === totalRaces - 1;

  const voterName = sessionStorage.getItem("voter_name") || "Voter";

  const loadCandidates = async () => {
    try {
      const response = await fetch(`${host}/api/voter/candidates`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to load candidates");
      const data = await response.json();
      setPosts(data.candidatesByPost || {});
    } catch (err) {
      notifyError("Failed to load candidates. Please try again later.");
      console.error(err);
    }
  };

  const castVote = async () => {
    setIsVoting(true);
    try {
      const response = await fetch(`${host}/api/voter/castVote`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify({
          votes,
        }),
      });
      const data = await response.json();
      if (response.status == 201) {
        setPhase("success");
        notifySuccess("Vote casted successfully");
        socket.emit("voter-finished", {});
        setTimeout(() => {
          sessionStorage.clear();
          setLogin(false);
        }, 5000);
      } else if (response.status == 401) {
        notifyError("You have already voted, or not authorized");
        setPhase("success");
        socket.emit("voter-finished", {});
        setTimeout(() => {
          sessionStorage.clear();
          setLogin(false);
        }, 5000);
      } else {
        notifyError(data.error || "Failed to cast vote");
        sessionStorage.clear();
        setLogin(false);
      }
    } catch (err) {
      notifyError("Error connecting to server");
      console.error(err);
      setIsVoting(false);
    }
  };

  const onPick = (cid: string) => {
    if (!currentPostId) return;
    setVotes({ ...votes, [currentPostId]: cid });
  };

  const onNextRace = () => {
    if (!picked) {
      notifyError("Please select a candidate before proceeding.");
      return;
    }
    setXp((x) => Math.min(totalXp, x + REWARD));
    setStreak((s) => s + 1);
    setPhase("toast");
  };

  const onPrevRace = () => setRaceIdx((i) => Math.max(0, i - 1));

  const onToastDone = () => {
    if (raceIdx >= totalRaces - 1) {
      setPhase("confirm");
      return;
    }
    setRaceIdx((i) => i + 1);
    setPhase("vote");
  };

  const onRestart = () => {
    sessionStorage.clear();
    setLogin(false);
  };

  useEffect(() => {
    loadCandidates();
  }, []);

  if (totalRaces === 0) {
    return (
      <div className="stage">
        <div className="screen grid-paper items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center px-6">
            <Mascot size={80} />
            <div className="font-display text-4xl">Loading the arena…</div>
            <div className="font-hand text-gray-600">Fetching candidates</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stage">
      {phase === "vote" && (
        <VotingScreen
          postTitle={currentTitle}
          candidates={currentCandidates}
          raceIdx={raceIdx}
          totalRaces={totalRaces}
          xp={xp}
          totalXp={totalXp}
          level={level}
          streak={streak}
          picked={picked}
          onPick={onPick}
          onNext={onNextRace}
          onPrev={onPrevRace}
          isLast={isLast}
        />
      )}
      {phase === "toast" && (
        <ProgressToast
          postTitle={currentTitle}
          nextTitle={nextTitle}
          nextCandidates={nextTitle ? posts[nextTitle] : []}
          reward={REWARD}
          onDone={onToastDone}
        />
      )}
      {phase === "confirm" && (
        <ConfirmScreen
          postTitles={postTitles}
          posts={posts}
          votes={votes}
          isVoting={isVoting}
          onCast={castVote}
          onEdit={() => { setRaceIdx(0); setPhase("vote"); }}
        />
      )}
      {phase === "success" && (
        <SuccessScreen
          postTitles={postTitles}
          xp={totalXp}
          level={1 + Math.floor(totalXp / 50)}
          voterName={voterName}
          onRestart={onRestart}
        />
      )}
    </div>
  );
};

export default Vote;
