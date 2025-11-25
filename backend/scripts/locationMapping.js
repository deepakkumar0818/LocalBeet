/**
 * Location Mapping System
 * Maps Zoho location names to LocalBeet modules
 */

/**
 * Location mapping configuration
 */
const LOCATION_MAPPING = {
  // Central Kitchen
  'TLB central kitchen': 'central-kitchen',
  'TLB Central Kitchen': 'central-kitchen',
  'TLB CENTRAL KITCHEN': 'central-kitchen',
  
  // Kuwait City
  'TLB City': 'kuwait-city',
  'TLB city': 'kuwait-city',
  'TLB CITY': 'kuwait-city',
  
  // Vibe Complex
  'TLB vibes': 'vibe-complex',
  'TLB Vibes': 'vibe-complex',
  'TLB VIBES': 'vibe-complex',
  
  // 360 Mall
  'TLB 360 RNA': 'mall-360',
  'TLB 360 rna': 'mall-360',
  'TLB 360 Rna': 'mall-360',
  '360 Mall': 'mall-360',
  '360 mall': 'mall-360',
  
  // Taiba Hospital
  'clinic': 'taiba-kitchen',
  'Clinic': 'taiba-kitchen',
  'CLINIC': 'taiba-kitchen',
  'Taiba Hospital': 'taiba-kitchen',
  'taiba hospital': 'taiba-kitchen',
  'TAIBA HOSPITAL': 'taiba-kitchen',
  'TLB Taiba': 'taiba-kitchen',
  'TLB TAIBA': 'taiba-kitchen',
  'TLB taiba': 'taiba-kitchen'
};

/**
 * Database collection mapping for each module
 */
const COLLECTION_MAPPING = {
  'central-kitchen': 'CentralKitchenRawMaterial',
  'kuwait-city': 'KuwaitCityRawMaterial', 
  'vibe-complex': 'VibeComplexRawMaterial',
  'mall-360': 'Mall360RawMaterial',
  'taiba-kitchen': 'TaibaKitchenRawMaterial'
};

/**
 * Get the module name for a given Zoho location
 * @param {string} locationName - The location name from Zoho
 * @returns {string|null} - The module name or null if not mapped
 */
function getModuleForLocation(locationName) {
  if (!locationName) return null;
  
  // Direct mapping
  const directMatch = LOCATION_MAPPING[locationName];
  if (directMatch) return directMatch;
  
  // Partial matching (case-insensitive)
  const normalizedLocation = locationName.toLowerCase().trim();
  
  for (const [zohoLocation, module] of Object.entries(LOCATION_MAPPING)) {
    const normalizedZohoLocation = zohoLocation.toLowerCase();
    
    // Check if the location contains the mapped location
    if (normalizedLocation.includes(normalizedZohoLocation) || 
        normalizedZohoLocation.includes(normalizedLocation)) {
      return module;
    }
  }
  
  return null;
}

/**
 * Get the database collection name for a module
 * @param {string} moduleName - The module name
 * @returns {string|null} - The collection name or null if not found
 */
function getCollectionForModule(moduleName) {
  return COLLECTION_MAPPING[moduleName] || null;
}

/**
 * Check if a location is mapped (should be processed)
 * @param {string} locationName - The location name from Zoho
 * @returns {boolean} - True if the location is mapped
 */
function isLocationMapped(locationName) {
  const module = getModuleForLocation(locationName);
  return module !== null;
}

/**
 * Get all available modules
 * @returns {Array<string>} - Array of module names
 */
function getAllModules() {
  return Object.values(LOCATION_MAPPING).filter((value, index, self) => self.indexOf(value) === index);
}

/**
 * Get all available locations for a module
 * @param {string} moduleName - The module name
 * @returns {Array<string>} - Array of location names that map to this module
 */
function getLocationsForModule(moduleName) {
  return Object.entries(LOCATION_MAPPING)
    .filter(([location, module]) => module === moduleName)
    .map(([location]) => location);
}

/**
 * Log location mapping information
 * @param {string} locationName - The location name from Zoho
 */
function logLocationMapping(locationName) {
  const module = getModuleForLocation(locationName);
  
  if (module) {
    console.log(`📍 Location "${locationName}" mapped to module: ${module}`);
  } else {
    console.log(`⚠️  Location "${locationName}" is not mapped to any module`);
    console.log(`   Available mappings:`, Object.keys(LOCATION_MAPPING));
  }
}

module.exports = {
  LOCATION_MAPPING,
  COLLECTION_MAPPING,
  getModuleForLocation,
  getCollectionForModule,
  isLocationMapped,
  getAllModules,
  getLocationsForModule,
  logLocationMapping
};
