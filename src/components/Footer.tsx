import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white font-semibold mb-4">PainOptix</h3>
            <p className="text-sm">
              Personalized educational guides for back pain, designed by Bradley W. Carpentier, MD.
            </p>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/my-assessments" className="hover:text-white transition-colors">
                  My Assessments
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="hover:text-white transition-colors">
                  Medical Disclaimer
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  What PainFinder Is
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li>Email: support@painoptix.com</li>
              <li>Website: www.painoptix.com</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm">
            © {currentYear} PainOptix. All rights reserved.
          </p>
          <p className="text-xs mt-2 sm:mt-0 text-gray-400">
            Not a substitute for professional medical advice
          </p>
        </div>
      </div>
    </footer>
  )
}