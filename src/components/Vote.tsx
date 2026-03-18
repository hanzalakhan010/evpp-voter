import React, { useEffect, useRef, useState } from "react";
import { host } from "../constants";
import { notifyError, notifySuccess } from "../notification";
import { socket } from "../socket";

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
// type is like this post_id: number; 
type Vote = Record<string, string>;
const Vote: React.FC<VoteProps> = ({ setLogin }) => {
  const [posts, setPosts] = useState<Post>({} as Post);
  const [voted, setVoted] = useState(false);
  const [step, setStep] = useState(0);
  const [votes, setVotes] = useState<Vote>({});
  const [isVoting, setIsVoting] = useState(false);
  const castVoteBtn = useRef<HTMLButtonElement>(null);
  const loadCandidates = async () => {
    try {
      const response = await fetch(`${host}/api/voter/candidates`);
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
    if (castVoteBtn.current) {
      castVoteBtn.current.disabled = true;
    }
    try {
      const response = await fetch(`${host}/api/voter/castVote`, {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify({
          votes,
        }),
      });
      const data = await response.json()
      if (response.status == 201) {
        setVoted(true);
        notifySuccess('Vote casted successfully');
        socket.emit('voter-finished', {});
        setTimeout(() => {
          sessionStorage.clear();
          setLogin(false);
        }, 5000);

      } else if (response.status == 401) {
        notifyError("You have already voted, or not authorized");
        setVoted(true);
        socket.emit('voter-finished', {});
        setTimeout(() => {
          sessionStorage.clear();
          setLogin(false);
        }, 5000);
      }
      else {
        notifyError(data.error || "Failed to cast vote");
        setLogin(false);
        sessionStorage.clear();
      }
    } catch (err) {
      notifyError("Error connecting to server");
      console.error(err);
      if (castVoteBtn.current) castVoteBtn.current.disabled = false;
      setIsVoting(false);
    }
  };
  const handleNext = () => {
    const currentPostTitle = Object.keys(posts)[step];
    const currentCandidates = posts[currentPostTitle];
    const currentPostId = currentCandidates[0]?.post_id; // same for all candidates in this post

    if (!votes[currentPostId]) {
      notifyError("Please select a candidate before proceeding.");
      return;
    }

    if (step < Object.keys(posts).length - 1) {
      setStep(step + 1);
    }
  };
  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };
  useEffect(() => {
    loadCandidates();
  }, []);
  return (

    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-blue-600 text-white p-6 text-center shadow-md">
        <h2 className="text-3xl font-bold tracking-tight">School Council Elections</h2>
      </div>
      {!voted && Object.keys(posts).length > 0 && (
        <div className="bg-white border-b border-gray-100 shadow-sm px-4 py-3 mb-8">
          <div className="max-w-xl mx-auto flex items-center gap-3">
            <div className="flex items-center gap-1.5 flex-1">
              {Object.keys(posts).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                    i < step ? 'bg-blue-400' : i === step ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-gray-500 whitespace-nowrap">
              {step + 1} / {Object.keys(posts).length}
            </span>
          </div>
        </div>
      )}
      {voted ? (
        <div id="success" className="flex flex-col justify-center items-center min-h-[60vh] p-4 text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-8 max-w-lg">
            Thanks for voting {sessionStorage.getItem("voter_name") || "Voter"},
            your vote matters
          </h2>
          <img src={`${host}/static/images/voted.png`} className="w-[300px] h-auto object-contain" alt="Voted" />
        </div>
      ) : (
        <div className="container mx-auto px-4 max-w-6xl">
          {!!posts && Object.keys(posts).map((postTitle, index) => (
            <div key={index} id={`index_${index}`} className={`${step !== index && 'hidden'} animate-in fade-in duration-300`}>
              <div className="bg-white p-4 mb-8 rounded-xl shadow-sm border border-gray-100 text-center">
                <h2 className="text-xl font-bold text-gray-700 uppercase tracking-wide">Position: <span className="text-blue-600">{postTitle}</span></h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mb-8 justify-items-center">
                {posts[postTitle].map((candidate, index_c) => (
                  <div key={index_c} className={`w-full max-w-lg bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1 group border-2
                     ${votes[candidate.post_id] === candidate.id ?
                      'border-green-500 ring-4 ring-green-100' : 'border-transparent hover:border-blue-100'}`}
                    onClick={() => {
                      const updatedVotes = { ...votes, [candidate.post_id]: candidate.id };
                      setVotes(updatedVotes);
                    }}
                  >
                    <div className="relative h-64 overflow-hidden bg-gray-100">
                      <img
                        src={`${host}/api/images/candidate/${candidate.id}/image`}
                        alt={`${candidate.name} image`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                      <img
                        src={`${host}/api/images/candidate/${candidate.id}/logo`}
                        alt={`${candidate.name} logo`}
                        className="w-20 h-20 object-cover rounded-full border-4 border-white shadow-lg absolute bottom-4 left-4"
                      />
                      {votes[candidate.post_id] === candidate.id && (
                        <div className="absolute top-4 right-4 bg-green-500 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-200">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <p className="text-2xl font-bold text-gray-800 mb-2">
                        {candidate.name}
                      </p>
                      <p className="text-blue-600 text-lg italic font-medium flex items-center gap-2">
                        <span className="text-3xl text-blue-300 leading-none">“</span>
                        {candidate.slogan}
                        <span className="text-3xl text-blue-300 leading-none">”</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md py-4 px-6 border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40">
        <div className="flex flex-row gap-4 max-w-xl mx-auto justify-center">
          {step > 0 && (
            <button
              type="button"
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors text-lg"
              onClick={handlePrev}
              disabled={step === 0}
            >
              Previous
            </button>
          )}
          {step < Object.keys(posts).length - 1 && (
            <button
              type="button"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-blue-200 text-lg"
              onClick={handleNext}
            >
              Next
            </button>
          )}
          {step === Object.keys(posts).length - 1 && (
            <button
              onClick={castVote}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-green-200 text-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              ref={castVoteBtn}
            >
              {isVoting ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </>
              ) : 'Cast Vote'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Vote;