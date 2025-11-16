"use client";

import { Input } from "../ui/input";
import { Field, FieldLabel, FieldContent, FieldError } from "../ui/field";
import { cn } from "@/lib/utils";

const autofillStyles =
  "[&:-webkit-autofill]:bg-white [&:-webkit-autofill]:shadow-[0_0_0_30px_white_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:black] [&:-webkit-autofill]:text-black dark:[&:-webkit-autofill]:bg-gray-900 dark:[&:-webkit-autofill]:shadow-[0_0_0_30px_rgb(17_24_39)_inset] dark:[&:-webkit-autofill]:[-webkit-text-fill-color:white] dark:[&:-webkit-autofill]:text-white";

interface FormFieldProps {
  field: {
    name: string;
    state: {
      value: string;
      meta: {
        errors: Array<any>;
      };
    };
    handleBlur: () => void;
    handleChange: (value: string) => void;
  };
  label: string;
  type?: string;
  placeholder?: string;
}

export function FormField({
  field,
  label,
  type = "text",
  placeholder,
}: FormFieldProps) {
  // Transform TanStack Form errors to match FieldError expected format
  const errors = field.state.meta.errors
    .filter((error): error is { message?: string } => error != null)
    .map((error) => (typeof error === "string" ? { message: error } : error));

  return (
    <Field data-invalid={errors.length > 0}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <FieldContent>
        <Input
          id={field.name}
          name={field.name}
          type={type}
          placeholder={placeholder}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          className={cn(autofillStyles)}
        />
        <FieldError errors={errors} />
      </FieldContent>
    </Field>
  );
}

