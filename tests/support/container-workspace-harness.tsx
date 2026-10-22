/** @jsxImportSource preact */
import { render } from 'preact';
import { ContainerLoadingLayout } from '../../packages/ui/src/toolkit/ContainerLoadingLayout.tsx';
import { containerText as t } from '../../packages/ui/src/toolkit/containerWorkspaceStrings.ts';
import '../../packages/ui/src/tokens/global.css';
import './container-workspace-preview.css';

const target = document.getElementById('workspace-preview');
if (target)
  render(
    <main>
      <header>
        <strong>
          <b>B</b> BeyondTheAI
        </strong>
        <span>Tools ▾　 Categories ▾　 Blog</span>
        <span class="preview-local">Runs on your device</span>
      </header>
      <div class="preview-heading">
        <p>Home › Logistics › {t.title}</p>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>
      <ContainerLoadingLayout />
    </main>,
    target,
  );
