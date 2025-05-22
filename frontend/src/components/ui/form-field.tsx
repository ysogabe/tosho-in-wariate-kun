import React from "react";
import { Label } from "./label";
import { Input, InputProps } from "./input";
import { cn } from "@/lib/utils";

interface FormFieldProps extends Omit<InputProps, 'error'> {
  label: string;
  error?: string;
  optional?: boolean;
}

const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, className, optional, ...props }, ref) => {
    const id = React.useId();
    
    return (
      <div className="space-y-2">
        <Label htmlFor={id} optional={optional}>
          {label}
        </Label>
        <Input
          id={id}
          className={cn(className)}
          error={!!error}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          ref={ref}
          {...props}
        />
        {error && (
          <p id={`${id}-error`} className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";

export { FormField };
