import { useEffect } from "react";

export default function ErrorPage() {
  useEffect(() => {
    console.error("ErrorPage rendered - navigation to non-existent route or unhandled error");
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="max-w-md w-full">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-lg text-center">
          <h1 className="text-5xl font-bold text-slate-400 mb-2">404</h1>
          <h2 className="text-xl font-semibold text-slate-200 mb-2">
            Page not found
          </h2>
          <p className="text-slate-400 mb-6">
            The page you're looking for doesn't exist or an error occurred while loading it.
          </p>

          <div className="flex gap-2 justify-center">
            <button
              onClick={() => window.history.back()}
              className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-6 rounded transition-colors"
            >
              Go Back
            </button>
            <a
              href="/"
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-6 rounded transition-colors inline-block"
            >
              Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
