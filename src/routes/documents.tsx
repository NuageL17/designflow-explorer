import { createFileRoute, Outlet } from '@tanstack/react-router';
export const Route = createFileRoute('/documents')({ component: DocumentLayout });
function DocumentLayout() { return <Outlet />; }
