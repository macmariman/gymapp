import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { logger } from '@/lib/logger';

export default function Home() {
  // Test Pino logger - check your dev server console
  logger.info({ page: 'home', timestamp: new Date().toISOString() }, 'Home page rendered');
  logger.debug({ userAgent: 'browser' }, 'Debug info example');
  
  return (
    <main className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome to Your Next.js Boilerplate
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            A modern, production-ready starter with TypeScript, Tailwind CSS, and shadcn/ui
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg">Get Started</Button>
            <Button size="lg" variant="outline">Learn More</Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <Card>
            <CardHeader>
              <CardTitle>⚡ Fast Development</CardTitle>
              <CardDescription>
                Built with Next.js 15 and React 19 for optimal performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Hot reload, TypeScript support, and modern tooling out of the box.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🎨 Beautiful UI</CardTitle>
              <CardDescription>
                shadcn/ui components with Tailwind CSS
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Accessible, customizable components with dark mode support.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🗄️ Database Ready</CardTitle>
              <CardDescription>
                Prisma ORM with SQLite configured
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Type-safe database access with migrations and schema management.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🧪 Testing Setup</CardTitle>
              <CardDescription>
                Jest and React Testing Library included
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Write tests with confidence using industry-standard tools.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tech Stack */}
        <Card>
          <CardHeader>
            <CardTitle>Tech Stack</CardTitle>
            <CardDescription>Everything you need to build modern web applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'shadcn/ui', 'Prisma', 'SQLite', 'Jest', 'ESLint', 'Prettier'].map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-medium"
                >
                  {tech}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
