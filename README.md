<p align="center">
  <img src="public/favicon.svg" alt="CSS Studio Logo" width="80" height="80">
</p>

<h1 align="center">CSS Studio</h1>

<p align="center">
  Create and customize CSS shapes with an intuitive visual editor.
</p>

---

## Features

### 🔍 Shape Library
- Browse a comprehensive library of pre-built CSS shapes and objects
- Filter by type: shapes, objects, or custom creations
- Search functionality to quickly find what you need
- One-click copy CSS code to clipboard

### 🎨 Visual Customization
- **Colors**: Solid colors, linear gradients, and radial gradients
- **Opacity**: Adjustable transparency for any shape
- **Size**: Scale shapes to your desired dimensions
- **Transform**: Rotate and flip shapes (horizontal/vertical)
- **Shape-specific options**: Custom controls for special shapes like blobs

### ✏️ Custom Shape Creator
- Drag-and-drop canvas for creating custom compositions
- Add multiple shapes: rectangles, circles, ellipses, triangles, and text
- Resize, rotate, and position shapes freely
- Snap-to-grid option for precise alignment
- Undo/Redo support
- Generate CSS and HTML code for your creations

### 💾 Save & Organize
- Save shapes to your personal collection
- Publish custom creations to the main library
- Edit and manage saved items
- Persistent storage using localStorage

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mmmudmi/css-studio.git
cd css-studio
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173/css-studio/`

### Build for Production

```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Usage

### Browsing Shapes
1. Navigate to the **Search** tab
2. Use the filter buttons to show All, Shapes, or Objects
3. Click on any shape to select it and view customization options
4. Adjust color, size, rotation, and other properties
5. Click **Copy CSS** to copy the generated code

### Creating Custom Shapes
1. Navigate to the **Create** tab
2. Use the shape tools to add elements to the canvas
3. Click and drag to move shapes, use corner handles to resize
4. Customize each shape's color, opacity, and rotation
5. **Save** to your personal collection or **Publish** to the library
6. Copy the generated CSS/HTML code

### Managing Saved Shapes
1. Navigate to the **Saved** tab
2. View all your saved shapes and creations
3. Click to preview, edit, or delete items
4. Add saved items to the main library for quick access

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework (loaded via CDN)
- **localStorage** - Client-side data persistence