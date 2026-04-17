import { Button } from "@/components/ui/button";

export function TimeControls(props: {
  paused: boolean;
  speed: 0 | 1 | 2 | 5;
  onPause: () => void;
  onResume: () => void;
  onSpeed: (s: 1 | 2 | 5) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {props.paused ? (
        <Button type="button" size="sm" variant="secondary" onClick={props.onResume}>
          Resume
        </Button>
      ) : (
        <Button type="button" size="sm" variant="secondary" onClick={props.onPause}>
          Pause
        </Button>
      )}
      <Button
        type="button"
        size="sm"
        variant={!props.paused && props.speed === 1 ? "default" : "outline"}
        onClick={() => props.onSpeed(1)}
      >
        1x
      </Button>
      <Button
        type="button"
        size="sm"
        variant={!props.paused && props.speed === 2 ? "default" : "outline"}
        onClick={() => props.onSpeed(2)}
      >
        2x
      </Button>
      <Button
        type="button"
        size="sm"
        variant={!props.paused && props.speed === 5 ? "default" : "outline"}
        onClick={() => props.onSpeed(5)}
      >
        5x
      </Button>
    </div>
  );
}
