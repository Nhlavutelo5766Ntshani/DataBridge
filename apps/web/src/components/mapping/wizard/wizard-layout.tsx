"use client";

import { type ReactNode } from "react";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

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
    <div className="h-full flex flex-col bg-gray-100">
      {/* PART 1: Top Header - Ultra Compact */}
      <div className="bg-white shadow-sm px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between max-w-[1600px] mx-auto">
          {/* Left: Back button + Title */}
          <div className="flex items-center gap-3">
            <Link href={`/projects/${projectId}`}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{projectName}</h1>
              <p className="text-xs text-gray-500">Visual data mapping and migration</p>
            </div>
          </div>

          {/* Right: Progress indicator - Smaller */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600">Migration Progress</span>
            <div className="relative w-12 h-12">
              <svg className="transform -rotate-90 w-12 h-12">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="transparent"
                  className="text-gray-200"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 20}
                  strokeDashoffset={2 * Math.PI * 20 * (1 - progressPercentage / 100)}
                  className="text-[#06B6D4] transition-all duration-500"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-[#06B6D4]">{progressPercentage}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WHITE SPACE GAP between header and content */}
      <div className="p-4 flex flex-1 overflow-hidden">
        <div className="flex gap-4 flex-1 max-w-[1600px] mx-auto w-full">
          {/* PART 2: Left Sidebar - Migration Steps (White panel with border) */}
          <aside className="w-80 bg-white rounded-lg shadow-sm border border-gray-200 flex-shrink-0 overflow-y-auto">
            <div className="p-6 border-b bg-gray-50">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Migration Steps</h2>
              <p className="text-xs text-gray-600">Click on any step to navigate and edit</p>
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
                    isCompleted && "border-gray-200 bg-white hover:bg-gray-50",
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
                      {isCompleted ? <Check className="w-5 h-5" /> : stepNumber}
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
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{step.description}</p>
                  </div>
                </div>
              );
            })}
            </nav>
          </aside>

          {/* PART 3: Right Content Area - Main content (White panel with border) */}
          <main className="flex-1 flex flex-col overflow-hidden bg-white rounded-lg shadow-sm border border-gray-200">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

