import { Navigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Brain, Rocket, Target } from 'lucide-react'
import { useApp } from '@/store/AppStore'
import { Button } from '@/components/ui'

export default function LandingPage() {
  const { state, ready } = useApp()

  if (!ready) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground" role="status">
          Loading workspace…
        </p>
      </div>
    )
  }

  if (state.profile?.onboardingComplete) {
    return <Navigate to="/today" replace />
  }

  const features = [
    {
      icon: Target,
      title: '12-week execution plan',
      body: 'Project builds, theory, practice, and interview prep mapped week by week.',
    },
    {
      icon: Brain,
      title: 'Evidence-first learning',
      body: 'Track skills, artifacts, and exit gates — not just checkbox completion.',
    },
    {
      icon: Rocket,
      title: 'Production ML focus',
      body: 'Three deployable projects with MLOps, testing, and system design baked in.',
    },
  ]

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:py-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary">ML Engineer Launchpad</p>
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Your 12-week path to production ML
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          A structured workspace for building three portfolio projects, passing capability gates, and preparing
          for ML engineering interviews.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/onboarding">
              Set up your plan
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </motion.div>

      <motion.ul
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="mt-16 grid gap-6 sm:grid-cols-3"
      >
        {features.map(({ icon: Icon, title, body }) => (
          <li
            key={title}
            className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur-sm"
          >
            <Icon className="mb-3 size-8 text-primary" aria-hidden />
            <h2 className="font-display font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{body}</p>
          </li>
        ))}
      </motion.ul>
    </div>
  )
}
