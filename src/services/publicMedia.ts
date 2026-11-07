import { getBlob, ref } from 'firebase/storage'

import { firebaseStorage } from '../lib/firebaseStorage'
import { requireFirebase } from '../lib/firebaseApp'
import { toFirebaseServiceError } from './firebaseErrors'

export async function readPublicMedia(storagePath: string): Promise<Blob> {
  if (!storagePath.startsWith('media/') || storagePath.includes('..')) {
    throw new Error('La ruta del medio no es válida.')
  }
  try {
    return await getBlob(ref(requireFirebase(firebaseStorage, 'Storage'), storagePath))
  } catch (cause) {
    throw toFirebaseServiceError(cause, 'No se pudo leer el medio público')
  }
}
