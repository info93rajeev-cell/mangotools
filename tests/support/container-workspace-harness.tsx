/** @jsxImportSource preact */
import { render } from 'preact';
import { ContainerLoadingLayout } from '../../packages/ui/src/toolkit/ContainerLoadingLayout.tsx';
import { containerText as t } from '../../packages/ui/src/toolkit/containerWorkspaceStrings.ts';
import { ContainerPreviewHeader } from './container-workspace-header.tsx';
import '../../packages/ui/src/tokens/global.css';
import './container-workspace-preview.css';

const target = document.getElementById('workspace-preview');
if (target)
  render(
    <main>
      <ContainerPreviewHeader />
      <div class="preview-heading">
        <p>Home › Logistics › {t.title}</p>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>
      <ContainerLoadingLayout />
    </main>,
    target,
  );
