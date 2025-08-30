"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get("redirect") || "/dashboard";

  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setServerError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        // Redirect to dashboard or intended page
        router.push(redirectUrl);
        router.refresh();
      } else {
        setServerError(result.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setServerError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Brand section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[var(--color-blue-ink)] to-blue-600 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <svg
            className="absolute bottom-0 left-0 w-96 h-96"
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="currentColor"
              d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,90,-16.3,89.8,-0.2C89.6,15.9,86.6,31.8,78.9,45.2C71.2,58.6,58.8,69.5,44.7,76.4C30.6,83.3,15.3,86.2,0.1,86C-15.1,85.8,-30.2,82.5,-44.3,75.6C-58.4,68.7,-71.5,58.2,-79.3,44.8C-87.1,31.4,-89.6,15.7,-89.8,-0.1C-90,-15.9,-87.9,-31.8,-80.4,-45.2C-72.9,-58.6,-60,-69.5,-45.9,-76.4C-31.8,-83.3,-15.9,-86.2,-0.1,-86C15.7,-85.8,31.4,-82.5,44.7,-76.4Z"
              transform="translate(100 100)"
            />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight">Data Analytics</h1>
            <p className="text-xl text-blue-100 leading-relaxed">
              The most comprehensive data visualization dashboard for inventory,
              procurement, and sales analytics
            </p>
            <Link
              href="https://github.com/ShenghaoisYummy/data-visualisation-dashboard"
              className="inline-flex items-center px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors backdrop-blur-sm border border-white/20"
            >
              Learn More
              <svg
                className="ml-2 w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-heading-1 font-bold text-[var(--color-night)]">
              Hello Again!
            </h2>
            <p className="mt-2 text-body text-gray-600">Welcome Back</p>
          </div>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-3">
              <Input
                type="text"
                autoComplete="username"
                required
                placeholder="Email Address"
                error={errors.username?.message}
                className="h-11"
                {...register("username")}
              />

              <Input
                type="password"
                autoComplete="current-password"
                required
                placeholder="Password"
                error={errors.password?.message}
                className="h-11"
                {...register("password")}
              />
            </div>

            {serverError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{serverError}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                loading={isLoading}
                className="w-full h-11 rounded-lg text-white font-medium"
              >
                Login
              </Button>
            </div>

            <div className="text-center pt-2">
              <Link
                href="#"
                className="text-sm text-gray-500 hover:text-[var(--color-blue-ink)] transition-colors"
              >
                Forgot Password
              </Link>
            </div>

            <div className="text-center pt-2">
              <p className="text-sm text-gray-600">
                Need an account?{" "}
                <Link
                  href="/register"
                  className="font-medium text-[var(--color-blue-ink)] hover:text-blue-700 transition-colors"
                >
                  Register with invitation code
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
