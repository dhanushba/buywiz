"use server";

import { SearchResult } from "@/types";
import { getJson } from "serpapi";

/**
 * Search for products with the given query and filters
 */
export async function getSearchResults(query: string, filters: string) {
  try {
    if (!process.env.SERPAPI_KEY) {
      console.error("SerpApi key not defined - check environment variables");
      throw new Error("SERPAPI_KEY not configured");
    }
    console.log("Searching for product:", query);
    const json = await getJson({
      engine: "google_shopping",
      q: query,
      shoprs: filters,
      google_domain: "google.co.in",
      gl: "in",
      hl: "en",
      location: "India",
      api_key: process.env.SERPAPI_KEY,
      device: "mobile",
      num: 100,
    });

    const results: Array<any> = json.shopping_results;
    const knownSites: SearchResult[] = [],
      unknownSites: SearchResult[] = [];

    for (const result of results) {
      //   if (result.immersive_product_page_token) {
      //     const data: SearchResult = {
      //       productName: result.title,
      //       currentPrice: result.extracted_price,
      //       currency: result.price.charAt(0),
      //       productLink: result.link || "#",
      //       thumbnail: result.thumbnail,
      //       site: result.source,
      //       immersive_product_page_token: result.immersive_product_page_token,
      //     };
      //     knownSites.push(data);
      //     continue;
      //   }

      const data: SearchResult = {
        productName: result.title,
        currentPrice: result.extracted_price,
        currency: result.price.charAt(0),
        productLink: result.link || "#",
        thumbnail: result.thumbnail,
        site: result.source,
        immersive_product_page_token: result.immersive_product_page_token,
      };

      if (isKnownSite(result.source)) knownSites.push(data);
      else unknownSites.push(data);
    }
    return { knownSites, unknownSites };
  } catch (error) {
    console.error(`Error while fetching search results: ${error}`);
  }
}

export async function extractFromImmersiveProduct(
  immersive_product_page_token: string,
  thumbnail: string
) {
  try {
    const json = await getJson({
      engine: "google_immersive_product",
      page_token: immersive_product_page_token,
      api_key: process.env.SERPAPI_KEY,
    });
    const stores =
      json.product_results.stores.filter((e: any) => isKnownSite(e.link)) || [];
    const results: SearchResult[] = [];
    for (const store of stores) {
      const result: SearchResult = {
        productName: store.title || "",
        currentPrice: store.extracted_price || 0,
        currency: store.price.charAt(0) || "₹",
        productLink: store.link || "#",
        thumbnail: thumbnail,
        site: store.name,
        immersive_product_page_token: immersive_product_page_token,
      };
      results.push(result);
    }
    return results.sort((a, b) => b.currentPrice - a.currentPrice)[0];
  } catch (error) {
    console.error(`Error while fetching immersive product results: ${error}`);
  }
}

function isKnownSite(site: string) {
  return site?.match(/amazon|flipkart|croma|reliance/i) != null || false;
}
