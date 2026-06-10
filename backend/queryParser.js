/**
 * Smart Search by Situation: Dictionary-Driven Keyword Parser for StudentMap
 * Parses natural language input from students into database tags and price filters.
 */
function parseStudentQuery(userInput) {
    if (!userInput || typeof userInput !== 'string') {
        return { tags: [], maxPriceTier: null };
    }

    const text = userInput.toLowerCase();
    const extractedTags = [];
    let priceTier = null;

    // Quiet (Tenang/Kondusif untuk belajar)
    if (
        text.includes("tenang") || 
        text.includes("sepi") || 
        text.includes("tugas") || 
        text.includes("ambis") || 
        text.includes("kondusif") || 
        text.includes("fokus") || 
        text.includes("sunyi") ||
        text.includes("belajar")
    ) {
        extractedTags.push("Quiet");
    }

    // Many charging ports (Banyak stopkontak/colokan)
    if (
        text.includes("colokan") || 
        text.includes("stopkontak") || 
        text.includes("cas") || 
        text.includes("charger") || 
        text.includes("baterai") || 
        text.includes("charge")
    ) {
        extractedTags.push("Many charging ports");
    }

    // Good Wi-Fi (Wi-Fi kencang/lancar)
    if (
        text.includes("wifi") || 
        text.includes("wi-fi") || 
        text.includes("internet") || 
        text.includes("kencang") || 
        text.includes("cepat") || 
        text.includes("lancar") || 
        text.includes("hotspot")
    ) {
        extractedTags.push("Good Wi-Fi");
    }

    // 24 hours (Buka sampai malam/24 jam)
    if (
        text.includes("malam") || 
        text.includes("larut") || 
        text.includes("24 jam") || 
        text.includes("24jam") || 
        text.includes("subuh") || 
        text.includes("begadang") || 
        text.includes("overnight") ||
        text.includes("24h")
    ) {
        extractedTags.push("24 hours");
    }

    // Printer nearby (Dekat dengan tempat print/fotokopi)
    if (
        text.includes("print") || 
        text.includes("fotokopi") || 
        text.includes("cetak") || 
        text.includes("fotocopy") || 
        text.includes("printing") ||
        text.includes("jilid")
    ) {
        extractedTags.push("Printer nearby");
    }

    // Pricing filters:
    // Tier 1: Very affordable (e.g. < Rp 20k) -> "murah", "murmer", "hemat", "30k", "20k", "kantong mahasiswa", "kos"
    // Tier 2: Affordable (e.g. Rp 20k - Rp 40k) -> "menengah", "standar", "biasa"
    // Tier 3: Mid-High (e.g. Rp 40k - Rp 80k) -> "cafe hits", "aesthetic", "estetik"
    // Tier 4: Expensive (e.g. > Rp 80k)
    if (
        text.includes("murah") || 
        text.includes("murmer") || 
        text.includes("hemat") || 
        text.includes("30k") || 
        text.includes("20k") || 
        text.includes("kantong mahasiswa") || 
        text.includes("anak kos") ||
        text.includes("anak kost") ||
        text.includes("terjangkau")
    ) {
        priceTier = 1; 
    } else if (
        text.includes("aesthetic") || 
        text.includes("estetik") || 
        text.includes("mewah") || 
        text.includes("mahal") || 
        text.includes("premium")
    ) {
        priceTier = 3; // or null, but let's say they want a tier 3 or 4 spot
    }

    return { tags: extractedTags, maxPriceTier: priceTier };
}

module.exports = { parseStudentQuery };
