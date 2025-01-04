// A single library search result
export interface LibrarySearchResult {
  name: string;
  description: string;
  latest: string;
}

export interface Library {
  name?: string;
  description?: string;
  latest?: string;
}

export interface QuickPickItem {
  label: string;
  description: string;
}
