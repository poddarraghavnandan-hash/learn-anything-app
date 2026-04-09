/**
 * arXiv Service
 * Fetches and parses research papers from arXiv API
 * Handles paper metadata extraction and PDF processing
 */

import axios from "axios";
import * as xml2js from "xml2js";

export interface ArxivPaper {
  id: string;
  title: string;
  authors: string[];
  summary: string;
  publishedDate: Date;
  updatedDate: Date;
  categories: string[];
  citationCount?: number;
  pdfUrl: string;
  arxivUrl: string;
}

export interface ArxivSearchResult {
  papers: ArxivPaper[];
  totalResults: number;
  startIndex: number;
  itemsPerPage: number;
}

const ARXIV_API_BASE = "http://export.arxiv.org/api/query";
const ARXIV_PDF_BASE = "https://arxiv.org/pdf";

/**
 * Search arXiv for papers by query
 */
export async function searchArxiv(
  query: string,
  category?: string,
  limit: number = 10,
  offset: number = 0
): Promise<ArxivSearchResult> {
  try {
    // Build search query
    let searchQuery = query;
    if (category) {
      searchQuery += ` AND cat:${category}`;
    }

    // Add sorting by relevance and recency
    const params = {
      search_query: searchQuery,
      start: offset,
      max_results: limit,
      sortBy: "relevance",
      sortOrder: "descending",
    };

    const response = await axios.get(ARXIV_API_BASE, { params });

    // Parse XML response
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(response.data);

    // Extract papers from feed
    const entries = result.feed.entry || [];
    const papers = entries.map((entry: any) => parsePaperEntry(entry));

    // Extract metadata
    const totalResults = parseInt(result.feed["opensearch:totalResults"][0], 10);
    const itemsPerPage = parseInt(result.feed["opensearch:itemsPerPage"][0], 10);
    const startIndex = parseInt(result.feed["opensearch:startIndex"][0], 10);

    return {
      papers,
      totalResults,
      startIndex,
      itemsPerPage,
    };
  } catch (error) {
    console.error("arXiv search error:", error);
    throw new Error("Failed to search arXiv");
  }
}

/**
 * Get paper by arXiv ID
 */
export async function getPaperById(arxivId: string): Promise<ArxivPaper> {
  try {
    const params = {
      search_query: `arxiv:${arxivId}`,
      max_results: 1,
    };

    const response = await axios.get(ARXIV_API_BASE, { params });
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(response.data);

    const entry = result.feed.entry?.[0];
    if (!entry) {
      throw new Error(`Paper not found: ${arxivId}`);
    }

    return parsePaperEntry(entry);
  } catch (error) {
    console.error("Failed to get paper:", error);
    throw new Error("Failed to fetch paper from arXiv");
  }
}

/**
 * Search papers by category
 * Categories: cs.AI, cs.LG, cs.CV, math.*, physics.*, etc.
 */
export async function searchByCategory(
  category: string,
  limit: number = 10,
  offset: number = 0
): Promise<ArxivSearchResult> {
  try {
    const params = {
      search_query: `cat:${category}`,
      start: offset,
      max_results: limit,
      sortBy: "submittedDate",
      sortOrder: "descending",
    };

    const response = await axios.get(ARXIV_API_BASE, { params });
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(response.data);

    const entries = result.feed.entry || [];
    const papers = entries.map((entry: any) => parsePaperEntry(entry));

    const totalResults = parseInt(result.feed["opensearch:totalResults"][0], 10);
    const itemsPerPage = parseInt(result.feed["opensearch:itemsPerPage"][0], 10);
    const startIndex = parseInt(result.feed["opensearch:startIndex"][0], 10);

    return {
      papers,
      totalResults,
      startIndex,
      itemsPerPage,
    };
  } catch (error) {
    console.error("Category search error:", error);
    throw new Error("Failed to search by category");
  }
}

/**
 * Get trending papers (most recent + highly cited)
 */
export async function getTrendingPapers(
  limit: number = 10
): Promise<ArxivPaper[]> {
  try {
    // Search for recent papers across multiple categories
    const categories = ["cs.AI", "cs.LG", "cs.CV", "stat.ML"];
    const allPapers: ArxivPaper[] = [];

    for (const category of categories) {
      const result = await searchByCategory(category, limit / categories.length);
      allPapers.push(...result.papers);
    }

    // Sort by date and return top papers
    return allPapers
      .sort(
        (a, b) =>
          new Date(b.publishedDate).getTime() -
          new Date(a.publishedDate).getTime()
      )
      .slice(0, limit);
  } catch (error) {
    console.error("Failed to get trending papers:", error);
    throw new Error("Failed to fetch trending papers");
  }
}

/**
 * Parse a single arXiv entry from XML
 */
function parsePaperEntry(entry: any): ArxivPaper {
  // Extract arXiv ID from entry ID
  const idUrl = entry.id[0];
  const arxivId = idUrl.split("/abs/")[1];

  // Extract authors
  const authorElements = entry.author || [];
  const authors = authorElements.map((author: any) => author.name[0]);

  // Extract categories
  const categoryElements = entry.category || [];
  const categories = categoryElements.map((cat: any) => cat.$.term);

  // Extract dates
  const publishedDate = new Date(entry.published[0]);
  const updatedDate = new Date(entry.updated[0]);

  // Build PDF URL
  const pdfUrl = `${ARXIV_PDF_BASE}/${arxivId}.pdf`;
  const arxivUrl = `https://arxiv.org/abs/${arxivId}`;

  return {
    id: arxivId,
    title: entry.title[0].trim(),
    authors,
    summary: entry.summary[0].trim(),
    publishedDate,
    updatedDate,
    categories,
    pdfUrl,
    arxivUrl,
  };
}

/**
 * Extract text from arXiv paper PDF
 * Note: This requires a PDF parsing library like pdfparse
 */
export async function extractPdfText(pdfUrl: string): Promise<string> {
  try {
    // For MVP, we'll use the abstract as the main text
    // In production, integrate with pdf-parse or similar library
    console.log("PDF extraction not yet implemented. Using abstract instead.");
    return "";
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error("Failed to extract PDF text");
  }
}

/**
 * Get paper metadata for processing
 */
export async function getPaperMetadata(arxivId: string) {
  const paper = await getPaperById(arxivId);

  return {
    id: paper.id,
    title: paper.title,
    authors: paper.authors,
    abstract: paper.summary,
    categories: paper.categories,
    publishedDate: paper.publishedDate,
    pdfUrl: paper.pdfUrl,
    arxivUrl: paper.arxivUrl,
  };
}
