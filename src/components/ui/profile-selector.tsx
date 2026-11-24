import * as React from 'react';
import {cn} from '@/src/lib/utils';

export interface Profile {
  id: string;
  label: string;
  icon: string | React.ReactNode;
}

interface ProfileSelectorProps {
  /** The main title displayed above the profiles */
  title?: string;
  /** An array of profile objects to display */
  profiles: Profile[];
  /** Callback function when a profile is selected */
  onProfileSelect: (id: string) => void;
  /** Optional action control rendered directly beside the profile rows (e.g. expand/collapse) */
  sideAction?: React.ReactNode;
  /** Optional custom class names */
  className?: string;
}

function ProfileAvatarImage({src, alt}: {src: string; alt: string}) {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setHasError(false);
  }, [src]);

  if (hasError || !src) {
    const initials = alt
      .replace(/\s*profile$/i, '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || '')
      .join('');

    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-forest-hero via-dark-surface-container to-plum-overlay font-headline text-2xl text-cream-surface">
        {initials || '?'}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className="h-full w-full object-cover"
    />
  );
}

/**
 * A responsive and theme-adaptive component for selecting a profile.
 * Supports both image URLs and React components for profile icons.
 */
export const ProfileSelector = ({
  title = "Who's watching?",
  profiles,
  onProfileSelect,
  sideAction,
  className,
}: ProfileSelectorProps) => {
  return (
    <div className={cn('flex w-full flex-col items-center justify-center p-4', className)}>
      <div className="flex flex-col items-center w-full">
        {title && (
          <h2 className="mb-8 text-center font-headline text-2xl font-medium text-light-surface-bright md:text-4xl">
            {title}
          </h2>
        )}
        <div className="flex items-center justify-center gap-3 sm:gap-5 md:gap-7 w-full max-w-5xl">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5 lg:gap-7 justify-items-center">
            {profiles.map((profile) => (
              <div key={profile.id} className="flex flex-col items-center gap-2.5 group w-24 sm:w-28 lg:w-32">
                <button
                  type="button"
                  onClick={() => onProfileSelect(profile.id)}
                  aria-label={`Select profile: ${profile.label}`}
                  data-cursor-label={profile.id === 'add' ? 'Thêm tác giả' : profile.label}
                  className="cursor-target group relative h-24 w-24 sm:h-28 sm:w-28 lg:h-32 lg:w-32 rounded-full transition-transform duration-300 ease-in-out hover:-translate-y-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-kale-pink focus-visible:ring-offset-2 focus-visible:ring-offset-dark-surface cursor-pointer"
                >
                  <div className="absolute inset-0 rounded-full bg-dark-surface-container border border-dark-outline-variant/70 transition-all duration-300 group-hover:border-kale-pink group-hover:shadow-lg group-hover:shadow-kale-pink/25" />
                  <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full">
                    {typeof profile.icon === 'string' ? (
                      <ProfileAvatarImage src={profile.icon} alt={`${profile.label} profile`} />
                    ) : (
                      profile.icon
                    )}
                  </div>
                </button>
                <p className="text-center font-title text-xs sm:text-sm lg:text-base text-dark-on-surface-variant transition-colors group-hover:text-light-surface-bright line-clamp-2">
                  {profile.label}
                </p>
              </div>
            ))}
          </div>
          {sideAction && <div className="flex-shrink-0 flex items-center">{sideAction}</div>}
        </div>
      </div>
    </div>
  );
};

export const ProfileIcon = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      'flex h-full w-full items-center justify-center text-4xl text-dark-on-surface/80 md:text-5xl',
      className,
    )}
  >
    {children}
  </div>
);
