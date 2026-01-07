export function BusinessVerificationStatus({ business, ubos }) {
  const allUbosVerified = ubos.every(ubo => ubo.verification_status === 'verified');

  const steps = [
    { name: 'ABN Verified', complete: business.abr_verified },
    { name: 'Owners Added', complete: ubos.length > 0 },
    { name: 'Owners Verified', complete: allUbosVerified },
  ];

  const isFullyVerified = steps.every(s => s.complete);

  return (
    <div className="p-4 bg-card rounded-lg border">
      <h3 className="font-semibold mb-3">Business Verification</h3>

      {!isFullyVerified && (
        <p className="text-amber-600 text-sm mb-3">
          Complete verification to start purchasing
        </p>
      )}

      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            {step.complete ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground" />
            )}
            <span className={step.complete ? 'text-foreground' : 'text-muted-foreground'}>
              {step.name}
            </span>
          </div>
        ))}
      </div>

      {!isFullyVerified && (
        <Link href="/onboarding/business" className="mt-4 block">
          <Button className="w-full">Continue Verification</Button>
        </Link>
      )}
    </div>
  );
}