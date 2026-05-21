import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 relative overflow-hidden">
      {/* Geometric background */}
      <div className="absolute top-10 right-20 w-16 h-16 border-2 border-blue-500/10 rotate-45"></div>
      <div className="absolute bottom-10 left-20 w-20 h-20 bg-red-500/5 rounded-full"></div>
      
      <div className="max-w-7xl mx-auto px-6 py-16 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Section - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-6 group">
              <div className="w-10 h-10 bg-white group-hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors shadow-lg">
                <span className="text-gray-900 group-hover:text-white font-bold text-xl font-mono">S</span>
              </div>
              <span className="text-2xl font-bold text-white"><span className="font-mono">Swift</span>ly</span>
            </Link>
            <p className="text-gray-400 text-base mb-6 max-w-md leading-relaxed">
              A personal project to smoothen job applications. Upload your resume once and autofill application forms everywhere with our intelligent browser extension.
            </p>
            
            {/* Tech Stack */}
            {/* <div className="mb-6">
              <h4 className="text-white text-sm font-mono mb-3">Built with</h4>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-gray-800 text-blue-400 rounded-full text-xs font-mono border border-gray-700">Next.js</span>
                <span className="px-3 py-1 bg-gray-800 text-green-400 rounded-full text-xs font-mono border border-gray-700">Node.js</span>
                <span className="px-3 py-1 bg-gray-800 text-red-400 rounded-full text-xs font-mono border border-gray-700">Prisma</span>
                <span className="px-3 py-1 bg-gray-800 text-purple-400 rounded-full text-xs font-mono border border-gray-700">TypeScript</span>
              </div>
            </div> */}
            
            {/* Status dots */}
            {/* <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-400 text-xs font-mono">In Development</span>
              </div>
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              </div>
            </div> */}
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4 font-mono text-sm">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link href="#features" className="text-gray-400 hover:text-blue-400 text-sm transition-colors flex items-center gap-2 group">
                  <span className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  Features
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="text-gray-400 hover:text-blue-400 text-sm transition-colors flex items-center gap-2 group">
                  <span className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="#benefits" className="text-gray-400 hover:text-blue-400 text-sm transition-colors flex items-center gap-2 group">
                  <span className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  Benefits
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-gray-400 hover:text-green-400 text-sm transition-colors flex items-center gap-2 group">
                  <span className="text-green-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  Get Started
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-gray-400 hover:text-blue-400 text-sm transition-colors flex items-center gap-2 group">
                  <span className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="font-semibold text-white mb-4 font-mono text-sm">Connect</h3>
            <ul className="space-y-3">
              <li>
                <a href="https://nakshjoshi.in" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 text-sm transition-colors flex items-center gap-2 group">
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/>
                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/>
                  </svg>
                  Portfolio
                </a>
              </li>
              <li>
                <a href="https://github.com/nakshjoshi" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 text-sm transition-colors flex items-center gap-2 group">
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd"/>
                  </svg>
                  GitHub
                </a>
              </li>
              <li>
                <a href="https://linkedin.com/in/nakshjoshi" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 text-sm transition-colors flex items-center gap-2 group">
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd"/>
                  </svg>
                  LinkedIn
                </a>
              </li>
              <li>
                <a href="mailto:contact@nakshjoshi.in" className="text-gray-400 hover:text-blue-400 text-sm transition-colors flex items-center gap-2 group">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                  Email
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm font-mono">
              Made with <span className="text-red-500">❤</span> by <a href="https://nakshjoshi.in" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">nakshjoshi</a>
            </p>
            <p className="text-gray-500 text-xs font-mono">
              © {new Date().getFullYear()} Swiftly
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
