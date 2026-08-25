import { Link } from 'react-router-dom'
import { Home, MapPin } from 'lucide-react'
import { Button } from '@/components/ui'
import PageHeader from '@/components/layout/PageHeader'

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <PageHeader
        title="Page not found"
        description="The page you're looking for doesn't exist or may have moved."
        className="mb-8 items-center text-center sm:flex-col"
      />
      <p className="mb-8 font-display text-6xl font-bold text-muted-foreground/40" aria-hidden>
        404
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link to="/">
            <Home className="size-4" aria-hidden />
            Go home
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/today">
            <MapPin className="size-4" aria-hidden />
            Open Today
          </Link>
        </Button>
      </div>
    </div>
  )
}
