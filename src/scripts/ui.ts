const desktop = window.matchMedia('(min-width: 861px)');

function measureNav() {
  const panel = document.querySelector<HTMLElement>('.nav-panel[data-panel="interests"]');
  if (!panel || !desktop.matches) return;
  panel.classList.add('is-measuring');
  const height = Math.ceil(panel.scrollHeight);
  panel.classList.remove('is-measuring');
  document.documentElement.style.setProperty('--nav-panel-h', `${height}px`);
  document.documentElement.dataset.navReady = 'true';
}

function setMenu(open: boolean) {
  const menu = document.querySelector<HTMLElement>('#site-menu');
  const backdrop = document.querySelector<HTMLElement>('.phone-backdrop');
  const toggle = document.querySelector<HTMLButtonElement>('.menu-toggle');
  if (!menu || !backdrop || !toggle) return;
  menu.hidden = !open;
  backdrop.hidden = !open;
  toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  document.body.classList.toggle('nav-open', open);
  if (open) {
    menu.querySelector<HTMLButtonElement>('button')?.focus();
  }
}

function bindMenu() {
  document.querySelectorAll<HTMLElement>('[data-menu]').forEach((control) => {
    control.addEventListener('click', () => {
      const menu = document.querySelector<HTMLElement>('#site-menu');
      setMenu(Boolean(menu?.hidden));
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setMenu(false);
  });
}

function bindShowAll() {
  document.querySelectorAll<HTMLButtonElement>('[data-show-all]').forEach((button) => {
    button.addEventListener('click', () => {
      const list = button.previousElementSibling;
      list?.querySelectorAll<HTMLElement>('[hidden]').forEach((item) => {
        item.hidden = false;
      });
      button.disabled = true;
    });
  });
}

measureNav();
bindMenu();
bindShowAll();
document.fonts?.ready.then(measureNav);
window.addEventListener('resize', () => {
  measureNav();
  if (desktop.matches) setMenu(false);
});
document
  .querySelector('.nav-panel[data-panel="interests"]')
  ?.querySelectorAll('img')
  .forEach((img) => img.addEventListener('load', measureNav));
