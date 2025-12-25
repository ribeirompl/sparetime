import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdir } from 'node:fs/promises'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const ICONS_DIR = join(__dirname, '..', 'public', 'icons')
const SOURCE_SVG = join(ICONS_DIR, 'icon.svg')

interface IconConfig {
  name: string
  size: number
  maskable?: boolean
}

const icons: IconConfig[] = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-maskable.png', size: 512, maskable: true }
]

async function generateIcons() {
  await mkdir(ICONS_DIR, { recursive: true })

  console.log('Generating PWA icons from SVG...')

  for (const icon of icons) {
    const outputPath = join(ICONS_DIR, icon.name)

    const pipeline = sharp(SOURCE_SVG).resize(icon.size, icon.size)

    // Add white background for non-maskable icons
    // Maskable icons should remain transparent for OS to apply its own background
    if (!icon.maskable) {
      await pipeline
        .flatten({ background: '#ffffff' })
        .png()
        .toFile(outputPath)
    } else {
      await pipeline
        .png()
        .toFile(outputPath)
    }

    console.log(`✓ Generated ${icon.name} (${icon.size}x${icon.size}${icon.maskable ? ', maskable' : ''})`)
  }

  console.log('All icons generated successfully!')
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err)
  process.exit(1)
})
