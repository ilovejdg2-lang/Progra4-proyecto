function pickString(data, camelKey, pascalKey) {
  const value = data?.[camelKey] ?? data?.[pascalKey];
  return typeof value === 'string' ? value.trim() : '';
}

export function mapHero(data) {
  if (!data || typeof data !== 'object') {
    return {
      eyebrow: '',
      title: '',
      subtitle: '',
      primaryButtonText: '',
      primaryButtonUrl: '',
      buttonText: '',
      buttonUrl: '',
      backgroundImage: '',
    };
  }

  return {
    eyebrow: pickString(data, 'eyebrow', 'Eyebrow'),
    title: pickString(data, 'title', 'Title'),
    subtitle: pickString(data, 'subtitle', 'Subtitle'),
    primaryButtonText: pickString(data, 'primaryButtonText', 'PrimaryButtonText'),
    primaryButtonUrl: pickString(data, 'primaryButtonUrl', 'PrimaryButtonUrl'),
    buttonText: pickString(data, 'buttonText', 'ButtonText'),
    buttonUrl: pickString(data, 'buttonUrl', 'ButtonUrl'),
    backgroundImage: pickString(data, 'backgroundImage', 'BackgroundImage'),
  };
}

export function isExternalHeroUrl(url) {
  return /^https?:\/\//i.test(url?.trim() || '');
}
