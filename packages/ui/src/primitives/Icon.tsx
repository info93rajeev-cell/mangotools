import { iconSvg } from '../icons/icons.ts';

export interface IconProps {
  name: string;
  class?: string;
}

/** Decorative icon. Put the accessible name on the surrounding control, not here. */
export function Icon({ name, class: className }: IconProps) {
  return (
    <span
      class={className ? `icon ${className}` : 'icon'}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: iconSvg(name) }}
    />
  );
}
