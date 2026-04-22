export interface PhoneValidationResult {
  phone: string
  valid: boolean
  format: {
    international: string
    local: string
  }
  country: {
    code: string
    name: string
    prefix: string
  }
  location: string
  type: string
  carrier: string
}

export async function validatePhone(
  phone: string,
  apiKey: string
): Promise<PhoneValidationResult | null> {
  try {
    const res = await fetch(
      `https://phonevalidation.abstractapi.com/v1/?api_key=${apiKey}&phone=${phone}`
    )
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}