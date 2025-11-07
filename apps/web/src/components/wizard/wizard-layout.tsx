"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { ReactNode } from "react";
import { StepNavigator } from "./step-navigator";

type WizardStep = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: "completed" | "current" | "pending";
};

type WizardLayoutProps = {
  steps: WizardStep[];
  currentStep: number;
  onStepChange: (stepIndex: number) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onComplete?: () => void;
  children: ReactNode;
  title?: string;
  subtitle?: string;
  allowNavigation?: boolean;
  isNextDisabled?: boolean;
  isPreviousDisabled?: boolean;
  isLoading?: boolean;
};

export const WizardLayout = ({
  steps,
  currentStep,
  onStepChange,
  onNext,
  onPrevious,
  onComplete,
  children,
  title,
  subtitle,
  allowNavigation = false,
  isNextDisabled = false,
  isPreviousDisabled = false,
  isLoading = false,
}: WizardLayoutProps) => {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="flex h-full bg-gray-50">
      {/* Sidebar Navigation */}
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          {title && (
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          )}
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>
        </div>

        {/* Step Navigator */}
        <div className="flex-1 overflow-y-auto p-4">
          <StepNavigator
            steps={steps}
            currentStep={currentStep}
            onStepClick={onStepChange}
            allowNavigation={allowNavigation}
          />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            {/* Current Step Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                {steps[currentStep]?.title}
              </h2>
              <p className="text-gray-600 mt-1">
                {steps[currentStep]?.description}
              </p>
            </div>

            {/* Step Content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {children}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-gray-200 bg-white px-8 py-4 flex-shrink-0">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onPrevious}
                disabled={isFirstStep || isPreviousDisabled || isLoading}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => window.history.back()}
                disabled={isLoading}
                className="text-gray-600 hover:text-gray-900"
              >
                Cancel
              </Button>
            </div>

            <div className="flex items-center gap-3">
              {!isLastStep ? (
                <Button
                  type="button"
                  onClick={onNext}
                  disabled={isNextDisabled || isLoading}
                  className={cn(
                    "gap-2",
                    "bg-primary hover:bg-primary/90 text-white"
                  )}
                >
                  {isLoading ? "Processing..." : "Continue"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={onComplete}
                  disabled={isNextDisabled || isLoading}
                  className={cn(
                    "gap-2",
                    "bg-emerald-600 hover:bg-emerald-700 text-white"
                  )}
                >
                  <Check className="w-4 h-4" />
                  {isLoading ? "Creating..." : "Complete"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
