// NASA POWER data is metric. Ohio farmers work in inches and degrees
// Fahrenheit, so the page shows US units first with metric in brackets.

export function mmToInches(mm: number): number {
  return mm / 25.4
}

export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32
}

// 638 -> "25.1 in (638 mm)"
export function formatPrecipitation(mm: number): string {
  return `${mmToInches(mm).toFixed(1)} in (${Math.round(mm)} mm)`
}

// 35 -> "95 °F (35 °C)"
export function formatTemperature(celsius: number): string {
  return `${Math.round(celsiusToFahrenheit(celsius))} °F (${Math.round(celsius * 10) / 10} °C)`
}
