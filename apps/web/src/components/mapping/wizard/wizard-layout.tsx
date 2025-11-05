"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { type ReactNode } from "react";

type WizardStep = {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  status: "completed" | "current" | "pending";
};

type WizardLayoutProps = {
  projectId: string;
  projectName: string;
  currentStep: number;
  totalSteps: number;
  steps: WizardStep[];
  children: ReactNode;
  onBack?: () => void;
  onCancel?: () => void;
  onContinue?: () => void;
  canContinue?: boolean;
  isLastStep?: boolean;
};

export const WizardLayout = ({
  projectId,
  projectName,
  currentStep,
  totalSteps,
  steps,
  children,
}: WizardLayoutProps) => {
  const progressPercentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* PART 1: Top Header - Separated from notification area */}
      <header className="flex h-16 shrink-0 items-center justify-between bg-white shadow z-50 relative px-6">
        {/* Left: Back button + Title */}
        <div className="flex items-center gap-3">
          <Link href={`/projects/${projectId}`}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{projectName}</h1>
            <p className="text-sm text-gray-600 mt-0.5">
              Step {currentStep} of {totalSteps}
            </p>
          </div>
        </div>

        {/* Right: Progress indicator */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              Migration Progress
            </div>
            <div className="text-2xl font-bold text-primary">
              {progressPercentage}%
            </div>
          </div>
          <div className="w-16 h-16 relative">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                className="text-gray-200"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 28}
                strokeDashoffset={
                  2 * Math.PI * 28 * (1 - progressPercentage / 100)
                }
                className="text-primary transition-all duration-500 ease-out"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </header>

      {/* Main content area with proper height calculation */}
      <div className="flex-1 flex overflow-hidden p-4 h-[calc(100vh-64px)]">
        <div className="flex gap-4 flex-1 max-w-[1600px] mx-auto w-full">
          {/* PART 2: Left Sidebar - Migration Steps (White panel with border) */}
          <aside className="w-80 bg-white rounded-lg shadow-sm border border-gray-200 flex-shrink-0">
            <div className="p-6 border-b bg-gray-50">
              <h2 className="text-base font-semibold text-gray-900 mb-1">
                Migration Steps
              </h2>
              <p className="text-xs text-gray-600">
                Click on any step to navigate and edit
              </p>
            </div>

            <nav className="p-4 space-y-2">
              {steps.map((step, index) => {
                const stepNumber = index + 1;
                const isCompleted = step.status === "completed";
                const isCurrent = step.status === "current";
                const isPending = step.status === "pending";

                return (
                  <div
                    key={step.id}
                    className={cn(
                      "flex gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer",
                      isCurrent && "border-[#06B6D4] bg-[#06B6D4]/5 shadow-sm",
                      isCompleted &&
                        "border-gray-200 bg-white hover:bg-gray-50",
                      isPending && "border-gray-200 bg-gray-50 opacity-60"
                    )}
                  >
                    <div className="flex-shrink-0">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm",
                          isCompleted && "bg-[#06B6D4] text-white",
                          isCurrent && "bg-[#06B6D4] text-white",
                          isPending && "bg-gray-200 text-gray-600"
                        )}
                      >
                        {isCompleted ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          stepNumber
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3
                          className={cn(
                            "font-semibold text-sm",
                            isCurrent && "text-gray-900",
                            isCompleted && "text-gray-700",
                            isPending && "text-gray-500"
                          )}
                        >
                          {step.title}
                        </h3>
                        {isCurrent && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#06B6D4] text-white">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </nav>
          </aside>

          {/* PART 3: Right Content Area - Main content (White panel with border) */}
          <main className="flex-1 flex flex-col overflow-hidden bg-white rounded-lg shadow-sm border border-gray-200 min-h-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
