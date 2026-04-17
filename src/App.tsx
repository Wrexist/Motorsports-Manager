import { CareerScreen } from "@/components/game/career/CareerScreen";
import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { useHydration } from "@/hooks/useHydration";
import { useGameStore } from "@/stores/useGameStore";
import { useShallow } from "zustand/react/shallow";

export function App() {
  const hydrated = useHydration();
  const onboardingDone = useGameStore(useShallow((s) => s.save.onboardingCompleted ?? false));

  if (!hydrated) {
    return (
      <div className="min-h-dvh bg-zinc-950 text-zinc-50 flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-3">
          <div className="text-lg font-semibold">Loading save…</div>
          <div className="text-sm text-zinc-300">
            If this hangs, check Capacitor Preferences / persistence configuration.
          </div>
        </div>
      </div>
    );
  }

  if (!onboardingDone) {
    return <OnboardingScreen />;
  }

  return <CareerScreen />;
}
