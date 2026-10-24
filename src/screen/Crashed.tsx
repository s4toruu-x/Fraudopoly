import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

/** Shows a way back instead of a blank page when something in the page throws. */
export class Crashed extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="mx-auto flex min-h-dvh max-w-3xl flex-col items-start justify-center gap-3 px-4">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-muted-foreground">Your names are safe on the server. Reload to carry on.</p>
        <Button onClick={() => location.reload()}>Reload</Button>
      </div>
    );
  }
}
