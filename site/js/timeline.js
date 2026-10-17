// Hover and focus detail for the server-rendered timeline. Without this script, SVG titles still work.
(() => {
  const tooltip = document.querySelector('.tooltip');
  const scroll = document.querySelector('.timeline-scroll');
  if (!tooltip || !scroll) return;
  const show = (target, x, y) => {
    const tip = target.closest('[data-tip]')?.dataset.tip;
    if (!tip) return;
    tooltip.textContent = tip;
    tooltip.hidden = false;
    const width = tooltip.offsetWidth;
    tooltip.style.left = `${Math.max(8, Math.min(x - width / 2, window.innerWidth - width - 8))}px`;
    tooltip.style.top = `${y + 14}px`;
  };
  const hide = () => {
    tooltip.hidden = true;
  };
  scroll.addEventListener('mousemove', (event) => show(event.target, event.clientX, event.clientY + window.scrollY));
  scroll.addEventListener('mouseleave', hide);
  scroll.addEventListener('focusin', (event) => {
    const box = event.target.getBoundingClientRect();
    show(event.target, box.left + box.width / 2, box.bottom + window.scrollY);
  });
  scroll.addEventListener('focusout', hide);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') hide();
  });
})();
