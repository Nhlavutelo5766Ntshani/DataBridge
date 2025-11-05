"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export const dynamic = "force-dynamic";

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
        <Link href="/" className="mt-6 inline-block">
          <Button className="gap-2">
            <Home className="h-4 w-4" />
            Go Home
          </Button>

export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f9fafb',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '4rem', fontWeight: 'bold', color: '#111827' }}>404</h1>
        <h2 style={{ marginTop: '1rem', fontSize: '1.5rem', fontWeight: '600', color: '#374151' }}>
          Page Not Found
        </h2>
        <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link 
          href="/" 
          style={{ 
            display: 'inline-block',
            marginTop: '1.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#06B6D4',
            color: 'white',
            borderRadius: '0.375rem',
            textDecoration: 'none',
            fontWeight: '500'
          }}
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}


