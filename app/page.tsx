import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg"></div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">AIgent</span>
          </div>
          <div className="flex items-center space-x-6">
            <Link href="/auth" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Sign In
            </Link>
            <Link href="/auth" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full font-medium hover:opacity-90 transition-opacity">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
          Your Intelligent
          <span className="block bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            AI Assistant
          </span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-10">
          Transform your workflow with our advanced AI agent. Automate tasks, analyze data, and make smarter decisions with artificial intelligence that understands your needs.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-full font-medium text-lg hover:opacity-90 transition-opacity shadow-lg">
            Start Free Trial
          </Link>
          <button className="border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-full font-medium text-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Watch Demo
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Powerful Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-400 rounded-lg flex items-center justify-center mb-6">
              <span className="text-white text-2xl">🤖</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Smart Automation</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Automate repetitive tasks with intelligent workflows that learn and adapt to your patterns.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-6">
              <span className="text-white text-2xl">🧠</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Advanced Analytics</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Get deep insights from your data with AI-powered analysis and predictive modeling.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center mb-6">
              <span className="text-white text-2xl">⚡</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Real-time Processing</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Process information in real-time with lightning-fast responses and minimal latency.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Simple Pricing
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border-2 border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Starter</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">$29</span>
              <span className="text-gray-600 dark:text-gray-400">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center text-gray-600 dark:text-gray-400">
                <span className="text-green-500 mr-2">✓</span> Basic AI Assistant
              </li>
              <li className="flex items-center text-gray-600 dark:text-gray-400">
                <span className="text-green-500 mr-2">✓</span> 1000 requests/month
              </li>
              <li className="flex items-center text-gray-600 dark:text-gray-400">
                <span className="text-green-500 mr-2">✓</span> Email Support
              </li>
            </ul>
            <Link href="/auth" className="block w-full text-center border-2 border-blue-500 text-blue-500 dark:text-blue-400 px-6 py-3 rounded-full font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
              Get Started
            </Link>
          </div>
          <div className="bg-gradient-to-b from-blue-500 to-purple-600 p-8 rounded-2xl shadow-lg transform scale-105">
            <div className="inline-block bg-white text-blue-600 px-4 py-1 rounded-full text-sm font-medium mb-4">
              Most Popular
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Pro</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">$99</span>
              <span className="text-blue-200">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center text-white">
                <span className="mr-2">✓</span> Advanced AI Assistant
              </li>
              <li className="flex items-center text-white">
                <span className="mr-2">✓</span> 10,000 requests/month
              </li>
              <li className="flex items-center text-white">
                <span className="mr-2">✓</span> Priority Support
              </li>
              <li className="flex items-center text-white">
                <span className="mr-2">✓</span> Custom Integrations
              </li>
            </ul>
            <Link href="/auth" className="block w-full text-center bg-white text-blue-600 px-6 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors">
              Get Started
            </Link>
          </div>
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border-2 border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Enterprise</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">Custom</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center text-gray-600 dark:text-gray-400">
                <span className="text-green-500 mr-2">✓</span> Full AI Suite
              </li>
              <li className="flex items-center text-gray-600 dark:text-gray-400">
                <span className="text-green-500 mr-2">✓</span> Unlimited Requests
              </li>
              <li className="flex items-center text-gray-600 dark:text-gray-400">
                <span className="text-green-500 mr-2">✓</span> 24/7 Support
              </li>
              <li className="flex items-center text-gray-600 dark:text-gray-400">
                <span className="text-green-500 mr-2">✓</span> Dedicated Account Manager
              </li>
            </ul>
            <Link href="/auth" className="block w-full text-center border-2 border-blue-500 text-blue-500 dark:text-blue-400 px-6 py-3 rounded-full font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-12 max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-blue-100 text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of businesses already using our AI agent to automate their processes and drive growth.
          </p>
          <Link href="/auth" className="inline-block bg-white text-blue-600 px-10 py-4 rounded-full font-medium text-lg hover:bg-gray-100 transition-colors shadow-lg">
            Start Your Free Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 border-t border-gray-200 dark:border-gray-800">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-6 md:mb-0">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg"></div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">AIgent</span>
          </div>
          <div className="text-gray-600 dark:text-gray-400 text-center md:text-right">
            <p>© 2024 AIgent. All rights reserved.</p>
            <p className="mt-2">Intelligent AI solutions for modern businesses</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
