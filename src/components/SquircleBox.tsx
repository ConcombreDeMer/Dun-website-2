import { Squircle, type SquircleProps } from '@squircle-js/react';
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

type SquircleBoxProps<E extends ElementType = 'div'> = SquircleProps &
  Omit<ComponentPropsWithoutRef<E>, keyof SquircleProps> & {
    children?: ReactNode;
  };

export function SquircleBox<E extends ElementType = 'div'>({
  cornerRadius = 21,
  cornerSmoothing = 1,
  ...props
}: SquircleBoxProps<E>) {
  return <Squircle cornerRadius={cornerRadius} cornerSmoothing={cornerSmoothing} {...props} />;
}
