
export async function isChromium() {
    if (navigator.userAgentData) {
      const brands = await navigator.userAgentData.getHighEntropyValues(["brands"])
      return brands.brands.some(brand => /Chromium|Google Chrome|Microsoft Edge|Opera|Brave/i.test(brand.brand))
    }
    return false
  }
  