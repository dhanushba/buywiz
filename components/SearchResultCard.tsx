"use client";

import { SearchResult } from "@/types";
import Image from "next/image";
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
    if (result.immersive_product_page_token) {
      const product = await extractFromImmersiveProduct(
        result.immersive_product_page_token,
        result.thumbnail
      );
      const productId = await scrapeAndStoreProduct(
        product?.productLink,
        email
      );
      if (productId) open(`products/${productId?.id}`, "_blank");
    } else if (result.productLink != "#") open(result.productLink, "_blank");
  };

  return (
    <Link
      href={result.productLink}
      className="product-card"
      onClick={handleRedirect}
    >
      <div className="product-card_img-container">
        {result.thumbnail ? (
          <Image
            src={result.thumbnail}
            alt={result.productName}
            width={200}
            height={200}
            className="product-card_img"
            unoptimized={true}
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
