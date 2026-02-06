import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { shapes } from './utils/shapes';

function CssShapes() {
  const [tailwindLoaded, setTailwindLoaded] = useState(false);
  const [selectedShape, setSelectedShape] = useState(null);
  const [copied, setCopied] = useState(false);
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Color state - supports gradients
  const [colorMode, setColorMode] = useState('solid'); // solid, linear, radial
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [secondaryColor, setSecondaryColor] = useState('#ec4899');
  const [gradientAngle, setGradientAngle] = useState(135);
  const [size, setSize] = useState(100);

  // Compute the color value based on mode
  const colorValue = useMemo(() => {
    if (colorMode === 'solid') {
      return primaryColor;
    } else if (colorMode === 'linear') {
      return `linear-gradient(${gradientAngle}deg, ${primaryColor}, ${secondaryColor})`;
    } else {
      return `radial-gradient(circle, ${primaryColor}, ${secondaryColor})`;
    }
  }, [colorMode, primaryColor, secondaryColor, gradientAngle]);

  useEffect(() => {
    if (!document.getElementById('tailwind-script')) {
      const tailwindScript = document.createElement('script');
      tailwindScript.id = 'tailwind-script';
      tailwindScript.src = 'https://cdn.tailwindcss.com';
      tailwindScript.onload = () => {
        setTimeout(() => setTailwindLoaded(true), 100);
      };
      document.head.appendChild(tailwindScript);
    } else {
      setTailwindLoaded(true);
    }
  }, []);

  useEffect(() => {
    document.body.style.background = '#ffffff';
    document.documentElement.style.minHeight = '100%';
    return () => {
      document.body.style.background = '';
      document.documentElement.style.minHeight = '';
    };
  }, []);

  const categories = useMemo(() => {
    const cats = ['all', ...new Set(shapes.map(s => s.category))];
    return cats;
  }, []);

  const filteredShapes = useMemo(() => {
    return shapes.filter(shape => {
      const matchesCategory = category === 'all' || shape.category === category;
      const matchesSearch = shape.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           shape.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [category, searchQuery]);

  const generateCSS = useCallback((shape) => {
    return shape.css(colorValue, size);
  }, [colorValue, size]);

  const copyToClipboard = useCallback((text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const renderShapePreview = useCallback((shape, previewSize = 60) => {
    const style = shape.previewStyle(colorValue, previewSize);
    return <div style={style} />;
  }, [colorValue]);

  // Color Controls Component
  const ColorControls = () => (
    <div>
      {/* Color Mode Toggle */}
      <div className="mb-6">
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Color Type</label>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#fafafa' }}>
          {[
            { id: 'solid', label: 'Solid' },
            { id: 'linear', label: 'Linear' },
            { id: 'radial', label: 'Radial' }
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => setColorMode(mode.id)}
              className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                background: colorMode === mode.id ? 'white' : 'transparent',
                color: colorMode === mode.id ? '#374151' : '#9ca3af',
                boxShadow: colorMode === mode.id ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Color */}
      <div className="mb-6">
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
          {colorMode === 'solid' ? 'Color' : 'Start Color'}
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
            style={{ background: 'transparent' }}
          />
          <input
            type="text"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl text-sm font-mono text-gray-700 outline-none"
            style={{ background: '#fafafa', border: '1px solid #f0f0f0' }}
          />
        </div>
      </div>

      {/* Secondary Color (for gradients) */}
      {colorMode !== 'solid' && (
        <div className="mb-6">
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">End Color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
              style={{ background: 'transparent' }}
            />
            <input
              type="text"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl text-sm font-mono text-gray-700 outline-none"
              style={{ background: '#fafafa', border: '1px solid #f0f0f0' }}
            />
          </div>
        </div>
      )}

      {/* Gradient Angle (for linear) */}
      {colorMode === 'linear' && (
        <div className="mb-6">
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
            Angle: {gradientAngle}°
          </label>
          <input
            type="range"
            min="0"
            max="360"
            value={gradientAngle}
            onChange={(e) => setGradientAngle(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ background: `linear-gradient(to right, #6366f1 ${gradientAngle / 360 * 100}%, #f0f0f0 ${gradientAngle / 360 * 100}%)` }}
          />
        </div>
      )}

      {/* Color Preview */}
      <div className="mb-6">
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Preview</label>
        <div 
          className="h-8 rounded-lg"
          style={{ background: colorValue }}
        />
      </div>

      {/* Quick Colors */}
      <div className="mb-6">
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Quick Colors</label>
        <div className="flex flex-wrap gap-2">
          {['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#14b8a6'].map(c => (
            <button
              key={c}
              onClick={() => setPrimaryColor(c)}
              className="w-7 h-7 rounded-lg transition-transform hover:scale-110"
              style={{ 
                background: c,
                boxShadow: primaryColor === c ? '0 0 0 2px white, 0 0 0 3px ' + c : 'none'
              }}
            />
          ))}
        </div>
      </div>

      {/* Quick Gradients */}
      {colorMode !== 'solid' && (
        <div>
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Quick Gradients</label>
          <div className="flex flex-wrap gap-2">
            {[
              { from: '#6366f1', to: '#ec4899' },
              { from: '#10b981', to: '#3b82f6' },
              { from: '#f59e0b', to: '#ef4444' },
              { from: '#8b5cf6', to: '#ec4899' },
              { from: '#14b8a6', to: '#6366f1' },
              { from: '#1e1e1e', to: '#6b7280' }
            ].map((g, i) => (
              <button
                key={i}
                onClick={() => { setPrimaryColor(g.from); setSecondaryColor(g.to); }}
                className="w-7 h-7 rounded-lg transition-transform hover:scale-110"
                style={{ 
                  background: colorMode === 'linear' 
                    ? `linear-gradient(${gradientAngle}deg, ${g.from}, ${g.to})`
                    : `radial-gradient(circle, ${g.from}, ${g.to})`,
                  boxShadow: primaryColor === g.from && secondaryColor === g.to ? '0 0 0 2px white, 0 0 0 3px #6366f1' : 'none'
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (!tailwindLoaded) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center', 
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#6b7280'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }} className="min-h-screen">
      {/* Header */}
      <div className="px-8 py-6 border-b" style={{ borderColor: '#f0f0f0' }}>
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">CSS Shapes</h1>
        <p className="text-gray-400 text-sm font-normal">Copy-paste ready CSS shapes for your projects</p>
      </div>

      <div className="flex" style={{ minHeight: 'calc(100vh - 85px)' }}>
        {/* Sidebar - Controls */}
        <div className="w-72 p-6 border-r overflow-auto" style={{ borderColor: '#f0f0f0' }}>
          {!selectedShape ? (
            <>
              {/* Search */}
              <div className="mb-6">
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Search</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search shapes..."
                  className="w-full px-4 py-3 rounded-xl text-sm text-gray-700 outline-none transition-all"
                  style={{ background: '#fafafa', border: '1px solid #f0f0f0' }}
                />
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: category === cat ? '#6366f1' : '#fafafa',
                        color: category === cat ? 'white' : '#6b7280',
                        border: category === cat ? 'none' : '1px solid #f0f0f0'
                      }}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <ColorControls />
              
              {/* Size Slider */}
              <div className="mb-6">
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Size: {size}px
                </label>
                <input
                  type="range"
                  min="40"
                  max="200"
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, #6366f1 ${(size - 40) / 160 * 100}%, #f0f0f0 ${(size - 40) / 160 * 100}%)` }}
                />
              </div>
            </>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-auto">
          {selectedShape ? (
            <ShapeDetailView
              shape={selectedShape}
              onBack={() => setSelectedShape(null)}
              generateCSS={generateCSS}
              renderShapePreview={renderShapePreview}
              size={size}
              copied={copied}
              copyToClipboard={copyToClipboard}
              colorValue={colorValue}
            />
          ) : (
            <ShapeGrid
              shapes={filteredShapes}
              onSelect={setSelectedShape}
              renderShapePreview={renderShapePreview}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Shape Detail View Component
function ShapeDetailView({ shape, onBack, generateCSS, renderShapePreview, size, copied, copyToClipboard, colorValue }) {
  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-sm mb-6 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to shapes
      </button>

      <div className="flex gap-8">
        <div 
          className="flex items-center justify-center rounded-2xl flex-shrink-0"
          style={{ 
            width: '280px', 
            height: '280px',
            background: '#fafafa',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.05)'
          }}
        >
          {renderShapePreview(shape, size)}
        </div>

        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">{shape.name}</h2>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-gray-400 text-sm">{shape.category}</span>
            <span 
              className="h-4 w-12 rounded"
              style={{ background: colorValue }}
            />
          </div>

          <div className="relative">
            <pre 
              className="p-5 rounded-xl text-sm overflow-auto"
              style={{ background: '#1e1e1e', color: '#d4d4d4', maxHeight: '400px' }}
            >
              <code>{generateCSS(shape)}</code>
            </pre>
            <button
              onClick={() => copyToClipboard(generateCSS(shape))}
              className="absolute top-3 right-3 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ background: copied ? '#10b981' : '#6366f1', color: 'white' }}
            >
              {copied ? 'Copied!' : 'Copy CSS'}
            </button>
          </div>

          <div className="mt-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">HTML Usage</p>
            <pre 
              className="p-4 rounded-xl text-sm"
              style={{ background: '#fafafa', border: '1px solid #f0f0f0', color: '#374151' }}
            >
              <code>{`<div class="${shape.name.toLowerCase().replace(/\s+/g, '-')}"></div>`}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

// Shape Grid Component
function ShapeGrid({ shapes, onSelect, renderShapePreview }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-gray-700">
          {shapes.length} shape{shapes.length !== 1 ? 's' : ''}
        </h2>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
        {shapes.map(shape => (
          <button
            key={shape.name}
            onClick={() => onSelect(shape)}
            className="p-4 rounded-xl transition-all hover:scale-105 text-center group"
            style={{
              background: 'white',
              border: '1px solid #f0f0f0',
              boxShadow: '0 10px 40px -15px rgba(0, 0, 0, 0.05)'
            }}
          >
            <div className="flex items-center justify-center h-16 mb-3">
              {renderShapePreview(shape, 50)}
            </div>
            <p className="text-xs font-medium text-gray-700 truncate">{shape.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{shape.category}</p>
          </button>
        ))}
      </div>

      {shapes.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-400">No shapes found</p>
        </div>
      )}
    </div>
  );
}

export default CssShapes;
