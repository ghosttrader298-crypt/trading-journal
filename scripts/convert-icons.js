const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

async function convertIcons() {
  for (const size of sizes) {
    const svgPath = path.join(__dirname, '..', 'public', 'icons', `icon-${size}x${size}.svg`)
    const pngPath = path.join(__dirname, '..', 'public', 'icons', `icon-${size}x${size}.png`)
    
    if (fs.existsSync(svgPath)) {
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(pngPath)
      console.log(`✓ icon-${size}x${size}.png`)
    }
  }
  console.log('All icons converted!')
}

convertIcons().catch(console.error)