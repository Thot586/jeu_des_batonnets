import type { ComponentPropsWithRef, MouseEvent } from 'react';
import { useFeedback } from '../../feedback/FeedbackContext';
import { cx } from '../../utils/cx';
import styles from './Button.module.css';

// React 19 : "ref" est une prop ordinaire, transmise au <button> par le spread.
interface ButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: 'primary' | 'secondary' | 'quiet';
  size?: 'md' | 'lg';
}

/** Bouton de papier : il se soulève au survol, s'aplatit sous le doigt, et tapote comme du carton. */
export const Button = ({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  onClick,
  ...rest
}: ButtonProps) => {
  const { play, buzz } = useFeedback();

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    play('tap');
    buzz('tap');
    onClick?.(event);
  };

  return (
    <button
      type={type}
      className={cx(styles.button, styles[variant], styles[size], className)}
      onClick={handleClick}
      {...rest}
    />
  );
};
