import { computePosition, offset, flip, shift, autoUpdate, Strategy } from '@floating-ui/dom';
import { getTooltip, style } from './shared';

let lastLink: HTMLAnchorElement;
let cleanup: () => void;

const checkKeys = (event: BetterMouseEvent | KeyboardEvent) => event.ctrlKey || event.metaKey;

const showToast = async (event: BetterMouseEvent | KeyboardEvent) => {
  const link =
    event instanceof KeyboardEvent
      ? Array.from(document.querySelectorAll<HTMLAnchorElement>('a:hover')).pop()
      : event.target?.closest('a');
  if (lastLink === link || !link?.href) return;

  if (!checkKeys(event)) return;

  const tooltip = getTooltip(link.href);

  const hideToast = (event: KeyboardEvent) => {
    if (checkKeys(event)) return;

    window.removeEventListener('keyup', hideToast);

    style(tooltip, { visibility: 'hidden' });
    lastLink = undefined;
    if (cleanup) cleanup(), (cleanup = undefined);
  };

  window.removeEventListener('keyup', hideToast);
  window.addEventListener('keyup', hideToast);

  let oldPlacement: string;
  let strategy: Strategy = 'absolute';
  let oldX = 0;
  let oldY = 0;

  const updatePosition = async () => {
    const { x, y, placement, middlewareData } = await computePosition(link, tooltip, {
      middleware: [offset(5), flip({ padding: 5 }), shift({ padding: 5, crossAxis: true })],
      placement: 'top',
      strategy,
    });
    if (oldX === x && oldY === y) return;
    if (!oldPlacement) oldPlacement = placement;
    if (oldPlacement && placement !== oldPlacement) {
      style(tooltip, { transition: 'transform 50ms ease' });
      tooltip.addEventListener('transitionend', () => style(tooltip, { transition: '' }));
      oldPlacement = placement;
    }
    style(tooltip, { visibility: '', position: strategy, transform: `translate(${x}px, ${y}px)` });
    strategy = middlewareData.shift.y ? 'fixed' : 'absolute';
    oldX = x;
    oldY = y;
  };

  if (cleanup) {
    cleanup();
    cleanup = undefined;
    style(tooltip, { transition: 'transform 150ms ease' });
    tooltip.addEventListener('transitionend', () => style(tooltip, { transition: '' }));
  }
  cleanup = autoUpdate(link, tooltip, updatePosition);
  lastLink = link;
};

// TODO: remove listener when not active tab, reattach when active with delay
setTimeout(() => {
  window.addEventListener('mouseover', showToast);
  window.addEventListener('keydown', showToast);
}, 100);
