import { Button, Card, EmptyState } from '../components/ui';

/** Route-level fallback for render errors and failed lazy-chunk loads (e.g. after a redeploy). */
export function RouteError() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Card>
        <EmptyState
          title="Something went wrong"
          description="This page failed to load. Reloading usually fixes it."
          action={
            <Button variant="primary" onClick={() => window.location.reload()}>
              Reload
            </Button>
          }
        />
      </Card>
    </div>
  );
}
