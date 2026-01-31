/**
 * API request/response types
 */

import type { EntityId, ContextSpace, CompactContext, SpaceMetadata, Fact, Note, ProfileEntry, TimelineEntry } from './memory.js';

/** Standard API response wrapper */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
}

/** API error structure */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/** Pagination parameters */
export interface PaginationParams {
  limit: number;
  offset: number;
}

/** Pagination response metadata */
export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/** Paginated response wrapper */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationMeta;
}

/** Create space request */
export interface CreateSpaceRequest {
  name: string;
  description: string;
  icon?: string;
  color?: string;
  tags?: string[];
  rules?: Partial<SpaceMetadata['rules']>;
}

/** Update space request */
export interface UpdateSpaceRequest {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  tags?: string[];
  rules?: Partial<SpaceMetadata['rules']>;
  isActive?: boolean;
}

/** Add fact request */
export interface AddFactRequest {
  category: string;
  statement: string;
  confidence?: Fact['confidence'];
  tags?: string[];
  relatedFactIds?: EntityId[];
  sourceType?: Fact['source']['type'];
  sourceReference?: string;
}

/** Update fact request */
export interface UpdateFactRequest {
  category?: string;
  statement?: string;
  confidence?: Fact['confidence'];
  tags?: string[];
  relatedFactIds?: EntityId[];
}

/** Add note request */
export interface AddNoteRequest {
  content: string;
  category?: string;
  importance?: Note['importance'];
  tags?: string[];
  factCandidate?: boolean;
  sourceType?: Note['source']['type'];
  sourceReference?: string;
}

/** Update note request */
export interface UpdateNoteRequest {
  content?: string;
  category?: string;
  importance?: Note['importance'];
  tags?: string[];
  factCandidate?: boolean;
}

/** Promote note to fact request */
export interface PromoteNoteRequest {
  category: string;
  statement: string;
  confidence?: Fact['confidence'];
  tags?: string[];
}

/** Add profile entry request */
export interface AddProfileEntryRequest {
  category: string;
  key: string;
  value: string | number | boolean | string[];
  sourceType?: ProfileEntry['source']['type'];
  sourceReference?: string;
  validFrom?: string;
  validUntil?: string;
}

/** Update profile entry request */
export interface UpdateProfileEntryRequest {
  value?: string | number | boolean | string[];
  validFrom?: string;
  validUntil?: string;
}

/** Add timeline entry request */
export interface AddTimelineEntryRequest {
  eventType: TimelineEntry['eventType'];
  title: string;
  description?: string;
  relatedEntityId?: EntityId;
  relatedEntityType?: TimelineEntry['relatedEntityType'];
  metadata?: Record<string, unknown>;
  tags?: string[];
  timestamp?: string;
}

/** Query context request */
export interface QueryContextRequest {
  spaceId: EntityId;
  query?: string;
  categories?: string[];
  tags?: string[];
  includeNotes?: boolean;
  maxFacts?: number;
  maxNotes?: number;
  maxTimelineEntries?: number;
}

/** Query context response */
export interface QueryContextResponse {
  context: CompactContext;
  tokensEstimate: number;
}

/** Space list item (lightweight) */
export interface SpaceListItem {
  id: EntityId;
  name: string;
  description: string;
  icon?: string | null;
  color?: string | null;
  tags: string[];
  isActive: boolean;
  factCount: number;
  noteCount: number;
  lastUpdated: string;
}
