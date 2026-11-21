import { isRouteErrorResponse, useRouteError } from 'react-router'
import { ButtonLink } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/Feedback'
import { ROUTES } from '@/config/routes'
import NotFoundPage from '@/features/errors/NotFoundPage'

export function RouteError() {
  const error = useRouteError()
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />
  return (
    <div className="container" style={{ padding: '120px var(--gutter)' }}>
      <ErrorState title="This page hit a signal fault" error={error instanceof Error ? error : new Error('Unexpected error')} onRetry={() => window.location.reload()} />
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
        <ButtonLink to={ROUTES.home} variant="ghost">
          Back to home
        </ButtonLink>
      </div>
    </div>
  )
}
