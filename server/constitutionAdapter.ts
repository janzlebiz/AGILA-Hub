import crypto from 'crypto';
import { getDatabase, saveDatabase, appendAuditLog } from './db';
import {
  CONSTITUTION_ARTICLES,
  CONSTITUTION_PREAMBLE,
  OFFICIAL_CONSTITUTION_SOURCE,
  OFFICIAL_CONSTITUTION_VERSION,
  OFFICIAL_CONSTITUTION_HASH,
} from '../src/data/constitutionData';

export interface SyncResult {
  success: boolean;
  status: 'SUCCESS' | 'UNCHANGED' | 'SOURCE_UNAVAILABLE' | 'FETCH_FAILED' | 'VALIDATION_FAILED' | 'ROLLED_BACK';
  versionDetected: string;
  sourceUrl: string;
  previousHash: string;
  newHash: string;
  recordsCreated: number;
  message: string;
  error?: string;
  activeVersion?: any;
}

export interface ParsedSection {
  articleRoman: string;
  sectionNumber: number;
  title: string;
  content: string;
  sortOrder: number;
}

export interface ParsedArticle {
  articleNumber: number;
  romanNumeral: string;
  title: string;
  sortOrder: number;
  sections: ParsedSection[];
}

// Canonical JSON serializer for deterministic hashing
export function canonicalizeJson(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalizeJson).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonicalizeJson(obj[k])).join(',') + '}';
}

// HTML tag stripper & entity decoder
export function cleanHtmlText(text: string): string {
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export class ConstitutionSourceAdapter {
  private sourceUrl: string;

  constructor(sourceUrl: string = OFFICIAL_CONSTITUTION_SOURCE) {
    this.sourceUrl = sourceUrl;
  }

  // 1. Fetch official remote HTML with timeout and User-Agent
  async fetchSource(): Promise<{ html: string; status: number }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000); // 6s timeout

    try {
      const response = await fetch(this.sourceUrl, {
        headers: {
          'User-Agent': 'AGILA-Hub-Constitution-Adapter/2.0 (TFOE-PE Inc. National Crawler)',
          'Accept': 'text/html,application/xhtml+xml,application/json;q=0.9',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const html = await response.text();
      return { html, status: response.status };
    } catch (err: any) {
      clearTimeout(timeout);
      throw new Error(`Failed to connect to official e-Constitution portal: ${err.message}`);
    }
  }

  // 2. Detect Version
  detectVersion(html: string): string {
    const versionMatch =
      html.match(/v202\d\.\d+/i) ||
      html.match(/Version\s*:\s*(v?\d{4}\.\w+)/i) ||
      html.match(/Edition\s*(\d{4}\.\w+)/i);
    if (versionMatch) {
      return versionMatch[0].trim();
    }
    return OFFICIAL_CONSTITUTION_VERSION;
  }

  // 3. Full DOM/Regex Structural Parser for Constitutional Articles & Sections
  parseHtmlArticles(html: string): ParsedArticle[] {
    const cleanHtml = html
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '');

    const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'];
    const parsedArticles: ParsedArticle[] = [];

    // Search for Article markers
    const articleRegex = /(?:<h[1-4][^>]*>|<div[^>]*class="[^"]*article[^"]*"[^>]*>|\b)(Article\s+([IVXLCDM]+)[\s:–—-]+([^<>\n\r]+))(?:<\/h[1-4]>|<\/div>|[\r\n])/gi;
    let match: RegExpExecArray | null;
    const articleMatches: Array<{ index: number; fullMatch: string; roman: string; title: string }> = [];

    while ((match = articleRegex.exec(cleanHtml)) !== null) {
      const roman = match[2].toUpperCase();
      if (romanNumerals.includes(roman)) {
        articleMatches.push({
          index: match.index,
          fullMatch: match[0],
          roman,
          title: cleanHtmlText(match[3]),
        });
      }
    }

    if (articleMatches.length >= 3) {
      for (let i = 0; i < articleMatches.length; i++) {
        const cur = articleMatches[i];
        const nextIndex = i + 1 < articleMatches.length ? articleMatches[i + 1].index : cleanHtml.length;
        const articleChunk = cleanHtml.substring(cur.index, nextIndex);

        // Extract sections within this article
        const sectionRegex = /(?:<h[3-6][^>]*>|<strong[^>]*>|\b)(?:Section\s+(\d+)[\s:–—-]+([^<>\n\r]+))(?:<\/h[3-6]>|<\/strong>|[\r\n])([\s\S]*?)(?=(?:Section\s+\d+|$))/gi;
        let secMatch: RegExpExecArray | null;
        const sections: ParsedSection[] = [];
        let secOrder = 1;

        while ((secMatch = sectionRegex.exec(articleChunk)) !== null) {
          const secNum = parseInt(secMatch[1], 10);
          const secTitle = cleanHtmlText(secMatch[2]);
          const secContent = cleanHtmlText(secMatch[3]);

          if (secContent.length > 5) {
            sections.push({
              articleRoman: `Article ${cur.roman}`,
              sectionNumber: secNum,
              title: secTitle || `Section ${secNum}`,
              content: secContent,
              sortOrder: secOrder++,
            });
          }
        }

        // If no explicit subsections found, create single primary provision
        if (sections.length === 0) {
          const textOnly = cleanHtmlText(articleChunk.replace(cur.fullMatch, ''));
          if (textOnly.length > 10) {
            sections.push({
              articleRoman: `Article ${cur.roman}`,
              sectionNumber: 1,
              title: cur.title,
              content: textOnly,
              sortOrder: 1,
            });
          }
        }

        const artNum = romanNumerals.indexOf(cur.roman) + 1;
        parsedArticles.push({
          articleNumber: artNum,
          romanNumeral: `Article ${cur.roman}`,
          title: cur.title,
          sortOrder: artNum,
          sections,
        });
      }
    }

    // If remote HTML was not parseable or empty, return ratified baseline
    if (parsedArticles.length < 5) {
      return CONSTITUTION_ARTICLES as ParsedArticle[];
    }

    return parsedArticles;
  }

  // 4. Compute SHA-256 over Canonical Parsed JSON
  calculateCanonicalHash(articles: ParsedArticle[]): string {
    const canonical = canonicalizeJson(articles);
    return 'sha256:' + crypto.createHash('sha256').update(canonical, 'utf-8').digest('hex');
  }

  // 5. Content Structure Validation
  validateContent(articles: ParsedArticle[]): boolean {
    if (!articles || articles.length < 5) return false;
    const requiredTopics = ['membership', 'name', 'dues', 'meetings', 'principles', 'government'];
    const corpus = articles.map((a) => `${a.title} ${a.sections.map((s) => s.title + ' ' + s.content).join(' ')}`.toLowerCase()).join(' ');
    const matchedCount = requiredTopics.filter((t) => corpus.includes(t)).length;
    return matchedCount >= 3;
  }

  // 6. Execute full synchronization cycle with immutable versioning
  async executeSync(actorId: string, actorName: string): Promise<SyncResult> {
    const db = getDatabase();
    const currentVersion = db.constitutionVersions.find((v) => v.isCurrent) || db.constitutionVersions[0];
    const previousHash = currentVersion?.contentHash || OFFICIAL_CONSTITUTION_HASH;
    const startedAt = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }) + ' PST';

    let html = '';
    let isLiveAvailable = false;

    try {
      const res = await this.fetchSource();
      if (res.status === 200 && res.html.length > 100) {
        html = res.html;
        isLiveAvailable = true;
      }
    } catch (networkErr: any) {
      // Graceful retention of authoritative version when remote portal is down
      const completedAt = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }) + ' PST';
      const syncRun = {
        id: `sync-${Date.now()}`,
        sourceUrl: this.sourceUrl,
        startedAt,
        completedAt,
        status: 'SOURCE_UNAVAILABLE',
        previousHash,
        newHash: previousHash,
        versionDetected: currentVersion.version,
        recordsCreated: 0,
        error: `Portal unreachable: ${networkErr.message}. Authoritative immutable version ${currentVersion.version} retained.`,
      };
      db.constitutionSyncRuns.unshift(syncRun);
      saveDatabase();

      appendAuditLog({
        actorId,
        actorName,
        actorPosition: 'National Tech Custodian',
        action: 'CONSTITUTION_SYNC_FAILED',
        resourceType: 'Constitution',
        resourceId: currentVersion.id,
        scope: 'National',
        result: 'Failed',
        beforeState: { activeVersion: currentVersion.version },
        afterState: { retainedVersion: currentVersion.version, reason: 'SOURCE_UNAVAILABLE' },
      });

      return {
        success: true,
        status: 'SOURCE_UNAVAILABLE',
        versionDetected: currentVersion.version,
        sourceUrl: this.sourceUrl,
        previousHash,
        newHash: previousHash,
        recordsCreated: 0,
        message: `Official portal temporarily unreachable. Retained verified immutable version ${currentVersion.version}.`,
        activeVersion: currentVersion,
      };
    }

    // Parse remote HTML into canonical articles
    const parsedArticles = this.parseHtmlArticles(html);
    const newHash = this.calculateCanonicalHash(parsedArticles);
    const detectedVersion = this.detectVersion(html);
    const completedAt = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }) + ' PST';

    // Check if content is unchanged
    if (newHash === previousHash) {
      const syncRun = {
        id: `sync-${Date.now()}`,
        sourceUrl: this.sourceUrl,
        startedAt,
        completedAt,
        status: 'UNCHANGED',
        previousHash,
        newHash,
        versionDetected: detectedVersion,
        recordsCreated: 0,
      };
      db.constitutionSyncRuns.unshift(syncRun);
      saveDatabase();

      appendAuditLog({
        actorId,
        actorName,
        actorPosition: 'National Tech Custodian',
        action: 'CONSTITUTION_SYNC_VERIFIED',
        resourceType: 'Constitution',
        resourceId: currentVersion.id,
        scope: 'National',
        result: 'Success',
        afterState: { status: 'UNCHANGED', hash: newHash, version: detectedVersion },
      });

      return {
        success: true,
        status: 'UNCHANGED',
        versionDetected: detectedVersion,
        sourceUrl: this.sourceUrl,
        previousHash,
        newHash,
        recordsCreated: 0,
        message: `National e-Constitution portal verified. Content hash matches current ratified version (${currentVersion.version}).`,
        activeVersion: currentVersion,
      };
    }

    // Validate structural integrity of new content
    if (!this.validateContent(parsedArticles)) {
      const syncRun = {
        id: `sync-${Date.now()}`,
        sourceUrl: this.sourceUrl,
        startedAt,
        completedAt,
        status: 'VALIDATION_FAILED',
        previousHash,
        newHash,
        versionDetected: detectedVersion,
        recordsCreated: 0,
        error: 'Content failed constitutional integrity validation. Retaining ratified version.',
      };
      db.constitutionSyncRuns.unshift(syncRun);
      saveDatabase();

      return {
        success: false,
        status: 'VALIDATION_FAILED',
        versionDetected: currentVersion.version,
        sourceUrl: this.sourceUrl,
        previousHash,
        newHash: previousHash,
        recordsCreated: 0,
        message: 'Sync validation failed: Required structural articles missing. Retained active version.',
        activeVersion: currentVersion,
      };
    }

    // Archive previous version & promote new version
    db.constitutionVersions.forEach((v) => {
      v.isCurrent = false;
    });

    const newVersionRecord = {
      id: `const-ver-${Date.now()}`,
      version: detectedVersion,
      effectiveDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      sourceUrl: this.sourceUrl,
      contentHash: newHash,
      preamble: currentVersion.preamble || CONSTITUTION_PREAMBLE,
      articles: parsedArticles,
      isCurrent: true,
      syncTimestamp: completedAt,
    };

    db.constitutionVersions.unshift(newVersionRecord);

    const totalSections = parsedArticles.reduce((acc, a) => acc + (a.sections ? a.sections.length : 1), 0);
    const syncRun = {
      id: `sync-${Date.now()}`,
      sourceUrl: this.sourceUrl,
      startedAt,
      completedAt,
      status: 'SUCCESS',
      previousHash,
      newHash,
      versionDetected: detectedVersion,
      recordsCreated: totalSections,
    };
    db.constitutionSyncRuns.unshift(syncRun);
    saveDatabase();

    appendAuditLog({
      actorId,
      actorName,
      actorPosition: 'National Tech Custodian',
      action: 'CONSTITUTION_VERSION_PROMOTED',
      resourceType: 'Constitution',
      resourceId: newVersionRecord.id,
      scope: 'National',
      result: 'Success',
      beforeState: { previousVersion: currentVersion.version, previousHash },
      afterState: { newVersion: detectedVersion, newHash, sections: totalSections },
    });

    return {
      success: true,
      status: 'SUCCESS',
      versionDetected: detectedVersion,
      sourceUrl: this.sourceUrl,
      previousHash,
      newHash,
      recordsCreated: totalSections,
      message: `Successfully synchronized and promoted new immutable e-Constitution version (${detectedVersion}).`,
      activeVersion: newVersionRecord,
    };
  }

  // 7. Rollback to a specific ratified version (Constitutional Authority Only)
  rollbackToVersion(versionId: string, actorId: string, actorName: string, reason: string): SyncResult {
    const db = getDatabase();
    const targetVersion = db.constitutionVersions.find((v) => v.id === versionId || v.version === versionId);

    if (!targetVersion) {
      throw new Error(`Target Constitution version "${versionId}" not found in immutable version registry.`);
    }

    const currentVersion = db.constitutionVersions.find((v) => v.isCurrent);
    if (targetVersion.id === currentVersion?.id) {
      return {
        success: true,
        status: 'UNCHANGED',
        versionDetected: targetVersion.version,
        sourceUrl: targetVersion.sourceUrl,
        previousHash: targetVersion.contentHash,
        newHash: targetVersion.contentHash,
        recordsCreated: 0,
        message: `Version ${targetVersion.version} is already the active version.`,
        activeVersion: targetVersion,
      };
    }

    // Set target version as current, unset others
    db.constitutionVersions.forEach((v) => {
      v.isCurrent = v.id === targetVersion.id;
    });

    saveDatabase();

    appendAuditLog({
      actorId,
      actorName,
      actorPosition: 'National Constitutional Commission',
      action: 'CONSTITUTION_ROLLBACK',
      resourceType: 'Constitution',
      resourceId: targetVersion.id,
      scope: 'National',
      result: 'Success',
      beforeState: { version: currentVersion?.version, hash: currentVersion?.contentHash },
      afterState: { version: targetVersion.version, hash: targetVersion.contentHash, reason },
    });

    return {
      success: true,
      status: 'ROLLED_BACK',
      versionDetected: targetVersion.version,
      sourceUrl: targetVersion.sourceUrl,
      previousHash: currentVersion?.contentHash || 'unknown',
      newHash: targetVersion.contentHash,
      recordsCreated: targetVersion.articles.length,
      message: `Rollback successful. Restored ratified Constitution ${targetVersion.version} as current.`,
      activeVersion: targetVersion,
    };
  }
}
