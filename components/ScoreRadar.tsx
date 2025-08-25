'use client'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import type { Scores } from '../types'

export function ScoreRadar({ scores }: { scores: Scores }){
  const data = [
    { key: '乾燥', v: scores.dryness },
    { key: '皮脂', v: scores.oiliness },
    { key: '赤み', v: scores.redness },
    { key: '明るさ', v: scores.brightness },
    { key: 'むくみ', v: scores.puffiness },
  ]
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius={90}>
          <PolarGrid />
          <PolarAngleAxis dataKey="key" />
          <PolarRadiusAxis domain={[0,100]} />
          <Radar dataKey="v" fillOpacity={0.4} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}