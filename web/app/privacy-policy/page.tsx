import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy – Swiftly',
  description:
    'Learn how Swiftly handles your resume and profile data. We are committed to user privacy and transparency.',
};

const sections = [
  {
    id: 'information-we-collect',
    color: 'blue',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    heading: 'informationWeCollect()',
    title: 'Information We Collect',
    items: [
      'User-selected resume information',
      'Profile information provided by the user',
      'Job application form field data required for autofill functionality',
    ],
  },
  {
    id: 'how-information-is-used',
    color: 'green',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    heading: 'howInformationIsUsed()',
    title: 'How Information Is Used',
    items: [
      'Provide autofill functionality',
      'Improve resume workflow productivity',
      'Maintain user preferences and selected resume settings',
    ],
  },
  {
    id: 'data-sharing',
    color: 'red',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
    heading: 'dataSharing()',
    title: 'Data Sharing',
    items: [
      'Swiftly does not sell user data to third parties.',
      'User information is not used for advertising purposes.',
    ],
  },
  {
    id: 'user-control',
    color: 'purple',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    heading: 'userControl()',
    title: 'User Control',
    items: [
      'Users remain fully in control of all submitted information and autofill actions.',
      'Autofill actions are initiated only through explicit user interaction.',
    ],
  },
  {
    id: 'security',
    color: 'cyan',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    heading: 'security()',
    title: 'Security',
    items: [
      'Swiftly uses reasonable security measures to protect user information during transmission and storage.',
    ],
  },
  {
    id: 'third-party-services',
    color: 'orange',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
    heading: 'thirdPartyServices()',
    title: 'Third-Party Services',
    items: [
      'Swiftly may communicate with backend services required for resume retrieval and autofill functionality.',
    ],
  },
];

const colorMap: Record<string, { border: string; bg: string; text: string; bullet: string; badge: string }> = {
  blue:   { border: 'border-blue-500',   bg: 'bg-blue-50',   text: 'text-blue-700',   bullet: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-700 border-blue-200' },
  green:  { border: 'border-green-500',  bg: 'bg-green-50',  text: 'text-green-700',  bullet: 'bg-green-500',  badge: 'bg-green-100 text-green-700 border-green-200' },
  red:    { border: 'border-red-500',    bg: 'bg-red-50',    text: 'text-red-700',    bullet: 'bg-red-500',    badge: 'bg-red-100 text-red-700 border-red-200' },
  purple: { border: 'border-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', bullet: 'bg-purple-500', badge: 'bg-purple-100 text-purple-700 border-purple-200' },
  cyan:   { border: 'border-cyan-500',   bg: 'bg-cyan-50',   text: 'text-cyan-700',   bullet: 'bg-cyan-500',   badge: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  orange: { border: 'border-orange-500', bg: 'bg-orange-50', text: 'text-orange-700', bullet: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700 border-orange-200' },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero / Header */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
        {/* Geometric background elements */}
        <div className="absolute top-20 right-10 w-32 h-32 bg-blue-500/10 rounded-2xl rotate-12 blur-xl" />
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-red-500/10 rounded-full blur-2xl" />
        <div className="absolute top-32 left-1/4 w-16 h-16 border-4 border-blue-500/10 rotate-45" />
        <div className="absolute bottom-20 right-1/4 w-10 h-10 bg-green-500/10 rounded-full" />

        <div className="max-w-4xl mx-auto px-6 relative">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm font-mono text-gray-400 mb-8">
            <Link href="/" className="hover:text-blue-600 transition-colors">~/swiftly</Link>
            <span>/</span>
            <span className="text-gray-700">privacy-policy</span>
          </div>

          {/* Badge */}
          <div className="inline-block mb-6">
            <span className="px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-mono font-medium border-2 border-blue-200">
              🔒 Privacy First
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-4">
            Privacy <span className="text-blue-600">Policy</span>
          </h1>

          <p className="text-lg text-gray-500 font-mono mb-8">
            <span className="text-gray-400">// </span>Last Updated:{' '}
            <span className="text-gray-900">May 2026</span>
          </p>

          <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
            Swiftly is a browser extension designed to help users autofill job application forms using their
            selected resume and profile information. Your privacy matters — this document explains exactly
            what we collect and how we use it.
          </p>

          {/* Quick nav chips */}
          <div className="flex flex-wrap gap-2 mt-10">
            {sections.map((s) => {
              const c = colorMap[s.color];
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className={`px-3 py-1.5 rounded-full text-xs font-mono border transition-all hover:-translate-y-0.5 hover:shadow-sm ${c.badge}`}
                >
                  {s.heading}
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Sections */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6 space-y-8">
          {sections.map((s) => {
            const c = colorMap[s.color];
            return (
              <div
                key={s.id}
                id={s.id}
                className={`bg-white rounded-2xl border-2 ${c.border} shadow-lg relative overflow-hidden group hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300`}
              >
                {/* Corner accent */}
                <div className={`absolute top-0 right-0 w-20 h-20 ${c.bg} rounded-bl-3xl opacity-60`} />

                <div className="relative p-8">
                  {/* Section header */}
                  <div className="flex items-start gap-4 mb-6">
                    <div className={`flex-shrink-0 w-10 h-10 ${c.bg} ${c.text} ${c.border} border-2 rounded-lg flex items-center justify-center`}>
                      {s.icon}
                    </div>
                    <div>
                      <p className={`text-xs font-mono ${c.text} mb-1`}>{s.heading}</p>
                      <h2 className="text-xl font-bold text-gray-900">{s.title}</h2>
                    </div>
                  </div>

                  {/* Items */}
                  <ul className="space-y-3">
                    {s.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className={`mt-2 w-1.5 h-1.5 flex-shrink-0 rounded-full ${c.bullet}`} />
                        <span className="text-gray-600 leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}

          {/* Contact card */}
          <div
            id="contact"
            className="bg-gray-900 rounded-2xl border-2 border-gray-800 shadow-lg relative overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="absolute top-10 right-20 w-16 h-16 border-2 border-blue-500/10 rotate-45" />
            <div className="absolute bottom-10 left-20 w-20 h-20 bg-red-500/5 rounded-full" />

            <div className="relative p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-10 h-10 bg-gray-800 text-white border-2 border-gray-700 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-mono text-gray-500 mb-1">contact()</p>
                  <h2 className="text-xl font-bold text-white">Contact</h2>
                </div>
              </div>

              <p className="text-gray-400 mb-6 leading-relaxed">
                For questions regarding this Privacy Policy, reach out directly:
              </p>

              <a
                href="mailto:nakshjoshi2004@gmail.com"
                className="inline-flex items-center gap-3 px-6 py-3 bg-white text-gray-900 rounded-full font-mono text-sm font-medium hover:bg-blue-600 hover:text-white transition-all shadow-md hover:shadow-blue-500/30 group"
              >
                <span className="text-blue-600 group-hover:text-white transition-colors">$</span>
                nakshjoshi2004@gmail.com
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </div>
          </div>

          {/* Back to home */}
          <div className="text-center pt-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-600 rounded-full font-mono text-sm hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
