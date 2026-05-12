import { useThemeStore } from '../../store/themeStore';

describe('themeStore', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: 'ember' });
    document.documentElement.removeAttribute('data-theme');
  });

  test('default theme is ember', () => {
    expect(useThemeStore.getState().theme).toBe('ember');
  });

  test('setTheme updates state', () => {
    useThemeStore.getState().setTheme('aurora');
    expect(useThemeStore.getState().theme).toBe('aurora');
  });

  test('applyTheme sets the html data-theme attribute', () => {
    useThemeStore.getState().setTheme('forest');
    useThemeStore.getState().applyTheme();
    expect(document.documentElement.getAttribute('data-theme')).toBe('forest');
  });
});
