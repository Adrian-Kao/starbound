import type { PointerField } from '../utils/pointerField'
import { BackgroundStars } from './BackgroundStars'

type Props = {
  seed: string
  pageIndex: number
  pointerRef: React.MutableRefObject<PointerField>
  interactive: boolean
}

const palette = [
  ['#8fcfff', '#d9f4ff', '#f1d6a6'],
  ['#9faeff', '#dcdfff', '#cabfff'],
  ['#b9dfff', '#f5edcf', '#f1d6a6'],
] as const

export function LensStarfield({ seed, pageIndex, pointerRef, interactive }: Props) {
  const colors = palette[pageIndex % palette.length]
  return (
    <>
      <BackgroundStars seed={`${seed}-far`} count={900} radius={8.4} depth={[6.8, 12]} color={colors[0]} opacity={0.46} pointScale={0.86} drift={0.0012} parallax={0.006} pointerRef={pointerRef} interactive={interactive} />
      <BackgroundStars seed={`${seed}-mid`} count={620} radius={6.1} depth={[3.3, 6.8]} color={colors[1]} opacity={0.72} pointScale={1.25} drift={-0.0025} parallax={0.014} pointerRef={pointerRef} interactive={interactive} />
      <BackgroundStars seed={`${seed}-near`} count={170} radius={4.5} depth={[0.8, 3]} color={colors[2]} opacity={0.88} pointScale={1.75} drift={0.004} parallax={0.024} pointerRef={pointerRef} interactive={interactive} />
    </>
  )
}
