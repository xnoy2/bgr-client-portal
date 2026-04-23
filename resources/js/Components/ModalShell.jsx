import { Transition, TransitionChild } from '@headlessui/react';
import { useEffect } from 'react';

/**
 * Animated modal shell — handles backdrop, layout, body-scroll lock, and
 * Escape-to-close. Wrap the panel content (the white card) as children.
 *
 * Props:
 *   show          boolean           controls visibility + animation
 *   onClose       fn | null         called on backdrop click or Escape; pass null to disable
 *   position      'center'|'bottom'|'full'   layout preset (default: 'center')
 *   zIndex        string            Tailwind z-index class (default: 'z-50')
 *   backdropColor string            CSS color for the backdrop overlay
 *   backdropBlur  boolean           whether to blur behind the backdrop (default: true)
 */
export default function ModalShell({
    show,
    onClose,
    children,
    position     = 'center',
    zIndex       = 'z-50',
    backdropColor,
    backdropBlur = true,
}) {
    // Lock body scroll while open
    useEffect(() => {
        if (show) document.body.style.overflow = 'hidden';
        else      document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [show]);

    // Escape key
    useEffect(() => {
        if (!show || !onClose) return;
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [show, onClose]);

    const bg   = backdropColor ?? 'rgba(14,32,25,0.65)';
    const blur = backdropBlur ? 'blur(4px)' : undefined;

    const layoutClass = {
        center: 'flex items-center justify-center p-4',
        bottom: 'flex items-end sm:items-center sm:justify-center sm:p-4',
        full:   'flex flex-col',
    }[position] ?? 'flex items-center justify-center p-4';

    const panelFrom = {
        center: 'opacity-0 scale-[0.97] translate-y-1',
        bottom: 'opacity-0 translate-y-full sm:translate-y-0 sm:scale-[0.97]',
        full:   'opacity-0',
    }[position];

    const panelTo = {
        center: 'opacity-100 scale-100 translate-y-0',
        bottom: 'opacity-100 translate-y-0 sm:scale-100',
        full:   'opacity-100',
    }[position];

    return (
        <Transition show={show} appear>
            <div className={`fixed inset-0 ${zIndex} ${layoutClass}`}>

                {/* Backdrop */}
                <TransitionChild
                    enter="transition-opacity ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="transition-opacity ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div
                        className="absolute inset-0"
                        style={{ background: bg, backdropFilter: blur }}
                        onClick={onClose ?? undefined}
                    />
                </TransitionChild>

                {/* Panel wrapper — animates independently of backdrop */}
                <TransitionChild
                    enter="transition ease-out duration-200"
                    enterFrom={panelFrom}
                    enterTo={panelTo}
                    leave="transition ease-in duration-150"
                    leaveFrom={panelTo}
                    leaveTo={panelFrom}
                >
                    <div className={{
                        center: 'relative z-10 w-full flex justify-center',
                        bottom: 'relative z-10 w-full',
                        full:   'relative z-10 w-full h-full flex flex-col',
                    }[position]}>
                        {children}
                    </div>
                </TransitionChild>

            </div>
        </Transition>
    );
}
