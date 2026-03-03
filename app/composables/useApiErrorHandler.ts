export class ApiError extends Error {
  status: number
  data?: unknown

  constructor(status: number, message: string, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export const useApiErrorHandler = () => {
  const handleApiResponse = <T extends { status: number; data?: unknown }>(
    response: T
  ): T['data'] => {
    if (response.status >= 200 && response.status < 300) {
      return response.data
    }

    let errorMessage = `Erreur inattendue (Code ${response.status})`

    switch (response.status) {
      case 400:
        errorMessage = 'Requête invalide. Veuillez vérifier vos données.'
        break
      case 401:
        errorMessage = 'Vous devez être connecté pour effectuer cette action.'
        break
      case 403:
        errorMessage = "Vous n'avez pas les droits nécessaires."
        break
      case 404:
        errorMessage = 'La ressource demandée est introuvable.'
        break
      case 408:
        errorMessage = 'Le délai de la requête a expiré.'
        break
      case 422:
        errorMessage = 'Données invalides.'
        break
      case 500:
      case 502:
      case 503:
      case 504:
        errorMessage = 'Une erreur sur le serveur est survenue. Veuillez réessayer plus tard.'
        break
    }

    throw new ApiError(response.status, errorMessage, response.data)
  }

  return {
    handleApiResponse,
  }
}
