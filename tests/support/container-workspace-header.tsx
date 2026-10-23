import { SearchBox } from '../../packages/ui/src/discovery/SearchBox.tsx';
import { ThemeToggle } from '../../packages/ui/src/layout/ThemeToggle.tsx';
import { Icon } from '../../packages/ui/src/primitives/Icon.tsx';
export function ContainerPreviewHeader() {
  return (
    <header class="preview-site-header">
      <a href="/" class="preview-brand">
        <b>B</b> BeyondTheAI
      </a>
      <nav aria-label="Main navigation">
        <details>
          <summary>
            Tools <Icon name="chevron-down" />
          </summary>
          <a href="/tools">All tools</a>
          <a href="/cbm-calculator">CBM Calculator</a>
        </details>
        <details>
          <summary>
            Categories <Icon name="chevron-down" />
          </summary>
          <a href="/categories/logistics">Logistics</a>
        </details>
        <a href="/blog">Blog</a>
      </nav>
      <div class="preview-search">
        <SearchBox idPrefix="container-preview-search" compact />
      </div>
      <span class="preview-local">
        <Icon name="lock" /> Runs on your device
      </span>
      <ThemeToggle />
      <details class="preview-menu">
        <summary aria-label="Open site menu">☰</summary>
        <a href="/tools">Tools</a>
        <a href="/categories/logistics">Logistics</a>
      </details>
    </header>
  );
}
