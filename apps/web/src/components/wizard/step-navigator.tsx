"use client";

import { cn } from "@/lib/utils/cn";
import { CheckCircle2 } from "lucide-react";

type WizardStep = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: "completed" | "current" | "pending";
};

type StepNavigatorProps = {
  steps: WizardStep[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  allowNavigation?: boolean;
};

export const StepNavigator = ({
  steps,
  currentStep,
  onStepClick,
  allowNavigation = false,
}: StepNavigatorProps) => {
  const handleStepClick = (stepIndex: number): void => {
    if (!allowNavigation || !onStepClick) return;
    onStepClick(stepIndex);
  };

  return (
    <div className="space-y-2">
      {steps.map((step, idx) => {
        const isActive = idx === currentStep;
        const isCompleted = idx < currentStep;
        const isPending = idx > currentStep;
        const isClickable =
          allowNavigation &&
          onStepClick &&
          (isCompleted || isActive || isPending);

        return (
          <div
            key={step.id}
            className={cn(
              "relative flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
              isActive && "bg-primary/10 border border-primary/20 shadow-sm",
              isCompleted && "bg-emerald-50 border border-emerald-200/50",
              isPending &&
                "bg-gray-50/60 border border-gray-200/50 hover:bg-gray-50",
              isClickable && "cursor-pointer hover:shadow-sm"
            )}
            role={isClickable ? "button" : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onClick={() => handleStepClick(idx)}
            onKeyDown={(e) => {
              if (isClickable && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                handleStepClick(idx);
              }
            }}
          >
            {/* Icon/Status Indicator */}
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 transition-all duration-200",
                isActive && "bg-primary text-white",
                isCompleted && "bg-emerald-600 text-white",
                isPending && "bg-gray-200 text-gray-500"
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <div className="text-sm font-medium">{idx + 1}</div>
              )}
            </div>

            {/* Step Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3
                  className={cn(
                    "text-sm font-medium transition-colors",
                    isActive && "text-gray-900",
                    isCompleted && "text-emerald-900",
                    isPending && "text-gray-600"
                  )}
                >
                  {step.title}
                </h3>
              </div>
              <p
                className={cn(
                  "text-xs mt-0.5 transition-colors",
                  isActive && "text-gray-600",
                  isCompleted && "text-emerald-700",
                  isPending && "text-gray-500"
                )}
              >
                {step.description}
              </p>
            </div>

            {/* Custom Icon (if provided) */}
            {step.icon && (
              <div
                className={cn(
                  "flex-shrink-0 transition-colors",
                  isActive && "text-primary",
                  isCompleted && "text-emerald-600",
                  isPending && "text-gray-400"
                )}
              >
                {step.icon}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
