import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const QUOTES = [
  { text: "The goal of a successful trader is to make the best trades. Money is secondary.", author: "Alexander Elder" },
  { text: "It's not whether you're right or wrong, but how much money you make when you're right and how much you lose when you're wrong.", author: "George Soros" },
  { text: "The stock market is filled with individuals who know the price of everything, but the value of nothing.", author: "Philip Fisher" },
  { text: "Risk comes from not knowing what you're doing.", author: "Warren Buffett" },
  { text: "The market can stay irrational longer than you can stay solvent.", author: "John Maynard Keynes" },
  { text: "In trading, the real battle is not against the market. It's against yourself.", author: "Mark Douglas" },
  { text: "Plan the trade and trade the plan.", author: "Ed Seykota" },
  { text: "I always define my risk, and I don't have to worry about it.", author: "Tony Saliba" },
  { text: "The key to trading success is emotional discipline. If intelligence were the key, there would be a lot more people making money trading.", author: "Victor Sperandeo" },
  { text: "The elements of good trading are cutting losses, cutting losses, and cutting losses.", author: "Ed Seykota" },
  { text: "Win or lose, everybody gets what they want out of the market.", author: "Ed Seykota" },
  { text: "Throughout my financial career, I have continually witnessed examples of other people that I have known being ruined by a failure to respect risk.", author: "Larry Hite" },
];

interface LoadingScreenProps {
  isLoading: boolean;
  children: React.ReactNode;
}

export function LoadingScreen({ isLoading, children }: LoadingScreenProps) {
  const [quoteIndex] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      const fadeTimer = setTimeout(() => setFadeOut(true), 100);
      const hideTimer = setTimeout(() => setVisible(false), 700);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }
    return undefined;
  }, [isLoading]);

  const quote = QUOTES[quoteIndex];

  return (
    <>
      {visible && (
        <div
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-700 ${fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        >
          <div className="flex flex-col items-center gap-10 max-w-lg px-8 text-center">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="font-mono text-xs tracking-[0.25em] uppercase text-muted-foreground">
                Titan Journal
              </span>
            </div>

            <div className="space-y-4">
              <p className="text-xl font-light leading-relaxed text-foreground tracking-wide">
                &ldquo;{quote.text}&rdquo;
              </p>
              <p className="font-mono text-sm text-primary">
                — {quote.author}
              </p>
            </div>

            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="font-mono text-xs tracking-widest uppercase">Loading</span>
            </div>
          </div>
        </div>
      )}
      <div className={`transition-opacity duration-300 ${visible && !fadeOut ? "opacity-0" : "opacity-100"}`}>
        {children}
      </div>
    </>
  );
}
