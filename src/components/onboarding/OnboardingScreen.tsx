import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGameStore } from "@/stores/useGameStore";

export function OnboardingScreen() {
  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-50 flex items-center justify-center p-6">
      <Card className="max-w-lg w-full border-zinc-800">
        <CardHeader>
          <CardTitle>Welcome to Pit Lane Manager</CardTitle>
          <CardDescription>Fictional open-wheel team management</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-zinc-300 leading-relaxed">
          <p>
            This game is not affiliated with any real racing series, governing body, circuit, team, or driver. All
            names, colors, and statistics are fictional.
          </p>
          <p>
            You will manage budgets, car development, contracts, and race strategy. Progress is saved on this device.
          </p>
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              useGameStore.getState().setOnboardingCompleted(true);
            }}
          >
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
