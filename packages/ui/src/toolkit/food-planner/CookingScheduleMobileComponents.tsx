import { Icon } from '../../primitives/Icon.tsx';
import mobileStyles from './foodPlannerMobile.module.css';

export function MobileScheduleSummaryGrid() {
  return (
    <div class={mobileStyles.mobileCard}>
      <div class={mobileStyles.mobileCardHeader}>
        <div class={mobileStyles.mobileCardHeaderLeft}>
          <Icon name="bar-chart-2" />
          <h4 class={mobileStyles.mobileCardTitle}>Schedule Summary</h4>
        </div>
      </div>
      <div class={mobileStyles.mobileSummary2x2}>
        <div class={mobileStyles.mobileSummaryTile}>
          <Icon name="clipboard" />
          <div>
            <p class={mobileStyles.mobileSummaryTileLabel}>Total Tasks</p>
            <p class={mobileStyles.mobileSummaryTileValue}>8</p>
          </div>
        </div>
        <div class={mobileStyles.mobileSummaryTile}>
          <Icon name="clock" />
          <div>
            <p class={mobileStyles.mobileSummaryTileLabel}>Active Prep Time</p>
            <p class={mobileStyles.mobileSummaryTileValue}>3 hr 25 min</p>
          </div>
        </div>
        <div class={mobileStyles.mobileSummaryTile}>
          <Icon name="utensils" />
          <div>
            <p class={mobileStyles.mobileSummaryTileLabel}>Serving Time</p>
            <p class={mobileStyles.mobileSummaryTileValue}>20 min</p>
          </div>
        </div>
        <div class={mobileStyles.mobileSummaryTile}>
          <Icon name="clock" />
          <div>
            <p class={mobileStyles.mobileSummaryTileLabel}>Buffer Time</p>
            <p class={mobileStyles.mobileSummaryTileValue}>15 min</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MobileRecipeReadinessCard() {
  return (
    <div class={mobileStyles.mobileCard}>
      <div class={mobileStyles.mobileCardHeader}>
        <div>
          <h4 class={mobileStyles.mobileCardTitle}>Recipe Readiness / Progress</h4>
          <p class={mobileStyles.mobileCardSubtitle}>Preparation progress for selected dishes.</p>
        </div>
        <button type="button" class={mobileStyles.mobileEditBtn}>
          <Icon name="eye" /> View Details
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img
                src="/food/recipes/shahi-paneer.jpg"
                alt=""
                style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/food/recipes/dal-tadka.jpg';
                }}
              />
              <strong style={{ fontSize: '13px' }}>Shahi Paneer</strong>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>60%</span>
          </div>
          <div class={mobileStyles.mobileProgressBar}>
            <div class={mobileStyles.mobileProgressFill} style={{ width: '60%' }} />
          </div>
        </div>

        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img
                src="/food/recipes/dal-tadka.jpg"
                alt=""
                style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }}
              />
              <strong style={{ fontSize: '13px' }}>Dal Tadka</strong>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>40%</span>
          </div>
          <div class={mobileStyles.mobileProgressBar}>
            <div class={mobileStyles.mobileProgressFill} style={{ width: '40%' }} />
          </div>
        </div>

        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img
                src="/food/recipes/jeera-rice.jpg"
                alt=""
                style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }}
              />
              <strong style={{ fontSize: '13px' }}>Jeera Rice</strong>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>25%</span>
          </div>
          <div class={mobileStyles.mobileProgressBar}>
            <div class={mobileStyles.mobileProgressFill} style={{ width: '25%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
