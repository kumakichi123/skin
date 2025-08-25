'use client'
import { useState, useMemo } from 'react'
import type { Scores, Product } from '../types'
import { fileToBase64 } from '../utils/file'
import { ga } from '../lib/ga'
import { MESSAGES } from '../constants/messages'

type AnalyzeResponse = { scores: Scores }
type RecommendResponse = { products: Product[] }
type ChartDatum = { metric: string; value: number }

export function useAnalyze(){
  const [file, setFile] = useState<File|null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [scores, setScores] = useState<Scores|null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState<string>('')

  const chartData = useMemo<ChartDatum[]>(() => {
    if (!scores) return []
    const s = scores
    return [
      { metric: '乾燥', value: s.dryness },
      { metric: '皮脂', value: s.oiliness },
      { metric: '赤み', value: s.redness },
      { metric: '明るさ', value: s.brightness },
      { metric: 'むくみ', value: s.puffiness },
    ]
  }, [scores])

  const analyze = async (): Promise<void> => {
    setError('')
    if (!file) { setError(MESSAGES.selectImage); return }
    setLoading(true)
    const t0 = performance.now()
    ga('analyze_start')

    try {
      const b64 = await fileToBase64(file)
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: b64 }),
      })

      const json = (await res.json()) as AnalyzeResponse & { error?: string }

      if (!res.ok) {
        if (json.error === 'no face detected') throw new Error(MESSAGES.faceNotFound)
        throw new Error(json.error || MESSAGES.analyzeFail)
      }

      const s = json.scores
      setScores(s)
      ga('analyze_success', { latency_ms: Math.round(performance.now() - t0) })

      const qs = new URLSearchParams({
        dryness: String(s.dryness),
        oiliness: String(s.oiliness),
        redness: String(s.redness),
        brightness: String(s.brightness),
        puffiness: String(s.puffiness),
      })

      const rec = await fetch(`/api/recommend?${qs.toString()}`)
      const recJson = (await rec.json()) as RecommendResponse & { error?: string }
      if (!rec.ok) throw new Error(recJson.error || MESSAGES.recommendFail)

      setProducts(recJson.products ?? [])
      ga('recommend_list_loaded', { count: (recJson.products ?? []).length })
    } catch (e: any) {
      setError(e?.message || MESSAGES.networkError)
      ga('analyze_error', { message: String(e?.message ?? e) })
    } finally {
      setLoading(false)
    }
  }

  return { file, setFile, loading, scores, products, error, chartData, analyze }
}