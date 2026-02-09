import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="max-w-lg w-full text-center">
        <div className="mb-6 sm:mb-8">
          <div className="text-6xl sm:text-8xl font-bold text-primary mb-4">404</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 tracking-tight">
            Page Not Found
          </h1>
          <p className="text-base text-muted-foreground mb-6 sm:mb-8">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or deleted.
          </p>
        </div>

        <div className="bg-card rounded-lg p-4 sm:p-8 mb-6 sm:mb-8 border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            What can you do?
          </h2>
          <ul className="text-left space-y-2 text-muted-foreground text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary">-</span>
              <span>Check the URL for typos</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">-</span>
              <span>Return to the homepage and navigate from there</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">-</span>
              <span>Browse our precious metals products</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">-</span>
              <span>Contact us if you need assistance</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 sm:px-8 rounded-lg transition-colors text-sm sm:text-base"
          >
            Return Home
          </Link>
          <Link
            href="/products"
            className="inline-block bg-card hover:bg-muted text-foreground font-semibold py-3 px-6 sm:px-8 rounded-lg border border-border transition-colors text-sm sm:text-base"
          >
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  );
}
