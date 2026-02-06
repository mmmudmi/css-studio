import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { shapes } from '../utils/shapes';

// Custom hook for localStorage persistence
function useStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

function CssShapes() {
  const [tailwindLoaded, setTailwindLoaded] = useState(false);
  const [selectedShape, setSelectedShape] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [activeTab, setActiveTab] = useState('search'); // 'search', 'create', or 'saved'
  const [shapeType, setShapeType] = useState('all'); // 'all', 'shape', or 'object'
  const [savedShapeType, setSavedShapeType] = useState('all'); // 'all', 'shape', 'object', or 'creation'
  const [searchQuery, setSearchQuery] = useState('');
  const [savedSearchQuery, setSavedSearchQuery] = useState('');
  
  // Save dialog state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveDialogName, setSaveDialogName] = useState('');
  
  // Delete confirmation dialog state
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(null); // { title, message, onConfirm }
  
  // Notification state
  const [notification, setNotification] = useState(null); // { message: string, type: 'success' | 'error' }
  
  // Show notification helper
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);
  
  // Ref to store the addShapeToCanvas callback from ShapeCreator
  const addShapeToCanvasRef = React.useRef(null);
  
  // Saved shapes state
  const [savedShapes, setSavedShapes] = useStorage('savedShapes', []);
  
  // Custom library shapes (shapes added to main library from saved items)
  const [customLibraryShapes, setCustomLibraryShapes] = useStorage('customLibraryShapes', []);
  
  // Add to Library dialog state
  const [addToLibraryDialog, setAddToLibraryDialog] = useState(null); // { shape, name, type }
  
  // Color state - supports gradients
  const [colorMode, setColorMode] = useState('solid'); // solid, linear, radial
  const [primaryColor, setPrimaryColor] = useState('#004aad');
  const [secondaryColor, setSecondaryColor] = useState('#ffde59');
  const [gradientAngle, setGradientAngle] = useState(135);
  const [colorOpacity, setColorOpacity] = useState(100); // 0-100
  const [size, setSize] = useState(100);

  // Transform state - rotation and flip
  const [rotation, setRotation] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);

  // Shape-specific options (for shapes with custom controls like Blob)
  const [shapeOptions, setShapeOptions] = useState({});

  // Compute transform value
  const transformValue = useMemo(() => {
    const transforms = [];
    if (rotation !== 0) transforms.push(`rotate(${rotation}deg)`);
    if (flipX) transforms.push('scaleX(-1)');
    if (flipY) transforms.push('scaleY(-1)');
    return transforms.length > 0 ? transforms.join(' ') : 'none';
  }, [rotation, flipX, flipY]);

  // Helper to convert hex to rgba
  const hexToRgba = useCallback((hex, opacity) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
    }
    return hex;
  }, []);

  // Compute the color value based on mode
  const colorValue = useMemo(() => {
    const primaryRgba = hexToRgba(primaryColor, colorOpacity);
    const secondaryRgba = hexToRgba(secondaryColor, colorOpacity);
    
    if (colorMode === 'solid') {
      return colorOpacity < 100 ? primaryRgba : primaryColor;
    } else if (colorMode === 'linear') {
      return `linear-gradient(${gradientAngle}deg, ${colorOpacity < 100 ? primaryRgba : primaryColor}, ${colorOpacity < 100 ? secondaryRgba : secondaryColor})`;
    } else {
      return `radial-gradient(circle, ${colorOpacity < 100 ? primaryRgba : primaryColor}, ${colorOpacity < 100 ? secondaryRgba : secondaryColor})`;
    }
  }, [colorMode, primaryColor, secondaryColor, gradientAngle, colorOpacity, hexToRgba]);

  // Reset all settings to defaults
  const resetToDefaults = useCallback(() => {
    setColorMode('solid');
    setPrimaryColor('#004aad');
    setSecondaryColor('#ffde59');
    setGradientAngle(135);
    setColorOpacity(100);
    setSize(100);
    setRotation(0);
    setFlipX(false);
    setFlipY(false);
    setShapeOptions({});
  }, []);

  // Close shape card and reset settings
  const closeShapeCard = useCallback(() => {
    setSelectedShape(null);
    resetToDefaults();
  }, [resetToDefaults]);

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
    document.body.style.background = '#fff';
    document.documentElement.style.minHeight = '100%';
    return () => {
      document.body.style.background = '';
      document.documentElement.style.minHeight = '';
    };
  }, []);

  // Merge custom library shapes with imported shapes
  const allShapes = useMemo(() => {
    // Convert custom library shapes to have proper functions
    const customWithFunctions = customLibraryShapes.map(customShape => {
      // For creations, generate CSS/preview from the creation shapes
      if (customShape.creationShapes && customShape.creationShapes.length > 0) {
        return {
          ...customShape,
          css: (color, size) => {
            // Generate CSS for the creation
            const creationShapes = customShape.creationShapes;
            const scale = size / 100;
            return `.${customShape.name.toLowerCase().replace(/\s+/g, '-')} {
  position: relative;
  width: ${Math.round(600 * scale)}px;
  height: ${Math.round(400 * scale)}px;
}
${creationShapes.map((shape, index) => {
  const className = `${customShape.name.toLowerCase().replace(/\s+/g, '-')}-part-${index + 1}`;
  let css = `.${className} {\n`;
  css += `  position: absolute;\n`;
  css += `  left: ${Math.round(shape.x * scale)}px;\n`;
  css += `  top: ${Math.round(shape.y * scale)}px;\n`;
  css += `  width: ${Math.round(shape.width * scale)}px;\n`;
  css += `  height: ${Math.round(shape.height * scale)}px;\n`;
  css += `  background: ${shape.color || color};\n`;
  if (shape.type === 'circle' || shape.type === 'ellipse') {
    css += `  border-radius: 50%;\n`;
  }
  if (shape.rotation) {
    css += `  transform: rotate(${shape.rotation}deg);\n`;
  }
  if (shape.opacity !== undefined && shape.opacity !== 100) {
    css += `  opacity: ${shape.opacity / 100};\n`;
  }
  css += `}`;
  return css;
}).join('\n')}`;
          },
          previewStyle: (color, size) => ({
            position: 'relative',
            width: size,
            height: size * 0.67,
          }),
          previewChildren: customShape.creationShapes,
          isCreation: true
        };
      }
      return customShape;
    });
    
    return [...shapes, ...customWithFunctions];
  }, [customLibraryShapes]);

  const filteredShapes = useMemo(() => {
    return allShapes.filter(shape => {
      const matchesSearch = shape.name.toLowerCase().includes(searchQuery.toLowerCase());
      // Default type is 'shape' if not specified
      const matchesType = shapeType === 'all' || (shape.type || 'shape') === shapeType;
      return matchesSearch && matchesType;
    });
  }, [allShapes, searchQuery, shapeType]);

  // Save current shape with all modifications
  const saveCurrentShape = useCallback((customName) => {
    if (!selectedShape) return;
    
    const shapeName = customName || selectedShape.name;
    const savedShape = {
      id: Date.now(),
      name: shapeName,
      originalName: selectedShape.name,
      category: 'saved',
      // Carry over type tag (shape or object)
      type: selectedShape.type || 'shape',
      // Carry over color restrictions
      solidOnly: selectedShape.solidOnly || false,
      disableLinearGradient: selectedShape.disableLinearGradient || false,
      // Save all customization options
      savedColor: colorValue,
      savedColorMode: colorMode,
      savedPrimaryColor: primaryColor,
      savedSecondaryColor: secondaryColor,
      savedGradientAngle: gradientAngle,
      savedOpacity: colorOpacity,
      savedSize: size,
      savedRotation: rotation,
      savedFlipX: flipX,
      savedFlipY: flipY,
      savedOptions: shapeOptions[selectedShape.name] || {}
      // Note: Don't save functions - they can't be serialized to localStorage
    };
    
    setSavedShapes(prev => [...prev, savedShape]);
    showNotification(`"${shapeName}" saved to library!`, 'success');
    setShowSaveDialog(false);
    setSaveDialogName('');
  }, [selectedShape, colorValue, colorMode, primaryColor, secondaryColor, gradientAngle, size, rotation, flipX, flipY, shapeOptions, setSavedShapes, showNotification]);

  // Restore saved shapes with functions from original shapes array
  const savedShapesWithFunctions = useMemo(() => {
    return savedShapes.map(saved => {
      // Handle custom creations from the Create tab
      if (saved.isCreation) {
        return {
          ...saved,
          // Custom creations don't need original shape functions
          // They have their own rendering logic
          css: () => '/* Custom creation - see individual shapes */',
          previewStyle: () => ({}),
        };
      }
      
      // Handle regular saved shapes
      const originalShape = shapes.find(s => s.name === saved.originalName);
      if (!originalShape) return null;
      return {
        ...saved,
        css: originalShape.css,
        previewStyle: originalShape.previewStyle,
        previewBeforeStyle: originalShape.previewBeforeStyle,
        previewAfterStyle: originalShape.previewAfterStyle,
        controls: originalShape.controls
      };
    }).filter(Boolean);
  }, [savedShapes]);

  // Filter saved shapes based on search query and type
  const filteredSavedShapes = useMemo(() => {
    return savedShapesWithFunctions.filter(shape => {
      // Filter by search query
      const matchesSearch = !savedSearchQuery.trim() || 
        shape.name.toLowerCase().includes(savedSearchQuery.toLowerCase());
      
      // Filter by type
      let matchesType = true;
      if (savedShapeType === 'shape') {
        matchesType = !shape.isCreation && (shape.type || 'shape') === 'shape';
      } else if (savedShapeType === 'object') {
        matchesType = !shape.isCreation && shape.type === 'object';
      } else if (savedShapeType === 'creation') {
        matchesType = shape.isCreation === true;
      }
      
      return matchesSearch && matchesType;
    });
  }, [savedShapesWithFunctions, savedSearchQuery, savedShapeType]);

  // Delete a saved shape
  const deleteSavedShape = useCallback((id) => {
    const shapeToDelete = savedShapes.find(s => s.id === id);
    setSavedShapes(prev => prev.filter(s => s.id !== id));
    showNotification(`"${shapeToDelete?.name || 'Shape'}" deleted from library`, 'success');
  }, [setSavedShapes, savedShapes, showNotification]);

  // Rename a saved shape
  const renameSavedShape = useCallback((id, newName) => {
    setSavedShapes(prev => prev.map(s => 
      s.id === id ? { ...s, name: newName } : s
    ));
    showNotification(`Shape renamed to "${newName}"`, 'success');
  }, [setSavedShapes, showNotification]);

  // Update a saved creation (overwrite)
  const updateSavedCreation = useCallback((id, updates) => {
    setSavedShapes(prev => prev.map(s => 
      s.id === id ? { ...s, ...updates } : s
    ));
    showNotification(`"${updates.name || 'Creation'}" updated`, 'success');
  }, [setSavedShapes, showNotification]);

  // Save as new creation (duplicate with modifications)
  const saveAsNewCreation = useCallback((creationData) => {
    const newCreation = {
      id: Date.now(),
      name: creationData.name || 'Custom Creation',
      originalName: 'Custom Creation',
      category: 'saved',
      isCreation: true,
      creationShapes: creationData.shapes,
      savedColor: '#004aad',
      savedColorMode: 'solid',
      savedPrimaryColor: '#004aad',
      savedSecondaryColor: '#ffde59',
      savedGradientAngle: 135,
      savedSize: 100,
      savedRotation: 0,
      savedFlipX: false,
      savedFlipY: false,
      savedOptions: {}
    };
    setSavedShapes(prev => [...prev, newCreation]);
    showNotification(`"${newCreation.name}" saved as new item`, 'success');
    return newCreation;
  }, [setSavedShapes, showNotification]);

  // Add a saved custom creation to the main library
  const addToLibrary = useCallback((savedShape, name, libraryType) => {
    // Create a library shape from the saved creation
    const libraryShape = {
      id: `custom-${Date.now()}`,
      name: name,
      type: libraryType, // 'shape' or 'object'
      category: libraryType === 'object' ? 'custom-objects' : 'custom-shapes',
      isCustomLibrary: true,
      // Store the creation data
      creationShapes: savedShape.creationShapes || [],
      // For non-creation items, store the original shape data
      originalShape: savedShape.isCreation ? null : {
        name: savedShape.name,
        originalName: savedShape.originalName,
        type: savedShape.type,
        savedColor: savedShape.savedColor,
        savedColorMode: savedShape.savedColorMode,
        savedPrimaryColor: savedShape.savedPrimaryColor,
        savedSecondaryColor: savedShape.savedSecondaryColor,
        savedGradientAngle: savedShape.savedGradientAngle,
        savedSize: savedShape.savedSize,
        savedRotation: savedShape.savedRotation,
        savedFlipX: savedShape.savedFlipX,
        savedFlipY: savedShape.savedFlipY,
        savedOptions: savedShape.savedOptions
      },
      // Functions will be recreated when rendering
      css: null,
      previewStyle: null
    };
    
    setCustomLibraryShapes(prev => [...prev, libraryShape]);
    showNotification(`"${name}" added to ${libraryType === 'object' ? 'Objects' : 'Shapes'} library`, 'success');
    setAddToLibraryDialog(null);
  }, [setCustomLibraryShapes, showNotification]);

  // Delete a custom library shape
  const deleteCustomLibraryShape = useCallback((id) => {
    const shapeToDelete = customLibraryShapes.find(s => s.id === id);
    setCustomLibraryShapes(prev => prev.filter(s => s.id !== id));
    showNotification(`"${shapeToDelete?.name || 'Shape'}" removed from library`, 'success');
  }, [setCustomLibraryShapes, customLibraryShapes, showNotification]);

  // Load saved shape settings
  const loadSavedShape = useCallback((savedShape) => {
    setColorMode(savedShape.savedColorMode);
    setPrimaryColor(savedShape.savedPrimaryColor);
    setSecondaryColor(savedShape.savedSecondaryColor);
    setGradientAngle(savedShape.savedGradientAngle);
    setColorOpacity(savedShape.savedOpacity ?? 100);
    setSize(savedShape.savedSize);
    setRotation(savedShape.savedRotation);
    setFlipX(savedShape.savedFlipX);
    setFlipY(savedShape.savedFlipY);
    if (savedShape.savedOptions) {
      setShapeOptions(prev => ({
        ...prev,
        [savedShape.name]: savedShape.savedOptions
      }));
    }
    setSelectedShape(savedShape);
  }, []);

  const generateCSS = useCallback((shape) => {
    const options = shapeOptions[shape.name] || {};
    let css = shape.css(colorValue, size, options);
    if (transformValue !== 'none') {
      // Insert transform before the closing brace
      css = css.replace(/}$/, `  transform: ${transformValue};\n}`);
    }
    return css;
  }, [colorValue, size, transformValue, shapeOptions]);

  const copyToClipboard = useCallback((text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const copyHtmlToClipboard = useCallback((text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2000);
    });
  }, []);

  const renderShapePreview = useCallback((shape, previewSize = 60, applyTransform = false, overrideColor = null) => {
    // Handle custom creations from the Create tab
    if (shape.isCreation && shape.creationShapes) {
      // Calculate bounding box to scale the creation preview
      const shapes = shape.creationShapes;
      if (shapes.length === 0) {
        return <div style={{ width: previewSize, height: previewSize, background: '#f0f0f0', borderRadius: 4 }} />;
      }
      
      const minX = Math.min(...shapes.map(s => s.x));
      const minY = Math.min(...shapes.map(s => s.y));
      const maxX = Math.max(...shapes.map(s => s.x + s.width));
      const maxY = Math.max(...shapes.map(s => s.y + s.height));
      const contentWidth = maxX - minX;
      const contentHeight = maxY - minY;
      const scale = Math.min(previewSize / contentWidth, previewSize / contentHeight) * 0.8;
      
      // Helper function to get clip-path
      const getClipPath = (type) => {
        switch (type) {
          case 'triangle': return 'polygon(50% 0%, 100% 100%, 0% 100%)';
          case 'rightTriangle': return 'polygon(0% 0%, 0% 100%, 100% 100%)';
          case 'diamond': return 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
          case 'pentagon': return 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)';
          case 'hexagon': return 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
          case 'star': return 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
          case 'arrow': return 'polygon(50% 0%, 100% 50%, 70% 50%, 70% 100%, 30% 100%, 30% 50%, 0% 50%)';
          default: return 'none';
        }
      };
      
      const getBorderRadius = (type) => {
        switch (type) {
          case 'circle': case 'ellipse': return '50%';
          case 'rectangle': case 'square': return '4px';
          default: return '0';
        }
      };
      
      return (
        <div style={{ 
          width: previewSize, 
          height: previewSize, 
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ 
            position: 'relative', 
            width: contentWidth * scale, 
            height: contentHeight * scale,
          }}>
            <div style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              transform: `scale(${scale})`, 
              transformOrigin: 'top left',
              width: contentWidth,
              height: contentHeight
            }}>
            {shapes.map((s, i) => {
              // Build transform string with rotation and flip
              const transforms = [];
              if (s.rotation) transforms.push(`rotate(${s.rotation}deg)`);
              if (s.flipX) transforms.push('scaleX(-1)');
              if (s.flipY) transforms.push('scaleY(-1)');
              const transformStr = transforms.length > 0 ? transforms.join(' ') : 'none';
              
              // Handle text shapes
              if (s.type === 'text') {
                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: s.x - minX,
                      top: s.y - minY,
                      width: s.width,
                      height: s.height,
                      color: s.color,
                      fontSize: s.fontSize || 16,
                      fontFamily: s.fontFamily || 'Arial, sans-serif',
                      fontWeight: s.fontWeight || 'normal',
                      fontStyle: s.fontStyle || 'normal',
                      textAlign: s.textAlign || 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: s.textAlign === 'center' ? 'center' : s.textAlign === 'right' ? 'flex-end' : 'flex-start',
                      transform: transformStr,
                      opacity: (s.opacity ?? 100) / 100,
                      overflow: 'hidden',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    {s.text || 'Text'}
                  </div>
                );
              }
              
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: s.x - minX,
                    top: s.y - minY,
                    width: s.width,
                    height: s.height,
                    background: s.color,
                    clipPath: getClipPath(s.type),
                    borderRadius: getBorderRadius(s.type),
                    transform: transformStr,
                    opacity: (s.opacity ?? 100) / 100
                  }}
                />
              );
            })}
            </div>
          </div>
        </div>
      );
    }
    
    const options = shapeOptions[shape.name] || {};
    // For objects with fixed colors, the previewStyle ignores the color parameter
    // For shapes, use override color if provided, otherwise use the current colorValue
    const displayColor = overrideColor !== null ? overrideColor : colorValue;
    const style = shape.previewStyle(displayColor, previewSize, options);
    if (applyTransform && transformValue !== 'none') {
      style.transform = transformValue;
    }
    
    // Handle shapes with ::before and/or ::after pseudo-elements
    if (shape.previewBeforeStyle || shape.previewAfterStyle || shape.previewExtraElements) {
      const beforeStyle = shape.previewBeforeStyle ? shape.previewBeforeStyle(displayColor, previewSize, options) : null;
      const afterStyle = shape.previewAfterStyle ? shape.previewAfterStyle(displayColor, previewSize, options) : null;
      const extraElements = shape.previewExtraElements ? shape.previewExtraElements(displayColor, previewSize, options) : [];
      return (
        <div style={style}>
          {beforeStyle && <div style={beforeStyle} />}
          {afterStyle && <div style={afterStyle} />}
          {extraElements.map((el, i) => <div key={i} style={el.style} />)}
        </div>
      );
    }
    
    return <div style={style} />;
  }, [colorValue, transformValue, shapeOptions]);

  // Color Controls Component
  const ColorControls = () => {
    const colorModes = [
      { id: 'solid', label: 'Solid' },
      { id: 'linear', label: 'Linear' },
      { id: 'radial', label: 'Radial' }
    ].filter(mode => {
      if (selectedShape?.solidOnly) {
        return mode.id === 'solid';
      }
      if (mode.id === 'linear' && selectedShape?.disableLinearGradient) {
        return false;
      }
      return true;
    });

    // Reset to solid if current mode is disabled
    React.useEffect(() => {
      if (selectedShape?.solidOnly && colorMode !== 'solid') {
        setColorMode('solid');
      } else if (colorMode === 'linear' && selectedShape?.disableLinearGradient) {
        setColorMode('solid');
      }
    }, [selectedShape]);

    return (
    <div>
      {/* Color Mode Toggle - hide when solidOnly */}
      {!selectedShape?.solidOnly && (
      <div className="mb-6">
        <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#000' }}>Color Type</label>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#f1f5f9' }}>
          {colorModes.map(mode => (
            <button
              key={mode.id}
              onClick={() => setColorMode(mode.id)}
              className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                background: colorMode === mode.id ? '#004aad' : 'transparent',
                color: colorMode === mode.id ? '#fff' : '#000',
                boxShadow: colorMode === mode.id ? '0 2px 8px rgba(0,74,173,0.2)' : 'none'
              }}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>
      )}

      {/* Primary Color */}
      <div className="mb-6">
        <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#000' }}>
          {colorMode === 'solid' ? 'Color' : 'Start Color'}
        </label>
        <div className="flex items-center gap-3">
          <div 
            className="relative w-10 h-10 rounded-full overflow-hidden cursor-pointer"
            style={{ background: 'conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)' }}
          >
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
            />
          </div>
          <input
            type="text"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl text-sm font-mono outline-none"
            style={{ background: '#fff', border: '1px solid #e0d9cc', color: '#000' }}
          />
        </div>
      </div>

      {/* Secondary Color (for gradients) */}
      {colorMode !== 'solid' && (
        <div className="mb-6">
          <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#000' }}>End Color</label>
          <div className="flex items-center gap-3">
            <div 
              className="relative w-10 h-10 rounded-full overflow-hidden cursor-pointer"
              style={{ background: 'conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)' }}
            >
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
              />
            </div>
            <input
              type="text"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl text-sm font-mono outline-none"
              style={{ background: '#fff', border: '1px solid #e0d9cc', color: '#000' }}
            />
          </div>
        </div>
      )}

      {/* Gradient Angle (for linear) */}
      {colorMode === 'linear' && (
        <div className="mb-6">
          <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#000' }}>
            Angle: {gradientAngle}°
          </label>
          <input
            type="range"
            min="0"
            max="360"
            value={gradientAngle}
            onChange={(e) => setGradientAngle(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ background: `linear-gradient(to right, #004aad ${gradientAngle / 360 * 100}%, #fff ${gradientAngle / 360 * 100}%)`, boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)' }}
          />
        </div>
      )}

      {/* Color Preview */}
      <div className="mb-6">
        <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#000' }}>Preview</label>
        <div 
          className="h-8 rounded-lg"
          style={{ background: colorValue }}
        />
      </div>

      {/* Quick Colors */}
      <div className="mb-6">
        <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#000' }}>Quick Colors</label>
        <div className="flex flex-wrap gap-2">
          {['#FF6B6B', '#FF9F43', '#ffde59', '#6BCB77', '#4D96FF', '#6A4C93', '#FF8FAB', '#2EC4B6', '#F1FAEE', '#A8DADC', '#457B9D', '#1D3557'].map(c => (
            <button
              key={c}
              onClick={() => setPrimaryColor(c)}
              className="w-7 h-7 rounded-lg transition-transform hover:scale-110"
              style={{ 
                background: c,
                border: c === '#F1FAEE' ? '1px solid #ccc' : 'none',
                boxShadow: primaryColor === c ? '0 0 0 2px white, 0 0 0 3px ' + c : 'none'
              }}
            />
          ))}
        </div>
      </div>

      {/* Quick Gradients */}
      {colorMode !== 'solid' && (
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#000' }}>Quick Gradients</label>
          <div className="flex flex-wrap gap-2">
            {[
              { from: '#004aad', to: '#ffde59' },
              { from: '#ffde59', to: '#004aad' },
              { from: '#004aad', to: '#f5efe6' },
              { from: '#10b981', to: '#3b82f6' },
              { from: '#f59e0b', to: '#ef4444' },
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
                  boxShadow: primaryColor === g.from && secondaryColor === g.to ? '0 0 0 2px white, 0 0 0 3px #004aad' : 'none'
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
  };

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
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: '#fff' }} className="min-h-screen">
      {/* Toast Notification */}
      {notification && (
        <div 
          className="fixed bottom-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-3"
          style={{
            background: notification.type === 'success' ? '#004aad' : '#ef4444',
            color: '#fff',
            animation: 'slideIn 0.3s ease-out'
          }}
        >
          {notification.type === 'success' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22,4 12,14.01 9,11.01" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          )}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Save Shape Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#000' }}>Save Shape</h3>
            <p className="text-sm mb-4" style={{ color: '#666' }}>
              Enter a name for this shape:
            </p>
            <input
              type="text"
              value={saveDialogName}
              onChange={(e) => setSaveDialogName(e.target.value)}
              placeholder="Shape name..."
              className="w-full px-4 py-3 rounded-xl text-sm outline-none mb-6"
              style={{ background: '#f9fafb', border: '2px solid #e5e7eb', color: '#000' }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && saveDialogName.trim()) {
                  saveCurrentShape(saveDialogName.trim());
                } else if (e.key === 'Escape') {
                  setShowSaveDialog(false);
                  setSaveDialogName('');
                }
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setSaveDialogName('');
                }}
                className="flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all"
                style={{ background: '#f1f5f9', color: '#666' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (saveDialogName.trim()) {
                    saveCurrentShape(saveDialogName.trim());
                  }
                }}
                className="flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                style={{ background: '#004aad', color: '#fff' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                  <polyline points="17,21 17,13 7,13 7,21" />
                  <polyline points="7,3 7,8 15,8" />
                </svg>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add to Library Dialog */}
      {addToLibraryDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#000' }}>Add to Library</h3>
            <p className="text-sm mb-4" style={{ color: '#666' }}>
              This will add your custom creation to the main shape library.
            </p>
            
            {/* Name Input */}
            <div className="mb-4">
              <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#000' }}>
                Name
              </label>
              <input
                type="text"
                value={addToLibraryDialog.name}
                onChange={(e) => setAddToLibraryDialog(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Shape name..."
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: '#f9fafb', border: '2px solid #e5e7eb', color: '#000' }}
                autoFocus
              />
            </div>
            
            {/* Type Selection */}
            <div className="mb-6">
              <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#000' }}>
                Add as
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setAddToLibraryDialog(prev => ({ ...prev, type: 'shape' }))}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                  style={{ 
                    background: addToLibraryDialog.type === 'shape' ? '#004aad' : '#f9fafb',
                    color: addToLibraryDialog.type === 'shape' ? '#fff' : '#666',
                    border: '2px solid',
                    borderColor: addToLibraryDialog.type === 'shape' ? '#004aad' : '#e5e7eb'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                  Shape
                </button>
                <button
                  onClick={() => setAddToLibraryDialog(prev => ({ ...prev, type: 'object' }))}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                  style={{ 
                    background: addToLibraryDialog.type === 'object' ? '#004aad' : '#f9fafb',
                    color: addToLibraryDialog.type === 'object' ? '#fff' : '#666',
                    border: '2px solid',
                    borderColor: addToLibraryDialog.type === 'object' ? '#004aad' : '#e5e7eb'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18M9 21V9" />
                  </svg>
                  Object
                </button>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setAddToLibraryDialog(null)}
                className="flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all"
                style={{ background: '#f1f5f9', color: '#666' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (addToLibraryDialog.name.trim()) {
                    addToLibrary(addToLibraryDialog.shape, addToLibraryDialog.name.trim(), addToLibraryDialog.type);
                  }
                }}
                className="flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                style={{ background: '#004aad', color: '#fff' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmDialog && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onKeyDown={(e) => e.key === 'Escape' && setDeleteConfirmDialog(null)}
          tabIndex={-1}
          ref={(el) => el?.focus()}
        >
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full" style={{ background: '#fee2e2' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold" style={{ color: '#000' }}>{deleteConfirmDialog.title}</h3>
            </div>
            <p className="text-sm mb-6" style={{ color: '#666' }}>
              {deleteConfirmDialog.message}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmDialog(null)}
                className="flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all"
                style={{ background: '#f1f5f9', color: '#666' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteConfirmDialog.onConfirm();
                  setDeleteConfirmDialog(null);
                }}
                className="flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                style={{ background: '#dc2626', color: '#fff' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="px-8 py-6" style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src="https://i.postimg.cc/5N639Lx9/Blue-and-Beige-Modern-Handwritten-Art-Logo.png" 
              alt="Logo" 
              style={{ height: '50px', width: 'auto', cursor: 'pointer' }}
              onClick={() => { setActiveTab('search'); closeShapeCard(); }}
            />
          </div>
          
          {/* Main Tabs */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#fff' }}>
            <button
              onClick={() => { setActiveTab('search'); closeShapeCard(); }}
              className="px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
              style={{
                background: activeTab === 'search' ? '#004aad' : 'transparent',
                color: activeTab === 'search' ? '#fff' : '#000',
                boxShadow: activeTab === 'search' ? '0 2px 8px rgba(0,74,173,0.2)' : 'none'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              Search
            </button>
            <button
              onClick={() => { setActiveTab('create'); closeShapeCard(); }}
              className="px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
              style={{
                background: activeTab === 'create' ? '#004aad' : 'transparent',
                color: activeTab === 'create' ? '#fff' : '#000',
                boxShadow: activeTab === 'create' ? '0 2px 8px rgba(0,74,173,0.2)' : 'none'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Create
            </button>
            <button
              onClick={() => { setActiveTab('saved'); closeShapeCard(); }}
              className="px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
              style={{
                background: activeTab === 'saved' ? '#004aad' : 'transparent',
                color: activeTab === 'saved' ? '#fff' : '#000',
                boxShadow: activeTab === 'saved' ? '0 2px 8px rgba(0,74,173,0.2)' : 'none'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                <polyline points="17,21 17,13 7,13 7,21" />
                <polyline points="7,3 7,8 15,8" />
              </svg>
              Saved
            </button>
          </div>
        </div>
      </div>

      <div className="flex" style={{ minHeight: 'calc(100vh - 85px)' }}>
        {/* Sidebar - Controls */}
        <div className="w-72 p-6 overflow-auto" style={{ background: '#fff', boxShadow: '2px 0 8px rgba(0, 0, 0, 0.08)' }}>
          {!selectedShape ? (
            activeTab === 'search' ? (
              <>
                {/* Search */}
                <div className="mb-6">
                  <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#000' }}>Search</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search shapes..."
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{ background: '#fff', border: 'none', color: '#000', boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)' }}
                  />
                </div>

                {/* Type Filter (Shapes vs Objects) */}
                <div className="mb-6">
                  <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#000' }}>Type</label>
                  <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#fff' }}>
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'shape', label: 'Shapes' },
                      { id: 'object', label: 'Objects' }
                    ].map(type => (
                      <button
                        key={type.id}
                        onClick={() => setShapeType(type.id)}
                        className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: shapeType === type.id ? '#004aad' : 'transparent',
                          color: shapeType === type.id ? '#fff' : '#000',
                          boxShadow: shapeType === type.id ? '0 2px 8px rgba(0,74,173,0.2)' : 'none'
                        }}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : activeTab === 'create' ? (
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide mb-3" style={{ color: '#000' }}>Add Shapes</label>
                <div className="grid grid-cols-2 gap-2">
                  {(() => {
                    const sidebarColors = ['#FF6B6B', '#FF9F43', '#ffde59', '#6BCB77', '#4D96FF', '#6A4C93', '#FF8FAB'];
                    const shapesList = [
                      { type: 'rectangle', name: 'Rectangle', getIcon: (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill={c}><rect x="2" y="4" width="20" height="16" rx="2" /></svg> },
                      { type: 'square', name: 'Square', getIcon: (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill={c}><rect x="3" y="3" width="18" height="18" rx="2" /></svg> },
                      { type: 'circle', name: 'Circle', getIcon: (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill={c}><circle cx="12" cy="12" r="10" /></svg> },
                      { type: 'ellipse', name: 'Ellipse', getIcon: (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill={c}><ellipse cx="12" cy="12" rx="10" ry="6" /></svg> },
                      { type: 'triangle', name: 'Triangle', getIcon: (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill={c}><polygon points="12,2 22,22 2,22" /></svg> },
                      { type: 'rightTriangle', name: 'Right Triangle', getIcon: (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill={c}><polygon points="2,2 2,22 22,22" /></svg> },
                      { type: 'diamond', name: 'Diamond', getIcon: (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill={c}><polygon points="12,2 22,12 12,22 2,12" /></svg> },
                      { type: 'pentagon', name: 'Pentagon', getIcon: (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill={c}><polygon points="12,2 22,9 18,22 6,22 2,9" /></svg> },
                      { type: 'hexagon', name: 'Hexagon', getIcon: (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill={c}><polygon points="6,2 18,2 23,12 18,22 6,22 1,12" /></svg> },
                      { type: 'star', name: 'Star', getIcon: (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill={c}><polygon points="12,2 15,9 22,9 17,14 19,22 12,17 5,22 7,14 2,9 9,9" /></svg> },
                      { type: 'arrow', name: 'Arrow', getIcon: (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill={c}><polygon points="12,2 22,12 16,12 16,22 8,22 8,12 2,12" /></svg> },
                      { type: 'text', name: 'Text', getIcon: (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill={c}><text x="12" y="17" textAnchor="middle" fontSize="14" fontWeight="bold" fontFamily="Arial">T</text></svg> },
                    ];
                    return shapesList.map((shape, index) => (
                      <button
                        key={shape.type}
                        onClick={() => addShapeToCanvasRef.current?.(shape.type)}
                        className="flex flex-col items-center gap-1 p-3 rounded-lg transition-all hover:scale-105"
                        style={{ background: '#fff', boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)', cursor: 'pointer' }}
                      >
                        {shape.getIcon(sidebarColors[index % sidebarColors.length])}
                        <span className="text-xs" style={{ color: '#000' }}>{shape.name}</span>
                      </button>
                    ));
                  })()}
                </div>
                <p className="text-xs mt-4 text-center" style={{ color: '#666' }}>
                  Click to add shapes to the canvas
                </p>
              </div>
            ) : (
              <div>
                {/* Search Saved Shapes */}
                <div className="mb-6">
                  <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#000' }}>Search Saved</label>
                  <input
                    type="text"
                    value={savedSearchQuery}
                    onChange={(e) => setSavedSearchQuery(e.target.value)}
                    placeholder="Search saved shapes..."
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{ background: '#fff', border: 'none', color: '#000', boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)' }}
                  />
                </div>

                {/* Type Filter for Saved */}
                <div className="mb-6">
                  <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#000' }}>Type</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'shape', label: 'Shapes' },
                      { id: 'object', label: 'Objects' },
                      { id: 'creation', label: 'Creations' }
                    ].map(type => (
                      <button
                        key={type.id}
                        onClick={() => setSavedShapeType(type.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: savedShapeType === type.id ? '#004aad' : '#fff',
                          color: savedShapeType === type.id ? '#fff' : '#000',
                          boxShadow: savedShapeType === type.id ? 'none' : 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="text-center py-4">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center" style={{ background: '#f1f5f9' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#004aad" strokeWidth="1.5">
                      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                      <polyline points="17,21 17,13 7,13 7,21" />
                      <polyline points="7,3 7,8 15,8" />
                    </svg>
                  </div>
                  <p className="text-xs" style={{ color: '#666' }}>
                    {savedShapes.length === 0 
                      ? 'No saved shapes yet'
                      : `${savedShapes.length} shape${savedShapes.length !== 1 ? 's' : ''} saved`
                    }
                  </p>
                </div>
              </div>
            )
          ) : selectedShape.id ? (
            /* Saved item - Show Edit (for creations), Add to Library, and Delete buttons */
            <div className="space-y-3">
              {/* Edit Button - only for custom creations */}
              {selectedShape.isCreation && (
                <button
                  onClick={() => {
                    const detailView = document.querySelector('[data-edit-creation-btn]');
                    if (detailView) detailView.click();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{ background: '#f1f5f9', color: '#004aad' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit
                </button>
              )}

              {/* Add to Library Button - for custom creations */}
              {selectedShape.isCreation && (
                <button
                  onClick={() => {
                    setAddToLibraryDialog({
                      shape: selectedShape,
                      name: selectedShape.name || 'Custom Shape',
                      type: 'shape'
                    });
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{ background: '#ffde59', color: '#000' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Add to Library
                </button>
              )}

              {/* Delete Button - for all saved items */}
              <button
                onClick={() => {
                  setDeleteConfirmDialog({
                    title: 'Delete Item',
                    message: `Are you sure you want to delete "${selectedShape.name}"? This action cannot be undone.`,
                    onConfirm: () => {
                      deleteSavedShape(selectedShape.id);
                      closeShapeCard();
                    }
                  });
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ background: '#fee2e2', color: '#dc2626' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
                Delete
              </button>
            </div>
          ) : (
            <>
              {/* Only show color controls for shapes, not objects */}
              {selectedShape.type !== 'object' && <ColorControls />}
              
              {/* Opacity Slider */}
              {selectedShape.type !== 'object' && (
                <div className="mb-6">
                  <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#000' }}>
                    Opacity: {colorOpacity}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={colorOpacity}
                    onChange={(e) => setColorOpacity(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{ 
                      background: `linear-gradient(to right, ${primaryColor}00 0%, ${primaryColor} 100%)`, 
                      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
                      '--thumb-color': primaryColor
                    }}
                  />
                </div>
              )}

              {/* Size Slider */}
              <div className="mb-6">
                <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#000' }}>
                  Size: {size}px
                </label>
                <input
                  type="range"
                  min="40"
                  max="200"
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, #004aad ${(size - 40) / 160 * 100}%, #fff ${(size - 40) / 160 * 100}%)`, boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)' }}
                />
              </div>

              {/* Rotation Slider */}
              <div className="mb-6">
                <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#000' }}>
                  Rotation: {rotation}°
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, #004aad ${rotation / 360 * 100}%, #fff ${rotation / 360 * 100}%)`, boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)' }}
                />
                <div className="flex gap-2 mt-2">
                  {[0, 45, 90, 180, 270].map(deg => (
                    <button
                      key={deg}
                      onClick={() => setRotation(deg)}
                      className="flex-1 px-2 py-1 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: rotation === deg ? '#004aad' : '#fff',
                        color: rotation === deg ? '#fff' : '#000',
                        boxShadow: rotation === deg ? 'none' : 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      {deg}°
                    </button>
                  ))}
                </div>
              </div>

              {/* Flip Controls */}
              <div className="mb-6">
                <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#000' }}>Flip</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFlipX(!flipX)}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2"
                    style={{
                      background: flipX ? '#004aad' : '#fff',
                      color: flipX ? '#fff' : '#000',
                      boxShadow: flipX ? 'none' : 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 3H5a2 2 0 00-2 2v14a2 2 0 002 2h3M16 3h3a2 2 0 012 2v14a2 2 0 01-2 2h-3M12 3v18" />
                    </svg>
                    Horizontal
                  </button>
                  <button
                    onClick={() => setFlipY(!flipY)}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2"
                    style={{
                      background: flipY ? '#004aad' : '#fff',
                      color: flipY ? '#fff' : '#000',
                      boxShadow: flipY ? 'none' : 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 8V5a2 2 0 012-2h14a2 2 0 012 2v3M3 16v3a2 2 0 002 2h14a2 2 0 002-2v-3M3 12h18" />
                    </svg>
                    Vertical
                  </button>
                </div>
              </div>

              {/* Shape-specific Controls - only for shapes, not objects */}
              {selectedShape.type !== 'object' && selectedShape.controls && selectedShape.controls.length > 0 && (
                <div className="mb-6">
                  <label className="block text-xs font-medium uppercase tracking-wide mb-3" style={{ color: '#000' }}>Shape Options</label>
                  {selectedShape.controls.map(control => {
                    const currentValue = shapeOptions[selectedShape.name]?.[control.name] ?? control.default;
                    return (
                      <div key={control.name} className="mb-4">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs" style={{ color: '#666' }}>{control.label}</span>
                          <span className="text-xs font-medium" style={{ color: '#000' }}>{currentValue}</span>
                        </div>
                        <input
                          type="range"
                          min={control.min}
                          max={control.max}
                          step={control.step}
                          value={currentValue}
                          onChange={(e) => {
                            const newValue = Number(e.target.value);
                            setShapeOptions(prev => ({
                              ...prev,
                              [selectedShape.name]: {
                                ...prev[selectedShape.name],
                                [control.name]: newValue
                              }
                            }));
                          }}
                          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                          style={{ background: '#fff', boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)' }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Reset Transform */}
              {(rotation !== 0 || flipX || flipY) && (
                <div className="mb-6">
                  <button
                    onClick={() => { setRotation(0); setFlipX(false); setFlipY(false); }}
                    className="w-full px-3 py-2 rounded-lg text-xs font-medium transition-all"
                    style={{ background: '#fff', color: '#000', boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)' }}
                  >
                    Reset Transform
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-auto">
          {selectedShape ? (
            <ShapeDetailView
              shape={selectedShape}
              onBack={() => closeShapeCard()}
              generateCSS={generateCSS}
              renderShapePreview={renderShapePreview}
              size={size}
              copied={copied}
              copiedHtml={copiedHtml}
              copyToClipboard={copyToClipboard}
              copyHtmlToClipboard={copyHtmlToClipboard}
              colorValue={colorValue}
              onSave={() => {
                setSaveDialogName(selectedShape.name);
                setShowSaveDialog(true);
              }}
              onDelete={selectedShape.id ? () => deleteSavedShape(selectedShape.id) : null}
              onRename={selectedShape.id ? (newName) => renameSavedShape(selectedShape.id, newName) : null}
              onUpdateCreation={selectedShape.isCreation ? (updates) => {
                updateSavedCreation(selectedShape.id, updates);
                setSelectedShape(prev => ({ ...prev, ...updates }));
              } : null}
              onSaveAsNew={selectedShape.isCreation ? (creationData) => {
                const newCreation = saveAsNewCreation(creationData);
                setSelectedShape(newCreation);
              } : null}
              isSaved={!!selectedShape.id}
              showNotification={showNotification}
            />
          ) : activeTab === 'create' ? (
            <ShapeCreator
              copied={copied}
              copyToClipboard={copyToClipboard}
              onSaveCreation={(creationData) => {
                const savedCreation = {
                  id: Date.now(),
                  name: creationData.name || 'Custom Creation',
                  originalName: 'Custom Creation',
                  category: 'saved',
                  isCreation: true,
                  creationShapes: creationData.shapes,
                  savedColor: '#004aad',
                  savedColorMode: 'solid',
                  savedPrimaryColor: '#004aad',
                  savedSecondaryColor: '#ffde59',
                  savedGradientAngle: 135,
                  savedSize: 100,
                  savedRotation: 0,
                  savedFlipX: false,
                  savedFlipY: false,
                  savedOptions: {}
                };
                setSavedShapes(prev => [...prev, savedCreation]);
              }}
              onPublishToLibrary={(shapes, name, type) => {
                // Create a temporary creation object to pass to addToLibrary
                const tempCreation = {
                  isCreation: true,
                  creationShapes: shapes
                };
                addToLibrary(tempCreation, name, type);
              }}
              showNotification={showNotification}
              addShapeToCanvasRef={addShapeToCanvasRef}
            />
          ) : activeTab === 'saved' ? (
            <ShapeGrid
              shapes={filteredSavedShapes}
              onSelect={loadSavedShape}
              renderShapePreview={renderShapePreview}
              isSavedCategory={true}
              onDeleteSaved={deleteSavedShape}
              shapeType="all"
              setDeleteConfirmDialog={setDeleteConfirmDialog}
            />
          ) : (
            <ShapeGrid
              shapes={filteredShapes}
              onSelect={setSelectedShape}
              renderShapePreview={renderShapePreview}
              isSavedCategory={false}
              onDeleteSaved={null}
              onDeleteCustomLibrary={deleteCustomLibraryShape}
              shapeType={shapeType}
              setDeleteConfirmDialog={setDeleteConfirmDialog}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Shape Detail View Component
function ShapeDetailView({ shape, onBack, generateCSS, renderShapePreview, size, copied, copiedHtml, copyToClipboard, copyHtmlToClipboard, colorValue, onSave, onDelete, onRename, onUpdateCreation, onSaveAsNew, isSaved, showNotification }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(shape.name);
  const [isEditingCreation, setIsEditingCreation] = useState(false);
  const [editedShapes, setEditedShapes] = useState(shape.creationShapes || []);
  
  // Reset edit name when shape changes
  React.useEffect(() => {
    setEditName(shape.name);
    setEditedShapes(shape.creationShapes || []);
  }, [shape]);
  
  // Generate CSS for custom creations
  const getCreationCSS = () => {
    if (!shape.isCreation || !shape.creationShapes) return '';
    
    const getClipPath = (type) => {
      switch (type) {
        case 'triangle': return 'polygon(50% 0%, 100% 100%, 0% 100%)';
        case 'rightTriangle': return 'polygon(0% 0%, 0% 100%, 100% 100%)';
        case 'diamond': return 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
        case 'pentagon': return 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)';
        case 'hexagon': return 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
        case 'star': return 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
        case 'arrow': return 'polygon(50% 0%, 100% 50%, 70% 50%, 70% 100%, 30% 100%, 30% 50%, 0% 50%)';
        default: return null;
      }
    };
    
    const getBorderRadius = (s) => {
      const type = s.type;
      const borderRadius = s.borderRadius;
      switch (type) {
        case 'circle': case 'ellipse': return '50%';
        case 'rectangle': case 'square': 
          return borderRadius !== undefined ? `${borderRadius}px` : '4px';
        default: return null;
      }
    };
    
    // Calculate container size
    const shapes = shape.creationShapes;
    const maxX = Math.max(...shapes.map(s => s.x + s.width));
    const maxY = Math.max(...shapes.map(s => s.y + s.height));
    
    let css = `.${shape.name.toLowerCase().replace(/\s+/g, '-')}-container {\n`;
    css += `  position: relative;\n`;
    css += `  width: ${Math.round(maxX + 20)}px;\n`;
    css += `  height: ${Math.round(maxY + 20)}px;\n`;
    css += `}\n\n`;
    
    shapes.forEach((s, index) => {
      const className = s.type === 'text' ? `text-${index + 1}` : `shape-${index + 1}`;
      css += `.${className} {\n`;
      css += `  position: absolute;\n`;
      css += `  left: ${Math.round(s.x)}px;\n`;
      css += `  top: ${Math.round(s.y)}px;\n`;
      css += `  width: ${Math.round(s.width)}px;\n`;
      css += `  height: ${Math.round(s.height)}px;\n`;
      
      if (s.type === 'text') {
        css += `  color: ${s.color};\n`;
        css += `  font-size: ${s.fontSize || 16}px;\n`;
        css += `  font-family: ${s.fontFamily || 'Arial, sans-serif'};\n`;
        if (s.fontWeight && s.fontWeight !== 'normal') {
          css += `  font-weight: ${s.fontWeight};\n`;
        }
        if (s.fontStyle && s.fontStyle !== 'normal') {
          css += `  font-style: ${s.fontStyle};\n`;
        }
        const textAlign = s.textAlign || 'left';
        css += `  text-align: ${textAlign};\n`;
        css += `  display: flex;\n`;
        css += `  align-items: center;\n`;
        // Add justify-content based on text alignment
        const justifyContent = textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start';
        css += `  justify-content: ${justifyContent};\n`;
        css += `  overflow: hidden;\n`;
        css += `  white-space: pre-wrap;\n`;
        css += `  word-break: break-word;\n`;
      } else {
        css += `  background: ${s.color};\n`;
      }
      
      const clipPath = getClipPath(s.type);
      if (clipPath) {
        css += `  clip-path: ${clipPath};\n`;
      }
      
      const borderRadius = getBorderRadius(s);
      if (borderRadius) {
        css += `  border-radius: ${borderRadius};\n`;
      }
      
      // Build transform with rotation and flip
      const transforms = [];
      if (s.rotation !== 0) transforms.push(`rotate(${s.rotation}deg)`);
      if (s.flipX) transforms.push('scaleX(-1)');
      if (s.flipY) transforms.push('scaleY(-1)');
      if (transforms.length > 0) {
        css += `  transform: ${transforms.join(' ')};\n`;
      }
      
      // Add opacity
      if (s.opacity !== undefined && s.opacity !== 100) {
        css += `  opacity: ${s.opacity / 100};\n`;
      }
      
      css += `}\n`;
      if (index < shapes.length - 1) css += '\n';
    });
    
    return css;
  };
  
  const getCreationHTML = () => {
    if (!shape.isCreation || !shape.creationShapes) return '';
    
    const containerClass = shape.name.toLowerCase().replace(/\s+/g, '-') + '-container';
    let html = `<div class="${containerClass}">\n`;
    shape.creationShapes.forEach((s, index) => {
      if (s.type === 'text') {
        const textContent = (s.text || 'Text').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        html += `  <div class="text-${index + 1}">${textContent}</div>\n`;
      } else {
        html += `  <div class="shape-${index + 1}"></div>\n`;
      }
    });
    html += `</div>`;
    return html;
  };
  
  const cssCode = shape.isCreation ? getCreationCSS() : generateCSS(shape);
  const htmlCode = shape.isCreation 
    ? getCreationHTML() 
    : `<div class="${shape.name.toLowerCase().replace(/\s+/g, '-')}"></div>`;
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm transition-colors"
          style={{ color: '#004aad' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to shapes
        </button>
        
        <div className="flex gap-2">
          {/* Hidden Edit Creation button - triggered by sidebar */}
          {isSaved && shape.isCreation && onUpdateCreation && (
            <button
              data-edit-creation-btn
              onClick={() => setIsEditingCreation(true)}
              style={{ display: 'none' }}
            />
          )}
          {!isSaved && (
            <button
              onClick={onSave}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ background: '#004aad', color: '#fff' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                <polyline points="17,21 17,13 7,13 7,21" />
                <polyline points="7,3 7,8 15,8" />
              </svg>
              Save Shape
            </button>
          )}
        </div>
      </div>

      {/* Shape Preview - Bigger and Centered */}
      <div className="mb-8">
        <div 
          className="flex items-center justify-center rounded-2xl mx-auto"
          style={{ 
            width: '400px', 
            height: '400px',
            background: '#fff',
            boxShadow: '0 25px 50px -12px rgba(0, 74, 173, 0.1)'
          }}
        >
          {/* For creations, use larger preview size to fill the container */}
          {renderShapePreview(shape, shape.isCreation ? 350 : size, true)}
        </div>
        {/* Editable name for saved shapes */}
        {isSaved && onRename ? (
          <div className="flex items-center justify-center gap-2 mt-4">
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-xl font-semibold text-center px-3 py-1 rounded-lg outline-none"
                  style={{ color: '#000', border: '2px solid #004aad', background: '#fff' }}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onRename(editName);
                      setIsEditing(false);
                    } else if (e.key === 'Escape') {
                      setEditName(shape.name);
                      setIsEditing(false);
                    }
                  }}
                />
                <button
                  onClick={() => {
                    onRename(editName);
                    setIsEditing(false);
                  }}
                  className="p-1.5 rounded-lg transition-all"
                  style={{ background: '#004aad', color: '#fff' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    setEditName(shape.name);
                    setIsEditing(false);
                  }}
                  className="p-1.5 rounded-lg transition-all"
                  style={{ background: '#fee2e2', color: '#dc2626' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 text-xl font-semibold group"
                style={{ color: '#000' }}
              >
                {shape.name}
                <svg 
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#004aad" strokeWidth="2"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            )}
          </div>
        ) : (
          <h2 className="text-xl font-semibold mt-4 text-center" style={{ color: '#000' }}>{shape.name}</h2>
        )}
      </div>

      {/* Edit Creation View */}
      {isEditingCreation && shape.isCreation && (
        <div className="fixed inset-0 bg-white z-50">
          <CreationEditor
            shapes={editedShapes}
            onBack={() => {
              setEditedShapes(shape.creationShapes || []);
              setIsEditingCreation(false);
            }}
            onOverwrite={(newShapes) => {
              onUpdateCreation({ name: shape.name, creationShapes: newShapes });
              setIsEditingCreation(false);
            }}
            onSaveAsNew={(newShapes) => {
              const newName = `${shape.name} (Copy)`;
              onSaveAsNew({ name: newName, shapes: newShapes });
              setIsEditingCreation(false);
            }}
            showNotification={showNotification}
          />
        </div>
      )}

      {/* Code Section - Below the preview */}
      <div>
        <div className="relative">
          <pre 
            className="p-5 rounded-xl text-sm overflow-auto cursor-pointer"
            style={{ background: '#f3f4f6', color: '#000', maxHeight: '400px' }}
            onClick={() => copyToClipboard(cssCode)}
          >
            <code>{cssCode}</code>
          </pre>
          <button
            onClick={() => copyToClipboard(cssCode)}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: copied ? '#10b981' : '#004aad', color: '#fff' }}
          >
            {copied ? 'Copied!' : 'Copy CSS'}
          </button>
        </div>

        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#000' }}>HTML Usage</p>
          <div className="relative">
            <pre 
              className="p-5 rounded-xl text-sm overflow-auto cursor-pointer"
              style={{ background: '#f3f4f6', color: '#000', maxHeight: '400px' }}
              onClick={() => copyHtmlToClipboard(htmlCode)}
            >
              <code>{htmlCode}</code>
            </pre>
            <button
              onClick={() => copyHtmlToClipboard(htmlCode)}
              className="absolute top-3 right-3 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ background: copiedHtml ? '#10b981' : '#004aad', color: '#fff' }}
            >
              {copiedHtml ? 'Copied!' : 'Copy HTML'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Shape Grid Component
function ShapeGrid({ shapes, onSelect, renderShapePreview, isSavedCategory, onDeleteSaved, onDeleteCustomLibrary, shapeType, setDeleteConfirmDialog }) {
  // Determine the label based on shapeType filter
  const getItemLabel = () => {
    if (isSavedCategory) return 'saved item';
    if (shapeType === 'object') return 'object';
    if (shapeType === 'shape') return 'shape';
    return 'item'; // for 'all'
  };
  const itemLabel = getItemLabel();
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium" style={{ color: '#000' }}>
          {shapes.length} {itemLabel}{shapes.length !== 1 ? 's' : ''}
        </h2>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
        {shapes.map((shape, index) => {
          // Color palette for random shape colors
          const colorPalette = ['#FF6B6B', '#FF9F43', '#ffde59', '#6BCB77', '#4D96FF', '#6A4C93', '#FF8FAB', '#2EC4B6'];
          // For objects, use null (fixed colors); for saved shapes, use saved color; for regular shapes, use random from palette
          const previewColor = shape.type === 'object' ? null : (isSavedCategory ? shape.savedColor : colorPalette[index % colorPalette.length]);
          const isCustomLibrary = shape.isCustomLibrary;
          return (
            <div
              key={shape.id || shape.name}
              className="relative p-4 rounded-xl transition-all hover:scale-105 text-center group cursor-pointer"
              style={{
                background: '#fff',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
              }}
              onClick={() => onSelect(shape)}
            >
              {/* Delete button for saved items */}
              {isSavedCategory && onDeleteSaved && setDeleteConfirmDialog && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirmDialog({
                      title: 'Delete Saved Item',
                      message: `Are you sure you want to delete "${shape.name}"? This action cannot be undone.`,
                      onConfirm: () => {
                        onDeleteSaved(shape.id);
                      }
                    });
                  }}
                  className="absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: '#fee2e2', color: '#dc2626' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
              {/* Delete button for custom library shapes */}
              {isCustomLibrary && onDeleteCustomLibrary && setDeleteConfirmDialog && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirmDialog({
                      title: 'Remove from Library',
                      message: `Are you sure you want to remove "${shape.name}" from the library? This action cannot be undone.`,
                      onConfirm: () => {
                        onDeleteCustomLibrary(shape.id);
                      }
                    });
                  }}
                  className="absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: '#fee2e2', color: '#dc2626' }}
                  title="Remove from library"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
              {/* Custom library badge */}
              {isCustomLibrary && (
                <div 
                  className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-xs font-medium"
                  style={{ background: '#ffde59', color: '#000' }}
                >
                  Custom
                </div>
              )}
              <div className="flex items-center justify-center h-16 mb-3">
                {renderShapePreview(shape, 50, false, previewColor)}
              </div>
              <p className="text-xs font-medium truncate" style={{ color: '#000' }}>{shape.name}</p>
            </div>
          );
        })}
      </div>

      {shapes.length === 0 && (
        <div className="text-center py-16">
          <p style={{ color: '#666' }}>{isSavedCategory ? 'No saved shapes yet' : 'No shapes found'}</p>
        </div>
      )}
    </div>
  );
}

// Creation Editor Component - Edit existing canvas creations (matches ShapeCreator design)
function CreationEditor({ shapes, onBack, onOverwrite, onSaveAsNew, showNotification }) {
  const [canvasShapes, setCanvasShapes] = useState(shapes.map((s, i) => ({ ...s, id: s.id || Date.now() + i })));
  const [selectedId, setSelectedId] = useState(null);
  const [dragState, setDragState] = useState(null);
  const [copiedCSS, setCopiedCSS] = useState(false);
  const [copiedHTML, setCopiedHTML] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [gridSize, setGridSize] = useState(20);
  const [clipboardShape, setClipboardShape] = useState(null);
  const canvasRef = React.useRef(null);

  // Undo/Redo history - initialize with the current shapes
  const initialShapes = React.useMemo(() => shapes.map((s, i) => ({ ...s, id: s.id || Date.now() + i })), []);
  const [history, setHistory] = useState([initialShapes]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const historyRef = React.useRef({ history: [initialShapes], index: 0 });

  // Keep ref in sync
  React.useEffect(() => {
    historyRef.current = { history, index: historyIndex };
  }, [history, historyIndex]);

  // Save to history
  const saveToHistory = React.useCallback((newShapes) => {
    const { history: currentHistory, index: currentIndex } = historyRef.current;
    const newHistory = currentHistory.slice(0, currentIndex + 1);
    newHistory.push(newShapes.map(s => ({ ...s })));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    historyRef.current = { history: newHistory, index: newHistory.length - 1 };
  }, []);

  // Undo
  const undo = React.useCallback(() => {
    const { history: currentHistory, index: currentIndex } = historyRef.current;
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setHistoryIndex(newIndex);
      setCanvasShapes(currentHistory[newIndex].map(s => ({ ...s })));
      setSelectedId(null);
      historyRef.current.index = newIndex;
    }
  }, []);

  // Redo
  const redo = React.useCallback(() => {
    const { history: currentHistory, index: currentIndex } = historyRef.current;
    if (currentIndex < currentHistory.length - 1) {
      const newIndex = currentIndex + 1;
      setHistoryIndex(newIndex);
      setCanvasShapes(currentHistory[newIndex].map(s => ({ ...s })));
      setSelectedId(null);
      historyRef.current.index = newIndex;
    }
  }, []);

  // Wrap setCanvasShapes to also save to history
  const updateCanvasShapes = React.useCallback((updater, saveHistoryFlag = true) => {
    setCanvasShapes(prev => {
      const newShapes = typeof updater === 'function' ? updater(prev) : updater;
      if (saveHistoryFlag) {
        setTimeout(() => saveToHistory(newShapes), 0);
      }
      return newShapes;
    });
  }, [saveToHistory]);

  // Snap value to grid
  const snapValue = (value) => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  };

  // Copy handlers
  const copyCSS = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedCSS(true);
      setTimeout(() => setCopiedCSS(false), 2000);
    });
  };

  const copyHTML = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedHTML(true);
      setTimeout(() => setCopiedHTML(false), 2000);
    });
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      const selectedShape = canvasShapes.find(s => s.id === selectedId);
      
      // Undo: Ctrl/Cmd + Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      
      // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      if ((e.ctrlKey || e.metaKey) && (e.key === 'Z' || e.key === 'y')) {
        e.preventDefault();
        redo();
        return;
      }
      
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedShape) {
        e.preventDefault();
        updateCanvasShapes(prev => prev.filter(s => s.id !== selectedId));
        setSelectedId(null);
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedShape) {
        e.preventDefault();
        setClipboardShape({ ...selectedShape });
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'x' && selectedShape) {
        e.preventDefault();
        setClipboardShape({ ...selectedShape });
        updateCanvasShapes(prev => prev.filter(s => s.id !== selectedId));
        setSelectedId(null);
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboardShape) {
        e.preventDefault();
        const newShape = {
          ...clipboardShape,
          id: Date.now(),
          x: clipboardShape.x + 20,
          y: clipboardShape.y + 20
        };
        updateCanvasShapes(prev => [...prev, newShape]);
        setSelectedId(newShape.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, canvasShapes, clipboardShape, historyIndex, history]);

  // Get clip-path for shape type
  const getClipPath = (shape) => {
    const type = typeof shape === 'string' ? shape : shape.type;
    const curve = typeof shape === 'object' ? (shape.curve || 0) : 0;
    
    // If curve is applied, use rounded polygon via SVG path
    if (curve > 0 && ['triangle', 'rightTriangle', 'diamond', 'star'].includes(type)) {
      const points = {
        triangle: [[50, 0], [100, 100], [0, 100]],
        rightTriangle: [[0, 0], [0, 100], [100, 100]],
        diamond: [[50, 0], [100, 50], [50, 100], [0, 50]],
        star: [[50, 0], [61, 35], [98, 35], [68, 57], [79, 91], [50, 70], [21, 91], [32, 57], [2, 35], [39, 35]]
      }[type];
      
      if (points) {
        const radius = curve * 0.3;
        let path = '';
        const n = points.length;
        
        for (let i = 0; i < n; i++) {
          const prev = points[(i - 1 + n) % n];
          const curr = points[i];
          const next = points[(i + 1) % n];
          
          const v1 = [prev[0] - curr[0], prev[1] - curr[1]];
          const v2 = [next[0] - curr[0], next[1] - curr[1]];
          
          const len1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
          const len2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]);
          
          const maxR = Math.min(len1, len2) * 0.4;
          const r = Math.min(radius, maxR);
          
          const start = [curr[0] + (v1[0] / len1) * r, curr[1] + (v1[1] / len1) * r];
          const end = [curr[0] + (v2[0] / len2) * r, curr[1] + (v2[1] / len2) * r];
          
          if (i === 0) {
            path += `M ${start[0]} ${start[1]} `;
          } else {
            path += `L ${start[0]} ${start[1]} `;
          }
          path += `Q ${curr[0]} ${curr[1]} ${end[0]} ${end[1]} `;
        }
        path += 'Z';
        return `path('${path}')`;
      }
    }
    
    switch (type) {
      case 'triangle': return 'polygon(50% 0%, 100% 100%, 0% 100%)';
      case 'rightTriangle': return 'polygon(0% 0%, 0% 100%, 100% 100%)';
      case 'diamond': return 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
      case 'pentagon': return 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)';
      case 'hexagon': return 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
      case 'star': return 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
      case 'arrow': return 'polygon(50% 0%, 100% 50%, 70% 50%, 70% 100%, 30% 100%, 30% 50%, 0% 50%)';
      default: return 'none';
    }
  };

  // Get border-radius for shape type
  const getBorderRadius = (shape) => {
    const type = typeof shape === 'string' ? shape : shape.type;
    const borderRadius = typeof shape === 'object' ? shape.borderRadius : undefined;
    
    switch (type) {
      case 'circle': case 'ellipse': return '50%';
      case 'rectangle': case 'square': 
        return borderRadius !== undefined ? `${borderRadius}px` : '4px';
      default: return '0';
    }
  };

  // Add shape to canvas
  const addShapeToCanvas = (shapeType) => {
    const newShape = {
      id: Date.now(),
      type: shapeType,
      x: 200 + Math.random() * 100,
      y: 150 + Math.random() * 100,
      width: shapeType === 'ellipse' ? 120 : shapeType === 'text' ? 150 : 80,
      height: shapeType === 'ellipse' ? 60 : shapeType === 'rectangle' ? 50 : shapeType === 'text' ? 40 : 80,
      color: '#004aad',
      opacity: 100,
      rotation: 0,
      flipX: false,
      flipY: false,
      ...(shapeType === 'text' && {
        text: 'Text',
        fontSize: 24,
        fontFamily: 'Arial',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'center'
      })
    };
    updateCanvasShapes(prev => [...prev, newShape]);
    setSelectedId(newShape.id);
  };

  // Handle mouse down on canvas shape
  const handleShapeMouseDown = (e, shape, resizing = false) => {
    e.stopPropagation();
    const rect = canvasRef.current.getBoundingClientRect();
    setSelectedId(shape.id);
    setDragState({
      id: shape.id,
      offsetX: e.clientX - rect.left - shape.x,
      offsetY: e.clientY - rect.top - shape.y,
      type: resizing ? 'resize' : 'move',
      startWidth: shape.width,
      startHeight: shape.height,
      startX: e.clientX,
      startY: e.clientY
    });
  };

  // Handle mouse move
  const handleCanvasMouseMove = React.useCallback((e) => {
    if (!dragState) return;
    
    if (dragState.type === 'move') {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      let newX = Math.max(0, Math.min(rect.width - 20, e.clientX - rect.left - dragState.offsetX));
      let newY = Math.max(0, Math.min(rect.height - 20, e.clientY - rect.top - dragState.offsetY));
      
      newX = snapValue(newX);
      newY = snapValue(newY);
      
      setCanvasShapes(prev => prev.map(s => 
        s.id === dragState.id ? { ...s, x: newX, y: newY } : s
      ));
    } else if (dragState.type === 'resize') {
      const deltaX = e.clientX - dragState.startX;
      const deltaY = e.clientY - dragState.startY;
      let newWidth = Math.max(20, dragState.startWidth + deltaX);
      let newHeight = Math.max(20, dragState.startHeight + deltaY);
      
      newWidth = snapValue(newWidth);
      newHeight = snapValue(newHeight);
      
      setCanvasShapes(prev => prev.map(s => 
        s.id === dragState.id ? { ...s, width: newWidth, height: newHeight } : s
      ));
    }
  }, [dragState, snapToGrid, gridSize]);

  const handleCanvasMouseUp = React.useCallback(() => {
    if (dragState) {
      // Save to history after drag/resize ends
      setCanvasShapes(current => {
        saveToHistory(current);
        return current;
      });
    }
    setDragState(null);
  }, [dragState]);

  // Global mouse event listeners
  React.useEffect(() => {
    if (dragState) {
      const handleGlobalMouseMove = (e) => handleCanvasMouseMove(e);
      const handleGlobalMouseUp = () => handleCanvasMouseUp();
      
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [dragState, handleCanvasMouseMove, handleCanvasMouseUp]);

  const deleteSelectedShape = () => {
    if (selectedId) {
      updateCanvasShapes(prev => prev.filter(s => s.id !== selectedId));
      setSelectedId(null);
    }
  };

  const updateSelectedShape = (property, value) => {
    updateCanvasShapes(prev => prev.map(s => 
      s.id === selectedId ? { ...s, [property]: value } : s
    ));
  };

  const selectedShape = canvasShapes.find(s => s.id === selectedId);

  const clearCanvas = () => {
    updateCanvasShapes([]);
    setSelectedId(null);
  };

  // Generate CSS
  const generateCanvasCSS = () => {
    if (canvasShapes.length === 0) return '/* Add shapes to the canvas to generate CSS */';
    
    return canvasShapes.map((shape, index) => {
      const className = `shape-${index + 1}`;
      let css = `.${className} {\n`;
      css += `  position: absolute;\n`;
      css += `  left: ${Math.round(shape.x)}px;\n`;
      css += `  top: ${Math.round(shape.y)}px;\n`;
      css += `  width: ${Math.round(shape.width)}px;\n`;
      css += `  height: ${Math.round(shape.height)}px;\n`;
      
      if (shape.type === 'text') {
        css += `  color: ${shape.color};\n`;
        css += `  font-size: ${shape.fontSize || 24}px;\n`;
        css += `  font-family: ${shape.fontFamily || 'Arial'};\n`;
        css += `  font-weight: ${shape.fontWeight || 'normal'};\n`;
        css += `  font-style: ${shape.fontStyle || 'normal'};\n`;
        css += `  display: flex;\n`;
        css += `  align-items: center;\n`;
        css += `  justify-content: center;\n`;
      } else {
        css += `  background: ${shape.color};\n`;
        const clipPath = getClipPath(shape);
        if (clipPath !== 'none') {
          css += `  clip-path: ${clipPath};\n`;
        } else {
          css += `  border-radius: ${getBorderRadius(shape)};\n`;
        }
      }
      
      const transforms = [];
      if (shape.rotation !== 0) transforms.push(`rotate(${shape.rotation}deg)`);
      if (shape.flipX) transforms.push('scaleX(-1)');
      if (shape.flipY) transforms.push('scaleY(-1)');
      if (transforms.length > 0) {
        css += `  transform: ${transforms.join(' ')};\n`;
      }
      
      // Add opacity
      if (shape.opacity !== undefined && shape.opacity !== 100) {
        css += `  opacity: ${shape.opacity / 100};\n`;
      }
      
      css += `}`;
      return css;
    }).join('\n\n');
  };

  // Generate HTML
  const generateCanvasHTML = () => {
    if (canvasShapes.length === 0) return '<!-- Add shapes to the canvas -->';
    
    return `<div class="canvas-container" style="position: relative; width: 600px; height: 400px;">\n` +
      canvasShapes.map((shape, index) => {
        if (shape.type === 'text') {
          return `  <div class="shape-${index + 1}">${shape.text || 'Text'}</div>`;
        }
        return `  <div class="shape-${index + 1}"></div>`;
      }).join('\n') +
      `\n</div>`;
  };

  // Available shapes list
  const availableShapes = [
    { type: 'rectangle', name: 'Rectangle' },
    { type: 'square', name: 'Square' },
    { type: 'circle', name: 'Circle' },
    { type: 'ellipse', name: 'Ellipse' },
    { type: 'triangle', name: 'Triangle' },
    { type: 'rightTriangle', name: 'Right Triangle' },
    { type: 'diamond', name: 'Diamond' },
    { type: 'pentagon', name: 'Pentagon' },
    { type: 'hexagon', name: 'Hexagon' },
    { type: 'star', name: 'Star' },
    { type: 'arrow', name: 'Arrow' },
    { type: 'text', name: 'Text' },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-medium transition-colors"
            style={{ color: '#004aad' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h2 className="text-xl font-semibold" style={{ color: '#000' }}>Edit Creation</h2>
        </div>
        <div className="flex gap-2 items-center">
          {/* Undo/Redo Buttons */}
          <div className="flex items-center gap-1 mr-2">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              title="Undo (Ctrl+Z)"
              className="p-2 rounded-lg text-sm font-medium transition-all flex items-center"
              style={{ 
                background: historyIndex <= 0 ? '#e5e7eb' : '#f3f4f6',
                color: historyIndex <= 0 ? '#9ca3af' : '#004aad',
                cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 10h11c4 0 7 3 7 7s-3 7-7 7H7" />
                <path d="M7 6L3 10l4 4" />
              </svg>
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              title="Redo (Ctrl+Shift+Z)"
              className="p-2 rounded-lg text-sm font-medium transition-all flex items-center"
              style={{ 
                background: historyIndex >= history.length - 1 ? '#e5e7eb' : '#f3f4f6',
                color: historyIndex >= history.length - 1 ? '#9ca3af' : '#004aad',
                cursor: historyIndex >= history.length - 1 ? 'not-allowed' : 'pointer'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10H10c-4 0-7 3-7 7s3 7 7 7h4" />
                <path d="M17 6l4 4-4 4" />
              </svg>
            </button>
          </div>
          {/* Grid Snap Toggle */}
          <div className="flex items-center gap-2 mr-2">
            <button
              onClick={() => setSnapToGrid(!snapToGrid)}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
              style={{ 
                background: snapToGrid ? '#004aad' : '#f3f4f6',
                color: snapToGrid ? '#fff' : '#666'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              Snap
            </button>
            {snapToGrid && (
              <select
                value={gridSize}
                onChange={(e) => setGridSize(Number(e.target.value))}
                className="px-2 py-2 rounded-lg text-sm"
                style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#000' }}
              >
                <option value={10}>10px</option>
                <option value={20}>20px</option>
                <option value={40}>40px</option>
                <option value={50}>50px</option>
              </select>
            )}
          </div>
          <button
            onClick={() => {
              if (canvasShapes.length === 0) {
                showNotification('Add at least one shape', 'error');
                return;
              }
              onOverwrite(canvasShapes);
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
            style={{ background: '#004aad', color: '#fff' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
              <polyline points="17,21 17,13 7,13 7,21" />
              <polyline points="7,3 7,8 15,8" />
            </svg>
            Overwrite
          </button>
          <button
            onClick={() => {
              if (canvasShapes.length === 0) {
                showNotification('Add at least one shape', 'error');
                return;
              }
              onSaveAsNew(canvasShapes);
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
            style={{ background: '#ffde59', color: '#000' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Save as New
          </button>
          <button
            onClick={clearCanvas}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
            style={{ background: '#fee2e2', color: '#dc2626' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
            Clear
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left Sidebar - Add Shapes */}
        <div className="w-48 flex-shrink-0">
          <label className="block text-xs font-medium uppercase tracking-wide mb-3" style={{ color: '#000' }}>Add Shapes</label>
          <div className="grid grid-cols-2 gap-2">
            {(() => {
              const sidebarColors = ['#FF6B6B', '#FF9F43', '#ffde59', '#6BCB77', '#4D96FF', '#6A4C93', '#FF8FAB'];
              const shapesList = [
                { type: 'rectangle', name: 'Rectangle', getIcon: (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill={c}><rect x="2" y="4" width="20" height="16" rx="2" /></svg> },
                { type: 'square', name: 'Square', getIcon: (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill={c}><rect x="3" y="3" width="18" height="18" rx="2" /></svg> },
                { type: 'circle', name: 'Circle', getIcon: (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill={c}><circle cx="12" cy="12" r="10" /></svg> },
                { type: 'ellipse', name: 'Ellipse', getIcon: (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill={c}><ellipse cx="12" cy="12" rx="10" ry="6" /></svg> },
                { type: 'triangle', name: 'Triangle', getIcon: (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill={c}><polygon points="12,2 22,22 2,22" /></svg> },
                { type: 'rightTriangle', name: 'Right Triangle', getIcon: (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill={c}><polygon points="2,2 2,22 22,22" /></svg> },
                { type: 'diamond', name: 'Diamond', getIcon: (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill={c}><polygon points="12,2 22,12 12,22 2,12" /></svg> },
                { type: 'pentagon', name: 'Pentagon', getIcon: (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill={c}><polygon points="12,2 22,9 18,22 6,22 2,9" /></svg> },
                { type: 'hexagon', name: 'Hexagon', getIcon: (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill={c}><polygon points="6,2 18,2 23,12 18,22 6,22 1,12" /></svg> },
                { type: 'star', name: 'Star', getIcon: (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill={c}><polygon points="12,2 15,9 22,9 17,14 19,22 12,17 5,22 7,14 2,9 9,9" /></svg> },
                { type: 'arrow', name: 'Arrow', getIcon: (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill={c}><polygon points="12,2 22,12 16,12 16,22 8,22 8,12 2,12" /></svg> },
                { type: 'text', name: 'Text', getIcon: (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill={c}><text x="12" y="17" textAnchor="middle" fontSize="14" fontWeight="bold" fontFamily="Arial">T</text></svg> },
              ];
              return shapesList.map((shape, index) => (
                <button
                  key={shape.type}
                  onClick={() => addShapeToCanvas(shape.type)}
                  className="flex flex-col items-center gap-1 p-3 rounded-lg transition-all hover:scale-105"
                  style={{ background: '#fff', boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)', cursor: 'pointer' }}
                >
                  {shape.getIcon(sidebarColors[index % sidebarColors.length])}
                  <span className="text-xs" style={{ color: '#000' }}>{shape.name}</span>
                </button>
              ));
            })()}
          </div>
          <p className="text-xs mt-4 text-center" style={{ color: '#666' }}>
            Click to add shapes to the canvas
          </p>
        </div>

        {/* Canvas */}
        <div className="flex-1">
          <div 
            ref={canvasRef}
            className="relative rounded-2xl overflow-hidden cursor-crosshair"
            style={{ 
              width: '100%', 
              height: '400px', 
              background: '#fff',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)',
              border: '2px dashed #e5e7eb'
            }}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onClick={() => setSelectedId(null)}
          >
            {/* Grid */}
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: 'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)',
              backgroundSize: `${gridSize}px ${gridSize}px`
            }} />
            
            {/* Shapes */}
            {canvasShapes.map(shape => {
              const isSelected = shape.id === selectedId;
              const flipTransform = [
                shape.flipX ? 'scaleX(-1)' : '',
                shape.flipY ? 'scaleY(-1)' : ''
              ].filter(Boolean).join(' ');
              
              return (
                <div
                  key={shape.id}
                  className="absolute cursor-move"
                  style={{
                    left: shape.x,
                    top: shape.y,
                    width: shape.width,
                    height: shape.height,
                    outline: isSelected ? '2px solid #004aad' : 'none',
                    outlineOffset: '2px',
                    zIndex: isSelected ? 10 : 1,
                    transform: shape.rotation !== 0 ? `rotate(${shape.rotation}deg)` : 'none'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(shape.id);
                  }}
                  onMouseDown={(e) => handleShapeMouseDown(e, shape)}
                >
                  {shape.type === 'text' ? (
                    <div
                      className="pointer-events-none"
                      style={{
                        width: '100%',
                        height: '100%',
                        color: shape.color,
                        opacity: (shape.opacity ?? 100) / 100,
                        fontSize: `${shape.fontSize || 24}px`,
                        fontFamily: shape.fontFamily || 'Arial, sans-serif',
                        fontWeight: shape.fontWeight || 'normal',
                        fontStyle: shape.fontStyle || 'normal',
                        textAlign: shape.textAlign || 'left',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: shape.textAlign === 'center' ? 'center' : shape.textAlign === 'right' ? 'flex-end' : 'flex-start',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        overflow: 'hidden',
                        transform: flipTransform || 'none'
                      }}
                    >
                      {shape.text || 'Text'}
                    </div>
                  ) : (
                    <div
                      className="pointer-events-none"
                      style={{
                        width: '100%',
                        height: '100%',
                        background: shape.color,
                        opacity: (shape.opacity ?? 100) / 100,
                        clipPath: getClipPath(shape),
                        borderRadius: getBorderRadius(shape),
                        transform: flipTransform || 'none'
                      }}
                    />
                  )}
                  
                  {/* Resize handles */}
                  {isSelected && (
                    <>
                      <div
                        className="absolute w-4 h-4 rounded-full cursor-se-resize"
                        style={{
                          right: -8,
                          bottom: -8,
                          background: '#004aad',
                          border: '2px solid #fff',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                          zIndex: 20
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setDragState({
                            id: shape.id,
                            type: 'resize',
                            startWidth: shape.width,
                            startHeight: shape.height,
                            startX: e.clientX,
                            startY: e.clientY
                          });
                        }}
                      />
                      <div className="absolute w-2 h-2 bg-white border-2 border-blue-600 rounded-sm" style={{ top: -5, left: -5 }} />
                      <div className="absolute w-2 h-2 bg-white border-2 border-blue-600 rounded-sm" style={{ top: -5, right: -5 }} />
                      <div className="absolute w-2 h-2 bg-white border-2 border-blue-600 rounded-sm" style={{ bottom: -5, left: -5 }} />
                    </>
                  )}
                </div>
              );
            })}
            
            {/* Empty state */}
            {canvasShapes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1" className="mx-auto mb-2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M12 8v8M8 12h8" />
                  </svg>
                  <p className="text-sm" style={{ color: '#999' }}>Add shapes from the sidebar</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Properties Panel */}
        <div className="w-64">
          {selectedShape ? (
            <>
              <h3 className="text-sm font-medium mb-4" style={{ color: '#000' }}>
                {availableShapes.find(s => s.type === selectedShape.type)?.name || 'Shape'} Properties
              </h3>
              
              {/* Color */}
              <div className="mb-4">
                <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#666' }}>Color</label>
                <div className="flex items-center gap-2 mb-3">
                  <div 
                    className="relative w-8 h-8 rounded-lg overflow-hidden cursor-pointer flex-shrink-0"
                    style={{ background: selectedShape.color }}
                  >
                    <input
                      type="color"
                      value={selectedShape.color}
                      onChange={(e) => updateSelectedShape('color', e.target.value)}
                      className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                    />
                  </div>
                  <input
                    type="text"
                    value={selectedShape.color}
                    onChange={(e) => updateSelectedShape('color', e.target.value)}
                    className="flex-1 px-2 py-1 rounded text-xs font-mono"
                    style={{ background: '#f8f9fa', border: '1px solid #e5e7eb', color: '#000' }}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {['#FF6B6B', '#FF9F43', '#ffde59', '#6BCB77', '#4D96FF', '#6A4C93', '#FF8FAB', '#2EC4B6', '#F1FAEE', '#A8DADC', '#457B9D', '#1D3557'].map(c => (
                    <button
                      key={c}
                      onClick={() => updateSelectedShape('color', c)}
                      className="w-5 h-5 rounded transition-transform hover:scale-110"
                      style={{ 
                        background: c,
                        border: c === '#F1FAEE' ? '1px solid #ccc' : 'none',
                        boxShadow: selectedShape.color === c ? '0 0 0 2px white, 0 0 0 3px ' + c : 'none'
                      }}
                    />
                  ))}
                </div>
              </div>
              
              {/* Opacity Slider */}
              <div className="mb-4">
                <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#666' }}>
                  Opacity: {selectedShape.opacity ?? 100}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedShape.opacity ?? 100}
                  onChange={(e) => updateSelectedShape('opacity', Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ 
                    background: `linear-gradient(to right, ${selectedShape.color}00 0%, ${selectedShape.color} 100%)`, 
                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
                    '--thumb-color': selectedShape.color
                  }}
                />
              </div>
              
              {/* Text Properties */}
              {selectedShape.type === 'text' && (
                <>
                  <div className="mb-4">
                    <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#666' }}>Text Content</label>
                    <input
                      type="text"
                      value={selectedShape.text || 'Text'}
                      onChange={(e) => updateSelectedShape('text', e.target.value)}
                      className="w-full px-2 py-1.5 rounded text-sm"
                      style={{ background: '#f8f9fa', border: '1px solid #e5e7eb', color: '#000' }}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#666' }}>Font Size: {selectedShape.fontSize || 24}px</label>
                    <input
                      type="range"
                      min="8"
                      max="72"
                      value={selectedShape.fontSize || 24}
                      onChange={(e) => updateSelectedShape('fontSize', Number(e.target.value))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{ background: `linear-gradient(to right, #004aad ${((selectedShape.fontSize || 24) - 8) / 64 * 100}%, #e5e7eb ${((selectedShape.fontSize || 24) - 8) / 64 * 100}%)` }}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#666' }}>Font Family</label>
                    <select
                      value={selectedShape.fontFamily || 'Arial'}
                      onChange={(e) => updateSelectedShape('fontFamily', e.target.value)}
                      className="w-full px-2 py-1.5 rounded text-sm"
                      style={{ background: '#f8f9fa', border: '1px solid #e5e7eb', color: '#000' }}
                    >
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Verdana">Verdana</option>
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#666' }}>Font Style</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateSelectedShape('fontWeight', selectedShape.fontWeight === 'bold' ? 'normal' : 'bold')}
                        className="flex-1 px-3 py-1.5 rounded text-sm font-bold transition-all"
                        style={{ 
                          background: selectedShape.fontWeight === 'bold' ? '#004aad' : '#f8f9fa',
                          color: selectedShape.fontWeight === 'bold' ? '#fff' : '#000',
                          border: '1px solid #e5e7eb'
                        }}
                      >
                        B
                      </button>
                      <button
                        onClick={() => updateSelectedShape('fontStyle', selectedShape.fontStyle === 'italic' ? 'normal' : 'italic')}
                        className="flex-1 px-3 py-1.5 rounded text-sm italic transition-all"
                        style={{ 
                          background: selectedShape.fontStyle === 'italic' ? '#004aad' : '#f8f9fa',
                          color: selectedShape.fontStyle === 'italic' ? '#fff' : '#000',
                          border: '1px solid #e5e7eb'
                        }}
                      >
                        I
                      </button>
                    </div>
                  </div>
                </>
              )}
              
              {/* Size */}
              <div className="mb-4">
                <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#666' }}>Width: {Math.round(selectedShape.width)}px</label>
                <input
                  type="range"
                  min="20"
                  max="300"
                  value={selectedShape.width}
                  onChange={(e) => updateSelectedShape('width', Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, #004aad ${(selectedShape.width - 20) / 280 * 100}%, #e5e7eb ${(selectedShape.width - 20) / 280 * 100}%)` }}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#666' }}>Height: {Math.round(selectedShape.height)}px</label>
                <input
                  type="range"
                  min="20"
                  max="300"
                  value={selectedShape.height}
                  onChange={(e) => updateSelectedShape('height', Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, #004aad ${(selectedShape.height - 20) / 280 * 100}%, #e5e7eb ${(selectedShape.height - 20) / 280 * 100}%)` }}
                />
              </div>
              
              {/* Rotation */}
              <div className="mb-4">
                <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#666' }}>Rotation: {selectedShape.rotation || 0}°</label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={selectedShape.rotation || 0}
                  onChange={(e) => updateSelectedShape('rotation', Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, #004aad ${(selectedShape.rotation || 0) / 360 * 100}%, #e5e7eb ${(selectedShape.rotation || 0) / 360 * 100}%)` }}
                />
              </div>
              
              {/* Flip */}
              <div className="mb-4">
                <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#666' }}>Flip</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateSelectedShape('flipX', !selectedShape.flipX)}
                    className="flex-1 px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center justify-center gap-1"
                    style={{ 
                      background: selectedShape.flipX ? '#004aad' : '#f8f9fa',
                      color: selectedShape.flipX ? '#fff' : '#000',
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 3v18M16 6l5 6-5 6M8 6l-5 6 5 6" />
                    </svg>
                    H
                  </button>
                  <button
                    onClick={() => updateSelectedShape('flipY', !selectedShape.flipY)}
                    className="flex-1 px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center justify-center gap-1"
                    style={{ 
                      background: selectedShape.flipY ? '#004aad' : '#f8f9fa',
                      color: selectedShape.flipY ? '#fff' : '#000',
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 12h18M6 8l6-5 6 5M6 16l6 5 6-5" />
                    </svg>
                    V
                  </button>
                </div>
              </div>
              
              {/* Shape-specific Controls - Border Radius for rectangles/squares */}
              {(selectedShape.type === 'rectangle' || selectedShape.type === 'square') && (
                <div className="mb-4">
                  <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#666' }}>
                    Corner Radius: {selectedShape.borderRadius || 0}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={selectedShape.borderRadius || 0}
                    onChange={(e) => updateSelectedShape('borderRadius', Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{ background: `linear-gradient(to right, #004aad ${(selectedShape.borderRadius || 0) / 50 * 100}%, #e5e7eb ${(selectedShape.borderRadius || 0) / 50 * 100}%)` }}
                  />
                </div>
              )}
              
              {/* Shape-specific Controls - Corner Curve for triangle, rightTriangle, diamond, star */}
              {(selectedShape.type === 'triangle' || selectedShape.type === 'rightTriangle' || selectedShape.type === 'diamond' || selectedShape.type === 'star') && (
                <div className="mb-4">
                  <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#666' }}>
                    Corner Curve: {selectedShape.curve || 0}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={selectedShape.curve || 0}
                    onChange={(e) => updateSelectedShape('curve', Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{ background: `linear-gradient(to right, #004aad ${(selectedShape.curve || 0)}%, #e5e7eb ${(selectedShape.curve || 0)}%)` }}
                  />
                </div>
              )}
              
              {/* Position */}
              <div className="mb-4 grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide mb-1" style={{ color: '#666' }}>X</label>
                  <input
                    type="number"
                    value={Math.round(selectedShape.x)}
                    onChange={(e) => updateSelectedShape('x', Number(e.target.value))}
                    className="w-full px-2 py-1 rounded text-xs"
                    style={{ background: '#f8f9fa', border: '1px solid #e5e7eb', color: '#000' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide mb-1" style={{ color: '#666' }}>Y</label>
                  <input
                    type="number"
                    value={Math.round(selectedShape.y)}
                    onChange={(e) => updateSelectedShape('y', Number(e.target.value))}
                    className="w-full px-2 py-1 rounded text-xs"
                    style={{ background: '#f8f9fa', border: '1px solid #e5e7eb', color: '#000' }}
                  />
                </div>
              </div>
              
              {/* Delete */}
              <button
                onClick={deleteSelectedShape}
                className="w-full px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2"
                style={{ background: '#fee2e2', color: '#dc2626' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
                Delete Shape
              </button>
            </>
          ) : (
            <div className="text-center py-8">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1" className="mx-auto mb-2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              <p className="text-xs" style={{ color: '#999' }}>Select a shape to edit its properties</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Generated Code */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#000' }}>CSS</label>
          <div className="relative">
            <pre 
              className="p-4 rounded-xl text-xs overflow-auto cursor-pointer"
              style={{ background: '#f3f4f6', color: '#000', maxHeight: '200px' }}
              onClick={() => copyCSS(generateCanvasCSS())}
            >
              <code>{generateCanvasCSS()}</code>
            </pre>
            <button
              onClick={() => copyCSS(generateCanvasCSS())}
              className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium transition-all"
              style={{ background: copiedCSS ? '#10b981' : '#004aad', color: '#fff' }}
            >
              {copiedCSS ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#000' }}>HTML</label>
          <div className="relative">
            <pre 
              className="p-4 rounded-xl text-xs overflow-auto cursor-pointer"
              style={{ background: '#f3f4f6', color: '#000', maxHeight: '200px' }}
              onClick={() => copyHTML(generateCanvasHTML())}
            >
              <code>{generateCanvasHTML()}</code>
            </pre>
            <button
              onClick={() => copyHTML(generateCanvasHTML())}
              className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium transition-all"
              style={{ background: copiedHTML ? '#10b981' : '#004aad', color: '#fff' }}
            >
              {copiedHTML ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Shape Creator Component - Drag & Drop Canvas
function ShapeCreator({ copied, copyToClipboard, onSaveCreation, onPublishToLibrary, showNotification, addShapeToCanvasRef }) {
  const [canvasShapes, setCanvasShapes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [dragState, setDragState] = useState(null); // { id, offsetX, offsetY, type: 'move' | 'resize' }
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveDialogName, setSaveDialogName] = useState('');
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [publishDialogName, setPublishDialogName] = useState('');
  const [publishDialogType, setPublishDialogType] = useState('shape');
  const [copiedCSS, setCopiedCSS] = useState(false);
  const [copiedHTML, setCopiedHTML] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [gridSize, setGridSize] = useState(20);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const canvasRef = React.useRef(null);

  // Undo/Redo state - initialize with empty canvas state
  const [history, setHistory] = useState([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const historyRef = React.useRef({ history: [[]], index: 0 });

  // Keep ref in sync
  React.useEffect(() => {
    historyRef.current = { history, index: historyIndex };
  }, [history, historyIndex]);

  // Save current state to history
  const saveToHistory = React.useCallback((newShapes) => {
    const { history: currentHistory, index: currentIndex } = historyRef.current;
    const newHistory = currentHistory.slice(0, currentIndex + 1);
    newHistory.push(newShapes.map(s => ({ ...s })));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    historyRef.current = { history: newHistory, index: newHistory.length - 1 };
  }, []);

  // Undo
  const undo = React.useCallback(() => {
    const { history: currentHistory, index: currentIndex } = historyRef.current;
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setHistoryIndex(newIndex);
      setCanvasShapes(currentHistory[newIndex].map(s => ({ ...s })));
      setSelectedId(null);
      historyRef.current.index = newIndex;
    }
  }, []);

  // Redo
  const redo = React.useCallback(() => {
    const { history: currentHistory, index: currentIndex } = historyRef.current;
    if (currentIndex < currentHistory.length - 1) {
      const newIndex = currentIndex + 1;
      setHistoryIndex(newIndex);
      setCanvasShapes(currentHistory[newIndex].map(s => ({ ...s })));
      setSelectedId(null);
      historyRef.current.index = newIndex;
    }
  }, []);

  // Wrap setCanvasShapes to also save to history
  const updateCanvasShapes = React.useCallback((updater, saveHistoryFlag = true) => {
    setCanvasShapes(prev => {
      const newShapes = typeof updater === 'function' ? updater(prev) : updater;
      if (saveHistoryFlag) {
        setTimeout(() => saveToHistory(newShapes), 0);
      }
      return newShapes;
    });
  }, [saveToHistory]);

  // Snap value to grid
  const snapValue = (value) => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  };

  // Copy handlers for CSS and HTML
  const copyCSS = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedCSS(true);
      setTimeout(() => setCopiedCSS(false), 2000);
    });
  };

  const copyHTML = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedHTML(true);
      setTimeout(() => setCopiedHTML(false), 2000);
    });
  };

  // Clipboard state for copy/paste shapes
  const [clipboardShape, setClipboardShape] = useState(null);

  // Keyboard shortcuts for copy, paste, cut, delete, undo, redo
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle if we have shapes and canvas is focused (not in input)
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      const selectedShape = canvasShapes.find(s => s.id === selectedId);
      
      // Undo: Ctrl/Cmd + Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      
      // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      if ((e.ctrlKey || e.metaKey) && (e.key === 'Z' || e.key === 'y')) {
        e.preventDefault();
        redo();
        return;
      }
      
      // Delete or Backspace - delete selected shape
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedShape) {
        e.preventDefault();
        updateCanvasShapes(prev => prev.filter(s => s.id !== selectedId));
        setSelectedId(null);
      }
      
      // Ctrl/Cmd + C - copy selected shape
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedShape) {
        e.preventDefault();
        setClipboardShape({ ...selectedShape });
      }
      
      // Ctrl/Cmd + X - cut selected shape
      if ((e.ctrlKey || e.metaKey) && e.key === 'x' && selectedShape) {
        e.preventDefault();
        setClipboardShape({ ...selectedShape });
        updateCanvasShapes(prev => prev.filter(s => s.id !== selectedId));
        setSelectedId(null);
      }
      
      // Ctrl/Cmd + V - paste shape
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboardShape) {
        e.preventDefault();
        const newShape = {
          ...clipboardShape,
          id: Date.now(),
          x: clipboardShape.x + 20,
          y: clipboardShape.y + 20
        };
        updateCanvasShapes(prev => [...prev, newShape]);
        setSelectedId(newShape.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, canvasShapes, clipboardShape, historyIndex, history]);
  
  // Available shapes (kept for reference, UI moved to sidebar)
  const availableShapes = [
    { type: 'rectangle', name: 'Rectangle', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="#004aad"><rect x="2" y="4" width="20" height="16" rx="2" /></svg> },
    { type: 'square', name: 'Square', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="#004aad"><rect x="3" y="3" width="18" height="18" rx="2" /></svg> },
    { type: 'circle', name: 'Circle', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="#004aad"><circle cx="12" cy="12" r="10" /></svg> },
    { type: 'ellipse', name: 'Ellipse', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="#004aad"><ellipse cx="12" cy="12" rx="10" ry="6" /></svg> },
    { type: 'triangle', name: 'Triangle', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="#004aad"><polygon points="12,2 22,22 2,22" /></svg> },
    { type: 'rightTriangle', name: 'Right Triangle', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="#004aad"><polygon points="2,2 2,22 22,22" /></svg> },
    { type: 'diamond', name: 'Diamond', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="#004aad"><polygon points="12,2 22,12 12,22 2,12" /></svg> },
    { type: 'pentagon', name: 'Pentagon', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="#004aad"><polygon points="12,2 22,9 18,22 6,22 2,9" /></svg> },
    { type: 'hexagon', name: 'Hexagon', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="#004aad"><polygon points="6,2 18,2 23,12 18,22 6,22 1,12" /></svg> },
    { type: 'star', name: 'Star', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="#004aad"><polygon points="12,2 15,9 22,9 17,14 19,22 12,17 5,22 7,14 2,9 9,9" /></svg> },
    { type: 'arrow', name: 'Arrow', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="#004aad"><polygon points="12,2 22,12 16,12 16,22 8,22 8,12 2,12" /></svg> },
    { type: 'text', name: 'Text', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="#004aad"><text x="12" y="17" textAnchor="middle" fontSize="14" fontWeight="bold" fontFamily="Arial">T</text></svg> },
  ];
  
  // Get clip-path for shape type
  const getClipPath = (shape) => {
    const type = typeof shape === 'string' ? shape : shape.type;
    const curve = typeof shape === 'object' ? (shape.curve || 0) : 0;
    
    // If curve is applied, use rounded polygon via SVG path
    if (curve > 0 && ['triangle', 'rightTriangle', 'diamond', 'star'].includes(type)) {
      const points = {
        triangle: [[50, 0], [100, 100], [0, 100]],
        rightTriangle: [[0, 0], [0, 100], [100, 100]],
        diamond: [[50, 0], [100, 50], [50, 100], [0, 50]],
        star: [[50, 0], [61, 35], [98, 35], [68, 57], [79, 91], [50, 70], [21, 91], [32, 57], [2, 35], [39, 35]]
      }[type];
      
      if (points) {
        const radius = curve * 0.3;
        let path = '';
        const n = points.length;
        
        for (let i = 0; i < n; i++) {
          const prev = points[(i - 1 + n) % n];
          const curr = points[i];
          const next = points[(i + 1) % n];
          
          const v1 = [prev[0] - curr[0], prev[1] - curr[1]];
          const v2 = [next[0] - curr[0], next[1] - curr[1]];
          
          const len1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
          const len2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]);
          
          const maxR = Math.min(len1, len2) * 0.4;
          const r = Math.min(radius, maxR);
          
          const start = [curr[0] + (v1[0] / len1) * r, curr[1] + (v1[1] / len1) * r];
          const end = [curr[0] + (v2[0] / len2) * r, curr[1] + (v2[1] / len2) * r];
          
          if (i === 0) {
            path += `M ${start[0]} ${start[1]} `;
          } else {
            path += `L ${start[0]} ${start[1]} `;
          }
          path += `Q ${curr[0]} ${curr[1]} ${end[0]} ${end[1]} `;
        }
        path += 'Z';
        return `path('${path}')`;
      }
    }
    
    switch (type) {
      case 'triangle': return 'polygon(50% 0%, 100% 100%, 0% 100%)';
      case 'rightTriangle': return 'polygon(0% 0%, 0% 100%, 100% 100%)';
      case 'diamond': return 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
      case 'pentagon': return 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)';
      case 'hexagon': return 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
      case 'star': return 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
      case 'arrow': return 'polygon(50% 0%, 100% 50%, 70% 50%, 70% 100%, 30% 100%, 30% 50%, 0% 50%)';
      default: return 'none';
    }
  };
  
  // Get border-radius for shape type
  const getBorderRadius = (shape, width, height) => {
    const type = typeof shape === 'string' ? shape : shape.type;
    const borderRadius = typeof shape === 'object' ? shape.borderRadius : undefined;
    
    switch (type) {
      case 'circle': return '50%';
      case 'ellipse': return '50%';
      case 'rectangle': case 'square': 
        return borderRadius !== undefined ? `${borderRadius}px` : '4px';
      default: return '0';
    }
  };
  
  // Add shape to canvas
  const addShapeToCanvas = (shapeType) => {
    const newShape = {
      id: Date.now(),
      type: shapeType,
      x: 200 + Math.random() * 100,
      y: 150 + Math.random() * 100,
      width: shapeType === 'ellipse' ? 120 : shapeType === 'text' ? 150 : 80,
      height: shapeType === 'ellipse' ? 60 : shapeType === 'rectangle' ? 50 : shapeType === 'text' ? 40 : 80,
      color: '#004aad',
      opacity: 100,
      rotation: 0,
      flipX: false,
      flipY: false,
      ...(shapeType === 'text' && {
        text: 'Text',
        fontSize: 24,
        fontFamily: 'Arial',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'center'
      })
    };
    updateCanvasShapes(prev => [...prev, newShape]);
    setSelectedId(newShape.id);
  };
  
  // Register addShapeToCanvas with parent component via ref
  React.useEffect(() => {
    if (addShapeToCanvasRef) {
      addShapeToCanvasRef.current = addShapeToCanvas;
    }
    return () => {
      if (addShapeToCanvasRef) {
        addShapeToCanvasRef.current = null;
      }
    };
  }, [addShapeToCanvasRef]);
  
  // Handle mouse down on canvas shape
  const handleShapeMouseDown = (e, shape, resizing = false) => {
    e.stopPropagation();
    const rect = canvasRef.current.getBoundingClientRect();
    setSelectedId(shape.id);
    setDragState({
      id: shape.id,
      offsetX: e.clientX - rect.left - shape.x,
      offsetY: e.clientY - rect.top - shape.y,
      type: resizing ? 'resize' : 'move',
      startWidth: shape.width,
      startHeight: shape.height,
      startX: e.clientX,
      startY: e.clientY
    });
  };
  
  // Handle mouse move on canvas
  const handleCanvasMouseMove = React.useCallback((e) => {
    if (!dragState) return;
    
    if (dragState.type === 'move') {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      let newX = Math.max(0, Math.min(rect.width - 20, e.clientX - rect.left - dragState.offsetX));
      let newY = Math.max(0, Math.min(rect.height - 20, e.clientY - rect.top - dragState.offsetY));
      
      // Apply grid snap
      newX = snapValue(newX);
      newY = snapValue(newY);
      
      setCanvasShapes(prev => prev.map(s => 
        s.id === dragState.id ? { ...s, x: newX, y: newY } : s
      ));
    } else if (dragState.type === 'resize') {
      const deltaX = e.clientX - dragState.startX;
      const deltaY = e.clientY - dragState.startY;
      let newWidth = Math.max(20, dragState.startWidth + deltaX);
      let newHeight = Math.max(20, dragState.startHeight + deltaY);
      
      // Apply grid snap
      newWidth = snapValue(newWidth);
      newHeight = snapValue(newHeight);
      
      setCanvasShapes(prev => prev.map(s => 
        s.id === dragState.id ? { ...s, width: newWidth, height: newHeight } : s
      ));
    }
  }, [dragState, snapToGrid, gridSize]);
  
  // Handle mouse up - save to history after drag operation
  const handleCanvasMouseUp = React.useCallback(() => {
    if (dragState) {
      // Save to history after drag/resize ends
      setCanvasShapes(current => {
        saveToHistory(current);
        return current;
      });
    }
    setDragState(null);
  }, [dragState]);
  
  // Global mouse event listeners for smooth dragging/resizing
  React.useEffect(() => {
    if (dragState) {
      const handleGlobalMouseMove = (e) => handleCanvasMouseMove(e);
      const handleGlobalMouseUp = () => handleCanvasMouseUp();
      
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [dragState, handleCanvasMouseMove, handleCanvasMouseUp]);
  
  // Delete selected shape
  const deleteSelectedShape = () => {
    if (selectedId) {
      updateCanvasShapes(prev => prev.filter(s => s.id !== selectedId));
      setSelectedId(null);
    }
  };
  
  // Update selected shape property
  const updateSelectedShape = (property, value) => {
    updateCanvasShapes(prev => prev.map(s => 
      s.id === selectedId ? { ...s, [property]: value } : s
    ));
  };
  
  // Get selected shape
  const selectedShape = canvasShapes.find(s => s.id === selectedId);
  
  // Clear canvas
  const clearCanvas = () => {
    updateCanvasShapes([]);
    setSelectedId(null);
  };
  
  // Generate CSS for all shapes
  const generateCanvasCSS = () => {
    if (canvasShapes.length === 0) return '/* Add shapes to the canvas to generate CSS */';
    
    return canvasShapes.map((shape, index) => {
      const className = `shape-${index + 1}`;
      let css = `.${className} {\n`;
      css += `  position: absolute;\n`;
      css += `  left: ${Math.round(shape.x)}px;\n`;
      css += `  top: ${Math.round(shape.y)}px;\n`;
      css += `  width: ${Math.round(shape.width)}px;\n`;
      css += `  height: ${Math.round(shape.height)}px;\n`;
      
      if (shape.type === 'text') {
        css += `  color: ${shape.color};\n`;
        css += `  font-size: ${shape.fontSize || 24}px;\n`;
        css += `  font-family: ${shape.fontFamily || 'Arial'};\n`;
        css += `  font-weight: ${shape.fontWeight || 'normal'};\n`;
        css += `  font-style: ${shape.fontStyle || 'normal'};\n`;
        css += `  display: flex;\n`;
        css += `  align-items: center;\n`;
        css += `  justify-content: center;\n`;
      } else {
        css += `  background: ${shape.color};\n`;
        
        const clipPath = getClipPath(shape);
        if (clipPath !== 'none') {
          css += `  clip-path: ${clipPath};\n`;
        } else {
          css += `  border-radius: ${getBorderRadius(shape, shape.width, shape.height)};\n`;
        }
      }
      
      // Build transform string
      const transforms = [];
      if (shape.rotation !== 0) transforms.push(`rotate(${shape.rotation}deg)`);
      if (shape.flipX) transforms.push('scaleX(-1)');
      if (shape.flipY) transforms.push('scaleY(-1)');
      if (transforms.length > 0) {
        css += `  transform: ${transforms.join(' ')};\n`;
      }
      
      // Add opacity
      if (shape.opacity !== undefined && shape.opacity !== 100) {
        css += `  opacity: ${shape.opacity / 100};\n`;
      }
      
      css += `}`;
      return css;
    }).join('\n\n');
  };
  
  // Generate HTML for all shapes
  const generateCanvasHTML = () => {
    if (canvasShapes.length === 0) return '<!-- Add shapes to the canvas -->';
    
    return `<div class="canvas-container" style="position: relative; width: 600px; height: 400px;">\n` +
      canvasShapes.map((shape, index) => {
        if (shape.type === 'text') {
          return `  <div class="shape-${index + 1}">${shape.text || 'Text'}</div>`;
        }
        return `  <div class="shape-${index + 1}"></div>`;
      }).join('\n') +
      `\n</div>`;
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: '#000' }}>Create Custom Object</h2>
        <div className="flex gap-2 items-center">
          {/* Undo/Redo Buttons */}
          <div className="flex items-center gap-1 mr-2">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              title="Undo (Ctrl+Z)"
              className="p-2 rounded-lg text-sm font-medium transition-all flex items-center"
              style={{ 
                background: historyIndex <= 0 ? '#e5e7eb' : '#f3f4f6',
                color: historyIndex <= 0 ? '#9ca3af' : '#004aad',
                cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 10h11c4 0 7 3 7 7s-3 7-7 7H7" />
                <path d="M7 6L3 10l4 4" />
              </svg>
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              title="Redo (Ctrl+Shift+Z)"
              className="p-2 rounded-lg text-sm font-medium transition-all flex items-center"
              style={{ 
                background: historyIndex >= history.length - 1 ? '#e5e7eb' : '#f3f4f6',
                color: historyIndex >= history.length - 1 ? '#9ca3af' : '#004aad',
                cursor: historyIndex >= history.length - 1 ? 'not-allowed' : 'pointer'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10H10c-4 0-7 3-7 7s3 7 7 7h4" />
                <path d="M17 6l4 4-4 4" />
              </svg>
            </button>
          </div>
          {/* Grid Snap Toggle */}
          <div className="flex items-center gap-2 mr-2">
            <button
              onClick={() => setSnapToGrid(!snapToGrid)}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
              style={{ 
                background: snapToGrid ? '#004aad' : '#f3f4f6',
                color: snapToGrid ? '#fff' : '#666'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              Snap
            </button>
            {snapToGrid && (
              <select
                value={gridSize}
                onChange={(e) => setGridSize(Number(e.target.value))}
                className="px-2 py-2 rounded-lg text-sm"
                style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#000' }}
              >
                <option value={10}>10px</option>
                <option value={20}>20px</option>
                <option value={40}>40px</option>
                <option value={50}>50px</option>
              </select>
            )}
          </div>
          {canvasShapes.length > 0 && (
            <>
              <button
                onClick={() => {
                  setSaveDialogName('Custom Creation');
                  setShowSaveDialog(true);
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                style={{ background: '#004aad', color: '#fff' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                  <polyline points="17,21 17,13 7,13 7,21" />
                  <polyline points="7,3 7,8 15,8" />
                </svg>
                Save
              </button>
              <button
                onClick={() => {
                  setPublishDialogName('My Custom Shape');
                  setPublishDialogType('shape');
                  setShowPublishDialog(true);
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                style={{ background: '#ffde59', color: '#000' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
                Publish
              </button>
            </>
          )}
          <button
            onClick={() => canvasShapes.length > 0 ? setShowClearConfirm(true) : null}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
            style={{ background: '#fee2e2', color: '#dc2626', opacity: canvasShapes.length === 0 ? 0.5 : 1, cursor: canvasShapes.length === 0 ? 'not-allowed' : 'pointer' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
            Clear
          </button>
        </div>
      </div>

      {/* Clear Canvas Confirmation Dialog */}
      {showClearConfirm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onKeyDown={(e) => e.key === 'Escape' && setShowClearConfirm(false)}
          tabIndex={-1}
          ref={(el) => el?.focus()}
        >
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full" style={{ background: '#fee2e2' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold" style={{ color: '#000' }}>Clear Canvas</h3>
            </div>
            <p className="text-sm mb-6" style={{ color: '#666' }}>
              Are you sure you want to clear the canvas? This will remove all shapes and cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all"
                style={{ background: '#f1f5f9', color: '#666' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearCanvas();
                  setShowClearConfirm(false);
                }}
                className="flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                style={{ background: '#dc2626', color: '#fff' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Creation Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#000' }}>Save to My Saved</h3>
            <p className="text-sm mb-4" style={{ color: '#666' }}>
              This will save to your personal "Saved" collection. Use "Publish" to add to the main library.
            </p>
            <input
              type="text"
              value={saveDialogName}
              onChange={(e) => setSaveDialogName(e.target.value)}
              placeholder="Creation name..."
              className="w-full px-4 py-3 rounded-xl text-sm outline-none mb-6"
              style={{ background: '#f9fafb', border: '2px solid #e5e7eb', color: '#000' }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && saveDialogName.trim()) {
                  onSaveCreation({ name: saveDialogName.trim(), shapes: canvasShapes });
                  showNotification(`"${saveDialogName.trim()}" saved to My Saved!`);
                  setShowSaveDialog(false);
                  setSaveDialogName('');
                  setCanvasShapes([]);
                  setSelectedId(null);
                } else if (e.key === 'Escape') {
                  setShowSaveDialog(false);
                  setSaveDialogName('');
                }
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setSaveDialogName('');
                }}
                className="flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all"
                style={{ background: '#f1f5f9', color: '#666' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (saveDialogName.trim()) {
                    onSaveCreation({ name: saveDialogName.trim(), shapes: canvasShapes });
                    showNotification(`"${saveDialogName.trim()}" saved to My Saved!`);
                    setShowSaveDialog(false);
                    setSaveDialogName('');
                    setCanvasShapes([]);
                    setSelectedId(null);
                  }
                }}
                className="flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                style={{ background: '#004aad', color: '#fff' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                  <polyline points="17,21 17,13 7,13 7,21" />
                  <polyline points="7,3 7,8 15,8" />
                </svg>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish to Library Dialog */}
      {showPublishDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#000' }}>Publish to Main Library</h3>
            <p className="text-sm mb-4" style={{ color: '#666' }}>
              This will add your creation to the main Search library for easy reuse.
            </p>
            
            {/* Name Input */}
            <div className="mb-4">
              <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#000' }}>
                Name
              </label>
              <input
                type="text"
                value={publishDialogName}
                onChange={(e) => setPublishDialogName(e.target.value)}
                placeholder="Shape name..."
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: '#f9fafb', border: '2px solid #e5e7eb', color: '#000' }}
                autoFocus
              />
            </div>
            
            {/* Type Selection */}
            <div className="mb-6">
              <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#000' }}>
                Publish as
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setPublishDialogType('shape')}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                  style={{ 
                    background: publishDialogType === 'shape' ? '#004aad' : '#f9fafb',
                    color: publishDialogType === 'shape' ? '#fff' : '#666',
                    border: '2px solid',
                    borderColor: publishDialogType === 'shape' ? '#004aad' : '#e5e7eb'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                  Shape
                </button>
                <button
                  onClick={() => setPublishDialogType('object')}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                  style={{ 
                    background: publishDialogType === 'object' ? '#004aad' : '#f9fafb',
                    color: publishDialogType === 'object' ? '#fff' : '#666',
                    border: '2px solid',
                    borderColor: publishDialogType === 'object' ? '#004aad' : '#e5e7eb'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18M9 21V9" />
                  </svg>
                  Object
                </button>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPublishDialog(false);
                  setPublishDialogName('');
                }}
                className="flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all"
                style={{ background: '#f1f5f9', color: '#666' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (publishDialogName.trim() && onPublishToLibrary) {
                    onPublishToLibrary(canvasShapes, publishDialogName.trim(), publishDialogType);
                    showNotification(`"${publishDialogName.trim()}" published to Main Library!`);
                    setShowPublishDialog(false);
                    setPublishDialogName('');
                  }
                }}
                className="flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                style={{ background: '#ffde59', color: '#000' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
                Publish
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex gap-6">
        {/* Canvas */}
        <div className="flex-1">
          <div 
            ref={canvasRef}
            className="relative rounded-2xl overflow-hidden cursor-crosshair"
            style={{ 
              width: '100%', 
              height: '400px', 
              background: '#fff',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)',
              border: '2px dashed #e5e7eb'
            }}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onClick={() => setSelectedId(null)}
          >
            {/* Grid */}
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: 'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)',
              backgroundSize: `${gridSize}px ${gridSize}px`
            }} />
            
            {/* Shapes */}
            {canvasShapes.map(shape => {
              const isSelected = shape.id === selectedId;
              const flipTransform = [
                shape.flipX ? 'scaleX(-1)' : '',
                shape.flipY ? 'scaleY(-1)' : ''
              ].filter(Boolean).join(' ');
              return (
                <div
                  key={shape.id}
                  className="absolute cursor-move"
                  style={{
                    left: shape.x,
                    top: shape.y,
                    width: shape.width,
                    height: shape.height,
                    outline: isSelected ? '2px solid #004aad' : 'none',
                    outlineOffset: '2px',
                    zIndex: isSelected ? 10 : 1,
                    transform: shape.rotation !== 0 ? `rotate(${shape.rotation}deg)` : 'none'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(shape.id);
                  }}
                  onMouseDown={(e) => handleShapeMouseDown(e, shape)}
                >
                  {shape.type === 'text' ? (
                    <div
                      className="pointer-events-none"
                      style={{
                        width: '100%',
                        height: '100%',
                        color: shape.color,
                        opacity: (shape.opacity ?? 100) / 100,
                        fontSize: `${shape.fontSize || 24}px`,
                        fontFamily: shape.fontFamily || 'Arial, sans-serif',
                        fontWeight: shape.fontWeight || 'normal',
                        fontStyle: shape.fontStyle || 'normal',
                        textAlign: shape.textAlign || 'left',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: shape.textAlign === 'center' ? 'center' : shape.textAlign === 'right' ? 'flex-end' : 'flex-start',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        overflow: 'hidden',
                        transform: flipTransform || 'none'
                      }}
                    >
                      {shape.text || 'Text'}
                    </div>
                  ) : (
                    <div
                      className="pointer-events-none"
                      style={{
                        width: '100%',
                        height: '100%',
                        background: shape.color,
                        opacity: (shape.opacity ?? 100) / 100,
                        clipPath: getClipPath(shape),
                        borderRadius: getBorderRadius(shape, shape.width, shape.height),
                        transform: flipTransform || 'none'
                      }}
                    />
                  )}
                  
                  {/* Resize handles - all corners */}
                  {isSelected && (
                    <>
                      {/* Bottom-right resize handle */}
                      <div
                        className="absolute w-4 h-4 rounded-full cursor-se-resize"
                        style={{
                          right: -8,
                          bottom: -8,
                          background: '#004aad',
                          border: '2px solid #fff',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                          zIndex: 20
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setDragState({
                            id: shape.id,
                            type: 'resize',
                            corner: 'br',
                            startWidth: shape.width,
                            startHeight: shape.height,
                            startX: e.clientX,
                            startY: e.clientY
                          });
                        }}
                      />
                      {/* Selection border corners */}
                      <div className="absolute w-2 h-2 bg-white border-2 border-blue-600 rounded-sm" style={{ top: -5, left: -5 }} />
                      <div className="absolute w-2 h-2 bg-white border-2 border-blue-600 rounded-sm" style={{ top: -5, right: -5 }} />
                      <div className="absolute w-2 h-2 bg-white border-2 border-blue-600 rounded-sm" style={{ bottom: -5, left: -5 }} />
                    </>
                  )}
                </div>
              );
            })}
            
            {/* Empty state */}
            {canvasShapes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1" className="mx-auto mb-2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M12 8v8M8 12h8" />
                  </svg>
                  <p className="text-sm" style={{ color: '#999' }}>Click shapes above to add them here</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Properties Panel */}
        <div className="w-64">
          {selectedShape ? (
            <>
              <h3 className="text-sm font-medium mb-4" style={{ color: '#000' }}>
                {availableShapes.find(s => s.type === selectedShape.type)?.name || 'Shape'} Properties
              </h3>
              
              {/* Color */}
              <div className="mb-4">
                <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#666' }}>Color</label>
                <div className="flex items-center gap-2 mb-3">
                  <div 
                    className="relative w-8 h-8 rounded-lg overflow-hidden cursor-pointer flex-shrink-0"
                    style={{ background: selectedShape.color }}
                  >
                    <input
                      type="color"
                      value={selectedShape.color}
                      onChange={(e) => updateSelectedShape('color', e.target.value)}
                      className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                    />
                  </div>
                  <input
                    type="text"
                    value={selectedShape.color}
                    onChange={(e) => updateSelectedShape('color', e.target.value)}
                    className="flex-1 px-2 py-1 rounded text-xs font-mono"
                    style={{ background: '#f8f9fa', border: '1px solid #e5e7eb', color: '#000' }}
                  />
                </div>
                {/* Quick Colors */}
                <div className="flex flex-wrap gap-1.5">
                  {['#FF6B6B', '#FF9F43', '#ffde59', '#6BCB77', '#4D96FF', '#6A4C93', '#FF8FAB', '#2EC4B6', '#F1FAEE', '#A8DADC', '#457B9D', '#1D3557'].map(c => (
                    <button
                      key={c}
                      onClick={() => updateSelectedShape('color', c)}
                      className="w-5 h-5 rounded transition-transform hover:scale-110"
                      style={{ 
                        background: c,
                        border: c === '#F1FAEE' ? '1px solid #ccc' : 'none',
                        boxShadow: selectedShape.color === c ? '0 0 0 2px white, 0 0 0 3px ' + c : 'none'
                      }}
                    />
                  ))}
                </div>

                {/* Opacity Slider */}
                <div className="mt-3">
                  <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#666' }}>
                    Opacity: {selectedShape.opacity ?? 100}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={selectedShape.opacity ?? 100}
                    onChange={(e) => updateSelectedShape('opacity', Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{ 
                      background: `linear-gradient(to right, ${selectedShape.color}00 0%, ${selectedShape.color} 100%)`, 
                      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
                      '--thumb-color': selectedShape.color
                    }}
                  />
                </div>
              </div>
              
              {/* Text Properties - Only for text type */}
              {selectedShape.type === 'text' && (
                <>
                  {/* Text Content */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#666' }}>Text Content</label>
                    <input
                      type="text"
                      value={selectedShape.text || 'Text'}
                      onChange={(e) => updateSelectedShape('text', e.target.value)}
                      className="w-full px-2 py-1.5 rounded text-sm"
                      style={{ background: '#f8f9fa', border: '1px solid #e5e7eb', color: '#000' }}
                      placeholder="Enter text..."
                    />
                  </div>
                  
                  {/* Font Size */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#666' }}>Font Size: {selectedShape.fontSize || 24}px</label>
                    <input
                      type="range"
                      min="8"
                      max="72"
                      value={selectedShape.fontSize || 24}
                      onChange={(e) => updateSelectedShape('fontSize', Number(e.target.value))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{ background: `linear-gradient(to right, #004aad ${((selectedShape.fontSize || 24) - 8) / 64 * 100}%, #e5e7eb ${((selectedShape.fontSize || 24) - 8) / 64 * 100}%)` }}
                    />
                  </div>
                  
                  {/* Font Family */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#666' }}>Font Family</label>
                    <select
                      value={selectedShape.fontFamily || 'Arial'}
                      onChange={(e) => updateSelectedShape('fontFamily', e.target.value)}
                      className="w-full px-2 py-1.5 rounded text-sm"
                      style={{ background: '#f8f9fa', border: '1px solid #e5e7eb', color: '#000' }}
                    >
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Verdana">Verdana</option>
                      <option value="Impact">Impact</option>
                      <option value="Comic Sans MS">Comic Sans MS</option>
                    </select>
                  </div>
                  
                  {/* Font Style */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#666' }}>Font Style</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateSelectedShape('fontWeight', selectedShape.fontWeight === 'bold' ? 'normal' : 'bold')}
                        className="flex-1 px-3 py-1.5 rounded text-sm font-bold transition-all"
                        style={{ 
                          background: selectedShape.fontWeight === 'bold' ? '#004aad' : '#f8f9fa',
                          color: selectedShape.fontWeight === 'bold' ? '#fff' : '#000',
                          border: '1px solid #e5e7eb'
                        }}
                      >
                        B
                      </button>
                      <button
                        onClick={() => updateSelectedShape('fontStyle', selectedShape.fontStyle === 'italic' ? 'normal' : 'italic')}
                        className="flex-1 px-3 py-1.5 rounded text-sm italic transition-all"
                        style={{ 
                          background: selectedShape.fontStyle === 'italic' ? '#004aad' : '#f8f9fa',
                          color: selectedShape.fontStyle === 'italic' ? '#fff' : '#000',
                          border: '1px solid #e5e7eb'
                        }}
                      >
                        I
                      </button>
                    </div>
                  </div>
                </>
              )}
              
              {/* Size */}
              <div className="mb-4">
                <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#666' }}>Width: {Math.round(selectedShape.width)}px</label>
                <input
                  type="range"
                  min="20"
                  max="300"
                  value={selectedShape.width}
                  onChange={(e) => updateSelectedShape('width', Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, #004aad ${(selectedShape.width - 20) / 280 * 100}%, #e5e7eb ${(selectedShape.width - 20) / 280 * 100}%)` }}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#666' }}>Height: {Math.round(selectedShape.height)}px</label>
                <input
                  type="range"
                  min="20"
                  max="300"
                  value={selectedShape.height}
                  onChange={(e) => updateSelectedShape('height', Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, #004aad ${(selectedShape.height - 20) / 280 * 100}%, #e5e7eb ${(selectedShape.height - 20) / 280 * 100}%)` }}
                />
              </div>
              
              {/* Rotation */}
              <div className="mb-4">
                <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#666' }}>Rotation: {selectedShape.rotation}°</label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={selectedShape.rotation}
                  onChange={(e) => updateSelectedShape('rotation', Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, #004aad ${selectedShape.rotation / 360 * 100}%, #e5e7eb ${selectedShape.rotation / 360 * 100}%)` }}
                />
              </div>
              
              {/* Flip */}
              <div className="mb-4">
                <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#666' }}>Flip</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateSelectedShape('flipX', !selectedShape.flipX)}
                    className="flex-1 px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center justify-center gap-1"
                    style={{ 
                      background: selectedShape.flipX ? '#004aad' : '#f8f9fa',
                      color: selectedShape.flipX ? '#fff' : '#000',
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 3v18M16 6l5 6-5 6M8 6l-5 6 5 6" />
                    </svg>
                    Horizontal
                  </button>
                  <button
                    onClick={() => updateSelectedShape('flipY', !selectedShape.flipY)}
                    className="flex-1 px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center justify-center gap-1"
                    style={{ 
                      background: selectedShape.flipY ? '#004aad' : '#f8f9fa',
                      color: selectedShape.flipY ? '#fff' : '#000',
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 12h18M6 8l6-5 6 5M6 16l6 5 6-5" />
                    </svg>
                    Vertical
                  </button>
                </div>
              </div>
              
              {/* Shape-specific Controls - Border Radius for rectangles/squares */}
              {(selectedShape.type === 'rectangle' || selectedShape.type === 'square') && (
                <div className="mb-4">
                  <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#666' }}>
                    Corner Radius: {selectedShape.borderRadius || 0}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={selectedShape.borderRadius || 0}
                    onChange={(e) => updateSelectedShape('borderRadius', Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{ background: `linear-gradient(to right, #004aad ${(selectedShape.borderRadius || 0) / 50 * 100}%, #e5e7eb ${(selectedShape.borderRadius || 0) / 50 * 100}%)` }}
                  />
                </div>
              )}
              
              {/* Shape-specific Controls - Corner Curve for triangle, rightTriangle, diamond, star */}
              {(selectedShape.type === 'triangle' || selectedShape.type === 'rightTriangle' || selectedShape.type === 'diamond' || selectedShape.type === 'star') && (
                <div className="mb-4">
                  <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#666' }}>
                    Corner Curve: {selectedShape.curve || 0}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={selectedShape.curve || 0}
                    onChange={(e) => updateSelectedShape('curve', Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{ background: `linear-gradient(to right, #004aad ${(selectedShape.curve || 0)}%, #e5e7eb ${(selectedShape.curve || 0)}%)` }}
                  />
                </div>
              )}
              
              {/* Position */}
              <div className="mb-4 grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide mb-1" style={{ color: '#666' }}>X</label>
                  <input
                    type="number"
                    value={Math.round(selectedShape.x)}
                    onChange={(e) => updateSelectedShape('x', Number(e.target.value))}
                    className="w-full px-2 py-1 rounded text-xs"
                    style={{ background: '#f8f9fa', border: '1px solid #e5e7eb', color: '#000' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide mb-1" style={{ color: '#666' }}>Y</label>
                  <input
                    type="number"
                    value={Math.round(selectedShape.y)}
                    onChange={(e) => updateSelectedShape('y', Number(e.target.value))}
                    className="w-full px-2 py-1 rounded text-xs"
                    style={{ background: '#f8f9fa', border: '1px solid #e5e7eb', color: '#000' }}
                  />
                </div>
              </div>
              
              {/* Delete */}
              <button
                onClick={deleteSelectedShape}
                className="w-full px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2"
                style={{ background: '#fee2e2', color: '#dc2626' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
                Delete Shape
              </button>
            </>
          ) : (
            <div className="text-center py-8">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1" className="mx-auto mb-2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              <p className="text-xs" style={{ color: '#999' }}>Select a shape to edit its properties</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Generated Code */}
      <div className="mt-6 flex flex-col gap-4">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#000' }}>CSS</label>
          <div className="relative">
            <pre 
              className="p-4 rounded-xl text-xs overflow-auto cursor-pointer"
              style={{ background: '#f3f4f6', color: '#000', maxHeight: '200px' }}
              onClick={() => copyCSS(generateCanvasCSS())}
            >
              <code>{generateCanvasCSS()}</code>
            </pre>
            <button
              onClick={() => copyCSS(generateCanvasCSS())}
              className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium transition-all"
              style={{ background: copiedCSS ? '#10b981' : '#004aad', color: '#fff' }}
            >
              {copiedCSS ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#000' }}>HTML</label>
          <div className="relative">
            <pre 
              className="p-4 rounded-xl text-xs overflow-auto cursor-pointer"
              style={{ background: '#f3f4f6', color: '#000', maxHeight: '200px' }}
              onClick={() => copyHTML(generateCanvasHTML())}
            >
              <code>{generateCanvasHTML()}</code>
            </pre>
            <button
              onClick={() => copyHTML(generateCanvasHTML())}
              className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium transition-all"
              style={{ background: copiedHTML ? '#10b981' : '#004aad', color: '#fff' }}
            >
              {copiedHTML ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CssShapes;
