import logoSrc from '../assets/zukari-logo.png';
import { BORDER } from '../constants/theme';

export default function BrandLogo({ size = 72, compact = false, style = {}, className = '' }) {
  const width = compact ? size * 1.45 : size;

  return (
    <img
      src={logoSrc}
      alt="Zukari logo"
      className={className}
      style={{
        width,
        height: size,
        objectFit: 'contain',
        display: 'block',
        borderRadius: compact ? 14 : 22,
        background: 'none',
        border: `0px solid ${BORDER}`, 
        ...style,
      }}
    />
  );
}
