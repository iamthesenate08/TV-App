// frontend/src/components/FlipRoller.jsx
import React, { useEffect, useRef, useState } from 'react';
import $ from 'jquery';
import RollPurchase from './RollPurchase';
import './flipRoller.css';

export default function FlipRoller() {
  const wrapperRef     = useRef(null);
  const waitingRef     = useRef(null);
  const finalRef       = useRef(null);

  /* ------------ state ------------ */
  const [history,       setHistory]      = useState([]);
  const [busy,          setBusy]         = useState(false);
  const [ready,         setReady]        = useState(false);
  const [selected,      setSelected]     = useState(null);
  const [team,          setTeam]         = useState('');
  const [modal,         setModal]        = useState(false);
  const [finished,      setFinished]     = useState(false);
  const [commitLater,   setCommitLater]  = useState(false);

  const [wildcardModal, setWildcardModal]= useState(false);
  const [wildcardInput, setWildcardInput]= useState('');
  const [wildcardPending, setWildcardPending] = useState(null);

  const [allowance,     setAllow]        = useState(3);
  const [target,        setTarget]       = useState(3);

  // ————— Persist state in localStorage —————

  // On mount, try to hydrate from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('flipRollerState');
    if (stored) {
      try {
        const { history, allowance, target, ready, finished, selected } = JSON.parse(stored);
        setHistory(history);
        setAllow(allowance);
        setTarget(target);
        setReady(ready);
        setFinished(finished);
        setSelected(selected);
      } catch (e) {
        console.warn('Failed to parse flipRollerState from localStorage', e);
      }
    }
  }, []);

  // Whenever key pieces of state change, persist them
  useEffect(() => {
    const state = { history, allowance, target, ready, finished, selected };
    localStorage.setItem('flipRollerState', JSON.stringify(state));
  }, [history, allowance, target, ready, finished, selected]);

  /* ————————— existing logic unchanged ————————— */

  const spinCoinMs = 1000;
  const spinDiceMs = 800;
  const makeAudio  = (src, loop = false) => {
    const a = new Audio(src);
    a.loop = loop;
    a.volume = 0.8;
    return a;
  };

  /* ---------- coin + dice logic ---------- */
  useEffect(() => {
    const $wrap = $(wrapperRef.current);
    const $coin = $wrap.find('#coin');
    const $dice = $wrap.find('.die');
    let lastFace = null, tensVal = null, onesVal = null;
    const rndFace = () => {
      const f = Math.floor(Math.random() * 10);
      return f === lastFace ? rndFace() : (lastFace = f);
    };
    const revealShow = async () => {
      try {
        const res = await fetch('/api/random-show');
        const { show } = await res.json();
        setHistory(h => [...h, show]);
      } catch {
        setHistory(h => [...h, '⚠️ Error']);
      }
    };
    const spinDie = $d => {
      $d.addClass('rolling');
      setTimeout(() => {
        $d.removeClass('rolling');
        const face = rndFace();
        $d.attr('data-face', face);
        if ($d.hasClass('die-tens')) tensVal = face * 10;
        else                          onesVal = face;
        if (tensVal !== null && onesVal !== null) {
          revealShow();
          setBusy(false);
          tensVal = onesVal = null;
        }
      }, spinDiceMs);
    };
    const flipAndRoll = () => {
      if (busy || allowance === 0 || history.length >= target) return;
      setBusy(true);
      setAllow(a => a - 1);
      const heads = Math.random() < 0.5;
      $coin.addClass('flipping');
      setTimeout(() => {
        $coin
          .removeClass('flipping')
          .css('transform', heads ? 'rotateY(0)' : 'rotateY(180deg)');
        $dice.each((_, el) => spinDie($(el)));
      }, spinCoinMs);
    };
    $wrap.find('#flipRollBtn').on('click', e => { e.preventDefault(); flipAndRoll(); });
    $coin.on('click', flipAndRoll);
    return () => {
      $wrap.find('#flipRollBtn').off();
      $coin.off();
    };
  }, [busy, allowance, history.length, target]);

  /* ---------- waiting music ---------- */
  useEffect(() => {
    if (history.length === target && !ready && !finished) {
      setReady(true);
      waitingRef.current?.pause();
      waitingRef.current = makeAudio('http://localhost:3001/audio/waiting.mp3', true);
      waitingRef.current.play().catch(() => {});
    }
  }, [history, target, ready, finished]);

  /* ---------- selection & final flow ---------- */
  const handleSelect = idx => { if (ready) setSelected(idx); };
  const handleFinal  = ()   => {
    if (selected === null) return;
    if (history[selected] === 'WILDCARD') {
      setWildcardModal(true);
    } else {
      setModal(true);
    }
  };

  /* ---------- wildcard detail flow ---------- */
  const handleWildcardConfirm = () => {
    setWildcardModal(false);
    setWildcardPending(wildcardInput.trim());
    setWildcardInput('');
    setModal(true);
  };
  const handleWildcardLater = () => {
    setWildcardModal(false);
    setWildcardPending('***WILDCARD - WAITING ON CHOICE***');
    setWildcardInput('');
    setModal(true);
  };

  /* ---------- lock it in (+ auto-close) ---------- */
  const lockItIn = async () => {
    setModal(false);
    waitingRef.current?.pause();
    waitingRef.current = null;

    const showValue = wildcardPending !== null
      ? wildcardPending
      : history[selected];

    try {
      await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team: team.trim(),
          show: showValue
        })
      });
    } catch (e) {
      console.error('Submit failed', e);
    }
    setWildcardPending(null);

    finalRef.current?.pause();
    finalRef.current = makeAudio('http://localhost:3001/audio/final%20answer.mp3');
    finalRef.current.play().catch(() => {});

    // close window 3 seconds after audio starts
    setTimeout(() => window.close(), 3000);

    setFinished(true);
    setReady(false);
    window.alert('Your choice has been recorded—happy Sweding!');
  };

  /* ---------- commit later flow (+ auto-close) ---------- */
  const handleCommitConfirm = async () => {
    waitingRef.current?.pause();
    waitingRef.current = null;
    finalRef.current?.pause();
    finalRef.current = makeAudio('http://localhost:3001/audio/final%20answer.mp3');
    finalRef.current.play().catch(() => {});

    const options = history.join(', ') + ',***NOT DECIDED - WAITING ON CHOICE***';
    try {
      await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team: team.trim(), show: options })
      });
    } catch (e) {
      console.error('Commit Later submit failed', e);
    }

    // close window 3 seconds after audio starts
    setTimeout(() => window.close(), 3000);

    setCommitLater(false);
    setFinished(true);
    window.alert(
      'Your available options have been recorded! Email us or reach out on Instagram when you have made your choice!'
    );
  };

  /* ---------- PayPal success (unchanged) ---------- */
  const grantExtraRolls = () => {
    setAllow(a => a + 3);
    setTarget(t => t + 3);
  };

  const showPayBtn = ready && !finished;

  return (
    <>
      <div className="relative z-0 flex flex-col md:flex-row gap-10 mx-auto w-fit">
        {/* LEFT SIDE */}
        <section ref={wrapperRef} className="max-w-lg text-center">
          <h1 className="text-2xl font-bold mb-4 text-white">MOVIE-O-MATIC</h1>
          <p className="text-white mb-4">
            Step 1: Roll three times. You can pay for more rolls if you want.<br/>
            Step 2: Click a movie to lock it in OR choose to submit later.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mx-auto mb-6">
            <div className="content">
              <div className="die die-tens">
                {Array.from({ length: 10 }).map((_, i) => (
                  <figure key={i} className={`face face-${i}`} data-value={`${i}0`} />
                ))}
              </div>
            </div>
            <div className="coin-wrapper">
              <div className="coin" id="coin">
                <div className="face-coin heads" />
                <div className="face-coin tails" />
              </div>
            </div>
            <div className="content">
              <div className="die die-ones">
                {Array.from({ length: 10 }).map((_, i) => (
                  <figure key={i} className={`face face-${i}`} />
                ))}
              </div>
            </div>
          </div>

          {history.length < target && (
            <a
              href="#"
              id="flipRollBtn"
              className={`btn ${busy || allowance === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Flip + Roll ({allowance})
            </a>
          )}

          {showPayBtn && (
            <div className="mt-4 relative z-0">
              <p className="text-purple-300 mb-2">Need three more rolls? Give us five dollars.</p>
              <RollPurchase onSuccess={grantExtraRolls} />
            </div>
          )}
        </section>

        {/* RIGHT SIDE */}
        <aside className="flex flex-col items-start min-w-[220px]">
          <h2 className="text-xl font-semibold mb-4">Your Rolls</h2>
          {history.map((title, idx) => (
            <p
              key={idx}
              onClick={() => handleSelect(idx)}
              className={`text-2xl md:text-3xl font-bold mb-2 break-words cursor-pointer transition ${
                idx === selected
                  ? 'text-yellow-300'
                  : 'text-purple-300 hover:text-purple-100'
              }`}
            >
              {idx + 1}. {title}
            </p>
          ))}
          {ready && !finished && (
            <>
              <button
                className={`mt-6 px-6 py-3 text-xl rounded-lg transition ${
                  selected == null
                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
                onClick={handleFinal}
              >
                {selected == null ? 'Choose a movie to lock in' : 'FINAL ANSWER'}
              </button>
              <button
                className="mt-4 px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded"
                onClick={() => setCommitLater(true)}
              >
                I need to discuss with my team...<br/>I'll submit later!
              </button>
            </>
          )}
        </aside>
      </div>

      {/* TEAM NAME MODAL */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 text-white p-8 rounded-lg w-80 flex flex-col space-y-4">
            <h3 className="text-2xl font-bold">Confirm Team Name</h3>
            <input
              type="text"
              value={team}
              onChange={e => setTeam(e.target.value)}
              placeholder="Team Name"
              className="p-2 rounded text-black"
            />
            <button
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white disabled:opacity-50"
              disabled={team.trim() === ''}
              onClick={lockItIn}
            >
              LOCK IT IN
            </button>
          </div>
        </div>
      )}

      {/* WILDCARD DETAIL MODAL */}
      {wildcardModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 text-white p-8 rounded-lg w-80 flex flex-col space-y-4">
            <h3 className="text-2xl font-bold">You chose WILDCARD—you can pick any movie you want! What will it be?</h3>
            <input
              type="text"
              value={wildcardInput}
              onChange={e => setWildcardInput(e.target.value)}
              placeholder="Movie Title"
              className="p-2 rounded text-black"
            />
            <div className="flex space-x-4">
              <button
                className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-white disabled:opacity-50"
                disabled={wildcardInput.trim() === ''}
                onClick={handleWildcardConfirm}
              >
                CONFIRM
              </button>
              <button
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white"
                onClick={handleWildcardLater}
              >
                I'll email you with our choice later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMMIT LATER MODAL */}
      {commitLater && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 text-white p-8 rounded-lg w-80 flex flex-col space-y-4">
            <h3 className="text-2xl font-bold">Confirm Team Name</h3>
            <input
              type="text"
              value={team}
              onChange={e => setTeam(e.target.value)}
              placeholder="Team Name"
              className="p-2 rounded text-black"
            />
            <button
              className="mt-4 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-white disabled:opacity-50"
              disabled={team.trim() === ''}
              onClick={handleCommitConfirm}
            >
              CONFIRM
            </button>
          </div>
        </div>
      )}
    </>
  );
}
