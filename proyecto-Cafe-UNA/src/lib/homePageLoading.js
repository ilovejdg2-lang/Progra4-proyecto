export function setHomePageLoading(active) {
  document.documentElement.classList.toggle('home-page-loading', active);
  document.body.classList.toggle('home-page-loading', active);
}

export function clearHomePageLoading() {
  document.documentElement.classList.remove('home-page-loading');
  document.body.classList.remove('home-page-loading');
}

export { removeSiteBootLoading as removeHomeInitialLoader } from './siteBootLoading';
