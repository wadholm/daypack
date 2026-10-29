import { render } from 'preact';
import { App } from './App';
import { I18nProvider } from './i18n/I18nProvider';
import './style/index.css';

const root = document.getElementById('app');
if (!root) throw new Error('Missing #app root element');

render(
  <I18nProvider>
    <App />
  </I18nProvider>,
  root,
);
