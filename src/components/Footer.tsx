import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div>
            <div className="flex items-center mb-4">
              <Image
                src="/anblogo.png"
                alt="Australian National Bullion"
                width={40}
                height={40}
                className="mr-3"
              />
              <h3 className="text-white font-bold text-lg">Australian National Bullion</h3>
            </div>
            <p className="text-sm mb-4">
              Australia&#39;s trusted source for investment-grade precious metals. 
              Providing secure bullion transactions since establishment.
            </p>
            <div className="flex space-x-4">
              {/* Social Media Links */}
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-500 transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-500 transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-500 transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-500 transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-white font-bold mb-4">Customer Service</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/products" className="hover:text-yellow-500 transition-colors">
                  Browse Products
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="hover:text-yellow-500 transition-colors">
                  Live Pricing
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-yellow-500 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-yellow-500 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-yellow-500 transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/pickup-information" className="hover:text-yellow-500 transition-colors">
                  Pickup Information
                </Link>
              </li>
              <li>
                <Link href="/returns-refunds" className="hover:text-yellow-500 transition-colors">
                  Returns & Refunds
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div>
            <h4 className="text-white font-bold mb-4">Legal & Compliance</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy-policy" className="hover:text-yellow-500 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-conditions" className="hover:text-yellow-500 transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/aml-policy" className="hover:text-yellow-500 transition-colors">
                  AML/CTF Policy
                </Link>
              </li>
              <li>
                <Link href="/kyc-requirements" className="hover:text-yellow-500 transition-colors">
                  KYC Requirements
                </Link>
              </li>
              <li>
                <Link href="/security" className="hover:text-yellow-500 transition-colors">
                  Security & Insurance
                </Link>
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-400">
                ABN: XX XXX XXX XXX
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Australian Regulated Dealer
              </p>
              <p className="text-xs text-gray-400 mt-1">
              AUSTRAC Registration Number: 100888166
            </p>
            </div>
          </div>

          {/* Contact & Payment */}
          <div>
            <h4 className="text-white font-bold mb-4">Contact Information</h4>
            <ul className="space-y-2 text-sm mb-6">
              <li className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>1300 XXX XXX</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>info@australiannationalbullion.com.au</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Sydney, NSW, Australia</span>
              </li>
            </ul>

            <h5 className="text-white font-semibold mb-2 text-sm">We Accept</h5>
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="bg-white rounded px-2 py-1 text-xs font-semibold text-gray-800">
                VISA
              </div>
              <div className="bg-white rounded px-2 py-1 text-xs font-semibold text-gray-800">
                Mastercard
              </div>
              <div className="bg-white rounded px-2 py-1 text-xs font-semibold text-gray-800">
                AMEX
              </div>
              <div className="bg-white rounded px-2 py-1 text-xs font-semibold text-gray-800">
                Bank Transfer
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-xs text-green-500 font-semibold">Secure Transactions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer Section */}
      <div className="bg-gray-950 border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="text-xs text-gray-500 space-y-2">
            <p>
              <strong className="text-gray-400">Important Disclaimer:</strong> Precious metals investments carry risk. 
              Past performance is not indicative of future results. Prices are subject to market fluctuations. 
              All transactions are subject to Australian AML/CTF compliance requirements.
            </p>
            <p>
              Australian National Bullion is committed to responsible trading practices and full compliance with 
              Australian financial regulations including the Anti-Money Laundering and Counter-Terrorism Financing Act 2006.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-black border-t border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <p>© {currentYear} Australian National Bullion. All rights reserved.</p>
            <p className="mt-2 md:mt-0">
              Secured by <span className="text-yellow-500 font-semibold">Stripe</span> | 
              Prices updated in real-time
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
