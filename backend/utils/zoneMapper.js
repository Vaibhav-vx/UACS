const zoneMapping = {
  // Zone 1 — Delhi NCR
  zone1: {
    name: "Zone 1 — Delhi NCR",
    keywords: [
      "delhi", "new delhi", "noida", "gurgaon",
      "gurugram", "faridabad", "ghaziabad",
      "ncr", "dwarka", "rohini", "connaught"
    ]
  },
  // Zone 2 — Mumbai
  zone2: {
    name: "Zone 2 — Mumbai",
    keywords: [
      "mumbai", "bombay", "thane", "navi mumbai",
      "panvel", "kalyan", "andheri", "bandra",
      "dadar", "kurla", "borivali", "malad"
    ]
  },
  // Zone 3 — Kolkata
  zone3: {
    name: "Zone 3 — Kolkata",
    keywords: [
      "kolkata", "calcutta", "howrah", "salt lake",
      "park street", "dum dum", "barasat"
    ]
  },
  // Zone 4 — Chennai
  zone4: {
    name: "Zone 4 — Chennai",
    keywords: [
      "chennai", "madras", "anna salai", "adyar",
      "tambaram", "chromepet", "velachery", "t.nagar"
    ]
  },
  // Zone 5 — Bangalore
  zone5: {
    name: "Zone 5 — Bangalore",
    keywords: [
      "bangalore", "bengaluru", "koramangala",
      "whitefield", "electronic city", "mg road",
      "indiranagar", "jayanagar", "hebbal"
    ]
  },
  // Zone 6 — Hyderabad
  zone6: {
    name: "Zone 6 — Hyderabad",
    keywords: [
      "hyderabad", "secunderabad", "cyberabad",
      "hitech city", "banjara hills", "jubilee hills",
      "gachibowli", "uppal", "medchal"
    ]
  },
  // Zone 7 — Pune
  zone7: {
    name: "Zone 7 — Pune",
    keywords: [
      "pune", "pimpri", "chinchwad", "hinjewadi",
      "kothrud", "hadapsar", "viman nagar",
      "shivajinagar", "deccan"
    ]
  },
  // Zone 8 — Ahmedabad
  zone8: {
    name: "Zone 8 — Ahmedabad",
    keywords: [
      "ahmedabad", "surat", "vadodara", "rajkot",
      "gandhinagar", "anand", "navsari", "bharuch"
    ]
  },
  // Zone 9 — Other / General
  zone9: {
    name: "Zone 9 — Other Regions",
    keywords: [] // default fallback
  }
};

function detectZoneFromLocation(locationString) {
  if (!locationString) return "Zone 9 — Other Regions";
  
  const loc = locationString.toLowerCase().trim();
  
  for (const [zoneKey, zoneData] of Object.entries(zoneMapping)) {
    for (const keyword of zoneData.keywords) {
      if (loc.includes(keyword)) {
        return zoneData.name;
      }
    }
  }
  
  return "Zone 9 — Other Regions"; // default
}

export { detectZoneFromLocation };
