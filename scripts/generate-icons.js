const fs = require('fs')
const path = require('path')

// Creates simple SVG-based placeholder icons
// Replace with your actual icon generation tool later
const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

const createSVGIcon = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#050810"/>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2563eb;stop-opacity:1" />
    </linearGradient>
  </defs>
  <polyline points="${size*0.7},${size*0.3} ${size*0.47},${size*0.6} ${size*0.33},${size*0.47} ${size*0.15},${size*0.65}" 
    fill="none" stroke="white" stroke-width="${size*0.06}" stroke-linecap="round" stroke-linejoin="round"/>
  <polyline points="${size*0.56},${size*0.3} ${size*0.7},${size*0.3} ${size*0.7},${size*0.44}" 
    fill="none" stroke="white" stroke-width="${size*0.06}" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`

sizes.forEach(size => {
  const svgContent = createSVGIcon(size)
  const filePath = path.join(__dirname, '..', 'public', 'icons', `icon-${size}x${size}.svg`)
  fs.writeFileSync(filePath, svgContent)
  console.log(`Created icon-${size}x${size}.svg`)
})

console.log('Icons created! Convert SVGs to PNGs using an online tool or sharp.')