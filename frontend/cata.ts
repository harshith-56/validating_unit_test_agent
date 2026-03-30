// function
export function calculateFinalPrice(
  price: number,
  taxRate: number,
  discount: number
): number {
  if (price < 0) throw new Error("Invalid price");
  if (taxRate < 0 || taxRate > 1) throw new Error("Invalid tax rate");
  if (discount < 0 || discount > 1) throw new Error("Invalid discount");

  const discounted = price * (1 - discount);
  const final = discounted * (1 + taxRate);

  return Math.round(final * 100) / 100;
}


// function 
export function passwordStrength(password: string): string {
  if (password.length < 8) return "weak";

  let score = 0;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*]/.test(password)) score++;

  return score <= 2 ? "medium" : "strong";
}



//function

export function normalizeUserPayload(payload: any) {
  return {
    id: Number(payload.id),
    name: payload.name.trim().replace(/\b\w/g, (c: string) => c.toUpperCase()),
    email: payload.email.toLowerCase(),
    isActive: payload.isActive ?? true,
  };
}

