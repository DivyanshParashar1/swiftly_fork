import Link from 'next/link';

export default function Hero() {
  return (
    <section className="pt-32 pb-24 bg-linear-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Geometric background elements */}
      <div className="absolute top-20 right-10 w-32 h-32 bg-red-500/10 rounded-2xl rotate-12 blur-xl"></div>
      <div className="absolute bottom-20 left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl"></div>
      
      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-block">
              <span className="px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-mono font-medium border-2 border-blue-200">
                ⚡ 10x Faster Applications
              </span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
              Apply to jobs <span className="text-blue-600">faster</span>. Upload your <span className="font-mono text-red-500">resume</span> once.
            </h1>
            
            <p className="text-lg text-gray-600 max-w-xl">
              Stop wasting time retyping your information for every job application. 
              Swiftly extracts your resume data and lets you reuse it <span className="font-mono text-gray-900 bg-gray-100 px-2 py-0.5 rounded">anywhere</span>.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="https://drive.google.com/drive/folders/1vvubNiNug3sqyMhbb1eL58K1h0DU4GUK?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-linear-to-r from-blue-600 to-blue-700 text-white text-lg font-medium rounded-full hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/30 text-center group"
              >
                <span className="flex items-center justify-center gap-2">
                  Download Extension
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>
              <Link 
                href="#how-it-works" 
                className="px-8 py-4 bg-white text-gray-900 text-lg font-medium rounded-full border-2 border-gray-300 hover:border-blue-600 hover:text-blue-600 transition-colors text-center"
              >
                See How It Works
              </Link>
            </div>

            <div className="flex items-center gap-8 pt-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-600 font-mono">Open source</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-600 font-mono">Privacy focused</span>
              </div>
            </div>
          </div>

          <div className="relative lg:h-125 hidden lg:flex items-center justify-center">
            <div className="relative w-full h-full">
              {/* Visual representation */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-full max-w-md">
                  {/* Resume icon with red accent */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-40 bg-white rounded-lg shadow-xl border-2 border-red-500 p-4">
                    <div className="space-y-2">
                      <div className="h-2 bg-gray-900 rounded w-3/4"></div>
                      <div className="h-2 bg-red-500 rounded w-full"></div>
                      <div className="h-2 bg-blue-500 rounded w-5/6"></div>
                      <div className="h-2 bg-gray-300 rounded w-4/6"></div>
                      <div className="mt-3 pt-2 border-t border-gray-200">
                        <div className="h-1.5 bg-gray-300 rounded w-full mb-1"></div>
                        <div className="h-1.5 bg-gray-300 rounded w-5/6 mb-1"></div>
                        <div className="h-1.5 bg-gray-300 rounded w-4/6"></div>
                      </div>
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  </div>

                  {/* Arrow with geometric shapes */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-24 bg-gray-300 mt-8"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-8 w-3 h-3 border-b-2 border-r-2 border-blue-600 rotate-45"></div>
                  
                  {/* Geometric accent shapes */}
                  <div className="absolute top-1/2 left-0 w-12 h-12 border-4 border-red-500 rotate-45 opacity-20"></div>
                  <div className="absolute top-1/3 right-0 w-16 h-16 bg-blue-500 rounded-full opacity-10"></div>

                  {/* Data cards with color coding */}
                  <div className="absolute bottom-0 left-0 right-0 grid grid-cols-2 gap-3 mt-32">
                    <div className="bg-blue-50 rounded-lg p-3 border-2 border-blue-500 relative group hover:scale-105 transition-transform">
                      <div className="text-xs font-mono font-semibold text-blue-900">profile.json</div>
                      <div className="h-1.5 bg-blue-500 rounded w-3/4 mt-2"></div>
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-sm rotate-45"></div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 border-2 border-red-500 relative group hover:scale-105 transition-transform">
                      <div className="text-xs font-mono font-semibold text-red-900">experience.js</div>
                      <div className="h-1.5 bg-red-500 rounded w-3/4 mt-2"></div>
                      <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full"></div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 border-2 border-purple-500 relative group hover:scale-105 transition-transform">
                      <div className="text-xs font-mono font-semibold text-purple-900">skills.ts</div>
                      <div className="h-1.5 bg-purple-500 rounded w-3/4 mt-2"></div>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 border-2 border-purple-500 rounded-sm rotate-12"></div>
                    </div>
                    <div className="bg-cyan-50 rounded-lg p-3 border-2 border-cyan-500 relative group hover:scale-105 transition-transform">
                      <div className="text-xs font-mono font-semibold text-cyan-900">education.py</div>
                      <div className="h-1.5 bg-cyan-500 rounded w-3/4 mt-2"></div>
                      <div className="absolute top-1/2 -left-1 w-2 h-2 bg-cyan-500"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-8 border-2 border-blue-500 shadow-lg relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-bl-3xl"></div>
            <div className="text-4xl font-bold text-blue-600 mb-2 font-mono relative">10x</div>
            <div className="text-gray-600 font-medium relative">Faster applications</div>
          </div>
          <div className="bg-white rounded-2xl p-8 border-2 border-red-500 shadow-lg relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 right-0 w-16 h-16 border-4 border-red-500/20 rotate-45"></div>
            <div className="text-4xl font-bold text-red-600 mb-2 font-mono relative">5 min</div>
            <div className="text-gray-600 font-medium relative">Setup time</div>
          </div>
          <div className="bg-white rounded-2xl p-8 border-2 border-gray-900 shadow-lg relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="absolute bottom-0 right-0 w-12 h-12 bg-gray-900 rounded-tl-2xl"></div>
            <div className="text-4xl font-bold text-gray-900 mb-2 font-mono relative">0</div>
            <div className="text-gray-600 font-medium relative">Repetitive typing</div>
          </div>
        </div>
      </div>
    </section>
  );
}
