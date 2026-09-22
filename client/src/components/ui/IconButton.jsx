import { forwardRef } from 'react';
import Button from './Button';

/**
 * IconButton — an icon-only control with a mandatory accessible label.
 *
 * The app had ~270 `<button>` elements against 26 `aria-*` attributes, and
 * most of the gap was icon-only controls: a lucide glyph inside a button and
 * nothing a screen reader can announce. This wraps Button so the label cannot
 * be forgotten — `label` is required, becomes `aria-label`, and doubles as the
 * native tooltip.
 *
 *   <IconButton label="Close dialog" onClick={close}><X size={16} /></IconButton>
 */
const IconButton = forwardRef(function IconButton(
  { label, showTooltip = true, children, ...props },
  ref
) {
  return (
    <Button
      ref={ref}
      iconOnly
      variant="ghost"
      aria-label={label}
      title={showTooltip ? label : undefined}
      {...props}
    >
      {children}
    </Button>
  );
});

export default IconButton;
