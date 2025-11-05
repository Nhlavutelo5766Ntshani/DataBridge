import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-gray-700">
          Page Not Found
        </h2>
        <p className="mt-2 text-gray-600">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link 
          href="/" 
          className="mt-6 inline-block rounded-md bg-[#06B6D4] px-4 py-2 text-sm font-medium text-white hover:bg-[#0891b2]"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
