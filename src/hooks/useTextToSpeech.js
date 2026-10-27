import { useState, useCallback, useEffect } from 'react'

/**
 * useTextToSpeech
 * Hook que envuelve la Web Speech API nativa del navegador
 * para leer texto en voz alta, en español.
 */
export function useTextToSpeech() {
  const [hablando, setHablando] = useState(false)
  const [soportado, setSoportado] = useState(true)

  useEffect(() => {
    // Algunos navegadores (poco comunes) no soportan esta API
    setSoportado('speechSynthesis' in window)
  }, [])

  const hablar = useCallback((texto) => {
    if (!('speechSynthesis' in window)) return

    // Si ya está hablando, cancelamos antes de iniciar uno nuevo
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(texto)
    utterance.lang = 'es-MX'
    utterance.rate = 1 // velocidad normal
    utterance.pitch = 1

    utterance.onstart = () => setHablando(true)
    utterance.onend = () => setHablando(false)
    utterance.onerror = () => setHablando(false)

    window.speechSynthesis.speak(utterance)
  }, [])

  const detener = useCallback(() => {
    window.speechSynthesis.cancel()
    setHablando(false)
  }, [])

  return { hablar, detener, hablando, soportado }
}