"use client";

import {
  useEffect,
  useRef,
  useCallback,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import HanziWriter from "hanzi-writer";
import { Play, Pause, Pencil, Eye, EyeOff, RotateCcw } from "lucide-react";

const STEP_SPEED = 25;
const SPEED_LEVELS = [0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 10];
const DELAY_LEVELS = [1200, 1000, 800, 600, 400, 300, 200, 100, 50];

export interface HanziWriterRef {
  playStop: () => void;
  replay: () => void;
  nextStroke: () => void;
  prevStroke: () => void;
  setSpeed: (level: number) => void;
}

interface HanziWriterProps {
  character: string;
  mode?: "view" | "quiz";
  width?: number;
  height?: number;
  padding?: number;
  speedLevel?: number;
  strokeColor?: string;
  highlightColor?: string;
  outlineColor?: string;
  drawingColor?: string;
  showOutline?: boolean;
  showHintAfterMisses?: number;
  highlightOnComplete?: boolean;
  onComplete?: () => void;
  onStrokeIndexChange?: (index: number, total: number) => void;
  onSpeedChange?: (level: number) => void;
  slotBelowCanvas?: React.ReactNode;
}

function getOpts(writer: HanziWriter): Record<string, unknown> {
  return (writer as unknown as { _options: Record<string, unknown> })._options;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function hideStrokeInstant(writer: HanziWriter, strokeIndex: number) {
  const w = writer as any;

  // Cancel any running animation on the render state
  const rs = w._renderState;
  if (rs) rs.cancelAll();

  // Directly manipulate the SVG element for instant visual update
  const mainRenderer = w._hanziWriterRenderer?._mainCharRenderer;
  const strokeRenderer = mainRenderer?._strokeRenderers?.[strokeIndex];
  if (strokeRenderer?._animationPath) {
    strokeRenderer._animationPath.style.opacity = "0";
    // Sync _oldProps so the renderer doesn't skip future renders
    if (strokeRenderer._oldProps) {
      strokeRenderer._oldProps = { ...strokeRenderer._oldProps, opacity: 0, displayPortion: 0 };
    }
  }

  // Also update the internal state so animateStroke reads correct values
  const stroke = rs?.state?.character?.main?.strokes?.[strokeIndex];
  if (stroke) {
    stroke.opacity = 0;
    stroke.displayPortion = 0;
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function useIsDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const el = document.documentElement;
    setDark(el.classList.contains("dark"));
    const obs = new MutationObserver(() => setDark(el.classList.contains("dark")));
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

const HanziWriterComponentInner = (
  {
    character,
    mode = "view",
    width = 150,
    height = 150,
    padding = 5,
    speedLevel = 5,
    strokeColor: strokeColorProp,
    highlightColor: highlightColorProp,
    outlineColor: outlineColorProp,
    drawingColor: drawingColorProp,
    showOutline = true,
    showHintAfterMisses = 3,
    highlightOnComplete = true,
    onComplete,
    onStrokeIndexChange,
    onSpeedChange,
    slotBelowCanvas,
  }: HanziWriterProps,
  ref: React.ForwardedRef<HanziWriterRef>,
) => {
  const isDark = useIsDark();
  const strokeColor = strokeColorProp ?? (isDark ? "#e4e4e7" : "#333");
  const highlightColor = highlightColorProp ?? (isDark ? "#818cf8" : "#4f46e5");
  const outlineColor = outlineColorProp ?? (isDark ? "#3f3f46" : "#ddd");
  const drawingColor = drawingColorProp ?? (isDark ? "#e4e4e7" : "#333");

  const containerRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<HanziWriter | null>(null);
  const [outlineVisible, setOutlineVisible] = useState(showOutline);
  const [isAnimating, setIsAnimating] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);

  const strokeCountRef = useRef(0);
  const currentStrokeRef = useRef(-1);
  const speedRef = useRef(speedLevel);
  const isAnimatingRef = useRef(false);
  const isPausedRef = useRef(false);
  const cancelRef = useRef(false);

  // --- Speed helpers ---

  const applySpeed = useCallback((level: number) => {
    speedRef.current = level;
    const writer = writerRef.current;
    if (!writer) return;
    const opts = getOpts(writer);
    opts.strokeAnimationSpeed = SPEED_LEVELS[level - 1] ?? 2;
    opts.delayBetweenStrokes = DELAY_LEVELS[level - 1] ?? 400;
  }, []);

  const applyStepSpeed = useCallback(() => {
    const writer = writerRef.current;
    if (!writer) return;
    getOpts(writer).strokeAnimationSpeed = STEP_SPEED;
  }, []);

  const restoreSpeed = useCallback(() => {
    applySpeed(speedRef.current);
  }, [applySpeed]);

  const emitStroke = useCallback(
    (index: number) => {
      currentStrokeRef.current = index;
      onStrokeIndexChange?.(index, strokeCountRef.current);
    },
    [onStrokeIndexChange],
  );

  // --- Custom stroke-by-stroke animation loop ---

  const animateFrom = useCallback(
    async (startStroke: number) => {
      const writer = writerRef.current;
      const total = strokeCountRef.current;
      if (!writer || total === 0) return;

      cancelRef.current = false;
      isPausedRef.current = false;
      isAnimatingRef.current = true;
      setIsAnimating(true);

      for (let i = startStroke; i < total; i++) {
        if (cancelRef.current) break;

        // Respect pause
        while (isPausedRef.current && !cancelRef.current) {
          await sleep(50);
        }
        if (cancelRef.current) break;

        // Track stroke BEFORE animating so step handlers see the right index
        currentStrokeRef.current = i;

        applySpeed(speedRef.current);
        await writer.animateStroke(i);

        if (cancelRef.current) break;
        emitStroke(i);

        // Delay between strokes (skip after last)
        if (i < total - 1) {
          const delayMs = DELAY_LEVELS[speedRef.current - 1] ?? 400;
          const t0 = Date.now();
          while (Date.now() - t0 < delayMs) {
            if (cancelRef.current) break;
            while (isPausedRef.current && !cancelRef.current) await sleep(50);
            if (cancelRef.current) break;
            await sleep(Math.min(20, delayMs - (Date.now() - t0)));
          }
        }
      }

      isAnimatingRef.current = false;
      isPausedRef.current = false;
      setIsAnimating(false);
    },
    [applySpeed, emitStroke],
  );

  const stopLoop = useCallback(() => {
    cancelRef.current = true;
    isPausedRef.current = false;
    isAnimatingRef.current = false;
    setIsAnimating(false);
  }, []);

  // --- Imperative methods ---

  const handlePlayStop = useCallback(() => {
    if (isAnimatingRef.current) {
      isPausedRef.current = true;
      isAnimatingRef.current = false;
      setIsAnimating(false);
    } else if (isPausedRef.current) {
      isPausedRef.current = false;
      isAnimatingRef.current = true;
      setIsAnimating(true);
    } else {
      const startFrom = currentStrokeRef.current + 1;
      if (startFrom < strokeCountRef.current) {
        animateFrom(startFrom);
      }
    }
  }, [animateFrom]);

  const handleReplay = useCallback(async () => {
    const writer = writerRef.current;
    if (!writer) return;
    stopLoop();
    await sleep(30);
    await writer.hideCharacter({ duration: 0 });
    animateFrom(0);
  }, [stopLoop, animateFrom]);

  const handleNextStroke = useCallback(async () => {
    const writer = writerRef.current;
    const total = strokeCountRef.current;
    if (!writer || total === 0) return;

    const current = currentStrokeRef.current;
    if (current >= total - 1) return;

    const next = current + 1;
    currentStrokeRef.current = next;

    stopLoop();
    applyStepSpeed();
    await writer.animateStroke(next);
    restoreSpeed();
    emitStroke(next);
  }, [stopLoop, applyStepSpeed, restoreSpeed, emitStroke]);

  const handlePrevStroke = useCallback(() => {
    const writer = writerRef.current;
    const total = strokeCountRef.current;
    if (!writer || total === 0) return;

    const current = currentStrokeRef.current;
    if (current < 0) return;

    currentStrokeRef.current = current - 1;

    stopLoop();
    hideStrokeInstant(writer, current);
    emitStroke(current - 1);
  }, [stopLoop, emitStroke]);

  const handleSetSpeed = useCallback(
    (level: number) => {
      const clamped = Math.max(1, Math.min(9, level));
      speedRef.current = clamped;
      applySpeed(clamped);
      onSpeedChange?.(clamped);
    },
    [applySpeed, onSpeedChange],
  );

  useImperativeHandle(
    ref,
    () => ({
      playStop: handlePlayStop,
      replay: handleReplay,
      nextStroke: handleNextStroke,
      prevStroke: handlePrevStroke,
      setSpeed: handleSetSpeed,
    }),
    [handlePlayStop, handleReplay, handleNextStroke, handlePrevStroke, handleSetSpeed],
  );

  // --- Lifecycle ---

  useEffect(() => {
    if (!containerRef.current) return;

    let disposed = false;

    containerRef.current.innerHTML = "";
    currentStrokeRef.current = -1;
    isPausedRef.current = false;
    isAnimatingRef.current = false;
    cancelRef.current = true;

    const level = speedRef.current;
    const writer = HanziWriter.create(containerRef.current, character, {
      width,
      height,
      padding,
      strokeAnimationSpeed: SPEED_LEVELS[level - 1] ?? 2,
      delayBetweenStrokes: DELAY_LEVELS[level - 1] ?? 400,
      showCharacter: false,
      strokeColor,
      highlightColor,
      outlineColor,
      drawingColor,
      showOutline,
      showHintAfterMisses,
      highlightOnComplete,
    });

    writerRef.current = writer;
    setOutlineVisible(showOutline);

    writer.getCharacterData().then((charData) => {
      if (disposed) return;

      const count = charData.strokes.length;
      setStrokeCount(count);
      strokeCountRef.current = count;

      if (mode === "quiz") {
        writer.quiz({ onComplete });
      } else {
        animateFrom(0);
      }
    });

    return () => {
      disposed = true;
      cancelRef.current = true;
      if (containerRef.current) containerRef.current.innerHTML = "";
      writerRef.current = null;
    };
  }, [character, mode, isDark]);

  // --- UI handlers ---

  const handleQuiz = useCallback(() => {
    if (!writerRef.current) return;
    writerRef.current.quiz({ onComplete });
  }, [onComplete]);

  const toggleOutline = useCallback(() => {
    if (!writerRef.current) return;
    if (outlineVisible) {
      writerRef.current.hideOutline();
    } else {
      writerRef.current.showOutline();
    }
    setOutlineVisible(!outlineVisible);
  }, [outlineVisible]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={containerRef}
        className="bg-background rounded-xl shadow-inner border-2 border-border"
        style={{ width, height }}
      />
      {slotBelowCanvas}
      <div className="flex gap-2 justify-center">
        <button
          onClick={handlePlayStop}
          className="flex flex-col md:flex-row items-center gap-0.5 md:gap-1.5 px-3 py-1.5 md:py-2 text-sm font-medium bg-muted hover:bg-accent rounded-lg transition-colors"
        >
          {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span className="text-[10px] md:text-sm">{isAnimating ? "Pausar" : "Play"}</span>
        </button>
        <button
          onClick={handleReplay}
          className="flex flex-col md:flex-row items-center gap-0.5 md:gap-1.5 px-3 py-1.5 md:py-2 text-sm font-medium bg-muted hover:bg-accent rounded-lg transition-colors"
        >
          <RotateCcw className={`w-4 h-4 ${isAnimating ? "animate-spin" : ""}`} />
          <span className="text-[10px] md:text-sm">Replay</span>
        </button>
        <button
          onClick={handleQuiz}
          className="flex flex-col md:flex-row items-center gap-0.5 md:gap-1.5 px-3 py-1.5 md:py-2 text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors"
        >
          <Pencil className="w-4 h-4" />
          <span className="text-[10px] md:text-sm">Practicar</span>
        </button>
        <button
          onClick={toggleOutline}
          className="flex flex-col md:flex-row items-center gap-0.5 md:gap-1.5 px-3 py-1.5 md:py-2 text-sm font-medium bg-muted hover:bg-accent rounded-lg transition-colors"
        >
          {outlineVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span className="text-[10px] md:text-sm">{outlineVisible ? "Ocultar" : "Mostrar"}</span>
        </button>
      </div>
    </div>
  );
};

export const HanziWriterComponent = forwardRef(HanziWriterComponentInner);
export default HanziWriterComponent;
