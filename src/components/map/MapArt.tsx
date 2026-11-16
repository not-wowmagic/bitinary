/** Illustrated Manila map in world units 0..1200. Colors follow theme variables. */
const blocks: [number, number, number, number][] = [
  // Binondo (north of river)
  [620, 120, 70, 50], [710, 110, 80, 60], [810, 120, 60, 70], [890, 140, 90, 50], [640, 190, 60, 50], [720, 190, 70, 45], [900, 210, 70, 50], [1000, 160, 80, 60], [1000, 240, 70, 40], [560, 140, 40, 60],
  // Ermita / Malate (south)
  [600, 820, 70, 50], [690, 800, 60, 70], [770, 790, 80, 50], [860, 780, 70, 60], [600, 900, 80, 60], [700, 900, 60, 50], [780, 870, 90, 60], [880, 870, 70, 70], [960, 820, 80, 60], [960, 910, 70, 60], [620, 990, 90, 60], [730, 980, 70, 70], [820, 960, 80, 60], [920, 1000, 90, 60],
  // east of central Manila
  [860, 470, 80, 60], [960, 450, 70, 70], [860, 560, 70, 60], [950, 560, 90, 50], [1050, 480, 80, 70], [1060, 580, 70, 60],
]

export function MapArt() {
  return (
    <g>
      <rect x={-600} y={-600} width={2400} height={2400} fill="var(--map-land)" />
      {/* Manila Bay */}
      <path d="M-600 -600 H260 C 230 200, 300 380, 250 520 C 210 650, 290 820, 240 1800 H-600 Z" fill="var(--map-water)" />
      {/* Pasig River */}
      <path
        d="M1800 330 C 1300 300, 1150 360, 1000 330 C 880 305, 800 360, 720 340 C 620 315, 560 300, 470 318 C 380 336, 320 310, 240 330"
        fill="none"
        stroke="var(--map-water)"
        strokeWidth={46}
        strokeLinecap="round"
      />
      {/* parks */}
      <path d="M300 760 L 540 770 L 570 940 L 300 950 Z" fill="var(--map-park)" />
      <path d="M720 400 C 800 420, 830 520, 790 650 L 760 660 L 730 420 Z" fill="var(--map-park)" />
      <circle cx={430} cy={850} r={26} fill="var(--map-water)" opacity={0.7} />
      {/* city blocks */}
      {blocks.map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} rx={10} fill="var(--map-block)" />
      ))}
      {/* major roads */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {[
          'M300 -400 C 300 300, 290 600, 300 1600', // Roxas Blvd
          'M880 -400 L 880 1600', // Taft
          'M240 750 C 500 740, 700 760, 1600 740', // P. Burgos / UN
          'M400 340 L 400 1000', // Bonifacio Dr
          'M700 -200 L 700 420', // Jones bridge
          'M800 -200 L 810 420', // MacArthur
          'M540 60 C 700 80, 900 60, 1600 90', // Recto
          'M760 640 L 1600 520',
        ].map((d) => (
          <g key={d}>
            <path d={d} stroke="var(--map-road-edge)" strokeWidth={20} />
            <path d={d} stroke="var(--map-road)" strokeWidth={14} />
          </g>
        ))}
      </g>
      {/* central Manila district */}
      <path d="M430 360 L 720 380 L 760 640 L 640 760 L 440 700 L 400 500 Z" fill="var(--map-block)" stroke="var(--map-wall)" strokeWidth={12} strokeLinejoin="round" />
      {/* bastions */}
      {[
        [430, 360], [720, 380], [760, 640], [640, 760], [440, 700], [400, 500],
      ].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x - 14} y={y - 14} width={28} height={28} rx={4} fill="var(--map-wall)" transform={`rotate(45 ${x} ${y})`} />
      ))}
      {/* central street grid */}
      <g stroke="var(--map-road)" strokeWidth={7} strokeLinecap="round">
        <path d="M450 450 L 735 470" />
        <path d="M440 540 L 745 560" />
        <path d="M450 630 L 720 650" />
        <path d="M520 380 L 500 720" />
        <path d="M610 386 L 590 750" />
        <path d="M690 400 L 690 690" />
      </g>
      {/* Fort Santiago */}
      <path d="M470 330 L 560 330 L 560 380 L 480 392 Z" fill="var(--map-wall)" opacity={0.85} />

      {/* labels */}
      <g fontFamily="Poppins, sans-serif" fontWeight={600} fill="var(--map-label)" textAnchor="middle" letterSpacing={6}>
        <text x={585} y={600} fontSize={26} opacity={0.6}>MANILA</text>
        <text x={820} y={265} fontSize={24} opacity={0.6}>BINONDO</text>
        <text x={790} y={1080} fontSize={24} opacity={0.6}>ERMITA</text>
        <text x={430} y={920} fontSize={18} opacity={0.55} letterSpacing={3}>LUNETA</text>
      </g>
      <g fontFamily="Open Sans, sans-serif" fontStyle="italic" fill="var(--map-label)" opacity={0.5} textAnchor="middle">
        <text x={110} y={560} fontSize={26} transform="rotate(-80 110 560)">Manila Bay</text>
        <text x={1000} y={318} fontSize={18}>Ilog Pasig</text>
      </g>
    </g>
  )
}
