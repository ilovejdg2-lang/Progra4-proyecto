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
      buttonText: '',
      backgroundImage: '',
    };
  }

  return {
    eyebrow: pickString(data, 'eyebrow', 'Eyebrow'),
    title: pickString(data, 'title', 'Title'),
    subtitle: pickString(data, 'subtitle', 'Subtitle'),
    primaryButtonText: pickString(data, 'primaryButtonText', 'PrimaryButtonText'),
    buttonText: pickString(data, 'buttonText', 'ButtonText'),
    backgroundImage: pickString(data, 'backgroundImage', 'BackgroundImage'),
  };
}
