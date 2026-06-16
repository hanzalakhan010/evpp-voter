import { QRCodeCanvas } from "qrcode.react";
import React, { Dispatch, SetStateAction, useState } from "react";
import { host } from "../constants";
import { notifyError, notifySuccess } from "../notification";
import Mascot from "./Mascot";

interface Credentials {
  electorId: string,
  electorCode: string
}

interface LoginProps {
  setLogin: Dispatch<SetStateAction<boolean>>;
  credentials: Credentials;
  setCredentials: Dispatch<SetStateAction<Credentials>>;
  mappingId: string | null;
}

const Login: React.FC<LoginProps> = ({ setLogin, credentials, setCredentials, mappingId }) => {
  const [showQR, setShowQR] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const [info, setInfo] = React.useState({
    instituteName: "",
    instituteLogo: "",
    electionTitle: "",
    electionYear: "",
  })
  const handleLogin = async () => {
    if (!credentials.electorCode || !credentials.electorId) {
      notifyError("Please enter both Elector Id and code.");
      return;
    }
    try {
      setIsSubmitting(true);
      const response = await fetch(`${host}/api/voter/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({ voter_id: credentials.electorId, voter_code: credentials.electorCode }),
      });
      const data = await response.json();
      if (response.ok) {
        setLogin(true);
        notifySuccess(data.message);
      } else {
        notifyError(data.error);
      }
    } catch {
      notifyError('Error connecting to server')
      setIsSubmitting(false);
    }
    finally {
      setIsSubmitting(false);
    }
  };
  const loadInfo = async () => {
    try {

      const response = await fetch(`${host}/api/voter/info`, { credentials: 'include' })
      const data = await response.json();
      if (response.ok) {
        setInfo({
          instituteName: data.instituteName,
          instituteLogo: data.instituteLogo,
          electionTitle: data.electionTitle,
          electionYear: data.electionYear
        })
      }
    } catch {
      notifyError('Error connecting to server')
    }
  }
  React.useEffect(() => {
    loadInfo();
  }, [])

  return (
    <div className="stage">
      <div className="screen fade-in bg-paper">
        {/* pep-rally banner */}
        <div
          className="relative shrink-0 flex items-center justify-center text-center hatch-blue overflow-hidden"
          style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)", height: "min(42%, 340px)", minHeight: 260 }}
        >
          <span className="pennant absolute top-5 left-8" style={{ background: "#fbbf24" }}></span>
          <span className="pennant absolute top-5 right-8 rotate-12" style={{ background: "#fbbf24" }}></span>
          <span className="pennant absolute top-20 left-24 -rotate-12 hidden md:inline-block" style={{ background: "#fbbf24" }}></span>
          <span className="pennant absolute top-20 right-24 rotate-12 hidden md:inline-block" style={{ background: "#fbbf24" }}></span>
          <div className="text-white relative z-10 px-6">
            <div className="flex items-center justify-center gap-3 mb-1">
              <img
                src={info.instituteLogo ? `${host}/${info.instituteLogo}` : '/logo.png'}
                className="w-11 h-11 rounded-xl object-cover bg-white/90"
                style={{ border: "2px solid #0b1220" }}
                alt="Institute Logo"
              />
              <div className="font-bold text-xs sm:text-sm uppercase tracking-[0.3em] opacity-90 text-left leading-tight">
                {info.instituteName || "Your School"}<br />Presents
              </div>
            </div>
            <div
              className="font-display leading-[0.85] mt-1 whitespace-nowrap"
              style={{ fontSize: "clamp(44px, 8vw, 88px)", textShadow: "4px 4px 0 #0b1220" }}
            >
              VOTE {info.electionYear || ""}
            </div>
            <div className="font-display mt-1" style={{ fontSize: "clamp(18px, 2.4vw, 30px)" }}>
              {info.electionTitle || "Council Tournament"}
            </div>
          </div>
        </div>

        {/* login card */}
        <div className="flex-1 min-h-0 flex items-start justify-center px-6 pb-8 overflow-auto" style={{ marginTop: "-12px" }}>
          <div
            className="bg-white rounded-3xl p-7 w-full max-w-[640px] pop-in"
            style={{ border: "3px solid #0b1220", boxShadow: "8px 8px 0 #0b1220", transform: "rotate(-0.4deg)" }}
          >
            <div className="flex items-start gap-3 mb-5">
              <div className="shrink-0"><Mascot size={56} waving /></div>
              <div className="min-w-0">
                <div className="font-display text-3xl leading-tight">Hi! I'm Otis 👋</div>
                <div className="font-hand text-base text-gray-600 leading-tight">Got your ID and code? Let's hop in.</div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="elector-id" className="block text-xs font-bold uppercase tracking-wider mb-1.5">Elector ID</label>
                <input
                  id="elector-id"
                  autoComplete="new-elector-id"
                  className="vinput"
                  value={credentials.electorId}
                  onChange={(e) => setCredentials({ ...credentials, electorId: e.target.value })}
                  type="search"
                  placeholder="Enter your Elector ID"
                />
              </div>
              <div>
                <label htmlFor="elector-code" className="block text-xs font-bold uppercase tracking-wider mb-1.5">Access Code</label>
                <div className="relative">
                  <input
                    id="elector-code"
                    autoComplete="elector-password"
                    className="vinput"
                    style={{ paddingRight: "48px" }}
                    value={credentials.electorCode}
                    onChange={(e) => setCredentials({ ...credentials, electorCode: e.target.value })}
                    type={showCode ? "text" : "password"}
                    placeholder="Enter your code"
                  />
                  <button
                    type="button"
                    aria-label={showCode ? "Hide code" : "Show code"}
                    onClick={() => setShowCode(!showCode)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 transition-colors p-1 cursor-pointer"
                  >
                    {showCode ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogin}
              disabled={isSubmitting}
              className="btn-pop w-full mt-5 rounded-2xl py-4 font-display text-4xl text-white flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ background: "var(--accent)" }}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 6.477 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  SIGNING IN…
                </>
              ) : "ENTER ARENA →"}
            </button>
            <div className="mt-4 flex items-center gap-3 justify-center flex-wrap">
              <span className="sticker" style={{ background: "var(--accent-soft)" }}>🏆 Badge waiting</span>
              <span className="sticker">⏱ ~2 min</span>
            </div>
          </div>
        </div>
      </div>

      {showQR && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] fade-in" onClick={() => setShowQR(false)}>
          <div
            className="bg-white p-8 rounded-3xl relative w-[90%] max-w-sm text-center pop-in"
            style={{ border: "3px solid #0b1220", boxShadow: "8px 8px 0 #0b1220" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="absolute top-4 right-4 p-2 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-red-500 rounded-full transition-colors cursor-pointer" onClick={() => setShowQR(false)}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="mb-6">
              <h2 className="font-display text-4xl text-gray-800 mb-1">Pair</h2>
              <p className="font-hand text-gray-500 text-base">Scan this code with the terminal device</p>
            </div>

            {mappingId ? (
              <div className="flex flex-col items-center gap-4">
                <div className="bg-white p-3 inline-block rounded-xl" style={{ border: "2px solid #0b1220" }}>
                  <QRCodeCanvas
                    id="qr-code"
                    value={mappingId}
                    size={220}
                    bgColor={"#ffffff"}
                    fgColor={"#000000"}
                    level={"H"}
                    includeMargin={true}
                  />
                </div>
                <button
                  onClick={() => {
                    if (mappingId) {
                      navigator.clipboard.writeText(mappingId);
                      notifySuccess("Mapping ID copied to clipboard!");
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-bold transition-colors cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                  </svg>
                  Copy Mapping ID
                </button>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-gray-400 font-medium">
                <span className="animate-pulse">Loading mapping ID...</span>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        disabled={isSubmitting}
        className="btn-pop fixed bottom-8 right-8 w-16 h-16 bg-white text-[var(--ink)] rounded-2xl hover:scale-105 active:scale-95 transition-transform duration-200 flex items-center justify-center z-50 cursor-pointer"
        onClick={() => setShowQR(true)}
        aria-label="Show Pairing QR Code"
        title="Show Pairing QR Code"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
        </svg>
      </button>
    </div>
  );
};

export default Login;
