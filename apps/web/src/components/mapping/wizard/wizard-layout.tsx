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
  onBack,
  onCancel,
  onContinue,
  canContinue = true,
  isLastStep = false,
}: WizardLayoutProps) => {
  const progressPercentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${projectId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Project
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{projectName}</h1>
            <p className="text-sm text-gray-600">Visual data mapping and migration</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">Migration Progress</span>
          <div className="relative w-24 h-24">
            <svg className="transform -rotate-90 w-24 h-24">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-gray-200"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={2 * Math.PI * 40 * (1 - progressPercentage / 100)}
                className="text-[#06B6D4] transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-[#06B6D4]">{progressPercentage}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 bg-white border-r p-6 overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Migration Steps</h2>
            <p className="text-xs text-gray-600">Click on any step to navigate and edit</p>
          </div>

          <nav className="space-y-2">
            {steps.map((step, index) => {
              const stepNumber = index + 1;
              const isCompleted = step.status === "completed";
              const isCurrent = step.status === "current";
              const isPending = step.status === "pending";

              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex gap-4 p-4 rounded-lg border-2 transition-all cursor-pointer",
                    isCurrent && "border-[#06B6D4] bg-[#06B6D4]/5",
                    isCompleted && "border-gray-200 bg-white hover:bg-gray-50",
                    isPending && "border-gray-200 bg-gray-50 opacity-60"
                  )}
                >
                  <div className="flex-shrink-0">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm",
                        isCompleted && "bg-[#06B6D4] text-white",
                        isCurrent && "bg-[#06B6D4] text-white ring-4 ring-[#06B6D4]/20",
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

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">{children}</div>
        </main>
      </div>

      <footer className="bg-white border-t px-6 py-4 flex items-center justify-between">
        <div className="flex gap-3">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>

        {onContinue && (
          <Button
            onClick={onContinue}
            disabled={!canContinue}
            className="bg-[#06B6D4] hover:bg-[#0891b2] text-white"
          >
            {isLastStep ? "Execute Migration" : "Continue"}
          </Button>
        )}
      </footer>
    </div>
  );
};

