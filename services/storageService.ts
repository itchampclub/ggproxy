
import { LinkMapping } from '../types';

const STORAGE_KEY = 'linkMappings';

export const getAllLinkMappingsFromLocalStorage = (): LinkMapping[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      const mappings: LinkMapping[] = JSON.parse(data);
      // Sort by newest first
      return mappings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error("Error parsing link mappings from local storage:", error);
      return [];
    }
  }
  return [];
};

export const saveLinkMappingToLocalStorage = (newMapping: LinkMapping): void => {
  const mappings = getAllLinkMappingsFromLocalStorage();
  // Prevent duplicates by shortCode or originalUrl if desired, though App.tsx handles originalUrl check
  const existingByShortCode = mappings.find(m => m.shortCode === newMapping.shortCode);
  if (existingByShortCode) {
    console.warn(`Attempted to save a duplicate shortCode: ${newMapping.shortCode}. This shouldn't happen if generation is correct.`);
    return; // Or throw an error
  }
  
  const updatedMappings = [newMapping, ...mappings]; // Add new mapping to the beginning
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMappings));
};

export const getLinkMappingFromLocalStorage = (shortCode: string): LinkMapping | null => {
  const mappings = getAllLinkMappingsFromLocalStorage();
  return mappings.find(m => m.shortCode === shortCode) || null;
};

// Optional: Function to remove a specific link mapping
export const removeLinkMappingFromLocalStorage = (shortCode: string): void => {
  let mappings = getAllLinkMappingsFromLocalStorage();
  mappings = mappings.filter(m => m.shortCode !== shortCode);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings));
};
