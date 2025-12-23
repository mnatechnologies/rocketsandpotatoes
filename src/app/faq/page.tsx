import Link from 'next/link';

export const metadata = {
  title: 'Frequently Asked Questions | Australian National Bullion',
  description: 'Find answers to common questions about buying precious metals from Australian National Bullion.',
};

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: { category: string; items: FAQItem[] }[] = [
  {
    category: 'Ordering & Payment',
    items: [
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept Visa, Mastercard, American Express, and bank transfers from Australian banks. We do not accept cash payments in accordance with our AML/CTF compliance requirements.',
      },
      {
        question: 'How does the price lock system work?',
        answer: 'When you add items to your cart, we lock the price for approximately 10 minutes. If you don\'t complete checkout within this time, prices will be updated to reflect current market rates.',
      },
      {
        question: 'Can I cancel my order after placing it?',
        answer: 'Due to the nature of precious metals and price volatility, orders cannot be cancelled once payment is processed. Please ensure all details are correct before completing your purchase.',
      },
      {
        question: 'Are prices displayed in AUD or USD?',
        answer: 'All binding prices are displayed in Australian Dollars (AUD). Some products may show USD pricing for reference, but AUD is the transaction currency.',
      },
    ],
  },
  {
    category: 'Identity Verification (KYC)',
    items: [
      {
        question: 'Why do I need to verify my identity?',
        answer: 'As an AUSTRAC-registered bullion dealer, we are legally required to verify customer identities for transactions of $5,000 AUD or more under the Anti-Money Laundering and Counter-Terrorism Financing Act 2006.',
      },
      {
        question: 'What documents are accepted for verification?',
        answer: 'We accept Australian passports, driver licences, and photo ID cards. For electronic verification via Stripe Identity, you\'ll need to photograph your document and take a selfie.',
      },
      {
        question: 'How long does verification take?',
        answer: 'Electronic verification through Stripe Identity typically completes within minutes. Manual verification may take 1-2 business days depending on document clarity and completeness.',
      },
      {
        question: 'Is my identity information secure?',
        answer: 'Yes. All identity documents are encrypted and securely processed. We use Stripe Identity for verification, which is PCI-DSS compliant and processes data in isolated, secure environments.',
      },
    ],
  },
  {
    category: 'Shipping & Delivery',
    items: [
      {
        question: 'How long does delivery take?',
        answer: 'Delivery timeframes depend on your location and chosen shipping method. Standard delivery within Australia typically takes 3-7 business days after your order is processed and cleared.',
      },
      {
        question: 'Is my shipment insured?',
        answer: 'Yes, all shipments are fully insured for their complete value from the moment they leave our facility until delivery is confirmed with your signature.',
      },
      {
        question: 'Do you ship internationally?',
        answer: 'Currently, we only ship to Australian addresses. International shipping may be available in the future.',
      },
      {
        question: 'What if I\'m not home for delivery?',
        answer: 'All deliveries require an adult signature. If you\'re not available, the courier will attempt redelivery or leave a card with instructions for collection from a secure location.',
      },
    ],
  },
  {
    category: 'Products & Pricing',
    items: [
      {
        question: 'Are your products authentic?',
        answer: 'Yes, all our bullion products are sourced from reputable mints and refineries. Each product comes with appropriate certification and authenticity guarantees.',
      },
      {
        question: 'Why do prices change so frequently?',
        answer: 'Precious metal prices are determined by global commodity markets and fluctuate constantly based on supply, demand, and economic factors. Our prices update in real-time to reflect market conditions.',
      },
      {
        question: 'What is the difference between spot price and retail price?',
        answer: 'The spot price is the current market price for raw precious metals. Retail prices include premiums for manufacturing, distribution, and dealer margins. Coins typically have higher premiums than bars due to their collectible nature and minting costs.',
      },
    ],
  },
  {
    category: 'Compliance & Reporting',
    items: [
      {
        question: 'What is a Threshold Transaction Report (TTR)?',
        answer: 'A TTR is a report we must submit to AUSTRAC for any cash transaction or international funds transfer of $10,000 AUD or more. This is a regulatory requirement, not an indication of suspicious activity.',
      },
      {
        question: 'What is Enhanced Due Diligence (EDD)?',
        answer: 'EDD is additional verification required when your cumulative transactions exceed $50,000 AUD. We\'ll ask for information about your source of wealth and the purpose of your bullion purchases.',
      },
      {
        question: 'Will my purchases be reported to the ATO?',
        answer: 'While we report to AUSTRAC as required by law, we do not routinely report purchases to the Australian Taxation Office. However, you may have tax obligations related to capital gains on bullion investments - please consult a tax professional.',
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/10 to-background py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-2">Frequently Asked Questions</h1>
          <p className="text-muted-foreground">Find answers to common questions about our services</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Quick Links */}
        <section className="mb-12">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Jump to Section</h2>
            <div className="flex flex-wrap gap-2">
              {faqs.map((section) => (
                <a
                  key={section.category}
                  href={`#${section.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                  className="bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary px-3 py-2 rounded-full text-sm transition-colors border border-border"
                >
                  {section.category}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Sections */}
        {faqs.map((section) => (
          <section
            key={section.category}
            id={section.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-foreground mb-4">{section.category}</h2>
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="space-y-6">
                {section.items.map((item, index) => (
                  <div key={index} className="border-b border-border pb-6 last:border-0 last:pb-0">
                    <h3 className="text-lg font-semibold text-primary mb-2">{item.question}</h3>
                    <p className="text-muted-foreground">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}

        {/* Still Have Questions */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Still Have Questions?</h2>
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <p className="text-card-foreground font-semibold mb-2">Contact Support</p>
            <p className="text-muted-foreground mb-4">
              Our team is here to help. Get in touch and we'll respond as soon as possible.
            </p>
            <div className="space-y-2">
              <p className="text-muted-foreground">
                <strong className="text-card-foreground">Email:</strong> support@australiannationalbullion.com.au
              </p>
              <p className="text-muted-foreground">
                <strong className="text-card-foreground">Phone:</strong> 1300 XXX XXX
              </p>
            </div>
          </div>
        </section>

        {/* Back Link */}
        <div className="pt-8 border-t border-border">
          <Link href="/" className="text-primary hover:underline font-medium">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
