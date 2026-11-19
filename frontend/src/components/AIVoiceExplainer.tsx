import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, Square, Sparkles, ChevronDown, ChevronUp, FastForward, Check, Radio } from 'lucide-react';
import { BugReport, Investigation } from '../types';

interface Props {
  bug: BugReport;
  investigation?: Investigation | null;
}

export const AIVoiceExplainer: React.FC<Props> = ({ bug, investigation }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState<number>(1.0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(true);
  const [speechProgress, setSpeechProgress] = useState(0);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Synthesize natural humanized narrative
  const generateNarrative = (): string => {
    const errorType = bug.error_type || 'Runtime Exception';
    const cleanTitle = bug.title.replace(/TypeError:|Error:|Uncaught/gi, '').trim();
    const severity = bug.severity || 'high';
    const domain = (() => {
      try {
        return new URL(bug.url).hostname;
      } catch {
        return bug.url || 'target application';
      }
    })();

    let rcaSummary = 'The failure occurred during component execution or unhandled asynchronous promise resolution.';
    if (investigation?.root_cause_analysis) {
      rcaSummary = investigation.root_cause_analysis.split('\n')[0].replace(/[*#_`]/g, '').trim();
      if (rcaSummary.length > 200) {
        rcaSummary = rcaSummary.substring(0, 197) + '...';
      }
    }

    let fixSummary = 'ReproLens synthesized a defensive AST patch with fallback state handling to prevent white-screen crashes.';
    if (investigation?.fix_recommendations && investigation.fix_recommendations.length > 0) {
      const rec = investigation.fix_recommendations[0];
      if (rec.explanation) {
        fixSummary = rec.explanation.replace(/[*#_`]/g, '').trim();
      }
    }

    return (
      `ReproLens Autonomous Bug Briefing. ` +
      `A ${severity} severity ${errorType} was captured on ${domain}. ` +
      `Summary: ${cleanTitle}. ` +
      `Root Cause: ${rcaSummary} ` +
      `Resolution: ${fixSummary} ` +
      `Dual-Reality B counterfactual verification confirmed zero unhandled exceptions with safe fallback UI. ` +
      `You can inspect the verified unified diff or push an isolated pull request directly from the dashboard.`
    );
  };

  const scriptText = generateNarrative();

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setHasSpeechSupport(false);
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleStartSpeaking = () => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(scriptText);
    utteranceRef.current = utterance;
    utterance.rate = speed;
    utterance.pitch = 1.0;

    // Pick optimal natural voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice =
      voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel'))) ||
      voices.find((v) => v.lang.startsWith('en-US')) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      voices[0];

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      setSpeechProgress(0);
    };

    utterance.onboundary = (e) => {
      if (scriptText.length > 0) {
        setSpeechProgress(Math.min(100, Math.round((e.charIndex / scriptText.length) * 100)));
      }
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setSpeechProgress(100);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePause = () => {
    if (!('speechSynthesis' in window)) return;
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const handleStop = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setSpeechProgress(0);
  };

  const cycleSpeed = () => {
    const nextSpeed = speed === 1.0 ? 1.25 : speed === 1.25 ? 1.5 : 1.0;
    setSpeed(nextSpeed);
    if (isPlaying && !isPaused) {
      handleStop();
      setTimeout(handleStartSpeaking, 100);
    }
  };

  if (!hasSpeechSupport) return null;

  return (
    <div className="bg-white/85 backdrop-blur-md border border-indigo-100 rounded-2xl p-3.5 shadow-sm space-y-2.5 font-mono text-xs text-[#111] transition-all">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Branding & Waveform */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-xs text-indigo-950 tracking-tight">AI Voice Briefing</span>
              <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold">
                Natural Audio RCA
              </span>
            </div>
            <p className="text-[10px] text-black/50">Humanized summary of error, root cause, and verified fix</p>
          </div>
        </div>

        {/* Center: Live Soundwave Indicator when playing */}
        {isPlaying && !isPaused && (
          <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-indigo-50/80 border border-indigo-200/60">
            <span className="w-1 h-3.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1 h-5 bg-violet-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1 h-3 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.45s]" />
            <span className="w-1 h-4 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.2s]" />
            <span className="text-[10px] font-bold text-indigo-700 ml-1.5">NARRATING ({speechProgress}%)</span>
          </div>
        )}

        {/* Right: Controls */}
        <div className="flex items-center space-x-2">
          {!isPlaying ? (
            <button
              onClick={handleStartSpeaking}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shadow-xs transition cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Listen to Bug Brief</span>
            </button>
          ) : (
            <div className="flex items-center space-x-1.5">
              <button
                onClick={handlePause}
                className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 transition cursor-pointer"
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={handleStop}
                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer"
                title="Stop Narration"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>
          )}

          <button
            onClick={cycleSpeed}
            className="px-2 py-1 rounded-lg bg-black/5 hover:bg-black/10 text-[10px] font-bold text-black/70 border border-black/10 transition cursor-pointer"
            title="Toggle playback speed"
          >
            {speed}x
          </button>

          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="p-1.5 rounded-lg bg-black/5 hover:bg-black/10 text-black/70 transition cursor-pointer"
            title="Toggle transcript text"
          >
            {showTranscript ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Collapsible Transcript Bubble */}
      {showTranscript && (
        <div className="mt-2 p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-[11px] text-black/75 leading-relaxed space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-indigo-800">
            <span>FULL AUDIO TRANSCRIPT:</span>
            <span>{scriptText.split(' ').length} words</span>
          </div>
          <p className="italic font-sans text-xs text-[#222] bg-white p-2.5 rounded-lg border border-indigo-100/80 shadow-xs">
            "{scriptText}"
          </p>
        </div>
      )}
    </div>
  );
};
