import type { ComponentPropsWithRef } from 'react';
import { cx } from '../../utils/cx';
import styles from './Button.module.css';

// React 19 : "ref" est une prop ordinaire, transmise au <button> par le spread.
interface ButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: 'primary' | 'secondary' | 'quiet';
  size?: 'md' | 'lg';
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...rest
}: ButtonProps) => (
  <button
    type={type}
    className={cx(styles.button, styles[variant], styles[size], className)}
    {...rest}
  />
);
