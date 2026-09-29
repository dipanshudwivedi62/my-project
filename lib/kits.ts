export type Rgb = [number, number, number]

export const KIT_IDS = ['marquis', 'scott', 'duquenois', 'simon'] as const
export type KitId = (typeof KIT_IDS)[number]

export type KitReference = { label: string; rgb: Rgb }

export type Kit = {
  id: KitId
  name: string
  targets: string
  instructions: string
  positives: KitReference[]
  negative: KitReference
}

// Reference colours are white-balanced sRGB values of the reacted reagent
// photographed on the white reference card.
export const KITS: Kit[] = [
  {
    id: 'marquis',
    name: 'Marquis reagent',
    targets: 'Opiates, MDMA, amphetamines',
    instructions: 'Place sample in the well, add 1–2 drops, read after 30 seconds.',
    positives: [
      { label: 'Opiates / MDMA (violet–black)', rgb: [74, 32, 88] },
      { label: 'Amphetamines (orange–brown)', rgb: [186, 96, 42] },
    ],
    negative: { label: 'No reaction (clear / pale)', rgb: [236, 232, 208] },
  },
  {
    id: 'scott',
    name: 'Scott (cobalt thiocyanate)',
    targets: 'Cocaine',
    instructions: 'Add reagent A, wait 60 seconds, then read the colour of the precipitate.',
    positives: [{ label: 'Cocaine (turquoise blue)', rgb: [38, 96, 186] }],
    negative: { label: 'No reaction (pink)', rgb: [228, 172, 190] },
  },
  {
    id: 'duquenois',
    name: 'Duquenois–Levine',
    targets: 'Cannabis (THC)',
    instructions: 'Run all three ampoules in order and read the lower layer after 60 seconds.',
    positives: [{ label: 'Cannabinoids (violet)', rgb: [118, 70, 160] }],
    negative: { label: 'No reaction (clear / grey)', rgb: [226, 224, 214] },
  },
  {
    id: 'simon',
    name: "Simon's reagent",
    targets: 'Methamphetamine, MDMA',
    instructions: 'Add both reagents, agitate gently, read within 60 seconds.',
    positives: [{ label: 'Secondary amines (deep blue)', rgb: [36, 58, 158] }],
    negative: { label: 'No reaction (pale yellow)', rgb: [224, 218, 176] },
  },
]

export function getKit(id: string): Kit | undefined {
  return KITS.find((kit) => kit.id === id)
}
