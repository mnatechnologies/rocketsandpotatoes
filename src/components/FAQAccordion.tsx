'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSection {
  category: string;
  items: FAQItem[];
}

export default function FAQAccordion({ sections }: { sections: FAQSection[] }) {
  const [openItem, setOpenItem] = useState<string | null>(null);

  const toggle = (key: string) => {
    setOpenItem(openItem === key ? null : key);
  };

  return (
    <>
      {sections.map((section) => (
        <section
          key={section.category}
          id={section.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-foreground mb-4">{section.category}</h2>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="divide-y divide-border">
              {section.items.map((item, index) => {
                const key = `${section.category}-${index}`;
                const isOpen = openItem === key;
                return (
                  <div key={index}>
                    <button
                      onClick={() => toggle(key)}
                      className="w-full flex items-center justify-between text-left px-6 py-4 hover:bg-muted/30 transition-colors"
                    >
                      <span className="text-base font-semibold text-foreground pr-4">
                        {item.question}
                      </span>
                      <ChevronDown
                        className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-200 ${
                        isOpen ? 'max-h-96' : 'max-h-0'
                      }`}
                    >
                      <p className="px-6 pb-4 text-muted-foreground leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
