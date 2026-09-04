import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Mic, 
  MicOff, 
  Copy, 
  Check, 
  Play, 
  X, 
  Share2, 
  Bot, 
  Flame, 
  Fan, 
  Sun, 
  Moon, 
  Radio
} from "lucide-react";
import { assistantDeepLink } from "../services/assistantDeepLinkService";
import { hapticFeedback } from "../services/haptics";

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  isDarkMode = true,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lastActionResult, setLastActionResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"assistant" | "siri" | "mic">("assistant");

  const shortcuts = assistantDeepLink.getShortcutUrls();

  // Web Speech API Voice Recognition
  useEffect(() => {
    if (!isOpen) return;

    let recognition: any = null;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition && isListening) {
      try {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          const current = event.resultIndex;
          const text = event.results[current][0].transcript;
          setTranscript(text);

          if (event.results[current].isFinal) {
            handleVoiceCommand(text);
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
      } catch (e) {
        console.error("Failed to start speech recognition:", e);
        setIsListening(false);
      }
    }

    return () => {
      if (recognition) {
        try {
          recognition.stop();
        } catch (e) {}
      }
    };
  }, [isListening, isOpen]);

  const handleVoiceCommand = (text: string) => {
    const lower = text.toLowerCase();
    hapticFeedback.click();

    let handledUrl = "";

    if (lower.includes("fan")) {
      handledUrl = "iremote://control?device=fan&action=toggle";
    } else if (lower.includes("sunset") || lower.includes("lamp") || lower.includes("light")) {
      if (lower.includes("off")) {
        handledUrl = "iremote://control?device=sunset&action=off";
      } else if (lower.includes("golden")) {
        handledUrl = "iremote://control?device=sunset&action=color&value=Golden%20Hour";
      } else {
        handledUrl = "iremote://control?device=sunset&action=toggle";
      }
    } else if (lower.includes("fire") || lower.includes("fireplace") || lower.includes("mist")) {
      handledUrl = "iremote://control?device=fireplace&action=toggle";
    } else if (lower.includes("sleep") || lower.includes("goodnight") || lower.includes("turn off all")) {
      handledUrl = "iremote://scene?name=sleep";
    } else if (lower.includes("cozy") || lower.includes("warm")) {
      handledUrl = "iremote://scene?name=cozy";
    }

    if (handledUrl) {
      const res = assistantDeepLink.processUrl(handledUrl);
      setLastActionResult("✓ " + res.message);
    } else {
      setLastActionResult("No matching command found for: \"" + text + "\"");
    }
  };

  const handleCopy = (url: string, index: number) => {
    hapticFeedback.tick();
    navigator.clipboard.writeText(url);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleTestLink = (url: string) => {
    hapticFeedback.click();
    const res = assistantDeepLink.processUrl(url);
    setLastActionResult("✓ " + res.message);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/65 animate-fade-in select-none">
      <div
        className={"relative w-full max-w-lg max-h-[88vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden " +
          (isDarkMode ? "bg-[#14161A] border-white/10 text-white" : "bg-white border-slate-200 text-slate-900")}
      >
        {/* Header */}
        <div className={"px-5 pt-5 pb-3 border-b flex items-center justify-between " + 
          (isDarkMode ? "border-white/10" : "border-slate-100")}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 flex items-center justify-center shadow-md">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">AI & Voice Assistants</h2>
              <p className={"text-xs " + (isDarkMode ? "text-accent-muted" : "text-slate-500")}>
                Google Gemini, Google Assistant & Siri Integration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={"w-8 h-8 rounded-full border flex items-center justify-center transition-transform active:scale-90 " +
              (isDarkMode ? "bg-surface border-surface-border text-accent-muted hover:text-white" : "bg-slate-100 border-slate-200 text-slate-600")}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className={"grid grid-cols-3 gap-1 p-2 mx-4 mt-3 rounded-2xl border " + 
          (isDarkMode ? "bg-[#0c0d10] border-white/5" : "bg-slate-100 border-slate-200")}>
          <button
            onClick={() => setActiveTab("assistant")}
            className={"py-2 rounded-xl text-xs font-bold transition-all " +
              (activeTab === "assistant" 
                ? (isDarkMode ? "bg-surface text-white shadow-sm" : "bg-white text-slate-900 shadow-sm") 
                : (isDarkMode ? "text-accent-muted hover:text-white" : "text-slate-500 hover:text-slate-800"))}
          >
            Google / Gemini
          </button>
          <button
            onClick={() => setActiveTab("siri")}
            className={"py-2 rounded-xl text-xs font-bold transition-all " +
              (activeTab === "siri" 
                ? (isDarkMode ? "bg-surface text-white shadow-sm" : "bg-white text-slate-900 shadow-sm") 
                : (isDarkMode ? "text-accent-muted hover:text-white" : "text-slate-500 hover:text-slate-800"))}
          >
            Siri Shortcuts
          </button>
          <button
            onClick={() => setActiveTab("mic")}
            className={"py-2 rounded-xl text-xs font-bold transition-all " +
              (activeTab === "mic" 
                ? (isDarkMode ? "bg-amber-400 text-black shadow-glow-amber" : "bg-slate-900 text-white") 
                : (isDarkMode ? "text-accent-muted hover:text-white" : "text-slate-500 hover:text-slate-800"))}
          >
            Live Voice Mic
          </button>
        </div>

        {/* Action result banner */}
        {lastActionResult && (
          <div className="mx-4 mt-2 px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-between animate-fade-in">
            <span>{lastActionResult}</span>
            <button onClick={() => setLastActionResult(null)} className="text-emerald-400/80 hover:text-emerald-300">
              <X size={12} />
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 overscroll-contain">
          {activeTab === "mic" ? (
            /* Live Voice Recognizer */
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
              <button
                onClick={() => {
                  hapticFeedback.click();
                  setIsListening(!isListening);
                }}
                className={"w-24 h-24 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-xl " +
                  (isListening
                    ? "bg-rose-500 text-white animate-pulse shadow-[0_0_40px_rgba(244,63,94,0.6)]"
                    : "bg-gradient-to-tr from-amber-400 to-rose-500 text-black shadow-glow-amber")}
              >
                {isListening ? <MicOff size={36} /> : <Mic size={36} />}
              </button>

              <div>
                <h3 className="text-sm font-extrabold">
                  {isListening ? "Listening... Speak your command" : "Tap to Speak"}
                </h3>
                <p className={"text-xs mt-1 max-w-xs mx-auto " + (isDarkMode ? "text-accent-muted" : "text-slate-500")}>
                  Try saying: \"Turn on sunset lamp\", \"Toggle fan\", \"Fireplace\", or \"Goodnight\"
                </p>
              </div>

              {transcript && (
                <div className={"w-full p-3 rounded-2xl border text-sm font-medium italic " +
                  (isDarkMode ? "bg-surface border-surface-border text-white" : "bg-slate-50 border-slate-200 text-slate-800")}>
                  \"{transcript}\"
                </div>
              )}
            </div>
          ) : (
            /* Deep Link Action Cards */
            <div className="space-y-2.5">
              <div className={"text-[11px] p-3 rounded-2xl border leading-relaxed " +
                (isDarkMode ? "bg-surface/50 border-white/5 text-accent-muted" : "bg-slate-50 border-slate-200 text-slate-600")}>
                {activeTab === "assistant" ? (
                  <span>
                    💡 <strong>Google Assistant / Gemini Setup</strong>: Open the <em>Google Assistant App</em> → <em>Routines</em> → <em>Add Action</em> → <em>Open App Feature / Web Link</em> → Paste the deep link URL below!
                  </span>
                ) : (
                  <span>
                    🍎 <strong>Apple Siri Shortcuts Setup</strong>: Open the <em>Shortcuts App</em> → <em>New Shortcut</em> → Add Action <em>\"Open URL\"</em> → Paste the deep link URL below!
                  </span>
                )}
              </div>

              {shortcuts.map((item, idx) => {
                const isCopied = copiedIndex === idx;
                const voicePhrase = activeTab === "assistant" ? item.voicePhrase : ("\"Hey Siri, " + item.siriPhrase + "\"");

                return (
                  <div
                    key={idx}
                    className={"p-3.5 rounded-2xl border transition-all flex flex-col gap-2 " +
                      (isDarkMode ? "bg-surface border-surface-border hover:border-white/20" : "bg-white border-slate-200 hover:border-slate-300 shadow-sm")}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold">{item.title}</span>
                          <span className={"text-[10px] px-2 py-0.5 rounded-full font-mono font-bold " +
                            (isDarkMode ? "bg-white/10 text-amber-300" : "bg-amber-100 text-amber-800")}>
                            {voicePhrase}
                          </span>
                        </div>
                        <p className={"text-[11px] " + (isDarkMode ? "text-accent-muted" : "text-slate-500")}>
                          {item.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Test Button */}
                        <button
                          onClick={() => handleTestLink(item.url)}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-400 text-black text-[11px] font-bold flex items-center gap-1 active:scale-95 shadow-sm"
                          title="Execute IR Command Now"
                        >
                          <Play size={12} fill="currentColor" />
                          <span>Test</span>
                        </button>

                        {/* Copy Link Button */}
                        <button
                          onClick={() => handleCopy(item.url, idx)}
                          className={"p-1.5 rounded-xl border transition-all active:scale-90 " +
                            (isCopied
                              ? "bg-emerald-500 text-white border-emerald-500"
                              : (isDarkMode ? "bg-surface border-surface-border text-white hover:bg-surface-hover" : "bg-white border-slate-200 text-slate-700 shadow-sm"))}
                          title="Copy Link for Siri / Assistant"
                        >
                          {isCopied ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>

                    <div className={"px-2.5 py-1 rounded-xl font-mono text-[10px] truncate select-all " +
                      (isDarkMode ? "bg-black/40 text-accent-muted" : "bg-slate-100 text-slate-600")}>
                      {item.url}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={"p-4 border-t flex items-center justify-between text-xs " + 
          (isDarkMode ? "border-white/10 bg-[#0c0d10]" : "border-slate-100 bg-slate-50")}>
          <div className="flex items-center gap-2">
            <Radio size={14} className="text-amber-400 animate-pulse" />
            <span className={isDarkMode ? "text-accent-muted" : "text-slate-500"}>
              NEC IR Blaster Ready
            </span>
          </div>
          <button
            onClick={onClose}
            className={"px-4 py-2 rounded-xl text-xs font-bold transition-all border " +
              (isDarkMode ? "bg-surface border-surface-border text-white hover:bg-surface-hover" : "bg-white border-slate-200 text-slate-800 shadow-sm")}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
