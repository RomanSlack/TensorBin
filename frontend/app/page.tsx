export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-3xl font-light text-gray-900 mb-6">
            TensorBin
          </h1>
          <p className="text-sm text-gray-500 mb-12">
            Anonymous AI model sharing
          </p>
          
          <div className="max-w-md mx-auto mb-12">
            <div className="flex">
              <input
                type="text"
                placeholder="Search models..."
                className="flex-1 px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:border-gray-500"
              />
              <button className="px-6 py-3 bg-gray-900 text-white text-sm hover:bg-gray-800">
                Search
              </button>
            </div>
          </div>

          <div className="space-x-6 mb-16">
            <a
              href="/auth/register"
              className="inline-block px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
            >
              Upload
            </a>
            <a
              href="/browse"
              className="inline-block px-4 py-2 text-gray-600 hover:text-gray-900 text-sm"
            >
              Browse
            </a>
          </div>
        </div>

        <div className="text-center mb-16">
          <div className="grid grid-cols-2 gap-8 max-w-md mx-auto">
            <div className="text-left">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Formats</h3>
              <ul className="text-xs text-gray-600 space-y-1 font-mono">
                <li>.safetensors</li>
                <li>.ckpt</li>
                <li>.pth</li>
                <li>.bin</li>
                <li>.pt</li>
              </ul>
            </div>
            <div className="text-left">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Features</h3>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>Up to 10GB files</li>
                <li>Tag organization</li>
                <li>Anonymous downloads</li>
                <li>No expiration</li>
                <li>Direct links</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center border-t border-gray-200 pt-8">
          <p className="text-xs text-gray-400 mb-4">
            Community • Open source • No tracking
          </p>
          <div className="space-x-4 text-xs text-gray-500">
            <a href="/terms" className="hover:text-gray-700">Terms</a>
            <a href="/privacy" className="hover:text-gray-700">Privacy</a>
            <a href="/api" className="hover:text-gray-700">API</a>
          </div>
        </div>
      </div>
    </div>
  );
}