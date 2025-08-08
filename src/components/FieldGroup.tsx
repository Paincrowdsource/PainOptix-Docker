import React from 'react';
import * as Label from '@radix-ui/react-label';
import * as RadioGroup from '@radix-ui/react-radio-group';
import * as Checkbox from '@radix-ui/react-checkbox';
import * as Slider from '@radix-ui/react-slider';
import { CheckIcon } from 'lucide-react';

interface FieldGroupProps {
  children: React.ReactNode;
  className?: string;
  'data-test'?: string;
}

export function FieldGroup({ children, className = '', 'data-test': dataTest }: FieldGroupProps) {
  return (
    <div className={`space-y-4 ${className}`} data-test={dataTest}>
      {children}
    </div>
  );
}

interface FormLabelProps {
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormLabel({ htmlFor, required, children, className = '' }: FormLabelProps) {
  return (
    <Label.Root
      htmlFor={htmlFor}
      className={`block text-sm font-medium text-gray-700 mb-1 ${className}`}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </Label.Root>
  );
}

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export function FormInput({ error, className = '', ...props }: FormInputProps) {
  return (
    <div>
      <input
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p data-test="error-message" className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

interface FormRadioGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  error?: string;
}

export function FormRadioGroup({ value, onValueChange, children, error }: FormRadioGroupProps) {
  return (
    <div>
      <RadioGroup.Root
        value={value}
        onValueChange={onValueChange}
        className="space-y-2"
      >
        {children}
      </RadioGroup.Root>
      {error && (
        <p data-test="error-message" className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

interface FormRadioItemProps {
  value: string;
  id: string;
  children: React.ReactNode;
}

export function FormRadioItem({ value, id, children }: FormRadioItemProps) {
  return (
    <div className="flex items-center space-x-3 w-full">
      <RadioGroup.Item
        value={value}
        id={id}
        className="w-5 h-5 rounded-full border-2 border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 data-[state=checked]:border-blue-600 data-[state=checked]:border-[6px] transition-all duration-200"
      >
        <RadioGroup.Indicator className="flex items-center justify-center w-full h-full relative" />
      </RadioGroup.Item>
      <Label.Root htmlFor={id} className="text-base text-gray-700 cursor-pointer flex-1 select-none">
        {children}
      </Label.Root>
    </div>
  );
}

interface FormCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id: string;
  children: React.ReactNode;
}

export function FormCheckbox({ checked, onCheckedChange, id, children }: FormCheckboxProps) {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        id={id}
        className="w-4 h-4 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
      >
        <Checkbox.Indicator className="flex items-center justify-center text-white">
          <CheckIcon className="w-3 h-3" />
        </Checkbox.Indicator>
      </Checkbox.Root>
      <Label.Root htmlFor={id} className="text-sm text-gray-700 cursor-pointer">
        {children}
      </Label.Root>
    </div>
  );
}

interface FormSliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  error?: string;
}

export function FormSlider({ 
  value, 
  onValueChange, 
  min = 0, 
  max = 10, 
  step = 1, 
  label,
  error 
}: FormSliderProps) {
  return (
    <div className="space-y-2">
      {label && (
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm text-gray-500">{value[0]}</span>
        </div>
      )}
      <Slider.Root
        value={value}
        onValueChange={onValueChange}
        max={max}
        min={min}
        step={step}
        className="relative flex items-center w-full h-8 touch-none"
      >
        <Slider.Track className="bg-gray-200 relative flex-1 rounded-full h-3 overflow-hidden">
          <Slider.Range className="absolute rounded-full h-full transition-colors" 
            style={{
              background: value[0] <= 3 ? '#10b981' : // Green for low pain
                         value[0] <= 6 ? '#f59e0b' : // Yellow for moderate
                         '#ef4444' // Red for severe
            }}
          />
        </Slider.Track>
        <Slider.Thumb 
          className="block w-6 h-6 bg-white border-2 rounded-full shadow-lg transition-all hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-500/20 cursor-grab active:cursor-grabbing" 
          style={{
            borderColor: value[0] <= 3 ? '#10b981' : 
                        value[0] <= 6 ? '#f59e0b' : 
                        '#ef4444'
          }}
        />
      </Slider.Root>
      {error && (
        <p data-test="error-message" className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div data-test="error-message" className="rounded-md bg-red-50 p-4 mb-4">
      <div className="flex">
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            {message}
          </h3>
        </div>
      </div>
    </div>
  );
} 