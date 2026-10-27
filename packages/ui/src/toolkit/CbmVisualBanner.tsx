import styles from './cbmVisualBanner.module.css';

const CARGO_BANNER_IMAGE = '/logistics/cbm-cargo-banner.png';

const FEATURES = [
  'Plan shipments',
  'Compare shipping options',
  'Prepare export documents',
  'Work out storage space',
];

export function CbmVisualBanner() {
  return (
    <div class={styles.bannerCard} data-cbm-visual-banner="">
      <div class={styles.cargoArtWrap}>
        <img
          src={CARGO_BANNER_IMAGE}
          alt="Shipment cargo options: carton, crate on pallet, stacked pallet, and shipping container"
          class={styles.cargoArt}
          loading="eager"
        />
      </div>
      <div class={styles.bannerFeatures}>
        <div class={styles.featureTitle}>Calculate CBM for cartons, pallets, and mixed loads</div>
        <ul class={styles.featureList}>
          {FEATURES.map((feat) => (
            <li key={feat} class={styles.featureItem}>
              <span class={styles.checkIcon} aria-hidden="true">
                ✓
              </span>
              <span>{feat}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
