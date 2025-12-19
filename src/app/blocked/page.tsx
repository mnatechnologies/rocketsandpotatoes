export default function BlockedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full bg-background rounded-lg shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">🌏</div>

        <h1 className="text-3xl font-bold text-primary mb-4">
          Service Not Available
        </h1>

        <div className="space-y-4 text-secondary">
          <p className="text-lg">
            We apologize, but our services are currently only available to customers located in Australia.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <p className="font-semibold text-primary-foreground mb-2">
              Why am I seeing this?
            </p>
            <p className="text-secondary-foreground">
              Due to Australian regulatory requirements and compliance obligations under AUSTRAC,
              we can only serve customers with Australian addresses at this time.
            </p>
          </div>

          <p className="text-sm text-secondary">
            If you believe you&apos;re seeing this message in error, please ensure you&apos;re accessing
            our site from within Australia and try again.
          </p>

          <p className="text-sm text-secondary mt-6">
            For inquiries, please contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
}
