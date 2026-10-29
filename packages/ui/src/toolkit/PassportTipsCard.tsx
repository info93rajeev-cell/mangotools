import enhanceStyles from './passportResult.module.css';

export function PassportTipsCard() {
  return (
    <div class={enhanceStyles.tipsCard}>
      <div class={enhanceStyles.tipsHeader}>
        <span>💡</span>
        <span class={enhanceStyles.tipsTitle}>Tips for best results</span>
      </div>
      <ul class={enhanceStyles.tipsList}>
        <li>
          <span class={enhanceStyles.tipCheck}>✓</span>
          <span>Use good lighting and plain background</span>
        </li>
        <li>
          <span class={enhanceStyles.tipCheck}>✓</span>
          <span>Keep a neutral facial expression</span>
        </li>
        <li>
          <span class={enhanceStyles.tipCheck}>✓</span>
          <span>Use subtle filters only (do not over-edit)</span>
        </li>
        <li>
          <span class={enhanceStyles.tipCheck}>✓</span>
          <span>Final image should look like you</span>
        </li>
        <li>
          <span class={enhanceStyles.tipCheck}>✓</span>
          <span>Check official guidelines for your application</span>
        </li>
      </ul>
    </div>
  );
}
