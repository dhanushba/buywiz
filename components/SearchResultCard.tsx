"use client";

import { SearchResult } from "@/types";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { formatNumber } from "@/lib/utils";
import { scrapeAndStoreProduct } from "@/lib/actions";
import { extractFromImmersiveProduct } from "@/lib/serpapi";

type Props = {
  result: SearchResult;
};

// const isKnownSite = (url: string) => {
//   try {
//     const parsedURL = new URL(url);
//     const hostname = parsedURL.hostname;
//     console.log(hostname);
//     return hostname.match(/amazon|flipkart|croma|reliance/i) != null;
//   } catch (error) {
//     return false;
//   }
// };

const SearchResultCard = ({ result }: Props) => {
  const [email, setEmail] = useState("");
  useEffect(() => {
    const storedEmail = localStorage.getItem("email");
    if (storedEmail) setEmail(storedEmail);
    // Debug: log thumbnail URL
    console.log("SearchResultCard thumbnail:", result.thumbnail);
  }, [result.thumbnail]);

  const handleRedirect = async (e: any) => {
    e.preventDefault();
    console.log("📌 Clicked product:", result.productName);
    console.log("📌 Email:", email);
    console.log("📌 Product Link:", result.productLink);
    
    try {
      if (!email) {
        console.log("No email, opening external link");
        // If not logged in, just open the product link
        if (result.productLink && result.productLink !== "#") {
          window.open(result.productLink, "_blank");
        }
        return;
      }

      // Try to scrape and store the product
      console.log("🔄 Starting scrape and store...");
      const productId = await scrapeAndStoreProduct(
        result.productLink,
        email
      );
      
      console.log("✅ Product scraped:", productId);
      
      if (productId && productId.id) {
        // If successfully scraped, open our product page
        const productPageUrl = `/products/${productId.id}`;
        console.log("🎯 Opening product page:", productPageUrl);
        window.open(productPageUrl, "_blank");
      } else {
        console.log("⚠️ No product ID returned, opening external link");
        // If scraping failed, open the original link
        if (result.productLink && result.productLink !== "#") {
          window.open(result.productLink, "_blank");
        }
      }
    } catch (error) {
      console.error("❌ Error in handleRedirect:", error);
      // Fallback: open the product link directly
      if (result.productLink && result.productLink !== "#") {
        console.log("Fallback: opening external link");
        window.open(result.productLink, "_blank");
      }
    }
  };

  return (
    <Link
      href={result.productLink}
      className="product-card"
      onClick={handleRedirect}
    >
      <div className="product-card_img-container">
        {result.thumbnail ? (
          <img
            src={result.thumbnail}
            alt={result.productName}
            className="product-card_img"
            onError={() => {
              console.error("Failed to load image:", result.thumbnail);
            }}
          />
        ) : (
          <div className="product-card_img bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">No Image</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="product-title">{result.productName}</h3>

        <div className="flex justify-between">
          <p className="text-black opacity-50 text-lg capitalize">
            {result.site}
          </p>

          <p className="text-black text-lg font-semibold">
            <span>{result.currency}</span>
            <span>{formatNumber(result.currentPrice)}</span>
          </p>
        </div>
      </div>
    </Link>
  );
};

export default SearchResultCard;
