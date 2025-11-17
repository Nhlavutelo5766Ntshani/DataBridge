"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Database, Eye, EyeOff } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PATHS } from "@/lib/constants/paths";
import { signupAction } from "@/lib/actions/auth";

const SignupPage = () => {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signupAction(formData);
      
      if (!result.success) {
        const errorMessage = Array.isArray(result.error) 
          ? result.error.join(", ") 
          : result.error || "Failed to create account";
        setError(errorMessage);
        return;
      }

      router.push(PATHS.DASHBOARD.HOME);
    } catch {
      setError("Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-500 via-cyan-600 to-teal-500 relative overflow-hidden">
      {/* Decorative network pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-24 h-24 rounded-full border-4 border-white"></div>
        <div className="absolute top-40 left-40 w-16 h-16 rounded-full border-4 border-white"></div>
        <div className="absolute top-60 left-32 w-20 h-20 rounded-full border-4 border-white"></div>
        <div className="absolute bottom-40 left-24 w-28 h-28 rounded-full border-4 border-white"></div>
        <div className="absolute bottom-20 left-48 w-16 h-16 rounded-full border-4 border-white"></div>
        <div className="absolute top-32 right-32 w-20 h-20 rounded-full border-4 border-white"></div>
        <div className="absolute top-20 right-20 w-16 h-16 rounded-full border-4 border-white"></div>
        <div className="absolute bottom-32 right-40 w-24 h-24 rounded-full border-4 border-white"></div>
        <div className="absolute bottom-20 right-20 w-20 h-20 rounded-full border-4 border-white"></div>
        
        {/* Connecting lines */}
        <svg className="absolute inset-0 w-full h-full">
          <line x1="10%" y1="20%" x2="20%" y2="35%" stroke="white" strokeWidth="2" />
          <line x1="20%" y1="35%" x2="15%" y2="55%" stroke="white" strokeWidth="2" />
          <line x1="15%" y1="55%" x2="10%" y2="75%" stroke="white" strokeWidth="2" />
          <line x1="10%" y1="75%" x2="22%" y2="80%" stroke="white" strokeWidth="2" />
          <line x1="85%" y1="25%" x2="90%" y2="15%" stroke="white" strokeWidth="2" />
          <line x1="85%" y1="25%" x2="82%" y2="70%" stroke="white" strokeWidth="2" />
          <line x1="82%" y1="70%" x2="90%" y2="80%" stroke="white" strokeWidth="2" />
        </svg>
      </div>

      {/* Logo at top */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-2">
          <Database className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">DataBridge</h1>
      </div>

      {/* Centered Signup form */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create account</h2>
            <p className="text-gray-600">Sign up to start migrating your data</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700 font-medium">
                Full Name
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                required
                disabled={isLoading}
                className="h-11 bg-gray-50 border-gray-200 focus:border-cyan-500 focus:ring-cyan-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Email address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                disabled={isLoading}
                className="h-11 bg-gray-50 border-gray-200 focus:border-cyan-500 focus:ring-cyan-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  minLength={8}
                  className="h-11 bg-gray-50 border-gray-200 focus:border-cyan-500 focus:ring-cyan-500 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  minLength={8}
                  className="h-11 bg-gray-50 border-gray-200 focus:border-cyan-500 focus:ring-cyan-500 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-medium text-base shadow-lg hover:shadow-xl transition-all mt-6"
            >
              {isLoading ? "Creating account..." : "Create account"}
            </Button>

            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href={PATHS.PUBLIC.LOGIN}
                className="text-cyan-600 hover:text-cyan-700 font-semibold"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;

