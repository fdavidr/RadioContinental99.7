import { isValidStreamUrl } from '../utils/broadcastSchedule'

export type StreamCheckResult =
  | { kind: 'available'; detail: string }
  | { kind: 'unavailable'; detail: string }
  | { kind: 'unknown'; detail: string }

export async function checkStreamAvailability(url: string): Promise<StreamCheckResult> {
  if (!isValidStreamUrl(url)) {
    return { kind: 'unavailable', detail: 'La URL debe ser una dirección HTTP o HTTPS válida.' }
  }
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.startsWith('http:')) {
    return {
      kind: 'unavailable',
      detail: 'La página usa HTTPS y el navegador bloqueará esta señal HTTP por contenido mixto.',
    }
  }

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 8000)
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'cors',
      credentials: 'omit',
      signal: controller.signal,
    })
    if (response.ok) {
      const contentType = response.headers.get('content-type')
      return {
        kind: 'available',
        detail: `El servidor respondió HTTP ${response.status}${contentType ? ` (${contentType})` : ''}. Esto no confirma que se escuche audio.`,
      }
    }
    if (response.status === 405 || response.status === 501) {
      return {
        kind: 'unknown',
        detail: 'El servidor no permite comprobar disponibilidad con HEAD. Probá la reproducción desde el reproductor.',
      }
    }
    return { kind: 'unavailable', detail: `El servidor respondió HTTP ${response.status}.` }
  } catch (error) {
    const detail = error instanceof DOMException && error.name === 'AbortError'
      ? 'La comprobación excedió 8 segundos.'
      : 'El navegador no pudo leer la respuesta: puede ser CORS, un error de red o una restricción del proveedor. Esto no demuestra que la reproducción de audio falle.'
    return { kind: 'unknown', detail }
  } finally {
    window.clearTimeout(timeout)
  }
}
