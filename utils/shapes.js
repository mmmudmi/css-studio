// CSS Shapes Library
// Each shape has: name, category, css (function), previewStyle (function)
// color parameter can be a solid color or gradient string

// Helper function to generate blob border-radius based on granularity and depth
// Uses seeded random to ensure consistent results for the same parameters
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateBlobBorderRadius(granularity, depth) {
  // granularity: number of control points (3-8)
  // depth: how much deviation from 50% (5-40)
  const baseValue = 50;
  const values1 = [];
  const values2 = [];
  
  // Generate values based on granularity
  for (let i = 0; i < granularity; i++) {
    // Use deterministic values based on position and parameters
    const offset1 = Math.round((seededRandom(i * 13 + granularity) - 0.5) * 2 * depth);
    const offset2 = Math.round((seededRandom(i * 17 + granularity + 100) - 0.5) * 2 * depth);
    values1.push(baseValue + offset1);
    values2.push(baseValue + offset2);
  }
  
  // Pad to 4 values if needed (CSS border-radius needs 4 values per axis)
  while (values1.length < 4) {
    values1.push(values1[values1.length - 1] || 50);
    values2.push(values2[values2.length - 1] || 50);
  }
  
  // Take only first 4 values if more
  const h = values1.slice(0, 4).map(v => `${Math.max(10, Math.min(90, v))}%`).join(' ');
  const v = values2.slice(0, 4).map(v => `${Math.max(10, Math.min(90, v))}%`).join(' ');
  
  return `${h} / ${v}`;
}

// Helper function to generate flower petal mask positions
function generateFlowerMask(petals) {
  // Adjust petal size based on number of petals
  // Fewer petals = larger petals, more petals = smaller petals
  // Range: 3 petals -> ~38%, 12 petals -> ~22%
  const petalSize = 44 - (petals * 1.8);
  
  // Adjust radius based on petals (more petals need tighter spacing)
  const radius = 38 - (petals * 0.5);
  
  const positions = [];
  
  // Calculate petal positions around the center
  for (let i = 0; i < petals; i++) {
    const angle = (i / petals) * Math.PI * 2 - Math.PI / 2; // Start from top
    const x = 50 + Math.cos(angle) * radius;
    const y = 50 + Math.sin(angle) * radius;
    positions.push(`${x.toFixed(3)}% ${y.toFixed(3)}% var(--g)`);
  }
  
  // Add center circle
  positions.push('50% 50% var(--g)');
  
  // Adjust center size based on petals
  const centerSize = 28 + (petals * 0.5);
  positions.push(`radial-gradient(100% 100%,#000 ${centerSize}%,#0000 calc(${centerSize}% + 1px))`);
  
  return {
    petalSize,
    mask: positions.join(',')
  };
}

export const shapes = [
  // Basic Shapes
  {
    name: 'Circle',
    category: 'basic',
    css: (color, size) => `.circle {
  width: ${size}px;
  height: ${size}px;
  background: ${color};
  border-radius: 50%;
}`,
    previewStyle: (color, size) => ({
      width: size,
      height: size,
      background: color,
      borderRadius: '50%'
    })
  },
  {
    name: 'Square',
    type: 'shape',
    category: 'basic',
    css: (color, size) => `.square {
  width: ${size}px;
  height: ${size}px;
  background: ${color};
}`,
    previewStyle: (color, size) => ({
      width: size,
      height: size,
      background: color
    })
  },
  {
    name: 'Rectangle',
    type: 'shape',
    category: 'basic',
    css: (color, size) => `.rectangle {
  width: ${size}px;
  height: ${Math.round(size * 0.6)}px;
  background: ${color};
}`,
    previewStyle: (color, size) => ({
      width: size,
      height: size * 0.6,
      background: color
    })
  },
  {
    name: 'Rounded Square',
    type: 'shape',
    category: 'basic',
    css: (color, size) => `.rounded-square {
  width: ${size}px;
  height: ${size}px;
  background: ${color};
  border-radius: ${Math.round(size * 0.15)}px;
}`,
    previewStyle: (color, size) => ({
      width: size,
      height: size,
      background: color,
      borderRadius: size * 0.15
    })
  },
  {
    name: 'Pill',
    type: 'shape',
    category: 'basic',
    css: (color, size) => `.pill {
  width: ${size}px;
  height: ${Math.round(size * 0.4)}px;
  background: ${color};
  border-radius: ${Math.round(size * 0.2)}px;
}`,
    previewStyle: (color, size) => ({
      width: size,
      height: size * 0.4,
      background: color,
      borderRadius: size * 0.2
    })
  },
  {
    name: 'Oval',
    type: 'shape',
    category: 'basic',
    css: (color, size) => `.oval {
  width: ${size}px;
  height: ${Math.round(size * 0.6)}px;
  background: ${color};
  border-radius: 50%;
}`,
    previewStyle: (color, size) => ({
      width: size,
      height: size * 0.6,
      background: color,
      borderRadius: '50%'
    })
  },
  {
    name: 'Triangle',
    type: 'shape',
    category: 'basic',
    css: (color, size) => `.triangle {
  width: ${size}px;
  height: ${size}px;
  background: ${color};
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
}`,
    previewStyle: (color, size) => ({
      width: size,
      height: size,
      background: color,
      clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
    })
  },
  {
    name: 'Right Triangle',
    type: 'shape',
    category: 'basic',
    css: (color, size) => `.right-triangle {
  width: ${size}px;
  height: ${size}px;
  background: ${color};
  clip-path: polygon(0% 0%, 0% 100%, 100% 100%);
}`,
    previewStyle: (color, size) => ({
      width: size,
      height: size,
      background: color,
      clipPath: 'polygon(0% 0%, 0% 100%, 100% 100%)'
    })
  },

  // Arrows
  {
    name: 'Arrow',
    category: 'arrows',
    css: (color, size) => `.arrow {
  width: ${size}px;
  height: ${size}px;
  background: ${color};
  clip-path: polygon(50% 0%, 100% 40%, 70% 40%, 70% 100%, 30% 100%, 30% 40%, 0% 40%);
}`,
    previewStyle: (color, size) => ({
      width: size,
      height: size,
      background: color,
      clipPath: 'polygon(50% 0%, 100% 40%, 70% 40%, 70% 100%, 30% 100%, 30% 40%, 0% 40%)'
    })
  },
  {
    name: 'Chevron',
    category: 'arrows',
    css: (color, size) => {
      const width = size;
      const height = Math.round(size * 0.3);
      return `.chevron {
  position: relative;
  height: ${height}px;
  width: ${width}px;
}

.chevron::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 51%;
  background: ${color};
  transform: skew(0deg, 6deg);
}

.chevron::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  width: 50%;
  background: ${color};
  transform: skew(0deg, -6deg);
}`;
    },
    previewStyle: (color, size) => ({
      position: 'relative',
      width: size,
      height: size * 0.3
    }),
    previewBeforeStyle: (color, size) => ({
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      height: '100%',
      width: '51%',
      background: color,
      transform: 'skew(0deg, 6deg)'
    }),
    previewAfterStyle: (color, size) => ({
      content: '""',
      position: 'absolute',
      top: 0,
      right: 0,
      height: '100%',
      width: '50%',
      background: color,
      transform: 'skew(0deg, -6deg)'
    })
  },

  // Polygons
  {
    name: 'Pentagon',
    category: 'polygons',
    css: (color, size) => `.pentagon {
  width: ${size}px;
  height: ${size}px;
  background: ${color};
  clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%);
}`,
    previewStyle: (color, size) => ({
      width: size,
      height: size,
      background: color,
      clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)'
    })
  },
  {
    name: 'Hexagon',
    category: 'polygons',
    css: (color, size) => `.hexagon {
  width: ${size}px;
  height: ${Math.round(size * 0.866)}px;
  background: ${color};
  clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
}`,
    previewStyle: (color, size) => ({
      width: size,
      height: size * 0.866,
      background: color,
      clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
    })
  },
  {
    name: 'Octagon',
    category: 'polygons',
    css: (color, size) => `.octagon {
  width: ${size}px;
  height: ${size}px;
  background: ${color};
  clip-path: polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%);
}`,
    previewStyle: (color, size) => ({
      width: size,
      height: size,
      background: color,
      clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'
    })
  },
  {
    name: 'Diamond',
    category: 'polygons',
    css: (color, size) => `.diamond {
  width: ${size}px;
  height: ${size}px;
  background: ${color};
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
}`,
    previewStyle: (color, size) => ({
      width: size,
      height: size,
      background: color,
      clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
    })
  },
  {
    name: 'Parallelogram',
    category: 'polygons',
    css: (color, size) => `.parallelogram {
  width: ${size}px;
  height: ${Math.round(size * 0.6)}px;
  background: ${color};
  clip-path: polygon(20% 0%, 100% 0%, 80% 100%, 0% 100%);
}`,
    previewStyle: (color, size) => ({
      width: size,
      height: size * 0.6,
      background: color,
      clipPath: 'polygon(20% 0%, 100% 0%, 80% 100%, 0% 100%)'
    })
  },
  {
    name: 'Trapezoid',
    category: 'polygons',
    css: (color, size) => `.trapezoid {
  width: ${size}px;
  height: ${Math.round(size * 0.5)}px;
  background: ${color};
  clip-path: polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%);
}`,
    previewStyle: (color, size) => ({
      width: size,
      height: size * 0.5,
      background: color,
      clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)'
    })
  },
  {
    name: 'Rhombus',
    category: 'polygons',
    css: (color, size) => `.rhombus {
  width: ${size}px;
  height: ${Math.round(size * 0.7)}px;
  background: ${color};
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
}`,
    previewStyle: (color, size) => ({
      width: size,
      height: size * 0.7,
      background: color,
      clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
    })
  },

  // Stars & Special
  {
    name: 'Star',
    category: 'stars',
    css: (color, size) => `.star {
  width: ${size}px;
  height: ${size}px;
  background: ${color};
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
}`,
    previewStyle: (color, size) => ({
      width: size,
      height: size,
      background: color,
      clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
    })
  },
  {
    name: 'Star Six',
    category: 'stars',
    css: (color, size) => {
      const scale = size / 100;
      return `.star-six {
  width: 0;
  height: 0;
  border-left: ${50 * scale}px solid transparent;
  border-right: ${50 * scale}px solid transparent;
  border-bottom: ${100 * scale}px solid ${color};
  position: relative;
}
.star-six:after {
  width: 0;
  height: 0;
  border-left: ${50 * scale}px solid transparent;
  border-right: ${50 * scale}px solid transparent;
  border-top: ${100 * scale}px solid ${color};
  position: absolute;
  content: "";
  top: ${30 * scale}px;
  left: ${-50 * scale}px;
}`;
    },
    previewStyle: (color, size) => ({
      width: size,
      height: size,
      background: color,
      clipPath: 'polygon(50% 0%, 65% 25%, 100% 25%, 75% 50%, 100% 75%, 65% 75%, 50% 100%, 35% 75%, 0% 75%, 25% 50%, 0% 25%, 35% 25%)'
    })
  },
  {
    name: 'Burst 8',
    category: 'stars',
    disableLinearGradient: true,
    css: (color, size) => `.burst-8 {
  background: ${color};
  width: ${size}px;
  height: ${size}px;
  position: relative;
  transform: rotate(20deg);
}

.burst-8::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  height: ${size}px;
  width: ${size}px;
  background: ${color};
  transform: rotate(135deg);
}`,
    previewStyle: (color, size) => ({
      background: color,
      width: size,
      height: size,
      position: 'relative',
      transform: 'rotate(20deg)'
    }),
    previewBeforeStyle: (color, size) => ({
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      height: size,
      width: size,
      background: color,
      transform: 'rotate(135deg)'
    })
  },
  {
    name: 'Burst 12',
    category: 'stars',
    disableLinearGradient: true,
    css: (color, size) => `.burst-12 {
  background: ${color};
  width: ${size}px;
  height: ${size}px;
  position: relative;
}

.burst-12::before,
.burst-12::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  height: ${size}px;
  width: ${size}px;
  background: ${color};
}

.burst-12::before {
  transform: rotate(30deg);
}

.burst-12::after {
  transform: rotate(60deg);
}`,
    previewStyle: (color, size) => ({
      background: color,
      width: size,
      height: size,
      position: 'relative'
    }),
    previewBeforeStyle: (color, size) => ({
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      height: size,
      width: size,
      background: color,
      transform: 'rotate(30deg)'
    }),
    previewAfterStyle: (color, size) => ({
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      height: size,
      width: size,
      background: color,
      transform: 'rotate(60deg)'
    })
  },
  {
    name: 'Cross',
    category: 'stars',
    css: (color, size) => `.cross {
  width: ${size}px;
  height: ${size}px;
  background: ${color};
  clip-path: polygon(35% 0%, 65% 0%, 65% 35%, 100% 35%, 100% 65%, 65% 65%, 65% 100%, 35% 100%, 35% 65%, 0% 65%, 0% 35%, 35% 35%);
}`,
    previewStyle: (color, size) => ({
      width: size,
      height: size,
      background: color,
      clipPath: 'polygon(35% 0%, 65% 0%, 65% 35%, 100% 35%, 100% 65%, 65% 65%, 65% 100%, 35% 100%, 35% 65%, 0% 65%, 0% 35%, 35% 35%)'
    })
  },
  {
    name: 'Plus',
    category: 'stars',
    css: (color, size) => `.plus {
  width: ${size}px;
  height: ${size}px;
  background: ${color};
  clip-path: polygon(40% 0%, 60% 0%, 60% 40%, 100% 40%, 100% 60%, 60% 60%, 60% 100%, 40% 100%, 40% 60%, 0% 60%, 0% 40%, 40% 40%);
}`,
    previewStyle: (color, size) => ({
      width: size,
      height: size,
      background: color,
      clipPath: 'polygon(40% 0%, 60% 0%, 60% 40%, 100% 40%, 100% 60%, 60% 60%, 60% 100%, 40% 100%, 40% 60%, 0% 60%, 0% 40%, 40% 40%)'
    })
  },

  // Symbols
  {
    name: 'Heart',
    category: 'symbols',
    css: (color, size) => {
      const scale = size / 100;
      return `.heart {
  position: relative;
  width: ${100 * scale}px;
  height: ${90 * scale}px;
}
.heart:before,
.heart:after {
  position: absolute;
  content: "";
  left: ${50 * scale}px;
  top: 0;
  width: ${50 * scale}px;
  height: ${80 * scale}px;
  background: ${color};
  border-radius: ${50 * scale}px ${50 * scale}px 0 0;
  transform: rotate(-45deg);
  transform-origin: 0 100%;
}
.heart:after {
  left: 0;
  transform: rotate(45deg);
  transform-origin: 100% 100%;
}`;
    },
    previewStyle: (color, size) => ({
      width: size,
      height: size * 0.9,
      background: color,
      clipPath: 'path("M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z")',
      transform: `scale(${(size / 24).toFixed(2)})`,
      transformOrigin: 'top left'
    })
  },

  // UI Elements
  {
    name: 'Speech Bubble',
    category: 'ui',
    controls: [
      { name: 'curve', label: 'Curve', type: 'range', min: 0, max: 50, step: 1, default: 15 }
    ],
    css: (color, size, options = {}) => {
      const curve = options.curve ?? 15;
      const height = Math.round(size * 0.6);
      const radius = Math.round(size * curve / 100);
      const tailSize = Math.round(size * 0.12);
      return `.speech-bubble {
  width: ${size}px;
  height: ${height}px;
  background: ${color};
  border-radius: ${radius}px;
  position: relative;
}

.speech-bubble::after {
  content: "";
  position: absolute;
  bottom: ${-tailSize + 1}px;
  left: ${Math.round(size * 0.2)}px;
  width: 0;
  height: 0;
  border-left: ${tailSize}px solid transparent;
  border-right: ${tailSize}px solid transparent;
  border-top: ${tailSize}px solid ${color};
}`;
    },
    previewStyle: (color, size, options = {}) => {
      const curve = options.curve ?? 15;
      const height = size * 0.6;
      const radius = size * curve / 100;
      return {
        width: size,
        height: height,
        background: color,
        borderRadius: radius,
        position: 'relative'
      };
    },
    previewAfterStyle: (color, size, options = {}) => {
      const tailSize = size * 0.12;
      return {
        content: '""',
        position: 'absolute',
        bottom: -tailSize + 1,
        left: size * 0.2,
        width: 0,
        height: 0,
        borderLeft: `${tailSize}px solid transparent`,
        borderRight: `${tailSize}px solid transparent`,
        borderTop: `${tailSize}px solid ${color}`
      };
    }
  },
  {
    name: 'Talk Bubble',
    category: 'ui',
    controls: [
      { name: 'curve', label: 'Curve', type: 'range', min: 0, max: 30, step: 1, default: 10 }
    ],
    css: (color, size, options = {}) => {
      const curve = options.curve ?? 10;
      const scale = size / 120;
      const radius = Math.round(curve * scale);
      return `.talk-bubble {
  width: ${120 * scale}px;
  height: ${80 * scale}px;
  background: ${color};
  position: relative;
  border-radius: ${radius}px;
}

.talk-bubble::before {
  content: "";
  position: absolute;
  right: 100%;
  top: ${26 * scale}px;
  width: 0;
  height: 0;
  border-top: ${13 * scale}px solid transparent;
  border-right: ${26 * scale}px solid ${color};
  border-bottom: ${13 * scale}px solid transparent;
}`;
    },
    previewStyle: (color, size, options = {}) => {
      const curve = options.curve ?? 10;
      const scale = size / 120;
      const radius = curve * scale;
      return {
        width: 120 * scale,
        height: 80 * scale,
        background: color,
        position: 'relative',
        borderRadius: radius
      };
    },
    previewBeforeStyle: (color, size, options = {}) => {
      const scale = size / 120;
      return {
        content: '""',
        position: 'absolute',
        right: '100%',
        top: 26 * scale,
        width: 0,
        height: 0,
        borderTop: `${13 * scale}px solid transparent`,
        borderRight: `${26 * scale}px solid ${color}`,
        borderBottom: `${13 * scale}px solid transparent`
      };
    }
  },
  {
    name: 'Tag',
    category: 'ui',
    css: (color, size) => `.tag {
  width: ${size}px;
  height: ${Math.round(size * 0.5)}px;
  background: ${color};
  clip-path: polygon(0% 50%, 15% 0%, 100% 0%, 100% 100%, 15% 100%);
}`,
    previewStyle: (color, size) => ({
      width: size,
      height: size * 0.5,
      background: color,
      clipPath: 'polygon(0% 50%, 15% 0%, 100% 0%, 100% 100%, 15% 100%)'
    })
  },
  {
    name: 'Badge',
    category: 'ui',
    css: (color, size) => `.badge {
  width: ${size}px;
  height: ${size}px;
  background: ${color};
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
}`,
    previewStyle: (color, size) => ({
      width: size,
      height: size,
      background: color,
      clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
    })
  },
  {
    name: 'Ribbon',
    category: 'ui',
    css: (color, size) => `.ribbon {
  width: ${size}px;
  height: ${Math.round(size * 0.35)}px;
  background: ${color};
  clip-path: polygon(0% 0%, 100% 0%, 90% 50%, 100% 100%, 0% 100%, 10% 50%);
}`,
    previewStyle: (color, size) => ({
      width: size,
      height: size * 0.35,
      background: color,
      clipPath: 'polygon(0% 0%, 100% 0%, 90% 50%, 100% 100%, 0% 100%, 10% 50%)'
    })
  },
  {
    name: 'Bookmark',
    category: 'ui',
    css: (color, size) => `.bookmark {
  width: ${Math.round(size * 0.6)}px;
  height: ${size}px;
  background: ${color};
  clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 50% 75%, 0% 100%);
}`,
    previewStyle: (color, size) => ({
      width: size * 0.6,
      height: size,
      background: color,
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 75%, 0% 100%)'
    })
  },

  // Decorative
  {
    name: 'Semicircle',
    category: 'decorative',
    css: (color, size) => `.semicircle {
  width: ${size}px;
  height: ${Math.round(size / 2)}px;
  background: ${color};
  border-radius: ${size}px ${size}px 0 0;
}`,
    previewStyle: (color, size) => ({
      width: size,
      height: size / 2,
      background: color,
      borderRadius: `${size}px ${size}px 0 0`
    })
  },
  {
    name: 'Quarter Circle',
    category: 'decorative',
    css: (color, size) => `.quarter-circle {
  width: ${size}px;
  height: ${size}px;
  background: ${color};
  border-radius: 0 0 100% 0;
}`,
    previewStyle: (color, size) => ({
      width: size,
      height: size,
      background: color,
      borderRadius: '0 0 100% 0'
    })
  },
  {
    name: 'Pacman',
    category: 'decorative',
    css: (color, size) => {
      const scale = size / 120;
      return `.pacman {
  width: 0px;
  height: 0px;
  border-right: ${60 * scale}px solid transparent;
  border-top: ${60 * scale}px solid ${color};
  border-left: ${60 * scale}px solid ${color};
  border-bottom: ${60 * scale}px solid ${color};
  border-top-left-radius: ${60 * scale}px;
  border-top-right-radius: ${60 * scale}px;
  border-bottom-left-radius: ${60 * scale}px;
  border-bottom-right-radius: ${60 * scale}px;
}`;
    },
    previewStyle: (color, size) => ({
      width: 0,
      height: 0,
      borderRight: `${size * 0.5}px solid transparent`,
      borderTop: `${size * 0.5}px solid ${color}`,
      borderLeft: `${size * 0.5}px solid ${color}`,
      borderBottom: `${size * 0.5}px solid ${color}`,
      borderTopLeftRadius: `${size * 0.5}px`,
      borderTopRightRadius: `${size * 0.5}px`,
      borderBottomLeftRadius: `${size * 0.5}px`,
      borderBottomRightRadius: `${size * 0.5}px`
    })
  },
  {
    name: 'Egg',
    category: 'decorative',
    css: (color, size) => `.egg {
  width: ${Math.round(size * 0.75)}px;
  height: ${size}px;
  background: ${color};
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
}`,
    previewStyle: (color, size) => ({
      width: size * 0.75,
      height: size,
      background: color,
      borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%'
    })
  },
  {
    name: 'Leaf',
    category: 'decorative',
    css: (color, size) => `.leaf {
  width: ${size}px;
  height: ${size}px;
  background: ${color};
  border-radius: 5% 95% 5% 95%;
}`,
    previewStyle: (color, size) => ({
      width: size,
      height: size,
      background: color,
      borderRadius: '5% 95% 5% 95%'
    })
  },
  {
    name: 'Tear Drop',
    category: 'decorative',
    css: (color, size) => `.tear {
  width: ${size}px;
  height: ${size}px;
  background: ${color};
  border-radius: 0 50% 50% 50%;
  transform: rotate(45deg);
}`,
    previewStyle: (color, size) => ({
      width: size,
      height: size,
      background: color,
      borderRadius: '0 50% 50% 50%',
      transform: 'rotate(45deg)'
    })
  },
  {
    name: 'Blob',
    category: 'decorative',
    controls: [
      { name: 'granularity', label: 'Granularity', type: 'range', min: 3, max: 20, step: 1, default: 4 },
      { name: 'depth', label: 'Depth', type: 'range', min: 5, max: 40, step: 1, default: 20 }
    ],
    css: (color, size, options = {}) => {
      const granularity = options.granularity ?? 4;
      const depth = options.depth ?? 20;
      const borderRadius = generateBlobBorderRadius(granularity, depth);
      return `.blob {
  width: ${size}px;
  height: ${size}px;
  background: ${color};
  border-radius: ${borderRadius};
}`;
    },
    previewStyle: (color, size, options = {}) => {
      const granularity = options.granularity ?? 4;
      const depth = options.depth ?? 20;
      const borderRadius = generateBlobBorderRadius(granularity, depth);
      return {
        width: size,
        height: size,
        background: color,
        borderRadius: borderRadius
      };
    }
  },
  {
    name: 'Flower',
    category: 'decorative',
    controls: [
      { name: 'petals', label: 'Petals', type: 'range', min: 3, max: 12, step: 1, default: 6 }
    ],
    css: (color, size, options = {}) => {
      const petals = options.petals ?? 6;
      const { petalSize, mask } = generateFlowerMask(petals);
      return `.flower {
  width: ${size}px;
  aspect-ratio: 1;
  background: ${color};
  --g:/${petalSize}% ${petalSize}% radial-gradient(#000 calc(71% - 1px),#0000 71%) no-repeat;
  mask: ${mask};
}`;
    },
    previewStyle: (color, size, options = {}) => {
      const petals = options.petals ?? 6;
      const { petalSize, mask } = generateFlowerMask(petals);
      return {
        width: size,
        aspectRatio: 1,
        background: color,
        '--g': `/${petalSize}% ${petalSize}% radial-gradient(#000 calc(71% - 1px),#0000 71%) no-repeat`,
        WebkitMask: mask,
        mask: mask
      };
    }
  },
  {
    name: 'Wave',
    category: 'decorative',
    css: (color, size) => `.wave {
  width: ${size}px;
  height: ${Math.round(size * 0.4)}px;
  background: ${color};
  clip-path: polygon(0% 50%, 10% 30%, 25% 50%, 40% 30%, 55% 50%, 70% 30%, 85% 50%, 100% 30%, 100% 100%, 0% 100%);
}`,
    previewStyle: (color, size) => ({
      width: size,
      height: size * 0.4,
      background: color,
      clipPath: 'polygon(0% 50%, 10% 30%, 25% 50%, 40% 30%, 55% 50%, 70% 30%, 85% 50%, 100% 30%, 100% 100%, 0% 100%)'
    })
  },
  {
    name: 'TV Screen',
    category: 'decorative',
    css: (color, size) => {
      const width = size;
      const height = Math.round(size * 0.75);
      return `.tv-screen {
  position: relative;
  width: ${width}px;
  height: ${height}px;
  background: ${color};
  border-radius: 50% / 10%;
}

.tv-screen::before {
  content: '';
  position: absolute;
  top: 10%;
  bottom: 10%;
  right: -5%;
  left: -5%;
  background: inherit;
  border-radius: 5% / 50%;
}`;
    },
    previewStyle: (color, size) => ({
      position: 'relative',
      width: size,
      height: size * 0.75,
      background: color,
      borderRadius: '50% / 10%'
    }),
    previewBeforeStyle: (color, size) => ({
      content: '""',
      position: 'absolute',
      top: '10%',
      bottom: '10%',
      right: '-5%',
      left: '-5%',
      background: 'inherit',
      borderRadius: '5% / 50%'
    })
  },
  {
    name: 'Magnifying Glass',
    category: 'decorative',
    solidOnly: true,
    css: (color, size) => {
      const scale = size / 100;
      return `.magnifying-glass {
  display: inline-block;
  width: ${40 * scale}px;
  height: ${40 * scale}px;
  box-sizing: content-box;
  border: ${10 * scale}px solid ${color};
  position: relative;
  border-radius: ${35 * scale}px;
}

.magnifying-glass::before {
  content: "";
  display: inline-block;
  position: absolute;
  right: ${-25 * scale}px;
  bottom: ${-10 * scale}px;
  border-width: 0;
  background: ${color};
  width: ${35 * scale}px;
  height: ${8 * scale}px;
  transform: rotate(45deg);
}`;
    },
    previewStyle: (color, size) => {
      const scale = size / 100;
      return {
        display: 'inline-block',
        width: 40 * scale,
        height: 40 * scale,
        boxSizing: 'content-box',
        border: `${10 * scale}px solid ${color}`,
        position: 'relative',
        borderRadius: 35 * scale
      };
    },
    previewBeforeStyle: (color, size) => {
      const scale = size / 100;
      return {
        content: '""',
        display: 'inline-block',
        position: 'absolute',
        right: -25 * scale,
        bottom: -10 * scale,
        borderWidth: 0,
        background: color,
        width: 35 * scale,
        height: 8 * scale,
        transform: 'rotate(45deg)'
      };
    }
  },
  {
    name: 'Infinity',
    category: 'decorative',
    solidOnly: true,
    css: (color, size) => {
      const scale = size / 212;
      return `.infinity {
  position: relative;
  width: ${212 * scale}px;
  height: ${100 * scale}px;
  box-sizing: content-box;
}

.infinity::before,
.infinity::after {
  content: "";
  box-sizing: content-box;
  position: absolute;
  top: 0;
  left: 0;
  width: ${60 * scale}px;
  height: ${60 * scale}px;
  border: ${20 * scale}px solid ${color};
  border-radius: ${50 * scale}px ${50 * scale}px 0 ${50 * scale}px;
  transform: rotate(-45deg);
}

.infinity::after {
  left: auto;
  right: 0;
  border-radius: ${50 * scale}px ${50 * scale}px ${50 * scale}px 0;
  transform: rotate(45deg);
}`;
    },
    previewStyle: (color, size) => {
      const scale = size / 212;
      return {
        position: 'relative',
        width: 212 * scale,
        height: 100 * scale,
        boxSizing: 'content-box'
      };
    },
    previewBeforeStyle: (color, size) => {
      const scale = size / 212;
      return {
        content: '""',
        boxSizing: 'content-box',
        position: 'absolute',
        top: 0,
        left: 0,
        width: 60 * scale,
        height: 60 * scale,
        border: `${20 * scale}px solid ${color}`,
        borderRadius: `${50 * scale}px ${50 * scale}px 0 ${50 * scale}px`,
        transform: 'rotate(-45deg)'
      };
    },
    previewAfterStyle: (color, size) => {
      const scale = size / 212;
      return {
        content: '""',
        boxSizing: 'content-box',
        position: 'absolute',
        top: 0,
        left: 'auto',
        right: 0,
        width: 60 * scale,
        height: 60 * scale,
        border: `${20 * scale}px solid ${color}`,
        borderRadius: `${50 * scale}px ${50 * scale}px ${50 * scale}px 0`,
        transform: 'rotate(45deg)'
      };
    }
  },
  {
    name: 'Curved Arrow',
    category: 'arrows',
    solidOnly: true,
    css: (color, size) => {
      const scale = size / 30;
      return `.curved-arrow {
  position: relative;
  width: 0;
  height: 0;
  border-top: ${9 * scale}px solid transparent;
  border-right: ${9 * scale}px solid ${color};
  transform: rotate(10deg);
}

.curved-arrow::after {
  content: "";
  position: absolute;
  border: 0 solid transparent;
  border-top: ${3 * scale}px solid ${color};
  border-radius: ${20 * scale}px 0 0 0;
  top: ${-12 * scale}px;
  left: ${-9 * scale}px;
  width: ${12 * scale}px;
  height: ${12 * scale}px;
  transform: rotate(45deg);
}`;
    },
    previewStyle: (color, size) => {
      const scale = size / 30;
      return {
        position: 'relative',
        width: 0,
        height: 0,
        borderTop: `${9 * scale}px solid transparent`,
        borderRight: `${9 * scale}px solid ${color}`,
        transform: 'rotate(10deg)'
      };
    },
    previewAfterStyle: (color, size) => {
      const scale = size / 30;
      return {
        content: '""',
        position: 'absolute',
        border: '0 solid transparent',
        borderTop: `${3 * scale}px solid ${color}`,
        borderRadius: `${20 * scale}px 0 0 0`,
        top: -12 * scale,
        left: -9 * scale,
        width: 12 * scale,
        height: 12 * scale,
        transform: 'rotate(45deg)'
      };
    }
  },
  // Objects - these have fixed colors and complex structures
  {
    name: 'Fridge',
    type: 'object',
    category: 'appliances',
    css: (color, size) => `.fridge {
  width: ${size}px;
  height: auto;
  text-align: center;
}
.fridge-body {
  background-color: #1abc9c;
  width: ${Math.round(size * 0.625)}px;
  height: ${size}px;
  border-radius: ${Math.round(size * 0.05)}px ${Math.round(size * 0.05)}px ${Math.round(size * 0.025)}px ${Math.round(size * 0.025)}px;
  margin: 0 auto;
  position: relative;
}
.fridge-body .handle {
  position: absolute;
  right: ${Math.round(size * 0.05)}px;
  width: ${Math.round(size * 0.0875)}px;
  height: ${Math.round(size * 0.0375)}px;
}
.fridge-body .handle:before {
  content: '';
  width: 100%;
  height: ${Math.round(size * 0.0125)}px;
  background: #efefef;
  border-top-left-radius: ${Math.round(size * 0.125)}px ${Math.round(size * 0.0125)}px;
  border-top-right-radius: ${Math.round(size * 0.0125)}px;
  display: block;
}
.fridge-body .handle:after {
  content: '';
  width: 100%;
  height: ${Math.round(size * 0.0125)}px;
  background: #d9d8d9;
  border-bottom-left-radius: ${Math.round(size * 0.125)}px ${Math.round(size * 0.0125)}px;
  border-bottom-right-radius: ${Math.round(size * 0.0125)}px;
  display: block;
  box-shadow: 0px 2px 2px 0px rgba(0,0,0,0.25);
}
.fridge-body .handle.top {
  top: ${Math.round(size * 0.225)}px;
}
.fridge-body .handle.bottom {
  top: ${Math.round(size * 0.375)}px;
}
.fridge-body .divider {
  width: ${Math.round(size * 0.625)}px;
  height: ${Math.round(size * 0.01)}px;
  background: #2c3e50;
  position: absolute;
  top: ${Math.round(size * 0.3)}px;
}
.fridge-body .divider:before,
.fridge-body .divider:after {
  content: '';
  display: block;
  background: #e7e7e8;
  position: absolute;
  width: 100%;
  height: ${Math.round(size * 0.0125)}px;
}
.fridge-body .divider:before {
  top: ${Math.round(size * -0.0125)}px;
}
.fridge-body .divider:after {
  bottom: ${Math.round(size * -0.0125)}px;
}
.fridge-body .highlight {
  width: ${Math.round(size * 0.03)}px;
  background-color: rgba(255,255,255,0.3);
}
.fridge-body .highlight.top {
  position: absolute;
  top: ${Math.round(size * 0.03)}px;
  left: ${Math.round(size * 0.0375)}px;
  height: ${Math.round(size * 0.05)}px;
  border-radius: ${Math.round(size * 0.0375)}px;
  transform: rotate(45deg);
}
.fridge-body .highlight.bottom {
  position: absolute;
  top: ${Math.round(size * 0.125)}px;
  left: ${Math.round(size * 0.025)}px;
  height: ${Math.round(size * 0.75)}px;
  border-radius: ${Math.round(size * 0.0375)}px;
}
.fridge-body .shadow-bottom {
  position: absolute;
  bottom: 0;
  height: ${Math.round(size * 0.03)}px;
  width: 100%;
  background: rgba(0,0,0,0.1);
  border-radius: 0 0 ${Math.round(size * 0.025)}px ${Math.round(size * 0.025)}px;
}
.fridge-shadow {
  width: ${Math.round(size * 0.75)}px;
  height: ${Math.round(size * 0.0875)}px;
  background-color: rgba(0,0,0,0.2);
  margin: ${Math.round(size * 0.05)}px auto 0 auto;
  border-radius: 50%;
}`,
    previewStyle: (color, size) => ({
      width: size * 0.625,
      height: size,
      background: '#1abc9c',
      borderRadius: `${size * 0.05}px ${size * 0.05}px ${size * 0.025}px ${size * 0.025}px`,
      position: 'relative',
      boxShadow: 'inset 8px 0 20px rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.2)'
    }),
    previewBeforeStyle: (color, size) => ({
      content: '""',
      position: 'absolute',
      top: size * 0.3,
      left: 0,
      width: '100%',
      height: size * 0.01,
      background: '#2c3e50',
      boxShadow: `0 ${size * -0.0125}px 0 #e7e7e8, 0 ${size * 0.015}px 0 #e7e7e8`
    }),
    previewAfterStyle: (color, size) => ({
      content: '""',
      position: 'absolute',
      top: size * 0.225,
      right: size * 0.08,
      width: size * 0.0875,
      height: size * 0.0375,
      background: 'linear-gradient(to bottom, #efefef 50%, #d9d8d9 50%)',
      borderTopLeftRadius: `${size * 0.05}px ${size * 0.01}px`,
      borderBottomLeftRadius: `${size * 0.05}px ${size * 0.01}px`,
      boxShadow: `0 ${size * 0.003}px ${size * 0.003}px rgba(0,0,0,0.25)`
    }),
    // Extra elements for complex objects - rendered as additional children
    previewExtraElements: (color, size) => [
      {
        style: {
          position: 'absolute',
          top: size * 0.375,
          right: size * 0.08,
          width: size * 0.0875,
          height: size * 0.0375,
          background: 'linear-gradient(to bottom, #efefef 50%, #d9d8d9 50%)',
          borderTopLeftRadius: `${size * 0.05}px ${size * 0.01}px`,
          borderBottomLeftRadius: `${size * 0.05}px ${size * 0.01}px`,
          boxShadow: `0 ${size * 0.003}px ${size * 0.003}px rgba(0,0,0,0.25)`
        }
      }
    ],
    // Objects have fixed colors - no color customization
    fixedColors: true,
    htmlStructure: `<div class="fridge">
  <div class="fridge-body">
    <div class="handle top"></div>
    <div class="handle bottom"></div>
    <div class="divider"></div>
    <div class="highlight top"></div>
    <div class="highlight bottom"></div>
    <div class="shadow-bottom"></div>
  </div>
  <div class="fridge-shadow"></div>
</div>`
  },
  {
    name: 'Pencil',
    type: 'object',
    category: 'stationery',
    css: (color, size) => {
      const width = size * 3;
      const height = size * 0.5;
      return `.pencil {
  width: ${width}px;
  height: ${height}px;
  background: 
    linear-gradient(90deg,#e7e7e7 30%,#fe668c 0) 100%/50px 100% no-repeat, 
    conic-gradient(from 55deg at left,#fee7b3,#0000 1deg 69deg,#fee7b3 70deg) 100% 8px/calc(100% - 40px) 16px repeat-y, 
    linear-gradient(#0003 50%,#0000 0) 100% 8px/calc(100% - 41px) 32px repeat-y, 
    linear-gradient(90deg,#2b2026 15px,#fee7b3 16px 40px,#fecc2b 0);
  clip-path: polygon(0 50%,42px 0,100% 0,100% 100%,42px 100%);
  border-radius: 0 10px 10px 0;
}`;
    },
    previewStyle: (color, size) => {
      const width = size * 1.5;
      const height = size * 0.25;
      return {
        width: width,
        height: height,
        background: `
          linear-gradient(90deg,#e7e7e7 30%,#fe668c 0) 100%/25px 100% no-repeat, 
          conic-gradient(from 55deg at left,#fee7b3,#0000 1deg 69deg,#fee7b3 70deg) 100% 4px/calc(100% - 20px) 8px repeat-y, 
          linear-gradient(#0003 50%,#0000 0) 100% 4px/calc(100% - 21px) 16px repeat-y, 
          linear-gradient(90deg,#2b2026 8px,#fee7b3 8px 20px,#fecc2b 0)`,
        clipPath: 'polygon(0 50%,21px 0,100% 0,100% 100%,21px 100%)',
        borderRadius: '0 5px 5px 0'
      };
    },
    fixedColors: true,
    htmlStructure: `<div class="pencil"></div>`
  },
  {
    name: 'Eraser',
    type: 'object',
    category: 'stationery',
    css: (color, size) => {
      const width = size * 1.6;
      const height = size;
      return `.eraser-wrapper {
  width: ${width}px;
  height: ${height}px;
  border-radius: ${size * 0.04}px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: linear-gradient(#7ea246 4%, #0175a2 5%, #0175a2 75%, #f7f7f7 76%, #f7f7f7 94%, #a7a7a7);
  position: relative;
  filter: drop-shadow(0 0 6px #a7a7a7);
}
.eraser-wrapper .blob {
  width: ${width * 1.25}px;
  height: ${height * 0.88}px;
  background: #8fbd40;
  clip-path: circle(50% at 90% 120%);
  position: absolute;
  right: 0;
  top: ${height * -0.128}px;
}
.eraser-wrapper .eraser {
  width: ${height * 0.6}px;
  height: ${height * 0.94}px;
  border-radius: ${size * 0.04}px 0 0 ${size * 0.04}px;
  position: absolute;
  left: ${height * -0.56}px;
  background: linear-gradient(#f8f7fb 2%, #dfe3ec 94%, #c0c4c7);
}`;
    },
    previewStyle: (color, size) => {
      const width = size * 1.2;
      const height = size * 0.75;
      const eraserWidth = height * 0.6;
      return {
        width: width,
        height: height,
        borderRadius: size * 0.03,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: 'linear-gradient(#7ea246 4%, #0175a2 5%, #0175a2 75%, #f7f7f7 76%, #f7f7f7 94%, #a7a7a7)',
        position: 'relative',
        filter: 'drop-shadow(0 0 3px #a7a7a7)',
        overflow: 'visible',
        marginLeft: eraserWidth * 0.9
      };
    },
    previewBeforeStyle: (color, size) => {
      const width = size * 1.2;
      const height = size * 0.75;
      return {
        content: '""',
        width: width * 1.25,
        height: height * 0.88,
        background: '#8fbd40',
        clipPath: 'circle(50% at 90% 120%)',
        position: 'absolute',
        right: 0,
        top: height * -0.128
      };
    },
    previewAfterStyle: (color, size) => {
      const height = size * 0.75;
      return {
        content: '""',
        width: height * 0.6,
        height: height * 0.94,
        borderRadius: `${size * 0.03}px 0 0 ${size * 0.03}px`,
        position: 'absolute',
        left: height * -0.56,
        background: 'linear-gradient(#f8f7fb 2%, #dfe3ec 94%, #c0c4c7)'
      };
    },
    fixedColors: true,
    htmlStructure: `<div class="eraser-wrapper">
  <div class="blob"></div>
  <div class="eraser"></div>
</div>`
  }
];


