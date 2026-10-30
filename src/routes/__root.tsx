import { Outlet, createRootRoute } from '@tanstack/react-router';
import { DemoProvider } from '@/components/demo-provider';
import { Workspace } from '@/components/workspace';
import { Toaster } from '@/components/ui/sonner';

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page introuvable</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <div className="mt-6">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  ),
});

function RootComponent() {
  return (
    <DemoProvider>
      <Workspace>
        <Outlet />
      </Workspace>
      <Toaster position="bottom-right" closeButton />
    </DemoProvider>
  );
}